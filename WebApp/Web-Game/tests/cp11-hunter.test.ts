import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { PersistenceError, createPersistenceStore } from "../src/server/persistence/store";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import { MissionDepositService } from "../src/server/mission-deposit-service";
import { MissionExtractionService } from "../src/server/mission-extraction-service";
import { MissionReturnService } from "../src/server/mission-return-service";
import { MissionTravelService } from "../src/server/mission-travel-service";
import { MonsterCombatService, resolveMonsterHunterRound } from "../src/server/monster-combat-service";
import type { AssignSoldierMissionInput, AssignSoldierMissionResult } from "../src/server/mission-service";
import { WorldClock } from "../src/server/world-clock";
import { WorldWorkerModule } from "../src/server/world-worker";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp11-hunter-world";

interface Runtime {
  store: ReturnType<typeof createPersistenceStore>;
  worker: WorldWorkerModule;
  combat: MonsterCombatService;
  returning: MissionReturnService;
}

async function openRuntime(dbPath?: string): Promise<{ runtime: Runtime; directory: string }> {
  const directory = dbPath ? "" : mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp11-hunter-"));
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
  return { runtime: { store, worker, combat, returning }, directory };
}

async function closeRuntime(runtime: Runtime, directory: string): Promise<void> {
  await runtime.worker.stop();
  if (directory) {
    rmSync(directory, { recursive: true, force: true });
  }
}

async function dispatchHunter(
  runtime: Runtime,
  overrides: Partial<AssignSoldierMissionInput> = {},
): Promise<AssignSoldierMissionResult> {
  if (!runtime.worker.gateway) {
    throw new Error("worker gateway unavailable");
  }
  const idempotencyKey = overrides.idempotencyKey ?? "cp11-hunter-dispatch-a-01";
  return runtime.worker.gateway.assignSoldierMission({
    worldId: WORLD_ID,
    playerId: "player-a",
    binding: "binding-a",
    soldierId: "soldier-a-01",
    role: "HUNTER",
    tool: "SWORD",
    equipmentTier: 1,
    targetId: "monster-seeded-01",
    expectedSoldierRevision: 0,
    ...overrides,
    idempotencyKey,
    commandId: overrides.commandId ?? `command-${idempotencyKey}`,
  });
}

