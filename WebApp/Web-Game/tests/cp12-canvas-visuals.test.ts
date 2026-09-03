import assert from "node:assert/strict";
import { test } from "node:test";

import {
  resolveActorVisual,
  resolveResourceVisual,
  resolveSelectionVisual,
  resolveTileVisual,
} from "../src/client/canvas-visuals";

test("tile visual mapping keeps fog, explored ground, and blocked edge states explicit", () => {
  assert.equal(resolveTileVisual({ explored: false, blocked: false }), "fog");
  assert.equal(resolveTileVisual({ explored: true, blocked: false }), "grass");
  assert.equal(resolveTileVisual({ explored: true, blocked: true }), "blocked");
});

test("resource visual mapping preserves type and depletion as separate cues", () => {
  assert.deepEqual(resolveResourceVisual({ resourceType: "wood", availability: "AVAILABLE" }), {
    resourceType: "wood",
    depleted: false,
  });
  assert.deepEqual(resolveResourceVisual({ resourceType: "rock", availability: "DEPLETED" }), {
    resourceType: "rock",
    depleted: true,
  });
});

test("actor visual mapping gives each G2 actor a stable silhouette marker", () => {
  assert.deepEqual(resolveActorVisual({
    actorKind: "player",
    role: null,
    cargoCapacityUsed: 0,
    state: "EXPLORING",
  }), {
    marker: "rune",
    palette: "friendly",
    cargo: false,
    defeated: false,
  });
  assert.deepEqual(resolveActorVisual({
    actorKind: "shelter",
    role: null,
    cargoCapacityUsed: 0,
    state: "STABLE",
  }), {
    marker: "crystal",
    palette: "friendly",
    cargo: false,
    defeated: false,
  });
  assert.deepEqual(resolveActorVisual({
    actorKind: "soldier",
    role: "GATHERER",
    cargoCapacityUsed: 2,
    state: "FIELD",
  }), {
    marker: "pickaxe",
    palette: "friendly",
    cargo: true,
    defeated: false,
  });
  assert.deepEqual(resolveActorVisual({
    actorKind: "soldier",
    role: "HUNTER",
    cargoCapacityUsed: 0,
    state: "DEAD_RESPAWN",
  }), {
    marker: "sword",
    palette: "friendly",
    cargo: false,
    defeated: true,
  });
  assert.deepEqual(resolveActorVisual({
    actorKind: "monster",
    role: null,
    cargoCapacityUsed: 0,
    state: "CHASE",
  }), {
    marker: "eye",
    palette: "hostile",
    cargo: false,
    defeated: false,
  });
});

test("unknown soldier roles remain visibly neutral instead of inheriting a false role", () => {
  assert.deepEqual(resolveActorVisual({
    actorKind: "soldier",
    role: null,
    cargoCapacityUsed: 0,
    state: "FIELD",
  }), {
    marker: "body",
    palette: "neutral",
    cargo: false,
    defeated: false,
  });
});

test("selection visual mapping resolves only current resident soldiers and available sensed resources", () => {
  assert.deepEqual(resolveSelectionVisual({
    selectedSoldierId: "soldier-a-01",
    selectedTargetId: "node-rock-a",
    actors: [
      {
        kind: "soldier",
        soldierId: "soldier-a-01",
        shelterId: "shelter-a",
        state: "AT_SHELTER",
        position: { x: 16, y: 64 },
        revision: 0,
      },
    ],
    resourceNodes: [
      {
        resourceNodeId: "node-rock-a",
        resourceType: "rock",
        position: { x: 34, y: 64 },
        availability: "AVAILABLE",
        observedWorldTime: 4,
        revision: 0,
      },
    ],
  }), {
    soldierPosition: { x: 16, y: 64 },
    targetPosition: { x: 34, y: 64 },
  });
});

test("selection visual mapping clears empty, stale, field, defeated, and depleted choices", () => {
  const input = {
    selectedSoldierId: "soldier-a-01",
    selectedTargetId: "node-rock-a",
    actors: [
      {
        kind: "soldier" as const,
        soldierId: "soldier-a-01",
        shelterId: "shelter-a",
        state: "FIELD",
        position: { x: 16, y: 64 },
        revision: 1,
      },
    ],
    resourceNodes: [
      {
        resourceNodeId: "node-rock-a",
        resourceType: "rock" as const,
        position: { x: 34, y: 64 },
        availability: "DEPLETED" as const,
        observedWorldTime: 7,
        revision: 1,
      },
    ],
  };
  assert.deepEqual(resolveSelectionVisual(input), { soldierPosition: null, targetPosition: null });
  assert.deepEqual(resolveSelectionVisual({ ...input, selectedSoldierId: "", selectedTargetId: "" }), { soldierPosition: null, targetPosition: null });
  assert.deepEqual(resolveSelectionVisual({
    ...input,
    actors: [{ ...input.actors[0], state: "DEFEATED" }],
    resourceNodes: [{ ...input.resourceNodes[0], availability: "AVAILABLE" }],
  }), { soldierPosition: null, targetPosition: { x: 34, y: 64 } });
});
