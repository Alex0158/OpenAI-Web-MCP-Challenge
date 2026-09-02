"use client";

import { useCallback, useEffect, useState } from "react";

import StatusBanner from "../shared/status-banner";
import {
  AgentApiError,
  readAgentListingInterest,
  type AgentListingInterestResponse,
} from "./agent-api";
import styles from "./agent.module.css";

export default function AgentListingInterest() {
  const [interest, setInterest] = useState<AgentListingInterestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInterest = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      setInterest(await readAgentListingInterest());
    } catch (caught: unknown) {
      setError(listingInterestErrorMessage(caught));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadInterest("initial");
  }, [loadInterest]);

  return (
    <section className={styles.interestSection} aria-labelledby="listing-interest-heading">
      <div className={styles.interestHeader}>
        <div>
          <p className="eyebrow">Portfolio signal</p>
          <h2 id="listing-interest-heading">Listing interest</h2>
          <p className="panel-copy">
            A read-only view of saved listings in your portfolio. These signals are separate from the viewing request queue.
          </p>
        </div>
        <button
          className="button button-quiet"
          type="button"
          onClick={() => void loadInterest("refresh")}
          disabled={isLoading || isRefreshing}
        >
          {isRefreshing ? "Refreshing…" : "Refresh interest"}
        </button>
      </div>

      <div className={styles.interestDefinitions} aria-label="Listing interest metric definitions">
        <p><strong>Current saves</strong> includes active saves whether a listing is published or unpublished.</p>
        <p><strong>Available interest</strong> includes active saves on currently published listings.</p>
      </div>

      {isLoading || isRefreshing ? (
        <InterestLoading />
      ) : error ? (
        <div className={styles.interestError}>
          <StatusBanner tone="error" message={error} />
          <p className="panel-copy">No listing-interest counts are shown because the latest server read did not complete.</p>
          <button
            className="button button-primary"
            type="button"
            onClick={() => void loadInterest("refresh")}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Trying again…" : "Retry interest read"}
          </button>
        </div>
      ) : interest ? (
        <InterestContent interest={interest} />
      ) : null}
    </section>
  );
}

function InterestLoading() {
  return (
    <div className={styles.interestLoading} role="status" aria-live="polite" aria-busy="true">
      <div>
        <p className="eyebrow">Portfolio update</p>
        <h3>Loading listing interest</h3>
        <p className="panel-copy">RightSpot is reading the current server-owned portfolio projection.</p>
      </div>
      <span aria-hidden="true">Reading current saves and available interest…</span>
    </div>
  );
}

function InterestContent({ interest }: { interest: AgentListingInterestResponse }) {
  if (interest.listings.length === 0) {
    return (
      <div className={styles.interestEmpty} role="status" aria-live="polite">
        <h3>No portfolio listings to show</h3>
        <p className="panel-copy">The server returned no listing-interest records for this assigned portfolio.</p>
      </div>
    );
  }

  return (
    <>
      <ul className={styles.interestList} aria-label="Listing interest by portfolio listing">
        {interest.listings.map((listing, index) => (
          <li key={listing.listingId}>
            <article className={styles.interestCard} aria-labelledby={`interest-listing-${index}`}>
              <div className={styles.interestCardHeader}>
                <div>
                  <h3 id={`interest-listing-${index}`}>{listing.title}</h3>
                  <p>Listing reference · {listing.listingId}</p>
                </div>
                <span className={styles.listingStatusPill} data-status={listing.status}>
                  {listing.status === "PUBLISHED" ? "Published" : "Unpublished"}
                </span>
              </div>
              <dl className={styles.interestMetrics}>
                <div>
                  <dt>Current saves</dt>
                  <dd>{listing.currentSaves}</dd>
                </div>
                <div>
                  <dt>Available interest</dt>
                  <dd>{listing.availableInterest}</dd>
                </div>
              </dl>
              {listing.status === "UNPUBLISHED" ? (
                <p className={styles.unpublishedNote}>This listing is unpublished. Current saves remain visible, and available interest is reported separately.</p>
              ) : null}
            </article>
          </li>
        ))}
      </ul>
      <p className={styles.interestGeneration}>Projection fixture generation {interest.fixtureGeneration}</p>
    </>
  );
}

function listingInterestErrorMessage(error: unknown): string {
  if (error instanceof AgentApiError) {
    if (error.status === 401) return "Your agent session could not be verified. Return to sign in and start again.";
    if (error.status === 403) return "Listing interest is not available for the active demo session.";
    if (error.status === 404) return "The listing-interest view was not found.";
    if (error.status === 503) return "The listing-interest service is temporarily unavailable. Try again shortly.";
  }
  return "Could not load listing interest. Try again.";
}
