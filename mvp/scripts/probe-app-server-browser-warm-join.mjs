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
  isActiveWriterConflict,
  sanitizeProbeError,
  shouldPersistProbeEvidence,
} from "../src/probe-evidence.mjs";

const model = process.env.WEBMCP_P0_MODEL ?? "gpt-5.6-terra";
const bundledCodexPath = "/Applications/ChatGPT.app/Contents/Resources/codex";
const canonicalUrl = "https://learn.chatgpt.com/docs/webmcp";
const expectedPath = "/docs/webmcp";
const expectedToolName = "lookup_context";
const webMcpProvenance = Object.freeze({
  toolName: expectedToolName,
  browserFamily: "iab",
  sourceHostname: "learn.chatgpt.com",
  expectedPath,
});
const suppliedThreadId = process.env.WEBMCP_DESKTOP_THREAD_ID?.trim() ?? "";
const expectedContextMarker = process.env.WEBMCP_DESKTOP_CONTEXT_MARKER ?? "";
const evidencePath = path.join(
  MVP_ROOT,
  "evidence",
  "app-server-browser-warm-join-probe-2026-08-30.json",
);
const outputSchema = {
  type: "object",
  properties: {
    context_marker: { type: "string" },
    browser_family: { type: "string" },
    page_url: { type: "string" },
    site_tool_name: { type: "string" },
    site_tool_result_ok: { type: "boolean" },
    observed_current_path: { type: "string" },
    used_existing_tab: { type: "boolean" },
    stopped_after_read: { type: "boolean" },
  },
  required: [
    "context_marker",
    "browser_family",
    "page_url",
    "site_tool_name",
    "site_tool_result_ok",
    "observed_current_path",
    "used_existing_tab",
    "stopped_after_read",
  ],
  additionalProperties: false,
};

let client;
let evidence;
let browserSkillPath;
let browserClientPath;

