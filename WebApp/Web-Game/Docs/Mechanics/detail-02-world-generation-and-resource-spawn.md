# World Generation and Resource Spawn

**Mechanism:** M02
**Status:** MVP fixture generation accepted; production generation tuning is open
**Authority:** This file owns generated world actors and node lifecycle. World lore owns fiction;
Engineering owns storage and worker execution.

## Purpose

Define how the persistent world creates, depletes, and replenishes resources, monsters, terrain, and
shelter placement opportunities without regenerating the world on restart.

## Generation contract

The server creates an open but bounded world from a `world_seed` and `generation_version`. The
generation result includes walkable terrain, resource nodes, monster regions, shelter placement
constraints, and discovery metadata. The seed makes tests and replays reproducible; a restart must
resume the existing world rather than regenerate it.

## Resource node

Each resource node has:

- immutable `node_id`;
- resource type (`wood`, `rock`, or `gold_bearing` in the full concept; the accepted G2 exposes
  `wood` and `rock`);
- required tool tier;
- position and walkability cell;
- remaining quantity and maximum quantity;
- extraction duration and yield rule; and
- next respawn milestone.

Extraction decrements the node atomically. A node cannot provide more than its remaining quantity,
and a depleted node cannot be harvested until its respawn milestone commits.

## Monster spawn region

Monster generation is region-based. Region pressure, local population, world time, and nearby
activity influence a spawn decision. A spawned monster receives a species policy, level, health,
attack, defense, `initiative_speed`, movement rates, detection range, patrol region, and optional value. The first implementation
uses a small set of regions and a small state machine; a full navmesh is not required.

## Shelter placement

Initial placement and migration destinations must be walkable, non-overlapping, and outside the
minimum separation radius from another shelter. For the accepted MVP, the generator places two
symmetrical protected starts at `(16,64)` and `(112,64)` on the 128 × 128 map, with a 12-tile
protected-start radius active until `start_world_time + 120` world seconds, independent of first
dispatch. Start-zone Wood and Rock nodes are placed in the inclusive 14–20-tile band so they sit
outside that shield. Production separation
tuning, blocked terrain, and whether a destination may be discovered before arrival remain `OPEN`.
The seeded MVP patrol may visit a designated resource threat cell (Rock A at `(34,64)` and its
mirror) during its route; this is an intentional route interaction, while initial shelter, node, and
monster spawn records remain non-overlapping.

## Invariants

- Generated entities have stable ids and a server-owned seed.
- Resource and monster spawn decisions are replayable from the seed, world time, and event order.
- Spawn density cannot create a guaranteed zero-risk route or an unavoidable spawn kill.
- A player never receives hidden resource quantities that the sensing rules do not permit.
- A restart resumes node quantity and next respawn time from durable state.

## Open decisions

- production world dimensions and zone layout beyond the accepted 128 × 128 two-player MVP;
- production resource node density, quantity, and respawn schedule beyond the accepted symmetric
  Wood and Rock start zones;
- monster species and pressure caps;
- production protected-start duration and shelter separation beyond the MVP profile; and
- whether generated resources are static points or drift within a region.

## Related documents

- [`../World/02-world-generation-and-zones.md`](../World/02-world-generation-and-zones.md);
- [`detail-01-world-clock-and-continuity.md`](detail-01-world-clock-and-continuity.md);
- [`detail-11-resource-extraction-cargo-and-deposit.md`](detail-11-resource-extraction-cargo-and-deposit.md); and
- [`detail-12-monster-state-and-targeting.md`](detail-12-monster-state-and-targeting.md).
