import { createHash, createPublicKey, randomUUID } from "node:crypto";

import { ReentryHostSdk } from "@webmcp-challenge/reentry-core/host-sdk";
import {
  createContinuationAcceptance,
  canonicalJson,
  validatePublicBinding,
} from "@webmcp-challenge/reentry-core/protocol";
import { RECEIVER_HTTP_ROUTES } from "@webmcp-challenge/reentry-core/receiver-http-contract";

export const HOST_SDK_CONTROL_ROUTES = Object.freeze({
  hostKeyRegistration: "/v0.1/host-keys",
  consentSession: "/v0.1/consent-sessions",
  consentDecision: "/v0.1/consent-decisions",
});

const OPTION_FIELDS = Object.freeze([
  "origin",
  "privateKey",
  "keyId",
  "receiverOrigin",
  "requestTimeoutMs",
  "clock",
  "createId",
  "fetchImpl",
  "organizationApiKey",
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
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const CONTROL_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const CONTROL_SESSION_FIELDS = Object.freeze(["manifest", "hostSubjectRef"]);
const CONTROL_DECISION_FIELDS = Object.freeze([
  "challengeId",
  "hostSubjectRef",
  "action",
  "consentToken",
]);
const CONTROL_STATUS_FIELDS = Object.freeze(["consentSessionId"]);
const HOST_KEY_FIELDS = Object.freeze(["hostId"]);
const REENTRY_FACADE_OPTION_FIELDS = Object.freeze([
  "origin",
  "privateKey",
  "keyId",
  "receiverOrigin",
  "organizationApiKey",
  "requestTimeoutMs",
  "clock",
  "createId",
  "fetchImpl",
]);
const REENTRY_FACADE_REQUIRED_OPTION_FIELDS = Object.freeze([
  "origin",
  "privateKey",
  "keyId",
  "receiverOrigin",
  "organizationApiKey",
]);
const REENTRY_REQUEST_FIELDS = Object.freeze(["subject", "prompt", "url"]);
const REENTRY_CONFIRM_OPTION_FIELDS = Object.freeze(["onApproved"]);
const REENTRY_HANDLE_FIELDS = Object.freeze(["consentSessionId", "workflow"]);
const REENTRY_CONTINUATION_FIELDS = Object.freeze(["binding", "workflow"]);
const DEFAULT_REENTRY_WORKFLOW_TYPE = "domain-neutral-workflow";
const DEFAULT_REENTRY_EVENT_TYPE = "workflow.ready";
const DEFAULT_REENTRY_HUMAN_BOUNDARY = "explicit_receiver_consent";
const DEFAULT_REENTRY_STATE_VERSION = 0;
const REENTRY_OFFER_TTL_MS = 5 * 60_000;
const REENTRY_GRANT_TTL_MS = 30 * 60_000;
const REENTRY_DISPLAY_REASON_MAX_BYTES = 500;
const REENTRY_DISPLAY_TITLE_MAX_BYTES = 120;
const REENTRY_CANONICAL_URL_MAX_BYTES = 2_048;
const REENTRY_CONSENT_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const REENTRY_FACADE_STATUS_VALUES = Object.freeze([
  "pending",
  "approved",
  "declined",
  "expired",
  "revoked",
]);

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
  const organizationApiKey = options.organizationApiKey === undefined
    ? undefined
    : requireOrganizationApiKey(options.organizationApiKey);

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

    async registerHostKey(input) {
      requireExactRecord(input, HOST_KEY_FIELDS, HOST_KEY_FIELDS, "Host key registration input");
      const publicKeyPem = exportHostPublicKey(options.privateKey);
      return postControl({
        receiverOrigin,
        path: HOST_SDK_CONTROL_ROUTES.hostKeyRegistration,
        organizationApiKey: requireOrganizationApiKey(organizationApiKey),
        body: {
          host_id: requireIdentifier(input.hostId, "hostId"),
          issuer_origin: options.origin,
          key_id: requireIdentifier(options.keyId, "keyId"),
          public_key_pem: publicKeyPem,
        },
        acceptedStatuses: [200, 201],
        fetchImpl,
        requestTimeoutMs,
      });
    },

    async createConsentSession(input) {
      requireExactRecord(
        input,
        CONTROL_SESSION_FIELDS,
        CONTROL_SESSION_FIELDS,
        "Consent session input",
      );
      requireRecordValue(input.manifest, "manifest");
      return postControl({
        receiverOrigin,
        path: HOST_SDK_CONTROL_ROUTES.consentSession,
        organizationApiKey: requireOrganizationApiKey(organizationApiKey),
        body: {
          host_subject_ref: requireIdentifier(input.hostSubjectRef, "hostSubjectRef"),
          expected_origin: options.origin,
          manifest: input.manifest,
        },
        acceptedStatuses: [200, 201],
        fetchImpl,
        requestTimeoutMs,
      });
    },

    async getConsentSession(input) {
      requireExactRecord(
        input,
        CONTROL_STATUS_FIELDS,
        CONTROL_STATUS_FIELDS,
        "Consent status input",
      );
      return getControl({
        receiverOrigin,
        path: `${HOST_SDK_CONTROL_ROUTES.consentSession}/${encodeURIComponent(requireIdentifier(input.consentSessionId, "consentSessionId"))}`,
        organizationApiKey: requireOrganizationApiKey(organizationApiKey),
        acceptedStatuses: [200],
        fetchImpl,
        requestTimeoutMs,
      });
    },

    async decideConsent(input) {
      requireExactRecord(
        input,
        CONTROL_DECISION_FIELDS,
        CONTROL_DECISION_FIELDS,
        "Consent decision input",
      );
      if (!['approve', 'decline'].includes(input.action)) {
        throw new TypeError("Consent action must be approve or decline");
      }
      return postControl({
        receiverOrigin,
        path: HOST_SDK_CONTROL_ROUTES.consentDecision,
        organizationApiKey: requireOrganizationApiKey(organizationApiKey),
        body: {
          challenge_id: requireIdentifier(input.challengeId, "challengeId"),
          host_subject_ref: requireIdentifier(input.hostSubjectRef, "hostSubjectRef"),
          action: input.action,
          consent_token: requireControlToken(input.consentToken),
        },
        acceptedStatuses: [200],
        fetchImpl,
        requestTimeoutMs,
      });
    },
  });
}

