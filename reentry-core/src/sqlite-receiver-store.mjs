import { DatabaseSync } from "node:sqlite";

import {
  CONSENTED_INSTRUCTION_SCHEMA_SQL,
  DELIVERY_DETAIL_SELECT,
  DELIVERY_STATE_SCHEMA_SQL,
  SCHEMA_SQL,
  SCHEMA_VERSION,
  STANDING_AUTHORIZATION_SCHEMA_SQL,
  STANDING_DELIVERY_DETAIL_SELECT,
  STANDING_ISSUER_KEY_SCHEMA_SQL,
  STANDING_KEY_FINGERPRINT_SCHEMA_SQL,
  STANDING_KEY_PIN_TRIGGERS_SQL,
} from "./sqlite-receiver-schema.mjs";

const STORE_OPTION_FIELDS = Object.freeze(["filename"]);

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
      grant.instruction,
      grant.runs_remaining,
      grant.revoked_at,
      grant.receipt_json,
      grant.created_at,
    );
    assertSingleChange(result, "insert Grant");
  }

  revokeGrant(grantId, revokedAt) {
    this.#assertWriteTransaction();
    const result = this.#statements.revokeGrant.run(revokedAt, grantId);
    return result.changes === 1;
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
    const state = this.#statements.insertDeliveryState.run(
      delivery.delivery_id,
      delivery.status,
      delivery.maximum_attempts,
      delivery.created_at,
    );
    assertSingleChange(state, "insert delivery state");
  }

  getDeliveryByEventId(eventId) {
    this.#assertOpen();
    return plainRow(this.#statements.deliveryByEventId.get(eventId));
  }

  getDeliveryById(deliveryId) {
    this.#assertOpen();
    return plainRow(this.#statements.deliveryById.get(deliveryId));
  }

  getDeliveryByEffectId(effectId) {
    this.#assertOpen();
    return plainRow(this.#statements.deliveryByEffectId.get(effectId));
  }

  getDeliveryByCurrentLeaseTokenDigest(leaseTokenDigest) {
    this.#assertOpen();
    return plainRow(this.#statements.deliveryByCurrentLeaseTokenDigest.get(leaseTokenDigest));
  }

  hasDeliveryAttemptTokenDigest(leaseTokenDigest) {
    this.#assertOpen();
    return this.#statements.hasDeliveryAttemptTokenDigest.get(leaseTokenDigest) !== undefined;
  }

  getActiveDeliveryByTarget(deliveryTargetId, now) {
    this.#assertOpen();
    return plainRow(this.#statements.activeDeliveryByTarget.get(deliveryTargetId, now));
  }

  getNextDeliveryByTarget(deliveryTargetId, now) {
    this.#assertOpen();
    return plainRow(this.#statements.nextDeliveryByTarget.get(deliveryTargetId, now));
  }

  claimDelivery(claim) {
    this.#assertWriteTransaction();
    const result = this.#statements.claimDelivery.run(
      claim.attempt,
      claim.connector_id,
      claim.lease_token_digest,
      claim.leased_at,
      claim.lease_expires_at,
      claim.updated_at,
      claim.delivery_id,
      claim.expected_status,
      claim.expected_attempt,
      claim.expected_connector_id,
      claim.expected_lease_token_digest,
      claim.expected_lease_expires_at,
    );
    if (result.changes !== 1) return false;
    const attempt = this.#statements.insertDeliveryAttempt.run(
      claim.delivery_id,
      claim.attempt,
      claim.connector_id,
      claim.lease_token_digest,
      claim.leased_at,
      claim.lease_expires_at,
    );
    assertSingleChange(attempt, "insert delivery attempt");
    return true;
  }

  cancelDelivery(transition) {
    this.#assertWriteTransaction();
    const result = this.#statements.cancelDelivery.run(
      transition.reason,
      transition.updated_at,
      transition.delivery_id,
    );
    return result.changes === 1;
  }

  exhaustDelivery(transition) {
    this.#assertWriteTransaction();
    const result = this.#statements.exhaustDelivery.run(
      transition.reason,
      transition.updated_at,
      transition.delivery_id,
      transition.expected_attempt,
      transition.expected_connector_id,
      transition.expected_lease_token_digest,
      transition.expected_lease_expires_at,
    );
    return result.changes === 1;
  }

  acknowledgeDelivery(acknowledgement) {
    this.#assertWriteTransaction();
    const result = this.#statements.acknowledgeDelivery.run(
      acknowledgement.effect_id,
      acknowledgement.effect_attestation_json,
      acknowledgement.acknowledged_at,
      acknowledgement.updated_at,
      acknowledgement.delivery_id,
      acknowledgement.expected_status,
      acknowledgement.expected_attempt,
      acknowledgement.expected_connector_id,
      acknowledgement.expected_lease_token_digest,
      acknowledgement.expected_lease_expires_at,
    );
    return result.changes === 1;
  }

  getStandingChallengeByManifestId(manifestId) {
    this.#assertOpen();
    return plainRow(this.#statements.standingChallengeByManifestId.get(manifestId));
  }

  getStandingChallengeById(challengeId) {
    this.#assertOpen();
    return plainRow(this.#statements.standingChallengeById.get(challengeId));
  }

  insertStandingChallenge(challenge) {
    this.#assertWriteTransaction();
    const result = this.#statements.insertStandingChallenge.run(
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
    assertSingleChange(result, "insert standing challenge");
  }

  setStandingChallengeDecision(decision) {
    this.#assertWriteTransaction();
    const result = this.#statements.setStandingChallengeDecision.run(
      decision.status,
      decision.decision_id,
      decision.decision_action,
      decision.subject_id,
      decision.decided_at,
      decision.challenge_id,
    );
    return result.changes === 1;
  }

  getStandingGrantByChallengeId(challengeId) {
    this.#assertOpen();
    return plainRow(this.#statements.standingGrantByChallengeId.get(challengeId));
  }

  getStandingGrantByBindingId(bindingId) {
    this.#assertOpen();
    return plainRow(this.#statements.standingGrantByBindingId.get(bindingId));
  }

  insertStandingGrant(grant) {
    this.#assertWriteTransaction();
    const result = this.#statements.insertStandingGrant.run(
      grant.grant_id,
      grant.challenge_id,
      grant.manifest_id,
      grant.binding_id,
      grant.subject_id,
      grant.delivery_target_id,
      grant.correlation_id,
      grant.issuer_origin,
      grant.issuer_key_id,
      grant.issuer_key_fingerprint,
      grant.workflow_type,
      grant.workflow_id,
      grant.event_type,
      grant.canonical_url,
      grant.expires_at,
      grant.human_boundary,
      grant.instruction,
      grant.authorization_mode,
      grant.max_active_activations,
      grant.last_event_sequence,
      grant.revoked_at,
      grant.receipt_json,
      grant.created_at,
    );
    assertSingleChange(result, "insert standing Grant");
  }

  advanceStandingGrantSequence(grantId, expectedSequence, nextSequence) {
    this.#assertWriteTransaction();
    const result = this.#statements.advanceStandingGrantSequence.run(
      nextSequence,
      grantId,
      expectedSequence,
    );
    return result.changes === 1;
  }

  revokeStandingGrant(grantId, revokedAt) {
    this.#assertWriteTransaction();
    const result = this.#statements.revokeStandingGrant.run(revokedAt, grantId);
    return result.changes === 1;
  }

  getStandingEventById(eventId) {
    this.#assertOpen();
    return plainRow(this.#statements.standingEventById.get(eventId));
  }

  insertStandingEvent(event) {
    this.#assertWriteTransaction();
    const result = this.#statements.insertStandingEvent.run(
      event.event_id,
      event.grant_id,
      event.event_sequence,
      event.canonical_body,
      event.acceptance_json,
      event.received_at,
    );
    assertSingleChange(result, "insert standing Event");
  }

  getOpenStandingDeliveryByGrantId(grantId) {
    this.#assertOpen();
    return plainRow(this.#statements.openStandingDeliveryByGrantId.get(grantId));
  }

  getStandingDeliveryByEventId(eventId) {
    this.#assertOpen();
    return plainRow(this.#statements.standingDeliveryByEventId.get(eventId));
  }

  getStandingDeliveryById(deliveryId) {
    this.#assertOpen();
    return plainRow(this.#statements.standingDeliveryById.get(deliveryId));
  }

  getStandingDeliveryByEffectId(effectId) {
    this.#assertOpen();
    return plainRow(this.#statements.standingDeliveryByEffectId.get(effectId));
  }

  getStandingDeliveryByLeaseTokenDigest(leaseTokenDigest) {
    this.#assertOpen();
    return plainRow(this.#statements.standingDeliveryByLeaseTokenDigest.get(leaseTokenDigest));
  }

  getNextStandingDeliveryByTarget(deliveryTargetId, now) {
    this.#assertOpen();
    return plainRow(this.#statements.nextStandingDeliveryByTarget.get(deliveryTargetId, now));
  }

  insertStandingDelivery(delivery) {
    this.#assertWriteTransaction();
    const result = this.#statements.insertStandingDelivery.run(
      delivery.delivery_id,
      delivery.event_id,
      delivery.grant_id,
      delivery.delivery_target_id,
      delivery.status,
      delivery.created_at,
      delivery.updated_at,
    );
    assertSingleChange(result, "insert standing Delivery");
  }

  claimStandingDelivery(claim) {
    this.#assertWriteTransaction();
    const result = this.#statements.claimStandingDelivery.run(
      claim.connector_id,
      claim.lease_token_digest,
      claim.leased_at,
      claim.lease_expires_at,
      claim.updated_at,
      claim.delivery_id,
    );
    return result.changes === 1;
  }

  acknowledgeStandingDelivery(acknowledgement) {
    this.#assertWriteTransaction();
    const result = this.#statements.acknowledgeStandingDelivery.run(
      acknowledgement.effect_id,
      acknowledgement.effect_attestation_json,
      acknowledgement.acknowledged_at,
      acknowledgement.updated_at,
      acknowledgement.delivery_id,
      acknowledgement.connector_id,
      acknowledgement.lease_token_digest,
      acknowledgement.lease_expires_at,
    );
    return result.changes === 1;
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
    if (version === 1) {
      this.#schemaTransaction("migration", () => {
        this.#database.exec(DELIVERY_STATE_SCHEMA_SQL);
        this.#database.exec(`
          INSERT INTO receiver_delivery_states (
            delivery_id, status, maximum_attempts, current_attempt, current_connector_id,
            current_lease_token_digest, leased_at, lease_expires_at, effect_id,
            effect_attestation_json, acknowledged_at, terminal_reason, updated_at
          )
          SELECT
            delivery_id, 'pending', 1, 0, NULL, NULL, NULL, NULL, NULL,
            NULL, NULL, NULL, created_at
          FROM receiver_deliveries
        `);
        this.#database.exec(CONSENTED_INSTRUCTION_SCHEMA_SQL);
        this.#database.exec(STANDING_AUTHORIZATION_SCHEMA_SQL);
      });
      return;
    }
    if (version === 2) {
      this.#schemaTransaction("migration", () => {
        this.#database.exec(CONSENTED_INSTRUCTION_SCHEMA_SQL);
        this.#database.exec(STANDING_AUTHORIZATION_SCHEMA_SQL);
      });
      return;
    }
    if (version === 3) {
      this.#schemaTransaction(
        "migration",
        () => this.#database.exec(STANDING_AUTHORIZATION_SCHEMA_SQL),
      );
      return;
    }
    if (version === 4) {
      this.#schemaTransaction("migration", () => {
        this.#database.exec(STANDING_ISSUER_KEY_SCHEMA_SQL);
        this.#database.exec(STANDING_KEY_FINGERPRINT_SCHEMA_SQL);
        this.#database.exec(STANDING_KEY_PIN_TRIGGERS_SQL);
      });
      return;
    }
    if (version === 5) {
      this.#schemaTransaction("migration", () => {
        this.#database.exec(STANDING_KEY_FINGERPRINT_SCHEMA_SQL);
        this.#database.exec(STANDING_KEY_PIN_TRIGGERS_SQL);
      });
      return;
    }
    if (version !== 0) {
      throw new Error(`Unsupported SQLite Receiver schema version: ${version}`);
    }
    const existingTable = this.#database.prepare(
      "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' LIMIT 1",
    ).get();
    if (existingTable) {
      throw new Error("Unversioned SQLite Receiver database is not empty");
    }

    this.#schemaTransaction("initialization", () => this.#database.exec(SCHEMA_SQL));
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
          `SQLite Receiver schema ${operation} and rollback both failed`,
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
          expires_at, human_boundary, instruction, runs_remaining, revoked_at, receipt_json,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      revokeGrant: this.#database.prepare(`
        UPDATE receiver_grants
        SET revoked_at = ?
        WHERE grant_id = ? AND revoked_at IS NULL
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
      insertDeliveryState: this.#database.prepare(`
        INSERT INTO receiver_delivery_states (
          delivery_id, status, maximum_attempts, current_attempt, current_connector_id,
          current_lease_token_digest, leased_at, lease_expires_at, effect_id,
          effect_attestation_json, acknowledged_at, terminal_reason, updated_at
        ) VALUES (?, ?, ?, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?)
      `),
      deliveryByEventId: this.#database.prepare(`
        ${DELIVERY_DETAIL_SELECT}
        WHERE d.event_id = ?
      `),
      deliveryById: this.#database.prepare(`
        ${DELIVERY_DETAIL_SELECT}
        WHERE d.delivery_id = ?
      `),
      deliveryByEffectId: this.#database.prepare(`
        SELECT delivery_id
        FROM receiver_delivery_states
        WHERE effect_id = ?
      `),
      deliveryByCurrentLeaseTokenDigest: this.#database.prepare(`
        ${DELIVERY_DETAIL_SELECT}
        WHERE s.current_lease_token_digest = ?
      `),
      hasDeliveryAttemptTokenDigest: this.#database.prepare(`
        SELECT 1
        FROM receiver_delivery_attempts
        WHERE lease_token_digest = ?
      `),
      activeDeliveryByTarget: this.#database.prepare(`
        ${DELIVERY_DETAIL_SELECT}
        WHERE d.delivery_target_id = ?
          AND s.status = 'leased'
          AND s.lease_expires_at > ?
        ORDER BY d.created_at, d.delivery_id
        LIMIT 1
      `),
      nextDeliveryByTarget: this.#database.prepare(`
        ${DELIVERY_DETAIL_SELECT}
        WHERE d.delivery_target_id = ?
          AND (
            s.status = 'pending'
            OR (s.status = 'leased' AND s.lease_expires_at <= ?)
          )
        ORDER BY d.created_at, d.delivery_id
        LIMIT 1
      `),
      claimDelivery: this.#database.prepare(`
        UPDATE receiver_delivery_states
        SET status = 'leased', current_attempt = ?, current_connector_id = ?,
            current_lease_token_digest = ?, leased_at = ?, lease_expires_at = ?,
            effect_id = NULL, effect_attestation_json = NULL, acknowledged_at = NULL,
            terminal_reason = NULL, updated_at = ?
        WHERE delivery_id = ? AND status = ? AND current_attempt = ?
          AND current_connector_id IS ?
          AND current_lease_token_digest IS ?
          AND lease_expires_at IS ?
      `),
      insertDeliveryAttempt: this.#database.prepare(`
        INSERT INTO receiver_delivery_attempts (
          delivery_id, attempt, connector_id, lease_token_digest, leased_at, lease_expires_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `),
      cancelDelivery: this.#database.prepare(`
        UPDATE receiver_delivery_states
        SET status = 'cancelled', terminal_reason = ?, updated_at = ?
        WHERE delivery_id = ? AND status = 'pending' AND current_attempt = 0
      `),
      exhaustDelivery: this.#database.prepare(`
        UPDATE receiver_delivery_states
        SET status = 'retry_exhausted', terminal_reason = ?, updated_at = ?
        WHERE delivery_id = ? AND status = 'leased' AND current_attempt = ?
          AND current_connector_id = ?
          AND current_lease_token_digest = ?
          AND lease_expires_at = ?
      `),
      acknowledgeDelivery: this.#database.prepare(`
        UPDATE receiver_delivery_states
        SET status = 'acknowledged', effect_id = ?, effect_attestation_json = ?,
            acknowledged_at = ?, terminal_reason = NULL, updated_at = ?
        WHERE delivery_id = ? AND status = ? AND current_attempt = ?
          AND current_connector_id = ?
          AND current_lease_token_digest = ?
          AND lease_expires_at = ?
      `),
      standingChallengeByManifestId: this.#database.prepare(
        "SELECT * FROM receiver_standing_challenges WHERE manifest_id = ?",
      ),
      standingChallengeById: this.#database.prepare(
        "SELECT * FROM receiver_standing_challenges WHERE challenge_id = ?",
      ),
      insertStandingChallenge: this.#database.prepare(`
        INSERT INTO receiver_standing_challenges (
          challenge_id, manifest_id, manifest_json, expected_origin, effective_expires_at,
          status, decision_id, decision_action, subject_id, created_at, decided_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      setStandingChallengeDecision: this.#database.prepare(`
        UPDATE receiver_standing_challenges
        SET status = ?, decision_id = ?, decision_action = ?, subject_id = ?, decided_at = ?
        WHERE challenge_id = ? AND status = 'pending'
      `),
      standingGrantByChallengeId: this.#database.prepare(
        "SELECT * FROM receiver_standing_grants WHERE challenge_id = ?",
      ),
      standingGrantByBindingId: this.#database.prepare(
        "SELECT * FROM receiver_standing_grants WHERE binding_id = ?",
      ),
      insertStandingGrant: this.#database.prepare(`
        INSERT INTO receiver_standing_grants (
          grant_id, challenge_id, manifest_id, binding_id, subject_id, delivery_target_id,
          correlation_id, issuer_origin, issuer_key_id, issuer_key_fingerprint,
          workflow_type, workflow_id, event_type,
          canonical_url,
          expires_at, human_boundary, instruction, authorization_mode, max_active_activations,
          last_event_sequence, revoked_at, receipt_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      advanceStandingGrantSequence: this.#database.prepare(`
        UPDATE receiver_standing_grants
        SET last_event_sequence = ?
        WHERE grant_id = ? AND last_event_sequence = ? AND revoked_at IS NULL
      `),
      revokeStandingGrant: this.#database.prepare(`
        UPDATE receiver_standing_grants
        SET revoked_at = ?
        WHERE grant_id = ? AND revoked_at IS NULL
      `),
      standingEventById: this.#database.prepare(
        "SELECT * FROM receiver_standing_events WHERE event_id = ?",
      ),
      insertStandingEvent: this.#database.prepare(`
        INSERT INTO receiver_standing_events (
          event_id, grant_id, event_sequence, canonical_body, acceptance_json, received_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `),
      openStandingDeliveryByGrantId: this.#database.prepare(`
        ${STANDING_DELIVERY_DETAIL_SELECT}
        WHERE d.grant_id = ? AND d.status IN ('pending', 'leased')
        ORDER BY d.created_at, d.delivery_id
        LIMIT 1
      `),
      standingDeliveryByEventId: this.#database.prepare(`
        ${STANDING_DELIVERY_DETAIL_SELECT}
        WHERE d.event_id = ?
      `),
      standingDeliveryById: this.#database.prepare(`
        ${STANDING_DELIVERY_DETAIL_SELECT}
        WHERE d.delivery_id = ?
      `),
      standingDeliveryByEffectId: this.#database.prepare(`
        ${STANDING_DELIVERY_DETAIL_SELECT}
        WHERE d.effect_id = ?
      `),
      standingDeliveryByLeaseTokenDigest: this.#database.prepare(`
        ${STANDING_DELIVERY_DETAIL_SELECT}
        WHERE d.lease_token_digest = ?
      `),
      nextStandingDeliveryByTarget: this.#database.prepare(`
        ${STANDING_DELIVERY_DETAIL_SELECT}
        WHERE d.delivery_target_id = ? AND d.status = 'pending'
          AND g.revoked_at IS NULL AND g.expires_at > ?
        ORDER BY d.created_at, d.delivery_id
        LIMIT 1
      `),
      insertStandingDelivery: this.#database.prepare(`
        INSERT INTO receiver_standing_deliveries (
          delivery_id, event_id, grant_id, delivery_target_id, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `),
      claimStandingDelivery: this.#database.prepare(`
        UPDATE receiver_standing_deliveries
        SET status = 'leased', connector_id = ?, lease_token_digest = ?, leased_at = ?,
            lease_expires_at = ?, updated_at = ?
        WHERE delivery_id = ? AND status = 'pending'
      `),
      acknowledgeStandingDelivery: this.#database.prepare(`
        UPDATE receiver_standing_deliveries
        SET status = 'acknowledged', effect_id = ?, effect_attestation_json = ?,
            acknowledged_at = ?, updated_at = ?
        WHERE delivery_id = ? AND status = 'leased' AND connector_id = ?
          AND lease_token_digest = ? AND lease_expires_at = ?
      `),
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
