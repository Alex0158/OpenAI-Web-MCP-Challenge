import { STANDING_PROTOCOL_VERSION } from "../../src/standing-protocol.mjs";
import { REENTRY_HEADER_NAMES } from "../../src/protocol.mjs";

const PROFILE = "standing-authorization-v0.2";
const REQUIRED_DRIVER_METHODS = Object.freeze([
  "issueManifest",
  "enroll",
  "approve",
  "issueEvent",
  "setConsentedKeyMaterialForTest",
  "sendEvent",
  "claim",
  "dispatch",
  "authorizeEffect",
  "acknowledge",
  "restart",
  "inspect",
  "revoke",
]);

/**
 * Runs the minimum cross-implementation standing-authorization trace.
 *
 * The driver owns implementation-specific setup, authentication, and route invocation. This
 * scenario owns the expected state transitions; an implementation must not generate its oracle.
 * The key-material override is a test-fixture authority mutation, never a Host-facing operation.
 */
export async function runStandingAuthorizationV02Scenario({ driver, claimTokens }) {
  requireDriver(driver);
  requireClaimTokens(claimTokens);

  const manifest = await driver.issueManifest();
  expect(manifest?.protocol_version === STANDING_PROTOCOL_VERSION, "profile_manifest_version");

  const enrollment = await driver.enroll({ manifest });
  expect(enrollment?.duplicate === false, "profile_enrollment_duplicate");
  expect(enrollment?.challenge?.status === "pending", "profile_challenge_not_pending");

  // This is the sole Consent decision in the scenario.
  const approval = await driver.approve({
    challengeId: enrollment.challenge.challenge_id,
  });
  expect(approval?.status === "approved", "profile_consent_not_approved");
  expect(approval?.duplicate === false, "profile_consent_duplicate");
  expect(approval?.binding?.protocol_version === STANDING_PROTOCOL_VERSION, "profile_binding_version");
  expect(approval?.binding?.authorization_mode === "standing", "profile_binding_not_standing");
  expect(approval?.binding?.last_event_sequence === 0, "profile_binding_sequence_not_zero");
  expect(approval?.binding?.max_active_activations === 1, "profile_binding_parallelism_invalid");
  expectExactFields(
    approval,
    ["status", "challenge_id", "duplicate", "binding"],
    "profile_approval_private_state_leak",
  );
  expect(approval.challenge_id === enrollment.challenge.challenge_id, "profile_approval_challenge");
  expectExactFields(
    approval.binding,
    [
      "type", "protocol_version", "binding_id", "correlation_id", "workflow_id", "event_type",
      "expires_at", "authorization_mode", "max_active_activations", "last_event_sequence", "status",
    ],
    "profile_binding_fields",
  );
  expect(approval.binding.type === "webmcp.reentry_binding", "profile_binding_type");
  expect(approval.binding.correlation_id === manifest.correlation_id, "profile_binding_correlation");
  expect(approval.binding.status === "active", "profile_binding_not_active");

  // The alternate signer is trusted for the same origin but was not the key consented for this
  // Grant. Accepting it would silently widen durable standing authority.
  const wrongKey = await driver.issueEvent({
    binding: approval.binding,
    ordinal: 1,
    signer: "alternate-trusted",
  });
  const wrongKeyResponse = await driver.sendEvent({ envelope: envelopeOf(wrongKey) });
  expect(wrongKeyResponse?.statusCode === 401, "profile_wrong_key_status");
  expectExactFields(wrongKeyResponse?.body, ["error"], "profile_wrong_key_body");
  expectExactFields(
    wrongKeyResponse.body.error,
    ["code", "retryable"],
    "profile_wrong_key_error",
  );
  expect(
    wrongKeyResponse.body.error.code === "event_key_scope_invalid",
    "profile_wrong_key_code",
  );
  expect(wrongKeyResponse.body.error.retryable === false, "profile_wrong_key_retryable");

  // Rebinding the same trusted key ID must not transfer an existing Grant to different key
  // material. Restore the fixture even when the negative vector fails.
  let wrongKeyMaterialResponse;
  try {
    await driver.setConsentedKeyMaterialForTest({ material: "replacement" });
    const wrongKeyMaterial = await driver.issueEvent({
      binding: approval.binding,
      ordinal: 1,
      signer: "same-id-replacement",
    });
    expectEvent(wrongKeyMaterial, 1);
    expect(
      wrongKeyMaterial.headers[REENTRY_HEADER_NAMES.keyId] === manifest.signature.key_id,
      "profile_rebound_key_id_changed",
    );
    wrongKeyMaterialResponse = await driver.sendEvent({ envelope: envelopeOf(wrongKeyMaterial) });
  } finally {
    await driver.setConsentedKeyMaterialForTest({ material: "consented" });
  }
  expect(wrongKeyMaterialResponse?.statusCode === 401, "profile_rebound_key_status");
  expectExactFields(wrongKeyMaterialResponse?.body, ["error"], "profile_rebound_key_body");
  expectExactFields(
    wrongKeyMaterialResponse.body.error,
    ["code", "retryable"],
    "profile_rebound_key_error",
  );
  expect(
    wrongKeyMaterialResponse.body.error.code === "event_key_material_scope_invalid",
    "profile_rebound_key_code",
  );
  expect(wrongKeyMaterialResponse.body.error.retryable === false, "profile_rebound_key_retryable");

  const afterRejectedKeys = await driver.inspect({ bindingId: approval.binding.binding_id });
  expect(afterRejectedKeys?.last_event_sequence === 0, "profile_rejected_key_consumed_sequence");
  expect(afterRejectedKeys?.active_activations === 0, "profile_rejected_key_created_delivery");

  const firstCandidates = await Promise.all([
    driver.issueEvent({ binding: approval.binding, ordinal: 1, discriminator: "left" }),
    driver.issueEvent({ binding: approval.binding, ordinal: 1, discriminator: "right" }),
  ]);
  const second = await driver.issueEvent({ binding: approval.binding, ordinal: 2 });
  const third = await driver.issueEvent({ binding: approval.binding, ordinal: 3 });
  firstCandidates.forEach(candidate => expectEvent(candidate, 1));
  expectEvent(second, 2);
  expectEvent(third, 3);

  // A future sequence cannot reserve work before its predecessor. The Receiver must reject it
  // without advancing the Grant or creating an open Delivery; the same signed envelope must be
  // acceptable later when its sequence becomes current.
  const outOfOrder = await driver.sendEvent({ envelope: envelopeOf(second) });
  expectError(
    outOfOrder,
    409,
    "event_sequence_out_of_order",
    false,
    "profile_out_of_order",
  );
  const afterOutOfOrder = await driver.inspect({ bindingId: approval.binding.binding_id });
  expect(afterOutOfOrder?.last_event_sequence === 0, "profile_out_of_order_consumed_sequence");
  expect(afterOutOfOrder?.active_activations === 0, "profile_out_of_order_created_delivery");

  const distinctFirstResponses = await Promise.all([
    driver.sendEvent({ envelope: envelopeOf(firstCandidates[0]) }),
    driver.sendEvent({ envelope: envelopeOf(firstCandidates[1]) }),
  ]);
  const first = expectConcurrentSequenceConflict(distinctFirstResponses, firstCandidates);
  const losingFirst = firstCandidates.find(candidate => candidate.event.event_id !== first.event.event_id);
  const losingReplay = await driver.sendEvent({ envelope: envelopeOf(losingFirst) });
  expectError(
    losingReplay,
    409,
    "event_sequence_conflict",
    false,
    "profile_distinct_loser_replay",
  );
  const afterDistinct = await driver.inspect({ bindingId: approval.binding.binding_id });
  expect(afterDistinct?.last_event_sequence === 1, "profile_distinct_conflict_consumed_sequence");
  expect(afterDistinct?.active_activations === 1, "profile_distinct_conflict_created_multiple_deliveries");

  // Reusing an accepted Event ID with a different canonical body is an identity conflict, not a
  // replay. The Receiver must reject it without changing the reserved sequence or open Delivery.
  const conflictingFirst = await driver.issueEvent({
    binding: approval.binding,
    ordinal: 1,
    eventId: first.event.event_id,
    stateVersion: 99,
  });
  expectEvent(conflictingFirst, 1);
  const identityConflict = await driver.sendEvent({ envelope: envelopeOf(conflictingFirst) });
  expectError(
    identityConflict,
    409,
    "event_identity_conflict",
    false,
    "profile_identity_conflict",
  );
  const afterIdentityConflict = await driver.inspect({ bindingId: approval.binding.binding_id });
  expect(afterIdentityConflict?.last_event_sequence === 1, "profile_identity_conflict_consumed_sequence");
  expect(afterIdentityConflict?.active_activations === 1, "profile_identity_conflict_created_delivery");

  const blockedSecond = await driver.sendEvent({ envelope: envelopeOf(second) });
  expect(blockedSecond?.statusCode === 409, "profile_backpressure_status");
  expectExactFields(blockedSecond?.body, ["error"], "profile_backpressure_body");
  expectExactFields(
    blockedSecond.body.error,
    ["code", "retryable"],
    "profile_backpressure_error",
  );
  expect(blockedSecond.body.error.code === "activation_in_progress", "profile_backpressure_code");
  expect(blockedSecond.body.error.retryable === true, "profile_backpressure_not_retryable");

  const firstCycle = await completeDeliveryCycle(driver, claimTokens[0], first.event);

  const concurrentSecond = await Promise.all([
    driver.sendEvent({ envelope: envelopeOf(second) }),
    driver.sendEvent({ envelope: envelopeOf(second) }),
  ]);
  expectConcurrentAcceptance(concurrentSecond, second.event);
  const secondCycle = await completeDeliveryCycle(driver, claimTokens[1], second.event);

  await driver.restart();

  const inspection = await driver.inspect({ bindingId: approval.binding.binding_id });
  expect(inspection?.protocol_version === STANDING_PROTOCOL_VERSION, "profile_inspection_version");
  expect(inspection?.status === "active", "profile_grant_not_active_after_restart");
  expect(inspection?.last_event_sequence === 2, "profile_grant_sequence_not_two");
  expect(inspection?.active_activations === 0, "profile_activation_not_released");

  const restartReplay = await driver.sendEvent({ envelope: envelopeOf(first) });
  expectAcceptance(restartReplay, first.event, true);

  const revocation = await driver.revoke({ bindingId: approval.binding.binding_id });
  expect(revocation?.protocol_version === STANDING_PROTOCOL_VERSION, "profile_revocation_version");
  expect(revocation?.status === "revoked", "profile_revocation_failed");
  expect(revocation?.duplicate === false, "profile_revocation_duplicate");

  const rejectedThird = await driver.sendEvent({ envelope: envelopeOf(third) });
  expect(rejectedThird?.statusCode === 410, "profile_revoked_event_status");
  expectExactFields(rejectedThird?.body, ["error"], "profile_revoked_event_body");
  expectExactFields(
    rejectedThird.body.error,
    ["code", "retryable"],
    "profile_revoked_event_error",
  );
  expect(rejectedThird.body.error.code === "grant_revoked", "profile_revoked_event_code");
  expect(rejectedThird.body.error.retryable === false, "profile_revoked_event_retryable");

  const postRevocationClaim = await driver.claim({ claimToken: claimTokens[2] });
  expect(postRevocationClaim === null, "profile_work_available_after_revocation");

  const historicalReplay = await driver.sendEvent({ envelope: envelopeOf(first) });
  expectAcceptance(historicalReplay, first.event, true);

  return deepFreeze({
    profile: PROFILE,
    protocol_version: STANDING_PROTOCOL_VERSION,
    status: "passed",
    consent_decisions: 1,
    consented_host_key_enforced: true,
    consented_host_key_material_enforced: true,
    ordering: {
      out_of_order_rejected: true,
      retryable: outOfOrder.body.error.retryable,
      no_mutation: true,
    },
    concurrency: {
      distinct_sequence_conflict: true,
      conflict_responses: 1,
      duplicate_event_converged: true,
      accepted_responses: 1,
      duplicate_responses: 1,
    },
    identity_conflict: {
      rejected: true,
      no_mutation: true,
    },
    accepted_sequences: [1, 2],
    backpressure: {
      code: blockedSecond.body.error.code,
      retryable: blockedSecond.body.error.retryable,
    },
    deliveries: [firstCycle, secondCycle],
    restart: {
      last_event_sequence: inspection.last_event_sequence,
      active_activations: inspection.active_activations,
    },
    revocation: {
      status: revocation.status,
      third_event_rejected: true,
      historical_replay_preserved: true,
    },
  });
}

