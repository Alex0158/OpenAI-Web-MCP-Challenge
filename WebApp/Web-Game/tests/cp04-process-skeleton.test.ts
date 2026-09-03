import assert from "node:assert/strict";
import { test } from "node:test";

import { createEntrypoint } from "../src/server/entrypoint";
import { loadRuntimeConfig, RuntimeConfigError } from "../src/server/config";
import { JsonLogger } from "../src/server/logging";
import { RuntimeRegistry, createRuntimeStartController, RuntimeLifecycleError } from "../src/server/runtime";
import type { WorldWorker } from "../src/server/world-worker";

class FakeWorker implements WorldWorker {
  readonly instanceId = "worker-test";
  state: "created" | "starting" | "ready" | "stopped" = "created";
  starts = 0;
  stops = 0;
  failStart = false;
  startDelayMs = 0;
  stopDelayMs = 0;
  stopNever = false;
  private readonly listeners = new Set<(code: "WORKER_FAULT") => void>();

  onFault(listener: (code: "WORKER_FAULT") => void): void {
    this.listeners.add(listener);
  }

  async start(): Promise<void> {
    this.starts += 1;
    this.state = "starting";
    if (this.startDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.startDelayMs));
    }
    if (this.failStart) {
      this.state = "stopped";
      throw new Error("WORKER_START_FAILED");
    }
    this.state = "ready";
  }

  async stop(): Promise<void> {
    this.stops += 1;
    if (this.stopNever) {
      await new Promise<void>(() => {});
    }
    if (this.stopDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.stopDelayMs));
    }
    this.state = "stopped";
  }

  fault(): void {
    for (const listener of this.listeners) {
      listener("WORKER_FAULT");
    }
  }
}

function testConfig(overrides: Partial<NodeJS.ProcessEnv> = {}) {
  return loadRuntimeConfig({
    PORT: "0",
    NODE_ENV: "test",
    ...overrides,
  });
}

test("config rejects missing and malformed values with typed errors", () => {
  assert.throws(
    () => loadRuntimeConfig({ NODE_ENV: "test" }),
    (error: unknown) => error instanceof RuntimeConfigError && error.code === "CONFIG_MISSING" && error.field === "PORT",
  );
  assert.throws(
    () => loadRuntimeConfig({ PORT: "70000", NODE_ENV: "test" }),
    (error: unknown) => error instanceof RuntimeConfigError && error.code === "CONFIG_INVALID" && error.field === "PORT",
  );
  assert.equal(testConfig().shutdownTimeoutMs, 2000);
  assert.match(testConfig().gameDbPath, /tmp\/runtime\/world\.sqlite$/);
  assert.equal(testConfig({ SHUTDOWN_TIMEOUT_MS: "100" }).shutdownTimeoutMs, 100);
  assert.throws(
    () => loadRuntimeConfig({ PORT: "0", NODE_ENV: "test", GAME_DB_PATH: ":memory:" }),
    (error: unknown) => error instanceof RuntimeConfigError && error.code === "CONFIG_INVALID" && error.field === "GAME_DB_PATH",
  );
});

test("runtime start is idempotent and a stopped runtime cannot reopen", async () => {
  const registry = new RuntimeRegistry("process-test", "worker-test");
  const worker = new FakeWorker();
  const controller = createRuntimeStartController(registry, { shutdownTimeoutMs: 100 });

  const first = await controller.start(worker);
  const second = await controller.start(worker);
  assert.deepEqual(first, { kind: "started", status: "ready" });
  assert.deepEqual(second, { kind: "already_started", status: "ready" });
  assert.equal(worker.starts, 1);

  await controller.stop(worker);
  registry.markStopped();
  await assert.rejects(() => controller.start(worker), (error: unknown) => error instanceof RuntimeLifecycleError && error.code === "RUNTIME_STOPPED");
});

