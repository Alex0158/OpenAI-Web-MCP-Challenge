import assert from "node:assert/strict";
import { mkdtemp, readFile, rmdir, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  CONNECTOR_IDENTITY_TYPE,
  CONSENT_DECISION_TYPE,
  GRANT_CONTROL_AUTHORIZATION_TYPE,
  GRANT_REVOCATION_TYPE,
  GRANT_SUMMARY_TYPE,
  HOST_EFFECT_ATTESTATION_TYPE,
  HOST_EFFECT_OUTCOME,
  ReceiverCore,
} from "../src/receiver-core.mjs";
import {
  PROTOCOL_VERSION,
  canonicalJson,
  createContinuationEvent,
  createContinuationEventEnvelope,
  createReentryManifest,
  validateContinuationReceipt,
} from "../src/protocol.mjs";
import { SqliteReceiverStore } from "../src/sqlite-receiver-store.mjs";
import {
  FIXED_NOW,
  HOST_ORIGIN,
  continuationEvent,
  createTestKeys,
  manifestValue,
} from "./fixtures.mjs";

const MAXIMUM_GRANT_LIFETIME_MS = 20 * 60 * 1_000;
const EFFECTIVE_EXPIRY = "2026-08-31T03:25:00.000Z";
const KEY_ID = "host_key_001";
const LEASE_DURATION_MS = 60 * 1_000;
const MAXIMUM_DELIVERY_ATTEMPTS = 3;

function createHarness({
  store = new SqliteReceiverStore({ filename: ":memory:" }),
  keys = createTestKeys(),
  decisions = new Map(),
  controls = new Map(),
  connectors = new Map(),
  effects = new Map(),
  clockRef = { value: new Date(FIXED_NOW) },
  maximumGrantLifetimeMs = MAXIMUM_GRANT_LIFETIME_MS,
  leaseDurationMs = LEASE_DURATION_MS,
  maximumDeliveryAttempts = MAXIMUM_DELIVERY_ATTEMPTS,
  createId = deterministicIdSource(),
} = {}) {
  const core = new ReceiverCore({
    store,
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
        const value = decisions.get(decisionToken);
        if (value === undefined) throw new Error("Unknown consent decision token");
        return typeof value === "function" ? value(challengeId) : value;
      },
    },
    grantControlAuthority: {
      verifyControl({ bindingId, action, controlToken }) {
        const value = controls.get(controlToken);
        if (value === undefined) throw new Error("Unknown Grant control token");
        return typeof value === "function" ? value(bindingId, action) : value;
      },
    },
    connectorAuthority: {
      verifyConnector({ connectorToken }) {
        const value = connectors.get(connectorToken);
        if (value === undefined) throw new Error("Unknown Connector token");
        return typeof value === "function" ? value() : value;
      },
    },
    effectAuthority: {
      verifyEffect({ effectToken, expected }) {
        const value = effects.get(effectToken);
        if (value === undefined) throw new Error("Unknown Host-effect token");
        return typeof value === "function" ? value(expected) : value;
      },
    },
    maximumGrantLifetimeMs,
    leaseDurationMs,
    maximumDeliveryAttempts,
    clock: () => clockRef.value,
    createId,
  });
  return { core, store, keys, decisions, controls, connectors, effects, clockRef };
}

function deterministicIdSource() {
  const counts = new Map();
  return (prefix) => {
    const next = (counts.get(prefix) ?? 0) + 1;
    counts.set(prefix, next);
    return `${prefix}_${next}`;
  };
}

function signedManifest(keys, overrides = {}) {
  return createReentryManifest(manifestValue(overrides), {
    privateKey: keys.privateKey,
    keyId: KEY_ID,
  });
}

function approvalDecision(challengeId, overrides = {}) {
  return {
    type: CONSENT_DECISION_TYPE,
    protocol_version: PROTOCOL_VERSION,
    decision_id: "decision_approve_001",
    challenge_id: challengeId,
    action: "approve",
    subject_id: "subject_001",
    delivery_target_id: "target_001",
    decided_at: FIXED_NOW.toISOString(),
    ...overrides,
  };
}

function declineDecision(challengeId, overrides = {}) {
  return {
    type: CONSENT_DECISION_TYPE,
    protocol_version: PROTOCOL_VERSION,
    decision_id: "decision_decline_001",
    challenge_id: challengeId,
    action: "decline",
    subject_id: "subject_001",
    decided_at: FIXED_NOW.toISOString(),
    ...overrides,
  };
}

function grantControlAuthorization(bindingId, action, overrides = {}) {
  return {
    type: GRANT_CONTROL_AUTHORIZATION_TYPE,
    protocol_version: PROTOCOL_VERSION,
    binding_id: bindingId,
    action,
    subject_id: "subject_001",
    authenticated_at: new Date(FIXED_NOW.getTime() - 1_000).toISOString(),
    expires_at: new Date(FIXED_NOW.getTime() + 60_000).toISOString(),
    ...overrides,
  };
}

function enroll(harness, manifest = signedManifest(harness.keys)) {
  return {
    manifest,
    enrollment: harness.core.createConsentChallenge({
      manifest,
      expectedOrigin: HOST_ORIGIN,
    }),
  };
}

function enrollAndApprove(harness) {
  const enrolled = enroll(harness);
  const decision = approvalDecision(enrolled.enrollment.challenge.challenge_id);
  harness.decisions.set("approve_token", decision);
  return {
    ...enrolled,
    decision,
    approval: harness.core.decideConsent({
      challengeId: enrolled.enrollment.challenge.challenge_id,
      decisionToken: "approve_token",
    }),
  };
}

function signedEventEnvelope(harness, binding, overrides = {}, options = {}) {
  const event = createContinuationEvent(continuationEvent({
    binding_id: binding.binding_id,
    correlation_id: binding.correlation_id,
    workflow_id: binding.workflow_id,
    event_type: binding.event_type,
    occurred_at: harness.clockRef.value.toISOString(),
    ...overrides,
  }));
  const timestamp = options.timestamp ?? harness.clockRef.value;
  return {
    event,
    envelope: createContinuationEventEnvelope(event, {
      privateKey: options.privateKey ?? harness.keys.privateKey,
      keyId: KEY_ID,
      timestamp: String(Math.floor(timestamp.getTime() / 1_000)),
    }),
  };
}

function connectorIdentity(overrides = {}) {
  return {
    type: CONNECTOR_IDENTITY_TYPE,
    protocol_version: PROTOCOL_VERSION,
    connector_id: "connector_001",
    subject_id: "subject_001",
    delivery_target_id: "target_001",
    authenticated_at: FIXED_NOW.toISOString(),
    expires_at: new Date(FIXED_NOW.getTime() + 10 * 60 * 1_000).toISOString(),
    ...overrides,
  };
}

function claimToken(fill) {
  return Buffer.alloc(32, fill).toString("base64url");
}

function effectAttestation(lease, confirmedAt, overrides = {}) {
  return {
    type: HOST_EFFECT_ATTESTATION_TYPE,
    protocol_version: PROTOCOL_VERSION,
    effect_id: "effect_001",
    delivery_id: lease.delivery_id,
    event_id: lease.event_id,
    correlation_id: lease.continuation.correlation_id,
    workflow_id: lease.continuation.workflow_id,
    outcome: HOST_EFFECT_OUTCOME,
    confirmed_at: confirmedAt.toISOString(),
    ...overrides,
  };
}

