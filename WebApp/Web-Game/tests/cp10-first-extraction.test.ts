import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { createPersistenceStore, deterministicCargoId, PersistenceError } from "../src/server/persistence/store";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import { MissionExtractionService } from "../src/server/mission-extraction-service";
import { MissionTravelService } from "../src/server/mission-travel-service";
import { WorldClock } from "../src/server/world-clock";
import { WorldWorkerModule } from "../src/server/world-worker";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp10-extraction-world";

interface Runtime {
  store: ReturnType<typeof createPersistenceStore>;
  worker: WorldWorkerModule;
  clock: WorldClock;
  travel: MissionTravelService;
  extraction: MissionExtractionService;
}

async function openRuntime(dbPath?: string): Promise<{ runtime: Runtime; directory: string }> {
  const directory = dbPath ? undefined : mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp10-extraction-"));
  const path = dbPath ?? join(directory as string, "world.sqlite");
  const seedStore = createPersistenceStore({ dbPath: path, contractVersion: CONTRACT_VERSION });
  seedStore.open();
  if (!seedStore.getWorld(WORLD_ID)) {
    createAndPersistG2Fixture(seedStore, {
      worldId: WORLD_ID,
      playerBindings: { "player-a": "binding-a", "player-b": "binding-b" },
    });
  }
  seedStore.close();

  const store = createPersistenceStore({ dbPath: path, contractVersion: CONTRACT_VERSION });
  const travel = new MissionTravelService({ store });
  const extraction = new MissionExtractionService({ store });
  const clock = new WorldClock({
    worldId: WORLD_ID,
    persistence: store,
    phaseHandlers: {
      movement: (context) => travel.advanceAtBoundary(context),
      extraction: (context) => extraction.advanceAtBoundary(context),
    },
  });
  const worker = new WorldWorkerModule({ store, clock });
  await worker.start();
  return { runtime: { store, worker, clock, travel, extraction }, directory: directory as string };
}

async function closeRuntime(runtime: Runtime, directory: string): Promise<void> {
  await runtime.worker.stop();
  if (directory) {
    rmSync(directory, { recursive: true, force: true });
  }
}

async function dispatch(runtime: Runtime, input: { soldierId?: string; targetId?: string; tool?: "AXE" | "PICKAXE"; key?: string } = {}) {
  if (!runtime.worker.gateway) {
    throw new Error("worker gateway unavailable");
  }
  return runtime.worker.gateway.assignSoldierMission({
    worldId: WORLD_ID,
    playerId: "player-a",
    binding: "binding-a",
    soldierId: input.soldierId ?? "soldier-a-01",
    role: "GATHERER",
    tool: input.tool ?? "AXE",
    equipmentTier: 1,
    targetId: input.targetId ?? "node-wood-a",
    expectedSoldierRevision: 0,
    commandId: `command-${input.key ?? `cp10-dispatch-${input.soldierId ?? "soldier-a-01"}`}`,
    idempotencyKey: input.key ?? `cp10-dispatch-${input.soldierId ?? "soldier-a-01"}`,
  });
}