try {
  requireProbeInputs();
  assertBundledAppServerAvailable();
  browserSkillPath = resolveBrowserSkillPath();
  browserClientPath = path.resolve(
    path.dirname(browserSkillPath),
    "..",
    "..",
    "scripts",
    "browser-client.mjs",
  );
  if (!fs.existsSync(browserClientPath)) {
    throw new Error("The Browser client module is missing");
  }

  client = await new AppServerClient({
    command: bundledCodexPath,
    requestTimeoutMs: 240_000,
  }).connect();

  const resumed = await client.request("thread/resume", { threadId: suppliedThreadId });
  const beforeTurn = await client.request("thread/read", {
    threadId: suppliedThreadId,
    includeTurns: true,
  });
  const exactThreadResumed = resumed.thread.id === suppliedThreadId
    && beforeTurn.thread.id === suppliedThreadId;
  const preTurnStatus = threadStatusType(beforeTurn.thread.status);
  const contextMarkerPresentBeforeTurn = JSON.stringify(beforeTurn.thread)
    .includes(expectedContextMarker);

  if (!exactThreadResumed) {
    throw new Error("The bundled App Server did not resolve the exact supplied Desktop task");
  }
  if (preTurnStatus !== "idle") {
    throw new Error("The warm-join probe requires the supplied Desktop task to report an exact idle status");
  }
  if (!contextMarkerPresentBeforeTurn) {
    throw new Error("The supplied Desktop context marker is not present in the resumed task history");
  }
  const triggerText = [
    "$control-in-app-browser",
    "This is a controlled warm-join validation for the exact pre-existing Desktop task.",
    "Recover the exact pre-existing context marker from this task; its value is not restated in this turn.",
    `Use only the ChatGPT Desktop built-in Browser through the exact agent.browsers.get(\"iab\") selector.`,
    `Import setupBrowserRuntime only from the required absolute Browser client path: ${browserClientPath}.`,
    `Call iab.tabs.list(), select the already-existing tab whose current URL is exactly ${canonicalUrl}, and bind that existing tab with iab.tabs.get(existingTab.id).`,
    "Do not create, claim, select, navigate, reload, or replace a tab. Do not use getForUrl, getDefault, tabs.new, tabs.selected, user.openTabs, user.claimTab, Chrome, Edge, an extension, or any external browser.",
    "On that existing tab, use its current webmcp capability, call fetchTools() exactly once, and invoke exactly one Site Tool named lookup_context with an empty object.",
    "In one Node REPL execution, assign the exact existing-page result with const toolsSnapshot = await existingTab.capabilities.webmcp.fetchTools(); and immediately pass through nodeRepl.write(await toolsSnapshot.call(\"lookup_context\", {}));. Do not use another receiver object or reassign the snapshot.",
    "Do not construct, normalize, clone, merge, alter, catch, replace, or hardcode the Site Tool result. Do not read result properties in JavaScript before writing the raw result.",
    "Do not invoke any other Site Tool. Do not use Web Search, REST, direct HTTP, DOM, Playwright, CDP, Computer Use, dynamic tools, connector tools, shell commands, or generic MCP as a substitute.",
    "Stop immediately after the one read-only Site Tool result, then return only the requested structured evidence.",
  ].join(" ");

  const continuation = await runTurn(client, suppliedThreadId, {
    input: [
      { type: "skill", name: "control-in-app-browser", path: browserSkillPath },
      { type: "text", text: triggerText },
    ],
    outputSchema,
  });

  const structuredOutput = parseJsonOutputOrNull(continuation.agentText);
  const mcpCalls = collectByType(continuation.turn, "mcpToolCall");
  const nodeReplCalls = mcpCalls.filter(
    (call) => call.server === "node_repl" && call.tool === "js",
  );
  const nonBrowserTransportCalls = mcpCalls.filter(
    (call) => !(call.server === "node_repl" && call.tool === "js"),
  );
  const nodeReplSources = nodeReplCalls.map((call) => extractArgumentSource(call.arguments));
  const combinedSources = nodeReplSources.join("\n");
  const directLookupCalls = nodeReplCalls.filter((call) =>
    hasBoundRawWebMcpCall(extractArgumentSource(call.arguments), expectedToolName)
  );
  const completedRawLookupCall = directLookupCalls.find((call) =>
    call.status === "completed"
    && extractExpectedLookupContextResult(call.result) !== null
    && hasBrowserWebMcpProvenance(call, webMcpProvenance)
    && !hasHardcodedOrCaughtResult(extractArgumentSource(call.arguments))
  );
  const validatedRawResult = completedRawLookupCall
    ? extractExpectedLookupContextResult(completedRawLookupCall.result)
    : null;

  const dynamicToolCalls = collectByType(continuation.turn, "dynamicToolCall");
  const webSearchCalls = [
    ...collectByType(continuation.turn, "webSearch"),
    ...collectByType(continuation.turn, "webSearchCall"),
  ];
  const commandExecutionCalls = collectByType(continuation.turn, "commandExecution");
  const fileChangeCalls = collectByType(continuation.turn, "fileChange");
  const computerUseCalls = [
    ...collectByType(continuation.turn, "computerToolCall"),
    ...collectByType(continuation.turn, "computerUse"),
  ];
  const browserFailureClassifications = [
    ...new Set(nodeReplCalls.map((call) =>
      classifyBrowserFailure(JSON.stringify(call.result ?? null))
    ).filter(Boolean)),
  ];

  const iabSelectionCount = countMatches(
    combinedSources,
    /browsers\.get\(\s*["']iab["']\s*\)/g,
  );
  const existingTabListCount = countMatches(combinedSources, /\biab\.tabs\.list\(\s*\)/g);
  const existingTabBindCount = countMatches(combinedSources, /\biab\.tabs\.get\s*\(/g);
  const webmcpFetchCount = countMatches(
    combinedSources,
    /(?:\.capabilities\.webmcp|\bwebmcp)\.fetchTools\(\s*\)/g,
  );
  const lookupContextCallCount = countMatches(
    combinedSources,
    /\.call\(\s*["']lookup_context["']\s*,\s*\{\s*\}\s*\)/g,
  );
  const allSnapshotCallCount = countMatches(combinedSources, /\.call\s*\(/g);
  const browserRuntimeSetupCount = countMatches(combinedSources, /\bsetupBrowserRuntime\s*\(/g);
  const iabDocumentationReadCount = countMatches(
    combinedSources,
    /nodeRepl\.write\(\s*await\s+iab\.documentation\(\s*\)\s*\)/g,
  );
  const substituteArgumentObserved = hasSubstituteArgument(combinedSources);
  const structuredBoundarySatisfied = Boolean(structuredOutput)
    && structuredOutput.context_marker === expectedContextMarker
    && structuredOutput.browser_family === "iab"
    && structuredOutput.page_url === canonicalUrl
    && structuredOutput.site_tool_name === expectedToolName
    && structuredOutput.site_tool_result_ok === true
    && structuredOutput.observed_current_path === expectedPath
    && structuredOutput.used_existing_tab === true
    && structuredOutput.stopped_after_read === true;

  evidence = {
    probe: "app-server-desktop-browser-webmcp-warm-join",
    proof_classification: "current_environment_empirical_warm_join_probe",
    probe_topology: "standalone_app_server_resuming_preexisting_desktop_task_and_iab",
    probe_target: "official_openai_webmcp_documentation_control_page",
    environment: {
      codex_version: execFileSync(bundledCodexPath, ["--version"], { encoding: "utf8" }).trim(),
      node_version: process.version,
      model,
      app_server_source: "chatgpt_desktop_bundle",
      browser_skill_bundle: path.basename(path.dirname(path.dirname(path.dirname(browserSkillPath)))),
    },
    desktop_thread_id_sha256: sha256(suppliedThreadId),
    desktop_session_id_sha256:
      typeof resumed.thread.sessionId === "string" ? sha256(resumed.thread.sessionId) : null,
    context_marker_sha256: sha256(expectedContextMarker),
    exact_desktop_thread_resumed: exactThreadResumed,
    pre_turn_status: preTurnStatus,
    context_marker_present_before_turn: contextMarkerPresentBeforeTurn,
    context_marker_recovered_by_agent:
      structuredOutput?.context_marker === expectedContextMarker,
    turn_status: continuation.status,
    structured_output_present: structuredOutput !== null,
    structured_browser_family: structuredOutput?.browser_family ?? null,
    structured_page_url: structuredOutput?.page_url ?? null,
    structured_site_tool_name: structuredOutput?.site_tool_name ?? null,
    structured_observed_current_path: structuredOutput?.observed_current_path ?? null,
    structured_used_existing_tab: structuredOutput?.used_existing_tab ?? null,
    node_repl_mcp_call_count: nodeReplCalls.length,
    non_browser_transport_mcp_call_count: nonBrowserTransportCalls.length,
    dynamic_tool_call_count: dynamicToolCalls.length,
    web_search_call_count: webSearchCalls.length,
    command_execution_call_count: commandExecutionCalls.length,
    file_change_call_count: fileChangeCalls.length,
    computer_use_call_count: computerUseCalls.length,
    server_request_methods: [...client.serverRequests],
    browser_failure_classifications: browserFailureClassifications,
    node_repl_calls: nodeReplCalls.map(redactMcpCall),
    browser_runtime_setup_count: browserRuntimeSetupCount,
    exact_iab_selection_count: iabSelectionCount,
    iab_documentation_read_count: iabDocumentationReadCount,
    existing_iab_tab_list_count: existingTabListCount,
    existing_iab_tab_bind_count: existingTabBindCount,
    webmcp_fetch_tools_count: webmcpFetchCount,
    lookup_context_call_count: lookupContextCallCount,
    all_snapshot_call_count: allSnapshotCallCount,
    completed_raw_lookup_context_call_observed: Boolean(completedRawLookupCall),
    browser_webmcp_provenance_observed:
      Boolean(completedRawLookupCall)
      && hasBrowserWebMcpProvenance(completedRawLookupCall, webMcpProvenance),
    validated_raw_lookup_context_result: validatedRawResult,
    hardcoded_or_caught_result_observed: nodeReplSources.some(hasHardcodedOrCaughtResult),
    unsupported_or_substitute_tool_path_observed:
      nonBrowserTransportCalls.length > 0
      || dynamicToolCalls.length > 0
      || webSearchCalls.length > 0
      || commandExecutionCalls.length > 0
      || fileChangeCalls.length > 0
      || computerUseCalls.length > 0
      || substituteArgumentObserved,
    structured_boundary_satisfied: structuredBoundarySatisfied,
    supplied_desktop_task_archived: false,
  };

  evidence.pass = [
    evidence.exact_desktop_thread_resumed,
    evidence.pre_turn_status === "idle",
    evidence.context_marker_present_before_turn,
    evidence.context_marker_recovered_by_agent,
    evidence.turn_status === "completed",
    evidence.structured_output_present,
    evidence.node_repl_mcp_call_count > 0,
    evidence.non_browser_transport_mcp_call_count === 0,
    evidence.dynamic_tool_call_count === 0,
    evidence.web_search_call_count === 0,
    evidence.command_execution_call_count === 0,
    evidence.file_change_call_count === 0,
    evidence.computer_use_call_count === 0,
    evidence.server_request_methods.length === 0,
    evidence.browser_runtime_setup_count === 1,
    evidence.exact_iab_selection_count === 1,
    evidence.iab_documentation_read_count === 1,
    evidence.existing_iab_tab_list_count === 1,
    evidence.existing_iab_tab_bind_count === 1,
    evidence.webmcp_fetch_tools_count === 1,
    evidence.lookup_context_call_count === 1,
    evidence.all_snapshot_call_count === 1,
    evidence.completed_raw_lookup_context_call_observed,
    evidence.browser_webmcp_provenance_observed,
    evidence.validated_raw_lookup_context_result?.ok === true,
    evidence.validated_raw_lookup_context_result?.current_path === expectedPath,
    !evidence.hardcoded_or_caught_result_observed,
    !evidence.unsupported_or_substitute_tool_path_observed,
    evidence.structured_boundary_satisfied,
    evidence.supplied_desktop_task_archived === false,
  ].every(Boolean);

  evidence.verdict = evidence.pass
    ? "PASS: the bundled standalone App Server resumed the exact primed Desktop task, joined its existing built-in Browser tab, and completed one raw read-only page-bound WebMCP lookup_context call."
    : evidence.server_request_methods.length > 0
      ? "INCONCLUSIVE_HOST_CLIENT_BRIDGE_REQUIRED: the App Server requested a client-side interaction that this fail-closed warm probe did not authorize."
      : browserFailureClassifications.length > 0
        ? `FAIL_${browserFailureClassifications.join("_").toUpperCase()}: the resumed Desktop task did not expose the required existing in-app Browser session.`
        : "FAIL: the exact Desktop-task App Server Browser/WebMCP warm join was not proven under the required controls.";
} catch (error) {
  const serverRequestMethods = [...(client?.serverRequests ?? [])];
  const errorText = sanitizeError(error);
  const activeWriterConflict = isActiveWriterConflict(errorText);
  evidence = {
    probe: "app-server-desktop-browser-webmcp-warm-join",
    proof_classification: "current_environment_empirical_warm_join_probe",
    probe_topology: "standalone_app_server_resuming_preexisting_desktop_task_and_iab",
    probe_target: "official_openai_webmcp_documentation_control_page",
    environment: {
      codex_version: safeCodexVersion(),
      node_version: process.version,
      model,
      app_server_source: "chatgpt_desktop_bundle",
    },
    desktop_thread_id_sha256: suppliedThreadId ? sha256(suppliedThreadId) : null,
    context_marker_sha256: expectedContextMarker ? sha256(expectedContextMarker) : null,
    server_request_methods: serverRequestMethods,
    failure_classification: activeWriterConflict
      ? "active-writer-conflict"
      : null,
    supplied_desktop_task_archived: false,
    pass: false,
    verdict: activeWriterConflict
      ? "FAIL_ACTIVE_WRITER_CONFLICT: thread/resume reported that the supplied task already had an active writer; the public probe does not identify the writer owner."
      : serverRequestMethods.length > 0
      ? "INCONCLUSIVE_HOST_CLIENT_BRIDGE_REQUIRED: the App Server requested a client-side interaction that this fail-closed warm probe did not authorize."
      : "INCONCLUSIVE: the controlled warm-join probe did not complete.",
    error: errorText,
  };
  process.exitCode = 1;
} finally {
  await client?.close();
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

async function runTurn(targetClient, targetThreadId, { input, outputSchema: schema }) {
  const started = await targetClient.request("turn/start", {
    threadId: targetThreadId,
    input,
    model,
    effort: "low",
    approvalPolicy: "never",
    sandboxPolicy: { type: "readOnly", access: { type: "fullAccess" } },
    outputSchema: schema,
  });
  const turnId = started.turn.id;
  const completed = await targetClient.waitForNotification(
    "turn/completed",
    (params) => params.turn?.id === turnId,
    240_000,
  );
  const read = await targetClient.request("thread/read", {
    threadId: targetThreadId,
    includeTurns: true,
  });
  const turn = read.thread.turns.find((candidate) => candidate.id === turnId) ?? null;
  return {
    turnId,
    status: completed.turn.status,
    agentText: turn ? extractFinalAgentText(turn) : "",
    turn,
  };
}

function requireProbeInputs() {
  if (!suppliedThreadId) {
    throw new Error("WEBMCP_DESKTOP_THREAD_ID is required");
  }
  if (!expectedContextMarker) {
    throw new Error("WEBMCP_DESKTOP_CONTEXT_MARKER is required");
  }
}

function assertBundledAppServerAvailable() {
  if (!fs.existsSync(bundledCodexPath)) {
    throw new Error("The ChatGPT bundled Codex App Server binary is unavailable");
  }
  fs.accessSync(bundledCodexPath, fs.constants.X_OK);
}

function resolveBrowserSkillPath() {
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
  if (candidates.length === 0) {
    throw new Error("No installed control-in-app-browser skill was found");
  }
  return fs.realpathSync(candidates[0]);
}

function threadStatusType(status) {
  if (typeof status === "string") return status;
  if (status && typeof status.type === "string") return status.type;
  return null;
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

function parseJsonOutputOrNull(text) {
  if (!text) return null;
  const normalized = text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(normalized);
  } catch {
    return null;
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

function hasHardcodedOrCaughtResult(source) {
  return [
    /\btry\s*\{/,
    /\bcatch\s*(?:\(|\{)/,
    /\bfinally\s*\{/,
    /["']?ok["']?\s*[:=]\s*true/i,
    /["']?(?:current_path|currentPath)["']?\s*[:=]/,
    /\.(?:ok|current_path|currentPath)\b/,
    /\bObject\.assign\s*\(/,
    /\bJSON\.stringify\s*\(\s*await\s+[A-Za-z_$][\w$]*\.call\s*\(/,
  ].some((pattern) => pattern.test(source));
}

function hasSubstituteArgument(source) {
  return [
    /getForUrl\s*\(/,
    /getDefault\s*\(/,
    /browsers\.list\s*\(/,
    /browsers\.get\(\s*["'](?:chrome|edge|extension)["']\s*\)/,
    /\.tabs\.new\s*\(/,
    /\.tabs\.selected\s*\(/,
    /\.user\.openTabs\s*\(/,
    /\.user\.claimTab\s*\(/,
    /\.goto\s*\(/,
    /\.reload\s*\(/,
    /\b(?:playwright|dom_cua|cdp|pageAssets)\b/i,
    /\.tabs\.content\s*\(/,
    /\bfetch\s*\(/,
    /\b(?:axios|curl|wget)\b/i,
    /https?\.(?:get|request)\s*\(/i,
    /\b(?:exec|spawn|execFile|fork)\s*\(/,
    /node:child_process|child_process/,
  ].some((pattern) => pattern.test(source));
}

function extractExpectedLookupContextResult(value) {
  const seenObjects = new Set();
  const seenStrings = new Set();
  return visit(value, 0);

  function visit(node, depth) {
    if (depth > 16 || node === null || node === undefined) return null;

    if (typeof node === "string") {
      if (seenStrings.has(node)) return null;
      seenStrings.add(node);
      for (const candidate of jsonCandidates(node)) {
        try {
          const parsed = JSON.parse(candidate);
          if (parsed !== node) {
            const result = visit(parsed, depth + 1);
            if (result) return result;
          }
        } catch {
          // Non-JSON display text cannot prove the exact raw Site Tool result.
        }
      }
      return null;
    }

    if (typeof node !== "object") return null;
    if (seenObjects.has(node)) return null;
    seenObjects.add(node);

    const pathKey = Object.hasOwn(node, "current_path")
      ? "current_path"
      : Object.hasOwn(node, "currentPath")
        ? "currentPath"
        : null;
    if (node.ok === true && pathKey && node[pathKey] === expectedPath) {
      return { ok: true, current_path: expectedPath, source_path_key: pathKey };
    }

    for (const child of Object.values(node)) {
      const result = visit(child, depth + 1);
      if (result) return result;
    }
    return null;
  }
}

function jsonCandidates(text) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const candidates = [trimmed];
  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    candidates.push(trimmed.slice(objectStart, objectEnd + 1));
  }
  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    candidates.push(trimmed.slice(arrayStart, arrayEnd + 1));
  }
  return [...new Set(candidates.filter(Boolean))];
}

function redactMcpCall(call) {
  const source = extractArgumentSource(call.arguments);
  const resultText = JSON.stringify(call.result ?? null);
  return {
    server: call.server,
    tool: call.tool,
    status: call.status,
    arguments_sha256: sha256(source),
    result_sha256: sha256(resultText),
    browser_failure_classification: classifyBrowserFailure(resultText),
    arguments_contain_browser_runtime_setup: /\bsetupBrowserRuntime\s*\(/.test(source),
    arguments_contain_exact_iab_selection:
      /browsers\.get\(\s*["']iab["']\s*\)/.test(source),
    arguments_contain_existing_tab_list: /\biab\.tabs\.list\(\s*\)/.test(source),
    arguments_contain_existing_tab_bind: /\biab\.tabs\.get\s*\(/.test(source),
    arguments_contain_webmcp_discovery: /fetchTools\(\s*\)/.test(source),
    arguments_contain_direct_raw_lookup_context_call:
      hasBoundRawWebMcpCall(source, expectedToolName),
    arguments_contain_hardcoded_or_caught_result: hasHardcodedOrCaughtResult(source),
    result_proves_exact_lookup_context_output:
      extractExpectedLookupContextResult(call.result) !== null,
  };
}

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function sanitizeError(error) {
  return sanitizeProbeError(error, {
    homeDir: os.homedir(),
    secrets: [suppliedThreadId, expectedContextMarker],
  });
}

function safeCodexVersion() {
  try {
    return execFileSync(bundledCodexPath, ["--version"], { encoding: "utf8" }).trim();
  } catch {
    return "unavailable";
  }
}
