import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const modulePath = fileURLToPath(import.meta.url);
const expectedPromptForbiddenKeys = [
  "absolute_url",
  "event_id",
  "grant_id",
  "inbox_bearer",
  "opaque_binding",
  "receipt_field_name",
  "site_tool_name",
  "workflow_id",
];
const expectedExactReceiptMatchKeys = [
  "authorized_event_type",
  "canonical_url",
  "receiver_inbox_url",
  "workflow_id",
];

export function validateAutomationObservationHistory({
  entries,
  expectedAutomationIdSha256,
  expectedTargetThreadSha256,
  expectedPromptSha256,
  expectedArmCount,
}) {
  if (
    !isSha256(expectedAutomationIdSha256) ||
    !isSha256(expectedTargetThreadSha256) ||
    !isSha256(expectedPromptSha256) ||
    !Number.isInteger(expectedArmCount) ||
    expectedArmCount < 1 ||
    expectedArmCount > 3
  ) {
    throw new Error("The D4/H2b expected automation history contract is invalid");
  }
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error("The D4/H2b observer history is empty or invalid");
  }

  let observerStartCount = 0;
  let stateSnapshotCount = 0;
  let armStartedCount = 0;
  let armClosedCount = 0;
  let armActive = false;
  let previousObservedAt = Number.NEGATIVE_INFINITY;

  for (const entry of entries) {
    if (
      !entry ||
      typeof entry !== "object" ||
      Array.isArray(entry) ||
      typeof entry.event !== "string"
    ) {
      throw new Error("The D4/H2b observer history contains an invalid entry");
    }
    const observedAt = Date.parse(entry.observed_at);
    if (!Number.isFinite(observedAt) || observedAt < previousObservedAt) {
      throw new Error("The D4/H2b observer history timestamps are invalid");
    }
    previousObservedAt = observedAt;

    if (entry.event === "observer_started") {
      observerStartCount += 1;
      validateAutomationSnapshot(entry.details?.automation_preflight, {
        expectedAutomationIdSha256,
        expectedTargetThreadSha256,
        expectedPromptSha256,
      });
      continue;
    }

    if (entry.event === "automation_state_change") {
      stateSnapshotCount += 1;
      if (entry.details?.present === false) {
        throw new Error("The D4/H2b automation disappeared during observed history");
      }
      validateAutomationSnapshot(entry.details, {
        expectedAutomationIdSha256,
        expectedTargetThreadSha256,
        expectedPromptSha256,
      });
      continue;
    }

    if (entry.event === "automation_arm_started") {
      if (armActive) {
        throw new Error("The D4/H2b observer history contains overlapping automation arms");
      }
      armStartedCount += 1;
      armActive = true;
      if (
        entry.details?.initial_preflight_valid !== true ||
        entry.details?.configuration_matches_database !== true ||
        entry.details?.initial_next_run_was_future !== true
      ) {
        throw new Error("The D4/H2b automation arm started without a valid contract");
      }
      continue;
    }

    if (entry.event === "automation_arm_closed") {
      if (!armActive) {
        throw new Error("The D4/H2b observer history closed an unknown automation arm");
      }
      armClosedCount += 1;
      armActive = false;
      if (
        entry.details?.automation_contract_violation_count !== 0 ||
        entry.details?.observer_error_count !== 0 ||
        entry.details?.observer_polling_gap_count !== 0 ||
        entry.details?.process_contamination_violation_count !== 0 ||
        entry.details?.process_contamination_preserved !== true ||
        entry.details?.desktop_runtime_multiplicity_violation_count !== 0 ||
        entry.details?.desktop_runtime_multiplicity_preserved !== true ||
        entry.details?.configuration_matches_database !== true ||
        entry.details?.private_automation_contract_matches !== true ||
        entry.details?.pass_candidate !== true
      ) {
        throw new Error("The D4/H2b closed automation arm contains invalid history");
      }
      continue;
    }

    if (
      entry.event === "automation_arm_contract_violation" ||
      entry.event === "observer_error" ||
      entry.event === "observer_polling_gap" ||
      entry.event === "automation_arm_observer_polling_gap" ||
      entry.event === "observer_process_contamination_latched" ||
      entry.event === "desktop_closure_rejected_process_contamination" ||
      entry.event === "observer_desktop_runtime_multiplicity_latched"
    ) {
      throw new Error("The D4/H2b observer history contains a fail-closed event");
    }
  }

  if (
    entries[0]?.event !== "observer_started" ||
    observerStartCount !== 1 ||
    stateSnapshotCount === 0 ||
    armStartedCount !== expectedArmCount ||
    armClosedCount !== expectedArmCount ||
    armActive
  ) {
    throw new Error("The D4/H2b observer history is incomplete");
  }

  return {
    observer_start_count: observerStartCount,
    state_snapshot_count: stateSnapshotCount,
    arm_started_count: armStartedCount,
    arm_closed_count: armClosedCount,
  };
}

