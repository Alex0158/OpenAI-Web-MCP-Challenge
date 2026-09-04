import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createCodexAppToolsRelay } from "../../../mvp/src/relay/codex-app-tools-relay.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const launcher = path.resolve(directory, "../../../mvp/scripts/launch-codex-app-tools-relay");
const fixtures = path.join(directory, "fixtures");
const fakeRuntime = path.join(fixtures, "node");
const token = "fixture-only-no-live-authority-token";
const taskId = "fixture-source-task";

function launch(runtime) {
  // An explicit environment prevents inheriting any real App pipe or caller context.
  return spawnSync("/bin/sh", [launcher], {
    env: {
      // The positive case must select its explicit runtime, not find the fake via PATH.
      PATH: runtime === fakeRuntime ? "/usr/bin:/bin" : `${fixtures}:/usr/bin:/bin`,
      BASELINE_EXPECTED_RELAY: `${path.dirname(launcher)}/../src/relay/codex-app-tools-relay.mjs`,
      ...(runtime === undefined ? {} : { CODEX_MCP_NODE_PATH: runtime }),
    },
    encoding: "utf8",
    timeout: 3_000,
    maxBuffer: 4_096,
  });
}

test("original launcher refuses missing App runtime instead of using PATH Node", () => {
  const result = launch();
  assert.equal(result.error, undefined);
  assert.equal(result.status, 127);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /signed bundled CODEX_MCP_NODE_PATH is required/);
});

test("original launcher refuses absent or non-executable runtime", () => {
  const nonExecutable = fileURLToPath(import.meta.url);
  assert.equal(fs.statSync(nonExecutable).mode & 0o111, 0);
  for (const runtime of [path.join(fixtures, "missing-runtime"), nonExecutable]) {
    const result = launch(runtime);
    assert.equal(result.error, undefined);
    assert.equal(result.status, 127);
    assert.equal(result.stdout, "");
  }
});

test("original launcher forwards only its relay entrypoint to the selected fake runtime", () => {
  const result = launch(fakeRuntime);
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout, "fake_runtime_received_original_relay\n");
});

async function withFakeRelay(check) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "reentry-method-"));
  fs.chmodSync(temporary, 0o700);
  const socketPath = path.join(temporary, "fixture.sock");
  const calls = [];
  const relay = createCodexAppToolsRelay({
    socketPath, token, taskId, canonicalUrl: "https://example.invalid/fixture",
    nativeClient: {
      async connect() {},
      async requireTools() {},
      async close() {},
      async callTool(...args) {
        calls.push(args);
        throw new Error("A rejected fixture request must not invoke a native tool");
      },
    },
  });
  await relay.start();
  try {
    await check(socketPath, calls);
  } finally {
    await relay.close();
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

function request(socketPath, value) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(socketPath);
    let buffer = "";
    let settled = false;
    const finish = (error, response) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      if (error) reject(error);
      else resolve(response);
    };
    const timer = setTimeout(() => finish(new Error("Fixture request timeout")), 2_000);
    socket.setEncoding("utf8");
    socket.once("error", (error) => finish(error));
    socket.once("close", () => finish(new Error("Fixture connection closed before response")));
    socket.once("connect", () => socket.write(`${JSON.stringify(value)}\n`));
    socket.on("data", (chunk) => {
      buffer += chunk;
      if (Buffer.byteLength(buffer, "utf8") > 4_096) {
        finish(new Error("Fixture response too large"));
        return;
      }
      const end = buffer.indexOf("\n");
      if (end < 0) return;
      try { finish(null, JSON.parse(buffer.slice(0, end))); } catch (error) { finish(error); }
    });
  });
}

test("fixture request rejects a premature close instead of hanging", { timeout: 3_000 }, async (t) => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "reentry-method-close-"));
  const socketPath = path.join(temporary, "fixture.sock");
  const server = net.createServer((socket) => socket.once("data", () => socket.end()));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(temporary, { recursive: true, force: true });
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(socketPath, resolve);
  });
  await assert.rejects(request(socketPath, { id: "fixture" }), /Fixture connection closed/);
});

test("original relay rejects an inert marker rather than treating it as an approved event", async () => {
  await withFakeRelay(async (socketPath, calls) => {
    const response = await request(socketPath, {
      id: 1, token, action: "send_followup", followup_type: "event",
      prompt: "Reply only with REENTRY_BRIDGE_FIXTURE_MARKER. Do not call tools.",
    });
    assert.deepEqual(response, { id: 1, ok: false, error: "invalid_prompt_contract" });
    assert.equal(calls.length, 0);
  });
});

test("original relay rejects destination overrides before any native tool call", async () => {
  await withFakeRelay(async (socketPath, calls) => {
    const response = await request(socketPath, {
      id: 2, token, action: "read_task", threadId: "fixture-other-task",
    });
    assert.deepEqual(response, { id: 2, ok: false, error: "unexpected_fields" });
    assert.equal(calls.length, 0);
  });
});
