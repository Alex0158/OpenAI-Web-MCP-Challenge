import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildCreateDraftPayload,
  buildDecisionPayload,
  buildListingsUrl,
  buildSubmitPayload,
  buildUpdateDraftPayload,
  readListings,
  readTenantRequest,
  TenantApiError,
} from "../../src/ui/tenant/tenant-api";

const originalFetch = globalThis.fetch;

const LISTING = {
  id: "listing-primary",
  version: 1,
  title: "Canal House",
  address: "1 Example Walk",
  area: "King's Cross",
  monthlyRentGbp: 2200,
  bedrooms: 2,
  sizeSqM: 61,
  availableFrom: "2026-09-15",
  description: "A synthetic listing.",
  imageKey: "listing-primary-image",
};

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("listing reads encode only the bounded server filter names", async () => {
  let requestedUrl = "";
  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return jsonResponse({
      fixtureGeneration: 4,
      appliedFilters: {
        area: "King's Cross",
        maxRent: 2500,
        minSizeSqM: 50,
        availableBy: "2026-09-20",
      },
      matchedCount: 1,
      listings: [{
        id: "listing-primary",
        version: 2,
        title: "Canal House",
        address: "1 Example Walk",
        area: "King's Cross",
        monthlyRentGbp: 2200,
        bedrooms: 2,
        sizeSqM: 61,
        availableFrom: "2026-09-15",
        description: "A synthetic listing.",
        imageKey: "listing-primary-image",
        assignedAgentId: "must-not-cross-boundary",
      }],
      pagePath: "/tenant",
      pageState: "results",
    });
  };

  const response = await readListings({
    area: "King's Cross",
    maxRent: 2500,
    minSizeSqM: 50,
    availableBy: "2026-09-20",
  });
  assert.equal(requestedUrl, "/api/listings?area=King%27s+Cross&maxRent=2500&minSizeSqM=50&availableBy=2026-09-20");
  assert.equal(response.fixtureGeneration, 4);
  assert.deepEqual(response.appliedFilters, {
    area: "King's Cross",
    maxRent: 2500,
    minSizeSqM: 50,
    availableBy: "2026-09-20",
  });
  assert.equal(response.matchedCount, 1);
  assert.equal(response.pagePath, "/tenant");
  assert.equal(response.pageState, "results");
  assert.equal(response.listings[0]?.id, "listing-primary");
  assert.equal("assignedAgentId" in (response.listings[0] ?? {}), false);
  assert.equal(buildListingsUrl({ area: "A/B" }), "/api/listings?area=A%2FB");
  assert.equal(buildListingsUrl({ availableFrom: "2026-09-20" }), "/api/listings?availableBy=2026-09-20");
});

test("listing reads forward an optional AbortSignal to the same GET request", async () => {
  const controller = new AbortController();
  let receivedSignal: AbortSignal | null | undefined;
  let receivedMethod: string | undefined;
  globalThis.fetch = async (_input, init) => {
    receivedSignal = init?.signal;
    receivedMethod = init?.method;
    return jsonResponse({ fixtureGeneration: 4, listings: [] });
  };

  await readListings({}, { signal: controller.signal });

  assert.equal(receivedSignal, controller.signal);
  assert.equal(receivedMethod, "GET");
});

test("unfiltered listing reads retain bounded minimal-response compatibility", async () => {
  globalThis.fetch = async () => jsonResponse({ fixtureGeneration: 4, listings: [LISTING] });

  const response = await readListings({
    area: undefined,
    maxRent: undefined,
    minSizeSqM: undefined,
    availableBy: undefined,
  });

  assert.deepEqual(response.appliedFilters, {});
  assert.equal(response.matchedCount, 1);
  assert.equal(response.pagePath, "/tenant");
  assert.equal(response.pageState, "results");
});

test("filtered listing reads reject minimal responses for results and empty results", async () => {
  for (const listings of [[LISTING], []]) {
    globalThis.fetch = async () => jsonResponse({ fixtureGeneration: 4, listings });
    await assert.rejects(
      () => readListings({ maxRent: 2500 }),
      (error: unknown) => error instanceof TenantApiError && error.code === "INVALID_RESPONSE",
    );
  }
});

test("filtered listing reads reject partial logical metadata", async () => {
  globalThis.fetch = async () => jsonResponse({
    fixtureGeneration: 4,
    appliedFilters: { minSizeSqM: 50 },
    matchedCount: 1,
    listings: [LISTING],
    pagePath: "/tenant",
  });

  await assert.rejects(
    () => readListings({ minSizeSqM: 50 }),
    (error: unknown) => error instanceof TenantApiError && error.code === "INVALID_RESPONSE",
  );
});

