import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const mvpRoot = path.resolve(scriptsDirectory, "..");
const repositoryRoot = path.resolve(mvpRoot, "..");
const runId = process.env.WEBMCP_D4_RUN_ID;
const derivativePath = process.env.WEBMCP_D4_DERIVATIVE
  ? path.resolve(process.env.WEBMCP_D4_DERIVATIVE)
  : null;
const automationDatabasePath = process.env.WEBMCP_D4_AUTOMATION_DATABASE
  ? path.resolve(process.env.WEBMCP_D4_AUTOMATION_DATABASE)
  : null;
const automationId = process.env.WEBMCP_D4_AUTOMATION_ID;

if (!runId || !/^[a-z0-9][a-z0-9-]{6,46}[a-z0-9]$/.test(runId)) {
  throw new Error("WEBMCP_D4_RUN_ID must be a lowercase alphanumeric slug of 8-48 characters");
}
if (!derivativePath || !fs.existsSync(derivativePath)) {
  throw new Error("WEBMCP_D4_DERIVATIVE must identify the candidate public evidence file");
}
const relativeDerivative = path.relative(repositoryRoot, derivativePath);
if (
  relativeDerivative.startsWith("..") ||
  path.isAbsolute(relativeDerivative) ||
  relativeDerivative.startsWith(path.join("mvp", "var") + path.sep)
) {
  throw new Error("The D4/H2b public derivative must be inside the repository and outside mvp/var");
}
if (!automationDatabasePath || !fs.existsSync(automationDatabasePath) || !automationId) {
  throw new Error("The D4/H2b evidence scan requires the private automation database and ID");
}

const runtimeDirectory = path.join(mvpRoot, "var", "d4-h2b", runId);
const receiverDatabasePath = path.join(runtimeDirectory, "runtime.sqlite");
const receiptPath = path.join(runtimeDirectory, "bounded-receipt.json");
const secretsPath = path.join(runtimeDirectory, "runtime-secrets.json");
const privateAutomationContractPath = path.join(
  runtimeDirectory,
  "private-automation-contract.json",
);
for (const privatePath of [
  receiverDatabasePath,
  receiptPath,
  secretsPath,
  privateAutomationContractPath,
]) {
  if (!fs.existsSync(privatePath)) throw new Error("D4/H2b private evidence set is incomplete");
}
if ((fs.statSync(privateAutomationContractPath).mode & 0o077) !== 0) {
  throw new Error("The D4/H2b private automation contract permissions are too broad");
}

const privateAutomationContract = JSON.parse(
  fs.readFileSync(privateAutomationContractPath, "utf8"),
);
const expectedContractKeys = [
  "automation_id",
  "prompt",
  "prompt_sha256",
  "target_rollout_path",
  "target_rollout_path_sha256",
  "target_thread_id",
  "target_thread_sha256",
].sort();
if (
  !privateAutomationContract ||
  typeof privateAutomationContract !== "object" ||
  Array.isArray(privateAutomationContract) ||
  Object.keys(privateAutomationContract).sort().join("\0") !== expectedContractKeys.join("\0") ||
  privateAutomationContract.automation_id !== automationId ||
  typeof privateAutomationContract.prompt !== "string" ||
  typeof privateAutomationContract.target_thread_id !== "string" ||
  typeof privateAutomationContract.target_rollout_path !== "string" ||
  !path.isAbsolute(privateAutomationContract.target_rollout_path) ||
  digest(privateAutomationContract.prompt) !== privateAutomationContract.prompt_sha256 ||
  digest(privateAutomationContract.target_thread_id) !==
    privateAutomationContract.target_thread_sha256 ||
  digest(privateAutomationContract.target_rollout_path) !==
    privateAutomationContract.target_rollout_path_sha256
) {
  throw new Error("The D4/H2b pinned private automation contract is invalid");
}

const sensitiveValues = new Set();
const sensitiveClasses = new Set();
const receipt = JSON.parse(fs.readFileSync(receiptPath, "utf8"));
const secrets = JSON.parse(fs.readFileSync(secretsPath, "utf8"));
addSensitive(runId, "experiment_run_id");
addSensitive(privateAutomationContract.automation_id, "automation_id");
addSensitive(privateAutomationContract.prompt, "automation_prompt");
addSensitive(privateAutomationContract.target_thread_id, "target_task_id");
addSensitive(privateAutomationContract.target_rollout_path, "target_rollout_path");
addSensitive(privateAutomationContractPath, "private_contract_path");
for (const value of Object.values(receipt)) addSensitive(value, "bounded_receipt");
addSensitive(decodeURIComponent(
  new URL(receipt.receiver_inbox_url).pathname.split("/").at(-1),
), "inbox_bearer");
for (const value of Object.values(secrets)) addSensitive(value, "runtime_secret");

