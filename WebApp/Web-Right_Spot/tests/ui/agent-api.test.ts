import assert from "node:assert/strict";
import { test } from "node:test";

import {
  prepareAgentResponse,
  readAgentQueue,
  sendAgentResponse,
  startAgentReview,
} from "../../src/ui/agent/agent-api";

const queuePayload = {
  fixtureGeneration: 4,
  requests: [{ id: "request-1", listingId: "listing-primary", state: "REQUEST_SUBMITTED", version: 2 }],
  counts: {
    TENANT_DRAFT: 0,
    REQUEST_SUBMITTED: 1,
    AGENT_REVIEWING: 0,
    SLOT_PROPOSED: 0,
    VIEWING_CONFIRMED: 0,
    TENANT_DECLINED: 0,
    EXPIRED: 0,
    AGENT_DECLINED: 0,
  },
};

const requestPayload = {
  fixtureGeneration: 4,
  request: {
    id: "request-1",
    listingId: "listing-primary",
    preferredTimes: ["2026-09-03T10:00:00.000Z"],
    tenantNote: "A short note",
    state: "AGENT_REVIEWING",
    version: 3,
    preparedResponse: { kind: "SLOT_PROPOSAL", slotId: "slot-primary-1", tenantNote: "Please confirm." },
    internalReviewNote: "Agent-only context",
  },
  listing: {
    id: "listing-primary",
    version: 1,
    title: "Primary synthetic listing",
    address: "1 Example Street",
    area: "Example area",
    monthlyRentGbp: 1800,
    bedrooms: 2,
    sizeSqM: 72,
    availableFrom: "2026-10-01",
    description: "Synthetic listing.",
    imageKey: "listing-primary",
    status: "PUBLISHED",
  },
  availability: [{
    id: "slot-primary-1",
    listingId: "listing-primary",
    startsAt: "2026-09-03T10:00:00.000Z",
    endsAt: "2026-09-03T10:30:00.000Z",
    status: "AVAILABLE",
  }],
};

function installFetch(responses: unknown[]) {
  const requests: Array<{ url: string; method: string; body?: Record<string, unknown> }> = [];
  const originalFetch = globalThis.fetch;
  let index = 0;
  globalThis.fetch = async (input, init) => {
    const body = typeof init?.body === "string" ? JSON.parse(init.body) as Record<string, unknown> : undefined;
    requests.push({ url: String(input), method: init?.method ?? "GET", ...(body ? { body } : {}) });
    return new Response(JSON.stringify(responses[index++]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  return { requests, restore: () => { globalThis.fetch = originalFetch; } };
}

test("agent queue parses authoritative empty and populated response shape", async () => {
  const harness = installFetch([{ ...queuePayload, requests: [] }]);
  try {
    const queue = await readAgentQueue();
    assert.deepEqual(queue.requests, []);
    assert.equal(queue.fixtureGeneration, 4);
    assert.equal(queue.counts.REQUEST_SUBMITTED, 1);
  } finally {
    harness.restore();
  }
});

test("agent mutation helpers send strict metadata and fresh command ids", async () => {
  const mutation = { ...requestPayload, result: { state: "AGENT_REVIEWING", version: 4 } };
  const harness = installFetch([mutation, mutation, mutation]);
  try {
    await startAgentReview("request/1", { fixtureGeneration: 4, expectedRequestVersion: 2 });
    await prepareAgentResponse("request/1", {
      fixtureGeneration: 4,
      expectedRequestVersion: 3,
      preparation: { kind: "SLOT_PROPOSAL", slotId: "slot-primary-1", tenantNote: "Please confirm." },
      internalReviewNote: "Agent-only context",
    });
    await sendAgentResponse("request/1", { fixtureGeneration: 4, expectedRequestVersion: 4 });

    assert.equal(harness.requests[0]?.url, "/api/agent/requests/request%2F1/review");
    assert.equal(harness.requests[1]?.url, "/api/agent/requests/request%2F1/preparation");
    assert.equal(harness.requests[2]?.url, "/api/agent/requests/request%2F1/send");
    assert.equal(harness.requests[0]?.method, "POST");
    assert.equal(harness.requests[1]?.method, "PUT");
    assert.equal(harness.requests[2]?.method, "POST");
    assert.equal(harness.requests[0]?.body && "terminalState" in harness.requests[0].body, false);
    assert.equal(harness.requests[2]?.body && "preparation" in harness.requests[2].body, false);
    assert.equal(harness.requests[2]?.body && "state" in harness.requests[2].body, false);
    assert.equal(harness.requests[0]?.body?.fixtureGeneration, 4);
    assert.equal(harness.requests[1]?.body?.expectedRequestVersion, 3);
    assert.equal(harness.requests[2]?.body?.expectedRequestVersion, 4);
    const commandIds = harness.requests.map((entry) => entry.body?.commandId);
    assert.equal(commandIds.every((commandId) => typeof commandId === "string" && commandId.length > 0), true);
    assert.equal(new Set(commandIds).size, commandIds.length);
  } finally {
    harness.restore();
  }
});

test("agent helper maps neutral API errors without trusting arbitrary response text", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { code: "SLOT_UNAVAILABLE", message: "The selected slot is no longer available" } }), {
    status: 409,
    headers: { "content-type": "application/json" },
  });
  try {
    await assert.rejects(
      () => sendAgentResponse("request-1", { fixtureGeneration: 4, expectedRequestVersion: 4 }),
      (error: unknown) => error instanceof Error
        && error.name === "AgentApiError"
        && (error as unknown as { status: number }).status === 409
        && (error as unknown as { code: string }).code === "SLOT_UNAVAILABLE",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
