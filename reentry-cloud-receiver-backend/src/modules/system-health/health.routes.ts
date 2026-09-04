import { Router, Request, Response } from "express";
import { prisma } from "../../db";
import { asyncHandler } from "../../lib/async-handler";
import { ok, err } from "../../lib/response-helpers";

export const healthRouter = Router();

/**
 * Readiness: can this instance actually serve requests?
 *
 * It must touch the database. A health check that only proves the process is
 * running will report "healthy" while every real request fails, and the load
 * balancer will keep sending traffic to a box that cannot answer.
 */
healthRouter.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      console.error(JSON.stringify({
        event: "health_check_failed",
        route: "/health",
        status: 503,
        code: "DB_UNAVAILABLE",
      }));
      return res.status(503).json(err("DB_UNAVAILABLE", "Database unreachable"));
    }

    return res.json(
      ok({ isOk: "ok", db: "up", uptime: process.uptime() }, "Health check successful")
    );
  })
);

/**
 * Liveness: is the process alive at all?
 *
 * Deliberately touches nothing. An orchestrator uses this to decide whether to
 * RESTART the container — restarting will not fix a database outage, so this
 * must keep returning 200 even when /health is failing.
 */
healthRouter.get("/live", (_req: Request, res: Response) => {
  res.json(ok({ isOk: "ok", uptime: process.uptime() }, "Alive"));
});

export const operationalHealthRouter = Router();

operationalHealthRouter.get("/healthz", (_req: Request, res: Response) => {
  res.set({
    "Cache-Control": "no-store",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
  });
  return res.status(200).json({ status: "ok" });
});

operationalHealthRouter.get(
  "/readyz",
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      console.error(JSON.stringify({
        event: "receiver_readiness_failed",
        route: "/readyz",
        status: 503,
        code: "receiver_not_ready",
      }));
      res.set({
        "Cache-Control": "no-store",
        Pragma: "no-cache",
        "X-Content-Type-Options": "nosniff",
      });
      return res.status(503).json({ error: { code: "receiver_not_ready" } });
    }

    res.set({
      "Cache-Control": "no-store",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    return res.status(200).json({ status: "ready" });
  })
);
