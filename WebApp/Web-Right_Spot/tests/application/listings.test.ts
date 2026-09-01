import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { DomainError } from "../../src/server/domain/errors";
import { createInitialWorkflowState } from "../../src/server/domain/workflow";
import type { Actor } from "../../src/server/domain/types";
import {
  readTenantListing,
  readTenantListings,
} from "../../src/server/application/listings";
import { WorkflowApplication } from "../../src/server/application/workflow";

const TENANT: Actor = { id: "tenant-demo", role: "tenant" };
const AGENT: Actor = { id: "agent-demo", role: "agent" };
const TEST_DIRECTORY = join(process.cwd(), "var/test");
let databaseSequence = 0;

mkdirSync(TEST_DIRECTORY, { recursive: true });

function databasePath(label: string): string {
  databaseSequence += 1;
  return join(TEST_DIRECTORY, `application-listings-${process.pid}-${databaseSequence}-${label}.sqlite`);
}

test("tenant collection returns published fixtures in order through a safe DTO", () => {
  const state = createInitialWorkflowState({ fixtureGeneration: 7 });
  const result = readTenantListings(state, TENANT);

  assert.equal(result.fixtureGeneration, 7);
  assert.deepEqual(result.listings.map((listing) => listing.id), [
    "listing-primary",
    "listing-north",
    "listing-riverside",
  ]);
  assert.equal(result.listings.every((listing) => !("assignedAgentId" in listing)), true);
  assert.equal(result.listings.every((listing) => !("status" in listing)), true);
  assert.equal(result.listings[0]?.title, "Canal Wharf Apartment");
  assert.equal(result.listings[0]?.version, 1);
});

test("bounded filters compose without mutating workflow state", () => {
  const state = createInitialWorkflowState();
  const before = structuredClone(state);

  assert.deepEqual(
    readTenantListings(state, TENANT, { area: "southwark" }).listings.map(({ id }) => id),
    ["listing-riverside"],
  );
  assert.deepEqual(
    readTenantListings(state, TENANT, { maxRent: 2000 }).listings.map(({ id }) => id),
    ["listing-north", "listing-riverside"],
  );
  assert.deepEqual(
    readTenantListings(state, TENANT, { minSizeSqM: 70 }).listings.map(({ id }) => id),
    ["listing-primary"],
  );
  assert.deepEqual(
    readTenantListings(state, TENANT, { availableFrom: "2026-09-20" }).listings.map(({ id }) => id),
    ["listing-primary", "listing-riverside"],
  );
  assert.deepEqual(
    readTenantListings(state, TENANT, {
      maxRent: 2000,
      minSizeSqM: 40,
      availableFrom: "2026-09-25",
    }).listings.map(({ id }) => id),
    ["listing-riverside"],
  );
  assert.deepEqual(state, before);
});

test("invalid filters and non-seeded actors fail at the application boundary", () => {
  const state = createInitialWorkflowState();
  expectDomainError(() => readTenantListings(state, TENANT, { maxRent: 0 }), "VALIDATION_FAILED");
  expectDomainError(
    () => readTenantListings(state, TENANT, { minSizeSqM: 10_001 }),
    "VALIDATION_FAILED",
  );
  expectDomainError(
    () => readTenantListings(state, TENANT, { availableFrom: "2026-02-31" }),
    "VALIDATION_FAILED",
  );
  expectDomainError(() => readTenantListings(state, AGENT), "FORBIDDEN");
  expectDomainError(
    () => readTenantListings(state, { id: "tenant-forged", role: "tenant" }),
    "FORBIDDEN",
  );
});

test("detail uses the authoritative listing and hides unknown or unpublished records", () => {
  const state = createInitialWorkflowState({ fixtureGeneration: 3 });
  const detail = readTenantListing(state, TENANT, "listing-primary");
  assert.equal(detail.fixtureGeneration, 3);
  assert.equal(detail.listing.version, state.listings[0]?.version);
  assert.equal(detail.listing.title, state.listings[0]?.title);
  assert.equal("assignedAgentId" in detail.listing, false);

  expectDomainError(
    () => readTenantListing(state, TENANT, "listing-unknown"),
    "NOT_FOUND",
  );
  state.listings[1]!.status = "UNPUBLISHED";
  expectDomainError(
    () => readTenantListing(state, TENANT, "listing-north"),
    "NOT_FOUND",
  );
  assert.deepEqual(
    readTenantListings(state, TENANT).listings.map(({ id }) => id),
    ["listing-primary", "listing-riverside"],
  );
});

test("persistence-backed listing reads preserve request, audit, version, and generation state", () => {
  const path = databasePath("read-only");
  const application = new WorkflowApplication({ databasePath: path });
  try {
    const before = application.readState();
    const collection = application.readTenantListings(TENANT, { maxRent: 2000 });
    const detail = application.readTenantListing(TENANT, "listing-primary");
    assert.deepEqual(collection.listings.map(({ id }) => id), ["listing-north", "listing-riverside"]);
    assert.equal(detail.listing.id, "listing-primary");
    assert.deepEqual(application.readState(), before);
  } finally {
    application.close();
  }
});

function expectDomainError(action: () => unknown, code: string): void {
  assert.throws(action, (error: unknown) =>
    error instanceof DomainError && error.code === code);
}
