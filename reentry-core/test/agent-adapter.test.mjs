import test from "node:test";
import assert from "node:assert/strict";

import {
  AGENT_ACTIVATION_RESULT_TYPE,
  AGENT_ACTIVATION_TYPE,
  AGENT_ADAPTER_CAPABILITIES,
  AgentAdapterContractError,
  createAgentActivation,
  dispatchAgentActivation,
  validateAgentActivationResult,
} from "../src/agent-adapter.mjs";

const NOW = new Date("2026-08-31T12:00:00.000Z");
const CLAIM_TOKEN = Buffer.alloc(32, 7).toString("base64url");

test("Agent boundary derives one immutable credential-free activation", async () => {
  const calls = [];
  const adapter = {
    activate(activation) {
      calls.push(activation);
      assert.equal(Object.isFrozen(activation), true);
      assert.equal(Object.isFrozen(activation.receipt), true);
      assert.equal(Object.isFrozen(activation.continuation), true);
      assert.throws(() => {
        activation.attempt = 2;
      }, TypeError);
      return activationResult(activation);
    },
  };

  const result = await dispatchAgentActivation({
    adapter,
    lease: deliveryLease(),
    now: NOW,
    timeoutMs: 1_000,
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(Object.keys(calls[0]), [
    "type",
    "protocol_version",
    "delivery_id",
    "event_id",
    "attempt",
    "lease_expires_at",
    "continuation",
    "receipt",
  ]);
  assert.equal(calls[0].type, AGENT_ACTIVATION_TYPE);
  assert.equal(JSON.stringify(calls[0]).includes(CLAIM_TOKEN), false);
  assert.equal("lease_token" in calls[0], false);
  assert.equal("connector_token" in calls[0], false);
  assert.equal("effect_token" in calls[0], false);
  assert.equal("managed_context_id" in calls[0], false);
  assert.equal("prompt" in calls[0], false);
  assert.deepEqual(result, activationResult(calls[0]));
  assert.equal(Object.isFrozen(result), true);
});

test("Agent boundary rejects stale, mismatched, extended, and accessor input before dispatch", async () => {
  const invalid = [
    {
      name: "expired lease",
      value: deliveryLease({ lease: { lease_expires_at: NOW.toISOString() } }),
      code: "agent_activation_expired",
    },
    {
      name: "expired receipt",
      value: deliveryLease({ receipt: { expires_at: NOW.toISOString() } }),
      code: "agent_activation_expired",
    },
    {
      name: "mismatched event type",
      value: deliveryLease({ continuation: { event_type: "workflow.other" } }),
      code: "agent_activation_scope_invalid",
    },
    {
      name: "extended lease",
      value: { ...deliveryLease(), prompt: "continue" },
      code: "agent_adapter_contract_invalid",
    },
    {
      name: "invalid lease token",
      value: deliveryLease({ lease: { lease_token: "not-a-token" } }),
      code: "agent_activation_lease_invalid",
    },
  ];

  for (const fixture of invalid) {
    assert.throws(
      () => createAgentActivation({ lease: fixture.value, now: NOW }),
      (error) => {
        assert.equal(error instanceof AgentAdapterContractError, true, fixture.name);
        assert.equal(error.code, fixture.code, fixture.name);
        return true;
      },
    );
  }

  let getterCalls = 0;
  const accessorLease = deliveryLease();
  Object.defineProperty(accessorLease, "attempt", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return 1;
    },
  });
  assert.throws(
    () => createAgentActivation({ lease: accessorLease, now: NOW }),
    { code: "agent_adapter_contract_invalid" },
  );
  assert.equal(getterCalls, 0);

  let adapterGetterCalls = 0;
  const untouchedAdapter = {};
  Object.defineProperty(untouchedAdapter, "activate", {
    get() {
      adapterGetterCalls += 1;
      return () => {};
    },
  });
  await assert.rejects(
    dispatchAgentActivation({
      adapter: untouchedAdapter,
      lease: deliveryLease({ lease: { lease_expires_at: NOW.toISOString() } }),
      now: NOW,
      timeoutMs: 1_000,
    }),
    { code: "agent_activation_expired" },
  );
  assert.equal(adapterGetterCalls, 0);
});

test("Deterministic adapters can return every bounded outcome and unsupported capability", async () => {
  const cases = [
    { outcome: "accepted", code: "activation_dispatch_accepted", capability: null },
    { outcome: "rejected", code: "activation_rejected", capability: null },
    { outcome: "outcome_unknown", code: "activation_outcome_unknown", capability: null },
    ...AGENT_ADAPTER_CAPABILITIES.map((capability) => ({
      outcome: "unsupported",
      code: "required_capability_unavailable",
      capability,
    })),
  ];

  for (const fixture of cases) {
    let calls = 0;
    const result = await dispatchAgentActivation({
      adapter: {
        activate(activation) {
          calls += 1;
          return activationResult(activation, fixture);
        },
      },
      lease: deliveryLease(),
      now: NOW,
      timeoutMs: 1_000,
    });
    assert.equal(calls, 1);
    assert.equal(result.outcome, fixture.outcome);
    assert.equal(result.code, fixture.code);
    assert.equal(result.unavailable_capability, fixture.capability);
  }
});

