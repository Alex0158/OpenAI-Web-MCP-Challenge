"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TenantFavouritesResponse } from "../../shared/contracts/favourites-api";
import type { WorkflowListingDto } from "../../shared/contracts/workflow-api";
import ListingMedia from "../shared/listing-media";
import RolePageFrame from "../shared/role-page-frame";
import {
  activeFavouriteFor,
  favouriteErrorMessage,
  favouriteVersionFor,
  isFavouriteConflict,
  readTenantFavourites,
  removeTenantFavourite,
  saveTenantFavourite,
} from "./favourites-api";
import styles from "./tenant.module.css";

type FavouriteListingIdentity = Pick<WorkflowListingDto, "id" | "version" | "title">;

export type TenantFavouritesController = {
  data: TenantFavouritesResponse | null;
  isLoading: boolean;
  isStateStale: boolean;
  loadError: unknown;
  actionError: string | null;
  actionMessage: string | null;
  pendingListingId: string | null;
  refresh: () => void;
  toggle: (listing: FavouriteListingIdentity) => void;
};

export function useTenantFavourites(): TenantFavouritesController {
  const [data, setData] = useState<TenantFavouritesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStateStale, setIsStateStale] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [pendingListingId, setPendingListingId] = useState<string | null>(null);
  const latestReadId = useRef(0);
  const latestMutationId = useRef(0);

  const refresh = useCallback(() => {
    const requestId = ++latestReadId.current;
    setIsLoading(true);
    setLoadError(null);
    setActionError(null);
    setActionMessage(null);
    void readTenantFavourites()
      .then((nextData) => {
        if (requestId !== latestReadId.current) return;
        setData(nextData);
        setIsStateStale(false);
        setActionError(null);
      })
      .catch((error: unknown) => {
        if (requestId === latestReadId.current) setLoadError(error);
      })
      .finally(() => {
        if (requestId === latestReadId.current) setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    refresh();
    return () => {
      ++latestReadId.current;
      ++latestMutationId.current;
    };
  }, [refresh]);

  function toggle(listing: FavouriteListingIdentity) {
    if (!data || isLoading || isStateStale || loadError || pendingListingId !== null) return;
    const mutationId = ++latestMutationId.current;
    const activeFavourite = activeFavouriteFor(data, listing.id);
    const expectedFavouriteVersion = favouriteVersionFor(data, listing.id);
    setPendingListingId(listing.id);
    setActionError(null);
    setActionMessage(null);

    const mutation = activeFavourite
      ? removeTenantFavourite(listing.id, {
          fixtureGeneration: data.fixtureGeneration,
          expectedFavouriteVersion,
        })
      : saveTenantFavourite({
          fixtureGeneration: data.fixtureGeneration,
          listingId: listing.id,
          expectedListingVersion: listing.version,
          expectedFavouriteVersion,
        });

    void mutation
      .then((nextData) => {
        if (mutationId !== latestMutationId.current) return;
        ++latestReadId.current;
        setData(nextData);
        setIsStateStale(false);
        setActionMessage(activeFavourite
          ? `${listing.title} was removed from your Favourites.`
          : `${listing.title} was saved to your Favourites.`);
      })
      .catch(async (error: unknown) => {
        if (mutationId !== latestMutationId.current) return;
        if (!isFavouriteConflict(error)) {
          setActionError(favouriteErrorMessage(error, activeFavourite ? "remove this Favourite" : "save this listing"));
          return;
        }

        setIsStateStale(true);
        setActionError("The saved state changed on the server. RightSpot is refreshing the authoritative Favourite view before another action.");
        const requestId = ++latestReadId.current;
        try {
          const authoritativeData = await readTenantFavourites();
          if (mutationId !== latestMutationId.current || requestId !== latestReadId.current) return;
          setData(authoritativeData);
          setIsStateStale(false);
          setLoadError(null);
          setActionError("The saved state changed on the server. The authoritative Favourite view is now refreshed; review it before trying again.");
        } catch (refreshError: unknown) {
          if (mutationId !== latestMutationId.current || requestId !== latestReadId.current) return;
          setLoadError(refreshError);
          setActionError("The saved state changed on the server, but RightSpot could not refresh it. Use Refresh saved state before trying again.");
        }
      })
      .finally(() => {
        if (mutationId === latestMutationId.current) setPendingListingId(null);
      });
  }

  return {
    data,
    isLoading,
    isStateStale,
    loadError,
    actionError,
    actionMessage,
    pendingListingId,
    refresh,
    toggle,
  };
}

export function FavouriteToggle({
  controller,
  listing,
}: {
  controller: TenantFavouritesController;
  listing: FavouriteListingIdentity;
}) {
  const active = controller.data
    ? activeFavouriteFor(controller.data, listing.id) !== undefined
    : false;
  const isPending = controller.pendingListingId === listing.id;
  const disabled = controller.data === null
    || controller.isLoading
    || controller.isStateStale
    || controller.loadError !== null
    || controller.pendingListingId !== null;
  const action = active ? "Remove" : "Save";
  const visibleLabel = isPending
    ? active ? "Removing…" : "Saving…"
    : controller.data === null || controller.isLoading
      ? "Checking saved state…"
      : active ? "Saved" : "Save";

  return (
    <button
      className={`${styles.favouriteToggle} ${active ? styles.favouriteToggleActive : ""}`}
      type="button"
      aria-pressed={active}
      aria-label={`${action} ${listing.title} ${active ? "from" : "to"} Favourites`}
      disabled={disabled}
      onClick={() => controller.toggle(listing)}
    >
      <span aria-hidden="true">{active ? "✓" : "+"}</span>
      <span>{visibleLabel}</span>
    </button>
  );
}

export function FavouriteFeedback({
  controller,
  showInitialLoading = false,
}: {
  controller: TenantFavouritesController;
  showInitialLoading?: boolean;
}) {
  if (showInitialLoading && controller.isLoading && controller.data === null) {
    return (
      <div className={`${styles.feedbackState} ${styles.loadingState}`} role="status" aria-live="polite" aria-busy="true">
        <span className={styles.feedbackMarker} aria-hidden="true" />
        <div>
          <h2>Checking your saved homes</h2>
          <p>RightSpot is reading the current tenant Favourite projection.</p>
        </div>
      </div>
    );
  }
  if (controller.actionError) {
    return (
      <div className={styles.actionFeedback} role="alert">
        <p className={styles.inlineError}>{controller.actionError}</p>
        {controller.isStateStale ? (
          <button className="button button-quiet" type="button" onClick={controller.refresh} disabled={controller.isLoading}>
            Refresh saved state
          </button>
        ) : null}
      </div>
    );
  }
  if (controller.loadError) {
    return (
      <div className={`${styles.feedbackState} ${styles.errorState}`} role="alert">
        <span className={styles.feedbackMarker} aria-hidden="true" />
        <div>
          <h2>Saved state is unavailable</h2>
          <p>{favouriteErrorMessage(controller.loadError, "load your Favourites")}</p>
          <button className="button button-quiet" type="button" onClick={controller.refresh} disabled={controller.pendingListingId !== null}>
            Refresh saved state
          </button>
        </div>
      </div>
    );
  }
  if (controller.actionMessage) {
    return <div className={styles.inlineSuccess} role="status" aria-live="polite">{controller.actionMessage}</div>;
  }
  if (controller.isLoading && controller.data !== null) {
    return <div className={styles.inlineStatus} role="status" aria-live="polite">Refreshing the authoritative saved state…</div>;
  }
  return null;
}

export default function TenantFavouritesPage() {
  const controller = useTenantFavourites();

  return (
    <RolePageFrame
      requiredRole="tenant"
      currentPath="/tenant/favourites"
      title="Keep the homes worth another look."
      eyebrow="Tenant Favourites"
      description="Saved homes stay separate from Viewing Requests. RightSpot keeps unavailable records visible until you remove them."
    >
      <div className={styles.toolbar}>
        <div>
          <span className={styles.toolbarLabel}>Authoritative saved-listing view</span>
          <span className={styles.mutedCopy}>Read from the current tenant Favourite projection</span>
        </div>
        <button
          className="button button-quiet"
          type="button"
          onClick={controller.refresh}
          disabled={controller.isLoading || controller.pendingListingId !== null}
        >
          Refresh saved state
        </button>
      </div>

      <div className={styles.favouritesPage}>
        <FavouriteFeedback controller={controller} showInitialLoading />
        {!controller.isLoading && !controller.loadError && controller.data ? (
          <FavouriteCollection controller={controller} />
        ) : null}
      </div>
    </RolePageFrame>
  );
}

function FavouriteCollection({ controller }: { controller: TenantFavouritesController }) {
  const favourites = controller.data?.favourites ?? [];
  if (favourites.length === 0) {
    return (
      <section className={styles.feedbackState} aria-labelledby="empty-favourites-title">
        <span className={styles.feedbackMarker} aria-hidden="true" />
        <div>
          <p className="eyebrow">No saved homes</p>
          <h2 id="empty-favourites-title">Build a shortlist from the catalogue</h2>
          <p>Saving a home keeps it here without creating a Viewing Request or contacting a property agent.</p>
          <a className="button button-primary" href="/tenant">Browse rentals</a>
        </div>
      </section>
    );
  }

  const available = favourites.filter((favourite) => favourite.listing.status === "PUBLISHED");
  const unavailable = favourites.filter((favourite) => favourite.listing.status === "UNPUBLISHED");
  return (
    <div className={styles.favouriteGroups}>
      {available.length > 0 ? (
        <FavouriteGroup
          controller={controller}
          favourites={available}
          title="Available saved homes"
          description="These homes are still published in the current catalogue."
        />
      ) : null}
      {unavailable.length > 0 ? (
        <FavouriteGroup
          controller={controller}
          favourites={unavailable}
          title="Currently unavailable"
          description="These saved records remain visible and removable, but they are not presented as available homes."
          unavailable
        />
      ) : null}
    </div>
  );
}

function FavouriteGroup({
  controller,
  favourites,
  title,
  description,
  unavailable = false,
}: {
  controller: TenantFavouritesController;
  favourites: NonNullable<TenantFavouritesController["data"]>["favourites"];
  title: string;
  description: string;
  unavailable?: boolean;
}) {
  const titleId = unavailable ? "unavailable-favourites-title" : "available-favourites-title";
  return (
    <section className={styles.favouriteGroup} aria-labelledby={titleId}>
      <div className={styles.sectionHeading}>
        <div>
          <p className="eyebrow">{unavailable ? "Retained saved state" : "Current shortlist"}</p>
          <h2 id={titleId}>{title}</h2>
          <p className={styles.sectionIntro}>{description}</p>
        </div>
        <p className={styles.catalogueNote}>{favourites.length} {favourites.length === 1 ? "home" : "homes"}</p>
      </div>
      <div className={styles.favouriteGrid}>
        {favourites.map((favourite) => (
          <article
            className={`${styles.favouriteCard} ${unavailable ? styles.favouriteCardUnavailable : ""}`}
            key={favourite.listingId}
          >
            <ListingMedia
              listingId={favourite.listing.id}
              imageKey={favourite.listing.imageKey}
              variant="card"
            />
            <div className={styles.favouriteCardBody}>
              <div className={styles.favouriteCardHeading}>
                <div>
                  <p className="eyebrow">{favourite.listing.area}</p>
                  <h3>{favourite.listing.title}</h3>
                </div>
                <span className={unavailable ? styles.unavailableLabel : styles.availableLabel}>
                  {unavailable ? "Currently unavailable" : "Available"}
                </span>
              </div>
              <p className={styles.address}>{favourite.listing.address}</p>
              <p className={styles.favouriteRent}>£{favourite.listing.monthlyRentGbp.toLocaleString("en-GB")} <span>per month</span></p>
              <ChangedSinceSaved favourite={favourite} />
              <div className={styles.favouriteCardActions}>
                {!unavailable ? (
                  <a className="button button-primary" href={`/tenant/listings/${encodeURIComponent(favourite.listingId)}`}>
                    View full listing
                  </a>
                ) : (
                  <p>This record is kept for your review. Remove it when it is no longer useful.</p>
                )}
                <FavouriteToggle controller={controller} listing={favourite.listing} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ChangedSinceSaved({
  favourite,
}: {
  favourite: NonNullable<TenantFavouritesController["data"]>["favourites"][number];
}) {
  if (!favourite.changedSinceSaved) {
    return <p className={styles.savedChangeNote}>No listing change is indicated since this save.</p>;
  }
  if (favourite.savedMonthlyRentGbp !== favourite.listing.monthlyRentGbp) {
    return (
      <p className={styles.savedChangeNote}>
        <strong>Rent changed since saved.</strong>{" "}
        Saved at £{favourite.savedMonthlyRentGbp.toLocaleString("en-GB")}; the current record is £{favourite.listing.monthlyRentGbp.toLocaleString("en-GB")}.
      </p>
    );
  }
  return (
    <p className={styles.savedChangeNote}>
      <strong>Listing details changed since saved.</strong>{" "}
      Saved at listing version {favourite.savedListingVersion}; the current record is version {favourite.listing.version}.
    </p>
  );
}
