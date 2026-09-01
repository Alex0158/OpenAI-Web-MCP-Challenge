import assert from "node:assert/strict";
import { test } from "node:test";

import { DomainError } from "../../src/server/domain/errors";
import { readAgentProjection, readTenantProjection } from "../../src/server/domain/projections";
import {
  createInitialWorkflowState,
  executeCommand,
  evaluateExpiry,
} from "../../src/server/domain/workflow";
import type {
  Actor,
  CommandOutcome,
  WorkflowCommand,
  WorkflowState,
} from "../../src/server/domain/types";

const TENANT: Actor = { id: "tenant-demo", role: "tenant" };
const AGENT: Actor = { id: "agent-demo", role: "agent" };
const OTHER_TENANT: Actor = { id: "tenant-other", role: "tenant" };
const OTHER_AGENT: Actor = { id: "agent-other", role: "agent" };
const NOW = "2026-09-01T09:00:00.000Z";
const LATER = "2026-09-01T10:00:00.000Z";
const FIRST_TIME = "2026-09-03T10:00:00.000Z";
const SECOND_TIME = "2026-09-04T10:00:00.000Z";

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

function createDraft(state = createInitialWorkflowState(), id = "create-1"): WorkflowState {
  const createCommand: Extract<WorkflowCommand, { type: "CREATE_REQUEST_DRAFT" }> = {
    type: "CREATE_REQUEST_DRAFT",
    commandId: id,
    actor: TENANT,
    fixtureGeneration: 1,
    requestId: "request-1",
    expectedRequestVersion: 0,
    listingId: "listing-primary",
    expectedListingVersion: 1,
    preferredTimes: [FIRST_TIME, SECOND_TIME],
  };
  return expectSuccess(executeCommand(state, createCommand, NOW));
}

function submit(state: WorkflowState, id = "submit-1"): WorkflowState {
  return expectSuccess(executeCommand(state, command("SUBMIT_REQUEST", {
    commandId: id,
    actor: TENANT,
    expectedRequestVersion: state.request?.version,
    expectedListingVersion: state.request?.listingVersion,
    listingId: state.request?.listingId,
  }), NOW));
}

function startReview(state: WorkflowState, id = "review-1"): WorkflowState {
  return expectSuccess(executeCommand(state, command("START_AGENT_REVIEW", {
    commandId: id,
    actor: AGENT,
    expectedRequestVersion: state.request?.version,
  }), NOW));
}

function prepareSlot(state: WorkflowState, id = "prepare-1", slotId = "slot-primary-1"): WorkflowState {
  return expectSuccess(executeCommand(state, command("PREPARE_AGENT_RESPONSE", {
    commandId: id,
    actor: AGENT,
    expectedRequestVersion: state.request?.version,
    preparation: { kind: "SLOT_PROPOSAL", slotId, tenantNote: "Please confirm this time." },
    internalReviewNote: "Matches the tenant's first preference.",
  }), NOW));
}

function sendSlot(state: WorkflowState, id = "send-1"): WorkflowState {
  return expectSuccess(executeCommand(state, command("SEND_SLOT_PROPOSAL", {
    commandId: id,
    actor: AGENT,
    expectedRequestVersion: state.request?.version,
  }), NOW));
}

function expectSuccess(outcome: CommandOutcome): WorkflowState {
  if (outcome.ok) return outcome.state;
  throw outcome.error;
}

function expectFailure(outcome: CommandOutcome, code: string): WorkflowState {
  if (outcome.ok) throw new Error("Expected command failure");
  assert.equal(outcome.error.code, code);
  assert.equal(outcome.error instanceof DomainError, true);
  assert.equal("stack" in outcome.error.toJSON(), false);
  return outcome.state;
}

test("proposal Happy Path preserves authoritative transitions and exact slot lifecycle", () => {
  let state = createDraft();
  assert.equal(state.request?.state, "TENANT_DRAFT");
  assert.equal(state.request?.version, 1);
  state = submit(state);
  state = startReview(state);
  state = prepareSlot(state);
  assert.equal(state.request?.state, "AGENT_REVIEWING");
  assert.equal(state.slots[0]?.status, "AVAILABLE");
  state = sendSlot(state);
  assert.equal(state.request?.state, "SLOT_PROPOSED");
  assert.equal(state.request?.proposalExpiresAt, "2026-09-02T09:00:00.000Z");
  assert.equal(state.slots[0]?.status, "HELD_FOR_PROPOSAL");
  assert.equal(state.slots[0]?.heldByRequestId, "request-1");

  const confirmed = executeCommand(state, command("CONFIRM_VIEWING", {
    commandId: "confirm-1",
    actor: TENANT,
    expectedRequestVersion: state.request?.version,
  }), LATER);
  state = expectSuccess(confirmed);
  assert.equal(state.request?.state, "VIEWING_CONFIRMED");
  assert.equal(state.slots[0]?.status, "CONFIRMED");
  assert.equal(state.slots[0]?.heldByRequestId, undefined);
});

