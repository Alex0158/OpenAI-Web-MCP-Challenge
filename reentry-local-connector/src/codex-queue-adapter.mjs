import { spawn } from "node:child_process";

import {
  AGENT_ACTIVATION_RESULT_TYPE,
  validateAgentActivation,
} from "@webmcp-challenge/reentry-core/agent-adapter";
import { createManagedContextAdapter } from "@webmcp-challenge/reentry-core/managed-context-adapter";

export const CODEX_QUEUE_ADAPTER_ID = "codex_queue_local";
export const DEFAULT_CODEX_EXECUTABLE = "/Applications/ChatGPT.app/Contents/Resources/codex";

const OPTION_FIELDS = Object.freeze([
  "threadId",
  "executable",
  "commandTimeoutMs",
  "clock",
  "spawnCommand",
]);
const MIN_COMMAND_TIMEOUT_MS = 100;
const MAX_COMMAND_TIMEOUT_MS = 60_000;
const MAX_REFERENCE_BYTES = 4 * 1_024;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

/**
 * Create the Codex adapter that lives inside the Local Connector process.
 *
 * This is a deliberately small local preview. The configured thread is private local binding
 * state and never comes from the Receiver event or the Agent activation value. A future
 * production adapter must replace the single-session binding with a Grant-scoped binding
 * authority and prove Browser/WebMCP acquisition separately.
 */
export function createCodexQueueAdapter(options) {
  requireExactRecord(options, OPTION_FIELDS, ["threadId"], "Codex queue adapter options");
  const threadId = requireReference(options.threadId, "Codex thread");
  const executable = requireReference(
    options.executable ?? DEFAULT_CODEX_EXECUTABLE,
    "Codex executable",
  );
  const commandTimeoutMs = requireTimeout(options.commandTimeoutMs ?? 5_000);
  const clock = options.clock ?? (() => new Date());
  const spawnCommand = options.spawnCommand ?? spawn;
  if (typeof clock !== "function") throw new TypeError("Codex queue adapter clock must be a function");
  if (typeof spawnCommand !== "function") {
    throw new TypeError("Codex queue adapter spawnCommand must be a function");
  }

  const bindingsByGrant = new Map();
  const managedAdapter = createManagedContextAdapter({
    adapterId: CODEX_QUEUE_ADAPTER_ID,
    bindingAuthority: {
      resolveBinding({ grantId }) {
        return bindingsByGrant.get(grantId) ?? null;
      },
    },
    activateBoundContext({ activation, bindingRef }) {
      return queueCodexMessage({
        executable,
        threadId: bindingRef,
        message: buildContinuationMessage(activation),
        timeoutMs: commandTimeoutMs,
        spawnCommand,
      }).then(() => activationResult(
        activation,
        "accepted",
        "activation_dispatch_accepted",
        null,
      ));
    },
    clock,
  });

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

      const grantId = activation.receipt.grant_id;
      if (!bindingsByGrant.has(grantId)) {
        bindingsByGrant.set(grantId, {
          type: "webmcp.managed_context_binding",
          protocol_version: "0.1",
          grant_id: grantId,
          adapter_id: CODEX_QUEUE_ADAPTER_ID,
          binding_ref: threadId,
          bound_at: now.toISOString(),
          expires_at: activation.receipt.expires_at,
        });
      }
      return managedAdapter.activate(activation);
    },
  });
}

function buildContinuationMessage(activation) {
  return [
    "Re-entry continuation is ready.",
    "Open the exact canonical page below, read its current state, and continue the existing task.",
    "Use only the page's current WebMCP tools and stop before the human decision boundary.",
    `Canonical page: ${activation.continuation.canonical_url}`,
  ].join("\n");
}

function queueCodexMessage({ executable, threadId, message, timeoutMs, spawnCommand }) {
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
        ["queue", "--thread", threadId, "--message", message],
        { stdio: ["ignore", "ignore", "ignore"] },
      );
    } catch (error) {
      finish(reject, error);
      return;
    }

    if (!child || typeof child.once !== "function") {
      finish(reject, new Error("Codex queue process is invalid"));
      return;
    }

    timer = setTimeout(() => {
      try {
        child.kill?.("SIGTERM");
      } catch {
        // The activation remains unknown even if the process cannot be terminated.
      }
      finish(reject, new Error("Codex queue process timed out"));
    }, timeoutMs);

    child.once("error", (error) => finish(reject, error));
    child.once("close", (code, signal) => {
      if (code === 0 && signal === null) {
        finish(resolve);
        return;
      }
      finish(reject, new Error("Codex queue process did not complete successfully"));
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
    throw new TypeError("Codex queue adapter clock must return a valid Date");
  }
  return new Date(value.getTime());
}

function requireTimeout(value) {
  if (
    !Number.isSafeInteger(value) ||
    value < MIN_COMMAND_TIMEOUT_MS ||
    value > MAX_COMMAND_TIMEOUT_MS
  ) {
    throw new TypeError("Codex queue adapter commandTimeoutMs is invalid");
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
