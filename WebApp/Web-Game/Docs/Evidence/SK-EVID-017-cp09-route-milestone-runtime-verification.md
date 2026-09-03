# SK-EVID-017: CP-09 Route Milestone Runtime Verification

## Evidence control

- Evidence ID: `SK-EVID-017`
- Related task: [`SK-TASK-028`](../Tasks/SK-TASK-028-cp09-route-milestone-and-derived-transit.md)
- Related decision: [`ADR-GAME-0019`](../Decisions/ADR-GAME-0019-cp09-route-milestone-and-derived-transit.md)
- Preparation challenge: [`23-cp09-route-milestone-preimplementation-challenge.md`](../Validation/23-cp09-route-milestone-preimplementation-challenge.md)
- Predecessor evidence: [`SK-EVID-016`](SK-EVID-016-cp09-gatherer-dispatch-runtime-verification.md)
- Evidence class: `process-runtime`
- Ladder level: `4`
- Executor and date: Codex primary session; 2026-09-02
- Source state: working tree on `main` at Git commit `e71977a95c61383906d78527e4d3e392f24581d5`; CP-09 source, tests, and documentation are intentionally uncommitted.

## Exact identity under test

- Contract version: `SK-MVP-0.2`
- Node.js: `v24.18.0`
- npm: `11.16.0` through the Node 24 npm CLI
- TypeScript: `7.0.2`
- Next.js: `16.3.4`
- Fixture: `sleepless-mvp-01`, generation `g2-fixture-1`, with the persisted fixture map fingerprint
- Persistence: fresh file-backed SQLite databases per test, opened by a real `PersistenceStore`, `WorldWorkerModule`, and `WorldClock`; restart cases close and reopen the same file
- World: isolated `cp09-route-world` with Player A and Player B, stable soldiers, and server-owned Wood/Rock nodes
- Browser and network: none; Canvas, WebSocket consumer behavior, WebMCP registration, external Re-entry delivery, hosted identity, and hosted continuity remain unproven

## Objective and claim boundary

This evidence covers one server-owned GATHERER route from the CP-09 dispatch handoff to its arrival
milestone. Dispatch persists an immutable route, `start_world_time`, and a `next_due_world_time`.
The movement phase derives the in-transit position from those durable inputs and the accepted
3.0-tiles-per-world-second rate. At the due boundary it atomically moves the mission and attempt from
`TRAVELLING` to `WORKING`, clears the consumed due marker, advances revisions, and emits one
`MissionWorking` event.

The evidence does not claim extraction, node depletion, cargo, return, recall, deposit, coins,
encounters, combat, death, respawn, reissue, browser presentation, WebMCP, Agent delivery, Re-entry,
the default hosted scheduler, production identity, or an always-on deployment.

## Preconditions and fixture

- Each route test creates the accepted deterministic G2 fixture only when its world is absent, then
  opens the same file through a real worker-owned store and clock.
- The route is Player A's shelter `(16,64)` to the owned Wood node `(30,64)`: 14 adjacent tiles,
  five world seconds of travel, and a due marker at world time `5` when dispatch starts at `0`.
- The phase handler is explicitly injected into the existing `WorldClock` movement seam. No browser,
  wall-clock timer, second listener, or alternative scheduler is used.
- The migration regression drops CP-09-only columns from a disposable v3 database and marks its
  metadata as schema 2; this is a test instrument for the real transactional migration path.

## Contract-first execution

1. **Red:** the first route harness was written before `mission-travel-service.ts` existed. The
   focused run failed with `ERR_MODULE_NOT_FOUND` for that missing service.
2. **Green:** the smallest due-marker, derived-position, arrival transaction, persistence read/query,
   and worker movement-phase wiring turned the route harness green.
3. **Regression Red:** the migration harness then removed `next_due_world_time` from the emulated
   schema-2 mission rows and failed visibly with `SCHEMA_INCOMPATIBLE`; the migration was corrected
   to add both nullable due columns atomically.
4. **Regression Red:** a boundary proof initially found that a direct route handler could skip from
   durable world time `0` to boundary `5`; the handler now rejects that leap with
   `RECOVERY_REQUIRED`, leaving time and mission state unchanged.
5. **Refactor:** route validation, identity parity, due-marker parity, and the one-boundary scheduler
   guard were tightened without adding a new event, schema version, contract version, or settlement
   effect.

The verified business chain is:

