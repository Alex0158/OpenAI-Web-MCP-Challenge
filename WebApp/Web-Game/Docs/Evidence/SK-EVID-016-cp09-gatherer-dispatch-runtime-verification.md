# SK-EVID-016: CP-09 Gatherer Dispatch Runtime Verification

## Evidence control

- Evidence ID: `SK-EVID-016`
- Related task: [`SK-TASK-027`](../Tasks/SK-TASK-027-cp09-gatherer-dispatch-and-role-lock.md)
- Related decision: [`ADR-GAME-0018`](../Decisions/ADR-GAME-0018-cp09-mission-dispatch-and-role-lock.md)
- Preparation challenge: [`21-cp09-gatherer-dispatch-preimplementation-challenge.md`](../Validation/21-cp09-gatherer-dispatch-preimplementation-challenge.md)
- Predecessors: [`SK-EVID-015`](SK-EVID-015-cp08-realtime-wire-runtime-verification.md), [`SK-EVID-014`](SK-EVID-014-cp08-realtime-snapshot-runtime-verification.md), and [`SK-EVID-007`](SK-EVID-007-cp04-process-runtime-verification.md)
- Evidence class: `process-runtime`
- Ladder level: `4`
- Executor and date: Codex primary session; 2026-09-02
- Source state: working tree on `main` at Git commit `e71977a95c61383906d78527e4d3e392f24581d5`; CP-09 source, tests, and documentation are intentionally uncommitted.

## Exact identity under test

- Contract version: `SK-MVP-0.2`
- Node.js: `v24.18.0`
- npm: `11.16.0` through the Node 24 npm CLI
- TypeScript: `7.0.2`
- Fixture: `sleepless-mvp-01`, generation `g2-fixture-1`, map fingerprint derived from the fixture manifest
- Persistence: a fresh file-backed SQLite database per test, opened by a real `WorldWorkerModule` and removed from the temporary directory after the test
- World: isolated `cp09-mission-world` with Player A and Player B, five stable soldiers per shelter, and server-owned Wood/Rock nodes
- Browser and network: none; the browser Canvas, WebSocket consumer, WebMCP registration, hosted identity, and Re-entry delivery remain unproven.

## Objective and claim boundary

This evidence covers the bounded CP-09 assignment boundary. A resident soldier receives one
server-derived tier-one GATHERER mission for an owned Wood or Rock node through the existing FIFO
worker gateway. The server derives the target ownership, route, map fingerprint, home anchor, mission
identity, and role/tool lock. One SQLite transaction updates the soldier, creates the mission and
attempt, appends `MissionDispatched`, and records the command idempotency result.

The evidence does not claim route traversal, extraction, cargo, return, recall, deposit, coins,
combat, death, respawn, mission projection, WebMCP, Agent delivery, browser UX, deployment, or hosted
continuity.

## Contract-first execution

The Red harness was written before the mission gateway method and CP-09 implementation existed. The
first focused run failed all six initial cases with `TypeError: runtime.gateway.assignSoldierMission
is not a function`. The smallest schema-v3 store transaction, mission service, and gateway capability
then turned the harness Green. The harness was extended with rejected-outcome replay, serialized race,
missing target, and schema-2 migration cases.

The implemented business chain is:

```text
assign_soldier_mission command
-> WorkerCommandGateway FIFO admission
-> MissionService server-bound player/shelter/soldier/fixture checks
-> deterministic GATHERER tool and open-grid route plan
-> PersistenceStore BEGIN IMMEDIATE
-> idempotency replay-or-new check
-> binding, ownership, target quantity, revision, resident-state, and role checks
-> soldier FIELD transition
-> mission and mission_attempt TRAVELLING rows
-> one ordered MissionDispatched event and entity revisions
-> committed idempotency result
-> typed result or transaction rollback with a rejected idempotency record
```

## Exact closure commands

```text
/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/tsx/dist/cli.mjs --test tests/cp09-mission-dispatch.test.ts
/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/tsx/dist/cli.mjs --test tests/cp04-process-skeleton.test.ts tests/cp05-persistence.test.ts tests/cp06-clock-recovery.test.ts tests/cp07-world-fixture.test.ts tests/cp08-movement-snapshot.test.ts tests/cp08-worker-movement.test.ts tests/cp08-worker-gateway.test.ts tests/cp08-realtime-snapshot.test.ts tests/cp08-realtime-wire.test.ts tests/cp09-mission-dispatch.test.ts
/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/typescript/bin/tsc --noEmit
/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/next/dist/bin/next build
/Users/alex/.nvm/versions/node/v24.18.0/bin/node /Users/alex/.nvm/versions/node/v24.18.0/lib/node_modules/npm/bin/npm-cli.js ci --dry-run --ignore-scripts
python3 scripts/test_validate_game_docs.py
python3 scripts/validate_game_docs.py --root . --report
git diff --check -- WebApp/Web-Game
```

## Observed results

- Focused CP-09 suite: **9 tests passed**, with no failures, cancellations, skips, or expected-fail cases.
- CP-04 through CP-09 transitive aggregate: **82 tests passed**, with no failures, cancellations,
  skips, or expected-fail cases.
- TypeScript typecheck: passed on Node `v24.18.0`.
- Next production build: passed on Next `16.3.4`.
- Node 24 `npm ci --dry-run --ignore-scripts`: passed; no new dependency was introduced for CP-09.
- Documentation self-tests: **21 tests passed**.
- Documentation validator: passed with zero non-terminal tasks before the next task is registered.
- Scoped whitespace check: passed.

## Assertions

1. A valid Wood assignment uses `GATHERER` + `AXE`; a valid Rock assignment uses `GATHERER` +
   `PICKAXE`. Both use tier one and the default `WHEN_FULL` return policy.
2. The route includes the server fixture shelter anchor and target, follows deterministic x-then-y
   Manhattan neighbours, records the fixture map fingerprint, and remains `PLANNED`; no movement or
   extraction is implied.
3. The soldier changes from `AT_SHELTER` to `FIELD` at revision 1. The mission and attempt are
   `ACTIVE`/`TRAVELLING`, share one active attempt id, and retain the stable soldier identity.
4. The event cursor, affected entity revisions, mission/attempt rows, soldier mutation, and committed
   idempotency row are created together. A rejected dispatch leaves no mission, attempt, event, or
   soldier mutation and replays the typed rejection for the same key.
5. Wrong binding, cross-shelter target, missing target, stale revision, incompatible tool, and field
   role change are visible typed failures. Two concurrent gateway submissions for one soldier produce
   exactly one assignment because the FIFO and revision/state checks serialize them.
6. Existing schema-1 and schema-2 databases migrate to schema version 3 (`cp09-001`) while preserving
   the fixture and existing player data.

## Intentionally unrun and residual risk

- No browser or Canvas consumer was exercised; the existing CP-08 wire and projection evidence remains
  separate from this mission command.
- No world timer or soldier traversal was started. The route is a durable plan for the next CP-09
  increment, not an arrival or resource claim.
- Fixture ownership and resource type are validated by the server-side `MissionService`; CP-10 must
  keep target ownership and quantity predicates in the same transaction when extraction becomes
  concurrent.
- Mission rows are not yet included in a client snapshot or WebMCP tool schema. Those are later
  surface gates and do not reduce the assignment boundary proved here.

## Closure

Status: `pass`. `SK-TASK-027` is runtime-verified for schema-v3 migration, one server-owned GATHERER
dispatch, deterministic route/home-anchor handoff, atomic event/idempotency state, and field role-lock
rejection. Travel, extraction, return, recall, settlement, combat, browser, Agent, and hosted claims
remain separately gated.