async function completeDeliveryCycle(driver, claimToken, event) {
  const sequence = event.event_sequence;
  const claim = await driver.claim({ claimToken });
  expect(claim?.duplicate === false, `profile_claim_${sequence}_duplicate`);
  expect(claim?.lease?.protocol_version === STANDING_PROTOCOL_VERSION, `profile_lease_${sequence}_version`);
  expect(claim?.lease?.continuation?.event_sequence === sequence, `profile_lease_${sequence}_sequence`);
  expect(claim?.lease?.event_id === event.event_id, `profile_lease_${sequence}_event`);
  expect(
    claim?.lease?.continuation?.correlation_id === event.correlation_id,
    `profile_lease_${sequence}_correlation`,
  );
  expect(claim?.lease?.lease_token === claimToken, `profile_lease_${sequence}_token`);

  const activation = await driver.dispatch({ lease: claim.lease });
  expect(
    activation?.protocol_version === STANDING_PROTOCOL_VERSION,
    `profile_activation_${sequence}_version`,
  );
  expect(activation?.outcome === "accepted", `profile_activation_${sequence}_not_accepted`);

  const effectToken = await driver.authorizeEffect({ lease: claim.lease, sequence });
  expect(typeof effectToken === "string" && effectToken.length > 0, `profile_effect_${sequence}_missing`);
  const acknowledgement = await driver.acknowledge({
    deliveryId: claim.lease.delivery_id,
    leaseToken: claim.lease.lease_token,
    effectToken,
  });
  expectExactFields(
    acknowledgement,
    ["type", "protocol_version", "delivery_id", "event_id", "effect_id", "acknowledged", "duplicate", "status"],
    `profile_ack_${sequence}_fields`,
  );
  expect(acknowledgement.type === "webmcp.delivery_acknowledgement", `profile_ack_${sequence}_type`);
  expect(acknowledgement?.protocol_version === STANDING_PROTOCOL_VERSION, `profile_ack_${sequence}_version`);
  expect(acknowledgement.delivery_id === claim.lease.delivery_id, `profile_ack_${sequence}_delivery`);
  expect(acknowledgement.event_id === event.event_id, `profile_ack_${sequence}_event`);
  expect(
    typeof acknowledgement.effect_id === "string" && acknowledgement.effect_id.length > 0,
    `profile_ack_${sequence}_effect`,
  );
  expect(acknowledgement?.acknowledged === true, `profile_ack_${sequence}_failed`);
  expect(acknowledgement?.duplicate === false, `profile_ack_${sequence}_duplicate`);
  expect(acknowledgement.status === "acknowledged", `profile_ack_${sequence}_status`);

  return {
    sequence,
    claimed: true,
    dispatched: true,
    acknowledged: true,
  };
}

