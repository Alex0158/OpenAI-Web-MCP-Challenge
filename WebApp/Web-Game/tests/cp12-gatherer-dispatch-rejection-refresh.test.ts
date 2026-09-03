import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createGathererDispatchReconciliationGate,
  type GathererDispatchRefreshFailureCode,
} from "../src/client/gatherer-dispatch";
import { explicitResyncPresentationState } from "../src/client/realtime-projection";
import type { ClientSnapshot } from "../src/server/world-projection";

const SCOPE = "SK-MVP-0.2\u0000sleepless-mvp-01\u0000player-a\u0000shelter-a";

type DispatchProjection = Pick<ClientSnapshot, "soldiers" | "missions" | "resourceNodes">;

function projection(options: {
  soldierRevision: number;
  soldierEligible?: boolean;
  targetAvailability?: "AVAILABLE" | "DEPLETED" | "ABSENT";
}): DispatchProjection {
  const soldierEligible = options.soldierEligible ?? true;
  const targetAvailability = options.targetAvailability ?? "AVAILABLE";
  return {
    soldiers: [{
      soldierId: "soldier-a-01",
      shelterId: "shelter-a",
      state: soldierEligible ? "AT_SHELTER" : "FIELD",
      role: soldierEligible ? null : "GATHERER",
      tool: soldierEligible ? null : "AXE",
      position: { x: 16, y: 64 },
      missionId: soldierEligible ? null : "mission-a-01",
      phase: soldierEligible ? "AT_SHELTER" : "TRAVELLING",
      cargoCapacityUsed: 0,
      revision: options.soldierRevision,
    }],
    missions: [{
      missionId: soldierEligible ? null : "mission-a-01",
      soldierId: "soldier-a-01",
      soldierState: soldierEligible ? "AT_SHELTER" : "FIELD",
      missionState: soldierEligible ? null : "ACTIVE",
      missionAttemptId: soldierEligible ? null : "attempt-a-01",
      attemptRevision: soldierEligible ? null : 0,
      phase: soldierEligible ? "AT_SHELTER" : "TRAVELLING",
      role: soldierEligible ? null : "GATHERER",
      tool: soldierEligible ? null : "AXE",
      equipmentTier: soldierEligible ? null : 1,
      targetId: soldierEligible ? null : "node-wood-a",
      returnPolicy: soldierEligible ? null : "WHEN_FULL",
      route: null,
      position: { x: 16, y: 64 },
      nextDueWorldTime: null,
      cargo: { quantity: 0, capacityUsed: 0, capacity: 5, resourceTypes: [] },
      encounter: null,
      reissue: { budget: 1, dangerCell: null, waitingReviewReason: null },
      nextAction: soldierEligible ? "DISPATCH" : "MONITOR",
      revision: soldierEligible ? 0 : 1,
    }],
    resourceNodes: targetAvailability === "ABSENT" ? [] : [{
      resourceNodeId: "node-wood-a",
      resourceType: "wood",
      position: { x: 30, y: 64 },
      availability: targetAvailability,
      observedWorldTime: 0,
      revision: targetAvailability === "AVAILABLE" ? 0 : 1,
    }],
  };
}

function beginGate() {
  const gate = createGathererDispatchReconciliationGate();
  gate.setScope(SCOPE);
  const attempt = gate.begin({
    soldierId: "soldier-a-01",
    targetId: "node-wood-a",
    tool: "AXE",
    expectedSoldierRevision: 3,
  });
  assert.ok(attempt);
  return { gate, attempt };
}

test("stale rejection requires its live soldier revision and permits only one automatic follow-up", () => {
  const { gate, attempt } = beginGate();
  assert.equal(gate.markRejectedForRefresh(attempt, {
    code: "STALE_REVISION",
    currentSoldierRevision: 5,
  }).kind, "request_resync");

  assert.equal(gate.acceptSnapshot(SCOPE, projection({ soldierRevision: 4 })).kind, "request_follow_up_resync");
  assert.equal(gate.acceptSnapshot(SCOPE, projection({ soldierRevision: 4 })).kind, "stale");
  assert.equal(gate.pending, true);
  assert.equal(gate.acceptSnapshot(SCOPE, projection({ soldierRevision: 5 })).kind, "reconciled_rejection");
  assert.equal(gate.pending, false);
});

for (const code of ["ROLE_LOCKED", "NOT_AT_SHELTER", "MISSION_ACTIVE"] satisfies GathererDispatchRefreshFailureCode[]) {
  test(`${code} requires both the live soldier revision and an ineligible soldier/mission projection`, () => {
    const { gate, attempt } = beginGate();
    assert.equal(gate.markRejectedForRefresh(attempt, {
      code,
      currentSoldierRevision: 4,
    }).kind, "request_resync");

    assert.equal(gate.acceptSnapshot(SCOPE, projection({ soldierRevision: 4 })).kind, "request_follow_up_resync");
    assert.equal(gate.acceptSnapshot(SCOPE, projection({ soldierRevision: 4, soldierEligible: false })).kind, "reconciled_rejection");
  });
}

for (const targetAvailability of ["DEPLETED", "ABSENT"] as const) {
  test(`target-unavailable rejection settles when the selected target is ${targetAvailability.toLowerCase()}`, () => {
    const { gate, attempt } = beginGate();
    assert.equal(gate.markRejectedForRefresh(attempt, {
      code: "TARGET_UNAVAILABLE",
      currentSoldierRevision: 3,
    }).kind, "request_resync");

    assert.equal(gate.acceptSnapshot(SCOPE, projection({ soldierRevision: 3 })).kind, "request_follow_up_resync");
    assert.equal(gate.acceptSnapshot(SCOPE, projection({
      soldierRevision: 3,
      targetAvailability,
    })).kind, "reconciled_rejection");
  });
}

test("invalid rejection revision metadata cannot replace a submitting attempt", () => {
  const { gate, attempt } = beginGate();
  assert.equal(gate.markRejectedForRefresh(attempt, {
    code: "STALE_REVISION",
    currentSoldierRevision: -1,
  }).kind, "ignored");
  assert.equal(gate.acceptSnapshot(SCOPE, projection({ soldierRevision: 4 })).kind, "awaiting_command");
});

test("a sent explicit command resync keeps the external connection presentation ready", () => {
  assert.equal(explicitResyncPresentationState("READY", "sent"), "READY");
  assert.equal(explicitResyncPresentationState("CONNECTING", "sent"), "CONNECTING");
  assert.equal(explicitResyncPresentationState("READY", "failed"), "STALE");
});
