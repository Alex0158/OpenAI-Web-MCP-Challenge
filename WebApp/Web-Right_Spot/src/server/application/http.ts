import { isDomainError, type DomainError } from "../domain/errors";
import type { Actor, ActorRole } from "../domain/types";
import { WorkflowPersistenceError } from "../persistence/workflow-store";
import {
  issueDemoSession,
  resolveDemoSession,
  serializeClearedDemoSessionCookie,
  serializeDemoSessionCookie,
} from "./demo-session";
import type {
  ListingCollection,
  ListingDetail,
  ListingFilters,
} from "./listings";
import {
  createWorkflowApplication,
  type WorkflowApplication,
} from "./workflow";

type ListingApplicationPort = Pick<
  WorkflowApplication,
  "readTenantListings" | "readTenantListing" | "close"
>;

export type ListingHttpDependencies = {
  createApplication?: () => ListingApplicationPort;
};

type ErrorPayload = {
  error: {
    code: string;
    message: string;
  };
};

const JSON_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};
const FILTER_NAMES = new Set(["area", "maxRent", "minSizeSqM", "availableFrom"]);
const MAX_SESSION_BODY_LENGTH = 100;

class HttpInputError extends Error {}

export async function handleCreateDemoSession(request: Request): Promise<Response> {
  let role: ActorRole;
  try {
    role = await readRoleBody(request);
  } catch (error) {
    if (error instanceof HttpInputError) {
      return errorResponse(400, "VALIDATION_FAILED", "Session body is invalid");
    }
    throw error;
  }

  const session = issueDemoSession(role);
  return jsonResponse(200, { actor: session.actor }, {
    "Set-Cookie": serializeDemoSessionCookie(session.cookieValue),
  });
}

export function handleReadDemoSession(request: Request): Response {
  const actor = resolveDemoSession(request.headers.get("cookie"));
  if (!actor) {
    return errorResponse(401, "UNAUTHENTICATED", "Demo session is required");
  }
  return jsonResponse(200, { actor });
}

export function handleDeleteDemoSession(): Response {
  return jsonResponse(200, { ok: true }, {
    "Set-Cookie": serializeClearedDemoSessionCookie(),
  });
}

export function handleListingCollection(
  request: Request,
  dependencies: ListingHttpDependencies = {},
): Response {
  const actor = requireTenantSession(request);
  if (actor instanceof Response) {
    return actor;
  }

  let filters: ListingFilters;
  try {
    filters = parseListingFilters(new URL(request.url).searchParams);
  } catch (error) {
    if (error instanceof HttpInputError) {
      return errorResponse(400, "VALIDATION_FAILED", "Listing filters are invalid");
    }
    throw error;
  }

  return runListingRead(
    dependencies,
    (application) => application.readTenantListings(actor, filters),
    (result) => ({ fixtureGeneration: result.fixtureGeneration, listings: result.listings }),
  );
}

export function handleListingDetail(
  request: Request,
  listingId: string,
  dependencies: ListingHttpDependencies = {},
): Response {
  const actor = requireTenantSession(request);
  if (actor instanceof Response) {
    return actor;
  }

  return runListingRead(
    dependencies,
    (application) => application.readTenantListing(actor, listingId),
    (result) => ({ fixtureGeneration: result.fixtureGeneration, listing: result.listing }),
  );
}

function runListingRead<T extends ListingCollection | ListingDetail>(
  dependencies: ListingHttpDependencies,
  read: (application: ListingApplicationPort) => T,
  payload: (result: T) => object,
): Response {
  try {
    const createApplication = dependencies.createApplication
      ?? (() => createWorkflowApplication());
    const application = createApplication();
    try {
      return jsonResponse(200, payload(read(application)));
    } finally {
      application.close();
    }
  } catch (error) {
    if (error instanceof WorkflowPersistenceError) {
      return errorResponse(503, "PERSISTENCE_ERROR", "Listing service is unavailable");
    }
    if (isDomainError(error)) {
      return domainErrorResponse(error);
    }
    throw error;
  }
}

function requireTenantSession(request: Request): Actor | Response {
  const actor = resolveDemoSession(request.headers.get("cookie"));
  if (!actor) {
    return errorResponse(401, "UNAUTHENTICATED", "Demo session is required");
  }
  if (actor.role !== "tenant") {
    return errorResponse(403, "FORBIDDEN", "Tenant access is required");
  }
  return actor;
}

async function readRoleBody(request: Request): Promise<ActorRole> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim();
  if (contentType !== "application/json") {
    throw new HttpInputError();
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    throw new HttpInputError();
  }
  if (rawBody.length < 1 || rawBody.length > MAX_SESSION_BODY_LENGTH) {
    throw new HttpInputError();
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    throw new HttpInputError();
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpInputError();
  }
  const entries = Object.entries(body);
  if (
    entries.length !== 1
    || entries[0]?.[0] !== "role"
    || (entries[0][1] !== "tenant" && entries[0][1] !== "agent")
  ) {
    throw new HttpInputError();
  }
  return entries[0][1];
}

function parseListingFilters(searchParams: URLSearchParams): ListingFilters {
  for (const name of searchParams.keys()) {
    if (!FILTER_NAMES.has(name) || searchParams.getAll(name).length !== 1) {
      throw new HttpInputError();
    }
  }

  const filters: ListingFilters = {};
  const area = searchParams.get("area");
  const maxRent = searchParams.get("maxRent");
  const minSizeSqM = searchParams.get("minSizeSqM");
  const availableFrom = searchParams.get("availableFrom");
  if (area !== null) filters.area = area;
  if (maxRent !== null) filters.maxRent = parseInteger(maxRent);
  if (minSizeSqM !== null) filters.minSizeSqM = parseInteger(minSizeSqM);
  if (availableFrom !== null) filters.availableFrom = availableFrom;
  return filters;
}

function parseInteger(value: string): number {
  if (!/^(0|[1-9]\d*)$/.test(value)) {
    throw new HttpInputError();
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new HttpInputError();
  }
  return parsed;
}

function domainErrorResponse(error: DomainError): Response {
  switch (error.code) {
    case "FORBIDDEN":
      return errorResponse(403, "FORBIDDEN", "Tenant access is required");
    case "NOT_FOUND":
      return errorResponse(404, "NOT_FOUND", "Listing was not found");
    case "VALIDATION_FAILED":
      return errorResponse(400, "VALIDATION_FAILED", "Listing input is invalid");
    default:
      throw error;
  }
}

function errorResponse(
  status: number,
  code: string,
  message: string,
): Response {
  const payload: ErrorPayload = { error: { code, message } };
  return jsonResponse(status, payload);
}

function jsonResponse(status: number, payload: object, extraHeaders: HeadersInit = {}): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...JSON_HEADERS, ...Object.fromEntries(new Headers(extraHeaders).entries()) },
  });
}
