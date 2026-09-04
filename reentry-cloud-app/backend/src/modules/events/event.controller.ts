import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { acceptEvent, EventError } from "./event.service";
import type { EventEnvelope } from "./event.schemas";

function sendEventError(res: Response, error: EventError): void {
  res.status(error.statusCode).json({ error: { code: error.code } });
}

export const acceptEventController = asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await acceptEvent(req.body as EventEnvelope);
    res.set("Cache-Control", "no-store");
    return res.status(202).json(result);
  } catch (error) {
    if (error instanceof EventError) {
      sendEventError(res, error);
      return;
    }
    throw error;
  }
});
