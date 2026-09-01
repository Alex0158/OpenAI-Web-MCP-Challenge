# Shelter Sensing

**Mechanism:** M04
**Status:** Working rule; visibility detail is open
**Authority:** This file owns the shelter's resource-sensing capability. Player exploration and soldier
sensors remain separate mechanisms.

## Purpose

The starter shelter can detect resources inside a bounded field. This makes location, shelter level,
and sensing upgrades strategically meaningful without revealing the whole map.

## Detection field

The server evaluates a shelter's sensing radius against resource-node positions. A sensing result is
a snapshot containing the node id or a stable observation id, type, approximate location, required
tool tier, availability band, observed world time, and current entity version. Whether exact quantity,
yield, or extraction time is visible is a balance decision.

Sensing does not create ownership of the node. A node can be visible to multiple shelters and can be
depleted before a dispatched soldier arrives.

## Refresh and invalidation

The field refreshes when the shelter moves, the radius changes, a node enters or leaves the field, or
a node's authoritative availability changes. A stale snapshot must carry its observation time. The
client cannot treat a previous sensing result as a guaranteed target.

## Upgrade relationship

The protection/sensing upgrade branch can increase radius, observation quality, or refresh latency.
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

