import { createHash, randomUUID } from "node:crypto";

import {
  ACCEPTANCE_TYPE,
  CONTINUATION_MODE,
  PROTOCOL_LIMITS,
  PUBLIC_BINDING_TYPE,
  RECEIPT_TYPE,
  canonicalJson,
} from "./protocol.mjs";
import {
  STANDING_AUTHORIZATION_MODE,
  STANDING_MAX_ACTIVE_ACTIVATIONS,
  STANDING_PROTOCOL_VERSION,
  createStandingContinuationAcceptance,
  createStandingContinuationReceipt,
  createStandingPublicBinding,
  parseStandingContinuationEventBody,
  validateStandingContinuationReceipt,
  validateStandingReentryManifest,
  verifyStandingReentryManifestAuthority,
  verifyStandingContinuationEventEnvelope,
} from "./standing-protocol.mjs";
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
  scope,
} from "./receiver-support.mjs";
import {
  createNotificationHandoffReceipt,
  validateNotificationHandoffReceipt,
  validateRuntimeAdmissionAttestation,
} from "./notification-handoff.mjs";

export const STANDING_CONSENT_DECISION_TYPE = "webmcp.receiver_consent_decision";
export const STANDING_GRANT_CONTROL_AUTHORIZATION_TYPE =
  "webmcp.receiver_grant_control_authorization";
export const STANDING_CONNECTOR_IDENTITY_TYPE = "webmcp.connector_identity";
export const STANDING_HOST_EFFECT_ATTESTATION_TYPE = "webmcp.host_effect_attestation";
export const STANDING_HOST_EFFECT_OUTCOME = "committed";
export const STANDING_DELIVERY_LEASE_TYPE = "webmcp.delivery_lease";
export const STANDING_DELIVERY_ACKNOWLEDGEMENT_TYPE = "webmcp.delivery_acknowledgement";

