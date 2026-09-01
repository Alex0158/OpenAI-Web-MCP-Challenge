import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

import {
  LISTING_MEDIA_DISCLOSURE,
  LISTING_MEDIA_MANIFEST,
  resolveListingMedia,
} from "../../src/ui/shared/listing-media-manifest";

const COMPONENT_PATH = resolve(process.cwd(), "src/ui/shared/listing-media.tsx");
const CSS_PATH = resolve(process.cwd(), "src/ui/shared/listing-media.module.css");

test("the manifest resolves only exact listing and image-key pairs", () => {
  assert.equal(
    resolveListingMedia("listing-primary", "listing-primary")?.src,
    "/listings/listing-primary.v1.webp",
  );
  assert.equal(
    resolveListingMedia("listing-north", "listing-north")?.src,
    "/listings/listing-north.v1.webp",
  );
  assert.equal(resolveListingMedia("listing-primary", "listing-north"), undefined);
  assert.equal(resolveListingMedia("listing-unknown", "listing-primary"), undefined);
  assert.equal(resolveListingMedia("listing-primary", "image-unknown"), undefined);
});

test("every reviewed manifest entry points to an existing local asset", () => {
  for (const entry of LISTING_MEDIA_MANIFEST) {
    assert.equal(entry.disclosure, LISTING_MEDIA_DISCLOSURE);
    assert.equal(entry.aspectRatio, "3:2");
    assert.equal(existsSync(resolve(process.cwd(), "public", entry.src.slice(1))), true, entry.src);
  }
});

test("the primitive keeps identity resolution, disclosure, and bounded failure semantics", () => {
  const source = readFileSync(COMPONENT_PATH, "utf8");

  assert.match(source, /resolveListingMedia\(listingId, imageKey\)/);
  assert.match(source, /src=\{media\.src\}/);
  assert.match(source, /alt=\{media\.alt\}/);
  assert.match(source, /objectPosition: media\.objectPosition/);
  assert.match(source, /loading=\{loading\}/);
  assert.match(source, /decoding="async"/);
  assert.match(source, /LISTING_MEDIA_DISCLOSURE/);
  assert.match(source, /Image unavailable/);
  assert.match(source, /failedIdentity !== identity/);
  assert.match(source, /data-listing-id=\{listingId\}/);
  assert.doesNotMatch(source, /src:\s*string/);
  assert.doesNotMatch(source, /listingId\s*\+\s*imageKey/);
});

test("the module CSS preserves the responsive 3:2 crop and readable fallback", () => {
  const css = readFileSync(CSS_PATH, "utf8");

  assert.match(css, /aspect-ratio:\s*3\s*\/\s*2/);
  assert.match(css, /\.frame[\s\S]*width:\s*100%/);
  assert.match(css, /\.image[\s\S]*object-fit:\s*cover/);
  assert.match(css, /\.unavailable[\s\S]*text-align:\s*center/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
