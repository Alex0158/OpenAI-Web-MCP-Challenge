# Detection, Pathfinding, and Encounters

**Status:** Working decision; implementation target

This is a family overview for M04, M09, M10, and M13. The detailed authorities are
[`detail-04-shelter-sensing.md`](detail-04-shelter-sensing.md),
[`detail-09-navigation-and-pathfinding.md`](detail-09-navigation-and-pathfinding.md),
[`detail-10-player-exploration-fog-and-intelligence.md`](detail-10-player-exploration-fog-and-intelligence.md),
and [`detail-13-encounter-and-combat-resolution.md`](detail-13-encounter-and-combat-resolution.md).

## Three visibility systems

1. Shelter detection reveals resources inside a shelter sensing radius.
2. Soldier detection uses each soldier's sensor radius and can reveal actors in the field.
3. Player exploration reveals map cells only where the player avatar has travelled.

A larger sensor radius gives earlier awareness and can create the first pursuit decision. It does not
determine combat victory.

## Route model

A mission stores a target coordinate or node, a cached waypoint route, and a return policy. A* on a
coarse walkability grid is sufficient for the first implementation. Paths are recalculated when a
target moves, the shelter home anchor moves, terrain changes, or the cached route becomes invalid.

## Contact

A server spatial index checks only nearby entities. When a soldier's sensor finds an enemy, monster,
or target shelter, the server records an observation. A battle begins when the actors enter the
engagement radius and the server can atomically lock the encounter.

Two actors with overlapping positions but no valid detection do not automatically gain perfect
knowledge. Terrain line-of-sight can remain a later modifier; the first implementation can use radius
and fog rules.

## Intelligence

Player discovery produces an intelligence record containing target type, coordinates, observer,
observed world time, confidence, and optional expiry. A siege mission targets the recorded location.
If the shelter has moved, the attack can arrive at a stale location and fail or require a search rule.
The final expiry and search behavior remain open.
