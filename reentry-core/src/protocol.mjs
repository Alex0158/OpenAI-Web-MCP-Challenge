import {
  KeyObject,
  createPrivateKey,
  createPublicKey,
  sign as signBytes,
  verify as verifyBytes,
} from "node:crypto";

export const PROTOCOL_VERSION = "0.1";
export const MANIFEST_TYPE = "webmcp.reentry_manifest";
export const EVENT_TYPE = "webmcp.continuation_event";
export const PUBLIC_BINDING_TYPE = "webmcp.reentry_binding";
export const RECEIPT_TYPE = "webmcp.continuation_receipt";
export const ACCEPTANCE_TYPE = "webmcp.continuation_acceptance";
export const SIGNATURE_ALGORITHM = "Ed25519";
export const CONTINUATION_MODE = "open_canonical_page_read_current_state";

export const REENTRY_HEADER_NAMES = Object.freeze({
  keyId: "WebMCP-Reentry-Key-Id",
  timestamp: "WebMCP-Reentry-Timestamp",
  signature: "WebMCP-Reentry-Signature",
});

export const PROTOCOL_LIMITS = Object.freeze({
  identifierBytes: 160,
  canonicalUrlBytes: 2_048,
  displayTitleBytes: 120,
  displayReasonBytes: 500,
  manifestBytes: 16 * 1_024,
  eventBodyBytes: 8 * 1_024,
  receiptBytes: 8 * 1_024,
  manifestFutureSkewMs: 60 * 1_000,
  eventFutureSkewMs: 60 * 1_000,
  deliveryClockSkewMs: 5 * 60 * 1_000,
});

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const MAX_TIMESTAMP_CHARACTERS = 27;
const MAX_EPOCH_SECONDS_CHARACTERS = 16;
const ED25519_SIGNATURE_CHARACTERS = 86;

const MANIFEST_UNSIGNED_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "manifest_id",
  "correlation_id",
  "issuer_origin",
  "issued_at",
  "offer_expires_at",
  "workflow",
  "display",
  "grant_request",
]);
const MANIFEST_FIELDS = Object.freeze([...MANIFEST_UNSIGNED_FIELDS, "signature"]);
const WORKFLOW_FIELDS = Object.freeze(["id", "type", "state_version", "canonical_url"]);
const DISPLAY_FIELDS = Object.freeze(["title", "reason"]);
const GRANT_REQUEST_FIELDS = Object.freeze([
  "event_type",
  "grant_expires_at",
  "max_runs",
  "human_boundary",
]);
const SIGNATURE_FIELDS = Object.freeze(["algorithm", "key_id", "value"]);
const EVENT_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "event_id",
  "correlation_id",
  "binding_id",
  "issuer_origin",
  "workflow_id",
  "event_type",
  "event_sequence",
  "state_version",
  "occurred_at",
  "canonical_url",
]);
const PUBLIC_BINDING_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "binding_id",
  "correlation_id",
  "workflow_id",
  "event_type",
  "expires_at",
  "runs_remaining",
  "status",
]);
const RECEIPT_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "grant_id",
  "correlation_id",
  "issuer_origin",
  "workflow_id",
  "event_type",
  "canonical_url",
  "expires_at",
  "human_boundary",
  "continuation_mode",
]);
const ACCEPTANCE_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "event_id",
  "correlation_id",
  "accepted",
  "duplicate",
  "status",
]);
const ENVELOPE_FIELDS = Object.freeze(["body", "headers"]);
const ENVELOPE_HEADER_FIELDS = Object.freeze(Object.values(REENTRY_HEADER_NAMES));

export class ProtocolValidationError extends Error {
  constructor(code, message, statusCode = 422) {
    super(message);
    this.name = "ProtocolValidationError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ProtocolAuthenticationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ProtocolAuthenticationError";
    this.code = code;
    this.statusCode = 401;
  }
}

export function canonicalJson(value) {
  return serializeCanonical(value, new Set());
}

