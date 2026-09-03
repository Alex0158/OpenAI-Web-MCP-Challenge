import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { LocalConnectorClient } from "../../../reentry-core/src/local-connector-client.mjs";
import { createHostSdk, HostSdkTransportError } from "../../host-sdk/src/server.mjs";
import { createCloudReceiverService } from "../src/cloud-receiver-service.mjs";
import { createLocalPreviewComposition } from "../src/local-preview-composition.mjs";

const HOST_API_KEY = "host-preview-api-key";
const CONNECTOR_SECRET = "connector-preview-secret";
const HOST_ORIGIN = "https://host.example";
const HOST_ID = "host_preview_001";
const KEY_ID = "host_key_preview_001";
const NOW = new Date(Date.now() + 60_000);

test("Host SDK consent session survives restart and creates one claimable delivery", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "cloud-receiver-consent-"));
  const receiverDatabasePath = join(directory, "receiver.sqlite");
  const pairingDatabasePath = join(directory, "pairing.sqlite");
  const keys = generateKeyPairSync("ed25519");
  let service;
  let sequence = 0;

  const createComposition = () => createLocalPreviewComposition({
    receiverDatabasePath,
    pairingDatabasePath,
    organizationId: "org_preview",
    hostApiKey: HOST_API_KEY,
    connectorTokenSecret: CONNECTOR_SECRET,
    clock: () => new Date(NOW),
  });

  t.after(async () => {
    await service?.stop();
    await rm(directory, { recursive: true, force: true });
  });

  let composition = createComposition();
  service = createCloudReceiverService(composition);
  let address = await service.start({ host: "127.0.0.1", port: 0 });
  const sdkOptions = {
    origin: HOST_ORIGIN,
    receiverOrigin: address.origin,
    privateKey: keys.privateKey,
    keyId: KEY_ID,
    organizationApiKey: HOST_API_KEY,
    clock: () => new Date(NOW),
    createId(prefix) {
      sequence += 1;
      return `${prefix}_consent_${sequence}`;
    },
  };
  let sdk = createHostSdk(sdkOptions);

  const registration = await sdk.registerHostKey({ hostId: HOST_ID });
  assert.equal(registration.status, "active");
  assert.equal(registration.duplicate, false);

  const pairing = await pairHostUser(address.origin, "host_user_consent");
  const manifest = sdk.createManifest({
    offerExpiresAt: after(NOW, 5 * 60_000),
    workflow: {
      id: "workflow_consent_001",
      type: "domain-neutral-workflow",
      stateVersion: 1,
      canonicalUrl: `${HOST_ORIGIN}/workflows/workflow_consent_001`,
    },
    display: {
      title: "Continue this workflow",
      reason: "The Host has a later step ready for your review.",
    },
    grantRequest: {
      eventType: "workflow.ready",
      grantExpiresAt: after(NOW, 20 * 60_000),
      humanBoundary: "explicit_receiver_consent",
    },
  });

  const session = await sdk.createConsentSession({
    manifest,
    hostSubjectRef: "host_user_consent",
  });
  assert.equal(session.type, "webmcp.reentry_consent_session");
  assert.equal(session.challenge.status, "pending");
  assert.match(session.consent_token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal("subject_id" in session, false);
  assert.equal("delivery_target_id" in session, false);

  const duplicateSession = await sdk.createConsentSession({
    manifest,
    hostSubjectRef: "host_user_consent",
  });
  assert.equal(duplicateSession.duplicate, true);
  assert.equal(duplicateSession.consent_token, session.consent_token);
  assert.equal(duplicateSession.challenge.challenge_id, session.challenge.challenge_id);

  const approval = await sdk.decideConsent({
    challengeId: session.challenge.challenge_id,
    consentToken: session.consent_token,
    hostSubjectRef: "host_user_consent",
    action: "approve",
  });
  assert.equal(approval.status, "approved");
  assert.equal(approval.duplicate, false);
  assert.equal(typeof approval.binding.binding_id, "string");
  assert.equal("grant_id" in approval.binding, false);
  assert.equal("subject_id" in approval.binding, false);
  assert.equal("delivery_target_id" in approval.binding, false);

  const approvalReplay = await sdk.decideConsent({
    challengeId: session.challenge.challenge_id,
    consentToken: session.consent_token,
    hostSubjectRef: "host_user_consent",
    action: "approve",
  });
  assert.equal(approvalReplay.duplicate, true);
  assert.deepEqual(approvalReplay.binding, approval.binding);

  await assert.rejects(
    () => sdk.decideConsent({
      challengeId: session.challenge.challenge_id,
      consentToken: session.consent_token,
      hostSubjectRef: "host_user_consent",
      action: "decline",
    }),
    (error) => {
      assert.ok(error instanceof HostSdkTransportError);
      assert.equal(error.code, "consent_decision_identity_conflict");
      assert.equal(error.statusCode, 409);
      return true;
    },
  );

  await service.stop();
  composition = createComposition();
  service = createCloudReceiverService(composition);
  address = await service.start({ host: "127.0.0.1", port: 0 });
  sdk = createHostSdk({ ...sdkOptions, receiverOrigin: address.origin });

  const registrationReplay = await sdk.registerHostKey({ hostId: HOST_ID });
  assert.equal(registrationReplay.duplicate, true);
  const sessionReplay = await sdk.createConsentSession({
    manifest,
    hostSubjectRef: "host_user_consent",
  });
  assert.equal(sessionReplay.duplicate, true);
  const approvalAfterRestart = await sdk.decideConsent({
    challengeId: session.challenge.challenge_id,
    consentToken: session.consent_token,
    hostSubjectRef: "host_user_consent",
    action: "approve",
  });
  assert.equal(approvalAfterRestart.duplicate, true);
  assert.deepEqual(approvalAfterRestart.binding, approval.binding);

  const acceptance = await sdk.sendEvent({
    binding: approval.binding,
    eventId: "event_consent_001",
    workflow: {
      id: "workflow_consent_001",
      stateVersion: 2,
      canonicalUrl: `${HOST_ORIGIN}/workflows/workflow_consent_001`,
    },
  });
  assert.equal(acceptance.accepted, true);
  assert.equal(acceptance.duplicate, false);

  const connector = new LocalConnectorClient({
    baseUrl: address.origin,
    connectorToken: pairing.connectorToken,
    requestTimeoutMs: 2_000,
  });
  const claim = await connector.claimDelivery({
    claimToken: Buffer.alloc(32, 11).toString("base64url"),
  });
  assert.equal(claim.duplicate, false);
  assert.equal(claim.lease.event_id, "event_consent_001");
  assert.equal(claim.lease.continuation.workflow_id, "workflow_consent_001");

  for (const filename of [
    receiverDatabasePath,
    `${receiverDatabasePath}-wal`,
    `${receiverDatabasePath}-shm`,
    pairingDatabasePath,
    `${pairingDatabasePath}-wal`,
    `${pairingDatabasePath}-shm`,
  ]) {
    const persisted = await readOptional(filename);
    for (const secret of [HOST_API_KEY, CONNECTOR_SECRET, session.consent_token, pairing.connectorToken]) {
      assert.equal(persisted.includes(Buffer.from(secret)), false, `${filename} contains a raw secret`);
    }
  }
});

