import { createReentry } from "@4xeoz/re-entry-sdk/server";

export const DEMO_HOST_SUBJECT_REF = "sdk_demo_user";
export const DEMO_TITLE = "Let Codex return later?";
export const DEMO_REASON = "Approve one future continuation and choose the Mac where Codex should open.";

const REQUEST_HANDLE_STORE = Symbol.for("reentry.host-sdk.demo.request-handles");
const CONTINUATION_STORE = Symbol.for("reentry.host-sdk.demo.continuations");

export function createDemoContext() {
  const configuration = readConfiguration();
  return {
    configuration,
    reentry: createReentry({
      origin: configuration.origin,
      receiverOrigin: configuration.receiverOrigin,
      privateKey: configuration.privateKey,
      keyId: configuration.keyId,
      organizationApiKey: configuration.organizationApiKey,
    }),
  };
}

export function demoWorkflowUrl(origin) {
  return new URL("/", origin).href;
}

export function retainRequestHandle(handle) {
  const consentSessionId = requireIdentifier(handle?.consentSessionId, "consent_session_id");
  if (!handle || typeof handle !== "object" || Array.isArray(handle) || !handle.workflow) {
    throw demoError("sdk_demo_request_handle_invalid", 500);
  }
  const stored = serializableClone(handle);
  requestHandleStore().set(consentSessionId, stored);
  return consentSessionId;
}

export function getRequestHandle(consentSessionId) {
  const id = requireIdentifier(consentSessionId, "consent_session_id");
  const handle = requestHandleStore().get(id);
  if (!handle) throw demoError("sdk_demo_request_not_found", 404);
  return serializableClone(handle);
}

export function retainApprovedContinuation(continuationId, continuation) {
  const id = requireIdentifier(continuationId, "continuation_id");
  if (
    !continuation ||
    typeof continuation !== "object" ||
    Array.isArray(continuation) ||
    !continuation.binding ||
    !continuation.workflow
  ) {
    throw demoError("sdk_demo_continuation_invalid", 500);
  }
  continuationStore().set(id, serializableClone(continuation));
  return id;
}

export function getApprovedContinuation(continuationId) {
  const value = continuationStore().get(requireIdentifier(continuationId, "continuation_id"));
  if (!value) throw demoError("sdk_demo_continuation_not_found", 404);
  return serializableClone(value);
}

export function demoJson(status, value) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function demoErrorResponse(error) {
  let status = 500;
  if (Number.isInteger(error?.statusCode) && error.statusCode >= 400 && error.statusCode <= 599) {
    status = error.statusCode;
  } else if (error?.code === "sdk_demo_not_configured") {
    status = 503;
  }
  const code = typeof error?.code === "string" && /^[a-z][a-z0-9_]{0,95}$/.test(error.code)
    ? error.code
    : "sdk_demo_failed";
  return demoJson(status, { error: { code } });
}

export async function readExactJson(request, fields, requiredFields = fields) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw demoError("sdk_demo_request_invalid", 400);
  }
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).some((field) => !fields.includes(field)) ||
    requiredFields.some((field) => !Object.hasOwn(body, field))
  ) {
    throw demoError("sdk_demo_request_invalid", 400);
  }
  return body;
}

function readConfiguration() {
  const values = {
    origin: process.env.HOST_ORIGIN,
    receiverOrigin: process.env.RECEIVER_ORIGIN,
    privateKey: process.env.REENTRY_PRIVATE_KEY?.replaceAll("\\n", "\n"),
    keyId: process.env.REENTRY_KEY_ID,
    organizationApiKey: process.env.REENTRY_ORGANIZATION_API_KEY,
  };
  if (Object.values(values).some((value) => typeof value !== "string" || value.length === 0)) {
    throw demoError("sdk_demo_not_configured", 503);
  }
  return values;
}

function continuationStore() {
  globalThis[CONTINUATION_STORE] ??= new Map();
  return globalThis[CONTINUATION_STORE];
}

function requestHandleStore() {
  globalThis[REQUEST_HANDLE_STORE] ??= new Map();
  return globalThis[REQUEST_HANDLE_STORE];
}

function serializableClone(value) {
  try {
    return Object.freeze(JSON.parse(JSON.stringify(value)));
  } catch {
    throw demoError("sdk_demo_serialization_failed", 500);
  }
}

function requireIdentifier(value, label) {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value)) {
    throw demoError(`sdk_demo_${label}_invalid`, 400);
  }
  return value;
}

function demoError(code, statusCode) {
  const error = new Error(code);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}
