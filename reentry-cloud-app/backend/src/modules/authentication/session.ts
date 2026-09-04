import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { appConfig } from "../../config/config";
import { err } from "../../lib/response-helpers";

export type AccountKind = "user" | "developer";

const cookieNames: Record<AccountKind, string> = {
  user: "user_session",
  developer: "developer_session",
};

type SessionPayload = JwtPayload & {
  sub: string;
  kind: AccountKind;
};

function cookieOptions() {
  return {
    httpOnly: true,
    secure: appConfig.isProduction,
    // The hosted frontend and backend use different origins. Production
    // therefore needs cross-site credential delivery; localhost stays Lax.
    sameSite: appConfig.isProduction ? ("none" as const) : ("lax" as const),
    maxAge: appConfig.sessionTtlMs,
    ...(appConfig.cookieDomain ? { domain: appConfig.cookieDomain } : {}),
  };
}

export function setSessionCookie(res: Response, kind: AccountKind, accountId: string): void {
  const token = jwt.sign({ kind }, appConfig.jwtSecret, {
    subject: accountId,
    expiresIn: appConfig.jwtExpiresIn,
  });

  res.cookie(cookieNames[kind], token, cookieOptions());
}

export function clearSessionCookie(res: Response, kind: AccountKind): void {
  res.clearCookie(cookieNames[kind], {
    httpOnly: true,
    secure: appConfig.isProduction,
    sameSite: appConfig.isProduction ? "none" : "lax",
    ...(appConfig.cookieDomain ? { domain: appConfig.cookieDomain } : {}),
  });
}

function readSession(req: Request, kind: AccountKind): string | null {
  const token = req.cookies?.[cookieNames[kind]];
  if (typeof token !== "string" || token.length === 0) {
    return null;
  }

  try {
    const payload = jwt.verify(token, appConfig.jwtSecret) as SessionPayload;
    if (payload.kind !== kind || typeof payload.sub !== "string" || payload.sub.length === 0) {
      return null;
    }
    return payload.sub;
  } catch {
    return null;
  }
}

export function getSessionAccountId(req: Request, kind: AccountKind): string | null {
  return readSession(req, kind);
}

export function requireSession(kind: AccountKind) {
  return (req: Request, res: Response, next: NextFunction) => {
    const accountId = readSession(req, kind);
    if (!accountId) {
      return res.status(401).json(err("UNAUTHORIZED", "Sign in required"));
    }

    req.auth = { kind, accountId };
    return next();
  };
}