/**
 * Create the smallest server-only Re-entry integration for ordinary Host business rules.
 *
 * The facade owns the protocol defaults and only accepts an authenticated subject, display
 * prompt, and Host URL. It returns a public consent URL plus a serializable server handle, then
 * confirms and triggers through the existing strict Host SDK without adding storage or retries.
 */
export function createReentry(options) {
  requireExactRecord(
    options,
    REENTRY_FACADE_OPTION_FIELDS,
    REENTRY_FACADE_REQUIRED_OPTION_FIELDS,
    "Re-entry facade options",
  );
  const clock = options.clock ?? (() => new Date());
  if (typeof clock !== "function") {
    throw new TypeError("Re-entry facade clock must be a function");
  }
  const sdk = createHostSdk(options);

  return Object.freeze({ request, confirm, trigger });

  async function request(input) {
    requireExactRecord(
      input,
      REENTRY_REQUEST_FIELDS,
      REENTRY_REQUEST_FIELDS,
      "Re-entry request",
    );
    const subject = requireFacadeIdentifier(input.subject, "subject");
    const prompt = requireFacadePrompt(input.prompt);
    const url = requireFacadeUrl(input.url, options.origin);
    await sdk.registerHostKey({ hostId: deriveFacadeHostId(options.origin, options.keyId) });
    const now = readFacadeClock(clock);
    const workflow = createFacadeWorkflow(options.createId, url);
    const manifest = sdk.createManifest({
      issuedAt: now.toISOString(),
      offerExpiresAt: addFacadeDuration(now, REENTRY_OFFER_TTL_MS),
      workflow,
      display: {
        title: deriveFacadeTitle(prompt),
        reason: prompt,
      },
      grantRequest: {
        eventType: DEFAULT_REENTRY_EVENT_TYPE,
        grantExpiresAt: addFacadeDuration(now, REENTRY_GRANT_TTL_MS),
        humanBoundary: DEFAULT_REENTRY_HUMAN_BOUNDARY,
      },
    });
    const session = await sdk.createConsentSession({
      manifest,
      hostSubjectRef: subject,
    });
    const consentSessionId = requireFacadeIdentifier(
      session?.consent_session_id,
      "consent session id",
    );
    const consentUrl = requireFacadeConsentUrl(session?.consent_url, options.receiverOrigin);
    const handle = Object.freeze({
      consentSessionId,
      workflow: toFacadeEventWorkflow(workflow),
    });
    return Object.freeze({ consentUrl, consentSessionId, handle });
  }

  async function confirm(handle, confirmOptions = {}) {
    const normalizedHandle = requireFacadeHandle(handle, options.origin);
    requireExactRecord(
      confirmOptions,
      REENTRY_CONFIRM_OPTION_FIELDS,
      [],
      "Re-entry confirmation options",
    );
    if (confirmOptions.onApproved !== undefined && typeof confirmOptions.onApproved !== "function") {
      throw new TypeError("Re-entry confirmation onApproved must be a function");
    }

    const status = await sdk.getConsentSession({
      consentSessionId: normalizedHandle.consentSessionId,
    });
    const consentStatus = requireFacadeConsentStatus(status?.status);
    if (consentStatus !== "approved") {
      return Object.freeze({ status: consentStatus });
    }

    const binding = validatePublicBinding(status.binding);
    if (
      binding.status !== "active" ||
      binding.runs_remaining !== 1 ||
      binding.workflow_id !== normalizedHandle.workflow.id ||
      binding.event_type !== DEFAULT_REENTRY_EVENT_TYPE
    ) {
      throw new ReentryFacadeError(
        "reentry_continuation_invalid",
        "Approved Re-entry status did not contain the expected active binding",
      );
    }
    const continuation = Object.freeze({
      binding,
      workflow: normalizedHandle.workflow,
    });
    if (confirmOptions.onApproved !== undefined) {
      await confirmOptions.onApproved(continuation);
    }
    return continuation;
  }

  async function trigger(continuation) {
    const normalizedContinuation = requireFacadeContinuation(continuation, options.origin);
    return sdk.sendEvent({
      binding: normalizedContinuation.binding,
      workflow: normalizedContinuation.workflow,
    });
  }
}

