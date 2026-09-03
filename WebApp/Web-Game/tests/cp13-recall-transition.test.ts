import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { PersistenceError, createPersistenceStore } from "../src/server/persistence/store";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import { MissionReturnService } from "../src/server/mission-return-service";
import { deriveRoutePosition } from "../src/server/mission-travel-service";
import { reverseMissionRoute } from "../src/server/mission-return-service";
import { WorldWorkerModule } from "../src/server/world-worker";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp13-recall-world";

interface Runtime {
  store: ReturnType<typeof createPersistenceStore>;
  worker: WorldWorkerModule;
}

type RecallInput = {
  worldId: string;
  playerId: string;
  binding: string;
  commandId: string;
  soldierId: string;
  missionId: string;
  missionAttemptId: string;
  expectedSoldierRevision: number;
  expectedMissionRevision: number;
  expectedMissionAttemptRevision: number;
  idempotencyKey: string;
};

async function openRuntime(dbPath?: string): Promise<{ runtime: Runtime; directory: string }> {
  const directory = dbPath ? "" : mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp13-recall-"));
  const path = dbPath ?? join(directory, "world.sqlite");
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
  const worker = new WorldWorkerModule({ store });
  await worker.start();
  return { runtime: { store, worker }, directory };
}

async function closeRuntime(runtime: Runtime, directory: string): Promise<void> {
  await runtime.worker.stop();
  if (directory) {
    rmSync(directory, { recursive: true, force: true });
  }
}

async function dispatchGatherer(runtime: Runtime, idempotencyKey = "cp13-dispatch-gatherer"): Promise<{ missionId: string; missionAttemptId: string }> {
  const result = await runtime.worker.gateway!.assignSoldierMission({
    worldId: WORLD_ID,
    playerId: "player-a",
    binding: "binding-a",
    soldierId: "soldier-a-01",
    role: "GATHERER",
    tool: "AXE",
    equipmentTier: 1,
    targetId: "node-wood-a",
    expectedSoldierRevision: 0,
    commandId: `command-${idempotencyKey}`,
    idempotencyKey,
  });
  return { missionId: result.missionId, missionAttemptId: result.missionAttemptId };
}

async function dispatchHunter(runtime: Runtime, idempotencyKey = "cp13-dispatch-hunter"): Promise<{ missionId: string; missionAttemptId: string }> {
  const result = await runtime.worker.gateway!.assignSoldierMission({
    worldId: WORLD_ID,
    playerId: "player-a",
    binding: "binding-a",
    soldierId: "soldier-a-01",
    role: "HUNTER",
    tool: "SWORD",
    equipmentTier: 1,
    targetId: "monster-seeded-01",
    expectedSoldierRevision: 0,
    returnPolicy: "ON_RECALL",
    commandId: `command-${idempotencyKey}`,
    idempotencyKey,
  });
  return { missionId: result.missionId, missionAttemptId: result.missionAttemptId };
}

function recallInput(runtime: Runtime, ids: { missionId: string; missionAttemptId: string }, overrides: Partial<RecallInput> = {}): RecallInput {
  const soldier = runtime.store.listSoldiers(WORLD_ID).find((item) => item.soldierId === "soldier-a-01");
  const mission = runtime.store.getMission(WORLD_ID, ids.missionId);
  const attempt = runtime.store.getMissionAttempt(WORLD_ID, ids.missionAttemptId);
  if (!soldier || !mission || !attempt) {
    throw new Error("recall fixture is not ready");
  }
  const idempotencyKey = overrides.idempotencyKey ?? "cp13-recall-01";
  return {
    worldId: WORLD_ID,
    playerId: "player-a",
    binding: "binding-a",
    commandId: `command-${idempotencyKey}`,
    soldierId: soldier.soldierId,
    missionId: mission.missionId,
    missionAttemptId: attempt.missionAttemptId,
    expectedSoldierRevision: soldier.revision,
    expectedMissionRevision: mission.revision,
    expectedMissionAttemptRevision: attempt.revision,
    idempotencyKey,
    ...overrides,
  };
}

async function forceRecall(runtime: Runtime, input: RecallInput): Promise<any> {
  const gateway = runtime.worker.gateway as unknown as {
    forceRecallSoldier(value: RecallInput): Promise<unknown>;
  };
  return gateway.forceRecallSoldier(input);
}

