import { AgentContinuationAdapter } from "./adapter-contract.mjs";
import { CodexAppToolsClient } from "./codex-app-tools-client.mjs";
import { CodexAppToolsRelayClient } from "./codex-app-tools-relay-client.mjs";
import { DEFAULT_ORIGIN, WORKFLOW_ID } from "../config.mjs";

const MANAGED_CONTEXT_KIND = "codex-desktop-task";
const REQUIRED_TOOLS = ["read_thread", "open_in_codex", "send_message_to_thread"];

export class DesktopTaskAdapter extends AgentContinuationAdapter {
  constructor({
    database,
    trace,
    clock = () => new Date(),
    currentTaskId,
    clientFactory,
    environment = process.env,
  } = {}) {
    super();
    if (!database) throw new TypeError("database is required");
    this.database = database;
    this.trace = trace;
    this.clock = clock;
    this.currentTaskId = requireTrustedTaskId(
      currentTaskId ?? environment.CODEX_SESSION_ID,
    );
    this.currentTaskIdSource = currentTaskId
      ? "trusted_constructor_dependency"
      : "codex_session_environment";
    this.canonicalUrl = new URL(
      environment.WEBMCP_P0_DESKTOP_RELAY_CANONICAL_URL
        ?? `${DEFAULT_ORIGIN}/workflows/${WORKFLOW_ID}`,
    ).href;
    const relaySocket = environment.WEBMCP_P0_DESKTOP_RELAY_SOCKET?.trim();
    const relayToken = environment.WEBMCP_P0_DESKTOP_RELAY_TOKEN?.trim();
    if (Boolean(relaySocket) !== Boolean(relayToken)) {
      throw new Error("Desktop relay socket and token must be configured together");
    }
    this.transport = relaySocket ? "desktop_bundled_node_relay" : "direct_mcp_diagnostic";
    this.clientFactory = clientFactory ?? (relaySocket
      ? () => new CodexAppToolsRelayClient({
        socketPath: relaySocket,
        token: relayToken,
        currentTaskId: this.currentTaskId,
        canonicalUrl: this.canonicalUrl,
      })
      : () => new CodexAppToolsClient({
        currentTaskId: this.currentTaskId,
        env: environment,
      }));
    this.name = "codex-desktop-task-adapter";
    this.proofClassification = relaySocket
      ? "experimental_desktop_bundled_node_relay_q2_q3_dispatch"
      : "diagnostic_direct_app_tools_client_unproven";
  }

  ensureTestContext() {
    throw new Error("Desktop task mode cannot create or accept a caller-selected test context");
  }

  async captureCurrentContext({ correlationId } = {}) {
    await this.withClient(async (client) => {
      await client.requireTools(REQUIRED_TOOLS);
      const result = await client.callTool("read_thread", {
        threadId: this.currentTaskId,
        turnLimit: 1,
        includeOutputs: false,
      });
      assertReadThreadIdentity(result, this.currentTaskId);
    });
    const priorEvidence = "Trusted Desktop task identity resolved through bundled Codex App Tools read_thread.";
    this.database.prepare(`
      INSERT INTO adapter_contexts (
        managed_context_id, managed_context_kind, prior_evidence, updated_at
      ) VALUES (?, ?, ?, ?)
      ON CONFLICT(managed_context_id) DO UPDATE SET
        managed_context_kind = excluded.managed_context_kind,
        prior_evidence = excluded.prior_evidence,
        updated_at = excluded.updated_at
    `).run(
      this.currentTaskId,
      MANAGED_CONTEXT_KIND,
      priorEvidence,
      this.clock().toISOString(),
    );
    this.record("capture_managed_context", correlationId, "completed", {
      adapter: this.name,
      managed_context_kind: MANAGED_CONTEXT_KIND,
      proof_classification: this.proofClassification,
      caller_selected_context_id: false,
      identity_source: this.currentTaskIdSource,
      transport: this.transport,
      read_thread_verified: true,
      public_response_contains_context_id: false,
    });
    return {
      managed_context_id: this.currentTaskId,
      managed_context_kind: MANAGED_CONTEXT_KIND,
      prior_evidence: priorEvidence,
    };
  }

