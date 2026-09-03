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
const WORLD_ID = "cp10-cadence-world";

interface Runtime {
  store: ReturnType<typeof createPersistenceStore>;
  worker: WorldWorkerModule;
  clock: WorldClock;
  extraction: MissionExtractionService;
}

async function openRuntime(dbPath?: string): Promise<{ runtime: Runtime; directory: string }> {
  const directory = dbPath ? undefined : mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp10-cadence-"));
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
  return { runtime: { store, worker, clock, extraction }, directory: directory as string };
}

async function closeRuntime(runtime: Runtime, directory: string): Promise<void> {
  await runtime.worker.stop();
  if (directory) {
    rmSync(directory, { recursive: true, force: true });
  }
}

async function dispatch(runtime: Runtime, options: { soldierId?: string; targetId?: string; tool?: "AXE" | "PICKAXE" } = {}) {
  if (!runtime.worker.gateway) {
    throw new Error("worker gateway unavailable");
  }
  return runtime.worker.gateway.assignSoldierMission({
    worldId: WORLD_ID,
    playerId: "player-a",
    binding: "binding-a",
    soldierId: options.soldierId ?? "soldier-a-01",
    role: "GATHERER",
    tool: options.tool ?? "AXE",
    equipmentTier: 1,
    targetId: options.targetId ?? "node-wood-a",
    expectedSoldierRevision: 0,
    commandId: `command-cp10-cadence-dispatch-${options.soldierId ?? "soldier-a-01"}`,
    idempotencyKey: `cp10-cadence-dispatch-${options.soldierId ?? "soldier-a-01"}`,
  });
}

function directRepeatedExtractionInput(runtime: Runtime, worldTime: number, injectFailureAt?: "after_state" | "after_cargo" | "after_events" | "before_commit") {
  const mission = runtime.store.listMissions(WORLD_ID)[0];
  const attempt = runtime.store.listMissionAttempts(WORLD_ID)[0];
  const soldier = runtime.store.listSoldiers(WORLD_ID).find((candidate) => candidate.soldierId === mission?.soldierId);
  const node = runtime.store.listResourceNodes(WORLD_ID).find((candidate) => candidate.resourceNodeId === attempt?.targetId);
  if (!mission || !attempt || !soldier || !node || attempt.nextDueWorldTime === null || attempt.targetId === null) {
    throw new Error("cadence fixture not ready");
  }
  const dueWorldTime = attempt.nextDueWorldTime;
  const workId = `mission-extraction:${attempt.missionAttemptId}:${dueWorldTime}`;
  const cargoId = deterministicCargoId(WORLD_ID, attempt.missionAttemptId, node.resourceNodeId);
  const remainingNodeQuantity = node.quantity - 1;
  return {
    worldId: WORLD_ID,
    worldTime,
    idempotency: {
      key: workId,
      binding: `worker:${WORLD_ID}`,
      request: { kind: "mission_extraction", missionId: mission.missionId, missionAttemptId: attempt.missionAttemptId, resourceNodeId: node.resourceNodeId, worldTime },
    },
    soldierId: soldier.soldierId,
    expectedSoldierRevision: soldier.revision,
    missionId: mission.missionId,
    expectedMissionRevision: mission.revision,
    missionAttemptId: attempt.missionAttemptId,
    expectedMissionAttemptRevision: attempt.revision,
    resourceNodeId: node.resourceNodeId,
    expectedResourceNodeRevision: node.revision,
    expectedCargoRevision: existingCargoRevision(runtime, cargoId),
    event: {
      eventId: `cargo-extracted:${attempt.missionAttemptId}:${dueWorldTime}`,
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
        remainingNodeQuantity,
        worldTime,
        ...(runtime.store.getCargo(WORLD_ID, cargoId)
          ? { cargoQuantity: (runtime.store.getCargo(WORLD_ID, cargoId)?.quantity ?? 0) + 1, cargoCapacityUsed: (runtime.store.getCargo(WORLD_ID, cargoId)?.capacityUsed ?? 0) + 1 }
          : {}),
      },
    },
    nextDueWorldTime: dueWorldTime + 2,
    returnReason: null,
    resourceRespawnDueWorldTime: null,
    injectFailureAt,
  };
}

