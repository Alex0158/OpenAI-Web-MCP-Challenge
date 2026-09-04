import assert from "node:assert/strict";
import test from "node:test";

import { LocalConnectorPairingClient } from "../src/pairing-client.mjs";

const BASE_URL = "https://receiver.example";
const CONNECTOR_TOKEN = "A".repeat(43);
const EXPIRY = "2026-10-02T12:00:00.000Z";

test("account pairing accepts the first response shape and sends the normalized code", async (t) => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (url, init) => {
    requests.push({ url, init });
    return jsonResponse({
      type: "webmcp.connector_credentials",
      protocol_version: "0.1",
      pairing_id: "pairing_123",
      connector_id: "connector_123",
      connector_token: CONNECTOR_TOKEN,
      connector_expires_at: EXPIRY,
      duplicate: false,
    });
  };

  const client = new LocalConnectorPairingClient({ baseUrl: BASE_URL });
  const credentials = await client.connectWithPairingCode({
    pairingId: "pairing_123",
    pairingCode: "abcd-ef12",
    deviceName: "My Mac",
  });

  assert.equal(credentials.connector_token, CONNECTOR_TOKEN);
  assert.equal(credentials.duplicate, false);
  assert.equal(credentials.browserOpened, false);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, `${BASE_URL}/v0.1/account/pairing-sessions/claim`);
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    pairing_id: "pairing_123",
    pairing_code: "ABCDEF12",
    device_name: "My Mac",
  });
  assert.equal(requests[0].init.headers.Authorization, undefined);
});

test("account pairing treats a tokenless duplicate as an already-existing credential", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => jsonResponse({
    type: "webmcp.connector_credentials",
    protocol_version: "0.1",
    pairing_id: "pairing_123",
    connector_id: "connector_123",
    connector_expires_at: EXPIRY,
    duplicate: true,
  });

  const client = new LocalConnectorPairingClient({ baseUrl: BASE_URL });
  await assert.rejects(
    client.connectWithPairingCode({ pairingId: "pairing_123", pairingCode: "ABCDEF12", deviceName: "Renamed Mac" }),
    (error) => {
      assert.equal(error.code, "connector_credentials_already_exists");
      assert.equal(error.statusCode, 200);
      assert.match(error.message, /existing Connector credential|new pairing/);
      assert.doesNotMatch(error.message, new RegExp(CONNECTOR_TOKEN));
      return true;
    },
  );
});

test("account pairing rejects the wrong tokenless-replay shapes", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  const client = new LocalConnectorPairingClient({ baseUrl: BASE_URL });
  const invalidResponses = [
    {
      type: "webmcp.connector_credentials",
      protocol_version: "0.1",
      pairing_id: "pairing_123",
      connector_id: "connector_123",
      connector_expires_at: EXPIRY,
      duplicate: false,
    },
    {
      type: "webmcp.connector_credentials",
      protocol_version: "0.1",
      pairing_id: "pairing_123",
      connector_id: "connector_123",
      connector_token: CONNECTOR_TOKEN,
      connector_expires_at: EXPIRY,
      duplicate: true,
    },
  ];

  for (const body of invalidResponses) {
    globalThis.fetch = async () => jsonResponse(body);
    await assert.rejects(
      client.connectWithPairingCode({ pairingId: "pairing_123", pairingCode: "ABCDEF12", deviceName: "My Mac" }),
      (error) => error.code === "pairing_response_invalid",
    );
  }
});

test("Connector disconnection sends only the saved token and accepts exact replay-safe status", async (t) => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (url, init) => {
    requests.push({ url, init });
    return jsonResponse({
      type: "webmcp.connector_disconnection",
      protocol_version: "0.1",
      status: "disconnected",
      duplicate: false,
    });
  };

  const client = new LocalConnectorPairingClient({ baseUrl: BASE_URL });
  const result = await client.disconnectConnector({ connectorToken: CONNECTOR_TOKEN });

  assert.deepEqual(result, { status: "disconnected", duplicate: false });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, `${BASE_URL}/v0.1/connectors/disconnect`);
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    connector_token: CONNECTOR_TOKEN,
  });
  assert.equal(requests[0].init.headers.Authorization, undefined);
});

test("Connector disconnection rejects a malformed response", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => jsonResponse({
    type: "webmcp.connector_disconnection",
    protocol_version: "0.1",
    status: "disconnected",
    duplicate: false,
    connector_token: CONNECTOR_TOKEN,
  });

  const client = new LocalConnectorPairingClient({ baseUrl: BASE_URL });
  await assert.rejects(
    client.disconnectConnector({ connectorToken: CONNECTOR_TOKEN }),
    (error) => error.code === "pairing_response_invalid",
  );
});

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
