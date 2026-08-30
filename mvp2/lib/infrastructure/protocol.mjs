import { createHmac, timingSafeEqual } from "node:crypto";

export const PROTOCOL_VERSION = "0.1";
export const MANIFEST_TYPE = "webmcp.reentry_manifest";
export const EVENT_TYPE = "workflow.continuation_event";
export const SIGNATURE_ALGORITHM = "HMAC-SHA256";

const EVENT_FIELDS = [
  "eventId",
  "eventType",
  "grantId",
  "idempotencyKey",
  "manifestId",
  "nonce",
  "occurredAt",
  "origin",
  "resumeUrl",
  "signature",
  "stateVersion",
  "type",
  "version",
  "workflowId",
];

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
  const primitive = JSON.stringify(value);
  if (primitive === undefined) {
    throw new ProtocolValidationError("Protocol values cannot contain undefined");
  }
  return primitive;
}

export function signProtocolObject(value, { secret, keyId }) {
  requireText(secret, "signing secret");
  requireText(keyId, "signature key id");
  const { signature: _ignored, ...unsigned } = value;
  const signature = createHmac("sha256", secret)
    .update(canonicalJson(unsigned))
    .digest("base64url");
  return {
    ...unsigned,
    signature: {
      algorithm: SIGNATURE_ALGORITHM,
      keyId,
      value: signature,
    },
  };
}

export function verifyProtocolObject(value, { keyResolver, purpose }) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const signature = value.signature;
  if (
    signature?.algorithm !== SIGNATURE_ALGORITHM ||
    typeof signature.keyId !== "string" ||
    typeof signature.value !== "string"
  ) {
    return false;
  }
  if (typeof keyResolver !== "function") {
    throw new TypeError("keyResolver is required for protocol verification");
  }
  const secret = keyResolver({
    keyId: signature.keyId,
    issuerOrigin: value.origin,
    purpose,
  });
  if (typeof secret !== "string" || secret === "") return false;
  const expected = signProtocolObject(value, {
    secret,
    keyId: signature.keyId,
  }).signature.value;
  return signaturesMatch(signature.value, expected);
}

export function createReentryManifest({
  manifestId,
  origin,
  workflow,
  reentryPoints,
  issuedAt = new Date().toISOString(),
  signing,
}) {
  const unsigned = {
    type: MANIFEST_TYPE,
    version: PROTOCOL_VERSION,
    manifestId,
    issuedAt,
    origin,
    workflow: structuredClone(workflow),
    reentryPoints: structuredClone(reentryPoints),
  };
  validateManifestShape(unsigned, { requireSignature: false });
  return signProtocolObject(unsigned, signing);
}

export function validateReentryManifest(
  manifest,
  { keyResolver, expectedOrigin, now = new Date() },
) {
  validateManifestShape(manifest, { requireSignature: true });
  if (expectedOrigin && manifest.origin !== expectedOrigin) {
    throw new ProtocolValidationError("Manifest origin does not match the expected Host");
  }
  if (!verifyProtocolObject(manifest, { keyResolver, purpose: "manifest" })) {
    throw new ProtocolAuthenticationError("Invalid re-entry manifest signature");
  }
  const issuedAt = Date.parse(manifest.issuedAt);
  if (issuedAt > now.getTime() + 60 * 1000) {
    throw new ProtocolValidationError("Re-entry manifest issuedAt is in the future");
  }
  for (const point of manifest.reentryPoints) {
    const expiresAt = Date.parse(point.defaultLimits.expiresAt);
    if (expiresAt <= issuedAt) {
      throw new ProtocolValidationError(
        "Re-entry manifest expiry must follow its issue time",
      );
    }
    if (expiresAt <= now.getTime()) {
      throw new ProtocolValidationError("Re-entry manifest has expired");
    }
  }
  return manifest;
}

export function createContinuationEvent({
  eventId,
  grantId,
  manifestId,
  origin,
  workflowId,
  eventType,
  stateVersion,
  occurredAt = new Date().toISOString(),
  resumeUrl,
  nonce,
  idempotencyKey,
}) {
  const event = {
    type: EVENT_TYPE,
    version: PROTOCOL_VERSION,
    eventId,
    grantId,
    manifestId,
    origin,
    workflowId,
    eventType,
    stateVersion,
    occurredAt,
    resumeUrl,
    nonce,
    idempotencyKey,
  };
  validateEventShape(event, { requireSignature: false });
  return event;
}