const OPTION_FIELDS = Object.freeze([
  "store",
  "keyResolver",
  "consentAuthority",
  "grantControlAuthority",
  "connectorAuthority",
  "effectAuthority",
  "runtimeAdmissionAuthority",
  "maximumGrantLifetimeMs",
  "leaseDurationMs",
  "clock",
  "createId",
]);
const REQUIRED_OPTION_FIELDS = Object.freeze(OPTION_FIELDS.filter(
  (field) => !["clock", "createId", "runtimeAdmissionAuthority"].includes(field),
));
const CREATE_CHALLENGE_FIELDS = Object.freeze(["manifest", "expectedOrigin"]);
const DECIDE_CONSENT_FIELDS = Object.freeze(["challengeId", "decisionToken"]);
const CONTROL_FIELDS = Object.freeze(["bindingId", "controlToken"]);
const EVENT_ENVELOPE_FIELDS = Object.freeze(["body", "headers"]);
const CLAIM_FIELDS = Object.freeze(["connectorToken", "claimToken"]);
const ACKNOWLEDGE_FIELDS = Object.freeze([
  "connectorToken",
  "deliveryId",
  "leaseToken",
  "effectToken",
]);
const NOTIFICATION_HANDOFF_FIELDS = Object.freeze([
  "connectorToken",
  "deliveryId",
  "leaseToken",
  "handoffId",
  "runtimeAdmissionAttestation",
]);
const APPROVAL_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "decision_id",
  "challenge_id",
  "action",
  "subject_id",
  "delivery_target_id",
  "decided_at",
]);
const DECLINE_FIELDS = Object.freeze(APPROVAL_FIELDS.filter(
  (field) => field !== "delivery_target_id",
));
const CONTROL_AUTHORIZATION_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "binding_id",
  "action",
  "subject_id",
  "authenticated_at",
  "expires_at",
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
const EFFECT_FIELDS = Object.freeze([
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
const STORE_METHODS = Object.freeze([
  "transaction",
  "getStandingChallengeByManifestId",
  "getStandingChallengeById",
  "insertStandingChallenge",
  "setStandingChallengeDecision",
  "getStandingGrantByChallengeId",
  "getStandingGrantByBindingId",
  "insertStandingGrant",
  "advanceStandingGrantSequence",
  "revokeStandingGrant",
  "getStandingEventById",
  "insertStandingEvent",
  "getOpenStandingDeliveryByGrantId",
  "getStandingDeliveryById",
  "getStandingDeliveryByHandoffId",
  "getStandingDeliveryByEffectId",
  "getStandingDeliveryByLeaseTokenDigest",
  "getNextStandingDeliveryByTarget",
  "insertStandingDelivery",
  "claimStandingDelivery",
  "acknowledgeStandingDelivery",
  "handoffStandingDelivery",
]);
const AUTHORITY_FUTURE_SKEW_MS = 60 * 1_000;
const CLAIM_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export class StandingAuthorizationCore {
  #store;
  #keyResolver;
  #consentAuthority;
  #grantControlAuthority;
  #connectorAuthority;
  #effectAuthority;
  #runtimeAdmissionAuthority;
  #maximumGrantLifetimeMs;
  #leaseDurationMs;
  #clock;
  #createId;

  constructor(options) {
    requireExactInput(options, OPTION_FIELDS, REQUIRED_OPTION_FIELDS, "Standing Core options");
    requireStore(options.store);
    requireAuthority(options.keyResolver, "Standing Core keyResolver", true);
    requireAuthority(options.consentAuthority?.verifyDecision, "consentAuthority.verifyDecision");
    requireAuthority(options.grantControlAuthority?.verifyControl, "grantControlAuthority.verifyControl");
    requireAuthority(options.connectorAuthority?.verifyConnector, "connectorAuthority.verifyConnector");
    requireAuthority(options.effectAuthority?.verifyEffect, "effectAuthority.verifyEffect");
    if (!Number.isSafeInteger(options.maximumGrantLifetimeMs) || options.maximumGrantLifetimeMs < 1_000) {
      throw new TypeError("Standing Core maximumGrantLifetimeMs must be at least one second");
    }
    if (!Number.isSafeInteger(options.leaseDurationMs) || options.leaseDurationMs < 1_000) {
      throw new TypeError("Standing Core leaseDurationMs must be at least one second");
    }
    this.#store = options.store;
    this.#keyResolver = options.keyResolver;
    this.#consentAuthority = options.consentAuthority;
    this.#grantControlAuthority = options.grantControlAuthority;
    this.#connectorAuthority = options.connectorAuthority;
    this.#effectAuthority = options.effectAuthority;
    this.#runtimeAdmissionAuthority = options.runtimeAdmissionAuthority;
    this.#maximumGrantLifetimeMs = options.maximumGrantLifetimeMs;
    this.#leaseDurationMs = options.leaseDurationMs;
    this.#clock = options.clock ?? (() => new Date());
    this.#createId = options.createId ?? ((prefix) => `${prefix}_${randomUUID()}`);
    requireAuthority(this.#clock, "Standing Core clock", true);
    requireAuthority(this.#createId, "Standing Core createId", true);
  }

  createConsentChallenge(input) {
    requireExactInput(
      input,
      CREATE_CHALLENGE_FIELDS,
      CREATE_CHALLENGE_FIELDS,
      "Standing Consent challenge input",
    );
    return this.#store.transaction((transaction) => {
      // BEGIN IMMEDIATE may wait for another writer. Time and live authority
      // must be resolved after that wait, inside the serialized operation.
      const now = this.#readClock();
      const manifest = validateStandingReentryManifest(input.manifest, {
        keyResolver: this.#keyResolver,
        expectedOrigin: input.expectedOrigin,
        now,
      });
      const manifestJson = canonicalJson(manifest);
      const maximumExpiry = now.getTime() + this.#maximumGrantLifetimeMs;
      if (!Number.isFinite(maximumExpiry)) {
        throw new TypeError("Standing Core maximum Grant lifetime exceeds the Date range");
      }
      const effectiveExpiresAt = new Date(Math.min(
        Date.parse(manifest.grant_request.grant_expires_at),
        maximumExpiry,
      )).toISOString();
      const challenge = {
        challenge_id: this.#nextId("standing_challenge"),
        manifest_id: manifest.manifest_id,
        manifest_json: manifestJson,
        expected_origin: manifest.issuer_origin,
        effective_expires_at: effectiveExpiresAt,
        status: "pending",
        decision_id: null,
        decision_action: null,
        subject_id: null,
        created_at: now.toISOString(),
        decided_at: null,
      };
      const existing = transaction.getStandingChallengeByManifestId(manifest.manifest_id);
      if (existing) {
        if (existing.manifest_json !== manifestJson) {
          throw conflict(
            "manifest_identity_conflict",
            "Standing Manifest ID is attached to different canonical content",
          );
        }
        return deepFreeze({ challenge: publicChallenge(existing, now), duplicate: true });
      }
      transaction.insertStandingChallenge(challenge);
      return deepFreeze({ challenge: publicChallenge(challenge, now), duplicate: false });
    });
  }

  decideConsent(input) {
    requireExactInput(input, DECIDE_CONSENT_FIELDS, DECIDE_CONSENT_FIELDS, "Standing Consent input");
    const challengeId = requireIdentifier(input.challengeId, "challengeId");
    const decisionToken = requireOpaqueToken(
      input.decisionToken,
      "Consent decision token",
      "consent_decision_token_invalid",
    );
    return this.#store.transaction((transaction) => {
      const now = this.#readClock();
      const current = transaction.getStandingChallengeById(challengeId);
      if (!current) throw notFound("challenge_not_found", "Standing Consent challenge was not found");
      const decision = this.#verifyDecision(challengeId, decisionToken, current, now);
      if (current.status !== "pending") {
        return this.#terminalConsentResponse(current, decision, now, true, transaction);
      }
      if (decision.action === "decline") {
        const changed = transaction.setStandingChallengeDecision({
          challenge_id: challengeId,
          status: "declined",
          decision_id: decision.decision_id,
          decision_action: "decline",
          subject_id: decision.subject_id,
          decided_at: decision.decided_at,
        });
        if (!changed) throw conflict("consent_decision_race", "Standing Consent decision was lost");
        return deepFreeze({ status: "declined", challenge_id: challengeId, duplicate: false });
      }

      const { manifest, keyFingerprint } = verifyStandingReentryManifestAuthority(
        JSON.parse(current.manifest_json),
        {
          keyResolver: this.#keyResolver,
          expectedOrigin: current.expected_origin,
          now,
        },
      );
      assertApprovalWindow(current, decision, manifest, now);
      const grantId = this.#nextId("standing_grant");
      const bindingId = this.#nextId("standing_binding");
      const receipt = createStandingContinuationReceipt({
        type: RECEIPT_TYPE,
        protocol_version: STANDING_PROTOCOL_VERSION,
        grant_id: grantId,
        correlation_id: manifest.correlation_id,
        issuer_origin: manifest.issuer_origin,
        workflow_id: manifest.workflow.id,
        event_type: manifest.grant_request.event_type,
        canonical_url: manifest.workflow.canonical_url,
        expires_at: current.effective_expires_at,
        human_boundary: manifest.grant_request.human_boundary,
        continuation_mode: CONTINUATION_MODE,
        authorization_mode: STANDING_AUTHORIZATION_MODE,
        max_active_activations: STANDING_MAX_ACTIVE_ACTIVATIONS,
      });
      const grant = {
        grant_id: grantId,
        challenge_id: challengeId,
        manifest_id: manifest.manifest_id,
        binding_id: bindingId,
        subject_id: decision.subject_id,
        delivery_target_id: decision.delivery_target_id,
        correlation_id: manifest.correlation_id,
        issuer_origin: manifest.issuer_origin,
        issuer_key_id: manifest.signature.key_id,
        issuer_key_fingerprint: keyFingerprint,
        workflow_type: manifest.workflow.type,
        workflow_id: manifest.workflow.id,
        event_type: manifest.grant_request.event_type,
        canonical_url: manifest.workflow.canonical_url,
        expires_at: current.effective_expires_at,
        human_boundary: manifest.grant_request.human_boundary,
        instruction: manifest.display.reason,
        authorization_mode: STANDING_AUTHORIZATION_MODE,
        max_active_activations: STANDING_MAX_ACTIVE_ACTIVATIONS,
        last_event_sequence: 0,
        revoked_at: null,
        receipt_json: canonicalJson(receipt),
        created_at: now.toISOString(),
      };
      transaction.insertStandingGrant(grant);
      const changed = transaction.setStandingChallengeDecision({
        challenge_id: challengeId,
        status: "approved",
        decision_id: decision.decision_id,
        decision_action: "approve",
        subject_id: decision.subject_id,
        decided_at: decision.decided_at,
      });
      if (!changed) throw conflict("consent_decision_race", "Standing Consent decision was lost");
      return approvalResponse(challengeId, grant, now, false);
    });
  }

  acceptEvent(envelope) {
    requireExactInput(
      envelope,
      EVENT_ENVELOPE_FIELDS,
      EVENT_ENVELOPE_FIELDS,
      "Standing Event envelope",
    );
    const parsed = parseStandingContinuationEventBody(envelope.body);
    return this.#store.transaction((transaction) => {
      const now = this.#readClock();
      const grant = transaction.getStandingGrantByBindingId(parsed.binding_id);
      if (!grant) throw scope("event_scope_invalid", "Event does not resolve to a standing Grant");
      if (
        grant.revoked_at !== null &&
        !/^[A-Za-z0-9_-]{43}$/.test(grant.issuer_key_fingerprint ?? "")
      ) {
        throw scope(
          "grant_reconsent_required",
          "Legacy standing Grant lacks consented key material and requires fresh Consent",
          410,
        );
      }
      const event = verifyStandingContinuationEventEnvelope(envelope, {
        keyResolver: this.#keyResolver,
        expectedOrigin: grant.issuer_origin,
        expectedKeyId: grant.issuer_key_id,
        expectedKeyFingerprint: grant.issuer_key_fingerprint,
        now,
      });
      const existing = transaction.getStandingEventById(event.event_id);
      if (existing) {
        if (existing.grant_id !== grant.grant_id || existing.canonical_body !== envelope.body) {
          throw conflict(
            "event_identity_conflict",
            "Standing Event ID is attached to different canonical content",
          );
        }
        return createStandingContinuationAcceptance({
          ...JSON.parse(existing.acceptance_json),
          duplicate: true,
        });
      }
      validateEventAgainstGrant(event, grant, now);
      const expectedSequence = grant.last_event_sequence + 1;
      if (event.event_sequence !== expectedSequence) {
        throw conflict(
          event.event_sequence <= grant.last_event_sequence
            ? "event_sequence_conflict"
            : "event_sequence_out_of_order",
          `Standing Event sequence must equal ${expectedSequence}`,
        );
      }
      if (transaction.getOpenStandingDeliveryByGrantId(grant.grant_id)) {
        const error = conflict(
          "activation_in_progress",
          "Standing Grant already has a non-terminal activation",
        );
        Object.defineProperty(error, "retryable", { value: true, enumerable: true });
        throw error;
      }
      const acceptance = createStandingContinuationAcceptance({
        type: ACCEPTANCE_TYPE,
        protocol_version: STANDING_PROTOCOL_VERSION,
        event_id: event.event_id,
        correlation_id: event.correlation_id,
        accepted: true,
        duplicate: false,
        status: "accepted",
      });
      if (!transaction.advanceStandingGrantSequence(
        grant.grant_id,
        grant.last_event_sequence,
        event.event_sequence,
      )) {
        throw conflict("grant_reservation_lost", "Standing activation reservation was lost");
      }
      transaction.insertStandingEvent({
        event_id: event.event_id,
        grant_id: grant.grant_id,
        event_sequence: event.event_sequence,
        canonical_body: envelope.body,
        acceptance_json: canonicalJson(acceptance),
        received_at: now.toISOString(),
      });
      const deliveryId = this.#nextId("standing_delivery");
      transaction.insertStandingDelivery({
        delivery_id: deliveryId,
        event_id: event.event_id,
        grant_id: grant.grant_id,
        delivery_target_id: grant.delivery_target_id,
        status: "pending",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });
      return acceptance;
    });
  }

  claimDelivery(input) {
    requireExactInput(input, CLAIM_FIELDS, CLAIM_FIELDS, "Standing Delivery claim input");
    const connectorToken = requireOpaqueToken(
      input.connectorToken,
      "Connector token",
      "connector_token_invalid",
    );
    const claimToken = requireClaimToken(input.claimToken);
    const tokenDigest = digestToken(claimToken);
    return this.#store.transaction((transaction) => {
      const now = this.#readClock();
      const identity = this.#verifyConnector(connectorToken, now);
      const replay = transaction.getStandingDeliveryByLeaseTokenDigest(tokenDigest);
      if (replay) {
        assertConnectorScope(identity, replay);
        if (replay.connector_id !== identity.connector_id) {
          throw authorization("delivery_lease_scope_invalid", "Standing lease belongs to another Connector");
        }
        if (
          replay.grant_revoked_at !== null ||
          Date.parse(replay.grant_expires_at) <= now.getTime()
        ) {
          return null;
        }
        if (replay.status === "leased" && Date.parse(replay.lease_expires_at) > now.getTime()) {
          return buildLease(replay, claimToken, true);
        }
        throw conflict("claim_token_retired", "Standing claim token is no longer claimable");
      }
      const delivery = transaction.getNextStandingDeliveryByTarget(
        identity.delivery_target_id,
        now.toISOString(),
      );
      if (!delivery) return null;
      assertConnectorScope(identity, delivery);
      if (delivery.grant_revoked_at !== null || Date.parse(delivery.grant_expires_at) <= now.getTime()) {
        return null;
      }
      const leaseExpiresAtMs = Math.min(
        now.getTime() + this.#leaseDurationMs,
        Date.parse(delivery.grant_expires_at),
        Date.parse(identity.expires_at),
      );
      if (leaseExpiresAtMs <= now.getTime()) {
        throw authorization(
          "connector_identity_expired",
          "Connector identity cannot support a standing Delivery lease",
        );
      }
      const leaseExpiresAt = new Date(leaseExpiresAtMs).toISOString();
      if (!transaction.claimStandingDelivery({
        delivery_id: delivery.delivery_id,
        connector_id: identity.connector_id,
        lease_token_digest: tokenDigest,
        leased_at: now.toISOString(),
        lease_expires_at: leaseExpiresAt,
        updated_at: now.toISOString(),
      })) {
        throw conflict("delivery_claim_race", "Standing Delivery claim was lost");
      }
      return buildLease({
        ...delivery,
        status: "leased",
        connector_id: identity.connector_id,
        lease_token_digest: tokenDigest,
        leased_at: now.toISOString(),
        lease_expires_at: leaseExpiresAt,
      }, claimToken, false);
    });
  }

  acknowledgeDelivery(input) {
    requireExactInput(
      input,
      ACKNOWLEDGE_FIELDS,
      ACKNOWLEDGE_FIELDS,
      "Standing Delivery acknowledgement input",
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
    return this.#store.transaction((transaction) => {
      const now = this.#readClock();
      const identity = this.#verifyConnector(connectorToken, now);
      const current = transaction.getStandingDeliveryById(deliveryId);
      if (!current) throw notFound("delivery_not_found", "Standing Delivery was not found");
      assertCurrentLease(identity, current, leaseTokenDigest);
      const effect = this.#verifyEffect(effectToken, current, now);
      const effectJson = canonicalJson(effect);
      const effectOwner = transaction.getStandingDeliveryByEffectId(effect.effect_id);
      if (effectOwner && effectOwner.delivery_id !== deliveryId) {
        throw conflict(
          "effect_identity_conflict",
          "Standing Host effect identity belongs to another Delivery",
        );
      }
      if (current.status === "acknowledged") {
        if (current.effect_id !== effect.effect_id || current.effect_attestation_json !== effectJson) {
          throw conflict("delivery_effect_conflict", "Standing Delivery has another Host effect");
        }
        return acknowledgementResponse(current, effect.effect_id, true);
      }
      if (current.status !== "leased") {
        throw conflict("delivery_not_acknowledgeable", "Standing Delivery is not leased");
      }
      const acknowledgedAt = now.toISOString();
      if (!transaction.acknowledgeStandingDelivery({
        delivery_id: deliveryId,
        connector_id: identity.connector_id,
        lease_token_digest: leaseTokenDigest,
        lease_expires_at: current.lease_expires_at,
        effect_id: effect.effect_id,
        effect_attestation_json: effectJson,
        acknowledged_at: acknowledgedAt,
        updated_at: acknowledgedAt,
      })) {
        throw conflict("delivery_acknowledgement_race", "Standing acknowledgement was lost");
      }
      return acknowledgementResponse(current, effect.effect_id, false);
    });
  }

  handoffNotification(input) {
    requireExactInput(
      input,
      NOTIFICATION_HANDOFF_FIELDS,
      NOTIFICATION_HANDOFF_FIELDS,
      "Standing notification handoff input",
    );
    const connectorToken = requireOpaqueToken(
      input.connectorToken,
      "Connector token",
      "connector_token_invalid",
    );
    const deliveryId = requireIdentifier(input.deliveryId, "deliveryId");
    const leaseToken = requireClaimToken(input.leaseToken, "Delivery lease token");
    const handoffId = requireIdentifier(input.handoffId, "handoffId");
    const leaseTokenDigest = digestToken(leaseToken);
    return this.#store.transaction((transaction) => {
      const now = this.#readClock();
      const identity = this.#verifyConnector(connectorToken, now);
      const existing = transaction.getStandingDeliveryByHandoffId(handoffId);
      if (existing) {
        if (existing.delivery_id !== deliveryId) {
          throw conflict(
            "notification_handoff_identity_conflict",
            "Standing handoff identity belongs to another Delivery",
          );
        }
        assertConnectorScope(identity, existing);
        if (
          existing.status !== "terminal" ||
          existing.terminal_reason !== "notification_handoff" ||
          !existing.runtime_admission_json ||
          !existing.handoff_receipt_json
        ) {
          throw invariant(
            "delivery_private_state_invalid",
            "Standing notification handoff state is inconsistent",
          );
        }
        const supplied = normalizeHandoffAttestation(
          input.runtimeAdmissionAttestation,
          { deliveryId, eventId: existing.event_id, handoffId, now },
        );
        let stored;
        let receipt;
        try {
          stored = validateRuntimeAdmissionAttestation(
            JSON.parse(existing.runtime_admission_json),
            { deliveryId, eventId: existing.event_id, handoffId, now },
          );
          receipt = validateNotificationHandoffReceipt(
            JSON.parse(existing.handoff_receipt_json),
            { deliveryId, eventId: existing.event_id, handoffId },
          );
          if (
            canonicalJson(stored) !== existing.runtime_admission_json ||
            receipt.runtime_admission_ref !== stored.admission_id
          ) {
            throw new Error("Stored standing notification handoff evidence is inconsistent");
          }
        } catch {
          throw invariant(
            "delivery_private_state_invalid",
            "Stored standing notification handoff state is invalid",
          );
        }
        if (canonicalJson(stored) !== canonicalJson(supplied)) {
          throw conflict(
            "notification_handoff_identity_conflict",
            "Standing handoff identity is attached to different runtime admission",
          );
        }
        return deepFreeze({ ...receipt, duplicate: true });
      }

      const delivery = transaction.getStandingDeliveryById(deliveryId);
      if (!delivery) throw notFound("delivery_not_found", "Standing Delivery was not found");
      assertNotificationHandoffLease(identity, delivery, leaseTokenDigest, now);
      const supplied = normalizeHandoffAttestation(
        input.runtimeAdmissionAttestation,
        { deliveryId, eventId: delivery.event_id, handoffId, now },
      );
      if (!this.#runtimeAdmissionAuthority?.verifyAdmission) {
        const error = invariant(
          "runtime_admission_authority_unavailable",
          "Standing notification handoff requires the runtime admission authority",
        );
        error.statusCode = 501;
        throw error;
      }
      const expected = {
        delivery_id: delivery.delivery_id,
        event_id: delivery.event_id,
        grant_id: delivery.grant_id,
        connector_id: identity.connector_id,
        delivery_target_id: delivery.delivery_target_id,
        correlation_id: delivery.correlation_id,
        workflow_id: delivery.workflow_id,
      };
      let verified;
      try {
        verified = this.#runtimeAdmissionAuthority.verifyAdmission({
          attestation: supplied,
          expected,
        });
        if (verified && typeof verified.then === "function") {
          throw new TypeError("Standing Core runtime admission authority must be synchronous");
        }
        verified = validateRuntimeAdmissionAttestation(verified, {
          deliveryId,
          eventId: delivery.event_id,
          handoffId,
          now,
        });
      } catch (error) {
        if (error?.code === "runtime_admission_authority_unavailable") throw error;
        throw authorization(
          "runtime_admission_invalid",
          "Standing runtime admission could not be verified",
        );
      }
      if (canonicalJson(verified) !== canonicalJson(supplied)) {
        throw authorization(
          "runtime_admission_invalid",
          "Standing runtime admission did not match the supplied proof",
        );
      }
      assertNotificationHandoffWindow(verified, delivery, now);
      const runtimeAdmissionJson = canonicalJson(verified);
      const receipt = createNotificationHandoffReceipt({
        type: "webmcp.notification_handoff_receipt",
        protocol_version: STANDING_PROTOCOL_VERSION,
        delivery_id: delivery.delivery_id,
        event_id: delivery.event_id,
        handoff_id: handoffId,
        correlation_id: delivery.correlation_id,
        workflow_id: delivery.workflow_id,
        status: "handed_off",
        duplicate: false,
        runtime_admission_ref: verified.admission_id,
      });
      const receiptJson = canonicalJson(receipt);
      if (!transaction.handoffStandingDelivery({
        delivery_id: delivery.delivery_id,
        connector_id: identity.connector_id,
        lease_token_digest: leaseTokenDigest,
        lease_expires_at: delivery.lease_expires_at,
        handoff_id: handoffId,
        runtime_admission_json: runtimeAdmissionJson,
        handoff_receipt_json: receiptJson,
        handoff_accepted_at: now.toISOString(),
        updated_at: now.toISOString(),
      })) {
        throw conflict("notification_handoff_race", "Standing notification handoff was lost");
      }
      return receipt;
    });
  }

  inspectGrant(input) {
    requireExactInput(input, CONTROL_FIELDS, CONTROL_FIELDS, "Standing Grant inspection input");
    const bindingId = requireIdentifier(input.bindingId, "bindingId");
    const now = this.#readClock();
    const control = this.#verifyControl(bindingId, "inspect", input.controlToken, now);
    const grant = this.#store.getStandingGrantByBindingId(bindingId);
    if (!grant) throw notFound("grant_not_found", "Standing Grant was not found");
    assertControlSubject(grant, control);
    return grantSummary(grant, now, this.#store.getOpenStandingDeliveryByGrantId(grant.grant_id));
  }

  revokeGrant(input) {
    requireExactInput(input, CONTROL_FIELDS, CONTROL_FIELDS, "Standing Grant revocation input");
    const bindingId = requireIdentifier(input.bindingId, "bindingId");
    return this.#store.transaction((transaction) => {
      const now = this.#readClock();
      const control = this.#verifyControl(bindingId, "revoke", input.controlToken, now);
      const grant = transaction.getStandingGrantByBindingId(bindingId);
      if (!grant) throw notFound("grant_not_found", "Standing Grant was not found");
      assertControlSubject(grant, control);
      if (grant.revoked_at !== null) return revocationResponse(grant, true);
      const revokedAt = now.toISOString();
      if (!transaction.revokeStandingGrant(grant.grant_id, revokedAt)) {
        throw conflict("grant_revocation_race", "Standing Grant revocation was lost");
      }
      return revocationResponse({ ...grant, revoked_at: revokedAt }, false);
    });
  }

  #verifyDecision(challengeId, token, challenge, now) {
    let value;
    try {
      value = this.#consentAuthority.verifyDecision({
        challengeId,
        decisionToken: token,
      });
    } catch {
      throw authorization(
        "consent_decision_invalid",
        "Standing Consent decision could not be verified",
      );
    }
    if (value === undefined || value === null) {
      throw authorization(
        "consent_decision_invalid",
        "Standing Consent decision could not be verified",
      );
    }
    return normalizeConsentDecision(value, challenge, now);
  }

  #verifyControl(bindingId, action, tokenValue, now) {
    const token = requireOpaqueToken(
      tokenValue,
      "Grant control token",
      "grant_control_token_invalid",
    );
    let value;
    try {
      value = this.#grantControlAuthority.verifyControl({
        bindingId,
        action,
        controlToken: token,
      });
    } catch {
      throw authorization("grant_control_invalid", "Standing Grant control could not be verified");
    }
    if (value === undefined || value === null) {
      throw authorization("grant_control_invalid", "Standing Grant control could not be verified");
    }
    return normalizeControlAuthorization(value, bindingId, action, now);
  }

  #verifyConnector(token, now) {
    let value;
    try {
      value = this.#connectorAuthority.verifyConnector({ connectorToken: token });
    } catch {
      throw authorization("connector_identity_invalid", "Connector identity could not be verified");
    }
    if (value === undefined || value === null) {
      throw authorization("connector_identity_invalid", "Connector identity could not be verified");
    }
    return normalizeConnectorIdentity(value, now);
  }

  #verifyEffect(token, delivery, now) {
    const expected = deepFreeze({
      delivery_id: delivery.delivery_id,
      event_id: delivery.event_id,
      correlation_id: delivery.correlation_id,
      workflow_id: delivery.workflow_id,
      canonical_url: delivery.canonical_url,
      human_boundary: delivery.human_boundary,
      outcome: STANDING_HOST_EFFECT_OUTCOME,
    });
    let value;
    try {
      value = this.#effectAuthority.verifyEffect({ effectToken: token, expected });
    } catch {
      throw authorization("host_effect_invalid", "Standing Host effect could not be verified");
    }
    if (value === undefined || value === null) {
      throw authorization("host_effect_invalid", "Standing Host effect could not be verified");
    }
    const effect = normalizeEffect(value, now);
    assertEffectMatches(effect, delivery);
    assertEffectWindow(effect, delivery, now);
    return effect;
  }

  #terminalConsentResponse(challenge, decision, now, duplicate, store = this.#store) {
    if (
      challenge.decision_id !== decision.decision_id ||
      challenge.decision_action !== decision.action
    ) {
      throw conflict("consent_decision_conflict", "Standing Consent challenge is already decided");
    }
    if (
      challenge.subject_id !== decision.subject_id ||
      challenge.decided_at !== decision.decided_at
    ) {
      throw conflict(
        "consent_decision_identity_conflict",
        "Standing Consent decision ID is attached to different attestation content",
      );
    }
    if (challenge.status === "declined") {
      return deepFreeze({ status: "declined", challenge_id: challenge.challenge_id, duplicate });
    }
    if (challenge.status !== "approved") {
      throw invariant("challenge_status_invalid", "Standing Consent challenge has invalid state");
    }
    const grant = store.getStandingGrantByChallengeId(challenge.challenge_id);
    if (!grant) throw invariant("approved_grant_missing", "Approved standing Grant is missing");
    if (grant.delivery_target_id !== decision.delivery_target_id) {
      throw conflict(
        "consent_decision_identity_conflict",
        "Standing Consent decision ID is attached to different attestation content",
      );
    }
    return approvalResponse(challenge.challenge_id, grant, now, duplicate);
  }

  #readClock() {
    const value = this.#clock();
    if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
      throw new TypeError("Standing Core clock must return a valid Date");
    }
    return new Date(value.getTime());
  }

  #nextId(prefix) {
    return requireIdentifier(this.#createId(prefix), `${prefix} identifier`);
  }
}

