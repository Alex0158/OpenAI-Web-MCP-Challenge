import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { PersistenceError, createPersistenceStore } from "../src/server/persistence/store";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import {
  ClientSnapshotService,
  PlayerMovementService,
  type MovePlayerInput,
} from "../src/server/world-projection";
import { PlayerMovementCadenceService, type SetMovementIntentInput } from "../src/server/player-movement-cadence";
import { WorldClock } from "../src/server/world-clock";
import { WorldWorkerModule } from "../src/server/world-worker";
import { WorkerCommandGateway, WorkerGatewayError } from "../src/server/worker-command-gateway";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp08-gateway-world";

interface Runtime {
  store: ReturnType<typeof createPersistenceStore>;
  worker: WorldWorkerModule;
  gateway: WorkerCommandGateway;
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
  const snapshot = new ClientSnapshotService({ store });
  const clock = new WorldClock({
    worldId: WORLD_ID,
    persistence: store,
    reconciliationHandlers: [cadence.reconcile],
  });
  const worker = new WorldWorkerModule({ store, clock });
  const gateway = new WorkerCommandGateway({ worker, movement, cadence, snapshot });
  await worker.start();
  return { store, worker, gateway };
}

async function closeRuntime(runtime: Runtime): Promise<void> {
  runtime.gateway.close();
  await runtime.worker.stop();
}

function setRight(runtime: Runtime, idempotencyKey: string, expectedRevision = 0): Promise<unknown> {
  return runtime.gateway.setMovementIntent({
    worldId: WORLD_ID,
    playerId: "player-a",
    binding: "binding-a",
    direction: "right",
    expectedRevision,
    idempotencyKey,
  });
}

function snapshot(runtime: Runtime): Promise<ReturnType<ClientSnapshotService["full"]>> {
  return runtime.gateway.fullSnapshot({
    worldId: WORLD_ID,
    playerId: "player-a",
    binding: "binding-a",
  });
}

