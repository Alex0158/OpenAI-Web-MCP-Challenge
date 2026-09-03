import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { WorldClock, WORLD_CLOCK_PHASES, type WorldClockPersistence } from "../src/server/world-clock";
import { createPersistenceStore, PersistenceError } from "../src/server/persistence/store";
import { WorldWorkerModule } from "../src/server/world-worker";
import type { WorldRecord } from "../src/server/persistence/types";

class FakeClockPersistence implements WorldClockPersistence {
  private world: WorldRecord;
  advances = 0;

  constructor(worldTime = 1000) {
    this.world = {
      worldId: "world-clock-fixture-01",
      worldTime,
      inProgressWorldTime: null,
      serverTimeAnchorMs: null,
      worldEventCursor: 0,
      worldSeed: "sleepless-mvp-01",
      generationVersion: "g2-fixture-1",
      mapFingerprint: "clock-fixture",
      revision: 0,
    };
  }

  getWorld(worldId: string): WorldRecord | null {
    return worldId === this.world.worldId ? { ...this.world } : null;
  }

  advanceWorldTime(worldId: string, worldTime: number): WorldRecord {
    const current = this.getWorld(worldId);
    if (!current) {
      throw new PersistenceError("WORLD_NOT_FOUND");
    }
    if (!Number.isInteger(worldTime) || worldTime < 0) {
      throw new PersistenceError("INVALID_INPUT");
    }
    if (worldTime < current.worldTime) {
      throw new PersistenceError("WORLD_TIME_REGRESSION");
    }
    this.advances += 1;
    this.world = { ...current, worldTime };
    return { ...this.world };
  }
}

function phaseHandlers(order: string[]): Partial<Record<(typeof WORLD_CLOCK_PHASES)[number], (context: { worldTime: number }) => void>> {
  return Object.fromEntries(WORLD_CLOCK_PHASES.map((phase) => [phase, ({ worldTime }) => order.push(`${worldTime}:${phase}`)])) as Partial<Record<(typeof WORLD_CLOCK_PHASES)[number], (context: { worldTime: number }) => void>>;
}

test("100 ms reconciliation keeps authoritative time integer until the boundary", () => {
  const persistence = new FakeClockPersistence();
  const clock = new WorldClock({ worldId: persistence.getWorld("world-clock-fixture-01")!.worldId, persistence });
  clock.start();

  for (let index = 0; index < 9; index += 1) {
    clock.tick(100);
  }

  assert.deepEqual(clock.snapshot(), {
    state: "running",
    worldTime: 1000,
    interpolationElapsedMs: 900,
    interpolationAlpha: 0.9,
  });
  assert.equal(persistence.getWorld("world-clock-fixture-01")?.worldTime, 1000);

  clock.tick(100);
  assert.equal(clock.snapshot().worldTime, 1001);
  assert.equal(clock.snapshot().interpolationElapsedMs, 0);
  assert.equal(persistence.getWorld("world-clock-fixture-01")?.worldTime, 1001);
});

test("each integer boundary runs the accepted phases exactly once in order", () => {
  const persistence = new FakeClockPersistence();
  const order: string[] = [];
  const clock = new WorldClock({
    worldId: "world-clock-fixture-01",
    persistence,
    phaseHandlers: phaseHandlers(order),
  });
  clock.start();

  clock.tick(1000);
  clock.tick(0);

  assert.deepEqual(order, WORLD_CLOCK_PHASES.map((phase) => `1001:${phase}`));
  assert.equal(persistence.advances, 1);
  assert.equal(clock.snapshot().worldTime, 1001);
});

test("clock rejects invalid input and a duplicate target is a no-op", () => {
  const persistence = new FakeClockPersistence();
  const order: string[] = [];
  const clock = new WorldClock({
    worldId: "world-clock-fixture-01",
    persistence,
    phaseHandlers: phaseHandlers(order),
  });
  clock.start();

  assert.throws(() => clock.tick(-1), (error: unknown) => error instanceof PersistenceError && error.code === "INVALID_INPUT");
  assert.throws(() => clock.tick(Number.POSITIVE_INFINITY), (error: unknown) => error instanceof PersistenceError && error.code === "INVALID_INPUT");
  assert.throws(() => clock.recoverTo(1000.5), (error: unknown) => error instanceof PersistenceError && error.code === "INVALID_INPUT");

  assert.equal(clock.recoverTo(1001).processedBoundaries, 1);
  const orderAfterFirst = [...order];
  assert.equal(clock.recoverTo(1001).processedBoundaries, 0);
  assert.deepEqual(order, orderAfterFirst);
  assert.equal(persistence.advances, 1);
});

