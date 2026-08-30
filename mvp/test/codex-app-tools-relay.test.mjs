import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { createCodexAppToolsRelay } from "../src/relay/codex-app-tools-relay.mjs";
import { CodexAppToolsRelayClient } from "../src/adapters/codex-app-tools-relay-client.mjs";

const TASK_ID = "01a00000-0000-7000-8000-000000000020";
const CANONICAL_URL = "http://127.0.0.1:4317/workflows/WF-001";
const TOKEN = "relay-test-token-with-sufficient-entropy";
const ENROLLMENT_PROMPT = [
  "A Receiver-owned human consent action approved one bounded WebMCP re-entry Grant.",
  "This is an enrollment receipt, not the future business event.",
].join("\n");

test("bounded Desktop relay fixes task and URL, enforces bearer auth, and exposes no generic tool call", async () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "webmcp-relay-test-"));
  const socketPath = path.join(temporaryDirectory, "relay.sock");
  const host = new FakeNativeClient();
  const relay = createCodexAppToolsRelay({
    socketPath,
    token: TOKEN,
    taskId: TASK_ID,
    canonicalUrl: CANONICAL_URL,
    nativeClient: host,
  });
  await relay.start();

  try {
    assert.equal(fs.statSync(socketPath).mode & 0o077, 0);
    const client = new CodexAppToolsRelayClient({
      socketPath,
      token: TOKEN,
      currentTaskId: TASK_ID,
      canonicalUrl: CANONICAL_URL,
    });
    await client.connect();
    await client.requireTools(["read_thread", "open_in_codex", "send_message_to_thread"]);

    const read = await client.callTool("read_thread", {
      threadId: TASK_ID,
      turnLimit: 1,
      includeOutputs: false,
    });
    assert.match(read.content[0].text, new RegExp(TASK_ID));

    await client.callTool("open_in_codex", {
      threadId: TASK_ID,
      target: { type: "browser", url: CANONICAL_URL },
    });
    await client.callTool("send_message_to_thread", {
      threadId: TASK_ID,
      prompt: ENROLLMENT_PROMPT,
    });

    assert.deepEqual(host.calls.map((call) => call.name), [
      "read_thread",
      "open_in_codex",
      "send_message_to_thread",
    ]);
    assert.equal(host.calls.every((call) => call.options.callingThreadId === TASK_ID), true);
    assert.equal(host.calls[1].argumentsValue.threadId, TASK_ID);
    assert.equal(host.calls[1].argumentsValue.target.url, new URL(CANONICAL_URL).href);
    assert.equal(host.calls[2].argumentsValue.threadId, TASK_ID);

    const wrongTokenClient = new CodexAppToolsRelayClient({
      socketPath,
      token: "wrong-token-with-sufficient-entropy",
      currentTaskId: TASK_ID,
      canonicalUrl: CANONICAL_URL,
    });
    await wrongTokenClient.connect();
    await assert.rejects(
      wrongTokenClient.callTool("read_thread", { threadId: TASK_ID }),
      /unauthorized/,
    );

    await assert.rejects(
      client.callTool("read_thread", { threadId: "caller-selected-task" }),
      /bound task/,
    );
    await assert.rejects(
      client.callTool("open_in_codex", {
        threadId: TASK_ID,
        target: { type: "browser", url: "https://example.com/" },
      }),
      /outside the bound canonical URL/,
    );

    const extraFieldResponse = await rawRelayRequest(socketPath, {
      id: 99,
      token: TOKEN,
      action: "read_task",
      threadId: "caller-selected-task",
    });
    assert.deepEqual(extraFieldResponse, { id: 99, ok: false, error: "unexpected_fields" });
  } finally {
    await relay.close();
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("relay validates a large native task response and returns only redacted identity proof", async () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "webmcp-relay-large-read-test-"));
  const socketPath = path.join(temporaryDirectory, "relay.sock");
  const host = new FakeNativeClient({
    readThreadValue: {
      schemaVersion: 1,
      thread: { id: TASK_ID },
      page: { cursor: null },
      turns: [{ summary: "x".repeat(70 * 1024) }],
    },
  });
  const relay = createCodexAppToolsRelay({
    socketPath,
    token: TOKEN,
    taskId: TASK_ID,
    canonicalUrl: CANONICAL_URL,
    nativeClient: host,
  });
  await relay.start();

  try {
    const client = new CodexAppToolsRelayClient({
      socketPath,
      token: TOKEN,
      currentTaskId: TASK_ID,
      canonicalUrl: CANONICAL_URL,
    });
    await client.connect();
    const read = await client.callTool("read_thread", { threadId: TASK_ID });
    const identity = JSON.parse(read.content[0].text);
    assert.deepEqual(identity, {
      thread: { id: TASK_ID },
      identity_verified: true,
      task_content_forwarded: false,
    });
    assert.equal(JSON.stringify(read).includes("task_summary"), false);
    assert.equal(Buffer.byteLength(JSON.stringify(read), "utf8") < 1024, true);
  } finally {
    await relay.close();
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("relay fails closed when native task identity is mismatched or malformed", async (t) => {
  await t.test("mismatched identity", async () => {
    await assertRejectedReadIdentity(
      { thread: { id: "01a00000-0000-7000-8000-000000000099" } },
      /task_identity_mismatch/,
    );
  });
  await t.test("malformed identity", async () => {
    await assertRejectedReadIdentity({ task: { status: "running" } }, /invalid_task_identity/);
  });
  await t.test("legacy identity alias without authoritative thread.id", async () => {
    await assertRejectedReadIdentity({ threadId: TASK_ID }, /invalid_task_identity/);
  });
  await t.test("conflicting mixed identities", async () => {
    await assertRejectedReadIdentity({
      schemaVersion: 1,
      thread: { id: TASK_ID },
      threadId: "01a00000-0000-7000-8000-000000000099",
      page: { cursor: null },
      turns: [],
    }, /task_identity_conflict/);
  });
  await t.test("expected identity hidden in an alternative candidate", async () => {
    await assertRejectedReadIdentity({
      schemaVersion: 1,
      thread: { id: "01a00000-0000-7000-8000-000000000099" },
      page: { cursor: null },
      turns: [],
      threads: [{ id: TASK_ID }],
    }, /task_identity_conflict/);
  });
  await t.test("multiple JSON text payloads", async () => {
    const value = JSON.stringify({
      schemaVersion: 1,
      thread: { id: TASK_ID },
      page: { cursor: null },
      turns: [],
    });
    await assertRejectedReadIdentity(undefined, /invalid_task_identity/, [
      { type: "inputText", text: value },
      { type: "inputText", text: value },
    ]);
  });
});

function rawRelayRequest(socketPath, request) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(socketPath);
    socket.setEncoding("utf8");
    let buffer = "";
    socket.on("data", (chunk) => {
      buffer += chunk;
      const newline = buffer.indexOf("\n");
      if (newline < 0) return;
      resolve(JSON.parse(buffer.slice(0, newline)));
      socket.end();
    });
    socket.once("error", reject);
    socket.once("connect", () => socket.write(`${JSON.stringify(request)}\n`));
  });
}

