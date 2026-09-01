import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";

import { createInitialOperationsProfile } from "../../src/server/domain/operations-profile";
import { openFoundationDatabase, readFoundationGeneration } from "../../src/server/persistence/sqlite";
import {
  DEFAULT_OPERATIONS_DATABASE_PATH,
  OPERATIONS_SNAPSHOT_TABLE,
  OPERATIONS_SNAPSHOT_SCHEMA_VERSION,
  OperationsPersistenceError,
  OperationsStore,
} from "../../src/server/persistence/operations-store";

const TEST_DIRECTORY = join(process.cwd(), "var/test");
const RESET_AT = "2026-09-01T13:00:00.000Z";
let databaseSequence = 0;

test("opens an empty explicit database path and seeds one Operations snapshot", () => {
  const path = databasePath("fresh");
  try {
    const store = new OperationsStore({ databasePath: path, initialTimestamp: RESET_AT });
    try {
      const state = store.readState();
      assert.equal(existsSync(path), true);
      assert.equal(state.metadata.fixtureGeneration, 1);
      assert.equal(state.listings.length, 6);
      assert.equal(state.requests.length, 4);
      assert.equal(state.slots.length, 7);

      const database = new DatabaseSync(path);
      try {
        const tables = database
          .prepare("SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name")
          .all() as Array<{ name: string }>;
        assert.deepEqual(tables.map((table) => table.name), [OPERATIONS_SNAPSHOT_TABLE]);
        const row = database
          .prepare(`SELECT id, schema_version, fixture_generation, updated_at FROM ${OPERATIONS_SNAPSHOT_TABLE} WHERE id = 1`)
          .get() as {
            id: number;
            schema_version: number;
            fixture_generation: number;
            updated_at: string;
          };
        assert.deepEqual({ ...row }, {
          id: 1,
          schema_version: 1,
          fixture_generation: 1,
          updated_at: RESET_AT,
        });
      } finally {
        database.close();
      }
    } finally {
      store.close();
    }
  } finally {
    cleanup(path);
  }
});

test("rejects an existing Operations snapshot with an unexpected column", () => {
  const path = databasePath("unexpected-column");
  try {
    seedAndClose(path);
    mutateRow(path, (database) => {
      database.exec(`ALTER TABLE ${OPERATIONS_SNAPSHOT_TABLE} ADD COLUMN verifier_unexpected TEXT`);
    });
    expectPersistenceFailure(path);
  } finally {
    cleanup(path);
  }
});

test("rejects a same-column Operations snapshot without singleton and generation checks", () => {
  const path = databasePath("constraintless");
  try {
    const stateJson = JSON.stringify(createInitialOperationsProfile());
    const database = new DatabaseSync(path);
    try {
      database.exec(`CREATE TABLE ${OPERATIONS_SNAPSHOT_TABLE} (
        id INTEGER PRIMARY KEY,
        schema_version INTEGER NOT NULL,
        fixture_generation INTEGER NOT NULL,
        state_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`);
      const insert = database.prepare(`INSERT INTO ${OPERATIONS_SNAPSHOT_TABLE}
        (id, schema_version, fixture_generation, state_json, updated_at)
        VALUES (?, ?, ?, ?, ?)`);
      insert.run(1, OPERATIONS_SNAPSHOT_SCHEMA_VERSION, 1, stateJson, RESET_AT);
      insert.run(2, OPERATIONS_SNAPSHOT_SCHEMA_VERSION, 0, stateJson, RESET_AT);
      const rows = database
        .prepare(`SELECT id, fixture_generation FROM ${OPERATIONS_SNAPSHOT_TABLE} ORDER BY id`)
        .all() as Array<{ id: number; fixture_generation: number }>;
      assert.deepEqual(
        rows.map((row) => ({ ...row })),
        [
          { id: 1, fixture_generation: 1 },
          { id: 2, fixture_generation: 0 },
        ],
      );
    } finally {
      database.close();
    }
    expectPersistenceFailure(path);
  } finally {
    cleanup(path);
  }
});

