import assert from "node:assert/strict";
import { test } from "node:test";

import { DomainError } from "../../src/server/domain/errors";
import {
  projectAgentOperations,
  type AgentOperationsProjectionV1,
} from "../../src/server/domain/operations-projection";
import type {
  Actor,
  AvailabilitySlot,
  Listing,
  RequestState,
  WorkflowState,
} from "../../src/server/domain/types";
import { REQUEST_STATES } from "../../src/server/domain/types";
import { createInitialWorkflowState } from "../../src/server/domain/workflow";

const AGENT: Actor = { id: "agent-demo", role: "agent" };
const NOW = "2026-09-03T10:00:00.000Z";

test("rejects tenant and unassigned agent actors with the domain error vocabulary", () => {
  const state = createInitialWorkflowState();

  expectDomainError(
    () => projectAgentOperations(state, { id: "tenant-demo", role: "tenant" }, NOW),
    "FORBIDDEN",
  );
  expectDomainError(
    () => projectAgentOperations(state, { id: "agent-other", role: "agent" }, NOW),
    "FORBIDDEN",
  );
});

test("returns deterministic listing and request pipelines without private workflow fields", () => {
  const state = createOperationsState();
  const before = structuredClone(state);

  const projection = projectAgentOperations(state, AGENT, NOW);

  assert.deepEqual(projection.listings.counts, { PUBLISHED: 2, UNPUBLISHED: 1 });
  assert.deepEqual(
    projection.listings.rows.map(({ id, status }) => ({ id, status })),
    [
      { id: "listing-a", status: "PUBLISHED" },
      { id: "listing-b", status: "UNPUBLISHED" },
      { id: "listing-c", status: "PUBLISHED" },
    ],
  );
  assert.deepEqual(projection.viewingRequests.counts, requestCounts("AGENT_REVIEWING"));
  assert.deepEqual(projection.viewingRequests.references, [
    {
      id: "request-1",
      listingId: "listing-a",
      listingTitle: "Alpha Place",
      state: "AGENT_REVIEWING",
      version: 7,
    },
  ]);
  assert.equal(JSON.stringify(projection).includes("assignedAgentId"), false);
  assertProjectionOmitsPrivateKeys(projection);
  assert.deepEqual(state, before);
  assert.deepEqual(projectAgentOperations(state, AGENT, NOW), projection);
  projection.listings.rows[0]!.title = "Tampered listing";
  projection.viewingRequests.references[0]!.state = "TENANT_DECLINED";
  projection.upcomingSlots[0]!.status = "CONFIRMED";
  assert.deepEqual(state, before);
});

test("preserves held and confirmed slot statuses and applies current, future, and past boundaries", () => {
  const state = createOperationsState();

  const projection = projectAgentOperations(state, AGENT, NOW);

  assert.deepEqual(projection.upcomingSlots, [
    {
      id: "slot-current",
      listingId: "listing-a",
      listingTitle: "Alpha Place",
      requestId: "request-1",
      startsAt: "2026-09-03T10:00:00.000Z",
      endsAt: "2026-09-03T10:30:00.000Z",
      status: "HELD_FOR_PROPOSAL",
    },
    {
      id: "slot-confirmed",
      listingId: "listing-a",
      listingTitle: "Alpha Place",
      startsAt: "2026-09-04T09:00:00.000Z",
      endsAt: "2026-09-04T09:30:00.000Z",
      status: "CONFIRMED",
    },
    {
      id: "slot-future",
      listingId: "listing-b",
      listingTitle: "Beta Place",
      startsAt: "2026-09-05T09:00:00.000Z",
      endsAt: "2026-09-05T09:30:00.000Z",
      status: "HELD_FOR_PROPOSAL",
    },
  ]);
  assert.equal(projection.upcomingSlots.some(({ id }) => id === "slot-past"), false);
  assert.equal(projection.upcomingSlots.some(({ id }) => id === "slot-available"), false);
});

test("returns explicit empty request and slot collections without synthetic signal metrics", () => {
  const state = createInitialWorkflowState({ listings: [], slots: [] });

  const projection = projectAgentOperations(state, AGENT, NOW);

  assert.deepEqual(projection.listings.counts, { PUBLISHED: 0, UNPUBLISHED: 0 });
  assert.deepEqual(projection.listings.rows, []);
  assert.deepEqual(projection.viewingRequests.counts, requestCounts());
  assert.deepEqual(projection.viewingRequests.references, []);
  assert.deepEqual(projection.upcomingSlots, []);
  assert.equal("favourites" in projection, false);
  assert.equal("informationRequests" in projection, false);
  assert.equal("notifications" in projection, false);
});

