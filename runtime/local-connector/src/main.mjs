#!/usr/bin/env node

import { homedir, hostname } from "node:os";
import { createInterface } from "node:readline/promises";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import process from "node:process";

import { LocalConnectorClient } from "@webmcp-challenge/reentry-core/local-connector-client";
import { followConnectorActivity } from "./activity-monitor.mjs";
import {
  createCodexExecAdapter,
  DEFAULT_CODEX_PROMPT_TIMEOUT_MS,
  MAX_CODEX_PROMPT_TIMEOUT_MS,
  runCodexPrompt,
} from "./codex-exec-adapter.mjs";
import {
  discoverCodexExecutable,
  requireSupportedNode,
  validateCodexWorkingDirectory,
  verifyCodexExecutable,
} from "./codex-discovery.mjs";
import { LocalConnector } from "./local-connector.mjs";
import { disconnectConnectorLifecycle } from "./disconnect-lifecycle.mjs";
import {
  LocalConnectorCredentialStore,
  clearConnectorReauthorizationRequired,
  hasConnectorReauthorizationRequired,
  markConnectorReauthorizationRequired,
} from "./credentials.mjs";
import { LocalConnectorPairingClient, openBrowser } from "./pairing-client.mjs";
import { chooseWorkspaceDirectory } from "./workspace-picker.mjs";
import {
  inspectMacConnectorService,
  disconnectMacConnectorService,
  installMacConnectorService,
  stopMacConnectorService,
  uninstallMacConnectorService,
} from "./macos-service.mjs";
import { createTerminalUi } from "./terminal-ui.mjs";

