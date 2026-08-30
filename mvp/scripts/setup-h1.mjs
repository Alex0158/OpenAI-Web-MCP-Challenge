import { DEFAULT_ORIGIN } from "../src/config.mjs";

if (process.env.WEBMCP_MVP_DELIVERY !== "heartbeat") {
  throw new Error("setup-h1 requires WEBMCP_MVP_DELIVERY=heartbeat");
}
const receiverClientToken = process.env.WEBMCP_P0_RECEIVER_CLIENT_TOKEN;
if (!receiverClientToken) throw new Error("WEBMCP_P0_RECEIVER_CLIENT_TOKEN is required");

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
    content: "Stage-A artifact prepared for the H1 event-gated continuation experiment.",
    expected_revision: 0,
  },
});

process.stdout.write(`${JSON.stringify({
  prepared: true,
  delivery_mode: "heartbeat",
  proof_classification: "synthetic_h1_setup_only",
  consent_evidence: "test_operator_simulation_not_user_evidence",
  managed_context_id_exposed: contextCapture.managed_context_id_exposed,
  receipt: {
    receipt_type: "H1_HEARTBEAT_REENTRY",
    workflow_id: "WF-001",
    receiver_inbox_url: approval.receiver_inbox_url,
    trigger_phrase: "CHECK_STORED_H1_INBOX",
    policy: "Open the stored Receiver Inbox URL, call only its pending-event Site Tool, and stop without opening the canonical workflow when pending is false. When pending is true, use only the returned typed ticket and fresh canonical-page Site Tools, then acknowledge with the Host effect receipt.",
    expires_at: approval.expires_at,
  },
  workflow: prepared,
  next_step: "Store the bounded receipt in the existing idle test task, then run the no-event scheduled probe before triggering the event.",
}, null, 2)}\n`);

async function request(path, { method = "GET", body, headers = {} } = {}) {
  const response = await fetch(`${DEFAULT_ORIGIN}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error ?? `Request failed with ${response.status}`);
  return value;
}
