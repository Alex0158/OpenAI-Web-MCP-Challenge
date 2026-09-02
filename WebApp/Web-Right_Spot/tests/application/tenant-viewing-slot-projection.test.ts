import assert from "node:assert/strict";
import { test } from "node:test";

import { DomainError } from "../../src/server/domain/errors";
import { readTenantProjection } from "../../src/server/domain/projections";
import {
  createInitialWorkflowState,
  executeCommand,
} from "../../src/server/domain/workflow";
import type {
  Actor,
  CommandOutcome,
  WorkflowCommand,
  WorkflowState,
} from "../../src/server/domain/types";

const TENANT: Actor = { id: "tenant-demo", role: "tenant" };
const AGENT: Actor = { id: "agent-demo", role: "agent" };
const NOW = "2026-09-01T09:00:00.000Z";
const FIRST_TIME = "2026-09-18T09:00:00.000Z";

function command(
  type: WorkflowCommand["type"],
  fields: Record<string, unknown> = {},
): WorkflowCommand {
  return {
    type,
    commandId: `${String(fields.requestId ?? "request-1")}-${String(fields.step ?? type)}-${String(fields.version ?? "1")}`,
    actor: fields.actor ?? TENANT,
    fixtureGeneration: fields.fixtureGeneration ?? 1,
    requestId: fields.requestId ?? "request-1",
    expectedRequestVersion: fields.expectedRequestVersion ?? 0,
    ...fields,
  } as WorkflowCommand;
}

function expectSuccess(outcome: CommandOutcome): WorkflowState {
  if (outcome.ok) return outcome.state;
  throw outcome.error;
}

function sentSlotProposal(slotId = "slot-primary-2"): WorkflowState {
  let state = createInitialWorkflowState();
  state = expectSuccess(executeCommand(state, {
    type: "CREATE_REQUEST_DRAFT",
    commandId: "create-1",
    actor: TENANT,
    fixtureGeneration: 1,
    requestId: "request-1",
    expectedRequestVersion: 0,
    listingId: "listing-primary",
    expectedListingVersion: 1,
    preferredTimes: [FIRST_TIME],
  }, NOW));
  state = expectSuccess(executeCommand(state, command("SUBMIT_REQUEST", {
    actor: TENANT,
    expectedRequestVersion: state.request?.version,
    expectedListingVersion: state.request?.listingVersion,
    listingId: state.request?.listingId,
  }), NOW));
  state = expectSuccess(executeCommand(state, command("START_AGENT_REVIEW", {
    actor: AGENT,
    expectedRequestVersion: state.request?.version,
  }), NOW));
  state = expectSuccess(executeCommand(state, command("PREPARE_AGENT_RESPONSE", {
    actor: AGENT,
    expectedRequestVersion: state.request?.version,
    preparation: { kind: "SLOT_PROPOSAL", slotId },
  }), NOW));
  return expectSuccess(executeCommand(state, command("SEND_SLOT_PROPOSAL", {
    actor: AGENT,
    expectedRequestVersion: state.request?.version,
  }), NOW));
}

type TenantProjectionWithViewingSlot = ReturnType<typeof readTenantProjection>["projection"] & {
  request: ReturnType<typeof readTenantProjection>["projection"]["request"] & {
    viewingSlot?: { startsAt: string; endsAt: string };
  };
};

test("tenant projection resolves the sent slot into tenant-safe viewing time facts", () => {
  const outcome = readTenantProjection(sentSlotProposal(), TENANT, NOW);
  const projection = outcome.projection as TenantProjectionWithViewingSlot;

  assert.deepEqual(projection.request.viewingSlot, {
    startsAt: "2026-09-04T14:00:00.000Z",
    endsAt: "2026-09-04T14:30:00.000Z",
  });
  assert.equal("status" in (projection.request.viewingSlot ?? {}), false);
  assert.equal("heldByRequestId" in (projection.request.viewingSlot ?? {}), false);
});

test("tenant projection rejects a sent slot that is missing or belongs to another listing", () => {
  const missingSlotState = sentSlotProposal();
  missingSlotState.slots = missingSlotState.slots.filter((slot) => slot.id !== "slot-primary-2");

  assert.throws(
    () => readTenantProjection(missingSlotState, TENANT, NOW),
    (error: unknown) => error instanceof DomainError && error.code === "NOT_FOUND",
  );

  const mismatchedSlotState = sentSlotProposal();
  const selectedSlot = mismatchedSlotState.slots.find((slot) => slot.id === "slot-primary-2");
  assert.ok(selectedSlot);
  selectedSlot.listingId = "listing-north";

  assert.throws(
    () => readTenantProjection(mismatchedSlotState, TENANT, NOW),
    (error: unknown) => error instanceof DomainError && error.code === "NOT_FOUND",
  );
});

test("tenant projection retains the selected viewing time across terminal outcomes", () => {
  const confirmedState = expectSuccess(executeCommand(
    sentSlotProposal(),
    command("CONFIRM_VIEWING", { actor: TENANT, expectedRequestVersion: 5 }),
    NOW,
  ));
  const declinedState = expectSuccess(executeCommand(
    sentSlotProposal(),
    command("DECLINE_VIEWING", { actor: TENANT, expectedRequestVersion: 5 }),
    NOW,
  ));

  for (const terminalState of [confirmedState, declinedState]) {
    const projection = readTenantProjection(terminalState, TENANT, NOW).projection as TenantProjectionWithViewingSlot;
    assert.deepEqual(projection.request.viewingSlot, {
      startsAt: "2026-09-04T14:00:00.000Z",
      endsAt: "2026-09-04T14:30:00.000Z",
    });
  }

  const expiredProjection = readTenantProjection(
    sentSlotProposal(),
    TENANT,
    "2026-09-03T09:00:00.000Z",
  ).projection as TenantProjectionWithViewingSlot;
  assert.equal(expiredProjection.request.state, "EXPIRED");
  assert.deepEqual(expiredProjection.request.viewingSlot, {
    startsAt: "2026-09-04T14:00:00.000Z",
    endsAt: "2026-09-04T14:30:00.000Z",
  });
});