export function createReentryManifest(value, { privateKey, keyId }) {
  const unsigned = normalizeManifest(value, false);
  assertManifestTimeOrder(unsigned);
  const key = requireEd25519PrivateKey(privateKey);
  const normalizedKeyId = requireIdentifier(keyId, "signature key_id");
  const signature = signBytes(null, Buffer.from(canonicalJson(unsigned), "utf8"), key)
    .toString("base64url");
  const manifest = normalizeManifest({
    ...unsigned,
    signature: {
      algorithm: SIGNATURE_ALGORITHM,
      key_id: normalizedKeyId,
      value: signature,
    },
  }, true);
  assertByteLimit(canonicalJson(manifest), PROTOCOL_LIMITS.manifestBytes, "manifest_too_large");
  return deepFreeze(manifest);
}

export function validateReentryManifest(manifest, {
  keyResolver,
  expectedOrigin,
  now = new Date(),
  futureClockSkewMs = PROTOCOL_LIMITS.manifestFutureSkewMs,
} = {}) {
  if (typeof keyResolver !== "function") {
    throw new TypeError("keyResolver is required for Manifest verification");
  }
  if (expectedOrigin === undefined) {
    throw new TypeError("expectedOrigin is required for Manifest verification");
  }
  const normalized = normalizeManifest(manifest, true);
  assertByteLimit(canonicalJson(normalized), PROTOCOL_LIMITS.manifestBytes, "manifest_too_large");
  const current = requireDate(now, "Manifest verification clock");
  const skew = requireDuration(futureClockSkewMs, "Manifest future clock skew");
  const origin = requireOrigin(expectedOrigin, "expected Manifest origin");
  if (normalized.issuer_origin !== origin) {
    throw validation("manifest_origin_mismatch", "Manifest origin does not match the expected Host");
  }
  assertManifestTimeOrder(normalized);
  const issuedAt = Date.parse(normalized.issued_at);
  const offerExpiresAt = Date.parse(normalized.offer_expires_at);
  if (issuedAt > current.getTime() + skew) {
    throw validation("manifest_issued_in_future", "Manifest issued_at is outside the accepted future window");
  }
  if (offerExpiresAt <= current.getTime()) {
    throw validation("manifest_expired", "Manifest offer has expired", 410);
  }

  const publicKeyValue = resolveKey(keyResolver, {
    issuerOrigin: normalized.issuer_origin,
    keyId: normalized.signature.key_id,
    purpose: "manifest",
  }, "manifest_key_unavailable");
  const publicKey = requireEd25519PublicKey(publicKeyValue, "manifest_key_invalid");
  const { signature, ...unsigned } = normalized;
  if (!verifyBytes(
    null,
    Buffer.from(canonicalJson(unsigned), "utf8"),
    publicKey,
    decodeSignature(signature.value),
  )) {
    throw authentication("manifest_signature_invalid", "Manifest signature is invalid");
  }
  return deepFreeze(normalized);
}

export function createContinuationEvent(value) {
  return deepFreeze(normalizeEvent(value));
}

export function serializeContinuationEvent(event) {
  const body = canonicalJson(normalizeEvent(event));
  assertByteLimit(body, PROTOCOL_LIMITS.eventBodyBytes, "event_body_too_large");
  return body;
}

export function parseContinuationEventBody(body) {
  if (typeof body !== "string" || body.length === 0) {
    throw validation("event_body_invalid", "Event body must be a non-empty string", 400);
  }
  assertByteLimit(body, PROTOCOL_LIMITS.eventBodyBytes, "event_body_too_large");
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw validation("event_body_invalid", "Event body is not valid JSON", 400);
  }
  const event = normalizeEvent(parsed);
  if (canonicalJson(event) !== body) {
    throw validation("event_body_noncanonical", "Event body is not canonically encoded");
  }
  return deepFreeze(event);
}

export function createContinuationEventEnvelope(event, {
  privateKey,
  keyId,
  timestamp,
}) {
  const body = serializeContinuationEvent(event);
  const normalizedTimestamp = requireEpochSeconds(timestamp);
  const normalizedKeyId = requireIdentifier(keyId, "event key_id");
  const key = requireEd25519PrivateKey(privateKey);
  const signature = signBytes(
    null,
    Buffer.from(`${normalizedTimestamp}.${body}`, "utf8"),
    key,
  ).toString("base64url");
  return deepFreeze({
    body,
    headers: {
      [REENTRY_HEADER_NAMES.keyId]: normalizedKeyId,
      [REENTRY_HEADER_NAMES.timestamp]: normalizedTimestamp,
      [REENTRY_HEADER_NAMES.signature]: signature,
    },
  });
}

