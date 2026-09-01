import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { TextDecoder } from "node:util";

import {
  CONSENT_DECISION_TYPE,
} from "../../../reentry-core/src/receiver-core.mjs";
import { PROTOCOL_VERSION } from "../../../reentry-core/src/protocol.mjs";

export const CLOUD_RECEIVER_CONSENT_ROUTES = Object.freeze({
  session: "/v0.1/consent-sessions",
  decision: "/v0.1/consent-decisions",
});

const OPTION_FIELDS = Object.freeze([
  "store",
  "pairingControl",
  "getReceiver",
  "organizationId",
  "hostApiKey",
  "consentTokenSecret",
  "clock",
  "createId",
]);
const REQUIRED_OPTION_FIELDS = Object.freeze([...OPTION_FIELDS]);
const SESSION_FIELDS = Object.freeze([
  "host_subject_ref",
  "expected_origin",
  "manifest",
]);
const DECISION_FIELDS = Object.freeze([
  "challenge_id",
  "host_subject_ref",
  "action",
  "consent_token",
]);
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const MAX_BODY_BYTES = 24 * 1_024;
const MAX_TOKEN_BYTES = 4 * 1_024;
const CONTROL_CONTENT_TYPE = /^application\/json(?:\s*;\s*charset=utf-8)?$/i;
const ERROR_CODE_PATTERN = /^[a-z][a-z0-9_]{0,95}$/;

