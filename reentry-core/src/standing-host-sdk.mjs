import { randomUUID } from "node:crypto";

import {
  EVENT_TYPE,
  MANIFEST_TYPE,
  ProtocolValidationError,
} from "./protocol.mjs";
import {
  STANDING_AUTHORIZATION_MODE,
  STANDING_MAX_ACTIVE_ACTIVATIONS,
  STANDING_PROTOCOL_VERSION,
  createStandingContinuationEvent,
  createStandingContinuationEventEnvelope,
  createStandingPublicBinding,
  createStandingReentryManifest,
} from "./standing-protocol.mjs";

const SDK_OPTION_FIELDS = Object.freeze([
  "origin",
  "privateKey",
  "keyId",
  "clock",
  "createId",
]);
const MANIFEST_INPUT_FIELDS = Object.freeze([
  "manifestId",
  "correlationId",
  "issuedAt",
  "offerExpiresAt",
  "workflow",
  "display",
  "grantRequest",
]);
const MANIFEST_REQUIRED_FIELDS = Object.freeze([
  "offerExpiresAt",
  "workflow",
  "display",
  "grantRequest",
]);
const MANIFEST_WORKFLOW_FIELDS = Object.freeze([
  "id",
  "type",
  "stateVersion",
  "canonicalUrl",
]);
const MANIFEST_DISPLAY_FIELDS = Object.freeze(["title", "reason"]);
const MANIFEST_GRANT_FIELDS = Object.freeze([
  "eventType",
  "grantExpiresAt",
  "humanBoundary",
]);
const EVENT_INPUT_FIELDS = Object.freeze([
  "binding",
  "workflow",
  "eventId",
  "eventSequence",
  "occurredAt",
  "deliveryTimestamp",
]);
const EVENT_REQUIRED_FIELDS = Object.freeze([
  "binding",
  "workflow",
  "eventId",
  "eventSequence",
  "occurredAt",
]);
const EVENT_WORKFLOW_FIELDS = Object.freeze(["id", "stateVersion", "canonicalUrl"]);

/**
 * Server-side Host signer for protocol-v0.2 standing authorization.
 *
 * Event identity, sequence, occurrence time, and workflow snapshot are explicit inputs so the Host
 * can persist them with its business transition and retry the same canonical Event after restart.
 * This SDK deliberately owns no in-memory sequence counter or outbox state.
 */
export class StandingReentryHostSdk {
  #origin;
  #privateKey;
  #keyId;
  #clock;
  #createId;

  constructor(options) {
    requireSdkRecord(
      options,
      SDK_OPTION_FIELDS,
      ["origin", "privateKey", "keyId"],
      "Standing Host SDK options",
    );
    this.#origin = requireCanonicalOrigin(options.origin);
    this.#privateKey = options.privateKey;
    this.#keyId = options.keyId;
    this.#clock = options.clock ?? (() => new Date());
    this.#createId = options.createId ?? ((prefix) => `${prefix}_${randomUUID()}`);

    if (typeof this.#clock !== "function") {
      throw new TypeError("Standing Host SDK clock must be a function");
    }
    if (typeof this.#createId !== "function") {
      throw new TypeError("Standing Host SDK createId must be a function");
    }
  }

  issueManifest(input) {
    requireSdkRecord(
      input,
      MANIFEST_INPUT_FIELDS,
      MANIFEST_REQUIRED_FIELDS,
      "Standing Host Manifest input",
    );
    requireSdkRecord(
      input.workflow,
      MANIFEST_WORKFLOW_FIELDS,
      MANIFEST_WORKFLOW_FIELDS,
      "Standing Host Manifest workflow",
    );
    requireSdkRecord(
      input.display,
      MANIFEST_DISPLAY_FIELDS,
      MANIFEST_DISPLAY_FIELDS,
      "Standing Host Manifest display",
    );
    requireSdkRecord(
      input.grantRequest,
      MANIFEST_GRANT_FIELDS,
      MANIFEST_GRANT_FIELDS,
      "Standing Host Manifest grant request",
    );

    const now = this.#readClock();
    return createStandingReentryManifest({
      type: MANIFEST_TYPE,
      protocol_version: STANDING_PROTOCOL_VERSION,
      manifest_id: this.#resolveId("manifest", input.manifestId),
      correlation_id: this.#resolveId("correlation", input.correlationId),
      issuer_origin: this.#origin,
      issued_at: input.issuedAt ?? now.toISOString(),
      offer_expires_at: input.offerExpiresAt,
      workflow: {
        id: input.workflow.id,
        type: input.workflow.type,
        state_version: input.workflow.stateVersion,
        canonical_url: input.workflow.canonicalUrl,
      },
      display: {
        title: input.display.title,
        reason: input.display.reason,
      },
      grant_request: {
        authorization_mode: STANDING_AUTHORIZATION_MODE,
        event_type: input.grantRequest.eventType,
        grant_expires_at: input.grantRequest.grantExpiresAt,
        max_active_activations: STANDING_MAX_ACTIVE_ACTIVATIONS,
        human_boundary: input.grantRequest.humanBoundary,
      },
    }, {
      privateKey: this.#privateKey,
      keyId: this.#keyId,
    });
  }

