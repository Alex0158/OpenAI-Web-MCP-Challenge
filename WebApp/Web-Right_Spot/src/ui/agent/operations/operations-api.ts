import type {
  OperationsApiErrorCode,
  OperationsApiQuery,
  OperationsApiResponse,
} from "../../../shared/contracts/operations-api";

export type OperationsQuery = OperationsApiQuery;
export type OperationsResponse = OperationsApiResponse;
export type OperationsErrorCode = OperationsApiErrorCode | "INVALID_RESPONSE" | "NETWORK_ERROR" | "HTTP_ERROR";

export class OperationsApiError extends Error {
  readonly status: number;
  readonly code: OperationsErrorCode;

  constructor(status: number, code: OperationsErrorCode, message: string) {
    super(message);
    this.name = "OperationsApiError";
    this.status = status;
    this.code = code;
  }
}

export function buildOperationsUrl(query: OperationsQuery): string {
  const params = new URLSearchParams();
  params.set("kind", query.kind);
  if (query.kind === "listingPipeline") {
    if (query.area !== undefined) params.set("area", query.area);
    if (query.publicationState !== undefined) params.set("publicationState", query.publicationState);
    if (query.lifecycleState !== undefined) params.set("lifecycleState", query.lifecycleState);
    if (query.minPublishedAgeDays !== undefined) params.set("minPublishedAgeDays", String(query.minPublishedAgeDays));
  } else {
    params.set("from", query.from);
    params.set("to", query.to);
    if (query.status !== undefined) params.set("status", query.status);
    if (query.area !== undefined) params.set("area", query.area);
    if (query.listingId !== undefined) params.set("listingId", query.listingId);
  }
  return `/api/agent/operations?${params.toString()}`;
}

export async function readOperations(query: OperationsQuery): Promise<OperationsResponse> {
  let response: Response;
  try {
    response = await fetch(buildOperationsUrl(query), {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new OperationsApiError(0, "NETWORK_ERROR", "Operations service could not be reached.");
  }

  const payload = await readJson(response);
  if (!response.ok) throw toOperationsError(response.status, payload);
  try {
    return parseOperationsResponse(payload, query);
  } catch {
    throw new OperationsApiError(response.status, "INVALID_RESPONSE", "Operations returned an invalid response.");
  }
}

function parseOperationsResponse(value: unknown, query: OperationsQuery): OperationsResponse {
  if (!isRecord(value)
    || value.profile !== "operations"
    || !isPositiveInteger(value.fixtureGeneration)
    || value.timezone !== "Europe/London"
    || !isIsoInstant(value.asOf)
    || !isIsoInstant(value.dataAsOf)
    || value.freshness !== "CURRENT"
    || !isRecord(value.filters)
    || !Array.isArray(value.items)
    || !isNonNegativeInteger(value.totalCount)
    || !isNonNegativeInteger(value.returnedCount)
    || value.returnedCount !== value.items.length
    || value.truncated !== (value.totalCount > value.returnedCount)
    || value.filters.kind !== query.kind) {
    throw new Error("invalid envelope");
  }
  if (query.kind === "listingPipeline") {
    if (!hasExactFilters(value.filters, query) || !isListingCounts(value.counts)
      || value.counts.publicationState.PUBLISHED + value.counts.publicationState.UNPUBLISHED !== value.totalCount
      || Object.values(value.counts.lifecycleState as Record<string, number>).reduce((sum, count) => sum + count, 0) !== value.totalCount) throw new Error("invalid listing envelope");
    value.items.forEach(parseListingItem);
    return value as unknown as OperationsResponse;
  }
  if (!hasExactFilters(value.filters, query) || !isViewingCounts(value.counts)
    || Object.values(value.counts as Record<string, number>).reduce((sum, count) => sum + count, 0) !== value.totalCount) throw new Error("invalid viewing envelope");
  value.items.forEach(parseViewingItem);
  return value as unknown as OperationsResponse;
}

function hasExactFilters(filters: Record<string, any>, query: OperationsQuery): boolean {
  const expected = Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined));
  return Object.keys(filters).length === Object.keys(expected).length
    && Object.entries(expected).every(([key, value]) => filters[key] === value);
}

