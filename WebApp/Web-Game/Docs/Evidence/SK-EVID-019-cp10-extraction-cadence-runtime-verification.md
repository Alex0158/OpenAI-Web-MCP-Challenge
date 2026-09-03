# SK-EVID-019: CP-10 Extraction Cadence and Return-Handoff Runtime Verification

**Status:** `pass` for recurring local Wood/Rock extraction and the bounded `RETURNING` handoff  
**Date:** 2026-09-02  
**Task:** [`SK-TASK-030`](../Tasks/SK-TASK-030-cp10-extraction-cadence-and-return-handoff.md)  
**Decision:** [`ADR-GAME-0021`](../Decisions/ADR-GAME-0021-cp10-extraction-cadence-and-return-handoff.md)  
**Challenge:** [`Validation/27-cp10-extraction-cadence-and-return-preimplementation-challenge.md`](../Validation/27-cp10-extraction-cadence-and-return-preimplementation-challenge.md)  
**Contract:** `SK-MVP-0.2`  
**Evidence class:** process-runtime ladder level 4 (local process, file-backed SQLite, worker-owned clock and injected phase seam)

## Claim boundary

This evidence proves one role-locked GATHERER can process successive due Wood/Rock milestones on the
existing cargo stack. It proves one unit per due boundary, the paired two-world-second cadence, the
five-slot stop, final-node depletion metadata, causal event ordering, idempotency, rollback, and
restart recovery. It does not prove return movement, home crossing, shelter deposit, coins, combat,
combat cargo transfer, node respawn execution, weighted capacity, a full contest/reservation policy,
browser/UI, WebMCP, Re-entry delivery, default all-phase scheduler composition, hosted continuity,
production balance, or judge reproduction.

The tests use the real `PersistenceStore`, file-backed SQLite WAL, `WorldClock`, and
`WorldWorkerModule`. The movement and extraction handlers are explicitly injected into the existing
clock phases for this bounded local proof. The default production entrypoint still does not claim that
all gameplay phase handlers are composed.

## Runtime identity and fixture

- Node.js: `v24.18.0` (explicit Node 24 binary)
- npm: `11.16.0` (explicit Node 24 npm CLI)
- TypeScript: `7.0.2`
- Next.js: `16.3.4`
- Contract: `SK-MVP-0.2`
- Schema: `4`, migration `cp10-001`
- Fixture: `sleepless-mvp-01`, world `cp10-cadence-world`
- Players: `player-a`/`shelter-a` and `player-b`/`shelter-b`
- Targets: Wood `node-wood-a` (20 units) and Rock `node-rock-a` (20 units)
- No network, browser, external Agent, Re-entry Core, or hosted service was used.

## Contract-first TDD record

### Red

Before the recurring implementation was available, the registered cadence suite failed because the
first extraction still consumed the due marker without updating an existing cargo stack, scheduling a
successor marker, or writing the stop/depletion handoff. Two additional boundary-hardening tests then
failed against the pre-hardening store because it accepted a caller-selected next marker and a forged
extraction payload.

### Green and refactor

The implementation extends the schema-v4 provenance row without a schema-version change. Each due
milestone validates the persisted identity, role, tool, target, revisions, equal-weight cargo shape,
and exact event payload before one transaction updates the node, cargo stack, paired due markers,
mission phase, event cursor, and idempotency record. A non-terminal milestone writes `D + 2`; the
fifth slot or final node unit clears due work and emits `MissionAutoReturned`. A final node unit also
writes the 30-second node marker and emits `ResourceDepleted`.

The focused suite passes **21/21**:

- successive milestones increment one deterministic provenance stack and preserve the two-second
  cadence;
- capacity five commits the fifth unit once and transitions to `RETURNING`;
- a final node unit writes the 30-second depletion marker and emits events in
  `CargoExtracted`, `ResourceDepleted`, `MissionAutoReturned` order;
- duplicate replay returns the original result and event ids without a second effect;
- caller-selected markers, forged quantities, malformed cargo, stale loadout, full cargo, empty
  targets, and skipped boundaries fail before an unauthorized mutation;
- injected failure rolls back node, cargo, phase, due markers, revisions, cursor, and idempotency;
- restart resumes the persisted due marker once; and
- schema migration and the predecessor first-extraction contract remain green.

## Commands and observed results

All commands below ran from `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`.

| Check | Command | Result |
|---|---|---|
| Focused CP-10 | `/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/tsx/dist/cli.mjs --test tests/cp10-extraction-cadence.test.ts tests/cp10-first-extraction.test.ts` | **21/21 pass** |
| Affected aggregate | `/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/tsx/dist/cli.mjs --test tests/cp05-persistence.test.ts tests/cp06-clock-recovery.test.ts tests/cp07-world-fixture.test.ts tests/cp08-movement-snapshot.test.ts tests/cp08-worker-movement.test.ts tests/cp08-worker-gateway.test.ts tests/cp08-realtime-snapshot.test.ts tests/cp08-realtime-wire.test.ts tests/cp09-mission-dispatch.test.ts tests/cp09-route-milestone.test.ts tests/cp10-first-extraction.test.ts tests/cp10-extraction-cadence.test.ts` | **104/104 pass** |
| Typecheck | `/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/typescript/bin/tsc --noEmit` | **pass** |
| Production build | `/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/next/dist/bin/next build` | **pass** |
| Dependency closure | `/Users/alex/.nvm/versions/node/v24.18.0/bin/node /Users/alex/.nvm/versions/node/v24.18.0/lib/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --dry-run` | **pass; up to date** |
| Documentation self-test | `python3 scripts/test_validate_game_docs.py` | **21/21 pass** |
| Documentation validator | `python3 scripts/validate_game_docs.py --root . --report` | **pass; 0 non-terminal tasks of 30** |
| Scoped diff check | `git diff --check -- WebApp/Web-Game` | **pass for tracked paths; untracked-file validation follows the docs gate** |

## Durable proof

In `cp10-cadence-world`, dispatch at world time 0 arrives at time 5 and arms extraction at time 7.
The first unit leaves Wood quantity 19, cargo quantity/capacity 1, and the paired next marker at 9.
The second due boundary at 9 leaves Wood quantity 18, the same cargo id with quantity/capacity 2,
revision 1, first acquisition time 7, and the paired next marker at 11.

With a pre-existing four-slot stack, the fifth unit leaves quantity/capacity 5, clears both due
markers, changes mission and attempt to `RETURNING`, and appends `CargoExtracted` followed by
`MissionAutoReturned`. With a one-unit node, the same boundary leaves node quantity 0, writes
`next_due_world_time = 37`, and appends `CargoExtracted`, `ResourceDepleted`, and
`MissionAutoReturned` with world cursors 3 through 5. A restart before the second due boundary
reopens the same database and credits exactly one second unit; a repeated recovery at that boundary
is a no-op.

## Residual risks and next boundary

- A second active attempt that encounters a node already consumed by another transaction receives a
  typed target/revision failure; deterministic contest and node-reservation policy remain a separate
  task before claiming multi-soldier contest continuity.
- Return navigation, home crossing, deposit/coin settlement, respawn execution, combat transfer,
  browser projection, WebMCP/Re-entry, and default all-phase scheduler composition remain open.
- The equal-weight stack keeps the first unit's `acquired_world_time`; later milestone times are
  preserved by the event log. A future weighted or per-unit cargo model would reopen this boundary.
- The local tests do not establish hosted storage, production identity, real page capability, or
  Agent delivery.
