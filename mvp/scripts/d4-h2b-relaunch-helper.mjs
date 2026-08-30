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
  sameProcessIdentity as sameIdentity,
} from "./d4-desktop-process-lifecycle.mjs";

const execFileAsync = promisify(execFile);
const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const mvpRoot = path.resolve(scriptsDirectory, "..");
const runId = process.env.WEBMCP_D4_RUN_ID;
const port = Number.parseInt(process.env.WEBMCP_D4_PORT ?? "", 10);
const restartCycle = Number.parseInt(process.env.WEBMCP_D4_RESTART_CYCLE ?? "", 10);
const eventArm = process.env.WEBMCP_D4_EVENT_ARM === "true";
const automationPath = resolveRequiredPath("WEBMCP_D4_AUTOMATION_FILE");
const automationDatabasePath = resolveRequiredPath("WEBMCP_D4_AUTOMATION_DATABASE");
const automationId = process.env.WEBMCP_D4_AUTOMATION_ID;
const expectedPromptSha256 = requireSha256Environment("WEBMCP_D4_EXPECTED_PROMPT_SHA256");
const expectedTargetSha256 = requireSha256Environment("WEBMCP_D4_EXPECTED_TARGET_SHA256");

if (!runId || !/^[a-z0-9][a-z0-9-]{6,46}[a-z0-9]$/.test(runId)) {
  throw new Error("WEBMCP_D4_RUN_ID must be a lowercase alphanumeric slug of 8-48 characters");
}
if (!Number.isInteger(port) || port < 1024 || port > 65535 || [4317, 4321].includes(port)) {
  throw new Error("WEBMCP_D4_PORT must be an unused non-reserved port other than 4317 or 4321");
}
if (!Number.isInteger(restartCycle) || restartCycle < 1 || restartCycle > 2) {
  throw new Error("WEBMCP_D4_RESTART_CYCLE must be 1 or 2");
}
if (!automationId || !/^[a-z0-9][a-z0-9-]{1,79}$/.test(automationId)) {
  throw new Error("WEBMCP_D4_AUTOMATION_ID must identify the bounded D4 automation");
}
if (eventArm !== (restartCycle === 2)) {
  throw new Error("Only restart cycle 2 may create the single D4 event");
}

const runtimeDirectory = path.join(mvpRoot, "var", "d4-h2b", runId);
const observerPath = path.join(runtimeDirectory, "observer.jsonl");
const databasePath = path.join(runtimeDirectory, "runtime.sqlite");
const receiptPath = path.join(runtimeDirectory, "bounded-receipt.json");
const logPath = path.join(
  runtimeDirectory,
  eventArm ? "relaunch-event.jsonl" : "relaunch-no-event.jsonl",
);
const receiverLabel = `com.openai.webmcp.d4h2b.receiver.${runId}`;

if (!fs.existsSync(observerPath) || !fs.existsSync(databasePath)) {
  throw new Error("D4/H2b relaunch helper requires the live observer and isolated Receiver state");
}
if (fs.existsSync(logPath)) throw new Error("D4/H2b relaunch helper log already exists");
const privateReceipt = readPrivateReceipt();
let processContaminationLatch = null;

if (process.ppid !== 1) {
  record("helper_invalid_parent", {
    helper_ppid: process.ppid,
    launchd_parent_verified: false,
  });
  throw new Error("D4/H2b relaunch helper must be owned directly by launchd");
}

