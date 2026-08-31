import { ReentryHostSdk } from "../../../reentry-core/src/host-sdk.mjs";
import {
  createContinuationAcceptance,
  canonicalJson,
} from "../../../reentry-core/src/protocol.mjs";
import { RECEIVER_HTTP_ROUTES } from "../../../reentry-core/src/receiver-http-contract.mjs";

const OPTION_FIELDS = Object.freeze([
  "origin",
  "privateKey",
  "keyId",
  "receiverOrigin",
  "requestTimeoutMs",
  "clock",
  "createId",
  "fetchImpl",
]);
const REQUIRED_OPTION_FIELDS = Object.freeze([
  "origin",
  "privateKey",
  "keyId",
  "receiverOrigin",
]);
const DEFAULT_REQUEST_TIMEOUT_MS = 5_000;
const MIN_REQUEST_TIMEOUT_MS = 100;
const MAX_REQUEST_TIMEOUT_MS = 60_000;
const MAX_RESPONSE_BYTES = 32 * 1_024;
const JSON_CONTENT_TYPE = "application/json";

/**
 * Create the server half of the Host SDK.
 *
 * This object is intentionally server-only. It holds the Host signing key and sends signed
 * events to the Receiver. The browser entrypoint has no access to either value.
 */
export function createHostSdk(options) {
  requireExactRecord(options, OPTION_FIELDS, REQUIRED_OPTION_FIELDS, "Host SDK options");

  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new TypeError("Host SDK requires fetch or an explicit fetchImpl");
  }

  const signer = new ReentryHostSdk({
    origin: options.origin,
    privateKey: options.privateKey,
    keyId: options.keyId,
    ...(options.clock === undefined ? {} : { clock: options.clock }),
    ...(options.createId === undefined ? {} : { createId: options.createId }),
  });
  const receiverOrigin = requireReceiverOrigin(options.receiverOrigin);
  const requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  requireRequestTimeout(requestTimeoutMs);

  return Object.freeze({
    createManifest(input) {
      return signer.issueManifest(input);
    },

    createEvent(input) {
      return signer.issueEvent(input);
    },

    async sendEvent(input) {
      const issued = signer.issueEvent(input);
      return postEvent({
        receiverOrigin,
        issued,
        fetchImpl,
        requestTimeoutMs,
      });
    },
  });
}

export class HostSdkTransportError extends Error {
  constructor(code, message, { statusCode, cause } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "HostSdkTransportError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

async function postEvent({ receiverOrigin, issued, fetchImpl, requestTimeoutMs }) {
  let response;
  try {
    response = await fetchImpl(`${receiverOrigin}${RECEIVER_HTTP_ROUTES.event}`, {
      method: "POST",
      headers: {
        Accept: JSON_CONTENT_TYPE,
        "Content-Type": JSON_CONTENT_TYPE,
      },
      body: canonicalJson({ body: issued.body, headers: issued.headers }),
      cache: "no-store",
      credentials: "omit",
      redirect: "manual",
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      throw new HostSdkTransportError(
        "host_sdk_request_timeout",
        "Host SDK request timed out",
        { cause: error },
      );
    }
    throw new HostSdkTransportError(
      "host_sdk_network_error",
      "Host SDK request failed",
      { cause: error },
    );
  }

  if (response.status >= 300 && response.status <= 399) {
    await cancelResponse(response);
    throw new HostSdkTransportError(
      "host_sdk_redirect_rejected",
      "Host SDK does not follow Receiver redirects",
      { statusCode: response.status },
    );
  }

  if (response.status !== 202) {
    const code = await readErrorCode(response);
    throw new HostSdkTransportError(
      code,
      "Receiver rejected the signed event",
      { statusCode: response.status },
    );
  }

  let value;
  try {
    value = await readJson(response);
    return createContinuationAcceptance(value);
  } catch (error) {
    if (error instanceof HostSdkTransportError) throw error;
    throw new HostSdkTransportError(
      "host_sdk_response_invalid",
      "Receiver returned an invalid event acceptance",
      { statusCode: response.status, cause: error },
    );
  }
}

async function readErrorCode(response) {
  let value;
  try {
    value = await readJson(response);
  } catch (error) {
    if (error instanceof HostSdkTransportError) return error.code;
    return "host_sdk_receiver_error";
  }
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    value.error &&
    typeof value.error === "object" &&
    !Array.isArray(value.error) &&
    typeof value.error.code === "string" &&
    /^[a-z][a-z0-9_]{0,95}$/.test(value.error.code)
  ) {
    return value.error.code;
  }
  return "host_sdk_receiver_error";
}

async function readJson(response) {
  const text = await response.text();
  if (Buffer.byteLength(text, "utf8") > MAX_RESPONSE_BYTES) {
    throw new HostSdkTransportError(
      "host_sdk_response_too_large",
      "Receiver response exceeded the SDK limit",
    );
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new HostSdkTransportError(
      "host_sdk_response_invalid",
      "Receiver response was not valid JSON",
      { cause: error },
    );
  }
}

async function cancelResponse(response) {
  try {
    await response.body?.cancel();
  } catch {
    // The redirect rejection is the authoritative outcome.
  }
}

function requireReceiverOrigin(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 2_048) {
    throw new TypeError("Receiver origin must be a canonical HTTP(S) origin");
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new TypeError("Receiver origin must be a canonical HTTP(S) origin");
  }
  const loopback = ["127.0.0.1", "[::1]", "::1"].includes(parsed.hostname);
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    (parsed.protocol === "http:" && !loopback) ||
    parsed.origin !== value ||
    parsed.username ||
    parsed.password
  ) {
    throw new TypeError("Receiver origin must be a canonical HTTP(S) origin");
  }
  return value;
}

function requireRequestTimeout(value) {
  if (
    !Number.isSafeInteger(value) ||
    value < MIN_REQUEST_TIMEOUT_MS ||
    value > MAX_REQUEST_TIMEOUT_MS
  ) {
    throw new TypeError("Host SDK requestTimeoutMs must be between 100 and 60000");
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
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key === "symbol" || !descriptor?.enumerable || !("value" in descriptor)) {
      throw new TypeError(`${label} contains an invalid property`);
    }
  }
  const fields = Object.keys(value);
  if (fields.some((field) => !allowedFields.includes(field))) {
    throw new TypeError(`${label} contains an unsupported field`);
  }
  if (requiredFields.some((field) => !fields.includes(field))) {
    throw new TypeError(`${label} is missing a required field`);
  }
}
