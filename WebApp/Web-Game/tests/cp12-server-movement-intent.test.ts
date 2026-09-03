import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import { createServer } from "node:http";
import type { Socket } from "node:net";
import { WebSocket } from "ws";

import { createServerMovementIntentController } from "../src/client/server-movement-intent";
import {
  parseMovementIntentCommandEnvelope,
  parseMovementIntentResultFrame,
} from "../src/shared/movement-intent-command";
import { createPersistenceStore, PersistenceError } from "../src/server/persistence/store";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import { PlayerMovementService } from "../src/server/world-projection";
import { PlayerMovementCadenceService } from "../src/server/player-movement-cadence";
import { ClientSnapshotService } from "../src/server/world-projection";
import { WorkerCommandGateway } from "../src/server/worker-command-gateway";
import { RealtimeSnapshotHub } from "../src/server/realtime-snapshot";
import { RealtimeWireAdapter } from "../src/server/realtime-wire";
import { WorldWorkerModule } from "../src/server/world-worker";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp12-server-intent-world";

function validFrame(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    kind: "movement_intent_command",
    action: "start",
    command_id: "movement-command:one",
    contract_version: CONTRACT_VERSION,
    expected_entity_revisions: { player: 0 },
    idempotency_key: "movement-idempotency:one",
    typed_arguments: { direction: "right" },
    ...overrides,
  };
}

test("movement intent frames are exact server-bound start and stop envelopes", () => {
  assert.equal(parseMovementIntentCommandEnvelope(validFrame()).action, "start");
  assert.equal(parseMovementIntentCommandEnvelope(validFrame({ action: "stop", typed_arguments: {} })).action, "stop");
  for (const value of [
    validFrame({ world_id: WORLD_ID }),
    validFrame({ action: "stop", typed_arguments: { direction: "right" } }),
    validFrame({ typed_arguments: { direction: "right", player_id: "player-a" } }),
    validFrame({ command_id: "movement-idempotency:one" }),
  ]) {
    assert.throws(() => parseMovementIntentCommandEnvelope(value));
  }
});

function seededCadence(): { directory: string; store: ReturnType<typeof createPersistenceStore>; cadence: PlayerMovementCadenceService } {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp12-server-intent-"));
  const dbPath = join(directory, "world.sqlite");
  const seed = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  seed.open();
  createAndPersistG2Fixture(seed, {
    worldId: WORLD_ID,
    playerBindings: { "player-a": "binding-a", "player-b": "binding-b" },
  });
  seed.close();
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  store.open();
  const cadence = new PlayerMovementCadenceService({ store, movement: new PlayerMovementService({ store }) });
  return { directory, store, cadence };
}

test("new realtime owner supersedes an old owner and an old stop cannot clear it", () => {
  const runtime = seededCadence();
  try {
    runtime.cadence.setIntentForSession({
      worldId: WORLD_ID, playerId: "player-a", binding: "binding-a", direction: "right", expectedRevision: 0,
      idempotencyKey: "session-a-start", commandId: "session-a-command", ownerId: "owner-a",
    });
    runtime.cadence.setIntentForSession({
      worldId: WORLD_ID, playerId: "player-a", binding: "binding-a", direction: "left", expectedRevision: 0,
      idempotencyKey: "session-b-start", commandId: "session-b-command", ownerId: "owner-b",
    });
    const oldStop = runtime.cadence.stopIntentForSession({
      worldId: WORLD_ID, playerId: "player-a", binding: "binding-a", expectedRevision: 0,
      idempotencyKey: "session-a-stop", commandId: "session-a-stop-command", ownerId: "owner-a",
    });
    assert.equal(oldStop.ownerStatus, "not_owner");
    assert.equal(runtime.cadence.hasActiveIntent(WORLD_ID, "player-a"), true);
  } finally {
    runtime.store.close();
    rmSync(runtime.directory, { recursive: true, force: true });
  }
});

test("same-owner stale replacement fail-stops the old direction", () => {
  const runtime = seededCadence();
  try {
    runtime.cadence.setIntentForSession({
      worldId: WORLD_ID, playerId: "player-a", binding: "binding-a", direction: "right", expectedRevision: 0,
      idempotencyKey: "stale-start", commandId: "stale-start-command", ownerId: "owner-a",
    });
    assert.throws(() => runtime.cadence.setIntentForSession({
      worldId: WORLD_ID, playerId: "player-a", binding: "binding-a", direction: "down", expectedRevision: 1,
      idempotencyKey: "stale-replace", commandId: "stale-replace-command", ownerId: "owner-a",
    }), (error: unknown) => error instanceof PersistenceError && error.code === "STALE_REVISION");
    assert.equal(runtime.cadence.hasActiveIntent(WORLD_ID, "player-a"), false);
  } finally {
    runtime.store.close();
    rmSync(runtime.directory, { recursive: true, force: true });
  }
});

