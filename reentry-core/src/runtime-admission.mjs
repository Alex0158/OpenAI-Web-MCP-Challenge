import {
  createAgentActivation,
} from "./agent-adapter.mjs";
import {
  NOTIFICATION_HANDOFF_PROTOCOL_VERSION,
  validateRuntimeAdmissionAttestation,
} from "./notification-handoff.mjs";

export const RUNTIME_ADMISSION_RESULT_TYPE = "webmcp.runtime_admission_result";
export const RUNTIME_ADMISSION_CAPABILITY = "same_task_notification_admission";

/**
 * An Adapter uses this error when it can prove that the requested capability is unavailable
 * without attempting a runtime handoff. Core maps it to a typed unsupported result; all other
 * Adapter failures remain outcome_unknown because the runtime may have accepted the request.
 */
export class RuntimeAdmissionUnavailableError extends Error {
  constructor(message = "Same-task runtime admission is unavailable") {
    super(message);
    this.name = "RuntimeAdmissionUnavailableError";
    this.code = "runtime_admission_unavailable";
  }
}

const DISPATCH_FIELDS = Object.freeze(["adapter", "lease", "handoffId", "now", "timeoutMs"]);
const RESULT_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "delivery_id",
  "event_id",
  "attempt",
  "handoff_id",
  "outcome",
  "code",
  "unavailable_capability",
  "attestation",
]);
const MIN_TIMEOUT_MS = 100;
const MAX_TIMEOUT_MS = 60_000;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const TIMEOUT = Symbol("runtime-admission-timeout");

/**
 * Ask a private Adapter to admit a notification to its already-bound task.
 * The Adapter never receives Connector or lease credentials. A missing seam is
 * an explicit unsupported result; an error or timeout is intentionally unknown
 * because the host may have accepted the operation before the response failed.
 */
export async function dispatchRuntimeAdmission(input) {
  requireExactRecord(input, DISPATCH_FIELDS, "Runtime admission dispatch input");
  const now = requireDate(input.now);
  const timeoutMs = requireTimeout(input.timeoutMs);
  const handoffId = requireIdentifier(input.handoffId, "handoffId");
  const activation = createAgentActivation({ lease: input.lease, now });
  const base = {
    type: RUNTIME_ADMISSION_RESULT_TYPE,
    protocol_version: activation.protocol_version,
    delivery_id: activation.delivery_id,
    event_id: activation.event_id,
    attempt: activation.attempt,
    handoff_id: handoffId,
  };
  if (activation.protocol_version !== NOTIFICATION_HANDOFF_PROTOCOL_VERSION) {
    return result(base, "unsupported", "runtime_admission_protocol_unsupported", RUNTIME_ADMISSION_CAPABILITY, null);
  }
  if (Date.parse(activation.lease_expires_at) <= now.getTime()) {
    return result(base, "outcome_unknown", "runtime_admission_expired", null, null);
  }
  const adapter = requireAdapter(input.adapter);
  if (!adapter) {
    return result(base, "unsupported", "runtime_admission_unavailable", RUNTIME_ADMISSION_CAPABILITY, null);
  }
  const remainingMs = Math.max(1, Math.min(timeoutMs, Date.parse(activation.lease_expires_at) - now.getTime()));
  let timer;
  let rawAttestation;
  try {
    rawAttestation = await Promise.race([
      Promise.resolve().then(() => adapter.admitNotification({
        activation,
        handoffId,
        now,
      })),
      new Promise((resolve) => {
        timer = setTimeout(resolve, remainingMs, TIMEOUT);
      }),
    ]);
  } catch (error) {
    if (error?.code === "runtime_admission_unavailable") {
      return result(base, "unsupported", "runtime_admission_unavailable", RUNTIME_ADMISSION_CAPABILITY, null);
    }
    return result(base, "outcome_unknown", "runtime_admission_invocation_failed", null, null);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
  if (rawAttestation === TIMEOUT) {
    return result(base, "outcome_unknown", "runtime_admission_invocation_timed_out", null, null);
  }
  let attestation;
  try {
    attestation = validateRuntimeAdmissionAttestation(rawAttestation, {
      deliveryId: activation.delivery_id,
      eventId: activation.event_id,
      handoffId,
      now,
    });
  } catch {
    return result(base, "outcome_unknown", "runtime_admission_result_invalid", null, null);
  }
  if (Date.parse(attestation.accepted_at) >= Date.parse(activation.lease_expires_at)) {
    return result(base, "outcome_unknown", "runtime_admission_result_invalid", null, null);
  }
  return result(base, "admitted", "runtime_admission_accepted", null, attestation);
}

function result(base, outcome, code, unavailableCapability, attestation) {
  const value = {
    ...base,
    outcome,
    code,
    unavailable_capability: unavailableCapability,
    attestation,
  };
  requireExactRecord(value, RESULT_FIELDS, "Runtime admission result");
  return Object.freeze(value);
}

function requireAdapter(value) {
  if (!value || (typeof value !== "object" && typeof value !== "function")) return null;
  try {
    return typeof value.admitNotification === "function"
      ? { admitNotification: value.admitNotification.bind(value) }
      : null;
  } catch {
    return null;
  }
}

function requireExactRecord(value, fields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${label} must be a plain object`);
  }
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  if (
    actual.length !== expected.length ||
    actual.some((field, index) => field !== expected[index])
  ) {
    throw new TypeError(`${label} fields are invalid`);
  }
}

function requireDate(value) {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new TypeError("Runtime admission clock must be a valid Date");
  }
  return new Date(value.getTime());
}

function requireTimeout(value) {
  if (!Number.isSafeInteger(value) || value < MIN_TIMEOUT_MS || value > MAX_TIMEOUT_MS) {
    throw new TypeError("Runtime admission timeout is invalid");
  }
  return value;
}

function requireIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) {
    throw new TypeError(`${label} is invalid`);
  }
  return value;
}
