import { DatabaseSync } from "node:sqlite";

const SCHEMA_VERSION = 1;
const STORE_OPTION_FIELDS = Object.freeze(["filename"]);

const SCHEMA_SQL = `
CREATE TABLE receiver_challenges (
  challenge_id TEXT PRIMARY KEY,
  manifest_id TEXT NOT NULL UNIQUE,
  manifest_json TEXT NOT NULL,
  expected_origin TEXT NOT NULL,
  effective_expires_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'declined')),
  decision_id TEXT UNIQUE,
  decision_action TEXT CHECK (decision_action IN ('approve', 'decline')),
  subject_id TEXT,
  created_at TEXT NOT NULL,
  decided_at TEXT,
  CHECK (
    (status = 'pending' AND decision_id IS NULL AND decision_action IS NULL
      AND subject_id IS NULL AND decided_at IS NULL)
    OR
    (status = 'approved' AND decision_id IS NOT NULL AND decision_action = 'approve'
      AND subject_id IS NOT NULL AND decided_at IS NOT NULL)
    OR
    (status = 'declined' AND decision_id IS NOT NULL AND decision_action = 'decline'
      AND subject_id IS NOT NULL AND decided_at IS NOT NULL)
  )
) STRICT;

CREATE TABLE receiver_grants (
  grant_id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL UNIQUE REFERENCES receiver_challenges(challenge_id),
  manifest_id TEXT NOT NULL,
  binding_id TEXT NOT NULL UNIQUE,
  subject_id TEXT NOT NULL,
  delivery_target_id TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  issuer_origin TEXT NOT NULL,
  workflow_type TEXT NOT NULL,
  workflow_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  human_boundary TEXT NOT NULL,
  runs_remaining INTEGER NOT NULL CHECK (runs_remaining IN (0, 1)),
  revoked_at TEXT,
  receipt_json TEXT NOT NULL,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE receiver_events (
  event_id TEXT PRIMARY KEY,
  grant_id TEXT NOT NULL UNIQUE REFERENCES receiver_grants(grant_id),
  canonical_body TEXT NOT NULL,
  acceptance_json TEXT NOT NULL,
  received_at TEXT NOT NULL
) STRICT;

CREATE TABLE receiver_deliveries (
  delivery_id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE REFERENCES receiver_events(event_id),
  grant_id TEXT NOT NULL UNIQUE REFERENCES receiver_grants(grant_id),
  delivery_target_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status = 'pending'),
  created_at TEXT NOT NULL
) STRICT;

CREATE INDEX receiver_deliveries_pending
  ON receiver_deliveries(status, delivery_target_id, created_at);
`;

export class SqliteReceiverStore {
  #database;
  #statements;
  #closed = false;
  #inTransaction = false;

  constructor(options) {
    requireStoreOptions(options);
    const filename = requireFilename(options.filename);
    this.#database = new DatabaseSync(filename);
    try {
      this.#configure(filename === ":memory:");
      this.#initializeSchema();
      this.#statements = this.#prepareStatements();
    } catch (error) {
      this.#database.close();
      this.#closed = true;
      throw error;
    }
  }

  transaction(callback) {
    this.#assertOpen();
    if (typeof callback !== "function") {
      throw new TypeError("SQLite Receiver transaction callback must be a function");
    }
    if (this.#inTransaction) {
      throw new Error("Nested SQLite Receiver transactions are not supported");
    }

    this.#database.exec("BEGIN IMMEDIATE");
    this.#inTransaction = true;
    try {
      const result = callback(this);
      if (result && typeof result.then === "function") {
        throw new TypeError("SQLite Receiver transaction callback must be synchronous");
      }
      this.#database.exec("COMMIT");
      return result;
    } catch (error) {
      try {
        this.#database.exec("ROLLBACK");
      } catch (rollbackError) {
        throw new AggregateError(
          [error, rollbackError],
          "SQLite Receiver transaction and rollback both failed",
          { cause: error },
        );
      }
      throw error;
    } finally {
      this.#inTransaction = false;
    }
  }

