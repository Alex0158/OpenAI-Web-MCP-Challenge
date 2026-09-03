# SK-EVID-022: CP-10 Deposit and Coin Settlement Runtime Verification

**Status:** `pass` for the bounded local G2 Wood/Rock deposit, coin settlement, resident handoff, and mission-row reuse boundary  
**Date:** 2026-09-02  
**Task:** [`SK-TASK-033`](../Tasks/SK-TASK-033-cp10-deposit-and-coin-settlement.md)  
**Decision:** [`ADR-GAME-0024`](../Decisions/ADR-GAME-0024-cp10-deposit-and-coin-settlement.md)  
**Challenge:** [`Validation/33-cp10-deposit-and-coin-settlement-preimplementation-challenge.md`](../Validation/33-cp10-deposit-and-coin-settlement-preimplementation-challenge.md)  
**Audit:** [`Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md`](../Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md)  
**Contract:** `SK-MVP-0.2`  
**Evidence class:** process-runtime ladder level 4 (local process, file-backed SQLite, worker-owned clock, and injected phase seam)

## Claim boundary

This record proves that an active G2 GATHERER in `DEPOSITING` can settle the complete server-validated
active-attempt Wood/Rock cargo aggregate exactly once. Wood converts to one coin per unit and Rock to
three coins per unit. The transaction removes only validated cargo, credits the owning shelter,
appends `CargoDeposited` followed by a positive-only `CoinsCredited`, returns the same soldier to
`AT_SHELTER`, closes the attempt as terminal history, and leaves the resident mission row ready for a
later manual dispatch with an incremented mission revision and a fresh attempt.

The record also proves zero-cargo completion, duplicate replay, changed-request rejection, stale
revisions, cross-owner visibility, orphan and malformed provenance recovery, wallet overflow
protection, transaction rollback, delayed boundary handling, restart recovery, and the one-boundary
clock guard.

It does not prove combat, death or loot, automatic target selection or reissue, moving shelters,
weighted cargo, a new schema/event/contract version, the default all-phase scheduler composition,
browser/UI, WebMCP, Re-entry delivery, hosted continuity, production balance, or judge reproduction.
The phase handlers are composed in a local worker harness; this is not a hosted always-on claim.

## Runtime identity and fixture

- Source state: working tree on `main`, HEAD `4224f3ae53f6d4be87a7be17e74532f5785357b0`; no files were staged, committed, pushed, or deployed for this increment.
- Node.js: `v24.18.0` (explicit binary)
- npm: `11.17.0` (Node 24 CLI)
- TypeScript: `7.0.2`
- Next.js: `16.3.4`
- Contract: `SK-MVP-0.2`
- Schema: `4`, migration `cp10-001`
- Fixture: `sleepless-mvp-01`, world `cp10-deposit-world`
- Players: `player-a`/`shelter-a` and `player-b`/`shelter-b`
- Soldier: `soldier-a-01`, owned by `shelter-a`
- Resources: Wood `node-wood-a` and Rock `node-rock-a`
- Persistence: file-backed SQLite with WAL and foreign keys; each test uses an isolated temporary database
- External boundaries: no network, browser, external Agent, WebMCP, Re-entry Core, or hosted service

## Contract-first TDD record

### Red

Before the deposit service existed, the focused contract test failed during module resolution with
`ERR_MODULE_NOT_FOUND` for `src/server/mission-deposit-service`. This established that the
`DEPOSITING` settlement boundary was absent from the runtime before implementation.

### Green and refactor

The smallest implementation added one typed worker phase service, one atomic persistence transaction,
and the inactive mission-row reuse needed by the existing dispatch path. The service derives the
crossing identity from `mission_attempt_id` and the durable home-crossing world time. The store
re-reads all involved rows, verifies ownership, role/tool/phase linkage, cargo identity and source
provenance, computes the fixed Wood/Rock value, validates exact event payloads, and commits cargo,
shelter, soldier, mission, attempt, event, and idempotency changes in one SQLite transaction.

After the focused suite was Green, a behavior-preserving refactor hardened malformed visibility and
negative durable crossing classification and removed duplicate revision predicates. No schema,
event vocabulary, public command, contract version, scheduler policy, or unrelated application was
changed.

## Commands and observed results

All commands ran from `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`.