test("filtered listing reads require every serialized criterion in applied filters", async () => {
  globalThis.fetch = async () => jsonResponse({
    fixtureGeneration: 4,
    appliedFilters: { area: "King's Cross" },
    matchedCount: 1,
    listings: [LISTING],
    pagePath: "/tenant",
    pageState: "results",
  });

  await assert.rejects(
    () => readListings({ area: "king's cross", availableBy: "2026-09-20" }),
    (error: unknown) => error instanceof TenantApiError && error.code === "INVALID_RESPONSE",
  );
});

test("complete filtered responses preserve server-normalized Area values", async () => {
  globalThis.fetch = async () => jsonResponse({
    fixtureGeneration: 4,
    appliedFilters: { area: "King's Cross" },
    matchedCount: 1,
    listings: [LISTING],
    pagePath: "/tenant",
    pageState: "results",
  });

  const response = await readListings({ area: "  king's cross  " });

  assert.deepEqual(response.appliedFilters, { area: "King's Cross" });
});

test("complete filtered empty responses remain successful empty results", async () => {
  globalThis.fetch = async () => jsonResponse({
    fixtureGeneration: 4,
    appliedFilters: { maxRent: 1000 },
    matchedCount: 0,
    listings: [],
    pagePath: "/tenant",
    pageState: "empty",
  });

  const response = await readListings({ maxRent: 1000 });

  assert.equal(response.matchedCount, 0);
  assert.deepEqual(response.listings, []);
  assert.equal(response.pageState, "empty");
});

test("filtered listing reads reject a mismatched maxRent", async () => {
  globalThis.fetch = async () => jsonResponse(filteredResponse({ maxRent: 999 }));

  await assert.rejects(
    () => readListings({ maxRent: 2500 }),
    (error: unknown) => error instanceof TenantApiError && error.code === "INVALID_RESPONSE",
  );
});

test("filtered listing reads reject a mismatched minSizeSqM", async () => {
  globalThis.fetch = async () => jsonResponse(filteredResponse({ minSizeSqM: 49 }));

  await assert.rejects(
    () => readListings({ minSizeSqM: 50 }),
    (error: unknown) => error instanceof TenantApiError && error.code === "INVALID_RESPONSE",
  );
});

test("filtered listing reads reject a mismatched availableBy", async () => {
  globalThis.fetch = async () => jsonResponse(filteredResponse({ availableBy: "2026-09-19" }));

  await assert.rejects(
    () => readListings({ availableBy: "2026-09-20" }),
    (error: unknown) => error instanceof TenantApiError && error.code === "INVALID_RESPONSE",
  );
});

test("filtered listing reads reject an extra allowed applied criterion", async () => {
  globalThis.fetch = async () => jsonResponse(filteredResponse({ maxRent: 2500, minSizeSqM: 50 }));

  await assert.rejects(
    () => readListings({ maxRent: 2500 }),
    (error: unknown) => error instanceof TenantApiError && error.code === "INVALID_RESPONSE",
  );
});

test("filtered listing reads reject a non-equivalent applied Area", async () => {
  globalThis.fetch = async () => jsonResponse(filteredResponse({ area: "Haringey" }));

  await assert.rejects(
    () => readListings({ area: " southwark " }),
    (error: unknown) => error instanceof TenantApiError && error.code === "INVALID_RESPONSE",
  );
});

test("listing response parsing fails closed on inconsistent or malformed search envelopes", async () => {
  const invalidPayloads: unknown[] = [
    { fixtureGeneration: 4, listings: [LISTING], matchedCount: 0 },
    { fixtureGeneration: 4, listings: [LISTING], matchedCount: 1, pageState: "empty" },
    { fixtureGeneration: 4, listings: [LISTING], appliedFilters: { maxRent: "2200" } },
    { fixtureGeneration: 4, listings: [LISTING], appliedFilters: { availableBy: "2026-02-31" } },
    { fixtureGeneration: 4, listings: [LISTING], appliedFilters: { availableFrom: "2026-09-15" } },
    { fixtureGeneration: 4, listings: [LISTING], appliedFilters: { privateNote: "must not cross" } },
  ];

  for (const payload of invalidPayloads) {
    globalThis.fetch = async () => jsonResponse(payload);
    await assert.rejects(
      () => readListings(),
      (error: unknown) => error instanceof TenantApiError && error.code === "INVALID_RESPONSE",
    );
  }
});

