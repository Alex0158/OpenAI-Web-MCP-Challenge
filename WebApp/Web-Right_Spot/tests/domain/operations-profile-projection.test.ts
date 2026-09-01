import assert from "node:assert/strict";
import { test } from "node:test";

import {
  OPERATIONS_PROJECTION_MAX_ROWS,
  projectOperationsProfile,
  type OperationsProfileProjection,
  type OperationsProjectionQuery,
} from "../../src/server/domain/operations-profile-projection";
import {
  createInitialOperationsProfile,
  OperationsProfileValidationError,
} from "../../src/server/domain/operations-profile";
import type { OperationsListing, OperationsProfileState } from "../../src/server/domain/operations-profile-types";
import { DomainError } from "../../src/server/domain/errors";

const AGENT = { id: "agent-demo", role: "agent" as const };
const AS_OF = "2026-09-01T12:00:00.000Z";

test("projects the assigned listing pipeline from records with an explicit envelope and counts", () => {
  const state = createInitialOperationsProfile();
  const before = structuredClone(state);

  const projection = projectOperationsProfile(state, AGENT, { kind: "listingPipeline" }, AS_OF);

  assert.deepEqual(
    projection,
    {
      profile: "operations",
      fixtureGeneration: 1,
      timezone: "Europe/London",
      asOf: AS_OF,
      dataAsOf: "2026-09-01T12:00:00.000Z",
      freshness: "CURRENT",
      filters: { kind: "listingPipeline" },
      totalCount: 5,
      returnedCount: 5,
      truncated: false,
      items: [
        {
          id: "ops-listing-archived",
          revision: 1,
          title: "Archived Market Mews",
          area: "Hackney",
          monthlyRentGbp: 1800,
          bedrooms: 1,
          sizeSqM: 48,
          availableFrom: "2026-07-01",
          publicationState: "UNPUBLISHED",
          lifecycleState: "ARCHIVED",
          firstPublishedAt: "2026-02-01T09:00:00.000Z",
          publishedAgeDays: 212,
          stale: true,
        },
        {
          id: "ops-listing-fresh-open",
          revision: 1,
          title: "Canal Wharf Two Bedroom",
          area: "Islington",
          monthlyRentGbp: 2450,
          bedrooms: 2,
          sizeSqM: 74,
          availableFrom: "2026-09-15",
          publicationState: "PUBLISHED",
          lifecycleState: "OPEN",
          firstPublishedAt: "2026-08-15T09:00:00.000Z",
          publishedAgeDays: 17,
          stale: false,
        },
        {
          id: "ops-listing-let-agreed",
          revision: 1,
          title: "Borough Corner Flat",
          area: "Southwark",
          monthlyRentGbp: 2200,
          bedrooms: 2,
          sizeSqM: 68,
          availableFrom: "2026-08-01",
          publicationState: "PUBLISHED",
          lifecycleState: "LET_AGREED",
          firstPublishedAt: "2026-06-01T09:00:00.000Z",
          publishedAgeDays: 92,
          stale: true,
        },
        {
          id: "ops-listing-stale-open",
          revision: 1,
          title: "Northfield Garden Flat",
          area: "Haringey",
          monthlyRentGbp: 1950,
          bedrooms: 2,
          sizeSqM: 65,
          availableFrom: "2026-10-01",
          publicationState: "PUBLISHED",
          lifecycleState: "OPEN",
          firstPublishedAt: "2026-04-15T09:00:00.000Z",
          publishedAgeDays: 139,
          stale: true,
        },
        {
          id: "ops-listing-unavailable",
          revision: 1,
          title: "Riverside Studio",
          area: "Southwark",
          monthlyRentGbp: 1650,
          bedrooms: 1,
          sizeSqM: 42,
          availableFrom: "2026-09-20",
          publicationState: "PUBLISHED",
          lifecycleState: "UNAVAILABLE",
          firstPublishedAt: "2026-08-20T09:00:00.000Z",
          publishedAgeDays: 12,
          stale: false,
        },
      ],
      counts: {
        publicationState: { PUBLISHED: 4, UNPUBLISHED: 1 },
        lifecycleState: { OPEN: 2, UNAVAILABLE: 1, LET_AGREED: 1, ARCHIVED: 1 },
      },
    },
  );
  assert.deepEqual(state, before);
  assert.equal(JSON.stringify(projection).includes("ops-listing-other-agent"), false);
  assertProjectionHasNoPrivateFields(projection);
});

