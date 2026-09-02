import assert from "node:assert/strict";
import { test } from "node:test";

import { readAgentListingInterest, readTenantFavourites } from "../../src/server/domain/favourite-projections";
import { executeFavouriteCommand } from "../../src/server/domain/favourites";
import type { Actor, FavouriteCommand, WorkflowState } from "../../src/server/domain/types";
import { createInitialWorkflowState } from "../../src/server/domain/workflow";

const NOW = "2026-09-02T09:00:00.000Z";
const LATER = "2026-09-02T10:00:00.000Z";
const TENANT: Actor = { id: "tenant-demo", role: "tenant" };
const AGENT: Actor = { id: "agent-demo", role: "agent" };
const OTHER_TENANT: Actor = { id: "tenant-other", role: "tenant" };
const OTHER_AGENT: Actor = { id: "agent-other", role: "agent" };

test("saving a published listing creates one tenant-owned Favourite", () => {
  const state = createInitialWorkflowState();
  const outcome = executeFavouriteCommand(state, saveCommand(), NOW);

  assert.equal(outcome.ok, true);
  if (!outcome.ok) return;
  assert.deepEqual(outcome.result, {
    commandId: "save-primary-1",
    listingId: "listing-primary",
    favouriteState: "ACTIVE",
    favouriteVersion: 1,
  });
  assert.deepEqual(outcome.state.favourites, [{
    tenantId: "tenant-demo",
    listingId: "listing-primary",
    state: "ACTIVE",
    version: 1,
    createdAt: NOW,
    updatedAt: NOW,
    savedListingVersion: 1,
    savedMonthlyRentGbp: 2450,
  }]);
  assert.equal(outcome.state.request, null);
});

test("first save requires PUBLISHED and retains an active Favourite when unpublished", () => {
  const unpublished = createInitialWorkflowState();
  unpublished.listings[0]!.status = "UNPUBLISHED";
  const rejected = executeFavouriteCommand(unpublished, saveCommand(), NOW);
  assert.equal(rejected.ok, false);
  if (rejected.ok) return;
  assert.equal(rejected.error.code, "VALIDATION_FAILED");
  assert.deepEqual(rejected.state.favourites, []);

  const saved = expectSuccess(executeFavouriteCommand(
    createInitialWorkflowState(),
    saveCommand(),
    NOW,
  ));
  saved.listings[0]!.status = "UNPUBLISHED";
  const projection = readTenantFavourites(saved, TENANT, LATER);
  assert.equal(projection.projection.favourites.length, 1);
  assert.equal(projection.projection.favourites[0]!.listing.status, "UNPUBLISHED");
  assert.equal(projection.projection.favourites[0]!.changedSinceSaved, false);

  const interest = readAgentListingInterest(projection.state, AGENT, LATER);
  const primary = interest.projection.listings.find((listing) => listing.listingId === "listing-primary");
  assert.deepEqual(primary, {
    listingId: "listing-primary",
    title: "Canal Wharf Apartment",
    status: "UNPUBLISHED",
    currentSaves: 1,
    availableInterest: 0,
  });
});

test("Favourite commands are idempotent and reject stale or conflicting retries", () => {
  const first = executeFavouriteCommand(createInitialWorkflowState(), saveCommand(), NOW);
  const saved = expectSuccess(first);
  const retry = executeFavouriteCommand(saved, saveCommand(), LATER);
  assert.equal(retry.ok, true);
  if (!retry.ok) return;
  assert.equal(retry.result.idempotent, true);
  assert.equal(retry.result.favouriteVersion, 1);
  assert.equal(retry.state.favourites[0]!.updatedAt, NOW);

  const conflict = executeFavouriteCommand(saved, {
    ...saveCommand(),
    expectedListingVersion: 2,
  }, LATER);
  assert.equal(conflict.ok, false);
  if (conflict.ok) return;
  assert.equal(conflict.error.code, "COMMAND_CONFLICT");

  const remove = executeFavouriteCommand(saved, removeCommand(), LATER);
  const removed = expectSuccess(remove);
  assert.equal(removed.favourites[0]!.state, "REMOVED");
  assert.equal(removed.favourites[0]!.version, 2);
  assert.equal(removed.request, null);

  const stale = executeFavouriteCommand(removed, {
    ...removeCommand(),
    commandId: "remove-stale-1",
    expectedFavouriteVersion: 1,
  }, LATER);
  assert.equal(stale.ok, false);
  if (stale.ok) return;
  assert.equal(stale.error.code, "STALE_VERSION");
  assert.equal(stale.state.favourites[0]!.state, "REMOVED");
});

test("projections isolate roles, expose changed-since-save, and omit private identity", () => {
  const saved = expectSuccess(executeFavouriteCommand(
    createInitialWorkflowState(),
    saveCommand(),
    NOW,
  ));
  saved.listings[0]!.version = 2;
  saved.listings[0]!.monthlyRentGbp = 1900;

  const tenant = readTenantFavourites(saved, TENANT, LATER);
  assert.equal(tenant.projection.favourites[0]!.changedSinceSaved, true);
  const serializedTenant = JSON.stringify(tenant.projection);
  assert.equal(serializedTenant.includes("tenant-demo"), false);
  assert.equal(serializedTenant.includes("agent-demo"), false);

  assert.throws(
    () => readTenantFavourites(saved, OTHER_TENANT, LATER),
    (error: { code?: string }) => error.code === "FORBIDDEN",
  );
  assert.throws(
    () => readAgentListingInterest(saved, OTHER_AGENT, LATER),
    (error: { code?: string }) => error.code === "FORBIDDEN",
  );
  const interest = readAgentListingInterest(saved, AGENT, LATER);
  const serializedAgent = JSON.stringify(interest.projection);
  assert.equal(serializedAgent.includes("tenant-demo"), false);
  assert.equal(serializedAgent.includes("agent-demo"), false);
  assert.equal(serializedAgent.includes("private"), false);
});

function saveCommand(overrides: Partial<Extract<FavouriteCommand, { type: "SAVE_FAVOURITE" }>> = {}): Extract<FavouriteCommand, { type: "SAVE_FAVOURITE" }> {
  return {
    type: "SAVE_FAVOURITE",
    commandId: "save-primary-1",
    actor: TENANT,
    fixtureGeneration: 1,
    listingId: "listing-primary",
    expectedListingVersion: 1,
    expectedFavouriteVersion: 0,
    ...overrides,
  };
}

function removeCommand(): Extract<FavouriteCommand, { type: "REMOVE_FAVOURITE" }> {
  return {
    type: "REMOVE_FAVOURITE",
    commandId: "remove-primary-1",
    actor: TENANT,
    fixtureGeneration: 1,
    listingId: "listing-primary",
    expectedFavouriteVersion: 1,
  };
}

function expectSuccess<T extends { ok: boolean; state: WorkflowState }>(outcome: T): WorkflowState {
  if (outcome.ok) return outcome.state;
  throw new Error("Expected Favourite command to succeed");
}
