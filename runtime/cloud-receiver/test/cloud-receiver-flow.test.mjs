import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { ReentryHostSdk } from "../../../reentry-core/src/host-sdk.mjs";
import { LocalConnectorClient } from "../../../reentry-core/src/local-connector-client.mjs";
import { PROTOCOL_VERSION } from "../../../reentry-core/src/protocol.mjs";
import {
  CONNECTOR_IDENTITY_TYPE,
  CONSENT_DECISION_TYPE,
  HOST_EFFECT_ATTESTATION_TYPE,
  HOST_EFFECT_OUTCOME,
} from "../../../reentry-core/src/receiver-core.mjs";
import { createCloudReceiverService } from "../src/cloud-receiver-service.mjs";
import { createSqliteReceiverComposition } from "../src/sqlite-composition.mjs";

const HOST_ORIGIN = "https://host.example";
const KEY_ID = "host_key_stage1_001";
const CONNECTOR_TOKEN = "connector_token_stage1_001";
const DECISION_TOKEN = "decision_token_stage1_001";
const EFFECT_TOKEN = "effect_token_stage1_001";
const CLAIM_TOKEN = Buffer.alloc(32, 7).toString("base64url");

test("generic event, claim, effect acknowledgement, and restart replay cross the shell", async (t) => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "cloud-receiver-stage1-"));
  const databasePath = join(temporaryDirectory, "receiver.sqlite");
  t.after(() => rm(temporaryDirectory, { recursive: true, force: true }));

  const keys = generateKeyPairSync("ed25519");
  const now = { value: new Date() };
  const decisions = new Map();
  const effects = new Map();
  let idSequence = 0;

  const createComposition = () => createSqliteReceiverComposition({
    databasePath,
    keyResolver({ issuerOrigin, keyId, purpose }) {
      if (
        issuerOrigin === HOST_ORIGIN &&
        keyId === KEY_ID &&
        ["manifest", "event"].includes(purpose)
      ) {
        return keys.publicKey;
      }
      return undefined;
    },
    consentAuthority: {
      verifyDecision({ challengeId, decisionToken }) {
        const decision = decisions.get(decisionToken);
        if (!decision || decision.challenge_id !== challengeId) {
          throw new Error("Unknown synthetic decision token");
        }
        return decision;
      },
    },
    grantControlAuthority: {
      verifyControl() {
        throw new Error("Grant control is outside the Stage 1 flow");
      },
    },
    connectorAuthority: {
      verifyConnector({ connectorToken }) {
        if (connectorToken !== CONNECTOR_TOKEN) {
          throw new Error("Unknown synthetic Connector token");
        }
        return connectorIdentity(now.value);
      },
    },
    effectAuthority: {
      verifyEffect({ effectToken }) {
        const effect = effects.get(effectToken);
        if (!effect) throw new Error("Unknown synthetic effect token");
        return effect;
      },
    },
    maximumGrantLifetimeMs: 30 * 60_000,
    leaseDurationMs: 60_000,
    maximumDeliveryAttempts: 3,
    clock: () => new Date(now.value),
    createId(prefix) {
      idSequence += 1;
      return `${prefix}_stage1_${idSequence}`;
    },
  });

  const host = new ReentryHostSdk({
    origin: HOST_ORIGIN,
    privateKey: keys.privateKey,
    keyId: KEY_ID,
    clock: () => new Date(now.value),
  });
  const canonicalUrl = `${HOST_ORIGIN}/workflows/workflow_stage1_001`;
  const manifest = host.issueManifest({
    manifestId: "manifest_stage1_001",
    correlationId: "correlation_stage1_001",
    offerExpiresAt: addMilliseconds(now.value, 5 * 60_000),
    workflow: {
      id: "workflow_stage1_001",
      type: "domain-neutral-workflow",
      stateVersion: 1,
      canonicalUrl,
    },
    display: {
      title: "Continue this workflow",
      reason: "The authoritative Host state changed.",
    },
    grantRequest: {
      eventType: "workflow.ready",
      grantExpiresAt: addMilliseconds(now.value, 20 * 60_000),
      humanBoundary: "explicit_receiver_consent",
    },
  });

  let composition = createComposition();
  const enrollment = composition.receiver.createConsentChallenge({
    manifest,
    expectedOrigin: HOST_ORIGIN,
  });
  decisions.set(DECISION_TOKEN, approvalDecision(
    enrollment.challenge.challenge_id,
    now.value,
  ));
  const approval = composition.receiver.decideConsent({
    challengeId: enrollment.challenge.challenge_id,
    decisionToken: DECISION_TOKEN,
  });
  const event = host.issueEvent({
    binding: approval.binding,
    eventId: "event_stage1_001",
    workflow: {
      id: "workflow_stage1_001",
      stateVersion: 2,
      canonicalUrl,
    },
  });

  let service = createCloudReceiverService(composition);
  let address = await service.start({ host: "127.0.0.1", port: 0 });
  const eventResponse = await fetch(`${address.origin}/v0.1/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: event.body, headers: event.headers }),
  });
  assert.equal(eventResponse.status, 202);
  const acceptance = await eventResponse.json();
  assert.equal(acceptance.event_id, "event_stage1_001");
  assert.equal(acceptance.duplicate, false);

  let connector = new LocalConnectorClient({
    baseUrl: address.origin,
    connectorToken: CONNECTOR_TOKEN,
    requestTimeoutMs: 2_000,
  });
  const claim = await connector.claimDelivery({ claimToken: CLAIM_TOKEN });
  assert.equal(claim.duplicate, false);
  assert.equal(claim.lease.event_id, "event_stage1_001");

  now.value = new Date(now.value.getTime() + 100);
  effects.set(EFFECT_TOKEN, effectAttestation(claim.lease, now.value));
  const acknowledgement = await connector.acknowledgeDelivery({
    deliveryId: claim.lease.delivery_id,
    leaseToken: CLAIM_TOKEN,
    effectToken: EFFECT_TOKEN,
  });
  assert.equal(acknowledgement.status, "acknowledged");
  assert.equal(acknowledgement.duplicate, false);
  await service.stop();

  composition = createComposition();
  service = createCloudReceiverService(composition);
  address = await service.start({ host: "127.0.0.1", port: 0 });
  connector = new LocalConnectorClient({
    baseUrl: address.origin,
    connectorToken: CONNECTOR_TOKEN,
    requestTimeoutMs: 2_000,
  });
  const replay = await connector.acknowledgeDelivery({
    deliveryId: claim.lease.delivery_id,
    leaseToken: CLAIM_TOKEN,
    effectToken: EFFECT_TOKEN,
  });
  assert.equal(replay.status, "acknowledged");
  assert.equal(replay.duplicate, true);
  await service.stop();

  const persisted = await readFile(databasePath);
  for (const rawToken of [CONNECTOR_TOKEN, CLAIM_TOKEN, DECISION_TOKEN, EFFECT_TOKEN]) {
    assert.equal(persisted.includes(Buffer.from(rawToken)), false);
  }
});

test("SQLite composition rejects memory and relative database fallbacks", () => {
  const authorities = {
    keyResolver() {
      return undefined;
    },
    consentAuthority: rejectingAuthority("verifyDecision"),
    grantControlAuthority: rejectingAuthority("verifyControl"),
    connectorAuthority: rejectingAuthority("verifyConnector"),
    effectAuthority: rejectingAuthority("verifyEffect"),
    maximumGrantLifetimeMs: 30 * 60_000,
    leaseDurationMs: 60_000,
    maximumDeliveryAttempts: 3,
  };
  assert.throws(
    () => createSqliteReceiverComposition({ databasePath: ":memory:", ...authorities }),
    /absolute file-backed path/,
  );
  assert.throws(
    () => createSqliteReceiverComposition({ databasePath: "receiver.sqlite", ...authorities }),
    /absolute file-backed path/,
  );
});

function approvalDecision(challengeId, decidedAt) {
  return {
    type: CONSENT_DECISION_TYPE,
    protocol_version: PROTOCOL_VERSION,
    decision_id: "decision_stage1_001",
    challenge_id: challengeId,
    action: "approve",
    subject_id: "subject_stage1_001",
    delivery_target_id: "target_stage1_001",
    decided_at: decidedAt.toISOString(),
  };
}

function connectorIdentity(referenceTime) {
  return {
    type: CONNECTOR_IDENTITY_TYPE,
    protocol_version: PROTOCOL_VERSION,
    connector_id: "connector_stage1_001",
    subject_id: "subject_stage1_001",
    delivery_target_id: "target_stage1_001",
    authenticated_at: addMilliseconds(referenceTime, -1_000),
    expires_at: addMilliseconds(referenceTime, 10 * 60_000),
  };
}

function effectAttestation(lease, confirmedAt) {
  return {
    type: HOST_EFFECT_ATTESTATION_TYPE,
    protocol_version: PROTOCOL_VERSION,
    effect_id: "effect_stage1_001",
    delivery_id: lease.delivery_id,
    event_id: lease.event_id,
    correlation_id: lease.continuation.correlation_id,
    workflow_id: lease.continuation.workflow_id,
    outcome: HOST_EFFECT_OUTCOME,
    confirmed_at: confirmedAt.toISOString(),
  };
}

function rejectingAuthority(method) {
  return {
    [method]() {
      throw new Error("Authority is outside this test");
    },
  };
}

function addMilliseconds(date, milliseconds) {
  return new Date(date.getTime() + milliseconds).toISOString();
}
