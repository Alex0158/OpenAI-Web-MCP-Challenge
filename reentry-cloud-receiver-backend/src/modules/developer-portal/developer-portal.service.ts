import { randomBytes } from "node:crypto";
import type { Organization, OrganizationApiKey, Prisma } from "@prisma/client";
import { prisma } from "../../db";
import { digestSecret } from "../../middleware/organization-auth";
import type { CreateOrganization } from "./developer-portal.schemas";

const EVENT_HISTORY_LIMIT = 100;

export class DeveloperPortalError extends Error {
  constructor(
    public readonly code: "ORGANIZATION_NOT_FOUND" | "API_KEY_NOT_FOUND",
    public readonly statusCode: 404
  ) {
    super(code);
    this.name = "DeveloperPortalError";
  }
}

export type OrganizationSummary = {
  organization_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type ApiKeySummary = {
  api_key_id: string;
  key_prefix: string;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
};

export type ApiKeyReveal = ApiKeySummary & {
  api_key: string;
};

export type DeveloperEventSummary = {
  event_id: string;
  event_type: string;
  issuer_origin: string;
  workflow_id: string;
  received_at: string;
  delivery_state: string | null;
  delivery_attempt: number | null;
  acknowledged_at: string | null;
  terminal_reason: string | null;
};

function organizationSummary(organization: Pick<Organization, "id" | "name" | "createdAt" | "updatedAt">): OrganizationSummary {
  return {
    organization_id: organization.id,
    name: organization.name,
    created_at: organization.createdAt.toISOString(),
    updated_at: organization.updatedAt.toISOString(),
  };
}

function apiKeySummary(apiKey: Pick<OrganizationApiKey, "id" | "keyPrefix" | "createdAt" | "expiresAt" | "revokedAt">): ApiKeySummary {
  return {
    api_key_id: apiKey.id,
    key_prefix: apiKey.keyPrefix,
    created_at: apiKey.createdAt.toISOString(),
    expires_at: apiKey.expiresAt?.toISOString() ?? null,
    revoked_at: apiKey.revokedAt?.toISOString() ?? null,
  };
}

function revealedApiKey(apiKey: OrganizationApiKey, rawKey: string): ApiKeyReveal {
  return {
    ...apiKeySummary(apiKey),
    api_key: rawKey,
  };
}

function newApiKey(): { rawKey: string; keyDigest: string; keyPrefix: string } {
  const rawKey = randomBytes(32).toString("base64url");
  return {
    rawKey,
    keyDigest: digestSecret(rawKey),
    keyPrefix: rawKey.slice(0, 8),
  };
}

async function requireOwnedOrganization(
  developerId: string,
  organizationId: string,
  transaction: Prisma.TransactionClient | typeof prisma = prisma
): Promise<Organization> {
  const organization = await transaction.organization.findFirst({
    where: { id: organizationId, developerId },
  });
  if (!organization) throw new DeveloperPortalError("ORGANIZATION_NOT_FOUND", 404);
  return organization;
}

export async function listOrganizations(developerId: string): Promise<{ organizations: OrganizationSummary[] }> {
  const organizations = await prisma.organization.findMany({
    where: { developerId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  return { organizations: organizations.map(organizationSummary) };
}

export async function createOrganization(
  developerId: string,
  input: CreateOrganization
): Promise<{ organization: OrganizationSummary; api_key: ApiKeyReveal }> {
  const generated = newApiKey();
  const result = await prisma.$transaction(async (transaction) => {
    const organization = await transaction.organization.create({
      data: { developerId, name: input.name },
    });
    const apiKey = await transaction.organizationApiKey.create({
      data: {
        organizationId: organization.id,
        keyDigest: generated.keyDigest,
        keyPrefix: generated.keyPrefix,
      },
    });
    return { organization, apiKey };
  });

  return {
    organization: organizationSummary(result.organization),
    api_key: revealedApiKey(result.apiKey, generated.rawKey),
  };
}

export async function listApiKeys(
  developerId: string,
  organizationId: string
): Promise<{ api_keys: ApiKeySummary[] }> {
  await requireOwnedOrganization(developerId, organizationId);
  const apiKeys = await prisma.organizationApiKey.findMany({
    where: { organizationId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return { api_keys: apiKeys.map(apiKeySummary) };
}

export async function createApiKey(
  developerId: string,
  organizationId: string
): Promise<{ api_key: ApiKeyReveal }> {
  const generated = newApiKey();
  const apiKey = await prisma.$transaction(async (transaction) => {
    await requireOwnedOrganization(developerId, organizationId, transaction);
    return transaction.organizationApiKey.create({
      data: {
        organizationId,
        keyDigest: generated.keyDigest,
        keyPrefix: generated.keyPrefix,
      },
    });
  });
  return { api_key: revealedApiKey(apiKey, generated.rawKey) };
}

export async function revokeApiKey(
  developerId: string,
  organizationId: string,
  apiKeyId: string
): Promise<{ api_key: ApiKeySummary; duplicate: boolean }> {
  return prisma.$transaction(async (transaction) => {
    await requireOwnedOrganization(developerId, organizationId, transaction);
    const apiKey = await transaction.organizationApiKey.findFirst({
      where: { id: apiKeyId, organizationId },
    });
    if (!apiKey) throw new DeveloperPortalError("API_KEY_NOT_FOUND", 404);

    if (apiKey.revokedAt !== null) {
      return { api_key: apiKeySummary(apiKey), duplicate: true };
    }

    const revokedAt = new Date();
    const updated = await transaction.organizationApiKey.updateMany({
      where: { id: apiKey.id, organizationId, revokedAt: null },
      data: { revokedAt },
    });
    if (updated.count === 1) {
      return {
        api_key: apiKeySummary({ ...apiKey, revokedAt }),
        duplicate: false,
      };
    }

    const current = await transaction.organizationApiKey.findFirst({
      where: { id: apiKey.id, organizationId },
    });
    if (!current) throw new DeveloperPortalError("API_KEY_NOT_FOUND", 404);
    return { api_key: apiKeySummary(current), duplicate: true };
  });
}

const eventHistorySelect = {
  eventId: true,
  eventType: true,
  issuerOrigin: true,
  workflowId: true,
  receivedAt: true,
  delivery: {
    select: {
      status: true,
      currentAttempt: true,
      acknowledgedAt: true,
      terminalReason: true,
    },
  },
} as const;

type EventHistoryRecord = Prisma.EventGetPayload<{ select: typeof eventHistorySelect }>;

export async function listEventHistory(
  developerId: string,
  organizationId: string
): Promise<{ events: DeveloperEventSummary[] }> {
  await requireOwnedOrganization(developerId, organizationId);
  const events = await prisma.event.findMany({
    where: { grant: { is: { organizationId } } },
    orderBy: [{ receivedAt: "desc" }, { eventId: "desc" }],
    take: EVENT_HISTORY_LIMIT,
    select: eventHistorySelect,
  });

  return {
    events: events.map((event: EventHistoryRecord) => ({
      event_id: event.eventId,
      event_type: event.eventType,
      issuer_origin: event.issuerOrigin,
      workflow_id: event.workflowId,
      received_at: event.receivedAt.toISOString(),
      delivery_state: event.delivery?.status ?? null,
      delivery_attempt: event.delivery?.currentAttempt ?? null,
      acknowledged_at: event.delivery?.acknowledgedAt?.toISOString() ?? null,
      terminal_reason: event.delivery?.terminalReason ?? null,
    })),
  };
}