function acceptPendingDelivery(harness) {
  const { approval } = enrollAndApprove(harness);
  const signed = signedEventEnvelope(harness, approval.binding);
  const acceptance = harness.core.acceptEvent(signed.envelope);
  return {
    approval,
    ...signed,
    acceptance,
    delivery: harness.store.getDeliveryByEventId(signed.event.event_id),
  };
}

test("challenge enrollment is idempotent, policy-bounded, and creates no authority", (t) => {
  const harness = createHarness();
  t.after(() => harness.store.close());
  const { manifest, enrollment } = enroll(harness);
  const challenge = enrollment.challenge;

  assert.equal(enrollment.duplicate, false);
  assert.equal(challenge.grant_scope.expires_at, EFFECTIVE_EXPIRY);
  assert.equal(challenge.grant_scope.max_runs, 1);
  assert.equal(harness.store.getGrantByChallengeId(challenge.challenge_id), undefined);
  assert.equal(harness.store.getDeliveryByEventId("event_missing"), undefined);
  assert.ok(!("grant_id" in challenge));
  assert.ok(!("delivery_target_id" in challenge));

  const replay = harness.core.createConsentChallenge({
    manifest,
    expectedOrigin: HOST_ORIGIN,
  });
  assert.equal(replay.duplicate, true);
  assert.deepEqual(replay.challenge, challenge);

  const conflictingManifest = signedManifest(harness.keys, {
    display: {
      title: "Continue this workflow",
      reason: "Different signed content under the same Manifest identity.",
    },
  });
  assert.throws(
    () => harness.core.createConsentChallenge({
      manifest: conflictingManifest,
      expectedOrigin: HOST_ORIGIN,
    }),
    { code: "manifest_identity_conflict", statusCode: 409 },
  );
});

test("approval requires trusted consent and keeps Grant authority private", (t) => {
  const harness = createHarness();
  t.after(() => harness.store.close());
  const { enrollment } = enroll(harness);
  const challengeId = enrollment.challenge.challenge_id;

  assert.throws(
    () => harness.core.decideConsent({ challengeId, humanApproved: true }),
    { code: "receiver_input_fields_invalid" },
  );
  assert.throws(
    () => harness.core.decideConsent({ challengeId, decisionToken: "unknown_token" }),
    { code: "consent_decision_invalid", statusCode: 403 },
  );

  const getterDecision = approvalDecision(challengeId);
  let actionRead = false;
  Object.defineProperty(getterDecision, "action", {
    enumerable: true,
    get() {
      actionRead = true;
      throw new Error("Consent getter must not execute");
    },
  });
  harness.decisions.set("getter_token", getterDecision);
  assert.throws(
    () => harness.core.decideConsent({ challengeId, decisionToken: "getter_token" }),
    { code: "receiver_input_invalid" },
  );
  assert.equal(actionRead, false);

  const decision = approvalDecision(challengeId);
  harness.decisions.set("approve_token", decision);
  const approval = harness.core.decideConsent({
    challengeId,
    decisionToken: "approve_token",
  });
  const grant = harness.store.getGrantByChallengeId(challengeId);

  assert.deepEqual(Object.keys(approval).sort(), ["binding", "challenge_id", "duplicate", "status"]);
  assert.equal(approval.status, "approved");
  assert.equal(approval.duplicate, false);
  assert.equal(approval.binding.expires_at, EFFECTIVE_EXPIRY);
  assert.equal(grant.delivery_target_id, "target_001");
  assert.equal(grant.runs_remaining, 1);
  assert.deepEqual(validateContinuationReceipt(JSON.parse(grant.receipt_json)), {
    type: "webmcp.continuation_receipt",
    protocol_version: PROTOCOL_VERSION,
    grant_id: grant.grant_id,
    correlation_id: "correlation_001",
    issuer_origin: HOST_ORIGIN,
    workflow_id: "workflow_001",
    event_type: "workflow.ready",
    canonical_url: `${HOST_ORIGIN}/workflows/workflow_001`,
    expires_at: EFFECTIVE_EXPIRY,
    human_boundary: "explicit_receiver_consent",
    continuation_mode: "open_canonical_page_read_current_state",
  });
  const publicJson = JSON.stringify(approval);
  for (const privateValue of [grant.grant_id, grant.subject_id, grant.delivery_target_id, grant.receipt_json]) {
    assert.ok(!publicJson.includes(privateValue));
  }
  assert.ok(!JSON.stringify({
    challenge: harness.store.getChallengeById(challengeId),
    grant,
  }).includes("approve_token"));

  const replay = harness.core.decideConsent({ challengeId, decisionToken: "approve_token" });
  assert.equal(replay.duplicate, true);
  assert.deepEqual(replay.binding, approval.binding);

  harness.decisions.set("mutated_token", approvalDecision(challengeId, {
    delivery_target_id: "target_other",
  }));
  assert.throws(
    () => harness.core.decideConsent({ challengeId, decisionToken: "mutated_token" }),
    { code: "consent_decision_identity_conflict", statusCode: 409 },
  );
});

test("decline is stable, creates no Grant, and fences later decisions", (t) => {
  const harness = createHarness();
  t.after(() => harness.store.close());
  const { enrollment } = enroll(harness);
  const challengeId = enrollment.challenge.challenge_id;
  harness.decisions.set("decline_token", declineDecision(challengeId));

  const declined = harness.core.decideConsent({ challengeId, decisionToken: "decline_token" });
  assert.deepEqual(declined, {
    challenge_id: challengeId,
    status: "declined",
    duplicate: false,
  });
  assert.equal(harness.store.getGrantByChallengeId(challengeId), undefined);

  const replay = harness.core.decideConsent({ challengeId, decisionToken: "decline_token" });
  assert.equal(replay.duplicate, true);
  harness.decisions.set("late_approval", approvalDecision(challengeId));
  assert.throws(
    () => harness.core.decideConsent({ challengeId, decisionToken: "late_approval" }),
    { code: "consent_already_decided", statusCode: 409 },
  );
  assert.equal(harness.store.getGrantByChallengeId(challengeId), undefined);
});

test("Grant inspection authenticates before lookup and returns an exact bounded summary", (t) => {
  const harness = createHarness();
  t.after(() => harness.store.close());
  const { approval } = enrollAndApprove(harness);
  const bindingId = approval.binding.binding_id;
  const grant = harness.store.getGrantByBindingId(bindingId);

  assert.throws(
    () => harness.core.inspectGrant({
      bindingId: "binding_missing",
      controlToken: "unknown_control",
    }),
    { code: "grant_control_invalid", statusCode: 403 },
  );
  harness.controls.set(
    "missing_binding_control",
    (requestedBindingId, action) => grantControlAuthorization(requestedBindingId, action),
  );
  assert.throws(
    () => harness.core.inspectGrant({
      bindingId: "binding_missing",
      controlToken: "missing_binding_control",
    }),
    { code: "grant_not_found", statusCode: 404 },
  );

  harness.controls.set(
    "inspect_control",
    grantControlAuthorization(bindingId, "inspect"),
  );
  const summary = harness.core.inspectGrant({
    bindingId,
    controlToken: "inspect_control",
  });
  assert.deepEqual(summary, {
    type: GRANT_SUMMARY_TYPE,
    protocol_version: PROTOCOL_VERSION,
    binding_id: bindingId,
    correlation_id: "correlation_001",
    issuer_origin: HOST_ORIGIN,
    workflow_type: "domain-neutral-workflow",
    workflow_id: "workflow_001",
    event_type: "workflow.ready",
    canonical_url: `${HOST_ORIGIN}/workflows/workflow_001`,
    expires_at: EFFECTIVE_EXPIRY,
    human_boundary: "explicit_receiver_consent",
    runs_remaining: 1,
    status: "active",
    created_at: FIXED_NOW.toISOString(),
    revoked_at: null,
  });
  assert.equal(Object.isFrozen(summary), true);
  const output = JSON.stringify(summary);
  for (const privateValue of [
    grant.grant_id,
    grant.subject_id,
    grant.delivery_target_id,
    grant.receipt_json,
    "inspect_control",
  ]) {
    assert.ok(!output.includes(privateValue));
  }
});

