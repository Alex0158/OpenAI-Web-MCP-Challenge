import assert from "node:assert/strict";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";

import { DomainError } from "../../src/server/domain/errors";
import { WorkflowApplication } from "../../src/server/application/workflow";
import {
  WorkflowPersistenceError,
  WORKFLOW_SNAPSHOT_TABLE,
} from "../../src/server/persistence/workflow-store";
import type {
  Actor,
  CommandOutcome,
  WorkflowCommand,
  WorkflowState,
} from "../../src/server/domain/types";

const TENANT: Actor = { id: "tenant-demo", role: "tenant" };
const AGENT: Actor = { id: "agent-demo", role: "agent" };
const OTHER_TENANT: Actor = { id: "tenant-other", role: "tenant" };
const NOW = "2026-09-01T09:00:00.000Z";
const LATER = "2026-09-01T10:00:00.000Z";
const EXPIRED = "2026-09-02T10:00:00.000Z";
const FIRST_TIME = "2026-09-03T10:00:00.000Z";
const SECOND_TIME = "2026-09-04T10:00:00.000Z";
const TEST_DIRECTORY = join(process.cwd(), "var/test");
let databaseSequence = 0;

mkdirSync(TEST_DIRECTORY, { recursive: true });

function databasePath(label: string): string {
  databaseSequence += 1;
  return join(TEST_DIRECTORY, `application-workflow-${process.pid}-${databaseSequence}-${label}.sqlite`);
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

function createDraft(app: WorkflowApplication, id = "create-1"): WorkflowState {
  expectSuccess(app.applyCommand({
    type: "CREATE_REQUEST_DRAFT",
    commandId: id,
    actor: TENANT,
    fixtureGeneration: 1,
    requestId: "request-1",
    expectedRequestVersion: 0,
    listingId: "listing-primary",
    expectedListingVersion: 1,
    preferredTimes: [FIRST_TIME, SECOND_TIME],
  }, NOW));
  return app.readState();
}

function submit(app: WorkflowApplication, state: WorkflowState, id = "submit-1"): WorkflowState {
  return expectSuccess(app.applyCommand(command("SUBMIT_REQUEST", {
    commandId: id,
    actor: TENANT,
    expectedRequestVersion: state.request?.version,
    expectedListingVersion: state.request?.listingVersion,
    listingId: state.request?.listingId,
  }), NOW));
}

function startReview(app: WorkflowApplication, state: WorkflowState): WorkflowState {
  return expectSuccess(app.applyCommand(command("START_AGENT_REVIEW", {
    commandId: "review-1",
    actor: AGENT,
    expectedRequestVersion: state.request?.version,
  }), NOW));
}

function sendProposal(app: WorkflowApplication, state: WorkflowState): WorkflowState {
  const prepared = expectSuccess(app.applyCommand(command("PREPARE_AGENT_RESPONSE", {
    commandId: "prepare-1",
    actor: AGENT,
    expectedRequestVersion: state.request?.version,
    preparation: { kind: "SLOT_PROPOSAL", slotId: "slot-primary-1", tenantNote: "Please confirm this time." },
    internalReviewNote: "Matches the tenant's first preference.",
  }), NOW));
  return expectSuccess(app.applyCommand(command("SEND_SLOT_PROPOSAL", {
    commandId: "send-1",
    actor: AGENT,
    expectedRequestVersion: prepared.request?.version,
  }), NOW));
}

function expectSuccess(outcome: CommandOutcome): WorkflowState {
  if (!outcome.ok) throw outcome.error;
  return outcome.state;
}

function expectDomainFailure(outcome: CommandOutcome, code: string): WorkflowState {
  if (outcome.ok) throw new Error("Expected command failure");
  assert.equal(outcome.error.code, code);
  assert.equal(outcome.error instanceof DomainError, true);
  return outcome.state;
}

function mutateSnapshot(path: string, mutate: (state: WorkflowState) => void): void {
  const database = new DatabaseSync(path);
  try {
    const row = database
      .prepare(`SELECT state_json FROM ${WORKFLOW_SNAPSHOT_TABLE} WHERE id = 1`)
      .get() as { state_json: string };
    const state = JSON.parse(row.state_json) as WorkflowState;
    mutate(state);
    database
      .prepare(`UPDATE ${WORKFLOW_SNAPSHOT_TABLE} SET state_json = ? WHERE id = 1`)
      .run(JSON.stringify(state));
  } finally {
    database.close();
  }
}

function installTrigger(path: string, triggerName: string, table: string): void {
  const database = new DatabaseSync(path);
  try {
    database.exec(`CREATE TRIGGER ${triggerName}
      BEFORE UPDATE ON ${table}
      BEGIN SELECT RAISE(ABORT, 'test transaction failure'); END;`);
  } finally {
    database.close();
  }
}

test("fresh open seeds one durable workflow snapshot at foundation generation one", () => {
  const path = databasePath("fresh");
  const app = new WorkflowApplication({ databasePath: path, initialTimestamp: NOW });
  try {
    const state = app.readState();
    assert.equal(existsSync(path), true);
    assert.equal(state.fixtureGeneration, 1);
    assert.equal(state.listings.length, 3);
    assert.equal(state.slots.length, 3);
    assert.equal(state.request, null);
    assert.deepEqual(state.audit, []);
    assert.deepEqual(state.processedCommands, []);
  } finally {
    app.close();
  }
});

test("commands survive close and reopen with audit and idempotency continuity", () => {
  const path = databasePath("reopen");
  const app = new WorkflowApplication({ databasePath: path, initialTimestamp: NOW });
  let submitted: WorkflowState;
  let submitCommand: WorkflowCommand;
  try {
    const draft = createDraft(app);
    submitted = submit(app, draft);
    submitCommand = command("SUBMIT_REQUEST", {
      commandId: "submit-1",
      actor: TENANT,
      expectedRequestVersion: draft.request?.version,
      expectedListingVersion: draft.request?.listingVersion,
      listingId: draft.request?.listingId,
    });
    assert.equal(submitted.request?.state, "REQUEST_SUBMITTED");
  } finally {
    app.close();
  }

  const reopened = new WorkflowApplication({ databasePath: path, initialTimestamp: NOW });
  try {
    assert.deepEqual(reopened.readState(), submitted!);
    const retried = reopened.applyCommand(submitCommand!, LATER);
    assert.equal(retried.ok, true);
    if (retried.ok) {
      assert.equal(retried.result.idempotent, true);
      assert.deepEqual(retried.state, submitted!);
      assert.equal(retried.state.audit.length, 2);
      assert.equal(retried.state.request?.version, 2);
    }
  } finally {
    reopened.close();
  }
});

test("stale request and listing revisions return domain failures without durable mutation", () => {
  const path = databasePath("stale");
  let app = new WorkflowApplication({ databasePath: path, initialTimestamp: NOW });
  try {
    const draft = createDraft(app);
    const staleRequest = app.applyCommand(command("UPDATE_REQUEST_DRAFT", {
      commandId: "stale-request-1",
      expectedRequestVersion: 0,
      expectedListingVersion: 1,
      listingId: draft.request?.listingId,
      preferredTimes: [FIRST_TIME],
    }), NOW);
    assert.deepEqual(expectDomainFailure(staleRequest, "STALE_VERSION"), draft);
    assert.deepEqual(app.readState(), draft);
    app.close();

    mutateSnapshot(path, (state) => {
      const listing = state.listings.find((candidate) => candidate.id === "listing-primary");
      if (!listing) throw new Error("Expected primary listing fixture");
      listing.version = 2;
    });

    app = new WorkflowApplication({ databasePath: path, initialTimestamp: NOW });
    const before = app.readState();
    const staleUpdate = app.applyCommand(command("UPDATE_REQUEST_DRAFT", {
      commandId: "stale-listing-update-1",
      expectedRequestVersion: before.request?.version,
      expectedListingVersion: 1,
      listingId: before.request?.listingId,
      preferredTimes: [FIRST_TIME],
    }), NOW);
    assert.deepEqual(expectDomainFailure(staleUpdate, "STALE_VERSION"), before);

    const staleSubmit = app.applyCommand(command("SUBMIT_REQUEST", {
      commandId: "stale-listing-submit-1",
      expectedRequestVersion: before.request?.version,
      expectedListingVersion: 1,
      listingId: before.request?.listingId,
    }), NOW);
    assert.deepEqual(expectDomainFailure(staleSubmit, "STALE_VERSION"), before);
    assert.deepEqual(app.readState(), before);
  } finally {
    app.close();
  }
});

test("projection reads delegate role privacy and persist expiry across reopen", () => {
  const path = databasePath("projection-expiry");
  let app = new WorkflowApplication({ databasePath: path, initialTimestamp: NOW });
  try {
    let state = createDraft(app);
    state = submit(app, state);
    state = startReview(app, state);
    state = sendProposal(app, state);
    const tenant = app.readTenantProjection(TENANT, NOW);
    const agent = app.readAgentProjection(AGENT, NOW);
    assert.equal(tenant.projection.request.state, "SLOT_PROPOSED");
    assert.equal(agent.projection.request.internalReviewNote, "Matches the tenant's first preference.");
    assert.equal("internalReviewNote" in tenant.projection.request, false);
    assert.equal("preparedResponse" in tenant.projection.request, false);
    assert.equal("credentials" in agent.projection.request, false);

    app.close();
    app = new WorkflowApplication({ databasePath: path, initialTimestamp: NOW });
    const expired = app.readTenantProjection(TENANT, EXPIRED);
    assert.equal(expired.projection.request.state, "EXPIRED");
    assert.equal(expired.state.request?.version, state.request!.version + 1);
    assert.equal(expired.state.slots[0]?.status, "AVAILABLE");
    assert.equal(expired.state.audit.at(-1)?.operation, "EXPIRE_PROPOSAL");
    app.close();

    app = new WorkflowApplication({ databasePath: path, initialTimestamp: NOW });
    const reopened = app.readState();
    assert.equal(reopened.request?.state, "EXPIRED");
    assert.equal(reopened.slots[0]?.status, "AVAILABLE");
    assert.equal(reopened.audit.at(-1)?.operation, "EXPIRE_PROPOSAL");
  } finally {
    app.close();
  }
});

test("reset preserves the database file, generation semantics, and reopen state", () => {
  const path = databasePath("reset");
  const app = new WorkflowApplication({ databasePath: path, initialTimestamp: NOW });
  try {
    createDraft(app);
    const initialFile = statSync(path);
    const first = app.reset(NOW);
    assert.equal(first.generation, 1);
    assert.equal(first.state.fixtureGeneration, 1);
    assert.equal(first.state.request, null);
    const second = app.reset(LATER);
    assert.equal(second.generation, 2);
    assert.equal(second.state.fixtureGeneration, 2);
    assert.equal(second.state.request, null);
    assert.deepEqual(second.state.audit, []);
    assert.deepEqual(second.state.processedCommands, []);
    assert.equal(statSync(path).ino, initialFile.ino);
  } finally {
    app.close();
  }

  const reopened = new WorkflowApplication({ databasePath: path, initialTimestamp: NOW });
  try {
    assert.equal(reopened.readState().fixtureGeneration, 2);
    assert.equal(reopened.readState().request, null);
  } finally {
    reopened.close();
  }
});

test("failed command and reset transactions roll back without partial state", () => {
  const commandPath = databasePath("command-rollback");
  let app = new WorkflowApplication({ databasePath: commandPath, initialTimestamp: NOW });
  const draft = createDraft(app);
  app.close();
  installTrigger(commandPath, "fail_snapshot_update", WORKFLOW_SNAPSHOT_TABLE);
  app = new WorkflowApplication({ databasePath: commandPath, initialTimestamp: NOW });
  try {
    assert.throws(
      () => app.applyCommand(command("SUBMIT_REQUEST", {
        commandId: "rollback-submit-1",
        expectedRequestVersion: draft.request?.version,
        expectedListingVersion: draft.request?.listingVersion,
        listingId: draft.request?.listingId,
      }), NOW),
      (error: unknown) => error instanceof WorkflowPersistenceError
        && error.message === "Workflow persistence failed"
        && !error.message.includes(commandPath),
    );
  } finally {
    app.close();
  }
  app = new WorkflowApplication({ databasePath: commandPath, initialTimestamp: NOW });
  try {
    assert.deepEqual(app.readState(), draft);
  } finally {
    app.close();
  }

  const resetPath = databasePath("reset-rollback");
  app = new WorkflowApplication({ databasePath: resetPath, initialTimestamp: NOW });
  const resetState = app.readState();
  app.close();
  installTrigger(resetPath, "fail_generation_update", "foundation_metadata");
  app = new WorkflowApplication({ databasePath: resetPath, initialTimestamp: NOW });
  try {
    assert.throws(
      () => app.reset(LATER),
      (error: unknown) => error instanceof WorkflowPersistenceError
        && error.message === "Workflow persistence failed"
        && !error.message.includes(resetPath),
    );
  } finally {
    app.close();
  }
  app = new WorkflowApplication({ databasePath: resetPath, initialTimestamp: NOW });
  try {
    assert.deepEqual(app.readState(), resetState);
  } finally {
    app.close();
  }
});

test("corrupt snapshots fail visibly without fallback or diagnostic leakage", () => {
  const path = databasePath("corrupt");
  const app = new WorkflowApplication({ databasePath: path, initialTimestamp: NOW });
  app.close();
  const database = new DatabaseSync(path);
  try {
    database
      .prepare(`UPDATE ${WORKFLOW_SNAPSHOT_TABLE} SET state_json = ? WHERE id = 1`)
      .run("{not-json");
  } finally {
    database.close();
  }

  assert.throws(
    () => new WorkflowApplication({ databasePath: path, initialTimestamp: NOW }),
    (error: unknown) => error instanceof WorkflowPersistenceError
      && error.message === "Workflow persistence failed"
      && !error.message.includes(path)
      && !error.message.includes("SQL"),
  );
});

test("application service keeps role authorization and bounded domain errors visible", () => {
  const path = databasePath("authorization");
  const app = new WorkflowApplication({ databasePath: path, initialTimestamp: NOW });
  try {
    const initial = app.readState();
    assert.throws(
      () => app.readTenantProjection(OTHER_TENANT, NOW),
      (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
    );
    const invalid = app.applyCommand(command("CREATE_REQUEST_DRAFT", {
      commandId: "invalid-input-1",
      preferredTimes: [FIRST_TIME, SECOND_TIME, FIRST_TIME, SECOND_TIME],
      listingId: "listing-primary",
      expectedListingVersion: 1,
    }), NOW);
    assert.deepEqual(expectDomainFailure(invalid, "VALIDATION_FAILED"), initial);
    assert.deepEqual(app.readState(), initial);
  } finally {
    app.close();
  }
});
