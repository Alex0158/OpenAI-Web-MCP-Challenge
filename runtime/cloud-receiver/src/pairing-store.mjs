import { DatabaseSync } from "node:sqlite";

const SCHEMA_VERSION = 3;
const STORE_OPTION_FIELDS = Object.freeze(["filename"]);
const PAIRING_FIELDS = Object.freeze([
  "pairing_id",
  "organization_id",
  "host_subject_ref_digest",
  "subject_id",
  "delivery_target_id",
  "connector_id",
  "device_code_digest",
  "user_code_digest",
  "connector_token_digest",
  "status",
  "created_at",
  "expires_at",
  "claimed_at",
  "approved_at",
  "consumed_at",
]);
const HOST_KEY_FIELDS = Object.freeze([
  "organization_id",
  "host_id",
  "issuer_origin",
  "key_id",
  "public_key_pem",
  "created_at",
]);
const CONSENT_SESSION_FIELDS = Object.freeze([
  "consent_session_id",
  "organization_id",
  "challenge_id",
  "host_subject_ref_digest",
  "subject_id",
  "delivery_target_id",
  "consent_token_digest",
  "decision_id",
  "status",
  "created_at",
  "expires_at",
  "decision_action",
  "decided_at",
]);

const SCHEMA_SQL = `
CREATE TABLE cloud_pairing_sessions (
  pairing_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  host_subject_ref_digest TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  delivery_target_id TEXT NOT NULL,
  connector_id TEXT NOT NULL,
  device_code_digest TEXT NOT NULL UNIQUE,
  user_code_digest TEXT NOT NULL UNIQUE,
  connector_token_digest TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'consumed', 'expired')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  claimed_at TEXT,
  approved_at TEXT,
  consumed_at TEXT,
  CHECK (
    (status = 'pending' AND approved_at IS NULL AND consumed_at IS NULL)
    OR (status = 'approved' AND approved_at IS NOT NULL AND consumed_at IS NULL)
    OR (status = 'consumed' AND approved_at IS NOT NULL AND consumed_at IS NOT NULL)
    OR (status = 'expired' AND consumed_at IS NULL)
  )
) STRICT;

CREATE INDEX cloud_pairing_sessions_expiry
  ON cloud_pairing_sessions(status, expires_at);

CREATE INDEX cloud_pairing_sessions_host_subject
  ON cloud_pairing_sessions(organization_id, host_subject_ref_digest, created_at);

CREATE TABLE cloud_connectors (
  connector_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  delivery_target_id TEXT NOT NULL UNIQUE,
  connector_token_digest TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
) STRICT;

CREATE TABLE cloud_host_subject_links (
  organization_id TEXT NOT NULL,
  host_subject_ref_digest TEXT NOT NULL,
  subject_id TEXT NOT NULL UNIQUE,
  delivery_target_id TEXT NOT NULL UNIQUE,
  connector_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (organization_id, host_subject_ref_digest)
) STRICT;

CREATE TABLE cloud_host_signing_keys (
  organization_id TEXT NOT NULL,
  host_id TEXT NOT NULL,
  issuer_origin TEXT NOT NULL,
  key_id TEXT NOT NULL,
  public_key_pem TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (organization_id, host_id),
  UNIQUE (organization_id, issuer_origin, key_id)
) STRICT;

CREATE TABLE cloud_consent_sessions (
  consent_session_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL UNIQUE,
  host_subject_ref_digest TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  delivery_target_id TEXT NOT NULL,
  consent_token_digest TEXT NOT NULL UNIQUE,
  decision_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'deciding', 'approved', 'declined')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  decision_action TEXT,
  decided_at TEXT,
  CHECK (
    (status = 'pending' AND decision_action IS NULL AND decided_at IS NULL)
    OR (status IN ('deciding', 'approved', 'declined') AND decision_action IS NOT NULL AND decided_at IS NOT NULL)
  )
) STRICT;

CREATE INDEX cloud_consent_sessions_subject
  ON cloud_consent_sessions(organization_id, host_subject_ref_digest, created_at);
`;

export class PairingStore {
  #database;
  #statements;
  #closed = false;
  #inTransaction = false;

