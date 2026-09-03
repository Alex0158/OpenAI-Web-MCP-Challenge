import assert from "node:assert/strict";
import { createServer, request as createRequest } from "node:http";
import test from "node:test";

import {
  RECEIVER_HTTP_LIMITS,
  RECEIVER_HTTP_ROUTES,
  STANDING_RECEIVER_HTTP_ROUTES,
  createCloudReceiverHttpHandler,
  createStandingCloudReceiverHttpHandler,
} from "../src/cloud-receiver-http.mjs";
import {
  ReceiverAuthorizationError,
  ReceiverConflictError,
} from "../src/receiver-core.mjs";
import {
  ProtocolValidationError,
  canonicalJson,
} from "../src/protocol.mjs";

function createReceiver(overrides = {}) {
  const calls = [];
  return {
    calls,
    acceptEvent(envelope) {
      calls.push({ method: "acceptEvent", value: envelope });
      return { accepted: true, duplicate: false };
    },
    claimDelivery(input) {
      calls.push({ method: "claimDelivery", value: input });
      return { duplicate: false, lease: { delivery_id: "delivery_1" } };
    },
    acknowledgeDelivery(input) {
      calls.push({ method: "acknowledgeDelivery", value: input });
      return { acknowledged: true, delivery_id: input.deliveryId };
    },
    ...overrides,
  };
}

