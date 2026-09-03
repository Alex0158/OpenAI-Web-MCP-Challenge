import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { LocalConnectorClient } from "../../../reentry-core/src/local-connector-client.mjs";
import { createHostSdk } from "../../host-sdk/src/server.mjs";
import { createCloudReceiverService } from "../src/cloud-receiver-service.mjs";
import { createLocalPreviewComposition } from "../src/local-preview-composition.mjs";

test("local preview composition wires pairing identity into the Receiver Core", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "cloud-receiver-local-preview-"));
  const composition = createLocalPreviewComposition({
    receiverDatabasePath: join(directory, "receiver.sqlite"),
    pairingDatabasePath: join(directory, "pairing.sqlite"),
    organizationId: "org_preview",
    hostApiKey: "host-preview-api-key",
    connectorTokenSecret: "connector-preview-secret",
    clock: () => new Date("2026-08-31T12:00:00.000Z"),
  });
  const service = createCloudReceiverService(composition);
  t.after(async () => {
    await service.stop();
    await rm(directory, { recursive: true, force: true });
  });

  const address = await service.start({ host: "127.0.0.1", port: 0 });
  const keys = generateKeyPairSync("ed25519");
  const hostSdk = createHostSdk({
    origin: "https://host.example",
    receiverOrigin: address.origin,
    privateKey: keys.privateKey,
    keyId: "host_key_preview_001",
    clock: () => new Date("2026-08-31T12:00:00.000Z"),
    createId: (prefix) => `${prefix}_preview_001`,
  });
  const registration = await jsonRequest(address.origin, "/v0.1/host-keys", {
    headers: { Authorization: "Bearer host-preview-api-key" },
    body: {
      host_id: "host_preview_001",
      issuer_origin: "https://host.example",
      key_id: "host_key_preview_001",
      public_key_pem: keys.publicKey.export({ type: "spki", format: "pem" }).toString(),
    },
  });
  assert.equal(registration.response.status, 201);
  const challenge = composition.receiver.createConsentChallenge({
    manifest: hostSdk.createManifest({
      offerExpiresAt: "2026-08-31T12:05:00.000Z",
      workflow: {
        id: "workflow_preview_001",
        type: "domain-neutral-workflow",
        stateVersion: 1,
        canonicalUrl: "https://host.example/workflows/workflow_preview_001",
      },
      display: {
        title: "Continue this workflow",
        reason: "The Host has a later step ready.",
      },
      grantRequest: {
        eventType: "workflow.ready",
        grantExpiresAt: "2026-08-31T12:20:00.000Z",
        humanBoundary: "explicit_receiver_consent",
      },
    }),
    expectedOrigin: "https://host.example",
  });
  assert.equal(challenge.challenge.status, "pending");

  const started = await jsonRequest(address.origin, "/v0.1/pairing-sessions", {
    headers: { Authorization: "Bearer host-preview-api-key" },
    body: { host_subject_ref: "host_user_preview" },
  });
  assert.equal(started.response.status, 201);

  const claim = await jsonRequest(address.origin, "/v0.1/pairing-sessions/claim", {
    body: { user_code: started.body.user_code },
  });
  assert.equal(claim.response.status, 200);
  const approval = await jsonRequest(address.origin, "/v0.1/pairing-sessions/approve", {
    body: { user_code: started.body.user_code },
  });
  assert.equal(approval.response.status, 200);
  const credentials = await jsonRequest(address.origin, "/v0.1/pairing-sessions/poll", {
    body: { device_code: claim.body.device_code },
  });
  assert.equal(credentials.response.status, 200);

  const connector = new LocalConnectorClient({
    baseUrl: address.origin,
    connectorToken: credentials.body.connector_token,
    requestTimeoutMs: 2_000,
  });
  assert.equal(await connector.claimDelivery({
    claimToken: Buffer.alloc(32, 4).toString("base64url"),
  }), null);
});

async function jsonRequest(origin, path, { headers = {}, body }) {
  const response = await fetch(`${origin}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { response, body: await response.json() };
}
