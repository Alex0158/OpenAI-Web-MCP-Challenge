import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHttpServer, createRuntime } from "../src/server.mjs";
import { signEventBody } from "../src/receiver/events.mjs";
import {
  buildDurableReceiptAad,
  digestContextBinding,
} from "../src/receiver/durable-enrollment.mjs";
import { sealReceipt, unsealReceipt } from "../src/receipt-sealer.mjs";
import { canonicalJson } from "../src/webmcp-manifest.mjs";
import { FIXED_NOW, testRuntime } from "./helpers.mjs";

const H2_ORIGIN = "http://127.0.0.1:4322";
const H2_DELIVERY_SECRET = "h2-test-delivery-ticket-secret-at-least-32-bytes";
const H2_EFFECT_SECRET = "h2-test-effect-receipt-secret-at-least-32-bytes";
const H2_SEALING_KEY = Buffer.alloc(32, 0x42);
const H2_KEY_ID = "h2-test-key-1";

function temporaryPaths() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "webmcp-h2-enrollment-"));
  return {
    root,
    receiver: path.join(root, "receiver.sqlite"),
    destination: path.join(root, "destination.sqlite"),
  };
}

function mutableClock(start = FIXED_NOW) {
  let current = new Date(start);
  return {
    now: () => new Date(current),
    advance(milliseconds) {
      current = new Date(current.getTime() + milliseconds);
    },
  };
}

function h2Runtime(paths, {
  clock = mutableClock(),
  enrollmentFault = null,
  sinkFault = null,
  sealingKey = H2_SEALING_KEY,
  tracePath = null,
} = {}) {
  return createRuntime({
    databasePath: paths.receiver,
    durableDestinationPath: paths.destination,
    tracePath,
    origin: H2_ORIGIN,
    clock: clock.now,
    deliveryMode: "heartbeat",
    deliveryTicketSecret: H2_DELIVERY_SECRET,
    effectReceiptSecret: H2_EFFECT_SECRET,
    durableEnrollmentEnabled: true,
    receiptSealingKey: sealingKey,
    receiptKeyId: H2_KEY_ID,
    durableEnrollmentFaultInjector: enrollmentFault,
    durableReceiptSinkFaultInjector: sinkFault,
    allowH2TestPaths: true,
  });
}

async function pendingChallenge(runtime, correlationId) {
  const manifest = runtime.grants.issueManifest(correlationId);
  const capture = await runtime.grants.captureCurrentContext(correlationId);
  const challenge = runtime.grants.beginEnrollment({
    manifest,
    capture_handle: capture.capture_handle,
  }, correlationId);
  return { manifest, capture, challenge };
}

function approve(runtime, enrollment, correlationId) {
  return runtime.durableEnrollment.approveChallenge(
    enrollment.challenge.challenge_id,
    correlationId,
    { humanAction: true },
  );
}

function destinationReceipt(runtime) {
  const row = runtime.receiptDestinationDatabase.prepare(`
    SELECT * FROM durable_context_receipts
  `).get();
  return row ? { row, receipt: JSON.parse(row.receipt_json) } : null;
}

function closeRuntime(runtime) {
  runtime.receiptDestinationDatabase?.close();
  runtime.database.close();
}

function removeTemporaryRoot(paths) {
  fs.rmSync(paths.root, { recursive: true, force: true });
}

function oneShotFault(targetLabel) {
  let used = false;
  return {
    hit(label) {
      if (label === targetLabel && !used) {
        used = true;
        throw new Error(`Injected failure at ${label}`);
      }
    },
  };
}

test("H2 is opt-in and default P0 creates no durable-enrollment schema", () => {
  const runtime = testRuntime();
  assert.equal(runtime.durableEnrollmentEnabled, false);
  assert.equal(runtime.durableEnrollment, null);
  assert.equal(runtime.database.prepare(`
    SELECT count(*) AS count FROM sqlite_master
    WHERE type = 'table' AND name = 'heartbeat_receipt_outbox'
  `).get().count, 0);
  runtime.database.close();
});

test("H2 approval atomically creates one sealed receipt intent and duplicate approval is idempotent", async () => {
  const paths = temporaryPaths();
  const runtime = h2Runtime(paths);
  try {
    const correlationId = "corr_h2_atomic";
    const enrollment = await pendingChallenge(runtime, correlationId);
    assert.throws(
      () => runtime.durableEnrollment.approveChallenge(
        enrollment.challenge.challenge_id,
        correlationId,
      ),
      /Receiver consent UI/,
    );
    const first = approve(runtime, enrollment, correlationId);
    const duplicate = approve(runtime, enrollment, correlationId);

    assert.equal(first.enrollment_status, "RECEIPT_PENDING");
    assert.equal(first.secrets_exposed, false);
    assert.equal("receiver_inbox_url" in first, false);
    assert.equal("agent_binding" in first, false);
    assert.equal(duplicate.duplicate, true);
    assert.equal(duplicate.grant_id, first.grant_id);
    assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM grants").get().count, 1);
    assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM heartbeat_inboxes").get().count, 1);
    assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM heartbeat_receipt_outbox").get().count, 1);
    const row = runtime.database.prepare(`
      SELECT o.*, g.status AS grant_status, i.status AS inbox_status
      FROM heartbeat_receipt_outbox o
      JOIN grants g ON g.grant_id = o.grant_id
      JOIN heartbeat_inboxes i ON i.inbox_id = o.inbox_id
    `).get();
    assert.equal(row.status, "PENDING");
    assert.equal(row.grant_status, "AWAITING_RECEIPT");
    assert.equal(row.inbox_status, "AWAITING_RECEIPT");
    assert.ok(row.receipt_ciphertext);
    assert.equal(destinationReceipt(runtime), null);
  } finally {
    closeRuntime(runtime);
    removeTemporaryRoot(paths);
  }
});

