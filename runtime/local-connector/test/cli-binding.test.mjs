import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const entry = fileURLToPath(new URL("../src/main.mjs", import.meta.url));

test("bind-task captures only the current trusted Codex task and emits a redacted result", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-cli-binding-"));
  try {
    const filename = join(directory, "task-bindings.json");
    const result = spawnSync(process.execPath, [
      entry,
      "bind-task",
      "--json",
      "--grant-id",
      "grant_cli_001",
      "--task-binding-file",
      filename,
    ], {
      encoding: "utf8",
      env: { ...process.env, CODEX_SESSION_ID: "task_cli_001" },
    });

    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    const output = JSON.parse(result.stdout);
    assert.equal(output.event, "local_task_binding_captured");
    assert.equal(output.grant_id, "grant_cli_001");
    assert.equal(output.adapter_id, "codex_queue_local");
    assert.equal("binding_ref" in output, false);
    assert.equal(result.stdout.includes("task_cli_001"), false);
    const persisted = JSON.parse(await readFile(filename, "utf8"));
    assert.equal(persisted.bindings[0].binding_ref, "task_cli_001");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("bind-task fails closed outside the trusted Codex task runtime", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-cli-binding-"));
  try {
    const result = spawnSync(process.execPath, [
      entry,
      "bind-task",
      "--json",
      "--grant-id",
      "grant_cli_001",
      "--task-binding-file",
      join(directory, "task-bindings.json"),
    ], {
      encoding: "utf8",
      env: { ...process.env, CODEX_SESSION_ID: "" },
    });

    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /"code":"local_task_binding_runtime_unavailable"/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("bind-task rejects raw caller-selected task flags", () => {
  const result = spawnSync(process.execPath, [
    entry,
    "bind-task",
    "--json",
    "--grant-id",
    "grant_cli_001",
    "--codex-thread",
    "task_cli_001",
  ], { encoding: "utf8" });

  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /"code":"connector_argument_invalid"/);
});
