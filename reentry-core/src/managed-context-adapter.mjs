import {
  AGENT_ACTIVATION_RESULT_TYPE,
  validateAgentActivation,
} from "./agent-adapter.mjs";
import { PROTOCOL_VERSION } from "./protocol.mjs";

export const MANAGED_CONTEXT_BINDING_TYPE = "webmcp.managed_context_binding";

const OPTION_FIELDS = Object.freeze([
  "adapterId",
  "bindingAuthority",
  "activateBoundContext",
  "clock",
]);
const BINDING_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "grant_id",
  "adapter_id",
  "binding_ref",
  "bound_at",
  "expires_at",
]);
const RESOLUTION_FIELDS = Object.freeze(["grantId", "adapterId"]);
const DRIVER_FIELDS = Object.freeze(["activation", "bindingRef"]);
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const MAXIMUM_BINDING_REFERENCE_BYTES = 4 * 1_024;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export class ManagedContextBindingError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ManagedContextBindingError";
    this.code = code;
  }
}

export function createManagedContextAdapter(options) {
  requireExactRecord(options, OPTION_FIELDS, "Managed-context adapter options");
  const adapterId = requireIdentifier(options.adapterId, "Managed-context adapter identifier");
  const resolveBinding = requireAuthority(options.bindingAuthority);
  const activateBoundContext = requireFunction(
    options.activateBoundContext,
    "Managed-context activation driver",
  );
  const clock = requireFunction(options.clock, "Managed-context adapter clock");

  return Object.freeze({
    async activate(value) {
      const activation = validateAgentActivation(value);
      if (activation.protocol_version !== PROTOCOL_VERSION) {
        throw bindingError(
          "managed_context_activation_version_invalid",
          "Managed-context adapter does not support this activation protocol version",
        );
      }
      const now = readClock(clock);
      assertActivationLive(activation, now);
      const lookup = deepFreeze({
        grantId: activation.receipt.grant_id,
        adapterId,
      });
      requireExactRecord(lookup, RESOLUTION_FIELDS, "Managed-context binding lookup");
      const rawBinding = await resolveBinding(lookup);
      const resolutionTime = readClock(clock);
      assertActivationLive(activation, resolutionTime);
      if (rawBinding === null) {
        return activationResult(
          activation,
          "unsupported",
          "required_capability_unavailable",
          "managed_context_resume",
        );
      }

      const binding = normalizeBinding(rawBinding, activation, adapterId, resolutionTime);
      if (Date.parse(binding.expires_at) <= resolutionTime.getTime()) {
        return activationResult(activation, "rejected", "activation_rejected", null);
      }
      if (Date.parse(binding.expires_at) < Date.parse(activation.lease_expires_at)) {
        throw bindingError(
          "managed_context_binding_scope_invalid",
          "Managed-context binding expires before the activation lease",
        );
      }

      const driverInput = deepFreeze({
        activation,
        bindingRef: binding.binding_ref,
      });
      requireExactRecord(driverInput, DRIVER_FIELDS, "Managed-context driver input");
      return activateBoundContext(driverInput);
    },
  });
}

function normalizeBinding(value, activation, adapterId, now) {
  requireExactRecord(value, BINDING_FIELDS, "Managed-context binding");
  if (
    value.type !== MANAGED_CONTEXT_BINDING_TYPE ||
    value.protocol_version !== PROTOCOL_VERSION
  ) {
    throw bindingError(
      "managed_context_binding_version_invalid",
      "Managed-context binding version is unsupported",
    );
  }
  const grantId = requireIdentifier(value.grant_id, "Managed-context binding Grant identifier");
  const resolvedAdapterId = requireIdentifier(
    value.adapter_id,
    "Managed-context binding adapter identifier",
  );
  if (grantId !== activation.receipt.grant_id || resolvedAdapterId !== adapterId) {
    throw bindingError(
      "managed_context_binding_scope_invalid",
      "Managed-context binding is outside the activation scope",
    );
  }
  const boundAt = requireTimestamp(value.bound_at, "Managed-context binding time");
  const expiresAt = requireTimestamp(value.expires_at, "Managed-context binding expiry");
  if (
    Date.parse(boundAt) > now.getTime() ||
    Date.parse(expiresAt) <= Date.parse(boundAt) ||
    Date.parse(expiresAt) > Date.parse(activation.receipt.expires_at)
  ) {
    throw bindingError(
      "managed_context_binding_time_invalid",
      "Managed-context binding time is outside the Receipt authority",
    );
  }
  return deepFreeze({
    type: MANAGED_CONTEXT_BINDING_TYPE,
    protocol_version: PROTOCOL_VERSION,
    grant_id: grantId,
    adapter_id: resolvedAdapterId,
    binding_ref: requireBindingReference(value.binding_ref),
    bound_at: boundAt,
    expires_at: expiresAt,
  });
}

