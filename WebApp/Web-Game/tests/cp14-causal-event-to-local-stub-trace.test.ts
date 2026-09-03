import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import {
  ReentryDeliveryPort,
  type ReentrySignalEnvelope,
  type ReentryTransportOutcome,
} from "../src/server/reentry-delivery-port";
import { createPersistenceStore } from "../src/server/persistence/store";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import type { SignalEligibilityInput } from "../src/server/persistence/types";
import { WorldWorkerModule } from "../src/server/world-worker";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp14-causal-local-world";
const GRANT_ID = "cp14-causal-grant-v1";

interface Runtime {
  store: ReturnType<typeof createPersistenceStore>;
  worker: WorldWorkerModule;
  directory: string;
}

function grantFor(context: { worldId: string; shelterId: string; soldierId: string }): SignalEligibilityInput | undefined {
  if (context.worldId !== WORLD_ID || context.shelterId !== "shelter-a" || context.soldierId !== "soldier-a-01") {
    return undefined;
  }
  return {
    shelterId: context.shelterId,
    opaqueBinding: "binding-a",
    grantId: GRANT_ID,
    boundedAction: "force_recall_soldier",
    severity: "warning",
    cooldownWorldSeconds: 60,
  };
}

async function openRuntime(): Promise<Runtime> {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp14-causal-"));
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
    signalEligibilityProvider: grantFor,
  });
  await worker.start();
  return { store, worker, directory };
}

async function closeRuntime(runtime: Runtime): Promise<void> {
  await runtime.worker.stop();
  rmSync(runtime.directory, { recursive: true, force: true });
}

async function dispatchGatherer(runtime: Runtime): Promise<{ missionId: string; missionAttemptId: string }> {
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
    commandId: "cp14-causal-command-gatherer",
    idempotencyKey: "cp14-causal-dispatch-gatherer",
  });
}

test("real combat loss composes with local Re-entry delivery without repeating gameplay", async () => {
  const runtime = await openRuntime();
  try {
    const dispatched = await dispatchGatherer(runtime);
    await runtime.worker.advance(24000);

    const beforeWorld = runtime.store.getWorld(WORLD_ID);
    const beforeShelter = runtime.store.getShelter(WORLD_ID, "shelter-a");
    const beforeSoldier = runtime.store.listSoldiers(WORLD_ID).find((soldier) => soldier.soldierId === "soldier-a-01");
    const beforeMission = runtime.store.getMission(WORLD_ID, dispatched.missionId);
    const beforeAttempt = runtime.store.getMissionAttempt(WORLD_ID, dispatched.missionAttemptId);
    const beforeCargo = runtime.store.listCargo(WORLD_ID);
    const beforeEvents = runtime.store.events(WORLD_ID);
    const lossEvents = beforeEvents.filter((event) => event.eventType === "CargoLostToMonster");
    assert.equal(lossEvents.length, 1);
    assert.equal(beforeWorld?.worldTime, 24);
    assert.equal(beforeMission?.phase, "WAITING_REVIEW");
    assert.equal(beforeAttempt?.phase, "TERMINAL");
    assert.equal(beforeSoldier?.state, "AT_SHELTER");
    assert.equal(beforeCargo.length, 0);

    const slot = runtime.store.signalSlot(WORLD_ID, "shelter-a", "binding-a");
    assert.ok(slot);
    assert.equal(slot.status, "pending");
    assert.equal(slot.grantId, GRANT_ID);
    assert.equal(slot.boundedAction, "force_recall_soldier");
    assert.equal(slot.eligibleEventCount, 1);
    assert.equal(slot.latestEventId, lossEvents[0]?.eventId);
    assert.equal(slot.latestEventType, "CargoLostToMonster");
    assert.equal(slot.latestWorldTime, 24);
    assert.equal(runtime.store.outboxDelivery(WORLD_ID, slot.signalId)?.status, "pending");

    const envelopes: ReentrySignalEnvelope[] = [];
    const outcomes: ReentryTransportOutcome[] = [{ kind: "accepted" }];
    const port = new ReentryDeliveryPort({
      store: runtime.store,
      leaseDurationMs: 30_000,
      transport: {
        async deliver(envelope: ReentrySignalEnvelope): Promise<ReentryTransportOutcome> {
          envelopes.push(envelope);
          const outcome = outcomes.shift();
          if (!outcome) {
            throw new Error("unexpected second local delivery");
          }
          return outcome;
        },
      },
    });

    const delivered = await port.pumpOnce({
      worldId: WORLD_ID,
      nowWallTimeMs: 1_000,
      leaseId: "cp14-causal-lease-1",
    });
    assert.equal(delivered.kind, "accepted");
    assert.equal(delivered.signalId, slot.signalId);
    assert.equal(envelopes.length, 1);
    assert.deepEqual(envelopes[0], {
      contractVersion: CONTRACT_VERSION,
      worldId: WORLD_ID,
      shelterId: "shelter-a",
      opaqueBinding: "binding-a",
      signalId: slot.signalId,
      grantId: GRANT_ID,
      boundedAction: "force_recall_soldier",
      cursorStart: slot.cursorStart,
      cursorEnd: slot.cursorEnd,
      eligibleEventCount: 1,
      eventTypes: ["CargoLostToMonster"],
      severity: "warning",
      latestEventId: lossEvents[0]?.eventId,
      latestEventType: "CargoLostToMonster",
      latestWorldTime: 24,
    });
    assert.equal("prompt" in (envelopes[0] ?? {}), false);
    assert.equal("credential" in (envelopes[0] ?? {}), false);

    const afterWorld = runtime.store.getWorld(WORLD_ID);
    assert.equal(afterWorld?.worldTime, beforeWorld?.worldTime);
    assert.equal(afterWorld?.worldEventCursor, (beforeWorld?.worldEventCursor ?? 0) + 1);
    assert.deepEqual(runtime.store.getShelter(WORLD_ID, "shelter-a"), beforeShelter);
    assert.deepEqual(runtime.store.listSoldiers(WORLD_ID).find((soldier) => soldier.soldierId === "soldier-a-01"), beforeSoldier);
    assert.deepEqual(runtime.store.getMission(WORLD_ID, dispatched.missionId), beforeMission);
    assert.deepEqual(runtime.store.getMissionAttempt(WORLD_ID, dispatched.missionAttemptId), beforeAttempt);
    assert.deepEqual(runtime.store.listCargo(WORLD_ID), beforeCargo);
    assert.equal(runtime.store.outboxDelivery(WORLD_ID, slot.signalId)?.status, "acknowledged");
    assert.equal(runtime.store.signalSlot(WORLD_ID, "shelter-a", "binding-a")?.status, "acknowledged");
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "CargoLostToMonster").length, 1);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "ContinuationDelivered").length, 1);
    assert.equal(runtime.store.signalSlot(WORLD_ID, "shelter-b", "binding-b"), null);

    const second = await port.pumpOnce({
      worldId: WORLD_ID,
      nowWallTimeMs: 2_000,
      leaseId: "cp14-causal-lease-2",
    });
    assert.equal(second.kind, "idle");
    assert.equal(envelopes.length, 1);
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "ContinuationDelivered").length, 1);
  } finally {
    await closeRuntime(runtime);
  }
});
