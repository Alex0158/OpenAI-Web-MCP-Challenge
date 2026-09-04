import { TextDecoder } from "node:util";

import {
  PROTOCOL_LIMITS,
  PROTOCOL_VERSION,
  canonicalJson,
  validateContinuationReceipt,
} from "./protocol.mjs";
import {
  STANDING_PROTOCOL_VERSION,
  validateStandingContinuationReceipt,
} from "./standing-protocol.mjs";
import {
  DELIVERY_ACKNOWLEDGEMENT_TYPE,
  DELIVERY_LEASE_TYPE,
} from "./receiver-delivery.mjs";
import {
  RECEIVER_HTTP_CONTENT_TYPE,
  RECEIVER_HTTP_LIMITS,
  RECEIVER_HTTP_ROUTES,
  STANDING_RECEIVER_HTTP_ROUTES,
} from "./receiver-http-contract.mjs";
import {
  validateNotificationHandoffReceipt,
  validateRuntimeAdmissionAttestation,
} from "./notification-handoff.mjs";

const CLIENT_OPTION_FIELDS = Object.freeze([
  "baseUrl",
  "connectorToken",
  "requestTimeoutMs",
  "protocolVersion",
]);
const REQUIRED_CLIENT_OPTION_FIELDS = Object.freeze([
  "baseUrl",
  "connectorToken",
  "requestTimeoutMs",
]);
const CLAIM_INPUT_FIELDS = Object.freeze(["claimToken"]);
const ACKNOWLEDGEMENT_INPUT_FIELDS = Object.freeze([
  "deliveryId",
  "leaseToken",
  "effectToken",
]);
const NOTIFICATION_HANDOFF_INPUT_FIELDS = Object.freeze([
  "deliveryId",
  "eventId",
  "leaseToken",
  "handoffId",
  "runtimeAdmissionAttestation",
]);
const CLAIM_RESULT_FIELDS = Object.freeze(["duplicate", "lease"]);
const LEASE_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "delivery_id",
  "event_id",
  "attempt",
  "lease_token",
  "lease_expires_at",
  "continuation",
  "receipt",
]);
const CONTINUATION_FIELDS = Object.freeze([
  "correlation_id",
  "workflow_id",
  "event_type",
  "event_sequence",
  "state_version",
  "occurred_at",
  "canonical_url",
  "instruction",
]);
const ACKNOWLEDGEMENT_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "delivery_id",
  "event_id",
  "effect_id",
  "acknowledged",
  "duplicate",
  "status",
]);
const ERROR_RESPONSE_FIELDS = Object.freeze(["error"]);
const ERROR_FIELDS = Object.freeze(["code"]);
const RETRYABLE_ERROR_FIELDS = Object.freeze(["code", "retryable"]);
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const ERROR_CODE_PATTERN = /^[a-z][a-z0-9_]{0,95}$/;
const CLAIM_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const CONTENT_TYPE_PATTERN = /^application\/json(?:\s*;\s*charset=utf-8)?$/i;
const MAX_OPAQUE_TOKEN_BYTES = 4 * 1_024;
const MIN_REQUEST_TIMEOUT_MS = 100;
const MAX_REQUEST_TIMEOUT_MS = 60 * 1_000;
const PROTOCOL_PROFILES = Object.freeze({
  [PROTOCOL_VERSION]: Object.freeze({
    protocolVersion: PROTOCOL_VERSION,
    routes: RECEIVER_HTTP_ROUTES,
    validateReceipt: validateContinuationReceipt,
    validateSequence(value) {
      return value === 1;
    },
    supportsRetryableError: false,
  }),
  [STANDING_PROTOCOL_VERSION]: Object.freeze({
    protocolVersion: STANDING_PROTOCOL_VERSION,
    routes: STANDING_RECEIVER_HTTP_ROUTES,
    validateReceipt: validateStandingContinuationReceipt,
    validateSequence(value) {
      return Number.isSafeInteger(value) && value > 0;
    },
    supportsRetryableError: true,
  }),
});

export class LocalConnectorClient {
  #baseUrl;
  #connectorToken;
  #requestTimeoutMs;
  #protocolProfile;