  async persistContinuationReceipt({
    managedContextId,
    receipt,
    agentBinding,
    correlationId,
  }) {
    this.assertCapturedContext(managedContextId);
    requireOpaqueBinding(agentBinding);
    const storedReceipt = { ...receipt, agent_binding: agentBinding };
    await this.withClient(async (client) => {
      await client.requireTools(REQUIRED_TOOLS);
      await client.callTool("open_in_codex", {
        threadId: managedContextId,
        target: { type: "browser", url: receipt.canonical_url },
      });
      await client.callTool("send_message_to_thread", {
        threadId: managedContextId,
        prompt: buildEnrollmentReceiptPrompt({ receipt, agentBinding }),
      });
    });
    this.database.prepare(`
      UPDATE adapter_contexts SET receipt_json = ?, updated_at = ?
      WHERE managed_context_id = ?
    `).run(JSON.stringify(storedReceipt), this.clock().toISOString(), managedContextId);
    this.record("persist_continuation_receipt", correlationId, "completed", {
      adapter: this.name,
      grant_id: receipt.grant_id,
      managed_context_kind: MANAGED_CONTEXT_KIND,
      exact_thread_resolved: managedContextId === this.currentTaskId,
      enrollment_followup_dispatched: true,
      browser_reentry_requested: true,
      transport: this.transport,
      proof_classification: this.proofClassification,
    });
    return {
      persisted: true,
      adapter: this.name,
      exact_thread_resolved: managedContextId === this.currentTaskId,
      enrollment_followup_dispatched: true,
    };
  }

  async resumeContext({ managedContextId, wakeInput, correlationId, grantId, eventId, runId }) {
    const context = this.assertCapturedContext(managedContextId);
    if (!context.receipt_json) throw new Error("Bound Desktop task has no continuation receipt");
    const receipt = JSON.parse(context.receipt_json);
    if (receipt.grant_id !== grantId) {
      throw new Error("Bound Desktop task receipt does not match the reserved Grant");
    }
    await this.withClient(async (client) => {
      await client.requireTools(REQUIRED_TOOLS);
      const readResult = await client.callTool("read_thread", {
        threadId: managedContextId,
        turnLimit: 1,
        includeOutputs: false,
      });
      assertReadThreadIdentity(readResult, managedContextId);
      await client.callTool("open_in_codex", {
        threadId: managedContextId,
        target: { type: "browser", url: receipt.canonical_url },
      });
      await client.callTool("send_message_to_thread", {
        threadId: managedContextId,
        prompt: buildEventWakePrompt({
          wakeInput,
          correlationId,
          eventId,
          runId,
        }),
      });
    });
    const result = {
      adapter: this.name,
      proof_classification: this.proofClassification,
      managed_context_id: managedContextId,
      exact_binding_resolved: managedContextId === this.currentTaskId,
      real_codex_context_resumed: false,
      continuation_receipt_recalled: false,
      desktop_followup_dispatched: true,
      browser_reentry_requested: true,
      transport: this.transport,
      browser_attached: false,
      browser_contract_available: true,
      genuine_site_tools_available: false,
    };
    const { managed_context_id: _privateManagedContextId, ...redactedResult } = result;
    this.record("resume_exact_desktop_task", correlationId, "completed", {
      ...redactedResult,
      grant_id: grantId,
      event_id: eventId,
      run_id: runId,
    });
    return result;
  }

  assertCapturedContext(managedContextId) {
    if (managedContextId !== this.currentTaskId) {
      throw new Error("Managed context does not match the trusted Desktop task binding");
    }
    const context = this.database.prepare(`
      SELECT * FROM adapter_contexts WHERE managed_context_id = ?
    `).get(managedContextId);
    if (!context || context.managed_context_kind !== MANAGED_CONTEXT_KIND) {
      throw new Error("Managed Desktop task was not captured by this Receiver");
    }
    return context;
  }

  async withClient(operation) {
    const client = await this.clientFactory({ currentTaskId: this.currentTaskId });
    await client.connect();
    try {
      return await operation(client);
    } finally {
      await client.close();
    }
  }

