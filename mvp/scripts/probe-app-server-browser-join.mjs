import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { AppServerClient } from "../src/adapters/app-server-client.mjs";
import { MVP_ROOT } from "../src/config.mjs";
import {
  classifyBrowserFailure,
  hasBoundRawWebMcpCall,
  hasBrowserWebMcpProvenance,
  sanitizeProbeError,
  shouldPersistProbeEvidence,
} from "../src/probe-evidence.mjs";

const model = process.env.WEBMCP_P0_MODEL ?? "gpt-5.6-terra";
const bundledCodexPath = "/Applications/ChatGPT.app/Contents/Resources/codex";
const appServerCommand = process.env.WEBMCP_APP_SERVER_COMMAND
  ?? (fs.existsSync(bundledCodexPath) ? bundledCodexPath : "codex");
const canonicalUrl = "https://learn.chatgpt.com/docs/webmcp";
const expectedPath = "/docs/webmcp";
const webMcpProvenance = Object.freeze({
  toolName: "lookup_context",
  browserFamily: "iab",
  sourceHostname: "learn.chatgpt.com",
  expectedPath,
});
const stageAMarker = "APP_SERVER_BROWSER_JOIN_CONTEXT_MARKER";
const evidencePath = path.join(
  MVP_ROOT,
  "evidence",
  "app-server-browser-join-probe-2026-08-30.json",
);
const receipt = {
  receipt_type: "WEBMCP_REENTRY_GRANT",
  grant_id: "gr_app_server_browser_join_probe",
  workflow_id: "OPENAI_DOCS_WEBMCP_CONTROL",
  canonical_url: canonicalUrl,
  authorized_event_type: "REFERENCE_CONTEXT_READY",
  continuation_intent: {
    mode: "OPEN_CANONICAL_PAGE",
    first_action: "READ_CURRENT_STATE",
    required_tool_role: "READ_CURRENT_PAGE_CONTEXT",
    stop_before: "ANY_MUTATION",
  },
  expires_at: "2099-01-01T00:00:00.000Z",
};
const outputSchema = {
  type: "object",
  properties: {
    receipt_recovered: { type: "boolean" },
    browser_family: { type: "string" },
    page_url: { type: "string" },
    site_tool_name: { type: "string" },
    site_tool_result_ok: { type: "boolean" },
    observed_current_path: { type: "string" },
    stopped_after_read: { type: "boolean" },
  },
  required: [
    "receipt_recovered",
    "browser_family",
    "page_url",
    "site_tool_name",
    "site_tool_result_ok",
    "observed_current_path",
    "stopped_after_read",
  ],
  additionalProperties: false,
};

let firstClient;
let secondClient;
let threadId;
let probeRoot;
let evidence;
let stageAServerRequests = [];