export function verifyContinuationEventEnvelope(envelope, {
  keyResolver,
  expectedOrigin,
  now = new Date(),
  deliveryClockSkewMs = PROTOCOL_LIMITS.deliveryClockSkewMs,
  futureClockSkewMs = PROTOCOL_LIMITS.eventFutureSkewMs,
} = {}) {
  if (typeof keyResolver !== "function") {
    throw new TypeError("keyResolver is required for event verification");
  }
  if (expectedOrigin === undefined) {
    throw new TypeError("expectedOrigin is required for event verification");
  }
  requireExactRecord(envelope, ENVELOPE_FIELDS, "event envelope");
  requireExactRecord(envelope.headers, ENVELOPE_HEADER_FIELDS, "event envelope headers");
  const event = parseContinuationEventBody(envelope.body);
  const origin = requireOrigin(expectedOrigin, "expected event origin");
  if (event.issuer_origin !== origin) {
    throw validation("event_origin_mismatch", "Event origin does not match the resolved Grant");
  }

  const current = requireDate(now, "Event verification clock");
  const deliverySkew = requireDuration(deliveryClockSkewMs, "Event delivery clock skew");
  const futureSkew = requireDuration(futureClockSkewMs, "Event future clock skew");
  const timestamp = requireEpochSeconds(envelope.headers[REENTRY_HEADER_NAMES.timestamp]);
  const timestampMs = Number(timestamp) * 1_000;
  if (Math.abs(current.getTime() - timestampMs) > deliverySkew) {
    throw authentication(
      "event_delivery_timestamp_outside_window",
      "Event delivery timestamp is outside the accepted window",
    );
  }
  if (Date.parse(event.occurred_at) > current.getTime() + futureSkew) {
    throw validation("event_occurred_in_future", "Event occurred_at is outside the accepted future window");
  }

  const keyId = requireIdentifier(
    envelope.headers[REENTRY_HEADER_NAMES.keyId],
    "event key_id",
  );
  const signature = requireEd25519Signature(
    envelope.headers[REENTRY_HEADER_NAMES.signature],
    "event signature",
  );
  const publicKeyValue = resolveKey(keyResolver, {
    issuerOrigin: event.issuer_origin,
    keyId,
    purpose: "event",
  }, "event_key_unavailable");
  const publicKey = requireEd25519PublicKey(publicKeyValue, "event_key_invalid");
  if (!verifyBytes(
    null,
    Buffer.from(`${timestamp}.${envelope.body}`, "utf8"),
    publicKey,
    decodeSignature(signature),
  )) {
    throw authentication("event_signature_invalid", "Event signature is invalid");
  }
  return deepFreeze(event);
}

export function validatePublicBinding(binding) {
  requireExactRecord(binding, PUBLIC_BINDING_FIELDS, "public binding");
  if (binding.type !== PUBLIC_BINDING_TYPE || binding.protocol_version !== PROTOCOL_VERSION) {
    throw validation("binding_version_unsupported", "Public binding type or protocol version is unsupported");
  }
  const status = requireEnum(
    binding.status,
    ["active", "revoked", "expired", "exhausted"],
    "binding status",
  );
  const runsRemaining = requireNonNegativeInteger(binding.runs_remaining, "runs_remaining");
  if (runsRemaining > 1) {
    throw validation("binding_runs_invalid", "Version 0.1 bindings cannot have more than one remaining run");
  }
  return deepFreeze({
    type: PUBLIC_BINDING_TYPE,
    protocol_version: PROTOCOL_VERSION,
    binding_id: requireIdentifier(binding.binding_id, "binding_id"),
    correlation_id: requireIdentifier(binding.correlation_id, "correlation_id"),
    workflow_id: requireIdentifier(binding.workflow_id, "workflow_id"),
    event_type: requireIdentifier(binding.event_type, "event_type"),
    expires_at: requireTimestamp(binding.expires_at, "binding expires_at"),
    runs_remaining: runsRemaining,
    status,
  });
}

export function createContinuationReceipt(receipt) {
  return deepFreeze(normalizeReceipt(receipt));
}

export function validateContinuationReceipt(receipt) {
  return deepFreeze(normalizeReceipt(receipt));
}

