# ADR-GAME-0032: CP-06 Boundary Journal and Gameplay Phase Coordinator

**Status:** ACCEPTED AND RUNTIME-VERIFIED FOR THE NAMED LOCAL EXPLICIT-ADVANCE SCOPE  
**Date:** 2026-09-02  
**Decision owner:** Game owner under the standing authorized checkpoint delivery cycle  
**Contract:** `SK-MVP-0.2`  
**Challenge:** [`Validation/56`](../Validation/56-cp06-gameplay-phase-coordinator-preimplementation-challenge.md)

## Context

CP-06 verifies integer world time and ordered abstract phases. CP-08 through CP-11 verify each current
gameplay reducer independently. Their first composition exposes a durability mismatch: phase
transactions advance `world_time` themselves, while `WorldClock` treats that value as completed only
after all phases. A late failure can therefore leave an unmarked partial boundary that restart skips.

Expected gameplay exhaustion also cannot escape as a world-level error once the reducer is attached
to the clock. Finally, gateway movement intent and clock reconciliation must share one mutable
service graph. These prerequisites must close before any autonomous wall-time loop is safe.

## Decision

1. Schema v7 adds one nullable in-progress boundary marker to the world aggregate.
   `world_time` means the last fully completed integer boundary; the marker means exactly one next
   boundary is reserved but not yet complete.
2. `beginBoundary(T)` accepts only T = completed time + 1 and exact-replays the same active T.
   `completeBoundary(T)` requires that marker, atomically advances completed time to T, and clears it.
   Invalid, conflicting, skipped, or regressing transitions fail closed.
3. Implemented phase transactions may write T-stamped domain state only while T is active. They no
   longer update completed world time. Existing deterministic work ids, event ids, idempotency
   records, due markers, and terminal state make whole-T replay safe.
4. Worker startup replays an active boundary before reporting ready or admitting gateway, realtime,
   or HTTP work. An unexpected phase/store failure retains completed T - 1 and marker T, degrades the
   process, and forbids T + 1.
5. One worker-owned coordinator maps the accepted phases as follows:
   - `movement`: outbound mission arrival, then return/home crossing;
   - `deposit`: shelter cargo/coin settlement;
   - `contact`: deterministic encounter lock;
   - `extraction`: due GATHERER work after contact suppression;
   - `combat`: due deterministic rounds and existing atomic terminal effects;
   - `settlement`: explicit no-op for G2 because combat terminal transactions own their settlement;
   - `timers`: explicit no-op until resource/monster timer reducers are implemented.
6. The worker constructs one persistence-backed movement cadence, mission service set, combat
   service, snapshot service, coordinator, and clock. Gateway and clock paths receive those same
   instances; no second intent map, clock, or queue is allowed.
7. A GATHERER due at a node already depleted before this boundary takes the existing durable
   `MissionAutoReturned(reason = TARGET_DEPLETED)` handoff even with zero cargo. This replaces the
   prior `TARGET_UNAVAILABLE` world-level recovery path, clears the due marker, preserves zero
   cargo/coins, and keeps later phases live.
8. This increment remains explicitly driven. It does not add an interval, trusted server-time
   target, timer execution, periodic realtime broadcast, multi-world scheduling, WebMCP, Agent
   Signal delivery, Re-entry, production identity, or hosted continuity.

## Consequences and limits

Whole-T replay repeats phase discovery work after a crash, but avoids a durable phase cursor and its
extra failure states. Replay safety is a required property of every composed reducer; a missing guard
blocks composition rather than being hidden by exception handling.

The schema marker is operational state, not another time source. A later autonomous driver must still
choose trusted elapsed time, missed-time anchoring, catch-up pacing, timer reducers, publication
cadence, and public admission/backpressure. Task046 can prove only explicit boundary-safe progression.

Changing pre-empty zero-cargo behavior from world-level `TARGET_UNAVAILABLE` to mission-level
`TARGET_DEPLETED` return is intentional. Depletion during travel is normal competition, and returning
to shelter is the smallest live, explainable outcome. It creates no cargo or coin and reuses the
existing event/result vocabulary.

## Alternatives rejected

- Direct service wiring plus `setInterval`: unsafe because partial completed time and duplicate
  service ownership remain.
- Per-phase durable cursor: unnecessary complexity while current reducers support whole-T replay.
- One monolithic all-phase transaction: broad store rewrite, long lock, and loss of bounded reducer
  contracts.
- Catch `TARGET_UNAVAILABLE` and continue: leaves the same due mission stuck and repeats the failure;
  it hides an unresolved domain outcome.

## Verification and reopen triggers

The accepted challenge was verified with injected partial-boundary failure/restart, exact replay, shared
worker graph, fixed phase order, nonduplicated terminal settlement through the existing combat reducer,
pre-empty target liveness, invalid marker transitions, no downstream Agent effects, affected focused
regressions, typecheck, and one file-backed restart-equivalent proof. The evidence and cross-functional
disposition are recorded in [`SK-EVID-035`](../Evidence/SK-EVID-035-cp06-gameplay-phase-coordinator-runtime-verification.md)
and [`Validation/57`](../Validation/57-cp06-gameplay-phase-coordinator-runtime-cross-functional-audit.md).

`SK-TASK-046` is therefore closed as `runtime_verified` for one local, explicitly advanced G2
coordinator. The test restart closes and reopens the file-backed application store in the Node runtime;
it does not prove a hosted supervisor or OS-level restart policy.

Reopen for per-phase checkpoints, another phase order, timer execution, a trusted wall-time anchor,
more than one world, a reducer without deterministic replay identity, admission before replay,
catch-and-continue policy, periodic publication, WebMCP/Re-entry integration, or a contract-version
change.
