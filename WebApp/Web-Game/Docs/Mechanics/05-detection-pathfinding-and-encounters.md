# Detection, Pathfinding, and Encounters

**Status:** G2 geometry and detection contract accepted; implementation target

This is a family overview for M04, M09, M10, and M13. The detailed authorities are
[`detail-04-shelter-sensing.md`](detail-04-shelter-sensing.md),
[`detail-09-navigation-and-pathfinding.md`](detail-09-navigation-and-pathfinding.md),
[`detail-10-player-exploration-fog-and-intelligence.md`](detail-10-player-exploration-fog-and-intelligence.md),
and [`detail-13-encounter-and-combat-resolution.md`](detail-13-encounter-and-combat-resolution.md).

## Three visibility systems

1. Shelter detection reveals Wood and Rock inside the inclusive
   `shelter_resource_sensing_radius_tiles = 24.0`.
2. Soldier detection uses the inclusive `soldier_sensor_radius_tiles = 6.0` and can reveal actors in
   the field.
3. Player exploration reveals map cells within the inclusive
   `player_fog_reveal_radius_tiles = 4.0` of the travelled avatar position.

A larger sensor radius gives earlier awareness and can create the first pursuit decision. The seeded
monster has a separate inclusive `monster_detection_radius_tiles = 5.0`. None of these ranges
determines combat victory.

## Route model

A mission stores a target coordinate or node, a cached waypoint route, and a return policy. A* on a
coarse walkability grid is sufficient for the first implementation. Paths are recalculated when a
target moves, the shelter home anchor moves, terrain changes, or the cached route becomes invalid.

## Contact

A server spatial index checks only nearby entities. When a soldier's sensor finds an enemy, monster,
or target shelter, the server records an observation. A battle begins when actors enter the inclusive
`engagement_radius_tiles = 1.0` and the server can atomically lock the encounter.

Two actors with overlapping positions but no valid detection do not automatically gain perfect
knowledge. Terrain line-of-sight can remain a later modifier; the first implementation can use radius
and fog rules.

## Intelligence

Player discovery produces an intelligence record containing target type, coordinates, observer,
observed world time, confidence, and optional expiry. A siege mission targets the recorded location.
If the shelter has moved, the attack can arrive at a stale location and fail or require a search rule.
The final expiry and search behavior remain open.
