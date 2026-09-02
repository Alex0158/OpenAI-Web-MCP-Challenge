import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

import { readTenantRequest } from "../../src/ui/tenant/tenant-api";

const requestPagePath = resolve(process.cwd(), "src/ui/tenant/tenant-request-page.tsx");
const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("tenant API retains only the selected viewing time in its tenant-safe response", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    fixtureGeneration: 24,
    request: {
      id: "request-1",
      listingId: "listing-primary",
      preferredTimes: ["2026-09-18T09:00:00.000Z"],
      state: "SLOT_PROPOSED",
      version: 5,
      response: { kind: "SLOT_PROPOSAL", slotId: "slot-primary-2", tenantNote: "Please confirm." },
      viewingSlot: {
        startsAt: "2026-09-04T14:00:00.000Z",
        endsAt: "2026-09-04T14:30:00.000Z",
        status: "HELD_FOR_PROPOSAL",
        heldByRequestId: "must-not-cross-boundary",
      },
      proposalExpiresAt: "2026-09-02T09:00:00.000Z",
    },
    listing: {
      id: "listing-primary",
      version: 1,
      title: "Canal Wharf Apartment",
      address: "14 Demo Wharf, London N1 0AA",
      area: "Islington",
      monthlyRentGbp: 2450,
      bedrooms: 2,
      sizeSqM: 74,
      availableFrom: "2026-09-15",
      description: "A synthetic listing.",
      imageKey: "listing-primary",
    },
    timeline: [],
  }));

  const response = await readTenantRequest();
  assert.deepEqual(response.request?.viewingSlot, {
    startsAt: "2026-09-04T14:00:00.000Z",
    endsAt: "2026-09-04T14:30:00.000Z",
  });
  assert.equal("status" in (response.request?.viewingSlot ?? {}), false);
  assert.equal("heldByRequestId" in (response.request?.viewingSlot ?? {}), false);
});

test("an incomplete proposal remains visibly blocked instead of falling back to an opaque slot id", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    fixtureGeneration: 24,
    request: {
      id: "request-1",
      listingId: "listing-primary",
      preferredTimes: ["2026-09-18T09:00:00.000Z"],
      state: "SLOT_PROPOSED",
      version: 5,
      response: { kind: "SLOT_PROPOSAL", slotId: "slot-primary-2" },
      proposalExpiresAt: "2026-09-02T09:00:00.000Z",
    },
    listing: {
      id: "listing-primary",
      version: 1,
      title: "Canal Wharf Apartment",
      address: "14 Demo Wharf, London N1 0AA",
      area: "Islington",
      monthlyRentGbp: 2450,
      bedrooms: 2,
      sizeSqM: 74,
      availableFrom: "2026-09-15",
      description: "A synthetic listing.",
      imageKey: "listing-primary",
    },
    timeline: [],
  }));

  const response = await readTenantRequest();
  assert.equal(response.request?.viewingSlot, undefined);

  const requestPage = readFileSync(requestPagePath, "utf8");
  assert.match(requestPage, /data\.request\.state === "SLOT_PROPOSED" && data\.request\.viewingSlot/);
  assert.match(requestPage, /The proposed viewing time is unavailable\. Refresh before deciding\./);
  assert.match(requestPage, /presentation\.showDeadline && expiresAt && hasViewingSlot/);
  assert.doesNotMatch(requestPage, /<code>\{response\.slotId\}<\/code>/);
});

test("tenant response renders selected viewing time separately from preferences", () => {
  const requestPage = readFileSync(requestPagePath, "utf8");

  assert.match(requestPage, /<TenantResponse[\s\S]*state=\{data\.request\.state\}/);
  assert.match(requestPage, /viewingSlot=\{data\.request\.viewingSlot\}/);
  assert.match(requestPage, /viewingSlot\?: TenantRequestDto\["viewingSlot"\]/);
  assert.match(requestPage, /Proposed viewing time|Recorded viewing time/);
  assert.match(requestPage, /Proposed viewing time:|Recorded viewing time:/);
  assert.match(requestPage, /viewingSlot\.startsAt/);
  assert.match(requestPage, /viewingSlot\.endsAt/);
  assert.match(requestPage, /time dateTime=/);
});
