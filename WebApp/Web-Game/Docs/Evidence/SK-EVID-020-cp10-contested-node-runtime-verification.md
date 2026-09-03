# SK-EVID-020: CP-10 Contested Node Runtime Verification

**Status:** `pass` for the bounded same-worker Wood/Rock contest outcome and world-clock continuation  
**Date:** 2026-09-02  
**Task:** [`SK-TASK-031`](../Tasks/SK-TASK-031-cp10-contested-node-outcome.md)  
**Decision:** [`ADR-GAME-0022`](../Decisions/ADR-GAME-0022-cp10-contested-node-outcome.md)  
**Challenge:** [`Validation/29-cp10-contested-node-preimplementation-challenge.md`](../Validation/29-cp10-contested-node-preimplementation-challenge.md)  
**Contract:** `SK-MVP-0.2`  
**Evidence class:** process-runtime ladder level 4 (local process, file-backed SQLite, worker-owned clock, and injected phase seam)

## Claim boundary

This record proves the selected single-authoritative-worker outcome when two due GATHERER attempts
target the same Wood/Rock node. Due work is ordered by `(dueWorldTime, missionAttemptId)`; an available
unit is committed by the existing extraction transaction, and an attempt that reloads the node at zero
is atomically moved from `WORKING` to `RETURNING` with `TARGET_DEPLETED`. The loser keeps its exposed
field cargo, emits one return event, and does not decrement the node or emit a second depletion event.
The record also proves two-unit sharing, pre-empty target handling, duplicate replay, forged-input
rejection, rollback, restart, event order, and clock continuation.

It does not prove multi-worker fairness or reservation leases, return route movement, home crossing,
deposit, coins, combat, respawn, browser/UI, WebMCP, Re-entry delivery, the default all-phase worker
composition, hosted continuity, production balance, or judge reproduction. Movement and extraction
handlers are injected into the existing clock in this local harness; this is not a hosted scheduler
claim.

## Runtime identity and fixture

- Source state: working tree on `main`, HEAD `e71977a95c61383906d78527e4d3e392f24581d5`; no files were staged, committed, pushed, or deployed for this increment.
- Node.js: `v24.18.0` (explicit binary)
- npm: `11.16.0` (explicit Node 24 CLI)
- TypeScript: `7.0.2`
- Next.js: `16.3.4`
- Contract: `SK-MVP-0.2`
- Schema: `4`, migration `cp10-001`
- Fixture: `sleepless-mvp-01`, world `cp10-cadence-world`
- Players: `player-a`/`shelter-a` and `player-b`/`shelter-b`
- Soldiers: `soldier-a-01` and `soldier-a-02`, both owned by `shelter-a`
- Targets: Wood `node-wood-a` and Rock `node-rock-a`; contest vectors set Wood to one or two units as required
- Persistence: file-backed SQLite with WAL and foreign keys
- External boundaries: no network, browser, external Agent, WebMCP, Re-entry Core, or hosted service

## Contract-first TDD record

### Red

Before the contest branch existed, the final-unit two-soldier fixture failed at the later attempt with
typed `TARGET_UNAVAILABLE`; the worker-owned clock consequently entered `recovery_blocked` and the
losing mission remained unresolved. This was a normal node contest reported as infrastructure
recovery. The pre-empty no-cargo case also remained a required visible target failure and was kept as a
regression contract while the contest path was added.

### Green and refactor

The smallest change added a server-only target-depleted return input/result and transaction. The
service reloads each candidate and tracks nodes depleted by an earlier ordered attempt in the current
boundary. A current zero node is eligible for the return handoff only when that same-boundary depletion
occurred or the soldier already has exposed cargo; a pre-empty zero node with no cargo remains
`TARGET_UNAVAILABLE`. The store derives the worker binding, due marker, reason, event id, cargo totals,
and affected revisions, then commits the mission/attempt state and one `MissionAutoReturned` event in
one transaction. No schema, event vocabulary, public gateway, or contract version changed.

The focused contest file passes **17/17**. The paired CP-10 first-extraction and contest files pass
**29/29**, and the affected CP-04 through CP-10 aggregate passes **112/112**.

