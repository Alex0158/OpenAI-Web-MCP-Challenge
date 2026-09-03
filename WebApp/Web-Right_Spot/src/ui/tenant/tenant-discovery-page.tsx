"use client";

import { useEffect, useRef, useState } from "react";
import RolePageFrame from "../shared/role-page-frame";
import ListingMedia from "../shared/listing-media";
import {
  readListings,
  TenantApiError,
  tenantApiErrorMessage,
  type TenantListingFilters,
  type TenantListingsResponse,
} from "./tenant-api";
import {
  resolveCanonicalArea,
  suggestCanonicalAreas,
} from "../../shared/contracts/listings-api";
import {
  FavouriteFeedback,
  FavouriteToggle,
  useTenantFavourites,
  type TenantFavouritesController,
} from "./tenant-favourites-page";
import styles from "./tenant.module.css";

type FilterForm = {
  area: string;
  maxRent: string;
  minSizeSqM: string;
  availableBy: string;
};

const EMPTY_FILTERS: FilterForm = { area: "", maxRent: "", minSizeSqM: "", availableBy: "" };

export default function TenantDiscoveryPage() {
  const [filters, setFilters] = useState<FilterForm>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<TenantListingFilters>({});
  const [data, setData] = useState<TenantListingsResponse | null>(null);
  const [catalogueListings, setCatalogueListings] = useState<TenantListingsResponse["listings"] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const latestRequestId = useRef(0);
  const favourites = useTenantFavourites();

  useEffect(() => {
    const requestId = ++latestRequestId.current;
    let active = true;
    setIsLoading(true);
    void readListings(appliedFilters)
      .then((nextData) => {
        if (!active || requestId !== latestRequestId.current) return;
        setData(nextData);
        setError(null);
        if (Object.keys(appliedFilters).length === 0) {
          setCatalogueListings(nextData.listings);
        }
      })
      .catch((nextError: unknown) => {
        if (active && requestId === latestRequestId.current) setError(nextError);
      })
      .finally(() => {
        if (active && requestId === latestRequestId.current) setIsLoading(false);
      });
    return () => { active = false; };
  }, [appliedFilters]);

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFilters: TenantListingFilters = {};
    const trimmedArea = filters.area.trim();
    if (trimmedArea) {
      if (!catalogueListings) {
        setError(null);
        setFilterError("Area suggestions are still loading. Try again once the catalogue appears.");
        return;
      }
      const canonicalArea = resolveCanonicalArea(catalogueListings, trimmedArea);
      if (canonicalArea === null) {
        const suggestions = suggestCanonicalAreas(catalogueListings, trimmedArea);
        setError(null);
        setFilterError(
          suggestions.length > 0
            ? "Select one of the suggested areas before applying."
            : "Choose one of the published areas before applying.",
        );
        return;
      }
      nextFilters.area = canonicalArea;
    }
    if (filters.maxRent) {
      const value = Number(filters.maxRent);
      if (!Number.isSafeInteger(value) || value < 1) {
        setError(null);
        setFilterError("Enter a whole-number maximum rent above zero.");
        return;
      }
      nextFilters.maxRent = value;
    }
    if (filters.minSizeSqM) {
      const value = Number(filters.minSizeSqM);
      if (!Number.isSafeInteger(value) || value < 1) {
        setError(null);
        setFilterError("Enter a whole-number minimum size above zero.");
        return;
      }
      nextFilters.minSizeSqM = value;
    }
    if (filters.availableBy) nextFilters.availableBy = filters.availableBy;
    setError(null);
    setFilterError(null);
    setFilters((current) => ({
      ...current,
      area: nextFilters.area ?? trimmedArea,
      maxRent: filters.maxRent,
      minSizeSqM: filters.minSizeSqM,
      availableBy: filters.availableBy,
    }));
    setAppliedFilters(nextFilters);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setError(null);
    setFilterError(null);
    setAppliedFilters({});
  }

  const hasAppliedFilters = Object.keys(appliedFilters).length > 0;
  const areaSuggestions = catalogueListings
    ? suggestCanonicalAreas(catalogueListings, filters.area)
    : [];

  return (
    <RolePageFrame
      requiredRole="tenant"
      currentPath="/tenant"
      title="Find a place that fits the next step."
      eyebrow="Tenant marketplace"
      description="Browse the seeded rental catalogue, inspect one listing, and keep one viewing request moving with the property agent."
    >
      <section className={styles.pageSection} aria-labelledby="listing-search-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className="eyebrow">Discovery</p>
            <h2 id="listing-search-title">A small, focused catalogue</h2>
            <p className={styles.sectionIntro}>Compare the practical facts first, then open one home to prepare a viewing request.</p>
          </div>
          <p className={styles.catalogueNote}>Seeded London rentals <span aria-hidden="true">·</span> GBP</p>
        </div>

        <form className={styles.filterForm} onSubmit={applyFilters} aria-label="Filter listings">
          <div className={styles.filterHeading}>
            <div>
              <p className="eyebrow">Search criteria</p>
              <h3>Narrow the shortlist</h3>
            </div>
            <p>All fields are optional. Pick a published area or type an exact canonical value, then apply the combination that matters for this move.</p>
          </div>
          <div className={styles.filterGrid}>
            <div className={styles.areaField}>
              <label htmlFor="tenant-area-filter">Area</label>
              <input
                id="tenant-area-filter"
                value={filters.area}
                onChange={(event) => {
                  setFilterError(null);
                  setFilters({ ...filters, area: event.target.value });
                }}
                placeholder="Start with a published area"
                aria-describedby="tenant-area-help"
              />
              <p id="tenant-area-help" className={styles.areaHint}>
                {catalogueListings
                  ? "Published canonical areas from the current tenant-safe catalogue."
                  : "Loading published areas from the current tenant-safe catalogue."}
              </p>
              {catalogueListings && areaSuggestions.length > 0 ? (
                <div className={styles.areaSuggestions} aria-label="Published area suggestions">
                  {areaSuggestions.map((area) => (
                    <button
                      key={area}
                      type="button"
                      className={styles.areaSuggestion}
                      onClick={() => {
                        setFilters((current) => ({ ...current, area }));
                        setFilterError(null);
                      }}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <label>
              Maximum rent (GBP)
              <input
                inputMode="numeric"
                type="number"
                min="1"
                value={filters.maxRent}
                onChange={(event) => {
                  setFilterError(null);
                  setFilters({ ...filters, maxRent: event.target.value });
                }}
              />
            </label>
            <label>
              Minimum size (m²)
              <input
                inputMode="numeric"
                type="number"
                min="1"
                value={filters.minSizeSqM}
                onChange={(event) => {
                  setFilterError(null);
                  setFilters({ ...filters, minSizeSqM: event.target.value });
                }}
              />
            </label>
            <label>
              Available by
              <input
                type="date"
                value={filters.availableBy}
                onChange={(event) => {
                  setFilterError(null);
                  setFilters({ ...filters, availableBy: event.target.value });
                }}
              />
            </label>
          </div>
          <div className={styles.formActions}>
            <button className="button button-primary" type="submit">Apply filters</button>
            <button className="button button-quiet" type="button" onClick={clearFilters}>Clear</button>
          </div>
        </form>

        {filterError ? (
          <div className={styles.inlineError} role="alert">{filterError}</div>
        ) : null}

        <FavouriteFeedback controller={favourites} />

        <ListingResults
          data={data}
          error={error instanceof TenantApiError ? error : null}
          favourites={favourites}
          hasAppliedFilters={hasAppliedFilters}
          isLoading={isLoading}
          onClear={clearFilters}
          onRetry={() => setAppliedFilters({ ...appliedFilters })}
        />
      </section>
    </RolePageFrame>
  );
}

type ListingResultsProps = {
  data: TenantListingsResponse | null;
  error: unknown;
  favourites: TenantFavouritesController;
  hasAppliedFilters: boolean;
  isLoading: boolean;
  onClear: () => void;
  onRetry: () => void;
};

function ListingResults({
  data,
  error,
  favourites,
  hasAppliedFilters,
  isLoading,
  onClear,
  onRetry,
}: ListingResultsProps) {
  if (isLoading) {
    return (
      <div className={`${styles.feedbackState} ${styles.loadingState}`} role="status" aria-live="polite" aria-busy="true">
        <span className={styles.feedbackMarker} aria-hidden="true" />
        <div>
          <h3>Checking the current catalogue</h3>
          <p>RightSpot is loading the available seeded rentals for this search.</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={`${styles.feedbackState} ${styles.errorState}`} role="alert">
        <span className={styles.feedbackMarker} aria-hidden="true" />
        <div>
          <h3>Listings could not be loaded</h3>
          <p>{tenantApiErrorMessage(error, "load listings")}</p>
          <button className="button button-quiet" type="button" onClick={onRetry}>Retry catalogue</button>
        </div>
      </div>
    );
  }
  if (!data) return null;
  if (data.pageState === "empty") {
    return (
      <section className={styles.feedbackState} aria-labelledby="no-listings-title" aria-live="polite">
        <span className={styles.feedbackMarker} aria-hidden="true" />
        <div>
          <h3 id="no-listings-title">No listings match those filters</h3>
          <p>Try a wider area, rent range, size, or availability date.</p>
          <button className="button button-quiet" type="button" onClick={onClear}>Clear filters</button>
        </div>
      </section>
    );
  }
  return (
    <div className={styles.resultsBlock} aria-live="polite">
      <div className={styles.resultsMeta}>
        <div>
          <span className={styles.resultCount}>{data.matchedCount}</span>
          <span>available seeded {data.matchedCount === 1 ? "home" : "homes"}</span>
        </div>
        <span>{hasAppliedFilters ? `Filtered shortlist · ${data.pagePath}` : `Full local catalogue · ${data.pagePath}`}</span>
      </div>
      <div className={styles.listingGrid}>
        {data.listings.map((listing) => (
          <article className={styles.listingCard} key={listing.id}>
            <ListingMedia listingId={listing.id} imageKey={listing.imageKey} variant="card" />
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <div>
                  <p className="eyebrow">{listing.area}</p>
                  <h3>{listing.title}</h3>
                </div>
                <p className={styles.cardPrice}>
                  <strong>£{listing.monthlyRentGbp.toLocaleString("en-GB")}</strong>
                  <span>per month</span>
                </p>
              </div>
              <p className={styles.address}>{listing.address}</p>
              <dl className={styles.factGrid}>
                <div><dt>Bedrooms</dt><dd>{listing.bedrooms}</dd></div>
                <div><dt>Size</dt><dd>{listing.sizeSqM} m²</dd></div>
                <div><dt>Available</dt><dd>{formatDate(listing.availableFrom)}</dd></div>
              </dl>
              <div className={styles.cardActions}>
                <a className="button button-primary" href={`/tenant/listings/${encodeURIComponent(listing.id)}`}>View full listing</a>
                <FavouriteToggle controller={favourites} listing={listing} />
              </div>
            </div>
          </article>
        ))}
      </div>
      <details className={styles.technicalDisclosure}>
        <summary>Demo record details</summary>
        <p>Fixture generation {data.fixtureGeneration}. {data.matchedCount} matched results on {data.pagePath}. Listing media remains a local seeded placeholder.</p>
      </details>
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}
