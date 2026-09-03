# CP-07 World Fixture Runtime Cross-Functional Audit

**Role:** Implementation review for deterministic G2 generation, identity, placement, and reset/restart persistence  
**Status:** LOCAL FIXTURE BOUNDARY REVIEW COMPLETE; movement and gameplay remain open  
**Date:** 2026-09-02  
**Scope:** CP-07 implementation task `SK-TASK-021`, the CP-06 clock handoff, CP-05 fixture persistence, and consumers CP-08 through CP-15  
**Contract:** [`../Engineering/09-mvp-contract-sheet.md#1-version-identity-and-ownership`](../Engineering/09-mvp-contract-sheet.md#1-version-identity-and-ownership) and [`../Engineering/09-mvp-contract-sheet.md#2-world-geometry-and-fixture-map`](../Engineering/09-mvp-contract-sheet.md#2-world-geometry-and-fixture-map)  
**Decisions:** [`../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md`](../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md), [`../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md)  
**Evidence:** [`../Evidence/SK-EVID-010-cp07-world-fixture-runtime-verification.md`](../Evidence/SK-EVID-010-cp07-world-fixture-runtime-verification.md)

## 1. Verdict

The registered CP-07 increment is coherent and locally runtime-verified for its bounded fixture
boundary. The explicit `sleepless-mvp-01` preset is keyed only by the accepted seed and
`g2-fixture-1` generation version, produces a canonical SHA-256 manifest fingerprint, persists the
world and all G2 identity rows in one transaction, and reloads the same manifest after close/reopen.
Reset uses a new `world_id`; it does not rewrite the prior world's rows or event history.

The result does not claim a procedural generator, terrain/pathfinding behavior, player authentication,
hidden-state projection, movement, missions, extraction, combat, or a continuously bootstrapped world.
Those boundaries remain with later checkpoints.

## 2. Cross-functional checks

| Boundary | Verified result | Remaining handoff |
|---|---|---|
| Seed and version authority | Only `sleepless-mvp-01` plus `g2-fixture-1` are accepted; unsupported input fails with typed `INVALID_INPUT`. The fingerprint is computed from a canonical manifest without `world_id`. | A later production generator needs its own versioned decision and fingerprint evidence. |
| Geometry and placement | The manifest contains a 128 × 128 open grid, shelter centers `(16,64)`/`(112,64)`, 96-tile separation, mirrored Wood/Rock nodes at 14/18 tiles, 12-tile protected-start metadata, and an initial monster at `(48,64)`. Initial records are in bounds, walkable, and non-overlapping; the Rock threat route may intentionally visit `(34,64)`. | CP-08 owns walkability/pathfinding and visibility; CP-11 owns exact contact timing and combat calibration. |
| Identity and ownership | Two players, two shelters, ten stable soldiers, four resource nodes, and one seeded monster are generated with deterministic type-scoped IDs. Rows are keyed by `world_id`; synthetic bindings are supplied as opaque test values. | CP-08/09/10/11 must preserve IDs through movement, mission attempts, extraction, combat, and projections. Authentication and live bindings remain open. |
| CP-05 persistence | `createWorldFixture` inserts world, players, shelters, soldiers, nodes, monster, and `world_snapshot` in one transaction. Invalid snapshot insertion rolls back all rows; duplicate `world_id` returns a typed rejection. | Later schema increments may add positions or due-work fields only through their own task and contract gate. |
| Snapshot/read handoff | The snapshot stores the complete fixture manifest and its hash; `loadPersistedG2Fixture` validates snapshot shape and matches seed/version/fingerprint to the world row before returning it. | CP-08 must project a player-scoped view without treating the snapshot as client authority. |
| CP-06 continuity | The fixture accepts an explicit recovered integer `world_time` and advances through the same `WorldClock`/store seam; world creation does not read browser or host time. | Default worker bootstrap and active due-work recovery remain later integration work. |
| Reset and restart | Two worlds can share deterministic fixture IDs while remaining isolated by `world_id`; prior event history remains in its original world. Close/reopen reloads the persisted manifest instead of regenerating it. | CP-16 must prove the clean two-session reset and restart journey. |
| Later consumers | Stable coordinates and IDs are available for CP-08 movement, CP-09 role/mission assignment, CP-10 node settlement, CP-11 seeded threat routing, CP-12 camera vocabulary, and CP-14 event scope. | No later consumer may infer positions from client state or silently regenerate a missing manifest. |

## 3. Resolved design inconsistency

The preparation scenario's candidate monster route includes the Rock node at `(34,64)` while an
earlier wording called every route cell non-overlapping. The route arithmetic and existing timing
review rely on the monster visiting that threat cell to produce the gatherer contrast. The durable
interpretation is now explicit: initial shelter, node, and monster spawn records must not overlap; the
designated Rock threat waypoint may coincide with the target node. The scenario, world-generation
mechanism, and CP-07 task all carry this same rule. This is a preparation-fixture clarification and
does not change the accepted identity, settlement, or combat formula.

The generic persistence `state` column is populated with the canonical contract values
`AT_SHELTER` and `PATROL` for the fixture. Lowercase schema defaults remain unused by this creation
path; future state writers must use the contract vocabulary rather than reintroducing `resident` or
`patrol` aliases.

## 4. Failure and isolation review

- A malformed seed/version, invalid world time, empty binding, duplicate world, duplicate type-scoped
  ID, invalid foreign key, or invalid snapshot fails visibly and does not create a partial fixture.
- A same-seed manifest comparison is independent of `world_id`; reset identity is therefore separate
  from deterministic geometry and does not require mutating the old world.
- The persisted loader refuses a missing or malformed snapshot and a world-row fingerprint mismatch;
  it never regenerates a manifest to make restart appear healthy.
- The manifest carries no client visibility decision. Full map metadata remains server-side until
  CP-08 constructs a scoped `client_snapshot`.

## 5. Residual risks and owners

| Residual risk | Owner / next gate | Reopen trigger |
|---|---|---|
| Positions and route cells live in the manifest snapshot rather than typed relational columns | CP-08 movement/projection design; add a schema increment only when a consumer needs atomic position mutation | A movement or visibility transition can bypass the manifest or duplicate coordinate authority |
| The open grid is a fixture simplification and has no blocked terrain or path planner | CP-08/CP-11 | The seeded route is unreachable, or a later consumer requires terrain semantics not represented by the manifest |
| Player bindings are synthetic and no authentication boundary exists | CP-13 and local slice CP-16 | A client can choose another world/player binding or a fixture binding crosses worlds |
| The default worker does not create a fixture automatically | CP-16 local vertical slice | Process reports a playable world before fixture creation and clock recovery are complete |
| Event replay after a fixture snapshot and real due-work transaction recovery are not exercised here | CP-15 contract/race verification | A restart regenerates identities, loses a committed fixture transition, or creates duplicate domain effects |

## 6. Closure disposition

The evidence record may close `SK-TASK-021` as `runtime_verified` for the deterministic G2 fixture and
world-scoped persistence boundary. The next implementation entry is CP-08 movement, visibility, and
realtime projection; it must consume this manifest and the verified CP-06 clock without creating a
second coordinate, identity, or world authority.
