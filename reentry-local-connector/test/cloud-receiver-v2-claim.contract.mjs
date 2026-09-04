import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { randomBytes, randomUUID } from "node:crypto";
import path from "node:path";
import test, { after, before } from "node:test";

import { LocalConnectorClient } from "../../reentry-core/src/local-connector-client.mjs";
import { canonicalJson } from "../../reentry-core/src/protocol.mjs";

// This is an opt-in cross-repository compatibility suite. It uses the actual
// v2 Express handler and disposable PostgreSQL state; the normal Connector
// package suite remains runnable without a Cloud Receiver database.
const enabled = process.env.CLOUD_RECEIVER_V2_CLAIM_CONTRACT === "1";
const testOptions = enabled
  ? { concurrency: false }
  : { skip: "Set CLOUD_RECEIVER_V2_CLAIM_CONTRACT=1 with a disposable v2 database to run" };

const RECEIVER_ORIGIN = "http://127.0.0.1:4000";
const RESTART_PORT = 4026;
const RESTART_ORIGIN = `http://127.0.0.1:${RESTART_PORT}`;
const HOST_BROWSER_ORIGIN = "http://localhost:3000";
const REQUEST_TIMEOUT_MS = 5_000;

let harness;
let restartedReceiver;

before(async () => {
  if (!enabled) return;
  harness = await createHarness();
});

after(async () => {
  await stopRestartedReceiver();
  if (!harness) return;
  try {
    if (harness.organizationId) {
      await harness.prisma.organization.deleteMany({ where: { id: harness.organizationId } });
    }
    await harness.clearTestAccounts(harness.userEmail);
    await harness.clearTestAccounts(harness.developerEmail);
  } finally {
    await harness.prisma.$disconnect();
  }
});

test(
  "CONNECTOR-V2-CLAIM-001 sends the exact claim body and maps work/no-work responses",
  testOptions,
  async () => {
    const connector = await createConnector("claim-001");
    const fixture = await seedDelivery("claim-001", connector);
    const firstToken = claimToken();
    const captured = await withReceiverHandler(connector.token, async ({ client }) => {
      const claimed = await client.claimDelivery({ claimToken: firstToken });
      assert.ok(claimed);
      assert.equal(claimed.duplicate, false);

      const idle = await client.claimDelivery({ claimToken: claimToken() });
      assert.equal(idle, null);
    });

    assert.equal(captured.responses[0].status, 200);
    assert.equal(captured.responses[1].status, 204);
    assertEmpty204(captured.responses[1]);
    assert.equal(captured.requests[0].url, `${RECEIVER_ORIGIN}/v0.1/delivery-claims`);
    assert.equal(captured.requests[0].options.method, "POST");
    assert.deepEqual(Object.keys(captured.requests[0].options.headers).sort(), [
      "Accept",
      "Content-Type",
    ]);
    assert.equal(captured.requests[0].options.credentials, "omit");
    assert.equal(captured.requests[0].options.redirect, "manual");
    assert.equal(captured.requests[0].options.cache, "no-store");
    assert.deepEqual(JSON.parse(captured.requests[0].options.body), {
      connector_token: connector.token,
      claim_token: firstToken,
    });
    assert.equal("Authorization" in captured.requests[0].options.headers, false);
    assert.equal("Cookie" in captured.requests[0].options.headers, false);

    const state = await readDelivery(fixture.deliveryId);
    assert.equal(state.current_attempt, 1);
  },
);

