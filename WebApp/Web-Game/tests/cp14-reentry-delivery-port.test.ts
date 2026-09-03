import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { createPersistenceStore, PersistenceError } from "../src/server/persistence/store";
import {
  ReentryDeliveryPort,
  type ReentrySignalEnvelope,
  type ReentryTransportOutcome,
} from "../src/server/reentry-delivery-port";
import type { SignalEligibilityInput } from "../src/server/persistence/types";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp14-delivery-port-world";
const SHELTER_ID = "shelter-a";
const BINDING = "binding-a";

type Store = ReturnType<typeof createPersistenceStore>;

function withStore(run: (store: Store) => Promise<void>): Promise<void> {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp14-port-"));
  const store = createPersistenceStore({
    dbPath: join(directory, "world.sqlite"),
    contractVersion: CONTRACT_VERSION,
  });
  store.open();
  store.createWorld({
    worldId: WORLD_ID,
    worldTime: 0,
    worldSeed: "sleepless-mvp-01",
    generationVersion: "g2-fixture-1",
    mapFingerprint: "cp14-delivery-port-fingerprint",
  });
  store.createPlayer({ worldId: WORLD_ID, playerId: "player-a", binding: BINDING });
  store.createShelter({ worldId: WORLD_ID, shelterId: SHELTER_ID, playerId: "player-a", revision: 0 });
  return run(store).finally(() => {
    try {
      store.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
}

function eligibility(overrides: Partial<SignalEligibilityInput> = {}): SignalEligibilityInput {
  return {
    shelterId: SHELTER_ID,
    opaqueBinding: BINDING,
    grantId: "cp14-port-grant-v1",
    boundedAction: "force_recall_soldier",
    severity: "warning",
    cooldownWorldSeconds: 60,
    ...overrides,
  };
}

function commitEligible(store: Store, sequence: number, worldTime: number): { signalId: string; cursor: number } {
  const shelter = store.getShelter(WORLD_ID, SHELTER_ID);
  assert.ok(shelter);
  const committed = store.commitTransition({
    worldId: WORLD_ID,
    worldTime,
    idempotency: {
      key: `cp14-port-command-${sequence}`,
      binding: BINDING,
      request: { kind: "CargoLostToMonster", sequence },
    },
    stateMutations: [{
      entityType: "shelter",
      entityId: SHELTER_ID,
      expectedRevision: shelter.revision,
      patch: { coins: shelter.coins },
    }],
    events: [{
      eventId: `cp14-port-event-${sequence}`,
      eventType: "CargoLostToMonster",
      causationId: `cp14-port-command-${sequence}`,
      aggregateType: "shelter",
      aggregateId: SHELTER_ID,
      visibilityScope: { kind: "shelter", shelterId: SHELTER_ID },
      typedPayload: { soldierId: "soldier-a-01", sequence },
    }],
    signalEligibility: eligibility(),
  });
  assert.ok(committed.signalId);
  assert.ok(committed.worldEventCursorStart !== null);
  return { signalId: committed.signalId, cursor: committed.worldEventCursorStart };
}

function scriptedTransport(outcomes: ReentryTransportOutcome[]) {
  const envelopes: ReentrySignalEnvelope[] = [];
  return {
    envelopes,
    transport: {
      async deliver(envelope: ReentrySignalEnvelope): Promise<ReentryTransportOutcome> {
        envelopes.push(envelope);
        const outcome = outcomes.shift();
        if (!outcome) {
          throw new Error("script exhausted");
        }
        return outcome;
      },
    },
  };
}

test("R14-06: pumpOnce maps one signal, acknowledges it, and leaves gameplay unchanged", async () => {
  await withStore(async (store) => {
    const committed = commitEligible(store, 1, 10);
    const beforeWorld = store.getWorld(WORLD_ID);
    const beforeShelter = store.getShelter(WORLD_ID, SHELTER_ID);
    const beforeEvents = store.events(WORLD_ID).length;
    const scripted = scriptedTransport([{ kind: "accepted" }]);
    const port = new ReentryDeliveryPort({ store, transport: scripted.transport, leaseDurationMs: 30_000 });

    const result = await port.pumpOnce({ worldId: WORLD_ID, nowWallTimeMs: 1_000, leaseId: "lease-1" });

    assert.equal(result.kind, "accepted");
    assert.equal(result.signalId, committed.signalId);
    assert.equal(scripted.envelopes.length, 1);
    assert.deepEqual(scripted.envelopes[0], {
      contractVersion: CONTRACT_VERSION,
      worldId: WORLD_ID,
      shelterId: SHELTER_ID,
      opaqueBinding: BINDING,
      signalId: committed.signalId,
      grantId: "cp14-port-grant-v1",
      boundedAction: "force_recall_soldier",
      cursorStart: committed.cursor,
      cursorEnd: committed.cursor,
      eligibleEventCount: 1,
      eventTypes: ["CargoLostToMonster"],
      severity: "warning",
      latestEventId: "cp14-port-event-1",
      latestEventType: "CargoLostToMonster",
      latestWorldTime: 10,
    });
    assert.equal("prompt" in scripted.envelopes[0], false);
    assert.equal("credential" in scripted.envelopes[0], false);
    assert.equal(store.outboxDelivery(WORLD_ID, committed.signalId)?.status, "acknowledged");
    assert.equal(store.events(WORLD_ID).length, beforeEvents + 1);
    assert.equal(store.events(WORLD_ID).filter((event) => event.eventType === "ContinuationDelivered").length, 1);
    const afterWorld = store.getWorld(WORLD_ID);
    assert.ok(afterWorld);
    assert.equal(afterWorld.worldTime, beforeWorld?.worldTime, "delivery never advances gameplay world time");
    assert.ok(afterWorld.worldEventCursor > (beforeWorld?.worldEventCursor ?? -1), "acknowledgement is a durable delivery event");
    assert.deepEqual(store.getShelter(WORLD_ID, SHELTER_ID), beforeShelter);

    const second = await port.pumpOnce({ worldId: WORLD_ID, nowWallTimeMs: 2_000, leaseId: "lease-2" });
    assert.equal(second.kind, "idle");
    assert.equal(scripted.envelopes.length, 1, "an acknowledged signal is never delivered twice");
    assert.equal(store.events(WORLD_ID).filter((event) => event.eventType === "ContinuationDelivered").length, 1);
  });
});

test("R14-05: retry and expired-lease reclaim reuse the same signal identity", async () => {
  await withStore(async (store) => {
    const committed = commitEligible(store, 1, 10);
    const scripted = scriptedTransport([
      { kind: "retryable", code: "RECEIVER_TIMEOUT" },
      { kind: "accepted" },
    ]);
    const port = new ReentryDeliveryPort({ store, transport: scripted.transport, leaseDurationMs: 100 });

    const first = await port.pumpOnce({ worldId: WORLD_ID, nowWallTimeMs: 1_000, leaseId: "lease-1" });
    assert.equal(first.kind, "retryable");
    assert.equal(first.signalId, committed.signalId);
    assert.equal(store.outboxDelivery(WORLD_ID, committed.signalId)?.status, "pending");
    assert.equal(store.outboxDelivery(WORLD_ID, committed.signalId)?.attemptCount, 1);

    const second = await port.pumpOnce({ worldId: WORLD_ID, nowWallTimeMs: 1_050, leaseId: "lease-2" });
    assert.equal(second.kind, "accepted");
    assert.equal(second.signalId, committed.signalId);
    assert.equal(store.outboxDelivery(WORLD_ID, committed.signalId)?.attemptCount, 2);
    assert.equal(store.events(WORLD_ID).filter((event) => event.eventType === "ContinuationDelivered").length, 1);

    const third = await port.pumpOnce({ worldId: WORLD_ID, nowWallTimeMs: 1_200, leaseId: "lease-3" });
    assert.equal(third.kind, "idle");
    assert.equal(scripted.envelopes.length, 2);
  });

  await withStore(async (store) => {
    const committed = commitEligible(store, 1, 10);
    store.claimDelivery({
      worldId: WORLD_ID,
      signalId: committed.signalId,
      leaseId: "expired-lease",
      nowWallTimeMs: 1_000,
      leaseDurationMs: 100,
    });
    const scripted = scriptedTransport([{ kind: "accepted" }]);
    const port = new ReentryDeliveryPort({ store, transport: scripted.transport, leaseDurationMs: 100 });

    const reclaimed = await port.pumpOnce({ worldId: WORLD_ID, nowWallTimeMs: 1_100, leaseId: "new-lease" });
    assert.equal(reclaimed.kind, "accepted");
    assert.equal(reclaimed.signalId, committed.signalId);
    assert.equal(store.outboxDelivery(WORLD_ID, committed.signalId)?.leaseId, null);
    assert.equal(store.outboxDelivery(WORLD_ID, committed.signalId)?.attemptCount, 2);
  });
});

test("R14-03: events arriving during handoff stay in the deferred window and fold into the next signal", async () => {
  await withStore(async (store) => {
    const first = commitEligible(store, 1, 10);
    let release!: (outcome: ReentryTransportOutcome) => void;
    const envelopes: ReentrySignalEnvelope[] = [];
    const transport = {
      deliver(envelope: ReentrySignalEnvelope): Promise<ReentryTransportOutcome> {
        envelopes.push(envelope);
        if (envelopes.length > 1) {
          return Promise.resolve({ kind: "accepted" });
        }
        return new Promise((resolve) => {
          release = resolve;
        });
      },
    };
    const port = new ReentryDeliveryPort({ store, transport, leaseDurationMs: 30_000 });
    const pending = port.pumpOnce({ worldId: WORLD_ID, nowWallTimeMs: 1_000, leaseId: "lease-1" });
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    const deferred = commitEligible(store, 2, 20);
    const inFlight = store.signalSlot(WORLD_ID, SHELTER_ID, BINDING);
    assert.ok(inFlight);
    assert.equal(inFlight.signalId, first.signalId);
    assert.equal(inFlight.status, "in_flight");
    assert.equal(inFlight.deferredEligibleEventCount, 1);
    assert.equal(inFlight.deferredCursorStart, deferred.cursor);
    assert.equal(inFlight.deferredCursorEnd, deferred.cursor);

    release({ kind: "accepted" });
    const firstResult = await pending;
    assert.equal(firstResult.kind, "accepted");
    assert.equal(envelopes.length, 1);

    const next = commitEligible(store, 3, 80);
    assert.notEqual(next.signalId, first.signalId);
    const secondResult = await port.pumpOnce({ worldId: WORLD_ID, nowWallTimeMs: 2_000, leaseId: "lease-2" });
    assert.equal(secondResult.kind, "accepted");
    assert.equal(envelopes.length, 2);
    assert.equal(envelopes[1]?.eligibleEventCount, 2, "deferred and post-cooldown events share the next envelope");
    assert.equal(envelopes[1]?.cursorStart, deferred.cursor);
    assert.equal(envelopes[1]?.cursorEnd, next.cursor);
    assert.equal(store.events(WORLD_ID).filter((event) => event.eventType === "ContinuationDelivered").length, 2);
  });
});

test("R14-05/R14-08: transport exceptions retry explicitly and malformed outcomes fail closed", async () => {
  await withStore(async (store) => {
    const committed = commitEligible(store, 1, 10);
    const transport = {
      async deliver(): Promise<ReentryTransportOutcome> {
        throw new Error("receiver unavailable");
      },
    };
    const port = new ReentryDeliveryPort({ store, transport, leaseDurationMs: 30_000 });
    const result = await port.pumpOnce({ worldId: WORLD_ID, nowWallTimeMs: 1_000, leaseId: "lease-1" });
    assert.equal(result.kind, "retryable");
    assert.equal(result.outcome, "TRANSPORT_EXCEPTION");
    assert.equal(store.outboxDelivery(WORLD_ID, committed.signalId)?.status, "pending");
    assert.equal(store.events(WORLD_ID).filter((event) => event.eventType === "ContinuationDelivered").length, 0);
  });

  await withStore(async (store) => {
    const committed = commitEligible(store, 1, 10);
    const transport = {
      async deliver(): Promise<ReentryTransportOutcome> {
        return { kind: "unknown" } as never;
      },
    };
    const port = new ReentryDeliveryPort({ store, transport, leaseDurationMs: 30_000 });
    await assert.rejects(
      () => port.pumpOnce({ worldId: WORLD_ID, nowWallTimeMs: 1_000, leaseId: "lease-1" }),
      (error: unknown) => error instanceof PersistenceError && error.code === "INVALID_INPUT",
    );
    assert.equal(store.outboxDelivery(WORLD_ID, committed.signalId)?.status, "in_flight", "unknown transport state is not claimed as success");
    assert.equal(store.events(WORLD_ID).filter((event) => event.eventType === "ContinuationDelivered").length, 0);
  });
});

test("R14-08: a terminal transport outcome settles delivery without creating a gameplay effect", async () => {
  await withStore(async (store) => {
    const committed = commitEligible(store, 1, 10);
    const scripted = scriptedTransport([{ kind: "terminal", code: "CAPABILITY_UNAVAILABLE" }]);
    const port = new ReentryDeliveryPort({ store, transport: scripted.transport, leaseDurationMs: 30_000 });

    const result = await port.pumpOnce({ worldId: WORLD_ID, nowWallTimeMs: 1_000, leaseId: "lease-1" });

    assert.equal(result.kind, "terminally_rejected");
    assert.equal(result.signalId, committed.signalId);
    assert.equal(result.outcome, "CAPABILITY_UNAVAILABLE");
    assert.equal(store.outboxDelivery(WORLD_ID, committed.signalId)?.status, "terminally_rejected");
    assert.equal(store.events(WORLD_ID).filter((event) => event.eventType === "ContinuationDelivered").length, 0);
  });
});
