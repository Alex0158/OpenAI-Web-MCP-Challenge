import { isAbsolute } from "node:path";

const CLASSIFICATION = "experimental_desktop_messaging_probe";
const TOOL_ITEMS = new Set(["mcpToolCall", "commandExecution", "fileChange", "dynamicToolCall",
  "webSearch", "imageGeneration", "collabAgentToolCall"]);
const PASSIVE_ITEMS = new Set(["userMessage", "agentMessage", "reasoning", "functionCallOutput"]);
const NATIVE_FAILURE_CODES = new Set(["native_connection_closed", "native_connection_failed",
  "native_connect_failed", "native_timeout", "native_unsafe_endpoint", "native_endpoint_changed",
  "native_endpoint_unavailable", "native_invalid_response", "native_invalid_catalog",
  "native_frame_too_large", "native_remote_error", "native_tool_unavailable", "native_tool_failed",
  "native_invalid_task_response", "native_request_too_large", "native_request_limit", "native_closed"]);

function nativeFailureCode(error) {
  return NATIVE_FAILURE_CODES.has(error?.code) ? error.code : null;
}

function failure(code) {
  return Object.assign(new Error(code), { code });
}

function exactData(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw failure("invalid_probe_input");
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(descriptors).some((key) => typeof key !== "string"
      || !keys.includes(key) || !Object.hasOwn(descriptors[key], "value"))) {
    throw failure("invalid_probe_input");
  }
}

function validId(value) {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value);
}

function inputText(item) {
  if (item?.type === "userMessage" && Array.isArray(item.content)) {
    return item.content.filter((part) => part?.type === "text" && typeof part.text === "string")
      .map((part) => part.text).join("\n");
  }
  if (item?.type === "functionCallOutput" && typeof item.output === "string") return item.output;
  // Current App readback can wrap delivered tool data in an untruncated text envelope.
  // This recognizes an observed shape, not authenticated provenance or a delivery receipt.
  const output = item?.output;
  if (item?.type === "functionCallOutput" && item.name === "send_message_to_thread"
      && item.namespace === "codex_app" && output && typeof output === "object"
      && !Array.isArray(output) && Object.keys(output).length === 2
      && Object.hasOwn(output, "text") && Object.hasOwn(output, "truncated")
      && output.truncated === false && typeof output.text === "string") return output.text;
  return "";
}

function fixedPrompt(marker) {
  return `Re-entry experimental Desktop bridge diagnostic. Correlation marker: ${marker}. `
    + "This is an operator-authorized transport test, not a Game business event or a new strategy. "
    + "Do not continue earlier workflows, use tools, open a Browser, read or change files, or contact services. "
    + `Reply with exactly ${marker} and stop.`;
}

function matchesPrompt(item, prompt) {
  const text = inputText(item).trim();
  if (text === prompt) return true;
  // The installed app may wrap a cross-task message. Do not forward its private caller metadata.
  const delegation = text.match(/^<codex_delegation>\s*<source_thread_id>[^<]+<\/source_thread_id>\s*<input>([\s\S]*)<\/input>\s*<\/codex_delegation>$/);
  return delegation?.[1].trim() === prompt;
}