test("H2 HTTP approval returns only a retry-safe status claim and never the sealed receipt", async () => {
  const paths = temporaryPaths();
  const runtime = h2Runtime(paths);
  const server = createHttpServer(runtime);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const correlationId = "corr_h2_http";
    const enrollment = await pendingChallenge(runtime, correlationId);
    const address = server.address();
    const approval = await fetch(
      `http://127.0.0.1:${address.port}/api/receiver/consent/${enrollment.challenge.challenge_id}/approve`,
      {
        method: "POST",
        headers: {
          "X-Correlation-Id": correlationId,
          "X-Receiver-Human-Action": "true",
        },
      },
    );
    assert.equal(approval.status, 202);
    const body = await approval.json();
    assert.equal(body.enrollment_status, "RECEIPT_PENDING");
    assert.equal(body.secrets_exposed, false);
    assert.equal("receiver_inbox_url" in body, false);
    assert.equal("agent_binding" in body, false);
    assert.equal("dispatch_id" in body, false);

    const status = await fetch(
      `http://127.0.0.1:${address.port}/api/receiver/consent/${enrollment.challenge.challenge_id}/status`,
      { headers: { "X-Correlation-Id": correlationId } },
    );
    assert.equal(status.status, 200);
    assert.equal((await status.json()).grant_id, body.grant_id);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    closeRuntime(runtime);
    removeTemporaryRoot(paths);
  }
});

test("an approval commit-boundary exception followed by database reopen recovers the same enrollment", async () => {
  const paths = temporaryPaths();
  const clock = mutableClock();
  let firstRuntime = h2Runtime(paths, {
    clock,
    enrollmentFault: oneShotFault("after_enrollment_commit_before_response"),
  });
  let inboxHandle;
  try {
    const correlationId = "corr_h2_approval_crash";
    const enrollment = await pendingChallenge(firstRuntime, correlationId);
    assert.throws(
      () => approve(firstRuntime, enrollment, correlationId),
      /Injected failure/,
    );
    const committed = firstRuntime.database.prepare(`
      SELECT g.grant_id, i.inbox_id, o.dispatch_id, o.receipt_digest
      FROM grants g
      JOIN heartbeat_inboxes i ON i.grant_id = g.grant_id
      JOIN heartbeat_receipt_outbox o ON o.grant_id = g.grant_id
    `).get();
    assert.ok(committed);
    closeRuntime(firstRuntime);

    firstRuntime = h2Runtime(paths, { clock });
    const recovered = firstRuntime.durableEnrollment.approveChallenge(
      enrollment.challenge.challenge_id,
      correlationId,
      { humanAction: true },
    );
    assert.equal(recovered.duplicate, true);
    assert.equal(recovered.grant_id, committed.grant_id);
    const afterRestart = firstRuntime.database.prepare(`
      SELECT g.grant_id, i.inbox_id, o.dispatch_id, o.receipt_digest
      FROM grants g
      JOIN heartbeat_inboxes i ON i.grant_id = g.grant_id
      JOIN heartbeat_receipt_outbox o ON o.grant_id = g.grant_id
    `).get();
    assert.deepEqual(afterRestart, committed);

    const delivered = await firstRuntime.durableEnrollment.dispatchNext();
    assert.equal(delivered.status, "AWAITING_HOST_BINDING");
    const destination = destinationReceipt(firstRuntime);
    assert.ok(destination);
    inboxHandle = decodeURIComponent(
      new URL(destination.receipt.receiver_inbox_url).pathname.split("/").at(-1),
    );
    const outbox = firstRuntime.database.prepare(`
      SELECT * FROM heartbeat_receipt_outbox
    `).get();
    assert.equal(outbox.status, "DELIVERED");
    assert.equal(outbox.receipt_digest, committed.receipt_digest);
    assert.equal(outbox.receipt_ciphertext, null);
    assert.equal(outbox.receipt_iv, null);
    assert.equal(outbox.receipt_auth_tag, null);
    assert.ok(outbox.purged_at);
  } finally {
    closeRuntime(firstRuntime);
  }
  try {
    const files = fs.readdirSync(paths.root)
      .filter((name) => name.startsWith("receiver.sqlite"))
      .map((name) => fs.readFileSync(path.join(paths.root, name)));
    assert.equal(files.some((buffer) => buffer.includes(Buffer.from(inboxHandle))), false);
  } finally {
    removeTemporaryRoot(paths);
  }
});

test("a pre-commit approval crash leaves no partial authority and retry creates one enrollment", async () => {
  const paths = temporaryPaths();
  const clock = mutableClock();
  let runtime = h2Runtime(paths, {
    clock,
    enrollmentFault: oneShotFault("before_enrollment_commit"),
  });
  try {
    const correlationId = "corr_h2_precommit_crash";
    const enrollment = await pendingChallenge(runtime, correlationId);
    assert.throws(
      () => approve(runtime, enrollment, correlationId),
      /Injected failure/,
    );
    assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM grants").get().count, 0);
    assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM heartbeat_inboxes").get().count, 0);
    assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM heartbeat_receipt_outbox").get().count, 0);
    assert.equal(runtime.database.prepare(`
      SELECT status FROM binding_challenges WHERE challenge_id = ?
    `).get(enrollment.challenge.challenge_id).status, "PENDING");
    closeRuntime(runtime);

    runtime = h2Runtime(paths, { clock });
    const recovered = approve(runtime, enrollment, correlationId);
    assert.equal(recovered.enrollment_status, "RECEIPT_PENDING");
    assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM grants").get().count, 1);
    assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM heartbeat_inboxes").get().count, 1);
    assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM heartbeat_receipt_outbox").get().count, 1);
  } finally {
    closeRuntime(runtime);
    removeTemporaryRoot(paths);
  }
});