const automationDatabase = new DatabaseSync(automationDatabasePath, { readOnly: true });
try {
  const automation = automationDatabase.prepare(`
    SELECT prompt, target_thread_id FROM automations WHERE id = ?
  `).get(automationId);
  if (
    typeof automation?.prompt !== "string" ||
    automation.prompt.length === 0 ||
    typeof automation?.target_thread_id !== "string" ||
    automation.target_thread_id.length === 0
  ) {
    throw new Error("D4/H2b automation prompt or target is missing");
  }
  if (
    automation.prompt !== privateAutomationContract.prompt ||
    automation.target_thread_id !== privateAutomationContract.target_thread_id
  ) {
    throw new Error("The D4/H2b current automation drifted from the pinned private contract");
  }
} finally {
  automationDatabase.close();
}

const codexStateDatabasePath = path.join(
  path.dirname(path.dirname(automationDatabasePath)),
  "state_5.sqlite",
);
if (!fs.existsSync(codexStateDatabasePath)) {
  throw new Error("The D4/H2b target rollout database is unavailable");
}
const codexStateDatabase = new DatabaseSync(codexStateDatabasePath, { readOnly: true });
try {
  const target = codexStateDatabase.prepare(`
    SELECT rollout_path FROM threads WHERE id = ?
  `).get(privateAutomationContract.target_thread_id);
  if (
    typeof target?.rollout_path !== "string" ||
    target.rollout_path !== privateAutomationContract.target_rollout_path
  ) {
    throw new Error("The D4/H2b target rollout mapping drifted from the pinned contract");
  }
} finally {
  codexStateDatabase.close();
}

for (const requiredClass of [
  "experiment_run_id",
  "automation_id",
  "bounded_receipt",
  "inbox_bearer",
  "runtime_secret",
  "automation_prompt",
  "target_task_id",
  "target_rollout_path",
  "private_contract_path",
]) {
  if (!sensitiveClasses.has(requiredClass)) {
    throw new Error("The D4/H2b evidence scanner private-class coverage is incomplete");
  }
}

const receiverDatabase = new DatabaseSync(receiverDatabasePath, { readOnly: true });
try {
  receiverDatabase.exec("BEGIN DEFERRED");
  collectRows(receiverDatabase, "manifests", [
    "manifest_id",
    "manifest_json",
  ]);
  collectRows(receiverDatabase, "grants", [
    "grant_id",
    "challenge_id",
    "correlation_id",
    "agent_binding",
    "canonical_url",
    "managed_context_id",
    "receipt_json",
  ]);
  collectRows(receiverDatabase, "binding_challenges", [
    "challenge_id",
    "manifest_id",
    "correlation_id",
    "managed_context_id",
  ]);
  collectRows(receiverDatabase, "context_captures", [
    "context_capture_id",
    "handle_digest",
    "correlation_id",
    "managed_context_id",
  ]);
  collectRows(receiverDatabase, "events", [
    "event_id",
    "grant_id",
    "raw_body",
    "response_json",
  ]);
  collectRows(receiverDatabase, "runs", [
    "run_id",
    "event_id",
    "grant_id",
    "managed_context_id",
    "adapter_result_json",
  ]);
  collectRows(receiverDatabase, "heartbeat_inboxes", [
    "inbox_id",
    "handle_digest",
    "grant_id",
  ]);
  collectRows(receiverDatabase, "heartbeat_deliveries", [
    "delivery_id",
    "event_id",
    "run_id",
    "inbox_id",
    "grant_id",
    "effect_receipt_digest",
  ]);
  collectRows(receiverDatabase, "workflow_effects", [
    "event_id",
    "request_hash",
    "effect_receipt",
    "result_json",
  ]);
  receiverDatabase.exec("COMMIT");
} catch (error) {
  try {
    receiverDatabase.exec("ROLLBACK");
  } catch {
    // The failure may have occurred before the read transaction began.
  }
  throw error;
} finally {
  receiverDatabase.close();
}

const candidate = fs.readFileSync(derivativePath, "utf8");
const exactForbiddenMatchCount = [...sensitiveValues]
  .filter((value) => candidate.includes(value)).length;
