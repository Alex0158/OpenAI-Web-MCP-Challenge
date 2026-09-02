import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const receiverRoot = requireRoot(process.env.CLOUD_RECEIVER_V2_ROOT);
const backendRoot = path.join(receiverRoot, "backend");
const require = createRequire(import.meta.url);
process.env.TS_NODE_PROJECT = path.join(backendRoot, "tsconfig.json");
require(path.join(receiverRoot, "node_modules/ts-node/register/transpile-only.js"));

const { createApp } = require(path.join(backendRoot, "src/app.ts"));
const { appConfig } = require(path.join(backendRoot, "src/config/config.ts"));
const { prisma } = require(path.join(backendRoot, "src/db/index.ts"));
const effectFile = requireRoot(process.env.CLOUD_RECEIVER_V2_E2E_EFFECT_FILE);

const app = createApp();
// This deterministic authority exists only in the opt-in test process. It
// deliberately keeps the opaque effect token in memory. The independent
// effect record stores only a digest and a canonical attestation.
app.locals.effectAuthority = {
  verifyEffect({ effectToken, expected }) {
    if (typeof effectToken !== "string" || effectToken.length === 0) {
      throw new Error("test effect token is invalid");
    }
    const recorded = JSON.parse(readFileSync(effectFile, "utf8"));
    const effectTokenDigest = createHash("sha256").update(effectToken, "utf8").digest("hex");
    if (recorded.effect_token_digest !== effectTokenDigest) {
      throw new Error("test effect token does not match the independent effect record");
    }
    for (const field of [
      "delivery_id",
      "event_id",
      "correlation_id",
      "workflow_id",
      "canonical_url",
      "human_boundary",
      "outcome",
    ]) {
      if (recorded[field] !== expected[field]) throw new Error("test effect context does not match");
    }
    return {
      type: "webmcp.host_effect_attestation",
      protocol_version: "0.1",
      effect_id: recorded.effect_id,
      delivery_id: recorded.delivery_id,
      event_id: recorded.event_id,
      correlation_id: recorded.correlation_id,
      workflow_id: recorded.workflow_id,
      outcome: recorded.outcome,
      confirmed_at: recorded.confirmed_at,
    };
  },
};

let server;
let stopping = false;

server = app.listen(appConfig.port, "127.0.0.1", () => {
  const address = server.address();
  const port = typeof address === "object" && address !== null ? address.port : null;
  if (!port) {
    process.stderr.write("receiver test server did not expose a port\n");
    process.exit(1);
    return;
  }
  const origin = `http://127.0.0.1:${port}`;
  appConfig.receiverPublicUrl = origin;
  process.stdout.write(`${JSON.stringify({ event: "receiver_ready", origin })}\n`);
});

process.on("SIGTERM", () => shutdown());
process.on("SIGINT", () => shutdown());

async function shutdown() {
  if (stopping) return;
  stopping = true;
  const forceExit = setTimeout(() => process.exit(1), 10_000);
  server.close(async () => {
    await prisma.$disconnect().catch(() => {});
    clearTimeout(forceExit);
    process.exit(0);
  });
}

function requireRoot(value) {
  if (typeof value !== "string" || value.length === 0 || !path.isAbsolute(value)) {
    throw new Error("CLOUD_RECEIVER_V2_ROOT must be an absolute path");
  }
  return value;
}