test("Adapter exceptions and invalid results become unknown without retry or effect authority", async () => {
  let exceptionCalls = 0;
  const failed = await dispatchAgentActivation({
    adapter: {
      activate() {
        exceptionCalls += 1;
        throw new Error("private adapter failure");
      },
    },
    lease: deliveryLease(),
    now: NOW,
    timeoutMs: 1_000,
  });
  assert.equal(exceptionCalls, 1);
  assert.equal(failed.outcome, "outcome_unknown");
  assert.equal(failed.code, "adapter_invocation_failed");
  assert.equal(JSON.stringify(failed).includes("private adapter failure"), false);

  let invalidCalls = 0;
  const invalid = await dispatchAgentActivation({
    adapter: {
      activate(activation) {
        invalidCalls += 1;
        return { ...activationResult(activation), effect_token: "forged" };
      },
    },
    lease: deliveryLease(),
    now: NOW,
    timeoutMs: 1_000,
  });
  assert.equal(invalidCalls, 1);
  assert.equal(invalid.outcome, "outcome_unknown");
  assert.equal(invalid.code, "adapter_result_invalid");
  assert.equal("effect_token" in invalid, false);
});

test("Adapter timeout is bounded by the remaining lease and does not retry", async () => {
  let calls = 0;
  const result = await dispatchAgentActivation({
    adapter: {
      activate() {
        calls += 1;
        return new Promise(() => {});
      },
    },
    lease: deliveryLease({
      lease: { lease_expires_at: "2026-08-31T12:00:00.010Z" },
    }),
    now: NOW,
    timeoutMs: 100,
  });
  assert.equal(calls, 1);
  assert.equal(result.outcome, "outcome_unknown");
  assert.equal(result.code, "adapter_invocation_timed_out");

  await assert.rejects(
    dispatchAgentActivation({
      adapter: { activate() { calls += 1; } },
      lease: deliveryLease(),
      now: NOW,
      timeoutMs: 99,
    }),
    { code: "agent_adapter_timeout_invalid" },
  );
  assert.equal(calls, 1);
});

test("Standalone result validation rejects mismatched correlation and capability combinations", () => {
  const activation = createAgentActivation({ lease: deliveryLease(), now: NOW });
  assert.throws(
    () => validateAgentActivationResult({
      activation,
      result: activationResult(activation, { delivery_id: "delivery_other" }),
    }),
    { code: "agent_adapter_result_invalid" },
  );
  assert.throws(
    () => validateAgentActivationResult({
      activation,
      result: activationResult(activation, {
        outcome: "unsupported",
        code: "required_capability_unavailable",
        capability: "arbitrary_capability",
      }),
    }),
    { code: "agent_adapter_result_invalid" },
  );
  assert.throws(
    () => validateAgentActivationResult({
      activation: {
        ...activation,
        lease_expires_at: "2026-08-31T14:00:00.000Z",
      },
      result: activationResult(activation),
    }),
    { code: "agent_activation_scope_invalid" },
  );
});

function deliveryLease({ lease = {}, continuation = {}, receipt = {} } = {}) {
  return {
    type: "webmcp.delivery_lease",
    protocol_version: "0.1",
    delivery_id: "delivery_001",
    event_id: "event_001",
    attempt: 1,
    lease_token: CLAIM_TOKEN,
    lease_expires_at: "2026-08-31T12:01:00.000Z",
    continuation: {
      correlation_id: "correlation_001",
      workflow_id: "workflow_001",
      event_type: "workflow.ready",
      event_sequence: 1,
      state_version: 4,
      occurred_at: "2026-08-31T11:59:00.000Z",
      canonical_url: "https://host.example/workflows/workflow_001",
      ...continuation,
    },
    receipt: {
      type: "webmcp.continuation_receipt",
      protocol_version: "0.1",
      grant_id: "grant_private_001",
      correlation_id: "correlation_001",
      issuer_origin: "https://host.example",
      workflow_id: "workflow_001",
      event_type: "workflow.ready",
      canonical_url: "https://host.example/workflows/workflow_001",
      expires_at: "2026-08-31T13:00:00.000Z",
      human_boundary: "explicit_human_commit",
      continuation_mode: "open_canonical_page_read_current_state",
      ...receipt,
    },
    ...lease,
  };
}

function activationResult(activation, overrides = {}) {
  const capability = Object.hasOwn(overrides, "capability")
    ? overrides.capability
    : null;
  return {
    type: AGENT_ACTIVATION_RESULT_TYPE,
    protocol_version: "0.1",
    delivery_id: activation.delivery_id,
    event_id: activation.event_id,
    attempt: activation.attempt,
    outcome: "accepted",
    code: "activation_dispatch_accepted",
    unavailable_capability: capability,
    ...withoutCapability(overrides),
  };
}

function withoutCapability(value) {
  const { capability: _capability, ...rest } = value;
  return rest;
}
