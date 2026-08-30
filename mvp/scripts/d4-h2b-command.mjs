import fs from "node:fs";
import path from "node:path";
import { createHash, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const mvpRoot = path.resolve(scriptsDirectory, "..");
const action = process.argv[2];
const runId = process.env.WEBMCP_D4_RUN_ID;
const port = Number.parseInt(process.env.WEBMCP_D4_PORT ?? "4322", 10);

if (!["start", "setup", "trigger", "replay", "inspect"].includes(action)) {
  throw new Error("D4/H2b command must be start, setup, trigger, replay, or inspect");
}
if (!runId || !/^[a-z0-9][a-z0-9-]{6,46}[a-z0-9]$/.test(runId)) {
  throw new Error("WEBMCP_D4_RUN_ID must be a lowercase alphanumeric slug of 8-48 characters");
}
if (!Number.isInteger(port) || port < 1024 || port > 65535 || [4317, 4321].includes(port)) {
  throw new Error("WEBMCP_D4_PORT must be an unused non-reserved port other than 4317 or 4321");
}

const runtimeDirectory = path.join(mvpRoot, "var", "d4-h2b", runId);
const databasePath = path.join(runtimeDirectory, "runtime.sqlite");
const tracePath = path.join(runtimeDirectory, "runtime-trace.jsonl");
const secretPath = path.join(runtimeDirectory, "runtime-secrets.json");
const receiptPath = path.join(runtimeDirectory, "bounded-receipt.json");

if (["setup", "trigger", "replay"].includes(action)) {
  verifyExternalReceiverOwnership();
}

if (action !== "inspect") {
  fs.mkdirSync(runtimeDirectory, { recursive: true, mode: 0o700 });
  const secrets = loadOrCreateSecrets(secretPath);
  process.env.WEBMCP_MVP_DELIVERY = "heartbeat";
  process.env.WEBMCP_MVP_PORT = String(port);
  process.env.WEBMCP_MVP_DATABASE = databasePath;
  process.env.WEBMCP_MVP_TRACE = tracePath;
  process.env.WEBMCP_P0_RECEIVER_CLIENT_TOKEN = secrets.receiver_client_token;
  process.env.WEBMCP_H1_DELIVERY_TICKET_SECRET = secrets.delivery_ticket_secret;
  process.env.WEBMCP_H1_EFFECT_RECEIPT_SECRET = secrets.effect_receipt_secret;
  process.env.WEBMCP_D4_RECEIPT_PATH = receiptPath;
}

if (action === "start") {
  const [{ createRuntime, createHttpServer }, config] = await Promise.all([
    import("../src/server.mjs"),
    import("../src/config.mjs"),
  ]);
  const runtime = createRuntime({
    allowH1TestPaths: true,
    adapterMode: "fixture",
    durableEnrollmentEnabled: false,
  });
  if (runtime.adapter.name !== "fixture-adapter" || runtime.durableEnrollmentEnabled) {
    runtime.database.close();
    throw new Error("D4/H2b Receiver did not start on the strict synthetic fixture boundary");
  }
  const server = createHttpServer(runtime);
  server.listen(config.DEFAULT_PORT, config.DEFAULT_HOST, () => {
    process.stdout.write(
      `WebMCP fixture (D4/H2b ${runId}) listening at ${config.DEFAULT_ORIGIN}/workflows/${config.WORKFLOW_ID}\n`,
    );
  });
} else if (action === "inspect") {
  if (!fs.existsSync(databasePath)) throw new Error("D4/H2b runtime database does not exist");
  const { DatabaseSync } = await import("node:sqlite");
  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    database.exec("BEGIN DEFERRED");
    const workflow = database.prepare(`
      SELECT state, state_version, artifact_content, artifact_revision, committed, updated_at
      FROM workflows WHERE workflow_id = 'WF-001'
    `).get();
    if (!workflow) throw new Error("D4/H2b workflow is missing");
    const snapshot = {
      run_id: runId,
      origin: `http://127.0.0.1:${port}`,
      workflow: {
        state: workflow.state,
        state_version: workflow.state_version,
        artifact_revision: workflow.artifact_revision,
        artifact_sha256: createHash("sha256").update(workflow.artifact_content).digest("hex"),
        committed: Boolean(workflow.committed),
        updated_at: workflow.updated_at,
      },
      counts: {
        manifests: count(database, "manifests"),
        grants: count(database, "grants"),
        inboxes: count(database, "heartbeat_inboxes"),
        events: count(database, "events"),
        runs: count(database, "runs"),
        deliveries: count(database, "heartbeat_deliveries"),
        effects: count(database, "workflow_effects"),
      },
      statuses: {
        grants: groupedStatuses(database, "grants"),
        events: groupedStatuses(database, "events"),
        runs: groupedStatuses(database, "runs"),
        deliveries: groupedStatuses(database, "heartbeat_deliveries"),
      },
      trace_entries: fs.existsSync(tracePath)
        ? fs.readFileSync(tracePath, "utf8").split("\n").filter(Boolean).length
        : 0,
      redaction: {
        raw_task_identity_included: false,
        inbox_bearer_included: false,
        opaque_binding_included: false,
        signing_secret_included: false,
      },
    };
    database.exec("COMMIT");
    process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
  } catch (error) {
    try {
      database.exec("ROLLBACK");
    } catch {
      // The failure may have occurred before the read transaction began.
    }
    throw error;
  } finally {
    database.close();
  }
} else {
  const modules = {
    setup: "./d4-h2b-setup.mjs",
    trigger: "./trigger-h1-event.mjs",
    replay: "./replay-last-event.mjs",
  };
  await import(modules[action]);
}

