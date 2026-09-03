import assert from "node:assert/strict";
import { createServer, request as httpRequest, type Server } from "node:http";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { WebSocket } from "ws";

import { createPersistenceStore } from "../src/server/persistence/store";
import { createAndPersistG2Fixture } from "../src/server/world-fixture";
import { ClientSnapshotService, PlayerMovementService } from "../src/server/world-projection";
import { PlayerMovementCadenceService } from "../src/server/player-movement-cadence";
import { WorldClock } from "../src/server/world-clock";
import { WorldWorkerModule } from "../src/server/world-worker";
import { WorkerCommandGateway } from "../src/server/worker-command-gateway";
import { RealtimeSnapshotHub, type RealtimeSnapshotFrame } from "../src/server/realtime-snapshot";
import { createEntrypoint } from "../src/server/entrypoint";
import { loadRuntimeConfig } from "../src/server/config";
import {
  RealtimeWireAdapter,
  type RealtimeSessionResolver,
  type RealtimeWireErrorFrame,
} from "../src/server/realtime-wire";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp08-realtime-wire-world";

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

function scope(playerId: "player-a" | "player-b") {
  return {
    worldId: WORLD_ID,
    playerId,
    binding: playerId === "player-a" ? "binding-a" : "binding-b",
  } as const;
}

function cookieSessionResolver(): RealtimeSessionResolver {
  return {
    resolve(request) {
      const cookie = request.headers.cookie ?? "";
      if (cookie.includes("sk_session=fixture-a")) {
        return scope("player-a");
      }
      if (cookie.includes("sk_session=fixture-b")) {
        return scope("player-b");
      }
      return null;
    },
  };
}

async function listen(server: Server): Promise<number> {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  return address.port;
}

function waitForOpen(socket: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.once("open", () => resolve());
    socket.once("error", reject);
  });
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

function waitForClose(socket: WebSocket): Promise<[number, string]> {
  return new Promise((resolve) => {
    socket.once("close", (code, reason) => resolve([code, reason.toString()]));
  });
}

async function upgradeResponse(port: number, headers: Record<string, string> = {}): Promise<{ status: number; body: string }> {
  const response = await new Promise<{ status: number; body: string }>((resolve, reject) => {
    const client = httpRequest({
      host: "127.0.0.1",
      port,
      path: "/realtime",
      headers: {
        Connection: "Upgrade",
        Upgrade: "websocket",
        "Sec-WebSocket-Version": "13",
        "Sec-WebSocket-Key": "dGVzdC1rZXktMTIzNDU2Nzg=",
        ...headers,
      },
    });
    client.once("response", (res: { statusCode?: number; on: (event: string, listener: (chunk: Buffer) => void) => void }) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8") }));
    });
    client.once("upgrade", (_res: unknown, socket: { destroy: () => void }) => {
      socket.destroy();
      reject(new Error("unexpected upgrade"));
    });
    client.once("error", reject);
    client.end();
  });
  return response;
}

