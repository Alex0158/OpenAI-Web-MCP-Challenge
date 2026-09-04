import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db";

export class OrganizationAuthError extends Error {
  constructor(
    public readonly code: string = "organization_auth_invalid",
    public readonly statusCode: number = 403
  ) {
    super(code);
    this.name = "OrganizationAuthError";
  }
}

export function digestSecret(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function bearerValue(header: string | undefined): string | null {
  if (typeof header !== "string") return null;
  const match = /^Bearer ([^\s]+)$/.exec(header);
  return match?.[1] ?? null;
}

export function requireOrganizationApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const rawKey = bearerValue(req.get("authorization"));
  if (!rawKey) {
    res.status(403).json({ error: { code: "organization_auth_invalid" } });
    return;
  }

  void prisma.organizationApiKey
    .findUnique({
      where: { keyDigest: digestSecret(rawKey) },
      select: { organizationId: true, expiresAt: true, revokedAt: true },
    })
    .then((key) => {
      const now = new Date();
      if (!key || key.revokedAt !== null || (key.expiresAt !== null && key.expiresAt <= now)) {
        res.status(403).json({ error: { code: "organization_auth_invalid" } });
        return;
      }

      req.organizationAuth = { organizationId: key.organizationId };
      next();
    })
    .catch(next);
}
