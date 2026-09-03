import { randomUUID } from "node:crypto";

import {
  ACCEPTANCE_TYPE,
  PROTOCOL_VERSION,
  PUBLIC_BINDING_TYPE,
  canonicalJson,
  createContinuationAcceptance,
  createContinuationReceipt,
  parseContinuationEventBody,
  validatePublicBinding,
  validateReentryManifest,
  verifyContinuationEventEnvelope,
} from "./protocol.mjs";
import { ReceiverDelivery } from "./receiver-delivery.mjs";
import {
  authorization,
  conflict,
  deepFreeze,
  invariant,
  notFound,
  requireExactInput,
  requireIdentifier,
  requireOpaqueToken,
  requireTimestamp,
  scope,
} from "./receiver-support.mjs";

export {
  CONNECTOR_IDENTITY_TYPE,
  DELIVERY_ACKNOWLEDGEMENT_TYPE,
  DELIVERY_LEASE_TYPE,
  HOST_EFFECT_ATTESTATION_TYPE,
  HOST_EFFECT_OUTCOME,
} from "./receiver-delivery.mjs";
export {
  ReceiverAuthorizationError,
  ReceiverConflictError,
  ReceiverInvariantError,
  ReceiverNotFoundError,
  ReceiverScopeError,
  ReceiverValidationError,
} from "./receiver-support.mjs";

export const CONSENT_DECISION_TYPE = "webmcp.receiver_consent_decision";
export const GRANT_CONTROL_AUTHORIZATION_TYPE =
  "webmcp.receiver_grant_control_authorization";
export const GRANT_SUMMARY_TYPE = "webmcp.receiver_grant_summary";
export const GRANT_REVOCATION_TYPE = "webmcp.receiver_grant_revocation";

const RECEIVER_OPTION_FIELDS = Object.freeze([
  "store",
  "keyResolver",
  "consentAuthority",
  "grantControlAuthority",
  "connectorAuthority",
  "effectAuthority",
  "maximumGrantLifetimeMs",
  "leaseDurationMs",
  "maximumDeliveryAttempts",
  "clock",
  "createId",
]);
const CREATE_CHALLENGE_FIELDS = Object.freeze(["manifest", "expectedOrigin"]);
const DECIDE_CONSENT_FIELDS = Object.freeze(["challengeId", "decisionToken"]);
const GRANT_CONTROL_INPUT_FIELDS = Object.freeze(["bindingId", "controlToken"]);
const ENVELOPE_FIELDS = Object.freeze(["body", "headers"]);
const APPROVAL_DECISION_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "decision_id",
  "challenge_id",
  "action",
  "subject_id",
  "delivery_target_id",
  "decided_at",
]);
const DECLINE_DECISION_FIELDS = Object.freeze(
  APPROVAL_DECISION_FIELDS.filter((field) => field !== "delivery_target_id"),
);
const GRANT_CONTROL_AUTHORIZATION_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "binding_id",
  "action",
  "subject_id",
  "authenticated_at",
  "expires_at",
]);
const STORE_METHODS = Object.freeze([
  "transaction",
  "getChallengeByManifestId",
  "getChallengeById",
  "insertChallenge",
  "setChallengeDecision",
  "getGrantByChallengeId",
  "getGrantByBindingId",
  "insertGrant",
  "revokeGrant",
  "consumeGrantRun",
  "getEventById",
  "insertEvent",
  "insertDelivery",
]);
const AUTHORITY_FUTURE_SKEW_MS = 60 * 1_000;
const MIN_LEASE_DURATION_MS = 1_000;
const MAX_LEASE_DURATION_MS = 5 * 60 * 1_000;
const MAX_DELIVERY_ATTEMPTS_LIMIT = 100;

export class ReceiverCore {
  #store;
  #keyResolver;
  #consentAuthority;
  #grantControlAuthority;
  #maximumGrantLifetimeMs;
  #maximumDeliveryAttempts;
  #clock;
  #createId;
  #delivery;

