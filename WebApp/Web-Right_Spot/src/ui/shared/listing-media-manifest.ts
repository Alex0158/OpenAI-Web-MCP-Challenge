export const LISTING_MEDIA_DISCLOSURE = "Synthetic image · illustrative only" as const;

export type ListingMediaManifestEntry = {
  listingId: string;
  imageKey: string;
  src: `/listings/${string}.webp`;
  version: 1;
  width: 1536;
  height: 1024;
  aspectRatio: "3:2";
  objectPosition: string;
  alt: string;
  disclosure: typeof LISTING_MEDIA_DISCLOSURE;
  provenance: {
    method: "OpenAI built-in image generation";
    source: "Generated for the RightSpot demo; no external source imported";
  };
  reviewStatus: "reviewed";
  reviewedAt: "2026-09-01";
  sha256: string;
};

/**
 * Explicit local media allowlist. Consumers must resolve by both listingId and
 * imageKey; an unknown pair has no media rather than receiving a fallback.
 */
export const LISTING_MEDIA_MANIFEST = [
  {
    listingId: "listing-primary",
    imageKey: "listing-primary",
    src: "/listings/listing-primary.v1.webp",
    version: 1,
    width: 1536,
    height: 1024,
    aspectRatio: "3:2",
    objectPosition: "50% 50%",
    alt: "Contemporary living room with a sofa, dining table, and large windows.",
    disclosure: LISTING_MEDIA_DISCLOSURE,
    provenance: {
      method: "OpenAI built-in image generation",
      source: "Generated for the RightSpot demo; no external source imported",
    },
    reviewStatus: "reviewed",
    reviewedAt: "2026-09-01",
    sha256: "526500a0c45376d9dbf6e132be0902e3214ed7656b8ebd9fad28e20ea9fffde7",
  },
  {
    listingId: "listing-north",
    imageKey: "listing-north",
    src: "/listings/listing-north.v1.webp",
    version: 1,
    width: 1536,
    height: 1024,
    aspectRatio: "3:2",
    objectPosition: "50% 50%",
    alt: "Bright apartment living room with a dining area and doors opening to a small garden.",
    disclosure: LISTING_MEDIA_DISCLOSURE,
    provenance: {
      method: "OpenAI built-in image generation",
      source: "Generated for the RightSpot demo; no external source imported",
    },
    reviewStatus: "reviewed",
    reviewedAt: "2026-09-01",
    sha256: "b7a5fae3bf3c9235ef58fa88f530235d60b6f82d54cc6fbd70cc6302b8d8a0f6",
  },
  {
    listingId: "listing-riverside",
    imageKey: "listing-riverside",
    src: "/listings/listing-riverside.v1.webp",
    version: 1,
    width: 1536,
    height: 1024,
    aspectRatio: "3:2",
    objectPosition: "50% 50%",
    alt: "Compact studio interior with a sofa, bed, and kitchenette.",
    disclosure: LISTING_MEDIA_DISCLOSURE,
    provenance: {
      method: "OpenAI built-in image generation",
      source: "Generated for the RightSpot demo; no external source imported",
    },
    reviewStatus: "reviewed",
    reviewedAt: "2026-09-01",
    sha256: "18c37a78ed75cf33f5acbcc9eaef48261048f1396c475ebe8c25579c39259b11",
  },
] as const satisfies readonly ListingMediaManifestEntry[];

export function resolveListingMedia(
  listingId: string,
  imageKey: string,
): ListingMediaManifestEntry | undefined {
  return LISTING_MEDIA_MANIFEST.find(
    (entry) => entry.listingId === listingId && entry.imageKey === imageKey,
  );
}
