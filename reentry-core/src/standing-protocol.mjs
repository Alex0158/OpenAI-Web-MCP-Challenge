import {
  KeyObject,
  createHash,
  createPrivateKey,
  createPublicKey,
  sign as signBytes,
  verify as verifyBytes,
} from "node:crypto";

import {
  ACCEPTANCE_TYPE,
  CONTINUATION_MODE,
  EVENT_TYPE,
  MANIFEST_TYPE,
  PROTOCOL_LIMITS,
  PUBLIC_BINDING_TYPE,
  RECEIPT_TYPE,
  REENTRY_HEADER_NAMES,
  SIGNATURE_ALGORITHM,
  ProtocolAuthenticationError,
  ProtocolValidationError,
  canonicalJson,
} from "./protocol.mjs";

export const STANDING_PROTOCOL_VERSION = "0.2";
export const STANDING_AUTHORIZATION_MODE = "standing";
export const STANDING_MAX_ACTIVE_ACTIVATIONS = 1;

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
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
  "authorization_mode",
  "event_type",
  "grant_expires_at",
  "max_active_activations",
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
const BINDING_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "binding_id",
  "correlation_id",
  "workflow_id",
  "event_type",
  "expires_at",
  "authorization_mode",
  "max_active_activations",
  "last_event_sequence",
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
  "authorization_mode",
  "max_active_activations",
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

