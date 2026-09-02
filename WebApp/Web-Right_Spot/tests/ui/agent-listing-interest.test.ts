import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

import {
  AgentApiError,
  readAgentListingInterest,
} from "../../src/ui/agent/agent-api";

const COMPONENT_PATH = resolve(process.cwd(), "src/ui/agent/agent-listing-interest.tsx");
const DASHBOARD_PATH = resolve(process.cwd(), "src/ui/agent/agent-dashboard-page.tsx");
const CSS_PATH = resolve(process.cwd(), "src/ui/agent/agent.module.css");

const validPayload = {
  fixtureGeneration: 7,
  listings: [
    {
      listingId: "listing-primary",
      title: "Canal Wharf Apartment",
      status: "PUBLISHED",
      currentSaves: 2,
      availableInterest: 2,
    },
    {
      listingId: "listing-north",
      title: "North Street House",
      status: "UNPUBLISHED",
      currentSaves: 1,
      availableInterest: 0,
    },
  ],
};

test("listing-interest API reads the exact server-owned aggregate projection", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), init });
    return jsonResponse(validPayload);
  };

  try {
    const response = await readAgentListingInterest();

    assert.deepEqual(response, validPayload);
    assert.deepEqual(response.listings[1], {
      listingId: "listing-north",
      title: "North Street House",
      status: "UNPUBLISHED",
      currentSaves: 1,
      availableInterest: 0,
    });
    assert.equal(requests[0]?.url, "/api/agent/listing-interest");
    assert.equal(requests[0]?.init?.method, "GET");
    assert.equal(requests[0]?.init?.cache, "no-store");
    assert.equal(requests[0]?.init?.credentials, "same-origin");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("listing-interest API rejects malformed or privacy-expanded payloads", async () => {
  const invalidPayloads: unknown[] = [
    { ...validPayload, fixtureGeneration: 0 },
    { ...validPayload, listings: {} },
    { ...validPayload, unexpected: true },
    {
      ...validPayload,
      listings: [{ ...validPayload.listings[0], status: "ARCHIVED" }],
    },
    {
      ...validPayload,
      listings: [{ ...validPayload.listings[0], currentSaves: -1 }],
    },
    {
      ...validPayload,
      listings: [{ ...validPayload.listings[0], availableInterest: 0.5 }],
    },
    {
      ...validPayload,
      listings: [{ ...validPayload.listings[0], tenantId: "tenant-demo" }],
    },
    {
      ...validPayload,
      listings: [{
        listingId: "listing-primary",
        title: "Canal Wharf Apartment",
        status: "PUBLISHED",
        currentSaves: 1,
      }],
    },
  ];
  const originalFetch = globalThis.fetch;
  let responseIndex = 0;
  globalThis.fetch = async () => jsonResponse(invalidPayloads[responseIndex++]);

  try {
    for (const _payload of invalidPayloads) {
      await assert.rejects(
        () => readAgentListingInterest(),
        (error: unknown) => error instanceof AgentApiError
          && error.code === "INVALID_RESPONSE",
      );
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("listing-interest UI keeps metric, status, state, and request-queue boundaries explicit", () => {
  const component = readFileSync(COMPONENT_PATH, "utf8");
  const dashboard = readFileSync(DASHBOARD_PATH, "utf8");
  const css = readFileSync(CSS_PATH, "utf8");

  assert.match(dashboard, /<AgentQueue \/>[\s\S]*<AgentListingInterest \/>/);
  assert.match(component, /These signals are separate from the viewing request queue/);
  assert.match(component, /<dt>Current saves<\/dt>/);
  assert.match(component, /<dt>Available interest<\/dt>/);
  assert.match(component, /\? "Published" : "Unpublished"/);
  assert.match(component, /role="status" aria-live="polite" aria-busy="true"/);
  assert.match(component, /role="status" aria-live="polite"/);
  assert.match(component, /<StatusBanner tone="error"/);
  assert.match(component, /Retry interest read/);
  assert.match(component, /No listing-interest counts are shown/);
  assert.match(component, /listing\.currentSaves/);
  assert.match(component, /listing\.availableInterest/);
  assert.doesNotMatch(component, /\.reduce\(/);
  assert.doesNotMatch(component, /tenantId|contactValue|privateNote/);
  assert.match(css, /\.listingStatusPill\[data-status="PUBLISHED"\]/);
  assert.match(css, /\.interestMetrics dt/);
});

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
