import { domainError } from "./errors";
import {
  REQUEST_STATES,
  type Actor,
  type ListingStatus,
  type RequestState,
  type SlotStatus,
  type WorkflowState,
} from "./types";

export type AgentOperationsProjectionV1 = {
  listings: {
    counts: Record<ListingStatus, number>;
    rows: Array<{
      id: string;
      version: number;
      status: ListingStatus;
      title: string;
      address: string;
      area: string;
      monthlyRentGbp: number;
      bedrooms: number;
      sizeSqM: number;
      availableFrom: string;
    }>;
  };
  viewingRequests: {
    counts: Record<RequestState, number>;
    references: Array<{
      id: string;
      listingId: string;
      listingTitle?: string;
      state: RequestState;
      version: number;
    }>;
  };
  upcomingSlots: Array<{
    id: string;
    listingId: string;
    listingTitle?: string;
    requestId?: string;
    startsAt: string;
    endsAt: string;
    status: Extract<SlotStatus, "HELD_FOR_PROPOSAL" | "CONFIRMED">;
  }>;
};

const INCLUDED_SLOT_STATUSES: ReadonlySet<SlotStatus> = new Set([
  "HELD_FOR_PROPOSAL",
  "CONFIRMED",
]);

export function projectAgentOperations(
  state: WorkflowState,
  actor: Actor,
  now: string,
): AgentOperationsProjectionV1 {
  if (actor.role !== "agent" || actor.id !== state.agentId) {
    throw domainError("FORBIDDEN", "Actor cannot read the Operations projection");
  }

  const nowTimestamp = Date.parse(now);
  if (!Number.isFinite(nowTimestamp)) {
    throw domainError("VALIDATION_FAILED", "Operations projection time must be an ISO timestamp");
  }

  const listingCounts: Record<ListingStatus, number> = {
    PUBLISHED: 0,
    UNPUBLISHED: 0,
  };
  const listingTitles = new Map<string, string>();

  const listingRows = state.listings
    .map((listing) => {
      listingCounts[listing.status] += 1;
      listingTitles.set(listing.id, listing.title);
      return {
        id: listing.id,
        version: listing.version,
        status: listing.status,
        title: listing.title,
        address: listing.address,
        area: listing.area,
        monthlyRentGbp: listing.monthlyRentGbp,
        bedrooms: listing.bedrooms,
        sizeSqM: listing.sizeSqM,
        availableFrom: listing.availableFrom,
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));

  const requestCounts = emptyRequestCounts();
  const request = state.request;
  const requestReferences = request
    ? [
        {
          id: request.id,
          listingId: request.listingId,
          ...withListingTitle(listingTitles.get(request.listingId)),
          state: request.state,
          version: request.version,
        },
      ]
    : [];
  if (request) {
    requestCounts[request.state] = 1;
  }

  const upcomingSlots = state.slots
    .filter(
      (slot): slot is typeof slot & {
        status: Extract<SlotStatus, "HELD_FOR_PROPOSAL" | "CONFIRMED">;
      } => INCLUDED_SLOT_STATUSES.has(slot.status) && Date.parse(slot.startsAt) >= nowTimestamp,
    )
    .map((slot) => ({
      id: slot.id,
      listingId: slot.listingId,
      ...withListingTitle(listingTitles.get(slot.listingId)),
      ...(request && slot.heldByRequestId === request.id
        ? { requestId: request.id }
        : {}),
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      status: slot.status,
    }))
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt) || left.id.localeCompare(right.id));

  return {
    listings: {
      counts: listingCounts,
      rows: listingRows,
    },
    viewingRequests: {
      counts: requestCounts,
      references: requestReferences,
    },
    upcomingSlots,
  };
}

function emptyRequestCounts(): Record<RequestState, number> {
  return Object.fromEntries(REQUEST_STATES.map((state) => [state, 0])) as Record<
    RequestState,
    number
  >;
}

function withListingTitle(listingTitle: string | undefined): { listingTitle?: string } {
  return listingTitle ? { listingTitle } : {};
}
