import { spawn } from "node:child_process";
import { TextDecoder } from "node:util";

export const PAIRING_CLIENT_ROUTES = Object.freeze({
  accountPairingClaim: "/v0.1/account/pairing-sessions/claim",
  connectorDisconnect: "/v0.1/connectors/disconnect",
  claim: "/v0.1/pairing-sessions/claim",
  poll: "/v0.1/pairing-sessions/poll",
  deviceStart: "/v0.1/device-authorizations",
  devicePoll: "/v0.1/device-authorizations/poll",
});

export async function openBrowser(url) {
  return defaultOpenBrowser(url);
}

const OPTION_FIELDS = Object.freeze(["baseUrl", "requestTimeoutMs", "openBrowser", "sleep"]);
const PAIR_INPUT_FIELDS = Object.freeze(["userCode"]);
const CONNECT_INPUT_FIELDS = Object.freeze(["deviceName"]);
const ACCOUNT_PAIRING_INPUT_FIELDS = Object.freeze(["pairingCode", "deviceName"]);
const DISCONNECT_INPUT_FIELDS = Object.freeze(["connectorToken"]);
const DEVICE_AUTHORIZATION_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "authorization_id",
  "device_code",
  "verification_uri",
  "expires_at",
  "poll_interval_seconds",
]);
const DEVICE_STATUS_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "authorization_id",
  "status",
  "expires_at",
  "poll_interval_seconds",
]);
const DEVICE_CREDENTIAL_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "authorization_id",
  "connector_id",
  "connector_token",
  "connector_expires_at",
  "duplicate",
]);
const CLAIM_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "pairing_id",
  "device_code",
  "verification_uri",
  "expires_at",
  "poll_interval_seconds",
]);
const STATUS_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "pairing_id",
  "status",
  "expires_at",
  "poll_interval_seconds",
]);
const CREDENTIAL_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "pairing_id",
  "connector_id",
  "connector_token",
  "connector_expires_at",
  "duplicate",
]);
const TOKENLESS_CREDENTIAL_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "pairing_id",
  "connector_id",
  "connector_expires_at",
  "duplicate",
]);
const DISCONNECTION_FIELDS = Object.freeze([
  "type",
  "protocol_version",
  "status",
  "duplicate",
]);
const ERROR_FIELDS = Object.freeze(["error"]);
const ERROR_BODY_FIELDS = Object.freeze(["code"]);
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const USER_CODE_PATTERN = /^[A-F0-9]{16}$/;
const ACCOUNT_PAIRING_CODE_PATTERN = /^[A-F0-9]{8}$/;
const CONTENT_TYPE_PATTERN = /^application\/json(?:\s*;\s*charset=utf-8)?$/i;
const MIN_REQUEST_TIMEOUT_MS = 100;
const MAX_REQUEST_TIMEOUT_MS = 60_000;
const MAX_RESPONSE_BYTES = 32 * 1_024;

export class PairingClientError extends Error {
  constructor(code, message, options = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "PairingClientError";
    this.code = code;
    this.statusCode = options.statusCode;
  }
}

export class LocalConnectorPairingClient {
  #baseUrl;
  #requestTimeoutMs;
  #openBrowser;
  #sleep;

  constructor(options) {
    requireExactRecord(options, OPTION_FIELDS, ["baseUrl"], "Pairing client options");
    this.#baseUrl = requireReceiverOrigin(options.baseUrl);
    this.#requestTimeoutMs = requireTimeout(options.requestTimeoutMs ?? 5_000);
    this.#openBrowser = options.openBrowser ?? defaultOpenBrowser;
    this.#sleep = options.sleep ?? defaultSleep;
    if (typeof this.#openBrowser !== "function") {
      throw new TypeError("Pairing client openBrowser must be a function");
    }
    if (typeof this.#sleep !== "function") {
      throw new TypeError("Pairing client sleep must be a function");
    }
  }

