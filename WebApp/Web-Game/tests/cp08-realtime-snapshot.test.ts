import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { createPersistenceStore } from "../src/server/persistence/store";
import { PlayerMovementCadenceService } from "../src/server/player-movement-cadence";
import { WorldClock } from "../src/server/world-clock";
import { WorldWorkerModule } from "../src/server/world-worker";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import { ClientSnapshotService, PlayerMovementService, type ClientSnapshot } from "../src/server/world-projection";
import { WorkerCommandGateway, WorkerGatewayError } from "../src/server/worker-command-gateway";
import { RealtimeProjectionClient } from "../src/client/realtime-projection";
import {
  RealtimeSnapshotHub,
  RealtimeTransportError,
  type RealtimeSnapshotFrame,
  type RealtimeSnapshotSink,
} from "../src/server/realtime-snapshot";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp08-realtime-world";

interface Runtime {
  store: ReturnType<typeof createPersistenceStore>;
  worker: WorldWorkerModule;
  gateway: WorkerCommandGateway;
}

class MemorySink implements RealtimeSnapshotSink {
  readonly frames: RealtimeSnapshotFrame[] = [];
  readonly closeReasons: string[] = [];

  send(frame: RealtimeSnapshotFrame): void {
    this.frames.push(frame);
  }

