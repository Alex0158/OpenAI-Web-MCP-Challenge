import { createBearerToken, createId, digestBearerToken } from "../ids.mjs";
import { isDeepStrictEqual } from "node:util";
import { inTransaction } from "../database.mjs";
import { createReentryManifest, verifyReentryManifest } from "../webmcp-manifest.mjs";
import { CONTEXT_CAPTURE_TTL_MS, INITIAL_STATE, WORKFLOW_ID } from "../config.mjs";

export class GrantService {
  constructor({ database, adapter, origin, trace, clock = () => new Date(), manifestSecret }) {
    this.database = database;
    this.adapter = adapter;
    this.origin = origin;
    this.trace = trace;
    this.clock = clock;
    this.manifestSecret = manifestSecret;
  }

  issueManifest(correlationId) {
    this.requireInitialStage("Re-entry offers");
    const manifest = createReentryManifest({
      origin: this.origin,
      correlationId,
      now: this.clock(),
      ...(this.manifestSecret ? { manifestSecret: this.manifestSecret } : {}),
    });
    const inserted = this.database.prepare(`
      INSERT INTO manifests (
        manifest_id, workflow_id, manifest_json, created_at, expires_at
      )
      SELECT ?, ?, ?, ?, ?
      FROM workflows
      WHERE workflow_id = ? AND state = ?
    `).run(
      manifest.manifest_id,
      manifest.workflow_id,
      JSON.stringify(manifest),
      this.clock().toISOString(),
      manifest.expires_at,
      WORKFLOW_ID,
      INITIAL_STATE,
    );
    if (inserted.changes !== 1) {
      throw new GrantConflictError("Re-entry offers are only valid in INITIAL");
    }
    this.record("issue_reentry_manifest", correlationId, "completed", {
      manifest_id: manifest.manifest_id,
      allowed_event_type: manifest.allowed_event_type,
    });
    return manifest;
  }

  async captureCurrentContext(correlationId) {
    requireText(correlationId, "correlation_id");
    const managedContext = await this.adapter.captureCurrentContext({ correlationId });
    requireText(managedContext?.managed_context_kind, "adapter managed_context_kind");
    requireText(managedContext?.managed_context_id, "adapter managed_context_id");
    const contextCaptureId = createId("cc");
    const captureHandle = createBearerToken("capture");
    const expiresAt = new Date(this.clock().getTime() + CONTEXT_CAPTURE_TTL_MS).toISOString();
    this.database.prepare(`
      INSERT INTO context_captures (
        context_capture_id, handle_digest, correlation_id, workflow_id,
        managed_context_kind, managed_context_id, status, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'AVAILABLE', ?, ?)
    `).run(
      contextCaptureId,
      digestBearerToken(captureHandle),
      correlationId,
      WORKFLOW_ID,
      managedContext.managed_context_kind,
      managedContext.managed_context_id,
      this.clock().toISOString(),
      expiresAt,
    );
    this.record("capture_private_managed_context", correlationId, "completed", {
      context_capture_id: contextCaptureId,
      managed_context_kind: managedContext.managed_context_kind,
      caller_selected_context_id: false,
      public_response_contains_context_id: false,
    });
    return {
      capture_handle: captureHandle,
      correlation_id: correlationId,
      managed_context_kind: managedContext.managed_context_kind,
      expires_at: expiresAt,
      status: "AVAILABLE",
      managed_context_id_exposed: false,
    };
  }

