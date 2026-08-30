import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import {
  chatGptCoreAppServerProcesses,
  chatGptLifecycleProcesses,
  chatGptMainProcesses,
  d4ContaminatingProcessSnapshot,
  desktopLifecycleSnapshot,
  extendTrackedLifecycleIdentities,
  lifecycleIdentityMap,
  sameProcessIdentity as sameIdentity,
} from "./d4-desktop-process-lifecycle.mjs";

const execFileAsync = promisify(execFile);
const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const mvpRoot = path.resolve(scriptsDirectory, "..");
const runId = process.env.WEBMCP_D4_RUN_ID;
const port = Number.parseInt(process.env.WEBMCP_D4_PORT ?? "", 10);

if (!runId || !/^[a-z0-9][a-z0-9-]{6,46}[a-z0-9]$/.test(runId)) {
  throw new Error("WEBMCP_D4_RUN_ID must be a lowercase alphanumeric slug of 8-48 characters");
}
if (!Number.isInteger(port) || port < 1024 || port > 65535 || [4317, 4321].includes(port)) {
  throw new Error("WEBMCP_D4_PORT must be an unused non-reserved port other than 4317 or 4321");
}

const runtimeDirectory = path.join(mvpRoot, "var", "d4-h2b", runId);
const databasePath = path.join(runtimeDirectory, "runtime.sqlite");
const tracePath = path.join(runtimeDirectory, "runtime-trace.jsonl");
const receiptPath = path.join(runtimeDirectory, "bounded-receipt.json");
const logPath = path.join(runtimeDirectory, "observer.jsonl");
const stopPath = path.join(runtimeDirectory, "stop-observer");
const automationPath = resolveRequiredPath("WEBMCP_D4_AUTOMATION_FILE");
const automationDatabasePath = resolveRequiredPath("WEBMCP_D4_AUTOMATION_DATABASE");
const codexStateDatabasePath = path.join(
  path.dirname(path.dirname(automationDatabasePath)),
  "state_5.sqlite",
);
const automationId = process.env.WEBMCP_D4_AUTOMATION_ID;
const expectedPromptSha256 = requireSha256Environment("WEBMCP_D4_EXPECTED_PROMPT_SHA256");
const expectedTargetSha256 = requireSha256Environment("WEBMCP_D4_EXPECTED_TARGET_SHA256");
const expectedRolloutPathSha256 = requireSha256Environment(
  "WEBMCP_D4_EXPECTED_ROLLOUT_PATH_SHA256",
);
const receiverLabel = `com.openai.webmcp.d4h2b.receiver.${runId}`;
const automationArmSettleTimeoutMs = 60_000;
const observerPollingGapThresholdMs = 2_000;

if (!automationId || !/^[a-z0-9][a-z0-9-]{1,79}$/.test(automationId)) {
  throw new Error("WEBMCP_D4_AUTOMATION_ID must identify the bounded D4 automation");
}
if (!fs.existsSync(runtimeDirectory) || !fs.existsSync(databasePath)) {
  throw new Error("D4/H2b observer requires an initialized isolated runtime");
}
if (fs.existsSync(logPath)) throw new Error("D4/H2b observer log already exists");
if (fs.existsSync(stopPath)) throw new Error("D4/H2b observer stop marker already exists");
const privateReceipt = readPrivateReceipt();

let priorProcessKey = null;
let priorDatabaseKey = null;
let priorAutomationKey = null;
let priorReceiverKey = null;
let priorHeartbeatTurnKey = null;
let automationArmSequence = 0;
let activeAutomationArm = null;
let pausedHeartbeatBaseline = null;
let pausedAutomationBaseline = null;
let heartbeatTurnScanCache = null;
let lastObserverPollStartedAt = null;
let processContaminationLatch = null;
let desktopRuntimeMultiplicityLatch = null;
let contaminatedClosureRejectionRecorded = false;
const observerErrors = [];

const appVersion = await chatGptVersion();
const startupProcesses = await processTable();
const ownAncestry = processAncestry(startupProcesses, process.pid);
const invalidAncestor = ownAncestry.find((row) => row.command.includes("/ChatGPT.app/Contents/"));
if (invalidAncestor) {
  record("observer_invalid_ancestry", {
    observer_pid: process.pid,
    observer_ppid: process.ppid,
    chatgpt_ancestor_detected: true,
  });
  throw new Error("D4/H2b observer must be launched outside the ChatGPT process tree");
}
if (process.ppid !== 1) {
  record("observer_invalid_parent", {
    observer_pid: process.pid,
    observer_ppid: process.ppid,
    launchd_parent_verified: false,
  });
  throw new Error("D4/H2b observer must be directly owned by launchd");
}

const contaminatingProcesses = d4ContaminatingProcessSnapshot(startupProcesses);
if (!contaminatingProcesses.clean) {
  record("observer_invalid_process_contamination", contaminatingProcesses);
  throw new Error("D4/H2b observer requires unrelated P0 relay infrastructure to be stopped");
}

const baselineProcesses = chatGptProcessSnapshot(startupProcesses);
if (
  baselineProcesses.main_processes.length !== 1 ||
  baselineProcesses.app_server_processes.length !== 1
) {
  record("observer_invalid_baseline", {
    chatgpt_main_process_count: baselineProcesses.main_processes.length,
    chatgpt_core_app_server_process_count:
      baselineProcesses.app_server_processes.length,
  });
  throw new Error(
    "D4/H2b observer requires exactly one Desktop main and core app-server at startup",
  );
}
const baselineMainIdentity = baselineProcesses.main_processes[0];
let trackedMainIdentity = baselineMainIdentity;
let trackedIdentities = lifecycleIdentityMap(chatGptLifecycleProcesses(startupProcesses));
let waitingForReplacement = false;
let restartCycle = 0;
let runtimeReadyCycle = 0;

const initialReceiver = await receiverLaunchdSnapshot(startupProcesses);
const listenerPreflight = await receiverListenerPreflight(initialReceiver.pid);
const initialReceiverEvidence = {
  ...initialReceiver,
  listener_preflight: listenerPreflight,
};
if (
  !initialReceiver.present ||
  initialReceiver.state !== "running" ||
  initialReceiver.ppid !== 1 ||
  !initialReceiver.command_matches ||
  initialReceiver.chatgpt_ancestor_detected ||
  !listenerPreflight.exclusive_expected_owner
) {
  record("observer_invalid_receiver", { ...initialReceiver, listener_preflight: listenerPreflight });
  throw new Error("D4/H2b Receiver must be the expected launchd-owned port owner");
}