| Check | Command | Result |
|---|---|---|
| Focused settlement | `PATH=/Users/alex/.nvm/versions/node/v24.18.0/bin:$PATH npm run test:cp10-deposit` | **16/16 pass** |
| CP-09/CP-10 transitive aggregate | `/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/tsx/dist/cli.mjs --test tests/cp09-mission-dispatch.test.ts tests/cp09-route-milestone.test.ts tests/cp10-first-extraction.test.ts tests/cp10-extraction-cadence.test.ts tests/cp10-return-navigation.test.ts tests/cp10-deposit-settlement.test.ts` | **69/69 pass** |
| Affected CP-04 through CP-10 aggregate | `/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/tsx/dist/cli.mjs --test tests/cp04-process-skeleton.test.ts tests/cp05-persistence.test.ts tests/cp06-clock-recovery.test.ts tests/cp07-world-fixture.test.ts tests/cp08-movement-snapshot.test.ts tests/cp08-worker-movement.test.ts tests/cp08-worker-gateway.test.ts tests/cp08-realtime-snapshot.test.ts tests/cp08-realtime-wire.test.ts tests/cp09-mission-dispatch.test.ts tests/cp09-route-milestone.test.ts tests/cp10-first-extraction.test.ts tests/cp10-extraction-cadence.test.ts tests/cp10-return-navigation.test.ts tests/cp10-deposit-settlement.test.ts` | **142/142 pass** |
| Typecheck | `PATH=/Users/alex/.nvm/versions/node/v24.18.0/bin:$PATH npm run typecheck` | **pass** |
| Production build | `PATH=/Users/alex/.nvm/versions/node/v24.18.0/bin:$PATH npm run build` | **pass** |
| Dependency closure | `PATH=/Users/alex/.nvm/versions/node/v24.18.0/bin:$PATH npm ci --ignore-scripts --dry-run` | **pass; up to date** |

## Assertions

- **Player-visible state:** A valid `DEPOSITING` attempt becomes a resident `AT_SHELTER` soldier and
  `AT_SHELTER` mission; the wallet increases by the server-derived Wood/Rock value. A zero-cargo
  attempt completes without inventing a positive coin event.
- **Command and failure contract:** Settlement is worker-owned and has no public client command.
  Wrong shelter visibility, forged event data, stale revisions, changed duplicate requests, malformed
  provenance, orphan cargo, unsafe values, and skipped world boundaries fail with typed errors before
  a false success is reported.
- **Persistence, event, and outbox state:** Validated cargo rows are removed in the same transaction
  as shelter coins, soldier/mission/attempt lifecycle changes, ordered events, and the committed
  idempotency result. No new schema or outbox/Re-entry delivery path is introduced.
- **Exactly-once settlement after duplicate delivery and replay:** The stable work key is
  `mission-deposit:<mission_attempt_id>:<homeCrossingWorldTime>`. An identical retry returns the
  stored result with `duplicate: true` and creates no second deletion, credit, revision, or event;
  a changed request is rejected.
- **Ownership denial, stale revision, restart, and reconnect:** Shelter ownership and every involved
  entity revision are checked. Failure injection after cargo, state, or event work rolls back the
  complete transaction. Reopening the file-backed store settles the same durable `DEPOSITING` attempt
  once, and manual dispatch reuses the completed resident mission row with a new attempt. Browser
  reconnect is outside this task.

## Analysis and closure

- **Failure classification:** The initial failure was an absent product boundary; all final failures
  were resolved test-contract or implementation issues within the registered scope.
- **Limitations and residual risk:** The local phase seam does not prove the production default
  all-phase scheduler, multi-worker settlement fairness, or hosted continuity. Combat, loot, automatic
  reissue, UI, WebMCP, and Re-entry remain separately registered boundaries.
- **Invalidation triggers:** Any change to cargo provenance or weighting, Wood/Rock conversion values,
  shelter ownership, mission identity, resident-row lifecycle, event order/idempotency, world-clock
  phase order, schema/contract version, fixture seed, or scheduler ownership invalidates this record.
- **Exact conclusion:** **The bounded local CP-10 Wood/Rock deposit, coin settlement, resident handoff,
  and manual mission-row reuse are runtime-verified at process-runtime level 4; no broader gameplay,
  browser, Agent, WebMCP, Re-entry, hosted, or judge claim follows.**