export function validateCurrentAutomationRow({
  automation,
  expectedPrompt,
  expectedTargetThreadId,
}) {
  if (!automation) {
    throw new Error("The D4/H2b current automation row is missing");
  }
  if (
    typeof automation.prompt !== "string" ||
    automation.prompt.length === 0 ||
    typeof automation.target_thread_id !== "string" ||
    automation.target_thread_id.length === 0 ||
    automation.kind !== "heartbeat" ||
    automation.status !== "PAUSED" ||
    automation.next_run_at !== null
  ) {
    throw new Error("The D4/H2b current automation row is not safely paused");
  }
  if (
    automation.prompt !== expectedPrompt ||
    automation.target_thread_id !== expectedTargetThreadId
  ) {
    throw new Error("The D4/H2b current automation drifted from the pinned private contract");
  }
}

function validateAutomationSnapshot(snapshot, {
  expectedAutomationIdSha256,
  expectedTargetThreadSha256,
  expectedPromptSha256,
}) {
  const forbiddenFlags = snapshot?.prompt_audit?.forbidden;
  const receiptMatchFlags = snapshot?.prompt_audit?.exact_receipt_value_matches;
  if (
    snapshot?.present !== true ||
    snapshot.automation_id_sha256 !== expectedAutomationIdSha256 ||
    snapshot.target_thread_sha256 !== expectedTargetThreadSha256 ||
    snapshot.prompt_audit?.sha256 !== expectedPromptSha256 ||
    snapshot.prompt_audit?.forbidden_count !== 0 ||
    !exactFalseFlagMap(forbiddenFlags, expectedPromptForbiddenKeys) ||
    !exactFalseFlagMap(receiptMatchFlags, expectedExactReceiptMatchKeys) ||
    snapshot.kind !== "heartbeat" ||
    snapshot.other_active_count !== 0 ||
    snapshot.configuration_matches_database !== true
  ) {
    throw new Error("The D4/H2b observer recorded automation contract drift");
  }
}

function exactFalseFlagMap(value, expectedKeys) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).sort().join("\0") === [...expectedKeys].sort().join("\0") &&
    Object.values(value).every((flag) => flag === false),
  );
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

const isMain = Boolean(process.argv[1]) && path.resolve(process.argv[1]) === modulePath;

if (isMain) {
try {
const scriptsDirectory = path.dirname(modulePath);
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
const expectedArmCount = Number.parseInt(
  process.env.WEBMCP_D4_EXPECTED_ARM_COUNT ?? "",
  10,
);

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
if (!Number.isInteger(expectedArmCount) || expectedArmCount < 1 || expectedArmCount > 3) {
  throw new Error("WEBMCP_D4_EXPECTED_ARM_COUNT must be an integer from 1 to 3");
}

const runtimeDirectory = path.join(mvpRoot, "var", "d4-h2b", runId);
const receiverDatabasePath = path.join(runtimeDirectory, "runtime.sqlite");
const receiptPath = path.join(runtimeDirectory, "bounded-receipt.json");
const secretsPath = path.join(runtimeDirectory, "runtime-secrets.json");
const observerPath = path.join(runtimeDirectory, "observer.jsonl");
const privateAutomationContractPath = path.join(
  runtimeDirectory,
  "private-automation-contract.json",
);
for (const privatePath of [
  receiverDatabasePath,
  receiptPath,
  secretsPath,
  observerPath,
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

const observerEntries = fs.readFileSync(observerPath, "utf8").split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));
const observerStart = observerEntries.find((entry) => entry.event === "observer_started");
const observerAutomation = observerStart?.details?.automation_preflight;
if (
  observerAutomation?.present !== true ||
  observerAutomation.configuration_matches_database !== true ||
  observerAutomation.automation_id_sha256 !== digest(automationId) ||
  observerAutomation.target_thread_sha256 !== privateAutomationContract.target_thread_sha256 ||
  observerAutomation.prompt_audit?.sha256 !== privateAutomationContract.prompt_sha256 ||
  observerAutomation.prompt_audit?.forbidden_count !== 0
) {
  throw new Error("The D4/H2b observer did not freeze the expected automation contract");
}
const automationHistory = validateAutomationObservationHistory({
  entries: observerEntries,
  expectedAutomationIdSha256: digest(automationId),
  expectedTargetThreadSha256: privateAutomationContract.target_thread_sha256,
  expectedPromptSha256: privateAutomationContract.prompt_sha256,
  expectedArmCount,
});

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
    SELECT prompt, target_thread_id, kind, status, next_run_at
    FROM automations WHERE id = ?
  `).get(automationId);
  validateCurrentAutomationRow({
    automation,
    expectedPrompt: privateAutomationContract.prompt,
    expectedTargetThreadId: privateAutomationContract.target_thread_id,
  });
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
  automation_row_present: true,
  automation_observation_history_validated: true,
  automation_observation_snapshot_count: automationHistory.state_snapshot_count,
  expected_automation_arm_count: expectedArmCount,
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
} catch {
  process.stderr.write(`${JSON.stringify({ safe: false })}\n`);
  process.exitCode = 1;
}
}
