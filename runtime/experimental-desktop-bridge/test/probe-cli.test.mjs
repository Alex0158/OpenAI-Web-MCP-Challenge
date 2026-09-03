import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const CLI = fileURLToPath(new URL("../scripts/probe-once.mjs", import.meta.url));
const CALLER = "private-cli-fixture-caller";
const TARGET = "private-cli-fixture-target";
const WORKSPACE = "/fixture/private-cli-workspace";
const MARKER = "REENTRY_BRIDGE_CLI_FIXTURE";
const INPUT = { targetId: TARGET, expectedCwd: WORKSPACE, marker: MARKER };
const CATALOG = { tools: [
  { name: "read_thread", namespace: "fixture_cli_app" },
  { name: "send_message_to_thread", namespace: "fixture_cli_app" },
] };

test("CLI rejects malformed, oversized and unsupported private stdin before connecting", async (t) => {
  const cases = [
    ["malformed JSON", "{"],
    ["oversized input", " ".repeat(4097)],
    ["array input", "[]"],
    ["unknown override field", JSON.stringify({ ...INPUT, prompt: "unapproved fixture body" })],
    ["invalid target", JSON.stringify({ ...INPUT, targetId: "invalid target" })],
  ];
  for (const [name, input] of cases) {
    await t.test(name, async (caseTest) => {
      const host = await fakeHost(caseTest);
      const result = await runCli(host, [], input);
      assert.equal(result.code, 1);
      assert.equal(result.signal, null);
      assert.deepEqual(result.records[0], { phase: "failure", reasonCode: "probe_failed", submission: "unreported" });
      assert.equal(host.connections, 0);
      assert.equal(host.requests.length, 0);
      assertShutdownAndRedaction(result, host);
    });
  }
});

test("invalid CLI modes fail before any native IO", async (t) => {
  for (const args of [["--unknown"], ["--send-once", "--inspect"]]) {
    await t.test(args.join(" "), async (caseTest) => {
      const host = await fakeHost(caseTest);
      const result = await runCli(host, args);
      assert.equal(result.code, 1);
      assert.equal(host.connections, 0);
      assert.equal(host.requests.length, 0);
      assert.equal(result.records[0].phase, "failure");
      assertShutdownAndRedaction(result, host);
    });
  }
});

test("default and explicit inspect modes verify the exact target without sending", async (t) => {
  for (const args of [[], ["--inspect"]]) {
    await t.test(args[0] ?? "default", async (caseTest) => {
      const host = await fakeHost(caseTest);
      const result = await runCli(host, args);
      assert.equal(result.code, 0);
      assert.equal(result.records[0].phase, "preflight");
      assert.equal(result.records[0].sameTaskVerified, true);
      assert.equal(result.records[0].submission, "not_sent");
      assert.equal(result.records[0].reasonCode, "preflight_verified");
      assert.equal(result.records[0].observation, "not_checked");
      assert.equal(host.connections, 1);
      assert.deepEqual(host.requests.map((request) => request.method), ["tools/list", "tools/call"]);
      assert.equal(host.sends.length, 0);
      assertExactCalls(host);
      assertShutdownAndRedaction(result, host);
    });
  }
});

test("inspect rejects a mismatched target or workspace with no mutation", async (t) => {
  for (const mismatch of ["target", "workspace"]) {
    await t.test(mismatch, async (caseTest) => {
      const host = await fakeHost(caseTest, { mismatch });
      const result = await runCli(host, ["--inspect"]);
      assert.equal(result.code, 1);
      assert.equal(result.records[0].sameTaskVerified, false);
      assert.equal(result.records[0].reasonCode, "task_identity_unverified");
      assert.equal(result.records[0].submission, "not_sent");
      assert.equal(host.sends.length, 0);
      assertShutdownAndRedaction(result, host);
    });
  }
});

test("preflight native close exits nonzero, reports only a fixed native code, and sends nothing", async (t) => {
  for (const args of [["--inspect"], ["--send-once"]]) {
    await t.test(args[0], async (caseTest) => {
      const host = await fakeHost(caseTest, { closeAt: "catalog" });
      const result = await runCli(host, args);
      assert.equal(result.code, 1);
      assert.equal(result.records[0].submission, "not_sent");
      assert.equal(result.records[0].reasonCode, "preflight_failed");
      assert.equal(result.records[0].nativeFailureCode, "native_connection_closed");
      assert.equal(host.connections, 1);
      assert.equal(host.requests.length, 1);
      assert.equal(host.sends.length, 0);
      assertShutdownAndRedaction(result, host);
    });
  }
});

