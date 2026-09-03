# ADR-GAME-0012: CP-06 World-Time Precision and Recovery Budget

**Status:** ACCEPTED CP-06 INPUT CONTRACT; local clock/recovery seam and B autonomous restart extension runtime-verified for the named local explicit-autonomous scope  
**Date:** 2026-09-02  
**Decision owner:** Game owner with engineering recommendation  
**Related task:** [`../Tasks/SK-TASK-006-cp06-clock-recovery-preimplementation-pack.md`](../Tasks/SK-TASK-006-cp06-clock-recovery-preimplementation-pack.md)  
**Resolves:** T1-01 and T1-05 in [`../Validation/12-cp05-cp19-tiered-audit.md`](../Validation/12-cp05-cp19-tiered-audit.md)

## Context

CP-05 now persists and compares `world_time`, but CP-06 still needs one unambiguous precision rule
and one bounded outcome for long downtime. The existing 100 ms reconciliation cadence is a smooth
projection requirement; it must not turn persisted gameplay time into a floating-point authority.
Likewise, restart recovery cannot run an unbounded loop or silently skip an arbitrary outage while
claiming that the world is healthy.

This is a contract clarification for the accepted `SK-MVP-0.2` slice. It does not change event order,
identity, settlement, Re-entry eligibility, or the real-time world model.

## Decision

### 1. Authoritative time is an integer

- `world_time` is a non-negative integer count of world seconds. The type is `INTEGER` in the world,
  Domain Event, `world_snapshot`, mission milestone, and Agent Signal fields.
- While the worker is healthy, one real second advances one world second. A 100 ms reconciliation
  loop may maintain fractional actor positions or projection interpolation in process memory, but that
  fractional value is never persisted, emitted as `world_time`, used for cooldown comparison, or put
  in an event envelope.
- Movement and visibility may therefore look smooth between snapshots while extraction, combat,
  death, respawn, node timers, and cooldown boundaries settle against integer world seconds.
- CP-06 owns the mapping from a trusted server-time observation to an integer recovery target. Any
  fractional elapsed second is floored until the next integer boundary; the persistence store receives
  and validates only that integer target and never derives gameplay time from a browser clock or
  wall-clock value on its own.

### 2. Recovery has a bounded five-minute budget

- `MAX_RECOVERY_WORLD_SECONDS = 300` is the G2/CP-06 default recovery budget.
- A recovery target at most 300 world seconds ahead of the last durable `world_time` is processed by
  the deterministic phase order. Routine work may be batched within the loop, while consequential
  transitions retain individual causal events and idempotent identities.
- If the forward gap is greater than 300 world seconds, CP-06 returns the typed
  `RECOVERY_LIMIT_EXCEEDED` outcome. It preserves the last committed state, snapshot, event cursor,
  revisions, and delivery history; it does not fast-forward, discard events, or loop until caught up.
- While that outcome is active, the world mutation gate remains closed and callers receive the typed
  recovery result. The process may remain observable for diagnosis and bounded shutdown, but it must
  not report the world as recovered or accept gameplay commands. A later host-launched recovery run
  may retry in explicit chunks: each accepted target must be no more than 300 world seconds after the
  last durable boundary, so a 301-second outage requires two bounded recovery attempts. CP-06 must not
  invent a second authority or silently raise the limit.
- The budget is measured in world seconds, not transport lease duration. `wall_time` remains limited
  to operational leases, logs, and health evidence; it cannot advance or pause gameplay.

### Versioned CP-06 autonomous restart extension

On 2026-09-02 the owner accepted Option B in [`ADR-GAME-0033`](ADR-GAME-0033-cp06-trusted-elapsed-time-and-autonomous-scheduler.md)
for implementation, and its named local scope is runtime-verified. This is a narrow extension to the
preceding `wall_time` rule: a persisted server-time observation may derive one bounded integer
recovery target **only during worker startup** after active-boundary replay and only when autonomous
mode is explicitly enabled. The completed time and anchor from before a replayed marker are retained
for that calculation; replay itself does not refresh the anchor, so the gap is counted exactly once.
It does not advance the live world, pause healthy gameplay, replace `world_time`, or accept a
client/browser/Agent clock. Live and bounded recovery completion store `server_time_anchor_ms` only
in the same transaction that completes a boundary. A malformed or backward observation returns
`RECOVERY_REQUIRED`; a forward gap above `MAX_RECOVERY_WORLD_SECONDS` returns
`RECOVERY_LIMIT_EXCEEDED`; either result keeps admission closed. This extension does not authorize
timer reducers, multi-world scheduling, hosted continuity, or any second gameplay clock.
ADR-GAME-0033 owns the implementation boundary and its runtime evidence in
[`SK-EVID-036`](../Evidence/SK-EVID-036-cp06-autonomous-scheduler-runtime-verification.md) and
[`Validation/59`](../Validation/59-cp06-autonomous-scheduler-runtime-cross-functional-audit.md).

## Consequences

The contract is simple for every later module: compare integer revisions and milestone times, use
fractional coordinates only for rendering, and handle an extreme restart as a visible bounded
recovery state. The five-minute default is large enough for the judge's restart trace while keeping
recovery work and event-loop pressure measurable. A hosted deployment may choose a different value
only through a later versioned operations decision with new evidence; it must not alter the local G2
meaning silently.

The cap means an outage longer than five minutes does not automatically restore a playable world in
the same process. That is an intentional safety boundary: preserving durable truth and exposing a
typed action is preferable to an unbounded catch-up or a fabricated settled state.

## Verification and reopen triggers

CP-06 must prove integer-only persistence, a 1000-to-1000.9 projection vector with no fractional
`world_time`, a five-second deterministic recovery, an exact 300-second accepted boundary, and a
301-second `RECOVERY_LIMIT_EXCEEDED` recovery that preserves the durable cursor and history and can be
resumed only through explicit 300-second chunks. Reopen
this ADR if the event-order contract changes, a consumer requires fractional authoritative time, the
recovery loop cannot meet the bounded budget, or hosted operations require a different contract rather
than an explicit versioned policy.
