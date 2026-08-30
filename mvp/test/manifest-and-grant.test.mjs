import test from "node:test";
import assert from "node:assert/strict";
import { MANIFEST_SECRET } from "../src/config.mjs";
import { signObject, verifyReentryManifest } from "../src/webmcp-manifest.mjs";
import { approvedEnrollment, FIXED_NOW, TEST_ORIGIN, testRuntime } from "./helpers.mjs";

test("signed manifest verifies and tampering fails", () => {
  const runtime = testRuntime();
  const manifest = runtime.grants.issueManifest("corr_manifest");
  assert.equal(
    verifyReentryManifest(manifest, { expectedOrigin: TEST_ORIGIN, now: FIXED_NOW }),
    manifest,
  );
  assert.throws(
    () => verifyReentryManifest({ ...manifest, max_runs: 2 }, {
      expectedOrigin: TEST_ORIGIN,
      now: FIXED_NOW,
    }),
    /signature is invalid/,
  );
  runtime.database.close();
});

test("signed manifests with invalid expiry timestamps are rejected", () => {
  const runtime = testRuntime();
  const manifest = runtime.grants.issueManifest("corr_invalid_expiry");

  for (const expiresAt of ["not-a-date", "Infinity", 9999, "2026-08-30T12:30:00Z"]) {
    const { signature: _originalSignature, ...unsigned } = {
      ...manifest,
      expires_at: expiresAt,
    };
    const candidate = { ...unsigned, signature: signObject(unsigned, MANIFEST_SECRET) };
    assert.throws(
      () => verifyReentryManifest(candidate, { expectedOrigin: TEST_ORIGIN, now: FIXED_NOW }),
      /expiry is invalid/,
    );
  }

  const { signature: _originalSignature, ...unsigned } = {
    ...manifest,
    expires_at: "9999-01-01T00:00:00.000Z",
  };
  const unbounded = { ...unsigned, signature: signObject(unsigned, MANIFEST_SECRET) };
  assert.throws(
    () => verifyReentryManifest(unbounded, { expectedOrigin: TEST_ORIGIN, now: FIXED_NOW }),
    /allowed horizon/,
  );

  runtime.database.close();
});

test("enrollment accepts a semantically identical signed manifest after JSON key reordering", async () => {
  const runtime = testRuntime();
  const correlationId = "corr_manifest_key_order";
  const issued = runtime.grants.issueManifest(correlationId);
  const reordered = Object.fromEntries(
    Object.entries(issued).sort(([left], [right]) => left.localeCompare(right)),
  );
  const capture = await runtime.grants.captureCurrentContext(correlationId);
  const challenge = runtime.grants.beginEnrollment({
    manifest: reordered,
    capture_handle: capture.capture_handle,
  }, correlationId);

  assert.equal(challenge.status, "PENDING");
  assert.match(challenge.challenge_id, /^ch_/);
  runtime.database.close();
});

test("approval keeps the context private and returns only an opaque host binding", async () => {
  const runtime = testRuntime();
  const manifest = runtime.grants.issueManifest("corr_approve");
  const capture = await runtime.grants.captureCurrentContext("corr_approve");
  assert.equal("managed_context_id" in capture, false);
  assert.equal(capture.managed_context_id_exposed, false);
  const privateCapture = runtime.database.prepare(`
    SELECT managed_context_id, status FROM context_captures WHERE correlation_id = ?
  `).get("corr_approve");
  const challenge = runtime.grants.beginEnrollment({
    manifest,
    capture_handle: capture.capture_handle,
  }, "corr_approve");
  assert.throws(
    () => runtime.grants.beginEnrollment({
      manifest,
      capture_handle: capture.capture_handle,
    }, "corr_approve"),
    /already consumed/,
  );
  const approval = await runtime.grants.approveChallenge(
    challenge.challenge_id,
    "corr_approve",
    { humanAction: true },
  );

  assert.match(approval.agent_binding, /^ab_opaque_/);
  assert.equal("managed_context_id" in approval, false);
  assert.equal("managed_context_id" in approval.grant_summary, false);
  const privateGrant = runtime.database.prepare(
    "SELECT managed_context_id, receipt_json FROM grants WHERE grant_id = ?",
  ).get(approval.grant_id);
  assert.equal(privateGrant.managed_context_id, privateCapture.managed_context_id);
  assert.equal(JSON.parse(privateGrant.receipt_json).receipt_type, "WEBMCP_REENTRY_GRANT");

  const registered = runtime.grants.registerHostBinding({
    workflow_id: "WF-001",
    agent_binding: approval.agent_binding,
  }, "corr_approve");
  assert.equal("managed_context_id" in registered, false);
  assert.equal(
    JSON.stringify(runtime.grants.getHostBinding()).includes(privateCapture.managed_context_id),
    false,
  );
  runtime.database.close();
});