test("a destination-ack exception followed by database reopen retries one stable dispatch", async () => {
  const paths = temporaryPaths();
  const clock = mutableClock();
  let runtime = h2Runtime(paths, {
    clock,
    sinkFault: oneShotFault("after_destination_commit_before_ack"),
  });
  try {
    const correlationId = "corr_h2_ack_loss";
    const enrollment = await pendingChallenge(runtime, correlationId);
    approve(runtime, enrollment, correlationId);
    await assert.rejects(
      runtime.durableEnrollment.dispatchNext(),
      /Injected failure/,
    );
    assert.equal(runtime.receiptDestinationDatabase.prepare(`
      SELECT count(*) AS count FROM durable_context_receipts
    `).get().count, 1);
    let state = runtime.database.prepare(`
      SELECT o.status AS outbox_status, o.attempt_count,
             g.status AS grant_status, i.status AS inbox_status
      FROM heartbeat_receipt_outbox o
      JOIN grants g ON g.grant_id = o.grant_id
      JOIN heartbeat_inboxes i ON i.inbox_id = o.inbox_id
    `).get();
    assert.equal(state.outbox_status, "DISPATCHING");
    assert.equal(state.attempt_count, 1);
    assert.equal(state.grant_status, "AWAITING_RECEIPT");
    assert.equal(state.inbox_status, "AWAITING_RECEIPT");
    closeRuntime(runtime);

    clock.advance(31_000);
    runtime = h2Runtime(paths, {
      clock,
      enrollmentFault: oneShotFault("after_binding_commit_before_response"),
    });
    const retried = await runtime.durableEnrollment.dispatchNext();
    assert.equal(retried.destination_duplicate, true);
    state = runtime.database.prepare(`
      SELECT o.status AS outbox_status, o.attempt_count,
             g.status AS grant_status, i.status AS inbox_status
      FROM heartbeat_receipt_outbox o
      JOIN grants g ON g.grant_id = o.grant_id
      JOIN heartbeat_inboxes i ON i.inbox_id = o.inbox_id
    `).get();
    assert.equal(state.outbox_status, "DELIVERED");
    assert.equal(state.attempt_count, 2);
    assert.equal(state.grant_status, "AWAITING_HOST_BINDING");
    assert.equal(state.inbox_status, "AWAITING_HOST_BINDING");
    assert.equal(runtime.receiptDestinationDatabase.prepare(`
      SELECT count(*) AS count FROM durable_context_receipts
    `).get().count, 1);

    const receipt = destinationReceipt(runtime).receipt;
    assert.throws(
      () => runtime.durableEnrollment.registerHostBinding({
        workflow_id: "WF-001",
        agent_binding: receipt.agent_binding,
      }, correlationId),
      /Injected failure/,
    );
    const duplicateBinding = runtime.durableEnrollment.registerHostBinding({
      workflow_id: "WF-001",
      agent_binding: receipt.agent_binding,
    }, correlationId);
    assert.equal(duplicateBinding.duplicate, true);
    assert.equal(duplicateBinding.enrollment_status, "ACTIVE");
    state = runtime.database.prepare(`
      SELECT g.status AS grant_status, i.status AS inbox_status
      FROM grants g JOIN heartbeat_inboxes i ON i.grant_id = g.grant_id
    `).get();
    assert.equal(state.grant_status, "ACTIVE");
    assert.equal(state.inbox_status, "ACTIVE");
  } finally {
    closeRuntime(runtime);
    removeTemporaryRoot(paths);
  }
});

test("an event creates no run before durable receipt delivery or Host binding", async () => {
  const paths = temporaryPaths();
  const runtime = h2Runtime(paths);
  try {
    const correlationId = "corr_h2_early_event";
    const enrollment = await pendingChallenge(runtime, correlationId);
    approve(runtime, enrollment, correlationId);
    const grant = runtime.database.prepare("SELECT * FROM grants").get();
    runtime.database.prepare(`
      UPDATE workflows SET state = 'READY', state_version = 2, updated_at = ?
      WHERE workflow_id = 'WF-001'
    `).run(FIXED_NOW.toISOString());
    const event = {
      agent_binding: grant.agent_binding,
      canonical_url: grant.canonical_url,
      event_id: "evt_h2_early",
      event_sequence: 1,
      event_type: grant.event_type,
      occurred_at: FIXED_NOW.toISOString(),
      state_version: 2,
      workflow_id: grant.workflow_id,
    };
    const rawBody = JSON.stringify(event);
    const timestamp = String(Math.floor(FIXED_NOW.getTime() / 1000));
    await assert.rejects(runtime.events.receive({
      rawBody,
      timestamp,
      signature: signEventBody(rawBody, timestamp),
      correlationId,
    }), /Grant is not active/);
    assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM events").get().count, 0);
    assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM runs").get().count, 0);
    assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM heartbeat_deliveries").get().count, 0);

    await runtime.durableEnrollment.dispatchNext();
    await assert.rejects(runtime.events.receive({
      rawBody,
      timestamp,
      signature: signEventBody(rawBody, timestamp),
      correlationId,
    }), /Grant is not active/);
    assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM events").get().count, 0);
  } finally {
    closeRuntime(runtime);
    removeTemporaryRoot(paths);
  }
});

test("revoked enrollment authority is revalidated before sink dispatch and remains revoked", async () => {
  const paths = temporaryPaths();
  const runtime = h2Runtime(paths);
  try {
    const correlationId = "corr_h2_revoked_before_claim";
    const enrollment = await pendingChallenge(runtime, correlationId);
    approve(runtime, enrollment, correlationId);
    runtime.database.exec(`
      UPDATE grants SET status = 'REVOKED';
      UPDATE heartbeat_inboxes SET status = 'REVOKED';
    `);

    const result = await runtime.durableEnrollment.dispatchNext();
    assert.equal(result.status, "FAILED");
    assert.equal(result.error_code, "ENROLLMENT_NOT_DISPATCHABLE");
    const state = runtime.database.prepare(`
      SELECT o.status AS outbox_status, o.last_error_code, o.receipt_ciphertext,
             g.status AS grant_status, i.status AS inbox_status
      FROM heartbeat_receipt_outbox o
      JOIN grants g ON g.grant_id = o.grant_id
      JOIN heartbeat_inboxes i ON i.inbox_id = o.inbox_id
    `).get();
    assert.equal(state.outbox_status, "FAILED");
    assert.equal(state.last_error_code, "ENROLLMENT_NOT_DISPATCHABLE");
    assert.equal(state.receipt_ciphertext, null);
    assert.equal(state.grant_status, "REVOKED");
    assert.equal(state.inbox_status, "REVOKED");
    assert.equal(destinationReceipt(runtime), null);
  } finally {
    closeRuntime(runtime);
    removeTemporaryRoot(paths);
  }
});