const initialAutomation = safeAutomationSnapshot();
if (
  !initialAutomation.present ||
  initialAutomation.status !== "PAUSED" ||
  initialAutomation.kind !== "heartbeat" ||
  initialAutomation.other_active_count !== 0 ||
  initialAutomation.prompt_audit.forbidden_count !== 0 ||
  !initialAutomation.target_thread_sha256 ||
  initialAutomation.configuration_matches_database !== true ||
  !automationSnapshotMatchesPrivateContract(initialAutomation)
) {
  record("observer_invalid_automation", initialAutomation);
  throw new Error("D4/H2b automation preflight failed closed");
}
const privateAutomationContract = readPrivateAutomationContract();
if (
  createHash("sha256").update(privateAutomationContract.targetThreadId).digest("hex") !==
    expectedTargetSha256 ||
  createHash("sha256").update(privateAutomationContract.prompt).digest("hex") !==
    expectedPromptSha256
) {
  throw new Error("D4/H2b private automation contract changed during preflight");
}
const privateTargetRolloutPath = resolvePrivateTargetRolloutPath(
  privateAutomationContract.targetThreadId,
);
if (
  createHash("sha256").update(privateTargetRolloutPath).digest("hex") !==
    expectedRolloutPathSha256
) {
  throw new Error("D4/H2b target rollout changed after private contract preparation");
}
const experimentReceiverIdentity = {
  pid: initialReceiver.pid,
  started_at: initialReceiver.started_at,
};
const initialHeartbeatTurns = safeHeartbeatTurnSnapshot();
if (
  !initialHeartbeatTurns.present ||
  initialHeartbeatTurns.rollout_mapping_matches !== true ||
  initialHeartbeatTurns.json_parse_error_count !== 0
) {
  record("observer_invalid_heartbeat_turn_source", initialHeartbeatTurns);
  throw new Error("D4/H2b target task rollout preflight failed closed");
}
pausedHeartbeatBaseline = initialHeartbeatTurns;
pausedAutomationBaseline = initialAutomation;

record("observer_started", {
  observer_pid: process.pid,
  observer_ppid: process.ppid,
  launchd_parent_verified: true,
  chatgpt_ancestor_detected: false,
  database_present: true,
  baseline_main_process: baselineMainIdentity,
  baseline_lifecycle_process_count: trackedIdentities.size,
  process_contamination_preflight: contaminatingProcesses,
  app_version: appVersion,
  receiver_preflight: initialReceiverEvidence,
  automation_preflight: initialAutomation,
  heartbeat_turn_preflight: initialHeartbeatTurns,
});
priorProcessKey = JSON.stringify(baselineProcesses);
priorReceiverKey = JSON.stringify(initialReceiverEvidence);
priorHeartbeatTurnKey = JSON.stringify(initialHeartbeatTurns);
record("chatgpt_process_change", baselineProcesses);

while (!fs.existsSync(stopPath)) {
  const pollStartedAt = Date.now();
  if (lastObserverPollStartedAt !== null && activeAutomationArm) {
    const pollingGapMs = pollStartedAt - lastObserverPollStartedAt;
    activeAutomationArm.maxPollingGapMs = Math.max(
      activeAutomationArm.maxPollingGapMs,
      pollingGapMs,
    );
    if (pollingGapMs > observerPollingGapThresholdMs) {
      activeAutomationArm.observerPollingGapCount += 1;
      record("automation_arm_observer_polling_gap", {
        arm_sequence: activeAutomationArm.sequence,
        polling_gap_ms: pollingGapMs,
        threshold_ms: observerPollingGapThresholdMs,
      });
    }
  }
  lastObserverPollStartedAt = pollStartedAt;
  try {
    const currentRows = await processTable();
    observeProcessContamination(currentRows);
    const processes = chatGptProcessSnapshot(currentRows);
    observeDesktopRuntimeMultiplicity(processes);
    const processKey = JSON.stringify(processes);
    if (processKey !== priorProcessKey) {
      priorProcessKey = processKey;
      record("chatgpt_process_change", processes);
    }

    if (!waitingForReplacement) {
      extendTrackedLifecycleIdentities(currentRows, trackedIdentities);
    }
    const desktopLifecycle = desktopLifecycleSnapshot(currentRows, trackedIdentities);
    if (
      !waitingForReplacement &&
      desktopLifecycle.closed &&
      processContaminationLatch === null
    ) {
      restartCycle += 1;
      waitingForReplacement = true;
      record("old_app_processes_all_absent", {
        restart_cycle: restartCycle,
        prior_main_process: trackedMainIdentity,
        tracked_lifecycle_process_count: trackedIdentities.size,
        desktop_lifecycle: desktopLifecycle,
      });
    }
    if (
      !waitingForReplacement &&
      desktopLifecycle.closed &&
      processContaminationLatch !== null &&
      !contaminatedClosureRejectionRecorded
    ) {
      contaminatedClosureRejectionRecorded = true;
      record("desktop_closure_rejected_process_contamination", {
        process_contamination_latch: processContaminationLatch,
        desktop_lifecycle: desktopLifecycle,
      });
    }
    if (
      waitingForReplacement &&
      desktopRuntimeMultiplicityLatch === null &&
      processes.main_processes.length === 1
    ) {
      const replacement = !sameIdentity(processes.main_processes[0], trackedMainIdentity)
        ? processes.main_processes[0]
        : null;
      if (replacement) {
        record("new_app_process_started", {
          restart_cycle: restartCycle,
          prior_main_process: trackedMainIdentity,
          replacement_main_process: replacement,
          old_processes_were_absent_first: true,
          app_version: appVersion,
        });
        trackedMainIdentity = replacement;
        trackedIdentities = lifecycleIdentityMap(chatGptLifecycleProcesses(currentRows));
        waitingForReplacement = false;
      }
    }
    if (
      restartCycle > runtimeReadyCycle &&
      !waitingForReplacement &&
      desktopRuntimeMultiplicityLatch === null &&
      processes.main_processes.length === 1 &&
      sameIdentity(processes.main_processes[0], trackedMainIdentity) &&
      processes.app_server_processes.length === 1
    ) {
      runtimeReadyCycle = restartCycle;
      record("replacement_app_runtime_ready", {
        restart_cycle: restartCycle,
        main_process: processes.main_processes[0],
        app_server_process: processes.app_server_processes[0],
        app_version: appVersion,
      });
    }

    const receiverProcess = await receiverLaunchdSnapshot(currentRows);
    const receiver = {
      ...receiverProcess,
      listener_preflight: await receiverListenerPreflight(receiverProcess.pid),
    };
    const receiverKey = JSON.stringify(receiver);
    if (receiverKey !== priorReceiverKey) {
      priorReceiverKey = receiverKey;
      record("receiver_process_change", receiver);
    }

    const receiverState = safeDatabaseSnapshot();
    const databaseKey = JSON.stringify(receiverState);
    if (databaseKey !== priorDatabaseKey) {
      priorDatabaseKey = databaseKey;
      record("receiver_state_change", receiverState);
    }

    const heartbeatTurns = safeHeartbeatTurnSnapshot();
    const heartbeatTurnKey = JSON.stringify(heartbeatTurns);
    if (heartbeatTurnKey !== priorHeartbeatTurnKey) {
      priorHeartbeatTurnKey = heartbeatTurnKey;
      record("heartbeat_turn_state_change", heartbeatTurns);
    }

    const automation = safeAutomationSnapshot();
    observeAutomationArm(automation, heartbeatTurns, receiver);
    const automationKey = JSON.stringify(automation);
    if (automationKey !== priorAutomationKey) {
      priorAutomationKey = automationKey;
      record("automation_state_change", automation);
    }
  } catch (error) {
    const errorObservedAt = new Date().toISOString();
    observerErrors.push({
      observed_at: errorObservedAt,
      code: error.code ?? error.name ?? "ERROR",
    });
    if (activeAutomationArm) activeAutomationArm.observerErrorCount += 1;
    record("observer_error", {
      code: error.code ?? error.name ?? "ERROR",
      error_observed_at: errorObservedAt,
    });
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
}

record("observer_stopped", {
  observer_pid: process.pid,
  completed_restart_cycles: restartCycle,
  waiting_for_replacement: waitingForReplacement,
  active_automation_arm: activeAutomationArm
    ? automationArmEvidence(activeAutomationArm, activeAutomationArm.latestHeartbeatSnapshot)
    : null,
  process_contamination_latch: processContaminationLatch,
  desktop_runtime_multiplicity_latch: desktopRuntimeMultiplicityLatch,
});

function observeProcessContamination(rows) {
  const snapshot = d4ContaminatingProcessSnapshot(rows);
  if (snapshot.clean || processContaminationLatch !== null) return snapshot;

  processContaminationLatch = {
    observed_at: new Date().toISOString(),
    ...snapshot,
  };
  if (activeAutomationArm) {
    activeAutomationArm.processContaminationViolationCount += 1;
    activeAutomationArm.processContaminationObservedAt =
      processContaminationLatch.observed_at;
  }
  record("observer_process_contamination_latched", {
    ...processContaminationLatch,
    active_automation_arm_sequence: activeAutomationArm?.sequence ?? null,
  });
  return snapshot;
}

function observeDesktopRuntimeMultiplicity(snapshot) {
  const validMaximum =
    snapshot.main_processes.length <= 1 &&
    snapshot.app_server_processes.length <= 1;
  if (validMaximum || desktopRuntimeMultiplicityLatch !== null) return snapshot;

  desktopRuntimeMultiplicityLatch = {
    observed_at: new Date().toISOString(),
    chatgpt_main_process_count: snapshot.main_processes.length,
    chatgpt_core_app_server_process_count: snapshot.app_server_processes.length,
  };
  if (activeAutomationArm) {
    activeAutomationArm.desktopRuntimeMultiplicityViolationCount += 1;
    activeAutomationArm.desktopRuntimeMultiplicityObservedAt =
      desktopRuntimeMultiplicityLatch.observed_at;
  }
  record("observer_desktop_runtime_multiplicity_latched", {
    ...desktopRuntimeMultiplicityLatch,
    active_automation_arm_sequence: activeAutomationArm?.sequence ?? null,
  });
  return snapshot;
}

function chatGptProcessSnapshot(rows) {
  const main = chatGptMainProcesses(rows);
  const descendants = new Set(main.map((row) => row.pid));
  let changed = true;
  while (changed) {
    changed = false;
    for (const row of rows) {
      if (descendants.has(row.ppid) && !descendants.has(row.pid)) {
        descendants.add(row.pid);
        changed = true;
      }
    }
  }
  return {
    app_version: appVersion,
    main_processes: main.map((row) => ({ pid: row.pid, started_at: row.startedAt }))
      .sort((a, b) => a.pid - b.pid),
    owned_processes: rows.filter((row) => descendants.has(row.pid)).map((row) => ({
      pid: row.pid,
      ppid: row.ppid,
      started_at: row.startedAt,
      executable: path.basename(row.executable),
    })).sort((a, b) => a.pid - b.pid),
    // Count every live Desktop core app-server, including an old instance
    // reparented outside the current main-process tree during restart.
    app_server_processes: chatGptCoreAppServerProcesses(rows)
      .map((row) => ({ pid: row.pid, ppid: row.ppid, started_at: row.startedAt })),
  };
}

async function processTable() {
  const { stdout } = await execFileAsync("/bin/ps", ["-axo", "pid=,ppid=,lstart=,command="]);
  return stdout.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const match = line.match(/^(\d+)\s+(\d+)\s+([A-Z][a-z]{2}\s+[A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2}\s+\d{4})\s+(.+)$/);
    if (!match) return null;
    return {
      pid: Number(match[1]),
      ppid: Number(match[2]),
      startedAt: new Date(match[3]).toISOString(),
      command: match[4],
      executable: match[4].split(/\s+/)[0],
    };
  }).filter(Boolean);
}