function assertActivationLive(activation, now) {
  if (
    Date.parse(activation.lease_expires_at) <= now.getTime() ||
    Date.parse(activation.receipt.expires_at) <= now.getTime()
  ) {
    throw bindingError(
      "managed_context_activation_expired",
      "Managed-context activation authority has expired",
    );
  }
}

function activationResult(activation, outcome, code, capability) {
  return deepFreeze({
    type: AGENT_ACTIVATION_RESULT_TYPE,
    protocol_version: PROTOCOL_VERSION,
    delivery_id: activation.delivery_id,
    event_id: activation.event_id,
    attempt: activation.attempt,
    outcome,
    code,
    unavailable_capability: capability,
  });
}

function requireAuthority(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw bindingError(
      "managed_context_binding_authority_invalid",
      "Managed-context binding authority must implement resolveBinding",
    );
  }
  const descriptor = Object.getOwnPropertyDescriptor(value, "resolveBinding");
  if (!descriptor?.enumerable || !("value" in descriptor) || typeof descriptor.value !== "function") {
    throw bindingError(
      "managed_context_binding_authority_invalid",
      "Managed-context binding authority must implement resolveBinding",
    );
  }
  return descriptor.value.bind(value);
}

function requireFunction(value, label) {
  if (typeof value !== "function") {
    throw bindingError("managed_context_adapter_invalid", `${label} must be a function`);
  }
  return value;
}

function readClock(clock) {
  const value = clock();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw bindingError(
      "managed_context_binding_time_invalid",
      "Managed-context adapter clock must return a valid Date",
    );
  }
  return new Date(value.getTime());
}

function requireIdentifier(value, label) {
  if (
    typeof value !== "string" ||
    Buffer.byteLength(value, "utf8") > 160 ||
    !IDENTIFIER_PATTERN.test(value)
  ) {
    throw bindingError("managed_context_binding_identifier_invalid", `${label} is invalid`);
  }
  return value;
}

function requireBindingReference(value) {
  if (
    typeof value !== "string" ||
    value.trim() !== value ||
    value.length === 0 ||
    Buffer.byteLength(value, "utf8") > MAXIMUM_BINDING_REFERENCE_BYTES ||
    CONTROL_CHARACTER_PATTERN.test(value)
  ) {
    throw bindingError(
      "managed_context_binding_reference_invalid",
      "Managed-context binding reference is invalid",
    );
  }
  return value;
}

function requireTimestamp(value, label) {
  if (typeof value !== "string" || value.length > 27) {
    throw bindingError("managed_context_binding_timestamp_invalid", `${label} is invalid`);
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    throw bindingError("managed_context_binding_timestamp_invalid", `${label} is invalid`);
  }
  return value;
}

function requireExactRecord(value, expectedFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw bindingError("managed_context_binding_contract_invalid", `${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw bindingError("managed_context_binding_contract_invalid", `${label} must be a plain object`);
  }
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      typeof key === "symbol" ||
      !descriptor?.enumerable ||
      !("value" in descriptor)
    ) {
      throw bindingError(
        "managed_context_binding_contract_invalid",
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
    throw bindingError("managed_context_binding_contract_invalid", `${label} fields are invalid`);
  }
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function bindingError(code, message) {
  return new ManagedContextBindingError(code, message);
}
