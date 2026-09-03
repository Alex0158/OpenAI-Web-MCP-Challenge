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

test("operations consumer forwards cancellation to the existing GET boundary", async () => {
  const originalFetch = globalThis.fetch;
  const controller = new AbortController();
  let receivedSignal: AbortSignal | null | undefined;
  globalThis.fetch = async (_input, init) => {
    receivedSignal = init?.signal;
    return new Response(JSON.stringify(listingResponse), { status: 200 });
  };
  try {
    await readOperations(listingResponse.filters, { signal: controller.signal });
    assert.equal(receivedSignal, controller.signal);
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

test("operations consumer rejects unknown response keys at every privacy boundary", async () => {
  const originalFetch = globalThis.fetch;
  const injectedResponses = [
    { ...listingResponse, tenantId: "tenant-private" },
    { ...listingResponse, filters: { ...listingResponse.filters, diagnostics: "private" } },
    {
      ...listingResponse,
      counts: {
        ...listingResponse.counts,
        publicationState: { ...listingResponse.counts.publicationState, UNKNOWN: 0 },
      },
    },
    {
      ...listingResponse,
      items: [{ ...listingResponse.items[0], contact: "private@example.test" }],
    },
  ];

  try {
    for (const payload of injectedResponses) {
      globalThis.fetch = async () => new Response(JSON.stringify(payload), { status: 200 });
      await assert.rejects(
        () => readOperations(listingResponse.filters),
        (error: unknown) => error instanceof OperationsApiError && error.code === "INVALID_RESPONSE",
      );
    }
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
  assert.match(page, /Loading Operations data/);
  assert.match(page, /Authoritative result/);
  assert.match(page, /No matching records/);
  assert.match(page, /Enter both dates in YYYY-MM-DD format\./);
  assert.match(page, /Retry operations read/);
  assert.match(page, /Clear filters/);
  assert.match(page, /aria-label="Operations report"/);
  assert.match(page, /aria-live="polite"/);
  assert.doesNotMatch(page, /startsWith\("\/agent/);
});

test("Operations page makes late read success, error, and completion settlements inert", () => {
  const page = readFileSync(PAGE_PATH, "utf8");
  const readCall = page.indexOf("await readOperations(");

  assert.notEqual(readCall, -1, "missing Operations read call");
  assert.match(page, /useRef\(0\)/, "missing monotonic latest-read identity");
  assert.match(page, /latestReadId\.current = readId/, "read identity is not advanced");
  assert.match(page, /const isCurrentRead = \(\)/, "missing current-read settlement guard");
  assert.match(page, /isMounted\.current = false;[\s\S]*cancelReads\(\);/, "unmount must invalidate the read");
  assert.match(
    page.slice(readCall),
    /if \(!isCurrentRead\(\)\) throw new OperationsReadStaleError\(\);\s*setResponse/,
    "late success must not publish a response",
  );
  assert.match(
    page.slice(readCall),
    /catch \([\s\S]*?if \(!isCurrentRead\(\)\) throw new OperationsReadStaleError\(\);[\s\S]*?setError/,
    "late error must not publish an error",
  );
  assert.match(
    page.slice(readCall),
    /finally \{[\s\S]*?activeRead\.current\?\.readId === readId[\s\S]*?readId === latestReadId\.current\) setIsLoading\(false\)/,
    "late completion must not clear newer loading state",
  );
});

test("Operations manual and WebMCP reads share one abortable page coordinator", () => {
  const page = readFileSync(PAGE_PATH, "utf8");

  assert.match(page, /const executeRead = useCallback/);
  assert.match(page, /activeRead/);
  assert.match(page, /readOperations\(query, \{ signal:/);
  assert.match(page, /<OperationsWebMcp[\s\S]*executeRead=\{executeRead\}/);
  assert.match(page, /onSubmit=\{[\s\S]*executeRead\(currentQuery\(\)\)/);
  assert.equal(page.match(/await readOperations\(/g)?.length, 1);
});

test("Operations page owns a stable bounded registration-failure signal without blocking manual reads", () => {
  const page = readFileSync(PAGE_PATH, "utf8");

  assert.match(page, /const handleOperationsRegistrationError = useCallback\(\(\) => \{/);
  assert.match(page, /setIsOperationsAssistanceUnavailable\(true\)/);
  assert.match(page, /onRegistrationError=\{handleOperationsRegistrationError\}/);
  assert.match(page, /Operations assistance is unavailable in this session\. Use the manual controls below\./);
  assert.match(page, /role="status"/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /Run operations read/);
  assert.match(page, /Clear filters/);
  assert.match(page, /Retry operations read/);
  assert.doesNotMatch(page, /registration detail/);
});

test("Operations report changes invalidate an in-flight read before changing context", () => {
  const page = readFileSync(PAGE_PATH, "utf8");
  const reportControl = page.match(/<select aria-label="Operations report"[\s\S]*?<\/select>/)?.[0];

  assert.ok(reportControl, "missing Operations report control");
  assert.match(
    reportControl,
    /cancelReads\(\);[\s\S]*?setKind/,
    "changing report context must invalidate the pending read",
  );
  assert.match(page, /const cancelReads = useCallback\([\s\S]*?controller\.abort\(\)[\s\S]*?latestReadId\.current \+= 1[\s\S]*?setIsLoading\(false\)/);
  assert.match(reportControl, /setResponse\(null\)/);
  assert.match(reportControl, /setError\(null\)/);
});

test("Agent navigation isolates queue and Operations active boundaries", () => {
  const nav = readFileSync(NAV_PATH, "utf8");
  assert.match(nav, /label: "Operations insights"/);
  assert.match(nav, /currentPath === "\/agent\/operations"/);
  assert.match(nav, /currentPath === "\/agent" \|\| \/\^\\\/agent\\\/requests\\\//);
  assert.doesNotMatch(nav, /currentPath\.startsWith\("\/agent\/"\)/);
});
