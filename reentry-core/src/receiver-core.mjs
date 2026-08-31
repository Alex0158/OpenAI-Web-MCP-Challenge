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

export const CONSENT_DECISION_TYPE = "webmcp.receiver_consent_decision";

const RECEIVER_OPTION_FIELDS = Object.freeze([
  "store",
  "keyResolver",
  "consentAuthority",
  "maximumGrantLifetimeMs",
  "clock",
  "createId",
]);
const CREATE_CHALLENGE_FIELDS = Object.freeze(["manifest", "expectedOrigin"]);
const DECIDE_CONSENT_FIELDS = Object.freeze(["challengeId", "decisionToken"]);
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
const STORE_METHODS = Object.freeze([
  "transaction",
  "getChallengeByManifestId",
  "getChallengeById",
  "insertChallenge",
  "setChallengeDecision",
  "getGrantByChallengeId",
  "getGrantByBindingId",
  "insertGrant",
  "consumeGrantRun",
  "getEventById",
  "insertEvent",
  "insertDelivery",
]);
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const DECISION_FUTURE_SKEW_MS = 60 * 1_000;
const MAX_DECISION_TOKEN_BYTES = 4 * 1_024;

export class ReceiverCore {
  #store;
  #keyResolver;
  #consentAuthority;
  #maximumGrantLifetimeMs;
  #clock;
  #createId;

  constructor(options) {
    requireExactInput(
      options,
      RECEIVER_OPTION_FIELDS,
      ["store", "keyResolver", "consentAuthority", "maximumGrantLifetimeMs"],
      "Receiver Core options",
    );
    requireStore(options.store);
    if (typeof options.keyResolver !== "function") {
      throw new TypeError("Receiver Core keyResolver must be a function");
    }
    if (typeof options.consentAuthority?.verifyDecision !== "function") {
      throw new TypeError("Receiver Core consentAuthority must implement verifyDecision");
    }
    if (
      !Number.isSafeInteger(options.maximumGrantLifetimeMs) ||
      options.maximumGrantLifetimeMs < 1_000
    ) {
      throw new TypeError("Receiver Core maximumGrantLifetimeMs must be at least one second");
    }

    this.#store = options.store;
    this.#keyResolver = options.keyResolver;
    this.#consentAuthority = options.consentAuthority;
    this.#maximumGrantLifetimeMs = options.maximumGrantLifetimeMs;
    this.#clock = options.clock ?? (() => new Date());
    this.#createId = options.createId ?? ((prefix) => `${prefix}_${randomUUID()}`);
    if (typeof this.#clock !== "function") {
      throw new TypeError("Receiver Core clock must be a function");
    }
    if (typeof this.#createId !== "function") {
      throw new TypeError("Receiver Core createId must be a function");
    }
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
        created_at: now.toISOString(),
      });
      return acceptance;
    });
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
    decidedAt > now.getTime() + DECISION_FUTURE_SKEW_MS
  ) {
    throw authorization("consent_decision_time_invalid", "Consent decision time is outside its valid window");
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
  let status = "active";
  if (grant.revoked_at !== null) status = "revoked";
  else if (Date.parse(grant.expires_at) <= now.getTime()) status = "expired";
  else if (grant.runs_remaining === 0) status = "exhausted";
  return validatePublicBinding({
    type: PUBLIC_BINDING_TYPE,
    protocol_version: PROTOCOL_VERSION,
    binding_id: grant.binding_id,
    correlation_id: grant.correlation_id,
    workflow_id: grant.workflow_id,
    event_type: grant.event_type,
    expires_at: grant.expires_at,
    runs_remaining: grant.runs_remaining,
    status,
  });
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

function requireExactInput(value, allowedFields, requiredFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw validation("receiver_input_invalid", `${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw validation("receiver_input_invalid", `${label} must be a plain object`);
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key === "symbol") {
      throw validation("receiver_input_invalid", `${label} cannot contain symbol properties`);
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !("value" in descriptor)) {
      throw validation(
        "receiver_input_invalid",
        `${label} must contain enumerable data properties only`,
      );
    }
  }
  const fields = Object.keys(value);
  if (fields.some((field) => !allowedFields.includes(field))) {
    throw validation("receiver_input_fields_invalid", `${label} contains an unsupported field`);
  }
  if (requiredFields.some((field) => !fields.includes(field))) {
    throw validation("receiver_input_fields_invalid", `${label} is missing a required field`);
  }
}

function requireIdentifier(value, label) {
  if (
    typeof value !== "string" ||
    Buffer.byteLength(value, "utf8") > 160 ||
    !IDENTIFIER_PATTERN.test(value)
  ) {
    throw validation("receiver_identifier_invalid", `${label} is invalid`);
  }
  return value;
}

function requireDecisionToken(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    Buffer.byteLength(value, "utf8") > MAX_DECISION_TOKEN_BYTES ||
    /[^\x21-\x7e]/.test(value)
  ) {
    throw authorization("consent_token_invalid", "Consent decision token is invalid");
  }
  return value;
}

function requireTimestamp(value, label) {
  if (typeof value !== "string" || value.length > 27) {
    throw validation("receiver_timestamp_invalid", `${label} must be a canonical ISO-8601 timestamp`);
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    throw validation("receiver_timestamp_invalid", `${label} must be a canonical ISO-8601 timestamp`);
  }
  return value;
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export class ReceiverValidationError extends Error {
  constructor(code, message, statusCode = 422) {
    super(message);
    this.name = "ReceiverValidationError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ReceiverAuthorizationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ReceiverAuthorizationError";
    this.code = code;
    this.statusCode = 403;
  }
}

export class ReceiverConflictError extends Error {
  constructor(code, message, statusCode = 409) {
    super(message);
    this.name = "ReceiverConflictError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ReceiverScopeError extends Error {
  constructor(code, message, statusCode = 422) {
    super(message);
    this.name = "ReceiverScopeError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ReceiverNotFoundError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ReceiverNotFoundError";
    this.code = code;
    this.statusCode = 404;
  }
}

export class ReceiverInvariantError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ReceiverInvariantError";
    this.code = code;
    this.statusCode = 500;
  }
}

function validation(code, message, statusCode) {
  return new ReceiverValidationError(code, message, statusCode);
}

function authorization(code, message) {
  return new ReceiverAuthorizationError(code, message);
}

function conflict(code, message, statusCode) {
  return new ReceiverConflictError(code, message, statusCode);
}

function scope(code, message, statusCode) {
  return new ReceiverScopeError(code, message, statusCode);
}

function notFound(code, message) {
  return new ReceiverNotFoundError(code, message);
}

function invariant(code, message) {
  return new ReceiverInvariantError(code, message);
}
