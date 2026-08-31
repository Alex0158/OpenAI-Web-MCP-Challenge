import { mkdtemp, readFile, rmdir, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PROTOCOL_VERSION } from "../src/protocol.mjs";
import { spawnProfileProcess } from "./process-rpc.mjs";

const PROFILE = "reentry-core-domain-neutral-conformance";
const CONNECTOR_TOKEN = "connector_conformance_fixture_token";
const DECISION_TOKEN = "decision_conformance_fixture_token";
const CLAIM_TOKEN = Buffer.alloc(32, 13).toString("base64url");
const UNKNOWN_EFFECT_TOKEN = "effect_conformance_unknown_token";
const children = new Set();

let directory;
let databasePath;
let result;
let failure;

try {
  directory = await mkdtemp(join(tmpdir(), "webmcp-reentry-conformance-"));
  databasePath = join(directory, "receiver.sqlite");
  result = await runProfile();
  await closeChildren();
  await assertNoPersistedTokens(result.privateTokens);
} catch (error) {
  failure = error;
  await terminateChildren();
}

try {
  if (databasePath) await removeProfileFiles();
} catch (error) {
  failure ??= error;
}

if (failure) {
  process.stderr.write(`${JSON.stringify({ error: { code: boundedCode(failure?.code) } })}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`${JSON.stringify(result.publicResult)}\n`);
}

async function runProfile() {
  const host = spawn(new URL("./host-process.mjs", import.meta.url));
  const hostInfo = await host.request("initialize");
  requireExactFields(hostInfo, ["keyId", "origin", "pid", "publicKeyPem", "sqliteLoaded"]);
  expect(hostInfo.sqliteLoaded === false, "profile_host_loaded_sqlite");
  const manifest = await host.request("issueManifest");

  const receiver = spawn(new URL("./receiver-process.mjs", import.meta.url));
  const receiverInfo = await receiver.request("start", {
    databasePath,
    port: 0,
    hostOrigin: hostInfo.origin,
    keyId: hostInfo.keyId,
    publicKeyPem: hostInfo.publicKeyPem,
    decisionToken: DECISION_TOKEN,
    connectorToken: CONNECTOR_TOKEN,
  });
  requireExactFields(receiverInfo, ["pid", "port", "sqliteLoaded"]);
  expect(receiverInfo.sqliteLoaded === true, "profile_receiver_did_not_load_sqlite");
  const receiverOrigin = `http://127.0.0.1:${receiverInfo.port}`;

  const enrollment = await receiver.request("enroll", { manifest });
  const approval = await receiver.request("approve", {
    challengeId: enrollment.challenge.challenge_id,
  });
  const event = await host.request("sendEvent", {
    receiverOrigin,
    binding: approval.binding,
  });
  expect(event.status === 202, "profile_event_not_accepted");
  expect(event.response.accepted === true, "profile_event_not_accepted");
  expect(event.response.duplicate === false, "profile_event_was_duplicate");

  const connector = spawn(new URL("./connector-process.mjs", import.meta.url));
  const connectorInfo = await connector.request("start", {
    baseUrl: receiverOrigin,
    connectorToken: CONNECTOR_TOKEN,
  });
  requireExactFields(connectorInfo, ["pid", "sqliteLoaded"]);
  expect(connectorInfo.sqliteLoaded === false, "profile_connector_loaded_sqlite");
  expect(
    new Set([hostInfo.pid, receiverInfo.pid, connectorInfo.pid]).size === 3,
    "profile_processes_not_isolated",
  );

  const claim = await connector.request("claim", { claimToken: CLAIM_TOKEN });
  expect(claim.duplicate === false, "profile_claim_was_duplicate");
  expect(claim.lease.attempt === 1, "profile_claim_attempt_invalid");
  const activation = await connector.request("activate", { lease: claim.lease });
  expect(activation.calls === 1, "profile_agent_call_count_invalid");
  expect(activation.result.outcome === "accepted", "profile_agent_dispatch_not_accepted");
  expect(
    activation.result.code === "activation_dispatch_accepted",
    "profile_agent_dispatch_code_invalid",
  );

  let preAuthorizationRejected = false;
  try {
    await connector.request("acknowledge", {
      deliveryId: claim.lease.delivery_id,
      leaseToken: claim.lease.lease_token,
      effectToken: UNKNOWN_EFFECT_TOKEN,
    });
  } catch (error) {
    if (error?.code !== "host_effect_invalid") throw error;
    preAuthorizationRejected = true;
  }
  expect(preAuthorizationRejected, "profile_effect_gate_not_enforced");

  const effect = await host.request("createEffect", effectContext(claim.lease));
  await receiver.request("authorizeEffect", effect);
  const acknowledgement = await connector.request("acknowledge", {
    deliveryId: claim.lease.delivery_id,
    leaseToken: claim.lease.lease_token,
    effectToken: effect.effectToken,
  });
  expect(acknowledgement.acknowledged === true, "profile_acknowledgement_failed");
  expect(acknowledgement.duplicate === false, "profile_acknowledgement_was_duplicate");
  const finalDelivery = await receiver.request("inspectDelivery", { eventId: event.eventId });
  expect(finalDelivery?.status === "acknowledged", "profile_delivery_not_acknowledged");

  return {
    publicResult: {
      profile: PROFILE,
      protocol_version: PROTOCOL_VERSION,
      status: "passed",
      process_isolation: {
        distinct_roles: true,
        receiver_only_sqlite: true,
      },
      event: {
        accepted: true,
        duplicate: false,
      },
      delivery: {
        claimed: true,
        attempt: claim.lease.attempt,
      },
      activation: {
        outcome: activation.result.outcome,
        code: activation.result.code,
        calls: activation.calls,
      },
      effect: {
        pre_authorization_rejected: preAuthorizationRejected,
        acknowledged: acknowledgement.acknowledged,
        duplicate: acknowledgement.duplicate,
      },
    },
    privateTokens: [
      CONNECTOR_TOKEN,
      DECISION_TOKEN,
      CLAIM_TOKEN,
      claim.lease.lease_token,
      UNKNOWN_EFFECT_TOKEN,
      effect.effectToken,
    ],
  };
}

function spawn(moduleUrl) {
  const child = spawnProfileProcess(moduleUrl);
  children.add(child);
  return child;
}

async function closeChildren() {
  for (const child of [...children].reverse()) await child.close();
}

async function terminateChildren() {
  for (const child of [...children].reverse()) {
    try {
      await child.terminate();
    } catch {
      // Preserve the original bounded failure; cleanup cannot turn it into success.
    }
  }
}

function effectContext(lease) {
  return {
    correlationId: lease.continuation.correlation_id,
    deliveryId: lease.delivery_id,
    eventId: lease.event_id,
    workflowId: lease.continuation.workflow_id,
  };
}

async function assertNoPersistedTokens(tokens) {
  const persistence = await readPersistence();
  for (const token of tokens) {
    if (persistence.includes(Buffer.from(token))) {
      throw profileError("profile_raw_token_persisted");
    }
  }
}

async function readPersistence() {
  const buffers = [];
  for (const path of profileFiles()) {
    try {
      buffers.push(await readFile(path));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return Buffer.concat(buffers);
}

async function removeProfileFiles() {
  for (const path of profileFiles()) await unlinkIfPresent(path);
  try {
    await rmdir(directory);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function profileFiles() {
  return [
    databasePath,
    `${databasePath}-journal`,
    `${databasePath}-shm`,
    `${databasePath}-wal`,
  ];
}

async function unlinkIfPresent(path) {
  try {
    await unlink(path);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function requireExactFields(value, fields) {
  const actual = value && typeof value === "object" ? Object.keys(value).sort() : [];
  const expected = [...fields].sort();
  expect(
    actual.length === expected.length &&
      actual.every((field, index) => field === expected[index]),
    "profile_process_info_invalid",
  );
}

function expect(condition, code) {
  if (!condition) throw profileError(code);
}

function boundedCode(value) {
  return typeof value === "string" && /^[a-z][a-z0-9_]{0,95}$/.test(value)
    ? value
    : "conformance_profile_failed";
}

function profileError(code) {
  return Object.assign(new Error(code), { code });
}
