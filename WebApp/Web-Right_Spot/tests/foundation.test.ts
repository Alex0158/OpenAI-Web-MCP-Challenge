import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import assert from "node:assert/strict";

import { checkHealth } from "../src/server/application/health";
import { resetFoundationDatabase } from "../src/server/persistence/reset";
import {
  openFoundationDatabase,
  readFoundationGeneration,
} from "../src/server/persistence/sqlite";

const TEST_DATABASE_DIRECTORY = join(process.cwd(), "var/test");

function isolatedDatabasePath(label: string): string {
  mkdirSync(TEST_DATABASE_DIRECTORY, { recursive: true });
  return join(TEST_DATABASE_DIRECTORY, `${label}-${randomUUID()}.sqlite`);
}

test("healthy health response uses the application and persistence boundary", () => {
  const databasePath = isolatedDatabasePath("health-ready");
  const result = checkHealth(databasePath);

  assert.equal(result.status, 200);
  assert.deepEqual(result.payload, { ok: true, service: "rightspot" });
});

test("readiness failure is neutral and does not leak diagnostics", () => {
  const databasePath = isolatedDatabasePath("health-failure");
  writeFileSync(databasePath, "not a sqlite database", "utf8");

  const result = checkHealth(databasePath);
  const serialized = JSON.stringify(result.payload);

  assert.equal(result.status, 503);
  assert.deepEqual(result.payload, { ok: false, service: "rightspot" });
  assert.equal(serialized.includes(databasePath), false);
  assert.equal(serialized.includes("stack"), false);
  assert.equal(serialized.includes("sqlite"), false);
  assert.throws(() => openFoundationDatabase(databasePath));
});

test("a fresh database starts at generation one and reset is repeatable", () => {
  const databasePath = isolatedDatabasePath("reset");
  const firstStore = openFoundationDatabase(databasePath);
  assert.equal(readFoundationGeneration(firstStore.database), 1);
  firstStore.database.close();

  const initialStat = statSync(databasePath);
  assert.equal(resetFoundationDatabase(databasePath), 1);
  assert.equal(resetFoundationDatabase(databasePath), 2);
  const reopenedStore = openFoundationDatabase(databasePath);
  assert.equal(readFoundationGeneration(reopenedStore.database), 2);
  reopenedStore.database.close();
  assert.equal(statSync(databasePath).ino, initialStat.ino);
});

test("opening an existing database and reading health do not advance generation", () => {
  const databasePath = isolatedDatabasePath("no-advance");
  assert.equal(resetFoundationDatabase(databasePath), 1);

  const existingStore = openFoundationDatabase(databasePath);
  assert.equal(readFoundationGeneration(existingStore.database), 1);
  existingStore.database.close();

  const result = checkHealth(databasePath);
  assert.equal(result.status, 200);

  const afterHealth = openFoundationDatabase(databasePath);
  assert.equal(readFoundationGeneration(afterHealth.database), 1);
  afterHealth.database.close();
});

test("the foundation has no business tables and no in-memory fallback", () => {
  const databasePath = isolatedDatabasePath("schema");
  const store = openFoundationDatabase(databasePath);
  const tables = store.database
    .prepare("SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name")
    .all() as Array<{ name: string }>;

  assert.deepEqual(tables.map((table) => table.name), ["foundation_metadata"]);
  assert.throws(() => openFoundationDatabase(TEST_DATABASE_DIRECTORY));
  store.database.close();
});

test("failed file-backed reset does not expose a fallback or diagnostic", () => {
  const databasePath = isolatedDatabasePath("reset-failure");
  writeFileSync(databasePath, "not a sqlite database", "utf8");

  assert.throws(() => resetFoundationDatabase(databasePath));
  assert.equal(readFileSync(databasePath, "utf8"), "not a sqlite database");
});
