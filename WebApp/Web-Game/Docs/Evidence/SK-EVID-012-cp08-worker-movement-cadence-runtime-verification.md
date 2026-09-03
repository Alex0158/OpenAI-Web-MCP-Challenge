# SK-EVID-012: CP-08 Worker Movement Cadence Runtime Verification

## Evidence control

- Evidence ID: `SK-EVID-012`
- Related task: [`SK-TASK-023`](../Tasks/SK-TASK-023-cp08-worker-movement-cadence.md)
- Related decision: [`ADR-GAME-0014`](../Decisions/ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md)
- Predecessors: [`SK-EVID-009`](SK-EVID-009-cp06-clock-runtime-verification.md), [`SK-EVID-010`](SK-EVID-010-cp07-world-fixture-runtime-verification.md), and [`SK-EVID-011`](SK-EVID-011-cp08-movement-snapshot-runtime-verification.md)
- Evidence class: `process-runtime`
- Ladder level: `4`
- Executor and date: Codex primary session; 2026-09-02
- Source state: working tree on `main` at Git commit `81ee4392d173d796e404101818b741c0b64b861b`; CP-08 cadence source, tests, and documentation changes are intentionally uncommitted.

## Runtime identity

- Node.js: `v24.18.0` selected through `/Users/alex/.nvm/versions/node/v24.18.0/bin`
- npm: `11.17.0`
- Next.js: `16.3.4`
- TypeScript: `7.0.2`
- Contract: `SK-MVP-0.2`
- Fixture: `sleepless-mvp-01`, generation `g2-fixture-1`
- Runtime: local macOS process with a fresh file-backed SQLite database per test; no browser timer,
  WebSocket transport, external Receiver or Connector, WebMCP adapter, hosted database, or public
  service.

## Objective and claim boundary

This evidence covers the bounded CP-08 cadence increment: a real `WorldClock` fixed-step seam,
explicit worker-owned `WorldWorkerModule.advance`, server-bound movement intent commands, a
process-local fractional accumulator, deterministic integer tile commits through the existing
`PlayerMovementService`, and restart from the last durable tile.

The evidence supports the accepted 4.0 logical tiles-per-world-second rate at a 100 ms step, one
active intent per player, stable two-player ordering, replacement and stop behavior, ownership and
stale-revision rejection, duplicate command replay, typed blocked-boundary termination, durable
`PlayerMoved` revision/event effects, and clear-on-restart intent semantics.

It does not support a wall-time scheduler, an always-on hosted worker, a WebSocket wire protocol,
browser keyboard input, client prediction or interpolation, visible terrain/resource/monster/remote
actor policy, pathfinding, missions, extraction, combat, WebMCP, Re-entry delivery, hosted continuity,
or production latency.

## Fixture and execution

- Each test created a new file-backed world through `createAndPersistG2Fixture` with two stable player
  identities and opaque bindings, then closed and reopened the database through the worker runtime.
- The cadence service was attached as a `WorldClock` reconciliation handler. The test drove the worker
  with explicit elapsed values; no process sleep, browser clock, or wall-clock reading determined a
  gameplay result.
- The fixture's open grid was used for the positive path. A 5,000 ms worker advance drove Player A to
  the x=0 map edge; the next left crossing returned `MOVEMENT_BLOCKED`, cleared the intent, and left
  the durable row in bounds.

Exact commands:

```text
SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp08-cadence
SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp08
SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp07
SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp06
SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp05
SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp04
SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run typecheck
SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run build
python3 scripts/test_validate_game_docs.py
python3 scripts/validate_game_docs.py --root . --report
git diff --check -- WebApp/Web-Game
```

Observed results:

- CP-08 cadence: 5 tests passed.
- CP-08 predecessor movement/snapshot suite: 4 tests passed.
- CP-07: 5 tests passed.
- CP-06: 8 tests passed.
- CP-05: 26 tests passed.
- CP-04: 5 tests passed.
- TypeScript typecheck: passed.
- Next.js production build: passed.
- Documentation self-tests: 21 tests passed.
- Full documentation validator: passed with one non-terminal task (`SK-TASK-023`) while this task
  was under verification.
