"use client";

import { useState } from "react";
import styles from "./listing-media.module.css";
import {
  LISTING_MEDIA_DISCLOSURE,
  resolveListingMedia,
  type ListingMediaManifestEntry,
} from "./listing-media-manifest";

export type ListingMediaVariant = "card" | "detail";

export type ListingMediaProps = {
  listingId: string;
  imageKey: string;
  variant: ListingMediaVariant;
};

const LOADING_BY_VARIANT = {
  card: "lazy",
  detail: "eager",
} as const;

/**
 * Render one reviewed local image for the exact listing identity supplied by
 * the caller. No caller-provided URL or cross-listing fallback is accepted.
 */
export default function ListingMedia({ listingId, imageKey, variant }: ListingMediaProps) {
  const [failedIdentity, setFailedIdentity] = useState<string | null>(null);
  const identity = `${listingId}\u0000${imageKey}`;
  const media = resolveListingMedia(listingId, imageKey);
  const shouldRenderImage = media !== undefined && failedIdentity !== identity;

  return (
    <figure
      className={styles.root}
      data-listing-id={listingId}
      data-image-key={imageKey}
      data-variant={variant}
      data-media-state={shouldRenderImage ? "ready" : "unavailable"}
    >
      <div className={styles.frame}>
        {shouldRenderImage ? (
          <ListingImage
            identity={identity}
            media={media}
            loading={LOADING_BY_VARIANT[variant]}
            onError={() => setFailedIdentity(identity)}
          />
        ) : (
          <div className={styles.unavailable} role="img" aria-label="Image unavailable">
            <span>Image unavailable</span>
          </div>
        )}
      </div>
      <figcaption className={styles.disclosure}>
        {media?.disclosure ?? LISTING_MEDIA_DISCLOSURE}
      </figcaption>
    </figure>
  );
}

function ListingImage({
  identity,
  media,
  loading,
  onError,
}: {
  identity: string;
  media: ListingMediaManifestEntry;
  loading: "lazy" | "eager";
  onError: () => void;
}) {
  return (
    <img
      key={identity}
      className={styles.image}
      src={media.src}
      alt={media.alt}
      style={{ objectPosition: media.objectPosition }}
      loading={loading}
      decoding="async"
      onError={onError}
    />
  );
}
