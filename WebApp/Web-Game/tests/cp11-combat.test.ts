import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { createPersistenceStore, PersistenceError } from "../src/server/persistence/store";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import { MissionExtractionService } from "../src/server/mission-extraction-service";
import { MissionTravelService } from "../src/server/mission-travel-service";
import { MonsterCombatService, resolveMonsterGathererRound } from "../src/server/monster-combat-service";
import { WorldClock } from "../src/server/world-clock";
import { WorldWorkerModule } from "../src/server/world-worker";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp11-combat-world";

interface Runtime {
  store: ReturnType<typeof createPersistenceStore>;
  worker: WorldWorkerModule;
  combat: MonsterCombatService;
}

async function openRuntime(dbPath?: string): Promise<{ runtime: Runtime; directory: string }> {
  const directory = dbPath ? "" : mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp11-combat-"));
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
  const extraction = new MissionExtractionService({ store });
  const combat = new MonsterCombatService({ store });
  const clock = new WorldClock({
    worldId: WORLD_ID,
    persistence: store,
    phaseHandlers: {
      movement: (context) => travel.advanceAtBoundary(context),
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

async function dispatchGatherer(runtime: Runtime, options: { soldierId?: string; key?: string } = {}): Promise<{ missionId: string; missionAttemptId: string }> {
  if (!runtime.worker.gateway) {
    throw new Error("worker gateway unavailable");
  }
  const idempotencyKey = options.key ?? `cp11-gatherer-dispatch-${options.soldierId ?? "soldier-a-01"}`;
  return runtime.worker.gateway.assignSoldierMission({
    worldId: WORLD_ID,
    playerId: "player-a",
    binding: "binding-a",
    soldierId: options.soldierId ?? "soldier-a-01",
    role: "GATHERER",
    tool: "PICKAXE",
    equipmentTier: 1,
    targetId: "node-rock-a",
    expectedSoldierRevision: 0,
    commandId: `command-${idempotencyKey}`,
    idempotencyKey,
  });
}

test("seeded contact locks before extraction and resolves one deterministic round per world second", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatchGatherer(runtime);
    await runtime.worker.advance(15000);

    const mission = runtime.store.getMission(WORLD_ID, dispatched.missionId);
    const attempt = runtime.store.getMissionAttempt(WORLD_ID, dispatched.missionAttemptId);
    const encounter = runtime.store.listEncounters(WORLD_ID)[0];
    assert.equal(mission?.encounterStatus, "RESOLVING");
    assert.equal(attempt?.encounterStatus, "RESOLVING");
    assert.equal(encounter?.state, "RESOLVING");
    assert.equal(encounter?.roundNumber, 1);
    assert.equal(encounter?.soldierHp, 90);
    assert.equal(encounter?.monsterHp, 74);
    assert.equal(runtime.store.listCargo(WORLD_ID).reduce((total, item) => total + item.quantity, 0), 4);
    assert.deepEqual(runtime.store.events(WORLD_ID).map((event) => event.eventType), [
      "MissionDispatched",
      "MissionWorking",
      "CargoExtracted",
      "CargoExtracted",
      "CargoExtracted",
      "CargoExtracted",
      "ActorObserved",
      "EncounterLocked",
      "BattleRoundResolved",
    ]);

    await runtime.worker.advance(9000);
    const terminalEncounter = runtime.store.getEncounter(WORLD_ID, encounter?.encounterId ?? "");
    assert.equal(terminalEncounter?.state, "RESOLVED");
    assert.equal(terminalEncounter?.roundNumber, 10);
    assert.equal(terminalEncounter?.terminalCause, "GATHERER_LOST");
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 0);
    assert.equal(runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, 0);
    assert.deepEqual(runtime.store.listSoldiers(WORLD_ID).find((soldier) => soldier.soldierId === "soldier-a-01"), {
      worldId: WORLD_ID,
      soldierId: "soldier-a-01",
      shelterId: "shelter-a",
      state: "AT_SHELTER",
      role: null,
      tool: null,
      revision: 2,
    });
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "WAITING_REVIEW");
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.waitingReviewReason, "NO_SAFE_REISSUE_ROUTE");
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.monsterReissueBudget, 0);
    assert.equal(runtime.store.getMissionAttempt(WORLD_ID, dispatched.missionAttemptId)?.phase, "TERMINAL");
    assert.equal(runtime.store.listMonsters(WORLD_ID)[0]?.state, "PATROL");
    assert.deepEqual(runtime.store.events(WORLD_ID).slice(-6).map((event) => event.eventType), [
      "BattleRoundResolved",
      "EncounterResolved",
      "CargoLostToMonster",
      "SoldierDied",
      "SoldierRespawned",
      "MissionReissued",
    ]);

    const encounterId = terminalEncounter?.encounterId as string;
    const replayEncounter = runtime.store.getEncounter(WORLD_ID, encounterId);
    const replayMission = runtime.store.getMission(WORLD_ID, dispatched.missionId);
    const replayAttempt = runtime.store.getMissionAttempt(WORLD_ID, dispatched.missionAttemptId);
    const soldier = runtime.store.listSoldiers(WORLD_ID).find((candidate) => candidate.soldierId === "soldier-a-01");
    const contactKey = `monster-contact:${dispatched.missionAttemptId}:15`;
    const contactEventIds = runtime.store.idempotency(WORLD_ID, contactKey)?.eventIds ?? [];
    const duplicateContact = runtime.store.commitMonsterContact({
      worldId: WORLD_ID,
      worldTime: 15,
      idempotency: {
        key: contactKey,
        binding: `worker:${WORLD_ID}`,
        request: {
          kind: "monster_contact",
          encounterId,
          missionId: dispatched.missionId,
          missionAttemptId: dispatched.missionAttemptId,
          soldierId: "soldier-a-01",
          monsterId: "monster-seeded-01",
          worldTime: 15,
        },
      },
      encounterId,
      missionId: dispatched.missionId,
      expectedMissionRevision: replayMission?.revision ?? 0,
      missionAttemptId: dispatched.missionAttemptId,
      expectedMissionAttemptRevision: replayAttempt?.revision ?? 0,
      soldierId: "soldier-a-01",
      expectedSoldierRevision: soldier?.revision ?? 0,
      monsterId: "monster-seeded-01",
      expectedMonsterRevision: 0,
      engagementPosition: replayEncounter?.engagementPosition ?? { x: 34, y: 64 },
      events: runtime.store.events(WORLD_ID).filter((event) => contactEventIds.includes(event.eventId)),
    });
    assert.equal(duplicateContact.duplicate, true);
    const roundEvent = runtime.store.events(WORLD_ID).find((event) => event.eventType === "BattleRoundResolved");
    assert.ok(roundEvent);
    const roundPayload = roundEvent.typedPayload as { round: ReturnType<typeof resolveMonsterGathererRound> };
    const combatKey = `monster-combat:${encounterId}:round:1`;
    const duplicateRound = runtime.store.commitMonsterCombatRound({
      worldId: WORLD_ID,
      worldTime: 15,
      idempotency: {
        key: combatKey,
        binding: `worker:${WORLD_ID}`,
        request: {
          kind: "monster_combat_round",
          encounterId,
          missionId: dispatched.missionId,
          missionAttemptId: dispatched.missionAttemptId,
          soldierId: "soldier-a-01",
          monsterId: "monster-seeded-01",
          roundNumber: 1,
          worldTime: 15,
        },
      },
      encounterId,
      expectedEncounterRevision: 0,
      missionId: dispatched.missionId,
      expectedMissionRevision: 0,
      missionAttemptId: dispatched.missionAttemptId,
      expectedMissionAttemptRevision: 0,
      soldierId: "soldier-a-01",
      expectedSoldierRevision: 0,
      monsterId: "monster-seeded-01",
      expectedMonsterRevision: 0,
      resolution: roundPayload.round,
      events: [roundEvent],
    });
    assert.equal(duplicateRound.duplicate, true);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("combat formula is deterministic and stops the second strike after a lethal first strike", () => {
  assert.deepEqual(resolveMonsterGathererRound({
    roundNumber: 1,
    gathererHp: 10,
    monsterHp: 80,
  }), {
    roundNumber: 1,
    firstActor: "MONSTER",
    secondActor: null,
    gathererDamage: 0,
    monsterDamage: 10,
    gathererHpBefore: 10,
    gathererHpAfter: 0,
    monsterHpBefore: 80,
    monsterHpAfter: 80,
    terminalCause: "GATHERER_LOST",
  });
});

test("malformed exposed cargo blocks terminal settlement and leaves the combat chain retryable", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    const dispatched = await dispatchGatherer(runtime);
    await runtime.worker.advance(15000);
    const cargo = runtime.store.listCargo(WORLD_ID)[0];
    assert.ok(cargo);
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("UPDATE cargo SET resource_type = 'gold' WHERE world_id = ? AND cargo_id = ?").run(WORLD_ID, cargo.cargoId);
    database.close();
    assert.throws(
      () => runtime.worker.advance(9000),
      (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED",
    );
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.encounterStatus, "RESOLVING");
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 1);
    assert.equal(runtime.store.getEncounter(WORLD_ID, runtime.store.listEncounters(WORLD_ID)[0]!.encounterId)?.state, "RESOLVING");
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("a contact transaction rolls back completely and can be retried at the same durable boundary", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await dispatchGatherer(runtime);
    await runtime.worker.advance(14000);
    assert.throws(
      () => runtime.combat.advanceContactAtBoundary({ worldId: WORLD_ID, worldTime: 15 }, { injectFailureAt: "after_state" }),
      (error: unknown) => error instanceof PersistenceError && error.code === "INJECTED_FAILURE",
    );
    assert.equal(runtime.store.getWorld(WORLD_ID)?.worldTime, 14);
    assert.deepEqual(runtime.store.listEncounters(WORLD_ID), []);
    assert.equal(runtime.store.listMissions(WORLD_ID)[0]?.encounterId, null);
    await runtime.worker.advance(1000);
    assert.equal(runtime.store.listEncounters(WORLD_ID).length, 1);
    assert.equal(runtime.store.listEncounters(WORLD_ID)[0]?.roundNumber, 1);
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("two gatherers reaching the seeded danger cell produce one monster encounter in stable order", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await dispatchGatherer(runtime);
    await dispatchGatherer(runtime, { soldierId: "soldier-a-02" });
    await runtime.worker.advance(15000);
    const encounters = runtime.store.listEncounters(WORLD_ID);
    assert.equal(encounters.length, 1);
    const otherSoldierId = encounters[0]?.soldierId === "soldier-a-01" ? "soldier-a-02" : "soldier-a-01";
    assert.equal(runtime.store.getMission(WORLD_ID, runtime.store.listMissions(WORLD_ID).find((mission) => mission.soldierId === otherSoldierId)?.missionId ?? "")?.encounterId, null);
    assert.equal(runtime.worker.state, "ready");
  } finally {
    await closeRuntime(runtime, directory);
  }
});

