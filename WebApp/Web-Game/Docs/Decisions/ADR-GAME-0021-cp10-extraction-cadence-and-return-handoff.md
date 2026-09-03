# ADR-GAME-0021: CP-10 Extraction Cadence and Return Handoff

**Status:** ACCEPTED LOCAL CP-10 IMPLEMENTATION BOUNDARY  
**Date:** 2026-09-02  
**Scope:** `SK-TASK-030`, recurring Wood/Rock extraction and the capacity/depletion handoff to `RETURNING`  
**Related challenge:** [`../Validation/27-cp10-extraction-cadence-and-return-preimplementation-challenge.md`](../Validation/27-cp10-extraction-cadence-and-return-preimplementation-challenge.md)  
**Predecessor:** [`ADR-GAME-0020-cp10-first-extraction-and-cargo.md`](ADR-GAME-0020-cp10-first-extraction-and-cargo.md)

## Context

`SK-TASK-029` proves one post-arrival extraction and leaves a single exposed cargo row and a consumed
due marker. The accepted CP-10 economy contract requires a two-second extraction cadence, five equal
cargo slots, visible node depletion, and an automatic return handoff. Implementing those effects as
separate writes would allow a full pack or empty target to continue consuming due work, while adding
return travel or deposit would mix independent phase and settlement boundaries.

## Decisions

### 1. Extend one deterministic cargo stack

The existing `(world_id, mission_attempt_id, source_node_id)` cargo id remains one equal-weight stack.
Each successful milestone inserts the stack at quantity/capacity `1` or increments both by exactly
`1`. The stack's owner, mission attempt, source node, and resource type are immutable. Its
`acquired_world_time` remains the first unit's acquisition time; each later milestone's exact time is
preserved by its `CargoExtracted` event. No schema or contract version changes.

### 2. Preserve cadence from the consumed milestone

For a due marker `D`, a non-terminal extraction writes paired mission and attempt markers at `D + 2`.
The handler processes at most one milestone for an attempt at a boundary. It never derives the next
marker from a delayed handler invocation or credits a catch-up batch in one call.

### 3. Commit the stop handoff atomically

When the resulting cargo usage reaches five, or the node quantity reaches zero, the same transaction:

1. commits the unit and node decrement;
2. clears both due markers;
3. changes mission and attempt from `WORKING` to `RETURNING`, retaining `FIELD` soldier identity,
   route, and home anchor; and
4. emits `MissionAutoReturned` with a deterministic primary reason (`CAPACITY_FULL` takes precedence
   when both conditions are true).

Return navigation, home crossing, `DEPOSITING`, recall, and coin settlement remain later tasks.

### 4. Record node depletion for the timers handoff

When the final node unit is committed, the node stores `next_due_world_time = world_time + 30` and
the transaction emits one `ResourceDepleted` event. The node timer that turns this marker into a
respawn is a later task. A zero-quantity node cannot yield a unit in this boundary.

### 5. Keep replay and event order exact

The attempt/due pair is the milestone idempotency identity. The transaction stores the original
result and all event ids (`CargoExtracted`, plus any `MissionAutoReturned` and `ResourceDepleted`)
under that key. Retries return the original result and cannot increment cargo, decrement the node,
transition the phase, or allocate another cursor.

## Alternatives rejected

- Per-unit cargo rows were rejected because ADR-0020 accepted one provenance stack for the first
  return/deposit boundary; the event log retains each milestone time without multiplying cargo
  ownership rows.
- Deriving the next due from current handler time was rejected because delayed recovery would distort
  the accepted two-second cadence.
- Leaving a full or depleted attempt in `WORKING` was rejected because it creates an unbounded due-work
  loop and a non-reviewable player state.
- Bundling return movement, deposit, or coin credit was deferred because each has its own route,
  home-boundary, and settlement transaction and failure matrix.
- Executing node respawn in the extraction transaction was deferred because it introduces timer
  ordering and a second resource effect before the depletion handoff is proven.

## Consequences and reopen triggers

The worker can now demonstrate a real repeated economy loop and a causal, loss-exposed return intent
without creating field coins or a second scheduler. The cargo row represents a typed stack rather than
individual units; later combat/deposit consumers must use its aggregate quantity/capacity and the
event history for milestone detail. Reopen if weighted capacity, per-unit cargo ownership, node
reservation, respawn execution, return navigation, deposit/coins, a new event/schema/contract
version, or default scheduler composition enters this boundary.
