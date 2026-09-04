import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  STANDING_CONNECTOR_IDENTITY_TYPE,
  STANDING_CONSENT_DECISION_TYPE,
  STANDING_GRANT_CONTROL_AUTHORIZATION_TYPE,
  STANDING_HOST_EFFECT_ATTESTATION_TYPE,
  STANDING_HOST_EFFECT_OUTCOME,
  StandingAuthorizationCore,
} from "../src/standing-authorization-core.mjs";
import {
  STANDING_PROTOCOL_VERSION,
  createStandingContinuationEvent,
  createStandingContinuationEventEnvelope,
  createStandingReentryManifest,
  validateStandingReentryManifest,
  verifyStandingContinuationEventEnvelope,
} from "../src/standing-protocol.mjs";
import { SqliteReceiverStore } from "../src/sqlite-receiver-store.mjs";
import { createTestKeys } from "./fixtures.mjs";

const HOST_ORIGIN = "https://game.example";
const FIXED_NOW = new Date("2026-09-03T12:00:00.000Z");
const GRANT_EXPIRY = "2026-10-03T12:00:00.000Z";
const KEY_ID = "standing_host_key_001";
const ROTATED_KEY_ID = "standing_host_key_002";

test("one Consent authorizes two sequential signals, applies backpressure, survives restart, and revokes", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "webmcp-standing-authorization-"));
  const filename = join(directory, "receiver.sqlite");
  t.after(() => rm(directory, { recursive: true, force: true }));

  const keys = createTestKeys();
  const rotatedKeys = createTestKeys();
  const decisions = new Map();
  const controls = new Map();
  const connectors = new Map();
  const effects = new Map();
  const clockRef = { value: new Date(FIXED_NOW) };
  let consentVerificationCount = 0;
  let resolvedPrimaryKey = keys.publicKey;

  const authorities = {
    keyResolver({ issuerOrigin, keyId, purpose }) {
      if (issuerOrigin !== HOST_ORIGIN || !["manifest", "event"].includes(purpose)) return undefined;
      if (keyId === KEY_ID) return resolvedPrimaryKey;
      if (keyId === ROTATED_KEY_ID) return rotatedKeys.publicKey;
      return undefined;
    },
    consentAuthority: {
      verifyDecision({ decisionToken }) {
        consentVerificationCount += 1;
        const decision = decisions.get(decisionToken);
        if (!decision) throw new Error("Unknown Consent decision token");
        return decision;
      },
    },
    grantControlAuthority: {
      verifyControl({ controlToken }) {
        const control = controls.get(controlToken);
        if (!control) throw new Error("Unknown Grant control token");
        return control;
      },
    },
    connectorAuthority: {
      verifyConnector({ connectorToken }) {
        const connector = connectors.get(connectorToken);
        if (!connector) throw new Error("Unknown Connector token");
        return connector;
      },
    },
    effectAuthority: {
      verifyEffect({ effectToken, expected }) {
        const effect = effects.get(effectToken);
        if (!effect) throw new Error("Unknown Host-effect token");
        return typeof effect === "function" ? effect(expected) : effect;
      },
    },
  };

  const createCore = (store, createId = deterministicIdSource()) =>
    new StandingAuthorizationCore({
      store,
      ...authorities,
      maximumGrantLifetimeMs: 90 * 24 * 60 * 60 * 1_000,
      leaseDurationMs: 60 * 1_000,
      clock: () => clockRef.value,
      createId,
    });

  let store = new SqliteReceiverStore({ filename });
  let core = createCore(store);
  const manifest = createStandingReentryManifest(manifestValue(), {
    privateKey: keys.privateKey,
    keyId: KEY_ID,
  });
  const enrollment = core.createConsentChallenge({
    manifest,
    expectedOrigin: HOST_ORIGIN,
  });
  decisions.set("approve_once", approvalDecision(enrollment.challenge.challenge_id));
  const approval = core.decideConsent({
    challengeId: enrollment.challenge.challenge_id,
    decisionToken: "approve_once",
  });

  assert.equal(consentVerificationCount, 1);
  assert.equal(approval.status, "approved");
  assert.equal(approval.binding.authorization_mode, "standing");
  assert.equal(approval.binding.last_event_sequence, 0);
  assert.equal(approval.binding.max_active_activations, 1);
  assert.equal("receipt" in approval, false);
  assert.equal("grant_id" in approval, false);
  const privateGrant = store.getStandingGrantByBindingId(approval.binding.binding_id);
  assert.equal(privateGrant.issuer_key_id, KEY_ID);
  assert.equal(privateGrant.issuer_key_fingerprint, keyFingerprintFor(keys.publicKey));
  assert.equal(JSON.stringify(approval).includes(privateGrant.grant_id), false);

  const wrongKeySignal = signedSignal(
    rotatedKeys,
    approval.binding,
    1,
    "event_wrong_consented_key_001",
    1,
    { keyId: ROTATED_KEY_ID },
  );
  assert.throws(
    () => core.acceptEvent(wrongKeySignal.envelope),
    { code: "event_key_scope_invalid", statusCode: 401 },
  );
  assert.equal(store.getStandingEventById(wrongKeySignal.event.event_id), undefined);
  assert.equal(
    store.getStandingGrantByBindingId(approval.binding.binding_id).last_event_sequence,
    0,
  );

  resolvedPrimaryKey = rotatedKeys.publicKey;
  const reboundKeySignal = signedSignal(
    rotatedKeys,
    approval.binding,
    1,
    "event_rebound_same_key_id_001",
    1,
  );
  assert.throws(
    () => core.acceptEvent(reboundKeySignal.envelope),
    { code: "event_key_material_scope_invalid", statusCode: 401 },
  );
  assert.equal(store.getStandingEventById(reboundKeySignal.event.event_id), undefined);
  assert.equal(
    store.getStandingGrantByBindingId(approval.binding.binding_id).last_event_sequence,
    0,
  );
  resolvedPrimaryKey = keys.publicKey;

  const first = signedSignal(keys, approval.binding, 1, "event_signal_001", 1);
  const second = signedSignal(keys, approval.binding, 2, "event_signal_002", 2);
  const third = signedSignal(keys, approval.binding, 3, "event_signal_003", 3);

  assert.deepEqual(core.acceptEvent(first.envelope), {
    type: "webmcp.continuation_acceptance",
    protocol_version: STANDING_PROTOCOL_VERSION,
    event_id: first.event.event_id,
    correlation_id: first.event.correlation_id,
    accepted: true,
    duplicate: false,
    status: "accepted",
  });

  assert.throws(
    () => core.acceptEvent(second.envelope),
    (error) => error.code === "activation_in_progress" && error.retryable === true,
  );
  assert.equal(store.getStandingEventById(second.event.event_id), undefined);
  assert.equal(
    store.getStandingGrantByBindingId(approval.binding.binding_id).last_event_sequence,
    1,
  );

  connectors.set("connector_token", connectorIdentity());
  const firstClaimToken = claimToken(1);
  const firstLease = core.claimDelivery({
    connectorToken: "connector_token",
    claimToken: firstClaimToken,
  }).lease;
  effects.set("effect_1", effectFor(firstLease, "effect_signal_001", clockRef.value));
  assert.equal(core.acknowledgeDelivery({
    connectorToken: "connector_token",
    deliveryId: firstLease.delivery_id,
    leaseToken: firstClaimToken,
    effectToken: "effect_1",
  }).status, "acknowledged");

  assert.equal(core.acceptEvent(second.envelope).accepted, true);
  assert.equal(consentVerificationCount, 1);
  const secondClaimToken = claimToken(2);
  const secondLease = core.claimDelivery({
    connectorToken: "connector_token",
    claimToken: secondClaimToken,
  }).lease;
  effects.set(
    "effect_conflict",
    effectFor(secondLease, "effect_signal_001", clockRef.value),
  );
  assert.throws(
    () => core.acknowledgeDelivery({
      connectorToken: "connector_token",
      deliveryId: secondLease.delivery_id,
      leaseToken: secondClaimToken,
      effectToken: "effect_conflict",
    }),
    (error) => error.code === "effect_identity_conflict",
  );
  effects.set("effect_2", effectFor(secondLease, "effect_signal_002", clockRef.value));
  assert.equal(core.acknowledgeDelivery({
    connectorToken: "connector_token",
    deliveryId: secondLease.delivery_id,
    leaseToken: secondClaimToken,
    effectToken: "effect_2",
  }).status, "acknowledged");

  store.close();
  store = new SqliteReceiverStore({ filename });
  assert.equal(
    store.getStandingGrantByBindingId(approval.binding.binding_id).issuer_key_fingerprint,
    keyFingerprintFor(keys.publicKey),
  );
  core = createCore(store, () => {
    throw new Error("Restart verification must not create a new identifier");
  });
  t.after(() => store.close());

  controls.set("inspect_token", grantControl(
    approval.binding.binding_id,
    "inspect",
  ));
  const summary = core.inspectGrant({
    bindingId: approval.binding.binding_id,
    controlToken: "inspect_token",
  });
  assert.equal(summary.status, "active");
  assert.equal(summary.last_event_sequence, 2);
  assert.equal(summary.active_activations, 0);

  controls.set("revoke_token", grantControl(
    approval.binding.binding_id,
    "revoke",
  ));
  assert.equal(core.revokeGrant({
    bindingId: approval.binding.binding_id,
    controlToken: "revoke_token",
  }).status, "revoked");

  store.close();
  store = new SqliteReceiverStore({ filename });
  core = createCore(store, () => {
    throw new Error("Revocation restart verification must not create a new identifier");
  });
  const revokedSummary = core.inspectGrant({
    bindingId: approval.binding.binding_id,
    controlToken: "inspect_token",
  });
  assert.equal(revokedSummary.status, "revoked");
  assert.equal(revokedSummary.revoked_at, FIXED_NOW.toISOString());

  assert.throws(
    () => core.acceptEvent(third.envelope),
    (error) => error.code === "grant_revoked",
  );
  assert.equal(store.getStandingEventById(third.event.event_id), undefined);
  assert.deepEqual(core.acceptEvent(first.envelope), {
    type: "webmcp.continuation_acceptance",
    protocol_version: STANDING_PROTOCOL_VERSION,
    event_id: first.event.event_id,
    correlation_id: first.event.correlation_id,
    accepted: true,
    duplicate: true,
    status: "accepted",
  });
  assert.equal(consentVerificationCount, 1);

  const duplicateApproval = core.decideConsent({
    challengeId: enrollment.challenge.challenge_id,
    decisionToken: "approve_once",
  });
  assert.equal(duplicateApproval.duplicate, true);
  assert.equal(duplicateApproval.binding.status, "revoked");
  assert.equal("receipt" in duplicateApproval, false);

  decisions.set("approve_conflict", {
    ...approvalDecision(enrollment.challenge.challenge_id),
    delivery_target_id: "target_002",
  });
  assert.throws(
    () => core.decideConsent({
      challengeId: enrollment.challenge.challenge_id,
      decisionToken: "approve_conflict",
    }),
    (error) => error.code === "consent_decision_identity_conflict",
  );
  assert.equal(consentVerificationCount, 3);
});

