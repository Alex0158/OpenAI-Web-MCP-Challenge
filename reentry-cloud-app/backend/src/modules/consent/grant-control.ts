import { timingSafeEqual } from "node:crypto";
import { appConfig } from "../../config/config";
import { prisma } from "../../db";

export type EffectiveGrantStatus = "active" | "expired" | "exhausted" | "revoked";

export class GrantControlError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number
  ) {
    super(code);
    this.name = "GrantControlError";
  }
}

type GrantState = {
  expiresAt: Date;
  runsRemaining: number;
  revokedAt: Date | null;
};

export function deriveEffectiveGrantStatus(
  grant: GrantState,
  now: Date = new Date()
): EffectiveGrantStatus {
  if (grant.revokedAt !== null) return "revoked";
  if (grant.expiresAt <= now) return "expired";
  if (grant.runsRemaining <= 0) return "exhausted";
  return "active";
}

function configuredAuthorityAllows(controlToken: string): void {
  const configuredToken = appConfig.grantControlToken;
  if (!configuredToken || typeof controlToken !== "string") {
    throw new GrantControlError("grant_control_unauthorized", 403);
  }

  const provided = Buffer.from(controlToken, "utf8");
  const expected = Buffer.from(configuredToken, "utf8");
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new GrantControlError("grant_control_unauthorized", 403);
  }
}

export type RevokeGrantInput = {
  grantId: string;
  controlToken: string;
};

export type RevokeGrantResult = {
  grantId: string;
  revokedAt: string;
  duplicate: boolean;
};

/**
 * Private Feature 2 seam. There is deliberately no HTTP route for this
 * operation until the separate ADR-0013 public-authority decision is accepted.
 */
export async function revokeGrantInternally(
  input: RevokeGrantInput
): Promise<RevokeGrantResult> {
  configuredAuthorityAllows(input.controlToken);

  return prisma.$transaction(async (transaction) => {
    const grant = await transaction.grant.findUnique({
      where: { id: input.grantId },
      select: { id: true, revokedAt: true },
    });
    if (!grant) throw new GrantControlError("grant_not_found", 404);
    if (grant.revokedAt !== null) {
      return { grantId: grant.id, revokedAt: grant.revokedAt.toISOString(), duplicate: true };
    }

    const revokedAt = new Date();
    const updated = await transaction.grant.updateMany({
      where: { id: input.grantId, revokedAt: null },
      data: { revokedAt },
    });
    if (updated.count === 1) {
      return { grantId: grant.id, revokedAt: revokedAt.toISOString(), duplicate: false };
    }

    const current = await transaction.grant.findUnique({
      where: { id: input.grantId },
      select: { revokedAt: true },
    });
    if (!current?.revokedAt) throw new GrantControlError("grant_not_found", 404);
    return { grantId: input.grantId, revokedAt: current.revokedAt.toISOString(), duplicate: true };
  });
}

/**
 * Private admission check used by the Feature 2 revocation test. Event
 * ingress is not implemented; this function is only the durable Grant fence.
 */
export async function assertGrantAllowsNewWork(grantId: string): Promise<void> {
  const grant = await prisma.grant.findUnique({
    where: { id: grantId },
    select: { expiresAt: true, runsRemaining: true, revokedAt: true },
  });
  if (!grant) throw new GrantControlError("grant_not_found", 404);

  const status = deriveEffectiveGrantStatus(grant);
  if (status === "active") return;
  if (status === "revoked") throw new GrantControlError("grant_revoked", 422);
  if (status === "expired") throw new GrantControlError("grant_expired", 410);
  throw new GrantControlError("grant_exhausted", 409);
}
