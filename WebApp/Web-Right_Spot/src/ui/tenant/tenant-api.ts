import type {
  CreateRequestDraftBody,
  TenantDecisionBody,
  TenantRequestResponse,
  TenantWorkflowMutationResponse,
  SubmitRequestBody,
  UpdateRequestDraftBody,
  WorkflowListingDto,
  WorkflowResponseDto,
  WorkflowRequestState,
  WorkflowTimelineEntryDto,
} from "../../shared/contracts/workflow-api";
import type {
  TenantListingHttpFilters,
  TenantListingFilters,
  TenantListingsResponse,
} from "../../shared/contracts/listings-api";

export type { TenantListingFilters, TenantListingsResponse } from "../../shared/contracts/listings-api";

export type TenantListingResponse = {
  fixtureGeneration: number;
  listing: WorkflowListingDto;
};

export class TenantApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "TenantApiError";
    this.status = status;
    this.code = code;
  }
}

export type CreateDraftInput = Omit<CreateRequestDraftBody, "commandId"> & {
  commandId?: string;
};

export type UpdateDraftInput = Omit<UpdateRequestDraftBody, "commandId"> & {
  commandId?: string;
};

export type SubmitInput = Omit<SubmitRequestBody, "commandId"> & {
  commandId?: string;
};

export type DecisionInput = Omit<TenantDecisionBody, "commandId"> & {
  commandId?: string;
};

export function buildCreateDraftPayload(input: CreateDraftInput): CreateRequestDraftBody {
  return {
    commandId: input.commandId ?? createCommandId("create-draft"),
    fixtureGeneration: input.fixtureGeneration,
    listingId: input.listingId,
    expectedListingVersion: input.expectedListingVersion,
    preferredTimes: [...input.preferredTimes],
    ...(input.tenantNote !== undefined ? { tenantNote: input.tenantNote } : {}),
  };
}

export function buildUpdateDraftPayload(input: UpdateDraftInput): UpdateRequestDraftBody {
  return {
    commandId: input.commandId ?? createCommandId("update-draft"),
    fixtureGeneration: input.fixtureGeneration,
    expectedRequestVersion: input.expectedRequestVersion,
    expectedListingVersion: input.expectedListingVersion,
    preferredTimes: [...input.preferredTimes],
    ...(input.tenantNote !== undefined ? { tenantNote: input.tenantNote } : {}),
  };
}

export function buildSubmitPayload(input: SubmitInput): SubmitRequestBody {
  return {
    commandId: input.commandId ?? createCommandId("submit-request"),
    fixtureGeneration: input.fixtureGeneration,
    expectedRequestVersion: input.expectedRequestVersion,
    expectedListingVersion: input.expectedListingVersion,
  };
}

export function buildDecisionPayload(input: DecisionInput): TenantDecisionBody {
  return {
    commandId: input.commandId ?? createCommandId("tenant-decision"),
    fixtureGeneration: input.fixtureGeneration,
    expectedRequestVersion: input.expectedRequestVersion,
  };
}

export function createCommandId(prefix: string): string {
  if (!globalThis.crypto?.randomUUID) {
    throw new TenantApiError(503, "COMMAND_ID_UNAVAILABLE", "A fresh command could not be created");
  }
  return `${prefix}-${globalThis.crypto.randomUUID()}`;
}

export function buildListingsUrl(filters: TenantListingHttpFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.area !== undefined) params.set("area", filters.area);
  if (filters.maxRent !== undefined) params.set("maxRent", String(filters.maxRent));
  if (filters.minSizeSqM !== undefined) params.set("minSizeSqM", String(filters.minSizeSqM));
  const availableBy = filters.availableBy ?? filters.availableFrom;
  if (availableBy !== undefined) params.set("availableBy", availableBy);
  const query = params.toString();
  return query ? `/api/listings?${query}` : "/api/listings";
}

export async function readListings(
  filters: TenantListingFilters = {},
  options: Pick<RequestInit, "signal"> = {},
): Promise<TenantListingsResponse> {
  const payload = await requestJson(buildListingsUrl(filters), {
    method: "GET",
    ...(options.signal !== undefined ? { signal: options.signal } : {}),
  });
  return parseListingsResponse(payload);
}

export async function readListing(listingId: string): Promise<TenantListingResponse> {
  const payload = await requestJson(`/api/listings/${encodeURIComponent(listingId)}`, { method: "GET" });
  return parseListingResponse(payload);
}