test("Grant control rejects malformed or out-of-scope authority without mutation", (t) => {
  const harness = createHarness();
  t.after(() => harness.store.close());
  const { approval } = enrollAndApprove(harness);
  const bindingId = approval.binding.binding_id;

  assert.throws(
    () => harness.core.revokeGrant({
      bindingId,
      controlToken: "unknown_control",
    }),
    { code: "grant_control_invalid", statusCode: 403 },
  );
  assert.throws(
    () => harness.core.revokeGrant({
      bindingId,
      controlToken: "unknown_control",
      revokedAt: FIXED_NOW.toISOString(),
    }),
    { code: "receiver_input_fields_invalid" },
  );

  const cases = [
    [
      "wrong_action",
      grantControlAuthorization(bindingId, "inspect"),
      { code: "grant_control_scope_invalid", statusCode: 403 },
    ],
    [
      "wrong_binding",
      grantControlAuthorization("binding_other", "revoke"),
      { code: "grant_control_scope_invalid", statusCode: 403 },
    ],
    [
      "wrong_subject",
      grantControlAuthorization(bindingId, "revoke", { subject_id: "subject_other" }),
      { code: "grant_control_scope_invalid", statusCode: 403 },
    ],
    [
      "expired_control",
      grantControlAuthorization(bindingId, "revoke", {
        expires_at: FIXED_NOW.toISOString(),
      }),
      { code: "grant_control_time_invalid", statusCode: 403 },
    ],
    [
      "future_control",
      grantControlAuthorization(bindingId, "revoke", {
        authenticated_at: new Date(FIXED_NOW.getTime() + 60_001).toISOString(),
        expires_at: new Date(FIXED_NOW.getTime() + 120_000).toISOString(),
      }),
      { code: "grant_control_time_invalid", statusCode: 403 },
    ],
  ];
  for (const [token, control, expected] of cases) {
    harness.controls.set(token, control);
    assert.throws(
      () => harness.core.revokeGrant({ bindingId, controlToken: token }),
      expected,
    );
  }
  assert.equal(harness.store.getGrantByBindingId(bindingId).revoked_at, null);
});

test("Grant revocation is durable, idempotent, and ordered against event acceptance", async (t) => {
  await t.test("revocation first rejects a new event and keeps the run unspent", (t) => {
    const harness = createHarness();
    t.after(() => harness.store.close());
    const { approval } = enrollAndApprove(harness);
    const bindingId = approval.binding.binding_id;
    harness.controls.set(
      "revoke_control",
      grantControlAuthorization(bindingId, "revoke"),
    );

    const first = harness.core.revokeGrant({
      bindingId,
      controlToken: "revoke_control",
    });
    assert.deepEqual(first, {
      type: GRANT_REVOCATION_TYPE,
      protocol_version: PROTOCOL_VERSION,
      binding_id: bindingId,
      status: "revoked",
      revoked_at: FIXED_NOW.toISOString(),
      duplicate: false,
    });
    assert.equal(Object.isFrozen(first), true);
    harness.clockRef.value = new Date(FIXED_NOW.getTime() + 1_000);
    assert.deepEqual(harness.core.revokeGrant({
      bindingId,
      controlToken: "revoke_control",
    }), { ...first, duplicate: true });
    harness.controls.set(
      "inspect_revoked",
      grantControlAuthorization(bindingId, "inspect"),
    );
    assert.deepEqual(harness.core.inspectGrant({
      bindingId,
      controlToken: "inspect_revoked",
    }), {
      type: GRANT_SUMMARY_TYPE,
      protocol_version: PROTOCOL_VERSION,
      binding_id: bindingId,
      correlation_id: "correlation_001",
      issuer_origin: HOST_ORIGIN,
      workflow_type: "domain-neutral-workflow",
      workflow_id: "workflow_001",
      event_type: "workflow.ready",
      canonical_url: `${HOST_ORIGIN}/workflows/workflow_001`,
      expires_at: EFFECTIVE_EXPIRY,
      human_boundary: "explicit_receiver_consent",
      runs_remaining: 1,
      status: "revoked",
      created_at: FIXED_NOW.toISOString(),
      revoked_at: first.revoked_at,
    });

    const signed = signedEventEnvelope(harness, approval.binding, {
      event_id: "event_after_revocation",
    });
    assert.throws(
      () => harness.core.acceptEvent(signed.envelope),
      { code: "grant_revoked" },
    );
    const grant = harness.store.getGrantByBindingId(bindingId);
    assert.equal(grant.runs_remaining, 1);
    assert.equal(grant.revoked_at, FIXED_NOW.toISOString());
    assert.equal(harness.store.getEventById(signed.event.event_id), undefined);
    assert.equal(harness.store.getDeliveryByEventId(signed.event.event_id), undefined);
  });

  await t.test("event first remains replayable while later leasing is cancelled", (t) => {
    const harness = createHarness();
    t.after(() => harness.store.close());
    const accepted = acceptPendingDelivery(harness);
    const bindingId = accepted.approval.binding.binding_id;
    harness.clockRef.value = new Date(FIXED_NOW.getTime() + 1_000);
    harness.controls.set(
      "revoke_after_event",
      grantControlAuthorization(bindingId, "revoke"),
    );
    harness.core.revokeGrant({
      bindingId,
      controlToken: "revoke_after_event",
    });

    assert.deepEqual(harness.core.acceptEvent(accepted.envelope), {
      ...accepted.acceptance,
      duplicate: true,
    });
    harness.connectors.set("connector_secret", connectorIdentity());
    assert.equal(harness.core.claimDelivery({
      connectorToken: "connector_secret",
      claimToken: claimToken(30),
    }), null);
    const cancelled = harness.store.getDeliveryById(accepted.delivery.delivery_id);
    assert.equal(cancelled.status, "cancelled");
    assert.equal(cancelled.terminal_reason, "grant_revoked");
    assert.equal(cancelled.current_attempt, 0);
  });
});