  constructor(options) {
    requireExactRecord(options, STORE_OPTION_FIELDS, STORE_OPTION_FIELDS, "Pairing store options");
    if (typeof options.filename !== "string" || options.filename.length === 0) {
      throw new TypeError("Pairing store filename must be a non-empty path");
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

  createPairingSession(value) {
    this.#assertOpen();
    requirePairing(value);
    this.#statements.insertPairing.run(...PAIRING_FIELDS.map((field) => value[field]));
  }

  getPairingByUserCodeDigest(digest) {
    this.#assertOpen();
    return plainRow(this.#statements.pairingByUserCodeDigest.get(digest));
  }

  getPairingByDeviceCodeDigest(digest) {
    this.#assertOpen();
    return plainRow(this.#statements.pairingByDeviceCodeDigest.get(digest));
  }

  getPairingByHostSubjectDigest(organizationId, hostSubjectRefDigest) {
    this.#assertOpen();
    return plainRow(
      this.#statements.pairingByHostSubjectDigest.get(organizationId, hostSubjectRefDigest),
    );
  }

  getHostSubjectLink(organizationId, hostSubjectRefDigest) {
    this.#assertOpen();
    return plainRow(this.#statements.hostSubjectLink.get(organizationId, hostSubjectRefDigest));
  }

  getConnectorByTokenDigest(tokenDigest) {
    this.#assertOpen();
    return plainRow(this.#statements.connectorByTokenDigest.get(tokenDigest));
  }

  getHostKeyByHostId(organizationId, hostId) {
    this.#assertOpen();
    return plainRow(this.#statements.hostKeyByHostId.get(organizationId, hostId));
  }

  getHostKeyByIssuer(organizationId, issuerOrigin, keyId) {
    this.#assertOpen();
    return plainRow(
      this.#statements.hostKeyByIssuer.get(organizationId, issuerOrigin, keyId),
    );
  }

  getHostKeysByIssuer(issuerOrigin, keyId) {
    this.#assertOpen();
    return this.#statements.hostKeysByIssuer.all(issuerOrigin, keyId).map(plainRow);
  }

  registerHostKey(value) {
    this.#assertOpen();
    requireHostKey(value);
    return this.transaction((transaction) => {
      const existingHost = transaction.getHostKeyByHostId(
        value.organization_id,
        value.host_id,
      );
      if (existingHost) {
        if (!sameHostKey(existingHost, value)) {
          throw pairingStoreConflict("host_key_identity_conflict");
        }
        return { duplicate: true, record: existingHost };
      }

      const existingIssuer = transaction.getHostKeyByIssuer(
        value.organization_id,
        value.issuer_origin,
        value.key_id,
      );
      if (existingIssuer) {
        throw pairingStoreConflict("host_key_identity_conflict");
      }

      transaction.insertHostKey(value);
      return {
        duplicate: false,
        record: transaction.getHostKeyByHostId(value.organization_id, value.host_id),
      };
    });
  }

  insertHostKey(value) {
    this.#assertWriteTransaction();
    requireHostKey(value);
    this.#statements.insertHostKey.run(...HOST_KEY_FIELDS.map((field) => value[field]));
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

  createConsentSession(value) {
    this.#assertOpen();
    requireConsentSession(value);
    return this.transaction((transaction) => {
      const existing = transaction.getConsentSessionByChallengeId(value.challenge_id);
      if (existing) {
        if (!sameConsentSession(existing, value)) {
          throw pairingStoreConflict("consent_session_identity_conflict");
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

  insertConsentSession(value) {
    this.#assertWriteTransaction();
    requireConsentSession(value);
    this.#statements.insertConsentSession.run(
      ...CONSENT_SESSION_FIELDS.map((field) => value[field]),
    );
  }

  prepareConsentDecision(value) {
    this.#assertOpen();
    requireConsentDecision(value);
    return this.transaction((transaction) => {
      const current = transaction.getConsentSessionByChallengeId(value.challenge_id);
      if (!current) return null;
      if (current.status === "pending") {
        const changed = transaction.setConsentDecision(value);
        if (!changed) throw pairingStoreConflict("consent_decision_race");
        return transaction.getConsentSessionByChallengeId(value.challenge_id);
      }
      if (
        current.decision_id !== value.decision_id ||
        current.decision_action !== value.action ||
        current.decided_at !== value.decided_at
      ) {
        throw pairingStoreConflict("consent_decision_identity_conflict");
      }
      return current;
    });
  }

  setConsentDecision(value) {
    this.#assertWriteTransaction();
    requireConsentDecision(value);
    return this.#statements.setConsentDecision.run(
      value.action,
      value.decision_id,
      value.decided_at,
      value.challenge_id,
    ).changes === 1;
  }

  finalizeConsentSession(challengeId, status) {
    this.#assertOpen();
    if (!['approved', 'declined'].includes(status)) {
      throw new TypeError("Consent session terminal status is invalid");
    }
    return this.transaction((transaction) => {
      const current = transaction.getConsentSessionByChallengeId(challengeId);
      if (!current) return null;
      if (current.status === status) return current;
      if (current.status !== "deciding") {
        throw pairingStoreConflict("consent_session_status_conflict");
      }
      const changed = transaction.setConsentSessionStatus(challengeId, status);
      if (!changed) throw pairingStoreConflict("consent_session_status_race");
      return transaction.getConsentSessionByChallengeId(challengeId);
    });
  }

  setConsentSessionStatus(challengeId, status) {
    this.#assertWriteTransaction();
    if (!['approved', 'declined'].includes(status)) {
      throw new TypeError("Consent session terminal status is invalid");
    }
    return this.#statements.setConsentSessionStatus.run(status, challengeId).changes === 1;
  }

  claimPairing(pairingId, claimedAt) {
    this.#assertOpen();
    const result = this.#statements.claimPairing.run(claimedAt, pairingId);
    return result.changes === 1;
  }

  insertConnector(value) {
    this.#assertWriteTransaction();
    requireConnector(value);
    this.#statements.insertConnector.run(
      value.connector_id,
      value.organization_id,
      value.subject_id,
      value.delivery_target_id,
      value.connector_token_digest,
      value.created_at,
      value.expires_at,
      value.revoked_at,
    );
  }

  insertHostSubjectLink(value) {
    this.#assertWriteTransaction();
    requireExactRecord(
      value,
      ["organization_id", "host_subject_ref_digest", "subject_id", "delivery_target_id", "connector_id", "created_at"],
      ["organization_id", "host_subject_ref_digest", "subject_id", "delivery_target_id", "connector_id", "created_at"],
      "Host subject link",
    );
    this.#statements.insertHostSubjectLink.run(
      value.organization_id,
      value.host_subject_ref_digest,
      value.subject_id,
      value.delivery_target_id,
      value.connector_id,
      value.created_at,
    );
  }

  setPairingApproved(pairingId, approvedAt) {
    this.#assertWriteTransaction();
    return this.#statements.setPairingApproved.run(approvedAt, pairingId).changes === 1;
  }

  approvePairing(pairingId, approvedAt, pairing, connector) {
    this.#assertOpen();
    requirePairing(pairing);
    requireConnector(connector);
    return this.transaction((transaction) => {
      const current = transaction.getPairingById(pairingId);
      if (!current) return { status: "missing", duplicate: false };
      if (current.status === "expired") {
        return { status: "expired", duplicate: false };
      }
      if (current.status === "approved" || current.status === "consumed") {
        return { status: "approved", duplicate: true, pairing: current };
      }
      const existing = transaction.getHostSubjectLink(
        current.organization_id,
        current.host_subject_ref_digest,
      );
      if (existing) {
        throw pairingStoreConflict("host_subject_already_paired");
      }
      transaction.insertConnector({
        ...connector,
        created_at: approvedAt,
      });
      transaction.insertHostSubjectLink({
        organization_id: current.organization_id,
        host_subject_ref_digest: current.host_subject_ref_digest,
        subject_id: current.subject_id,
        delivery_target_id: current.delivery_target_id,
        connector_id: current.connector_id,
        created_at: approvedAt,
      });
      const changed = transaction.setPairingApproved(pairingId, approvedAt);
      if (!changed) throw pairingStoreConflict("pairing_approval_race");
      return {
        status: "approved",
        duplicate: false,
        pairing: transaction.getPairingById(pairingId),
      };
    });
  }

  consumePairing(pairingId, consumedAt) {
    this.#assertOpen();
    const current = this.getPairingById(pairingId);
    if (!current) return { status: "missing", duplicate: false };
    if (current.status === "expired") return { status: "expired", duplicate: false };
    if (current.status === "pending") return { status: "pending", duplicate: false, pairing: current };
    if (current.status === "consumed") return { status: "consumed", duplicate: true, pairing: current };
    const changed = this.#statements.consumePairing.run(consumedAt, pairingId);
    if (changed.changes !== 1) throw pairingStoreConflict("pairing_consumption_race");
    return { status: "consumed", duplicate: false, pairing: this.getPairingById(pairingId) };
  }

  getPairingById(pairingId) {
    this.#assertOpen();
    return plainRow(this.#statements.pairingById.get(pairingId));
  }

  transaction(callback) {
    this.#assertOpen();
    if (typeof callback !== "function") throw new TypeError("Pairing transaction callback is required");
    if (this.#inTransaction) throw new Error("Nested pairing transactions are not supported");
    this.#database.exec("BEGIN IMMEDIATE");
    this.#inTransaction = true;
    try {
      const result = callback(this);
      if (result && typeof result.then === "function") {
        throw new TypeError("Pairing transaction callback must be synchronous");
      }
      this.#database.exec("COMMIT");
      return result;
    } catch (error) {
      try {
        this.#database.exec("ROLLBACK");
      } catch (rollbackError) {
        throw new AggregateError([error, rollbackError], "Pairing transaction and rollback failed", {
          cause: error,
        });
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
    if (this.#inTransaction) throw new Error("Cannot close Pairing store during a transaction");
    this.#database.close();
    this.#closed = true;
  }

  #configure() {
    this.#database.exec("PRAGMA foreign_keys = ON");
    this.#database.exec("PRAGMA busy_timeout = 5000");
    const journal = this.#database.prepare("PRAGMA journal_mode = WAL").get();
    if (String(journal?.journal_mode).toLowerCase() !== "wal") {
      throw new Error("Pairing store could not enable WAL journal mode");
    }
    this.#database.exec("PRAGMA synchronous = FULL");
    if (this.#database.prepare("PRAGMA synchronous").get()?.synchronous !== 2) {
      throw new Error("Pairing store could not enable full synchronous durability");
    }
  }

  #initializeSchema() {
    const version = this.#database.prepare("PRAGMA user_version").get()?.user_version;
    if (version === SCHEMA_VERSION) return;
    if (version === 1) {
      this.#schemaTransaction("migration", () => this.#database.exec(`
        CREATE TABLE IF NOT EXISTS cloud_host_signing_keys (
          organization_id TEXT NOT NULL,
          host_id TEXT NOT NULL,
          issuer_origin TEXT NOT NULL,
          key_id TEXT NOT NULL,
          public_key_pem TEXT NOT NULL,
          created_at TEXT NOT NULL,
          PRIMARY KEY (organization_id, host_id),
          UNIQUE (organization_id, issuer_origin, key_id)
        ) STRICT;

        CREATE TABLE IF NOT EXISTS cloud_consent_sessions (
          consent_session_id TEXT PRIMARY KEY,
          organization_id TEXT NOT NULL,
          challenge_id TEXT NOT NULL UNIQUE,
          host_subject_ref_digest TEXT NOT NULL,
          subject_id TEXT NOT NULL,
          delivery_target_id TEXT NOT NULL,
          consent_token_digest TEXT NOT NULL UNIQUE,
          decision_id TEXT NOT NULL UNIQUE,
          status TEXT NOT NULL CHECK (status IN ('pending', 'deciding', 'approved', 'declined')),
          created_at TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          decision_action TEXT,
          decided_at TEXT,
          CHECK (
            (status = 'pending' AND decision_action IS NULL AND decided_at IS NULL)
            OR (status IN ('deciding', 'approved', 'declined') AND decision_action IS NOT NULL AND decided_at IS NOT NULL)
          )
        ) STRICT;

        CREATE INDEX IF NOT EXISTS cloud_consent_sessions_subject
          ON cloud_consent_sessions(organization_id, host_subject_ref_digest, created_at);
      `));
      return;
    }
    if (version === 2) {
      this.#schemaTransaction("migration", () => this.#database.exec(`
        CREATE TABLE IF NOT EXISTS cloud_consent_sessions (
          consent_session_id TEXT PRIMARY KEY,
          organization_id TEXT NOT NULL,
          challenge_id TEXT NOT NULL UNIQUE,
          host_subject_ref_digest TEXT NOT NULL,
          subject_id TEXT NOT NULL,
          delivery_target_id TEXT NOT NULL,
          consent_token_digest TEXT NOT NULL UNIQUE,
          decision_id TEXT NOT NULL UNIQUE,
          status TEXT NOT NULL CHECK (status IN ('pending', 'deciding', 'approved', 'declined')),
          created_at TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          decision_action TEXT,
          decided_at TEXT,
          CHECK (
            (status = 'pending' AND decision_action IS NULL AND decided_at IS NULL)
            OR (status IN ('deciding', 'approved', 'declined') AND decision_action IS NOT NULL AND decided_at IS NOT NULL)
          )
        ) STRICT;

        CREATE INDEX IF NOT EXISTS cloud_consent_sessions_subject
          ON cloud_consent_sessions(organization_id, host_subject_ref_digest, created_at);
      `));
      return;
    }
    if (version !== 0) throw new Error(`Unsupported Pairing store schema version: ${version}`);
    const existingTable = this.#database.prepare(
      "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' LIMIT 1",
    ).get();
    if (existingTable) throw new Error("Unversioned Pairing store database is not empty");
    this.#database.exec("BEGIN IMMEDIATE");
    try {
      this.#database.exec(SCHEMA_SQL);
      this.#database.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
      this.#database.exec("COMMIT");
    } catch (error) {
      try {
        this.#database.exec("ROLLBACK");
      } catch (rollbackError) {
        throw new AggregateError([error, rollbackError], "Pairing schema setup and rollback failed", {
          cause: error,
        });
      }
      throw error;
    }
  }

  #prepareStatements() {
    return {
      insertPairing: this.#database.prepare(`
        INSERT INTO cloud_pairing_sessions (
          pairing_id, organization_id, host_subject_ref_digest, subject_id, delivery_target_id,
          connector_id, device_code_digest, user_code_digest, connector_token_digest, status,
          created_at, expires_at, claimed_at, approved_at, consumed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      pairingById: this.#database.prepare("SELECT * FROM cloud_pairing_sessions WHERE pairing_id = ?"),
      pairingByUserCodeDigest: this.#database.prepare(
        "SELECT * FROM cloud_pairing_sessions WHERE user_code_digest = ?",
      ),
      pairingByDeviceCodeDigest: this.#database.prepare(
        "SELECT * FROM cloud_pairing_sessions WHERE device_code_digest = ?",
      ),
      pairingByHostSubjectDigest: this.#database.prepare(`
        SELECT * FROM cloud_pairing_sessions
        WHERE organization_id = ? AND host_subject_ref_digest = ?
        ORDER BY created_at DESC, rowid DESC
        LIMIT 1
      `),
      claimPairing: this.#database.prepare(`
        UPDATE cloud_pairing_sessions
        SET claimed_at = COALESCE(claimed_at, ?)
        WHERE pairing_id = ? AND status = 'pending'
      `),
      setPairingApproved: this.#database.prepare(`
        UPDATE cloud_pairing_sessions
        SET status = 'approved', approved_at = ?
        WHERE pairing_id = ? AND status = 'pending'
      `),
      consumePairing: this.#database.prepare(`
        UPDATE cloud_pairing_sessions
        SET status = 'consumed', consumed_at = ?
        WHERE pairing_id = ? AND status = 'approved'
      `),
      insertConnector: this.#database.prepare(`
        INSERT INTO cloud_connectors (
          connector_id, organization_id, subject_id, delivery_target_id,
          connector_token_digest, created_at, expires_at, revoked_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `),
      connectorByTokenDigest: this.#database.prepare(
        "SELECT * FROM cloud_connectors WHERE connector_token_digest = ?",
      ),
      insertHostSubjectLink: this.#database.prepare(`
        INSERT INTO cloud_host_subject_links (
          organization_id, host_subject_ref_digest, subject_id, delivery_target_id,
          connector_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `),
      hostSubjectLink: this.#database.prepare(`
        SELECT * FROM cloud_host_subject_links
        WHERE organization_id = ? AND host_subject_ref_digest = ?
      `),
      hostKeyByHostId: this.#database.prepare(`
        SELECT * FROM cloud_host_signing_keys
        WHERE organization_id = ? AND host_id = ?
      `),
      hostKeyByIssuer: this.#database.prepare(`
        SELECT * FROM cloud_host_signing_keys
        WHERE organization_id = ? AND issuer_origin = ? AND key_id = ?
      `),
      hostKeysByIssuer: this.#database.prepare(`
        SELECT * FROM cloud_host_signing_keys
        WHERE issuer_origin = ? AND key_id = ?
        ORDER BY organization_id ASC
        LIMIT 2
      `),
      insertHostKey: this.#database.prepare(`
        INSERT INTO cloud_host_signing_keys (
          organization_id, host_id, issuer_origin, key_id, public_key_pem, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `),
      consentSessionById: this.#database.prepare(
        "SELECT * FROM cloud_consent_sessions WHERE consent_session_id = ?",
      ),
      consentSessionByChallengeId: this.#database.prepare(
        "SELECT * FROM cloud_consent_sessions WHERE challenge_id = ?",
      ),
      consentSessionByTokenDigest: this.#database.prepare(
        "SELECT * FROM cloud_consent_sessions WHERE consent_token_digest = ?",
      ),
      insertConsentSession: this.#database.prepare(`
        INSERT INTO cloud_consent_sessions (
          consent_session_id, organization_id, challenge_id, host_subject_ref_digest,
          subject_id, delivery_target_id, consent_token_digest, decision_id, status,
          created_at, expires_at, decision_action, decided_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      setConsentDecision: this.#database.prepare(`
        UPDATE cloud_consent_sessions
        SET status = 'deciding', decision_action = ?, decision_id = ?, decided_at = ?
        WHERE challenge_id = ? AND status = 'pending'
      `),
      setConsentSessionStatus: this.#database.prepare(`
        UPDATE cloud_consent_sessions
        SET status = ?
        WHERE challenge_id = ? AND status = 'deciding'
      `),
    };
  }

  #schemaTransaction(operation, callback) {
    this.#database.exec("BEGIN IMMEDIATE");
    try {
      callback();
      this.#database.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
      this.#database.exec("COMMIT");
    } catch (error) {
      try {
        this.#database.exec("ROLLBACK");
      } catch (rollbackError) {
        throw new AggregateError(
          [error, rollbackError],
          `Pairing store schema ${operation} and rollback both failed`,
          { cause: error },
        );
      }
      throw error;
    }
  }

  #assertOpen() {
    if (this.#closed) throw new Error("Pairing store is closed");
  }

  #assertWriteTransaction() {
    this.#assertOpen();
    if (!this.#inTransaction) throw new Error("Pairing store write requires a transaction");
  }
}

function requirePairing(value) {
  requireExactRecord(value, PAIRING_FIELDS, PAIRING_FIELDS, "Pairing session");
}

function requireConnector(value) {
  requireExactRecord(
    value,
    ["connector_id", "organization_id", "subject_id", "delivery_target_id", "connector_token_digest", "expires_at", "revoked_at", "created_at"],
    ["connector_id", "organization_id", "subject_id", "delivery_target_id", "connector_token_digest", "expires_at", "revoked_at"],
    "Connector record",
  );
}

function requireHostKey(value) {
  requireExactRecord(value, HOST_KEY_FIELDS, HOST_KEY_FIELDS, "Host signing key");
}

function requireConsentSession(value) {
  requireExactRecord(value, CONSENT_SESSION_FIELDS, CONSENT_SESSION_FIELDS, "Consent session");
}

function requireConsentDecision(value) {
  requireExactRecord(
    value,
    ["challenge_id", "action", "decision_id", "decided_at"],
    ["challenge_id", "action", "decision_id", "decided_at"],
    "Consent decision",
  );
}

function sameHostKey(left, right) {
  return ["organization_id", "host_id", "issuer_origin", "key_id", "public_key_pem"]
    .every((field) => left[field] === right[field]);
}

function sameConsentSession(left, right) {
  return [
    "consent_session_id",
    "organization_id",
    "challenge_id",
    "host_subject_ref_digest",
    "subject_id",
    "delivery_target_id",
    "consent_token_digest",
    "decision_id",
    "status",
    "created_at",
    "expires_at",
    "decision_action",
    "decided_at",
  ].every((field) => left[field] === right[field]);
}

function plainRow(value) {
  return value === undefined ? null : { ...value };
}

function pairingStoreConflict(code) {
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