test("reopen and clean-room reset reproduce the same records and metadata", () => {
  const firstPath = databasePath("reopen-a");
  const secondPath = databasePath("reopen-b");
  try {
    const first = new OperationsStore({ databasePath: firstPath, initialTimestamp: RESET_AT });
    const second = new OperationsStore({ databasePath: secondPath, initialTimestamp: RESET_AT });
    let firstReset;
    let secondReset;
    try {
      assert.deepEqual(first.readState(), second.readState());
      firstReset = first.reset(RESET_AT);
      secondReset = second.reset(RESET_AT);
      assert.equal(firstReset.generation, 2);
      assert.equal(secondReset.generation, 2);
      assert.deepEqual(firstReset.state, secondReset.state);
    } finally {
      first.close();
      second.close();
    }

    const reopenedFirst = new OperationsStore({ databasePath: firstPath, initialTimestamp: RESET_AT });
    const reopenedSecond = new OperationsStore({ databasePath: secondPath, initialTimestamp: RESET_AT });
    try {
      assert.deepEqual(reopenedFirst.readState(), firstReset!.state);
      assert.deepEqual(reopenedSecond.readState(), secondReset!.state);
      assert.deepEqual(reopenedFirst.readState(), reopenedSecond.readState());
    } finally {
      reopenedFirst.close();
      reopenedSecond.close();
    }
  } finally {
    cleanup(firstPath);
    cleanup(secondPath);
  }
});

test("Operations reset preserves its file and does not alter an independent relay database", () => {
  const operationsPath = databasePath("isolation-operations");
  const relayPath = databasePath("isolation-relay");
  try {
    const operations = new OperationsStore({ databasePath: operationsPath, initialTimestamp: RESET_AT });
    const relay = openFoundationDatabase(relayPath);
    try {
      assert.equal(readFoundationGeneration(relay.database), 1);
    } finally {
      relay.database.close();
    }

    const operationsInode = statSync(operationsPath).ino;
    const relayBefore = readFileSync(relayPath);
    try {
      const reset = operations.reset(RESET_AT);
      assert.equal(reset.generation, 2);
      assert.equal(statSync(operationsPath).ino, operationsInode);
    } finally {
      operations.close();
    }

    const reopenedRelay = openFoundationDatabase(relayPath);
    try {
      assert.equal(readFoundationGeneration(reopenedRelay.database), 1);
    } finally {
      reopenedRelay.database.close();
    }
    assert.deepEqual(readFileSync(relayPath), relayBefore);
  } finally {
    cleanup(operationsPath);
    cleanup(relayPath);
  }
});

test("corrupt, incompatible, or relationally invalid snapshots fail without fallback", () => {
  const corruptPath = databasePath("corrupt");
  const schemaPath = databasePath("schema");
  const statePath = databasePath("state");
  const closedPath = databasePath("closed");
  try {
    const closedStore = new OperationsStore({ databasePath: closedPath, initialTimestamp: RESET_AT });
    closedStore.close();
    assert.throws(
      () => closedStore.readState(),
      (error: unknown) => error instanceof OperationsPersistenceError,
    );

    seedAndClose(corruptPath);
    mutateRow(corruptPath, (database) => {
      database.prepare(`UPDATE ${OPERATIONS_SNAPSHOT_TABLE} SET state_json = ? WHERE id = 1`).run("{not-json");
    });
    expectPersistenceFailure(corruptPath);

    seedAndClose(schemaPath);
    mutateRow(schemaPath, (database) => {
      database.prepare(`UPDATE ${OPERATIONS_SNAPSHOT_TABLE} SET schema_version = 999 WHERE id = 1`).run();
    });
    expectPersistenceFailure(schemaPath);

    seedAndClose(statePath);
    mutateRow(statePath, (database) => {
      const row = database
        .prepare(`SELECT state_json FROM ${OPERATIONS_SNAPSHOT_TABLE} WHERE id = 1`)
        .get() as { state_json: string };
      const state = JSON.parse(row.state_json) as {
        requests: Array<{ selectedSlotId?: string }>;
      };
      state.requests[0]!.selectedSlotId = "missing-slot";
      database
        .prepare(`UPDATE ${OPERATIONS_SNAPSHOT_TABLE} SET state_json = ? WHERE id = 1`)
        .run(JSON.stringify(state));
    });
    expectPersistenceFailure(statePath);

  } finally {
    cleanup(corruptPath);
    cleanup(schemaPath);
    cleanup(statePath);
    cleanup(closedPath);
  }
});

