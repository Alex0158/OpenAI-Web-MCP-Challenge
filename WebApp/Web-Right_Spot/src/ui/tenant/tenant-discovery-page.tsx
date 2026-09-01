"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    void readListings(appliedFilters)
      .then((nextData) => {
        if (!active) return;
        setData(nextData);
        setError(null);
      })
      .catch((nextError: unknown) => {
        if (active) setError(nextError);
      })
      .finally(() => {
        if (active) setIsLoading(false);
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
          </div>
          <p className={styles.mutedCopy}>Synthetic listings · GBP · local demo</p>
        </div>

        <form className={styles.filterForm} onSubmit={applyFilters} aria-label="Filter listings">
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
          isLoading={isLoading}
          onRetry={() => setAppliedFilters({ ...appliedFilters })}
        />
      </section>
    </RolePageFrame>
  );
}

type ListingResultsProps = {
  data: TenantListingsResponse | null;
  error: unknown;
  isLoading: boolean;
  onRetry: () => void;
};

function ListingResults({
  data,
  error,
  isLoading,
  onRetry,
}: ListingResultsProps) {
  if (isLoading) {
    return <div className={styles.loadingState} role="status" aria-live="polite" aria-busy="true">Loading available rentals…</div>;
  }
  if (error) {
    return (
      <div className={styles.emptyState} role="alert">
        <h3>Listings could not be loaded</h3>
        <p>{tenantApiErrorMessage(error, "load listings")}</p>
        <button className="button button-quiet" type="button" onClick={onRetry}>Retry</button>
      </div>
    );
  }
  if (!data) return null;
  if (data.listings.length === 0) {
    return (
      <div className={styles.emptyState} role="status">
        <h3>No listings match those filters</h3>
        <p>Try a wider area, rent range, size, or availability date.</p>
      </div>
    );
  }
  return (
    <div className={styles.resultsBlock} aria-live="polite">
      <div className={styles.resultsMeta}>
        <span>{data.listings.length} seeded {data.listings.length === 1 ? "listing" : "listings"}</span>
        <span>Fixture generation {data.fixtureGeneration}</span>
      </div>
      <div className={styles.listingGrid}>
        {data.listings.map((listing) => (
          <article className={styles.listingCard} key={listing.id}>
            <div className={styles.mediaPlaceholder} aria-hidden="true"><span>{listing.imageKey}</span></div>
            <div className={styles.cardBody}>
              <p className="eyebrow">{listing.area}</p>
              <h3>{listing.title}</h3>
              <p className={styles.mutedCopy}>{listing.address}</p>
              <dl className={styles.factGrid}>
                <div><dt>Rent</dt><dd>£{listing.monthlyRentGbp.toLocaleString("en-GB")} / month</dd></div>
                <div><dt>Bedrooms</dt><dd>{listing.bedrooms}</dd></div>
                <div><dt>Size</dt><dd>{listing.sizeSqM} m²</dd></div>
                <div><dt>Available</dt><dd>{formatDate(listing.availableFrom)}</dd></div>
              </dl>
              <a className="button button-primary" href={`/tenant/listings/${encodeURIComponent(listing.id)}`}>View listing</a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}