function processAncestry(rows, startPid) {
  const byPid = new Map(rows.map((row) => [row.pid, row]));
  const ancestry = [];
  let current = byPid.get(startPid);
  while (current && current.ppid !== current.pid) {
    ancestry.push(current);
    current = byPid.get(current.ppid);
  }
  if (current) ancestry.push(current);
  return ancestry;
}

async function chatGptVersion() {
  const plist = "/Applications/ChatGPT.app/Contents/Info.plist";
  try {
    const [{ stdout: version }, { stdout: build }] = await Promise.all([
      execFileAsync("/usr/bin/plutil", ["-extract", "CFBundleShortVersionString", "raw", plist]),
      execFileAsync("/usr/bin/plutil", ["-extract", "CFBundleVersion", "raw", plist]),
    ]);
    return { version: version.trim(), build: build.trim() };
  } catch {
    return { version: "UNKNOWN", build: "UNKNOWN" };
  }
}

function safeDatabaseSnapshot() {
  if (!fs.existsSync(databasePath)) return { present: false };
  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    database.exec("BEGIN DEFERRED");
    const workflow = database.prepare(`
      SELECT state, state_version, artifact_content, artifact_revision, committed
      FROM workflows WHERE workflow_id = 'WF-001'
    `).get();
    const grantExpiry = database.prepare(`
      SELECT min(expires_at) AS earliest, max(expires_at) AS latest FROM grants
    `).get();
    const snapshot = {
      present: true,
      workflow: workflow ? {
        state: workflow.state,
        state_version: workflow.state_version,
        artifact_sha256: createHash("sha256").update(workflow.artifact_content).digest("hex"),
        artifact_revision: workflow.artifact_revision,
        committed: Boolean(workflow.committed),
      } : null,
      counts: {
        manifests: queryCount(database, "manifests"),
        grants: queryCount(database, "grants"),
        inboxes: queryCount(database, "heartbeat_inboxes"),
        events: queryCount(database, "events"),
        runs: queryCount(database, "runs"),
        deliveries: queryCount(database, "heartbeat_deliveries"),
        effects: queryCount(database, "workflow_effects"),
      },
      statuses: {
        grants: queryStatuses(database, "grants"),
        inboxes: queryStatuses(database, "heartbeat_inboxes"),
        events: queryStatuses(database, "events"),
        runs: queryStatuses(database, "runs"),
        deliveries: queryStatuses(database, "heartbeat_deliveries"),
      },
      grant_expiry: grantExpiry,
      trace_entries: fs.existsSync(tracePath)
        ? fs.readFileSync(tracePath, "utf8").split("\n").filter(Boolean).length
        : 0,
    };
    database.exec("COMMIT");
    return snapshot;
  } catch (error) {
    rollbackQuietly(database);
    throw error;
  } finally {
    database.close();
  }
}

function queryCount(database, table) {
  try {
    return database.prepare(`SELECT count(*) AS count FROM ${table}`).get().count;
  } catch {
    return null;
  }
}

function queryStatuses(database, table) {
  try {
    return Object.fromEntries(
      database.prepare(`SELECT status, count(*) AS count FROM ${table} GROUP BY status`).all()
        .map((row) => [row.status, row.count]),
    );
  } catch {
    return {};
  }
}