function publicChallenge(challenge, now) {
  const manifest = JSON.parse(challenge.manifest_json);
  return deepFreeze({
    challenge_id: challenge.challenge_id,
    manifest_id: challenge.manifest_id,
    status: challengeStatus(challenge, now),
    offer: {
      title: manifest.display.title,
      reason: manifest.display.reason,
      canonical_url: manifest.workflow.canonical_url,
    },
    grant_scope: {
      authorization_mode: STANDING_AUTHORIZATION_MODE,
      event_type: manifest.grant_request.event_type,
      expires_at: challenge.effective_expires_at,
      max_active_activations: STANDING_MAX_ACTIVE_ACTIVATIONS,
      human_boundary: manifest.grant_request.human_boundary,
    },
  });
}

function challengeStatus(challenge, now) {
  if (challenge.status !== "pending") return challenge.status;
  return Date.parse(challenge.effective_expires_at) <= now.getTime() ? "expired" : "pending";
}

function approvalResponse(challengeId, grant, now, duplicate) {
  return deepFreeze({
    status: "approved",
    challenge_id: challengeId,
    duplicate,
    binding: createStandingPublicBinding({
      type: PUBLIC_BINDING_TYPE,
      protocol_version: STANDING_PROTOCOL_VERSION,
      binding_id: grant.binding_id,
      correlation_id: grant.correlation_id,
      workflow_id: grant.workflow_id,
      event_type: grant.event_type,
      expires_at: grant.expires_at,
      authorization_mode: STANDING_AUTHORIZATION_MODE,
      max_active_activations: STANDING_MAX_ACTIVE_ACTIVATIONS,
      last_event_sequence: grant.last_event_sequence,
      status: grantStatus(grant, now),
    }),
  });
}

