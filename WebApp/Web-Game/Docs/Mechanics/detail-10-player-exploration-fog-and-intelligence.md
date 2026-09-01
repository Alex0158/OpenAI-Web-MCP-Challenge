# Player Exploration, Fog, and Intelligence

**Mechanism:** M10
**Status:** Working design; information freshness is open
**Authority:** This file owns direct player exploration and the intelligence handoff needed to
prepare a siege. Design owns presentation; soldier and shelter sensing remain separate mechanisms.

## Player avatar

The player can leave the shelter as a direct world avatar, move with W-A-S-D or an equivalent
directional scheme, return to rest inside the shelter, and explore the shared map. Rest removes the
avatar from the exposed field view; it does not pause world time or field missions.

## Fog of map

The map begins fogged. Walking reveals only cells the player has actually traversed. Exploration
knowledge belongs to that player and is not the same as real-time visibility of another shelter,
soldier, resource, or monster.

## Discovery

When the avatar observes an enemy shelter, the server creates an intelligence record with:

- target type and stable observation id;
- observed coordinate and world time;
- observer and owning shelter;
- confidence and visibility basis; and
- optional expiry or search radius.

The discovery becomes usable for a siege only after the player returns to the home shelter and the
intelligence is committed to its command context. This preserves the owner's rule that personal
discovery and a return-home handoff precede a shelter attack.

## Freshness and concealment

A migrating shelter can leave a last-known marker. A veil prevents fresh discovery according to the
migration rule, but old intelligence remains an observable clue. A stale record cannot silently
become a current coordinate; the final expiry and nearby search policy are `OPEN`.

## Invariants

- Player exploration does not reveal the entire world or bypass veil concealment.
- A discovered target is time-stamped and attributed to an observer.
- Returning home is a command-context handoff, not a teleport or automatic siege authorization.
- Fog state is player-specific and does not alter server world state.

## Open decisions

- what exact actors and resource details a player can observe;
- whether observations are shared with the player's Agent or only the shelter;
- intelligence expiry and confidence decay; and
- whether a siege may search, retreat, or fail at a stale location.

## Related documents

- [`05-detection-pathfinding-and-encounters.md`](05-detection-pathfinding-and-encounters.md) — family overview;
- [`detail-04-shelter-sensing.md`](detail-04-shelter-sensing.md);
- [`detail-13-encounter-and-combat-resolution.md`](detail-13-encounter-and-combat-resolution.md); and
- [`../Design/Capabilities/01-player-exploration-and-discovery.md`](../Design/Capabilities/01-player-exploration-and-discovery.md).

