import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { createPersistenceStore, PersistenceError, deterministicCargoId } from "../src/server/persistence/store";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import { MissionDepositService } from "../src/server/mission-deposit-service";
import { MissionExtractionService } from "../src/server/mission-extraction-service";
import { MissionReturnService } from "../src/server/mission-return-service";
import { MissionTravelService } from "../src/server/mission-travel-service";
import { WorldClock } from "../src/server/world-clock";
import { WorldWorkerModule } from "../src/server/world-worker";
import type { CommitMissionDepositInput, MissionTool } from "../src/server/persistence/types";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp10-deposit-world";

interface Runtime {
  store: ReturnType<typeof createPersistenceStore>;
  worker: WorldWorkerModule;
  deposit: MissionDepositService;
}

async function openRuntime(options: { dbPath?: string; withDeposit?: boolean } = {}): Promise<{ runtime: Runtime; directory: string }> {
  const directory = options.dbPath ? "" : mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp10-deposit-"));
  const dbPath = options.dbPath ?? join(directory, "world.sqlite");
  const seedStore = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  seedStore.open();
  if (!seedStore.getWorld(WORLD_ID)) {
    createAndPersistG2Fixture(seedStore, {
      worldId: WORLD_ID,
      playerBindings: { "player-a": "binding-a", "player-b": "binding-b" },
    });
  }
  seedStore.close();

  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const travel = new MissionTravelService({ store });
  const extraction = new MissionExtractionService({ store });
  const returning = new MissionReturnService({ store });
  const deposit = new MissionDepositService({ store });
  const clock = new WorldClock({
    worldId: WORLD_ID,
    persistence: store,
    phaseHandlers: {
      movement: (context) => {
        travel.advanceAtBoundary(context);
        returning.advanceAtBoundary(context);
      },
      ...(options.withDeposit ? { deposit: (context) => deposit.advanceAtBoundary(context) } : {}),
      extraction: (context) => extraction.advanceAtBoundary(context),
    },
  });
  const worker = new WorldWorkerModule({ store, clock });
  await worker.start();
  return { runtime: { store, worker, deposit }, directory };
}

async function closeRuntime(runtime: Runtime, directory: string): Promise<void> {
  await runtime.worker.stop();
  if (directory) {
    rmSync(directory, { recursive: true, force: true });
  }
}

async function dispatch(runtime: Runtime, options: { soldierId?: string; targetId?: string; tool?: MissionTool; key?: string } = {}) {
  if (!runtime.worker.gateway) {
    throw new Error("worker gateway unavailable");
  }
  const soldierId = options.soldierId ?? "soldier-a-01";
  const idempotencyKey = options.key ?? `cp10-deposit-dispatch-${soldierId}`;
  return runtime.worker.gateway.assignSoldierMission({
    worldId: WORLD_ID,
    playerId: "player-a",
    binding: "binding-a",
    soldierId,
    role: "GATHERER",
    tool: options.tool ?? (options.targetId === "node-rock-a" ? "PICKAXE" : "AXE"),
    equipmentTier: 1,
    targetId: options.targetId ?? "node-wood-a",
    expectedSoldierRevision: runtime.store.listSoldiers(WORLD_ID).find((soldier) => soldier.soldierId === soldierId)?.revision ?? 0,
    commandId: `command-${idempotencyKey}`,
    idempotencyKey,
  });
}

async function prepareDepositing(runtime: Runtime, options: { soldierId?: string; targetId?: string; tool?: MissionTool; key?: string } = {}) {
  const dispatched = await dispatch(runtime, options);
  const nodeId = options.targetId ?? "node-wood-a";
  const database = new DatabaseSync(runtime.store.databasePath);
  database.prepare("UPDATE resource_node SET quantity = 1 WHERE world_id = ? AND resource_node_id = ?").run(WORLD_ID, nodeId);
  database.close();
  await runtime.worker.advance(nodeId === "node-rock-a" ? 14000 : 12000);
  assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "DEPOSITING");
  return dispatched;
}

