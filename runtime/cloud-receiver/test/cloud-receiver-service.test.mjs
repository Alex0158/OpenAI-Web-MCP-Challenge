import assert from "node:assert/strict";
import test from "node:test";

import {
  CLOUD_RECEIVER_OPERATIONAL_ROUTES,
  CLOUD_RECEIVER_SERVER_LIMITS,
  createCloudReceiverService,
} from "../src/cloud-receiver-service.mjs";
import {
  CloudReceiverConfigurationError,
  readCloudReceiverProcessConfig,
} from "../src/process-config.mjs";

test("Stage 1 shell exposes bounded operational routes and preserves Core HTTP delegation", async (t) => {
  let closeCount = 0;
  const accepted = {
    type: "webmcp.continuation_acceptance",
    protocol_version: "0.1",
    event_id: "event_stage1_001",
    duplicate: false,
    accepted: true,
  };
  const receiver = receiverStub({ acceptEvent: () => accepted });
  const service = createCloudReceiverService({
    receiver,
    close() {
      closeCount += 1;
    },
    readiness() {
      return true;
    },
  });
  t.after(() => service.stop());
  const address = await service.start({ host: "127.0.0.1", port: 0 });

  const health = await fetch(`${address.origin}${CLOUD_RECEIVER_OPERATIONAL_ROUTES.health}`);
  assert.equal(health.status, 200);
  assert.equal(health.headers.get("cache-control"), "no-store");
  assert.equal(health.headers.get("x-content-type-options"), "nosniff");
  assert.deepEqual(await health.json(), { status: "ok" });

  const readiness = await fetch(`${address.origin}${CLOUD_RECEIVER_OPERATIONAL_ROUTES.readiness}`);
  assert.equal(readiness.status, 200);
  assert.deepEqual(await readiness.json(), { status: "ready" });

  const methodFailure = await fetch(
    `${address.origin}${CLOUD_RECEIVER_OPERATIONAL_ROUTES.health}`,
    { method: "POST" },
  );
  assert.equal(methodFailure.status, 405);
  assert.equal(methodFailure.headers.get("allow"), "GET");
  assert.deepEqual(await methodFailure.json(), {
    error: { code: "http_method_not_allowed" },
  });

  const queryFailure = await fetch(`${address.origin}/healthz?details=true`);
  assert.equal(queryFailure.status, 404);
  assert.deepEqual(await queryFailure.json(), { error: { code: "http_route_not_found" } });

  const event = await fetch(`${address.origin}/v0.1/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: "signed-body", headers: {} }),
  });
  assert.equal(event.status, 202);
  assert.deepEqual(await event.json(), accepted);

  await service.stop();
  await service.stop();
  assert.equal(service.getState(), "stopped");
  assert.equal(closeCount, 1);
});

test("readiness failures are redacted and do not change liveness", async (t) => {
  const service = createCloudReceiverService({
    receiver: receiverStub(),
    close() {},
    readiness() {
      throw new Error("private database detail");
    },
  });
  t.after(() => service.stop());
  const address = await service.start({ host: "127.0.0.1", port: 0 });

  const readiness = await fetch(`${address.origin}/readyz`);
  assert.equal(readiness.status, 503);
  assert.equal(await readiness.text(), '{"status":"not_ready"}');

  const health = await fetch(`${address.origin}/healthz`);
  assert.equal(health.status, 200);
  assert.equal(await health.text(), '{"status":"ok"}');
});

test("readiness cannot report success after graceful shutdown begins", async () => {
  let releaseReadiness;
  let markReadinessStarted;
  const readinessStarted = new Promise((resolve) => {
    markReadinessStarted = resolve;
  });
  const readinessResult = new Promise((resolve) => {
    releaseReadiness = resolve;
  });
  const service = createCloudReceiverService({
    receiver: receiverStub(),
    close() {},
    async readiness() {
      markReadinessStarted();
      await readinessResult;
      return true;
    },
  });
  const address = await service.start({ host: "127.0.0.1", port: 0 });
  const responsePromise = fetch(`${address.origin}/readyz`);
  await readinessStarted;
  const stopPromise = service.stop();
  releaseReadiness();

  const response = await responsePromise;
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { status: "not_ready" });
  await stopPromise;
});

test("listener startup failure closes owned resources and cannot fall back", async (t) => {
  const first = createCloudReceiverService({
    receiver: receiverStub(),
    close() {},
    readiness: () => true,
  });
  t.after(() => first.stop());
  const address = await first.start({ host: "127.0.0.1", port: 0 });

  let secondCloseCount = 0;
  const second = createCloudReceiverService({
    receiver: receiverStub(),
    close() {
      secondCloseCount += 1;
    },
    readiness: () => true,
  });
  await assert.rejects(
    second.start({ host: "127.0.0.1", port: address.port }),
    { code: "EADDRINUSE" },
  );
  assert.equal(second.getState(), "stopped");
  assert.equal(secondCloseCount, 1);
});

test("process configuration accepts only an absolute composition and literal loopback", () => {
  assert.deepEqual(
    readCloudReceiverProcessConfig({
      CLOUD_RECEIVER_COMPOSITION_MODULE: "/srv/cloud-receiver/composition.mjs",
      CLOUD_RECEIVER_PORT: "43118",
    }),
    {
      host: "127.0.0.1",
      port: 43118,
      compositionModule: "/srv/cloud-receiver/composition.mjs",
    },
  );

  assert.throws(
    () => readCloudReceiverProcessConfig({
      CLOUD_RECEIVER_COMPOSITION_MODULE: "/srv/cloud-receiver/composition.mjs",
      CLOUD_RECEIVER_HOST: "0.0.0.0",
    }),
    (error) => error instanceof CloudReceiverConfigurationError &&
      error.code === "cloud_receiver_host_invalid",
  );
  assert.throws(
    () => readCloudReceiverProcessConfig({
      CLOUD_RECEIVER_COMPOSITION_MODULE: "./composition.mjs",
    }),
    { code: "cloud_receiver_composition_invalid" },
  );
  assert.throws(
    () => readCloudReceiverProcessConfig({
      CLOUD_RECEIVER_COMPOSITION_MODULE: "/srv/cloud-receiver/composition.mjs",
      CLOUD_RECEIVER_PORT: "65536",
    }),
    { code: "cloud_receiver_port_invalid" },
  );

  assert.deepEqual(CLOUD_RECEIVER_SERVER_LIMITS, {
    maxHeaderBytes: 16_384,
    maxHeaders: 32,
    headersTimeoutMs: 5_000,
    requestTimeoutMs: 10_000,
    socketTimeoutMs: 15_000,
    keepAliveTimeoutMs: 5_000,
    maxRequestsPerSocket: 100,
  });
});

function receiverStub(overrides = {}) {
  return {
    acceptEvent() {
      return { accepted: true };
    },
    claimDelivery() {
      return null;
    },
    acknowledgeDelivery() {
      return { acknowledged: true };
    },
    ...overrides,
  };
}
