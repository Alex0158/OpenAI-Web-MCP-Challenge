import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHttpServer, createRuntime } from "../src/server.mjs";
import { signEventBody } from "../src/receiver/events.mjs";
import {
  FIXED_NOW,
  approvedEnrollment,
  transitionAndSignedEnvelope,
} from "./helpers.mjs";

const H1_ORIGIN = "http://127.0.0.1:4321";
const H1_DELIVERY_SECRET = "h1-test-delivery-ticket-secret-at-least-32-bytes";
const H1_EFFECT_SECRET = "h1-test-effect-receipt-secret-at-least-32-bytes";

function h1Runtime(overrides = {}) {
  return createRuntime({
    databasePath: ":memory:",
    tracePath: null,
    origin: H1_ORIGIN,
    clock: () => new Date(FIXED_NOW),
    deliveryMode: "heartbeat",
    deliveryTicketSecret: H1_DELIVERY_SECRET,
    effectReceiptSecret: H1_EFFECT_SECRET,
    allowH1TestPaths: true,
    ...overrides,
  });
}

async function enrollInbox(runtime, correlationId) {
  const enrollment = await approvedEnrollment(runtime, correlationId);
  const inbox = runtime.heartbeatInbox.createForGrant(enrollment.approval.grant_id);
  const handle = decodeURIComponent(new URL(inbox.receiver_inbox_url).pathname.split("/").at(-1));
  return { ...enrollment, inbox, handle };
}

test("no accepted event produces no pending ticket, Host effect, or adapter resume", async () => {
  const runtime = h1Runtime();
  const enrollment = await enrollInbox(runtime, "corr_h1_empty");
  const before = runtime.domain.getWorkflow();
  const result = runtime.heartbeatInbox.getPending(enrollment.handle);

  assert.deepEqual(result, {
    pending: false,
    workflow_id: "WF-001",
    checked_at: FIXED_NOW.toISOString(),
  });
  assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM events").get().count, 0);
  assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM heartbeat_deliveries").get().count, 0);
  assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM workflow_effects").get().count, 0);
  assert.equal(runtime.adapter.getContext(enrollment.privateCapture.managed_context_id).resume_count, 0);
  assert.deepEqual(runtime.domain.getWorkflow(), before);
  runtime.database.close();
});

test("authenticated heartbeat event persists one pending delivery and invokes no adapter", async () => {
  const runtime = h1Runtime();
  runtime.domain.prepareArtifact({ content: "Stage-A draft", expected_revision: 0 }, "corr_h1_pending");
  const enrollment = await enrollInbox(runtime, "corr_h1_pending");
  const envelope = transitionAndSignedEnvelope(runtime, "corr_h1_pending");
  const first = await runtime.events.receive(envelope);
  const duplicate = await runtime.events.receive(envelope);
  const pending = runtime.heartbeatInbox.getPending(enrollment.handle);

  assert.equal(first.status, "PENDING_HEARTBEAT");
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.delivery_id, first.delivery_id);
  assert.equal(pending.pending, true);
  assert.equal(pending.event.event_id, envelope.transition.event.event_id);
  assert.equal(pending.event.canonical_url, `${H1_ORIGIN}/workflows/WF-001`);
  assert.match(pending.delivery_ticket, /^h1d1\./);
  assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM events").get().count, 1);
  assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM runs").get().count, 1);
  assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM heartbeat_deliveries").get().count, 1);
  assert.equal(runtime.adapter.getContext(enrollment.privateCapture.managed_context_id).resume_count, 0);
  runtime.database.close();
});

test("invalid event authentication creates no Receiver delivery", async () => {
  const runtime = h1Runtime();
  await enrollInbox(runtime, "corr_h1_invalid");
  const envelope = transitionAndSignedEnvelope(runtime, "corr_h1_invalid");
  await assert.rejects(
    runtime.events.receive({ ...envelope, signature: "invalid" }),
    /signature is invalid/,
  );
  assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM events").get().count, 0);
  assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM runs").get().count, 0);
  assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM heartbeat_deliveries").get().count, 0);
  runtime.database.close();
});