  constructor(options) {
    requireExactInput(
      options,
      RECEIVER_OPTION_FIELDS,
      [
        "store",
        "keyResolver",
        "consentAuthority",
        "grantControlAuthority",
        "connectorAuthority",
        "effectAuthority",
        "maximumGrantLifetimeMs",
        "leaseDurationMs",
        "maximumDeliveryAttempts",
      ],
      "Receiver Core options",
    );
    requireStore(options.store);
    if (typeof options.keyResolver !== "function") {
      throw new TypeError("Receiver Core keyResolver must be a function");
    }
    if (typeof options.consentAuthority?.verifyDecision !== "function") {
      throw new TypeError("Receiver Core consentAuthority must implement verifyDecision");
    }
    if (typeof options.grantControlAuthority?.verifyControl !== "function") {
      throw new TypeError("Receiver Core grantControlAuthority must implement verifyControl");
    }
    if (typeof options.connectorAuthority?.verifyConnector !== "function") {
      throw new TypeError("Receiver Core connectorAuthority must implement verifyConnector");
    }
    if (typeof options.effectAuthority?.verifyEffect !== "function") {
      throw new TypeError("Receiver Core effectAuthority must implement verifyEffect");
    }
    if (
      !Number.isSafeInteger(options.maximumGrantLifetimeMs) ||
      options.maximumGrantLifetimeMs < 1_000
    ) {
      throw new TypeError("Receiver Core maximumGrantLifetimeMs must be at least one second");
    }
    if (
      !Number.isSafeInteger(options.leaseDurationMs) ||
      options.leaseDurationMs < MIN_LEASE_DURATION_MS ||
      options.leaseDurationMs > MAX_LEASE_DURATION_MS
    ) {
      throw new TypeError("Receiver Core leaseDurationMs must be between one second and five minutes");
    }
    if (
      !Number.isSafeInteger(options.maximumDeliveryAttempts) ||
      options.maximumDeliveryAttempts < 1 ||
      options.maximumDeliveryAttempts > MAX_DELIVERY_ATTEMPTS_LIMIT
    ) {
      throw new TypeError("Receiver Core maximumDeliveryAttempts must be between 1 and 100");
    }

    this.#store = options.store;
    this.#keyResolver = options.keyResolver;
    this.#consentAuthority = options.consentAuthority;
    this.#grantControlAuthority = options.grantControlAuthority;
    this.#maximumGrantLifetimeMs = options.maximumGrantLifetimeMs;
    this.#maximumDeliveryAttempts = options.maximumDeliveryAttempts;
    this.#clock = options.clock ?? (() => new Date());
    this.#createId = options.createId ?? ((prefix) => `${prefix}_${randomUUID()}`);
    if (typeof this.#clock !== "function") {
      throw new TypeError("Receiver Core clock must be a function");
    }
    if (typeof this.#createId !== "function") {
      throw new TypeError("Receiver Core createId must be a function");
    }
    this.#delivery = new ReceiverDelivery({
      store: options.store,
      connectorAuthority: options.connectorAuthority,
      effectAuthority: options.effectAuthority,
      leaseDurationMs: options.leaseDurationMs,
      clock: this.#clock,
    });
  }

  createConsentChallenge(input) {
    requireExactInput(
      input,
      CREATE_CHALLENGE_FIELDS,
      CREATE_CHALLENGE_FIELDS,
      "Consent challenge input",
    );
    const now = this.#readClock();
    const manifest = validateReentryManifest(input.manifest, {
      keyResolver: this.#keyResolver,
      expectedOrigin: input.expectedOrigin,
      now,
    });
    const manifestJson = canonicalJson(manifest);
    const maximumExpiresAt = new Date(now.getTime() + this.#maximumGrantLifetimeMs);
    if (!Number.isFinite(maximumExpiresAt.getTime())) {
      throw new TypeError("Receiver Core maximum Grant lifetime exceeds the Date range");
    }
    const effectiveExpiresAt = new Date(Math.min(
      Date.parse(manifest.grant_request.grant_expires_at),
      maximumExpiresAt.getTime(),
    )).toISOString();
    const challenge = {
      challenge_id: this.#nextId("challenge"),
      manifest_id: manifest.manifest_id,
      manifest_json: manifestJson,
      expected_origin: manifest.issuer_origin,
      effective_expires_at: effectiveExpiresAt,
      status: "pending",
      decision_id: null,
      decision_action: null,
      subject_id: null,
      created_at: now.toISOString(),
      decided_at: null,
    };

    return this.#store.transaction((transaction) => {
      const existing = transaction.getChallengeByManifestId(manifest.manifest_id);
      if (existing) {
        if (existing.manifest_json !== manifestJson) {
          throw conflict(
            "manifest_identity_conflict",
            "Manifest ID is already attached to different canonical content",
          );
        }
        return deepFreeze({
          challenge: buildPublicChallenge(existing, now),
          duplicate: true,
        });
      }
      transaction.insertChallenge(challenge);
      return deepFreeze({
        challenge: buildPublicChallenge(challenge, now),
        duplicate: false,
      });
    });
  }

  getConsentChallenge(challengeId) {
    const normalizedId = requireIdentifier(challengeId, "challengeId");
    const challenge = this.#store.getChallengeById(normalizedId);
    if (!challenge) {
      throw notFound("challenge_not_found", "Consent challenge was not found");
    }
    return buildPublicChallenge(challenge, this.#readClock());
  }

  decideConsent(input) {
    requireExactInput(
      input,
      DECIDE_CONSENT_FIELDS,
      DECIDE_CONSENT_FIELDS,
      "Consent decision input",
    );
    const challengeId = requireIdentifier(input.challengeId, "challengeId");
    const decisionToken = requireDecisionToken(input.decisionToken);
    const now = this.#readClock();
    const initial = this.#store.getChallengeById(challengeId);
    if (!initial) {
      throw notFound("challenge_not_found", "Consent challenge was not found");
    }
    const decision = this.#verifyDecision(challengeId, decisionToken, initial, now);

    if (initial.status !== "pending") {
      return this.#terminalDecisionResponse(initial, decision, now, true);
    }
    if (decision.action === "decline") {
      return this.#store.transaction((transaction) => {
        const current = requireChallenge(transaction, challengeId);
        if (current.status !== "pending") {
          return this.#terminalDecisionResponse(current, decision, now, true, transaction);
        }
        const changed = transaction.setChallengeDecision({
          challenge_id: challengeId,
          status: "declined",
          decision_id: decision.decision_id,
          decision_action: "decline",
          subject_id: decision.subject_id,
          decided_at: decision.decided_at,
        });
        if (!changed) {
          throw conflict("consent_decision_race", "Consent decision claim was lost");
        }
        return decisionResponse("declined", challengeId, false);
      });
    }

    const manifest = validateReentryManifest(JSON.parse(initial.manifest_json), {
      keyResolver: this.#keyResolver,
      expectedOrigin: initial.expected_origin,
      now,
    });
    assertApprovalWindow(initial, manifest, decision, now);
    const grantId = this.#nextId("grant");
    const bindingId = this.#nextId("binding");
    const receipt = createContinuationReceipt({
      type: "webmcp.continuation_receipt",
      protocol_version: PROTOCOL_VERSION,
      grant_id: grantId,
      correlation_id: manifest.correlation_id,
      issuer_origin: manifest.issuer_origin,
      workflow_id: manifest.workflow.id,
      event_type: manifest.grant_request.event_type,
      canonical_url: manifest.workflow.canonical_url,
      expires_at: initial.effective_expires_at,
      human_boundary: manifest.grant_request.human_boundary,
      continuation_mode: "open_canonical_page_read_current_state",
    });
    const grant = {
      grant_id: grantId,
      challenge_id: challengeId,
      manifest_id: manifest.manifest_id,
      binding_id: bindingId,
      subject_id: decision.subject_id,
      delivery_target_id: decision.delivery_target_id,
      correlation_id: manifest.correlation_id,
      issuer_origin: manifest.issuer_origin,
      workflow_type: manifest.workflow.type,
      workflow_id: manifest.workflow.id,
      event_type: manifest.grant_request.event_type,
      canonical_url: manifest.workflow.canonical_url,
      expires_at: initial.effective_expires_at,
      human_boundary: manifest.grant_request.human_boundary,
      instruction: manifest.display.reason,
      runs_remaining: 1,
      revoked_at: null,
      receipt_json: canonicalJson(receipt),
      created_at: now.toISOString(),
    };

    return this.#store.transaction((transaction) => {
      const current = requireChallenge(transaction, challengeId);
      if (current.status !== "pending") {
        return this.#terminalDecisionResponse(current, decision, now, true, transaction);
      }
      if (
        current.manifest_json !== initial.manifest_json ||
        current.effective_expires_at !== initial.effective_expires_at
      ) {
        throw invariant("challenge_changed", "Consent challenge changed during approval");
      }
      transaction.insertGrant(grant);
      const changed = transaction.setChallengeDecision({
        challenge_id: challengeId,
        status: "approved",
        decision_id: decision.decision_id,
        decision_action: "approve",
        subject_id: decision.subject_id,
        decided_at: decision.decided_at,
      });
      if (!changed) {
        throw conflict("consent_decision_race", "Consent decision claim was lost");
      }
      return approvalResponse(challengeId, grant, now, false);
    });
  }

  acceptEvent(envelope) {
    requireExactInput(envelope, ENVELOPE_FIELDS, ENVELOPE_FIELDS, "Event envelope");
    const parsedEvent = parseContinuationEventBody(envelope.body);
    const initialGrant = this.#store.getGrantByBindingId(parsedEvent.binding_id);
    if (!initialGrant) {
      throw scope("event_scope_invalid", "Event does not resolve to an eligible Grant");
    }
    const now = this.#readClock();
    const event = verifyContinuationEventEnvelope(envelope, {
      keyResolver: this.#keyResolver,
      expectedOrigin: initialGrant.issuer_origin,
      now,
    });

    return this.#store.transaction((transaction) => {
      const existing = transaction.getEventById(event.event_id);
      if (existing) {
        if (
          existing.grant_id !== initialGrant.grant_id ||
          existing.canonical_body !== envelope.body
        ) {
          throw conflict(
            "event_identity_conflict",
            "Event ID is already attached to different canonical content",
          );
        }
        const prior = JSON.parse(existing.acceptance_json);
        return createContinuationAcceptance({ ...prior, duplicate: true });
      }

      const grant = transaction.getGrantByBindingId(event.binding_id);
      if (!grant) {
        throw scope("event_scope_invalid", "Event does not resolve to an eligible Grant");
      }
      validateEventAgainstGrant(event, grant, now);
      const deliveryId = this.#nextId("delivery");
      const acceptance = createContinuationAcceptance({
        type: ACCEPTANCE_TYPE,
        protocol_version: PROTOCOL_VERSION,
        event_id: event.event_id,
        correlation_id: event.correlation_id,
        accepted: true,
        duplicate: false,
        status: "accepted",
      });

      if (!transaction.consumeGrantRun(grant.grant_id)) {
        throw conflict("grant_reservation_lost", "Grant run reservation was lost");
      }
      transaction.insertEvent({
        event_id: event.event_id,
        grant_id: grant.grant_id,
        canonical_body: envelope.body,
        acceptance_json: canonicalJson(acceptance),
        received_at: now.toISOString(),
      });
      transaction.insertDelivery({
        delivery_id: deliveryId,
        event_id: event.event_id,
        grant_id: grant.grant_id,
        delivery_target_id: grant.delivery_target_id,
        status: "pending",
        maximum_attempts: this.#maximumDeliveryAttempts,
        created_at: now.toISOString(),
      });
      return acceptance;
    });
  }

  inspectGrant(input) {
    requireExactInput(
      input,
      GRANT_CONTROL_INPUT_FIELDS,
      GRANT_CONTROL_INPUT_FIELDS,
      "Grant inspection input",
    );
    const bindingId = requireIdentifier(input.bindingId, "bindingId");
    const controlToken = requireGrantControlToken(input.controlToken);
    const now = this.#readClock();
    const authorization = this.#verifyGrantControl(
      bindingId,
      "inspect",
      controlToken,
      now,
    );
    const grant = this.#store.getGrantByBindingId(bindingId);
    if (!grant) {
      throw notFound("grant_not_found", "Grant was not found");
    }
    assertGrantControlSubject(grant, authorization);
    return grantSummary(grant, now);
  }

  revokeGrant(input) {
    requireExactInput(
      input,
      GRANT_CONTROL_INPUT_FIELDS,
      GRANT_CONTROL_INPUT_FIELDS,
      "Grant revocation input",
    );
    const bindingId = requireIdentifier(input.bindingId, "bindingId");
    const controlToken = requireGrantControlToken(input.controlToken);
    const now = this.#readClock();
    const authorization = this.#verifyGrantControl(
      bindingId,
      "revoke",
      controlToken,
      now,
    );
    const revokedAt = now.toISOString();

    return this.#store.transaction((transaction) => {
      const grant = transaction.getGrantByBindingId(bindingId);
      if (!grant) {
        throw notFound("grant_not_found", "Grant was not found");
      }
      assertGrantControlSubject(grant, authorization);
      if (grant.revoked_at !== null) {
        return grantRevocation(grant, true);
      }
      if (!transaction.revokeGrant(grant.grant_id, revokedAt)) {
        const current = transaction.getGrantByBindingId(bindingId);
        if (current && current.revoked_at !== null) {
          assertGrantControlSubject(current, authorization);
          return grantRevocation(current, true);
        }
        throw conflict("grant_revocation_race", "Grant revocation claim was lost");
      }
      return grantRevocation({ ...grant, revoked_at: revokedAt }, false);
    });
  }

  claimDelivery(input) {
    return this.#delivery.claimDelivery(input);
  }

  acknowledgeDelivery(input) {
    return this.#delivery.acknowledgeDelivery(input);
  }
  #verifyDecision(challengeId, token, challenge, now) {
    let value;
    try {
      value = this.#consentAuthority.verifyDecision({
        challengeId,
        decisionToken: token,
      });
    } catch {
      throw authorization(
        "consent_decision_invalid",
        "Consent decision could not be verified by the Receiver authority",
      );
    }
    if (value === undefined || value === null) {
      throw authorization(
        "consent_decision_invalid",
        "Consent decision could not be verified by the Receiver authority",
      );
    }
    return normalizeConsentDecision(value, challenge, now);
  }

  #verifyGrantControl(bindingId, action, token, now) {
    let value;
    try {
      value = this.#grantControlAuthority.verifyControl({
        bindingId,
        action,
        controlToken: token,
      });
    } catch {
      throw authorization(
        "grant_control_invalid",
        "Grant control could not be verified by the Receiver authority",
      );
    }
    if (value === undefined || value === null) {
      throw authorization(
        "grant_control_invalid",
        "Grant control could not be verified by the Receiver authority",
      );
    }
    return normalizeGrantControlAuthorization(value, bindingId, action, now);
  }

  #terminalDecisionResponse(challenge, decision, now, duplicate, transaction = this.#store) {
    if (
      challenge.decision_id !== decision.decision_id ||
      challenge.decision_action !== decision.action
    ) {
      throw conflict("consent_already_decided", "Consent challenge has a different terminal decision");
    }
    if (
      challenge.subject_id !== decision.subject_id ||
      challenge.decided_at !== decision.decided_at
    ) {
      throw conflict(
        "consent_decision_identity_conflict",
        "Consent decision ID is attached to different attestation content",
      );
    }
    if (challenge.status === "declined") {
      return decisionResponse("declined", challenge.challenge_id, duplicate);
    }
    if (challenge.status !== "approved") {
      throw invariant("challenge_status_invalid", "Consent challenge has an invalid terminal state");
    }
    const grant = transaction.getGrantByChallengeId(challenge.challenge_id);
    if (!grant) {
      throw invariant("approved_grant_missing", "Approved consent challenge has no Grant");
    }
    if (grant.delivery_target_id !== decision.delivery_target_id) {
      throw conflict(
        "consent_decision_identity_conflict",
        "Consent decision ID is attached to different attestation content",
      );
    }
    return approvalResponse(challenge.challenge_id, grant, now, duplicate);
  }

  #readClock() {
    const value = this.#clock();
    if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
      throw new TypeError("Receiver Core clock must return a valid Date");
    }
    return new Date(value.getTime());
  }

  #nextId(prefix) {
    const value = this.#createId(prefix);
    if (typeof value !== "string") {
      throw new TypeError("Receiver Core createId must return a string");
    }
    return requireIdentifier(value, `${prefix} ID`);
  }
}

