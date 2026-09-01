import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createHostSdk } from "../../host-sdk/src/server.mjs";
import { LocalConnectorClient } from "../../../reentry-core/src/local-connector-client.mjs";
import {
  CONNECTOR_IDENTITY_TYPE,
  CONSENT_DECISION_TYPE,
} from "../../../reentry-core/src/receiver-core.mjs";
import { PROTOCOL_VERSION } from "../../../reentry-core/src/protocol.mjs";
import { createCloudReceiverService } from "../src/cloud-receiver-service.mjs";
import {
  CLOUD_RECEIVER_HOST_KEY_ROUTES,
  createHostKeyControlPlane,
} from "../src/host-key-control.mjs";
import { createSqliteReceiverComposition } from "../src/sqlite-composition.mjs";
import { PairingStore } from "../src/pairing-store.mjs";

const HOST_API_KEY = "host-preview-api-key";
const HOST_ORIGIN = "https://host.example";
const HOST_ID = "host_preview_001";
const KEY_ID = "host_key_preview_001";
const CONNECTOR_TOKEN = "connector-preview-token";
const CLAIM_TOKEN = Buffer.alloc(32, 9).toString("base64url");
const NOW = new Date();

test("Host public-key registration is authenticated, idempotent, and durable", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "cloud-receiver-host-key-"));
  const filename = join(directory, "pairing.sqlite");
  const keys = generateKeyPairSync("ed25519");
  const publicKeyPem = keys.publicKey.export({ type: "spki", format: "pem" }).toString();
  const store = new PairingStore({ filename });
  const control = createHostKeyControlPlane({
    store,
    organizationId: "org_preview",
    hostApiKey: HOST_API_KEY,
    clock: () => new Date(NOW),
  });
  const service = createCloudReceiverService({
    receiver: receiverStub(),
    controlHandler: control.handler,
    close() {},
    readiness: () => control.readiness(),
  });
  t.after(async () => {
    await service.stop();
    controlStoreClose(control, store);
    await rm(directory, { recursive: true, force: true });
  });

  const address = await service.start({ host: "127.0.0.1", port: 0 });
  const unauthorized = await postJson(address.origin, {
    headers: { Authorization: "Bearer wrong-key" },
    body: registrationBody(publicKeyPem),
  });
  assert.equal(unauthorized.response.status, 403);
  assert.deepEqual(unauthorized.body, { error: { code: "organization_auth_invalid" } });

  const registered = await postJson(address.origin, {
    headers: { Authorization: `Bearer ${HOST_API_KEY}` },
    body: registrationBody(publicKeyPem),
  });
  assert.equal(registered.response.status, 201);
  assert.deepEqual(registered.body, {
    type: "webmcp.host_key_registration",
    protocol_version: PROTOCOL_VERSION,
    organization_id: "org_preview",
    host_id: HOST_ID,
    issuer_origin: HOST_ORIGIN,
    key_id: KEY_ID,
    status: "active",
    duplicate: false,
  });
  assert.equal("public_key_pem" in registered.body, false);

  const duplicate = await postJson(address.origin, {
    headers: { Authorization: `Bearer ${HOST_API_KEY}` },
    body: registrationBody(publicKeyPem),
  });
  assert.equal(duplicate.response.status, 200);
  assert.equal(duplicate.body.duplicate, true);

  const invalid = await postJson(address.origin, {
    headers: { Authorization: `Bearer ${HOST_API_KEY}` },
    body: registrationBody("not-a-public-key"),
  });
  assert.equal(invalid.response.status, 422);
  assert.deepEqual(invalid.body, { error: { code: "host_public_key_invalid" } });

  const otherKeys = generateKeyPairSync("ed25519");
  const conflict = await postJson(address.origin, {
    headers: { Authorization: `Bearer ${HOST_API_KEY}` },
    body: registrationBody(otherKeys.publicKey.export({ type: "spki", format: "pem" }).toString()),
  });
  assert.equal(conflict.response.status, 409);
  assert.deepEqual(conflict.body, { error: { code: "host_key_identity_conflict" } });

  const persisted = await readPersistence(filename);
  assert.equal(persisted.includes(Buffer.from(HOST_API_KEY)), false);
  assert.equal(persisted.includes(Buffer.from(publicKeyPem)), true);

  await service.stop();
  controlStoreClose(control, store);
  const restartedStore = new PairingStore({ filename });
  const restartedControl = createHostKeyControlPlane({
    store: restartedStore,
    organizationId: "org_preview",
    hostApiKey: HOST_API_KEY,
    clock: () => new Date(NOW),
  });
  assert.equal(
    restartedControl.resolveKey({
      issuerOrigin: HOST_ORIGIN,
      keyId: KEY_ID,
      purpose: "event",
    }).asymmetricKeyType,
    "ed25519",
  );
  assert.equal(restartedControl.resolveKey({
    issuerOrigin: HOST_ORIGIN,
    keyId: KEY_ID,
    purpose: "other",
  }), undefined);
  restartedStore.close();
});

