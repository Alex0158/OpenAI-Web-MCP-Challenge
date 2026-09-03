import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const nodePath = process.execPath;
const serverPath = new URL("./server.mjs", import.meta.url).pathname;
const tempDir = await mkdtemp(join(tmpdir(), "sleepless-kingdom-cp02-"));
const dataFile = join(tempDir, "probe.sqlite");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForHealth(baseUrl, child) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return response.json();
    } catch {
      // The worker may still be starting.
    }
    if (child.exitCode !== null) throw new Error(`Probe worker exited with ${child.exitCode}`);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Timed out waiting for probe health.");
}

async function startWorker() {
  const child = spawn(nodePath, [serverPath], {
    env: { ...process.env, CP02_PORT: "0", CP02_DATA_FILE: dataFile },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const output = [];
  child.stdout.on("data", (chunk) => output.push(chunk.toString()));
  child.stderr.on("data", (chunk) => output.push(chunk.toString()));
  let port;
  for (let attempt = 0; attempt < 50 && !port; attempt += 1) {
    const line = output.join("").split("\n").find((entry) => entry.startsWith("CP02_READY "));
    if (line) port = JSON.parse(line.slice("CP02_READY ".length)).port;
    if (!port) await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert(port, "Worker did not announce a port.");
  const baseUrl = `http://127.0.0.1:${port}`;
  const health = await waitForHealth(baseUrl, child);
  return { child, baseUrl, health, output };
}

async function stopWorker(worker) {
  if (worker.child.exitCode !== null) return;
  await fetch(`${worker.baseUrl}/shutdown`, { method: "POST" });
  await new Promise((resolve, reject) => {
    worker.child.once("exit", (code, signal) => code === 0 ? resolve() : reject(new Error(`Worker stop failed: ${code}/${signal}`)));
  });
}

async function wsProbe(baseUrl) {
  const socket = new WebSocket(`${baseUrl.replace("http", "ws")}/realtime`);
  const messages = [];
  const firstSnapshot = new Promise((resolve, reject) => {
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      messages.push(message);
      if (message.type === "snapshot") resolve(message);
    });
    socket.addEventListener("error", reject);
  });
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  const initial = await firstSnapshot;
  assert(initial.type === "snapshot", "Realtime connection did not produce a snapshot.");
  const command = {
    command_id: "cp02-node-command-001",
    command_type: "probe_node_command",
    contract_version: "SK-MVP-0.1",
    idempotency_key: "cp02-node-command-001",
    typed_arguments: { source: "node-client" },
  };
  const result = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out waiting for typed command result.")), 2000);
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      messages.push(message);
      if (message.type === "command_result") {
        clearTimeout(timer);
        resolve(message);
      }
    });
  });
  socket.send(JSON.stringify(command));
  const commandResult = await result;
  assert(commandResult.ok === true && commandResult.duplicate === false, "Typed realtime command did not create its event.");
  assert(commandResult.snapshot?.type === "snapshot", "Typed command did not return a snapshot.");
  socket.close();
  return { initial, commandResult, messageCount: messages.length };
}

let first;
let second;
try {
  first = await startWorker();
  assert(first.health.ok === true && first.health.node === process.version, "Health did not report the Node 24 worker runtime.");
  const realtime = await wsProbe(first.baseUrl);
  const duplicate = await fetch(`${first.baseUrl}/command`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      command_id: "cp02-node-command-duplicate",
      command_type: "probe_duplicate",
      idempotency_key: "cp02-node-command-001",
      typed_arguments: { source: "duplicate" },
    }),
  }).then((response) => response.json());
  assert(duplicate.ok === true && duplicate.duplicate === true, "Duplicate idempotency key was not deduplicated.");
  const beforeRestart = await fetch(`${first.baseUrl}/probe/read`).then((response) => response.json());
  assert(beforeRestart.journal_mode === "wal", "SQLite WAL mode was not active.");
  assert(beforeRestart.event_count === 1, "Expected exactly one persisted probe event before restart.");
  await stopWorker(first);

  second = await startWorker();
  const afterRestart = await fetch(`${second.baseUrl}/probe/read`).then((response) => response.json());
  assert(afterRestart.journal_mode === "wal", "SQLite WAL mode was not retained after restart.");
  assert(afterRestart.event_count === 1, "Persisted probe event did not survive restart.");
  await stopWorker(second);
  second = null;

  const result = {
    status: "pass",
    node: process.version,
    worker_start_health: first.health,
    realtime,
    duplicate_idempotency: duplicate,
    sqlite_before_restart: beforeRestart,
    sqlite_after_restart: afterRestart,
    data_file: dataFile,
    output_file: null,
  };
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  if (first) await stopWorker(first).catch(() => first.child.kill("SIGTERM"));
  if (second) await stopWorker(second).catch(() => second.child.kill("SIGTERM"));
  console.error(JSON.stringify({ status: "fail", message: error.message, data_file: dataFile }, null, 2));
  process.exitCode = 1;
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
