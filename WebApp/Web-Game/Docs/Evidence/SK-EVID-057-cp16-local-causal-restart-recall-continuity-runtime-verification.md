# SK-EVID-057: CP-16 Local Causal Restart and Recall Continuity Runtime Verification

## Identity

- Evidence ID: `SK-EVID-057`
- Related task, decisions, and validation: [`SK-TASK-070`](../Tasks/SK-TASK-070-cp16-local-causal-restart-recall-continuity.md), [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md), [`SK-EVID-056`](SK-EVID-056-cp16-local-causal-page-recall-composition-runtime-verification.md), and [`Validation/83`](../Validation/83-cp16-local-causal-restart-recall-continuity-runtime-cross-functional-audit.md)
- Evidence class: `slice-chain`
- Ladder level: `4` for two sequential local entrypoint/worker instances over one file-backed fixture, a labelled local delivery port, and canonical page HTTP reads; no browser, WebMCP adapter, external delivery, or hosted claim
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source and test root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Source state: Git branch `main`, base `HEAD 5ae51e6` (`test(game): compose local page recall slice`) with the task-owned restart test, script, evidence, and audit added in this closure
- Contract version: `SK-MVP-0.2`
- Persistence schema and migration: schema `8`, migration `cp06-004`
- Runtime versions: Node.js `v24.20.0`, npm `11.19.0`, `tsx 4.23.13`, Next.js `16.3.4`, React `19.2.8`, TypeScript `7.0.2`
- Fixture: fresh file-backed SQLite `sleepless-mvp-01`, 128 x 128 map, Player A `fixture-binding-a`/`shelter-a`, Player B `fixture-binding-b`/`shelter-b`, seeded Rock target and monster
- Timing: process A advances `15,000 ms` then `9,000 ms` to world time `24`; process B starts against the same database; delivery uses independent wall time `2,000 ms` and lease `cp16-restart-recall-lease-1`

## Objective and claim boundary

- Behavior under test: A real worker loss and successful automatic reissue create one pending signal/outbox pair; a clean entrypoint/worker restart preserves the same world, event, mission, attempt, and signal identities; the existing game-side port acknowledges the recovered signal; canonical page HTTP reads provide the current continuation and revisions; and a signal-provenance-bound recall transitions the active reissued mission to `RETURNING` once.
- Claim this evidence may support: one local restart-aware causal composition across the real worker/combat/reissue path, file-backed recovery, local delivery acknowledgement, canonical page HTTP reread, bounded recall, duplicate replay, and Player B scope isolation.
- Claims this evidence cannot support: autonomous world catch-up during downtime, live Cloud Receiver or Local Connector delivery, Codex Thread wake/backpressure, Agent grant activation, genuine page-bound WebMCP dynamic invocation, browser or realtime stream behavior, independent browser contexts, hosted continuity, or judge reproduction.

## Replay procedure and observed result

| Step | Replayable procedure | Observed result |
|---|---|---|
| 1. Fresh process and identity | Start an entrypoint-owned worker with `LOCAL_FIXTURE_MODE=1`, a fresh temporary database, and the canonical fixture bootstrap | **Passed**; process A became ready and bootstrap issued only the server-derived alpha cookie/scope; no client identity was accepted |
| 2. Real loss and reissue | Dispatch `soldier-a-01` as the existing GATHERER/PICKAXE mission to `node-rock-a`; advance to world time `15`; set only the test fixture engagement cell to `(50,64)`; advance to `24` | **Passed**; one `CargoLostToMonster` and one `MissionReissued` with outcome `REISSUED` were recorded; the same soldier had one active `TRAVELLING` reissued attempt |
| 3. Durable pre-restart state | Read the world, ordered events, mission, signal slot, and outbox before stopping process A | **Passed**; world time was `24`; one loss, one successful reissue, and one pending scoped signal/outbox pair existed; the signal id and active attempt id were captured from durable state |
| 4. Clean restart and recovery | Shut down process A through the entrypoint lifecycle, start process B against the identical database, and bootstrap with the existing alpha cookie | **Passed**; world time, `world_event_cursor`, event count/order, loss/reissue counts, signal id/status, mission record, and active attempt id were unchanged; no second world or synthetic replay was created |
| 5. Recovered local delivery | Pump `ReentryDeliveryPort` once with wall time `2,000`, lease `cp16-restart-recall-lease-1`, and a labelled transport returning `{ kind: "accepted" }` | **Passed**; exactly one envelope carried the persisted signal and loss event; one `ContinuationDelivered` acknowledgement was appended; gameplay world time remained `24` |
| 6. Fresh canonical page read | POST `inspect_shelter_state`, `inspect_missions`, and `inspect_mission_history` through `/api/local-fixture/page-tools/execute` with the server-resolved alpha cookie | **Passed**; alpha scope, acknowledged continuation, signal/loss metadata, current reissued mission revisions, and both loss/reissue history rows were returned; the page cursor range included the causal loss event |
| 7. Bounded action and replay | Submit `force_recall_soldier` with the fresh mission/attempt/soldier revisions plus persisted `signal_id` and `causal_event_id`; submit the identical body again | **Passed**; first result committed `RETURNING`; duplicate replay returned the stored committed result with `duplicate = true`; exactly one `MissionRecalled` event exists |
| 8. Privacy and cleanup | Read shelter and history through the beta cookie, then shut down process B and remove the temporary database | **Passed**; beta scope was `player-b`/`shelter-b`, continuation was null, alpha `CargoLostToMonster` history was absent, and shutdown was clean |

