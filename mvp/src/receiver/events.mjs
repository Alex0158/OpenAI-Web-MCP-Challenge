import { createHmac } from "node:crypto";
import {
  AUTHORIZED_EVENT,
  EVENT_CLOCK_SKEW_MS,
  EVENT_SECRET,
  READY_STATE,
  WORKFLOW_ID,
} from "../config.mjs";
import { createId } from "../ids.mjs";
import { inTransaction } from "../database.mjs";
import { signaturesMatch } from "../webmcp-manifest.mjs";
import { assertAdapterResult } from "../adapters/adapter-contract.mjs";

const EVENT_FIELDS = [
  "agent_binding",
  "canonical_url",
  "event_id",
  "event_sequence",
  "event_type",
  "occurred_at",
  "state_version",
  "workflow_id",
];

export function signEventBody(rawBody, timestamp, secret = EVENT_SECRET) {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("base64url");
}

export class EventReceiver {
  constructor({
    database,
    adapter,
    origin,
    trace,
    clock = () => new Date(),
    eventSecret = EVENT_SECRET,
    deliveryMode = "adapter",
  }) {
    if (!["adapter", "heartbeat"].includes(deliveryMode)) {
      throw new Error(`Unknown event delivery mode: ${deliveryMode}`);
    }
    this.database = database;
    this.adapter = adapter;
    this.origin = origin;
    this.trace = trace;
    this.clock = clock;
    this.eventSecret = eventSecret;
    this.deliveryMode = deliveryMode;
  }

