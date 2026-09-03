export interface TracePhaseVisit {
  readonly worldTime: number;
  readonly phase: string;
}

export interface TraceEventObservation {
  readonly worldTime: number;
  readonly eventId: string;
  readonly eventType: string;
  readonly effectKey?: string;
}

export interface DeterministicTrace {
  readonly phases: readonly TracePhaseVisit[];
  readonly events: readonly TraceEventObservation[];
}

function fail(message: string): never {
  throw new Error(`TRACE_CONTRACT_VIOLATION: ${message}`);
}

function assertTraceString(value: string, field: string): void {
  if (typeof value !== "string" || value.length === 0) {
    fail(`${field} must be a non-empty string`);
  }
}

function assertWorldTime(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    fail(`${field} must be a non-negative safe integer`);
  }
}

/**
 * Copies a trace into a fixed field order without sorting observed records.
 * Sorting would hide an ordering defect that the CP-15/CP-16 assertions need to expose.
 */
export function normalizeTrace(input: DeterministicTrace): DeterministicTrace {
  const phases = input.phases.map((visit, index) => {
    assertWorldTime(visit.worldTime, `phases[${index}].worldTime`);
    assertTraceString(visit.phase, `phases[${index}].phase`);
    return { worldTime: visit.worldTime, phase: visit.phase };
  });

  const events = input.events.map((event, index) => {
    assertWorldTime(event.worldTime, `events[${index}].worldTime`);
    assertTraceString(event.eventId, `events[${index}].eventId`);
    assertTraceString(event.eventType, `events[${index}].eventType`);
    if (event.effectKey !== undefined) {
      assertTraceString(event.effectKey, `events[${index}].effectKey`);
    }
    return {
      worldTime: event.worldTime,
      eventId: event.eventId,
      eventType: event.eventType,
      ...(event.effectKey === undefined ? {} : { effectKey: event.effectKey }),
    };
  });

  return { phases, events };
}

/**
 * Requires every observed boundary to contain exactly the supplied phase sequence.
 * The helper checks the observed order; it never repairs or sorts it.
 */
export function assertPhaseOrder(
  visits: readonly TracePhaseVisit[],
  expectedOrder: readonly string[],
): void {
  if (expectedOrder.length === 0) {
    fail("expected phase order must not be empty");
  }
  const expected = [...expectedOrder];
  if (new Set(expected).size !== expected.length) {
    fail("expected phase order must contain unique phases");
  }

  const normalized = normalizeTrace({ phases: visits, events: [] }).phases;
  if (normalized.length === 0) {
    fail("phase visits must contain at least one boundary");
  }
  const observedByBoundary = new Map<number, string[]>();
  for (const visit of normalized) {
    const phases = observedByBoundary.get(visit.worldTime) ?? [];
    phases.push(visit.phase);
    observedByBoundary.set(visit.worldTime, phases);
  }

  for (const [worldTime, actual] of observedByBoundary) {
    const matches = actual.length === expected.length
      && actual.every((phase, index) => phase === expected[index]);
    if (!matches) {
      fail(
        `boundary ${worldTime} expected [${expected.join(", ")}] but observed [${actual.join(", ")}]`,
      );
    }
  }
}

/**
 * Requires event IDs and supplied effect keys to be unique within one observed run.
 */
export function assertUniqueEffects(events: readonly TraceEventObservation[]): void {
  const normalized = normalizeTrace({ phases: [], events }).events;
  const eventIds = new Set<string>();
  const effectKeys = new Set<string>();

  for (const event of normalized) {
    if (eventIds.has(event.eventId)) {
      fail(`duplicate eventId ${event.eventId}`);
    }
    eventIds.add(event.eventId);

    if (event.effectKey !== undefined) {
      if (effectKeys.has(event.effectKey)) {
        fail(`duplicate effectKey ${event.effectKey}`);
      }
      effectKeys.add(event.effectKey);
    }
  }
}

/**
 * Produces stable JSON with fixed field order while preserving the trace's observed order.
 */
export function traceDigest(input: DeterministicTrace): string {
  const normalized = normalizeTrace(input);
  return JSON.stringify({
    phases: normalized.phases,
    events: normalized.events.map((event) => ({
      worldTime: event.worldTime,
      eventId: event.eventId,
      eventType: event.eventType,
      effectKey: event.effectKey ?? null,
    })),
  });
}

export function assertReplayEqual(left: DeterministicTrace, right: DeterministicTrace): void {
  const leftDigest = traceDigest(left);
  const rightDigest = traceDigest(right);
  if (leftDigest !== rightDigest) {
    fail(`replay digest mismatch: left=${leftDigest}; right=${rightDigest}`);
  }
}
