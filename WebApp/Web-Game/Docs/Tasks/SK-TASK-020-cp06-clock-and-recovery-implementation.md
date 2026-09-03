# SK-TASK-020: CP-06 Clock and Restart Recovery Implementation

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-06`
- Owner: Game owner
- Current increment: The Green CP-06 worker-owned `WorldClock`, monotonic SQLite time seam, and optional worker lifecycle hook are runtime-verified in [`SK-EVID-009`](../Evidence/SK-EVID-009-cp06-clock-runtime-verification.md), with the cross-functional boundary and residuals recorded in [`../Validation/13-cp06-clock-runtime-cross-functional-audit.md`](../Validation/13-cp06-clock-runtime-cross-functional-audit.md).
- Next gate: The separately registered CP-07 implementation task [`SK-TASK-021`](SK-TASK-021-cp07-deterministic-world-fixture-implementation.md) must consume the recovered integer clock and worker-owned store to build the deterministic world fixture without adding a second authority.

## Identity

- Task ID: `SK-TASK-020`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: The clock and restart path controls every later time-dependent mechanic and can duplicate or skip cargo, combat, death, respawn, settlement, or Agent Signal effects if it derives time from the wrong authority or replays a due milestone twice.

## Objective

Implement one worker-owned CP-06 clock and restart-recovery boundary that accepts only a monotonic integer `world_time`, advances due work in the accepted deterministic order, recovers within the bounded five-minute budget, and exposes a typed `RECOVERY_LIMIT_EXCEEDED` outcome without fabricating state or waiting for an Agent.

## Success and non-goals

- Success: A fake-clock or trusted server-time input advances the worker without browser input; 100 ms reconciliation may update projection-only interpolation while persisted time stays integer; integer boundaries settle once; restart loads the CP-05 snapshot/event cursor and active due-work fields; five-second and exact 300-second recovery are deterministic; a 301-second gap preserves durable state/history, closes the world mutation gate, and returns `RECOVERY_LIMIT_EXCEEDED`; explicit later recovery chunks can resume at most 300 seconds each; crash/retry cannot duplicate a transition; and process shutdown remains owned by CP-04.
- Success: The implementation keeps process `ready` distinct from world authority, remains observable during recovery or the bounded failure outcome, and does not create a second store, clock, scheduler authority, browser timer, WebSocket path, WebMCP tool, Receiver call, or Codex Thread message.
- Non-goals: Map generation, actor population, player movement/pathfinding, fog/sensors, missions, extraction, combat, settlement, migration, siege, breach, leaderboard, Canvas, WebSocket transport, external Agent delivery, hosted deployment, RightSpot, or production-scale catch-up policy.

## Scope and authority

- In scope: `src/server/world-worker.ts`, new clock/scheduler modules under `src/server/`, CP-05 persistence methods only where the existing worker-owned seam cannot expose the required integer time or active-work/recovery fields, focused CP-06 tests, and the linked CP-06 task/scenario/evidence records.
- Out of scope: `reentry-core/`, `mvp/`, `RightSpot`, external Receiver/Connector, page or browser authority, destructive cleanup, deployment, credentials, spend, staging, commit, push, or public communication.
- Allowed actions: Read and edit the scoped game files, write focused tests and evidence, install safe local dependencies if a capability probe proves they are required, and run the minimum affected verification. Preserve every unrelated tracked, untracked, ignored, or collaborator-owned change.
- Revalidate when: `SK-MVP-0.2`, ADR-GAME-0012, CP-05 schema or worker ownership, the accepted event order, the recovery budget, Node/runtime capability, or the process shutdown contract changes.

## Owning authority

- Owning module document: [`../Mechanics/detail-01-world-clock-and-continuity.md`](../Mechanics/detail-01-world-clock-and-continuity.md)
- Owning contract section: [`../Engineering/09-mvp-contract-sheet.md#3-world-clock-and-due-work-order`](../Engineering/09-mvp-contract-sheet.md#3-world-clock-and-due-work-order)
- Controlling decisions: [`../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md) and [`../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md)
- Constraining chain or scenario: [`../Scenarios/06-cp06-clock-recovery-fixtures.md`](../Scenarios/06-cp06-clock-recovery-fixtures.md), [`../Validation/08-cp06-cp07-preimplementation-audit.md`](../Validation/08-cp06-cp07-preimplementation-audit.md), and the verified predecessor [`SK-TASK-005`](SK-TASK-005-cp05-persistence-event-log-and-outbox.md)

## Evidence status

- Verified: CP-05 provides a file-backed worker-owned SQLite store, integer-validated `world_time`, durable event cursor and snapshot recovery, active work/next-due/claim fields, typed persistence errors including `RECOVERY_LIMIT_EXCEEDED`, and a verified CP-04 listener-first lifecycle seam. The CP-06 `WorldClock` keeps authoritative time integer, confines 100 ms interpolation to process memory, runs the accepted seven-phase order, rejects regressions, bounds recovery at 300 seconds, and reloads the durable boundary through an optional worker lifecycle hook.
- Inferred: A small injected clock and scheduler interface is the least risky seam before CP-07 and later gameplay modules consume it; the current phase callbacks are synthetic ordering hooks and do not themselves implement gameplay transitions or atomic settlement.
- Unknown: The production trusted server-time anchor, active due-work scheduler representation, recovery progress/readiness surface, replay cost under the 300-second budget, and whether synchronous SQLite work meets the 100 ms projection budget under representative load.

## Smallest reversible action

The completed increment read the CP-05 store and worker interfaces, added the CP-06 focused Red harness, and implemented only the worker-owned clock, monotonic store update, and optional lifecycle hook required to turn it Green. The next increment must bind real due-work transactions and a trusted server-time recovery anchor without moving gameplay authority into the browser or introducing a second scheduler/store.

## Verification and closure target

- Minimum verification: Ladder level 3–4 for the local worker boundary: focused CP-06 tests for positive, negative, boundary, duplicate, stale, restart, crash/retry, backward-clock, exact-limit, and over-limit cases; the CP-05 suite and CP-04 transitive suite when the shared worker/persistence path changes; TypeScript and documentation validators. Do not run the full repository suite by default.
- Closure target: `runtime_verified` for the local CP-06 clock/recovery boundary, with no claim for gameplay, hosted continuity, WebMCP discovery, or external Agent delivery.
- Rollback or remediation: Revert only the scoped uncommitted CP-06 files or preserve the failing Red fixture and return to the verified CP-05 seam; never reset or clean unrelated work. If replay, timing, or authority cannot be made observable, reopen the named contract/topology decision before adding a service or fallback.
- Reopen trigger: A fractional authoritative time requirement, a recovery gap that cannot be bounded at 300 seconds, duplicate or skipped due work, a browser/process-local authority leak, event-loop starvation, a second lifecycle/store owner, or any test result that contradicts the accepted event order or CP-05 evidence.
