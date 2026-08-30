import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import readline from "node:readline";

const MCP_PROTOCOL_VERSION = "2025-11-25";
const DEFAULT_REQUEST_TIMEOUT_MS = 90_000;
const BUNDLED_SERVER_RELATIVE_PATH = [
  "plugins",
  "openai-bundled",
  "plugins",
  "codex-app-tools",
  "server.mjs",
];

export class CodexAppToolsClient {
  constructor({
    currentTaskId,
    command,
    args,
    env = process.env,
    requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    spawnProcess = spawn,
  } = {}) {
    this.currentTaskId = requireText(currentTaskId, "currentTaskId");
    const launch = resolveLaunch({ command, args, env });
    this.command = launch.command;
    this.args = [...launch.args, "--interaction-client-id", this.currentTaskId];
    this.env = env;
    this.requestTimeoutMs = requestTimeoutMs;
    this.spawnProcess = spawnProcess;
    this.nextId = 1;
    this.pending = new Map();
    this.stderr = [];
    this.tools = null;
  }

  async connect() {
    if (this.child) return this;
    this.child = this.spawnProcess(this.command, this.args, {
      env: this.env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.lines = readline.createInterface({ input: this.child.stdout });
    this.lines.on("line", (line) => this.handleLine(line));
    this.child.stderr.on("data", (chunk) => {
      this.stderr.push(chunk.toString("utf8"));
      if (this.stderr.length > 30) this.stderr.shift();
    });
    this.child.once("error", (error) => this.rejectAll(error));
    this.child.once("exit", (code, signal) => {
      this.rejectAll(new Error(
        `Codex App Tools client exited before request completion: code=${code} signal=${signal}`,
      ));
    });

    await this.request("initialize", {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: {
        name: "webmcp_reentry_receiver",
        title: "WebMCP Re-entry Receiver",
        version: "0.1.0",
      },
    });
    this.notify("notifications/initialized", {});
    return this;
  }

  async listTools() {
    if (this.tools) return this.tools;
    const result = await this.request("tools/list", {});
    if (!Array.isArray(result?.tools)) {
      throw new Error("Codex App Tools returned no tool catalog");
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

  async callTool(name, argumentsValue = {}) {
    requireText(name, "tool name");
    const result = await this.request("tools/call", {
      name,
      arguments: argumentsValue,
    });
    if (!result || !Array.isArray(result.content)) {
      throw new Error(`Codex App Tool returned an invalid response: ${name}`);
    }
    if (result.isError) {
      const detail = result.content
        .filter((item) => item?.type === "text" && typeof item.text === "string")
        .map((item) => item.text)
        .join("\n");
      throw new Error(`Codex App Tool failed: ${name}${detail ? `: ${detail}` : ""}`);
    }
    return result;
  }

  request(method, params = {}) {
    if (!this.child?.stdin?.writable) {
      throw new Error("Codex App Tools client is not writable");
    }
    const id = this.nextId++;
    const promise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Codex App Tools request timed out: ${method}`));
      }, this.requestTimeoutMs);
      timeout.unref();
      this.pending.set(id, { resolve, reject, timeout, method });
    });
    this.write({ jsonrpc: "2.0", id, method, params });
    return promise;
  }

  notify(method, params = {}) {
    this.write({ jsonrpc: "2.0", method, params });
  }

  async close() {
    if (!this.child) return;
    const child = this.child;
    this.child = null;
    this.lines?.close();
    child.stdin.end();
    if (child.exitCode !== null) return;
    const exited = new Promise((resolve) => child.once("exit", resolve));
    const timeout = new Promise((resolve) => setTimeout(resolve, 1_500, "timeout"));
    if (await Promise.race([exited, timeout]) === "timeout" && child.exitCode === null) {
      child.kill("SIGTERM");
      await exited;
    }
  }

  handleLine(line) {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      return;
    }
    if (message.id === undefined || message.method) return;
    const pending = this.pending.get(message.id);
    if (!pending) return;
    this.pending.delete(message.id);
    clearTimeout(pending.timeout);
    if (message.error) {
      pending.reject(new Error(`${pending.method}: ${message.error.message}`));
    } else {
      pending.resolve(message.result);
    }
  }

  write(message) {
    this.child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  rejectAll(error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pending.clear();
  }
}

export function resolveBundledAppToolsServer(env = process.env) {
  const explicit = env.WEBMCP_P0_CODEX_APP_TOOLS_SERVER?.trim();
  if (explicit) return explicit;
  const nodePath = env.CODEX_MCP_NODE_PATH?.trim();
  if (!nodePath) {
    throw new Error(
      "CODEX_MCP_NODE_PATH is required to resolve the bundled Codex App Tools server",
    );
  }
  const resourcesPath = path.resolve(path.dirname(nodePath), "..", "..");
  const serverPath = path.join(resourcesPath, ...BUNDLED_SERVER_RELATIVE_PATH);
  if (!fs.existsSync(serverPath)) {
    throw new Error(`Bundled Codex App Tools server was not found: ${serverPath}`);
  }
  return serverPath;
}

function resolveLaunch({ command, args, env }) {
  if (command) {
    return { command, args: args ?? [] };
  }
  const nodePath = env.CODEX_MCP_NODE_PATH?.trim();
  if (!nodePath) throw new Error("CODEX_MCP_NODE_PATH is required for Desktop task mode");
  return { command: nodePath, args: [resolveBundledAppToolsServer(env)] };
}

function requireText(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value.trim();
}
