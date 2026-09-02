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
  const [requestStatusMessage, setRequestStatusMessage] = useState<string | null>(null);
  const [requestNotice, setRequestNotice] = useState<TenantRequestConflictNotice | null>(null);
  const [listingError, setListingError] = useState<unknown>(null);
  const [requestError, setRequestError] = useState<unknown>(null);
  const [isListingLoading, setIsListingLoading] = useState(true);
  const [isRequestLoading, setIsRequestLoading] = useState(true);
  const favourites = useTenantFavourites();

  function applyRequestData(nextData: TenantRequestResponse, successMessage?: string) {
    setRequestData(nextData);
    setRequestError(null);
    setIsRequestLoading(false);
    setRequestStatusMessage(successMessage ?? null);
    setRequestNotice(null);
  }

  function loadListing() {
    setListingData(null);
    setIsListingLoading(true);
    setListingError(null);
    setRequestStatusMessage(null);
    setRequestNotice(null);
    void readListing(listingId)
      .then(setListingData)
      .catch(setListingError)
      .finally(() => setIsListingLoading(false));
  }

  function loadRequestContext() {
    setRequestData(null);
    setIsRequestLoading(true);
    setRequestError(null);
    setRequestStatusMessage(null);
    setRequestNotice(null);
    void readTenantRequest()
      .then(setRequestData)
      .catch(setRequestError)
      .finally(() => setIsRequestLoading(false));
  }

  useEffect(() => {
    loadListing();
    loadRequestContext();
  }, [listingId]);

  return (
    <RolePageFrame
      requiredRole="tenant"
      currentPath={`/tenant/listings/${listingId}`}
      title="Read the details before you request a viewing."
      eyebrow="Listing detail"
      description="The facts below come from the tenant listing service. A request is saved separately and only submitted through an explicit action."
    >
      <FavouriteFeedback controller={favourites} />
      {requestStatusMessage ? (
        <div className={styles.inlineSuccess} role="status" aria-live="polite">{requestStatusMessage}</div>
      ) : null}
      {requestNotice ? (
        <div
          className={requestNotice.tone === "error" ? styles.inlineError : styles.inlineStatus}
          role={requestNotice.tone === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {requestNotice.message}
        </div>
      ) : null}
      {isListingLoading ? (
        <div className={`${styles.feedbackState} ${styles.loadingState}`} role="status" aria-live="polite" aria-busy="true">
          <span className={styles.feedbackMarker} aria-hidden="true" />
          <div>
            <h2>Preparing the listing</h2>
            <p>RightSpot is loading the property facts.</p>
          </div>
        </div>
      ) : null}
      {!isListingLoading && listingError ? (
        <div className={`${styles.feedbackState} ${styles.errorState}`} role="alert">
          <span className={styles.feedbackMarker} aria-hidden="true" />
          <div>
            <h2>Listing details are unavailable</h2>
            <p>{tenantApiErrorMessage(listingError, "load this listing")}</p>
            <button className="button button-quiet" type="button" onClick={loadListing}>Retry listing</button>
          </div>
        </div>
      ) : null}
      {!isListingLoading && !listingError && listingData ? (
        <ListingDetailContent
          listingData={listingData}
          requestData={requestData}
          requestError={requestError}
          isRequestLoading={isRequestLoading}
          favourites={favourites}
          onRequestData={applyRequestData}
          onFeedbackChange={setRequestStatusMessage}
          onConflictNotice={setRequestNotice}
          onRetryRequest={loadRequestContext}
        />
      ) : null}
    </RolePageFrame>
  );
}

