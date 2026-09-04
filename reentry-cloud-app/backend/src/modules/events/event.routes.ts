import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { eventEnvelopeSchema } from "./event.schemas";
import { acceptEventController } from "./event.controller";

function validateEventEnvelope(req: Request, res: Response, next: NextFunction): void {
  if (!req.is("application/json")) {
    res.status(415).json({ error: { code: "http_content_type_invalid" } });
    return;
  }

  const result = eventEnvelopeSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: { code: "http_body_invalid" } });
    return;
  }

  req.body = result.data;
  next();
}

export const eventRouter = Router();

eventRouter.post("/events", validateEventEnvelope, acceptEventController);
