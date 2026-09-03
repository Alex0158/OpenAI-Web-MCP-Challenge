/**
 * @deprecated Historical Cloud Receiver process shell. Do not use for new integrations or
 * production.
 */
import { createServer } from "node:http";

import { createCloudReceiverHttpHandler } from "../../../reentry-core/src/cloud-receiver-http.mjs";

export const CLOUD_RECEIVER_OPERATIONAL_ROUTES = Object.freeze({
  health: "/healthz",
  readiness: "/readyz",
});

export const CLOUD_RECEIVER_SERVER_LIMITS = Object.freeze({
  maxHeaderBytes: 16 * 1_024,
  maxHeaders: 32,
  headersTimeoutMs: 5_000,
  requestTimeoutMs: 10_000,
  socketTimeoutMs: 15_000,
  keepAliveTimeoutMs: 5_000,
  maxRequestsPerSocket: 100,
});

const SERVICE_ALLOWED_FIELDS = Object.freeze(["receiver", "close", "readiness", "controlHandler"]);
const SERVICE_REQUIRED_FIELDS = Object.freeze(["receiver", "close", "readiness"]);
const START_INPUT_FIELDS = Object.freeze(["host", "port"]);
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "::1"]);
const OPERATIONAL_PATHS = new Set(Object.values(CLOUD_RECEIVER_OPERATIONAL_ROUTES));

export class CloudReceiverServiceError extends Error {
  constructor(code, message, options) {
    super(message, options);
    this.name = "CloudReceiverServiceError";
    this.code = code;
  }
}

export function createCloudReceiverService(options) {
  requireExactRecord(
    options,
    SERVICE_ALLOWED_FIELDS,
    SERVICE_REQUIRED_FIELDS,
    "Cloud Receiver service options",
  );
  if (typeof options.close !== "function") {
    throw new TypeError("Cloud Receiver service close must be a function");
  }
  if (typeof options.readiness !== "function") {
    throw new TypeError("Cloud Receiver service readiness must be a function");
  }
  if (options.controlHandler !== undefined && typeof options.controlHandler !== "function") {
    throw new TypeError("Cloud Receiver service controlHandler must be a function");
  }

  const protocolHandler = createCloudReceiverHttpHandler({ receiver: options.receiver });
  let state = "created";
  let resourcesClosed = false;
  let startPromise;
  let stopPromise;

  const server = createServer(
    {
      maxHeaderSize: CLOUD_RECEIVER_SERVER_LIMITS.maxHeaderBytes,
      requireHostHeader: true,
    },
    (request, response) => {
      if (typeof request.url === "string" && OPERATIONAL_PATHS.has(request.url)) {
        void handleOperationalRequest({
          request,
          response,
          getState: () => state,
          readiness: options.readiness,
        }).catch((error) => writeRequestFailure(response, error));
        return;
      }
      if (options.controlHandler === undefined) {
        void Promise.resolve()
          .then(() => protocolHandler(request, response))
          .catch((error) => writeRequestFailure(response, error));
        return;
      }
      void Promise.resolve()
        .then(() => options.controlHandler(request, response))
        .then((handled) => {
          if (!handled && !response.writableEnded && !response.destroyed) {
            return protocolHandler(request, response);
          }
          return undefined;
        })
        .catch((error) => writeRequestFailure(response, error));
    },
  );
  server.maxHeadersCount = CLOUD_RECEIVER_SERVER_LIMITS.maxHeaders;
  server.headersTimeout = CLOUD_RECEIVER_SERVER_LIMITS.headersTimeoutMs;
  server.requestTimeout = CLOUD_RECEIVER_SERVER_LIMITS.requestTimeoutMs;
  server.timeout = CLOUD_RECEIVER_SERVER_LIMITS.socketTimeoutMs;
  server.keepAliveTimeout = CLOUD_RECEIVER_SERVER_LIMITS.keepAliveTimeoutMs;
  server.maxRequestsPerSocket = CLOUD_RECEIVER_SERVER_LIMITS.maxRequestsPerSocket;

  return Object.freeze({ start, stop, getState: () => state });

  function start(input) {
    requireExactRecord(input, START_INPUT_FIELDS, START_INPUT_FIELDS, "Cloud Receiver start input");
    if (state !== "created") {
      throw serviceFailure(
        "cloud_receiver_start_state_invalid",
        "Cloud Receiver service can be started exactly once",
      );
    }
    const host = requireLoopbackHost(input.host);
    const port = requirePort(input.port);
    state = "starting";
    startPromise = (async () => {
      try {
        await listen(server, host, port);
        const address = server.address();
        if (!address || typeof address === "string") {
          throw serviceFailure(
            "cloud_receiver_address_invalid",
            "Cloud Receiver listener address is unavailable",
          );
        }
        state = "ready";
        return Object.freeze({
          host,
          port: address.port,
          origin: `http://${host === "::1" ? "[::1]" : host}:${address.port}`,
        });
      } catch (error) {
        state = "stopping";
        try {
          await closeResources();
        } catch (closeError) {
          state = "stopped";
          throw new AggregateError(
            [error, closeError],
            "Cloud Receiver startup and resource closure both failed",
            { cause: error },
          );
        }
        state = "stopped";
        throw error;
      }
    })();
    return startPromise;
  }

  function stop() {
    if (stopPromise) return stopPromise;
    stopPromise = (async () => {
      if (state === "stopped") return;
      if (state === "starting") {
        try {
          await startPromise;
        } catch {
          return;
        }
      }
      state = "stopping";
      let closeError;
      try {
        await closeListener(server);
      } catch (error) {
        closeError = error;
      }
      try {
        await closeResources();
      } catch (error) {
        closeError = closeError === undefined
          ? error
          : new AggregateError(
            [closeError, error],
            "Cloud Receiver listener and resources both failed to close",
            { cause: closeError },
          );
      }
      state = "stopped";
      if (closeError !== undefined) throw closeError;
    })();
    return stopPromise;
  }

  async function closeResources() {
    if (resourcesClosed) return;
    resourcesClosed = true;
    await options.close();
  }
}

