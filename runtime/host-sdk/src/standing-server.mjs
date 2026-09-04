import { createPublicKey } from "node:crypto";

import {
  StandingReentryHostSdk,
} from "@webmcp-challenge/reentry-core/standing-host-sdk";
import {
  createStandingContinuationAcceptance,
  createStandingPublicBinding,
} from "@webmcp-challenge/reentry-core/standing-protocol";
import { STANDING_RECEIVER_HTTP_ROUTES } from "@webmcp-challenge/reentry-core/receiver-http-contract";

export const STANDING_HOST_SDK_CONTROL_ROUTES = Object.freeze({
  hostKeyRegistration: "/v0.2/host-keys",
  consentSession: "/v0.2/consent-sessions",
  accountConsentDecision: "/v0.2/account-consent-decisions",
});

const OPTION_FIELDS = Object.freeze([
  "origin",
  "privateKey",
  "keyId",
  "receiverOrigin",
  "organizationApiKey",
  "requestTimeoutMs",
  "clock",
  "createId",
  "fetchImpl",
]);
const REQUIRED_OPTION_FIELDS = Object.freeze([
  "origin",
  "privateKey",
  "keyId",
  "receiverOrigin",
  "organizationApiKey",
]);
const EVENT_FIELDS = Object.freeze([
  "binding",
  "workflow",
  "eventId",
  "eventSequence",
  "occurredAt",
  "deliveryTimestamp",
]);
const REQUEST_TIMEOUT_MIN = 100;
const REQUEST_TIMEOUT_MAX = 60_000;
const DEFAULT_REQUEST_TIMEOUT = 5_000;
const MAX_RESPONSE_BYTES = 32 * 1_024;
const JSON_TYPE = "application/json";
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export class StandingHostSdkError extends Error {
  constructor(code, message, { statusCode, cause } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "StandingHostSdkError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Server-only v0.2 standing Host wrapper. It keeps the private signing key
 * and organization API key out of browser code while exposing only the exact
 * Host controls and signed Event submission needed by the Game integration.
 */
export function createStandingHostSdk(options) {
  requireExactRecord(options, OPTION_FIELDS, REQUIRED_OPTION_FIELDS, "Standing Host SDK options");
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") throw new TypeError("Standing Host SDK requires fetch or fetchImpl");
  const receiverOrigin = requireReceiverOrigin(options.receiverOrigin);
  const organizationApiKey = requireOpaqueToken(options.organizationApiKey, "organizationApiKey");
  const requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT;
  requireTimeout(requestTimeoutMs);
  const signer = new StandingReentryHostSdk({
    origin: options.origin,
    privateKey: options.privateKey,
    keyId: options.keyId,
    ...(options.clock === undefined ? {} : { clock: options.clock }),
    ...(options.createId === undefined ? {} : { createId: options.createId }),
  });

  return Object.freeze({
    protocolVersion: "0.2",

    createManifest(input) {
      return signer.issueManifest(input);
    },

    createEvent(input) {
      requireExactRecord(input, EVENT_FIELDS, ["binding", "workflow", "eventId", "eventSequence", "occurredAt"], "Standing Event input");
      return signer.issueEvent(input);
    },

    async sendEvent(input) {
      requireExactRecord(input, EVENT_FIELDS, ["binding", "workflow", "eventId", "eventSequence", "occurredAt"], "Standing Event input");
      const issued = signer.issueEvent(input);
      const response = await postJson({
        receiverOrigin,
        path: STANDING_RECEIVER_HTTP_ROUTES.event,
        body: { body: issued.body, headers: issued.headers },
        acceptedStatuses: [202],
        fetchImpl,
        requestTimeoutMs,
        authorization: null,
      });
      try {
        return createStandingContinuationAcceptance(response);
      } catch (error) {
        throw new StandingHostSdkError("host_sdk_response_invalid", "Receiver returned an invalid standing Event acceptance", { statusCode: 202, cause: error });
      }
    },

    async registerHostKey(input) {
      requireExactRecord(input, ["hostId"], ["hostId"], "Standing Host key input");
      const publicKeyPem = exportHostPublicKey(options.privateKey);
      const response = await postJson({
        receiverOrigin,
        path: STANDING_HOST_SDK_CONTROL_ROUTES.hostKeyRegistration,
        body: {
          host_id: requireIdentifier(input.hostId, "hostId"),
          issuer_origin: options.origin,
          key_id: requireIdentifier(options.keyId, "keyId"),
          public_key_pem: publicKeyPem,
        },
        acceptedStatuses: [200, 201],
        fetchImpl,
        requestTimeoutMs,
        authorization: organizationApiKey,
      });
      return validateHostKeyResponse(response);
    },

    async createConsentSession(input) {
      requireExactRecord(input, ["hostSubjectRef", "manifest", "maximumGrantLifetimeMs"], ["hostSubjectRef", "manifest", "maximumGrantLifetimeMs"], "Standing Consent session input");
      if (typeof input.hostSubjectRef !== "string" || input.hostSubjectRef.length === 0 || input.hostSubjectRef.trim() !== input.hostSubjectRef) throw new TypeError("Standing hostSubjectRef is invalid");
      if (!Number.isSafeInteger(input.maximumGrantLifetimeMs) || input.maximumGrantLifetimeMs < 1_000 || input.maximumGrantLifetimeMs > 365 * 24 * 60 * 60 * 1_000) throw new TypeError("Standing maximumGrantLifetimeMs is invalid");
      const response = await postJson({
        receiverOrigin,
        path: STANDING_HOST_SDK_CONTROL_ROUTES.consentSession,
        body: {
          host_subject_ref: input.hostSubjectRef,
          expected_origin: options.origin,
          manifest: input.manifest,
          maximum_grant_lifetime_ms: input.maximumGrantLifetimeMs,
        },
        acceptedStatuses: [200, 201],
        fetchImpl,
        requestTimeoutMs,
        authorization: organizationApiKey,
      });
      return validateConsentSessionResponse(response, receiverOrigin);
    },

    async getConsentSession(input) {
      requireExactRecord(input, ["consentSessionId"], ["consentSessionId"], "Standing Consent status input");
      const id = requireIdentifier(input.consentSessionId, "consentSessionId");
      const response = await getJson({
        receiverOrigin,
        path: `${STANDING_HOST_SDK_CONTROL_ROUTES.consentSession}/${encodeURIComponent(id)}`,
        acceptedStatuses: [200],
        fetchImpl,
        requestTimeoutMs,
        authorization: organizationApiKey,
      });
      return validateConsentStatusResponse(response);
    },
  });
}

async function postJson({ receiverOrigin, path, body, acceptedStatuses, fetchImpl, requestTimeoutMs, authorization }) {
  let payload;
  try {
    payload = JSON.stringify(body);
  } catch (error) {
    throw new StandingHostSdkError("host_sdk_request_invalid", "Standing request could not be serialized", { cause: error });
  }
  let response;
  try {
    response = await fetchImpl(`${receiverOrigin}${path}`, {
      method: "POST",
      headers: {
        Accept: JSON_TYPE,
        "Content-Type": JSON_TYPE,
        ...(authorization === null ? {} : { Authorization: `Bearer ${authorization}` }),
      },
      body: payload,
      cache: "no-store",
      credentials: "omit",
      redirect: "manual",
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
  } catch (error) {
    throw transportError(error);
  }
  return readResponse(response, acceptedStatuses, "Receiver rejected the standing Host request");
}

async function getJson({ receiverOrigin, path, acceptedStatuses, fetchImpl, requestTimeoutMs, authorization }) {
  let response;
  try {
    response = await fetchImpl(`${receiverOrigin}${path}`, {
      method: "GET",
      headers: { Accept: JSON_TYPE, Authorization: `Bearer ${authorization}` },
      cache: "no-store",
      credentials: "omit",
      redirect: "manual",
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
  } catch (error) {
    throw transportError(error);
  }
  return readResponse(response, acceptedStatuses, "Receiver rejected the standing Host request");
}

async function readResponse(response, acceptedStatuses, rejectionMessage) {
  if (response.status >= 300 && response.status <= 399) {
    await response.body?.cancel?.();
    throw new StandingHostSdkError("host_sdk_redirect_rejected", "Standing Host SDK does not follow Receiver redirects", { statusCode: response.status });
  }
  if (!acceptedStatuses.includes(response.status)) {
    const code = await readErrorCode(response);
    throw new StandingHostSdkError(code, rejectionMessage, { statusCode: response.status });
  }
  let text;
  try {
    text = await response.text();
  } catch (error) {
    throw new StandingHostSdkError("host_sdk_response_invalid", "Receiver response could not be read", { statusCode: response.status, cause: error });
  }
  if (Buffer.byteLength(text, "utf8") > MAX_RESPONSE_BYTES) throw new StandingHostSdkError("host_sdk_response_too_large", "Receiver response exceeded the SDK limit", { statusCode: response.status });
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new StandingHostSdkError("host_sdk_response_invalid", "Receiver response was not valid JSON", { statusCode: response.status, cause: error });
  }
}

async function readErrorCode(response) {
  try {
    const value = await response.json();
    const code = value?.error?.code;
    return typeof code === "string" && /^[a-z][a-z0-9_]{0,95}$/.test(code) ? code : "host_sdk_receiver_error";
  } catch {
    return "host_sdk_receiver_error";
  }
}

function transportError(error) {
  if (error?.name === "TimeoutError" || error?.name === "AbortError") return new StandingHostSdkError("host_sdk_request_timeout", "Standing Host SDK request timed out", { cause: error });
  return new StandingHostSdkError("host_sdk_network_error", "Standing Host SDK request failed", { cause: error });
}

function validateHostKeyResponse(value) {
  try {
    requireExactRecord(value, ["type", "protocol_version", "host_id", "issuer_origin", "key_id", "status", "duplicate"], ["type", "protocol_version", "host_id", "issuer_origin", "key_id", "status", "duplicate"], "Standing Host key response");
    if (value.type !== "webmcp.reentry_host_key" || value.protocol_version !== "0.2" || value.status !== "active" || typeof value.duplicate !== "boolean") throw new Error("invalid standing Host key response");
    requireIdentifier(value.host_id, "host_id"); requireIdentifier(value.key_id, "key_id");
    return Object.freeze({ ...value });
  } catch (error) {
    throw invalidResponse("Receiver returned an invalid standing Host key response", error);
  }
}

function validateConsentSessionResponse(value, receiverOrigin) {
  try {
    requireExactRecord(value, ["type", "protocol_version", "consent_session_id", "challenge", "consent_url", "expires_at", "duplicate"], ["type", "protocol_version", "consent_session_id", "challenge", "consent_url", "expires_at", "duplicate"], "Standing Consent session response");
    if (value.type !== "webmcp.reentry_consent_session" || value.protocol_version !== "0.2" || typeof value.duplicate !== "boolean") throw new Error("invalid standing Consent response");
    requireIdentifier(value.consent_session_id, "consent_session_id");
    requireTimestamp(value.expires_at, "expires_at");
    requireConsentUrl(value.consent_url, receiverOrigin);
    if (!value.challenge || typeof value.challenge !== "object" || Array.isArray(value.challenge)) throw new Error("invalid standing Consent challenge");
    return Object.freeze({ ...value });
  } catch (error) {
    throw invalidResponse("Receiver returned an invalid standing Consent session response", error);
  }
}

function validateConsentStatusResponse(value) {
  try {
    requireExactRecord(value, ["type", "protocol_version", "consent_session_id", "challenge_id", "status", "effective_status", "expires_at", "binding"], ["type", "protocol_version", "consent_session_id", "challenge_id", "status", "effective_status", "expires_at", "binding"], "Standing Consent status response");
    if (value.type !== "webmcp.reentry_consent_status" || value.protocol_version !== "0.2" || !["pending", "approved", "declined", "expired"].includes(value.status) || ![null, "active", "revoked", "expired"].includes(value.effective_status)) throw new Error("invalid standing Consent status");
    requireIdentifier(value.consent_session_id, "consent_session_id"); requireIdentifier(value.challenge_id, "challenge_id"); requireTimestamp(value.expires_at, "expires_at");
    if (value.binding !== null) createStandingPublicBinding(value.binding);
    return Object.freeze({ ...value });
  } catch (error) {
    throw invalidResponse("Receiver returned an invalid standing Consent status", error);
  }
}

function invalidResponse(message, cause) {
  if (cause instanceof StandingHostSdkError && cause.code === "host_sdk_response_invalid") return cause;
  return new StandingHostSdkError("host_sdk_response_invalid", message, { cause });
}

function requireConsentUrl(value, receiverOrigin) {
  if (typeof value !== "string") throw new StandingHostSdkError("host_sdk_response_invalid", "Standing Consent URL is invalid");
  let url;
  try { url = new URL(value); } catch { throw new StandingHostSdkError("host_sdk_response_invalid", "Standing Consent URL is invalid"); }
  if (url.origin !== receiverOrigin || url.pathname !== "/consent" || url.hash || url.searchParams.getAll("token").length !== 1 || [...url.searchParams.keys()].some((key) => key !== "token") || !TOKEN_PATTERN.test(url.searchParams.get("token") ?? "") || url.href !== value) throw new StandingHostSdkError("host_sdk_response_invalid", "Standing Consent URL is invalid");
}

function requireTimestamp(value, label) {
  if (typeof value !== "string" || value.length > 27 || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) throw new StandingHostSdkError("host_sdk_response_invalid", `Standing ${label} is invalid`);
}

function exportHostPublicKey(privateKey) {
  let publicKey;
  try { publicKey = createPublicKey(privateKey); } catch (error) { throw new TypeError("Standing Host SDK privateKey must be a valid signing key", { cause: error }); }
  if (publicKey.asymmetricKeyType !== "ed25519") throw new TypeError("Standing Host SDK privateKey must be an Ed25519 key");
  return publicKey.export({ type: "spki", format: "pem" }).toString();
}

function requireReceiverOrigin(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 2_048) throw new TypeError("Standing Receiver origin is invalid");
  let parsed; try { parsed = new URL(value); } catch { throw new TypeError("Standing Receiver origin is invalid"); }
  const loopback = ["127.0.0.1", "[::1]", "::1"].includes(parsed.hostname);
  if (!["http:", "https:"].includes(parsed.protocol) || (parsed.protocol === "http:" && !loopback) || parsed.origin !== value || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) throw new TypeError("Standing Receiver origin is invalid");
  return value;
}

function requireOpaqueToken(value, label) {
  if (typeof value !== "string" || value.length === 0 || Buffer.byteLength(value, "utf8") > 4 * 1_024 || /[^\x21-\x7e]/.test(value)) throw new TypeError(`Standing ${label} is invalid`);
  return value;
}

function requireIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) throw new TypeError(`Standing ${label} is invalid`);
  return value;
}

function requireTimeout(value) {
  if (!Number.isSafeInteger(value) || value < REQUEST_TIMEOUT_MIN || value > REQUEST_TIMEOUT_MAX) throw new TypeError("Standing requestTimeoutMs is invalid");
}

function requireExactRecord(value, allowedFields, requiredFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== "string" || !descriptor?.enumerable || !("value" in descriptor)) throw new TypeError(`${label} contains an invalid property`);
  }
  const fields = Object.keys(value).sort();
  const allowed = [...allowedFields].sort();
  if (fields.some((field) => !allowed.includes(field)) || requiredFields.some((field) => !fields.includes(field))) throw new TypeError(`${label} fields are invalid`);
}