function depositInput(runtime: Runtime, overrides: Partial<CommitMissionDepositInput> = {}): CommitMissionDepositInput {
  const mission = runtime.store.listMissions(WORLD_ID)[0];
  const attempt = mission?.activeAttemptId ? runtime.store.getMissionAttempt(WORLD_ID, mission.activeAttemptId) : null;
  const soldier = runtime.store.listSoldiers(WORLD_ID).find((candidate) => candidate.soldierId === "soldier-a-01");
  const shelter = soldier ? runtime.store.getShelter(WORLD_ID, soldier.shelterId) : null;
  const cargo = attempt ? runtime.store.listCargo(WORLD_ID, soldier?.soldierId, attempt.missionAttemptId) : [];
  if (!mission || !attempt || !soldier || !shelter || attempt.phase !== "DEPOSITING") {
    throw new Error("deposit fixture not ready");
  }
  const homeCrossingWorldTime = attempt.lastTransitionWorldTime;
  const workId = `mission-deposit:${attempt.missionAttemptId}:${homeCrossingWorldTime}`;
  const cargoEventId = `mission-cargo-deposited:${attempt.missionAttemptId}:${homeCrossingWorldTime}`;
  const coinDelta = cargo.reduce((total, item) => total + (item.resourceType === "wood" ? item.quantity : item.quantity * 3), 0);
  const previousCoins = shelter.coins;
  const newCoins = previousCoins + coinDelta;
  const base: CommitMissionDepositInput = {
    worldId: WORLD_ID,
    worldTime: homeCrossingWorldTime,
    homeCrossingWorldTime,
    idempotency: {
      key: workId,
      binding: `worker:${WORLD_ID}`,
      request: {
        kind: "mission_deposit",
        missionId: mission.missionId,
        missionAttemptId: attempt.missionAttemptId,
        soldierId: soldier.soldierId,
        homeCrossingWorldTime,
      },
    },
    soldierId: soldier.soldierId,
    expectedSoldierRevision: soldier.revision,
    missionId: mission.missionId,
    expectedMissionRevision: mission.revision,
    missionAttemptId: attempt.missionAttemptId,
    expectedMissionAttemptRevision: attempt.revision,
    shelterId: shelter.shelterId,
    expectedShelterRevision: shelter.revision,
    expectedCargo: cargo,
    cargoDepositedEvent: {
      eventId: cargoEventId,
      eventType: "CargoDeposited",
      causationId: workId,
      idempotencyKey: workId,
      aggregateType: "mission",
      aggregateId: mission.missionId,
      visibilityScope: { kind: "shelter", shelterId: shelter.shelterId },
      typedPayload: {
        missionId: mission.missionId,
        missionAttemptId: attempt.missionAttemptId,
        soldierId: soldier.soldierId,
        shelterId: shelter.shelterId,
        items: cargo.map((item) => ({
          cargoId: item.cargoId,
          sourceNodeId: item.sourceNodeId,
          resourceType: item.resourceType,
          quantity: item.quantity,
          capacityUsed: item.capacityUsed,
          acquiredWorldTime: item.acquiredWorldTime,
        })),
        totalQuantity: cargo.reduce((total, item) => total + item.quantity, 0),
        totalCapacityUsed: cargo.reduce((total, item) => total + item.capacityUsed, 0),
        coinDelta,
        previousPhase: "DEPOSITING",
        phase: "AT_SHELTER",
        homeCrossingWorldTime,
        worldTime: homeCrossingWorldTime,
      },
    },
    ...(coinDelta > 0 ? {
      coinsCreditedEvent: {
        eventId: `shelter-coins-credited:${shelter.shelterId}:${attempt.missionAttemptId}:${homeCrossingWorldTime}`,
        eventType: "CoinsCredited",
        causationId: workId,
        idempotencyKey: workId,
        aggregateType: "shelter",
        aggregateId: shelter.shelterId,
        visibilityScope: { kind: "shelter", shelterId: shelter.shelterId },
        typedPayload: {
          shelterId: shelter.shelterId,
          missionId: mission.missionId,
          missionAttemptId: attempt.missionAttemptId,
          soldierId: soldier.soldierId,
          cargoEventId,
          coinDelta,
          previousCoins,
          newCoins,
          worldTime: homeCrossingWorldTime,
        },
      },
    } : {}),
    ...overrides,
  };
  return base;
}