test("approval persists an activating Grant before dispatch and activates it before binding", async () => {
  const runtime = testRuntime();
  const originalAdapter = runtime.adapter;
  let statusDuringReceiptDispatch;
  runtime.grants.adapter = {
    captureCurrentContext: (input) => originalAdapter.captureCurrentContext(input),
    async persistContinuationReceipt(input) {
      statusDuringReceiptDispatch = runtime.database.prepare(
        "SELECT status FROM grants WHERE grant_id = ?",
      ).get(input.receipt.grant_id)?.status;
      return originalAdapter.persistContinuationReceipt(input);
    },
  };
  const correlationId = "corr_activation_order";
  const manifest = runtime.grants.issueManifest(correlationId);
  const capture = await runtime.grants.captureCurrentContext(correlationId);
  const challenge = runtime.grants.beginEnrollment({
    manifest,
    capture_handle: capture.capture_handle,
  }, correlationId);

  const approval = await runtime.grants.approveChallenge(
    challenge.challenge_id,
    correlationId,
    { humanAction: true },
  );

  assert.equal(statusDuringReceiptDispatch, "ACTIVATING");
  assert.equal(runtime.database.prepare(
    "SELECT status FROM grants WHERE grant_id = ?",
  ).get(approval.grant_id).status, "ACTIVE");
  runtime.database.close();
});

test("a newly opened canonical page registers by opaque binding and adopts the Grant correlation", async () => {
  const runtime = testRuntime();
  const grantCorrelationId = "corr_grant_binding";
  const manifest = runtime.grants.issueManifest(grantCorrelationId);
  const capture = await runtime.grants.captureCurrentContext(grantCorrelationId);
  const challenge = runtime.grants.beginEnrollment({
    manifest,
    capture_handle: capture.capture_handle,
  }, grantCorrelationId);
  const approval = await runtime.grants.approveChallenge(
    challenge.challenge_id,
    grantCorrelationId,
    { humanAction: true },
  );

  const registered = runtime.grants.registerHostBinding({
    workflow_id: "WF-001",
    agent_binding: approval.agent_binding,
  }, "corr_fresh_canonical_page");

  assert.equal(registered.grant_summary.correlation_id, grantCorrelationId);
  assert.equal(runtime.grants.getHostBinding().grant_summary.correlation_id, grantCorrelationId);
  runtime.database.close();
});

test("stale Stage-A offer and binding calls fail closed after the workflow leaves INITIAL", async () => {
  const runtime = testRuntime();
  const enrollment = await approvedEnrollment(runtime, "corr_stale_stage_a");
  runtime.domain.transitionToReady("corr_stale_stage_a");
  const manifestCount = runtime.database.prepare(
    "SELECT count(*) AS count FROM manifests",
  ).get().count;

  assert.throws(
    () => runtime.grants.issueManifest("corr_late_offer"),
    /only valid in INITIAL/,
  );
  assert.equal(runtime.database.prepare(
    "SELECT count(*) AS count FROM manifests",
  ).get().count, manifestCount);
  assert.throws(
    () => runtime.grants.registerHostBinding({
      workflow_id: "WF-001",
      agent_binding: enrollment.approval.agent_binding,
    }, "corr_stale_stage_a"),
    /only valid in INITIAL/,
  );

  runtime.database.close();
});

test("enrollment rejects caller-selected raw managed context identity", async () => {
  const runtime = testRuntime();
  const manifest = runtime.grants.issueManifest("corr_raw_context_reject");
  const capture = await runtime.grants.captureCurrentContext("corr_raw_context_reject");
  assert.throws(
    () => runtime.grants.beginEnrollment({
      manifest,
      capture_handle: capture.capture_handle,
      managed_context_kind: "synthetic",
      managed_context_id: "caller_selected_context",
    }, "corr_raw_context_reject"),
    /unsupported fields/,
  );
  assert.equal(runtime.database.prepare(
    "SELECT count(*) AS count FROM binding_challenges",
  ).get().count, 0);
  runtime.database.close();
});

test("approval requires the Receiver consent action signal", async () => {
  const runtime = testRuntime();
  const manifest = runtime.grants.issueManifest("corr_human_action");
  const capture = await runtime.grants.captureCurrentContext("corr_human_action");
  const challenge = runtime.grants.beginEnrollment({
    manifest,
    capture_handle: capture.capture_handle,
  }, "corr_human_action");
  await assert.rejects(
    runtime.grants.approveChallenge(challenge.challenge_id, "corr_human_action"),
    /Receiver consent UI/,
  );
  assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM grants").get().count, 0);
  runtime.database.close();
});

test("declining consent creates no Grant, host binding, or receipt", async () => {
  const runtime = testRuntime();
  const manifest = runtime.grants.issueManifest("corr_decline");
  const capture = await runtime.grants.captureCurrentContext("corr_decline");
  const privateCapture = runtime.database.prepare(`
    SELECT managed_context_id FROM context_captures WHERE correlation_id = ?
  `).get("corr_decline");
  const challenge = runtime.grants.beginEnrollment({
    manifest,
    capture_handle: capture.capture_handle,
  }, "corr_decline");
  const result = runtime.grants.declineChallenge(
    challenge.challenge_id,
    "corr_decline",
    { humanAction: true },
  );
  assert.equal(result.grant_created, false);
  assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM grants").get().count, 0);
  assert.equal(runtime.grants.getHostBinding(), null);
  assert.equal(runtime.adapter.getContext(privateCapture.managed_context_id).receipt_json, null);
  runtime.database.close();
});
