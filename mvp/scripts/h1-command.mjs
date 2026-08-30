import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const mvpRoot = path.resolve(scriptsDirectory, "..");
const runtimeDirectory = path.join(mvpRoot, "var");
const secretPath = path.join(runtimeDirectory, "h1-runtime-secrets.json");
const action = process.argv[2];

if (!["reset", "start", "setup", "trigger", "replay"].includes(action)) {
  throw new Error("H1 command must be reset, start, setup, trigger, or replay");
}

fs.mkdirSync(runtimeDirectory, { recursive: true, mode: 0o700 });
const secrets = loadOrCreateSecrets();
process.env.WEBMCP_MVP_DELIVERY = "heartbeat";
process.env.WEBMCP_MVP_PORT = "4321";
process.env.WEBMCP_MVP_DATABASE = path.join(runtimeDirectory, "h1.sqlite");
process.env.WEBMCP_MVP_TRACE = path.join(mvpRoot, "evidence", "h1-latest-trace.jsonl");
process.env.WEBMCP_P0_RECEIVER_CLIENT_TOKEN = secrets.receiver_client_token;
process.env.WEBMCP_H1_DELIVERY_TICKET_SECRET = secrets.delivery_ticket_secret;
process.env.WEBMCP_H1_EFFECT_RECEIPT_SECRET = secrets.effect_receipt_secret;

if (action === "start") {
  const [{ createRuntime, createHttpServer }, config] = await Promise.all([
    import("../src/server.mjs"),
    import("../src/config.mjs"),
  ]);
  const runtime = createRuntime();
  const server = createHttpServer(runtime);
  server.listen(config.DEFAULT_PORT, config.DEFAULT_HOST, () => {
    process.stdout.write(
      `WebMCP fixture (heartbeat) listening at ${config.DEFAULT_ORIGIN}/workflows/${config.WORKFLOW_ID}\n`,
    );
  });
} else {
  const modules = {
    reset: "./reset-h1.mjs",
    setup: "./setup-h1.mjs",
    trigger: "./trigger-h1-event.mjs",
    replay: "./replay-last-event.mjs",
  };
  await import(modules[action]);
}

function loadOrCreateSecrets() {
  if (fs.existsSync(secretPath)) {
    const stat = fs.statSync(secretPath);
    if ((stat.mode & 0o077) !== 0) {
      throw new Error("H1 runtime secret file permissions are too broad");
    }
    const parsed = JSON.parse(fs.readFileSync(secretPath, "utf8"));
    requireSecretRecord(parsed);
    return parsed;
  }
  const created = {
    receiver_client_token: randomSecret(),
    delivery_ticket_secret: randomSecret(),
    effect_receipt_secret: randomSecret(),
  };
  fs.writeFileSync(secretPath, `${JSON.stringify(created)}\n`, {
    encoding: "utf8",
    mode: 0o600,
    flag: "wx",
  });
  return created;
}

function randomSecret() {
  return randomBytes(32).toString("base64url");
}

function requireSecretRecord(value) {
  const fields = ["delivery_ticket_secret", "effect_receipt_secret", "receiver_client_token"];
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).sort().join(",") !== fields.sort().join(",") ||
    fields.some((field) => typeof value[field] !== "string" || value[field].length < 32)
  ) {
    throw new Error("H1 runtime secret file does not match the strict contract");
  }
}