const startupProcesses = await processTable();
const ownAncestry = processAncestry(startupProcesses, process.pid);
if (ownAncestry.some((row) => row.command.includes("/ChatGPT.app/Contents/"))) {
  record("helper_invalid_ancestry", { chatgpt_ancestor_detected: true });
  throw new Error("D4/H2b relaunch helper must run outside the ChatGPT process tree");
}
const startupMainProcesses = chatGptMainProcesses(startupProcesses);
const startupCoreAppServerProcesses = chatGptCoreAppServerProcesses(startupProcesses);
if (
  startupMainProcesses.length !== 1 ||
  startupCoreAppServerProcesses.length !== 1
) {
  record("helper_invalid_app_baseline", {
    chatgpt_main_process_count: startupMainProcesses.length,
    chatgpt_core_app_server_process_count: startupCoreAppServerProcesses.length,
  });
  throw new Error(
    "D4/H2b relaunch helper requires one Desktop main and core app-server at startup",
  );
}
const startupMainIdentity = startupMainProcesses[0];
const startupLifecycleIdentities = chatGptLifecycleProcesses(startupProcesses)
  .map((row) => ({ pid: row.pid, started_at: row.startedAt }));
const contaminatingProcesses = assertNoProcessContamination(
  startupProcesses,
  "startup_preflight",
);

const receiverPreflight = await receiverServicePreflight(startupProcesses);
if (
  !receiverPreflight.present ||
  receiverPreflight.state !== "running" ||
  receiverPreflight.ppid !== 1 ||
  !receiverPreflight.command_matches ||
  receiverPreflight.chatgpt_ancestor_detected ||
  !receiverPreflight.exclusive_port_owner
) {
  record("helper_invalid_receiver", receiverPreflight);
  throw new Error("D4/H2b relaunch helper requires the expected launchd-owned Receiver");
}

const schedule = readSchedule();
const configSchedule = readConfigSchedule();
const scheduleContract = validateOneShotSchedule(schedule);
const configurationMatchesDatabase = scheduleConfigurationMatches(configSchedule, schedule);
const privateAutomationContractMatches = scheduleMatchesPrivateAutomationContract(schedule);
if (
  schedule.status !== "ACTIVE" ||
  !scheduleContract.valid ||
  !configurationMatchesDatabase ||
  !privateAutomationContractMatches ||
  !schedule.next_run_at ||
  Date.parse(schedule.next_run_at) - Date.now() < 4 * 60 * 1000
) {
  record("helper_invalid_schedule", {
    schedule,
    contract: scheduleContract,
    configuration_matches_database: configurationMatchesDatabase,
    private_automation_contract_matches: privateAutomationContractMatches,
    configuration_id_matches: configSchedule.id === automationId,
    configuration_status_matches: configSchedule.status === schedule.status,
    configuration_rrule_matches: configSchedule.rrule === schedule.rrule,
  });
  throw new Error("D4/H2b relaunch helper requires a future active one-shot schedule");
}

const before = receiverSnapshot();
const dueAt = Date.parse(schedule.next_run_at);
const requiredExpiryMarginMs = eventArm ? 8 * 60 * 1000 : 18 * 60 * 1000;
if (
  before.events !== 0 ||
  before.effects !== 0 ||
  before.artifact_revision !== 1 ||
  before.committed
) {
  record("helper_invalid_receiver_baseline", before);
  throw new Error("D4/H2b relaunch helper Receiver baseline is not clean Stage A");
}
if (
  !before.grant_expires_at ||
  Date.parse(before.grant_expires_at) - dueAt < requiredExpiryMarginMs
) {
  record("helper_insufficient_grant_lifetime", {
    event_arm: eventArm,
    grant_expires_at: before.grant_expires_at,
    next_run_at: schedule.next_run_at,
    required_expiry_margin_ms: requiredExpiryMarginMs,
  });
  throw new Error("D4/H2b Grant lifetime cannot cover the remaining paired controls");
}

const helperStartedAt = new Date().toISOString();
record("helper_started", {
  restart_cycle: restartCycle,
  event_arm: eventArm,
  observer_present: true,
  helper_ppid: process.ppid,
  launchd_parent_verified: true,
  chatgpt_ancestor_detected: false,
  configuration_matches_database: configurationMatchesDatabase,
  private_automation_contract_matches: privateAutomationContractMatches,
  startup_main_process: {
    pid: startupMainIdentity.pid,
    started_at: startupMainIdentity.startedAt,
  },
  startup_lifecycle_process_count: startupLifecycleIdentities.length,
  process_contamination_preflight: contaminatingProcesses,
  schedule,
  receiver_preflight: receiverPreflight,
  receiver: before,
});