test("failed reset rolls back records and generation without replacing the database", () => {
  const path = databasePath("reset-rollback");
  try {
    seedAndClose(path);
    const triggerDatabase = new DatabaseSync(path);
    try {
      triggerDatabase.exec(`CREATE TRIGGER fail_operations_reset
        BEFORE UPDATE ON ${OPERATIONS_SNAPSHOT_TABLE}
        BEGIN SELECT RAISE(ABORT, 'test reset failure'); END;`);
    } finally {
      triggerDatabase.close();
    }

    const store = new OperationsStore({ databasePath: path, initialTimestamp: RESET_AT });
    const before = store.readState();
    const inode = statSync(path).ino;
    try {
      assert.throws(
        () => store.reset(RESET_AT),
        (error: unknown) => error instanceof OperationsPersistenceError
          && error.message === "Operations persistence failed"
          && !error.message.includes(path)
          && !error.message.includes("SQL"),
      );
    } finally {
      store.close();
    }

    const reopened = new OperationsStore({ databasePath: path, initialTimestamp: RESET_AT });
    try {
      assert.deepEqual(reopened.readState(), before);
      assert.equal(statSync(path).ino, inode);
    } finally {
      reopened.close();
    }
  } finally {
    cleanup(path);
  }
});

test("an empty SQLite file is seedable but a non-Operations table is incompatible", () => {
  const emptyPath = databasePath("empty-file");
  const incompatiblePath = databasePath("incompatible-table");
  try {
    writeFileSync(emptyPath, "", "utf8");
    const emptyStore = new OperationsStore({ databasePath: emptyPath, initialTimestamp: RESET_AT });
    try {
      assert.equal(emptyStore.readState().metadata.fixtureGeneration, 1);
    } finally {
      emptyStore.close();
    }

    const database = new DatabaseSync(incompatiblePath);
    try {
      database.exec("CREATE TABLE unrelated (id INTEGER PRIMARY KEY)");
    } finally {
      database.close();
    }
    expectPersistenceFailure(incompatiblePath);
  } finally {
    cleanup(emptyPath);
    cleanup(incompatiblePath);
  }
});

function databasePath(label: string): string {
  mkdirSync(TEST_DIRECTORY, { recursive: true });
  databaseSequence += 1;
  return join(TEST_DIRECTORY, `operations-${process.pid}-${databaseSequence}-${label}-${randomUUID()}.sqlite`);
}

function seedAndClose(path: string): void {
  const store = new OperationsStore({ databasePath: path, initialTimestamp: RESET_AT });
  store.close();
}

function mutateRow(path: string, mutate: (database: DatabaseSync) => void): void {
  const database = new DatabaseSync(path);
  try {
    mutate(database);
  } finally {
    database.close();
  }
}

function expectPersistenceFailure(path: string): void {
  assert.throws(
    () => new OperationsStore({ databasePath: path, initialTimestamp: RESET_AT }),
    (error: unknown) => error instanceof OperationsPersistenceError
      && error.message === "Operations persistence failed"
      && !error.message.includes(path)
      && !error.message.includes("SQL"),
  );
}

function cleanup(path: string): void {
  if (existsSync(path)) {
    rmSync(path);
  }
}

assert.equal(DEFAULT_OPERATIONS_DATABASE_PATH.endsWith("var/rightspot-operations.sqlite"), true);