The encounter-cell update is the existing CP-11 test-only geometry setup that selects a reachable
reissue branch. It does not edit production state through a runtime endpoint, invent a Domain Event,
or substitute client-selected identity.

## Verification commands

| Command | Result |
|---|---|
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp16-restart-recall` | **1/1 passed** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp06-autonomous-runtime` | **3/3 passed** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp13-page-tools` | **9/9 passed** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp13-recall` | **9/9 passed** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp14-causal` | **1/1 passed** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH ./node_modules/.bin/tsx --test tests/cp14-reentry-delivery-port.test.ts` | **5/5 passed** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH ./node_modules/.bin/tsx --test tests/cp14-signal-policy.test.ts` | **11/11 passed** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp16-local` | **3/3 passed** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck` | **Passed** |
| `python3 scripts/test_validate_game_docs.py` | **22/22 passed** |
| `python3 scripts/validate_game_docs.py --root . --report` | **Pass after closure records; zero non-terminal tasks** |
| `git diff --check -- WebApp/Web-Game` | **Passed** |

## Cross-boundary assertions and limitations

- The worker, persistence transaction, combat, reissue, mission, cargo, and world clock remain authoritative. Restart recovery reuses the persisted state; the page and port do not advance gameplay time or settle cargo.
- The process boundary is real within one local test: process B opens the same file-backed database after process A's clean shutdown. The test does not claim a supervisor, crash recovery, or automatic downtime progression.
- The transport wall-time lease is separate from `world_time`; acknowledgement adds only the documented delivery event and does not recreate the loss or reissue.
- The page reread happens after delivery acknowledgement and before the action. Recall uses current server-issued revisions plus persisted signal and causal-event provenance; duplicate replay returns the durable command result.
- The fixed alpha cookie resolves to the same server-owned scope after restart. The beta read proves the local HTTP visibility predicate for this fixture, not independent browser isolation or realtime delivery.
- The labelled transport is a test instrument. No Receiver, Connector, Codex Thread, Agent, WebMCP adapter, hosted process, or judge was invoked.

## Analysis and closure

- Failure classification: `none` after correction. The first run exposed only an overly strict test assertion that expected the page continuation cursor range to equal the loss cursor; the contract allows intermediate eligible/history cursors, so the final assertion checks that the loss cursor is within the server-returned range and the complete focused pass was rerun.
- Residual risk: external signal delivery, active-Thread backpressure, genuine WebMCP dynamic recall, browser isolation, crash/supervisor recovery, autonomous downtime catch-up, hosted liveness, and judge reproduction remain open gates.
- Invalidation triggers: changes to worker recovery, event replay, signal/outbox schema, delivery lease or envelope, page session policy, recall contract, fixture seed, runtime, or Eddy's external handoff.
- Exact conclusion: The same durable real loss/reissue state survives a clean local entrypoint restart, is acknowledged once through the local port, is reread through the canonical page boundary, and supports one provenance-bound recall with duplicate safety and scope isolation. This is ladder-level 4 local evidence only; it does not close CP-14 external delivery, WebMCP Agent action, independent browser, hosted, or judge gates.
