import { DEFAULT_ORIGIN } from "../src/config.mjs";

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
await request("/api/workflows/WF-001/prepare", {
  method: "POST",
  headers: correlationHeaders,
  body: {
    content: "Stage-A artifact prepared for the controlled Browser capability probe.",
    expected_revision: 0,
  },
});
const transition = await request("/api/test/transition", {
  method: "POST",
  headers: correlationHeaders,
  body: {},
});

process.stdout.write(`${JSON.stringify({
  prepared: true,
  workflow: transition.workflow,
  proof_classification: "synthetic_stage_condition_only",
  consent_evidence: "test_operator_simulation_not_user_evidence",
  next_step: "Reload the canonical page and inspect the genuine WebMCP capability.",
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
