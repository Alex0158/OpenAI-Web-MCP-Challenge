#!/usr/bin/env node

import { homedir, hostname } from "node:os";
import { createInterface } from "node:readline/promises";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import process from "node:process";

import { LocalConnectorClient } from "@webmcp-challenge/reentry-core/local-connector-client";
import { createCodexExecAdapter } from "./codex-exec-adapter.mjs";
import {
  discoverCodexExecutable,
  requireSupportedNode,
  validateCodexWorkingDirectory,
  verifyCodexExecutable,
} from "./codex-discovery.mjs";
import { LocalConnector } from "./local-connector.mjs";
import { LocalConnectorCredentialStore } from "./credentials.mjs";
import { LocalConnectorPairingClient } from "./pairing-client.mjs";
import {
  inspectMacConnectorService,
  installMacConnectorService,
} from "./macos-service.mjs";
import { createTerminalUi } from "./terminal-ui.mjs";

const DEFAULT_RECEIVER_ORIGIN = process.env.REENTRY_RECEIVER_ORIGIN ?? "https://cloud-receiver-mu.vercel.app";
const DEFAULT_POLL_INTERVAL_MS = 5_000;
const DEFAULT_MAX_CONSECUTIVE_ERRORS = 5;
const CONNECTOR_VERSION = readConnectorVersion();

async function main() {
  let ui;
  try {
    const argumentsList = process.argv.slice(2);
    if (argumentsList.includes("--help") || argumentsList[0] === "help") {
      printHelp();
      return;
    }
    if (argumentsList.includes("--version") || argumentsList[0] === "version") {
      process.stdout.write(`${CONNECTOR_VERSION}\n`);
      return;
    }
    const { command, flags } = parseArguments(argumentsList);
    validateCommandFlags(command, flags);
    ui = createTerminalUi({ interactive: flags.json !== true && process.stdout.isTTY === true });
    requireSupportedNode();
    if (command === "doctor") {
      doctor(flags, ui);
      return;
    }
    if (command === "pair") {
      await pair(flags, ui);
      return;
    }
    if (command === "connect") {
      await connect(flags, ui);
      return;
    }
    if (command === "status") {
      await status(flags, ui);
      return;
    }
    if (command === "install") {
      await install(flags, ui);
      return;
    }
    if (command === "claim-once") {
      await claimOnce(flags, ui);
      return;
    }
    if (command === "start") {
      await start(flags, ui);
      return;
    }
    throw cliFailure("connector_command_invalid");
  } catch (error) {
    if (ui?.interactive) {
      ui.error("Connector stopped", safeErrorMessage(error), errorHint(error));
    } else {
      process.stderr.write(`${JSON.stringify({
        event: "local_connector_failed",
        code: error?.code ?? "local_connector_failed",
        message: safeErrorMessage(error),
      })}\n`);
    }
    process.exitCode = 1;
  } finally {
    ui?.close();
  }
}

function printHelp() {
  process.stdout.write(`Re-entry Local Connector ${CONNECTOR_VERSION}

Connect this Mac once, then receive approved work in Codex in the background.

Usage:
  reentry install --receiver <url> --codex-cd <project>   Recommended first run
  reentry status                                          Check the connection
  reentry start --codex-cd <project>                      Run in this terminal

Commands:
  install      Check this Mac, connect the Re-entry account, and start at login
  status       Show account, Receiver, service, Node.js, and Codex readiness
  connect      Authorize this Mac without installing the background service
  start        Poll for approved work until stopped
  doctor       Check Node.js, Codex, and the optional project directory
  claim-once   Check once for approved work
  pair         Legacy Host-code pairing preview

Common options:
  --receiver <url>       Re-entry Receiver origin
  --codex-cd <path>      Project opened for the fresh Codex session
  --codex-binary <path>  Explicit Codex executable
  --json                 Machine-readable output
  --help                 Show this help
  --version              Show the installed version

The Connector opens no inbound port. Host keys never belong on this Mac.
`);
}

function readConnectorVersion() {
  const packageJson = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  if (typeof packageJson.version !== "string" || !/^\d+\.\d+\.\d+$/.test(packageJson.version)) {
    throw new Error("Local Connector package version is invalid");
  }
  return packageJson.version;
}