test("send-once exits zero only after one accepted send and a correlated completed marker response", async (t) => {
  const host = await fakeHost(t);
  const result = await runCli(host, ["--send-once"]);
  assert.equal(result.code, 0);
  assert.equal(result.signal, null);
  assert.deepEqual(result.records.map((record) => record.phase), ["submission", "observation", "shutdown"]);
  const [submission, observation] = result.records;
  assert.equal(submission.submission, "reported_accepted");
  assert.equal(submission.observation, "not_observed", "native admission is not observed wake");
  assert.equal(observation.observation, "correlated_turn_observed");
  assert.equal(observation.inputObserved, true);
  assert.equal(observation.inputRole, "userMessage");
  assert.equal(observation.inputStartedObservedTurn, true);
  assert.equal(observation.markerResponseObserved, true);
  assert.equal(observation.turnCompleted, true);
  assert.equal(observation.unexpectedToolUseObserved, false);
  assert.equal(observation.unexpectedItemTypeObserved, false);
  assert.equal(host.sends.length, 1);
  assert.equal(host.connections, 1);
  assert.equal(host.requests.filter((request) => request.params.tool === "read_thread").length, 2);
  assertExactCalls(host);
  assertShutdownAndRedaction(result, host);
});

test("a completed joined-turn response cannot produce a successful CLI wake verdict", async (t) => {
  const host = await fakeHost(t, { joinedTurn: true });
  const result = await runCli(host, ["--send-once"]);
  assert.equal(result.code, 1);
  const observation = result.records.find((record) => record.phase === "observation");
  assert.equal(observation.observation, "response_in_joined_turn_observed");
  assert.equal(observation.markerResponseObserved, true);
  assert.equal(observation.inputStartedObservedTurn, false);
  assert.equal(host.sends.length, 1);
  assertShutdownAndRedaction(result, host);
});

test("a completed input without a marker response remains unsuccessful and is not resent", async (t) => {
  const host = await fakeHost(t, { omitMarkerResponse: true });
  const result = await runCli(host, ["--send-once"]);
  assert.equal(result.code, 1);
  const observation = result.records.find((record) => record.phase === "observation");
  assert.equal(observation.observation, "input_only_observed");
  assert.equal(observation.markerResponseObserved, false);
  assert.equal(observation.turnCompleted, true);
  assert.equal(host.sends.length, 1);
  assertShutdownAndRedaction(result, host);
});

test("lost send response exits unknown with no retry and closes the client", async (t) => {
  const host = await fakeHost(t, { closeAt: "send" });
  const result = await runCli(host, ["--send-once"]);
  assert.equal(result.code, 1);
  assert.equal(result.records[0].submission, "outcome_unknown");
  assert.equal(result.records[0].nativeFailureCode, "native_connection_closed");
  assert.equal(result.records.find((record) => record.phase === "observation").reasonCode, "observation_failed");
  assert.equal(host.sends.length, 1);
  assert.equal(host.connections, 1);
  assertShutdownAndRedaction(result, host);
});

function assertExactCalls(host) {
  for (const request of host.requests.filter((entry) => entry.method === "tools/call")) {
    assert.equal(request.params.threadId, CALLER);
    assert.equal(request.params.arguments.threadId, TARGET);
    assert.equal(request.params.namespace, "fixture_cli_app");
    assert.ok(["read_thread", "send_message_to_thread"].includes(request.params.tool));
    if (request.params.tool === "read_thread") {
      assert.deepEqual(request.params.arguments,
        { threadId: TARGET, turnLimit: 3, includeOutputs: false, maxOutputCharsPerItem: 1000 });
    } else {
      const prompt = request.params.arguments.prompt;
      assert.match(prompt, /not a Game business event or a new strategy/u);
      assert.match(prompt, /Do not continue earlier workflows/u);
      assert.ok(prompt.endsWith(`Reply with exactly ${MARKER} and stop.`));
      assert.equal(prompt.includes(TARGET), false);
      assert.equal(prompt.includes(CALLER), false);
    }
  }
}

function assertShutdownAndRedaction(result, host) {
  assert.equal(result.stderr, "");
  assert.equal(host.openConnections, 0, "the exited child leaves no fixture connection open");
  assert.equal(fs.lstatSync(host.pipePath).isSocket(), true, "shutdown does not remove the host endpoint");
  assert.deepEqual(result.records.at(-1), {
    phase: "shutdown", clientClosed: true, listenerCreated: false, retryAttempted: false,
  });
  assert.equal(result.records.filter((record) => record.phase === "shutdown").length, 1);
  for (const privateValue of [CALLER, TARGET, WORKSPACE, host.pipePath, "private-cli-baseline", "private-cli-fresh-turn"]) {
    assert.equal(result.stdout.includes(privateValue), false);
  }
  for (const record of result.records.filter((entry) => ["preflight", "submission", "observation"].includes(entry.phase))) {
    assert.equal(record.browser, "not_attempted");
    assert.equal(record.receiverAcknowledgement, "not_attempted");
  }
}