test("event acceptance atomically reserves one private pending delivery and replays exactly", (t) => {
  const harness = createHarness();
  t.after(() => harness.store.close());
  const { approval } = enrollAndApprove(harness);
  const { event, envelope } = signedEventEnvelope(harness, approval.binding);

  const acceptance = harness.core.acceptEvent(envelope);
  assert.deepEqual(Object.keys(acceptance).sort(), [
    "accepted",
    "correlation_id",
    "duplicate",
    "event_id",
    "protocol_version",
    "status",
    "type",
  ]);
  assert.equal(acceptance.accepted, true);
  assert.equal(acceptance.duplicate, false);
  assert.ok(!("grant_id" in acceptance));
  assert.ok(!("delivery_id" in acceptance));

  const grant = harness.store.getGrantByBindingId(approval.binding.binding_id);
  const storedEvent = harness.store.getEventById(event.event_id);
  const delivery = harness.store.getDeliveryByEventId(event.event_id);
  assert.equal(grant.runs_remaining, 0);
  assert.equal(storedEvent.canonical_body, envelope.body);
  assert.equal(delivery.grant_id, grant.grant_id);
  assert.equal(delivery.delivery_target_id, "target_001");
  assert.equal(delivery.status, "pending");

  const replay = harness.core.acceptEvent(envelope);
  assert.deepEqual(replay, { ...acceptance, duplicate: true });
  assert.equal(
    harness.store.getDeliveryByEventId(event.event_id).delivery_id,
    delivery.delivery_id,
  );

  const conflicting = signedEventEnvelope(harness, approval.binding, {
    event_id: event.event_id,
    state_version: event.state_version + 1,
  });
  assert.throws(
    () => harness.core.acceptEvent(conflicting.envelope),
    { code: "event_identity_conflict", statusCode: 409 },
  );

  const exhausted = signedEventEnvelope(harness, approval.binding, { event_id: "event_002" });
  assert.throws(
    () => harness.core.acceptEvent(exhausted.envelope),
    { code: "grant_exhausted", statusCode: 409 },
  );
  assert.equal(harness.store.getEventById("event_002"), undefined);
  assert.equal(harness.store.getDeliveryByEventId("event_002"), undefined);
});

test("tampered, wrong-scope, and expired events leave the reservation untouched", async (t) => {
  await t.test("tampered and wrong-scope events create no record", (t) => {
    const harness = createHarness();
    t.after(() => harness.store.close());
    const { approval } = enrollAndApprove(harness);
    const signed = signedEventEnvelope(harness, approval.binding);
    const changed = createContinuationEvent({
      ...signed.event,
      state_version: signed.event.state_version + 1,
    });
    const tamperedEnvelope = {
      body: canonicalJson(changed),
      headers: signed.envelope.headers,
    };

    assert.throws(
      () => harness.core.acceptEvent(tamperedEnvelope),
      { code: "event_signature_invalid", statusCode: 401 },
    );
    const wrongScope = signedEventEnvelope(harness, approval.binding, {
      workflow_id: "workflow_other",
    });
    assert.throws(
      () => harness.core.acceptEvent(wrongScope.envelope),
      { code: "event_scope_invalid" },
    );
    assert.equal(harness.store.getGrantByBindingId(approval.binding.binding_id).runs_remaining, 1);
    assert.equal(harness.store.getEventById(signed.event.event_id), undefined);
    assert.equal(harness.store.getDeliveryByEventId(signed.event.event_id), undefined);
  });

  await t.test("expired Grant rejects an otherwise valid event", (t) => {
    const clockRef = { value: new Date(FIXED_NOW) };
    const harness = createHarness({
      clockRef,
      maximumGrantLifetimeMs: 1_000,
    });
    t.after(() => harness.store.close());
    const { approval } = enrollAndApprove(harness);
    clockRef.value = new Date(FIXED_NOW.getTime() + 2_000);
    const signed = signedEventEnvelope(harness, approval.binding, {
      occurred_at: new Date(FIXED_NOW.getTime() + 500).toISOString(),
    });

    assert.throws(
      () => harness.core.acceptEvent(signed.envelope),
      { code: "grant_expired", statusCode: 410 },
    );
    assert.equal(harness.store.getGrantByBindingId(approval.binding.binding_id).runs_remaining, 1);
    assert.equal(harness.store.getEventById(signed.event.event_id), undefined);
    assert.equal(harness.store.getDeliveryByEventId(signed.event.event_id), undefined);
  });
});

test("an injected delivery failure rolls back event, delivery, and run reservation", (t) => {
  const baseStore = new SqliteReceiverStore({ filename: ":memory:" });
  t.after(() => baseStore.close());
  const failingStore = failDeliveryWrites(baseStore);
  const harness = createHarness({ store: failingStore });
  const { approval } = enrollAndApprove(harness);
  const { event, envelope } = signedEventEnvelope(harness, approval.binding);

  assert.throws(
    () => harness.core.acceptEvent(envelope),
    /Injected pending-delivery failure/,
  );
  assert.equal(baseStore.getGrantByBindingId(approval.binding.binding_id).runs_remaining, 1);
  assert.equal(baseStore.getEventById(event.event_id), undefined);
  assert.equal(baseStore.getDeliveryByEventId(event.event_id), undefined);
});

test("file-backed state survives close and exact replay after restart", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "webmcp-receiver-"));
  const filename = join(directory, "receiver.sqlite");
  let openStore;
  t.after(async () => {
    openStore?.close();
    for (const path of [filename, `${filename}-wal`, `${filename}-shm`]) {
      await unlinkIfPresent(path);
    }
    await rmdir(directory);
  });

  const keys = createTestKeys();
  const decisions = new Map();
  openStore = new SqliteReceiverStore({ filename });
  const first = createHarness({ store: openStore, keys, decisions });
  const { enrollment, approval } = enrollAndApprove(first);
  const { event, envelope } = signedEventEnvelope(first, approval.binding);
  const acceptance = first.core.acceptEvent(envelope);
  const deliveryId = openStore.getDeliveryByEventId(event.event_id).delivery_id;
  openStore.close();

  openStore = new SqliteReceiverStore({ filename });
  const restarted = createHarness({
    store: openStore,
    keys,
    decisions,
    createId() {
      throw new Error("Exact replay must not allocate a new private identity");
    },
  });
  assert.equal(
    openStore.getChallengeById(enrollment.challenge.challenge_id).status,
    "approved",
  );
  assert.equal(openStore.getGrantByBindingId(approval.binding.binding_id).runs_remaining, 0);
  assert.equal(openStore.getEventById(event.event_id).canonical_body, envelope.body);
  assert.equal(openStore.getDeliveryByEventId(event.event_id).delivery_id, deliveryId);
  assert.deepEqual(restarted.core.acceptEvent(envelope), { ...acceptance, duplicate: true });
  assert.equal(openStore.getDeliveryByEventId(event.event_id).delivery_id, deliveryId);
});