export class ReentryFacadeError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ReentryFacadeError";
    this.code = code;
  }
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

async function postControl({
  receiverOrigin,
  path,
  organizationApiKey,
  body,
  acceptedStatuses,
  fetchImpl,
  requestTimeoutMs,
}) {
  let payload;
  try {
    payload = canonicalJson(body);
  } catch (error) {
    throw new HostSdkTransportError(
      "host_sdk_request_invalid",
      "Host SDK could not serialize the control request",
      { cause: error },
    );
  }

  let response;
  try {
    response = await fetchImpl(`${receiverOrigin}${path}`, {
      method: "POST",
      headers: {
        Accept: JSON_CONTENT_TYPE,
        Authorization: `Bearer ${organizationApiKey}`,
        "Content-Type": JSON_CONTENT_TYPE,
      },
      body: payload,
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

  if (!acceptedStatuses.includes(response.status)) {
    const code = await readErrorCode(response);
    throw new HostSdkTransportError(
      code,
      "Receiver rejected the Host control request",
      { statusCode: response.status },
    );
  }

  try {
    return await readJson(response);
  } catch (error) {
    if (error instanceof HostSdkTransportError) throw error;
    throw new HostSdkTransportError(
      "host_sdk_response_invalid",
      "Receiver returned an invalid Host control response",
      { statusCode: response.status, cause: error },
    );
  }
}

async function getControl({
  receiverOrigin,
  path,
  organizationApiKey,
  acceptedStatuses,
  fetchImpl,
  requestTimeoutMs,
}) {
  let response;
  try {
    response = await fetchImpl(`${receiverOrigin}${path}`, {
      method: "GET",
      headers: {
        Accept: JSON_CONTENT_TYPE,
        Authorization: `Bearer ${organizationApiKey}`,
      },
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
  if (!acceptedStatuses.includes(response.status)) {
    const code = await readErrorCode(response);
    throw new HostSdkTransportError(
      code,
      "Receiver rejected the Host control request",
      { statusCode: response.status },
    );
  }
  return readJson(response);
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

function exportHostPublicKey(privateKey) {
  let publicKey;
  try {
    publicKey = createPublicKey(privateKey);
  } catch (error) {
    throw new TypeError("Host SDK privateKey must be a valid signing key", { cause: error });
  }
  if (publicKey.asymmetricKeyType !== "ed25519") {
    throw new TypeError("Host SDK privateKey must be an Ed25519 key");
  }
  return publicKey.export({ type: "spki", format: "pem" }).toString();
}

function requireOrganizationApiKey(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    Buffer.byteLength(value, "utf8") > 4 * 1_024 ||
    /[^\x21-\x7e]/.test(value)
  ) {
    throw new TypeError("Host SDK organizationApiKey is required for Receiver control requests");
  }
  return value;
}

function requireIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) {
    throw new TypeError(`Host SDK ${label} is invalid`);
  }
  return value;
}

function requireControlToken(value) {
  if (typeof value !== "string" || !CONTROL_TOKEN_PATTERN.test(value)) {
    throw new TypeError("Host SDK consentToken is invalid");
  }
  return value;
}

function requireFacadeIdentifier(value, label) {
  if (
    typeof value !== "string" ||
    Buffer.byteLength(value, "utf8") > 160 ||
    !IDENTIFIER_PATTERN.test(value)
  ) {
    throw new TypeError(`Re-entry ${label} is invalid`);
  }
  return value;
}

function requireFacadePrompt(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.trim() !== value ||
    /[\u0000-\u001f\u007f]/.test(value) ||
    Buffer.byteLength(value, "utf8") > REENTRY_DISPLAY_REASON_MAX_BYTES
  ) {
    throw new TypeError("Re-entry prompt is invalid");
  }
  return value;
}

function requireFacadeUrl(value, expectedOrigin) {
  if (
    typeof value !== "string" ||
    Buffer.byteLength(value, "utf8") > REENTRY_CANONICAL_URL_MAX_BYTES
  ) {
    throw new TypeError("Re-entry URL is invalid");
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new TypeError("Re-entry URL is invalid");
  }
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.hash ||
    parsed.origin !== expectedOrigin ||
    parsed.href !== value
  ) {
    throw new TypeError("Re-entry URL is invalid");
  }
  return value;
}

function requireFacadeConsentUrl(value, expectedOrigin) {
  if (
    typeof value !== "string" ||
    Buffer.byteLength(value, "utf8") > REENTRY_CANONICAL_URL_MAX_BYTES
  ) {
    throw new ReentryFacadeError(
      "reentry_consent_response_invalid",
      "Receiver returned an invalid consent URL",
    );
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new ReentryFacadeError(
      "reentry_consent_response_invalid",
      "Receiver returned an invalid consent URL",
    );
  }
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.origin !== expectedOrigin ||
    parsed.pathname !== "/consent" ||
    parsed.hash ||
    parsed.searchParams.getAll("token").length !== 1 ||
    [...parsed.searchParams.keys()].some((key) => key !== "token") ||
    !REENTRY_CONSENT_TOKEN_PATTERN.test(parsed.searchParams.get("token") ?? "") ||
    parsed.href !== value
  ) {
    throw new ReentryFacadeError(
      "reentry_consent_response_invalid",
      "Receiver returned an invalid consent URL",
    );
  }
  return value;
}

function readFacadeClock(clock) {
  const value = clock();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new TypeError("Re-entry facade clock must return a valid Date");
  }
  return new Date(value.getTime());
}