export function signContinuationEvent(event, signing) {
  validateEventShape(event, { requireSignature: false });
  return signProtocolObject(event, signing);
}

export function verifyContinuationEventSignature(event, secret) {
  return verifyProtocolObject(event, {
    keyResolver: () => secret,
    purpose: "event",
  });
}

export function validateContinuationEvent(
  event,
  { keyResolver, expectedOrigin },
) {
  validateEventShape(event, { requireSignature: true });
  if (expectedOrigin && event.origin !== expectedOrigin) {
    throw new ProtocolValidationError("Continuation event origin does not match the Grant");
  }
  if (!verifyProtocolObject(event, { keyResolver, purpose: "event" })) {
    throw new ProtocolAuthenticationError("Invalid continuation event signature");
  }
  return event;
}

function validateManifestShape(manifest, { requireSignature }) {
  requireObject(manifest, "Manifest");
  const expectedFields = [
    "issuedAt",
    "manifestId",
    "origin",
    "reentryPoints",
    ...(requireSignature ? ["signature"] : []),
    "type",
    "version",
    "workflow",
  ];
  requireExactKeys(manifest, expectedFields, "Manifest");
  if (manifest.type !== MANIFEST_TYPE || manifest.version !== PROTOCOL_VERSION) {
    throw new ProtocolValidationError("Unsupported re-entry manifest type or version");
  }
  requireText(manifest.manifestId, "manifestId");
  requireOrigin(manifest.origin, "manifest origin");
  requireIsoDate(manifest.issuedAt, "manifest issuedAt");
  requireObject(manifest.workflow, "manifest workflow");
  requireExactKeys(
    manifest.workflow,
    ["currentState", "id", "stateVersion", "type"],
    "Manifest workflow",
  );
  requireText(manifest.workflow.id, "workflow id");
  requireText(manifest.workflow.type, "workflow type");
  requireText(manifest.workflow.currentState, "workflow current state");
  requirePositiveInteger(manifest.workflow.stateVersion, "workflow stateVersion");
  if (!Array.isArray(manifest.reentryPoints) || manifest.reentryPoints.length === 0) {
    throw new ProtocolValidationError("Manifest requires at least one re-entry point");
  }
  const eventTypes = new Set();
  for (const point of manifest.reentryPoints) {
    validateReentryPoint(point, manifest.origin);
    if (eventTypes.has(point.eventType)) {
      throw new ProtocolValidationError("Manifest event types must be unique");
    }
    eventTypes.add(point.eventType);
  }
  if (requireSignature) validateSignatureShape(manifest.signature);
}

function validateReentryPoint(point, origin) {
  requireObject(point, "Re-entry point");
  requireExactKeys(
    point,
    [
      "actionsRequiringHumanApproval",
      "defaultLimits",
      "description",
      "eventType",
      "permittedReadTools",
      "permittedWriteTools",
      "reentryGoal",
      "requiredToolOrder",
      "resumeUrl",
      "title",
    ],
    "Re-entry point",
  );
  requireText(point.eventType, "re-entry eventType");
  requireText(point.title, "re-entry title");
  requireText(point.description, "re-entry description");
  requireText(point.reentryGoal, "re-entry goal");
  requireUrlAtOrigin(point.resumeUrl, origin, "re-entry resumeUrl");
  requireTextArray(point.permittedReadTools, "permittedReadTools");
  requireTextArray(point.permittedWriteTools, "permittedWriteTools");
  requireTextArray(point.requiredToolOrder, "requiredToolOrder");
  requireTextArray(
    point.actionsRequiringHumanApproval,
    "actionsRequiringHumanApproval",
  );
  const permittedTools = new Set([
    ...point.permittedReadTools,
    ...point.permittedWriteTools,
  ]);
  if (point.requiredToolOrder.some((toolName) => !permittedTools.has(toolName))) {
    throw new ProtocolValidationError(
      "requiredToolOrder can contain only permitted Site Tools",
    );
  }
  requireObject(point.defaultLimits, "re-entry defaultLimits");
  requireExactKeys(
    point.defaultLimits,
    ["expiresAt", "maximumExecutions", "minimumIntervalSeconds"],
    "Re-entry defaultLimits",
  );
  requirePositiveInteger(
    point.defaultLimits.maximumExecutions,
    "maximumExecutions",
  );
  if (
    !Number.isInteger(point.defaultLimits.minimumIntervalSeconds) ||
    point.defaultLimits.minimumIntervalSeconds < 0
  ) {
    throw new ProtocolValidationError(
      "minimumIntervalSeconds must be a non-negative integer",
    );
  }
  requireIsoDate(point.defaultLimits.expiresAt, "re-entry expiresAt");
}