test("recall queues ordinary return from travel and derives a reverse route from the current position", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const ids = await dispatchGatherer(runtime);
    const outbound = runtime.store.getMissionAttempt(WORLD_ID, ids.missionAttemptId)?.route;
    await runtime.worker.advance(2000);
    const input = recallInput(runtime, ids);
    const result = await forceRecall(runtime, input);

    assert.equal(result.effect, "mission_recalled");
    assert.equal(result.phase, "RETURNING");
    assert.equal(result.previousPhase, "TRAVELLING");
    assert.equal(runtime.store.getMission(WORLD_ID, ids.missionId)?.phase, "RETURNING");
    assert.equal(runtime.store.getMissionAttempt(WORLD_ID, ids.missionAttemptId)?.phase, "RETURNING");
    assert.equal(runtime.store.getMissionAttempt(WORLD_ID, ids.missionAttemptId)?.nextDueWorldTime, null);
    assert.deepEqual(runtime.store.getMissionAttempt(WORLD_ID, ids.missionAttemptId)?.route, outbound);

    const returning = new MissionReturnService({ store: runtime.store });
    const position = returning.positionAt({ worldId: WORLD_ID, missionAttemptId: ids.missionAttemptId, worldTime: 2 });
    assert.equal(position.arrived, false);
    assert.deepEqual({ x: position.x, y: position.y }, { x: 22, y: 64 });
    assert.deepEqual(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionRecalled").map((event) => event.typedPayload), [{
      missionId: ids.missionId,
      missionAttemptId: ids.missionAttemptId,
      soldierId: "soldier-a-01",
      previousPhase: "TRAVELLING",
      phase: "RETURNING",
      recallPosition: { x: 22, y: 64, waypointIndex: 6, progressTiles: 6, arrived: false },
      homeAnchor: { x: 16, y: 64 },
      returnTravelWorldSeconds: 2,
      returnPolicy: "WHEN_FULL",
      worldTime: 2,
    }]);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("recall from work preserves role, tool, and exposed cargo", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const ids = await dispatchGatherer(runtime, "cp13-dispatch-work");
    await runtime.worker.advance(7000);
    const beforeCargo = runtime.store.listCargo(WORLD_ID);
    assert.equal(runtime.store.getMission(WORLD_ID, ids.missionId)?.phase, "WORKING");
    assert.equal(beforeCargo.length, 1);
    const result = await forceRecall(runtime, recallInput(runtime, ids, { idempotencyKey: "cp13-recall-work" }));
    assert.equal(result.previousPhase, "WORKING");
    assert.equal(runtime.store.getMission(WORLD_ID, ids.missionId)?.phase, "RETURNING");
    assert.equal(runtime.store.getMissionAttempt(WORLD_ID, ids.missionAttemptId)?.role, "GATHERER");
    assert.equal(runtime.store.getMissionAttempt(WORLD_ID, ids.missionAttemptId)?.tool, "AXE");
    assert.deepEqual(runtime.store.listCargo(WORLD_ID), beforeCargo);
    assert.equal(runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, 0);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("recalled work cargo remains exposed until the ordinary home and deposit phases", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const ids = await dispatchGatherer(runtime, "cp13-dispatch-cargo-return");
    await runtime.worker.advance(7000);
    const before = runtime.store.listCargo(WORLD_ID);
    assert.equal(before.length, 1);
    const recalled = await forceRecall(runtime, recallInput(runtime, ids, { idempotencyKey: "cp13-recall-cargo-return" }));
    assert.equal(recalled.previousPhase, "WORKING");
    assert.deepEqual(runtime.store.listCargo(WORLD_ID), before);
    await runtime.worker.advance(5000);
    assert.equal(runtime.store.getMission(WORLD_ID, ids.missionId)?.phase, "AT_SHELTER");
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 0);
    assert.equal(runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, 1);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionRecalled").length, 1);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CargoDeposited").length, 1);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("hunter recall uses the same transition without extraction", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const ids = await dispatchHunter(runtime);
    await runtime.worker.advance(2000);
    const result = await forceRecall(runtime, recallInput(runtime, ids, { idempotencyKey: "cp13-recall-hunter" }));
    assert.equal(result.effect, "mission_recalled");
    assert.equal(result.previousPhase, "TRAVELLING");
    assert.equal(runtime.store.getMission(WORLD_ID, ids.missionId)?.role, "HUNTER");
    assert.deepEqual(runtime.store.listCargo(WORLD_ID), []);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("recall during a resolving encounter is a typed no-op", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const ids = await dispatchHunter(runtime, "cp13-dispatch-combat");
    await runtime.worker.advance(25000);
    const beforeMission = runtime.store.getMission(WORLD_ID, ids.missionId);
    const beforeAttempt = runtime.store.getMissionAttempt(WORLD_ID, ids.missionAttemptId);
    const beforeEvents = runtime.store.events(WORLD_ID).length;
    await assert.rejects(
      forceRecall(runtime, recallInput(runtime, ids, { idempotencyKey: "cp13-recall-combat" })),
      (error: unknown) => error instanceof PersistenceError && error.code === "IN_COMBAT",
    );
    assert.deepEqual(runtime.store.getMission(WORLD_ID, ids.missionId), beforeMission);
    assert.deepEqual(runtime.store.getMissionAttempt(WORLD_ID, ids.missionAttemptId), beforeAttempt);
    assert.equal(runtime.store.events(WORLD_ID).length, beforeEvents);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("recall retry is idempotent and stale or foreign requests do not mutate state", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const ids = await dispatchGatherer(runtime, "cp13-dispatch-retry");
    await runtime.worker.advance(2000);
    const input = recallInput(runtime, ids, { idempotencyKey: "cp13-recall-retry" });
    const first = await forceRecall(runtime, input);
    const duplicate = await forceRecall(runtime, input);
    assert.equal(first.eventId, duplicate.eventId);
    assert.equal(duplicate.duplicate, true);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionRecalled").length, 1);

    const stale = await openRuntime();
    try {
      const staleIds = await dispatchGatherer(stale.runtime, "cp13-dispatch-stale");
      await stale.runtime.worker.advance(2000);
      const staleInput = recallInput(stale.runtime, staleIds, {
        expectedSoldierRevision: 0,
        idempotencyKey: "cp13-recall-stale",
      });
      await assert.rejects(forceRecall(stale.runtime, staleInput), (error: unknown) => error instanceof PersistenceError && error.code === "STALE_REVISION");
      assert.equal(stale.runtime.store.events(WORLD_ID).some((event) => event.eventType === "MissionRecalled"), false);
      assert.equal(stale.runtime.store.idempotency(WORLD_ID, "cp13-recall-stale")?.outcome, "rejected");

      await assert.rejects(
        forceRecall(stale.runtime, { ...recallInput(stale.runtime, staleIds, { idempotencyKey: "cp13-recall-owner" }), binding: "binding-b", playerId: "player-b" }),
        (error: unknown) => error instanceof PersistenceError && error.code === "OWNERSHIP_DENIED",
      );
    } finally {
      await closeRuntime(stale.runtime, stale.directory);
    }
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("recall from a resident mission is a typed no-op", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const ids = await dispatchGatherer(runtime, "cp13-dispatch-resident");
    await runtime.worker.advance(2000);
    await forceRecall(runtime, recallInput(runtime, ids, { idempotencyKey: "cp13-recall-resident-return" }));
    await runtime.worker.advance(2000);
    assert.equal(runtime.store.getMission(WORLD_ID, ids.missionId)?.phase, "AT_SHELTER");
    const beforeEvents = runtime.store.events(WORLD_ID).length;
    await assert.rejects(
      forceRecall(runtime, recallInput(runtime, ids, { idempotencyKey: "cp13-recall-resident" })),
      (error: unknown) => error instanceof PersistenceError && error.code === "ALREADY_AT_SHELTER",
    );
    assert.equal(runtime.store.events(WORLD_ID).length, beforeEvents);
    assert.equal(runtime.store.idempotency(WORLD_ID, "cp13-recall-resident")?.outcome, "rejected");
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("a failed recall transaction rolls back the phase, event cursor, and retry identity", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const ids = await dispatchGatherer(runtime, "cp13-dispatch-failure");
    await runtime.worker.advance(2000);
    const soldier = runtime.store.listSoldiers(WORLD_ID).find((item) => item.soldierId === "soldier-a-01");
    const mission = runtime.store.getMission(WORLD_ID, ids.missionId);
    const attempt = runtime.store.getMissionAttempt(WORLD_ID, ids.missionAttemptId);
    const world = runtime.store.getWorld(WORLD_ID);
    if (!soldier || !mission || !attempt || !world || !attempt.route || !attempt.homeAnchor || !mission.role || !mission.tool || !mission.returnPolicy) {
      throw new Error("recall failure fixture is not ready");
    }
    const input = recallInput(runtime, ids, { idempotencyKey: "cp13-recall-failure" });
    const recallPosition = deriveRoutePosition(attempt.route, attempt.startWorldTime, world.worldTime);
    const returnRoute = reverseMissionRoute({ ...attempt, lastTransitionWorldTime: world.worldTime });
    const role = mission.role;
    const tool = mission.tool;
    const returnPolicy = mission.returnPolicy;
    const homeAnchor = attempt.homeAnchor;
    if (role !== "GATHERER" && role !== "HUNTER") {
      throw new Error("recall failure role is not active");
    }
    const request = {
      kind: "force_recall_soldier",
      playerId: input.playerId,
      commandId: input.commandId,
      soldierId: input.soldierId,
      missionId: input.missionId,
      missionAttemptId: input.missionAttemptId,
      expectedSoldierRevision: input.expectedSoldierRevision,
      expectedMissionRevision: input.expectedMissionRevision,
      expectedMissionAttemptRevision: input.expectedMissionAttemptRevision,
    };
    const typedPayload = {
      missionId: mission.missionId,
      missionAttemptId: attempt.missionAttemptId,
      soldierId: soldier.soldierId,
      previousPhase: mission.phase,
      phase: "RETURNING" as const,
      recallPosition,
      homeAnchor: attempt.homeAnchor,
      returnTravelWorldSeconds: returnRoute.estimatedTravelWorldSeconds,
      returnPolicy: mission.returnPolicy,
      worldTime: world.worldTime,
    };
    assert.throws(
      () => runtime.store.commitMissionRecall({
        worldId: WORLD_ID,
        worldTime: world.worldTime,
        commandId: input.commandId,
        idempotency: { key: input.idempotencyKey, binding: input.binding, request },
        soldierId: soldier.soldierId,
        expectedSoldierRevision: input.expectedSoldierRevision,
        missionId: mission.missionId,
        expectedMissionRevision: input.expectedMissionRevision,
        missionAttemptId: attempt.missionAttemptId,
        expectedMissionAttemptRevision: input.expectedMissionAttemptRevision,
        role,
        tool,
        previousPhase: mission.phase as "TRAVELLING" | "WORKING",
        recallPosition,
        homeAnchor,
        returnTravelWorldSeconds: returnRoute.estimatedTravelWorldSeconds,
        returnPolicy,
        event: {
          eventId: "mission-recalled-injected-failure",
          eventType: "MissionRecalled",
          causationId: input.commandId,
          idempotencyKey: input.idempotencyKey,
          aggregateType: "mission",
          aggregateId: mission.missionId,
          visibilityScope: { kind: "shelter", shelterId: soldier.shelterId },
          typedPayload,
        },
        injectFailureAt: "after_events",
      }),
      (error: unknown) => error instanceof PersistenceError && error.code === "INJECTED_FAILURE",
    );
    assert.equal(runtime.store.getMission(WORLD_ID, mission.missionId)?.phase, mission.phase);
    assert.equal(runtime.store.getMissionAttempt(WORLD_ID, attempt.missionAttemptId)?.phase, attempt.phase);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionRecalled").length, 0);
    assert.equal(runtime.store.idempotency(WORLD_ID, input.idempotencyKey), null);

    const retry = await forceRecall(runtime, input);
    assert.equal(retry.effect, "mission_recalled");
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionRecalled").length, 1);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("a recalled mission re-derives its return prefix after a file-backed restart", async () => {
  const { runtime, directory } = await openRuntime();
  const dbPath = join(directory, "world.sqlite");
  const ids = await dispatchGatherer(runtime, "cp13-dispatch-restart");
  await runtime.worker.advance(2000);
  const recalled = await forceRecall(runtime, recallInput(runtime, ids, { idempotencyKey: "cp13-recall-restart" }));
  assert.equal(recalled.returnTravelWorldSeconds, 2);
  await runtime.worker.stop();

  const resumed = await openRuntime(dbPath);
  try {
    const returning = new MissionReturnService({ store: resumed.runtime.store });
    assert.deepEqual(returning.positionAt({ worldId: WORLD_ID, missionAttemptId: ids.missionAttemptId, worldTime: 2 }), {
      x: 22,
      y: 64,
      waypointIndex: 0,
      progressTiles: 0,
      arrived: false,
    });
    await resumed.runtime.worker.advance(2000);
    assert.equal(resumed.runtime.store.getMission(WORLD_ID, ids.missionId)?.phase, "AT_SHELTER");
    assert.equal(resumed.runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionRecalled").length, 1);
    assert.equal(resumed.runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionHomeReached").length, 1);
  } finally {
    await closeRuntime(resumed.runtime, resumed.directory);
    rmSync(directory, { recursive: true, force: true });
  }
});
