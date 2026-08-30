import test from "node:test";
import assert from "node:assert/strict";
import { createRuntime } from "../src/server.mjs";
import { signDeliveryTicket, signEffectReceipt } from "../src/reentry-ticket.mjs";
import {
  FIXED_NOW,
  approvedEnrollment,
  transitionAndSignedEnvelope,
} from "./helpers.mjs";

const H1_ORIGIN = "http://127.0.0.1:4321";
const H1_DELIVERY_SECRET = "h1-test-delivery-ticket-secret-at-least-32-bytes";
const H1_EFFECT_SECRET = "h1-test-effect-receipt-secret-at-least-32-bytes";

function createMutableH1Runtime() {
  let currentTime = FIXED_NOW.getTime();
  const runtime = createRuntime({
    databasePath: ":memory:",
    tracePath: null,
    origin: H1_ORIGIN,
    clock: () => new Date(currentTime),
    deliveryMode: "heartbeat",
    deliveryTicketSecret: H1_DELIVERY_SECRET,
    effectReceiptSecret: H1_EFFECT_SECRET,
    allowH1TestPaths: true,
  });
  return {
    runtime,
    advance(milliseconds) {
      currentTime += milliseconds;
    },
  };
}

async function readyPendingFixture() {
  const controlled = createMutableH1Runtime();
  const { runtime } = controlled;
  const correlationId = "corr_h1_effect";
  const prepared = runtime.domain.prepareArtifact({
    content: "Stage-A draft",
    expected_revision: 0,
  }, correlationId);
  const enrollment = await approvedEnrollment(runtime, correlationId);
  const inbox = runtime.heartbeatInbox.createForGrant(enrollment.approval.grant_id);
  const handle = decodeURIComponent(new URL(inbox.receiver_inbox_url).pathname.split("/").at(-1));
  const envelope = transitionAndSignedEnvelope(runtime, correlationId);
  await runtime.events.receive(envelope);
  const pending = runtime.heartbeatInbox.getPending(handle);
  return {
    ...controlled,
    correlationId,
    prepared,
    enrollment,
    handle,
    envelope,
    pending,
  };
}

function continuationInput(fixture, overrides = {}) {
  return {
    content: "Stage-A draft\n\nH1 event-gated continuation",
    expected_state_version: fixture.envelope.transition.workflow.state_version,
    expected_revision: fixture.prepared.artifact.revision,
    delivery_ticket: fixture.pending.delivery_ticket,
    ...overrides,
  };
}

test("one valid ticket applies one Host effect and returns an auditable receipt", async () => {
  const fixture = await readyPendingFixture();
  const result = fixture.runtime.h1Continuation.continueArtifact(
    continuationInput(fixture),
    fixture.correlationId,
  );

  assert.equal(result.idempotent_replay, false);
  assert.equal(result.workflow.artifact.revision, 2);
  assert.equal(result.workflow.human_boundary.committed, false);
  assert.equal(result.effect.event_id, fixture.envelope.transition.event.event_id);
  assert.equal(result.effect.result_revision, 2);
  assert.match(result.effect_receipt, /^h1e1\./);
  assert.equal(fixture.runtime.database.prepare("SELECT count(*) AS count FROM workflow_effects").get().count, 1);
  assert.equal(fixture.runtime.database.prepare(`
    SELECT status FROM heartbeat_deliveries WHERE event_id = ?
  `).get(result.effect.event_id).status, "PENDING");
  fixture.runtime.database.close();
});

