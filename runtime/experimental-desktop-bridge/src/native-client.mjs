import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { TextDecoder } from "node:util";

const MAX_PROMPT_BYTES = 16_384;
const MAX_PENDING = 8;
const TOOL_NAMES = ["read_thread", "send_message_to_thread"];

/**
 * Experimental, current-build native IPC. This client owns one connection only.
 * Native acceptance is not a notification receipt or evidence of an Agent turn.
 */
export function createNativeAppToolsClient({
  pipePath,
  callerId,
  timeoutMs = 5_000,
  maxFrameBytes = 1_048_576,
} = {}) {
  if (!validIdentifier(callerId)
    || typeof pipePath !== "string" || !path.isAbsolute(pipePath) || /[\u0000-\u001f\u007f]/u.test(pipePath)
    || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30_000
    || !Number.isSafeInteger(maxFrameBytes) || maxFrameBytes < 128 || maxFrameBytes > 8_388_608
    || typeof process.getuid !== "function") {
    throw nativeError("native_invalid_configuration");
  }

  const uid = process.getuid();
  let socket;
  let connecting;
  let connectionReject;
  let connectionTimer;
  let terminalError;
  let catalogPromise;
  let sendAttempted = false;
  let nextId = 1;
  let buffer = Buffer.alloc(0);
  const pending = new Map();

  function assertOpen() {
    if (terminalError) throw terminalError;
  }

  function fail(code) {
    terminalError ??= nativeError(code);
    clearTimeout(connectionTimer);
    connectionReject?.(terminalError);
    connectionReject = undefined;
    for (const request of pending.values()) {
      clearTimeout(request.timer);
      request.reject(terminalError);
    }
    pending.clear();
    buffer = Buffer.alloc(0);
    socket?.destroy();
    return terminalError;
  }

  function receive(chunk) {
    // Accumulate at most one bounded frame, even when several frames arrive together.
    let offset = 0;
    while (!terminalError && offset < chunk.length) {
      const needed = buffer.length < 4 ? 4 - buffer.length : 4 + buffer.readUInt32LE(0) - buffer.length;
      const take = Math.min(needed, chunk.length - offset);
      buffer = Buffer.concat([buffer, chunk.subarray(offset, offset + take)]);
      offset += take;
      if (buffer.length < 4) continue;
      const length = buffer.readUInt32LE(0);
      if (length === 0 || length > maxFrameBytes) {
        fail(length === 0 ? "native_invalid_response" : "native_frame_too_large");
        return;
      }
      if (buffer.length < length + 4) continue;
      let response;
      try {
        response = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(buffer.subarray(4)));
      } catch {
        fail("native_invalid_response");
        return;
      }
      buffer = Buffer.alloc(0);
      const requestId = typeof response?.id === "number" ? response.id
        : typeof response?.id === "string" && /^[1-9][0-9]*$/u.test(response.id) ? Number(response.id) : null;
      const request = pending.get(requestId);
      if (!record(response) || response.jsonrpc !== "2.0" || !Number.isSafeInteger(requestId)
        || !request || (Object.hasOwn(response, "result") === Object.hasOwn(response, "error"))) {
        fail("native_invalid_response");
        return;
      }
      if (Object.hasOwn(response, "error")) {
        fail("native_remote_error");
        return;
      }
      pending.delete(requestId);
      clearTimeout(request.timer);
      request.resolve(response.result);
    }
  }

  async function connect() {
    assertOpen();
    if (connecting) return connecting;
    let baseline;
    try {
      baseline = inspectEndpoint(pipePath, uid);
    } catch (error) {
      throw fail(error.code ?? "native_unsafe_endpoint");
    }
    connecting = new Promise((resolve, reject) => {
      connectionReject = reject;
      connectionTimer = setTimeout(() => fail("native_timeout"), timeoutMs);
      try {
        socket = net.createConnection(baseline.resolved);
      } catch {
        fail("native_connect_failed");
        return;
      }
      socket.on("error", () => fail("native_connection_failed"));
      socket.on("close", () => fail("native_connection_closed"));
      socket.on("data", receive);
      socket.once("connect", () => {
        try {
          assertOpen();
          if (JSON.stringify(inspectEndpoint(pipePath, uid)) !== JSON.stringify(baseline)) {
            throw nativeError("native_endpoint_changed");
          }
          clearTimeout(connectionTimer);
          connectionReject = undefined;
          resolve();
        } catch (error) {
          fail(error.code ?? "native_unsafe_endpoint");
        }
      });
    });
    return connecting;
  }

  async function request(method, params) {
    await connect();
    assertOpen();
    if (pending.size >= MAX_PENDING) throw fail("native_request_limit");
    const id = nextId++;
    const body = Buffer.from(JSON.stringify({ jsonrpc: "2.0", id, method, params }), "utf8");
    if (body.length > maxFrameBytes) throw fail("native_request_too_large");
    const frame = Buffer.allocUnsafe(body.length + 4);
    frame.writeUInt32LE(body.length);
    body.copy(frame, 4);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => fail("native_timeout"), timeoutMs);
      pending.set(id, { resolve, reject, timer });
      try {
        socket.write(frame);
      } catch {
        fail("native_connection_failed");
      }
    });
  }

  async function catalog() {
    assertOpen();
    catalogPromise ??= (async () => {
      const result = await request("tools/list", { threadStartKind: "default" });
      assertOpen();
      if (!record(result) || !Array.isArray(result.tools) || result.tools.length > 256) {
        throw fail("native_invalid_catalog");
      }
      const selected = new Map();
      for (const tool of result.tools) {
        if (!record(tool) || typeof tool.name !== "string") throw fail("native_invalid_catalog");
        if (!TOOL_NAMES.includes(tool.name)) continue;
        if (selected.has(tool.name)) throw fail("native_invalid_catalog");
        selected.set(tool.name, validIdentifier(tool.namespace) ? tool.namespace : null);
      }
      return selected;
    })();
    return catalogPromise;
  }

  async function call(name, argumentsValue) {
    const namespace = (await catalog()).get(name);
    if (!namespace) throw nativeError("native_tool_unavailable");
    assertOpen();
    const correlation = randomUUID();
    const result = await request("tools/call", {
      arguments: argumentsValue,
      // Installed wrapper uses synthetic fallback labels too. These are not real turn provenance.
      callId: `reentry-probe-call-${correlation}`,
      namespace,
      threadId: callerId,
      tool: name,
      turnId: `reentry-probe-turn-${correlation}`,
    });
    assertOpen();
    if (!record(result) || typeof result.success !== "boolean" || !Array.isArray(result.contentItems)
      || !result.contentItems.every(validContentItem)) {
      throw fail("native_invalid_response");
    }
    if (!result.success) throw fail("native_tool_failed");
    return result;
  }

  return Object.freeze({
    async capabilities() {
      const tools = await catalog();
      assertOpen();
      return { readTask: Boolean(tools.get("read_thread")), sendProbe: Boolean(tools.get("send_message_to_thread")) };
    },
    async readTask(targetId) {
      if (!validIdentifier(targetId)) throw nativeError("native_invalid_input");
      const result = await call("read_thread", {
        threadId: targetId, turnLimit: 3, includeOutputs: false, maxOutputCharsPerItem: 1_000,
      });
      try {
        if (result.contentItems.length !== 1 || result.contentItems[0].type !== "inputText") throw new Error();
        const payload = JSON.parse(result.contentItems[0].text);
        if (!record(payload)) throw new Error();
        return payload;
      } catch {
        throw fail("native_invalid_task_response");
      }
    },
    async sendProbe(targetId, prompt) {
      assertOpen();
      if (!validIdentifier(targetId) || typeof prompt !== "string" || prompt.trim().length === 0
        || Buffer.byteLength(prompt, "utf8") > MAX_PROMPT_BYTES || /[\u0000-\u0008\u000b-\u001f\u007f]/u.test(prompt)) {
        throw nativeError("native_invalid_input");
      }
      if (sendAttempted) throw nativeError("native_probe_already_attempted");
      sendAttempted = true;
      await call("send_message_to_thread", { threadId: targetId, prompt });
      return { reportedAccepted: true };
    },
    close() {
      fail("native_closed");
    },
  });
}

