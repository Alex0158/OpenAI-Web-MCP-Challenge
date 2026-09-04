import assert from "node:assert/strict";
import { chmod, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createHash, generateKeyPairSync, randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { createServer as createNetServer } from "node:net";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test, { after, before } from "node:test";

import { createReentry } from "../../host-sdk/src/server.mjs";
import { LocalConnectorCredentialStore } from "../src/credentials.mjs";

const enabled = process.env.CLOUD_RECEIVER_V2_E2E === "1";
const testOptions = enabled
  ? { concurrency: false, timeout: 120_000 }
  : { skip: "Set CLOUD_RECEIVER_V2_E2E=1 with the exact Cloud v2 checkout and disposable PostgreSQL" };

const HOST_BROWSER_ORIGIN = "http://localhost:3000";
const REQUEST_TIMEOUT_MS = 5_000;

let harness;

before(async () => {
  if (enabled) harness = await createHarness();
});

after(async () => {
  await harness?.close();
});

test(
  "CONNECTOR-V2-E2E-001 crosses Host SDK, real Connector processes, effect authority, acknowledgement, and restart replay",
  testOptions,
  async () => {
    const suffix = harness.suffix;
    const keys = generateKeyPairSync("ed25519");
    const hostOrigin = `https://e2e-host-${suffix}.example`;
    const keyId = `e2e-key-${suffix}`;
    const canonicalUrl = `${hostOrigin}/workflows/${suffix}`;
    const instruction = "Review the bounded test workflow and prepare its next safe step.";
    let idSequence = 0;
    const reentry = createReentry({
      origin: hostOrigin,
      privateKey: keys.privateKey,
      keyId,
      receiverOrigin: harness.receiver.origin,
      organizationApiKey: harness.organizationApiKey,
      requestTimeoutMs: REQUEST_TIMEOUT_MS,
      createId: (prefix) => `${prefix}-${suffix}-${++idSequence}`,
    });

    const request = await reentry.request({
      subject: `subject-${suffix}`,
      prompt: instruction,
      url: canonicalUrl,
    });
    const consentToken = new URL(request.consentUrl).searchParams.get("token");
    assert.match(consentToken ?? "", /^[A-Za-z0-9_-]{43}$/);

    const decision = await sendJson(harness.receiver.origin, "/v0.1/account-consent-decisions", {
      headers: {
        Cookie: harness.userCookie,
        Origin: harness.receiver.origin,
      },
      body: {
        consent_token: consentToken,
        action: "approve",
        connector_id: harness.connectorId,
      },
    });
    assert.equal(decision.status, 200, JSON.stringify(decision.body));
    assert.equal(decision.body.status, "approved");

    const continuation = await reentry.confirm(JSON.parse(JSON.stringify(request.handle)));
    assert.ok(continuation.binding);
    assert.equal(continuation.binding.status, "active");
    assert.equal(continuation.binding.workflow_id, request.handle.workflow.id);

    const acceptance = await reentry.trigger(continuation);
    const eventId = acceptance.event_id;
    assert.deepEqual(acceptance, {
      type: "webmcp.continuation_acceptance",
      protocol_version: "0.1",
      event_id: eventId,
      correlation_id: continuation.binding.correlation_id,
      accepted: true,
      duplicate: false,
      status: "accepted",
    });

    const claimToken = randomBytes(32).toString("base64url");
    const activation = await runWorker(harness.connectorWorker, {
      credential_file: harness.credentialFile,
      claim_token: claimToken,
    });
    assert.equal(activation.exitCode, 0, activation.stderr);
    assert.deepEqual(activation.events.at(-1), {
      event: "connector_e2e_claim_result",
      status: "activation_result",
      delivery_id: activation.events.at(-1)?.delivery_id,
      event_id: eventId,
      outcome: "accepted",
      code: "activation_dispatch_accepted",
      instruction,
    });
    assert.equal(typeof activation.events.at(-1)?.delivery_id, "string");
    assertSecretAbsent(activation.stdout, [harness.connectorToken, claimToken]);
    assertSecretAbsent(activation.stderr, [harness.connectorToken, claimToken]);

    const leased = await readDelivery(harness, eventId);
    assert.equal(leased.status, "leased");
    assert.equal(leased.currentAttempt, 1);
    assert.equal(leased.currentConnectorId, harness.connectorId);
    assert.equal(leased.acknowledgedAt, null);

    const effectToken = `effect-${suffix}-${randomBytes(24).toString("base64url")}`;
    const effectTokenDigest = createHash("sha256").update(effectToken, "utf8").digest("hex");
    const effectId = `effect-${effectTokenDigest.slice(0, 32)}`;
    await writeFile(harness.effectFile, `${JSON.stringify({
      effect_token_digest: effectTokenDigest,
      effect_id: effectId,
      delivery_id: leased.deliveryId,
      event_id: eventId,
      correlation_id: continuation.binding.correlation_id,
      workflow_id: continuation.binding.workflow_id,
      canonical_url: canonicalUrl,
      human_boundary: "explicit_receiver_consent",
      outcome: "effect_applied_awaiting_human",
      confirmed_at: new Date().toISOString(),
    })}\n`, { encoding: "utf8", mode: 0o600 });

    const acknowledged = await runWorker(harness.ackWorker, {
      credential_file: harness.credentialFile,
      delivery_id: leased.deliveryId,
      lease_token: claimToken,
      effect_token: effectToken,
    });
    assert.equal(acknowledged.exitCode, 0, acknowledged.stderr);
    assert.deepEqual(acknowledged.events.at(-1), {
      event: "connector_e2e_ack_result",
      delivery_id: leased.deliveryId,
      duplicate: false,
      status: "acknowledged",
    });
    assertSecretAbsent(acknowledged.stdout, [harness.connectorToken, claimToken, effectToken]);
    assertSecretAbsent(acknowledged.stderr, [harness.connectorToken, claimToken, effectToken]);

    const committed = await readDelivery(harness, eventId);
    assert.equal(committed.status, "acknowledged");
    assert.equal(committed.effectId, effectId);
    assert.ok(committed.acknowledgedAt);
    assert.ok(committed.effectAttestationJson.includes(effectId));
    assertSecretAbsent(committed.effectAttestationJson, [
      harness.connectorToken,
      claimToken,
      effectToken,
    ]);

    const eventHistory = await sendJson(
      harness.receiver.origin,
      `/api/organizations/${encodeURIComponent(harness.organizationId)}/events`,
      {
        method: "GET",
        headers: { Cookie: harness.developerCookie },
      },
    );
    assert.equal(eventHistory.status, 200, JSON.stringify(eventHistory.body));
    assert.deepEqual(eventHistory.body.data.events[0], {
      event_id: eventId,
      event_type: "workflow.ready",
      issuer_origin: hostOrigin,
      workflow_id: continuation.binding.workflow_id,
      received_at: eventHistory.body.data.events[0].received_at,
      delivery_state: "acknowledged",
      delivery_attempt: 1,
      acknowledged_at: eventHistory.body.data.events[0].acknowledged_at,
      terminal_reason: null,
    });
    assert.match(eventHistory.body.data.events[0].received_at, /^\d{4}-\d{2}-\d{2}T/);
    assert.match(eventHistory.body.data.events[0].acknowledged_at, /^\d{4}-\d{2}-\d{2}T/);
    assertSecretAbsent(JSON.stringify(eventHistory.body), [
      harness.organizationApiKey,
      harness.connectorToken,
      claimToken,
      effectToken,
    ]);

    const acknowledgedAt = committed.acknowledgedAt;
    const effectAttestationJson = committed.effectAttestationJson;
    await harness.restartReceiver();

    const replay = await runWorker(harness.ackWorker, {
      credential_file: harness.credentialFile,
      delivery_id: leased.deliveryId,
      lease_token: claimToken,
      effect_token: effectToken,
    });
    assert.equal(replay.exitCode, 0, replay.stderr);
    assert.deepEqual(replay.events.at(-1), {
      event: "connector_e2e_ack_result",
      delivery_id: leased.deliveryId,
      duplicate: true,
      status: "acknowledged",
    });
    assertSecretAbsent(replay.stdout, [harness.connectorToken, claimToken, effectToken]);
    assertSecretAbsent(replay.stderr, [harness.connectorToken, claimToken, effectToken]);

    const replayed = await readDelivery(harness, eventId);
    assert.equal(replayed.status, "acknowledged");
    assert.equal(replayed.effectId, effectId);
    assert.equal(replayed.acknowledgedAt.toISOString(), acknowledgedAt.toISOString());
    assert.equal(replayed.effectAttestationJson, effectAttestationJson);

    const idle = await runWorker(harness.connectorWorker, {
      credential_file: harness.credentialFile,
      claim_token: randomBytes(32).toString("base64url"),
    });
    assert.equal(idle.exitCode, 0, idle.stderr);
    assert.deepEqual(idle.events.at(-1), {
      event: "connector_e2e_claim_result",
      status: "idle",
    });
    assertSecretAbsent(idle.stdout, [harness.connectorToken]);

    const durable = await readDurableDelivery(harness, eventId);
    assertSecretAbsent(durable, [harness.connectorToken, claimToken, effectToken]);
    const effectFile = await readFile(harness.effectFile, "utf8");
    assert.equal(effectFile.includes(effectId), true);
    assertSecretAbsent(effectFile, [harness.connectorToken, claimToken, effectToken]);
    const credentialMode = (await stat(harness.credentialFile)).mode & 0o777;
    assert.equal(credentialMode, 0o600);
    assert.equal((await readFile(harness.credentialFile, "utf8")).includes(harness.connectorToken), true);
    assertSecretAbsent(harness.receiverTranscript(), [
      harness.connectorToken,
      claimToken,
      effectToken,
    ]);
  },
);

async function createHarness() {
  const receiverRoot = process.env.CLOUD_RECEIVER_V2_ROOT
    ?? fileURLToPath(new URL("../../../saas-boilerplate/", import.meta.url));
  const receiverDirectory = await mkdtemp(path.join(tmpdir(), "reentry-v2-e2e-"));
  const port = await findFreePort();
  const state = {
    receiverRoot,
    receiverDirectory,
    port,
    receivers: [],
    receiver: null,
    organizationId: null,
    effectFile: path.join(receiverDirectory, "host-effect.json"),
    userEmail: `connector-e2e-user-${Date.now()}-${randomBytes(3).toString("hex")}@example.com`,
    developerEmail: `connector-e2e-developer-${Date.now()}-${randomBytes(3).toString("hex")}@example.com`,
  };

  const modules = loadCloudModules(receiverRoot);
  state.prisma = modules.prisma;
  state.clearTestAccounts = modules.clearTestAccounts;
  state.digestSecret = modules.digestSecret;

  try {
    state.receiver = await startReceiver(state);
    const password = "correct horse battery staple";
    const user = await sendJson(state.receiver.origin, "/v1/auth/users/register", {
      body: { email: state.userEmail, password },
    });
    assert.equal(user.status, 201);
    state.userCookie = readSessionCookie(user.response);

    const developer = await sendJson(state.receiver.origin, "/v1/auth/developers/register", {
      body: { email: state.developerEmail, password },
    });
    assert.equal(developer.status, 201);
    state.developerCookie = readSessionCookie(developer.response);
    const organization = await sendJson(state.receiver.origin, "/api/organizations", {
      headers: { Cookie: state.developerCookie, Origin: HOST_BROWSER_ORIGIN },
      body: { name: `Connector E2E ${state.userEmail}` },
    });
    assert.equal(organization.status, 201);
    state.organizationId = organization.body.data.organization.organization_id;
    state.organizationApiKey = organization.body.data.api_key.api_key;
    assert.match(state.organizationApiKey, /^[A-Za-z0-9_-]{43}$/);
    const listedKeys = await sendJson(
      state.receiver.origin,
      `/api/organizations/${encodeURIComponent(state.organizationId)}/api-keys`,
      {
        method: "GET",
        headers: { Cookie: state.developerCookie },
      },
    );
    assert.equal(listedKeys.status, 200, JSON.stringify(listedKeys.body));
    assert.equal(listedKeys.body.data.api_keys.length, 1);
    assert.equal(Object.hasOwn(listedKeys.body.data.api_keys[0], "api_key"), false);
    assert.equal(JSON.stringify(listedKeys.body).includes(state.organizationApiKey), false);

    const pairing = await sendJson(state.receiver.origin, "/v0.1/account/pairing-sessions", {
      headers: { Cookie: state.userCookie, Origin: HOST_BROWSER_ORIGIN },
      body: {},
    });
    assert.equal(pairing.status, 201);
    const claimed = await sendJson(state.receiver.origin, "/v0.1/account/pairing-sessions/claim", {
      headers: { "x-vercel-forwarded-for": "198.51.100.43" },
      body: {
        pairing_id: pairing.body.pairing_id,
        pairing_code: pairing.body.pairing_code,
        device_name: "Connector E2E Worker",
      },
    });
    assert.equal(claimed.status, 200);
    state.connectorId = claimed.body.connector_id;
    state.connectorToken = claimed.body.connector_token;
    state.credentialFile = path.join(state.receiverDirectory, "credentials.json");
    await new LocalConnectorCredentialStore({ filename: state.credentialFile }).save({
      version: 1,
      receiver_origin: state.receiver.origin,
      connector_id: state.connectorId,
      connector_token: state.connectorToken,
      connector_expires_at: claimed.body.connector_expires_at,
    });
    state.connectorWorker = fileURLToPath(new URL("./cloud-receiver-v2-e2e-connector-worker.mjs", import.meta.url));
    state.ackWorker = fileURLToPath(new URL("./cloud-receiver-v2-e2e-ack-worker.mjs", import.meta.url));
    state.suffix = `${Date.now()}-${randomBytes(3).toString("hex")}`;
    state.restartReceiver = async () => {
      await stopReceiver(state.receiver);
      state.receiver = await startReceiver(state);
    };
    state.receiverTranscript = () => state.receivers
      .map((receiver) => `${receiver.stdout}\n${receiver.stderr}`)
      .join("\n");
    state.close = async () => {
      await stopReceiver(state.receiver);
      if (state.organizationId) {
        await state.prisma.organization.deleteMany({ where: { id: state.organizationId } });
      }
      await state.clearTestAccounts(state.userEmail);
      await state.clearTestAccounts(state.developerEmail);
      await state.prisma.$disconnect();
      await rm(state.receiverDirectory, { recursive: true, force: true });
    };
    return state;
  } catch (error) {
    await stopReceiver(state.receiver);
    if (state.organizationId) {
      await state.prisma.organization.deleteMany({ where: { id: state.organizationId } }).catch(() => {});
    }
    await state.clearTestAccounts(state.userEmail).catch(() => {});
    await state.clearTestAccounts(state.developerEmail).catch(() => {});
    await state.prisma.$disconnect().catch(() => {});
    await rm(state.receiverDirectory, { recursive: true, force: true });
    throw error;
  }
}

function loadCloudModules(receiverRoot) {
  const backendRoot = path.join(receiverRoot, "backend");
  const require = createRequire(import.meta.url);
  process.env.TS_NODE_PROJECT = path.join(backendRoot, "tsconfig.json");
  require(path.join(receiverRoot, "node_modules/ts-node/register/transpile-only.js"));
  return {
    prisma: require(path.join(backendRoot, "src/db/index.ts")).prisma,
    clearTestAccounts: require(path.join(backendRoot, "src/test/helper.ts")).clearTestAccounts,
  };
}

async function startReceiver(state) {
  const entrypoint = fileURLToPath(new URL("./cloud-receiver-v2-e2e-server.mjs", import.meta.url));
  const transcript = { stdout: "", stderr: "" };
  const child = spawn(process.execPath, [entrypoint], {
    cwd: path.join(state.receiverRoot, "backend"),
    env: {
      ...process.env,
      CLOUD_RECEIVER_V2_ROOT: state.receiverRoot,
      NODE_ENV: "test",
      PORT: String(state.port),
      FRONTEND_URL: HOST_BROWSER_ORIGIN,
      CLOUD_RECEIVER_RUNTIME_DATABASE_URL: "",
      DIRECT_URL: "",
      RECEIVER_PUBLIC_URL: "",
      CLOUD_RECEIVER_V2_E2E_EFFECT_FILE: state.effectFile,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (chunk) => {
    transcript.stdout = boundedAppend(transcript.stdout, chunk.toString());
  });
  child.stderr?.on("data", (chunk) => {
    transcript.stderr = boundedAppend(transcript.stderr, chunk.toString());
  });
  const ready = await waitForReady(child);
  const receiver = {
    child,
    origin: ready.origin,
    transcript,
    get stdout() { return transcript.stdout; },
    get stderr() { return transcript.stderr; },
  };
  state.receivers.push(receiver);
  return receiver;
}

async function waitForReady(child) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    let settled = false;
    const timer = setTimeout(() => finish(new Error("E2E Receiver did not become ready within 15 seconds")), 15_000);
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.stdout?.off("data", onData);
      child.off("error", onError);
      child.off("exit", onExit);
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        try {
          const value = JSON.parse(line);
          if (value?.event === "receiver_ready" && typeof value.origin === "string") {
            finish(null, value);
            return;
          }
        } catch {
          // Startup diagnostics are handled by the bounded transcript.
        }
      }
    };
    const onError = () => finish(new Error("E2E Receiver process could not start"));
    const onExit = (code) => finish(new Error(`E2E Receiver exited before readiness (${code ?? "unknown"})`));
    child.stdout?.on("data", onData);
    child.once("error", onError);
    child.once("exit", onExit);
  });
}

