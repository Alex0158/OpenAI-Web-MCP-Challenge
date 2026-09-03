import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { planOpenGridRouteAvoiding } from "../src/server/mission-service";
import { createPersistenceStore } from "../src/server/persistence/store";
import type { GridCoordinate } from "../src/server/persistence/types";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import { MissionExtractionService } from "../src/server/mission-extraction-service";
import { MissionDepositService } from "../src/server/mission-deposit-service";
import { MissionReturnService } from "../src/server/mission-return-service";
import { MissionTravelService } from "../src/server/mission-travel-service";
import { MonsterCombatService } from "../src/server/monster-combat-service";
import { WorldClock } from "../src/server/world-clock";
import { WorldWorkerModule } from "../src/server/world-worker";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp11-reissue-world";

interface Runtime {
  store: ReturnType<typeof createPersistenceStore>;
  worker: WorldWorkerModule;
  combat: MonsterCombatService;
}

async function openRuntime(dbPath?: string): Promise<{ runtime: Runtime; directory: string }> {
  const directory = dbPath ? "" : mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp11-reissue-"));
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
  const travel = new MissionTravelService({ store });
  const returning = new MissionReturnService({ store });
  const deposit = new MissionDepositService({ store });
  const extraction = new MissionExtractionService({ store });
  const combat = new MonsterCombatService({ store });
  const clock = new WorldClock({
    worldId: WORLD_ID,
    persistence: store,
    phaseHandlers: {
      movement: (context) => {
        travel.advanceAtBoundary(context);
        returning.advanceAtBoundary(context);
      },
      deposit: (context) => deposit.advanceAtBoundary(context),
      contact: (context) => combat.advanceContactAtBoundary(context),
      extraction: (context) => extraction.advanceAtBoundary(context),
      combat: (context) => combat.advanceCombatAtBoundary(context),
    },
  });
  const worker = new WorldWorkerModule({ store, clock });
  await worker.start();
  return { runtime: { store, worker, combat }, directory };
}

async function closeRuntime(runtime: Runtime, directory: string): Promise<void> {
  await runtime.worker.stop();
  if (directory) {
    rmSync(directory, { recursive: true, force: true });
  }
}

async function dispatchGatherer(runtime: Runtime, options: {
  soldierId?: string;
  targetId?: "node-rock-a" | "node-wood-a";
  tool?: "PICKAXE" | "AXE";
  expectedSoldierRevision?: number;
  idempotencyKey?: string;
} = {}): Promise<{ missionId: string; missionAttemptId: string }> {
  if (!runtime.worker.gateway) {
    throw new Error("worker gateway unavailable");
  }
  const idempotencyKey = options.idempotencyKey ?? `cp11-reissue-dispatch-${options.soldierId ?? "a-01"}`;
  return runtime.worker.gateway.assignSoldierMission({
    worldId: WORLD_ID,
    playerId: "player-a",
    binding: "binding-a",
    soldierId: options.soldierId ?? "soldier-a-01",
    role: "GATHERER",
    tool: options.tool ?? "PICKAXE",
    equipmentTier: 1,
    targetId: options.targetId ?? "node-rock-a",
    expectedSoldierRevision: options.expectedSoldierRevision ?? 0,
    commandId: `command-${idempotencyKey}`,
    idempotencyKey,
  });
}

test("safe reissue route detours around the danger cell and its eight neighbours", () => {
  const dangerCell = { x: 2, y: 0 };
  const route = planOpenGridRouteAvoiding(
    { x: 0, y: 0 },
    { x: 5, y: 0 },
    "test-walkability",
    { width: 8, height: 8, blockedCells: [], dangerCell },
  );
  assert.ok(route);
  assert.deepEqual(route.source, { x: 0, y: 0 });
  assert.deepEqual(route.target, { x: 5, y: 0 });
  assert.equal(route.waypoints.at(-1)?.x, 5);
  assert.equal(route.waypoints.at(-1)?.y, 0);
  assert.ok(route.waypoints.length > 6);
  assert.ok(route.waypoints.every((cell) => Math.max(Math.abs(cell.x - dangerCell.x), Math.abs(cell.y - dangerCell.y)) > 1));
  for (let index = 1; index < route.waypoints.length; index += 1) {
    const previous: GridCoordinate = route.waypoints[index - 1]!;
    const current: GridCoordinate = route.waypoints[index]!;
    assert.equal(Math.abs(current.x - previous.x) + Math.abs(current.y - previous.y), 1);
  }
});