test("session stop uses the current revision as a safety release", () => {
  const runtime = seededCadence();
  try {
    runtime.cadence.setIntentForSession({
      worldId: WORLD_ID, playerId: "player-a", binding: "binding-a", direction: "right", expectedRevision: 0,
      idempotencyKey: "stop-stale-start", commandId: "stop-stale-start-command", ownerId: "owner-a",
    });
    const stopped = runtime.cadence.stopIntentForSession({
      worldId: WORLD_ID, playerId: "player-a", binding: "binding-a", expectedRevision: 999,
      idempotencyKey: "stop-stale-stop", commandId: "stop-stale-stop-command", ownerId: "owner-a",
    });
    assert.equal(stopped.ownerStatus, "owned");
    assert.equal(stopped.currentRevision, 0);
    assert.equal(runtime.cadence.hasActiveIntent(WORLD_ID, "player-a"), false);
  } finally {
    runtime.store.close();
    rmSync(runtime.directory, { recursive: true, force: true });
  }
});

test("a direct move safety-stops the active intent in the same gateway FIFO", async () => {
  const runtime = seededCadence();
  const gateway = new WorkerCommandGateway({
    worker: { state: "ready", advance: () => ({ worldTime: 0, processedBoundaries: 0 }) },
    movement: new PlayerMovementService({ store: runtime.store }),
    cadence: runtime.cadence,
    snapshot: new ClientSnapshotService({ store: runtime.store }),
  });
  try {
    await gateway.setMovementIntentForSession({
      worldId: WORLD_ID, playerId: "player-a", binding: "binding-a", direction: "right", expectedRevision: 0,
      idempotencyKey: "gateway-intent-start", commandId: "gateway-intent-command", ownerId: "owner-a",
    });
    await gateway.movePlayer({
      worldId: WORLD_ID, playerId: "player-a", binding: "binding-a", direction: "down", expectedRevision: 0,
      idempotencyKey: "gateway-move", commandId: "gateway-move-command",
    });
    assert.equal(runtime.cadence.hasActiveIntent(WORLD_ID, "player-a"), false);
  } finally {
    gateway.close();
    runtime.store.close();
    rmSync(runtime.directory, { recursive: true, force: true });
  }
});

test("owner revocation wins over a queued start and process cleanup clears intents", async () => {
  const runtime = seededCadence();
  const gateway = new WorkerCommandGateway({
    worker: { state: "ready", advance: () => ({ worldTime: 0, processedBoundaries: 0 }) },
    movement: new PlayerMovementService({ store: runtime.store }),
    cadence: runtime.cadence,
    snapshot: new ClientSnapshotService({ store: runtime.store }),
  });
  try {
    gateway.revokeMovementIntentOwner("owner-closed");
    await assert.rejects(
      gateway.setMovementIntentForSession({
        worldId: WORLD_ID, playerId: "player-a", binding: "binding-a", direction: "right", expectedRevision: 0,
        idempotencyKey: "queued-after-close", commandId: "queued-after-close-command", ownerId: "owner-closed",
      }),
      (error: unknown) => error instanceof PersistenceError && error.code === "MOVEMENT_INTENT_SESSION_CLOSED",
    );
    await gateway.setMovementIntentForSession({
      worldId: WORLD_ID, playerId: "player-a", binding: "binding-a", direction: "right", expectedRevision: 0,
      idempotencyKey: "cleanup-start", commandId: "cleanup-start-command", ownerId: "owner-live",
    });
    assert.equal(runtime.cadence.hasActiveIntent(WORLD_ID, "player-a"), true);
    runtime.cadence.clearAllIntents();
    assert.equal(runtime.cadence.hasActiveIntent(WORLD_ID, "player-a"), false);
  } finally {
    gateway.close();
    runtime.store.close();
    rmSync(runtime.directory, { recursive: true, force: true });
  }
});

