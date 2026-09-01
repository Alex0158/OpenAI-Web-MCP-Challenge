import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { DomainError } from "../../src/server/domain/errors";
import { WorkflowApplication } from "../../src/server/application/workflow";
import {
  toAgentQueueView,
  toAgentRequestView,
  toTenantRequestView,
} from "../../src/server/application/workflow-views";
import type { Actor, WorkflowCommand, WorkflowState } from "../../src/server/domain/types";

const TENANT: Actor = { id: "tenant-demo", role: "tenant" };
const AGENT: Actor = { id: "agent-demo", role: "agent" };
const OTHER_TENANT: Actor = { id: "tenant-other", role: "tenant" };
const NOW = "2026-09-01T09:00:00.000Z";
const FIRST_TIME = "2026-09-03T10:00:00.000Z";
const SECOND_TIME = "2026-09-04T14:00:00.000Z";
const TEST_DIRECTORY = join(process.cwd(), "var/test");
let databaseSequence = 0;

mkdirSync(TEST_DIRECTORY, { recursive: true });

function databasePath(label: string): string {
  databaseSequence += 1;
  return join(TEST_DIRECTORY, `workflow-views-${process.pid}-${databaseSequence}-${label}.sqlite`);
}

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

function expectSuccess(outcome: ReturnType<WorkflowApplication["applyCommand"]>): WorkflowState {
  if (!outcome.ok) throw outcome.error;
  return outcome.state;
}

function createDraft(application: WorkflowApplication): WorkflowState {
  return expectSuccess(application.applyCommand({
    type: "CREATE_REQUEST_DRAFT",
    commandId: "create-1",
    actor: TENANT,
    fixtureGeneration: 1,
    requestId: "request-1",
    expectedRequestVersion: 0,
    listingId: "listing-primary",
    expectedListingVersion: 1,
    preferredTimes: [FIRST_TIME, SECOND_TIME],
  }, NOW));
}

function prepareProposal(application: WorkflowApplication): WorkflowState {
  let state = createDraft(application);
  state = expectSuccess(application.applyCommand(command("SUBMIT_REQUEST", {
    commandId: "submit-1",
    actor: TENANT,
    expectedRequestVersion: state.request?.version,
    expectedListingVersion: state.request?.listingVersion,
    listingId: state.request?.listingId,
  }), NOW));
  state = expectSuccess(application.applyCommand(command("START_AGENT_REVIEW", {
    commandId: "review-1",
    actor: AGENT,
    expectedRequestVersion: state.request?.version,
  }), NOW));
  return expectSuccess(application.applyCommand(command("PREPARE_AGENT_RESPONSE", {
    commandId: "prepare-1",
    actor: AGENT,
    expectedRequestVersion: state.request?.version,
    preparation: {
      kind: "SLOT_PROPOSAL",
      slotId: "slot-primary-1",
      tenantNote: "Please confirm this time.",
    },
    internalReviewNote: "First preference is available.",
  }), NOW));
}

