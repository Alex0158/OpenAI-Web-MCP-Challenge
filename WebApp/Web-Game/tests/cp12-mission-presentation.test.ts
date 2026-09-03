import assert from "node:assert/strict";
import { test } from "node:test";

import type { ClientSnapshotMission } from "../src/server/world-projection";
import { buildMissionStatusCards } from "../src/client/mission-presentation";

const baseMission: ClientSnapshotMission = {
  missionId: "mission-a-01",
  soldierId: "soldier-a-01",
  soldierState: "FIELD",
  missionState: "ACTIVE",
  missionAttemptId: "attempt-a-01",
  attemptRevision: 1,
  phase: "WORKING",
  role: "GATHERER",
  tool: "AXE",
  equipmentTier: 1,
  targetId: "node-wood-a",
  returnPolicy: "WHEN_FULL",
  route: null,
  position: { x: 30, y: 64 },
  nextDueWorldTime: 10,
  cargo: {
    quantity: 2,
    capacityUsed: 2,
    capacity: 5,
    resourceTypes: ["wood"],
  },
  encounter: null,
  reissue: {
    budget: 1,
    dangerCell: null,
    waitingReviewReason: null,
  },
  nextAction: "MONITOR",
  revision: 3,
};

test("mission presentation preserves authoritative values and adds a readable hierarchy", () => {
  const [card] = buildMissionStatusCards([baseMission]);

  assert.deepEqual(card, {
    soldierId: "soldier-a-01",
    phase: "WORKING",
    phaseLabel: "Working",
    role: "GATHERER",
    roleLabel: "Gatherer",
    tool: "AXE",
    toolLabel: "Axe",
    toolIcon: "icon_pickaxe",
    targetId: "node-wood-a",
    targetLabel: "node-wood-a",
    cargoLabel: "2/5",
    cargoRisk: "EXPOSED",
    cargoRiskLabel: "Cargo exposed",
    nextAction: "MONITOR",
    nextActionLabel: "Monitor",
    context: null,
  });
});

test("returning cargo and terminal review context remain explicit", () => {
  const [returning] = buildMissionStatusCards([{
    ...baseMission,
    phase: "RETURNING",
    role: "HUNTER",
    tool: "SWORD",
    targetId: "monster-seeded-01",
    cargo: { ...baseMission.cargo, quantity: 0, capacityUsed: 0, resourceTypes: [] },
    nextAction: "MONITOR",
  }]);
  assert.equal(returning.phaseLabel, "Returning");
  assert.equal(returning.toolIcon, "icon_sword");
  assert.equal(returning.cargoRisk, "SECURE");
  assert.equal(returning.cargoRiskLabel, "No exposed cargo");

  const [review] = buildMissionStatusCards([{
    ...baseMission,
    phase: "WAITING_REVIEW",
    encounter: {
      encounterId: "encounter-a-01",
      monsterId: "monster-seeded-01",
      state: "RESOLVED",
      soldierHp: 0,
      monsterHp: 3,
      roundNumber: 2,
      engagementPosition: { x: 30, y: 64 },
      contactWorldTime: 20,
      nextDueWorldTime: null,
      terminalCause: "GATHERER_LOST",
      revision: 4,
    },
    reissue: {
      budget: 0,
      dangerCell: { x: 31, y: 64 },
      waitingReviewReason: "NO_SAFE_REISSUE_ROUTE",
    },
    nextAction: "REVIEW",
  }]);
  assert.equal(review.context, "Cause: Gatherer Lost · Review: No Safe Reissue Route");
  assert.equal(review.nextActionLabel, "Review");
});

test("null role, tool, and target are rendered as explicit neutral values", () => {
  const [card] = buildMissionStatusCards([{
    ...baseMission,
    phase: "AT_SHELTER",
    soldierState: "AT_SHELTER",
    missionState: null,
    missionAttemptId: null,
    attemptRevision: null,
    role: null,
    tool: null,
    targetId: null,
    returnPolicy: null,
    cargo: { quantity: 0, capacityUsed: 0, capacity: 0, resourceTypes: [] },
    nextAction: "DISPATCH",
  }]);

  assert.equal(card.phaseLabel, "At Shelter");
  assert.equal(card.roleLabel, "Unassigned");
  assert.equal(card.toolLabel, "None");
  assert.equal(card.toolIcon, null);
  assert.equal(card.targetLabel, "None");
  assert.equal(card.cargoRiskLabel, "No exposed cargo");
  assert.equal(card.nextActionLabel, "Dispatch");
});

test("empty or invalid presentation input cannot fabricate a card", () => {
  assert.deepEqual(buildMissionStatusCards([]), []);
});