function count(database, table) {
  return database.prepare(`SELECT count(*) AS count FROM ${table}`).get().count;
}

function groupedStatuses(database, table) {
  return Object.fromEntries(
    database.prepare(`SELECT status, count(*) AS count FROM ${table} GROUP BY status`).all()
      .map((row) => [row.status, row.count]),
  );
}

function loadOrCreateSecrets(targetPath) {
  if (fs.existsSync(targetPath)) {
    const stat = fs.statSync(targetPath);
    if ((stat.mode & 0o077) !== 0) {
      throw new Error("D4/H2b runtime secret file permissions are too broad");
    }
    const parsed = JSON.parse(fs.readFileSync(targetPath, "utf8"));
    requireSecretRecord(parsed);
    return parsed;
  }
  const created = {
    receiver_client_token: randomSecret(),
    delivery_ticket_secret: randomSecret(),
    effect_receipt_secret: randomSecret(),
  };
  fs.writeFileSync(targetPath, `${JSON.stringify(created)}\n`, {
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
    throw new Error("D4/H2b runtime secret file does not match the strict contract");
  }
}

function verifyExternalReceiverOwnership() {
  const label = `com.openai.webmcp.d4h2b.receiver.${runId}`;
  const domain = `gui/${process.getuid()}`;
  let service;
  try {
    service = execFileSync("/bin/launchctl", ["print", `${domain}/${label}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    throw new Error("D4/H2b Receiver must be owned by the expected launchd service");
  }
  const pid = Number.parseInt(service.match(/^\s*pid\s*=\s*(\d+)\s*$/m)?.[1] ?? "", 10);
  if (!Number.isInteger(pid) || pid <= 1 || !/^\s*state\s*=\s*running\s*$/m.test(service)) {
    throw new Error("D4/H2b Receiver launchd service is not running");
  }
  const listeners = execFileSync("/usr/sbin/lsof", [
    "-nP",
    `-iTCP:${port}`,
    "-sTCP:LISTEN",
    "-Fp",
  ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const listeningPids = [...listeners.matchAll(/^p(\d+)$/gm)].map((match) => Number(match[1]));
  if (listeningPids.length !== 1 || listeningPids[0] !== pid) {
    throw new Error("D4/H2b Receiver launchd process does not exclusively own the configured port");
  }
}
