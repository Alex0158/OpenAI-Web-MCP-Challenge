import { createHmac, randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { appConfig } from "../../config/config";
import { prisma } from "../../db";
import { isUniqueConstraintError } from "../../lib/prisma-errors";
import { digestSecret } from "../../middleware/organization-auth";
import {
  ManifestError,
  canonicalJson,
  normalizeOrigin,
  parseManifest,
  type ReentryManifest,
  validatePublicKeyPem,
  verifyManifest,
} from "./manifest";
import type {
  AccountConsentDecision,
  CreateConsentSession,
  RegisterHostKey,
} from "./consent.schemas";
import {
  deriveEffectiveGrantStatus,
  type EffectiveGrantStatus,
} from "./grant-control";

const CONSENT_LIFETIME_MS = 10 * 60 * 1_000;

export class ConsentError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number
  ) {
    super(code);
    this.name = "ConsentError";
  }
}

type ConsentSessionRecord = {
  id: string;
  challengeId: string;
  tokenDigest: string;
  organizationId: string;
  hostSubjectRefDigest: string;
  expectedOrigin: string;
  manifestId: string;
  manifestJson: Prisma.JsonValue;
  expiresAt: Date;
  status: string;
  decisionAction: string | null;
  decisionAt: Date | null;
  accountId: string | null;
  createdAt: Date;
};

type GrantRecord = {
  id: string;
  bindingId: string;
  correlationId: string;
  issuerOrigin: string;
  workflowId: string;
  eventType: string;
  expiresAt: Date;
  maxRuns: number;
  runsRemaining: number;
  revokedAt: Date | null;
};

export type PublicChallenge = {
  challenge_id: string;
  manifest_id: string;
  correlation_id: string;
  status: "pending" | "approved" | "declined" | "expired";
  issuer_origin: string;
  offer_expires_at: string;
  workflow: {
    id: string;
    type: string;
    canonical_url: string;
  };
  display: ReentryManifest["display"];
  grant_scope: {
    event_type: string;
    expires_at: string;
    max_runs: 1;
    human_boundary: string;
  };
};

export type PublicBinding = {
  type: "webmcp.reentry_binding";
  protocol_version: "0.1";
  binding_id: string;
  correlation_id: string;
  workflow_id: string;
  event_type: string;
  expires_at: string;
  runs_remaining: number;
  status: EffectiveGrantStatus;
};

export type HostKeyRegistration = {
  type: "webmcp.reentry_host_key";
  protocol_version: "0.1";
  host_id: string;
  issuer_origin: string;
  key_id: string;
  status: "active";
  duplicate: boolean;
};

export type ConsentSessionCreated = {
  type: "webmcp.reentry_consent_session";
  protocol_version: "0.1";
  consent_session_id: string;
  challenge: PublicChallenge;
  consent_url: string;
  expires_at: string;
  duplicate: boolean;
};

export type ConsentDecisionResult = {
  type: "webmcp.reentry_account_consent_decision";
  protocol_version: "0.1";
  consent_session_id: string;
  challenge_id: string;
  status: "approved" | "declined";
  duplicate: boolean;
};

export type ConsentStatusResult = {
  type: "webmcp.reentry_consent_status";
  protocol_version: "0.1";
  consent_session_id: string;
  challenge_id: string;
  status: "pending" | "approved" | "declined";
  effective_status: EffectiveGrantStatus | null;
  expires_at: string;
  binding: PublicBinding | null;
};

function translateManifestError(error: unknown, invalidCode: string = "manifest_invalid"): never {
  if (error instanceof ManifestError) {
    const statusCode =
      error.code === "manifest_signature_invalid"
        ? 401
        : error.code === "manifest_expired"
          ? 410
          : 422;
    throw new ConsentError(error.code, statusCode);
  }
  throw new ConsentError(invalidCode, 400);
}

function consentTokenForSession(sessionId: string): string {
  // A deterministic HMAC keeps retries idempotent while only the digest is
  // stored. The raw token never enters a database field or a log line.
  return createHmac("sha256", String(appConfig.jwtSecret))
    .update(`cr2-consent:${sessionId}`, "utf8")
    .digest("base64url");
}

