import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildGathererDispatchChoices,
  createGathererDispatchReconciliationGate,
  createPageMutationGate,
  resolveGathererDispatchSelection,
  type GathererDispatchAcknowledgement,
} from "../src/client/gatherer-dispatch";
import type { ClientSnapshot } from "../src/server/world-projection";

const SCOPE_A = "SK-MVP-0.2\u0000sleepless-mvp-01\u0000player-a\u0000shelter-a";
const SCOPE_B = "SK-MVP-0.2\u0000sleepless-mvp-01\u0000player-b\u0000shelter-b";

function projectionRows(options: {
  soldierRevision?: number;
  missionRevision?: number;
  missionId?: string | null;
  missionAttemptId?: string | null;
  attemptRevision?: number | null;
  nextAction?: "DISPATCH" | "MONITOR";
  phase?: "AT_SHELTER" | "TRAVELLING";
  targetId?: "node-wood-a" | "node-rock-a";
  tool?: "AXE" | "PICKAXE";
} = {}): Pick<ClientSnapshot, "soldiers" | "missions" | "resourceNodes"> {
  const missionId = options.missionId === undefined ? null : options.missionId;
  const missionAttemptId = options.missionAttemptId === undefined ? null : options.missionAttemptId;
  const phase = options.phase ?? "AT_SHELTER";
  return {
    soldiers: [{
      soldierId: "soldier-a-01",
      shelterId: "shelter-a",
      state: phase === "AT_SHELTER" ? "AT_SHELTER" : "FIELD",
      role: phase === "AT_SHELTER" ? null : "GATHERER",
      tool: phase === "AT_SHELTER" ? null : (options.tool ?? "AXE"),
      position: { x: 16, y: 64 },
      missionId,
      phase,
      cargoCapacityUsed: 0,
      revision: options.soldierRevision ?? 0,
    }],
    missions: [{
      missionId,
      soldierId: "soldier-a-01",
      soldierState: phase === "AT_SHELTER" ? "AT_SHELTER" : "FIELD",
      missionState: phase === "AT_SHELTER" ? (missionId === null ? null : "COMPLETED") : "ACTIVE",
      missionAttemptId,
      attemptRevision: options.attemptRevision === undefined ? null : options.attemptRevision,
      phase,
      role: phase === "AT_SHELTER" ? null : "GATHERER",
      tool: phase === "AT_SHELTER" ? null : (options.tool ?? "AXE"),
      equipmentTier: phase === "AT_SHELTER" ? null : 1,
      targetId: phase === "AT_SHELTER" ? null : (options.targetId ?? "node-wood-a"),
      returnPolicy: phase === "AT_SHELTER" ? null : "WHEN_FULL",
      route: null,
      position: { x: 16, y: 64 },
      nextDueWorldTime: null,
      cargo: { quantity: 0, capacityUsed: 0, capacity: 5, resourceTypes: [] },
      encounter: null,
      reissue: { budget: 1, dangerCell: null, waitingReviewReason: null },
      nextAction: options.nextAction ?? "DISPATCH",
      revision: options.missionRevision ?? 0,
    }],
    resourceNodes: [
      {
        resourceNodeId: "node-wood-a",
        resourceType: "wood",
        position: { x: 30, y: 64 },
        availability: "AVAILABLE",
        observedWorldTime: 0,
        revision: 0,
      },
      {
        resourceNodeId: "node-rock-a",
        resourceType: "rock",
        position: { x: 16, y: 82 },
        availability: "DEPLETED",
        observedWorldTime: 0,
        revision: 1,
      },
    ],
  };
}

function acknowledgement(options: Partial<GathererDispatchAcknowledgement> = {}): GathererDispatchAcknowledgement {
  return {
    soldierId: "soldier-a-01",
    missionId: "mission-stable-a-01",
    missionAttemptId: "mission-attempt-a-01",
    eventId: "mission-dispatched-a-01",
    committedRevisions: { soldier: 4, mission: 5, missionAttempt: 0 },
    ...options,
  };
}