function safeAutomationSnapshot() {
  if (!fs.existsSync(automationPath) || !fs.existsSync(automationDatabasePath)) {
    return { present: false };
  }
  const source = fs.readFileSync(automationPath, "utf8");
  const fileStatus = parseTomlBasicString(source, "status") ?? "UNKNOWN";
  const fileRrule = parseTomlBasicString(source, "rrule") ?? "UNKNOWN";
  const database = new DatabaseSync(automationDatabasePath, { readOnly: true });
  try {
    database.exec("BEGIN DEFERRED");
    const row = database.prepare(`
      SELECT id, prompt, status, next_run_at, last_run_at, rrule, target_thread_id,
             target_type, kind, updated_at
      FROM automations WHERE id = ?
    `).get(automationId);
    const otherActive = database.prepare(`
      SELECT count(*) AS count FROM automations WHERE id <> ? AND status = 'ACTIVE'
    `).get(automationId).count;
    database.exec("COMMIT");
    if (!row) return { present: false };
    return {
      present: true,
      automation_id_sha256: createHash("sha256").update(row.id).digest("hex"),
      status: row.status,
      rrule: row.rrule,
      next_run_at: epochToIso(row.next_run_at),
      last_run_at: epochToIso(row.last_run_at),
      updated_at: epochToIso(row.updated_at),
      kind: row.kind,
      target_type: row.target_type,
      target_thread_sha256: row.target_thread_id
        ? createHash("sha256").update(row.target_thread_id).digest("hex")
        : null,
      prompt_audit: auditPrompt(row.prompt, privateReceipt),
      other_active_count: otherActive,
      configuration_matches_database: fileStatus === row.status && fileRrule === row.rrule,
      config_modified_at: fs.statSync(automationPath).mtime.toISOString(),
    };
  } catch (error) {
    rollbackQuietly(database);
    throw error;
  } finally {
    database.close();
  }
}

function readPrivateAutomationContract() {
  const database = new DatabaseSync(automationDatabasePath, { readOnly: true });
  try {
    database.exec("BEGIN DEFERRED");
    const row = database.prepare(`
      SELECT id, prompt, target_thread_id, kind
      FROM automations WHERE id = ?
    `).get(automationId);
    database.exec("COMMIT");
    if (
      !row ||
      row.id !== automationId ||
      row.kind !== "heartbeat" ||
      typeof row.prompt !== "string" ||
      row.prompt.length === 0 ||
      typeof row.target_thread_id !== "string" ||
      row.target_thread_id.length === 0
    ) {
      throw new Error("D4/H2b private automation contract is invalid");
    }
    return {
      prompt: row.prompt,
      targetThreadId: row.target_thread_id,
    };
  } catch (error) {
    rollbackQuietly(database);
    throw error;
  } finally {
    database.close();
  }
}

function resolvePrivateTargetRolloutPath(targetThreadId) {
  if (!fs.existsSync(codexStateDatabasePath)) {
    throw new Error("D4/H2b Codex state database is unavailable");
  }
  const database = new DatabaseSync(codexStateDatabasePath, { readOnly: true });
  try {
    database.exec("BEGIN DEFERRED");
    const row = database.prepare(`
      SELECT rollout_path FROM threads WHERE id = ?
    `).get(targetThreadId);
    database.exec("COMMIT");
    if (
      !row ||
      typeof row.rollout_path !== "string" ||
      !path.isAbsolute(row.rollout_path) ||
      !fs.existsSync(row.rollout_path)
    ) {
      throw new Error("D4/H2b target task rollout mapping is unavailable");
    }
    return row.rollout_path;
  } catch (error) {
    rollbackQuietly(database);
    throw error;
  } finally {
    database.close();
  }
}

function safeHeartbeatTurnSnapshot() {
  let currentRolloutPath;
  try {
    currentRolloutPath = resolvePrivateTargetRolloutPath(
      privateAutomationContract.targetThreadId,
    );
  } catch {
    return {
      present: false,
      rollout_mapping_matches: false,
      target_thread_sha256: createHash("sha256")
        .update(privateAutomationContract.targetThreadId)
        .digest("hex"),
      rollout_path_sha256: createHash("sha256")
        .update(privateTargetRolloutPath)
        .digest("hex"),
      line_count: 0,
      json_parse_error_count: 0,
      heartbeat_candidate_count: 0,
      strict_heartbeat_envelope_count: 0,
      accepted_strict_heartbeat_turn_count: 0,
      duplicate_accepted_strict_response_count: 0,
      strict_envelopes: [],
      accepted_turns: [],
    };
  }

  const mappingMatches = currentRolloutPath === privateTargetRolloutPath;
  if (!mappingMatches || !fs.existsSync(privateTargetRolloutPath)) {
    return {
      present: false,
      rollout_mapping_matches: mappingMatches,
      target_thread_sha256: createHash("sha256")
        .update(privateAutomationContract.targetThreadId)
        .digest("hex"),
      rollout_path_sha256: createHash("sha256")
        .update(privateTargetRolloutPath)
        .digest("hex"),
      line_count: 0,
      json_parse_error_count: 0,
      heartbeat_candidate_count: 0,
      strict_heartbeat_envelope_count: 0,
      accepted_strict_heartbeat_turn_count: 0,
      duplicate_accepted_strict_response_count: 0,
      strict_envelopes: [],
      accepted_turns: [],
    };
  }

  const stat = fs.statSync(privateTargetRolloutPath);
  if (!stat.isFile()) {
    return {
      present: false,
      rollout_mapping_matches: true,
      target_thread_sha256: createHash("sha256")
        .update(privateAutomationContract.targetThreadId)
        .digest("hex"),
      rollout_path_sha256: createHash("sha256")
        .update(privateTargetRolloutPath)
        .digest("hex"),
      line_count: 0,
      json_parse_error_count: 0,
      heartbeat_candidate_count: 0,
      strict_heartbeat_envelope_count: 0,
      accepted_strict_heartbeat_turn_count: 0,
      duplicate_accepted_strict_response_count: 0,
      strict_envelopes: [],
      accepted_turns: [],
    };
  }

  const cacheKey = `${stat.dev}:${stat.ino}:${stat.size}:${stat.mtimeMs}`;
  if (heartbeatTurnScanCache?.key === cacheKey) return heartbeatTurnScanCache.snapshot;

  const source = fs.readFileSync(privateTargetRolloutPath, "utf8");
  const lines = source.split("\n").filter((line) => line.length > 0);
  const strictEnvelopes = [];
  const acceptedTurnsById = new Map();
  let currentTurnContextId = null;
  let jsonParseErrorCount = 0;
  let heartbeatCandidateCount = 0;
  let duplicateAcceptedStrictResponseCount = 0;

  for (const [lineIndex, line] of lines.entries()) {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      jsonParseErrorCount += 1;
      continue;
    }

    if (entry?.type === "turn_context") {
      currentTurnContextId = typeof entry.payload?.turn_id === "string"
        ? entry.payload.turn_id
        : null;
      continue;
    }
    if (
      entry?.type !== "response_item" ||
      entry.payload?.type !== "message" ||
      entry.payload?.role !== "user" ||
      !Array.isArray(entry.payload?.content) ||
      entry.payload.content.length !== 1 ||
      entry.payload.content[0]?.type !== "input_text" ||
      typeof entry.payload.content[0]?.text !== "string"
    ) {
      continue;
    }

    const text = entry.payload.content[0].text;
    if (text.startsWith("<heartbeat>\n") && text.includes("\n</heartbeat>")) {
      heartbeatCandidateCount += 1;
    }
    const parsed = parseStrictHeartbeatEnvelope(text);
    if (!parsed) continue;

    const metadataTurnId = entry.payload.internal_chat_message_metadata_passthrough?.turn_id;
    const metadataTurnIdPresent =
      typeof metadataTurnId === "string" && metadataTurnId.length > 0;
    const turnContextMatches = metadataTurnIdPresent && metadataTurnId === currentTurnContextId;
    const envelopeSha256 = createHash("sha256").update(text).digest("hex");
    const responseFingerprintSha256 = createHash("sha256")
      .update(`${lineIndex}\0${metadataTurnIdPresent ? metadataTurnId : ""}\0${text}`)
      .digest("hex");
    const safeEnvelope = {
      response_fingerprint_sha256: responseFingerprintSha256,
      envelope_sha256: envelopeSha256,
      current_time_iso: parsed.currentTimeIso,
      message_timestamp: validIsoTimestamp(entry.timestamp),
      metadata_turn_id_present: metadataTurnIdPresent,
      turn_context_matches: turnContextMatches,
    };
    strictEnvelopes.push(safeEnvelope);

    if (!turnContextMatches) continue;
    const turnIdSha256 = createHash("sha256").update(metadataTurnId).digest("hex");
    if (acceptedTurnsById.has(turnIdSha256)) {
      duplicateAcceptedStrictResponseCount += 1;
      continue;
    }
    acceptedTurnsById.set(turnIdSha256, {
      turn_fingerprint_sha256: createHash("sha256")
        .update(`${metadataTurnId}\0${text}`)
        .digest("hex"),
      turn_id_sha256: turnIdSha256,
      envelope_sha256: envelopeSha256,
      current_time_iso: parsed.currentTimeIso,
      message_timestamp: validIsoTimestamp(entry.timestamp),
      metadata_turn_id_present: true,
      turn_context_matches: true,
    });
  }

  const acceptedTurns = [...acceptedTurnsById.values()];
  const snapshot = {
    present: true,
    rollout_mapping_matches: true,
    target_thread_sha256: createHash("sha256")
      .update(privateAutomationContract.targetThreadId)
      .digest("hex"),
    rollout_path_sha256: createHash("sha256")
      .update(privateTargetRolloutPath)
      .digest("hex"),
    rollout_content_sha256: createHash("sha256").update(source).digest("hex"),
    rollout_modified_at: stat.mtime.toISOString(),
    rollout_byte_count: stat.size,
    line_count: lines.length,
    json_parse_error_count: jsonParseErrorCount,
    heartbeat_candidate_count: heartbeatCandidateCount,
    strict_heartbeat_envelope_count: strictEnvelopes.length,
    accepted_strict_heartbeat_turn_count: acceptedTurns.length,
    duplicate_accepted_strict_response_count: duplicateAcceptedStrictResponseCount,
    strict_envelopes: strictEnvelopes,
    accepted_turns: acceptedTurns,
  };
  heartbeatTurnScanCache = { key: cacheKey, snapshot };
  return snapshot;
}

