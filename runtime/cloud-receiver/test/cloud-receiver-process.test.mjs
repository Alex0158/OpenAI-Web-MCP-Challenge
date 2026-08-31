import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import test from "node:test";

test("standalone shell starts, reports readiness, and closes SQLite on SIGTERM", async (t) => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "cloud-receiver-process-"));
  const databasePath = join(temporaryDirectory, "receiver.sqlite");
  const mainPath = resolve(import.meta.dirname, "../src/main.mjs");
  const compositionPath = resolve(import.meta.dirname, "fixtures/composition.mjs");
  let child;
  t.after(async () => {
    if (child && child.exitCode === null && child.signalCode === null) {
      child.kill("SIGKILL");
      await once(child, "exit");
    }
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  child = spawn(process.execPath, [mainPath], {
    env: {
      ...process.env,
      CLOUD_RECEIVER_COMPOSITION_MODULE: compositionPath,
      CLOUD_RECEIVER_DATABASE_PATH: databasePath,
      CLOUD_RECEIVER_HOST: "127.0.0.1",
      CLOUD_RECEIVER_PORT: "0",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  const started = await waitForLogEvent(child, () => stdout, "cloud_receiver_started");
  assert.equal(started.host, "127.0.0.1");
  assert.equal(started.profile, "stage1_loopback");
  assert.ok(Number.isInteger(started.port) && started.port > 0);

  const origin = `http://127.0.0.1:${started.port}`;
  const health = await fetch(`${origin}/healthz`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: "ok" });
  const readiness = await fetch(`${origin}/readyz`);
  assert.equal(readiness.status, 200);
  assert.deepEqual(await readiness.json(), { status: "ready" });

  const exit = once(child, "exit");
  child.kill("SIGTERM");
  const [code, signal] = await exit;
  assert.equal(code, 0);
  assert.equal(signal, null);
  assert.equal(stderr, "");
  assert.match(stdout, /"event":"cloud_receiver_stopped","signal":"SIGTERM"/);
  assert.ok((await stat(databasePath)).isFile());
});

test("standalone startup failure emits only a bounded code", async () => {
  const mainPath = resolve(import.meta.dirname, "../src/main.mjs");
  const privateValue = "private-value-must-not-appear";
  const child = spawn(process.execPath, [mainPath], {
    env: {
      ...process.env,
      CLOUD_RECEIVER_COMPOSITION_MODULE: "./relative-composition.mjs",
      CLOUD_RECEIVER_PRIVATE_TEST_VALUE: privateValue,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  const [code, signal] = await once(child, "exit");
  assert.equal(code, 1);
  assert.equal(signal, null);
  assert.equal(stdout, "");
  assert.deepEqual(JSON.parse(stderr), {
    event: "cloud_receiver_start_failed",
    code: "cloud_receiver_composition_invalid",
  });
  assert.equal(stderr.includes(privateValue), false);
});

async function waitForLogEvent(child, readOutput, expectedEvent) {
  const timeout = AbortSignal.timeout(5_000);
  while (!timeout.aborted) {
    for (const line of readOutput().split("\n")) {
      if (line.length === 0) continue;
      let value;
      try {
        value = JSON.parse(line);
      } catch {
        continue;
      }
      if (value.event === expectedEvent) return value;
    }
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`Cloud Receiver child exited before ${expectedEvent}`);
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 10));
  }
  throw new Error(`Timed out waiting for ${expectedEvent}`);
}
