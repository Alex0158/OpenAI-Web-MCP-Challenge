import { createHash } from "node:crypto";

import {
  PROTOCOL_LIMITS,
  PROTOCOL_VERSION,
  canonicalJson,
  parseContinuationEventBody,
  validateContinuationReceipt,
} from "./protocol.mjs";
import {
  authorization,
  conflict,
  deepFreeze,
  invariant,
  notFound,
  requireExactInput,
  requireIdentifier,
  requireOpaqueToken,
  requireTimestamp,
} from "./receiver-support.mjs";

export const CONNECTOR_IDENTITY_TYPE = "webmcp.connector_identity";
export const DELIVERY_LEASE_TYPE = "webmcp.delivery_lease";
export const HOST_EFFECT_ATTESTATION_TYPE = "webmcp.host_effect_attestation";
export const DELIVERY_ACKNOWLEDGEMENT_TYPE = "webmcp.delivery_acknowledgement";
export const HOST_EFFECT_OUTCOME = "effect_applied_awaiting_human";

const CLAIM_DELIVERY_FIELDS = Object.freeze(["connectorToken", "claimToken"]);
const ACKNOWLEDGE_DELIVERY_FIELDS = Object.freeze([
  "connectorToken",
  "deliveryId",
  "leaseToken",
  "effectToken",
]);
const CONNECTOR_IDENTITY_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "connector_id",
  "subject_id",
  "delivery_target_id",
  "authenticated_at",
  "expires_at",
]);
const HOST_EFFECT_ATTESTATION_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "effect_id",
  "delivery_id",
  "event_id",
  "correlation_id",
  "workflow_id",
  "outcome",
  "confirmed_at",
]);
const DELIVERY_STORE_METHODS = Object.freeze([
  "transaction",
  "getDeliveryById",
  "getDeliveryByEffectId",
  "getDeliveryByCurrentLeaseTokenDigest",
  "hasDeliveryAttemptTokenDigest",
  "getActiveDeliveryByTarget",
  "getNextDeliveryByTarget",
  "claimDelivery",
  "cancelDelivery",
  "exhaustDelivery",
  "acknowledgeDelivery",
]);
const AUTHORITY_FUTURE_SKEW_MS = 60 * 1_000;
const CLAIM_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export class ReceiverDelivery {
  #store;
  #connectorAuthority;
  #effectAuthority;
  #leaseDurationMs;
  #clock;

  constructor({ store, connectorAuthority, effectAuthority, leaseDurationMs, clock }) {
    requireDeliveryStore(store);
    if (typeof connectorAuthority?.verifyConnector !== "function") {
      throw new TypeError("Receiver delivery connectorAuthority must implement verifyConnector");
    }
    if (typeof effectAuthority?.verifyEffect !== "function") {
      throw new TypeError("Receiver delivery effectAuthority must implement verifyEffect");
    }
    if (!Number.isSafeInteger(leaseDurationMs) || leaseDurationMs < 1_000) {
      throw new TypeError("Receiver delivery leaseDurationMs must be at least one second");
    }
    if (typeof clock !== "function") {
      throw new TypeError("Receiver delivery clock must be a function");
    }
    this.#store = store;
    this.#connectorAuthority = connectorAuthority;
    this.#effectAuthority = effectAuthority;
    this.#leaseDurationMs = leaseDurationMs;
    this.#clock = clock;
  }

  claimDelivery(input) {
    requireExactInput(
      input,
      CLAIM_DELIVERY_FIELDS,
      CLAIM_DELIVERY_FIELDS,
      "Delivery claim input",
    );
    const connectorToken = requireOpaqueToken(
      input.connectorToken,
      "Connector token",
      "connector_token_invalid",
    );
    const claimToken = requireClaimToken(input.claimToken);
    const claimTokenDigest = digestToken(claimToken);
    const now = this.#readClock();
    const identity = this.#verifyConnector(connectorToken, now);
    const nowIso = now.toISOString();

    return this.#store.transaction((transaction) => {
      const replay = transaction.getDeliveryByCurrentLeaseTokenDigest(claimTokenDigest);
      if (replay) {
        assertConnectorScope(identity, replay);
        if (replay.current_connector_id !== identity.connector_id) {
          throw authorization(
            "delivery_lease_scope_invalid",
            "Delivery lease is owned by another Connector",
          );
        }
        const authorityEndReason = getGrantAuthorityEndReason(replay, now);
        if (replay.status === "leased" && authorityEndReason) {
          const exhausted = transaction.exhaustDelivery({
            delivery_id: replay.delivery_id,
            expected_attempt: replay.current_attempt,
            expected_connector_id: replay.current_connector_id,
            expected_lease_token_digest: replay.current_lease_token_digest,
            expected_lease_expires_at: replay.lease_expires_at,
            reason: authorityEndReason,
            updated_at: nowIso,
          });
          if (!exhausted) {
            throw conflict("delivery_claim_race", "Delivery exhaustion claim was lost");
          }
          return null;
        }
        if (
          replay.status === "leased" &&
          parseStoredTimestamp(replay.lease_expires_at, "lease_expires_at") > now.getTime()
        ) {
          return buildDeliveryLeaseResult(replay, claimToken, true);
        }
        throw conflict("claim_token_retired", "Delivery claim token is no longer claimable");
      }

      if (transaction.hasDeliveryAttemptTokenDigest(claimTokenDigest)) {
        throw conflict("claim_token_retired", "Delivery claim token was already used");
      }
      if (transaction.getActiveDeliveryByTarget(identity.delivery_target_id, nowIso)) {
        return null;
      }

      const candidate = transaction.getNextDeliveryByTarget(
        identity.delivery_target_id,
        nowIso,
      );
      if (!candidate) return null;
      assertConnectorScope(identity, candidate);

      const authorityEndReason = getGrantAuthorityEndReason(candidate, now);
      if (candidate.status === "pending") {
        if (candidate.current_attempt !== 0) {
          throw invariant("delivery_state_invalid", "Pending delivery has an invalid attempt count");
        }
        if (authorityEndReason) {
          const cancelled = transaction.cancelDelivery({
            delivery_id: candidate.delivery_id,
            reason: authorityEndReason,
            updated_at: nowIso,
          });
          if (!cancelled) {
            throw conflict("delivery_claim_race", "Delivery cancellation claim was lost");
          }
          return null;
        }
      } else if (candidate.status === "leased") {
        if (parseStoredTimestamp(candidate.lease_expires_at, "lease_expires_at") > now.getTime()) {
          throw invariant("delivery_state_invalid", "Claim candidate still has an active lease");
        }
        if (authorityEndReason || candidate.current_attempt >= candidate.maximum_attempts) {
          const exhausted = transaction.exhaustDelivery({
            delivery_id: candidate.delivery_id,
            expected_attempt: candidate.current_attempt,
            expected_connector_id: candidate.current_connector_id,
            expected_lease_token_digest: candidate.current_lease_token_digest,
            expected_lease_expires_at: candidate.lease_expires_at,
            reason: authorityEndReason ?? "attempt_limit_reached",
            updated_at: nowIso,
          });
          if (!exhausted) {
            throw conflict("delivery_claim_race", "Delivery exhaustion claim was lost");
          }
          return null;
        }
      } else {
        throw invariant("delivery_state_invalid", "Delivery claim candidate has an invalid state");
      }

      const leaseExpiresAtMs = Math.min(
        now.getTime() + this.#leaseDurationMs,
        parseStoredTimestamp(candidate.grant_expires_at, "grant_expires_at"),
        Date.parse(identity.expires_at),
      );
      if (!Number.isFinite(leaseExpiresAtMs) || leaseExpiresAtMs <= now.getTime()) {
        throw authorization(
          "connector_identity_expired",
          "Connector identity cannot support a live delivery lease",
        );
      }
      const attempt = candidate.current_attempt + 1;
      const leaseExpiresAt = new Date(leaseExpiresAtMs).toISOString();
      const claimed = transaction.claimDelivery({
        delivery_id: candidate.delivery_id,
        expected_status: candidate.status,
        expected_attempt: candidate.current_attempt,
        expected_connector_id: candidate.current_connector_id,
        expected_lease_token_digest: candidate.current_lease_token_digest,
        expected_lease_expires_at: candidate.lease_expires_at,
        attempt,
        connector_id: identity.connector_id,
        lease_token_digest: claimTokenDigest,
        leased_at: nowIso,
        lease_expires_at: leaseExpiresAt,
        updated_at: nowIso,
      });
      if (!claimed) {
        throw conflict("delivery_claim_race", "Delivery lease claim was lost");
      }
      return buildDeliveryLeaseResult({
        ...candidate,
        status: "leased",
        current_attempt: attempt,
        current_connector_id: identity.connector_id,
        current_lease_token_digest: claimTokenDigest,
        leased_at: nowIso,
        lease_expires_at: leaseExpiresAt,
        terminal_reason: null,
        updated_at: nowIso,
      }, claimToken, false);
    });
  }

  acknowledgeDelivery(input) {
    requireExactInput(
      input,
      ACKNOWLEDGE_DELIVERY_FIELDS,
      ACKNOWLEDGE_DELIVERY_FIELDS,
      "Delivery acknowledgement input",
    );
    const connectorToken = requireOpaqueToken(
      input.connectorToken,
      "Connector token",
      "connector_token_invalid",
    );
    const deliveryId = requireIdentifier(input.deliveryId, "deliveryId");
    const leaseToken = requireClaimToken(input.leaseToken, "Delivery lease token");
    const effectToken = requireOpaqueToken(
      input.effectToken,
      "Host-effect token",
      "host_effect_token_invalid",
    );
    const leaseTokenDigest = digestToken(leaseToken);
    const now = this.#readClock();
    const identity = this.#verifyConnector(connectorToken, now);
    const initial = this.#store.getDeliveryById(deliveryId);
    if (!initial) {
      throw notFound("delivery_not_found", "Delivery was not found");
    }
    assertCurrentLease(identity, initial, leaseTokenDigest);
    const effect = this.#verifyEffect(effectToken, initial, now);
    assertEffectWindow(effect, initial, now);
    const effectJson = canonicalJson(effect);

    return this.#store.transaction((transaction) => {
      const current = transaction.getDeliveryById(deliveryId);
      if (!current) {
        throw invariant("delivery_disappeared", "Delivery disappeared during acknowledgement");
      }
      assertCurrentLease(identity, current, leaseTokenDigest);
      assertEffectMatchesDelivery(effect, current);
      assertEffectWindow(effect, current, now);
      const effectOwner = transaction.getDeliveryByEffectId(effect.effect_id);
      if (effectOwner && effectOwner.delivery_id !== deliveryId) {
        throw conflict(
          "effect_identity_conflict",
          "Host effect identity is already attached to another delivery",
        );
      }

      if (current.status === "acknowledged") {
        if (
          current.effect_id !== effect.effect_id ||
          current.effect_attestation_json !== effectJson
        ) {
          throw conflict(
            "delivery_effect_conflict",
            "Delivery is already acknowledged by a different Host effect",
          );
        }
        return buildDeliveryAcknowledgement(current, effect.effect_id, true);
      }
      if (!["leased", "retry_exhausted"].includes(current.status)) {
        throw conflict(
          "delivery_not_acknowledgeable",
          "Delivery is not in an acknowledgeable state",
        );
      }

      const acknowledgedAt = now.toISOString();
      const acknowledged = transaction.acknowledgeDelivery({
        delivery_id: deliveryId,
        expected_status: current.status,
        expected_attempt: current.current_attempt,
        expected_connector_id: current.current_connector_id,
        expected_lease_token_digest: current.current_lease_token_digest,
        expected_lease_expires_at: current.lease_expires_at,
        effect_id: effect.effect_id,
        effect_attestation_json: effectJson,
        acknowledged_at: acknowledgedAt,
        updated_at: acknowledgedAt,
      });
      if (!acknowledged) {
        throw conflict("delivery_acknowledgement_race", "Delivery acknowledgement claim was lost");
      }
      return buildDeliveryAcknowledgement(current, effect.effect_id, false);
    });
  }

  #verifyConnector(token, now) {
    try {
      const value = this.#connectorAuthority.verifyConnector({ connectorToken: token });
      return normalizeConnectorIdentity(value, now);
    } catch {
      throw authorization(
        "connector_identity_invalid",
        "Connector identity could not be verified by the Receiver authority",
      );
    }
  }

  #verifyEffect(token, delivery, now) {
    const expected = deepFreeze({
      delivery_id: delivery.delivery_id,
      event_id: delivery.event_id,
      correlation_id: delivery.correlation_id,
      workflow_id: delivery.workflow_id,
      canonical_url: delivery.canonical_url,
      human_boundary: delivery.human_boundary,
      outcome: HOST_EFFECT_OUTCOME,
    });
    try {
      const value = this.#effectAuthority.verifyEffect({
        effectToken: token,
        expected,
      });
      const effect = normalizeHostEffectAttestation(value, now);
      assertEffectMatchesDelivery(effect, delivery);
      return effect;
    } catch {
      throw authorization(
        "host_effect_invalid",
        "Host effect could not be verified by the Receiver authority",
      );
    }
  }

  #readClock() {
    const value = this.#clock();
    if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
      throw new TypeError("Receiver delivery clock must return a valid Date");
    }
    return new Date(value.getTime());
  }
}