function parseStrictHeartbeatEnvelope(text) {
  const match = text.match(
    /^<heartbeat>\n  <automation_id>([^<\r\n]+)<\/automation_id>\n  <current_time_iso>([^<\r\n]+)<\/current_time_iso>\n  <instructions>\n([\s\S]*)\n  <\/instructions>\n<\/heartbeat>\n?$/,
  );
  if (!match) return null;
  const currentTimeIso = validIsoTimestamp(match[2]);
  if (
    match[1] !== automationId ||
    match[3] !== privateAutomationContract.prompt ||
    !currentTimeIso
  ) {
    return null;
  }
  return { currentTimeIso };
}

function validIsoTimestamp(value) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return null;
  return value;
}

function validateOneShotSchedule(snapshot) {
  if (typeof snapshot.rrule !== "string") return { valid: false, exact_form: false };
  const match = snapshot.rrule.match(
    /^DTSTART:(\d{8}T\d{6}Z)\nRRULE:FREQ=MINUTELY;INTERVAL=1;COUNT=1$/,
  );
  if (!match) return { valid: false, exact_form: false };
  const dtstartAt = parseBasicUtc(match[1]);
  if (!dtstartAt || !snapshot.next_run_at || !snapshot.updated_at) {
    return { valid: false, exact_form: true };
  }
  const nextMatchesDtstart = snapshot.next_run_at === dtstartAt;
  const activationBufferMs = Date.parse(dtstartAt) - Date.parse(snapshot.updated_at);
  return {
    valid: nextMatchesDtstart && activationBufferMs >= 5 * 60 * 1000,
    exact_form: true,
    dtstart_at: dtstartAt,
    next_matches_dtstart: nextMatchesDtstart,
    activation_buffer_ms: activationBufferMs,
  };
}

function parseBasicUtc(value) {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!match) return null;
  const parsed = new Date(Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6]),
  ));
  const canonical = parsed.toISOString().replace(/[-:]/g, "").replace(".000", "");
  return canonical === value ? parsed.toISOString() : null;
}

