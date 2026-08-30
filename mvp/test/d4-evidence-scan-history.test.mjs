import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  validateAutomationObservationHistory,
  validateCurrentAutomationRow,
} from
  "../scripts/d4-h2b-evidence-scan.mjs";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const scannerPath = path.resolve(
  testDirectory,
  "..",
  "scripts",
  "d4-h2b-evidence-scan.mjs",
);

const expected = {
  expectedAutomationIdSha256: "a".repeat(64),
  expectedTargetThreadSha256: "b".repeat(64),
  expectedPromptSha256: "c".repeat(64),
  expectedArmCount: 1,
};

test("accepts a complete observer history whose automation contract never drifts", () => {
  const result = validateAutomationObservationHistory({
    entries: validHistory(),
    ...expected,
  });

  assert.deepEqual(result, {
    observer_start_count: 1,
    state_snapshot_count: 2,
    arm_started_count: 1,
    arm_closed_count: 1,
  });
});

test("fails closed when an interim prompt digest drifts and later recovers", () => {
  const entries = validHistory();
  entries.splice(3, 0, event("2026-08-30T19:00:02.500Z", "automation_state_change", {
    ...validSnapshot(),
    prompt_audit: {
      ...validSnapshot().prompt_audit,
      sha256: "d".repeat(64),
    },
  }));

  assert.throws(
    () => validateAutomationObservationHistory({ entries, ...expected }),
    /^Error: The D4\/H2b observer recorded automation contract drift$/,
  );
});

test("fails closed when an interim target digest or audit schema drifts", () => {
  const entries = validHistory();
  entries[2] = event("2026-08-30T19:00:02.000Z", "automation_state_change", {
    ...validSnapshot(),
    target_thread_sha256: "e".repeat(64),
  });

  assert.throws(
    () => validateAutomationObservationHistory({ entries, ...expected }),
    /^Error: The D4\/H2b observer recorded automation contract drift$/,
  );

  const truncatedAudit = validHistory();
  delete truncatedAudit[2].details.prompt_audit.forbidden.receipt_field_name;
  assert.throws(
    () => validateAutomationObservationHistory({
      entries: truncatedAudit,
      ...expected,
    }),
    /^Error: The D4\/H2b observer recorded automation contract drift$/,
  );
});

test("fails closed on explicit contract or process-contamination evidence", () => {
  for (const failingEvent of [
    "automation_arm_contract_violation",
    "observer_process_contamination_latched",
    "desktop_closure_rejected_process_contamination",
    "observer_desktop_runtime_multiplicity_latched",
  ]) {
    const entries = validHistory();
    entries.splice(3, 0, event(
      "2026-08-30T19:00:02.500Z",
      failingEvent,
      {},
    ));

    assert.throws(
      () => validateAutomationObservationHistory({ entries, ...expected }),
      /^Error: The D4\/H2b observer history contains a fail-closed event$/,
    );
  }

  const nonPassingArm = validHistory();
  nonPassingArm.at(-1).details.pass_candidate = false;
  assert.throws(
    () => validateAutomationObservationHistory({
      entries: nonPassingArm,
      ...expected,
    }),
    /^Error: The D4\/H2b closed automation arm contains invalid history$/,
  );
});

test("fails closed when an observer error or polling gap weakens the history", () => {
  for (const failingEvent of [
    "observer_error",
    "observer_polling_gap",
    "automation_arm_observer_polling_gap",
  ]) {
    const entries = validHistory();
    entries.splice(3, 0, event("2026-08-30T19:00:02.500Z", failingEvent, {}));

    assert.throws(
      () => validateAutomationObservationHistory({ entries, ...expected }),
      /^Error: The D4\/H2b observer history contains a fail-closed event$/,
    );
  }
});

test("fails closed when snapshots or a complete arm are absent", () => {
  const entries = validHistory().filter((entry) => entry.event !== "automation_state_change");

  assert.throws(
    () => validateAutomationObservationHistory({ entries, ...expected }),
    /^Error: The D4\/H2b observer history is incomplete$/,
  );

  const zeroArmHistory = validHistory().filter(
    (entry) => !entry.event.startsWith("automation_arm_"),
  );
  assert.throws(
    () => validateAutomationObservationHistory({
      entries: zeroArmHistory,
      ...expected,
    }),
    /^Error: The D4\/H2b observer history is incomplete$/,
  );

  assert.throws(
    () => validateAutomationObservationHistory({
      entries: validHistory(),
      ...expected,
      expectedArmCount: 2,
    }),
    /^Error: The D4\/H2b observer history is incomplete$/,
  );
});

test("fails closed when an automation arm has no closure record", () => {
  const entries = validHistory().filter((entry) => entry.event !== "automation_arm_closed");

  assert.throws(
    () => validateAutomationObservationHistory({ entries, ...expected }),
    /^Error: The D4\/H2b observer history is incomplete$/,
  );
});

test("fails closed when the automation disappears during an active arm", () => {
  const entries = validHistory();
  entries[2] = event("2026-08-30T19:00:02.000Z", "automation_state_change", {
    present: false,
  });

  assert.throws(
    () => validateAutomationObservationHistory({ entries, ...expected }),
    /^Error: The D4\/H2b automation disappeared during observed history$/,
  );
});