function normalizeConnectorIdentity(value, now) {
  requireExactInput(
    value,
    CONNECTOR_IDENTITY_FIELDS,
    CONNECTOR_IDENTITY_FIELDS,
    "Connector identity attestation",
  );
  if (value.type !== CONNECTOR_IDENTITY_TYPE || value.protocol_version !== PROTOCOL_VERSION) {
    throw authorization("connector_identity_version_invalid", "Connector identity version is unsupported");
  }
  const identity = {
    type: CONNECTOR_IDENTITY_TYPE,
    protocol_version: PROTOCOL_VERSION,
    connector_id: requireIdentifier(value.connector_id, "connector_id"),
    subject_id: requireIdentifier(value.subject_id, "Connector subject_id"),
    delivery_target_id: requireIdentifier(
      value.delivery_target_id,
      "Connector delivery_target_id",
    ),
    authenticated_at: requireTimestamp(value.authenticated_at, "Connector authenticated_at"),
    expires_at: requireTimestamp(value.expires_at, "Connector expires_at"),
  };
  const authenticatedAt = Date.parse(identity.authenticated_at);
  const expiresAt = Date.parse(identity.expires_at);
  if (
    authenticatedAt > now.getTime() + AUTHORITY_FUTURE_SKEW_MS ||
    expiresAt <= now.getTime() ||
    expiresAt <= authenticatedAt
  ) {
    throw authorization("connector_identity_time_invalid", "Connector identity is outside its valid window");
  }
  return deepFreeze(identity);
}