  async receive({ rawBody, timestamp, signature, correlationId }) {
    this.verifyEnvelope(rawBody, timestamp, signature);
    const event = JSON.parse(rawBody);
    this.validateEvent(event);

    const reservation = inTransaction(this.database, () => {
      const existing = this.database.prepare(`
        SELECT e.raw_body, e.response_json, g.correlation_id
        FROM events e
        JOIN grants g ON g.grant_id = e.grant_id
        WHERE e.event_id = ?
      `).get(event.event_id);
      if (existing) {
        if (existing.correlation_id !== correlationId) {
          throw new EventScopeError("Event correlation does not match the Grant flow");
        }
        if (existing.raw_body !== rawBody) {
          throw new EventScopeError("Event ID was already used for a different payload");
        }
        return { duplicate: true, response: JSON.parse(existing.response_json) };
      }

      const grant = this.database.prepare(`
        SELECT * FROM grants WHERE agent_binding = ?
      `).get(event.agent_binding);
      if (!grant) throw new EventScopeError("Event binding does not resolve to a Grant");
      if (grant.correlation_id !== correlationId) {
        throw new EventScopeError("Event correlation does not match the Grant flow");
      }
      this.validateGrantAndState(grant, event);

      const runId = createId("run");
      const inbox = this.deliveryMode === "heartbeat"
        ? this.database.prepare(`
            SELECT * FROM heartbeat_inboxes
            WHERE grant_id = ? AND workflow_id = ? AND status = 'ACTIVE'
          `).get(grant.grant_id, event.workflow_id)
        : null;
      if (this.deliveryMode === "heartbeat" && !inbox) {
        throw new EventScopeError("Active heartbeat inbox was not found for the Grant");
      }
      if (inbox && Date.parse(inbox.expires_at) <= this.clock().getTime()) {
        throw new EventScopeError("Heartbeat inbox is expired");
      }
      const deliveryId = inbox ? createId("del") : null;
      const initialStatus = inbox ? "PENDING_HEARTBEAT" : "RESERVED";
      const initialResponse = {
        accepted: true,
        duplicate: false,
        event_id: event.event_id,
        run_id: runId,
        ...(deliveryId ? { delivery_id: deliveryId } : {}),
        status: initialStatus,
      };
      this.database.prepare(`
        INSERT INTO events (
          event_id, grant_id, workflow_id, event_sequence, raw_body, status,
          response_json, received_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        event.event_id,
        grant.grant_id,
        event.workflow_id,
        event.event_sequence,
        rawBody,
        initialStatus,
        JSON.stringify(initialResponse),
        this.clock().toISOString(),
      );
      this.database.prepare(`
        INSERT INTO runs (
          run_id, event_id, grant_id, managed_context_kind, managed_context_id,
          status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        runId,
        event.event_id,
        grant.grant_id,
        grant.managed_context_kind,
        grant.managed_context_id,
        initialStatus,
        this.clock().toISOString(),
      );
      if (inbox) {
        this.database.prepare(`
          INSERT INTO heartbeat_deliveries (
            delivery_id, event_id, run_id, inbox_id, grant_id, workflow_id,
            status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)
        `).run(
          deliveryId,
          event.event_id,
          runId,
          inbox.inbox_id,
          grant.grant_id,
          event.workflow_id,
          this.clock().toISOString(),
        );
      }
      this.database.prepare(`
        UPDATE grants SET runs_used = runs_used + 1 WHERE grant_id = ?
      `).run(grant.grant_id);
      return { duplicate: false, grant, runId, response: initialResponse };
    });

    if (reservation.duplicate) {
      this.record(event, correlationId, "duplicate_event", "accepted", {
        duplicate: true,
        run_id: reservation.response.run_id,
      });
      return { ...reservation.response, duplicate: true };
    }

    const { grant, runId } = reservation;
    this.record(event, correlationId, "reserve_run", "accepted", {
      grant_id: grant.grant_id,
      run_id: runId,
      delivery_mode: this.deliveryMode,
    });
    if (this.deliveryMode === "heartbeat") {
      return reservation.response;
    }
    const wakeInput = buildWakeInput(grant);

    try {
      const adapterResult = assertAdapterResult(await this.adapter.resumeContext({
        managedContextId: grant.managed_context_id,
        wakeInput,
        correlationId,
        grantId: grant.grant_id,
        eventId: event.event_id,
        runId,
      }));
      const publicAdapterResult = redactAdapterResult(adapterResult);
      const response = {
        accepted: true,
        duplicate: false,
        event_id: event.event_id,
        run_id: runId,
        status: "ADAPTER_PROBE_COMPLETED",
        adapter_result: publicAdapterResult,
      };
      inTransaction(this.database, () => {
        this.database.prepare(`
          UPDATE runs SET status = 'ADAPTER_PROBE_COMPLETED', adapter_result_json = ?, completed_at = ?
          WHERE run_id = ?
        `).run(JSON.stringify(adapterResult), this.clock().toISOString(), runId);
        this.database.prepare(`
          UPDATE events SET status = 'ADAPTER_PROBE_COMPLETED', response_json = ?
          WHERE event_id = ?
        `).run(JSON.stringify(response), event.event_id);
      });
      return response;
    } catch (error) {
      const response = {
        accepted: true,
        duplicate: false,
        event_id: event.event_id,
        run_id: runId,
        status: "ADAPTER_FAILED",
        error: error.message,
      };
      inTransaction(this.database, () => {
        this.database.prepare(`
          UPDATE runs SET status = 'ADAPTER_FAILED', adapter_result_json = ?, completed_at = ?
          WHERE run_id = ?
        `).run(JSON.stringify({ error: error.message }), this.clock().toISOString(), runId);
        this.database.prepare(`
          UPDATE events SET status = 'ADAPTER_FAILED', response_json = ? WHERE event_id = ?
        `).run(JSON.stringify(response), event.event_id);
      });
      throw error;
    }
  }

  verifyEnvelope(rawBody, timestamp, signature) {
    if (typeof rawBody !== "string" || !rawBody) throw new EventAuthenticationError("Event body is missing");
    if (!/^\d+$/.test(String(timestamp ?? ""))) throw new EventAuthenticationError("Event timestamp is invalid");
    const timestampMs = Number(timestamp) * 1000;
    if (Math.abs(this.clock().getTime() - timestampMs) > EVENT_CLOCK_SKEW_MS) {
      throw new EventAuthenticationError("Event timestamp is outside the accepted window");
    }
    const expected = signEventBody(rawBody, timestamp, this.eventSecret);
    if (!signaturesMatch(signature, expected)) throw new EventAuthenticationError("Event signature is invalid");
  }

  validateEvent(event) {
    if (!event || typeof event !== "object" || Array.isArray(event)) throw new EventScopeError("Event must be an object");
    const fields = Object.keys(event).sort();
    if (fields.length !== EVENT_FIELDS.length || fields.some((field, index) => field !== EVENT_FIELDS[index])) {
      throw new EventScopeError("Event fields do not match the strict contract");
    }
    if (event.workflow_id !== WORKFLOW_ID) throw new EventScopeError("Event workflow is outside scope");
    if (event.event_type !== AUTHORIZED_EVENT) throw new EventScopeError("Event type is outside scope");
    if (event.event_sequence !== 1) throw new EventScopeError("Event sequence is invalid");
    if (event.canonical_url !== `${this.origin}/workflows/${WORKFLOW_ID}`) {
      throw new EventScopeError("Event canonical URL is invalid");
    }
    if (!event.event_id || !event.agent_binding || !Number.isInteger(event.state_version)) {
      throw new EventScopeError("Event identity or state version is invalid");
    }
    if (typeof event.occurred_at !== "string") {
      throw new EventScopeError("Event occurrence time is invalid");
    }
    const occurredAt = Date.parse(event.occurred_at);
    if (
      !Number.isFinite(occurredAt) ||
      new Date(occurredAt).toISOString() !== event.occurred_at
    ) {
      throw new EventScopeError("Event occurrence time is invalid");
    }
  }

  validateGrantAndState(grant, event) {
    if (grant.status !== "ACTIVE") throw new EventScopeError("Grant is not active");
    if (Date.parse(grant.expires_at) <= this.clock().getTime()) throw new EventScopeError("Grant is expired");
    if (grant.runs_used >= grant.max_runs) throw new EventScopeError("Grant run budget is exhausted");
    if (grant.workflow_id !== event.workflow_id || grant.event_type !== event.event_type) {
      throw new EventScopeError("Event is outside Grant scope");
    }
    if (grant.canonical_url !== event.canonical_url) throw new EventScopeError("Event URL is outside Grant scope");
    const workflow = this.database.prepare(`
      SELECT state, state_version FROM workflows WHERE workflow_id = ?
    `).get(event.workflow_id);
    if (!workflow || workflow.state !== READY_STATE || workflow.state_version !== event.state_version) {
      throw new EventScopeError("Event does not match authoritative workflow state");
    }
  }

  record(event, correlationId, action, outcome, details) {
    this.trace?.record({
      correlation_id: correlationId,
      component: "receiver",
      action,
      workflow_id: event.workflow_id,
      event_id: event.event_id,
      outcome,
      details,
    });
  }
}

function redactAdapterResult(result) {
  const allowedFields = [
    "adapter",
    "proof_classification",
    "exact_binding_resolved",
    "real_codex_context_resumed",
    "prior_context_marker_recalled",
    "continuation_receipt_recalled",
    "turn_id",
    "desktop_followup_dispatched",
    "browser_reentry_requested",
    "browser_attached",
    "browser_contract_available",
    "genuine_site_tools_available",
  ];
  return Object.fromEntries(
    allowedFields
      .filter((field) => Object.hasOwn(result, field))
      .map((field) => [field, result[field]]),
  );
}

export function buildWakeInput(grant) {
  return [
    `The authorized ${grant.event_type} event has been accepted for the bound Grant.`,
    "Continue according to the validated re-entry receipt already stored in this managed context.",
    `Open ${grant.canonical_url}, read authoritative state from the page, and stop before ${grant.human_boundary}.`,
  ].join(" ");
}

export class EventAuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = "EventAuthenticationError";
    this.statusCode = 401;
  }
}

export class EventScopeError extends Error {
  constructor(message) {
    super(message);
    this.name = "EventScopeError";
    this.statusCode = 422;
  }
}
