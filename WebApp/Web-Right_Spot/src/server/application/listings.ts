import { domainError } from "../domain/errors";
import { toTenantListing } from "../domain/projections";
import {
  MAX_IDENTIFIER_LENGTH,
  MAX_LISTING_AREA_LENGTH,
  MAX_LISTING_SIZE_SQ_M,
  MAX_MONTHLY_RENT_GBP,
} from "../domain/workflow";
import type { Actor, TenantListing, WorkflowState } from "../domain/types";
import {
  normalizeSearchText,
  resolveCanonicalArea,
  type TenantListingHttpFilters,
  type TenantListingsResponse,
} from "../../shared/contracts/listings-api";

const LISTING_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const FILTER_NAMES = new Set(["area", "maxRent", "minSizeSqM", "availableBy", "availableFrom"]);

export type ListingFilters = TenantListingHttpFilters;

export type ListingCollection = TenantListingsResponse;

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

  const publishedListings = state.listings.filter((listing) => listing.status === "PUBLISHED");
  const areaFilter = filters.area === undefined
    ? undefined
    : resolveCanonicalArea(publishedListings, filters.area);
  if (areaFilter === null) {
    throw domainError("VALIDATION_FAILED", "Area filter is outside its bounds");
  }

  const availableBy = getAvailableByFilter(filters);
  const listings = publishedListings
    .filter((listing) => areaFilter === undefined
      || normalizeSearchText(listing.area).toLocaleLowerCase("en-GB")
        === areaFilter.toLocaleLowerCase("en-GB"))
    .filter((listing) => filters.maxRent === undefined
      || listing.monthlyRentGbp <= filters.maxRent)
    .filter((listing) => filters.minSizeSqM === undefined
      || listing.sizeSqM >= filters.minSizeSqM)
    .filter((listing) => availableBy === undefined
      || listing.availableFrom <= availableBy)
    .map(toTenantListing);

  return {
    fixtureGeneration: state.fixtureGeneration,
    appliedFilters: (() => {
      const appliedFilters: ListingCollection["appliedFilters"] = {};
      if (areaFilter !== undefined) appliedFilters.area = areaFilter;
      if (filters.maxRent !== undefined) appliedFilters.maxRent = filters.maxRent;
      if (filters.minSizeSqM !== undefined) appliedFilters.minSizeSqM = filters.minSizeSqM;
      if (availableBy !== undefined) appliedFilters.availableBy = availableBy;
      return appliedFilters;
    })(),
    matchedCount: listings.length,
    listings,
    pagePath: "/tenant",
    pageState: listings.length === 0 ? "empty" : "results",
  };
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
  if (!isRecord(filters) || Object.keys(filters).some((name) => !FILTER_NAMES.has(name))) {
    throw domainError("VALIDATION_FAILED", "Listing filters are invalid");
  }
  if (filters.area !== undefined) {
    const normalizedArea = typeof filters.area === "string" ? filters.area.trim() : "";
    if (
      typeof filters.area !== "string"
      || normalizedArea.length === 0
      || normalizedArea.length > MAX_LISTING_AREA_LENGTH
    ) {
      throw domainError("VALIDATION_FAILED", "Area filter is outside its bounds");
    }
  }
  validateBoundedInteger(filters.maxRent, 1, MAX_MONTHLY_RENT_GBP, "Maximum rent filter");
  validateBoundedInteger(filters.minSizeSqM, 1, MAX_LISTING_SIZE_SQ_M, "Minimum size filter");
  if (filters.availableBy !== undefined && typeof filters.availableBy !== "string") {
    throw domainError("VALIDATION_FAILED", "Available-by filter is invalid");
  }
  if (filters.availableFrom !== undefined && typeof filters.availableFrom !== "string") {
    throw domainError("VALIDATION_FAILED", "Available-from filter is invalid");
  }
  if (filters.availableBy !== undefined && filters.availableFrom !== undefined) {
    throw domainError("VALIDATION_FAILED", "Available-by filter is outside its bounds");
  }
  const availableBy = getAvailableByFilter(filters);
  if (availableBy !== undefined && !isIsoDate(availableBy)) {
    throw domainError("VALIDATION_FAILED", "Available-from filter is invalid");
  }
}

function getAvailableByFilter(filters: ListingFilters): string | undefined {
  return filters.availableBy ?? filters.availableFrom;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