function doctor(flags, ui) {
  if (ui.interactive) ui.begin("Check this Mac", "Read-only readiness check");
  const readiness = inspectReadiness(flags);
  showReadiness(readiness, ui);
  if (!ui.interactive) {
    process.stdout.write(`${JSON.stringify({
      event: "connector_ready",
      node_version: process.versions.node,
      codex_binary: readiness.installation.executable,
      codex_version: readiness.installation.version,
      codex_working_directory: readiness.workingDirectory,
    })}\n`);
  }
  return readiness;
}

function inspectReadiness(flags) {
  const workingDirectory = flags["codex-cd"] === undefined
    ? null
    : validateCodexWorkingDirectory(flags["codex-cd"]);
  const executable = discoverCodexExecutable({
    requested: flags["codex-binary"],
  });
  const installation = verifyCodexExecutable(executable);
  return Object.freeze({ workingDirectory, installation });
}

function showReadiness(readiness, ui) {
  if (!ui.interactive) return;
  ui.success("Node.js", process.versions.node);
  ui.success("Codex", `${readiness.installation.version} · ${readiness.installation.executable}`);
  if (readiness.workingDirectory) {
    ui.success("Host project", readiness.workingDirectory);
  } else {
    ui.info("Host project", "not selected; pass --codex-cd when starting Codex");
  }
}

async function pair(flags, ui, options = {}) {
  if (!options.quietHeader && ui.interactive) {
    ui.begin("Pair this Mac", "One-time approval connects this Connector to a Host user");
  }
  const receiver = requireFlag(flags, "receiver");
  const credentialFile = flags["credential-file"] ?? defaultCredentialFile();
  if (ui.interactive) {
    ui.step("Receiver", receiver);
  }
  const userCode = flags.code ?? await askForPairingCode(ui);
  if (ui.interactive) ui.step("Pairing code", "received");
  const client = new LocalConnectorPairingClient({ baseUrl: receiver });
  const credentials = await client.pair({ userCode }, async ({ verificationUri }) => {
    if (ui.interactive) {
      ui.step("Approval page", "opening your browser");
      ui.info("Open this URL", verificationUri);
      ui.wait("Waiting for you to approve this Mac…");
    } else {
      process.stdout.write(`${JSON.stringify({ event: "pairing_waiting", verification_uri: verificationUri })}\n`);
    }
  });
  if (ui.interactive) {
    ui.stopWait("Approval received", "the Receiver approved this Connector");
    if (!credentials.browserOpened) {
      ui.warning("Browser", "did not open automatically; use the URL above");
    }
  }
  const store = new LocalConnectorCredentialStore({ filename: credentialFile });
  await store.save({
    version: 1,
    receiver_origin: receiver,
    connector_id: credentials.connector_id,
    connector_token: credentials.connector_token,
    connector_expires_at: credentials.connector_expires_at,
  });
  if (ui.interactive) {
    ui.success("This Mac is paired", `credential saved at ${credentialFile}`);
  } else {
    process.stdout.write(`${JSON.stringify({ event: "connector_paired", connector_id: credentials.connector_id })}\n`);
  }
}