test("a pending accepted event survives a Receiver process restart", async () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "webmcp-h1-restart-"));
  const databasePath = path.join(temporaryRoot, "h1.sqlite");
  try {
    const firstRuntime = h1Runtime({ databasePath });
    firstRuntime.domain.prepareArtifact({ content: "Stage-A draft", expected_revision: 0 }, "corr_h1_restart");
    const enrollment = await enrollInbox(firstRuntime, "corr_h1_restart");
    const envelope = transitionAndSignedEnvelope(firstRuntime, "corr_h1_restart");
    await firstRuntime.events.receive(envelope);
    firstRuntime.database.close();

    const restarted = h1Runtime({ databasePath });
    const pending = restarted.heartbeatInbox.getPending(enrollment.handle);
    assert.equal(pending.pending, true);
    assert.equal(pending.event.event_id, envelope.transition.event.event_id);
    assert.equal(restarted.database.prepare(`
      SELECT status FROM heartbeat_deliveries WHERE event_id = ?
    `).get(envelope.transition.event.event_id).status, "PENDING");
    restarted.database.close();
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("an event cannot enter heartbeat mode without an active Grant inbox", async () => {
  const runtime = h1Runtime();
  await approvedEnrollment(runtime, "corr_h1_no_inbox");
  const envelope = transitionAndSignedEnvelope(runtime, "corr_h1_no_inbox");
  await assert.rejects(runtime.events.receive(envelope), /inbox was not found/);
  assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM events").get().count, 0);
  runtime.database.close();
});

test("signed duplicate payload still rejects a conflicting event body", async () => {
  const runtime = h1Runtime();
  runtime.domain.prepareArtifact({ content: "Stage-A draft", expected_revision: 0 }, "corr_h1_conflict");
  await enrollInbox(runtime, "corr_h1_conflict");
  const envelope = transitionAndSignedEnvelope(runtime, "corr_h1_conflict");
  await runtime.events.receive(envelope);
  const event = JSON.parse(envelope.rawBody);
  const conflictingRawBody = JSON.stringify({
    ...event,
    occurred_at: new Date(FIXED_NOW.getTime() + 1_000).toISOString(),
  });
  const timestamp = String(Math.floor(FIXED_NOW.getTime() / 1000));

  await assert.rejects(runtime.events.receive({
    rawBody: conflictingRawBody,
    timestamp,
    signature: signEventBody(conflictingRawBody, timestamp),
    correlationId: "corr_h1_conflict",
  }), /different payload/);
  assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM heartbeat_deliveries").get().count, 1);
  runtime.database.close();
});

test("heartbeat mode refuses non-isolated runtime paths before opening them", () => {
  assert.throws(() => createRuntime({
    databasePath: path.join(os.tmpdir(), "not-the-h1-database.sqlite"),
    tracePath: path.join(os.tmpdir(), "not-the-h1-trace.jsonl"),
    origin: H1_ORIGIN,
    deliveryMode: "heartbeat",
    deliveryTicketSecret: H1_DELIVERY_SECRET,
    effectReceiptSecret: H1_EFFECT_SECRET,
  }), /isolated H1 database and trace paths/);
});

test("Receiver errors redact the inbox bearer path and suppress referrers", async () => {
  const runtime = h1Runtime();
  const server = createHttpServer(runtime);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/receiver/inboxes/raw-secret-handle/pending`,
    );
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    const rejection = runtime.trace.entries.find((entry) => entry.action === "request_rejected");
    assert.equal(rejection.details.path, "/api/receiver/inboxes/[redacted]/pending");
    assert.equal(JSON.stringify(rejection).includes("raw-secret-handle"), false);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    runtime.database.close();
  }
});