  close(reason?: string): void {
    this.closeReasons.push(reason ?? "");
  }
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

async function openRuntime(dbPath: string, start = true): Promise<Runtime> {
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
  if (start) {
    await worker.start();
  }
  return { store, worker, gateway };
}

async function withRuntime<T>(run: (runtime: Runtime) => Promise<T>, start = true): Promise<T> {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp08-realtime-"));
  const dbPath = join(directory, "world.sqlite");
  seedDatabase(dbPath);
  const runtime = await openRuntime(dbPath, start);
  try {
    return await run(runtime);
  } finally {
    runtime.gateway.close();
    await runtime.worker.stop();
    rmSync(directory, { recursive: true, force: true });
  }
}

function scope(playerId: "player-a" | "player-b") {
  return {
    worldId: WORLD_ID,
    playerId,
    binding: playerId === "player-a" ? "binding-a" : "binding-b",
  } as const;
}

function projection(connectionId: string, playerId: "player-a" | "player-b", shelterId: "shelter-a" | "shelter-b") {
  return new RealtimeProjectionClient({
    connectionId,
    contractVersion: CONTRACT_VERSION,
    worldId: WORLD_ID,
    playerId,
    shelterId,
  });
}

test("connect binds one server scope and sends a full replacement through the gateway", async () => {
  await withRuntime(async ({ gateway }) => {
    const sink = new MemorySink();
    const requested: Array<{ worldId: string; playerId: string; binding: string }> = [];
    const originalFullSnapshot = gateway.fullSnapshot.bind(gateway);
    const observedGateway = {
      fullSnapshot(input: { worldId: string; playerId: string; binding: string }) {
        requested.push({ ...input });
        return originalFullSnapshot(input);
      },
    };
    const observedHub = new RealtimeSnapshotHub({ gateway: observedGateway });
    const context = { ...scope("player-a") };
    const connection = await observedHub.connect(context, sink);
    assert.equal(connection.state, "READY");
    assert.equal(connection.lastSequence, 1);
    assert.equal(sink.frames.length, 1);
    assert.equal(sink.frames[0]?.sequence, 1);
    assert.equal(sink.frames[0]?.snapshot.baseClientSnapshotId, null);
    assert.equal(sink.frames[0]?.snapshot.full, true);
    assert.equal(sink.frames[0]?.snapshot.playerScope.playerId, "player-a");
    assert.equal(JSON.stringify(sink.frames[0]?.snapshot).includes("shelter-b"), false);
    assert.deepEqual(requested, [context]);

    context.playerId = "player-b";
    context.binding = "binding-b";
    const replacement = await connection.publishFullSnapshot();
    assert.equal(replacement.snapshot.playerScope.playerId, "player-a");
    assert.deepEqual(requested, [scope("player-a"), scope("player-a")]);
  });
});

test("resync is a full replacement, coalesces concurrent requests, and rejects stale frames", async () => {
  await withRuntime(async ({ gateway }) => {
    const hub = new RealtimeSnapshotHub({ gateway });
    const sink = new MemorySink();
    const connection = await hub.connect(scope("player-a"), sink);
    const client = projection(connection.connectionId, "player-a", "shelter-a");
    assert.deepEqual(client.accept(sink.frames[0]!), { accepted: true, reason: "ACCEPTED" });

    await gateway.setMovementIntent({
      ...scope("player-a"),
      direction: "right",
      expectedRevision: 0,
      idempotencyKey: "realtime-move-1",
    });
    await gateway.advance(300);

    const first = connection.requestResync();
    const second = connection.requestResync();
    assert.equal(first, second);
    const replacement = await first;
    assert.equal(replacement.sequence, 2);
    assert.equal(replacement.snapshot.baseClientSnapshotId, null);
    assert.deepEqual(replacement.snapshot.player.position, { x: 17, y: 64 });
    assert.equal(connection.state, "READY");
    assert.equal(client.accept(replacement).accepted, true);
    assert.deepEqual(client.snapshot?.player.position, { x: 17, y: 64 });

    const stale = client.accept({ ...replacement, sequence: 1 });
    assert.deepEqual(stale, { accepted: false, reason: "STALE_FRAME", resyncRequired: true });
    assert.equal(client.state, "STALE");
    assert.deepEqual(client.snapshot?.player.position, { x: 17, y: 64 });
    assert.deepEqual(client.requestResync("STALE_FRAME"), {
      kind: "resync_request",
      connectionId: connection.connectionId,
      reason: "STALE_FRAME",
      lastAcceptedSequence: 2,
    });
  });
});

test("projection rejects another connection or scope without mutating accepted state", async () => {
  await withRuntime(async ({ gateway }) => {
    const hub = new RealtimeSnapshotHub({ gateway });
    const sinkA = new MemorySink();
    const sinkB = new MemorySink();
    const connectionA = await hub.connect(scope("player-a"), sinkA);
    const connectionB = await hub.connect(scope("player-b"), sinkB);
    const client = projection(connectionA.connectionId, "player-a", "shelter-a");
    assert.equal(client.accept(sinkA.frames[0]!).accepted, true);
    const before = client.snapshot;

    const wrongConnection = client.accept(sinkB.frames[0]!);
    assert.deepEqual(wrongConnection, { accepted: false, reason: "CONNECTION_MISMATCH", resyncRequired: true });
    assert.deepEqual(client.snapshot, before);

    const wrongScope = client.accept({
      ...sinkB.frames[0]!,
      connectionId: connectionA.connectionId,
    });
    assert.deepEqual(wrongScope, { accepted: false, reason: "SCOPE_MISMATCH", resyncRequired: true });
    assert.deepEqual(client.snapshot, before);

    const mutable = client.snapshot!;
    mutable.player.position.x = 999;
    assert.deepEqual(client.snapshot?.player.position, before?.player.position);
  });
});

test("not-ready, unsupported, draining, and closed capabilities fail visibly", async () => {
  await withRuntime(async ({ gateway }) => {
    const notReadyGateway = {
      fullSnapshot: () => Promise.reject(new WorkerGatewayError("WORKER_NOT_READY")),
    };
    const notReadyHub = new RealtimeSnapshotHub({ gateway: notReadyGateway });
    await assert.rejects(
      notReadyHub.connect(scope("player-a"), new MemorySink()),
      (error: unknown) => error instanceof RealtimeTransportError && error.code === "REALTIME_NOT_READY",
    );

    const unsupportedHub = new RealtimeSnapshotHub({ gateway, enabled: false });
    assert.equal(unsupportedHub.capability, "unsupported");
    await assert.rejects(
      unsupportedHub.connect(scope("player-a"), new MemorySink()),
      (error: unknown) => error instanceof RealtimeTransportError && error.code === "REALTIME_UNAVAILABLE",
    );

    const hub = new RealtimeSnapshotHub({ gateway });
    const sink = new MemorySink();
    const connection = await hub.connect(scope("player-a"), sink);
    await hub.drain("RUNTIME_DRAINING");
    assert.equal(hub.state, "DRAINING");
    assert.equal(connection.state, "CLOSED");
    assert.deepEqual(sink.closeReasons, ["RUNTIME_DRAINING"]);
    await assert.rejects(
      hub.connect(scope("player-a"), new MemorySink()),
      (error: unknown) => error instanceof RealtimeTransportError && error.code === "REALTIME_DRAINING",
    );
    await hub.close("RUNTIME_STOPPED");
    assert.equal(hub.state, "CLOSED");
    await assert.rejects(
      hub.connect(scope("player-a"), new MemorySink()),
      (error: unknown) => error instanceof RealtimeTransportError && error.code === "REALTIME_CLOSED",
    );
  });
});

test("invalid replacement frames remain stale and never merge onto an unrelated base", async () => {
  await withRuntime(async ({ gateway }) => {
    const hub = new RealtimeSnapshotHub({ gateway });
    const sink = new MemorySink();
    const connection = await hub.connect(scope("player-a"), sink);
    const client = projection(connection.connectionId, "player-a", "shelter-a");
    assert.equal(client.accept(sink.frames[0]!).accepted, true);
    const current = client.snapshot;

    const invalid = {
      ...sink.frames[0]!,
      sequence: 2,
      snapshot: { ...sink.frames[0]!.snapshot, baseClientSnapshotId: "missing-base" },
    } as unknown as RealtimeSnapshotFrame;
    assert.deepEqual(client.accept(invalid), { accepted: false, reason: "INVALID_FRAME", resyncRequired: true });
    assert.equal(client.state, "STALE");
    assert.deepEqual(client.snapshot, current);
  });
});

test("a failed sink is visible and the next explicit resync uses the next delivered sequence", async () => {
  await withRuntime(async ({ gateway }) => {
    let fail = false;
    const frames: RealtimeSnapshotFrame[] = [];
    const sink: RealtimeSnapshotSink = {
      send(frame) {
        if (fail) {
          throw new Error("SINK_WRITE_FAILED");
        }
        frames.push(frame);
      },
    };
    const hub = new RealtimeSnapshotHub({ gateway });
    const connection = await hub.connect(scope("player-a"), sink);
    fail = true;
    await assert.rejects(
      connection.publishFullSnapshot(),
      (error: unknown) => error instanceof RealtimeTransportError && error.code === "REALTIME_SINK_FAILED",
    );
    assert.equal(connection.state, "STALE");
    fail = false;
    const replacement = await connection.requestResync();
    assert.equal(replacement.sequence, 2);
    assert.deepEqual(frames.map((frame) => frame.sequence), [1, 2]);
  });
});
