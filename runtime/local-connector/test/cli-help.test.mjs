import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const entry = fileURLToPath(new URL("../src/main.mjs", import.meta.url));
const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

test("CLI help presents the account-first install path", () => {
  const result = spawnSync(process.execPath, [entry, "--help"], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /Re-entry Local Connector/);
  assert.match(result.stdout, /re-entry install/);
  assert.match(result.stdout, /interactive mode offers a folder picker if omitted/);
  assert.match(result.stdout, /stop         Stop the background Connector/);
  assert.match(result.stdout, /uninstall    Stop the Connector/);
  assert.match(result.stdout, /listen       Watch the background Connector/);
  assert.match(result.stdout, /test         Start one fresh local Codex session/);
  assert.match(result.stdout, /Both commands are installed: re-entry and reentry/);
  assert.match(result.stdout, /Recommended first run/);
  assert.match(result.stdout, /opens no inbound port/);
});

test("package installs both CLI spellings", () => {
  assert.deepEqual(packageJson.bin, {
    "re-entry": "src/main.mjs",
    reentry: "src/main.mjs",
  });
});

test("new connections require an explicit Receiver origin", () => {
  const result = spawnSync(process.execPath, [entry, "connect", "--json"], {
    encoding: "utf8",
    env: { ...process.env, REENTRY_RECEIVER_ORIGIN: "" },
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /"code":"connector_receiver_missing"/);
});

test("Codex test command requires one explicit prompt", () => {
  const result = spawnSync(process.execPath, [entry, "test", "--json"], {
    encoding: "utf8",
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /"code":"connector_test_prompt_missing"/);
});

test("CLI version matches the package version", () => {
  const result = spawnSync(process.execPath, [entry, "--version"], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout, `${packageJson.version}\n`);
});