function buildPublicChallenge(challenge, now) {
  const manifest = JSON.parse(challenge.manifest_json);
  const expired = challenge.status === "pending" && (
    Date.parse(manifest.offer_expires_at) <= now.getTime() ||
    Date.parse(challenge.effective_expires_at) <= now.getTime()
  );
  return deepFreeze({
    challenge_id: challenge.challenge_id,
    manifest_id: challenge.manifest_id,
    correlation_id: manifest.correlation_id,
    status: expired ? "expired" : challenge.status,
    issuer_origin: manifest.issuer_origin,
    offer_expires_at: manifest.offer_expires_at,
    workflow: {
      id: manifest.workflow.id,
      type: manifest.workflow.type,
      canonical_url: manifest.workflow.canonical_url,
    },
    display: {
      title: manifest.display.title,
      reason: manifest.display.reason,
    },
    grant_scope: {
      event_type: manifest.grant_request.event_type,
      expires_at: challenge.effective_expires_at,
      max_runs: 1,
      human_boundary: manifest.grant_request.human_boundary,
    },
  });
}

function normalizeConsentDecision(value, challenge, now) {
  requireExactInput(
    value,
    APPROVAL_DECISION_FIELDS,
    DECLINE_DECISION_FIELDS,
    "Consent decision attestation",
  );
  if (!["approve", "decline"].includes(value.action)) {
    throw authorization("consent_decision_action_invalid", "Consent decision action is unsupported");
  }
  requireExactInput(
    value,
    value.action === "approve" ? APPROVAL_DECISION_FIELDS : DECLINE_DECISION_FIELDS,
    value.action === "approve" ? APPROVAL_DECISION_FIELDS : DECLINE_DECISION_FIELDS,
    "Consent decision attestation",
  );
  if (value.type !== CONSENT_DECISION_TYPE || value.protocol_version !== PROTOCOL_VERSION) {
    throw authorization("consent_decision_version_invalid", "Consent decision version is unsupported");
  }
  const normalized = {
    type: CONSENT_DECISION_TYPE,
    protocol_version: PROTOCOL_VERSION,
    decision_id: requireIdentifier(value.decision_id, "decision_id"),
    challenge_id: requireIdentifier(value.challenge_id, "decision challenge_id"),
    action: value.action,
    subject_id: requireIdentifier(value.subject_id, "decision subject_id"),
    ...(value.action === "approve"
      ? { delivery_target_id: requireIdentifier(value.delivery_target_id, "decision delivery_target_id") }
      : {}),
    decided_at: requireTimestamp(value.decided_at, "decision decided_at"),
  };
  if (normalized.challenge_id !== challenge.challenge_id) {
    throw authorization("consent_decision_scope_invalid", "Consent decision is for another challenge");
  }
  const decidedAt = Date.parse(normalized.decided_at);
  if (
    decidedAt < Date.parse(challenge.created_at) ||
    decidedAt > now.getTime() + AUTHORITY_FUTURE_SKEW_MS
  ) {
    throw authorization("consent_decision_time_invalid", "Consent decision time is outside its valid window");
  }
  return deepFreeze(normalized);
}

