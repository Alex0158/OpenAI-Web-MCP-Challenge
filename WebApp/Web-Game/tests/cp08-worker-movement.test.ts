import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { PersistenceError, createPersistenceStore } from "../src/server/persistence/store";
import { WorldClock } from "../src/server/world-clock";
import { WorldWorkerModule } from "../src/server/world-worker";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import { PlayerMovementService } from "../src/server/world-projection";
import { PlayerMovementCadenceService } from "../src/server/player-movement-cadence";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp08-cadence-world";

interface Runtime {
  store: ReturnType<typeof createPersistenceStore>;
  worker: WorldWorkerModule;
  cadence: PlayerMovementCadenceService;
}

function seedDatabase(dbPath: string): void {
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  store.open();
  try {
    createAndPersistG2Fixture(store, {
      worldId: WORLD_ID,
      playerBindings: { "player-a": "binding-a", "player-b": "binding-b" },
    });
  } finally {
    store.close();
  }
}

async function openRuntime(dbPath: string): Promise<Runtime> {
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const movement = new PlayerMovementService({ store });
  const cadence = new PlayerMovementCadenceService({ store, movement });
  const clock = new WorldClock({
    worldId: WORLD_ID,
    persistence: store,
    reconciliationHandlers: [cadence.reconcile],
  });
  const worker = new WorldWorkerModule({ store, clock });
  await worker.start();
  return { store, worker, cadence };
}

async function closeRuntime(runtime: Runtime): Promise<void> {
  await runtime.worker.stop();
}

