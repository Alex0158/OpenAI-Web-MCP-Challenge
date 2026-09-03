# SK-TASK-021: CP-07 Deterministic World Fixture Implementation

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-07`
- Owner: Game owner
- Current increment: The Green CP-07 immutable G2 manifest, fingerprint validator, atomic fixture persistence/read seam, and CP-06 clock handoff are runtime-verified in [`SK-EVID-010`](../Evidence/SK-EVID-010-cp07-world-fixture-runtime-verification.md), with the cross-functional boundary and residuals recorded in [`../Validation/14-cp07-world-fixture-runtime-cross-functional-audit.md`](../Validation/14-cp07-world-fixture-runtime-cross-functional-audit.md).
- Next gate: [`SK-TASK-022`](SK-TASK-022-cp08-movement-visibility-realtime-implementation.md) consumes the stable fixture and recovered integer clock for authoritative movement, visibility, and realtime projection without creating a second coordinate or identity authority.

## Identity

- Task ID: `SK-TASK-021`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: The fixture establishes the first authoritative world identities and geometry. A non-deterministic seed, reused `world_id`, cross-world row, or client-owned placement would invalidate every later movement, mission, combat, visibility, and Re-entry trace.

## Objective

Implement one server-owned deterministic G2 fixture preset keyed by the accepted seed and generation
version. It must create a fresh world identity with the fixed 128 × 128 geometry, two protected
shelters at the accepted separation, mirrored Wood/Rock nodes, ten stable starter soldiers, and one
seeded monster while preserving the recovered integer clock and CP-05 world-scoped persistence.

## Success and non-goals

- Success: The same `world_seed` and `generation_version` produce the same manifest, walkability,
  placements, route metadata, initial revisions, and `map_fingerprint`; every initial shelter, node,
  and monster spawn coordinate is in bounds, walkable, and non-overlapping (the designated Rock threat
  waypoint may visit the Rock node); the two shelters remain at least 80 tiles apart; each Wood/Rock
  node is in the inclusive 14–20-tile start band and outside the inclusive 12-tile protected radius; the
  fixture contains exactly two players, two shelters, ten soldiers, four resource nodes, and one
  monster; a reset creates a new `world_id` without rewriting the prior world's rows; and restart
  reloads the persisted manifest without regenerating it.
- Success: Fixture creation uses the existing worker-owned store and recovered `world_time`, keeps all
  identities world-scoped, exposes a stable read model for later checkpoints, and remains independent
  of browser, wall-clock, unseeded randomness, WebSocket, WebMCP, Re-entry, or Agent state.
- Non-goals: Procedural noise, walkability/pathfinding runtime, player movement, fog/sensors, missions,
  extraction, combat, migration, siege, breach, Canvas, WebSocket transport, page tools, external Agent
  delivery, hosted deployment, production population, or balance tuning.

## Scope and authority

- In scope: a fixture manifest/preset under `src/server/`, the smallest CP-05 persistence creation/read
  seam required to store its world-scoped entities and fingerprint, focused CP-07 tests, and linked
  task/scenario/evidence/validation records.
- Out of scope: `reentry-core/`, `mvp/`, `RightSpot`, external Receiver/Connector, browser authority,
  destructive cleanup, deployment, credentials, spend, staging, commit, push, or public communication.
- Allowed actions: Read and edit the scoped game files, write focused tests and evidence, install safe
  local dependencies only if a capability probe proves they are required, and run the minimum affected
  verification. Preserve all unrelated tracked, untracked, ignored, and collaborator-owned changes.
- Revalidate when: `SK-MVP-0.2`, ADR-GAME-0010/0012, CP-05 schema or world-clock ownership, fixture
  coordinates, protected-start semantics, or the CP-04 lifecycle contract changes.

## Owning authority

- Owning module document: [`../Scenarios/07-cp07-deterministic-world-fixture.md`](../Scenarios/07-cp07-deterministic-world-fixture.md)
- Owning contract sections: [`../Engineering/09-mvp-contract-sheet.md#1-version-identity-and-ownership`](../Engineering/09-mvp-contract-sheet.md#1-version-identity-and-ownership) and [`../Engineering/09-mvp-contract-sheet.md#2-world-geometry-and-fixture-map`](../Engineering/09-mvp-contract-sheet.md#2-world-geometry-and-fixture-map)
- Controlling decisions: [`../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md`](../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md) and [`../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md)
- Constraining chain or audit: [`../Validation/08-cp06-cp07-preimplementation-audit.md`](../Validation/08-cp06-cp07-preimplementation-audit.md), the verified CP-06 task [`SK-TASK-020`](SK-TASK-020-cp06-clock-and-recovery-implementation.md), and the CP-05 predecessor [`SK-TASK-005`](SK-TASK-005-cp05-persistence-event-log-and-outbox.md)

## Evidence status

- Verified: CP-05 stores a world seed, generation version, map fingerprint, world-scoped current rows,
  revisions, snapshots, and event history; CP-06 reloads an integer world boundary through the same
  worker-owned store.
- Inferred: An explicit immutable fixture preset keyed by seed/version is safer and more reproducible
  for G2 than introducing procedural noise or an unseeded random source. A manifest read model can
  keep CP-08 and later consumers from reading raw SQL or inventing a second identity source.
- Unknown: The exact manifest type, fingerprint canonicalization, fixture creation transaction shape,
  walkability representation, and whether the current minimum schema needs a bounded creation method.

## Smallest reversible action

Add a Red fixture contract test with the accepted manifest and placement vectors, including same-seed
comparison, world reset isolation, and file-backed restart non-regeneration. Inspect the CP-05 rows
needed to persist the fixture before choosing either a small creation method or an explicit schema
increment. Stop and reopen the owning contract if the accepted identities or geometry cannot be stored
without introducing a second world authority.

## Verification and closure target

- Minimum verification: Ladder level 3–4 for the local world boundary: focused CP-07 positive, negative,
  exact-distance, bounds, overlap, duplicate/reset, ownership-scope, restart, and fingerprint tests;
  CP-06, CP-05, and CP-04 transitive suites when shared store/worker code changes; TypeScript, build,
  and documentation validators. Do not run the full repository suite by default.
- Closure target: `runtime_verified` for the deterministic fixture and world-scoped persistence boundary,
  with no claim for pathfinding, gameplay, browser projections, WebMCP, hosted continuity, or Agent delivery.
- Rollback or remediation: Preserve the Red fixture and revert only scoped uncommitted CP-07 files if
  the preset violates the contract; never reset, clean, or rewrite unrelated history. If persistence
  cannot represent reset isolation, reopen CP-05 rather than adding a parallel database.
- Reopen trigger: Seed/version drift, a changed fingerprint for the same manifest, shelter/node overlap,
  an out-of-band identity, cross-world read/write, regeneration on restart, or any client/browser input
  influencing authoritative placement.
