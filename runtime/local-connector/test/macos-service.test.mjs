import assert from "node:assert/strict";
import { mkdtemp, readFile, stat, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  inspectMacConnectorService,
  installMacConnectorService,
  renderLaunchAgent,
  stopMacConnectorService,
  disconnectMacConnectorService,
  uninstallMacConnectorService,
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

test("stopping and uninstalling remove only the Connector service files", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-launch-agent-uninstall-"));
  const launchAgentsDirectory = join(directory, "LaunchAgents");
  const stateDirectory = join(directory, "state");
  const credentialFile = join(stateDirectory, "credentials.json");
  const commands = [];
  const runCommand = async (argumentsList) => {
    commands.push(argumentsList);
    return { code: 0, stderr: "" };
  };
  const installed = await installMacConnectorService({
    nodeExecutable: "/usr/local/bin/node",
    entrypoint: "/opt/reentry/main.mjs",
    workingDirectory: "/Users/example/Host Project",
    credentialFile,
    launchAgentsDirectory,
    stateDirectory,
    allowNonMacForTest: true,
    runCommand,
  });
  await writeFile(credentialFile, "credential");
  const reauthorizationMarker = `${credentialFile}.reauthorization-required.json`;
  await writeFile(reauthorizationMarker, "status");
  await writeFile(installed.stdoutPath, "log");
  await writeFile(installed.stderrPath, "error");

  const stopped = await stopMacConnectorService({
    launchAgentsDirectory,
    allowNonMacForTest: true,
    runCommand,
  });
  assert.equal(stopped.stopped, true);

  const removed = await uninstallMacConnectorService({
    launchAgentsDirectory,
    stateDirectory,
    credentialFile,
    allowNonMacForTest: true,
    runCommand,
  });
  assert.deepEqual(removed.removedPaths.sort(), [
    credentialFile,
    reauthorizationMarker,
    installed.plistPath,
    installed.stderrPath,
    installed.stdoutPath,
  ].sort());
  await assert.rejects(readFile(credentialFile));
  await assert.rejects(readFile(installed.plistPath));
  assert.equal(commands.some((command) => command[0] === "bootout"), true);
  await rm(directory, { recursive: true, force: true });
});

test("disconnect stops the service and removes the local connection but keeps logs", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-launch-agent-disconnect-"));
  const launchAgentsDirectory = join(directory, "LaunchAgents");
  const stateDirectory = join(directory, "state");
  const credentialFile = join(stateDirectory, "credentials.json");
  const commands = [];
  const runCommand = async (argumentsList) => {
    commands.push(argumentsList);
    return { code: 0, stderr: "" };
  };
  try {
    const installed = await installMacConnectorService({
      nodeExecutable: "/usr/local/bin/node",
      entrypoint: "/opt/reentry/main.mjs",
      workingDirectory: "/Users/example/Host Project",
      credentialFile,
      launchAgentsDirectory,
      stateDirectory,
      allowNonMacForTest: true,
      runCommand,
    });
    await writeFile(credentialFile, "credential");
    await writeFile(`${credentialFile}.reauthorization-required.json`, "status");
    await writeFile(installed.stdoutPath, "log");
    await writeFile(installed.stderrPath, "error");

    const disconnected = await disconnectMacConnectorService({
      launchAgentsDirectory,
      stateDirectory,
      credentialFile,
      allowNonMacForTest: true,
      runCommand,
    });

    assert.equal(disconnected.disconnected, true);
    assert.deepEqual(disconnected.removedPaths.sort(), [
      credentialFile,
      `${credentialFile}.reauthorization-required.json`,
      installed.plistPath,
    ].sort());
    await assert.rejects(readFile(credentialFile));
    await assert.rejects(readFile(installed.plistPath));
    assert.equal(await readFile(installed.stdoutPath, "utf8"), "log");
    assert.equal(await readFile(installed.stderrPath, "utf8"), "error");
    assert.equal(commands.some((command) => command[0] === "bootout"), true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
