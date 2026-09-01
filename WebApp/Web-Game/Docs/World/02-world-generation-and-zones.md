# World Generation and Zones

**Status:** Target design; numerical tuning is open

## Generation targets

The server should generate a bounded but extensible map from a deterministic seed. Generation creates
walkable terrain, resource nodes, monster spawn regions, shelter placement constraints, and discovery
metadata. A seed and generation version make a world reproducible for testing without making the
production world reset when the server restarts.

## Resource nodes

A node has a type, tier, position, remaining quantity, extraction time, and respawn schedule. Nodes
can be depleted and regenerated. Higher-value nodes should require stronger tools, longer travel, or
higher exposure so that tool upgrades change the set of viable routes rather than making one safe node
optimal forever.

## Monster regions

Monster spawn rules use region pressure, local population, time, and nearby activity. A monster has a
home or patrol region and a target policy. The first implementation can use grid-based regions and a
small number of state transitions; it does not need a full navmesh.

## Placement constraints

Shelters and migration destinations must be on valid walkable terrain, avoid overlap, and respect a
minimum separation rule. For the accepted MVP, seed two symmetric protected starts at least 80
logical tiles apart on the 128 × 128 map. Production placement density, expansion beyond two players,
and migration-destination balance remain open.