test("agent decline requires preparation and reaches a terminal state", () => {
  let state = startReview(submit(createDraft()));
  const beforeSend = state.request?.version;
  state = expectSuccess(executeCommand(state, command("PREPARE_AGENT_RESPONSE", {
    commandId: "decline-prepare-1",
    actor: AGENT,
    expectedRequestVersion: beforeSend,
    preparation: { kind: "AGENT_DECLINE", tenantNote: "The requested times are unavailable." },
  }), NOW));
  assert.equal(state.request?.state, "AGENT_REVIEWING");
  state = expectSuccess(executeCommand(state, command("SEND_AGENT_DECLINE", {
    commandId: "decline-send-1",
    actor: AGENT,
    expectedRequestVersion: state.request?.version,
  }), NOW));
  assert.equal(state.request?.state, "AGENT_DECLINED");
  assert.equal(state.request?.sentResponse?.kind, "AGENT_DECLINE");
  assert.equal(state.request?.version, (beforeSend ?? 0) + 2);
});

test("tenant decline releases the exact held slot", () => {
  let state = sendSlot(prepareSlot(startReview(submit(createDraft()))));
  state = expectSuccess(executeCommand(state, command("DECLINE_VIEWING", {
    commandId: "tenant-decline-1",
    actor: TENANT,
    expectedRequestVersion: state.request?.version,
  }), NOW));
  assert.equal(state.request?.state, "TENANT_DECLINED");
  assert.equal(state.slots.find((slot) => slot.id === "slot-primary-1")?.status, "AVAILABLE");
});

test("expiry evaluates on relevant reads, releases the held slot, and is auditable", () => {
  const state = sendSlot(prepareSlot(startReview(submit(createDraft()))));
  const expired = evaluateExpiry(state, "2026-09-02T09:00:00.000Z");
  assert.equal(expired.changed, true);
  assert.equal(expired.state.request?.state, "EXPIRED");
  assert.equal(expired.state.request?.version, (state.request?.version ?? 0) + 1);
  assert.equal(expired.state.slots[0]?.status, "AVAILABLE");
  assert.equal(expired.state.audit.at(-1)?.operation, "EXPIRE_PROPOSAL");

  const tenantRead = readTenantProjection(state, TENANT, "2026-09-02T09:00:00.000Z");
  assert.equal(tenantRead.projection.request.state, "EXPIRED");
  assert.equal(tenantRead.state.slots[0]?.status, "AVAILABLE");
});

test("send rechecks exact slot availability and never substitutes another slot", () => {
  let state = prepareSlot(startReview(submit(createDraft())));
  state.slots[0]!.status = "CONFIRMED";
  const failed = executeCommand(state, command("SEND_SLOT_PROPOSAL", {
    commandId: "unavailable-send-1",
    actor: AGENT,
    expectedRequestVersion: state.request?.version,
  }), NOW);
  const unchanged = expectFailure(failed, "SLOT_UNAVAILABLE");
  assert.equal(unchanged.request?.state, "AGENT_REVIEWING");
  assert.equal(unchanged.request?.version, state.request?.version);
  assert.equal(unchanged.request?.preparedResponse?.kind, "SLOT_PROPOSAL");
  assert.equal(unchanged.slots[1]?.status, "AVAILABLE");
});

test("stale request version and fixture generation fail without mutation", () => {
  const state = submit(createDraft());
  const staleVersion = executeCommand(state, command("START_AGENT_REVIEW", {
    commandId: "stale-version-1",
    actor: AGENT,
    expectedRequestVersion: (state.request?.version ?? 0) - 1,
  }), NOW);
  const unchanged = expectFailure(staleVersion, "STALE_VERSION");
  assert.deepEqual(unchanged, state);

  const staleGeneration = executeCommand(state, command("START_AGENT_REVIEW", {
    commandId: "stale-generation-1",
    actor: AGENT,
    fixtureGeneration: 2,
    expectedRequestVersion: state.request?.version,
  }), NOW);
  expectFailure(staleGeneration, "FIXTURE_GENERATION_CONFLICT");
  assert.deepEqual(staleGeneration.state, state);
});