test("successful tenant request parsing keeps the tenant-safe response boundary", async () => {
  globalThis.fetch = async () => jsonResponse({
    fixtureGeneration: 2,
    request: {
      id: "request-1",
      listingId: "listing-primary",
      preferredTimes: ["2026-09-03T10:00:00.000Z"],
      tenantNote: "A bounded note",
      state: "SLOT_PROPOSED",
      version: 7,
      response: { kind: "SLOT_PROPOSAL", slotId: "slot-primary-1", tenantNote: "Please confirm." },
      proposalExpiresAt: "2026-09-02T10:00:00.000Z",
      preparedResponse: { kind: "AGENT_DECLINE" },
      internalReviewNote: "must-not-cross-boundary",
    },
    listing: {
      id: "listing-primary",
      version: 1,
      title: "Canal House",
      address: "1 Example Walk",
      area: "King's Cross",
      monthlyRentGbp: 2200,
      bedrooms: 2,
      sizeSqM: 61,
      availableFrom: "2026-09-15",
      description: "A synthetic listing.",
      imageKey: "listing-primary-image",
    },
    timeline: [{ sequence: 1, operation: "SEND_SLOT_PROPOSAL", fromState: "AGENT_REVIEWING", toState: "SLOT_PROPOSED", requestVersion: 7 }],
  });

  const response = await readTenantRequest();
  assert.equal(response.request?.state, "SLOT_PROPOSED");
  assert.deepEqual(response.request?.response, { kind: "SLOT_PROPOSAL", slotId: "slot-primary-1", tenantNote: "Please confirm." });
  assert.equal("preparedResponse" in (response.request ?? {}), false);
  assert.equal("internalReviewNote" in (response.request ?? {}), false);
});

test("mutation builders construct strict payloads with no client authority fields", () => {
  assert.deepEqual(buildCreateDraftPayload({
    commandId: "create-1",
    fixtureGeneration: 3,
    listingId: "listing-primary",
    expectedListingVersion: 1,
    preferredTimes: ["2026-09-03T10:00:00.000Z"],
  }), {
    commandId: "create-1",
    fixtureGeneration: 3,
    listingId: "listing-primary",
    expectedListingVersion: 1,
    preferredTimes: ["2026-09-03T10:00:00.000Z"],
  });
  assert.deepEqual(buildUpdateDraftPayload({
    commandId: "update-1",
    fixtureGeneration: 3,
    expectedRequestVersion: 1,
    expectedListingVersion: 1,
    preferredTimes: ["2026-09-03T10:00:00.000Z"],
    tenantNote: "A note",
  }), {
    commandId: "update-1",
    fixtureGeneration: 3,
    expectedRequestVersion: 1,
    expectedListingVersion: 1,
    preferredTimes: ["2026-09-03T10:00:00.000Z"],
    tenantNote: "A note",
  });
  assert.deepEqual(buildSubmitPayload({
    commandId: "submit-1",
    fixtureGeneration: 3,
    expectedRequestVersion: 1,
    expectedListingVersion: 1,
  }), {
    commandId: "submit-1",
    fixtureGeneration: 3,
    expectedRequestVersion: 1,
    expectedListingVersion: 1,
  });
  assert.deepEqual(buildDecisionPayload({
    commandId: "decision-1",
    fixtureGeneration: 3,
    expectedRequestVersion: 4,
  }), {
    commandId: "decision-1",
    fixtureGeneration: 3,
    expectedRequestVersion: 4,
  });
});

test("neutral API errors preserve status and never expose raw server internals", async () => {
  globalThis.fetch = async () => jsonResponse({
    error: { code: "STALE_VERSION", message: "Workflow version is stale", internal: "/private/path" },
  }, 409);
  await assert.rejects(
    () => readTenantRequest(),
    (error: unknown) => {
      assert.ok(error instanceof TenantApiError);
      assert.equal(error.status, 409);
      assert.equal(error.code, "STALE_VERSION");
      assert.equal(error.message, "Workflow version is stale");
      assert.equal(error.message.includes("private"), false);
      return true;
    },
  );
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function filteredResponse(appliedFilters: Record<string, unknown>): object {
  return {
    fixtureGeneration: 4,
    appliedFilters,
    matchedCount: 1,
    listings: [LISTING],
    pagePath: "/tenant",
    pageState: "results",
  };
}
