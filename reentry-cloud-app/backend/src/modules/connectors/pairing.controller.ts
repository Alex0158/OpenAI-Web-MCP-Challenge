import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { requireSession } from "../authentication/session";
import {
  claimPairingSession,
  createPairingSession,
  disconnectConnector,
  listAccountConnectors,
  PairingError,
} from "./pairing.service";

function sendPairingError(res: Response, error: PairingError): void {
  res.status(error.statusCode).json({ error: { code: error.code } });
}

export const requireUserSession = requireSession("user");

export const createPairing = asyncHandler(async (req: Request, res: Response) => {
  try {
    const accountId = req.auth?.accountId;
    if (!accountId) {
      return res.status(401).json({ error: { code: "session_required" } });
    }
    const result = await createPairingSession(accountId);
    res.set("Cache-Control", "no-store");
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof PairingError) {
      sendPairingError(res, error);
      return;
    }
    throw error;
  }
});

export const listConnectors = asyncHandler(async (req: Request, res: Response) => {
  const accountId = req.auth?.accountId;
  if (!accountId) {
    return res.status(401).json({ error: { code: "session_required" } });
  }

  const result = await listAccountConnectors(accountId);
  res.set("Cache-Control", "no-store");
  return res.status(200).json(result);
});

export const claimPairing = asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await claimPairingSession(req.body);
    res.set("Cache-Control", "no-store");
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof PairingError) {
      sendPairingError(res, error);
      return;
    }
    throw error;
  }
});

export const disconnectConnectorController = asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await disconnectConnector(req.body);
    res.set("Cache-Control", "no-store");
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof PairingError) {
      sendPairingError(res, error);
      return;
    }
    throw error;
  }
});
