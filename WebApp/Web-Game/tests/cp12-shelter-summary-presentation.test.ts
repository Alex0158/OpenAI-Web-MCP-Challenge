import assert from "node:assert/strict";
import { test } from "node:test";

import type { ClientSnapshot, ClientSnapshotResourceNode } from "../src/server/world-projection";
import { buildShelterSummaryCards } from "../src/client/shelter-summary-presentation";

const shelter: ClientSnapshot["shelter"] = {
  shelterId: "shelter-a",
  playerId: "player-a",
  revision: 3,
  coins: 42,
};

const resourceNodes: ClientSnapshotResourceNode[] = [
  {
    resourceNodeId: "node-wood-a",
    resourceType: "wood",
    position: { x: 18, y: 64 },
    availability: "AVAILABLE",
    observedWorldTime: 12,
    revision: 4,
  },
  {
    resourceNodeId: "node-wood-b",
    resourceType: "wood",
    position: { x: 20, y: 64 },
    availability: "DEPLETED",
    observedWorldTime: 12,
    revision: 5,
  },
  {
    resourceNodeId: "node-rock-a",
    resourceType: "rock",
    position: { x: 22, y: 64 },
    availability: "AVAILABLE",
    observedWorldTime: 12,
    revision: 6,
  },
];

test("ready shelter summary preserves coins and visible Wood/Rock availability", () => {
  assert.deepEqual(buildShelterSummaryCards({ shelter, resourceNodes }), [
    {
      kind: "coins",
      label: "Coins",
      value: "42",
      detail: "Banked shelter currency",
      icon: "icon_coin",
    },
    {
      kind: "wood",
      label: "Wood",
      value: "2",
      detail: "1 available · 1 depleted · in sensing range",
      icon: "icon_wood",
    },
    {
      kind: "rock",
      label: "Rock",
      value: "1",
      detail: "1 available · 0 depleted · in sensing range",
      icon: "icon_rock",
    },
  ]);
});

test("unavailable resource projection fails closed instead of retaining a prior count", () => {
  const cards = buildShelterSummaryCards({ shelter, resourceNodes: null });
  assert.equal(cards.find((card) => card.kind === "coins")?.value, "42");
  assert.deepEqual(cards.filter((card) => card.kind !== "coins").map((card) => ({
    kind: card.kind,
    value: card.value,
    detail: card.detail,
  })), [
    { kind: "wood", value: "—", detail: "Waiting for an authoritative snapshot" },
    { kind: "rock", value: "—", detail: "Waiting for an authoritative snapshot" },
  ]);
});

test("missing shelter and empty ready resources keep a stable explicit summary", () => {
  assert.deepEqual(buildShelterSummaryCards({ shelter: null, resourceNodes: [] }).map((card) => ({
    kind: card.kind,
    value: card.value,
    detail: card.detail,
  })), [
    { kind: "coins", value: "—", detail: "Waiting for an authoritative snapshot" },
    { kind: "wood", value: "0", detail: "0 available · 0 depleted · in sensing range" },
    { kind: "rock", value: "0", detail: "0 available · 0 depleted · in sensing range" },
  ]);
});
