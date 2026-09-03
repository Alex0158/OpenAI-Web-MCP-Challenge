import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { PersistenceError, createPersistenceStore } from "../src/server/persistence/store";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import {
  ClientSnapshotService,
  PlayerMovementService,
} from "../src/server/world-projection";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;

function withFixture<T>(run: (context: {
  store: ReturnType<typeof createPersistenceStore>;
  worldId: string;
  movement: PlayerMovementService;
  projection: ClientSnapshotService;
}) => T): T {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp08-"));
  const dbPath = join(directory, "world.sqlite");
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const worldId = "cp08-world";
  try {
    store.open();
    createAndPersistG2Fixture(store, {
      worldId,
      playerBindings: { "player-a": "binding-a", "player-b": "binding-b" },
    });
    return run({
      store,
      worldId,
      movement: new PlayerMovementService({ store }),
      projection: new ClientSnapshotService({ store }),
    });
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

test("valid movement is authoritative, durable, and idempotent across restart", () => {
  withFixture(({ store, worldId, movement, projection }) => {
    const first = movement.move({
      worldId,
      playerId: "player-a",
      binding: "binding-a",
      commandId: "move-command-a-1",
      direction: "right",
      expectedRevision: 0,
      idempotencyKey: "move-a-1",
    });

    assert.equal(first.effect, "moved");
    assert.equal(first.commandId, "move-command-a-1");
    assert.deepEqual(first.position, { x: 17, y: 64 });
    assert.equal(first.revision, 1);
    assert.equal(store.events(worldId).length, 1);
    assert.equal(store.events(worldId)[0]?.eventType, "PlayerMoved");
    assert.equal(store.events(worldId)[0]?.causationId, "move-command-a-1");
    assert.equal(store.events(worldId)[0]?.idempotencyKey, "move-a-1");

    const duplicate = movement.move({
      worldId,
      playerId: "player-a",
      binding: "binding-a",
      commandId: "move-command-a-1",
      direction: "right",
      expectedRevision: 0,
      idempotencyKey: "move-a-1",
    });
    assert.equal(duplicate.duplicate, true);
    assert.deepEqual(duplicate.position, first.position);
    assert.equal(store.events(worldId).length, 1);

    assert.throws(
      () => movement.move({
        worldId,
        playerId: "player-a",
        binding: "binding-a",
        commandId: "move-command-a-1-conflict",
        direction: "down",
        expectedRevision: 0,
        idempotencyKey: "move-a-1",
      }),
      (error: unknown) => error instanceof PersistenceError && error.code === "DUPLICATE_COMMAND",
    );

    const second = movement.move({
      worldId,
      playerId: "player-a",
      binding: "binding-a",
      commandId: "move-command-a-2",
      direction: "right",
      expectedRevision: 1,
      idempotencyKey: "move-a-2",
    });
    assert.deepEqual(second.position, { x: 18, y: 64 });
    const lateDuplicate = movement.move({
      worldId,
      playerId: "player-a",
      binding: "binding-a",
      commandId: "move-command-a-1",
      direction: "right",
      expectedRevision: 0,
      idempotencyKey: "move-a-1",
    });
    assert.equal(lateDuplicate.duplicate, true);
    assert.deepEqual(lateDuplicate.position, { x: 17, y: 64 });
    assert.equal(lateDuplicate.revision, 1);
    assert.equal(store.events(worldId).length, 2);

    const beforeRestart = projection.full({
      worldId,
      playerId: "player-a",
      binding: "binding-a",
    });
    assert.deepEqual(beforeRestart.player.position, { x: 18, y: 64 });
    assert.equal(beforeRestart.full, true);

    store.close();
    store.open();

    const afterRestart = new ClientSnapshotService({ store }).full({
      worldId,
      playerId: "player-a",
      binding: "binding-a",
    });
    assert.deepEqual(afterRestart.player.position, { x: 18, y: 64 });
    assert.ok(afterRestart.player.exploredCells.some((cell) => cell.x === 18 && cell.y === 64));
    assert.equal(afterRestart.worldTime, 0);
  });
});

test("schema version 1 player rows migrate transactionally to the current CP-09 shape", () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp08-migration-"));
  const dbPath = join(directory, "world.sqlite");
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  try {
    store.open();
    store.createWorld({ worldId: "legacy-world", worldTime: 0 });
    store.createPlayer({ worldId: "legacy-world", playerId: "legacy-player", binding: "legacy-binding" });
    store.close();

    const database = new DatabaseSync(dbPath);
    database.exec("ALTER TABLE player DROP COLUMN explored_cells_json");
    database.exec("ALTER TABLE player DROP COLUMN position_y");
    database.exec("ALTER TABLE player DROP COLUMN position_x");
    database.prepare("UPDATE schema_meta SET schema_version = 1, migration_id = 'cp05-001' WHERE schema_meta_id = 'singleton'").run();
    database.close();

    store.open();
    assert.equal(store.metadata().schemaVersion, 8);
    assert.equal(store.metadata().migrationId, "cp06-004");
    assert.deepEqual(store.getPlayer("legacy-world", "legacy-player")?.position, { x: 0, y: 0 });
    assert.deepEqual(store.getPlayer("legacy-world", "legacy-player")?.exploredCells, []);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("movement rejects ownership, stale revision, and out-of-bounds commands", () => {
  withFixture(({ store, worldId, movement }) => {
    assert.throws(
      () => movement.move({
        worldId,
        playerId: "player-a",
        binding: "binding-b",
        commandId: "move-command-wrong-owner",
        direction: "right",
        expectedRevision: 0,
        idempotencyKey: "move-wrong-owner",
      }),
      (error: unknown) => error instanceof PersistenceError && error.code === "OWNERSHIP_DENIED",
    );

    const first = movement.move({
      worldId,
      playerId: "player-a",
      binding: "binding-a",
      commandId: "move-command-stale-1",
      direction: "up",
      expectedRevision: 0,
      idempotencyKey: "move-stale-1",
    });
    assert.deepEqual(first.position, { x: 16, y: 63 });

    assert.throws(
      () => movement.move({
        worldId,
        playerId: "player-a",
        binding: "binding-a",
        commandId: "move-command-stale-2",
        direction: "right",
        expectedRevision: 0,
        idempotencyKey: "move-stale-2",
      }),
      (error: unknown) => error instanceof PersistenceError && error.code === "STALE_REVISION",
    );
    assert.deepEqual(store.getPlayer(worldId, "player-a")?.position, { x: 16, y: 63 });

    for (let index = 0; index < 16; index += 1) {
      movement.move({
        worldId,
        playerId: "player-a",
        binding: "binding-a",
        commandId: `move-command-edge-${index}`,
        direction: "left",
        expectedRevision: index + 1,
        idempotencyKey: `move-edge-${index}`,
      });
    }
    assert.deepEqual(store.getPlayer(worldId, "player-a")?.position, { x: 0, y: 63 });
    assert.throws(
      () => movement.move({
        worldId,
        playerId: "player-a",
        binding: "binding-a",
        commandId: "move-command-stale-at-boundary",
        direction: "left",
        expectedRevision: 16,
        idempotencyKey: "move-stale-at-boundary",
      }),
      (error: unknown) => error instanceof PersistenceError && error.code === "STALE_REVISION",
    );
    assert.equal(store.idempotency(worldId, "move-stale-at-boundary")?.outcome, "rejected");
    assert.throws(
      () => movement.move({
        worldId,
        playerId: "player-a",
        binding: "binding-a",
        commandId: "move-command-out-of-bounds",
        direction: "left",
        expectedRevision: 17,
        idempotencyKey: "move-out-of-bounds",
      }),
      (error: unknown) => error instanceof PersistenceError && error.code === "MOVEMENT_BLOCKED",
    );
    assert.deepEqual(store.getPlayer(worldId, "player-a")?.position, { x: 0, y: 63 });
    assert.equal(store.idempotency(worldId, "move-out-of-bounds")?.outcome, "rejected");
    store.close();
    store.open();
    assert.throws(
      () => movement.move({
        worldId,
        playerId: "player-a",
        binding: "binding-a",
        commandId: "move-command-out-of-bounds-conflict",
        direction: "left",
        expectedRevision: 17,
        idempotencyKey: "move-out-of-bounds",
      }),
      (error: unknown) => error instanceof PersistenceError && error.code === "DUPLICATE_COMMAND",
    );

    movement.move({
      worldId,
      playerId: "player-a",
      binding: "binding-a",
      commandId: "move-command-after-boundary",
      direction: "right",
      expectedRevision: 17,
      idempotencyKey: "move-after-boundary",
    });
    assert.throws(
      () => movement.move({
        worldId,
        playerId: "player-a",
        binding: "binding-a",
        commandId: "move-command-out-of-bounds",
        direction: "left",
        expectedRevision: 17,
        idempotencyKey: "move-out-of-bounds",
      }),
      (error: unknown) => error instanceof PersistenceError && error.code === "MOVEMENT_BLOCKED",
    );
    assert.throws(
      () => movement.move({
        worldId,
        playerId: "player-a",
        binding: "binding-a",
        commandId: "move-command-stale-at-boundary",
        direction: "left",
        expectedRevision: 16,
        idempotencyKey: "move-stale-at-boundary",
      }),
      (error: unknown) => error instanceof PersistenceError && error.code === "STALE_REVISION",
    );
    assert.deepEqual(store.getPlayer(worldId, "player-a")?.position, { x: 1, y: 63 });
  });
});

test("full snapshots replace projection state and omit another player's private state", () => {
  withFixture(({ worldId, movement, projection }) => {
    const initial = projection.full({
      worldId,
      playerId: "player-a",
      binding: "binding-a",
    });
    assert.equal(initial.contractVersion, CONTRACT_VERSION);
    assert.equal(initial.full, true);
    assert.equal(initial.baseClientSnapshotId, null);
    assert.equal(initial.playerScope.playerId, "player-a");
    assert.equal(initial.shelter.shelterId, "shelter-a");
    assert.equal(initial.soldiers.length, 5);
    assert.ok(initial.player.exploredCells.some((cell) => cell.x === 16 && cell.y === 64));
    assert.equal(JSON.stringify(initial).includes("shelter-b"), false);
    assert.equal(JSON.stringify(initial).includes("player-b"), false);
    assert.equal("hiddenMap" in initial, false);

    movement.move({
      worldId,
      playerId: "player-a",
      binding: "binding-a",
      commandId: "move-command-snapshot-1",
      direction: "right",
      expectedRevision: 0,
      idempotencyKey: "move-snapshot-1",
    });
    const replacement = projection.full({
      worldId,
      playerId: "player-a",
      binding: "binding-a",
    });
    assert.equal(replacement.full, true);
    assert.equal(replacement.baseClientSnapshotId, null);
    assert.notEqual(replacement.clientSnapshotId, initial.clientSnapshotId);
    assert.deepEqual(replacement.player.position, { x: 17, y: 64 });
    assert.equal(replacement.worldTime, 0);
  });
});
