import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

import {
  createInitialOperationsProfile,
  OperationsProfileValidationError,
  validateOperationsInstant,
  validateOperationsProfileState,
} from "../domain/operations-profile";
import {
  OPERATIONS_SCHEMA_VERSION,
  type OperationsProfileState,
} from "../domain/operations-profile-types";

export const DEFAULT_OPERATIONS_DATABASE_PATH = resolve(
  process.cwd(),
  "var/rightspot-operations.sqlite",
);
export const OPERATIONS_SNAPSHOT_TABLE = "rightspot_operations_snapshot";
export const OPERATIONS_SNAPSHOT_SCHEMA_VERSION = OPERATIONS_SCHEMA_VERSION;
export const DEFAULT_OPERATIONS_SNAPSHOT_TIMESTAMP = "1970-01-01T00:00:00.000Z";

const OPERATIONS_SNAPSHOT_SCHEMA = `
  CREATE TABLE IF NOT EXISTS ${OPERATIONS_SNAPSHOT_TABLE} (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    schema_version INTEGER NOT NULL,
    fixture_generation INTEGER NOT NULL CHECK (fixture_generation >= 1),
    state_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;
const OPERATIONS_SNAPSHOT_EXPECTED_SCHEMA_SQL = normalizeSchemaSql(
  OPERATIONS_SNAPSHOT_SCHEMA.replace("CREATE TABLE IF NOT EXISTS", "CREATE TABLE"),
);

type OperationsSnapshotTableInfoRow = {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: unknown;
  pk: number;
};

type OperationsSnapshotSchemaRow = {
  sql: string | null;
};

const OPERATIONS_SNAPSHOT_COLUMNS = [
  { name: "id", type: "INTEGER", notnull: 0, dfltValue: null, pk: 1 },
  { name: "schema_version", type: "INTEGER", notnull: 1, dfltValue: null, pk: 0 },
  { name: "fixture_generation", type: "INTEGER", notnull: 1, dfltValue: null, pk: 0 },
  { name: "state_json", type: "TEXT", notnull: 1, dfltValue: null, pk: 0 },
  { name: "updated_at", type: "TEXT", notnull: 1, dfltValue: null, pk: 0 },
] as const;

type OperationsSnapshotRow = {
  id: number;
  schema_version: number;
  fixture_generation: number;
  state_json: string;
  updated_at: string;
};

/** Server-side composition options; transport or client input must not supply these values. */
export type OperationsStoreOptions = {
  databasePath?: string;
  initialTimestamp?: string;
};

export type OperationsResetResult = {
  generation: number;
  state: OperationsProfileState;
};

export class OperationsPersistenceError extends Error {
  readonly code = "OPERATIONS_PERSISTENCE_ERROR" as const;

  constructor() {
    super("Operations persistence failed");
    this.name = "OperationsPersistenceError";
  }

  toJSON(): { code: "OPERATIONS_PERSISTENCE_ERROR"; message: string } {
    return { code: this.code, message: this.message };
  }
}

export class OperationsStore {
  private database: DatabaseSync | null = null;
  private readonly initialTimestamp: string;

  constructor(options: OperationsStoreOptions | string = {}) {
    const normalized = typeof options === "string"
      ? { databasePath: options }
      : options;
    this.initialTimestamp = normalized.initialTimestamp ?? DEFAULT_OPERATIONS_SNAPSHOT_TIMESTAMP;

    let database: DatabaseSync | null = null;
    try {
      validateOperationsInstant(this.initialTimestamp, "Operations snapshot timestamp");
      const databasePath = normalized.databasePath ?? DEFAULT_OPERATIONS_DATABASE_PATH;
      const path = resolve(databasePath);
      mkdirSync(dirname(path), { recursive: true });
      database = new DatabaseSync(path);
      this.database = database;
      this.initialize();
    } catch (error) {
      this.database = null;
      try {
        database?.close();
      } catch {
        // Preserve the neutral persistence boundary.
      }
      if (error instanceof OperationsPersistenceError) {
        throw error;
      }
      throw new OperationsPersistenceError();
    }
  }

  readState(): OperationsProfileState {
    return this.transaction((database) => {
      const row = readSnapshotRow(database);
      if (!row) {
        throw new OperationsPersistenceError();
      }
      return readSnapshotFromRow(row);
    });
  }

  reset(updatedAt: string = DEFAULT_OPERATIONS_SNAPSHOT_TIMESTAMP): OperationsResetResult {
    validateOperationsInstant(updatedAt, "Operations reset timestamp");
    return this.transaction((database) => {
      const current = readSnapshotFromRow(readSnapshotRow(database));
      const generation = current.metadata.fixtureGeneration + 1;
      const state = createInitialOperationsProfile(generation);
      writeSnapshot(database, state, updatedAt);
      return { generation, state: clone(state) };
    });
  }

  close(): void {
    const database = this.database;
    this.database = null;
    if (!database) {
      return;
    }

    try {
      database.close();
    } catch {
      throw new OperationsPersistenceError();
    }
  }

  private initialize(): void {
    const database = this.requireDatabase();
    const existingTables = readUserTables(database);

    if (existingTables.length === 0) {
      try {
        database.exec(OPERATIONS_SNAPSHOT_SCHEMA);
      } catch {
        throw new OperationsPersistenceError();
      }
      this.transaction((connection) => {
        writeSnapshot(
          connection,
          createInitialOperationsProfile(),
          this.initialTimestamp,
        );
      });
      return;
    }

    if (
      existingTables.length !== 1
      || existingTables[0] !== OPERATIONS_SNAPSHOT_TABLE
    ) {
      throw new OperationsPersistenceError();
    }

    validateOperationsSnapshotSchema(database);
    try {
      database.exec(OPERATIONS_SNAPSHOT_SCHEMA);
    } catch {
      throw new OperationsPersistenceError();
    }
    this.transaction((connection) => {
      readSnapshotFromRow(readSnapshotRow(connection));
    });
  }

  private requireDatabase(): DatabaseSync {
    if (!this.database) {
      throw new OperationsPersistenceError();
    }
    return this.database;
  }

  private transaction<T>(operation: (database: DatabaseSync) => T): T {
    const database = this.requireDatabase();
    let started = false;

    try {
      database.exec("BEGIN IMMEDIATE");
      started = true;
      const result = operation(database);
      database.exec("COMMIT");
      started = false;
      return result;
    } catch (error) {
      if (started) {
        try {
          database.exec("ROLLBACK");
        } catch {
          // Preserve the neutral persistence boundary.
        }
      }
      if (error instanceof OperationsPersistenceError) {
        throw error;
      }
      if (error instanceof OperationsProfileValidationError) {
        throw new OperationsPersistenceError();
      }
      throw new OperationsPersistenceError();
    }
  }
}

function readUserTables(database: DatabaseSync): string[] {
  const rows = database
    .prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all() as Array<{ name: string }>;
  return rows.map((row) => row.name);
}

function validateOperationsSnapshotSchema(database: DatabaseSync): void {
  let columns: OperationsSnapshotTableInfoRow[];
  let schema: OperationsSnapshotSchemaRow | undefined;
  try {
    columns = database
      .prepare(`PRAGMA table_info(${OPERATIONS_SNAPSHOT_TABLE})`)
      .all() as OperationsSnapshotTableInfoRow[];
    schema = database
      .prepare("SELECT sql FROM sqlite_schema WHERE type = 'table' AND name = ?")
      .get(OPERATIONS_SNAPSHOT_TABLE) as OperationsSnapshotSchemaRow | undefined;
  } catch {
    throw new OperationsPersistenceError();
  }

  const shapeIsValid = columns.length === OPERATIONS_SNAPSHOT_COLUMNS.length
    && columns.every((column, index) => {
      const expected = OPERATIONS_SNAPSHOT_COLUMNS[index];
      return expected !== undefined
        && column.cid === index
        && column.name === expected.name
        && column.type === expected.type
        && column.notnull === expected.notnull
        && column.dflt_value === expected.dfltValue
        && column.pk === expected.pk;
    });
  const constraintsAreValid = typeof schema?.sql === "string"
    && normalizeSchemaSql(schema.sql) === OPERATIONS_SNAPSHOT_EXPECTED_SCHEMA_SQL;

  if (!shapeIsValid || !constraintsAreValid) {
    throw new OperationsPersistenceError();
  }
}

function normalizeSchemaSql(sql: string): string {
  return sql
    .replace(/\s+/g, " ")
    .trim()
    .replace(/;$/, "")
    .toLowerCase();
}

function readSnapshotRow(
  database: DatabaseSync,
): OperationsSnapshotRow | undefined {
  return database
    .prepare(`SELECT id, schema_version, fixture_generation, state_json, updated_at
      FROM ${OPERATIONS_SNAPSHOT_TABLE} WHERE id = 1`)
    .get() as OperationsSnapshotRow | undefined;
}

function readSnapshotFromRow(
  row: OperationsSnapshotRow | undefined,
): OperationsProfileState {
  if (
    !row
    || row.id !== 1
    || row.schema_version !== OPERATIONS_SNAPSHOT_SCHEMA_VERSION
    || !Number.isInteger(row.fixture_generation)
    || row.fixture_generation < 1
    || typeof row.state_json !== "string"
    || row.state_json.length === 0
    || typeof row.updated_at !== "string"
    || row.updated_at.length === 0
  ) {
    throw new OperationsPersistenceError();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(row.state_json);
  } catch {
    throw new OperationsPersistenceError();
  }

  try {
    validateOperationsProfileState(parsed);
  } catch {
    throw new OperationsPersistenceError();
  }

  if (parsed.metadata.fixtureGeneration !== row.fixture_generation) {
    throw new OperationsPersistenceError();
  }

  try {
    validateOperationsInstant(row.updated_at, "Operations snapshot updatedAt");
  } catch {
    throw new OperationsPersistenceError();
  }

  return clone(parsed);
}

function writeSnapshot(
  database: DatabaseSync,
  state: OperationsProfileState,
  updatedAt: string,
): void {
  validateOperationsProfileState(state);
  validateOperationsInstant(updatedAt, "Operations snapshot updatedAt");
  const serialized = JSON.stringify(state);
  if (!serialized) {
    throw new OperationsPersistenceError();
  }

  database
    .prepare(`INSERT INTO ${OPERATIONS_SNAPSHOT_TABLE}
      (id, schema_version, fixture_generation, state_json, updated_at)
      VALUES (1, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        schema_version = excluded.schema_version,
        fixture_generation = excluded.fixture_generation,
        state_json = excluded.state_json,
        updated_at = excluded.updated_at`)
    .run(
      OPERATIONS_SNAPSHOT_SCHEMA_VERSION,
      state.metadata.fixtureGeneration,
      serialized,
      updatedAt,
    );
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