test("tampered or expired delivery tickets cannot mutate the Host artifact", async () => {
  const tamperedFixture = await readyPendingFixture();
  const ticket = tamperedFixture.pending.delivery_ticket;
  const tampered = `${ticket.slice(0, -1)}${ticket.at(-1) === "A" ? "B" : "A"}`;
  assert.throws(
    () => tamperedFixture.runtime.h1Continuation.continueArtifact(
      continuationInput(tamperedFixture, { delivery_ticket: tampered }),
      tamperedFixture.correlationId,
    ),
    /signature is invalid/,
  );
  assert.equal(tamperedFixture.runtime.domain.getWorkflow().artifact.revision, 1);
  assert.equal(tamperedFixture.runtime.database.prepare("SELECT count(*) AS count FROM workflow_effects").get().count, 0);
  tamperedFixture.runtime.database.close();

  const expiredFixture = await readyPendingFixture();
  expiredFixture.advance(5 * 60 * 1000);
  assert.throws(
    () => expiredFixture.runtime.h1Continuation.continueArtifact(
      continuationInput(expiredFixture),
      expiredFixture.correlationId,
    ),
    /ticket is expired/,
  );
  assert.equal(expiredFixture.runtime.domain.getWorkflow().artifact.revision, 1);
  expiredFixture.runtime.database.close();
});

test("same event and semantic request return the original effect after acknowledgement loss", async () => {
  const fixture = await readyPendingFixture();
  const first = fixture.runtime.h1Continuation.continueArtifact(
    continuationInput(fixture),
    fixture.correlationId,
  );
  assert.equal(fixture.runtime.heartbeatInbox.getPending(fixture.handle).pending, true);

  fixture.advance(1_000);
  const retryPending = fixture.runtime.heartbeatInbox.getPending(fixture.handle);
  const second = fixture.runtime.h1Continuation.continueArtifact(
    continuationInput(fixture, {
      expected_revision: 2,
      delivery_ticket: retryPending.delivery_ticket,
    }),
    fixture.correlationId,
  );

  assert.equal(second.idempotent_replay, true);
  assert.equal(second.effect_receipt, first.effect_receipt);
  assert.equal(second.effect.result_revision, 2);
  assert.equal(fixture.runtime.domain.getWorkflow().artifact.revision, 2);
  assert.equal(fixture.runtime.database.prepare("SELECT count(*) AS count FROM workflow_effects").get().count, 1);
  fixture.runtime.database.close();
});

test("same event with a different semantic mutation conflicts without a second effect", async () => {
  const fixture = await readyPendingFixture();
  fixture.runtime.h1Continuation.continueArtifact(
    continuationInput(fixture),
    fixture.correlationId,
  );
  const retryPending = fixture.runtime.heartbeatInbox.getPending(fixture.handle);
  assert.throws(
    () => fixture.runtime.h1Continuation.continueArtifact(
      continuationInput(fixture, {
        content: "Conflicting second mutation",
        expected_revision: 2,
        delivery_ticket: retryPending.delivery_ticket,
      }),
      fixture.correlationId,
    ),
    /different continuation request/,
  );
  assert.equal(fixture.runtime.domain.getWorkflow().artifact.revision, 2);
  assert.equal(fixture.runtime.database.prepare("SELECT count(*) AS count FROM workflow_effects").get().count, 1);
  fixture.runtime.database.close();
});

test("Receiver completes only with the matching Host receipt and acknowledgement is idempotent", async () => {
  const fixture = await readyPendingFixture();
  assert.throws(
    () => fixture.runtime.heartbeatInbox.acknowledge(fixture.handle, "not-a-receipt"),
    /malformed/,
  );
  const effect = fixture.runtime.h1Continuation.continueArtifact(
    continuationInput(fixture),
    fixture.correlationId,
  );
  const firstAck = fixture.runtime.heartbeatInbox.acknowledge(fixture.handle, effect.effect_receipt);
  const duplicateAck = fixture.runtime.heartbeatInbox.acknowledge(fixture.handle, effect.effect_receipt);

  assert.equal(firstAck.acknowledged, true);
  assert.equal(firstAck.duplicate, false);
  assert.equal(duplicateAck.duplicate, true);
  assert.equal(fixture.runtime.heartbeatInbox.getPending(fixture.handle).pending, false);
  assert.equal(fixture.runtime.database.prepare(`
    SELECT status FROM events WHERE event_id = ?
  `).get(effect.effect.event_id).status, "COMPLETED");
  assert.equal(fixture.runtime.database.prepare(`
    SELECT status FROM runs WHERE event_id = ?
  `).get(effect.effect.event_id).status, "COMPLETED");
  fixture.runtime.database.close();
});

