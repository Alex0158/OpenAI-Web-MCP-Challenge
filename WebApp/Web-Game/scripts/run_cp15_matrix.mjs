import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const node = process.execPath;
const tsx = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");
const tsc = path.join(root, "node_modules", "typescript", "bin", "tsc");
const env = { ...process.env, PATH: `${path.dirname(node)}${path.delimiter}${process.env.PATH ?? ""}` };

function command(label, executable, args) {
  return { label, executable, args };
}

function tsxTest(label, ...files) {
  return command(label, node, [tsx, "--test", ...files]);
}

const rows = [
  {
    id: "V05",
    label: "CP-05 persistence, event, signal, and outbox atomicity",
    commands: [tsxTest("CP-05 persistence", "tests/cp05-persistence.test.ts")],
  },
  {
    id: "V06",
    label: "CP-06 clock, phase order, trusted recovery, scheduler, and restart",
    commands: [
      tsxTest(
        "CP-06 contract",
        "tests/cp06-clock-recovery.test.ts",
        "tests/cp06-gameplay-phase-coordinator.test.ts",
        "tests/cp06-autonomous-scheduler.test.ts",
      ),
      tsxTest("CP-06 autonomous process", "tests/cp06-autonomous-runtime.test.ts"),
    ],
  },
  {
    id: "V07",
    label: "CP-07 deterministic fixture, identity, reset, and restart",
    commands: [tsxTest("CP-07 fixture", "tests/cp07-world-fixture.test.ts")],
  },
  {
    id: "V08",
    label: "CP-08 movement, gateway, projection, realtime, and wire races",
    commands: [
      tsxTest("CP-08 movement/snapshot", "tests/cp08-movement-snapshot.test.ts"),
      tsxTest("CP-08 cadence", "tests/cp08-worker-movement.test.ts"),
      tsxTest("CP-08 gateway", "tests/cp08-worker-gateway.test.ts"),
      tsxTest("CP-08 realtime snapshot", "tests/cp08-realtime-snapshot.test.ts"),
      tsxTest("CP-08 realtime wire", "tests/cp08-realtime-wire.test.ts"),
    ],
  },
  {
    id: "V09",
    label: "CP-09 mission dispatch, role lock, route, and arrival",
    commands: [
      tsxTest(
        "CP-09 dispatch/route",
        "tests/cp09-mission-dispatch.test.ts",
        "tests/cp09-route-milestone.test.ts",
      ),
    ],
  },
  {
    id: "V10",
    label: "CP-10 extraction, contest, return, deposit, and settlement",
    commands: [
      tsxTest(
        "CP-10 extraction/cadence",
        "tests/cp09-mission-dispatch.test.ts",
        "tests/cp09-route-milestone.test.ts",
        "tests/cp10-first-extraction.test.ts",
        "tests/cp10-extraction-cadence.test.ts",
      ),
      tsxTest("CP-10 return", "tests/cp10-return-navigation.test.ts"),
      tsxTest("CP-10 deposit/settlement", "tests/cp10-deposit-settlement.test.ts"),
    ],
  },
  {
    id: "V11",
    label: "CP-11 combat, cargo loss, Hunter victory, reissue, and restart",
    commands: [
      tsxTest("CP-11 gatherer combat", "tests/cp11-combat.test.ts"),
      tsxTest("CP-11 Hunter", "tests/cp11-hunter.test.ts"),
      tsxTest("CP-11 reissue", "tests/cp11-reissue.test.ts"),
    ],
  },
  {
    id: "V12",
    label: "CP-12 projection, visual parity, fixture session, reconnect, input, and dispatch",
    commands: [
      tsxTest("CP-12 projection", "tests/cp12-projection.test.ts"),
      tsxTest("CP-12 visual", "tests/cp12-visual-assets.test.tsx"),
      tsxTest("CP-12 fixture", "tests/cp12-fixture-session.test.ts"),
      tsxTest("CP-12 reconnect", "tests/cp12-reconnect.test.ts"),
      tsxTest("CP-12 keyboard", "tests/cp12-keyboard-movement.test.ts"),
      tsxTest(
        "CP-12 dispatch",
        "tests/cp12-gatherer-dispatch-http.test.ts",
        "tests/cp12-gatherer-dispatch-client.test.ts",
        "tests/cp12-gatherer-dispatch-ui.test.tsx",
        "tests/cp12-gatherer-dispatch-server-hardening.test.ts",
        "tests/cp12-gatherer-dispatch-rejection-refresh.test.ts",
      ),
    ],
  },
  {
    id: "V13",
    label: "CP-13 capability and ownership boundary",
    gated: "Positive page-bound WebMCP remains gated by SK-ISSUE-001; the unavailable capability outcome is already recorded by SK-EVID-030.",
  },
  {
    id: "V14",
    label: "CP-14 signal eligibility, coalescing, lease, retry, and external handoff",
    gated: "The external Receiver/Connector handoff is not available; game-side delivery remains preparation-only and cannot be counted as a live pass.",
  },
  {
    id: "V15",
    label: "Matrix integrity, trace support, type contract, docs, and sensitive evidence",
    commands: [
      tsxTest("isolated deterministic trace support", "tests/side-chat-cp15-trace-toolkit.test.ts"),
      command("TypeScript", node, [tsc, "--noEmit"]),
      command("documentation self-tests", "python3", ["scripts/test_validate_game_docs.py"]),
      command("documentation validation", "python3", ["scripts/validate_game_docs.py", "--root", ".", "--report"]),
    ],
  },
  {
    id: "V16",
    label: "CP-16 clean two-player causal story",
    notRun: "CP-16 owns the browser/session slice and timestamped causal trace after this CP-15 matrix closes.",
  },
];

