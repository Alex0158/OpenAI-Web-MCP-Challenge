/**
 * CP-14 Agent Signal policy conformance.
 *
 * Every assertion in this file is derived from the written specification, not
 * from reading the current implementation:
 *
 *   - `Docs/Engineering/09-mvp-contract-sheet.md` section 7, "Domain Events and
 *     Agent Signals" notification policy;
 *   - `Docs/Scenarios/14-cp14-reentry-adapter-fixtures.md` vectors R14-02
 *     through R14-05; and
 *   - `Docs/Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md`.
 *
 * Scope: the worker-owned persistence seam only. No Receiver, Local Connector,
 * Codex Thread, browser, or WebMCP surface is contacted. `SK-ISSUE-001` remains
 * the separate external adapter gate.
 */

import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { createPersistenceStore, PersistenceError } from "../src/server/persistence/store";
import type {
  CommitTransitionInput,
  SignalEligibilityInput,
} from "../src/server/persistence/types";

const CONTRACT_VERSION = "SK-MVP-0.2" as const;
const WORLD_ID = "cp14-signal-policy-world";
const SHELTER_ID = "shelter-a";
const BINDING = "player-binding-a";

type Store = ReturnType<typeof createPersistenceStore>;

function withStore<T>(run: (store: Store) => T): T {
  const directory = mkdtempSync(join(tmpdir(), "sleepless-kingdom-cp14-signal-"));
  const store = createPersistenceStore({
    dbPath: join(directory, "world.sqlite"),
    contractVersion: CONTRACT_VERSION,
  });
  try {
    store.open();
    store.createWorld({
      worldId: WORLD_ID,
      worldTime: 0,
      worldSeed: "sleepless-mvp-01",
      generationVersion: "g2-fixture-1",
      mapFingerprint: "cp14-signal-policy-fingerprint",
    });
    store.createPlayer({ worldId: WORLD_ID, playerId: "player-a", binding: BINDING });
    store.createShelter({ worldId: WORLD_ID, shelterId: SHELTER_ID, playerId: "player-a", revision: 0 });
    return run(store);
  } finally {
    try {
      store.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }
}

function grant(overrides: Partial<SignalEligibilityInput> = {}): SignalEligibilityInput {
  return {
    shelterId: SHELTER_ID,
    opaqueBinding: BINDING,
    grantId: "cp14-grant-v1",
    boundedAction: "force_recall_soldier",
    severity: "warning",
    cooldownWorldSeconds: 60,
    ...overrides,
  };
}

/**
 * A sequential committer. The store rejects world-time regression and reuses of
 * an idempotency key, so each call advances world time and allocates fresh
 * identities and the next expected shelter revision.
 */
function committer(store: Store) {
  let sequence = 0;
  let shelterRevision = 0;

  return function commit(options: {
    eventType: string;
    worldTime: number;
    eligibility?: SignalEligibilityInput;
  }): { eventId: string; cursor: number; signalId: string | null } {
    sequence += 1;
    const eventId = `cp14-event-${sequence}`;
    const input: CommitTransitionInput = {
      worldId: WORLD_ID,
      worldTime: options.worldTime,
      idempotency: {
        key: `cp14-command-${sequence}`,
        binding: BINDING,
        request: { kind: options.eventType, sequence },
      },
      stateMutations: [
        {
          entityType: "shelter",
          entityId: SHELTER_ID,
          expectedRevision: shelterRevision,
          patch: { coins: sequence },
        },
      ],
      events: [
        {
          eventId,
          eventType: options.eventType,
          causationId: `cp14-command-${sequence}`,
          aggregateType: "shelter",
          aggregateId: SHELTER_ID,
          visibilityScope: { kind: "shelter", shelterId: SHELTER_ID },
          typedPayload: { sequence },
        },
      ],
      ...(options.eligibility ? { signalEligibility: options.eligibility } : {}),
    };
    const result = store.commitTransition(input);
    shelterRevision += 1;
    assert.equal(result.worldEventCursorStart, result.worldEventCursorEnd);
    assert.ok(result.worldEventCursorStart !== null);
    return { eventId, cursor: result.worldEventCursorStart, signalId: result.signalId };
  };
}

function eventTypesInLog(store: Store): string[] {
  return store.events(WORLD_ID).map((event) => event.eventType);
}

// ---------------------------------------------------------------------------
// R14-02 — Routine event suppression
//
// Contract section 7: "routine movement, world ticks, ordinary combat rounds,
// and repeated projection changes do not wake the Agent". "The current G2
// eligibility remains `CargoLostToMonster` only".
// ---------------------------------------------------------------------------

test("R14-02: routine events without a grant stay in history and create no wake", () => {
  withStore((store) => {
    const commit = committer(store);
    commit({ eventType: "BattleRoundResolved", worldTime: 10 });
    commit({ eventType: "CargoExtracted", worldTime: 11 });

    assert.deepEqual(eventTypesInLog(store), ["BattleRoundResolved", "CargoExtracted"]);
    assert.equal(store.signalSlot(WORLD_ID, SHELTER_ID, BINDING), null);
  });
});

test("R14-02: an ineligible event type creates no wake even when a grant is supplied", () => {
  withStore((store) => {
    const commit = committer(store);
    const routine = commit({ eventType: "BattleRoundResolved", worldTime: 10, eligibility: grant() });

    // The eligibility argument is a grant, not an override of the accepted G2
    // event vocabulary. Only `CargoLostToMonster` may create a wake.
    assert.equal(routine.signalId, null);
    assert.equal(store.signalSlot(WORLD_ID, SHELTER_ID, BINDING), null);
    assert.deepEqual(eventTypesInLog(store), ["BattleRoundResolved"]);
  });
});

test("R14-02: a grant bound to a shelter the binding does not own is denied", () => {
  withStore((store) => {
    const commit = committer(store);
    assert.throws(
      () =>
        commit({
          eventType: "CargoLostToMonster",
          worldTime: 10,
          eligibility: grant({ opaqueBinding: "binding-of-another-player" }),
        }),
      (error: unknown) => error instanceof PersistenceError && error.code === "OWNERSHIP_DENIED",
    );
    assert.equal(store.signalSlot(WORLD_ID, SHELTER_ID, BINDING), null);
  });
});

// ---------------------------------------------------------------------------
// R14-03 — Burst coalescing
//
// Contract section 7: "for each opaque continuation binding and shelter, at
// most one outgoing signal is pending or in flight; later events merge into its
// eligible event count, `world_event_cursor` range, event types, highest
// severity, latest event, and latest world time".
// ---------------------------------------------------------------------------

test("R14-03: eligible events arriving while pending merge into one signal identity", () => {
  withStore((store) => {
    const commit = committer(store);
    const first = commit({ eventType: "CargoLostToMonster", worldTime: 10, eligibility: grant() });
    const created = store.signalSlot(WORLD_ID, SHELTER_ID, BINDING);
    assert.ok(created);
    assert.equal(created.status, "pending");
    assert.equal(created.eligibleEventCount, 1);
    assert.equal(created.cursorStart, first.cursor);
    assert.equal(created.cursorEnd, first.cursor);
    assert.equal(created.latestEventId, first.eventId);
    assert.equal(created.latestWorldTime, 10);

    const second = commit({ eventType: "CargoLostToMonster", worldTime: 20, eligibility: grant() });
    const merged = store.signalSlot(WORLD_ID, SHELTER_ID, BINDING);
    assert.ok(merged);

    // One signal identity survives the burst.
    assert.equal(merged.signalId, created.signalId);
    assert.equal(second.signalId, created.signalId);
    assert.equal(merged.status, "pending");

    // Count, cursor range, latest event, and latest world time all advance.
    assert.equal(merged.eligibleEventCount, 2);
    assert.equal(merged.cursorStart, first.cursor);
    assert.equal(merged.cursorEnd, second.cursor);
    assert.equal(merged.latestEventId, second.eventId);
    assert.equal(merged.latestWorldTime, 20);
    assert.deepEqual(merged.eventTypes, ["CargoLostToMonster"]);

    // Exactly one delivery row exists for the one signal.
    assert.ok(store.outboxDelivery(WORLD_ID, merged.signalId));
  });
});

test("R14-03: a merged burst keeps the highest severity", () => {
  withStore((store) => {
    const commit = committer(store);
    commit({ eventType: "CargoLostToMonster", worldTime: 10, eligibility: grant({ severity: "info" }) });
    commit({ eventType: "CargoLostToMonster", worldTime: 20, eligibility: grant({ severity: "critical" }) });
    const escalated = store.signalSlot(WORLD_ID, SHELTER_ID, BINDING);
    assert.ok(escalated);
    assert.equal(escalated.severity, "critical");

    // A later lower-severity event must not de-escalate the pending signal.
    commit({ eventType: "CargoLostToMonster", worldTime: 30, eligibility: grant({ severity: "info" }) });
    const held = store.signalSlot(WORLD_ID, SHELTER_ID, BINDING);
    assert.ok(held);
    assert.equal(held.severity, "critical");
    assert.equal(held.eligibleEventCount, 3);
  });
});

// ---------------------------------------------------------------------------
// R14-03 / deferred cursor after handoff
//
// Contract section 7: "after handoff to the Receiver, later events accumulate
// in the delivery slot's deferred cursor rather than creating a second outgoing
// signal; the deferred cursor is folded into the next signal only after the
// current delivery is acknowledged or terminally rejected".
// ---------------------------------------------------------------------------

test("R14-03: events arriving after handoff accumulate in the deferred cursor", () => {
  withStore((store) => {
    const commit = committer(store);
    const first = commit({ eventType: "CargoLostToMonster", worldTime: 10, eligibility: grant() });
    const slot = store.signalSlot(WORLD_ID, SHELTER_ID, BINDING);
    assert.ok(slot);

    store.claimDelivery({
      worldId: WORLD_ID,
      signalId: slot.signalId,
      leaseId: "cp14-lease-1",
      nowWallTimeMs: 1_000,
      leaseDurationMs: 30_000,
    });
    const inFlight = store.signalSlot(WORLD_ID, SHELTER_ID, BINDING);
    assert.ok(inFlight);
    assert.equal(inFlight.status, "in_flight");

    const later = commit({ eventType: "CargoLostToMonster", worldTime: 20, eligibility: grant() });
    const deferred = store.signalSlot(WORLD_ID, SHELTER_ID, BINDING);
    assert.ok(deferred);

    // No second outgoing signal; the in-flight identity and its window are untouched.
    assert.equal(deferred.signalId, slot.signalId);
    assert.equal(deferred.status, "in_flight");
    assert.equal(deferred.eligibleEventCount, 1);
    assert.equal(deferred.cursorEnd, first.cursor);

    // The later event is retained in the deferred window instead.
    assert.equal(deferred.deferredEligibleEventCount, 1);
    assert.equal(deferred.deferredCursorStart, later.cursor);
    assert.equal(deferred.deferredCursorEnd, later.cursor);
    assert.equal(deferred.deferredLatestEventId, later.eventId);
    assert.equal(deferred.deferredLatestWorldTime, 20);

    // The Domain Event remains readable regardless of delivery state.
    assert.equal(eventTypesInLog(store).filter((type) => type === "CargoLostToMonster").length, 2);
  });
});

// ---------------------------------------------------------------------------
// R14-04 — Cooldown without data loss
//
// Contract section 7: "The cooldown gates creation of a new wake, not Domain
// Event retention: ... an event inside the cooldown with no active slot remains
// visible in history without creating a wake." The accepted G2 clarification
// makes this event history-only: it is not folded into the later Signal window.
// ---------------------------------------------------------------------------

test("R14-04: an eligible event inside the cooldown with no active slot creates no new wake", () => {
  withStore((store) => {
    const commit = committer(store);
    commit({ eventType: "CargoLostToMonster", worldTime: 10, eligibility: grant() });
    const slot = store.signalSlot(WORLD_ID, SHELTER_ID, BINDING);
    assert.ok(slot);
    const firstSignalId = slot.signalId;
    assert.equal(slot.cooldownUntilWorldTime, 70, "cooldown is world time 10 plus the accepted 60 world seconds");

    store.claimDelivery({
      worldId: WORLD_ID,
      signalId: firstSignalId,
      leaseId: "cp14-lease-1",
      nowWallTimeMs: 1_000,
      leaseDurationMs: 30_000,
    });
    store.acknowledgeDelivery({
      worldId: WORLD_ID,
      signalId: firstSignalId,
      leaseId: "cp14-lease-1",
      nowWallTimeMs: 2_000,
    });
    const acknowledged = store.signalSlot(WORLD_ID, SHELTER_ID, BINDING);
    assert.ok(acknowledged);
    assert.equal(acknowledged.status, "acknowledged", "no active slot remains after acknowledgement");

    // World time 30 is inside the cooldown boundary of 70.
    const inside = commit({ eventType: "CargoLostToMonster", worldTime: 30, eligibility: grant() });
    const afterCooldownEvent = store.signalSlot(WORLD_ID, SHELTER_ID, BINDING);
    assert.ok(afterCooldownEvent);

    // No new wake: the signal identity and acknowledged status are unchanged.
    assert.equal(afterCooldownEvent.signalId, firstSignalId);
    assert.equal(afterCooldownEvent.status, "acknowledged");

    // The Domain Event is still durable and readable.
    assert.equal(eventTypesInLog(store).filter((type) => type === "CargoLostToMonster").length, 2);
    assert.ok(store.events(WORLD_ID).some((event) => event.eventId === inside.eventId));
  });
});

test("R14-04: after the cooldown a new signal excludes history-only cooldown events", () => {
  withStore((store) => {
    const commit = committer(store);
    commit({ eventType: "CargoLostToMonster", worldTime: 10, eligibility: grant() });
    const first = store.signalSlot(WORLD_ID, SHELTER_ID, BINDING);
    assert.ok(first);
    const firstSignalId = first.signalId;

    store.claimDelivery({
      worldId: WORLD_ID,
      signalId: firstSignalId,
      leaseId: "cp14-lease-1",
      nowWallTimeMs: 1_000,
      leaseDurationMs: 30_000,
    });
    store.acknowledgeDelivery({
      worldId: WORLD_ID,
      signalId: firstSignalId,
      leaseId: "cp14-lease-1",
      nowWallTimeMs: 2_000,
    });

    // Inside the cooldown: durable history only, no wake and no deferred Signal
    // window. The Agent can reread this event from the canonical page.
    const deferredEvent = commit({ eventType: "CargoLostToMonster", worldTime: 30, eligibility: grant() });

    // Past the cooldown boundary of 70: a new wake may be created for the new
    // event. The event at world time 30 was history-only and has no deferred
    // window to fold into this signal.
    const reopened = commit({ eventType: "CargoLostToMonster", worldTime: 80, eligibility: grant() });
    const next = store.signalSlot(WORLD_ID, SHELTER_ID, BINDING);
    assert.ok(next);

    // Contract-guaranteed: the cooldown expiry permits a new wake under a new
    // signal identity.
    assert.equal(next.status, "pending");
    assert.notEqual(next.signalId, firstSignalId, "a new wake uses a new signal identity");
    assert.equal(next.signalId, reopened.signalId);
    assert.equal(next.latestEventId, reopened.eventId);
    assert.equal(next.latestWorldTime, 80);

    // Contract-guaranteed: the cooldown gates wakes, not Domain Event
    // retention. All three losses remain durable and readable.
    assert.equal(eventTypesInLog(store).filter((type) => type === "CargoLostToMonster").length, 3);
    assert.ok(store.events(WORLD_ID).some((event) => event.eventId === deferredEvent.eventId));

    // Accepted G2 policy: the cooldown-period event is not represented in the
    // new Signal's count or cursor range.
    assert.equal(next.eligibleEventCount, 1);
    assert.equal(next.cursorStart, reopened.cursor);
    assert.equal(next.cursorEnd, reopened.cursor);
    assert.equal(next.deferredEligibleEventCount, 0);
  });
});

// ---------------------------------------------------------------------------
// R14-05 — Retry same identity
//
// Contract section 7: "a retry reuses the same signal identity; the Local
// Connector never sends one Codex Thread message per Domain Event".
// `SK-TASK-005`: "retryable failures return to `pending` without changing
// `signal_id`" and "retrying an already acknowledged or terminally rejected
// delivery returns its stored outcome without a second event or handoff".
// ---------------------------------------------------------------------------

test("R14-05: a retryable delivery failure returns to pending under the same signal identity", () => {
  withStore((store) => {
    const commit = committer(store);
    commit({ eventType: "CargoLostToMonster", worldTime: 10, eligibility: grant() });
    const slot = store.signalSlot(WORLD_ID, SHELTER_ID, BINDING);
    assert.ok(slot);
    const signalId = slot.signalId;

    store.claimDelivery({
      worldId: WORLD_ID,
      signalId,
      leaseId: "cp14-lease-1",
      nowWallTimeMs: 1_000,
      leaseDurationMs: 30_000,
    });
    const retried = store.retryDelivery({
      worldId: WORLD_ID,
      signalId,
      leaseId: "cp14-lease-1",
      nowWallTimeMs: 2_000,
    });
    assert.equal(retried.signalId, signalId, "the retry reuses the same signal identity");

    const afterRetry = store.signalSlot(WORLD_ID, SHELTER_ID, BINDING);
    assert.ok(afterRetry);
    assert.equal(afterRetry.signalId, signalId);
    assert.equal(afterRetry.status, "pending", "a retryable failure returns the slot to pending");
    assert.equal(afterRetry.leaseId, null, "the failed lease is released");

    // A second claim is possible and does not mint a second signal or delivery.
    store.claimDelivery({
      worldId: WORLD_ID,
      signalId,
      leaseId: "cp14-lease-2",
      nowWallTimeMs: 3_000,
      leaseDurationMs: 30_000,
    });
    const reclaimed = store.signalSlot(WORLD_ID, SHELTER_ID, BINDING);
    assert.ok(reclaimed);
    assert.equal(reclaimed.signalId, signalId);
    assert.equal(reclaimed.status, "in_flight");
    assert.ok(reclaimed.attemptCount >= 2, "each handoff attempt is counted");
  });
});

test("R14-05: acknowledgement appends one ContinuationDelivered and a repeat returns the stored outcome", () => {
  withStore((store) => {
    const commit = committer(store);
    commit({ eventType: "CargoLostToMonster", worldTime: 10, eligibility: grant() });
    const slot = store.signalSlot(WORLD_ID, SHELTER_ID, BINDING);
    assert.ok(slot);
    const signalId = slot.signalId;

    store.claimDelivery({
      worldId: WORLD_ID,
      signalId,
      leaseId: "cp14-lease-1",
      nowWallTimeMs: 1_000,
      leaseDurationMs: 30_000,
    });
    const first = store.acknowledgeDelivery({
      worldId: WORLD_ID,
      signalId,
      leaseId: "cp14-lease-1",
      nowWallTimeMs: 2_000,
    });
    assert.equal(first.signalId, signalId);
    assert.equal(first.status, "acknowledged");
    assert.equal(
      eventTypesInLog(store).filter((type) => type === "ContinuationDelivered").length,
      1,
      "acknowledgement appends ContinuationDelivered exactly once",
    );

    const repeat = store.acknowledgeDelivery({
      worldId: WORLD_ID,
      signalId,
      leaseId: "cp14-lease-1",
      nowWallTimeMs: 3_000,
    });
    assert.equal(repeat.signalId, signalId, "the stored outcome is returned under the same identity");
    assert.equal(repeat.status, "acknowledged");
    assert.equal(
      eventTypesInLog(store).filter((type) => type === "ContinuationDelivered").length,
      1,
      "a repeated acknowledgement creates no second event",
    );
  });
});

test("R14-05: a stale lease cannot settle a newer delivery attempt", () => {
  withStore((store) => {
    const commit = committer(store);
    commit({ eventType: "CargoLostToMonster", worldTime: 10, eligibility: grant() });
    const slot = store.signalSlot(WORLD_ID, SHELTER_ID, BINDING);
    assert.ok(slot);
    const signalId = slot.signalId;

    store.claimDelivery({
      worldId: WORLD_ID,
      signalId,
      leaseId: "cp14-lease-1",
      nowWallTimeMs: 1_000,
      leaseDurationMs: 1_000,
    });
    // The first lease expires and a second attempt reclaims the same signal.
    store.claimDelivery({
      worldId: WORLD_ID,
      signalId,
      leaseId: "cp14-lease-2",
      nowWallTimeMs: 10_000,
      leaseDurationMs: 30_000,
    });

    assert.throws(
      () =>
        store.acknowledgeDelivery({
          worldId: WORLD_ID,
          signalId,
          leaseId: "cp14-lease-1",
          nowWallTimeMs: 11_000,
        }),
      (error: unknown) => error instanceof PersistenceError,
      "the superseded lease must not acknowledge the newer attempt",
    );
    assert.equal(
      eventTypesInLog(store).filter((type) => type === "ContinuationDelivered").length,
      0,
      "a stale acknowledgement appends no delivery event",
    );
  });
});