test("dispatch choices use the top-level soldier revision after a completed mission", () => {
  const snapshot = projectionRows({
    soldierRevision: 7,
    missionRevision: 12,
    missionId: "mission-stable-a-01",
    missionAttemptId: "mission-attempt-old",
    attemptRevision: 4,
  });
  const choices = buildGathererDispatchChoices(snapshot);

  assert.equal(choices.soldiers[0]?.disabled, false);
  assert.equal(choices.soldiers[0]?.expectedRevision, 7);
  assert.equal(choices.soldiers[0]?.expectedRevision === snapshot.missions[0]?.revision, false);
  const wood = choices.targets.find((choice) => choice.targetId === "node-wood-a");
  const rock = choices.targets.find((choice) => choice.targetId === "node-rock-a");
  assert.equal(wood?.tool, "AXE");
  assert.equal(wood?.disabled, false);
  assert.equal(rock?.tool, "PICKAXE");
  assert.equal(rock?.disabled, true);
  assert.match(rock?.label ?? "", /depleted/i);

  assert.deepEqual(resolveGathererDispatchSelection(snapshot, "soldier-a-01", "node-wood-a"), {
    soldierId: "soldier-a-01",
    targetId: "node-wood-a",
    tool: "AXE",
    expectedSoldierRevision: 7,
  });
  assert.equal(resolveGathererDispatchSelection(snapshot, "soldier-a-01", "node-rock-a"), null);
});

test("the page mutation gate excludes movement and dispatch in both directions", () => {
  const gate = createPageMutationGate();
  gate.setScope(SCOPE_A);

  const movement = gate.begin("movement");
  assert.ok(movement);
  assert.equal(gate.begin("dispatch"), null);
  assert.equal(gate.release({ ...movement, token: movement.token + 1 }), false);
  assert.equal(gate.release(movement), true);

  const dispatch = gate.begin("dispatch");
  assert.ok(dispatch);
  assert.equal(gate.begin("movement"), null);
  gate.setScope(SCOPE_A);
  assert.equal(gate.pendingKind, "dispatch");
  gate.setScope(SCOPE_B);
  assert.equal(gate.pending, false);
  assert.equal(gate.release(dispatch), false);
});

test("an acknowledged dispatch settles only from a matching authoritative revision vector", () => {
  const gate = createGathererDispatchReconciliationGate();
  gate.setScope(SCOPE_A);
  const attempt = gate.begin({ soldierId: "soldier-a-01", targetId: "node-wood-a", tool: "AXE", expectedSoldierRevision: 3 });
  assert.ok(attempt);
  const before = projectionRows({ soldierRevision: 3 });
  const preserved = structuredClone(before);

  assert.equal(gate.acceptSnapshot(SCOPE_A, before).kind, "awaiting_command");
  assert.equal(gate.acknowledge(attempt, acknowledgement()).kind, "request_resync");
  assert.deepEqual(before, preserved, "the command gate must not create an optimistic projection");

  const wrongIdentity = projectionRows({
    soldierRevision: 4,
    missionRevision: 5,
    missionId: "mission-stable-a-01",
    missionAttemptId: "mission-attempt-a-01",
    attemptRevision: 0,
    nextAction: "MONITOR",
    phase: "TRAVELLING",
    targetId: "node-rock-a",
    tool: "PICKAXE",
  });
  assert.equal(gate.acceptSnapshot(SCOPE_A, wrongIdentity).kind, "request_follow_up_resync");
  assert.equal(gate.acceptSnapshot(SCOPE_A, wrongIdentity).kind, "stale");
  assert.equal(gate.pending, true);

  const matching = projectionRows({
    soldierRevision: 4,
    missionRevision: 5,
    missionId: "mission-stable-a-01",
    missionAttemptId: "mission-attempt-a-01",
    attemptRevision: 0,
    nextAction: "MONITOR",
    phase: "TRAVELLING",
  });
  assert.equal(gate.acceptSnapshot(SCOPE_A, matching).kind, "reconciled");
  assert.equal(gate.pending, false);
});

