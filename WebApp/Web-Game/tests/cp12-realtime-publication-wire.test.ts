import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

import { createServer, type Server } from "node:http";

import { WebSocket } from "ws";

import { loadRuntimeConfig } from "../src/server/config";
import {
  LOCAL_FIXTURE_COOKIE_NAME,
  type LocalFixtureBootstrapPayload,
} from "../src/server/fixture-session";
import { createEntrypoint } from "../src/server/entrypoint";
import { RealtimeSnapshotHub, type RealtimeSnapshotFrame } from "../src/server/realtime-snapshot";
import type { ClientSnapshot } from "../src/server/world-projection";
import type { RealtimeWireErrorFrame, RealtimeSessionResolver } from "../src/server/realtime-wire";
import { RealtimeWireAdapter } from "../src/server/realtime-wire";
import { WorldWorkerModule, type WorldAdvanceListener } from "../src/server/world-worker";

function fakeNextApp() {
  return {
    async prepare() {},
    getRequestHandler() {
      return (_request: unknown, response: { statusCode: number; end(body?: string): void }) => {
        response.statusCode = 200;
        response.end("next");
      };
    },
  } as never;
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

function waitForOpen(socket: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.once("open", () => resolve());
    socket.once("error", reject);
  });
}

function waitForClose(socket: WebSocket): Promise<[number, string]> {
  return new Promise((resolve) => {
    socket.once("close", (code, reason) => resolve([code, reason.toString()]));
  });
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

function trackedPendingPromise(): { promise: Promise<void>; getThenCalls(): number } {
  let thenCalls = 0;
  const promise = new Promise<void>(() => {});
  const originalThen = promise.then.bind(promise);
  Object.defineProperty(promise, "then", {
    configurable: true,
    value: (...args: unknown[]) => {
      thenCalls += 1;
      return originalThen(...args as Parameters<typeof promise.then>);
    },
  });
  return {
    promise,
    getThenCalls: () => thenCalls,
  };
}

test("an explicitly enabled local autonomous worker publishes progress to a connected page without resync", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp12-publication-wire-"));
  const dbPath = join(directory, "world.sqlite");
  let capturedWorker: WorldWorkerModule | null = null;
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({
      PORT: "0",
      NODE_ENV: "test",
      LOCAL_FIXTURE_MODE: "1",
      AUTONOMOUS_WORLD_MODE: "1",
      GAME_DB_PATH: dbPath,
    }),
    createNextApp: () => fakeNextApp(),
    createWorker: (options) => {
      const worker = new WorldWorkerModule({ store: options?.store, autonomous: options?.autonomous });
      capturedWorker = worker;
      return worker;
    },
  });
  let socket: WebSocket | null = null;

  try {
    await entrypoint.start();
    const worker = capturedWorker as WorldWorkerModule | null;
    assert.ok(worker);
    // Keep the autonomous capability enabled for startup/composition proof,
    // then pause its wakeup so the explicit advance below is deterministic.
    await worker.scheduler?.stop();

    const address = entrypoint.address();
    assert.ok(address && typeof address === "object");
    const bootstrapResponse = await fetch(`http://127.0.0.1:${address.port}/api/local-fixture/bootstrap`);
    assert.equal(bootstrapResponse.status, 200);
    const bootstrap = await bootstrapResponse.json() as LocalFixtureBootstrapPayload;
    const cookie = bootstrapResponse.headers.get("set-cookie")?.split(";", 1)[0];
    assert.match(cookie ?? "", new RegExp(`${LOCAL_FIXTURE_COOKIE_NAME}=`));

    socket = new WebSocket(`ws://127.0.0.1:${address.port}/realtime`, {
      headers: { cookie },
    });
    const first = await nextMessage(socket) as RealtimeSnapshotFrame;
    assert.equal(first.sequence, 1);
    assert.equal(first.snapshot.player.position.x, 16);

    const gateway = worker.gateway;
    assert.ok(gateway);
    await gateway.setMovementIntent({
      worldId: bootstrap.worldId,
      playerId: bootstrap.playerId,
      binding: "fixture-binding-a",
      direction: "right",
      expectedRevision: first.snapshot.player.revision,
      idempotencyKey: "cp12-publication-wire-intent-1",
    });

    const progressFrame = nextMessage(socket);
    worker.advance(300);
    const second = await progressFrame as RealtimeSnapshotFrame;
    assert.equal(second.kind, "client_snapshot");
    assert.equal(second.sequence, 2);
    assert.equal(second.snapshot.player.position.x, 17);
    assert.equal(second.snapshot.playerScope.playerId, bootstrap.playerId);
  } finally {
    socket?.terminate();
    await entrypoint.shutdown("test");
    rmSync(directory, { recursive: true, force: true });
  }
});

