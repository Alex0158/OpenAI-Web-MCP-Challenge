import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const mvpRoot = path.resolve(scriptsDirectory, "..");
const runId = process.env.WEBMCP_D4_RUN_ID;
const port = Number.parseInt(process.env.WEBMCP_D4_PORT ?? "4322", 10);
const automationPath = process.env.WEBMCP_D4_AUTOMATION_FILE
  ? path.resolve(process.env.WEBMCP_D4_AUTOMATION_FILE)
  : null;
const automationDatabasePath = path.join(os.homedir(), ".codex", "sqlite", "codex-dev.db");
const codexStateDatabasePath = path.join(os.homedir(), ".codex", "state_5.sqlite");

if (!runId || !/^[a-z0-9][a-z0-9-]{6,46}[a-z0-9]$/.test(runId)) {
  throw new Error("WEBMCP_D4_RUN_ID must be a lowercase alphanumeric slug of 8-48 characters");
}
if (!Number.isInteger(port) || port < 1024 || port > 65535 || [4317, 4321].includes(port)) {
  throw new Error("WEBMCP_D4_PORT must be an unused non-reserved port other than 4317 or 4321");
}
if (!automationPath || !fs.existsSync(automationPath)) {
  throw new Error("WEBMCP_D4_AUTOMATION_FILE must resolve to the paused D4 automation TOML");
}
if (!fs.existsSync(automationDatabasePath)) {
  throw new Error("The current-build Codex automation database was not found");
}
if (!fs.existsSync(codexStateDatabasePath)) {
  throw new Error("The current-build Codex task database was not found");
}

const automationSource = fs.readFileSync(automationPath, "utf8");
const automationId = automationSource.match(/^id\s*=\s*"([^"]+)"\s*$/m)?.[1];
const automationStatus = automationSource.match(/^status\s*=\s*"([^"]+)"\s*$/m)?.[1];
if (!automationId || !/^[a-z0-9][a-z0-9-]{1,79}$/.test(automationId)) {
  throw new Error("The D4 automation file has no valid bounded automation ID");
}
if (automationStatus !== "PAUSED") {
  throw new Error("The D4 automation must be paused while launchd fixtures are prepared");
}

const automationDatabase = new DatabaseSync(automationDatabasePath, { readOnly: true });
let privateAutomation;
try {
  automationDatabase.exec("BEGIN DEFERRED");
  const row = automationDatabase.prepare(`
    SELECT id, prompt, status, target_thread_id, kind
    FROM automations WHERE id = ?
  `).get(automationId);
  const otherActiveCount = automationDatabase.prepare(`
    SELECT count(*) AS count FROM automations WHERE id <> ? AND status = 'ACTIVE'
  `).get(automationId).count;
  automationDatabase.exec("COMMIT");
  if (
    !row ||
    row.id !== automationId ||
    row.status !== "PAUSED" ||
    row.kind !== "heartbeat" ||
    typeof row.prompt !== "string" ||
    row.prompt.length === 0 ||
    typeof row.target_thread_id !== "string" ||
    row.target_thread_id.length === 0 ||
    otherActiveCount !== 0 ||
    auditTriggerOnlyPrompt(row.prompt) !== 0
  ) {
    throw new Error("The D4 automation does not match the paused private heartbeat contract");
  }
  privateAutomation = {
    automationId: row.id,
    prompt: row.prompt,
    targetThreadId: row.target_thread_id,
    promptSha256: createDigest(row.prompt),
    targetThreadSha256: createDigest(row.target_thread_id),
  };
} catch (error) {
  try {
    automationDatabase.exec("ROLLBACK");
  } catch {
    // The failure may have occurred after the read transaction committed.
  }
  throw error;
} finally {
  automationDatabase.close();
}