  beginEnrollment(input, correlationId) {
    requireExactKeys(input, ["manifest", "capture_handle"], "Enrollment");
    const { manifest, capture_handle: captureHandle } = input;
    requireText(captureHandle, "capture_handle");
    verifyReentryManifest(manifest, {
      expectedOrigin: this.origin,
      now: this.clock(),
      ...(this.manifestSecret ? { manifestSecret: this.manifestSecret } : {}),
    });
    const storedManifest = this.database.prepare(`
      SELECT manifest_json FROM manifests WHERE manifest_id = ?
    `).get(manifest.manifest_id);
    const storedManifestValue = storedManifest ? JSON.parse(storedManifest.manifest_json) : null;
    if (!storedManifestValue || !isDeepStrictEqual(storedManifestValue, manifest)) {
      throw new Error("Manifest was not issued by this fixture instance");
    }
    if (manifest.correlation_id !== correlationId) {
      throw new Error("Enrollment correlation does not match the signed manifest");
    }
    const contextCapture = this.database.prepare(`
      SELECT * FROM context_captures WHERE handle_digest = ?
    `).get(digestBearerToken(captureHandle));
    if (!contextCapture) throw new Error("Context capture was not issued by this Receiver");
    if (contextCapture.status !== "AVAILABLE") {
      throw new GrantConflictError("Context capture is already consumed");
    }
    if (Date.parse(contextCapture.expires_at) <= this.clock().getTime()) {
      this.database.prepare(`
        UPDATE context_captures SET status = 'EXPIRED' WHERE context_capture_id = ?
      `).run(contextCapture.context_capture_id);
      throw new GrantConflictError("Context capture is expired");
    }
    if (contextCapture.workflow_id !== manifest.workflow_id) {
      throw new Error("Context capture workflow does not match the signed manifest");
    }
    if (contextCapture.correlation_id !== correlationId) {
      throw new Error("Context capture correlation does not match the signed manifest");
    }

    const challengeId = createId("ch");
    inTransaction(this.database, () => {
      this.database.prepare(`
        INSERT INTO binding_challenges (
          challenge_id, manifest_id, correlation_id, managed_context_kind,
          managed_context_id, status, created_at
        ) VALUES (?, ?, ?, ?, ?, 'PENDING', ?)
      `).run(
        challengeId,
        manifest.manifest_id,
        correlationId,
        contextCapture.managed_context_kind,
        contextCapture.managed_context_id,
        this.clock().toISOString(),
      );
      const consumed = this.database.prepare(`
        UPDATE context_captures
        SET status = 'CONSUMED', consumed_at = ?, consumed_by_challenge_id = ?
        WHERE context_capture_id = ? AND status = 'AVAILABLE'
      `).run(this.clock().toISOString(), challengeId, contextCapture.context_capture_id);
      if (consumed.changes !== 1) throw new GrantConflictError("Context capture is already consumed");
    });
    this.record("begin_receiver_enrollment", correlationId, "accepted", {
      challenge_id: challengeId,
      context_capture_id: contextCapture.context_capture_id,
      manifest_id: manifest.manifest_id,
      managed_context_kind: contextCapture.managed_context_kind,
      caller_selected_context_id: false,
    });
    return {
      challenge_id: challengeId,
      consent_url: `${this.origin}/receiver/consent/${challengeId}`,
      status: "PENDING",
    };
  }

  getConsentDetails(challengeId) {
    const row = this.getChallengeWithManifest(challengeId);
    const manifest = JSON.parse(row.manifest_json);
    return {
      challenge_id: row.challenge_id,
      correlation_id: row.correlation_id,
      status: row.status,
      workflow_id: manifest.workflow_id,
      issuer_origin: manifest.issuer_origin,
      event_type: manifest.allowed_event_type,
      canonical_url: manifest.canonical_url,
      expires_at: manifest.expires_at,
      max_runs: manifest.max_runs,
      human_boundary: manifest.human_boundary,
      continuation_intent: manifest.continuation_intent,
    };
  }

