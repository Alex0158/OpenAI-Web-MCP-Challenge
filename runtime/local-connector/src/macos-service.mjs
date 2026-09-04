import { spawn } from "node:child_process";
import { access, chmod, mkdir, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join } from "node:path";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";

const LABEL = "com.reentry.local-connector";

export async function installMacConnectorService(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw serviceFailure("connector_service_input_invalid", "Service installation options are invalid");
  }
  if (process.platform !== "darwin" && options.allowNonMacForTest !== true) {
    throw serviceFailure("connector_service_platform_unsupported", "Background installation currently supports macOS only");
  }
  const nodeExecutable = requireAbsolutePath(options.nodeExecutable, "Node executable");
  const entrypoint = requireAbsolutePath(options.entrypoint, "Connector entrypoint");
  const workingDirectory = requireAbsolutePath(options.workingDirectory, "Codex working directory");
  const credentialFile = requireAbsolutePath(options.credentialFile, "Credential file");
  const launchAgentsDirectory = options.launchAgentsDirectory ?? join(homedir(), "Library", "LaunchAgents");
  const stateDirectory = options.stateDirectory ?? join(homedir(), ".webmcp-connector");
  const protocolVersion = options.protocolVersion === undefined
    ? undefined
    : requireProtocolVersion(options.protocolVersion);
  const taskBindingFile = options.taskBindingFile === undefined
    ? undefined
    : requireAbsolutePath(options.taskBindingFile, "Task binding file");
  const runCommand = options.runCommand ?? runLaunchctl;
  if (typeof runCommand !== "function") {
    throw new TypeError("Service installer runCommand must be a function");
  }
  const plistPath = join(launchAgentsDirectory, `${LABEL}.plist`);
  const stdoutPath = join(stateDirectory, "connector.log");
  const stderrPath = join(stateDirectory, "connector-error.log");
  const plist = renderLaunchAgent({
    nodeExecutable,
    entrypoint,
    workingDirectory,
    credentialFile,
    protocolVersion,
    taskBindingFile,
    stdoutPath,
    stderrPath,
  });

  await mkdir(launchAgentsDirectory, { recursive: true, mode: 0o700 });
  await mkdir(stateDirectory, { recursive: true, mode: 0o700 });
  const temporary = `${plistPath}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, plist, { encoding: "utf8", mode: 0o600, flag: "wx" });
    await chmod(temporary, 0o600);
    await rename(temporary, plistPath);
    await chmod(plistPath, 0o600);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw serviceFailure("connector_service_write_failed", "Background service could not be installed", error);
  }

  if (options.load !== false) {
    const domain = `gui/${typeof process.getuid === "function" ? process.getuid() : 0}`;
    await runCommand(["bootout", `${domain}/${LABEL}`]);
    const result = await runCommand(["bootstrap", domain, plistPath]);
    if (result.code !== 0) {
      throw serviceFailure("connector_service_load_failed", "Background service file was written but could not be started");
    }
  }

  return Object.freeze({
    label: LABEL,
    plistPath,
    stdoutPath,
    stderrPath,
  });
}

export async function inspectMacConnectorService(options = {}) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw serviceFailure("connector_service_input_invalid", "Service status options are invalid");
  }
  if (process.platform !== "darwin" && options.allowNonMacForTest !== true) {
    return Object.freeze({ supported: false, installed: false, running: false });
  }
  const launchAgentsDirectory = options.launchAgentsDirectory ?? join(homedir(), "Library", "LaunchAgents");
  const runCommand = options.runCommand ?? runLaunchctl;
  if (typeof runCommand !== "function") {
    throw new TypeError("Service status runCommand must be a function");
  }
  const plistPath = join(launchAgentsDirectory, `${LABEL}.plist`);
  try {
    await access(plistPath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return Object.freeze({ supported: true, installed: false, running: false, plistPath });
    }
    throw serviceFailure("connector_service_status_failed", "Background service status is unavailable", error);
  }
  const domain = `gui/${typeof process.getuid === "function" ? process.getuid() : 0}`;
  const result = await runCommand(["print", `${domain}/${LABEL}`]);
  return Object.freeze({
    supported: true,
    installed: true,
    running: result.code === 0 && isLoadedAndRunning(result.stdout),
    plistPath,
  });
}

export async function stopMacConnectorService(options = {}) {
  const configuration = requireServiceConfiguration(options, "stop");
  if (process.platform !== "darwin" && configuration.allowNonMacForTest !== true) {
    return Object.freeze({ supported: false, stopped: false, installed: false, running: false });
  }
  const status = await inspectMacConnectorService(configuration);
  if (!status.installed || !status.running) {
    return Object.freeze({ ...status, stopped: false });
  }
  const domain = `gui/${typeof process.getuid === "function" ? process.getuid() : 0}`;
  const result = await configuration.runCommand(["bootout", `${domain}/${LABEL}`]);
  if (result.code !== 0) {
    throw serviceFailure("connector_service_stop_failed", "Background service could not be stopped");
  }
  return Object.freeze({ ...status, stopped: true, running: false });
}

export async function disconnectMacConnectorService(options = {}) {
  const configuration = requireServiceConfiguration(options, "disconnect");
  if (process.platform !== "darwin" && configuration.allowNonMacForTest !== true) {
    return Object.freeze({ supported: false, disconnected: false, removedPaths: [] });
  }
  const service = await stopMacConnectorService(configuration);
  const stateDirectory = configuration.stateDirectory ?? join(homedir(), ".webmcp-connector");
  const credentialFile = requireAbsolutePath(
    configuration.credentialFile ?? join(stateDirectory, "credentials.json"),
    "Credential file",
  );
  const removedPaths = await removePaths([
    service.plistPath,
    credentialFile,
    `${credentialFile}.reauthorization-required.json`,
  ], "disconnect");
  return Object.freeze({
    supported: true,
    disconnected: removedPaths.length > 0,
    removedPaths,
    plistPath: service.plistPath,
  });
}

export async function uninstallMacConnectorService(options = {}) {
  const configuration = requireServiceConfiguration(options, "uninstall");
  if (process.platform !== "darwin" && configuration.allowNonMacForTest !== true) {
    return Object.freeze({ supported: false, removedPaths: [] });
  }
  const service = await stopMacConnectorService(configuration);
  const stateDirectory = configuration.stateDirectory ?? join(homedir(), ".webmcp-connector");
  const credentialFile = requireAbsolutePath(
    configuration.credentialFile ?? join(stateDirectory, "credentials.json"),
    "Credential file",
  );
  const paths = [...new Set([
    service.plistPath,
    credentialFile,
    `${credentialFile}.reauthorization-required.json`,
    join(stateDirectory, "connector.log"),
    join(stateDirectory, "connector-error.log"),
  ])];
  const removedPaths = await removePaths(paths, "uninstall");
  return Object.freeze({
    supported: true,
    removedPaths,
    plistPath: service.plistPath,
  });
}

async function removePaths(paths, operation) {
  const removedPaths = [];
  for (const path of [...new Set(paths)]) {
    if (typeof path !== "string") continue;
    try {
      await unlink(path);
      removedPaths.push(path);
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw serviceFailure("connector_service_remove_failed", `Connector data could not be removed during ${operation}`, error);
      }
    }
  }
  return removedPaths;
}

export function renderLaunchAgent(options) {
  const argumentsList = [
    options.nodeExecutable,
    options.entrypoint,
    "start",
    "--credential-file",
    options.credentialFile,
    "--codex-cd",
    options.workingDirectory,
  ];
  if (options.protocolVersion !== undefined) {
    argumentsList.push("--protocol-version", requireProtocolVersion(options.protocolVersion));
  }
  if (options.taskBindingFile !== undefined) {
    argumentsList.push("--task-binding-file", requireAbsolutePath(options.taskBindingFile, "Task binding file"));
  }
  const argumentsXml = argumentsList.map((value) => `      <string>${escapeXml(value)}</string>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>${LABEL}</string>
    <key>ProgramArguments</key>
    <array>