test("an injected adapter without the optional publication seam stays an explicit no-claim path", async () => {
  let observerRegistered = false;
  const worker = {
    instanceId: "cp12-publication-custom-worker",
    state: "created" as const,
    onFault() {},
    onAdvance() {
      observerRegistered = true;
    },
    async start() {},
    async stop() {},
  };
  const adapter = {
    state: "READY" as const,
    handleUpgrade(_request: unknown, socket: { destroy(): void }) {
      socket.destroy();
    },
    async drain() {},
    async close() {},
  } as never;
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({ PORT: "0", NODE_ENV: "test" }),
    createNextApp: () => fakeNextApp(),
    createWorker: () => worker,
    realtime: adapter,
  });

  try {
    await entrypoint.start();
    assert.equal(observerRegistered, false);
  } finally {
    await entrypoint.shutdown("test");
  }
});

test("an injected adapter rejection is observed without an unhandled process rejection", async () => {
  let advanceListener: WorldAdvanceListener | null = null;
  let publicationCalls = 0;
  const worker = {
    instanceId: "cp12-publication-rejected-worker",
    state: "created" as const,
    onFault() {},
    onAdvance(listener: WorldAdvanceListener) {
      advanceListener = listener;
    },
    async start() {},
    async stop() {},
  };
  const adapter = {
    state: "READY" as const,
    handleUpgrade(_request: unknown, socket: { destroy(): void }) {
      socket.destroy();
    },
    publishCurrentSnapshots() {
      publicationCalls += 1;
      return Promise.reject(new Error("INJECTED_PUBLICATION_FAILED"));
    },
    async drain() {},
    async close() {},
  } as never;
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({ PORT: "0", NODE_ENV: "test" }),
    createNextApp: () => fakeNextApp(),
    createWorker: () => worker,
    realtime: adapter,
  });
  const unhandled: unknown[] = [];
  const onUnhandled = (reason: unknown) => unhandled.push(reason);

  try {
    await entrypoint.start();
    const listener = advanceListener as unknown as WorldAdvanceListener;
    assert.equal(typeof listener, "function");
    process.on("unhandledRejection", onUnhandled);
    listener({ worldTime: 0, processedBoundaries: 0 });
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.equal(publicationCalls, 1);
    assert.deepEqual(unhandled, []);
  } finally {
    process.off("unhandledRejection", onUnhandled);
    await entrypoint.shutdown("test");
  }
});

test("an injected adapter observes each distinct pending publication promise once", async () => {
  let advanceListener: WorldAdvanceListener | null = null;
  let publicationCalls = 0;
  const promiseA = trackedPendingPromise();
  const promiseB = trackedPendingPromise();
  const worker = {
    instanceId: "cp12-publication-alternating-worker",
    state: "created" as const,
    onFault() {},
    onAdvance(listener: WorldAdvanceListener) {
      advanceListener = listener;
    },
    async start() {},
    async stop() {},
  };
  const adapter = {
    state: "READY" as const,
    handleUpgrade(_request: unknown, socket: { destroy(): void }) {
      socket.destroy();
    },
    publishCurrentSnapshots() {
      const publication = publicationCalls % 2 === 0 ? promiseA.promise : promiseB.promise;
      publicationCalls += 1;
      return publication;
    },
    async drain() {},
    async close() {},
  } as never;
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({ PORT: "0", NODE_ENV: "test" }),
    createNextApp: () => fakeNextApp(),
    createWorker: () => worker,
    realtime: adapter,
  });

  try {
    await entrypoint.start();
    const listener = advanceListener as unknown as WorldAdvanceListener;
    assert.equal(typeof listener, "function");
    for (let index = 0; index < 1000; index += 1) {
      listener({ worldTime: index, processedBoundaries: 0 });
    }
    assert.equal(publicationCalls, 1000);
    assert.equal(promiseA.getThenCalls(), 1);
    assert.equal(promiseB.getThenCalls(), 1);
  } finally {
    await entrypoint.shutdown("test");
  }
});

test("automatic publication failure is visible on the wire and closes the stale connection", async () => {
  const server = createServer();
  let failed = false;
  let calls = 0;
  const gateway = {
    fullSnapshot: async () => {
      calls += 1;
      if (failed) {
        throw new Error("SNAPSHOT_READ_FAILED");
      }
      return { clientSnapshotId: `snapshot-${calls}` } as unknown as ClientSnapshot;
    },
  };
  const resolver: RealtimeSessionResolver = {
    resolve(request) {
      return request.headers.cookie?.includes("sk_session=fixture-a")
        ? { worldId: "publication-wire-world", playerId: "player-a", binding: "binding-a" }
        : null;
    },
  };
  const adapter = new RealtimeWireAdapter({
    hub: new RealtimeSnapshotHub({ gateway }),
    sessionResolver: resolver,
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
    const first = await firstMessage as RealtimeSnapshotFrame;
    assert.equal(first.sequence, 1);

    failed = true;
    const errorMessage = nextMessage(socket);
    const close = waitForClose(socket);
    await adapter.publishCurrentSnapshots();
    const error = await errorMessage as RealtimeWireErrorFrame;
    assert.deepEqual(error, {
      kind: "realtime_error",
      error_code: "REALTIME_UNAVAILABLE",
      connection_id: first.connectionId,
    });
    const [closeCode] = await close;
    assert.equal(closeCode, 1011);
  } finally {
    socket.terminate();
    await adapter.close("TEST_CLOSED");
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