test("authority revoked after lease validation but before the dispatch fence reaches no sink", async () => {
  const paths = temporaryPaths();
  let runtime;
  let mutated = false;
  const authorityFault = {
    hit(label) {
      if (label === "before_dispatch_authority_fence" && !mutated) {
        mutated = true;
        runtime.database.exec(`
          UPDATE grants SET status = 'REVOKED';
          UPDATE heartbeat_inboxes SET status = 'REVOKED';
        `);
      }
    },
  };
  runtime = h2Runtime(paths, { enrollmentFault: authorityFault });
  try {
    const correlationId = "corr_h2_revoked_before_fence";
    const enrollment = await pendingChallenge(runtime, correlationId);
    approve(runtime, enrollment, correlationId);
    const result = await runtime.durableEnrollment.dispatchNext();
    assert.equal(result.status, "FAILED");
    assert.equal(result.error_code, "ENROLLMENT_NOT_DISPATCHABLE");
    const state = runtime.database.prepare(`
      SELECT o.status AS outbox_status, o.last_error_code,
             g.status AS grant_status, i.status AS inbox_status
      FROM heartbeat_receipt_outbox o
      JOIN grants g ON g.grant_id = o.grant_id
      JOIN heartbeat_inboxes i ON i.inbox_id = o.inbox_id
    `).get();
    assert.equal(state.outbox_status, "FAILED");
    assert.equal(state.last_error_code, "ENROLLMENT_NOT_DISPATCHABLE");
    assert.equal(state.grant_status, "REVOKED");
    assert.equal(state.inbox_status, "REVOKED");
    assert.equal(destinationReceipt(runtime), null);
  } finally {
    closeRuntime(runtime);
    removeTemporaryRoot(paths);
  }
});

test("managed-context mutation breaks the sealed AAD binding and reaches no destination", async () => {
  const paths = temporaryPaths();
  const runtime = h2Runtime(paths);
  try {
    const correlationId = "corr_h2_context_mutation";
    const enrollment = await pendingChallenge(runtime, correlationId);
    approve(runtime, enrollment, correlationId);
    runtime.database.prepare(`
      UPDATE grants SET managed_context_id = 'ctx_mutated_after_approval'
    `).run();
    await assert.rejects(
      runtime.durableEnrollment.dispatchNext(),
      /authentication failed/,
    );
    assert.equal(destinationReceipt(runtime), null);
    assert.equal(runtime.database.prepare(`
      SELECT status FROM heartbeat_receipt_outbox
    `).get().status, "FAILED");
  } finally {
    closeRuntime(runtime);
    removeTemporaryRoot(paths);
  }
});

test("a validly re-sealed receipt with mismatched continuation intent reaches no destination", async () => {
  const paths = temporaryPaths();
  const runtime = h2Runtime(paths);
  try {
    const correlationId = "corr_h2_intent_mutation";
    const enrollment = await pendingChallenge(runtime, correlationId);
    approve(runtime, enrollment, correlationId);
    const row = runtime.database.prepare(`
      SELECT o.*, g.managed_context_kind, g.managed_context_id
      FROM heartbeat_receipt_outbox o
      JOIN grants g ON g.grant_id = o.grant_id
    `).get();
    const aad = buildDurableReceiptAad({
      dispatchId: row.dispatch_id,
      grantId: row.grant_id,
      inboxId: row.inbox_id,
      contextBindingDigest: digestContextBinding({
        managed_context_kind: row.managed_context_kind,
        managed_context_id: row.managed_context_id,
      }),
    });
    const receipt = unsealReceipt(row, {
      key: H2_SEALING_KEY,
      keyId: H2_KEY_ID,
      aad,
    });
    const resealed = sealReceipt({
      ...receipt,
      continuation_intent: {
        ...receipt.continuation_intent,
        first_action: "USE_STALE_STATE",
      },
    }, {
      key: H2_SEALING_KEY,
      keyId: H2_KEY_ID,
      aad,
    });
    runtime.database.prepare(`
      UPDATE heartbeat_receipt_outbox
      SET receipt_ciphertext = ?, receipt_iv = ?, receipt_auth_tag = ?, receipt_digest = ?
      WHERE dispatch_id = ?
    `).run(
      resealed.receipt_ciphertext,
      resealed.receipt_iv,
      resealed.receipt_auth_tag,
      resealed.receipt_digest,
      row.dispatch_id,
    );

    await assert.rejects(
      runtime.durableEnrollment.dispatchNext(),
      /continuation_intent is outside enrollment scope/,
    );
    assert.equal(destinationReceipt(runtime), null);
    assert.equal(runtime.database.prepare(`
      SELECT status FROM heartbeat_receipt_outbox
    `).get().status, "FAILED");
  } finally {
    closeRuntime(runtime);
    removeTemporaryRoot(paths);
  }
});