function consentUrl(token: string): string {
  const base = appConfig.receiverPublicUrl.replace(/\/$/, "");
  return `${base}/consent?token=${encodeURIComponent(token)}`;
}

function publicChallenge(
  session: Pick<ConsentSessionRecord, "challengeId" | "expiresAt" | "status">,
  manifest: ReentryManifest,
  now: Date = new Date()
): PublicChallenge {
  const status =
    session.status === "pending" && session.expiresAt <= now
      ? "expired"
      : (session.status as PublicChallenge["status"]);

  return {
    challenge_id: session.challengeId,
    manifest_id: manifest.manifest_id,
    correlation_id: manifest.correlation_id,
    status,
    issuer_origin: normalizeOrigin(manifest.issuer_origin),
    offer_expires_at: manifest.offer_expires_at,
    workflow: {
      id: manifest.workflow.id,
      type: manifest.workflow.type,
      canonical_url: manifest.workflow.canonical_url,
    },
    display: manifest.display,
    grant_scope: {
      event_type: manifest.grant_request.event_type,
      expires_at: session.expiresAt.toISOString(),
      max_runs: manifest.grant_request.max_runs,
      human_boundary: manifest.grant_request.human_boundary,
    },
  };
}

function publicBinding(grant: GrantRecord, status: EffectiveGrantStatus): PublicBinding {
  return {
    type: "webmcp.reentry_binding",
    protocol_version: "0.1",
    binding_id: grant.bindingId,
    correlation_id: grant.correlationId,
    workflow_id: grant.workflowId,
    event_type: grant.eventType,
    expires_at: grant.expiresAt.toISOString(),
    runs_remaining: grant.runsRemaining,
    status,
  };
}

function effectiveConsentExpiry(manifest: ReentryManifest, now: Date): Date {
  const offerExpiresAt = new Date(manifest.offer_expires_at);
  const grantExpiresAt = new Date(manifest.grant_request.grant_expires_at);
  const shortLivedExpiry = new Date(now.getTime() + CONSENT_LIFETIME_MS);
  const expiresAt = new Date(
    Math.min(shortLivedExpiry.getTime(), offerExpiresAt.getTime(), grantExpiresAt.getTime())
  );
  if (
    !Number.isFinite(offerExpiresAt.getTime()) ||
    !Number.isFinite(grantExpiresAt.getTime()) ||
    expiresAt <= now
  ) {
    throw new ConsentError("consent_expired", 410);
  }
  return expiresAt;
}

function sameManifestIdentity(
  session: Pick<ConsentSessionRecord, "hostSubjectRefDigest" | "expectedOrigin" | "manifestJson">,
  subjectDigest: string,
  expectedOrigin: string,
  manifest: ReentryManifest
): boolean {
  return (
    session.hostSubjectRefDigest === subjectDigest &&
    session.expectedOrigin === expectedOrigin &&
    canonicalJson(session.manifestJson) === canonicalJson(manifest)
  );
}

function consentSessionResponse(
  session: Pick<ConsentSessionRecord, "id" | "challengeId" | "expiresAt" | "status">,
  manifest: ReentryManifest,
  duplicate: boolean,
  now: Date
): ConsentSessionCreated {
  return {
    type: "webmcp.reentry_consent_session",
    protocol_version: "0.1",
    consent_session_id: session.id,
    challenge: publicChallenge(session, manifest, now),
    consent_url: consentUrl(consentTokenForSession(session.id)),
    expires_at: session.expiresAt.toISOString(),
    duplicate,
  };
}