test("fails closed when the automation disappears after an arm closes", () => {
  const entries = validHistory();
  entries.push(event("2026-08-30T19:00:05.000Z", "automation_state_change", {
    present: false,
  }));

  assert.throws(
    () => validateAutomationObservationHistory({ entries, ...expected }),
    /^Error: The D4\/H2b automation disappeared during observed history$/,
  );
});

test("failure messages never include observed or expected digest values", () => {
  const entries = validHistory();
  const unexpectedDigest = "f".repeat(64);
  entries[2] = event("2026-08-30T19:00:02.000Z", "automation_state_change", {
    ...validSnapshot(),
    prompt_audit: {
      ...validSnapshot().prompt_audit,
      sha256: unexpectedDigest,
    },
  });

  assert.throws(
    () => validateAutomationObservationHistory({ entries, ...expected }),
    (error) => {
      assert.equal(error.message.includes(unexpectedDigest), false);
      assert.equal(error.message.includes(expected.expectedPromptSha256), false);
      return true;
    },
  );

  const cliFailure = spawnSync(process.execPath, [scannerPath], {
    encoding: "utf8",
    env: {
      ...process.env,
      WEBMCP_D4_RUN_ID: "INVALID",
    },
  });
  assert.equal(cliFailure.status, 1);
  assert.equal(cliFailure.stdout, "");
  assert.equal(cliFailure.stderr, `${JSON.stringify({ safe: false })}\n`);
});

test("accepts only a current automation row matching the pinned prompt and target", () => {
  assert.doesNotThrow(() => validateCurrentAutomationRow({
    automation: {
      prompt: "fixed trigger prompt",
      target_thread_id: "fixed target task",
      kind: "heartbeat",
      status: "PAUSED",
      next_run_at: null,
    },
    expectedPrompt: "fixed trigger prompt",
    expectedTargetThreadId: "fixed target task",
  }));

  for (const unsafeState of [
    { status: "ACTIVE", next_run_at: null },
    { status: "PAUSED", next_run_at: 1788120000 },
  ]) {
    assert.throws(
      () => validateCurrentAutomationRow({
        automation: {
          prompt: "fixed trigger prompt",
          target_thread_id: "fixed target task",
          kind: "heartbeat",
          ...unsafeState,
        },
        expectedPrompt: "fixed trigger prompt",
        expectedTargetThreadId: "fixed target task",
      }),
      /^Error: The D4\/H2b current automation row is not safely paused$/,
    );
  }
});

test("fails closed when the current automation row is missing", () => {
  assert.throws(
    () => validateCurrentAutomationRow({
      automation: undefined,
      expectedPrompt: "fixed trigger prompt",
      expectedTargetThreadId: "fixed target task",
    }),
    /^Error: The D4\/H2b current automation row is missing$/,
  );
});

test("current-row drift errors do not expose prompt or target values", () => {
  const privatePrompt = "private prompt value";
  const privateTarget = "private target value";
  assert.throws(
    () => validateCurrentAutomationRow({
      automation: {
        prompt: "different prompt value",
        target_thread_id: privateTarget,
        kind: "heartbeat",
        status: "PAUSED",
        next_run_at: null,
      },
      expectedPrompt: privatePrompt,
      expectedTargetThreadId: privateTarget,
    }),
    (error) => {
      assert.equal(error.message.includes(privatePrompt), false);
      assert.equal(error.message.includes(privateTarget), false);
      return true;
    },
  );
});

function validHistory() {
  return [
    event("2026-08-30T19:00:00.000Z", "observer_started", {
      automation_preflight: validSnapshot({ status: "PAUSED" }),
    }),
    event("2026-08-30T19:00:01.000Z", "automation_arm_started", {
      initial_preflight_valid: true,
      configuration_matches_database: true,
      initial_next_run_was_future: true,
    }),
    event("2026-08-30T19:00:02.000Z", "automation_state_change", validSnapshot()),
    event("2026-08-30T19:00:03.000Z", "automation_state_change", validSnapshot()),
    event("2026-08-30T19:00:04.000Z", "automation_arm_closed", {
      automation_contract_violation_count: 0,
      observer_error_count: 0,
      observer_polling_gap_count: 0,
      process_contamination_violation_count: 0,
      process_contamination_preserved: true,
      desktop_runtime_multiplicity_violation_count: 0,
      desktop_runtime_multiplicity_preserved: true,
      configuration_matches_database: true,
      private_automation_contract_matches: true,
      pass_candidate: true,
    }),
  ];
}

function validSnapshot(overrides = {}) {
  return {
    present: true,
    automation_id_sha256: expected.expectedAutomationIdSha256,
    target_thread_sha256: expected.expectedTargetThreadSha256,
    kind: "heartbeat",
    other_active_count: 0,
    configuration_matches_database: true,
    prompt_audit: {
      sha256: expected.expectedPromptSha256,
      forbidden_count: 0,
      forbidden: {
        workflow_id: false,
        absolute_url: false,
        site_tool_name: false,
        event_id: false,
        grant_id: false,
        opaque_binding: false,
        inbox_bearer: false,
        receipt_field_name: false,
      },
      exact_receipt_value_matches: {
        receiver_inbox_url: false,
        canonical_url: false,
        workflow_id: false,
        authorized_event_type: false,
      },
    },
    ...overrides,
  };
}

function event(observedAt, eventName, details) {
  return {
    observed_at: observedAt,
    event: eventName,
    details,
  };
}