async function stopReceiver(receiver) {
  if (!receiver?.child || receiver.child.exitCode !== null) return;
  await new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      receiver.child.kill("SIGKILL");
      finish(new Error("E2E Receiver did not stop after SIGTERM"));
    }, 10_000);
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    };
    receiver.child.once("error", finish);
    receiver.child.once("exit", () => finish());
    receiver.child.kill("SIGTERM");
  });
}

async function runWorker(entrypoint, input) {
  const child = spawn(process.execPath, [entrypoint], {
    cwd: path.dirname(entrypoint),
    stdio: ["pipe", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout?.on("data", (chunk) => { stdout = boundedAppend(stdout, chunk.toString()); });
  child.stderr?.on("data", (chunk) => { stderr = boundedAppend(stderr, chunk.toString()); });
  child.stdin.end(`${JSON.stringify(input)}\n`);
  const exitCode = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("E2E Connector worker timed out"));
    }, 30_000);
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      resolve(code ?? -1);
    });
  });
  const events = stdout
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  return { exitCode, stdout, stderr, events };
}

async function sendJson(origin, route, options = {}) {
  const headers = {
    Accept: "application/json",
    ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
    ...(options.headers ?? {}),
  };
  const response = await fetch(`${origin}${route}`, {
    method: options.method ?? "POST",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
    credentials: "omit",
    redirect: "error",
  });
  const text = await response.text();
  return {
    response,
    status: response.status,
    text,
    body: text.length === 0 ? null : JSON.parse(text),
  };
}