function normalizeConsentDecision(value, challenge, now) {
  const action = value?.action;
  requireExactInput(
    value,
    action === "approve" ? APPROVAL_FIELDS : DECLINE_FIELDS,
    action === "approve" ? APPROVAL_FIELDS : DECLINE_FIELDS,
    "Standing Consent decision",
  );
  if (
    value.type !== STANDING_CONSENT_DECISION_TYPE ||
    value.protocol_version !== STANDING_PROTOCOL_VERSION ||
    !["approve", "decline"].includes(action)
  ) {
    throw authorization("consent_decision_invalid", "Standing Consent decision is unsupported");
  }
  const decision = {
    type: STANDING_CONSENT_DECISION_TYPE,
    protocol_version: STANDING_PROTOCOL_VERSION,
    decision_id: requireIdentifier(value.decision_id, "decision_id"),
    challenge_id: requireIdentifier(value.challenge_id, "decision challenge_id"),
    action,
    subject_id: requireIdentifier(value.subject_id, "decision subject_id"),
    ...(action === "approve" ? {
      delivery_target_id: requireIdentifier(value.delivery_target_id, "delivery_target_id"),
    } : {}),
    decided_at: requireTimestamp(value.decided_at, "decision decided_at"),
  };
  if (decision.challenge_id !== challenge.challenge_id) {
    throw authorization("consent_decision_scope_invalid", "Consent decision targets another challenge");
  }
  const decidedAt = Date.parse(decision.decided_at);
  if (
    decidedAt > now.getTime() + AUTHORITY_FUTURE_SKEW_MS ||
    decidedAt < Date.parse(challenge.created_at)
  ) {
    throw authorization("consent_decision_time_invalid", "Consent decision is outside its valid window");
  }
  return deepFreeze(decision);
}

