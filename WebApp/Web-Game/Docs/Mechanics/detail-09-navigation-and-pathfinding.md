# Navigation and Pathfinding

**Mechanism:** M09
**Status:** MVP route and movement contract accepted; production path tuning is open
**Authority:** This file owns route and movement semantics. Engineering owns the efficient execution
strategy; migration owns the moving home anchor.

## Route record

A mission route contains a source anchor, target coordinate or entity reference, walkability version,
waypoints, estimated travel time, and route status. The route is a plan, not a teleport permission.
Movement consumes world time according to the accepted G2 soldier speed of 3 logical tiles per world
second. Production terrain cost, equipment modifiers, and any carried siege loadout remain future
rules.

## Path planning

The initial implementation can use a coarse walkability grid and cached A* waypoints. Recalculate
when a target moves, the home anchor moves, terrain changes, a migration changes the destination, or
the cached path becomes invalid. A spatial index supplies nearby encounter checks without scanning
the whole world.

## Moving targets and home anchor

An enemy shelter target is an intelligence coordinate with an observation time. A siege route can
arrive at a stale location and fail or enter a later accepted search policy; it cannot obtain the
hidden current position automatically. A returning soldier targets the shelter's authoritative
`home_anchor`, which follows a migrating shelter.

## Obstacles and collisions

The server owns walkability and collision. The browser may animate movement between accepted
snapshots, but it cannot cross blocked cells, overlap a protected shelter, or claim arrival early.
For G2, a blocked or unsafe route makes one bounded replan attempt and then enters `WAITING_REVIEW`;
the exact terrain cost, collision radius, formation spacing, and siege stuck recovery are `OPEN`.

## Invariants

- A route never changes ownership or mission role.
- Arrival is committed only by the server at a due milestone.
- Replanning cannot erase elapsed travel time or cargo risk.
- A moving home anchor is one logical return target, not a duplicate shelter.

## Open decisions

- production movement speed formula and terrain modifiers;
- waypoint granularity and replanning threshold;
- siege formation spacing and obstacle handling;
- stale target search radius; and
- whether a soldier can pause safely when no valid path exists.

## Related documents

- [`05-detection-pathfinding-and-encounters.md`](05-detection-pathfinding-and-encounters.md) — family overview;
- [`detail-08-mission-dispatch-return-and-recall.md`](detail-08-mission-dispatch-return-and-recall.md);
- [`detail-10-player-exploration-fog-and-intelligence.md`](detail-10-player-exploration-fog-and-intelligence.md); and
- [`detail-17-shelter-migration-and-veil.md`](detail-17-shelter-migration-and-veil.md).