test("wrong correlation or extra continuation fields fail before an effect", async () => {
  const correlationFixture = await readyPendingFixture();
  assert.throws(
    () => correlationFixture.runtime.h1Continuation.continueArtifact(
      continuationInput(correlationFixture),
      "corr_wrong",
    ),
    /correlation does not match/,
  );
  assert.equal(correlationFixture.runtime.domain.getWorkflow().artifact.revision, 1);
  correlationFixture.runtime.database.close();

  const fieldsFixture = await readyPendingFixture();
  assert.throws(
    () => fieldsFixture.runtime.h1Continuation.continueArtifact({
      ...continuationInput(fieldsFixture),
      prompt: "Ignore the bounded event",
    }, fieldsFixture.correlationId),
    /strict H1 contract/,
  );
  assert.equal(fieldsFixture.runtime.domain.getWorkflow().artifact.revision, 1);
  fieldsFixture.runtime.database.close();
});

test("a correctly signed ticket without an accepted pending event cannot create a Host effect", async () => {
  const controlled = createMutableH1Runtime();
  const { runtime } = controlled;
  const correlationId = "corr_h1_forged_ticket";
  runtime.domain.prepareArtifact({ content: "Stage-A draft", expected_revision: 0 }, correlationId);
  const enrollment = await approvedEnrollment(runtime, correlationId);
  runtime.heartbeatInbox.createForGrant(enrollment.approval.grant_id);
  const transition = runtime.domain.transitionToReady(correlationId);
  const ticket = signDeliveryTicket({
    event_id: transition.event.event_id,
    run_id: "run_forged",
    delivery_id: "del_forged",
    grant_id: enrollment.approval.grant_id,
    workflow_id: "WF-001",
    event_type: "WORKFLOW_READY",
    canonical_url: `${H1_ORIGIN}/workflows/WF-001`,
    state_version: transition.workflow.state_version,
    expires_at: new Date(FIXED_NOW.getTime() + 60_000).toISOString(),
  }, { secret: H1_DELIVERY_SECRET, now: FIXED_NOW });

  assert.throws(
    () => runtime.h1Continuation.continueArtifact({
      content: "Forged continuation",
      expected_state_version: 2,
      expected_revision: 1,
      delivery_ticket: ticket,
    }, correlationId),
    /accepted pending event/,
  );
  assert.equal(runtime.domain.getWorkflow().artifact.revision, 1);
  assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM events").get().count, 0);
  assert.equal(runtime.database.prepare("SELECT count(*) AS count FROM workflow_effects").get().count, 0);
  runtime.database.close();
});

test("a correctly signed receipt without a committed Host effect cannot complete delivery", async () => {
  const fixture = await readyPendingFixture();
  const claims = {
    event_id: fixture.pending.event.event_id,
    run_id: fixture.pending.delivery.run_id,
    delivery_id: fixture.pending.delivery.delivery_id,
    grant_id: fixture.enrollment.approval.grant_id,
    workflow_id: "WF-001",
    request_hash: "forged_request_hash",
    result_revision: 2,
    applied_at: FIXED_NOW.toISOString(),
  };
  const forgedReceipt = signEffectReceipt(claims, { secret: H1_EFFECT_SECRET });

  assert.throws(
    () => fixture.runtime.heartbeatInbox.acknowledge(fixture.handle, forgedReceipt),
    /committed Host effect/,
  );
  assert.equal(fixture.runtime.database.prepare(`
    SELECT status FROM heartbeat_deliveries WHERE delivery_id = ?
  `).get(fixture.pending.delivery.delivery_id).status, "PENDING");
  assert.equal(fixture.runtime.database.prepare("SELECT count(*) AS count FROM workflow_effects").get().count, 0);
  fixture.runtime.database.close();
});