function expectEvent(issued, sequence) {
  expect(issued?.event?.protocol_version === STANDING_PROTOCOL_VERSION, `profile_event_${sequence}_version`);
  expect(issued?.event?.event_sequence === sequence, `profile_event_${sequence}_sequence`);
  expect(typeof issued?.body === "string", `profile_event_${sequence}_body`);
  expect(issued?.headers && typeof issued.headers === "object", `profile_event_${sequence}_headers`);
}

function expectAcceptance(response, event, duplicate) {
  expect(response?.statusCode === 202, "profile_event_acceptance_status");
  expectExactFields(
    response?.body,
    ["type", "protocol_version", "event_id", "correlation_id", "accepted", "duplicate", "status"],
    "profile_event_acceptance_fields",
  );
  expect(response.body.type === "webmcp.continuation_acceptance", "profile_event_acceptance_type");
  expect(response?.body?.protocol_version === STANDING_PROTOCOL_VERSION, "profile_event_acceptance_version");
  expect(response?.body?.event_id === event.event_id, "profile_event_acceptance_identity");
  expect(response.body.correlation_id === event.correlation_id, "profile_event_acceptance_correlation");
  expect(response?.body?.accepted === true, "profile_event_not_accepted");
  expect(response?.body?.duplicate === duplicate, "profile_event_duplicate_state");
  expect(response.body.status === "accepted", "profile_event_acceptance_state");
}

