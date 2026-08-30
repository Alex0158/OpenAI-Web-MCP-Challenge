import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { canonicalJson } from "../webmcp-manifest.mjs";
import { inTransaction } from "../database.mjs";

export function openDurableReceiptDestination(databasePath, { busyTimeoutMs = 5_000 } = {}) {
  if (typeof databasePath !== "string" || databasePath === ":memory:") {
    throw new Error("Durable receipt destination requires a filesystem database path");
  }
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA journal_mode = WAL;");
  if (!Number.isInteger(busyTimeoutMs) || busyTimeoutMs < 0 || busyTimeoutMs > 30_000) {
    throw new TypeError("SQLite busy timeout must be an integer from 0 to 30000 milliseconds");
  }
  if (busyTimeoutMs > 0) database.exec(`PRAGMA busy_timeout = ${busyTimeoutMs};`);
  database.exec(`
    CREATE TABLE IF NOT EXISTS durable_context_receipts (
      dispatch_id TEXT PRIMARY KEY,
      managed_context_kind TEXT NOT NULL,
      managed_context_id TEXT NOT NULL,
      receipt_digest TEXT NOT NULL,
      receipt_json TEXT NOT NULL,
      accepted_at TEXT NOT NULL
    );
  `);
  return database;
}

export class DurableContextReceiptSink {
  constructor({ database, clock = () => new Date(), faultInjector = null }) {
    this.database = database;
    this.clock = clock;
    this.faultInjector = faultInjector;
    this.name = "durable-context-receipt-sink";
  }

  async dispatchEnrollmentReceipt({
    dispatch_id: dispatchId,
    managed_context_kind: managedContextKind,
    managed_context_id: managedContextId,
    receipt,
    receipt_digest: receiptDigest,
  }) {
    for (const [field, value] of Object.entries({
      dispatch_id: dispatchId,
      managed_context_kind: managedContextKind,
      managed_context_id: managedContextId,
      receipt_digest: receiptDigest,
    })) requireText(value, field);
    const receiptJson = canonicalJson(receipt);
    const calculatedDigest = createHash("sha256").update(receiptJson).digest("base64url");
    if (calculatedDigest !== receiptDigest) {
      throw new DurableReceiptSinkError("Receipt digest does not match the dispatched payload", 409);
    }

    const acknowledgement = inTransaction(this.database, () => {
      const existing = this.database.prepare(`
        SELECT * FROM durable_context_receipts WHERE dispatch_id = ?
      `).get(dispatchId);
      if (existing) {
        if (
          existing.receipt_digest !== receiptDigest ||
          existing.managed_context_kind !== managedContextKind ||
          existing.managed_context_id !== managedContextId ||
          existing.receipt_json !== receiptJson
        ) {
          throw new DurableReceiptSinkError(
            "Dispatch ID was already used for a different receipt or destination",
            409,
          );
        }
        return buildAcknowledgement(existing, true);
      }
      const acceptedAt = this.clock().toISOString();
      this.database.prepare(`
        INSERT INTO durable_context_receipts (
          dispatch_id, managed_context_kind, managed_context_id,
          receipt_digest, receipt_json, accepted_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        dispatchId,
        managedContextKind,
        managedContextId,
        receiptDigest,
        receiptJson,
        acceptedAt,
      );
      return buildAcknowledgement({
        dispatch_id: dispatchId,
        receipt_digest: receiptDigest,
        accepted_at: acceptedAt,
      }, false);
    });

    this.faultInjector?.hit("after_destination_commit_before_ack", {
      dispatch_id: dispatchId,
      receipt_digest: receiptDigest,
    });
    return acknowledgement;
  }
}

function buildAcknowledgement(row, duplicate) {
  const value = {
    accepted: true,
    duplicate,
    dispatch_id: row.dispatch_id,
    receipt_digest: row.receipt_digest,
    accepted_at: row.accepted_at,
  };
  return {
    ...value,
    acknowledgement_digest: createHash("sha256")
      .update(canonicalJson(value))
      .digest("base64url"),
  };
}

function requireText(value, field) {
  if (typeof value !== "string" || value.length === 0 || value.length > 4096) {
    throw new TypeError(`${field} must be a bounded non-empty string`);
  }
}

export class DurableReceiptSinkError extends Error {
  constructor(message, statusCode = 422) {
    super(message);
    this.name = "DurableReceiptSinkError";
    this.statusCode = statusCode;
  }
}
