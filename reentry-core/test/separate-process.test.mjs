import assert from "node:assert/strict";
import { fork } from "node:child_process";
import { mkdtemp, readFile, rmdir, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const CONNECTOR_TOKEN = "connector_process_fixture_token";
const DECISION_TOKEN = "decision_process_fixture_token";
const CLAIM_TOKEN = Buffer.alloc(32, 11).toString("base64url");
const WRONG_EFFECT_TOKEN = "wrong_effect_process_fixture_token";
const PROCESS_TIMEOUT_MS = 5_000;

test("independent Host, Receiver, and Connector processes preserve durable replay and effect acknowledgement", async (t) => {
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

  await receiver.close();
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

  await receiver.close();
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

  const effect = await host.request("applyEffect", { lease: replayedClaim.lease });
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
  const committedAfterResponseLoss = await receiver.request("inspectDelivery", {
    eventId: firstEvent.eventId,
  });
  assert.equal(committedAfterResponseLoss.status, "acknowledged");
  assert.equal(committedAfterResponseLoss.effect_id, effect.attestation.effect_id);

  await receiver.close();
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

function spawnFixture(moduleUrl) {
  const child = fork(moduleUrl, [], {
    execArgv: [],
    serialization: "json",
    stdio: ["ignore", "ignore", "pipe", "ipc"],
  });
  let nextId = 0;
  let exited = false;
  let stderr = "";
  const pending = new Map();
  const exitPromise = new Promise((resolve) => {
    child.once("exit", (code, signal) => {
      exited = true;
      const reason = `fixture exited (${code ?? signal ?? "unknown"})${stderr ? `: ${stderr}` : ""}`;
      for (const entry of pending.values()) {
        clearTimeout(entry.timer);
        entry.reject(new Error(reason));
      }
      pending.clear();
      resolve();
    });
  });
  child.stderr.on("data", (chunk) => {
    stderr = `${stderr}${chunk}`.slice(-8_192);
  });
  child.on("message", (message) => {
    const entry = pending.get(message?.id);
    if (!entry) return;
    pending.delete(message.id);
    clearTimeout(entry.timer);
    if (message.ok) {
      entry.resolve(message.result);
      return;
    }
    const error = new Error(`fixture command failed: ${message.error?.code ?? "unknown"}`);
    error.code = message.error?.code;
    error.statusCode = message.error?.statusCode;
    entry.reject(error);
  });

  return {
    request(command, payload = undefined) {
      if (exited || !child.connected) return Promise.reject(new Error("fixture is not connected"));
      const id = ++nextId;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`fixture command timed out: ${command}`));
        }, PROCESS_TIMEOUT_MS);
        pending.set(id, { resolve, reject, timer });
        child.send({ id, command, payload });
      });
    },

    async close() {
      if (exited) return;
      await this.request("stop");
      await exitPromise;
    },

    async terminate() {
      if (exited) return;
      child.kill("SIGTERM");
      await exitPromise;
    },
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
