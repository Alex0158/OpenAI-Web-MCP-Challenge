import {
  AUTHORIZED_EVENT,
  HUMAN_BOUNDARY,
  INITIAL_STATE,
  READY_STATE,
  WORKFLOW_ID,
} from "./config.mjs";
import { createId } from "./ids.mjs";
import { inTransaction } from "./database.mjs";

export class WorkflowDomain {
  constructor({
    database,
    origin,
    trace,
    clock = () => new Date(),
    heartbeatEnabled = false,
    durableEnrollmentEnabled = false,
  }) {
    this.database = database;
    this.origin = origin;
    this.trace = trace;
    this.clock = clock;
    this.heartbeatEnabled = heartbeatEnabled;
    this.durableEnrollmentEnabled = durableEnrollmentEnabled;
  }

  ensureSeeded() {
    const existing = this.database.prepare(
      "SELECT workflow_id FROM workflows WHERE workflow_id = ?",
    ).get(WORKFLOW_ID);
    if (!existing) this.reset();
  }

  reset() {
    const now = this.clock().toISOString();
    inTransaction(this.database, () => {
      if (this.heartbeatEnabled) {
        if (this.durableEnrollmentEnabled) {
          this.database.exec("DELETE FROM heartbeat_receipt_outbox;");
        }
        this.database.exec(`
          DELETE FROM heartbeat_deliveries;
          DELETE FROM heartbeat_inboxes;
          DELETE FROM workflow_effects;
        `);
      }
      this.database.exec(`
        DELETE FROM runs;
        DELETE FROM events;
        DELETE FROM host_bindings;
        DELETE FROM grants;
        DELETE FROM binding_challenges;
        DELETE FROM context_captures;
        DELETE FROM manifests;
        DELETE FROM adapter_contexts;
        DELETE FROM workflows;
      `);
      this.database.prepare(`
        INSERT INTO workflows (
          workflow_id, state, state_version, artifact_content, artifact_revision,
          committed, updated_at
        ) VALUES (?, ?, 1, '', 0, 0, ?)
      `).run(WORKFLOW_ID, INITIAL_STATE, now);
    });
    return this.getWorkflow();
  }

  getWorkflow() {
    const row = this.database.prepare(
      "SELECT * FROM workflows WHERE workflow_id = ?",
    ).get(WORKFLOW_ID);
    if (!row) throw new Error("Workflow is not initialized");
    return serializeWorkflow(row);
  }

  prepareArtifact({ content, expected_revision: expectedRevision }, correlationId) {
    requireNonEmptyText(content, "content");
    requireInteger(expectedRevision, "expected_revision");
    const current = this.getWorkflow();
    if (current.state !== INITIAL_STATE) throw new ConflictError("Artifact preparation is only valid in INITIAL");
    if (current.artifact.revision !== expectedRevision) throw new ConflictError("Artifact revision is stale");

    const nextRevision = expectedRevision + 1;
    const updatedRows = this.database.prepare(`
      UPDATE workflows
      SET artifact_content = ?, artifact_revision = ?, updated_at = ?
      WHERE workflow_id = ?
        AND state = ?
        AND artifact_revision = ?
    `).run(
      content,
      nextRevision,
      this.clock().toISOString(),
      WORKFLOW_ID,
      INITIAL_STATE,
      expectedRevision,
    );
    if (updatedRows.changes !== 1) {
      throw new ConflictError("Workflow state or artifact revision changed during preparation");
    }
    const updated = this.getWorkflow();
    this.record("prepare_artifact", correlationId, "completed", {
      prior_revision: expectedRevision,
      artifact_revision: updated.artifact_revision,
    });
    return updated;
  }

  transitionToReady(correlationId) {
    const current = this.getWorkflow();
    if (current.state !== INITIAL_STATE) throw new ConflictError("Workflow has already transitioned");
    const binding = this.database.prepare(`
      SELECT h.agent_binding, g.correlation_id
      FROM host_bindings h
      JOIN grants g ON g.agent_binding = h.agent_binding
      WHERE h.workflow_id = ?
    `).get(WORKFLOW_ID);
    if (!binding) throw new ConflictError("Workflow has no registered re-entry binding");
    requireCorrelation(binding.correlation_id, correlationId);

    const updatedRows = this.database.prepare(`
      UPDATE workflows
      SET state = ?, state_version = state_version + 1, updated_at = ?
      WHERE workflow_id = ?
        AND state = ?
        AND state_version = ?
    `).run(
      READY_STATE,
      this.clock().toISOString(),
      WORKFLOW_ID,
      INITIAL_STATE,
      current.state_version,
    );
    if (updatedRows.changes !== 1) {
      throw new ConflictError("Workflow state changed during transition");
    }
    const updated = this.getWorkflow();
    const event = {
      event_id: createId("evt"),
      event_type: AUTHORIZED_EVENT,
      workflow_id: WORKFLOW_ID,
      agent_binding: binding.agent_binding,
      event_sequence: 1,
      state_version: updated.state_version,
      canonical_url: `${this.origin}/workflows/${WORKFLOW_ID}`,
      occurred_at: this.clock().toISOString(),
    };
    this.record("transition_ready", correlationId, "completed", {
      state: updated.state,
      state_version: updated.state_version,
      event_id: event.event_id,
    });
    return { workflow: updated, event };
  }

