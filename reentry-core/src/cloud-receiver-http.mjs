import { TextDecoder } from "node:util";

import { canonicalJson } from "./protocol.mjs";
import {
  ReceiverAuthorizationError,
  ReceiverConflictError,
  ReceiverInvariantError,
  ReceiverNotFoundError,
  ReceiverScopeError,
  ReceiverValidationError,
} from "./receiver-core.mjs";
import {
  ACKNOWLEDGEMENT_REQUEST_FIELDS,
  CLAIM_REQUEST_FIELDS,
  RECEIVER_HTTP_CONTENT_TYPE,
  RECEIVER_HTTP_LIMITS,
  RECEIVER_HTTP_ROUTES,
} from "./receiver-http-contract.mjs";

export { RECEIVER_HTTP_LIMITS, RECEIVER_HTTP_ROUTES } from "./receiver-http-contract.mjs";

const HANDLER_OPTION_FIELDS = Object.freeze(["receiver"]);
const RECEIVER_METHODS = Object.freeze([
  "acceptEvent",
  "claimDelivery",
  "acknowledgeDelivery",
]);
const ROUTE_PATHS = new Set(Object.values(RECEIVER_HTTP_ROUTES));
const CORE_ERROR_TYPES = Object.freeze([
  ReceiverValidationError,
  ReceiverAuthorizationError,
  ReceiverConflictError,
  ReceiverScopeError,
  ReceiverNotFoundError,
  ReceiverInvariantError,
]);
const ERROR_CODE_PATTERN = /^[a-z][a-z0-9_]{0,95}$/;
const CONTENT_TYPE_PATTERN = /^application\/json(?:\s*;\s*charset=utf-8)?$/i;

export function createCloudReceiverHttpHandler(options) {
  requireExactRecord(options, HANDLER_OPTION_FIELDS, "Cloud Receiver HTTP options");
  requireReceiver(options.receiver);

  return function cloudReceiverHttpHandler(request, response) {
    return handleRequest(options.receiver, request, response).catch((error) => {
      if (response.destroyed) return;
      if (response.headersSent) {
        response.destroy();
        return;
      }
      const failure = classifyFailure(error);
      writeJson(response, failure.statusCode, { error: { code: failure.code } }, failure.headers);
    });
  };
}

async function handleRequest(receiver, request, response) {
  const route = parseRoute(request.url);
  if (!route) {
    throw httpFailure("http_route_not_found", 404);
  }
  if (request.method !== "POST") {
    throw httpFailure("http_method_not_allowed", 405, { Allow: "POST" });
  }
  requireJsonContentType(request);
  if (getDistinctHeaderValues(request, "content-encoding").length > 0) {
    throw httpFailure("http_content_type_invalid", 415);
  }
  const body = await readJsonBody(request);

  if (route === RECEIVER_HTTP_ROUTES.event) {
    const result = requireSynchronousResult(receiver.acceptEvent(body));
    writeJson(response, 202, result);
    return;
  }
  if (route === RECEIVER_HTTP_ROUTES.claim) {
    requireExactRecord(body, CLAIM_REQUEST_FIELDS, "Delivery claim request");
    const result = requireSynchronousResult(receiver.claimDelivery({
      connectorToken: body.connector_token,
      claimToken: body.claim_token,
    }));
    if (result === null) {
      writeNoContent(response);
      return;
    }
    writeJson(response, 200, result);
    return;
  }

  requireExactRecord(body, ACKNOWLEDGEMENT_REQUEST_FIELDS, "Delivery acknowledgement request");
  const result = requireSynchronousResult(receiver.acknowledgeDelivery({
    connectorToken: body.connector_token,
    deliveryId: body.delivery_id,
    leaseToken: body.lease_token,
    effectToken: body.effect_token,
  }));
  writeJson(response, 200, result);
}

function parseRoute(value) {
  if (typeof value !== "string" || value.length > 256) return null;
  return ROUTE_PATHS.has(value) ? value : null;
}