async function startAdapter(t, receiver, createHandler = createCloudReceiverHttpHandler) {
  const server = createServer(createHandler({ receiver }));
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

async function post(origin, path, value, options = {}) {
  return fetch(`${origin}${path}`, {
    method: options.method ?? "POST",
    headers: {
      "Content-Type": options.contentType ?? "application/json",
      ...(options.headers ?? {}),
    },
    body: options.rawBody ?? JSON.stringify(value),
    redirect: "manual",
  });
}

async function postRawPath(origin, path, value) {
  const target = new URL(origin);
  const body = JSON.stringify(value);
  return new Promise((resolve, reject) => {
    const request = createRequest({
      host: target.hostname,
      port: target.port,
      method: "POST",
      path,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    }, resolve);
    request.once("error", reject);
    request.end(body);
  });
}

async function readJson(response) {
  const text = await response.text();
  return { text, value: JSON.parse(text) };
}

test("Cloud Receiver HTTP handler returns completion so lifecycle owners can await it", async () => {
  const receiver = createReceiver();
  const handler = createCloudReceiverHttpHandler({ receiver });
  let body;
  const response = {
    destroyed: false,
    headersSent: false,
    writeHead(status, headers) {
      this.status = status;
      this.headers = headers;
    },
    end(value) {
      body = value;
    },
  };

  const completion = handler({
    url: "/not-a-route",
    method: "GET",
    headers: {},
  }, response);
  assert.equal(typeof completion?.then, "function");
  await completion;
  assert.equal(response.status, 404);
  assert.deepEqual(JSON.parse(body), { error: { code: "http_route_not_found" } });
});

test("Cloud Receiver HTTP maps exact event, claim, no-work, and acknowledgement operations", async (t) => {
  let noWork = false;
  const receiver = createReceiver({
    claimDelivery(input) {
      this.calls.push({ method: "claimDelivery", value: input });
      return noWork ? null : { duplicate: false, lease: { delivery_id: "delivery_1" } };
    },
  });
  const origin = await startAdapter(t, receiver);
  const envelope = {
    body: "event-body",
    headers: {
      "WebMCP-Reentry-Key-Id": "host_key_001",
      "WebMCP-Reentry-Timestamp": "1788145500",
      "WebMCP-Reentry-Signature": "detached_signature",
    },
  };

  const event = await post(origin, RECEIVER_HTTP_ROUTES.event, envelope, {
    contentType: "application/json; charset=utf-8",
    rawBody: JSON.stringify(envelope, null, 2),
  });
  assert.equal(event.status, 202);
  assert.equal(event.headers.get("cache-control"), "no-store");
  const eventBody = await readJson(event);
  assert.equal(eventBody.text, canonicalJson(eventBody.value));
  assert.deepEqual(eventBody.value, { accepted: true, duplicate: false });

  const claim = await post(origin, RECEIVER_HTTP_ROUTES.claim, {
    connector_token: "connector_secret",
    claim_token: "claim_secret",
  });
  assert.equal(claim.status, 200);
  assert.deepEqual((await readJson(claim)).value, {
    duplicate: false,
    lease: { delivery_id: "delivery_1" },
  });

  noWork = true;
  const empty = await post(origin, RECEIVER_HTTP_ROUTES.claim, {
    connector_token: "connector_secret",
    claim_token: "next_claim_secret",
  });
  assert.equal(empty.status, 204);
  assert.equal(empty.headers.get("content-type"), null);
  assert.equal(await empty.text(), "");

  const acknowledgement = await post(origin, RECEIVER_HTTP_ROUTES.acknowledgement, {
    connector_token: "connector_secret",
    delivery_id: "delivery_1",
    lease_token: "claim_secret",
    effect_token: "effect_secret",
  });
  assert.equal(acknowledgement.status, 200);
  assert.deepEqual((await readJson(acknowledgement)).value, {
    acknowledged: true,
    delivery_id: "delivery_1",
  });
  assert.deepEqual(receiver.calls, [
    { method: "acceptEvent", value: envelope },
    {
      method: "claimDelivery",
      value: { connectorToken: "connector_secret", claimToken: "claim_secret" },
    },
    {
      method: "claimDelivery",
      value: { connectorToken: "connector_secret", claimToken: "next_claim_secret" },
    },
    {
      method: "acknowledgeDelivery",
      value: {
        connectorToken: "connector_secret",
        deliveryId: "delivery_1",
        leaseToken: "claim_secret",
        effectToken: "effect_secret",
      },
    },
  ]);
});

test("standing HTTP maps exact v0.2 routes without widening v0.1 routing", async (t) => {
  const receiver = createReceiver();
  const standingOrigin = await startAdapter(t, receiver, createStandingCloudReceiverHttpHandler);
  const legacyOrigin = await startAdapter(t, createReceiver());

  const standingClaim = await post(standingOrigin, STANDING_RECEIVER_HTTP_ROUTES.claim, {
    connector_token: "connector_secret",
    claim_token: "claim_secret",
  });
  assert.equal(standingClaim.status, 200);
  assert.deepEqual((await readJson(standingClaim)).value, {
    duplicate: false,
    lease: { delivery_id: "delivery_1" },
  });

  const legacyRouteOnStanding = await post(standingOrigin, RECEIVER_HTTP_ROUTES.claim, {
    connector_token: "connector_secret",
    claim_token: "claim_secret",
  });
  assert.equal(legacyRouteOnStanding.status, 404);
  assert.deepEqual((await readJson(legacyRouteOnStanding)).value, {
    error: { code: "http_route_not_found", retryable: false },
  });
  const standingRouteOnLegacy = await post(legacyOrigin, STANDING_RECEIVER_HTTP_ROUTES.claim, {
    connector_token: "connector_secret",
    claim_token: "claim_secret",
  });
  assert.equal(standingRouteOnLegacy.status, 404);
  assert.deepEqual(receiver.calls, [
    {
      method: "claimDelivery",
      value: { connectorToken: "connector_secret", claimToken: "claim_secret" },
    },
  ]);
});

test("standing HTTP exposes only a bounded retryable marker while v0.1 stays exact", async (t) => {
  function retryableReceiver() {
    return createReceiver({
      acceptEvent() {
        const error = new ReceiverConflictError(
          "activation_in_progress",
          "private standing activation detail",
        );
        Object.defineProperty(error, "retryable", { value: true, enumerable: true });
        throw error;
      },
    });
  }
  const standingOrigin = await startAdapter(
    t,
    retryableReceiver(),
    createStandingCloudReceiverHttpHandler,
  );
  const legacyOrigin = await startAdapter(t, retryableReceiver());
  const envelope = { body: "event-body", headers: {} };

  const standing = await post(standingOrigin, STANDING_RECEIVER_HTTP_ROUTES.event, envelope);
  assert.equal(standing.status, 409);
  const standingBody = await readJson(standing);
  assert.deepEqual(standingBody.value, {
    error: { code: "activation_in_progress", retryable: true },
  });
  assert.equal(standingBody.text.includes("private standing activation detail"), false);

  const legacy = await post(legacyOrigin, RECEIVER_HTTP_ROUTES.event, envelope);
  assert.equal(legacy.status, 409);
  assert.deepEqual((await readJson(legacy)).value, {
    error: { code: "activation_in_progress" },
  });
});

test("standing HTTP preserves typed protocol failures without changing v0.1 mapping", async (t) => {
  const receiver = createReceiver({
    acceptEvent() {
      throw new ProtocolValidationError(
        "event_body_noncanonical",
        "private canonicalization detail",
        422,
      );
    },
  });
  const standingOrigin = await startAdapter(
    t,
    receiver,
    createStandingCloudReceiverHttpHandler,
  );
  const legacyOrigin = await startAdapter(t, receiver);
  const envelope = { body: "event-body", headers: {} };

  const standing = await post(standingOrigin, STANDING_RECEIVER_HTTP_ROUTES.event, envelope);
  assert.equal(standing.status, 422);
  const standingBody = await readJson(standing);
  assert.deepEqual(standingBody.value, {
    error: { code: "event_body_noncanonical", retryable: false },
  });
  assert.equal(standingBody.text.includes("private canonicalization detail"), false);

  const legacy = await post(legacyOrigin, RECEIVER_HTTP_ROUTES.event, envelope);
  assert.equal(legacy.status, 500);
  assert.deepEqual((await readJson(legacy)).value, {
    error: { code: "receiver_internal_error" },
  });
});

test("Cloud Receiver HTTP rejects malformed transport input before Core invocation", async (t) => {
  const receiver = createReceiver();
  const origin = await startAdapter(t, receiver);

  const wrongMethod = await fetch(`${origin}${RECEIVER_HTTP_ROUTES.claim}`);
  assert.equal(wrongMethod.status, 405);
  assert.equal(wrongMethod.headers.get("allow"), "POST");
  assert.deepEqual((await readJson(wrongMethod)).value, {
    error: { code: "http_method_not_allowed" },
  });

  const query = await post(origin, `${RECEIVER_HTTP_ROUTES.claim}?target=other`, {});
  assert.equal(query.status, 404);
  const normalizedAlias = await postRawPath(origin, "/v0.1/ignored/../delivery-claims", {});
  assert.equal(normalizedAlias.statusCode, 404);
  const wrongType = await post(origin, RECEIVER_HTTP_ROUTES.claim, {}, {
    contentType: "text/plain",
  });
  assert.equal(wrongType.status, 415);
  const encoded = await post(origin, RECEIVER_HTTP_ROUTES.claim, {}, {
    headers: { "Content-Encoding": "gzip" },
  });
  assert.equal(encoded.status, 415);
  const invalidJson = await post(origin, RECEIVER_HTTP_ROUTES.claim, {}, {
    rawBody: "{",
  });
  assert.equal(invalidJson.status, 400);
  const extension = await post(origin, RECEIVER_HTTP_ROUTES.claim, {
    connector_token: "connector_secret",
    claim_token: "claim_secret",
    delivery_target_id: "target_other",
  });
  assert.equal(extension.status, 400);
  const oversized = await post(origin, RECEIVER_HTTP_ROUTES.claim, {}, {
    rawBody: JSON.stringify({ value: "x".repeat(RECEIVER_HTTP_LIMITS.requestBytes) }),
  });
  assert.equal(oversized.status, 413);
  assert.deepEqual(receiver.calls, []);
});

test("Cloud Receiver HTTP preserves bounded Core codes and redacts unknown failures", async (t) => {
  const receiver = createReceiver({
    claimDelivery({ claimToken }) {
      if (claimToken === "typed") {
        throw new ReceiverAuthorizationError("connector_identity_invalid", "private detail");
      }
      throw new Error("database path and bearer secret must not escape");
    },
  });
  const origin = await startAdapter(t, receiver);

  const typed = await post(origin, RECEIVER_HTTP_ROUTES.claim, {
    connector_token: "connector_secret",
    claim_token: "typed",
  });
  assert.equal(typed.status, 403);
  const typedBody = await readJson(typed);
  assert.deepEqual(typedBody.value, { error: { code: "connector_identity_invalid" } });
  assert.ok(!typedBody.text.includes("private detail"));

  const unknown = await post(origin, RECEIVER_HTTP_ROUTES.claim, {
    connector_token: "connector_secret",
    claim_token: "unknown",
  });
  assert.equal(unknown.status, 500);
  const unknownBody = await readJson(unknown);
  assert.deepEqual(unknownBody.value, { error: { code: "receiver_internal_error" } });
  assert.ok(!unknownBody.text.includes("database"));
  assert.ok(!unknownBody.text.includes("bearer"));
});
