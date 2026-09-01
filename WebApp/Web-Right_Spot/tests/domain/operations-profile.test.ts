import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createInitialOperationsProfile,
  OperationsProfileValidationError,
  validateOperationsProfileState,
} from "../../src/server/domain/operations-profile";
import {
  OPERATIONS_AGENT_ID,
  OPERATIONS_DATA_AS_OF,
  OPERATIONS_OTHER_AGENT_ID,
  OPERATIONS_SCHEMA_VERSION,
  OPERATIONS_SEED_VERSION,
  OPERATIONS_SOURCE_REVISION,
  OPERATIONS_TIMEZONE,
} from "../../src/server/domain/operations-profile-types";

test("creates a deterministic multi-record authority with the accepted fixture coverage", () => {
  const first = createInitialOperationsProfile();
  const second = createInitialOperationsProfile();

  assert.deepEqual(first, second);
  assert.deepEqual(first.metadata, {
    profile: "operations",
    schemaVersion: OPERATIONS_SCHEMA_VERSION,
    fixtureGeneration: 1,
    seedVersion: OPERATIONS_SEED_VERSION,
    dataAsOf: OPERATIONS_DATA_AS_OF,
    sourceRevision: OPERATIONS_SOURCE_REVISION,
    timezone: OPERATIONS_TIMEZONE,
  });
  assert.equal(first.listings.length, 6);
  assert.equal(
    first.listings.filter((listing) => listing.assignedAgentId === OPERATIONS_AGENT_ID).length,
    5,
  );
  assert.equal(
    first.listings.filter((listing) => listing.assignedAgentId === OPERATIONS_OTHER_AGENT_ID).length,
    1,
  );
  assert.deepEqual(
    first.listings.map(({ id, publicationState, lifecycleState }) => ({
      id,
      publicationState,
      lifecycleState,
    })),
    [
      {
        id: "ops-listing-fresh-open",
        publicationState: "PUBLISHED",
        lifecycleState: "OPEN",
      },
      {
        id: "ops-listing-stale-open",
        publicationState: "PUBLISHED",
        lifecycleState: "OPEN",
      },
      {
        id: "ops-listing-unavailable",
        publicationState: "PUBLISHED",
        lifecycleState: "UNAVAILABLE",
      },
      {
        id: "ops-listing-let-agreed",
        publicationState: "PUBLISHED",
        lifecycleState: "LET_AGREED",
      },
      {
        id: "ops-listing-archived",
        publicationState: "UNPUBLISHED",
        lifecycleState: "ARCHIVED",
      },
      {
        id: "ops-listing-other-agent",
        publicationState: "PUBLISHED",
        lifecycleState: "OPEN",
      },
    ],
  );
  assert.deepEqual(
    first.requests.map(({ id, status, selectedSlotId }) => ({ id, status, selectedSlotId })),
    [
      {
        id: "ops-request-confirmed",
        status: "VIEWING_CONFIRMED",
        selectedSlotId: "ops-slot-confirmed-upcoming",
      },
      {
        id: "ops-request-proposed",
        status: "SLOT_PROPOSED",
        selectedSlotId: "ops-slot-proposed-upcoming",
      },
      {
        id: "ops-request-review",
        status: "AGENT_REVIEWING",
        selectedSlotId: undefined,
      },
      {
        id: "ops-request-terminal",
        status: "AGENT_DECLINED",
        selectedSlotId: undefined,
      },
    ],
  );
  assert.equal(first.slots.length, 7);
  assert.equal(first.slots.filter((slot) => slot.status === "AVAILABLE").length, 5);
  assert.equal(first.slots.some((slot) => slot.startsAt > OPERATIONS_DATA_AS_OF), true);
  assert.equal(first.slots.some((slot) => slot.endsAt < OPERATIONS_DATA_AS_OF), true);

  const serialized = JSON.stringify(first);
  assert.equal("counts" in first, false);
  for (const forbidden of [
    "tenantId",
    "contact",
    "email",
    "phone",
    "privateNote",
    "message",
    "favourite",
    "informationRequest",
    "history",
    "lease",
    "occupancy",
  ]) {
    assert.equal(serialized.toLowerCase().includes(forbidden.toLowerCase()), false, forbidden);
  }
});

test("accepts a valid profile and rejects invalid IDs, assignments, states, times, and links visibly", () => {
  const valid = createInitialOperationsProfile();
  assert.doesNotThrow(() => validateOperationsProfileState(valid));

  expectInvalid((state) => {
    state.listings[1]!.id = state.listings[0]!.id;
  });
  expectInvalid((state) => {
    state.listings[0]!.assignedAgentId = "agent-other";
  });
  expectInvalid((state) => {
    state.listings[0]!.publicationState = "UNPUBLISHED";
  });
  expectInvalid((state) => {
    state.listings[0]!.firstPublishedAt = "not-an-instant";
  });
  expectInvalid((state) => {
    state.slots[0]!.endsAt = state.slots[0]!.startsAt;
  });
  expectInvalid((state) => {
    state.requests[0]!.listingId = "missing-listing";
  });
  expectInvalid((state) => {
    state.requests[0]!.selectedSlotId = "ops-slot-available-upcoming";
  });
  expectInvalid((state) => {
    state.slots[0]!.selectedRequestId = "missing-request";
  });
  expectInvalid((state) => {
    state.requests[2]!.status = "UNSUPPORTED_STATUS" as typeof state.requests[2]["status"];
  });
  expectInvalid((state) => {
    (state.metadata as typeof state.metadata & { tenantId?: string }).tenantId = "tenant-real";
  });
});

test("preserves the assigned-agent field and validates selected slot status in both directions", () => {
  const state = createInitialOperationsProfile();
  assert.equal(state.listings.find((listing) => listing.id === "ops-listing-other-agent")?.assignedAgentId, OPERATIONS_OTHER_AGENT_ID);

  expectInvalid((candidate) => {
    candidate.requests[0]!.assignedAgentId = OPERATIONS_OTHER_AGENT_ID;
  });
  expectInvalid((candidate) => {
    candidate.slots[0]!.status = "HELD_FOR_PROPOSAL";
  });
  expectInvalid((candidate) => {
    candidate.requests[1]!.selectedSlotId = "ops-slot-confirmed-upcoming";
  });
  expectInvalid((candidate) => {
    candidate.slots[1]!.selectedRequestId = "ops-request-confirmed";
  });
});

test("rejects an available slot that references an unknown listing without a selected request", () => {
  const state = structuredClone(createInitialOperationsProfile());
  const slot = state.slots.find((candidate) => candidate.status === "AVAILABLE" && candidate.selectedRequestId === undefined);
  assert.ok(slot);

  slot.listingId = "missing-listing";

  assert.throws(
    () => validateOperationsProfileState(state),
    (error: unknown) => error instanceof OperationsProfileValidationError
      && error.code === "OPERATIONS_VALIDATION_FAILED",
  );
});

function expectInvalid(
  mutate: (state: ReturnType<typeof createInitialOperationsProfile>) => void,
): void {
  const state = structuredClone(createInitialOperationsProfile());
  mutate(state);
  assert.throws(
    () => validateOperationsProfileState(state),
    (error: unknown) => error instanceof OperationsProfileValidationError
      && error.code === "OPERATIONS_VALIDATION_FAILED",
  );
}
