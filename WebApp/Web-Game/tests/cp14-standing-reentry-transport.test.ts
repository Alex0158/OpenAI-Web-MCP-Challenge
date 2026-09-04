import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { PersistenceError, createPersistenceStore } from "../src/server/persistence/store";
import {
  ReentryDeliveryPort,
  type ReentrySignalEnvelope,
  type ReentryTransportOutcome,
} from "../src/server/reentry-delivery-port";
import {
  createStandingReentryTransport,
  type StandingEventInput,
  type StandingPublicBinding,
} from "../src/server/standing-reentry-transport";
import type { SignalEligibilityInput } from "../src/server/persistence/types";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp14-standing-world";
const SHELTER_ID = "shelter-a";
const BINDING = "binding-a";
const GRANT_ID = "grant-standing-a";
const ORIGIN_MS = 1_700_000_000_000;

type Store = ReturnType<typeof createPersistenceStore>;

function withStore(run: (store: Store) => Promise<void>): Promise<void> {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp14-standing-"));
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
    mapFingerprint: "cp14-standing-fingerprint",
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

function eligibility(): SignalEligibilityInput {
  return {
    shelterId: SHELTER_ID,
    opaqueBinding: BINDING,
    grantId: GRANT_ID,
    boundedAction: "force_recall_soldier",
    severity: "warning",
    cooldownWorldSeconds: 60,
  };
}

function commitEligible(store: Store, sequence: number, worldTime: number): { signalId: string; eventId: string; cursor: number } {
  const shelter = store.getShelter(WORLD_ID, SHELTER_ID);
  assert.ok(shelter);
  const eventId = `cp14-standing-event-${sequence}`;
  const committed = store.commitTransition({
    worldId: WORLD_ID,
    worldTime,
    idempotency: {
      key: `cp14-standing-command-${sequence}`,
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
      eventId,
      eventType: "CargoLostToMonster",
      causationId: `cp14-standing-command-${sequence}`,
      aggregateType: "shelter",
      aggregateId: SHELTER_ID,
      visibilityScope: { kind: "shelter", shelterId: SHELTER_ID },
      typedPayload: { soldierId: "soldier-a-01", sequence },
    }],
    signalEligibility: eligibility(),
  });
  assert.ok(committed.signalId);
  assert.ok(committed.worldEventCursorStart !== null);
  return { signalId: committed.signalId, eventId, cursor: committed.worldEventCursorStart };
}

function standingBinding(): StandingPublicBinding {
  return {
    type: "webmcp.reentry_binding",
    protocol_version: "0.2",
    binding_id: "receiver-binding-a",
    correlation_id: "receiver-correlation-a",
    workflow_id: "shelter-workflow-a",
    event_type: "CargoLostToMonster",
    expires_at: "2099-01-01T00:00:00.000Z",
    authorization_mode: "standing",
    max_active_activations: 1,
    last_event_sequence: 0,
    status: "active",
  };
}

function accepted(event: StandingEventInput): object {
  return {
    type: "webmcp.continuation_acceptance",
    protocol_version: "0.2",
    event_id: event.eventId,
    correlation_id: event.binding.correlation_id,
    accepted: true,
    duplicate: false,
    status: "accepted",
  };
}

function createAdapter(store: Store, publisher: { inputs: StandingEventInput[]; outcomes: Array<object | Error>; }): ReturnType<typeof createStandingReentryTransport> {
  return createStandingReentryTransport({
    store,
    now: () => ORIGIN_MS,
    worldTimeOriginMs: ORIGIN_MS,
    bindingResolver: {
      resolve(input) {
        assert.deepEqual(input, {
          worldId: WORLD_ID,
          shelterId: SHELTER_ID,
          opaqueBinding: BINDING,
          grantId: GRANT_ID,
        });
        return {
          grantId: GRANT_ID,
          binding: standingBinding(),
          issuerOrigin: "https://game.example",
          canonicalUrl: "https://game.example/shelters/shelter-a",
        };
      },
    },
    eventPublisher: {
      async sendEvent(input) {
        publisher.inputs.push(input);
        const outcome = publisher.outcomes.shift();
        if (outcome instanceof Error) throw outcome;
        if (!outcome) throw new Error("publisher script exhausted");
        return outcome;
      },
    },
  });
}