function existingCargoRevision(runtime: Runtime, cargoId: string): number | null {
  return runtime.store.getCargo(WORLD_ID, cargoId)?.revision ?? null;
}

function directContestLossInput(runtime: Runtime, soldierId: string, worldTime: number, injectFailureAt?: "after_state" | "after_events" | "before_commit") {
  const mission = runtime.store.listMissions(WORLD_ID).find((candidate) => candidate.soldierId === soldierId);
  const attempt = mission?.activeAttemptId ? runtime.store.getMissionAttempt(WORLD_ID, mission.activeAttemptId) : null;
  const soldier = runtime.store.listSoldiers(WORLD_ID).find((candidate) => candidate.soldierId === soldierId);
  const node = attempt?.targetId
    ? runtime.store.listResourceNodes(WORLD_ID).find((candidate) => candidate.resourceNodeId === attempt.targetId)
    : undefined;
  if (!mission || !attempt || !soldier || !node || attempt.nextDueWorldTime === null || attempt.targetId === null) {
    throw new Error("contest fixture not ready");
  }
  const dueWorldTime = attempt.nextDueWorldTime;
  const workId = `mission-extraction-contest-loss:${attempt.missionAttemptId}:${dueWorldTime}`;
  const cargoTotals = runtime.store.listCargo(WORLD_ID, soldierId).reduce((totals, cargo) => ({
    quantity: totals.quantity + cargo.quantity,
    capacityUsed: totals.capacityUsed + cargo.capacityUsed,
  }), { quantity: 0, capacityUsed: 0 });
  return {
    worldId: WORLD_ID,
    worldTime,
    dueWorldTime,
    idempotency: {
      key: workId,
      binding: `worker:${WORLD_ID}`,
      request: {
        kind: "mission_extraction_contest_loss",
        missionId: mission.missionId,
        missionAttemptId: attempt.missionAttemptId,
        resourceNodeId: node.resourceNodeId,
        worldTime,
      },
    },
    soldierId,
    expectedSoldierRevision: soldier.revision,
    missionId: mission.missionId,
    expectedMissionRevision: mission.revision,
    missionAttemptId: attempt.missionAttemptId,
    expectedMissionAttemptRevision: attempt.revision,
    resourceNodeId: node.resourceNodeId,
    expectedResourceNodeRevision: node.revision,
    event: {
      eventId: `mission-auto-returned:${attempt.missionAttemptId}:${dueWorldTime}:target-depleted`,
      eventType: "MissionAutoReturned",
      causationId: workId,
      idempotencyKey: workId,
      aggregateType: "mission",
      aggregateId: mission.missionId,
      visibilityScope: { kind: "shelter" as const, shelterId: soldier.shelterId },
      typedPayload: {
        missionId: mission.missionId,
        missionAttemptId: attempt.missionAttemptId,
        soldierId,
        reason: "TARGET_DEPLETED",
        cargoQuantity: cargoTotals.quantity,
        cargoCapacityUsed: cargoTotals.capacityUsed,
        resourceNodeId: node.resourceNodeId,
        worldTime,
      },
    },
    injectFailureAt,
  };
}