function normalizeHostEffectAttestation(value, now) {
  requireExactInput(
    value,
    HOST_EFFECT_ATTESTATION_FIELDS,
    HOST_EFFECT_ATTESTATION_FIELDS,
    "Host-effect attestation",
  );
  if (
    value.type !== HOST_EFFECT_ATTESTATION_TYPE ||
    value.protocol_version !== PROTOCOL_VERSION ||
    value.outcome !== HOST_EFFECT_OUTCOME
  ) {
    throw authorization("host_effect_version_invalid", "Host-effect attestation is unsupported");
  }
  const effect = {
    type: HOST_EFFECT_ATTESTATION_TYPE,
    protocol_version: PROTOCOL_VERSION,
    effect_id: requireIdentifier(value.effect_id, "effect_id"),
    delivery_id: requireIdentifier(value.delivery_id, "effect delivery_id"),
    event_id: requireIdentifier(value.event_id, "effect event_id"),
    correlation_id: requireIdentifier(value.correlation_id, "effect correlation_id"),
    workflow_id: requireIdentifier(value.workflow_id, "effect workflow_id"),
    outcome: HOST_EFFECT_OUTCOME,
    confirmed_at: requireTimestamp(value.confirmed_at, "effect confirmed_at"),
  };
  if (Date.parse(effect.confirmed_at) > now.getTime() + AUTHORITY_FUTURE_SKEW_MS) {
    throw authorization("host_effect_time_invalid", "Host effect is outside its valid time window");
  }
  return deepFreeze(effect);
}

