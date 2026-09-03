# SK-TASK-023: CP-08 Worker-Serialized Movement Cadence

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-08`
- Owner: Game owner
- Current increment: Worker-owned fixed 100 ms movement cadence, one process-local intent and accumulator per player, deterministic ordering, typed terminal failures, and restart from the last durable tile are runtime-verified within this task's local boundary.
- Next gate: Continue with the separately registered CP-08 command/read gateway and full-snapshot transport seam; do not infer browser or hosted realtime behavior from this task.

## Identity

- Task ID: `SK-TASK-023`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: This increment crosses the worker lifecycle, authoritative clock, process-local interpolation, durable player position, command retries, and the later realtime projection boundary. An accumulator that becomes durable gameplay state or a browser timer that advances the world would contradict the accepted contract.

## Objective

Connect player movement to the existing worker-owned `WorldClock` with a small deterministic cadence
seam. A bound movement intent may be set or stopped through the server command surface. Every 100 ms
worker step consumes the intent at the accepted `player_move_speed_tiles_per_world_second = 4.0`.
The process-local accumulator may retain sub-tile progress between integer tile crossings, but only an
integer tile position, exploration set, revision, and `PlayerMoved` event are durable. A worker restart
resumes from the last committed tile and never uses browser or wall time to invent movement.

## Success and non-goals

- Success: A valid intent is bound to one world/player/binding, checked against the current player
  revision and idempotency key, and owned by the worker. A repeated key replays the original effect;
  a stale revision cannot replace a newer intent.
- Success: A fake-clock or worker-driven sequence of 100 ms steps is deterministic. At 4.0 tiles per
  world second, each step contributes 0.4 tile: the third accepted step produces the first integer
  tile crossing and retains 0.2 tile of process-local progress. Sub-tile progress is discarded after
  restart. A stopped intent produces no further movement.
- Success: Each committed tile crossing reuses the CP-05 transaction, player revision, `PlayerMoved`
  event, and persisted exploration boundary. No step crosses a fixture bound or blocked cell.
- Success: The worker can stop and restart without a duplicate movement event, a browser-time advance,
  or a second world clock. The current full snapshot remains the reconnect replacement surface.
- Non-goals: WebSocket protocol or upgrade handling, delta frames, client prediction, browser keyboard
  wiring, visible terrain/resource/monster/remote-player policy, A*/route planning, soldier movement,
  missions, extraction, combat, WebMCP, Re-entry, hosted deployment, and production latency tuning.

## Scope and authority

- In scope: the worker-owned movement intent/cadence service, its minimal CP-05 player mutation/event
  reuse, focused CP-08 tests, and linked evidence/validation records.
- Out of scope: `reentry-core/`, `mvp/`, `RightSpot`, external Receiver/Connector, browser authority,
  destructive cleanup, deployment, credentials, spend, staging, commit, push, or public communication.
- Allowed actions: Read and edit scoped game files, write focused tests/evidence, install safe local
  dependencies only when a capability probe proves need, and run minimum affected verification. Preserve
  every unrelated tracked, untracked, ignored, and collaborator-owned change.
- Revalidate when: `SK-MVP-0.2`, CP-06 clock phase order, CP-08 player position/snapshot authority,
  command idempotency, or the process-local fractional-position rule changes.

## Owning authority

- Owning modules: [`../Mechanics/detail-01-world-clock-and-continuity.md`](../Mechanics/detail-01-world-clock-and-continuity.md), [`../Mechanics/detail-09-navigation-and-pathfinding.md`](../Mechanics/detail-09-navigation-and-pathfinding.md), and [`../Mechanics/detail-10-player-exploration-fog-and-intelligence.md`](../Mechanics/detail-10-player-exploration-fog-and-intelligence.md)
- Owning contract sections: [`../Engineering/09-mvp-contract-sheet.md#2-world-geometry-and-fixture-map`](../Engineering/09-mvp-contract-sheet.md#2-world-geometry-and-fixture-map), [`../Engineering/09-mvp-contract-sheet.md#3-world-clock-and-due-work-order`](../Engineering/09-mvp-contract-sheet.md#3-world-clock-and-due-work-order), and [`../Engineering/09-mvp-contract-sheet.md#9-snapshot-and-visibility-contract`](../Engineering/09-mvp-contract-sheet.md#9-snapshot-and-visibility-contract)
- Controlling decisions: [`../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md), [`../Decisions/ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md`](../Decisions/ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md), and [`../Decisions/ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md`](../Decisions/ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md)
- Predecessor task/evidence: [`SK-TASK-022`](SK-TASK-022-cp08-movement-visibility-realtime-implementation.md), [`SK-EVID-011`](../Evidence/SK-EVID-011-cp08-movement-snapshot-runtime-verification.md), and [`15-cp08-movement-snapshot-runtime-cross-functional-audit.md`](../Validation/15-cp08-movement-snapshot-runtime-cross-functional-audit.md)
- Constraining scenario: [`../Scenarios/08-cp08-projection-pathfinding-fixtures.md`](../Scenarios/08-cp08-projection-pathfinding-fixtures.md)

## Evidence status

- Verified: one worker-owned integer clock and bounded recovery; a durable player aggregate with integer
  position/exploration; adjacent-tile movement, revision, idempotency, event, migration, and full
  scoped snapshot replacement; a worker-driven 100 ms cadence with intent ownership, deterministic
  ordering, process-local accumulation, replacement/stop, typed stale/blocked handling, and restart
  from the last durable tile.
- Inferred: a process-local accumulator plus integer tile commits is the smallest way to honor the
  accepted 4.0 speed without persisting fractional position or making a browser timer authoritative;
  ADR-GAME-0014 records the accepted local lifecycle and boundary ordering.
- Unknown: the production intent command transport, hosted scheduler, 100 ms snapshot cadence,
  realtime transport, and any policy that might preserve an intent across a process replacement.

## Smallest reversible action

The Red harness was written around one real `WorldClock`/`WorldWorkerModule` seam and a temporary
CP-07 fixture. The Green implementation uses an explicit elapsed-time driver and asserts intent,
three 100 ms steps, one tile crossing, the retained 0.2 process-local remainder, exploration,
event/revision, stop, duplicate, stale, bound rejection, stable two-player ordering, and restart.
The evidence packet and cross-functional audit are complete in [`SK-EVID-012`](../Evidence/SK-EVID-012-cp08-worker-movement-cadence-runtime-verification.md) and [`16-cp08-worker-cadence-runtime-cross-functional-audit.md`](../Validation/16-cp08-worker-cadence-runtime-cross-functional-audit.md). Any need for durable fractional position, browser timing, a second clock, or a new identity/visibility authority reopens the task.

## Verification and closure target

- Minimum verification: Ladder level 3–5: focused movement cadence tests, CP-08 predecessor suite,
  CP-06 clock/recovery and CP-05 transaction suites when shared paths change, typecheck, build, and
  documentation validators. Do not run the full repository suite by default.
- Closure result: `runtime_verified` for worker-serialized intent and local cadence only. No browser,
  WebSocket, transport, interpolation, visible terrain, pathfinding, mission, gameplay, WebMCP,
  Re-entry, hosted continuity, or Agent claim follows.
- Rollback or remediation: Preserve the Red harness and revert only scoped CP-08 cadence files if the
  accumulator leaks into durable state or the worker lifecycle creates a second clock. Do not add a
  fallback timer or fallback server.
- Reopen trigger: browser or wall time advances movement, the third 100 ms step does not produce the
  documented first crossing, a repeated key moves twice, a stale intent overwrites a newer one,
  restart loses a committed tile, or an intent survives a process boundary without the documented
  clear-on-restart policy.
