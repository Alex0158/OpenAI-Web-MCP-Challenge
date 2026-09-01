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
    running: result.code === 0,
    plistPath,
  });
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
    let stderr = "";
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      if (stderr.length < 4_096) stderr += chunk;
    });
    child.once("error", (error) => finish({ code: -1, stderr: error.message }));
    child.once("close", (code) => finish({ code: code ?? -1, stderr }));
  });
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
