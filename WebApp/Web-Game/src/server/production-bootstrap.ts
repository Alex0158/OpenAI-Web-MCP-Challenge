import { PersistenceError, PersistenceStore } from "./persistence/store";
import { createAndPersistG2Fixture, loadPersistedG2Fixture } from "./world-fixture";

/**
 * Provision the one authoritative MVP world exactly once.
 *
 * The same deterministic world seed is used for the first hosted demonstration,
 * but this path is a production bootstrap rather than the local fixture session:
 * it has no cookie, browser, or client-selected identity and it never reseeds a
 * non-empty store.
 */
export function ensureProductionWorld(store: PersistenceStore, worldId: string): void {
  if (!store.isOpen || worldId.trim() === "") {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }

  const worldIds = store.listWorldIds();
  if (worldIds.length === 0) {
    createAndPersistG2Fixture(store, {
      worldId,
      playerBindings: {
        "player-a": "game-binding-player-a",
        "player-b": "game-binding-player-b",
      },
    });
    return;
  }

  if (worldIds.length !== 1 || worldIds[0] !== worldId) {
    throw new PersistenceError("RECOVERY_REQUIRED");
  }

  // A second start is a read-only validation. loadPersistedG2Fixture checks the
  // snapshot, map fingerprint, and world metadata without writing a new seed.
  loadPersistedG2Fixture(store, worldId);
}
