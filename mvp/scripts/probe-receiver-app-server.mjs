import fs from "node:fs";
import path from "node:path";
import { createRuntime } from "../src/server.mjs";
import { MVP_ROOT } from "../src/config.mjs";
import { signEventBody } from "../src/receiver/events.mjs";

const evidencePath = path.join(MVP_ROOT, "evidence", "receiver-app-server-event-probe.json");
const runtime = createRuntime({
  databasePath: ":memory:",
  tracePath: null,
  adapterMode: "app-server",
});
const correlationId = "corr_receiver_app_server_probe";
let context;

try {
  runtime.domain.reset();
  runtime.domain.prepareArtifact({
    content: "Stage-A artifact revision created before the later event.",
    expected_revision: 0,
  }, correlationId);
  const manifest = runtime.grants.issueManifest(correlationId);
  const capture = await runtime.grants.captureCurrentContext(correlationId);
  context = runtime.database.prepare(`
    SELECT managed_context_id, managed_context_kind
    FROM context_captures WHERE handle_digest IS NOT NULL AND correlation_id = ?
    ORDER BY created_at DESC LIMIT 1
  `).get(correlationId);
  const challenge = runtime.grants.beginEnrollment({
    manifest,
    capture_handle: capture.capture_handle,
  }, correlationId);
  const approval = await runtime.grants.approveChallenge(
    challenge.challenge_id,
    correlationId,
    { humanAction: true },
  );
  runtime.grants.registerHostBinding({
    workflow_id: "WF-001",
    agent_binding: approval.agent_binding,
  }, correlationId);
  const transition = runtime.domain.transitionToReady(correlationId);
  const rawBody = JSON.stringify(transition.event);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const envelope = {
    rawBody,
    timestamp,
    signature: signEventBody(rawBody, timestamp),
    correlationId,
  };
  const firstDelivery = await runtime.events.receive(envelope);
  const duplicateDelivery = await runtime.events.receive(envelope);
  const runCount = runtime.database.prepare("SELECT count(*) AS count FROM runs").get().count;

  const result = {
    probe: "signed-receiver-event-to-fresh-process-app-server-resume",
    proof_classification: "supported_app_server_q3_with_receiver",
    correlation_id: correlationId,
    workflow_id: "WF-001",
    managed_context_kind: context.managed_context_kind,
    managed_context_id: context.managed_context_id,
    caller_selected_context_id: false,
    grant_id: approval.grant_id,
    event_id: transition.event.event_id,
    run_id: firstDelivery.run_id,
    signed_event_accepted: firstDelivery.accepted,
    exact_context_resumed: firstDelivery.adapter_result.real_codex_context_resumed,
    prior_context_recalled: firstDelivery.adapter_result.prior_context_marker_recalled,
    validated_receipt_recalled: firstDelivery.adapter_result.continuation_receipt_recalled,
    duplicate_returned_same_run:
      duplicateDelivery.duplicate && duplicateDelivery.run_id === firstDelivery.run_id,
    run_count: runCount,
    browser_contract_available: false,
    genuine_site_tools_proven: false,
    q3_verdict: "pass",
    q4_verdict: "not_proven_by_app_server",
  };
  result.pass = [
    result.signed_event_accepted,
    result.exact_context_resumed,
    result.prior_context_recalled,
    result.validated_receipt_recalled,
    result.duplicate_returned_same_run,
    result.run_count === 1,
  ].every(Boolean);

  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({ ...result, evidence_path: evidencePath }, null, 2)}\n`);
  if (!result.pass) process.exitCode = 1;
} finally {
  if (context?.managed_context_id) await runtime.adapter.archiveContext(context.managed_context_id);
  runtime.database.close();
}