function expectConcurrentAcceptance(responses, event) {
  expect(Array.isArray(responses) && responses.length === 2, "profile_concurrent_response_count");
  const duplicates = responses.filter((response) => response?.body?.duplicate === true);
  const fresh = responses.filter((response) => response?.body?.duplicate === false);
  expect(fresh.length === 1, "profile_concurrent_fresh_count");
  expect(duplicates.length === 1, "profile_concurrent_duplicate_count");
  expectAcceptance(fresh[0], event, false);
  expectAcceptance(duplicates[0], event, true);
}

function expectConcurrentSequenceConflict(responses, candidates) {
  expect(Array.isArray(responses) && responses.length === 2, "profile_distinct_response_count");
  const accepted = responses.filter(response => response?.statusCode === 202);
  const conflicts = responses.filter(response => response?.statusCode === 409);
  expect(accepted.length === 1, "profile_distinct_accepted_count");
  expect(conflicts.length === 1, "profile_distinct_conflict_count");
  expectError(
    conflicts[0],
    409,
    "event_sequence_conflict",
    false,
    "profile_distinct_sequence_conflict",
  );
  const winner = candidates.find(candidate => candidate?.event?.event_id === accepted[0]?.body?.event_id);
  expect(winner, "profile_distinct_winner_identity");
  expectAcceptance(accepted[0], winner.event, false);
  return winner;
}