const appAbsent = await waitForObserverEvent(
  "old_app_processes_all_absent",
  restartCycle,
  120_000,
  {
    notBefore: helperStartedAt,
    priorMainIdentity: startupMainIdentity,
  },
);
const rowsAfterObserver = await processTable();
const processContaminationAfterObserver = assertNoProcessContamination(
  rowsAfterObserver,
  "closure_acceptance",
);
const closedAfterObserver = desktopLifecycleSnapshot(
  rowsAfterObserver,
  startupLifecycleIdentities,
);
if (!closedAfterObserver.closed) {
  record("desktop_not_closed_after_observer_event", closedAfterObserver);
  throw new Error("D4/H2b Desktop was not fully closed after the observer absence event");
}
record("old_app_absence_observed", {
  restart_cycle: restartCycle,
  observer_observed_at: appAbsent.observed_at,
  process_contamination: processContaminationAfterObserver,
});

if (eventArm) {
  const rowsBeforeTrigger = await processTable();
  const processContaminationBeforeTrigger = assertNoProcessContamination(
    rowsBeforeTrigger,
    "before_trigger",
  );
  const closedBeforeTrigger = desktopLifecycleSnapshot(
    rowsBeforeTrigger,
    startupLifecycleIdentities,
  );
  if (!closedBeforeTrigger.closed) {
    record("event_trigger_aborted_desktop_open", closedBeforeTrigger);
    throw new Error("D4/H2b event arm requires Desktop to remain fully closed before trigger");
  }
  let stdout;
  try {
    ({ stdout } = await execFileAsync(process.execPath, [
      path.join(scriptsDirectory, "d4-h2b-command.mjs"),
      "trigger",
    ], {
      cwd: mvpRoot,
      env: {
        ...process.env,
        WEBMCP_D4_RUN_ID: runId,
        WEBMCP_D4_PORT: String(port),
      },
      maxBuffer: 1024 * 1024,
    }));
  } catch (error) {
    record("event_trigger_command_failed", { code: error.code ?? "ERROR" });
    throw new Error("D4/H2b event helper command failed closed");
  }
  const result = JSON.parse(stdout);
  const rowsAfterTrigger = await processTable();
  const processContaminationAfterTrigger = assertNoProcessContamination(
    rowsAfterTrigger,
    "after_trigger",
  );
  const closedAfterTrigger = desktopLifecycleSnapshot(
    rowsAfterTrigger,
    startupLifecycleIdentities,
  );
  const afterTrigger = receiverSnapshot();
  if (
    !closedAfterTrigger.closed ||
    result.delivery?.status !== "PENDING_HEARTBEAT" ||
    afterTrigger.events !== 1 ||
    afterTrigger.runs !== 1 ||
    afterTrigger.deliveries !== 1 ||
    afterTrigger.effects !== 0 ||
    afterTrigger.artifact_revision !== 1
  ) {
    record("event_trigger_failed_closed", afterTrigger);
    throw new Error("D4/H2b event arm did not persist exactly one pending event");
  }
  record("single_event_accepted_while_closed", {
    delivery_status: result.delivery.status,
    desktop_closed_before_trigger: closedBeforeTrigger,
    desktop_closed_after_trigger: closedAfterTrigger,
    process_contamination_before_trigger: processContaminationBeforeTrigger,
    process_contamination_after_trigger: processContaminationAfterTrigger,
    receiver: afterTrigger,
  });
}

const scheduleBeforeRelaunch = readSchedule();
const configScheduleBeforeRelaunch = readConfigSchedule();
const scheduleBeforeRelaunchContract = validateOneShotSchedule(scheduleBeforeRelaunch);
const configurationBeforeRelaunchMatchesDatabase = scheduleConfigurationMatches(
  configScheduleBeforeRelaunch,
  scheduleBeforeRelaunch,
);
const privateAutomationBeforeRelaunchMatches =
  scheduleMatchesPrivateAutomationContract(scheduleBeforeRelaunch);