test("rejects an invalid injected timestamp without reading environment time", () => {
  expectDomainError(
    () => projectAgentOperations(createInitialWorkflowState(), AGENT, "not-a-timestamp"),
    "VALIDATION_FAILED",
  );
});

function createOperationsState(): WorkflowState {
  const listings: Listing[] = [
    listing("listing-c", "PUBLISHED", "Gamma Place"),
    listing("listing-a", "PUBLISHED", "Alpha Place"),
    listing("listing-b", "UNPUBLISHED", "Beta Place"),
  ];
  const slots: AvailabilitySlot[] = [
    slot("slot-future", "listing-b", "2026-09-05T09:00:00.000Z", "HELD_FOR_PROPOSAL"),
    slot("slot-past", "listing-a", "2026-09-03T09:59:59.999Z", "CONFIRMED"),
    slot("slot-available", "listing-a", "2026-09-06T09:00:00.000Z", "AVAILABLE"),
    slot("slot-current", "listing-a", NOW, "HELD_FOR_PROPOSAL", "request-1"),
    slot("slot-confirmed", "listing-a", "2026-09-04T09:00:00.000Z", "CONFIRMED"),
  ];
  const state = createInitialWorkflowState({ listings, slots });
  state.request = {
    id: "request-1",
    listingId: "listing-a",
    listingVersion: 1,
    tenantId: "tenant-demo",
    agentId: "agent-demo",
    preferredTimes: ["2026-09-04T09:00:00.000Z"],
    tenantNote: "Private tenant note",
    state: "AGENT_REVIEWING",
    version: 7,
    fixtureGeneration: 1,
    preparedResponse: {
      kind: "SLOT_PROPOSAL",
      slotId: "slot-current",
      tenantNote: "Prepared response text",
    },
    sentResponse: {
      kind: "SLOT_PROPOSAL",
      slotId: "slot-confirmed",
      tenantNote: "Sent response text",
    },
    internalReviewNote: "Private internal note",
  };
  state.processedCommands = [
    {
      commandId: "private-command",
      fingerprint: "private-fingerprint",
      result: {
        commandId: "private-command",
        requestId: "request-1",
        requestState: "AGENT_REVIEWING",
        requestVersion: 7,
      },
    },
  ];
  return state;
}

function listing(id: string, status: Listing["status"], title: string): Listing {
  return {
    id,
    version: 1,
    status,
    assignedAgentId: "agent-demo",
    title,
    address: `${title} address`,
    area: `${title} area`,
    monthlyRentGbp: 1_500,
    bedrooms: 2,
    sizeSqM: 60,
    availableFrom: "2026-09-15",
    description: `${title} private description`,
    imageKey: id,
  };
}

function slot(
  id: string,
  listingId: string,
  startsAt: string,
  status: AvailabilitySlot["status"],
  heldByRequestId?: string,
): AvailabilitySlot {
  return {
    id,
    listingId,
    startsAt,
    endsAt: new Date(Date.parse(startsAt) + 30 * 60 * 1_000).toISOString(),
    status,
    heldByRequestId,
  };
}

function requestCounts(active?: RequestState): Record<RequestState, number> {
  return Object.fromEntries(
    REQUEST_STATES.map((state) => [state, state === active ? 1 : 0]),
  ) as Record<RequestState, number>;
}

function assertProjectionOmitsPrivateKeys(projection: AgentOperationsProjectionV1): void {
  const privateKeys = [
    "tenantId",
    "tenantNote",
    "internalReviewNote",
    "preparedResponse",
    "sentResponse",
    "heldByRequestId",
    "commandId",
    "fingerprint",
    "processedCommands",
    "fixtureGeneration",
    "audit",
  ];
  const serialized = JSON.stringify(projection);
  for (const key of privateKeys) {
    assert.equal(serialized.includes(`\"${key}\"`), false, `projection leaked ${key}`);
  }
}

function expectDomainError(action: () => unknown, code: string): void {
  assert.throws(action, (error: unknown) => {
    assert.equal(error instanceof DomainError, true);
    return error instanceof DomainError && error.code === code;
  });
}