test("tampered sealed receipts fail closed without destination delivery or authority", async () => {
  const paths = temporaryPaths();
  const runtime = h2Runtime(paths);
  try {
    const correlationId = "corr_h2_tamper";
    const enrollment = await pendingChallenge(runtime, correlationId);
    approve(runtime, enrollment, correlationId);
    runtime.database.prepare(`
      UPDATE heartbeat_receipt_outbox SET receipt_ciphertext = ?
    `).run(Buffer.from("tampered"));
    await assert.rejects(
      runtime.durableEnrollment.dispatchNext(),
      /authentication failed/,
    );
    const state = runtime.database.prepare(`
      SELECT o.status AS outbox_status, o.last_error_code,
             g.status AS grant_status, i.status AS inbox_status,
             o.receipt_ciphertext
      FROM heartbeat_receipt_outbox o
      JOIN grants g ON g.grant_id = o.grant_id
      JOIN heartbeat_inboxes i ON i.inbox_id = o.inbox_id
    `).get();
    assert.equal(state.outbox_status, "FAILED");
    assert.equal(state.last_error_code, "RECEIPT_ENVELOPE_INVALID");
    assert.equal(state.grant_status, "FAILED");
    assert.equal(state.inbox_status, "REVOKED");
    assert.equal(state.receipt_ciphertext, null);
    assert.equal(destinationReceipt(runtime), null);
  } finally {
    closeRuntime(runtime);
    removeTemporaryRoot(paths);
  }
});

test("an expired undelivered enrollment purges its capability and never reaches the destination", async () => {
  const paths = temporaryPaths();
  const clock = mutableClock();
  const runtime = h2Runtime(paths, { clock });
  try {
    const correlationId = "corr_h2_expiry";
    const enrollment = await pendingChallenge(runtime, correlationId);
    approve(runtime, enrollment, correlationId);
    clock.advance(31 * 60 * 1000);
    const result = await runtime.durableEnrollment.dispatchNext();
    assert.equal(result.status, "EXPIRED");
    const state = runtime.database.prepare(`
      SELECT o.status AS outbox_status, o.receipt_ciphertext,
             g.status AS grant_status, i.status AS inbox_status
      FROM heartbeat_receipt_outbox o
      JOIN grants g ON g.grant_id = o.grant_id
      JOIN heartbeat_inboxes i ON i.inbox_id = o.inbox_id
    `).get();
    assert.equal(state.outbox_status, "EXPIRED");
    assert.equal(state.grant_status, "EXPIRED");
    assert.equal(state.inbox_status, "EXPIRED");
    assert.equal(state.receipt_ciphertext, null);
    assert.equal(destinationReceipt(runtime), null);
  } finally {
    closeRuntime(runtime);
    removeTemporaryRoot(paths);
  }
});

test("two dispatch calls on one runtime produce one destination receipt and one completion", async () => {
  const paths = temporaryPaths();
  const runtime = h2Runtime(paths);
  try {
    const correlationId = "corr_h2_workers";
    const enrollment = await pendingChallenge(runtime, correlationId);
    approve(runtime, enrollment, correlationId);
    const results = await Promise.all([
      runtime.durableEnrollment.dispatchNext(),
      runtime.durableEnrollment.dispatchNext(),
    ]);
    assert.equal(results.filter(Boolean).length, 1);
    assert.equal(runtime.receiptDestinationDatabase.prepare(`
      SELECT count(*) AS count FROM durable_context_receipts
    `).get().count, 1);
    const outbox = runtime.database.prepare(`
      SELECT status, attempt_count FROM heartbeat_receipt_outbox
    `).get();
    assert.equal(outbox.status, "DELIVERED");
    assert.equal(outbox.attempt_count, 1);
  } finally {
    closeRuntime(runtime);
    removeTemporaryRoot(paths);
  }
});

test("two Receiver database connections prevent an expired stale lease from failing a newer delivery", async () => {
  const paths = temporaryPaths();
  const clock = mutableClock();
  const firstRuntime = h2Runtime(paths, { clock });
  let secondRuntime;
  let releaseFirstDispatch;
  let markFirstDispatchEntered;
  const firstDispatchEntered = new Promise((resolve) => {
    markFirstDispatchEntered = resolve;
  });
  firstRuntime.durableEnrollment.receiptSink = {
    async dispatchEnrollmentReceipt() {
      markFirstDispatchEntered();
      return new Promise((resolve, reject) => {
        releaseFirstDispatch = () => {
          const error = new Error("stale worker destination conflict");
          error.statusCode = 409;
          reject(error);
        };
      });
    },
  };
  try {
    const correlationId = "corr_h2_stale_lease";
    const enrollment = await pendingChallenge(firstRuntime, correlationId);
    approve(firstRuntime, enrollment, correlationId);

    const staleDispatch = firstRuntime.durableEnrollment.dispatchNext();
    await firstDispatchEntered;
    assert.equal(firstRuntime.database.prepare(`
      SELECT status FROM heartbeat_receipt_outbox
    `).get().status, "DISPATCHING");

    clock.advance(31_000);
    secondRuntime = h2Runtime(paths, { clock });
    const recovered = await secondRuntime.durableEnrollment.dispatchNext();
    assert.equal(recovered.status, "AWAITING_HOST_BINDING");
    releaseFirstDispatch();
    await assert.rejects(staleDispatch, /stale worker destination conflict/);

    const state = secondRuntime.database.prepare(`
      SELECT o.status AS outbox_status, o.attempt_count,
             g.status AS grant_status, i.status AS inbox_status
      FROM heartbeat_receipt_outbox o
      JOIN grants g ON g.grant_id = o.grant_id
      JOIN heartbeat_inboxes i ON i.inbox_id = o.inbox_id
    `).get();
    assert.equal(state.outbox_status, "DELIVERED");
    assert.equal(state.attempt_count, 2);
    assert.equal(state.grant_status, "AWAITING_HOST_BINDING");
    assert.equal(state.inbox_status, "AWAITING_HOST_BINDING");
    assert.equal(secondRuntime.receiptDestinationDatabase.prepare(`
      SELECT count(*) AS count FROM durable_context_receipts
    `).get().count, 1);
  } finally {
    if (releaseFirstDispatch) releaseFirstDispatch();
    if (secondRuntime) closeRuntime(secondRuntime);
    closeRuntime(firstRuntime);
    removeTemporaryRoot(paths);
  }
});

