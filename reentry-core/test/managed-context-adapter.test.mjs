import assert from "node:assert/strict";
import test from "node:test";

import {
  AGENT_ACTIVATION_RESULT_TYPE,
  createAgentActivation,
  dispatchAgentActivation,
} from "../src/agent-adapter.mjs";
import {
  MANAGED_CONTEXT_BINDING_TYPE,
  createManagedContextAdapter,
} from "../src/managed-context-adapter.mjs";

const NOW = new Date("2026-08-31T12:00:00.000Z");
const ADAPTER_ID = "adapter_local_001";
const BINDING_REF = "private_context_ref_001";
const CLAIM_TOKEN = Buffer.alloc(32, 17).toString("base64url");

test("factory options and direct activation remain exact before private lookup", async () => {
  const options = {
    adapterId: ADAPTER_ID,
    bindingAuthority: { resolveBinding: () => bindingValue() },
    activateBoundContext: ({ activation }) => acceptedResult(activation),
    clock: () => NOW,
  };
  assert.throws(
    () => createManagedContextAdapter({ ...options, fallbackAdapter: {} }),
    { code: "managed_context_binding_contract_invalid" },
  );

  let authorityCalls = 0;
  const adapter = createManagedContextAdapter({
    ...options,
    bindingAuthority: {
      resolveBinding() {
        authorityCalls += 1;
        return bindingValue();
      },
    },
  });
  const activation = createAgentActivation({ lease: deliveryLease(), now: NOW });
  await assert.rejects(
    adapter.activate({ ...activation, binding_ref: BINDING_REF }),
    { code: "agent_adapter_contract_invalid" },
  );
  assert.equal(authorityCalls, 0);
});

test("v0.1 managed context rejects a standing activation before lookup or driver effects", async () => {
  let authorityCalls = 0;
  let driverCalls = 0;
  const adapter = createManagedContextAdapter({
    adapterId: ADAPTER_ID,
    bindingAuthority: {
      resolveBinding() {
        authorityCalls += 1;
        return bindingValue();
      },
    },
    activateBoundContext() {
      driverCalls += 1;
    },
    clock: () => NOW,
  });
  const activation = createAgentActivation({ lease: standingDeliveryLease(), now: NOW });

  await assert.rejects(
    adapter.activate(activation),
    { code: "managed_context_activation_version_invalid" },
  );
  assert.equal(authorityCalls, 0);
  assert.equal(driverCalls, 0);
});

test("active private binding resolves only by Grant and reaches one driver without disclosure", async () => {
  const authorityInputs = [];
  const driverInputs = [];
  const adapter = createManagedContextAdapter({
    adapterId: ADAPTER_ID,
    bindingAuthority: {
      resolveBinding(input) {
        authorityInputs.push(input);
        return bindingValue();
      },
    },
    activateBoundContext(input) {
      driverInputs.push(input);
      assert.equal(Object.isFrozen(input), true);
      assert.equal(Object.isFrozen(input.activation), true);
      return acceptedResult(input.activation);
    },
    clock: () => NOW,
  });

  const result = await dispatchAgentActivation({
    adapter,
    lease: deliveryLease(),
    now: NOW,
    timeoutMs: 1_000,
  });

  assert.equal(authorityInputs.length, 1);
  assert.deepEqual(authorityInputs[0], {
    grantId: "grant_private_001",
    adapterId: ADAPTER_ID,
  });
  assert.equal(Object.isFrozen(authorityInputs[0]), true);
  assert.equal(driverInputs.length, 1);
  assert.deepEqual(Object.keys(driverInputs[0]).sort(), ["activation", "bindingRef"]);
  assert.equal(driverInputs[0].bindingRef, BINDING_REF);
  assert.deepEqual(result, acceptedResult(driverInputs[0].activation));
  assert.equal(JSON.stringify(authorityInputs).includes(BINDING_REF), false);
  assert.equal(JSON.stringify(driverInputs[0].activation).includes(BINDING_REF), false);
  assert.equal(JSON.stringify(result).includes(BINDING_REF), false);
});