test("restart resumes the next round and terminal result without replaying prior events", async () => {
  const first = await openRuntime();
  const dbPath = first.runtime.store.databasePath;
  const directory = first.directory;
  try {
    await dispatchGatherer(first.runtime);
    await first.runtime.worker.advance(15000);
    const eventCountAtLock = first.runtime.store.events(WORLD_ID).length;
    await closeRuntime(first.runtime, "");

    const resumed = await openRuntime(dbPath);
    try {
      await resumed.runtime.worker.advance(9000);
      assert.equal(resumed.runtime.store.listEncounters(WORLD_ID)[0]?.state, "RESOLVED");
      assert.equal(resumed.runtime.store.events(WORLD_ID).length, eventCountAtLock + 8 + 6);
      const eventCountAtTerminal = resumed.runtime.store.events(WORLD_ID).length;
      await resumed.runtime.worker.advance(1000);
      assert.equal(resumed.runtime.store.events(WORLD_ID).length, eventCountAtTerminal);
      assert.equal(resumed.runtime.store.listSoldiers(WORLD_ID).find((soldier) => soldier.soldierId === "soldier-a-01")?.state, "AT_SHELTER");
    } finally {
      await closeRuntime(resumed.runtime, "");
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("empty exposed cargo still records cargo loss without crediting the shelter", async () => {
  const { runtime, directory } = await openRuntime();
  try {
    await dispatchGatherer(runtime);
    await runtime.worker.advance(15000);
    const database = new DatabaseSync(runtime.store.databasePath);
    database.prepare("DELETE FROM cargo WHERE world_id = ?").run(WORLD_ID);
    database.close();
    await runtime.worker.advance(9000);
    const loss = runtime.store.events(WORLD_ID).find((event) => event.eventType === "CargoLostToMonster");
    assert.deepEqual(loss?.typedPayload && (loss.typedPayload as { totalQuantity?: number; totalCapacityUsed?: number }).totalQuantity, 0);
    assert.deepEqual(loss?.typedPayload && (loss.typedPayload as { totalQuantity?: number; totalCapacityUsed?: number }).totalCapacityUsed, 0);
    assert.equal(runtime.store.getShelter(WORLD_ID, "shelter-a")?.coins, 0);
  } finally {
    await closeRuntime(runtime, directory);
  }
});