test("exactly 300 seconds is accepted, while 301 seconds is visibly bounded", () => {
  const acceptedPersistence = new FakeClockPersistence();
  const acceptedOrder: string[] = [];
  const acceptedClock = new WorldClock({
    worldId: "world-clock-fixture-01",
    persistence: acceptedPersistence,
    phaseHandlers: phaseHandlers(acceptedOrder),
  });
  acceptedClock.start();
  const accepted = acceptedClock.recoverTo(1300);

  assert.equal(accepted.worldTime, 1300);
  assert.equal(accepted.processedBoundaries, 300);
  assert.equal(acceptedOrder.length, 300 * WORLD_CLOCK_PHASES.length);
  assert.equal(acceptedPersistence.getWorld("world-clock-fixture-01")?.worldTime, 1300);

  const blockedPersistence = new FakeClockPersistence();
  const blockedOrder: string[] = [];
  const blockedClock = new WorldClock({
    worldId: "world-clock-fixture-01",
    persistence: blockedPersistence,
    phaseHandlers: phaseHandlers(blockedOrder),
  });
  blockedClock.start();

  assert.throws(
    () => blockedClock.recoverTo(1301),
    (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_LIMIT_EXCEEDED",
  );
  assert.equal(blockedClock.snapshot().state, "recovery_blocked");
  assert.equal(blockedClock.snapshot().worldTime, 1000);
  assert.equal(blockedOrder.length, 0);
  assert.equal(blockedPersistence.getWorld("world-clock-fixture-01")?.worldTime, 1000);
  assert.throws(
    () => blockedClock.tick(1000),
    (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED",
  );

  const firstChunk = blockedClock.recoverTo(1300);
  assert.equal(firstChunk.processedBoundaries, 300);
  assert.equal(blockedClock.snapshot().state, "running");
  assert.equal(blockedClock.recoverTo(1301).processedBoundaries, 1);
  assert.equal(blockedClock.snapshot().worldTime, 1301);
});

test("backward recovery is rejected without changing the running clock", () => {
  const persistence = new FakeClockPersistence();
  const clock = new WorldClock({ worldId: "world-clock-fixture-01", persistence });
  clock.start();
  clock.tick(1000);

  assert.throws(
    () => clock.recoverTo(1000),
    (error: unknown) => error instanceof PersistenceError && error.code === "WORLD_TIME_REGRESSION",
  );
  assert.equal(clock.snapshot().state, "running");
  assert.equal(clock.snapshot().worldTime, 1001);
});

test("a file-backed store survives clock close and restart recovery", () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp06-clock-"));
  const dbPath = join(directory, "world.sqlite");
  const worldId = "world-clock-fixture-01";
  const firstStore = createPersistenceStore({ dbPath, contractVersion: "SK-MVP-0.2" });

  try {
    firstStore.open();
    firstStore.createWorld({ worldId, worldTime: 1000, worldSeed: "sleepless-mvp-01", generationVersion: "g2-fixture-1", mapFingerprint: "clock-fixture" });
    const firstClock = new WorldClock({ worldId, persistence: firstStore });
    firstClock.start();
    firstClock.recoverTo(1005);
    assert.equal(firstStore.getWorld(worldId)?.worldTime, 1005);
    firstStore.close();

    const secondStore = createPersistenceStore({ dbPath, contractVersion: "SK-MVP-0.2" });
    secondStore.open();
    try {
      const secondClock = new WorldClock({ worldId, persistence: secondStore });
      secondClock.start();
      assert.equal(secondClock.snapshot().worldTime, 1005);
      secondClock.recoverTo(1006);
      assert.equal(secondStore.getWorld(worldId)?.worldTime, 1006);
      assert.throws(
        () => secondStore.advanceWorldTime(worldId, 1004),
        (error: unknown) => error instanceof PersistenceError && error.code === "WORLD_TIME_REGRESSION",
      );
    } finally {
      secondStore.close();
    }
  } finally {
    firstStore.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("worker owns clock lifecycle around the store lifecycle", async () => {
  const order: string[] = [];
  const store = {
    open: () => order.push("store.open"),
    close: () => order.push("store.close"),
  };
  const clock = {
    start: () => order.push("clock.start"),
    stop: () => order.push("clock.stop"),
  };
  const worker = new WorldWorkerModule({ store, clock });

  await worker.start();
  assert.equal(worker.state, "ready");
  await worker.stop();
  assert.equal(worker.state, "stopped");
  assert.deepEqual(order, ["store.open", "clock.start", "clock.stop", "store.close"]);
});

test("a real worker restart reloads the persisted clock boundary", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp06-worker-clock-"));
  const dbPath = join(directory, "world.sqlite");
  const worldId = "world-clock-worker-fixture-01";
  const store = createPersistenceStore({ dbPath, contractVersion: "SK-MVP-0.2" });

  try {
    store.open();
    store.createWorld({ worldId, worldTime: 2000, worldSeed: "sleepless-mvp-01", generationVersion: "g2-fixture-1", mapFingerprint: "clock-fixture" });
    store.close();

    const firstStore = createPersistenceStore({ dbPath, contractVersion: "SK-MVP-0.2" });
    const firstClock = new WorldClock({ worldId, persistence: firstStore });
    const firstWorker = new WorldWorkerModule({ store: firstStore, clock: firstClock });
    await firstWorker.start();
    firstClock.recoverTo(2005);
    assert.equal(firstStore.getWorld(worldId)?.worldTime, 2005);
    await firstWorker.stop();

    const secondStore = createPersistenceStore({ dbPath, contractVersion: "SK-MVP-0.2" });
    const secondClock = new WorldClock({ worldId, persistence: secondStore });
    const secondWorker = new WorldWorkerModule({ store: secondStore, clock: secondClock });
    await secondWorker.start();
    try {
      assert.equal(secondClock.snapshot().worldTime, 2005);
      secondClock.recoverTo(2006);
      assert.equal(secondStore.getWorld(worldId)?.worldTime, 2006);
    } finally {
      await secondWorker.stop();
    }
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