function assertConnectorScope(identity, delivery) {
  if (
    identity.subject_id !== delivery.subject_id ||
    identity.delivery_target_id !== delivery.delivery_target_id
  ) {
    throw authorization(
      "connector_delivery_scope_invalid",
      "Connector identity is outside the delivery scope",
    );
  }
}

function assertCurrentLease(identity, delivery, leaseTokenDigest) {
  assertConnectorScope(identity, delivery);
  if (!["leased", "retry_exhausted", "acknowledged"].includes(delivery.status)) {
    throw conflict("delivery_not_leased", "Delivery has no acknowledgeable lease");
  }
  if (
    delivery.current_connector_id !== identity.connector_id ||
    delivery.current_lease_token_digest !== leaseTokenDigest
  ) {
    throw authorization("delivery_lease_invalid", "Delivery lease token is invalid or stale");
  }
}

function getGrantAuthorityEndReason(delivery, now) {
  if (delivery.grant_revoked_at !== null) return "grant_revoked";
  if (
    parseStoredTimestamp(delivery.grant_expires_at, "grant_expires_at") <= now.getTime()
  ) {
    return "grant_expired";
  }
  return null;
}

function assertEffectMatchesDelivery(effect, delivery) {
  if (
    effect.delivery_id !== delivery.delivery_id ||
    effect.event_id !== delivery.event_id ||
    effect.correlation_id !== delivery.correlation_id ||
    effect.workflow_id !== delivery.workflow_id ||
    effect.outcome !== HOST_EFFECT_OUTCOME
  ) {
    throw authorization("host_effect_scope_invalid", "Host effect is outside the delivery scope");
  }
}

