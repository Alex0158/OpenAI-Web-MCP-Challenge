# ADR-GAME-0025: CP-11 Gatherer Combat and Cargo Loss

**Status:** ACCEPTED LOCAL CP-11 IMPLEMENTATION BOUNDARY  
**Date:** 2026-09-02  
**Scope:** `SK-TASK-034`, seeded monster contact, deterministic GATHERER combat, cargo loss, and same-identity respawn  
**Related challenge:** [`../Validation/35-cp11-gatherer-combat-preimplementation-challenge.md`](../Validation/35-cp11-gatherer-combat-preimplementation-challenge.md)  
**Predecessors:** [`ADR-GAME-0024-cp10-deposit-and-coin-settlement.md`](ADR-GAME-0024-cp10-deposit-and-coin-settlement.md), [`ADR-GAME-0019-cp09-route-milestone-and-derived-transit.md`](ADR-GAME-0019-cp09-route-milestone-and-derived-transit.md), and [`ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md`](ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md)

## Context

CP-10 now leaves a field GATHERER with durable route state and exposed Wood/Rock cargo. CP-11 must
make the seeded monster encounter authoritative and replayable without allowing a browser, a
projection, or a duplicate worker to choose HP, damage, cargo outcome, or soldier identity. The
existing `encounter` table is only a scheduler shell; it cannot identify its participants or retain
intermediate rounds across a process restart. The existing mission table also has no encounter
linkage, so extraction cannot reliably stop after contact.

This decision is deliberately the first CP-11 increment. It closes the gatherer-loss path and its
durable handoff. Hunter dispatch/victory, automatic danger-cell reissue, repeated-death review,
PvP/siege, browser presentation, WebMCP, Re-entry delivery, and hosted scheduling remain separate
boundaries.

## Decisions

### 1. Store one structured encounter as the HP and round authority

The persistence schema advances to version 5 with migration `cp11-001`. `mission` gains nullable
`encounter_id` and `encounter_status` fields. `encounter` gains `mission_id`, `mission_attempt_id`,
`soldier_id`, `monster_id`, `round_number`, `soldier_hp`, `monster_hp`, `engagement_x`, `engagement_y`,
and `terminal_cause`. The fields are structured and revisioned; HP is not hidden in `work_id`, an
event payload, or an in-memory map. Existing schema versions 1 through 4 migrate transactionally and
remain visibly incompatible if their metadata or shape is invalid.

Partial unique indexes allow at most one non-terminal encounter to claim a given soldier or monster.
The encounter row is retained as history after resolution so duplicate terminal delivery can replay a
stable result without deleting the identity that explains it. Actor-wide health columns are deferred;
the encounter is the only place that needs transient G2 combat HP.

### 2. Split contact and combat across the accepted clock phases

The contact handler runs after movement and deposit but before extraction. It derives the seeded
monster's patrol position and an active GATHERER's work position from durable fixture/mission state,
uses inclusive Euclidean distance `<= 1.0`, and commits one `LOCKED` encounter plus its mission linkage.
The first combat due marker is the lock world time, so the combat phase may resolve the first round in
that same integer boundary. A locked or resolving encounter remains attached to the mission and blocks
extraction; contact and combat do not use a browser or wall-clock timer.

The combat handler processes one due encounter in deterministic due-time/encounter-id order. Each
invocation resolves exactly one round, records the accepted formula inputs and initiative order, and
sets `next_due_world_time = world_time + 1` when no terminal result exists. A duplicate round key
returns the stored result without another HP change, cursor advance, or event.

### 3. Keep G2 formula and inputs server-derived

The round uses:

```text
damage = max(1, attack + weapon_power + matchup_bonus - defense)
```

The G2 GATHERER/pickaxe values are HP 100, attack 8, defense 2, initiative 3, tool power 0, matchup
bonus 0. The seeded monster values are HP 80, attack 12, defense 2, initiative 4, tool power 0,
matchup bonus 0. The higher initiative acts first; an equal speed uses ascending `entity_id`. No
random, critical, party, or client-selected modifier is accepted in this increment.

