import { isDomainError, type DomainError } from "../domain/errors";
import type { Actor } from "../domain/types";
import { WorkflowPersistenceError } from "../persistence/workflow-store";
import {
  resolveDemoSession,
} from "./demo-session";
import {
  createWorkflowApplication,
  type WorkflowApplication,
} from "./workflow";
import {
  toAgentListingInterestView,
  toTenantFavouriteMutationView,
  toTenantFavouritesView,
} from "./favourite-views";
import type {
  RemoveFavouriteBody,
  SaveFavouriteBody,
} from "../../shared/contracts/favourites-api";

const JSON_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};
const JSON_CONTENT_TYPE = "application/json";
const MAX_BODY_LENGTH = 8_000;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9._:-]+$/;
const MAX_IDENTIFIER_LENGTH = 100;

type FavouriteApplicationPort = Pick<
  WorkflowApplication,
  | "applyFavouriteCommand"
  | "readTenantFavourites"
  | "readAgentListingInterest"
  | "close"
>;

export type FavouriteHttpDependencies = {
  createApplication?: () => FavouriteApplicationPort;
  now?: () => string;
};

class HttpInputError extends Error {}

export function handleReadTenantFavourites(
  request: Request,
  dependencies: FavouriteHttpDependencies = {},
): Response {
  const actor = requireRoleSession(request, "tenant");
  if (actor instanceof Response) return actor;

  return runFavourite(dependencies, (application, now) => {
    return toTenantFavouritesView(application.readTenantFavourites(actor, now));
  });
}

export async function handleSaveFavourite(
  request: Request,
  dependencies: FavouriteHttpDependencies = {},
): Promise<Response> {
  const actor = requireRoleSession(request, "tenant");
  if (actor instanceof Response) return actor;

  let body: SaveFavouriteBody;
  try {
    body = await readSaveFavouriteBody(request);
  } catch (error) {
    return inputErrorResponse(error);
  }

  return runFavourite(dependencies, (application, now) => {
    const outcome = application.applyFavouriteCommand({
      type: "SAVE_FAVOURITE",
      commandId: body.commandId,
      actor,
      fixtureGeneration: body.fixtureGeneration,
      listingId: body.listingId,
      expectedListingVersion: body.expectedListingVersion,
      expectedFavouriteVersion: body.expectedFavouriteVersion,
    }, now);
    if (!outcome.ok) throw outcome.error;

    return toTenantFavouriteMutationView(
      application.readTenantFavourites(actor, now),
      outcome.result,
    );
  });
}

export async function handleRemoveFavourite(
  request: Request,
  listingId: string,
  dependencies: FavouriteHttpDependencies = {},
): Promise<Response> {
  const actor = requireRoleSession(request, "tenant");
  if (actor instanceof Response) return actor;

  try {
    validateIdentifier(listingId, "Listing identifier");
  } catch (error) {
    return inputErrorResponse(error);
  }

  let body: RemoveFavouriteBody;
  try {
    body = await readRemoveFavouriteBody(request);
  } catch (error) {
    return inputErrorResponse(error);
  }

  return runFavourite(dependencies, (application, now) => {
    const outcome = application.applyFavouriteCommand({
      type: "REMOVE_FAVOURITE",
      commandId: body.commandId,
      actor,
      fixtureGeneration: body.fixtureGeneration,
      listingId,
      expectedFavouriteVersion: body.expectedFavouriteVersion,
    }, now);
    if (!outcome.ok) throw outcome.error;

    return toTenantFavouriteMutationView(
      application.readTenantFavourites(actor, now),
      outcome.result,
    );
  });
}

export function handleReadAgentListingInterest(
  request: Request,
  dependencies: FavouriteHttpDependencies = {},
): Response {
  const actor = requireRoleSession(request, "agent");
  if (actor instanceof Response) return actor;

  return runFavourite(dependencies, (application, now) => {
    return toAgentListingInterestView(application.readAgentListingInterest(actor, now));
  });
}

function runFavourite(
  dependencies: FavouriteHttpDependencies,
  operation: (application: FavouriteApplicationPort, now: string) => object,
): Response {
  try {
    const application = dependencies.createApplication
      ? dependencies.createApplication()
      : createWorkflowApplication();
    try {
      const now = dependencies.now?.() ?? new Date().toISOString();
      return jsonResponse(200, operation(application, now));
    } finally {
      application.close();
    }
  } catch (error) {
    if (error instanceof WorkflowPersistenceError) {
      return errorResponse(503, "PERSISTENCE_ERROR", "Favourite service is unavailable");
    }
    if (isDomainError(error)) {
      return domainErrorResponse(error);
    }
    throw error;
  }
}

