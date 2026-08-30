import { AgentContinuationAdapter } from "./adapter-contract.mjs";
import { AppServerClient } from "./app-server-client.mjs";
import { MVP_ROOT, WORKFLOW_ID } from "../config.mjs";

const STAGE_A_MARKER = "STAGE_A_CONTEXT_MARKER_WF_001";

export class AppServerAdapter extends AgentContinuationAdapter {
  constructor({ trace, clock = () => new Date(), model = "gpt-5.6-terra", cwd = MVP_ROOT } = {}) {
    super();
    this.trace = trace;
    this.clock = clock;
    this.model = model;
    this.cwd = cwd;
    this.name = "codex-app-server-adapter";
    this.proofClassification = "supported_app_server_q3_only";
  }

  async ensureTestContext({ managedContextId, managedContextKind, priorEvidence } = {}) {
    const client = await new AppServerClient().connect();
    try {
      if (managedContextId) {
        const resumed = await client.request("thread/resume", { threadId: managedContextId });
        return {
          managed_context_id: resumed.thread.id,
          managed_context_kind: managedContextKind ?? "codex-app-server-thread",
          prior_evidence: priorEvidence ?? STAGE_A_MARKER,
        };
      }

      const started = await client.request("thread/start", {
        model: this.model,
        cwd: this.cwd,
        approvalPolicy: "never",
        sandbox: "read-only",
        serviceName: "webmcp_reentry_p0",
      });
      const threadId = started.thread.id;
      const firstTurn = await this.runTurn(client, threadId, {
        input: [
          "This is the controlled Stage-A context for a re-entry validation.",
          `Reply with exactly ${STAGE_A_MARKER} and no other text.`,
          "Do not call tools.",
        ].join(" "),
      });
      if (firstTurn.agentText.trim() !== STAGE_A_MARKER) {
        throw new Error("App Server Stage-A marker was not created deterministically");
      }
      return {
        managed_context_id: threadId,
        managed_context_kind: "codex-app-server-thread",
        prior_evidence: STAGE_A_MARKER,
      };
    } finally {
      await client.close();
    }
  }

  async captureCurrentContext({ correlationId } = {}) {
    const result = await this.ensureTestContext();
    this.trace?.record({
      correlation_id: correlationId,
      component: "adapter",
      action: "capture_managed_context",
      workflow_id: WORKFLOW_ID,
      outcome: "completed",
      details: {
        adapter: this.name,
        managed_context_kind: result.managed_context_kind,
        proof_classification: this.proofClassification,
        caller_selected_context_id: false,
        capture_scope: "receiver_created_controlled_app_server_context",
      },
    });
    return result;
  }

  async persistContinuationReceipt({ managedContextId, receipt, agentBinding, correlationId }) {
    const client = await new AppServerClient().connect();
    try {
      const resumed = await client.request("thread/resume", { threadId: managedContextId });
      await client.request("thread/inject_items", {
        threadId: managedContextId,
        items: [{
          type: "message",
          role: "assistant",
          content: [{
            type: "output_text",
            text: `VALIDATED_CONTINUATION_RECEIPT:${JSON.stringify({
              ...receipt,
              agent_binding: agentBinding,
            })}`,
          }],
        }],
      });
      this.trace?.record({
        correlation_id: correlationId,
        component: "adapter",
        action: "persist_continuation_receipt",
        workflow_id: receipt.workflow_id,
        grant_id: receipt.grant_id,
        outcome: "completed",
        details: {
          adapter: this.name,
          exact_thread_resolved: resumed.thread.id === managedContextId,
          proof_classification: this.proofClassification,
        },
      });
      return { persisted: true, adapter: this.name, exact_thread_resolved: true };
    } finally {
      await client.close();
    }
  }

  async resumeContext({ managedContextId, wakeInput, correlationId, grantId, eventId, runId }) {
    const client = await new AppServerClient().connect();
    try {
      const resumed = await client.request("thread/resume", { threadId: managedContextId });
      const continuation = await this.runTurn(client, managedContextId, {
        input: [
          wakeInput,
          "For this Q3-only adapter probe, do not call tools, fetch the URL, or substitute another browser mechanism.",
          "Based only on prior managed-context history, return the requested structured evidence.",
        ].join(" "),
        outputSchema: {
          type: "object",
          properties: {
            prior_marker: { type: "string" },
            receipt_grant_id: { type: "string" },
            browser_contract_available: { type: "boolean" },
          },
          required: ["prior_marker", "receipt_grant_id", "browser_contract_available"],
          additionalProperties: false,
        },
      });
      const evidence = parseJsonOutput(continuation.agentText);
      const result = {
        adapter: this.name,
        proof_classification: this.proofClassification,
        managed_context_id: managedContextId,
        exact_binding_resolved: resumed.thread.id === managedContextId,
        real_codex_context_resumed: resumed.thread.id === managedContextId,
        prior_context_marker_recalled: evidence.prior_marker === STAGE_A_MARKER,
        continuation_receipt_recalled: evidence.receipt_grant_id === grantId,
        receipt_grant_id: evidence.receipt_grant_id,
        turn_id: continuation.turnId,
        browser_attached: false,
        browser_contract_available: false,
        genuine_site_tools_available: false,
      };
      this.trace?.record({
        correlation_id: correlationId,
        component: "adapter",
        action: "resume_exact_app_server_thread",
        workflow_id: WORKFLOW_ID,
        grant_id: grantId,
        event_id: eventId,
        run_id: runId,
        outcome: "completed",
        details: result,
      });
      return result;
    } finally {
      await client.close();
    }
  }

  async archiveContext(managedContextId) {
    const client = await new AppServerClient().connect();
    try {
      await client.request("thread/resume", { threadId: managedContextId });
      await client.request("thread/archive", { threadId: managedContextId });
    } finally {
      await client.close();
    }
  }

  async runTurn(client, threadId, { input, outputSchema }) {
    const started = await client.request("turn/start", {
      threadId,
      input: [{ type: "text", text: input }],
      model: this.model,
      effort: "low",
      approvalPolicy: "never",
      sandboxPolicy: { type: "readOnly" },
      ...(outputSchema ? { outputSchema } : {}),
    });
    const turnId = started.turn.id;
    const completed = await client.waitForNotification(
      "turn/completed",
      (params) => params.turn?.id === turnId,
    );
    if (completed.turn.status !== "completed") {
      throw new Error(`App Server probe turn did not complete: ${completed.turn.status}`);
    }
    const read = await client.request("thread/read", { threadId, includeTurns: true });
    const turn = read.thread.turns.find((candidate) => candidate.id === turnId);
    const agentText = extractAgentText(turn);
    if (!agentText) throw new Error(`App Server turn has no readable Agent output: ${turnId}`);
    return { turnId, agentText };
  }
}

function parseJsonOutput(text) {
  const normalized = text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(normalized);
}

function extractAgentText(value) {
  const texts = [];
  visit(value);
  return texts.join("\n").trim();

  function visit(node) {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== "object") return;
    if (node.type === "agentMessage" && typeof node.text === "string") texts.push(node.text);
    Object.values(node).forEach(visit);
  }
}