const receiverBeforeRelaunch = await receiverServicePreflight(await processTable());
if (
  !scheduleBeforeRelaunchContract.valid ||
  !configurationBeforeRelaunchMatchesDatabase ||
  !privateAutomationBeforeRelaunchMatches ||
  !scheduleBeforeRelaunch.next_run_at ||
  Date.parse(scheduleBeforeRelaunch.next_run_at) - Date.now() < 2 * 60 * 1000
) {
  record("relaunch_aborted_due_too_close", {
    schedule: scheduleBeforeRelaunch,
    configuration_matches_database: configurationBeforeRelaunchMatchesDatabase,
    private_automation_contract_matches: privateAutomationBeforeRelaunchMatches,
    configuration_id_matches: configScheduleBeforeRelaunch.id === automationId,
    configuration_status_matches: configScheduleBeforeRelaunch.status === scheduleBeforeRelaunch.status,
    configuration_rrule_matches: configScheduleBeforeRelaunch.rrule === scheduleBeforeRelaunch.rrule,
  });
  throw new Error("D4/H2b next due time is too close to prove a healthy pre-due relaunch");
}
if (
  !receiverBeforeRelaunch.present ||
  receiverBeforeRelaunch.state !== "running" ||
  receiverBeforeRelaunch.ppid !== 1 ||
  !receiverBeforeRelaunch.command_matches ||
  receiverBeforeRelaunch.chatgpt_ancestor_detected ||
  !receiverBeforeRelaunch.exclusive_port_owner
) {
  record("relaunch_aborted_receiver_unavailable", receiverBeforeRelaunch);
  throw new Error("D4/H2b Receiver became unavailable before relaunch");
}

const rowsBeforeRelaunch = await processTable();
const processContaminationBeforeRelaunch = assertNoProcessContamination(
  rowsBeforeRelaunch,
  "before_relaunch",
);
const closedBeforeRelaunch = desktopLifecycleSnapshot(
  rowsBeforeRelaunch,
  startupLifecycleIdentities,
);
if (!closedBeforeRelaunch.closed) {
  record("relaunch_aborted_desktop_open", closedBeforeRelaunch);
  throw new Error("D4/H2b Desktop did not remain fully closed before relaunch");
}

const relaunchRequestedAt = new Date().toISOString();
record("launchservices_relaunch_requested", {
  restart_cycle: restartCycle,
  target_argument_supplied: false,
  desktop_closed_immediately_before_request: closedBeforeRelaunch,
  process_contamination: processContaminationBeforeRelaunch,
  schedule: scheduleBeforeRelaunch,
});
await execFileAsync("/usr/bin/open", ["-a", "ChatGPT"]);
record("launchservices_relaunch_command_completed", {
  restart_cycle: restartCycle,
  target_argument_supplied: false,
});

const appStarted = await waitForObserverEvent(
  "new_app_process_started",
  restartCycle,
  120_000,
  {
    notBefore: relaunchRequestedAt,
    priorMainIdentity: startupMainIdentity,
  },
);
const runtimeReady = await waitForObserverEvent(
  "replacement_app_runtime_ready",
  restartCycle,
  120_000,
  { notBefore: appStarted.observed_at },
);
const runtimeReadyRows = await processTable();
const processContaminationAtRuntimeReady = assertNoProcessContamination(
  runtimeReadyRows,
  "runtime_ready_acceptance",
);
const runtimeMultiplicityAtRuntimeReady = assertDesktopRuntimeMultiplicity(
  runtimeReadyRows,
  "runtime_ready_acceptance",
  startupMainIdentity,
);
const finalSchedule = readSchedule();
const runtimeReadyBeforeDue = finalSchedule.next_run_at
  ? Date.parse(finalSchedule.next_run_at) - Date.parse(runtimeReady.observed_at) >= 2 * 60 * 1000
  : false;
