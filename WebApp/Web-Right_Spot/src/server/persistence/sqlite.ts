import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

export const DEFAULT_DATABASE_PATH = resolve(process.cwd(), "var/rightspot.sqlite");

const FOUNDATION_SCHEMA = `
  CREATE TABLE IF NOT EXISTS foundation_metadata (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    generation INTEGER NOT NULL CHECK (generation >= 1)
  );
`;

type FoundationMetadataRow = {
  generation: number;
};

export type FoundationDatabase = {
  database: DatabaseSync;
  path: string;
};

export function openFoundationDatabase(
  databasePath: string = DEFAULT_DATABASE_PATH,
): FoundationDatabase {
  const path = resolve(databasePath);
  mkdirSync(dirname(path), { recursive: true });

  const database = new DatabaseSync(path);
  try {
    database.exec(FOUNDATION_SCHEMA);
    const metadata = database
      .prepare("SELECT generation FROM foundation_metadata WHERE id = 1")
      .get() as FoundationMetadataRow | undefined;

    if (!metadata) {
      database
        .prepare("INSERT INTO foundation_metadata (id, generation) VALUES (1, 1)")
        .run();
    }

    return { database, path };
  } catch (error) {
    database.close();
    throw error;
  }
}

export function readFoundationGeneration(database: DatabaseSync): number {
  const row = database
    .prepare("SELECT generation FROM foundation_metadata WHERE id = 1")
    .get() as FoundationMetadataRow | undefined;

  if (!row || !Number.isInteger(row.generation) || row.generation < 1) {
    throw new Error("Invalid foundation metadata");
  }

  return row.generation;
}

export function readResetMarker(database: DatabaseSync): number {
  const row = database.prepare("PRAGMA user_version").get() as { user_version: number };
  return row.user_version;
}