export class ConsentControlError extends Error {
  constructor(code, statusCode, message) {
    super(message);
    this.name = "ConsentControlError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function createConsentControlPlane(options) {
  requireExactRecord(options, OPTION_FIELDS, REQUIRED_OPTION_FIELDS, "Consent control options");
  requireStore(options.store);
  requirePairingControl(options.pairingControl);
  if (typeof options.getReceiver !== "function") {
    throw new TypeError("Consent control getReceiver must be a function");
  }
  const organizationId = requireIdentifier(options.organizationId, "organizationId");
  const hostApiKeyDigest = digest(options.hostApiKey, "Host API key");
  const consentTokenSecret = requireSecret(options.consentTokenSecret, "Consent token secret");
  const clock = requireClock(options.clock);
  const createId = requireCreateId(options.createId);

  return Object.freeze({
    handler,
    createConsentSession,
    decideConsent,
    verifyDecision,
    readiness: () => options.store.ready(),
  });

  function createConsentSession(input) {
    requireExactRecord(input, SESSION_FIELDS, SESSION_FIELDS, "Consent session input");
    const hostSubjectRef = requireIdentifier(input.host_subject_ref, "host_subject_ref");
    const expectedOrigin = requireOrigin(input.expected_origin, "expected_origin");
    const mapping = resolveHostSubject(hostSubjectRef);
    const receiver = requireReceiver(options.getReceiver());
    const enrollment = receiver.createConsentChallenge({
      manifest: input.manifest,
      expectedOrigin: expectedOrigin,
    });
    const challenge = enrollment.challenge;
    const existing = options.store.getConsentSessionByChallengeId(challenge.challenge_id);
    if (existing) {
      assertSameSessionIdentity(existing, mapping, hostSubjectRef, challenge);
      return buildSessionResponse(
        existing,
        receiver,
        challenge,
        true,
        deriveConsentToken(consentTokenSecret, existing.challenge_id),
      );
    }
    if (challenge.status !== "pending") {
      throw new ConsentControlError(
        "consent_session_not_pending",
        409,
        "Consent challenge is no longer pending",
      );
    }

    const now = readClock(clock);
    const consentToken = deriveConsentToken(consentTokenSecret, challenge.challenge_id);
    const result = options.store.createConsentSession({
      consent_session_id: requireIdentifier(createId("consent_session"), "consent_session_id"),
      organization_id: organizationId,
      challenge_id: challenge.challenge_id,
      host_subject_ref_digest: digest(hostSubjectRef, "Host subject reference"),
      subject_id: requireIdentifier(mapping.subject_id, "subject_id"),
      delivery_target_id: requireIdentifier(mapping.delivery_target_id, "delivery_target_id"),
      consent_token_digest: digest(consentToken, "Consent token"),
      decision_id: requireIdentifier(createId("decision"), "decision_id"),
      status: "pending",
      created_at: now.toISOString(),
      expires_at: sessionExpiry(challenge),
      decision_action: null,
      decided_at: null,
    });
    return buildSessionResponse(result.record, receiver, challenge, result.duplicate, consentToken);
  }

  function decideConsent(input) {
    requireExactRecord(input, DECISION_FIELDS, DECISION_FIELDS, "Consent decision input");
    const challengeId = requireIdentifier(input.challenge_id, "challenge_id");
    const hostSubjectRef = requireIdentifier(input.host_subject_ref, "host_subject_ref");
    const consentToken = requireConsentToken(input.consent_token);
    if (!['approve', 'decline'].includes(input.action)) {
      throw new ConsentControlError(
        "consent_action_invalid",
        400,
        "Consent action is invalid",
      );
    }
    const session = options.store.getConsentSessionByTokenDigest(
      digest(consentToken, "Consent token"),
    );
    if (
      !session ||
      session.organization_id !== organizationId ||
      session.challenge_id !== challengeId ||
      session.host_subject_ref_digest !== digest(hostSubjectRef, "Host subject reference")
    ) {
      throw new ConsentControlError(
        "consent_token_invalid",
        403,
        "Consent token is invalid",
      );
    }
    const mapping = resolveHostSubject(hostSubjectRef);
    if (
      mapping.subject_id !== session.subject_id ||
      mapping.delivery_target_id !== session.delivery_target_id
    ) {
      throw new ConsentControlError(
        "consent_subject_invalid",
        403,
        "Consent subject is invalid",
      );
    }
    if (
      session.status === "pending" ||
      session.status === "deciding"
    ) {
      if (Date.parse(session.expires_at) <= readClock(clock).getTime()) {
        throw new ConsentControlError(
          "consent_session_expired",
          410,
          "Consent session has expired",
        );
      }
    }

    const now = readClock(clock);
    const decidedAt = session.decided_at ?? now.toISOString();
    const prepared = options.store.prepareConsentDecision({
      challenge_id: challengeId,
      action: input.action,
      decision_id: session.decision_id,
      decided_at: decidedAt,
    });
    if (!prepared) {
      throw new ConsentControlError(
        "consent_session_not_found",
        404,
        "Consent session was not found",
      );
    }
    const receiver = requireReceiver(options.getReceiver());
    const result = receiver.decideConsent({
      challengeId,
      decisionToken: consentToken,
    });
    const terminalStatus = result.status === "approved" ? "approved" : "declined";
    options.store.finalizeConsentSession(challengeId, terminalStatus);
    return buildDecisionResponse(result, session.consent_session_id);
  }

  function verifyDecision({ challengeId, decisionToken }) {
    const normalizedChallengeId = requireIdentifier(challengeId, "challenge_id");
    const normalizedToken = requireConsentToken(decisionToken);
    const session = options.store.getConsentSessionByTokenDigest(
      digest(normalizedToken, "Consent token"),
    );
    if (
      !session ||
      session.organization_id !== organizationId ||
      session.challenge_id !== normalizedChallengeId ||
      !['deciding', 'approved', 'declined'].includes(session.status) ||
      !session.decision_action ||
      !session.decided_at
    ) {
      throw new ConsentControlError(
        "consent_decision_invalid",
        403,
        "Consent decision is invalid",
      );
    }
    return {
      type: CONSENT_DECISION_TYPE,
      protocol_version: PROTOCOL_VERSION,
      decision_id: session.decision_id,
      challenge_id: session.challenge_id,
      action: session.decision_action,
      subject_id: session.subject_id,
      ...(session.decision_action === "approve"
        ? { delivery_target_id: session.delivery_target_id }
        : {}),
      decided_at: session.decided_at,
    };
  }

  async function handler(request, response) {
    const route = parseRoute(request.url);
    if (!route) return false;
    try {
      if (request.method !== "POST") {
        writeJson(response, 405, { error: { code: "http_method_not_allowed" } }, { Allow: "POST" });
        return true;
      }
      requireJsonContentType(request);
      requireBearer(request, hostApiKeyDigest);
      const body = await readJsonBody(request);
      if (route === "session") {
        const result = createConsentSession(body);
        writeJson(response, result.duplicate ? 200 : 201, result);
      } else {
        writeJson(response, 200, decideConsent(body));
      }
      return true;
    } catch (error) {
      writeJson(response, statusFor(error), { error: { code: codeFor(error) } });
      return true;
    }
  }

  function resolveHostSubject(hostSubjectRef) {
    let mapping;
    try {
      mapping = options.pairingControl.resolveHostSubject({
        host_subject_ref: hostSubjectRef,
      });
    } catch {
      mapping = null;
    }
    if (
      !mapping ||
      typeof mapping !== "object" ||
      typeof mapping.subject_id !== "string" ||
      typeof mapping.delivery_target_id !== "string"
    ) {
      throw new ConsentControlError(
        "host_subject_not_paired",
        409,
        "Host subject is not paired with a Connector",
      );
    }
    return mapping;
  }
}

function buildSessionResponse(record, receiver, challenge, duplicate, consentToken) {
  const currentChallenge = challenge ?? receiver.getConsentChallenge(record.challenge_id);
  return {
    type: "webmcp.reentry_consent_session",
    protocol_version: PROTOCOL_VERSION,
    consent_session_id: record.consent_session_id,
    challenge: currentChallenge,
    consent_token: consentToken,
    expires_at: record.expires_at,
    duplicate,
  };
}

function buildDecisionResponse(result, consentSessionId) {
  return {
    type: "webmcp.reentry_consent_decision",
    protocol_version: PROTOCOL_VERSION,
    consent_session_id: consentSessionId,
    challenge_id: result.challenge_id,
    status: result.status,
    duplicate: result.duplicate,
    ...(result.binding === undefined ? {} : { binding: result.binding }),
  };
}

function assertSameSessionIdentity(existing, mapping, hostSubjectRef, challenge) {
  if (
    existing.organization_id !== mapping.organization_id && mapping.organization_id !== undefined
  ) {
    throw new ConsentControlError("consent_session_identity_conflict", 409, "Consent session identity conflicts");
  }
  if (
    existing.challenge_id !== challenge.challenge_id ||
    existing.host_subject_ref_digest !== digest(hostSubjectRef, "Host subject reference") ||
    existing.subject_id !== mapping.subject_id ||
    existing.delivery_target_id !== mapping.delivery_target_id
  ) {
    throw new ConsentControlError(
      "consent_session_identity_conflict",
      409,
      "Consent session identity conflicts",
    );
  }
}

function sessionExpiry(challenge) {
  const offer = Date.parse(challenge.offer_expires_at);
  const grant = Date.parse(challenge.grant_scope.expires_at);
  if (!Number.isFinite(offer) || !Number.isFinite(grant)) {
    throw new ConsentControlError("consent_challenge_invalid", 500, "Consent challenge expiry is invalid");
  }
  return new Date(Math.min(offer, grant)).toISOString();
}

function deriveConsentToken(secret, challengeId) {
  return createHmac("sha256", secret)
    .update(`consent:${challengeId}`, "utf8")
    .digest("base64url");
}

function parseRoute(value) {
  if (value === CLOUD_RECEIVER_CONSENT_ROUTES.session) return "session";
  if (value === CLOUD_RECEIVER_CONSENT_ROUTES.decision) return "decision";
  return null;
}

function requireBearer(request, expectedDigest) {
  const value = request.headers?.authorization;
  if (typeof value !== "string" || !/^Bearer [\x21-\x7e]+$/.test(value)) {
    throw new ConsentControlError("organization_auth_invalid", 403, "Organization authentication is invalid");
  }
  const received = Buffer.from(digest(value.slice(7), "Organization API key"), "base64url");
  const expected = Buffer.from(expectedDigest, "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new ConsentControlError("organization_auth_invalid", 403, "Organization authentication is invalid");
  }
}

function requireJsonContentType(request) {
  const value = request.headers?.["content-type"];
  if (typeof value !== "string" || !CONTROL_CONTENT_TYPE.test(value) || request.headers?.["content-encoding"] !== undefined) {
    throw new ConsentControlError("http_content_type_invalid", 415, "Request content type is invalid");
  }
}

async function readJsonBody(request) {
  const declared = request.headers?.["content-length"];
  if (
    declared !== undefined &&
    (!/^(?:0|[1-9][0-9]*)$/.test(declared) || Number(declared) > MAX_BODY_BYTES)
  ) {
    throw new ConsentControlError(
      Number(declared) > MAX_BODY_BYTES ? "http_body_too_large" : "http_body_invalid",
      Number(declared) > MAX_BODY_BYTES ? 413 : 400,
      "Request body is invalid",
    );
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_BODY_BYTES) {
      throw new ConsentControlError("http_body_too_large", 413, "Request body is too large");
    }
    chunks.push(bytes);
  }
  if (size === 0) throw new ConsentControlError("http_body_invalid", 400, "Request body is invalid");
  let value;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
  } catch {
    throw new ConsentControlError("http_body_invalid", 400, "Request body is invalid");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ConsentControlError("http_body_invalid", 400, "Request body is invalid");
  }
  return value;
}