test("entrypoint exposes dynamic health, degraded worker state, and draining", async () => {
  const worker = new FakeWorker();
  worker.startDelayMs = 40;
  worker.stopDelayMs = 50;
  const logs: string[] = [];
  const logger = new JsonLogger({
    level: "debug",
    processInstanceId: "process-test",
    workerInstanceId: "worker-test",
    write: (line) => logs.push(line),
  });
  const nextApp = {
    async prepare() {},
    getRequestHandler() {
      return (_req: NodeJS.ReadableStream, _res: NodeJS.WritableStream) => {
        // The test only exercises the entrypoint-owned health adapter.
      };
    },
  } as never;
  const entrypoint = createEntrypoint({
    config: testConfig(),
    createWorker: () => worker,
    createNextApp: () => nextApp,
    logger,
  });

  const starting = entrypoint.start();
  for (let attempt = 0; attempt < 20 && !entrypoint.address(); attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
  const boundAddress = entrypoint.address();
  assert.ok(boundAddress && typeof boundAddress === "object");
  const startingHealth = await fetch(`http://127.0.0.1:${boundAddress.port}/api/health`);
  assert.equal(startingHealth.status, 503);
  assert.equal((await startingHealth.json()).status, "starting");

  const started = await starting;
  assert.equal(started.status, "ready");
  const address = entrypoint.address();
  assert.ok(address && typeof address === "object");
  const port = address.port;

  const ready = await fetch(`http://127.0.0.1:${port}/api/health?ignored=true`);
  assert.equal(ready.status, 200);
  assert.equal(ready.headers.get("cache-control"), "no-store");
  assert.equal((await ready.json()).ready, true);

  const method = await fetch(`http://127.0.0.1:${port}/api/health`, { method: "POST" });
  assert.equal(method.status, 405);

  worker.fault();
  const degraded = await fetch(`http://127.0.0.1:${port}/api/health`);
  const degradedBody = await degraded.json();
  assert.equal(degraded.status, 503);
  assert.equal(degradedBody.status, "degraded");
  assert.equal(degradedBody.live, true);
  assert.equal(degradedBody.ready, false);
  assert.equal(logs.some((line) => line.includes("WORKER_FAULT")), true);

  const shutdown = entrypoint.shutdown("test");
  await new Promise((resolve) => setTimeout(resolve, 5));
  // Listener closure starts at the DRAINING boundary, so a new connection is
  // no longer guaranteed. Read the same entrypoint-owned registry directly.
  const draining = entrypoint.registry.health();
  assert.equal(draining.status, "draining");
  assert.equal(draining.ready, false);
  await shutdown;
  assert.equal(worker.stops, 1);
  assert.equal(logs.some((line) => line.includes("runtime_stopped")), true);
  assert.equal(logs.some((line) => line.includes("process-test")), true);
});

test("entrypoint closes the internal Next application during shutdown", async () => {
  const worker = new FakeWorker();
  let nextCloseCalls = 0;
  const nextApp = {
    async prepare() {},
    getRequestHandler() {
      return (_req: NodeJS.ReadableStream, _res: NodeJS.WritableStream) => {};
    },
    async close() {
      nextCloseCalls += 1;
    },
  } as never;
  const entrypoint = createEntrypoint({
    config: testConfig(),
    createWorker: () => worker,
    createNextApp: () => nextApp,
    logger: new JsonLogger({
      level: "debug",
      processInstanceId: "process-next-close-test",
      workerInstanceId: "worker-next-close-test",
      write: () => {},
    }),
  });

  await entrypoint.start();
  const result = await entrypoint.shutdown("test");

  assert.deepEqual(result, { timedOut: false, errorCode: null });
  assert.equal(nextCloseCalls, 1);
  assert.equal(worker.stops, 1);
});

test("worker start failure stays observable as degraded and rejects readiness", async () => {
  const worker = new FakeWorker();
  worker.failStart = true;
  const nextApp = {
    async prepare() {},
    getRequestHandler() {
      return (_req: NodeJS.ReadableStream, _res: NodeJS.WritableStream) => {};
    },
  } as never;
  const entrypoint = createEntrypoint({
    config: testConfig(),
    createWorker: () => worker,
    createNextApp: () => nextApp,
    logger: new JsonLogger({
      level: "debug",
      processInstanceId: "process-failure-test",
      workerInstanceId: "worker-failure-test",
      write: () => {},
    }),
  });

  const outcome = await entrypoint.start();
  assert.deepEqual(outcome, { kind: "degraded", status: "degraded", errorCode: "WORKER_START_FAILED" });
  const address = entrypoint.address();
  assert.ok(address && typeof address === "object");
  const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).status, "degraded");
  await entrypoint.shutdown("test");
});

test("shutdown has a bounded timeout and records the typed failure", async () => {
  const worker = new FakeWorker();
  worker.stopNever = true;
  const nextApp = {
    async prepare() {},
    getRequestHandler() {
      return (_req: NodeJS.ReadableStream, _res: NodeJS.WritableStream) => {};
    },
  } as never;
  const logs: string[] = [];
  const entrypoint = createEntrypoint({
    config: { ...testConfig(), shutdownTimeoutMs: 30 },
    createWorker: () => worker,
    createNextApp: () => nextApp,
    logger: new JsonLogger({
      level: "debug",
      processInstanceId: "process-timeout-test",
      workerInstanceId: "worker-timeout-test",
      write: (line) => logs.push(line),
    }),
  });

  await entrypoint.start();
  const startedAt = Date.now();
  const result = await entrypoint.shutdown("test");
  assert.equal(result.timedOut, true);
  assert.equal(result.errorCode, "SHUTDOWN_TIMEOUT");
  assert.ok(Date.now() - startedAt < 250);
  assert.equal(logs.some((line) => line.includes('"error_code":"SHUTDOWN_TIMEOUT"')), true);
});