async function connect(flags, ui, options = {}) {
  if (!options.quietHeader && ui.interactive) {
    ui.begin("Connect this Mac", "One browser approval, then Re-entry stays connected");
  }
  const receiver = flags.receiver ?? DEFAULT_RECEIVER_ORIGIN;
  const credentialFile = flags["credential-file"] ?? defaultCredentialFile();
  const store = new LocalConnectorCredentialStore({ filename: credentialFile });
  const current = await store.load();
  if (current && Date.parse(current.connector_expires_at) > Date.now()) {
    if (ui.interactive) {
      ui.success("Already connected", `${current.connector_id} · ${current.receiver_origin}`);
      ui.info("Next", "run `reentry start` to wait for approved work");
    } else {
      process.stdout.write(`${JSON.stringify({
        event: "connector_already_connected",
        connector_id: current.connector_id,
        receiver_origin: current.receiver_origin,
      })}\n`);
    }
    return current;
  }

  if (ui.interactive) {
    ui.step("Re-entry", receiver);
    ui.step("This Mac", flags["device-name"] ?? defaultDeviceName());
  }
  const client = new LocalConnectorPairingClient({ baseUrl: receiver });
  const credentials = await client.connect(
    { deviceName: flags["device-name"] ?? defaultDeviceName() },
    async ({ verificationUri }) => {
      if (ui.interactive) {
        ui.step("Browser", "opening Re-entry sign-in and approval");
        ui.info("If it does not open", verificationUri);
        ui.wait("Waiting for you to connect this Mac…");
      } else {
        process.stdout.write(`${JSON.stringify({
          event: "connector_authorization_waiting",
          verification_uri: verificationUri,
        })}\n`);
      }
    },
  );
  if (ui.interactive) {
    ui.stopWait("Approved", "Re-entry linked this Mac to your account");
    if (!credentials.browserOpened) {
      ui.warning("Browser", "did not open automatically; use the URL shown above");
    }
  }
  const saved = {
    version: 1,
    receiver_origin: receiver,
    connector_id: credentials.connector_id,
    connector_token: credentials.connector_token,
    connector_expires_at: credentials.connector_expires_at,
  };
  await store.save(saved);
  if (ui.interactive) {
    ui.success("Connected", `credential saved at ${credentialFile}`);
    ui.info("Next", "run `reentry start` once; it will keep waiting in the background");
  } else {
    process.stdout.write(`${JSON.stringify({
      event: "connector_connected",
      connector_id: credentials.connector_id,
    })}\n`);
  }
  return saved;
}

async function status(flags, ui) {
  if (ui.interactive) ui.begin("Connector status", "Account, background service, Receiver, and Codex");
  const credentialFile = flags["credential-file"] ?? defaultCredentialFile();
  const credentials = await new LocalConnectorCredentialStore({ filename: credentialFile }).load();
  const readiness = inspectReadiness(flags);
  const service = await inspectMacConnectorService();
  const receiverReady = credentials ? await inspectReceiver(credentials.receiver_origin) : false;
  showReadiness(readiness, ui);
  const connected = Boolean(credentials && Date.parse(credentials.connector_expires_at) > Date.now());
  if (ui.interactive) {
    if (connected) ui.success("Account", `${credentials.connector_id} · authorized`);
    else ui.warning("Re-entry", "not connected; run `reentry connect`");
    if (service.running) ui.success("Background", "running at login");
    else if (service.installed) ui.warning("Background", "installed but not running; run `reentry install`");
    else ui.warning("Background", "not installed; run `reentry install`");
    if (connected && receiverReady) ui.success("Receiver", `${credentials.receiver_origin} · reachable`);
    else if (connected) ui.warning("Receiver", `${credentials.receiver_origin} · unavailable`);
  } else {
    process.stdout.write(`${JSON.stringify({
      event: "connector_status",
      connected,
      connector_id: credentials?.connector_id ?? null,
      receiver_origin: credentials?.receiver_origin ?? null,
      receiver_ready: receiverReady,
      service_installed: service.installed,
      service_running: service.running,
      codex_binary: readiness.installation.executable,
      codex_version: readiness.installation.version,
      codex_working_directory: readiness.workingDirectory,
    })}\n`);
  }
}

async function install(flags, ui) {
  if (ui.interactive) {
    ui.begin("Install Re-entry", "Check Codex, connect your account, then start at login");
  }
  const runtimeFlags = {
    ...flags,
    "codex-cd": flags["codex-cd"] ?? process.cwd(),
  };
  const readiness = inspectReadiness(runtimeFlags);
  showReadiness(readiness, ui);
  const credentials = await connect(runtimeFlags, ui, { quietHeader: true });
  if (ui.interactive) ui.wait("Installing the background Connector…");
  const service = await installMacConnectorService({
    nodeExecutable: process.execPath,
    entrypoint: fileURLToPath(import.meta.url),
    workingDirectory: readiness.workingDirectory,
    credentialFile: flags["credential-file"] ?? defaultCredentialFile(),
  });
  if (ui.interactive) {
    ui.stopWait("Installed", "Re-entry will start automatically when you log in");
    ui.success("Account", credentials.connector_id);
    ui.info("Logs", service.stdoutPath);
    ui.info("You are done", "the Connector now waits in the background");
  } else {
    process.stdout.write(`${JSON.stringify({
      event: "connector_service_installed",
      connector_id: credentials.connector_id,
      service_label: service.label,
      plist_path: service.plistPath,
      log_path: service.stdoutPath,
    })}\n`);
  }
}