test("consent session requires a paired Host subject and fences a decline", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "cloud-receiver-consent-negative-"));
  const receiverDatabasePath = join(directory, "receiver.sqlite");
  const pairingDatabasePath = join(directory, "pairing.sqlite");
  const keys = generateKeyPairSync("ed25519");
  const composition = createLocalPreviewComposition({
    receiverDatabasePath,
    pairingDatabasePath,
    organizationId: "org_preview",
    hostApiKey: HOST_API_KEY,
    connectorTokenSecret: CONNECTOR_SECRET,
    clock: () => new Date(NOW),
  });
  const service = createCloudReceiverService(composition);
  t.after(async () => {
    await service.stop();
    await rm(directory, { recursive: true, force: true });
  });
  const address = await service.start({ host: "127.0.0.1", port: 0 });
  const sdk = createHostSdk({
    origin: HOST_ORIGIN,
    receiverOrigin: address.origin,
    privateKey: keys.privateKey,
    keyId: "host_key_negative_001",
    organizationApiKey: HOST_API_KEY,
    clock: () => new Date(NOW),
  });
  await sdk.registerHostKey({ hostId: "host_negative_001" });
  const manifest = sdk.createManifest({
    offerExpiresAt: after(NOW, 5 * 60_000),
    workflow: {
      id: "workflow_consent_negative",
      type: "domain-neutral-workflow",
      stateVersion: 1,
      canonicalUrl: `${HOST_ORIGIN}/workflows/workflow_consent_negative`,
    },
    display: {
      title: "Review continuation",
      reason: "A later step is ready.",
    },
    grantRequest: {
      eventType: "workflow.ready",
      grantExpiresAt: after(NOW, 20 * 60_000),
      humanBoundary: "explicit_receiver_consent",
    },
  });

  await assert.rejects(
    () => sdk.createConsentSession({ manifest, hostSubjectRef: "host_user_unpaired" }),
    (error) => {
      assert.ok(error instanceof HostSdkTransportError);
      assert.equal(error.code, "host_subject_not_paired");
      assert.equal(error.statusCode, 409);
      return true;
    },
  );

  await pairHostUser(address.origin, "host_user_decline");
  const session = await sdk.createConsentSession({
    manifest,
    hostSubjectRef: "host_user_decline",
  });
  const declined = await sdk.decideConsent({
    challengeId: session.challenge.challenge_id,
    consentToken: session.consent_token,
    hostSubjectRef: "host_user_decline",
    action: "decline",
  });
  assert.deepEqual(
    { status: declined.status, duplicate: declined.duplicate, hasBinding: "binding" in declined },
    { status: "declined", duplicate: false, hasBinding: false },
  );
  const replay = await sdk.decideConsent({
    challengeId: session.challenge.challenge_id,
    consentToken: session.consent_token,
    hostSubjectRef: "host_user_decline",
    action: "decline",
  });
  assert.equal(replay.duplicate, true);
});

