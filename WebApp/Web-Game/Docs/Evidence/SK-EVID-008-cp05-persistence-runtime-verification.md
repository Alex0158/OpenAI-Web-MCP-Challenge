# SK-EVID-008: CP-05 Persistence Runtime Verification

## Identity

- Evidence ID: `SK-EVID-008`
- Related task, issue, or decision: `SK-TASK-005`, `SK-ISSUE-004`, `ADR-GAME-0011`
- Evidence class: `process-runtime`
- Ladder level: `4`
- Executor and date: `Codex primary session; 2026-09-02`

## Exact identity under test

- Source state: working tree on `main` at Git commit `81ee4392d173d796e404101818b741c0b64b861b`; CP-05
  source, tests, and documentation changes are intentionally uncommitted.
- Contract version: `SK-MVP-0.2`
- Runtime versions: Node.js `v24.18.0`, npm `11.16.0`, Next.js `16.3.4`, TypeScript `7.0.2`
- Fixture world and seed: synthetic `world-a`, seed `sleepless-mvp-01`, generation `g2-fixture-1`,
  map fingerprint `map-fingerprint-a`; each test creates a fresh file-backed database under a temporary
  directory and removes it after the test.
- Environment and configuration: local macOS process; Node.js 24 path selected explicitly; no secrets,
  external Receiver, WebMCP adapter, or hosted database.

## Objective and claim boundary

- Behavior under test: CP-05's worker-owned file-backed SQLite persistence foundation, versioned minimum
  schema, atomic state/event/idempotency boundary, snapshot integrity and replay, coalesced Signal slot
  and outbox delivery state, bounded busy handling, and CP-04 lifecycle integration.
- Claims this evidence may support: the named local source opens a file-backed SQLite WAL database with
  foreign keys and schema metadata; the synthetic transition/replay/Signal contracts and listener-first
  close path pass the focused local checks; the explicit Node.js entrypoint opens the configured store
  before `ready` and exits cleanly after a shutdown signal.
- Claims this evidence cannot support: advancing world time, downtime catch-up, semantic gameplay state,
  movement, combat, settlement, hosted continuity or scale, production migrations, WebSocket/client
  snapshots, WebMCP discovery, external Receiver/Connector delivery, Agent reasoning, balance, or
  Hackathon submission readiness.

## Preconditions and fixture

- Starting state: `SK-TASK-005` released under the verified CP-04 seam; Node.js `v24.18.0` exposes
  `node:sqlite`; the accepted `SK-MVP-0.2` event, revision, snapshot, and delivery contracts are unchanged.
- Synthetic identities and actors: `world-a`, two synthetic players/shelters where isolation is tested,
  and event IDs scoped to each temporary fixture.
- Real, fake, and stubbed boundaries: `node:sqlite` and the actual `WorldWorkerModule`/entrypoint are
  real local modules; gameplay transitions, Receiver delivery, and Agent actions are synthetic fixtures.

## Execution

- Exact commands:
  - `SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run typecheck`
  - `SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp05`
  - `SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp04`
  - `SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run build`
  - A Node.js 24 child-process smoke started `npm start` with `NODE_ENV=production`, `PORT=38427`,
    and an isolated `GAME_DB_PATH`, polled `GET /api/health`, sent `SIGTERM`, waited for exit, and
    verified the database file was created.
  - `python3 scripts/test_validate_game_docs.py`
  - `python3 scripts/validate_game_docs.py --root . --report`
- Expected result: all focused tests, typecheck, build, and documentation checks pass; health reports
  HTTP 200 and `status: ready` only after the store opens; shutdown exits without a timeout.
- Actual result: 26 CP-05 tests passed; 5 CP-04 transitive tests passed; TypeScript typecheck, Next.js
  production build, 21 documentation self-tests, and the full documentation validator passed. The
  process smoke returned health HTTP 200 with `status: ready`, created the configured SQLite file, and
  exited with code 0 after `SIGTERM`.
- Status: `pass`
- Output location: bounded command output and assertions were read in the local session; no raw logs,
  credentials, or runtime database were committed.

## Assertions

- Schema and driver: WAL mode, foreign-key enforcement, schema/contract/event/snapshot versions,
  generation metadata, all CP-05 minimum tables, active-work lease columns, and incomplete/newer schema
  refusal passed. A first-run shape failure rolls back without leaving `schema_meta` authority.
- Atomicity and authority: state mutation, per-world cursor, Domain Event, idempotency result, and
  eligible Signal/outbox state commit together; injected failures leave no partial rows. Event-declared
  revisions cannot override committed mutation revisions, and duplicate event IDs within one command do
  not duplicate history or Signal counts.
- Recovery and isolation: cursor gaps, snapshot revision/hash corruption, incompatible versions, and
  missing world history fail with typed `RECOVERY_REQUIRED`; valid snapshot replay survives close/reopen;
  empty worlds recover without inventing state; world, player, shelter, and visibility predicates are
  enforced.
- Delivery and lifecycle: routine event types stay out of eligible Signal summaries; active and post-handoff
  deferred events coalesce under one slot; post-handoff deferred context folds into a later signal while
  an acknowledged-cooldown event remains history-only under the accepted CP-14 policy; leases, retries,
  terminal rejection, duplicate acknowledgement, and `ContinuationDelivered` exactly-once behavior
  pass. The worker opens and closes the store, late access fails, and the entrypoint closes the listener
  before a rejected worker/store close while returning a typed shutdown error.
- Performance boundary: the bounded SQLite lock fixture returned retryable `BUSY_RETRYABLE` without a
  partial transition. No simulation-load, 100 ms reconciliation, hosted-concurrency, or long-replay
  claim was made.

## Analysis and closure

- Failure classification: the initial Red proofs exposed routine event-type leakage, mutation-revision
  override, and non-atomic first bootstrap metadata; each was corrected and the complete focused gates
  were rerun green.
- Intentionally unrun: world-clock advancement and downtime catch-up, semantic gameplay reducer,
  production migration, external delivery, WebMCP, browser UI, hosted deployment, and full repository
  test suites. Schema version 1 had no older compatible migration to execute; incomplete or newer shapes
  refuse to open instead of being silently migrated.
- Residual risk: CP-06 still owns world-time authority, scheduler recovery, and due-work ordering;
  CP-07 owns generator values; CP-08+ own gameplay and projections; CP-13/14 own WebMCP and external
  Re-entry; CP-17 owns hosting and production operations.
- Invalidation triggers: any change to `SK-MVP-0.2`, the minimum schema or snapshot shape, Node.js/SQLite
  baseline, CP-04 lifecycle authority, Signal delivery policy, or the named CP-05 source/tests.
- Exact conclusion: CP-05 is `runtime_verified` for the local persistence foundation and its CP-04
  lifecycle seam. No world-running, gameplay, Agent, hosted, or submission claim follows.
