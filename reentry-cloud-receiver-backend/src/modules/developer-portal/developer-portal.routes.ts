import { Router } from "express";
import { requireSameOriginJson } from "../../middleware/same-origin";
import { validateBody } from "../../middleware/validate";
import { requireSession } from "../authentication/session";
import {
  createApiKeyController,
  createOrganizationController,
  listApiKeysController,
  listEventHistoryController,
  listOrganizationsController,
  revokeApiKeyController,
} from "./developer-portal.controller";
import { createOrganizationSchema, emptyObjectSchema } from "./developer-portal.schemas";

export const developerPortalRouter = Router();

developerPortalRouter.use(requireSession("developer"));

developerPortalRouter.get("/organizations", listOrganizationsController);
developerPortalRouter.post(
  "/organizations",
  requireSameOriginJson,
  validateBody(createOrganizationSchema),
  createOrganizationController
);
developerPortalRouter.get(
  "/organizations/:organizationId/api-keys",
  listApiKeysController
);
developerPortalRouter.post(
  "/organizations/:organizationId/api-keys",
  requireSameOriginJson,
  validateBody(emptyObjectSchema),
  createApiKeyController
);
developerPortalRouter.post(
  "/organizations/:organizationId/api-keys/:apiKeyId/revoke",
  requireSameOriginJson,
  validateBody(emptyObjectSchema),
  revokeApiKeyController
);
developerPortalRouter.get(
  "/organizations/:organizationId/events",
  listEventHistoryController
);