- Scoped whitespace check: passed.

## Assertions

1. At 4.0 tiles per world second, each 100 ms step contributes 0.4 tile. The third step commits
   `(16,64) -> (17,64)` and leaves 0.2 process-local progress; two additional steps commit the next
   tile. Only the integer position, explored cells, revision, and `PlayerMoved` event are durable.
2. Two active intents are reconciled in stable player-id order. A 1,200 ms advance runs ten steps at
   world time 0, then the world-time-1 boundary, then two steps at world time 1. Eight movement events
   are ordered A/B for each crossing and remain in the authoritative event log.
3. A same-request retry returns `duplicate: true`; reusing its key with a different direction returns
   `DUPLICATE_COMMAND`. A stale expected revision returns `STALE_REVISION` and leaves the current
   intent unchanged. A valid new intent replaces the direction and resets its fractional accumulator.
4. A valid stop clears the intent. Replaying the stop key after a later intent does not clear that
   later intent. A boundary failure returns `MOVEMENT_BLOCKED` in the cadence result, clears the
   intent, and never persists an out-of-bounds tile.
5. A replacement worker reloads the last committed integer tile, has no active intent or prior
   fractional remainder, and moves only after a fresh intent command. The event count remains exactly
   one per committed crossing.
6. `WorldClock.tick` interleaves fixed-step handlers with integer boundary phases for large elapsed
   inputs. `WorldWorkerModule.advance` rejects calls before readiness or after stop and does not create
   a timer, page authority, or second clock.

## Cross-functional analysis

- Authority: the worker clock invokes the cadence; every tile crossing calls the existing server
  movement service and CP-05 transaction. The browser and wall time are absent from the command and
  step inputs.
- Identity and retry: intent commands carry world/player/binding, expected revision, and an existing
  store idempotency key. Crossing keys are derived from world/player intent identity and sequence, so
  a retry cannot create a second event or tile.
- Persistence and recovery: the player row remains schema version 2 with integer coordinates and
  explored cells. Active intent, crossing accumulator, and crossing sequence are process-local; a
  replacement worker starts from the last durable revision and requires explicit new input.
- Ordering: active intents are sorted by `(world_id, player_id)`. A large healthy tick interleaves
  ten 100 ms movement steps with the matching integer boundary, preserving the CP-06 phase order for
  the next second.
- Failure and UX: ownership, stale, duplicate, blocked, not-ready, and missing-clock outcomes are
  visible typed or lifecycle errors. The cadence result retains a terminal boundary failure until a
  new intent is accepted; no silent retry loop or client correction is introduced.
- Handoff: the full `client_snapshot` remains the reconnect replacement surface. WebSocket transport,
  snapshot cadence, visible actor allowlists, browser controls, and Agent/Re-entry delivery remain
  separate gates.

## Intentionally unrun and residual risk

- No real wall-time interval or host scheduler was started. This is an explicit worker-driver proof,
  not always-on or hosted continuity evidence.
- No HTTP/WebSocket command gateway exists yet; direct services remain a local implementation seam and
  must be serialized behind the worker before two-browser claims.
- The open-grid fixture has no blocked terrain, so the blocked proof uses the map boundary. A mutable
  terrain policy must reopen the rejected-command idempotency decision.
- Synchronous SQLite writes occur once per integer crossing. Event-loop delay, snapshot load, and 10 Hz
  transport budgets require measurement before a production timer or topology change.

## Closure

Status: `pass`. `SK-TASK-023` is `runtime_verified` for the local worker-owned movement cadence,
intent lifecycle, integer tile persistence, and restart boundary. The broader CP-08 checkpoint remains
in progress; visibility expansion, pathfinding, transport, browser UX, and hosted continuity require
separately registered increments.
