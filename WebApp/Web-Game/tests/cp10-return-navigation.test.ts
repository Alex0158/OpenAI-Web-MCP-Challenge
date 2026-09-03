import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { createPersistenceStore, PersistenceError } from "../src/server/persistence/store";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import { MissionExtractionService } from "../src/server/mission-extraction-service";
import { MissionReturnService } from "../src/server/mission-return-service";
import { MissionTravelService } from "../src/server/mission-travel-service";
import { WorldClock } from "../src/server/world-clock";
import { WorldWorkerModule } from "../src/server/world-worker";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp10-return-world";

interface Runtime {
  store: ReturnType<typeof createPersistenceStore>;
  worker: WorldWorkerModule;
  clock: WorldClock;
  travel: MissionTravelService;
  extraction: MissionExtractionService;
  returning: MissionReturnService;
}

async function openRuntime(dbPath?: string): Promise<{ runtime: Runtime; directory: string }> {
  const directory = dbPath ? undefined : mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp10-return-"));
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
  const returning = new MissionReturnService({ store });
  const clock = new WorldClock({
    worldId: WORLD_ID,
    persistence: store,
    phaseHandlers: {
      movement: (context) => {
        travel.advanceAtBoundary(context);
        returning.advanceAtBoundary(context);
      },
      extraction: (context) => extraction.advanceAtBoundary(context),
    },
  });
  const worker = new WorldWorkerModule({ store, clock });
  await worker.start();
  return { runtime: { store, worker, clock, travel, extraction, returning }, directory: directory as string };
}

async function closeRuntime(runtime: Runtime, directory: string): Promise<void> {
  await runtime.worker.stop();
  if (directory) {
    rmSync(directory, { recursive: true, force: true });
  }
}

async function dispatch(runtime: Runtime) {
  if (!runtime.worker.gateway) {
    throw new Error("worker gateway unavailable");
  }
  return runtime.worker.gateway.assignSoldierMission({
    worldId: WORLD_ID,
    playerId: "player-a",
    binding: "binding-a",
    soldierId: "soldier-a-01",
    role: "GATHERER",
    tool: "AXE",
    equipmentTier: 1,
    targetId: "node-wood-a",
    expectedSoldierRevision: 0,
    commandId: "command-cp10-return-dispatch-01",
    idempotencyKey: "cp10-return-dispatch-01",
  });
}

function makeTargetDepletedReturn(runtime: Runtime, worldTime: number, overrides: Record<string, unknown> = {}) {
  const mission = runtime.store.listMissions(WORLD_ID)[0];
  const attempt = mission?.activeAttemptId ? runtime.store.getMissionAttempt(WORLD_ID, mission.activeAttemptId) : null;
  const soldier = runtime.store.listSoldiers(WORLD_ID).find((candidate) => candidate.soldierId === "soldier-a-01");
  const node = runtime.store.listResourceNodes(WORLD_ID).find((candidate) => candidate.resourceNodeId === "node-wood-a");
  if (!mission || !attempt || !soldier || !node || !attempt.route || !attempt.homeAnchor || attempt.lastTransitionWorldTime !== 7) {
    throw new Error("return fixture not ready");
  }
  const dueWorldTime = attempt.lastTransitionWorldTime + (attempt.route?.estimatedTravelWorldSeconds ?? 0);
  const workId = `mission-return-home:${attempt.missionAttemptId}:${dueWorldTime}`;
  const eventId = `mission-home-reached:${attempt.missionAttemptId}:${dueWorldTime}`;
  const input = {
    worldId: WORLD_ID,
    worldTime,
    returnDueWorldTime: dueWorldTime,
    idempotency: {
      key: workId,
      binding: `worker:${WORLD_ID}`,
      request: {
        kind: "mission_home_arrival",
        missionId: mission.missionId,
        missionAttemptId: attempt.missionAttemptId,
        returnDueWorldTime: dueWorldTime,
        worldTime,
      },
    },
    soldierId: soldier.soldierId,
    expectedSoldierRevision: soldier.revision,
    missionId: mission.missionId,
    expectedMissionRevision: mission.revision,
    missionAttemptId: attempt.missionAttemptId,
    expectedMissionAttemptRevision: attempt.revision,
    event: {
      eventId,
      eventType: "MissionHomeReached",
      causationId: workId,
      idempotencyKey: workId,
      aggregateType: "mission",
      aggregateId: mission.missionId,
      visibilityScope: { kind: "shelter" as const, shelterId: soldier.shelterId },
      typedPayload: {
        missionId: mission.missionId,
        missionAttemptId: attempt.missionAttemptId,
        soldierId: soldier.soldierId,
        homeAnchor: attempt.homeAnchor,
        returnDueWorldTime: dueWorldTime,
        previousPhase: "RETURNING",
        phase: "DEPOSITING",
        arrivalPosition: {
          x: attempt.homeAnchor?.x,
          y: attempt.homeAnchor?.y,
          waypointIndex: (attempt.route?.waypoints.length ?? 1) - 1,
          progressTiles: (attempt.route?.waypoints.length ?? 1) - 1,
          arrived: true,
        },
        worldTime,
      },
    },
    ...overrides,
  };
  return input;
}