  getChallengeByManifestId(manifestId) {
    this.#assertOpen();
    return plainRow(this.#statements.challengeByManifestId.get(manifestId));
  }

  getChallengeById(challengeId) {
    this.#assertOpen();
    return plainRow(this.#statements.challengeById.get(challengeId));
  }

  insertChallenge(challenge) {
    this.#assertWriteTransaction();
    const result = this.#statements.insertChallenge.run(
      challenge.challenge_id,
      challenge.manifest_id,
      challenge.manifest_json,
      challenge.expected_origin,
      challenge.effective_expires_at,
      challenge.status,
      challenge.decision_id,
      challenge.decision_action,
      challenge.subject_id,
      challenge.created_at,
      challenge.decided_at,
    );
    assertSingleChange(result, "insert challenge");
  }

  setChallengeDecision(decision) {
    this.#assertWriteTransaction();
    const result = this.#statements.setChallengeDecision.run(
      decision.status,
      decision.decision_id,
      decision.decision_action,
      decision.subject_id,
      decision.decided_at,
      decision.challenge_id,
    );
    return result.changes === 1;
  }

  getGrantByChallengeId(challengeId) {
    this.#assertOpen();
    return plainRow(this.#statements.grantByChallengeId.get(challengeId));
  }

  getGrantByBindingId(bindingId) {
    this.#assertOpen();
    return plainRow(this.#statements.grantByBindingId.get(bindingId));
  }

  insertGrant(grant) {
    this.#assertWriteTransaction();
    const result = this.#statements.insertGrant.run(
      grant.grant_id,
      grant.challenge_id,
      grant.manifest_id,
      grant.binding_id,
      grant.subject_id,
      grant.delivery_target_id,
      grant.correlation_id,
      grant.issuer_origin,
      grant.workflow_type,
      grant.workflow_id,
      grant.event_type,
      grant.canonical_url,
      grant.expires_at,
      grant.human_boundary,
      grant.runs_remaining,
      grant.revoked_at,
      grant.receipt_json,
      grant.created_at,
    );
    assertSingleChange(result, "insert Grant");
  }

  consumeGrantRun(grantId) {
    this.#assertWriteTransaction();
    const result = this.#statements.consumeGrantRun.run(grantId);
    return result.changes === 1;
  }

  getEventById(eventId) {
    this.#assertOpen();
    return plainRow(this.#statements.eventById.get(eventId));
  }

  insertEvent(event) {
    this.#assertWriteTransaction();
    const result = this.#statements.insertEvent.run(
      event.event_id,
      event.grant_id,
      event.canonical_body,
      event.acceptance_json,
      event.received_at,
    );
    assertSingleChange(result, "insert event");
  }

  insertDelivery(delivery) {
    this.#assertWriteTransaction();
    const result = this.#statements.insertDelivery.run(
      delivery.delivery_id,
      delivery.event_id,
      delivery.grant_id,
      delivery.delivery_target_id,
      delivery.status,
      delivery.created_at,
    );
    assertSingleChange(result, "insert delivery");
  }

  getDeliveryByEventId(eventId) {
    this.#assertOpen();
    return plainRow(this.#statements.deliveryByEventId.get(eventId));
  }

  close() {
    if (this.#closed) return;
    if (this.#inTransaction) {
      throw new Error("Cannot close SQLite Receiver store during a transaction");
    }
    this.#database.close();
    this.#closed = true;
  }

  #configure(inMemory) {
    this.#database.exec("PRAGMA foreign_keys = ON");
    this.#database.exec("PRAGMA busy_timeout = 5000");
    if (!inMemory) {
      const row = this.#database.prepare("PRAGMA journal_mode = WAL").get();
      if (String(row?.journal_mode).toLowerCase() !== "wal") {
        throw new Error("SQLite Receiver store could not enable WAL journal mode");
      }
    }
    this.#database.exec("PRAGMA synchronous = FULL");
    if (this.#database.prepare("PRAGMA foreign_keys").get()?.foreign_keys !== 1) {
      throw new Error("SQLite Receiver store could not enable foreign keys");
    }
    if (this.#database.prepare("PRAGMA synchronous").get()?.synchronous !== 2) {
      throw new Error("SQLite Receiver store could not enable full synchronous durability");
    }
  }

  #initializeSchema() {
    const version = this.#database.prepare("PRAGMA user_version").get()?.user_version;
    if (version === SCHEMA_VERSION) return;
    if (version !== 0) {
      throw new Error(`Unsupported SQLite Receiver schema version: ${version}`);
    }
    const existingTable = this.#database.prepare(
      "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' LIMIT 1",
    ).get();
    if (existingTable) {
      throw new Error("Unversioned SQLite Receiver database is not empty");
    }