test("a worker fault clears session-owned intents before the next advance", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp12-server-intent-fault-"));
  const dbPath = join(directory, "world.sqlite");
  const seed = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  seed.open();
  createAndPersistG2Fixture(seed, {
    worldId: WORLD_ID,
    playerBindings: { "player-a": "binding-a", "player-b": "binding-b" },
  });
  seed.close();
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const worker = new WorldWorkerModule({ store });
  await worker.start();
  try {
    const gateway = worker.gateway;
    assert.ok(gateway);
    await gateway.setMovementIntentForSession({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      direction: "right",
      expectedRevision: 0,
      idempotencyKey: "fault-start-idempotency",
      commandId: "fault-start-command",
      ownerId: "fault-owner",
    });
    worker.simulateFault();
    await worker.advance(100);
    await worker.advance(100);
    await worker.advance(100);
    assert.deepEqual(store.getPlayer(WORLD_ID, "player-a")?.position, { x: 16, y: 64 });
  } finally {
    await worker.stop();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a blocked session intent emits one terminal failure and does not retry", () => {
  const runtime = seededCadence();
  const failures: unknown[] = [];
  runtime.cadence.onFailure((failure) => failures.push(failure));
  try {
    runtime.cadence.setIntentForSession({
      worldId: WORLD_ID,
      playerId: "player-a",
      binding: "binding-a",
      direction: "left",
      expectedRevision: 0,
      idempotencyKey: "blocked-start-idempotency",
      commandId: "blocked-start-command",
      ownerId: "blocked-owner",
    });
    for (let step = 0; step < 50; step += 1) {
      runtime.cadence.reconcile({ worldId: WORLD_ID, worldTime: 0, elapsedMs: 100 });
    }
    assert.deepEqual(runtime.store.getPlayer(WORLD_ID, "player-a")?.position, { x: 0, y: 64 });
    assert.equal(runtime.cadence.hasActiveIntent(WORLD_ID, "player-a"), false);
    assert.deepEqual(failures, [{
      playerId: "player-a",
      code: "MOVEMENT_BLOCKED",
      ownerId: "blocked-owner",
      commandId: "blocked-start-command",
      currentRevision: 16,
    }]);
  } finally {
    runtime.store.close();
    rmSync(runtime.directory, { recursive: true, force: true });
  }
});

test("client controller sends one-shot intent frames and waits for typed results", () => {
  const sent: unknown[] = [];
  const statuses: string[] = [];
  let ready = false;
  const controller = createServerMovementIntentController({
    getContext: () => ready ? { contractVersion: CONTRACT_VERSION, playerRevision: 0 } : null,
    send: (frame) => sent.push(frame),
    onStatus: (message) => statuses.push(message),
  });
  ready = true;
  controller.setReady(true);
  assert.equal(controller.start("right"), true);
  assert.equal(controller.start("left"), false);
  const start = sent[0] as Record<string, unknown>;
  const parsed = parseMovementIntentCommandEnvelope(start);
  assert.equal(parsed.action, "start");
  assert.equal(controller.handleResult({
    kind: "movement_intent_result", action: "start", command_id: parsed.command_id,
    contract_version: CONTRACT_VERSION, effect: "intent_set", duplicate: false,
    current_entity_revisions: { player: 0 }, intent_id: "movement-intent-one", owner_status: "owned",
  }), true);
  assert.equal(controller.activeDirection, "right");
  assert.equal(controller.handleResult({
    kind: "movement_intent_result", action: "start", command_id: parsed.command_id,
    contract_version: CONTRACT_VERSION, effect: "rejected", duplicate: false,
    current_entity_revisions: { player: 0 }, error_code: "MOVEMENT_BLOCKED",
  }), true);
  assert.equal(controller.activeDirection, null);
  assert.equal(controller.start("right"), true);
  const restarted = parseMovementIntentCommandEnvelope(sent[1]);
  assert.equal(controller.handleResult({
    kind: "movement_intent_result", action: "start", command_id: restarted.command_id,
    contract_version: CONTRACT_VERSION, effect: "intent_set", duplicate: false,
    current_entity_revisions: { player: 0 }, intent_id: "movement-intent-two", owner_status: "owned",
  }), true);
  assert.equal(controller.stop(), true);
  const stop = parseMovementIntentCommandEnvelope(sent[2]);
  assert.equal(stop.action, "stop");
  assert.equal(controller.handleResult({
    kind: "movement_intent_result", action: "stop", command_id: stop.command_id,
    contract_version: CONTRACT_VERSION, effect: "intent_stopped", duplicate: false,
    current_entity_revisions: { player: 0 }, owner_status: "owned",
  }), true);
  assert.equal(controller.activeDirection, null);
  assert.equal(statuses.length > 0, true);
});

