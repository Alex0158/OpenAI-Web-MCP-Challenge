import test from "node:test";
import assert from "node:assert/strict";
import {
  acceptAtGateway,
  attachGrant,
  createInitialState,
  getReentryManifest,
  requestClarificationTransition,
  signEvent,
  submitBid,
  updateClarificationDraft,
} from "../lib/core.mjs";

const origin = "http://127.0.0.1:43118";
const secret = "test-secret";

function waitingState() {
  const state = createInitialState();
  attachGrant(state);
  submitBid(state, { approved: true });
  return state;
}

test("manifest exposes only the scoped clarification event", () => {
  const state = createInitialState();
  const manifest = getReentryManifest(state, origin);
  assert.equal(manifest.reentryPoints.length, 1);
  assert.equal(manifest.reentryPoints[0].eventType, "clarification.requested");
  assert.deepEqual(manifest.reentryPoints[0].actionsRequiringHumanApproval, [
    "submit_approved_clarification",
  ]);
});

test("initial submission fails without exact human approval", () => {
  const state = createInitialState();
  attachGrant(state);
  assert.throws(() => submitBid(state, { approved: false }), /human approval/i);
  assert.equal(state.status, "DRAFT");
});

test("signed clarification event passes the gateway once and replay is harmless", () => {
  const state = waitingState();
  const unsigned = requestClarificationTransition(state, {
    origin,
    feedback: "Please confirm the proposed payment terms and supporting evidence.",
  });
  const event = signEvent(unsigned, secret);
  const first = acceptAtGateway(state, event, secret);
  const replay = acceptAtGateway(state, event, secret);

  assert.equal(first.accepted, true);
  assert.equal(first.duplicate, false);
  assert.equal(replay.accepted, true);
  assert.equal(replay.duplicate, true);
  assert.equal(state.events.length, 1);
  assert.equal(state.status, "CHANGES_REQUESTED");
});

test("tampering with a signed event is rejected", () => {
  const state = waitingState();
  const unsigned = requestClarificationTransition(state, {
    origin,
    feedback: "Please confirm the proposed payment terms and supporting evidence.",
  });
  const event = signEvent(unsigned, secret);
  event.eventType = "award.decision_ready";
  assert.throws(() => acceptAtGateway(state, event, secret), /signature/i);
});

test("re-entry can update a draft but no submit primitive exists in the core spike", () => {
  const state = waitingState();
  const event = signEvent(
    requestClarificationTransition(state, {
      origin,
      feedback: "Please confirm the proposed payment terms and supporting evidence.",
    }),
    secret,
  );
  acceptAtGateway(state, event, secret);
  const clarification = updateClarificationDraft(
    state,
    "We confirm Net-30 terms and will provide the incident response evidence for human review.",
  );
  assert.match(clarification.responseDraft, /Net-30/);
  assert.equal(state.status, "CHANGES_REQUESTED");
});