test("notification handoff persists one trusted admission and replays after revocation", (t) => {
  let admissionCalls = 0;
  const harness = createApprovedHarness(t, {
    runtimeAdmissionAuthority: {
      verifyAdmission({ attestation, expected }) {
        admissionCalls += 1;
        assert.equal(attestation.delivery_id, expected.delivery_id);
        assert.equal(attestation.event_id, expected.event_id);
        assert.equal(attestation.handoff_id, "handoff_notification_001");
        return attestation;
      },
    },
  });
  const signal = signedSignal(
    harness.keys,
    harness.approval.binding,
    1,
    "event_notification_handoff_001",
    1,
  );
  harness.core.acceptEvent(signal.envelope);
  const leaseToken = claimToken(9);
  const lease = harness.core.claimDelivery({
    connectorToken: "connector_token",
    claimToken: leaseToken,
  }).lease;
  const runtimeAdmissionAttestation = {
    type: "webmcp.runtime_admission_attestation",
    protocol_version: STANDING_PROTOCOL_VERSION,
    admission_id: "admission_notification_001",
    adapter_id: "codex_desktop_v1",
    binding_generation: "b".repeat(64),
    delivery_id: lease.delivery_id,
    event_id: lease.event_id,
    handoff_id: "handoff_notification_001",
    accepted_at: FIXED_NOW.toISOString(),
  };
  const result = harness.core.handoffNotification({
    connectorToken: "connector_token",
    deliveryId: lease.delivery_id,
    leaseToken,
    handoffId: "handoff_notification_001",
    runtimeAdmissionAttestation,
  });
  assert.equal(result.status, "handed_off");
  assert.equal(result.duplicate, false);
  assert.equal(admissionCalls, 1);
  assert.equal(harness.store.getStandingDeliveryById(lease.delivery_id).status, "terminal");
  assert.equal(
    harness.store.getStandingDeliveryById(lease.delivery_id).terminal_reason,
    "notification_handoff",
  );

  harness.clockRef.value = new Date(FIXED_NOW.getTime() + 1_000);
  harness.core.revokeGrant({
    bindingId: harness.approval.binding.binding_id,
    controlToken: "revoke_once",
  });
  const replay = harness.core.handoffNotification({
    connectorToken: "connector_token",
    deliveryId: lease.delivery_id,
    leaseToken,
    handoffId: "handoff_notification_001",
    runtimeAdmissionAttestation,
  });
  assert.equal(replay.duplicate, true);
  assert.deepEqual({ ...replay, duplicate: false }, result);
  assert.equal(admissionCalls, 1);
});

