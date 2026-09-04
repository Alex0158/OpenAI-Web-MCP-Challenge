import { createReentry } from "@4xeoz/re-entry-sdk/server";

export const TEST_SUBJECT = "reentry_sdk_test_user";
export const TEST_TITLE = "Approve this test contract?";
export const TEST_PROMPT = "Approve one test contract so this app can verify Re-entry consent.";

const REQUEST_HANDLE_STORE = Symbol.for("reentry.sdk.integration.test.request-handles");
const CONTINUATION_STORE = Symbol.for("reentry.sdk.integration.test.continuations");

export function createTestContext() {
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

export function testWorkflowUrl(origin, path = "/") {
  return new URL(path, origin).href;
}

export function retainRequestHandle(handle) {
  const id = requireIdentifier(handle?.consentSessionId, "consent_session_id");
  if (!handle || typeof handle !== "object" || Array.isArray(handle) || !handle.workflow) {
    throw testError("reentry_test_request_handle_invalid", 500);
  }
  requestStore().set(id, serializableClone(handle));
  return id;
}

export function getRequestHandle(consentSessionId) {
  const id = requireIdentifier(consentSessionId, "consent_session_id");
  const handle = requestStore().get(id);
  if (!handle) throw testError("reentry_test_request_not_found", 404);
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
    throw testError("reentry_test_continuation_invalid", 500);
  }
  continuationStore().set(id, serializableClone(continuation));
  return id;
}

export function getApprovedContinuation(continuationId) {
  const value = continuationStore().get(requireIdentifier(continuationId, "continuation_id"));
  if (!value) throw testError("reentry_test_continuation_not_found", 404);
  return serializableClone(value);
}

export function testJson(status, value) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function testErrorResponse(error) {
  let status = 500;
  if (Number.isInteger(error?.statusCode) && error.statusCode >= 400 && error.statusCode <= 599) {
    status = error.statusCode;
  } else if (error?.code === "reentry_test_not_configured") {
    status = 503;
  }
  const code = typeof error?.code === "string" && /^[a-z][a-z0-9_]{0,95}$/.test(error.code)
    ? error.code
    : "reentry_test_failed";
  return testJson(status, { error: { code } });
}

export async function readExactJson(request, fields, requiredFields = fields) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw testError("reentry_test_request_invalid", 400);
  }
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).some((field) => !fields.includes(field)) ||
    requiredFields.some((field) => !Object.hasOwn(body, field))
  ) {
    throw testError("reentry_test_request_invalid", 400);
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
    throw testError("reentry_test_not_configured", 503);
  }
  return values;
}

function requestStore() {
  globalThis[REQUEST_HANDLE_STORE] ??= new Map();
  return globalThis[REQUEST_HANDLE_STORE];
}

function continuationStore() {
  globalThis[CONTINUATION_STORE] ??= new Map();
  return globalThis[CONTINUATION_STORE];
}

function serializableClone(value) {
  try {
    return Object.freeze(JSON.parse(JSON.stringify(value)));
  } catch {
    throw testError("reentry_test_serialization_failed", 500);
  }
}

function requireIdentifier(value, label) {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value)) {
    throw testError(`reentry_test_${label}_invalid`, 400);
  }
  return value;
}

function testError(code, statusCode) {
  const error = new Error(code);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}
