import assert from "node:assert/strict";
import { mkdtemp, rmdir, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { SqliteReceiverStore } from "../src/sqlite-receiver-store.mjs";

function pendingChallenge() {
  return {
    challenge_id: "challenge_001",
    manifest_id: "manifest_001",
    manifest_json: "{}",
    expected_origin: "https://host.example",
    effective_expires_at: "2026-08-31T03:25:00.000Z",
    status: "pending",
    decision_id: null,
    decision_action: null,
    subject_id: null,
    created_at: "2026-08-31T03:05:00.000Z",
    decided_at: null,
  };
}

test("SQLite store fences writes inside synchronous non-nested transactions", () => {
  const store = new SqliteReceiverStore({ filename: ":memory:" });
  const challenge = pendingChallenge();

  assert.throws(
    () => store.insertChallenge(challenge),
    /writes require an active transaction/,
  );
  assert.throws(
    () => store.transaction(() => store.transaction(() => undefined)),
    /Nested SQLite Receiver transactions are not supported/,
  );
  assert.throws(
    () => store.transaction((transaction) => {
      transaction.insertChallenge(challenge);
      return Promise.resolve();
    }),
    /transaction callback must be synchronous/,
  );
  assert.equal(store.getChallengeById(challenge.challenge_id), undefined);

  store.transaction((transaction) => transaction.insertChallenge(challenge));
  assert.deepEqual(store.getChallengeById(challenge.challenge_id), challenge);
  store.close();
  store.close();
  assert.throws(() => store.getChallengeById(challenge.challenge_id), /store is closed/);
});

test("file store persists schema version, uses WAL, and rejects unknown databases", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "webmcp-sqlite-schema-"));
  const validPath = join(directory, "valid.sqlite");
  const futurePath = join(directory, "future.sqlite");
  const unversionedPath = join(directory, "unversioned.sqlite");
  t.after(async () => {
    for (const filename of [validPath, futurePath, unversionedPath]) {
      for (const path of [filename, `${filename}-wal`, `${filename}-shm`]) {
        await unlinkIfPresent(path);
      }
    }
    await rmdir(directory);
  });

  const store = new SqliteReceiverStore({ filename: validPath });
  const probe = new DatabaseSync(validPath);
  assert.equal(probe.prepare("PRAGMA user_version").get().user_version, 2);
  assert.equal(probe.prepare("PRAGMA journal_mode").get().journal_mode, "wal");
  probe.close();
  store.close();

  const future = new DatabaseSync(futurePath);
  future.exec("PRAGMA user_version = 99");
  future.close();
  assert.throws(
    () => new SqliteReceiverStore({ filename: futurePath }),
    /Unsupported SQLite Receiver schema version: 99/,
  );

  const unversioned = new DatabaseSync(unversionedPath);
  unversioned.exec("CREATE TABLE unrelated (id INTEGER PRIMARY KEY)");
  unversioned.close();
  assert.throws(
    () => new SqliteReceiverStore({ filename: unversionedPath }),
    /Unversioned SQLite Receiver database is not empty/,
  );
});

test("schema version 1 migrates pending deliveries atomically to version 2", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "webmcp-sqlite-migration-"));
  const filename = join(directory, "receiver.sqlite");
  let store;
  t.after(async () => {
    store?.close();
    for (const path of [filename, `${filename}-wal`, `${filename}-shm`]) {
      await unlinkIfPresent(path);
    }
    await rmdir(directory);
  });

  store = new SqliteReceiverStore({ filename });
  store.transaction((transaction) => {
    transaction.insertChallenge(pendingChallenge());
    transaction.insertGrant({
      grant_id: "grant_001",
      challenge_id: "challenge_001",
      manifest_id: "manifest_001",
      binding_id: "binding_001",
      subject_id: "subject_001",
      delivery_target_id: "target_001",
      correlation_id: "correlation_001",
      issuer_origin: "https://host.example",
      workflow_type: "test.workflow",
      workflow_id: "workflow_001",
      event_type: "workflow.ready",
      canonical_url: "https://host.example/workflows/workflow_001",
      expires_at: "2026-08-31T03:25:00.000Z",
      human_boundary: "explicit_receiver_consent",
      runs_remaining: 0,
      revoked_at: null,
      receipt_json: "{}",
      created_at: "2026-08-31T03:05:00.000Z",
    });
    transaction.insertEvent({
      event_id: "event_001",
      grant_id: "grant_001",
      canonical_body: "{}",
      acceptance_json: "{}",
      received_at: "2026-08-31T03:06:00.000Z",
    });
    transaction.insertDelivery({
      delivery_id: "delivery_001",
      event_id: "event_001",
      grant_id: "grant_001",
      delivery_target_id: "target_001",
      status: "pending",
      maximum_attempts: 1,
      created_at: "2026-08-31T03:06:00.000Z",
    });
  });
  store.close();
  store = undefined;

  const legacy = new DatabaseSync(filename);
  legacy.exec("DROP TABLE receiver_delivery_attempts");
  legacy.exec("DROP TABLE receiver_delivery_states");
  legacy.exec("DROP INDEX receiver_deliveries_target_order");
  legacy.exec("PRAGMA user_version = 1");
  legacy.close();

  store = new SqliteReceiverStore({ filename });
  const migrated = store.getDeliveryByEventId("event_001");
  assert.equal(migrated.status, "pending");
  assert.equal(migrated.maximum_attempts, 1);
  assert.equal(migrated.current_attempt, 0);
  assert.equal(migrated.current_lease_token_digest, null);

  const probe = new DatabaseSync(filename);
  assert.equal(probe.prepare("PRAGMA user_version").get().user_version, 2);
  assert.equal(
    probe.prepare("SELECT count(*) AS count FROM receiver_delivery_states").get().count,
    1,
  );
  assert.equal(
    probe.prepare("SELECT count(*) AS count FROM receiver_delivery_attempts").get().count,
    0,
  );
  probe.close();
});

async function unlinkIfPresent(path) {
  try {
    await unlink(path);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
