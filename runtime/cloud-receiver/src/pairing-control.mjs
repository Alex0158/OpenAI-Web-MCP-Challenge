import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { TextDecoder } from "node:util";

import {
  CONNECTOR_IDENTITY_TYPE,
} from "../../../reentry-core/src/receiver-core.mjs";
import { PROTOCOL_VERSION } from "../../../reentry-core/src/protocol.mjs";

export const CLOUD_RECEIVER_PAIRING_ROUTES = Object.freeze({
  start: "/v0.1/pairing-sessions",
  claim: "/v0.1/pairing-sessions/claim",
  poll: "/v0.1/pairing-sessions/poll",
  approve: "/v0.1/pairing-sessions/approve",
  page: "/pairing",
});

export const PAIRING_POLL_INTERVAL_SECONDS = 2;

const OPTION_FIELDS = Object.freeze([
  "store",
  "organizationId",
  "hostApiKey",
  "connectorTokenSecret",
  "pairingLifetimeMs",
  "connectorLifetimeMs",
  "clock",
  "createId",
  "verificationOrigin",
]);
const REQUIRED_OPTION_FIELDS = Object.freeze([
  "store",
  "organizationId",
  "hostApiKey",
  "connectorTokenSecret",
  "pairingLifetimeMs",
  "connectorLifetimeMs",
  "clock",
  "createId",
]);
const START_FIELDS = Object.freeze(["host_subject_ref"]);
const CODE_FIELDS = Object.freeze(["user_code"]);
const POLL_FIELDS = Object.freeze(["device_code"]);
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const CODE_PATTERN = /^[A-F0-9]{16}$/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const MAX_BODY_BYTES = 8 * 1_024;
const MAX_TOKEN_BYTES = 4 * 1_024;
const MIN_PAIRING_LIFETIME_MS = 60_000;
const MAX_PAIRING_LIFETIME_MS = 15 * 60_000;
const MIN_CONNECTOR_LIFETIME_MS = 60 * 60_000;
const MAX_CONNECTOR_LIFETIME_MS = 90 * 24 * 60 * 60_000;
const CONTROL_CONTENT_TYPE = /^application\/json(?:\s*;\s*charset=utf-8)?$/i;