    this.#database.exec("BEGIN IMMEDIATE");
    try {
      this.#database.exec(SCHEMA_SQL);
      this.#database.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
      this.#database.exec("COMMIT");
    } catch (error) {
      try {
        this.#database.exec("ROLLBACK");
      } catch (rollbackError) {
        throw new AggregateError(
          [error, rollbackError],
          "SQLite Receiver schema initialization and rollback both failed",
          { cause: error },
        );
      }
      throw error;
    }
  }

  #prepareStatements() {
    return {
      challengeByManifestId: this.#database.prepare(
        "SELECT * FROM receiver_challenges WHERE manifest_id = ?",
      ),
      challengeById: this.#database.prepare(
        "SELECT * FROM receiver_challenges WHERE challenge_id = ?",
      ),
      insertChallenge: this.#database.prepare(`
        INSERT INTO receiver_challenges (
          challenge_id, manifest_id, manifest_json, expected_origin, effective_expires_at,
          status, decision_id, decision_action, subject_id, created_at, decided_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      setChallengeDecision: this.#database.prepare(`
        UPDATE receiver_challenges
        SET status = ?, decision_id = ?, decision_action = ?, subject_id = ?, decided_at = ?
        WHERE challenge_id = ? AND status = 'pending'
      `),
      grantByChallengeId: this.#database.prepare(
        "SELECT * FROM receiver_grants WHERE challenge_id = ?",
      ),
      grantByBindingId: this.#database.prepare(
        "SELECT * FROM receiver_grants WHERE binding_id = ?",
      ),
      insertGrant: this.#database.prepare(`
        INSERT INTO receiver_grants (
          grant_id, challenge_id, manifest_id, binding_id, subject_id, delivery_target_id,
          correlation_id, issuer_origin, workflow_type, workflow_id, event_type, canonical_url,
          expires_at, human_boundary, runs_remaining, revoked_at, receipt_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      consumeGrantRun: this.#database.prepare(`
        UPDATE receiver_grants
        SET runs_remaining = 0
        WHERE grant_id = ? AND runs_remaining = 1 AND revoked_at IS NULL
      `),
      eventById: this.#database.prepare(
        "SELECT * FROM receiver_events WHERE event_id = ?",
      ),
      insertEvent: this.#database.prepare(`
        INSERT INTO receiver_events (
          event_id, grant_id, canonical_body, acceptance_json, received_at
        ) VALUES (?, ?, ?, ?, ?)
      `),
      insertDelivery: this.#database.prepare(`
        INSERT INTO receiver_deliveries (
          delivery_id, event_id, grant_id, delivery_target_id, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `),
      deliveryByEventId: this.#database.prepare(
        "SELECT * FROM receiver_deliveries WHERE event_id = ?",
      ),
    };
  }

  #assertOpen() {
    if (this.#closed) throw new Error("SQLite Receiver store is closed");
  }

  #assertWriteTransaction() {
    this.#assertOpen();
    if (!this.#inTransaction) {
      throw new Error("SQLite Receiver writes require an active transaction");
    }
  }
}

function requireStoreOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("SQLite Receiver store options must be an object");
  }
  const prototype = Object.getPrototypeOf(options);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("SQLite Receiver store options must be a plain object");
  }
  const fields = Reflect.ownKeys(options);
  if (
    fields.length !== STORE_OPTION_FIELDS.length ||
    fields.some((field) => typeof field !== "string" || !STORE_OPTION_FIELDS.includes(field))
  ) {
    throw new TypeError("SQLite Receiver store options must contain only filename");
  }
  const descriptor = Object.getOwnPropertyDescriptor(options, "filename");
  if (!descriptor?.enumerable || !("value" in descriptor)) {
    throw new TypeError("SQLite Receiver store filename must be an enumerable data property");
  }
}

function requireFilename(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    Buffer.byteLength(value, "utf8") > 4_096 ||
    value.includes("\0")
  ) {
    throw new TypeError("SQLite Receiver store filename is invalid");
  }
  return value;
}

function plainRow(row) {
  return row === undefined ? undefined : { ...row };
}

function assertSingleChange(result, operation) {
  if (result.changes !== 1) {
    throw new Error(`SQLite Receiver store failed to ${operation}`);
  }
}
