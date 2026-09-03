import assert from "node:assert/strict";
import test from "node:test";

import { runStandingAuthorizationV02Scenario } from "../conformance/standing-v0.2/scenario.mjs";
import { REENTRY_HEADER_NAMES } from "../src/protocol.mjs";

const BOUNDARY = "scenario_contract_boundary_reached";
const CLAIM_TOKENS = ["claim_contract_1", "claim_contract_2", "claim_contract_3"];

// These are oracle self-tests, not a Receiver implementation or conformance result. A deliberately
// small scripted driver stops immediately after the response under test. The boundary assertion
// proves that a valid response reaches the next step; malformed responses must fail before it.
for (const boundary of ["approval", "out-of-order", "acceptance", "acknowledgement"]) {
  test(`scenario accepts the exact ${boundary} response before advancing`, async () => {
    await assert.rejects(run(boundary), { code: BOUNDARY });
  });
}

const mutations = [
  ["approval", "nested private receipt", value => ({
    ...value, binding: { ...value.binding, receipt: { grant_id: "private_grant" } },
  }), "profile_binding_fields"],
  ["approval", "missing binding status", value => ({
    ...value, binding: without(value.binding, "status"),
  }), "profile_binding_fields"],
  ["approval", "wrong binding correlation", value => ({
    ...value, binding: { ...value.binding, correlation_id: "another_correlation" },
  }), "profile_binding_correlation"],
  ["approval", "wrong binding type", value => ({
    ...value, binding: { ...value.binding, type: "webmcp.continuation_receipt" },
  }), "profile_binding_type"],
  ["approval", "non-active binding", value => ({
    ...value, binding: { ...value.binding, status: "revoked" },
  }), "profile_binding_not_active"],
  ["approval", "wrong challenge identity", value => ({
    ...value, challenge_id: "another_challenge",
  }), "profile_approval_challenge"],
  ["out-of-order", "missing retryable flag", value => ({
    ...value, error: without(value.error, "retryable"),
  }), "profile_out_of_order_error"],
  ["acceptance", "private grant ID", value => ({ ...value, grant_id: "private_grant" }),
    "profile_event_acceptance_fields"],
  ["acceptance", "missing status", value => without(value, "status"),
    "profile_event_acceptance_fields"],
  ["acceptance", "wrong correlation", value => ({ ...value, correlation_id: "another_correlation" }),
    "profile_event_acceptance_correlation"],
  ["acceptance", "wrong type", value => ({ ...value, type: "webmcp.continuation_receipt" }),
    "profile_event_acceptance_type"],
  ["acceptance", "wrong status", value => ({ ...value, status: "rejected" }),
    "profile_event_acceptance_state"],
  ["acknowledgement", "private lease token", value => ({ ...value, lease_token: "private_lease" }),
    "profile_ack_1_fields"],
  ["acknowledgement", "missing event identity", value => without(value, "event_id"),
    "profile_ack_1_fields"],
  ["acknowledgement", "wrong delivery identity", value => ({ ...value, delivery_id: "another_delivery" }),
    "profile_ack_1_delivery"],
  ["acknowledgement", "wrong event identity", value => ({ ...value, event_id: "another_event" }),
    "profile_ack_1_event"],
  ["acknowledgement", "wrong type", value => ({ ...value, type: "webmcp.delivery_lease" }),
    "profile_ack_1_type"],
  ["acknowledgement", "wrong status", value => ({ ...value, status: "pending" }),
    "profile_ack_1_status"],
  ["acknowledgement", "missing effect identity", value => ({ ...value, effect_id: "" }),
    "profile_ack_1_effect"],
];

for (const [boundary, label, mutate, code] of mutations) {
  test(`scenario rejects ${boundary} with ${label}`, async () => {
    await assert.rejects(run(boundary, mutate), { code });
  });
}