export function createContinuationAcceptance(value) {
  requireExactRecord(value, ACCEPTANCE_FIELDS, "continuation acceptance");
  if (value.type !== ACCEPTANCE_TYPE || value.protocol_version !== PROTOCOL_VERSION) {
    throw validation(
      "acceptance_version_unsupported",
      "Continuation acceptance type or protocol version is unsupported",
    );
  }
  if (value.accepted !== true || typeof value.duplicate !== "boolean" || value.status !== "accepted") {
    throw validation(
      "acceptance_value_invalid",
      "Continuation acceptance contains an unsupported outcome",
    );
  }
  return deepFreeze({
    type: ACCEPTANCE_TYPE,
    protocol_version: PROTOCOL_VERSION,
    event_id: requireIdentifier(value.event_id, "acceptance event_id"),
    correlation_id: requireIdentifier(value.correlation_id, "acceptance correlation_id"),
    accepted: true,
    duplicate: value.duplicate,
    status: "accepted",
  });
}

function normalizeManifest(value, requireSignature) {
  requireExactRecord(
    value,
    requireSignature ? MANIFEST_FIELDS : MANIFEST_UNSIGNED_FIELDS,
    "manifest",
  );
  if (value.type !== MANIFEST_TYPE || value.protocol_version !== PROTOCOL_VERSION) {
    throw validation("manifest_version_unsupported", "Manifest type or protocol version is unsupported");
  }
  const issuerOrigin = requireOrigin(value.issuer_origin, "manifest issuer_origin");
  requireExactRecord(value.workflow, WORKFLOW_FIELDS, "manifest workflow");
  requireExactRecord(value.display, DISPLAY_FIELDS, "manifest display");
  requireExactRecord(value.grant_request, GRANT_REQUEST_FIELDS, "manifest grant_request");
  const maxRuns = requirePositiveInteger(value.grant_request.max_runs, "manifest max_runs");
  if (maxRuns !== 1) {
    throw validation("manifest_runs_invalid", "Version 0.1 Manifest max_runs must equal one");
  }
  const normalized = {
    type: MANIFEST_TYPE,
    protocol_version: PROTOCOL_VERSION,
    manifest_id: requireIdentifier(value.manifest_id, "manifest_id"),
    correlation_id: requireIdentifier(value.correlation_id, "correlation_id"),
    issuer_origin: issuerOrigin,
    issued_at: requireTimestamp(value.issued_at, "manifest issued_at"),
    offer_expires_at: requireTimestamp(value.offer_expires_at, "manifest offer_expires_at"),
    workflow: {
      id: requireIdentifier(value.workflow.id, "workflow id"),
      type: requireIdentifier(value.workflow.type, "workflow type"),
      state_version: requireNonNegativeInteger(value.workflow.state_version, "workflow state_version"),
      canonical_url: requireCanonicalUrl(
        value.workflow.canonical_url,
        issuerOrigin,
        "workflow canonical_url",
      ),
    },
    display: {
      title: requireDisplayText(
        value.display.title,
        PROTOCOL_LIMITS.displayTitleBytes,
        "display title",
      ),
      reason: requireDisplayText(
        value.display.reason,
        PROTOCOL_LIMITS.displayReasonBytes,
        "display reason",
      ),
    },
    grant_request: {
      event_type: requireIdentifier(value.grant_request.event_type, "grant event_type"),
      grant_expires_at: requireTimestamp(
        value.grant_request.grant_expires_at,
        "grant expires_at",
      ),
      max_runs: maxRuns,
      human_boundary: requireIdentifier(
        value.grant_request.human_boundary,
        "grant human_boundary",
      ),
    },
  };
  if (requireSignature) normalized.signature = normalizeSignature(value.signature);
  return normalized;
}