function assertApprovalWindow(challenge, decision, manifest, now) {
  if (
    Date.parse(challenge.effective_expires_at) <= now.getTime() ||
    Date.parse(decision.decided_at) >= Date.parse(challenge.effective_expires_at) ||
    Date.parse(decision.decided_at) >= Date.parse(manifest.offer_expires_at)
  ) {
    throw authorization("consent_decision_expired", "Standing Consent challenge has expired");
  }
}

function validateEventAgainstGrant(event, grant, now) {
  if (grant.revoked_at !== null) throw scope("grant_revoked", "Standing Grant is revoked", 410);
  if (Date.parse(grant.expires_at) <= now.getTime()) {
    throw scope("grant_expired", "Standing Grant is expired", 410);
  }
  if (
    event.correlation_id !== grant.correlation_id ||
    event.issuer_origin !== grant.issuer_origin ||
    event.workflow_id !== grant.workflow_id ||
    event.event_type !== grant.event_type ||
    event.canonical_url !== grant.canonical_url
  ) {
    throw scope("event_scope_invalid", "Event is outside the standing Grant scope");
  }
  if (Date.parse(event.occurred_at) >= Date.parse(grant.expires_at)) {
    throw scope("event_after_grant_expiry", "Event occurred outside the standing Grant window");
  }
}