function normalizeGrantControlAuthorization(value, bindingId, action, now) {
  requireExactInput(
    value,
    GRANT_CONTROL_AUTHORIZATION_FIELDS,
    GRANT_CONTROL_AUTHORIZATION_FIELDS,
    "Grant control authorization",
  );
  if (
    value.type !== GRANT_CONTROL_AUTHORIZATION_TYPE ||
    value.protocol_version !== PROTOCOL_VERSION
  ) {
    throw authorization(
      "grant_control_version_invalid",
      "Grant control version is unsupported",
    );
  }
  const normalized = {
    type: GRANT_CONTROL_AUTHORIZATION_TYPE,
    protocol_version: PROTOCOL_VERSION,
    binding_id: requireIdentifier(value.binding_id, "control binding_id"),
    action: value.action,
    subject_id: requireIdentifier(value.subject_id, "control subject_id"),
    authenticated_at: requireTimestamp(value.authenticated_at, "control authenticated_at"),
    expires_at: requireTimestamp(value.expires_at, "control expires_at"),
  };
  if (!["inspect", "revoke"].includes(normalized.action)) {
    throw authorization("grant_control_action_invalid", "Grant control action is unsupported");
  }
  if (normalized.binding_id !== bindingId || normalized.action !== action) {
    throw authorization("grant_control_scope_invalid", "Grant control is for another operation");
  }
  const authenticatedAt = Date.parse(normalized.authenticated_at);
  const expiresAt = Date.parse(normalized.expires_at);
  if (
    authenticatedAt > now.getTime() + AUTHORITY_FUTURE_SKEW_MS ||
    authenticatedAt >= expiresAt ||
    expiresAt <= now.getTime()
  ) {
    throw authorization("grant_control_time_invalid", "Grant control is outside its valid window");
  }
  return deepFreeze(normalized);
}

