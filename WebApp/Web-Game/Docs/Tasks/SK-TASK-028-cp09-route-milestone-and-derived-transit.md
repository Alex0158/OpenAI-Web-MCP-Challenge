# SK-TASK-028: CP-09 Route Milestone and Derived Transit

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-09`
- Owner: Game owner
- Current increment: Verified one local, restart-safe GATHERER route-to-arrival boundary with due-marker migration and clock-boundary guards.
- Next gate: Register and challenge the next bounded CP-10 extraction/cargo task; do not claim economy, return, deposit, or coin behavior from this task.

## Identity

- Task ID: `SK-TASK-028`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: This increment consumes authoritative world time, changes mission phase and due-work metadata, and crosses persistence, event ordering, identity, restart recovery, and later extraction handoffs.

## Objective

Advance one dispatched GATHERER through its committed route over authoritative world time and commit
one server-owned `TRAVELLING` to `WORKING` arrival transition at the deterministic due boundary.

## Success and non-goals

- Success: Dispatch arms one due arrival marker; the server derives deterministic in-transit position
  from the route and world time; the movement phase atomically commits mission and attempt arrival,
  emits one `MissionWorking` event, and preserves stable identities and revisions.
- Success: Duplicate, stale, concurrent, restart, and bounded catch-up paths do not duplicate arrival,
  skip the event, or create cargo/coins.
- Non-goals: Per-waypoint durable cursor/events, HUNTER dispatch, extraction, node depletion, cargo,
  return, recall, encounters, combat, death, reissue, browser/dashboard projection, WebMCP, Re-entry,
  default-world bootstrap, hosted scheduling, or a new schema/event/contract version.

## Scope and authority

- In scope: route transit derivation and arrival transaction in `src/server/mission-travel-service.ts` and
  `src/server/persistence/store.ts`, the existing world-clock movement-phase seam, typed records and
  focused CP-09 tests, plus linked documentation and evidence.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, public surfaces, deployment, credentials, spend,
  staging, commit, push, and unrelated work.
- Allowed actions: Read/edit scoped game files, install no dependency, write tests/evidence, and run
  the minimum affected verification.
- Revalidate when: route/target mutability, movement rate, event vocabulary, scheduler ownership,
  mission phase, snapshot shape, or extraction/encounter ordering changes.

## Owning authority

- Mission lifecycle: [`../Mechanics/detail-08-mission-dispatch-return-and-recall.md`](../Mechanics/detail-08-mission-dispatch-return-and-recall.md)
- Navigation: [`../Mechanics/detail-09-navigation-and-pathfinding.md`](../Mechanics/detail-09-navigation-and-pathfinding.md)
- Clock and ordering: [`../Mechanics/detail-01-world-clock-and-continuity.md`](../Mechanics/detail-01-world-clock-and-continuity.md) and [`../Mechanics/Chains/10-world-tick-to-persistence.md`](../Mechanics/Chains/10-world-tick-to-persistence.md)
- Contract: [`../Engineering/09-mvp-contract-sheet.md#3-world-clock-and-due-work-order`](../Engineering/09-mvp-contract-sheet.md#3-world-clock-and-due-work-order) and [`../Engineering/09-mvp-contract-sheet.md#4-soldier-lifecycle-roles-and-missions`](../Engineering/09-mvp-contract-sheet.md#4-soldier-lifecycle-roles-and-missions)
- Decision and challenge: [`../Decisions/ADR-GAME-0019-cp09-route-milestone-and-derived-transit.md`](../Decisions/ADR-GAME-0019-cp09-route-milestone-and-derived-transit.md) and [`../Validation/23-cp09-route-milestone-preimplementation-challenge.md`](../Validation/23-cp09-route-milestone-preimplementation-challenge.md)
- Scenario and predecessor: [`../Scenarios/09-cp09-mission-role-return-fixtures.md`](../Scenarios/09-cp09-mission-role-return-fixtures.md) and [`SK-TASK-027-cp09-gatherer-dispatch-and-role-lock.md`](SK-TASK-027-cp09-gatherer-dispatch-and-role-lock.md)

## Evidence status

- Verified: CP-08 supplies the worker-owned clock phase seam, integer boundary order, file-backed
  restart, and stable route/fixture identity. CP-09 dispatch supplies the route, start time, and
  mission/attempt revisions. This task supplies due-marker persistence, derived transit, and the
  atomic arrival handoff.
- Inferred: Derived transit plus one arrival event is the smallest coherent route increment that keeps
  the accepted G2 vocabulary and avoids premature per-cell persistence.
- Unknown: Intermediate encounter detection, route invalidation, moving targets, production terrain
  modifiers, and default hosted scheduler composition.

## Implementation and verification notes

- Added `MissionTravelService` and `deriveRoutePosition` as the server-owned route projection and
  arrival boundary. `PersistenceStore` now persists and queries paired nullable due markers, and the
  existing schema migration adds them to schema-2 mission rows atomically.
- The movement handler validates world-time adjacency, active-attempt identity, role/tool/target
  parity, route status, and due-marker parity before one `commitTransition` writes the phase changes,
  revisions, world boundary, `MissionWorking`, and idempotency state.
- Contract-first Red/Green coverage is recorded in
  [`../Evidence/SK-EVID-017-cp09-route-milestone-runtime-verification.md`](../Evidence/SK-EVID-017-cp09-route-milestone-runtime-verification.md).
  The route suite passes 6/6, the dispatch suite passes 9/9, and the CP-04 through CP-09 aggregate
  passes 88/88. Typecheck, production build, Node 24 dependency dry-run, documentation self-tests,
  documentation validation, and scoped diff checks also pass.
- The cross-functional disposition is
  [`../Validation/24-cp09-route-milestone-runtime-cross-functional-audit.md`](../Validation/24-cp09-route-milestone-runtime-cross-functional-audit.md).

## Smallest reversible action

Add the pure route-position/due calculation and one atomic arrival transaction, then expose it only
through the existing movement phase handler. Stop if it needs a new event, schema version, client
coordinate authority, extraction effect, or a second scheduler.

## Verification and closure target

- Minimum verification completed: Red/Green focused tests for due marker, midpoint determinism, arrival
  event and revision atomicity, duplicate/stale/concurrent retry, skipped-boundary rejection, restart
  and due-boundary recovery, plus the affected CP-09 aggregate, typecheck, build, and documentation
  validators.
- Closure target: `runtime_verified` for one local route-to-arrival boundary only. It does not prove
  extraction, encounters, browser, Agent, WebMCP, deployment, or hosted continuity.
- Rollback or remediation: Leave the mission `TRAVELLING` and due work retryable on failure; preserve
  the CP-09 dispatch boundary and reject invalid route or phase data visibly.
- Reopen trigger: A route mutation, target movement, changed speed, duplicate event, stale write,
  skipped recovery milestone, new event/schema/contract requirement, or any settlement/combat effect.