record("replacement_app_observed", {
  restart_cycle: restartCycle,
  observer_observed_at: appStarted.observed_at,
  runtime_ready_observed_at: runtimeReady.observed_at,
  replacement_started_before_due: runtimeReadyBeforeDue,
  process_contamination: processContaminationAtRuntimeReady,
  desktop_runtime_multiplicity: runtimeMultiplicityAtRuntimeReady,
  schedule: finalSchedule,
});

function assertNoProcessContamination(rows, checkpoint) {
  const currentSnapshot = d4ContaminatingProcessSnapshot(rows);
  const observerLatch = readObserverProcessContaminationLatch();
  if (
    processContaminationLatch === null &&
    (!currentSnapshot.clean || observerLatch !== null)
  ) {
    processContaminationLatch = {
      observed_at: observerLatch?.observed_at ?? new Date().toISOString(),
      detected_by: observerLatch ? "observer" : "helper",
      first_helper_checkpoint: checkpoint,
      current_snapshot: currentSnapshot,
      observer_event_observed_at: observerLatch?.observed_at ?? null,
    };
    record("helper_process_contamination_latched", processContaminationLatch);
  }
  if (processContaminationLatch !== null) {
    throw new Error(
      `D4/H2b helper rejected process contamination at ${checkpoint}`,
    );
  }
  return currentSnapshot;
}

function assertDesktopRuntimeMultiplicity(rows, checkpoint, priorMainIdentity) {
  const mainProcesses = chatGptMainProcesses(rows);
  const coreAppServerProcesses = chatGptCoreAppServerProcesses(rows);
  const replacementIdentityValid =
    mainProcesses.length === 1 &&
    !sameIdentity(mainProcesses[0], priorMainIdentity);
  const snapshot = {
    exact_single_replacement_runtime:
      replacementIdentityValid && coreAppServerProcesses.length === 1,
    chatgpt_main_process_count: mainProcesses.length,
    chatgpt_core_app_server_process_count: coreAppServerProcesses.length,
    replacement_main_identity_valid: replacementIdentityValid,
  };
  if (!snapshot.exact_single_replacement_runtime) {
    record("helper_desktop_runtime_multiplicity_rejected", {
      checkpoint,
      ...snapshot,
    });
    throw new Error(
      `D4/H2b helper rejected Desktop runtime multiplicity at ${checkpoint}`,
    );
  }
  return snapshot;
}

function readObserverProcessContaminationLatch() {
  if (!fs.existsSync(observerPath)) return null;
  for (const line of fs.readFileSync(observerPath, "utf8").split("\n")) {
    if (line.length === 0) continue;
    try {
      const entry = JSON.parse(line);
      if (entry.event === "observer_process_contamination_latched") return entry;
    } catch {
      return {
        observed_at: null,
        observer_log_parse_error: true,
      };
    }
  }
  return null;
}
if (!runtimeReadyBeforeDue) {
  record("arm_inconclusive_due_to_late_runtime", {
    restart_cycle: restartCycle,
    next_run_at: finalSchedule.next_run_at,
    runtime_ready_observed_at: runtimeReady.observed_at,
  });
  throw new Error("D4/H2b arm is inconclusive because runtime readiness was too close to due time");
}

