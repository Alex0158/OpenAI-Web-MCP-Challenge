"use client";

import { useEffect, useState } from "react";
import RolePageFrame from "../shared/role-page-frame";
import ListingMedia from "../shared/listing-media";
import {
  readListing,
  readTenantRequest,
  tenantApiErrorMessage,
  type TenantListingResponse,
} from "./tenant-api";
import { TenantRequestEditor, type TenantRequestConflictNotice } from "./tenant-request-page";
import {
  FavouriteFeedback,
  FavouriteToggle,
  useTenantFavourites,
  type TenantFavouritesController,
} from "./tenant-favourites-page";
import styles from "./tenant.module.css";
import type { TenantRequestDto, TenantRequestResponse } from "../../shared/contracts/workflow-api";

export default function TenantListingPage({ listingId }: { listingId: string }) {
  const [listingData, setListingData] = useState<TenantListingResponse | null>(null);
  const [requestData, setRequestData] = useState<TenantRequestResponse | null>(null);
  const [requestNotice, setRequestNotice] = useState<TenantRequestConflictNotice | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const favourites = useTenantFavourites();

  function applyRequestData(nextData: TenantRequestResponse) {
    setRequestData(nextData);
    setRequestNotice(null);
  }

  function load() {
    setIsLoading(true);
    setError(null);
    setRequestNotice(null);
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
      <FavouriteFeedback controller={favourites} />
      {requestNotice ? (
        <div
          className={requestNotice.tone === "error" ? styles.inlineError : styles.inlineStatus}
          role={requestNotice.tone === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {requestNotice.message}
        </div>
      ) : null}
      {isLoading ? (
        <div className={`${styles.feedbackState} ${styles.loadingState}`} role="status" aria-live="polite" aria-busy="true">
          <span className={styles.feedbackMarker} aria-hidden="true" />
          <div>
            <h2>Preparing the listing</h2>
            <p>RightSpot is loading the property facts and your current request context together.</p>
          </div>
        </div>
      ) : null}
      {!isLoading && error ? (
        <div className={`${styles.feedbackState} ${styles.errorState}`} role="alert">
          <span className={styles.feedbackMarker} aria-hidden="true" />
          <div>
            <h2>Listing details are unavailable</h2>
            <p>{tenantApiErrorMessage(error, "load this listing")}</p>
            <button className="button button-quiet" type="button" onClick={load}>Retry listing</button>
          </div>
        </div>
      ) : null}
      {!isLoading && !error && listingData && requestData ? (
        <ListingDetailContent
          listingData={listingData}
          requestData={requestData}
          favourites={favourites}
          onRequestData={applyRequestData}
          onConflictNotice={setRequestNotice}
        />
      ) : null}
    </RolePageFrame>
  );
}

function ListingDetailContent({
  listingData,
  requestData,
  favourites,
  onRequestData,
  onConflictNotice,
}: {
  listingData: TenantListingResponse;
  requestData: TenantRequestResponse;
  favourites: TenantFavouritesController;
  onRequestData: (data: TenantRequestResponse) => void;
  onConflictNotice: (notice: TenantRequestConflictNotice) => void;
}) {
  const listing = listingData.listing;
  const request = requestData.request;
  const requestTargetsAnotherListing = request !== null && request.listingId !== listing.id;
  const canEditDraft = request === null || (request.listingId === listing.id && request.state === "TENANT_DRAFT");
  const requestState = request?.state;
  const existingRequestNotice = !requestTargetsAnotherListing && requestState && requestState !== "TENANT_DRAFT"
    ? requestNoticeForState(requestState)
    : null;

  return (
    <div className={styles.detailLayout}>
      <section className={styles.detailCard} aria-labelledby="listing-facts-title">
        <ListingMedia listingId={listing.id} imageKey={listing.imageKey} variant="detail" />
        <div className={styles.detailCopy}>
          <div className={styles.detailHeading}>
            <div>
              <p className="eyebrow">{listing.area}</p>
              <h2 id="listing-facts-title">{listing.title}</h2>
              <p className={styles.address}>{listing.address}</p>
            </div>
            <div className={styles.detailAside}>
              <p className={styles.detailPrice}>
                <strong>£{listing.monthlyRentGbp.toLocaleString("en-GB")}</strong>
                <span>per month</span>
              </p>
              <FavouriteToggle controller={favourites} listing={listing} />
            </div>
          </div>
          <p className={styles.lede}>{listing.description}</p>
          <div className={styles.availabilityStrip}>
            <span>Available from</span>
            <strong>{formatDate(listing.availableFrom)}</strong>
          </div>
          <dl className={styles.detailFacts}>
            <div><dt>Bedrooms</dt><dd>{listing.bedrooms}</dd></div>
            <div><dt>Size</dt><dd>{listing.sizeSqM} m²</dd></div>
          </dl>
          <details className={styles.technicalDisclosure}>
            <summary>Demo record details</summary>
            <dl className={styles.technicalFacts}>
              <div><dt>Listing version</dt><dd>{listing.version}</dd></div>
              <div><dt>Fixture generation</dt><dd>{listingData.fixtureGeneration}</dd></div>
              <div><dt>Local image key</dt><dd>{listing.imageKey}</dd></div>
            </dl>
          </details>
        </div>
      </section>

      {requestTargetsAnotherListing ? (
        <section className={styles.noticeCard} aria-labelledby="existing-request-title">
          <div className={styles.noticeHeading}>
            <span aria-hidden="true">01</span>
            <div>
              <p className="eyebrow">Current request</p>
              <h2 id="existing-request-title">Your active request is for another listing</h2>
            </div>
          </div>
          <p className={styles.noticeCopy}>This bounded demo keeps one Viewing Request in play. Open the request dashboard to review the existing home and its latest status.</p>
          <a className="button button-primary" href="/tenant/requests">Open request dashboard</a>
        </section>
      ) : canEditDraft ? (
        <TenantRequestEditor
          key={`${request?.id ?? "new"}-${request?.version ?? 0}`}
          listing={listing}
          fixtureGeneration={requestData.fixtureGeneration}
          request={request}
          onSaved={onRequestData}
          onConflictNotice={onConflictNotice}
        />
      ) : existingRequestNotice ? (
        <section className={styles.noticeCard} aria-labelledby="request-already-sent-title">
          <div className={styles.noticeHeading}>
            <span aria-hidden="true">01</span>
            <div>
              <p className="eyebrow">Viewing Request</p>
              <h2 id="request-already-sent-title">{existingRequestNotice.heading}</h2>
            </div>
          </div>
          <p className={styles.noticeCopy}>{existingRequestNotice.copy}</p>
          <a className="button button-primary" href="/tenant/requests">Open request dashboard</a>
        </section>
      ) : null}
    </div>
  );
}

type ExistingRequestState = Exclude<TenantRequestDto["state"], "TENANT_DRAFT">;

type RequestNotice = {
  heading: string;
  copy: string;
};

function requestNoticeForState(state: ExistingRequestState): RequestNotice {
  switch (state) {
    case "REQUEST_SUBMITTED":
      return {
        heading: "Viewing Request already submitted",
        copy: "The request has been sent to the property agent. Open the request dashboard to follow its status.",
      };
    case "AGENT_REVIEWING":
      return {
        heading: "Viewing Request is under review",
        copy: "The property agent is reviewing this request. Open the request dashboard for the latest status.",
      };
    case "SLOT_PROPOSED":
      return {
        heading: "Viewing Request has a proposed viewing",
        copy: "Review the proposed time and make your decision from the request dashboard.",
      };
    case "VIEWING_CONFIRMED":
      return {
        heading: "Viewing Request is confirmed",
        copy: "The proposed viewing is confirmed. Open the request dashboard to review the completed request.",
      };
    case "TENANT_DECLINED":
      return {
        heading: "Viewing Request was declined by you",
        copy: "You declined the proposed viewing. Open the request dashboard to review the completed request.",
      };
    case "AGENT_DECLINED":
      return {
        heading: "Viewing Request was declined by the agent",
        copy: "The property agent declined this request. Open the request dashboard to review the response.",
      };
    case "EXPIRED":
      return {
        heading: "Viewing Request has expired",
        copy: "The proposal deadline passed before a tenant decision. Open the request dashboard to review the completed request.",
      };
  }

  const exhaustiveState: never = state;
  return exhaustiveState;
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}