function observeAutomationArm(snapshot, heartbeatTurns, receiverSnapshot) {
  const oneShotSchedule = validateOneShotSchedule(snapshot);
  const activationObservedAt = Date.now();
  const activationUpdatedAt = Date.parse(snapshot.updated_at);
  const activationObservationDelayMs = Number.isFinite(activationUpdatedAt)
    ? activationObservedAt - activationUpdatedAt
    : null;
  const activationObservedPromptly =
    Number.isFinite(activationObservationDelayMs) &&
    activationObservationDelayMs >= -1_000 &&
    activationObservationDelayMs <= observerPollingGapThresholdMs;
  const activationWindowObserverErrorCount = Number.isFinite(activationUpdatedAt)
    ? observerErrors.filter(
      (entry) => Date.parse(entry.observed_at) >= activationUpdatedAt,
    ).length
    : observerErrors.length;
  const nextRunIsFuture = snapshot.next_run_at
    ? Date.parse(snapshot.next_run_at) > activationObservedAt
    : false;
  const cleanActivationPreflight =
    snapshot.present === true &&
    snapshot.status === "ACTIVE" &&
    oneShotSchedule.valid &&
    nextRunIsFuture &&
    activationObservedPromptly &&
    activationWindowObserverErrorCount === 0 &&
    processContaminationLatch === null &&
    desktopRuntimeMultiplicityLatch === null &&
    snapshot.configuration_matches_database === true &&
    automationSnapshotMatchesPrivateContract(snapshot) &&
    receiverMatchesExperimentContract(receiverSnapshot);

  if (snapshot.present === true && snapshot.status === "ACTIVE" && !activeAutomationArm) {
    const heartbeatBaseline = pausedHeartbeatBaseline ?? heartbeatTurns;
    automationArmSequence += 1;
    activeAutomationArm = {
      sequence: automationArmSequence,
      rrule: snapshot.rrule,
      initialNextRunAt: snapshot.next_run_at,
      baselineLastRunAt: pausedAutomationBaseline?.last_run_at ?? snapshot.last_run_at,
      lastSeenNextRunAt: snapshot.next_run_at,
      lastSeenLastRunAt: pausedAutomationBaseline?.last_run_at ?? snapshot.last_run_at,
      dispatchAttempts: new Set(),
      retryRescheduleCount: 0,
      observerErrorCount: activationWindowObserverErrorCount,
      observerPollingGapCount: 0,
      maxPollingGapMs: 0,
      automationContractViolationCount: 0,
      automationContractViolationObserved: false,
      receiverContinuityViolationCount: 0,
      receiverContinuityViolationObserved: false,
      heartbeatSourceViolationCount: 0,
      heartbeatSourceViolationObserved: false,
      processContaminationViolationCount: processContaminationLatch ? 1 : 0,
      processContaminationObservedAt: processContaminationLatch?.observed_at ?? null,
      desktopRuntimeMultiplicityViolationCount:
        desktopRuntimeMultiplicityLatch ? 1 : 0,
      desktopRuntimeMultiplicityObservedAt:
        desktopRuntimeMultiplicityLatch?.observed_at ?? null,
      initialActivationPreflightValid: cleanActivationPreflight,
      activationObservationDelayMs,
      activationObservedPromptly,
      activationWindowObserverErrorCount,
      initialOneShotScheduleValid: oneShotSchedule.valid,
      initialNextRunWasFuture: nextRunIsFuture,
      pauseObservedAt: null,
      baselineStrictEnvelopeFingerprints: new Set(
        heartbeatBaseline.strict_envelopes.map((entry) => entry.response_fingerprint_sha256),
      ),
      baselineAcceptedTurnFingerprints: new Set(
        heartbeatBaseline.accepted_turns.map((entry) => entry.turn_fingerprint_sha256),
      ),
      baselineStrictEnvelopeCount: heartbeatBaseline.strict_heartbeat_envelope_count,
      baselineAcceptedTurnCount: heartbeatBaseline.accepted_strict_heartbeat_turn_count,
      latestAutomationSnapshot: snapshot,
      latestHeartbeatSnapshot: heartbeatTurns,
    };
    record("automation_arm_started", {
      arm_sequence: activeAutomationArm.sequence,
      initial_next_run_at: snapshot.next_run_at,
      baseline_last_run_at: activeAutomationArm.baselineLastRunAt,
      baseline_strict_heartbeat_envelope_count:
        activeAutomationArm.baselineStrictEnvelopeCount,
      baseline_accepted_strict_heartbeat_turn_count:
        activeAutomationArm.baselineAcceptedTurnCount,
      activation_buffer_ms: oneShotSchedule.activation_buffer_ms,
      activation_observation_delay_ms: activationObservationDelayMs,
      activation_observed_promptly: activationObservedPromptly,
      activation_window_observer_error_count:
        activationWindowObserverErrorCount,
      initial_next_run_was_future: nextRunIsFuture,
      initial_preflight_valid: cleanActivationPreflight,
      process_contamination_preserved: processContaminationLatch === null,
      desktop_runtime_multiplicity_preserved:
        desktopRuntimeMultiplicityLatch === null,
      configuration_matches_database:
        snapshot.configuration_matches_database === true,
      receiver_matches_experiment_contract:
        receiverMatchesExperimentContract(receiverSnapshot),
    });
    observeAutomationArmState(snapshot);
  }

  if (!activeAutomationArm) {
    if (
      snapshot.status === "PAUSED" &&
      snapshot.configuration_matches_database === true &&
      automationSnapshotMatchesPrivateContract(snapshot)
    ) {
      pausedAutomationBaseline = snapshot;
      pausedHeartbeatBaseline = heartbeatTurns;
    }
    return;
  }
  activeAutomationArm.latestAutomationSnapshot = snapshot;
  activeAutomationArm.latestHeartbeatSnapshot = heartbeatTurns;
  observeActiveArmInvariants(snapshot, receiverSnapshot, heartbeatTurns);
  observeAutomationArmState(snapshot);
  if (snapshot.status === "PAUSED" && snapshot.configuration_matches_database === true) {
    if (!activeAutomationArm.pauseObservedAt) {
      activeAutomationArm.pauseObservedAt = new Date().toISOString();
      record("automation_arm_pause_observed", {
        arm_sequence: activeAutomationArm.sequence,
        pause_observed_at: activeAutomationArm.pauseObservedAt,
        next_run_cleared: snapshot.next_run_at === null,
        configuration_matches_database: true,
        private_automation_contract_matches:
          automationSnapshotMatchesPrivateContract(snapshot),
      });
    }
    const evidence = automationArmEvidence(activeAutomationArm, heartbeatTurns, snapshot);
    const settleTimedOut =
      Date.now() - Date.parse(activeAutomationArm.pauseObservedAt) >= automationArmSettleTimeoutMs;
    if (
      evidence.dispatch_attempt_count === 1 &&
      evidence.new_strict_heartbeat_envelope_count === 0 &&
      !settleTimedOut
    ) return;
    record("automation_arm_closed", evidence);
    pausedAutomationBaseline = snapshot;
    pausedHeartbeatBaseline = heartbeatTurns;
    activeAutomationArm = null;
  }
}

function observeActiveArmInvariants(
  automationSnapshot,
  receiverSnapshot,
  heartbeatSnapshot,
) {
  const automationContractValid =
    activeAutomationArm.initialActivationPreflightValid === true &&
    automationSnapshot?.present === true &&
    ["ACTIVE", "PAUSED"].includes(automationSnapshot.status) &&
    automationSnapshot.rrule === activeAutomationArm.rrule &&
    automationSnapshot.configuration_matches_database === true &&
    automationSnapshotMatchesPrivateContract(automationSnapshot);
  if (
    !automationContractValid &&
    !activeAutomationArm.automationContractViolationObserved
  ) {
    activeAutomationArm.automationContractViolationObserved = true;
    activeAutomationArm.automationContractViolationCount += 1;
    record("automation_arm_contract_violation", {
      arm_sequence: activeAutomationArm.sequence,
      initial_activation_preflight_valid:
        activeAutomationArm.initialActivationPreflightValid,
      activation_observed_promptly: activeAutomationArm.activationObservedPromptly,
      initial_one_shot_schedule_valid:
        activeAutomationArm.initialOneShotScheduleValid,
      initial_next_run_was_future: activeAutomationArm.initialNextRunWasFuture,
      automation_present: automationSnapshot?.present === true,
      status_allowed: ["ACTIVE", "PAUSED"].includes(automationSnapshot?.status),
      rrule_matches_arm: automationSnapshot?.rrule === activeAutomationArm.rrule,
      configuration_matches_database:
        automationSnapshot?.configuration_matches_database === true,
      private_automation_contract_matches:
        automationSnapshotMatchesPrivateContract(automationSnapshot),
    });
  }

  const receiverContractValid = receiverMatchesExperimentContract(receiverSnapshot);
  if (
    !receiverContractValid &&
    !activeAutomationArm.receiverContinuityViolationObserved
  ) {
    activeAutomationArm.receiverContinuityViolationObserved = true;
    activeAutomationArm.receiverContinuityViolationCount += 1;
    record("automation_arm_receiver_continuity_violation", {
      arm_sequence: activeAutomationArm.sequence,
      receiver_present: receiverSnapshot?.present === true,
      receiver_running: receiverSnapshot?.state === "running",
      launchd_parent_verified: receiverSnapshot?.ppid === 1,
      command_matches: receiverSnapshot?.command_matches === true,
      chatgpt_ancestor_detected:
        receiverSnapshot?.chatgpt_ancestor_detected === true,
      exclusive_port_owner:
        receiverSnapshot?.listener_preflight?.exclusive_expected_owner === true,
      receiver_identity_matches: sameIdentity(
        receiverSnapshot ?? {},
        experimentReceiverIdentity,
      ),
    });
  }

  const heartbeatSourceValid =
    heartbeatSnapshot?.present === true &&
    heartbeatSnapshot?.rollout_mapping_matches === true &&
    heartbeatSnapshot?.json_parse_error_count === 0 &&
    heartbeatSnapshot?.duplicate_accepted_strict_response_count === 0 &&
    heartbeatSnapshot?.rollout_path_sha256 === expectedRolloutPathSha256;
  if (
    !heartbeatSourceValid &&
    !activeAutomationArm.heartbeatSourceViolationObserved
  ) {
    activeAutomationArm.heartbeatSourceViolationObserved = true;
    activeAutomationArm.heartbeatSourceViolationCount += 1;
    record("automation_arm_heartbeat_source_violation", {
      arm_sequence: activeAutomationArm.sequence,
      source_present: heartbeatSnapshot?.present === true,
      rollout_mapping_matches:
        heartbeatSnapshot?.rollout_mapping_matches === true,
      rollout_path_matches_frozen_contract:
        heartbeatSnapshot?.rollout_path_sha256 === expectedRolloutPathSha256,
      json_parse_error_count: heartbeatSnapshot?.json_parse_error_count ?? null,
      duplicate_accepted_strict_response_count:
        heartbeatSnapshot?.duplicate_accepted_strict_response_count ?? null,
    });
  }
}