function readSchedule() {
  const database = new DatabaseSync(automationDatabasePath, { readOnly: true });
  try {
    database.exec("BEGIN DEFERRED");
    const row = database.prepare(`
      SELECT status, rrule, next_run_at, last_run_at, updated_at, prompt,
             target_thread_id, kind
      FROM automations WHERE id = ?
    `).get(automationId);
    const otherActiveCount = database.prepare(`
      SELECT count(*) AS count FROM automations WHERE id <> ? AND status = 'ACTIVE'
    `).get(automationId).count;
    database.exec("COMMIT");
    if (!row) throw new Error("D4/H2b automation is missing");
    return {
      status: row.status,
      rrule: row.rrule,
      next_run_at: epochToIso(row.next_run_at),
      last_run_at: epochToIso(row.last_run_at),
      updated_at: epochToIso(row.updated_at),
      kind: row.kind,
      prompt_sha256: typeof row.prompt === "string"
        ? createHash("sha256").update(row.prompt).digest("hex")
        : null,
      target_thread_sha256: typeof row.target_thread_id === "string"
        ? createHash("sha256").update(row.target_thread_id).digest("hex")
        : null,
      prompt_forbidden_count: auditPrompt(row.prompt, privateReceipt),
      other_active_count: otherActiveCount,
    };
  } catch (error) {
    try {
      database.exec("ROLLBACK");
    } catch {
      // The failure may have occurred after the read transaction committed.
    }
    throw error;
  } finally {
    database.close();
  }
}

function readConfigSchedule() {
  const source = fs.readFileSync(automationPath, "utf8");
  return {
    id: parseTomlBasicString(source, "id"),
    status: parseTomlBasicString(source, "status"),
    rrule: parseTomlBasicString(source, "rrule"),
  };
}

function parseTomlBasicString(source, key) {
  const match = source.match(new RegExp(
    `^${key}\\s*=\\s*(\"(?:[^\"\\\\]|\\\\.)*\")\\s*$`,
    "m",
  ));
  if (!match) throw new Error(`D4/H2b automation TOML has no strict ${key} string`);
  try {
    return JSON.parse(match[1]);
  } catch {
    throw new Error(`D4/H2b automation TOML has an invalid ${key} string`);
  }
}

function scheduleConfigurationMatches(configSchedule, databaseSchedule) {
  return (
    configSchedule.id === automationId &&
    configSchedule.status === databaseSchedule.status &&
    configSchedule.rrule === databaseSchedule.rrule
  );
}

function scheduleMatchesPrivateAutomationContract(schedule) {
  return (
    schedule.kind === "heartbeat" &&
    schedule.prompt_sha256 === expectedPromptSha256 &&
    schedule.target_thread_sha256 === expectedTargetSha256 &&
    schedule.prompt_forbidden_count === 0 &&
    schedule.other_active_count === 0
  );
}

function receiverSnapshot() {
  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    database.exec("BEGIN DEFERRED");
    const workflow = database.prepare(`
      SELECT artifact_revision, committed FROM workflows WHERE workflow_id = 'WF-001'
    `).get();
    const grant = database.prepare(`SELECT min(expires_at) AS expires_at FROM grants`).get();
    const snapshot = {
      artifact_revision: workflow?.artifact_revision ?? null,
      committed: Boolean(workflow?.committed),
      events: count(database, "events"),
      runs: count(database, "runs"),
      deliveries: count(database, "heartbeat_deliveries"),
      effects: count(database, "workflow_effects"),
      grant_expires_at: grant?.expires_at ?? null,
    };
    database.exec("COMMIT");
    return snapshot;
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
}

function count(database, table) {
  return database.prepare(`SELECT count(*) AS count FROM ${table}`).get().count;
}