function normalizeEvent(value) {
  requireExactRecord(value, EVENT_FIELDS, "continuation event");
  if (value.type !== EVENT_TYPE || value.protocol_version !== PROTOCOL_VERSION) {
    throw validation("event_version_unsupported", "Event type or protocol version is unsupported");
  }
  const issuerOrigin = requireOrigin(value.issuer_origin, "event issuer_origin");
  const sequence = requirePositiveInteger(value.event_sequence, "event_sequence");
  if (sequence !== 1) {
    throw validation("event_sequence_invalid", "Version 0.1 event_sequence must equal one");
  }
  return {
    type: EVENT_TYPE,
    protocol_version: PROTOCOL_VERSION,
    event_id: requireIdentifier(value.event_id, "event_id"),
    correlation_id: requireIdentifier(value.correlation_id, "correlation_id"),
    binding_id: requireIdentifier(value.binding_id, "binding_id"),
    issuer_origin: issuerOrigin,
    workflow_id: requireIdentifier(value.workflow_id, "workflow_id"),
    event_type: requireIdentifier(value.event_type, "event_type"),
    event_sequence: sequence,
    state_version: requireNonNegativeInteger(value.state_version, "state_version"),
    occurred_at: requireTimestamp(value.occurred_at, "event occurred_at"),
    canonical_url: requireCanonicalUrl(value.canonical_url, issuerOrigin, "event canonical_url"),
  };
}

function normalizeReceipt(value) {
  requireExactRecord(value, RECEIPT_FIELDS, "continuation receipt");
  if (value.type !== RECEIPT_TYPE || value.protocol_version !== PROTOCOL_VERSION) {
    throw validation("receipt_version_unsupported", "Receipt type or protocol version is unsupported");
  }
  const issuerOrigin = requireOrigin(value.issuer_origin, "receipt issuer_origin");
  if (value.continuation_mode !== CONTINUATION_MODE) {
    throw validation("receipt_mode_invalid", "Receipt continuation_mode is unsupported");
  }
  const normalized = {
    type: RECEIPT_TYPE,
    protocol_version: PROTOCOL_VERSION,
    grant_id: requireIdentifier(value.grant_id, "grant_id"),
    correlation_id: requireIdentifier(value.correlation_id, "correlation_id"),
    issuer_origin: issuerOrigin,
    workflow_id: requireIdentifier(value.workflow_id, "workflow_id"),
    event_type: requireIdentifier(value.event_type, "event_type"),
    canonical_url: requireCanonicalUrl(value.canonical_url, issuerOrigin, "receipt canonical_url"),
    expires_at: requireTimestamp(value.expires_at, "receipt expires_at"),
    human_boundary: requireIdentifier(value.human_boundary, "receipt human_boundary"),
    continuation_mode: CONTINUATION_MODE,
  };
  assertByteLimit(canonicalJson(normalized), PROTOCOL_LIMITS.receiptBytes, "receipt_too_large");
  return normalized;
}

function normalizeSignature(value) {
  requireExactRecord(value, SIGNATURE_FIELDS, "manifest signature");
  if (value.algorithm !== SIGNATURE_ALGORITHM) {
    throw validation("manifest_signature_algorithm_invalid", "Manifest signature algorithm is unsupported");
  }
  return {
    algorithm: SIGNATURE_ALGORITHM,
    key_id: requireIdentifier(value.key_id, "signature key_id"),
    value: requireEd25519Signature(value.value, "manifest signature"),
  };
}

function assertManifestTimeOrder(manifest) {
  const issuedAt = Date.parse(manifest.issued_at);
  const offerExpiresAt = Date.parse(manifest.offer_expires_at);
  const grantExpiresAt = Date.parse(manifest.grant_request.grant_expires_at);
  if (offerExpiresAt <= issuedAt) {
    throw validation("manifest_offer_window_invalid", "Manifest offer expiry must follow issuance");
  }
  if (grantExpiresAt <= offerExpiresAt) {
    throw validation("manifest_grant_window_invalid", "Requested Grant expiry must follow offer expiry");
  }
}

function serializeCanonical(value, stack) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") {
    requireUnicodeScalars(value, "canonical JSON string");
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || Object.is(value, -0)) {
      throw validation("canonical_number_invalid", "Canonical JSON numbers must be safe integers other than negative zero");
    }
    return String(value);
  }
  if (typeof value !== "object") {
    throw validation("canonical_type_invalid", "Canonical JSON contains an unsupported value type");
  }
  if (stack.has(value)) {
    throw validation("canonical_cycle_invalid", "Canonical JSON cannot contain cycles");
  }
  stack.add(value);
  try {
    if (Array.isArray(value)) {
      const keys = Object.keys(value);
      if (keys.length !== value.length || keys.some((key, index) => key !== String(index))) {
        throw validation("canonical_array_invalid", "Canonical JSON arrays must be dense and contain no named properties");
      }
      assertNoSymbolOrAccessorProperties(value, true);
      return `[${value.map((item) => serializeCanonical(item, stack)).join(",")}]`;
    }
    assertPlainObject(value, "canonical JSON object");
    assertNoSymbolOrAccessorProperties(value, false);
    return `{${Object.keys(value)
      .sort()
      .map((key) => {
        requireUnicodeScalars(key, "canonical JSON key");
        return `${JSON.stringify(key)}:${serializeCanonical(value[key], stack)}`;
      })
      .join(",")}}`;
  } finally {
    stack.delete(value);
  }
}

