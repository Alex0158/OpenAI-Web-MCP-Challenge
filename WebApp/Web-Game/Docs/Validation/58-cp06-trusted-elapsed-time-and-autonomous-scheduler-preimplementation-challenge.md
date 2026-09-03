# CP-06 Trusted Elapsed Time and Autonomous Scheduler Pre-Implementation Challenge

**Status:** ACCEPTED; OWNER DECISION RECORDED; IMPLEMENTED AND RUNTIME-VERIFIED
**Checkpoint:** CP-06
**Task:** [`SK-TASK-047`](../Tasks/SK-TASK-047-cp06-trusted-elapsed-time-and-autonomous-scheduler.md)
**Decision:** [`ADR-GAME-0033`](../Decisions/ADR-GAME-0033-cp06-trusted-elapsed-time-and-autonomous-scheduler.md)
**Date:** 2026-09-02

## Question

What is the smallest trustworthy way to turn the verified explicit G2 boundary coordinator into one
autonomous server-owned driver while preserving integer world time, bounded restart recovery, phase
replay, process health, and a quiet browser/Agent boundary?

## Current evidence and gaps

- Task046 proves one shared worker graph, the schema-v7 `in_progress_world_time` predecessor, whole-boundary replay,
  fixed phase order, and pre-empty target liveness for explicit advances.
- `WorldClock.tick()` already consumes elapsed milliseconds, interleaves 100 ms reconciliation with
  integer boundaries, and rejects more than 300 processed world seconds.
- The world row has no persisted server-time anchor. `created_at` is not a safe substitute because a
  fresh world may be opened long after it was created.
- Authority constraint resolved: the owner accepted Option B on 2026-09-02 and
  [`ADR-GAME-0012`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md)
  now records the narrow startup-only extension. `wall_time` remains unable to advance or pause
  healthy live gameplay; only a persisted server observation may derive one bounded restart target
  after replay when autonomous mode is explicitly enabled.
- `setInterval` would not measure actual elapsed time, can overlap a slow callback, and can leave a
  queued callback mutating a stopping worker. `Date.now()` alone can jump backwards or forwards.
- A restart cannot recover downtime from process monotonic time because the monotonic origin is lost
  with the process. A persisted server-time observation is therefore needed for a bounded target.
- Resource and monster due markers exist, but their reducers remain inert. Adding autonomous time
  must not imply that every timer phase is implemented.
- The local fixture and existing tests rely on explicit advance. They must remain deterministic until
  an autonomous mode is deliberately enabled for a runtime proof.

## Failure modes the design must disprove

| Failure mode | Required falsifier | Forbidden result |
|---|---|---|
| Two live drivers | Start the worker twice and attempt a second scheduler start | Two wakeups or two clocks mutate the same world |
| Timer drift | Delay a callback and compare monotonic elapsed with the requested advance | Treating every callback as exactly 100 ms |
| Callback overlap | Block one advance, trigger another wakeup, then release | Concurrent phase execution or a second queue |
| Restart overcount | Persist an anchor, close, advance the test wall clock, and reopen | Catch-up from browser time or an unbounded target |
| Wall-clock rollback | Reopen with a server wall time below the persisted anchor | Silent negative time or world-time regression |
| Long downtime | Reopen more than 300 world seconds ahead | Fast-forward, dropped events, or ready admission |
| Partial boundary | Fail after an early phase and restart through scheduler recovery | Skipping the marked boundary or starting T + 1 |
| Startup baseline double-count | Complete startup recovery, then let the first live wakeup run | Counting the same downtime again from a pre-recovery monotonic baseline |
| Shutdown race | Stop during an in-flight callback and fire the stale wakeup | Post-stop mutation or an unhandled timer rejection |
| Empty world | Start with no selected world | Inventing a world or claiming continuous gameplay |
| Timer interpretation | Advance through the inert `timers` phase | Resource/monster respawn without its own reducer decision |

## Options

### A — `setInterval` plus `Date.now()`

Rejected. The interval is a wakeup mechanism rather than a time authority, and a wall clock can jump
or be adjusted. Callback overlap, shutdown races, and a second scheduler are easy to introduce.

### B — One-shot wakeup plus monotonic live elapsed time and a persisted restart anchor (accepted)

Use one worker-owned one-shot `setTimeout` at the existing 100 ms cadence. Each callback reads a server
monotonic source such as `process.hrtime.bigint()`, computes non-negative elapsed milliseconds since
the previous callback, and calls the existing `WorldWorkerModule.advance()` synchronously. The next
wakeup is scheduled only after the current callback settles. During startup, a server wall-time
source is compared with one nullable persisted anchor; the integer forward gap is floored and bounded
by `MAX_RECOVERY_WORLD_SECONDS`, then the existing `WorldClock.recoverTo()` path replays before ready.
The anchor is updated atomically with boundary completion. A fresh world establishes the current
anchor without downtime; malformed or backward observations fail with `RECOVERY_REQUIRED`.

This is the selected route. It gives a restarted worker bounded automatic catch-up through the
startup-only extension recorded in [`ADR-GAME-0012`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md).
It still requires explicit enablement for deterministic local tests and later host proof.

### E — One-shot wakeup plus monotonic live elapsed time, with no automatic downtime catch-up (conservative)

