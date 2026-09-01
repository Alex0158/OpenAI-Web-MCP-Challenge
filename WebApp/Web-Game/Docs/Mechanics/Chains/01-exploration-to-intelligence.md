# Chain C01: Exploration to Intelligence

**Status:** Working design; freshness rules are open

## Trigger and outcome

The player wants to discover the world and make an enemy shelter a legal siege target. The chain
starts with a player avatar leaving the shelter and ends with a time-stamped intelligence record
accepted by the home shelter.

## Ordered flow

1. `M03` confirms the player can leave the shelter; world time continues.
2. `M10` moves the avatar through fogged cells and reveals only traversed territory.
3. The server observes a resource, monster, or shelter according to current visibility rules.
4. The server writes an observation with target type, coordinate, observer, world time, confidence,
   and optional expiry.
5. The player returns to the shelter and rests or enters the command context.
6. The shelter accepts the intelligence record after checking ownership and freshness.
7. A later siege may reference the record; this chain never dispatches the siege itself.

## Failure branches

- Fog or veil prevents a fresh observation.
- The player leaves before reaching the target; no intelligence is created.
- The record expires or becomes stale before return.
- The shelter rejects the handoff because the observer or version is invalid.

## Invariants and events

The player does not receive global map visibility, returning home does not teleport the avatar, and
discovery does not grant an automatic attack. Candidate events are `PlayerExplored`, `ActorObserved`,
and `IntelligenceCommitted`.

## Open decisions

Exact observation payload, expiry, confidence decay, and whether soldier/shelter sensing details are
shared with the player remain `OPEN`.

## Related mechanisms

- [`../detail-10-player-exploration-fog-and-intelligence.md`](../detail-10-player-exploration-fog-and-intelligence.md);
- [`../detail-04-shelter-sensing.md`](../detail-04-shelter-sensing.md); and
- [`../detail-16-siege-assault-and-breach.md`](../detail-16-siege-assault-and-breach.md).

