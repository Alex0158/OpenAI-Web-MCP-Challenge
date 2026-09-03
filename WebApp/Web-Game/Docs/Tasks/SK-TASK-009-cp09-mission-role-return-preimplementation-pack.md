# SK-TASK-009: CP-09 Mission, Role, Return, and Recall Pre-Implementation Pack

## Task Control

- Lifecycle state: `verified`
- Closure type: `specified`
- Checkpoint: `CP-09`
- Owner: Game owner
- Current increment: Cross-functional CP-09 mission, role-lock, return, recall, identity, and handoff preparation is complete; no runtime code has started.
- Next gate: After CP-08 route and full-resync runtime closure, implement one valid gatherer dispatch and one role-lock rejection before adding settlement or combat races.

## Identity

- Task ID: SK-TASK-009
- Date: 2026-09-02
- Risk profile: Assured
- Reason for profile: The checkpoint crosses soldier identity, role/tool lock, route ownership, stale revisions, return/cargo risk, combat boundaries, and future extraction/Re-entry handoffs.

## Objective

Prepare a reviewable CP-09 contract and fixture package for resident/field soldier state, role and
loadout lock, mission attempts, route/home-anchor handoff, full-pack/target-depletion return, forced
recall, terminal outcomes, and same-identity reissue without implementing movement, settlement, or combat.

## Success and non-goals

- Success: The cross-functional audit names CP-08/10/11/12/13/14 handoffs, the scenario pack covers
  valid/invalid/duplicate dispatch, role lock, recall, combat boundary, home deposit ordering, death and
  reissue, stale context, reconnect, and reset isolation, and open role/recall schemas remain visible.
- Non-goals: Mission runtime, movement/pathfinding runtime, extraction, cargo/coin settlement, combat,
  PvP, siege, migration, breach, guard/siege G2 commands, WebMCP, Re-entry delivery, or hosted deployment.

## Scope and authority

- In scope: [CP-08/09 preparation audit](../Validation/09-cp08-cp09-preimplementation-audit.md), [CP-09 mission fixtures](../Scenarios/09-cp09-mission-role-return-fixtures.md), mission/role/identity cross-checks, and CP-09 implementation entry gates.
- Out of scope: CP-05 persistence, CP-06 clock, CP-07 fixture, CP-08 movement/realtime runtime, reentry-core/, mvp/, RightSpot, and external Receiver/Connector changes.
- Allowed actions: Read and write the task-owned preparation documents; run documentation validators; do not edit runtime code or alter the accepted contract.
- Revalidate when: The mission phase/lifecycle vocabulary, role/tool table, command envelope, route/home-anchor
  contract, cargo settlement order, combat/death handoff, or Re-entry recall boundary changes.

## Owning authority

- Owning module documents: [role lock](../Mechanics/detail-07-role-and-loadout-lock.md), [mission lifecycle](../Mechanics/detail-08-mission-dispatch-return-and-recall.md), and [soldier identity](../Mechanics/detail-06-soldier-identity-and-lifecycle.md).
- Owning contract section: [soldier lifecycle, roles, and missions](../Engineering/09-mvp-contract-sheet.md#4-soldier-lifecycle-roles-and-missions) and sections 7–10.
- Controlling decisions: [ADR-GAME-0002](../Decisions/ADR-GAME-0002-continuous-world-and-mission-authority.md), [ADR-GAME-0006](../Decisions/ADR-GAME-0006-mvp-contract-and-reentry-boundary.md), and [ADR-GAME-0010](../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md).
- Constraining scenarios: [CP-07 fixture](../Scenarios/07-cp07-deterministic-world-fixture.md), [CP-08 fixtures](../Scenarios/08-cp08-projection-pathfinding-fixtures.md), and [dispatch chain](../Mechanics/Chains/02-dispatch-to-deposit.md).

## Evidence status

- Verified: Stable soldier_id, new mission_attempt_id per dispatch/reissue, separate lifecycle/phase/
  encounter state machines, G2 gatherer/hunter commands, role/loadout lock at dispatch, normal return and
  recall semantics, full/target-depleted return policies, stale revision/idempotency envelope, and same-
  identity respawn/reissue boundary.
- Inferred: A minimal first implementation should prove dispatch and role lock before settlement or combat;
  rejecting recall during active resolution is lower risk than introducing deferred intent.
- Unknown: Exact dispatch/recall argument shape, tool-tier matrix, target-intelligence legality, combat-time
  recall behavior, mission-history retention, and CP-10/11 handoff timing.

## Smallest reversible action

After CP-08 exposes an authoritative route and full snapshot, implement one valid gatherer dispatch and
one role-lock rejection through the shared command gateway. Stop if route arrival, home-anchor identity,
entity revisions, or the combat/death handoff cannot be validated without adding a second state machine.

## Verification and closure target

- Minimum verification: Documentation level 1–2 now; CP-09 runtime target is level 3–5 with valid/invalid/
  duplicate commands, stale revisions, recall travel, reconnect, and death/combat boundary fixtures.
- Closure target: specified for this preparation task; CP-09 implementation may later target
  contract_verified or slice_verified according to actual evidence.
- Rollback or remediation: Preserve mission history and stable identity, reject or park the unverified
  command at a typed boundary, and return to the existing role/route contract; never clone a soldier or
  silently change role.
- Reopen trigger: Any change to mission phases, role/tool lock, recall during combat, route/home-anchor
  ownership, cargo/deposit ordering, death/reissue policy, or Agent recall authority.

