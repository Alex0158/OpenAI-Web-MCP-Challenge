import { WorkflowPersistenceError } from "../persistence/workflow-store";
import {
  WORKFLOW_REQUEST_STATES,
  WORKFLOW_TIMELINE_OPERATIONS,
  type AgentListingDto,
  type AgentQueueResponse,
  type AgentRequestResponse,
  type TenantRequestResponse,
  type WorkflowAvailabilitySlotDto,
  type WorkflowCommandResultDto,
  type WorkflowListingDto,
  type WorkflowResponseDto,
  type WorkflowRequestState,
  type WorkflowTimelineEntryDto,
} from "../../shared/contracts/workflow-api";
import type {
  AgentProjection,
  AuditEntry,
  Listing,
  ProjectionOutcome,
  SentResponse,
  TenantProjection,
  ViewingRequest,
} from "../domain/types";

export function toTenantRequestView(
  outcome: ProjectionOutcome<TenantProjection | null>,
): TenantRequestResponse {
  if (!outcome.projection) {
    return {
      fixtureGeneration: outcome.state.fixtureGeneration,
      request: null,
      listing: null,
      timeline: [],
    };
  }

  return {
    fixtureGeneration: outcome.state.fixtureGeneration,
    request: {
      id: outcome.projection.request.id,
      listingId: outcome.projection.request.listingId,
      preferredTimes: [...outcome.projection.request.preferredTimes],
      tenantNote: outcome.projection.request.tenantNote,
      state: outcome.projection.request.state,
      version: outcome.projection.request.version,
      response: outcome.projection.request.response
        ? toResponse(outcome.projection.request.response)
        : undefined,
      ...(outcome.projection.request.viewingSlot
        ? { viewingSlot: { ...outcome.projection.request.viewingSlot } }
        : {}),
      proposalExpiresAt: outcome.projection.request.proposalExpiresAt,
    },
    listing: toListing(outcome.projection.listing),
    timeline: outcome.projection.timeline.map(toTimelineEntry),
  };
}

export function toAgentRequestView(
  outcome: ProjectionOutcome<AgentProjection>,
): AgentRequestResponse {
  const request = outcome.projection.request;
  return {
    fixtureGeneration: outcome.state.fixtureGeneration,
    request: toAgentRequest(request),
    listing: toAgentListing(outcome.projection.listing),
    availability: outcome.projection.availability.map(toAvailabilitySlot),
  };
}

export function toAgentQueueView(
  outcome: ProjectionOutcome<AgentProjection | null>,
): AgentQueueResponse {
  const counts = Object.fromEntries(
    WORKFLOW_REQUEST_STATES.map((state) => [state, 0]),
  ) as Record<WorkflowRequestState, number>;
  const request = outcome.projection?.request;
  if (request) {
    counts[request.state] += 1;
  }

  return {
    fixtureGeneration: outcome.state.fixtureGeneration,
    requests: request
      ? [{
          id: request.id,
          listingId: request.listingId,
          state: request.state,
          version: request.version,
        }]
      : [],
    counts,
  };
}

export function toCommandResult(
  result: {
    requestState: WorkflowRequestState;
    requestVersion: number;
    slotId?: string;
    idempotent?: boolean;
  },
): WorkflowCommandResultDto {
  return {
    state: result.requestState,
    version: result.requestVersion,
    ...(result.slotId ? { slotId: result.slotId } : {}),
    ...(result.idempotent ? { idempotent: true } : {}),
  };
}

function toAgentRequest(request: ViewingRequest): AgentRequestResponse["request"] {
  return {
    id: request.id,
    listingId: request.listingId,
    preferredTimes: [...request.preferredTimes],
    tenantNote: request.tenantNote,
    state: request.state,
    version: request.version,
    preparedResponse: request.preparedResponse
      ? toResponse(request.preparedResponse)
      : undefined,
    sentResponse: request.sentResponse
      ? toResponse(request.sentResponse)
      : undefined,
    proposalExpiresAt: request.proposalExpiresAt,
    internalReviewNote: request.internalReviewNote,
  };
}

function toListing(listing: Omit<Listing, "assignedAgentId" | "status">): WorkflowListingDto {
  return {
    id: listing.id,
    version: listing.version,
    title: listing.title,
    address: listing.address,
    area: listing.area,
    monthlyRentGbp: listing.monthlyRentGbp,
    bedrooms: listing.bedrooms,
    sizeSqM: listing.sizeSqM,
    availableFrom: listing.availableFrom,
    description: listing.description,
    imageKey: listing.imageKey,
  };
}

function toAgentListing(listing: Listing): AgentListingDto {
  return {
    ...toListing(listing),
    status: listing.status,
  };
}

function toResponse(response: SentResponse | NonNullable<ViewingRequest["preparedResponse"]>): WorkflowResponseDto {
  if (response.kind === "SLOT_PROPOSAL") {
    return {
      kind: response.kind,
      slotId: response.slotId,
      tenantNote: response.tenantNote,
    };
  }
  return {
    kind: response.kind,
    tenantNote: response.tenantNote,
  };
}

function toAvailabilitySlot(slot: AgentProjection["availability"][number]): WorkflowAvailabilitySlotDto {
  return {
    id: slot.id,
    listingId: slot.listingId,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    status: slot.status,
  };
}

function toTimelineEntry(entry: AuditEntry): WorkflowTimelineEntryDto {
  if (!isTimelineOperation(entry.operation)) {
    throw new WorkflowPersistenceError();
  }
  return {
    sequence: entry.sequence,
    operation: entry.operation,
    fromState: entry.fromState,
    toState: entry.toState,
    requestVersion: entry.requestVersion,
  };
}

function isTimelineOperation(value: string): value is WorkflowTimelineEntryDto["operation"] {
  return (WORKFLOW_TIMELINE_OPERATIONS as readonly string[]).includes(value);
}
