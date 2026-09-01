import { DatabaseSync } from "node:sqlite";

import {
  DEFAULT_DATABASE_PATH,
  openFoundationDatabase,
  readFoundationGeneration,
  readResetMarker,
} from "./sqlite";
import { DomainError, isDomainError } from "../domain/errors";
import {
  createInitialWorkflowState,
  evaluateExpiry,
  executeCommand,
} from "../domain/workflow";
import {
  readAgentProjection as buildAgentProjection,
  readTenantProjection as buildTenantProjection,
} from "../domain/projections";
import type {
  Actor,
  AgentProjection,
  CommandOutcome,
  ProjectionOutcome,
  TenantProjection,
  WorkflowCommand,
  WorkflowState,
} from "../domain/types";

export const WORKFLOW_SNAPSHOT_TABLE = "rightspot_workflow_snapshot";
export const WORKFLOW_SNAPSHOT_SCHEMA_VERSION = 1;
export const DEFAULT_SNAPSHOT_TIMESTAMP = "1970-01-01T00:00:00.000Z";

const SNAPSHOT_VALIDATION_TIMESTAMP = "1970-01-01T00:00:00.000Z";
const SNAPSHOT_SCHEMA = `
  CREATE TABLE IF NOT EXISTS ${WORKFLOW_SNAPSHOT_TABLE} (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    schema_version INTEGER NOT NULL,
    fixture_generation INTEGER NOT NULL CHECK (fixture_generation >= 1),
    state_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

type SnapshotRow = {
  id: number;
  schema_version: number;
  fixture_generation: number;
  state_json: string;
  updated_at: string;
};

export type WorkflowStoreOptions = {
  databasePath?: string;
  initialTimestamp?: string;
};

export type WorkflowResetResult = {
  generation: number;
  state: WorkflowState;
};

export class WorkflowPersistenceError extends Error {
  readonly code = "PERSISTENCE_ERROR" as const;

  constructor() {
    super("Workflow persistence failed");
    this.name = "WorkflowPersistenceError";
  }

  toJSON(): { code: "PERSISTENCE_ERROR"; message: string } {
    return { code: this.code, message: this.message };
  }
}

export class WorkflowStore {
  private database: DatabaseSync | null;
  private readonly initialTimestamp: string;

  constructor(options: WorkflowStoreOptions | string = {}) {
    const databasePath = typeof options === "string" ? options : options.databasePath;
    this.initialTimestamp = typeof options === "string"
      ? DEFAULT_SNAPSHOT_TIMESTAMP
      : options.initialTimestamp ?? DEFAULT_SNAPSHOT_TIMESTAMP;

    try {
      const foundation = databasePath
        ? openFoundationDatabase(databasePath)
        : openFoundationDatabase(DEFAULT_DATABASE_PATH);
      this.database = foundation.database;
      this.initialize();
    } catch (error) {
      this.database = null;
      if (error instanceof WorkflowPersistenceError) {
        throw error;
      }
      throw new WorkflowPersistenceError();
    }
  }

  readState(): WorkflowState {
    return this.transaction((database) => {
      const generation = readFoundationGeneration(database);
      return readSnapshot(database, generation);
    });
  }

  applyCommand(command: WorkflowCommand, now: string): CommandOutcome {
    return this.transaction((database) => {
      const generation = readFoundationGeneration(database);
      const current = readSnapshot(database, generation);
      const outcome = executeCommand(current, command, now);
      const changed = serializeState(current) !== serializeState(outcome.state);

      if (outcome.ok || changed) {
        writeSnapshot(database, outcome.state, now);
      }

      return outcome;
    });
  }

  readTenantProjection(
    actor: Actor,
    now: string,
  ): ProjectionOutcome<TenantProjection> {
    return this.transaction((database) => {
      const generation = readFoundationGeneration(database);
      const current = readSnapshot(database, generation);
      const outcome = buildTenantProjection(current, actor, now);

      if (serializeState(current) !== serializeState(outcome.state)) {
        writeSnapshot(database, outcome.state, now);
      }

      return outcome;
    });
  }

  readAgentProjection(
    actor: Actor,
    now: string,
  ): ProjectionOutcome<AgentProjection> {
    return this.transaction((database) => {
      const generation = readFoundationGeneration(database);
      const current = readSnapshot(database, generation);
      const outcome = buildAgentProjection(current, actor, now);

      if (serializeState(current) !== serializeState(outcome.state)) {
        writeSnapshot(database, outcome.state, now);
      }

      return outcome;
    });
  }

  reset(now: string): WorkflowResetResult {
    return this.transaction((database) => {
      const currentGeneration = readFoundationGeneration(database);
      readSnapshot(database, currentGeneration);

      const resetMarker = readResetMarker(database);
      const generation = resetMarker === 0 && currentGeneration === 1
        ? 1
        : currentGeneration + 1;
      const state = createInitialWorkflowState({ fixtureGeneration: generation });

      database
        .prepare("UPDATE foundation_metadata SET generation = ? WHERE id = 1")
        .run(generation);
      database.exec("PRAGMA user_version = 1");
      writeSnapshot(database, state, now);

      return { generation, state };
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
      throw new WorkflowPersistenceError();
    }
  }

  private initialize(): void {
    const database = this.requireDatabase();
    try {
      database.exec(SNAPSHOT_SCHEMA);
    } catch {
      throw new WorkflowPersistenceError();
    }

    this.transaction((connection) => {
      const generation = readFoundationGeneration(connection);
      const row = readSnapshotRow(connection);
      if (!row) {
        const state = createInitialWorkflowState({ fixtureGeneration: generation });
        writeSnapshot(connection, state, this.initialTimestamp);
        return;
      }

      readSnapshotFromRow(row, generation);
    });
  }

  private requireDatabase(): DatabaseSync {
    if (!this.database) {
      throw new WorkflowPersistenceError();
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
          // Preserve the original failure and expose only a neutral error below.
        }
      }

      if (error instanceof WorkflowPersistenceError || isDomainError(error)) {
        throw error;
      }
      throw new WorkflowPersistenceError();
    }
  }
}

function readSnapshot(database: DatabaseSync, generation: number): WorkflowState {
  const row = readSnapshotRow(database);
  if (!row) {
    throw new WorkflowPersistenceError();
  }
  return readSnapshotFromRow(row, generation);
}

function readSnapshotRow(database: DatabaseSync): SnapshotRow | undefined {
  return database
    .prepare(`SELECT id, schema_version, fixture_generation, state_json, updated_at
      FROM ${WORKFLOW_SNAPSHOT_TABLE} WHERE id = 1`)
    .get() as SnapshotRow | undefined;
}

function readSnapshotFromRow(row: SnapshotRow, generation: number): WorkflowState {
  if (
    row.id !== 1
    || row.schema_version !== WORKFLOW_SNAPSHOT_SCHEMA_VERSION
    || row.fixture_generation !== generation
    || typeof row.state_json !== "string"
    || row.state_json.length === 0
    || typeof row.updated_at !== "string"
    || row.updated_at.length === 0
  ) {
    throw new WorkflowPersistenceError();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(row.state_json);
  } catch {
    throw new WorkflowPersistenceError();
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new WorkflowPersistenceError();
  }

  const state = parsed as WorkflowState;
  if (state.fixtureGeneration !== generation) {
    throw new WorkflowPersistenceError();
  }

  try {
    evaluateExpiry(state, SNAPSHOT_VALIDATION_TIMESTAMP);
  } catch {
    throw new WorkflowPersistenceError();
  }

  return state;
}

function writeSnapshot(
  database: DatabaseSync,
  state: WorkflowState,
  updatedAt: string,
): void {
  const serialized = serializeState(state);
  database
    .prepare(`INSERT INTO ${WORKFLOW_SNAPSHOT_TABLE}
      (id, schema_version, fixture_generation, state_json, updated_at)
      VALUES (1, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        schema_version = excluded.schema_version,
        fixture_generation = excluded.fixture_generation,
        state_json = excluded.state_json,
        updated_at = excluded.updated_at`)
    .run(
      WORKFLOW_SNAPSHOT_SCHEMA_VERSION,
      state.fixtureGeneration,
      serialized,
      updatedAt,
    );
}

function serializeState(state: WorkflowState): string {
  try {
    const serialized = JSON.stringify(state);
    if (!serialized) {
      throw new Error("State is not serializable");
    }
    return serialized;
  } catch {
    throw new WorkflowPersistenceError();
  }
}
