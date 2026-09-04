import type { Request, Response } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { err, ok } from "../../lib/response-helpers";
import {
  createApiKey,
  createOrganization,
  DeveloperPortalError,
  listApiKeys,
  listEventHistory,
  listOrganizations,
  revokeApiKey,
} from "./developer-portal.service";
import type { CreateOrganization } from "./developer-portal.schemas";

function markPrivate(res: Response): void {
  res.set({
    "Cache-Control": "no-store",
    Pragma: "no-cache",
  });
}

function developerId(req: Request): string {
  return req.auth?.accountId ?? "";
}

function sendPortalError(res: Response, error: DeveloperPortalError): void {
  const message =
    error.code === "ORGANIZATION_NOT_FOUND"
      ? "Organization not found."
      : "API key not found.";
  markPrivate(res);
  res.status(error.statusCode).json(err(error.code, message));
}

export const listOrganizationsController = asyncHandler(async (req: Request, res: Response) => {
  try {
    markPrivate(res);
    return res.status(200).json(ok(await listOrganizations(developerId(req))));
  } catch (error) {
    if (error instanceof DeveloperPortalError) {
      sendPortalError(res, error);
      return;
    }
    throw error;
  }
});

export const createOrganizationController = asyncHandler(async (req: Request, res: Response) => {
  try {
    markPrivate(res);
    return res
      .status(201)
      .json(ok(await createOrganization(developerId(req), req.body as CreateOrganization)));
  } catch (error) {
    if (error instanceof DeveloperPortalError) {
      sendPortalError(res, error);
      return;
    }
    throw error;
  }
});

export const listApiKeysController = asyncHandler(async (req: Request, res: Response) => {
  try {
    markPrivate(res);
    return res
      .status(200)
      .json(ok(await listApiKeys(developerId(req), req.params.organizationId)));
  } catch (error) {
    if (error instanceof DeveloperPortalError) {
      sendPortalError(res, error);
      return;
    }
    throw error;
  }
});

export const createApiKeyController = asyncHandler(async (req: Request, res: Response) => {
  try {
    markPrivate(res);
    return res
      .status(201)
      .json(ok(await createApiKey(developerId(req), req.params.organizationId)));
  } catch (error) {
    if (error instanceof DeveloperPortalError) {
      sendPortalError(res, error);
      return;
    }
    throw error;
  }
});

export const revokeApiKeyController = asyncHandler(async (req: Request, res: Response) => {
  try {
    markPrivate(res);
    return res
      .status(200)
      .json(
        ok(
          await revokeApiKey(
            developerId(req),
            req.params.organizationId,
            req.params.apiKeyId
          )
        )
      );
  } catch (error) {
    if (error instanceof DeveloperPortalError) {
      sendPortalError(res, error);
      return;
    }
    throw error;
  }
});

export const listEventHistoryController = asyncHandler(async (req: Request, res: Response) => {
  try {
    markPrivate(res);
    return res
      .status(200)
      .json(ok(await listEventHistory(developerId(req), req.params.organizationId)));
  } catch (error) {
    if (error instanceof DeveloperPortalError) {
      sendPortalError(res, error);
      return;
    }
    throw error;
  }
});
