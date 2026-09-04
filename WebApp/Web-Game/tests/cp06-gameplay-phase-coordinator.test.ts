import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { GameplayPhaseCoordinator } from "../src/server/gameplay-phase-coordinator";
import { createPersistenceStore, PersistenceError } from "../src/server/persistence/store";
import { WorldClock } from "../src/server/world-clock";
import { WorldWorkerModule } from "../src/server/world-worker";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp06-coordinator-world";

test("the boundary journal accepts one next boundary, exact replay, and atomic completion", () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp06-journal-"));
  const dbPath = join(directory, "world.sqlite");
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  try {
    store.open();
    store.createWorld({ worldId: WORLD_ID, worldTime: 0 });

    assert.equal(store.beginWorldBoundary(WORLD_ID, 1).inProgressWorldTime, 1);
    assert.equal(store.beginWorldBoundary(WORLD_ID, 1).inProgressWorldTime, 1);
    assert.throws(
      () => store.beginWorldBoundary(WORLD_ID, 2),
      (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED",
    );
    assert.throws(
      () => store.completeWorldBoundary(WORLD_ID, 2),
      (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED",
    );
    const completed = store.completeWorldBoundary(WORLD_ID, 1);
    assert.equal(completed.worldTime, 1);
    assert.equal(completed.inProgressWorldTime, null);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a schema-v6 world gains the nullable boundary marker during migration", () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp06-migration-"));
  const dbPath = join(directory, "world.sqlite");
  const seedStore = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  try {
    seedStore.open();
    seedStore.createWorld({ worldId: WORLD_ID, worldTime: 4 });
    seedStore.close();

    const legacy = new DatabaseSync(dbPath);
    legacy.exec("ALTER TABLE world DROP COLUMN in_progress_world_time");
    legacy.prepare("UPDATE schema_meta SET schema_version = 6, migration_id = 'cp11-002' WHERE schema_meta_id = 'singleton'").run();
    legacy.close();

    const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
    try {
      store.open();
      assert.equal(store.metadata().schemaVersion, 9);
      assert.equal(store.metadata().migrationId, "cp14-001");
      const database = new DatabaseSync(dbPath);
      const columns = new Set((database.prepare("PRAGMA table_info(world)").all() as Array<{ name?: unknown }>).map((row) => row.name));
      database.close();
      assert.equal(columns.has("in_progress_world_time"), true);
      assert.equal(store.getWorld(WORLD_ID)?.inProgressWorldTime, null);
    } finally {
      store.close();
    }
  } finally {
    seedStore.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a late phase failure leaves a durable marker and startup replays the whole boundary", () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp06-replay-"));
  const dbPath = join(directory, "world.sqlite");
  const firstStore = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const order: string[] = [];
  try {
    firstStore.open();
    firstStore.createWorld({ worldId: WORLD_ID, worldTime: 0 });
    const firstClock = new WorldClock({
      worldId: WORLD_ID,
      persistence: firstStore,
      phaseHandlers: Object.fromEntries([
        ["movement", ({ worldTime }) => order.push(`${worldTime}:movement`)],
        ["deposit", ({ worldTime }) => order.push(`${worldTime}:deposit`)],
        ["contact", ({ worldTime }) => order.push(`${worldTime}:contact`)],
        ["extraction", ({ worldTime }) => order.push(`${worldTime}:extraction`)],
        ["combat", ({ worldTime }) => {
          order.push(`${worldTime}:combat`);
          throw new PersistenceError("INJECTED_FAILURE");
        }],
      ]),
    });
    firstClock.start();
    assert.throws(
      () => firstClock.recoverTo(1),
      (error: unknown) => error instanceof PersistenceError && error.code === "INJECTED_FAILURE",
    );
    assert.equal(firstStore.getWorld(WORLD_ID)?.worldTime, 0);
    assert.equal(firstStore.getWorld(WORLD_ID)?.inProgressWorldTime, 1);
    firstStore.close();

    const secondStore = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
    secondStore.open();
    try {
      const secondClock = new WorldClock({
        worldId: WORLD_ID,
        persistence: secondStore,
        phaseHandlers: Object.fromEntries([
          ["movement", ({ worldTime }) => order.push(`${worldTime}:movement:replay`)],
          ["deposit", ({ worldTime }) => order.push(`${worldTime}:deposit:replay`)],
          ["contact", ({ worldTime }) => order.push(`${worldTime}:contact:replay`)],
          ["extraction", ({ worldTime }) => order.push(`${worldTime}:extraction:replay`)],
          ["combat", ({ worldTime }) => order.push(`${worldTime}:combat:replay`)],
        ]),
      });
      secondClock.start();
      assert.equal(secondClock.snapshot().worldTime, 1);
      assert.equal(secondStore.getWorld(WORLD_ID)?.inProgressWorldTime, null);
      assert.deepEqual(order, [
        "1:movement", "1:deposit", "1:contact", "1:extraction", "1:combat",
        "1:movement:replay", "1:deposit:replay", "1:contact:replay", "1:extraction:replay", "1:combat:replay",
      ]);
    } finally {
      secondStore.close();
    }
  } finally {
    firstStore.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("the default worker owns one gameplay graph and treats an already empty target as a return", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp06-worker-"));
  const dbPath = join(directory, "world.sqlite");
  const seedStore = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  seedStore.open();
  createAndPersistG2Fixture(seedStore, {
    worldId: WORLD_ID,
    playerBindings: { "player-a": "binding-a", "player-b": "binding-b" },
  });
  seedStore.close();

  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const worker = new WorldWorkerModule({ store, worldId: WORLD_ID });
  try {
    await worker.start();
    assert.ok(worker.clock);
    assert.ok(worker.gameplayPhaseCoordinator);
    const dispatched = await worker.gateway!.assignSoldierMission({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      soldierId: "soldier-a-01",
      role: "GATHERER",
      tool: "PICKAXE",
      equipmentTier: 1,
      targetId: "node-rock-a",
      expectedSoldierRevision: 0,
      commandId: "cp06-empty-target-command",
      idempotencyKey: "cp06-empty-target-idempotency",
    });
    const database = new DatabaseSync(dbPath);
    database.prepare("UPDATE resource_node SET quantity = 0 WHERE world_id = ? AND resource_node_id = ?").run(WORLD_ID, "node-rock-a");
    database.close();

    await worker.advance(9000);
    const mission = store.getMission(WORLD_ID, dispatched.missionId);
    assert.equal(mission?.phase, "RETURNING");
    assert.equal(store.listCargo(WORLD_ID).length, 0);
    const returned = store.events(WORLD_ID).find((event) => event.eventType === "MissionAutoReturned");
    assert.deepEqual(returned?.typedPayload, {
      missionId: dispatched.missionId,
      missionAttemptId: dispatched.missionAttemptId,
      soldierId: "soldier-a-01",
      reason: "TARGET_DEPLETED",
      cargoQuantity: 0,
      cargoCapacityUsed: 0,
      resourceNodeId: "node-rock-a",
      worldTime: 8,
    });
    assert.equal((worker.clock as WorldClock).snapshot().state, "running");
  } finally {
    await worker.stop();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("the coordinator exposes the accepted phase order and leaves settlement and timers explicit no-ops", () => {
  const calls: string[] = [];
  const stub = (name: string) => ({ advanceAtBoundary: () => calls.push(name), advanceContactAtBoundary: () => calls.push(name), advanceCombatAtBoundary: () => calls.push(name) });
  const coordinator = new GameplayPhaseCoordinator({
    travel: stub("travel") as never,
    returning: stub("returning") as never,
    deposit: stub("deposit") as never,
    combat: stub("combat") as never,
    extraction: stub("extraction") as never,
  });
  const handlers = coordinator.phaseHandlers();
  for (const phase of ["movement", "deposit", "contact", "extraction", "combat", "settlement", "timers"] as const) {
    handlers[phase]?.({ worldId: WORLD_ID, worldTime: 1, phase });
  }
  assert.deepEqual(calls, ["travel", "returning", "deposit", "combat", "extraction", "combat"]);
});
