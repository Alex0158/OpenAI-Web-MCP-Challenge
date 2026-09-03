import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, readFile, rm, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { spawnProfileProcess } from "../conformance/process-rpc.mjs";

const CONNECTOR_TOKEN = "standing_fresh_process_connector_token";
const DECISION_TOKEN = "standing_fresh_process_decision_token";
const CONTROL_TOKEN = "standing_fresh_process_control_token";
const EFFECT_TOKEN = "standing_fresh_process_effect_token";

test("standing pending Delivery survives OS termination and fresh-process recovery", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "webmcp-standing-fresh-process-"));
  const databasePath = join(directory, "receiver.sqlite");
  const keys = generateKeyPairSync("ed25519");
  const privateKeyPem = keys.privateKey.export({ type: "pkcs8", format: "pem" });
  const publicKeyPem = keys.publicKey.export({ type: "spki", format: "pem" });
  const fixtureUrl = new URL("./standing-process-fixtures/core-process.mjs", import.meta.url);
  let child;

  t.after(async () => {
    if (child) await child.terminate();
    for (const path of persistencePaths(databasePath)) await unlinkIfPresent(path);
    await rm(directory, { recursive: true, force: true });
  });

  child = spawnProcess(fixtureUrl);
  const firstStart = await child.request("start", {
    databasePath,
    privateKeyPem,
    publicKeyPem,
  });
  assert.notEqual(firstStart.pid, globalThis.process.pid);
  assert.equal(firstStart.sqliteLoaded, true);

  const prepared = await child.request("prepare");
  assert.equal(prepared.approval.status, "approved");
  assert.equal(prepared.approval.binding.last_event_sequence, 0);
  assert.equal(prepared.acceptance.accepted, true);
  assert.equal(prepared.acceptance.duplicate, false);

  const beforeCrash = await child.request("inspect", {
    bindingId: prepared.approval.binding.binding_id,
  });
  assert.equal(beforeCrash.last_event_sequence, 1);
  assert.equal(beforeCrash.active_activations, 1);
  assert.equal(beforeCrash.status, "active");

  await assert.rejects(child.request("crash"), { code: "profile_process_exited" });
  assert.deepEqual(await child.terminate(), { code: null, signal: "SIGKILL" });
  child = undefined;

  const persisted = await readPersistence(databasePath);
  assert.equal(persisted.includes(Buffer.from(CONNECTOR_TOKEN)), false);
  assert.equal(persisted.includes(Buffer.from(DECISION_TOKEN)), false);
  assert.equal(persisted.includes(Buffer.from(CONTROL_TOKEN)), false);
  assert.equal(persisted.includes(Buffer.from(prepared.claimToken)), false);
  assert.equal(persisted.includes(Buffer.from(EFFECT_TOKEN)), false);

  child = spawnProcess(fixtureUrl);
  const secondStart = await child.request("start", {
    databasePath,
    privateKeyPem,
    publicKeyPem,
  });
  assert.notEqual(secondStart.pid, firstStart.pid);
  assert.equal(secondStart.sqliteLoaded, true);

  const afterRestart = await child.request("inspect", {
    bindingId: prepared.approval.binding.binding_id,
  });
  assert.deepEqual(
    {
      status: afterRestart.status,
      last_event_sequence: afterRestart.last_event_sequence,
      active_activations: afterRestart.active_activations,
    },
    { status: "active", last_event_sequence: 1, active_activations: 1 },
  );

  const claim = await child.request("claim", { claimToken: prepared.claimToken });
  assert.equal(claim.duplicate, false);
  assert.equal(claim.lease.attempt, 1);
  assert.equal(claim.lease.event_id, prepared.event.event_id);

  assert.deepEqual(await child.request("authorizeEffect", {
    lease: claim.lease,
    effectToken: EFFECT_TOKEN,
  }), { authorized: true });
  const acknowledgement = await child.request("acknowledge", {
    deliveryId: claim.lease.delivery_id,
    leaseToken: claim.lease.lease_token,
    effectToken: EFFECT_TOKEN,
  });
  assert.equal(acknowledgement.acknowledged, true);
  assert.equal(acknowledgement.duplicate, false);

  const afterAcknowledgement = await child.request("inspect", {
    bindingId: prepared.approval.binding.binding_id,
  });
  assert.equal(afterAcknowledgement.active_activations, 0);
  assert.equal(afterAcknowledgement.last_event_sequence, 1);

  const replay = await child.request("replay", { envelope: prepared.envelope });
  assert.equal(replay.accepted, true);
  assert.equal(replay.duplicate, true);
  await child.close();
  child = undefined;
});

function spawnProcess(moduleUrl) {
  return spawnProfileProcess(moduleUrl, { timeoutMs: 10_000 });
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