test("derives only proposed and confirmed upcoming viewings using London [from, to) boundaries", () => {
  const state = createInitialOperationsProfile();

  const projection = projectOperationsProfile(
    state,
    AGENT,
    { kind: "upcomingViewings", from: "2026-09-03", to: "2026-09-05" },
    AS_OF,
  );

  assert.deepEqual(projection.items, [
    {
      slotId: "ops-slot-confirmed-upcoming",
      requestId: "ops-request-confirmed",
      listingId: "ops-listing-fresh-open",
      listingTitle: "Canal Wharf Two Bedroom",
      area: "Islington",
      status: "CONFIRMED",
      startsAt: "2026-09-03T10:00:00.000Z",
      endsAt: "2026-09-03T10:30:00.000Z",
    },
    {
      slotId: "ops-slot-proposed-upcoming",
      requestId: "ops-request-proposed",
      listingId: "ops-listing-stale-open",
      listingTitle: "Northfield Garden Flat",
      area: "Haringey",
      status: "PROPOSED",
      startsAt: "2026-09-04T14:00:00.000Z",
      endsAt: "2026-09-04T14:30:00.000Z",
    },
  ]);
  assert.equal(projection.totalCount, 2);
  assert.equal(projection.returnedCount, 2);
  assert.equal(projection.truncated, false);
  assert.deepEqual(projection.counts, { PROPOSED: 1, CONFIRMED: 1 });

  const statusFiltered = projectOperationsProfile(
    state,
    AGENT,
    {
      kind: "upcomingViewings",
      from: "2026-09-03",
      to: "2026-09-05",
      status: "PROPOSED",
      area: "Haringey",
    },
    AS_OF,
  );
  assert.equal(statusFiltered.totalCount, 1);
  const statusFilteredItem = statusFiltered.items[0];
  assert.ok(statusFilteredItem && "requestId" in statusFilteredItem);
  assert.equal(statusFilteredItem.requestId, "ops-request-proposed");
});

test("returns explicit valid empty results and never fabricates unsupported signals", () => {
  const state = createInitialOperationsProfile();
  const projection = projectOperationsProfile(
    state,
    AGENT,
    { kind: "listingPipeline", area: "No Such Area" },
    AS_OF,
  );

  assert.deepEqual(projection.items, []);
  assert.equal(projection.totalCount, 0);
  assert.equal(projection.returnedCount, 0);
  assert.equal(projection.truncated, false);
  assert.deepEqual(projection.counts, {
    publicationState: { PUBLISHED: 0, UNPUBLISHED: 0 },
    lifecycleState: { OPEN: 0, UNAVAILABLE: 0, LET_AGREED: 0, ARCHIVED: 0 },
  });
  assert.equal("favourites" in projection, false);
  assert.equal("informationRequests" in projection, false);
});

