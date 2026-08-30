import fs from "node:fs";
import net from "node:net";
import { timingSafeEqual } from "node:crypto";
import { pathToFileURL } from "node:url";
import { CodexAppToolsNativeClient } from "../adapters/codex-app-tools-native-client.mjs";

const MAX_LINE_BYTES = 64 * 1024;
const MAX_PROMPT_LENGTH = 12_000;
const REQUIRED_TOOLS = ["read_thread", "open_in_codex", "send_message_to_thread"];
const ENROLLMENT_PREFIX = "A Receiver-owned human consent action approved one bounded WebMCP re-entry Grant.";
const EVENT_PREFIX = "The Receiver accepted one authenticated business event for this exact Desktop task.";

export function createCodexAppToolsRelay({
  socketPath,
  token,
  taskId,
  canonicalUrl,
  nativeClient = new CodexAppToolsNativeClient(),
} = {}) {
  const config = {
    socketPath: requireText(socketPath, "relay socket path"),
    token: requireSecret(token, "relay token"),
    taskId: requireText(taskId, "relay task ID"),
    canonicalUrl: requireCanonicalUrl(canonicalUrl),
  };
  if (!config.socketPath.startsWith("/")) throw new TypeError("relay socket path must be absolute");
  if (fs.existsSync(config.socketPath)) {
    throw new Error("relay socket path already exists; use a fresh private path");
  }

  const server = net.createServer((socket) => handleConnection(socket, config, nativeClient));
  return {
    config,
    server,
    async start() {
      await nativeClient.connect();
      await nativeClient.requireTools(REQUIRED_TOOLS);
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(config.socketPath, resolve);
      });
      fs.chmodSync(config.socketPath, 0o600);
      return this;
    },
    async close() {
      await new Promise((resolve) => server.close(resolve));
      await nativeClient.close();
    },
  };
}

function handleConnection(socket, config, nativeClient) {
  socket.setEncoding("utf8");
  let buffer = "";
  let handled = false;
  socket.on("data", async (chunk) => {
    if (handled) return;
    buffer += chunk;
    if (Buffer.byteLength(buffer, "utf8") > MAX_LINE_BYTES) {
      writeResponse(socket, null, false, null, "request_too_large");
      socket.end();
      return;
    }
    const newline = buffer.indexOf("\n");
    if (newline < 0) return;
    handled = true;
    const line = buffer.slice(0, newline);
    buffer = buffer.slice(newline + 1);
    let request;
    try {
      request = JSON.parse(line);
      const result = await dispatch(request, config, nativeClient);
      writeResponse(socket, request.id, true, result);
    } catch (error) {
      writeResponse(socket, request?.id ?? null, false, null, safeErrorCode(error));
    } finally {
      socket.end();
    }
  });
}

async function dispatch(request, config, nativeClient) {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new RelayError("invalid_request");
  }
  requireSafeId(request.id);
  if (!tokensMatch(request.token, config.token)) throw new RelayError("unauthorized");
  if (request.action === "read_task") {
    requireExactKeys(request, ["action", "id", "token"]);
    const result = await nativeClient.callTool("read_thread", {
      threadId: config.taskId,
      turnLimit: 1,
      includeOutputs: false,
    }, { callingThreadId: config.taskId });
    assertNativeReadThreadIdentity(result, config.taskId);
    return verifiedTaskIdentityResult(config.taskId);
  }
  if (request.action === "open_canonical") {
    requireExactKeys(request, ["action", "id", "token"]);
    const result = await nativeClient.callTool("open_in_codex", {
      threadId: config.taskId,
      target: { type: "browser", url: config.canonicalUrl },
    }, { callingThreadId: config.taskId });
    return normalizeToolResult(result);
  }
  if (request.action === "send_followup") {
    requireExactKeys(request, ["action", "followup_type", "id", "prompt", "token"]);
    validatePrompt(request.followup_type, request.prompt);
    const result = await nativeClient.callTool("send_message_to_thread", {
      threadId: config.taskId,
      prompt: request.prompt,
    }, { callingThreadId: config.taskId });
    return normalizeToolResult(result);
  }
  throw new RelayError("unsupported_action");
}

function normalizeToolResult(result) {
  return {
    success: true,
    content: result.contentItems.map((item) => {
      if (item.type === "inputText") return { type: "text", text: item.text };
      const value = item.type === "inputImage" ? item.imageUrl : item.audioUrl;
      return { type: item.type, value };
    }),
  };
}