  record(action, correlationId, outcome, details) {
    this.trace?.record({
      correlation_id: correlationId,
      component: "adapter",
      action,
      workflow_id: WORKFLOW_ID,
      outcome,
      details,
    });
  }
}

export function buildEnrollmentReceiptPrompt({ receipt, agentBinding }) {
  requireOpaqueBinding(agentBinding);
  return [
    "A Receiver-owned human consent action approved one bounded WebMCP re-entry Grant.",
    "This is an enrollment receipt, not the future business event. Do not continue the workflow yet.",
    `Correlation ID: ${requirePromptField(receipt.correlation_id, "correlation_id")}`,
    `Grant ID: ${requirePromptField(receipt.grant_id, "grant_id")}`,
    `Workflow ID: ${requirePromptField(receipt.workflow_id, "workflow_id")}`,
    `Opaque agent binding: ${agentBinding}`,
    `Canonical URL: ${requirePromptField(receipt.canonical_url, "canonical_url")}`,
    `Authorized event type: ${requirePromptField(receipt.authorized_event_type, "authorized_event_type")}`,
    `Grant expiry: ${requirePromptField(receipt.expires_at, "expires_at")}`,
    "Use the genuine Stage-A register_reentry_binding Site Tool on the attached canonical page with exactly the opaque agent binding above.",
    "After registration, stop. Do not simulate or infer the future event.",
  ].join("\n");
}

export function buildEventWakePrompt({ wakeInput, correlationId, eventId, runId }) {
  return [
    "The Receiver accepted one authenticated business event for this exact Desktop task.",
    `Correlation ID: ${requirePromptField(correlationId, "correlation_id")}`,
    `Event ID: ${requirePromptField(eventId, "event_id")}`,
    `Run ID: ${requirePromptField(runId, "run_id")}`,
    requirePromptField(wakeInput, "wake_input"),
    "Use only genuine page-bound WebMCP Site Tools on the attached canonical page. Read fresh authoritative state, rediscover the current-stage Site Tools, continue the same artifact, and stop at the stated human boundary.",
    "Do not use REST endpoints, DOM automation, generic MCP tools, or any substitute browser mechanism.",
  ].join("\n");
}

export function assertReadThreadIdentity(result, expectedTaskId) {
  const candidates = [];
  for (const item of result?.content ?? []) {
    if (item?.type !== "text" || typeof item.text !== "string") continue;
    let parsed;
    try {
      parsed = JSON.parse(item.text);
    } catch {
      continue;
    }
    collectTaskIdentityCandidates(parsed, candidates);
  }
  if (!candidates.includes(expectedTaskId)) {
    throw new Error("Codex App Tools read_thread did not confirm the trusted Desktop task ID");
  }
}

function collectTaskIdentityCandidates(value, candidates) {
  if (!value || typeof value !== "object") return;
  for (const key of ["threadId", "thread_id"]) {
    if (typeof value[key] === "string") candidates.push(value[key]);
  }
  if (value.thread && typeof value.thread === "object" && typeof value.thread.id === "string") {
    candidates.push(value.thread.id);
  }
  if (Array.isArray(value.threads)) {
    for (const thread of value.threads) {
      if (thread && typeof thread === "object" && typeof thread.id === "string") {
        candidates.push(thread.id);
      }
    }
  }
}

function requireTrustedTaskId(value) {
  const normalized = requirePromptField(value, "trusted Desktop task ID");
  if (/\s|[\u0000-\u001f\u007f]/u.test(normalized)) {
    throw new TypeError("trusted Desktop task ID contains unsupported characters");
  }
  return normalized;
}

function requireOpaqueBinding(value) {
  const normalized = requirePromptField(value, "agent_binding");
  if (!normalized.startsWith("ab_opaque_")) {
    throw new TypeError("agent_binding must be a Receiver-issued opaque binding");
  }
  return normalized;
}

function requirePromptField(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  if (/[\r\n\u0000]/u.test(value)) {
    throw new TypeError(`${label} contains unsupported control characters`);
  }
  return value.trim();
}