test("Grant revocation survives file reopen without persisting the control token", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "webmcp-grant-control-"));
  const filename = join(directory, "receiver.sqlite");
  const controlToken = "grant_control_restart_secret";
  let openStore;
  t.after(async () => {
    openStore?.close();
    for (const path of [filename, `${filename}-wal`, `${filename}-shm`]) {
      await unlinkIfPresent(path);
    }
    await rmdir(directory);
  });

  const keys = createTestKeys();
  const decisions = new Map();
  const controls = new Map();
  openStore = new SqliteReceiverStore({ filename });
  const first = createHarness({ store: openStore, keys, decisions, controls });
  const { approval } = enrollAndApprove(first);
  controls.set(
    controlToken,
    grantControlAuthorization(approval.binding.binding_id, "revoke"),
  );
  const revocation = first.core.revokeGrant({
    bindingId: approval.binding.binding_id,
    controlToken,
  });
  openStore.close();
  openStore = undefined;

  openStore = new SqliteReceiverStore({ filename });
  const restarted = createHarness({ store: openStore, keys, decisions, controls });
  assert.deepEqual(restarted.core.revokeGrant({
    bindingId: approval.binding.binding_id,
    controlToken,
  }), { ...revocation, duplicate: true });
  assert.equal(
    openStore.getGrantByBindingId(approval.binding.binding_id).revoked_at,
    revocation.revoked_at,
  );
  openStore.close();
  openStore = undefined;

  for (const path of [filename, `${filename}-wal`, `${filename}-shm`]) {
    let bytes;
    try {
      bytes = await readFile(path);
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    assert.equal(bytes.includes(Buffer.from(controlToken)), false);
  }
});

test("Connector claim is target-scoped, private, and exactly replayable", (t) => {
  const harness = createHarness();
  t.after(() => harness.store.close());
  const { delivery } = acceptPendingDelivery(harness);
  const token = claimToken(1);

  assert.throws(
    () => harness.core.claimDelivery({
      connectorToken: "unknown_connector",
      claimToken: token,
    }),
    { code: "connector_identity_invalid", statusCode: 403 },
  );
  harness.connectors.set("wrong_target", connectorIdentity({
    delivery_target_id: "target_other",
  }));
  assert.equal(harness.core.claimDelivery({
    connectorToken: "wrong_target",
    claimToken: token,
  }), null);
  harness.connectors.set("wrong_subject", connectorIdentity({ subject_id: "subject_other" }));
  assert.throws(
    () => harness.core.claimDelivery({
      connectorToken: "wrong_subject",
      claimToken: token,
    }),
    { code: "connector_delivery_scope_invalid", statusCode: 403 },
  );
  assert.equal(harness.store.getDeliveryById(delivery.delivery_id).status, "pending");

  harness.connectors.set("connector_secret", connectorIdentity());
  const claimed = harness.core.claimDelivery({
    connectorToken: "connector_secret",
    claimToken: token,
  });
  assert.deepEqual(Object.keys(claimed).sort(), ["duplicate", "lease"]);
  assert.equal(claimed.duplicate, false);
  assert.equal(claimed.lease.type, "webmcp.delivery_lease");
  assert.equal(claimed.lease.delivery_id, delivery.delivery_id);
  assert.equal(claimed.lease.attempt, 1);
  assert.equal(claimed.lease.lease_token, token);
  assert.equal(
    claimed.lease.lease_expires_at,
    new Date(FIXED_NOW.getTime() + LEASE_DURATION_MS).toISOString(),
  );
  assert.equal(claimed.lease.continuation.state_version, 4);
  assert.equal(claimed.lease.receipt.grant_id, delivery.grant_id);
  for (const forbidden of [
    "connector_001",
    "subject_001",
    "target_001",
    "binding_1",
  ]) {
    assert.ok(!JSON.stringify(claimed).includes(forbidden));
  }

  const stored = harness.store.getDeliveryById(delivery.delivery_id);
  assert.equal(stored.status, "leased");
  assert.equal(stored.current_attempt, 1);
  assert.notEqual(stored.current_lease_token_digest, token);
  assert.ok(!JSON.stringify(stored).includes("connector_secret"));
  assert.ok(!JSON.stringify(stored).includes(token));

  const replay = harness.core.claimDelivery({
    connectorToken: "connector_secret",
    claimToken: token,
  });
  assert.deepEqual(replay, { ...claimed, duplicate: true });
  assert.equal(harness.store.getDeliveryById(delivery.delivery_id).current_attempt, 1);
  harness.connectors.set("other_connector", connectorIdentity({
    connector_id: "connector_002",
  }));
  assert.throws(
    () => harness.core.claimDelivery({
      connectorToken: "other_connector",
      claimToken: token,
    }),
    { code: "delivery_lease_scope_invalid", statusCode: 403 },
  );
  assert.equal(harness.core.claimDelivery({
    connectorToken: "connector_secret",
    claimToken: claimToken(2),
  }), null);
  assert.equal(harness.store.getDeliveryById(delivery.delivery_id).current_attempt, 1);
});

test("expired leases require fresh tokens, fence stale workers, and bound activation", (t) => {
  const clockRef = { value: new Date(FIXED_NOW) };
  const harness = createHarness({
    clockRef,
    leaseDurationMs: 1_000,
    maximumDeliveryAttempts: 3,
  });
  t.after(() => harness.store.close());
  const { delivery } = acceptPendingDelivery(harness);
  harness.connectors.set("connector_secret", connectorIdentity());
  const firstToken = claimToken(10);
  const secondToken = claimToken(11);
  const thirdToken = claimToken(12);

  const first = harness.core.claimDelivery({
    connectorToken: "connector_secret",
    claimToken: firstToken,
  }).lease;
  clockRef.value = new Date(FIXED_NOW.getTime() + 1_001);
  assert.throws(
    () => harness.core.claimDelivery({
      connectorToken: "connector_secret",
      claimToken: firstToken,
    }),
    { code: "claim_token_retired", statusCode: 409 },
  );

  const second = harness.core.claimDelivery({
    connectorToken: "connector_secret",
    claimToken: secondToken,
  }).lease;
  assert.equal(second.attempt, 2);
  assert.throws(
    () => harness.core.acknowledgeDelivery({
      connectorToken: "connector_secret",
      deliveryId: delivery.delivery_id,
      leaseToken: first.lease_token,
      effectToken: "unused_effect",
    }),
    { code: "delivery_lease_invalid", statusCode: 403 },
  );

  clockRef.value = new Date(FIXED_NOW.getTime() + 2_002);
  assert.throws(
    () => harness.core.claimDelivery({
      connectorToken: "connector_secret",
      claimToken: firstToken,
    }),
    { code: "claim_token_retired", statusCode: 409 },
  );
  const third = harness.core.claimDelivery({
    connectorToken: "connector_secret",
    claimToken: thirdToken,
  }).lease;
  assert.equal(third.attempt, 3);

  clockRef.value = new Date(FIXED_NOW.getTime() + 3_003);
  assert.equal(harness.core.claimDelivery({
    connectorToken: "connector_secret",
    claimToken: claimToken(13),
  }), null);
  const exhausted = harness.store.getDeliveryById(delivery.delivery_id);
  assert.equal(exhausted.status, "retry_exhausted");
  assert.equal(exhausted.current_attempt, 3);
  assert.equal(exhausted.terminal_reason, "attempt_limit_reached");

  const confirmedAt = new Date(Date.parse(third.lease_expires_at) - 1);
  harness.effects.set("final_effect", effectAttestation(third, confirmedAt));
  const acknowledgement = harness.core.acknowledgeDelivery({
    connectorToken: "connector_secret",
    deliveryId: delivery.delivery_id,
    leaseToken: thirdToken,
    effectToken: "final_effect",
  });
  assert.equal(acknowledgement.status, "acknowledged");
  assert.equal(acknowledgement.duplicate, false);
  assert.equal(harness.store.getDeliveryById(delivery.delivery_id).status, "acknowledged");
  assert.throws(
    () => harness.core.acknowledgeDelivery({
      connectorToken: "connector_secret",
      deliveryId: delivery.delivery_id,
      leaseToken: secondToken,
      effectToken: "final_effect",
    }),
    { code: "delivery_lease_invalid", statusCode: 403 },
  );
});

