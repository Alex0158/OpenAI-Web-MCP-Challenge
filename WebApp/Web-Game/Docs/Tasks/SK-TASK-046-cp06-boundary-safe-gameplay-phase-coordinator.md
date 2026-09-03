# SK-TASK-046: CP-06 Boundary-Safe G2 Gameplay Phase Coordinator

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-06`
- Owner: Game owner
- Current increment: Closed the durable in-progress boundary journal and one worker-owned explicit G2 gameplay phase coordinator without adding an autonomous wall-time driver.
- Next gate: Register the trusted elapsed-time and autonomous scheduler challenge as the next bounded task; keep it separate from timer reducers, hosted continuity, WebMCP, and Re-entry.

## Identity

- Task ID: `SK-TASK-046`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: The task changes durable world-time meaning, schema migration, startup admission, same-time event ordering, every implemented mission reducer, worker/gateway service ownership, crash replay, and the later autonomous scheduler/hosted continuity boundary.

## Objective

Create one production-owned, explicitly driven coordinator for the currently implemented G2
gameplay phases. `world.world_time` must mean the last fully completed integer boundary. A durable
in-progress marker must preserve an interrupted boundary so worker startup replays it before opening
command/read admission. Replayed phases must use existing stable work identity and due/state guards
to produce each effect at most once.

This task makes `WorkerCommandGateway.advance()` capable of driving the verified movement, travel,
return, deposit, contact, extraction, and combat services through one shared worker graph. It does
not make wall time trustworthy or continuously advance the hosted world.

## Success and non-goals

- Success: Schema v7 records at most one `in_progress_world_time`; completed `world_time` remains at
  `T - 1` until every phase for `T` succeeds.
- Success: A crash after an early phase and before a later phase leaves the marker at `T`; restart
  replays all phases for `T` before the worker becomes `ready`, skips already durable work, completes
  remaining work, then atomically advances completed time and clears the marker.
- Success: The worker constructs one persistence-backed service graph. The gateway and clock share
  the same movement cadence, mission services, combat service, and store.
- Success: Same-time order is stable by phase and by `(due_world_time, stable entity id)` within each
  service. Home crossing can feed deposit in the same T; contact suppresses extraction before combat;
  terminal combat is not settled twice.
- Success: A GATHERER reaching a node that was already depleted returns durably with the existing
  `TARGET_DEPLETED` handoff, zero cargo, and zero coins instead of blocking the world clock.
- Non-goals: `setInterval` or another autonomous wall-time loop, trusted restart target, catch-up
  beyond the existing 300-second budget, resource or monster respawn execution, periodic realtime
  publication, WebMCP, Re-entry, Receiver/Connector work, hosted continuity, production identity,
  multi-world scheduling, continuous input, or balance tuning.

## Scope and authority

- In scope: Schema-v7 world boundary marker; begin/complete boundary transactions; removal of
  premature completed-time writes from implemented phase transactions; whole-T replay; one shared
  worker service graph; explicit coordinator wiring to `WorldClock` and `WorkerCommandGateway`;
  pre-empty target return liveness; focused tests; runtime restart evidence; core-document sync.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, browser timers, hosted timers, a second queue or
  clock, new Agent Signal eligibility, default-world bootstrap, general timer reducers, resource
  respawn execution, new external dependencies, and deployment.
- Allowed actions: Implement the accepted challenge/decision with TDD, migrate task-local databases,
  run only affected focused tests and a bounded local restart proof, and update linked English
  artifacts. Do not stage, commit, push, deploy, use credentials, spend, or contact external parties.
- Revalidate when: completed/in-progress time semantics, phase order, reducer idempotency, worker
  service ownership, startup admission, recovery budget, timer ownership, or autonomous scheduling
  changes.

## Owning authority

- World time and recovery: [`ADR-GAME-0012`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md), [`World clock detail`](../Mechanics/detail-01-world-clock-and-continuity.md)
- Worker and gateway: [`ADR-GAME-0014`](../Decisions/ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md), [`ADR-GAME-0015`](../Decisions/ADR-GAME-0015-cp08-worker-command-read-gateway.md)
- Gameplay reducers: [`ADR-GAME-0019`](../Decisions/ADR-GAME-0019-cp09-route-milestone-and-derived-transit.md), [`ADR-GAME-0021`](../Decisions/ADR-GAME-0021-cp10-extraction-cadence-and-return-handoff.md), [`ADR-GAME-0023`](../Decisions/ADR-GAME-0023-cp10-return-navigation-and-home-crossing.md), [`ADR-GAME-0024`](../Decisions/ADR-GAME-0024-cp10-deposit-and-coin-settlement.md), [`ADR-GAME-0025`](../Decisions/ADR-GAME-0025-cp11-gatherer-combat-and-cargo-loss.md), [`ADR-GAME-0026`](../Decisions/ADR-GAME-0026-cp11-hunter-victory-and-return.md), [`ADR-GAME-0027`](../Decisions/ADR-GAME-0027-cp11-danger-cell-reissue-and-anti-loop.md)
- Current challenge and decision: [`Validation/56`](../Validation/56-cp06-gameplay-phase-coordinator-preimplementation-challenge.md), [`ADR-GAME-0032`](../Decisions/ADR-GAME-0032-cp06-boundary-journal-and-gameplay-phase-coordinator.md)

## Current evidence and defects

- Verified predecessor: `WorldClock` processes the accepted seven phases in order, persists integer
  time after its handlers, bounds recovery to 300 seconds, and survives file-backed restart when
  handlers do not own gameplay transactions.
- Verified predecessor: CP-08 through CP-11 independently prove movement cadence, mission arrival,
  extraction, return, deposit, contact, combat, respawn/reissue, stable work identity, and restart.
- Resolved composition defect: Schema v7 keeps completed `world_time` at `T - 1` behind a durable
  `in_progress_world_time = T` marker until every phase completes; restart replays the whole boundary.
- Resolved liveness defect: A due GATHERER at a previously depleted node takes a durable zero-cargo
  `MissionAutoReturned(reason = TARGET_DEPLETED)` path and leaves the clock live.
- Resolved ownership defect: The default persistence worker now constructs one cadence, mission/combat
  service graph, coordinator, and clock over the same store; gateway and boundary reconciliation share it.
- Explicit later gate: The schema has no trusted wall-time anchor, and timer reducers for resource or
  monster respawn are not implemented. This task cannot claim an autonomous or complete scheduler.

## Accepted phase and replay model

1. At each 100 ms explicit step, the one shared movement cadence reconciles held server intent.
2. At integer boundary `T`, `beginBoundary(T)` requires completed `world_time = T - 1`; it records or
   exact-replays `in_progress_world_time = T`.
3. `movement`: run outbound mission arrival, then return/home crossing.
4. `deposit`: settle every newly or previously due DEPOSITING attempt.
5. `contact`: create deterministic encounter locks for eligible contacts.
6. `extraction`: process due GATHERER work; an encounter suppresses extraction, and an already-empty
   target takes the durable zero-cargo `TARGET_DEPLETED` return path.
7. `combat`: resolve due deterministic rounds and their existing atomic terminal effects.
8. `settlement`: explicit G2 no-op because terminal combat transactions already own cargo loss,
   death, respawn/reissue, or Hunter return.
9. `timers`: explicit no-op in this task; persisted resource respawn markers remain visible but inert.
10. `completeBoundary(T)` requires the exact active marker, writes completed `world_time = T`, and
    clears the marker atomically.

Restart replays the whole T rather than resuming from a volatile phase cursor. Stable work ids,
events, state/phase predicates, and due markers make already committed work a skip or exact replay.
Any unexpected failure leaves completed time at `T - 1`, retains the marker, keeps mutation/read
admission closed, and prevents T + 1.

## Cross-functional checks

1. **Time authority:** Only begin/complete boundary methods change boundary journal state. Phase
   reducers may write T-stamped domain state/events only while T is active; they cannot publish
   completed time.
2. **Exactly-once:** Whole-T replay is safe only where each reducer has deterministic work identity
   and a durable terminal/due-state guard. A missing guard is a stop condition, not a catch-all skip.
3. **Ordering:** Home arrival precedes deposit; contact precedes extraction; extraction precedes
   combat; terminal combat is not repeated by settlement. Within-phase ordering remains owned by the
   existing stable service queries.
4. **Startup:** The store opens, schema/fixture recovery validates, interrupted T replays, then clock,
   gateway, realtime, and command admission may report ready. No browser command can interleave with
   startup replay.
5. **Service identity:** The worker constructs each mutable service once and passes the same objects
   to the gateway, reconciliation, and integer-boundary coordinator.
6. **Failure classification:** Expected gameplay contention or stale resource availability becomes a
   typed durable mission outcome. Corrupt identity/state, impossible ordering, store failure, or an
   unrecognized reducer exception remains a world-level recovery failure.
7. **Downstream effects:** Phase completion can publish existing domain events and snapshots through
   existing readers, but it cannot create Agent Signals, outbox delivery, WebMCP calls, or Re-entry.

## Verification and closure target

- Red: partial T with an injected late-phase failure; restart replay; same-T home/deposit; same-T
  contact/extraction suppression; terminal combat/no settlement duplication; pre-empty target
  liveness; gateway/clock shared cadence; invalid marker transitions; no downstream signal/outbox.
- Green: implement only the boundary journal, existing reducer composition, shared graph, and durable
  target-exhaustion return required by those Reds.
- Focused regressions: CP-06 clock/recovery; CP-08 cadence/gateway; CP-09 route; CP-10 extraction,
  return, and deposit; CP-11 combat/Hunter/reissue; typecheck. Build/browser are required only if the
  runtime or client-facing projection changes.
- Runtime proof: One task-local file-backed world must fail after an early T effect, stop, restart,
  replay T before ready, complete remaining effects exactly once, advance to T, then shut down cleanly.
- Closure target: `runtime_verified` for one boundary-safe explicitly advanced G2 gameplay
  coordinator. No default continuously advancing world, timer execution, WebMCP, Re-entry, hosted,
  or full-slice claim follows.
- Stop/reopen: Stop if the implementation needs a second clock/queue, permits admission before replay,
  skips an unknown error, advances completed time before all phases, adds a wall timer, or places
  Agent/Re-entry delivery in the gameplay phase graph.

## Closure

- Implementation: Schema-v7 marker/migration, atomic begin/complete transitions, guarded phase
  transactions, whole-boundary startup replay, shared default worker graph, fixed phase coordinator,
  and pre-empty target return.
- Verification: [`SK-EVID-035`](../Evidence/SK-EVID-035-cp06-gameplay-phase-coordinator-runtime-verification.md)
  and [`Validation/57`](../Validation/57-cp06-gameplay-phase-coordinator-runtime-cross-functional-audit.md).
  `npm run test:cp06` passed 13/13; CP-04, CP-05, CP-07, CP-08, CP-09, CP-10, and CP-11 focused
  regressions plus typecheck passed at the named local scope.
- Closure result: `runtime_verified` for one file-backed, explicitly advanced local G2 coordinator.
  No autonomous scheduler, timer execution, hosted continuity, WebMCP, Re-entry, production identity,
  or multi-world claim follows.
