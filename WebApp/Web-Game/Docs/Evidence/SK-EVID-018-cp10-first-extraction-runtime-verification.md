# SK-EVID-018: CP-10 First Extraction and Cargo Runtime Verification

**Status:** `pass` for one local first-extraction boundary  
**Date:** 2026-09-02  
**Task:** [`SK-TASK-029`](../Tasks/SK-TASK-029-cp10-first-extraction-and-cargo.md)  
**Decision:** [`ADR-GAME-0020`](../Decisions/ADR-GAME-0020-cp10-first-extraction-and-cargo.md)  
**Challenge:** [`Validation/25-cp10-first-extraction-preimplementation-challenge.md`](../Validation/25-cp10-first-extraction-preimplementation-challenge.md)  
**Contract:** `SK-MVP-0.2`  
**Evidence class:** process-runtime ladder level 4 (local process, file-backed SQLite, worker-owned clock and injected phase seam)

## Claim boundary

This evidence proves one deterministic Wood/Rock extraction after a verified CP-09 route arrival.
It does not prove recurring extraction, capacity-triggered return, node depletion/respawn, recall,
home travel, deposit, coins, combat, browser/UI, WebMCP, Re-entry delivery, default scheduler
composition, hosted continuity, production balance, or judge reproduction.

The tests use the real `PersistenceStore`, file-backed SQLite WAL, `WorldClock`, and
`WorldWorkerModule`. The extraction handler is explicitly injected into the existing clock's
`extraction` phase for this bounded local proof; the default production entrypoint does not yet claim
that gameplay phase composition.

## Runtime identity and fixture

- Node.js: `v24.18.0` (explicit Node 24 binary)
- npm: `11.16.0` (explicit Node 24 npm CLI)
- TypeScript: `7.0.2`
- Next.js: `16.3.4`
- Contract: `SK-MVP-0.2`
- Schema: `4`, migration `cp10-001`
- Fixture: `sleepless-mvp-01`, world `cp10-extraction-world`
- Players: `player-a`/`shelter-a` and `player-b`/`shelter-b`
- Targets: Wood `node-wood-a` (20 units) and Rock `node-rock-a` (20 units)
- No network, browser, external Agent, Re-entry Core, or hosted service was used.

## Contract-first TDD record

### Red

Before implementation, the focused command failed because the registered extraction service did not
exist:

```text
/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/tsx/dist/cli.mjs --test tests/cp10-first-extraction.test.ts
Error [ERR_MODULE_NOT_FOUND]: Cannot find module .../src/server/mission-extraction-service
```

The migration regression and skipped-boundary assertions were written in the same focused test file
before their implementation path was available.

### Green and refactor

The implementation adds the schema-v4 cargo provenance fields and atomic store boundary, then wires
the first post-arrival due marker to `MissionExtractionService`. The focused suite passes **12/12**:

- arrival arms `T + 2` and cannot extract at `T`;
- Wood/Axe and Rock/Pickaxe extraction create exactly one unit;
- node decrement, cargo provenance, revisions, event cursor/payload, and shelter visibility commit
  together;
- no coin is created in the field;
- duplicate due pass and stored idempotency replay do not duplicate effects;
- full cargo, empty node, stale persisted loadout, and skipped durable boundary fail visibly;
- injected transaction failure rolls back node, cargo, due marker, revisions, cursor, and event;
- schema-3 cargo shape migrates transactionally to schema 4; and
- restart reaches a due extraction once and does not replay committed cargo.

## Commands and observed results

All commands below ran from `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`.

| Check | Command | Result |
|---|---|---|
| Focused CP-10 | `/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/tsx/dist/cli.mjs --test tests/cp10-first-extraction.test.ts` | **12/12 pass** |
| Affected aggregate | `/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/tsx/dist/cli.mjs --test tests/cp05-persistence.test.ts tests/cp06-clock-recovery.test.ts tests/cp07-world-fixture.test.ts tests/cp08-movement-snapshot.test.ts tests/cp08-worker-movement.test.ts tests/cp08-worker-gateway.test.ts tests/cp08-realtime-snapshot.test.ts tests/cp08-realtime-wire.test.ts tests/cp09-mission-dispatch.test.ts tests/cp09-route-milestone.test.ts tests/cp10-first-extraction.test.ts` | **95/95 pass** |
| Typecheck | `/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/typescript/bin/tsc --noEmit` | **pass** |
| Production build | `/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/next/dist/bin/next build` | **pass** |
| Dependency closure | `/Users/alex/.nvm/versions/node/v24.18.0/bin/node /Users/alex/.nvm/versions/node/v24.18.0/lib/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --dry-run` | **pass; up to date** |
| Documentation self-test | `python3 scripts/test_validate_game_docs.py` | **21/21 pass** |
| Documentation validator | `python3 scripts/validate_game_docs.py --root . --report` | **pass; one active task before closure** |
| Scoped diff check | `git diff --check -- WebApp/Web-Game` | **pass** |

## Durable proof

The first Wood extraction at world time 7 leaves the node at 19, creates one cargo row with the same
`mission_attempt_id` and `source_node_id`, `quantity = 1`, `capacity_used = 1`, and
`acquired_world_time = 7`, advances the node/mission/attempt revisions, emits one `CargoExtracted`
event at world cursor 3, and leaves shelter coins at zero. The paired due marker is consumed only
after the transaction succeeds. A restart from world time 6 reaches the same due boundary and creates
one cargo/event; a second recovery pass is a no-op.

Schema migration adds `mission_attempt_id`, `source_node_id`, `acquired_world_time`, and
`capacity_used` to legacy schema-3 cargo rows in one transaction. New extraction rows populate every
provenance field; legacy nullable provenance is retained only for pre-v4 rows and is never inferred as
a new extraction.

## Residual risks and next boundary

- Recurring two-second extraction, fifth-slot return, partial depletion, return navigation, shelter
  deposit, and coin conversion remain the next CP-10 work; they are deliberately outside this claim.
- Default `WorldWorkerModule`/hosted entrypoint composition does not yet install the movement,
  extraction, and later gameplay phase handlers together. A future scheduler-composition task must
  prove that seam before claiming an always-on game world.
- Simultaneous node contest, reservation, weighted capacity, future tool yield, combat transfer, and
  browser/dashboard cargo projection remain open decisions or later checkpoints.
- The local tests do not establish WebMCP capability, Re-entry delivery, hosted storage, or public
  authentication.