test("enforces explicit agent authorization and bounded structured filters", () => {
  const state = createInitialOperationsProfile();

  expectDomainError(
    () => projectOperationsProfile(state, { id: "tenant-demo", role: "tenant" }, { kind: "listingPipeline" }, AS_OF),
    "FORBIDDEN",
  );
  expectDomainError(
    () => projectOperationsProfile(state, { id: "agent-missing", role: "agent" }, { kind: "listingPipeline" }, AS_OF),
    "FORBIDDEN",
  );
  expectDomainError(
    () => projectOperationsProfile(state, AGENT, { kind: "listingPipeline", minPublishedAgeDays: -1 }, AS_OF),
    "VALIDATION_FAILED",
  );
  expectDomainError(
    () => projectOperationsProfile(state, AGENT, { kind: "upcomingViewings", from: "2026-09-05", to: "2026-09-03" }, AS_OF),
    "VALIDATION_FAILED",
  );
  expectDomainError(
    () => projectOperationsProfile(state, AGENT, { kind: "listingPipeline" }, "not-an-instant"),
    "VALIDATION_FAILED",
  );
  expectDomainError(
    () => projectOperationsProfile(state, AGENT, { kind: "unsupported" } as never, AS_OF),
    "VALIDATION_FAILED",
  );
  expectDomainError(
    () => projectOperationsProfile(state, AGENT, { kind: "listingPipeline", sql: "SELECT *" } as never, AS_OF),
    "VALIDATION_FAILED",
  );
});

test("reports exact counts and explicit truncation at the fixed row cap", () => {
  const state = createInitialOperationsProfile();
  for (let index = 0; index < 30; index += 1) {
    state.listings.push({
      id: `ops-extra-${String(index).padStart(2, "0")}`,
      revision: 1,
      title: `Extra Listing ${index}`,
      area: "Islington",
      monthlyRentGbp: 1_500,
      bedrooms: 1,
      sizeSqM: 40,
      availableFrom: "2026-09-15",
      publicationState: "PUBLISHED",
      lifecycleState: "OPEN",
      assignedAgentId: AGENT.id,
      firstPublishedAt: "2026-08-01T09:00:00.000Z",
    });
  }

  const projection = projectOperationsProfile(state, AGENT, { kind: "listingPipeline" }, AS_OF);

  assert.equal(projection.totalCount, 35);
  assert.equal(projection.returnedCount, OPERATIONS_PROJECTION_MAX_ROWS);
  assert.equal(projection.items.length, OPERATIONS_PROJECTION_MAX_ROWS);
  assert.equal(projection.truncated, true);
  const lastItem = projection.items.at(-1);
  assert.ok(lastItem && "id" in lastItem);
  assert.equal(lastItem.id, "ops-extra-24");
});

test("fails visibly when authority fields or relationships are invalid", () => {
  const state = structuredClone(createInitialOperationsProfile());
  delete (state.listings[0] as Partial<OperationsListing>).firstPublishedAt;

  assert.throws(
    () => projectOperationsProfile(state, AGENT, { kind: "listingPipeline" }, AS_OF),
    (error: unknown) => error instanceof OperationsProfileValidationError
      && error.code === "OPERATIONS_VALIDATION_FAILED",
  );
});

const QUERY_FAMILIES: OperationsProjectionQuery[] = [
  { kind: "listingPipeline" },
  { kind: "upcomingViewings", from: "2026-09-01", to: "2026-09-07" },
];

test("keeps malformed other-portfolio authority visible without disclosing its identity", () => {
  const state = createInitialOperationsProfile();
  const otherListing = state.listings.find((listing) => listing.assignedAgentId !== AGENT.id)!;
  otherListing.firstPublishedAt = "private-invalid-timestamp";
  const before = structuredClone(state);

  for (const query of QUERY_FAMILIES) {
    expectPrivateAuthorityFailure(
      () => projectOperationsProfile(state, AGENT, query, AS_OF),
      [otherListing.id, otherListing.assignedAgentId, otherListing.firstPublishedAt],
    );
  }
  assert.deepEqual(state, before);
});

test("keeps invalid selected viewing relationships visible with generic authority errors", () => {
  for (const otherPortfolio of [false, true]) {
    const state = createInitialOperationsProfile();
    const request = state.requests[0]!;
    const slot = state.slots.find((candidate) => candidate.id === request.selectedSlotId)!;
    if (otherPortfolio) {
      const listing = state.listings.find((candidate) => candidate.assignedAgentId !== AGENT.id)!;
      request.listingId = listing.id;
      request.listingRevision = listing.revision;
      request.assignedAgentId = listing.assignedAgentId;
      slot.listingId = listing.id;
    }
    slot.selectedRequestId = "private-unknown-request";

    for (const query of QUERY_FAMILIES) {
      expectPrivateAuthorityFailure(
        () => projectOperationsProfile(state, AGENT, query, AS_OF),
        [request.id, request.listingId, request.assignedAgentId, slot.id, slot.selectedRequestId],
      );
    }
  }
});

