import { createPublicKey, verify } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../db";
import { isUniqueConstraintError } from "../../lib/prisma-errors";
import { canonicalJson, normalizeOrigin } from "../consent/manifest";
import {
  eventBodySchema,
  type ContinuationEvent,
  type EventEnvelope,
} from "./event.schemas";

const EVENT_BODY_MAX_BYTES = 8 * 1_024;
const DELIVERY_CLOCK_SKEW_MS = 5 * 60 * 1_000;
const EVENT_FUTURE_SKEW_MS = 60 * 1_000;
const EPOCH_SECONDS_PATTERN = /^(?:0|[1-9]\d*)$/;
const SIGNATURE_PATTERN = /^[A-Za-z0-9_-]{86}$/;

export class EventError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number
  ) {
    super(code);
    this.name = "EventError";
  }
}

export type EventAcceptance = {
  type: "webmcp.continuation_acceptance";
  protocol_version: "0.1";
  event_id: string;
  correlation_id: string;
  accepted: true;
  duplicate: boolean;
  status: "accepted";
};

type EventGrant = {
  id: string;
  organizationId: string;
  bindingId: string;
  deliveryTargetId: string;
  correlationId: string;
  issuerOrigin: string;
  workflowId: string;
  eventType: string;
  canonicalUrl: string;
  expiresAt: Date;
  runsRemaining: number;
  revokedAt: Date | null;
};

type ExistingEvent = {
  grantId: string;
  canonicalBody: string;
};

function acceptance(event: ContinuationEvent, duplicate: boolean): EventAcceptance {
  return {
    type: "webmcp.continuation_acceptance",
    protocol_version: "0.1",
    event_id: event.event_id,
    correlation_id: event.correlation_id,
    accepted: true,
    duplicate,
    status: "accepted",
  };
}

function validationErrorForBodyIssue(
  parsed: unknown,
  issuePath: PropertyKey | undefined
): EventError {
  const record = parsed !== null && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
  if (issuePath === "event_sequence") {
    const value = record?.event_sequence;
    if (typeof value === "number" && Number.isSafeInteger(value) && value >= 1) {
      return new EventError("event_sequence_invalid", 422);
    }
    return new EventError("protocol_integer_invalid", 422);
  }
  if (issuePath === "state_version") return new EventError("protocol_integer_invalid", 422);
  if (issuePath === "type" || issuePath === "protocol_version") {
    return new EventError("event_version_unsupported", 422);
  }
  if (issuePath === "issuer_origin") return new EventError("protocol_origin_invalid", 422);
  if (issuePath === "canonical_url") return new EventError("protocol_url_invalid", 422);
  if (issuePath === "occurred_at") return new EventError("protocol_timestamp_invalid", 422);
  return new EventError("event_body_invalid", 400);
}

function parseEventBody(body: string): ContinuationEvent {
  if (Buffer.byteLength(body, "utf8") > EVENT_BODY_MAX_BYTES) {
    throw new EventError("event_body_too_large", 413);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new EventError("event_body_invalid", 400);
  }

  const result = eventBodySchema.safeParse(parsed);
  if (!result.success) {
    throw validationErrorForBodyIssue(parsed, result.error.issues[0]?.path[0]);
  }
  const event = result.data;

  if (event.type !== "webmcp.continuation_event" || event.protocol_version !== "0.1") {
    throw new EventError("event_version_unsupported", 422);
  }
  if (event.event_sequence !== 1) {
    throw new EventError("event_sequence_invalid", 422);
  }
  if (event.state_version < 0 || !Number.isSafeInteger(event.state_version)) {
    throw new EventError("protocol_integer_invalid", 422);
  }

  let issuerOrigin: string;
  try {
    if (Buffer.byteLength(event.issuer_origin, "utf8") > 2_048) throw new Error("origin too large");
    issuerOrigin = normalizeOrigin(event.issuer_origin);
  } catch {
    throw new EventError("protocol_origin_invalid", 422);
  }

  try {
    const canonicalUrl = new URL(event.canonical_url);
    if (
      Buffer.byteLength(event.canonical_url, "utf8") > 2_048 ||
      !["http:", "https:"].includes(canonicalUrl.protocol) ||
      canonicalUrl.username ||
      canonicalUrl.password ||
      canonicalUrl.hash ||
      canonicalUrl.origin !== issuerOrigin ||
      canonicalUrl.href !== event.canonical_url
    ) {
      throw new Error("canonical URL is invalid");
    }
  } catch {
    throw new EventError("protocol_url_invalid", 422);
  }

  if (canonicalJson(event) !== body) {
    throw new EventError("event_body_noncanonical", 422);
  }
  return event;
}

