import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";

import {
  dispatchAgentActivation,
} from "@webmcp-challenge/reentry-core/agent-adapter";
import { dispatchRuntimeAdmission } from "@webmcp-challenge/reentry-core/runtime-admission";
import { createContinuationReceipt } from "@webmcp-challenge/reentry-core/protocol";
import { createStandingContinuationReceipt } from "@webmcp-challenge/reentry-core/standing-protocol";
import {
  createCodexQueueAdapter,
  createCodexStandingQueueAdapter,
} from "../src/codex-queue-adapter.mjs";

const NOW = new Date("2026-08-31T12:00:00.000Z");

test("Codex adapter queues one fixed continuation message inside the Connector process", async () => {
  const calls = [];
  const adapter = createCodexQueueAdapter({
    threadId: "thread_preview_001",
    executable: "/private/codex",
    clock: () => NOW,
    spawnCommand(...input) {
      calls.push(input);
      const child = new EventEmitter();
      child.kill = () => false;
      queueMicrotask(() => child.emit("close", 0, null));
      return child;
    },
  });

  const result = await dispatchAgentActivation({
    adapter,
    lease: deliveryLease(),
    now: NOW,
    timeoutMs: 1_000,
  });

  assert.equal(result.outcome, "accepted");
  assert.equal(result.code, "activation_dispatch_accepted");
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0][0], "/private/codex");
  assert.deepEqual(calls[0][1].slice(0, 3), ["queue", "--thread", "thread_preview_001"]);
  assert.equal(calls[0][1][3], "--message");
  assert.match(calls[0][1][4], /^Re-entry continuation is ready\./);
  assert.match(calls[0][1][4], /https:\/\/host\.example\/workflows\/workflow_preview_001/);
  assert.equal(JSON.stringify(calls).includes("lease_token"), false);
  assert.deepEqual(calls[0][2], { stdio: ["ignore", "ignore", "ignore"] });
});

test("Codex process failure becomes an unknown activation and is not retried", async () => {
  let calls = 0;
  const adapter = createCodexQueueAdapter({
    threadId: "thread_preview_001",
    clock: () => NOW,
    spawnCommand() {
      calls += 1;
      const child = new EventEmitter();
      child.kill = () => false;
      queueMicrotask(() => child.emit("close", 1, null));
      return child;
    },
  });

  const result = await dispatchAgentActivation({
    adapter,
    lease: deliveryLease(),
    now: NOW,
    timeoutMs: 1_000,
  });

  assert.equal(result.outcome, "outcome_unknown");
  assert.equal(result.code, "adapter_invocation_failed");
  assert.equal(calls, 1);
});

test("v0.1 Codex queue adapter rejects v0.2 before binding or process effects", async () => {
  let calls = 0;
  const adapter = createCodexQueueAdapter({
    threadId: "thread_preview_001",
    clock: () => NOW,
    spawnCommand() {
      calls += 1;
      throw new Error("standing activation must not reach the process driver");
    },
  });

  const result = await dispatchAgentActivation({
    adapter,
    lease: standingDeliveryLease(),
    now: NOW,
    timeoutMs: 1_000,
  });

  assert.equal(result.outcome, "outcome_unknown");
  assert.equal(result.code, "adapter_invocation_failed");
  assert.equal(calls, 0);
});

test("Codex process timeout is killed and becomes an unknown activation", async () => {
  let killed = false;
  const adapter = createCodexQueueAdapter({
    threadId: "thread_preview_001",
    commandTimeoutMs: 100,
    clock: () => NOW,
    spawnCommand() {
      const child = new EventEmitter();
      child.kill = () => {
        killed = true;
        return true;
      };
      return child;
    },
  });

  const result = await dispatchAgentActivation({
    adapter,
    lease: deliveryLease(),
    now: NOW,
    timeoutMs: 1_000,
  });

  assert.equal(result.outcome, "outcome_unknown");
  assert.equal(result.code, "adapter_invocation_failed");
  assert.equal(killed, true);
});