try {
  const browserSkillPath = resolveBrowserSkillPath();
  const browserClientPath = path.resolve(
    path.dirname(browserSkillPath),
    "..",
    "..",
    "scripts",
    "browser-client.mjs",
  );
  if (!fs.existsSync(browserClientPath)) throw new Error("The Browser client module is missing");
  probeRoot = fs.mkdtempSync(path.join(os.tmpdir(), "webmcp-app-server-browser-join-"));

  firstClient = await new AppServerClient({
    command: appServerCommand,
    requestTimeoutMs: 240_000,
  }).connect();
  const started = await firstClient.request("thread/start", {
    model,
    cwd: probeRoot,
    approvalPolicy: "never",
    sandbox: "read-only",
    serviceName: "webmcp_app_server_browser_join_probe",
  });
  threadId = started.thread.id;

  const stageATurn = await runTurn(firstClient, threadId, {
    input: [{
      type: "text",
      text: [
        "This is the enrollment stage of a controlled continuation test.",
        `Reply with exactly ${stageAMarker} and no other text.`,
        "Do not call tools.",
      ].join(" "),
    }],
  });
  const injectionResult = await firstClient.request("thread/inject_items", {
    threadId,
    items: [{
      type: "message",
      role: "assistant",
      content: [{
        type: "output_text",
        text: `VALIDATED_CONTINUATION_RECEIPT:${JSON.stringify(receipt)}`,
      }],
    }],
  });
  const beforeDisconnect = await firstClient.request("thread/read", {
    threadId,
    includeTurns: true,
  });
  stageAServerRequests = [...firstClient.serverRequests];
  await firstClient.close();
  firstClient = null;

  secondClient = await new AppServerClient({
    command: appServerCommand,
    requestTimeoutMs: 240_000,
  }).connect();
  const resumed = await secondClient.request("thread/resume", { threadId });
  const afterResumeBeforeTurn = await secondClient.request("thread/read", {
    threadId,
    includeTurns: true,
  });

  const laterTrigger = [
    "$control-in-app-browser",
    "A Receiver accepted one authenticated event for this exact managed context.",
    "Continue only according to the validated re-entry receipt already stored in this managed context.",
    "Use the Browser skill, select only the built-in Browser with the exact iab selector, and never select a browser by URL or use a fallback browser.",
    `Import setupBrowserRuntime only from the required absolute Browser client path: ${browserClientPath}.`,
    "Open the receipt's canonical page, rediscover its current WebMCP Site Tools, invoke exactly one read-only tool named lookup_context, and return its real result without fabricating or replacing any fields.",
    "In one Node REPL execution, assign the exact page result with const toolsSnapshot = await currentTab.capabilities.webmcp.fetchTools(); and immediately pass through nodeRepl.write(await toolsSnapshot.call(\"lookup_context\", {}));. Do not use another receiver object or reassign the snapshot.",
    "Stop after that single read-only Site Tool action.",
    "Do not use Web Search, REST endpoints, DOM automation, connector tools, direct HTTP, or a substitute browser mechanism.",
    "Return only the requested structured evidence.",
  ].join(" ");
  const continuationTurn = await runTurn(secondClient, threadId, {
    input: [
      { type: "skill", name: "control-in-app-browser", path: browserSkillPath },
      { type: "text", text: laterTrigger },
    ],
    outputSchema,
  });

  const structuredOutput = parseJsonOutput(continuationTurn.agentText);
  const stageAHistory = JSON.stringify(beforeDisconnect.thread);
  const resumedHistory = JSON.stringify(afterResumeBeforeTurn.thread);
  const mcpCalls = collectByType(continuationTurn.turn, "mcpToolCall");
  const nodeReplCalls = mcpCalls.filter(
    (call) => call.server === "node_repl" && call.tool === "js",
  );
  const nodeReplSources = nodeReplCalls.map((call) => extractArgumentSource(call.arguments));
  const nonBrowserTransportCalls = mcpCalls.filter(
    (call) => !(call.server === "node_repl" && call.tool === "js"),
  );
  const combinedArguments = nodeReplSources.join("\n");
  const dynamicToolCalls = collectByType(continuationTurn.turn, "dynamicToolCall");
  const webSearchCalls = [
    ...collectByType(continuationTurn.turn, "webSearch"),
    ...collectByType(continuationTurn.turn, "webSearchCall"),
  ];
  const commandExecutionCalls = collectByType(continuationTurn.turn, "commandExecution");
  const computerUseCalls = [
    ...collectByType(continuationTurn.turn, "computerToolCall"),
    ...collectByType(continuationTurn.turn, "computerUse"),
  ];
  const exactContextResumed = resumed.thread.id === threadId;
  const receiptRecovered =
    structuredOutput.receipt_recovered === true
    && structuredOutput.page_url === canonicalUrl;
  const siteToolCalls = nodeReplCalls.filter((call) =>
    hasBoundRawWebMcpCall(extractArgumentSource(call.arguments), "lookup_context")
  );
  const completedSiteToolCall = siteToolCalls.find((call) =>
    call.status === "completed"
    && exactLookupContextResult(JSON.stringify(call.result ?? null))
    && hasBrowserWebMcpProvenance(call, webMcpProvenance)
    && !/\b(?:try|catch)\b|current_?path\s*[:=]|\bok\s*[:=]\s*true/i.test(
      extractArgumentSource(call.arguments),
    )
  );
  const iabSelectionObserved = /browsers\.get\(\s*["']iab["']\s*\)/.test(combinedArguments);
  const substituteArgumentObserved = [
    /getForUrl\s*\(/,
    /browsers\.get\(\s*["'](?:chrome|edge|extension)["']\s*\)/,
    /\b(?:playwright|dom_cua|cdp)\b/i,
    /\bfetch\s*\(/,
    /\b(?:axios|curl|wget)\b/i,
    /https?\.(?:get|request)\s*\(/i,
    /\b(?:exec|spawn|execFile)\s*\(/,
  ].some((pattern) => pattern.test(combinedArguments));
  const genuineSiteToolEffectObserved = Boolean(completedSiteToolCall);
  const stoppedAtBoundary =
    structuredOutput.browser_family === "iab"
    && structuredOutput.site_tool_name === "lookup_context"
    && structuredOutput.site_tool_result_ok === true
    && structuredOutput.observed_current_path === expectedPath
    && structuredOutput.stopped_after_read === true;

  evidence = {
    probe: "app-server-fresh-process-browser-webmcp-join",
    proof_classification: "current_environment_empirical_cold_join_probe",
    probe_topology: "app_server_owned_thread_without_preexisting_desktop_iab",
    probe_target: "official_openai_webmcp_documentation_control_page",
    environment: {
      codex_version: execFileSync(appServerCommand, ["--version"], { encoding: "utf8" }).trim(),
      node_version: process.version,
      model,
      app_server_source: appServerCommand === bundledCodexPath
        ? "chatgpt_desktop_bundle"
        : "configured_or_path_binary",
      browser_skill_bundle: path.basename(path.dirname(path.dirname(path.dirname(browserSkillPath)))),
    },
    context_binding_sha256: sha256(threadId),
    exact_context_resumed: exactContextResumed,
    stage_a_marker_output_matches: stageATurn.agentText.trim() === stageAMarker,
    stage_a_marker_persisted_before_disconnect: stageAHistory.includes(stageAMarker),
    receipt_injection_acknowledged: injectionResult && Object.keys(injectionResult).length === 0,
    receipt_visible_in_pre_turn_thread_read: resumedHistory.includes(receipt.grant_id),
    later_trigger_contains_canonical_url: laterTrigger.includes(canonicalUrl),
    later_trigger_contains_workflow_id: laterTrigger.includes(receipt.workflow_id),
    later_trigger_contains_grant_id: laterTrigger.includes(receipt.grant_id),
    receipt_recovered_from_managed_context: receiptRecovered,
    structured_browser_family: structuredOutput.browser_family,
    structured_site_tool_name: structuredOutput.site_tool_name,
    structured_page_url: structuredOutput.page_url,
    structured_observed_current_path: structuredOutput.observed_current_path,
    node_repl_mcp_call_count: nodeReplCalls.length,
    non_browser_transport_mcp_call_count: nonBrowserTransportCalls.length,
    dynamic_tool_call_count: dynamicToolCalls.length,
    web_search_call_count: webSearchCalls.length,
    command_execution_call_count: commandExecutionCalls.length,
    computer_use_call_count: computerUseCalls.length,
    server_request_methods: [...stageAServerRequests, ...secondClient.serverRequests],
    browser_failure_classifications: [
      ...new Set(nodeReplCalls.map((call) =>
        classifyBrowserFailure(JSON.stringify(call.result ?? null))
      ).filter(Boolean)),
    ],
    node_repl_calls: nodeReplCalls.map(redactMcpCall),
    browser_runtime_setup_observed: /setupBrowserRuntime/.test(combinedArguments),
    exact_iab_selection_observed: iabSelectionObserved,
    browser_page_open_observed:
      combinedArguments.includes(canonicalUrl) && /\.goto\s*\(/.test(combinedArguments),
    webmcp_capability_observed: /webmcp/.test(combinedArguments),
    webmcp_tool_discovery_observed: /fetchTools/.test(combinedArguments),
    webmcp_site_tool_call_count: siteToolCalls.length,
    browser_webmcp_provenance_observed:
      Boolean(completedSiteToolCall)
      && hasBrowserWebMcpProvenance(completedSiteToolCall, webMcpProvenance),
    genuine_site_tool_effect_observed: genuineSiteToolEffectObserved,
    site_tool_reported_success: stoppedAtBoundary,
    stopped_before_mutation: structuredOutput.stopped_after_read === true,
    unsupported_or_substitute_tool_path_observed:
      nonBrowserTransportCalls.length > 0
      || dynamicToolCalls.length > 0
      || webSearchCalls.length > 0
      || commandExecutionCalls.length > 0
      || computerUseCalls.length > 0
      || substituteArgumentObserved,
  };
  evidence.pass = [
    evidence.exact_context_resumed,
    evidence.stage_a_marker_output_matches,
    evidence.stage_a_marker_persisted_before_disconnect,
    evidence.receipt_injection_acknowledged,
    !evidence.later_trigger_contains_canonical_url,
    !evidence.later_trigger_contains_workflow_id,
    !evidence.later_trigger_contains_grant_id,
    evidence.receipt_recovered_from_managed_context,
    evidence.node_repl_mcp_call_count > 0,
    evidence.non_browser_transport_mcp_call_count === 0,
    evidence.dynamic_tool_call_count === 0,
    evidence.web_search_call_count === 0,
    evidence.command_execution_call_count === 0,
    evidence.computer_use_call_count === 0,
    evidence.server_request_methods.length === 0,
    evidence.exact_iab_selection_observed,
    evidence.browser_page_open_observed,
    evidence.browser_runtime_setup_observed,
    evidence.webmcp_capability_observed,
    evidence.webmcp_tool_discovery_observed,
    evidence.webmcp_site_tool_call_count === 1,
    evidence.browser_webmcp_provenance_observed,
    !evidence.unsupported_or_substitute_tool_path_observed,
    evidence.genuine_site_tool_effect_observed,
    evidence.site_tool_reported_success,
    evidence.stopped_before_mutation,
  ].every(Boolean);
  evidence.verdict = evidence.pass
    ? "PASS: one fresh App Server process resumed the exact stored context, recovered the unstated receipt, selected only the built-in Browser, and completed one exact genuine read-only page-bound WebMCP lookup_context call."
    : evidence.server_request_methods.length > 0
      ? "INCONCLUSIVE_HOST_CLIENT_BRIDGE_REQUIRED: the App Server requested a client-side interaction that this fail-closed probe did not authorize."
      : evidence.browser_failure_classifications.length > 0
        ? `FAIL_${evidence.browser_failure_classifications.join("_").toUpperCase()}: the Browser selector failed before page or Site Tool access.`
      : "FAIL: the bounded cold App Server-to-Desktop Browser-to-WebMCP join was not proven under the required controls.";
} catch (error) {
  evidence = {
    probe: "app-server-fresh-process-browser-webmcp-join",
    proof_classification: "current_environment_empirical_cold_join_probe",
    probe_topology: "app_server_owned_thread_without_preexisting_desktop_iab",
    probe_target: "official_openai_webmcp_documentation_control_page",
    environment: {
      codex_version: safeCodexVersion(appServerCommand),
      node_version: process.version,
      model,
      app_server_source: appServerCommand === bundledCodexPath
        ? "chatgpt_desktop_bundle"
        : "configured_or_path_binary",
    },
    context_binding_sha256: threadId ? sha256(threadId) : null,
    server_request_methods: [
      ...stageAServerRequests,
      ...(firstClient?.serverRequests ?? []),
      ...(secondClient?.serverRequests ?? []),
    ],
    pass: false,
    verdict: "INCONCLUSIVE: the controlled join probe did not complete.",
    error: sanitizeError(error),
  };
  process.exitCode = 1;
} finally {
  if (threadId && secondClient) {
    try {
      await secondClient.request("thread/archive", { threadId });
    } catch {
      // Archival is best-effort and does not change the proof result.
    }
  }
  await firstClient?.close();
  await secondClient?.close();
  if (probeRoot) fs.rmSync(probeRoot, { recursive: true, force: true });
  const evidencePersisted = shouldPersistProbeEvidence(
    evidence,
    process.env.WEBMCP_PROBE_WRITE_INCONCLUSIVE === "1",
  );
  if (evidencePersisted) {
    fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
    fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  }
  process.stdout.write(`${JSON.stringify({
    ...evidence,
    evidence_persisted: evidencePersisted,
    evidence_path: evidencePersisted ? evidencePath : null,
  }, null, 2)}\n`);
  if (!evidence?.pass) process.exitCode = 1;
}

async function runTurn(client, targetThreadId, { input, outputSchema: schema }) {
  const started = await client.request("turn/start", {
    threadId: targetThreadId,
    input,
    model,
    effort: "low",
    approvalPolicy: "never",
    sandboxPolicy: { type: "readOnly", access: { type: "fullAccess" } },
    ...(schema ? { outputSchema: schema } : {}),
  });
  const turnId = started.turn.id;
  const completed = await client.waitForNotification(
    "turn/completed",
    (params) => params.turn?.id === turnId,
    240_000,
  );
  if (completed.turn.status !== "completed") {
    throw new Error(`Probe turn did not complete: ${completed.turn.status}`);
  }
  const read = await client.request("thread/read", {
    threadId: targetThreadId,
    includeTurns: true,
  });
  const turn = read.thread.turns.find((candidate) => candidate.id === turnId);
  const agentText = extractFinalAgentText(turn);
  if (!agentText) throw new Error("Probe turn has no readable final Agent output");
  return { turnId, status: completed.turn.status, agentText, turn };
}

function resolveBrowserSkillPath() {
  const explicitPath = process.env.WEBMCP_BROWSER_SKILL_PATH;
  if (explicitPath) {
    if (!fs.existsSync(explicitPath)) throw new Error("WEBMCP_BROWSER_SKILL_PATH does not exist");
    return fs.realpathSync(explicitPath);
  }

  const bundleRoot = path.join(
    os.homedir(),
    ".codex",
    "plugins",
    "cache",
    "openai-bundled",
    "browser",
  );
  const candidates = fs.readdirSync(bundleRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(
      bundleRoot,
      entry.name,
      "skills",
      "control-in-app-browser",
      "SKILL.md",
    ))
    .filter((candidate) => fs.existsSync(candidate))
    .sort((left, right) => right.localeCompare(left, undefined, { numeric: true }));
  if (candidates.length === 0) throw new Error("No installed Browser control skill was found");
  return fs.realpathSync(candidates[0]);
}

function extractFinalAgentText(value) {
  const messages = collectByType(value, "agentMessage")
    .filter((message) => typeof message.text === "string");
  const finalMessage = [...messages].reverse().find((message) => message.phase === "final_answer");
  return (finalMessage ?? messages.at(-1))?.text?.trim() ?? "";
}

function collectByType(value, type) {
  const matches = [];
  visit(value);
  return matches;

  function visit(node) {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== "object") return;
    if (node.type === type) matches.push(node);
    Object.values(node).forEach(visit);
  }
}

function extractArgumentSource(value) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  for (const key of ["code", "input", "script", "source"]) {
    if (typeof value[key] === "string") return value[key];
  }
  return collectStrings(value).join("\n");
}

function collectStrings(value) {
  const strings = [];
  visit(value);
  return strings;

  function visit(node) {
    if (typeof node === "string") {
      strings.push(node);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== "object") return;
    Object.values(node).forEach(visit);
  }
}

function parseJsonOutput(text) {
  const normalized = text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(normalized);
}

function redactMcpCall(call) {
  const argumentsText = extractArgumentSource(call.arguments);
  const resultText = JSON.stringify(call.result ?? null);
  return {
    server: call.server,
    tool: call.tool,
    status: call.status,
    arguments_sha256: sha256(argumentsText),
    result_sha256: sha256(resultText),
    browser_failure_classification: classifyBrowserFailure(resultText),
    failed_result_message: call.status === "failed"
      ? allowlistedFailureMessage(classifyBrowserFailure(resultText))
      : null,
    arguments_contain_browser_runtime_setup: /setupBrowserRuntime/.test(argumentsText),
    arguments_contain_webmcp_discovery: /fetchTools/.test(argumentsText),
    arguments_contain_exact_site_tool_call:
      /\.call\(\s*["']lookup_context["']\s*,/.test(argumentsText),
    result_proves_exact_site_tool_output: exactLookupContextResult(resultText),
  };
}

function allowlistedFailureMessage(classification) {
  if (classification === "iab-unavailable") return "Browser selector unavailable";
  if (classification === "missing-session-metadata") return "Browser session metadata unavailable";
  if (classification === "no-iab-backends") return "No in-app Browser backend available";
  if (classification === "no-session-match") return "No matching Browser session available";
  if (classification === "browser-setup-failed") return "Browser runtime setup failed";
  return null;
}

function exactLookupContextResult(text) {
  return /(?:["']?ok["']?\\?\s*:\s*true)/i.test(text)
    && /(?:["']?current_?path["']?\\?\s*:\s*\\?["']\/docs\/webmcp\\?["'])/i.test(text);
}

function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function sanitizeError(error) {
  return sanitizeProbeError(error, { homeDir: os.homedir() });
}

function safeCodexVersion(command) {
  try {
    return execFileSync(command, ["--version"], { encoding: "utf8" }).trim();
  } catch {
    return "unavailable";
  }
}