function parseDeliveryTimestamp(value: string): number {
  if (value.length > 16 || !EPOCH_SECONDS_PATTERN.test(value)) {
    throw new EventError("event_delivery_timestamp_invalid", 400);
  }
  const seconds = Number(value);
  if (!Number.isSafeInteger(seconds)) {
    throw new EventError("event_delivery_timestamp_invalid", 400);
  }
  return seconds * 1_000;
}

function verifySignature(
  envelope: EventEnvelope,
  publicKeyPem: string
): boolean {
  try {
    return verify(
      null,
      Buffer.from(`${envelope.headers["WebMCP-Reentry-Timestamp"]}.${envelope.body}`, "utf8"),
      createPublicKey(publicKeyPem),
      Buffer.from(envelope.headers["WebMCP-Reentry-Signature"], "base64url")
    );
  } catch {
    return false;
  }
}

function assertGrantMatchesEvent(grant: EventGrant, event: ContinuationEvent): void {
  if (
    grant.bindingId !== event.binding_id ||
    grant.correlationId !== event.correlation_id ||
    grant.issuerOrigin !== event.issuer_origin ||
    grant.workflowId !== event.workflow_id ||
    grant.eventType !== event.event_type ||
    grant.canonicalUrl !== event.canonical_url
  ) {
    throw new EventError("event_scope_invalid", 422);
  }
}

function assertGrantAllowsEvent(
  grant: EventGrant,
  event: ContinuationEvent,
  now: Date
): void {
  if (grant.revokedAt !== null) throw new EventError("grant_revoked", 422);
  if (grant.expiresAt <= now) throw new EventError("grant_expired", 410);
  if (grant.runsRemaining <= 0) throw new EventError("grant_exhausted", 409);
  if (Date.parse(event.occurred_at) >= grant.expiresAt.getTime()) {
    throw new EventError("event_after_grant_expiry", 422);
  }
}

function assertReplayIdentity(
  existing: ExistingEvent,
  event: ContinuationEvent,
  body: string,
  candidateGrantIds: Set<string>
): void {
  if (
    existing.canonicalBody !== body ||
    !candidateGrantIds.has(existing.grantId)
  ) {
    throw new EventError("event_identity_conflict", 409);
  }
}

async function replayAfterReservationRace(
  transaction: Prisma.TransactionClient,
  event: ContinuationEvent,
  body: string,
  candidateGrantIds: Set<string>,
  grantId: string
): Promise<EventAcceptance> {
  const existing = await transaction.event.findUnique({
    where: { eventId: event.event_id },
    select: { grantId: true, canonicalBody: true },
  });
  if (existing) {
    assertReplayIdentity(existing, event, body, candidateGrantIds);
    if (existing.grantId === grantId) return acceptance(event, true);
  }

  const current = await transaction.grant.findUnique({
    where: { id: grantId },
    select: { expiresAt: true, runsRemaining: true, revokedAt: true },
  });
  if (!current) throw new EventError("receiver_busy", 503);
  if (current.revokedAt !== null) throw new EventError("grant_revoked", 422);
  if (current.expiresAt <= new Date()) throw new EventError("grant_expired", 410);
  if (current.runsRemaining <= 0) throw new EventError("grant_exhausted", 409);
  throw new EventError("grant_reservation_lost", 409);
}