async function start(flags, ui) {
  if (ui.interactive) {
    ui.begin("Re-entry is starting", "Connect once, then wait quietly for work you approve");
  }
  const runtimeFlags = {
    ...flags,
    "codex-cd": flags["codex-cd"] ?? process.cwd(),
  };
  const readiness = inspectReadiness(runtimeFlags);
  showReadiness(readiness, ui);
  if (!ui.interactive) {
    process.stdout.write(`${JSON.stringify({
      event: "connector_ready",
      node_version: process.versions.node,
      codex_binary: readiness.installation.executable,
      codex_version: readiness.installation.version,
      codex_working_directory: readiness.workingDirectory,
    })}\n`);
  }

  const credentialFile = flags["credential-file"] ?? defaultCredentialFile();
  const store = new LocalConnectorCredentialStore({ filename: credentialFile });
  let credentials = await store.load();
  if (!credentials) {
    if (ui.interactive) ui.info("Re-entry", "first run — browser approval is required once");
    credentials = await connect(runtimeFlags, ui, { quietHeader: true });
  } else if (ui.interactive) {
    ui.success("Re-entry", "existing account connection loaded");
  }
  if (Date.parse(credentials.connector_expires_at) <= Date.now()) {
    throw cliFailure("connector_credentials_expired");
  }

  const connector = createRuntimeConnector(runtimeFlags, credentials, readiness);
  const pollIntervalMs = readBoundedNumber(
    flags["poll-interval"] ?? DEFAULT_POLL_INTERVAL_MS,
    1_000,
    60_000,
    "connector_poll_interval_invalid",
  );
  const maximumErrors = readBoundedNumber(
    flags["max-errors"] ?? DEFAULT_MAX_CONSECUTIVE_ERRORS,
    1,
    20,
    "connector_max_errors_invalid",
  );
  const stop = createStopSignal();
  let consecutiveErrors = 0;
  if (ui.interactive) ui.wait("Connected. Waiting for approved work…");
  else process.stdout.write('{"event":"connector_waiting"}\n');

  try {
    while (!stop.signal.aborted) {
      try {
        const result = await connector.runOnce();
        consecutiveErrors = 0;
        if (result.status === "activation_result") {
          reportActivation(result, ui);
          if (ui.interactive) ui.wait("Connected. Waiting for approved work…");
        }
      } catch (error) {
        consecutiveErrors += 1;
        if (ui.interactive) {
          ui.stopWait("Receiver unavailable", `${safeErrorMessage(error)} · ${consecutiveErrors}/${maximumErrors}`, "warning");
        } else {
          process.stderr.write(`${JSON.stringify({
            event: "connector_poll_failed",
            code: error?.code ?? "connector_poll_failed",
            attempt: consecutiveErrors,
          })}\n`);
        }
        if (consecutiveErrors >= maximumErrors) throw error;
        if (ui.interactive) ui.wait("Reconnecting to Re-entry…");
      }
      await waitForNextPoll(pollIntervalMs, stop.signal);
    }
  } finally {
    stop.close();
    if (ui.interactive) ui.stopWait("Connector stopped", "No local credential was removed", "info");
    else process.stdout.write('{"event":"connector_stopped"}\n');
  }
}