test("worker cadence commits the first tile on the third 100 ms step and retains the remainder", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp08-cadence-"));
  const dbPath = join(directory, "world.sqlite");
  seedDatabase(dbPath);
  const runtime = await openRuntime(dbPath);

  try {
    runtime.cadence.setIntent({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      direction: "right",
      expectedRevision: 0,
      idempotencyKey: "intent-right-1",
    });

    await runtime.worker.advance(100);
    assert.deepEqual(runtime.store.getPlayer(WORLD_ID, "player-a")?.position, { x: 16, y: 64 });
    await runtime.worker.advance(100);
    assert.deepEqual(runtime.store.getPlayer(WORLD_ID, "player-a")?.position, { x: 16, y: 64 });
    await runtime.worker.advance(100);
    assert.deepEqual(runtime.store.getPlayer(WORLD_ID, "player-a")?.position, { x: 17, y: 64 });
    await runtime.worker.advance(100);
    assert.deepEqual(runtime.store.getPlayer(WORLD_ID, "player-a")?.position, { x: 17, y: 64 });
    await runtime.worker.advance(100);
    assert.deepEqual(runtime.store.getPlayer(WORLD_ID, "player-a")?.position, { x: 18, y: 64 });
    assert.equal(runtime.store.events(WORLD_ID).filter((event) => event.eventType === "PlayerMoved").length, 2);
  } finally {
    await closeRuntime(runtime);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("multiple player intents reconcile in stable order and a large advance interleaves world boundaries", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp08-order-"));
  const dbPath = join(directory, "world.sqlite");
  seedDatabase(dbPath);
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const movement = new PlayerMovementService({ store });
  const cadence = new PlayerMovementCadenceService({ store, movement });
  const seenWorldTimes: number[] = [];
  const clock = new WorldClock({
    worldId: WORLD_ID,
    persistence: store,
    reconciliationHandlers: [(context) => {
      seenWorldTimes.push(context.worldTime);
      cadence.reconcile(context);
    }],
  });
  const worker = new WorldWorkerModule({ store, clock });

  try {
    await worker.start();
    cadence.setIntent({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      direction: "right",
      expectedRevision: 0,
      idempotencyKey: "intent-order-a",
    });
    cadence.setIntent({
      worldId: WORLD_ID,
      playerId: "player-b",
      binding: "binding-b",
      direction: "left",
      expectedRevision: 0,
      idempotencyKey: "intent-order-b",
    });

    await worker.advance(1200);
    assert.deepEqual(seenWorldTimes.slice(0, 10), Array.from({ length: 10 }, () => 0));
    assert.deepEqual(seenWorldTimes.slice(10), [1, 1]);
    assert.deepEqual(store.getPlayer(WORLD_ID, "player-a")?.position, { x: 20, y: 64 });
    assert.deepEqual(store.getPlayer(WORLD_ID, "player-b")?.position, { x: 108, y: 64 });
    const events = store.events(WORLD_ID).filter((event) => event.eventType === "PlayerMoved");
    assert.equal(events.length, 8);
    assert.deepEqual(events.map((event) => event.aggregateId), [
      "player-a", "player-b", "player-a", "player-b",
      "player-a", "player-b", "player-a", "player-b",
    ]);
    assert.ok(events.every((event) => event.worldTime === 0));
  } finally {
    await worker.stop();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("movement intents enforce ownership, stale revisions, replacement, stop, and duplicate replay", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp08-intent-"));
  const dbPath = join(directory, "world.sqlite");
  seedDatabase(dbPath);
  const runtime = await openRuntime(dbPath);

  try {
    assert.throws(
      () => runtime.cadence.setIntent({
        worldId: WORLD_ID,
        playerId: "player-a",
        binding: "binding-b",
        direction: "right",
        expectedRevision: 0,
        idempotencyKey: "intent-wrong-owner",
      }),
      (error: unknown) => error instanceof PersistenceError && error.code === "OWNERSHIP_DENIED",
    );

    const first = runtime.cadence.setIntent({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      direction: "right",
      expectedRevision: 0,
      idempotencyKey: "intent-retry-1",
    });
    assert.equal(first.effect, "intent_set");
    const duplicate = runtime.cadence.setIntent({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      direction: "right",
      expectedRevision: 0,
      idempotencyKey: "intent-retry-1",
    });
    assert.equal(duplicate.duplicate, true);
    assert.throws(
      () => runtime.cadence.setIntent({
        worldId: WORLD_ID,
        playerId: "player-a",
        binding: "binding-a",
        direction: "down",
        expectedRevision: 0,
        idempotencyKey: "intent-retry-1",
      }),
      (error: unknown) => error instanceof PersistenceError && error.code === "DUPLICATE_COMMAND",
    );

    await runtime.worker.advance(300);
    assert.deepEqual(runtime.store.getPlayer(WORLD_ID, "player-a")?.position, { x: 17, y: 64 });

    assert.throws(
      () => runtime.cadence.setIntent({
        worldId: WORLD_ID,
        playerId: "player-a",
        binding: "binding-a",
        direction: "down",
        expectedRevision: 0,
        idempotencyKey: "intent-stale-1",
      }),
      (error: unknown) => error instanceof PersistenceError && error.code === "STALE_REVISION",
    );
    assert.equal(runtime.cadence.hasActiveIntent(WORLD_ID, "player-a"), true);

    const replacement = runtime.cadence.setIntent({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      direction: "down",
      expectedRevision: 1,
      idempotencyKey: "intent-replace-1",
    });
    assert.equal(replacement.effect, "intent_set");
    await runtime.worker.advance(300);
    assert.deepEqual(runtime.store.getPlayer(WORLD_ID, "player-a")?.position, { x: 17, y: 65 });

    const stopped = runtime.cadence.stopIntent({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      expectedRevision: 2,
      idempotencyKey: "intent-stop-1",
    });
    assert.equal(stopped.effect, "intent_stopped");
    assert.equal(runtime.cadence.hasActiveIntent(WORLD_ID, "player-a"), false);

    runtime.cadence.setIntent({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      direction: "up",
      expectedRevision: 2,
      idempotencyKey: "intent-after-stop-1",
    });
    const duplicateStop = runtime.cadence.stopIntent({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      expectedRevision: 2,
      idempotencyKey: "intent-stop-1",
    });
    assert.equal(duplicateStop.duplicate, true);
    await runtime.worker.advance(300);
    assert.deepEqual(runtime.store.getPlayer(WORLD_ID, "player-a")?.position, { x: 17, y: 64 });
  } finally {
    await closeRuntime(runtime);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("movement stops visibly at a fixture boundary and does not cross outside the map", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp08-boundary-"));
  const dbPath = join(directory, "world.sqlite");
  seedDatabase(dbPath);
  const runtime = await openRuntime(dbPath);

  try {
    runtime.cadence.setIntent({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      direction: "left",
      expectedRevision: 0,
      idempotencyKey: "intent-boundary-1",
    });
    await runtime.worker.advance(5000);
    assert.deepEqual(runtime.store.getPlayer(WORLD_ID, "player-a")?.position, { x: 0, y: 64 });
    assert.equal(runtime.cadence.hasActiveIntent(WORLD_ID, "player-a"), false);
    assert.deepEqual(runtime.cadence.lastStepResult(WORLD_ID)?.failures, [{ playerId: "player-a", code: "MOVEMENT_BLOCKED" }]);
  } finally {
    await closeRuntime(runtime);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("replacement worker starts from the last durable tile and discards the prior fractional accumulator", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp08-restart-"));
  const dbPath = join(directory, "world.sqlite");
  seedDatabase(dbPath);
  const first = await openRuntime(dbPath);

  try {
    first.cadence.setIntent({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      direction: "right",
      expectedRevision: 0,
      idempotencyKey: "intent-restart-1",
    });
    await first.worker.advance(300);
    assert.deepEqual(first.store.getPlayer(WORLD_ID, "player-a")?.position, { x: 17, y: 64 });
  } finally {
    await closeRuntime(first);
  }

  const second = await openRuntime(dbPath);
  try {
    assert.deepEqual(second.store.getPlayer(WORLD_ID, "player-a")?.position, { x: 17, y: 64 });
    assert.equal(second.cadence.hasActiveIntent(WORLD_ID, "player-a"), false);
    second.cadence.setIntent({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      direction: "right",
      expectedRevision: 1,
      idempotencyKey: "intent-restart-2",
    });
    await second.worker.advance(200);
    assert.deepEqual(second.store.getPlayer(WORLD_ID, "player-a")?.position, { x: 17, y: 64 });
    await second.worker.advance(100);
    assert.deepEqual(second.store.getPlayer(WORLD_ID, "player-a")?.position, { x: 18, y: 64 });
    assert.equal(second.store.events(WORLD_ID).filter((event) => event.eventType === "PlayerMoved").length, 2);
  } finally {
    await closeRuntime(second);
    rmSync(directory, { recursive: true, force: true });
  }
});