test(
  "CONNECTOR-V2-CLAIM-002 replays the same live lease, serializes concurrency, and survives process restart",
  testOptions,
  async () => {
    const connector = await createConnector("claim-002");
    const fixture = await seedDelivery("claim-002", connector);
    const firstToken = claimToken();
    const competingToken = claimToken();
    const captured = await withReceiverHandler(connector.token, async ({ client }) => {
      const concurrent = await Promise.all([
        client.claimDelivery({ claimToken: firstToken }),
        client.claimDelivery({ claimToken: competingToken }),
      ]);
      const winnerIndex = concurrent.findIndex((value) => value !== null);
      assert.notEqual(winnerIndex, -1);
      assert.equal(concurrent.filter((value) => value !== null).length, 1);
      const winningToken = winnerIndex === 0 ? firstToken : competingToken;
      const first = concurrent[winnerIndex];
      assert.ok(first);
      const replay = await client.claimDelivery({ claimToken: winningToken });
      assert.deepEqual(replay, { ...first, duplicate: true });
      return { first, winningToken };
    });

    assert.deepEqual(
      captured.responses.slice(0, 2).map((response) => response.status).sort(),
      [200, 204],
    );
    assert.equal(captured.responses[2].status, 200);
    assert.equal(await countAttempts(fixture.deliveryId), 1);

    try {
      await startRestartedReceiver();
      const restartedClient = new LocalConnectorClient({
        baseUrl: RESTART_ORIGIN,
        connectorToken: connector.token,
        requestTimeoutMs: REQUEST_TIMEOUT_MS,
      });
      const replayAfterRestart = await restartedClient.claimDelivery({
        claimToken: captured.result.winningToken,
      });
      assert.deepEqual(replayAfterRestart, { ...captured.result.first, duplicate: true });
      assert.equal(await countAttempts(fixture.deliveryId), 1);
    } finally {
      await stopRestartedReceiver();
    }

    assert.equal(restartedReceiver, null);
    assert.doesNotMatch(restartLogs, new RegExp(escapeRegExp(connector.token)));
    assert.doesNotMatch(
      restartLogs,
      new RegExp(escapeRegExp(captured.result.winningToken)),
    );
  },
);

test(
  "CONNECTOR-V2-CLAIM-003 isolates fresh wrong-target claims and rejects cross-Connector replay",
  testOptions,
  async () => {
    const owner = await createConnector("claim-003-owner");
    const other = await createConnector("claim-003-other");
    const fixture = await seedDelivery("claim-003", owner);
    const captured = await withReceiverHandler(null, async () => {
      const ownerClient = new LocalConnectorClient({
        baseUrl: RECEIVER_ORIGIN,
        connectorToken: owner.token,
        requestTimeoutMs: REQUEST_TIMEOUT_MS,
      });
      const otherClient = new LocalConnectorClient({
        baseUrl: RECEIVER_ORIGIN,
        connectorToken: other.token,
        requestTimeoutMs: REQUEST_TIMEOUT_MS,
      });
      const before = await readDelivery(fixture.deliveryId);
      assert.equal(await otherClient.claimDelivery({ claimToken: claimToken() }), null);
      assert.deepEqual(await readDelivery(fixture.deliveryId), before);

      const ownerToken = claimToken();
      assert.ok(await ownerClient.claimDelivery({ claimToken: ownerToken }));
      await assert.rejects(
        otherClient.claimDelivery({ claimToken: ownerToken }),
        (error) => error?.code === "delivery_lease_scope_invalid" && error?.statusCode === 403,
      );

      const invalidClient = new LocalConnectorClient({
        baseUrl: RECEIVER_ORIGIN,
        connectorToken: "invalid-connector-token",
        requestTimeoutMs: REQUEST_TIMEOUT_MS,
      });
      await assert.rejects(
        invalidClient.claimDelivery({ claimToken: claimToken() }),
        (error) => error?.code === "connector_identity_invalid" && error?.statusCode === 403,
      );
    });

    assert.equal(captured.responses[0].status, 204);
    assertEmpty204(captured.responses[0]);
    assert.equal(captured.responses[1].status, 200);
    assert.equal(captured.responses[2].status, 403);
    assert.equal(captured.responses[3].status, 403);
    for (const response of [
      captured.responses[0],
      captured.responses[2],
      captured.responses[3],
    ]) {
      assert.doesNotMatch(response.body, new RegExp(escapeRegExp(owner.token)));
      assert.doesNotMatch(response.body, new RegExp(escapeRegExp(fixture.eventId)));
    }
  },
);

