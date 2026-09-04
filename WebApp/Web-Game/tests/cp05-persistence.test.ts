import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createServer, type Server } from "node:http";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { createEntrypoint } from "../src/server/entrypoint";
import { loadRuntimeConfig } from "../src/server/config";
import { JsonLogger } from "../src/server/logging";
import { createPersistenceStore, PersistenceError } from "../src/server/persistence/store";
import type { CommitTransitionInput, DomainEventInput, SignalEligibilityInput } from "../src/server/persistence/types";
import { WorldWorkerModule, type WorldWorker } from "../src/server/world-worker";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;

function withStore<T>(run: (store: ReturnType<typeof createPersistenceStore>, dbPath: string) => T): T {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp05-"));
  const dbPath = join(directory, "world.sqlite");
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  try {
    store.open();
    return run(store, dbPath);
  } finally {
    try {
      store.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }
}

function seedWorld(store: ReturnType<typeof createPersistenceStore>, worldId = "world-a") {
  store.createWorld({
    worldId,
    worldTime: 0,
    worldSeed: "sleepless-mvp-01",
    generationVersion: "g2-fixture-1",
    mapFingerprint: "map-fingerprint-a",
  });
  store.createPlayer({ worldId, playerId: "player-a", binding: "player-binding-a" });
  store.createShelter({ worldId, shelterId: "shelter-a", playerId: "player-a", revision: 0 });
}

function transitionInput(overrides: Partial<CommitTransitionInput> = {}): CommitTransitionInput {
  return {
    worldId: "world-a",
    worldTime: 1,
    idempotency: {
      key: "command-1",
      binding: "player-binding-a",
      request: { kind: "synthetic_shelter_update", value: 7 },
    },
    stateMutations: [
      {
        entityType: "shelter" as const,
        entityId: "shelter-a",
        expectedRevision: 0,
        patch: { coins: 7 },
      },
    ],
    events: [
      {
        eventId: "event-1",
        eventType: "SyntheticTransition",
        causationId: "command-1",
        aggregateType: "shelter",
        aggregateId: "shelter-a",
        visibilityScope: { kind: "shelter" as const, shelterId: "shelter-a" },
        typedPayload: { value: 7 },
      },
    ],
    ...overrides,
  };
}

function seedTwoShelters(store: ReturnType<typeof createPersistenceStore>): void {
  seedWorld(store);
  store.createPlayer({ worldId: "world-a", playerId: "player-b", binding: "player-binding-b" });
  store.createShelter({ worldId: "world-a", shelterId: "shelter-b", playerId: "player-b", revision: 0 });
}

function eventInput(
  eventId: string,
  eventType = "CargoLostToMonster",
  shelterId: string = "shelter-a",
): DomainEventInput {
  return {
    eventId,
    eventType,
    causationId: `cause-${eventId}`,
    aggregateType: "shelter",
    aggregateId: shelterId,
    visibilityScope: { kind: "shelter", shelterId },
    typedPayload: { eventId, eventType, shelterId },
  };
}

function signalEligibility(
  shelterId = "shelter-a",
  opaqueBinding = "player-binding-a",
  overrides: Partial<SignalEligibilityInput> = {},
): SignalEligibilityInput {
  return {
    shelterId,
    opaqueBinding,
    grantId: "grant-cp05",
    boundedAction: "review_loss",
    severity: "warning",
    cooldownWorldSeconds: 60,
    ...overrides,
  };
}

function commitEvent(
  store: ReturnType<typeof createPersistenceStore>,
  key: string,
  worldTime: number,
  event: DomainEventInput,
  eligibility?: SignalEligibilityInput,
) {
  return store.commitTransition({
    worldId: "world-a",
    worldTime,
    idempotency: { key, binding: "player-binding-a", request: { key, worldTime, event: event.eventId } },
    stateMutations: [],
    events: [event],
    signalEligibility: eligibility,
  });
}

test("file-backed store bootstraps WAL, foreign keys, versions, and generation metadata", () => {
  withStore((store) => {
    const metadata = store.metadata();
    assert.equal(metadata.schemaVersion, 9);
    assert.equal(metadata.contractVersion, CONTRACT_VERSION);
    assert.equal(metadata.supportedEventVersion, 1);
    assert.equal(metadata.supportedSnapshotVersion, 1);
    assert.equal(metadata.migrationId, "cp14-001");
    assert.equal(store.pragmas().journalMode, "wal");
    assert.equal(store.pragmas().foreignKeys, 1);

    seedWorld(store);
    assert.deepEqual(store.getWorld("world-a"), {
      worldId: "world-a",
      worldTime: 0,
      inProgressWorldTime: null,
      serverTimeAnchorMs: null,
      worldEventCursor: 0,
      worldSeed: "sleepless-mvp-01",
      generationVersion: "g2-fixture-1",
      mapFingerprint: "map-fingerprint-a",
      revision: 0,
    });
  });
});

test("newer schema versions refuse recovery visibly", () => {
  withStore((store, dbPath) => {
    store.close();
    const database = new DatabaseSync(dbPath);
    database.prepare("UPDATE schema_meta SET schema_version = ? WHERE schema_meta_id = ?").run(999, "singleton");
    database.close();

    const reopened = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
    assert.throws(() => reopened.open(), (error: unknown) => error instanceof PersistenceError && error.code === "SCHEMA_INCOMPATIBLE");
    reopened.close();
  });
});

test("one transaction commits state, idempotency, ordered event, and revisions exactly once", () => {
  withStore((store) => {
    seedWorld(store);
    const first = store.commitTransition(transitionInput());
    assert.deepEqual(first.eventIds, ["event-1"]);
    assert.equal(first.worldEventCursorStart, 1);
    assert.equal(first.worldEventCursorEnd, 1);
    assert.deepEqual(store.getShelter("world-a", "shelter-a"), {
      worldId: "world-a",
      shelterId: "shelter-a",
      playerId: "player-a",
      revision: 1,
      coins: 7,
    });
    assert.equal(store.events("world-a").length, 1);

    const duplicate = store.commitTransition(transitionInput());
    assert.equal(duplicate.duplicate, true);
    assert.equal(store.events("world-a").length, 1);
    assert.equal(store.getWorld("world-a")?.worldEventCursor, 1);

    assert.throws(
      () => store.commitTransition(transitionInput({ idempotency: { key: "command-1", binding: "other-binding", request: { kind: "different" } } })),
      (error: unknown) => error instanceof PersistenceError && error.code === "DUPLICATE_COMMAND",
    );
  });
});

test("rollback leaves state, cursor, event, and idempotency rows unchanged", () => {
  withStore((store) => {
    seedWorld(store);
    assert.throws(
      () => store.commitTransition(transitionInput({ injectFailureAt: "after_events" })),
      (error: unknown) => error instanceof PersistenceError && error.code === "INJECTED_FAILURE",
    );
    assert.equal(store.getShelter("world-a", "shelter-a")?.revision, 0);
    assert.equal(store.getWorld("world-a")?.worldEventCursor, 0);
    assert.equal(store.events("world-a").length, 0);
    assert.equal(store.idempotency("world-a", "command-1"), null);
  });
});

test("rollback after Signal aggregation removes the coalescing slot and outbox atomically", () => {
  withStore((store) => {
    seedWorld(store);
    assert.throws(
      () => store.commitTransition(transitionInput({
        events: [eventInput("rollback-loss")],
        signalEligibility: signalEligibility(),
        injectFailureAt: "after_signal",
      })),
      (error: unknown) => error instanceof PersistenceError && error.code === "INJECTED_FAILURE",
    );
    assert.equal(store.getWorld("world-a")?.worldEventCursor, 0);
    assert.equal(store.events("world-a").length, 0);
    assert.equal(store.signalSlot("world-a", "shelter-a", "player-binding-a"), null);
  });
});

test("Signal summary keeps routine event types out of the eligible type list", () => {
  withStore((store) => {
    seedWorld(store);
    const result = store.commitTransition({
      worldId: "world-a",
      worldTime: 1,
      idempotency: { key: "mixed-signal-command", binding: "player-binding-a", request: { kind: "mixed-signal" } },
      stateMutations: [],
      events: [
        eventInput("mixed-routine", "MovementReconciled"),
        eventInput("mixed-loss", "CargoLostToMonster"),
      ],
      signalEligibility: signalEligibility(),
    });
    assert.ok(result.signalId);
    const slot = store.signalSlot("world-a", "shelter-a", "player-binding-a");
    assert.deepEqual(slot?.eventTypes, ["CargoLostToMonster"]);
    assert.equal(slot?.eligibleEventCount, 1);
    assert.equal(slot?.cursorStart, 1);
    assert.equal(slot?.cursorEnd, 2);
  });
});

test("event revision declarations cannot override the committed mutation revision", () => {
  withStore((store) => {
    seedWorld(store);
    assert.throws(
      () => store.commitTransition(transitionInput({
        events: [{ ...eventInput("revision-conflict"), affectedEntityRevisions: { "shelter:shelter-a": 99 } }],
      })),
      (error: unknown) => error instanceof PersistenceError && error.code === "EVENT_CONFLICT",
    );
    assert.equal(store.getShelter("world-a", "shelter-a")?.revision, 0);
    assert.equal(store.getWorld("world-a")?.worldEventCursor, 0);
    assert.equal(store.events("world-a").length, 0);
  });
});

test("failed first bootstrap rolls back schema metadata and leaves no partial authority", () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp05-bootstrap-rollback-"));
  const dbPath = join(directory, "world.sqlite");
  const database = new DatabaseSync(dbPath);
  database.exec("CREATE TABLE world (world_id TEXT PRIMARY KEY)");
  database.close();
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  try {
    assert.throws(() => store.open(), (error: unknown) => error instanceof PersistenceError && error.code === "SCHEMA_INCOMPATIBLE");
    const reopened = new DatabaseSync(dbPath);
    const tables = reopened.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as Array<{ name: string }>;
    assert.deepEqual(tables.map((row) => row.name), ["world"]);
    reopened.close();
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("world time cannot regress and snapshot recovery rejects an event cursor gap", () => {
  withStore((store, dbPath) => {
    seedWorld(store);
    store.commitTransition(transitionInput());
    store.saveSnapshot({
      worldId: "world-a",
      worldSnapshotId: "snapshot-1",
      snapshotVersion: 1,
      contractVersion: CONTRACT_VERSION,
      worldTime: 1,
      lastWorldEventCursor: 1,
      entityRevisions: { "shelter:shelter-a": 1 },
      state: { shelterCoins: 7 },
    });
    assert.equal(store.recoverWorld("world-a").snapshot?.worldSnapshotId, "snapshot-1");
    assert.throws(
      () => store.commitTransition(transitionInput({ worldTime: 0, idempotency: { key: "command-2", binding: "player-binding-a", request: { kind: "regress" } } })),
      (error: unknown) => error instanceof PersistenceError && error.code === "WORLD_TIME_REGRESSION",
    );

    store.close();
    const database = new DatabaseSync(dbPath);
    database.prepare("DELETE FROM domain_event WHERE world_event_cursor = ?").run(1);
    database.close();
    const reopened = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
    reopened.open();
    assert.throws(() => reopened.recoverWorld("world-a"), (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED");
    reopened.close();
  });
});

test("a new empty world is recoverable without inventing a snapshot state", () => {
  withStore((store) => {
    seedWorld(store);
    const recovered = store.recoverWorld("world-a");
    assert.equal(recovered.snapshot, null);
    assert.deepEqual(recovered.events, []);
    assert.equal(recovered.world.worldEventCursor, 0);
  });
});

test("worker owns the file-backed store lifecycle and late access fails after stop", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp05-worker-"));
  const dbPath = join(directory, "world.sqlite");
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const worker = new WorldWorkerModule({ store });
  try {
    await worker.start();
    assert.equal(worker.state, "ready");
    assert.equal(store.isOpen, true);
    assert.equal(store.metadata().contractVersion, CONTRACT_VERSION);

    await worker.stop();
    assert.equal(worker.state, "stopped");
    assert.equal(store.isOpen, false);
    assert.throws(() => store.metadata(), (error: unknown) => error instanceof PersistenceError && error.code === "STORE_NOT_OPEN");

    await worker.stop();
    assert.equal(store.isOpen, false);
  } finally {
    try {
      store.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }
});

test("entrypoint waits for persistence readiness and closes the listener before a rejected worker stop", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp05-entrypoint-"));
  const dbPath = join(directory, "world.sqlite");
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const serverRef: { current: Server | null } = { current: null };
  let stopObservedListener: boolean | null = null;
  const logs: string[] = [];

  class ClosingWorker implements WorldWorker {
    readonly instanceId = "worker-cp05-close-reject";
    state: "created" | "starting" | "ready" | "stopped" = "created";
    private readonly listeners = new Set<(code: "WORKER_FAULT") => void>();

    onFault(listener: (code: "WORKER_FAULT") => void): void {
      this.listeners.add(listener);
    }

    async start(): Promise<void> {
      store.open();
      this.state = "ready";
    }

    async stop(): Promise<void> {
      stopObservedListener = serverRef.current?.listening ?? null;
      try {
        store.close();
      } finally {
        this.state = "stopped";
      }
      throw new PersistenceError("STORE_CLOSE_FAILED");
    }
  }

  const nextApp = {
    async prepare() {},
    getRequestHandler() {
      return () => {};
    },
  } as never;
  const entrypoint = createEntrypoint({
    config: { ...loadRuntimeConfig({ PORT: "0", NODE_ENV: "test" }), shutdownTimeoutMs: 100 },
    createWorker: () => new ClosingWorker(),
    createNextApp: () => nextApp,
    createHttpServer: (handler) => {
      const created = createServer(handler);
      serverRef.current = created;
      return created;
    },
    logger: new JsonLogger({
      level: "debug",
      processInstanceId: "process-cp05-close-reject",
      workerInstanceId: "worker-cp05-close-reject",
      write: (line) => logs.push(line),
    }),
  });

  try {
    const started = await entrypoint.start();
    assert.equal(started.status, "ready");
    assert.equal(store.isOpen, true);

    const result = await entrypoint.shutdown("test");
    assert.equal(result.timedOut, false);
    assert.equal(result.errorCode, "STORE_CLOSE_FAILED");
    assert.equal(stopObservedListener, false);
    assert.equal(serverRef.current?.listening, false);
    assert.equal(logs.some((line) => line.includes('"event":"worker_stop_failed"') && line.includes('STORE_CLOSE_FAILED')), true);
  } finally {
    try {
      store.close();
      if (serverRef.current?.listening) {
        serverRef.current.close();
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }
});

test("schema exposes every G2 table and world-scoped ownership constraints", () => {
  withStore((store, dbPath) => {
    const database = new DatabaseSync(dbPath);
    const tableRows = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as Array<{ name: string }>;
    const tableNames = tableRows.map((row) => row.name);
    for (const table of [
      "world",
      "player",
      "shelter",
      "soldier",
      "mission",
      "mission_attempt",
      "cargo",
      "resource_node",
      "monster",
      "encounter",
      "world_snapshot",
      "domain_event",
      "idempotency_record",
      "agent_signal_slot",
      "outbox_delivery",
      "schema_meta",
    ]) {
      assert.equal(tableNames.includes(table), true, `missing table ${table}`);
    }
    for (const table of ["soldier", "mission", "mission_attempt", "resource_node", "monster", "encounter"]) {
      const columns = new Set((database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>).map((row) => row.name));
      for (const column of ["work_id", "next_due_world_time", "claim_id", "claim_attempt", "lease_expires_at_wall_ms"]) {
        assert.equal(columns.has(column), true, `missing ${table}.${column}`);
      }
    }
    const shelterForeignKeys = database.prepare("PRAGMA foreign_key_list(shelter)").all() as Array<{ table: string; from: string; to: string }>;
    assert.equal(shelterForeignKeys.some((key) => key.table === "player" && key.from === "player_id" && key.to === "player_id"), true);
    database.close();

    seedTwoShelters(store);
    assert.equal(store.getShelter("world-b", "shelter-a"), null);
    assert.throws(
      () => store.createShelter({ worldId: "world-a", shelterId: "shelter-cross", playerId: "player-missing" }),
      (error: unknown) => error instanceof PersistenceError && error.code === "STORE_OPEN_FAILED",
    );
  });
});

test("an existing metadata row with a missing required table or column refuses to open", () => {
  withStore((store, dbPath) => {
    store.close();
    const database = new DatabaseSync(dbPath);
    database.exec("DROP TABLE encounter");
    database.close();
    const reopened = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
    assert.throws(() => reopened.open(), (error: unknown) => error instanceof PersistenceError && error.code === "SCHEMA_INCOMPATIBLE");
    reopened.close();
  });
});

test("multi-entity transitions preserve ordered cursors and every affected revision", () => {
  withStore((store) => {
    seedWorld(store);
    const result = store.commitTransition({
      worldId: "world-a",
      worldTime: 1,
      idempotency: { key: "multi-entity", binding: "player-binding-a", request: { kind: "multi" } },
      stateMutations: [
        { entityType: "shelter", entityId: "shelter-a", expectedRevision: 0, patch: { coins: 7 } },
        { entityType: "world", entityId: "world-a", expectedRevision: 0, patch: { map_fingerprint: "map-fingerprint-b" } },
      ],
      events: [
        eventInput("multi-shelter", "CoinsCredited"),
        eventInput("multi-world", "WorldProjectionChanged"),
      ],
    });
    assert.deepEqual(result.entityRevisions, { "shelter:shelter-a": 1, "world:world-a": 1 });
    assert.deepEqual(result.eventIds, ["multi-shelter", "multi-world"]);
    assert.deepEqual(store.events("world-a").map((event) => [event.eventId, event.worldEventCursor, event.aggregateRevision, event.affectedEntityRevisions]), [
      ["multi-shelter", 1, 1, { "shelter:shelter-a": 1, "world:world-a": 1 }],
      ["multi-world", 2, 1, { "shelter:shelter-a": 1, "world:world-a": 1 }],
    ]);
    assert.throws(
      () => store.commitTransition({
        worldId: "world-a",
        worldTime: 2,
        idempotency: { key: "conflicting-event", binding: "player-binding-a", request: { kind: "conflict" } },
        stateMutations: [],
        events: [eventInput("multi-shelter", "ConflictingEvent")],
      }),
      (error: unknown) => error instanceof PersistenceError && error.code === "EVENT_CONFLICT",
    );
    assert.equal(store.getWorld("world-a")?.worldEventCursor, 2);
  });
});

test("matching duplicate event identities are harmless while an incompatible event version is rejected", () => {
  withStore((store) => {
    seedWorld(store);
    const first = commitEvent(store, "event-owner-1", 1, { ...eventInput("shared-event", "CargoExtracted"), idempotencyKey: "event-owner-1" });
    const duplicate = commitEvent(store, "event-owner-2", 1, { ...eventInput("shared-event", "CargoExtracted"), idempotencyKey: "event-owner-1" });
    assert.deepEqual(duplicate.eventIds, first.eventIds);
    assert.equal(duplicate.worldEventCursorStart, 1);
    assert.equal(store.events("world-a").length, 1);
    assert.equal(store.getWorld("world-a")?.worldEventCursor, 1);
    const duplicateWithinCommand = store.commitTransition({
      worldId: "world-a",
      worldTime: 3,
      idempotency: { key: "duplicate-within-command", binding: "player-binding-a", request: { kind: "duplicate-within-command" } },
      stateMutations: [],
      events: [eventInput("same-command-event"), eventInput("same-command-event")],
    });
    assert.deepEqual(duplicateWithinCommand.eventIds, ["same-command-event"]);
    assert.equal(store.events("world-a").filter((event) => event.eventId === "same-command-event").length, 1);
    assert.throws(
      () => commitEvent(store, "versioned-event", 4, { ...eventInput("versioned-event"), eventVersion: 2 }),
      (error: unknown) => error instanceof PersistenceError && error.code === "SCHEMA_INCOMPATIBLE",
    );
    assert.equal(store.events("world-a").length, 2);
  });
});

test("rejected commands retain a typed idempotent outcome without mutating state", () => {
  withStore((store) => {
    seedWorld(store);
    commitEvent(store, "advance", 4, eventInput("advance-event"));
    const rejected = transitionInput({
      worldTime: 3,
      idempotency: { key: "regressed-command", binding: "player-binding-a", request: { kind: "regress" } },
      stateMutations: [],
      events: [eventInput("regressed-event")],
    });
    assert.throws(
      () => store.commitTransition(rejected),
      (error: unknown) => error instanceof PersistenceError && error.code === "WORLD_TIME_REGRESSION",
    );
    const record = store.idempotency("world-a", "regressed-command");
    assert.equal(record?.outcome, "rejected");
    assert.deepEqual(record?.eventIds, []);
    assert.throws(
      () => store.commitTransition(rejected),
      (error: unknown) => error instanceof PersistenceError && error.code === "WORLD_TIME_REGRESSION",
    );
    assert.equal(store.events("world-a").length, 1);
    assert.equal(store.getWorld("world-a")?.worldEventCursor, 1);
  });
});

test("Signal eligibility is history-only without a grant and filters another shelter", () => {
  withStore((store) => {
    seedTwoShelters(store);
    const routine = commitEvent(store, "routine", 1, eventInput("routine-event", "CargoExtracted"), signalEligibility());
    assert.equal(routine.signalId, null);
    assert.equal(store.signalSlot("world-a", "shelter-a", "player-binding-a"), null);

    const hidden = commitEvent(store, "hidden", 2, eventInput("hidden-event", "CargoLostToMonster", "shelter-b"), signalEligibility());
    assert.equal(hidden.signalId, null);
    assert.equal(store.signalSlot("world-a", "shelter-a", "player-binding-a"), null);
    assert.equal(store.events("world-a").length, 2);
  });
});

test("eligible CargoLostToMonster events coalesce one active slot and retain deferred context", () => {
  withStore((store) => {
    seedWorld(store);
    const first = commitEvent(store, "loss-1-command", 1, eventInput("loss-1"), signalEligibility());
    assert.ok(first.signalId);
    const second = commitEvent(store, "loss-2-command", 2, eventInput("loss-2"), signalEligibility());
    assert.equal(second.signalId, first.signalId);
    const pending = store.signalSlot("world-a", "shelter-a", "player-binding-a");
    assert.equal(pending?.status, "pending");
    assert.equal(pending?.eligibleEventCount, 2);
    assert.equal(pending?.cursorStart, 1);
    assert.equal(pending?.cursorEnd, 2);
    assert.equal(pending?.latestEventId, "loss-2");
    assert.equal(store.outboxDelivery("world-a", first.signalId)?.status, "pending");

    const claimed = store.claimDelivery({ worldId: "world-a", signalId: first.signalId, leaseId: "lease-1", nowWallTimeMs: 100, leaseDurationMs: 10 });
    assert.equal(claimed.status, "in_flight");
    const deferred = commitEvent(store, "loss-3-command", 3, eventInput("loss-3"), signalEligibility());
    assert.equal(deferred.signalId, first.signalId);
    const inflight = store.signalSlot("world-a", "shelter-a", "player-binding-a");
    assert.equal(inflight?.status, "in_flight");
    assert.equal(inflight?.deferredEligibleEventCount, 1);
    assert.equal(inflight?.deferredCursorStart, 3);
    assert.equal(inflight?.deferredCursorEnd, 3);
    assert.deepEqual(inflight?.deferredEventTypes, ["CargoLostToMonster"]);
  });
});

test("delivery leases reject stale attempts, retry preserves identity, and acknowledgement is exactly once", () => {
  withStore((store) => {
    seedWorld(store);
    const committed = commitEvent(store, "loss-command", 1, eventInput("loss-event"), signalEligibility());
    assert.ok(committed.signalId);
    const signalId = committed.signalId;
    store.claimDelivery({ worldId: "world-a", signalId, leaseId: "lease-old", nowWallTimeMs: 100, leaseDurationMs: 10 });
    assert.throws(
      () => store.acknowledgeDelivery({ worldId: "world-a", signalId, leaseId: "lease-old", nowWallTimeMs: 111 }),
      (error: unknown) => error instanceof PersistenceError && error.code === "LEASE_CONFLICT",
    );
    const retry = store.retryDelivery({ worldId: "world-a", signalId, leaseId: "lease-old", nowWallTimeMs: 111 }, "RETRYABLE_FAILURE");
    assert.equal(retry.status, "pending");
    const reclaimed = store.claimDelivery({ worldId: "world-a", signalId, leaseId: "lease-new", nowWallTimeMs: 112, leaseDurationMs: 10 });
    assert.equal(reclaimed.attemptCount, 2);
    assert.throws(
      () => store.acknowledgeDelivery({ worldId: "world-a", signalId, leaseId: "lease-old", nowWallTimeMs: 113 }),
      (error: unknown) => error instanceof PersistenceError && error.code === "LEASE_CONFLICT",
    );
    const acknowledged = store.acknowledgeDelivery({ worldId: "world-a", signalId, leaseId: "lease-new", nowWallTimeMs: 113 });
    assert.equal(acknowledged.status, "acknowledged");
    assert.equal(store.events("world-a").filter((event) => event.eventType === "ContinuationDelivered").length, 1);
    const duplicate = store.acknowledgeDelivery({ worldId: "world-a", signalId, leaseId: "lease-new", nowWallTimeMs: 114 });
    assert.equal(duplicate.duplicate, true);
    assert.equal(duplicate.eventId, acknowledged.eventId);
    assert.equal(store.events("world-a").filter((event) => event.eventType === "ContinuationDelivered").length, 1);
  });
});

test("terminal delivery rejection is idempotent and cooldown permits a new signal identity", () => {
  withStore((store) => {
    seedWorld(store);
    const first = commitEvent(store, "terminal-command", 1, eventInput("terminal-loss"), signalEligibility());
    assert.ok(first.signalId);
    store.claimDelivery({ worldId: "world-a", signalId: first.signalId, leaseId: "terminal-lease", nowWallTimeMs: 10, leaseDurationMs: 100 });
    const deferred = commitEvent(store, "terminal-deferred-command", 2, eventInput("terminal-deferred-loss"), signalEligibility());
    assert.equal(deferred.signalId, first.signalId);
    const terminal = store.terminalRejectDelivery({ worldId: "world-a", signalId: first.signalId, leaseId: "terminal-lease", nowWallTimeMs: 11 });
    assert.equal(terminal.status, "terminally_rejected");
    const duplicate = store.terminalRejectDelivery({ worldId: "world-a", signalId: first.signalId, leaseId: "terminal-lease", nowWallTimeMs: 12 });
    assert.equal(duplicate.duplicate, true);

    const duringCooldown = commitEvent(store, "cooldown-command", 3, eventInput("cooldown-loss"), signalEligibility());
    assert.equal(duringCooldown.signalId, null);
    const afterCooldown = commitEvent(store, "new-signal-command", 61, eventInput("new-loss"), signalEligibility());
    assert.ok(afterCooldown.signalId);
    assert.notEqual(afterCooldown.signalId, first.signalId);
    const nextSlot = store.signalSlot("world-a", "shelter-a", "player-binding-a");
    assert.equal(nextSlot?.eligibleEventCount, 2);
    assert.equal(nextSlot?.deferredEligibleEventCount, 0);
    assert.equal(nextSlot?.cursorStart, 2);
    assert.equal(nextSlot?.cursorEnd, 4);
    assert.equal(store.outboxDelivery("world-a", first.signalId)?.status, "terminally_rejected");
    assert.equal(store.outboxDelivery("world-a", afterCooldown.signalId)?.status, "pending");
  });
});

test("player-scoped Signals are visible only to the owning shelter and mismatched bindings are denied", () => {
  withStore((store) => {
    seedTwoShelters(store);
    const hidden = commitEvent(
      store,
      "player-hidden-command",
      1,
      {
        ...eventInput("player-hidden", "CargoLostToMonster", "shelter-a"),
        visibilityScope: { kind: "player", playerId: "player-b" },
      },
      signalEligibility(),
    );
    assert.equal(hidden.signalId, null);
    assert.equal(store.signalSlot("world-a", "shelter-a", "player-binding-a"), null);

    const visible = commitEvent(
      store,
      "player-visible-command",
      2,
      {
        ...eventInput("player-visible", "CargoLostToMonster", "shelter-a"),
        visibilityScope: { kind: "player", playerId: "player-a" },
      },
      signalEligibility(),
    );
    assert.ok(visible.signalId);

    assert.throws(
      () => commitEvent(store, "mismatched-binding-command", 3, eventInput("mismatched-binding", "CargoLostToMonster", "shelter-b"), signalEligibility("shelter-b", "player-binding-a")),
      (error: unknown) => error instanceof PersistenceError && error.code === "OWNERSHIP_DENIED",
    );
    assert.equal(store.events("world-a").length, 2);
    assert.equal(store.idempotency("world-a", "mismatched-binding-command")?.outcome, "rejected");
  });
});

test("snapshot replay returns only post-cutover events and rejects revision or schema-shape corruption", () => {
  withStore((store, dbPath) => {
    seedWorld(store);
    store.commitTransition(transitionInput());
    store.saveSnapshot({
      worldId: "world-a",
      worldSnapshotId: "snapshot-cutover",
      snapshotVersion: 1,
      contractVersion: CONTRACT_VERSION,
      worldTime: 1,
      lastWorldEventCursor: 1,
      entityRevisions: { "shelter:shelter-a": 1 },
      state: { shelterCoins: 7 },
    });
    store.commitTransition(transitionInput({
      worldTime: 2,
      idempotency: { key: "command-2", binding: "player-binding-a", request: { kind: "synthetic_shelter_update", value: 10 } },
      stateMutations: [{ entityType: "shelter", entityId: "shelter-a", expectedRevision: 1, patch: { coins: 10 } }],
      events: [{ ...eventInput("event-2", "CoinsCredited"), typedPayload: { value: 10 } }],
    }));
    const recovered = store.recoverWorld("world-a");
    assert.equal(recovered.snapshot?.worldSnapshotId, "snapshot-cutover");
    assert.deepEqual(recovered.events.map((event) => event.eventId), ["event-2"]);
    const replayedState = recovered.events.reduce((state, event) => {
      const payload = event.typedPayload as { value?: unknown };
      return typeof payload.value === "number" ? { shelterCoins: payload.value } : state;
    }, recovered.snapshot?.state as { shelterCoins: number });
    assert.deepEqual(replayedState, { shelterCoins: 10 });

    const reopenedHealthy = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
    reopenedHealthy.open();
    assert.deepEqual(reopenedHealthy.recoverWorld("world-a"), recovered);
    reopenedHealthy.close();

    store.close();
    const database = new DatabaseSync(dbPath);
    database.prepare("UPDATE world_snapshot SET entity_revisions_json = ? WHERE world_snapshot_id = ?").run('{"shelter:shelter-a":99}', "snapshot-cutover");
    database.close();
    const reopened = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
    reopened.open();
    assert.throws(() => reopened.recoverWorld("world-a"), (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED");
    reopened.close();

    const stateTampered = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
    stateTampered.open();
    stateTampered.close();
    const tamperStateDb = new DatabaseSync(dbPath);
    tamperStateDb.prepare("UPDATE world_snapshot SET entity_revisions_json = ?, state_json = ? WHERE world_snapshot_id = ?").run('{"shelter:shelter-a":1}', '{"shelterCoins":999}', "snapshot-cutover");
    tamperStateDb.close();
    const stateReopened = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
    stateReopened.open();
    assert.throws(() => stateReopened.recoverWorld("world-a"), (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED");
    stateReopened.close();
  });
});

test("a bounded SQLite busy result is retryable and leaves the transition completely untouched", () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp05-busy-"));
  const dbPath = join(directory, "world.sqlite");
  const first = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const second = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const blocker = new DatabaseSync(dbPath);
  try {
    first.open();
    seedWorld(first);
    second.open();
    blocker.exec("PRAGMA busy_timeout = 0; BEGIN IMMEDIATE;");
    assert.throws(
      () => second.commitTransition(transitionInput()),
      (error: unknown) => error instanceof PersistenceError && error.code === "BUSY_RETRYABLE" && error.retryable === true,
    );
    assert.equal(first.getWorld("world-a")?.worldEventCursor, 0);
    assert.equal(first.events("world-a").length, 0);
    assert.equal(first.idempotency("world-a", "command-1"), null);
  } finally {
    try {
      blocker.exec("ROLLBACK");
    } catch {
      // The lock may already have been released after a driver error.
    }
    blocker.close();
    second.close();
    first.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("worker startup surfaces a typed persistence failure and stop close rejection is idempotent", async () => {
  const failedOpenStore = {
    open() {
      throw new PersistenceError("SCHEMA_INCOMPATIBLE");
    },
    close() {},
  };
  const failedWorker = new WorldWorkerModule({ store: failedOpenStore });
  await assert.rejects(() => failedWorker.start(), (error: unknown) => error instanceof PersistenceError && error.code === "SCHEMA_INCOMPATIBLE");
  assert.equal(failedWorker.state, "stopped");

  const failedCloseStore = {
    open() {},
    close() {
      throw new PersistenceError("STORE_CLOSE_FAILED");
    },
  };
  const failedCloseWorker = new WorldWorkerModule({ store: failedCloseStore });
  await failedCloseWorker.start();
  await assert.rejects(() => failedCloseWorker.stop(), (error: unknown) => error instanceof PersistenceError && error.code === "STORE_CLOSE_FAILED");
  assert.equal(failedCloseWorker.state, "stopped");
  await failedCloseWorker.stop();
});

test("the default entrypoint opens its configured file-backed store before reporting ready", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp05-default-entrypoint-"));
  const dbPath = join(directory, "runtime", "world.sqlite");
  const nextApp = {
    async prepare() {},
    getRequestHandler() {
      return () => {};
    },
  } as never;
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({ PORT: "0", NODE_ENV: "test", GAME_DB_PATH: dbPath }),
    createNextApp: () => nextApp,
    logger: new JsonLogger({ level: "error", processInstanceId: "process-cp05-default", workerInstanceId: "worker-cp05-default", write: () => {} }),
  });
  try {
    const started = await entrypoint.start();
    assert.equal(started.status, "ready");
    assert.equal(existsSync(dbPath), true);
    await entrypoint.shutdown("test");
    const reopened = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
    reopened.open();
    assert.equal(reopened.metadata().contractVersion, CONTRACT_VERSION);
    reopened.close();
  } finally {
    await entrypoint.shutdown("test");
    rmSync(directory, { recursive: true, force: true });
  }
});