  issueEvent(input) {
    requireSdkRecord(
      input,
      EVENT_INPUT_FIELDS,
      EVENT_REQUIRED_FIELDS,
      "Standing Host Event input",
    );
    requireSdkRecord(
      input.workflow,
      EVENT_WORKFLOW_FIELDS,
      EVENT_WORKFLOW_FIELDS,
      "Standing Host Event workflow",
    );

    const now = this.#readClock();
    const binding = createStandingPublicBinding(input.binding);
    assertLiveBinding(binding, now);
    if (input.workflow.id !== binding.workflow_id) {
      throw sdkValidation(
        "host_workflow_binding_mismatch",
        "Standing Host workflow does not match the Receiver-issued binding",
      );
    }

    const event = createStandingContinuationEvent({
      type: EVENT_TYPE,
      protocol_version: STANDING_PROTOCOL_VERSION,
      event_id: input.eventId,
      correlation_id: binding.correlation_id,
      binding_id: binding.binding_id,
      issuer_origin: this.#origin,
      workflow_id: binding.workflow_id,
      event_type: binding.event_type,
      event_sequence: input.eventSequence,
      state_version: input.workflow.stateVersion,
      occurred_at: input.occurredAt,
      canonical_url: input.workflow.canonicalUrl,
    });
    const envelope = createStandingContinuationEventEnvelope(event, {
      privateKey: this.#privateKey,
      keyId: this.#keyId,
      timestamp: input.deliveryTimestamp ?? String(Math.floor(now.getTime() / 1_000)),
    });

    return Object.freeze({
      event,
      body: envelope.body,
      headers: envelope.headers,
    });
  }

  #readClock() {
    const value = this.#clock();
    if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
      throw new TypeError("Standing Host SDK clock must return a valid Date");
    }
    return new Date(value.getTime());
  }

  #resolveId(prefix, supplied) {
    if (supplied !== undefined) return supplied;
    const created = this.#createId(prefix);
    if (typeof created !== "string") {
      throw new TypeError("Standing Host SDK createId must return a string");
    }
    return created;
  }
}

function assertLiveBinding(binding, now) {
  if (binding.status !== "active") {
    throw sdkValidation("host_binding_inactive", "Standing Host binding is not active");
  }
  if (Date.parse(binding.expires_at) <= now.getTime()) {
    throw sdkValidation("host_binding_expired", "Standing Host binding has expired", 410);
  }
}

function requireSdkRecord(value, allowedFields, requiredFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw sdkValidation("host_input_invalid", `${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw sdkValidation("host_input_invalid", `${label} must be a plain object`);
  }

  for (const key of Reflect.ownKeys(value)) {
    if (typeof key === "symbol") {
      throw sdkValidation("host_input_invalid", `${label} cannot contain symbol properties`);
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !("value" in descriptor)) {
      throw sdkValidation(
        "host_input_invalid",
        `${label} must contain enumerable data properties only`,
      );
    }
  }

  const fields = Object.keys(value);
  if (fields.some((field) => !allowedFields.includes(field))) {
    throw sdkValidation("host_input_fields_invalid", `${label} contains an unsupported field`);
  }
  if (requiredFields.some((field) => !fields.includes(field))) {
    throw sdkValidation("host_input_fields_invalid", `${label} is missing a required field`);
  }
}

function requireCanonicalOrigin(value) {
  if (typeof value !== "string") {
    throw sdkValidation(
      "host_origin_invalid",
      "Standing Host origin must be a canonical HTTP(S) origin",
    );
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw sdkValidation(
      "host_origin_invalid",
      "Standing Host origin must be a canonical HTTP(S) origin",
    );
  }
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.origin !== value ||
    parsed.username ||
    parsed.password
  ) {
    throw sdkValidation(
      "host_origin_invalid",
      "Standing Host origin must be a canonical HTTP(S) origin",
    );
  }
  return value;
}

function sdkValidation(code, message, statusCode) {
  return new ProtocolValidationError(code, message, statusCode);
}
