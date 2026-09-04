import { Request, Response, NextFunction } from "express";
import { appConfig } from "../config/config";

function configuredOrigin(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
}

function requireConfiguredOriginJson(
  req: Request,
  res: Response,
  next: NextFunction,
  configuredUrl: string
): void {
  if (req.get("origin") !== configuredOrigin(configuredUrl)) {
    res.status(403).json({ error: { code: "csrf_origin_invalid" } });
    return;
  }
  if (!req.is("application/json")) {
    res.status(415).json({ error: { code: "http_content_type_invalid" } });
    return;
  }
  next();
}

export function requireSameOriginJson(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  requireConfiguredOriginJson(req, res, next, appConfig.frontendUrl);
}

export function requireReceiverOriginJson(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  requireConfiguredOriginJson(req, res, next, appConfig.receiverPublicUrl);
}
