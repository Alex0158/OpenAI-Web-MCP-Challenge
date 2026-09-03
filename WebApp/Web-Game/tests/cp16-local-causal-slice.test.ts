import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { createPersistenceStore, PersistenceError } from "../src/server/persistence/store";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import { MonsterCombatService } from "../src/server/monster-combat-service";
import { WorldWorkerModule } from "../src/server/world-worker";
import type { MonsterCombatRoundResolution, SignalEligibilityInput } from "../src/server/persistence/types";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp16-local-causal-world";

interface Runtime {
  store: ReturnType<typeof createPersistenceStore>;
  worker: WorldWorkerModule;
  directory: string;
}

function grantFor(context: { worldId: string; shelterId: string; soldierId: string }): SignalEligibilityInput | undefined {
  if (context.worldId !== WORLD_ID || context.shelterId !== "shelter-a") {
    return undefined;
  }
  return {
    shelterId: context.shelterId,
    opaqueBinding: "binding-a",
    grantId: "cp16-local-grant-v1",
    boundedAction: "force_recall_soldier",
    severity: "warning",
    cooldownWorldSeconds: 60,
  };
}

async function openRuntime(withGrant: boolean): Promise<Runtime> {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp16-local-causal-"));
  const dbPath = join(directory, "world.sqlite");
  const seed = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  seed.open();
  createAndPersistG2Fixture(seed, {
    worldId: WORLD_ID,
    playerBindings: { "player-a": "binding-a", "player-b": "binding-b" },
  });
  seed.close();

  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const worker = new WorldWorkerModule({
    store,
    worldId: WORLD_ID,
    ...(withGrant ? { signalEligibilityProvider: grantFor } : {}),
  });
  await worker.start();
  return { store, worker, directory };
}

async function closeRuntime(runtime: Runtime): Promise<void> {
  await runtime.worker.stop();
  rmSync(runtime.directory, { recursive: true, force: true });
}

async function dispatchGatherer(runtime: Runtime) {
  if (!runtime.worker.gateway) {
    throw new Error("worker gateway unavailable");
  }
  return runtime.worker.gateway.assignSoldierMission({
    worldId: WORLD_ID,
    playerId: "player-a",
    binding: "binding-a",
    soldierId: "soldier-a-01",
    role: "GATHERER",
    tool: "PICKAXE",
    equipmentTier: 1,
    targetId: "node-rock-a",
    expectedSoldierRevision: 0,
    commandId: "cp16-command-gatherer-a-01",
    idempotencyKey: "cp16-dispatch-gatherer-a-01",
  });
}

