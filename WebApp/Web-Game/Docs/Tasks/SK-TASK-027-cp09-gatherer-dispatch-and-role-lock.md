# SK-TASK-027: CP-09 Gatherer Dispatch and Role Lock

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-09`
- Owner: Game owner
- Current increment: Verified one atomic server-owned GATHERER dispatch from a resident soldier to an owned Wood/Rock target, persisted its mission/attempt route handoff, and rejected field role/tool changes.
- Next gate: Register and challenge the next bounded CP-09 milestone task for advancing a planned mission route; do not claim arrival, extraction, return, or settlement from this task.

## Identity

- Task ID: `SK-TASK-027`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: This increment changes persistence schema and crosses soldier identity, mission
  phase, role/loadout lock, route ownership, stale revisions, idempotency, event ordering, and the
  CP-08 worker gateway.

## Objective

Provide one durable `assign_soldier_mission` command for a resident GATHERER. The server derives a
legal owned Wood/Rock target and deterministic route/home anchor, creates one fresh mission attempt,
locks role/tool, and moves the soldier to field travel in one transaction. A field reassignment is a
typed `ROLE_LOCKED` rejection.

## Success and non-goals

- Success: A valid tier-one Wood→AXE or Rock→PICKAXE dispatch creates one stable mission, one fresh
  mission attempt, one `MissionDispatched` event, one idempotency result, and a `FIELD`/`TRAVELLING`
  state with current revisions.
- Success: Duplicate, stale, wrong-owner, unavailable-target, occupied-soldier, and incompatible-tool
  commands commit no partial assignment; an in-field role/tool change is rejected visibly.
- Success: Schema 2 databases migrate transactionally to schema 3, and repeated route planning from
  the same fixture is deterministic.
- Non-goals: HUNTER dispatch, route traversal, world scheduler, extraction, cargo, return, recall,
  deposit, coins, combat, reissue, Canvas/dashboard UI, WebMCP, Re-entry, hosted deployment, or a
  contract-version change.

## Scope and authority

- In scope: CP-09 schema migration, persistence dispatch transaction and mission/attempt reads,
  `MissionService`, worker-gateway FIFO method, fixture route planning, focused tests, and linked
  evidence/validation updates.
- Out of scope: `reentry-core/`, `mvp/`, `RightSpot`, external Receiver/Connector, deployment,
  credentials, spend, staging, commit, push, and public communication.
- Allowed actions: Read/edit scoped game files, update the internal schema, install no new dependency,
  write focused tests/evidence, and run minimum affected verification.
- Revalidate when: the mission phase/role/tool contract, schema/version, route authority, soldier
  lifecycle, command envelope, or CP-08 gateway lifecycle changes.

## Owning authority

- Decision: [`../Decisions/ADR-GAME-0018-cp09-mission-dispatch-and-role-lock.md`](../Decisions/ADR-GAME-0018-cp09-mission-dispatch-and-role-lock.md)
- Mission and role: [`../Mechanics/detail-07-role-and-loadout-lock.md`](../Mechanics/detail-07-role-and-loadout-lock.md) and [`../Mechanics/detail-08-mission-dispatch-return-and-recall.md`](../Mechanics/detail-08-mission-dispatch-return-and-recall.md)
- Identity and route: [`../Mechanics/detail-06-soldier-identity-and-lifecycle.md`](../Mechanics/detail-06-soldier-identity-and-lifecycle.md) and [`../Mechanics/detail-09-navigation-and-pathfinding.md`](../Mechanics/detail-09-navigation-and-pathfinding.md)
- Contract and chain: [`../Engineering/09-mvp-contract-sheet.md#4-soldier-lifecycle-roles-and-missions`](../Engineering/09-mvp-contract-sheet.md#4-soldier-lifecycle-roles-and-missions) and [`../Mechanics/Chains/02-dispatch-to-deposit.md`](../Mechanics/Chains/02-dispatch-to-deposit.md)
- Preparation and scenario: [`../Validation/21-cp09-gatherer-dispatch-preimplementation-challenge.md`](../Validation/21-cp09-gatherer-dispatch-preimplementation-challenge.md) and [`../Scenarios/09-cp09-mission-role-return-fixtures.md`](../Scenarios/09-cp09-mission-role-return-fixtures.md)
- Predecessor: [`../Tasks/SK-TASK-026-cp08-entrypoint-realtime-wire-adapter.md`](SK-TASK-026-cp08-entrypoint-realtime-wire-adapter.md)

## Evidence status

- Verified: CP-08 provides the file-backed store, stable five-soldier fixture roster, server-owned
  coordinates, worker gateway FIFO, and current revision/idempotency/event contracts.
- Verified: [`SK-EVID-016`](../Evidence/SK-EVID-016-cp09-gatherer-dispatch-runtime-verification.md)
  and [`Validation/22`](../Validation/22-cp09-gatherer-dispatch-runtime-cross-functional-audit.md)
  cover schema migration, atomic dispatch, deterministic route planning, typed rejection, duplicate
  replay, and the serialized one-soldier race.
- Inferred: route traversal and a first due milestone are the smallest coherent next handoff without
  adding extraction, return, or settlement to this task.
- Unknown: exact hunter/tool-tier matrix, route traversal milestones, extraction timing, recall during
  contact, mission history projection, and later return/deposit handoff.

## Smallest reversible action

Add the schema-v3 columns and one gateway-backed GATHERER dispatch operation. Stop if the store cannot
atomically create mission/attempt/event/idempotency state, if target/route authority needs client data,
or if role lock requires a second state machine.

## Verification and closure target

- Minimum verification completed: Red/Green schema migration and dispatch tests for valid, duplicate,
  stale, owner/target/tool rejection, field role lock, route determinism, event/idempotency atomicity,
  and gateway FIFO; CP-04 through CP-09 aggregate, typecheck, build, and documentation validators.
- Closure target: `runtime_verified` for one local GATHERER assignment boundary only. No mission travel,
  extraction, economy, combat, browser, Agent, WebMCP, or hosted claim follows.
- Rollback or remediation: reject the assignment at a typed boundary and preserve CP-08 behavior; do
  not leave partially inserted mission rows or alter the accepted contract.
- Reopen trigger: client-controlled scope/route, duplicate active attempt, partial transaction,
  schema incompatibility, added timer, or any need for travel/settlement/combat in this increment.
