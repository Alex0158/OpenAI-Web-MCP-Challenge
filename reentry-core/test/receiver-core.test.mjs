import assert from "node:assert/strict";
import { mkdtemp, rmdir, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  CONSENT_DECISION_TYPE,
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

function createHarness({
  store = new SqliteReceiverStore({ filename: ":memory:" }),
  keys = createTestKeys(),
  decisions = new Map(),
  clockRef = { value: new Date(FIXED_NOW) },
  maximumGrantLifetimeMs = MAXIMUM_GRANT_LIFETIME_MS,
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
    maximumGrantLifetimeMs,
    clock: () => clockRef.value,
    createId,
  });
  return { core, store, keys, decisions, clockRef };
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
    "consumeGrantRun",
    "getEventById",
    "insertEvent",
  ]) {
    wrapper[method] = (...args) => baseStore[method](...args);
  }
  return wrapper;
}

async function unlinkIfPresent(path) {
  try {
    await unlink(path);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