### 4. Settle the first monster-loss branch atomically

When the GATHERER reaches zero HP, one transaction commits the final `BattleRoundResolved`, terminal
`EncounterResolved`, `CargoLostToMonster`, `SoldierDied`, and `SoldierRespawned` events together with:

- deletion of every validated cargo row belonging to the active soldier and mission attempt;
- mission and attempt terminalization with the active encounter linkage cleared;
- the same soldier returning to `AT_SHELTER` with role, tool, and work cleared; and
- the encounter changing to `RESOLVED` with a typed monster-loss cause and no next due marker.

The transaction derives cargo ownership from the active attempt and never credits coins, transfers
cargo to the monster, creates a third resource, or modifies the monster out of `PATROL`. Malformed or
cross-attempt cargo fails with `RECOVERY_REQUIRED` before any mutation. Empty cargo still produces an
explanatory `CargoLostToMonster` event with zero totals.

The completed resident mission row remains available for a later manual dispatch through the existing
CP-10 reuse rule. Automatic one-budget danger-cell reissue is deliberately deferred to the next CP-11
task so the first combat transaction has one terminal outcome and one recovery surface.

### 5. Preserve identity, event, and retry boundaries

Contact identity is `monster-contact:<mission_attempt_id>:<lock_world_time>`. Round identity is
`monster-combat:<encounter_id>:round:<round_number>`. Terminal retries use the same round key and
stored idempotency result; current execution time is not a second logical identity. Every event keeps
world id, causal id, aggregate revision, affected revisions, shelter visibility, and typed payload.
State, events, and idempotency are committed in one transaction. A stale revision, cross-owner input,
duplicate with a changed request, or malformed durable row is typed and leaves the last valid state
unchanged.

## Alternatives rejected

- Encoding encounter state in `work_id` or JSON-only events was rejected because it prevents participant
  uniqueness, extraction blocking, and restart-safe HP reads.
- Resolving every round in contact was rejected because it violates the accepted one-round-per-second
  rule and makes the combat trace unreadable.
- Adding health to every actor was deferred because the first G2 consumer only needs transient combat
  HP; later snapshots can project the encounter record without widening the actor contract.
- Deleting the monster row on a soldier loss was rejected because the contract requires the normal
  monster state machine to continue and the encounter history to remain explainable.
- Combining Hunter victory, automatic reissue, PvP, siege, or Re-entry in this transaction was rejected
  because each changes a separate lifecycle, settlement, or external boundary.

## Consequences and reopen triggers

The first combat trace becomes deterministic and restartable: a gatherer can be contacted at a seeded
cell, see one round at a time, lose only its unbanked cargo, and return as the same resident soldier
while the monster remains available. The encounter history gives the later dashboard enough inputs to
explain the cause, and `CargoLostToMonster` gives CP-14 a stable future signal source.

This remains a local worker-handler boundary. It does not prove Hunter victory, automatic reissue,
repeated-death review, PvP/siege, actor health outside encounters, browser/UI, WebMCP, Re-entry,
default scheduler composition, hosted continuity, or multi-worker fairness beyond the transaction
claims. Reopen if any of those surfaces must own the first terminal transaction, if the seeded trace
is unreachable, or if a new event, schema, contract, or external version is required.

## Verification

The minimum proof is a file-backed CP-11 focused suite covering schema migration, contact distance and
phase order, formula/initiative, intermediate rounds, gatherer loss with Wood/Rock/zero cargo,
duplicate and changed-request retries, stale/ownership/malformed guards, one-participant conflict,
rollback, restart between rounds and after terminal settlement, event order/cursor, no coin/third
resource, and monster `PATROL` retention. Closure uses local process-runtime level 4 only and records
the exact fixture seed, runtime, commands, skipped Hunter/reissue/browser/hosted surfaces, and
residual risks.
