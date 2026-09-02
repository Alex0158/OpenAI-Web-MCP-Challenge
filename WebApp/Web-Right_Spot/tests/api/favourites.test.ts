import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import {
  handleReadAgentListingInterest,
  handleReadTenantFavourites,
  handleRemoveFavourite,
  handleSaveFavourite,
  type FavouriteHttpDependencies,
} from "../../src/server/application/favourites-http";
import { WorkflowApplication } from "../../src/server/application/workflow";

const NOW = "2026-09-02T09:00:00.000Z";
const TENANT_COOKIE = "rightspot_demo_session=rightspot-local-tenant-v1";
const AGENT_COOKIE = "rightspot_demo_session=rightspot-local-agent-v1";
const TEST_DIRECTORY = join(process.cwd(), "var/test");
let sequence = 0;

mkdirSync(TEST_DIRECTORY, { recursive: true });

test("Favourite API supports save, list, agent aggregate, remove, and idempotent retry", async () => {
  const path = databasePath("happy-path");
  const deps = dependencies(path);
  const initial = handleReadTenantFavourites(request("http://localhost/api/tenant/favourites", TENANT_COOKIE), deps);
  assert.equal(initial.status, 200);
  assert.deepEqual(await initial.json(), { fixtureGeneration: 1, favourites: [] });

  const saved = await handleSaveFavourite(jsonRequest("http://localhost/api/tenant/favourites", {
    commandId: "save-primary-1",
    fixtureGeneration: 1,
    listingId: "listing-primary",
    expectedListingVersion: 1,
    expectedFavouriteVersion: 0,
  }, TENANT_COOKIE), deps);
  assert.equal(saved.status, 200);
  const savedBody = await saved.json() as Record<string, any>;
  assert.deepEqual(savedBody.result, { state: "ACTIVE", version: 1 });
  assert.equal(savedBody.favourites.length, 1);
  assert.equal(JSON.stringify(savedBody).includes("tenant-demo"), false);
  assert.equal(JSON.stringify(savedBody).includes("agent-demo"), false);

  const retry = await handleSaveFavourite(jsonRequest("http://localhost/api/tenant/favourites", {
    commandId: "save-primary-1",
    fixtureGeneration: 1,
    listingId: "listing-primary",
    expectedListingVersion: 1,
    expectedFavouriteVersion: 0,
  }, TENANT_COOKIE), deps);
  assert.equal(retry.status, 200);
  assert.deepEqual((await retry.json() as Record<string, any>).result, {
    state: "ACTIVE",
    version: 1,
    idempotent: true,
  });

  const agent = handleReadAgentListingInterest(request("http://localhost/api/agent/listing-interest", AGENT_COOKIE), deps);
  assert.equal(agent.status, 200);
  const agentBody = await agent.json() as { listings: Array<Record<string, any>> };
  assert.equal(agentBody.listings.find((listing) => listing.listingId === "listing-primary")?.currentSaves, 1);
  assert.equal(JSON.stringify(agentBody).includes("tenant-demo"), false);
  assert.equal(JSON.stringify(agentBody).includes("private"), false);

  const removed = await handleRemoveFavourite(jsonRequest("http://localhost/api/tenant/favourites/listing-primary", {
    commandId: "remove-primary-1",
    fixtureGeneration: 1,
    expectedFavouriteVersion: 1,
  }, TENANT_COOKIE, "DELETE"), "listing-primary", deps);
  assert.equal(removed.status, 200);
  assert.deepEqual((await removed.json() as Record<string, any>).result, {
    state: "REMOVED",
    version: 2,
  });
  const afterRemove = handleReadTenantFavourites(request("http://localhost/api/tenant/favourites", TENANT_COOKIE), deps);
  assert.deepEqual(await afterRemove.json(), { fixtureGeneration: 1, favourites: [] });
});