test("standing Codex adapter stays unsupported until a runtime-owned attestation factory is supplied", async () => {
  let calls = 0;
  const adapter = createCodexStandingQueueAdapter({
    bindingStore: {
      resolve() {
        throw new Error("binding lookup must not run without runtime admission authority");
      },
    },
    clock: () => NOW,
    spawnCommand() {
      calls += 1;
      throw new Error("unsupported standing path must not queue");
    },
  });

  const result = await dispatchRuntimeAdmission({
    adapter,
    lease: standingDeliveryLease(),
    handoffId: "handoff_001",
    now: NOW,
    timeoutMs: 1_000,
  });

  assert.equal(result.outcome, "unsupported");
  assert.equal(result.code, "runtime_admission_unavailable");
  assert.equal(calls, 0);
  assert.equal("admitNotification" in adapter, false);
});

test("standing Codex adapter resolves the private Grant binding and queues notification-only context", async () => {
  const calls = [];
  const binding = standingBinding();
  let authorityInput;
  const adapter = createCodexStandingQueueAdapter({
    bindingStore: {
      resolve(input) {
        assert.deepEqual(input, {
          grantId: "grant_standing_preview_001",
          adapterId: "codex_queue_local",
        });
        return binding;
      },
    },
    executable: "/private/codex",
    clock: () => NOW,
    spawnCommand(...input) {
      calls.push(input);
      const child = new EventEmitter();
      child.kill = () => false;
      queueMicrotask(() => child.emit("close", 0, null));
      return child;
    },
    createAdmissionAttestation(input) {
      authorityInput = input;
      return {
        type: "webmcp.runtime_admission_attestation",
        protocol_version: "0.2",
        admission_id: "admission_001",
        adapter_id: binding.adapter_id,
        binding_generation: binding.binding_generation,
        delivery_id: input.activation.delivery_id,
        event_id: input.activation.event_id,
        handoff_id: input.handoffId,
        accepted_at: input.now.toISOString(),
      };
    },
  });

  const result = await dispatchRuntimeAdmission({
    adapter,
    lease: standingDeliveryLease(),
    handoffId: "handoff_001",
    now: NOW,
    timeoutMs: 1_000,
  });

  assert.equal(result.outcome, "admitted");
  assert.equal(result.code, "runtime_admission_accepted");
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0][0], "/private/codex");
  assert.deepEqual(calls[0][1].slice(0, 3), ["queue", "--thread", "task_standing_001"]);
  assert.equal(calls[0][1][3], "--message");
  assert.match(calls[0][1][4], /^An approved Re-entry business event is ready/);
  assert.match(calls[0][1][4], /Business event: workflow\.ready\.standing/);
  assert.match(calls[0][1][4], /Event sequence: 2/);
  assert.match(calls[0][1][4], /https:\/\/host\.example\/workflows\/workflow_standing_preview_001/);
  assert.equal(calls[0][1][4].includes("Review the current workflow"), false);
  assert.equal(JSON.stringify(calls).includes("lease_token"), false);
  assert.equal(authorityInput.binding.binding_ref, "task_standing_001");
  assert.equal(result.attestation.binding_generation, binding.binding_generation);
});

test("standing Codex adapter maps a missing or retired private binding to unsupported without queuing", async () => {
  let calls = 0;
  const adapter = createCodexStandingQueueAdapter({
    bindingStore: { resolve: async () => null },
    clock: () => NOW,
    spawnCommand() {
      calls += 1;
      throw new Error("missing binding must not reach Codex");
    },
    createAdmissionAttestation() {
      throw new Error("missing binding must stop before attestation");
    },
  });

  const result = await dispatchRuntimeAdmission({
    adapter,
    lease: standingDeliveryLease(),
    handoffId: "handoff_001",
    now: NOW,
    timeoutMs: 1_000,
  });

  assert.equal(result.outcome, "unsupported");
  assert.equal(result.code, "runtime_admission_unavailable");
  assert.equal(calls, 0);
});

test("standing Codex adapter keeps attestation-provider failure unknown after the queue boundary", async () => {
  let calls = 0;
  const adapter = createCodexStandingQueueAdapter({
    bindingStore: { resolve: async () => standingBinding() },
    clock: () => NOW,
    spawnCommand() {
      calls += 1;
      const child = new EventEmitter();
      child.kill = () => false;
      queueMicrotask(() => child.emit("close", 0, null));
      return child;
    },
    createAdmissionAttestation() {
      const error = new Error("runtime proof lookup failed");
      error.code = "runtime_admission_unavailable";
      throw error;
    },
  });

  const result = await dispatchRuntimeAdmission({
    adapter,
    lease: standingDeliveryLease(),
    handoffId: "handoff_001",
    now: NOW,
    timeoutMs: 1_000,
  });

  assert.equal(result.outcome, "outcome_unknown");
  assert.equal(result.code, "runtime_admission_invocation_failed");
  assert.equal(calls, 1);
});

