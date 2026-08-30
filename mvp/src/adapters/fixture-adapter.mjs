import { AgentContinuationAdapter } from "./adapter-contract.mjs";
import { createId } from "../ids.mjs";

export class FixtureAdapter extends AgentContinuationAdapter {
  constructor({ database, trace, clock = () => new Date() }) {
    super();
    this.database = database;
    this.trace = trace;
    this.clock = clock;
    this.name = "fixture-adapter";
  }

  ensureTestContext({ managedContextId, managedContextKind = "synthetic", priorEvidence }) {
    if (!managedContextId) throw new Error("managedContextId is required");
    this.database.prepare(`
      INSERT INTO adapter_contexts (
        managed_context_id, managed_context_kind, prior_evidence, updated_at
      ) VALUES (?, ?, ?, ?)
      ON CONFLICT(managed_context_id) DO UPDATE SET
        managed_context_kind = excluded.managed_context_kind,
        prior_evidence = excluded.prior_evidence,
        updated_at = excluded.updated_at
    `).run(
      managedContextId,
      managedContextKind,
      priorEvidence ?? "Stage-A synthetic context evidence",
      this.clock().toISOString(),
    );
    return { managed_context_id: managedContextId, managed_context_kind: managedContextKind };
  }

  async captureCurrentContext({ correlationId } = {}) {
    const result = this.ensureTestContext({
      managedContextId: createId("ctx_synthetic"),
      managedContextKind: "synthetic",
      priorEvidence: "Stage-A context captured inside the controlled fixture adapter",
    });
    this.trace?.record({
      correlation_id: correlationId,
      component: "adapter",
      action: "capture_managed_context",
      workflow_id: "WF-001",
      outcome: "completed",
      details: {
        adapter: this.name,
        managed_context_kind: result.managed_context_kind,
        proof_classification: "synthetic_only",
        caller_selected_context_id: false,
      },
    });
    return result;
  }

  persistContinuationReceipt({ managedContextId, receipt, agentBinding, correlationId }) {
    const context = this.getContext(managedContextId);
    const storedReceipt = { ...receipt, agent_binding: agentBinding };
    this.database.prepare(`
      UPDATE adapter_contexts SET receipt_json = ?, updated_at = ?
      WHERE managed_context_id = ?
    `).run(JSON.stringify(storedReceipt), this.clock().toISOString(), managedContextId);
    this.trace?.record({
      correlation_id: correlationId,
      component: "adapter",
      action: "persist_continuation_receipt",
      workflow_id: receipt.workflow_id,
      grant_id: receipt.grant_id,
      outcome: "completed",
      details: {
        adapter: this.name,
        managed_context_kind: context.managed_context_kind,
        proof_classification: "synthetic_only",
      },
    });
    return { persisted: true, adapter: this.name };
  }

  resumeContext({ managedContextId, wakeInput, correlationId, grantId, eventId, runId }) {
    const context = this.getContext(managedContextId);
    if (!context.receipt_json) throw new Error("Bound context has no continuation receipt");
    this.database.prepare(`
      UPDATE adapter_contexts
      SET resume_count = resume_count + 1, last_wake_input = ?, updated_at = ?
      WHERE managed_context_id = ?
    `).run(wakeInput, this.clock().toISOString(), managedContextId);
    const result = {
      adapter: this.name,
      proof_classification: "synthetic_only",
      managed_context_id: managedContextId,
      prior_context_evidence: context.prior_evidence,
      continuation_receipt: JSON.parse(context.receipt_json),
      wake_input: wakeInput,
      exact_binding_resolved: true,
      real_codex_context_resumed: false,
      browser_attached: false,
      genuine_site_tools_available: false,
    };
    this.trace?.record({
      correlation_id: correlationId,
      component: "adapter",
      action: "resume_context_probe",
      workflow_id: result.continuation_receipt.workflow_id,
      grant_id: grantId,
      event_id: eventId,
      run_id: runId,
      outcome: "completed",
      details: result,
    });
    return result;
  }

  getContext(managedContextId) {
    const context = this.database.prepare(`
      SELECT * FROM adapter_contexts WHERE managed_context_id = ?
    `).get(managedContextId);
    if (!context) throw new Error("Managed context is unknown to the adapter");
    return context;
  }
}