function ListingDetailContent({
  listingData,
  requestData,
  requestError,
  isRequestLoading,
  favourites,
  onRequestData,
  onFeedbackChange,
  onConflictNotice,
  onRetryRequest,
}: {
  listingData: TenantListingResponse;
  requestData: TenantRequestResponse | null;
  requestError: unknown;
  isRequestLoading: boolean;
  favourites: TenantFavouritesController;
  onRequestData: (data: TenantRequestResponse, successMessage?: string) => void;
  onFeedbackChange: (message: string | null) => void;
  onConflictNotice: (notice: TenantRequestConflictNotice) => void;
  onRetryRequest: () => void;
}) {
  const listing = listingData.listing;

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

      {isRequestLoading ? (
        <section className={`${styles.feedbackState} ${styles.loadingState}`} role="status" aria-live="polite" aria-busy="true">
          <span className={styles.feedbackMarker} aria-hidden="true" />
          <div>
            <h2>Preparing your Viewing Request context</h2>
            <p>Listing facts remain available while RightSpot checks your current request.</p>
          </div>
        </section>
      ) : null}
      {!isRequestLoading && requestError ? (
        <section className={`${styles.feedbackState} ${styles.errorState}`} role="alert" aria-labelledby="request-context-error-title">
          <span className={styles.feedbackMarker} aria-hidden="true" />
          <div>
            <h2 id="request-context-error-title">Viewing Request context is unavailable</h2>
            <p>Listing facts remain available. {tenantApiErrorMessage(requestError, "load your current request context")}</p>
            <button className="button button-quiet" type="button" onClick={onRetryRequest}>Retry request context</button>
          </div>
        </section>
      ) : null}
      {!isRequestLoading && !requestError && requestData ? (
        <RequestContextContent
          listing={listing}
          requestData={requestData}
          onRequestData={onRequestData}
          onFeedbackChange={onFeedbackChange}
          onConflictNotice={onConflictNotice}
        />
      ) : null}
    </div>
  );
}

function RequestContextContent({
  listing,
  requestData,
  onRequestData,
  onFeedbackChange,
  onConflictNotice,
}: {
  listing: TenantListingResponse["listing"];
  requestData: TenantRequestResponse;
  onRequestData: (data: TenantRequestResponse, successMessage?: string) => void;
  onFeedbackChange: (message: string | null) => void;
  onConflictNotice: (notice: TenantRequestConflictNotice) => void;
}) {
  const request = requestData.request;
  const requestTargetsAnotherListing = request !== null && request.listingId !== listing.id;
  const canEditDraft = request === null || (request.listingId === listing.id && request.state === "TENANT_DRAFT");
  const requestState = request?.state;
  const existingRequestNotice = !requestTargetsAnotherListing && requestState && requestState !== "TENANT_DRAFT"
    ? requestNoticeForState(requestState)
    : null;
  const crossListingRequestNotice = requestTargetsAnotherListing && request
    ? crossListingNoticeForState(request.state)
    : null;

  return (
    <>
      {crossListingRequestNotice ? (
        <section className={styles.noticeCard} aria-labelledby="existing-request-title">
          <div className={styles.noticeHeading}>
            <span aria-hidden="true">01</span>
            <div>
              <p className="eyebrow">Current request</p>
              <h2 id="existing-request-title">{crossListingRequestNotice.heading}</h2>
            </div>
          </div>
          <p className={styles.noticeCopy}>{crossListingRequestNotice.copy}</p>
          <a className="button button-primary" href="/tenant/requests">Open request dashboard</a>
        </section>
      ) : canEditDraft ? (
        <TenantRequestEditor
          key={`${request?.id ?? "new"}-${request?.version ?? 0}`}
          listing={listing}
          fixtureGeneration={requestData.fixtureGeneration}
          request={request}
          onSaved={onRequestData}
          onFeedbackChange={onFeedbackChange}
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
    </>
  );
}

type ExistingRequestState = Exclude<TenantRequestDto["state"], "TENANT_DRAFT">;

type RequestNotice = {
  heading: string;
  copy: string;
};

function crossListingNoticeForState(state: TenantRequestDto["state"]): RequestNotice {
  switch (state) {
    case "TENANT_DRAFT":
      return {
        heading: "Your saved draft is for another listing",
        copy: "This bounded demo keeps one Viewing Request record in play. Open the request dashboard to review or edit that saved draft before choosing another home.",
      };
    case "REQUEST_SUBMITTED":
    case "AGENT_REVIEWING":
    case "SLOT_PROPOSED":
      return {
        heading: "Your active request is for another listing",
        copy: "This bounded demo keeps one Viewing Request in play. Open the request dashboard to review the existing home and its latest status.",
      };
    case "VIEWING_CONFIRMED":
    case "TENANT_DECLINED":
    case "EXPIRED":
    case "AGENT_DECLINED":
      return {
        heading: "Your recorded request is for another listing",
        copy: "This bounded demo keeps one Viewing Request record in play. Open the request dashboard to review the existing home and its completed status.",
      };
  }

  const exhaustiveState: never = state;
  return exhaustiveState;
}

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
