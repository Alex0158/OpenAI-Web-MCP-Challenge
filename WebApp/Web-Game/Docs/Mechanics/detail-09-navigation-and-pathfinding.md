# Navigation and Pathfinding

**Mechanism:** M09
**Status:** MVP route, player movement cadence, local worker command ordering, the CP-09 derived
transit/arrival boundary, the CP-10 return-navigation/home-crossing boundary, and the CP-11 bounded
danger-cell reissue route are runtime-verified; production path tuning and broader encounter routing
remain open
**Authority:** This file owns route and movement semantics. Engineering owns the efficient execution
strategy; migration owns the moving home anchor.

## Route record

A mission route contains a source anchor, target coordinate or entity reference, walkability version,
waypoints, estimated travel time, and route status. The route is a plan, not a teleport permission.
G2 movement consumes world time at `soldier_move_speed_tiles_per_world_second = 3.0` for every
soldier role. The player avatar uses `player_move_speed_tiles_per_world_second = 4.0`; the seeded
monster uses `monster_patrol_speed_tiles_per_world_second = 2.0` and
`monster_chase_speed_tiles_per_world_second = 4.0`. Positions may be fractional between 100 ms
reconciliation steps. Combat `initiative_speed` is a separate field and never changes movement.
Production terrain cost, equipment modifiers, and any carried siege loadout remain future rules.

## Path planning

The initial implementation can use a coarse walkability grid and cached A* waypoints. Recalculate
when a target moves, the home anchor moves, terrain changes, a migration changes the destination, or
the cached path becomes invalid. After an ordinary monster death, G2 allows one bounded replan that
excludes the recorded `danger_cell` and cells within one tile of it. If the replan has no safe route,
the mission enters `WAITING_REVIEW`; a second monster death before a successful deposit also enters
`WAITING_REVIEW` instead of reissuing forever. A spatial index supplies nearby encounter checks
without scanning the whole world.

## Moving targets and home anchor

An enemy shelter target is an intelligence coordinate with an observation time. A siege route can
arrive at a stale location and fail or enter a later accepted search policy; it cannot obtain the
hidden current position automatically. A returning soldier targets the shelter's authoritative
`home_anchor`, which follows a migrating shelter.

## G2 bounded transit

For the first fixture, an active route is immutable and its position is derived from the committed
waypoints, `start_world_time`, and the accepted 3.0 tiles-per-world-second soldier rate. The worker
stores one `next_due_world_time` for outbound arrival. It does not persist or event every intermediate
waypoint; the same route and world time therefore reproduce the same position after restart. At the
movement phase of the due boundary, the server commits `TRAVELLING` to `WORKING` and emits
`MissionWorking`. When CP-10 changes the attempt to `RETURNING`, the same route is traversed by a
projection-only reversal from the persisted `home_anchor`; its due time is derived from the durable
return handoff time and the route duration. Exact arrival at the anchor commits `DEPOSITING` and emits
`MissionHomeReached`. Return navigation is runtime-verified by `SK-TASK-032` with evidence in
[`../Evidence/SK-EVID-021-cp10-return-navigation-runtime-verification.md`](../Evidence/SK-EVID-021-cp10-return-navigation-runtime-verification.md)
and review in [`../Validation/32-cp10-return-navigation-runtime-cross-functional-audit.md`](../Validation/32-cp10-return-navigation-runtime-cross-functional-audit.md); extraction, encounters, route invalidation, migration, and settlement remain separate boundaries.

## Obstacles and collisions

The server owns walkability and collision. The browser may animate movement between accepted
`client_snapshot` projections, but it cannot cross blocked cells, overlap a protected shelter, or claim arrival early.
The first CP-08 command seam moves a player one adjacent logical tile and persists the integer
authority. The worker cadence increment now consumes 100 ms intent steps with process-local
fractional progress and reuses that same adjacent-tile transaction; soldier movement, route
planning, and client interpolation remain later gates.
For G2, a blocked or unsafe route makes one bounded replan attempt and then enters `WAITING_REVIEW`;
the CP-11 planner uses the recorded danger cell plus its one-tile Chebyshev neighbourhood and fixed
neighbour order; the exact terrain cost, collision radius, formation spacing, and siege stuck recovery
are `OPEN`. The local reissue route and no-route outcomes are evidenced in
[`../Evidence/SK-EVID-025-cp11-danger-cell-reissue-runtime-verification.md`](../Evidence/SK-EVID-025-cp11-danger-cell-reissue-runtime-verification.md).

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