function directExtractionInput(runtime: Runtime, worldTime: number, injectFailureAt?: "after_state" | "after_cargo" | "after_events" | "before_commit") {
  const mission = runtime.store.listMissions(WORLD_ID)[0];
  const attempt = runtime.store.listMissionAttempts(WORLD_ID)[0];
  const soldier = runtime.store.listSoldiers(WORLD_ID).find((candidate) => candidate.soldierId === mission?.soldierId);
  const node = runtime.store.listResourceNodes(WORLD_ID).find((candidate) => candidate.resourceNodeId === attempt?.targetId);
  if (!mission || !attempt || !soldier || !node || attempt.nextDueWorldTime === null || attempt.targetId === null) {
    throw new Error("extraction fixture not ready");
  }
  const workId = `mission-extraction:${attempt.missionAttemptId}:${attempt.nextDueWorldTime}`;
  const cargoId = deterministicCargoId(WORLD_ID, attempt.missionAttemptId, node.resourceNodeId);
  return {
    worldId: WORLD_ID,
    worldTime,
    idempotency: {
      key: workId,
      binding: `worker:${WORLD_ID}`,
      request: {
        kind: "mission_extraction",
        missionId: mission.missionId,
        missionAttemptId: attempt.missionAttemptId,
        resourceNodeId: node.resourceNodeId,
        worldTime,
      },
    },
    soldierId: soldier.soldierId,
    expectedSoldierRevision: soldier.revision,
    missionId: mission.missionId,
    expectedMissionRevision: mission.revision,
    missionAttemptId: attempt.missionAttemptId,
    expectedMissionAttemptRevision: attempt.revision,
    resourceNodeId: node.resourceNodeId,
    expectedResourceNodeRevision: node.revision,
    event: {
      eventId: `cargo-extracted:${attempt.missionAttemptId}:${attempt.nextDueWorldTime}`,
      eventType: "CargoExtracted",
      causationId: workId,
      idempotencyKey: workId,
      aggregateType: "mission",
      aggregateId: mission.missionId,
      visibilityScope: { kind: "shelter" as const, shelterId: soldier.shelterId },
      typedPayload: {
        cargoId,
        missionId: mission.missionId,
        missionAttemptId: attempt.missionAttemptId,
        soldierId: soldier.soldierId,
        sourceNodeId: node.resourceNodeId,
        resourceType: node.resourceType,
        quantity: 1,
        capacityUsed: 1,
        remainingNodeQuantity: node.quantity - 1,
        worldTime,
      },
    },
    nextDueWorldTime: attempt.nextDueWorldTime + 2,
    returnReason: null,
    resourceRespawnDueWorldTime: null,
    injectFailureAt,
  };
}