test("missing private binding returns exact unsupported capability without a driver or fallback", async () => {
  let authorityCalls = 0;
  let driverCalls = 0;
  const result = await dispatchAgentActivation({
    adapter: createManagedContextAdapter({
      adapterId: ADAPTER_ID,
      bindingAuthority: {
        resolveBinding() {
          authorityCalls += 1;
          return null;
        },
      },
      activateBoundContext() {
        driverCalls += 1;
      },
      clock: () => NOW,
    }),
    lease: deliveryLease(),
    now: NOW,
    timeoutMs: 1_000,
  });

  assert.equal(authorityCalls, 1);
  assert.equal(driverCalls, 0);
  assert.deepEqual(result, {
    type: AGENT_ACTIVATION_RESULT_TYPE,
    protocol_version: "0.1",
    delivery_id: "delivery_001",
    event_id: "event_001",
    attempt: 1,
    outcome: "unsupported",
    code: "required_capability_unavailable",
    unavailable_capability: "managed_context_resume",
  });
});

test("expired binding rejects without invoking the selected driver", async () => {
  let driverCalls = 0;
  const result = await dispatchAgentActivation({
    adapter: createManagedContextAdapter({
      adapterId: ADAPTER_ID,
      bindingAuthority: {
        resolveBinding() {
          return bindingValue({ expires_at: NOW.toISOString() });
        },
      },
      activateBoundContext() {
        driverCalls += 1;
      },
      clock: () => NOW,
    }),
    lease: deliveryLease(),
    now: NOW,
    timeoutMs: 1_000,
  });

  assert.equal(driverCalls, 0);
  assert.equal(result.outcome, "rejected");
  assert.equal(result.code, "activation_rejected");
  assert.equal(result.unavailable_capability, null);
});

test("mismatched, malformed, accessor, and failed authorities stay unknown without driver calls", async () => {
  let accessorReads = 0;
  const accessorBinding = bindingValue();
  Object.defineProperty(accessorBinding, "binding_ref", {
    enumerable: true,
    get() {
      accessorReads += 1;
      return BINDING_REF;
    },
  });
  const cases = [
    bindingValue({ grant_id: "grant_other" }),
    bindingValue({ adapter_id: "adapter_other" }),
    { ...bindingValue(), extra: true },
    accessorBinding,
    new Error("private authority failure"),
  ];

  for (const value of cases) {
    let authorityCalls = 0;
    let driverCalls = 0;
    const result = await dispatchAgentActivation({
      adapter: createManagedContextAdapter({
        adapterId: ADAPTER_ID,
        bindingAuthority: {
          resolveBinding() {
            authorityCalls += 1;
            if (value instanceof Error) throw value;
            return value;
          },
        },
        activateBoundContext() {
          driverCalls += 1;
        },
        clock: () => NOW,
      }),
      lease: deliveryLease(),
      now: NOW,
      timeoutMs: 1_000,
    });
    assert.equal(authorityCalls, 1);
    assert.equal(driverCalls, 0);
    assert.equal(result.outcome, "outcome_unknown");
    assert.equal(result.code, "adapter_invocation_failed");
    assert.equal(JSON.stringify(result).includes("private authority failure"), false);
  }
  assert.equal(accessorReads, 0);
});

test("binding lifetime must cover the lease and caller input cannot select a context", async () => {
  let authorityCalls = 0;
  let driverCalls = 0;
  const adapter = createManagedContextAdapter({
    adapterId: ADAPTER_ID,
    bindingAuthority: {
      resolveBinding() {
        authorityCalls += 1;
        return bindingValue({ expires_at: "2026-08-31T12:00:30.000Z" });
      },
    },
    activateBoundContext() {
      driverCalls += 1;
    },
    clock: () => NOW,
  });

  const shortBinding = await dispatchAgentActivation({
    adapter,
    lease: deliveryLease(),
    now: NOW,
    timeoutMs: 1_000,
  });
  assert.equal(shortBinding.outcome, "outcome_unknown");
  assert.equal(shortBinding.code, "adapter_invocation_failed");
  assert.equal(authorityCalls, 1);
  assert.equal(driverCalls, 0);

  await assert.rejects(
    dispatchAgentActivation({
      adapter,
      lease: { ...deliveryLease(), binding_ref: BINDING_REF },
      now: NOW,
      timeoutMs: 1_000,
    }),
    { code: "agent_adapter_contract_invalid" },
  );
  assert.equal(authorityCalls, 1);
  assert.equal(driverCalls, 0);
});

