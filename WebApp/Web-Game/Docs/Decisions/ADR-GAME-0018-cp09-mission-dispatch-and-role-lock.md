# ADR-GAME-0018: CP-09 Mission Dispatch and Role Lock

**Status:** ACCEPTED LOCAL CP-09 IMPLEMENTATION BOUNDARY
**Date:** 2026-09-02
**Scope:** `SK-TASK-027`, one resident GATHERER dispatch and field role-lock rejection
**Related challenge:** [`../Validation/21-cp09-gatherer-dispatch-preimplementation-challenge.md`](../Validation/21-cp09-gatherer-dispatch-preimplementation-challenge.md)
**Predecessors:** [`ADR-GAME-0006-mvp-contract-and-reentry-boundary.md`](ADR-GAME-0006-mvp-contract-and-reentry-boundary.md), [`ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md`](ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md), and [`ADR-GAME-0015-cp08-worker-command-read-gateway.md`](ADR-GAME-0015-cp08-worker-command-read-gateway.md)

## Context

CP-08 now exposes a durable soldier roster, an authoritative fixture map, and a FIFO worker gateway,
but no command can assign a soldier. The CP-09 preparation pack requires role and loadout to lock at
dispatch, a fresh mission attempt to preserve stable soldier identity, and a route/home-anchor handoff
that later extraction and return work can consume. The current schema stores only generic mission
columns and cannot represent the phase or route plan without either losing information or hiding it in
an opaque scheduler field.

The first implementation must establish the assignment boundary without claiming that a route has
been travelled, a node has been mined, or cargo has been settled.

## Decisions

### 1. Internal schema version 3 carries the assignment handoff

The persistence schema advances from version 2 (`cp08-001`) to version 3 (`cp09-001`) while the
gameplay contract remains `SK-MVP-0.2`. The migration is transactional and supports both existing
schema 1 and schema 2 databases. First-run schema creation and migration expose the same fields.

`mission` adds `phase`, `tool`, `return_policy`, and `active_attempt_id` alongside its existing role
and target fields. `mission_attempt` adds `phase`, `role`, `tool`, `equipment_tier`, `target_id`,
`route_json`, `home_anchor_json`, `return_policy`, `start_world_time`, and
`last_transition_world_time`. The fields are structured persistence, not a client snapshot or a
second scheduler.

### 2. One atomic server dispatch owns the state transition

`MissionService.assignSoldierMission()` is exposed through the existing `WorkerCommandGateway` FIFO.
The service derives the shelter owner and fixture coordinates from the server store, validates the
expected soldier revision and idempotency key, and asks the store to commit one transaction that:

1. updates the resident soldier to `state = FIELD`, role `GATHERER`, and the selected tool;
2. creates one stable `mission_id` and fresh `mission_attempt_id` with `phase = TRAVELLING`;
3. records a deterministic route plan, the current shelter home anchor, return policy, and world time;
4. appends one `MissionDispatched` event with all affected entity revisions; and
5. inserts the original result under the command idempotency key.

No travel milestone is processed, no movement step occurs, and no extraction, cargo row, or coin is
created here. The route handoff may carry the scheduler's deterministic arrival due marker; a later
worker milestone owns its consumption as defined by
[`ADR-GAME-0019`](ADR-GAME-0019-cp09-route-milestone-and-derived-transit.md). Dispatch itself never
advances world time beyond the command's committed boundary.

The one-active-attempt invariant is checked inside the same transaction using `active_attempt_id` and
the soldier's current lifecycle. A duplicate key returns the original result with `duplicate = true`;
a stale revision, wrong owner, occupied soldier, unavailable target, or incompatible tool rolls back
without an event or mission row.

### 3. GATHERER role and route matrix is deliberately small

This task accepts only the active G2 GATHERER role and tier-one tools:

| Target | Required tool | Return policy default | Route source |
|---|---|---|---|
| Wood node owned by the player's shelter | `AXE` | `WHEN_FULL` | server fixture shelter anchor |
| Rock node owned by the player's shelter | `PICKAXE` | `WHEN_FULL` | server fixture shelter anchor |

The target id, ownership, resource type, coordinates, and home anchor are server-derived. The route is
an open-grid Manhattan plan with deterministic x-then-y neighbour order, inclusive source and target
coordinates, the fixture map fingerprint as its walkability version, and a bounded estimated travel
time at the accepted 3.0 tiles per world second. It is a plan record only; arrival remains a later
worker milestone.

HUNTER dispatch, extraction, target depletion, recall, return, deposit, combat, and reissue remain
later CP-09 through CP-11 increments. They must reuse the same identity and phase fields rather than
inventing parallel records.

### 4. Role lock is a typed server rejection

Once a soldier is `FIELD` with an active attempt, any assignment that would change role or tool is
rejected as `ROLE_LOCKED`. The current mission, route, target, cargo risk, and identity remain
unchanged. A new role is accepted only after a later return, respawn, or terminal transition returns
the soldier to a legal shelter command state.

## Alternatives rejected or deferred

- **Encode route data in `work_id`:** rejected because it hides a cross-checkpoint contract and makes
  dashboard/recovery validation impossible.
- **Write soldier, mission, and event in separate calls:** rejected because partial dispatch would
  violate exactly-once state/event/idempotency ordering.
- **Accept client route or target coordinates:** rejected because route and visibility are server
  authority.
- **Implement travel/extraction/recall now:** deferred to their own clock and settlement tasks; this
  increment must remain a reviewable assignment boundary.
- **Change to a new `SK-MVP` contract:** deferred; the schema extension does not change accepted game
  event order or player-facing outcomes.

## Verification and reopen triggers

The implementation must prove schema migration, valid dispatch, duplicate replay, stale revision,
ownership/target/tool rejection, field role lock, one active attempt, route determinism, event and
idempotency atomicity, gateway FIFO, and unchanged CP-08 behavior. Reopen if a second state machine,
timer, worker, client authority, cargo/coin effect, or contract revision is needed.

## Consequences

The game gains a durable assignment boundary that the next extraction and return tasks can consume. A
successful dispatch is visible in soldier state and mission history, but the soldier remains at the
route's starting anchor until a later scheduler implementation advances it. The schema migration adds
no gameplay effect by itself and preserves old world data.