function runCli(host, args = [], input = JSON.stringify(INPUT)) {
  return new Promise((resolve, reject) => {
    // Deliberately do not inherit the real endpoint, caller, NODE_OPTIONS or other runtime state.
    const child = spawn(process.execPath, [CLI, ...args], {
      cwd: host.directory,
      env: { CODEX_APP_TOOLS_PIPE_PATH: host.pipePath, CODEX_THREAD_ID: CALLER },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let failed = false;
    const stop = (message) => {
      failed = true;
      child.kill("SIGKILL");
      reject(new Error(message));
    };
    const timeout = setTimeout(() => stop("Fixture CLI exceeded its five-second test deadline"), 5000);
    const collect = (channel, chunk) => {
      if (channel === "stdout") stdout += chunk.toString("utf8");
      else stderr += chunk.toString("utf8");
      if (Buffer.byteLength(stdout) + Buffer.byteLength(stderr) > 64 * 1024) {
        stop("Fixture CLI exceeded its output bound");
      }
    };
    child.stdout.on("data", (chunk) => collect("stdout", chunk));
    child.stderr.on("data", (chunk) => collect("stderr", chunk));
    child.stdin.on("error", (error) => {
      if (error.code !== "EPIPE") stop("Fixture CLI stdin failed");
    });
    child.once("error", () => { clearTimeout(timeout); failed = true; reject(new Error("Fixture CLI could not start")); });
    child.once("close", (code, signal) => {
      clearTimeout(timeout);
      if (failed) return;
      try {
        const records = stdout.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
        resolve({ code, signal, stdout, stderr, records });
      } catch {
        reject(new Error("Fixture CLI emitted non-JSON output"));
      }
    });
    child.stdin.end(input);
  });
}

function frame(value) {
  const body = Buffer.from(JSON.stringify(value), "utf8");
  const bytes = Buffer.alloc(body.length + 4);
  bytes.writeUInt32LE(body.length);
  body.copy(bytes, 4);
  return bytes;
}

async function fakeHost(t, options = {}) {
  const directory = fs.mkdtempSync("/tmp/reentry-cli-");
  const pipePath = path.join(directory, "native.sock");
  const sockets = new Set();
  const requests = [];
  const sends = [];
  let connections = 0;
  const baseline = { id: "private-cli-baseline", status: "completed", items: [] };
  function readback() {
    const value = { thread: { id: options.mismatch === "target" ? "wrong-fixture-target" : TARGET,
      cwd: options.mismatch === "workspace" ? "/wrong-fixture-workspace" : WORKSPACE,
      kind: "codex", hostId: "local", status: { type: "idle" } }, turns: [baseline] };
    if (sends.length > 0) {
      const items = [
        ...(options.joinedTurn ? [{ type: "agentMessage", text: "Earlier fixture activity." }] : []),
        { type: "userMessage", content: [{ type: "text", text: sends[0].arguments.prompt }] },
        ...(options.omitMarkerResponse ? [] : [{ type: "agentMessage", text: MARKER }]),
      ];
      value.turns.unshift({ id: "private-cli-fresh-turn", status: "completed", items });
    }
    return value;
  }
  const server = net.createServer((socket) => {
    connections += 1;
    sockets.add(socket);
    socket.on("error", () => {});
    socket.on("close", () => sockets.delete(socket));
    let buffer = Buffer.alloc(0);
    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      while (buffer.length >= 4 && buffer.length >= 4 + buffer.readUInt32LE(0)) {
        const length = buffer.readUInt32LE(0);
        const request = JSON.parse(buffer.subarray(4, length + 4).toString("utf8"));
        buffer = buffer.subarray(length + 4);
        requests.push(request);
        if (request.method === "tools/list") {
          if (options.closeAt === "catalog") socket.destroy();
          else socket.write(frame({ jsonrpc: "2.0", id: request.id, result: CATALOG }));
          continue;
        }
        assert.equal(request.method, "tools/call");
        assert.ok(["read_thread", "send_message_to_thread"].includes(request.params.tool));
        if (request.params.tool === "send_message_to_thread") {
          sends.push(request.params);
          if (options.closeAt === "send") { socket.destroy(); continue; }
        }
        const value = request.params.tool === "read_thread" ? readback() : { fixtureReportedAccepted: true };
        socket.write(frame({ jsonrpc: "2.0", id: request.id,
          result: { success: true, contentItems: [{ type: "inputText", text: JSON.stringify(value) }] } }));
      }
    });
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(pipePath, resolve);
  });
  fs.chmodSync(pipePath, 0o600);
  t.after(async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise((resolve) => server.close(resolve));
    fs.rmdirSync(directory);
  });
  return { directory, pipePath, requests, sends,
    get connections() { return connections; }, get openConnections() { return sockets.size; } };
}