test("notification handoff replay rejects inconsistent persisted admission evidence", (t) => {
  const harness = createApprovedHarness(t, {
    runtimeAdmissionAuthority: {
      verifyAdmission({ attestation }) {
        return attestation;
      },
    },
  });
  const signal = signedSignal(
    harness.keys,
    harness.approval.binding,
    1,
    "event_notification_handoff_private_state_001",
    1,
  );
  harness.core.acceptEvent(signal.envelope);
  const leaseToken = claimToken(10);
  const lease = harness.core.claimDelivery({
    connectorToken: "connector_token",
    claimToken: leaseToken,
  }).lease;
  const runtimeAdmissionAttestation = {
    type: "webmcp.runtime_admission_attestation",
    protocol_version: STANDING_PROTOCOL_VERSION,
    admission_id: "admission_notification_private_state_001",
    adapter_id: "codex_desktop_v1",
    binding_generation: "c".repeat(64),
    delivery_id: lease.delivery_id,
    event_id: lease.event_id,
    handoff_id: "handoff_notification_private_state_001",
    accepted_at: FIXED_NOW.toISOString(),
  };
  harness.core.handoffNotification({
    connectorToken: "connector_token",
    deliveryId: lease.delivery_id,
    leaseToken,
    handoffId: runtimeAdmissionAttestation.handoff_id,
    runtimeAdmissionAttestation,
  });

  const persisted = harness.store.getStandingDeliveryById(lease.delivery_id);
  const receipt = JSON.parse(persisted.handoff_receipt_json);
  const corruptions = [
    {
      ...persisted,
      runtime_admission_json: `${persisted.runtime_admission_json} `,
    },
    {
      ...persisted,
      handoff_receipt_json: JSON.stringify({
        ...receipt,
        runtime_admission_ref: "admission_notification_other_001",
      }),
    },
  ];

  for (const corrupted of corruptions) {
    const corruptedStore = overrideStoreMethod(
      harness.store,
      "getStandingDeliveryByHandoffId",
      () => corrupted,
    );
    const corruptedCore = harness.createCore(corruptedStore);
    assert.throws(
      () => corruptedCore.handoffNotification({
        connectorToken: "connector_token",
        deliveryId: lease.delivery_id,
        leaseToken,
        handoffId: runtimeAdmissionAttestation.handoff_id,
        runtimeAdmissionAttestation,
      }),
      { code: "delivery_private_state_invalid", statusCode: 500 },
    );
  }
});