function addFacadeDuration(now, durationMs) {
  const result = new Date(now.getTime() + durationMs);
  if (!Number.isFinite(result.getTime())) {
    throw new TypeError("Re-entry facade clock is outside the supported date range");
  }
  return result.toISOString();
}

function deriveFacadeHostId(origin, keyId) {
  return `host_${createHash("sha256").update(`${origin}\n${keyId}`, "utf8").digest("hex")}`;
}

function createFacadeWorkflow(createId, canonicalUrl) {
  const workflowId = createFacadeId(createId, "workflow");
  return Object.freeze({
    id: workflowId,
    type: DEFAULT_REENTRY_WORKFLOW_TYPE,
    stateVersion: DEFAULT_REENTRY_STATE_VERSION,
    canonicalUrl,
  });
}

function createFacadeId(createId, prefix) {
  const value = createId === undefined ? `${prefix}_${randomUUID()}` : createId(prefix);
  if (typeof value !== "string") {
    throw new TypeError("Re-entry facade createId must return a string");
  }
  return requireFacadeIdentifier(value, `${prefix} id`);
}

function toFacadeEventWorkflow(workflow) {
  return Object.freeze({
    id: workflow.id,
    stateVersion: workflow.stateVersion,
    canonicalUrl: workflow.canonicalUrl,
  });
}

