/**
 * @deprecated This Cloud Receiver preview is retired. The default entry point is intentionally
 * unavailable; the explicit factory opt-in exists only for historical tests.
 */
import { createPrismaRelationalPersistence } from "../src/prisma-relational-persistence.mjs";

const OPERATIONAL_ROUTES = Object.freeze({
  health: "/healthz",
  readiness: "/readyz",
});
const DEPRECATION_RESPONSE = Object.freeze({
  status: "deprecated",
  error: "receiver_deprecated",
});

function writeJson(response, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(payload),
    "Content-Type": "application/json; charset=utf-8",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders,
  });
  response.end(payload);
}

export function createCloudReceiverVercelHandler({
  createPersistence = createPrismaRelationalPersistence,
  environment = process.env,
  deprecated = true,
} = {}) {
  if (typeof deprecated !== "boolean") {
    throw new TypeError("Cloud Receiver Vercel deprecated flag must be boolean");
  }
  let initialization;

  async function initApp() {
    if (initialization) return initialization;
    initialization = (async () => ({
      persistence: createPersistence({
        databaseUrl: requiredEnvironment(environment, "CLOUD_RECEIVER_RUNTIME_DATABASE_URL", "DATABASE_URL"),
        tokenSecret: requiredEnvironment(environment, "CLOUD_RECEIVER_CONNECTOR_TOKEN_SECRET"),
        ...(environment.CLOUD_RECEIVER_VERIFICATION_ORIGIN === undefined
          ? {}
          : { verificationOrigin: environment.CLOUD_RECEIVER_VERIFICATION_ORIGIN }),
      }),
    }))();
    return initialization;
  }

  return async function handler(request, response) {
    if (deprecated) {
      writeJson(response, 410, DEPRECATION_RESPONSE);
      return;
    }
    const url = request.url;
    if (url === OPERATIONAL_ROUTES.health) {
      writeJson(response, 200, { ok: true, service: "cloud-receiver" });
      return;
    }
    let app;
    try {
      app = await initApp();
    } catch {
      writeJson(response, 503, { status: "not_ready", error: "configuration_invalid" });
      return;
    }
    if (url === OPERATIONAL_ROUTES.readiness) {
      try {
        const ready = await app.persistence.ready();
        if (ready) {
          writeJson(response, 200, { status: "ready" });
          return;
        }
      } catch {
        writeJson(response, 503, { status: "not_ready", error: "receiver_unavailable" });
        return;
      }
      writeJson(response, 503, { status: "not_ready" });
      return;
    }

    try {
      await app.persistence.withComposition(async ({ composition, protocolHandler }) => {
        if (await composition.controlHandler(request, response)) return;
        await protocolHandler(request, response);
      }, { readOnly: request.method === "GET" });
    } catch (error) {
      writeRequestFailure(response, error);
    }
  };
}

export default createCloudReceiverVercelHandler();

function requiredEnvironment(environment, primaryName, fallbackName = undefined) {
  const name = environment[primaryName] === undefined && fallbackName !== undefined
    ? fallbackName
    : primaryName;
  const value = environment[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function writeRequestFailure(response, error) {
  if (response.writableEnded || response.destroyed) return;
  if (response.headersSent) {
    if (typeof response.destroy === "function") response.destroy();
    return;
  }
  if (error?.code === "cloud_receiver_persistence_busy") {
    writeJson(response, 503, { error: { code: "receiver_busy" } }, { "Retry-After": "1" });
    return;
  }
  writeJson(response, 500, { error: { code: "receiver_internal_error" } });
}