test("each incomplete revision or wrong mission identity remains bounded to one follow-up", () => {
  const cases: Array<{
    readonly name: string;
    readonly acknowledgement?: GathererDispatchAcknowledgement;
    readonly snapshot: Pick<ClientSnapshot, "soldiers" | "missions" | "resourceNodes">;
  }> = [
    {
      name: "low soldier revision",
      snapshot: projectionRows({
        soldierRevision: 3,
        missionRevision: 5,
        missionId: "mission-stable-a-01",
        missionAttemptId: "mission-attempt-a-01",
        attemptRevision: 0,
        nextAction: "MONITOR",
        phase: "TRAVELLING",
      }),
    },
    {
      name: "low mission revision",
      snapshot: projectionRows({
        soldierRevision: 4,
        missionRevision: 4,
        missionId: "mission-stable-a-01",
        missionAttemptId: "mission-attempt-a-01",
        attemptRevision: 0,
        nextAction: "MONITOR",
        phase: "TRAVELLING",
      }),
    },
    {
      name: "low attempt revision",
      acknowledgement: acknowledgement({
        committedRevisions: { soldier: 4, mission: 5, missionAttempt: 2 },
      }),
      snapshot: projectionRows({
        soldierRevision: 4,
        missionRevision: 5,
        missionId: "mission-stable-a-01",
        missionAttemptId: "mission-attempt-a-01",
        attemptRevision: 1,
        nextAction: "MONITOR",
        phase: "TRAVELLING",
      }),
    },
    {
      name: "wrong mission id",
      snapshot: projectionRows({
        soldierRevision: 4,
        missionRevision: 5,
        missionId: "mission-wrong",
        missionAttemptId: "mission-attempt-a-01",
        attemptRevision: 0,
        nextAction: "MONITOR",
        phase: "TRAVELLING",
      }),
    },
    {
      name: "wrong attempt id",
      snapshot: projectionRows({
        soldierRevision: 4,
        missionRevision: 5,
        missionId: "mission-stable-a-01",
        missionAttemptId: "mission-attempt-wrong",
        attemptRevision: 0,
        nextAction: "MONITOR",
        phase: "TRAVELLING",
      }),
    },
  ];

  for (const candidate of cases) {
    const gate = createGathererDispatchReconciliationGate();
    gate.setScope(SCOPE_A);
    const attempt = gate.begin({
      soldierId: "soldier-a-01",
      targetId: "node-wood-a",
      tool: "AXE",
      expectedSoldierRevision: 3,
    });
    assert.ok(attempt, candidate.name);
    assert.equal(gate.acknowledge(attempt, candidate.acknowledgement ?? acknowledgement()).kind, "request_resync", candidate.name);
    assert.equal(gate.acceptSnapshot(SCOPE_A, candidate.snapshot).kind, "request_follow_up_resync", candidate.name);
    assert.equal(gate.acceptSnapshot(SCOPE_A, candidate.snapshot).kind, "stale", candidate.name);
    assert.equal(gate.pending, true, candidate.name);
  }
});

test("a replayed acknowledgement may settle against a newer attempt in the stable mission lineage", () => {
  const gate = createGathererDispatchReconciliationGate();
  gate.setScope(SCOPE_A);
  const attempt = gate.begin({ soldierId: "soldier-a-01", targetId: "node-wood-a", tool: "AXE", expectedSoldierRevision: 3 });
  assert.ok(attempt);
  assert.equal(gate.acknowledge(attempt, acknowledgement()).kind, "request_resync");

  const superseded = projectionRows({
    soldierRevision: 8,
    missionRevision: 9,
    missionId: "mission-stable-a-01",
    missionAttemptId: "mission-attempt-new",
    attemptRevision: 1,
    nextAction: "MONITOR",
    phase: "TRAVELLING",
  });
  assert.equal(gate.acceptSnapshot(SCOPE_A, superseded).kind, "reconciled_advanced");

  const completedGate = createGathererDispatchReconciliationGate();
  completedGate.setScope(SCOPE_A);
  const delayed = completedGate.begin({
    soldierId: "soldier-a-01",
    targetId: "node-wood-a",
    tool: "AXE",
    expectedSoldierRevision: 3,
  });
  assert.ok(delayed);
  assert.equal(completedGate.acknowledge(delayed, acknowledgement()).kind, "request_resync");
  const completed = projectionRows({
    soldierRevision: 8,
    missionRevision: 9,
    missionId: "mission-stable-a-01",
    missionAttemptId: "mission-attempt-a-01",
    attemptRevision: 4,
  });
  assert.equal(completedGate.acceptSnapshot(SCOPE_A, completed).kind, "reconciled_advanced");
});

