import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";

import {
  dispatchAgentActivation,
} from "@webmcp-challenge/reentry-core/agent-adapter";
import { createContinuationReceipt } from "@webmcp-challenge/reentry-core/protocol";
import {
  createCodexExecAdapter,
} from "../src/codex-exec-adapter.mjs";

const NOW = new Date("2026-08-31T12:00:00.000Z");

test("Codex adapter starts one fresh session with a bounded continuation prompt", async () => {
  const calls = [];
  const adapter = createCodexExecAdapter({
    workingDirectory: process.cwd(),
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
  assert.deepEqual(calls[0][1].slice(0, 3), ["exec", "--cd", process.cwd()]);
  assert.match(calls[0][1][3], /^You are a Re-entry continuation agent\./);
  assert.match(calls[0][1][3], /This is a new session/);
  assert.match(calls[0][1][3], /https:\/\/host\.example\/workflows\/workflow_preview_001/);
  assert.match(calls[0][1][3], /Do not submit or perform the final consequential action/);
  assert.equal(JSON.stringify(calls).includes("lease_token"), false);
  assert.deepEqual(calls[0][2], { stdio: ["ignore", "ignore", "ignore"] });
});

test("Codex process failure becomes an unknown activation and is not retried", async () => {
  let calls = 0;
  const adapter = createCodexExecAdapter({
    workingDirectory: process.cwd(),
    executable: "/private/codex",
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

test("Codex process timeout is killed and becomes an unknown activation", async () => {
  let killed = false;
  const adapter = createCodexExecAdapter({
    workingDirectory: process.cwd(),
    executable: "/private/codex",
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
    },
    receipt,
  };
}