function requireExactRecord(value, expectedFields, label) {
  assertPlainObject(value, label);
  assertNoSymbolOrAccessorProperties(value, false);
  const actual = Object.keys(value).sort();
  const expected = [...expectedFields].sort();
  if (
    actual.length !== expected.length ||
    actual.some((field, index) => field !== expected[index])
  ) {
    throw validation(
      `${label.replaceAll(" ", "_")}_fields_invalid`,
      `${label} fields do not match the strict contract`,
    );
  }
}

function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw validation("protocol_object_invalid", `${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw validation("protocol_object_invalid", `${label} must be a plain object`);
  }
}

function assertNoSymbolOrAccessorProperties(value, isArray) {
  for (const key of Reflect.ownKeys(value)) {
    if (isArray && key === "length") continue;
    if (typeof key === "symbol") {
      throw validation("protocol_property_invalid", "Protocol values cannot contain symbol properties");
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !("value" in descriptor)) {
      throw validation("protocol_property_invalid", "Protocol values must contain enumerable data properties only");
    }
  }
}

function requireIdentifier(value, label) {
  if (
    typeof value !== "string" ||
    Buffer.byteLength(value, "utf8") > PROTOCOL_LIMITS.identifierBytes ||
    !IDENTIFIER_PATTERN.test(value)
  ) {
    throw validation("protocol_identifier_invalid", `${label} is invalid`);
  }
  return value;
}

function requireDisplayText(value, maximumBytes, label) {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) {
    throw validation("protocol_display_invalid", `${label} must be bounded non-empty plain text`);
  }
  requireUnicodeScalars(value, label);
  if (CONTROL_CHARACTER_PATTERN.test(value) || Buffer.byteLength(value, "utf8") > maximumBytes) {
    throw validation("protocol_display_invalid", `${label} must be bounded non-empty plain text`);
  }
  return value;
}

function requireOrigin(value, label) {
  if (typeof value !== "string" || Buffer.byteLength(value, "utf8") > PROTOCOL_LIMITS.canonicalUrlBytes) {
    throw validation("protocol_origin_invalid", `${label} must be a canonical HTTP(S) origin`);
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw validation("protocol_origin_invalid", `${label} must be a canonical HTTP(S) origin`);
  }
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.origin !== value ||
    parsed.username ||
    parsed.password
  ) {
    throw validation("protocol_origin_invalid", `${label} must be a canonical HTTP(S) origin`);
  }
  return value;
}

function requireCanonicalUrl(value, expectedOrigin, label) {
  if (typeof value !== "string" || Buffer.byteLength(value, "utf8") > PROTOCOL_LIMITS.canonicalUrlBytes) {
    throw validation("protocol_url_invalid", `${label} must be a bounded canonical HTTP(S) URL`);
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw validation("protocol_url_invalid", `${label} must be a bounded canonical HTTP(S) URL`);
  }
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.hash ||
    parsed.origin !== expectedOrigin ||
    parsed.href !== value
  ) {
    throw validation("protocol_url_invalid", `${label} must stay on the declared origin and be canonical`);
  }
  return value;
}

function requireTimestamp(value, label) {
  if (typeof value !== "string" || value.length > MAX_TIMESTAMP_CHARACTERS) {
    throw validation("protocol_timestamp_invalid", `${label} must be a canonical ISO-8601 timestamp`);
  }
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== value) {
    throw validation("protocol_timestamp_invalid", `${label} must be a canonical ISO-8601 timestamp`);
  }
  return value;
}

function requireEpochSeconds(value) {
  if (
    typeof value !== "string" ||
    value.length > MAX_EPOCH_SECONDS_CHARACTERS ||
    !/^(?:0|[1-9]\d*)$/.test(value)
  ) {
    throw validation("event_delivery_timestamp_invalid", "Event delivery timestamp must be canonical epoch seconds", 400);
  }
  const seconds = Number(value);
  if (!Number.isSafeInteger(seconds)) {
    throw validation("event_delivery_timestamp_invalid", "Event delivery timestamp must be canonical epoch seconds", 400);
  }
  return value;
}

function requireNonNegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw validation("protocol_integer_invalid", `${label} must be a non-negative safe integer`);
  }
  return value;
}

function requirePositiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw validation("protocol_integer_invalid", `${label} must be a positive safe integer`);
  }
  return value;
}

function requireEnum(value, allowed, label) {
  if (!allowed.includes(value)) {
    throw validation("protocol_enum_invalid", `${label} is unsupported`);
  }
  return value;
}

function requireDate(value, label) {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new TypeError(`${label} must be a valid Date`);
  }
  return value;
}

function requireDuration(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative safe integer`);
  }
  return value;
}

