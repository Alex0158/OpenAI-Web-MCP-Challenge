import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { canonicalJson } from "../consent/manifest";
import {
  acknowledgeDelivery,
  claimDelivery,
  DeliveryError,
  type EffectAuthority,
} from "./delivery.service";

function sendDeliveryError(res: Response, error: DeliveryError): void {
  res.status(error.statusCode).json({ error: { code: error.code } });
}

export const claimDeliveryController = asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await claimDelivery(req.body.connector_token, req.body.claim_token);
    res.set("Cache-Control", "no-store");
    if (result === null) {
      res.set({
        "Cache-Control": "no-store",
        "Content-Length": "0",
        Pragma: "no-cache",
        "X-Content-Type-Options": "nosniff",
      });
      res.removeHeader("Content-Type");
      return res.status(204).end();
    }

    res.type("application/json");
    return res.status(200).send(canonicalJson(result));
  } catch (error) {
    if (error instanceof DeliveryError) {
      sendDeliveryError(res, error);
      return;
    }
    throw error;
  }
});

export const acknowledgeDeliveryController = asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await acknowledgeDelivery(
      req.body.connector_token,
      req.body.delivery_id,
      req.body.lease_token,
      req.body.effect_token,
      req.app.locals.effectAuthority as EffectAuthority | undefined
    );
    res.set("Cache-Control", "no-store");
    res.type("application/json");
    return res.status(200).send(canonicalJson(result));
  } catch (error) {
    if (error instanceof DeliveryError) {
      sendDeliveryError(res, error);
      return;
    }
    throw error;
  }
});
