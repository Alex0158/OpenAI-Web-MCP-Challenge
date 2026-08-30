import fs from "node:fs";
import net from "node:net";

const MAX_RESPONSE_BYTES = 64 * 1024;
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const ALLOWED_TOOLS = new Set(["read_thread", "open_in_codex", "send_message_to_thread"]);
const ENROLLMENT_PREFIX = "A Receiver-owned human consent action approved one bounded WebMCP re-entry Grant.";
const EVENT_PREFIX = "The Receiver accepted one authenticated business event for this exact Desktop task.";

export class CodexAppToolsRelayClient {
  constructor({
    socketPath,
    token,
    currentTaskId,
    canonicalUrl,
    requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  } = {}) {
    this.socketPath = requireText(socketPath, "relay socket path");
    this.token = requireSecret(token, "relay token");
    this.currentTaskId = requireText(currentTaskId, "current task ID");
    this.canonicalUrl = new URL(requireText(canonicalUrl, "canonical URL")).href;
    this.requestTimeoutMs = requestTimeoutMs;
    this.nextId = 1;
  }

  async connect() {
    const stat = fs.statSync(this.socketPath);
    if (!stat.isSocket()) throw new Error("Configured Desktop relay path is not a Unix socket");
    if ((stat.mode & 0o077) !== 0) throw new Error("Desktop relay socket permissions are too broad");
    if (typeof process.getuid === "function" && stat.uid !== process.getuid()) {
      throw new Error("Desktop relay socket is owned by another user");
    }
    return this;
  }

  async requireTools(names) {
    const missing = names.filter((name) => !ALLOWED_TOOLS.has(name));
    if (missing.length > 0) {
      throw new Error(`Desktop relay does not permit tools: ${missing.join(", ")}`);
    }
  }

  async callTool(name, argumentsValue = {}) {
    if (!ALLOWED_TOOLS.has(name)) throw new Error(`Desktop relay does not permit tool: ${name}`);
    let request;
    if (name === "read_thread") {
      requireExactTask(argumentsValue.threadId, this.currentTaskId);
      request = { action: "read_task" };
    } else if (name === "open_in_codex") {
      requireExactTask(argumentsValue.threadId, this.currentTaskId);
      const requestedUrl = new URL(requireText(argumentsValue.target?.url, "requested Browser URL")).href;
      if (argumentsValue.target?.type !== "browser" || requestedUrl !== this.canonicalUrl) {
        throw new Error("Desktop relay Browser target is outside the bound canonical URL");
      }
      request = { action: "open_canonical" };
    } else {
      requireExactTask(argumentsValue.threadId, this.currentTaskId);
      const prompt = requireText(argumentsValue.prompt, "follow-up prompt");
      const followupType = prompt.startsWith(ENROLLMENT_PREFIX)
        ? "enrollment"
        : prompt.startsWith(EVENT_PREFIX)
          ? "event"
          : null;
      if (!followupType) throw new Error("Desktop relay follow-up does not match an allowed contract");
      request = { action: "send_followup", followup_type: followupType, prompt };
    }
    const result = await this.request(request);
    if (!result?.success || !Array.isArray(result.content)) {
      throw new Error(`Desktop relay returned an invalid result for ${name}`);
    }
    return { content: result.content, isError: false };
  }

  async request(payload) {
    const id = this.nextId++;
    const socket = net.createConnection(this.socketPath);
    socket.setEncoding("utf8");
    const response = new Promise((resolve, reject) => {
      let buffer = "";
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error("Desktop relay request timed out"));
      }, this.requestTimeoutMs);
      timeout.unref();
      const finish = (callback, value) => {
        clearTimeout(timeout);
        socket.removeAllListeners();
        socket.end();
        callback(value);
      };
      socket.on("data", (chunk) => {
        buffer += chunk;
        if (Buffer.byteLength(buffer, "utf8") > MAX_RESPONSE_BYTES) {
          finish(reject, new Error("Desktop relay response is too large"));
          return;
        }
        const newline = buffer.indexOf("\n");
        if (newline < 0) return;
        let message;
        try {
          message = JSON.parse(buffer.slice(0, newline));
        } catch {
          finish(reject, new Error("Desktop relay returned invalid JSON"));
          return;
        }
        if (message.id !== id || message.ok !== true) {
          finish(reject, new Error(`Desktop relay rejected request: ${message.error ?? "invalid_response"}`));
          return;
        }
        finish(resolve, message.result);
      });
      socket.once("error", (error) => finish(reject, error));
      socket.once("connect", () => {
        socket.write(`${JSON.stringify({ id, token: this.token, ...payload })}\n`);
      });
    });
    return response;
  }

  async close() {}
}

function requireExactTask(actual, expected) {
  if (actual !== expected) throw new Error("Desktop relay request does not match the bound task");
}

function requireText(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function requireSecret(value, label) {
  const normalized = requireText(value, label);
  if (normalized.length < 32) throw new TypeError(`${label} must contain at least 32 characters`);
  return normalized;
}
