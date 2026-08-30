import { isDeepStrictEqual } from "node:util";
import { createHash } from "node:crypto";
import { createBearerToken, createId, digestBearerToken } from "../ids.mjs";
import { inTransaction } from "../database.mjs";
import { canonicalJson, verifyReentryManifest } from "../webmcp-manifest.mjs";
import { sealReceipt, unsealReceipt } from "../receipt-sealer.mjs";
import {
  H2_RECEIPT_LEASE_MS,
  INITIAL_STATE,
  WORKFLOW_ID,
} from "../config.mjs";

const RECEIPT_SCHEMA_VERSION = 1;

export class DurableEnrollmentService {
  constructor({
    database,
    receiptSink,
    origin,
    trace,
    clock = () => new Date(),
    manifestSecret,
    receiptSealingKey,
    receiptKeyId,
    leaseMs = H2_RECEIPT_LEASE_MS,
    faultInjector = null,
  }) {
    if (!receiptSink?.dispatchEnrollmentReceipt) {
      throw new Error("Durable enrollment requires a receipt dispatch sink");
    }
    if (!Number.isInteger(leaseMs) || leaseMs < 1_000) {
      throw new Error("Durable enrollment lease must be at least one second");
    }
    this.database = database;
    this.receiptSink = receiptSink;
    this.origin = origin;
    this.trace = trace;
    this.clock = clock;
    this.manifestSecret = manifestSecret;
    this.receiptSealingKey = receiptSealingKey;
    this.receiptKeyId = receiptKeyId;
    this.leaseMs = leaseMs;
    this.faultInjector = faultInjector;
  }

