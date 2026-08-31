import assert from "node:assert/strict";
import { mkdtemp, readFile, rmdir, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { spawnProfileProcess as spawnFixture } from "./process-fixtures/child-rpc.mjs";

const CONNECTOR_TOKEN = "connector_process_fixture_token";
const DECISION_TOKEN = "decision_process_fixture_token";
const CLAIM_TOKEN = Buffer.alloc(32, 11).toString("base64url");
const WRONG_EFFECT_TOKEN = "wrong_effect_process_fixture_token";

test("independent processes recover exact event, lease, and effect state after forced Receiver termination", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "webmcp-reentry-process-"));
  const databasePath = join(directory, "receiver.sqlite");
  const children = new Set();
  t.after(async () => {
    for (const child of [...children].reverse()) await child.terminate();
    await unlinkIfPresent(`${databasePath}-shm`);
    await unlinkIfPresent(`${databasePath}-wal`);
    await unlinkIfPresent(databasePath);
    await rmdir(directory);
  });

  const host = spawnFixture(new URL("./process-fixtures/host-process.mjs", import.meta.url));
  children.add(host);
  const hostInfo = await host.request("initialize");
  assert.deepEqual(Object.keys(hostInfo).sort(), [
    "keyId",
    "origin",
    "pid",
    "publicKeyPem",
    "sqliteLoaded",
  ]);
  assert.equal(hostInfo.sqliteLoaded, false);
  assert.notEqual(hostInfo.pid, process.pid);
  const manifest = await host.request("issueManifest");

  let receiver = spawnFixture(new URL("./process-fixtures/receiver-process.mjs", import.meta.url));
  children.add(receiver);
  let receiverInfo = await receiver.request("start", receiverConfiguration({
    databasePath,
    hostInfo,
    port: 0,
  }));
  assert.equal(receiverInfo.sqliteLoaded, true);
  assert.notEqual(receiverInfo.pid, hostInfo.pid);
  const receiverOrigin = `http://127.0.0.1:${receiverInfo.port}`;

  const enrollment = await receiver.request("enroll", { manifest });
  const approval = await receiver.request("approve", {
    challengeId: enrollment.challenge.challenge_id,
  });
  const firstEvent = await host.request("sendEvent", {
    receiverOrigin,
    binding: approval.binding,
  });
  assert.equal(firstEvent.status, 202);
  assert.equal(firstEvent.response.accepted, true);
  assert.equal(firstEvent.response.duplicate, false);
  assert.equal(
    (await receiver.request("inspectDelivery", { eventId: firstEvent.eventId })).status,
    "pending",
  );

  assert.deepEqual(await receiver.terminate(), { code: null, signal: "SIGTERM" });
  receiver = spawnFixture(new URL("./process-fixtures/receiver-process.mjs", import.meta.url));
  children.add(receiver);
  receiverInfo = await receiver.request("start", receiverConfiguration({
    databasePath,
    hostInfo,
    port: receiverInfo.port,
  }));
  const replayedEvent = await host.request("sendEvent", {
    receiverOrigin,
    binding: approval.binding,
    replay: true,
  });
  assert.equal(replayedEvent.status, 202);
  assert.equal(replayedEvent.response.duplicate, true);
  assert.equal(replayedEvent.eventId, firstEvent.eventId);

  const connector = spawnFixture(new URL("./process-fixtures/connector-process.mjs", import.meta.url));
  children.add(connector);
  const connectorInfo = await connector.request("start", {
    baseUrl: receiverOrigin,
    connectorToken: CONNECTOR_TOKEN,
  });
  assert.equal(connectorInfo.sqliteLoaded, false);
  assert.notEqual(connectorInfo.pid, hostInfo.pid);
  assert.notEqual(connectorInfo.pid, receiverInfo.pid);
  const firstClaim = await connector.request("claim", { claimToken: CLAIM_TOKEN });
  assert.equal(firstClaim.duplicate, false);
  assert.equal(firstClaim.lease.attempt, 1);
  assert.equal(firstClaim.lease.lease_token, CLAIM_TOKEN);

  assert.deepEqual(await receiver.terminate(), { code: null, signal: "SIGTERM" });
  receiver = spawnFixture(new URL("./process-fixtures/receiver-process.mjs", import.meta.url));
  children.add(receiver);
  receiverInfo = await receiver.request("start", receiverConfiguration({
    databasePath,
    hostInfo,
    port: receiverInfo.port,
  }));
  const replayedClaim = await connector.request("claim", { claimToken: CLAIM_TOKEN });
  assert.equal(replayedClaim.duplicate, true);
  assert.deepEqual(replayedClaim.lease, firstClaim.lease);

  const effect = await host.request("createEffect", effectContext(replayedClaim.lease));
  await receiver.request("authorizeEffect", effect);
  await assert.rejects(
    connector.request("acknowledge", {
      deliveryId: replayedClaim.lease.delivery_id,
      leaseToken: replayedClaim.lease.lease_token,
      effectToken: WRONG_EFFECT_TOKEN,
    }),
    { code: "host_effect_invalid", statusCode: 403 },
  );

  await receiver.request("dropNextAcknowledgementResponse");
  await assert.rejects(
    connector.request("acknowledge", {
      deliveryId: replayedClaim.lease.delivery_id,
      leaseToken: replayedClaim.lease.lease_token,
      effectToken: effect.effectToken,
    }),
    { code: "connector_network_error" },
  );
  assert.deepEqual(await receiver.terminate(), { code: null, signal: "SIGTERM" });
  receiver = spawnFixture(new URL("./process-fixtures/receiver-process.mjs", import.meta.url));
  children.add(receiver);
  receiverInfo = await receiver.request("start", receiverConfiguration({
    databasePath,
    hostInfo,
    port: receiverInfo.port,
  }));
  await receiver.request("authorizeEffect", effect);
  const replayedAcknowledgement = await connector.request("acknowledge", {
    deliveryId: replayedClaim.lease.delivery_id,
    leaseToken: replayedClaim.lease.lease_token,
    effectToken: effect.effectToken,
  });
  assert.equal(replayedAcknowledgement.acknowledged, true);
  assert.equal(replayedAcknowledgement.duplicate, true);

  await connector.close();
  await host.close();
  await receiver.close();
  const persistence = await readPersistence(databasePath);
  for (const token of [CONNECTOR_TOKEN, CLAIM_TOKEN, effect.effectToken, WRONG_EFFECT_TOKEN]) {
    assert.equal(persistence.includes(Buffer.from(token)), false, `persisted raw token: ${token}`);
  }
  assert.equal(
    process.moduleLoadList.some((entry) => entry.toLowerCase().includes("sqlite")),
    false,
  );
});

function receiverConfiguration({ databasePath, hostInfo, port }) {
  return {
    databasePath,
    port,
    hostOrigin: hostInfo.origin,
    keyId: hostInfo.keyId,
    publicKeyPem: hostInfo.publicKeyPem,
    decisionToken: DECISION_TOKEN,
    connectorToken: CONNECTOR_TOKEN,
  };
}

function effectContext(lease) {
  return {
    correlationId: lease.continuation.correlation_id,
    deliveryId: lease.delivery_id,
    eventId: lease.event_id,
    workflowId: lease.continuation.workflow_id,
  };
}

async function readPersistence(databasePath) {
  const buffers = [];
  for (const path of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) {
    try {
      buffers.push(await readFile(path));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return Buffer.concat(buffers);
}

async function unlinkIfPresent(path) {
  try {
    await unlink(path);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