test("a lease-boundary exception followed by database reopen is reclaimed without duplication", async () => {
  const paths = temporaryPaths();
  const clock = mutableClock();
  let runtime = h2Runtime(paths, {
    clock,
    enrollmentFault: oneShotFault("after_outbox_claim_before_dispatch"),
  });
  try {
    const correlationId = "corr_h2_lease_crash";
    const enrollment = await pendingChallenge(runtime, correlationId);
    approve(runtime, enrollment, correlationId);
    await assert.rejects(
      runtime.durableEnrollment.dispatchNext(),
      /Injected failure/,
    );
    assert.equal(destinationReceipt(runtime), null);
    let outbox = runtime.database.prepare(`
      SELECT status, attempt_count FROM heartbeat_receipt_outbox
    `).get();
    assert.equal(outbox.status, "LEASED");
    assert.equal(outbox.attempt_count, 1);
    closeRuntime(runtime);

    clock.advance(31_000);
    runtime = h2Runtime(paths, { clock });
    const delivered = await runtime.durableEnrollment.dispatchNext();
    assert.equal(delivered.status, "AWAITING_HOST_BINDING");
    outbox = runtime.database.prepare(`
      SELECT status, attempt_count FROM heartbeat_receipt_outbox
    `).get();
    assert.equal(outbox.status, "DELIVERED");
    assert.equal(outbox.attempt_count, 2);
    assert.equal(runtime.receiptDestinationDatabase.prepare(`
      SELECT count(*) AS count FROM durable_context_receipts
    `).get().count, 1);
  } finally {
    closeRuntime(runtime);
    removeTemporaryRoot(paths);
  }
});

test("a delivery-commit exception followed by database reopen does not redispatch", async () => {
  const paths = temporaryPaths();
  const clock = mutableClock();
  let runtime = h2Runtime(paths, {
    clock,
    enrollmentFault: oneShotFault("after_receiver_delivery_commit_before_response"),
  });
  try {
    const correlationId = "corr_h2_receiver_ack_loss";
    const enrollment = await pendingChallenge(runtime, correlationId);
    approve(runtime, enrollment, correlationId);
    await assert.rejects(
      runtime.durableEnrollment.dispatchNext(),
      /Injected failure/,
    );
    let state = runtime.database.prepare(`
      SELECT status, attempt_count, receipt_ciphertext, purged_at
      FROM heartbeat_receipt_outbox
    `).get();
    assert.equal(state.status, "DELIVERED");
    assert.equal(state.attempt_count, 1);
    assert.equal(state.receipt_ciphertext, null);
    assert.ok(state.purged_at);
    assert.equal(runtime.receiptDestinationDatabase.prepare(`
      SELECT count(*) AS count FROM durable_context_receipts
    `).get().count, 1);
    closeRuntime(runtime);

    runtime = h2Runtime(paths, { clock });
    assert.equal(await runtime.durableEnrollment.dispatchNext(), null);
    state = runtime.database.prepare(`
      SELECT status, attempt_count FROM heartbeat_receipt_outbox
    `).get();
    assert.equal(state.status, "DELIVERED");
    assert.equal(state.attempt_count, 1);
    assert.equal(runtime.receiptDestinationDatabase.prepare(`
      SELECT count(*) AS count FROM durable_context_receipts
    `).get().count, 1);
  } finally {
    closeRuntime(runtime);
    removeTemporaryRoot(paths);
  }
});

test("a database reopened with the wrong sealing key cannot dispatch the committed receipt", async () => {
  const paths = temporaryPaths();
  const clock = mutableClock();
  let runtime = h2Runtime(paths, { clock });
  try {
    const correlationId = "corr_h2_wrong_key";
    const enrollment = await pendingChallenge(runtime, correlationId);
    approve(runtime, enrollment, correlationId);
    closeRuntime(runtime);

    runtime = h2Runtime(paths, { clock, sealingKey: Buffer.alloc(32, 0x24) });
    await assert.rejects(
      runtime.durableEnrollment.dispatchNext(),
      /authentication failed/,
    );
    const state = runtime.database.prepare(`
      SELECT o.status AS outbox_status, g.status AS grant_status,
             i.status AS inbox_status, o.last_error_code
      FROM heartbeat_receipt_outbox o
      JOIN grants g ON g.grant_id = o.grant_id
      JOIN heartbeat_inboxes i ON i.inbox_id = o.inbox_id
    `).get();
    assert.equal(state.outbox_status, "FAILED");
    assert.equal(state.grant_status, "FAILED");
    assert.equal(state.inbox_status, "REVOKED");
    assert.equal(state.last_error_code, "RECEIPT_ENVELOPE_INVALID");
    assert.equal(destinationReceipt(runtime), null);
  } finally {
    closeRuntime(runtime);
    removeTemporaryRoot(paths);
  }
});

test("a destination idempotency conflict fails closed instead of replacing a receipt", async () => {
  const paths = temporaryPaths();
  const runtime = h2Runtime(paths);
  try {
    const correlationId = "corr_h2_destination_conflict";
    const enrollment = await pendingChallenge(runtime, correlationId);
    approve(runtime, enrollment, correlationId);
    const outbox = runtime.database.prepare(`
      SELECT dispatch_id FROM heartbeat_receipt_outbox
    `).get();
    runtime.receiptDestinationDatabase.prepare(`
      INSERT INTO durable_context_receipts (
        dispatch_id, managed_context_kind, managed_context_id,
        receipt_digest, receipt_json, accepted_at
      ) VALUES (?, 'synthetic', 'wrong-context', 'wrong-digest', '{}', ?)
    `).run(outbox.dispatch_id, FIXED_NOW.toISOString());

    await assert.rejects(
      runtime.durableEnrollment.dispatchNext(),
      /different receipt or destination/,
    );
    const state = runtime.database.prepare(`
      SELECT o.status AS outbox_status, o.last_error_code,
             g.status AS grant_status, i.status AS inbox_status
      FROM heartbeat_receipt_outbox o
      JOIN grants g ON g.grant_id = o.grant_id
      JOIN heartbeat_inboxes i ON i.inbox_id = o.inbox_id
    `).get();
    assert.equal(state.outbox_status, "FAILED");
    assert.equal(state.last_error_code, "DESTINATION_CONFLICT");
    assert.equal(state.grant_status, "FAILED");
    assert.equal(state.inbox_status, "REVOKED");
    assert.equal(runtime.receiptDestinationDatabase.prepare(`
      SELECT count(*) AS count FROM durable_context_receipts
    `).get().count, 1);
  } finally {
    closeRuntime(runtime);
    removeTemporaryRoot(paths);
  }
});