test("a second due boundary increments the existing cargo stack and preserves the two-second cadence", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatch(runtime);
    await runtime.worker.advance(7000);
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.nextDueWorldTime, 9);
    await runtime.worker.advance(1000);
    assert.equal(runtime.store.listCargo(WORLD_ID)[0]?.quantity, 1);
    await runtime.worker.advance(1000);
    const cargo = runtime.store.listCargo(WORLD_ID);
    assert.equal(cargo.length, 1);
    assert.equal(cargo[0]?.cargoId, deterministicCargoId(WORLD_ID, dispatched.missionAttemptId, "node-wood-a"));
    assert.equal(cargo[0]?.quantity, 2);
    assert.equal(cargo[0]?.capacityUsed, 2);
    assert.equal(cargo[0]?.acquiredWorldTime, 7);
    assert.equal(cargo[0]?.revision, 1);
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.nextDueWorldTime, 11);
    assert.equal(runtime.store.listResourceNodes(WORLD_ID).find((node) => node.resourceNodeId === "node-wood-a")?.quantity, 18);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CargoExtracted").length, 2);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("the repeated milestone idempotency key replays the original stack result", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatch(runtime);
    await runtime.worker.advance(7000);
    runtime.clock.recoverTo(8);
    const input = directRepeatedExtractionInput(runtime, 9);
    const first = runtime.store.commitMissionExtraction(input);
    const duplicate = runtime.store.commitMissionExtraction(input);
    assert.equal(first.duplicate, undefined);
    assert.equal(duplicate.duplicate, true);
    assert.deepEqual(duplicate.eventIds, first.eventIds);
    assert.equal(runtime.store.listCargo(WORLD_ID)[0]?.quantity, 2);
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.nextDueWorldTime, 11);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CargoExtracted").length, 2);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("the persistence boundary rejects a caller-selected cadence marker", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await dispatch(runtime);
    await runtime.worker.advance(7000);
    runtime.clock.recoverTo(8);
    const input = directRepeatedExtractionInput(runtime, 9);
    input.nextDueWorldTime = 42;
    assert.throws(
      () => runtime.store.commitMissionExtraction(input),
      (error: unknown) => error instanceof PersistenceError && error.code === "INVALID_INPUT",
    );
    assert.equal(runtime.store.listCargo(WORLD_ID)[0]?.quantity, 1);
    assert.equal(runtime.store.listResourceNodes(WORLD_ID).find((node) => node.resourceNodeId === "node-wood-a")?.quantity, 19);
    assert.equal(runtime.store.getMission(WORLD_ID, input.missionId)?.nextDueWorldTime, 9);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("the persistence boundary rejects a forged extraction payload before mutation", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await dispatch(runtime);
    await runtime.worker.advance(7000);
    runtime.clock.recoverTo(8);
    const input = directRepeatedExtractionInput(runtime, 9);
    (input.event.typedPayload as Record<string, unknown>).quantity = 99;
    assert.throws(
      () => runtime.store.commitMissionExtraction(input),
      (error: unknown) => error instanceof PersistenceError && error.code === "INVALID_INPUT",
    );
    assert.equal(runtime.store.listCargo(WORLD_ID)[0]?.quantity, 1);
    assert.equal(runtime.store.listResourceNodes(WORLD_ID).find((node) => node.resourceNodeId === "node-wood-a")?.quantity, 19);
    assert.equal(runtime.store.getMission(WORLD_ID, input.missionId)?.nextDueWorldTime, 9);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("the fifth slot commits once and hands the mission to RETURNING", async () => {
  const { runtime, directory } = await openRuntime();
  const dbPath = runtime.store.databasePath;
  try {
    const dispatched = await dispatch(runtime);
    const database = new DatabaseSync(dbPath);
    const cargoId = deterministicCargoId(WORLD_ID, dispatched.missionAttemptId, "node-wood-a");
    database.prepare("INSERT INTO cargo (world_id, cargo_id, soldier_id, mission_attempt_id, source_node_id, resource_type, quantity, acquired_world_time, capacity_used, revision) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(WORLD_ID, cargoId, "soldier-a-01", dispatched.missionAttemptId, "node-wood-a", "wood", 4, 5, 4, 0);
    database.close();

    await runtime.worker.advance(7000);
    const cargo = runtime.store.listCargo(WORLD_ID)[0];
    assert.equal(cargo?.quantity, 5);
    assert.equal(cargo?.capacityUsed, 5);
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "RETURNING");
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.nextDueWorldTime, null);
    assert.equal(runtime.store.getMissionAttempt(WORLD_ID, dispatched.missionAttemptId)?.phase, "RETURNING");
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CargoExtracted").length, 1);
    const events = runtime.store.events(WORLD_ID);
    assert.deepEqual(events.slice(-2).map((event) => event.eventType), ["CargoExtracted", "MissionAutoReturned"]);
    assert.equal(events.at(-1)?.worldEventCursor, 4);
    assert.deepEqual(events.at(-1)?.typedPayload, {
      missionId: dispatched.missionId,
      missionAttemptId: dispatched.missionAttemptId,
      soldierId: "soldier-a-01",
      reason: "CAPACITY_FULL",
      cargoQuantity: 5,
      cargoCapacityUsed: 5,
      resourceNodeId: "node-wood-a",
      worldTime: 7,
    });
    await runtime.worker.advance(2000);
    assert.equal(runtime.store.listCargo(WORLD_ID)[0]?.quantity, 5);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CargoExtracted").length, 1);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("the final node unit schedules depletion and returns partial cargo", async () => {
  const { runtime, directory } = await openRuntime();
  const dbPath = runtime.store.databasePath;
  try {
    const dispatched = await dispatch(runtime);
    const database = new DatabaseSync(dbPath);
    database.prepare("UPDATE resource_node SET quantity = 1 WHERE world_id = ? AND resource_node_id = ?").run(WORLD_ID, "node-wood-a");
    database.close();

    await runtime.worker.advance(7000);
    const node = runtime.store.listResourceNodes(WORLD_ID).find((candidate) => candidate.resourceNodeId === "node-wood-a");
    assert.equal(node?.quantity, 0);
    assert.equal(node?.nextDueWorldTime, 37);
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "RETURNING");
    assert.equal(runtime.store.listCargo(WORLD_ID)[0]?.quantity, 1);
    const events = runtime.store.events(WORLD_ID);
    assert.deepEqual(events.slice(-3).map((event) => event.eventType), ["CargoExtracted", "ResourceDepleted", "MissionAutoReturned"]);
    assert.equal(events.at(-1)?.worldEventCursor, 5);
    assert.equal(events.filter((event) => event.eventType === "ResourceDepleted").length, 1);
    const depleted = events.find((event) => event.eventType === "ResourceDepleted");
    assert.deepEqual(depleted?.typedPayload, {
      missionAttemptId: dispatched.missionAttemptId,
      resourceNodeId: "node-wood-a",
      resourceType: "wood",
      respawnDueWorldTime: 37,
      worldTime: 7,
    });
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("a failed repeated extraction rolls back the aggregate stack and remains retryable", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatch(runtime);
    await runtime.worker.advance(7000);
    runtime.clock.recoverTo(8);
    const before = runtime.store.listCargo(WORLD_ID)[0];
    assert.equal(before?.quantity, 1);
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("UPDATE mission SET next_due_world_time = 9 WHERE world_id = ? AND mission_id = ?").run(WORLD_ID, dispatched.missionId);
    database.prepare("UPDATE mission_attempt SET next_due_world_time = 9 WHERE world_id = ? AND mission_attempt_id = ?").run(WORLD_ID, dispatched.missionAttemptId);
    database.close();
    assert.throws(
      () => runtime.store.commitMissionExtraction(directRepeatedExtractionInput(runtime, 9, "after_cargo")),
      (error: unknown) => error instanceof PersistenceError && error.code === "INJECTED_FAILURE",
    );
    assert.equal(runtime.store.listCargo(WORLD_ID)[0]?.quantity, 1);
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.nextDueWorldTime, 9);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("restart resumes the persisted next cadence boundary exactly once", async () => {
  const { runtime, directory } = await openRuntime();
  const dbPath = join(directory, "world.sqlite");
  const dispatched = await dispatch(runtime);
  try {
    await runtime.worker.advance(8000);
    assert.equal(runtime.store.listCargo(WORLD_ID)[0]?.quantity, 1);
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.nextDueWorldTime, 9);
  } finally {
    await runtime.worker.stop();
  }

  const resumed = await openRuntime(dbPath);
  try {
    resumed.runtime.clock.recoverTo(9);
    assert.equal(resumed.runtime.store.listCargo(WORLD_ID)[0]?.quantity, 2);
    assert.equal(resumed.runtime.store.getMission(WORLD_ID, dispatched.missionId)?.nextDueWorldTime, 11);
    resumed.runtime.clock.recoverTo(9);
    assert.equal(resumed.runtime.store.listCargo(WORLD_ID)[0]?.quantity, 2);
  } finally {
    await closeRuntime(resumed.runtime, resumed.directory);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a malformed aggregate cargo stack enters recovery before another unit can be added", async () => {
  const { runtime, directory } = await openRuntime();
  const dbPath = runtime.store.databasePath;
  try {
    const dispatched = await dispatch(runtime);
    const cargoId = deterministicCargoId(WORLD_ID, dispatched.missionAttemptId, "node-wood-a");
    const database = new DatabaseSync(dbPath);
    database.prepare("INSERT INTO cargo (world_id, cargo_id, soldier_id, mission_attempt_id, source_node_id, resource_type, quantity, acquired_world_time, capacity_used, revision) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(WORLD_ID, cargoId, "soldier-a-01", dispatched.missionAttemptId, "node-wood-a", "wood", 2, 4, 1, 0);
    database.close();
    assert.throws(
      () => runtime.worker.advance(7000),
      (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED",
    );
    assert.throws(
      () => runtime.store.listCargo(WORLD_ID),
      (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED",
    );
    assert.equal(runtime.store.listResourceNodes(WORLD_ID).find((node) => node.resourceNodeId === "node-wood-a")?.quantity, 20);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("same-node final-unit contest completes with a deterministic winner and loser return", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const first = await dispatch(runtime, { soldierId: "soldier-a-01" });
    const second = await dispatch(runtime, { soldierId: "soldier-a-02" });
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("UPDATE resource_node SET quantity = 1 WHERE world_id = ? AND resource_node_id = ?").run(WORLD_ID, "node-wood-a");
    database.close();

    const ordered = [first, second].sort((left, right) => left.missionAttemptId.localeCompare(right.missionAttemptId));
    await runtime.worker.advance(7000);

    assert.equal(runtime.clock.state, "running");
    assert.equal(runtime.store.listResourceNodes(WORLD_ID).find((node) => node.resourceNodeId === "node-wood-a")?.quantity, 0);
    assert.equal(runtime.store.getMission(WORLD_ID, ordered[0]!.missionId)?.phase, "RETURNING");
    assert.equal(runtime.store.getMission(WORLD_ID, ordered[1]!.missionId)?.phase, "RETURNING");
    assert.equal(runtime.store.listCargo(WORLD_ID).filter((cargo) => cargo.quantity > 0).length, 1);
    const cargo = runtime.store.listCargo(WORLD_ID).find((candidate) => candidate.quantity > 0);
    assert.equal(cargo?.missionAttemptId, ordered[0]!.missionAttemptId);
    const events = runtime.store.events(WORLD_ID);
    assert.equal(events.filter((event) => event.eventType === "CargoExtracted").length, 1);
    assert.equal(events.filter((event) => event.eventType === "ResourceDepleted").length, 1);
    const returns = events.filter((event) => event.eventType === "MissionAutoReturned");
    assert.equal(returns.length, 2);
    assert.deepEqual(returns.map((event) => (event.typedPayload as Record<string, unknown>).reason), ["TARGET_DEPLETED", "TARGET_DEPLETED"]);
    assert.deepEqual(events.slice(-4).map((event) => event.eventType), ["CargoExtracted", "ResourceDepleted", "MissionAutoReturned", "MissionAutoReturned"]);
    assert.equal(events.at(-1)?.worldEventCursor, events.at(-2)?.worldEventCursor! + 1);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("same-node non-terminal contest lets each due attempt consume one available unit", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const first = await dispatch(runtime, { soldierId: "soldier-a-01" });
    const second = await dispatch(runtime, { soldierId: "soldier-a-02" });
    await runtime.worker.advance(7000);

    assert.equal(runtime.clock.state, "running");
    assert.equal(runtime.store.listResourceNodes(WORLD_ID).find((node) => node.resourceNodeId === "node-wood-a")?.quantity, 18);
    assert.equal(runtime.store.getMission(WORLD_ID, first.missionId)?.phase, "WORKING");
    assert.equal(runtime.store.getMission(WORLD_ID, second.missionId)?.phase, "WORKING");
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 2);
    assert.equal(runtime.store.listCargo(WORLD_ID).reduce((total, cargo) => total + cargo.quantity, 0), 2);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CargoExtracted").length, 2);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionAutoReturned").length, 0);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("a contest-loss retry replays one return event and preserves the cargo aggregate", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatch(runtime);
    await runtime.worker.advance(5000);
    const cargoId = deterministicCargoId(WORLD_ID, dispatched.missionAttemptId, "node-wood-a");
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("UPDATE resource_node SET quantity = 0 WHERE world_id = ? AND resource_node_id = ?").run(WORLD_ID, "node-wood-a");
    database.prepare("INSERT INTO cargo (world_id, cargo_id, soldier_id, mission_attempt_id, source_node_id, resource_type, quantity, acquired_world_time, capacity_used, revision) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(WORLD_ID, cargoId, "soldier-a-01", dispatched.missionAttemptId, "node-wood-a", "wood", 2, 5, 2, 0);
    database.close();

    const input = directContestLossInput(runtime, "soldier-a-01", 7);
    const first = runtime.store.commitMissionTargetDepletedReturn(input);
    const duplicate = runtime.store.commitMissionTargetDepletedReturn(input);
    assert.equal(first.duplicate, undefined);
    assert.equal(duplicate.duplicate, true);
    assert.deepEqual(duplicate.eventIds, first.eventIds);
    assert.equal(first.cargoQuantity, 2);
    assert.equal(first.cargoCapacityUsed, 2);
    assert.equal(runtime.store.listCargo(WORLD_ID)[0]?.quantity, 2);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionAutoReturned").length, 1);
    assert.equal(runtime.store.listResourceNodes(WORLD_ID).find((node) => node.resourceNodeId === "node-wood-a")?.quantity, 0);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("contest-loss rejects a forged worker binding or return payload before mutation", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatch(runtime);
    await runtime.worker.advance(5000);
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("UPDATE resource_node SET quantity = 0 WHERE world_id = ? AND resource_node_id = ?").run(WORLD_ID, "node-wood-a");
    database.close();

    const forgedBinding = directContestLossInput(runtime, "soldier-a-01", 7);
    forgedBinding.idempotency.binding = "player:player-a";
    assert.throws(
      () => runtime.store.commitMissionTargetDepletedReturn(forgedBinding),
      (error: unknown) => error instanceof PersistenceError && error.code === "INVALID_INPUT",
    );
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "WORKING");

    const forgedPayload = directContestLossInput(runtime, "soldier-a-01", 7);
    (forgedPayload.event.typedPayload as Record<string, unknown>).reason = "CAPACITY_FULL";
    assert.throws(
      () => runtime.store.commitMissionTargetDepletedReturn(forgedPayload),
      (error: unknown) => error instanceof PersistenceError && error.code === "INVALID_INPUT",
    );
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "WORKING");
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionAutoReturned").length, 0);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("contest-loss keeps a positive target as a visible recovery outcome", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatch(runtime);
    await runtime.worker.advance(5000);
    const beforeNode = runtime.store.listResourceNodes(WORLD_ID).find((node) => node.resourceNodeId === "node-wood-a");
    assert.equal(beforeNode?.quantity, 20);

    const input = directContestLossInput(runtime, "soldier-a-01", 7);
    assert.throws(
      () => runtime.store.commitMissionTargetDepletedReturn(input),
      (error: unknown) => error instanceof PersistenceError && error.code === "TARGET_UNAVAILABLE",
    );
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "WORKING");
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.nextDueWorldTime, 7);
    assert.equal(runtime.store.listResourceNodes(WORLD_ID).find((node) => node.resourceNodeId === "node-wood-a")?.quantity, 20);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionAutoReturned").length, 0);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("a pre-depleted target returns existing cargo without a depletion duplicate", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatch(runtime);
    await runtime.worker.advance(5000);
    const cargoId = deterministicCargoId(WORLD_ID, dispatched.missionAttemptId, "node-wood-a");
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("UPDATE resource_node SET quantity = 0 WHERE world_id = ? AND resource_node_id = ?").run(WORLD_ID, "node-wood-a");
    database.prepare("INSERT INTO cargo (world_id, cargo_id, soldier_id, mission_attempt_id, source_node_id, resource_type, quantity, acquired_world_time, capacity_used, revision) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(WORLD_ID, cargoId, "soldier-a-01", dispatched.missionAttemptId, "node-wood-a", "wood", 2, 5, 2, 0);
    database.close();

    await runtime.worker.advance(2000);
    assert.equal(runtime.clock.state, "running");
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "RETURNING");
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.nextDueWorldTime, null);
    assert.equal(runtime.store.listCargo(WORLD_ID)[0]?.quantity, 2);
    const event = runtime.store.events(WORLD_ID).find((candidate) => candidate.eventType === "MissionAutoReturned");
    assert.deepEqual(event?.typedPayload, {
      missionId: dispatched.missionId,
      missionAttemptId: dispatched.missionAttemptId,
      soldierId: "soldier-a-01",
      reason: "TARGET_DEPLETED",
      cargoQuantity: 2,
      cargoCapacityUsed: 2,
      resourceNodeId: "node-wood-a",
      worldTime: 7,
    });
    assert.equal(runtime.store.events(WORLD_ID).filter((candidate) => candidate.eventType === "ResourceDepleted").length, 0);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("a failed contest-loss transaction rolls back and remains retryable", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatch(runtime);
    await runtime.worker.advance(5000);
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("UPDATE resource_node SET quantity = 0 WHERE world_id = ? AND resource_node_id = ?").run(WORLD_ID, "node-wood-a");
    database.close();
    const input = directContestLossInput(runtime, "soldier-a-01", 7, "after_events");
    assert.throws(
      () => runtime.store.commitMissionTargetDepletedReturn(input),
      (error: unknown) => error instanceof PersistenceError && error.code === "INJECTED_FAILURE",
    );
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "WORKING");
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.nextDueWorldTime, 7);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionAutoReturned").length, 0);
    const retry = directContestLossInput(runtime, "soldier-a-01", 7);
    assert.equal(runtime.store.commitMissionTargetDepletedReturn(retry).returnReason, "TARGET_DEPLETED");
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("a contest-loss restart resumes from the durable due marker exactly once", async () => {
  const { runtime, directory } = await openRuntime();
  const dbPath = join(directory, "world.sqlite");
  const first = await dispatch(runtime, { soldierId: "soldier-a-01" });
  const second = await dispatch(runtime, { soldierId: "soldier-a-02" });
  try {
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("UPDATE resource_node SET quantity = 1 WHERE world_id = ? AND resource_node_id = ?").run(WORLD_ID, "node-wood-a");
    database.close();
    await runtime.worker.advance(6000);
  } finally {
    await runtime.worker.stop();
  }

  const resumed = await openRuntime(dbPath);
  try {
    resumed.runtime.clock.recoverTo(7);
    assert.equal(resumed.runtime.clock.state, "running");
    assert.equal(resumed.runtime.store.listResourceNodes(WORLD_ID).find((node) => node.resourceNodeId === "node-wood-a")?.quantity, 0);
    assert.equal(resumed.runtime.store.listCargo(WORLD_ID).reduce((total, cargo) => total + cargo.quantity, 0), 1);
    assert.equal(resumed.runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionAutoReturned").length, 2);
    resumed.runtime.clock.recoverTo(7);
    assert.equal(resumed.runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionAutoReturned").length, 2);
    assert.ok(resumed.runtime.store.getMission(WORLD_ID, first.missionId));
    assert.ok(resumed.runtime.store.getMission(WORLD_ID, second.missionId));
  } finally {
    await closeRuntime(resumed.runtime, resumed.directory);
    rmSync(directory, { recursive: true, force: true });
  }
});
