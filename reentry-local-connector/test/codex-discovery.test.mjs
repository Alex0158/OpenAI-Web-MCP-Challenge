import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import {
  discoverCodexExecutable,
  requireSupportedNode,
  validateCodexWorkingDirectory,
  verifyCodexExecutable,
} from "../src/codex-discovery.mjs";

test("Codex discovery prefers an executable on PATH", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "local-connector-codex-path-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const bin = join(directory, "bin");
  await mkdir(bin);
  const executable = join(bin, "codex");
  await writeFile(executable, "#!/bin/sh\nexit 0\n", { mode: 0o755 });
  await chmod(executable, 0o755);

  assert.equal(
    discoverCodexExecutable({
      environment: { PATH: bin },
      homeDirectory: join(directory, "home"),
      platform: "darwin",
    }),
    executable,
  );
});

test("Codex discovery finds the common ChatGPT app bundle location", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "local-connector-codex-app-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const executable = join(
    directory,
    "Applications",
    "ChatGPT.app",
    "Contents",
    "Resources",
    "codex",
  );
  await mkdir(join(executable, ".."), { recursive: true });
  await writeFile(executable, "#!/bin/sh\nexit 0\n", { mode: 0o755 });
  await chmod(executable, 0o755);

  assert.equal(
    discoverCodexExecutable({
      applicationDirectories: [join(directory, "Applications")],
      environment: { PATH: "" },
      homeDirectory: directory,
      platform: "darwin",
    }),
    executable,
  );
});

test("an explicit Codex path fails visibly instead of falling back", () => {
  assert.throws(
    () => discoverCodexExecutable({ requested: "/missing/codex" }),
    (error) => error.code === "connector_codex_binary_not_found",
  );
});

test("Codex version verification returns a bounded installation result", () => {
  let call;
  const result = verifyCodexExecutable("/private/codex", {
    environment: { PATH: "/private/bin" },
    spawnSyncCommand(...input) {
      call = input;
      return { status: 0, stdout: "codex-cli 0.151.0\n", stderr: "" };
    },
  });

  assert.deepEqual(result, {
    executable: "/private/codex",
    version: "codex-cli 0.151.0",
  });
  assert.deepEqual(call[0], "/private/codex");
  assert.deepEqual(call[1], ["--version"]);
  assert.equal(call[2].timeout, 10_000);
  assert.deepEqual(call[2].stdio, ["ignore", "pipe", "pipe"]);
});

test("Codex version verification rejects a broken executable", () => {
  assert.throws(
    () => verifyCodexExecutable("/private/codex", {
      spawnSyncCommand: () => ({ status: 1, stdout: "", stderr: "" }),
    }),
    (error) => error.code === "connector_codex_unusable",
  );
});

test("the working directory check requires a readable writable directory", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "local-connector-codex-cd-"));
  t.after(() => rm(directory, { recursive: true, force: true }));

  assert.equal(validateCodexWorkingDirectory(directory), directory);
  assert.throws(
    () => validateCodexWorkingDirectory("relative/project"),
    (error) => error.code === "connector_codex_cd_absolute",
  );
  assert.throws(
    () => validateCodexWorkingDirectory(join(directory, "missing")),
    (error) => error.code === "connector_codex_cd_missing",
  );
});

test("the Connector reports the supported Node version boundary", () => {
  assert.equal(requireSupportedNode("24.0.0"), "24.0.0");
  assert.throws(
    () => requireSupportedNode("22.14.0"),
    (error) => error.code === "connector_node_unsupported",
  );
});