function assertNativeReadThreadIdentity(result, expectedTaskId) {
  if (!result || result.success !== true || !Array.isArray(result.contentItems)) {
    throw new RelayError("invalid_task_identity");
  }
  if (
    result.contentItems.length !== 1
    || result.contentItems[0]?.type !== "inputText"
    || typeof result.contentItems[0].text !== "string"
  ) {
    throw new RelayError("invalid_task_identity");
  }

  let parsed;
  try {
    parsed = JSON.parse(result.contentItems[0].text);
  } catch {
    throw new RelayError("invalid_task_identity");
  }
  const authoritativeTaskId = parsed?.thread?.id;
  if (typeof authoritativeTaskId !== "string" || authoritativeTaskId.length === 0) {
    throw new RelayError("invalid_task_identity");
  }

  const alternativeCandidates = collectAlternativeTaskIdentityCandidates(parsed);
  if (alternativeCandidates.some((candidate) => candidate !== authoritativeTaskId)) {
    throw new RelayError("task_identity_conflict");
  }
  if (authoritativeTaskId !== expectedTaskId) {
    throw new RelayError("task_identity_mismatch");
  }
}

function collectAlternativeTaskIdentityCandidates(value) {
  const candidates = [];
  for (const key of ["threadId", "thread_id"]) {
    if (typeof value[key] === "string") candidates.push(value[key]);
  }
  if (Array.isArray(value.threads)) {
    for (const thread of value.threads) {
      if (thread && typeof thread === "object" && typeof thread.id === "string") {
        candidates.push(thread.id);
      }
    }
  }
  return candidates;
}

function verifiedTaskIdentityResult(taskId) {
  return {
    success: true,
    content: [{
      type: "text",
      text: JSON.stringify({
        thread: { id: taskId },
        identity_verified: true,
        task_content_forwarded: false,
      }),
    }],
  };
}

function validatePrompt(type, prompt) {
  if (type !== "enrollment" && type !== "event") throw new RelayError("invalid_followup_type");
  if (typeof prompt !== "string" || prompt.length === 0 || prompt.length > MAX_PROMPT_LENGTH) {
    throw new RelayError("invalid_prompt");
  }
  if (/[\u0000\r]/u.test(prompt)) throw new RelayError("invalid_prompt");
  const expectedPrefix = type === "enrollment" ? ENROLLMENT_PREFIX : EVENT_PREFIX;
  if (!prompt.startsWith(expectedPrefix)) throw new RelayError("invalid_prompt_contract");
}

function requireExactKeys(value, allowedKeys) {
  const allowed = new Set(allowedKeys);
  const keys = Object.keys(value);
  if (keys.length !== allowed.size || keys.some((key) => !allowed.has(key))) {
    throw new RelayError("unexpected_fields");
  }
}

function requireSafeId(value) {
  if ((typeof value !== "string" && typeof value !== "number") || String(value).length > 100) {
    throw new RelayError("invalid_request_id");
  }
}

function requireCanonicalUrl(value) {
  const normalized = requireText(value, "canonical URL");
  const parsed = new URL(normalized);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new TypeError("canonical URL protocol is unsupported");
  }
  return parsed.href;
}

function tokensMatch(actual, expected) {
  if (typeof actual !== "string") return false;
  const actualBuffer = Buffer.from(actual, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function writeResponse(socket, id, ok, result = null, error = null) {
  socket.write(`${JSON.stringify(ok ? { id, ok, result } : { id, ok, error })}\n`);
}

function safeErrorCode(error) {
  return error instanceof RelayError ? error.code : "relay_operation_failed";
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

class RelayError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

const invokedDirectly = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  const relay = createCodexAppToolsRelay({
    socketPath: process.env.WEBMCP_P0_DESKTOP_RELAY_SOCKET,
    token: process.env.WEBMCP_P0_DESKTOP_RELAY_TOKEN,
    taskId: process.env.CODEX_SESSION_ID,
    canonicalUrl: process.env.WEBMCP_P0_DESKTOP_RELAY_CANONICAL_URL,
  });
  await relay.start();
  process.stdout.write(`${JSON.stringify({
    status: "ready",
    service: "webmcp-p0-codex-app-tools-relay",
    task_binding_source: "CODEX_SESSION_ID",
    canonical_url: relay.config.canonicalUrl,
    socket_mode: "0600",
  })}\n`);
  const close = async () => {
    await relay.close();
    process.exit(0);
  };
  process.once("SIGINT", close);
  process.once("SIGTERM", close);
}