function requireRoleSession(request: Request, role: "tenant" | "agent"): Actor | Response {
  const actor = resolveDemoSession(request.headers.get("cookie"));
  if (!actor) {
    return errorResponse(401, "UNAUTHENTICATED", "Demo session is required");
  }
  if (actor.role !== role) {
    return errorResponse(403, "FORBIDDEN", `${role === "tenant" ? "Tenant" : "Agent"} access is required`);
  }
  return actor;
}

async function readSaveFavouriteBody(request: Request): Promise<SaveFavouriteBody> {
  const body = await readJsonObject(request, [
    "commandId",
    "fixtureGeneration",
    "listingId",
    "expectedListingVersion",
    "expectedFavouriteVersion",
  ]);
  assertString(body.commandId, "Command identifier");
  validateIdentifier(body.commandId, "Command identifier");
  assertString(body.listingId, "Listing identifier");
  validateIdentifier(body.listingId, "Listing identifier");
  assertPositiveInteger(body.fixtureGeneration, "Fixture generation");
  assertPositiveInteger(body.expectedListingVersion, "Expected listing version");
  assertNonNegativeInteger(body.expectedFavouriteVersion, "Expected Favourite version");
  return {
    commandId: body.commandId,
    fixtureGeneration: body.fixtureGeneration,
    listingId: body.listingId,
    expectedListingVersion: body.expectedListingVersion,
    expectedFavouriteVersion: body.expectedFavouriteVersion,
  };
}

async function readRemoveFavouriteBody(request: Request): Promise<RemoveFavouriteBody> {
  const body = await readJsonObject(request, [
    "commandId",
    "fixtureGeneration",
    "expectedFavouriteVersion",
  ]);
  assertString(body.commandId, "Command identifier");
  validateIdentifier(body.commandId, "Command identifier");
  assertPositiveInteger(body.fixtureGeneration, "Fixture generation");
  assertNonNegativeInteger(body.expectedFavouriteVersion, "Expected Favourite version");
  return {
    commandId: body.commandId,
    fixtureGeneration: body.fixtureGeneration,
    expectedFavouriteVersion: body.expectedFavouriteVersion,
  };
}

async function readJsonObject(
  request: Request,
  expectedKeys: readonly string[],
): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim();
  if (contentType !== JSON_CONTENT_TYPE) throw new HttpInputError();

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    throw new HttpInputError();
  }
  if (rawBody.length < 1 || rawBody.length > MAX_BODY_LENGTH) throw new HttpInputError();

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new HttpInputError();
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new HttpInputError();
  }
  const body = parsed as Record<string, unknown>;
  const keys = Object.keys(body).sort();
  if (keys.length !== expectedKeys.length
    || keys.some((key, index) => key !== [...expectedKeys].sort()[index])) {
    throw new HttpInputError();
  }
  return body;
}

function assertString(value: unknown, _label: string): asserts value is string {
  if (typeof value !== "string") throw new HttpInputError();
}

function assertPositiveInteger(value: unknown, _label: string): asserts value is number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    throw new HttpInputError();
  }
}

function assertNonNegativeInteger(value: unknown, _label: string): asserts value is number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new HttpInputError();
  }
}

function validateIdentifier(value: string, _label: string): void {
  if (value.length < 1 || value.length > MAX_IDENTIFIER_LENGTH || !IDENTIFIER_PATTERN.test(value)) {
    throw new HttpInputError();
  }
}

function inputErrorResponse(error: unknown): Response {
  if (error instanceof HttpInputError) {
    return errorResponse(400, "VALIDATION_FAILED", "Favourite request body is invalid");
  }
  throw error;
}

function domainErrorResponse(error: DomainError): Response {
  switch (error.code) {
    case "FORBIDDEN":
      return errorResponse(403, "FORBIDDEN", "Favourite access is forbidden");
    case "NOT_FOUND":
      return errorResponse(404, "NOT_FOUND", "Favourite or listing was not found");
    case "VALIDATION_FAILED":
      return errorResponse(400, "VALIDATION_FAILED", "Favourite input is invalid");
    case "STALE_VERSION":
      return errorResponse(409, "STALE_VERSION", "Favourite version is stale");
    case "FIXTURE_GENERATION_CONFLICT":
      return errorResponse(409, "FIXTURE_GENERATION_CONFLICT", "Fixture generation is stale");
    case "COMMAND_CONFLICT":
      return errorResponse(409, "COMMAND_CONFLICT", "Command identifier conflicts with a prior operation");
    default:
      return errorResponse(409, error.code, "Favourite operation cannot be completed");
  }
}

function errorResponse(status: number, code: string, message: string): Response {
  return jsonResponse(status, { error: { code, message } });
}

function jsonResponse(status: number, payload: object): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });
}