test(
  "CONNECTOR-V2-CLAIM-004 reclaims expired leases three times and maps exhaustion to empty 204",
  testOptions,
  async () => {
    const connector = await createConnector("claim-004");
    const fixture = await seedDelivery("claim-004", connector);
    const firstToken = claimToken();
    const secondToken = claimToken();
    const thirdToken = claimToken();
    const captured = await withReceiverHandler(connector.token, async ({ client }) => {
      const first = await client.claimDelivery({ claimToken: firstToken });
      assert.equal(first?.lease.attempt, 1);
      await expireLease(fixture.deliveryId);

      await assert.rejects(
        client.claimDelivery({ claimToken: firstToken }),
        (error) => error?.code === "claim_token_retired" && error?.statusCode === 409,
      );

      const second = await client.claimDelivery({ claimToken: secondToken });
      assert.equal(second?.lease.attempt, 2);
      await expireLease(fixture.deliveryId);

      const third = await client.claimDelivery({ claimToken: thirdToken });
      assert.equal(third?.lease.attempt, 3);
      await expireLease(fixture.deliveryId);

      const exhausted = await client.claimDelivery({ claimToken: claimToken() });
      assert.equal(exhausted, null);
    });

    assert.equal(captured.responses[0].status, 200);
    assert.equal(captured.responses[1].status, 409);
    assert.equal(captured.responses[2].status, 200);
    assert.equal(captured.responses[3].status, 200);
    assert.equal(captured.responses[4].status, 204);
    assertEmpty204(captured.responses[4]);

    const state = await readDelivery(fixture.deliveryId);
    assert.equal(state.status, "retry_exhausted");
    assert.equal(state.current_attempt, 3);
    assert.equal(state.terminal_reason, "attempt_limit_reached");
    assert.equal(await countAttempts(fixture.deliveryId), 3);
    const durable = await readDurableDeliveryText(fixture.deliveryId);
    for (const secret of [connector.token, firstToken, secondToken, thirdToken]) {
      assert.doesNotMatch(durable, new RegExp(escapeRegExp(secret)));
    }
  },
);

test(
  "CONNECTOR-V2-CLAIM-005 preserves canonical lease context and redacts raw secrets from logs/state",
  testOptions,
  async () => {
    const connector = await createConnector("claim-005");
    const fixture = await seedDelivery("claim-005", connector);
    const token = claimToken();
    const captured = await withReceiverHandler(connector.token, async ({ client }) => {
      const result = await client.claimDelivery({ claimToken: token });
      assert.ok(result);
      assert.deepEqual(Object.keys(result).sort(), ["duplicate", "lease"]);
      assert.deepEqual(Object.keys(result.lease).sort(), [
        "attempt",
        "continuation",
        "delivery_id",
        "event_id",
        "lease_expires_at",
        "lease_token",
        "protocol_version",
        "receipt",
        "type",
      ]);
      assert.equal(result.lease.lease_token, token);
      assert.equal(result.lease.delivery_id, fixture.deliveryId);
      assert.equal(result.lease.event_id, fixture.eventId);
      assert.equal(Date.parse(result.lease.lease_expires_at) > Date.now(), true);
      assert.equal(result.lease.receipt.grant_id, fixture.grantId);
      assert.equal(result.lease.continuation.instruction, fixture.instruction);
      assert.equal("connector_token" in result, false);
      assert.equal(JSON.stringify(result).includes(connector.token), false);
      assert.equal(JSON.stringify(result).includes(fixture.bindingId), false);
      return { result };
    });

    assert.equal(captured.responses[0].status, 200);
    for (const secret of [connector.token, token]) {
      assert.doesNotMatch(captured.logs.join("\n"), new RegExp(escapeRegExp(secret)));
    }
    const durable = await readDurableDeliveryText(fixture.deliveryId);
    for (const secret of [connector.token, token]) {
      assert.doesNotMatch(durable, new RegExp(escapeRegExp(secret)));
    }
    assert.equal(captured.result.result.lease.lease_token, token);
  },
);

let restartLogs = "";

