import type { Request, Response } from "express";
import { appConfig } from "../../config/config";
import { asyncHandler } from "../../lib/async-handler";
import { getSessionAccountId, requireSession } from "../authentication/session";
import { renderConsentPage } from "./consent-page";
import { ConsentError, createConsentSession, decideConsent, getConsentPrompt, getConsentStatus, registerHostKey, validateConsentPageToken } from "./consent.service";
import type { AccountConsentDecision, CreateConsentSession, RegisterHostKey } from "./consent.schemas";

function sendConsentError(res: Response, error: ConsentError): void {
  res.status(error.statusCode).json({ error: { code: error.code } });
}

export const registerHostKeyController = asyncHandler(async (req: Request, res: Response) => {
  try {
    const organizationId = req.organizationAuth?.organizationId;
    if (!organizationId) {
      return res.status(403).json({ error: { code: "organization_auth_invalid" } });
    }
    const result = await registerHostKey(organizationId, req.body as RegisterHostKey);
    res.set("Cache-Control", "no-store");
    return res.status(result.duplicate ? 200 : 201).json(result);
  } catch (error) {
    if (error instanceof ConsentError) {
      sendConsentError(res, error);
      return;
    }
    throw error;
  }
});

export const createConsentSessionController = asyncHandler(async (req: Request, res: Response) => {
  try {
    const organizationId = req.organizationAuth?.organizationId;
    if (!organizationId) {
      return res.status(403).json({ error: { code: "organization_auth_invalid" } });
    }
    const result = await createConsentSession(organizationId, req.body as CreateConsentSession);
    res.set("Cache-Control", "no-store");
    return res.status(result.duplicate ? 200 : 201).json(result);
  } catch (error) {
    if (error instanceof ConsentError) {
      sendConsentError(res, error);
      return;
    }
    throw error;
  }
});

export const getConsentStatusController = asyncHandler(async (req: Request, res: Response) => {
  try {
    const organizationId = req.organizationAuth?.organizationId;
    if (!organizationId) {
      return res.status(403).json({ error: { code: "organization_auth_invalid" } });
    }
    const result = await getConsentStatus(organizationId, req.params.consentSessionId);
    res.set("Cache-Control", "no-store");
    return res.json(result);
  } catch (error) {
    if (error instanceof ConsentError) {
      sendConsentError(res, error);
      return;
    }
    throw error;
  }
});

export const accountConsentDecisionController = asyncHandler(async (req: Request, res: Response) => {
  try {
    const accountId = req.auth?.accountId;
    if (!accountId) {
      return res.status(401).json({ error: { code: "session_required" } });
    }
    const result = await decideConsent(accountId, req.body as AccountConsentDecision);
    res.set("Cache-Control", "no-store");
    return res.json(result);
  } catch (error) {
    if (error instanceof ConsentError) {
      sendConsentError(res, error);
      return;
    }
    throw error;
  }
});

export const consentPageController = asyncHandler(async (req: Request, res: Response) => {
  res.set("Cross-Origin-Opener-Policy", "unsafe-none");
  const token = typeof req.query.token === "string" ? req.query.token : "";
  try {
    await validateConsentPageToken(token);
  } catch (error) {
    if (error instanceof ConsentError) {
      sendConsentError(res, error);
      return;
    }
    throw error;
  }

  const accountId = getSessionAccountId(req, "user");
  if (!accountId) {
    const returnTo = `/consent?token=${encodeURIComponent(token)}`;
    const loginUrl = new URL("/user-login", appConfig.frontendUrl);
    loginUrl.searchParams.set("return_to", returnTo);
    return res.redirect(302, loginUrl.toString());
  }

  try {
    const prompt = await getConsentPrompt(token, accountId);
    res.set("Cache-Control", "no-store");
    return res
      .status(200)
      .type("html")
      .send(renderConsentPage(prompt, { frontendUrl: appConfig.frontendUrl }));
  } catch (error) {
    if (error instanceof ConsentError) {
      sendConsentError(res, error);
      return;
    }
    throw error;
  }
});

export const requireUserConsentSession = requireSession("user");