test("a persisted attempt cap cannot be widened by Receiver reconfiguration", (t) => {
  const store = new SqliteReceiverStore({ filename: ":memory:" });
  t.after(() => store.close());
  const clockRef = { value: new Date(FIXED_NOW) };
  const first = createHarness({
    store,
    clockRef,
    leaseDurationMs: 1_000,
    maximumDeliveryAttempts: 1,
  });
  const { delivery } = acceptPendingDelivery(first);
  first.connectors.set("connector_secret", connectorIdentity());
  first.core.claimDelivery({
    connectorToken: "connector_secret",
    claimToken: claimToken(14),
  });
  clockRef.value = new Date(FIXED_NOW.getTime() + 1_001);

  const reconfigured = createHarness({
    store,
    keys: first.keys,
    decisions: first.decisions,
    connectors: first.connectors,
    effects: first.effects,
    clockRef,
    leaseDurationMs: 1_000,
    maximumDeliveryAttempts: 100,
  });
  assert.equal(reconfigured.core.claimDelivery({
    connectorToken: "connector_secret",
    claimToken: claimToken(15),
  }), null);
  const exhausted = store.getDeliveryById(delivery.delivery_id);
  assert.equal(exhausted.maximum_attempts, 1);
  assert.equal(exhausted.current_attempt, 1);
  assert.equal(exhausted.status, "retry_exhausted");
  assert.equal(exhausted.terminal_reason, "attempt_limit_reached");
});

test("delivery acknowledgement requires one stable trusted Host effect", (t) => {
  const harness = createHarness();
  t.after(() => harness.store.close());
  const { delivery } = acceptPendingDelivery(harness);
  const leaseToken = claimToken(20);
  harness.connectors.set("connector_secret", connectorIdentity());
  const lease = harness.core.claimDelivery({
    connectorToken: "connector_secret",
    claimToken: leaseToken,
  }).lease;

  assert.throws(
    () => harness.core.acknowledgeDelivery({
      connectorToken: "connector_secret",
      deliveryId: delivery.delivery_id,
      leaseToken,
      effectToken: "effect_secret",
      completed: true,
    }),
    { code: "receiver_input_fields_invalid" },
  );
  assert.throws(
    () => harness.core.acknowledgeDelivery({
      connectorToken: "connector_secret",
      deliveryId: delivery.delivery_id,
      leaseToken,
      effectToken: "unknown_effect",
    }),
    { code: "host_effect_invalid", statusCode: 403 },
  );

  harness.effects.set("wrong_effect", effectAttestation(
    lease,
    new Date(FIXED_NOW.getTime() + 500),
    { event_id: "event_other" },
  ));
  assert.throws(
    () => harness.core.acknowledgeDelivery({
      connectorToken: "connector_secret",
      deliveryId: delivery.delivery_id,
      leaseToken,
      effectToken: "wrong_effect",
    }),
    { code: "host_effect_invalid", statusCode: 403 },
  );
  harness.effects.set("pre_lease_effect", effectAttestation(
    lease,
    new Date(FIXED_NOW.getTime() - 1),
  ));
  assert.throws(
    () => harness.core.acknowledgeDelivery({
      connectorToken: "connector_secret",
      deliveryId: delivery.delivery_id,
      leaseToken,
      effectToken: "pre_lease_effect",
    }),
    { code: "host_effect_time_invalid", statusCode: 403 },
  );
  harness.effects.set("late_effect", effectAttestation(
    lease,
    new Date(lease.lease_expires_at),
  ));
  assert.throws(
    () => harness.core.acknowledgeDelivery({
      connectorToken: "connector_secret",
      deliveryId: delivery.delivery_id,
      leaseToken,
      effectToken: "late_effect",
    }),
    { code: "host_effect_time_invalid", statusCode: 403 },
  );
  assert.equal(harness.store.getDeliveryById(delivery.delivery_id).status, "leased");

  harness.effects.set("effect_secret", (expected) => {
    assert.deepEqual(expected, {
      delivery_id: delivery.delivery_id,
      event_id: lease.event_id,
      correlation_id: lease.continuation.correlation_id,
      workflow_id: lease.continuation.workflow_id,
      canonical_url: lease.continuation.canonical_url,
      human_boundary: "explicit_receiver_consent",
      outcome: HOST_EFFECT_OUTCOME,
    });
    return effectAttestation(lease, new Date(FIXED_NOW.getTime() + 500));
  });
  const acknowledgement = harness.core.acknowledgeDelivery({
    connectorToken: "connector_secret",
    deliveryId: delivery.delivery_id,
    leaseToken,
    effectToken: "effect_secret",
  });
  assert.deepEqual(Object.keys(acknowledgement).sort(), [
    "acknowledged",
    "delivery_id",
    "duplicate",
    "effect_id",
    "event_id",
    "protocol_version",
    "status",
    "type",
  ]);
  assert.equal(acknowledgement.acknowledged, true);
  assert.equal(acknowledgement.duplicate, false);
  assert.ok(!("lease_token" in acknowledgement));
  assert.ok(!("receipt" in acknowledgement));

  const stored = harness.store.getDeliveryById(delivery.delivery_id);
  assert.equal(stored.status, "acknowledged");
  assert.equal(stored.effect_id, "effect_001");
  for (const rawToken of ["connector_secret", leaseToken, "effect_secret"]) {
    assert.ok(!JSON.stringify(stored).includes(rawToken));
  }
  assert.deepEqual(harness.core.acknowledgeDelivery({
    connectorToken: "connector_secret",
    deliveryId: delivery.delivery_id,
    leaseToken,
    effectToken: "effect_secret",
  }), { ...acknowledgement, duplicate: true });

  harness.effects.set("different_effect", effectAttestation(
    lease,
    new Date(FIXED_NOW.getTime() + 500),
    { effect_id: "effect_002" },
  ));
  assert.throws(
    () => harness.core.acknowledgeDelivery({
      connectorToken: "connector_secret",
      deliveryId: delivery.delivery_id,
      leaseToken,
      effectToken: "different_effect",
    }),
    { code: "delivery_effect_conflict", statusCode: 409 },
  );
});