test("standing Event rejects a future occurrence with stable validation metadata", () => {
  const keys = createTestKeys();
  const event = createStandingContinuationEvent({
    type: "webmcp.continuation_event",
    protocol_version: STANDING_PROTOCOL_VERSION,
    event_id: "event_future_001",
    correlation_id: "correlation_standing_001",
    binding_id: "binding_standing_001",
    issuer_origin: HOST_ORIGIN,
    workflow_id: "shelter_alpha",
    event_type: "idle_soldier_available",
    event_sequence: 1,
    state_version: 1,
    occurred_at: new Date(FIXED_NOW.getTime() + 2 * 60 * 1_000).toISOString(),
    canonical_url: `${HOST_ORIGIN}/shelters/shelter_alpha`,
  });
  const envelope = createStandingContinuationEventEnvelope(event, {
    privateKey: keys.privateKey,
    keyId: KEY_ID,
    timestamp: String(Math.floor(FIXED_NOW.getTime() / 1_000)),
  });

  assert.throws(
    () => verifyStandingContinuationEventEnvelope(envelope, {
      keyResolver: ({ issuerOrigin, keyId, purpose }) => (
        issuerOrigin === HOST_ORIGIN && keyId === KEY_ID && purpose === "event"
          ? keys.publicKey
          : undefined
      ),
      expectedOrigin: HOST_ORIGIN,
      expectedKeyId: KEY_ID,
      expectedKeyFingerprint: keyFingerprintFor(keys.publicKey),
      now: FIXED_NOW,
    }),
    (error) => (
      error.code === "event_occurred_in_future" &&
      error.message === "Event occurred_at is outside the accepted future window" &&
      error.statusCode === 422
    ),
  );
});