test("the fixed Rock loss records the target conflict as a typed no-route review stop", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatchGatherer(runtime);
    await runtime.worker.advance(24000);

    const mission = runtime.store.getMission(WORLD_ID, dispatched.missionId);
    const attempt = runtime.store.getMissionAttempt(WORLD_ID, dispatched.missionAttemptId);
    const soldier = runtime.store.listSoldiers(WORLD_ID).find((candidate) => candidate.soldierId === "soldier-a-01");
    assert.equal(mission?.phase, "WAITING_REVIEW");
    assert.equal(mission?.monsterReissueBudget, 0);
    assert.deepEqual(mission?.dangerCell, { x: 34, y: 64 });
    assert.equal(mission?.waitingReviewReason, "NO_SAFE_REISSUE_ROUTE");
    assert.equal(mission?.activeAttemptId, null);
    assert.equal(attempt?.terminalCause, "GATHERER_LOST");
    assert.equal(soldier?.state, "AT_SHELTER");
    assert.equal(runtime.store.listMissionAttempts(WORLD_ID).length, 1);
    assert.deepEqual(runtime.store.events(WORLD_ID).slice(-6).map((event) => event.eventType), [
      "BattleRoundResolved",
      "EncounterResolved",
      "CargoLostToMonster",
      "SoldierDied",
      "SoldierRespawned",
      "MissionReissued",
    ]);
    const reissueEvent = runtime.store.events(WORLD_ID).at(-1);
    assert.deepEqual(reissueEvent?.typedPayload, {
      missionId: dispatched.missionId,
      missionAttemptId: dispatched.missionAttemptId,
      soldierId: "soldier-a-01",
      role: "GATHERER",
      tool: "PICKAXE",
      targetId: "node-rock-a",
      previousAttemptId: dispatched.missionAttemptId,
      newAttemptId: null,
      budgetBefore: 1,
      budgetAfter: 0,
      dangerCell: { x: 34, y: 64 },
      route: null,
      outcome: "WAITING_REVIEW",
      reason: "NO_SAFE_REISSUE_ROUTE",
      worldTime: 24,
    });
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("a reachable first loss reissues once, then the second loss stops with repeated-death review", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatchGatherer(runtime, { idempotencyKey: "cp11-reissue-positive-a-01" });
    await runtime.worker.advance(15000);
    const encounter = runtime.store.listEncounters(WORLD_ID)[0];
    assert.ok(encounter);
    // The fixed fixture's patrol lane still drives contact, while this test
    // supplies a distinct danger cell to exercise the positive detour branch.
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("UPDATE encounter SET engagement_x = 50, engagement_y = 64 WHERE world_id = ? AND encounter_id = ?").run(WORLD_ID, encounter.encounterId);
    database.close();

    await runtime.worker.advance(9000);
    const firstMission = runtime.store.getMission(WORLD_ID, dispatched.missionId);
    const activeAttemptId = firstMission?.activeAttemptId;
    assert.ok(activeAttemptId);
    assert.notEqual(activeAttemptId, dispatched.missionAttemptId);
    assert.equal(firstMission?.phase, "TRAVELLING");
    assert.equal(firstMission?.monsterReissueBudget, 0);
    assert.deepEqual(firstMission?.dangerCell, { x: 50, y: 64 });
    assert.equal(firstMission?.waitingReviewReason, null);
    const reissuedAttempt = runtime.store.getMissionAttempt(WORLD_ID, activeAttemptId);
    assert.equal(reissuedAttempt?.phase, "TRAVELLING");
    assert.equal(reissuedAttempt?.role, "GATHERER");
    assert.equal(reissuedAttempt?.tool, "PICKAXE");
    assert.equal(reissuedAttempt?.targetId, "node-rock-a");
    assert.deepEqual(reissuedAttempt?.homeAnchor, { x: 16, y: 64 });
    assert.equal(reissuedAttempt?.route?.walkabilityVersion, runtime.store.getWorld(WORLD_ID)?.mapFingerprint);
    assert.ok((reissuedAttempt?.route?.waypoints.length ?? 0) > 1);
    assert.equal(runtime.store.listMissionAttempts(WORLD_ID).length, 2);
    const firstReissueEvent = runtime.store.events(WORLD_ID).find((event) => event.eventType === "MissionReissued");
    assert.equal((firstReissueEvent?.typedPayload as { outcome?: string } | undefined)?.outcome, "REISSUED");

    // Arrival at t=30, extraction starts at t=32, and the monster meets the
    // reissued target again at t=36. The consumed budget prevents a third run.
    await runtime.worker.advance(22000);
    const stoppedMission = runtime.store.getMission(WORLD_ID, dispatched.missionId);
    assert.equal(stoppedMission?.phase, "WAITING_REVIEW");
    assert.equal(stoppedMission?.waitingReviewReason, "REPEATED_MONSTER_DEATH");
    assert.equal(stoppedMission?.monsterReissueBudget, 0);
    assert.equal(stoppedMission?.activeAttemptId, null);
    assert.equal(runtime.store.listMissionAttempts(WORLD_ID).length, 2);
    assert.equal(runtime.store.listSoldiers(WORLD_ID).find((soldier) => soldier.soldierId === "soldier-a-01")?.state, "AT_SHELTER");
    const reissueEvents = runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionReissued");
    assert.equal(reissueEvents.length, 2);
    assert.deepEqual((reissueEvents.at(-1)?.typedPayload as { outcome?: string; reason?: string; newAttemptId?: string | null } | undefined), {
      missionId: dispatched.missionId,
      missionAttemptId: activeAttemptId,
      soldierId: "soldier-a-01",
      role: "GATHERER",
      tool: "PICKAXE",
      targetId: "node-rock-a",
      previousAttemptId: activeAttemptId,
      newAttemptId: null,
      budgetBefore: 0,
      budgetAfter: 0,
      dangerCell: { x: 34, y: 64 },
      route: null,
      outcome: "WAITING_REVIEW",
      reason: "REPEATED_MONSTER_DEATH",
      worldTime: 46,
    });
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("manual dispatch from review resets the next reissue budget and metadata", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatchGatherer(runtime);
    await runtime.worker.advance(24000);
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "WAITING_REVIEW");
    const next = await dispatchGatherer(runtime, {
      expectedSoldierRevision: 2,
      idempotencyKey: "cp11-reissue-manual-reset-a-01",
    });
    assert.equal(next.missionId, dispatched.missionId);
    const mission = runtime.store.getMission(WORLD_ID, dispatched.missionId);
    assert.equal(mission?.phase, "TRAVELLING");
    assert.equal(mission?.monsterReissueBudget, 1);
    assert.equal(mission?.dangerCell, null);
    assert.equal(mission?.waitingReviewReason, null);
    assert.equal(runtime.store.listMissionAttempts(WORLD_ID).length, 2);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("schema-v5 mission rows migrate to typed reissue fields and survive restart", async () => {
  const first = await openRuntime();
  const dbPath = first.runtime.store.databasePath;
  const directory = first.directory;
  try {
    const dispatched = await dispatchGatherer(first.runtime);
    await first.runtime.worker.advance(1000);
    await closeRuntime(first.runtime, "");
    const database = new DatabaseSync(dbPath);
    database.exec("ALTER TABLE mission DROP COLUMN monster_reissue_budget");
    database.exec("ALTER TABLE mission DROP COLUMN danger_cell_json");
    database.exec("ALTER TABLE mission DROP COLUMN waiting_review_reason");
    database.exec("ALTER TABLE mission_attempt DROP COLUMN terminal_cause");
    database.prepare("UPDATE schema_meta SET schema_version = 5, migration_id = 'cp11-001' WHERE schema_meta_id = 'singleton'").run();
    database.close();

    const resumed = await openRuntime(dbPath);
    try {
      const mission = resumed.runtime.store.getMission(WORLD_ID, dispatched.missionId);
      const attempt = resumed.runtime.store.getMissionAttempt(WORLD_ID, dispatched.missionAttemptId);
      assert.equal(resumed.runtime.store.metadata().schemaVersion, 8);
      assert.equal(resumed.runtime.store.metadata().migrationId, "cp06-004");
      assert.equal(mission?.monsterReissueBudget, 1);
      assert.equal(mission?.dangerCell, null);
      assert.equal(mission?.waitingReviewReason, null);
      assert.equal(attempt?.terminalCause, null);
    } finally {
      await closeRuntime(resumed.runtime, "");
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("reissue failure rolls back cargo, death, budget, events, and world time as one boundary", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatchGatherer(runtime);
    await runtime.worker.advance(23000);
    const beforeEncounter = runtime.store.listEncounters(WORLD_ID)[0];
    const beforeEvents = runtime.store.events(WORLD_ID).length;
    const beforeCargo = runtime.store.listCargo(WORLD_ID);
    assert.ok(beforeEncounter);
    assert.throws(
      () => runtime.combat.advanceCombatAtBoundary({ worldId: WORLD_ID, worldTime: 24 }, { injectFailureAt: "after_state" }),
      (error: unknown) => error instanceof Error && "code" in error && (error as { code?: unknown }).code === "INJECTED_FAILURE",
    );
    assert.equal(runtime.store.getWorld(WORLD_ID)?.worldTime, 23);
    assert.deepEqual(runtime.store.listEncounters(WORLD_ID)[0], beforeEncounter);
    assert.deepEqual(runtime.store.listCargo(WORLD_ID), beforeCargo);
    assert.equal(runtime.store.events(WORLD_ID).length, beforeEvents);
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.monsterReissueBudget, 1);

    const [retry] = runtime.combat.advanceCombatAtBoundary({ worldId: WORLD_ID, worldTime: 24 });
    assert.equal(retry?.reissue?.outcome, "WAITING_REVIEW");
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "WAITING_REVIEW");
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("a successful reissue can complete a real deposit and reset its next-chain budget", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatchGatherer(runtime, { idempotencyKey: "cp11-reissue-deposit-a-01" });
    await runtime.worker.advance(15000);
    const encounter = runtime.store.listEncounters(WORLD_ID)[0];
    assert.ok(encounter);
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("UPDATE encounter SET engagement_x = 50, engagement_y = 64 WHERE world_id = ? AND encounter_id = ?").run(WORLD_ID, encounter.encounterId);
    database.close();
    await runtime.worker.advance(9000);
    const activeAttemptId = runtime.store.getMission(WORLD_ID, dispatched.missionId)?.activeAttemptId;
    assert.ok(activeAttemptId);
    const disableMonster = new DatabaseSync(runtime.store.databasePath);
    disableMonster.prepare("UPDATE monster SET state = 'DEAD' WHERE world_id = ? AND monster_id = ?").run(WORLD_ID, "monster-seeded-01");
    disableMonster.close();
    await runtime.worker.advance(22000);
    const mission = runtime.store.getMission(WORLD_ID, dispatched.missionId);
    assert.equal(mission?.phase, "AT_SHELTER");
    assert.equal(mission?.monsterReissueBudget, 1);
    assert.equal(mission?.dangerCell, null);
    assert.equal(mission?.waitingReviewReason, null);
    assert.equal(runtime.store.getMissionAttempt(WORLD_ID, activeAttemptId)?.phase, "TERMINAL");
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CargoDeposited").length, 1);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("a target inside the danger exclusion is a typed no-route result", () => {
  assert.equal(
    planOpenGridRouteAvoiding(
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      "test-walkability",
      { width: 4, height: 4, blockedCells: [], dangerCell: { x: 2, y: 0 } },
    ),
    null,
  );
});
