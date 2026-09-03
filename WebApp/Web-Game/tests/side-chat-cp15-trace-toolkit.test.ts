import assert from "node:assert/strict";
import test from "node:test";
import {
  assertPhaseOrder,
  assertReplayEqual,
  assertUniqueEffects,
  normalizeTrace,
  traceDigest,
  type TraceEventObservation,
  type TracePhaseVisit,
} from "./support/trace-toolkit";

const PHASES = ["movement", "deposit", "contact", "extraction", "combat", "settlement", "timers"] as const;

function phaseVisits(worldTime: number, phases: readonly string[] = PHASES): TracePhaseVisit[] {
  return phases.map((phase) => ({ worldTime, phase }));
}

function event(eventId: string, effectKey?: string): TraceEventObservation {
  return {
    worldTime: 4,
    eventId,
    eventType: "CargoLostToMonster",
    ...(effectKey === undefined ? {} : { effectKey }),
  };
}

test("accepts the exact phase sequence independently at each boundary", () => {
  assert.doesNotThrow(() => assertPhaseOrder([
    ...phaseVisits(1),
    ...phaseVisits(2),
  ], PHASES));
});

test("rejects a missing, reordered, or duplicated phase instead of repairing the trace", () => {
  assert.throws(
    () => assertPhaseOrder([], PHASES),
    /phase visits must contain at least one boundary/,
  );
  assert.throws(
    () => assertPhaseOrder(phaseVisits(1, ["movement", "contact", "deposit", ...PHASES.slice(3)]), PHASES),
    /boundary 1 expected/,
  );
  assert.throws(
    () => assertPhaseOrder(phaseVisits(1, PHASES.slice(0, -1)), PHASES),
    /boundary 1 expected/,
  );
  assert.throws(
    () => assertPhaseOrder(phaseVisits(1, [...PHASES, "timers"]), PHASES),
    /boundary 1 expected/,
  );
});

test("rejects duplicate event IDs and duplicate effect keys", () => {
  assert.throws(
    () => assertUniqueEffects([event("event-1", "effect-1"), event("event-1", "effect-2")]),
    /duplicate eventId event-1/,
  );
  assert.throws(
    () => assertUniqueEffects([event("event-1", "effect-1"), event("event-2", "effect-1")]),
    /duplicate effectKey effect-1/,
  );
  assert.doesNotThrow(() => assertUniqueEffects([event("event-1", "effect-1"), event("event-2")]));
});

test("produces a stable replay digest without sorting observed order", () => {
  const first = {
    phases: phaseVisits(4),
    events: [event("event-1", "effect-1")],
  } as const;
  const sameValuesWithDifferentInputPropertyOrder = {
    phases: phaseVisits(4),
    events: [{ effectKey: "effect-1", eventType: "CargoLostToMonster", eventId: "event-1", worldTime: 4 }],
  } as const;

  assert.equal(traceDigest(first), traceDigest(sameValuesWithDifferentInputPropertyOrder));
  assert.doesNotThrow(() => assertReplayEqual(first, sameValuesWithDifferentInputPropertyOrder));
  assert.throws(
    () => assertReplayEqual(
      first,
      { phases: [...phaseVisits(4)].reverse(), events: first.events },
    ),
    /replay digest mismatch/,
  );
});

test("copies input records and does not mutate caller-owned trace arrays", () => {
  const phases = phaseVisits(7);
  const events = [event("event-7", "effect-7")];
  const normalized = normalizeTrace({ phases, events });

  assert.notEqual(normalized.phases, phases);
  assert.notEqual(normalized.events, events);
  assert.deepEqual(phases, phaseVisits(7));
  assert.deepEqual(events, [event("event-7", "effect-7")]);
});