test("standing Event occurrence cannot reach or cross the consented Grant expiry", (t) => {
  const grantExpiry = new Date(FIXED_NOW.getTime() + 30_000);
  const harness = createApprovedHarness(t, {
    manifestInput: {
      ...manifestValue(),
      manifest_id: "manifest_event_after_expiry_001",
      correlation_id: "correlation_event_after_expiry_001",
      offer_expires_at: new Date(FIXED_NOW.getTime() + 10_000).toISOString(),
      grant_request: {
        ...manifestValue().grant_request,
        grant_expires_at: grantExpiry.toISOString(),
      },
    },
  });
  const signal = signedSignal(
    harness.keys,
    harness.approval.binding,
    1,
    "event_after_expiry_001",
    1,
    { occurredAt: grantExpiry },
  );

  assert.throws(
    () => harness.core.acceptEvent(signal.envelope),
    { code: "event_after_grant_expiry", statusCode: 422 },
  );
  assert.equal(harness.store.getStandingEventById(signal.event.event_id), undefined);
  assert.equal(
    harness.store.getStandingGrantByBindingId(
      harness.approval.binding.binding_id,
    ).last_event_sequence,
    0,
  );
});

test("standing approval timestamp cannot reach or cross the Manifest offer expiry", (t) => {
  const offerExpiry = new Date(FIXED_NOW.getTime() + 10_000);
  for (const extraMs of [0, 1_000]) {
    assert.throws(
      () => createApprovedHarness(t, {
        manifestInput: {
          ...manifestValue(),
          offer_expires_at: offerExpiry.toISOString(),
        },
        decisionOverrides: {
          decided_at: new Date(offerExpiry.getTime() + extraMs).toISOString(),
        },
      }),
      { code: "consent_decision_expired" },
    );
  }
});

test("security-disabled legacy standing Grant requires fresh Consent without accepting an Event", (t) => {
  const harness = createApprovedHarness(t);
  const grant = harness.store.getStandingGrantByBindingId(harness.approval.binding.binding_id);
  const legacyStore = overrideStoreMethod(harness.store, "getStandingGrantByBindingId", () => ({
    ...grant,
    issuer_key_fingerprint: "__legacy_unpinned__",
    revoked_at: grant.created_at,
  }));
  const core = harness.createCore(legacyStore);
  const signal = signedSignal(harness.keys, harness.approval.binding, 1, "event_legacy_key_001", 1);
  assert.throws(
    () => core.acceptEvent(signal.envelope),
    { code: "grant_reconsent_required", statusCode: 410 },
  );
  assert.equal(harness.store.getStandingEventById(signal.event.event_id), undefined);
});

test("standing verification rejects private key material for Manifest and Event", () => {
  const keys = createTestKeys();
  const privatePem = keys.privateKey.export({ type: "pkcs8", format: "pem" });
  const manifest = createStandingReentryManifest(manifestValue(), {
    privateKey: keys.privateKey,
    keyId: KEY_ID,
  });
  assert.throws(
    () => validateStandingReentryManifest(manifest, {
      keyResolver: () => privatePem,
      expectedOrigin: HOST_ORIGIN,
      expectedKeyId: KEY_ID,
      now: FIXED_NOW,
    }),
    { code: "verification_key_invalid", statusCode: 401 },
  );

  const event = createStandingContinuationEvent({
    type: "webmcp.continuation_event",
    protocol_version: STANDING_PROTOCOL_VERSION,
    event_id: "event_private_key_rejected",
    correlation_id: "correlation_standing_001",
    binding_id: "binding_standing_001",
    issuer_origin: HOST_ORIGIN,
    workflow_id: "shelter_alpha",
    event_type: "idle_soldier_available",
    event_sequence: 1,
    state_version: 1,
    occurred_at: FIXED_NOW.toISOString(),
    canonical_url: `${HOST_ORIGIN}/shelters/shelter_alpha`,
  });
  const envelope = createStandingContinuationEventEnvelope(event, {
    privateKey: keys.privateKey,
    keyId: KEY_ID,
    timestamp: String(Math.floor(FIXED_NOW.getTime() / 1_000)),
  });
  assert.throws(
    () => verifyStandingContinuationEventEnvelope(envelope, {
      keyResolver: () => privatePem,
      expectedOrigin: HOST_ORIGIN,
      expectedKeyId: KEY_ID,
      expectedKeyFingerprint: keyFingerprintFor(keys.publicKey),
      now: FIXED_NOW,
    }),
    { code: "verification_key_invalid", statusCode: 401 },
  );
});