function normalizeControlAuthorization(value, bindingId, action, now) {
  requireExactInput(
    value,
    CONTROL_AUTHORIZATION_FIELDS,
    CONTROL_AUTHORIZATION_FIELDS,
    "Standing Grant control authorization",
  );
  if (
    value.type !== STANDING_GRANT_CONTROL_AUTHORIZATION_TYPE ||
    value.protocol_version !== STANDING_PROTOCOL_VERSION ||
    value.binding_id !== bindingId ||
    value.action !== action ||
    !["inspect", "revoke"].includes(action)
  ) {
    throw authorization("grant_control_scope_invalid", "Standing Grant control is out of scope");
  }
  const normalized = {
    ...value,
    binding_id: requireIdentifier(value.binding_id, "control binding_id"),
    subject_id: requireIdentifier(value.subject_id, "control subject_id"),
    authenticated_at: requireTimestamp(value.authenticated_at, "control authenticated_at"),
    expires_at: requireTimestamp(value.expires_at, "control expires_at"),
  };
  const authenticatedAt = Date.parse(normalized.authenticated_at);
  const expiresAt = Date.parse(normalized.expires_at);
  if (
    authenticatedAt > now.getTime() + AUTHORITY_FUTURE_SKEW_MS ||
    expiresAt <= now.getTime() ||
    expiresAt <= authenticatedAt
  ) {
    throw authorization("grant_control_time_invalid", "Standing Grant control is outside its window");
  }
  return deepFreeze(normalized);
}

