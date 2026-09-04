import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { v01Router, v1Router, rootRouter } from "./routes";
import { err } from "./lib/response-helpers";
import { appConfig } from "./config/config";
import {
  protocolResponsePolicy,
  protocolTransportGuard,
  PROTOCOL_REQUEST_MAX_BYTES,
  isV01Path,
} from "./middleware/protocol-transport";

export function createApp() {
  const app = express();

  // Security headers (HSTS, X-Frame-Options, no-sniff, etc). This is a JSON
  // API, so the default Content-Security-Policy — which is aimed at HTML — is
  // switched off rather than left to block nothing meaningful.
  app.use(helmet({ contentSecurityPolicy: false }));

  app.use(
    cors({
      origin: appConfig.frontendUrl,
      credentials: true,
    })
  );
  app.use(protocolResponsePolicy);
  app.use(protocolTransportGuard);
  app.use(express.json({ limit: PROTOCOL_REQUEST_MAX_BYTES, strict: true }));
  app.use(cookieParser());

  // Unversioned: "/" and health checks.
  app.use("/", rootRouter);

  // The current API.
  app.use("/v1", v1Router);

  // Replacement Cloud Receiver v2 protocol. Public Grant inspection and
  // revocation routes remain intentionally absent pending ADR-0013.
  app.use("/v0.1", v01Router);

  // Nothing matched above, so the route does not exist.
  app.use(function handleNotFound(_req: Request, res: Response) {
    res.status(404).json(err("NOT_FOUND", "Route not found"));
  });

  // Everything asyncHandler catches arrives here through next(error), as does
  // any synchronous throw from a route.
  //
  // The four-argument signature is load-bearing: Express identifies error
  // handlers by counting arguments (fn.length === 4). Removing the unused
  // _next would silently turn this into ordinary middleware that never runs.
  app.use(function handleError(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (isV01Path(req.path)) {
      const parserError = error as Error & {
        status?: number;
        statusCode?: number;
        type?: string;
      };
      if (parserError.type === "entity.too.large" || parserError.status === 413 || parserError.statusCode === 413) {
        return res.status(413).json({ error: { code: "http_body_too_large" } });
      }
      if (parserError.type === "entity.parse.failed" || parserError.status === 400 || parserError.statusCode === 400) {
        return res.status(400).json({ error: { code: "http_body_invalid" } });
      }
      const databaseErrorCode = (error as Error & { code?: unknown }).code;
      if (databaseErrorCode === "P2024" || databaseErrorCode === "P2034") {
        res.set("Retry-After", "1");
        return res.status(503).json({ error: { code: "receiver_busy" } });
      }
      if (res.headersSent) {
        return next(error);
      }
      console.error(JSON.stringify({
        event: "receiver_error",
        route: req.path,
        status: 500,
        code: "receiver_internal_error",
      }));
      return res.status(500).json({ error: { code: "receiver_internal_error" } });
    }
    console.error("[unhandled]", error);
    res.status(500).json(err("INTERNAL_ERROR", "Something went wrong"));
  });

  return app;
}
