import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

import {
  buildOperationsUrl,
  OperationsApiError,
  readOperations,
} from "../../src/ui/agent/operations/operations-api";

const PAGE_PATH = resolve(process.cwd(), "src/ui/agent/operations/operations-page.tsx");
const NAV_PATH = resolve(process.cwd(), "src/ui/shared/session-nav.tsx");

const listingResponse = {
  profile: "operations",
  fixtureGeneration: 8,
  timezone: "Europe/London",
  asOf: "2026-09-03T10:00:00.000Z",
  dataAsOf: "2026-09-03T09:55:00.000Z",
  freshness: "CURRENT",
  filters: { kind: "listingPipeline", area: "North", minPublishedAgeDays: 14 },
  totalCount: 1,
  returnedCount: 1,
  truncated: false,
  counts: {
    publicationState: { PUBLISHED: 1, UNPUBLISHED: 0 },
    lifecycleState: { OPEN: 1, UNAVAILABLE: 0, LET_AGREED: 0, ARCHIVED: 0 },
  },
  items: [{
    id: "listing-1",
    revision: 2,
    title: "Canal House",
    area: "North",
    monthlyRentGbp: 2200,
    bedrooms: 2,
    sizeSqM: 61,
    availableFrom: "2026-09-15",
    publicationState: "PUBLISHED",
    lifecycleState: "OPEN",
    firstPublishedAt: "2026-08-01T09:00:00.000Z",
    publishedAgeDays: 33,
    stale: true,
  }],
} as const;

test("operations URL serializes only the exact query family", () => {
  assert.equal(
    buildOperationsUrl({ kind: "listingPipeline", area: "A/B", publicationState: "PUBLISHED" }),
    "/api/agent/operations?kind=listingPipeline&area=A%2FB&publicationState=PUBLISHED",
  );
  assert.equal(
    buildOperationsUrl({ kind: "upcomingViewings", from: "2026-09-03", to: "2026-09-04", listingId: "listing/1" }),
    "/api/agent/operations?kind=upcomingViewings&from=2026-09-03&to=2026-09-04&listingId=listing%2F1",
  );
});

test("operations consumer parses a successful envelope and keeps valid empty results", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    ...listingResponse,
    items: [],
    totalCount: 0,
    returnedCount: 0,
    counts: {
      publicationState: { PUBLISHED: 0, UNPUBLISHED: 0 },
      lifecycleState: { OPEN: 0, UNAVAILABLE: 0, LET_AGREED: 0, ARCHIVED: 0 },
    },
  }), { status: 200 });
  try {
    const response = await readOperations(listingResponse.filters);
    assert.equal(response.items.length, 0);
    assert.equal(response.totalCount, 0);
    assert.equal(response.filters.kind, "listingPipeline");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("operations consumer accepts the frozen success envelope and rejects malformed shape", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(listingResponse), { status: 200 });
  try {
    const response = await readOperations(listingResponse.filters);
    assert.equal(response.profile, "operations");
    assert.equal(response.filters.kind, "listingPipeline");
    const firstItem = response.items[0];
    assert.equal(firstItem && "id" in firstItem ? firstItem.id : undefined, "listing-1");
    assert.equal("publicationState" in response.counts ? response.counts.publicationState.PUBLISHED : undefined, 1);

    globalThis.fetch = async () => new Response(JSON.stringify({ ...listingResponse, profile: "relay" }), { status: 200 });
    await assert.rejects(() => readOperations(listingResponse.filters), (error: unknown) =>
      error instanceof OperationsApiError && error.code === "INVALID_RESPONSE");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("operations consumer preserves bounded 401, 403, and 503 error codes", async () => {
  const originalFetch = globalThis.fetch;
  for (const [status, code] of [[401, "UNAUTHENTICATED"], [403, "FORBIDDEN"], [503, "AUTHORITY_UNAVAILABLE"]] as const) {
    globalThis.fetch = async () => new Response(JSON.stringify({ error: { code, message: "safe" } }), { status });
    await assert.rejects(() => readOperations({ kind: "listingPipeline" }), (error: unknown) =>
      error instanceof OperationsApiError && error.status === status && error.code === code);
  }
  globalThis.fetch = originalFetch;
});

test("Operations page exposes explicit recovery, labels, and both query families", () => {
  const page = readFileSync(PAGE_PATH, "utf8");
  assert.match(page, /RolePageFrame[\s\S]*requiredRole="agent"[\s\S]*currentPath="\/agent\/operations"/);
  assert.match(page, /listingPipeline/);
  assert.match(page, /upcomingViewings/);
  assert.match(page, /Retry operations read/);
  assert.match(page, /Clear filters/);
  assert.match(page, /aria-label="Operations report"/);
  assert.match(page, /aria-live="polite"/);
  assert.doesNotMatch(page, /startsWith\("\/agent/);
});

test("Agent navigation isolates queue and Operations active boundaries", () => {
  const nav = readFileSync(NAV_PATH, "utf8");
  assert.match(nav, /label: "Operations insights"/);
  assert.match(nav, /currentPath === "\/agent\/operations"/);
  assert.match(nav, /currentPath === "\/agent" \|\| \/\^\\\/agent\\\/requests\\\//);
  assert.doesNotMatch(nav, /currentPath\.startsWith\("\/agent\/"\)/);
});
