import { DatabaseSync } from "node:sqlite";

const SCHEMA_VERSION = 1;
const STORE_FIELDS = Object.freeze(["filename"]);
const DEVICE_AUTHORIZATION_FIELDS = Object.freeze([
  "authorization_id",
  "device_code_digest",
  "browser_token_digest",
  "connector_id",
  "connector_token_digest",
  "subject_id",
  "delivery_target_id",
  "device_name",
  "account_id",
  "status",
  "created_at",
  "expires_at",
  "decided_at",
  "consumed_at",
]);
const CONNECTOR_FIELDS = Object.freeze([
  "connector_id",
  "account_id",
  "device_name",
  "subject_id",
  "delivery_target_id",
  "connector_token_digest",
  "created_at",
  "expires_at",
  "revoked_at",
]);
const CONSENT_FIELDS = Object.freeze([
  "consent_session_id",
  "organization_id",
  "challenge_id",
  "host_subject_ref_digest",
  "consent_token_digest",
  "decision_id",
  "status",
  "account_id",
  "connector_id",
  "subject_id",
  "delivery_target_id",
  "created_at",
  "expires_at",
  "decision_action",
  "decided_at",
  "binding_json",
]);

const SCHEMA_SQL = `
CREATE TABLE product_device_authorizations (
  authorization_id TEXT PRIMARY KEY,
  device_code_digest TEXT NOT NULL UNIQUE,
  browser_token_digest TEXT NOT NULL UNIQUE,
  connector_id TEXT NOT NULL UNIQUE,
  connector_token_digest TEXT NOT NULL UNIQUE,
  subject_id TEXT NOT NULL UNIQUE,
  delivery_target_id TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL,
  account_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'denied', 'consumed')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  decided_at TEXT,
  consumed_at TEXT,
  CHECK (
    (status = 'pending' AND account_id IS NULL AND decided_at IS NULL AND consumed_at IS NULL)
    OR (status IN ('approved', 'denied') AND account_id IS NOT NULL AND decided_at IS NOT NULL AND consumed_at IS NULL)
    OR (status = 'consumed' AND account_id IS NOT NULL AND decided_at IS NOT NULL AND consumed_at IS NOT NULL)
  )
) STRICT;

CREATE INDEX product_device_authorizations_expiry
  ON product_device_authorizations(status, expires_at);

CREATE TABLE product_account_connectors (
  connector_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  delivery_target_id TEXT NOT NULL UNIQUE,
  connector_token_digest TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
) STRICT;

CREATE INDEX product_account_connectors_account
  ON product_account_connectors(account_id, created_at, connector_id);

CREATE TABLE product_account_host_subject_links (
  organization_id TEXT NOT NULL,
  host_subject_ref_digest TEXT NOT NULL,
  account_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  delivery_target_id TEXT NOT NULL,
  connector_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (organization_id, host_subject_ref_digest),
  FOREIGN KEY (connector_id) REFERENCES product_account_connectors(connector_id)
) STRICT;

CREATE INDEX product_account_host_subject_links_connector
  ON product_account_host_subject_links(connector_id, created_at);

CREATE TABLE product_account_consent_sessions (
  consent_session_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL UNIQUE,
  host_subject_ref_digest TEXT NOT NULL,
  consent_token_digest TEXT NOT NULL UNIQUE,
  decision_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'deciding', 'approved', 'declined')),
  account_id TEXT,
  connector_id TEXT,
  subject_id TEXT,
  delivery_target_id TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  decision_action TEXT,
  decided_at TEXT,
  binding_json TEXT,
  CHECK (
    (status = 'pending' AND account_id IS NULL AND connector_id IS NULL
      AND subject_id IS NULL AND delivery_target_id IS NULL
      AND decision_action IS NULL AND decided_at IS NULL AND binding_json IS NULL)
    OR (status = 'deciding' AND account_id IS NOT NULL AND subject_id IS NOT NULL
      AND decision_action IN ('approve', 'decline') AND decided_at IS NOT NULL
      AND binding_json IS NULL)
    OR (status = 'approved' AND account_id IS NOT NULL AND connector_id IS NOT NULL
      AND subject_id IS NOT NULL AND delivery_target_id IS NOT NULL
      AND decision_action = 'approve' AND decided_at IS NOT NULL AND binding_json IS NOT NULL)
    OR (status = 'declined' AND account_id IS NOT NULL AND subject_id IS NOT NULL
      AND decision_action = 'decline' AND decided_at IS NOT NULL AND binding_json IS NULL)
  )
) STRICT;

CREATE INDEX product_account_consent_sessions_organization
  ON product_account_consent_sessions(organization_id, created_at, consent_session_id);
`;

