import { domainError } from "./errors";
import { toTenantListing } from "./projections";
import { evaluateExpiry } from "./workflow";
import type {
  Actor,
  Favourite,
  ListingStatus,
  ProjectionOutcome,
  TenantListing,
  WorkflowState,
} from "./types";

export type TenantFavouriteListing = TenantListing & {
  status: ListingStatus;
};

export type TenantFavouriteProjectionItem = {
  listingId: string;
  state: "ACTIVE";
  version: number;
  createdAt: string;
  updatedAt: string;
  savedListingVersion: number;
  savedMonthlyRentGbp: number;
  changedSinceSaved: boolean;
  listing: TenantFavouriteListing;
};

export type TenantFavouritesProjection = {
  favourites: TenantFavouriteProjectionItem[];
  favouriteVersions: Record<string, number>;
};

export type AgentListingInterestProjection = {
  listings: Array<{
    listingId: string;
    title: string;
    status: ListingStatus;
    currentSaves: number;
    availableInterest: number;
  }>;
};

export function readTenantFavourites(
  state: WorkflowState,
  actor: Actor,
  now: string,
): ProjectionOutcome<TenantFavouritesProjection> {
  assertTenant(actor, state);
  const evaluated = evaluateExpiry(state, now);
  const listingOrder = new Map(evaluated.state.listings.map((listing, index) => [listing.id, index]));
  const favourites = evaluated.state.favourites
    .filter((favourite) => favourite.state === "ACTIVE")
    .map((favourite) => toTenantFavourite(favourite, evaluated.state))
    .sort((left, right) => {
      const leftOrder = listingOrder.get(left.listingId) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = listingOrder.get(right.listingId) ?? Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder || left.listingId.localeCompare(right.listingId);
    });
  const favouriteVersions = Object.fromEntries(
    evaluated.state.favourites
      .filter((favourite) => favourite.tenantId === actor.id)
      .map((favourite) => [favourite.listingId, favourite.version]),
  );

  return {
    state: evaluated.state,
    projection: { favourites, favouriteVersions },
  };
}

export function readAgentListingInterest(
  state: WorkflowState,
  actor: Actor,
  now: string,
): ProjectionOutcome<AgentListingInterestProjection> {
  assertAgent(actor, state);
  const evaluated = evaluateExpiry(state, now);
  const activeByListing = new Map<string, number>();
  for (const favourite of evaluated.state.favourites) {
    if (favourite.state === "ACTIVE") {
      activeByListing.set(
        favourite.listingId,
        (activeByListing.get(favourite.listingId) ?? 0) + 1,
      );
    }
  }

  return {
    state: evaluated.state,
    projection: {
      listings: evaluated.state.listings
        .filter((listing) => listing.assignedAgentId === actor.id)
        .map((listing) => {
          const currentSaves = activeByListing.get(listing.id) ?? 0;
          return {
            listingId: listing.id,
            title: listing.title,
            status: listing.status,
            currentSaves,
            availableInterest: listing.status === "PUBLISHED" ? currentSaves : 0,
          };
        }),
    },
  };
}

function toTenantFavourite(
  favourite: Favourite,
  state: WorkflowState,
): TenantFavouriteProjectionItem {
  const listing = state.listings.find((candidate) => candidate.id === favourite.listingId);
  if (!listing) {
    throw domainError("NOT_FOUND", "Favourite listing was not found");
  }

  return {
    listingId: favourite.listingId,
    state: "ACTIVE",
    version: favourite.version,
    createdAt: favourite.createdAt,
    updatedAt: favourite.updatedAt,
    savedListingVersion: favourite.savedListingVersion,
    savedMonthlyRentGbp: favourite.savedMonthlyRentGbp,
    changedSinceSaved: listing.version !== favourite.savedListingVersion
      || listing.monthlyRentGbp !== favourite.savedMonthlyRentGbp,
    listing: {
      ...toTenantListing(listing),
      status: listing.status,
    },
  };
}

function assertTenant(actor: Actor, state: WorkflowState): void {
  if (actor.role !== "tenant" || actor.id !== state.tenantId) {
    throw domainError("FORBIDDEN", "Actor cannot read tenant Favourites");
  }
}

function assertAgent(actor: Actor, state: WorkflowState): void {
  if (actor.role !== "agent" || actor.id !== state.agentId) {
    throw domainError("FORBIDDEN", "Actor cannot read listing interest");
  }
}
