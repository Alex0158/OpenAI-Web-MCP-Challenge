import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const scriptsDirectory = path.resolve(testDirectory, "..", "scripts");
const observerSource = fs.readFileSync(
  path.join(scriptsDirectory, "d4-h2b-observer.mjs"),
  "utf8",
);
const helperSource = fs.readFileSync(
  path.join(scriptsDirectory, "d4-h2b-relaunch-helper.mjs"),
  "utf8",
);

function extractFunction(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `Missing function marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing function boundary: ${endMarker}`);
  return source.slice(start, end);
}

test("observer latches transient relay contamination into active-arm evidence", () => {
  const functionSource = extractFunction(
    observerSource,
    "function observeProcessContamination(rows)",
    "function chatGptProcessSnapshot(rows)",
  );
  const records = [];
  const harness = Function(
    "d4ContaminatingProcessSnapshot",
    "record",
    `
      let processContaminationLatch = null;
      let desktopRuntimeMultiplicityLatch = null;
      let activeAutomationArm = {
        sequence: 2,
        processContaminationViolationCount: 0,
        processContaminationObservedAt: null,
        desktopRuntimeMultiplicityViolationCount: 0,
        desktopRuntimeMultiplicityObservedAt: null,
      };
      ${functionSource}
      return {
        observeProcessContamination,
        observeDesktopRuntimeMultiplicity,
        getLatch: () => processContaminationLatch,
        getMultiplicityLatch: () => desktopRuntimeMultiplicityLatch,
        getArm: () => activeAutomationArm,
      };
    `,
  )(
    (rows) => rows.snapshot,
    (event, details) => records.push({ event, details }),
  );

  harness.observeProcessContamination({ snapshot: {
    clean: false,
    codex_app_tools_relay_process_count: 1,
  } });
  harness.observeProcessContamination({ snapshot: {
    clean: true,
    codex_app_tools_relay_process_count: 0,
  } });
  harness.observeDesktopRuntimeMultiplicity({
    main_processes: [{ pid: 1 }, { pid: 2 }],
    app_server_processes: [{ pid: 3 }],
  });
  harness.observeDesktopRuntimeMultiplicity({
    main_processes: [{ pid: 2 }],
    app_server_processes: [{ pid: 3 }],
  });

  assert.equal(harness.getLatch().clean, false);
  assert.equal(harness.getArm().processContaminationViolationCount, 1);
  assert.equal(harness.getMultiplicityLatch().chatgpt_main_process_count, 2);
  assert.equal(harness.getArm().desktopRuntimeMultiplicityViolationCount, 1);
  assert.equal(records.length, 2);
  assert.equal(records[0].event, "observer_process_contamination_latched");
  assert.equal(records[1].event, "observer_desktop_runtime_multiplicity_latched");
});

test("helper keeps rejecting after current process contamination disappears", () => {
  const functionSource = extractFunction(
    helperSource,
    "function assertNoProcessContamination(rows, checkpoint)",
    "function readObserverProcessContaminationLatch()",
  );
  const records = [];
  let currentSnapshot = {
    clean: false,
    codex_app_tools_relay_process_count: 1,
  };
  const harness = Function(
    "d4ContaminatingProcessSnapshot",
    "readObserverProcessContaminationLatch",
    "record",
    `
      let processContaminationLatch = null;
      ${functionSource}
      return {
        assertNoProcessContamination,
        getLatch: () => processContaminationLatch,
      };
    `,
  )(
    () => currentSnapshot,
    () => null,
    (event, details) => records.push({ event, details }),
  );

  assert.throws(
    () => harness.assertNoProcessContamination([], "before_trigger"),
    /rejected process contamination at before_trigger/,
  );
  currentSnapshot = {
    clean: true,
    codex_app_tools_relay_process_count: 0,
  };
  assert.throws(
    () => harness.assertNoProcessContamination([], "before_relaunch"),
    /rejected process contamination at before_relaunch/,
  );

  assert.equal(harness.getLatch().detected_by, "helper");
  assert.equal(records.length, 1);
  assert.equal(records[0].event, "helper_process_contamination_latched");
});

test("helper inherits the observer latch and guards every critical transition", () => {
  const functionSource = extractFunction(
    helperSource,
    "function assertNoProcessContamination(rows, checkpoint)",
    "function readObserverProcessContaminationLatch()",
  );
  const observerObservedAt = "2026-08-30T20:00:00.000Z";
  const harness = Function(
    "d4ContaminatingProcessSnapshot",
    "readObserverProcessContaminationLatch",
    "record",
    `
      let processContaminationLatch = null;
      ${functionSource}
      return {
        assertNoProcessContamination,
        getLatch: () => processContaminationLatch,
      };
    `,
  )(
    () => ({ clean: true, codex_app_tools_relay_process_count: 0 }),
    () => ({ observed_at: observerObservedAt }),
    () => {},
  );

  assert.throws(
    () => harness.assertNoProcessContamination([], "closure_acceptance"),
    /rejected process contamination at closure_acceptance/,
  );
  assert.equal(harness.getLatch().detected_by, "observer");
  assert.equal(harness.getLatch().observed_at, observerObservedAt);

  for (const checkpoint of [
    "closure_acceptance",
    "before_trigger",
    "after_trigger",
    "before_relaunch",
    "runtime_ready_acceptance",
    "waiting_for_${event}",
    "accepting_${event}",
  ]) {
    assert.ok(
      helperSource.includes(`"${checkpoint}"`) ||
        helperSource.includes(`\`${checkpoint}\``),
      `Missing checkpoint ${checkpoint}`,
    );
  }

  const contaminationPoll = observerSource.indexOf(
    "observeProcessContamination(currentRows);",
  );
  const closureSnapshot = observerSource.indexOf(
    "const desktopLifecycle = desktopLifecycleSnapshot(currentRows, trackedIdentities);",
  );
  const closureEvent = observerSource.indexOf(
    "record(\"old_app_processes_all_absent\"",
  );
  assert.ok(contaminationPoll !== -1 && contaminationPoll < closureSnapshot);
  assert.ok(closureSnapshot < closureEvent);
  assert.match(
    observerSource.slice(closureSnapshot, closureEvent),
    /processContaminationLatch === null/,
  );
  assert.match(
    observerSource,
    /arm\.processContaminationViolationCount === 0/,
  );
  assert.match(
    helperSource,
    /observer_log_parse_error:\s*true/,
  );
  assert.match(
    observerSource,
    /processes\.main_processes\.length === 1/,
  );
  assert.match(
    observerSource,
    /desktopRuntimeMultiplicityLatch === null/,
  );
  const runtimeSnapshotSource = extractFunction(
    observerSource,
    "function chatGptProcessSnapshot(rows)",
    "async function processTable()",
  );
  assert.match(
    runtimeSnapshotSource,
    /app_server_processes:\s*chatGptCoreAppServerProcesses\(rows\)\s*\.map/,
  );
  assert.doesNotMatch(
    runtimeSnapshotSource,
    /chatGptCoreAppServerProcesses\(rows\)\s*\.filter/,
  );
  assert.match(
    helperSource,
    /assertDesktopRuntimeMultiplicity\([\s\S]*runtime_ready_acceptance/,
  );
});
