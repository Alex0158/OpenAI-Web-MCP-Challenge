# SK-EVID-009: CP-06 Clock Runtime Verification

## Identity

- Evidence ID: `SK-EVID-009`
- Related task, issue, or decision: `SK-TASK-020`, `ADR-GAME-0012`, `ADR-GAME-0011`
- Evidence class: `process-runtime`
- Ladder level: `4`
- Executor and date: `Codex primary session; 2026-09-02`

## Exact identity under test

- Source state: working tree on `main` at Git commit `81ee4392d173d796e404101818b741c0b64b861b`; CP-06 source, tests, and documentation changes are intentionally uncommitted.
- Contract version: `SK-MVP-0.2`
- Runtime versions: Node.js `v24.18.0` selected through `/Users/alex/.nvm/versions/node/v24.18.0/bin`, npm `11.17.0`, Next.js `16.3.4`, TypeScript `7.0.2`, and the built-in `node:sqlite` driver.
- Fixture world and seed: synthetic `world-clock-fixture-01` plus file-backed restart fixture `world-clock-worker-fixture-01`, using `sleepless-mvp-01` / `g2-fixture-1`; each database is created in a temporary directory and removed by the test.
- Environment and configuration: local macOS process; no browser, secrets, external Receiver, WebMCP adapter, hosted database, or public service.

## Objective and claim boundary

- Behavior under test: worker-owned integer clock, 100 ms projection interpolation, deterministic CP-06 phase order, monotonic persistence advancement, bounded 300-second recovery, typed over-limit/backward outcomes, duplicate-target behavior, and close/reopen lifecycle.
- Claim this evidence may support: the named local `WorldClock` and `PersistenceStore` boundary executes the accepted CP-06 precision, order, recovery, persistence, and optional worker lifecycle contracts under the isolated fixtures.
- Claims this evidence cannot support: a continuously advancing default world, real trusted server-time anchoring, active gameplay due-work reducers, movement, extraction, combat, settlement, snapshot/event scheduler replay, browser/client snapshots, WebMCP discovery, external Agent delivery, hosted continuity, load, balance, or Hackathon submission readiness.

## Preconditions and fixture

- Starting state: CP-05 file-backed store and CP-04 worker lifecycle are locally verified; the active task's Red harness intentionally imports the absent clock seam before Green implementation.
- Synthetic identities and seeded actors: isolated world IDs only; phase handlers record order and do not mutate gameplay entities.
- Real, fake, and stubbed boundaries: actual Node.js `node:sqlite`, `PersistenceStore`, `WorldClock`, and `WorldWorkerModule` are used; phase callbacks are synthetic; browser and external delivery boundaries are absent.

## Execution

- Exact commands:
  - `SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp06`
  - `SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run typecheck`
  - `SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp05`
  - `SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run test:cp04`
  - `SK_NODE_BIN=/Users/alex/.nvm/versions/node/v24.18.0/bin; PATH="$SK_NODE_BIN:$PATH" npm run build`
  - `python3 scripts/test_validate_game_docs.py`
  - `python3 scripts/validate_game_docs.py --root . --report`
  - `git diff --check -- WebApp/Web-Game`
- Expected result: all CP-06 fixtures, affected CP-05/CP-04 suites, typecheck, build, and documentation checks pass; no over-limit recovery mutates durable state.
- Actual result: 8 CP-06 tests passed; 26 CP-05 tests passed; 5 CP-04 tests passed; TypeScript typecheck and Next.js production build passed; 21 documentation self-tests and the full documentation validator passed; `git diff --check` passed for the repository's tracked game diff.
- Status: `pass`
- Output location: bounded command output and assertions were read in the local session; temporary databases were removed by the fixtures; no raw logs, credentials, or runtime databases were committed.

## Assertions

- Precision and authority: nine 100 ms steps leave persisted `world_time` at `1000` with `interpolationAlpha = 0.9`; the tenth step advances exactly to `1001`. No browser or wall clock is read.
- Order and duplicate behavior: one integer boundary invokes the seven accepted phases in order; a repeated target returns zero processed boundaries and does not invoke phase hooks again.
- Recovery and failure: exact 300 seconds advances 300 boundaries; a 301-second target returns `RECOVERY_LIMIT_EXCEEDED`, leaves the world at `1000`, invokes no hook, enters `recovery_blocked`, and resumes only through explicit 300-second then one-second targets. Backward recovery returns `WORLD_TIME_REGRESSION` without changing the running time.
- Persistence and restart: `advanceWorldTime` is transaction-scoped and rejects backward updates; a real file-backed worker closes, a new worker/clock reopens the same world at its last durable boundary, and recovery continues from there.
- Lifecycle: the optional worker hook opens the store before clock start and stops the clock before store close; existing CP-04 process health and listener-first shutdown remain separate concerns.

## Analysis and closure

- Failure classification: the initial Red proof failed because the clock module did not exist, as intended. Green implementation then exposed and fixed a state transition bug where a completed tick remained `recovering`; the focused suite was rerun after the fix.
- Intentionally unrun: default-world bootstrap, real server-time observation, active milestone reducers, gameplay transaction crash points, browser/client projection, external Agent handoff, hosted deployment, performance load, and the full repository suite. These are later checkpoint gates or outside the registered task.
- Limitations and residual risk: phase callbacks are synthetic ordering hooks and are not a substitute for atomic domain transition handlers; the optional lifecycle hook is not a default world bootstrap; no evidence here proves long-offline hosted continuity or a 100 ms load budget.
- Invalidation triggers: changes to `SK-MVP-0.2`, ADR-GAME-0012, phase order, persistence schema, worker lifecycle, Node/SQLite baseline, fixture seed, or the named CP-06 sources/tests.
- Exact conclusion: CP-06 is `runtime_verified` for the local worker-owned clock, monotonic persistence, bounded recovery, and restart lifecycle boundary. Later checkpoints still own the playable world, domain scheduler, gameplay settlement, page, Agent, and hosted claims.
