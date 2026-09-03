import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { AutonomousWorldScheduler } from "../src/server/autonomous-world-scheduler";
import { deriveTrustedRecoveryTarget } from "../src/server/trusted-world-time";
import { PersistenceError, createPersistenceStore } from "../src/server/persistence/store";
import { WorldWorkerModule } from "../src/server/world-worker";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import { loadRuntimeConfig, RuntimeConfigError } from "../src/server/config";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp06-autonomous-world";

class ManualTimer {
  nowMs = 1_000;
  private nextHandle = 1;
  readonly callbacks = new Map<number, () => void>();
  readonly delays: number[] = [];

  setTimeout = (callback: () => void, delayMs: number): number => {
    const handle = this.nextHandle;
    this.nextHandle += 1;
    this.callbacks.set(handle, callback);
    this.delays.push(delayMs);
    return handle;
  };

  clearTimeout = (handle: unknown): void => {
    if (typeof handle === "number") {
      this.callbacks.delete(handle);
    }
  };

  fireNext(): () => void {
    const handle = this.callbacks.keys().next().value;
    assert.equal(typeof handle, "number");
    const callback = this.callbacks.get(handle as number);
    assert.ok(callback);
    this.callbacks.delete(handle as number);
    callback();
    return callback;
  }
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function withDirectory(prefix: string): { directory: string; dbPath: string } {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  return { directory, dbPath: join(directory, "world.sqlite") };
}

test("autonomous mode is an explicit host opt-in and defaults off", () => {
  assert.equal(loadRuntimeConfig({ PORT: "0", NODE_ENV: "test" }).autonomousWorldMode, false);
  assert.equal(loadRuntimeConfig({ PORT: "0", NODE_ENV: "test", AUTONOMOUS_WORLD_MODE: "1" }).autonomousWorldMode, true);
  assert.throws(
    () => loadRuntimeConfig({ PORT: "0", NODE_ENV: "test", AUTONOMOUS_WORLD_MODE: "maybe" }),
    (error: unknown) => error instanceof RuntimeConfigError && error.code === "CONFIG_INVALID" && error.field === "AUTONOMOUS_WORLD_MODE",
  );
});

test("schema-v8 adds a nullable server-time anchor and migrates schema-v7 safely", () => {
  const { directory, dbPath } = withDirectory("sleepless-kingdom-cp06-anchor-schema-");
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  try {
    store.open();
    assert.deepEqual(store.metadata(), {
      schemaVersion: 8,
      contractVersion: CONTRACT_VERSION,
      supportedEventVersion: 1,
      supportedSnapshotVersion: 1,
      migrationId: "cp06-004",
    });
    assert.equal(store.createWorld({ worldId: WORLD_ID, worldTime: 0 }).serverTimeAnchorMs, null);
    const database = new DatabaseSync(dbPath);
    const columns = new Set((database.prepare("PRAGMA table_info(world)").all() as Array<{ name?: unknown }>).map((row) => row.name));
    assert.equal(columns.has("server_time_anchor_ms"), true);
    database.close();
    store.close();

    const legacy = new DatabaseSync(dbPath);
    legacy.exec("ALTER TABLE world DROP COLUMN server_time_anchor_ms");
    legacy.prepare("UPDATE schema_meta SET schema_version = 7, migration_id = 'cp06-003' WHERE schema_meta_id = 'singleton'").run();
    legacy.close();

    store.open();
    assert.equal(store.metadata().schemaVersion, 8);
    assert.equal(store.metadata().migrationId, "cp06-004");
    assert.equal(store.getWorld(WORLD_ID)?.serverTimeAnchorMs, null);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("server-time recovery floors fractional seconds and rejects rollback or over-limit gaps", () => {
  assert.deepEqual(
    deriveTrustedRecoveryTarget({ completedWorldTime: 40, serverTimeAnchorMs: null, nowServerTimeMs: 1000 }),
    { targetWorldTime: 40, serverTimeAnchorMs: 1000, elapsedMs: 0, recoveredWorldSeconds: 0 },
  );
  assert.deepEqual(
    deriveTrustedRecoveryTarget({ completedWorldTime: 40, serverTimeAnchorMs: 1000, nowServerTimeMs: 1000 + 1000 }),
    { targetWorldTime: 41, serverTimeAnchorMs: 2000, elapsedMs: 1000, recoveredWorldSeconds: 1 },
  );
  assert.deepEqual(
    deriveTrustedRecoveryTarget({ completedWorldTime: 40, serverTimeAnchorMs: 1000, nowServerTimeMs: 1000 + 300_999 }),
    { targetWorldTime: 340, serverTimeAnchorMs: 301_999, elapsedMs: 300_999, recoveredWorldSeconds: 300 },
  );
  assert.throws(
    () => deriveTrustedRecoveryTarget({ completedWorldTime: 40, serverTimeAnchorMs: 1000, nowServerTimeMs: 1000 + 301_000 }),
    (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_LIMIT_EXCEEDED",
  );
  assert.throws(
    () => deriveTrustedRecoveryTarget({ completedWorldTime: 40, serverTimeAnchorMs: 1000, nowServerTimeMs: 999 }),
    (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED",
  );
  assert.throws(
    () => deriveTrustedRecoveryTarget({ completedWorldTime: 40, serverTimeAnchorMs: 1000, nowServerTimeMs: 1000.5 }),
    (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED",
  );
});

test("anchor initialization and boundary completion are one monotonic durable path", () => {
  const { directory, dbPath } = withDirectory("sleepless-kingdom-cp06-anchor-boundary-");
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  try {
    store.open();
    store.createWorld({ worldId: WORLD_ID, worldTime: 0 });
    assert.equal(store.initializeServerTimeAnchor(WORLD_ID, 1000).serverTimeAnchorMs, 1000);
    assert.equal(store.initializeServerTimeAnchor(WORLD_ID, 900).serverTimeAnchorMs, 1000);

    store.beginWorldBoundary(WORLD_ID, 1);
    assert.throws(
      () => store.completeWorldBoundary(WORLD_ID, 1, 999),
      (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_REQUIRED",
    );
    assert.deepEqual(store.getWorld(WORLD_ID), {
      worldId: WORLD_ID,
      worldTime: 0,
      inProgressWorldTime: 1,
      serverTimeAnchorMs: 1000,
      worldEventCursor: 0,
      worldSeed: null,
      generationVersion: null,
      mapFingerprint: null,
      revision: 0,
    });

    const completed = store.completeWorldBoundary(WORLD_ID, 1, 1100);
    assert.equal(completed.worldTime, 1);
    assert.equal(completed.inProgressWorldTime, null);
    assert.equal(completed.serverTimeAnchorMs, 1100);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("one-shot scheduler uses actual monotonic elapsed time and never overlaps callbacks", async () => {
  const timer = new ManualTimer();
  const advances: number[] = [];
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  const scheduler = new AutonomousWorldScheduler({
    cadenceMs: 100,
    monotonicNowMs: () => timer.nowMs,
    setTimeout: timer.setTimeout,
    clearTimeout: timer.clearTimeout,
    advance: async (elapsedMs) => {
      advances.push(elapsedMs);
      await blocked;
    },
  });

  scheduler.start();
  assert.equal(scheduler.snapshot().state, "running");
  assert.equal(timer.callbacks.size, 1);
  assert.deepEqual(timer.delays, [100]);
  assert.throws(() => scheduler.start(), (error: unknown) => error instanceof Error && error.message === "SCHEDULER_ALREADY_STARTED");

  timer.nowMs = 1_125;
  const staleCallback = timer.fireNext();
  await flushMicrotasks();
  staleCallback();
  await flushMicrotasks();
  assert.deepEqual(advances, [125]);
  assert.equal(timer.callbacks.size, 0);

  const stopping = scheduler.stop();
  assert.equal(scheduler.snapshot().state, "draining");
  release();
  await stopping;
  assert.equal(scheduler.snapshot().state, "stopped");
  staleCallback();
  await flushMicrotasks();
  assert.deepEqual(advances, [125]);
});

test("scheduler fault is visible and stops future wakeups", async () => {
  const timer = new ManualTimer();
  const faults: unknown[] = [];
  const scheduler = new AutonomousWorldScheduler({
    monotonicNowMs: () => timer.nowMs,
    setTimeout: timer.setTimeout,
    clearTimeout: timer.clearTimeout,
    advance: () => {
      throw new PersistenceError("RECOVERY_REQUIRED");
    },
    onFault: (error) => faults.push(error),
  });
  scheduler.start();
  timer.fireNext();
  await flushMicrotasks();
  assert.equal(scheduler.snapshot().state, "failed");
  assert.equal(scheduler.snapshot().lastErrorCode, "RECOVERY_REQUIRED");
  assert.equal(timer.callbacks.size, 0);
  assert.equal(faults.length, 1);
  assert.ok(faults[0] instanceof PersistenceError);
});

test("autonomous worker recovers from one persisted anchor before ready and starts one scheduler", async () => {
  const { directory, dbPath } = withDirectory("sleepless-kingdom-cp06-autonomous-worker-");
  const seed = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  seed.open();
  createAndPersistG2Fixture(seed, { worldId: WORLD_ID, worldTime: 0 });
  seed.close();

  const firstStore = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const firstWorker = new WorldWorkerModule({
    store: firstStore,
    worldId: WORLD_ID,
    autonomous: true,
    serverTimeNowMs: () => 1_000_000,
    monotonicNowMs: () => 0,
  });
  try {
    await firstWorker.start();
    assert.equal(firstWorker.state, "ready");
    assert.equal(firstStore.getWorld(WORLD_ID)?.worldTime, 0);
    assert.equal(firstStore.getWorld(WORLD_ID)?.serverTimeAnchorMs, 1_000_000);
    assert.equal(firstWorker.scheduler?.snapshot().state, "running");
  } finally {
    await firstWorker.stop();
  }

  const secondStore = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const secondWorker = new WorldWorkerModule({
    store: secondStore,
    worldId: WORLD_ID,
    autonomous: true,
    serverTimeNowMs: () => 1_003_500,
    monotonicNowMs: () => 0,
  });
  try {
    await secondWorker.start();
    assert.equal(secondWorker.state, "ready");
    assert.equal(secondStore.getWorld(WORLD_ID)?.worldTime, 3);
    assert.equal(secondStore.getWorld(WORLD_ID)?.serverTimeAnchorMs, 1_003_500);
    assert.equal(secondWorker.scheduler?.snapshot().state, "running");
  } finally {
    await secondWorker.stop();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("autonomous worker refuses over-limit downtime before readiness or scheduler start", async () => {
  const { directory, dbPath } = withDirectory("sleepless-kingdom-cp06-autonomous-limit-");
  const seed = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  seed.open();
  createAndPersistG2Fixture(seed, { worldId: WORLD_ID, worldTime: 0 });
  seed.initializeServerTimeAnchor(WORLD_ID, 1_000_000);
  seed.close();

  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const worker = new WorldWorkerModule({
    store,
    worldId: WORLD_ID,
    autonomous: true,
    serverTimeNowMs: () => 1_301_000,
    monotonicNowMs: () => 0,
  });
  try {
    await assert.rejects(
      () => worker.start(),
      (error: unknown) => error instanceof PersistenceError && error.code === "RECOVERY_LIMIT_EXCEEDED",
    );
    assert.equal(worker.state, "stopped");
    assert.equal(worker.scheduler, undefined);
    assert.equal(store.isOpen, false);
  } finally {
    await worker.stop();
    rmSync(directory, { recursive: true, force: true });
  }
});
