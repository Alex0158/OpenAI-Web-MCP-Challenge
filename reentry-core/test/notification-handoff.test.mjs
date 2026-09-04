import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";

import {
  ConnectorTransportError,
  LocalConnectorClient,
} from "../src/local-connector-client.mjs";
import {
  NOTIFICATION_HANDOFF_RECEIPT_TYPE,
  RUNTIME_ADMISSION_ATTESTATION_TYPE,
} from "../src/notification-handoff.mjs";
import { canonicalJson } from "../src/protocol.mjs";
import {
  STANDING_RECEIVER_HTTP_ROUTES,
} from "../src/receiver-http-contract.mjs";
import { STANDING_PROTOCOL_VERSION } from "../src/standing-protocol.mjs";

const CONNECTOR_TOKEN = "connector_secret";
const LEASE_TOKEN = Buffer.alloc(32, 3).toString("base64url");

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
  return `http://127.0.0.1:${address.port}`;
}

function attestation(overrides = {}) {
  return {
    type: RUNTIME_ADMISSION_ATTESTATION_TYPE,
    protocol_version: STANDING_PROTOCOL_VERSION,
    admission_id: "admission_001",
    adapter_id: "codex_desktop_v1",
    binding_generation: "a".repeat(64),
    delivery_id: "delivery_001",
    event_id: "event_001",
    handoff_id: "handoff_001",
    accepted_at: "2026-09-04T12:00:00.000Z",
    ...overrides,
  };
}

function receipt(overrides = {}) {
  return {
    type: NOTIFICATION_HANDOFF_RECEIPT_TYPE,
    protocol_version: STANDING_PROTOCOL_VERSION,
    delivery_id: "delivery_001",
    event_id: "event_001",
    handoff_id: "handoff_001",
    correlation_id: "correlation_001",
    workflow_id: "workflow_001",
    status: "handed_off",
    duplicate: false,
    runtime_admission_ref: "admission_001",
    ...overrides,
  };
}

test("Local Connector sends an exact standing notification handoff and normalizes its receipt", async (t) => {
  const requests = [];
  const origin = await startServer(t, async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    requests.push({ url: request.url, body: JSON.parse(Buffer.concat(chunks).toString("utf8")) });
    response.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(canonicalJson(receipt())),
    });
    response.end(canonicalJson(receipt()));
  });
  const client = new LocalConnectorClient({
    baseUrl: origin,
    connectorToken: CONNECTOR_TOKEN,
    requestTimeoutMs: 1_000,
    protocolVersion: STANDING_PROTOCOL_VERSION,
  });

  const result = await client.handoffNotification({
    deliveryId: "delivery_001",
    eventId: "event_001",
    leaseToken: LEASE_TOKEN,
    handoffId: "handoff_001",
    runtimeAdmissionAttestation: attestation(),
  });

  assert.deepEqual(result, receipt());
  assert.equal(Object.isFrozen(result), true);
  assert.deepEqual(requests, [{
    url: STANDING_RECEIVER_HTTP_ROUTES.handoff,
    body: {
      connector_token: CONNECTOR_TOKEN,
      delivery_id: "delivery_001",
      lease_token: LEASE_TOKEN,
      handoff_id: "handoff_001",
      runtime_admission_attestation: attestation(),
    },
  }]);
});

test("Local Connector rejects v0.1 and mismatched attestation before network I/O", async () => {
  const client = new LocalConnectorClient({
    baseUrl: "https://receiver.example",
    connectorToken: CONNECTOR_TOKEN,
    requestTimeoutMs: 1_000,
  });
  await assert.rejects(
    client.handoffNotification({
      deliveryId: "delivery_001",
      eventId: "event_001",
      leaseToken: LEASE_TOKEN,
      handoffId: "handoff_001",
      runtimeAdmissionAttestation: attestation(),
    }),
    (error) => error instanceof ConnectorTransportError
      && error.code === "connector_protocol_version_unsupported",
  );

  const standing = new LocalConnectorClient({
    baseUrl: "https://receiver.example",
    connectorToken: CONNECTOR_TOKEN,
    requestTimeoutMs: 1_000,
    protocolVersion: STANDING_PROTOCOL_VERSION,
  });
  await assert.rejects(
    standing.handoffNotification({
      deliveryId: "delivery_001",
      eventId: "event_001",
      leaseToken: LEASE_TOKEN,
      handoffId: "handoff_001",
      runtimeAdmissionAttestation: attestation({ event_id: "other_event" }),
    }),
    (error) => error instanceof ConnectorTransportError && error.code === "connector_input_invalid",
  );
});

test("Local Connector rejects a non-canonical or conflicting handoff receipt", async (t) => {
  const origin = await startServer(t, async (_request, response) => {
    const value = receipt({ handoff_id: "other_handoff" });
    const body = JSON.stringify(value, null, 2);
    response.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    });
    response.end(body);
  });
  const client = new LocalConnectorClient({
    baseUrl: origin,
    connectorToken: CONNECTOR_TOKEN,
    requestTimeoutMs: 1_000,
    protocolVersion: STANDING_PROTOCOL_VERSION,
  });
  await assert.rejects(
    client.handoffNotification({
      deliveryId: "delivery_001",
      eventId: "event_001",
      leaseToken: LEASE_TOKEN,
      handoffId: "handoff_001",
      runtimeAdmissionAttestation: attestation(),
    }),
    (error) => error instanceof ConnectorTransportError && error.code === "connector_response_invalid",
  );
});

test("Local Connector rejects a receipt for a different Event", async (t) => {
  const origin = await startServer(t, async (_request, response) => {
    const body = canonicalJson(receipt({ event_id: "other_event" }));
    response.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    });
    response.end(body);
  });
  const client = new LocalConnectorClient({
    baseUrl: origin,
    connectorToken: CONNECTOR_TOKEN,
    requestTimeoutMs: 1_000,
    protocolVersion: STANDING_PROTOCOL_VERSION,
  });
  await assert.rejects(
    client.handoffNotification({
      deliveryId: "delivery_001",
      eventId: "event_001",
      leaseToken: LEASE_TOKEN,
      handoffId: "handoff_001",
      runtimeAdmissionAttestation: attestation(),
    }),
    (error) => error instanceof ConnectorTransportError && error.code === "connector_response_invalid",
  );
});