function requireEd25519PrivateKey(value) {
  let key;
  try {
    if (value instanceof KeyObject && value.type === "private") {
      key = value;
    } else if (
      typeof value === "string" &&
      value.startsWith("-----BEGIN PRIVATE KEY-----")
    ) {
      key = createPrivateKey(value);
    } else {
      throw new TypeError();
    }
  } catch {
    throw new TypeError("Host signing key must be an Ed25519 private key");
  }
  if (key.type !== "private" || key.asymmetricKeyType !== "ed25519") {
    throw new TypeError("Host signing key must be an Ed25519 private key");
  }
  return key;
}

function requireEd25519PublicKey(value, errorCode) {
  let key;
  try {
    if (value instanceof KeyObject && value.type === "public") {
      key = value;
    } else if (
      typeof value === "string" &&
      value.startsWith("-----BEGIN PUBLIC KEY-----") &&
      !value.includes("PRIVATE KEY")
    ) {
      key = createPublicKey(value);
    } else {
      throw new TypeError();
    }
  } catch {
    throw authentication(errorCode, "Issuer verification key must be an Ed25519 public key");
  }
  if (key.type !== "public" || key.asymmetricKeyType !== "ed25519") {
    throw authentication(errorCode, "Issuer verification key must be an Ed25519 public key");
  }
  return key;
}

function requireEd25519Signature(value, label) {
  if (
    typeof value !== "string" ||
    value.length !== ED25519_SIGNATURE_CHARACTERS ||
    !BASE64URL_PATTERN.test(value) ||
    value.includes("=")
  ) {
    throw validation("protocol_signature_invalid", `${label} must be canonical unpadded base64url`);
  }
  let decoded;
  try {
    decoded = Buffer.from(value, "base64url");
  } catch {
    throw validation("protocol_signature_invalid", `${label} must be canonical unpadded base64url`);
  }
  if (decoded.byteLength !== 64 || decoded.toString("base64url") !== value) {
    throw validation("protocol_signature_invalid", `${label} must be a canonical Ed25519 signature`);
  }
  return value;
}

function decodeSignature(value) {
  return Buffer.from(value, "base64url");
}

function resolveKey(keyResolver, request, errorCode) {
  let value;
  try {
    value = keyResolver(request);
  } catch {
    throw authentication(errorCode, "Issuer verification key is unavailable");
  }
  if (value === undefined || value === null || typeof value?.then === "function") {
    throw authentication(errorCode, "Issuer verification key is unavailable");
  }
  return value;
}

function requireUnicodeScalars(value, label) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw validation("protocol_unicode_invalid", `${label} contains an invalid Unicode scalar value`);
      }
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw validation("protocol_unicode_invalid", `${label} contains an invalid Unicode scalar value`);
    }
  }
}

function assertByteLimit(value, maximumBytes, code) {
  if (Buffer.byteLength(value, "utf8") > maximumBytes) {
    throw validation(code, "Protocol payload exceeds its byte limit", 413);
  }
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function validation(code, message, statusCode) {
  return new ProtocolValidationError(code, message, statusCode);
}

function authentication(code, message) {
  return new ProtocolAuthenticationError(code, message);
}
