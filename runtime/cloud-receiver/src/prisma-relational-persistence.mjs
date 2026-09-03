/**
 * @deprecated Historical hosted Cloud Receiver persistence adapter. Do not use for new
 * integrations or production.
 */
import { DatabaseSync } from "node:sqlite";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import prismaClientPackage from "@prisma/client";
import { createCloudReceiverHttpHandler } from "../../../reentry-core/src/cloud-receiver-http.mjs";
import { createProductPreviewComposition } from "./product-preview-composition.mjs";

const { PrismaClient } = prismaClientPackage;

const STORE_FILES = Object.freeze([
  ["receiver", "receiver.sqlite"],
  ["host-keys", "host-keys.sqlite"],
  ["accounts", "accounts.sqlite"],
  ["product", "product.sqlite"],
]);

const RELATIONAL_TABLES = Object.freeze([
  table("accounts", "reentry_accounts", "account", [
    "account_id", "identity", "credential_salt", "credential_digest", "created_at",
  ]),
  table("accounts", "reentry_organizations", "organization", [
    "organization_id", "account_id", "name", "created_at",
  ]),
  table("accounts", "reentry_api_keys", "apiKey", [
    "api_key_id", "organization_id", "key_digest", "key_prefix", "created_at", "revoked_at",
  ]),
  table("accounts", "reentry_sessions", "session", [
    "session_id", "account_id", "token_digest", "created_at", "expires_at",
  ]),
  table("host-keys", "cloud_pairing_sessions", "pairingSession", [
    "pairing_id", "organization_id", "host_subject_ref_digest", "subject_id",
    "delivery_target_id", "connector_id", "device_code_digest", "user_code_digest",
    "connector_token_digest", "status", "created_at", "expires_at", "claimed_at",
    "approved_at", "consumed_at",
  ]),
  table("host-keys", "cloud_connectors", "cloudConnector", [
    "connector_id", "organization_id", "subject_id", "delivery_target_id",
    "connector_token_digest", "created_at", "expires_at", "revoked_at",
  ]),
  table("host-keys", "cloud_host_subject_links", "hostSubjectLink", [
    "organization_id", "host_subject_ref_digest", "subject_id", "delivery_target_id",
    "connector_id", "created_at",
  ]),
  table("host-keys", "cloud_host_signing_keys", "hostSigningKey", [
    "organization_id", "host_id", "issuer_origin", "key_id", "public_key_pem", "created_at",
  ]),
  table("host-keys", "cloud_consent_sessions", "legacyConsentSession", [
    "consent_session_id", "organization_id", "challenge_id", "host_subject_ref_digest",
    "subject_id", "delivery_target_id", "consent_token_digest", "decision_id", "status",
    "created_at", "expires_at", "decision_action", "decided_at",
  ]),
  table("product", "product_device_authorizations", "deviceAuthorization", [
    "authorization_id", "device_code_digest", "browser_token_digest", "connector_id",
    "connector_token_digest", "subject_id", "delivery_target_id", "device_name", "account_id",
    "status", "created_at", "expires_at", "decided_at", "consumed_at",
  ]),
  table("product", "product_account_connectors", "accountConnector", [
    "connector_id", "account_id", "device_name", "subject_id", "delivery_target_id",
    "connector_token_digest", "created_at", "expires_at", "revoked_at",
  ]),
  table("product", "product_account_pairing_requests", "accountPairingRequest", [
    "pairing_id", "account_id", "pairing_code_digest", "connector_id", "connector_token_digest",
    "subject_id", "delivery_target_id", "device_name", "created_at", "expires_at", "consumed_at",
  ]),
  table("product", "product_account_host_subject_links", "accountHostSubjectLink", [
    "organization_id", "host_subject_ref_digest", "account_id", "subject_id",
    "delivery_target_id", "connector_id", "created_at",
  ]),
  table("product", "product_account_consent_sessions", "accountConsentSession", [
    "consent_session_id", "organization_id", "challenge_id", "host_subject_ref_digest",
    "consent_token_digest", "decision_id", "status", "account_id", "connector_id", "subject_id",
    "delivery_target_id", "created_at", "expires_at", "decision_action", "decided_at", "binding_json",
  ]),
  table("receiver", "receiver_challenges", "challenge", [
    "challenge_id", "manifest_id", "manifest_json", "expected_origin", "effective_expires_at",
    "status", "decision_id", "decision_action", "subject_id", "created_at", "decided_at",
  ]),
  table("receiver", "receiver_grants", "grant", [
    "grant_id", "challenge_id", "manifest_id", "binding_id", "subject_id", "delivery_target_id",
    "correlation_id", "issuer_origin", "workflow_type", "workflow_id", "event_type", "canonical_url",
    "expires_at", "human_boundary", "runs_remaining", "revoked_at", "receipt_json", "created_at",
  ]),
  table("receiver", "receiver_events", "event", [
    "event_id", "grant_id", "canonical_body", "acceptance_json", "received_at",
  ]),
  table("receiver", "receiver_deliveries", "delivery", [
    "delivery_id", "event_id", "grant_id", "delivery_target_id", "status", "created_at",
  ]),
  table("receiver", "receiver_delivery_states", "deliveryState", [
    "delivery_id", "status", "maximum_attempts", "current_attempt", "current_connector_id",
    "current_lease_token_digest", "leased_at", "lease_expires_at", "effect_id",
    "effect_attestation_json", "acknowledged_at", "terminal_reason", "updated_at",
  ]),
  table("receiver", "receiver_delivery_attempts", "deliveryAttempt", [
    "delivery_id", "attempt", "connector_id", "lease_token_digest", "leased_at", "lease_expires_at",
  ]),
]);