  approveChallenge(challengeId, correlationId, { humanAction = false } = {}) {
    requireText(challengeId, "challenge_id");
    requireText(correlationId, "correlation_id");
    if (!humanAction) {
      throw new DurableEnrollmentAuthorizationError(
        "Approval requires the Receiver consent UI",
      );
    }
    const initial = this.getChallengeWithManifest(challengeId);
    requireMatchingCorrelation(initial.correlation_id, correlationId);
    if (initial.status === "APPROVED") return this.statusForChallenge(challengeId, true);
    if (initial.status !== "PENDING") {
      throw new DurableEnrollmentConflictError("Consent challenge is already decided");
    }

    const manifest = verifyReentryManifest(JSON.parse(initial.manifest_json), {
      expectedOrigin: this.origin,
      now: this.clock(),
      ...(this.manifestSecret ? { manifestSecret: this.manifestSecret } : {}),
    });
    const storedManifest = this.database.prepare(`
      SELECT manifest_json FROM manifests WHERE manifest_id = ?
    `).get(manifest.manifest_id);
    if (!storedManifest || !isDeepStrictEqual(JSON.parse(storedManifest.manifest_json), manifest)) {
      throw new DurableEnrollmentError("Manifest was not issued by this Receiver", 422);
    }

    const grantId = createId("gr");
    const agentBinding = createId("ab_opaque");
    const inboxId = createId("inbox");
    const inboxHandle = createBearerToken("h2_inbox");
    const dispatchId = createId("rdispatch");
    const createdAt = this.clock().toISOString();
    const baseReceipt = {
      receipt_type: "WEBMCP_REENTRY_GRANT",
      grant_id: grantId,
      correlation_id: initial.correlation_id,
      workflow_id: manifest.workflow_id,
      canonical_url: manifest.canonical_url,
      authorized_event_type: manifest.allowed_event_type,
      continuation_intent: manifest.continuation_intent,
      expires_at: manifest.expires_at,
    };
    const durableReceipt = {
      receipt_type: "H2_DURABLE_HEARTBEAT_REENTRY",
      receipt_schema_version: RECEIPT_SCHEMA_VERSION,
      dispatch_id: dispatchId,
      grant_id: grantId,
      correlation_id: initial.correlation_id,
      workflow_id: manifest.workflow_id,
      canonical_url: manifest.canonical_url,
      receiver_inbox_url: `${this.origin}/receiver/inboxes/${encodeURIComponent(inboxHandle)}`,
      authorized_event_type: manifest.allowed_event_type,
      continuation_intent: manifest.continuation_intent,
      human_boundary: manifest.human_boundary,
      agent_binding: agentBinding,
      expires_at: manifest.expires_at,
    };
    const contextBindingDigest = digestContextBinding({
      managed_context_kind: initial.managed_context_kind,
      managed_context_id: initial.managed_context_id,
    });
    const aad = buildDurableReceiptAad({
      dispatchId,
      grantId,
      inboxId,
      contextBindingDigest,
    });
    const sealed = sealReceipt(durableReceipt, {
      key: this.receiptSealingKey,
      keyId: this.receiptKeyId,
      aad,
    });

    this.faultInjector?.hit("before_enrollment_commit", {
      challenge_id: challengeId,
    });
    try {
      inTransaction(this.database, () => {
        const claimed = this.database.prepare(`
        UPDATE binding_challenges
        SET status = 'APPROVED', decided_at = ?
        WHERE challenge_id = ? AND status = 'PENDING'
      `).run(createdAt, challengeId);
        if (claimed.changes !== 1) {
          throw new DurableEnrollmentConflictError("Consent challenge is already decided");
        }
        this.database.prepare(`
        INSERT INTO grants (
          grant_id, challenge_id, correlation_id, agent_binding, workflow_id, issuer_origin,
          event_type, canonical_url, max_runs, runs_used, status, expires_at,
          continuation_intent_json, human_boundary, managed_context_kind,
          managed_context_id, receipt_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'AWAITING_RECEIPT', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        grantId,
        challengeId,
        initial.correlation_id,
        agentBinding,
        manifest.workflow_id,
        manifest.issuer_origin,
        manifest.allowed_event_type,
        manifest.canonical_url,
        manifest.max_runs,
        manifest.expires_at,
        JSON.stringify(manifest.continuation_intent),
        manifest.human_boundary,
        initial.managed_context_kind,
        initial.managed_context_id,
        JSON.stringify(baseReceipt),
        createdAt,
      );
        this.database.prepare(`
        INSERT INTO heartbeat_inboxes (
          inbox_id, handle_digest, grant_id, workflow_id, status, created_at, expires_at
        ) VALUES (?, ?, ?, ?, 'AWAITING_RECEIPT', ?, ?)
      `).run(
        inboxId,
        digestBearerToken(inboxHandle),
        grantId,
        manifest.workflow_id,
        createdAt,
        manifest.expires_at,
      );
        this.database.prepare(`
        INSERT INTO heartbeat_receipt_outbox (
          dispatch_id, grant_id, inbox_id, receipt_schema_version, receipt_key_id,
          receipt_ciphertext, receipt_iv, receipt_auth_tag, receipt_digest,
          status, available_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)
      `).run(
        dispatchId,
        grantId,
        inboxId,
        RECEIPT_SCHEMA_VERSION,
        sealed.receipt_key_id,
        sealed.receipt_ciphertext,
        sealed.receipt_iv,
        sealed.receipt_auth_tag,
        sealed.receipt_digest,
        createdAt,
        createdAt,
        createdAt,
      );
        this.faultInjector?.hit("before_enrollment_transaction_commit", {
          challenge_id: challengeId,
          grant_id: grantId,
          inbox_id: inboxId,
          dispatch_id: dispatchId,
        });
      });
    } catch (error) {
      const raced = this.getChallengeWithManifest(challengeId);
      if (raced.status === "APPROVED") return this.statusForChallenge(challengeId, true);
      throw error;
    }
    this.record("commit_durable_enrollment", correlationId, "completed", {
      challenge_id: challengeId,
      grant_id: grantId,
      inbox_id: inboxId,
      dispatch_id: dispatchId,
      raw_receipt_stored: false,
      enrollment_status: "RECEIPT_PENDING",
    });
    this.faultInjector?.hit("after_enrollment_commit_before_response", {
      challenge_id: challengeId,
      grant_id: grantId,
      dispatch_id: dispatchId,
    });
    return this.statusForChallenge(challengeId, false);
  }

  getStatus(challengeId, correlationId) {
    const challenge = this.getChallengeWithManifest(challengeId);
    requireMatchingCorrelation(challenge.correlation_id, correlationId);
    return this.statusForChallenge(challengeId, true);
  }

  async dispatchNext() {
    const now = this.clock();
    const candidate = this.database.prepare(`
      SELECT
        o.*, g.correlation_id, g.managed_context_kind, g.managed_context_id,
        g.agent_binding, g.canonical_url, g.event_type, g.human_boundary,
        g.continuation_intent_json, g.status AS grant_status,
        g.expires_at AS grant_expires_at, i.handle_digest, i.status AS inbox_status
      FROM heartbeat_receipt_outbox o
      JOIN grants g ON g.grant_id = o.grant_id
      JOIN heartbeat_inboxes i ON i.inbox_id = o.inbox_id
      WHERE
        (o.status = 'PENDING' AND o.available_at <= ?)
        OR (o.status IN ('LEASED', 'DISPATCHING') AND o.lease_expires_at <= ?)
      ORDER BY o.created_at, o.dispatch_id
      LIMIT 1
    `).get(now.toISOString(), now.toISOString());
    if (!candidate) return null;
    if (Date.parse(candidate.grant_expires_at) <= now.getTime()) {
      if (!this.expireCandidate(candidate, now)) return null;
      return {
        dispatch_id: candidate.dispatch_id,
        grant_id: candidate.grant_id,
        status: "EXPIRED",
      };
    }

    const leaseToken = createBearerToken("lease");
    const leaseExpiresAt = new Date(now.getTime() + this.leaseMs).toISOString();
    const claim = this.claimCandidate(candidate, now, leaseToken, leaseExpiresAt);
    if (claim.invalidAuthority) {
      return {
        dispatch_id: candidate.dispatch_id,
        grant_id: candidate.grant_id,
        status: "FAILED",
        error_code: "ENROLLMENT_NOT_DISPATCHABLE",
      };
    }
    if (!claim.claimed) return null;
    this.faultInjector?.hit("after_outbox_claim_before_dispatch", {
      dispatch_id: candidate.dispatch_id,
    });

    const leased = this.database.prepare(`
      SELECT
        o.*, g.correlation_id, g.managed_context_kind, g.managed_context_id,
        g.agent_binding, g.workflow_id AS grant_workflow_id,
        g.canonical_url, g.event_type, g.human_boundary, g.continuation_intent_json,
        g.status AS grant_status, g.expires_at AS grant_expires_at,
        i.handle_digest, i.status AS inbox_status
      FROM heartbeat_receipt_outbox o
      JOIN grants g ON g.grant_id = o.grant_id
      JOIN heartbeat_inboxes i ON i.inbox_id = o.inbox_id
      WHERE o.dispatch_id = ?
    `).get(candidate.dispatch_id);
    let receipt;
    try {
      receipt = unsealReceipt(leased, {
        key: this.receiptSealingKey,
        keyId: this.receiptKeyId,
        aad: buildDurableReceiptAad({
          dispatchId: leased.dispatch_id,
          grantId: leased.grant_id,
          inboxId: leased.inbox_id,
          contextBindingDigest: digestContextBinding({
            managed_context_kind: leased.managed_context_kind,
            managed_context_id: leased.managed_context_id,
          }),
        }),
      });
      this.validateReceiptAgainstEnrollment(receipt, leased);
    } catch (error) {
      this.failCandidate(leased, leaseToken, "RECEIPT_ENVELOPE_INVALID");
      throw error;
    }

    this.faultInjector?.hit("before_dispatch_authority_fence", {
      dispatch_id: leased.dispatch_id,
      grant_id: leased.grant_id,
      inbox_id: leased.inbox_id,
    });
    const fenced = this.database.prepare(`
      UPDATE heartbeat_receipt_outbox
      SET status = 'DISPATCHING', updated_at = ?
      WHERE dispatch_id = ? AND status = 'LEASED' AND lease_token = ?
        AND EXISTS (
          SELECT 1 FROM grants
          WHERE grant_id = ? AND status = 'AWAITING_RECEIPT'
        )
        AND EXISTS (
          SELECT 1 FROM heartbeat_inboxes
          WHERE inbox_id = ? AND grant_id = ? AND status = 'AWAITING_RECEIPT'
        )
    `).run(
      this.clock().toISOString(),
      leased.dispatch_id,
      leaseToken,
      leased.grant_id,
      leased.inbox_id,
      leased.grant_id,
    );
    if (fenced.changes !== 1) {
      this.cancelCandidateForAuthority(leased, leaseToken);
      return {
        dispatch_id: leased.dispatch_id,
        grant_id: leased.grant_id,
        status: "FAILED",
        error_code: "ENROLLMENT_NOT_DISPATCHABLE",
      };
    }

    let acknowledgement;
    try {
      acknowledgement = await this.receiptSink.dispatchEnrollmentReceipt({
        dispatch_id: leased.dispatch_id,
        managed_context_kind: leased.managed_context_kind,
        managed_context_id: leased.managed_context_id,
        receipt,
        receipt_digest: leased.receipt_digest,
        correlation_id: leased.correlation_id,
      });
    } catch (error) {
      if (error?.statusCode === 409) {
        this.failCandidate(leased, leaseToken, "DESTINATION_CONFLICT");
      }
      throw error;
    }
    if (
      acknowledgement?.accepted !== true ||
      acknowledgement.dispatch_id !== leased.dispatch_id ||
      acknowledgement.receipt_digest !== leased.receipt_digest ||
      typeof acknowledgement.acknowledgement_digest !== "string"
    ) {
      this.failCandidate(leased, leaseToken, "DESTINATION_ACK_INVALID");
      throw new DurableEnrollmentError("Destination acknowledgement is invalid", 422);
    }

    const deliveredAt = this.clock().toISOString();
    inTransaction(this.database, () => {
      const completed = this.database.prepare(`
        UPDATE heartbeat_receipt_outbox
        SET status = 'DELIVERED', destination_ack_digest = ?, delivered_at = ?,
            updated_at = ?, purged_at = ?, receipt_ciphertext = NULL,
            receipt_iv = NULL, receipt_auth_tag = NULL, lease_token = NULL,
            lease_expires_at = NULL
        WHERE dispatch_id = ? AND status = 'DISPATCHING' AND lease_token = ?
      `).run(
        acknowledgement.acknowledgement_digest,
        deliveredAt,
        deliveredAt,
        deliveredAt,
        leased.dispatch_id,
        leaseToken,
      );
      if (completed.changes !== 1) {
        throw new DurableEnrollmentConflictError("Receipt delivery claim was lost");
      }
      const grant = this.database.prepare(`
        UPDATE grants SET status = 'AWAITING_HOST_BINDING'
        WHERE grant_id = ? AND status = 'AWAITING_RECEIPT'
      `).run(leased.grant_id);
      const inbox = this.database.prepare(`
        UPDATE heartbeat_inboxes SET status = 'AWAITING_HOST_BINDING'
        WHERE inbox_id = ? AND status = 'AWAITING_RECEIPT'
      `).run(leased.inbox_id);
      if (grant.changes !== 1 || inbox.changes !== 1) {
        throw new DurableEnrollmentConflictError("Enrollment delivery state transition was lost");
      }
    });
    this.record("deliver_durable_enrollment_receipt", leased.correlation_id, "completed", {
      grant_id: leased.grant_id,
      inbox_id: leased.inbox_id,
      dispatch_id: leased.dispatch_id,
      duplicate_destination_ack: acknowledgement.duplicate,
      plaintext_receipt_purged: true,
    });
    this.faultInjector?.hit("after_receiver_delivery_commit_before_response", {
      dispatch_id: leased.dispatch_id,
    });
    return {
      dispatch_id: leased.dispatch_id,
      grant_id: leased.grant_id,
      status: "AWAITING_HOST_BINDING",
      destination_duplicate: acknowledgement.duplicate,
    };
  }

  registerHostBinding({ workflow_id: workflowId, agent_binding: agentBinding }, correlationId) {
    if (workflowId !== WORKFLOW_ID) {
      throw new DurableEnrollmentError("Host binding workflow is outside scope", 422);
    }
    requireText(agentBinding, "agent_binding");
    const workflow = this.database.prepare(`
      SELECT state FROM workflows WHERE workflow_id = ?
    `).get(WORKFLOW_ID);
    const existing = this.database.prepare(`
      SELECT * FROM host_bindings WHERE workflow_id = ?
    `).get(workflowId);
    const grant = this.database.prepare(`
      SELECT g.*, i.inbox_id, i.status AS inbox_status, o.status AS outbox_status
      FROM grants g
      JOIN heartbeat_inboxes i ON i.grant_id = g.grant_id
      JOIN heartbeat_receipt_outbox o ON o.grant_id = g.grant_id
      WHERE g.agent_binding = ?
    `).get(agentBinding);
    if (
      existing?.agent_binding === agentBinding &&
      grant?.status === "ACTIVE" &&
      Date.parse(grant.expires_at) > this.clock().getTime()
    ) {
      return this.bindingResponse(grant, true);
    }
    if (existing?.agent_binding === agentBinding && Date.parse(grant?.expires_at) <= this.clock().getTime()) {
      throw new DurableEnrollmentConflictError("Grant is expired");
    }
    if (!workflow || workflow.state !== INITIAL_STATE) {
      throw new DurableEnrollmentConflictError(
        "Host binding registration is only valid in INITIAL",
      );
    }
    if (!grant || grant.workflow_id !== workflowId) {
      throw new DurableEnrollmentError("Binding does not resolve to an H2 Grant", 422);
    }
    if (existing) {
      throw new DurableEnrollmentConflictError(
        "Workflow is already bound to a different enrollment",
      );
    }
    if (
      grant.status !== "AWAITING_HOST_BINDING" ||
      grant.inbox_status !== "AWAITING_HOST_BINDING" ||
      grant.outbox_status !== "DELIVERED"
    ) {
      throw new DurableEnrollmentConflictError(
        "Receipt must be durably delivered before Host binding",
      );
    }
    if (Date.parse(grant.expires_at) <= this.clock().getTime()) {
      throw new DurableEnrollmentConflictError("Grant is expired");
    }

    const registeredAt = this.clock().toISOString();
    inTransaction(this.database, () => {
      const activeSummary = this.publicGrantSummary({ ...grant, status: "ACTIVE" });
      this.database.prepare(`
        INSERT INTO host_bindings (
          workflow_id, agent_binding, grant_summary_json, registered_at
        ) VALUES (?, ?, ?, ?)
      `).run(workflowId, agentBinding, JSON.stringify(activeSummary), registeredAt);
      const activatedGrant = this.database.prepare(`
        UPDATE grants SET status = 'ACTIVE'
        WHERE grant_id = ? AND status = 'AWAITING_HOST_BINDING'
      `).run(grant.grant_id);
      const activatedInbox = this.database.prepare(`
        UPDATE heartbeat_inboxes SET status = 'ACTIVE'
        WHERE inbox_id = ? AND status = 'AWAITING_HOST_BINDING'
      `).run(grant.inbox_id);
      if (activatedGrant.changes !== 1 || activatedInbox.changes !== 1) {
        throw new DurableEnrollmentConflictError("Host binding activation claim was lost");
      }
    });
    this.record("activate_durable_enrollment_binding", grant.correlation_id, "completed", {
      grant_id: grant.grant_id,
      inbox_id: grant.inbox_id,
      opaque_binding_registered: true,
      receipt_dispatch_completed: true,
    });
    this.faultInjector?.hit("after_binding_commit_before_response", {
      grant_id: grant.grant_id,
    });
    return this.bindingResponse({ ...grant, status: "ACTIVE" }, false);
  }

  statusForChallenge(challengeId, duplicate) {
    const row = this.database.prepare(`
      SELECT
        c.challenge_id, c.status AS challenge_status, g.grant_id,
        g.status AS grant_status, i.status AS inbox_status,
        o.status AS dispatch_status, o.dispatch_id, o.attempt_count,
        o.delivered_at, g.expires_at
      FROM binding_challenges c
      JOIN grants g ON g.challenge_id = c.challenge_id
      JOIN heartbeat_inboxes i ON i.grant_id = g.grant_id
      JOIN heartbeat_receipt_outbox o ON o.grant_id = g.grant_id
      WHERE c.challenge_id = ?
    `).get(challengeId);
    if (!row) throw new DurableEnrollmentError("Durable enrollment was not found", 404);
    return {
      challenge_id: row.challenge_id,
      grant_id: row.grant_id,
      duplicate,
      enrollment_status: enrollmentStatus(row, this.clock()),
      dispatch_status: row.dispatch_status,
      attempt_count: row.attempt_count,
      ...(row.delivered_at ? { delivered_at: row.delivered_at } : {}),
      expires_at: row.expires_at,
      secrets_exposed: false,
    };
  }

  getChallengeWithManifest(challengeId) {
    const row = this.database.prepare(`
      SELECT c.*, m.manifest_json
      FROM binding_challenges c
      JOIN manifests m ON m.manifest_id = c.manifest_id
      WHERE c.challenge_id = ?
    `).get(challengeId);
    if (!row) throw new DurableEnrollmentError("Consent challenge was not found", 404);
    return row;
  }

  validateReceiptAgainstEnrollment(receipt, row) {
    requireExactObjectKeys(receipt, [
      "receipt_type", "receipt_schema_version", "dispatch_id", "grant_id",
      "correlation_id", "workflow_id", "canonical_url", "receiver_inbox_url",
      "authorized_event_type", "continuation_intent", "human_boundary",
      "agent_binding", "expires_at",
    ], "sealed receipt");
    const expected = {
      receipt_type: "H2_DURABLE_HEARTBEAT_REENTRY",
      receipt_schema_version: RECEIPT_SCHEMA_VERSION,
      dispatch_id: row.dispatch_id,
      grant_id: row.grant_id,
      correlation_id: row.correlation_id,
      workflow_id: row.grant_workflow_id,
      canonical_url: row.canonical_url,
      authorized_event_type: row.event_type,
      human_boundary: row.human_boundary,
      agent_binding: row.agent_binding,
      expires_at: row.grant_expires_at,
    };
    for (const [field, value] of Object.entries(expected)) {
      if (receipt[field] !== value) {
        throw new DurableEnrollmentError(`Sealed receipt ${field} is outside enrollment scope`, 422);
      }
    }
    const persistedIntent = JSON.parse(row.continuation_intent_json);
    if (!isDeepStrictEqual(receipt.continuation_intent, persistedIntent)) {
      throw new DurableEnrollmentError(
        "Sealed receipt continuation_intent is outside enrollment scope",
        422,
      );
    }
    const url = new URL(receipt.receiver_inbox_url);
    const handle = decodeURIComponent(url.pathname.split("/").at(-1));
    if (
      url.origin !== this.origin ||
      !url.pathname.startsWith("/receiver/inboxes/") ||
      digestBearerToken(handle) !== row.handle_digest
    ) {
      throw new DurableEnrollmentError("Sealed receipt Inbox URL is outside enrollment scope", 422);
    }
  }

  claimCandidate(candidate, now, leaseToken, leaseExpiresAt) {
    return inTransaction(this.database, () => {
      const current = this.database.prepare(`
        SELECT o.status, o.available_at, o.lease_token, o.lease_expires_at,
               g.status AS grant_status, i.status AS inbox_status
        FROM heartbeat_receipt_outbox o
        JOIN grants g ON g.grant_id = o.grant_id
        JOIN heartbeat_inboxes i ON i.inbox_id = o.inbox_id
        WHERE o.dispatch_id = ?
      `).get(candidate.dispatch_id);
      if (!current || !isDue(current, now)) return { claimed: false, invalidAuthority: false };
      if (
        current.grant_status !== "AWAITING_RECEIPT" ||
        current.inbox_status !== "AWAITING_RECEIPT"
      ) {
        const timestamp = now.toISOString();
        const cancelled = this.database.prepare(`
          UPDATE heartbeat_receipt_outbox
          SET status = 'FAILED', last_error_code = 'ENROLLMENT_NOT_DISPATCHABLE',
              updated_at = ?, purged_at = ?, receipt_ciphertext = NULL,
              receipt_iv = NULL, receipt_auth_tag = NULL,
              lease_token = NULL, lease_expires_at = NULL
          WHERE dispatch_id = ? AND status = ?
            AND lease_token IS ? AND lease_expires_at IS ?
        `).run(
          timestamp,
          timestamp,
          candidate.dispatch_id,
          current.status,
          current.lease_token,
          current.lease_expires_at,
        );
        return { claimed: false, invalidAuthority: cancelled.changes === 1 };
      }
      const claimed = this.database.prepare(`
        UPDATE heartbeat_receipt_outbox
        SET status = 'LEASED', attempt_count = attempt_count + 1,
            lease_token = ?, lease_expires_at = ?, updated_at = ?, last_error_code = NULL
        WHERE dispatch_id = ? AND status = ?
          AND lease_token IS ? AND lease_expires_at IS ?
      `).run(
        leaseToken,
        leaseExpiresAt,
        now.toISOString(),
        candidate.dispatch_id,
        current.status,
        current.lease_token,
        current.lease_expires_at,
      );
      return { claimed: claimed.changes === 1, invalidAuthority: false };
    });
  }

  expireCandidate(row, now) {
    const timestamp = now.toISOString();
    return inTransaction(this.database, () => {
      const expired = this.database.prepare(`
        UPDATE heartbeat_receipt_outbox
        SET status = 'EXPIRED', updated_at = ?, purged_at = ?,
            receipt_ciphertext = NULL, receipt_iv = NULL, receipt_auth_tag = NULL,
            lease_token = NULL, lease_expires_at = NULL
        WHERE dispatch_id = ? AND status = ?
          AND lease_token IS ? AND lease_expires_at IS ?
      `).run(
        timestamp,
        timestamp,
        row.dispatch_id,
        row.status,
        row.lease_token,
        row.lease_expires_at,
      );
      if (expired.changes !== 1) return false;
      this.database.prepare(`
        UPDATE grants SET status = 'EXPIRED'
        WHERE grant_id = ? AND status IN ('AWAITING_RECEIPT', 'AWAITING_HOST_BINDING')
      `).run(row.grant_id);
      this.database.prepare(`
        UPDATE heartbeat_inboxes SET status = 'EXPIRED'
        WHERE inbox_id = ? AND status IN ('AWAITING_RECEIPT', 'AWAITING_HOST_BINDING')
      `).run(row.inbox_id);
      return true;
    });
  }

  failCandidate(row, leaseToken, errorCode) {
    const timestamp = this.clock().toISOString();
    return inTransaction(this.database, () => {
      const failed = this.database.prepare(`
        UPDATE heartbeat_receipt_outbox
        SET status = 'FAILED', last_error_code = ?, updated_at = ?, purged_at = ?,
            receipt_ciphertext = NULL, receipt_iv = NULL, receipt_auth_tag = NULL,
            lease_token = NULL, lease_expires_at = NULL
        WHERE dispatch_id = ? AND status IN ('LEASED', 'DISPATCHING')
          AND lease_token = ?
      `).run(errorCode, timestamp, timestamp, row.dispatch_id, leaseToken);
      if (failed.changes !== 1) return false;
      this.database.prepare(`
        UPDATE grants SET status = 'FAILED'
        WHERE grant_id = ? AND status = 'AWAITING_RECEIPT'
      `).run(row.grant_id);
      this.database.prepare(`
        UPDATE heartbeat_inboxes SET status = 'REVOKED'
        WHERE inbox_id = ? AND status = 'AWAITING_RECEIPT'
      `).run(row.inbox_id);
      return true;
    });
  }

  cancelCandidateForAuthority(row, leaseToken) {
    const timestamp = this.clock().toISOString();
    return this.database.prepare(`
      UPDATE heartbeat_receipt_outbox
      SET status = 'FAILED', last_error_code = 'ENROLLMENT_NOT_DISPATCHABLE',
          updated_at = ?, purged_at = ?, receipt_ciphertext = NULL,
          receipt_iv = NULL, receipt_auth_tag = NULL,
          lease_token = NULL, lease_expires_at = NULL
      WHERE dispatch_id = ? AND status = 'LEASED' AND lease_token = ?
    `).run(timestamp, timestamp, row.dispatch_id, leaseToken).changes === 1;
  }

  bindingResponse(grant, duplicate) {
    return {
      agent_binding: grant.agent_binding,
      duplicate,
      grant_summary: this.publicGrantSummary({ ...grant, status: "ACTIVE" }),
      enrollment_status: "ACTIVE",
    };
  }

  publicGrantSummary(grant) {
    return {
      grant_id: grant.grant_id,
      correlation_id: grant.correlation_id,
      workflow_id: grant.workflow_id,
      issuer_origin: grant.issuer_origin,
      event_type: grant.event_type,
      canonical_url: grant.canonical_url,
      max_runs: grant.max_runs,
      runs_used: grant.runs_used,
      status: grant.status,
      expires_at: grant.expires_at,
      human_boundary: grant.human_boundary,
    };
  }

  record(action, correlationId, outcome, details) {
    this.trace?.record({
      correlation_id: correlationId,
      component: "durable_enrollment",
      action,
      workflow_id: WORKFLOW_ID,
      ...(details.grant_id ? { grant_id: details.grant_id } : {}),
      outcome,
      details,
    });
  }
}

export function buildDurableReceiptAad({
  dispatchId,
  grantId,
  inboxId,
  contextBindingDigest,
}) {
  return {
    purpose: "H2_DURABLE_ENROLLMENT_RECEIPT",
    receipt_schema_version: RECEIPT_SCHEMA_VERSION,
    dispatch_id: dispatchId,
    grant_id: grantId,
    inbox_id: inboxId,
    context_binding_digest: contextBindingDigest,
  };
}

export function digestContextBinding({ managed_context_kind: kind, managed_context_id: id }) {
  requireText(kind, "managed_context_kind");
  requireText(id, "managed_context_id");
  return createHash("sha256").update(canonicalJson({
    purpose: "H2_MANAGED_CONTEXT_BINDING",
    managed_context_kind: kind,
    managed_context_id: id,
  })).digest("base64url");
}

function isDue(row, now) {
  if (row.status === "PENDING") return row.available_at <= now.toISOString();
  return ["LEASED", "DISPATCHING"].includes(row.status) &&
    row.lease_expires_at <= now.toISOString();
}

function enrollmentStatus(row, now) {
  if (Date.parse(row.expires_at) <= now.getTime()) return "EXPIRED";
  if (row.grant_status === "ACTIVE" && row.inbox_status === "ACTIVE") return "ACTIVE";
  if (row.dispatch_status === "DELIVERED") return "AWAITING_HOST_BINDING";
  if (row.dispatch_status === "EXPIRED") return "EXPIRED";
  if (row.dispatch_status === "FAILED") return "FAILED";
  return "RECEIPT_PENDING";
}

function requireExactObjectKeys(value, expectedFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DurableEnrollmentError(`${label} must be an object`, 422);
  }
  const actual = Object.keys(value).sort();
  const expected = [...expectedFields].sort();
  if (actual.length !== expected.length || actual.some((field, index) => field !== expected[index])) {
    throw new DurableEnrollmentError(`${label} fields do not match the strict contract`, 422);
  }
}

function requireText(value, field) {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 4096) {
    throw new TypeError(`${field} must be a bounded non-empty string`);
  }
}

function requireMatchingCorrelation(expected, actual) {
  if (expected !== actual) {
    throw new DurableEnrollmentError("Request correlation does not match the enrollment", 422);
  }
}

export class DurableEnrollmentError extends Error {
  constructor(message, statusCode = 422) {
    super(message);
    this.name = "DurableEnrollmentError";
    this.statusCode = statusCode;
  }
}

export class DurableEnrollmentConflictError extends DurableEnrollmentError {
  constructor(message) {
    super(message, 409);
    this.name = "DurableEnrollmentConflictError";
  }
}

export class DurableEnrollmentAuthorizationError extends DurableEnrollmentError {
  constructor(message) {
    super(message, 403);
    this.name = "DurableEnrollmentAuthorizationError";
  }
}
