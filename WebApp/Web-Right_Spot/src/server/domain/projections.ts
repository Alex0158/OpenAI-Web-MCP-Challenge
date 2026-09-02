import { domainError } from "./errors";
import { evaluateExpiry } from "./workflow";
import {
  type Actor,
  type AgentProjection,
  type Listing,
  type ProjectionOutcome,
  type TenantListing,
  type TenantProjection,
  type TenantViewingSlot,
  type WorkflowState,
} from "./types";

export function readTenantProjection(
  state: WorkflowState,
  actor: Actor,
  now: string,
): ProjectionOutcome<TenantProjection> {
  if (actor.role !== "tenant" || actor.id !== state.tenantId) {
    throw domainError("FORBIDDEN", "Actor cannot read the tenant projection");
  }
  const evaluated = evaluateExpiry(state, now);
  const request = evaluated.state.request;
  if (!request || request.tenantId !== actor.id) {
    throw domainError("NOT_FOUND", "Viewing request was not found");
  }
  const listing = getListing(evaluated.state, request.listingId);
  const viewingSlot = request.sentResponse?.kind === "SLOT_PROPOSAL"
    ? toTenantViewingSlot(evaluated.state, request.listingId, request.sentResponse.slotId)
    : undefined;

  return {
    state: evaluated.state,
    projection: {
      request: {
        id: request.id,
        listingId: request.listingId,
        preferredTimes: [...request.preferredTimes],
        tenantNote: request.tenantNote,
        state: request.state,
        version: request.version,
        response: request.sentResponse ? cloneRequest(request.sentResponse) : undefined,
        ...(viewingSlot ? { viewingSlot } : {}),
        proposalExpiresAt: request.proposalExpiresAt,
      },
      listing: toTenantListing(listing),
      timeline: evaluated.state.audit.map((entry) => ({ ...entry })),
    },
  };
}

function toTenantViewingSlot(
  state: WorkflowState,
  listingId: string,
  slotId: string,
): TenantViewingSlot {
  const slot = state.slots.find(
    (candidate) => candidate.id === slotId && candidate.listingId === listingId,
  );
  if (!slot) {
    throw domainError("NOT_FOUND", "Availability slot was not found");
  }
  return {
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
  };
}

export function toTenantListing(listing: Listing): TenantListing {
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

export function readAgentProjection(
  state: WorkflowState,
  actor: Actor,
  now: string,
): ProjectionOutcome<AgentProjection> {
  if (actor.role !== "agent" || actor.id !== state.agentId) {
    throw domainError("FORBIDDEN", "Actor cannot read the agent projection");
  }
  const evaluated = evaluateExpiry(state, now);
  const request = evaluated.state.request;
  if (!request || request.agentId !== actor.id || request.state === "TENANT_DRAFT") {
    throw domainError("NOT_FOUND", "Viewing request was not found");
  }
  const listing = getListing(evaluated.state, request.listingId);

  return {
    state: evaluated.state,
    projection: {
      request: cloneRequest(request),
      listing: { ...listing },
      availability: evaluated.state.slots
        .filter((slot) => slot.listingId === listing.id)
        .map((slot) => ({ ...slot })),
    },
  };
}

function getListing(state: WorkflowState, listingId: string): Listing {
  const listing = state.listings.find((candidate) => candidate.id === listingId);
  if (!listing) {
    throw domainError("NOT_FOUND", "Listing was not found");
  }
  return listing;
}

function cloneRequest<T>(request: T): T {
  return JSON.parse(JSON.stringify(request)) as T;
}