test("Favourite API enforces roles, strict bodies, and version conflicts", async () => {
  const path = databasePath("validation");
  const unauthenticated = handleReadTenantFavourites(request("http://localhost/api/tenant/favourites"), dependencies(path));
  assert.equal(unauthenticated.status, 401);
  assert.deepEqual(await unauthenticated.json(), {
    error: { code: "UNAUTHENTICATED", message: "Demo session is required" },
  });

  const wrongTenantRole = handleReadTenantFavourites(request("http://localhost/api/tenant/favourites", AGENT_COOKIE), dependencies(path));
  assert.equal(wrongTenantRole.status, 403);
  const wrongAgentRole = handleReadAgentListingInterest(request("http://localhost/api/agent/listing-interest", TENANT_COOKIE), dependencies(path));
  assert.equal(wrongAgentRole.status, 403);

  const malformed = await handleSaveFavourite(jsonRequest("http://localhost/api/tenant/favourites", {
    commandId: "bad-1",
    fixtureGeneration: 1,
    listingId: "listing-primary",
    expectedListingVersion: 1,
    expectedFavouriteVersion: 0,
    extra: true,
  }, TENANT_COOKIE), dependencies(path));
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), {
    error: { code: "VALIDATION_FAILED", message: "Favourite request body is invalid" },
  });

  const saved = await handleSaveFavourite(jsonRequest("http://localhost/api/tenant/favourites", {
    commandId: "save-primary-1",
    fixtureGeneration: 1,
    listingId: "listing-primary",
    expectedListingVersion: 1,
    expectedFavouriteVersion: 0,
  }, TENANT_COOKIE), dependencies(path));
  assert.equal(saved.status, 200);
  const stale = await handleRemoveFavourite(jsonRequest("http://localhost/api/tenant/favourites/listing-primary", {
    commandId: "remove-stale-1",
    fixtureGeneration: 1,
    expectedFavouriteVersion: 0,
  }, TENANT_COOKIE, "DELETE"), "listing-primary", dependencies(path));
  assert.equal(stale.status, 409);
  assert.equal((await stale.json() as { error: { code: string } }).error.code, "STALE_VERSION");
});

test("unpublished Favourite remains removable and is excluded from available interest", async () => {
  const path = databasePath("unpublished");
  const deps = dependencies(path);
  const saved = await handleSaveFavourite(jsonRequest("http://localhost/api/tenant/favourites", {
    commandId: "save-primary-1",
    fixtureGeneration: 1,
    listingId: "listing-primary",
    expectedListingVersion: 1,
    expectedFavouriteVersion: 0,
  }, TENANT_COOKIE), deps);
  assert.equal(saved.status, 200);

  const application = new WorkflowApplication({ databasePath: path, initialTimestamp: NOW });
  const state = application.readState();
  state.listings.find((listing) => listing.id === "listing-primary")!.status = "UNPUBLISHED";
  application.close();
  const database = new (await import("node:sqlite")).DatabaseSync(path);
  database.prepare("UPDATE rightspot_workflow_snapshot SET state_json = ? WHERE id = 1").run(JSON.stringify(state));
  database.close();

  const interest = handleReadAgentListingInterest(request("http://localhost/api/agent/listing-interest", AGENT_COOKIE), deps);
  const interestBody = await interest.json() as { listings: Array<Record<string, any>> };
  assert.deepEqual(interestBody.listings.find((listing) => listing.listingId === "listing-primary"), {
    listingId: "listing-primary",
    title: "Canal Wharf Apartment",
    status: "UNPUBLISHED",
    currentSaves: 1,
    availableInterest: 0,
  });
  const favourites = handleReadTenantFavourites(request("http://localhost/api/tenant/favourites", TENANT_COOKIE), deps);
  const favouritesBody = await favourites.json() as { favourites: Array<Record<string, any>> };
  assert.equal(favouritesBody.favourites[0]!.listing.status, "UNPUBLISHED");

  const removed = await handleRemoveFavourite(jsonRequest("http://localhost/api/tenant/favourites/listing-primary", {
    commandId: "remove-primary-1",
    fixtureGeneration: 1,
    expectedFavouriteVersion: 1,
  }, TENANT_COOKIE, "DELETE"), "listing-primary", deps);
  assert.equal(removed.status, 200);
});

function dependencies(path: string): FavouriteHttpDependencies {
  return {
    createApplication: () => new WorkflowApplication({ databasePath: path, initialTimestamp: NOW }),
    now: () => NOW,
  };
}

function databasePath(label: string): string {
  sequence += 1;
  return join(TEST_DIRECTORY, `favourites-api-${process.pid}-${sequence}-${label}.sqlite`);
}

function request(url: string, cookie?: string): Request {
  return new Request(url, cookie ? { headers: { cookie } } : undefined);
}

function jsonRequest(url: string, body: unknown, cookie: string, method = "POST"): Request {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify(body),
  });
}
