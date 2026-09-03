# ADR-GAME-0019: CP-09 Route Milestone and Derived Transit

**Status:** ACCEPTED LOCAL CP-09 IMPLEMENTATION BOUNDARY  
**Date:** 2026-09-02  
**Scope:** `SK-TASK-028`, one GATHERER route transit and arrival handoff  
**Related challenge:** [`../Validation/23-cp09-route-milestone-preimplementation-challenge.md`](../Validation/23-cp09-route-milestone-preimplementation-challenge.md)  
**Predecessor:** [`ADR-GAME-0018-cp09-mission-dispatch-and-role-lock.md`](ADR-GAME-0018-cp09-mission-dispatch-and-role-lock.md)

## Context

`SK-TASK-027` creates a durable `TRAVELLING` mission and a deterministic route, but deliberately
does not move the soldier or claim arrival. The G2 contract already fixes integer world-second
boundaries, a 3.0 tiles-per-world-second soldier rate, the `MissionWorking` event, and a separate
mission phase. Adding a per-waypoint cursor or a new travel event before a consumer needs it would
expand the schema and event vocabulary for no player-visible outcome.

## Decisions

### 1. Transit is a deterministic function of durable inputs

For the bounded fixture, the server derives the soldier's route position from the committed route,
`start_world_time`, and the current authoritative `world_time` at 3.0 tiles per world second. The
route is immutable for the active attempt. A browser may interpolate this derived position, but it
cannot submit or persist a coordinate. A restart recomputes the same position from the same durable
inputs.

The dispatch transaction records `next_due_world_time = start_world_time +
estimatedTravelWorldSeconds` as scheduler metadata. It is not a player reward, a client authority, or
a second clock. A route with a due time in the past is eligible on the next worker boundary and never
rewinds world time.

### 2. Arrival is one atomic phase transition

At the movement phase of an integer world-second boundary, the route service selects active attempts
whose `next_due_world_time` is at or before the boundary. For each attempt it conditionally updates
the mission and mission attempt from `TRAVELLING` to `WORKING`, updates their last transition time
and revisions, consumes the arrival marker, and emits exactly one `MissionWorking` event. Once the
CP-10 extraction handler is integrated, the same arrival transaction arms its successor extraction
marker at `arrival_world_time + 2`; the CP-09 evidence captured the predecessor behavior with no
successor marker. The event payload includes the stable mission/attempt/soldier identities, target,
route, arrival coordinate, previous phase, and new phase.

The event id and work identity are deterministic from the attempt and due boundary. A retry sees the
new phase and cannot create a second event. A stale revision or a competing claimant leaves the
attempt unchanged and returns a typed retryable result. No cargo, node quantity, coin, encounter, or
return state changes in this transaction.

### 3. World-clock and later settlement handoff

The route handler is installed in the existing worker-owned `movement` phase. The clock continues to
run without a browser and invokes each integer boundary in order, including bounded restart
recovery. Arrival does not schedule extraction in this task; CP-10 must schedule the first extraction
cycle after the arrival boundary so a newly arrived soldier cannot extract twice at the same second.
The existing order remains movement, deposit, contact, extraction, combat, settlement, and timers.

No new event type, schema version, mission phase, role, identity, or contract version is introduced.
`MissionWorking` remains a routine Domain Event and does not become an eligible Re-entry Signal by
itself.

## Alternatives rejected

- A persisted waypoint cursor and per-step event were deferred because they require a new schema/event
  contract and are not needed for deterministic fixture transit.
- A client-controlled coordinate or route was rejected because it would move movement authority out of
  the server.
- A general scheduler, extraction, encounters, and target mutation were deferred to their owning
  CP-09/CP-10/CP-11 increments.

## Consequences and reopen triggers

The first mission now consumes real world time and has a reviewable arrival boundary while preserving
the existing G2 vocabulary and restart semantics. Intermediate positions are derived rather than
individually evented; later encounter or UI work must use the same function and may promote a durable
cursor only with a new Challenge. Reopen if the route changes in flight, a target moves, terrain or
equipment changes speed, a second scheduler can claim the same work, or extraction/encounter logic
requires a different boundary.