const codexStateDatabase = new DatabaseSync(codexStateDatabasePath, { readOnly: true });
try {
  const target = codexStateDatabase.prepare(`
    SELECT rollout_path FROM threads WHERE id = ?
  `).get(privateAutomation.targetThreadId);
  if (
    typeof target?.rollout_path !== "string" ||
    !path.isAbsolute(target.rollout_path) ||
    !fs.existsSync(target.rollout_path)
  ) {
    throw new Error("The D4 target task rollout mapping is unavailable");
  }
  privateAutomation.targetRolloutPath = target.rollout_path;
  privateAutomation.targetRolloutPathSha256 = createDigest(target.rollout_path);
} finally {
  codexStateDatabase.close();
}

const runtimeDirectory = path.join(mvpRoot, "var", "d4-h2b", runId);
const privateAutomationContractPath = path.join(
  runtimeDirectory,
  "private-automation-contract.json",
);
const receiverPlistPath = path.join(runtimeDirectory, "receiver.launchd.plist");
const observerPlistPath = path.join(runtimeDirectory, "observer.launchd.plist");
const noEventRelaunchPlistPath = path.join(runtimeDirectory, "relaunch-no-event.launchd.plist");
const eventRelaunchPlistPath = path.join(runtimeDirectory, "relaunch-event.launchd.plist");
const receiverLabel = `com.openai.webmcp.d4h2b.receiver.${runId}`;
const observerLabel = `com.openai.webmcp.d4h2b.observer.${runId}`;
const noEventRelaunchLabel = `com.openai.webmcp.d4h2b.relaunch.noevent.${runId}`;
const eventRelaunchLabel = `com.openai.webmcp.d4h2b.relaunch.event.${runId}`;