test("stale current listing revisions reject draft update and submit without mutation", () => {
  const state = createDraft();
  const staleListingState = JSON.parse(JSON.stringify(state)) as WorkflowState;
  const listing = staleListingState.listings.find((candidate) => candidate.id === "listing-primary");
  if (!listing) throw new Error("Expected primary listing fixture");
  listing.version = 2;

  const staleUpdate = executeCommand(staleListingState, command("UPDATE_REQUEST_DRAFT", {
    commandId: "stale-listing-update-1",
    expectedRequestVersion: staleListingState.request?.version,
    expectedListingVersion: 1,
    listingId: staleListingState.request?.listingId,
    preferredTimes: [FIRST_TIME],
  }), NOW);
  assert.deepEqual(expectFailure(staleUpdate, "STALE_VERSION"), staleListingState);

  const staleSubmit = executeCommand(staleListingState, command("SUBMIT_REQUEST", {
    commandId: "stale-listing-submit-1",
    expectedRequestVersion: staleListingState.request?.version,
    expectedListingVersion: 1,
    listingId: staleListingState.request?.listingId,
  }), NOW);
  assert.deepEqual(expectFailure(staleSubmit, "STALE_VERSION"), staleListingState);
});

test("invalid role, assignment, state, and arbitrary state are rejected", () => {
  const draft = createDraft();
  expectFailure(executeCommand(draft, command("SUBMIT_REQUEST", {
    commandId: "wrong-role-1",
    actor: AGENT,
    expectedRequestVersion: draft.request?.version,
    expectedListingVersion: draft.request?.listingVersion,
    listingId: draft.request?.listingId,
  }), NOW), "FORBIDDEN");
  expectFailure(executeCommand(draft, command("SUBMIT_REQUEST", {
    commandId: "wrong-tenant-1",
    actor: OTHER_TENANT,
    expectedRequestVersion: draft.request?.version,
    expectedListingVersion: draft.request?.listingVersion,
    listingId: draft.request?.listingId,
  }), NOW), "FORBIDDEN");

  const invalidState = structuredClone(draft);
  (invalidState.request as { state: string }).state = "MADE_UP_STATE";
  expectFailure(executeCommand(invalidState, command("SUBMIT_REQUEST", {
    commandId: "invalid-state-1",
    expectedRequestVersion: invalidState.request?.version,
    expectedListingVersion: invalidState.request?.listingVersion,
    listingId: invalidState.request?.listingId,
  }), NOW), "VALIDATION_FAILED");

  const terminal = sendSlot(prepareSlot(startReview(submit(createDraft()))));
  const confirmed = expectSuccess(executeCommand(terminal, command("CONFIRM_VIEWING", {
    commandId: "terminal-confirm-1",
    actor: TENANT,
    expectedRequestVersion: terminal.request?.version,
  }), NOW));
  expectFailure(executeCommand(confirmed, command("DECLINE_VIEWING", {
    commandId: "terminal-decline-1",
    actor: TENANT,
    expectedRequestVersion: confirmed.request?.version,
  }), NOW), "INVALID_TRANSITION");
});

test("bounded input and listing ownership are enforced", () => {
  const tooManyTimes = executeCommand(createInitialWorkflowState(), command("CREATE_REQUEST_DRAFT", {
    commandId: "too-many-times-1",
    listingId: "listing-primary",
    expectedListingVersion: 1,
    preferredTimes: [FIRST_TIME, SECOND_TIME, "2026-09-05T10:00:00.000Z", "2026-09-06T10:00:00.000Z"],
  }), NOW);
  expectFailure(tooManyTimes, "VALIDATION_FAILED");

  const badNote = executeCommand(createInitialWorkflowState(), command("CREATE_REQUEST_DRAFT", {
    commandId: "bad-note-1",
    listingId: "listing-primary",
    expectedListingVersion: 1,
    preferredTimes: [FIRST_TIME],
    tenantNote: "x".repeat(501),
  }), NOW);
  expectFailure(badNote, "VALIDATION_FAILED");

  const draft = createDraft();
  const wrongListing = executeCommand(draft, command("UPDATE_REQUEST_DRAFT", {
    commandId: "wrong-listing-1",
    expectedListingVersion: 1,
    expectedRequestVersion: draft.request?.version,
    listingId: "listing-north",
    preferredTimes: [FIRST_TIME],
  }), NOW);
  expectFailure(wrongListing, "VALIDATION_FAILED");

  const wrongSubmission = executeCommand(draft, command("SUBMIT_REQUEST", {
    commandId: "wrong-listing-submit-1",
    expectedRequestVersion: draft.request?.version,
    expectedListingVersion: 1,
    listingId: "listing-north",
  }), NOW);
  expectFailure(wrongSubmission, "VALIDATION_FAILED");

  const reviewing = startReview(submit(draft));
  const wrongSlot = executeCommand(reviewing, command("PREPARE_AGENT_RESPONSE", {
    commandId: "wrong-slot-prepare",
    actor: AGENT,
    expectedRequestVersion: reviewing.request?.version,
    preparation: { kind: "SLOT_PROPOSAL", slotId: "slot-unknown" },
  }), NOW);
  expectFailure(wrongSlot, "NOT_FOUND");
});

