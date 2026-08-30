import net from "node:net";
import { randomUUID } from "node:crypto";

const MAX_FRAME_BYTES = 8 * 1024 * 1024;
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

export class CodexAppToolsNativeClient {
  constructor({
    pipePath = process.env.CODEX_APP_TOOLS_PIPE_PATH,
    requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  } = {}) {
    this.pipePath = requireText(pipePath, "CODEX_APP_TOOLS_PIPE_PATH");
    this.requestTimeoutMs = requestTimeoutMs;
    this.nextId = 1;
    this.pending = new Map();
    this.pendingData = Buffer.alloc(0);
    this.tools = null;
  }

  async connect() {
    if (this.socket && !this.socket.destroyed) return this;
    this.socket = await new Promise((resolve, reject) => {
      const socket = net.createConnection(this.pipePath);
      const fail = (error) => {
        socket.destroy();
        reject(error);
      };
      socket.once("error", fail);
      socket.once("connect", () => {
        socket.off("error", fail);
        resolve(socket);
      });
    });
    this.socket.on("data", (chunk) => this.handleData(chunk));
    this.socket.on("error", (error) => this.rejectAll(error));
    this.socket.on("close", () => this.rejectAll(new Error("Codex App Tools pipe closed")));
    return this;
  }

  async listTools({ threadStartKind = "default" } = {}) {
    if (this.tools) return this.tools;
    const result = await this.request("tools/list", { threadStartKind });
    if (!Array.isArray(result?.tools)) {
      throw new Error("Codex App Tools host returned no tool catalog");
    }
    this.tools = result.tools;
    return this.tools;
  }

  async requireTools(names) {
    const available = new Set((await this.listTools()).map((tool) => tool.name));
    const missing = names.filter((name) => !available.has(name));
    if (missing.length > 0) {
      throw new Error(`Required Codex App Tools are unavailable: ${missing.join(", ")}`);
    }
  }

  async callTool(name, argumentsValue, { callingThreadId }) {
    const tools = await this.listTools();
    const tool = tools.find((candidate) => candidate.name === name);
    if (!tool || typeof tool.namespace !== "string") {
      throw new Error(`Codex App Tool is unavailable: ${name}`);
    }
    const requestId = randomUUID();
    const result = await this.request("tools/call", {
      arguments: argumentsValue,
      callId: `webmcp-relay-call-${requestId}`,
      namespace: tool.namespace,
      threadId: requireText(callingThreadId, "callingThreadId"),
      tool: name,
      turnId: `webmcp-relay-turn-${requestId}`,
    });
    if (!result || typeof result.success !== "boolean" || !Array.isArray(result.contentItems)) {
      throw new Error(`Codex App Tool returned an invalid response: ${name}`);
    }
    if (!result.success) {
      const detail = result.contentItems
        .filter((item) => item?.type === "inputText" && typeof item.text === "string")
        .map((item) => item.text)
        .join("\n");
      throw new Error(`Codex App Tool failed: ${name}${detail ? `: ${detail}` : ""}`);
    }
    return result;
  }

  request(method, params) {
    if (!this.socket || this.socket.destroyed) {
      throw new Error("Codex App Tools native client is not connected");
    }
    const id = this.nextId++;
    const payload = Buffer.from(JSON.stringify({ jsonrpc: "2.0", id, method, params }), "utf8");
    if (payload.length > MAX_FRAME_BYTES) throw new Error("Codex App Tools request is too large");
    const frame = Buffer.allocUnsafe(4 + payload.length);
    frame.writeUInt32LE(payload.length, 0);
    payload.copy(frame, 4);
    const promise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Codex App Tools request timed out: ${method}`));
      }, this.requestTimeoutMs);
      timeout.unref();
      this.pending.set(id, { resolve, reject, timeout, method });
    });
    this.socket.write(frame);
    return promise;
  }

  handleData(chunk) {
    this.pendingData = Buffer.concat([this.pendingData, chunk]);
    while (this.pendingData.length >= 4) {
      const frameLength = this.pendingData.readUInt32LE(0);
      if (frameLength > MAX_FRAME_BYTES) {
        this.socket.destroy(new Error("Codex App Tools response is too large"));
        return;
      }
      if (this.pendingData.length < frameLength + 4) return;
      const payload = this.pendingData.subarray(4, frameLength + 4);
      this.pendingData = this.pendingData.subarray(frameLength + 4);
      let message;
      try {
        message = JSON.parse(payload.toString("utf8"));
      } catch {
        this.socket.destroy(new Error("Codex App Tools returned invalid JSON"));
        return;
      }
      const pending = this.pending.get(Number(message.id));
      if (!pending) continue;
      this.pending.delete(Number(message.id));
      clearTimeout(pending.timeout);
      if (message.error) {
        pending.reject(new Error(`${pending.method}: ${message.error.message}`));
      } else {
        pending.resolve(message.result);
      }
    }
  }

  async close() {
    const socket = this.socket;
    this.socket = null;
    if (!socket || socket.destroyed) return;
    await new Promise((resolve) => {
      socket.once("close", resolve);
      socket.end();
    });
  }

  rejectAll(error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pending.clear();
  }
}

function requireText(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value.trim();
}