function writeJson(response, statusCode, body, headers = undefined) {
  const payload = JSON.stringify(body);
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(payload),
    "Content-Type": "application/json; charset=utf-8",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });
  response.end(payload);
}

function statusFor(error) {
  if (Number.isInteger(error?.statusCode) && error.statusCode >= 400 && error.statusCode <= 599) {
    return error.statusCode;
  }
  if (
    [
      "consent_decision_race",
      "consent_decision_identity_conflict",
      "consent_session_identity_conflict",
      "consent_session_status_conflict",
      "consent_session_status_race",
    ].includes(error?.code)
  ) {
    return 409;
  }
  return 500;
}

function codeFor(error) {
  return typeof error?.code === "string" && ERROR_CODE_PATTERN.test(error.code)
    ? error.code
    : "consent_internal_error";
}

function digest(value, label) {
  return createHash("sha256").update(requireSecret(value, label), "utf8").digest("base64url");
}

function requireSecret(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    Buffer.byteLength(value, "utf8") > MAX_TOKEN_BYTES ||
    /[^\x21-\x7e]/.test(value)
  ) {
    throw new TypeError(`${label} is invalid`);
  }
  return value;
}

function requireConsentToken(value) {
  if (typeof value !== "string" || !TOKEN_PATTERN.test(value)) {
    throw new ConsentControlError("consent_token_invalid", 403, "Consent token is invalid");
  }
  return value;
}

function requireIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) {
    throw new ConsentControlError("consent_identifier_invalid", 422, `${label} is invalid`);
  }
  return value;
}

function requireOrigin(value, label) {
  if (typeof value !== "string" || Buffer.byteLength(value, "utf8") > 2_048) {
    throw new ConsentControlError("consent_origin_invalid", 422, `${label} is invalid`);
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new ConsentControlError("consent_origin_invalid", 422, `${label} is invalid`);
  }
  if (!(parsed.protocol === "http:" || parsed.protocol === "https:") || parsed.origin !== value || parsed.username || parsed.password) {
    throw new ConsentControlError("consent_origin_invalid", 422, `${label} is invalid`);
  }
  return value;
}

function requireClock(value) {
  if (typeof value !== "function") throw new TypeError("Consent control clock must be a function");
  return value;
}

function readClock(clock) {
  const value = clock();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new TypeError("Consent control clock must return a valid Date");
  }
  return new Date(value.getTime());
}

function requireCreateId(value) {
  if (typeof value !== "function") throw new TypeError("Consent control createId must be a function");
  return value;
}

function requireStore(store) {
  for (const method of [
    "ready",
    "getConsentSessionByChallengeId",
    "getConsentSessionByTokenDigest",
    "createConsentSession",
    "prepareConsentDecision",
    "finalizeConsentSession",
  ]) {
    if (!store || typeof store[method] !== "function") {
      throw new TypeError(`Consent control store is missing ${method}`);
    }
  }
}

function requirePairingControl(control) {
  if (!control || typeof control.resolveHostSubject !== "function") {
    throw new TypeError("Consent control pairingControl is missing resolveHostSubject");
  }
}

function requireReceiver(receiver) {
  if (
    !receiver ||
    typeof receiver.createConsentChallenge !== "function" ||
    typeof receiver.decideConsent !== "function" ||
    typeof receiver.getConsentChallenge !== "function"
  ) {
    throw new TypeError("Consent control Receiver is missing consent methods");
  }
  return receiver;
}

function requireExactRecord(value, allowedFields, requiredFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ConsentControlError("consent_input_invalid", 400, `${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new ConsentControlError("consent_input_invalid", 400, `${label} must be a plain object`);
  }
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key === "symbol" || !descriptor?.enumerable || !("value" in descriptor)) {
      throw new ConsentControlError("consent_input_invalid", 400, `${label} contains an invalid property`);
    }
  }
  const fields = Object.keys(value);
  if (fields.some((field) => !allowedFields.includes(field))) {
    throw new ConsentControlError("consent_input_fields_invalid", 400, `${label} fields are invalid`);
  }
  if (requiredFields.some((field) => !fields.includes(field))) {
    throw new ConsentControlError("consent_input_fields_invalid", 400, `${label} fields are invalid`);
  }
}
