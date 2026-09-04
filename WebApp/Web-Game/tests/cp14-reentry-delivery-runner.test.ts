import assert from "node:assert/strict";
import { test } from "node:test";

import { createEntrypoint } from "../src/server/entrypoint";
import { loadRuntimeConfig } from "../src/server/config";
import type { WorldAdvanceListener, WorldWorker } from "../src/server/world-worker";
import { PersistenceError } from "../src/server/persistence/store";
import { ReentryDeliveryRunner } from "../src/server/reentry-delivery-runner";
import type { ReentryPumpResult } from "../src/server/reentry-delivery-port";

function accepted(signalId: string): ReentryPumpResult {
  return {
    kind: "accepted",
    signalId,
    envelope: {} as Extract<ReentryPumpResult, { kind: "accepted" }>["envelope"],
    outcome: "ACCEPTED",
    delivery: {} as Extract<ReentryPumpResult, { kind: "accepted" }>["delivery"],
  };
}

function flush(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

function fakeNextApp() {
  return {
    async prepare() {},
    getRequestHandler() {
      return (_request: unknown, response: { statusCode: number; end(body?: string): void }) => {
        response.statusCode = 200;
        response.end("next");
      };
    },
  };
}

test("delivery runner coalesces worker wakes behind one in-flight pump", async () => {
  const calls: Array<{ nowWallTimeMs: number; leaseId: string }> = [];
  let releaseFirst: (() => void) | undefined;
  const firstComplete = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  const outcomes: ReentryPumpResult[] = [accepted("signal-1"), accepted("signal-2")];
  const results: ReentryPumpResult[] = [];
  const runner = new ReentryDeliveryRunner({
    port: {
      async pumpOnce(input) {
        calls.push({ nowWallTimeMs: input.nowWallTimeMs, leaseId: input.leaseId });
        if (calls.length === 1) await firstComplete;
        return outcomes.shift() as ReentryPumpResult;
      },
    },
    worldId: "world-1",
    nowWallTimeMs: () => 123,
    leaseId: () => "runner-lease-1",
    onResult: (result) => results.push(result),
  });

  runner.start();
  runner.requestWake();
  runner.requestWake();
  await flush();
  assert.equal(calls.length, 1);
  assert.equal(runner.snapshot().inFlight, true);
  assert.equal(runner.snapshot().pendingWake, true);

  releaseFirst?.();
  await flush();
  await flush();
  assert.deepEqual(calls, [
    { nowWallTimeMs: 123, leaseId: "runner-lease-1" },
    { nowWallTimeMs: 123, leaseId: "runner-lease-1" },
  ]);
  assert.deepEqual(results.map((result) => result.signalId), ["signal-1", "signal-2"]);
  assert.equal(runner.snapshot().pendingWake, false);
  assert.equal(runner.snapshot().inFlight, false);
  await runner.stop();
  assert.equal(runner.state, "stopped");
});

test("delivery runner surfaces pump failures and waits for a later wake", async () => {
  const errors: unknown[] = [];
  let calls = 0;
  const runner = new ReentryDeliveryRunner({
    port: {
      async pumpOnce() {
        calls += 1;
        if (calls === 1) throw new PersistenceError("RECOVERY_REQUIRED");
        return { kind: "idle", signalId: null };
      },
    },
    worldId: "world-1",
    onError: (error) => errors.push(error),
  });

  runner.start();
  await flush();
  assert.equal(calls, 1);
  assert.equal(errors.length, 1);
  assert.equal((errors[0] as PersistenceError).code, "RECOVERY_REQUIRED");
  assert.equal(runner.snapshot().pendingWake, false);

  runner.requestWake();
  await flush();
  assert.equal(calls, 2);
  await runner.stop();
});

test("delivery runner stops before accepting new wakes and waits for in-flight work", async () => {
  let release: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let calls = 0;
  const runner = new ReentryDeliveryRunner({
    port: {
      async pumpOnce() {
        calls += 1;
        await pending;
        return { kind: "idle", signalId: null };
      },
    },
    worldId: "world-1",
  });

  runner.start();
  await flush();
  const stopped = runner.stop();
  runner.requestWake();
  assert.equal(runner.state, "draining");
  assert.equal(calls, 1);
  release?.();
  await stopped;
  assert.equal(runner.state, "stopped");
  assert.equal(runner.snapshot().inFlight, false);
});

test("entrypoint requests delivery only after an authoritative world boundary", async () => {
  const advanceListeners: WorldAdvanceListener[] = [];
  const worker = {
    instanceId: "worker-cp14-boundary-wake",
    state: "created" as const,
    onFault() {},
    onAdvance(listener: WorldAdvanceListener) {
      advanceListeners.push(listener);
    },
    async start() {
      (this as { state: "ready" }).state = "ready";
    },
    async stop() {
      (this as { state: "stopped" }).state = "stopped";
    },
  } as unknown as WorldWorker & { emitAdvance: (result: { worldTime: number; processedBoundaries: number }) => void };
  worker.emitAdvance = (result) => {
    for (const listener of advanceListeners) listener(result);
  };

  let wakeCalls = 0;
  let startCalls = 0;
  let stopCalls = 0;
  const runner = {
    start() {
      startCalls += 1;
    },
    requestWake() {
      wakeCalls += 1;
    },
    async stop() {
      stopCalls += 1;
    },
  };
  const entrypoint = createEntrypoint({
    config: loadRuntimeConfig({ PORT: "0", NODE_ENV: "test" }),
    createNextApp: () => fakeNextApp(),
    createWorker: () => worker,
    reentryDeliveryRunner: runner,
  });

  try {
    await entrypoint.start();
    assert.equal(startCalls, 1);

    worker.emitAdvance({ worldTime: 0, processedBoundaries: 0 });
    worker.emitAdvance({ worldTime: 0, processedBoundaries: 0 });
    assert.equal(wakeCalls, 0);

    worker.emitAdvance({ worldTime: 1, processedBoundaries: 1 });
    worker.emitAdvance({ worldTime: 3, processedBoundaries: 2 });
    assert.equal(wakeCalls, 2);
  } finally {
    await entrypoint.shutdown("test");
  }
  assert.equal(stopCalls, 1);
});
