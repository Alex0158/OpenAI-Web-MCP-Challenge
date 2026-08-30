import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fork, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRuntime } from "../src/server.mjs";

const TEST_ROOT = path.dirname(fileURLToPath(import.meta.url));
const CHILD_PATH = path.join(TEST_ROOT, "fixtures", "h2-process-child.mjs");
const WORKER_PATH = path.join(TEST_ROOT, "..", "scripts", "h2-outbox-once.mjs");
const P0_TRACE_PATH = path.join(TEST_ROOT, "..", "evidence", "latest-trace.jsonl");
const NOW = "2026-08-30T12:00:00.000Z";
const LATER = "2026-08-30T12:00:31.000Z";
const ORIGIN = "http://127.0.0.1:4322";
const DELIVERY_SECRET = "h2-process-delivery-ticket-secret-at-least-32-bytes";
const EFFECT_SECRET = "h2-process-effect-receipt-secret-at-least-32-bytes";
const SEALING_KEY = Buffer.alloc(32, 0x53).toString("base64url");
const KEY_ID = "h2-process-key-1";
const CHILD_TIMEOUT_MS = 5_000;

function paths() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "webmcp-h2-process-"));
  return {
    root,
    receiver: path.join(root, "receiver.sqlite"),
    destination: path.join(root, "destination.sqlite"),
    trace: path.join(root, "trace.jsonl"),
  };
}

function runtime(targets, now = NOW) {
  return createRuntime({
    databasePath: targets.receiver,
    durableDestinationPath: targets.destination,
    tracePath: targets.trace,
    origin: ORIGIN,
    clock: () => new Date(now),
    deliveryMode: "heartbeat",
    deliveryTicketSecret: DELIVERY_SECRET,
    effectReceiptSecret: EFFECT_SECRET,
    durableEnrollmentEnabled: true,
    receiptSealingKey: SEALING_KEY,
    receiptKeyId: KEY_ID,
    allowH2TestPaths: true,
  });
}

async function createPending(targets, correlationId) {
  const instance = runtime(targets);
  const manifest = instance.grants.issueManifest(correlationId);
  const capture = await instance.grants.captureCurrentContext(correlationId);
  const challenge = instance.grants.beginEnrollment({
    manifest,
    capture_handle: capture.capture_handle,
  }, correlationId);
  close(instance);
  return challenge;
}

function close(instance) {
  instance.receiptDestinationDatabase?.close();
  instance.database.close();
}

function childEnvironment(targets, overrides = {}) {
  return {
    ...process.env,
    H2_RECEIVER_DATABASE: targets.receiver,
    H2_DESTINATION_DATABASE: targets.destination,
    H2_TRACE_PATH: targets.trace,
    H2_ORIGIN: ORIGIN,
    H2_CHILD_NOW: NOW,
    H2_DELIVERY_SECRET: DELIVERY_SECRET,
    H2_EFFECT_SECRET: EFFECT_SECRET,
    H2_SEALING_KEY: SEALING_KEY,
    H2_KEY_ID: KEY_ID,
    ...overrides,
  };
}

function forkChild(targets, overrides) {
  const child = fork(CHILD_PATH, [], {
    env: childEnvironment(targets, overrides),
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });
  child.h2MessageQueue = [];
  child.h2MessageWaiters = [];
  child.on("message", (message) => {
    const waiterIndex = child.h2MessageWaiters.findIndex((waiter) => waiter.type === message?.type);
    if (waiterIndex === -1) child.h2MessageQueue.push(message);
    else child.h2MessageWaiters.splice(waiterIndex, 1)[0].resolve(message);
  });
  return child;
}

function waitForMessage(child, type) {
  const queuedIndex = child.h2MessageQueue.findIndex((message) => message?.type === type);
  if (queuedIndex !== -1) {
    return Promise.resolve(child.h2MessageQueue.splice(queuedIndex, 1)[0]);
  }
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
      reject(new Error(`Timed out waiting for child ${type}`));
    }, CHILD_TIMEOUT_MS);
    const onExit = (code, signal) => {
      cleanup();
      reject(new Error(`Child exited before ${type}: code=${code} signal=${signal}`));
    };
    const cleanup = () => {
      clearTimeout(timeout);
      child.off("exit", onExit);
      const index = child.h2MessageWaiters.indexOf(waiter);
      if (index !== -1) child.h2MessageWaiters.splice(index, 1);
    };
    const waiter = {
      type,
      resolve(message) {
        cleanup();
        resolve(message);
      },
    };
    child.h2MessageWaiters.push(waiter);
    child.on("exit", onExit);
  });
}

function waitForExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve({ code: child.exitCode, signal: child.signalCode });
  }
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Timed out waiting for child exit"));
    }, CHILD_TIMEOUT_MS);
    child.once("exit", (code, signal) => {
      clearTimeout(timeout);
      resolve({ code, signal });
    });
  });
}

async function killAtBarrier(child, label) {
  const barrier = await waitForMessage(child, "barrier");
  assert.equal(barrier.label, label);
  child.kill("SIGKILL");
  assert.deepEqual(await waitForExit(child), { code: null, signal: "SIGKILL" });
}

test("SIGKILL after all enrollment writes but before transaction commit rolls back every write", async () => {
  const targets = paths();
  try {
    const correlationId = "corr_h2_sigkill_precommit";
    const challenge = await createPending(targets, correlationId);
    const child = forkChild(targets, {
      H2_CHILD_ACTION: "approve",
      H2_CHILD_FAULT_LABEL: "before_enrollment_transaction_commit",
      H2_CHALLENGE_ID: challenge.challenge_id,
      H2_CORRELATION_ID: correlationId,
    });
    await killAtBarrier(child, "before_enrollment_transaction_commit");

    const reopened = runtime(targets);
    assert.equal(reopened.database.prepare(`
      SELECT status FROM binding_challenges WHERE challenge_id = ?
    `).get(challenge.challenge_id).status, "PENDING");
    assert.equal(reopened.database.prepare("SELECT count(*) AS count FROM grants").get().count, 0);
    assert.equal(reopened.database.prepare("SELECT count(*) AS count FROM heartbeat_inboxes").get().count, 0);
    assert.equal(reopened.database.prepare("SELECT count(*) AS count FROM heartbeat_receipt_outbox").get().count, 0);
    close(reopened);
  } finally {
    fs.rmSync(targets.root, { recursive: true, force: true });
  }
});

test("SIGKILL after approval commit preserves exactly one recoverable enrollment", async () => {
  const targets = paths();
  try {
    const correlationId = "corr_h2_sigkill_postcommit";
    const challenge = await createPending(targets, correlationId);
    const child = forkChild(targets, {
      H2_CHILD_ACTION: "approve",
      H2_CHILD_FAULT_LABEL: "after_enrollment_commit_before_response",
      H2_CHALLENGE_ID: challenge.challenge_id,
      H2_CORRELATION_ID: correlationId,
    });
    await killAtBarrier(child, "after_enrollment_commit_before_response");

    const reopened = runtime(targets);
    const recovered = reopened.durableEnrollment.approveChallenge(
      challenge.challenge_id,
      correlationId,
      { humanAction: true },
    );
    assert.equal(recovered.duplicate, true);
    assert.equal(reopened.database.prepare("SELECT count(*) AS count FROM grants").get().count, 1);
    assert.equal(reopened.database.prepare("SELECT count(*) AS count FROM heartbeat_receipt_outbox").get().count, 1);
    close(reopened);
  } finally {
    fs.rmSync(targets.root, { recursive: true, force: true });
  }
});

test("SIGKILL after destination commit is recovered by one idempotent redelivery", async () => {
  const targets = paths();
  try {
    const correlationId = "corr_h2_sigkill_destination";
    const challenge = await createPending(targets, correlationId);
    const setup = runtime(targets);
    setup.durableEnrollment.approveChallenge(challenge.challenge_id, correlationId, { humanAction: true });
    close(setup);

    const child = forkChild(targets, {
      H2_CHILD_ACTION: "dispatch",
      H2_CHILD_FAULT_LABEL: "after_destination_commit_before_ack",
    });
    await killAtBarrier(child, "after_destination_commit_before_ack");

    const recovered = runtime(targets, LATER);
    const result = await recovered.durableEnrollment.dispatchNext();
    assert.equal(result.destination_duplicate, true);
    assert.equal(recovered.receiptDestinationDatabase.prepare(`
      SELECT count(*) AS count FROM durable_context_receipts
    `).get().count, 1);
    assert.equal(recovered.database.prepare(`
      SELECT status FROM heartbeat_receipt_outbox
    `).get().status, "DELIVERED");
    close(recovered);
  } finally {
    fs.rmSync(targets.root, { recursive: true, force: true });
  }
});

