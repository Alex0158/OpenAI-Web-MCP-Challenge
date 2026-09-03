import { accessSync, constants, statSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, isAbsolute, join, normalize, resolve } from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

export const CODEX_BINARY_ENVIRONMENT_VARIABLE = "CODEX_BINARY";
export const MINIMUM_NODE_MAJOR = 24;

const CODEX_COMMAND = "codex";
const CODEX_APP_BUNDLE_NAMES = Object.freeze(["ChatGPT.app", "Codex.app"]);
const DEFAULT_COMMAND_DIRECTORIES = Object.freeze([
  "/opt/homebrew/bin",
  "/usr/local/bin",
  "/usr/bin",
  "/bin",
]);
const MAX_REFERENCE_BYTES = 4 * 1_024;
const MAX_VERSION_BYTES = 512;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export class CodexDiscoveryError extends Error {
  constructor(code, message, options = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "CodexDiscoveryError";
    this.code = code;
  }
}

/**
 * Find the Codex CLI without relying on one machine's ChatGPT installation path.
 * Explicit CLI configuration wins, then CODEX_BINARY, PATH, and known macOS app bundles.
 */
export function discoverCodexExecutable(options = {}) {
  const environment = options.environment ?? process.env;
  const homeDirectory = options.homeDirectory ?? homedir();
  const platform = options.platform ?? process.platform;
  const applicationDirectories = options.applicationDirectories ?? [
    "/Applications",
    join(homeDirectory, "Applications"),
  ];
  const requested = options.requested !== undefined
    ? options.requested
    : environment[CODEX_BINARY_ENVIRONMENT_VARIABLE];

  if (requested !== undefined) {
    const reference = requireReference(requested, "Codex executable");
    const candidates = reference.includes("/")
      ? [resolveReference(reference, homeDirectory)]
      : [
        ...pathCandidates(reference, environment.PATH),
        ...(reference === CODEX_COMMAND
          ? DEFAULT_COMMAND_DIRECTORIES.map((directory) => join(directory, reference))
          : []),
      ];
    const executable = firstExecutable(candidates);
    if (executable) return executable;
    throw codexFailure(
      "connector_codex_binary_not_found",
      "The configured Codex executable could not be found or is not executable.",
    );
  }

  const candidates = [
    ...pathCandidates(CODEX_COMMAND, environment.PATH),
    ...DEFAULT_COMMAND_DIRECTORIES.map((directory) => join(directory, CODEX_COMMAND)),
    ...(platform === "darwin" ? macOSBundleCandidates(applicationDirectories) : []),
  ];
  const executable = firstExecutable(candidates);
  if (executable) return executable;

  throw codexFailure(
    "connector_codex_not_found",
    "Codex CLI was not found. Install Codex, add it to PATH, or set CODEX_BINARY.",
  );
}

/**
 * Check the selected Codex binary before the Connector claims a delivery.
 */
export function verifyCodexExecutable(executable, options = {}) {
  const normalizedExecutable = requireReference(executable, "Codex executable");
  const timeoutMs = options.timeoutMs ?? 10_000;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 60_000) {
    throw new TypeError("Codex version check timeout is invalid");
  }
  const spawnSyncCommand = options.spawnSyncCommand ?? spawnSync;
  if (typeof spawnSyncCommand !== "function") {
    throw new TypeError("Codex version check command must be a function");
  }

  let result;
  try {
    result = spawnSyncCommand(normalizedExecutable, ["--version"], {
      encoding: "utf8",
      env: options.environment ?? process.env,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: timeoutMs,
    });
  } catch (error) {
    throw codexFailure(
      "connector_codex_unusable",
      "The Codex CLI could not be started.",
      error,
    );
  }

  if (!result || result.error || result.status !== 0) {
    throw codexFailure(
      "connector_codex_unusable",
      "The selected Codex CLI did not pass its version check.",
      result?.error,
    );
  }

  return Object.freeze({
    executable: normalizedExecutable,
    version: readVersion(result.stdout, result.stderr),
  });
}

/**
 * Validate the host project directory before a delivery is claimed.
 */
export function validateCodexWorkingDirectory(value, options = {}) {
  const homeDirectory = options.homeDirectory ?? homedir();
  const reference = requireReference(value, "Codex working directory");
  const expanded = resolveReference(reference, homeDirectory);
  if (!isAbsolute(expanded)) {
    throw codexFailure(
      "connector_codex_cd_absolute",
      "The Codex working directory must be an absolute path.",
    );
  }
  const workingDirectory = normalize(expanded);
  const statFile = options.statSync ?? statSync;
  const accessFile = options.accessSync ?? accessSync;
  let stats;
  try {
    stats = statFile(workingDirectory);
  } catch (error) {
    throw codexFailure(
      "connector_codex_cd_missing",
      "The Codex working directory does not exist.",
      error,
    );
  }
  if (!stats?.isDirectory?.()) {
    throw codexFailure(
      "connector_codex_cd_invalid",
      "The Codex working directory is not a directory.",
    );
  }
  try {
    accessFile(workingDirectory, constants.R_OK | constants.W_OK | constants.X_OK);
  } catch (error) {
    throw codexFailure(
      "connector_codex_cd_unusable",
      "The Codex working directory is not readable and writable.",
      error,
    );
  }
  return workingDirectory;
}

export function requireSupportedNode(version = process.versions.node) {
  const major = Number.parseInt(String(version).split(".")[0], 10);
  if (!Number.isSafeInteger(major) || major < MINIMUM_NODE_MAJOR) {
    throw codexFailure(
      "connector_node_unsupported",
      `The Local Connector requires Node.js ${MINIMUM_NODE_MAJOR} or newer.`,
    );
  }
  return String(version);
}

function macOSBundleCandidates(applicationDirectories) {
  return CODEX_APP_BUNDLE_NAMES.flatMap((bundleName) => applicationDirectories.map((directory) => (
    join(directory, bundleName, "Contents", "Resources", "codex")
  )));
}

function pathCandidates(command, pathValue) {
  const directories = [
    ...(typeof pathValue === "string" ? pathValue.split(delimiter) : []),
  ];
  return directories
    .filter((directory) => directory.length > 0)
    .map((directory) => join(directory, command));
}

function firstExecutable(candidates) {
  const seen = new Set();
  for (const candidate of candidates) {
    const normalized = normalize(candidate);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    if (isExecutableFile(normalized)) return normalized;
  }
  return null;
}

function isExecutableFile(path) {
  try {
    accessSync(path, constants.F_OK | constants.X_OK);
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function resolveReference(value, homeDirectory) {
  if (value === "~") return homeDirectory;
  if (value.startsWith("~/")) return join(homeDirectory, value.slice(2));
  return value;
}

function readVersion(stdout, stderr) {
  const value = typeof stdout === "string" && stdout.trim().length > 0
    ? stdout
    : typeof stderr === "string"
      ? stderr
      : "";
  const firstLine = value.split(/\r?\n/, 1)[0].trim();
  if (Buffer.byteLength(firstLine, "utf8") > MAX_VERSION_BYTES) {
    return "available";
  }
  return firstLine || "available";
}

function requireReference(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.trim() !== value ||
    Buffer.byteLength(value, "utf8") > MAX_REFERENCE_BYTES ||
    CONTROL_CHARACTER_PATTERN.test(value)
  ) {
    throw codexFailure("connector_configuration_invalid", `${label} is invalid.`);
  }
  return value;
}

function codexFailure(code, message, cause) {
  return new CodexDiscoveryError(code, message, cause === undefined ? {} : { cause });
}