  continueArtifact({
    content,
    expected_state_version: expectedStateVersion,
    expected_revision: expectedRevision,
  }, correlationId) {
    requireNonEmptyText(content, "content");
    requireInteger(expectedStateVersion, "expected_state_version");
    requireInteger(expectedRevision, "expected_revision");
    const current = this.getWorkflow();
    if (current.state !== READY_STATE) throw new ConflictError("Artifact continuation is only valid in READY");
    if (current.state_version !== expectedStateVersion) throw new ConflictError("Workflow state version is stale");
    if (current.artifact.revision !== expectedRevision) throw new ConflictError("Artifact revision is stale");
    if (current.committed) throw new ConflictError("Artifact is already committed");
    const binding = this.database.prepare(`
      SELECT g.correlation_id
      FROM host_bindings h
      JOIN grants g ON g.agent_binding = h.agent_binding
      WHERE h.workflow_id = ?
    `).get(WORKFLOW_ID);
    if (!binding) throw new ConflictError("Workflow has no registered re-entry binding");
    requireCorrelation(binding.correlation_id, correlationId);

    const nextRevision = expectedRevision + 1;
    const updatedRows = this.database.prepare(`
      UPDATE workflows
      SET artifact_content = ?, artifact_revision = ?, updated_at = ?
      WHERE workflow_id = ?
        AND state = ?
        AND state_version = ?
        AND artifact_revision = ?
        AND committed = 0
    `).run(
      content,
      nextRevision,
      this.clock().toISOString(),
      WORKFLOW_ID,
      READY_STATE,
      expectedStateVersion,
      expectedRevision,
    );
    if (updatedRows.changes !== 1) {
      throw new ConflictError("Workflow state, artifact revision, or commit status changed during continuation");
    }
    const updated = this.getWorkflow();
    this.record("continue_artifact", correlationId, "completed", {
      prior_revision: expectedRevision,
      artifact_revision: updated.artifact_revision,
      stopped_before: HUMAN_BOUNDARY,
    });
    return updated;
  }

  commitByHuman(correlationId) {
    const current = this.getWorkflow();
    if (current.state !== READY_STATE) throw new ConflictError("Commit is only valid in READY");
    if (current.committed) throw new ConflictError("Artifact is already committed");
    const updatedRows = this.database.prepare(`
      UPDATE workflows
      SET committed = 1, updated_at = ?
      WHERE workflow_id = ?
        AND state = ?
        AND state_version = ?
        AND artifact_revision = ?
        AND committed = 0
    `).run(
      this.clock().toISOString(),
      WORKFLOW_ID,
      READY_STATE,
      current.state_version,
      current.artifact.revision,
    );
    if (updatedRows.changes !== 1) {
      throw new ConflictError("Workflow state or artifact revision changed during commit");
    }
    const updated = this.getWorkflow();
    this.record("human_commit", correlationId, "completed", { actor: "human_ui" });
    return updated;
  }

  siteToolNames() {
    const workflow = this.getWorkflow();
    const state = workflow.state;
    const shared = ["get_workflow_context"];
    if (state === INITIAL_STATE) {
      return [...shared, "prepare_artifact", "get_reentry_offer", "register_reentry_binding"];
    }
    if (state === READY_STATE && !workflow.human_boundary.committed) {
      return [...shared, "continue_artifact"];
    }
    return shared;
  }

  record(action, correlationId, outcome, details) {
    this.trace?.record({
      correlation_id: correlationId,
      component: action === "human_commit" ? "human_ui" : "site_tool",
      action,
      workflow_id: WORKFLOW_ID,
      outcome,
      details,
    });
  }
}

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConflictError";
    this.statusCode = 409;
  }
}

function serializeWorkflow(row) {
  return {
    workflow_id: row.workflow_id,
    state: row.state,
    state_version: row.state_version,
    artifact: {
      id: "continuation_note",
      content: row.artifact_content,
      revision: row.artifact_revision,
    },
    human_boundary: {
      id: HUMAN_BOUNDARY,
      committed: Boolean(row.committed),
      agent_callable: false,
    },
    updated_at: row.updated_at,
  };
}

function requireNonEmptyText(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}

function requireInteger(value, field) {
  if (!Number.isInteger(value) || value < 0) throw new TypeError(`${field} must be a non-negative integer`);
}

function requireCorrelation(expected, actual) {
  if (expected !== actual) throw new ConflictError("Request correlation does not match the Grant flow");
}