test("a granted terminal loss produces one scoped pending signal atomically", async () => {
  const runtime = await openRuntime(true);
  try {
    const dispatched = await dispatchGatherer(runtime);
    await runtime.worker.advance(24000);

    const events = runtime.store.events(WORLD_ID);
    const lossEvents = events.filter((event) => event.eventType === "CargoLostToMonster");
    assert.equal(lossEvents.length, 1);
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 0);
    assert.equal(runtime.store.getMission(WORLD_ID, dispatched.missionId)?.phase, "WAITING_REVIEW");
    assert.equal(runtime.store.getMissionAttempt(WORLD_ID, dispatched.missionAttemptId)?.phase, "TERMINAL");
    assert.equal(runtime.store.listSoldiers(WORLD_ID).find((soldier) => soldier.soldierId === "soldier-a-01")?.state, "AT_SHELTER");

    const slot = runtime.store.signalSlot(WORLD_ID, "shelter-a", "binding-a");
    assert.ok(slot);
    assert.equal(slot.status, "pending");
    assert.equal(slot.grantId, "cp16-local-grant-v1");
    assert.equal(slot.boundedAction, "force_recall_soldier");
    assert.equal(slot.opaqueBinding, "binding-a");
    assert.equal(slot.eligibleEventCount, 1);
    assert.deepEqual(slot.eventTypes, ["CargoLostToMonster"]);
    assert.equal(slot.latestEventId, lossEvents[0]?.eventId);
    assert.equal(slot.latestWorldTime, 24);

    const delivery = runtime.store.outboxDelivery(WORLD_ID, slot.signalId);
    assert.ok(delivery);
    assert.equal(delivery.status, "pending");
    assert.equal(delivery.opaqueBinding, "binding-a");
    assert.equal(delivery.shelterId, "shelter-a");

    const signalId = slot.signalId;
    const encounter = runtime.store.listEncounters(WORLD_ID)[0];
    const terminalRoundEvent = events.find((event) => event.eventType === "BattleRoundResolved" && event.worldTime === 24);
    assert.ok(encounter);
    assert.ok(terminalRoundEvent);
    const terminalKey = `monster-combat:${encounter.encounterId}:round:10`;
    const duplicate = runtime.store.commitMonsterCombatRound({
      worldId: WORLD_ID,
      worldTime: 24,
      idempotency: {
        key: terminalKey,
        binding: `worker:${WORLD_ID}`,
        request: {
          kind: "monster_combat_round",
          encounterId: encounter.encounterId,
          missionId: dispatched.missionId,
          missionAttemptId: dispatched.missionAttemptId,
          soldierId: "soldier-a-01",
          monsterId: "monster-seeded-01",
          roundNumber: 10,
          worldTime: 24,
        },
      },
      encounterId: encounter.encounterId,
      expectedEncounterRevision: 0,
      missionId: dispatched.missionId,
      expectedMissionRevision: 0,
      missionAttemptId: dispatched.missionAttemptId,
      expectedMissionAttemptRevision: 0,
      soldierId: "soldier-a-01",
      expectedSoldierRevision: 0,
      monsterId: "monster-seeded-01",
      expectedMonsterRevision: 0,
      resolution: (terminalRoundEvent.typedPayload as { round: MonsterCombatRoundResolution }).round,
      events: events.filter((event) => event.idempotencyKey === terminalKey),
      signalEligibility: grantFor({ worldId: WORLD_ID, shelterId: "shelter-a", soldierId: "soldier-a-01" }),
    });
    assert.equal(duplicate.duplicate, true);
    assert.equal(runtime.store.signalSlot(WORLD_ID, "shelter-a", "binding-a")?.signalId, signalId);

    const eventCount = events.length;
    await runtime.worker.advance(1000);
    assert.equal(runtime.store.events(WORLD_ID).length, eventCount);
    assert.equal(runtime.store.signalSlot(WORLD_ID, "shelter-a", "binding-a")?.signalId, signalId);
    assert.equal(runtime.store.signalSlot(WORLD_ID, "shelter-b", "binding-b"), null);
  } finally {
    await closeRuntime(runtime);
  }
});

test("signal failure rolls the combat state, events, cargo, and delivery back together", async () => {
  const runtime = await openRuntime(true);
  try {
    await dispatchGatherer(runtime);
    await runtime.worker.advance(15000);
    const eventCountBefore = runtime.store.events(WORLD_ID).length;
    const cargoCountBefore = runtime.store.listCargo(WORLD_ID).length;
    const combat = new MonsterCombatService({
      store: runtime.store,
      signalEligibilityProvider: grantFor,
    });

    assert.throws(
      () => combat.advanceCombatAtBoundary({ worldId: WORLD_ID, worldTime: 16 }, { injectFailureAt: "after_signal" }),
      (error: unknown) => error instanceof PersistenceError && error.code === "INJECTED_FAILURE",
    );
    assert.equal(runtime.store.getWorld(WORLD_ID)?.worldTime, 15);
    assert.equal(runtime.store.events(WORLD_ID).length, eventCountBefore);
    assert.equal(runtime.store.listCargo(WORLD_ID).length, cargoCountBefore);
    assert.equal(runtime.store.signalSlot(WORLD_ID, "shelter-a", "binding-a"), null);

    await runtime.worker.advance(9000);
    assert.ok(runtime.store.signalSlot(WORLD_ID, "shelter-a", "binding-a"));
    assert.equal(runtime.store.listCargo(WORLD_ID).length, 0);
  } finally {
    await closeRuntime(runtime);
  }
});

test("without an explicit grant the same terminal loss remains history-only and private", async () => {
  const runtime = await openRuntime(false);
  try {
    await dispatchGatherer(runtime);
    await runtime.worker.advance(24000);

    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CargoLostToMonster").length, 1);
    assert.equal(runtime.store.signalSlot(WORLD_ID, "shelter-a", "binding-a"), null);
    assert.equal(runtime.store.signalSlot(WORLD_ID, "shelter-b", "binding-b"), null);

    if (!runtime.worker.gateway) {
      throw new Error("worker gateway unavailable");
    }
    const beta = await runtime.worker.gateway.fullSnapshot({
      worldId: WORLD_ID,
      playerId: "player-b",
      binding: "binding-b",
    });
    assert.equal(beta.recentEvents.some((event) => event.eventType === "CargoLostToMonster"), false);
    assert.equal(beta.recentEvents.some((event) => event.eventType === "SoldierDied"), false);
  } finally {
    await closeRuntime(runtime);
  }
});
