import type { NextFunction, Request, Response } from "express";
import { canonicalJson } from "../modules/consent/manifest";

export const PROTOCOL_REQUEST_MAX_BYTES = 16 * 1_024;
export const PROTOCOL_RESPONSE_MAX_BYTES = 32 * 1_024;

const protocolRoutes = new Set([
  "/v0.1/events",
  "/v0.1/connectors/disconnect",
  "/v0.1/delivery-claims",
  "/v0.1/delivery-acknowledgements",
]);

export function isV01Path(path: string): boolean {
  return path === "/v0.1" || path.startsWith("/v0.1/");
}

function sendTransportError(res: Response, statusCode: number, code: string): void {
  res.status(statusCode).json({ error: { code } });
}

function isJsonContentType(value: string | undefined): boolean {
  return /^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(value?.trim() ?? "");
}

export function protocolTransportGuard(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!isV01Path(req.path)) {
    next();
    return;
  }

  if (protocolRoutes.has(req.path) && req.method !== "POST") {
    res.set("Allow", "POST");
    sendTransportError(res, 405, "http_method_not_allowed");
    return;
  }

  if (req.method === "POST") {
    const contentEncoding = req.get("Content-Encoding");
    if (contentEncoding && contentEncoding.toLowerCase() !== "identity") {
      sendTransportError(res, 415, "http_content_type_invalid");
      return;
    }
    if (!isJsonContentType(req.get("Content-Type"))) {
      sendTransportError(res, 415, "http_content_type_invalid");
      return;
    }
  }

  next();
}

export function protocolResponsePolicy(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!isV01Path(req.path)) {
    next();
    return;
  }

  res.set({
    "Cache-Control": "no-store",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
  });

  const originalSend = res.send.bind(res);

  const sendOversizeError = (): Response => {
    const payload = canonicalJson({ error: { code: "receiver_internal_error" } });
    res.status(500);
    res.type("application/json");
    res.set("Content-Length", String(Buffer.byteLength(payload, "utf8")));
    return originalSend(payload);
  };

  res.json = ((body: unknown): Response => {
    const payload = canonicalJson(body);
    if (Buffer.byteLength(payload, "utf8") > PROTOCOL_RESPONSE_MAX_BYTES) {
      return sendOversizeError();
    }
    res.type("application/json");
    res.set("Content-Length", String(Buffer.byteLength(payload, "utf8")));
    return originalSend(payload);
  }) as Response["json"];

  res.send = ((body?: unknown): Response => {
    const contentType = res.get("Content-Type");
    if (typeof body === "string" && contentType?.toLowerCase().startsWith("application/json")) {
      if (Buffer.byteLength(body, "utf8") > PROTOCOL_RESPONSE_MAX_BYTES) {
        return sendOversizeError();
      }
      res.set("Content-Length", String(Buffer.byteLength(body, "utf8")));
    }
    return originalSend(body as any);
  }) as Response["send"];

  next();
}