const ADVISORY_LOCK_SQL = "SELECT pg_try_advisory_xact_lock(hashtext('reentry-runtime-state-v7')) AS acquired";
const LOCK_RETRY_DELAYS_MS = Object.freeze([0, 100, 250, 500, 1000, 1500]);

export class CloudReceiverPersistenceBusyError extends Error {
  constructor(cause = undefined) {
    super("Cloud Receiver persistence is busy", cause === undefined ? undefined : { cause });
    this.name = "CloudReceiverPersistenceBusyError";
    this.code = "cloud_receiver_persistence_busy";
  }
}

export function createPrismaRelationalPersistence(options) {
  requireExactRecord(
    options,
    ["databaseUrl", "tokenSecret", "verificationOrigin", "prismaClient"],
    ["databaseUrl", "tokenSecret"],
    "Prisma persistence options",
  );
  const databaseUrl = requireText(options.databaseUrl, "DATABASE_URL");
  const prisma = options.prismaClient ?? new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
  const tokenSecret = requireText(options.tokenSecret, "Connector token secret");
  const verificationOrigin = options.verificationOrigin;
  let closed = false;

  return Object.freeze({ withComposition, ready, close });

  async function withComposition(callback, options = {}) {
    assertOpen();
    if (typeof callback !== "function") throw new TypeError("Prisma persistence callback is required");
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new TypeError("Prisma persistence execution options must be an object");
    }
    const readOnly = options.readOnly === true;
    let lastBusyError;
    for (const [attempt, delay] of LOCK_RETRY_DELAYS_MS.entries()) {
      if (delay > 0 && !readOnly) await new Promise((resolve) => setTimeout(resolve, delay));
      try {
        return await prisma.$transaction(async (transaction) => {
          if (!readOnly) {
            const lockResult = await transaction.$queryRawUnsafe(ADVISORY_LOCK_SQL);
            if (!hasAdvisoryLock(lockResult)) throw new CloudReceiverPersistenceBusyError();
          }

          const stateDirectory = await mkdtemp(join(tmpdir(), "reentry-cloud-"));
          const paths = new Map(STORE_FILES.map(([name, filename]) => [name, join(stateDirectory, filename)]));
          try {
            await initializeEphemeralStores(paths);
            const snapshots = await transaction.runtimeStoreSnapshot.findMany();
            if (snapshots.length > 0) {
              await hydrateSnapshots(snapshots, paths);
            } else {
              await hydrateRelationalTables(transaction, paths);
            }

            const composition = createProductPreviewComposition({
              receiverDatabasePath: paths.get("receiver"),
              pairingDatabasePath: paths.get("host-keys"),
              accountDatabasePath: paths.get("accounts"),
              productDatabasePath: paths.get("product"),
              tokenSecret,
              ...(verificationOrigin === undefined ? {} : { verificationOrigin }),
            });
            try {
              return await callback({
                composition,
                protocolHandler: createCloudReceiverHttpHandler({ receiver: composition.receiver }),
              });
            } finally {
              composition.close();
              if (!readOnly) {
                await persistRelationalTables(transaction, paths);
                await transaction.runtimeStoreSnapshot.deleteMany();
              }
            }
          } finally {
            await rm(stateDirectory, { recursive: true, force: true });
          }
        }, { maxWait: 10_000, timeout: 25_000 });
      } catch (error) {
        if (!(error instanceof CloudReceiverPersistenceBusyError)) {
          if (isLockTimeout(error)) throw new CloudReceiverPersistenceBusyError(error);
          throw error;
        }
        lastBusyError = error;
        if (readOnly || attempt === LOCK_RETRY_DELAYS_MS.length - 1) throw error;
      }
    }
    throw lastBusyError;
  }

  async function ready() {
    assertOpen();
    try {
      await prisma.$queryRawUnsafe("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }

  async function close() {
    if (closed) return;
    closed = true;
    if (typeof prisma.$disconnect === "function") await prisma.$disconnect();
  }

  function assertOpen() {
    if (closed) throw new Error("Prisma persistence is closed");
  }
}

// Kept as a source-compatible name for the previous hosted preview import.
export const createPrismaSnapshotPersistence = createPrismaRelationalPersistence;

async function initializeEphemeralStores(paths) {
  const composition = createProductPreviewComposition({
    receiverDatabasePath: paths.get("receiver"),
    pairingDatabasePath: paths.get("host-keys"),
    accountDatabasePath: paths.get("accounts"),
    productDatabasePath: paths.get("product"),
    tokenSecret: "temporary-relational-hydration-secret",
  });
  composition.close();
}

async function hydrateSnapshots(snapshots, paths) {
  for (const snapshot of snapshots) {
    const path = paths.get(snapshot.storeName);
    if (!path) continue;
    await writeFile(path, Buffer.from(snapshot.payload));
  }
}

async function hydrateRelationalTables(transaction, paths) {
  for (const specification of RELATIONAL_TABLES) {
    const rows = await transaction[specification.delegate].findMany();
    replaceSqliteTable(paths.get(specification.store), specification, rows);
  }
}

async function persistRelationalTables(transaction, paths) {
  for (const specification of [...RELATIONAL_TABLES].reverse()) {
    await transaction[specification.delegate].deleteMany();
  }
  for (const specification of RELATIONAL_TABLES) {
    const rows = readSqliteTable(paths.get(specification.store), specification);
    if (rows.length > 0) {
      await transaction[specification.delegate].createMany({ data: rows });
    }
  }
}

function replaceSqliteTable(path, specification, rows) {
  const database = new DatabaseSync(path);
  const tableName = quoteIdentifier(specification.sqliteTable);
  const columns = specification.columns.map(quoteIdentifier).join(", ");
  const placeholders = specification.columns.map(() => "?").join(", ");
  const insert = database.prepare(
    `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
  );
  try {
    database.exec("BEGIN IMMEDIATE");
    database.exec(`DELETE FROM ${tableName}`);
    for (const row of rows) insert.run(...specification.columns.map((column) => row[column]));
    database.exec("COMMIT");
  } catch (error) {
    try {
      database.exec("ROLLBACK");
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        "SQLite relational hydration and rollback both failed",
        { cause: error },
      );
    }
    throw error;
  } finally {
    database.close();
  }
}

function readSqliteTable(path, specification) {
  const database = new DatabaseSync(path);
  try {
    return database.prepare(`SELECT * FROM ${quoteIdentifier(specification.sqliteTable)}`).all();
  } finally {
    database.close();
  }
}

function table(store, sqliteTable, delegate, columns) {
  return Object.freeze({ store, sqliteTable, delegate, columns: Object.freeze(columns) });
}

function hasAdvisoryLock(result) {
  return Array.isArray(result) && result.length === 1 && result[0]?.acquired === true;
}

function quoteIdentifier(value) {
  if (typeof value !== "string" || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new TypeError("SQLite identifier is invalid");
  }
  return `"${value}"`;
}

function isLockTimeout(error) {
  if (error?.code === "55P03") return true;
  const details = [
    error?.message,
    error?.cause?.message,
    error?.meta?.message,
    error?.meta?.driverAdapterError?.cause?.message,
  ].filter((value) => typeof value === "string").join(" ");
  return /55P03|lock timeout|canceling statement due to lock/i.test(details);
}

function requireText(value, label) {
  if (typeof value !== "string" || value.length === 0 || value.length > 16_384) {
    throw new TypeError(`${label} is required`);
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
