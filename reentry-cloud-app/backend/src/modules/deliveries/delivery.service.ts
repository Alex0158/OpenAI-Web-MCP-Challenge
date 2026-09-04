import type { Prisma } from "@prisma/client";
import { prisma } from "../../db";
import { isUniqueConstraintError } from "../../lib/prisma-errors";
import { digestSecret } from "../../middleware/organization-auth";
import { canonicalJson, parseManifest } from "../consent/manifest";

const LEASE_DURATION_MS = 60 * 1_000;
const CLAIM_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const EFFECT_FUTURE_SKEW_MS = 60 * 1_000;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const HOST_EFFECT_ATTESTATION_TYPE = "webmcp.host_effect_attestation";
const HOST_EFFECT_OUTCOME = "effect_applied_awaiting_human";
const CONTINUATION_EVENT_FIELDS = [
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
] as const;

const deliverySelect = {
  deliveryId: true,
  eventId: true,
  grantId: true,
  deliveryTargetId: true,
  status: true,
  maximumAttempts: true,
  currentAttempt: true,
  currentConnectorId: true,
  currentClaimTokenDigest: true,
  currentLeaseTokenDigest: true,
  leaseStartedAt: true,
  leaseExpiresAt: true,
  effectId: true,
  effectAttestationJson: true,
  acknowledgedAt: true,
  terminalReason: true,
  event: {
    select: {
      eventId: true,
      grantId: true,
      bindingId: true,
      correlationId: true,
      issuerOrigin: true,
      workflowId: true,
      eventType: true,
      eventSequence: true,
      stateVersion: true,
      occurredAt: true,
      canonicalUrl: true,
      canonicalBody: true,
    },
  },
  grant: {
    select: {
      id: true,
      accountId: true,
      connectorId: true,
      deliveryTargetId: true,
      bindingId: true,
      correlationId: true,
      issuerOrigin: true,
      workflowId: true,
      eventType: true,
      canonicalUrl: true,
      humanBoundary: true,
      expiresAt: true,
      revokedAt: true,
      consentSession: {
        select: { manifestJson: true },
      },
    },
  },
} as const;

type DeliveryRecord = Prisma.DeliveryGetPayload<{ select: typeof deliverySelect }>;

type DeliveryCandidate = {
  delivery_id: string;
  status: string;
  current_attempt: number;
};

type ConnectorIdentity = {
  id: string;
  accountId: string;
  deliveryTargetId: string;
  expiresAt: Date;
};

export type HostEffectExpected = {
  delivery_id: string;
  event_id: string;
  correlation_id: string;
  workflow_id: string;
  canonical_url: string;
  human_boundary: string;
  outcome: typeof HOST_EFFECT_OUTCOME;
};

export type HostEffectAttestation = {
  type: typeof HOST_EFFECT_ATTESTATION_TYPE;
  protocol_version: "0.1";
  effect_id: string;
  delivery_id: string;
  event_id: string;
  correlation_id: string;
  workflow_id: string;
  outcome: typeof HOST_EFFECT_OUTCOME;
  confirmed_at: string;
};

export type EffectAuthority = {
  verifyEffect(input: {
    effectToken: string;
    expected: HostEffectExpected;
  }): HostEffectAttestation | Promise<HostEffectAttestation>;
};

export class DeliveryError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number
  ) {
    super(code);
    this.name = "DeliveryError";
  }
}

function requireClaimToken(value: string): string {
  if (!CLAIM_TOKEN_PATTERN.test(value)) {
    throw new DeliveryError("claim_token_invalid", 400);
  }
  const decoded = Buffer.from(value, "base64url");
  if (decoded.length !== 32 || decoded.toString("base64url") !== value) {
    throw new DeliveryError("claim_token_invalid", 400);
  }
  return value;
}