test("resolution crossing the lease boundary is rechecked before any driver call", async () => {
  let currentTime = NOW;
  let releaseLookup;
  let driverCalls = 0;
  const adapter = createManagedContextAdapter({
    adapterId: ADAPTER_ID,
    bindingAuthority: {
      resolveBinding() {
        return new Promise((resolve) => {
          releaseLookup = resolve;
        });
      },
    },
    activateBoundContext() {
      driverCalls += 1;
    },
    clock: () => currentTime,
  });
  const pending = adapter.activate(createAgentActivation({ lease: deliveryLease(), now: NOW }));
  currentTime = new Date("2026-08-31T12:01:00.000Z");
  releaseLookup(bindingValue());

  await assert.rejects(pending, { code: "managed_context_activation_expired" });
  assert.equal(driverCalls, 0);
});

test("binding resolution is covered by the existing one-call timeout and invalid driver output leaks nothing", async () => {
  let authorityCalls = 0;
  const timedOut = await dispatchAgentActivation({
    adapter: createManagedContextAdapter({
      adapterId: ADAPTER_ID,
      bindingAuthority: {
        resolveBinding() {
          authorityCalls += 1;
          return new Promise(() => {});
        },
      },
      activateBoundContext() {
        throw new Error("driver must not run");
      },
      clock: () => NOW,
    }),
    lease: deliveryLease(),
    now: NOW,
    timeoutMs: 100,
  });
  assert.equal(authorityCalls, 1);
  assert.equal(timedOut.outcome, "outcome_unknown");
  assert.equal(timedOut.code, "adapter_invocation_timed_out");

  let driverCalls = 0;
  const invalid = await dispatchAgentActivation({
    adapter: createManagedContextAdapter({
      adapterId: ADAPTER_ID,
      bindingAuthority: { resolveBinding: () => bindingValue() },
      activateBoundContext(activation) {
        driverCalls += 1;
        return { ...acceptedResult(activation.activation), binding_ref: BINDING_REF };
      },
      clock: () => NOW,
    }),
    lease: deliveryLease(),
    now: NOW,
    timeoutMs: 1_000,
  });
  assert.equal(driverCalls, 1);
  assert.equal(invalid.outcome, "outcome_unknown");
  assert.equal(invalid.code, "adapter_result_invalid");
  assert.equal(JSON.stringify(invalid).includes(BINDING_REF), false);
});

function deliveryLease() {
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
      instruction: "Review the approved workflow and prepare the next safe step.",
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
    },
  };
}

function standingDeliveryLease() {
  return {
    ...deliveryLease(),
    protocol_version: "0.2",
    delivery_id: "delivery_standing_001",
    event_id: "event_standing_001",
    continuation: {
      ...deliveryLease().continuation,
      correlation_id: "correlation_standing_001",
      workflow_id: "workflow_standing_001",
      event_type: "workflow.ready.standing",
      event_sequence: 2,
      canonical_url: "https://host.example/workflows/workflow_standing_001",
    },
    receipt: {
      ...deliveryLease().receipt,
      protocol_version: "0.2",
      grant_id: "grant_standing_001",
      correlation_id: "correlation_standing_001",
      workflow_id: "workflow_standing_001",
      event_type: "workflow.ready.standing",
      canonical_url: "https://host.example/workflows/workflow_standing_001",
      authorization_mode: "standing",
      max_active_activations: 1,
    },
  };
}

function bindingValue(overrides = {}) {
  return {
    type: MANAGED_CONTEXT_BINDING_TYPE,
    protocol_version: "0.1",
    grant_id: "grant_private_001",
    adapter_id: ADAPTER_ID,
    binding_ref: BINDING_REF,
    bound_at: "2026-08-31T11:00:00.000Z",
    expires_at: "2026-08-31T13:00:00.000Z",
    ...overrides,
  };
}

function acceptedResult(activation) {
  return {
    type: AGENT_ACTIVATION_RESULT_TYPE,
    protocol_version: "0.1",
    delivery_id: activation.delivery_id,
    event_id: activation.event_id,
    attempt: activation.attempt,
    outcome: "accepted",
    code: "activation_dispatch_accepted",
    unavailable_capability: null,
  };
}