```text
assign_soldier_mission
-> worker FIFO and CP-09 server checks
-> atomic MissionDispatched handoff with route/start/due marker
-> WorldClock movement boundary
-> due-attempt query and route projection
-> atomic mission + mission_attempt TRAVELLING -> WORKING transition
-> one MissionWorking Domain Event and idempotency record
-> current durable state available after restart
```

## Exact closure commands

```text
/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/tsx/dist/cli.mjs --test tests/cp09-route-milestone.test.ts
/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/tsx/dist/cli.mjs --test tests/cp09-mission-dispatch.test.ts
/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/tsx/dist/cli.mjs --test tests/cp04-process-skeleton.test.ts tests/cp05-persistence.test.ts tests/cp06-clock-recovery.test.ts tests/cp07-world-fixture.test.ts tests/cp08-movement-snapshot.test.ts tests/cp08-worker-movement.test.ts tests/cp08-worker-gateway.test.ts tests/cp08-realtime-snapshot.test.ts tests/cp08-realtime-wire.test.ts tests/cp09-mission-dispatch.test.ts tests/cp09-route-milestone.test.ts
/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/typescript/bin/tsc --noEmit
/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/next/dist/bin/next build
/Users/alex/.nvm/versions/node/v24.18.0/bin/node /Users/alex/.nvm/versions/node/v24.18.0/lib/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --dry-run
python3 scripts/test_validate_game_docs.py
python3 scripts/validate_game_docs.py --root . --report
git diff --check -- WebApp/Web-Game
```

## Observed results

- Focused CP-09 route suite: **6 tests passed**, with no failures, cancellations, skips, or expected-fail cases.
- CP-09 dispatch suite after the migration correction: **9 tests passed**.
- CP-04 through CP-09 transitive aggregate: **88 tests passed**, with no failures, cancellations,
  skips, or expected-fail cases.
- TypeScript typecheck: passed on Node `v24.18.0`.
- Next production build: passed on Next `16.3.4`.
- Node 24 `npm ci --dry-run --ignore-scripts`: passed; no new dependency was introduced for this task.
- Documentation self-tests: **21 tests passed**.
- Documentation validator: passed with `SK-TASK-028` as the only non-terminal task at the time of
  this evidence capture.
- Scoped whitespace check: passed.

## Assertions

1. The Wood route's due marker is `5`; projecting the same route at world time `4` twice returns the
   same midpoint `(28,64)` and a time regression is rejected visibly.
2. At world time `4` the mission and attempt remain `TRAVELLING` and no `MissionWorking` event
   exists. At the due boundary `5`, both rows become `WORKING` at revision `1`, both due markers are
   cleared, and exactly one `MissionWorking` event carries the stable identities, route, and arrival.
3. Arrival does not decrement the resource node, create cargo, create coins, or change the soldier's
   `FIELD` lifecycle. Extraction remains a later CP-10 effect.
4. A repeated due-boundary pass, a same-boundary second route worker, and restart recovery produce no
   second event, revision, or state effect. The persisted world resumes at time `3` and reaches the
   same arrival at `5`.
5. A route handler cannot leap over an unprocessed clock boundary: calling it at world time `5` while
   durable time is `0` returns `RECOVERY_REQUIRED` and leaves the world, mission, and event history
   unchanged.
6. A schema-2 database missing the new due columns migrates to `3/cp09-001`; both columns exist and
   historical rows start with `NULL` due metadata rather than an invented milestone.
7. The implementation keeps the accepted event vocabulary and contract version. No per-waypoint
   event, client coordinate, second scheduler, extraction effect, or new schema version was added.

## Analysis and closure

- Failure classification: product boundary and migration defect found by the regression harness;
  both were corrected within this task before closure.
- Residual risk: intermediate position is derived rather than durably cursored; the target, route,
  movement rate, and walkability are fixture assumptions; multi-process lease ownership and default
  hosted scheduler composition remain later gates; mission projection is not yet in `client_snapshot`.
- Invalidation triggers: a route or target mutation, changed movement rate, terrain modifier, new
  event/schema/contract requirement, alternate scheduler owner, or any extraction/encounter/return
  effect entering this boundary.
- Exact conclusion: `SK-TASK-028` is **runtime-verified at ladder level 4** for one local,
  restart-safe CP-09 GATHERER route-to-arrival boundary. It proves neither the later economy chain
  nor browser, Agent, WebMCP, Re-entry, hosted, or judge behavior.