test("wire adapter authenticates through a resolver and sends full connect/resync frames", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp08-wire-connect-"));
  const dbPath = join(directory, "world.sqlite");
  seedDatabase(dbPath);
  const runtime = await openRuntime(dbPath);
  const server = createServer();
  const hub = new RealtimeSnapshotHub({ gateway: runtime.gateway });
  const adapter = new RealtimeWireAdapter({
    hub,
    sessionResolver: cookieSessionResolver(),
    admission: () => "ready",
  });
  server.on("upgrade", (request, socket, head) => adapter.handleUpgrade(request, socket as import("node:net").Socket, head));
  const port = await listen(server);
  const socket = new WebSocket(`ws://127.0.0.1:${port}/realtime?playerId=player-b`, {
    headers: { cookie: "sk_session=fixture-a" },
  });

  try {
    const firstMessage = nextMessage(socket);
    await waitForOpen(socket);
    const first = (await firstMessage) as RealtimeSnapshotFrame;
    assert.equal(first.kind, "client_snapshot");
    assert.equal(first.sequence, 1);
    assert.equal(first.snapshot.playerScope.playerId, "player-a");
    assert.equal(first.snapshot.baseClientSnapshotId, null);
    assert.equal(JSON.stringify(first).includes("binding-a"), false);
    assert.equal(JSON.stringify(first).includes("shelter-b"), false);

    socket.send(JSON.stringify({
      kind: "resync_request",
      connectionId: first.connectionId,
      reason: "EXPLICIT",
      lastAcceptedSequence: 1,
    }));
    const second = (await nextMessage(socket)) as RealtimeSnapshotFrame;
    assert.equal(second.sequence, 2);
    assert.equal(second.snapshot.baseClientSnapshotId, null);
    assert.equal(second.snapshot.playerScope.playerId, "player-a");
  } finally {
    socket.close();
    await Promise.race([waitForClose(socket), new Promise((resolve) => setTimeout(resolve, 100))]);
    await adapter.close("TEST_CLOSED");
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await closeRuntime(runtime);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("wire adapter rejects missing sessions and client-selected scope before upgrade", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp08-wire-auth-"));
  const dbPath = join(directory, "world.sqlite");
  seedDatabase(dbPath);
  const runtime = await openRuntime(dbPath);
  const server = createServer();
  const adapter = new RealtimeWireAdapter({
    hub: new RealtimeSnapshotHub({ gateway: runtime.gateway }),
    sessionResolver: cookieSessionResolver(),
    admission: () => "ready",
  });
  server.on("upgrade", (request, socket, head) => adapter.handleUpgrade(request, socket as import("node:net").Socket, head));
  const port = await listen(server);

  try {
    const missing = await upgradeResponse(port);
    assert.equal(missing.status, 401);
    assert.deepEqual(JSON.parse(missing.body), { error_code: "REALTIME_AUTH_REQUIRED" });
    const invalid = await upgradeResponse(port, { cookie: "sk_session=unknown" });
    assert.equal(invalid.status, 401);

    const socket = new WebSocket(`ws://127.0.0.1:${port}/realtime?worldId=${WORLD_ID}&playerId=player-b`, {
      headers: { cookie: "sk_session=fixture-a" },
    });
    const firstMessage = nextMessage(socket);
    await waitForOpen(socket);
    const first = (await firstMessage) as RealtimeSnapshotFrame;
    socket.send(JSON.stringify({
      kind: "resync_request",
      connectionId: first.connectionId,
      reason: "EXPLICIT",
      lastAcceptedSequence: 1,
      playerId: "player-b",
    }));
    const error = (await nextMessage(socket)) as RealtimeWireErrorFrame;
    assert.equal(error.kind, "realtime_error");
    assert.equal(error.error_code, "REALTIME_INVALID_MESSAGE");
    assert.equal(error.connection_id, first.connectionId);
    const [closeCode] = await waitForClose(socket);
    assert.equal(closeCode, 1008);
  } finally {
    await adapter.close("TEST_CLOSED");
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await closeRuntime(runtime);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("wire adapter surfaces runtime admission and drains active connections", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp08-wire-life-"));
  const dbPath = join(directory, "world.sqlite");
  seedDatabase(dbPath);
  const runtime = await openRuntime(dbPath);
  const server = createServer();
  let admission: "ready" | "degraded" | "draining" = "degraded";
  const adapter = new RealtimeWireAdapter({
    hub: new RealtimeSnapshotHub({ gateway: runtime.gateway }),
    sessionResolver: cookieSessionResolver(),
    admission: () => admission,
  });
  server.on("upgrade", (request, socket, head) => adapter.handleUpgrade(request, socket as import("node:net").Socket, head));
  const port = await listen(server);

  try {
    const degraded = await upgradeResponse(port, { cookie: "sk_session=fixture-a" });
    assert.equal(degraded.status, 503);
    assert.deepEqual(JSON.parse(degraded.body), { error_code: "REALTIME_NOT_READY" });

    admission = "ready";
    const socket = new WebSocket(`ws://127.0.0.1:${port}/realtime`, { headers: { cookie: "sk_session=fixture-a" } });
    const firstMessage = nextMessage(socket);
    await waitForOpen(socket);
    await firstMessage;
    await adapter.drain("RUNTIME_DRAINING");
    const [closeCode, closeReason] = await waitForClose(socket);
    assert.equal(closeCode, 1001);
    assert.equal(closeReason, "RUNTIME_DRAINING");

    admission = "draining";
    const draining = await upgradeResponse(port, { cookie: "sk_session=fixture-a" });
    assert.equal(draining.status, 503);
    assert.deepEqual(JSON.parse(draining.body), { error_code: "REALTIME_DRAINING" });
    await adapter.drain("RUNTIME_DRAINING");
    await adapter.close("RUNTIME_STOPPED");
  } finally {
    await adapter.close("TEST_CLOSED");
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await closeRuntime(runtime);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("wire adapter rechecks admission after an asynchronous session resolver", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp08-wire-race-"));
  const dbPath = join(directory, "world.sqlite");
  seedDatabase(dbPath);
  const runtime = await openRuntime(dbPath);
  const server = createServer();
  let admission: "ready" | "draining" = "ready";
  let signalResolverStarted!: () => void;
  let resolveSession!: (context: ReturnType<typeof scope> | null) => void;
  const resolverStarted = new Promise<void>((resolve) => {
    signalResolverStarted = resolve;
  });
  const adapter = new RealtimeWireAdapter({
    hub: new RealtimeSnapshotHub({ gateway: runtime.gateway }),
    sessionResolver: {
      resolve() {
        signalResolverStarted();
        return new Promise((resolve) => {
          resolveSession = resolve;
        });
      },
    },
    admission: () => admission,
  });
  server.on("upgrade", (request, socket, head) => adapter.handleUpgrade(request, socket as import("node:net").Socket, head));
  const port = await listen(server);

  try {
    const responsePromise = upgradeResponse(port, { cookie: "sk_session=fixture-a" });
    await resolverStarted;
    admission = "draining";
    resolveSession(scope("player-a"));
    const response = await responsePromise;
    assert.equal(response.status, 503);
    assert.deepEqual(JSON.parse(response.body), { error_code: "REALTIME_DRAINING" });
  } finally {
    await adapter.close("TEST_CLOSED");
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await closeRuntime(runtime);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("wire adapter enforces the bounded inbound payload before domain handling", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp08-wire-payload-"));
  const dbPath = join(directory, "world.sqlite");
  seedDatabase(dbPath);
  const runtime = await openRuntime(dbPath);
  const server = createServer();
  const adapter = new RealtimeWireAdapter({
    hub: new RealtimeSnapshotHub({ gateway: runtime.gateway }),
    sessionResolver: cookieSessionResolver(),
    admission: () => "ready",
  });
  server.on("upgrade", (request, socket, head) => adapter.handleUpgrade(request, socket as import("node:net").Socket, head));
  const port = await listen(server);
  const socket = new WebSocket(`ws://127.0.0.1:${port}/realtime`, {
    headers: { cookie: "sk_session=fixture-a" },
  });

  try {
    const firstMessage = nextMessage(socket);
    await waitForOpen(socket);
    await firstMessage;
    const closed = waitForClose(socket);
    socket.once("error", () => undefined);
    socket.send("x".repeat(17 * 1024));
    const [closeCode] = await closed;
    assert.equal(closeCode, 1009);
  } finally {
    socket.terminate();
    await adapter.close("TEST_CLOSED");
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await closeRuntime(runtime);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("entrypoint delegates the reserved upgrade and drains the adapter once", async () => {
  const calls: string[] = [];
  const worker = {
    instanceId: "worker-wire-entrypoint",
    state: "created" as const,
    onFault() {},
    async start() {},
    async stop() {},
  };
  const nextApp = {
    async prepare() {},
    getRequestHandler() {
      return () => {};
    },
  } as never;
  const adapter = {
    handleUpgrade(_request: unknown, socket: import("node:net").Socket) {
      calls.push("upgrade");
      socket.destroy();
    },
    async drain() {
      calls.push("drain");
    },
    async close() {
      calls.push("close");
    },
  } as never;
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({ PORT: "0", NODE_ENV: "test" }),
    createWorker: () => worker,
    createNextApp: () => nextApp,
    realtime: adapter,
  });
  await entrypoint.start();
  const address = entrypoint.address();
  assert.ok(address && typeof address === "object");
  const client = new WebSocket(`ws://127.0.0.1:${address.port}/realtime`);
  await new Promise<void>((resolve) => {
    client.once("error", () => resolve());
    client.once("close", () => resolve());
  });
  await entrypoint.shutdown("test");
  assert.deepEqual(calls, ["upgrade", "drain", "close"]);
});

test("entrypoint composes one worker gateway, hub, and wire adapter when a resolver is supplied", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp08-wire-composition-"));
  const dbPath = join(directory, "world.sqlite");
  seedDatabase(dbPath);
  const nextApp = {
    async prepare() {},
    getRequestHandler() {
      return () => {};
    },
  } as never;
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({ PORT: "0", NODE_ENV: "test", GAME_DB_PATH: dbPath }),
    createNextApp: () => nextApp,
    realtimeSessionResolver: cookieSessionResolver(),
  });

  try {
    await entrypoint.start();
    const address = entrypoint.address();
    assert.ok(address && typeof address === "object");
    const socket = new WebSocket(`ws://127.0.0.1:${address.port}/realtime`, {
      headers: { cookie: "sk_session=fixture-a" },
    });
    const firstMessage = nextMessage(socket);
    await waitForOpen(socket);
    const first = (await firstMessage) as RealtimeSnapshotFrame;
    assert.equal(first.sequence, 1);
    assert.equal(first.snapshot.playerScope.playerId, "player-a");
    socket.close();
    await waitForClose(socket);
  } finally {
    await entrypoint.shutdown("test");
    rmSync(directory, { recursive: true, force: true });
  }
});

test("entrypoint keeps realtime visibly unsupported when no session boundary is configured", async () => {
  const worker = {
    instanceId: "worker-wire-unsupported",
    state: "created" as const,
    onFault() {},
    async start() {},
    async stop() {},
  };
  const nextApp = {
    async prepare() {},
    getRequestHandler() {
      return () => {};
    },
  } as never;
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({ PORT: "0", NODE_ENV: "test" }),
    createWorker: () => worker,
    createNextApp: () => nextApp,
  });

  try {
    await entrypoint.start();
    const address = entrypoint.address();
    assert.ok(address && typeof address === "object");
    const response = await upgradeResponse(address.port);
    assert.equal(response.status, 503);
    assert.deepEqual(JSON.parse(response.body), { error_code: "REALTIME_UNAVAILABLE" });
  } finally {
    await entrypoint.shutdown("test");
  }
});