const patternDefinitions = {
  private_user_path: /\/Users\/[A-Za-z0-9._-]+\//,
  raw_task_uuid: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
  raw_runtime_identifier: /\b(?:gr|evt|run|del|inbox|corr|ab_opaque)_[A-Za-z0-9_-]+\b/,
  inbox_bearer_path: /\/receiver\/inboxes\/[A-Za-z0-9_-]+/i,
  standalone_inbox_bearer: /(?<![A-Za-z0-9_-])h1_inbox_[A-Za-z0-9_-]{32}(?![A-Za-z0-9_-])/,
  context_capture_bearer: /(?<![A-Za-z0-9_-])capture_[A-Za-z0-9_-]{32}(?![A-Za-z0-9_-])/,
  delivery_ticket: /\bh1d1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
  effect_receipt: /\bh1e1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
};
const patternCanaries = {
  private_user_path: "/Users/scanner-canary/private",
  raw_task_uuid: "11111111-2222-4333-8444-555555555555",
  raw_runtime_identifier: "evt_scanner_canary",
  inbox_bearer_path: "/receiver/inboxes/scanner_canary",
  standalone_inbox_bearer: `h1_inbox_${"a".repeat(32)}`,
  context_capture_bearer: `capture_${"b".repeat(32)}`,
  delivery_ticket: "h1d1.scanner.canary",
  effect_receipt: "h1e1.scanner.canary",
};
for (const [name, expression] of Object.entries(patternDefinitions)) {
  if (!expression.test(patternCanaries[name])) {
    throw new Error("The D4/H2b evidence scanner pattern canary failed closed");
  }
}
const patternChecks = Object.fromEntries(
  Object.entries(patternDefinitions).map(([name, expression]) => [name, expression.test(candidate)]),
);
const patternHitCount = Object.values(patternChecks).filter(Boolean).length;
const result = {
  safe: exactForbiddenMatchCount === 0 && patternHitCount === 0,
  exact_forbidden_match_count: exactForbiddenMatchCount,
  pattern_hit_count: patternHitCount,
  pattern_checks: patternChecks,
  sensitive_value_count_checked: sensitiveValues.size,
  sensitive_class_count_checked: sensitiveClasses.size,
  pattern_canary_count_checked: Object.keys(patternCanaries).length,
  candidate_bytes: Buffer.byteLength(candidate),
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!result.safe) process.exitCode = 1;

function collectRows(database, table, columns) {
  const available = new Set(database.prepare(`PRAGMA table_info(${table})`).all()
    .map((row) => row.name));
  const selected = columns.filter((column) => available.has(column));
  if (selected.length === 0) return;
  for (const row of database.prepare(`SELECT ${selected.join(", ")} FROM ${table}`).all()) {
    for (const [key, value] of Object.entries(row)) collectSensitiveValue(key, value);
  }
}

function collectSensitiveValue(key, value) {
  if (typeof value !== "string" || value.length === 0) return;
  if (key.endsWith("_json") || key === "raw_body") {
    try {
      collectSensitiveJson(JSON.parse(value));
    } catch {
      addSensitive(value);
    }
    return;
  }
  addSensitive(value);
}

function collectSensitiveJson(value, key = "") {
  if (Array.isArray(value)) {
    for (const child of value) collectSensitiveJson(child, key);
    return;
  }
  if (value && typeof value === "object") {
    for (const [childKey, child] of Object.entries(value)) collectSensitiveJson(child, childKey);
    return;
  }
  if (typeof value !== "string") return;
  if (
    /(?:id|url|binding|receipt|ticket|token|handle|secret|correlation)/i.test(key) ||
    looksSensitive(value)
  ) addSensitive(value);
}

function looksSensitive(value) {
  return (
    /^https?:\/\/127\.0\.0\.1:\d+\//.test(value) ||
    /\/receiver\/inboxes\//i.test(value) ||
    /^(?:h1d1|h1e1)\./.test(value) ||
    /^(?:gr|evt|run|del|inbox|corr|ab_opaque)_/.test(value) ||
    /^[A-Za-z0-9_-]{32,}$/.test(value)
  );
}

function addSensitive(value, sensitiveClass = null) {
  if (typeof value === "string" && value.length >= 8) {
    sensitiveValues.add(value);
    if (sensitiveClass) sensitiveClasses.add(sensitiveClass);
  }
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}