class FakeNativeClient {
  constructor({
    readThreadValue = { thread: { id: TASK_ID } },
    readThreadContentItems,
  } = {}) {
    this.calls = [];
    this.readThreadValue = readThreadValue;
    this.readThreadContentItems = readThreadContentItems;
  }

  async connect() {
    return this;
  }

  async requireTools(names) {
    assert.deepEqual(names, ["read_thread", "open_in_codex", "send_message_to_thread"]);
  }

  async callTool(name, argumentsValue, options) {
    this.calls.push({
      name,
      argumentsValue: structuredClone(argumentsValue),
      options: structuredClone(options),
    });
    if (name === "read_thread") {
      return {
        success: true,
        contentItems: this.readThreadContentItems ?? [{
          type: "inputText",
          text: JSON.stringify(this.readThreadValue),
        }],
      };
    }
    return { success: true, contentItems: [{ type: "inputText", text: "ok" }] };
  }

  async close() {}
}

async function assertRejectedReadIdentity(readThreadValue, expectedError, readThreadContentItems) {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "webmcp-relay-invalid-read-test-"));
  const socketPath = path.join(temporaryDirectory, "relay.sock");
  const relay = createCodexAppToolsRelay({
    socketPath,
    token: TOKEN,
    taskId: TASK_ID,
    canonicalUrl: CANONICAL_URL,
    nativeClient: new FakeNativeClient({ readThreadValue, readThreadContentItems }),
  });
  await relay.start();

  try {
    const client = new CodexAppToolsRelayClient({
      socketPath,
      token: TOKEN,
      currentTaskId: TASK_ID,
      canonicalUrl: CANONICAL_URL,
    });
    await client.connect();
    await assert.rejects(
      client.callTool("read_thread", { threadId: TASK_ID }),
      expectedError,
    );
  } finally {
    await relay.close();
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}
