# Shelter Sensing

**Mechanism:** M04
**Status:** G2 sensing radius accepted; visibility payload and refresh detail are open
**Authority:** This file owns the shelter's resource-sensing capability. Player exploration and soldier
sensors remain separate mechanisms.

## Purpose

The starter shelter can detect resources inside a bounded field. This makes location, shelter level,
and sensing upgrades strategically meaningful without revealing the whole map.

## Detection field

The server evaluates `shelter_resource_sensing_radius_tiles = 24.0` against resource-node positions
using inclusive Euclidean center-to-center distance. A sensing result is a client-visible read model
containing the node id or a stable observation id, type, approximate location, required tool tier,
availability band, observed world time, and current entity version. It does not reveal exact hidden
quantities or enemy shelter positions in G2.

Sensing does not create ownership of the node. A node can be visible to multiple shelters and can be
depleted before a dispatched soldier arrives.

## Refresh and invalidation

The field refreshes when the shelter moves, the radius changes, a node enters or leaves the field, or
a node's authoritative availability changes. A stale `client_snapshot` must carry its observation
time. The client cannot treat a previous sensing result as a guaranteed target.

## Upgrade relationship

The protection/sensing upgrade branch can increase radius, observation quality, or refresh latency
after G2. The G2 radius is fixed at 24.0 tiles so both symmetric start-zone nodes are visible while
the other shelter remains outside the field.
It must not silently grant player exploration history, reveal hidden enemy shelters, or bypass a
soldier's role/tool requirements.

## Invariants

- Shelter sensing is server-authoritative and bounded by current location and radius.
- A sensed node remains subject to travel time, extraction time, capacity, and encounters.
- Sensing a resource does not reserve it unless a later mission command explicitly claims a valid
  target under the resource policy.
- A migrating shelter uses its current authoritative position and veil state.

## Open decisions

- exact visibility payload and update cadence;
- whether sensing shows monsters or only resources;
- whether nodes can be reserved by one mission; and
- how sensing behaves during breach recovery and migration.

## Related documents

- [`detail-03-shelter-state-and-command.md`](detail-03-shelter-state-and-command.md);
- [`detail-05-shelter-upgrades-and-progression.md`](detail-05-shelter-upgrades-and-progression.md);
- [`detail-10-player-exploration-fog-and-intelligence.md`](detail-10-player-exploration-fog-and-intelligence.md); and
- [`detail-11-resource-extraction-cargo-and-deposit.md`](detail-11-resource-extraction-cargo-and-deposit.md).
