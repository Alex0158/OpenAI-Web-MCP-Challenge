import fs from "node:fs";
import { createHash } from "node:crypto";
import { DEFAULT_ORIGIN } from "../src/config.mjs";

if (process.env.WEBMCP_MVP_DELIVERY !== "heartbeat") {
  throw new Error("d4-h2b-setup requires WEBMCP_MVP_DELIVERY=heartbeat");
}
const receiverClientToken = process.env.WEBMCP_P0_RECEIVER_CLIENT_TOKEN;
const receiptPath = process.env.WEBMCP_D4_RECEIPT_PATH;
if (!receiverClientToken) throw new Error("WEBMCP_P0_RECEIVER_CLIENT_TOKEN is required");
if (!receiptPath) throw new Error("WEBMCP_D4_RECEIPT_PATH is required");
if (fs.existsSync(receiptPath)) throw new Error("D4/H2b receipt file already exists");

const health = await request("/health");
if (
  health.adapter !== "fixture-adapter" ||
  health.adapter_proof_classification !== "synthetic_only" ||
  health.delivery_mode !== "heartbeat" ||
  health.durable_enrollment_enabled !== false
) {
  throw new Error("D4/H2b Receiver health does not match the strict synthetic fixture boundary");
}

const manifest = await request("/api/workflows/WF-001/reentry-offer");
const correlationHeaders = { "X-Correlation-Id": manifest.correlation_id };
const contextCapture = await request("/api/receiver/context-captures", {
  method: "POST",
  headers: {
    ...correlationHeaders,
    "X-Receiver-Client-Token": receiverClientToken,
  },
});
const enrollment = await request("/api/receiver/enroll", {
  method: "POST",
  headers: correlationHeaders,
  body: {
    manifest,
    capture_handle: contextCapture.capture_handle,
  },
});
const approval = await request(`/api/receiver/consent/${enrollment.challenge_id}/approve`, {
  method: "POST",
  headers: {
    ...correlationHeaders,
    "X-Receiver-Human-Action": "true",
  },
});
await request("/api/workflows/WF-001/binding", {
  method: "POST",
  headers: correlationHeaders,
  body: { workflow_id: "WF-001", agent_binding: approval.agent_binding },
});
const prepared = await request("/api/workflows/WF-001/prepare", {
  method: "POST",
  headers: correlationHeaders,
  body: {
    content: "Stage-A artifact prepared for the D4/H2b full-Desktop-restart experiment.",
    expected_revision: 0,
  },
});

const receipt = {
  receipt_type: "D4_H2B_HEARTBEAT_REENTRY",
  workflow_id: "WF-001",
  canonical_url: manifest.canonical_url,
  authorized_event_type: manifest.allowed_event_type,
  receiver_inbox_url: approval.receiver_inbox_url,
  trigger_phrase: "CHECK_STORED_D4_INBOX",
  policy: "Open the stored Receiver Inbox URL in a fresh built-in Browser document, fetch the current page-bound Site Tools, and call only the pending-event Site Tool. Stop without opening the canonical workflow when pending is false. When pending is true, use only the returned typed ticket and fresh canonical-page Site Tools, continue the existing artifact exactly once, stop before the human commit boundary, and acknowledge with the Host effect receipt.",
  expires_at: approval.expires_at,
};
const serialized = `${JSON.stringify(receipt)}\n`;
fs.writeFileSync(receiptPath, serialized, { encoding: "utf8", mode: 0o600, flag: "wx" });

process.stdout.write(`${JSON.stringify({
  prepared: true,
  delivery_mode: "heartbeat",
  proof_classification: "synthetic_d4_h2b_setup_only",
  consent_evidence: "test_operator_simulation_not_user_evidence",
  managed_context_id_exposed: contextCapture.managed_context_id_exposed,
  receipt_sha256: createHash("sha256").update(serialized).digest("hex"),
  receipt_expires_at: approval.expires_at,
  receipt_stored_privately: true,
  workflow: {
    state: prepared.state,
    state_version: prepared.state_version,
    artifact_revision: prepared.artifact.revision,
    committed: prepared.human_boundary.committed,
  },
  next_step: "Deliver the private bounded receipt to the disposable D4 task, then run the no-event restart arm.",
}, null, 2)}\n`);

async function request(targetPath, { method = "GET", body, headers = {} } = {}) {
  const response = await fetch(`${DEFAULT_ORIGIN}${targetPath}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error ?? `Request failed with ${response.status}`);
  return value;
}