export async function readTenantRequest(): Promise<TenantRequestResponse> {
  const payload = await requestJson("/api/tenant/request", { method: "GET" });
  return parseTenantRequestResponse(payload);
}

export async function createTenantDraft(input: CreateDraftInput): Promise<TenantWorkflowMutationResponse> {
  const payload = buildCreateDraftPayload(input);
  return parseTenantMutationResponse(await requestJson("/api/tenant/request", jsonOptions("POST", payload)));
}

export async function updateTenantDraft(input: UpdateDraftInput): Promise<TenantWorkflowMutationResponse> {
  const payload = buildUpdateDraftPayload(input);
  return parseTenantMutationResponse(await requestJson("/api/tenant/request", jsonOptions("PATCH", payload)));
}

export async function submitTenantRequest(input: SubmitInput): Promise<TenantWorkflowMutationResponse> {
  const payload = buildSubmitPayload(input);
  return parseTenantMutationResponse(
    await requestJson("/api/tenant/request/submit", jsonOptions("POST", payload)),
  );
}

export async function confirmTenantRequest(input: DecisionInput): Promise<TenantWorkflowMutationResponse> {
  const payload = buildDecisionPayload(input);
  return parseTenantMutationResponse(
    await requestJson("/api/tenant/request/confirm", jsonOptions("POST", payload)),
  );
}

export async function declineTenantRequest(input: DecisionInput): Promise<TenantWorkflowMutationResponse> {
  const payload = buildDecisionPayload(input);
  return parseTenantMutationResponse(
    await requestJson("/api/tenant/request/decline", jsonOptions("POST", payload)),
  );
}

export function tenantApiErrorMessage(error: unknown, action: string): string {
  if (!(error instanceof TenantApiError)) {
    return `Could not ${action}. Please try again.`;
  }

  switch (error.status) {
    case 400:
      return `The ${action} request was invalid. Check the bounded fields and try again.`;
    case 401:
      return "Your demo session is no longer active. Return to the sign-in surface and start again.";
    case 403:
      return "This tenant workspace cannot access that resource.";
    case 404:
      return "The requested rental resource was not found.";
    case 409:
      return "This view is stale or the request changed. Refresh to see the current server state.";
    case 503:
      return "RightSpot could not reach the local workflow service. Please try again.";
    default:
      return `Could not ${action}. Please try again.`;
  }
}