async function createHarness() {
  const receiverRoot = process.env.CLOUD_RECEIVER_V2_ROOT
    ?? fileURLToPath(new URL("../../saas-boilerplate/", import.meta.url));
  const backendRoot = path.join(receiverRoot, "backend");
  const require = createRequire(import.meta.url);
  process.env.TS_NODE_PROJECT = path.join(backendRoot, "tsconfig.json");
  require(path.join(receiverRoot, "node_modules/ts-node/register/transpile-only.js"));

  const { createApp } = require(path.join(backendRoot, "src/app.ts"));
  const { appConfig } = require(path.join(backendRoot, "src/config/config.ts"));
  const { prisma } = require(path.join(backendRoot, "src/db/index.ts"));
  const { digestSecret } = require(path.join(backendRoot, "src/middleware/organization-auth.ts"));
  const { clearTestAccounts } = require(path.join(backendRoot, "src/test/helper.ts"));
  const receiverRequest = require(path.join(receiverRoot, "node_modules/supertest"));
  const app = createApp();
  const userAgent = receiverRequest.agent(app);
  const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  const userEmail = `connector-claim-user-${suffix}@example.com`;
  const developerEmail = `connector-claim-developer-${suffix}@example.com`;
  const password = "correct horse battery staple";

  appConfig.receiverPublicUrl = RECEIVER_ORIGIN;
  appConfig.frontendUrl = HOST_BROWSER_ORIGIN;
  await clearTestAccounts(userEmail);
  await clearTestAccounts(developerEmail);

  const user = await userAgent
    .post("/v1/auth/users/register")
    .send({ email: userEmail, password });
  assert.equal(user.status, 201);
  const developer = await receiverRequest(app)
    .post("/v1/auth/developers/register")
    .send({ email: developerEmail, password });
  assert.equal(developer.status, 201);
  const organization = await prisma.organization.create({
    data: { developerId: developer.body.data.id, name: `Connector Claim ${suffix}` },
  });

  return {
    app,
    appConfig,
    digestSecret,
    prisma,
    receiverRequest,
    userAgent,
    suffix,
    userId: user.body.data.id,
    accountId: user.body.data.id,
    organizationId: organization.id,
    userEmail,
    developerEmail,
    clearTestAccounts,
  };
}

async function createConnector(label) {
  const pairing = await harness.userAgent
    .post("/v0.1/account/pairing-sessions")
    .set("Origin", HOST_BROWSER_ORIGIN)
    .set("Content-Type", "application/json")
    .send({});
  assert.equal(pairing.status, 201);

  const claimed = await harness.receiverRequest(harness.app)
    .post("/v0.1/account/pairing-sessions/claim")
    .set("Content-Type", "application/json")
    .send({ pairing_code: pairing.body.pairing_code, device_name: `Claim Connector ${label}` });
  assert.equal(claimed.status, 200);

  const connector = await harness.prisma.connector.findUnique({
    where: { id: claimed.body.connector_id },
    select: { id: true, accountId: true, deliveryTargetId: true, expiresAt: true },
  });
  assert.ok(connector);
  return {
    id: connector.id,
    accountId: connector.accountId,
    token: claimed.body.connector_token,
    deliveryTargetId: connector.deliveryTargetId,
    expiresAt: connector.expiresAt,
  };
}

