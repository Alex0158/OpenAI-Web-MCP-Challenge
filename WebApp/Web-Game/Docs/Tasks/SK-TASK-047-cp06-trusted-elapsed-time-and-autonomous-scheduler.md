# SK-TASK-047: CP-06 Trusted Elapsed Time and Autonomous Scheduler

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-06`
- Owner: Game owner
- Current increment: The accepted B server-time-anchor extension is implemented as schema v8 persistence, trusted startup recovery, one worker-owned monotonic one-shot scheduler, explicit host opt-in, and clean drain/fault propagation. Focused Red/Green/refactor checks and the file-backed autonomous runtime proof are complete; the bounded closure record is [`SK-EVID-036`](../Evidence/SK-EVID-036-cp06-autonomous-scheduler-runtime-verification.md) with cross-functional review in [`Validation/59`](../Validation/59-cp06-autonomous-scheduler-runtime-cross-functional-audit.md).
- Next gate: Keep the autonomous driver bounded to one explicitly selected local world; later hosted, multi-world, timer-reducer, WebMCP, and Re-entry work must use a new task and decision.

## Identity

- Task ID: `SK-TASK-047`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: The task introduces a new source for elapsed world time, changes schema and startup recovery, creates a wall-clock/monotonic-clock boundary, adds a live timer lifecycle, and can affect every implemented due-work phase and process health.

## Objective

Make one selected, persistence-backed G2 world advance without browser presence through one
worker-owned autonomous driver. Live progression must use a monotonic process-time source; restart
recovery may use only a persisted server-time anchor, a bounded five-minute catch-up, and the existing
`WorldClock`/`GameplayPhaseCoordinator` path. A delayed callback, clock skew, scheduler failure, or
shutdown must remain visible and must never create a second clock, queue, or world authority.

## Success and non-goals

- Success: One worker creates at most one scheduler for one selected world and starts it only after store migration, active-boundary replay, and bounded downtime recovery complete.
- Success: A one-shot 100 ms wakeup measures elapsed time from a monotonic server clock and calls the existing worker advance path; timer delay is not treated as one world second and overlapping callbacks are impossible.
- Success: A nullable persisted server-time anchor is updated with boundary completion in the same durable boundary operation. A fresh world establishes an anchor without inventing downtime; a restart derives a non-negative integer catch-up target from the anchor and floors fractional seconds.
- Success: Backward or malformed server-time observations fail closed as `RECOVERY_REQUIRED`; a forward gap above `MAX_RECOVERY_WORLD_SECONDS` remains `RECOVERY_LIMIT_EXCEEDED` and does not admit commands or start the scheduler.
- Success: Scheduler stop drains one in-flight advance, clears the wakeup, prevents a later callback from mutating state, and leaves the worker lifecycle and health result observable.
- Success: Existing boundary journaling, phase order, idempotency, target-depletion liveness, and full-snapshot/realtime boundaries remain unchanged; no browser or Agent clock participates.
- Non-goals: resource or monster respawn reducers, timer-phase behavior, multi-world scheduling, fair world selection, hosted deployment or supervisor proof, production identity, WebMCP, Re-entry, Agent Signals, new transport, balance tuning, or continuous browser input.

## Scope and authority

- In scope: One schema-v8 nullable server-time anchor; trusted time-source interfaces; worker-owned one-shot scheduler; startup anchor validation and bounded catch-up; scheduler lifecycle/drain/fault propagation; one selected persisted world; focused failure and restart tests; runtime evidence and core-document synchronization.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, page timers, WebSocket protocol changes, a second queue or clock, timer reducers, resource respawn execution, multi-world registry, external services, new dependencies, and deployment.
- Allowed actions: Complete the accepted Challenge/ADR with TDD, migrate task-local databases, run focused CP-06/worker/clock regressions and one local process-runtime proof, and update linked English artifacts. Do not stage, commit, push, deploy, use credentials, spend, or contact external parties.
- Revalidate when: world-time units, anchor semantics, recovery budget, scheduler cadence, phase order, worker admission, timer ownership, or process health changes.

## Owning authority

- World time and recovery: [`ADR-GAME-0012`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md), [`World clock detail`](../Mechanics/detail-01-world-clock-and-continuity.md)
- Boundary journal and phase composition: [`ADR-GAME-0032`](../Decisions/ADR-GAME-0032-cp06-boundary-journal-and-gameplay-phase-coordinator.md), [`SK-TASK-046`](SK-TASK-046-cp06-boundary-safe-gameplay-phase-coordinator.md)
- Worker lifecycle and health: [`ADR-GAME-0011`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md), [`ADR-GAME-0014`](../Decisions/ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md)
- Current Challenge and decision: [`Validation/58`](../Validation/58-cp06-trusted-elapsed-time-and-autonomous-scheduler-preimplementation-challenge.md), [`ADR-GAME-0033`](../Decisions/ADR-GAME-0033-cp06-trusted-elapsed-time-and-autonomous-scheduler.md)

## Evidence status

- Verified: `WorldClock` owns integer boundaries, 100 ms reconciliation, whole-boundary replay, and the 300-second recovery cap. An interrupted-boundary replay preserves the pre-replay anchor so startup counts that marker once. `WorldWorkerModule` owns one persistence store, one gameplay graph, and the explicit `advance(elapsedMs)` seam used by the autonomous driver.
- Verified: Task046 proves the schema-v7 boundary-journal predecessor; this increment carries that marker into schema v8 with a nullable restart anchor and preserves whole-boundary replay.
- Decision resolved: [`ADR-GAME-0012`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md) now permits the narrow startup-only server-time-anchor recovery extension selected by the owner. Live progression remains monotonic-process-time driven; the anchor cannot advance healthy live gameplay or be read by a client/Agent.
- Inferred: A one-shot callback plus monotonic elapsed measurement is smaller and safer than `setInterval` or per-phase timers, provided startup and shutdown are serialized through the existing worker.
- Unknown: Whether the selected host can provide a stable server wall clock, whether the event loop can meet the 100 ms budget under real load, and whether hosted storage/supervision can preserve the anchor. These remain later operational evidence gates.

## Implementation result

The implementation adds `server_time_anchor_ms` and migration `cp06-004`, a trusted-time recovery
adapter, an `AutonomousWorldScheduler`, worker startup recovery and explicit `AUTONOMOUS_WORLD_MODE`
configuration, and no second phase queue or clock. The scheduler measures process-monotonic elapsed
time, serializes callbacks, fails closed on clock/advance errors, and drains before store close.
Startup replay deliberately leaves the prior anchor in place until the bounded target is derived, so
a partial boundary cannot lose or double-count downtime. The Red suite covered anchor migration,
monotonic target calculation, atomic anchor completion, anchored partial-boundary recovery, overlap,
stale callbacks, fault visibility, explicit opt-in, startup admission, over-limit recovery, and
worker restart; Green and refactor reruns are recorded in `SK-EVID-036`.

## Verification and closure target

- Minimum verification: Focused CP-06 clock/recovery and autonomous tests, affected worker/gateway and phase-composition regressions, typecheck, documentation validation, and one level-4 file-backed autonomous progression/restart/drain proof under Node 24.
- Closure target: `runtime_verified` for one local selected world with an explicitly enabled scheduler; no hosted, multi-world, timer-reducer, WebMCP, Re-entry, or full vertical-slice claim follows.
- Rollback or remediation: Keep the existing explicit `WorldWorkerModule.advance()` path and disable autonomous start for the affected process; preserve the durable anchor and boundary marker for diagnosis; never fast-forward or clear them silently.
- Reopen trigger: A wall-clock jump, duplicate scheduler, overlapping callback, startup admission before recovery, anchor update outside boundary completion, unbounded catch-up, timer reducer entering without its own decision, or any client/Agent time source.

## Closure result

- `SK-EVID-036` records 8/8 contract tests and 3/3 file-backed autonomous runtime tests under
  Node.js 24.13.1, plus the affected CP-04 through CP-11 regressions and typecheck.
- The evidence is local and single-world. It does not establish a hosted supervisor, durable hosted
  storage, multi-world fairness, timer reducers, WebMCP, Re-entry, or production identity.