/** A manually selected diagnostic target, never a production Grant binding. */
export function createProbeBridge(options = {}) {
  exactData(options, ["enabled", "targetId", "expectedCwd", "nativeClient", "priorMarker"]);
  const { enabled = false, targetId, expectedCwd, nativeClient, priorMarker = null } = options;
  if (typeof enabled !== "boolean" || !validId(targetId)
      || typeof expectedCwd !== "string" || !isAbsolute(expectedCwd)
      || expectedCwd.length > 4096 || /[\u0000-\u001f]/u.test(expectedCwd)
      || !nativeClient || ["capabilities", "readTask", "sendProbe", "close"]
        .some((key) => typeof nativeClient[key] !== "function")
      || (priorMarker !== null && (typeof priorMarker !== "string" || !/^[A-Z0-9_]{8,80}$/.test(priorMarker)))) {
    throw failure("invalid_probe_configuration");
  }
  let attempted = false;
  let closed = false;
  let submittedPrompt = null;
  let marker = null;
  let baselineIds = new Set();
  let state = {
    classification: CLASSIFICATION,
    submission: "not_sent",
    observation: "not_checked",
    sameTaskVerified: false,
    inputObserved: false,
    inputRole: "unobserved",
    markerResponseObserved: false,
    turnCompleted: false,
    unexpectedToolUseObserved: false,
    unexpectedItemTypeObserved: false,
    priorQueueMarkerObserved: false,
    browser: "not_attempted",
    receiverAcknowledgement: "not_attempted",
    reasonCode: "not_started",
    nativeFailureCode: null,
  };

  function result(patch = {}) {
    state = { ...state, ...patch };
    return { ...state };
  }

  function verifyReadback(value) {
    const thread = value?.thread;
    if (!thread || thread.id !== targetId || thread.kind !== "codex" || thread.hostId !== "local"
        || thread.cwd !== expectedCwd || !Array.isArray(value.turns)
        || value.turns.length > 3 || typeof thread.status?.type !== "string") {
      throw failure("task_identity_unverified");
    }
    const alternateIds = [value.threadId, value.thread_id,
      ...(Array.isArray(value.threads) ? value.threads.map((item) => item?.id) : [])]
      .filter((id) => id !== undefined);
    if (alternateIds.some((id) => id !== targetId)
        || value.turns.some((turn) => !validId(turn?.id) || !Array.isArray(turn.items))) {
      throw failure("task_identity_unverified");
    }
    return value;
  }

  async function inspectPrivate() {
    if (closed) throw failure("bridge_closed");
    const capabilities = await nativeClient.capabilities();
    if (capabilities?.readTask !== true || capabilities?.sendProbe !== true) {
      throw failure("required_capability_unavailable");
    }
    return verifyReadback(await nativeClient.readTask(targetId));
  }

  function safeCode(error, fallback) {
    return ["bridge_closed", "task_identity_unverified", "required_capability_unavailable",
      "invalid_probe_input"].includes(error?.code) ? error.code : fallback;
  }

  return {
    async inspect() {
      try {
        const value = await inspectPrivate();
        return result({ sameTaskVerified: true, reasonCode: "preflight_verified",
          taskStatus: ["notLoaded", "idle", "running"].includes(value.thread.status.type)
            ? value.thread.status.type : "other" });
      } catch (error) {
        return result({ sameTaskVerified: false, reasonCode: safeCode(error, "preflight_failed"),
          nativeFailureCode: nativeFailureCode(error) });
      }
    },

    async probeOnce(input) {
      if (closed) return result({ reasonCode: "bridge_closed" });
      if (!enabled) return result({ reasonCode: "bridge_disabled" });
      if (attempted) return result({ reasonCode: "attempt_already_used" });
      // Consume the allowance synchronously, before any await or possible submission.
      attempted = true;
      try {
        exactData(input, ["marker"]);
        if (typeof input.marker !== "string" || !/^REENTRY_BRIDGE_[A-Z0-9_]{1,48}$/.test(input.marker)) {
          throw failure("invalid_probe_input");
        }
        marker = input.marker;
        const baseline = await inspectPrivate();
        if (closed) return result({ reasonCode: "bridge_closed" });
        if (!["notLoaded", "idle"].includes(baseline.thread.status.type)
            || baseline.turns.some((turn) => turn.status === "inProgress")) {
          return result({ sameTaskVerified: true, reasonCode: "target_not_idle" });
        }
        if (JSON.stringify(baseline.turns).includes(marker)) {
          return result({ sameTaskVerified: true, reasonCode: "marker_already_present" });
        }
        baselineIds = new Set(baseline.turns.map((turn) => turn.id));
        submittedPrompt = fixedPrompt(marker);
        result({ sameTaskVerified: true, observation: "not_observed" });
      } catch (error) {
        return result({ reasonCode: safeCode(error, "preflight_failed"),
          nativeFailureCode: nativeFailureCode(error) });
      }
      // This field deliberately does not claim a durable receipt or an actual Agent turn.
      result({ submission: "outcome_unknown", reasonCode: "submission_started" });
      try {
        const response = await nativeClient.sendProbe(targetId, submittedPrompt);
        if (response?.reportedAccepted !== true) return result({ reasonCode: "submission_unconfirmed" });
        return result({ submission: "reported_accepted", reasonCode: "submission_reported_accepted" });
      } catch (error) {
        return result({ reasonCode: "submission_outcome_unknown", nativeFailureCode: nativeFailureCode(error) });
      }
    },

    async observe() {
      if (closed) return result({ reasonCode: "bridge_closed" });
      if (state.submission === "not_sent") return result({ reasonCode: "nothing_submitted" });
      try {
        const value = verifyReadback(await nativeClient.readTask(targetId));
        const fresh = value.turns.filter((turn) => !baselineIds.has(turn.id));
        const priorQueueMarkerObserved = priorMarker !== null
          && fresh.some((turn) => turn.items.some((item) => inputText(item).includes(priorMarker)));
        const unexpectedToolUseObserved = fresh.some((turn) => turn.items.some((item) => TOOL_ITEMS.has(item.type)));
        const unexpectedItemTypeObserved = fresh.some((turn) => turn.items.some((item) =>
          !PASSIVE_ITEMS.has(item?.type) && !TOOL_ITEMS.has(item?.type)));
        const match = fresh.flatMap((turn) => turn.items
          .filter((item) => matchesPrompt(item, submittedPrompt))
          .map((item) => ({ turn, item })))[0];
        if (!match) return result({ observation: "not_observed", priorQueueMarkerObserved,
          unexpectedToolUseObserved, unexpectedItemTypeObserved, reasonCode: "correlated_input_not_observed" });
        const { turn, item } = match;
        const inputIndex = turn.items.indexOf(item);
        const afterInput = turn.items.slice(inputIndex + 1);
        const markerResponseObserved = afterInput.some((entry) => entry.type === "agentMessage"
          && typeof entry.text === "string" && entry.text.trim() === marker);
        const inputStartedObservedTurn = !turn.items.slice(0, inputIndex).some((entry) =>
          entry.type === "userMessage" || entry.type === "functionCallOutput"
          || entry.type === "agentMessage" || entry.type === "reasoning" || TOOL_ITEMS.has(entry.type));
        const observation = markerResponseObserved
          ? (inputStartedObservedTurn ? "correlated_turn_observed" : "response_in_joined_turn_observed")
          : "input_only_observed";
        return result({
          inputObserved: true,
          inputRole: item.type,
          observation,
          inputStartedObservedTurn,
          markerResponseObserved,
          turnCompleted: turn.status === "completed",
          priorQueueMarkerObserved,
          unexpectedToolUseObserved,
          unexpectedItemTypeObserved,
          reasonCode: markerResponseObserved ? observation : "marker_response_not_observed",
        });
      } catch (error) {
        return result({ sameTaskVerified: false, reasonCode: safeCode(error, "observation_failed"),
          nativeFailureCode: nativeFailureCode(error) });
      }
    },

    close() {
      closed = true;
      nativeClient.close();
    },
  };
}
