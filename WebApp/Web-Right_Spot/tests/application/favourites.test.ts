import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { WorkflowApplication } from "../../src/server/application/workflow";
import type { Actor, FavouriteCommand } from "../../src/server/domain/types";

const NOW = "2026-09-02T09:00:00.000Z";
const TENANT: Actor = { id: "tenant-demo", role: "tenant" };
const AGENT: Actor = { id: "agent-demo", role: "agent" };
const TEST_DIRECTORY = join(process.cwd(), "var/test");
let sequence = 0;

mkdirSync(TEST_DIRECTORY, { recursive: true });

test("WorkflowApplication persists Favourite commands and role-safe projections", () => {
  const path = databasePath("application");
  const application = new WorkflowApplication({ databasePath: path, initialTimestamp: NOW });
  const saved = application.applyFavouriteCommand(saveCommand(), NOW);
  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  assert.equal(saved.result.favouriteVersion, 1);

  const tenant = application.readTenantFavourites(TENANT, NOW);
  assert.equal(tenant.projection.favourites.length, 1);
  assert.equal(tenant.projection.favourites[0]!.listingId, "listing-primary");
  assert.deepEqual(tenant.projection.favouriteVersions, { "listing-primary": 1 });
  const agent = application.readAgentListingInterest(AGENT, NOW);
  assert.equal(agent.projection.listings.find((listing) => listing.listingId === "listing-primary")?.currentSaves, 1);
  application.close();

  const reopened = new WorkflowApplication({ databasePath: path, initialTimestamp: NOW });
  assert.equal(reopened.readState().favourites.length, 1);
  assert.equal(reopened.readState().request, null);
  reopened.close();
});

test("Favourite application rejects a wrong role without mutating state", () => {
  const path = databasePath("role");
  const application = new WorkflowApplication({ databasePath: path, initialTimestamp: NOW });
  const before = application.readState();
  const outcome = application.applyFavouriteCommand({
    ...saveCommand(),
    commandId: "wrong-role-1",
    actor: AGENT,
  }, NOW);
  assert.equal(outcome.ok, false);
  if (outcome.ok) return;
  assert.equal(outcome.error.code, "FORBIDDEN");
  assert.deepEqual(application.readState().favourites, before.favourites);
  application.close();
});

function databasePath(label: string): string {
  sequence += 1;
  return join(TEST_DIRECTORY, `favourites-application-${process.pid}-${sequence}-${label}.sqlite`);
}

function saveCommand(): Extract<FavouriteCommand, { type: "SAVE_FAVOURITE" }> {
  return {
    type: "SAVE_FAVOURITE",
    commandId: "save-primary-1",
    actor: TENANT,
    fixtureGeneration: 1,
    listingId: "listing-primary",
    expectedListingVersion: 1,
    expectedFavouriteVersion: 0,
  };
}