async function pairHostUser(origin, hostSubjectRef) {
  const started = await jsonRequest(origin, "/v0.1/pairing-sessions", {
    headers: { Authorization: `Bearer ${HOST_API_KEY}` },
    body: { host_subject_ref: hostSubjectRef },
  });
  assert.equal(started.response.status, 201);
  const claim = await jsonRequest(origin, "/v0.1/pairing-sessions/claim", {
    body: { user_code: started.body.user_code },
  });
  assert.equal(claim.response.status, 200);
  const approval = await jsonRequest(origin, "/v0.1/pairing-sessions/approve", {
    body: { user_code: started.body.user_code },
  });
  assert.equal(approval.response.status, 200);
  const credentials = await jsonRequest(origin, "/v0.1/pairing-sessions/poll", {
    body: { device_code: claim.body.device_code },
  });
  assert.equal(credentials.response.status, 200);
  return { connectorToken: credentials.body.connector_token };
}

async function jsonRequest(origin, path, { headers = {}, body }) {
  const response = await fetch(`${origin}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { response, body: await response.json() };
}

async function readOptional(filename) {
  try {
    return await readFile(filename);
  } catch (error) {
    if (error.code === "ENOENT") return Buffer.alloc(0);
    throw error;
  }
}

function after(date, milliseconds) {
  return new Date(date.getTime() + milliseconds).toISOString();
}