export async function acceptEvent(envelope: EventEnvelope): Promise<EventAcceptance> {
  const event = parseEventBody(envelope.body);
  const candidateGrants = await prisma.grant.findMany({
    where: { bindingId: event.binding_id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      organizationId: true,
      bindingId: true,
      deliveryTargetId: true,
      correlationId: true,
      issuerOrigin: true,
      workflowId: true,
      eventType: true,
      canonicalUrl: true,
      expiresAt: true,
      runsRemaining: true,
      revokedAt: true,
    },
  });
  if (candidateGrants.length === 0) {
    throw new EventError("event_scope_invalid", 422);
  }

  const originGrants = candidateGrants.filter(
    (grant) => grant.issuerOrigin === event.issuer_origin
  );
  if (originGrants.length === 0) {
    throw new EventError("event_origin_mismatch", 422);
  }

  const now = new Date();
  const deliveryTimestampMs = parseDeliveryTimestamp(
    envelope.headers["WebMCP-Reentry-Timestamp"]
  );
  if (Math.abs(now.getTime() - deliveryTimestampMs) > DELIVERY_CLOCK_SKEW_MS) {
    throw new EventError("event_delivery_timestamp_outside_window", 401);
  }
  if (Date.parse(event.occurred_at) > now.getTime() + EVENT_FUTURE_SKEW_MS) {
    throw new EventError("event_occurred_in_future", 422);
  }

  const keyId = envelope.headers["WebMCP-Reentry-Key-Id"];
  const signature = envelope.headers["WebMCP-Reentry-Signature"];
  if (!SIGNATURE_PATTERN.test(signature)) {
    throw new EventError("event_signature_invalid", 401);
  }
  const hostKey = await prisma.hostKey.findUnique({
    where: {
      organizationId_issuerOrigin_keyId: {
        organizationId: originGrants[0].organizationId,
        issuerOrigin: event.issuer_origin,
        keyId,
      },
    },
    select: { publicKeyPem: true, revokedAt: true },
  });
  if (!hostKey || hostKey.revokedAt !== null) {
    throw new EventError("event_key_unavailable", 401);
  }
  if (!verifySignature(envelope, hostKey.publicKeyPem)) {
    throw new EventError("event_signature_invalid", 401);
  }

  const candidateGrantIds = new Set(originGrants.map((grant) => grant.id));
  try {
    return await prisma.$transaction(async (transaction) => {
      const existing = await transaction.event.findUnique({
        where: { eventId: event.event_id },
        select: { grantId: true, canonicalBody: true },
      });
      if (existing) {
        assertReplayIdentity(existing, event, envelope.body, candidateGrantIds);
        return acceptance(event, true);
      }

      const grant = await transaction.grant.findFirst({
        where: {
          id: { in: [...candidateGrantIds] },
          bindingId: event.binding_id,
          correlationId: event.correlation_id,
          issuerOrigin: event.issuer_origin,
          workflowId: event.workflow_id,
          eventType: event.event_type,
          canonicalUrl: event.canonical_url,
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          organizationId: true,
          bindingId: true,
          deliveryTargetId: true,
          correlationId: true,
          issuerOrigin: true,
          workflowId: true,
          eventType: true,
          canonicalUrl: true,
          expiresAt: true,
          runsRemaining: true,
          revokedAt: true,
        },
      });
      if (!grant) throw new EventError("event_scope_invalid", 422);
      assertGrantMatchesEvent(grant, event);
      assertGrantAllowsEvent(grant, event, now);

      const reserved = await transaction.grant.updateMany({
        where: {
          id: grant.id,
          revokedAt: null,
          expiresAt: { gt: now },
          runsRemaining: 1,
        },
        data: { runsRemaining: 0 },
      });
      if (reserved.count !== 1) {
        return replayAfterReservationRace(
          transaction,
          event,
          envelope.body,
          candidateGrantIds,
          grant.id
        );
      }

      await transaction.event.create({
        data: {
          eventId: event.event_id,
          grantId: grant.id,
          bindingId: event.binding_id,
          correlationId: event.correlation_id,
          issuerOrigin: event.issuer_origin,
          workflowId: event.workflow_id,
          eventType: event.event_type,
          eventSequence: event.event_sequence,
          stateVersion: BigInt(event.state_version),
          occurredAt: new Date(event.occurred_at),
          canonicalUrl: event.canonical_url,
          canonicalBody: envelope.body,
          receivedAt: now,
        },
      });
      await transaction.delivery.create({
        data: {
          eventId: event.event_id,
          grantId: grant.id,
          deliveryTargetId: grant.deliveryTargetId,
          status: "pending",
          createdAt: now,
        },
      });

      return acceptance(event, false);
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    const existing = await prisma.event.findUnique({
      where: { eventId: event.event_id },
      select: { grantId: true, canonicalBody: true },
    });
    if (!existing) throw error;
    assertReplayIdentity(existing, event, envelope.body, candidateGrantIds);
    return acceptance(event, true);
  }
}
