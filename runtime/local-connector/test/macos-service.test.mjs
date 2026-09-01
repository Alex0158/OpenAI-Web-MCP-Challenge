import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  inspectMacConnectorService,
  installMacConnectorService,
  renderLaunchAgent,
} from "../src/macos-service.mjs";

test("macOS service file starts the Connector in the selected Codex directory without embedding credentials", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-launch-agent-"));
  const launchAgentsDirectory = join(directory, "LaunchAgents");
  const stateDirectory = join(directory, "state");
  const result = await installMacConnectorService({
    nodeExecutable: "/usr/local/bin/node",
    entrypoint: "/opt/reentry/main.mjs",
    workingDirectory: "/Users/example/Host Project",
    credentialFile: "/Users/example/.webmcp-connector/credentials.json",
    launchAgentsDirectory,
    stateDirectory,
    allowNonMacForTest: true,
    load: false,
  });

  const plist = await readFile(result.plistPath, "utf8");
  assert.match(plist, /com\.reentry\.local-connector/);
  assert.match(plist, /<string>start<\/string>/);
  assert.match(plist, /<string>--credential-file<\/string>/);
  assert.match(plist, /Host Project/);
  assert.equal(plist.includes("connector_token"), false);
  assert.equal((await stat(result.plistPath)).mode & 0o777, 0o600);
});

test("LaunchAgent rendering escapes paths instead of creating shell commands", () => {
  const plist = renderLaunchAgent({
    nodeExecutable: "/path/node",
    entrypoint: "/path/main.mjs",
    workingDirectory: "/tmp/A&B",
    credentialFile: "/tmp/<credentials>",
    stdoutPath: "/tmp/out.log",
    stderrPath: "/tmp/err.log",
  });
  assert.match(plist, /A&amp;B/);
  assert.match(plist, /&lt;credentials&gt;/);
  assert.equal(plist.includes("sh -c"), false);
});

test("macOS installation replaces an old job and status reads the loaded job", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-launch-agent-status-"));
  const launchAgentsDirectory = join(directory, "LaunchAgents");
  const commands = [];
  const runCommand = async (argumentsList) => {
    commands.push(argumentsList);
    return { code: 0, stderr: "" };
  };
  await installMacConnectorService({
    nodeExecutable: "/usr/local/bin/node",
    entrypoint: "/opt/reentry/main.mjs",
    workingDirectory: "/Users/example/Host Project",
    credentialFile: "/Users/example/.webmcp-connector/credentials.json",
    launchAgentsDirectory,
    stateDirectory: join(directory, "state"),
    allowNonMacForTest: true,
    runCommand,
  });
  const status = await inspectMacConnectorService({
    launchAgentsDirectory,
    allowNonMacForTest: true,
    runCommand,
  });

  assert.deepEqual(commands.map((command) => command[0]), ["bootout", "bootstrap", "print"]);
  assert.equal(status.installed, true);
  assert.equal(status.running, true);
});