function runCommand(rowId, item) {
  console.log(`\n[${rowId}] ${item.label}`);
  const result = spawnSync(item.executable, item.args, {
    cwd: root,
    env,
    stdio: "inherit",
  });
  if (result.error) {
    console.error(`[${rowId}] ${item.label}: ${result.error.message}`);
    return false;
  }
  if (result.status !== 0) {
    console.error(`[${rowId}] ${item.label}: exit=${result.status ?? "null"} signal=${result.signal ?? "null"}`);
    return false;
  }
  return true;
}

function scanEvidenceForSecretAssignments() {
  const evidenceRoot = path.join(root, "Docs", "Evidence");
  const patterns = [
    /api[_-]?key\s*[:=]\s*["']?[A-Za-z0-9+/=_-]{16,}/i,
    /authorization\s*:\s*bearer\s+[A-Za-z0-9._-]{16,}/i,
    /set-cookie\s*:\s*[^\s`=]+=[A-Za-z0-9+/._=-]{32,}/i,
    /password\s*[:=]\s*["']?[^\s`]{8,}/i,
    /secret\s*[:=]\s*["']?[A-Za-z0-9+/=_-]{16,}/i,
  ];
  const findings = [];
  for (const entry of fs.readdirSync(evidenceRoot, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }
    const filePath = path.join(evidenceRoot, entry.name);
    const lines = fs.readFileSync(filePath, "utf8").split("\n");
    lines.forEach((line, index) => {
      if (patterns.some((pattern) => pattern.test(line))) {
        findings.push(`${entry.name}:${index + 1}`);
      }
    });
  }
  console.log("\n[V15] sensitive-evidence scan");
  if (findings.length > 0) {
    console.error(`[V15] findings: ${findings.join(", ")}`);
    return false;
  }
  console.log("[V15] no secret-like assignments found in Docs/Evidence/*.md");
  return true;
}

const onlyRow = process.argv.indexOf("--only") >= 0
  ? process.argv[process.argv.indexOf("--only") + 1]
  : null;
const selectedRows = onlyRow === null ? rows : rows.filter((row) => row.id === onlyRow);
if (onlyRow !== null && selectedRows.length === 0) {
  console.error(`Unknown CP-15 row: ${onlyRow}`);
  process.exitCode = 2;
}

const results = [];
for (const row of selectedRows) {
  if (row.gated) {
    console.log(`\n[${row.id}] GATED: ${row.gated}`);
    results.push({ id: row.id, status: "gated" });
    continue;
  }
  if (row.notRun) {
    console.log(`\n[${row.id}] NOT_RUN: ${row.notRun}`);
    results.push({ id: row.id, status: "not-run" });
    continue;
  }
  const passed = row.commands.every((item) => runCommand(row.id, item));
  results.push({ id: row.id, status: passed ? "pass" : "fail" });
  if (!passed) {
    break;
  }
  if (row.id === "V15" && !scanEvidenceForSecretAssignments()) {
    results[results.length - 1].status = "fail";
    break;
  }
}

const failed = results.filter((result) => result.status === "fail");
console.log("\nCP-15 matrix result");
for (const result of results) {
  console.log(`- ${result.id}: ${result.status}`);
}
if (failed.length > 0) {
  console.error(`CP-15 aggregate failed at ${failed.map((result) => result.id).join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("CP-15 required local rows passed; gated and downstream rows remain explicitly bounded.");
}
