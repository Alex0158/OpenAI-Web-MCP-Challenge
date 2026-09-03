import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createContinuationReceipt } from "@webmcp-challenge/reentry-core/protocol";
import { LocalConnectorClient } from "@webmcp-challenge/reentry-core/local-connector-client";
import { createCloudReceiverService } from "../../cloud-receiver/src/cloud-receiver-service.mjs";
import { createPairingControlPlane } from "../../cloud-receiver/src/pairing-control.mjs";
import { PairingStore } from "../../cloud-receiver/src/pairing-store.mjs";
import { LocalConnectorCredentialStore } from "../src/credentials.mjs";
import { LocalConnector } from "../src/local-connector.mjs";
import { LocalConnectorPairingClient } from "../src/pairing-client.mjs";

const HOST_API_KEY = "host-preview-api-key";
const CONNECTOR_SECRET = "connector-preview-secret";

test("pairing client opens the approval page and receives credentials without exposing them", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "local-connector-pairing-"));
  const filename = join(directory, "pairing.sqlite");
  const store = new PairingStore({ filename });
  let sequence = 0;
  const control = createPairingControlPlane({
    store,
    organizationId: "org_preview",
    hostApiKey: HOST_API_KEY,
    connectorTokenSecret: CONNECTOR_SECRET,
    pairingLifetimeMs: 5 * 60_000,
    connectorLifetimeMs: 24 * 60 * 60_000,
    clock: () => new Date("2026-08-31T12:00:00.000Z"),
    createId(prefix) {
      sequence += 1;
      return `${prefix}_connector_${sequence}`;
    },
  });
  const service = createCloudReceiverService({
    receiver: receiverStub(),
    controlHandler: control.handler,
    close() {},
    readiness: () => control.readiness(),
  });
  t.after(async () => {
    await service.stop();
    control.close();
    await rm(directory, { recursive: true, force: true });
  });
  const address = await service.start({ host: "127.0.0.1", port: 0 });
  const started = await jsonRequest(address.origin, "/v0.1/pairing-sessions", {
    headers: { Authorization: `Bearer ${HOST_API_KEY}` },
    body: { host_subject_ref: "host_user_001" },
  });
  assert.equal(started.response.status, 201);

  const rejectedClient = new LocalConnectorPairingClient({
    baseUrl: address.origin,
    openBrowser: async () => false,
    sleep: async () => {},
  });
  await assert.rejects(
    rejectedClient.pair({ userCode: "0000-0000-0000-0000" }),
    (error) => error.code === "pairing_not_found" && error.statusCode === 404,
  );

  let openedUrl;
  const client = new LocalConnectorPairingClient({
    baseUrl: address.origin,
    openBrowser: async (url) => {
      openedUrl = url;
      const page = await fetch(url);
      assert.equal(page.status, 200);
      const approval = await jsonRequest(address.origin, "/v0.1/pairing-sessions/approve", {
        body: { user_code: started.body.user_code },
      });
      assert.equal(approval.response.status, 200);
      return true;
    },
    sleep: async () => {},
  });
  const credentials = await client.pair({ userCode: started.body.user_code });
  assert.equal(openedUrl, started.body.verification_uri);
  assert.match(credentials.connector_token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(credentials.browserOpened, true);

  const credentialFile = join(directory, "credentials.json");
  const credentialStore = new LocalConnectorCredentialStore({ filename: credentialFile });
  await credentialStore.save({
    version: 1,
    receiver_origin: address.origin,
    connector_id: credentials.connector_id,
    connector_token: credentials.connector_token,
    connector_expires_at: credentials.connector_expires_at,
  });
  const loaded = await credentialStore.load();
  assert.equal(loaded.connector_id, credentials.connector_id);
  assert.equal((await stat(credentialFile)).mode & 0o077, 0);
  assert.equal((await readFile(credentialFile, "utf8")).includes(credentials.connector_token), true);
});

test("Local Connector claims one lease and invokes the typed adapter without lease credentials", async (t) => {
  const now = new Date("2026-08-31T12:00:00.000Z");
  const claimToken = Buffer.alloc(32, 8).toString("base64url");
  const lease = deliveryLease(claimToken);
  let adapterInput;
  let claimedToken;
  const service = createCloudReceiverService({
    receiver: {
      acceptEvent() {
        return {};
      },
      claimDelivery(input) {
        claimedToken = input.claimToken;
        return { duplicate: false, lease };
      },
      acknowledgeDelivery() {
        return {};
      },
    },
    close() {},
    readiness: () => true,
  });
  t.after(() => service.stop());
  const address = await service.start({ host: "127.0.0.1", port: 0 });
  const connectorClient = new LocalConnectorClient({
    baseUrl: address.origin,
    connectorToken: "connector-preview-token",
    requestTimeoutMs: 2_000,
  });
  const connector = new LocalConnector({
    client: connectorClient,
    adapter: {
      activate(input) {
        adapterInput = input;
        return {
          type: "webmcp.agent_activation_result",
          protocol_version: "0.1",
          delivery_id: input.delivery_id,
          event_id: input.event_id,
          attempt: input.attempt,
          outcome: "accepted",
          code: "activation_dispatch_accepted",
          unavailable_capability: null,
        };
      },
    },
    clock: () => new Date(now),
    activationTimeoutMs: 2_000,
    createClaimToken: () => claimToken,
  });

  const result = await connector.runOnce();
  assert.equal(claimedToken, claimToken);
  assert.equal(result.status, "activation_result");
  assert.equal(result.delivery_id, lease.delivery_id);
  assert.equal(result.result.outcome, "accepted");
  assert.equal("lease_token" in adapterInput, false);
  assert.equal("connector_token" in adapterInput, false);
  assert.equal("receipt" in adapterInput, true);
  assert.equal(
    adapterInput.continuation.instruction,
    "Review the approved workflow and prepare the next safe step.",
  );
});

function receiverStub() {
  return {
    acceptEvent() {
      return {};
    },
    claimDelivery() {
      return null;
    },
    acknowledgeDelivery() {
      return {};
    },
  };
}

function deliveryLease(leaseToken) {
  const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
  const receipt = createContinuationReceipt({
    type: "webmcp.continuation_receipt",
    protocol_version: "0.1",
    grant_id: "grant_connector_001",
    correlation_id: "correlation_connector_001",
    issuer_origin: "https://host.example",
    workflow_id: "workflow_connector_001",
    event_type: "workflow.ready",
    canonical_url: "https://host.example/workflows/workflow_connector_001",
    expires_at: expiresAt,
    human_boundary: "explicit_receiver_consent",
    continuation_mode: "open_canonical_page_read_current_state",
  });
  return {
    type: "webmcp.delivery_lease",
    protocol_version: "0.1",
    delivery_id: "delivery_connector_001",
    event_id: "event_connector_001",
    attempt: 1,
    lease_token: leaseToken,
    lease_expires_at: expiresAt,
    continuation: {
      correlation_id: "correlation_connector_001",
      workflow_id: "workflow_connector_001",
      event_type: "workflow.ready",
      event_sequence: 1,
      state_version: 2,
      occurred_at: "2026-08-31T12:00:00.000Z",
      canonical_url: "https://host.example/workflows/workflow_connector_001",
      instruction: "Review the approved workflow and prepare the next safe step.",
    },
    receipt,
  };
}

async function jsonRequest(origin, path, { headers = {}, body }) {
  const response = await fetch(`${origin}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { response, body: await response.json() };
}
