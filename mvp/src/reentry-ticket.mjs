import { createHmac, timingSafeEqual } from "node:crypto";

const DELIVERY_KIND = "h1d1";
const EFFECT_KIND = "h1e1";
const MAX_TOKEN_LENGTH = 8_192;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$/;

export const DELIVERY_TICKET_FIELDS = Object.freeze([
  "event_id",
  "run_id",
  "delivery_id",
  "grant_id",
  "workflow_id",
  "event_type",
  "canonical_url",
  "state_version",
  "expires_at",
]);

export const EFFECT_RECEIPT_FIELDS = Object.freeze([
  "event_id",
  "run_id",
  "delivery_id",
  "grant_id",
  "workflow_id",
  "request_hash",
  "result_revision",
  "applied_at",
]);

export function signDeliveryTicket(claims, { secret, now = new Date() } = {}) {
  const validated = validateDeliveryClaims(claims, {
    now,
    checkExpiry: true,
    requireCanonical: false,
  });
  return signCompact(DELIVERY_KIND, validated, secret);
}

export function verifyDeliveryTicket(token, { secret, now = new Date() } = {}) {
  const claims = verifyCompact(token, DELIVERY_KIND, DELIVERY_TICKET_FIELDS, secret);
  return validateDeliveryClaims(claims, {
    now,
    checkExpiry: true,
    requireCanonical: true,
  });
}

export function signEffectReceipt(claims, { secret } = {}) {
  const validated = validateEffectClaims(claims, { requireCanonical: false });
  return signCompact(EFFECT_KIND, validated, secret);
}

export function verifyEffectReceipt(token, { secret } = {}) {
  const claims = verifyCompact(token, EFFECT_KIND, EFFECT_RECEIPT_FIELDS, secret);
  return validateEffectClaims(claims, { requireCanonical: true });
}

export class ReentryTicketError extends Error {
  constructor(code, message, statusCode) {
    super(message);
    this.name = "ReentryTicketError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function signCompact(kind, claims, secret) {
  const key = requireSecret(secret);
  const encodedPayload = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
  const signingInput = `${kind}.${encodedPayload}`;
  const signature = createHmac("sha256", key).update(signingInput).digest("base64url");
  return `${signingInput}.${signature}`;
}

function verifyCompact(token, expectedKind, fields, secret) {
  const key = requireSecret(secret);
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    throw ticketError("ticket_malformed", "Re-entry token is malformed", 400);
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw ticketError("ticket_malformed", "Re-entry token is malformed", 400);
  }

  const [kind, encodedPayload, signature] = parts;
  if (kind !== expectedKind) {
    throw ticketError("ticket_kind_mismatch", "Re-entry token kind is invalid", 422);
  }
  if (!isCanonicalBase64url(encodedPayload) || !isCanonicalBase64url(signature)) {
    throw ticketError("ticket_malformed", "Re-entry token encoding is invalid", 400);
  }

  const expectedSignature = createHmac("sha256", key)
    .update(`${kind}.${encodedPayload}`)
    .digest("base64url");
  if (!constantTimeTextMatch(signature, expectedSignature)) {
    throw ticketError("ticket_signature_invalid", "Re-entry token signature is invalid", 401);
  }

  let decoded;
  let claims;
  try {
    const payloadBytes = Buffer.from(encodedPayload, "base64url");
    if (payloadBytes.toString("base64url") !== encodedPayload) throw new Error("non-canonical encoding");
    decoded = payloadBytes.toString("utf8");
    if (Buffer.from(decoded, "utf8").toString("base64url") !== encodedPayload) {
      throw new Error("invalid UTF-8");
    }
    claims = JSON.parse(decoded);
  } catch {
    throw ticketError("ticket_payload_invalid", "Re-entry token payload is invalid", 422);
  }

  assertExactFields(claims, fields);
  return claims;
}