async function seedDelivery(label, connector) {
  const eventId = `event-${harness.suffix}-${label}`;
  const bindingId = randomUUID();
  const correlationId = `correlation-${harness.suffix}-${label}`;
  const workflowId = `workflow-${harness.suffix}-${label}`;
  const manifestId = `manifest-${harness.suffix}-${label}`;
  const eventType = "workflow.ready";
  const canonicalUrl = `${HOST_BROWSER_ORIGIN}/workflows/${label}`;
  const instruction = `Review ${label} and prepare the next safe step.`;
  const occurredAt = new Date(Date.now() - 1_000).toISOString();
  const event = {
    type: "webmcp.continuation_event",
    protocol_version: "0.1",
    event_id: eventId,
    correlation_id: correlationId,
    binding_id: bindingId,
    issuer_origin: HOST_BROWSER_ORIGIN,
    workflow_id: workflowId,
    event_type: eventType,
    event_sequence: 1,
    state_version: 2,
    occurred_at: occurredAt,
    canonical_url: canonicalUrl,
  };
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60_000);

  await harness.prisma.hostSubjectBinding.create({
    data: {
      id: bindingId,
      organizationId: harness.organizationId,
      hostSubjectRefDigest: harness.digestSecret(`subject-${harness.suffix}-${label}`),
      connectorId: connector.id,
      deliveryTargetId: connector.deliveryTargetId,
    },
  });
  const consentSession = await harness.prisma.consentSession.create({
    data: {
      id: `consent-${harness.suffix}-${label}`,
      challengeId: `challenge-${harness.suffix}-${label}`,
      tokenDigest: harness.digestSecret(`consent-token-${harness.suffix}-${label}`),
      organizationId: harness.organizationId,
      hostSubjectRefDigest: harness.digestSecret(`subject-${harness.suffix}-${label}`),
      expectedOrigin: HOST_BROWSER_ORIGIN,
      manifestId,
      manifestJson: storedManifest({
        manifestId,
        correlationId,
        workflowId,
        eventType,
        canonicalUrl,
        instruction,
        now,
        expiresAt,
      }),
      expiresAt,
      status: "approved",
      decisionAction: "approve",
      decisionAt: now,
      accountId: harness.accountId,
    },
  });
  const grant = await harness.prisma.grant.create({
    data: {
      consentSessionId: consentSession.id,
      organizationId: harness.organizationId,
      bindingId,
      accountId: harness.accountId,
      connectorId: connector.id,
      deliveryTargetId: connector.deliveryTargetId,
      correlationId,
      issuerOrigin: HOST_BROWSER_ORIGIN,
      workflowId,
      workflowType: "review",
      canonicalUrl,
      eventType,
      humanBoundary: "explicit_receiver_consent",
      expiresAt,
      maxRuns: 1,
      runsRemaining: 0,
    },
  });
  const storedEvent = await harness.prisma.event.create({
    data: {
      eventId,
      grantId: grant.id,
      bindingId,
      correlationId,
      issuerOrigin: HOST_BROWSER_ORIGIN,
      workflowId,
      eventType,
      eventSequence: 1,
      stateVersion: BigInt(event.state_version),
      occurredAt: new Date(occurredAt),
      canonicalUrl,
      canonicalBody: canonicalJson(event),
      receivedAt: now,
    },
  });
  const delivery = await harness.prisma.delivery.create({
    data: {
      eventId: storedEvent.eventId,
      grantId: grant.id,
      deliveryTargetId: connector.deliveryTargetId,
      status: "pending",
      createdAt: now,
    },
  });

  return { deliveryId: delivery.deliveryId, eventId, grantId: grant.id, bindingId, instruction };
}

function storedManifest({
  manifestId,
  correlationId,
  workflowId,
  eventType,
  canonicalUrl,
  instruction,
  now,
  expiresAt,
}) {
  return {
    type: "webmcp.reentry_manifest",
    protocol_version: "0.1",
    manifest_id: manifestId,
    correlation_id: correlationId,
    issuer_origin: HOST_BROWSER_ORIGIN,
    issued_at: new Date(now.getTime() - 1_000).toISOString(),
    offer_expires_at: new Date(now.getTime() + 5 * 60_000).toISOString(),
    workflow: {
      id: workflowId,
      type: "review",
      state_version: 1,
      canonical_url: canonicalUrl,
    },
    display: { title: `Continuation ${workflowId}`, reason: instruction },
    grant_request: {
      event_type: eventType,
      grant_expires_at: expiresAt.toISOString(),
      max_runs: 1,
      human_boundary: "explicit_receiver_consent",
    },
    signature: {
      algorithm: "Ed25519",
      key_id: "fixture-key",
      value: "A".repeat(86),
    },
  };
}

async function withReceiverHandler(connectorToken, callback) {
  const originalFetch = globalThis.fetch;
  const originalLog = console.log;
  const originalError = console.error;
  const requests = [];
  const responses = [];
  const logs = [];
  globalThis.fetch = async (url, options = {}) => {
    const parsed = new URL(url);
    assert.equal(parsed.origin, RECEIVER_ORIGIN);
    requests.push({ url, options: { ...options, headers: { ...(options.headers ?? {}) } } });
    const method = String(options.method ?? "GET").toLowerCase();
    const requestBuilder = harness.receiverRequest(harness.app)[method](
      parsed.pathname + parsed.search,
    );
    for (const [name, value] of Object.entries(options.headers ?? {})) {
      requestBuilder.set(name, String(value));
    }
    if (options.body !== undefined) requestBuilder.send(options.body);
    const response = await requestBuilder;
    const body = response.text ?? "";
    responses.push({ status: response.status, headers: response.headers, body });
    const headers = new Headers();
    for (const [name, value] of Object.entries(response.headers)) {
      headers.set(name, Array.isArray(value) ? value.join(", ") : String(value));
    }
    return new Response(response.status === 204 ? null : body, {
      status: response.status,
      headers,
    });
  };
  console.log = (...args) => logs.push(args.join(" "));
  console.error = (...args) => logs.push(args.join(" "));
  try {
    const result = await callback({
      client: connectorToken
        ? new LocalConnectorClient({
            baseUrl: RECEIVER_ORIGIN,
            connectorToken,
            requestTimeoutMs: REQUEST_TIMEOUT_MS,
          })
        : null,
      createClient(connectorToken) {
        return new LocalConnectorClient({
          baseUrl: RECEIVER_ORIGIN,
          connectorToken,
          requestTimeoutMs: REQUEST_TIMEOUT_MS,
        });
      },
    });
    return { result, requests, responses, logs };
  } finally {
    globalThis.fetch = originalFetch;
    console.log = originalLog;
    console.error = originalError;
  }
}

