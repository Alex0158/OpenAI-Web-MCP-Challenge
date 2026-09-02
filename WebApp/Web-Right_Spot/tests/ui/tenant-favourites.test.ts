import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

import {
  FavouriteApiError,
  buildRemoveFavouritePayload,
  buildSaveFavouritePayload,
  favouriteErrorMessage,
  favouriteVersionFor,
  parseTenantFavouritesResponse,
  readTenantFavourites,
  removeTenantFavourite,
  saveTenantFavourite,
} from "../../src/ui/tenant/favourites-api";

const originalFetch = globalThis.fetch;
const listing = {
  id: "listing-primary",
  version: 3,
  title: "Canal Wharf Apartment",
  address: "12 Wharf Lane",
  area: "King's Cross",
  monthlyRentGbp: 2300,
  bedrooms: 2,
  sizeSqM: 61,
  availableFrom: "2026-09-15",
  description: "A synthetic listing.",
  imageKey: "listing-primary",
  status: "PUBLISHED",
} as const;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("Favourite payload builders preserve the exact server authority fields", () => {
  assert.deepEqual(buildSaveFavouritePayload({
    commandId: "save-1",
    fixtureGeneration: 7,
    listingId: "listing-primary",
    expectedListingVersion: 3,
    expectedFavouriteVersion: 2,
  }), {
    commandId: "save-1",
    fixtureGeneration: 7,
    listingId: "listing-primary",
    expectedListingVersion: 3,
    expectedFavouriteVersion: 2,
  });
  assert.deepEqual(buildRemoveFavouritePayload({
    commandId: "remove-1",
    fixtureGeneration: 7,
    expectedFavouriteVersion: 3,
  }), {
    commandId: "remove-1",
    fixtureGeneration: 7,
    expectedFavouriteVersion: 3,
  });
});

test("removed relation versions remain authoritative when the visible list is empty", () => {
  const projection = parseTenantFavouritesResponse({
    fixtureGeneration: 7,
    favourites: [],
    favouriteVersions: { "listing-primary": 2 },
  });
  assert.equal(favouriteVersionFor(projection, "listing-primary"), 2);
  assert.equal(favouriteVersionFor(projection, "listing-new"), 0);
});

test("tenant parsing allowlists public Favourite fields and rejects inconsistent relation versions", () => {
  const projection = parseTenantFavouritesResponse({
    fixtureGeneration: 7,
    favourites: [{
      listingId: "listing-primary",
      state: "ACTIVE",
      version: 3,
      createdAt: "2026-09-02T09:00:00.000Z",
      updatedAt: "2026-09-02T09:00:00.000Z",
      savedListingVersion: 2,
      savedMonthlyRentGbp: 2200,
      changedSinceSaved: true,
      tenantId: "must-not-cross-boundary",
      listing: {
        ...listing,
        assignedAgentId: "must-not-cross-boundary",
        internalReviewNote: "must-not-cross-boundary",
      },
    }],
    favouriteVersions: { "listing-primary": 3 },
    commandMetadata: "must-not-cross-boundary",
  });
  assert.equal(projection.favourites[0]?.listing.status, "PUBLISHED");
  assert.equal("tenantId" in (projection.favourites[0] ?? {}), false);
  assert.equal("assignedAgentId" in (projection.favourites[0]?.listing ?? {}), false);
  assert.throws(() => parseTenantFavouritesResponse({
    ...projection,
    favouriteVersions: { "listing-primary": 2 },
  }), FavouriteApiError);
});

