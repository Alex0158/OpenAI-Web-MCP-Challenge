import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { createPersistenceStore } from "../src/server/persistence/store";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import { WorldWorkerModule } from "../src/server/world-worker";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp06-autonomous-runtime-world";

test("file-backed autonomous worker advances without a browser and drains cleanly", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp06-autonomous-runtime-"));
  const dbPath = join(directory, "world.sqlite");
  const seed = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  seed.open();
  createAndPersistG2Fixture(seed, { worldId: WORLD_ID, worldTime: 0 });
  seed.close();

  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const startWallMs = Date.now();
  const worker = new WorldWorkerModule({
    store,
    worldId: WORLD_ID,
    autonomous: true,
    serverTimeNowMs: () => startWallMs,
    monotonicNowMs: () => Date.now() - startWallMs,
  });

  try {
    await worker.start();
    assert.equal(worker.state, "ready");
    assert.equal(worker.scheduler?.snapshot().state, "running");
    const deadline = Date.now() + 3_000;
    while (Date.now() < deadline && (store.getWorld(WORLD_ID)?.worldTime ?? 0) < 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    const liveWorld = store.getWorld(WORLD_ID);
    assert.ok(liveWorld);
    assert.ok(liveWorld.worldTime >= 1);
    assert.equal(liveWorld.inProgressWorldTime, null);
    assert.equal(liveWorld.serverTimeAnchorMs, startWallMs);
  } finally {
    await worker.stop();
    assert.equal(worker.state, "stopped");
    assert.equal(worker.scheduler?.snapshot().state, "stopped");
    assert.equal(store.isOpen, false);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("autonomous startup replays a persisted partial boundary before scheduler admission", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp06-autonomous-replay-"));
  const dbPath = join(directory, "world.sqlite");
  const seed = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  seed.open();
  createAndPersistG2Fixture(seed, { worldId: WORLD_ID, worldTime: 0 });
  seed.beginWorldBoundary(WORLD_ID, 1);
  seed.close();

  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const worker = new WorldWorkerModule({
    store,
    worldId: WORLD_ID,
    autonomous: true,
    serverTimeNowMs: () => 2_000_000,
    monotonicNowMs: () => 0,
  });
  try {
    await worker.start();
    assert.equal(worker.state, "ready");
    assert.equal(worker.scheduler?.snapshot().state, "running");
    const world = store.getWorld(WORLD_ID);
    assert.ok(world);
    assert.equal(world.worldTime, 1);
    assert.equal(world.inProgressWorldTime, null);
    assert.equal(world.serverTimeAnchorMs, 2_000_000);
  } finally {
    await worker.stop();
    assert.equal(store.isOpen, false);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("autonomous startup preserves the pre-replay anchor while catching up after a partial boundary", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp06-autonomous-replay-anchor-"));
  const dbPath = join(directory, "world.sqlite");
  const seed = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  seed.open();
  createAndPersistG2Fixture(seed, { worldId: WORLD_ID, worldTime: 0 });
  seed.initializeServerTimeAnchor(WORLD_ID, 1_000_000);
  seed.beginWorldBoundary(WORLD_ID, 1);
  seed.close();

  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const worker = new WorldWorkerModule({
    store,
    worldId: WORLD_ID,
    autonomous: true,
    serverTimeNowMs: () => 1_003_500,
    monotonicNowMs: () => 0,
  });
  try {
    await worker.start();
    assert.equal(worker.state, "ready");
    assert.equal(worker.scheduler?.snapshot().state, "running");
    const world = store.getWorld(WORLD_ID);
    assert.ok(world);
    assert.equal(world.worldTime, 3);
    assert.equal(world.inProgressWorldTime, null);
    assert.equal(world.serverTimeAnchorMs, 1_003_500);
  } finally {
    await worker.stop();
    assert.equal(store.isOpen, false);
    rmSync(directory, { recursive: true, force: true });
  }
});
