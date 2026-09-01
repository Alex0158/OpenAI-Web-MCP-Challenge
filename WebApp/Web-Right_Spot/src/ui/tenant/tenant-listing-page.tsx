"use client";

import { useEffect, useState } from "react";
import RolePageFrame from "../shared/role-page-frame";
import {
  readListing,
  readTenantRequest,
  tenantApiErrorMessage,
  type TenantListingResponse,
} from "./tenant-api";
import { TenantRequestEditor } from "./tenant-request-page";
import styles from "./tenant.module.css";
import type { TenantRequestResponse } from "../../shared/contracts/workflow-api";

export default function TenantListingPage({ listingId }: { listingId: string }) {
  const [listingData, setListingData] = useState<TenantListingResponse | null>(null);
  const [requestData, setRequestData] = useState<TenantRequestResponse | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);

  function load() {
    setIsLoading(true);
    setError(null);
    void Promise.all([readListing(listingId), readTenantRequest()])
      .then(([nextListing, nextRequest]) => {
        setListingData(nextListing);
        setRequestData(nextRequest);
      })
      .catch(setError)
      .finally(() => setIsLoading(false));
  }

  useEffect(() => { load(); }, [listingId]);

  return (
    <RolePageFrame
      requiredRole="tenant"
      currentPath={`/tenant/listings/${listingId}`}
      title="Read the details before you request a viewing."
      eyebrow="Listing detail"
      description="The facts below come from the tenant listing service. A request is saved separately and only submitted through an explicit action."
    >
      {isLoading ? <div className={styles.loadingState} role="status" aria-busy="true">Loading listing and request context…</div> : null}
      {!isLoading && error ? (
        <div className={styles.emptyState} role="alert">
          <h2>Listing details are unavailable</h2>
          <p>{tenantApiErrorMessage(error, "load this listing")}</p>
          <button className="button button-quiet" type="button" onClick={load}>Retry</button>
        </div>
      ) : null}
      {!isLoading && !error && listingData && requestData ? (
        <ListingDetailContent
          listingData={listingData}
          requestData={requestData}
          onRequestData={setRequestData}
        />
      ) : null}
    </RolePageFrame>
  );
}

function ListingDetailContent({
  listingData,
  requestData,
  onRequestData,
}: {
  listingData: TenantListingResponse;
  requestData: TenantRequestResponse;
  onRequestData: (data: TenantRequestResponse) => void;
}) {
  const listing = listingData.listing;
  const request = requestData.request;
  const requestTargetsAnotherListing = request !== null && request.listingId !== listing.id;
  const canEditDraft = request === null || (request.listingId === listing.id && request.state === "TENANT_DRAFT");

  return (
    <div className={styles.detailLayout}>
      <section className={styles.detailCard} aria-labelledby="listing-facts-title">
        <div className={styles.mediaPlaceholderLarge} aria-label={`Local placeholder for seeded image key ${listing.imageKey}`}>
          <span>{listing.imageKey}</span>
        </div>
        <div className={styles.detailCopy}>
          <p className="eyebrow">{listing.area}</p>
          <h2 id="listing-facts-title">{listing.title}</h2>
          <p className={styles.lede}>{listing.description}</p>
          <p className={styles.mutedCopy}>{listing.address}</p>
          <dl className={styles.detailFacts}>
            <div><dt>Monthly rent</dt><dd>£{listing.monthlyRentGbp.toLocaleString("en-GB")}</dd></div>
            <div><dt>Bedrooms</dt><dd>{listing.bedrooms}</dd></div>
            <div><dt>Size</dt><dd>{listing.sizeSqM} m²</dd></div>
            <div><dt>Available from</dt><dd>{formatDate(listing.availableFrom)}</dd></div>
            <div><dt>Listing version</dt><dd>{listing.version}</dd></div>
          </dl>
          <p className={styles.technicalNote}>Fixture generation {listingData.fixtureGeneration} · image key is a local opaque seed</p>
        </div>
      </section>

      {requestTargetsAnotherListing ? (
        <section className={styles.noticeCard} aria-labelledby="existing-request-title">
          <p className="eyebrow">One request per fixture</p>
          <h2 id="existing-request-title">Your active request is for another listing</h2>
          <p>You cannot create a second Viewing Request in this demo fixture. Open the request dashboard to see and manage the existing one.</p>
          <a className="button button-primary" href="/tenant/requests">Open request dashboard</a>
        </section>
      ) : canEditDraft ? (
        <TenantRequestEditor
          key={`${request?.id ?? "new"}-${request?.version ?? 0}`}
          listing={listing}
          fixtureGeneration={requestData.fixtureGeneration}
          request={request}
          onSaved={onRequestData}
        />
      ) : (
        <section className={styles.noticeCard} aria-labelledby="request-already-sent-title">
          <p className="eyebrow">Viewing Request</p>
          <h2 id="request-already-sent-title">This listing already has a {formatState(request?.state)} request</h2>
          <p>The submitted request is read-only from this listing page. Continue from the tenant request dashboard for the current response.</p>
          <a className="button button-primary" href="/tenant/requests">Open request dashboard</a>
        </section>
      )}
    </div>
  );
}

function formatState(state: string | undefined): string {
  return state ? state.toLowerCase().replaceAll("_", " ") : "current";
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}