test("SIGKILL after Receiver delivery commit preserves DELIVERED and causes no redispatch", async () => {
  const targets = paths();
  try {
    const correlationId = "corr_h2_sigkill_receiver_commit";
    const challenge = await createPending(targets, correlationId);
    const setup = runtime(targets);
    setup.durableEnrollment.approveChallenge(challenge.challenge_id, correlationId, { humanAction: true });
    close(setup);

    const child = forkChild(targets, {
      H2_CHILD_ACTION: "dispatch",
      H2_CHILD_FAULT_LABEL: "after_receiver_delivery_commit_before_response",
    });
    await killAtBarrier(child, "after_receiver_delivery_commit_before_response");

    const reopened = runtime(targets);
    assert.equal(reopened.database.prepare(`
      SELECT status FROM heartbeat_receipt_outbox
    `).get().status, "DELIVERED");
    assert.equal(await reopened.durableEnrollment.dispatchNext(), null);
    assert.equal(reopened.receiptDestinationDatabase.prepare(`
      SELECT count(*) AS count FROM durable_context_receipts
    `).get().count, 1);
    close(reopened);
  } finally {
    fs.rmSync(targets.root, { recursive: true, force: true });
  }
});

test("two independent approval processes converge on one enrollment and one retry result", async () => {
  const targets = paths();
  try {
    const correlationId = "corr_h2_process_concurrency";
    const challenge = await createPending(targets, correlationId);
    const overrides = {
      H2_CHILD_ACTION: "approve",
      H2_CHALLENGE_ID: challenge.challenge_id,
      H2_CORRELATION_ID: correlationId,
      H2_WAIT_FOR_GO: "true",
    };
    const children = [forkChild(targets, overrides), forkChild(targets, overrides)];
    await Promise.all(children.map((child) => waitForMessage(child, "ready")));
    const results = children.map((child) => waitForMessage(child, "result"));
    for (const child of children) child.send({ type: "go" });
    const messages = await Promise.all(results);
    await Promise.all(children.map(waitForExit));
    assert.deepEqual(messages.map(({ result }) => result.duplicate).sort(), [false, true]);
    assert.equal(new Set(messages.map(({ result }) => result.grant_id)).size, 1);

    const reopened = runtime(targets);
    assert.equal(reopened.database.prepare("SELECT count(*) AS count FROM grants").get().count, 1);
    assert.equal(reopened.database.prepare("SELECT count(*) AS count FROM heartbeat_receipt_outbox").get().count, 1);
    close(reopened);
  } finally {
    fs.rmSync(targets.root, { recursive: true, force: true });
  }
});

test("the bounded H2 one-shot CLI dispatches one pending receipt from a separate process", async () => {
  const targets = paths();
  try {
    const correlationId = "corr_h2_worker_process";
    const challenge = await createPending(targets, correlationId);
    const setup = runtime(targets);
    setup.durableEnrollment.approveChallenge(challenge.challenge_id, correlationId, { humanAction: true });
    close(setup);

    const p0TraceBefore = fs.existsSync(P0_TRACE_PATH) ? fs.readFileSync(P0_TRACE_PATH) : null;
    const h2TraceBefore = fs.existsSync(targets.trace) ? fs.readFileSync(targets.trace, "utf8") : "";
    const output = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [WORKER_PATH], {
        env: {
          ...process.env,
          WEBMCP_H2_DURABLE_ENROLLMENT: "true",
          WEBMCP_MVP_DELIVERY: "heartbeat",
          WEBMCP_MVP_DATABASE: targets.receiver,
          WEBMCP_H2_DESTINATION_DATABASE: targets.destination,
          WEBMCP_H2_TRACE: targets.trace,
          WEBMCP_MVP_PORT: "4322",
          WEBMCP_H1_DELIVERY_TICKET_SECRET: DELIVERY_SECRET,
          WEBMCP_H1_EFFECT_RECEIPT_SECRET: EFFECT_SECRET,
          WEBMCP_H2_RECEIPT_SEALING_KEY: SEALING_KEY,
          WEBMCP_H2_RECEIPT_KEY_ID: KEY_ID,
          WEBMCP_H2_ALLOW_TEST_PATHS: "true",
          WEBMCP_H2_WORKER_NOW: NOW,
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.once("exit", (code) => code === 0
        ? resolve(stdout)
        : reject(new Error(`Worker exited ${code}: ${stderr}`)));
    });
    assert.equal(JSON.parse(output).result.status, "AWAITING_HOST_BINDING");
    const h2TraceAfter = fs.readFileSync(targets.trace, "utf8");
    assert.ok(h2TraceAfter.length > h2TraceBefore.length);
    assert.match(h2TraceAfter.slice(h2TraceBefore.length), /deliver_durable_enrollment_receipt/);
    const p0TraceAfter = fs.existsSync(P0_TRACE_PATH) ? fs.readFileSync(P0_TRACE_PATH) : null;
    assert.deepEqual(p0TraceAfter, p0TraceBefore);
    const reopened = runtime(targets);
    assert.equal(reopened.database.prepare("SELECT status FROM heartbeat_receipt_outbox").get().status, "DELIVERED");
    close(reopened);
  } finally {
    fs.rmSync(targets.root, { recursive: true, force: true });
  }
});
