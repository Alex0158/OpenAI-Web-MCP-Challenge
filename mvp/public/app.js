const workflowId = "WF-001";
let currentWorkflow;
const registeredTools = new Set();
let registeredSurfaceKey = null;
let stageToolsController = null;
let toolReconciliation = Promise.resolve();
let flowCorrelationId = sessionStorage.getItem("webmcp-p0-correlation")
  ?? `corr_web_${crypto.randomUUID().replaceAll("-", "")}`;
sessionStorage.setItem("webmcp-p0-correlation", flowCorrelationId);

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Correlation-Id": flowCorrelationId,
      ...(options.headers ?? {}),
    },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? `Request failed with ${response.status}`);
  return body;
}

async function refresh() {
  currentWorkflow = await api(`/api/workflows/${workflowId}`);
  const boundCorrelationId = currentWorkflow.host_binding?.grant_summary?.correlation_id;
  if (boundCorrelationId) {
    flowCorrelationId = boundCorrelationId;
    sessionStorage.setItem("webmcp-p0-correlation", flowCorrelationId);
  }
  document.querySelector("#state").textContent = currentWorkflow.state;
  document.querySelector("#state").dataset.state = currentWorkflow.state;
  document.querySelector("#state-version").textContent = currentWorkflow.state_version;
  document.querySelector("#artifact-revision").textContent = currentWorkflow.artifact.revision;
  document.querySelector("#artifact-content").textContent = currentWorkflow.artifact.content || "No content yet.";
  document.querySelector("#binding-status").textContent = currentWorkflow.host_binding
    ? currentWorkflow.host_binding.agent_binding
      ? maskOpaqueBinding(currentWorkflow.host_binding.agent_binding)
      : "Registered"
    : "Not registered";
  document.querySelector("#commit-status").textContent = currentWorkflow.human_boundary.committed
    ? "Committed by human"
    : "Not committed";
  const commit = document.querySelector("#commit");
  commit.disabled = currentWorkflow.state !== "READY" || currentWorkflow.human_boundary.committed;
  document.querySelector("#tool-list").replaceChildren(
    ...currentWorkflow.available_site_tools.map((name) => {
      const item = document.createElement("li");
      item.textContent = name;
      return item;
    }),
  );
  return currentWorkflow;
}

function maskOpaqueBinding(value) {
  if (typeof value !== "string" || value.length < 12) return "Registered";
  return `${value.slice(0, 10)}…${value.slice(-4)}`;
}

function showResult(value) {
  document.querySelector("#result").textContent = JSON.stringify(value, null, 2);
}

function schema(properties = {}, required = []) {
  return { type: "object", properties, required, additionalProperties: false };
}

async function registerTool(definition) {
  await document.modelContext.registerTool(definition);
  registeredTools.add(definition.name);
}

async function registerStageTool(definition, controller) {
  await document.modelContext.registerTool(definition, { signal: controller.signal });
  registeredTools.add(definition.name);
}

function stageToolNames(workflow = currentWorkflow) {
  return workflow.available_site_tools.filter((name) => name !== "get_workflow_context");
}

function surfaceKey(workflow = currentWorkflow) {
  return JSON.stringify([...stageToolNames(workflow)].sort());
}

function publishWebmcpStatus() {
  const names = [...registeredTools];
  document.querySelector("#webmcp-status").textContent =
    `Registered ${names.length} genuine page Site Tools for ${currentWorkflow.state}.`;
  globalThis.__WEBMCP_P0_READY__ = {
    supported: true,
    stage: currentWorkflow.state,
    registeredTools: names,
  };
}