test("expired or revoked pending authority cancels without creating a lease", async (t) => {
  await t.test("Grant expiry cancels the pending delivery", (t) => {
    const clockRef = { value: new Date(FIXED_NOW) };
    const harness = createHarness({
      clockRef,
      maximumGrantLifetimeMs: 1_000,
    });
    t.after(() => harness.store.close());
    const { delivery } = acceptPendingDelivery(harness);
    harness.connectors.set("connector_secret", connectorIdentity());
    const token = claimToken(30);
    clockRef.value = new Date(FIXED_NOW.getTime() + 1_001);

    assert.equal(harness.core.claimDelivery({
      connectorToken: "connector_secret",
      claimToken: token,
    }), null);
    const cancelled = harness.store.getDeliveryById(delivery.delivery_id);
    assert.equal(cancelled.status, "cancelled");
    assert.equal(cancelled.terminal_reason, "grant_expired");
    assert.equal(cancelled.current_attempt, 0);
    assert.equal(cancelled.current_lease_token_digest, null);
  });

  await t.test("a revoked Grant from the persistence port cancels the pending delivery", (t) => {
    const harness = createHarness();
    t.after(() => harness.store.close());
    const { approval, delivery } = acceptPendingDelivery(harness);
    harness.connectors.set("connector_secret", connectorIdentity());
    harness.controls.set(
      "revoke_pending",
      grantControlAuthorization(approval.binding.binding_id, "revoke"),
    );
    harness.core.revokeGrant({
      bindingId: approval.binding.binding_id,
      controlToken: "revoke_pending",
    });

    assert.equal(harness.core.claimDelivery({
      connectorToken: "connector_secret",
      claimToken: claimToken(31),
    }), null);
    const cancelled = harness.store.getDeliveryById(delivery.delivery_id);
    assert.equal(cancelled.status, "cancelled");
    assert.equal(cancelled.terminal_reason, "grant_revoked");
  });

  await t.test("revocation after lease prevents exact claim replay", (t) => {
    const harness = createHarness();
    t.after(() => harness.store.close());
    const { approval, delivery } = acceptPendingDelivery(harness);
    harness.connectors.set("connector_secret", connectorIdentity());
    const token = claimToken(32);
    harness.core.claimDelivery({ connectorToken: "connector_secret", claimToken: token });
    harness.clockRef.value = new Date(FIXED_NOW.getTime() + 1_000);
    harness.controls.set(
      "revoke_leased",
      grantControlAuthorization(approval.binding.binding_id, "revoke"),
    );
    harness.core.revokeGrant({
      bindingId: approval.binding.binding_id,
      controlToken: "revoke_leased",
    });
    assert.equal(harness.core.claimDelivery({
      connectorToken: "connector_secret",
      claimToken: token,
    }), null);
    const exhausted = harness.store.getDeliveryById(delivery.delivery_id);
    assert.equal(exhausted.status, "retry_exhausted");
    assert.equal(exhausted.terminal_reason, "grant_revoked");
  });
});

test("lease-first revocation preserves only pre-revocation Host-effect convergence", async (t) => {
  await t.test("an effect confirmed before revocation can acknowledge late", (t) => {
    const harness = createHarness();
    t.after(() => harness.store.close());
    const { approval, delivery } = acceptPendingDelivery(harness);
    harness.connectors.set("connector_secret", connectorIdentity());
    const leaseToken = claimToken(33);
    const lease = harness.core.claimDelivery({
      connectorToken: "connector_secret",
      claimToken: leaseToken,
    }).lease;
    harness.clockRef.value = new Date(FIXED_NOW.getTime() + 1_000);
    harness.controls.set(
      "revoke_before_ack",
      grantControlAuthorization(approval.binding.binding_id, "revoke"),
    );
    harness.core.revokeGrant({
      bindingId: approval.binding.binding_id,
      controlToken: "revoke_before_ack",
    });
    assert.equal(harness.core.claimDelivery({
      connectorToken: "connector_secret",
      claimToken: leaseToken,
    }), null);

    harness.effects.set(
      "pre_revocation_effect",
      effectAttestation(lease, new Date(FIXED_NOW.getTime() + 500)),
    );
    const acknowledgement = harness.core.acknowledgeDelivery({
      connectorToken: "connector_secret",
      deliveryId: delivery.delivery_id,
      leaseToken,
      effectToken: "pre_revocation_effect",
    });
    assert.equal(acknowledgement.acknowledged, true);
    assert.equal(harness.store.getDeliveryById(delivery.delivery_id).status, "acknowledged");
  });

  await t.test("an effect confirmed at the revocation boundary is rejected", (t) => {
    const harness = createHarness();
    t.after(() => harness.store.close());
    const { approval, delivery } = acceptPendingDelivery(harness);
    harness.connectors.set("connector_secret", connectorIdentity());
    const leaseToken = claimToken(34);
    const lease = harness.core.claimDelivery({
      connectorToken: "connector_secret",
      claimToken: leaseToken,
    }).lease;
    harness.clockRef.value = new Date(FIXED_NOW.getTime() + 1_000);
    harness.controls.set(
      "revoke_before_late_effect",
      grantControlAuthorization(approval.binding.binding_id, "revoke"),
    );
    const revocation = harness.core.revokeGrant({
      bindingId: approval.binding.binding_id,
      controlToken: "revoke_before_late_effect",
    });
    harness.effects.set(
      "post_revocation_effect",
      effectAttestation(lease, new Date(revocation.revoked_at)),
    );

    assert.throws(
      () => harness.core.acknowledgeDelivery({
        connectorToken: "connector_secret",
        deliveryId: delivery.delivery_id,
        leaseToken,
        effectToken: "post_revocation_effect",
      }),
      { code: "host_effect_time_invalid", statusCode: 403 },
    );
    assert.equal(harness.store.getDeliveryById(delivery.delivery_id).status, "leased");
  });
});

test("an injected post-write failure rolls back Grant revocation", (t) => {
  const baseStore = new SqliteReceiverStore({ filename: ":memory:" });
  t.after(() => baseStore.close());
  const failingStore = overrideStoreMethod(baseStore, "revokeGrant", (...args) => {
    baseStore.revokeGrant(...args);
    throw new Error("Injected post-revocation failure");
  });
  const harness = createHarness({ store: failingStore });
  const { approval } = enrollAndApprove(harness);
  harness.controls.set(
    "rollback_control",
    grantControlAuthorization(approval.binding.binding_id, "revoke"),
  );

  assert.throws(
    () => harness.core.revokeGrant({
      bindingId: approval.binding.binding_id,
      controlToken: "rollback_control",
    }),
    /Injected post-revocation failure/,
  );
  assert.equal(
    baseStore.getGrantByBindingId(approval.binding.binding_id).revoked_at,
    null,
  );
});

test("Grant revocation fails closed when a lost write has no durable boundary", (t) => {
  const baseStore = new SqliteReceiverStore({ filename: ":memory:" });
  t.after(() => baseStore.close());
  const failedWriteStore = overrideStoreMethod(baseStore, "revokeGrant", () => false);
  let grantReads = 0;
  const inconsistentStore = overrideStoreMethod(
    failedWriteStore,
    "getGrantByBindingId",
    (...args) => {
      grantReads += 1;
      return grantReads === 1 ? baseStore.getGrantByBindingId(...args) : undefined;
    },
  );
  const harness = createHarness({ store: inconsistentStore });
  const { approval } = enrollAndApprove(harness);
  harness.controls.set(
    "lost_write_control",
    grantControlAuthorization(approval.binding.binding_id, "revoke"),
  );

  assert.throws(
    () => harness.core.revokeGrant({
      bindingId: approval.binding.binding_id,
      controlToken: "lost_write_control",
    }),
    { code: "grant_revocation_race", statusCode: 409 },
  );
  assert.equal(baseStore.getGrantByBindingId(approval.binding.binding_id).revoked_at, null);
});