// This is the current Cloud Receiver v2 preview. A command-line --receiver override remains
// authoritative, and REENTRY_RECEIVER_ORIGIN can override this built-in preview default.
const BUILT_IN_RECEIVER_ORIGIN = "https://cloud-receiver-delta.vercel.app";
const DEFAULT_RECEIVER_ORIGIN = process.env.REENTRY_RECEIVER_ORIGIN?.trim() || BUILT_IN_RECEIVER_ORIGIN;
const DEFAULT_POLL_INTERVAL_MS = 5_000;
const DEFAULT_MAX_CONSECUTIVE_ERRORS = 5;
const DEFAULT_PAIRING_REQUEST_TIMEOUT_MS = 20_000;
const CONNECTOR_VERSION = readConnectorVersion();
// The npx form is executable even when this CLI was launched from a temporary npx cache.
const TEMPORARY_CLI_COMMAND = "npx --yes @4xeoz/re-entry";

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
    const { command, flags, positionals } = parseArguments(argumentsList);
    validateCommandFlags(command, flags, positionals);
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
    if (command === "listen") {
      await listen(flags, ui);
      return;
    }
    if (command === "test") {
      await testCodex(flags, positionals, ui);
      return;
    }
    if (command === "stop") {
      await stop(flags, ui);
      return;
    }
    if (command === "disconnect") {
      await disconnect(flags, ui);
      return;
    }
    if (command === "uninstall") {
      await uninstall(flags, ui);
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
  re-entry install                                      Recommended first run
  re-entry listen                                      Watch live activity
  re-entry disconnect                                  Sign out this Mac
  re-entry test "Reply with hello"                     Test Codex locally

Invocation:
  Temporary npx: npx --yes @4xeoz/re-entry <command>
  Global install: npm install --global @4xeoz/re-entry, then re-entry <command>

Commands:
  install      Check this Mac, connect the Re-entry account, and start at login
  status       Show account, Receiver, service, Node.js, and Codex readiness
  listen       Watch the background Connector until you press Ctrl+C
  test         Start one fresh local Codex session with the supplied prompt
  stop         Stop the background Connector without removing its credential
  disconnect   Revoke Cloud access and clear this Mac's saved connection
  uninstall    Stop the Connector and remove its local service data
  connect      Open Re-entry, redeem a dashboard pairing ID and code, and connect this Mac
  start        Poll for approved work until stopped
  doctor       Check Node.js, Codex, and the optional project directory
  claim-once   Check once for approved work
  pair         Legacy Host-code pairing preview

Common options:
  --receiver <url>       Accepted Receiver origin (overrides the preview default)
  --codex-cd <path>      Workspace for Codex; interactive mode offers a folder picker if omitted
  --codex-binary <path>  Explicit Codex executable
  --pairing-id <id>      Pairing ID shown beside the one-time code
  --pairing-code <code>  One-time code shown in the Re-entry dashboard
  --activation-timeout <ms>
                         Codex limit; test defaults to 1 hour, background start to 60 seconds
  --json                 Machine-readable output
  --yes                  Confirm uninstall in a non-interactive script
  --help                 Show this help
  --version              Show the installed version

Default Receiver:
  https://cloud-receiver-delta.vercel.app
  Override with --receiver or REENTRY_RECEIVER_ORIGIN for another accepted Receiver.

Both commands are installed: re-entry and reentry.
The Connector opens no inbound port. Host keys never belong on this Mac.
`);
}

function cliCommand(command) {
  return `${TEMPORARY_CLI_COMMAND} ${command}`;
}

function showInstallGuide(ui, workingDirectory) {
  const workspace = shellQuote(workingDirectory);
  ui.commands("COPY-PASTE COMMANDS", [
    {
      label: "Connect / install",
      command: cliCommand(`install --codex-cd ${workspace}`),
      detail: "run after disconnecting to connect one account on this Mac",
    },
    {
      label: "Check status",
      command: cliCommand("status"),
      detail: "account, Cloud, background service, Node.js, and Codex",
    },
    {
      label: "Watch activity",
      command: cliCommand("listen"),
      detail: "follow live work; Ctrl+C closes this view",
    },
    {
      label: "Test Codex",
      command: cliCommand(`test "Reply exactly: Re-entry is working." --codex-cd ${workspace}`),
      detail: "local smoke test; no Cloud work is claimed",
    },
    {
      label: "Check readiness",
      command: cliCommand(`doctor --codex-cd ${workspace}`),
      detail: "verify Node.js, Codex, and the workspace",
    },
    {
      label: "Start manually",
      command: cliCommand(`start --codex-cd ${workspace}`),
      detail: "foreground delivery loop for development",
    },
    {
      label: "Check once",
      command: cliCommand(`claim-once --codex-cd ${workspace}`),
      detail: "one delivery check, then exit",
    },
    {
      label: "Pause",
      command: cliCommand("stop"),
      detail: "stop background delivery; keep the account connected",
    },
    {
      label: "Sign out",
      command: cliCommand("disconnect"),
      detail: "clear this Mac's saved account connection",
    },
    {
      label: "Remove setup",
      command: cliCommand("uninstall"),
      detail: "remove the local service, credential, and logs",
    },
    {
      label: "Show all help",
      command: cliCommand("--help"),
      detail: "all commands, options, and the legacy pairing command",
    },
  ]);
  ui.info("Account", "one account connected on this Mac; disconnect before connecting another");
  ui.info("Test timeout", "one-shot Codex tests wait up to 1 hour by default");
}

function showTestGuide(ui, workingDirectory, prompt) {
  const workspace = shellQuote(workingDirectory);
  ui.commands("COPY-PASTE COMMANDS", [
    {
      label: "Test again",
      command: cliCommand(`test ${shellQuote(prompt)} --codex-cd ${workspace}`),
      detail: "run another local Codex smoke test",
    },
    {
      label: "Check readiness",
      command: cliCommand(`doctor --codex-cd ${workspace}`),
      detail: "verify Node.js, Codex, and the workspace",
    },
    {
      label: "Show all help",
      command: cliCommand("--help"),
      detail: "all commands, options, and account lifecycle actions",
    },
  ]);
  ui.info("Scope", "local Codex test only; no account or Cloud work was used");
  ui.info("Test timeout", "one-shot Codex tests wait up to 1 hour by default");
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
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
  if (ui.interactive) {
    ui.begin("System check", "Confirm that this Mac is ready for Re-entry.");
    ui.section("CHECK", "Requirements");
  }
  const readiness = inspectReadiness(flags);
  showReadiness(readiness, ui, { detailed: true });
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

async function withWorkspaceDirectory(flags, ui) {
  if (flags["codex-cd"] !== undefined || !ui.interactive) {
    return { ...flags, "codex-cd": flags["codex-cd"] ?? process.cwd() };
  }
  const selected = await chooseWorkspaceDirectory({ startDirectory: process.cwd() });
  if (!selected) throw cliFailure("connector_codex_cd_missing");
  return { ...flags, "codex-cd": selected };
}

function showReadiness(readiness, ui, options = {}) {
  if (!ui.interactive) return;
  ui.success("Node.js", `v${process.versions.node}`);
  ui.success(
    "Codex",
    options.detailed
      ? `${readiness.installation.version} · ${readiness.installation.executable}`
      : "ready",
  );
  if (options.includeWorkspace !== false) {
    if (readiness.workingDirectory) {
      ui.success("Workspace", readiness.workingDirectory);
    } else {
      ui.info("Workspace", "selected automatically when Re-entry starts");
    }
  }
}

async function pair(flags, ui, options = {}) {
  if (!options.quietHeader && ui.interactive) {
    ui.begin("Pair this Mac", "One-time approval connects this Connector to a Host user");
  }
  const receiver = requireFlag(flags, "receiver");
  const credentialFile = flags["credential-file"] ?? defaultCredentialFile();
  const store = new LocalConnectorCredentialStore({ filename: credentialFile });
  if (await store.load()) throw cliFailure("connector_account_already_connected");
  if (ui.interactive) {
    ui.step("Receiver", receiver);
  }
  const userCode = flags.code ?? await askForPairingCode(ui);
  if (ui.interactive) ui.step("Pairing code", "received");
  const client = new LocalConnectorPairingClient({
    baseUrl: receiver,
    requestTimeoutMs: DEFAULT_PAIRING_REQUEST_TIMEOUT_MS,
  });
  if (ui.interactive) ui.wait("Contacting Re-entry…");
  const credentials = await client.pair({ userCode }, async ({ verificationUri }) => {
    if (ui.interactive) {
      ui.stopWait("Secure link", "ready");
      ui.info("Browser link", verificationUri);
      await waitForEnterToOpenBrowser();
      ui.wait("Waiting for approval in your browser…");
    } else {
      process.stdout.write(`${JSON.stringify({ event: "pairing_waiting", verification_uri: verificationUri })}\n`);
    }
  });
  if (ui.interactive) {
    ui.stopWait("Approved", "this Mac is connected");
    if (!credentials.browserOpened) {
      ui.warning("Browser", "did not open automatically; use the URL above");
    }
  }
  await store.save({
    version: 1,
    receiver_origin: receiver,
    connector_id: credentials.connector_id,
    connector_token: credentials.connector_token,
    connector_expires_at: credentials.connector_expires_at,
  });
  if (ui.interactive) {
    ui.complete("Pairing complete", "Re-entry can now deliver approved work to this Mac.");
    ui.next(cliCommand("start"), "Wait for approved work in this terminal.");
  } else {
    process.stdout.write(`${JSON.stringify({ event: "connector_paired", connector_id: credentials.connector_id })}\n`);
  }
}

async function connect(flags, ui, options = {}) {
  if (!options.quietHeader && ui.interactive) {
    ui.begin("Connect this Mac", "Create a Re-entry account, pair this Mac, then leave it running");
  }
  const receiver = flags.receiver ?? DEFAULT_RECEIVER_ORIGIN;
  if (typeof receiver !== "string" || receiver.trim().length === 0) {
    throw cliFailure("connector_receiver_missing");
  }
  const credentialFile = flags["credential-file"] ?? defaultCredentialFile();
  const store = new LocalConnectorCredentialStore({ filename: credentialFile });
  const current = await store.load();
  const reauthorizationRequired = await hasConnectorReauthorizationRequired(credentialFile);
  const currentIsValid = current && Date.parse(current.connector_expires_at) > Date.now();
  if (currentIsValid && current.receiver_origin === receiver && !reauthorizationRequired) {
    if (ui.interactive) {
      ui.success("Account", "already connected");
      if (!options.guidedInstall) {
        ui.next(cliCommand("start"), "Wait for approved work in this terminal.");
      }
    } else {
      process.stdout.write(`${JSON.stringify({
        event: "connector_already_connected",
        connector_id: current.connector_id,
        receiver_origin: current.receiver_origin,
      })}\n`);
    }
    return current;
  }

  if (current) throw cliFailure("connector_account_already_connected");

  if (ui.interactive) {
    if (!options.guidedInstall) ui.info("Re-entry", displayReceiver(receiver));
    ui.info("This Mac", flags["device-name"] ?? defaultDeviceName());
  }
  const client = new LocalConnectorPairingClient({
    baseUrl: receiver,
    requestTimeoutMs: DEFAULT_PAIRING_REQUEST_TIMEOUT_MS,
  });
  const portalUrl = `${receiver}/user-register?next=${encodeURIComponent("/user-dashboard")}`;
  if (ui.interactive) {
    ui.stopWait("Secure link", "ready");
    ui.info("Re-entry", portalUrl);
    ui.info("Next", "Create or sign in, click Pair this Mac, then return here with the pairing ID and code.");
    if (!(await openBrowser(portalUrl))) {
      ui.warning("Browser", "could not open automatically; use the URL above");
    }
  } else {
    process.stdout.write(`${JSON.stringify({ event: "connector_account_pairing", portal_url: portalUrl })}\n`);
  }
  const pairingId = flags["pairing-id"] ?? await askForPairingId(
    ui,
    "  Enter the pairing ID shown beside the code: ",
  );
  if (ui.interactive) ui.step("Pairing ID", "received");
  const pairingCode = flags["pairing-code"] ?? await askForPairingCode(
    ui,
    "  Enter the pairing code shown in your Re-entry dashboard (XXXX-XXXX): ",
  );
  if (ui.interactive) ui.step("Pairing code", "received");
  const credentials = await client.connectWithPairingCode({
    pairingId,
    pairingCode,
    deviceName: flags["device-name"] ?? defaultDeviceName(),
  });
  if (ui.interactive) {
    ui.success("Account", "connected");
  }
  const saved = {
    version: 1,
    receiver_origin: receiver,
    connector_id: credentials.connector_id,
    connector_token: credentials.connector_token,
    connector_expires_at: credentials.connector_expires_at,
  };
  await store.save(saved);
  await clearConnectorReauthorizationRequired(credentialFile);
  if (ui.interactive) {
    if (!options.guidedInstall) {
      ui.complete("This Mac is connected", "Re-entry can now route approved work here.");
      ui.next(cliCommand("start"), "Wait for approved work in this terminal.");
    }
  } else {
    process.stdout.write(`${JSON.stringify({
      event: "connector_connected",
      connector_id: credentials.connector_id,
    })}\n`);
  }
  return saved;
}

async function status(flags, ui) {
  if (ui.interactive) ui.begin("Status", "A quick check of this Mac and Re-entry.");
  const credentialFile = flags["credential-file"] ?? defaultCredentialFile();
  const credentials = await new LocalConnectorCredentialStore({ filename: credentialFile }).load();
  const reauthorizationRequired = await hasConnectorReauthorizationRequired(credentialFile);
  const readiness = inspectReadiness(flags);
  const service = await inspectMacConnectorService();
  const receiverReady = credentials ? await inspectReceiver(credentials.receiver_origin) : false;
  const connected = Boolean(
    credentials &&
    Date.parse(credentials.connector_expires_at) > Date.now() &&
    !reauthorizationRequired,
  );
  const credentialExpired = Boolean(
    credentials && Date.parse(credentials.connector_expires_at) <= Date.now(),
  );
  if (ui.interactive) {
    ui.section("SYSTEM", "This Mac");
    showReadiness(readiness, ui);
    ui.section("CONNECTION", "Re-entry");
    if (reauthorizationRequired) ui.warning("Account", "disconnect required before reconnecting");
    else if (credentialExpired) ui.warning("Account", "connection expired; disconnect before reconnecting");
    else if (connected) ui.success("Account", "connected");
    else ui.warning("Account", "not connected");
    if (reauthorizationRequired && service.running) ui.warning("Background", "paused until this Mac is reconnected");
    else if (service.running) ui.success("Background", "running");
    else if (service.installed) ui.warning("Background", "stopped");
    else ui.warning("Background", "not installed");
    if (receiverReady) ui.success("Cloud", "online");
    else if (credentials) ui.warning("Cloud", "unavailable");

    if (reauthorizationRequired || credentialExpired) {
      ui.next(cliCommand("disconnect"), "Clear this Mac's saved connection, then run install to connect again.");
    } else if (!connected || !service.running) {
      ui.next(cliCommand("install"), "Finish setup and start Re-entry in the background.");
    } else if (!receiverReady) {
      ui.next(cliCommand("status"), "Check again when the Re-entry Cloud service is available.");
    } else {
      ui.complete("Everything looks good", "Re-entry is ready for approved work.");
      ui.next(cliCommand("listen"), "Watch live activity. Press Ctrl+C when you are done.");
    }
  } else {
    process.stdout.write(`${JSON.stringify({
      event: "connector_status",
      connected,
      reauthorization_required: reauthorizationRequired,
      connector_id: credentials?.connector_id ?? null,
      receiver_origin: credentials?.receiver_origin ?? null,
      receiver_ready: receiverReady,
      credential_expired: credentialExpired,
      service_installed: service.installed,
      service_running: service.running,
      codex_binary: readiness.installation.executable,
      codex_version: readiness.installation.version,
      codex_working_directory: readiness.workingDirectory,
    })}\n`);
  }
}

async function listen(flags, ui) {
  if (ui.interactive) {
    ui.begin("Live activity", "Watch the background Connector. Ctrl+C closes this view.");
  }
  const service = await inspectMacConnectorService();
  const credentials = await new LocalConnectorCredentialStore({
    filename: defaultCredentialFile(),
  }).load();
  const reauthorizationRequired = await hasConnectorReauthorizationRequired(defaultCredentialFile());
  const credentialExpired = Boolean(
    credentials && Date.parse(credentials.connector_expires_at) <= Date.now(),
  );
  if (reauthorizationRequired || credentialExpired || !service.running || !credentials) {
    if (ui.interactive) {
      if (reauthorizationRequired) {
        ui.warning("Account", "disconnect required; the Cloud Receiver rejected this Mac");
        ui.next(cliCommand("disconnect"), "Clear this Mac's saved connection, then run install again.");
      }
      if (credentialExpired) {
        ui.warning("Account", "connection expired");
        ui.next(cliCommand("disconnect"), "Clear this Mac's saved connection, then run install again.");
      }
      if (!credentials) ui.warning("Account", "not connected");
      if (!service.running) ui.warning("Background", "not running");
      ui.next(cliCommand("install"), "Finish setup and start the background Connector.");
    } else {
      process.stdout.write(`${JSON.stringify({
        event: "connector_listener_unavailable",
        connected: Boolean(credentials),
        reauthorization_required: reauthorizationRequired,
        credential_expired: credentialExpired,
        service_running: service.running,
      })}\n`);
    }
    return;
  }

  if (ui.interactive) {
    ui.success("Background", "running");
    ui.success("Account", "connected");
    ui.wait("Listening for approved work…");
  } else {
    process.stdout.write('{"event":"connector_listener_started"}\n');
  }

  const stopSignal = createStopSignal();
  try {
    await followConnectorActivity({
      paths: defaultConnectorLogFiles(),
      signal: stopSignal.signal,
      onEvent(event) {
        if (ui.interactive) reportLiveActivity(event, ui);
        else process.stdout.write(`${JSON.stringify(event)}\n`);
      },
    });
  } finally {
    stopSignal.close();
    if (ui.interactive) {
      ui.stopWait("Live view closed", "the background Connector is still running", "info");
    } else {
      process.stdout.write('{"event":"connector_listener_stopped"}\n');
    }
  }
}

async function testCodex(flags, positionals, ui) {
  const prompt = requireTestPrompt(positionals);
  const runtimeFlags = await withWorkspaceDirectory(flags, ui);
  const readiness = inspectReadiness(runtimeFlags);
  if (ui.interactive) {
    ui.begin("Test Codex", "Run one local prompt through the Re-entry Codex adapter.");
    ui.success("Codex", "ready");
    ui.success("Workspace", readiness.workingDirectory);
    ui.info("Prompt", prompt);
    ui.wait("Starting a fresh Codex session…");
  }
  if (ui.interactive) {
    ui.stopWait("Codex", "running the local prompt; Codex output follows below", "info");
  }
  await runCodexPrompt({
    workingDirectory: readiness.workingDirectory,
    executable: readiness.installation.executable,
    prompt,
    stdio: ui.interactive ? "inherit" : ["ignore", "ignore", "ignore"],
    commandTimeoutMs: readBoundedNumber(
      flags["activation-timeout"] ?? DEFAULT_CODEX_PROMPT_TIMEOUT_MS,
      100,
      MAX_CODEX_PROMPT_TIMEOUT_MS,
      "connector_test_timeout_invalid",
    ),
  });
  if (ui.interactive) {
    ui.stopWait("Codex", "completed the local test");
    ui.complete("Test passed", "The same fresh-session process seam is ready for Re-entry work.");
    showTestGuide(ui, readiness.workingDirectory, prompt);
  } else {
    process.stdout.write('{"event":"connector_codex_test_passed"}\n');
  }
}

function reportLiveActivity(event, ui) {
  if (event.event === "connector_waiting") return;
  if (event.event === "connector_activation_result") {
    const accepted = event.outcome === "accepted";
    ui.stopWait(
      accepted ? "Work received" : "Work finished",
      accepted ? "a fresh Codex session was started" : String(event.outcome ?? "unknown"),
      accepted ? "success" : "warning",
    );
  } else if (event.event === "connector_reauthorization_required" || event.code === "connector_identity_invalid") {
    ui.stopWait("Reconnect required", "the Cloud Receiver rejected this Mac's saved connection", "warning");
    ui.next(cliCommand("disconnect"), "Clear this Mac's saved connection, then run install again.");
    return;
  } else if (event.event === "connector_poll_failed" || event.event === "local_connector_failed") {
    ui.stopWait("Connection interrupted", "Re-entry is retrying", "warning");
  } else if (event.event === "connector_ready") {
    ui.stopWait("Connector", "ready", "success");
  } else if (event.event === "connector_stopped") {
    ui.stopWait("Background", "stopped", "warning");
  } else {
    ui.stopWait("Activity", event.event.replaceAll("_", " "), "info");
  }
  ui.wait("Listening for approved work…");
}

async function stop(flags, ui) {
  if (ui.interactive) {
    ui.begin("Stop the Connector", "Pause background delivery without removing your account connection");
  }
  const result = await stopMacConnectorService();
  if (ui.interactive) {
    if (!result.supported) ui.warning("Platform", "background service control currently supports macOS only");
    else if (result.stopped) ui.complete("Re-entry is paused", "Your account connection is still saved.");
    else ui.info("Already stopped", "no running background Connector was found");
    if (result.supported) ui.next(cliCommand("install"), "Start Re-entry in the background again.");
  } else {
    process.stdout.write(`${JSON.stringify({
      event: "connector_stopped",
      supported: result.supported,
      stopped: result.stopped,
    })}\n`);
  }
}

async function disconnect(flags, ui) {
  if (ui.interactive) {
    ui.begin("Disconnect Re-entry", "Revoke Cloud access and clear this Mac's saved connection");
  }
  const credentialFile = flags["credential-file"] ?? defaultCredentialFile();
  const credentials = await new LocalConnectorCredentialStore({ filename: credentialFile }).load();
  const lifecycle = await disconnectConnectorLifecycle({
    credentials,
    async revokeRemote(saved) {
      const client = new LocalConnectorPairingClient({
        baseUrl: saved.receiver_origin,
        requestTimeoutMs: DEFAULT_PAIRING_REQUEST_TIMEOUT_MS,
      });
      return client.disconnectConnector({ connectorToken: saved.connector_token });
    },
    async clearLocal() {
      return disconnectMacConnectorService({ credentialFile });
    },
  });
  const result = lifecycle.local;
  if (ui.interactive) {
    if (lifecycle.remote) {
      ui.success("Cloud", lifecycle.remote.duplicate ? "already disconnected" : "access revoked");
    }
    if (!result.supported) {
      ui.warning("Platform", "connection lifecycle control currently supports macOS only");
    } else if (result.disconnected) {
      ui.complete("This Mac is disconnected", "Cloud access, the LaunchAgent, and the local credential are cleared.");
    } else {
      ui.info("Already disconnected", "No saved local connection or background service was found.");
    }
    if (result.supported) ui.next(cliCommand("install"), "Connect this Mac to one Re-entry account again.");
  } else {
    process.stdout.write(`${JSON.stringify({
      event: "connector_disconnected",
      supported: result.supported,
      disconnected: result.disconnected,
      remote_disconnected: lifecycle.remote?.status === "disconnected",
      remote_duplicate: lifecycle.remote?.duplicate ?? null,
      removed_paths: result.removedPaths,
    })}\n`);
  }
}

async function uninstall(flags, ui) {
  if (ui.interactive) {
    ui.begin("Uninstall Re-entry", "Stop the Connector and remove only its local service data");
    ui.warning("This removes", "the LaunchAgent, saved Connector credential, and Connector logs");
    await askForUninstallConfirmation();
  } else if (flags.yes !== true) {
    throw cliFailure("connector_uninstall_confirmation_required");
  }
  const result = await uninstallMacConnectorService({
    credentialFile: flags["credential-file"] ?? defaultCredentialFile(),
  });
  if (ui.interactive) {
    ui.complete("Removed from this Mac", "The local service, connection, and logs are gone.");
    ui.next(cliCommand("install"), "Connect this Mac again whenever you are ready.");
  } else {
    process.stdout.write(`${JSON.stringify({
      event: "connector_uninstalled",
      supported: result.supported,
      removed_paths: result.removedPaths,
    })}\n`);
  }
}

async function install(flags, ui) {
  const runtimeFlags = await withWorkspaceDirectory(flags, ui);
  const readiness = inspectReadiness(runtimeFlags);
  if (ui.interactive) {
    ui.begin("Set up this Mac", "Three quick steps. You only do this once.");
    ui.section("1 OF 3", "Workspace");
    ui.success("Selected", readiness.workingDirectory);
    ui.section("2 OF 3", "System check");
    showReadiness(readiness, ui, { includeWorkspace: false });
    ui.section("3 OF 3", "Connect Re-entry", "Create or sign in to your account, then pair this Mac from the dashboard.");
  }
  const credentials = await connect(runtimeFlags, ui, { quietHeader: true, guidedInstall: true });
  if (ui.interactive) ui.wait("Starting Re-entry in the background…");
  const service = await installMacConnectorService({
    nodeExecutable: process.execPath,
    entrypoint: fileURLToPath(import.meta.url),
    workingDirectory: readiness.workingDirectory,
    credentialFile: flags["credential-file"] ?? defaultCredentialFile(),
  });
  if (ui.interactive) {
    ui.stopWait("Background", "running at login");
    ui.complete("You're all set", "Re-entry is connected and waiting for approved work.");
    showInstallGuide(ui, readiness.workingDirectory);
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
  const runtimeFlags = await withWorkspaceDirectory(flags, ui);
  const readiness = inspectReadiness(runtimeFlags);
  if (ui.interactive) {
    ui.begin("Start Re-entry", "Wait for work you have approved.");
    ui.section("READY", "This Mac");
    showReadiness(readiness, ui);
  }
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
    if (ui.interactive) ui.info("Re-entry", "first run — create an account and enter a dashboard pairing code");
    credentials = await connect(runtimeFlags, ui, { quietHeader: true });
  } else if (await hasConnectorReauthorizationRequired(credentialFile)) {
    if (ui.interactive) {
      ui.warning("Account", "this Mac must be disconnected before reconnecting");
      ui.next(cliCommand("disconnect"), "Clear the saved connection, then run install again.");
    } else {
      process.stdout.write('{"event":"connector_reauthorization_required"}\n');
    }
    return;
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
        if (error?.code === "connector_identity_invalid") {
          await markConnectorReauthorizationRequired(credentialFile, {
            receiver_origin: credentials.receiver_origin,
          });
          if (ui.interactive) {
            ui.stopWait("Reconnect required", "the Cloud Receiver rejected this Mac's saved connection", "warning");
            ui.next(cliCommand("disconnect"), "Clear this Mac's saved connection, then run install again.");
          } else {
            process.stdout.write('{"event":"connector_reauthorization_required"}\n');
          }
          return;
        }
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
      protocol_version: activation.protocol_version,
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
  const positionals = [];
  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (!value.startsWith("--")) {
      if (command !== "test") throw cliFailure("connector_argument_invalid");
      positionals.push(value);
      continue;
    }
    const name = value.slice(2);
    if (name === "json" || name === "yes") {
      if (Object.hasOwn(flags, name)) throw cliFailure("connector_argument_invalid");
      flags[name] = true;
      continue;
    }
    const next = rest[index + 1];
    if (!name || next === undefined || next.startsWith("--") || Object.hasOwn(flags, name)) throw cliFailure("connector_argument_invalid");
    flags[name] = next;
    index += 1;
  }
  return { command, flags, positionals };
}

function validateCommandFlags(command, flags, positionals) {
  const allowedByCommand = {
    doctor: new Set(["codex-binary", "codex-cd", "json"]),
    pair: new Set(["receiver", "code", "credential-file", "json"]),
    connect: new Set(["receiver", "device-name", "credential-file", "pairing-id", "pairing-code", "json"]),
    status: new Set(["credential-file", "codex-cd", "codex-binary", "json"]),
    listen: new Set(["json"]),
    test: new Set(["codex-cd", "codex-binary", "activation-timeout", "json"]),
    stop: new Set(["json"]),
    disconnect: new Set(["credential-file", "json"]),
    uninstall: new Set(["credential-file", "yes", "json"]),
    install: new Set([
      "receiver",
      "device-name",
      "credential-file",
      "codex-cd",
      "codex-binary",
      "pairing-id",
      "pairing-code",
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
  if (
    !allowed ||
    Object.keys(flags).some((name) => !allowed.has(name)) ||
    (command !== "test" && positionals.length > 0)
  ) {
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

function defaultConnectorLogFiles() {
  const stateDirectory = join(homedir(), ".webmcp-connector");
  return [
    join(stateDirectory, "connector.log"),
    join(stateDirectory, "connector-error.log"),
  ];
}

function defaultDeviceName() {
  const value = hostname().trim();
  return value.length >= 2 && Buffer.byteLength(value, "utf8") <= 80
    ? value
    : "This Mac";
}

function displayReceiver(origin) {
  try {
    return new URL(origin).host;
  } catch {
    return origin;
  }
}

function requireTestPrompt(positionals) {
  if (!Array.isArray(positionals) || positionals.length !== 1) {
    throw cliFailure("connector_test_prompt_missing");
  }
  const value = positionals[0];
  if (
    typeof value !== "string" ||
    value.trim() !== value ||
    value.length === 0 ||
    Buffer.byteLength(value, "utf8") > 4 * 1_024 ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    throw cliFailure("connector_test_prompt_invalid");
  }
  return value;
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

async function askForPairingId(ui, prompt = "  Enter the pairing ID: ") {
  return askForPairingValue(ui, prompt, "connector_pairing_id_missing");
}

async function askForPairingCode(ui, prompt = "  Enter the pairing code: ") {
  return askForPairingValue(ui, prompt, "connector_pairing_code_missing");
}

async function askForPairingValue(ui, prompt, missingCode) {
  if (!ui.interactive || process.stdin.isTTY !== true) {
    throw cliFailure(missingCode);
  }
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await readline.question(prompt);
    return answer.trim();
  } finally {
    readline.close();
  }
}

async function askForUninstallConfirmation() {
  if (process.stdin.isTTY !== true) throw cliFailure("connector_uninstall_confirmation_required");
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await readline.question("  Type DELETE to remove local Connector data: ");
    if (answer.trim() !== "DELETE") throw cliFailure("connector_uninstall_confirmation_required");
  } finally {
    readline.close();
  }
}

function errorHint(error) {
  const hints = {
    connector_codex_cd_missing: "pass --codex-cd /absolute/path/to/your/Host-project",
    connector_codex_not_found: "install Codex, add it to PATH, or pass --codex-binary /path/to/codex",
    connector_codex_binary_not_found: "check --codex-binary or remove it to use automatic discovery",
    connector_codex_unusable: `open Codex, complete login if needed, then run \`${cliCommand("doctor")}\` again`,
    connector_node_unsupported: "use Node.js 24 or newer, then run the command again",
    connector_receiver_missing: "pass --receiver <replacement-receiver-origin> or set REENTRY_RECEIVER_ORIGIN",
    connector_credentials_missing: `connect this Mac once with \`${cliCommand("connect")}\``,
    connector_credentials_expired: `run \`${cliCommand("disconnect")}\`, then \`${cliCommand("install")}\` to authorize this Mac again`,
    connector_credentials_already_exists: "use the existing Connector credential or ask for a new pairing ID and code",
    connector_account_already_connected: `run \`${cliCommand("disconnect")}\` before connecting a different account or Receiver`,
    connector_identity_invalid: `run \`${cliCommand("disconnect")}\`, then \`${cliCommand("install")}\` and approve this Mac again`,
    connector_reauthorization_required: `run \`${cliCommand("disconnect")}\`, then \`${cliCommand("install")}\` and approve this Mac again`,
    connector_pairing_id_missing: "copy the pairing ID shown beside the one-time code in the Re-entry dashboard",
    connector_pairing_code_missing: `ask the Host backend for a new pairing ID and code, then run \`${cliCommand("connect")}\` again`,
    account_pairing_code_invalid: "use the eight-character code shown in the Re-entry dashboard",
    pairing_code_invalid: "use the 16-character code returned by the Host, for example ABCD-EFGH-IJKL-MNOP",
    host_subject_already_paired: "use the existing Connector credential or revoke/reset the preview pairing",
    pairing_expired: "ask the Host backend for a new pairing ID and code",
    pairing_request_timeout: "the Receiver took too long to answer; check your connection and run the command again",
    pairing_network_error: "check your internet connection and the Receiver address, then try again",
    connector_codex_exec_timeout: "Codex did not finish in time; run the same codex exec command directly to inspect its output",
    connector_codex_exec_failed: "run the same codex exec command directly and confirm that Codex is signed in and the workspace is accessible",
    connector_codex_exec_start_failed: "open Codex, complete login if needed, then run the command again",
    connector_codex_exec_invalid: "the installed Codex executable returned an invalid process; run doctor and try again",
    workspace_directory_unavailable: "choose a readable folder or pass --codex-cd /absolute/path",
    workspace_selection_cancelled: "run the command again when you are ready to choose a workspace",
    device_authorization_expired: `run \`${cliCommand("connect")}\` again and approve within ten minutes`,
    device_authorization_denied: `run \`${cliCommand("connect")}\` again when you are ready to approve this Mac`,
    connector_poll_interval_invalid: "use a polling interval between 1000 and 60000 milliseconds",
    connector_max_errors_invalid: "use a maximum error count between 1 and 20",
    connector_service_load_failed: `run \`${cliCommand("install")}\` again; if it still fails, inspect the Connector error log`,
    connector_uninstall_confirmation_required: `run \`${cliCommand("uninstall")}\` interactively and type DELETE, or pass \`--yes\` in a deliberate script`,
    connector_service_stop_failed: `check the Connector status and try \`${cliCommand("stop")}\` again`,
    connector_test_prompt_missing: `use \`${cliCommand('test "Reply with: Re-entry is working."')}\``,
    connector_test_prompt_invalid: "use one short, single-line prompt inside quotes",
    connector_test_timeout_invalid: "use a test timeout between 100 and 3600000 milliseconds",
    connector_activation_timeout_invalid: "use an activation timeout between 100 and 60000 milliseconds",
  };
  return hints[error?.code] ?? "check the command output and try again";
}

await main();
