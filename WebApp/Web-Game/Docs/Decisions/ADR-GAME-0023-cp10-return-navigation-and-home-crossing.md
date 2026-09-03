# ADR-GAME-0023: CP-10 Return Navigation and Home Crossing

**Status:** ACCEPTED LOCAL CP-10 IMPLEMENTATION BOUNDARY  
**Date:** 2026-09-02  
**Scope:** `SK-TASK-032`, automatic G2 gatherer return from a resource node to `DEPOSITING`  
**Related challenge:** [`../Validation/31-cp10-return-navigation-preimplementation-challenge.md`](../Validation/31-cp10-return-navigation-preimplementation-challenge.md)  
**Predecessors:** [`ADR-GAME-0019-cp09-route-milestone-and-derived-transit.md`](ADR-GAME-0019-cp09-route-milestone-and-derived-transit.md), [`ADR-GAME-0021-cp10-extraction-cadence-and-return-handoff.md`](ADR-GAME-0021-cp10-extraction-cadence-and-return-handoff.md), and [`ADR-GAME-0022-cp10-contested-node-outcome.md`](ADR-GAME-0022-cp10-contested-node-outcome.md)

## Context

CP-09 already persists one immutable outbound route, a shelter `home_anchor`, an estimated travel
duration, and a world-time arrival marker. CP-10 now hands a full or depleted extraction attempt to
`RETURNING`, clears the extraction marker, and records the handoff time while preserving exposed cargo.
The next player-visible boundary is the soldier travelling home and entering `DEPOSITING`. Adding a
second route record, a durable waypoint cursor, a client coordinate, or deposit settlement here would
create a new authority or mix movement and economy effects before either is proven.

## Decisions

### 1. Reverse the immutable outbound route

The return service validates the persisted route and requires `route.source == home_anchor`. It derives
a projection-only route with reversed waypoints, swapped source/target, the same walkability version,
and the same estimated duration. The database retains one route plan per attempt; no waypoint event or
return cursor is added for the G2 fixture.

### 2. Derive return due work from durable state

The `last_transition_world_time` written by the `RETURNING` handoff is the return start. The return due
time is `last_transition_world_time + route.estimatedTravelWorldSeconds`. The service reads active
`RETURNING` attempts, orders due work by `(returnDueWorldTime, missionAttemptId)`, and derives position
from the reverse route and authoritative world time. A delayed boundary may complete an already due
route once; a browser timer never advances it.

### 3. Use exact home-anchor arrival

The G2 home boundary is the reversed route target itself: the derived position must be the persisted
`home_anchor` at or after the due boundary. This avoids introducing an unowned shelter-radius geometry
rule. Migration and a moving home anchor remain later decisions; a future moving shelter must reopen
this ADR rather than silently changing the target.

### 4. Commit one typed home-arrival transition

The store owns a specialized atomic transaction that validates the worker binding, active attempt,
`RETURNING` phases, `FIELD` soldier, null extraction markers, route/home identity, expected revisions,
deterministic work/event ids, and server-derived event payload. It changes mission and attempt to
`DEPOSITING`, updates the attempt last-transition time, retains cargo and soldier identity, appends one
`MissionHomeReached` Domain Event, and records the idempotent result. The soldier remains `FIELD` until
the later deposit transaction marks it resident.

### 5. Keep settlement and delivery separate

The home-arrival transaction does not remove cargo, credit coins, resolve encounters, mutate role/tool,
or emit a Re-entry wake. The existing clock order invokes `deposit` after `movement`; a later CP-10
settlement task owns `CargoDeposited` and `CoinsCredited`. `MissionHomeReached` is an additive routine
event in `SK-MVP-0.2` and does not change the contract version or Re-entry eligibility.

## Alternatives rejected

- A persisted return route or waypoint cursor was rejected because the immutable outbound plan and
  durable transition time already reproduce the fixture route after restart.
- Teleport or browser-reported arrival was rejected because it removes time/risk and moves movement
  authority out of the worker.
- Bundling deposit and coin credit was rejected because it mixes movement with settlement and makes
  the accepted movement-before-deposit order unverifiable.
- Reusing `MissionAutoReturned` or `MissionRecalled` was rejected because those events explain the
  return start, not the home crossing; an ambiguous history would mislead later projections and Agents.

## Consequences and reopen triggers

The G2 slice gains a deterministic, restart-safe return movement boundary without schema growth or a
second scheduler. Cargo remains exposed until the next settlement transaction, and the exact event
history explains why the mission is ready to deposit. The additive event is routine and does not wake an
Agent. Reopen if migration moves the home anchor, recall starts from an arbitrary field position,
terrain or route invalidation requires replanning, combat can resolve at the crossing, a default
all-phase scheduler is composed, or a new schema/event/contract boundary is required.