${argumentsXml}
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <dict>
      <key>SuccessfulExit</key>
      <false/>
    </dict>
    <key>ProcessType</key>
    <string>Background</string>
    <key>WorkingDirectory</key>
    <string>${escapeXml(options.workingDirectory)}</string>
    <key>StandardOutPath</key>
    <string>${escapeXml(options.stdoutPath)}</string>
    <key>StandardErrorPath</key>
    <string>${escapeXml(options.stderrPath)}</string>
  </dict>
</plist>
`;
}

function runLaunchctl(argumentsList) {
  return new Promise((resolve) => {
    const child = spawn("launchctl", argumentsList, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      if (stdout.length < 16_384) stdout += chunk;
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      if (stderr.length < 4_096) stderr += chunk;
    });
    child.once("error", (error) => finish({ code: -1, stdout, stderr: error.message }));
    child.once("close", (code) => finish({ code: code ?? -1, stdout, stderr }));
  });
}

function isLoadedAndRunning(stdout) {
  // Test doubles historically return only { code: 0 }; preserve that contract while
  // treating launchctl's explicit not-running state as stopped in production.
  if (stdout === undefined) return true;
  const state = stdout.match(/^[\t ]*state\s*=\s*([^\r\n]+)$/m)?.[1]?.trim();
  if (state) return state === "running";
  const activeCount = stdout.match(/^[\t ]*active count\s*=\s*(\d+)$/m)?.[1];
  return activeCount !== undefined && Number(activeCount) > 0;
}

function requireServiceConfiguration(options, operation) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw serviceFailure("connector_service_input_invalid", `Service ${operation} options are invalid`);
  }
  const launchAgentsDirectory = options.launchAgentsDirectory ?? join(homedir(), "Library", "LaunchAgents");
  const runCommand = options.runCommand ?? runLaunchctl;
  if (typeof runCommand !== "function") {
    throw new TypeError(`Service ${operation} runCommand must be a function`);
  }
  return { ...options, launchAgentsDirectory, runCommand };
}

function requireAbsolutePath(value, label) {
  if (
    typeof value !== "string" ||
    !isAbsolute(value) ||
    value.length > 4_096 ||
    value.includes("\0")
  ) {
    throw serviceFailure("connector_service_path_invalid", `${label} is invalid`);
  }
  return value;
}

function requireProtocolVersion(value) {
  if (value !== "0.1" && value !== "0.2") {
    throw serviceFailure("connector_protocol_version_invalid", "Connector protocol version is invalid");
  }
  return value;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function serviceFailure(code, message, cause) {
  const error = new Error(message, cause === undefined ? undefined : { cause });
  error.code = code;
  return error;
}
