import { createHmac, timingSafeEqual } from "node:crypto";
import {
  AUTHORIZED_EVENT,
  HUMAN_BOUNDARY,
  MANIFEST_KEY_ID,
  MANIFEST_SECRET,
  MANIFEST_TTL_MS,
  WORKFLOW_ID,
} from "./config.mjs";
import { createId } from "./ids.mjs";

export function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function signObject(value, secret) {
  return createHmac("sha256", secret).update(canonicalJson(value)).digest("base64url");
}

export function signaturesMatch(actual, expected) {
  const actualBuffer = Buffer.from(actual ?? "", "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function createReentryManifest({
  origin,
  correlationId,
  now = new Date(),
  manifestSecret = MANIFEST_SECRET,
  manifestId = createId("rm"),
} = {}) {
  if (!origin) throw new Error("origin is required");
  if (!correlationId) throw new Error("correlationId is required");
  const unsigned = {
    manifest_id: manifestId,
    correlation_id: correlationId,
    issuer_origin: origin,
    workflow_id: WORKFLOW_ID,
    canonical_url: `${origin}/workflows/${WORKFLOW_ID}`,
    allowed_event_type: AUTHORIZED_EVENT,
    expires_at: new Date(now.getTime() + MANIFEST_TTL_MS).toISOString(),
    max_runs: 1,
    human_boundary: HUMAN_BOUNDARY,
    continuation_intent: {
      mode: "OPEN_CANONICAL_PAGE",
      first_action: "READ_CURRENT_STATE",
      required_tool_role: "CONTINUE_ARTIFACT",
      stop_before: HUMAN_BOUNDARY,
    },
    key_id: MANIFEST_KEY_ID,
  };
  return { ...unsigned, signature: signObject(unsigned, manifestSecret) };
}

export function verifyReentryManifest(manifest, {
  expectedOrigin,
  now = new Date(),
  manifestSecret = MANIFEST_SECRET,
} = {}) {
  if (!manifest || typeof manifest !== "object") throw new Error("Manifest must be an object");
  const { signature, ...unsigned } = manifest;
  const expectedSignature = signObject(unsigned, manifestSecret);
  if (!signaturesMatch(signature, expectedSignature)) throw new Error("Manifest signature is invalid");
  if (manifest.key_id !== MANIFEST_KEY_ID) throw new Error("Manifest key is not pinned");
  if (typeof manifest.correlation_id !== "string" || !manifest.correlation_id.startsWith("corr_")) {
    throw new Error("Manifest correlation is invalid");
  }
  if (manifest.issuer_origin !== expectedOrigin) throw new Error("Manifest origin is not pinned");
  if (manifest.workflow_id !== WORKFLOW_ID) throw new Error("Manifest workflow is outside scope");
  if (manifest.canonical_url !== `${expectedOrigin}/workflows/${WORKFLOW_ID}`) {
    throw new Error("Manifest canonical URL is invalid");
  }
  if (manifest.allowed_event_type !== AUTHORIZED_EVENT) throw new Error("Manifest event is outside scope");
  if (manifest.max_runs !== 1) throw new Error("Manifest run limit is invalid");
  if (manifest.human_boundary !== HUMAN_BOUNDARY) throw new Error("Manifest human boundary is invalid");
  if (typeof manifest.expires_at !== "string") throw new Error("Manifest expiry is invalid");
  const expiresAt = Date.parse(manifest.expires_at);
  if (
    !Number.isFinite(expiresAt) ||
    new Date(expiresAt).toISOString() !== manifest.expires_at
  ) {
    throw new Error("Manifest expiry is invalid");
  }
  if (expiresAt <= now.getTime()) throw new Error("Manifest is expired");
  if (expiresAt > now.getTime() + MANIFEST_TTL_MS) {
    throw new Error("Manifest expiry exceeds the allowed horizon");
  }
  const intent = manifest.continuation_intent;
  if (
    intent?.mode !== "OPEN_CANONICAL_PAGE" ||
    intent?.first_action !== "READ_CURRENT_STATE" ||
    intent?.required_tool_role !== "CONTINUE_ARTIFACT" ||
    intent?.stop_before !== HUMAN_BOUNDARY
  ) {
    throw new Error("Manifest continuation intent is invalid");
  }
  return manifest;
}
