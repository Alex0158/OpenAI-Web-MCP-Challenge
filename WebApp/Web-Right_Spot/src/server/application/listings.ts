import { domainError } from "../domain/errors";
import { toTenantListing } from "../domain/projections";
import {
  MAX_IDENTIFIER_LENGTH,
  MAX_LISTING_AREA_LENGTH,
  MAX_LISTING_SIZE_SQ_M,
  MAX_MONTHLY_RENT_GBP,
} from "../domain/workflow";
import type { Actor, TenantListing, WorkflowState } from "../domain/types";

const LISTING_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type ListingFilters = {
  area?: string;
  maxRent?: number;
  minSizeSqM?: number;
  availableFrom?: string;
};

export type ListingCollection = {
  fixtureGeneration: number;
  listings: TenantListing[];
};

export type ListingDetail = {
  fixtureGeneration: number;
  listing: TenantListing;
};

export function readTenantListings(
  state: WorkflowState,
  actor: Actor,
  filters: ListingFilters = {},
): ListingCollection {
  assertSeededTenant(state, actor);
  validateFilters(filters);

  const area = filters.area?.toLocaleLowerCase("en-GB");
  const listings = state.listings
    .filter((listing) => listing.status === "PUBLISHED")
    .filter((listing) => area === undefined
      || listing.area.toLocaleLowerCase("en-GB") === area)
    .filter((listing) => filters.maxRent === undefined
      || listing.monthlyRentGbp <= filters.maxRent)
    .filter((listing) => filters.minSizeSqM === undefined
      || listing.sizeSqM >= filters.minSizeSqM)
    .filter((listing) => filters.availableFrom === undefined
      || listing.availableFrom <= filters.availableFrom)
    .map(toTenantListing);

  return { fixtureGeneration: state.fixtureGeneration, listings };
}

export function readTenantListing(
  state: WorkflowState,
  actor: Actor,
  listingId: string,
): ListingDetail {
  assertSeededTenant(state, actor);
  validateListingId(listingId);
  const listing = state.listings.find((candidate) =>
    candidate.id === listingId && candidate.status === "PUBLISHED");
  if (!listing) {
    throw domainError("NOT_FOUND", "Listing was not found");
  }

  return {
    fixtureGeneration: state.fixtureGeneration,
    listing: toTenantListing(listing),
  };
}

function assertSeededTenant(state: WorkflowState, actor: Actor): void {
  if (actor.role !== "tenant" || actor.id !== state.tenantId) {
    throw domainError("FORBIDDEN", "Actor cannot read tenant listings");
  }
}

function validateFilters(filters: ListingFilters): void {
  if (filters.area !== undefined) {
    if (
      typeof filters.area !== "string"
      || filters.area.length > MAX_LISTING_AREA_LENGTH
      || filters.area.trim().length === 0
      || filters.area !== filters.area.trim()
    ) {
      throw domainError("VALIDATION_FAILED", "Area filter is outside its bounds");
    }
  }
  validateBoundedInteger(filters.maxRent, 1, MAX_MONTHLY_RENT_GBP, "Maximum rent filter");
  validateBoundedInteger(filters.minSizeSqM, 1, MAX_LISTING_SIZE_SQ_M, "Minimum size filter");
  if (filters.availableFrom !== undefined && !isIsoDate(filters.availableFrom)) {
    throw domainError("VALIDATION_FAILED", "Available-from filter is invalid");
  }
}

function validateListingId(listingId: string): void {
  if (
    typeof listingId !== "string"
    || listingId.length < 1
    || listingId.length > MAX_IDENTIFIER_LENGTH
    || !LISTING_ID_PATTERN.test(listingId)
  ) {
    throw domainError("VALIDATION_FAILED", "Listing identifier is outside its bounds");
  }
}

function validateBoundedInteger(
  value: number | undefined,
  min: number,
  max: number,
  label: string,
): void {
  if (value !== undefined && (!Number.isInteger(value) || value < min || value > max)) {
    throw domainError("VALIDATION_FAILED", `${label} is outside its bounds`);
  }
}

function isIsoDate(value: string): boolean {
  const parsed = Date.parse(`${value}T00:00:00.000Z`);
  return ISO_DATE_PATTERN.test(value)
    && Number.isFinite(parsed)
    && new Date(parsed).toISOString().slice(0, 10) === value;
}
