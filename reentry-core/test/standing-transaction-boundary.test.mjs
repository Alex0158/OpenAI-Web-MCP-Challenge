import assert from "node:assert/strict";
import test from "node:test";

import {
  STANDING_CONNECTOR_IDENTITY_TYPE,
  STANDING_CONSENT_DECISION_TYPE,
  STANDING_GRANT_CONTROL_AUTHORIZATION_TYPE,
  STANDING_HOST_EFFECT_ATTESTATION_TYPE,
  StandingAuthorizationCore,
} from "../src/standing-authorization-core.mjs";
import {
  createStandingContinuationEvent,
  createStandingContinuationEventEnvelope,
  createStandingReentryManifest,
} from "../src/standing-protocol.mjs";
import { SqliteReceiverStore } from "../src/sqlite-receiver-store.mjs";
import { createTestKeys } from "./fixtures.mjs";

const START = Date.parse("2026-09-03T12:00:00.000Z");
const ORIGIN = "https://host.example";
const CLAIM_TOKEN = Buffer.alloc(32, 7).toString("base64url");
const iso = (offset) => new Date(START + offset).toISOString();

// Advance time or change an authority only after the real SQLite writer lock is
// acquired. This deterministically models time spent waiting for BEGIN IMMEDIATE,
// without sleeps, another process, or a persistent database.
function harness(t, { maximumGrantLifetimeMs = 60_000 } = {}) {
  const store = new SqliteReceiverStore({ filename: ":memory:" });
  t.after(() => store.close());
  const keys = createTestKeys();
  let now = 0;
  let onLock;
  let nextId = 0;
  let decision;
  let effect;
  const live = { key: keys.publicKey, consent: true, connector: true, control: true, effect: true };
  const proxy = new Proxy(store, {
    get(target, property) {
      if (property === "transaction") {
        return (callback) => target.transaction((transaction) => {
          const gate = onLock;
          onLock = undefined;
          gate?.();
          return callback(transaction);
        });
      }
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  const core = new StandingAuthorizationCore({
    store: proxy,
    keyResolver: () => live.key,
    consentAuthority: { verifyDecision: () => live.consent ? decision : undefined },
    connectorAuthority: {
      verifyConnector: () => live.connector ? {
        type: STANDING_CONNECTOR_IDENTITY_TYPE,
        protocol_version: "0.2",
        connector_id: "connector_boundary",
        subject_id: "subject_boundary",
        delivery_target_id: "target_boundary",
        authenticated_at: iso(0),
        expires_at: iso(30_000),
      } : undefined,
    },
    grantControlAuthority: {
      verifyControl: ({ bindingId, action }) => live.control ? {
        type: STANDING_GRANT_CONTROL_AUTHORIZATION_TYPE,
        protocol_version: "0.2",
        binding_id: bindingId,
        action,
        subject_id: "subject_boundary",
        authenticated_at: iso(0),
        expires_at: iso(30_000),
      } : undefined,
    },
    effectAuthority: { verifyEffect: () => live.effect ? effect : undefined },
    maximumGrantLifetimeMs,
    leaseDurationMs: 10_000,
    clock: () => new Date(START + now),
    createId: (prefix) => `${prefix}_${++nextId}`,
  });
  const manifest = createStandingReentryManifest({
    type: "webmcp.reentry_manifest",
    protocol_version: "0.2",
    manifest_id: "manifest_boundary",
    correlation_id: "correlation_boundary",
    issuer_origin: ORIGIN,
    issued_at: iso(0),
    offer_expires_at: iso(20_000),
    workflow: {
      id: "workflow_boundary",
      type: "transaction_boundary",
      state_version: 0,
      canonical_url: `${ORIGIN}/workflows/boundary`,
    },
    display: { title: "Continue workflow", reason: "Read current state before continuing." },
    grant_request: {
      authorization_mode: "standing",
      event_type: "workflow.ready",
      grant_expires_at: iso(3_600_000),
      max_active_activations: 1,
      human_boundary: "explicit_receiver_consent",
    },
  }, { privateKey: keys.privateKey, keyId: "key_boundary" });
  const enroll = () => core.createConsentChallenge({ manifest, expectedOrigin: ORIGIN });
  const prepareDecision = (action = "approve") => {
    const challengeId = enroll().challenge.challenge_id;
    decision = {
      type: STANDING_CONSENT_DECISION_TYPE,
      protocol_version: "0.2",
      decision_id: "decision_boundary",
      challenge_id: challengeId,
      action,
      subject_id: "subject_boundary",
      ...(action === "approve" ? { delivery_target_id: "target_boundary" } : {}),
      decided_at: iso(now),
    };
    return { challengeId, decisionToken: "decision_token" };
  };
  const approve = () => core.decideConsent(prepareDecision()).binding;
  const signal = (binding) => createStandingContinuationEventEnvelope(
    createStandingContinuationEvent({
      type: "webmcp.continuation_event",
      protocol_version: "0.2",
      event_id: "event_boundary",
      correlation_id: binding.correlation_id,
      binding_id: binding.binding_id,
      issuer_origin: ORIGIN,
      workflow_id: binding.workflow_id,
      event_type: binding.event_type,
      event_sequence: 1,
      state_version: 1,
      occurred_at: iso(now),
      canonical_url: `${ORIGIN}/workflows/boundary`,
    }),
    { privateKey: keys.privateKey, keyId: "key_boundary", timestamp: String((START + now) / 1_000) },
  );
  const claim = () => core.claimDelivery({ connectorToken: "connector_token", claimToken: CLAIM_TOKEN });
  const pending = () => {
    const binding = approve();
    const envelope = signal(binding);
    core.acceptEvent(envelope);
    return { binding, envelope };
  };
  const leased = () => {
    const pendingValue = pending();
    const { lease } = claim();
    effect = {
      type: STANDING_HOST_EFFECT_ATTESTATION_TYPE,
      protocol_version: "0.2",
      effect_id: "effect_boundary",
      delivery_id: lease.delivery_id,
      event_id: lease.event_id,
      correlation_id: lease.continuation.correlation_id,
      workflow_id: lease.continuation.workflow_id,
      outcome: "committed",
      confirmed_at: iso(1_000),
    };
    const ackInput = {
      connectorToken: "connector_token",
      deliveryId: lease.delivery_id,
      leaseToken: CLAIM_TOKEN,
      effectToken: "effect_token",
    };
    return { ...pendingValue, lease, ackInput };
  };
  return {
    store, core, live, enroll, prepareDecision, approve, signal, claim, pending, leased,
    advance: (offset) => { now = offset; },
    atLock: (callback) => { onLock = callback; },
    revoke: (binding) => core.revokeGrant({ bindingId: binding.binding_id, controlToken: "control_token" }),
  };
}

test("challenge validates offer expiry after acquiring the writer lock", (t) => {
  const h = harness(t);
  h.atLock(() => h.advance(20_000));
  assert.throws(h.enroll, { code: "manifest_expired", statusCode: 410 });
  assert.equal(h.store.getStandingChallengeByManifestId("manifest_boundary"), undefined);
});

test("duplicate challenge cannot report pending after its offer expires while waiting", (t) => {
  const h = harness(t);
  h.enroll();
  h.atLock(() => h.advance(20_000));
  assert.throws(h.enroll, { code: "manifest_expired", statusCode: 410 });
});

test("challenge pins live key authority and starts its lifetime at the locked clock", (t) => {
  const h = harness(t);
  h.atLock(() => h.advance(1_000));
  const challenge = h.enroll().challenge;
  assert.equal(h.store.getStandingChallengeById(challenge.challenge_id).created_at, iso(1_000));
  assert.equal(challenge.grant_scope.expires_at, iso(61_000));
});

test("challenge rejects a signing key withdrawn before the writer lock", (t) => {
  const h = harness(t);
  h.atLock(() => { h.live.key = undefined; });
  assert.throws(h.enroll, { code: "manifest_key_unavailable" });
  assert.equal(h.store.getStandingChallengeByManifestId("manifest_boundary"), undefined);
});

for (const action of ["approve", "decline"]) {
  test(`Consent ${action} resolves decision authority after acquiring the writer lock`, (t) => {
    const h = harness(t);
    const input = h.prepareDecision(action);
    h.atLock(() => { h.live.consent = false; });
    assert.throws(() => h.core.decideConsent(input), { code: "consent_decision_invalid" });
    assert.equal(h.store.getStandingChallengeById(input.challengeId).status, "pending");
    assert.equal(h.store.getStandingGrantByChallengeId(input.challengeId), undefined);
  });
}

test("Consent approval revalidates the offer and consented key after the writer lock", (t) => {
  const h = harness(t);
  const input = h.prepareDecision();
  h.atLock(() => h.advance(20_000));
  assert.throws(() => h.core.decideConsent(input), { code: "manifest_expired", statusCode: 410 });
  h.advance(0);
  h.atLock(() => { h.live.key = undefined; });
  assert.throws(() => h.core.decideConsent(input), { code: "manifest_key_unavailable" });
  assert.equal(h.store.getStandingGrantByChallengeId(input.challengeId), undefined);
});

test("Consent approval rechecks the frozen effective lifetime after the writer lock", (t) => {
  const h = harness(t, { maximumGrantLifetimeMs: 1_000 });
  const input = h.prepareDecision();
  h.atLock(() => h.advance(1_000));
  assert.throws(() => h.core.decideConsent(input), { code: "consent_decision_expired" });
  assert.equal(h.store.getStandingGrantByChallengeId(input.challengeId), undefined);
});

test("Consent terminal replay keeps history but reports the locked Grant status", (t) => {
  const h = harness(t, { maximumGrantLifetimeMs: 1_000 });
  const input = h.prepareDecision();
  const first = h.core.decideConsent(input);
  h.atLock(() => h.advance(20_000));
  const replay = h.core.decideConsent(input);
  assert.equal(replay.duplicate, true);
  assert.equal(replay.binding.binding_id, first.binding.binding_id);
  assert.equal(replay.binding.status, "expired");
});

test("Event checks Grant expiry after the writer lock without consuming sequence", (t) => {
  const h = harness(t, { maximumGrantLifetimeMs: 1_000 });
  const binding = h.approve();
  const envelope = h.signal(binding);
  h.atLock(() => h.advance(1_000));
  assert.throws(() => h.core.acceptEvent(envelope), { code: "grant_expired", statusCode: 410 });
  assert.equal(h.store.getStandingEventById("event_boundary"), undefined);
  assert.equal(h.store.getStandingGrantByBindingId(binding.binding_id).last_event_sequence, 0);
});

test("Event re-resolves pinned key material after the writer lock", (t) => {
  const h = harness(t);
  const binding = h.approve();
  const envelope = h.signal(binding);
  h.atLock(() => { h.live.key = createTestKeys().publicKey; });
  assert.throws(() => h.core.acceptEvent(envelope), { code: "event_key_material_scope_invalid" });
  assert.equal(h.store.getStandingEventById("event_boundary"), undefined);
});

test("Event persists locked receipt time and retains accepted replay after revocation", (t) => {
  const h = harness(t);
  const binding = h.approve();
  const envelope = h.signal(binding);
  h.atLock(() => h.advance(1_000));
  h.core.acceptEvent(envelope);
  assert.equal(h.store.getStandingEventById("event_boundary").received_at, iso(1_000));
  h.revoke(binding);
  assert.equal(h.core.acceptEvent(envelope).duplicate, true);
});

test("claim checks current Connector authority and expiry after the writer lock", (t) => {
  const h = harness(t);
  const { binding } = h.pending();
  h.atLock(() => { h.live.connector = false; });
  assert.throws(h.claim, { code: "connector_identity_invalid" });
  h.live.connector = true;
  h.atLock(() => h.advance(30_000));
  assert.throws(h.claim, { code: "connector_identity_time_invalid" });
  const grant = h.store.getStandingGrantByBindingId(binding.binding_id);
  assert.equal(h.store.getOpenStandingDeliveryByGrantId(grant.grant_id).status, "pending");
});

test("claim does not lease a Grant that expired while waiting for the writer lock", (t) => {
  const h = harness(t, { maximumGrantLifetimeMs: 1_000 });
  h.pending();
  h.atLock(() => h.advance(1_000));
  assert.equal(h.claim(), null);
});

test("new and replayed claims use the locked lease clock", (t) => {
  const h = harness(t);
  h.pending();
  h.atLock(() => h.advance(1_000));
  const { lease } = h.claim();
  assert.equal(lease.lease_expires_at, iso(11_000));
  assert.equal(h.store.getStandingDeliveryById(lease.delivery_id).leased_at, iso(1_000));
  h.atLock(() => h.advance(11_000));
  assert.throws(h.claim, { code: "claim_token_retired" });
});

test("ACK revalidates Connector and effect authority after the writer lock", (t) => {
  const h = harness(t);
  const { lease, ackInput } = h.leased();
  h.atLock(() => { h.live.connector = false; });
  assert.throws(() => h.core.acknowledgeDelivery(ackInput), { code: "connector_identity_invalid" });
  h.live.connector = true;
  h.atLock(() => { h.live.effect = false; });
  assert.throws(() => h.core.acknowledgeDelivery(ackInput), { code: "host_effect_invalid" });
  assert.equal(h.store.getStandingDeliveryById(lease.delivery_id).status, "leased");
});

test("ACK checks Connector expiry after the writer lock", (t) => {
  const h = harness(t);
  const { lease, ackInput } = h.leased();
  h.atLock(() => h.advance(30_000));
  assert.throws(() => h.core.acknowledgeDelivery(ackInput), { code: "connector_identity_time_invalid" });
  assert.equal(h.store.getStandingDeliveryById(lease.delivery_id).status, "leased");
});

test("late ACK preserves a valid historical effect and persists locked acknowledgement time", (t) => {
  const h = harness(t, { maximumGrantLifetimeMs: 5_000 });
  const { lease, ackInput } = h.leased();
  h.atLock(() => h.advance(6_000));
  assert.equal(h.core.acknowledgeDelivery(ackInput).duplicate, false);
  assert.equal(h.store.getStandingDeliveryById(lease.delivery_id).acknowledged_at, iso(6_000));
  assert.equal(h.core.acknowledgeDelivery(ackInput).duplicate, true);
});

test("revoke resolves live control authority and expiry after the writer lock", (t) => {
  const h = harness(t);
  const binding = h.approve();
  h.atLock(() => { h.live.control = false; });
  assert.throws(() => h.revoke(binding), { code: "grant_control_invalid" });
  h.live.control = true;
  h.atLock(() => h.advance(30_000));
  assert.throws(() => h.revoke(binding), { code: "grant_control_time_invalid" });
  assert.equal(h.store.getStandingGrantByBindingId(binding.binding_id).revoked_at, null);
});

test("revoke cannot backdate across a committed effect; duplicate revoke keeps its timestamp", (t) => {
  const h = harness(t);
  const { binding, ackInput } = h.leased();
  h.atLock(() => h.advance(2_000));
  assert.equal(h.revoke(binding).revoked_at, iso(2_000));
  assert.equal(h.core.acknowledgeDelivery(ackInput).acknowledged, true);
  h.atLock(() => h.advance(3_000));
  const replay = h.revoke(binding);
  assert.equal(replay.duplicate, true);
  assert.equal(replay.revoked_at, iso(2_000));
});
