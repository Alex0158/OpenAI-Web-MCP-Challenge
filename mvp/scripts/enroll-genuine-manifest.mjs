import fs from "node:fs";
import path from "node:path";
import { DEFAULT_ORIGIN } from "../src/config.mjs";

const receiverClientToken = process.env.WEBMCP_P0_RECEIVER_CLIENT_TOKEN;
if (!receiverClientToken) throw new Error("WEBMCP_P0_RECEIVER_CLIENT_TOKEN is required");

const manifestArgument = process.argv[2];
if (!manifestArgument) {
  throw new Error("Pass the absolute path to the exact Manifest returned by get_reentry_offer");
}
if (!path.isAbsolute(manifestArgument)) {
  throw new Error("Manifest path must be absolute");
}
const manifestPath = path.resolve(manifestArgument);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
requireManifestEnvelope(manifest);

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
  enrolled_from_supplied_manifest: true,
  manifest_id: manifest.manifest_id,
  correlation_id: manifest.correlation_id,
  managed_context_id_exposed: contextCapture.managed_context_id_exposed,
  challenge_id: enrollment.challenge_id,
  consent_url: enrollment.consent_url,
  next_step: "Open the Receiver-owned consent URL and make the explicitly authorized human decision.",
}, null, 2)}\n`);

function requireManifestEnvelope(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Manifest file must contain one JSON object");
  }
  for (const field of ["manifest_id", "correlation_id", "workflow_id", "signature"]) {
    if (typeof value[field] !== "string" || value[field].length === 0) {
      throw new TypeError(`Manifest field ${field} is required`);
    }
  }
}

async function request(requestPath, { method = "GET", body, headers = {} } = {}) {
  const response = await fetch(`${DEFAULT_ORIGIN}${requestPath}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error ?? `Request failed with ${response.status}`);
  return value;
}
