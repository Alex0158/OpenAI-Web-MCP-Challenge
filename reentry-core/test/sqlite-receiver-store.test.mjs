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
  assert.equal(probe.prepare("PRAGMA user_version").get().user_version, 1);
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

async function unlinkIfPresent(path) {
  try {
    await unlink(path);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
