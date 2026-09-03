# SK-EVID-021: CP-10 Return Navigation Runtime Verification

**Status:** \`pass\` for the bounded local G2 return-navigation and home-crossing boundary  
**Date:** 2026-09-02  
**Task:** [\`SK-TASK-032\`](../Tasks/SK-TASK-032-cp10-return-navigation-and-home-crossing.md)  
**Decision:** [\`ADR-GAME-0023\`](../Decisions/ADR-GAME-0023-cp10-return-navigation-and-home-crossing.md)  
**Challenge:** [\`Validation/31-cp10-return-navigation-preimplementation-challenge.md\`](../Validation/31-cp10-return-navigation-preimplementation-challenge.md)  
**Contract:** \`SK-MVP-0.2\`  
**Evidence class:** process-runtime ladder level 4 (local process, file-backed SQLite, worker-owned clock, and injected phase seam)

## Claim boundary

This record proves that an active G2 GATHERER in \`RETURNING\` derives a deterministic reverse of its
immutable outbound route from the persisted \`home_anchor\` and return handoff time. At the due or
delayed movement boundary, the server commits one atomic \`RETURNING → DEPOSITING\` transition and one
\`MissionHomeReached\` event. The soldier identity and \`FIELD\` lifecycle remain unchanged, and the
exposed cargo and shelter coins are unchanged until a later deposit transaction.

It does not prove cargo deposit, Wood/Rock coin conversion, recall, moving shelters, route replanning,
combat, death or respawn, browser/UI, WebMCP, Re-entry delivery, the default all-phase scheduler,
multi-worker fairness, hosted continuity, production balance, or judge reproduction. Movement,
extraction, and return handlers are injected into the existing local clock harness; this is not a
hosted scheduler claim.

## Runtime identity and fixture

- Source state: working tree on \`main\`, HEAD \`e71977a95c61383906d78527e4d3e392f24581d5\`; no files were staged, committed, pushed, or deployed for this increment.
- Node.js: \`v24.18.0\` (explicit binary)
- npm: \`11.16.0\` (explicit Node 24 CLI)
- TypeScript: \`7.0.2\`
- Next.js: \`16.3.4\`
- Contract: \`SK-MVP-0.2\`
- Schema: \`4\`, migration \`cp10-001\`
- Fixture: \`sleepless-mvp-01\`, world \`cp10-return-world\`
- Players: \`player-a\`/\`shelter-a\` and \`player-b\`/\`shelter-b\`
- Soldier: \`soldier-a-01\`, owned by \`shelter-a\`
- Route: \`(16,64) → (30,64)\`, 14 tiles, estimated duration 5 world seconds at 3 tiles/second
- Persistence: file-backed SQLite with WAL and foreign keys
- External boundaries: no network, browser, external Agent, WebMCP, Re-entry, or hosted service

## Contract-first TDD record

### Red

Before the return service and typed home-arrival transaction existed, the focused suite failed at
module resolution because \`src/server/mission-return-service.ts\` was absent. This established that
the return boundary was not present in the current runtime and kept the first implementation
observable as a real missing behavior.

### Green and refactor

The smallest implementation added a server-only return service and a specialized persistence
transaction. The service reverses the immutable route in memory, derives the return due boundary from
\`last_transition_world_time + estimatedTravelWorldSeconds\`, and re-reads the active mission,
attempt, and soldier before committing. The store validates the worker binding, exact identity and
revisions, route/home relationship, paired null due markers, deterministic work/event ids, and exact
server-derived arrival payload before atomically changing both mission records to \`DEPOSITING\`.
\`MissionHomeReached\` is appended once and cargo, soldier state, and coins are left untouched.

The focused return suite passes **9/9**. The CP-09/CP-10 transitive return aggregate passes **53/53**,
and the affected CP-04 through CP-10 aggregate passes **126/126**.

## Commands and observed results

All commands ran from \`/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game\`.

| Check | Command | Result |
|---|---|---|
| Focused return | \`/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/tsx/dist/cli.mjs --test tests/cp10-return-navigation.test.ts\` | **9/9 pass** |
| CP-09/CP-10 transitive aggregate | \`/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/tsx/dist/cli.mjs --test tests/cp09-mission-dispatch.test.ts tests/cp09-route-milestone.test.ts tests/cp10-first-extraction.test.ts tests/cp10-extraction-cadence.test.ts tests/cp10-return-navigation.test.ts\` | **53/53 pass** |
| Affected CP-04 through CP-10 aggregate | \`/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/tsx/dist/cli.mjs --test tests/cp04-process-skeleton.test.ts tests/cp05-persistence.test.ts tests/cp06-clock-recovery.test.ts tests/cp07-world-fixture.test.ts tests/cp08-movement-snapshot.test.ts tests/cp08-worker-movement.test.ts tests/cp08-worker-gateway.test.ts tests/cp08-realtime-snapshot.test.ts tests/cp08-realtime-wire.test.ts tests/cp09-mission-dispatch.test.ts tests/cp09-route-milestone.test.ts tests/cp10-first-extraction.test.ts tests/cp10-extraction-cadence.test.ts tests/cp10-return-navigation.test.ts\` | **126/126 pass** |
| Typecheck | \`/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/typescript/bin/tsc --noEmit\` | **pass** |
| Production build | \`/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/next/dist/bin/next build\` | **pass** |
| Dependency closure | \`/Users/alex/.nvm/versions/node/v24.18.0/bin/node /Users/alex/.nvm/versions/node/v24.18.0/lib/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --dry-run\` | **pass; up to date** |
| Documentation self-test | \`python3 scripts/test_validate_game_docs.py\` | **pass; 21/21** |
| Documentation validator | \`python3 scripts/validate_game_docs.py --root . --report\` | **pass; 0 non-terminal tasks after task closure** |
| Scoped diff check | \`git diff --check -- WebApp/Web-Game\` | **pass for tracked paths; untracked documentation is covered by the documentation gate** |

## Assertions

- **Player-visible state:** Before the due boundary, the reverse projection reports the expected
  intermediate position (3 tiles from the node at world time 8) and leaves the mission in
  \`RETURNING\`. At the due boundary, both mission records enter \`DEPOSITING\`.
- **Command and failure contract:** A forged home anchor, stale revision, wrong shelter visibility,
  malformed route/home identity, or skipped boundary fails visibly with a typed persistence error.
  No client coordinate or teleport path is accepted.
- **Persistence, event, and outbox state:** Home crossing writes one deterministic
  \`MissionHomeReached\` event, advances the mission and attempt revisions, preserves the event cursor
  order, and does not create an outbox/Re-entry signal.
- **Exactly-once settlement after duplicate delivery and replay:** An identical persistence retry
  returns the stored result with \`duplicate: true\`; a repeated movement pass and post-restart pass
  create no second transition or event.
- **Ownership denial, stale revision, restart, and reconnect:** Worker binding and shelter visibility
  are checked; stale input leaves world time and \`RETURNING\` state unchanged; reopening the file-backed
  store re-derives the same route and crosses once at the durable due boundary. Browser reconnect is
  outside this task.

## Analysis and closure

- **Failure classification:** product behavior was absent before implementation; the final failures
  were test-contract adjustments only, and all scoped tests now pass.
- **Limitations and residual risk:** The return service is not installed in the default production
  all-phase worker composition yet. A moving shelter, recall from an arbitrary field coordinate,
  terrain invalidation, combat at home, or a second authoritative worker must reopen the decision.
- **Invalidation triggers:** Any change to route schema, home-anchor ownership, movement speed,
  world-clock phase order, due-work or event/idempotency contracts, schema/contract version, cargo
  settlement, or the fixture seed invalidates this record.
- **Exact conclusion:** **CP-10 automatic G2 return navigation and exact home crossing are
  runtime-verified locally at process-runtime level 4; no broader gameplay, hosted, browser, Agent,
  WebMCP, or Re-entry claim follows.**
