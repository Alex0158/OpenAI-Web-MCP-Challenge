import { Router } from "express";
import { requireOrganizationApiKey } from "../../middleware/organization-auth";
import { validateProtocolBody } from "../../middleware/protocol-validate";
import { requireReceiverOriginJson } from "../../middleware/same-origin";
import { requireSession } from "../authentication/session";
import {
  accountConsentDecisionController,
  consentPageController,
  createConsentSessionController,
  getConsentStatusController,
  registerHostKeyController,
} from "./consent.controller";
import {
  accountConsentDecisionSchema,
  createConsentSessionSchema,
  registerHostKeySchema,
} from "./consent.schemas";

export const consentApiRouter = Router();

consentApiRouter.post(
  "/host-keys",
  requireOrganizationApiKey,
  validateProtocolBody(registerHostKeySchema),
  registerHostKeyController
);

consentApiRouter.post(
  "/consent-sessions",
  requireOrganizationApiKey,
  validateProtocolBody(createConsentSessionSchema),
  createConsentSessionController
);

consentApiRouter.get(
  "/consent-sessions/:consentSessionId",
  requireOrganizationApiKey,
  getConsentStatusController
);

consentApiRouter.post(
  "/account-consent-decisions",
  requireSession("user"),
  requireReceiverOriginJson,
  validateProtocolBody(accountConsentDecisionSchema),
  accountConsentDecisionController
);

export const consentPageRouter = Router();
consentPageRouter.get("/consent", consentPageController);
