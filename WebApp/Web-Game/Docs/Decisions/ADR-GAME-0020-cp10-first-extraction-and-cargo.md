# ADR-GAME-0020: CP-10 First Extraction and Cargo

**Status:** ACCEPTED LOCAL CP-10 IMPLEMENTATION BOUNDARY  
**Date:** 2026-09-02  
**Scope:** `SK-TASK-029`, one due Wood/Rock extraction after a verified CP-09 arrival  
**Related challenge:** [`../Validation/25-cp10-first-extraction-preimplementation-challenge.md`](../Validation/25-cp10-first-extraction-preimplementation-challenge.md)  
**Predecessor:** [`ADR-GAME-0019-cp09-route-milestone-and-derived-transit.md`](ADR-GAME-0019-cp09-route-milestone-and-derived-transit.md)

## Context

CP-09 now brings a role-locked GATHERER to `WORKING` at a durable route boundary. The accepted
economy contract requires the node decrement and exposed cargo increment to be one authoritative
ledger boundary, while shelter coins must wait for a later deposit. The original cargo table was a
CP-05 shape without source or mission-attempt provenance. Implementing extraction against that shape
would make future combat loss and deposit ownership ambiguous.

## Decisions

### 1. Use schema version 4 for cargo provenance

The local schema advances from version 3 (`cp09-001`) to version 4 (`cp10-001`). New cargo rows carry
`mission_attempt_id`, `source_node_id`, `acquired_world_time`, and `capacity_used` alongside the
existing world, cargo, soldier, resource, quantity, and revision fields. The equal-weight G2 model
uses `capacity_used = quantity`. A migration adds these columns transactionally; provenance columns
are nullable only when reading a legacy row created before this migration, and extraction never
creates such a row.

This version change is a persistence compatibility boundary, not a gameplay contract-version change.
Unknown or partially applied shapes fail visibly on open.

### 2. Arm the first extraction after arrival

At arrival world time `T`, `MissionTravelService` changes both paired due markers from the arrival
marker to `T + 2` and leaves the mission and attempt in `WORKING`. The extraction phase handles the
marker only at or after that boundary. It consumes the marker after one successful unit and clears it;
recurring extraction cadence is a later task. No world clock is created by the mission service.

### 3. Commit one server-owned extraction ledger boundary

`MissionExtractionService` selects active `WORKING` GATHERER attempts with paired due markers due at
the current boundary. It validates the persisted soldier, role, tool, target node, world identity,
revisions, and five-slot capacity. One transaction then:

1. decrements the target node by exactly one;
2. inserts the deterministic first cargo row with mission/source/time provenance;
3. advances node, cargo, mission, and mission-attempt revisions and clears the consumed due marker;
4. persists one `CargoExtracted` event with the affected revisions and shelter visibility; and
5. stores the typed result under a deterministic idempotency key.

No wallet, return route, deposit, combat, or Re-entry effect is part of this transaction.

### 4. Preserve the existing due-work order

Movement runs before deposit, contact, and extraction. Therefore an arrival at `T` can arm `T + 2`
without extracting at the same boundary. The world worker remains the sole scheduler owner; a direct
handler call that jumps beyond the durable clock boundary is rejected with `RECOVERY_REQUIRED`, as in
CP-09.

## Alternatives rejected

- Reusing the minimal cargo row was rejected because later combat and deposit could not prove source,
  attempt, acquisition time, or capacity ownership from durable state.
- Bundling capacity, return travel, deposit, and coin credit was deferred because it would combine
  separate phase and settlement boundaries before the first ledger effect is proven.
- A recurring scheduler or per-unit event stream was deferred; the first task needs one milestone and
  the existing `CargoExtracted` vocabulary only.

## Consequences and reopen triggers

The first economy effect is durable, replayable, and visibly distinct from shelter wealth. The
trade-off is one schema migration and a deliberately incomplete cadence: the next CP-10 task must
extend the same cargo row for capacity/depletion and then add return/deposit settlement. Reopen if
legacy cargo must be rewritten, a weighted capacity model becomes binding, a node reservation is
required, or extraction needs a new event/version or a different due-work order.
