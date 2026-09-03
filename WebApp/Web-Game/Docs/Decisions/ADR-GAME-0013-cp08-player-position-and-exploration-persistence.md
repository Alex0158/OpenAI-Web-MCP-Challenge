# ADR-GAME-0013: CP-08 Player Position and Exploration Persistence

**Status:** ACCEPTED  
**Date:** 2026-09-02  
**Decision owner:** Game owner  
**Scope:** CP-08 first authoritative movement and full `client_snapshot` increment  
**Related task:** [`SK-TASK-022`](../Tasks/SK-TASK-022-cp08-movement-visibility-realtime-implementation.md)

## Context

CP-07 persists player identity and shelter ownership, but it does not yet persist a player avatar
position or player-specific exploration. CP-08 needs both values for server-owned movement, reconnect,
and a scoped projection. Putting them in a second projection table would create an avoidable
coordinate authority and make revision checks harder to audit.

The accepted clock contract also says that positions may be fractional between 100 ms
reconciliation steps, while fractional positions must not appear in persisted rows, event envelopes,
or snapshots. The first CP-08 implementation therefore needs a durable integer boundary without
pretending that continuous interpolation is already implemented.

## Decision

1. Extend the existing `player` row in schema version 2 with:
   - `position_x INTEGER NOT NULL`;
   - `position_y INTEGER NOT NULL`; and
   - `explored_cells_json TEXT NOT NULL`, storing a canonical sorted array of `{x, y}` cells.
2. Keep position, exploration, and the player revision in the same world-scoped player aggregate.
   Movement updates the row and its `PlayerMoved` Domain Event in the existing CP-05 transaction and
   uses the existing command idempotency record.
3. Add one transactional forward migration from schema version 1 to 2. Existing CP-05 rows receive
   the deterministic initial position `(0, 0)` and an empty exploration set because no earlier
   implementation had player movement. Unknown, newer, or partially applied shapes fail visibly.
4. Seed the CP-07 fixture's two players at their shelter coordinates and with the cells inside the
   accepted four-tile initial fog radius. A player move unions the same radius around the accepted
   destination and writes a canonical set.
5. The first increment exposes a discrete adjacent-tile `move_player` command. It proves ownership,
   bounds, walkability, expected revision, idempotency, and event visibility. Continuous 100 ms
   movement at the accepted 4.0 tiles-per-world-second rate, process-local interpolation, input
   cadence, and realtime transport remain later CP-08 gates.
6. A full `client_snapshot` is built from the current player aggregate, owned shelter and soldiers,
   persisted fixture geometry, current server world time, and player-permitted events. It includes
   no opaque binding, other player's private rows, or hidden-map payload. A full snapshot replaces
   local projection state on reconnect.

## Consequences

- Restart retains the authoritative player tile and exploration without browser state.
- Existing CP-05 transaction, revision, event, and idempotency controls remain the only mutation
  authority.
- Schema version 2 requires a focused migration/reopen check and refreshes the CP-05 local evidence
  for the extended shape; historical schema version 1 evidence remains a record of its earlier
  source state.
- The first movement proof is intentionally discrete. It does not close the accepted 100 ms
  interpolation or WebSocket acceptance criteria.

## Reopen triggers

Reopen this decision if movement needs a second coordinate source, fractional positions become
durable, exploration is shared across players, migration requires a different home-anchor model, or
the realtime protocol requires a new persistence/version authority.