function automationArmEvidence(arm, heartbeatTurns, automationSnapshot) {
  const heartbeatSnapshot = heartbeatTurns ?? {
    present: false,
    rollout_mapping_matches: false,
    json_parse_error_count: 0,
    strict_envelopes: [],
    accepted_turns: [],
  };
  const currentAutomation = automationSnapshot ?? arm.latestAutomationSnapshot ?? {};
  const newStrictEnvelopes = heartbeatSnapshot.strict_envelopes.filter(
    (entry) => !arm.baselineStrictEnvelopeFingerprints.has(entry.response_fingerprint_sha256),
  );
  const newAcceptedTurns = heartbeatSnapshot.accepted_turns.filter(
    (entry) => !arm.baselineAcceptedTurnFingerprints.has(entry.turn_fingerprint_sha256),
  );
  const dispatchAttempts = [...arm.dispatchAttempts].sort();
  const dispatchAtOrAfterDue = dispatchAttempts.length === 1 &&
    Date.parse(dispatchAttempts[0]) >= Date.parse(arm.initialNextRunAt) - 1_000;
  const correlationMatches = dispatchAttempts.length === 1 && newAcceptedTurns.length === 1
    ? heartbeatTimestampCorrelates(dispatchAttempts[0], newAcceptedTurns[0].current_time_iso)
    : false;
  const configurationMatches = currentAutomation.configuration_matches_database === true;
  const privateAutomationContractMatches =
    automationSnapshotMatchesPrivateContract(currentAutomation);
  const nextRunCleared = currentAutomation.next_run_at === null;
  const armClosed = currentAutomation.status === "PAUSED" && Boolean(arm.pauseObservedAt);
  const exactlyOneStrictEnvelope = newStrictEnvelopes.length === 1;
  const exactlyOneAcceptedTurn = newAcceptedTurns.length === 1;
  const sourceIsClean =
    heartbeatSnapshot.present === true &&
    heartbeatSnapshot.rollout_mapping_matches === true &&
    heartbeatSnapshot.json_parse_error_count === 0 &&
    heartbeatSnapshot.duplicate_accepted_strict_response_count === 0;
  return {
    arm_sequence: arm.sequence,
    initial_next_run_at: arm.initialNextRunAt,
    final_last_run_at: currentAutomation.last_run_at ?? null,
    dispatch_attempt_count: dispatchAttempts.length,
    dispatch_attempt_timestamps: dispatchAttempts,
    retry_reschedule_count: arm.retryRescheduleCount,
    single_dispatch_without_retry:
      dispatchAttempts.length === 1 && arm.retryRescheduleCount === 0,
    dispatch_at_or_after_due: dispatchAtOrAfterDue,
    observer_error_count: arm.observerErrorCount,
    observer_polling_gap_count: arm.observerPollingGapCount,
    maximum_observer_polling_gap_ms: arm.maxPollingGapMs,
    observer_polling_gap_threshold_ms: observerPollingGapThresholdMs,
    activation_observation_delay_ms: arm.activationObservationDelayMs,
    activation_observed_promptly: arm.activationObservedPromptly,
    activation_window_observer_error_count:
      arm.activationWindowObserverErrorCount,
    initial_activation_preflight_valid: arm.initialActivationPreflightValid,
    automation_contract_violation_count: arm.automationContractViolationCount,
    receiver_continuity_violation_count: arm.receiverContinuityViolationCount,
    receiver_continuity_preserved: arm.receiverContinuityViolationCount === 0,
    heartbeat_source_violation_count: arm.heartbeatSourceViolationCount,
    process_contamination_violation_count: arm.processContaminationViolationCount,
    process_contamination_preserved: arm.processContaminationViolationCount === 0,
    process_contamination_observed_at: arm.processContaminationObservedAt,
    desktop_runtime_multiplicity_violation_count:
      arm.desktopRuntimeMultiplicityViolationCount,
    desktop_runtime_multiplicity_preserved:
      arm.desktopRuntimeMultiplicityViolationCount === 0,
    desktop_runtime_multiplicity_observed_at:
      arm.desktopRuntimeMultiplicityObservedAt,
    baseline_strict_heartbeat_envelope_count: arm.baselineStrictEnvelopeCount,
    baseline_accepted_strict_heartbeat_turn_count: arm.baselineAcceptedTurnCount,
    new_strict_heartbeat_envelope_count: newStrictEnvelopes.length,
    accepted_strict_heartbeat_turn_count: newAcceptedTurns.length,
    accepted_turn_timestamps: newAcceptedTurns.map((entry) => entry.current_time_iso),
    accepted_turn_hashes: newAcceptedTurns.map((entry) => entry.turn_fingerprint_sha256),
    strict_envelope_hashes: newStrictEnvelopes.map((entry) => entry.envelope_sha256),
    dispatch_turn_correlation_matches: correlationMatches,
    heartbeat_rollout_mapping_matches:
      heartbeatSnapshot.rollout_mapping_matches === true,
    heartbeat_source_clean: sourceIsClean,
    next_run_cleared: nextRunCleared,
    arm_closed_by_pause: armClosed,
    configuration_matches_database: configurationMatches,
    private_automation_contract_matches: privateAutomationContractMatches,
    pass_candidate:
      dispatchAttempts.length === 1 &&
      arm.retryRescheduleCount === 0 &&
      dispatchAtOrAfterDue &&
      arm.observerErrorCount === 0 &&
      arm.observerPollingGapCount === 0 &&
      arm.automationContractViolationCount === 0 &&
      arm.receiverContinuityViolationCount === 0 &&
      arm.heartbeatSourceViolationCount === 0 &&
      arm.processContaminationViolationCount === 0 &&
      arm.desktopRuntimeMultiplicityViolationCount === 0 &&
      exactlyOneStrictEnvelope &&
      exactlyOneAcceptedTurn &&
      correlationMatches &&
      sourceIsClean &&
      nextRunCleared &&
      armClosed &&
      configurationMatches &&
      privateAutomationContractMatches,
  };
}

function automationSnapshotMatchesPrivateContract(snapshot) {
  return (
    snapshot?.kind === "heartbeat" &&
    snapshot?.other_active_count === 0 &&
    snapshot?.prompt_audit?.forbidden_count === 0 &&
    snapshot?.prompt_audit?.sha256 === expectedPromptSha256 &&
    snapshot?.target_thread_sha256 === expectedTargetSha256
  );
}