function validateEventShape(event, { requireSignature }) {
  requireObject(event, "Continuation event");
  const expectedFields = requireSignature
    ? EVENT_FIELDS
    : EVENT_FIELDS.filter((field) => field !== "signature");
  requireExactKeys(event, expectedFields, "Continuation event");
  if (event.type !== EVENT_TYPE || event.version !== PROTOCOL_VERSION) {
    throw new ProtocolValidationError("Unsupported continuation event type or version");
  }
  for (const field of [
    "eventId",
    "grantId",
    "manifestId",
    "workflowId",
    "eventType",
    "nonce",
    "idempotencyKey",
  ]) {
    requireText(event[field], field);
  }
  requireOrigin(event.origin, "event origin");
  requireUrlAtOrigin(event.resumeUrl, event.origin, "event resumeUrl");
  requirePositiveInteger(event.stateVersion, "event stateVersion");
  requireIsoDate(event.occurredAt, "event occurredAt");
  if (requireSignature) validateSignatureShape(event.signature);
}

function validateSignatureShape(signature) {
  requireObject(signature, "Signature");
  requireExactKeys(signature, ["algorithm", "keyId", "value"], "Signature");
  if (signature.algorithm !== SIGNATURE_ALGORITHM) {
    throw new ProtocolValidationError("Unsupported signature algorithm");
  }
  requireText(signature.keyId, "signature keyId");
  requireText(signature.value, "signature value");
}

function requireExactKeys(value, expected, label) {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  if (
    actual.length !== sortedExpected.length ||
    actual.some((key, index) => key !== sortedExpected[index])
  ) {
    throw new ProtocolValidationError(`${label} fields do not match the strict contract`);
  }
}

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ProtocolValidationError(`${label} must be an object`);
  }
}

function requireText(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ProtocolValidationError(`${label} is required`);
  }
}

function requireTextArray(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item)) {
    throw new ProtocolValidationError(`${label} must be an array of non-empty strings`);
  }
  if (new Set(value).size !== value.length) {
    throw new ProtocolValidationError(`${label} cannot contain duplicate values`);
  }
}

function requirePositiveInteger(value, label) {
  if (!Number.isInteger(value) || value < 1) {
    throw new ProtocolValidationError(`${label} must be a positive integer`);
  }
}

function requireIsoDate(value, label) {
  const parsed = Date.parse(value);
  if (
    typeof value !== "string" ||
    !Number.isFinite(parsed) ||
    new Date(parsed).toISOString() !== value
  ) {
    throw new ProtocolValidationError(`${label} must be an ISO-8601 timestamp`);
  }
}

function requireOrigin(value, label) {
  requireText(value, label);
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new ProtocolValidationError(`${label} must be a URL origin`);
  }
  if (url.origin !== value || !["http:", "https:"].includes(url.protocol)) {
    throw new ProtocolValidationError(`${label} must be an HTTP(S) URL origin`);
  }
}

function requireUrlAtOrigin(value, origin, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new ProtocolValidationError(`${label} must be an absolute URL`);
  }
  if (url.origin !== origin) {
    throw new ProtocolValidationError(`${label} must stay on the manifest origin`);
  }
}

function signaturesMatch(actual, expected) {
  const actualBuffer = Buffer.from(actual ?? "", "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export class ProtocolValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ProtocolValidationError";
    this.statusCode = 422;
  }
}

export class ProtocolAuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ProtocolAuthenticationError";
    this.statusCode = 401;
  }
}
