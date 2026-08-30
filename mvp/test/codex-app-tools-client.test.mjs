import test from "node:test";
import assert from "node:assert/strict";
import { CodexAppToolsClient } from "../src/adapters/codex-app-tools-client.mjs";

const FAKE_MCP_SERVER = String.raw`
  const readline = require("node:readline");
  const lines = readline.createInterface({ input: process.stdin });
  function send(value) { process.stdout.write(JSON.stringify(value) + "\n"); }
  lines.on("line", (line) => {
    const message = JSON.parse(line);
    if (message.method === "notifications/initialized") return;
    if (message.method === "initialize") {
      send({ jsonrpc: "2.0", id: message.id, result: {
        protocolVersion: "2025-11-25",
        capabilities: { tools: {} },
        serverInfo: { name: "fake-codex-app-tools", version: "0.0.0" },
      }});
      return;
    }
    if (message.method === "tools/list") {
      send({ jsonrpc: "2.0", id: message.id, result: { tools: [
        { name: "read_thread", description: "read", inputSchema: { type: "object" } },
        { name: "send_message_to_thread", description: "send", inputSchema: { type: "object" } },
        { name: "fail_tool", description: "fail", inputSchema: { type: "object" } },
      ] }});
      return;
    }
    if (message.method === "tools/call") {
      const failed = message.params.name === "fail_tool";
      send({ jsonrpc: "2.0", id: message.id, result: {
        content: [{ type: "text", text: failed ? "controlled failure" : JSON.stringify(message.params) }],
        isError: failed,
      }});
    }
  });
`;

test("Codex App Tools client completes the MCP handshake and rejects tool-level errors", async () => {
  const client = new CodexAppToolsClient({
    currentTaskId: "01a00000-0000-7000-8000-000000000001",
    command: process.execPath,
    args: ["-e", FAKE_MCP_SERVER, "--"],
    requestTimeoutMs: 2_000,
  });
  await client.connect();
  try {
    await client.requireTools(["read_thread", "send_message_to_thread"]);
    const result = await client.callTool("read_thread", {
      threadId: "01a00000-0000-7000-8000-000000000001",
      turnLimit: 1,
    });
    assert.equal(result.isError, false);
    assert.match(result.content[0].text, /read_thread/);
    await assert.rejects(client.callTool("fail_tool"), /controlled failure/);
  } finally {
    await client.close();
  }
});

test("Codex App Tools client fails closed when a required tool is absent", async () => {
  const client = new CodexAppToolsClient({
    currentTaskId: "01a00000-0000-7000-8000-000000000002",
    command: process.execPath,
    args: ["-e", FAKE_MCP_SERVER, "--"],
    requestTimeoutMs: 2_000,
  });
  await client.connect();
  try {
    await assert.rejects(client.requireTools(["open_in_codex"]), /unavailable/);
  } finally {
    await client.close();
  }
});