function jsonOptions(method: "POST" | "PATCH", body: object): RequestInit {
  return {
    method,
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

async function requestJson(path: string, options: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(path, {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json", ...(options.headers ?? {}) },
      ...options,
    });
  } catch {
    throw new TenantApiError(503, "NETWORK_ERROR", "The workflow service could not be reached");
  }

  let payload: unknown;
  try {
    payload = await response.json() as unknown;
  } catch {
    throw new TenantApiError(response.status, "INVALID_RESPONSE", "The workflow service returned invalid data");
  }

  if (!response.ok) {
    if (isRecord(payload) && isRecord(payload.error)
      && typeof payload.error.code === "string"
      && typeof payload.error.message === "string") {
      throw new TenantApiError(response.status, payload.error.code, payload.error.message);
    }
    throw new TenantApiError(response.status, `HTTP_${response.status}`, "The workflow request failed");
  }

  return payload;
}

function parseListingsResponse(value: unknown): TenantListingsResponse {
  if (!isRecord(value) || !isPositiveInteger(value.fixtureGeneration) || !Array.isArray(value.listings)) {
    throw invalidResponse();
  }
  const listings = value.listings.map(parseListing);
  const appliedFilters = value.appliedFilters === undefined
    ? {}
    : parseAppliedFilters(value.appliedFilters);
  const matchedCount = value.matchedCount === undefined
    ? listings.length
    : parseNonNegativeInteger(value.matchedCount);
  if (matchedCount !== listings.length) throw invalidResponse();
  const pagePath = value.pagePath === undefined ? "/tenant" : value.pagePath;
  if (pagePath !== "/tenant") throw invalidResponse();
  const pageState = value.pageState === undefined
    ? (matchedCount === 0 ? "empty" : "results")
    : parsePageState(value.pageState);
  if (pageState !== (matchedCount === 0 ? "empty" : "results")) throw invalidResponse();
  return {
    fixtureGeneration: value.fixtureGeneration,
    appliedFilters,
    matchedCount,
    listings,
    pagePath,
    pageState,
  };
}

function parseListingResponse(value: unknown): TenantListingResponse {
  if (!isRecord(value) || !isPositiveInteger(value.fixtureGeneration) || !isRecord(value.listing)) {
    throw invalidResponse();
  }
  return { fixtureGeneration: value.fixtureGeneration, listing: parseListing(value.listing) };
}

function parseTenantRequestResponse(value: unknown): TenantRequestResponse {
  if (!isRecord(value) || !isPositiveInteger(value.fixtureGeneration)
    || !isNullableRecord(value.request) || !isNullableRecord(value.listing)
    || !Array.isArray(value.timeline)) {
    throw invalidResponse();
  }
  return {
    fixtureGeneration: value.fixtureGeneration,
    request: value.request === null ? null : parseTenantRequest(value.request),
    listing: value.listing === null ? null : parseListing(value.listing),
    timeline: value.timeline.map(parseTimelineEntry),
  };
}

function parseTenantMutationResponse(value: unknown): TenantWorkflowMutationResponse {
  const response = parseTenantRequestResponse(value);
  if (!isRecord(value) || !isRecord(value.result)) throw invalidResponse();
  return { ...response, result: parseCommandResult(value.result) };
}

function parseListing(value: unknown): WorkflowListingDto {
  if (!isRecord(value)
    || typeof value.id !== "string"
    || !isPositiveInteger(value.version)
    || typeof value.title !== "string"
    || typeof value.address !== "string"
    || typeof value.area !== "string"
    || !Number.isSafeInteger(value.monthlyRentGbp)
    || !Number.isSafeInteger(value.bedrooms)
    || !Number.isSafeInteger(value.sizeSqM)
    || typeof value.availableFrom !== "string"
    || typeof value.description !== "string"
    || typeof value.imageKey !== "string") {
    throw invalidResponse();
  }
  return {
    id: value.id,
    version: value.version as number,
    title: value.title,
    address: value.address,
    area: value.area,
    monthlyRentGbp: value.monthlyRentGbp as number,
    bedrooms: value.bedrooms as number,
    sizeSqM: value.sizeSqM as number,
    availableFrom: value.availableFrom,
    description: value.description,
    imageKey: value.imageKey,
  };
}

function parseAppliedFilters(value: unknown): TenantListingsResponse["appliedFilters"] {
  if (!isRecord(value)) {
    throw invalidResponse();
  }
  const allowedNames = new Set(["area", "maxRent", "minSizeSqM", "availableBy"]);
  if (Object.keys(value).some((name) => !allowedNames.has(name))) {
    throw invalidResponse();
  }
  const appliedFilters: TenantListingsResponse["appliedFilters"] = {};
  if (value.area !== undefined && (typeof value.area !== "string" || value.area.trim().length === 0
    || value.area !== value.area.trim())) {
    throw invalidResponse();
  }
  if (value.area !== undefined) {
    appliedFilters.area = value.area;
  }
  if (value.maxRent !== undefined && !isPositiveInteger(value.maxRent)) {
    throw invalidResponse();
  }
  if (value.maxRent !== undefined) {
    appliedFilters.maxRent = value.maxRent;
  }
  if (value.minSizeSqM !== undefined && !isPositiveInteger(value.minSizeSqM)) {
    throw invalidResponse();
  }
  if (value.minSizeSqM !== undefined) {
    appliedFilters.minSizeSqM = value.minSizeSqM;
  }
  if (value.availableBy !== undefined
    && (typeof value.availableBy !== "string" || !isIsoDate(value.availableBy))) {
    throw invalidResponse();
  }
  const availableBy = value.availableBy;
  if (availableBy !== undefined) {
    appliedFilters.availableBy = availableBy;
  }
  return appliedFilters;
}

function parseNonNegativeInteger(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw invalidResponse();
  }
  return value;
}

function parsePageState(value: unknown): TenantListingsResponse["pageState"] {
  if (value === "results" || value === "empty") {
    return value;
  }
  throw invalidResponse();
}