function parseListingItem(value: unknown): void {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !isNonNegativeInteger(value.revision) || !isNonEmptyString(value.title)
    || !isNonEmptyString(value.area) || !isFiniteNumber(value.monthlyRentGbp) || !isNonNegativeInteger(value.bedrooms)
    || !isFiniteNumber(value.sizeSqM) || !isDateOnly(value.availableFrom) || !isPublicationState(value.publicationState)
    || !isLifecycleState(value.lifecycleState) || !isIsoInstant(value.firstPublishedAt) || !isNonNegativeInteger(value.publishedAgeDays)
    || typeof value.stale !== "boolean") throw new Error("invalid listing item");
}

function parseViewingItem(value: unknown): void {
  if (!isRecord(value) || !isNonEmptyString(value.slotId) || !isNonEmptyString(value.requestId) || !isNonEmptyString(value.listingId)
    || !isNonEmptyString(value.listingTitle) || !isNonEmptyString(value.area) || !isViewingStatus(value.status)
    || !isIsoInstant(value.startsAt) || !isIsoInstant(value.endsAt)) throw new Error("invalid viewing item");
}

function isListingCounts(value: unknown): boolean {
  return isRecord(value) && isCounts(value.publicationState, ["PUBLISHED", "UNPUBLISHED"])
    && isCounts(value.lifecycleState, ["OPEN", "UNAVAILABLE", "LET_AGREED", "ARCHIVED"]);
}

function isViewingCounts(value: unknown): boolean {
  return isRecord(value) && isCounts(value, ["PROPOSED", "CONFIRMED"]);
}

function isCounts(value: unknown, keys: readonly string[]): boolean {
  return isRecord(value) && Object.keys(value).length === keys.length && keys.every((key) => isNonNegativeInteger(value[key]));
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isNonEmptyString(value: unknown): value is string { return typeof value === "string" && value.length > 0; }
function isPositiveInteger(value: unknown): value is number { return isNonNegativeInteger(value) && value > 0; }
function isNonNegativeInteger(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value >= 0; }
function isFiniteNumber(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value); }
function isIsoInstant(value: unknown): value is string { return typeof value === "string" && !Number.isNaN(Date.parse(value)) && value.includes("T"); }
function isDateOnly(value: unknown): value is string { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)); }
function isPublicationState(value: unknown): boolean { return value === "PUBLISHED" || value === "UNPUBLISHED"; }
function isLifecycleState(value: unknown): boolean { return value === "OPEN" || value === "UNAVAILABLE" || value === "LET_AGREED" || value === "ARCHIVED"; }
function isViewingStatus(value: unknown): boolean { return value === "PROPOSED" || value === "CONFIRMED"; }

async function readJson(response: Response): Promise<unknown> {
  try { return await response.json(); } catch { return undefined; }
}

function toOperationsError(status: number, payload: unknown): OperationsApiError {
  const code = isRecord(payload) && isRecord(payload.error) && typeof payload.error.code === "string"
    ? payload.error.code as OperationsErrorCode
    : "HTTP_ERROR";
  const accepted = ["UNAUTHENTICATED", "FORBIDDEN", "VALIDATION_FAILED", "PERSISTENCE_ERROR", "AUTHORITY_UNAVAILABLE"];
  const safeCode = accepted.includes(code) ? code : "HTTP_ERROR";
  const messages: Record<string, string> = {
    UNAUTHENTICATED: "Your agent session could not be verified. Return to sign in and start again.",
    FORBIDDEN: "This agent workspace is not available for the active demo session.",
    VALIDATION_FAILED: "The Operations query is invalid. Check the filters and try again.",
    PERSISTENCE_ERROR: "The Operations service is temporarily unavailable. Try again shortly.",
    AUTHORITY_UNAVAILABLE: "The Operations authority is unavailable. Try again after the source is restored.",
    HTTP_ERROR: "The Operations service returned an unexpected response. Try again.",
  };
  return new OperationsApiError(status, safeCode, messages[safeCode]!);
}
