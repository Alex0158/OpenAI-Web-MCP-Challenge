import assert from "node:assert/strict";
import { test } from "node:test";

import {
  resolveActorVisual,
  resolveResourceVisual,
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
