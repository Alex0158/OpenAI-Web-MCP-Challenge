import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const entry = fileURLToPath(new URL("../src/main.mjs", import.meta.url));
const diagnostics = {
  readiness_scope: "local_cli_prerequisites",
  default_activation_route: "fresh_session_preview",
  existing_task_binding: "capture_available_not_verified",
  active_task_bindings: 0,
  same_task_wake: "not_verified",
  browser_webmcp: "not_checked",
};

async function createFixture(t) {
  const directory = await mkdtemp(join(tmpdir(), "local-connector-doctor-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const executable = join(directory, "codex");
  const callLog = join(directory, "calls.log");
  await writeFile(callLog, "");
  await writeFile(executable, `#!/bin/sh
printf '%s\\n' "$#" "$@" >> "$DOCTOR_TEST_CALL_LOG"
if [ "$#" -ne 1 ] || [ "$1" != "--version" ]; then exit 90; fi
if [ "$DOCTOR_TEST_FAIL_VERSION" = "1" ]; then
  printf '%s\\n' 'fixture-private-error' >&2
  exit 1
fi
printf '%s\\n' 'codex-cli 0.999.0'
`, { mode: 0o755 });
  return { directory, executable, callLog };
}

function runDoctor(fixture, flags, options = {}) {
  const argumentsList = [entry, "doctor", "--codex-binary", fixture.executable, ...flags];
  if (options.tty) {
    argumentsList.unshift("--input-type=module", "--eval", `
Object.defineProperty(process.stdout, "isTTY", { value: true });
await import(${JSON.stringify(pathToFileURL(entry).href)});
`);
  }
  return spawnSync(process.execPath, argumentsList, {
    cwd: fixture.directory,
    encoding: "utf8",
    timeout: 10_000,
    maxBuffer: 64 * 1024,
    env: {
      PATH: fixture.directory,
      NO_COLOR: "1",
      DOCTOR_TEST_CALL_LOG: fixture.callLog,
      DOCTOR_TEST_FAIL_VERSION: options.failVersion ? "1" : "0",
    },
  });
}

function assertSuccessfulReport(result, fixture, workingDirectory) {
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout.trim().split("\n").length, 1);
  assert.deepEqual(JSON.parse(result.stdout), {
    event: "connector_ready",
    node_version: process.versions.node,
    codex_binary: fixture.executable,
    codex_version: "codex-cli 0.999.0",
    codex_working_directory: workingDirectory,
    ...diagnostics,
  });
}

test("doctor JSON preserves its preflight result and explicitly limits same-task readiness", async (t) => {
  const fixture = await createFixture(t);
  const result = runDoctor(fixture, ["--json", "--codex-cd", fixture.directory]);

  assertSuccessfulReport(result, fixture, fixture.directory);
  assert.equal(await readFile(fixture.callLog, "utf8"), "1\n--version\n");
});

test("piped doctor output retains the same limitations without a selected workspace", async (t) => {
  const fixture = await createFixture(t);
  const result = runDoctor(fixture, []);

  assertSuccessfulReport(result, fixture, null);
  assert.equal(await readFile(fixture.callLog, "utf8"), "1\n--version\n");
});

test("doctor terminal output warns that CLI preflight does not verify same-task continuation", async (t) => {
  const fixture = await createFixture(t);
  const result = runDoctor(fixture, ["--codex-cd", fixture.directory], { tty: true });

  assert.equal(result.error, undefined);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /Local CLI preflight/);
  assert.match(result.stdout, /local CLI prerequisites only/);
  assert.match(result.stdout, /fresh-session preview/);
  assert.match(result.stdout, /trusted capture is available; no private Grant binding is captured yet/);
  assert.match(result.stdout, /Same-task wake is not verified/);
  assert.match(result.stdout, /Browser\/WebMCP is not checked/);
  assert.doesNotMatch(result.stdout, /Confirm that this Mac is ready for Re-entry/);
  assert.equal(await readFile(fixture.callLog, "utf8"), "1\n--version\n");
});

test("doctor keeps an explicit missing binary failure nonzero without falling back", async (t) => {
  const fixture = await createFixture(t);
  const result = runDoctor({ ...fixture, executable: join(fixture.directory, "missing") }, ["--json"]);

  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(JSON.parse(result.stderr).code, "connector_codex_binary_not_found");
  assert.equal(await readFile(fixture.callLog, "utf8"), "");
});

test("doctor does not report readiness when the version-only executable fails", async (t) => {
  const fixture = await createFixture(t);
  const result = runDoctor(fixture, ["--json"], { failVersion: true });

  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(JSON.parse(result.stderr).code, "connector_codex_unusable");
  assert.doesNotMatch(result.stderr, /fixture-private-error/);
  assert.equal(await readFile(fixture.callLog, "utf8"), "1\n--version\n");
});

test("doctor rejects an unsupported flag before executing the version-only fixture", async (t) => {
  const fixture = await createFixture(t);
  const result = runDoctor(fixture, ["--json", "--codex-thread", "fixture-task"]);

  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(JSON.parse(result.stderr).code, "connector_argument_invalid");
  assert.equal(await readFile(fixture.callLog, "utf8"), "");
});