  async pair(input, onReady = undefined) {
    requireExactRecord(input, PAIR_INPUT_FIELDS, PAIR_INPUT_FIELDS, "Pairing input");
    const userCode = normalizeUserCode(input.userCode);
    const claimResponse = await this.#post(PAIRING_CLIENT_ROUTES.claim, {
      user_code: formatUserCode(userCode),
    });
    if (claimResponse.status !== 200) throw await parseHttpFailure(claimResponse);
    const claim = normalizeClaim(await parseJsonResponse(claimResponse), this.#baseUrl);
    if (typeof onReady === "function") {
      await onReady({
        verificationUri: claim.verification_uri,
        expiresAt: claim.expires_at,
        pollIntervalSeconds: claim.poll_interval_seconds,
      });
    }
    let browserOpened = false;
    try {
      browserOpened = (await this.#openBrowser(claim.verification_uri)) === true;
    } catch {
      browserOpened = false;
    }

    const deadline = Date.parse(claim.expires_at);
    while (true) {
      const response = await this.#post(PAIRING_CLIENT_ROUTES.poll, {
        device_code: claim.device_code,
      });
      if (response.status === 202) {
        const pending = normalizeStatus(await parseJsonResponse(response));
        if (pending.pairing_id !== claim.pairing_id) {
          throw pairingFailure("pairing_response_invalid", "Pairing status is mismatched");
        }
        if (Date.now() >= deadline) throw pairingFailure("pairing_expired", "Pairing expired");
        await this.#sleep(pending.poll_interval_seconds * 1_000);
        continue;
      }
      if (response.status !== 200) throw await parseHttpFailure(response);
      const credentials = normalizeCredentials(await parseJsonResponse(response));
      if (credentials.pairing_id !== claim.pairing_id) {
        throw pairingFailure("pairing_response_invalid", "Pairing credentials are mismatched");
      }
      return Object.freeze({ ...credentials, browserOpened });
    }
  }

  async connect(input, onReady = undefined) {
    requireExactRecord(input, CONNECT_INPUT_FIELDS, CONNECT_INPUT_FIELDS, "Device connection input");
    const deviceName = requireDeviceName(input.deviceName);
    const startResponse = await this.#post(PAIRING_CLIENT_ROUTES.deviceStart, {
      device_name: deviceName,
    });
    if (startResponse.status !== 201) throw await parseHttpFailure(startResponse);
    const authorization = normalizeDeviceAuthorization(
      await parseJsonResponse(startResponse),
      this.#baseUrl,
    );
    if (typeof onReady === "function") {
      await onReady({
        verificationUri: authorization.verification_uri,
        expiresAt: authorization.expires_at,
        pollIntervalSeconds: authorization.poll_interval_seconds,
      });
    }
    let browserOpened = false;
    try {
      browserOpened = (await this.#openBrowser(authorization.verification_uri)) === true;
    } catch {
      browserOpened = false;
    }

    const deadline = Date.parse(authorization.expires_at);
    while (true) {
      const response = await this.#post(PAIRING_CLIENT_ROUTES.devicePoll, {
        device_code: authorization.device_code,
      });
      if (response.status === 202) {
        const pending = normalizeDeviceStatus(await parseJsonResponse(response));
        if (pending.authorization_id !== authorization.authorization_id) {
          throw pairingFailure("pairing_response_invalid", "Device authorization status is mismatched");
        }
        if (Date.now() >= deadline) {
          throw pairingFailure("device_authorization_expired", "Device authorization expired");
        }
        await this.#sleep(pending.poll_interval_seconds * 1_000);
        continue;
      }
      if (response.status !== 200) throw await parseHttpFailure(response);
      const credentials = normalizeDeviceCredentials(await parseJsonResponse(response));
      if (credentials.authorization_id !== authorization.authorization_id) {
        throw pairingFailure("pairing_response_invalid", "Device credentials are mismatched");
      }
      return Object.freeze({ ...credentials, browserOpened });
    }
  }

  async connectWithPairingCode(input) {
    requireExactRecord(
      input,
      ACCOUNT_PAIRING_INPUT_FIELDS,
      ACCOUNT_PAIRING_INPUT_FIELDS,
      "Account pairing input",
    );
    const pairingCode = normalizeAccountPairingCode(input.pairingCode);
    const deviceName = requireDeviceName(input.deviceName);
    const response = await this.#post(PAIRING_CLIENT_ROUTES.accountPairingClaim, {
      pairing_code: pairingCode,
      device_name: deviceName,
    });
    if (response.status !== 200) throw await parseHttpFailure(response);
    const credentials = normalizeAccountCredentials(await parseJsonResponse(response));
    if (credentials.duplicate && !Object.hasOwn(credentials, "connector_token")) {
      throw pairingFailure(
        "connector_credentials_already_exists",
        "Pairing is already complete; use the existing Connector credential or create a new pairing",
        { statusCode: response.status },
      );
    }
    return Object.freeze({
      ...credentials,
      browserOpened: false,
    });
  }

  async disconnectConnector(input) {
    requireExactRecord(
      input,
      DISCONNECT_INPUT_FIELDS,
      DISCONNECT_INPUT_FIELDS,
      "Connector disconnection input",
    );
    if (typeof input.connectorToken !== "string" || !TOKEN_PATTERN.test(input.connectorToken)) {
      throw pairingFailure("pairing_input_invalid", "Connector token is invalid");
    }
    const response = await this.#post(PAIRING_CLIENT_ROUTES.connectorDisconnect, {
      connector_token: input.connectorToken,
    });
    if (response.status !== 200) throw await parseHttpFailure(response);
    return Object.freeze(normalizeDisconnection(await parseJsonResponse(response)));
  }

  async #post(path, body) {
    let response;
    try {
      response = await globalThis.fetch(`${this.#baseUrl}${path}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
        credentials: "omit",
        redirect: "manual",
        signal: AbortSignal.timeout(this.#requestTimeoutMs),
      });
    } catch (error) {
      if (error?.name === "TimeoutError" || error?.name === "AbortError") {
        throw pairingFailure("pairing_request_timeout", "Pairing request timed out", { cause: error });
      }
      throw pairingFailure("pairing_network_error", "Pairing request failed", { cause: error });
    }
    if (response.status >= 300 && response.status <= 399) {
      try {
        await response.body?.cancel();
      } catch {
        // Redirect rejection remains authoritative even if the body cannot be cancelled.
      }
      throw pairingFailure("pairing_redirect_rejected", "Pairing client does not follow redirects", {
        statusCode: response.status,
      });
    }
    return response;
  }
}

function normalizeDeviceAuthorization(value, expectedOrigin) {
  requireExactRecord(
    value,
    DEVICE_AUTHORIZATION_FIELDS,
    DEVICE_AUTHORIZATION_FIELDS,
    "Device authorization response",
  );
  if (value.type !== "webmcp.connector_device_authorization" || value.protocol_version !== "0.1") {
    throw pairingFailure("pairing_response_invalid", "Device authorization response is unsupported");
  }
  return {
    authorization_id: requireIdentifier(value.authorization_id, "authorization_id"),
    device_code: requireToken(value.device_code, "device_code"),
    verification_uri: requireDeviceVerificationUri(value.verification_uri, expectedOrigin),
    expires_at: requireTimestamp(value.expires_at, "expires_at"),
    poll_interval_seconds: requirePollInterval(value.poll_interval_seconds),
  };
}

function normalizeDeviceStatus(value) {
  requireExactRecord(value, DEVICE_STATUS_FIELDS, DEVICE_STATUS_FIELDS, "Device authorization status");
  if (
    value.type !== "webmcp.connector_device_authorization_status" ||
    value.protocol_version !== "0.1" ||
    value.status !== "pending"
  ) {
    throw pairingFailure("pairing_response_invalid", "Device authorization status is unsupported");
  }
  return {
    authorization_id: requireIdentifier(value.authorization_id, "authorization_id"),
    expires_at: requireTimestamp(value.expires_at, "expires_at"),
    poll_interval_seconds: requirePollInterval(value.poll_interval_seconds),
  };
}

function normalizeDeviceCredentials(value) {
  requireExactRecord(value, DEVICE_CREDENTIAL_FIELDS, DEVICE_CREDENTIAL_FIELDS, "Device credentials");
  if (value.type !== "webmcp.connector_credentials" || value.protocol_version !== "0.1") {
    throw pairingFailure("pairing_response_invalid", "Device credential response is unsupported");
  }
  if (typeof value.duplicate !== "boolean") {
    throw pairingFailure("pairing_response_invalid", "Device credential duplicate flag is invalid");
  }
  return {
    authorization_id: requireIdentifier(value.authorization_id, "authorization_id"),
    connector_id: requireIdentifier(value.connector_id, "connector_id"),
    connector_token: requireToken(value.connector_token, "connector_token"),
    connector_expires_at: requireTimestamp(value.connector_expires_at, "connector_expires_at"),
    duplicate: value.duplicate,
  };
}

function normalizeClaim(value, expectedOrigin) {
  requireExactRecord(value, CLAIM_FIELDS, CLAIM_FIELDS, "Pairing claim response");
  if (value.type !== "webmcp.connector_pairing_claim" || value.protocol_version !== "0.1") {
    throw pairingFailure("pairing_response_invalid", "Pairing claim response is unsupported");
  }
  return {
    pairing_id: requireIdentifier(value.pairing_id, "pairing_id"),
    device_code: requireToken(value.device_code, "device_code"),
    verification_uri: requireVerificationUri(value.verification_uri, expectedOrigin),
    expires_at: requireTimestamp(value.expires_at, "expires_at"),
    poll_interval_seconds: requirePollInterval(value.poll_interval_seconds),
  };
}

function normalizeStatus(value) {
  requireExactRecord(value, STATUS_FIELDS, STATUS_FIELDS, "Pairing status response");
  if (
    value.type !== "webmcp.connector_pairing_status" ||
    value.protocol_version !== "0.1" ||
    value.status !== "pending"
  ) {
    throw pairingFailure("pairing_response_invalid", "Pairing status response is unsupported");
  }
  return {
    pairing_id: requireIdentifier(value.pairing_id, "pairing_id"),
    expires_at: requireTimestamp(value.expires_at, "expires_at"),
    poll_interval_seconds: requirePollInterval(value.poll_interval_seconds),
  };
}

function normalizeCredentials(value) {
  requireExactRecord(value, CREDENTIAL_FIELDS, CREDENTIAL_FIELDS, "Connector credential response");
  if (value.type !== "webmcp.connector_credentials" || value.protocol_version !== "0.1") {
    throw pairingFailure("pairing_response_invalid", "Connector credential response is unsupported");
  }
  if (typeof value.duplicate !== "boolean") {
    throw pairingFailure("pairing_response_invalid", "Connector credential duplicate flag is invalid");
  }
  return {
    pairing_id: requireIdentifier(value.pairing_id, "pairing_id"),
    connector_id: requireIdentifier(value.connector_id, "connector_id"),
    connector_token: requireToken(value.connector_token, "connector_token"),
    connector_expires_at: requireTimestamp(value.connector_expires_at, "connector_expires_at"),
    duplicate: value.duplicate,
  };
}

function normalizeAccountCredentials(value) {
  const fields = value?.duplicate === true ? TOKENLESS_CREDENTIAL_FIELDS : CREDENTIAL_FIELDS;
  requireExactRecord(
    value,
    fields,
    fields,
    "Account Connector credential response",
    "pairing_response_invalid",
  );
  if (value.type !== "webmcp.connector_credentials" || value.protocol_version !== "0.1") {
    throw pairingFailure("pairing_response_invalid", "Account Connector credential response is unsupported");
  }
  if (typeof value.duplicate !== "boolean") {
    throw pairingFailure("pairing_response_invalid", "Account Connector credential duplicate flag is invalid");
  }
  const normalized = {
    pairing_id: requireIdentifier(value.pairing_id, "pairing_id"),
    connector_id: requireIdentifier(value.connector_id, "connector_id"),
    connector_expires_at: requireTimestamp(value.connector_expires_at, "connector_expires_at"),
    duplicate: value.duplicate,
  };
  if (!value.duplicate) {
    normalized.connector_token = requireToken(value.connector_token, "connector_token");
  }
  return normalized;
}

function normalizeDisconnection(value) {
  requireExactRecord(
    value,
    DISCONNECTION_FIELDS,
    DISCONNECTION_FIELDS,
    "Connector disconnection response",
    "pairing_response_invalid",
  );
  if (
    value.type !== "webmcp.connector_disconnection" ||
    value.protocol_version !== "0.1" ||
    value.status !== "disconnected" ||
    typeof value.duplicate !== "boolean"
  ) {
    throw pairingFailure("pairing_response_invalid", "Connector disconnection response is unsupported");
  }
  return {
    status: value.status,
    duplicate: value.duplicate,
  };
}

function normalizeAccountPairingCode(value) {
  if (typeof value !== "string") {
    throw pairingFailure("account_pairing_code_invalid", "Pairing code is invalid");
  }
  const normalized = value.replaceAll("-", "").trim().toUpperCase();
  if (!ACCOUNT_PAIRING_CODE_PATTERN.test(normalized)) {
    throw pairingFailure("account_pairing_code_invalid", "Pairing code is invalid");
  }
  return normalized;
}

async function parseJsonResponse(response) {
  const declared = response.headers.get("content-length");
  if (declared !== null && (!/^(?:0|[1-9][0-9]*)$/.test(declared) || Number(declared) > MAX_RESPONSE_BYTES)) {
    throw pairingFailure("pairing_response_invalid", "Pairing response is too large");
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_RESPONSE_BYTES) throw pairingFailure("pairing_response_invalid", "Pairing response is too large");
  if (!CONTENT_TYPE_PATTERN.test(response.headers.get("content-type") ?? "")) {
    throw pairingFailure("pairing_response_invalid", "Pairing response content type is invalid");
  }
  let value;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(buffer));
  } catch {
    throw pairingFailure("pairing_response_invalid", "Pairing response JSON is invalid");
  }
  return value;
}

async function parseHttpFailure(response) {
  let code = "pairing_http_error";
  try {
    const value = await parseJsonResponse(response);
    requireExactRecord(value, ERROR_FIELDS, ERROR_FIELDS, "Pairing error response");
    requireExactRecord(value.error, ERROR_BODY_FIELDS, ERROR_BODY_FIELDS, "Pairing error body");
    if (typeof value.error.code === "string" && /^[a-z][a-z0-9_]{0,95}$/.test(value.error.code)) {
      code = value.error.code;
    }
  } catch {
    // The public failure remains one bounded code.
  }
  return pairingFailure(code, "Pairing request was rejected", { statusCode: response.status });
}

function requireReceiverOrigin(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 2_048) {
    throw pairingFailure("pairing_origin_invalid", "Receiver origin is invalid");
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw pairingFailure("pairing_origin_invalid", "Receiver origin is invalid");
  }
  const loopback = ["127.0.0.1", "[::1]", "::1", "localhost"].includes(parsed.hostname);
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    (parsed.protocol === "http:" && !loopback) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    parsed.origin !== value
  ) {
    throw pairingFailure("pairing_origin_invalid", "Receiver origin is invalid");
  }
  return value;
}

function requireVerificationUri(value, expectedOrigin) {
  if (typeof value !== "string" || value.length > 2_048) {
    throw pairingFailure("pairing_response_invalid", "Pairing verification URI is invalid");
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw pairingFailure("pairing_response_invalid", "Pairing verification URI is invalid");
  }
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/pairing" ||
    parsed.hash ||
    parsed.origin !== expectedOrigin ||
    parsed.searchParams.getAll("code").length !== 1 ||
    [...parsed.searchParams.keys()].some((key) => key !== "code")
  ) {
    throw pairingFailure("pairing_response_invalid", "Pairing verification URI is invalid");
  }
  normalizeUserCode(parsed.searchParams.get("code"));
  return value;
}

function requireDeviceVerificationUri(value, expectedOrigin) {
  if (typeof value !== "string" || value.length > 2_048) {
    throw pairingFailure("pairing_response_invalid", "Device verification URI is invalid");
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw pairingFailure("pairing_response_invalid", "Device verification URI is invalid");
  }
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/connect" ||
    parsed.hash ||
    parsed.origin !== expectedOrigin ||
    parsed.searchParams.getAll("token").length !== 1 ||
    [...parsed.searchParams.keys()].some((key) => key !== "token")
  ) {
    throw pairingFailure("pairing_response_invalid", "Device verification URI is invalid");
  }
  requireToken(parsed.searchParams.get("token"), "authorization_token");
  return value;
}

function requireDeviceName(value) {
  if (typeof value !== "string") {
    throw pairingFailure("device_name_invalid", "Device name is invalid");
  }
  const name = value.trim();
  if (name.length < 2 || Buffer.byteLength(name, "utf8") > 80 || /[\u0000-\u001f\u007f]/.test(name)) {
    throw pairingFailure("device_name_invalid", "Device name is invalid");
  }
  return name;
}

function normalizeUserCode(value) {
  if (typeof value !== "string") throw pairingFailure("pairing_code_invalid", "Pairing code is invalid");
  const normalized = value.replaceAll("-", "").toUpperCase();
  if (!USER_CODE_PATTERN.test(normalized)) throw pairingFailure("pairing_code_invalid", "Pairing code is invalid");
  return normalized;
}

function formatUserCode(value) {
  const normalized = normalizeUserCode(value);
  return `${normalized.slice(0, 4)}-${normalized.slice(4, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12)}`;
}

function requireToken(value, label) {
  if (typeof value !== "string" || !TOKEN_PATTERN.test(value)) {
    throw pairingFailure("pairing_response_invalid", `${label} is invalid`);
  }
  return value;
}

function requireIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) {
    throw pairingFailure("pairing_response_invalid", `${label} is invalid`);
  }
  return value;
}

function requireTimestamp(value, label) {
  if (typeof value !== "string" || value.length > 27) {
    throw pairingFailure("pairing_response_invalid", `${label} is invalid`);
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    throw pairingFailure("pairing_response_invalid", `${label} is invalid`);
  }
  return value;
}

function requirePollInterval(value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 60) {
    throw pairingFailure("pairing_response_invalid", "Pairing poll interval is invalid");
  }
  return value;
}

function requireTimeout(value) {
  if (!Number.isSafeInteger(value) || value < MIN_REQUEST_TIMEOUT_MS || value > MAX_REQUEST_TIMEOUT_MS) {
    throw pairingFailure("pairing_timeout_invalid", "Pairing request timeout is invalid");
  }
  return value;
}

function pairingFailure(code, message, options = {}) {
  return new PairingClientError(code, message, options);
}

function requireExactRecord(value, allowedFields, requiredFields, label, failureCode = "pairing_input_invalid") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw pairingFailure(failureCode, `${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw pairingFailure(failureCode, `${label} must be a plain object`);
  }
  const fields = Object.keys(value);
  if (fields.some((field) => !allowedFields.includes(field)) || requiredFields.some((field) => !fields.includes(field))) {
    throw pairingFailure(failureCode, `${label} fields are invalid`);
  }
}

async function defaultSleep(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function defaultOpenBrowser(url) {
  const command = process.platform === "darwin"
    ? "open"
    : process.platform === "win32"
      ? "cmd.exe"
      : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  return await new Promise((resolve) => {
    const child = spawn(command, args, { detached: true, stdio: "ignore" });
    child.once("error", () => resolve(false));
    child.once("spawn", () => {
      child.unref();
      resolve(true);
    });
  });
}
