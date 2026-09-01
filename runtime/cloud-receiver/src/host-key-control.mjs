import { createHash, createPublicKey, timingSafeEqual } from "node:crypto";
import { TextDecoder } from "node:util";

import { PROTOCOL_VERSION } from "../../../reentry-core/src/protocol.mjs";

export const CLOUD_RECEIVER_HOST_KEY_ROUTES = Object.freeze({
  register: "/v0.1/host-keys",
});

const OPTION_FIELDS = Object.freeze([
  "store",
  "organizationId",
  "hostApiKey",
  "authenticateOrganization",
  "clock",
]);
const REQUIRED_OPTION_FIELDS = Object.freeze(["store", "clock"]);
const REGISTRATION_FIELDS = Object.freeze([
  "host_id",
  "issuer_origin",
  "key_id",
  "public_key_pem",
]);
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const MAX_BODY_BYTES = 8 * 1_024;
const MAX_PUBLIC_KEY_BYTES = 4 * 1_024;
const CONTROL_CONTENT_TYPE = /^application\/json(?:\s*;\s*charset=utf-8)?$/i;

export class HostKeyControlError extends Error {
  constructor(code, statusCode, message) {
    super(message);
    this.name = "HostKeyControlError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function createHostKeyControlPlane(options) {
  requireExactRecord(options, OPTION_FIELDS, REQUIRED_OPTION_FIELDS, "Host key control options");
  requireStore(options.store);
  const authenticateOrganization = options.authenticateOrganization;
  if (authenticateOrganization !== undefined && typeof authenticateOrganization !== "function") {
    throw new TypeError("Host key organization authenticator must be a function");
  }
  if (authenticateOrganization !== undefined && (
    options.organizationId !== undefined || options.hostApiKey !== undefined
  )) {
    throw new TypeError("Host key control must use either fixed or dynamic organization authentication");
  }
  const organizationId = authenticateOrganization === undefined
    ? requireIdentifier(options.organizationId, "organizationId")
    : undefined;
  const hostApiKeyDigest = authenticateOrganization === undefined
    ? digest(options.hostApiKey, "Host API key")
    : undefined;
  if (authenticateOrganization !== undefined && typeof options.store.getHostKeysByIssuer !== "function") {
    throw new TypeError("Host key control store is missing getHostKeysByIssuer");
  }
  const clock = requireClock(options.clock);

  return Object.freeze({
    handler,
    registerHostKey,
    resolveKey,
    readiness: () => options.store.ready(),
  });

  function registerHostKey(input, authenticatedOrganizationId = organizationId) {
    requireExactRecord(input, REGISTRATION_FIELDS, REGISTRATION_FIELDS, "Host key registration input");
    const activeOrganizationId = requireIdentifier(
      authenticatedOrganizationId,
      "organizationId",
    );
    const hostId = requireIdentifier(input.host_id, "host_id");
    const issuerOrigin = requireOrigin(input.issuer_origin, "issuer_origin");
    const keyId = requireIdentifier(input.key_id, "key_id");
    const publicKeyPem = normalizePublicKey(input.public_key_pem);
    const result = options.store.registerHostKey({
      organization_id: activeOrganizationId,
      host_id: hostId,
      issuer_origin: issuerOrigin,
      key_id: keyId,
      public_key_pem: publicKeyPem,
      created_at: readClock(clock).toISOString(),
    });
    return {
      type: "webmcp.host_key_registration",
      protocol_version: PROTOCOL_VERSION,
      organization_id: activeOrganizationId,
      host_id: result.record.host_id,
      issuer_origin: result.record.issuer_origin,
      key_id: result.record.key_id,
      status: "active",
      duplicate: result.duplicate,
    };
  }

  function resolveKey(input) {
    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input) ||
      !["manifest", "event"].includes(input.purpose) ||
      typeof input.issuerOrigin !== "string" ||
      typeof input.keyId !== "string"
    ) {
      return undefined;
    }
    const record = authenticateOrganization === undefined
      ? options.store.getHostKeyByIssuer(
        organizationId,
        input.issuerOrigin,
        input.keyId,
      )
      : resolveUniqueHostKey(input.issuerOrigin, input.keyId);
    if (!record) return undefined;
    try {
      return createPublicKey(record.public_key_pem);
    } catch {
      return undefined;
    }
  }

  async function handler(request, response) {
    if (request.url !== CLOUD_RECEIVER_HOST_KEY_ROUTES.register) return false;
    try {
      if (request.method !== "POST") {
        writeJson(response, 405, { error: { code: "http_method_not_allowed" } }, { Allow: "POST" });
        return true;
      }
      requireJsonContentType(request);
      const activeOrganizationId = authenticateOrganization === undefined
        ? (requireBearer(request, hostApiKeyDigest), organizationId)
        : authenticateDynamicOrganization(request);
      const body = await readJsonBody(request);
      const result = registerHostKey(body, activeOrganizationId);
      writeJson(response, result.duplicate ? 200 : 201, result);
      return true;
    } catch (error) {
      writeJson(
        response,
        hostKeyStatus(error),
        { error: { code: hostKeyCode(error) } },
      );
      return true;
    }
  }

  function resolveUniqueHostKey(issuerOrigin, keyId) {
    const matches = options.store.getHostKeysByIssuer(issuerOrigin, keyId);
    return matches.length === 1 ? matches[0] : undefined;
  }

  function authenticateDynamicOrganization(request) {
    const value = readBearer(request);
    let identity;
    try {
      identity = authenticateOrganization(value);
    } catch {
      identity = null;
    }
    if (!identity || typeof identity !== "object" || Array.isArray(identity)) {
      throw new HostKeyControlError(
        "organization_auth_invalid",
        403,
        "Organization authentication is invalid",
      );
    }
    return requireIdentifier(identity.organization_id, "organizationId");
  }
}