function assertEffectWindow(effect, delivery, now) {
  const confirmedAt = Date.parse(effect.confirmed_at);
  const leasedAt = parseStoredTimestamp(delivery.leased_at, "leased_at");
  const leaseExpiresAt = parseStoredTimestamp(delivery.lease_expires_at, "lease_expires_at");
  const grantExpiresAt = parseStoredTimestamp(delivery.grant_expires_at, "grant_expires_at");
  const revokedAt = delivery.grant_revoked_at === null
    ? null
    : parseStoredTimestamp(delivery.grant_revoked_at, "grant_revoked_at");
  if (
    confirmedAt < leasedAt ||
    confirmedAt >= leaseExpiresAt ||
    confirmedAt >= grantExpiresAt ||
    confirmedAt > now.getTime() + AUTHORITY_FUTURE_SKEW_MS ||
    (revokedAt !== null && confirmedAt >= revokedAt)
  ) {
    throw authorization("host_effect_time_invalid", "Host effect is outside the delivery authority window");
  }
}

function buildDeliveryLeaseResult(delivery, leaseToken, duplicate) {
  let event;
  let receipt;
  try {
    event = parseContinuationEventBody(delivery.canonical_body);
    receipt = validateContinuationReceipt(JSON.parse(delivery.receipt_json));
  } catch {
    throw invariant("delivery_private_state_invalid", "Delivery private state is invalid");
  }
  if (
    event.event_id !== delivery.event_id ||
    event.binding_id !== delivery.grant_binding_id ||
    event.correlation_id !== delivery.correlation_id ||
    event.issuer_origin !== delivery.grant_issuer_origin ||
    event.workflow_id !== delivery.workflow_id ||
    event.event_type !== delivery.event_type ||
    event.canonical_url !== delivery.canonical_url ||
    receipt.grant_id !== delivery.grant_id ||
    receipt.correlation_id !== delivery.correlation_id ||
    receipt.issuer_origin !== delivery.grant_issuer_origin ||
    receipt.workflow_id !== delivery.workflow_id ||
    receipt.event_type !== delivery.event_type ||
    receipt.canonical_url !== delivery.canonical_url ||
    receipt.expires_at !== delivery.grant_expires_at ||
    receipt.human_boundary !== delivery.human_boundary
  ) {
    throw invariant("delivery_private_state_invalid", "Delivery private state is inconsistent");
  }
  return deepFreeze({
    duplicate,
    lease: {
      type: DELIVERY_LEASE_TYPE,
      protocol_version: PROTOCOL_VERSION,
      delivery_id: delivery.delivery_id,
      event_id: delivery.event_id,
      attempt: delivery.current_attempt,
      lease_token: leaseToken,
      lease_expires_at: delivery.lease_expires_at,
      continuation: {
        correlation_id: event.correlation_id,
        workflow_id: event.workflow_id,
        event_type: event.event_type,
        event_sequence: event.event_sequence,
        state_version: event.state_version,
        occurred_at: event.occurred_at,
        canonical_url: event.canonical_url,
        instruction: requireStoredInstruction(delivery.instruction),
      },
      receipt,
    },
  });
}