function deriveFacadeTitle(prompt) {
  const firstSentence = prompt.match(/^[^.!?\n]+/u)?.[0]?.trim() || prompt;
  return truncateFacadeText(firstSentence, REENTRY_DISPLAY_TITLE_MAX_BYTES);
}

function truncateFacadeText(value, maximumBytes) {
  if (Buffer.byteLength(value, "utf8") <= maximumBytes) return value;
  const suffix = "...";
  const characters = Array.from(value);
  while (characters.length > 0) {
    const candidate = `${characters.join("").trimEnd()}${suffix}`;
    if (Buffer.byteLength(candidate, "utf8") <= maximumBytes) return candidate;
    characters.pop();
  }
  return suffix;
}

function requireFacadeHandle(value, expectedOrigin) {
  requireExactRecord(
    value,
    REENTRY_HANDLE_FIELDS,
    REENTRY_HANDLE_FIELDS,
    "Re-entry request handle",
  );
  const consentSessionId = requireFacadeIdentifier(
    value.consentSessionId,
    "consent session id",
  );
  const workflow = requireFacadeWorkflow(value.workflow, expectedOrigin);
  return Object.freeze({ consentSessionId, workflow });
}

function requireFacadeWorkflow(value, expectedOrigin) {
  const fields = ["id", "stateVersion", "canonicalUrl"];
  requireExactRecord(value, fields, fields, "Re-entry workflow");
  const id = requireFacadeIdentifier(value.id, "workflow id");
  if (value.stateVersion !== DEFAULT_REENTRY_STATE_VERSION) {
    throw new ReentryFacadeError(
      "reentry_continuation_invalid",
      "Re-entry workflow state version is unsupported",
    );
  }
  const canonicalUrl = requireFacadeUrl(value.canonicalUrl, expectedOrigin);
  return Object.freeze({ id, stateVersion: value.stateVersion, canonicalUrl });
}

function requireFacadeConsentStatus(value) {
  if (!REENTRY_FACADE_STATUS_VALUES.includes(value)) {
    throw new ReentryFacadeError(
      "reentry_consent_status_invalid",
      "Receiver returned an unsupported consent status",
    );
  }
  return value;
}

function requireFacadeContinuation(value, expectedOrigin) {
  requireExactRecord(
    value,
    REENTRY_CONTINUATION_FIELDS,
    REENTRY_CONTINUATION_FIELDS,
    "Re-entry continuation",
  );
  const binding = validatePublicBinding(value.binding);
  const workflow = requireFacadeWorkflow(value.workflow, expectedOrigin);
  if (binding.workflow_id !== workflow.id || binding.event_type !== DEFAULT_REENTRY_EVENT_TYPE) {
    throw new ReentryFacadeError(
      "reentry_continuation_invalid",
      "Re-entry continuation does not match its binding",
    );
  }
  return Object.freeze({ binding, workflow });
}

function requireRecordValue(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`Host SDK ${label} must be an object`);
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
