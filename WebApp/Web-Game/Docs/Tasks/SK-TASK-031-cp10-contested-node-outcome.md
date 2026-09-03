# SK-TASK-031: CP-10 Contested Node Outcome

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-10`
- Owner: Game owner
- Current increment: Closed the deterministic same-worker same-node outcome, including final-unit loser return, pre-empty target preservation, exact event/idempotency guards, rollback, restart, and clock continuation.
- Next gate: Register and challenge the next bounded CP-10 return-navigation/home-crossing task before implementing settlement.

## Identity

- Task ID: `SK-TASK-031`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: This increment crosses due-work ordering, node/cargo ownership, mission phase,
  event history, idempotency, restart, and world-clock recovery while deliberately avoiding a schema
  or contract-version change.

## Objective

Resolve the normal same-node GATHERER contest at one world boundary as a deterministic, replayable
outcome: the first serialized attempt consumes an available unit, and an attempt that finds the node
depleted is atomically handed to `RETURNING` with preserved field cargo instead of blocking the world.

## Success and non-goals

- Success: Due attempts are evaluated in `(dueWorldTime, missionAttemptId)` order with authoritative
  state reloaded before each decision; a final-unit winner emits the existing depletion event once,
  and the loser emits one `MissionAutoReturned(reason = TARGET_DEPLETED)` without node mutation.
- Success: Two units allow two same-boundary attempts to extract one each; a pre-depleted target can
  return a mission with existing cargo; duplicate, stale, forged, rollback, restart, event-order,
  and world-clock-continuation paths remain exact and visible.
- Success: The existing CP-10 extraction result and all previous affected tests remain compatible;
  no world boundary enters `recovery_blocked` for the normal single-worker contest.
- Non-goals: node reservation or distributed fairness, multiple authoritative workers, schema/event/
  contract version changes, combat, return route movement, recall, home crossing, deposit, coins,
  respawn execution, browser/UI, WebMCP, Re-entry, hosted scheduling, or unrelated applications.

## Scope and authority

- In scope: `src/server/mission-extraction-service.ts`, `src/server/persistence/types.ts`,
  `src/server/persistence/store.ts`, focused CP-10 contest tests, and linked evidence/documentation.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, public surfaces, deployment, credentials, spend,
  staging, commit, push, and unrelated work.
- Allowed actions: edit scoped game files, add tests/evidence/docs, install a safe missing dependency
  if required, and run the minimum affected verification.
- Revalidate when: worker ownership, due ordering, contest/fairness, cargo semantics, event vocabulary,
  schema/contract shape, or return/deposit/combat handoff changes.

## Owning authority

- Economy: [`../Mechanics/detail-11-resource-extraction-cargo-and-deposit.md`](../Mechanics/detail-11-resource-extraction-cargo-and-deposit.md)
- Mission/phase: [`../Mechanics/detail-08-mission-dispatch-return-and-recall.md`](../Mechanics/detail-08-mission-dispatch-return-and-recall.md)
- Ordering: [`../Mechanics/Chains/10-world-tick-to-persistence.md`](../Mechanics/Chains/10-world-tick-to-persistence.md)
- Contract: [`../Engineering/09-mvp-contract-sheet.md#5-resources-cargo-and-settlement`](../Engineering/09-mvp-contract-sheet.md#5-resources-cargo-and-settlement)
- Decision/challenge: [`../Decisions/ADR-GAME-0022-cp10-contested-node-outcome.md`](../Decisions/ADR-GAME-0022-cp10-contested-node-outcome.md) and [`../Validation/29-cp10-contested-node-preimplementation-challenge.md`](../Validation/29-cp10-contested-node-preimplementation-challenge.md)
- Predecessor/evidence: [`SK-TASK-030-cp10-extraction-cadence-and-return-handoff.md`](SK-TASK-030-cp10-extraction-cadence-and-return-handoff.md), [`../Evidence/SK-EVID-019-cp10-extraction-cadence-runtime-verification.md`](../Evidence/SK-EVID-019-cp10-extraction-cadence-runtime-verification.md), and [`../Validation/28-cp10-extraction-cadence-runtime-cross-functional-audit.md`](../Validation/28-cp10-extraction-cadence-runtime-cross-functional-audit.md)

## Evidence status

- Verified: CP-10 extraction protects node quantity with expected revisions and one transaction; due
  attempts are listed by due time and attempt id; a same-boundary loser or cargo-bearing pre-empty
  mission receives a typed `TARGET_DEPLETED` return, while a pre-empty no-cargo target remains a
  visible `TARGET_UNAVAILABLE` recovery outcome.
- Selected design: no reservation; reload before each candidate; existing extraction for available
  units; a dedicated atomic target-depleted return transaction for the explicit zero-node return cases.
- Inferred: this is the smallest coherent fix under the one-worker-per-world authority and keeps the
  later return/deposit chain unchanged.
- Unknown: multi-worker fairness, hosted scheduler ownership, combat interruption, and all return or
  settlement behavior.

## Smallest reversible action

Add the contest challenge/ADR and failing same-node tests, then add the smallest typed auto-return
store contract and service branch. Stop if it requires a reservation schema, new contract/event
version, second scheduler, client authority, or return/deposit effect.

## Verification and closure target

- Minimum verification: Red/Green focused contest tests for deterministic order, two-unit sharing,
  final-unit winner/loser, pre-empty target handling, duplicate/stale/forged input, rollback, restart,
  event cursor/order, and clock continuation; then affected CP-04 through CP-10 aggregate, Node 24
  typecheck/build, dependency dry-run, documentation self-tests/validator, and scoped diff.
- Closure target: `runtime_verified` for same-worker contest outcome and world-clock continuation only.
- Rollback/remediation: Any failed transaction leaves node, cargo, mission/attempt phase and due
  markers, revisions, event history, and idempotency unchanged. Positive-quantity stale races remain
  typed recovery, not silent loss.
- Reopen trigger: reservation/fairness or multi-worker ownership, new schema/event/contract version,
  combat, return navigation, deposit/coins, browser/WebMCP/Re-entry, or hosted scheduling entering
  this boundary.

## Implementation and closure result

The service now reloads each due candidate, tracks nodes depleted by an earlier ordered attempt in the
current boundary, and preserves a pre-empty no-cargo `TARGET_UNAVAILABLE` failure. The persistence
store owns the worker binding, due marker, cargo aggregate, event identity, and atomic
`WORKING → RETURNING` handoff for a valid target-depleted outcome. No schema, event vocabulary, or
contract version changed. The post-implementation review is [`../Validation/30-cp10-contested-node-runtime-cross-functional-audit.md`](../Validation/30-cp10-contested-node-runtime-cross-functional-audit.md), and the executed result is [`../Evidence/SK-EVID-020-cp10-contested-node-runtime-verification.md`](../Evidence/SK-EVID-020-cp10-contested-node-runtime-verification.md).

The focused contest suite passed 17/17, the CP-10 pair passed 29/29, and the affected CP-04 through
CP-10 aggregate passed 112/112 under Node 24. Typecheck, production build, dependency dry-run,
documentation gates, and scoped diff checks passed. This task is closed as `runtime_verified` for the
single-worker local boundary only; return navigation, deposit, coins, combat, browser, WebMCP,
Re-entry, hosted scheduling, and multi-worker fairness remain outside its claim.