test("hunter dispatch uses the server monster position and arrives with no extraction due marker", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const result = await dispatchHunter(runtime);
    assert.equal(result.role, "HUNTER");
    assert.equal(result.tool, "SWORD");
    assert.equal(result.equipmentTier, 1);
    assert.equal(result.targetId, "monster-seeded-01");
    assert.equal(result.returnPolicy, "ON_RECALL");
    assert.deepEqual(result.route.source, { x: 16, y: 64 });
    assert.deepEqual(result.route.target, { x: 48, y: 64 });
    assert.equal(runtime.store.getMission(WORLD_ID, result.missionId)?.nextDueWorldTime, 11);
    const dispatchEvent = runtime.store.events(WORLD_ID).find((event) => event.eventType === "MissionDispatched");
    assert.equal(dispatchEvent?.causationId, "command-cp11-hunter-dispatch-a-01");
    assert.equal(dispatchEvent?.idempotencyKey, "cp11-hunter-dispatch-a-01");

    await runtime.worker.advance(11000);
    const mission = runtime.store.getMission(WORLD_ID, result.missionId);
    const attempt = runtime.store.getMissionAttempt(WORLD_ID, result.missionAttemptId);
    assert.equal(mission?.phase, "WORKING");
    assert.equal(mission?.role, "HUNTER");
    assert.equal(mission?.tool, "SWORD");
    assert.equal(mission?.nextDueWorldTime, null);
    assert.equal(attempt?.phase, "WORKING");
    assert.equal(attempt?.nextDueWorldTime, null);
    assert.deepEqual(runtime.store.listCargo(WORLD_ID), []);
    const arrival = runtime.store.events(WORLD_ID).find((event) => event.eventType === "MissionWorking");
    assert.deepEqual(arrival?.typedPayload && {
      role: (arrival.typedPayload as { role?: string }).role,
      tool: (arrival.typedPayload as { tool?: string }).tool,
      nextExtractionDueWorldTime: (arrival.typedPayload as { nextExtractionDueWorldTime?: number | null }).nextExtractionDueWorldTime,
    }, { role: "HUNTER", tool: "SWORD", nextExtractionDueWorldTime: null });
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("hunter formula preserves initiative and suppresses the monster strike after a lethal first strike", () => {
  assert.deepEqual(resolveMonsterHunterRound({ roundNumber: 1, hunterHp: 100, monsterHp: 80 }), {
    roundNumber: 1,
    firstActor: "HUNTER",
    secondActor: "MONSTER",
    hunterDamage: 18,
    monsterDamage: 9,
    hunterHpBefore: 100,
    hunterHpAfter: 91,
    monsterHpBefore: 80,
    monsterHpAfter: 62,
    terminalCause: null,
  });
  assert.deepEqual(resolveMonsterHunterRound({ roundNumber: 5, hunterHp: 64, monsterHp: 8 }), {
    roundNumber: 5,
    firstActor: "HUNTER",
    secondActor: null,
    hunterDamage: 18,
    monsterDamage: 0,
    hunterHpBefore: 64,
    hunterHpAfter: 64,
    monsterHpBefore: 8,
    monsterHpAfter: 0,
    terminalCause: "MONSTER_DEFEATED",
  });
});

test("hunter victory deactivates the monster once and returns through the real route to zero-cargo settlement", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatchHunter(runtime);
    await runtime.worker.advance(26000);

    const encounter = runtime.store.listEncounters(WORLD_ID)[0];
    const missionAtVictory = runtime.store.getMission(WORLD_ID, dispatched.missionId);
    const attemptAtVictory = runtime.store.getMissionAttempt(WORLD_ID, dispatched.missionAttemptId);
    const soldierAtVictory = runtime.store.listSoldiers(WORLD_ID).find((item) => item.soldierId === "soldier-a-01");
    assert.equal(encounter?.state, "RESOLVED");
    assert.equal(encounter?.terminalCause, "MONSTER_DEFEATED");
    assert.equal(encounter?.roundNumber, 5);
    assert.equal(encounter?.soldierHp, 64);
    assert.equal(encounter?.monsterHp, 0);
    assert.equal(missionAtVictory?.phase, "RETURNING");
    assert.equal(missionAtVictory?.role, "HUNTER");
    assert.equal(missionAtVictory?.encounterId, null);
    assert.equal(attemptAtVictory?.phase, "RETURNING");
    assert.equal(attemptAtVictory?.encounterId, null);
    assert.equal(soldierAtVictory?.state, "FIELD");
    assert.equal(soldierAtVictory?.role, "HUNTER");
    assert.equal(soldierAtVictory?.tool, "SWORD");
    assert.equal(runtime.store.listMonsters(WORLD_ID)[0]?.state, "DEAD");
    assert.deepEqual(runtime.store.listCargo(WORLD_ID), []);
    assert.equal(runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, 0);
    assert.deepEqual(runtime.store.events(WORLD_ID).slice(-7).map((event) => event.eventType), [
      "BattleRoundResolved",
      "BattleRoundResolved",
      "BattleRoundResolved",
      "BattleRoundResolved",
      "BattleRoundResolved",
      "EncounterResolved",
      "MonsterDefeated",
    ]);
    assert.equal(runtime.store.events(WORLD_ID).some((event) => ["CargoLostToMonster", "SoldierDied", "SoldierRespawned", "CoinsCredited"].includes(event.eventType)), false);

    await runtime.worker.advance(3000);
    const returnPosition = runtime.returning.positionAt({ worldId: WORLD_ID, missionAttemptId: dispatched.missionAttemptId, worldTime: 29 });
    assert.equal(returnPosition.arrived, false);
    assert.notDeepEqual({ x: returnPosition.x, y: returnPosition.y }, { x: 16, y: 64 });

    await runtime.worker.advance(8000);
    const completedMission = runtime.store.getMission(WORLD_ID, dispatched.missionId);
    const completedAttempt = runtime.store.getMissionAttempt(WORLD_ID, dispatched.missionAttemptId);
    const resident = runtime.store.listSoldiers(WORLD_ID).find((item) => item.soldierId === "soldier-a-01");
    assert.equal(completedMission?.phase, "AT_SHELTER");
    assert.equal(completedAttempt?.phase, "TERMINAL");
    assert.deepEqual(resident, {
      worldId: WORLD_ID,
      soldierId: "soldier-a-01",
      shelterId: "shelter-a",
      state: "AT_SHELTER",
      role: null,
      tool: null,
      revision: 2,
    });
    assert.deepEqual(runtime.store.events(WORLD_ID).slice(-2).map((event) => event.eventType), ["MissionHomeReached", "CargoDeposited"]);
    const settlement = runtime.store.events(WORLD_ID).find((event) => event.eventType === "CargoDeposited");
    assert.deepEqual(settlement?.typedPayload && {
      items: (settlement.typedPayload as { items?: unknown[] }).items,
      totalQuantity: (settlement.typedPayload as { totalQuantity?: number }).totalQuantity,
      totalCapacityUsed: (settlement.typedPayload as { totalCapacityUsed?: number }).totalCapacityUsed,
      coinDelta: (settlement.typedPayload as { coinDelta?: number }).coinDelta,
      settlementReason: (settlement.typedPayload as { settlementReason?: string }).settlementReason,
    }, { items: [], totalQuantity: 0, totalCapacityUsed: 0, coinDelta: 0, settlementReason: "HUNTER_VICTORY" });
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MonsterDefeated").length, 1);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CargoDeposited").length, 1);
    assert.equal(runtime.store.events(WORLD_ID).some((event) => event.eventType === "CoinsCredited"), false);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("hunter dispatch rejects incompatible policy, loadout, target, ownership, and stale revision without partial state", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const base = {
      role: "HUNTER" as const,
      tool: "SWORD" as const,
      equipmentTier: 1,
      targetId: "monster-seeded-01",
      returnPolicy: "WHEN_FULL" as const,
    };
    const gateway = runtime.worker.gateway!;
    const expectCode = async (overrides: Record<string, unknown>, code: string) => {
      await assert.rejects(
        gateway.assignSoldierMission({
          worldId: WORLD_ID,
          playerId: "player-a",
          binding: "binding-a",
          soldierId: "soldier-a-01",
          expectedSoldierRevision: 0,
          commandId: `command-invalid-hunter-${code}`,
          idempotencyKey: `invalid-hunter-${code}`,
          ...base,
          ...overrides,
        }),
        (error: unknown) => error instanceof PersistenceError && error.code === code,
      );
    };
    await expectCode({}, "INVALID_INPUT");
    await expectCode({ tool: "AXE", idempotencyKey: "invalid-hunter-tool" }, "TOOL_INCOMPATIBLE");
    await expectCode({ equipmentTier: 2, idempotencyKey: "invalid-hunter-tier" }, "TOOL_INCOMPATIBLE");
    await expectCode({ targetId: "node-rock-a", returnPolicy: "ON_RECALL", idempotencyKey: "invalid-hunter-target" }, "TARGET_UNAVAILABLE");
    await expectCode({ playerId: "player-b", binding: "binding-b", idempotencyKey: "invalid-hunter-owner" }, "OWNERSHIP_DENIED");
    await expectCode({ expectedSoldierRevision: 1, returnPolicy: "ON_RECALL", idempotencyKey: "invalid-hunter-stale" }, "STALE_REVISION");

    const result = await dispatchHunter(runtime);
    const duplicate = await dispatchHunter(runtime);
    assert.equal((duplicate as { duplicate?: boolean }).duplicate, true);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MissionDispatched").length, 1);
    await assert.rejects(
      dispatchHunter(runtime, { targetId: "node-rock-a", idempotencyKey: "cp11-hunter-dispatch-a-01" }),
      (error: unknown) => error instanceof PersistenceError && error.code === "DUPLICATE_COMMAND",
    );
    assert.equal(runtime.store.getMission(WORLD_ID, result.missionId)?.phase, "TRAVELLING");
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("only one active hunter may claim the seeded monster, and a terminal failure rolls back for a retry", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const first = await dispatchHunter(runtime);
    await assert.rejects(
      dispatchHunter(runtime, { soldierId: "soldier-a-02", idempotencyKey: "cp11-hunter-dispatch-a-02" }),
      (error: unknown) => error instanceof PersistenceError && error.code === "TARGET_UNAVAILABLE",
    );
    assert.equal(runtime.store.listSoldiers(WORLD_ID).find((item) => item.soldierId === "soldier-a-02")?.state, "AT_SHELTER");

    await runtime.worker.advance(25000);
    const encounterBefore = runtime.store.listEncounters(WORLD_ID)[0]!;
    const eventsBefore = runtime.store.events(WORLD_ID).length;
    assert.equal(encounterBefore.roundNumber, 4);
    assert.equal(encounterBefore.monsterHp, 8);
    assert.throws(
      () => runtime.combat.advanceCombatAtBoundary({ worldId: WORLD_ID, worldTime: 26 }, { injectFailureAt: "after_state" }),
      (error: unknown) => error instanceof PersistenceError && error.code === "INJECTED_FAILURE",
    );
    assert.deepEqual(runtime.store.getEncounter(WORLD_ID, encounterBefore.encounterId), encounterBefore);
    assert.equal(runtime.store.listMonsters(WORLD_ID)[0]?.state, "PATROL");
    assert.equal(runtime.store.events(WORLD_ID).length, eventsBefore);

    const [retry] = runtime.combat.advanceCombatAtBoundary({ worldId: WORLD_ID, worldTime: 26 });
    assert.equal(retry?.encounter.terminalCause, "MONSTER_DEFEATED");
    assert.equal(runtime.store.listMonsters(WORLD_ID)[0]?.state, "DEAD");
    const terminalEncounter = runtime.store.listEncounters(WORLD_ID)[0];
    assert.equal(terminalEncounter?.state, "RESOLVED");
    assert.equal(terminalEncounter?.terminalCause, "MONSTER_DEFEATED");
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("a file-backed restart preserves hunter victory and completes the real return exactly once", async () => {
  const first = await openRuntime();
  const dbPath = first.runtime.store.databasePath;
  const directory = first.directory;
  try {
    await dispatchHunter(first.runtime);
    await first.runtime.worker.advance(26000);
    const terminalEventCount = first.runtime.store.events(WORLD_ID).length;
    await closeRuntime(first.runtime, "");

    const resumed = await openRuntime(dbPath);
    try {
      await resumed.runtime.worker.advance(11000);
      assert.equal(resumed.runtime.store.listMonsters(WORLD_ID)[0]?.state, "DEAD");
      assert.equal(resumed.runtime.store.events(WORLD_ID).filter((event) => event.eventType === "MonsterDefeated").length, 1);
      assert.equal(resumed.runtime.store.events(WORLD_ID).length, terminalEventCount + 2);
      const countAfterCompletion = resumed.runtime.store.events(WORLD_ID).length;
      await resumed.runtime.worker.advance(1000);
      assert.equal(resumed.runtime.store.events(WORLD_ID).length, countAfterCompletion);
      assert.equal(resumed.runtime.store.getMission(WORLD_ID, resumed.runtime.store.listMissions(WORLD_ID)[0]!.missionId)?.phase, "AT_SHELTER");
    } finally {
      await closeRuntime(resumed.runtime, "");
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