async function inspectReceiver(origin) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3_000);
  try {
    const response = await fetch(`${origin}/readyz`, {
      method: "GET",
      headers: { Accept: "application/json" },
      redirect: "error",
      signal: controller.signal,
    });
    return response.status === 200;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function claimOnce(flags, ui, options = {}) {
  if (!options.quietHeader && ui.interactive) {
    ui.begin("Check for approved work", "One-shot delivery check");
  }
  const credentialFile = flags["credential-file"] ?? defaultCredentialFile();
  const store = new LocalConnectorCredentialStore({ filename: credentialFile });
  const credentials = await store.load();
  if (!credentials) throw cliFailure("connector_credentials_missing");
  if (ui.interactive) ui.success("Credentials", "loaded from the local secure file");
  const client = new LocalConnectorClient({
    baseUrl: credentials.receiver_origin,
    connectorToken: credentials.connector_token,
    requestTimeoutMs: Number(flags.timeout ?? 5_000),
  });
  const codexDirectory = flags["codex-cd"];
  if (flags["codex-thread"] !== undefined) {
    throw cliFailure("connector_codex_thread_unsupported");
  }
  if (flags["codex-binary"] !== undefined && codexDirectory === undefined) {
    throw cliFailure("connector_codex_cd_missing");
  }
  const readiness = options.readiness ?? (codexDirectory === undefined ? null : inspectReadiness(flags));
  const workingDirectory = readiness?.workingDirectory;
  if (ui.interactive && !workingDirectory) {
    ui.warning("Codex", "no Host project was selected; this check will report activation as unsupported");
  }
  const connector = createRuntimeConnector(flags, credentials, readiness, client);
  if (ui.interactive) ui.wait("Checking the Receiver and starting Codex if work is ready…");
  const result = await connector.runOnce();
  if (result.status === "idle") {
    if (ui.interactive) {
      ui.stopWait("No pending work", "the Connector is ready and will exit now", "info");
    } else {
      process.stdout.write('{"event":"connector_idle"}\n');
    }
    return;
  }
  if (ui.interactive) {
    reportActivation(result, ui);
  } else {
    reportActivation(result, ui);
  }
}

function createRuntimeConnector(flags, credentials, readiness, existingClient = undefined) {
  const client = existingClient ?? new LocalConnectorClient({
    baseUrl: credentials.receiver_origin,
    connectorToken: credentials.connector_token,
    requestTimeoutMs: Number(flags.timeout ?? 5_000),
  });
  const codexDirectory = flags["codex-cd"];
  const workingDirectory = readiness?.workingDirectory;
  const executable = readiness?.installation.executable;
  const activationTimeoutMs = Number(flags["activation-timeout"] ?? 60_000);
  return new LocalConnector({
    client,
    adapter: codexDirectory === undefined
      ? unsupportedAdapter
      : createCodexExecAdapter({
        workingDirectory,
        executable,
        commandTimeoutMs: activationTimeoutMs,
      }),
    clock: () => new Date(),
    activationTimeoutMs,
    createClaimToken: () => randomBytes(32).toString("base64url"),
  });
}

function reportActivation(result, ui) {
  if (ui.interactive) {
    const accepted = result.result.outcome === "accepted";
    ui.stopWait(
      accepted ? "Codex session started" : "Activation finished",
      accepted ? "fresh session opened with the approved Re-entry context" : result.result.code,
      accepted ? "success" : "warning",
    );
    ui.info("Delivery", `${result.delivery_id} · ${result.result.outcome}`);
    return;
  }
  process.stdout.write(`${JSON.stringify({
    event: "connector_activation_result",
    delivery_id: result.delivery_id,
    event_id: result.event_id,
    outcome: result.result.outcome,
    code: result.result.code,
  })}\n`);
}

const unsupportedAdapter = {
  activate(activation) {
    return {
      type: "webmcp.agent_activation_result",
      protocol_version: "0.1",
      delivery_id: activation.delivery_id,
      event_id: activation.event_id,
      attempt: activation.attempt,
      outcome: "unsupported",
      code: "required_capability_unavailable",
      unavailable_capability: "managed_context_resume",
    };
  },
};

function parseArguments(argumentsList) {
  const hasLeadingJson = argumentsList[0] === "--json";
  const commandIndex = hasLeadingJson ? 1 : 0;
  const hasExplicitCommand = argumentsList[commandIndex] !== undefined
    && !argumentsList[commandIndex].startsWith("--");
  const command = hasExplicitCommand ? argumentsList[commandIndex] : "start";
  const rest = [
    ...(hasLeadingJson ? ["--json"] : []),
    ...(hasExplicitCommand ? argumentsList.slice(commandIndex + 1) : argumentsList.slice(commandIndex)),
  ];
  const flags = {};
  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (!value.startsWith("--")) throw cliFailure("connector_argument_invalid");
    const name = value.slice(2);
    if (name === "json") {
      if (Object.hasOwn(flags, name)) throw cliFailure("connector_argument_invalid");
      flags[name] = true;
      continue;
    }
    const next = rest[index + 1];
    if (!name || next === undefined || next.startsWith("--") || Object.hasOwn(flags, name)) throw cliFailure("connector_argument_invalid");
    flags[name] = next;
    index += 1;
  }
  return { command, flags };
}

