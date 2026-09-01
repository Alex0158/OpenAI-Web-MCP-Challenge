import {
  DEFAULT_DATABASE_PATH,
  openFoundationDatabase,
  readFoundationGeneration,
  readResetMarker,
} from "./sqlite";

export function resetFoundationDatabase(
  databasePath: string = DEFAULT_DATABASE_PATH,
): number {
  const store = openFoundationDatabase(databasePath);

  try {
    store.database.exec("BEGIN IMMEDIATE");
    try {
      const currentGeneration = readFoundationGeneration(store.database);
      const resetMarker = readResetMarker(store.database);
      const nextGeneration = resetMarker === 0 && currentGeneration === 1
        ? 1
        : currentGeneration + 1;

      store.database
        .prepare("UPDATE foundation_metadata SET generation = ? WHERE id = 1")
        .run(nextGeneration);
      store.database.exec("PRAGMA user_version = 1");
      store.database.exec("COMMIT");

      return nextGeneration;
    } catch (error) {
      try {
        store.database.exec("ROLLBACK");
      } catch {
        // Preserve the original reset failure.
      }
      throw error;
    }
  } finally {
    store.database.close();
  }
}
