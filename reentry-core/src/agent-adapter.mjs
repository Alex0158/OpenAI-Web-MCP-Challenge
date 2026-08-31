import {
  PROTOCOL_VERSION,
  validateContinuationReceipt,
} from "./protocol.mjs";

export const AGENT_ACTIVATION_TYPE = "webmcp.agent_activation";
export const AGENT_ACTIVATION_RESULT_TYPE = "webmcp.agent_activation_result";
export const AGENT_ADAPTER_CAPABILITIES = Object.freeze([
  "managed_context_resume",
  "eligible_browser",
  "canonical_page_navigation",
  "page_bound_webmcp",
]);

const DELIVERY_LEASE_TYPE = "webmcp.delivery_lease";
const MAXIMUM_ATTEMPTS = 100;
const MINIMUM_TIMEOUT_MS = 100;
const MAXIMUM_TIMEOUT_MS = 60_000;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const CLAIM_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const DISPATCH_FIELDS = Object.freeze(["adapter", "lease", "now", "timeoutMs"]);
const CREATE_FIELDS = Object.freeze(["lease", "now"]);
const VALIDATE_RESULT_FIELDS = Object.freeze(["activation", "result"]);
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
]);
const ACTIVATION_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "delivery_id",
  "event_id",
  "attempt",
  "lease_expires_at",
  "continuation",
  "receipt",
]);
const RESULT_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "delivery_id",
  "event_id",
  "attempt",
  "outcome",
  "code",
  "unavailable_capability",
]);
const RESULT_RULES = Object.freeze({
  accepted: Object.freeze({
    codes: Object.freeze(["activation_dispatch_accepted"]),
    capability: "absent",
  }),
  unsupported: Object.freeze({
    codes: Object.freeze(["required_capability_unavailable"]),
    capability: "required",
  }),
  rejected: Object.freeze({
    codes: Object.freeze(["activation_rejected"]),
    capability: "absent",
  }),
  outcome_unknown: Object.freeze({
    codes: Object.freeze([
      "activation_outcome_unknown",
      "adapter_invocation_failed",
      "adapter_invocation_timed_out",
      "adapter_result_invalid",
    ]),
    capability: "absent",
  }),
});
const TIMEOUT = Symbol("agent-adapter-timeout");

export class AgentAdapterContractError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "AgentAdapterContractError";
    this.code = code;
  }
}

export function createAgentActivation(input) {
  requireExactRecord(input, CREATE_FIELDS, "Agent activation creation input");
  const now = requireDate(input.now, "Agent activation current time");
  const lease = normalizeLease(input.lease, now);
  return deepFreeze({
    type: AGENT_ACTIVATION_TYPE,
    protocol_version: PROTOCOL_VERSION,
    delivery_id: lease.delivery_id,
    event_id: lease.event_id,
    attempt: lease.attempt,
    lease_expires_at: lease.lease_expires_at,
    continuation: lease.continuation,
    receipt: lease.receipt,
  });
}

export function validateAgentActivation(activation) {
  return deepFreeze(normalizeActivation(activation));
}

export function validateAgentActivationResult(input) {
  requireExactRecord(input, VALIDATE_RESULT_FIELDS, "Agent result validation input");
  const activation = validateAgentActivation(input.activation);
  return normalizeResult(input.result, activation);
}

export async function dispatchAgentActivation(input) {
  requireExactRecord(input, DISPATCH_FIELDS, "Agent activation dispatch input");
  const timeoutMs = requireTimeout(input.timeoutMs);
  const activation = createAgentActivation({ lease: input.lease, now: input.now });
  const adapter = requireAdapter(input.adapter);
  const remainingMs = Date.parse(activation.lease_expires_at) - input.now.getTime();
  const effectiveTimeoutMs = Math.max(1, Math.min(timeoutMs, remainingMs));

  let timer;
  let rawResult;
  try {
    rawResult = await Promise.race([
      Promise.resolve().then(() => adapter.activate(activation)),
      new Promise((resolve) => {
        timer = setTimeout(resolve, effectiveTimeoutMs, TIMEOUT);
      }),
    ]);
  } catch {
    return unknownResult(activation, "adapter_invocation_failed");
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }

  if (rawResult === TIMEOUT) {
    return unknownResult(activation, "adapter_invocation_timed_out");
  }
  try {
    return validateAgentActivationResult({ activation, result: rawResult });
  } catch {
    return unknownResult(activation, "adapter_result_invalid");
  }
}

