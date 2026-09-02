import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";

import {
  WorkflowPersistenceError,
  WorkflowStore,
  WORKFLOW_SNAPSHOT_TABLE,
  WORKFLOW_SNAPSHOT_SCHEMA_VERSION,
} from "../../src/server/persistence/workflow-store";

const NOW = "2026-09-02T09:00:00.000Z";
const TEST_DIRECTORY = join(process.cwd(), "var/test");
let sequence = 0;

mkdirSync(TEST_DIRECTORY, { recursive: true });

test("v1 workflow snapshots migrate additively to an empty Favourite collection", () => {
  const path = databasePath("migration");
  const seeded = new WorkflowStore({ databasePath: path, initialTimestamp: NOW });
  const state = seeded.readState();
  seeded.close();

  const database = new DatabaseSync(path);
  const row = database
    .prepare(`SELECT state_json, updated_at FROM ${WORKFLOW_SNAPSHOT_TABLE} WHERE id = 1`)
    .get() as { state_json: string; updated_at: string };
  const legacyState = JSON.parse(row.state_json) as Record<string, unknown>;
  delete legacyState.favourites;
  database
    .prepare(`UPDATE ${WORKFLOW_SNAPSHOT_TABLE}
      SET schema_version = 1, state_json = ?, updated_at = ? WHERE id = 1`)
    .run(JSON.stringify(legacyState), row.updated_at);
  database.close();

  const migrated = new WorkflowStore({ databasePath: path, initialTimestamp: NOW });
  const migratedState = migrated.readState();
  assert.deepEqual(migratedState.favourites, []);
  assert.deepEqual(migratedState.listings, state.listings);
  assert.equal(migratedState.fixtureGeneration, state.fixtureGeneration);
  migrated.close();

  const verify = new DatabaseSync(path);
  const schema = verify
    .prepare(`SELECT schema_version FROM ${WORKFLOW_SNAPSHOT_TABLE} WHERE id = 1`)
    .get() as { schema_version: number };
  assert.equal(schema.schema_version, WORKFLOW_SNAPSHOT_SCHEMA_VERSION);
  verify.close();
});

test("reset deterministically clears Favourite state and advances the fixture generation", () => {
  const path = databasePath("reset");
  const store = new WorkflowStore({ databasePath: path, initialTimestamp: NOW });
  const before = store.readState();
  const reset = store.reset("2026-09-02T10:00:00.000Z");
  assert.equal(reset.generation, before.fixtureGeneration);
  assert.deepEqual(reset.state.favourites, []);
  assert.equal(reset.state.request, null);
  const secondReset = store.reset("2026-09-02T11:00:00.000Z");
  assert.equal(secondReset.generation, before.fixtureGeneration + 1);
  store.close();
});

test("v1 migration rejects missing or malformed processed-command ledgers", () => {
  for (const [label, mutate] of [
    ["missing", (state: Record<string, unknown>) => { delete state.processedCommands; }],
    ["malformed", (state: Record<string, unknown>) => { state.processedCommands = {}; }],
  ] as const) {
    const path = databasePath(label);
    const seeded = new WorkflowStore({ databasePath: path, initialTimestamp: NOW });
    seeded.close();
    const database = new DatabaseSync(path);
    const row = database
      .prepare(`SELECT state_json, updated_at FROM ${WORKFLOW_SNAPSHOT_TABLE} WHERE id = 1`)
      .get() as { state_json: string; updated_at: string };
    const state = JSON.parse(row.state_json) as Record<string, unknown>;
    mutate(state);
    database
      .prepare(`UPDATE ${WORKFLOW_SNAPSHOT_TABLE}
        SET schema_version = 1, state_json = ?, updated_at = ? WHERE id = 1`)
      .run(JSON.stringify(state), row.updated_at);
    database.close();

    assert.throws(
      () => new WorkflowStore({ databasePath: path, initialTimestamp: NOW }),
      (error: unknown) => error instanceof WorkflowPersistenceError,
      label,
    );
  }
});

function databasePath(label: string): string {
  sequence += 1;
  return join(TEST_DIRECTORY, `favourites-persistence-${process.pid}-${sequence}-${label}.sqlite`);
}