function validateDeliveryClaims(claims, { now, checkExpiry, requireCanonical }) {
  assertExactFields(claims, DELIVERY_TICKET_FIELDS);
  const validated = {
    event_id: requireIdentifier(claims.event_id, "event_id"),
    run_id: requireIdentifier(claims.run_id, "run_id"),
    delivery_id: requireIdentifier(claims.delivery_id, "delivery_id"),
    grant_id: requireIdentifier(claims.grant_id, "grant_id"),
    workflow_id: requireIdentifier(claims.workflow_id, "workflow_id"),
    event_type: requireIdentifier(claims.event_type, "event_type"),
    canonical_url: requireCanonicalUrl(claims.canonical_url),
    state_version: requireRevision(claims.state_version, "state_version"),
    expires_at: requireCanonicalTimestamp(claims.expires_at, "expires_at"),
  };

  if (checkExpiry && Date.parse(validated.expires_at) <= requireNow(now).getTime()) {
    throw ticketError("ticket_expired", "Delivery ticket is expired", 410);
  }
  return finalizeClaims(claims, validated, requireCanonical);
}

function validateEffectClaims(claims, { requireCanonical }) {
  assertExactFields(claims, EFFECT_RECEIPT_FIELDS);
  const validated = {
    event_id: requireIdentifier(claims.event_id, "event_id"),
    run_id: requireIdentifier(claims.run_id, "run_id"),
    delivery_id: requireIdentifier(claims.delivery_id, "delivery_id"),
    grant_id: requireIdentifier(claims.grant_id, "grant_id"),
    workflow_id: requireIdentifier(claims.workflow_id, "workflow_id"),
    request_hash: requireIdentifier(claims.request_hash, "request_hash"),
    result_revision: requireRevision(claims.result_revision, "result_revision"),
    applied_at: requireCanonicalTimestamp(claims.applied_at, "applied_at"),
  };
  return finalizeClaims(claims, validated, requireCanonical);
}

function assertExactFields(value, expectedFields) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw ticketError("ticket_claims_invalid", "Re-entry token claims must be an object", 422);
  }
  const actualFields = Object.keys(value).sort();
  const contractFields = [...expectedFields].sort();
  if (
    actualFields.length !== contractFields.length
    || actualFields.some((field, index) => field !== contractFields[index])
  ) {
    throw ticketError("ticket_fields_invalid", "Re-entry token fields do not match the strict contract", 422);
  }
}

function finalizeClaims(original, validated, requireCanonical) {
  if (requireCanonical && JSON.stringify(original) !== JSON.stringify(validated)) {
    throw ticketError("ticket_payload_noncanonical", "Re-entry token payload is not canonical", 422);
  }
  return Object.freeze(validated);
}

function requireIdentifier(value, field) {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) {
    throw ticketError("ticket_claim_invalid", `${field} is invalid`, 422);
  }
  return value;
}

function requireRevision(value, field) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw ticketError("ticket_claim_invalid", `${field} is invalid`, 422);
  }
  return value;
}

function requireCanonicalTimestamp(value, field) {
  if (typeof value !== "string") {
    throw ticketError("ticket_claim_invalid", `${field} is invalid`, 422);
  }
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== value) {
    throw ticketError("ticket_claim_invalid", `${field} is invalid`, 422);
  }
  return value;
}

function requireCanonicalUrl(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 2_048) {
    throw ticketError("ticket_claim_invalid", "canonical_url is invalid", 422);
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw ticketError("ticket_claim_invalid", "canonical_url is invalid", 422);
  }
  if (
    !["http:", "https:"].includes(parsed.protocol)
    || parsed.username
    || parsed.password
    || parsed.hash
    || parsed.href !== value
  ) {
    throw ticketError("ticket_claim_invalid", "canonical_url is invalid", 422);
  }
  return value;
}

function requireSecret(secret) {
  if (
    !((typeof secret === "string" && Buffer.byteLength(secret, "utf8") >= 32)
      || (Buffer.isBuffer(secret) && secret.byteLength >= 32))
  ) {
    throw ticketError(
      "ticket_secret_invalid",
      "Re-entry ticket secret must contain at least 32 bytes",
      500,
    );
  }
  return secret;
}

function requireNow(now) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw ticketError("ticket_clock_invalid", "Re-entry ticket clock is invalid", 500);
  }
  return now;
}

function isCanonicalBase64url(value) {
  return typeof value === "string" && BASE64URL_PATTERN.test(value) && !value.includes("=");
}

function constantTimeTextMatch(actual, expected) {
  const actualBuffer = Buffer.from(actual, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function ticketError(code, message, statusCode) {
  return new ReentryTicketError(code, message, statusCode);
}
