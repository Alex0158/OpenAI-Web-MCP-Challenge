"use client";

import type {
  AgentQueueResponse,
  AgentRequestResponse,
  AgentWorkflowMutationResponse,
  WorkflowAvailabilitySlotDto,
  WorkflowErrorCode,
  WorkflowResponseDto,
} from "../../shared/contracts/workflow-api";

export type {
  AgentQueueResponse,
  AgentRequestResponse,
  AgentWorkflowMutationResponse,
  WorkflowAvailabilitySlotDto,
  WorkflowResponseDto,
};

export class AgentApiError extends Error {
  readonly status: number;
  readonly code: WorkflowErrorCode | "INVALID_RESPONSE" | "HTTP_ERROR";

  constructor(
    status: number,
    code: AgentApiError["code"],
    message: string,
  ) {
    super(message);
    this.name = "AgentApiError";
    this.status = status;
    this.code = code;
  }
}

export type AgentCommandMetadata = {
  fixtureGeneration: number;
  expectedRequestVersion: number;
};

export type AgentPreparationInput = {
  fixtureGeneration: number;
  expectedRequestVersion: number;
  preparation: WorkflowResponseDto;
  internalReviewNote?: string;
};

const REQUEST_STATES = [
  "TENANT_DRAFT",
  "REQUEST_SUBMITTED",
  "AGENT_REVIEWING",
  "SLOT_PROPOSED",
  "VIEWING_CONFIRMED",
  "TENANT_DECLINED",
  "EXPIRED",
  "AGENT_DECLINED",
] as const;

const RESPONSE_KINDS = ["SLOT_PROPOSAL", "AGENT_DECLINE"] as const;
const AVAILABILITY_STATUSES = ["AVAILABLE", "HELD_FOR_PROPOSAL", "CONFIRMED"] as const;

export async function readAgentQueue(): Promise<AgentQueueResponse> {
  return requestJson<AgentQueueResponse>("/api/agent/requests", {
    method: "GET",
  }, parseAgentQueueResponse);
}

export async function readAgentRequest(requestId: string): Promise<AgentRequestResponse> {
  return requestJson<AgentRequestResponse>(
    `/api/agent/requests/${encodeURIComponent(requestId)}`,
    { method: "GET" },
    parseAgentRequestResponse,
  );
}

export async function startAgentReview(
  requestId: string,
  metadata: AgentCommandMetadata,
): Promise<AgentWorkflowMutationResponse> {
  return requestJson<AgentWorkflowMutationResponse>(
    `/api/agent/requests/${encodeURIComponent(requestId)}/review`,
    {
      method: "POST",
      body: {
        commandId: createCommandId(),
        fixtureGeneration: metadata.fixtureGeneration,
        expectedRequestVersion: metadata.expectedRequestVersion,
      },
    },
    parseAgentMutationResponse,
  );
}

export async function prepareAgentResponse(
  requestId: string,
  input: AgentPreparationInput,
): Promise<AgentWorkflowMutationResponse> {
  const preparation = input.preparation.kind === "SLOT_PROPOSAL"
    ? {
        kind: input.preparation.kind,
        slotId: input.preparation.slotId,
        ...(input.preparation.tenantNote !== undefined
          ? { tenantNote: input.preparation.tenantNote }
          : {}),
      }
    : {
        kind: input.preparation.kind,
        ...(input.preparation.tenantNote !== undefined
          ? { tenantNote: input.preparation.tenantNote }
          : {}),
      };

  return requestJson<AgentWorkflowMutationResponse>(
    `/api/agent/requests/${encodeURIComponent(requestId)}/preparation`,
    {
      method: "PUT",
      body: {
        commandId: createCommandId(),
        fixtureGeneration: input.fixtureGeneration,
        expectedRequestVersion: input.expectedRequestVersion,
        preparation,
        ...(input.internalReviewNote !== undefined
          ? { internalReviewNote: input.internalReviewNote }
          : {}),
      },
    },
    parseAgentMutationResponse,
  );
}

export async function sendAgentResponse(
  requestId: string,
  metadata: AgentCommandMetadata,
): Promise<AgentWorkflowMutationResponse> {
  return requestJson<AgentWorkflowMutationResponse>(
    `/api/agent/requests/${encodeURIComponent(requestId)}/send`,
    {
      method: "POST",
      body: {
        commandId: createCommandId(),
        fixtureGeneration: metadata.fixtureGeneration,
        expectedRequestVersion: metadata.expectedRequestVersion,
      },
    },
    parseAgentMutationResponse,
  );
}

type RequestOptions = {
  method: "GET" | "POST" | "PUT";
  body?: Record<string, unknown>;
};