  constructor(options) {
    requireClientInput(
      options,
      CLIENT_OPTION_FIELDS,
      "Local Connector client options",
      REQUIRED_CLIENT_OPTION_FIELDS,
    );
    this.#baseUrl = requireReceiverOrigin(options.baseUrl);
    this.#connectorToken = requireOpaqueToken(
      options.connectorToken,
      "Connector token",
      "connector_token_invalid",
    );
    if (
      !Number.isSafeInteger(options.requestTimeoutMs) ||
      options.requestTimeoutMs < MIN_REQUEST_TIMEOUT_MS ||
      options.requestTimeoutMs > MAX_REQUEST_TIMEOUT_MS
    ) {
      throw clientFailure(
        "connector_timeout_invalid",
        "Local Connector requestTimeoutMs must be between 100 and 60000",
      );
    }
    if (typeof globalThis.fetch !== "function") {
      throw new TypeError("Local Connector client requires platform fetch");
    }
    this.#requestTimeoutMs = options.requestTimeoutMs;
    this.#protocolProfile = requireProtocolProfile(
      options.protocolVersion === undefined ? PROTOCOL_VERSION : options.protocolVersion,
    );
  }

  get protocolVersion() {
    return this.#protocolProfile.protocolVersion;
  }

  async claimDelivery(input) {
    requireClientInput(input, CLAIM_INPUT_FIELDS, "Delivery claim input");
    const claimToken = requireClaimToken(input.claimToken, "Delivery claim token");
    const response = await this.#post(this.#protocolProfile.routes.claim, {
      connector_token: this.#connectorToken,
      claim_token: claimToken,
    });
    if (response.status === 204) {
      await requireEmptyResponse(response);
      return null;
    }
    if (response.status !== 200) {
      throw await parseHttpFailure(response, this.#protocolProfile);
    }
    const value = await parseCanonicalJsonResponse(response);
    return normalizeClaimResult(value, claimToken, Date.now(), this.#protocolProfile);
  }

  async acknowledgeDelivery(input) {
    requireClientInput(input, ACKNOWLEDGEMENT_INPUT_FIELDS, "Delivery acknowledgement input");
    const deliveryId = requireIdentifier(
      input.deliveryId,
      "deliveryId",
      "connector_input_invalid",
    );
    const leaseToken = requireClaimToken(input.leaseToken, "Delivery lease token");
    const effectToken = requireOpaqueToken(
      input.effectToken,
      "Host-effect token",
      "host_effect_token_invalid",
    );
    const response = await this.#post(this.#protocolProfile.routes.acknowledgement, {
      connector_token: this.#connectorToken,
      delivery_id: deliveryId,
      lease_token: leaseToken,
      effect_token: effectToken,
    });
    if (response.status !== 200) {
      throw await parseHttpFailure(response, this.#protocolProfile);
    }
    const value = await parseCanonicalJsonResponse(response);
    return normalizeAcknowledgement(value, deliveryId, this.#protocolProfile);
  }

  async handoffNotification(input) {
    requireClientInput(
      input,
      NOTIFICATION_HANDOFF_INPUT_FIELDS,
      "Notification handoff input",
    );
    if (this.#protocolProfile.protocolVersion !== STANDING_PROTOCOL_VERSION) {
      throw clientFailure(
        "connector_protocol_version_unsupported",
        "Notification handoff requires standing protocol v0.2",
      );
    }
    const deliveryId = requireIdentifier(
      input.deliveryId,
      "deliveryId",
      "connector_input_invalid",
    );
    const eventId = requireIdentifier(
      input.eventId,
      "eventId",
      "connector_input_invalid",
    );
    const leaseToken = requireClaimToken(input.leaseToken, "Delivery lease token");
    const handoffId = requireIdentifier(
      input.handoffId,
      "handoffId",
      "connector_input_invalid",
    );
    let runtimeAdmissionAttestation;
    try {
      runtimeAdmissionAttestation = validateRuntimeAdmissionAttestation(
        input.runtimeAdmissionAttestation,
        { deliveryId, eventId, handoffId },
      );
    } catch (error) {
      throw clientFailure(
        "connector_input_invalid",
        "Runtime admission attestation is invalid",
        undefined,
        error,
      );
    }
    const response = await this.#post(this.#protocolProfile.routes.handoff, {
      connector_token: this.#connectorToken,
      delivery_id: deliveryId,
      lease_token: leaseToken,
      handoff_id: handoffId,
      runtime_admission_attestation: runtimeAdmissionAttestation,
    });
    if (response.status !== 200) {
      throw await parseHttpFailure(response, this.#protocolProfile);
    }
    const value = await parseCanonicalJsonResponse(response);
    try {
      return validateNotificationHandoffReceipt(value, {
        deliveryId,
        eventId,
        handoffId,
      });
    } catch (error) {
      if (error instanceof ConnectorTransportError) throw error;
      throw invalidResponse(error);
    }
  }

  async #post(path, body) {
    const target = `${this.#baseUrl}${path}`;
    let response;
    try {
      response = await globalThis.fetch(target, {
        method: "POST",
        headers: {
          Accept: RECEIVER_HTTP_CONTENT_TYPE,
          "Content-Type": RECEIVER_HTTP_CONTENT_TYPE,
        },
        body: canonicalJson(body),
        cache: "no-store",
        credentials: "omit",
        redirect: "manual",
        signal: AbortSignal.timeout(this.#requestTimeoutMs),
      });
    } catch (error) {
      if (error?.name === "TimeoutError" || error?.name === "AbortError") {
        throw clientFailure(
          "connector_request_timeout",
          "Local Connector request timed out",
          undefined,
          error,
        );
      }
      throw clientFailure(
        "connector_network_error",
        "Local Connector request failed",
        undefined,
        error,
      );
    }
    if (response.status >= 300 && response.status <= 399) {
      try {
        await response.body?.cancel();
      } catch {
        // Redirect rejection is authoritative even if the response body cannot be cancelled.
      }
      throw clientFailure(
        "connector_redirect_rejected",
        "Local Connector does not follow redirects",
        response.status,
      );
    }
    return response;
  }
}

