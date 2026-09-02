import { spawn } from "node:child_process";

import {
  AGENT_ACTIVATION_RESULT_TYPE,
  validateAgentActivation,
} from "@webmcp-challenge/reentry-core/agent-adapter";
import {
  discoverCodexExecutable,
  validateCodexWorkingDirectory,
} from "./codex-discovery.mjs";

export const CODEX_EXEC_ADAPTER_ID = "codex_exec_local";

const OPTION_FIELDS = Object.freeze([
  "workingDirectory",
  "executable",
  "commandTimeoutMs",
  "clock",
  "spawnCommand",
]);
const MIN_COMMAND_TIMEOUT_MS = 100;
const MAX_COMMAND_TIMEOUT_MS = 60_000;
const MAX_REFERENCE_BYTES = 4 * 1_024;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const PROMPT_CONTROL_CHARACTER_PATTERN = /[\u0000-\u0009\u000b-\u001f\u007f]/;

/**
 * Create the fresh-session Codex adapter that lives inside the Local Connector process.
 *
 * Each activation starts a new `codex exec` process. The activation's validated page context
 * becomes a fixed prompt; no existing Codex thread or session is looked up or resumed.
 */
export function createCodexExecAdapter(options) {
  requireExactRecord(options, OPTION_FIELDS, ["workingDirectory"], "Codex exec adapter options");
  const workingDirectory = validateCodexWorkingDirectory(options.workingDirectory);
  const executable = options.executable === undefined
    ? discoverCodexExecutable()
    : requireReference(options.executable, "Codex executable");
  const commandTimeoutMs = requireTimeout(options.commandTimeoutMs ?? 60_000);
  const clock = options.clock ?? (() => new Date());
  const spawnCommand = options.spawnCommand ?? spawn;
  if (typeof clock !== "function") throw new TypeError("Codex exec adapter clock must be a function");
  if (typeof spawnCommand !== "function") {
    throw new TypeError("Codex exec adapter spawnCommand must be a function");
  }

  return Object.freeze({
    async activate(rawActivation) {
      const activation = validateAgentActivation(rawActivation);
      const now = readClock(clock);
      if (
        Date.parse(activation.lease_expires_at) <= now.getTime() ||
        Date.parse(activation.receipt.expires_at) <= now.getTime()
      ) {
        return activationResult(activation, "rejected", "activation_rejected", null);
      }

      await runCodexPrompt({
        executable,
        workingDirectory,
        prompt: buildContinuationPrompt(activation),
        commandTimeoutMs,
        spawnCommand,
      });
      return activationResult(
        activation,
        "accepted",
        "activation_dispatch_accepted",
        null,
      );
    },
  });
}

/**
 * Run one local prompt through the same fresh Codex process seam used by real activations.
 * This helper carries no Receiver authority and is intended only for an explicit local smoke test.
 */
export async function runCodexPrompt(options) {
  requireExactRecord(
    options,
    ["workingDirectory", "prompt", "executable", "commandTimeoutMs", "spawnCommand"],
    ["workingDirectory", "prompt"],
    "Codex prompt options",
  );
  const workingDirectory = validateCodexWorkingDirectory(options.workingDirectory);
  const executable = options.executable === undefined
    ? discoverCodexExecutable()
    : requireReference(options.executable, "Codex executable");
  const prompt = requirePrompt(options.prompt);
  const timeoutMs = requireTimeout(options.commandTimeoutMs ?? 60_000);
  const spawnCommand = options.spawnCommand ?? spawn;
  if (typeof spawnCommand !== "function") {
    throw new TypeError("Codex prompt spawnCommand must be a function");
  }
  await runCodexExec({ executable, workingDirectory, prompt, timeoutMs, spawnCommand });
}

function buildContinuationPrompt(activation) {
  return [
    "You are a Re-entry continuation agent.",
    "This is a new session. Do not look for or resume another session.",
    "Open the exact canonical page below and read its current state.",
    "Continue the task using only the page's currently available WebMCP tools.",
    "Prepare the next safe step, then stop before the human decision boundary.",
    "Do not submit or perform the final consequential action.",
    "",
    "Re-entry context:",
    `Workflow: ${activation.continuation.workflow_id}`,
    `Event: ${activation.continuation.event_type}`,
    `State version: ${activation.continuation.state_version}`,
    `Canonical page: ${activation.continuation.canonical_url}`,
    `Human boundary: ${activation.receipt.human_boundary}`,
  ].join("\n");
}

function runCodexExec({ executable, workingDirectory, prompt, timeoutMs, spawnCommand }) {
  return new Promise((resolve, reject) => {
    let child;
    let settled = false;
    let timer;

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback(value);
    };

    try {
      child = spawnCommand(
        executable,
        ["exec", "--cd", workingDirectory, prompt],
        { stdio: ["ignore", "ignore", "ignore"] },
      );
    } catch (error) {
      finish(reject, error);
      return;
    }

    if (!child || typeof child.once !== "function") {
      finish(reject, new Error("Codex exec process is invalid"));
      return;
    }

    timer = setTimeout(() => {
      try {
        child.kill?.("SIGTERM");
      } catch {
        // The activation remains unknown even if the process cannot be terminated.
      }
      finish(reject, new Error("Codex exec process timed out"));
    }, timeoutMs);

    child.once("error", (error) => finish(reject, error));
    child.once("close", (code, signal) => {
      if (code === 0 && signal === null) {
        finish(resolve);
        return;
      }
      finish(reject, new Error("Codex exec process did not complete successfully"));
    });
  });
}

function activationResult(activation, outcome, code, unavailableCapability) {
  return Object.freeze({
    type: AGENT_ACTIVATION_RESULT_TYPE,
    protocol_version: "0.1",
    delivery_id: activation.delivery_id,
    event_id: activation.event_id,
    attempt: activation.attempt,
    outcome,
    code,
    unavailable_capability: unavailableCapability,
  });
}

function readClock(clock) {
  const value = clock();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new TypeError("Codex exec adapter clock must return a valid Date");
  }
  return new Date(value.getTime());
}

function requireTimeout(value) {
  if (
    !Number.isSafeInteger(value) ||
    value < MIN_COMMAND_TIMEOUT_MS ||
    value > MAX_COMMAND_TIMEOUT_MS
  ) {
    throw new TypeError("Codex exec adapter commandTimeoutMs is invalid");
  }
  return value;
}

function requireReference(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.trim() !== value ||
    Buffer.byteLength(value, "utf8") > MAX_REFERENCE_BYTES ||
    CONTROL_CHARACTER_PATTERN.test(value)
  ) {
    throw new TypeError(`${label} is invalid`);
  }
  return value;
}

function requirePrompt(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.trim() !== value ||
    Buffer.byteLength(value, "utf8") > MAX_REFERENCE_BYTES ||
    PROMPT_CONTROL_CHARACTER_PATTERN.test(value)
  ) {
    throw new TypeError("Codex prompt is invalid");
  }
  return value;
}

function requireExactRecord(value, allowedFields, requiredFields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  const fields = Object.keys(value);
  if (
    fields.some((field) => !allowedFields.includes(field)) ||
    requiredFields.some((field) => !fields.includes(field))
  ) {
    throw new TypeError(`${label} fields are invalid`);
  }
}