function claimToken() {
  return randomBytes(32).toString("base64url");
}

function assertEmpty204(response) {
  assert.equal(response.status, 204);
  assert.equal(response.body, "");
  assert.equal(response.headers["content-type"], undefined);
  assert.equal(response.headers["content-length"], "0");
  assert.equal(response.headers["cache-control"], "no-store");
  assert.equal(response.headers.pragma, "no-cache");
  assert.equal(response.headers["x-content-type-options"], "nosniff");
}

async function readDelivery(deliveryId) {
  const rows = await harness.prisma.$queryRaw`
    SELECT
      "status",
      "current_attempt",
      "current_claim_token_digest",
      "terminal_reason"
    FROM "cr2_deliveries"
    WHERE "delivery_id" = ${deliveryId}
  `;
  assert.equal(rows.length, 1);
  return rows[0];
}

async function countAttempts(deliveryId) {
  const rows = await harness.prisma.$queryRaw`
    SELECT COUNT(*)::bigint AS count
    FROM "cr2_delivery_attempts"
    WHERE "delivery_id" = ${deliveryId}
  `;
  return Number(rows[0]?.count ?? 0n);
}

async function expireLease(deliveryId) {
  await harness.prisma.$executeRaw`
    UPDATE "cr2_deliveries"
    SET "lease_expires_at" = ${new Date(Date.now() - 1_000)}
    WHERE "delivery_id" = ${deliveryId}
  `;
}

async function readDurableDeliveryText(deliveryId) {
  const rows = await harness.prisma.$queryRaw`
    SELECT CONCAT(
      row_to_json(d)::text,
      COALESCE((SELECT string_agg(row_to_json(a)::text, '')
        FROM "cr2_delivery_attempts" a
        WHERE a."delivery_id" = d."delivery_id"), '')
    ) AS row_text
    FROM "cr2_deliveries" d
    WHERE d."delivery_id" = ${deliveryId}
  `;
  assert.equal(rows.length, 1);
  return rows[0].row_text;
}

async function startRestartedReceiver() {
  if (restartedReceiver) throw new Error("restart Receiver is already running");
  restartLogs = "";
  const receiverRoot = process.env.CLOUD_RECEIVER_V2_ROOT
    ?? fileURLToPath(new URL("../../saas-boilerplate/", import.meta.url));
  const backendRoot = path.join(receiverRoot, "backend");
  const child = spawn(process.execPath, [path.join(backendRoot, "dist/index.js")], {
    cwd: backendRoot,
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: String(RESTART_PORT),
      FRONTEND_URL: HOST_BROWSER_ORIGIN,
      CLOUD_RECEIVER_RUNTIME_DATABASE_URL: "",
      DIRECT_URL: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (chunk) => {
    restartLogs += chunk.toString();
  });
  child.stderr?.on("data", (chunk) => {
    restartLogs += chunk.toString();
  });
  restartedReceiver = child;
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${RESTART_ORIGIN}/health/live`);
      await response.text();
      if (response.ok) return;
    } catch {
      // The child may still be starting; continue until the bounded deadline.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("v2 Receiver did not become live within the restart test deadline");
}

async function stopRestartedReceiver() {
  const child = restartedReceiver;
  restartedReceiver = null;
  if (!child || child.exitCode !== null) return;
  await new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      settle(new Error("v2 Receiver did not stop after SIGTERM"));
    }, 10_000);
    const settle = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve();
    };
    child.once("error", settle);
    child.once("exit", () => settle());
    child.kill("SIGTERM");
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
