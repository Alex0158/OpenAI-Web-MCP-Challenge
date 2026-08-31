import assert from "node:assert/strict";
import { mkdtemp, readFile, rmdir, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";

import { spawnProfileProcess as spawnFixture } from "./process-fixtures/child-rpc.mjs";

const CONNECTOR_TOKEN = "connector_process_fixture_token";
const CONTROL_TOKEN = "grant_control_process_fixture_token";
const DECISION_TOKEN = "decision_process_fixture_token";
const EVENT_ID = "event_conformance_001";
const CONFLICTING_EFFECT_TOKEN = "conflicting_effect_process_fixture_token";

test("P1: revocation before event survives Receiver restart and spends no run", async (t) => {
  const scenario = await createScenario(t);
  const approval = await enrollAndApprove(scenario);
  const bindingId = approval.binding.binding_id;

  const revocation = await scenario.receiver.request("revokeGrant", {
    bindingId,
    controlToken: CONTROL_TOKEN,
  });
  assert.equal(revocation.status, "revoked");
  assert.equal(revocation.duplicate, false);
  assert.deepEqual(await scenario.restartReceiver(), { code: null, signal: "SIGTERM" });

  const summary = await inspectGrant(scenario, bindingId);
  assert.equal(summary.status, "revoked");
  assert.equal(summary.runs_remaining, 1);
  assert.equal(summary.revoked_at, revocation.revoked_at);

  const rejected = await scenario.host.request("sendEvent", {
    receiverOrigin: scenario.receiverOrigin,
    binding: approval.binding,
  });
  assert.deepEqual(rejected, {
    status: 422,
    response: { error: { code: "grant_revoked" } },
    eventId: EVENT_ID,
  });
  assert.equal(await scenario.receiver.request("inspectDelivery", { eventId: EVENT_ID }), null);

  await scenario.receiver.terminate();
  await assertNoPersistedTokens(scenario.databasePath, [CONTROL_TOKEN]);
});

test("P2: lease-first revocation fences replay and preserves exact effect convergence", async (t) => {
  const scenario = await createScenario(t);
  const approval = await enrollAndApprove(scenario);
  const accepted = await sendEvent(scenario, approval.binding);
  const connector = await scenario.spawnConnector();
  const claimToken = token(21);
  const claim = await connector.request("claim", { claimToken });
  const effect = await scenario.host.request("createEffect", effectContext(claim.lease));
  await waitPast(effect.attestation.confirmed_at, 2);

  const revocation = await scenario.receiver.request("revokeGrant", {
    bindingId: approval.binding.binding_id,
    controlToken: CONTROL_TOKEN,
  });
  assert.ok(
    Date.parse(effect.attestation.confirmed_at) < Date.parse(revocation.revoked_at),
  );
  assert.deepEqual(await scenario.restartReceiver(), { code: null, signal: "SIGTERM" });
  await scenario.receiver.request("authorizeEffect", effect);

  assert.equal(await connector.request("claim", { claimToken }), null);
  const fenced = await scenario.receiver.request("inspectDelivery", {
    eventId: accepted.eventId,
  });
  assert.equal(fenced.status, "retry_exhausted");
  assert.equal(fenced.terminal_reason, "grant_revoked");

  const acknowledgement = await connector.request("acknowledge", {
    deliveryId: claim.lease.delivery_id,
    leaseToken: claim.lease.lease_token,
    effectToken: effect.effectToken,
  });
  assert.equal(acknowledgement.acknowledged, true);
  assert.equal(acknowledgement.duplicate, false);
  assert.deepEqual(await connector.request("acknowledge", {
    deliveryId: claim.lease.delivery_id,
    leaseToken: claim.lease.lease_token,
    effectToken: effect.effectToken,
  }), { ...acknowledgement, duplicate: true });

  const conflictingEffect = {
    effectToken: CONFLICTING_EFFECT_TOKEN,
    attestation: {
      ...effect.attestation,
      effect_id: "effect_process_conflict_001",
    },
  };
  await scenario.receiver.request("authorizeEffect", conflictingEffect);
  await assert.rejects(
    connector.request("acknowledge", {
      deliveryId: claim.lease.delivery_id,
      leaseToken: claim.lease.lease_token,
      effectToken: conflictingEffect.effectToken,
    }),
    { code: "delivery_effect_conflict", statusCode: 409 },
  );

  await scenario.receiver.terminate();
  await assertNoPersistedTokens(scenario.databasePath, [
    CONNECTOR_TOKEN,
    CONTROL_TOKEN,
    claimToken,
    effect.effectToken,
    conflictingEffect.effectToken,
  ]);
});

test("P3: restart and lease expiry fence a stale Connector process", async (t) => {
  const scenario = await createScenario(t, { leaseDurationMs: 1_000 });
  const approval = await enrollAndApprove(scenario);
  await sendEvent(scenario, approval.binding);
  const staleConnector = await scenario.spawnConnector();
  const nextConnector = await scenario.spawnConnector();
  const staleClaimToken = token(31);
  const nextClaimToken = token(32);
  const staleClaim = await staleConnector.request("claim", {
    claimToken: staleClaimToken,
  });
  assert.equal(staleClaim.lease.attempt, 1);
  const staleEffect = await scenario.host.request(
    "createEffect",
    effectContext(staleClaim.lease),
  );

  assert.deepEqual(await scenario.restartReceiver(), { code: null, signal: "SIGTERM" });
  await waitPast(staleClaim.lease.lease_expires_at, 25);
  const nextClaim = await nextConnector.request("claim", { claimToken: nextClaimToken });
  assert.equal(nextClaim.duplicate, false);
  assert.equal(nextClaim.lease.attempt, 2);
  await scenario.receiver.request("authorizeEffect", staleEffect);

  await assert.rejects(
    staleConnector.request("claim", { claimToken: staleClaimToken }),
    { code: "claim_token_retired", statusCode: 409 },
  );
  await assert.rejects(
    staleConnector.request("acknowledge", {
      deliveryId: staleClaim.lease.delivery_id,
      leaseToken: staleClaim.lease.lease_token,
      effectToken: staleEffect.effectToken,
    }),
    { code: "delivery_lease_invalid", statusCode: 403 },
  );

  const effect = await scenario.host.request("createEffect", effectContext(nextClaim.lease));
  await scenario.receiver.request("authorizeEffect", effect);
  const acknowledgement = await nextConnector.request("acknowledge", {
    deliveryId: nextClaim.lease.delivery_id,
    leaseToken: nextClaim.lease.lease_token,
    effectToken: effect.effectToken,
  });
  assert.equal(acknowledgement.acknowledged, true);
  assert.equal(acknowledgement.duplicate, false);

  await scenario.receiver.terminate();
  await assertNoPersistedTokens(scenario.databasePath, [
    CONNECTOR_TOKEN,
    staleClaimToken,
    nextClaimToken,
    staleEffect.effectToken,
    effect.effectToken,
  ]);
});

test("P4: SIGKILL after the delivery write leaves no partial event transaction", async (t) => {
  const scenario = await createScenario(t);
  const approval = await enrollAndApprove(scenario);
  assert.deepEqual(
    await scenario.receiver.request("armExitAfterDeliveryWrite"),
    { armed: true },
  );

  await assert.rejects(
    scenario.host.request("sendEvent", {
      receiverOrigin: scenario.receiverOrigin,
      binding: approval.binding,
    }),
    { code: "profile_command_failed" },
  );
  assert.deepEqual(await scenario.restartReceiver(), { code: null, signal: "SIGKILL" });

  const beforeReplay = await inspectGrant(scenario, approval.binding.binding_id);
  assert.equal(beforeReplay.status, "active");
  assert.equal(beforeReplay.runs_remaining, 1);
  assert.equal(await scenario.receiver.request("inspectDelivery", { eventId: EVENT_ID }), null);

  const accepted = await scenario.host.request("sendEvent", {
    receiverOrigin: scenario.receiverOrigin,
    binding: approval.binding,
    replay: true,
  });
  assert.equal(accepted.status, 202);
  assert.equal(accepted.response.accepted, true);
  assert.equal(accepted.response.duplicate, false);
  const replayed = await scenario.host.request("sendEvent", {
    receiverOrigin: scenario.receiverOrigin,
    binding: approval.binding,
    replay: true,
  });
  assert.equal(replayed.response.duplicate, true);

  const afterReplay = await inspectGrant(scenario, approval.binding.binding_id);
  assert.equal(afterReplay.status, "exhausted");
  assert.equal(afterReplay.runs_remaining, 0);
  assert.equal(
    (await scenario.receiver.request("inspectDelivery", { eventId: EVENT_ID })).status,
    "pending",
  );

  await scenario.receiver.terminate();
  await assertNoPersistedTokens(scenario.databasePath, [CONTROL_TOKEN]);
});

async function createScenario(t, { leaseDurationMs = 2 * 60_000 } = {}) {
  const directory = await mkdtemp(join(tmpdir(), "webmcp-process-matrix-"));
  const databasePath = join(directory, "receiver.sqlite");
  const children = new Set();
  const scenario = {
    children,
    databasePath,
    directory,
    host: undefined,
    hostInfo: undefined,
    manifest: undefined,
    receiver: undefined,
    receiverInfo: undefined,
    receiverOrigin: undefined,
  };

  t.after(async () => {
    for (const child of [...children].reverse()) await child.terminate();
    for (const path of persistencePaths(databasePath)) await unlinkIfPresent(path);
    await rmdir(directory);
  });

  scenario.host = spawn(
    scenario,
    new URL("./process-fixtures/host-process.mjs", import.meta.url),
  );
  scenario.hostInfo = await scenario.host.request("initialize");
  assert.equal(scenario.hostInfo.sqliteLoaded, false);
  assert.notEqual(scenario.hostInfo.pid, process.pid);
  scenario.manifest = await scenario.host.request("issueManifest");

  scenario.startReceiver = async (port = 0) => {
    scenario.receiver = spawn(
      scenario,
      new URL("./process-fixtures/receiver-process.mjs", import.meta.url),
    );
    scenario.receiverInfo = await scenario.receiver.request("start", {
      databasePath,
      port,
      hostOrigin: scenario.hostInfo.origin,
      keyId: scenario.hostInfo.keyId,
      publicKeyPem: scenario.hostInfo.publicKeyPem,
      decisionToken: DECISION_TOKEN,
      connectorToken: CONNECTOR_TOKEN,
      leaseDurationMs,
    });
    assert.equal(scenario.receiverInfo.sqliteLoaded, true);
    assert.notEqual(scenario.receiverInfo.pid, process.pid);
    assert.notEqual(scenario.receiverInfo.pid, scenario.hostInfo.pid);
    scenario.receiverOrigin = `http://127.0.0.1:${scenario.receiverInfo.port}`;
  };

  scenario.restartReceiver = async () => {
    const previousPort = scenario.receiverInfo.port;
    const exit = await scenario.receiver.terminate();
    await scenario.startReceiver(previousPort);
    return exit;
  };

  scenario.spawnConnector = async () => {
    const connector = spawn(
      scenario,
      new URL("./process-fixtures/connector-process.mjs", import.meta.url),
    );
    const info = await connector.request("start", {
      baseUrl: scenario.receiverOrigin,
      connectorToken: CONNECTOR_TOKEN,
    });
    assert.equal(info.sqliteLoaded, false);
    assert.notEqual(info.pid, process.pid);
    assert.notEqual(info.pid, scenario.hostInfo.pid);
    assert.notEqual(info.pid, scenario.receiverInfo.pid);
    return connector;
  };

  await scenario.startReceiver();
  return scenario;
}

async function enrollAndApprove(scenario) {
  const enrollment = await scenario.receiver.request("enroll", {
    manifest: scenario.manifest,
  });
  return scenario.receiver.request("approve", {
    challengeId: enrollment.challenge.challenge_id,
  });
}

async function sendEvent(scenario, binding) {
  const result = await scenario.host.request("sendEvent", {
    receiverOrigin: scenario.receiverOrigin,
    binding,
  });
  assert.equal(result.status, 202);
  assert.equal(result.response.accepted, true);
  assert.equal(result.response.duplicate, false);
  return result;
}

function inspectGrant(scenario, bindingId) {
  return scenario.receiver.request("inspectGrant", {
    bindingId,
    controlToken: CONTROL_TOKEN,
  });
}

function spawn(scenario, moduleUrl) {
  const child = spawnFixture(moduleUrl);
  scenario.children.add(child);
  return child;
}

function effectContext(lease) {
  return {
    correlationId: lease.continuation.correlation_id,
    deliveryId: lease.delivery_id,
    eventId: lease.event_id,
    workflowId: lease.continuation.workflow_id,
  };
}

function token(fill) {
  return Buffer.alloc(32, fill).toString("base64url");
}

async function waitPast(timestamp, marginMs) {
  const waitMs = Math.max(0, Date.parse(timestamp) + marginMs - Date.now());
  if (waitMs > 0) await delay(waitMs);
}

async function assertNoPersistedTokens(databasePath, tokens) {
  const persistence = await readPersistence(databasePath);
  for (const value of tokens) {
    assert.equal(
      persistence.includes(Buffer.from(value)),
      false,
      `persisted raw token: ${value}`,
    );
  }
}

async function readPersistence(databasePath) {
  const buffers = [];
  for (const path of persistencePaths(databasePath)) {
    try {
      buffers.push(await readFile(path));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return Buffer.concat(buffers);
}

function persistencePaths(databasePath) {
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
