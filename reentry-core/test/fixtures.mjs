import { generateKeyPairSync } from "node:crypto";

export const HOST_ORIGIN = "https://host.example";
export const FIXED_NOW = new Date("2026-08-31T03:05:00.000Z");

export function createTestKeys() {
  return generateKeyPairSync("ed25519");
}

export function manifestValue(overrides = {}) {
  return {
    type: "webmcp.reentry_manifest",
    protocol_version: "0.1",
    manifest_id: "manifest_001",
    correlation_id: "correlation_001",
    issuer_origin: HOST_ORIGIN,
    issued_at: "2026-08-31T03:00:00.000Z",
    offer_expires_at: "2026-08-31T03:10:00.000Z",
    workflow: {
      id: "workflow_001",
      type: "domain-neutral-workflow",
      state_version: 3,
      canonical_url: `${HOST_ORIGIN}/workflows/workflow_001`,
    },
    display: {
      title: "Continue this workflow",
      reason: "The authoritative Host state changed while the Agent was away.",
    },
    grant_request: {
      event_type: "workflow.ready",
      grant_expires_at: "2026-08-31T04:00:00.000Z",
      max_runs: 1,
      human_boundary: "explicit_receiver_consent",
    },
    ...overrides,
  };
}

export function publicBinding(overrides = {}) {
  return {
    type: "webmcp.reentry_binding",
    protocol_version: "0.1",
    binding_id: "binding_001",
    correlation_id: "correlation_001",
    workflow_id: "workflow_001",
    event_type: "workflow.ready",
    expires_at: "2026-08-31T04:00:00.000Z",
    runs_remaining: 1,
    status: "active",
    ...overrides,
  };
}

export function continuationEvent(overrides = {}) {
  return {
    type: "webmcp.continuation_event",
    protocol_version: "0.1",
    event_id: "event_001",
    correlation_id: "correlation_001",
    binding_id: "binding_001",
    issuer_origin: HOST_ORIGIN,
    workflow_id: "workflow_001",
    event_type: "workflow.ready",
    event_sequence: 1,
    state_version: 4,
    occurred_at: "2026-08-31T03:04:00.000Z",
    canonical_url: `${HOST_ORIGIN}/workflows/workflow_001`,
    ...overrides,
  };
}

export function continuationReceipt(overrides = {}) {
  return {
    type: "webmcp.continuation_receipt",
    protocol_version: "0.1",
    grant_id: "grant_private_001",
    correlation_id: "correlation_001",
    issuer_origin: HOST_ORIGIN,
    workflow_id: "workflow_001",
    event_type: "workflow.ready",
    canonical_url: `${HOST_ORIGIN}/workflows/workflow_001`,
    expires_at: "2026-08-31T04:00:00.000Z",
    human_boundary: "explicit_receiver_consent",
    continuation_mode: "open_canonical_page_read_current_state",
    ...overrides,
  };
}
