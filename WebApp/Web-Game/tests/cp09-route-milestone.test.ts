import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { createPersistenceStore, PersistenceError } from "../src/server/persistence/store";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import { MissionTravelService, deriveRoutePosition } from "../src/server/mission-travel-service";
import { WorldClock } from "../src/server/world-clock";
import { WorldWorkerModule } from "../src/server/world-worker";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp09-route-world";

interface Runtime {
  store: ReturnType<typeof createPersistenceStore>;
  worker: WorldWorkerModule;
  clock: WorldClock;
  travel: MissionTravelService;
}

async function openRuntime(dbPath?: string): Promise<{ runtime: Runtime; directory: string }> {
  const directory = dbPath ? undefined : mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp09-route-"));
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
  const clock = new WorldClock({
    worldId: WORLD_ID,
    persistence: store,
    phaseHandlers: { movement: (context) => travel.advanceAtBoundary(context) },
  });
  const worker = new WorldWorkerModule({ store, clock });
  await worker.start();
  return { runtime: { store, worker, clock, travel }, directory: directory as string };
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
    commandId: "command-route-dispatch-wood-a-01",
    idempotencyKey: "route-dispatch-wood-a-01",
  });
}

test("route transit uses a deterministic midpoint and an armed arrival due marker", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatch(runtime);
    const attempt = runtime.store.getMissionAttempt(WORLD_ID, dispatched.missionAttemptId);
    assert.equal(attempt?.nextDueWorldTime, 5);
    assert.equal(attempt?.phase, "TRAVELLING");

    const first = deriveRoutePosition(attempt?.route as NonNullable<typeof attempt.route>, attempt?.startWorldTime as number, 4);
    const second = deriveRoutePosition(attempt?.route as NonNullable<typeof attempt.route>, attempt?.startWorldTime as number, 4);
    assert.deepEqual(first, second);
    assert.deepEqual(first, { x: 28, y: 64, waypointIndex: 12, progressTiles: 12, arrived: false });
    assert.throws(
      () => deriveRoutePosition(attempt?.route as NonNullable<typeof attempt.route>, attempt?.startWorldTime as number, -1),
      (error: unknown) => error instanceof PersistenceError && error.code === "WORLD_TIME_REGRESSION",
    );
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("movement boundary commits one arrival and leaves extraction untouched", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatch(runtime);
    await runtime.worker.advance(4000);
    assert.equal(runtime.store.getWorld(WORLD_ID)?.worldTime, 4);
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "TRAVELLING");
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionWorking").length, 0);

    await runtime.worker.advance(1000);
    const mission = runtime.store.getMission(WORLD_ID, dispatched.missionId);
    const attempt = runtime.store.getMissionAttempt(WORLD_ID, dispatched.missionAttemptId);
    assert.equal(mission?.phase, "WORKING");
    assert.equal(mission?.revision, 1);
    assert.equal(mission?.nextDueWorldTime, 7);
    assert.equal(attempt?.phase, "WORKING");
    assert.equal(attempt?.revision, 1);
    assert.equal(attempt?.lastTransitionWorldTime, 5);
    assert.equal(attempt?.nextDueWorldTime, 7);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionWorking").length, 1);
    assert.equal(runtime.store.listResourceNodes(WORLD_ID).find((node) => node.resourceNodeId === "node-wood-a")?.quantity, 20);
    assert.equal(runtime.store.listSoldiers(WORLD_ID).find((soldier) => soldier.soldierId === "soldier-a-01")?.state, "FIELD");
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("a second due-boundary pass is a no-op with no duplicate event", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatch(runtime);
    await runtime.worker.advance(5000);
    const first = runtime.store.getMission(WORLD_ID, dispatched.missionId);
    const firstEventCount = runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionWorking").length;
    const replay = runtime.travel.advanceAtBoundary({ worldId: WORLD_ID, worldTime: 5, elapsedMs: 0 });
    assert.deepEqual(replay, []);
    assert.equal(first?.revision, runtime.store.getMission(WORLD_ID, dispatched.missionId)?.revision);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionWorking").length, firstEventCount);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("a route worker cannot skip an unprocessed world boundary", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatch(runtime);
    assert.throws(
      () => runtime.travel.advanceAtBoundary({ worldId: WORLD_ID, worldTime: 5, elapsedMs: 0 }),
      (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED",
    );
    assert.equal(runtime.store.getWorld(WORLD_ID)?.worldTime, 0);
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "TRAVELLING");
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionWorking").length, 0);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("restart recovery reaches the same arrival boundary without replaying it", async () => {
  const { runtime, directory } = await openRuntime();
  const dbPath = join(directory, "world.sqlite");
  let missionAttemptId: string;
  let missionId: string;
  try {
    const dispatched = await dispatch(runtime);
    missionAttemptId = dispatched.missionAttemptId;
    missionId = dispatched.missionId;
    await runtime.worker.advance(3000);
  } finally {
    await runtime.worker.stop();
  }

  const resumed = await openRuntime(dbPath);
  try {
    assert.equal(resumed.runtime.store.getWorld(WORLD_ID)?.worldTime, 3);
    resumed.runtime.clock.recoverTo(5);
    assert.equal(resumed.runtime.store.getMission(WORLD_ID, missionId!)?.phase, "WORKING");
    assert.equal(resumed.runtime.store.getMissionAttempt(WORLD_ID, missionAttemptId!)?.lastTransitionWorldTime, 5);
    assert.equal(resumed.runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionWorking").length, 1);
    resumed.runtime.clock.recoverTo(5);
    assert.equal(resumed.runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionWorking").length, 1);
  } finally {
    await closeRuntime(resumed.runtime, resumed.directory);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("two route workers cannot create two arrival events", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await dispatch(runtime);
    runtime.clock.recoverTo(4);
    const first = new MissionTravelService({ store: runtime.store }).advanceAtBoundary({ worldId: WORLD_ID, worldTime: 5, elapsedMs: 0 });
    const second = new MissionTravelService({ store: runtime.store }).advanceAtBoundary({ worldId: WORLD_ID, worldTime: 5, elapsedMs: 0 });
    assert.equal(first.length, 1);
    assert.equal(second.length, 0);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionWorking").length, 1);
  } finally {
    await closeRuntime(runtime, directory);
  }
});
