import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";

import {
  ConnectorTransportError,
  LocalConnectorClient,
} from "../src/local-connector-client.mjs";
import {
  CONTINUATION_MODE,
  PROTOCOL_VERSION,
  RECEIPT_TYPE,
  canonicalJson,
} from "../src/protocol.mjs";
import {
  DELIVERY_ACKNOWLEDGEMENT_TYPE,
  DELIVERY_LEASE_TYPE,
} from "../src/receiver-core.mjs";
import { RECEIVER_HTTP_LIMITS } from "../src/cloud-receiver-http.mjs";

const CONNECTOR_TOKEN = "connector_secret";
const CLAIM_TOKEN = Buffer.alloc(32, 7).toString("base64url");

async function startServer(t, handler) {
  const server = createServer(handler);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const address = server.address();
  return { origin: `http://127.0.0.1:${address.port}`, server };
}

async function readRequest(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function writeJson(response, status, value, canonical = true) {
  const body = canonical ? canonicalJson(value) : JSON.stringify(value, null, 2);
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  response.end(body);
}

function leaseResult(overrides = {}) {
  const now = Date.now();
  const expiresAt = new Date(now + 60_000).toISOString();
  return {
    duplicate: false,
    lease: {
      type: DELIVERY_LEASE_TYPE,
      protocol_version: PROTOCOL_VERSION,
      delivery_id: "delivery_1",
      event_id: "event_1",
      attempt: 1,
      lease_token: CLAIM_TOKEN,
      lease_expires_at: new Date(now + 30_000).toISOString(),
      continuation: {
        correlation_id: "correlation_1",
        workflow_id: "workflow_1",
        event_type: "workflow_ready",
        event_sequence: 1,
        state_version: 2,
        occurred_at: new Date(now - 1_000).toISOString(),
        canonical_url: "https://host.example/workflows/workflow_1",
        instruction: "Review the approved workflow and prepare the next safe step.",
      },
      receipt: {
        type: RECEIPT_TYPE,
        protocol_version: PROTOCOL_VERSION,
        grant_id: "grant_1",
        correlation_id: "correlation_1",
        issuer_origin: "https://host.example",
        workflow_id: "workflow_1",
        event_type: "workflow_ready",
        canonical_url: "https://host.example/workflows/workflow_1",
        expires_at: expiresAt,
        human_boundary: "human_commit",
        continuation_mode: CONTINUATION_MODE,
      },
      ...overrides,
    },
  };
}

function acknowledgement(overrides = {}) {
  return {
    type: DELIVERY_ACKNOWLEDGEMENT_TYPE,
    protocol_version: PROTOCOL_VERSION,
    delivery_id: "delivery_1",
    event_id: "event_1",
    effect_id: "effect_1",
    acknowledged: true,
    duplicate: false,
    status: "acknowledged",
    ...overrides,
  };
}

function client(baseUrl, overrides = {}) {
  return new LocalConnectorClient({
    baseUrl,
    connectorToken: CONNECTOR_TOKEN,
    requestTimeoutMs: 1_000,
    ...overrides,
  });
}

test("Local Connector sends exact outbound claim and acknowledgement requests", async (t) => {
  const requests = [];
  const { origin } = await startServer(t, async (request, response) => {
    const body = await readRequest(request);
    requests.push({ url: request.url, body, contentType: request.headers["content-type"] });
    if (request.url === "/v0.1/delivery-claims") {
      writeJson(response, 200, leaseResult());
      return;
    }
    writeJson(response, 200, acknowledgement());
  });
  const connector = client(origin);
  await assert.rejects(
    connector.acknowledgeDelivery({
      deliveryId: "invalid id",
      leaseToken: CLAIM_TOKEN,
      effectToken: "effect_secret",
    }),
    { code: "connector_input_invalid" },
  );

  const claimed = await connector.claimDelivery({ claimToken: CLAIM_TOKEN });
  assert.equal(claimed.lease.lease_token, CLAIM_TOKEN);
  assert.equal(claimed.lease.receipt.grant_id, "grant_1");
  assert.equal(
    claimed.lease.continuation.instruction,
    "Review the approved workflow and prepare the next safe step.",
  );
  assert.equal(Object.isFrozen(claimed), true);
  assert.equal(Object.isFrozen(claimed.lease.receipt), true);
  const acknowledged = await connector.acknowledgeDelivery({
    deliveryId: claimed.lease.delivery_id,
    leaseToken: claimed.lease.lease_token,
    effectToken: "effect_secret",
  });
  assert.equal(acknowledged.acknowledged, true);
  assert.equal(Object.isFrozen(acknowledged), true);

  assert.deepEqual(requests, [
    {
      url: "/v0.1/delivery-claims",
      contentType: "application/json",
      body: canonicalJson({
        connector_token: CONNECTOR_TOKEN,
        claim_token: CLAIM_TOKEN,
      }),
    },
    {
      url: "/v0.1/delivery-acknowledgements",
      contentType: "application/json",
      body: canonicalJson({
        connector_token: CONNECTOR_TOKEN,
        delivery_id: "delivery_1",
        lease_token: CLAIM_TOKEN,
        effect_token: "effect_secret",
      }),
    },
  ]);
});

test("Local Connector treats 204 as no work and preserves bounded Receiver errors", async (t) => {
  let noWork = true;
  const { origin } = await startServer(t, async (request, response) => {
    await readRequest(request);
    if (noWork) {
      noWork = false;
      response.writeHead(204, { "Content-Length": 0 });
      response.end();
      return;
    }
    writeJson(response, 403, { error: { code: "connector_identity_invalid" } });
  });
  const connector = client(origin);
  assert.equal(await connector.claimDelivery({ claimToken: CLAIM_TOKEN }), null);
  await assert.rejects(
    connector.claimDelivery({ claimToken: CLAIM_TOKEN }),
    { code: "connector_identity_invalid", statusCode: 403 },
  );
});

test("Local Connector rejects insecure origins, redirects, and timeouts without fallback", async (t) => {
  assert.throws(
    () => client("http://receiver.example"),
    { code: "connector_origin_invalid" },
  );
  assert.throws(
    () => client("http://localhost:8080"),
    { code: "connector_origin_invalid" },
  );
  assert.throws(
    () => client("https://receiver.example/path"),
    { code: "connector_origin_invalid" },
  );

  let requests = 0;
  const redirect = await startServer(t, async (request, response) => {
    requests += 1;
    await readRequest(request);
    response.writeHead(302, { Location: "https://receiver.example/other" });
    response.end();
  });
  await assert.rejects(
    client(redirect.origin).claimDelivery({ claimToken: CLAIM_TOKEN }),
    { code: "connector_redirect_rejected", statusCode: 302 },
  );
  assert.equal(requests, 1);

  const timeout = await startServer(t, async (request) => {
    requests += 1;
    await readRequest(request);
  });
  await assert.rejects(
    client(timeout.origin, { requestTimeoutMs: 100 }).claimDelivery({ claimToken: CLAIM_TOKEN }),
    { code: "connector_request_timeout" },
  );
  assert.equal(requests, 2);
});

test("Local Connector rejects malformed, oversized, stale, and token-mismatched responses", async (t) => {
  const missingInstruction = leaseResult();
  delete missingInstruction.lease.continuation.instruction;
  const oversizedInstruction = leaseResult();
  oversizedInstruction.lease.continuation.instruction = "a".repeat(501);
  const responses = [
    { kind: "json", value: missingInstruction },
    { kind: "json", value: oversizedInstruction },
    { kind: "noncanonical", value: leaseResult() },
    { kind: "bom", value: leaseResult() },
    { kind: "json", value: leaseResult({ lease_token: Buffer.alloc(32, 8).toString("base64url") }) },
    {
      kind: "json",
      value: leaseResult({ lease_expires_at: new Date(Date.now() - 1).toISOString() }),
    },
    { kind: "oversized" },
    { kind: "truncated" },
  ];
  const { origin } = await startServer(t, async (request, response) => {
    await readRequest(request);
    const next = responses.shift();
    if (next.kind === "noncanonical") {
      writeJson(response, 200, next.value, false);
      return;
    }
    if (next.kind === "bom") {
      const body = Buffer.concat([
        Buffer.from([0xef, 0xbb, 0xbf]),
        Buffer.from(canonicalJson(next.value)),
      ]);
      response.writeHead(200, {
        "Content-Type": "application/json",
        "Content-Length": body.length,
      });
      response.end(body);
      return;
    }
    if (next.kind === "oversized") {
      const body = "x".repeat(RECEIVER_HTTP_LIMITS.responseBytes + 1);
      response.writeHead(200, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      });
      response.end(body);
      return;
    }
    if (next.kind === "truncated") {
      response.writeHead(200, {
        "Content-Type": "application/json",
        "Content-Length": 100,
      });
      response.write("{");
      response.destroy();
      return;
    }
    writeJson(response, 200, next.value);
  });
  const connector = client(origin);

  await assert.rejects(
    connector.claimDelivery({ claimToken: CLAIM_TOKEN }),
    { code: "connector_response_invalid" },
  );
  await assert.rejects(
    connector.claimDelivery({ claimToken: CLAIM_TOKEN }),
    { code: "connector_response_invalid" },
  );
  await assert.rejects(
    connector.claimDelivery({ claimToken: CLAIM_TOKEN }),
    { code: "connector_response_invalid" },
  );
  await assert.rejects(
    connector.claimDelivery({ claimToken: CLAIM_TOKEN }),
    { code: "connector_response_invalid" },
  );
  await assert.rejects(
    connector.claimDelivery({ claimToken: CLAIM_TOKEN }),
    { code: "connector_response_invalid" },
  );
  await assert.rejects(
    connector.claimDelivery({ claimToken: CLAIM_TOKEN }),
    { code: "connector_response_invalid" },
  );
  await assert.rejects(
    connector.claimDelivery({ claimToken: CLAIM_TOKEN }),
    { code: "connector_response_too_large", statusCode: 200 },
  );
  await assert.rejects(
    connector.claimDelivery({ claimToken: CLAIM_TOKEN }),
    { code: "connector_network_error" },
  );
  assert.equal(responses.length, 0);
});