test("a canonically re-sealed receipt with an extra key fails the exact receipt contract", async () => {
  const paths = temporaryPaths();
  const runtime = h2Runtime(paths);
  try {
    const correlationId = "corr_h2_extra_receipt_key";
    const enrollment = await pendingChallenge(runtime, correlationId);
    approve(runtime, enrollment, correlationId);
    const row = runtime.database.prepare(`
      SELECT o.*, g.managed_context_kind, g.managed_context_id
      FROM heartbeat_receipt_outbox o
      JOIN grants g ON g.grant_id = o.grant_id
    `).get();
    const aad = buildDurableReceiptAad({
      dispatchId: row.dispatch_id,
      grantId: row.grant_id,
      inboxId: row.inbox_id,
      contextBindingDigest: digestContextBinding(row),
    });
    const receipt = unsealReceipt(row, {
      key: H2_SEALING_KEY,
      keyId: H2_KEY_ID,
      aad,
    });
    const resealed = sealReceipt({ ...receipt, unexpected_authority: true }, {
      key: H2_SEALING_KEY,
      keyId: H2_KEY_ID,
      aad,
    });
    runtime.database.prepare(`
      UPDATE heartbeat_receipt_outbox
      SET receipt_ciphertext = ?, receipt_iv = ?, receipt_auth_tag = ?, receipt_digest = ?
      WHERE dispatch_id = ?
    `).run(
      resealed.receipt_ciphertext,
      resealed.receipt_iv,
      resealed.receipt_auth_tag,
      resealed.receipt_digest,
      row.dispatch_id,
    );
    await assert.rejects(
      runtime.durableEnrollment.dispatchNext(),
      /fields do not match the strict contract/,
    );
    assert.equal(destinationReceipt(runtime), null);
  } finally {
    closeRuntime(runtime);
    removeTemporaryRoot(paths);
  }
});

test("delivered and active enrollment status becomes expired and an expired exact binding retry is rejected", async () => {
  const deliveredPaths = temporaryPaths();
  const activePaths = temporaryPaths();
  const deliveredClock = mutableClock();
  const activeClock = mutableClock();
  const deliveredRuntime = h2Runtime(deliveredPaths, { clock: deliveredClock });
  const activeRuntime = h2Runtime(activePaths, { clock: activeClock });
  try {
    const deliveredCorrelation = "corr_h2_delivered_expiry";
    const deliveredEnrollment = await pendingChallenge(deliveredRuntime, deliveredCorrelation);
    approve(deliveredRuntime, deliveredEnrollment, deliveredCorrelation);
    await deliveredRuntime.durableEnrollment.dispatchNext();
    deliveredClock.advance(31 * 60 * 1000);
    assert.equal(
      deliveredRuntime.durableEnrollment.getStatus(
        deliveredEnrollment.challenge.challenge_id,
        deliveredCorrelation,
      ).enrollment_status,
      "EXPIRED",
    );

    const activeCorrelation = "corr_h2_active_expiry";
    const activeEnrollment = await pendingChallenge(activeRuntime, activeCorrelation);
    approve(activeRuntime, activeEnrollment, activeCorrelation);
    await activeRuntime.durableEnrollment.dispatchNext();
    const receipt = destinationReceipt(activeRuntime).receipt;
    activeRuntime.durableEnrollment.registerHostBinding({
      workflow_id: "WF-001",
      agent_binding: receipt.agent_binding,
    }, activeCorrelation);
    activeClock.advance(31 * 60 * 1000);
    assert.equal(
      activeRuntime.durableEnrollment.getStatus(
        activeEnrollment.challenge.challenge_id,
        activeCorrelation,
      ).enrollment_status,
      "EXPIRED",
    );
    assert.throws(
      () => activeRuntime.durableEnrollment.registerHostBinding({
        workflow_id: "WF-001",
        agent_binding: receipt.agent_binding,
      }, activeCorrelation),
      /Grant is expired/,
    );
  } finally {
    closeRuntime(deliveredRuntime);
    closeRuntime(activeRuntime);
    removeTemporaryRoot(deliveredPaths);
    removeTemporaryRoot(activePaths);
  }
});