function requireIdentifier(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 160 ||
    !IDENTIFIER_PATTERN.test(value) ||
    Buffer.byteLength(value, "utf8") > 160
  ) {
    throw new DeliveryError("host_effect_invalid", 403);
  }
  return value;
}

function requireTimestamp(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length > 27 ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString() !== value
  ) {
    throw new DeliveryError("host_effect_invalid", 403);
  }
  return value;
}

function assertExactKeys(value: Record<string, unknown>, expected: readonly string[]): void {
  const actual = Object.keys(value).sort();
  const keys = [...expected].sort();
  if (actual.length !== keys.length || actual.some((key, index) => key !== keys[index])) {
    throw new DeliveryError("delivery_private_state_invalid", 500);
  }
}

function readCanonicalEvent(delivery: DeliveryRecord): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(delivery.event.canonicalBody);
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed) ||
      canonicalJson(parsed) !== delivery.event.canonicalBody
    ) {
      throw new Error("event body is not canonical");
    }
  } catch {
    throw new DeliveryError("delivery_private_state_invalid", 500);
  }

  const event = parsed as Record<string, unknown>;
  assertExactKeys(event, CONTINUATION_EVENT_FIELDS);
  if (
    event.type !== "webmcp.continuation_event" ||
    event.protocol_version !== "0.1" ||
    event.event_id !== delivery.event.eventId ||
    event.correlation_id !== delivery.event.correlationId ||
    event.binding_id !== delivery.event.bindingId ||
    event.issuer_origin !== delivery.event.issuerOrigin ||
    event.workflow_id !== delivery.event.workflowId ||
    event.event_type !== delivery.event.eventType ||
    event.event_sequence !== delivery.event.eventSequence ||
    event.state_version !== Number(delivery.event.stateVersion) ||
    event.occurred_at !== delivery.event.occurredAt.toISOString() ||
    event.canonical_url !== delivery.event.canonicalUrl
  ) {
    throw new DeliveryError("delivery_private_state_invalid", 500);
  }
  return event;
}

function assertDeliveryContext(delivery: DeliveryRecord): void {
  if (
    delivery.eventId !== delivery.event.eventId ||
    delivery.grantId !== delivery.grant.id ||
    delivery.event.grantId !== delivery.grant.id ||
    delivery.deliveryTargetId !== delivery.grant.deliveryTargetId ||
    delivery.grant.bindingId !== delivery.event.bindingId ||
    delivery.grant.correlationId !== delivery.event.correlationId ||
    delivery.grant.issuerOrigin !== delivery.event.issuerOrigin ||
    delivery.grant.workflowId !== delivery.event.workflowId ||
    delivery.grant.eventType !== delivery.event.eventType ||
    delivery.grant.canonicalUrl !== delivery.event.canonicalUrl
  ) {
    throw new DeliveryError("delivery_private_state_invalid", 500);
  }
}

function readContinuationInstruction(delivery: DeliveryRecord): string {
  try {
    // The signed Manifest was validated before ConsentSession creation. Parse
    // the stored projection again at claim time so a corrupted private row
    // fails closed instead of becoming arbitrary Connector authority.
    return parseManifest(delivery.grant.consentSession.manifestJson).display.reason;
  } catch {
    throw new DeliveryError("delivery_private_state_invalid", 500);
  }
}