function assertApprovalWindow(challenge, manifest, decision, now) {
  const effectiveExpiry = Date.parse(challenge.effective_expires_at);
  if (effectiveExpiry <= now.getTime()) {
    throw conflict("grant_window_expired", "Effective Grant window has expired", 410);
  }
  if (
    Date.parse(decision.decided_at) >= effectiveExpiry ||
    Date.parse(decision.decided_at) >= Date.parse(manifest.offer_expires_at)
  ) {
    throw authorization("consent_decision_time_invalid", "Approval occurred outside the consent window");
  }
}

function validateEventAgainstGrant(event, grant, now) {
  if (
    event.binding_id !== grant.binding_id ||
    event.correlation_id !== grant.correlation_id ||
    event.issuer_origin !== grant.issuer_origin ||
    event.workflow_id !== grant.workflow_id ||
    event.event_type !== grant.event_type ||
    event.canonical_url !== grant.canonical_url
  ) {
    throw scope("event_scope_invalid", "Event is outside the approved Grant scope");
  }
  if (grant.revoked_at !== null) {
    throw scope("grant_revoked", "Grant is revoked");
  }
  if (Date.parse(grant.expires_at) <= now.getTime()) {
    throw scope("grant_expired", "Grant is expired", 410);
  }
  if (grant.runs_remaining !== 1) {
    throw conflict("grant_exhausted", "Grant run budget is exhausted");
  }
  if (Date.parse(event.occurred_at) >= Date.parse(grant.expires_at)) {
    throw scope("event_after_grant_expiry", "Event occurred outside the Grant window");
  }
}