export class PairingControlError extends Error {
  constructor(code, statusCode, message) {
    super(message);
    this.name = "PairingControlError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function createPairingControlPlane(options) {
  requireExactRecord(options, OPTION_FIELDS, REQUIRED_OPTION_FIELDS, "Pairing control options");
  requireStore(options.store);
  const organizationId = requireIdentifier(options.organizationId, "organizationId");
  const hostApiKeyDigest = digest(options.hostApiKey, "Host API key");
  const connectorTokenSecret = requireSecret(options.connectorTokenSecret, "Connector token secret");
  const pairingLifetimeMs = requireBoundedInteger(
    options.pairingLifetimeMs,
    MIN_PAIRING_LIFETIME_MS,
    MAX_PAIRING_LIFETIME_MS,
    "pairingLifetimeMs",
  );
  const connectorLifetimeMs = requireBoundedInteger(
    options.connectorLifetimeMs,
    MIN_CONNECTOR_LIFETIME_MS,
    MAX_CONNECTOR_LIFETIME_MS,
    "connectorLifetimeMs",
  );
  const clock = requireClock(options.clock);
  const createId = requireCreateId(options.createId);
  const verificationOrigin = options.verificationOrigin === undefined
    ? undefined
    : requireOrigin(options.verificationOrigin);

  return Object.freeze({
    handler,
    verifyConnector,
    resolveHostSubject,
    startPairing,
    close: () => options.store.close(),
    readiness: () => options.store.ready(),
  });

  function startPairing(input, request) {
    requireExactRecord(input, START_FIELDS, START_FIELDS, "Pairing start input");
    const hostSubjectRef = requireIdentifier(input.host_subject_ref, "host_subject_ref");
    const hostSubjectRefDigest = digest(hostSubjectRef, "Host subject reference");
    const existing = options.store.getHostSubjectLink(
      organizationId,
      hostSubjectRefDigest,
    );
    if (existing) {
      throw new PairingControlError(
        "host_subject_already_paired",
        409,
        "Host subject is already paired",
      );
    }

    const now = readClock(clock);
    const pending = options.store.getPairingByHostSubjectDigest(
      organizationId,
      hostSubjectRefDigest,
    );
    if (
      pending?.status === "pending" &&
      Date.parse(pending.expires_at) > now.getTime()
    ) {
      throw new PairingControlError(
        "host_subject_pairing_pending",
        409,
        "Host subject already has a pending pairing",
      );
    }
    const pairingId = requireIdentifier(createId("pairing"), "pairing_id");
    const userCode = formatUserCode(randomBytes(8).toString("hex").toUpperCase());
    const deviceCode = deriveCode(connectorTokenSecret, "device", pairingId);
    const connectorToken = deriveCode(connectorTokenSecret, "connector", pairingId);
    const subjectId = requireIdentifier(createId("subject"), "subject_id");
    const deliveryTargetId = requireIdentifier(createId("target"), "delivery_target_id");
    const connectorId = requireIdentifier(createId("connector"), "connector_id");
    const expiresAt = new Date(now.getTime() + pairingLifetimeMs).toISOString();
    const connectorExpiresAt = new Date(now.getTime() + connectorLifetimeMs).toISOString();
    options.store.createPairingSession({
      pairing_id: pairingId,
      organization_id: organizationId,
      host_subject_ref_digest: hostSubjectRefDigest,
      subject_id: subjectId,
      delivery_target_id: deliveryTargetId,
      connector_id: connectorId,
      device_code_digest: digest(deviceCode, "Device code"),
      user_code_digest: digest(normalizeUserCode(userCode), "User code"),
      connector_token_digest: digest(connectorToken, "Connector token"),
      status: "pending",
      created_at: now.toISOString(),
      expires_at: expiresAt,
      claimed_at: null,
      approved_at: null,
      consumed_at: null,
    });

    return {
      type: "webmcp.connector_pairing",
      protocol_version: PROTOCOL_VERSION,
      pairing_id: pairingId,
      user_code: userCode,
      verification_uri: `${resolveVerificationOrigin(request)}${CLOUD_RECEIVER_PAIRING_ROUTES.page}?code=${encodeURIComponent(userCode)}`,
      expires_at: expiresAt,
      poll_interval_seconds: PAIRING_POLL_INTERVAL_SECONDS,
      connector_expires_at: connectorExpiresAt,
    };
  }

  function verifyConnector({ connectorToken }) {
    const normalized = requireSecret(connectorToken, "Connector token");
    const now = readClock(clock);
    const connector = options.store.getConnectorByTokenDigest(digest(normalized, "Connector token"));
    if (
      !connector ||
      connector.organization_id !== organizationId ||
      connector.revoked_at !== null ||
      Date.parse(connector.expires_at) <= now.getTime()
    ) {
      throw new Error("Connector token is invalid");
    }
    return {
      type: CONNECTOR_IDENTITY_TYPE,
      protocol_version: PROTOCOL_VERSION,
      connector_id: connector.connector_id,
      subject_id: connector.subject_id,
      delivery_target_id: connector.delivery_target_id,
      authenticated_at: now.toISOString(),
      expires_at: connector.expires_at,
    };
  }

  function resolveHostSubject(input) {
    requireExactRecord(input, ["host_subject_ref"], ["host_subject_ref"], "Host subject lookup");
    const hostSubjectRef = requireIdentifier(input.host_subject_ref, "host_subject_ref");
    const link = options.store.getHostSubjectLink(
      organizationId,
      digest(hostSubjectRef, "Host subject reference"),
    );
    if (!link) return null;
    return {
      organization_id: organizationId,
      subject_id: link.subject_id,
      delivery_target_id: link.delivery_target_id,
      connector_id: link.connector_id,
    };
  }

  async function handler(request, response) {
    const route = parseRoute(request.url);
    if (!route) return false;
    try {
      if (route === "page") {
        handlePage(request, response);
        return true;
      }
      if (request.method !== "POST") {
        writeJson(response, 405, { error: { code: "http_method_not_allowed" } }, { Allow: "POST" });
        return true;
      }
      requireJsonContentType(request);
      const body = await readJsonBody(request);
      if (route === "start") {
        requireBearer(request, hostApiKeyDigest);
        const result = startPairing(body, request);
        writeJson(response, 201, result);
        return true;
      }
      if (route === "claim") {
        const result = claimPairing(body, request);
        writeJson(response, 200, result);
        return true;
      }
      if (route === "approve") {
        const result = approvePairing(body);
        writeJson(response, 200, result);
        return true;
      }
      const result = pollPairing(body);
      if (result.status === "pending") {
        writeJson(response, 202, result);
      } else {
        writeJson(response, 200, result);
      }
      return true;
    } catch (error) {
      if (response.headersSent || response.destroyed) return true;
      writeJson(
        response,
        error instanceof PairingControlError ? error.statusCode : 500,
        { error: { code: error instanceof PairingControlError ? error.code : "pairing_internal_error" } },
      );
      return true;
    }
  }

  function claimPairing(body, request) {
    requireExactRecord(body, CODE_FIELDS, CODE_FIELDS, "Pairing claim input");
    const userCode = normalizeUserCode(body.user_code);
    const pairing = options.store.getPairingByUserCodeDigest(digest(userCode, "User code"));
    const live = requireLivePairing(pairing);
    options.store.claimPairing(live.pairing_id, readClock(clock).toISOString());
    return {
      type: "webmcp.connector_pairing_claim",
      protocol_version: PROTOCOL_VERSION,
      pairing_id: live.pairing_id,
      device_code: deriveCode(connectorTokenSecret, "device", live.pairing_id),
      verification_uri: `${resolveVerificationOrigin(request)}${CLOUD_RECEIVER_PAIRING_ROUTES.page}?code=${encodeURIComponent(formatUserCode(userCode))}`,
      expires_at: live.expires_at,
      poll_interval_seconds: PAIRING_POLL_INTERVAL_SECONDS,
    };
  }

  function approvePairing(body) {
    requireExactRecord(body, CODE_FIELDS, CODE_FIELDS, "Pairing approval input");
    const userCode = normalizeUserCode(body.user_code);
    const initial = options.store.getPairingByUserCodeDigest(digest(userCode, "User code"));
    const live = requireLivePairing(initial);
    const now = readClock(clock);
    const connectorToken = deriveCode(connectorTokenSecret, "connector", live.pairing_id);
    const connectorExpiresAt = new Date(now.getTime() + connectorLifetimeMs).toISOString();
    const result = options.store.approvePairing(
      live.pairing_id,
      now.toISOString(),
      live,
      {
        connector_id: live.connector_id,
        organization_id: organizationId,
        subject_id: live.subject_id,
        delivery_target_id: live.delivery_target_id,
        connector_token_digest: digest(connectorToken, "Connector token"),
        expires_at: connectorExpiresAt,
        revoked_at: null,
      },
    );
    if (result.status === "expired") throw pairingError("pairing_expired", 410);
    if (result.status === "missing") throw pairingError("pairing_not_found", 404);
    return {
      type: "webmcp.connector_pairing_approval",
      protocol_version: PROTOCOL_VERSION,
      pairing_id: live.pairing_id,
      status: "approved",
      duplicate: result.duplicate,
    };
  }

  function pollPairing(body) {
    requireExactRecord(body, POLL_FIELDS, POLL_FIELDS, "Pairing poll input");
    const deviceCode = requireDeviceCode(body.device_code);
    const initial = options.store.getPairingByDeviceCodeDigest(digest(deviceCode, "Device code"));
    const live = requireLivePairing(initial);
    const now = readClock(clock);
    if (live.status === "pending") {
      return {
        type: "webmcp.connector_pairing_status",
        protocol_version: PROTOCOL_VERSION,
        pairing_id: live.pairing_id,
        status: "pending",
        expires_at: live.expires_at,
        poll_interval_seconds: PAIRING_POLL_INTERVAL_SECONDS,
      };
    }
    const consumed = options.store.consumePairing(live.pairing_id, now.toISOString());
    if (consumed.status === "expired") throw pairingError("pairing_expired", 410);
    const connector = options.store.getConnectorByTokenDigest(live.connector_token_digest);
    if (!connector) throw pairingError("pairing_credentials_unavailable", 500);
    return {
      type: "webmcp.connector_credentials",
      protocol_version: PROTOCOL_VERSION,
      pairing_id: live.pairing_id,
      connector_id: connector.connector_id,
      connector_token: deriveCode(connectorTokenSecret, "connector", live.pairing_id),
      connector_expires_at: connector.expires_at,
      duplicate: consumed.duplicate,
    };
  }

  function handlePage(request, response) {
    if (request.method !== "GET") {
      writeJson(response, 405, { error: { code: "http_method_not_allowed" } }, { Allow: "GET" });
      return;
    }
    const code = getPageCode(request.url);
    const pairing = options.store.getPairingByUserCodeDigest(digest(code, "User code"));
    requireLivePairing(pairing);
    const escapedCode = escapeHtml(formatUserCode(code));
    const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Connect Local Connector</title><style>body{font:16px system-ui,sans-serif;max-width:42rem;margin:4rem auto;padding:0 1rem}button{font:inherit;padding:.7rem 1rem}#status{margin-top:1rem}</style></head><body><h1>Connect this computer</h1><p>This local preview will pair one Connector with the Host user that created this code.</p><p>Code: <strong>${escapedCode}</strong></p><button id="approve">Approve Connector</button><p id="status" role="status"></p><script>const code=${JSON.stringify(formatUserCode(code))};document.querySelector("#approve").addEventListener("click",async()=>{const status=document.querySelector("#status");status.textContent="Approving…";const response=await fetch("${CLOUD_RECEIVER_PAIRING_ROUTES.approve}",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({user_code:code})});const body=await response.json().catch(()=>({}));if(response.ok){status.textContent="Approved. Return to the Connector.";document.querySelector("#approve").disabled=true}else{status.textContent=body.error?.code||"Approval failed"}});</script></body></html>`;
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Length": Buffer.byteLength(page),
      "Content-Security-Policy": "default-src 'none'; connect-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'",
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(page);
  }

  function requireLivePairing(pairing) {
    if (!pairing) throw pairingError("pairing_not_found", 404);
    if (Date.parse(pairing.expires_at) <= readClock(clock).getTime()) {
      throw pairingError("pairing_expired", 410);
    }
    if (pairing.status === "expired") throw pairingError("pairing_expired", 410);
    return pairing;
  }

  function resolveVerificationOrigin(request) {
    if (verificationOrigin) return verificationOrigin;
    const host = request?.headers?.host;
    if (typeof host !== "string" || !/^(?:127\.0\.0\.1|localhost|\[::1\])(?::(?:0|[1-9][0-9]{0,4}))?$/.test(host)) {
      throw pairingError("pairing_origin_invalid", 400);
    }
    return `http://${host}`;
  }
}

function parseRoute(value) {
  if (typeof value !== "string" || value.length > 512) return null;
  if (value === CLOUD_RECEIVER_PAIRING_ROUTES.start) return "start";
  if (value === CLOUD_RECEIVER_PAIRING_ROUTES.claim) return "claim";
  if (value === CLOUD_RECEIVER_PAIRING_ROUTES.poll) return "poll";
  if (value === CLOUD_RECEIVER_PAIRING_ROUTES.approve) return "approve";
  if (value.split("?", 1)[0] === CLOUD_RECEIVER_PAIRING_ROUTES.page) return "page";
  return null;
}

function getPageCode(value) {
  let parsed;
  try {
    parsed = new URL(value, "http://pairing.local");
  } catch {
    throw pairingError("pairing_code_invalid", 400);
  }
  if (
    parsed.pathname !== CLOUD_RECEIVER_PAIRING_ROUTES.page ||
    parsed.hash ||
    parsed.searchParams.getAll("code").length !== 1 ||
    [...parsed.searchParams.keys()].some((key) => key !== "code")
  ) {
    throw pairingError("pairing_code_invalid", 400);
  }
  return normalizeUserCode(parsed.searchParams.get("code"));
}

function normalizeUserCode(value) {
  if (typeof value !== "string") throw pairingError("pairing_code_invalid", 400);
  const normalized = value.replaceAll("-", "").toUpperCase();
  if (!CODE_PATTERN.test(normalized)) throw pairingError("pairing_code_invalid", 400);
  return normalized;
}

function formatUserCode(value) {
  const normalized = normalizeUserCode(value);
  return `${normalized.slice(0, 4)}-${normalized.slice(4, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12)}`;
}

function requireDeviceCode(value) {
  if (typeof value !== "string" || !TOKEN_PATTERN.test(value)) {
    throw pairingError("device_code_invalid", 400);
  }
  return value;
}

function deriveCode(secret, purpose, pairingId) {
  return createHmac("sha256", secret).update(`${purpose}:${pairingId}`, "utf8").digest("base64url");
}

function requireBearer(request, expectedDigest) {
  const value = request.headers?.authorization;
  if (typeof value !== "string" || !/^Bearer [\x21-\x7e]+$/.test(value)) {
    throw pairingError("organization_auth_invalid", 403);
  }
  const received = Buffer.from(digest(value.slice(7), "Organization API key"), "base64url");
  const expected = Buffer.from(expectedDigest, "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw pairingError("organization_auth_invalid", 403);
  }
}

function requireJsonContentType(request) {
  const value = request.headers?.["content-type"];
  if (typeof value !== "string" || !CONTROL_CONTENT_TYPE.test(value)) {
    throw pairingError("http_content_type_invalid", 415);
  }
  if (request.headers?.["content-encoding"] !== undefined) {
    throw pairingError("http_content_type_invalid", 415);
  }
}

async function readJsonBody(request) {
  const declared = request.headers?.["content-length"];
  if (declared !== undefined && (!/^(?:0|[1-9][0-9]*)$/.test(declared) || Number(declared) > MAX_BODY_BYTES)) {
    throw pairingError("http_body_invalid", Number(declared) > MAX_BODY_BYTES ? 413 : 400);
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_BODY_BYTES) throw pairingError("http_body_too_large", 413);
    chunks.push(bytes);
  }
  if (size === 0) throw pairingError("http_body_invalid", 400);
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
  } catch {
    throw pairingError("http_body_invalid", 400);
  }
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw pairingError("http_body_invalid", 400);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw pairingError("http_body_invalid", 400);
  }
  return value;
}

