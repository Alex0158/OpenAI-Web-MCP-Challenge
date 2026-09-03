# SK-EVID-011: CP-08 Movement and Full Snapshot Runtime Verification

## Evidence control

- Evidence ID: `SK-EVID-011`
- Related task: [`SK-TASK-022`](../Tasks/SK-TASK-022-cp08-movement-visibility-realtime-implementation.md)
- Related decision: [`ADR-GAME-0013`](../Decisions/ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md)
- Evidence class: `process-runtime`
- Ladder level: `4`
- Executor and date: Codex primary session; 2026-09-02
- Source state: working tree on `main` at Git commit `81ee4392d173d796e404101818b741c0b64b861b`;
  CP-08 source, tests, and documentation changes are intentionally uncommitted.

## Runtime identity

- Node.js: `v24.18.0`
- npm: `11.17.0`
- Next.js: `16.3.4`
- TypeScript: `7.0.2`
- Contract: `SK-MVP-0.2`
- Fixture: `sleepless-mvp-01`, generation `g2-fixture-1`
- Runtime: local macOS process with a fresh file-backed SQLite database per test; no external
  Receiver, Connector, WebMCP adapter, hosted database, or browser transport.

## Objective and claim boundary

This evidence covers the first bounded CP-08 implementation increment: schema version 2 player
position and exploration persistence, an adjacent-tile server-authoritative `move_player` service,
and a full player-scoped `client_snapshot` read/replacement service.

The evidence supports owner and world binding checks, logical map bounds and fixture walkability,
expected player revisions, exactly-once movement effects under idempotency replay, a `PlayerMoved`
event, close/reopen persistence, transactional version 1 to version 2 migration, player-owned fog
state, and omission of another player's private state and the hidden map from a full snapshot.

It does not support continuous 100 ms movement, fractional interpolation, browser keyboard input,
WebSocket delivery, delta frames, terrain generation, pathfinding search, soldier sensors, missions,
extraction, combat, WebMCP, Re-entry delivery, hosted continuity, or production latency.

## Fixture and execution

- Each focused test created a new world through `createAndPersistG2Fixture` with two opaque
  bindings, then exercised the real `PersistenceStore` and CP-08 services.
- The accepted fixture seeds each player at its shelter coordinate and persists the inclusive
  four-tile initial fog set.
- The migration test removed the three CP-08 player columns from a fresh database, marked metadata as
  schema version 1, and reopened through the real migration path. The resulting schema metadata,
  default legacy position, and empty exploration set were read back.

Exact commands:

```text
SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp08
SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp04
SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp05
SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp06
SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp07
SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run typecheck
SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run build
python3 scripts/test_validate_game_docs.py
python3 scripts/validate_game_docs.py --root . --report
git diff --check -- WebApp/Web-Game
```

Observed results:

- CP-08: 4 tests passed.
- CP-04: 5 tests passed.
- CP-05: 26 tests passed with schema version 2 and migration identifier `cp08-001`.
- CP-06: 8 tests passed.
- CP-07: 5 tests passed.
- TypeScript typecheck: passed.
- Next.js production build: passed.
- Documentation self-tests and full validator: passed after the final documentation update.
- Scoped whitespace check: passed.

## Assertions

1. A valid Player A move from `(16,64)` to `(17,64)` advances only the bound player revision,
   persists its new tile and expanded fog, writes one `PlayerMoved` event, and returns one event id.
2. Repeating the same key returns the original event and position, even after a later move, without a
   second event or movement. Reusing the key with a different request returns typed
   `DUPLICATE_COMMAND`.
3. A binding for Player B cannot mutate Player A. A stale revision returns `STALE_REVISION`; the
   player remains at the first committed tile. A move beyond the `(0..127)` fixture bounds returns
   `MOVEMENT_BLOCKED` and leaves the row unchanged.
4. Schema version 1 player rows migrate in one transaction to version 2 with deterministic defaults;
   the reopened store exposes `cp08-001` and does not invent prior movement.
5. A full Player A snapshot carries the contract version, server world time, current revisions,
   Player A's shelter and five soldiers, the player position and exploration, and only permitted
   causal event metadata. It is marked full with a null base snapshot id. Player B's private
   identity/shelter and a hidden map payload are absent.
6. Closing and reopening the store retains Player A's position and explored cells. Snapshot reads do
   not advance world time and no browser or wall-clock input is accepted by the service.

## Cross-functional analysis

- Authority: position and exploration live in the existing world-scoped player aggregate. The
  movement service consumes the persisted CP-07 manifest and calls the CP-05 transaction; it does not
  maintain an in-memory or browser-owned coordinate.
- Ordering: the current server world time is attached to the command transition. No CP-06 clock
  callback or gameplay due-work is claimed by this increment.
- Identity and retry: player revision gates concurrent writes; the event id and generic idempotency
  record make a retry replayable. A late duplicate is resolved from its original event payload rather
  than from the player's later position.
- Visibility: event metadata is filtered by player/shelter scope. The snapshot includes no opaque
  binding and no unfiltered relational rows.
- Recovery: schema extension is an explicit transactional v1-to-v2 migration; malformed or
  incompatible metadata still fails visibly through the CP-05 recovery path.
- UX boundary: a full snapshot is replaceable projection state. There is no local prediction,
  interpolation, transport fallback, or claim that a live browser surface already exists.

## Residual risks and next gate

- The accepted open-grid fixture has no blocked cell, so the `MOVEMENT_BLOCKED` proof covers the
  map-boundary rejection; a deterministic blocked-terrain vector belongs to the later walkability
  increment.
- Direct service calls are not yet serialized through the running worker command queue. CP-08's next
  task must prove the worker entrypoint, 100 ms cadence, fractional process-local interpolation, and
  a measured full-snapshot transport before adding delta frames.
- Blocked input is rejected before a state transaction and is not stored as a rejected idempotency
  row. The fixture's walkability is immutable in this increment, so the same key cannot become a
  different accepted command; if terrain mutation is introduced, the rejection recording policy must
  be reopened.
- Sensor sharing, visible resource/monster projections, pathfinding, and browser reconnect status
  remain open and are intentionally not inferred from this evidence.

## Closure

Status: `pass`. The bounded first CP-08 movement/snapshot increment is `runtime_verified` locally.
The broader CP-08 checkpoint remains in progress until continuous movement, visibility policy,
realtime transport, and browser two-session evidence are separately implemented and verified.