function normalizeConnectorIdentity(value, now) {
  requireExactInput(value, CONNECTOR_IDENTITY_FIELDS, CONNECTOR_IDENTITY_FIELDS, "Connector identity");
  if (
    value.type !== STANDING_CONNECTOR_IDENTITY_TYPE ||
    value.protocol_version !== STANDING_PROTOCOL_VERSION
  ) {
    throw authorization("connector_identity_version_invalid", "Connector identity is unsupported");
  }
  const normalized = {
    ...value,
    connector_id: requireIdentifier(value.connector_id, "connector_id"),
    subject_id: requireIdentifier(value.subject_id, "Connector subject_id"),
    delivery_target_id: requireIdentifier(value.delivery_target_id, "delivery_target_id"),
    authenticated_at: requireTimestamp(value.authenticated_at, "Connector authenticated_at"),
    expires_at: requireTimestamp(value.expires_at, "Connector expires_at"),
  };
  const authenticatedAt = Date.parse(normalized.authenticated_at);
  const expiresAt = Date.parse(normalized.expires_at);
  if (
    authenticatedAt > now.getTime() + AUTHORITY_FUTURE_SKEW_MS ||
    expiresAt <= now.getTime() ||
    expiresAt <= authenticatedAt
  ) {
    throw authorization("connector_identity_time_invalid", "Connector identity is outside its window");
  }
  return deepFreeze(normalized);
}

function normalizeEffect(value, now) {
  requireExactInput(value, EFFECT_FIELDS, EFFECT_FIELDS, "Standing Host-effect attestation");
  if (
    value.type !== STANDING_HOST_EFFECT_ATTESTATION_TYPE ||
    value.protocol_version !== STANDING_PROTOCOL_VERSION ||
    value.outcome !== STANDING_HOST_EFFECT_OUTCOME
  ) {
    throw authorization("host_effect_version_invalid", "Standing Host effect is unsupported");
  }
  const normalized = {
    ...value,
    effect_id: requireIdentifier(value.effect_id, "effect_id"),
    delivery_id: requireIdentifier(value.delivery_id, "effect delivery_id"),
    event_id: requireIdentifier(value.event_id, "effect event_id"),
    correlation_id: requireIdentifier(value.correlation_id, "effect correlation_id"),
    workflow_id: requireIdentifier(value.workflow_id, "effect workflow_id"),
    confirmed_at: requireTimestamp(value.confirmed_at, "effect confirmed_at"),
  };
  if (Date.parse(normalized.confirmed_at) > now.getTime() + AUTHORITY_FUTURE_SKEW_MS) {
    throw authorization("host_effect_time_invalid", "Standing Host effect is in the future");
  }
  return deepFreeze(normalized);
}