test("unknown readback is bounded and reconnect preserves only the same scope", () => {
  const gate = createGathererDispatchReconciliationGate();
  gate.setScope(SCOPE_A);
  const unknown = gate.begin({ soldierId: "soldier-a-01", targetId: "node-wood-a", tool: "AXE", expectedSoldierRevision: 0 });
  assert.ok(unknown);
  assert.equal(gate.markUnknown(unknown).kind, "request_resync");
  gate.setScope(SCOPE_A);
  assert.equal(gate.pending, true);
  assert.equal(gate.acceptSnapshot(SCOPE_A, projectionRows()).kind, "reconciled_unknown");
  assert.equal(gate.pending, false);

  const staleScope = gate.begin({ soldierId: "soldier-a-01", targetId: "node-wood-a", tool: "AXE", expectedSoldierRevision: 0 });
  assert.ok(staleScope);
  gate.setScope(SCOPE_B);
  assert.equal(gate.pending, false);
  assert.equal(gate.acknowledge(staleScope, acknowledgement({ committedRevisions: { soldier: 1, mission: 0, missionAttempt: 0 } })).kind, "ignored");
  assert.equal(gate.acceptSnapshot(SCOPE_A, projectionRows()).kind, "ignored");
});

test("a same-scope late callback cannot settle a superseding attempt", () => {
  const gate = createGathererDispatchReconciliationGate();
  gate.setScope(SCOPE_A);
  const first = gate.begin({
    soldierId: "soldier-a-01",
    targetId: "node-wood-a",
    tool: "AXE",
    expectedSoldierRevision: 0,
  });
  assert.ok(first);
  assert.equal(gate.reject(first), true);

  const second = gate.begin({
    soldierId: "soldier-a-01",
    targetId: "node-wood-a",
    tool: "AXE",
    expectedSoldierRevision: 0,
  });
  assert.ok(second);
  assert.notEqual(first.token, second.token);
  const currentAcknowledgement = acknowledgement({
    committedRevisions: { soldier: 1, mission: 0, missionAttempt: 0 },
  });
  assert.equal(gate.acknowledge(first, currentAcknowledgement).kind, "ignored");
  assert.equal(gate.pending, true);
  assert.equal(gate.acknowledge(second, currentAcknowledgement).kind, "request_resync");
});

test("a stale-eligibility rejection holds the dispatch gate through one authoritative refresh", () => {
  const gate = createGathererDispatchReconciliationGate();
  gate.setScope(SCOPE_A);
  const attempt = gate.begin({
    soldierId: "soldier-a-01",
    targetId: "node-wood-a",
    tool: "AXE",
    expectedSoldierRevision: 0,
  });
  assert.ok(attempt);
  assert.equal(gate.markRejectedForRefresh(attempt, {
    code: "STALE_REVISION",
    currentSoldierRevision: 1,
  }).kind, "request_resync");
  assert.equal(gate.pending, true);
  assert.equal(gate.acceptSnapshot(SCOPE_A, projectionRows()).kind, "request_follow_up_resync");
  assert.equal(gate.acceptSnapshot(SCOPE_A, projectionRows({ soldierRevision: 1 })).kind, "reconciled_rejection");
  assert.equal(gate.pending, false);
});