export class ConnectorTransportError extends Error {
  constructor(code, message, { statusCode, retryable, cause } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ConnectorTransportError";
    this.code = code;
    this.statusCode = statusCode;
    if (retryable !== undefined) this.retryable = retryable;
  }
}

function requireClientInput(value, allowedFields, label, requiredFields = allowedFields) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw clientFailure("connector_input_invalid", `${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw clientFailure("connector_input_invalid", `${label} must be a plain object`);
  }
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key === "symbol" || !descriptor?.enumerable || !("value" in descriptor)) {
      throw clientFailure("connector_input_invalid", `${label} contains an invalid property`);
    }
  }
  const actual = Object.keys(value).sort();
  if (
    actual.some((field) => !allowedFields.includes(field)) ||
    requiredFields.some((field) => !actual.includes(field))
  ) {
    throw clientFailure("connector_input_invalid", `${label} fields are invalid`);
  }
}

function requireProtocolProfile(value) {
  const profile = typeof value === "string" && Object.hasOwn(PROTOCOL_PROFILES, value)
    ? PROTOCOL_PROFILES[value]
    : undefined;
  if (!profile) {
    throw clientFailure(
      "connector_protocol_version_unsupported",
      "Local Connector protocol version is unsupported",
    );
  }
  return profile;
}

function requireReceiverOrigin(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 2_048) {
    throw clientFailure("connector_origin_invalid", "Receiver origin is invalid");
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw clientFailure("connector_origin_invalid", "Receiver origin is invalid");
  }
  const loopback = ["127.0.0.1", "[::1]", "::1"].includes(parsed.hostname);
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    (parsed.protocol === "http:" && !loopback) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    parsed.origin !== value
  ) {
    throw clientFailure("connector_origin_invalid", "Receiver origin is invalid");
  }
  return value;
}

function requireOpaqueToken(value, label, code) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    Buffer.byteLength(value, "utf8") > MAX_OPAQUE_TOKEN_BYTES ||
    /[^\x21-\x7e]/.test(value)
  ) {
    throw clientFailure(code, `${label} is invalid`);
  }
  return value;
}

function requireClaimToken(value, label) {
  if (typeof value !== "string" || !CLAIM_TOKEN_PATTERN.test(value)) {
    throw clientFailure("delivery_claim_token_invalid", `${label} is invalid`);
  }
  const decoded = Buffer.from(value, "base64url");
  if (decoded.length !== 32 || decoded.toString("base64url") !== value) {
    throw clientFailure("delivery_claim_token_invalid", `${label} is invalid`);
  }
  return value;
}

function requireIdentifier(value, label, code = "connector_response_invalid") {
  if (
    typeof value !== "string" ||
    Buffer.byteLength(value, "utf8") > 160 ||
    !IDENTIFIER_PATTERN.test(value)
  ) {
    throw clientFailure(code, `${label} is invalid`);
  }
  return value;
}

function normalizeClaimResult(value, expectedToken, nowMs, profile) {
  try {
    requireResponseRecord(value, CLAIM_RESULT_FIELDS);
    if (typeof value.duplicate !== "boolean") throw invalidResponse();
    requireResponseRecord(value.lease, LEASE_FIELDS);
    const lease = value.lease;
    if (
      lease.type !== DELIVERY_LEASE_TYPE ||
      lease.protocol_version !== profile.protocolVersion ||
      lease.lease_token !== expectedToken ||
      !Number.isSafeInteger(lease.attempt) ||
      lease.attempt < 1 ||
      lease.attempt > 100
    ) {
      throw invalidResponse();
    }
    const leaseExpiresAt = requireTimestamp(lease.lease_expires_at);
    if (leaseExpiresAt <= nowMs) throw invalidResponse();
    const receipt = profile.validateReceipt(lease.receipt);
    if (leaseExpiresAt > Date.parse(receipt.expires_at)) throw invalidResponse();
    const continuation = normalizeContinuation(lease.continuation, profile);
    if (
      continuation.correlation_id !== receipt.correlation_id ||
      continuation.workflow_id !== receipt.workflow_id ||
      continuation.event_type !== receipt.event_type ||
      continuation.canonical_url !== receipt.canonical_url
    ) {
      throw invalidResponse();
    }
    return deepFreeze({
      duplicate: value.duplicate,
      lease: {
        type: DELIVERY_LEASE_TYPE,
        protocol_version: profile.protocolVersion,
        delivery_id: requireIdentifier(lease.delivery_id, "lease delivery_id"),
        event_id: requireIdentifier(lease.event_id, "lease event_id"),
        attempt: lease.attempt,
        lease_token: expectedToken,
        lease_expires_at: lease.lease_expires_at,
        continuation,
        receipt,
      },
    });
  } catch (error) {
    if (error instanceof ConnectorTransportError) throw error;
    throw invalidResponse(error);
  }
}

function normalizeContinuation(value, profile) {
  requireResponseRecord(value, CONTINUATION_FIELDS);
  if (
    !profile.validateSequence(value.event_sequence) ||
    !Number.isSafeInteger(value.state_version) ||
    value.state_version < 0
  ) {
    throw invalidResponse();
  }
  requireTimestamp(value.occurred_at);
  return {
    correlation_id: requireIdentifier(value.correlation_id, "continuation correlation_id"),
    workflow_id: requireIdentifier(value.workflow_id, "continuation workflow_id"),
    event_type: requireIdentifier(value.event_type, "continuation event_type"),
    event_sequence: value.event_sequence,
    state_version: value.state_version,
    occurred_at: value.occurred_at,
    canonical_url: value.canonical_url,
    instruction: requireInstruction(value.instruction),
  };
}

function requireInstruction(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.trim() !== value ||
    CONTROL_CHARACTER_PATTERN.test(value) ||
    Buffer.byteLength(value, "utf8") > PROTOCOL_LIMITS.displayReasonBytes
  ) {
    throw invalidResponse();
  }
  return value;
}

function normalizeAcknowledgement(value, expectedDeliveryId, profile) {
  try {
    requireResponseRecord(value, ACKNOWLEDGEMENT_FIELDS);
    if (
      value.type !== DELIVERY_ACKNOWLEDGEMENT_TYPE ||
      value.protocol_version !== profile.protocolVersion ||
      value.delivery_id !== expectedDeliveryId ||
      value.acknowledged !== true ||
      typeof value.duplicate !== "boolean" ||
      value.status !== "acknowledged"
    ) {
      throw invalidResponse();
    }
    return deepFreeze({
      type: DELIVERY_ACKNOWLEDGEMENT_TYPE,
      protocol_version: profile.protocolVersion,
      delivery_id: requireIdentifier(value.delivery_id, "acknowledgement delivery_id"),
      event_id: requireIdentifier(value.event_id, "acknowledgement event_id"),
      effect_id: requireIdentifier(value.effect_id, "acknowledgement effect_id"),
      acknowledged: true,
      duplicate: value.duplicate,
      status: "acknowledged",
    });
  } catch (error) {
    if (error instanceof ConnectorTransportError) throw error;
    throw invalidResponse(error);
  }
}

function requireResponseRecord(value, expectedFields) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw invalidResponse();
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw invalidResponse();
  const actual = Object.keys(value).sort();
  const expected = [...expectedFields].sort();
  if (
    actual.length !== expected.length ||
    actual.some((field, index) => field !== expected[index])
  ) {
    throw invalidResponse();
  }
}

function requireTimestamp(value) {
  if (typeof value !== "string" || value.length > 27) throw invalidResponse();
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    throw invalidResponse();
  }
  return parsed;
}

async function requireEmptyResponse(response) {
  const body = await readBoundedBody(response);
  if (body.length !== 0 || response.headers.has("content-type")) {
    throw invalidResponse();
  }
}

async function parseCanonicalJsonResponse(response) {
  const contentType = response.headers.get("content-type");
  if (contentType === null || !CONTENT_TYPE_PATTERN.test(contentType)) {
    throw invalidResponse();
  }
  const body = await readBoundedBody(response);
  if (body.length === 0) throw invalidResponse();
  let value;
  try {
    value = JSON.parse(body);
    if (canonicalJson(value) !== body) throw invalidResponse();
  } catch (error) {
    if (error instanceof ConnectorTransportError) throw error;
    throw invalidResponse(error);
  }
  return value;
}

async function parseHttpFailure(response, profile) {
  try {
    const value = await parseCanonicalJsonResponse(response);
    requireResponseRecord(value, ERROR_RESPONSE_FIELDS);
    const errorFields = profile.supportsRetryableError
      ? RETRYABLE_ERROR_FIELDS
      : ERROR_FIELDS;
    requireResponseRecord(value.error, errorFields);
    if (typeof value.error.code !== "string" || !ERROR_CODE_PATTERN.test(value.error.code)) {
      throw invalidResponse();
    }
    const retryable = profile.supportsRetryableError ? value.error.retryable : undefined;
    if (
      retryable !== undefined &&
      (!profile.supportsRetryableError || typeof retryable !== "boolean")
    ) {
      throw invalidResponse();
    }
    return clientFailure(
      value.error.code,
      "Cloud Receiver rejected the Local Connector request",
      response.status,
      undefined,
      retryable,
    );
  } catch (error) {
    if (error instanceof ConnectorTransportError && error.code !== "connector_response_invalid") {
      return error;
    }
    return clientFailure(
      "connector_http_error",
      "Cloud Receiver returned an invalid error response",
      response.status,
      error,
    );
  }
}

async function readBoundedBody(response) {
  const declared = response.headers.get("content-length");
  if (declared !== null) {
    if (!/^(?:0|[1-9][0-9]*)$/.test(declared)) throw invalidResponse();
    if (Number(declared) > RECEIVER_HTTP_LIMITS.responseBytes) {
      await response.body?.cancel();
      throw clientFailure(
        "connector_response_too_large",
        "Cloud Receiver response is too large",
        response.status,
      );
    }
  }
  if (response.body === null) return "";

  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = Buffer.from(value);
      size += chunk.length;
      if (size > RECEIVER_HTTP_LIMITS.responseBytes) {
        await reader.cancel();
        throw clientFailure(
          "connector_response_too_large",
          "Cloud Receiver response is too large",
          response.status,
        );
      }
      chunks.push(chunk);
    }
  } catch (error) {
    if (error instanceof ConnectorTransportError) throw error;
    throw clientFailure(
      "connector_network_error",
      "Cloud Receiver response stream failed",
      response.status,
      error,
    );
  } finally {
    reader.releaseLock();
  }
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      Buffer.concat(chunks),
    );
  } catch (error) {
    throw invalidResponse(error);
  }
}

function invalidResponse(cause) {
  return clientFailure(
    "connector_response_invalid",
    "Cloud Receiver response is invalid",
    undefined,
    cause,
  );
}

function clientFailure(code, message, statusCode, cause, retryable) {
  return new ConnectorTransportError(code, message, { statusCode, cause, retryable });
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