test("preparation is distinct from send and version/audit continuity is monotonic", () => {
  let state = createDraft();
  const versions = [state.request!.version];
  state = submit(state);
  versions.push(state.request!.version);
  state = startReview(state);
  versions.push(state.request!.version);
  state = prepareSlot(state);
  versions.push(state.request!.version);
  assert.deepEqual(versions, [1, 2, 3, 4]);
  assert.equal(state.audit.length, 4);
  assert.equal(state.slots[0]?.status, "AVAILABLE");
  state = sendSlot(state);
  assert.equal(state.request?.version, 5);
  assert.equal(state.audit.length, 5);
  assert.equal(state.request?.state, "SLOT_PROPOSED");
});

test("role projections keep private agent fields and unrelated data out of tenant view", () => {
  const state = sendSlot(prepareSlot(startReview(submit(createDraft()))));
  const tenant = readTenantProjection(state, TENANT, NOW);
  const agent = readAgentProjection(state, AGENT, NOW);
  assert.equal("internalReviewNote" in tenant.projection.request, false);
  assert.equal("preparedResponse" in tenant.projection.request, false);
  assert.equal("processedCommands" in tenant.projection, false);
  assert.equal(agent.projection.request.internalReviewNote, "Matches the tenant's first preference.");
  assert.equal(agent.projection.availability.length, 3);
  assert.equal("credentials" in agent.projection.request, false);
  assert.notEqual(tenant.projection.request.response, tenant.state.request?.sentResponse);
  assert.equal(tenant.projection.request.response?.tenantNote, "Please confirm this time.");
  tenant.projection.request.response!.tenantNote = "Tampered tenant view";
  assert.equal(tenant.state.request?.sentResponse?.tenantNote, "Please confirm this time.");
  assert.equal(state.request?.sentResponse?.tenantNote, "Please confirm this time.");
  expectThrowsProjection(() => readTenantProjection(state, OTHER_TENANT, NOW), "FORBIDDEN");
  expectThrowsProjection(() => readAgentProjection(state, OTHER_AGENT, NOW), "FORBIDDEN");
});

test("completed command retry is idempotent and conflicting reuse does not mutate", () => {
  const state = createDraft();
  const originalCommand = command("SUBMIT_REQUEST", {
    commandId: "idempotent-submit-1",
    expectedRequestVersion: state.request?.version,
    expectedListingVersion: state.request?.listingVersion,
    listingId: state.request?.listingId,
  }) as Extract<WorkflowCommand, { type: "SUBMIT_REQUEST" }>;
  const first = executeCommand(state, originalCommand, NOW);
  if (!first.ok) throw first.error;
  const retried = executeCommand(first.state, originalCommand, LATER);
  if (!retried.ok) throw retried.error;
  assert.equal(retried.result.idempotent, true);
  assert.deepEqual(retried.state, first.state);
  assert.equal(retried.state.audit.length, first.state.audit.length);
  assert.equal(retried.state.request?.version, first.state.request?.version);

  const conflict = executeCommand(first.state, {
    ...originalCommand,
    listingId: "listing-north",
  }, LATER);
  expectFailure(conflict, "COMMAND_CONFLICT");
  assert.deepEqual(conflict.state, first.state);
});

test("domain errors are serializable and do not expose diagnostics", () => {
  const outcome = executeCommand(createInitialWorkflowState(), command("START_AGENT_REVIEW", {
    commandId: "missing-request-1",
    actor: AGENT,
    expectedRequestVersion: 0,
  }), NOW);
  assert.equal(outcome.ok, false);
  if (outcome.ok) throw new Error("Expected failure");
  assert.deepEqual(outcome.error.toJSON(), {
    code: "NOT_FOUND",
    message: "Viewing request was not found",
  });
  assert.equal(JSON.stringify(outcome.error).includes("stack"), false);
});

function expectThrowsProjection(action: () => unknown, code: string): void {
  assert.throws(action, (error: unknown) => {
    assert.equal(error instanceof DomainError, true);
    return error instanceof DomainError && error.code === code;
  });
}