function readSessionCookie(response) {
  const values = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [response.headers.get("set-cookie")].filter(Boolean);
  const cookie = values.map((value) => value.split(";", 1)[0]).join("; ");
  assert.notEqual(cookie, "");
  return cookie;
}

async function readDelivery(state, eventId) {
  const row = await state.prisma.delivery.findUnique({
    where: { eventId },
    select: {
      deliveryId: true,
      status: true,
      currentAttempt: true,
      currentConnectorId: true,
      currentClaimTokenDigest: true,
      currentLeaseTokenDigest: true,
      effectId: true,
      effectAttestationJson: true,
      acknowledgedAt: true,
      terminalReason: true,
    },
  });
  assert.ok(row, `delivery for ${eventId} was not persisted`);
  return row;
}

async function readDurableDelivery(state, eventId) {
  const delivery = await readDelivery(state, eventId);
  const attempts = await state.prisma.deliveryAttempt.findMany({
    where: { deliveryId: delivery.deliveryId },
    select: {
      attemptId: true,
      deliveryId: true,
      connectorId: true,
      attempt: true,
      claimTokenDigest: true,
      leaseTokenDigest: true,
      leaseStartedAt: true,
      leaseExpiresAt: true,
    },
  });
  return JSON.stringify({ delivery, attempts });
}

function assertSecretAbsent(value, secrets) {
  for (const secret of secrets) {
    assert.equal(typeof secret, "string");
    assert.equal(value.includes(secret), false, `raw secret appeared in durable/output evidence`);
  }
}

function boundedAppend(current, addition) {
  const next = `${current}${addition}`;
  return next.length <= 64 * 1_024 ? next : next.slice(0, 64 * 1_024);
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = createNetServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address !== null ? address.port : null;
      server.close((error) => {
        if (error) reject(error);
        else if (!port) reject(new Error("No disposable E2E port was allocated"));
        else resolve(port);
      });
    });
  });
}
