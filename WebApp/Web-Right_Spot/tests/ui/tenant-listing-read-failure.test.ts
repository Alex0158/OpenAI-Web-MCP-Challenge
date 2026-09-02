import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const detailPath = resolve(process.cwd(), "src/ui/tenant/tenant-listing-page.tsx");

test("listing detail gives listing facts and request context separate read ownership", () => {
  const detail = readFileSync(detailPath, "utf8");

  assert.match(detail, /listingError/);
  assert.match(detail, /requestError/);
  assert.match(detail, /isListingLoading/);
  assert.match(detail, /isRequestLoading/);
  assert.match(detail, /loadListing/);
  assert.match(detail, /loadRequestContext/);
  assert.doesNotMatch(
    detail,
    /Promise\.all\(\[readListing\(listingId\), readTenantRequest\(\)\]\)/,
    "the two reads must not collapse into one generic rejection boundary",
  );
});

test("request-context failure preserves listing facts and withholds request-derived surfaces", () => {
  const detail = readFileSync(detailPath, "utf8");

  assert.match(detail, /Viewing Request context is unavailable/);
  assert.match(detail, /Retry request context/);
  assert.match(detail, /Listing facts remain available/);
  assert.match(detail, /!isRequestLoading && !requestError && requestData/);
  assert.match(detail, /onRetryRequest/);
});

test("listing failure remains listing-specific and does not use request context as a fallback", () => {
  const detail = readFileSync(detailPath, "utf8");

  assert.match(detail, /Listing details are unavailable/);
  assert.match(detail, /Retry listing/);
  assert.match(detail, /listingError/);
  assert.doesNotMatch(detail, /setListingData\(\{[\s\S]*requestData/);
});