test("client controller requires reconnect after an invalid result", () => {
  const controller = createServerMovementIntentController({
    getContext: () => ({ contractVersion: CONTRACT_VERSION, playerRevision: 0 }),
    send: () => undefined,
  });
  controller.setReady(true);
  assert.equal(controller.start("up"), true);
  assert.equal(controller.handleResult({ kind: "movement_intent_result" }), false);
  assert.equal(controller.recoveryRequired, true);
  assert.equal(controller.start("down"), false);
  controller.reset();
  assert.equal(controller.recoveryRequired, false);
});

function listen(server: ReturnType<typeof createServer>): Promise<number> {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    resolve(typeof address === "object" && address ? address.port : 0);
  }));
}

function nextMessage(socket: WebSocket): Promise<unknown> {
  return new Promise((resolve, reject) => {
    socket.once("message", (data) => {
      try {
        resolve(JSON.parse(data.toString()));
      } catch (error) {
        reject(error);
      }
    });
    socket.once("error", reject);
  });
}

test("realtime adapter binds movement intent to the authenticated connection and revokes it on close", async () => {
  const runtime = seededCadence();
  const movement = new PlayerMovementService({ store: runtime.store });
  const gateway = new WorkerCommandGateway({
    worker: { state: "ready", advance: () => ({ worldTime: 0, processedBoundaries: 0 }) },
    movement,
    cadence: runtime.cadence,
    snapshot: new ClientSnapshotService({ store: runtime.store }),
  });
  const adapter = new RealtimeWireAdapter({
    hub: new RealtimeSnapshotHub({ gateway }),
    movement: gateway,
    sessionResolver: {
      resolve: () => ({ worldId: WORLD_ID, playerId: "player-a", binding: "binding-a" }),
    },
    admission: () => "ready",
  });
  const server = createServer();
  server.on("upgrade", (request, socket, head) => adapter.handleUpgrade(request, socket as Socket, head));
  const port = await listen(server);
  const socket = new WebSocket(`ws://127.0.0.1:${port}/realtime`);
  try {
    const firstPromise = nextMessage(socket);
    await new Promise<void>((resolve, reject) => {
      socket.once("open", () => resolve());
      socket.once("error", reject);
    });
    const first = await firstPromise as { kind: string; snapshot: { player: { revision: number } } };
    assert.equal(first.kind, "client_snapshot");
    socket.send(JSON.stringify(validFrame({ expected_entity_revisions: { player: first.snapshot.player.revision } })));
    const result = await nextMessage(socket) as Record<string, unknown>;
    assert.equal(result.kind, "movement_intent_result");
    assert.equal(result.effect, "intent_set");
    runtime.cadence.reconcile({ worldId: WORLD_ID, worldTime: 0, elapsedMs: 100 });
    runtime.cadence.reconcile({ worldId: WORLD_ID, worldTime: 0, elapsedMs: 100 });
    runtime.cadence.reconcile({ worldId: WORLD_ID, worldTime: 0, elapsedMs: 100 });
    assert.deepEqual(runtime.store.getPlayer(WORLD_ID, "player-a")?.position, { x: 17, y: 64 });
    socket.close();
    await new Promise<void>((resolve) => socket.once("close", () => resolve()));
    await new Promise((resolve) => setTimeout(resolve, 10));
    runtime.cadence.reconcile({ worldId: WORLD_ID, worldTime: 0, elapsedMs: 100 });
    runtime.cadence.reconcile({ worldId: WORLD_ID, worldTime: 0, elapsedMs: 100 });
    runtime.cadence.reconcile({ worldId: WORLD_ID, worldTime: 0, elapsedMs: 100 });
    assert.deepEqual(runtime.store.getPlayer(WORLD_ID, "player-a")?.position, { x: 17, y: 64 });
  } finally {
    await adapter.close("TEST_CLOSED");
    await new Promise<void>((resolve) => server.close(() => resolve()));
    runtime.store.close();
    rmSync(runtime.directory, { recursive: true, force: true });
  }
});