function normalizePublicKey(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    Buffer.byteLength(value, "utf8") > MAX_PUBLIC_KEY_BYTES
  ) {
    throw new HostKeyControlError("host_public_key_invalid", 422, "Host public key is invalid");
  }
  let key;
  try {
    key = createPublicKey(value);
  } catch {
    throw new HostKeyControlError("host_public_key_invalid", 422, "Host public key is invalid");
  }
  if (key.asymmetricKeyType !== "ed25519") {
    throw new HostKeyControlError("host_public_key_invalid", 422, "Host public key is invalid");
  }
  return key.export({ type: "spki", format: "pem" }).toString();
}

function requireOrigin(value, label) {
  if (typeof value !== "string" || Buffer.byteLength(value, "utf8") > 2_048) {
    throw new HostKeyControlError("host_origin_invalid", 422, `${label} is invalid`);
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new HostKeyControlError("host_origin_invalid", 422, `${label} is invalid`);
  }
  if (!(["http:", "https:"].includes(parsed.protocol)) || parsed.origin !== value || parsed.username || parsed.password) {
    throw new HostKeyControlError("host_origin_invalid", 422, `${label} is invalid`);
  }
  return value;
}

function requireBearer(request, expectedDigest) {
  const received = Buffer.from(digest(readBearer(request), "Organization API key"), "base64url");
  const expected = Buffer.from(expectedDigest, "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new HostKeyControlError("organization_auth_invalid", 403, "Organization authentication is invalid");
  }
}

function readBearer(request) {
  const value = request.headers?.authorization;
  if (typeof value !== "string" || !/^Bearer [\x21-\x7e]+$/.test(value)) {
    throw new HostKeyControlError("organization_auth_invalid", 403, "Organization authentication is invalid");
  }
  return value.slice(7);
}

function requireJsonContentType(request) {
  const value = request.headers?.["content-type"];
  if (typeof value !== "string" || !CONTROL_CONTENT_TYPE.test(value) || request.headers?.["content-encoding"] !== undefined) {
    throw new HostKeyControlError("http_content_type_invalid", 415, "Request content type is invalid");
  }
}

async function readJsonBody(request) {
  const declared = request.headers?.["content-length"];
  if (
    declared !== undefined &&
    (!/^(?:0|[1-9][0-9]*)$/.test(declared) || Number(declared) > MAX_BODY_BYTES)
  ) {
    throw new HostKeyControlError(
      Number(declared) > MAX_BODY_BYTES ? "http_body_too_large" : "http_body_invalid",
      Number(declared) > MAX_BODY_BYTES ? 413 : 400,
      "Request body is invalid",
    );
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_BODY_BYTES) {
      throw new HostKeyControlError("http_body_too_large", 413, "Request body is too large");
    }
    chunks.push(bytes);
  }
  if (size === 0) throw new HostKeyControlError("http_body_invalid", 400, "Request body is invalid");
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
  } catch {
    throw new HostKeyControlError("http_body_invalid", 400, "Request body is invalid");
  }
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new HostKeyControlError("http_body_invalid", 400, "Request body is invalid");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HostKeyControlError("http_body_invalid", 400, "Request body is invalid");
  }
  return value;
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

function digest(value, label) {
  const normalized = requireSecret(value, label);
  return createHash("sha256").update(normalized, "utf8").digest("base64url");
}

function requireSecret(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    Buffer.byteLength(value, "utf8") > MAX_PUBLIC_KEY_BYTES ||
    /[^\x21-\x7e]/.test(value)
  ) {
    throw new TypeError(`${label} is invalid`);
  }
  return value;
}

function requireIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) {
    throw new HostKeyControlError("host_identifier_invalid", 422, `${label} is invalid`);
  }
  return value;
}

function requireClock(value) {
  if (typeof value !== "function") throw new TypeError("Host key control clock must be a function");
  return value;
}

function readClock(clock) {
  const value = clock();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new TypeError("Host key control clock must return a valid Date");
  }
  return new Date(value.getTime());
}

function requireStore(store) {
  for (const method of [
    "ready",
    "getHostKeyByIssuer",
    "registerHostKey",
  ]) {
    if (!store || typeof store[method] !== "function") {
      throw new TypeError(`Host key control store is missing ${method}`);
    }
  }
}

function requireExactRecord(value, allowedFields, requiredFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HostKeyControlError("host_input_invalid", 400, `${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new HostKeyControlError("host_input_invalid", 400, `${label} must be a plain object`);
  }
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key === "symbol" || !descriptor?.enumerable || !("value" in descriptor)) {
      throw new HostKeyControlError("host_input_invalid", 400, `${label} contains an invalid property`);
    }
  }
  const fields = Object.keys(value);
  if (fields.some((field) => !allowedFields.includes(field))) {
    throw new HostKeyControlError("host_input_fields_invalid", 400, `${label} fields are invalid`);
  }
  if (requiredFields.some((field) => !fields.includes(field))) {
    throw new HostKeyControlError("host_input_fields_invalid", 400, `${label} fields are invalid`);
  }
}

function hostKeyStatus(error) {
  if (error instanceof HostKeyControlError) return error.statusCode;
  if (error?.code === "host_key_identity_conflict") return 409;
  return 500;
}

function hostKeyCode(error) {
  if (error instanceof HostKeyControlError) return error.code;
  if (error?.code === "host_key_identity_conflict") return error.code;
  return "host_key_internal_error";
}
