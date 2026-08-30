import test from "node:test";
import assert from "node:assert/strict";
import { DesktopTaskAdapter } from "../src/adapters/desktop-task-adapter.mjs";
import {
  approvedEnrollment,
  testRuntime,
  transitionAndSignedEnvelope,
} from "./helpers.mjs";

const ROOT_TASK_ID = "01a00000-0000-7000-8000-000000000010";
const CHILD_TASK_ID = "01a00000-0000-7000-8000-000000000011";
const REQUIRED_TOOL_CATALOG = [
  { name: "read_thread" },
  { name: "open_in_codex" },
  { name: "send_message_to_thread" },
];

test("Desktop capture binds the trusted session task and never the child task identity", async () => {
  const runtime = testRuntime();
  const calls = [];
  const adapter = createAdapter(runtime, calls, {
    environment: {
      CODEX_SESSION_ID: ROOT_TASK_ID,
      CODEX_THREAD_ID: CHILD_TASK_ID,
    },
  });

  const captured = await adapter.captureCurrentContext({ correlationId: "corr_desktop_capture" });
  assert.equal(captured.managed_context_id, ROOT_TASK_ID);
  assert.notEqual(captured.managed_context_id, CHILD_TASK_ID);
  assert.deepEqual(calls[0], {
    tool: "read_thread",
    arguments: { threadId: ROOT_TASK_ID, turnLimit: 1, includeOutputs: false },
  });
  runtime.database.close();
});

test("Desktop receipt dispatch opens the canonical page and carries only the opaque binding", async () => {
  const runtime = testRuntime();
  const calls = [];
  const adapter = createAdapter(runtime, calls, { currentTaskId: ROOT_TASK_ID });
  await adapter.captureCurrentContext({ correlationId: "corr_desktop_receipt" });
  const receipt = {
    receipt_type: "WEBMCP_REENTRY_GRANT",
    grant_id: "gr_test",
    correlation_id: "corr_desktop_receipt",
    workflow_id: "WF-001",
    canonical_url: "http://127.0.0.1:4317/workflows/WF-001",
    authorized_event_type: "WORKFLOW_READY",
    expires_at: "2026-08-30T12:30:00.000Z",
  };
  const result = await adapter.persistContinuationReceipt({
    managedContextId: ROOT_TASK_ID,
    receipt,
    agentBinding: "ab_opaque_test",
    correlationId: "corr_desktop_receipt",
  });

  assert.equal(result.exact_thread_resolved, true);
  assert.deepEqual(calls[1], {
    tool: "open_in_codex",
    arguments: {
      threadId: ROOT_TASK_ID,
      target: { type: "browser", url: receipt.canonical_url },
    },
  });
  assert.equal(calls[2].tool, "send_message_to_thread");
  assert.equal(calls[2].arguments.threadId, ROOT_TASK_ID);
  assert.match(calls[2].arguments.prompt, /Opaque agent binding: ab_opaque_test/);
  assert.match(calls[2].arguments.prompt, /not the future business event/i);
  assert.equal(calls[2].arguments.prompt.includes(ROOT_TASK_ID), false);
  runtime.database.close();
});

test("one authenticated event dispatches one Desktop follow-up and its duplicate dispatches none", async () => {
  const runtime = testRuntime();
  const calls = [];
  const adapter = createAdapter(runtime, calls, { currentTaskId: ROOT_TASK_ID });
  runtime.adapter = adapter;
  runtime.grants.adapter = adapter;
  runtime.events.adapter = adapter;

  runtime.domain.prepareArtifact({ content: "Stage-A draft", expected_revision: 0 }, "corr_desktop_event");
  await approvedEnrollment(runtime, "corr_desktop_event");
  const envelope = transitionAndSignedEnvelope(runtime, "corr_desktop_event");
  const first = await runtime.events.receive(envelope);
  const duplicate = await runtime.events.receive(envelope);

  const sends = calls.filter((call) => call.tool === "send_message_to_thread");
  const eventSends = sends.filter((call) => /authenticated business event/.test(call.arguments.prompt));
  assert.equal(sends.length, 2, "one enrollment receipt plus one event wake are expected");
  assert.equal(eventSends.length, 1);
  assert.equal(eventSends[0].arguments.threadId, ROOT_TASK_ID);
  assert.equal(first.adapter_result.exact_binding_resolved, true);
  assert.equal(first.adapter_result.desktop_followup_dispatched, true);
  assert.equal("managed_context_id" in first.adapter_result, false);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.run_id, first.run_id);
  assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM runs").get().count, 1);
  assert.equal(JSON.stringify(runtime.trace.entries).includes(ROOT_TASK_ID), false);
  runtime.database.close();
});

test("Desktop adapter refuses a Grant bound to any task other than the trusted session task", async () => {
  const runtime = testRuntime();
  const calls = [];
  const adapter = createAdapter(runtime, calls, { currentTaskId: ROOT_TASK_ID });
  await adapter.captureCurrentContext({ correlationId: "corr_desktop_mismatch" });
  await assert.rejects(
    adapter.persistContinuationReceipt({
      managedContextId: CHILD_TASK_ID,
      receipt: {},
      agentBinding: "ab_opaque_test",
      correlationId: "corr_desktop_mismatch",
    }),
    /does not match the trusted Desktop task binding/,
  );
  assert.equal(calls.filter((call) => call.tool === "send_message_to_thread").length, 0);
  runtime.database.close();
});

function createAdapter(runtime, calls, options) {
  return new DesktopTaskAdapter({
    database: runtime.database,
    trace: runtime.trace,
    clock: () => new Date("2026-08-30T12:00:00.000Z"),
    ...options,
    clientFactory: () => new FakeCodexAppToolsClient(calls),
  });
}

class FakeCodexAppToolsClient {
  constructor(calls) {
    this.calls = calls;
  }

  async connect() {
    return this;
  }

  async requireTools(names) {
    const available = new Set(REQUIRED_TOOL_CATALOG.map((tool) => tool.name));
    const missing = names.filter((name) => !available.has(name));
    if (missing.length > 0) throw new Error(`Missing tools: ${missing.join(", ")}`);
  }

  async callTool(tool, argumentsValue) {
    this.calls.push({ tool, arguments: structuredClone(argumentsValue) });
    const text = tool === "read_thread"
      ? JSON.stringify({ thread: { id: argumentsValue.threadId } })
      : "ok";
    return { content: [{ type: "text", text }], isError: false };
  }

  async close() {}
}