test("projects complete empty authority for the known fixture agent with zero counts and envelope", () => {
  const state = createInitialOperationsProfile(7);
  state.listings = [];
  state.requests = [];
  state.slots = [];
  const before = structuredClone(state);

  for (const query of QUERY_FAMILIES) {
    const projection = projectOperationsProfile(state, AGENT, query, AS_OF);
    assert.deepEqual(projection, {
      profile: "operations",
      fixtureGeneration: 7,
      timezone: "Europe/London",
      asOf: AS_OF,
      dataAsOf: AS_OF,
      freshness: "CURRENT",
      filters: query,
      totalCount: 0,
      returnedCount: 0,
      truncated: false,
      items: [],
      counts: query.kind === "upcomingViewings"
        ? { PROPOSED: 0, CONFIRMED: 0 }
        : {
            publicationState: { PUBLISHED: 0, UNPUBLISHED: 0 },
            lifecycleState: { OPEN: 0, UNAVAILABLE: 0, LET_AGREED: 0, ARCHIVED: 0 },
          },
    });
    assertProjectionHasNoPrivateFields(projection);
    assert.deepEqual(projectOperationsProfile(state, AGENT, query, AS_OF), projection);
  }
  assert.deepEqual(state, before);
});

test("empty authority preserves role, assignment, query, and complete-state validation", () => {
  const state = createInitialOperationsProfile();
  state.listings = [];
  state.requests = [];
  state.slots = [];

  for (const query of QUERY_FAMILIES) {
    for (const actor of [
      null,
      { id: AGENT.id, role: "tenant" },
      { id: AGENT.id },
      { id: "", role: "agent" },
      { id: "agent-missing", role: "agent" },
      { id: "agent-other", role: "agent" },
    ]) {
      expectDomainError(
        () => projectOperationsProfile(state, actor as never, query, AS_OF),
        "FORBIDDEN",
      );
    }
    const otherPortfolio = createInitialOperationsProfile();
    otherPortfolio.listings = otherPortfolio.listings.filter((listing) => listing.assignedAgentId !== AGENT.id);
    otherPortfolio.requests = [];
    otherPortfolio.slots = [];
    expectDomainError(
      () => projectOperationsProfile(otherPortfolio, AGENT, query, AS_OF),
      "FORBIDDEN",
    );
    expectPrivateAuthorityFailure(
      () => projectOperationsProfile({ ...state, requests: createInitialOperationsProfile().requests }, AGENT, query, AS_OF),
      ["ops-request-confirmed"],
    );
    expectPrivateAuthorityFailure(
      () => projectOperationsProfile({ ...state, slots: undefined } as never, AGENT, query, AS_OF),
      [],
    );
  }
  expectDomainError(
    () => projectOperationsProfile(state, AGENT, { kind: "listingPipeline", minPublishedAgeDays: -1 }, AS_OF),
    "VALIDATION_FAILED",
  );
  expectDomainError(
    () => projectOperationsProfile(state, AGENT, { kind: "upcomingViewings", from: "2026-09-07", to: "2026-09-01" }, AS_OF),
    "VALIDATION_FAILED",
  );
});

