# SK-TASK-030: CP-10 Extraction Cadence and Return Handoff

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-10`
- Owner: Game owner
- Current increment: Verified recurring two-second extraction, five-slot capacity, final-node depletion marker, and atomic `RETURNING` handoff with exact persistence/event guards.
- Next gate: Register and challenge the next bounded contested-node outcome task before claiming multi-soldier contest continuity or return navigation.

## Identity

- Task ID: `SK-TASK-030`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: This increment extends a durable exactly-once cargo effect into repeated due
  work and changes mission phase, node timer metadata, event count, and recovery behavior.

## Objective

Extend the verified CP-10 first extraction into a deterministic recurring cadence. Each due milestone
adds one Wood/Rock unit to the existing provenance cargo stack. The fifth slot or final node unit
must atomically hand the mission to `RETURNING`, preserve exposed cargo, and leave a causal event
history for the later return/deposit tasks.

## Success and non-goals

- Success: A successful milestone schedules its paired next due marker at prior due + two world
  seconds and increments the stack quantity/capacity by exactly one.
- Success: Capacity five or node quantity zero clears due work and commits `WORKING → RETURNING` with
  one `MissionAutoReturned`; a final node unit also schedules the existing 30-second node marker and
  emits one `ResourceDepleted`.
- Success: Duplicate, stale, malformed, race, rollback, skipped-boundary, and restart paths preserve
  exactly-once effects and the existing server authority.
- Non-goals: return route movement, recall, home crossing, deposit, coins, combat, cargo loss,
  respawn execution, node reservation policy, weighted capacity, future tool yield, browser/UI,
  WebMCP, Re-entry, hosted scheduling, schema/contract version changes, or unrelated applications.

## Scope and authority

- In scope: the CP-10 extraction service and persistence transaction, the existing resource-node due
  metadata, focused cadence/return tests, and linked evidence/documentation.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, public surfaces, deployment, credentials, spend,
  staging, commit, push, and unrelated work.
- Allowed actions: edit scoped game files, install a safe missing dependency if required, add tests and
  records, and run the minimum affected verification.
- Revalidate when: cargo row identity/aggregation, due-work order, return policy, node timer,
  event vocabulary, migration shape, scheduler ownership, or deposit/combat handoff changes.

## Owning authority

- Economy: [`../Mechanics/detail-11-resource-extraction-cargo-and-deposit.md`](../Mechanics/detail-11-resource-extraction-cargo-and-deposit.md)
- Mission/phase: [`../Mechanics/detail-08-mission-dispatch-return-and-recall.md`](../Mechanics/detail-08-mission-dispatch-return-and-recall.md)
- Ordering: [`../Mechanics/Chains/02-dispatch-to-deposit.md`](../Mechanics/Chains/02-dispatch-to-deposit.md) and [`../Mechanics/Chains/10-world-tick-to-persistence.md`](../Mechanics/Chains/10-world-tick-to-persistence.md)
- Contract: [`../Engineering/09-mvp-contract-sheet.md#3-world-clock-and-due-work-order`](../Engineering/09-mvp-contract-sheet.md#3-world-clock-and-due-work-order) and [`../Engineering/09-mvp-contract-sheet.md#5-resources-cargo-and-settlement`](../Engineering/09-mvp-contract-sheet.md#5-resources-cargo-and-settlement)
- Decision/challenge: [`../Decisions/ADR-GAME-0021-cp10-extraction-cadence-and-return-handoff.md`](../Decisions/ADR-GAME-0021-cp10-extraction-cadence-and-return-handoff.md) and [`../Validation/27-cp10-extraction-cadence-and-return-preimplementation-challenge.md`](../Validation/27-cp10-extraction-cadence-and-return-preimplementation-challenge.md)
- Predecessor/evidence: [`SK-TASK-029-cp10-first-extraction-and-cargo.md`](SK-TASK-029-cp10-first-extraction-and-cargo.md) and [`../Evidence/SK-EVID-018-cp10-first-extraction-runtime-verification.md`](../Evidence/SK-EVID-018-cp10-first-extraction-runtime-verification.md)

## Evidence status

- Verified: One extraction transaction, schema-v4 provenance, the two-second first marker, and local
  restart/rollback/duplicate guards under `SK-TASK-029`.
- Selected design: Stable per-attempt/resource cargo stack, due + two cadence, atomic return handoff,
  and a 30-second depletion marker without executing respawn.
- Verified: Recurring stack update, capacity/depletion stop reasons, exact event metadata/order,
  rollback, duplicate, malformed, skipped-boundary, and restart guards. The exact claim is bound to
  [`../Evidence/SK-EVID-019-cp10-extraction-cadence-runtime-verification.md`](../Evidence/SK-EVID-019-cp10-extraction-cadence-runtime-verification.md).
- Unknown: return route, home crossing, deposit/coin settlement, respawn execution, simultaneous
  contest policy, weighted capacity, and default all-phase scheduler composition.

## Implementation and verification notes

- `MissionExtractionService` now processes at most one due milestone per attempt at a world boundary.
  It increments the deterministic per-attempt/resource cargo stack by one equal-weight slot, derives
  the successor marker from the consumed due time, and atomically hands the mission and attempt to
  `RETURNING` at capacity or node depletion.
- `PersistenceStore` validates the paired marker, deterministic work/event identities, persisted role
  and tool, equal-weight cargo shape, and server-derived event payload before mutating node, cargo,
  mission, attempt, revisions, cursor, and idempotency state in one transaction. A final node unit
  also writes the existing 30-second timer marker and `ResourceDepleted`.
- The runtime result is [`../Evidence/SK-EVID-019-cp10-extraction-cadence-runtime-verification.md`](../Evidence/SK-EVID-019-cp10-extraction-cadence-runtime-verification.md),
  with cross-functional disposition in [`../Validation/28-cp10-extraction-cadence-runtime-cross-functional-audit.md`](../Validation/28-cp10-extraction-cadence-runtime-cross-functional-audit.md).
  The focused suite passes 21/21 and the affected CP-04 through CP-10 aggregate passes 104/104;
  Node 24 typecheck/build, dependency dry-run, and documentation gates are recorded in the evidence.

## Smallest reversible action

The accepted challenge was followed by failing cadence and boundary-hardening tests. The smallest
implementation extended the existing extraction input/result and transaction to update one cargo
stack, set the next paired due marker or `RETURNING`, validate exact server-derived event payloads,
and persist the required causal event(s) atomically. No public command or scheduler was added.

## Verification and closure target

- Minimum verification completed: Red/Green focused tests for two successive milestones, due cadence,
  aggregate cargo provenance, fifth-slot return, final-node depletion marker, duplicate/stale/
  malformed/race-boundary behavior, exact marker/event guards, rollback, skipped boundary, and
  restart; then the affected CP-04 through CP-10 aggregate, Node 24 typecheck/build, dependency
  dry-run, documentation self-tests/validator, and scoped diff.
- Closure result: `runtime_verified` for recurring extraction and the `RETURNING` handoff only. It
  does not prove return movement, deposit, coins, combat, browser, Agent, WebMCP, Re-entry, hosted
  continuity, or production balance.
- Rollback/remediation: A failed transaction leaves the prior cargo stack, node quantity/timer,
  mission/attempt phase and due markers, revisions, event cursor, and idempotency state unchanged.
- Reopen trigger: per-unit cargo rows, weighted capacity, node reservation, respawn execution, return
  navigation, deposit/coins, new schema/event/contract version, or scheduler composition entering
  this task.