function run(boundary, mutate = value => value) {
  const manifest = {
    protocol_version: "0.2",
    correlation_id: "correlation_contract",
    workflow: { id: "workflow_contract" },
    grant_request: { event_type: "contract_ready" },
    signature: { key_id: "key_contract" },
  };
  const approval = {
    status: "approved", challenge_id: "challenge_contract", duplicate: false,
    binding: {
      type: "webmcp.reentry_binding", protocol_version: "0.2", binding_id: "binding_contract",
      correlation_id: manifest.correlation_id, workflow_id: manifest.workflow.id,
      event_type: manifest.grant_request.event_type, expires_at: "2026-09-04T00:00:00.000Z",
      authorization_mode: "standing", max_active_activations: 1, last_event_sequence: 0,
      status: "active",
    },
  };
  let normalSends = 0;
  let outOfOrderRejected = false;
  const driver = {
    async issueManifest() { return manifest; },
    async enroll() { return { duplicate: false, challenge: { status: "pending", challenge_id: approval.challenge_id } }; },
    async approve() { return boundary === "approval" ? mutate(approval) : approval; },
    async issueEvent({ ordinal, signer = "consented" }) {
      if (boundary === "approval") stop();
      const event = {
        protocol_version: "0.2", event_id: `event_contract_${ordinal}`,
        correlation_id: manifest.correlation_id, event_sequence: ordinal,
      };
      return { event, body: JSON.stringify({ event, signer }), headers: { [REENTRY_HEADER_NAMES.keyId]: "key_contract" } };
    },
    async setConsentedKeyMaterialForTest() {},
    async sendEvent({ envelope }) {
      const { event, signer } = JSON.parse(envelope.body);
      if (signer !== "consented") {
        return { statusCode: 401, body: { error: {
          code: signer === "alternate-trusted" ? "event_key_scope_invalid" : "event_key_material_scope_invalid",
          retryable: false,
        } } };
      }
      if (event.event_sequence === 2 && !outOfOrderRejected) {
        outOfOrderRejected = true;
        const response = {
          statusCode: 409,
          body: { error: { code: "event_sequence_out_of_order", retryable: false } },
        };
        return boundary === "out-of-order" ? { ...response, body: mutate(response.body) } : response;
      }
      normalSends += 1;
      if (normalSends > (boundary === "acceptance" ? 2 : 3)) stop();
      if (normalSends === 3) {
        return { statusCode: 409, body: { error: { code: "activation_in_progress", retryable: true } } };
      }
      const body = {
        type: "webmcp.continuation_acceptance", protocol_version: "0.2",
        event_id: event.event_id, correlation_id: event.correlation_id,
        accepted: true, duplicate: normalSends === 2, status: "accepted",
      };
      return { statusCode: 202, body: boundary === "acceptance" ? mutate(body) : body };
    },
    async inspect() {
      if (boundary === "out-of-order" && outOfOrderRejected) stop();
      return { last_event_sequence: 0, active_activations: 0 };
    },
    async claim({ claimToken }) {
      return { duplicate: false, lease: {
        protocol_version: "0.2", delivery_id: "delivery_contract_1", event_id: "event_contract_1",
        lease_token: claimToken,
        continuation: { correlation_id: manifest.correlation_id, event_sequence: 1 },
      } };
    },
    async dispatch() { return { protocol_version: "0.2", outcome: "accepted" }; },
    async authorizeEffect() { return "effect_token_contract"; },
    async acknowledge() {
      return mutate({
        type: "webmcp.delivery_acknowledgement", protocol_version: "0.2",
        delivery_id: "delivery_contract_1", event_id: "event_contract_1", effect_id: "effect_contract_1",
        acknowledged: true, duplicate: false, status: "acknowledged",
      });
    },
    async restart() { stop(); },
    async revoke() { stop(); },
  };
  return runStandingAuthorizationV02Scenario({ driver, claimTokens: CLAIM_TOKENS });
}

function without(value, key) {
  return Object.fromEntries(Object.entries(value).filter(([field]) => field !== key));
}

function stop() {
  throw Object.assign(new Error(BOUNDARY), { code: BOUNDARY });
}
