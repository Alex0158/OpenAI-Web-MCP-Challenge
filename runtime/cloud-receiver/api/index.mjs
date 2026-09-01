import { createPrismaSnapshotPersistence } from "../src/prisma-snapshot-persistence.mjs";

const OPERATIONAL_ROUTES = Object.freeze({
  health: "/healthz",
  readiness: "/readyz",
});


let initialization;

function writeJson(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(payload),
    "Content-Type": "application/json",
  });
  response.end(payload);
}

async function initApp() {
  if (initialization) return initialization;
  initialization = (async () => {
    return {
      persistence: createPrismaSnapshotPersistence({
        databaseUrl: requiredEnvironment("DATABASE_URL"),
        tokenSecret: requiredEnvironment("CLOUD_RECEIVER_CONNECTOR_TOKEN_SECRET"),
        ...(process.env.CLOUD_RECEIVER_VERIFICATION_ORIGIN === undefined
          ? {}
          : { verificationOrigin: process.env.CLOUD_RECEIVER_VERIFICATION_ORIGIN }),
      }),
    };
  })();
  return initialization;
}

export default async function handler(request, response) {
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
    const ready = await app.persistence.ready();
    if (ready) {
      writeJson(response, 200, { status: "ready" });
      return;
    }
    writeJson(response, 503, { status: "not_ready" });
    return;
  }

  await app.persistence.withComposition(async ({ composition, protocolHandler }) => {
    if (await composition.controlHandler(request, response)) return;
    protocolHandler(request, response);
  });
}

function requiredEnvironment(name) {
  const value = process.env[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${name} is required`);
  }
  return value;
}