function buildLease(delivery, leaseToken, duplicate) {
  let event;
  let receipt;
  try {
    event = parseStandingContinuationEventBody(delivery.canonical_body);
    receipt = validateStandingContinuationReceipt(JSON.parse(delivery.receipt_json));
  } catch {
    throw invariant("delivery_private_state_invalid", "Standing Delivery private state is invalid");
  }
  if (
    event.event_id !== delivery.event_id ||
    event.binding_id !== delivery.grant_binding_id ||
    event.event_sequence !== delivery.event_sequence ||
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
    receipt.human_boundary !== delivery.human_boundary ||
    receipt.authorization_mode !== delivery.authorization_mode ||
    receipt.max_active_activations !== delivery.max_active_activations
  ) {
    throw invariant("delivery_private_state_invalid", "Standing Delivery state is inconsistent");
  }
  return deepFreeze({
    duplicate,
    lease: {
      type: STANDING_DELIVERY_LEASE_TYPE,
      protocol_version: STANDING_PROTOCOL_VERSION,
      delivery_id: delivery.delivery_id,
      event_id: delivery.event_id,
      attempt: 1,
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
      "Stored standing continuation instruction is invalid",
    );
  }
  return value;
}

function assertConnectorScope(identity, delivery) {
  if (
    identity.subject_id !== delivery.subject_id ||
    identity.delivery_target_id !== delivery.delivery_target_id
  ) {
    throw authorization("connector_delivery_scope_invalid", "Connector is outside Delivery scope");
  }
}

function assertCurrentLease(identity, delivery, leaseTokenDigest) {
  assertConnectorScope(identity, delivery);
  if (!["leased", "acknowledged"].includes(delivery.status)) {
    throw conflict("delivery_not_leased", "Standing Delivery has no acknowledgeable lease");
  }
  if (
    delivery.connector_id !== identity.connector_id ||
    delivery.lease_token_digest !== leaseTokenDigest
  ) {
    throw authorization("delivery_lease_invalid", "Standing Delivery lease is invalid or stale");
  }
}

function normalizeHandoffAttestation(value, expected) {
  try {
    return validateRuntimeAdmissionAttestation(value, expected);
  } catch {
    throw authorization(
      "runtime_admission_invalid",
      "Standing runtime admission attestation is invalid",
    );
  }
}

function assertNotificationHandoffLease(identity, delivery, leaseTokenDigest, now) {
  assertConnectorScope(identity, delivery);
  if (delivery.status !== "leased") {
    throw conflict("delivery_not_handoffable", "Standing Delivery is not leased");
  }
  if (
    delivery.connector_id !== identity.connector_id ||
    delivery.lease_token_digest !== leaseTokenDigest
  ) {
    throw authorization("delivery_lease_invalid", "Standing Delivery lease is invalid or stale");
  }
  if (!delivery.leased_at || !delivery.lease_expires_at) {
    throw invariant("delivery_private_state_invalid", "Standing Delivery lease state is invalid");
  }
  if (Date.parse(delivery.lease_expires_at) <= now.getTime()) {
    throw conflict("delivery_lease_expired", "Standing Delivery lease has expired");
  }
  if (delivery.grant_revoked_at !== null) {
    throw scope("grant_revoked", "Standing Grant is revoked", 410);
  }
  if (Date.parse(delivery.grant_expires_at) <= now.getTime()) {
    throw scope("grant_expired", "Standing Grant is expired", 410);
  }
}

function assertNotificationHandoffWindow(attestation, delivery, now) {
  if (!delivery.leased_at || !delivery.lease_expires_at) {
    throw invariant("delivery_private_state_invalid", "Standing Delivery lease window is invalid");
  }
  const acceptedAt = Date.parse(attestation.accepted_at);
  const revokedAt = delivery.grant_revoked_at === null
    ? null
    : Date.parse(delivery.grant_revoked_at);
  if (
    acceptedAt < Date.parse(delivery.leased_at) ||
    acceptedAt >= Date.parse(delivery.lease_expires_at) ||
    acceptedAt >= Date.parse(delivery.grant_expires_at) ||
    acceptedAt > now.getTime() + AUTHORITY_FUTURE_SKEW_MS ||
    (revokedAt !== null && acceptedAt >= revokedAt)
  ) {
    throw authorization(
      "runtime_admission_time_invalid",
      "Standing runtime admission is outside its valid window",
    );
  }
}

function assertEffectMatches(effect, delivery) {
  if (
    effect.delivery_id !== delivery.delivery_id ||
    effect.event_id !== delivery.event_id ||
    effect.correlation_id !== delivery.correlation_id ||
    effect.workflow_id !== delivery.workflow_id
  ) {
    throw authorization("host_effect_scope_invalid", "Standing Host effect is outside Delivery scope");
  }
}

function assertEffectWindow(effect, delivery, now) {
  const confirmedAt = Date.parse(effect.confirmed_at);
  const revokedAt = delivery.grant_revoked_at === null ? null : Date.parse(delivery.grant_revoked_at);
  if (
    confirmedAt < Date.parse(delivery.leased_at) ||
    confirmedAt >= Date.parse(delivery.lease_expires_at) ||
    confirmedAt >= Date.parse(delivery.grant_expires_at) ||
    confirmedAt > now.getTime() + AUTHORITY_FUTURE_SKEW_MS ||
    (revokedAt !== null && confirmedAt >= revokedAt)
  ) {
    throw authorization("host_effect_time_invalid", "Standing Host effect is outside its window");
  }
}

function acknowledgementResponse(delivery, effectId, duplicate) {
  return deepFreeze({
    type: STANDING_DELIVERY_ACKNOWLEDGEMENT_TYPE,
    protocol_version: STANDING_PROTOCOL_VERSION,
    delivery_id: delivery.delivery_id,
    event_id: delivery.event_id,
    effect_id: effectId,
    acknowledged: true,
    duplicate,
    status: "acknowledged",
  });
}

function grantSummary(grant, now, openDelivery) {
  return deepFreeze({
    type: "webmcp.receiver_grant_summary",
    protocol_version: STANDING_PROTOCOL_VERSION,
    binding_id: grant.binding_id,
    correlation_id: grant.correlation_id,
    workflow_id: grant.workflow_id,
    event_type: grant.event_type,
    authorization_mode: STANDING_AUTHORIZATION_MODE,
    max_active_activations: STANDING_MAX_ACTIVE_ACTIVATIONS,
    last_event_sequence: grant.last_event_sequence,
    active_activations: openDelivery ? 1 : 0,
    expires_at: grant.expires_at,
    status: grantStatus(grant, now),
    revoked_at: grant.revoked_at,
  });
}

function revocationResponse(grant, duplicate) {
  return deepFreeze({
    type: "webmcp.receiver_grant_revocation",
    protocol_version: STANDING_PROTOCOL_VERSION,
    binding_id: grant.binding_id,
    status: "revoked",
    revoked_at: grant.revoked_at,
    duplicate,
  });
}

function grantStatus(grant, now) {
  if (grant.revoked_at !== null) return "revoked";
  return Date.parse(grant.expires_at) <= now.getTime() ? "expired" : "active";
}

function assertControlSubject(grant, control) {
  if (grant.subject_id !== control.subject_id) {
    throw authorization("grant_control_subject_invalid", "Standing Grant belongs to another subject");
  }
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

function requireStore(store) {
  if (!store || typeof store !== "object") throw new TypeError("Standing Core store is required");
  for (const method of STORE_METHODS) {
    if (typeof store[method] !== "function") {
      throw new TypeError(`Standing Core store must implement ${method}`);
    }
  }
}

function requireAuthority(value, label, direct = false) {
  if (typeof value !== "function") {
    throw new TypeError(`${label}${direct ? " must be a function" : " is required"}`);
  }
}
