import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export function openDatabase(databasePath, {
  enableHeartbeat = false,
  enableDurableEnrollment = false,
  busyTimeoutMs = 0,
} = {}) {
  if (databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  if (!Number.isInteger(busyTimeoutMs) || busyTimeoutMs < 0 || busyTimeoutMs > 30_000) {
    throw new TypeError("SQLite busy timeout must be an integer from 0 to 30000 milliseconds");
  }
  if (busyTimeoutMs > 0) database.exec(`PRAGMA busy_timeout = ${busyTimeoutMs};`);
  migrate(database);
  if (enableHeartbeat) migrateHeartbeat(database);
  if (enableDurableEnrollment) migrateDurableEnrollment(database);
  return database;
}

function migrate(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      workflow_id TEXT PRIMARY KEY,
      state TEXT NOT NULL,
      state_version INTEGER NOT NULL,
      artifact_content TEXT NOT NULL,
      artifact_revision INTEGER NOT NULL,
      committed INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS manifests (
      manifest_id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      manifest_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (workflow_id) REFERENCES workflows(workflow_id)
    );

    CREATE TABLE IF NOT EXISTS binding_challenges (
      challenge_id TEXT PRIMARY KEY,
      manifest_id TEXT NOT NULL,
      correlation_id TEXT NOT NULL,
      managed_context_kind TEXT NOT NULL,
      managed_context_id TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      decided_at TEXT,
      FOREIGN KEY (manifest_id) REFERENCES manifests(manifest_id)
    );

    CREATE TABLE IF NOT EXISTS grants (
      grant_id TEXT PRIMARY KEY,
      challenge_id TEXT NOT NULL UNIQUE,
      correlation_id TEXT NOT NULL,
      agent_binding TEXT NOT NULL UNIQUE,
      workflow_id TEXT NOT NULL,
      issuer_origin TEXT NOT NULL,
      event_type TEXT NOT NULL,
      canonical_url TEXT NOT NULL,
      max_runs INTEGER NOT NULL,
      runs_used INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      continuation_intent_json TEXT NOT NULL,
      human_boundary TEXT NOT NULL,
      managed_context_kind TEXT NOT NULL,
      managed_context_id TEXT NOT NULL,
      receipt_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (challenge_id) REFERENCES binding_challenges(challenge_id),
      FOREIGN KEY (workflow_id) REFERENCES workflows(workflow_id)
    );

    CREATE TABLE IF NOT EXISTS context_captures (
      context_capture_id TEXT PRIMARY KEY,
      handle_digest TEXT NOT NULL UNIQUE,
      correlation_id TEXT NOT NULL,
      workflow_id TEXT NOT NULL,
      managed_context_kind TEXT NOT NULL,
      managed_context_id TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      consumed_at TEXT,
      consumed_by_challenge_id TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS host_bindings (
      workflow_id TEXT PRIMARY KEY,
      agent_binding TEXT NOT NULL UNIQUE,
      grant_summary_json TEXT NOT NULL,
      registered_at TEXT NOT NULL,
      FOREIGN KEY (workflow_id) REFERENCES workflows(workflow_id)
    );

    CREATE TABLE IF NOT EXISTS adapter_contexts (
      managed_context_id TEXT PRIMARY KEY,
      managed_context_kind TEXT NOT NULL,
      prior_evidence TEXT NOT NULL,
      receipt_json TEXT,
      resume_count INTEGER NOT NULL DEFAULT 0,
      last_wake_input TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      event_id TEXT PRIMARY KEY,
      grant_id TEXT NOT NULL,
      workflow_id TEXT NOT NULL,
      event_sequence INTEGER NOT NULL,
      raw_body TEXT NOT NULL,
      status TEXT NOT NULL,
      response_json TEXT NOT NULL,
      received_at TEXT NOT NULL,
      FOREIGN KEY (grant_id) REFERENCES grants(grant_id)
    );

    CREATE TABLE IF NOT EXISTS runs (
      run_id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL UNIQUE,
      grant_id TEXT NOT NULL,
      managed_context_kind TEXT NOT NULL,
      managed_context_id TEXT NOT NULL,
      status TEXT NOT NULL,
      adapter_result_json TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (event_id) REFERENCES events(event_id),
      FOREIGN KEY (grant_id) REFERENCES grants(grant_id)
    );

  `);

  addColumnIfMissing(database, "binding_challenges", "correlation_id", "TEXT");
  addColumnIfMissing(database, "grants", "correlation_id", "TEXT");
}

function migrateHeartbeat(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS heartbeat_inboxes (
      inbox_id TEXT PRIMARY KEY,
      handle_digest TEXT NOT NULL UNIQUE,
      grant_id TEXT NOT NULL UNIQUE,
      workflow_id TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (grant_id) REFERENCES grants(grant_id),
      FOREIGN KEY (workflow_id) REFERENCES workflows(workflow_id)
    );

    CREATE TABLE IF NOT EXISTS heartbeat_deliveries (
      delivery_id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL UNIQUE,
      run_id TEXT NOT NULL UNIQUE,
      inbox_id TEXT NOT NULL,
      grant_id TEXT NOT NULL,
      workflow_id TEXT NOT NULL,
      status TEXT NOT NULL,
      effect_receipt_digest TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (event_id) REFERENCES events(event_id),
      FOREIGN KEY (run_id) REFERENCES runs(run_id),
      FOREIGN KEY (inbox_id) REFERENCES heartbeat_inboxes(inbox_id),
      FOREIGN KEY (grant_id) REFERENCES grants(grant_id),
      FOREIGN KEY (workflow_id) REFERENCES workflows(workflow_id)
    );

    CREATE TABLE IF NOT EXISTS workflow_effects (
      event_id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      request_hash TEXT NOT NULL,
      prior_revision INTEGER NOT NULL,
      result_revision INTEGER NOT NULL,
      result_json TEXT NOT NULL,
      effect_receipt TEXT NOT NULL,
      applied_at TEXT NOT NULL,
      FOREIGN KEY (workflow_id) REFERENCES workflows(workflow_id)
    );
  `);
}

function migrateDurableEnrollment(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS heartbeat_receipt_outbox (
      dispatch_id TEXT PRIMARY KEY,
      grant_id TEXT NOT NULL UNIQUE,
      inbox_id TEXT NOT NULL UNIQUE,
      receipt_schema_version INTEGER NOT NULL,
      receipt_key_id TEXT NOT NULL,
      receipt_ciphertext BLOB,
      receipt_iv BLOB,
      receipt_auth_tag BLOB,
      receipt_digest TEXT NOT NULL,
      status TEXT NOT NULL,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      available_at TEXT NOT NULL,
      lease_token TEXT,
      lease_expires_at TEXT,
      destination_ack_digest TEXT,
      last_error_code TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      delivered_at TEXT,
      purged_at TEXT,
      FOREIGN KEY (grant_id) REFERENCES grants(grant_id),
      FOREIGN KEY (inbox_id) REFERENCES heartbeat_inboxes(inbox_id)
    );

    CREATE INDEX IF NOT EXISTS heartbeat_receipt_outbox_due
      ON heartbeat_receipt_outbox(status, available_at, lease_expires_at, created_at);
  `);
}

function addColumnIfMissing(database, table, column, type) {
  const exists = database.prepare(`PRAGMA table_info(${table})`).all()
    .some((candidate) => candidate.name === column);
  if (!exists) database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
}

export function inTransaction(database, operation) {
  database.exec("BEGIN IMMEDIATE");
  try {
    const result = operation();
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