  async approveChallenge(challengeId, correlationId, { humanAction = false } = {}) {
    const row = this.getChallengeWithManifest(challengeId);
    if (row.status !== "PENDING") throw new GrantConflictError("Consent challenge is already decided");
    requireMatchingCorrelation(row.correlation_id, correlationId);
    if (!humanAction) throw new ConsentAuthorizationError("Approval requires the Receiver consent UI");
    const manifest = verifyReentryManifest(JSON.parse(row.manifest_json), {
      expectedOrigin: this.origin,
      now: this.clock(),
      ...(this.manifestSecret ? { manifestSecret: this.manifestSecret } : {}),
    });
    const grantId = createId("gr");
    const agentBinding = createId("ab_opaque");
    const receipt = {
      receipt_type: "WEBMCP_REENTRY_GRANT",
      grant_id: grantId,
      correlation_id: row.correlation_id,
      workflow_id: manifest.workflow_id,
      canonical_url: manifest.canonical_url,
      authorized_event_type: manifest.allowed_event_type,
      continuation_intent: manifest.continuation_intent,
      expires_at: manifest.expires_at,
    };

    inTransaction(this.database, () => {
      const claimed = this.database.prepare(`
        UPDATE binding_challenges SET status = 'APPROVING'
        WHERE challenge_id = ? AND status = 'PENDING'
      `).run(challengeId);
      if (claimed.changes !== 1) throw new GrantConflictError("Consent challenge is already decided");

      this.database.prepare(`
        INSERT INTO grants (
          grant_id, challenge_id, correlation_id, agent_binding, workflow_id, issuer_origin, event_type,
          canonical_url, max_runs, runs_used, status, expires_at, continuation_intent_json,
          human_boundary, managed_context_kind, managed_context_id, receipt_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'ACTIVATING', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        grantId,
        challengeId,
        row.correlation_id,
        agentBinding,
        manifest.workflow_id,
        manifest.issuer_origin,
        manifest.allowed_event_type,
        manifest.canonical_url,
        manifest.max_runs,
        manifest.expires_at,
        JSON.stringify(manifest.continuation_intent),
        manifest.human_boundary,
        row.managed_context_kind,
        row.managed_context_id,
        JSON.stringify(receipt),
        this.clock().toISOString(),
      );
    });

    try {
      await this.adapter.persistContinuationReceipt({
        managedContextId: row.managed_context_id,
        receipt,
        agentBinding,
        correlationId,
      });

      inTransaction(this.database, () => {
        const activated = this.database.prepare(`
          UPDATE grants SET status = 'ACTIVE'
          WHERE grant_id = ? AND status = 'ACTIVATING'
        `).run(grantId);
        if (activated.changes !== 1) throw new GrantConflictError("Grant activation claim was lost");
        const completed = this.database.prepare(`
          UPDATE binding_challenges SET status = 'APPROVED', decided_at = ?
          WHERE challenge_id = ? AND status = 'APPROVING'
        `).run(this.clock().toISOString(), challengeId);
        if (completed.changes !== 1) throw new GrantConflictError("Consent approval claim was lost");
      });
    } catch (error) {
      inTransaction(this.database, () => {
        this.database.prepare(`
          UPDATE grants SET status = 'FAILED'
          WHERE grant_id = ? AND status = 'ACTIVATING'
        `).run(grantId);
        this.database.prepare(`
          UPDATE binding_challenges SET status = 'FAILED', decided_at = ?
          WHERE challenge_id = ? AND status = 'APPROVING'
        `).run(this.clock().toISOString(), challengeId);
      });
      throw error;
    }

    const grantSummary = this.publicGrantSummary(this.getGrantByBinding(agentBinding));
    this.trace?.record({
      correlation_id: correlationId,
      component: "receiver",
      action: "approve_grant",
      workflow_id: manifest.workflow_id,
      grant_id: grantId,
      outcome: "completed",
      details: {
        challenge_id: challengeId,
        managed_context_kind: row.managed_context_kind,
        host_receives_context_id: false,
      },
    });
    return { grant_id: grantId, agent_binding: agentBinding, grant_summary: grantSummary };
  }

  declineChallenge(challengeId, correlationId, { humanAction = false } = {}) {
    const row = this.getChallengeWithManifest(challengeId);
    if (row.status !== "PENDING") throw new GrantConflictError("Consent challenge is already decided");
    requireMatchingCorrelation(row.correlation_id, correlationId);
    if (!humanAction) throw new ConsentAuthorizationError("Decline requires the Receiver consent UI");
    const decided = this.database.prepare(`
      UPDATE binding_challenges SET status = 'DECLINED', decided_at = ?
      WHERE challenge_id = ? AND status = 'PENDING'
    `).run(this.clock().toISOString(), challengeId);
    if (decided.changes !== 1) throw new GrantConflictError("Consent challenge is already decided");
    this.record("decline_grant", correlationId, "completed", { challenge_id: challengeId });
    return { challenge_id: challengeId, status: "DECLINED", grant_created: false };
  }

  registerHostBinding({ workflow_id: workflowId, agent_binding: agentBinding }, correlationId) {
    this.requireInitialStage("Host binding registration");
    if (workflowId !== WORKFLOW_ID) throw new Error("Host binding workflow is outside scope");
    requireText(agentBinding, "agent_binding");
    const grant = this.getGrantByBinding(agentBinding);
    if (grant.workflow_id !== workflowId || grant.status !== "ACTIVE") {
      throw new Error("Binding does not resolve to an active in-scope Grant");
    }
    const summary = this.publicGrantSummary(grant);
    const registered = this.database.prepare(`
      INSERT INTO host_bindings (workflow_id, agent_binding, grant_summary_json, registered_at)
      SELECT ?, ?, ?, ?
      FROM workflows
      WHERE workflow_id = ? AND state = ?
      ON CONFLICT(workflow_id) DO UPDATE SET
        agent_binding = excluded.agent_binding,
        grant_summary_json = excluded.grant_summary_json,
        registered_at = excluded.registered_at
      WHERE EXISTS (
        SELECT 1 FROM workflows WHERE workflow_id = ? AND state = ?
      )
    `).run(
      workflowId,
      agentBinding,
      JSON.stringify(summary),
      this.clock().toISOString(),
      WORKFLOW_ID,
      INITIAL_STATE,
      WORKFLOW_ID,
      INITIAL_STATE,
    );
    if (registered.changes !== 1) {
      throw new GrantConflictError("Host binding registration is only valid in INITIAL");
    }
    this.record("register_opaque_host_binding", grant.correlation_id, "completed", {
      opaque_binding_registered: true,
      contains_managed_context_id: false,
      page_correlation_matched_grant: correlationId === grant.correlation_id,
    });
    return { agent_binding: agentBinding, grant_summary: summary };
  }

  getHostBinding() {
    const row = this.database.prepare(`
      SELECT workflow_id, agent_binding, grant_summary_json, registered_at
      FROM host_bindings WHERE workflow_id = ?
    `).get(WORKFLOW_ID);
    if (!row) return null;
    return {
      workflow_id: row.workflow_id,
      agent_binding: row.agent_binding,
      grant_summary: JSON.parse(row.grant_summary_json),
      registered_at: row.registered_at,
    };
  }

  requireInitialStage(action) {
    const workflow = this.database.prepare(
      "SELECT state FROM workflows WHERE workflow_id = ?",
    ).get(WORKFLOW_ID);
    if (!workflow || workflow.state !== INITIAL_STATE) {
      throw new GrantConflictError(`${action} is only valid in INITIAL`);
    }
  }

  getGrantByBinding(agentBinding) {
    const grant = this.database.prepare(`
      SELECT * FROM grants WHERE agent_binding = ?
    `).get(agentBinding);
    if (!grant) throw new Error("Opaque binding does not resolve to a Grant");
    return grant;
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

  getChallengeWithManifest(challengeId) {
    const row = this.database.prepare(`
      SELECT c.*, m.manifest_json
      FROM binding_challenges c
      JOIN manifests m ON m.manifest_id = c.manifest_id
      WHERE c.challenge_id = ?
    `).get(challengeId);
    if (!row) throw new Error("Consent challenge was not found");
    return row;
  }

  record(action, correlationId, outcome, details) {
    this.trace?.record({
      correlation_id: correlationId,
      component: "receiver",
      action,
      workflow_id: WORKFLOW_ID,
      outcome,
      details,
    });
  }
}

export class GrantConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "GrantConflictError";
    this.statusCode = 409;
  }
}

export class ConsentAuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConsentAuthorizationError";
    this.statusCode = 403;
  }
}

function requireText(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}

function requireExactKeys(value, allowedKeys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  const allowed = new Set(allowedKeys);
  const unexpected = Object.keys(value).filter((key) => !allowed.has(key));
  if (unexpected.length > 0) {
    throw new TypeError(`${label} contains unsupported fields: ${unexpected.join(", ")}`);
  }
}

function requireMatchingCorrelation(expected, actual) {
  if (expected !== actual) throw new Error("Request correlation does not match the Grant flow");
}
