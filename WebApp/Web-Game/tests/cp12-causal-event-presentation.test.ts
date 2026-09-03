import assert from "node:assert/strict";
import { test } from "node:test";

import type { ClientSnapshotEvent } from "../src/server/world-projection";
import { buildCausalEventCards } from "../src/client/event-presentation";

const events: ClientSnapshotEvent[] = [
  {
    eventId: "event-a-01",
    eventType: "MissionDispatched",
    worldEventCursor: 4,
    worldTime: 12,
    aggregateType: "mission",
    aggregateId: "mission-a-01",
  },
  {
    eventId: "event-a-02",
    eventType: "CargoLostToMonster",
    worldEventCursor: 8,
    worldTime: 30,
    aggregateType: "mission",
    aggregateId: "mission-a-01",
  },
];

test("causal event cards preserve event order and every visible identity field", () => {
  assert.deepEqual(buildCausalEventCards(events), [
    {
      eventId: "event-a-01",
      eventType: "MissionDispatched",
      worldEventCursor: 4,
      worldTime: 12,
      aggregateType: "mission",
      aggregateId: "mission-a-01",
      aggregateLabel: "mission:mission-a-01",
    },
    {
      eventId: "event-a-02",
      eventType: "CargoLostToMonster",
      worldEventCursor: 8,
      worldTime: 30,
      aggregateType: "mission",
      aggregateId: "mission-a-01",
      aggregateLabel: "mission:mission-a-01",
    },
  ]);
});

test("an empty event projection remains empty and cannot fabricate history", () => {
  assert.deepEqual(buildCausalEventCards([]), []);
});

test("long aggregate identifiers remain intact for readable wrapping", () => {
  const [card] = buildCausalEventCards([{
    ...events[0],
    aggregateType: "mission_attempt",
    aggregateId: "attempt-a-01-with-a-long-stable-identifier",
  }]);
  assert.equal(card.aggregateLabel, "mission_attempt:attempt-a-01-with-a-long-stable-identifier");
});