test("return position reverses the committed route and does not cross before due", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatch(runtime);
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("UPDATE resource_node SET quantity = 1 WHERE world_id = ? AND resource_node_id = ?").run(WORLD_ID, "node-wood-a");
    database.close();
    await runtime.worker.advance(8000);
    const attempt = runtime.store.getMissionAttempt(WORLD_ID, dispatched.missionAttemptId);
    assert.equal(attempt?.phase, "RETURNING");
    const before = runtime.returning.advanceAtBoundary({ worldId: WORLD_ID, worldTime: 8, elapsedMs: 0 });
    assert.deepEqual(before, []);
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "RETURNING");
    const position = runtime.returning.positionAt({ worldId: WORLD_ID, missionAttemptId: dispatched.missionAttemptId, worldTime: 8 });
    assert.deepEqual(position, { x: 27, y: 64, waypointIndex: 3, progressTiles: 3, arrived: false });
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("due return crosses home once, preserves cargo, and enters DEPOSITING before deposit", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatch(runtime);
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("UPDATE resource_node SET quantity = 1 WHERE world_id = ? AND resource_node_id = ?").run(WORLD_ID, "node-wood-a");
    database.close();
    await runtime.worker.advance(12000);
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "DEPOSITING");
    assert.equal(runtime.store.getMissionAttempt(WORLD_ID, dispatched.missionAttemptId)?.phase, "DEPOSITING");
    assert.equal(runtime.store.listSoldiers(WORLD_ID).find((soldier) => soldier.soldierId === "soldier-a-01")?.state, "FIELD");
    assert.equal(runtime.store.listCargo(WORLD_ID)[0]?.quantity, 1);
    assert.equal(runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, 0);
    const events = runtime.store.events(WORLD_ID);
    assert.equal(events.filter((event) => event.eventType === "MissionHomeReached").length, 1);
    assert.equal(events.at(-1)?.eventType, "MissionHomeReached");
    assert.deepEqual(events.at(-1)?.typedPayload, {
      missionId: dispatched.missionId,
      missionAttemptId: dispatched.missionAttemptId,
      soldierId: "soldier-a-01",
      homeAnchor: { x: 16, y: 64 },
      returnDueWorldTime: 12,
      previousPhase: "RETURNING",
      phase: "DEPOSITING",
      arrivalPosition: { x: 16, y: 64, waypointIndex: 14, progressTiles: 14, arrived: true },
      worldTime: 12,
    });
    const second = runtime.returning.advanceAtBoundary({ worldId: WORLD_ID, worldTime: 12, elapsedMs: 0 });
    assert.deepEqual(second, []);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionHomeReached").length, 1);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("home arrival transaction rejects a forged payload without touching RETURNING state", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await dispatch(runtime);
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("UPDATE resource_node SET quantity = 1 WHERE world_id = ? AND resource_node_id = ?").run(WORLD_ID, "node-wood-a");
    database.close();
    await runtime.worker.advance(8000);
    const input = makeTargetDepletedReturn(runtime, 12);
    (input.event.typedPayload as Record<string, unknown>).homeAnchor = { x: 999, y: 999 };
    assert.throws(
      () => runtime.store.commitMissionHomeArrival(input),
      (error: unknown) => error instanceof PersistenceError && error.code === "INVALID_INPUT",
    );
    assert.equal(runtime.store.getMission(WORLD_ID, input.missionId)?.phase, "RETURNING");
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionHomeReached").length, 0);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("home arrival transaction rejects stale revisions and preserves the return boundary", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await dispatch(runtime);
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("UPDATE resource_node SET quantity = 1 WHERE world_id = ? AND resource_node_id = ?").run(WORLD_ID, "node-wood-a");
    database.close();
    await runtime.worker.advance(8000);
    const input = makeTargetDepletedReturn(runtime, 12);
    input.expectedMissionRevision += 1;
    assert.throws(
      () => runtime.store.commitMissionHomeArrival(input),
      (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED",
    );
    assert.equal(runtime.store.getWorld(WORLD_ID)?.worldTime, 8);
    assert.equal(runtime.store.getMission(WORLD_ID, input.missionId)?.phase, "RETURNING");
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionHomeReached").length, 0);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("home arrival transaction rolls back state, cursor, and world time after an injected event failure", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await dispatch(runtime);
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("UPDATE resource_node SET quantity = 1 WHERE world_id = ? AND resource_node_id = ?").run(WORLD_ID, "node-wood-a");
    database.close();
    await runtime.worker.advance(8000);
    const input = { ...makeTargetDepletedReturn(runtime, 12), injectFailureAt: "after_events" as const };
    const cursorBefore = runtime.store.getWorld(WORLD_ID)?.worldEventCursor;
    assert.throws(
      () => runtime.store.commitMissionHomeArrival(input),
      (error: unknown) => error instanceof PersistenceError && error.code === "INJECTED_FAILURE",
    );
    assert.equal(runtime.store.getWorld(WORLD_ID)?.worldTime, 8);
    assert.equal(runtime.store.getWorld(WORLD_ID)?.worldEventCursor, cursorBefore);
    assert.equal(runtime.store.getMission(WORLD_ID, input.missionId)?.phase, "RETURNING");
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionHomeReached").length, 0);
    assert.equal(runtime.store.idempotency(WORLD_ID, input.idempotency.key), null);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("home arrival transaction enforces shelter ownership before changing RETURNING state", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await dispatch(runtime);
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("UPDATE resource_node SET quantity = 1 WHERE world_id = ? AND resource_node_id = ?").run(WORLD_ID, "node-wood-a");
    database.close();
    await runtime.worker.advance(8000);
    const input = makeTargetDepletedReturn(runtime, 12);
    input.event.visibilityScope = { kind: "shelter", shelterId: "shelter-b" };
    assert.throws(
      () => runtime.store.commitMissionHomeArrival(input),
      (error: unknown) => error instanceof PersistenceError && error.code === "OWNERSHIP_DENIED",
    );
    assert.equal(runtime.store.getMission(WORLD_ID, input.missionId)?.phase, "RETURNING");
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionHomeReached").length, 0);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("home arrival transaction replays the same result and event for an identical retry", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await dispatch(runtime);
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("UPDATE resource_node SET quantity = 1 WHERE world_id = ? AND resource_node_id = ?").run(WORLD_ID, "node-wood-a");
    database.close();
    await runtime.worker.advance(8000);
    const input = makeTargetDepletedReturn(runtime, 12);
    const first = runtime.store.commitMissionHomeArrival(input);
    const duplicate = runtime.store.commitMissionHomeArrival(input);
    assert.equal(first.duplicate, undefined);
    assert.equal(duplicate.duplicate, true);
    assert.deepEqual(duplicate.eventIds, first.eventIds);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionHomeReached").length, 1);
    assert.equal(runtime.store.getMission(WORLD_ID, input.missionId)?.phase, "DEPOSITING");
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("return navigation fails visibly when the durable route no longer starts at home", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatch(runtime);
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("UPDATE resource_node SET quantity = 1 WHERE world_id = ? AND resource_node_id = ?").run(WORLD_ID, "node-wood-a");
    database.close();
    await runtime.worker.advance(8000);
    const attempt = runtime.store.getMissionAttempt(WORLD_ID, dispatched.missionAttemptId);
    assert.ok(attempt?.route);
    const malformedRoute = { ...attempt.route, source: { x: 999, y: 999 } };
    const routeDatabase = new DatabaseSync(runtime.store.databasePath);
    routeDatabase.prepare("UPDATE mission_attempt SET route_json = ? WHERE world_id = ? AND mission_attempt_id = ?").run(JSON.stringify(malformedRoute), WORLD_ID, dispatched.missionAttemptId);
    routeDatabase.close();
    assert.throws(
      () => runtime.returning.advanceAtBoundary({ worldId: WORLD_ID, worldTime: 8, elapsedMs: 0 }),
      (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED",
    );
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "RETURNING");
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionHomeReached").length, 0);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("restart re-derives the return route and crosses once at the durable due boundary", async () => {
  const { runtime, directory } = await openRuntime();
  const dbPath = join(directory, "world.sqlite");
  const dispatched = await dispatch(runtime);
  const database = new DatabaseSync(runtime.store.databasePath);
  database.prepare("UPDATE resource_node SET quantity = 1 WHERE world_id = ? AND resource_node_id = ?").run(WORLD_ID, "node-wood-a");
  database.close();
  try {
    await runtime.worker.advance(8000);
  } finally {
    await runtime.worker.stop();
  }
  const resumed = await openRuntime(dbPath);
  try {
    await resumed.runtime.worker.advance(4000);
    assert.equal(resumed.runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "DEPOSITING");
    assert.equal(resumed.runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionHomeReached").length, 1);
    await resumed.runtime.worker.advance(4000);
    assert.equal(resumed.runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionHomeReached").length, 1);
  } finally {
    await closeRuntime(resumed.runtime, resumed.directory);
    rmSync(directory, { recursive: true, force: true });
  }
});
