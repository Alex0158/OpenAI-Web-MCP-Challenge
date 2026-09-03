import assert from "node:assert/strict";
import { test } from "node:test";

import { GET as getOperations } from "../../app/api/agent/operations/route";
import {
  handleReadOperationsInsights,
  type OperationsInsightsHttpDependencies,
} from "../../src/server/application/operations-insights-http";
import { OperationsPersistenceError } from "../../src/server/persistence/operations-store";
import { OperationsProfileValidationError } from "../../src/server/domain/operations-profile";

const AGENT_COOKIE = "rightspot_demo_session=rightspot-local-agent-v1";
const TENANT_COOKIE = "rightspot_demo_session=rightspot-local-tenant-v1";

test("Operations API requires an Agent session and rejects strict query violations", async () => {
  assert.equal(getOperations(request("http://localhost/api/agent/operations")).status, 401);
  assert.equal(getOperations(request("http://localhost/api/agent/operations", TENANT_COOKIE)).status, 403);

  for (const query of [
    "kind=listingPipeline&unknown=value",
    "kind=listingPipeline&area=",
    "kind=listingPipeline&area=Southwark&area=Hackney",
    "kind=listingPipeline&minPublishedAgeDays=-1",
    "kind=listingPipeline&minPublishedAgeDays=1.5",
    "kind=upcomingViewings&from=2026-09-03",
    "kind=upcomingViewings&from=2026-02-30&to=2026-09-05",
    "kind=upcomingViewings&from=2026-09-03&to=2026-09-05&status=REQUEST_SUBMITTED",
    "kind=upcomingViewings&from=2026-09-03&to=2026-09-05&listingId=",
  ]) {
    const response = getOperations(request(`http://localhost/api/agent/operations?${query}`, AGENT_COOKIE));
    assert.equal(response.status, 400, query);
    assert.deepEqual(await response.json(), {
      error: { code: "VALIDATION_FAILED", message: "Operations query is invalid" },
    });
  }
});

test("Operations API returns both accepted projection envelopes with server-owned asOf", async () => {
  const listing = getOperations(request(
    "http://localhost/api/agent/operations?kind=listingPipeline&publicationState=PUBLISHED",
    AGENT_COOKIE,
  ));
  assert.equal(listing.status, 200);
  const listingBody = await listing.json() as Record<string, any>;
  assert.equal(listingBody.profile, "operations");
  assert.equal(listingBody.filters.publicationState, "PUBLISHED");
  assert.equal(listingBody.timezone, "Europe/London");
  assert.equal(typeof listingBody.asOf, "string");
  assert.equal("databasePath" in listingBody, false);
  assert.equal("actor" in listingBody, false);

  const upcoming = getOperations(request(
    "http://localhost/api/agent/operations?kind=upcomingViewings&from=2026-09-03&to=2026-09-05",
    AGENT_COOKIE,
  ));
  assert.equal(upcoming.status, 200);
  const upcomingBody = await upcoming.json() as Record<string, any>;
  assert.equal(upcomingBody.filters.from, "2026-09-03");
  assert.equal(upcomingBody.filters.to, "2026-09-05");
  assert.equal(upcomingBody.returnedCount, upcomingBody.items.length);
});

test("Operations API maps persistence and authority failures to bounded service errors and always closes", async () => {
  let closed = false;
  const dependencies: OperationsInsightsHttpDependencies = {
    createApplication: () => ({
      read: () => {
        throw new OperationsPersistenceError();
      },
      close: () => {
        closed = true;
      },
    }),
    now: () => "2026-09-03T09:00:00.000Z",
  };
  const response = handleReadOperationsInsights(
    request("http://localhost/api/agent/operations?kind=listingPipeline", AGENT_COOKIE),
    dependencies,
  );
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: { code: "PERSISTENCE_ERROR", message: "Operations service is unavailable" },
  });
  assert.equal(closed, true);

  const authority = handleReadOperationsInsights(
    request("http://localhost/api/agent/operations?kind=listingPipeline", AGENT_COOKIE),
    {
      createApplication: () => ({
        read: () => {
          throw new OperationsProfileValidationError();
        },
        close: () => undefined,
      }),
    },
  );
  assert.equal(authority.status, 503);
  assert.deepEqual(await authority.json(), {
    error: { code: "AUTHORITY_UNAVAILABLE", message: "Operations authority is unavailable" },
  });

  const closeFailure = handleReadOperationsInsights(
    request("http://localhost/api/agent/operations?kind=listingPipeline", AGENT_COOKIE),
    {
      createApplication: () => ({
        read: () => ({ ok: "not returned" }) as never,
        close: () => {
          throw new OperationsPersistenceError();
        },
      }),
    },
  );
  assert.equal(closeFailure.status, 503);
  assert.deepEqual(await closeFailure.json(), {
    error: { code: "PERSISTENCE_ERROR", message: "Operations service is unavailable" },
  });
});

function request(url: string, cookie?: string): Request {
  return new Request(url, cookie ? { headers: { cookie } } : undefined);
}
