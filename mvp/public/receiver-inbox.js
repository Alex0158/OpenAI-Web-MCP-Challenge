function parseOpaqueHandle(pathname) {
  const match = /^\/receiver\/inboxes\/([^/]+)\/?$/.exec(pathname);
  if (!match) throw new Error("Invalid Receiver inbox route.");

  let handle;
  try {
    handle = decodeURIComponent(match[1]);
  } catch {
    throw new Error("Invalid Receiver inbox handle encoding.");
  }

  if (!handle || handle.includes("/")) {
    throw new Error("Invalid Receiver inbox handle.");
  }
  return handle;
}

function schema(properties = {}, required = []) {
  return { type: "object", properties, required, additionalProperties: false };
}

function showResult(value) {
  document.querySelector("#result").textContent = JSON.stringify(value, null, 2);
}

function showError(error) {
  showResult({ error: error instanceof Error ? error.message : "Unknown Receiver error." });
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(options.headers ?? {}),
    },
  });
  const result = await response.json();
  if (!response.ok) {
    const message = typeof result?.error === "string"
      ? result.error
      : `Receiver request failed with ${response.status}.`;
    throw new Error(message);
  }
  return result;
}

const opaqueHandle = parseOpaqueHandle(globalThis.location.pathname);
const inboxPath = `/api/receiver/inboxes/${encodeURIComponent(opaqueHandle)}`;

async function getPendingReentryEvent() {
  const result = await requestJson(`${inboxPath}/pending`);
  document.querySelector("#pending-status").textContent = "The Receiver returned the current pending result.";
  document.querySelector("#inbox-status").textContent = "Reachable";
  showResult(result);
  return result;
}

async function acknowledgeReentryEffect(effectReceipt) {
  const result = await requestJson(`${inboxPath}/ack`, {
    method: "POST",
    body: JSON.stringify({ effect_receipt: effectReceipt }),
  });
  document.querySelector("#pending-status").textContent = "The Receiver accepted the bounded acknowledgement request.";
  showResult(result);
  return result;
}

async function registerSiteTools() {
  const status = document.querySelector("#webmcp-status");
  if (typeof document.modelContext?.registerTool !== "function") {
    status.textContent = "WebMCP is unavailable in this browser. The read-only human view remains usable.";
    globalThis.__WEBMCP_H1_RECEIVER_READY__ = { supported: false, registeredTools: [] };
    return;
  }

  await document.modelContext.registerTool({
    name: "get_pending_reentry_event",
    description: "Read the current bounded pending re-entry event from this Receiver inbox.",
    inputSchema: schema(),
    annotations: { readOnlyHint: true },
    execute: async () => getPendingReentryEvent(),
  });

  await document.modelContext.registerTool({
    name: "acknowledge_reentry_effect",
    description: "Idempotently acknowledge one completed re-entry effect with its opaque receipt.",
    inputSchema: schema({
      effect_receipt: {
        type: "string",
        minLength: 1,
        maxLength: 4096,
        description: "Opaque effect receipt returned after the bounded Host effect.",
      },
    }, ["effect_receipt"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    execute: async ({ effect_receipt }) => acknowledgeReentryEffect(effect_receipt),
  });

  const registeredTools = ["get_pending_reentry_event", "acknowledge_reentry_effect"];
  status.textContent = `Registered ${registeredTools.length} genuine Receiver Site Tools.`;
  globalThis.__WEBMCP_H1_RECEIVER_READY__ = { supported: true, registeredTools };
}

document.querySelector("#pending-status").textContent =
  "Invoke the read-only Site Tool to query the Receiver gate.";
document.querySelector("#inbox-status").textContent = "Ready";

try {
  await registerSiteTools();
} catch (error) {
  document.querySelector("#webmcp-status").textContent = "Receiver Site Tool registration failed.";
  globalThis.__WEBMCP_H1_RECEIVER_READY__ = {
    supported: false,
    error: error instanceof Error ? error.message : "Unknown registration error.",
    registeredTools: [],
  };
  showError(error);
}
