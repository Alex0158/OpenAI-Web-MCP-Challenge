import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DELETE as deleteSession,
  GET as getSession,
  POST as createSession,
} from "../../app/api/session/route";
import { GET as getListings } from "../../app/api/listings/route";
import { GET as getListingDetail } from "../../app/api/listings/[listingId]/route";
import { WorkflowApplication } from "../../src/server/application/workflow";
import { handleListingCollection } from "../../src/server/application/http";
import { WorkflowPersistenceError } from "../../src/server/persistence/workflow-store";

test("session routes issue, resolve, replace, and clear bounded demo sessions", async () => {
  const tenantResponse = await createSession(jsonRequest("http://localhost/api/session", {
    role: "tenant",
  }));
  assert.equal(tenantResponse.status, 200);
  assert.deepEqual(await tenantResponse.json(), {
    actor: { id: "tenant-demo", role: "tenant" },
  });
  const tenantCookie = requireCookie(tenantResponse);
  assert.match(tenantResponse.headers.get("set-cookie") ?? "", /HttpOnly/);
  assert.match(tenantResponse.headers.get("set-cookie") ?? "", /SameSite=Lax/);
  assert.match(tenantResponse.headers.get("set-cookie") ?? "", /Path=\//);

  const readResponse = getSession(new Request("http://localhost/api/session", {
    headers: { cookie: tenantCookie },
  }));
  assert.equal(readResponse.status, 200);
  assert.deepEqual(await readResponse.json(), {
    actor: { id: "tenant-demo", role: "tenant" },
  });

  const agentResponse = await createSession(jsonRequest("http://localhost/api/session", {
    role: "agent",
  }));
  assert.equal(agentResponse.status, 200);
  assert.notEqual(requireCookie(agentResponse), tenantCookie);

  const forged = getSession(new Request("http://localhost/api/session", {
    headers: { cookie: "rightspot_demo_session=forged" },
  }));
  assert.equal(forged.status, 401);
  assert.deepEqual(await forged.json(), {
    error: { code: "UNAUTHENTICATED", message: "Demo session is required" },
  });

  const badRole = await createSession(jsonRequest("http://localhost/api/session", {
    role: "admin",
  }));
  assert.equal(badRole.status, 400);
  const extraField = await createSession(jsonRequest("http://localhost/api/session", {
    role: "tenant",
    actorId: "tenant-forged",
  }));
  assert.equal(extraField.status, 400);
  const malformedJson = await createSession(new Request("http://localhost/api/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{not-json",
  }));
  assert.equal(malformedJson.status, 400);
  const wrongContentType = await createSession(new Request("http://localhost/api/session", {
    method: "POST",
    body: JSON.stringify({ role: "tenant" }),
  }));
  assert.equal(wrongContentType.status, 400);

  const logout = deleteSession();
  assert.equal(logout.status, 200);
  assert.deepEqual(await logout.json(), { ok: true });
  assert.match(logout.headers.get("set-cookie") ?? "", /Max-Age=0/);
});