test("Pairing store migrates an existing v1 database before registering a Host key", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "cloud-receiver-host-key-migration-"));
  const filename = join(directory, "pairing.sqlite");
  t.after(() => rm(directory, { recursive: true, force: true }));

  const initial = new PairingStore({ filename });
  initial.close();
  const legacy = new DatabaseSync(filename);
  legacy.exec("DROP TABLE cloud_host_signing_keys; PRAGMA user_version = 1;");
  legacy.close();

  const migrated = new PairingStore({ filename });
  const keys = generateKeyPairSync("ed25519");
  const result = migrated.registerHostKey({
    organization_id: "org_preview",
    host_id: HOST_ID,
    issuer_origin: HOST_ORIGIN,
    key_id: KEY_ID,
    public_key_pem: keys.publicKey.export({ type: "spki", format: "pem" }).toString(),
    created_at: NOW.toISOString(),
  });
  assert.equal(result.duplicate, false);
  assert.equal(result.record.host_id, HOST_ID);
  migrated.close();
});

test("registered Host event is verified by Reentry and creates a claimable delivery", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "cloud-receiver-event-ingress-"));
  const receiverDatabasePath = join(directory, "receiver.sqlite");
  const pairingDatabasePath = join(directory, "pairing.sqlite");
  const keys = generateKeyPairSync("ed25519");
  const store = new PairingStore({ filename: pairingDatabasePath });
  const hostKeys = createHostKeyControlPlane({
    store,
    organizationId: "org_preview",
    hostApiKey: HOST_API_KEY,
    clock: () => new Date(NOW),
  });
  const decisions = new Map();
  let idSequence = 0;
  const composition = createSqliteReceiverComposition({
    databasePath: receiverDatabasePath,
    keyResolver: hostKeys.resolveKey,
    consentAuthority: {
      verifyDecision({ challengeId, decisionToken }) {
        const decision = decisions.get(decisionToken);
        if (!decision || decision.challenge_id !== challengeId) {
          throw new Error("Unknown decision token");
        }
        return decision;
      },
    },
    grantControlAuthority: rejectingAuthority(),
    connectorAuthority: {
      verifyConnector({ connectorToken }) {
        if (connectorToken !== CONNECTOR_TOKEN) throw new Error("Unknown Connector token");
        return {
          type: CONNECTOR_IDENTITY_TYPE,
          protocol_version: PROTOCOL_VERSION,
          connector_id: "connector_preview_001",
          subject_id: "subject_preview_001",
          delivery_target_id: "target_preview_001",
          authenticated_at: new Date(NOW.getTime() - 1_000).toISOString(),
          expires_at: new Date(NOW.getTime() + 10 * 60_000).toISOString(),
        };
      },
    },
    effectAuthority: rejectingAuthority(),
    maximumGrantLifetimeMs: 30 * 60_000,
    leaseDurationMs: 60_000,
    maximumDeliveryAttempts: 3,
    clock: () => new Date(NOW),
    createId(prefix) {
      idSequence += 1;
      return `${prefix}_preview_${idSequence}`;
    },
  });
  const service = createCloudReceiverService({
    receiver: composition.receiver,
    controlHandler: hostKeys.handler,
    close() {
      composition.close();
      store.close();
    },
    readiness: () => composition.readiness() && hostKeys.readiness(),
  });
  t.after(async () => {
    await service.stop();
    await rm(directory, { recursive: true, force: true });
  });

  const address = await service.start({ host: "127.0.0.1", port: 0 });
  const registration = await postJson(address.origin, {
    headers: { Authorization: `Bearer ${HOST_API_KEY}` },
    body: registrationBody(keys.publicKey.export({ type: "spki", format: "pem" }).toString()),
  });
  assert.equal(registration.response.status, 201);

  const sdk = createHostSdk({
    origin: HOST_ORIGIN,
    receiverOrigin: address.origin,
    privateKey: keys.privateKey,
    keyId: KEY_ID,
    clock: () => new Date(NOW),
    createId: (prefix) => `${prefix}_host_001`,
  });
  const canonicalUrl = `${HOST_ORIGIN}/workflows/workflow_preview_001`;
  const manifest = sdk.createManifest({
    offerExpiresAt: new Date(NOW.getTime() + 5 * 60_000).toISOString(),
    workflow: {
      id: "workflow_preview_001",
      type: "domain-neutral-workflow",
      stateVersion: 1,
      canonicalUrl,
    },
    display: {
      title: "Continue this workflow",
      reason: "The Host has a later step ready.",
    },
    grantRequest: {
      eventType: "workflow.ready",
      grantExpiresAt: new Date(NOW.getTime() + 20 * 60_000).toISOString(),
      humanBoundary: "explicit_receiver_consent",
    },
  });
  const enrollment = composition.receiver.createConsentChallenge({
    manifest,
    expectedOrigin: HOST_ORIGIN,
  });
  const decisionToken = "decision-preview-token";
  decisions.set(decisionToken, {
    type: CONSENT_DECISION_TYPE,
    protocol_version: PROTOCOL_VERSION,
    decision_id: "decision_preview_001",
    challenge_id: enrollment.challenge.challenge_id,
    action: "approve",
    subject_id: "subject_preview_001",
    delivery_target_id: "target_preview_001",
    decided_at: NOW.toISOString(),
  });
  const approval = composition.receiver.decideConsent({
    challengeId: enrollment.challenge.challenge_id,
    decisionToken,
  });
  const acceptance = await sdk.sendEvent({
    binding: approval.binding,
    eventId: "event_preview_001",
    workflow: {
      id: "workflow_preview_001",
      stateVersion: 2,
      canonicalUrl,
    },
  });
  assert.equal(acceptance.accepted, true);
  assert.equal(acceptance.duplicate, false);

  const connector = new LocalConnectorClient({
    baseUrl: address.origin,
    connectorToken: CONNECTOR_TOKEN,
    requestTimeoutMs: 2_000,
  });
  const claim = await connector.claimDelivery({ claimToken: CLAIM_TOKEN });
  assert.equal(claim.duplicate, false);
  assert.equal(claim.lease.event_id, "event_preview_001");
  assert.equal(claim.lease.delivery_id.startsWith("delivery_preview_"), true);
});

function registrationBody(publicKeyPem) {
  return {
    host_id: HOST_ID,
    issuer_origin: HOST_ORIGIN,
    key_id: KEY_ID,
    public_key_pem: publicKeyPem,
  };
}

async function postJson(origin, { headers = {}, body }) {
  const response = await fetch(`${origin}${CLOUD_RECEIVER_HOST_KEY_ROUTES.register}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { response, body: await response.json() };
}

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

function rejectingAuthority() {
  return {
    verifyControl() {
      throw new Error("unsupported");
    },
    verifyEffect() {
      throw new Error("unsupported");
    },
  };
}

function controlStoreClose(control, store) {
  void control;
  store.close();
}

async function readPersistence(filename) {
  const buffers = [];
  for (const path of [filename, `${filename}-wal`, `${filename}-shm`]) {
    try {
      buffers.push(await readFile(path));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return Buffer.concat(buffers);
}
