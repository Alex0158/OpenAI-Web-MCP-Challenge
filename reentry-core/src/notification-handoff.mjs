import { ProtocolValidationError } from "./protocol.mjs";

export const NOTIFICATION_HANDOFF_PROTOCOL_VERSION = "0.2";
export const RUNTIME_ADMISSION_ATTESTATION_TYPE = "webmcp.runtime_admission_attestation";
export const NOTIFICATION_HANDOFF_RECEIPT_TYPE = "webmcp.notification_handoff_receipt";

const RUNTIME_ADMISSION_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "admission_id",
  "adapter_id",
  "binding_generation",
  "delivery_id",
  "event_id",
  "handoff_id",
  "accepted_at",
]);
const NOTIFICATION_HANDOFF_RECEIPT_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "delivery_id",
  "event_id",
  "handoff_id",
  "correlation_id",
  "workflow_id",
  "status",
  "duplicate",
  "runtime_admission_ref",
]);
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const DIGEST_PATTERN = /^[0-9a-f]{64}$/;
const MAX_TIMESTAMP_CHARACTERS = 27;
const FUTURE_CLOCK_SKEW_MS = 60 * 1_000;

/**
 * Validate the opaque, correlation-only runtime evidence used by the additive
 * standing notification profile. This value deliberately carries no platform
 * task locator or credential. The Receiver's configured authority still owns
 * the trust decision; this function only enforces the shared wire shape.
 */
export function validateRuntimeAdmissionAttestation(value, expected = {}) {
  requireExactRecord(value, RUNTIME_ADMISSION_FIELDS, "Runtime admission attestation");
  if (
    value.type !== RUNTIME_ADMISSION_ATTESTATION_TYPE ||
    value.protocol_version !== NOTIFICATION_HANDOFF_PROTOCOL_VERSION
  ) {
    throw validation(
      "runtime_admission_version_invalid",
      "Runtime admission attestation version is unsupported",
    );
  }
  const normalized = {
    type: RUNTIME_ADMISSION_ATTESTATION_TYPE,
    protocol_version: NOTIFICATION_HANDOFF_PROTOCOL_VERSION,
    admission_id: requireIdentifier(value.admission_id, "admission_id"),
    adapter_id: requireIdentifier(value.adapter_id, "adapter_id"),
    binding_generation: requireDigest(value.binding_generation, "binding_generation"),
    delivery_id: requireIdentifier(value.delivery_id, "delivery_id"),
    event_id: requireIdentifier(value.event_id, "event_id"),
    handoff_id: requireIdentifier(value.handoff_id, "handoff_id"),
    accepted_at: requireTimestamp(value.accepted_at, "accepted_at"),
  };
  assertExpected(normalized, expected);
  return deepFreeze(normalized);
}

/** Create a canonical notification receipt after a trusted Receiver decision. */
export function createNotificationHandoffReceipt(value) {
  requireExactRecord(
    value,
    NOTIFICATION_HANDOFF_RECEIPT_FIELDS,
    "Notification handoff receipt",
  );
  if (
    value.type !== NOTIFICATION_HANDOFF_RECEIPT_TYPE ||
    value.protocol_version !== NOTIFICATION_HANDOFF_PROTOCOL_VERSION ||
    value.status !== "handed_off" ||
    typeof value.duplicate !== "boolean"
  ) {
    throw validation(
      "notification_handoff_receipt_invalid",
      "Notification handoff receipt is invalid",
    );
  }
  return deepFreeze({
    type: NOTIFICATION_HANDOFF_RECEIPT_TYPE,
    protocol_version: NOTIFICATION_HANDOFF_PROTOCOL_VERSION,
    delivery_id: requireIdentifier(value.delivery_id, "delivery_id"),
    event_id: requireIdentifier(value.event_id, "event_id"),
    handoff_id: requireIdentifier(value.handoff_id, "handoff_id"),
    correlation_id: requireIdentifier(value.correlation_id, "correlation_id"),
    workflow_id: requireIdentifier(value.workflow_id, "workflow_id"),
    status: "handed_off",
    duplicate: value.duplicate,
    runtime_admission_ref: requireIdentifier(
      value.runtime_admission_ref,
      "runtime_admission_ref",
    ),
  });
}

/** Validate a received receipt and bind it to the handoff identity we sent. */
export function validateNotificationHandoffReceipt(value, expected = {}) {
  const receipt = createNotificationHandoffReceipt(value);
  if (expected.deliveryId !== undefined && receipt.delivery_id !== expected.deliveryId) {
    throw validation(
      "notification_handoff_receipt_scope_invalid",
      "Notification receipt delivery does not match the request",
    );
  }
  if (expected.eventId !== undefined && receipt.event_id !== expected.eventId) {
    throw validation(
      "notification_handoff_receipt_scope_invalid",
      "Notification receipt Event does not match the request",
    );
  }
  if (expected.handoffId !== undefined && receipt.handoff_id !== expected.handoffId) {
    throw validation(
      "notification_handoff_receipt_scope_invalid",
      "Notification receipt handoff does not match the request",
    );
  }
  return receipt;
}

function assertExpected(value, expected) {
  const checks = [
    ["deliveryId", "delivery_id", "Runtime admission delivery is out of scope"],
    ["eventId", "event_id", "Runtime admission Event is out of scope"],
    ["handoffId", "handoff_id", "Runtime admission handoff is out of scope"],
  ];
  for (const [expectedName, field, message] of checks) {
    if (expected[expectedName] !== undefined && value[field] !== expected[expectedName]) {
      throw validation("runtime_admission_scope_invalid", message);
    }
  }
  if (expected.now !== undefined) {
    const now = expected.now;
    if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
      throw new TypeError("Runtime admission validation clock must be a valid Date");
    }
    if (Date.parse(value.accepted_at) > now.getTime() + FUTURE_CLOCK_SKEW_MS) {
      throw validation(
        "runtime_admission_time_invalid",
        "Runtime admission attestation is in the future",
      );
    }
  }
}

function requireExactRecord(value, fields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw validation("runtime_admission_input_invalid", `${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw validation("runtime_admission_input_invalid", `${label} must be a plain object`);
  }
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key === "symbol" || !descriptor?.enumerable || !("value" in descriptor)) {
      throw validation("runtime_admission_input_invalid", `${label} contains an invalid property`);
    }
  }
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  if (
    actual.length !== expected.length ||
    actual.some((field, index) => field !== expected[index])
  ) {
    throw validation("runtime_admission_input_fields_invalid", `${label} fields are invalid`);
  }
}

function requireIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) {
    throw validation("runtime_admission_input_invalid", `${label} is invalid`);
  }
  return value;
}

function requireDigest(value, label) {
  if (typeof value !== "string" || !DIGEST_PATTERN.test(value)) {
    throw validation("runtime_admission_input_invalid", `${label} is invalid`);
  }
  return value;
}

function requireTimestamp(value, label) {
  if (typeof value !== "string" || value.length > MAX_TIMESTAMP_CHARACTERS) {
    throw validation("runtime_admission_input_invalid", `${label} is invalid`);
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    throw validation("runtime_admission_input_invalid", `${label} is invalid`);
  }
  return value;
}

function validation(code, message) {
  return new ProtocolValidationError(code, message);
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
