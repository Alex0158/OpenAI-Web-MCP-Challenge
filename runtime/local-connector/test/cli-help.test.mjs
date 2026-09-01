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
  assert.match(result.stdout, /reentry install --receiver <url> --codex-cd <project>/);
  assert.match(result.stdout, /Recommended first run/);
  assert.match(result.stdout, /opens no inbound port/);
});

test("CLI version matches the package version", () => {
  const result = spawnSync(process.execPath, [entry, "--version"], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout, `${packageJson.version}\n`);
});