function requireStoredInstruction(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.trim() !== value ||
    CONTROL_CHARACTER_PATTERN.test(value) ||
    Buffer.byteLength(value, "utf8") > PROTOCOL_LIMITS.displayReasonBytes
  ) {
    throw invariant(
      "delivery_private_state_invalid",
      "Stored continuation instruction is invalid",
    );
  }
  return value;
}

function buildDeliveryAcknowledgement(delivery, effectId, duplicate) {
  return deepFreeze({
    type: DELIVERY_ACKNOWLEDGEMENT_TYPE,
    protocol_version: PROTOCOL_VERSION,
    delivery_id: delivery.delivery_id,
    event_id: delivery.event_id,
    effect_id: effectId,
    acknowledged: true,
    duplicate,
    status: "acknowledged",
  });
}

function requireClaimToken(value, label = "Delivery claim token") {
  if (typeof value !== "string" || !CLAIM_TOKEN_PATTERN.test(value)) {
    throw authorization("delivery_claim_token_invalid", `${label} is invalid`);
  }
  const decoded = Buffer.from(value, "base64url");
  if (decoded.length !== 32 || decoded.toString("base64url") !== value) {
    throw authorization("delivery_claim_token_invalid", `${label} is invalid`);
  }
  return value;
}

function digestToken(value) {
  return createHash("sha256").update(value, "utf8").digest("base64url");
}

function parseStoredTimestamp(value, label) {
  const parsed = Date.parse(value);
  if (
    typeof value !== "string" ||
    !Number.isFinite(parsed) ||
    new Date(parsed).toISOString() !== value
  ) {
    throw invariant("delivery_private_state_invalid", `Stored ${label} is invalid`);
  }
  return parsed;
}

function requireDeliveryStore(store) {
  if (!store || typeof store !== "object") {
    throw new TypeError("Receiver delivery store must implement the persistence port");
  }
  for (const method of DELIVERY_STORE_METHODS) {
    if (typeof store[method] !== "function") {
      throw new TypeError(`Receiver delivery store is missing ${method}`);
    }
  }
}
