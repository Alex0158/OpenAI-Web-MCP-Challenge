import type { WorkflowListingDto } from "./workflow-api";

export const FAVOURITE_STATES = ["ACTIVE", "REMOVED"] as const;
export type FavouriteState = (typeof FAVOURITE_STATES)[number];

export const FAVOURITE_LISTING_STATUSES = ["PUBLISHED", "UNPUBLISHED"] as const;
export type FavouriteListingStatus = (typeof FAVOURITE_LISTING_STATUSES)[number];

export type FavouriteListingDto = WorkflowListingDto & {
  status: FavouriteListingStatus;
};

export type TenantFavouriteDto = {
  listingId: string;
  state: "ACTIVE";
  version: number;
  createdAt: string;
  updatedAt: string;
  savedListingVersion: number;
  savedMonthlyRentGbp: number;
  changedSinceSaved: boolean;
  listing: FavouriteListingDto;
};

export type TenantFavouritesResponse = {
  fixtureGeneration: number;
  favourites: TenantFavouriteDto[];
  favouriteVersions: Record<string, number>;
};

export type FavouriteMutationResultDto = {
  state: FavouriteState;
  version: number;
  idempotent?: boolean;
};

export type TenantFavouriteMutationResponse = TenantFavouritesResponse & {
  result: FavouriteMutationResultDto;
};

export type AgentListingInterestDto = {
  listingId: string;
  title: string;
  status: FavouriteListingStatus;
  currentSaves: number;
  availableInterest: number;
};

export type AgentListingInterestResponse = {
  fixtureGeneration: number;
  listings: AgentListingInterestDto[];
};

export type SaveFavouriteBody = {
  commandId: string;
  fixtureGeneration: number;
  listingId: string;
  expectedListingVersion: number;
  expectedFavouriteVersion: number;
};

export type RemoveFavouriteBody = {
  commandId: string;
  fixtureGeneration: number;
  expectedFavouriteVersion: number;
};

export const FAVOURITE_ERROR_CODES = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION_FAILED",
  "STALE_VERSION",
  "FIXTURE_GENERATION_CONFLICT",
  "INVALID_TRANSITION",
  "COMMAND_CONFLICT",
  "PERSISTENCE_ERROR",
] as const;

export type FavouriteErrorCode = (typeof FAVOURITE_ERROR_CODES)[number];

export type FavouriteErrorResponse = {
  error: {
    code: FavouriteErrorCode;
    message: string;
  };
};