test("standing transport maps two ordered Game signals through one standing binding", async () => {
  await withStore(async (store) => {
    const first = commitEligible(store, 1, 10);
    const publisher: { inputs: StandingEventInput[]; outcomes: Array<object | Error> } = { inputs: [], outcomes: [] };
    const adapter = createAdapter(store, publisher);
    const port = new ReentryDeliveryPort({ store, transport: adapter, leaseDurationMs: 30_000 });
    publisher.outcomes.push(accepted({
      binding: standingBinding(),
      workflow: { id: "shelter-workflow-a", stateVersion: first.cursor, canonicalUrl: "https://game.example/shelters/shelter-a" },
      eventId: first.signalId,
      eventSequence: 1,
      occurredAt: new Date(ORIGIN_MS + 10_000).toISOString(),
    }));

    const firstResult = await port.pumpOnce({ worldId: WORLD_ID, nowWallTimeMs: 1_000, leaseId: "game-lease-1" });
    assert.equal(firstResult.kind, "accepted");
    assert.equal(publisher.inputs[0]?.eventId, first.signalId);
    assert.equal(publisher.inputs[0]?.eventSequence, 1);
    assert.equal(publisher.inputs[0]?.workflow.stateVersion, first.cursor);
    assert.equal(publisher.inputs[0]?.occurredAt, new Date(ORIGIN_MS + 10_000).toISOString());
    assert.deepEqual(Object.keys(publisher.inputs[0] ?? {}).sort(), ["binding", "eventId", "eventSequence", "occurredAt", "workflow"]);
    assert.equal("grantId" in (publisher.inputs[0] ?? {}), false);
    assert.equal("connectorToken" in (publisher.inputs[0] ?? {}), false);
    assert.deepEqual(store.events(WORLD_ID).find((event) => event.eventType === "ContinuationDelivered")?.typedPayload, {
      signalId: first.signalId,
      cursorStart: first.cursor,
      cursorEnd: first.cursor,
      deliveryBoundary: "receiver_queue_accepted",
    });

    const second = commitEligible(store, 2, 80);
    publisher.outcomes.push(accepted({
      binding: standingBinding(),
      workflow: { id: "shelter-workflow-a", stateVersion: second.cursor, canonicalUrl: "https://game.example/shelters/shelter-a" },
      eventId: second.signalId,
      eventSequence: 2,
      occurredAt: new Date(ORIGIN_MS + 80_000).toISOString(),
    }));
    const secondResult = await port.pumpOnce({ worldId: WORLD_ID, nowWallTimeMs: 2_000, leaseId: "game-lease-2" });
    assert.equal(secondResult.kind, "accepted");
    assert.deepEqual(publisher.inputs.map((input) => ({ id: input.eventId, sequence: input.eventSequence })), [
      { id: first.signalId, sequence: 1 },
      { id: second.signalId, sequence: 2 },
    ]);
    assert.deepEqual(store.reentryEventContext(WORLD_ID, first.signalId), {
      worldId: WORLD_ID,
      signalId: first.signalId,
      opaqueBinding: BINDING,
      eventSequence: 1,
      occurredAt: new Date(ORIGIN_MS + 10_000).toISOString(),
      stateVersion: first.cursor,
    });
    store.close();
    store.open();
    assert.equal(store.reentryEventContext(WORLD_ID, second.signalId)?.eventSequence, 2);
    assert.equal(store.metadata().schemaVersion, 9);
  });
});