test("Wood settlement credits one coin and returns the soldier to the shelter", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await prepareDepositing(runtime);
    const [result] = runtime.deposit.advanceAtBoundary({ worldId: WORLD_ID, worldTime: 12 });
    assert.equal(result?.effect, "mission_deposited");
    assert.equal(result?.coinDelta, 1);
    assert.equal(runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, 1);
    assert.deepEqual(runtime.store.listCargo(WORLD_ID), []);
    assert.deepEqual(runtime.store.listSoldiers(WORLD_ID).find((soldier) => soldier.soldierId === "soldier-a-01"), {
      worldId: WORLD_ID,
      soldierId: "soldier-a-01",
      shelterId: "shelter-a",
      state: "AT_SHELTER",
      role: null,
      tool: null,
      revision: 2,
    });
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "AT_SHELTER");
    assert.equal(runtime.store.getMissionAttempt(WORLD_ID, dispatched.missionAttemptId)?.phase, "TERMINAL");
    assert.deepEqual(runtime.store.events(WORLD_ID).slice(-2).map((event) => event.eventType), ["CargoDeposited", "CoinsCredited"]);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("Rock settlement uses the three-coin conversion", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await dispatch(runtime, { soldierId: "soldier-a-02", targetId: "node-rock-a", tool: "PICKAXE", key: "cp10-deposit-rock-dispatch" });
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("UPDATE resource_node SET quantity = 1 WHERE world_id = ? AND resource_node_id = ?").run(WORLD_ID, "node-rock-a");
    database.close();
    await runtime.worker.advance(14000);
    const result = runtime.deposit.advanceAtBoundary({ worldId: WORLD_ID, worldTime: 14 })[0];
    assert.equal(result?.coinDelta, 3);
    assert.equal(runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, 3);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("mixed Wood and Rock cargo settles as one deterministic wallet credit", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await prepareDepositing(runtime);
    const rockCargoId = "mixed-rock-cargo";
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("INSERT INTO cargo (world_id, cargo_id, soldier_id, mission_attempt_id, source_node_id, resource_type, quantity, acquired_world_time, capacity_used, revision) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(WORLD_ID, rockCargoId, "soldier-a-01", dispatched.missionAttemptId, "node-rock-a", "rock", 2, 8, 2, 0);
    database.close();
    const input = depositInput(runtime);
    const result = runtime.store.commitMissionDeposit(input);
    assert.equal(result.coinDelta, 7);
    assert.equal(result.cargoQuantity, 3);
    assert.equal(result.cargoCapacityUsed, 3);
    assert.equal(runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, 7);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("zero cargo completes the resident handoff without manufacturing coins", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await prepareDepositing(runtime);
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("DELETE FROM cargo WHERE world_id = ? AND soldier_id = ?").run(WORLD_ID, "soldier-a-01");
    database.close();
    const result = runtime.deposit.advanceAtBoundary({ worldId: WORLD_ID, worldTime: 12 })[0];
    assert.equal(result?.coinDelta, 0);
    assert.equal(result?.coinsCreditedEventId, null);
    assert.equal(runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, 0);
    assert.deepEqual(runtime.store.events(WORLD_ID).slice(-1).map((event) => event.eventType), ["CargoDeposited"]);
    assert.equal(runtime.store.getMission(WORLD_ID, result!.missionId)?.phase, "AT_SHELTER");
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("an identical retry replays settlement without a second deletion, credit, or event", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await prepareDepositing(runtime);
    const input = depositInput(runtime);
    const first = runtime.store.commitMissionDeposit(input);
    const duplicate = runtime.store.commitMissionDeposit(input);
    assert.equal(duplicate.duplicate, true);
    assert.deepEqual(duplicate.eventIds, first.eventIds);
    assert.equal(runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, 1);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CoinsCredited").length, 1);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("a changed duplicate request is rejected before touching the settled state", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await prepareDepositing(runtime);
    const input = depositInput(runtime);
    runtime.store.commitMissionDeposit(input);
    const changed = { ...input, idempotency: { ...input.idempotency, request: { ...(input.idempotency.request as Record<string, unknown>), replay: "changed" } } };
    assert.throws(
      () => runtime.store.commitMissionDeposit(changed),
      (error: unknown) => error instanceof PersistenceError && error.code === "DUPLICATE_COMMAND",
    );
    assert.equal(runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, 1);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CoinsCredited").length, 1);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("settlement rejects a forged event payload or foreign shelter visibility before mutation", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await prepareDepositing(runtime);
    const forged = depositInput(runtime);
    (forged.cargoDepositedEvent.typedPayload as Record<string, unknown>).coinDelta = 99;
    assert.throws(
      () => runtime.store.commitMissionDeposit(forged),
      (error: unknown) => error instanceof PersistenceError && error.code === "INVALID_INPUT",
    );
    const foreign = depositInput(runtime);
    foreign.cargoDepositedEvent.visibilityScope = { kind: "shelter", shelterId: "shelter-b" };
    assert.throws(
      () => runtime.store.commitMissionDeposit(foreign),
      (error: unknown) => error instanceof PersistenceError && error.code === "OWNERSHIP_DENIED",
    );
    assert.equal(runtime.store.getMission(WORLD_ID, forged.missionId)?.phase, "DEPOSITING");
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 1);
    assert.equal(runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, 0);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("stale shelter or cargo revisions preserve DEPOSITING and exposed cargo", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await prepareDepositing(runtime);
    const staleShelter = depositInput(runtime);
    staleShelter.expectedShelterRevision += 1;
    assert.throws(() => runtime.store.commitMissionDeposit(staleShelter), (error: unknown) => error instanceof PersistenceError && error.code === "STALE_REVISION");
    const staleCargo = depositInput(runtime);
    staleCargo.expectedCargo = staleCargo.expectedCargo.map((cargo) => ({ ...cargo, revision: cargo.revision + 1 }));
    assert.throws(() => runtime.store.commitMissionDeposit(staleCargo), (error: unknown) => error instanceof PersistenceError && error.code === "STALE_REVISION");
    const staleSoldier = depositInput(runtime);
    staleSoldier.expectedSoldierRevision += 1;
    assert.throws(() => runtime.store.commitMissionDeposit(staleSoldier), (error: unknown) => error instanceof PersistenceError && error.code === "STALE_REVISION");
    const staleMission = depositInput(runtime);
    staleMission.expectedMissionRevision += 1;
    assert.throws(() => runtime.store.commitMissionDeposit(staleMission), (error: unknown) => error instanceof PersistenceError && error.code === "STALE_REVISION");
    const staleAttempt = depositInput(runtime);
    staleAttempt.expectedMissionAttemptRevision += 1;
    assert.throws(() => runtime.store.commitMissionDeposit(staleAttempt), (error: unknown) => error instanceof PersistenceError && error.code === "STALE_REVISION");
    assert.equal(runtime.store.getMission(WORLD_ID, staleShelter.missionId)?.phase, "DEPOSITING");
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 1);
    assert.equal(runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, 0);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("an orphan cargo row is a recovery fault and is never silently discarded", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await prepareDepositing(runtime);
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("INSERT INTO cargo (world_id, cargo_id, soldier_id, mission_attempt_id, source_node_id, resource_type, quantity, acquired_world_time, capacity_used, revision) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)").run(WORLD_ID, "orphan-cargo", "soldier-a-01", "node-wood-a", "wood", 1, 8, 1, 0);
    database.close();
    assert.throws(
      () => runtime.deposit.advanceAtBoundary({ worldId: WORLD_ID, worldTime: 12 }),
      (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED",
    );
    assert.equal(runtime.store.getMission(WORLD_ID, runtime.store.listMissions(WORLD_ID)[0]!.missionId)?.phase, "DEPOSITING");
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 2);
    assert.equal(runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, 0);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("malformed cargo provenance fails visibly without dropping the cargo", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await prepareDepositing(runtime);
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("UPDATE cargo SET source_node_id = ? WHERE world_id = ? AND soldier_id = ?").run("node-rock-a", WORLD_ID, "soldier-a-01");
    database.close();
    assert.throws(
      () => runtime.deposit.advanceAtBoundary({ worldId: WORLD_ID, worldTime: 12 }),
      (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED",
    );
    assert.equal(runtime.store.getMission(WORLD_ID, runtime.store.listMissions(WORLD_ID)[0]!.missionId)?.phase, "DEPOSITING");
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 1);
    assert.equal(runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, 0);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("injected failure after settlement events rolls back state, cursor, wallet, and idempotency", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await prepareDepositing(runtime);
    const input = { ...depositInput(runtime), injectFailureAt: "after_events" as const };
    const before = runtime.store.getWorld(WORLD_ID);
    assert.throws(() => runtime.store.commitMissionDeposit(input), (error: unknown) => error instanceof PersistenceError && error.code === "INJECTED_FAILURE");
    assert.equal(runtime.store.getWorld(WORLD_ID)?.worldEventCursor, before?.worldEventCursor);
    assert.equal(runtime.store.getMission(WORLD_ID, input.missionId)?.phase, "DEPOSITING");
    assert.equal(runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, 0);
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 1);
    assert.equal(runtime.store.idempotency(WORLD_ID, input.idempotency.key), null);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("injected failure after state mutation rolls back the complete settlement transaction", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await prepareDepositing(runtime);
    const input = { ...depositInput(runtime), injectFailureAt: "after_state" as const };
    const before = runtime.store.getWorld(WORLD_ID);
    assert.throws(() => runtime.store.commitMissionDeposit(input), (error: unknown) => error instanceof PersistenceError && error.code === "INJECTED_FAILURE");
    assert.equal(runtime.store.getWorld(WORLD_ID)?.worldEventCursor, before?.worldEventCursor);
    assert.equal(runtime.store.getMission(WORLD_ID, input.missionId)?.phase, "DEPOSITING");
    assert.equal(runtime.store.getMissionAttempt(WORLD_ID, input.missionAttemptId)?.phase, "DEPOSITING");
    assert.equal(runtime.store.listSoldiers(WORLD_ID).find((soldier) => soldier.soldierId === input.soldierId)?.state, "FIELD");
    assert.equal(runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, 0);
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 1);
    assert.equal(runtime.store.idempotency(WORLD_ID, input.idempotency.key), null);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("a deposit handler cannot skip more than one durable world boundary", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await prepareDepositing(runtime);
    assert.throws(
      () => runtime.deposit.advanceAtBoundary({ worldId: WORLD_ID, worldTime: 14 }),
      (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED",
    );
    assert.equal(runtime.store.getMission(WORLD_ID, runtime.store.listMissions(WORLD_ID)[0]!.missionId)?.phase, "DEPOSITING");
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 1);
    assert.equal(runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, 0);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("a delayed restart settles the durable DEPOSITING attempt once with its original crossing key", async () => {
  const { runtime, directory } = await openRuntime();
  const dbPath = join(directory, "world.sqlite");
  await prepareDepositing(runtime);
  await runtime.worker.stop();
  const resumed = await openRuntime({ dbPath, withDeposit: true });
  try {
    await resumed.runtime.worker.advance(1000);
    assert.equal(resumed.runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, 1);
    assert.equal(resumed.runtime.store.listCargo(WORLD_ID).length, 0);
    assert.equal(resumed.runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CoinsCredited").length, 1);
    await resumed.runtime.worker.advance(1000);
    assert.equal(resumed.runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CoinsCredited").length, 1);
  } finally {
    await closeRuntime(resumed.runtime, resumed.directory);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a completed resident mission row can be manually dispatched again with a fresh attempt", async () => {
  const { runtime, directory } = await openRuntime();
  const dbPath = join(directory, "world.sqlite");
  let originalStopped = false;
  let resumedRuntime: Runtime | null = null;
  try {
    const firstKey = "cp10-deposit-dispatch-soldier-a-01";
    const first = await prepareDepositing(runtime, { key: firstKey });
    runtime.deposit.advanceAtBoundary({ worldId: WORLD_ID, worldTime: 12 });
    if (!runtime.worker.gateway) {
      throw new Error("worker gateway unavailable");
    }
    const soldier = runtime.store.listSoldiers(WORLD_ID).find((candidate) => candidate.soldierId === "soldier-a-01");
    const settledMissionRevision = runtime.store.getMission(WORLD_ID, first.missionId)?.revision;
    const second = await runtime.worker.gateway.assignSoldierMission({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      soldierId: "soldier-a-01",
      role: "GATHERER",
      tool: "PICKAXE",
      equipmentTier: 1,
      targetId: "node-rock-a",
      expectedSoldierRevision: soldier!.revision,
      commandId: "command-cp10-deposit-redispatch-02",
      idempotencyKey: "cp10-deposit-redispatch-02",
    });
    assert.equal(second.missionId, first.missionId);
    assert.notEqual(second.missionAttemptId, first.missionAttemptId);
    assert.equal(second.missionRevision, settledMissionRevision! + 1);
    assert.equal(runtime.store.listMissionAttempts(WORLD_ID).length, 2);
    assert.equal(runtime.store.getMissionAttempt(WORLD_ID, first.missionAttemptId)?.phase, "TERMINAL");
    assert.equal(runtime.store.getMission(WORLD_ID, first.missionId)?.activeAttemptId, second.missionAttemptId);

    await runtime.worker.stop();
    originalStopped = true;
    const resumed = await openRuntime({ dbPath });
    resumedRuntime = resumed.runtime;
    if (!resumedRuntime.worker.gateway) {
      throw new Error("resumed worker gateway unavailable");
    }
    const replay = await resumedRuntime.worker.gateway.assignSoldierMission({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      soldierId: "soldier-a-01",
      role: "GATHERER",
      tool: "AXE",
      equipmentTier: 1,
      targetId: "node-wood-a",
      expectedSoldierRevision: 0,
      commandId: `command-${firstKey}`,
      idempotencyKey: firstKey,
    });
    assert.equal(replay.duplicate, true);
    assert.equal(replay.missionId, first.missionId);
    assert.equal(replay.missionAttemptId, first.missionAttemptId);
    assert.equal(replay.eventId, first.eventId);
    assert.equal(replay.soldierRevision, first.soldierRevision);
    assert.equal(replay.missionRevision, first.missionRevision);
    assert.equal(replay.missionAttemptRevision, first.missionAttemptRevision);
    assert.equal(resumedRuntime.store.listMissionAttempts(WORLD_ID).length, 2);
    assert.equal(
      resumedRuntime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionDispatched").length,
      2,
    );
    assert.equal(resumedRuntime.store.getMission(WORLD_ID, first.missionId)?.activeAttemptId, second.missionAttemptId);
    assert.equal(resumedRuntime.store.getMissionAttempt(WORLD_ID, second.missionAttemptId)?.state.toUpperCase(), "ACTIVE");
  } finally {
    if (resumedRuntime) {
      await resumedRuntime.worker.stop();
    } else if (!originalStopped) {
      await runtime.worker.stop();
    }
    rmSync(directory, { recursive: true, force: true });
  }
});

test("shelter wallet overflow is rejected without changing the settlement boundary", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await prepareDepositing(runtime);
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("UPDATE shelter SET coins = ? WHERE world_id = ? AND shelter_id = ?").run(Number.MAX_SAFE_INTEGER, WORLD_ID, "shelter-a");
    database.close();
    assert.throws(
      () => runtime.deposit.advanceAtBoundary({ worldId: WORLD_ID, worldTime: 12 }),
      (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED",
    );
    assert.equal(runtime.store.getMission(WORLD_ID, runtime.store.listMissions(WORLD_ID)[0]!.missionId)?.phase, "DEPOSITING");
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 1);
    assert.equal(runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, Number.MAX_SAFE_INTEGER);
  } finally {
    await closeRuntime(runtime, directory);
  }
});
