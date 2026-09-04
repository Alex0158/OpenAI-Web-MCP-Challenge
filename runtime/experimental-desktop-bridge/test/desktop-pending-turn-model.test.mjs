import test from "node:test";
import assert from "node:assert/strict";

// Source-derived diagnostic model, NOT imported Desktop code or a product Adapter.
// CLOUD-028 pins the inspected build, member hash, source anchors and live evidence.
// These tests demonstrate a possible state transition. They do not observe or repair
// the renderer cache, establish client admission, or send a notification.

function appendPendingStart(turns, requestId) {
  const pending = { turnId: null, requestId, status: "inProgress" };
  turns.push(pending);
  return pending;
}

function acceptStartResponse(turns, requestId, response) {
  // Xln selects an existing matching turn before the pending request placeholder.
  const selected = turns.findLast((turn) => turn.turnId === response.id)
    ?? turns.findLast((turn) => turn.turnId === null
      && turn.requestId === requestId && turn.status === "inProgress");
  if (selected) {
    selected.turnId = response.id;
    if (selected.status === "inProgress") selected.status = response.status;
  }
  return selected;
}

function completeTurn(turns, turnId) {
  // Completion selects the named turn; it does not settle an unrelated null-ID tail.
  const selected = turns.findLast((turn) => turn.turnId === turnId);
  assert.ok(selected);
  selected.status = "completed";
}

function nextSubmission(turns) {
  // Narrow coordinator model: no unconfirmed submissions, remote host, or follower.
  const latest = turns.at(-1);
  if (latest?.status !== "inProgress") return "start";
  return latest.turnId === null ? "wait-for-turn-id" : "steer-existing-turn";
}

function usesWarmState({ streamRole, resumeState, isStreaming }) {
  return streamRole !== null && (resumeState !== "needs_resume" || isStreaming);
}

function mergeNamedSnapshot(existing, snapshot) {
  // xS retains nonempty/in-progress null-ID entries rather than proving them stale.
  const byId = new Map(snapshot.map((turn) => [turn.turnId, turn]));
  const retained = existing.map((turn) => turn.turnId === null
    ? turn : { ...turn, ...byId.get(turn.turnId) });
  const knownIds = new Set(existing.map((turn) => turn.turnId));
  return retained.concat(snapshot.filter((turn) => !knownIds.has(turn.turnId)));
}

function overlappingStart() {
  const turns = [{ turnId: "fixture-existing-turn", status: "inProgress" }];
  const pending = appendPendingStart(turns, "fixture-overlapping-request");
  acceptStartResponse(turns, "fixture-overlapping-request", {
    id: "fixture-existing-turn", status: "inProgress",
  });
  completeTurn(turns, "fixture-existing-turn");
  return { turns, pending };
}

test("model: clean completed history selects a new turn", () => {
  assert.equal(nextSubmission([{ turnId: "fixture-old-turn", status: "completed" }]), "start");
});

test("model: a new-turn response settles the matching optimistic start", () => {
  const turns = [{ turnId: "fixture-old-turn", status: "completed" }];
  const pending = appendPendingStart(turns, "fixture-request");
  assert.equal(acceptStartResponse(turns, "fixture-request", {
    id: "fixture-new-turn", status: "inProgress",
  }), pending);
  assert.equal(nextSubmission(turns), "steer-existing-turn");
  completeTurn(turns, "fixture-new-turn");
  assert.equal(nextSubmission(turns), "start");
});

test("model: an actual active turn has a usable ID without a pending wait", () => {
  const turns = [{ turnId: "fixture-active-turn", status: "inProgress" }];
  assert.equal(nextSubmission(turns), "steer-existing-turn");
});

test("model: response joining an existing turn leaves the separate start pending", () => {
  const { turns, pending } = overlappingStart();
  assert.equal(turns.length, 2);
  assert.equal(turns[0].status, "completed");
  assert.equal(turns.at(-1), pending);
  assert.equal(pending.turnId, null);
  assert.equal(pending.status, "inProgress");
  assert.equal(nextSubmission(turns), "wait-for-turn-id");
});

test("model: warm ownership can retain the pending state without a fresh snapshot", () => {
  const { turns } = overlappingStart();
  assert.equal(usesWarmState({
    streamRole: "owner", resumeState: "resumed", isStreaming: true,
  }), true);
  assert.equal(nextSubmission(turns), "wait-for-turn-id");
  assert.equal(usesWarmState({
    streamRole: null, resumeState: "needs_resume", isStreaming: false,
  }), false);
});

test("model: a completed server snapshot does not settle a retained null-ID start", () => {
  const { turns } = overlappingStart();
  const snapshot = [{ turnId: "fixture-existing-turn", status: "completed" }];
  const merged = mergeNamedSnapshot(turns, snapshot);
  assert.equal(merged.length, 2);
  assert.equal(nextSubmission(merged), "wait-for-turn-id");
  // A clean history differs from merging into an existing local pending start.
  assert.equal(nextSubmission(mergeNamedSnapshot([], snapshot)), "start");
});
