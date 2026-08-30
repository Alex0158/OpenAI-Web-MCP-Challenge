import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  classifyBrowserFailure,
  hasBoundRawWebMcpCall,
  hasBrowserWebMcpProvenance,
  isActiveWriterConflict,
  sanitizeProbeError,
  shouldPersistProbeEvidence,
} from "../src/probe-evidence.mjs";

test("accepts only a direct call bound to the exact fetchTools snapshot", () => {
  const genuine = [
    "const toolsSnapshot = await existingTab.capabilities.webmcp.fetchTools();",
    'nodeRepl.write(await toolsSnapshot.call("lookup_context", {}));',
  ].join("\n");
  const decoy = [
    "const toolsSnapshot = await existingTab.capabilities.webmcp.fetchTools();",
    "const decoy = Object.freeze({ call: async () => ({ ok: true }) });",
    'nodeRepl.write(await decoy.call("lookup_context", {}));',
  ].join("\n");
  const reassigned = [
    "const toolsSnapshot = await existingTab.capabilities.webmcp.fetchTools();",
    "Object.assign(toolsSnapshot, decoy);",
    'nodeRepl.write(await toolsSnapshot.call("lookup_context", {}));',
  ].join("\n");

  assert.equal(hasBoundRawWebMcpCall(genuine, "lookup_context"), true);
  assert.equal(hasBoundRawWebMcpCall(decoy, "lookup_context"), false);
  assert.equal(hasBoundRawWebMcpCall(reassigned, "lookup_context"), false);
});

test("requires Browser WebMCP provenance for the exact invoked tool", () => {
  const call = {
    result: {
      _meta: {
        "codex/toolSurface": {
          kind: "browserUse",
          backend: "iab",
          webMcpCalls: [{
            kind: "invokeTool",
            name: "lookup_context",
            readOnlyHint: true,
            sourceHostname: "learn.chatgpt.com",
            inputJson: "{}",
            outputJson: '{"ok":true,"current_path":"/docs/webmcp"}',
          }],
        },
      },
    },
  };
  const options = {
    toolName: "lookup_context",
    sourceHostname: "learn.chatgpt.com",
    expectedPath: "/docs/webmcp",
  };
  assert.equal(hasBrowserWebMcpProvenance(call, options), true);
  assert.equal(hasBrowserWebMcpProvenance({
    result: { content: [{ text: JSON.stringify(call.result._meta) }] },
  }, options), false);
  const extraCall = structuredClone(call);
  extraCall.result._meta["codex/toolSurface"].webMcpCalls.push({
    kind: "invokeTool",
    name: "other_tool",
  });
  assert.equal(hasBrowserWebMcpProvenance(extraCall, options), false);
  const wrongHost = structuredClone(call);
  wrongHost.result._meta["codex/toolSurface"].webMcpCalls[0].sourceHostname = "example.com";
  assert.equal(hasBrowserWebMcpProvenance(wrongHost, options), false);
  const wrongInput = structuredClone(call);
  wrongInput.result._meta["codex/toolSurface"].webMcpCalls[0].inputJson = '{"forged":true}';
  assert.equal(hasBrowserWebMcpProvenance(wrongInput, options), false);
});

test("classifies bounded platform failures and protects canonical evidence", () => {
  assert.equal(classifyBrowserFailure("Browser is not available: iab"), "iab-unavailable");
  assert.equal(isActiveWriterConflict("thread already has an active writer"), true);
  assert.equal(shouldPersistProbeEvidence({ pass: false, verdict: "FAIL_IAB" }), true);
  assert.equal(shouldPersistProbeEvidence({ pass: false, verdict: "INCONCLUSIVE" }), false);
  assert.equal(shouldPersistProbeEvidence({ pass: false, verdict: "INCONCLUSIVE" }, true), true);
});

test("redacts private identifiers and checked-in evidence contains no raw task identity", () => {
  const rawId = "01a00000-1234-5678-9abc-0123456789ab";
  const marker = "TEST_CONTEXT_MARKER";
  const redacted = sanitizeProbeError(
    `Error at /Users/example: ${rawId} ${marker} thr_private123`,
    { homeDir: "/Users/example", secrets: [rawId, marker] },
  );
  assert.doesNotMatch(redacted, /01a00000|TEST_CONTEXT_MARKER|thr_private123|\/Users\/example/);

  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  for (const name of [
    "app-server-browser-join-probe-2026-08-30.json",
    "app-server-browser-warm-join-probe-2026-08-30.json",
  ]) {
    const text = fs.readFileSync(path.join(root, "evidence", name), "utf8");
    assert.doesNotMatch(text, /01a00000|TEST_CONTEXT_MARKER|\/Users\/alex/);
    assert.doesNotMatch(text, /failed_result_summary/);
  }
  const coldEvidence = JSON.parse(fs.readFileSync(path.join(
    root,
    "evidence",
    "app-server-browser-join-probe-2026-08-30.json",
  ), "utf8"));
  assert.equal(coldEvidence.node_repl_calls[0].failed_result_message, "Browser selector unavailable");
});
