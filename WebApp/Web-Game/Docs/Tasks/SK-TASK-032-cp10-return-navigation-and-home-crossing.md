# SK-TASK-032: CP-10 Return Navigation and Home Crossing

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-10`
- Owner: Game owner
- Current increment: Closed automatic `RETURNING` to `DEPOSITING` home crossing with reverse-route derivation, exact event/idempotency guards, rollback, and restart proof.
- Next gate: Register and challenge the next bounded CP-10 deposit/coin-settlement task before implementing settlement or mission reissue.

## Identity

- Task ID: `SK-TASK-032`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: This increment crosses durable route derivation, world-clock due ordering, mission
  phase, soldier lifecycle, cargo exposure, event vocabulary, idempotency, restart, and the later
  deposit boundary.

## Objective

Prove that an automatically returning G2 gatherer follows the server-derived reverse of its committed
outbound route and, when it reaches the persisted `home_anchor`, atomically enters `DEPOSITING` with
the same soldier and exposed cargo, ready for a separate settlement transaction.

## Success and non-goals

- Success: Active `RETURNING` attempts derive a deterministic reverse route and return due time from
  persisted state; no client coordinate, browser timer, waypoint cursor, or second route authority is
  accepted.
- Success: At or after the due boundary, one typed transaction changes mission and attempt to
  `DEPOSITING`, updates the attempt transition time, emits one `MissionHomeReached`, and preserves
  `FIELD` soldier identity and cargo exactly.
- Success: Intermediate, delayed, duplicate, stale, ownership, malformed-route, rollback, restart,
  and movement-before-deposit cases remain typed, deterministic, and exactly once.
- Non-goals: cargo removal, Wood/Rock coin credit, `CargoDeposited`, repeat/reissue, recall, moving
  shelters, migration, route replanning, contact/combat, death/respawn, default scheduler composition,
  browser/UI, WebMCP, Re-entry, hosted runtime, multi-worker fairness, schema migration, contract
  version changes, or unrelated applications.

## Scope and authority

- In scope: `src/server/mission-return-service.ts`, the typed persistence input/result and transaction
  in `src/server/persistence/types.ts` and `src/server/persistence/store.ts`, focused return tests,
  the CP-10 fixture vectors, and linked evidence/documentation.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, public command or wire surfaces, deployment,
  credentials, spend, staging, commit, push, and unrelated work.
- Allowed actions: edit scoped game files, add tests/evidence/docs, install a safe missing dependency
  if required, and run the minimum affected verification.
- Revalidate when: route schema, home geometry, shelter migration, recall, contact ordering, settlement,
  event vocabulary, scheduler ownership, or contract version changes.

## Owning authority

- Mission/phase: [`../Mechanics/detail-08-mission-dispatch-return-and-recall.md`](../Mechanics/detail-08-mission-dispatch-return-and-recall.md)
- Navigation: [`../Mechanics/detail-09-navigation-and-pathfinding.md`](../Mechanics/detail-09-navigation-and-pathfinding.md)
- Economy/cargo: [`../Mechanics/detail-11-resource-extraction-cargo-and-deposit.md`](../Mechanics/detail-11-resource-extraction-cargo-and-deposit.md)
- Ordering: [`../Mechanics/Chains/02-dispatch-to-deposit.md`](../Mechanics/Chains/02-dispatch-to-deposit.md) and [`../Mechanics/Chains/10-world-tick-to-persistence.md`](../Mechanics/Chains/10-world-tick-to-persistence.md)
- Contract: [`../Engineering/09-mvp-contract-sheet.md#3-world-clock-and-due-work-order`](../Engineering/09-mvp-contract-sheet.md#3-world-clock-and-due-work-order), [`../Engineering/09-mvp-contract-sheet.md#4-soldier-lifecycle-roles-and-missions`](../Engineering/09-mvp-contract-sheet.md#4-soldier-lifecycle-roles-and-missions), and [`../Engineering/09-mvp-contract-sheet.md#7-event-revision-and-persistence-envelope`](../Engineering/09-mvp-contract-sheet.md#7-event-revision-and-persistence-envelope)
- Decision/challenge: [`../Decisions/ADR-GAME-0023-cp10-return-navigation-and-home-crossing.md`](../Decisions/ADR-GAME-0023-cp10-return-navigation-and-home-crossing.md) and [`../Validation/31-cp10-return-navigation-preimplementation-challenge.md`](../Validation/31-cp10-return-navigation-preimplementation-challenge.md)
- Predecessor/evidence: [`SK-TASK-031-cp10-contested-node-outcome.md`](SK-TASK-031-cp10-contested-node-outcome.md), [`../Evidence/SK-EVID-020-cp10-contested-node-runtime-verification.md`](../Evidence/SK-EVID-020-cp10-contested-node-runtime-verification.md), and [`../Validation/30-cp10-contested-node-runtime-cross-functional-audit.md`](../Validation/30-cp10-contested-node-runtime-cross-functional-audit.md)

