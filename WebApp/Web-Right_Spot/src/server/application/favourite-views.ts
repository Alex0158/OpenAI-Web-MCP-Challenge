import type {
  AgentListingInterestResponse,
  TenantFavouriteMutationResponse,
  TenantFavouritesResponse,
} from "../../shared/contracts/favourites-api";
import type {
  AgentListingInterestProjection,
  TenantFavouritesProjection,
} from "../domain/favourite-projections";
import type { FavouriteCommandResult, ProjectionOutcome } from "../domain/types";

export function toTenantFavouritesView(
  outcome: ProjectionOutcome<TenantFavouritesProjection>,
): TenantFavouritesResponse {
  return {
    fixtureGeneration: outcome.state.fixtureGeneration,
    favourites: outcome.projection.favourites.map((favourite) => ({
      listingId: favourite.listingId,
      state: favourite.state,
      version: favourite.version,
      createdAt: favourite.createdAt,
      updatedAt: favourite.updatedAt,
      savedListingVersion: favourite.savedListingVersion,
      savedMonthlyRentGbp: favourite.savedMonthlyRentGbp,
      changedSinceSaved: favourite.changedSinceSaved,
      listing: { ...favourite.listing },
    })),
  };
}

export function toTenantFavouriteMutationView(
  outcome: ProjectionOutcome<TenantFavouritesProjection>,
  result: FavouriteCommandResult,
): TenantFavouriteMutationResponse {
  return {
    ...toTenantFavouritesView(outcome),
    result: {
      state: result.favouriteState,
      version: result.favouriteVersion,
      ...(result.idempotent ? { idempotent: true } : {}),
    },
  };
}

export function toAgentListingInterestView(
  outcome: ProjectionOutcome<AgentListingInterestProjection>,
): AgentListingInterestResponse {
  return {
    fixtureGeneration: outcome.state.fixtureGeneration,
    listings: outcome.projection.listings.map((listing) => ({ ...listing })),
  };
}