for (const scenario of [
  {
    name: "spring DST",
    firstPublishedAt: "2026-03-01T12:00:00.000Z",
    before: "2026-05-30T10:59:59.999Z",
    exact: "2026-05-30T11:00:00.000Z",
    after: "2026-05-30T11:00:00.001Z",
  },
  {
    name: "autumn DST",
    firstPublishedAt: "2026-08-01T11:00:00.000Z",
    before: "2026-10-30T11:59:59.999Z",
    exact: "2026-10-30T12:00:00.000Z",
    after: "2026-10-30T12:00:00.001Z",
  },
]) {
  test(`publication age and strict stale threshold follow London calendar days across ${scenario.name}`, () => {
    const state = createInitialOperationsProfile();
    const listing = state.listings[0]!;
    listing.firstPublishedAt = scenario.firstPublishedAt;
    const before = structuredClone(state);

    for (const [asOf, age, stale] of [
      [scenario.before, 89, false],
      [scenario.exact, 90, false],
      [scenario.after, 90, true],
    ] as const) {
      const query = { kind: "listingPipeline", area: listing.area } as const;
      const projection = projectOperationsProfile(state, AGENT, query, asOf);
      const row = projection.items[0];
      assert.ok(row && "publishedAgeDays" in row);
      assert.equal(row.publishedAgeDays, age, asOf);
      assert.equal(row.stale, stale, asOf);
      assert.equal(row.firstPublishedAt, scenario.firstPublishedAt);
      assert.equal(projection.asOf, asOf);
      assert.deepEqual(projectOperationsProfile(state, AGENT, query, asOf), projection);

      const filtered = projectOperationsProfile(state, AGENT, { ...query, minPublishedAgeDays: 90 }, asOf);
      const count = age >= 90 ? 1 : 0;
      assert.equal(filtered.totalCount, count);
      assert.equal(filtered.returnedCount, count);
      assert.equal(filtered.truncated, false);
      assert.deepEqual(filtered.counts, {
        publicationState: { PUBLISHED: count, UNPUBLISHED: 0 },
        lifecycleState: { OPEN: count, UNAVAILABLE: 0, LET_AGREED: 0, ARCHIVED: 0 },
      });
    }
    assert.deepEqual(state, before);
  });
}

test("publication age remains non-negative for future and same-day instants", () => {
  const state = createInitialOperationsProfile();
  state.listings[0]!.firstPublishedAt = "2026-03-29T12:00:00.500+01:00";
  for (const asOf of [
    "2026-03-28T12:00:00.500Z",
    "2026-03-29T11:00:00.499Z",
    "2026-03-29T11:00:00.500Z",
    "2026-03-29T22:59:59.999Z",
    "2026-03-30T10:59:59.999Z",
  ]) {
    const projection = projectOperationsProfile(state, AGENT, { kind: "listingPipeline", area: "Islington" }, asOf);
    const row = projection.items[0];
    assert.ok(row && "publishedAgeDays" in row);
    assert.equal(row.publishedAgeDays, 0, asOf);
    assert.equal(row.stale, false, asOf);
  }
});

function expectPrivateAuthorityFailure(action: () => unknown, identities: string[]): void {
  assert.throws(action, (error: unknown) => {
    assert.ok(error instanceof OperationsProfileValidationError);
    assert.equal(error.name, "OperationsProfileValidationError");
    assert.equal(error.message, "Operations profile state is invalid");
    assert.deepEqual(JSON.parse(JSON.stringify(error)), {
      code: "OPERATIONS_VALIDATION_FAILED",
      message: "Operations profile state is invalid",
    });
    for (const identity of identities) {
      assert.equal(JSON.stringify(error).includes(identity), false, identity);
      assert.equal(String(error).includes(identity), false, identity);
      assert.equal(error.stack?.includes(identity), false, identity);
    }
    assert.equal("cause" in error, false);
    return true;
  });
}

function assertProjectionHasNoPrivateFields(projection: OperationsProfileProjection): void {
  const serialized = JSON.stringify(projection);
  for (const forbidden of [
    "assignedAgentId",
    "selectedRequestId",
    "tenantId",
    "contact",
    "privateNote",
    "commandId",
    "persistence",
    "sqlite",
    "favourites",
    "informationRequests",
  ]) {
    assert.equal(serialized.toLowerCase().includes(forbidden.toLowerCase()), false, forbidden);
  }
}

function expectDomainError(action: () => unknown, code: string): void {
  assert.throws(action, (error: unknown) => error instanceof DomainError && error.code === code);
}
