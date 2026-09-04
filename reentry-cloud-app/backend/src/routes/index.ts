import { Router, Request, Response } from "express";
import { appConfig } from "../config/config";
import { authRouter } from "../modules/authentication/auth.routes";
import { pairingRouter } from "../modules/connectors/pairing.routes";
import { consentApiRouter, consentPageRouter } from "../modules/consent/consent.routes";
import { eventRouter } from "../modules/events/event.routes";
import { developerPortalRouter } from "../modules/developer-portal/developer-portal.routes";
import {
  healthRouter,
  operationalHealthRouter,
} from "../modules/system-health/health.routes";

/**
 * Version 1 of the API. Everything a client calls lives under /v1.
 *
 * A version prefix means a future breaking change (renaming a field, changing
 * a status code) can ship as /v2 while /v1 keeps serving older clients.
 */
export const v1Router = Router();

v1Router.use("/auth", authRouter);

/**
 * Protocol v0.1 routes. Features 1–5 add pairing, Consent/Target, signed Event
 * ingress, target-scoped delivery claims, and effect-backed acknowledgement.
 * Public Grant routes remain absent until their separate decision gate.
 */
export const v01Router = Router();

v01Router.use(pairingRouter);
v01Router.use(consentApiRouter);
v01Router.use(eventRouter);
v01Router.use((_req: Request, res: Response) => {
  res.status(404).json({ error: { code: "http_route_not_found" } });
});

/**
 * Unversioned infrastructure routes.
 *
 * Health checks are deliberately NOT versioned: they are consumed by Docker,
 * load balancers, and uptime monitors, which should not have to be
 * reconfigured when the API version changes.
 */
export const rootRouter = Router();

function redirectToFrontendAuth(path: "/user-login" | "/user-register", req: Request, res: Response) {
  const destination = new URL(path, appConfig.frontendUrl);
  const next = typeof req.query.next === "string" ? req.query.next : undefined;
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    destination.searchParams.set("next", next);
  }
  return res.redirect(302, destination.toString());
}

rootRouter.get("/", (_req: Request, res: Response) => {
  res.send("Backend is running. Visit /health");
});

// The Connector knows the Receiver API origin, while account pages live on
// the separately deployed frontend. Keep these compatibility paths as a
// server-owned handoff instead of making the Connector guess a second origin.
rootRouter.get("/user-login", (req: Request, res: Response) =>
  redirectToFrontendAuth("/user-login", req, res),
);
rootRouter.get("/user-register", (req: Request, res: Response) =>
  redirectToFrontendAuth("/user-register", req, res),
);

rootRouter.use(operationalHealthRouter);
rootRouter.use("/health", healthRouter);
rootRouter.use(consentPageRouter);

// Developer control-plane routes use the separate DeveloperAccount session.
// They are not protocol routes and do not expose public Grant control.
rootRouter.use("/api", developerPortalRouter);