function buildLeaseResult(
  delivery: DeliveryRecord,
  claimToken: string,
  duplicate: boolean,
  connectorExpiresAt: Date,
  now: Date
): Record<string, unknown> {
  assertDeliveryContext(delivery);
  const event = readCanonicalEvent(delivery);
  const instruction = readContinuationInstruction(delivery);
  const leaseExpiresAt = delivery.leaseExpiresAt;
  if (!leaseExpiresAt || leaseExpiresAt <= now) {
    throw new DeliveryError("delivery_private_state_invalid", 500);
  }

  const grantExpiresAt = delivery.grant.expiresAt;
  if (
    leaseExpiresAt.getTime() > grantExpiresAt.getTime() ||
    leaseExpiresAt.getTime() > connectorExpiresAt.getTime()
  ) {
    throw new DeliveryError("delivery_private_state_invalid", 500);
  }

  const receipt = {
    type: "webmcp.continuation_receipt",
    protocol_version: "0.1",
    grant_id: delivery.grant.id,
    correlation_id: delivery.grant.correlationId,
    issuer_origin: delivery.grant.issuerOrigin,
    workflow_id: delivery.grant.workflowId,
    event_type: delivery.grant.eventType,
    canonical_url: delivery.grant.canonicalUrl,
    expires_at: grantExpiresAt.toISOString(),
    human_boundary: delivery.grant.humanBoundary,
    continuation_mode: "open_canonical_page_read_current_state",
  };

  return {
    duplicate,
    lease: {
      type: "webmcp.delivery_lease",
      protocol_version: "0.1",
      delivery_id: delivery.deliveryId,
      event_id: delivery.eventId,
      attempt: delivery.currentAttempt,
      lease_token: claimToken,
      lease_expires_at: leaseExpiresAt.toISOString(),
      continuation: {
        correlation_id: event.correlation_id,
        workflow_id: event.workflow_id,
        event_type: event.event_type,
        event_sequence: event.event_sequence,
        state_version: event.state_version,
        occurred_at: event.occurred_at,
        canonical_url: event.canonical_url,
        instruction,
      },
      receipt,
    },
  };
}

function assertConnectorScope(
  connector: ConnectorIdentity,
  delivery: DeliveryRecord
): void {
  if (
    delivery.deliveryTargetId !== connector.deliveryTargetId ||
    delivery.grant.connectorId !== connector.id ||
    delivery.grant.accountId !== connector.accountId
  ) {
    throw new DeliveryError("connector_delivery_scope_invalid", 403);
  }
}

async function resolveConnector(
  transaction: Prisma.TransactionClient,
  connectorToken: string,
  now: Date
): Promise<ConnectorIdentity> {
  const connector = await transaction.connector.findUnique({
    where: { tokenDigest: digestSecret(connectorToken) },
    select: { id: true, accountId: true, deliveryTargetId: true, expiresAt: true, revokedAt: true },
  });
  if (!connector || connector.revokedAt !== null || connector.expiresAt <= now) {
    throw new DeliveryError("connector_identity_invalid", 403);
  }
  return connector;
}