async function requestJson<T>(
  url: string,
  options: RequestOptions,
  parse: (payload: unknown) => T,
): Promise<T> {
  const response = await fetch(url, {
    method: options.method,
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  const payload = await readPayload(response);
  if (!response.ok) {
    throw toApiError(response.status, payload);
  }

  try {
    return parse(payload);
  } catch (error: unknown) {
    if (error instanceof AgentApiError) throw error;
    throw new AgentApiError(response.status, "INVALID_RESPONSE", "Agent service returned invalid data");
  }
}

async function readPayload(response: Response): Promise<unknown> {
  try {
    return await response.json() as unknown;
  } catch {
    throw new AgentApiError(response.status, "INVALID_RESPONSE", "Agent service returned invalid data");
  }
}

function toApiError(status: number, payload: unknown): AgentApiError {
  if (isRecord(payload) && isRecord(payload.error)) {
    const error = payload.error;
    if (typeof error.code === "string" && isErrorCode(error.code) && typeof error.message === "string") {
      return new AgentApiError(status, error.code, error.message);
    }
  }
  return new AgentApiError(status, "HTTP_ERROR", "The agent request failed");
}

function createCommandId(): string {
  return globalThis.crypto.randomUUID();
}

function parseAgentQueueResponse(payload: unknown): AgentQueueResponse {
  if (!isRecord(payload) || !isPositiveInteger(payload.fixtureGeneration) || !Array.isArray(payload.requests)) {
    throw new AgentApiError(200, "INVALID_RESPONSE", "Agent queue response was invalid");
  }

  if (!isRecord(payload.counts)) {
    throw new AgentApiError(200, "INVALID_RESPONSE", "Agent queue response was invalid");
  }

  const requests = payload.requests.map((item) => {
    if (
      !isRecord(item)
      || typeof item.id !== "string"
      || typeof item.listingId !== "string"
      || !isRequestState(item.state)
      || !isNonNegativeInteger(item.version)
    ) {
      throw new AgentApiError(200, "INVALID_RESPONSE", "Agent queue response was invalid");
    }
    return {
      id: item.id,
      listingId: item.listingId,
      state: item.state,
      version: item.version,
    };
  });

  const counts = {} as AgentQueueResponse["counts"];
  for (const state of REQUEST_STATES) {
    if (!isNonNegativeInteger(payload.counts[state])) {
      throw new AgentApiError(200, "INVALID_RESPONSE", "Agent queue response was invalid");
    }
    counts[state] = payload.counts[state];
  }

  return { fixtureGeneration: payload.fixtureGeneration, requests, counts };
}

function parseAgentMutationResponse(payload: unknown): AgentWorkflowMutationResponse {
  const response = parseAgentRequestResponse(payload);
  if (!isRecord(payload) || !isRecord(payload.result)) {
    throw new AgentApiError(200, "INVALID_RESPONSE", "Agent mutation response was invalid");
  }
  const result = payload.result;
  if (!isRequestState(result.state) || !isNonNegativeInteger(result.version)) {
    throw new AgentApiError(200, "INVALID_RESPONSE", "Agent mutation response was invalid");
  }
  if (result.slotId !== undefined && typeof result.slotId !== "string") {
    throw new AgentApiError(200, "INVALID_RESPONSE", "Agent mutation response was invalid");
  }
  if (result.idempotent !== undefined && typeof result.idempotent !== "boolean") {
    throw new AgentApiError(200, "INVALID_RESPONSE", "Agent mutation response was invalid");
  }
  return {
    ...response,
    result: {
      state: result.state,
      version: result.version,
      ...(result.slotId !== undefined ? { slotId: result.slotId } : {}),
      ...(result.idempotent !== undefined ? { idempotent: result.idempotent } : {}),
    },
  };
}

function parseAgentRequestResponse(payload: unknown): AgentRequestResponse {
  if (
    !isRecord(payload)
    || !isPositiveInteger(payload.fixtureGeneration)
    || !isRecord(payload.request)
    || !isRecord(payload.listing)
    || !Array.isArray(payload.availability)
  ) {
    throw new AgentApiError(200, "INVALID_RESPONSE", "Agent request response was invalid");
  }

  const request = parseAgentRequest(payload.request);
  const listing = parseListing(payload.listing);
  const availability = payload.availability.map(parseAvailabilitySlot);
  return { fixtureGeneration: payload.fixtureGeneration, request, listing, availability };
}

function parseAgentRequest(value: Record<string, unknown>): AgentRequestResponse["request"] {
  if (
    typeof value.id !== "string"
    || typeof value.listingId !== "string"
    || !Array.isArray(value.preferredTimes)
    || value.preferredTimes.some((time) => typeof time !== "string")
    || !isRequestState(value.state)
    || !isNonNegativeInteger(value.version)
  ) {
    throw new AgentApiError(200, "INVALID_RESPONSE", "Agent request response was invalid");
  }

  const result: AgentRequestResponse["request"] = {
    id: value.id,
    listingId: value.listingId,
    preferredTimes: [...value.preferredTimes] as string[],
    state: value.state,
    version: value.version,
  };
  if (value.tenantNote !== undefined) result.tenantNote = readOptionalString(value.tenantNote);
  if (value.preparedResponse !== undefined) result.preparedResponse = parseResponse(value.preparedResponse);
  if (value.sentResponse !== undefined) result.sentResponse = parseResponse(value.sentResponse);
  if (value.proposalExpiresAt !== undefined) result.proposalExpiresAt = readOptionalString(value.proposalExpiresAt);
  if (value.internalReviewNote !== undefined) result.internalReviewNote = readOptionalString(value.internalReviewNote);
  return result;
}

function parseListing(value: Record<string, unknown>): AgentRequestResponse["listing"] {
  if (
    typeof value.id !== "string"
    || !isPositiveInteger(value.version)
    || typeof value.title !== "string"
    || typeof value.address !== "string"
    || typeof value.area !== "string"
    || typeof value.monthlyRentGbp !== "number"
    || typeof value.bedrooms !== "number"
    || typeof value.sizeSqM !== "number"
    || typeof value.availableFrom !== "string"
    || typeof value.description !== "string"
    || typeof value.imageKey !== "string"
    || (value.status !== "PUBLISHED" && value.status !== "UNPUBLISHED")
  ) {
    throw new AgentApiError(200, "INVALID_RESPONSE", "Agent listing response was invalid");
  }
  return {
    id: value.id,
    version: value.version,
    title: value.title,
    address: value.address,
    area: value.area,
    monthlyRentGbp: value.monthlyRentGbp,
    bedrooms: value.bedrooms,
    sizeSqM: value.sizeSqM,
    availableFrom: value.availableFrom,
    description: value.description,
    imageKey: value.imageKey,
    status: value.status,
  };
}

function parseAvailabilitySlot(value: unknown): WorkflowAvailabilitySlotDto {
  if (
    !isRecord(value)
    || typeof value.id !== "string"
    || typeof value.listingId !== "string"
    || typeof value.startsAt !== "string"
    || typeof value.endsAt !== "string"
    || !isAvailabilityStatus(value.status)
  ) {
    throw new AgentApiError(200, "INVALID_RESPONSE", "Agent availability response was invalid");
  }
  return {
    id: value.id,
    listingId: value.listingId,
    startsAt: value.startsAt,
    endsAt: value.endsAt,
    status: value.status,
  };
}

function parseResponse(value: unknown): WorkflowResponseDto {
  if (!isRecord(value) || !isResponseKind(value.kind)) {
    throw new AgentApiError(200, "INVALID_RESPONSE", "Agent response data was invalid");
  }
  if (value.tenantNote !== undefined && typeof value.tenantNote !== "string") {
    throw new AgentApiError(200, "INVALID_RESPONSE", "Agent response data was invalid");
  }
  if (value.kind === "SLOT_PROPOSAL") {
    if (typeof value.slotId !== "string") {
      throw new AgentApiError(200, "INVALID_RESPONSE", "Agent response data was invalid");
    }
    return {
      kind: value.kind,
      slotId: value.slotId,
      ...(value.tenantNote !== undefined ? { tenantNote: value.tenantNote } : {}),
    };
  }
  return {
    kind: value.kind,
    ...(value.tenantNote !== undefined ? { tenantNote: value.tenantNote } : {}),
  };
}

function readOptionalString(value: unknown): string {
  if (typeof value !== "string") {
    throw new AgentApiError(200, "INVALID_RESPONSE", "Agent request response was invalid");
  }
  return value;
}

function isRequestState(value: unknown): value is AgentQueueResponse["requests"][number]["state"] {
  return typeof value === "string" && (REQUEST_STATES as readonly string[]).includes(value);
}

function isResponseKind(value: unknown): value is WorkflowResponseDto["kind"] {
  return typeof value === "string" && (RESPONSE_KINDS as readonly string[]).includes(value);
}

function isAvailabilityStatus(value: unknown): value is WorkflowAvailabilitySlotDto["status"] {
  return typeof value === "string" && (AVAILABILITY_STATUSES as readonly string[]).includes(value);
}

function isErrorCode(value: string): value is WorkflowErrorCode {
  return [
    "UNAUTHENTICATED",
    "FORBIDDEN",
    "NOT_FOUND",
    "VALIDATION_FAILED",
    "STALE_VERSION",
    "FIXTURE_GENERATION_CONFLICT",
    "INVALID_TRANSITION",
    "SLOT_UNAVAILABLE",
    "EXPIRED",
    "COMMAND_CONFLICT",
    "PERSISTENCE_ERROR",
  ].includes(value as WorkflowErrorCode);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