export class ProductFlowStore {
  #database;
  #statements;
  #closed = false;
  #inTransaction = false;

  constructor(options) {
    requireExactRecord(options, STORE_FIELDS, STORE_FIELDS, "Product flow store options");
    if (
      typeof options.filename !== "string" ||
      options.filename.length === 0 ||
      options.filename.length > 4_096 ||
      options.filename.includes("\0") ||
      !options.filename.startsWith("/")
    ) {
      throw new TypeError("Product flow store filename must be an absolute file-backed path");
    }
    this.#database = new DatabaseSync(options.filename);
    try {
      this.#configure();
      this.#initializeSchema();
      this.#statements = this.#prepareStatements();
    } catch (error) {
      this.#database.close();
      this.#closed = true;
      throw error;
    }
  }

  createDeviceAuthorization(value) {
    this.#assertOpen();
    requireDeviceAuthorization(value);
    this.#statements.insertDeviceAuthorization.run(
      ...DEVICE_AUTHORIZATION_FIELDS.map((field) => value[field]),
    );
  }

  getDeviceAuthorizationByDeviceDigest(value) {
    this.#assertOpen();
    return plainRow(this.#statements.deviceAuthorizationByDeviceDigest.get(value));
  }

  getDeviceAuthorizationByBrowserDigest(value) {
    this.#assertOpen();
    return plainRow(this.#statements.deviceAuthorizationByBrowserDigest.get(value));
  }

  approveDeviceAuthorization(authorizationId, accountId, decidedAt, connector) {
    this.#assertOpen();
    requireConnector(connector);
    return this.transaction((transaction) => {
      const current = transaction.getDeviceAuthorizationById(authorizationId);
      if (!current) return { status: "missing", duplicate: false };
      if (["approved", "consumed"].includes(current.status)) {
        if (current.account_id !== accountId || current.connector_id !== connector.connector_id) {
          throw storeConflict("device_authorization_identity_conflict");
        }
        return { status: current.status, duplicate: true, authorization: current };
      }
      if (current.status === "denied") return { status: "denied", duplicate: true, authorization: current };
      transaction.insertConnector(connector);
      if (!transaction.setDeviceAuthorizationApproved(authorizationId, accountId, decidedAt)) {
        throw storeConflict("device_authorization_race");
      }
      return {
        status: "approved",
        duplicate: false,
        authorization: transaction.getDeviceAuthorizationById(authorizationId),
      };
    });
  }

  denyDeviceAuthorization(authorizationId, accountId, decidedAt) {
    this.#assertOpen();
    return this.transaction((transaction) => {
      const current = transaction.getDeviceAuthorizationById(authorizationId);
      if (!current) return { status: "missing", duplicate: false };
      if (current.status !== "pending") {
        if (current.account_id !== accountId) {
          throw storeConflict("device_authorization_identity_conflict");
        }
        return { status: current.status, duplicate: true, authorization: current };
      }
      if (!transaction.setDeviceAuthorizationDenied(authorizationId, accountId, decidedAt)) {
        throw storeConflict("device_authorization_race");
      }
      return {
        status: "denied",
        duplicate: false,
        authorization: transaction.getDeviceAuthorizationById(authorizationId),
      };
    });
  }

  consumeDeviceAuthorization(authorizationId, consumedAt) {
    this.#assertOpen();
    return this.transaction((transaction) => {
      const current = transaction.getDeviceAuthorizationById(authorizationId);
      if (!current) return { status: "missing", duplicate: false };
      if (current.status === "consumed") return { status: "consumed", duplicate: true, authorization: current };
      if (current.status !== "approved") return { status: current.status, duplicate: false, authorization: current };
      if (!transaction.setDeviceAuthorizationConsumed(authorizationId, consumedAt)) {
        throw storeConflict("device_authorization_consumption_race");
      }
      return {
        status: "consumed",
        duplicate: false,
        authorization: transaction.getDeviceAuthorizationById(authorizationId),
      };
    });
  }

  getDeviceAuthorizationById(authorizationId) {
    this.#assertOpen();
    return plainRow(this.#statements.deviceAuthorizationById.get(authorizationId));
  }

  setDeviceAuthorizationApproved(authorizationId, accountId, decidedAt) {
    this.#assertWriteTransaction();
    return this.#statements.approveDeviceAuthorization.run(
      accountId,
      decidedAt,
      authorizationId,
    ).changes === 1;
  }

  setDeviceAuthorizationDenied(authorizationId, accountId, decidedAt) {
    this.#assertWriteTransaction();
    return this.#statements.denyDeviceAuthorization.run(
      accountId,
      decidedAt,
      authorizationId,
    ).changes === 1;
  }

  setDeviceAuthorizationConsumed(authorizationId, consumedAt) {
    this.#assertWriteTransaction();
    return this.#statements.consumeDeviceAuthorization.run(
      consumedAt,
      authorizationId,
    ).changes === 1;
  }

  insertConnector(value) {
    this.#assertWriteTransaction();
    requireConnector(value);
    this.#statements.insertConnector.run(...CONNECTOR_FIELDS.map((field) => value[field]));
  }

  getConnectorByTokenDigest(tokenDigest) {
    this.#assertOpen();
    return plainRow(this.#statements.connectorByTokenDigest.get(tokenDigest));
  }

  getAccountConnector(accountId, connectorId) {
    this.#assertOpen();
    return plainRow(this.#statements.connectorByAccountAndId.get(accountId, connectorId));
  }

  listAccountConnectors(accountId) {
    this.#assertOpen();
    return this.#statements.connectorsByAccount.all(accountId).map(plainRow);
  }

  bindHostSubject(value) {
    this.#assertOpen();
    requireHostSubjectLink(value);
    return this.transaction((transaction) => {
      const existing = transaction.getHostSubjectLink(
        value.organization_id,
        value.host_subject_ref_digest,
      );
      if (existing) {
        if (!sameHostSubjectLink(existing, value)) {
          throw storeConflict("host_subject_binding_conflict");
        }
        return { duplicate: true, record: existing };
      }
      transaction.insertHostSubjectLink(value);
      return {
        duplicate: false,
        record: transaction.getHostSubjectLink(
          value.organization_id,
          value.host_subject_ref_digest,
        ),
      };
    });
  }

  getHostSubjectLink(organizationId, hostSubjectRefDigest) {
    this.#assertOpen();
    return plainRow(this.#statements.hostSubjectLink.get(organizationId, hostSubjectRefDigest));
  }

  insertHostSubjectLink(value) {
    this.#assertWriteTransaction();
    requireHostSubjectLink(value);
    this.#statements.insertHostSubjectLink.run(
      value.organization_id,
      value.host_subject_ref_digest,
      value.account_id,
      value.subject_id,
      value.delivery_target_id,
      value.connector_id,
      value.created_at,
    );
  }

  createConsentSession(value) {
    this.#assertOpen();
    requireConsentSession(value);
    return this.transaction((transaction) => {
      const existing = transaction.getConsentSessionByChallengeId(value.challenge_id);
      if (existing) {
        if (!samePendingConsent(existing, value)) {
          throw storeConflict("consent_session_identity_conflict");
        }
        return { duplicate: true, record: existing };
      }
      transaction.insertConsentSession(value);
      return {
        duplicate: false,
        record: transaction.getConsentSessionByChallengeId(value.challenge_id),
      };
    });
  }

  getConsentSessionById(consentSessionId) {
    this.#assertOpen();
    return plainRow(this.#statements.consentSessionById.get(consentSessionId));
  }

  getConsentSessionByChallengeId(challengeId) {
    this.#assertOpen();
    return plainRow(this.#statements.consentSessionByChallengeId.get(challengeId));
  }

  getConsentSessionByTokenDigest(tokenDigest) {
    this.#assertOpen();
    return plainRow(this.#statements.consentSessionByTokenDigest.get(tokenDigest));
  }

  insertConsentSession(value) {
    this.#assertWriteTransaction();
    requireConsentSession(value);
    this.#statements.insertConsentSession.run(...CONSENT_FIELDS.map((field) => value[field]));
  }

  prepareConsentDecision(value) {
    this.#assertOpen();
    requireConsentDecision(value);
    return this.transaction((transaction) => {
      const current = transaction.getConsentSessionByChallengeId(value.challenge_id);
      if (!current) return null;
      if (current.status === "pending") {
        if (!transaction.setConsentDecision(value)) {
          throw storeConflict("consent_decision_race");
        }
        return transaction.getConsentSessionByChallengeId(value.challenge_id);
      }
      if (!samePreparedDecision(current, value)) {
        throw storeConflict("consent_decision_identity_conflict");
      }
      return current;
    });
  }

  setConsentDecision(value) {
    this.#assertWriteTransaction();
    requireConsentDecision(value);
    return this.#statements.prepareConsentDecision.run(
      value.account_id,
      value.connector_id,
      value.subject_id,
      value.delivery_target_id,
      value.action,
      value.decided_at,
      value.challenge_id,
    ).changes === 1;
  }

  finalizeConsentSession(challengeId, status, bindingJson) {
    this.#assertOpen();
    if (!['approved', 'declined'].includes(status)) {
      throw new TypeError("Consent session terminal status is invalid");
    }
    if ((status === "approved") !== (typeof bindingJson === "string")) {
      throw new TypeError("Consent session binding is invalid");
    }
    return this.transaction((transaction) => {
      const current = transaction.getConsentSessionByChallengeId(challengeId);
      if (!current) return null;
      if (current.status === status) {
        if ((current.binding_json ?? null) !== (bindingJson ?? null)) {
          throw storeConflict("consent_session_binding_conflict");
        }
        return current;
      }
      if (current.status !== "deciding") {
        throw storeConflict("consent_session_status_conflict");
      }
      if (!transaction.setConsentSessionStatus(challengeId, status, bindingJson ?? null)) {
        throw storeConflict("consent_session_status_race");
      }
      return transaction.getConsentSessionByChallengeId(challengeId);
    });
  }

  setConsentSessionStatus(challengeId, status, bindingJson) {
    this.#assertWriteTransaction();
    return this.#statements.finalizeConsentSession.run(
      status,
      bindingJson,
      challengeId,
    ).changes === 1;
  }

  transaction(callback) {
    this.#assertOpen();
    if (typeof callback !== "function") throw new TypeError("Product flow transaction callback is required");
    if (this.#inTransaction) throw new Error("Nested Product flow transactions are not supported");
    this.#database.exec("BEGIN IMMEDIATE");
    this.#inTransaction = true;
    try {
      const result = callback(this);
      if (result && typeof result.then === "function") {
        throw new TypeError("Product flow transaction callback must be synchronous");
      }
      this.#database.exec("COMMIT");
      return result;
    } catch (error) {
      try {
        this.#database.exec("ROLLBACK");
      } catch (rollbackError) {
        throw new AggregateError(
          [error, rollbackError],
          "Product flow transaction and rollback failed",
          { cause: error },
        );
      }
      throw error;
    } finally {
      this.#inTransaction = false;
    }
  }

  ready() {
    this.#assertOpen();
    return this.#database.prepare("SELECT 1 AS ready").get()?.ready === 1;
  }

  close() {
    if (this.#closed) return;
    if (this.#inTransaction) throw new Error("Cannot close Product flow store during a transaction");
    this.#database.close();
    this.#closed = true;
  }

  #configure() {
    this.#database.exec("PRAGMA foreign_keys = ON");
    this.#database.exec("PRAGMA busy_timeout = 5000");
    const journal = this.#database.prepare("PRAGMA journal_mode = WAL").get();
    if (String(journal?.journal_mode).toLowerCase() !== "wal") {
      throw new Error("Product flow store could not enable WAL journal mode");
    }
    this.#database.exec("PRAGMA synchronous = FULL");
  }

  #initializeSchema() {
    const version = this.#database.prepare("PRAGMA user_version").get()?.user_version;
    if (version === SCHEMA_VERSION) return;
    if (version !== 0) throw new Error(`Unsupported Product flow schema version: ${version}`);
    const existing = this.#database.prepare(
      "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' LIMIT 1",
    ).get();
    if (existing) throw new Error("Unversioned Product flow database is not empty");
    this.#database.exec("BEGIN IMMEDIATE");
    try {
      this.#database.exec(SCHEMA_SQL);
      this.#database.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
      this.#database.exec("COMMIT");
    } catch (error) {
      try {
        this.#database.exec("ROLLBACK");
      } catch (rollbackError) {
        throw new AggregateError([error, rollbackError], "Product flow schema rollback failed", {
          cause: error,
        });
      }
      throw error;
    }
  }

  #prepareStatements() {
    return {
      insertDeviceAuthorization: this.#database.prepare(`
        INSERT INTO product_device_authorizations (
          authorization_id, device_code_digest, browser_token_digest, connector_id,
          connector_token_digest, subject_id, delivery_target_id, device_name, account_id,
          status, created_at, expires_at, decided_at, consumed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      deviceAuthorizationById: this.#database.prepare(
        "SELECT * FROM product_device_authorizations WHERE authorization_id = ?",
      ),
      deviceAuthorizationByDeviceDigest: this.#database.prepare(
        "SELECT * FROM product_device_authorizations WHERE device_code_digest = ?",
      ),
      deviceAuthorizationByBrowserDigest: this.#database.prepare(
        "SELECT * FROM product_device_authorizations WHERE browser_token_digest = ?",
      ),
      approveDeviceAuthorization: this.#database.prepare(`
        UPDATE product_device_authorizations
        SET status = 'approved', account_id = ?, decided_at = ?
        WHERE authorization_id = ? AND status = 'pending'
      `),
      denyDeviceAuthorization: this.#database.prepare(`
        UPDATE product_device_authorizations
        SET status = 'denied', account_id = ?, decided_at = ?
        WHERE authorization_id = ? AND status = 'pending'
      `),
      consumeDeviceAuthorization: this.#database.prepare(`
        UPDATE product_device_authorizations
        SET status = 'consumed', consumed_at = ?
        WHERE authorization_id = ? AND status = 'approved'
      `),
      insertConnector: this.#database.prepare(`
        INSERT INTO product_account_connectors (
          connector_id, account_id, device_name, subject_id, delivery_target_id,
          connector_token_digest, created_at, expires_at, revoked_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      connectorByTokenDigest: this.#database.prepare(
        "SELECT * FROM product_account_connectors WHERE connector_token_digest = ?",
      ),
      connectorByAccountAndId: this.#database.prepare(`
        SELECT * FROM product_account_connectors
        WHERE account_id = ? AND connector_id = ?
      `),
      connectorsByAccount: this.#database.prepare(`
        SELECT * FROM product_account_connectors
        WHERE account_id = ?
        ORDER BY created_at ASC, connector_id ASC
      `),
      insertHostSubjectLink: this.#database.prepare(`
        INSERT INTO product_account_host_subject_links (
          organization_id, host_subject_ref_digest, account_id, subject_id,
          delivery_target_id, connector_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `),
      hostSubjectLink: this.#database.prepare(`
        SELECT * FROM product_account_host_subject_links
        WHERE organization_id = ? AND host_subject_ref_digest = ?
      `),
      insertConsentSession: this.#database.prepare(`
        INSERT INTO product_account_consent_sessions (
          consent_session_id, organization_id, challenge_id, host_subject_ref_digest,
          consent_token_digest, decision_id, status, account_id, connector_id,
          subject_id, delivery_target_id, created_at, expires_at, decision_action,
          decided_at, binding_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      consentSessionById: this.#database.prepare(
        "SELECT * FROM product_account_consent_sessions WHERE consent_session_id = ?",
      ),
      consentSessionByChallengeId: this.#database.prepare(
        "SELECT * FROM product_account_consent_sessions WHERE challenge_id = ?",
      ),
      consentSessionByTokenDigest: this.#database.prepare(
        "SELECT * FROM product_account_consent_sessions WHERE consent_token_digest = ?",
      ),
      prepareConsentDecision: this.#database.prepare(`
        UPDATE product_account_consent_sessions
        SET status = 'deciding', account_id = ?, connector_id = ?, subject_id = ?,
            delivery_target_id = ?, decision_action = ?, decided_at = ?
        WHERE challenge_id = ? AND status = 'pending'
      `),
      finalizeConsentSession: this.#database.prepare(`
        UPDATE product_account_consent_sessions
        SET status = ?, binding_json = ?
        WHERE challenge_id = ? AND status = 'deciding'
      `),
    };
  }

  #assertOpen() {
    if (this.#closed) throw new Error("Product flow store is closed");
  }

  #assertWriteTransaction() {
    this.#assertOpen();
    if (!this.#inTransaction) throw new Error("Product flow store write requires a transaction");
  }
}

function requireDeviceAuthorization(value) {
  requireExactRecord(
    value,
    DEVICE_AUTHORIZATION_FIELDS,
    DEVICE_AUTHORIZATION_FIELDS,
    "Device authorization",
  );
}

function requireConnector(value) {
  requireExactRecord(value, CONNECTOR_FIELDS, CONNECTOR_FIELDS, "Account Connector");
}

function requireHostSubjectLink(value) {
  requireExactRecord(
    value,
    [
      "organization_id",
      "host_subject_ref_digest",
      "account_id",
      "subject_id",
      "delivery_target_id",
      "connector_id",
      "created_at",
    ],
    [
      "organization_id",
      "host_subject_ref_digest",
      "account_id",
      "subject_id",
      "delivery_target_id",
      "connector_id",
      "created_at",
    ],
    "Account Host subject link",
  );
}

function requireConsentSession(value) {
  requireExactRecord(value, CONSENT_FIELDS, CONSENT_FIELDS, "Account consent session");
}

function requireConsentDecision(value) {
  requireExactRecord(
    value,
    [
      "challenge_id",
      "account_id",
      "connector_id",
      "subject_id",
      "delivery_target_id",
      "action",
      "decided_at",
    ],
    [
      "challenge_id",
      "account_id",
      "connector_id",
      "subject_id",
      "delivery_target_id",
      "action",
      "decided_at",
    ],
    "Account consent decision",
  );
}

function sameHostSubjectLink(left, right) {
  return [
    "organization_id",
    "host_subject_ref_digest",
    "account_id",
    "subject_id",
    "delivery_target_id",
    "connector_id",
  ].every((field) => left[field] === right[field]);
}

function samePendingConsent(left, right) {
  return [
    "consent_session_id",
    "organization_id",
    "challenge_id",
    "host_subject_ref_digest",
    "consent_token_digest",
    "decision_id",
    "created_at",
    "expires_at",
  ].every((field) => left[field] === right[field]);
}

function samePreparedDecision(record, value) {
  return record.account_id === value.account_id &&
    record.connector_id === value.connector_id &&
    record.subject_id === value.subject_id &&
    record.delivery_target_id === value.delivery_target_id &&
    record.decision_action === value.action &&
    record.decided_at === value.decided_at;
}

function plainRow(value) {
  return value === undefined ? null : { ...value };
}

function storeConflict(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function requireExactRecord(value, allowedFields, requiredFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${label} must be a plain object`);
  }
  const fields = Object.keys(value);
  if (fields.some((field) => !allowedFields.includes(field))) {
    throw new TypeError(`${label} contains an unsupported field`);
  }
  if (requiredFields.some((field) => !fields.includes(field))) {
    throw new TypeError(`${label} is missing a required field`);
  }
}
