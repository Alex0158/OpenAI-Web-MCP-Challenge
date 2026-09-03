import { DatabaseSync } from "node:sqlite";
import { isAbsolute } from "node:path";

const OPTION_FIELDS = Object.freeze(["filename", "organizationId"]);
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;

/**
 * Read-only, redacted activity projection for the local Re-entry Cloud console.
 *
 * This is deliberately a product-layer read model. Receiver authority remains in ReceiverCore;
 * the console can observe lifecycle metadata but cannot mutate events, Grants, or deliveries.
 */
export class ReceiverActivityReader {
  #database;
  #statements;
  #organizationId;
  #closed = false;

  constructor(options) {
    requireExactRecord(options, OPTION_FIELDS, OPTION_FIELDS, "Receiver activity options");
    if (
      typeof options.filename !== "string" ||
      !isAbsolute(options.filename) ||
      options.filename.length > 4_096 ||
      options.filename.includes("\0")
    ) {
      throw new TypeError("Receiver activity filename must be an absolute path");
    }
    this.#organizationId = requireIdentifier(options.organizationId, "organizationId");
    this.#database = new DatabaseSync(options.filename);
    try {
      this.#database.exec("PRAGMA busy_timeout = 5000; PRAGMA query_only = ON");
      const select = `
        SELECT
          e.event_id,
          e.received_at,
          g.workflow_id,
          g.workflow_type,
          g.event_type,
          d.delivery_id,
          s.status AS delivery_status,
          s.current_attempt,
          s.maximum_attempts,
          s.leased_at,
          s.lease_expires_at,
          s.acknowledged_at,
          s.terminal_reason,
          s.updated_at
        FROM receiver_events e
        JOIN receiver_grants g ON g.grant_id = e.grant_id
        LEFT JOIN receiver_deliveries d ON d.event_id = e.event_id
        LEFT JOIN receiver_delivery_states s ON s.delivery_id = d.delivery_id
      `;
      this.#statements = {
        events: this.#database.prepare(`${select} ORDER BY e.received_at DESC, e.event_id DESC LIMIT ?`),
        pending: this.#database.prepare(`${select} WHERE s.status IN ('pending', 'leased', 'retry_exhausted') ORDER BY d.created_at ASC, d.delivery_id ASC LIMIT ?`),
        eventCount: this.#database.prepare("SELECT COUNT(*) AS count FROM receiver_events"),
        pendingCount: this.#database.prepare("SELECT COUNT(*) AS count FROM receiver_delivery_states WHERE status IN ('pending', 'leased', 'retry_exhausted')"),
      };
    } catch (error) {
      this.#database.close();
      this.#closed = true;
      throw error;
    }
  }

  snapshot(options = {}) {
    this.#assertOpen();
    requireExactRecord(options, ["limit"], [], "Receiver activity snapshot options");
    const limit = options.limit === undefined ? DEFAULT_LIMIT : requireLimit(options.limit);
    const events = this.#statements.events.all(limit).map((row) => redactRow(row));
    const pendingWork = this.#statements.pending.all(limit).map((row) => redactRow(row));
    return {
      available: true,
      receiver_scope: this.#organizationId,
      generated_at: new Date().toISOString(),
      counts: {
        events: Number(this.#statements.eventCount.get().count),
        pending_work: Number(this.#statements.pendingCount.get().count),
      },
      events,
      pending_work: pendingWork,
    };
  }

  close() {
    if (this.#closed) return;
    this.#database.close();
    this.#closed = true;
  }

  #assertOpen() {
    if (this.#closed) throw new Error("Receiver activity reader is closed");
  }
}

function redactRow(row) {
  return {
    event_id: requireIdentifier(row.event_id, "event_id"),
    event_type: requireIdentifier(row.event_type, "event_type"),
    workflow_id: requireIdentifier(row.workflow_id, "workflow_id"),
    workflow_type: requireIdentifier(row.workflow_type, "workflow_type"),
    received_at: requireTimestamp(row.received_at, "received_at"),
    delivery_id: row.delivery_id === null ? null : requireIdentifier(row.delivery_id, "delivery_id"),
    delivery_status: row.delivery_status === null ? null : requireIdentifier(row.delivery_status, "delivery_status"),
    attempt: Number(row.current_attempt ?? 0),
    maximum_attempts: Number(row.maximum_attempts ?? 0),
    leased_at: row.leased_at,
    lease_expires_at: row.lease_expires_at,
    acknowledged_at: row.acknowledged_at,
    terminal_reason: row.terminal_reason,
    updated_at: row.updated_at,
  };
}

function requireLimit(value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > MAX_LIMIT) {
    throw new TypeError("Receiver activity limit is invalid");
  }
  return value;
}

function requireIdentifier(value, label) {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value)) {
    throw new Error(`Receiver activity ${label} is invalid`);
  }
  return value;
}

function requireTimestamp(value, label) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    throw new Error(`Receiver activity ${label} is invalid`);
  }
  return value;
}

function requireExactRecord(value, allowedFields, requiredFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  const fields = Object.keys(value);
  if (fields.some((field) => !allowedFields.includes(field))) {
    throw new TypeError(`${label} contains an unsupported field`);
  }
  if (requiredFields.some((field) => !fields.includes(field))) {
    throw new TypeError(`${label} is missing a required field`);
  }
}