function approvalResponse(challengeId, grant, now, duplicate) {
  return deepFreeze({
    challenge_id: challengeId,
    status: "approved",
    duplicate,
    binding: publicBindingFromGrant(grant, now),
  });
}

function decisionResponse(status, challengeId, duplicate) {
  return deepFreeze({
    challenge_id: challengeId,
    status,
    duplicate,
  });
}

function publicBindingFromGrant(grant, now) {
  return validatePublicBinding({
    type: PUBLIC_BINDING_TYPE,
    protocol_version: PROTOCOL_VERSION,
    binding_id: grant.binding_id,
    correlation_id: grant.correlation_id,
    workflow_id: grant.workflow_id,
    event_type: grant.event_type,
    expires_at: grant.expires_at,
    runs_remaining: grant.runs_remaining,
    status: grantStatus(grant, now),
  });
}

function grantSummary(grant, now) {
  return deepFreeze({
    type: GRANT_SUMMARY_TYPE,
    protocol_version: PROTOCOL_VERSION,
    binding_id: grant.binding_id,
    correlation_id: grant.correlation_id,
    issuer_origin: grant.issuer_origin,
    workflow_type: grant.workflow_type,
    workflow_id: grant.workflow_id,
    event_type: grant.event_type,
    canonical_url: grant.canonical_url,
    expires_at: grant.expires_at,
    human_boundary: grant.human_boundary,
    runs_remaining: grant.runs_remaining,
    status: grantStatus(grant, now),
    created_at: grant.created_at,
    revoked_at: grant.revoked_at,
  });
}

