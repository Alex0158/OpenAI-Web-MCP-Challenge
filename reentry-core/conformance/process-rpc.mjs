import { fork } from "node:child_process";

const DEFAULT_TIMEOUT_MS = 5_000;
const MAXIMUM_TIMEOUT_MS = 60_000;
const COMMAND_PATTERN = /^[a-z][a-zA-Z0-9]{0,63}$/;
const ERROR_CODE_PATTERN = /^[a-z][a-z0-9_]{0,95}$/;

export function serveProfileProcess(handlers) {
  if (typeof process.send !== "function") {
    throw profileError("profile_ipc_unavailable");
  }
  if (!handlers || typeof handlers !== "object" || Array.isArray(handlers)) {
    throw profileError("profile_handlers_invalid");
  }

  process.on("message", (message) => {
    void handleMessage(handlers, message);
  });
}

export function spawnProfileProcess(moduleUrl, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (!(moduleUrl instanceof URL) || moduleUrl.protocol !== "file:") {
    throw profileError("profile_module_url_invalid");
  }
  if (
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs < 100 ||
    timeoutMs > MAXIMUM_TIMEOUT_MS
  ) {
    throw profileError("profile_timeout_invalid");
  }

  const child = fork(moduleUrl, [], {
    execArgv: [],
    serialization: "json",
    stdio: ["ignore", "ignore", "pipe", "ipc"],
  });
  let nextId = 0;
  let exited = false;
  let exitResult;
  const pending = new Map();
  const exitPromise = new Promise((resolve) => {
    child.once("close", (code, signal) => {
      exited = true;
      exitResult = { code, signal };
      for (const entry of pending.values()) {
        clearTimeout(entry.timer);
        entry.reject(profileError("profile_process_exited"));
      }
      pending.clear();
      resolve(exitResult);
    });
  });

  child.stderr?.resume();
  child.on("error", () => {
    for (const entry of pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(profileError("profile_process_error"));
    }
    pending.clear();
  });
  child.on("message", (message) => {
    const entry = pending.get(message?.id);
    if (!entry) return;
    pending.delete(message.id);
    clearTimeout(entry.timer);
    if (message.ok) {
      entry.resolve(message.result);
      return;
    }
    const error = profileError(boundedCode(message.error?.code));
    if (Number.isInteger(message.error?.statusCode)) {
      error.statusCode = message.error.statusCode;
    }
    entry.reject(error);
  });

  return {
    request(command, payload = undefined) {
      if (typeof command !== "string" || !COMMAND_PATTERN.test(command)) {
        return Promise.reject(profileError("profile_command_invalid"));
      }
      if (exited || !child.connected) {
        return Promise.reject(profileError("profile_process_unavailable"));
      }
      const id = ++nextId;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(profileError("profile_command_timed_out"));
        }, timeoutMs);
        pending.set(id, { resolve, reject, timer });
        child.send({ id, command, payload }, (error) => {
          if (!error) return;
          const entry = pending.get(id);
          if (!entry) return;
          pending.delete(id);
          clearTimeout(entry.timer);
          entry.reject(profileError("profile_command_send_failed"));
        });
      });
    },

    async close() {
      if (exited) return exitResult;
      await this.request("stop");
      return exitPromise;
    },

    async terminate() {
      if (exited) return exitResult;
      if (!child.kill("SIGTERM")) throw profileError("profile_termination_failed");
      return exitPromise;
    },
  };
}

async function handleMessage(handlers, message) {
  const id = message?.id;
  const command = message?.command;
  if (
    !Number.isSafeInteger(id) ||
    typeof command !== "string" ||
    !COMMAND_PATTERN.test(command)
  ) {
    return;
  }

  const handler = Object.hasOwn(handlers, command) ? handlers[command] : undefined;
  if (typeof handler !== "function") {
    send({ id, ok: false, error: { code: "profile_command_unknown" } });
    return;
  }

  try {
    const result = await handler(message.payload);
    send({ id, ok: true, result }, command === "stop");
  } catch (error) {
    send({
      id,
      ok: false,
      error: {
        code: boundedCode(error?.code),
        statusCode: Number.isInteger(error?.statusCode) ? error.statusCode : undefined,
      },
    });
  }
}

function send(message, disconnect = false) {
  process.send(message, (error) => {
    if (error) process.exitCode = 1;
    if (disconnect && process.connected) process.disconnect();
  });
}

function boundedCode(value) {
  return typeof value === "string" && ERROR_CODE_PATTERN.test(value)
    ? value
    : "profile_command_failed";
}

function profileError(code) {
  return Object.assign(new Error(code), { code });
}
