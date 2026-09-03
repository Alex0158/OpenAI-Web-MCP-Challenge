# ADR-GAME-0033: CP-06 Trusted Elapsed Time and Autonomous Scheduler

**Status:** OWNER-ACCEPTED; RUNTIME-VERIFIED FOR THE NAMED LOCAL EXPLICIT-AUTONOMOUS SCOPE  
**Date:** 2026-09-02  
**Decision owner:** Game owner  
**Accepted by owner:** 2026-09-02  
**Contract:** `SK-MVP-0.2`  
**Challenge:** [`Validation/58`](../Validation/58-cp06-trusted-elapsed-time-and-autonomous-scheduler-preimplementation-challenge.md)  
**Task:** [`SK-TASK-047`](../Tasks/SK-TASK-047-cp06-trusted-elapsed-time-and-autonomous-scheduler.md)

## Context

Task046 closed the missing durability boundary around the existing G2 phases. The worker can now
advance one boundary explicitly and replay a marked boundary before readiness. The game still does
not advance while no caller supplies elapsed time, and a restart has no durable server-time
observation from which to derive bounded downtime.

The next increment must make the world live without moving authority into the browser or adding a
second clock. It also must not imply that the inert `timers` phase or hosted deployment is complete.

[`ADR-GAME-0012`](ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md) currently limits
`wall_time` to operational leases, logs, and health evidence; it cannot advance or pause gameplay.
The owner accepted the narrow extension in this ADR on 2026-09-02: a persisted server wall
observation may derive one bounded integer recovery target during autonomous worker startup only. It
does not become a live gameplay clock, and it remains unavailable to the browser, Agent, WebMCP, or
any page timer.

## Decision

1. Add one nullable `server_time_anchor_ms` to the world row in schema v8. It records the latest
   server wall-time observation associated with a successfully completed boundary. `world_time`
   remains the only gameplay time; the anchor is restart metadata and never a phase input by itself.
2. Use a server monotonic source for live progression. After startup replay/recovery, a worker-owned
   one-shot `setTimeout` at the existing 100 ms cadence captures a monotonic baseline, measures actual
   elapsed milliseconds, and calls the existing `WorldWorkerModule.advance()` path. It schedules the
   next wake only after the current advance returns, so callbacks cannot overlap and no private phase
   queue exists. Capturing the baseline after recovery prevents counting the same downtime twice.
3. Before startup replay, retain the completed `world_time` and anchor that preceded any active
   boundary. `WorldClock.start()` replays the marker without refreshing that anchor; otherwise the
   replay could erase the downtime that must be recovered. Compare the current server wall observation
   with the retained anchor, floor the non-negative gap to integer world seconds, and call `recoverTo()`
   only when the target is ahead of the replayed world time. A gap over 300 seconds returns
   `RECOVERY_LIMIT_EXCEEDED`; a malformed or backward observation returns `RECOVERY_REQUIRED`. The
   worker does not report ready or start its scheduler after either failure.
4. A fresh world with a null anchor initializes it to the current server observation and does not
   invent downtime. Live and bounded recovery boundaries update the anchor in the same durable
   boundary-completion operation as completed `world_time`, so a crash cannot publish an anchor for an
   incomplete boundary. An interrupted-boundary replay deliberately preserves the pre-replay anchor;
   the replayed boundary is counted once by taking the maximum of the replayed time and the recovered
   target.
5. Autonomous mode is explicitly enabled by the worker/host runtime. Existing tests and local
   fixture demonstrations remain explicit-advance by default. A selected world is required; no-world,
   multi-world, or ambiguous selection remains a visible non-start result until a later registry task.
6. Worker shutdown marks the scheduler draining, clears the wakeup, waits for one in-flight advance,
   and prevents stale callbacks. A callback or clock failure stops future scheduling and emits the
   existing worker fault/degraded signal; it is never retried invisibly.
7. The driver does not call phase services directly, publish snapshots, create Agent Signals or
   outbox deliveries, invoke WebMCP/Re-entry, execute resource/monster respawn, or change the fixed
   phase order. `settlement` and `timers` remain explicit G2 no-ops.

## Consequences and limits

Live progression is based on a monotonic source that cannot move backward during one process. The
persisted wall anchor enables a bounded restart target but remains vulnerable to host clock quality;
backward and over-limit observations therefore fail closed. A process outage longer than five minutes
does not silently recover. The one-shot wakeup is a scheduling mechanism, not the source of truth.

The schema change and anchor write add one small world-row field and one value to the completion
transaction. Startup replay has one extra invariant: it must preserve the pre-replay anchor until the
bounded recovery target is derived, preventing both lost downtime and double counting. The local
fixture remains deterministic because autonomous mode is opt-in. Resource and monster respawn,
publication cadence, multiple worlds, supervisor behavior, and hosted continuity require later
decisions and evidence.

## Alternatives rejected or deferred

| Alternative | Disposition |
|---|---|
| `setInterval` treated as one world second | Rejected: timer delay and overlap would become gameplay authority. |
| `Date.now()` as the live clock | Rejected: wall-clock adjustments can regress or jump the world. |
| Browser `requestAnimationFrame` or page timer | Rejected: browser presence and client timing cannot control the world. |
| External cron/queue writes or advances the world | Deferred: it would create a second authority before the single worker driver is proven. |
| Per-phase timers or queues | Rejected: they destroy one ordering/replay boundary and expand failure states. |
| Persist every sub-second tick | Rejected: unnecessary write/lock cost with no additional trust. |
| One-shot monotonic driver with no persisted anchor or automatic downtime catch-up | Rejected for the selected CP-06 path: it preserves ADR-GAME-0012 but leaves a continuous world paused across every restart. It remains a fallback only if this decision is reopened. |

## Verification and reopen triggers

Acceptance requires the new Challenge's Red/Green tests, affected CP-06/worker/phase regressions,
typecheck, and one level-4 file-backed runtime proof showing autonomous progression, bounded restart
recovery, partial-boundary replay with an anchored pre-replay gap, no overlap, visible fault, and clean
drain. Reopen if any code path can start two drivers, use browser time, lose or double-count downtime
around a replayed marker, update the anchor outside boundary completion, admit commands before replay,
exceed the recovery budget, skip a phase, create timer effects without a contract, or hide a scheduler
failure.