test("standing transport keeps the same sequence after an ambiguous publisher response", async () => {
  await withStore(async (store) => {
    const committed = commitEligible(store, 1, 10);
    const publisher: { inputs: StandingEventInput[]; outcomes: Array<object | Error> } = {
      inputs: [],
      outcomes: [Object.assign(new Error("timeout"), { code: "host_sdk_request_timeout", statusCode: 0 })],
    };
    const adapter = createAdapter(store, publisher);
    const port = new ReentryDeliveryPort({ store, transport: adapter, leaseDurationMs: 30_000 });
    const first = await port.pumpOnce({ worldId: WORLD_ID, nowWallTimeMs: 1_000, leaseId: "game-lease-1" });
    assert.deepEqual(first, {
      kind: "retryable",
      signalId: committed.signalId,
      envelope: first.kind === "retryable" ? first.envelope : undefined,
      outcome: "RECEIVER_OUTCOME_UNKNOWN",
      delivery: first.kind === "retryable" ? first.delivery : undefined,
    });
    const context = store.reentryEventContext(WORLD_ID, committed.signalId);
    assert.equal(context?.eventSequence, 1);
    publisher.outcomes.push(accepted({
      binding: standingBinding(),
      workflow: { id: "shelter-workflow-a", stateVersion: committed.cursor, canonicalUrl: "https://game.example/shelters/shelter-a" },
      eventId: committed.signalId,
      eventSequence: 1,
      occurredAt: new Date(ORIGIN_MS + 10_000).toISOString(),
    }));
    const second = await port.pumpOnce({ worldId: WORLD_ID, nowWallTimeMs: 2_000, leaseId: "game-lease-2" });
    assert.equal(second.kind, "accepted");
    assert.deepEqual(publisher.inputs.map((input) => input.eventSequence), [1, 1]);
  });
});

test("standing transport does not consume a sequence when the server mapping is absent", async () => {
  await withStore(async (store) => {
    const committed = commitEligible(store, 1, 10);
    const envelope: ReentrySignalEnvelope = {
      contractVersion: CONTRACT_VERSION,
      worldId: WORLD_ID,
      shelterId: SHELTER_ID,
      opaqueBinding: BINDING,
      signalId: committed.signalId,
      grantId: GRANT_ID,
      boundedAction: "force_recall_soldier",
      cursorStart: committed.cursor,
      cursorEnd: committed.cursor,
      eligibleEventCount: 1,
      eventTypes: ["CargoLostToMonster"],
      severity: "warning",
      latestEventId: committed.eventId,
      latestEventType: "CargoLostToMonster",
      latestWorldTime: 10,
    };
    const adapter = createStandingReentryTransport({
      store,
      worldTimeOriginMs: ORIGIN_MS,
      bindingResolver: { resolve: () => null },
      eventPublisher: { sendEvent: async () => ({}) },
    });
    assert.deepEqual(await adapter.deliver(envelope), { kind: "terminal", code: "REENTRY_BINDING_UNAVAILABLE" });
    assert.equal(store.reentryEventContext(WORLD_ID, committed.signalId), null);
  });
});

test("malformed Receiver acceptance fails closed and leaves the Game lease recoverable", async () => {
  await withStore(async (store) => {
    const committed = commitEligible(store, 1, 10);
    const publisher: { inputs: StandingEventInput[]; outcomes: Array<object | Error> } = { inputs: [], outcomes: [{}] };
    const adapter = createAdapter(store, publisher);
    const port = new ReentryDeliveryPort({ store, transport: adapter, leaseDurationMs: 30_000 });
    await assert.rejects(
      () => port.pumpOnce({ worldId: WORLD_ID, nowWallTimeMs: 1_000, leaseId: "game-lease-1" }),
      (error: unknown) => error instanceof PersistenceError && error.code === "INVALID_INPUT",
    );
    assert.equal(store.outboxDelivery(WORLD_ID, committed.signalId)?.status, "in_flight");
    assert.equal(store.reentryEventContext(WORLD_ID, committed.signalId)?.eventSequence, 1);
  });
});

test("schema 8 migrates the external event context tables atomically", () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp14-migration-"));
  const dbPath = join(directory, "world.sqlite");
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  try {
    store.open();
    store.createWorld({ worldId: WORLD_ID, worldTime: 0 });
    store.close();
    const database = new DatabaseSync(dbPath);
    database.exec("DROP TABLE reentry_event_context; DROP TABLE reentry_binding_sequence;");
    database.prepare("UPDATE schema_meta SET schema_version = 8, migration_id = 'cp06-004' WHERE schema_meta_id = 'singleton'").run();
    database.close();

    store.open();
    assert.equal(store.metadata().schemaVersion, 9);
    assert.equal(store.metadata().migrationId, "cp14-001");
    const migrated = new DatabaseSync(dbPath);
    const tables = new Set((migrated.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as Array<{ name?: unknown }>).map((row) => row.name));
    assert.equal(tables.has("reentry_binding_sequence"), true);
    assert.equal(tables.has("reentry_event_context"), true);
    migrated.close();
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