function requireJsonContentType(request) {
  const values = getDistinctHeaderValues(request, "content-type");
  if (values.length !== 1 || !CONTENT_TYPE_PATTERN.test(values[0])) {
    throw httpFailure("http_content_type_invalid", 415);
  }
}

function getDistinctHeaderValues(request, name) {
  const distinct = request.headersDistinct?.[name];
  if (Array.isArray(distinct)) return distinct;
  const value = request.headers?.[name];
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

async function readJsonBody(request) {
  const declaredLength = getDistinctHeaderValues(request, "content-length");
  if (declaredLength.length > 1) {
    throw httpFailure("http_body_invalid", 400);
  }
  if (declaredLength.length === 1) {
    if (!/^(?:0|[1-9][0-9]*)$/.test(declaredLength[0])) {
      throw httpFailure("http_body_invalid", 400);
    }
    if (Number(declaredLength[0]) > RECEIVER_HTTP_LIMITS.requestBytes) {
      throw httpFailure("http_body_too_large", 413);
    }
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > RECEIVER_HTTP_LIMITS.requestBytes) {
      throw httpFailure("http_body_too_large", 413);
    }
    chunks.push(bytes);
  }
  if (size === 0) {
    throw httpFailure("http_body_invalid", 400);
  }

  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
  } catch {
    throw httpFailure("http_body_invalid", 400);
  }
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw httpFailure("http_body_invalid", 400);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw httpFailure("http_body_invalid", 400);
  }
  return value;
}

function requireExactRecord(value, expectedFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw httpFailure("http_body_invalid", 400);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw httpFailure("http_body_invalid", 400);
  }
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key === "symbol" || !descriptor?.enumerable || !("value" in descriptor)) {
      throw httpFailure("http_body_invalid", 400);
    }
  }
  const actual = Object.keys(value).sort();
  const expected = [...expectedFields].sort();
  if (
    actual.length !== expected.length ||
    actual.some((field, index) => field !== expected[index])
  ) {
    throw httpFailure("http_body_invalid", 400, undefined, `${label} fields are invalid`);
  }
}

function requireSynchronousResult(value) {
  if (value && typeof value.then === "function") {
    throw new TypeError("Receiver Core HTTP methods must be synchronous");
  }
  return value;
}

function writeJson(response, statusCode, body, additionalHeaders = undefined) {
  const payload = canonicalJson(body);
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(payload),
    "Content-Type": RECEIVER_HTTP_CONTENT_TYPE,
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
    ...additionalHeaders,
  });
  response.end(payload);
}

function writeNoContent(response) {
  response.writeHead(204, {
    "Cache-Control": "no-store",
    "Content-Length": 0,
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
  });
  response.end();
}

function classifyFailure(error) {
  if (error instanceof CloudReceiverHttpError) {
    return error;
  }
  if (
    CORE_ERROR_TYPES.some((ErrorType) => error instanceof ErrorType) &&
    Number.isInteger(error.statusCode) &&
    error.statusCode >= 400 &&
    error.statusCode <= 599 &&
    typeof error.code === "string" &&
    ERROR_CODE_PATTERN.test(error.code)
  ) {
    return {
      code: error.code,
      statusCode: error.statusCode,
      headers: undefined,
    };
  }
  return {
    code: "receiver_internal_error",
    statusCode: 500,
    headers: undefined,
  };
}

function httpFailure(code, statusCode, headers, message = code) {
  return new CloudReceiverHttpError(code, statusCode, headers, message);
}

class CloudReceiverHttpError extends Error {
  constructor(code, statusCode, headers, message) {
    super(message);
    this.name = "CloudReceiverHttpError";
    this.code = code;
    this.statusCode = statusCode;
    this.headers = headers;
  }
}

function requireReceiver(receiver) {
  if (!receiver || typeof receiver !== "object") {
    throw new TypeError("Cloud Receiver HTTP adapter requires a Receiver Core");
  }
  for (const method of RECEIVER_METHODS) {
    if (typeof receiver[method] !== "function") {
      throw new TypeError(`Cloud Receiver HTTP adapter Receiver is missing ${method}`);
    }
  }
}