## Evidence status

- Verified: CP-09 route arrival derives positions from durable waypoints and world time; CP-10
  extraction, same-worker contest, and `RETURNING` handoffs preserve the route, home anchor, cargo,
  and last transition time.
- Inferred: Reversing the immutable fixture route and deriving a due time from the persisted handoff is
  the smallest restart-safe return boundary and avoids a schema cursor.
- Unknown: deposit settlement, recall from arbitrary field positions, moving home anchors, route
  replanning, combat at home, default all-phase scheduler composition, and hosted continuity.

## Smallest reversible action

Add the accepted Challenge/ADR, a typed home-arrival store contract, and a focused failing test for an
intermediate and due return. Implement only the reverse-route/`DEPOSITING` transition; stop if it
requires a new schema, shelter geometry authority, teleport, settlement effect, or scheduler.

## Verification and closure target

- Minimum verification: Red/Green focused tests for intermediate and due return, delayed recovery,
  duplicate/stale/ownership/malformed guards, cargo preservation, event cursor/order, rollback,
  restart, and the movement-before-deposit boundary; then the CP-09 route plus CP-10 extraction/
  contest aggregate, Node 24 typecheck/build, dependency dry-run, documentation gates, and scoped diff.
- Closure target: `runtime_verified` for automatic G2 return navigation and home crossing only.
- Rollback or remediation: A failed transaction leaves `RETURNING`, cargo, revisions, event cursor,
  and idempotency state unchanged; a malformed route enters typed recovery rather than teleporting.
- Reopen trigger: recall, moving shelter, route replanning, combat/contact at crossing, deposit/coins,
  default scheduler, schema/event/contract version change, WebMCP/Re-entry action, or hosted execution
  entering this boundary.

## Implementation and closure result

The return service now derives a projection-only reverse of the immutable CP-09 route from the
persisted home anchor and the `RETURNING` handoff time. At the due or delayed movement boundary, the
specialized persistence transaction re-reads the active mission, attempt, soldier, route, and
revisions, then commits `RETURNING → DEPOSITING` and one `MissionHomeReached` event exactly once.
Cargo remains exposed and unchanged, the soldier remains `FIELD`, and shelter coins are untouched
until a later deposit transaction. No schema, public command, default scheduler, browser, WebMCP,
Re-entry, combat, or hosted behavior was added.

The focused return suite passed 9/9, the CP-09/CP-10 transitive return aggregate passed 53/53, and
the affected CP-04 through CP-10 aggregate passed 126/126 under Node 24. Typecheck, production
build, dependency dry-run, documentation gates, and scoped diff checks passed. The post-implementation
review is [`../Validation/32-cp10-return-navigation-runtime-cross-functional-audit.md`](../Validation/32-cp10-return-navigation-runtime-cross-functional-audit.md), and the executed result is [`../Evidence/SK-EVID-021-cp10-return-navigation-runtime-verification.md`](../Evidence/SK-EVID-021-cp10-return-navigation-runtime-verification.md).

This task is closed as `runtime_verified` for the local automatic G2 return-navigation and exact
home-anchor crossing boundary only; deposit, coins, recall, migration, combat, browser, WebMCP,
Re-entry, hosted scheduling, and multi-worker fairness remain outside its claim.