async function waitForObserverEvent(
  event,
  cycle,
  timeoutMs,
  { notBefore = null, priorMainIdentity = null } = {},
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    assertNoProcessContamination(
      await processTable(),
      `waiting_for_${event}`,
    );
    const entries = fs.readFileSync(observerPath, "utf8").split("\n").filter(Boolean)
      .flatMap((line) => {
        try {
          return [JSON.parse(line)];
        } catch {
          return [];
        }
      });
    const match = entries.find(
      (entry) =>
        entry.event === event &&
        entry.details?.restart_cycle === cycle &&
        (!notBefore || Date.parse(entry.observed_at) >= Date.parse(notBefore)) &&
        (
          !priorMainIdentity ||
          sameIdentity(entry.details?.prior_main_process ?? {}, priorMainIdentity)
        ),
    );
    if (match) {
      assertNoProcessContamination(
        await processTable(),
        `accepting_${event}`,
      );
      return match;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for observer event ${event} in restart cycle ${cycle}`);
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

async function receiverServicePreflight(rows) {
  try {
    const { stdout: service } = await execFileAsync("/bin/launchctl", [
      "print",
      `gui/${process.getuid()}/${receiverLabel}`,
    ]);
    const pid = Number.parseInt(service.match(/^\s*pid\s*=\s*(\d+)\s*$/m)?.[1] ?? "", 10);
    const state = service.match(/^\s*state\s*=\s*(\S+)\s*$/m)?.[1] ?? "UNKNOWN";
    const row = rows.find((candidate) => candidate.pid === pid);
    const ancestry = row ? processAncestry(rows, pid) : [];
    const { stdout: listeners } = await execFileAsync("/usr/sbin/lsof", [
      "-nP",
      `-iTCP:${port}`,
      "-sTCP:LISTEN",
      "-Fp",
    ]);
    const listenerPids = [...listeners.matchAll(/^p(\d+)$/gm)].map((match) => Number(match[1]));
    return {
      present: true,
      state,
      ppid: row?.ppid ?? null,
      command_matches: Boolean(
        row?.command.endsWith(`${path.join(scriptsDirectory, "d4-h2b-command.mjs")} start`),
      ),
      chatgpt_ancestor_detected: ancestry.some(
        (candidate) => candidate.command.includes("/ChatGPT.app/Contents/"),
      ),
      exclusive_port_owner: listenerPids.length === 1 && listenerPids[0] === pid,
    };
  } catch {
    return { present: false, exclusive_port_owner: false };
  }
}

function epochToIso(value) {
  return Number.isInteger(value) ? new Date(value).toISOString() : null;
}

function validateOneShotSchedule(schedule) {
  const match = schedule.rrule.match(
    /^DTSTART:(\d{8}T\d{6}Z)\nRRULE:FREQ=MINUTELY;INTERVAL=1;COUNT=1$/,
  );
  if (!match) return { valid: false, exact_form: false };
  const dtstartAt = parseBasicUtc(match[1]);
  if (!dtstartAt || !schedule.next_run_at || !schedule.updated_at) {
    return { valid: false, exact_form: true };
  }
  const nextMatchesDtstart = schedule.next_run_at === dtstartAt;
  const activationBufferMs = Date.parse(dtstartAt) - Date.parse(schedule.updated_at);
  return {
    valid: nextMatchesDtstart && activationBufferMs >= 5 * 60 * 1000,
    exact_form: true,
    dtstart_at: dtstartAt,
    next_matches_dtstart: nextMatchesDtstart,
    activation_buffer_ms: activationBufferMs,
  };
}

function auditPrompt(prompt, receipt) {
  const source = typeof prompt === "string" ? prompt : "";
  return [
    /\bWF-[A-Za-z0-9_-]+\b/.test(source),
    /\bhttps?:\/\//i.test(source),
    /\b(?:register_reentry_binding|get_pending_reentry_event|get_workflow_context|continue_artifact|acknowledge_reentry_effect)\b/i
      .test(source),
    /\bevt_[A-Za-z0-9_-]+\b/.test(source),
    /\bgr_[A-Za-z0-9_-]+\b/.test(source),
    /\bab_opaque_[A-Za-z0-9_-]+\b/.test(source),
    /\/receiver\/inboxes\/[A-Za-z0-9_-]+/i.test(source),
    /\b(?:receiver_inbox_url|canonical_url|workflow_id|authorized_event_type)\b/i.test(source),
    source.includes(receipt.receiver_inbox_url),
    source.includes(receipt.canonical_url),
    source.includes(receipt.workflow_id),
    source.includes(receipt.authorized_event_type),
  ].filter(Boolean).length;
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
      throw new Error("D4/H2b bounded receipt does not match the strict helper contract");
    }
  }
  return receipt;
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
