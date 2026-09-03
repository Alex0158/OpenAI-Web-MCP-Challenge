# CP-07 Deterministic World Fixture

**Status:** Local fixture boundary runtime-verified; movement and gameplay verification remains open  
**Checkpoint:** CP-07  
**Contract:** [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md)  
**Audit:** [`../Validation/08-cp06-cp07-preimplementation-audit.md`](../Validation/08-cp06-cp07-preimplementation-audit.md)  
**Purpose:** Define a repeatable two-player G2 world fixture that CP-07 can generate after CP-06 has recovered the authoritative world context.

This is a fixture target, not a general production generator. It preserves the accepted G2 seed,
geometry, ownership, and identity rules while keeping the first implementation small enough to verify.

## Fixture manifest

```text
fixture_id: sleepless-mvp-01
world_seed: sleepless-mvp-01
generation_version: g2-fixture-1
dimensions: 128 x 128 logical tiles
camera_target: 32 x 20 logical tiles
```

The `generation_version` literal is a preparation target. CP-07 must persist and verify the chosen
version before treating the fixture as runtime truth. A reset creates a new opaque `world_id` while
retaining the seed and generation version for that new fixture.

## Initial entities

| Entity | ID | Position or ownership | Initial state |
|---|---|---|---|
| Player A | `player-a` | Opaque session binding | Joined to `shelter-a` |
| Player B | `player-b` | Opaque session binding | Joined to `shelter-b` |
| Shelter A | `shelter-a` | `(16,64)` | Stable, protected start |
| Shelter B | `shelter-b` | `(112,64)` | Stable, protected start |
| Wood A | `node-wood-a` | `(30,64)` | `wood`, 20 units |
| Rock A | `node-rock-a` | `(34,64)` | `rock`, 20 units |
| Wood B | `node-wood-b` | `(98,64)` | `wood`, 20 units |
| Rock B | `node-rock-b` | `(94,64)` | `rock`, 20 units |
| Monster | `monster-seeded-01` | `(48,64)` | `PATROL`, seeded policy |

Each shelter owns five stable starter soldiers. Their IDs are `soldier-a-01` through
`soldier-a-05` and `soldier-b-01` through `soldier-b-05`. All IDs are scoped by `world_id`; a reset
must never let a command or event from an older world address the new fixture.

## Seeded monster route target

The following route is a preparation target for the accepted Rock-route demonstration:

```text
(48,64) -> (48,72) -> (40,72) -> (40,64) -> (34,64) -> (40,64)
```

The route uses the G2 patrol speed of 2.0 logical tiles per world second. It must be validated as
walkable and deterministic. The `(34,64)` waypoint intentionally visits the Rock A threat cell so a
gatherer can be detected after at least one extraction milestone; initial shelter, node, and monster
spawn records remain non-overlapping. A gatherer from Shelter A reaches Rock A in about six world
seconds at the G2 soldier movement speed. A hunter on the same route must be able to reach the
documented five-round victory contrast. If the route fails either condition, CP-07/CP-11 may adjust
the fixture route metadata while preserving the accepted seed, geometry, movement fields, and combat
formula.

The route is not a new monster AI rule. The general monster state machine and target policy remain
owned by `detail-12-monster-state-and-targeting.md` and CP-11.

## Placement and generation invariants

Every generation or reset must assert:

1. Coordinates use integer logical tiles from `0..127` in both axes.
2. Shelter center distance is 96 tiles and therefore satisfies the 80-tile minimum.
3. Each start-zone node is 14 or 18 tiles from its shelter, inside the inclusive 14–20 band and
   outside the inclusive 12-tile protected-start radius.
4. Initial shelter, node, and monster spawn cells are in bounds, walkable, and non-overlapping; the
   designated Rock threat waypoint may coincide with `node-rock-a` or its mirrored target by design.
5. The two shelters cannot both fit inside the `32 × 20` camera target.
6. The initial monster position and route do not create an unavoidable contact inside a protected
   start.
7. The fixture contains exactly two players, two shelters, ten starter soldiers, four resource
   nodes, and one seeded monster.
8. Repeating the same `world_seed` and `generation_version` produces the same placement, route
   metadata, initial state, and map fingerprint.
9. Changing the seed or generation version changes the fixture identity or is rejected visibly; it
   never silently reuses a prior world's event history.
10. Full map and hidden terrain metadata remain server-owned until CP-08 produces a player-scoped
    projection.

## Reset and restart separation

`reset_world` is a server-owned fixture command. It creates a new `world_id` and a fresh initial
entity/revision set. It does not delete, rewrite, or merge the event history, snapshot, or Signal
slots of another world.

A process restart is different: it loads the existing `world_id`, seed, generation version,
fingerprint, entity revisions, active work, and world time. It must not call the fixture generator as
if the world were new. If the persisted version or fingerprint is incompatible, the worker enters a
visible `RECOVERY_REQUIRED` outcome.

## Cross-module assertions

| Consumer | Assertion |
|---|---|
| CP-05 | World, seed/version, entity revisions, and reset scope are persisted; every event is world-scoped |
| CP-06 | Generation occurs only after clock recovery establishes the current world; due work uses the same world time |
| CP-08 | Coordinates and actor IDs project consistently; hidden cells are filtered by player scope |
| CP-09 | A mission target references a stable node or home anchor; dispatch never creates a duplicate soldier |
| CP-10 | Node quantity starts at 20 and is decremented by authoritative extraction only |
| CP-11 | The seeded monster can reach the Rock route after extraction and supports the gatherer/hunter contrast |
| CP-12 | The map is visibly larger than the camera and uses the accepted asset/state vocabulary |
| CP-14 | Later Domain Events retain `world_id`, shelter visibility scope, cursor, and revisions for Signal filtering |

## Verification vectors

### W07-01 — Same seed, same output

Generate the fixture twice from the same seed/version in isolated worlds. Compare dimensions,
walkability, placements, route metadata, initial revisions, and map fingerprint. They must match even
though `world_id` and globally unique event identities differ.

### W07-02 — Reset isolation

Create world A, append a fixture event, reset to world B, and attempt to read or mutate A's state
through B's binding. The operation must fail visibly; A's event history remains append-only and B
starts with its own entity revisions.

### W07-03 — Placement boundaries

Assert shelter separation, node distances, protected-start radius, bounds, walkability, and no overlap.
Test the exact inclusive 12-tile and 14-tile boundaries so a future distance helper cannot silently
change the onboarding trace.

### W07-04 — Camera-scale sanity

Project the fixture into a 32 × 20 camera target. Shelter A and Shelter B must not be simultaneously
visible in the initial camera frame; the world still contains both players in one authoritative map.

### W07-05 — Rock-route reachability

Run the route candidate through the selected walkability/path planner. The gatherer reaches Rock A,
extracts at least once before monster contact, and the hunter can use the same route for the accepted
contrast. A failed route is a fixture defect to record, not a reason to alter identity or settlement.

### W07-06 — Restart does not regenerate

Persist the fixture, advance world time, close and reopen the worker, and compare the recovered
geometry and IDs. They must match the pre-restart fixture while due work advances according to CP-06.

## Non-goals

This fixture does not implement movement, pathfinding, fog, extraction, combat, migration, siege,
breach, player authentication, production population, or Canvas rendering. It does not make a
procedural generator, seed, map fingerprint, or fixture manifest a client authority.