function receiverMatchesExperimentContract(snapshot) {
  return (
    snapshot?.present === true &&
    snapshot?.state === "running" &&
    snapshot?.ppid === 1 &&
    snapshot?.command_matches === true &&
    snapshot?.chatgpt_ancestor_detected === false &&
    snapshot?.listener_preflight?.exclusive_expected_owner === true &&
    sameIdentity(snapshot, experimentReceiverIdentity)
  );
}

function heartbeatTimestampCorrelates(dispatchTimestamp, heartbeatTimestamp) {
  const dispatchTime = Date.parse(dispatchTimestamp);
  const heartbeatTime = Date.parse(heartbeatTimestamp);
  return Number.isFinite(dispatchTime) && Number.isFinite(heartbeatTime) &&
    heartbeatTime >= dispatchTime - 1_000 && heartbeatTime <= dispatchTime + 600_000;
}

function observeAutomationArmState(snapshot) {
  const lastRunChanged = snapshot.last_run_at !== activeAutomationArm.lastSeenLastRunAt;
  const nextRunChanged = snapshot.next_run_at !== activeAutomationArm.lastSeenNextRunAt;
  if (
    lastRunChanged &&
    snapshot.last_run_at &&
    snapshot.last_run_at !== activeAutomationArm.baselineLastRunAt &&
    !activeAutomationArm.dispatchAttempts.has(snapshot.last_run_at)
  ) {
    activeAutomationArm.dispatchAttempts.add(snapshot.last_run_at);
    record("automation_dispatch_attempt_observed", {
      arm_sequence: activeAutomationArm.sequence,
      attempt_number: activeAutomationArm.dispatchAttempts.size,
      last_run_at: snapshot.last_run_at,
      next_run_at: snapshot.next_run_at,
    });
  }
  if (snapshot.status === "ACTIVE" && nextRunChanged && !lastRunChanged) {
    activeAutomationArm.retryRescheduleCount += 1;
    record("automation_retry_reschedule_observed", {
      arm_sequence: activeAutomationArm.sequence,
      retry_reschedule_number: activeAutomationArm.retryRescheduleCount,
      prior_next_run_at: activeAutomationArm.lastSeenNextRunAt,
      next_run_at: snapshot.next_run_at,
      last_run_at_unchanged: true,
    });
  }
  activeAutomationArm.lastSeenNextRunAt = snapshot.next_run_at;
  activeAutomationArm.lastSeenLastRunAt = snapshot.last_run_at;
}

async function receiverLaunchdSnapshot(rows) {
  try {
    const { stdout } = await execFileAsync("/bin/launchctl", [
      "print",
      `gui/${process.getuid()}/${receiverLabel}`,
    ]);
    const pid = Number.parseInt(stdout.match(/^\s*pid\s*=\s*(\d+)\s*$/m)?.[1] ?? "", 10);
    const state = stdout.match(/^\s*state\s*=\s*(\S+)\s*$/m)?.[1] ?? "UNKNOWN";
    const row = rows.find((candidate) => candidate.pid === pid);
    const ancestry = row ? processAncestry(rows, pid) : [];
    return {
      present: true,
      label_sha256: createHash("sha256").update(receiverLabel).digest("hex"),
      state,
      pid: Number.isInteger(pid) ? pid : null,
      ppid: row?.ppid ?? null,
      started_at: row?.startedAt ?? null,
      command_matches: Boolean(
        row?.command.endsWith(`${path.join(scriptsDirectory, "d4-h2b-command.mjs")} start`),
      ),
      chatgpt_ancestor_detected: ancestry.some(
        (candidate) => candidate.command.includes("/ChatGPT.app/Contents/"),
      ),
    };
  } catch {
    return { present: false };
  }
}

async function receiverListenerPreflight(expectedPid) {
  try {
    const { stdout } = await execFileAsync("/usr/sbin/lsof", [
      "-nP",
      `-iTCP:${port}`,
      "-sTCP:LISTEN",
      "-Fp",
    ]);
    const listenerPids = [...stdout.matchAll(/^p(\d+)$/gm)].map((match) => Number(match[1]));
    return {
      listener_count: listenerPids.length,
      exclusive_expected_owner: listenerPids.length === 1 && listenerPids[0] === expectedPid,
    };
  } catch {
    return { listener_count: 0, exclusive_expected_owner: false };
  }
}

function auditPrompt(prompt, receipt) {
  const source = typeof prompt === "string" ? prompt : "";
  const forbidden = {
    workflow_id: /\bWF-[A-Za-z0-9_-]+\b/.test(source),
    absolute_url: /\bhttps?:\/\//i.test(source),
    site_tool_name: /\b(?:register_reentry_binding|get_pending_reentry_event|get_workflow_context|continue_artifact|acknowledge_reentry_effect)\b/i.test(source),
    event_id: /\bevt_[A-Za-z0-9_-]+\b/.test(source),
    grant_id: /\bgr_[A-Za-z0-9_-]+\b/.test(source),
    opaque_binding: /\bab_opaque_[A-Za-z0-9_-]+\b/.test(source),
    inbox_bearer: /\/receiver\/inboxes\/[A-Za-z0-9_-]+/i.test(source),
    receipt_field_name: /\b(?:receiver_inbox_url|canonical_url|workflow_id|authorized_event_type)\b/i
      .test(source),
  };
  const exactReceiptValueMatches = Object.fromEntries([
    "receiver_inbox_url",
    "canonical_url",
    "workflow_id",
    "authorized_event_type",
  ].map((field) => [field, source.includes(receipt[field])]));
  return {
    sha256: createHash("sha256").update(source).digest("hex"),
    length: source.length,
    forbidden,
    exact_receipt_value_matches: exactReceiptValueMatches,
    forbidden_count: [
      ...Object.values(forbidden),
      ...Object.values(exactReceiptValueMatches),
    ].filter(Boolean).length,
  };
}

function readPrivateReceipt() {
  if (!fs.existsSync(receiptPath)) throw new Error("D4/H2b bounded receipt is missing");
  const receipt = JSON.parse(fs.readFileSync(receiptPath, "utf8"));
  for (const field of [
    "receiver_inbox_url",
    "canonical_url",
    "workflow_id",
    "authorized_event_type",
    "expires_at",
  ]) {
    if (typeof receipt[field] !== "string" || receipt[field].length === 0) {
      throw new Error("D4/H2b bounded receipt does not match the strict observer contract");
    }
  }
  return receipt;
}

function epochToIso(value) {
  return Number.isInteger(value) ? new Date(value).toISOString() : null;
}

function parseTomlBasicString(source, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const literal = source.match(
    new RegExp(`^${escapedKey}\\s*=\\s*("(?:[^"\\\\]|\\\\.)*")\\s*$`, "m"),
  )?.[1];
  if (!literal) return null;
  try {
    return JSON.parse(literal);
  } catch {
    return null;
  }
}

function rollbackQuietly(database) {
  try {
    database.exec("ROLLBACK");
  } catch {
    // The failure may have occurred before the read transaction began.
  }
}

function resolveRequiredPath(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  const resolved = path.resolve(value);
  if (!fs.existsSync(resolved)) throw new Error(`${name} does not exist`);
  return resolved;
}

function requireSha256Environment(name) {
  const value = process.env[name];
  if (!value || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${name} must contain the pinned private-contract digest`);
  }
  return value;
}

function record(event, details) {
  fs.appendFileSync(logPath, `${JSON.stringify({
    observed_at: new Date().toISOString(),
    event,
    details,
  })}\n`, { encoding: "utf8", mode: 0o600 });
}