function parseTenantRequest(value: Record<string, unknown>): TenantRequestResponse["request"] {
  if (typeof value.id !== "string"
    || typeof value.listingId !== "string"
    || !isStringArray(value.preferredTimes)
    || !isRequestState(value.state)
    || !isPositiveInteger(value.version)
    || (value.tenantNote !== undefined && typeof value.tenantNote !== "string")
    || (value.proposalExpiresAt !== undefined && typeof value.proposalExpiresAt !== "string")) {
    throw invalidResponse();
  }
  const response = value.response !== undefined ? parseResponse(value.response) : undefined;
  const viewingSlot = value.viewingSlot !== undefined ? parseTenantViewingSlot(value.viewingSlot) : undefined;
  if (viewingSlot !== undefined && response?.kind !== "SLOT_PROPOSAL") {
    throw invalidResponse();
  }
  return {
    id: value.id,
    listingId: value.listingId,
    preferredTimes: [...value.preferredTimes],
    ...(value.tenantNote !== undefined ? { tenantNote: value.tenantNote } : {}),
    state: value.state as WorkflowRequestState,
    version: value.version as number,
    ...(response !== undefined ? { response } : {}),
    ...(viewingSlot !== undefined ? { viewingSlot } : {}),
    ...(value.proposalExpiresAt !== undefined ? { proposalExpiresAt: value.proposalExpiresAt } : {}),
  };
}

function parseTenantViewingSlot(value: unknown): NonNullable<TenantRequestResponse["request"]>["viewingSlot"] {
  if (!isRecord(value) || typeof value.startsAt !== "string" || typeof value.endsAt !== "string") {
    throw invalidResponse();
  }
  return { startsAt: value.startsAt, endsAt: value.endsAt };
}

function parseResponse(value: unknown): WorkflowResponseDto {
  if (!isRecord(value) || (value.tenantNote !== undefined && typeof value.tenantNote !== "string")) {
    throw invalidResponse();
  }
  if (value.kind === "SLOT_PROPOSAL" && typeof value.slotId === "string") {
    return {
      kind: value.kind,
      slotId: value.slotId,
      ...(value.tenantNote !== undefined ? { tenantNote: value.tenantNote } : {}),
    };
  }
  if (value.kind === "AGENT_DECLINE") {
    return {
      kind: value.kind,
      ...(value.tenantNote !== undefined ? { tenantNote: value.tenantNote } : {}),
    };
  }
  throw invalidResponse();
}

function parseTimelineEntry(value: unknown): WorkflowTimelineEntryDto {
  if (!isRecord(value)
    || !Number.isSafeInteger(value.sequence)
    || typeof value.operation !== "string"
    || (value.fromState !== null && !isRequestState(value.fromState))
    || !isRequestState(value.toState)
    || !isPositiveInteger(value.requestVersion)) {
    throw invalidResponse();
  }
  return {
    sequence: value.sequence as number,
    operation: value.operation as WorkflowTimelineEntryDto["operation"],
    fromState: value.fromState as WorkflowTimelineEntryDto["fromState"],
    toState: value.toState,
    requestVersion: value.requestVersion,
  };
}

function parseCommandResult(value: Record<string, unknown>): TenantWorkflowMutationResponse["result"] {
  if (!isRequestState(value.state) || !isPositiveInteger(value.version)
    || (value.slotId !== undefined && typeof value.slotId !== "string")
    || (value.idempotent !== undefined && typeof value.idempotent !== "boolean")) {
    throw invalidResponse();
  }
  return {
    state: value.state as WorkflowRequestState,
    version: value.version as number,
    ...(value.slotId !== undefined ? { slotId: value.slotId } : {}),
    ...(value.idempotent === true ? { idempotent: true } : {}),
  };
}

function invalidResponse(): TenantApiError {
  return new TenantApiError(200, "INVALID_RESPONSE", "The workflow service returned invalid data");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableRecord(value: unknown): value is Record<string, unknown> | null {
  return value === null || isRecord(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isIsoDate(value: string): boolean {
  const parsed = Date.parse(`${value}T00:00:00.000Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(parsed)
    && new Date(parsed).toISOString().slice(0, 10) === value;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isRequestState(value: unknown): value is WorkflowRequestState {
  return typeof value === "string" && [
    "TENANT_DRAFT",
    "REQUEST_SUBMITTED",
    "AGENT_REVIEWING",
    "SLOT_PROPOSED",
    "VIEWING_CONFIRMED",
    "TENANT_DECLINED",
    "EXPIRED",
    "AGENT_DECLINED",
  ].includes(value);
}
