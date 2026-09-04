import assert from "node:assert/strict";
import test from "node:test";

import {
  dispatchRuntimeAdmission,
  RuntimeAdmissionUnavailableError,
  RUNTIME_ADMISSION_CAPABILITY,
} from "../src/runtime-admission.mjs";
import { STANDING_PROTOCOL_VERSION, createStandingContinuationReceipt } from "../src/standing-protocol.mjs";

const NOW = new Date("2026-09-04T12:00:00.000Z");
const LEASE_TOKEN = Buffer.alloc(32, 7).toString("base64url");

test("runtime admission dispatch returns a qualified attestation without forwarding lease credentials", async () => {
  let adapterInput;
  const lease = standingLease();
  const result = await dispatchRuntimeAdmission({
    adapter: {
      admitNotification(input) {
        adapterInput = input;
        return attestation();
      },
    },
    lease,
    handoffId: "handoff_001",
    now: NOW,
    timeoutMs: 1_000,
  });
  assert.equal(result.outcome, "admitted");
  assert.equal(result.code, "runtime_admission_accepted");
  assert.deepEqual(result.attestation, attestation());
  assert.equal("lease_token" in adapterInput.activation, false);
  assert.equal("lease_token" in adapterInput, false);
  assert.equal("connector_token" in adapterInput, false);
});

test("runtime admission dispatch makes an absent same-task seam explicit", async () => {
  const result = await dispatchRuntimeAdmission({
    adapter: { activate() { throw new Error("fresh task fallback is forbidden"); } },
    lease: standingLease(),
    handoffId: "handoff_001",
    now: NOW,
    timeoutMs: 1_000,
  });
  assert.deepEqual(
    {
      outcome: result.outcome,
      code: result.code,
      unavailable_capability: result.unavailable_capability,
      attestation: result.attestation,
    },
    {
      outcome: "unsupported",
      code: "runtime_admission_unavailable",
      unavailable_capability: RUNTIME_ADMISSION_CAPABILITY,
      attestation: null,
    },
  );
});

test("runtime admission dispatch preserves unknown on adapter failure, timeout, or invalid proof", async () => {
  const common = {
    lease: standingLease(),
    handoffId: "handoff_001",
    now: NOW,
    timeoutMs: 100,
  };
  const failed = await dispatchRuntimeAdmission({
    ...common,
    adapter: { admitNotification() { throw new Error("host failed"); } },
  });
  assert.equal(failed.outcome, "outcome_unknown");
  assert.equal(failed.code, "runtime_admission_invocation_failed");

  const timedOut = await dispatchRuntimeAdmission({
    ...common,
    adapter: { admitNotification: async () => new Promise(() => {}) },
  });
  assert.equal(timedOut.outcome, "outcome_unknown");
  assert.equal(timedOut.code, "runtime_admission_invocation_timed_out");

  const invalid = await dispatchRuntimeAdmission({
    ...common,
    adapter: { admitNotification: () => ({}) },
  });
  assert.equal(invalid.outcome, "outcome_unknown");
  assert.equal(invalid.code, "runtime_admission_result_invalid");
});

test("runtime admission keeps an explicit Adapter capability miss unsupported", async () => {
  const result = await dispatchRuntimeAdmission({
    adapter: {
      admitNotification() {
        throw new RuntimeAdmissionUnavailableError();
      },
    },
    lease: standingLease(),
    handoffId: "handoff_001",
    now: NOW,
    timeoutMs: 1_000,
  });
  assert.deepEqual(
    {
      outcome: result.outcome,
      code: result.code,
      unavailable_capability: result.unavailable_capability,
      attestation: result.attestation,
    },
    {
      outcome: "unsupported",
      code: "runtime_admission_unavailable",
      unavailable_capability: RUNTIME_ADMISSION_CAPABILITY,
      attestation: null,
    },
  );
});

function standingLease() {
  const expiresAt = new Date(NOW.getTime() + 5 * 60_000).toISOString();
  return {
    type: "webmcp.delivery_lease",
    protocol_version: STANDING_PROTOCOL_VERSION,
    delivery_id: "delivery_001",
    event_id: "event_001",
    attempt: 1,
    lease_token: LEASE_TOKEN,
    lease_expires_at: expiresAt,
    continuation: {
      correlation_id: "correlation_001",
      workflow_id: "workflow_001",
      event_type: "workflow.ready",
      event_sequence: 1,
      state_version: 1,
      occurred_at: NOW.toISOString(),
      canonical_url: "https://host.example/workflows/workflow_001",
      instruction: "Review the latest state and prepare the next safe step.",
    },
    receipt: createStandingContinuationReceipt({
      type: "webmcp.continuation_receipt",
      protocol_version: STANDING_PROTOCOL_VERSION,
      grant_id: "grant_001",
      correlation_id: "correlation_001",
      issuer_origin: "https://host.example",
      workflow_id: "workflow_001",
      event_type: "workflow.ready",
      canonical_url: "https://host.example/workflows/workflow_001",
      expires_at: expiresAt,
      human_boundary: "explicit_receiver_consent",
      authorization_mode: "standing",
      max_active_activations: 1,
      continuation_mode: "open_canonical_page_read_current_state",
    }),
  };
}

function attestation() {
  return {
    type: "webmcp.runtime_admission_attestation",
    protocol_version: STANDING_PROTOCOL_VERSION,
    admission_id: "admission_001",
    adapter_id: "codex_desktop_v1",
    binding_generation: "a".repeat(64),
    delivery_id: "delivery_001",
    event_id: "event_001",
    handoff_id: "handoff_001",
    accepted_at: NOW.toISOString(),
  };
}