export function createStandingReentryManifest(value, { privateKey, keyId }) {
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

export function validateStandingReentryManifest(manifest, options = {}) {
  return verifyStandingReentryManifestAuthority(manifest, options).manifest;
}

export function verifyStandingReentryManifestAuthority(manifest, {
  keyResolver,
  expectedOrigin,
  now = new Date(),
  futureClockSkewMs = PROTOCOL_LIMITS.manifestFutureSkewMs,
} = {}) {
  if (typeof keyResolver !== "function") {
    throw new TypeError("keyResolver is required for standing Manifest verification");
  }
  if (expectedOrigin === undefined) {
    throw new TypeError("expectedOrigin is required for standing Manifest verification");
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
  if (Date.parse(normalized.issued_at) > current.getTime() + skew) {
    throw validation(
      "manifest_issued_in_future",
      "Manifest issued_at is outside the accepted future window",
    );
  }
  if (Date.parse(normalized.offer_expires_at) <= current.getTime()) {
    throw validation("manifest_expired", "Manifest offer has expired", 410);
  }
  const publicKey = resolvePublicKey(keyResolver, {
    issuerOrigin: normalized.issuer_origin,
    keyId: normalized.signature.key_id,
    purpose: "manifest",
  }, "manifest_key_unavailable");
  const { signature, ...unsigned } = normalized;
  if (!verifyBytes(
    null,
    Buffer.from(canonicalJson(unsigned), "utf8"),
    publicKey,
    decodeSignature(signature.value),
  )) {
    throw authentication("manifest_signature_invalid", "Manifest signature is invalid");
  }
  return deepFreeze({
    manifest: normalized,
    keyFingerprint: fingerprintPublicKey(publicKey),
  });
}

export function createStandingContinuationEvent(value) {
  return deepFreeze(normalizeEvent(value));
}

export function serializeStandingContinuationEvent(event) {
  const body = canonicalJson(normalizeEvent(event));
  assertByteLimit(body, PROTOCOL_LIMITS.eventBodyBytes, "event_body_too_large");
  return body;
}

export function parseStandingContinuationEventBody(body) {
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

export function createStandingContinuationEventEnvelope(event, {
  privateKey,
  keyId,
  timestamp,
}) {
  const body = serializeStandingContinuationEvent(event);
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

export function verifyStandingContinuationEventEnvelope(envelope, {
  keyResolver,
  expectedOrigin,
  expectedKeyId,
  expectedKeyFingerprint,
  now = new Date(),
  deliveryClockSkewMs = PROTOCOL_LIMITS.deliveryClockSkewMs,
  futureClockSkewMs = PROTOCOL_LIMITS.eventFutureSkewMs,
} = {}) {
  if (typeof keyResolver !== "function") {
    throw new TypeError("keyResolver is required for standing Event verification");
  }
  if (expectedOrigin === undefined) {
    throw new TypeError("expectedOrigin is required for standing Event verification");
  }
  if (expectedKeyId === undefined) {
    throw new TypeError("expectedKeyId is required for standing Event verification");
  }
  if (expectedKeyFingerprint === undefined) {
    throw new TypeError("expectedKeyFingerprint is required for standing Event verification");
  }
  const consentedKeyId = requireIdentifier(expectedKeyId, "expected event key_id");
  const consentedKeyFingerprint = requireKeyFingerprint(expectedKeyFingerprint);
  requireExactRecord(envelope, ENVELOPE_FIELDS, "event envelope");
  requireExactRecord(envelope.headers, ENVELOPE_HEADER_FIELDS, "event envelope headers");
  const event = parseStandingContinuationEventBody(envelope.body);
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
    throw validation(
      "event_occurred_in_future",
      "Event occurred_at is outside the accepted future window",
    );
  }
  const keyId = requireIdentifier(
    envelope.headers[REENTRY_HEADER_NAMES.keyId],
    "event key_id",
  );
  if (keyId !== consentedKeyId) {
    throw authentication(
      "event_key_scope_invalid",
      "Event key does not match the consented standing Grant",
    );
  }
  const signature = requireEd25519Signature(
    envelope.headers[REENTRY_HEADER_NAMES.signature],
    "event signature",
  );
  const publicKey = resolvePublicKey(keyResolver, {
    issuerOrigin: event.issuer_origin,
    keyId,
    purpose: "event",
  }, "event_key_unavailable");
  if (fingerprintPublicKey(publicKey) !== consentedKeyFingerprint) {
    throw authentication(
      "event_key_material_scope_invalid",
      "Event verification key material does not match the consented standing Grant",
    );
  }
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

export function createStandingPublicBinding(value) {
  requireExactRecord(value, BINDING_FIELDS, "standing public binding");
  if (value.type !== PUBLIC_BINDING_TYPE || value.protocol_version !== STANDING_PROTOCOL_VERSION) {
    throw validation(
      "binding_version_unsupported",
      "Standing public binding type or protocol version is unsupported",
    );
  }
  requireStandingMode(value.authorization_mode, "binding authorization_mode");
  requireOneActive(value.max_active_activations, "binding max_active_activations");
  return deepFreeze({
    type: PUBLIC_BINDING_TYPE,
    protocol_version: STANDING_PROTOCOL_VERSION,
    binding_id: requireIdentifier(value.binding_id, "binding_id"),
    correlation_id: requireIdentifier(value.correlation_id, "correlation_id"),
    workflow_id: requireIdentifier(value.workflow_id, "workflow_id"),
    event_type: requireIdentifier(value.event_type, "event_type"),
    expires_at: requireTimestamp(value.expires_at, "binding expires_at"),
    authorization_mode: STANDING_AUTHORIZATION_MODE,
    max_active_activations: STANDING_MAX_ACTIVE_ACTIVATIONS,
    last_event_sequence: requireNonNegativeInteger(
      value.last_event_sequence,
      "last_event_sequence",
    ),
    status: requireEnum(value.status, ["active", "revoked", "expired"], "binding status"),
  });
}

export function createStandingContinuationReceipt(value) {
  requireExactRecord(value, RECEIPT_FIELDS, "standing continuation receipt");
  if (value.type !== RECEIPT_TYPE || value.protocol_version !== STANDING_PROTOCOL_VERSION) {
    throw validation(
      "receipt_version_unsupported",
      "Standing receipt type or protocol version is unsupported",
    );
  }
  requireStandingMode(value.authorization_mode, "receipt authorization_mode");
  requireOneActive(value.max_active_activations, "receipt max_active_activations");
  if (value.continuation_mode !== CONTINUATION_MODE) {
    throw validation("receipt_mode_invalid", "Receipt continuation_mode is unsupported");
  }
  const issuerOrigin = requireOrigin(value.issuer_origin, "receipt issuer_origin");
  const receipt = {
    type: RECEIPT_TYPE,
    protocol_version: STANDING_PROTOCOL_VERSION,
    grant_id: requireIdentifier(value.grant_id, "grant_id"),
    correlation_id: requireIdentifier(value.correlation_id, "correlation_id"),
    issuer_origin: issuerOrigin,
    workflow_id: requireIdentifier(value.workflow_id, "workflow_id"),
    event_type: requireIdentifier(value.event_type, "event_type"),
    canonical_url: requireCanonicalUrl(
      value.canonical_url,
      issuerOrigin,
      "receipt canonical_url",
    ),
    expires_at: requireTimestamp(value.expires_at, "receipt expires_at"),
    human_boundary: requireIdentifier(value.human_boundary, "receipt human_boundary"),
    continuation_mode: CONTINUATION_MODE,
    authorization_mode: STANDING_AUTHORIZATION_MODE,
    max_active_activations: STANDING_MAX_ACTIVE_ACTIVATIONS,
  };
  assertByteLimit(canonicalJson(receipt), PROTOCOL_LIMITS.receiptBytes, "receipt_too_large");
  return deepFreeze(receipt);
}

export function validateStandingContinuationReceipt(value) {
  return createStandingContinuationReceipt(value);
}

export function createStandingContinuationAcceptance(value) {
  requireExactRecord(value, ACCEPTANCE_FIELDS, "standing continuation acceptance");
  if (value.type !== ACCEPTANCE_TYPE || value.protocol_version !== STANDING_PROTOCOL_VERSION) {
    throw validation(
      "acceptance_version_unsupported",
      "Standing acceptance type or protocol version is unsupported",
    );
  }
  if (value.accepted !== true || typeof value.duplicate !== "boolean" || value.status !== "accepted") {
    throw validation(
      "acceptance_value_invalid",
      "Standing acceptance contains an unsupported outcome",
    );
  }
  return deepFreeze({
    type: ACCEPTANCE_TYPE,
    protocol_version: STANDING_PROTOCOL_VERSION,
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
    "standing manifest",
  );
  if (value.type !== MANIFEST_TYPE || value.protocol_version !== STANDING_PROTOCOL_VERSION) {
    throw validation(
      "manifest_version_unsupported",
      "Standing Manifest type or protocol version is unsupported",
    );
  }
  const issuerOrigin = requireOrigin(value.issuer_origin, "manifest issuer_origin");
  requireExactRecord(value.workflow, WORKFLOW_FIELDS, "manifest workflow");
  requireExactRecord(value.display, DISPLAY_FIELDS, "manifest display");
  requireExactRecord(value.grant_request, GRANT_REQUEST_FIELDS, "manifest grant_request");
  requireStandingMode(value.grant_request.authorization_mode, "grant authorization_mode");
  requireOneActive(
    value.grant_request.max_active_activations,
    "grant max_active_activations",
  );
  const normalized = {
    type: MANIFEST_TYPE,
    protocol_version: STANDING_PROTOCOL_VERSION,
    manifest_id: requireIdentifier(value.manifest_id, "manifest_id"),
    correlation_id: requireIdentifier(value.correlation_id, "correlation_id"),
    issuer_origin: issuerOrigin,
    issued_at: requireTimestamp(value.issued_at, "manifest issued_at"),
    offer_expires_at: requireTimestamp(value.offer_expires_at, "manifest offer_expires_at"),
    workflow: {
      id: requireIdentifier(value.workflow.id, "workflow id"),
      type: requireIdentifier(value.workflow.type, "workflow type"),
      state_version: requireNonNegativeInteger(
        value.workflow.state_version,
        "workflow state_version",
      ),
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
      authorization_mode: STANDING_AUTHORIZATION_MODE,
      event_type: requireIdentifier(value.grant_request.event_type, "grant event_type"),
      grant_expires_at: requireTimestamp(
        value.grant_request.grant_expires_at,
        "grant expires_at",
      ),
      max_active_activations: STANDING_MAX_ACTIVE_ACTIVATIONS,
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
  requireExactRecord(value, EVENT_FIELDS, "standing continuation event");
  if (value.type !== EVENT_TYPE || value.protocol_version !== STANDING_PROTOCOL_VERSION) {
    throw validation(
      "event_version_unsupported",
      "Standing Event type or protocol version is unsupported",
    );
  }
  const issuerOrigin = requireOrigin(value.issuer_origin, "event issuer_origin");
  return {
    type: EVENT_TYPE,
    protocol_version: STANDING_PROTOCOL_VERSION,
    event_id: requireIdentifier(value.event_id, "event_id"),
    correlation_id: requireIdentifier(value.correlation_id, "correlation_id"),
    binding_id: requireIdentifier(value.binding_id, "binding_id"),
    issuer_origin: issuerOrigin,
    workflow_id: requireIdentifier(value.workflow_id, "workflow_id"),
    event_type: requireIdentifier(value.event_type, "event_type"),
    event_sequence: requirePositiveInteger(value.event_sequence, "event_sequence"),
    state_version: requireNonNegativeInteger(value.state_version, "state_version"),
    occurred_at: requireTimestamp(value.occurred_at, "event occurred_at"),
    canonical_url: requireCanonicalUrl(
      value.canonical_url,
      issuerOrigin,
      "event canonical_url",
    ),
  };
}

function normalizeSignature(value) {
  requireExactRecord(value, SIGNATURE_FIELDS, "manifest signature");
  if (value.algorithm !== SIGNATURE_ALGORITHM) {
    throw validation(
      "manifest_signature_algorithm_invalid",
      "Manifest signature algorithm is unsupported",
    );
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

function requireExactRecord(value, fields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw validation("record_invalid", `${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw validation("record_invalid", `${label} must be a plain object`);
  }
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key === "symbol")) {
    throw validation("record_fields_invalid", `${label} contains a symbol field`);
  }
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !("value" in descriptor)) {
      throw validation("record_fields_invalid", `${label} contains an accessor or hidden field`);
    }
  }
  if (keys.length !== fields.length || keys.some((key) => !fields.includes(key))) {
    throw validation("record_fields_invalid", `${label} fields are invalid`);
  }
}

function requireIdentifier(value, label) {
  if (
    typeof value !== "string" ||
    Buffer.byteLength(value, "utf8") > PROTOCOL_LIMITS.identifierBytes ||
    !IDENTIFIER_PATTERN.test(value)
  ) {
    throw validation("identifier_invalid", `${label} is invalid`);
  }
  return value;
}

function requireOrigin(value, label) {
  if (typeof value !== "string" || Buffer.byteLength(value, "utf8") > 2_048) {
    throw validation("origin_invalid", `${label} is invalid`);
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw validation("origin_invalid", `${label} is invalid`);
  }
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.origin !== value ||
    parsed.username ||
    parsed.password
  ) {
    throw validation("origin_invalid", `${label} is invalid`);
  }
  return value;
}

function requireCanonicalUrl(value, expectedOrigin, label) {
  if (typeof value !== "string" || Buffer.byteLength(value, "utf8") > PROTOCOL_LIMITS.canonicalUrlBytes) {
    throw validation("canonical_url_invalid", `${label} is invalid`);
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw validation("canonical_url_invalid", `${label} is invalid`);
  }
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.hash ||
    parsed.origin !== expectedOrigin ||
    parsed.href !== value
  ) {
    throw validation("canonical_url_invalid", `${label} is invalid`);
  }
  return value;
}

function requireTimestamp(value, label) {
  if (typeof value !== "string" || value.length > 27) {
    throw validation("timestamp_invalid", `${label} must be a canonical timestamp`);
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    throw validation("timestamp_invalid", `${label} must be a canonical timestamp`);
  }
  return value;
}

function requireDisplayText(value, maximumBytes, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.trim() !== value ||
    CONTROL_CHARACTER_PATTERN.test(value) ||
    Buffer.byteLength(value, "utf8") > maximumBytes
  ) {
    throw validation("display_text_invalid", `${label} is invalid`);
  }
  return value;
}

function requirePositiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw validation("integer_invalid", `${label} must be a positive safe integer`);
  }
  return value;
}

function requireNonNegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw validation("integer_invalid", `${label} must be a non-negative safe integer`);
  }
  return value;
}

function requireEnum(value, allowed, label) {
  if (!allowed.includes(value)) {
    throw validation("enum_invalid", `${label} is invalid`);
  }
  return value;
}

function requireStandingMode(value, label) {
  if (value !== STANDING_AUTHORIZATION_MODE) {
    throw validation("authorization_mode_invalid", `${label} must equal standing`);
  }
  return value;
}

function requireOneActive(value, label) {
  if (value !== STANDING_MAX_ACTIVE_ACTIVATIONS) {
    throw validation("activation_limit_invalid", `${label} must equal one`);
  }
  return value;
}

function requireEpochSeconds(value) {
  if (typeof value !== "string" || !/^(0|[1-9][0-9]{0,15})$/.test(value)) {
    throw validation("event_timestamp_invalid", "Event delivery timestamp is invalid");
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number)) {
    throw validation("event_timestamp_invalid", "Event delivery timestamp is invalid");
  }
  return value;
}

function requireEd25519Signature(value, label) {
  if (
    typeof value !== "string" ||
    value.length !== ED25519_SIGNATURE_CHARACTERS ||
    !BASE64URL_PATTERN.test(value)
  ) {
    throw validation("signature_invalid", `${label} is invalid`);
  }
  const decoded = Buffer.from(value, "base64url");
  if (decoded.length !== 64 || decoded.toString("base64url") !== value) {
    throw validation("signature_invalid", `${label} is invalid`);
  }
  return value;
}

function decodeSignature(value) {
  return Buffer.from(requireEd25519Signature(value, "signature"), "base64url");
}

function requireEd25519PrivateKey(value) {
  let key;
  try {
    key = value instanceof KeyObject ? value : createPrivateKey(value);
  } catch {
    throw new TypeError("Standing Manifest/Event private key is invalid");
  }
  if (key.type !== "private" || key.asymmetricKeyType !== "ed25519") {
    throw new TypeError("Standing Manifest/Event private key must be Ed25519");
  }
  return key;
}

function resolvePublicKey(keyResolver, input, unavailableCode) {
  let value;
  try {
    value = keyResolver(input);
  } catch {
    throw authentication(unavailableCode, "Verification key is unavailable");
  }
  if (value === undefined || value === null) {
    throw authentication(unavailableCode, "Verification key is unavailable");
  }
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
    throw authentication("verification_key_invalid", "Verification key is invalid");
  }
  if (key.type !== "public" || key.asymmetricKeyType !== "ed25519") {
    throw authentication("verification_key_invalid", "Verification key must be Ed25519");
  }
  return key;
}

function fingerprintPublicKey(key) {
  return createHash("sha256")
    .update(key.export({ type: "spki", format: "der" }))
    .digest("base64url");
}

function requireKeyFingerprint(value) {
  if (
    typeof value !== "string" ||
    value.length !== 43 ||
    !BASE64URL_PATTERN.test(value) ||
    Buffer.from(value, "base64url").toString("base64url") !== value
  ) {
    throw validation("key_fingerprint_invalid", "Expected Host key fingerprint is invalid");
  }
  return value;
}

function requireDate(value, label) {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new TypeError(`${label} must be a valid Date`);
  }
  return new Date(value.getTime());
}

function requireDuration(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative safe integer`);
  }
  return value;
}

function assertByteLimit(value, maximumBytes, code) {
  if (Buffer.byteLength(value, "utf8") > maximumBytes) {
    throw validation(code, "Protocol value exceeds its byte limit", 413);
  }
}

function validation(code, message, statusCode) {
  return new ProtocolValidationError(code, message, statusCode);
}

function authentication(code, message) {
  return new ProtocolAuthenticationError(code, message);
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
