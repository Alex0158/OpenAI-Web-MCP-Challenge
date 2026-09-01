"use client";

import { useEffect, useRef, useState } from "react";
import RolePageFrame from "../shared/role-page-frame";
import {
  readListings,
  TenantApiError,
  tenantApiErrorMessage,
  type TenantListingFilters,
  type TenantListingsResponse,
} from "./tenant-api";
import styles from "./tenant.module.css";

type FilterForm = {
  area: string;
  maxRent: string;
  minSizeSqM: string;
  availableFrom: string;
};

const EMPTY_FILTERS: FilterForm = { area: "", maxRent: "", minSizeSqM: "", availableFrom: "" };

export default function TenantDiscoveryPage() {
  const [filters, setFilters] = useState<FilterForm>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<TenantListingFilters>({});
  const [data, setData] = useState<TenantListingsResponse | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const latestRequestId = useRef(0);

  useEffect(() => {
    const requestId = ++latestRequestId.current;
    let active = true;
    setIsLoading(true);
    void readListings(appliedFilters)
      .then((nextData) => {
        if (!active || requestId !== latestRequestId.current) return;
        setData(nextData);
        setError(null);
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
    if (filters.area.trim()) nextFilters.area = filters.area.trim();
    if (filters.maxRent) {
      const value = Number(filters.maxRent);
      if (!Number.isSafeInteger(value) || value < 1) {
        setError(new Error("Enter a whole-number maximum rent above zero."));
        return;
      }
      nextFilters.maxRent = value;
    }
    if (filters.minSizeSqM) {
      const value = Number(filters.minSizeSqM);
      if (!Number.isSafeInteger(value) || value < 1) {
        setError(new Error("Enter a whole-number minimum size above zero."));
        return;
      }
      nextFilters.minSizeSqM = value;
    }
    if (filters.availableFrom) nextFilters.availableFrom = filters.availableFrom;
    setError(null);
    setAppliedFilters(nextFilters);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setError(null);
    setAppliedFilters({});
  }

  const hasAppliedFilters = Object.keys(appliedFilters).length > 0;

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
            <p>All fields are optional. Apply the combination that matters for this move.</p>
          </div>
          <div className={styles.filterGrid}>
            <label>
              Area
              <input
                value={filters.area}
                onChange={(event) => setFilters({ ...filters, area: event.target.value })}
                placeholder="e.g. Shoreditch"
              />
            </label>
            <label>
              Maximum rent (GBP)
              <input
                inputMode="numeric"
                type="number"
                min="1"
                value={filters.maxRent}
                onChange={(event) => setFilters({ ...filters, maxRent: event.target.value })}
              />
            </label>
            <label>
              Minimum size (m²)
              <input
                inputMode="numeric"
                type="number"
                min="1"
                value={filters.minSizeSqM}
                onChange={(event) => setFilters({ ...filters, minSizeSqM: event.target.value })}
              />
            </label>
            <label>
              Available by
              <input
                type="date"
                value={filters.availableFrom}
                onChange={(event) => setFilters({ ...filters, availableFrom: event.target.value })}
              />
            </label>
          </div>
          <div className={styles.formActions}>
            <button className="button button-primary" type="submit">Apply filters</button>
            <button className="button button-quiet" type="button" onClick={clearFilters}>Clear</button>
          </div>
        </form>

        {error && !(error instanceof Error && error.message.startsWith("Could not")) ? (
          <div className={styles.inlineError} role="alert">{error instanceof Error ? error.message : "Filters are invalid."}</div>
        ) : null}

        <ListingResults
          data={data}
          error={error instanceof TenantApiError ? error : null}
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
  hasAppliedFilters: boolean;
  isLoading: boolean;
  onClear: () => void;
  onRetry: () => void;
};

function ListingResults({
  data,
  error,
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
  if (data.listings.length === 0) {
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
          <span className={styles.resultCount}>{data.listings.length}</span>
          <span>available seeded {data.listings.length === 1 ? "home" : "homes"}</span>
        </div>
        <span>{hasAppliedFilters ? "Filtered shortlist" : "Full local catalogue"}</span>
      </div>
      <div className={styles.listingGrid}>
        {data.listings.map((listing, index) => (
          <article className={styles.listingCard} key={listing.id}>
            <div className={styles.mediaPlaceholder} aria-hidden="true">
              <span className={styles.mediaKicker}>Seeded rental</span>
              <strong>{listing.area}</strong>
              <span className={styles.mediaIndex}>{String(index + 1).padStart(2, "0")}</span>
            </div>
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
              <a className="button button-primary" href={`/tenant/listings/${encodeURIComponent(listing.id)}`}>View full listing</a>
            </div>
          </article>
        ))}
      </div>
      <details className={styles.technicalDisclosure}>
        <summary>Demo record details</summary>
        <p>Fixture generation {data.fixtureGeneration}. Listing media remains a local seeded placeholder.</p>
      </details>
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}