test("an established realtime connection rejects movement after runtime admission degrades", async () => {
  const runtime = seededCadence();
  const movement = new PlayerMovementService({ store: runtime.store });
  const gateway = new WorkerCommandGateway({
    worker: { state: "ready", advance: () => ({ worldTime: 0, processedBoundaries: 0 }) },
    movement,
    cadence: runtime.cadence,
    snapshot: new ClientSnapshotService({ store: runtime.store }),
  });
  let admission: "ready" | "degraded" = "ready";
  const adapter = new RealtimeWireAdapter({
    hub: new RealtimeSnapshotHub({ gateway }),
    movement: gateway,
    sessionResolver: {
      resolve: () => ({ worldId: WORLD_ID, playerId: "player-a", binding: "binding-a" }),
    },
    admission: () => admission,
  });
  const server = createServer();
  server.on("upgrade", (request, socket, head) => adapter.handleUpgrade(request, socket as Socket, head));
  const port = await listen(server);
  const socket = new WebSocket(`ws://127.0.0.1:${port}/realtime`);
  try {
    const firstPromise = nextMessage(socket);
    await new Promise<void>((resolve, reject) => {
      socket.once("open", () => resolve());
      socket.once("error", reject);
    });
    const first = await firstPromise as { snapshot: { player: { revision: number } } };
    socket.send(JSON.stringify(validFrame({ expected_entity_revisions: { player: first.snapshot.player.revision } })));
    const accepted = await nextMessage(socket) as { effect: string };
    assert.equal(accepted.effect, "intent_set");
    admission = "degraded";
    socket.send(JSON.stringify(validFrame({
      command_id: "movement-command:degraded",
      idempotency_key: "movement-idempotency:degraded",
      expected_entity_revisions: { player: first.snapshot.player.revision },
    })));
    const rejected = await nextMessage(socket) as Record<string, unknown>;
    assert.equal(rejected.kind, "movement_intent_result");
    assert.equal(rejected.effect, "rejected");
    assert.equal(rejected.error_code, "REALTIME_NOT_READY");
    assert.equal(runtime.cadence.hasActiveIntent(WORLD_ID, "player-a"), true);
  } finally {
    socket.close();
    await new Promise<void>((resolve) => socket.once("close", () => resolve()));
    await adapter.close("TEST_CLOSED");
    await new Promise<void>((resolve) => server.close(() => resolve()));
    gateway.close();
    runtime.store.close();
    rmSync(runtime.directory, { recursive: true, force: true });
  }
});

test("real worker cadence advances a wire intent and stops at the connection boundary", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp12-server-intent-worker-"));
  const dbPath = join(directory, "world.sqlite");
  const seed = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  seed.open();
  createAndPersistG2Fixture(seed, {
    worldId: WORLD_ID,
    playerBindings: { "player-a": "binding-a", "player-b": "binding-b" },
  });
  seed.close();
  const store = createPersistenceStore({ dbPath, contractVersion: CONTRACT_VERSION });
  const worker = new WorldWorkerModule({ store });
  await worker.start();
  const gateway = worker.gateway;
  assert.ok(gateway);
  const adapter = new RealtimeWireAdapter({
    hub: new RealtimeSnapshotHub({ gateway }),
    movement: gateway,
    sessionResolver: { resolve: () => ({ worldId: WORLD_ID, playerId: "player-a", binding: "binding-a" }) },
    admission: () => "ready",
  });
  const server = createServer();
  server.on("upgrade", (request, socket, head) => adapter.handleUpgrade(request, socket as Socket, head));
  const port = await listen(server);
  const socket = new WebSocket(`ws://127.0.0.1:${port}/realtime`);
  try {
    const firstPromise = nextMessage(socket);
    await new Promise<void>((resolve, reject) => {
      socket.once("open", () => resolve());
      socket.once("error", reject);
    });
    const first = await firstPromise as { snapshot: { player: { revision: number } } };
    socket.send(JSON.stringify(validFrame({ expected_entity_revisions: { player: first.snapshot.player.revision } })));
    const result = await nextMessage(socket) as { effect: string };
    assert.equal(result.effect, "intent_set");
    await worker.advance(100);
    await worker.advance(100);
    await worker.advance(100);
    await adapter.publishCurrentSnapshots();
    const progressed = await nextMessage(socket) as { kind: string; snapshot: { player: { position: { x: number; y: number } } } };
    assert.equal(progressed.kind, "client_snapshot");
    assert.deepEqual(progressed.snapshot.player.position, { x: 17, y: 64 });
    socket.close();
    await new Promise<void>((resolve) => socket.once("close", () => resolve()));
    await new Promise((resolve) => setTimeout(resolve, 10));
    await worker.advance(100);
    await worker.advance(100);
    await worker.advance(100);
    assert.deepEqual(store.getPlayer(WORLD_ID, "player-a")?.position, { x: 17, y: 64 });
  } finally {
    await adapter.close("TEST_CLOSED");
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await worker.stop();
    rmSync(directory, { recursive: true, force: true });
  }
});