function normalizeLease(value, now) {
  requireExactRecord(value, LEASE_FIELDS, "Delivery lease");
  if (
    value.type !== DELIVERY_LEASE_TYPE ||
    value.protocol_version !== PROTOCOL_VERSION
  ) {
    throw contractError("agent_activation_lease_invalid", "Delivery lease version is unsupported");
  }
  const leaseExpiresAt = requireTimestamp(
    value.lease_expires_at,
    "Delivery lease expiry",
  );
  if (Date.parse(leaseExpiresAt) <= now.getTime()) {
    throw contractError("agent_activation_expired", "Delivery lease has expired");
  }
  const continuation = normalizeContinuation(value.continuation);
  let receipt;
  try {
    receipt = validateContinuationReceipt(value.receipt);
  } catch {
    throw contractError("agent_activation_receipt_invalid", "Continuation receipt is invalid");
  }
  if (Date.parse(receipt.expires_at) <= now.getTime()) {
    throw contractError("agent_activation_expired", "Continuation receipt has expired");
  }
  if (Date.parse(leaseExpiresAt) > Date.parse(receipt.expires_at)) {
    throw contractError(
      "agent_activation_scope_invalid",
      "Delivery lease exceeds continuation receipt authority",
    );
  }
  if (
    continuation.correlation_id !== receipt.correlation_id ||
    continuation.workflow_id !== receipt.workflow_id ||
    continuation.event_type !== receipt.event_type ||
    continuation.canonical_url !== receipt.canonical_url
  ) {
    throw contractError(
      "agent_activation_scope_invalid",
      "Delivery continuation and receipt do not match",
    );
  }
  requireClaimToken(value.lease_token);
  return {
    delivery_id: requireIdentifier(value.delivery_id, "Delivery identifier"),
    event_id: requireIdentifier(value.event_id, "Event identifier"),
    attempt: requireAttempt(value.attempt),
    lease_expires_at: leaseExpiresAt,
    continuation,
    receipt,
  };
}

function normalizeActivation(value) {
  requireExactRecord(value, ACTIVATION_FIELDS, "Agent activation");
  if (
    value.type !== AGENT_ACTIVATION_TYPE ||
    value.protocol_version !== PROTOCOL_VERSION
  ) {
    throw contractError("agent_activation_invalid", "Agent activation version is unsupported");
  }
  const continuation = normalizeContinuation(value.continuation);
  let receipt;
  try {
    receipt = validateContinuationReceipt(value.receipt);
  } catch {
    throw contractError("agent_activation_receipt_invalid", "Continuation receipt is invalid");
  }
  if (
    continuation.correlation_id !== receipt.correlation_id ||
    continuation.workflow_id !== receipt.workflow_id ||
    continuation.event_type !== receipt.event_type ||
    continuation.canonical_url !== receipt.canonical_url
  ) {
    throw contractError("agent_activation_scope_invalid", "Agent activation scope is invalid");
  }
  const leaseExpiresAt = requireTimestamp(
    value.lease_expires_at,
    "Activation lease expiry",
  );
  if (Date.parse(leaseExpiresAt) > Date.parse(receipt.expires_at)) {
    throw contractError(
      "agent_activation_scope_invalid",
      "Agent activation lease exceeds receipt authority",
    );
  }
  return {
    type: AGENT_ACTIVATION_TYPE,
    protocol_version: PROTOCOL_VERSION,
    delivery_id: requireIdentifier(value.delivery_id, "Activation delivery identifier"),
    event_id: requireIdentifier(value.event_id, "Activation event identifier"),
    attempt: requireAttempt(value.attempt),
    lease_expires_at: leaseExpiresAt,
    continuation,
    receipt,
  };
}

function normalizeContinuation(value) {
  requireExactRecord(value, CONTINUATION_FIELDS, "Delivery continuation");
  if (
    value.event_sequence !== 1 ||
    !Number.isSafeInteger(value.state_version) ||
    value.state_version < 0
  ) {
    throw contractError("agent_activation_continuation_invalid", "Continuation state is invalid");
  }
  return {
    correlation_id: requireIdentifier(value.correlation_id, "Continuation correlation identifier"),
    workflow_id: requireIdentifier(value.workflow_id, "Continuation workflow identifier"),
    event_type: requireIdentifier(value.event_type, "Continuation event type"),
    event_sequence: 1,
    state_version: value.state_version,
    occurred_at: requireTimestamp(value.occurred_at, "Continuation occurrence time"),
    canonical_url: value.canonical_url,
  };
}

