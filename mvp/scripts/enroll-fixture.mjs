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

process.stdout.write(`${JSON.stringify({
  test_context_created: true,
  proof_classification: "synthetic_only",
  managed_context_id_exposed: contextCapture.managed_context_id_exposed,
  consent_url: enrollment.consent_url,
  next_step: "Open the Receiver-owned consent URL and make the human decision.",
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