test("H2 Receiver persistence, trace, and public status surfaces exclude receipt capabilities and private context", async () => {
  const paths = temporaryPaths();
  const tracePath = path.join(paths.root, "h2-trace.jsonl");
  const runtime = h2Runtime(paths, { tracePath });
  const server = createHttpServer(runtime);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const correlationId = "corr_h2_secret_evidence";
    const enrollment = await pendingChallenge(runtime, correlationId);
    const approval = approve(runtime, enrollment, correlationId);
    const persisted = runtime.database.prepare(`
      SELECT o.*, g.agent_binding, g.managed_context_kind, g.managed_context_id
      FROM heartbeat_receipt_outbox o
      JOIN grants g ON g.grant_id = o.grant_id
    `).get();
    const aad = buildDurableReceiptAad({
      dispatchId: persisted.dispatch_id,
      grantId: persisted.grant_id,
      inboxId: persisted.inbox_id,
      contextBindingDigest: digestContextBinding(persisted),
    });
    const fullReceipt = unsealReceipt(persisted, {
      key: H2_SEALING_KEY,
      keyId: H2_KEY_ID,
      aad,
    });
    const rawInboxCapability = decodeURIComponent(
      new URL(fullReceipt.receiver_inbox_url).pathname.split("/").at(-1),
    );
    const receiverBytes = [paths.receiver, `${paths.receiver}-wal`, `${paths.receiver}-shm`]
      .filter((candidate) => fs.existsSync(candidate))
      .map((candidate) => fs.readFileSync(candidate));
    for (const forbidden of [
      Buffer.from(rawInboxCapability),
      H2_SEALING_KEY,
      Buffer.from(H2_SEALING_KEY.toString("base64")),
      Buffer.from(H2_SEALING_KEY.toString("base64url")),
      Buffer.from(H2_SEALING_KEY.toString("hex")),
      Buffer.from(canonicalJson(fullReceipt)),
    ]) {
      assert.equal(receiverBytes.some((contents) => contents.includes(forbidden)), false);
    }

    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const consentStatus = await fetch(
      `${baseUrl}/api/receiver/consent/${enrollment.challenge.challenge_id}/status`,
      { headers: { "X-Correlation-Id": correlationId } },
    ).then((response) => response.text());
    assert.equal(consentStatus.includes(persisted.agent_binding), false);
    assert.equal(consentStatus.includes(persisted.managed_context_id), false);
    assert.equal(consentStatus.includes(rawInboxCapability), false);
    assert.equal(consentStatus.includes(H2_SEALING_KEY.toString("base64url")), false);

    await runtime.durableEnrollment.dispatchNext();
    runtime.durableEnrollment.registerHostBinding({
      workflow_id: "WF-001",
      agent_binding: fullReceipt.agent_binding,
    }, correlationId);
    const workflowStatus = await fetch(`${baseUrl}/api/workflows/WF-001`, {
      headers: { "X-Correlation-Id": correlationId },
    }).then((response) => response.text());
    const traceText = fs.readFileSync(tracePath, "utf8");
    for (const forbidden of [
      persisted.agent_binding,
      persisted.managed_context_id,
      rawInboxCapability,
      canonicalJson(fullReceipt),
      H2_SEALING_KEY.toString("base64url"),
    ]) {
      assert.equal(workflowStatus.includes(forbidden), false);
      assert.equal(traceText.includes(forbidden), false, `trace exposed ${forbidden}`);
    }
    assert.equal(JSON.parse(workflowStatus).host_binding.registered, true);
    assert.equal(approval.secrets_exposed, false);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    closeRuntime(runtime);
    removeTemporaryRoot(paths);
  }
});

test("an exact Host binding retry remains idempotent after workflow advance while a new binding is stage-gated", async () => {
  const paths = temporaryPaths();
  const runtime = h2Runtime(paths);
  try {
    const correlationId = "corr_h2_binding_after_advance";
    const enrollment = await pendingChallenge(runtime, correlationId);
    approve(runtime, enrollment, correlationId);
    await runtime.durableEnrollment.dispatchNext();
    const receipt = destinationReceipt(runtime).receipt;
    const first = runtime.durableEnrollment.registerHostBinding({
      workflow_id: "WF-001",
      agent_binding: receipt.agent_binding,
    }, correlationId);
    assert.equal(first.duplicate, false);

    runtime.domain.prepareArtifact({
      content: "H2 stage-A artifact",
      expected_revision: 0,
    }, correlationId);
    runtime.domain.transitionToReady(correlationId);

    const duplicate = runtime.durableEnrollment.registerHostBinding({
      workflow_id: "WF-001",
      agent_binding: receipt.agent_binding,
    }, correlationId);
    assert.equal(duplicate.duplicate, true);
    assert.equal(duplicate.enrollment_status, "ACTIVE");
    assert.throws(
      () => runtime.durableEnrollment.registerHostBinding({
        workflow_id: "WF-001",
        agent_binding: `${receipt.agent_binding}_different`,
      }, correlationId),
      /only valid in INITIAL/,
    );
  } finally {
    closeRuntime(runtime);
    removeTemporaryRoot(paths);
  }
});

test("H2 refuses shared, in-memory, or non-isolated runtime databases", () => {
  const paths = temporaryPaths();
  try {
    assert.throws(() => createRuntime({
      databasePath: paths.receiver,
      durableDestinationPath: paths.receiver,
      tracePath: null,
      origin: H2_ORIGIN,
      deliveryMode: "heartbeat",
      deliveryTicketSecret: H2_DELIVERY_SECRET,
      effectReceiptSecret: H2_EFFECT_SECRET,
      durableEnrollmentEnabled: true,
      receiptSealingKey: H2_SEALING_KEY,
      receiptKeyId: H2_KEY_ID,
      allowH2TestPaths: true,
    }), /distinct filesystem/);
    assert.throws(() => createRuntime({
      databasePath: ":memory:",
      durableDestinationPath: paths.destination,
      tracePath: null,
      origin: H2_ORIGIN,
      deliveryMode: "heartbeat",
      deliveryTicketSecret: H2_DELIVERY_SECRET,
      effectReceiptSecret: H2_EFFECT_SECRET,
      durableEnrollmentEnabled: true,
      receiptSealingKey: H2_SEALING_KEY,
      receiptKeyId: H2_KEY_ID,
      allowH2TestPaths: true,
    }), /distinct filesystem/);
    assert.throws(() => createRuntime({
      databasePath: paths.receiver,
      durableDestinationPath: paths.destination,
      tracePath: null,
      origin: H2_ORIGIN,
      deliveryMode: "heartbeat",
      deliveryTicketSecret: H2_DELIVERY_SECRET,
      effectReceiptSecret: H2_EFFECT_SECRET,
      durableEnrollmentEnabled: true,
      receiptSealingKey: null,
      receiptKeyId: H2_KEY_ID,
      allowH2TestPaths: true,
    }), /requires an injected receipt sealing key/);
  } finally {
    removeTemporaryRoot(paths);
  }
});