test("revoked pending standing work does not block a later eligible Grant for the same target", (t) => {
  const store = new SqliteReceiverStore({ filename: ":memory:" });
  t.after(() => store.close());
  const keys = createTestKeys();
  const decisions = new Map();
  const core = new StandingAuthorizationCore({
    store,
    keyResolver: ({ issuerOrigin, keyId, purpose }) => (
      issuerOrigin === HOST_ORIGIN && keyId === KEY_ID && ["manifest", "event"].includes(purpose)
        ? keys.publicKey
        : undefined
    ),
    consentAuthority: {
      verifyDecision: ({ decisionToken }) => decisions.get(decisionToken),
    },
    grantControlAuthority: {
      verifyControl: ({ bindingId, action }) => grantControl(bindingId, action),
    },
    connectorAuthority: {
      verifyConnector: () => connectorIdentity(),
    },
    effectAuthority: {
      verifyEffect: () => {
        throw new Error("Effect verification is not used in this test");
      },
    },
    maximumGrantLifetimeMs: 90 * 24 * 60 * 60 * 1_000,
    leaseDurationMs: 60 * 1_000,
    clock: () => FIXED_NOW,
    createId: deterministicIdSource(),
  });

  const createPending = (suffix) => {
    const manifest = createStandingReentryManifest({
      ...manifestValue(),
      manifest_id: `manifest_head_of_line_${suffix}`,
      correlation_id: `correlation_head_of_line_${suffix}`,
    }, {
      privateKey: keys.privateKey,
      keyId: KEY_ID,
    });
    const enrollment = core.createConsentChallenge({ manifest, expectedOrigin: HOST_ORIGIN });
    const decisionToken = `decision_token_${suffix}`;
    decisions.set(decisionToken, {
      ...approvalDecision(enrollment.challenge.challenge_id),
      decision_id: `decision_head_of_line_${suffix}`,
    });
    const approval = core.decideConsent({
      challengeId: enrollment.challenge.challenge_id,
      decisionToken,
    });
    const signal = signedSignal(
      keys,
      approval.binding,
      1,
      `event_head_of_line_${suffix}`,
      1,
    );
    core.acceptEvent(signal.envelope);
    return { approval, signal };
  };

  const revoked = createPending("revoked");
  core.revokeGrant({
    bindingId: revoked.approval.binding.binding_id,
    controlToken: "revoke_head_of_line",
  });
  const active = createPending("active");

  const claim = core.claimDelivery({
    connectorToken: "connector_token",
    claimToken: claimToken(8),
  });
  assert.equal(claim.lease.event_id, active.signal.event.event_id);
});

test("revocation fences a leased claim replay while a pre-revocation effect can converge", (t) => {
  const store = new SqliteReceiverStore({ filename: ":memory:" });
  t.after(() => store.close());
  const keys = createTestKeys();
  const clockRef = { value: new Date(FIXED_NOW) };
  let challengeId;
  let effect;
  const core = new StandingAuthorizationCore({
    store,
    keyResolver: ({ issuerOrigin, keyId, purpose }) => (
      issuerOrigin === HOST_ORIGIN && keyId === KEY_ID && ["manifest", "event"].includes(purpose)
        ? keys.publicKey
        : undefined
    ),
    consentAuthority: {
      verifyDecision: ({ decisionToken }) => {
        assert.equal(decisionToken, "approve_once");
        return approvalDecision(challengeId);
      },
    },
    grantControlAuthority: {
      verifyControl: ({ bindingId, action, controlToken }) => {
        assert.equal(controlToken, action === "revoke" ? "revoke_once" : "inspect_once");
        return grantControl(bindingId, action);
      },
    },
    connectorAuthority: {
      verifyConnector: ({ connectorToken }) => {
        assert.equal(connectorToken, "connector_token");
        return connectorIdentity();
      },
    },
    effectAuthority: {
      verifyEffect: ({ effectToken }) => {
        assert.equal(effectToken, "effect_before_revoke");
        return effect;
      },
    },
    maximumGrantLifetimeMs: 90 * 24 * 60 * 60 * 1_000,
    leaseDurationMs: 60 * 1_000,
    clock: () => clockRef.value,
    createId: deterministicIdSource(),
  });
  const manifest = createStandingReentryManifest({
    ...manifestValue(),
    manifest_id: "manifest_standing_revoke_lease",
    correlation_id: "correlation_standing_revoke_lease",
  }, {
    privateKey: keys.privateKey,
    keyId: KEY_ID,
  });
  const enrollment = core.createConsentChallenge({ manifest, expectedOrigin: HOST_ORIGIN });
  challengeId = enrollment.challenge.challenge_id;
  const approval = core.decideConsent({
    challengeId,
    decisionToken: "approve_once",
  });
  const first = signedSignal(keys, approval.binding, 1, "event_revoke_lease_001", 1);
  core.acceptEvent(first.envelope);
  const leaseToken = claimToken(4);
  const lease = core.claimDelivery({
    connectorToken: "connector_token",
    claimToken: leaseToken,
  }).lease;
  effect = effectFor(lease, "effect_revoke_lease_001", FIXED_NOW);

  clockRef.value = new Date(FIXED_NOW.getTime() + 1_000);
  core.revokeGrant({
    bindingId: approval.binding.binding_id,
    controlToken: "revoke_once",
  });
  assert.equal(core.claimDelivery({
    connectorToken: "connector_token",
    claimToken: leaseToken,
  }), null);
  assert.equal(core.acknowledgeDelivery({
    connectorToken: "connector_token",
    deliveryId: lease.delivery_id,
    leaseToken,
    effectToken: "effect_before_revoke",
  }).status, "acknowledged");
  const summary = core.inspectGrant({
    bindingId: approval.binding.binding_id,
    controlToken: "inspect_once",
  });
  assert.equal(summary.status, "revoked");
  assert.equal(summary.active_activations, 0);
});

