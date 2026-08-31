import assert from "node:assert/strict";
import test from "node:test";

import { ReentryHostSdk } from "../src/host-sdk.mjs";
import {
  validateReentryManifest,
  verifyContinuationEventEnvelope,
} from "../src/protocol.mjs";
import {
  FIXED_NOW,
  HOST_ORIGIN,
  createTestKeys,
  publicBinding,
} from "./fixtures.mjs";

function createSdk() {
  const keys = createTestKeys();
  const sdk = new ReentryHostSdk({
    origin: HOST_ORIGIN,
    privateKey: keys.privateKey,
    keyId: "host_key_001",
    clock: () => FIXED_NOW,
    createId: (prefix) => `${prefix}_generated`,
  });
  return { ...keys, sdk };
}

test("Host SDK issues a bounded signed Manifest from Host-owned fields", () => {
  const { publicKey, sdk } = createSdk();
  const manifest = sdk.issueManifest({
    offerExpiresAt: "2026-08-31T03:10:00.000Z",
    workflow: {
      id: "workflow_001",
      type: "domain-neutral-workflow",
      stateVersion: 3,
      canonicalUrl: `${HOST_ORIGIN}/workflows/workflow_001`,
    },
    display: {
      title: "Continue this workflow",
      reason: "The authoritative Host state changed while the Agent was away.",
    },
    grantRequest: {
      eventType: "workflow.ready",
      grantExpiresAt: "2026-08-31T04:00:00.000Z",
      humanBoundary: "explicit_receiver_consent",
    },
  });

  assert.equal(manifest.manifest_id, "manifest_generated");
  assert.equal(manifest.correlation_id, "correlation_generated");
  assert.equal(manifest.grant_request.max_runs, 1);
  assert.ok(!("grant_id" in manifest));
  assert.deepEqual(validateReentryManifest(manifest, {
    now: FIXED_NOW,
    expectedOrigin: HOST_ORIGIN,
    keyResolver: () => publicKey,
  }), manifest);
  assert.deepEqual(Object.getOwnPropertyNames(sdk), []);
});

test("Host SDK derives event authority from the public binding instead of caller policy", () => {
  const { publicKey, sdk } = createSdk();
  const issued = sdk.issueEvent({
    binding: publicBinding(),
    workflow: {
      id: "workflow_001",
      stateVersion: 4,
      canonicalUrl: `${HOST_ORIGIN}/workflows/workflow_001`,
    },
  });
  const verified = verifyContinuationEventEnvelope({
    body: issued.body,
    headers: issued.headers,
  }, {
    now: FIXED_NOW,
    expectedOrigin: HOST_ORIGIN,
    keyResolver: () => publicKey,
  });

  assert.deepEqual(verified, issued.event);
  assert.equal(verified.event_id, "event_generated");
  assert.equal(verified.event_type, "workflow.ready");
  assert.equal(verified.correlation_id, "correlation_001");
  assert.ok(!("grant_id" in verified));
  assert.ok(!("prompt" in verified));
  assert.ok(!("goal" in verified));
});

test("Host SDK rejects caller extensions and non-live or mismatched bindings", () => {
  const { sdk } = createSdk();
  const workflow = {
    id: "workflow_001",
    stateVersion: 4,
    canonicalUrl: `${HOST_ORIGIN}/workflows/workflow_001`,
  };

  assert.throws(
    () => sdk.issueEvent({ binding: publicBinding(), workflow, prompt: "continue" }),
    { code: "host_input_fields_invalid" },
  );
  assert.throws(
    () => sdk.issueEvent({ binding: publicBinding({ status: "revoked" }), workflow }),
    { code: "host_binding_inactive" },
  );
  assert.throws(
    () => sdk.issueEvent({ binding: publicBinding({ runs_remaining: 0 }), workflow }),
    { code: "host_binding_exhausted" },
  );
  assert.throws(
    () => sdk.issueEvent({
      binding: publicBinding({ expires_at: "2026-08-31T03:05:00.000Z" }),
      workflow,
    }),
    { code: "host_binding_expired", statusCode: 410 },
  );
  assert.throws(
    () => sdk.issueEvent({
      binding: publicBinding({ workflow_id: "workflow_other" }),
      workflow,
    }),
    { code: "host_workflow_binding_mismatch" },
  );
});

test("Host SDK rejects hidden getters before reading caller values", () => {
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