async function reconcileStageTools() {
  const nextSurfaceKey = surfaceKey();
  if (nextSurfaceKey === registeredSurfaceKey) {
    publishWebmcpStatus();
    return;
  }

  const priorStageTools = stageToolsController ? stageToolNamesFromKey(registeredSurfaceKey) : [];
  stageToolsController?.abort();
  for (const name of priorStageTools) registeredTools.delete(name);

  const controller = new AbortController();
  try {
    if (currentWorkflow.state === "INITIAL") {
      await registerStageTool({
        name: "prepare_artifact",
        description: "Create the first revision of continuation_note while the workflow is INITIAL.",
        inputSchema: schema({
          content: { type: "string", minLength: 1, description: "Content for the first artifact revision." },
          expected_revision: { type: "integer", minimum: 0, description: "Current artifact revision." },
        }, ["content", "expected_revision"]),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
        execute: async (input) => {
          const result = await api(`/api/workflows/${workflowId}/prepare`, {
            method: "POST",
            body: JSON.stringify(input),
          });
          await refresh();
          showResult(result);
          return result;
        },
      }, controller);
      await registerStageTool({
        name: "get_reentry_offer",
        description: "Return the signed bounded re-entry offer. This does not grant future authority.",
        inputSchema: schema(),
        annotations: { readOnlyHint: true },
        execute: async () => {
          const manifest = await api(`/api/workflows/${workflowId}/reentry-offer`);
          showResult(manifest);
          return manifest;
        },
      }, controller);
      await registerStageTool({
        name: "register_reentry_binding",
        description: "Store a Receiver-issued opaque binding in the host workflow after user consent.",
        inputSchema: schema({
          agent_binding: { type: "string", minLength: 1, description: "Opaque binding returned by the Receiver." },
        }, ["agent_binding"]),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
        execute: async ({ agent_binding }) => {
          const result = await api(`/api/workflows/${workflowId}/binding`, {
            method: "POST",
            body: JSON.stringify({ workflow_id: workflowId, agent_binding }),
          });
          await refresh();
          showResult(result);
          return result;
        },
      }, controller);
    }

    if (currentWorkflow.state === "READY" && !currentWorkflow.human_boundary.committed) {
      const heartbeatDelivery = currentWorkflow.delivery_mode === "heartbeat";
      const continuationProperties = {
        content: { type: "string", minLength: 1, description: "Complete content for the next artifact revision." },
        expected_state_version: { type: "integer", minimum: 1, description: "Current authoritative state version." },
        expected_revision: { type: "integer", minimum: 0, description: "Current artifact revision." },
        ...(heartbeatDelivery ? {
          delivery_ticket: {
            type: "string",
            minLength: 1,
            maxLength: 8192,
            description: "Opaque bounded ticket returned by the Receiver Inbox for this accepted event.",
          },
        } : {}),
      };
      await registerStageTool({
        name: "continue_artifact",
        description: heartbeatDelivery
          ? "Continue the existing continuation_note once for the accepted Receiver event and stop before the human-only commit."
          : "Continue the existing continuation_note in READY and stop before the human-only commit.",
        inputSchema: schema(
          continuationProperties,
          [
            "content",
            "expected_state_version",
            "expected_revision",
            ...(heartbeatDelivery ? ["delivery_ticket"] : []),
          ],
        ),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: heartbeatDelivery },
        execute: async (input) => {
          const result = await api(`/api/workflows/${workflowId}/continue`, {
            method: "POST",
            body: JSON.stringify(input),
          });
          await refresh();
          showResult(result);
          return result;
        },
      }, controller);
    }
  } catch (error) {
    controller.abort();
    for (const name of stageToolNames()) registeredTools.delete(name);
    throw error;
  }

  stageToolsController = controller;
  registeredSurfaceKey = nextSurfaceKey;
  publishWebmcpStatus();
}

function stageToolNamesFromKey(key) {
  return key ? JSON.parse(key) : [];
}

function scheduleToolReconciliation() {
  if (surfaceKey() === registeredSurfaceKey) return;
  setTimeout(() => {
    toolReconciliation = toolReconciliation
      .then(() => reconcileStageTools())
      .catch((error) => showResult({ error: error.message }));
  }, 0);
}

async function registerSiteTools() {
  const status = document.querySelector("#webmcp-status");
  if (typeof document.modelContext?.registerTool !== "function") {
    status.textContent = "WebMCP is unavailable in this browser. The human UI remains usable.";
    globalThis.__WEBMCP_P0_READY__ = { supported: false, registeredTools: [] };
    return;
  }

  await registerTool({
    name: "get_workflow_context",
    description: "Read authoritative workflow state, state version, the persistent artifact, and the human stopping boundary.",
    inputSchema: schema(),
    annotations: { readOnlyHint: true },
    execute: async () => {
      const workflow = await refresh();
      scheduleToolReconciliation();
      return workflow;
    },
  });
  await reconcileStageTools();
}

document.querySelector("#commit").addEventListener("click", async () => {
  try {
    const result = await api(`/api/workflows/${workflowId}/commit`, {
      method: "POST",
      headers: { "X-Human-Action": "true" },
      body: "{}",
    });
    await refresh();
    scheduleToolReconciliation();
    showResult(result);
  } catch (error) {
    showResult({ error: error.message });
  }
});

try {
  await refresh();
  await registerSiteTools();
} catch (error) {
  showResult({ error: error.message });
  globalThis.__WEBMCP_P0_READY__ = {
    supported: false,
    error: error.message,
    registeredTools: [...registeredTools],
  };
}