test("listing collection route enforces tenant role and bounded filter input", async () => {
  const tenantCookie = await sessionCookie("tenant");
  const all = getListings(new Request("http://localhost/api/listings", {
    headers: { cookie: tenantCookie },
  }));
  assert.equal(all.status, 200);
  const allBody = await all.json() as {
    fixtureGeneration: number;
    listings: Array<Record<string, unknown>>;
  };
  assert.equal(allBody.fixtureGeneration, 1);
  assert.deepEqual(allBody.listings.map(({ id }) => id), [
    "listing-primary",
    "listing-north",
    "listing-riverside",
  ]);
  assert.equal(allBody.listings.some((listing) => "assignedAgentId" in listing), false);
  assert.equal(allBody.listings.some((listing) => "status" in listing), false);
  assert.equal(JSON.stringify(allBody).includes("processedCommands"), false);

  const filtered = getListings(new Request(
    "http://localhost/api/listings?maxRent=2000&minSizeSqM=40&availableFrom=2026-09-25",
    { headers: { cookie: tenantCookie } },
  ));
  assert.equal(filtered.status, 200);
  const filteredBody = await filtered.json() as { listings: Array<{ id: string }> };
  assert.deepEqual(filteredBody.listings.map(({ id }) => id), ["listing-riverside"]);

  const unauthenticated = getListings(new Request("http://localhost/api/listings"));
  assert.equal(unauthenticated.status, 401);
  const agentCookie = await sessionCookie("agent");
  const forbidden = getListings(new Request("http://localhost/api/listings", {
    headers: { cookie: agentCookie },
  }));
  assert.equal(forbidden.status, 403);

  for (const query of [
    "maxRent=12.5",
    "minSizeSqM=0",
    "availableFrom=2026-02-31",
    "area=",
    "maxRent=2000&maxRent=3000",
    "unknown=value",
  ]) {
    const malformed = getListings(new Request(`http://localhost/api/listings?${query}`, {
      headers: { cookie: tenantCookie },
    }));
    assert.equal(malformed.status, 400, query);
    const errorBody = await malformed.json() as { error: { code: string; message: string } };
    assert.equal(errorBody.error.code, "VALIDATION_FAILED", query);
    assert.equal(errorBody.error.message.length > 0, true, query);
  }
});

test("listing detail route returns authoritative data, 404s, and no workflow mutation", async () => {
  const application = new WorkflowApplication();
  const before = application.readState();
  application.close();
  const tenantCookie = await sessionCookie("tenant");

  const detail = await getListingDetail(
    new Request("http://localhost/api/listings/listing-primary", {
      headers: { cookie: tenantCookie },
    }),
    { params: Promise.resolve({ listingId: "listing-primary" }) },
  );
  assert.equal(detail.status, 200);
  const detailBody = await detail.json() as {
    fixtureGeneration: number;
    listing: Record<string, unknown>;
  };
  assert.equal(detailBody.fixtureGeneration, before.fixtureGeneration);
  assert.equal(detailBody.listing.id, "listing-primary");
  assert.equal(detailBody.listing.version, before.listings[0]?.version);
  assert.equal("assignedAgentId" in detailBody.listing, false);
  assert.equal("status" in detailBody.listing, false);

  const missing = await getListingDetail(
    new Request("http://localhost/api/listings/listing-missing", {
      headers: { cookie: tenantCookie },
    }),
    { params: Promise.resolve({ listingId: "listing-missing" }) },
  );
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), {
    error: { code: "NOT_FOUND", message: "Listing was not found" },
  });

  const reopened = new WorkflowApplication();
  try {
    assert.deepEqual(reopened.readState(), before);
  } finally {
    reopened.close();
  }
});

test("known persistence failure maps to 503 while unexpected failure remains visible", async () => {
  const tenantCookie = await sessionCookie("tenant");
  const request = new Request("http://localhost/api/listings", {
    headers: { cookie: tenantCookie },
  });
  const unavailable = handleListingCollection(request, {
    createApplication: () => {
      throw new WorkflowPersistenceError();
    },
  });
  assert.equal(unavailable.status, 503);
  const payload = await unavailable.json();
  assert.deepEqual(payload, {
    error: { code: "PERSISTENCE_ERROR", message: "Listing service is unavailable" },
  });
  const serialized = JSON.stringify(payload);
  assert.equal(serialized.includes("sqlite"), false);
  assert.equal(serialized.includes("stack"), false);
  assert.equal(serialized.includes("cookie"), false);

  assert.throws(
    () => handleListingCollection(request, {
      createApplication: () => {
        throw new Error("unexpected failure");
      },
    }),
    /unexpected failure/,
  );
});

function jsonRequest(url: string, body: object): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function sessionCookie(role: "tenant" | "agent"): Promise<string> {
  return requireCookie(await createSession(jsonRequest("http://localhost/api/session", { role })));
}

function requireCookie(response: Response): string {
  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie);
  const cookie = setCookie.split(";", 1)[0];
  assert.ok(cookie);
  return cookie;
}
