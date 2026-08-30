import { DEFAULT_ORIGIN } from "../src/config.mjs";
import { signEventBody } from "../src/receiver/events.mjs";

if (process.env.WEBMCP_MVP_DELIVERY !== "heartbeat") {
  throw new Error("trigger-h1-event requires WEBMCP_MVP_DELIVERY=heartbeat");
}

const current = await request("/api/workflows/WF-001");
const correlationId = current.host_binding?.grant_summary?.correlation_id;
if (!correlationId) throw new Error("Workflow has no correlated re-entry binding");
const correlationHeaders = { "X-Correlation-Id": correlationId };
const transition = await request("/api/test/transition", {
  method: "POST",
  headers: correlationHeaders,
  body: {},
});
const rawBody = JSON.stringify(transition.event);
const timestamp = String(Math.floor(Date.now() / 1000));
const signature = signEventBody(rawBody, timestamp);
const delivery = await request("/api/receiver/events", {
  method: "POST",
  rawBody,
  headers: {
    ...correlationHeaders,
    "X-Event-Timestamp": timestamp,
    "X-Event-Signature": signature,
  },
});

if (delivery.status !== "PENDING_HEARTBEAT") {
  throw new Error(`Expected PENDING_HEARTBEAT, received ${delivery.status}`);
}
process.stdout.write(`${JSON.stringify({
  transition: transition.workflow,
  delivery,
  adapter_dispatch_expected: false,
  next_step: "Restart the H1 server, then allow the same-task heartbeat to read the durable pending event.",
}, null, 2)}\n`);

async function request(path, { method = "GET", body, rawBody, headers = {} } = {}) {
  const response = await fetch(`${DEFAULT_ORIGIN}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    ...(rawBody ? { body: rawBody } : body ? { body: JSON.stringify(body) } : {}),
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error ?? `Request failed with ${response.status}`);
  return value;
}
