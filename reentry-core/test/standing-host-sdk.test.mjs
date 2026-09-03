import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { StandingReentryHostSdk } from "../src/standing-host-sdk.mjs";
import {
  STANDING_PROTOCOL_VERSION,
  validateStandingReentryManifest,
  verifyStandingReentryManifestAuthority,
  verifyStandingContinuationEventEnvelope,
} from "../src/standing-protocol.mjs";
import {
  FIXED_NOW,
  HOST_ORIGIN,
  createTestKeys,
} from "./fixtures.mjs";

const KEY_ID = "standing_host_key_001";
const EVENT_OCCURRED_AT = "2026-08-31T03:04:00.000Z";

function createSdk() {
  const keys = createTestKeys();
  const sdk = new StandingReentryHostSdk({
    origin: HOST_ORIGIN,
    privateKey: keys.privateKey,
    keyId: KEY_ID,
    clock: () => FIXED_NOW,
    createId: (prefix) => `${prefix}_standing_generated`,
  });
  const keyFingerprint = createHash("sha256")
    .update(keys.publicKey.export({ type: "spki", format: "der" }))
    .digest("base64url");
  return { ...keys, sdk, keyFingerprint };
}

test("Standing Host SDK issues a signed v0.2 Manifest without exposing a run counter", () => {
  const { publicKey, sdk, keyFingerprint } = createSdk();
  const manifest = sdk.issueManifest({
    offerExpiresAt: "2026-08-31T03:10:00.000Z",
    workflow: manifestWorkflow(),
    display: {
      title: "Keep this workflow moving",
      reason: "Return when useful work becomes available and prepare the next safe step.",
    },
    grantRequest: {
      eventType: "workflow.ready",
      grantExpiresAt: "2026-08-31T04:00:00.000Z",
      humanBoundary: "confirm_irreversible_action",
    },
  });

  assert.equal(manifest.protocol_version, STANDING_PROTOCOL_VERSION);
  assert.equal(manifest.manifest_id, "manifest_standing_generated");
  assert.equal(manifest.correlation_id, "correlation_standing_generated");
  assert.deepEqual(manifest.grant_request, {
    authorization_mode: "standing",
    event_type: "workflow.ready",
    grant_expires_at: "2026-08-31T04:00:00.000Z",
    max_active_activations: 1,
    human_boundary: "confirm_irreversible_action",
  });
  assert.equal("max_runs" in manifest.grant_request, false);
  assert.deepEqual(validateStandingReentryManifest(manifest, {
    now: FIXED_NOW,
    expectedOrigin: HOST_ORIGIN,
    keyResolver: () => publicKey,
  }), manifest);
  assert.deepEqual(verifyStandingReentryManifestAuthority(manifest, {
    now: FIXED_NOW,
    expectedOrigin: HOST_ORIGIN,
    keyResolver: () => publicKey,
  }), { manifest, keyFingerprint });
  assert.deepEqual(Object.getOwnPropertyNames(sdk), []);
});

test("Standing Host SDK signs two caller-sequenced Events from one binding", () => {
  const { publicKey, sdk, keyFingerprint } = createSdk();
  const binding = standingBinding();
  const first = sdk.issueEvent(eventInput(binding, {
    eventId: "event_standing_001",
    eventSequence: 1,
    stateVersion: 4,
  }));
  const second = sdk.issueEvent(eventInput(binding, {
    eventId: "event_standing_002",
    eventSequence: 2,
    stateVersion: 5,
  }));

  for (const issued of [first, second]) {
    assert.deepEqual(verifyStandingContinuationEventEnvelope({
      body: issued.body,
      headers: issued.headers,
    }, {
      now: FIXED_NOW,
      expectedOrigin: HOST_ORIGIN,
      expectedKeyId: KEY_ID,
      expectedKeyFingerprint: keyFingerprint,
      keyResolver: () => publicKey,
    }), issued.event);
  }
  assert.throws(
    () => verifyStandingContinuationEventEnvelope({
      body: first.body,
      headers: first.headers,
    }, {
      now: FIXED_NOW,
      expectedOrigin: HOST_ORIGIN,
      keyResolver: () => publicKey,
    }),
    /expectedKeyId is required/,
  );
  assert.throws(
    () => verifyStandingContinuationEventEnvelope({
      body: first.body,
      headers: first.headers,
    }, {
      now: FIXED_NOW,
      expectedOrigin: HOST_ORIGIN,
      expectedKeyId: KEY_ID,
      keyResolver: () => publicKey,
    }),
    /expectedKeyFingerprint is required/,
  );
  assert.equal(first.event.event_sequence, 1);
  assert.equal(second.event.event_sequence, 2);
  assert.equal(first.event.binding_id, second.event.binding_id);
  assert.equal(first.event.event_type, binding.event_type);
  assert.equal("prompt" in first.event, false);
  assert.equal("grant_id" in first.event, false);
});