fs.mkdirSync(runtimeDirectory, { recursive: true, mode: 0o700 });
for (const target of [
  privateAutomationContractPath,
  receiverPlistPath,
  observerPlistPath,
  noEventRelaunchPlistPath,
  eventRelaunchPlistPath,
]) {
  if (fs.existsSync(target)) {
    throw new Error(`Private D4 artifact already exists: ${path.basename(target)}`);
  }
}
fs.writeFileSync(privateAutomationContractPath, `${JSON.stringify({
  automation_id: privateAutomation.automationId,
  prompt: privateAutomation.prompt,
  target_thread_id: privateAutomation.targetThreadId,
  target_rollout_path: privateAutomation.targetRolloutPath,
  prompt_sha256: privateAutomation.promptSha256,
  target_thread_sha256: privateAutomation.targetThreadSha256,
  target_rollout_path_sha256: privateAutomation.targetRolloutPathSha256,
})}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });

const commonEnvironment = {
  WEBMCP_D4_RUN_ID: runId,
  WEBMCP_D4_PORT: String(port),
};
const automationEnvironment = {
  ...commonEnvironment,
  WEBMCP_D4_AUTOMATION_FILE: automationPath,
  WEBMCP_D4_AUTOMATION_DATABASE: automationDatabasePath,
  WEBMCP_D4_AUTOMATION_ID: automationId,
  WEBMCP_D4_EXPECTED_PROMPT_SHA256: privateAutomation.promptSha256,
  WEBMCP_D4_EXPECTED_TARGET_SHA256: privateAutomation.targetThreadSha256,
  WEBMCP_D4_EXPECTED_ROLLOUT_PATH_SHA256:
    privateAutomation.targetRolloutPathSha256,
};
writePlist(receiverPlistPath, {
  label: receiverLabel,
  args: [process.execPath, path.join(scriptsDirectory, "d4-h2b-command.mjs"), "start"],
  environment: commonEnvironment,
  keepAlive: true,
  stdoutPath: path.join(runtimeDirectory, "receiver.stdout.log"),
  stderrPath: path.join(runtimeDirectory, "receiver.stderr.log"),
});
writePlist(observerPlistPath, {
  label: observerLabel,
  args: [process.execPath, path.join(scriptsDirectory, "d4-h2b-observer.mjs")],
  environment: {
    ...automationEnvironment,
  },
  keepAlive: false,
  stdoutPath: path.join(runtimeDirectory, "observer.stdout.log"),
  stderrPath: path.join(runtimeDirectory, "observer.stderr.log"),
});
writePlist(noEventRelaunchPlistPath, {
  label: noEventRelaunchLabel,
  args: [process.execPath, path.join(scriptsDirectory, "d4-h2b-relaunch-helper.mjs")],
  environment: {
    ...automationEnvironment,
    WEBMCP_D4_RESTART_CYCLE: "1",
    WEBMCP_D4_EVENT_ARM: "false",
  },
  keepAlive: false,
  stdoutPath: path.join(runtimeDirectory, "relaunch-no-event.stdout.log"),
  stderrPath: path.join(runtimeDirectory, "relaunch-no-event.stderr.log"),
});
writePlist(eventRelaunchPlistPath, {
  label: eventRelaunchLabel,
  args: [process.execPath, path.join(scriptsDirectory, "d4-h2b-relaunch-helper.mjs")],
  environment: {
    ...automationEnvironment,
    WEBMCP_D4_RESTART_CYCLE: "2",
    WEBMCP_D4_EVENT_ARM: "true",
  },
  keepAlive: false,
  stdoutPath: path.join(runtimeDirectory, "relaunch-event.stdout.log"),
  stderrPath: path.join(runtimeDirectory, "relaunch-event.stderr.log"),
});

process.stdout.write(`${JSON.stringify({
  prepared: true,
  run_id: runId,
  receiver: { label: receiverLabel, plist: receiverPlistPath },
  observer: { label: observerLabel, plist: observerPlistPath },
  relaunch_helpers: [
    { arm: "no_event", label: noEventRelaunchLabel, plist: noEventRelaunchPlistPath },
    { arm: "event", label: eventRelaunchLabel, plist: eventRelaunchPlistPath },
  ],
  launch_domain: `gui/${process.getuid()}`,
  node_executable: process.execPath,
  automation_prompt_included: false,
  automation_id_sha256: createDigest(automationId),
  automation_prompt_sha256: privateAutomation.promptSha256,
  target_thread_sha256: privateAutomation.targetThreadSha256,
  target_rollout_path_sha256: privateAutomation.targetRolloutPathSha256,
  private_automation_contract_stored: true,
  task_identity_included: false,
  receipt_included: false,
}, null, 2)}\n`);

function writePlist(targetPath, {
  label,
  args,
  environment,
  keepAlive,
  stdoutPath,
  stderrPath,
}) {
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${xml(label)}</string>
  <key>ProgramArguments</key>
  <array>
${args.map((value) => `    <string>${xml(value)}</string>`).join("\n")}
  </array>
  <key>EnvironmentVariables</key>
  <dict>
${Object.entries(environment).map(([key, value]) => `    <key>${xml(key)}</key>\n    <string>${xml(value)}</string>`).join("\n")}
  </dict>
  <key>WorkingDirectory</key>
  <string>${xml(mvpRoot)}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <${keepAlive ? "true" : "false"}/>
  <key>ProcessType</key>
  <string>Background</string>
  <key>StandardOutPath</key>
  <string>${xml(stdoutPath)}</string>
  <key>StandardErrorPath</key>
  <string>${xml(stderrPath)}</string>
</dict>
</plist>
`;
  fs.writeFileSync(targetPath, plist, { encoding: "utf8", mode: 0o600, flag: "wx" });
}

function xml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function createDigest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function auditTriggerOnlyPrompt(source) {
  return [
    /\bWF-[A-Za-z0-9_-]+\b/.test(source),
    /\bhttps?:\/\//i.test(source),
    /\b(?:register_reentry_binding|get_pending_reentry_event|get_workflow_context|continue_artifact|acknowledge_reentry_effect)\b/i
      .test(source),
    /\b(?:evt|gr|ab_opaque)_[A-Za-z0-9_-]+\b/.test(source),
    /\/receiver\/inboxes\/[A-Za-z0-9_-]+/i.test(source),
    /\b(?:receiver_inbox_url|canonical_url|workflow_id|authorized_event_type)\b/i.test(source),
  ].filter(Boolean).length;
}
