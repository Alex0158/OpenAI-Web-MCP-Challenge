import { isDomainError, type DomainError } from "../domain/errors";
import {
  OperationsProfileValidationError,
} from "../domain/operations-profile";
import {
  OPERATIONS_LISTING_LIFECYCLE_STATES,
  OPERATIONS_PUBLICATION_STATES,
} from "../domain/operations-profile-types";
import type {
  ListingPipelineQuery,
  OperationsProjectionQuery,
  OperationsUpcomingViewingStatus,
  UpcomingViewingsQuery,
} from "../domain/operations-profile-projection";
import type { Actor } from "../domain/types";
import { OperationsPersistenceError } from "../persistence/operations-store";
import {
  resolveDemoSession,
} from "./demo-session";
import {
  createOperationsInsightsApplication,
  type OperationsInsightsApplication,
} from "./operations-insights";
import type { OperationsApiQuery } from "../../shared/contracts/operations-api";

const JSON_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};
const QUERY_NAMES = new Set([
  "kind",
  "area",
  "publicationState",
  "lifecycleState",
  "minPublishedAgeDays",
  "from",
  "to",
  "status",
  "listingId",
]);

export type OperationsInsightsHttpDependencies = {
  createApplication?: () => Pick<OperationsInsightsApplication, "read" | "close">;
  now?: () => string;
};

class HttpInputError extends Error {}

export function handleReadOperationsInsights(
  request: Request,
  dependencies: OperationsInsightsHttpDependencies = {},
): Response {
  const actor = requireAgentSession(request);
  if (actor instanceof Response) return actor;

  let query: OperationsProjectionQuery;
  try {
    query = parseOperationsQuery(new URL(request.url).searchParams);
  } catch (error) {
    if (error instanceof HttpInputError) {
      return errorResponse(400, "VALIDATION_FAILED", "Operations query is invalid");
    }
    throw error;
  }

  let application: Pick<OperationsInsightsApplication, "read" | "close">;
  try {
    application = dependencies.createApplication?.() ?? createOperationsInsightsApplication({
      now: dependencies.now,
    });
  } catch (error) {
    return mapOperationsFailure(error);
  }

  let payload: object | undefined;
  let readFailure: unknown;
  try {
    payload = application.read(actor, query);
  } catch (error) {
    readFailure = error;
  }

  try {
    application.close();
  } catch {
    // A close failure is a persistence failure, even if the read itself succeeded.
    return errorResponse(503, "PERSISTENCE_ERROR", "Operations service is unavailable");
  }
  if (readFailure !== undefined) return mapOperationsFailure(readFailure);
  return jsonResponse(200, payload!);
}

function requireAgentSession(request: Request): Actor | Response {
  const actor = resolveDemoSession(request.headers.get("cookie"));
  if (!actor) return errorResponse(401, "UNAUTHENTICATED", "Demo session is required");
  if (actor.role !== "agent") return errorResponse(403, "FORBIDDEN", "Agent access is required");
  return actor;
}

function parseOperationsQuery(searchParams: URLSearchParams): OperationsProjectionQuery {
  for (const name of searchParams.keys()) {
    if (!QUERY_NAMES.has(name) || searchParams.getAll(name).length !== 1) {
      throw new HttpInputError();
    }
  }

  const kind = required(searchParams, "kind");
  if (kind === "listingPipeline") {
    rejectNames(searchParams, ["kind", "area", "publicationState", "lifecycleState", "minPublishedAgeDays"]);
    const query: ListingPipelineQuery = { kind };
    optional(searchParams, "area", (value) => { query.area = boundedText(value); });
    optional(searchParams, "publicationState", (value) => {
      if (!OPERATIONS_PUBLICATION_STATES.includes(value as never)) throw new HttpInputError();
      query.publicationState = value as ListingPipelineQuery["publicationState"];
    });
    optional(searchParams, "lifecycleState", (value) => {
      if (!OPERATIONS_LISTING_LIFECYCLE_STATES.includes(value as never)) throw new HttpInputError();
      query.lifecycleState = value as ListingPipelineQuery["lifecycleState"];
    });
    optional(searchParams, "minPublishedAgeDays", (value) => {
      const parsed = parseNonNegativeInteger(value);
      query.minPublishedAgeDays = parsed;
    });
    return query;
  }

  if (kind === "upcomingViewings") {
    rejectNames(searchParams, ["kind", "from", "to", "status", "area", "listingId"]);
    const query: UpcomingViewingsQuery = {
      kind,
      from: required(searchParams, "from"),
      to: required(searchParams, "to"),
    };
    optional(searchParams, "status", (value) => {
      if (value !== "PROPOSED" && value !== "CONFIRMED") throw new HttpInputError();
      query.status = value as OperationsUpcomingViewingStatus;
    });
    optional(searchParams, "area", (value) => { query.area = boundedText(value); });
    optional(searchParams, "listingId", (value) => { query.listingId = boundedText(value); });
    return query;
  }

  throw new HttpInputError();
}

function rejectNames(searchParams: URLSearchParams, allowed: readonly string[]): void {
  const allowedNames = new Set(allowed);
  if ([...searchParams.keys()].some((name) => !allowedNames.has(name))) throw new HttpInputError();
}

function required(searchParams: URLSearchParams, name: string): string {
  const value = searchParams.get(name);
  if (value === null || value.length === 0) throw new HttpInputError();
  return value;
}

function optional(searchParams: URLSearchParams, name: string, accept: (value: string) => void): void {
  const value = searchParams.get(name);
  if (value !== null) {
    if (value.length === 0) throw new HttpInputError();
    accept(value);
  }
}

function boundedText(value: string): string {
  if (value.length === 0 || value.length > 100 || value.trim() !== value) throw new HttpInputError();
  return value;
}

function parseNonNegativeInteger(value: string): number {
  if (!/^(0|[1-9]\d*)$/.test(value)) throw new HttpInputError();
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new HttpInputError();
  return parsed;
}


function mapOperationsFailure(error: unknown): Response {
  if (error instanceof OperationsPersistenceError) {
    return errorResponse(503, "PERSISTENCE_ERROR", "Operations service is unavailable");
  }
  if (error instanceof OperationsProfileValidationError) {
    return errorResponse(503, "AUTHORITY_UNAVAILABLE", "Operations authority is unavailable");
  }
  if (isDomainError(error)) return domainErrorResponse(error);
  throw error;
}

function domainErrorResponse(error: DomainError): Response {
  if (error.code === "FORBIDDEN") return errorResponse(403, "FORBIDDEN", "Agent access is forbidden");
  return errorResponse(400, "VALIDATION_FAILED", "Operations query is invalid");
}

function errorResponse(status: number, code: string, message: string): Response {
  return jsonResponse(status, { error: { code, message } });
}

function jsonResponse(status: number, payload: object): Response {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}