Use the same worker-owned one-shot 100 ms driver and monotonic live deltas, but do not persist or read
a wall-time gameplay anchor. On restart, replay any active boundary and resume at the last completed
`world_time`; downtime is not advanced automatically. An operator may later supply an explicit bounded
`recoverTo()` target through the existing server recovery contract. This preserves
[`ADR-GAME-0012`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md)
without a new authority field, at the cost of a paused world during unapproved downtime.

### C — External cron, queue, or hosted scheduler owns world advancement

Deferred. It adds a second authority and delivery failure boundary before the local scheduler has
proved its time and drain semantics. A host may supervise this process later, but it must invoke the
same single worker driver rather than write world state or create a second clock.

### D — Persist every 100 ms tick and reconstruct from the database

Rejected. It expands write load and schema/lock pressure without improving trust. Integer boundary
completion and one restart anchor are sufficient for the accepted G2 budget.

## Proposed boundary

1. **One selected world.** The worker resolves exactly one explicit `worldId`, or the sole persisted
   world when the caller deliberately enables autonomous mode. Multiple worlds, no-world bootstrap,
   and fair selection remain visible non-start outcomes.
2. **Server clocks with separate jobs.** Both options use a process monotonic source for live elapsed
   deltas. Only Option B additionally uses a server wall-time source at startup and boundary-anchor
   persistence. Neither source is exposed to the browser, page, WebSocket, WebMCP, or Agent.
3. **Anchor shape (Option B only).** Schema v8 adds nullable `world.server_time_anchor_ms`. `null`
   on a fresh world is initialized to the startup wall observation. On each successful
   `completeWorldBoundary(T)`, the same transaction stores the latest server wall observation. The
   anchor is metadata for restart recovery, never a second gameplay time. Option E has no anchor field
   or automatic downtime target.
4. **Startup order.** Open and migrate the store; retain the completed world time and anchor that
   precede any active marker; build the existing service graph; call `WorldClock.start()` so an active
   boundary replays without refreshing that retained anchor. Under Option B, read/validate the server
   wall observation and call `recoverTo(max(replayedWorldTime, completedBeforeReplay + floor(delta / 1000)))`
   only when the bounded target is ahead. This counts a replayed marker once and preserves an over-limit
   failure for the next explicit recovery attempt. Under Option E, omit that recovery step and resume at
   the completed target. Capture the driver's monotonic baseline only after replay and any recovery
   finish, so the first live wakeup cannot count startup downtime twice. Then mark the worker ready and
   start the one-shot driver. Any failure leaves admission closed and reports a typed degraded/recovery
   result.
5. **Live loop.** After startup recovery, the driver captures a monotonic baseline, schedules one 100
   ms wakeup, measures the actual non-negative delta, calls the existing worker advance path, and
   reschedules after completion.
   It does not call phase services directly, maintain a private accumulator, or create a queue. A
   callback failure stops future scheduling, emits the existing worker fault signal, and leaves the
   clock's recovery state visible.
6. **Drain.** Stop marks the driver draining, clears its timer, waits for one active callback to
   finish, rejects a second start, and prevents stale callbacks from entering `advance()`. Worker
   stop calls driver stop before store close.
7. **Boundaries unchanged.** The existing phase order and schema-v7 marker, carried forward in
   schema v8, stay authoritative;
   `settlement` and `timers` remain explicit G2 no-ops. No new event, Agent Signal, outbox row,
   WebMCP call, Re-entry action, or realtime frame is created by the driver itself.

## Required Red, Green, and runtime proof

1. Red anchor migration and null initialization; exact restart target at 0, 1, and 300 seconds;
   backward/skew and 301-second limit failures with no admission.
2. Red one-shot lifecycle: one scheduler only, no overlap, delayed callback uses actual monotonic
   elapsed time, stop/drain prevents late mutation, and a callback failure is visible.
3. Red partial-boundary restart through the autonomous startup path, with existing event/idempotency
   identities, the marker completing exactly once, and downtime measured from the pre-replay anchor.
4. Green only the anchor, trusted-time adapter, one-shot driver, startup recovery wiring, and the
   smallest lifecycle/fault surface required by those tests. Keep timer reducers and publication out.
5. Runtime proof: one task-local file-backed selected world runs for several seconds without a
   browser, survives a controlled close/reopen with bounded downtime recovery, and shuts down with no
   post-stop mutation. Capture world time, anchor, marker, event cursor, health, and scheduler state.

## Stop and reopen conditions

Stop before implementation if the design needs a client-supplied time, a second worker/queue, a
browser timer, a wall-time interval treated as authority, admission before replay, a catch-up loop
above 300 seconds, anchor writes outside boundary completion, timer reducers without a separate
contract, or hidden retry/fallback behavior.

## Challenge disposition

Option B is accepted as the smallest path. It preserves the existing WorldClock and coordinator as
the sole gameplay executor, uses monotonic time only while the process is alive, and uses one
persisted wall-time anchor only to bound restart recovery under the accepted ADR-GAME-0012 extension.
Option E remains documented as the reopen fallback, not the current implementation path. Task047's
implementation and local runtime result are recorded in [`SK-EVID-036`](../Evidence/SK-EVID-036-cp06-autonomous-scheduler-runtime-verification.md)
and [`Validation/59`](59-cp06-autonomous-scheduler-runtime-cross-functional-audit.md). The
implementation remains bounded to one explicitly enabled local world; hosted continuity and later
capability gates remain open.