test("workflow views represent empty tenant and agent states without exposing internals", () => {
  const application = new WorkflowApplication({
    databasePath: databasePath("empty"),
    initialTimestamp: NOW,
  });
  try {
    const before = application.readState();
    const tenant = toTenantRequestView(application.readTenantRequest(TENANT, NOW));
    const agent = toAgentQueueView(application.readAgentQueue(AGENT, NOW));

    assert.deepEqual(tenant, {
      fixtureGeneration: 1,
      request: null,
      listing: null,
      timeline: [],
    });
    assert.deepEqual(agent, {
      fixtureGeneration: 1,
      requests: [],
      counts: {
        TENANT_DRAFT: 0,
        REQUEST_SUBMITTED: 0,
        AGENT_REVIEWING: 0,
        SLOT_PROPOSED: 0,
        VIEWING_CONFIRMED: 0,
        TENANT_DECLINED: 0,
        EXPIRED: 0,
        AGENT_DECLINED: 0,
      },
    });
    assert.deepEqual(application.readState(), before);

    assert.throws(
      () => application.readTenantRequest(OTHER_TENANT, NOW),
      (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
    );
    assert.throws(
      () => application.readAgentQueue(TENANT, NOW),
      (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
    );
  } finally {
    application.close();
  }
});

test("tenant and agent views reduce projections to explicit role-safe DTOs", () => {
  const application = new WorkflowApplication({
    databasePath: databasePath("privacy"),
    initialTimestamp: NOW,
  });
  try {
    prepareProposal(application);
    const tenant = toTenantRequestView(application.readTenantRequest(TENANT, NOW));
    const agent = toAgentRequestView(application.readAgentProjection(AGENT, NOW));

    assert.equal(tenant.request?.state, "AGENT_REVIEWING");
    assert.equal(tenant.request?.version, 4);
    assert.equal(tenant.request?.response, undefined);
    assert.equal(tenant.request && "internalReviewNote" in tenant.request, false);
    assert.equal(tenant.request && "preparedResponse" in tenant.request, false);
    assert.equal(tenant.listing && "assignedAgentId" in tenant.listing, false);
    assert.equal(tenant.timeline[0] && "commandId" in tenant.timeline[0], false);
    assert.equal(tenant.timeline[0] && "actorId" in tenant.timeline[0], false);
    assert.equal(tenant.timeline[0] && "actorRole" in tenant.timeline[0], false);

    assert.equal(agent.request.internalReviewNote, "First preference is available.");
    assert.equal(agent.request.preparedResponse?.kind, "SLOT_PROPOSAL");
    assert.equal(agent.request.preparedResponse?.slotId, "slot-primary-1");
    assert.equal(agent.request && "tenantId" in agent.request, false);
    assert.equal(agent.request && "agentId" in agent.request, false);
    assert.equal(agent.listing && "assignedAgentId" in agent.listing, false);
    assert.equal(agent.availability[0] && "heldByRequestId" in agent.availability[0], false);

    const serializedTenant = JSON.stringify(tenant);
    const serializedAgent = JSON.stringify(agent);
    for (const serialized of [serializedTenant, serializedAgent]) {
      assert.equal(serialized.includes("processedCommands"), false);
      assert.equal(serialized.includes("commandId"), false);
      assert.equal(serialized.includes("actorId"), false);
      assert.equal(serialized.includes("tenant-demo"), false);
      assert.equal(serialized.includes("agent-demo"), false);
    }
  } finally {
    application.close();
  }
});

test("view mappers detach arrays and persist relevant expiry before mapping", () => {
  const application = new WorkflowApplication({
    databasePath: databasePath("detached-expiry"),
    initialTimestamp: NOW,
  });
  try {
    let state = prepareProposal(application);
    const mappedBeforeExpiry = toAgentRequestView(application.readAgentProjection(AGENT, NOW));
    mappedBeforeExpiry.request.preferredTimes[0] = "changed-locally";
    mappedBeforeExpiry.availability[0]!.status = "CONFIRMED";
    assert.equal(application.readState().request?.preferredTimes[0], FIRST_TIME);
    assert.equal(application.readState().slots[0]?.status, "AVAILABLE");

    state = expectSuccess(application.applyCommand(command("SEND_SLOT_PROPOSAL", {
      commandId: "send-1",
      actor: AGENT,
      expectedRequestVersion: state.request?.version,
    }), NOW));

    const expired = toTenantRequestView(application.readTenantRequest(
      TENANT,
      "2026-09-02T10:00:00.000Z",
    ));
    assert.equal(expired.request?.state, "EXPIRED");
    state = application.readState();
    assert.equal(state.request?.version, 6);
    assert.equal(state.slots[0]?.status, "AVAILABLE");
    assert.equal(expired.timeline.at(-1)?.operation, "EXPIRE_PROPOSAL");
  } finally {
    application.close();
  }
});