test("Favourite requests use no-store same-origin fetch and exact mutation endpoints", async () => {
  const requests: Array<{ url: string; init?: RequestInit; body?: Record<string, unknown> }> = [];
  const responses = [
    {
      fixtureGeneration: 7,
      favourites: [],
      favouriteVersions: { "listing-primary": 2 },
    },
    {
      fixtureGeneration: 7,
      favourites: [{
        listingId: "listing-primary",
        state: "ACTIVE",
        version: 3,
        createdAt: "2026-09-02T09:00:00.000Z",
        updatedAt: "2026-09-02T09:00:00.000Z",
        savedListingVersion: 3,
        savedMonthlyRentGbp: 2300,
        changedSinceSaved: false,
        listing,
      }],
      favouriteVersions: { "listing-primary": 3 },
      result: { state: "ACTIVE", version: 3 },
    },
    {
      fixtureGeneration: 7,
      favourites: [],
      favouriteVersions: { "listing/primary": 4 },
      result: { state: "REMOVED", version: 4 },
    },
  ];
  globalThis.fetch = async (input, init) => {
    requests.push({
      url: String(input),
      init,
      ...(typeof init?.body === "string" ? { body: JSON.parse(init.body) as Record<string, unknown> } : {}),
    });
    return jsonResponse(responses.shift());
  };

  await readTenantFavourites();
  await saveTenantFavourite({
    commandId: "save-2",
    fixtureGeneration: 7,
    listingId: "listing-primary",
    expectedListingVersion: 3,
    expectedFavouriteVersion: 2,
  });
  await removeTenantFavourite("listing/primary", {
    commandId: "remove-2",
    fixtureGeneration: 7,
    expectedFavouriteVersion: 3,
  });

  assert.deepEqual(requests.map((entry) => [entry.url, entry.init?.method]), [
    ["/api/tenant/favourites", "GET"],
    ["/api/tenant/favourites", "POST"],
    ["/api/tenant/favourites/listing%2Fprimary", "DELETE"],
  ]);
  assert.ok(requests.every((entry) => entry.init?.cache === "no-store"));
  assert.ok(requests.every((entry) => entry.init?.credentials === "same-origin"));
  assert.deepEqual(Object.keys(requests[1]?.body ?? {}).sort(), [
    "commandId",
    "expectedFavouriteVersion",
    "expectedListingVersion",
    "fixtureGeneration",
    "listingId",
  ]);
  assert.deepEqual(Object.keys(requests[2]?.body ?? {}).sort(), [
    "commandId",
    "expectedFavouriteVersion",
    "fixtureGeneration",
  ]);
});

test("server error text is not trusted as visible Favourite copy", async () => {
  globalThis.fetch = async () => jsonResponse({
    error: {
      code: "STALE_VERSION",
      message: "private path /Users/example and tenant identifier",
    },
  }, 409);
  await assert.rejects(
    () => readTenantFavourites(),
    (error: unknown) => {
      assert.ok(error instanceof FavouriteApiError);
      assert.equal(error.status, 409);
      assert.equal(error.code, "STALE_VERSION");
      assert.equal(error.message.includes("private path"), false);
      assert.equal(favouriteErrorMessage(error, "save this listing").includes("private path"), false);
      return true;
    },
  );
});

test("tenant Favourite surfaces preserve accessible, stale, unavailable, and request boundaries", () => {
  const page = readFileSync(resolve(process.cwd(), "src/ui/tenant/tenant-favourites-page.tsx"), "utf8");
  const discovery = readFileSync(resolve(process.cwd(), "src/ui/tenant/tenant-discovery-page.tsx"), "utf8");
  const detail = readFileSync(resolve(process.cwd(), "src/ui/tenant/tenant-listing-page.tsx"), "utf8");
  const css = readFileSync(resolve(process.cwd(), "src/ui/tenant/tenant.module.css"), "utf8");
  const route = readFileSync(resolve(process.cwd(), "app/tenant/favourites/page.tsx"), "utf8");

  assert.match(page, /aria-pressed=\{active\}/);
  assert.match(page, /aria-label=\{`\$\{action\} \$\{listing\.title\}/);
  assert.match(page, /Currently unavailable/);
  assert.match(page, /changedSinceSaved/);
  assert.match(page, /favouriteVersionFor\(data, listing\.id\)/);
  assert.match(page, /isFavouriteConflict\(error\)/);
  assert.match(page, /await readTenantFavourites\(\)/);
  assert.doesNotMatch(page, /await (saveTenantFavourite|removeTenantFavourite)[\s\S]*await (saveTenantFavourite|removeTenantFavourite)/);
  assert.match(discovery, /<FavouriteToggle controller=\{favourites\} listing=\{listing\}/);
  assert.match(detail, /<FavouriteToggle controller=\{favourites\} listing=\{listing\}/);
  assert.match(detail, /<TenantRequestEditor/);
  assert.match(route, /<TenantFavouritesPage/);
  assert.match(css, /\.favouriteToggle[\s\S]*min-height:\s*var\(--control-size\)/);
  assert.match(css, /\.favouriteToggle:focus-visible/);
  assert.match(css, /\.unavailableLabel/);
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