function digest(value, label) {
  const secret = requireSecret(value, label);
  return createHash("sha256").update(secret, "utf8").digest("base64url");
}

function requireSecret(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    Buffer.byteLength(value, "utf8") > MAX_TOKEN_BYTES ||
    /[^\x21-\x7e]/.test(value)
  ) {
    throw new TypeError(`${label} is invalid`);
  }
  return value;
}

function requireIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) {
    throw new TypeError(`${label} is invalid`);
  }
  return value;
}

function requireBoundedInteger(value, minimum, maximum, label) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new TypeError(`${label} is outside its supported range`);
  }
  return value;
}

function requireClock(value) {
  if (typeof value !== "function") throw new TypeError("Pairing clock must be a function");
  return value;
}

function readClock(clock) {
  const value = clock();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new TypeError("Pairing clock must return a valid Date");
  }
  return new Date(value.getTime());
}

function requireCreateId(value) {
  if (typeof value !== "function") throw new TypeError("Pairing createId must be a function");
  return value;
}

function requireOrigin(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new TypeError("Pairing verification origin is invalid");
  }
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    parsed.origin !== value
  ) {
    throw new TypeError("Pairing verification origin is invalid");
  }
  return value;
}

function requireStore(value) {
  for (const method of [
    "createPairingSession",
    "getPairingByUserCodeDigest",
    "getPairingByDeviceCodeDigest",
    "getHostSubjectLink",
    "getConnectorByTokenDigest",
    "claimPairing",
    "insertConnector",
    "insertHostSubjectLink",
    "setPairingApproved",
    "approvePairing",
    "consumePairing",
    "close",
    "ready",
  ]) {
    if (typeof value?.[method] !== "function") throw new TypeError(`Pairing store is missing ${method}`);
  }
}

function requireExactRecord(value, allowedFields, requiredFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${label} must be a plain object`);
  }
  const fields = Object.keys(value);
  if (fields.some((field) => !allowedFields.includes(field))) {
    throw new TypeError(`${label} contains an unsupported field`);
  }
  if (requiredFields.some((field) => !fields.includes(field))) {
    throw new TypeError(`${label} is missing a required field`);
  }
}

function pairingError(code, statusCode) {
  return new PairingControlError(code, statusCode, code);
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function writeJson(response, statusCode, body, headers = undefined) {
  const payload = JSON.stringify(body);
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(payload),
    "Content-Type": "application/json; charset=utf-8",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });
  response.end(payload);
}