test("lease lifetime is narrowed by Connector identity and Grant expiry", async (t) => {
  await t.test("Connector identity expiry narrows the lease", (t) => {
    const harness = createHarness();
    t.after(() => harness.store.close());
    acceptPendingDelivery(harness);
    const identityExpiry = new Date(FIXED_NOW.getTime() + 5_000).toISOString();
    harness.connectors.set("short_session", connectorIdentity({ expires_at: identityExpiry }));
    const claimed = harness.core.claimDelivery({
      connectorToken: "short_session",
      claimToken: claimToken(40),
    });
    assert.equal(claimed.lease.lease_expires_at, identityExpiry);
  });

  await t.test("Grant expiry narrows the lease", (t) => {
    const harness = createHarness({ maximumGrantLifetimeMs: 5_000 });
    t.after(() => harness.store.close());
    acceptPendingDelivery(harness);
    harness.connectors.set("connector_secret", connectorIdentity());
    const claimed = harness.core.claimDelivery({
      connectorToken: "connector_secret",
      claimToken: claimToken(41),
    });
    assert.equal(
      claimed.lease.lease_expires_at,
      new Date(FIXED_NOW.getTime() + 5_000).toISOString(),
    );
  });
});

test("claim and acknowledgement roll back after injected post-write failures", (t) => {
  const baseStore = new SqliteReceiverStore({ filename: ":memory:" });
  t.after(() => baseStore.close());
  const harness = createHarness({ store: baseStore });
  const { delivery } = acceptPendingDelivery(harness);
  harness.connectors.set("connector_secret", connectorIdentity());
  const leaseToken = claimToken(50);

  const claimFailureStore = overrideStoreMethod(baseStore, "claimDelivery", (...args) => {
    baseStore.claimDelivery(...args);
    throw new Error("Injected post-claim failure");
  });
  const claimFailureHarness = createHarness({
    store: claimFailureStore,
    keys: harness.keys,
    decisions: harness.decisions,
    connectors: harness.connectors,
    effects: harness.effects,
    clockRef: harness.clockRef,
  });
  assert.throws(
    () => claimFailureHarness.core.claimDelivery({
      connectorToken: "connector_secret",
      claimToken: leaseToken,
    }),
    /Injected post-claim failure/,
  );
  assert.equal(baseStore.getDeliveryById(delivery.delivery_id).status, "pending");

  const lease = harness.core.claimDelivery({
    connectorToken: "connector_secret",
    claimToken: leaseToken,
  }).lease;
  harness.effects.set(
    "effect_secret",
    effectAttestation(lease, new Date(FIXED_NOW.getTime() + 500)),
  );
  const acknowledgementFailureStore = overrideStoreMethod(
    baseStore,
    "acknowledgeDelivery",
    (...args) => {
      baseStore.acknowledgeDelivery(...args);
      throw new Error("Injected post-acknowledgement failure");
    },
  );
  const acknowledgementFailureHarness = createHarness({
    store: acknowledgementFailureStore,
    keys: harness.keys,
    decisions: harness.decisions,
    connectors: harness.connectors,
    effects: harness.effects,
    clockRef: harness.clockRef,
  });
  assert.throws(
    () => acknowledgementFailureHarness.core.acknowledgeDelivery({
      connectorToken: "connector_secret",
      deliveryId: delivery.delivery_id,
      leaseToken,
      effectToken: "effect_secret",
    }),
    /Injected post-acknowledgement failure/,
  );
  const afterFailure = baseStore.getDeliveryById(delivery.delivery_id);
  assert.equal(afterFailure.status, "leased");
  assert.equal(afterFailure.effect_id, null);

  const acknowledged = harness.core.acknowledgeDelivery({
    connectorToken: "connector_secret",
    deliveryId: delivery.delivery_id,
    leaseToken,
    effectToken: "effect_secret",
  });
  assert.equal(acknowledged.duplicate, false);
  assert.equal(baseStore.getDeliveryById(delivery.delivery_id).status, "acknowledged");
});

test("lease and acknowledgement survive file reopen without persisting raw tokens", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "webmcp-delivery-state-"));
  const filename = join(directory, "receiver.sqlite");
  let openStore;
  t.after(async () => {
    openStore?.close();
    for (const path of [filename, `${filename}-wal`, `${filename}-shm`]) {
      await unlinkIfPresent(path);
    }
    await rmdir(directory);
  });

  const keys = createTestKeys();
  const decisions = new Map();
  const connectors = new Map();
  const effects = new Map();
  const clockRef = { value: new Date(FIXED_NOW) };
  const connectorToken = "connector_restart_secret";
  const leaseToken = claimToken(60);
  const effectToken = "effect_restart_secret";
  connectors.set(connectorToken, connectorIdentity());

  openStore = new SqliteReceiverStore({ filename });
  const first = createHarness({
    store: openStore,
    keys,
    decisions,
    connectors,
    effects,
    clockRef,
  });
  const { delivery } = acceptPendingDelivery(first);
  const lease = first.core.claimDelivery({ connectorToken, claimToken: leaseToken }).lease;
  effects.set(effectToken, effectAttestation(lease, new Date(FIXED_NOW.getTime() + 500)));
  openStore.close();

  openStore = new SqliteReceiverStore({ filename });
  const restarted = createHarness({
    store: openStore,
    keys,
    decisions,
    connectors,
    effects,
    clockRef,
  });
  const acknowledged = restarted.core.acknowledgeDelivery({
    connectorToken,
    deliveryId: delivery.delivery_id,
    leaseToken,
    effectToken,
  });
  assert.equal(acknowledged.duplicate, false);
  openStore.close();

  openStore = new SqliteReceiverStore({ filename });
  const replayed = createHarness({
    store: openStore,
    keys,
    decisions,
    connectors,
    effects,
    clockRef,
  }).core.acknowledgeDelivery({
    connectorToken,
    deliveryId: delivery.delivery_id,
    leaseToken,
    effectToken,
  });
  assert.deepEqual(replayed, { ...acknowledged, duplicate: true });
  assert.equal(openStore.getDeliveryById(delivery.delivery_id).status, "acknowledged");
  openStore.close();
  openStore = undefined;

  for (const path of [filename, `${filename}-wal`, `${filename}-shm`]) {
    let bytes;
    try {
      bytes = await readFile(path);
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    for (const rawToken of [connectorToken, leaseToken, effectToken]) {
      assert.equal(bytes.includes(Buffer.from(rawToken)), false);
    }
  }
});

function failDeliveryWrites(baseStore) {
  const wrapper = {
    transaction(callback) {
      return baseStore.transaction(() => callback(wrapper));
    },
    insertDelivery() {
      throw new Error("Injected pending-delivery failure");
    },
  };
  for (const method of [
    "getChallengeByManifestId",
    "getChallengeById",
    "insertChallenge",
    "setChallengeDecision",
    "getGrantByChallengeId",
    "getGrantByBindingId",
    "insertGrant",
    "revokeGrant",
    "consumeGrantRun",
    "getEventById",
    "insertEvent",
    "getDeliveryById",
    "getDeliveryByEffectId",
    "getDeliveryByCurrentLeaseTokenDigest",
    "hasDeliveryAttemptTokenDigest",
    "getActiveDeliveryByTarget",
    "getNextDeliveryByTarget",
    "claimDelivery",
    "cancelDelivery",
    "exhaustDelivery",
    "acknowledgeDelivery",
  ]) {
    wrapper[method] = (...args) => baseStore[method](...args);
  }
  return wrapper;
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

async function unlinkIfPresent(path) {
  try {
    await unlink(path);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