test("standing Codex adapter rejects a mismatched private binding before invoking Codex", async () => {
  let calls = 0;
  const adapter = createCodexStandingQueueAdapter({
    bindingStore: {
      resolve: async () => ({
        ...standingBinding(),
        grant_id: "another_grant",
      }),
    },
    clock: () => NOW,
    spawnCommand() {
      calls += 1;
      throw new Error("mismatched binding must not reach Codex");
    },
    createAdmissionAttestation() {
      throw new Error("mismatched binding must stop before attestation");
    },
  });

  const result = await dispatchRuntimeAdmission({
    adapter,
    lease: standingDeliveryLease(),
    handoffId: "handoff_001",
    now: NOW,
    timeoutMs: 1_000,
  });

  assert.equal(result.outcome, "outcome_unknown");
  assert.equal(result.code, "runtime_admission_invocation_failed");
  assert.equal(calls, 0);
});

function deliveryLease() {
  const leaseExpiresAt = "2026-08-31T12:05:00.000Z";
  const receipt = createContinuationReceipt({
    type: "webmcp.continuation_receipt",
    protocol_version: "0.1",
    grant_id: "grant_preview_001",
    correlation_id: "correlation_preview_001",
    issuer_origin: "https://host.example",
    workflow_id: "workflow_preview_001",
    event_type: "workflow.ready",
    canonical_url: "https://host.example/workflows/workflow_preview_001",
    expires_at: leaseExpiresAt,
    human_boundary: "explicit_receiver_consent",
    continuation_mode: "open_canonical_page_read_current_state",
  });
  return {
    type: "webmcp.delivery_lease",
    protocol_version: "0.1",
    delivery_id: "delivery_preview_001",
    event_id: "event_preview_001",
    attempt: 1,
    lease_token: Buffer.alloc(32, 1).toString("base64url"),
    lease_expires_at: leaseExpiresAt,
    continuation: {
      correlation_id: "correlation_preview_001",
      workflow_id: "workflow_preview_001",
      event_type: "workflow.ready",
      event_sequence: 1,
      state_version: 2,
      occurred_at: "2026-08-31T12:00:00.000Z",
      canonical_url: "https://host.example/workflows/workflow_preview_001",
      instruction: "Review the approved workflow and prepare the next safe step.",
    },
    receipt,
  };
}

function standingDeliveryLease() {
  const leaseExpiresAt = "2026-08-31T12:05:00.000Z";
  const receipt = createStandingContinuationReceipt({
    type: "webmcp.continuation_receipt",
    protocol_version: "0.2",
    grant_id: "grant_standing_preview_001",
    correlation_id: "correlation_standing_preview_001",
    issuer_origin: "https://host.example",
    workflow_id: "workflow_standing_preview_001",
    event_type: "workflow.ready.standing",
    canonical_url: "https://host.example/workflows/workflow_standing_preview_001",
    expires_at: leaseExpiresAt,
    human_boundary: "explicit_receiver_consent",
    continuation_mode: "open_canonical_page_read_current_state",
    authorization_mode: "standing",
    max_active_activations: 1,
  });
  return {
    type: "webmcp.delivery_lease",
    protocol_version: "0.2",
    delivery_id: "delivery_standing_preview_001",
    event_id: "event_standing_preview_001",
    attempt: 1,
    lease_token: Buffer.alloc(32, 2).toString("base64url"),
    lease_expires_at: leaseExpiresAt,
    continuation: {
      correlation_id: "correlation_standing_preview_001",
      workflow_id: "workflow_standing_preview_001",
      event_type: "workflow.ready.standing",
      event_sequence: 2,
      state_version: 2,
      occurred_at: "2026-08-31T12:00:00.000Z",
      canonical_url: "https://host.example/workflows/workflow_standing_preview_001",
      instruction: "Review the current workflow and prepare the next safe step.",
    },
    receipt,
  };
}

function standingBinding() {
  return {
    type: "webmcp.local_task_binding",
    protocol_version: "0.2",
    grant_id: "grant_standing_preview_001",
    adapter_id: "codex_queue_local",
    binding_ref: "task_standing_001",
    binding_generation: "a".repeat(64),
    bound_at: NOW.toISOString(),
    status: "active",
  };
}
