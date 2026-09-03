# SK-TASK-024: CP-08 Worker Command and Read Gateway

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-08`
- Owner: Game owner
- Current increment: Process-local FIFO ordering for movement intent commands, scoped full-snapshot reads, and explicit worker clock advances is runtime-verified, including request capture, domain-error isolation, and lifecycle failure handling.
- Next gate: Continue with the separately registered CP-08 local transport and full-snapshot delivery seam; do not infer browser, wire, or hosted realtime behavior from this task.

## Identity

- Task ID: `SK-TASK-024`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: This increment is the handoff between the verified worker cadence and future browser/realtime transport. A wrong queue ordering or lifecycle policy can expose stale snapshots, let commands race the clock, or silently execute work after worker replacement.

## Objective

Create one explicit local `WorkerCommandGateway` for external work ordering. Movement intent set/stop,
player-scoped full snapshot reads, and explicit worker `advance(elapsedMs)` operations must run in
FIFO invocation order on the ready worker. The gateway forwards existing typed identity, revision,
idempotency, and visibility inputs without redefining domain behavior. It returns a typed not-ready or
closed failure, keeps later queue entries usable after one operation fails, and clears process-local
queued work on close or worker replacement.

## Success and non-goals

- Success: A command followed by a snapshot read is observed in that order; an advance cannot run
  concurrently with a command or read submitted through the gateway.
- Success: Existing movement cadence, ownership, stale revision, duplicate command, snapshot privacy,
  and event/revision effects remain unchanged because the gateway delegates to the existing services.
- Success: Not-ready, close, queued-close, and operation-failure paths are visible and deterministic;
  one rejected operation does not poison later accepted work.
- Success: The gateway has no timer, fallback worker, hidden state input, durable queue, or browser
  authority. A replacement worker starts with an empty gateway queue and requires fresh intent.
- Non-goals: HTTP or WebSocket wire envelopes, authentication, upgrade handling, snapshot cadence or
  deltas, browser keyboard wiring, client interpolation, terrain/actor visibility, pathfinding,
  missions, extraction, combat, WebMCP, Re-entry, hosted scheduler, failover, or throughput tuning.

## Scope and authority

- In scope: a process-local gateway module, typed lifecycle errors, focused ordering/lifecycle tests,
  and linked evidence/validation updates.
- Out of scope: `reentry-core/`, `mvp/`, `RightSpot`, external Receiver/Connector, deployment,
  credentials, spend, staging, commit, push, and public communication.
- Allowed actions: Read/edit scoped game files, write focused tests/evidence, install safe local
  dependencies only when a capability probe proves need, and run minimum affected verification.
- Revalidate when: `ADR-GAME-0014` clock/intent rules, CP-04 lifecycle states, CP-05 idempotency or
  transaction semantics, or CP-08 snapshot authority changes.

## Owning authority

- Decision: [`../Decisions/ADR-GAME-0015-cp08-worker-command-read-gateway.md`](../Decisions/ADR-GAME-0015-cp08-worker-command-read-gateway.md)
- Clock and worker: [`../Decisions/ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md`](../Decisions/ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md), [`../Mechanics/detail-01-world-clock-and-continuity.md`](../Mechanics/detail-01-world-clock-and-continuity.md), and [`../Engineering/09-mvp-contract-sheet.md#3-world-clock-and-due-work-order`](../Engineering/09-mvp-contract-sheet.md#3-world-clock-and-due-work-order)
- Projection and identity: [`../Decisions/ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md`](../Decisions/ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md), [`../Engineering/09-mvp-contract-sheet.md#9-snapshot-and-visibility-contract`](../Engineering/09-mvp-contract-sheet.md#9-snapshot-and-visibility-contract), and [`../Validation/16-cp08-worker-cadence-runtime-cross-functional-audit.md`](../Validation/16-cp08-worker-cadence-runtime-cross-functional-audit.md)
- Runtime lifecycle: [`../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md)
- Predecessors: [`SK-TASK-023`](SK-TASK-023-cp08-worker-movement-cadence.md), [`../Evidence/SK-EVID-012-cp08-worker-movement-cadence-runtime-verification.md`](../Evidence/SK-EVID-012-cp08-worker-movement-cadence-runtime-verification.md), and [`../Validation/15-cp08-movement-snapshot-runtime-cross-functional-audit.md`](../Validation/15-cp08-movement-snapshot-runtime-cross-functional-audit.md)

## Evidence status

- Verified: the worker-owned cadence and full snapshot services that this gateway delegates to; the
  gateway's FIFO ordering, input capture, domain-failure isolation, not-ready, close, and missing
  clock paths are green in the focused harness.
- Inferred: one FIFO process-local seam is the smallest way to prevent commands, reads, and explicit
  clock advances from racing before a wire protocol exists.
- Unknown: transport admission/backpressure, hosted worker scheduling, multi-process ownership,
  network reconnect behavior, and durable queued intent.

## Verification and closure target

- Minimum verification: Red/Green focused gateway tests for FIFO command/read/advance ordering,
  operation failure isolation, not-ready and close behavior, then CP-08 cadence/snapshot predecessor
  suites, typecheck, build, and documentation validators.
- Closure result: `runtime_verified` for the process-local ordering/lifecycle seam only. No wire,
  browser, hosted, WebMCP, Re-entry, or Agent claim follows.
- Reopen trigger: any operation executes after close, read overtakes a prior command, a tick bypasses
  worker ordering, a domain error is converted to success, or queued state survives replacement.