test("gateway preserves command, advance, and full snapshot FIFO order", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp08-gateway-order-"));
  const dbPath = join(directory, "world.sqlite");
  seedDatabase(dbPath);
  const runtime = await openRuntime(dbPath);

  try {
    const command = setRight(runtime, "gateway-order-intent");
    const advance = runtime.gateway.advance(300);
    const projection = snapshot(runtime);
    await command;
    await advance;
    const current = await projection;
    assert.deepEqual(current.player.position, { x: 17, y: 64 });
    assert.equal(current.player.revision, 1);
    assert.equal((await snapshot(runtime)).player.position.x, 17);
  } finally {
    await closeRuntime(runtime);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("gateway serializes a discrete player move before the following full snapshot", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp08-gateway-direct-move-"));
  const dbPath = join(directory, "world.sqlite");
  seedDatabase(dbPath);
  const runtime = await openRuntime(dbPath);

  try {
    const gateway = runtime.worker.gateway;
    assert.ok(gateway);
    const input: MovePlayerInput = {
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      commandId: "gateway-direct-move-command",
      direction: "right",
      expectedRevision: 0,
      idempotencyKey: "gateway-direct-move-idempotency",
    };
    const command = gateway.movePlayer(input);
    const projection = gateway.fullSnapshot({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
    });
    input.direction = "left";
    input.commandId = "mutated-command";
    input.idempotencyKey = "mutated-idempotency";

    const result = await command;
    const current = await projection;
    assert.deepEqual(result.position, { x: 17, y: 64 });
    assert.equal(result.revision, 1);
    assert.deepEqual(current.player.position, result.position);
    assert.equal(current.player.revision, result.revision);
    assert.equal(runtime.store.events(WORLD_ID).at(-1)?.causationId, "gateway-direct-move-command");
  } finally {
    await closeRuntime(runtime);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a read submitted before an advance observes the earlier state", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp08-gateway-read-"));
  const dbPath = join(directory, "world.sqlite");
  seedDatabase(dbPath);
  const runtime = await openRuntime(dbPath);

  try {
    await setRight(runtime, "gateway-read-intent");
    const before = snapshot(runtime);
    const advance = runtime.gateway.advance(300);
    assert.deepEqual((await before).player.position, { x: 16, y: 64 });
    await advance;
    assert.deepEqual((await snapshot(runtime)).player.position, { x: 17, y: 64 });
  } finally {
    await closeRuntime(runtime);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("queued command inputs are captured at submission time", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp08-gateway-input-"));
  const dbPath = join(directory, "world.sqlite");
  seedDatabase(dbPath);
  const runtime = await openRuntime(dbPath);

  try {
    const input: SetMovementIntentInput = {
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      direction: "right",
      expectedRevision: 0,
      idempotencyKey: "gateway-captured-input",
    };
    const command = runtime.gateway.setMovementIntent(input);
    input.direction = "left";
    input.idempotencyKey = "mutated-after-submit";
    await command;
    await runtime.gateway.advance(300);
    assert.deepEqual((await snapshot(runtime)).player.position, { x: 17, y: 64 });
  } finally {
    await closeRuntime(runtime);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a stop intent in the gateway FIFO prevents a later advance", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp08-gateway-stop-"));
  const dbPath = join(directory, "world.sqlite");
  seedDatabase(dbPath);
  const runtime = await openRuntime(dbPath);

  try {
    await setRight(runtime, "gateway-stop-intent");
    const stop = runtime.gateway.stopMovementIntent({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      expectedRevision: 0,
      idempotencyKey: "gateway-stop",
    });
    const advance = runtime.gateway.advance(300);
    await stop;
    await advance;
    assert.deepEqual((await snapshot(runtime)).player.position, { x: 16, y: 64 });
  } finally {
    await closeRuntime(runtime);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a failed domain operation does not poison later gateway entries", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp08-gateway-failure-"));
  const dbPath = join(directory, "world.sqlite");
  seedDatabase(dbPath);
  const runtime = await openRuntime(dbPath);

  try {
    const stale = setRight(runtime, "gateway-stale", 1);
    const valid = setRight(runtime, "gateway-valid", 0);
    await assert.rejects(
      stale,
      (error: unknown) => error instanceof PersistenceError && error.code === "STALE_REVISION",
    );
    await valid;
    await runtime.gateway.advance(300);
    assert.deepEqual((await snapshot(runtime)).player.position, { x: 17, y: 64 });
  } finally {
    await closeRuntime(runtime);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("not-ready and close outcomes are typed and queued work does not run after close", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp08-gateway-life-"));
  const dbPath = join(directory, "world.sqlite");
  seedDatabase(dbPath);
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const movement = new PlayerMovementService({ store });
  const cadence = new PlayerMovementCadenceService({ store, movement });
  const snapshotService = new ClientSnapshotService({ store });
  const clock = new WorldClock({ worldId: WORLD_ID, persistence: store, reconciliationHandlers: [cadence.reconcile] });
  const worker = new WorldWorkerModule({ store, clock });
  const gateway = new WorkerCommandGateway({ worker, movement, cadence, snapshot: snapshotService });

  try {
    await assert.rejects(
      gateway.fullSnapshot({ worldId: WORLD_ID, playerId: "player-a", binding: "binding-a" }),
      (error: unknown) => error instanceof WorkerGatewayError && error.code === "WORKER_NOT_READY",
    );
    await worker.start();
    const queued = gateway.fullSnapshot({ worldId: WORLD_ID, playerId: "player-a", binding: "binding-a" });
    gateway.close();
    await assert.rejects(
      queued,
      (error: unknown) => error instanceof WorkerGatewayError && error.code === "GATEWAY_CLOSED",
    );
    await assert.rejects(
      gateway.advance(100),
      (error: unknown) => error instanceof WorkerGatewayError && error.code === "GATEWAY_CLOSED",
    );
    assert.deepEqual(store.getPlayer(WORLD_ID, "player-a")?.position, { x: 16, y: 64 });
    assert.equal(worker.state, "ready");

    const noClockGateway = new WorkerCommandGateway({
      worker: { state: "ready" },
      movement,
      cadence,
      snapshot: snapshotService,
    });
    await assert.rejects(
      noClockGateway.advance(100),
      (error: unknown) => error instanceof WorkerGatewayError && error.code === "WORKER_CLOCK_UNAVAILABLE",
    );
    noClockGateway.close();
  } finally {
    gateway.close();
    await worker.stop();
    rmSync(directory, { recursive: true, force: true });
  }
});