test("Standing Host SDK reproduces the same canonical Event for an explicit outbox retry", () => {
  const { sdk } = createSdk();
  const input = eventInput(standingBinding(), {
    eventId: "event_standing_retry_001",
    eventSequence: 1,
    stateVersion: 4,
  });
  const first = sdk.issueEvent(input);
  const retry = sdk.issueEvent({
    ...input,
    deliveryTimestamp: String(Math.floor(FIXED_NOW.getTime() / 1_000) + 1),
  });

  assert.deepEqual(retry.event, first.event);
  assert.equal(retry.body, first.body);
  assert.notEqual(retry.headers["WebMCP-Reentry-Timestamp"], first.headers["WebMCP-Reentry-Timestamp"]);
  assert.notEqual(retry.headers["WebMCP-Reentry-Signature"], first.headers["WebMCP-Reentry-Signature"]);
});

test("Standing Host SDK requires durable Event identity, sequence, and occurrence inputs", () => {
  const { sdk } = createSdk();
  const valid = eventInput(standingBinding(), {
    eventId: "event_standing_required_001",
    eventSequence: 1,
    stateVersion: 4,
  });

  for (const missing of ["eventId", "eventSequence", "occurredAt"]) {
    const input = { ...valid };
    delete input[missing];
    assert.throws(() => sdk.issueEvent(input), { code: "host_input_fields_invalid" });
  }
  assert.throws(
    () => sdk.issueEvent({ ...valid, eventSequence: 0 }),
    { code: "integer_invalid" },
  );
  assert.throws(
    () => sdk.issueEvent({ ...valid, eventId: "event id with spaces" }),
    { code: "identifier_invalid" },
  );
});

test("Standing Host SDK rejects extensions and non-live or mismatched bindings", () => {
  const { sdk } = createSdk();
  const valid = eventInput(standingBinding(), {
    eventId: "event_standing_scope_001",
    eventSequence: 1,
    stateVersion: 4,
  });

  assert.throws(
    () => sdk.issueEvent({ ...valid, prompt: "continue" }),
    { code: "host_input_fields_invalid" },
  );
  assert.throws(
    () => sdk.issueEvent({ ...valid, binding: standingBinding({ status: "revoked" }) }),
    { code: "host_binding_inactive" },
  );
  assert.throws(
    () => sdk.issueEvent({
      ...valid,
      binding: standingBinding({ expires_at: FIXED_NOW.toISOString() }),
    }),
    { code: "host_binding_expired", statusCode: 410 },
  );
  assert.throws(
    () => sdk.issueEvent({
      ...valid,
      binding: standingBinding({ workflow_id: "workflow_other" }),
    }),
    { code: "host_workflow_binding_mismatch" },
  );
  assert.throws(
    () => sdk.issueEvent({
      ...valid,
      binding: { ...standingBinding(), protocol_version: "0.1" },
    }),
    { code: "binding_version_unsupported" },
  );
});

test("Standing Host SDK rejects hidden getters before reading caller values", () => {
  const { sdk } = createSdk();
  const input = {};
  Object.defineProperty(input, "workflow", {
    enumerable: true,
    get() {
      throw new Error("must not execute");
    },
  });
  assert.throws(() => sdk.issueManifest(input), { code: "host_input_invalid" });
});

function manifestWorkflow() {
  return {
    id: "workflow_001",
    type: "domain-neutral-workflow",
    stateVersion: 3,
    canonicalUrl: `${HOST_ORIGIN}/workflows/workflow_001`,
  };
}

function eventInput(binding, { eventId, eventSequence, stateVersion }) {
  return {
    binding,
    eventId,
    eventSequence,
    occurredAt: EVENT_OCCURRED_AT,
    workflow: {
      id: "workflow_001",
      stateVersion,
      canonicalUrl: `${HOST_ORIGIN}/workflows/workflow_001`,
    },
  };
}

function standingBinding(overrides = {}) {
  return {
    type: "webmcp.reentry_binding",
    protocol_version: STANDING_PROTOCOL_VERSION,
    binding_id: "binding_standing_001",
    correlation_id: "correlation_standing_001",
    workflow_id: "workflow_001",
    event_type: "workflow.ready",
    expires_at: "2026-08-31T04:00:00.000Z",
    authorization_mode: "standing",
    max_active_activations: 1,
    last_event_sequence: 0,
    status: "active",
    ...overrides,
  };
}
