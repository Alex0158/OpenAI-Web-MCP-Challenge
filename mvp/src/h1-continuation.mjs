import { createHash } from "node:crypto";
import {
  AUTHORIZED_EVENT,
  DELIVERY_TICKET_SECRET,
  EFFECT_RECEIPT_SECRET,
  HUMAN_BOUNDARY,
  READY_STATE,
  WORKFLOW_ID,
} from "./config.mjs";
import { inTransaction } from "./database.mjs";
import { ConflictError } from "./domain.mjs";
import {
  signEffectReceipt,
  verifyDeliveryTicket,
  verifyEffectReceipt,
} from "./reentry-ticket.mjs";

export class H1ContinuationService {
  constructor({
    database,
    origin,
    trace,
    clock = () => new Date(),
    deliveryTicketSecret = DELIVERY_TICKET_SECRET,
    effectReceiptSecret = EFFECT_RECEIPT_SECRET,
  }) {
    this.database = database;
    this.origin = origin;
    this.trace = trace;
    this.clock = clock;
    this.deliveryTicketSecret = deliveryTicketSecret;
    this.effectReceiptSecret = effectReceiptSecret;
  }

  continueArtifact(input, correlationId) {
    requireExactKeys(input, [
      "content",
      "delivery_ticket",
      "expected_revision",
      "expected_state_version",
    ]);
    const {
      content,
      delivery_ticket: deliveryTicket,
      expected_state_version: expectedStateVersion,
      expected_revision: expectedRevision,
    } = input;
    requireNonEmptyText(content, "content");
    requireInteger(expectedStateVersion, "expected_state_version");
    requireInteger(expectedRevision, "expected_revision");
    const now = this.clock();
    const ticket = verifyDeliveryTicket(deliveryTicket, {
      secret: this.deliveryTicketSecret,
      now,
    });
    this.validateTicket(ticket);
    const requestHash = hashRequest({
      action: "continue_artifact",
      workflow_id: ticket.workflow_id,
      event_id: ticket.event_id,
      content,
    });

    const outcome = inTransaction(this.database, () => {
      const accepted = this.database.prepare(`
        SELECT
          d.status AS delivery_status,
          e.status AS event_status,
          e.raw_body,
          r.status AS run_status
        FROM heartbeat_deliveries d
        JOIN events e ON e.event_id = d.event_id
        JOIN runs r ON r.run_id = d.run_id
        WHERE d.delivery_id = ?
          AND d.event_id = ?
          AND d.run_id = ?
          AND d.grant_id = ?
          AND d.workflow_id = ?
      `).get(
        ticket.delivery_id,
        ticket.event_id,
        ticket.run_id,
        ticket.grant_id,
        ticket.workflow_id,
      );
      if (
        !accepted ||
        accepted.delivery_status !== "PENDING" ||
        accepted.event_status !== "PENDING_HEARTBEAT" ||
        accepted.run_status !== "PENDING_HEARTBEAT"
      ) {
        throw new ConflictError("Delivery ticket does not resolve to an accepted pending event");
      }
      const acceptedEvent = JSON.parse(accepted.raw_body);
      if (
        acceptedEvent.event_id !== ticket.event_id ||
        acceptedEvent.workflow_id !== ticket.workflow_id ||
        acceptedEvent.event_type !== ticket.event_type ||
        acceptedEvent.canonical_url !== ticket.canonical_url ||
        acceptedEvent.state_version !== ticket.state_version
      ) {
        throw new ConflictError("Delivery ticket does not match the accepted event record");
      }

      const existing = this.database.prepare(`
        SELECT * FROM workflow_effects WHERE event_id = ?
      `).get(ticket.event_id);
      if (existing) {
        if (existing.request_hash !== requestHash) {
          throw new ConflictError("Event was already applied with a different continuation request");
        }
        const receiptClaims = verifyEffectReceipt(existing.effect_receipt, {
          secret: this.effectReceiptSecret,
        });
        requireSameDelivery(ticket, receiptClaims);
        return {
          response: {
            ...JSON.parse(existing.result_json),
            effect_receipt: existing.effect_receipt,
            idempotent_replay: true,
          },
          applied: false,
        };
      }

      const binding = this.database.prepare(`
        SELECT g.grant_id, g.correlation_id, g.status, g.expires_at
        FROM host_bindings h
        JOIN grants g ON g.agent_binding = h.agent_binding
        WHERE h.workflow_id = ?
      `).get(WORKFLOW_ID);
      if (!binding || binding.grant_id !== ticket.grant_id || binding.status !== "ACTIVE") {
        throw new ConflictError("Delivery ticket does not match the active Host binding");
      }
      if (binding.correlation_id !== correlationId) {
        throw new ConflictError("Request correlation does not match the Grant flow");
      }
      if (Date.parse(binding.expires_at) <= now.getTime()) {
        throw new ConflictError("Grant is expired");
      }

      const workflowRow = this.database.prepare(`
        SELECT * FROM workflows WHERE workflow_id = ?
      `).get(WORKFLOW_ID);
      if (!workflowRow || workflowRow.state !== READY_STATE) {
        throw new ConflictError("Artifact continuation is only valid in READY");
      }
      if (workflowRow.state_version !== ticket.state_version || workflowRow.state_version !== expectedStateVersion) {
        throw new ConflictError("Workflow state version is stale");
      }
      if (workflowRow.artifact_revision !== expectedRevision) {
        throw new ConflictError("Artifact revision is stale");
      }
      if (workflowRow.committed) throw new ConflictError("Artifact is already committed");

      const nextRevision = expectedRevision + 1;
      const appliedAt = now.toISOString();
      const updated = this.database.prepare(`
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
        appliedAt,
        WORKFLOW_ID,
        READY_STATE,
        expectedStateVersion,
        expectedRevision,
      );
      if (updated.changes !== 1) {
        throw new ConflictError("Workflow state, artifact revision, or commit status changed during continuation");
      }
      const resultWorkflow = serializeWorkflow(this.database.prepare(`
        SELECT * FROM workflows WHERE workflow_id = ?
      `).get(WORKFLOW_ID));
      const effectReceipt = signEffectReceipt({
        event_id: ticket.event_id,
        run_id: ticket.run_id,
        delivery_id: ticket.delivery_id,
        grant_id: ticket.grant_id,
        workflow_id: ticket.workflow_id,
        request_hash: requestHash,
        result_revision: nextRevision,
        applied_at: appliedAt,
      }, { secret: this.effectReceiptSecret });
      const result = {
        workflow: resultWorkflow,
        effect: {
          event_id: ticket.event_id,
          request_hash: requestHash,
          prior_revision: expectedRevision,
          result_revision: nextRevision,
          applied_at: appliedAt,
          stopped_before: HUMAN_BOUNDARY,
        },
      };
      this.database.prepare(`
        INSERT INTO workflow_effects (
          event_id, workflow_id, request_hash, prior_revision, result_revision,
          result_json, effect_receipt, applied_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        ticket.event_id,
        ticket.workflow_id,
        requestHash,
        expectedRevision,
        nextRevision,
        JSON.stringify(result),
        effectReceipt,
        appliedAt,
      );
      return {
        response: {
          ...result,
          effect_receipt: effectReceipt,
          idempotent_replay: false,
        },
        applied: true,
      };
    });

    this.trace?.record({
      correlation_id: correlationId,
      component: "site_tool",
      action: "continue_artifact_h1",
      workflow_id: WORKFLOW_ID,
      grant_id: ticket.grant_id,
      event_id: ticket.event_id,
      run_id: ticket.run_id,
      outcome: "completed",
      details: {
        delivery_id: ticket.delivery_id,
        applied: outcome.applied,
        result_revision: outcome.response.effect.result_revision,
        stopped_before: HUMAN_BOUNDARY,
      },
    });
    return outcome.response;
  }

  validateTicket(ticket) {
    if (ticket.workflow_id !== WORKFLOW_ID) {
      throw new ConflictError("Delivery ticket workflow is outside scope");
    }
    if (ticket.event_type !== AUTHORIZED_EVENT) {
      throw new ConflictError("Delivery ticket event type is outside scope");
    }
    if (ticket.canonical_url !== `${this.origin}/workflows/${WORKFLOW_ID}`) {
      throw new ConflictError("Delivery ticket canonical URL is invalid");
    }
  }
}

function hashRequest(value) {
  return `sha256_${createHash("sha256").update(JSON.stringify(value)).digest("base64url")}`;
}

function requireSameDelivery(ticket, receipt) {
  for (const field of ["event_id", "run_id", "delivery_id", "grant_id", "workflow_id"]) {
    if (ticket[field] !== receipt[field]) {
      throw new ConflictError("Delivery ticket does not match the prior Host effect");
    }
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

function requireExactKeys(value, fields) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Continuation input must be an object");
  }
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((field, index) => field !== expected[index])) {
    throw new TypeError("Continuation fields do not match the strict H1 contract");
  }
}

function requireNonEmptyText(value, field) {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 16_384) {
    throw new TypeError(`${field} must be a bounded non-empty string`);
  }
}

function requireInteger(value, field) {
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(`${field} must be a non-negative integer`);
  }
}
