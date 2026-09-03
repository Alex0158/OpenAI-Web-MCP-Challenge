# SK-TASK-022: CP-08 Authoritative Movement and Client Snapshot Implementation

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-08`
- Owner: Game owner
- Current increment: The first bounded slice is runtime-verified in [`SK-EVID-011`](../Evidence/SK-EVID-011-cp08-movement-snapshot-runtime-verification.md): schema v2 player position/exploration persistence, adjacent-tile authoritative movement, typed owner/stale/bounds failures, event/revision/idempotency replay, and full player-scoped snapshot replacement.
- Next gate: Continue through the registered worker cadence increment [`SK-TASK-023`](SK-TASK-023-cp08-worker-movement-cadence.md); its cross-functional predecessor disposition is [`15-cp08-movement-snapshot-runtime-cross-functional-audit.md`](../Validation/15-cp08-movement-snapshot-runtime-cross-functional-audit.md).

## Identity

- Task ID: `SK-TASK-022`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: Movement crosses world authority, coordinate identity, revisions, visibility/privacy, reconnect replacement, and the reserved realtime process boundary. A client-owned position or hidden-state leak would invalidate the G2 trace.

## Objective

Implement the smallest CP-08 authoritative movement and full `client_snapshot` boundary on the
existing one-process worker/store seam. A valid `move_player` command must mutate only the bound
player's server-owned position with an expected revision and idempotency key, while a connect/resync
read returns a complete player-scoped snapshot derived from the persisted CP-07 fixture and current
CP-06 world time.

## Success and non-goals

- Success: A valid adjacent-tile movement command is validated against the bound world/player, logical
  map bounds, walkability, expected revision, and idempotency; it commits one position/revision result
  through the existing store/event boundary. Invalid or blocked movement, wrong-world/owner access,
  stale revisions, and repeated keys fail or replay visibly without a second movement effect.
- Success: The full `client_snapshot` carries `SK-MVP-0.2`, world time, player scope, current revisions,
  the player's shelter/soldiers/fixture coordinates and permitted explored cells, while omitting the
  full hidden map and another player's private state. Reconnect replaces stale projection state and
  never advances gameplay from browser time.
- Success: The implementation remains inside the CP-04 entrypoint and worker ownership; transport is
  selected only after a measured local seam. No WebSocket upgrade, delta protocol, client prediction,
  100 ms continuous cadence, pathfinding search, mission, extraction, combat, WebMCP, Re-entry, or
  fallback server is introduced in this increment.
- Non-goals: Procedural terrain, A*/route planning, soldier movement, 100 ms continuous movement and
  interpolation, fog discovery/intelligence records, soldier sensors, mission dispatch, extraction,
  combat, migration, siege, breach, Canvas polish, WebSocket transport, external Agent delivery,
  hosted deployment, and production latency tuning.

## Scope and authority

- In scope: authoritative player position/read models under `src/server/`, the smallest CP-05/fixture
  persistence extension needed for player position and explored-cell state, a full snapshot serializer,
  focused CP-08 tests, and linked task/scenario/evidence/validation records.
- Out of scope: `reentry-core/`, `mvp/`, `RightSpot`, external Receiver/Connector, browser authority,
  destructive cleanup, deployment, credentials, spend, staging, commit, push, or public communication.
- Allowed actions: Read and edit scoped game files, write focused tests/evidence, install safe local
  dependencies only when a capability probe proves need, and run minimum affected verification. Preserve
  every unrelated tracked, untracked, ignored, and collaborator-owned change.
- Revalidate when: `SK-MVP-0.2`, CP-06/07 time or fixture contract, route/visibility policy, snapshot
  vocabulary, CP-04 upgrade ownership, or CP-05 schema/transaction authority changes.

## Owning authority

- Owning module documents: [`../Mechanics/detail-09-navigation-and-pathfinding.md`](../Mechanics/detail-09-navigation-and-pathfinding.md), [`../Mechanics/detail-10-player-exploration-fog-and-intelligence.md`](../Mechanics/detail-10-player-exploration-fog-and-intelligence.md), and [`../Mechanics/05-detection-pathfinding-and-encounters.md`](../Mechanics/05-detection-pathfinding-and-encounters.md)
- Owning contract sections: [`../Engineering/09-mvp-contract-sheet.md#2-world-geometry-and-fixture-map`](../Engineering/09-mvp-contract-sheet.md#2-world-geometry-and-fixture-map), [`../Engineering/09-mvp-contract-sheet.md#3-world-clock-and-due-work-order`](../Engineering/09-mvp-contract-sheet.md#3-world-clock-and-due-work-order), and [`../Engineering/09-mvp-contract-sheet.md#9-snapshot-and-visibility-contract`](../Engineering/09-mvp-contract-sheet.md#9-snapshot-and-visibility-contract)
- Controlling decisions: [`../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md`](../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md), [`../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md), and [`../Decisions/ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md`](../Decisions/ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md)
- Constraining chain or scenario: [`../Scenarios/07-cp07-deterministic-world-fixture.md`](../Scenarios/07-cp07-deterministic-world-fixture.md), [`../Scenarios/08-cp08-projection-pathfinding-fixtures.md`](../Scenarios/08-cp08-projection-pathfinding-fixtures.md), [`../Validation/09-cp08-cp09-preimplementation-audit.md`](../Validation/09-cp08-cp09-preimplementation-audit.md), and verified predecessors [`SK-TASK-020`](SK-TASK-020-cp06-clock-and-recovery-implementation.md) / [`SK-TASK-021`](SK-TASK-021-cp07-deterministic-world-fixture-implementation.md)

## Evidence status

- Verified: CP-06 supplies one worker-owned integer clock; CP-07 supplies stable fixture coordinates,
  IDs, seed/version/fingerprint, and file-backed world rows; CP-05 supplies revisions, idempotency,
  event history, snapshot persistence, and the transactional schema migration seam; CP-04 reserves
  one `/realtime` owner. The first CP-08 movement/snapshot slice passes its focused local suite.
- Inferred: A canonical HTTP-like command/read boundary implemented as pure worker services is the
  smallest first step. Full snapshot replacement is safer than a delta protocol until two-session
  measurements establish a need.
- Unknown: 100 ms continuous movement representation and cadence, movement command transport,
  snapshot delta envelope/sequence fields, sensor sharing, visible terrain payload, pathfinding
  policy, and realtime latency budget.

## Smallest reversible action

The Red harness is complete. Its Green implementation uses the existing CP-05 transaction and a
schema v1-to-v2 migration, with no second coordinate or identity authority. Continue only through a
separately registered increment for continuous cadence and transport.

## Verification and closure target

- Minimum verification: Ladder level 3–5 for the local movement/projection boundary: focused positive,
  negative, boundary, stale, duplicate, ownership/visibility, migration, reconnect replacement,
  CP-06/07/05/04 transitive suites when shared paths change, TypeScript, build, and documentation
  validators. Do not run the full repository suite by default.
- Closure result: `runtime_verified` for the local authoritative movement and full snapshot boundary;
  no claim for browser two-session, WebSocket, fog persistence, sensor policy, pathfinding, WebMCP,
  Re-entry, hosted continuity, or Agent delivery until separately evidenced.
- Rollback or remediation: Preserve the Red harness and revert only scoped uncommitted CP-08 files if
  the position/snapshot seam conflicts with identity or visibility authority; do not add a fallback
  server or mutate the CP-07 manifest in place.
- Reopen trigger: client or wall time advances position, hidden state appears in a snapshot, a repeated
  key moves twice, a stale revision overwrites a newer position, reconnect merges unrelated state, or
  the transport choice requires a new authority or contract version.