async function lockTarget(
  transaction: Prisma.TransactionClient,
  deliveryTargetId: string
): Promise<void> {
  await transaction.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtextextended(${deliveryTargetId}, 0))
  `;
}

async function findClaimCandidate(
  transaction: Prisma.TransactionClient,
  deliveryTargetId: string,
  now: Date
): Promise<DeliveryCandidate | null> {
  const candidates = await transaction.$queryRaw<DeliveryCandidate[]>`
    SELECT
      d."delivery_id",
      d."status",
      d."current_attempt"
    FROM "cr2_deliveries" d
    INNER JOIN "cr2_grants" g ON g."grant_id" = d."grant_id"
    WHERE d."delivery_target_id" = ${deliveryTargetId}
      AND d."status" IN ('pending', 'leased')
      AND (
        d."status" = 'pending'
        OR d."lease_expires_at" <= ${now}
      )
    ORDER BY d."created_at" ASC, d."delivery_id" ASC
    LIMIT 1
    FOR UPDATE OF d
    SKIP LOCKED
  `;
  return candidates[0] ?? null;
}

export async function claimDelivery(
  connectorToken: string,
  claimToken: string
): Promise<Record<string, unknown> | null> {
  const validatedClaimToken = requireClaimToken(claimToken);
  const claimTokenDigest = digestSecret(validatedClaimToken);

  return prisma.$transaction(async (transaction) => {
    const now = new Date();
    const connector = await resolveConnector(transaction, connectorToken, now);

    // One advisory lock per fixed delivery target serializes claims without a
    // process-local mutex and lets the transaction re-check the committed
    // state after a competing claim finishes.
    await lockTarget(transaction, connector.deliveryTargetId);

    const previousAttempt = await transaction.deliveryAttempt.findUnique({
      where: { claimTokenDigest },
      select: {
        attempt: true,
        connectorId: true,
        delivery: { select: deliverySelect },
      },
    });
    if (previousAttempt) {
      if (previousAttempt.connectorId !== connector.id) {
        throw new DeliveryError("delivery_lease_scope_invalid", 403);
      }
      const delivery = previousAttempt.delivery;
      if (
        delivery.currentAttempt !== previousAttempt.attempt ||
        delivery.currentClaimTokenDigest !== claimTokenDigest
      ) {
        throw new DeliveryError("claim_token_retired", 409);
      }
      assertConnectorScope(connector, delivery);
      const authorityEndReason = grantAuthorityEndReason(delivery, now);
      if (delivery.status === "leased" && authorityEndReason) {
        const exhausted = await transaction.delivery.updateMany({
          where: {
            deliveryId: delivery.deliveryId,
            status: "leased",
            currentAttempt: delivery.currentAttempt,
            currentConnectorId: delivery.currentConnectorId,
            currentClaimTokenDigest: delivery.currentClaimTokenDigest,
            currentLeaseTokenDigest: delivery.currentLeaseTokenDigest,
            leaseExpiresAt: delivery.leaseExpiresAt,
          },
          data: {
            status: "retry_exhausted",
            terminalReason: authorityEndReason,
            updatedAt: now,
          },
        });
        if (exhausted.count !== 1) {
          throw new DeliveryError("delivery_claim_race", 409);
        }
        return null;
      }
      if (delivery.status === "leased" && delivery.leaseExpiresAt && delivery.leaseExpiresAt > now) {
        return buildLeaseResult(delivery, validatedClaimToken, true, connector.expiresAt, now);
      }
      throw new DeliveryError("claim_token_retired", 409);
    }

    const activeLease = await transaction.delivery.findFirst({
      where: {
        deliveryTargetId: connector.deliveryTargetId,
        status: "leased",
        leaseExpiresAt: { gt: now },
      },
      select: { deliveryId: true },
    });
    if (activeLease) return null;

    const candidate = await findClaimCandidate(transaction, connector.deliveryTargetId, now);
    if (!candidate) return null;

    const delivery = await transaction.delivery.findUnique({
      where: { deliveryId: candidate.delivery_id },
      select: deliverySelect,
    });
    if (!delivery) throw new DeliveryError("delivery_claim_race", 409);
    assertConnectorScope(connector, delivery);

    if (delivery.status === "pending") {
      if (delivery.currentAttempt !== 0) {
        throw new DeliveryError("delivery_state_invalid", 500);
      }
      const authorityEndReason = grantAuthorityEndReason(delivery, now);
      if (authorityEndReason) {
        const cancelled = await transaction.delivery.updateMany({
          where: {
            deliveryId: delivery.deliveryId,
            status: "pending",
            currentAttempt: 0,
          },
          data: {
            status: "cancelled",
            terminalReason: authorityEndReason,
            updatedAt: now,
          },
        });
        if (cancelled.count !== 1) {
          throw new DeliveryError("delivery_claim_race", 409);
        }
        return null;
      }
    } else if (delivery.status === "leased") {
      if (!delivery.leaseExpiresAt || delivery.leaseExpiresAt > now) {
        throw new DeliveryError("delivery_claim_race", 409);
      }
      const authorityEndReason = grantAuthorityEndReason(delivery, now);
      if (authorityEndReason || delivery.currentAttempt >= delivery.maximumAttempts) {
        const exhausted = await transaction.delivery.updateMany({
          where: {
            deliveryId: delivery.deliveryId,
            status: "leased",
            currentAttempt: delivery.currentAttempt,
            currentConnectorId: delivery.currentConnectorId,
            currentClaimTokenDigest: delivery.currentClaimTokenDigest,
            currentLeaseTokenDigest: delivery.currentLeaseTokenDigest,
            leaseExpiresAt: delivery.leaseExpiresAt,
          },
          data: {
            status: "retry_exhausted",
            terminalReason: authorityEndReason ?? "attempt_limit_reached",
            updatedAt: now,
          },
        });
        if (exhausted.count !== 1) {
          throw new DeliveryError("delivery_claim_race", 409);
        }
        return null;
      }
    } else {
      throw new DeliveryError("delivery_state_invalid", 500);
    }

    const leaseExpiresAtMs = Math.min(
      now.getTime() + LEASE_DURATION_MS,
      delivery.grant.expiresAt.getTime(),
      connector.expiresAt.getTime()
    );
    if (!Number.isFinite(leaseExpiresAtMs) || leaseExpiresAtMs <= now.getTime()) {
      throw new DeliveryError("connector_identity_invalid", 403);
    }
    const leaseStartedAt = now;
    const leaseExpiresAt = new Date(leaseExpiresAtMs);
    const attempt = delivery.currentAttempt + 1;
    const updated = await transaction.delivery.updateMany({
      where: {
        deliveryId: delivery.deliveryId,
        status: delivery.status,
        currentAttempt: delivery.currentAttempt,
        currentConnectorId: delivery.currentConnectorId,
        currentClaimTokenDigest: delivery.currentClaimTokenDigest,
        currentLeaseTokenDigest: delivery.currentLeaseTokenDigest,
        leaseExpiresAt: delivery.leaseExpiresAt,
      },
      data: {
        status: "leased",
        currentAttempt: attempt,
        currentConnectorId: connector.id,
        currentClaimTokenDigest: claimTokenDigest,
        currentLeaseTokenDigest: claimTokenDigest,
        leaseStartedAt,
        leaseExpiresAt,
        terminalReason: null,
        updatedAt: now,
      },
    });
    if (updated.count !== 1) {
      throw new DeliveryError("delivery_claim_race", 409);
    }

    try {
      await transaction.deliveryAttempt.create({
        data: {
          deliveryId: delivery.deliveryId,
          connectorId: connector.id,
          attempt,
          claimTokenDigest,
          leaseTokenDigest: claimTokenDigest,
          leaseStartedAt,
          leaseExpiresAt,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new DeliveryError("claim_token_retired", 409);
      }
      throw error;
    }

    return buildLeaseResult(
      {
        ...delivery,
        status: "leased",
        currentAttempt: attempt,
        currentConnectorId: connector.id,
        currentClaimTokenDigest: claimTokenDigest,
        currentLeaseTokenDigest: claimTokenDigest,
        leaseStartedAt,
        leaseExpiresAt,
        terminalReason: null,
      },
      validatedClaimToken,
      false,
      connector.expiresAt,
      now
    );
  });
}

function grantAuthorityEndReason(
  delivery: DeliveryRecord,
  now: Date
): "grant_revoked" | "grant_expired" | null {
  if (delivery.grant.revokedAt !== null) return "grant_revoked";
  if (delivery.grant.expiresAt <= now) return "grant_expired";
  return null;
}

function assertEffectMatchesDelivery(
  effect: HostEffectAttestation,
  delivery: DeliveryRecord
): void {
  if (
    effect.delivery_id !== delivery.deliveryId ||
    effect.event_id !== delivery.eventId ||
    effect.correlation_id !== delivery.event.correlationId ||
    effect.workflow_id !== delivery.event.workflowId ||
    effect.outcome !== HOST_EFFECT_OUTCOME
  ) {
    throw new DeliveryError("host_effect_invalid", 403);
  }
}

function normalizeEffectAttestation(
  value: unknown,
  now: Date
): HostEffectAttestation {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new DeliveryError("host_effect_invalid", 403);
  }
  const record = value as Record<string, unknown>;
  assertExactKeys(record, [
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
  if (
    record.type !== HOST_EFFECT_ATTESTATION_TYPE ||
    record.protocol_version !== "0.1" ||
    record.outcome !== HOST_EFFECT_OUTCOME
  ) {
    throw new DeliveryError("host_effect_invalid", 403);
  }
  const attestation: HostEffectAttestation = {
    type: HOST_EFFECT_ATTESTATION_TYPE,
    protocol_version: "0.1",
    effect_id: requireIdentifier(record.effect_id),
    delivery_id: requireIdentifier(record.delivery_id),
    event_id: requireIdentifier(record.event_id),
    correlation_id: requireIdentifier(record.correlation_id),
    workflow_id: requireIdentifier(record.workflow_id),
    outcome: HOST_EFFECT_OUTCOME,
    confirmed_at: requireTimestamp(record.confirmed_at),
  };
  if (Date.parse(attestation.confirmed_at) > now.getTime() + EFFECT_FUTURE_SKEW_MS) {
    throw new DeliveryError("host_effect_invalid", 403);
  }
  return attestation;
}

function assertEffectWindow(
  effect: HostEffectAttestation,
  delivery: DeliveryRecord,
  now: Date
): void {
  if (!delivery.leaseStartedAt || !delivery.leaseExpiresAt) {
    throw new DeliveryError("delivery_private_state_invalid", 500);
  }
  const confirmedAt = Date.parse(effect.confirmed_at);
  if (
    confirmedAt < delivery.leaseStartedAt.getTime() ||
    confirmedAt >= delivery.leaseExpiresAt.getTime() ||
    confirmedAt >= delivery.grant.expiresAt.getTime() ||
    confirmedAt > now.getTime() + EFFECT_FUTURE_SKEW_MS ||
    (delivery.grant.revokedAt !== null && confirmedAt >= delivery.grant.revokedAt.getTime())
  ) {
    throw new DeliveryError("host_effect_time_invalid", 403);
  }
}

function buildAcknowledgementResult(
  delivery: DeliveryRecord,
  effectId: string,
  duplicate: boolean
): Record<string, unknown> {
  assertDeliveryContext(delivery);
  return {
    type: "webmcp.delivery_acknowledgement",
    protocol_version: "0.1",
    delivery_id: delivery.deliveryId,
    event_id: delivery.eventId,
    effect_id: effectId,
    acknowledged: true,
    duplicate,
    status: "acknowledged",
  };
}

export async function acknowledgeDelivery(
  connectorToken: string,
  deliveryId: string,
  leaseToken: string,
  effectToken: string,
  effectAuthority?: EffectAuthority
): Promise<Record<string, unknown>> {
  const validatedLeaseToken = requireClaimToken(leaseToken);
  const leaseTokenDigest = digestSecret(validatedLeaseToken);
  const now = new Date();
  if (!effectAuthority || typeof effectAuthority.verifyEffect !== "function") {
    throw new DeliveryError("host_effect_authority_unavailable", 501);
  }

  const connector = await prisma.connector.findUnique({
    where: { tokenDigest: digestSecret(connectorToken) },
    select: { id: true, accountId: true, deliveryTargetId: true, expiresAt: true, revokedAt: true },
  });
  if (!connector || connector.revokedAt !== null || connector.expiresAt <= now) {
    throw new DeliveryError("connector_identity_invalid", 403);
  }
  const initial = await prisma.delivery.findUnique({
    where: { deliveryId },
    select: deliverySelect,
  });
  if (!initial) throw new DeliveryError("delivery_not_found", 404);
  assertConnectorScope(connector, initial);
  if (!["leased", "retry_exhausted", "acknowledged"].includes(initial.status)) {
    throw new DeliveryError("delivery_not_leased", 409);
  }
  if (
    initial.currentConnectorId !== connector.id ||
    initial.currentLeaseTokenDigest !== leaseTokenDigest
  ) {
    throw new DeliveryError("delivery_lease_invalid", 403);
  }
  assertDeliveryContext(initial);

  const effectTokenValue = requireOpaqueEffectToken(effectToken);
  const expected: HostEffectExpected = {
    delivery_id: initial.deliveryId,
    event_id: initial.eventId,
    correlation_id: initial.event.correlationId,
    workflow_id: initial.event.workflowId,
    canonical_url: initial.grant.canonicalUrl,
    human_boundary: initial.grant.humanBoundary,
    outcome: HOST_EFFECT_OUTCOME,
  };

  let effect: HostEffectAttestation;
  try {
    effect = normalizeEffectAttestation(
      await effectAuthority.verifyEffect({ effectToken: effectTokenValue, expected }),
      now
    );
    assertEffectMatchesDelivery(effect, initial);
  } catch {
    throw new DeliveryError("host_effect_invalid", 403);
  }
  assertEffectWindow(effect, initial, now);
  const effectJson = canonicalJson(effect);

  try {
    return await prisma.$transaction(async (transaction) => {
      const current = await transaction.delivery.findUnique({
        where: { deliveryId },
        select: deliverySelect,
      });
      if (!current) throw new DeliveryError("delivery_not_found", 404);
      assertConnectorScope(connector, current);
      if (
        current.currentConnectorId !== connector.id ||
        current.currentLeaseTokenDigest !== leaseTokenDigest
      ) {
        throw new DeliveryError("delivery_lease_invalid", 403);
      }
      assertDeliveryContext(current);
      assertEffectMatchesDelivery(effect, current);
      assertEffectWindow(effect, current, now);

      const effectOwner = await transaction.delivery.findUnique({
        where: { effectId: effect.effect_id },
        select: { deliveryId: true },
      });
      if (effectOwner && effectOwner.deliveryId !== deliveryId) {
        throw new DeliveryError("effect_identity_conflict", 409);
      }

      if (current.status === "acknowledged") {
        if (
          current.effectId !== effect.effect_id ||
          current.effectAttestationJson !== effectJson
        ) {
          throw new DeliveryError("delivery_effect_conflict", 409);
        }
        return buildAcknowledgementResult(current, effect.effect_id, true);
      }
      if (!["leased", "retry_exhausted"].includes(current.status)) {
        throw new DeliveryError("delivery_not_acknowledgeable", 409);
      }

      const acknowledgedAt = now;
      const updated = await transaction.delivery.updateMany({
        where: {
          deliveryId,
          status: current.status,
          currentAttempt: current.currentAttempt,
          currentConnectorId: current.currentConnectorId,
          currentClaimTokenDigest: current.currentClaimTokenDigest,
          currentLeaseTokenDigest: current.currentLeaseTokenDigest,
          leaseExpiresAt: current.leaseExpiresAt,
        },
        data: {
          status: "acknowledged",
          effectId: effect.effect_id,
          effectAttestationJson: effectJson,
          acknowledgedAt,
          terminalReason: null,
          updatedAt: acknowledgedAt,
        },
      });
      if (updated.count !== 1) {
        throw new DeliveryError("delivery_acknowledgement_race", 409);
      }
      return buildAcknowledgementResult(current, effect.effect_id, false);
    });
  } catch (error) {
    if (error instanceof DeliveryError) throw error;
    if (isUniqueConstraintError(error)) {
      throw new DeliveryError("effect_identity_conflict", 409);
    }
    throw error;
  }
}

function requireOpaqueEffectToken(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    Buffer.byteLength(value, "utf8") > 4 * 1_024 ||
    /[^\x21-\x7e]/.test(value)
  ) {
    throw new DeliveryError("host_effect_token_invalid", 403);
  }
  return value;
}