test("standing claim maps malformed or inconsistent private Delivery state to an invariant", (t) => {
  const harness = createApprovedHarness(t, {
    manifestInput: {
      ...manifestValue(),
      manifest_id: "manifest_private_state_001",
      correlation_id: "correlation_private_state_001",
    },
  });
  const signal = signedSignal(
    harness.keys,
    harness.approval.binding,
    1,
    "event_private_state_001",
    1,
  );
  harness.core.acceptEvent(signal.envelope);
  const grant = harness.store.getStandingGrantByBindingId(harness.approval.binding.binding_id);
  const delivery = harness.store.getOpenStandingDeliveryByGrantId(grant.grant_id);
  const receipt = JSON.parse(delivery.receipt_json);
  const corruptions = [
    {
      ...delivery,
      receipt_json: JSON.stringify({ ...receipt, human_boundary: "another_human_boundary" }),
    },
    { ...delivery, receipt_json: "{" },
    { ...delivery, instruction: " malformed stored instruction " },
  ];

  for (const [index, corrupted] of corruptions.entries()) {
    const corruptedStore = overrideStoreMethod(
      harness.store,
      "getNextStandingDeliveryByTarget",
      () => corrupted,
    );
    const corruptedCore = harness.createCore(corruptedStore);
    assert.throws(
      () => corruptedCore.claimDelivery({
        connectorToken: "connector_token",
        claimToken: claimToken(20 + index),
      }),
      { code: "delivery_private_state_invalid", statusCode: 500 },
    );
    assert.equal(
      harness.store.getOpenStandingDeliveryByGrantId(grant.grant_id).status,
      "pending",
    );
  }
});

function manifestValue() {
  return {
    type: "webmcp.reentry_manifest",
    protocol_version: STANDING_PROTOCOL_VERSION,
    manifest_id: "manifest_standing_001",
    correlation_id: "correlation_standing_001",
    issuer_origin: HOST_ORIGIN,
    issued_at: FIXED_NOW.toISOString(),
    offer_expires_at: new Date(FIXED_NOW.getTime() + 5 * 60 * 1_000).toISOString(),
    workflow: {
      id: "shelter_alpha",
      type: "sleepless_kingdom.shelter",
      state_version: 1,
      canonical_url: `${HOST_ORIGIN}/shelters/shelter_alpha`,
    },
    display: {
      title: "Keep this shelter moving",
      reason: "Return when a soldier becomes idle and prepare the next safe assignment.",
    },
    grant_request: {
      authorization_mode: "standing",
      event_type: "idle_soldier_available",
      grant_expires_at: GRANT_EXPIRY,
      max_active_activations: 1,
      human_boundary: "confirm_irreversible_spend",
    },
  };
}

function approvalDecision(challengeId) {
  return {
    type: STANDING_CONSENT_DECISION_TYPE,
    protocol_version: STANDING_PROTOCOL_VERSION,
    decision_id: "decision_standing_001",
    challenge_id: challengeId,
    action: "approve",
    subject_id: "subject_001",
    delivery_target_id: "target_001",
    decided_at: FIXED_NOW.toISOString(),
  };
}

function signedSignal(
  keys,
  binding,
  sequence,
  eventId,
  stateVersion,
  { keyId = KEY_ID, occurredAt = FIXED_NOW } = {},
) {
  const event = createStandingContinuationEvent({
    type: "webmcp.continuation_event",
    protocol_version: STANDING_PROTOCOL_VERSION,
    event_id: eventId,
    correlation_id: binding.correlation_id,
    binding_id: binding.binding_id,
    issuer_origin: HOST_ORIGIN,
    workflow_id: binding.workflow_id,
    event_type: binding.event_type,
    event_sequence: sequence,
    state_version: stateVersion,
    occurred_at: occurredAt.toISOString(),
    canonical_url: `${HOST_ORIGIN}/shelters/shelter_alpha`,
  });
  return {
    event,
    envelope: createStandingContinuationEventEnvelope(event, {
      privateKey: keys.privateKey,
      keyId,
      timestamp: String(Math.floor(FIXED_NOW.getTime() / 1_000)),
    }),
  };
}

