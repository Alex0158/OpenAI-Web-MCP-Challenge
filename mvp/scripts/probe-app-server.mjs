import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { AppServerClient } from "../src/adapters/app-server-client.mjs";
import { MVP_ROOT } from "../src/config.mjs";

const model = process.env.WEBMCP_P0_MODEL ?? "gpt-5.6-terra";
const stageAMarker = "STAGE_A_CONTEXT_MARKER_WF_001";
const receipt = {
  receipt_type: "WEBMCP_REENTRY_GRANT",
  grant_id: "gr_app_server_probe",
  workflow_id: "WF-001",
  canonical_url: "http://127.0.0.1:4317/workflows/WF-001",
  authorized_event_type: "WORKFLOW_READY",
  continuation_intent: {
    mode: "OPEN_CANONICAL_PAGE",
    first_action: "READ_CURRENT_STATE",
    required_tool_role: "CONTINUE_ARTIFACT",
    stop_before: "COMMIT_ARTIFACT",
  },
  expires_at: "2099-01-01T00:00:00.000Z",
};

let firstClient;
let secondClient;
let threadId;
try {
  firstClient = await new AppServerClient().connect();
  const started = await firstClient.request("thread/start", {
    model,
    cwd: MVP_ROOT,
    approvalPolicy: "never",
    sandbox: "read-only",
    serviceName: "webmcp_reentry_p0",
  });
  threadId = started.thread.id;
  const firstTurn = await runTurn(firstClient, threadId, [
    "This is a controlled continuation test.",
    `Reply with exactly ${stageAMarker} and no other text.`,
    "Do not call tools.",
  ].join(" "));

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
  await firstClient.close();
  firstClient = null;

  secondClient = await new AppServerClient().connect();
  const resumed = await secondClient.request("thread/resume", { threadId });
  const afterResumeBeforeTurn = await secondClient.request("thread/read", {
    threadId,
    includeTurns: true,
  });
  const secondTurn = await runTurn(
    secondClient,
    threadId,
    [
      "This is the later authorized continuation turn.",
      "Based only on the existing conversation, return two earlier values separated by one vertical bar:",
      "first, the unique token requested by the first user turn; second, the grant_id inside the validated continuation receipt.",
      "Do not call tools.",
    ].join(" "),
  );
  const afterContinuation = await secondClient.request("thread/read", {
    threadId,
    includeTurns: true,
  });

  const beforeText = JSON.stringify(beforeDisconnect.thread);
  const resumedText = JSON.stringify(afterResumeBeforeTurn.thread);
  const expectedContinuationOutput = `${stageAMarker}|${receipt.grant_id}`;
  const result = {
    probe: "app-server-fresh-process-resume",
    proof_classification: "supported_app_server_q3_only",
    environment: {
      codex_version: execFileSync("codex", ["--version"], { encoding: "utf8" }).trim(),
      node_version: process.version,
      model,
    },
    thread_id: threadId,
    first_turn_id: firstTurn.turnId,
    second_turn_id: secondTurn.turnId,
    exact_thread_resumed: resumed.thread.id === threadId,
    first_turn_output: firstTurn.agentText,
    first_turn_output_matches_marker: firstTurn.agentText.trim() === stageAMarker,
    stage_a_marker_persisted_before_disconnect: beforeText.includes(stageAMarker),
    receipt_injection_acknowledged: injectionResult && Object.keys(injectionResult).length === 0,
    stage_a_marker_present_after_fresh_process_resume: resumedText.includes(stageAMarker),
    continuation_turn_completed: secondTurn.status === "completed",
    continuation_output: secondTurn.agentText,
    continuation_output_recalled_unrestated_marker_and_receipt:
      secondTurn.agentText.trim() === expectedContinuationOutput,
    browser_contract_available: false,
    genuine_site_tools_proven: false,
    verdict: "Q3 primitive and instruction continuity pass independently; Q4 is not addressed by App Server.",
  };
  result.pass = [
    result.exact_thread_resumed,
    result.first_turn_output_matches_marker,
    result.stage_a_marker_persisted_before_disconnect,
    result.receipt_injection_acknowledged,
    result.stage_a_marker_present_after_fresh_process_resume,
    result.continuation_turn_completed,
    result.continuation_output_recalled_unrestated_marker_and_receipt,
  ].every(Boolean);

  const evidencePath = path.join(MVP_ROOT, "evidence", "app-server-resume-probe.json");
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  await secondClient.request("thread/archive", { threadId });
  process.stdout.write(`${JSON.stringify({ ...result, evidence_path: evidencePath }, null, 2)}\n`);
  if (!result.pass) process.exitCode = 1;
} finally {
  await firstClient?.close();
  await secondClient?.close();
}

async function runTurn(client, targetThreadId, text) {
  const started = await client.request("turn/start", {
    threadId: targetThreadId,
    input: [{ type: "text", text }],
    model,
    effort: "low",
    approvalPolicy: "never",
    sandboxPolicy: { type: "readOnly" },
  });
  const turnId = started.turn.id;
  const completed = await client.waitForNotification(
    "turn/completed",
    (params) => params.turn?.id === turnId,
  );
  if (completed.turn.status !== "completed") {
    throw new Error(`Probe turn did not complete: ${completed.turn.status}`);
  }
  const read = await client.request("thread/read", {
    threadId: targetThreadId,
    includeTurns: true,
  });
  const completedTurn = read.thread.turns.find((turn) => turn.id === turnId);
  const agentText = extractAgentText(completedTurn);
  if (!agentText) throw new Error(`Probe turn has no readable Agent output: ${turnId}`);
  return { turnId, status: completed.turn.status, agentText };
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