export async function registerHostKey(
  organizationId: string,
  input: RegisterHostKey
): Promise<HostKeyRegistration> {
  let issuerOrigin: string;
  try {
    issuerOrigin = normalizeOrigin(input.issuer_origin);
    validatePublicKeyPem(input.public_key_pem);
  } catch {
    throw new ConsentError("host_key_invalid", 400);
  }

  const where = {
    organizationId_issuerOrigin_keyId: {
      organizationId,
      issuerOrigin,
      keyId: input.key_id,
    },
  } as const;
  const existing = await prisma.hostKey.findUnique({ where });
  if (existing) {
    if (
      existing.hostId === input.host_id &&
      existing.publicKeyPem === input.public_key_pem &&
      existing.revokedAt === null
    ) {
      return {
        type: "webmcp.reentry_host_key",
        protocol_version: "0.1",
        host_id: existing.hostId,
        issuer_origin: existing.issuerOrigin,
        key_id: input.key_id,
        status: "active",
        duplicate: true,
      };
    }
    throw new ConsentError("host_key_conflict", 409);
  }

  try {
    const hostKey = await prisma.hostKey.create({
      data: {
        organizationId,
        hostId: input.host_id,
        issuerOrigin,
        keyId: input.key_id,
        publicKeyPem: input.public_key_pem,
      },
    });
    return {
      type: "webmcp.reentry_host_key",
      protocol_version: "0.1",
      host_id: hostKey.hostId,
      issuer_origin: hostKey.issuerOrigin,
      key_id: hostKey.keyId,
      status: "active",
      duplicate: false,
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new ConsentError("host_key_conflict", 409);
    throw error;
  }
}

export async function createConsentSession(
  organizationId: string,
  input: CreateConsentSession
): Promise<ConsentSessionCreated> {
  let manifest: ReentryManifest;
  let expectedOrigin: string;
  try {
    manifest = parseManifest(input.manifest);
    expectedOrigin = normalizeOrigin(input.expected_origin);
  } catch (error) {
    return translateManifestError(error);
  }

  let issuerOrigin: string;
  try {
    issuerOrigin = normalizeOrigin(manifest.issuer_origin);
  } catch (error) {
    return translateManifestError(error);
  }
  if (issuerOrigin !== expectedOrigin) {
    throw new ConsentError("manifest_signature_invalid", 400);
  }

  const hostKey = await prisma.hostKey.findUnique({
    where: {
      organizationId_issuerOrigin_keyId: {
        organizationId,
        issuerOrigin,
        keyId: manifest.signature.key_id,
      },
    },
    select: { publicKeyPem: true, revokedAt: true },
  });
  if (!hostKey || hostKey.revokedAt !== null) {
    throw new ConsentError("host_key_not_registered", 401);
  }

  try {
    manifest = verifyManifest(manifest, expectedOrigin, hostKey.publicKeyPem);
  } catch (error) {
    return translateManifestError(error);
  }

  const now = new Date();
  const expiresAt = effectiveConsentExpiry(manifest, now);
  const subjectDigest = digestSecret(input.host_subject_ref);
  const existing = await prisma.consentSession.findUnique({
    where: {
      organizationId_manifestId: {
        organizationId,
        manifestId: manifest.manifest_id,
      },
    },
  });

  if (existing) {
    if (!sameManifestIdentity(existing, subjectDigest, expectedOrigin, manifest)) {
      throw new ConsentError("manifest_identity_conflict", 409);
    }
    const existingManifest = parseManifest(existing.manifestJson);
    return consentSessionResponse(existing, existingManifest, true, now);
  }

  const id = randomUUID();
  const challengeId = randomUUID();
  const token = consentTokenForSession(id);
  let session;
  try {
    session = await prisma.consentSession.create({
      data: {
        id,
        challengeId,
        tokenDigest: digestSecret(token),
        organizationId,
        hostSubjectRefDigest: subjectDigest,
        expectedOrigin,
        manifestId: manifest.manifest_id,
        manifestJson: manifest as unknown as Prisma.InputJsonValue,
        expiresAt,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    const raced = await prisma.consentSession.findUnique({
      where: {
        organizationId_manifestId: {
          organizationId,
          manifestId: manifest.manifest_id,
        },
      },
    });
    if (!raced) throw new ConsentError("receiver_busy", 503);
    if (!sameManifestIdentity(raced, subjectDigest, expectedOrigin, manifest)) {
      throw new ConsentError("manifest_identity_conflict", 409);
    }
    return consentSessionResponse(raced, parseManifest(raced.manifestJson), true, now);
  }

  return consentSessionResponse(session, manifest, false, now);
}

function decisionResult(
  session: Pick<ConsentSessionRecord, "id" | "challengeId" | "status">,
  duplicate: boolean
): ConsentDecisionResult {
  if (session.status !== "approved" && session.status !== "declined") {
    throw new ConsentError("consent_not_decided", 409);
  }
  return {
    type: "webmcp.reentry_account_consent_decision",
    protocol_version: "0.1",
    consent_session_id: session.id,
    challenge_id: session.challengeId,
    status: session.status,
    duplicate,
  };
}

function assertTargetMatches(
  binding: { connectorId: string; deliveryTargetId: string },
  connector: { id: string; deliveryTargetId: string }
): void {
  if (
    binding.connectorId !== connector.id ||
    binding.deliveryTargetId !== connector.deliveryTargetId
  ) {
    throw new ConsentError("host_subject_binding_conflict", 409);
  }
}

export async function decideConsent(
  accountId: string,
  input: AccountConsentDecision
): Promise<ConsentDecisionResult> {
  const tokenDigest = digestSecret(input.consent_token);
  const now = new Date();

  return prisma.$transaction(async (transaction) => {
    const session = await transaction.consentSession.findUnique({
      where: { tokenDigest },
      include: { grant: { select: { connectorId: true } } },
    });
    if (!session) throw new ConsentError("consent_token_invalid", 403);

    if (session.status !== "pending") {
      if (session.accountId !== null && session.accountId !== accountId) {
        throw new ConsentError("consent_account_mismatch", 403);
      }
      if (session.decisionAction !== input.action) {
        throw new ConsentError("consent_already_decided", 409);
      }
      if (
        input.action === "approve" &&
        session.grant &&
        session.grant.connectorId !== input.connector_id
      ) {
        throw new ConsentError("consent_already_decided", 409);
      }
      return decisionResult(session, true);
    }

    if (session.expiresAt <= now) throw new ConsentError("consent_expired", 410);

    if (input.action === "decline") {
      const updated = await transaction.consentSession.updateMany({
        where: { id: session.id, status: "pending" },
        data: {
          status: "declined",
          decisionAction: "decline",
          decisionAt: now,
          accountId,
        },
      });
      if (updated.count !== 1) throw new ConsentError("consent_already_decided", 409);
      return {
        type: "webmcp.reentry_account_consent_decision",
        protocol_version: "0.1",
        consent_session_id: session.id,
        challenge_id: session.challengeId,
        status: "declined",
        duplicate: false,
      };
    }

    const connector = await transaction.connector.findUnique({
      where: { id: input.connector_id },
      select: { id: true, accountId: true, deliveryTargetId: true, expiresAt: true, revokedAt: true },
    });
    if (
      !connector ||
      connector.accountId !== accountId ||
      connector.revokedAt !== null ||
      connector.expiresAt <= now
    ) {
      throw new ConsentError("connector_not_available", 409);
    }

    // Claim the terminal decision before creating the binding and Grant. The
    // conditional update serializes concurrent approvals for one session; a
    // loser observes zero rows and rolls back without a second Grant.
    const decisionClaimed = await transaction.consentSession.updateMany({
      where: { id: session.id, status: "pending" },
      data: {
        status: "approved",
        decisionAction: "approve",
        decisionAt: now,
        accountId,
      },
    });
    if (decisionClaimed.count !== 1) throw new ConsentError("consent_already_decided", 409);

    let binding = await transaction.hostSubjectBinding.findUnique({
      where: {
        organizationId_hostSubjectRefDigest: {
          organizationId: session.organizationId,
          hostSubjectRefDigest: session.hostSubjectRefDigest,
        },
      },
      select: { id: true, connectorId: true, deliveryTargetId: true },
    });

    if (binding) {
      assertTargetMatches(binding, connector);
    } else {
      try {
        binding = await transaction.hostSubjectBinding.create({
          data: {
            organizationId: session.organizationId,
            hostSubjectRefDigest: session.hostSubjectRefDigest,
            connectorId: connector.id,
            deliveryTargetId: connector.deliveryTargetId,
          },
          select: { id: true, connectorId: true, deliveryTargetId: true },
        });
      } catch (error) {
        if (!isUniqueConstraintError(error)) throw error;
        const racedBinding = await transaction.hostSubjectBinding.findUnique({
          where: {
            organizationId_hostSubjectRefDigest: {
              organizationId: session.organizationId,
              hostSubjectRefDigest: session.hostSubjectRefDigest,
            },
          },
          select: { id: true, connectorId: true, deliveryTargetId: true },
        });
        if (!racedBinding) throw new ConsentError("receiver_busy", 503);
        assertTargetMatches(racedBinding, connector);
        binding = racedBinding;
      }
    }

    const manifest = parseManifest(session.manifestJson);
    await transaction.grant.create({
      data: {
        consentSessionId: session.id,
        organizationId: session.organizationId,
        bindingId: binding.id,
        accountId,
        connectorId: connector.id,
        deliveryTargetId: connector.deliveryTargetId,
        correlationId: manifest.correlation_id,
        issuerOrigin: normalizeOrigin(manifest.issuer_origin),
        workflowId: manifest.workflow.id,
        workflowType: manifest.workflow.type,
        canonicalUrl: manifest.workflow.canonical_url,
        eventType: manifest.grant_request.event_type,
        humanBoundary: manifest.grant_request.human_boundary,
        expiresAt: session.expiresAt,
        maxRuns: manifest.grant_request.max_runs,
        runsRemaining: manifest.grant_request.max_runs,
      },
    });

    return {
      type: "webmcp.reentry_account_consent_decision",
      protocol_version: "0.1",
      consent_session_id: session.id,
      challenge_id: session.challengeId,
      status: "approved",
      duplicate: false,
    };
  });
}

export async function getConsentStatus(
  organizationId: string,
  consentSessionId: string
): Promise<ConsentStatusResult> {
  const session = await prisma.consentSession.findFirst({
    where: { id: consentSessionId, organizationId },
    include: { grant: true },
  });
  if (!session) throw new ConsentError("consent_session_not_found", 404);

  const now = new Date();
  let effectiveStatus: EffectiveGrantStatus | null = null;
  let binding: PublicBinding | null = null;
  if (session.status === "pending") {
    effectiveStatus = session.expiresAt <= now ? "expired" : null;
  } else if (session.status === "approved") {
    if (!session.grant) throw new ConsentError("grant_missing", 500);
    effectiveStatus = deriveEffectiveGrantStatus(session.grant, now);
    binding = publicBinding(session.grant, effectiveStatus);
  }

  return {
    type: "webmcp.reentry_consent_status",
    protocol_version: "0.1",
    consent_session_id: session.id,
    challenge_id: session.challengeId,
    status: session.status as ConsentStatusResult["status"],
    effective_status: effectiveStatus,
    expires_at: session.expiresAt.toISOString(),
    binding,
  };
}

export type ConsentPrompt = {
  consentSessionId: string;
  session: PublicChallenge;
  status: "pending" | "approved" | "declined";
  connectors: Array<{ id: string; deviceName: string; expiresAt: string }>;
};

export async function validateConsentPageToken(token: string): Promise<void> {
  const session = await prisma.consentSession.findUnique({
    where: { tokenDigest: digestSecret(token) },
    select: { status: true, expiresAt: true },
  });
  if (!session) throw new ConsentError("consent_token_invalid", 404);
  if (session.status === "pending" && session.expiresAt <= new Date()) {
    throw new ConsentError("consent_session_expired", 410);
  }
}

export async function getConsentPrompt(
  token: string,
  accountId: string
): Promise<ConsentPrompt> {
  const session = await prisma.consentSession.findUnique({
    where: { tokenDigest: digestSecret(token) },
  });
  if (!session) throw new ConsentError("consent_token_invalid", 404);
  const now = new Date();
  if (session.status === "pending" && session.expiresAt <= now) {
    throw new ConsentError("consent_session_expired", 410);
  }

  const manifest = parseManifest(session.manifestJson);
  const connectors = await prisma.connector.findMany({
    where: { accountId, revokedAt: null, expiresAt: { gt: now } },
    select: { id: true, deviceName: true, expiresAt: true },
    orderBy: { createdAt: "asc" },
  });
  return {
    consentSessionId: session.id,
    session: publicChallenge(session, manifest, now),
    status: session.status as ConsentPrompt["status"],
    connectors: connectors.map((connector) => ({
      id: connector.id,
      deviceName: connector.deviceName,
      expiresAt: connector.expiresAt.toISOString(),
    })),
  };
}