function normalizeResult(value, activation) {
  requireExactRecord(value, RESULT_FIELDS, "Agent activation result");
  if (
    value.type !== AGENT_ACTIVATION_RESULT_TYPE ||
    value.protocol_version !== PROTOCOL_VERSION ||
    value.delivery_id !== activation.delivery_id ||
    value.event_id !== activation.event_id ||
    value.attempt !== activation.attempt
  ) {
    throw contractError("agent_adapter_result_invalid", "Agent activation result is mismatched");
  }
  const rule = RESULT_RULES[value.outcome];
  if (!rule || !rule.codes.includes(value.code)) {
    throw contractError("agent_adapter_result_invalid", "Agent activation result is unsupported");
  }
  const capability = value.unavailable_capability;
  if (
    (rule.capability === "required" && !AGENT_ADAPTER_CAPABILITIES.includes(capability)) ||
    (rule.capability === "absent" && capability !== null)
  ) {
    throw contractError("agent_adapter_result_invalid", "Agent activation capability is invalid");
  }
  return deepFreeze({
    type: AGENT_ACTIVATION_RESULT_TYPE,
    protocol_version: PROTOCOL_VERSION,
    delivery_id: activation.delivery_id,
    event_id: activation.event_id,
    attempt: activation.attempt,
    outcome: value.outcome,
    code: value.code,
    unavailable_capability: capability,
  });
}

function unknownResult(activation, code) {
  return deepFreeze({
    type: AGENT_ACTIVATION_RESULT_TYPE,
    protocol_version: PROTOCOL_VERSION,
    delivery_id: activation.delivery_id,
    event_id: activation.event_id,
    attempt: activation.attempt,
    outcome: "outcome_unknown",
    code,
    unavailable_capability: null,
  });
}

function requireAdapter(value) {
  if (!value || (typeof value !== "object" && typeof value !== "function")) {
    throw contractError("agent_adapter_invalid", "Agent adapter must implement activate");
  }
  let activate;
  try {
    activate = value.activate;
  } catch {
    throw contractError("agent_adapter_invalid", "Agent adapter must implement activate");
  }
  if (typeof activate !== "function") {
    throw contractError("agent_adapter_invalid", "Agent adapter must implement activate");
  }
  return { activate: activate.bind(value) };
}

function requireTimeout(value) {
  if (
    !Number.isSafeInteger(value) ||
    value < MINIMUM_TIMEOUT_MS ||
    value > MAXIMUM_TIMEOUT_MS
  ) {
    throw contractError(
      "agent_adapter_timeout_invalid",
      "Agent adapter timeout must be between 100 and 60000 milliseconds",
    );
  }
  return value;
}

function requireDate(value, label) {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw contractError("agent_activation_time_invalid", `${label} must be a valid Date`);
  }
  return new Date(value.getTime());
}

function requireIdentifier(value, label) {
  if (
    typeof value !== "string" ||
    Buffer.byteLength(value, "utf8") > 160 ||
    !IDENTIFIER_PATTERN.test(value)
  ) {
    throw contractError("agent_activation_identifier_invalid", `${label} is invalid`);
  }
  return value;
}

function requireAttempt(value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > MAXIMUM_ATTEMPTS) {
    throw contractError("agent_activation_attempt_invalid", "Activation attempt is invalid");
  }
  return value;
}

function requireTimestamp(value, label) {
  if (typeof value !== "string" || value.length > 27) {
    throw contractError("agent_activation_timestamp_invalid", `${label} is invalid`);
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    throw contractError("agent_activation_timestamp_invalid", `${label} is invalid`);
  }
  return value;
}

function requireClaimToken(value) {
  if (typeof value !== "string" || !CLAIM_TOKEN_PATTERN.test(value)) {
    throw contractError("agent_activation_lease_invalid", "Delivery lease token is invalid");
  }
  const decoded = Buffer.from(value, "base64url");
  if (decoded.length !== 32 || decoded.toString("base64url") !== value) {
    throw contractError("agent_activation_lease_invalid", "Delivery lease token is invalid");
  }
}

function requireExactRecord(value, expectedFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw contractError("agent_adapter_contract_invalid", `${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw contractError("agent_adapter_contract_invalid", `${label} must be a plain object`);
  }
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      typeof key === "symbol" ||
      !descriptor?.enumerable ||
      !("value" in descriptor)
    ) {
      throw contractError(
        "agent_adapter_contract_invalid",
        `${label} must contain enumerable data fields only`,
      );
    }
  }
  const actual = Object.keys(value).sort();
  const expected = [...expectedFields].sort();
  if (
    actual.length !== expected.length ||
    actual.some((field, index) => field !== expected[index])
  ) {
    throw contractError("agent_adapter_contract_invalid", `${label} fields are invalid`);
  }
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function contractError(code, message) {
  return new AgentAdapterContractError(code, message);
}