## Commands and observed results

All commands ran from `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`.

| Check | Command | Result |
|---|---|---|
| Focused contest | `/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/tsx/dist/cli.mjs --test tests/cp10-extraction-cadence.test.ts` | **17/17 pass** |
| CP-10 pair | `/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/tsx/dist/cli.mjs --test tests/cp10-first-extraction.test.ts tests/cp10-extraction-cadence.test.ts` | **29/29 pass** |
| Affected aggregate | `/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/tsx/dist/cli.mjs --test tests/cp05-persistence.test.ts tests/cp06-clock-recovery.test.ts tests/cp07-world-fixture.test.ts tests/cp08-movement-snapshot.test.ts tests/cp08-worker-movement.test.ts tests/cp08-worker-gateway.test.ts tests/cp08-realtime-snapshot.test.ts tests/cp08-realtime-wire.test.ts tests/cp09-mission-dispatch.test.ts tests/cp09-route-milestone.test.ts tests/cp10-first-extraction.test.ts tests/cp10-extraction-cadence.test.ts` | **112/112 pass** |
| Typecheck | `/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/typescript/bin/tsc --noEmit` | **pass** |
| Production build | `/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/next/dist/bin/next build` | **pass** |
| Dependency closure | `/Users/alex/.nvm/versions/node/v24.18.0/bin/node /Users/alex/.nvm/versions/node/v24.18.0/lib/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --dry-run` | **pass; up to date** |
| Documentation self-test | `python3 scripts/test_validate_game_docs.py` | **pass; 21/21** |
| Documentation validator | `python3 scripts/validate_game_docs.py --root . --report` | **pass; 0 non-terminal tasks after task closure** |
| Scoped diff check | `git diff --check -- WebApp/Web-Game` | **pass for tracked paths; untracked documentation is covered by the docs gate** |

## Durable proof

At world time 7, two attempts due on the same one-unit Wood node are processed in ascending attempt
id. The lower id commits one cargo unit, changes the node to zero, writes the existing 30-second
respawn marker, and emits `CargoExtracted` followed by `ResourceDepleted` and
`MissionAutoReturned`. The later id reloads the zero node and commits exactly one
`MissionAutoReturned(reason = TARGET_DEPLETED)` without node mutation or a second depletion event.
Both missions end in `RETURNING`, the clock remains `running`, and the only positive cargo belongs to
the deterministic winner.

With two node units, both due attempts each commit one unit and remain `WORKING`; no return or
depletion event is invented. A node that was empty before the boundary still raises
`TARGET_UNAVAILABLE` when the soldier has no cargo, preserving the earlier target-failure contract.
A pre-empty node with existing field cargo moves to `RETURNING` and reports the server-read cargo
aggregate without creating a depletion event.

The contest loss key is
`mission-extraction-contest-loss:<mission_attempt_id>:<dueWorldTime>`, and its event id is
`mission-auto-returned:<mission_attempt_id>:<dueWorldTime>:target-depleted`. Duplicate delivery
replays the stored result and event id. Forged worker binding or payload, stale positive-node input,
injected failure, and restart-before-commit leave the node, cargo, phase, due markers, revisions,
event cursor, and idempotency history unchanged until the valid retry. Restart recovery processes the
same due markers once and never creates a second return event.

## Residual risk and invalidation

- A second authoritative worker for one world would require an explicit ownership or reservation
  policy; the attempt-id order is not a distributed fairness guarantee.
- Return movement, home crossing, shelter deposit, coin credit, combat cargo transfer, and the
  default all-phase scheduler composition remain separate implementation boundaries.
- This evidence is invalidated if the schema, event vocabulary, contract version, due-order policy,
  cargo weighting, worker ownership, or consumer expectation for per-unit contest history changes.

The exact conclusion is: **the bounded same-worker CP-10 contested-node outcome is runtime-verified
locally at process-runtime level 4, with the pre-empty target failure preserved; no broader gameplay,
hosted, browser, Agent, or Re-entry claim follows.**