function createApprovedHarness(t, {
  manifestInput = manifestValue(),
  keys = createTestKeys(),
  decisionOverrides = {},
  runtimeAdmissionAuthority,
} = {}) {
  const store = new SqliteReceiverStore({ filename: ":memory:" });
  t.after(() => store.close());
  const clockRef = { value: new Date(FIXED_NOW) };
  let challengeId;
  const createCore = (selectedStore) => new StandingAuthorizationCore({
    store: selectedStore,
    keyResolver: ({ issuerOrigin, keyId, purpose }) => (
      issuerOrigin === HOST_ORIGIN && keyId === KEY_ID && ["manifest", "event"].includes(purpose)
        ? keys.publicKey
        : undefined
    ),
    consentAuthority: {
      verifyDecision: () => ({ ...approvalDecision(challengeId), ...decisionOverrides }),
    },
    grantControlAuthority: {
      verifyControl: ({ bindingId, action }) => grantControl(bindingId, action),
    },
    connectorAuthority: {
      verifyConnector: () => connectorIdentity(),
    },
    effectAuthority: {
      verifyEffect: () => {
        throw new Error("Effect verification is not used in this harness");
      },
    },
    runtimeAdmissionAuthority,
    maximumGrantLifetimeMs: 90 * 24 * 60 * 60 * 1_000,
    leaseDurationMs: 60 * 1_000,
    clock: () => clockRef.value,
    createId: deterministicIdSource(),
  });
  const core = createCore(store);
  const manifest = createStandingReentryManifest(manifestInput, {
    privateKey: keys.privateKey,
    keyId: KEY_ID,
  });
  const enrollment = core.createConsentChallenge({ manifest, expectedOrigin: HOST_ORIGIN });
  challengeId = enrollment.challenge.challenge_id;
  const approval = core.decideConsent({
    challengeId,
    decisionToken: "approve_once",
  });
  return { store, core, keys, approval, createCore, clockRef };
}

function connectorIdentity() {
  return {
    type: STANDING_CONNECTOR_IDENTITY_TYPE,
    protocol_version: STANDING_PROTOCOL_VERSION,
    connector_id: "connector_001",
    subject_id: "subject_001",
    delivery_target_id: "target_001",
    authenticated_at: FIXED_NOW.toISOString(),
    expires_at: new Date(FIXED_NOW.getTime() + 10 * 60 * 1_000).toISOString(),
  };
}

function effectFor(lease, effectId, confirmedAt) {
  return {
    type: STANDING_HOST_EFFECT_ATTESTATION_TYPE,
    protocol_version: STANDING_PROTOCOL_VERSION,
    effect_id: effectId,
    delivery_id: lease.delivery_id,
    event_id: lease.event_id,
    correlation_id: lease.continuation.correlation_id,
    workflow_id: lease.continuation.workflow_id,
    outcome: STANDING_HOST_EFFECT_OUTCOME,
    confirmed_at: confirmedAt.toISOString(),
  };
}

function grantControl(bindingId, action) {
  return {
    type: STANDING_GRANT_CONTROL_AUTHORIZATION_TYPE,
    protocol_version: STANDING_PROTOCOL_VERSION,
    binding_id: bindingId,
    action,
    subject_id: "subject_001",
    authenticated_at: FIXED_NOW.toISOString(),
    expires_at: new Date(FIXED_NOW.getTime() + 60 * 1_000).toISOString(),
  };
}

function claimToken(fill) {
  return Buffer.alloc(32, fill).toString("base64url");
}

function keyFingerprintFor(publicKey) {
  return createHash("sha256")
    .update(publicKey.export({ type: "spki", format: "der" }))
    .digest("base64url");
}

function deterministicIdSource() {
  const counts = new Map();
  return (prefix) => {
    const next = (counts.get(prefix) ?? 0) + 1;
    counts.set(prefix, next);
    return `${prefix}_${next}`;
  };
}

function overrideStoreMethod(baseStore, methodName, implementation) {
  let wrapper;
  wrapper = new Proxy(baseStore, {
    get(target, property) {
      if (property === "transaction") {
        return (callback) => target.transaction(() => callback(wrapper));
      }
      if (property === methodName) return implementation;
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  return wrapper;
}