function validateCommandFlags(command, flags) {
  const allowedByCommand = {
    doctor: new Set(["codex-binary", "codex-cd", "json"]),
    pair: new Set(["receiver", "code", "credential-file", "json"]),
    connect: new Set(["receiver", "device-name", "credential-file", "json"]),
    status: new Set(["credential-file", "codex-cd", "codex-binary", "json"]),
    install: new Set([
      "receiver",
      "device-name",
      "credential-file",
      "codex-cd",
      "codex-binary",
      "json",
    ]),
    "claim-once": new Set([
      "credential-file",
      "timeout",
      "codex-cd",
      "codex-binary",
      "codex-thread",
      "activation-timeout",
      "json",
    ]),
    start: new Set([
      "receiver",
      "device-name",
      "credential-file",
      "timeout",
      "codex-cd",
      "codex-binary",
      "codex-thread",
      "activation-timeout",
      "poll-interval",
      "max-errors",
      "json",
    ]),
  };
  const allowed = allowedByCommand[command];
  if (!allowed || Object.keys(flags).some((name) => !allowed.has(name))) {
    throw cliFailure("connector_argument_invalid");
  }
}

function requireFlag(flags, name) {
  const value = flags[name];
  if (typeof value !== "string" || value.length === 0) throw cliFailure(`connector_${name.replaceAll("-", "_")}_missing`);
  return value;
}

function defaultCredentialFile() {
  return join(homedir(), ".webmcp-connector", "credentials.json");
}

function defaultDeviceName() {
  const value = hostname().trim();
  return value.length >= 2 && Buffer.byteLength(value, "utf8") <= 80
    ? value
    : "This Mac";
}

function readBoundedNumber(value, minimum, maximum, code) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(number) || number < minimum || number > maximum) {
    throw cliFailure(code);
  }
  return number;
}

function createStopSignal() {
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  return {
    signal: controller.signal,
    close() {
      process.off("SIGINT", stop);
      process.off("SIGTERM", stop);
    },
  };
}

function waitForNextPoll(milliseconds, signal) {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(done, milliseconds);
    function done() {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    }
    signal.addEventListener("abort", done, { once: true });
  });
}

function cliFailure(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function safeErrorMessage(error) {
  if (typeof error?.message !== "string" || error.message.length === 0) {
    return "The Local Connector could not complete the command.";
  }
  return error.message.length > 240
    ? `${error.message.slice(0, 237)}...`
    : error.message;
}

async function askForPairingCode(ui) {
  if (!ui.interactive || process.stdin.isTTY !== true) {
    throw cliFailure("connector_pairing_code_missing");
  }
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await readline.question("  Enter the pairing code from your Host (XXXX-XXXX-XXXX-XXXX): ");
    return answer.trim();
  } finally {
    readline.close();
  }
}

function errorHint(error) {
  const hints = {
    connector_codex_cd_missing: "pass --codex-cd /absolute/path/to/your/Host-project",
    connector_codex_not_found: "install Codex, add it to PATH, or pass --codex-binary /path/to/codex",
    connector_codex_binary_not_found: "check --codex-binary or remove it to use automatic discovery",
    connector_codex_unusable: "open Codex, complete login if needed, then run `npm run doctor` again",
    connector_node_unsupported: "use Node.js 24 or newer, then run the command again",
    connector_credentials_missing: "connect this Mac once with `reentry connect`",
    connector_credentials_expired: "run `reentry connect` to authorize this Mac again",
    connector_pairing_code_missing: "ask the Host backend for a new pairing code, then run pair in a terminal",
    pairing_code_invalid: "use the 16-character code returned by the Host, for example ABCD-EFGH-IJKL-MNOP",
    host_subject_already_paired: "use the existing Connector credential or revoke/reset the preview pairing",
    pairing_expired: "ask the Host backend for a new pairing code",
    device_authorization_expired: "run `reentry connect` again and approve within ten minutes",
    device_authorization_denied: "run `reentry connect` again when you are ready to approve this Mac",
    connector_poll_interval_invalid: "use a polling interval between 1000 and 60000 milliseconds",
    connector_max_errors_invalid: "use a maximum error count between 1 and 20",
    connector_service_load_failed: "run `reentry install` again; if it still fails, inspect the Connector error log",
  };
  return hints[error?.code] ?? "check the Receiver address and try again";
}

await main();
