# SK-EVID-013: CP-08 Worker Command and Read Gateway Runtime Verification

## Evidence control

- Evidence ID: `SK-EVID-013`
- Related task: [`SK-TASK-024`](../Tasks/SK-TASK-024-cp08-worker-command-read-gateway.md)
- Related decision: [`ADR-GAME-0015`](../Decisions/ADR-GAME-0015-cp08-worker-command-read-gateway.md)
- Predecessors: [`SK-EVID-012`](SK-EVID-012-cp08-worker-movement-cadence-runtime-verification.md), [`SK-EVID-011`](SK-EVID-011-cp08-movement-snapshot-runtime-verification.md), and [`SK-EVID-009`](SK-EVID-009-cp06-clock-runtime-verification.md)
- Evidence class: `process-runtime`
- Ladder level: `4`
- Executor and date: Codex primary session; 2026-09-02
- Source state: working tree on `main` at Git commit `92cb4fa376c593081ba943c5c865067ac3fcb2ce`; gateway source, tests, and documentation changes are intentionally uncommitted.

## Runtime identity

- Node.js: `v24.18.0` selected through `/Users/alex/.nvm/versions/node/v24.18.0/bin`
- npm: `11.17.0`
- Next.js: `16.3.4`
- TypeScript: `7.0.2`
- Contract: `SK-MVP-0.2`
- Fixture: `sleepless-mvp-01`, generation `g2-fixture-1`
- Runtime: local macOS process with a fresh file-backed SQLite database per test; no browser timer,
  HTTP/WebSocket transport, external Receiver or Connector, WebMCP adapter, hosted database, or
  public service.

## Objective and claim boundary

This evidence covers the bounded CP-08 gateway increment: a process-local `WorkerCommandGateway`
that queues movement intent set/stop commands, player-scoped full-snapshot reads, and explicit worker
clock advances in FIFO invocation order behind the ready worker. It captures command inputs at
submission time, preserves domain errors, isolates a failed queue entry, and exposes typed not-ready,
missing-clock, and closed outcomes.

The evidence supports the existing worker cadence, movement transaction, ownership, stale revision,
idempotency, event/revision, snapshot privacy, and restart semantics when reached through the gateway.
It does not support an always-on scheduler, a bounded production queue policy, HTTP/WebSocket wire
behavior, browser input, visible terrain or actor policy, pathfinding, missions, extraction, combat,
WebMCP, Re-entry delivery, hosted continuity, or production latency.

## Fixture and execution

- Each test created a new file-backed world through `createAndPersistG2Fixture` with two stable player
  identities and opaque bindings, then opened it through a real `WorldWorkerModule` and `WorldClock`.
- The cadence and snapshot services remained the domain owners. The gateway only captured immutable
  request values and serialized their invocation order; it did not accept client coordinates or alter
  state transitions.
- FIFO was observed by submitting set-intent, advance, and snapshot operations without awaiting each
  call. The read-before-advance vector confirmed that a read submitted first sees the earlier durable
  position. The stop vector confirmed a queued stop prevents a later advance from moving the player.

Exact commands:

```text
SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp08-gateway
SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp08
SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp08-cadence
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

## Observed results

- CP-08 gateway: 6 tests passed.
- CP-08 movement/snapshot predecessor: 4 tests passed.
- CP-08 worker cadence predecessor: 5 tests passed.
- CP-07 fixture: 5 tests passed.
- CP-06 clock/recovery: 8 tests passed.
- CP-05 persistence/events: 26 tests passed.
- CP-04 process skeleton: 5 tests passed.
- TypeScript typecheck: passed.
- Next.js production build: passed.
- Documentation self-tests: 21 tests passed.
- Documentation validator: passed while `SK-TASK-024` was the single non-terminal task under
  verification; the task was then closed and the current queue was registered separately.
- Scoped whitespace check: passed.
- Red proof: before the gateway module existed, the focused test failed with `ERR_MODULE_NOT_FOUND`.

## Assertions

1. A set-intent, a 300 ms worker advance, and a full snapshot submitted in that order produce one
   committed tile crossing and a snapshot at `(17,64)` with player revision `1`; the read cannot
   overtake the advance.
2. A full snapshot submitted before the same advance observes `(16,64)`, proving FIFO ordering is
   invocation order rather than completion order.
3. A queued stop executes before a later advance and leaves the durable position unchanged.
4. Mutating the caller's input object after submission does not change the queued direction or
   idempotency key. The gateway captures the request boundary before scheduling.
5. A stale domain command returns `STALE_REVISION`, while a later valid command still executes. The
   original `PersistenceError` remains visible rather than being converted into gateway success.
6. A worker that is not ready returns `WORKER_NOT_READY`; a closed gateway rejects queued and new
   work with `GATEWAY_CLOSED`; a ready worker without `advance` returns `WORKER_CLOCK_UNAVAILABLE`.
   Closing the gateway does not stop the worker or close persistence.

## Cross-functional analysis

- Authority: all mutations still run in `PlayerMovementCadenceService` and `PlayerMovementService`;
  snapshot reads still run in `ClientSnapshotService`; the gateway only orders them.
- Time and ordering: the explicit worker `advance` shares the same FIFO seam as external commands and
  reads. No timer, browser clock, or second world clock was introduced.
- Identity and retry: world/player/binding, expected revision, and idempotency values are forwarded
  unchanged. Existing CP-05 transaction and duplicate semantics remain the replay boundary.
- Persistence: only the existing integer position, explored cells, revisions, and events are durable;
  gateway queue entries are process-local and rejected on close or worker replacement.
- Lifecycle: gateway close is admission control only; CP-04 entrypoint remains the owner of worker stop,
  HTTP close, and persistence close. A worker state change before a queued callback starts returns a
  typed not-ready result.
- Handoff: the gateway is suitable for a later transport adapter, but no browser or wire endpoint is
  attached. Full snapshot replacement remains the reconnect surface.

## Intentionally unrun and residual risk

- No HTTP/WebSocket protocol, connection registry, bounded admission/backpressure policy, or browser
  keyboard path was started. Those are separate CP-08 increments.
- The queue is process-local and in-memory. It is not a durable command queue and does not prove
  multi-process ownership, failover, or hosted continuity.
- The current gateway is constructed by the caller; the production entrypoint and future transport
  adapters must close it before replacing the worker and must submit their clock advances through it.
- A runtime registry degradation is not itself wired into the gateway's worker state. The future
  entrypoint integration must gate new operations on the accepted CP-04 readiness boundary.

## Closure

Status: `pass`. `SK-TASK-024` is `runtime_verified` for the process-local worker command/read ordering
and lifecycle seam. The broader CP-08 checkpoint remains in progress; wire transport, visibility,
pathfinding, browser UX, and hosted continuity require separately registered increments.