function grantRevocation(grant, duplicate) {
  return deepFreeze({
    type: GRANT_REVOCATION_TYPE,
    protocol_version: PROTOCOL_VERSION,
    binding_id: grant.binding_id,
    status: "revoked",
    revoked_at: grant.revoked_at,
    duplicate,
  });
}

function grantStatus(grant, now) {
  if (grant.revoked_at !== null) return "revoked";
  if (Date.parse(grant.expires_at) <= now.getTime()) return "expired";
  if (grant.runs_remaining === 0) return "exhausted";
  return "active";
}

function assertGrantControlSubject(grant, control) {
  if (grant.subject_id !== control.subject_id) {
    throw authorization(
      "grant_control_scope_invalid",
      "Grant control subject does not own this Grant",
    );
  }
}

function requireChallenge(store, challengeId) {
  const challenge = store.getChallengeById(challengeId);
  if (!challenge) throw notFound("challenge_not_found", "Consent challenge was not found");
  return challenge;
}

function requireStore(store) {
  if (!store || typeof store !== "object") {
    throw new TypeError("Receiver Core store must implement the persistence port");
  }
  for (const method of STORE_METHODS) {
    if (typeof store[method] !== "function") {
      throw new TypeError(`Receiver Core store is missing ${method}`);
    }
  }
}

function requireDecisionToken(value) {
  return requireOpaqueToken(value, "Consent decision token", "consent_token_invalid");
}

function requireGrantControlToken(value) {
  return requireOpaqueToken(value, "Grant control token", "grant_control_token_invalid");
}