async function handleOperationalRequest({ request, response, getState, readiness }) {
  if (request.method !== "GET") {
    writeJson(
      response,
      405,
      { error: { code: "http_method_not_allowed" } },
      { Allow: "GET" },
    );
    return;
  }

  if (request.url === CLOUD_RECEIVER_OPERATIONAL_ROUTES.health) {
    writeJson(response, 200, { status: "ok" });
    return;
  }

  let ready = false;
  if (getState() === "ready") {
    try {
      ready = (await readiness()) === true && getState() === "ready";
    } catch {
      ready = false;
    }
  }
  writeJson(
    response,
    ready ? 200 : 503,
    { status: ready ? "ready" : "not_ready" },
    getState() === "ready" ? undefined : { Connection: "close" },
  );
}

function listen(server, host, port) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });
}

function closeListener(server) {
  if (!server.listening) return Promise.resolve();
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeIdleConnections?.();
  });
}

function writeJson(response, statusCode, body, additionalHeaders = undefined) {
  const payload = JSON.stringify(body);
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(payload),
    "Content-Type": "application/json; charset=utf-8",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
    ...additionalHeaders,
  });
  response.end(payload);
}

function writeRequestFailure(response, error) {
  if (response.writableEnded || response.destroyed) return;
  if (response.headersSent) {
    response.destroy?.();
    return;
  }
  if (error?.code === "cloud_receiver_persistence_busy") {
    writeJson(
      response,
      503,
      { error: { code: "receiver_busy" } },
      { "Retry-After": "1" },
    );
    return;
  }
  writeJson(
    response,
    500,
    { error: { code: "receiver_internal_error" } },
    { Connection: "close" },
  );
}

function requireLoopbackHost(value) {
  if (typeof value !== "string" || !LOOPBACK_HOSTS.has(value)) {
    throw serviceFailure(
      "cloud_receiver_host_invalid",
      "Stage 1 Cloud Receiver must bind to a literal loopback address",
    );
  }
  return value;
}

function requirePort(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 65_535) {
    throw serviceFailure(
      "cloud_receiver_port_invalid",
      "Cloud Receiver port must be an integer between 0 and 65535",
    );
  }
  return value;
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

function serviceFailure(code, message, cause) {
  return new CloudReceiverServiceError(
    code,
    message,
    cause === undefined ? undefined : { cause },
  );
}