test("arrival arms the first extraction exactly two world seconds later", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatch(runtime);
    await runtime.worker.advance(5000);
    assert.equal(runtime.store.getWorld(WORLD_ID)?.worldTime, 5);
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "WORKING");
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.nextDueWorldTime, 7);
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 0);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CargoExtracted").length, 0);

    await runtime.worker.advance(1000);
    assert.equal(runtime.store.getWorld(WORLD_ID)?.worldTime, 6);
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 0);

    await runtime.worker.advance(1000);
    assert.equal(runtime.store.getWorld(WORLD_ID)?.worldTime, 7);
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 1);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("one Wood extraction atomically creates provenance cargo without coins", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatch(runtime);
    await runtime.worker.advance(7000);
    const cargo = runtime.store.listCargo(WORLD_ID);
    assert.equal(cargo.length, 1);
    assert.equal(cargo[0]?.soldierId, "soldier-a-01");
    assert.equal(cargo[0]?.missionAttemptId, dispatched.missionAttemptId);
    assert.equal(cargo[0]?.sourceNodeId, "node-wood-a");
    assert.equal(cargo[0]?.resourceType, "wood");
    assert.equal(cargo[0]?.quantity, 1);
    assert.equal(cargo[0]?.capacityUsed, 1);
    assert.equal(cargo[0]?.acquiredWorldTime, 7);
    assert.equal(cargo[0]?.revision, 0);
    assert.equal(runtime.store.listResourceNodes(WORLD_ID).find((node) => node.resourceNodeId === "node-wood-a")?.quantity, 19);
    assert.equal(runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, 0);
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.nextDueWorldTime, 9);
    assert.equal(runtime.store.getMissionAttempt(WORLD_ID, dispatched.missionAttemptId)?.nextDueWorldTime, 9);
    const event = runtime.store.events(WORLD_ID).find((candidate) => candidate.eventType === "CargoExtracted");
    assert.ok(event);
    assert.deepEqual(event.typedPayload, {
      cargoId: cargo[0]?.cargoId,
      missionId: dispatched.missionId,
      missionAttemptId: dispatched.missionAttemptId,
      soldierId: "soldier-a-01",
      sourceNodeId: "node-wood-a",
      resourceType: "wood",
      quantity: 1,
      capacityUsed: 1,
      remainingNodeQuantity: 19,
      worldTime: 7,
    });
    assert.equal(event.worldEventCursor, 3);
    assert.deepEqual(event.affectedEntityRevisions, {
      [`cargo:${cargo[0]?.cargoId}`]: 0,
      [`mission:${dispatched.missionId}`]: 2,
      [`mission_attempt:${dispatched.missionAttemptId}`]: 2,
      "resource_node:node-wood-a": 1,
    });
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("Rock extraction requires the persisted pickaxe loadout", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatch(runtime, { soldierId: "soldier-a-02", targetId: "node-rock-a", tool: "PICKAXE" });
    await runtime.worker.advance(8000);
    const cargo = runtime.store.listCargo(WORLD_ID);
    assert.equal(cargo.length, 1);
    assert.equal(cargo[0]?.missionAttemptId, dispatched.missionAttemptId);
    assert.equal(cargo[0]?.resourceType, "rock");
    assert.equal(runtime.store.listResourceNodes(WORLD_ID).find((node) => node.resourceNodeId === "node-rock-a")?.quantity, 19);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("a duplicate due pass is a no-op and cannot create another cargo unit", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatch(runtime);
    await runtime.worker.advance(7000);
    const firstCargo = runtime.store.listCargo(WORLD_ID);
    const firstEventCount = runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CargoExtracted").length;
    const replay = runtime.extraction.advanceAtBoundary({ worldId: WORLD_ID, worldTime: 7, elapsedMs: 0 });
    assert.deepEqual(replay, []);
    assert.equal(runtime.store.listCargo(WORLD_ID).length, firstCargo.length);
    assert.equal(runtime.store.listResourceNodes(WORLD_ID).find((node) => node.resourceNodeId === "node-wood-a")?.quantity, 19);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CargoExtracted").length, firstEventCount);
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "WORKING");
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("full cargo and an empty node fail before any extraction mutation", async () => {
  const { runtime, directory } = await openRuntime();
  const dbPath = runtime.store.databasePath;
  try {
    const dispatched = await dispatch(runtime);
    const database = new DatabaseSync(dbPath);
    database.prepare("INSERT INTO cargo (world_id, cargo_id, soldier_id, mission_attempt_id, source_node_id, resource_type, quantity, acquired_world_time, capacity_used, revision) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(WORLD_ID, "legacy-full-cargo", "soldier-a-01", dispatched.missionAttemptId, "node-wood-a", "wood", 5, 1, 5, 0);
    database.close();
    assert.throws(
      () => runtime.worker.advance(7000),
      (error: unknown) => error instanceof PersistenceError && error.code === "CARGO_FULL",
    );
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "WORKING");
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.nextDueWorldTime, 7);
    assert.equal(runtime.store.listResourceNodes(WORLD_ID).find((node) => node.resourceNodeId === "node-wood-a")?.quantity, 20);
    assert.equal(runtime.store.listCargo(WORLD_ID).find((cargo) => cargo.cargoId === "legacy-full-cargo")?.capacityUsed, 5);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("an already empty target durably returns the mission without cargo or extraction", async () => {
  const { runtime, directory } = await openRuntime();
  const dbPath = runtime.store.databasePath;
  try {
    const dispatched = await dispatch(runtime);
    const database = new DatabaseSync(dbPath);
    database.prepare("UPDATE resource_node SET quantity = 0 WHERE world_id = ? AND resource_node_id = ?").run(WORLD_ID, "node-wood-a");
    database.close();
    runtime.worker.advance(7000);
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "RETURNING");
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.nextDueWorldTime, null);
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 0);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CargoExtracted").length, 0);
    const returned = runtime.store.events(WORLD_ID).find((event) => event.eventType === "MissionAutoReturned");
    assert.deepEqual(returned?.typedPayload, {
      missionId: dispatched.missionId,
      missionAttemptId: dispatched.missionAttemptId,
      soldierId: "soldier-a-01",
      reason: "TARGET_DEPLETED",
      cargoQuantity: 0,
      cargoCapacityUsed: 0,
      resourceNodeId: "node-wood-a",
      worldTime: 7,
    });
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("transaction failure rolls back the node, cargo, due marker, revisions, and event cursor", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await dispatch(runtime);
    runtime.clock.recoverTo(6);
    const beforeMission = runtime.store.listMissions(WORLD_ID)[0];
    const beforeAttempt = runtime.store.listMissionAttempts(WORLD_ID)[0];
    const beforeNode = runtime.store.listResourceNodes(WORLD_ID)[0];
    assert.throws(
      () => runtime.store.commitMissionExtraction(directExtractionInput(runtime, 7, "after_cargo")),
      (error: unknown) => error instanceof PersistenceError && error.code === "INJECTED_FAILURE",
    );
    assert.equal(runtime.store.getWorld(WORLD_ID)?.worldTime, 6);
    assert.deepEqual(runtime.store.listMissions(WORLD_ID)[0], beforeMission);
    assert.deepEqual(runtime.store.listMissionAttempts(WORLD_ID)[0], beforeAttempt);
    assert.deepEqual(runtime.store.listResourceNodes(WORLD_ID)[0], beforeNode);
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 0);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CargoExtracted").length, 0);
    runtime.clock.recoverTo(7);
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 1);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("stale persisted loadout enters recovery without granting client-selected yield", async () => {
  const { runtime, directory } = await openRuntime();
  const dbPath = runtime.store.databasePath;
  try {
    await dispatch(runtime);
    runtime.clock.recoverTo(6);
    const database = new DatabaseSync(dbPath);
    database.prepare("UPDATE soldier SET tool = ? WHERE world_id = ? AND soldier_id = ?").run("PICKAXE", WORLD_ID, "soldier-a-01");
    database.close();
    assert.throws(
      () => runtime.extraction.advanceAtBoundary({ worldId: WORLD_ID, worldTime: 7, elapsedMs: 0 }),
      (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED",
    );
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 0);
    assert.equal(runtime.store.listResourceNodes(WORLD_ID).find((node) => node.resourceNodeId === "node-wood-a")?.quantity, 20);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("a committed extraction result is replayable by its stable idempotency key", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await dispatch(runtime);
    runtime.clock.recoverTo(6);
    const input = directExtractionInput(runtime, 7);
    const first = runtime.store.commitMissionExtraction(input);
    const duplicate = runtime.store.commitMissionExtraction(input);
    assert.equal(first.eventId, duplicate.eventId);
    assert.equal(duplicate.duplicate, true);
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 1);
    assert.equal(runtime.store.listResourceNodes(WORLD_ID).find((node) => node.resourceNodeId === "node-wood-a")?.quantity, 19);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CargoExtracted").length, 1);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("restart resumes a due extraction once and does not replay committed cargo", async () => {
  const { runtime, directory } = await openRuntime();
  const dbPath = join(directory, "world.sqlite");
  try {
    await dispatch(runtime);
    await runtime.worker.advance(6000);
  } finally {
    await runtime.worker.stop();
  }

  const resumed = await openRuntime(dbPath);
  try {
    resumed.runtime.clock.recoverTo(7);
    assert.equal(resumed.runtime.store.listCargo(WORLD_ID).length, 1);
    assert.equal(resumed.runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CargoExtracted").length, 1);
    resumed.runtime.clock.recoverTo(7);
    assert.equal(resumed.runtime.store.listCargo(WORLD_ID).length, 1);
    assert.equal(resumed.runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CargoExtracted").length, 1);
  } finally {
    await closeRuntime(resumed.runtime, resumed.directory);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("an extraction handler cannot skip an unprocessed durable world boundary", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await dispatch(runtime);
    assert.throws(
      () => runtime.extraction.advanceAtBoundary({ worldId: WORLD_ID, worldTime: 7, elapsedMs: 0 }),
      (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED",
    );
    assert.equal(runtime.store.getWorld(WORLD_ID)?.worldTime, 0);
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 0);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("schema 3 cargo rows migrate to provenance columns transactionally", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp10-migration-"));
  const dbPath = join(directory, "world.sqlite");
  const seedStore = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  seedStore.open();
  createAndPersistG2Fixture(seedStore, { worldId: WORLD_ID });
  seedStore.close();
  const database = new DatabaseSync(dbPath);
  database.exec("PRAGMA foreign_keys = OFF");
  database.exec("DROP TABLE cargo");
  database.exec("CREATE TABLE cargo (world_id TEXT NOT NULL, cargo_id TEXT NOT NULL, soldier_id TEXT NOT NULL, resource_type TEXT NOT NULL, quantity INTEGER NOT NULL DEFAULT 0, revision INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (world_id, cargo_id), FOREIGN KEY (world_id, soldier_id) REFERENCES soldier(world_id, soldier_id))");
  database.prepare("UPDATE schema_meta SET schema_version = 3, migration_id = 'cp09-001' WHERE schema_meta_id = 'singleton'").run();
  database.close();

  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  try {
    store.open();
    assert.equal(store.metadata().schemaVersion, 9);
    assert.equal(store.metadata().migrationId, "cp14-001");
    const migrated = new DatabaseSync(dbPath);
    const columns = new Set((migrated.prepare("PRAGMA table_info(cargo)").all() as Array<{ name?: unknown }>).map((row) => row.name));
    assert.equal(["mission_attempt_id", "source_node_id", "acquired_world_time", "capacity_used"].every((column) => columns.has(column)), true);
    migrated.close();
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