function inspectEndpoint(pipePath, uid) {
  try {
    const first = fs.lstatSync(pipePath);
    if (first.isSymbolicLink() || !first.isSocket() || first.uid !== uid || (first.mode & 0o7777) !== 0o600) {
      throw nativeError("native_unsafe_endpoint");
    }
    // Resolve trusted system symlinks such as macOS /tmp; the endpoint itself cannot be a link.
    const resolved = fs.realpathSync(pipePath);
    const endpoint = fs.lstatSync(resolved);
    if (!endpoint.isSocket() || endpoint.isSymbolicLink() || endpoint.uid !== uid
      || (endpoint.mode & 0o7777) !== 0o600 || endpoint.ino !== first.ino || endpoint.dev !== first.dev) {
      throw nativeError("native_endpoint_changed");
    }
    const parents = [];
    for (let directory = path.dirname(resolved);; directory = path.dirname(directory)) {
      const stat = fs.lstatSync(directory);
      const trustedOwner = stat.uid === 0 || stat.uid === uid;
      const sharedWritable = (stat.mode & 0o022) !== 0;
      if (!stat.isDirectory() || stat.isSymbolicLink() || !trustedOwner
        || (sharedWritable && (stat.mode & 0o1000) === 0)) {
        throw nativeError("native_unsafe_endpoint");
      }
      parents.push([directory, stat.dev, stat.ino, stat.uid, stat.mode]);
      if (directory === path.dirname(directory)) break;
    }
    return { resolved, endpoint: [endpoint.dev, endpoint.ino, endpoint.uid, endpoint.mode], parents };
  } catch (error) {
    if (error?.code?.startsWith("native_")) throw error;
    throw nativeError("native_endpoint_unavailable");
  }
}

function validIdentifier(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 256 && !/[\s\u0000-\u001f\u007f]/u.test(value);
}

function validContentItem(item) {
  if (!record(item)) return false;
  if (item.type === "inputText") return typeof item.text === "string";
  if (item.type === "inputImage") return typeof item.imageUrl === "string";
  if (item.type === "inputAudio") return typeof item.audioUrl === "string";
  return false;
}

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nativeError(code) {
  return Object.assign(new Error(code), { name: "NativeAppToolsError", code });
}