function expectError(response, statusCode, code, retryable, prefix) {
  expect(response?.statusCode === statusCode, `${prefix}_status`);
  expectExactFields(response?.body, ["error"], `${prefix}_body`);
  expectExactFields(response.body.error, ["code", "retryable"], `${prefix}_error`);
  expect(response.body.error.code === code, `${prefix}_code`);
  expect(response.body.error.retryable === retryable, `${prefix}_retryable`);
}

function envelopeOf(issued) {
  return { body: issued.body, headers: issued.headers };
}

function requireDriver(driver) {
  if (!driver || typeof driver !== "object") throw profileError("profile_driver_invalid");
  for (const method of REQUIRED_DRIVER_METHODS) {
    if (typeof driver[method] !== "function") throw profileError("profile_driver_invalid");
  }
}

function requireClaimTokens(value) {
  if (
    !Array.isArray(value) ||
    value.length !== 3 ||
    value.some((token) => typeof token !== "string" || token.length === 0) ||
    new Set(value).size !== value.length
  ) {
    throw profileError("profile_claim_tokens_invalid");
  }
}

function expectExactFields(value, fields, code) {
  const actual = value && typeof value === "object" && !Array.isArray(value)
    ? Object.keys(value).sort()
    : [];
  const expected = [...fields].sort();
  expect(
    actual.length === expected.length && actual.every((field, index) => field === expected[index]),
    code,
  );
}

function expect(condition, code) {
  if (!condition) throw profileError(code);
}

function profileError(code) {
  return Object.assign(new Error(code), { code });
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
