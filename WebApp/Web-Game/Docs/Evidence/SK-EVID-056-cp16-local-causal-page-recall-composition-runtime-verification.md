# SK-EVID-056: CP-16 Local Causal Page-Recall Composition Runtime Verification

## Identity

- Evidence ID: `SK-EVID-056`
- Related task, decisions, and validation: [`SK-TASK-069`](../Tasks/SK-TASK-069-cp16-local-causal-page-recall-composition.md), [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md), [`SK-EVID-055`](SK-EVID-055-cp14-causal-event-to-local-stub-trace-runtime-verification.md), and [`Validation/82`](../Validation/82-cp16-local-causal-page-recall-composition-runtime-cross-functional-audit.md)
- Evidence class: `slice-chain`
- Ladder level: `4` for one local entrypoint, worker, durable fixture, labelled delivery port, and canonical page HTTP boundary; no browser, WebMCP adapter, external delivery, or two-context claim
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source and test root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Source state: Git branch `main`, base `HEAD 7650db0` (`test(game): trace causal reentry delivery`) with the task-owned test, script, and records added in this closure
- Contract version: `SK-MVP-0.2`
- Persistence schema and migration: schema `8`, migration `cp06-004`
- Runtime versions: Node.js `v24.20.0`, npm `11.19.0`, `tsx 4.23.13`, Next.js `16.3.4`, React `19.2.8`, TypeScript `7.0.2`
- Fixture: fresh file-backed SQLite `sleepless-mvp-01` G2 fixture, 128 x 128 map, Player A `fixture-binding-a`/`shelter-a`, Player B `fixture-binding-b`/`shelter-b`, seeded Rock target and monster
- Timing: worker advances `15,000 ms` then `9,000 ms` to world time `24`; test-only encounter geometry selects the documented safe reissue branch at `(50,64)`; delivery uses independent wall time `1,000 ms` and lease `cp16-page-recall-lease-1`

## Objective and claim boundary

- Behavior under test: A real worker loss and successful automatic reissue create one eligible signal; the existing game-side port acknowledges it through a labelled accepted transport; the canonical page HTTP tools reread current shelter, mission, and history state; and a revision- and provenance-checked `force_recall_soldier` transitions the active reissued mission to `RETURNING`.
- Claim this evidence may support: one local causal composition across the real worker/combat/reissue path, durable signal/outbox, game-side local port, canonical page HTTP reads, bounded recall, duplicate replay, and Player B scope isolation.
- Claims this evidence cannot support: live Cloud Receiver or Local Connector delivery, Codex Thread wake/backpressure, Agent grant activation, genuine page-bound WebMCP discovery/invocation, browser or realtime stream behavior, independent browser contexts, hosted continuity, or judge reproduction.

## Replay procedure and observed result

| Step | Replayable procedure | Observed result |
|---|---|---|
| 1. Fresh process and identity | Start an entrypoint-owned worker with `LOCAL_FIXTURE_MODE=1`, a fresh temporary database, and the canonical fixture bootstrap | **Passed**; process became ready and bootstrap issued only the server-derived alpha cookie/scope; beta was addressed only through the second fixed fixture handle |
| 2. Real loss and reissue | Dispatch `soldier-a-01` as the existing GATHERER/PICKAXE mission to `node-rock-a`; advance to world time `15`; set only the test fixture engagement cell to `(50,64)`; advance to `24` | **Passed**; one `CargoLostToMonster` and one `MissionReissued` with outcome `REISSUED` were recorded; the same soldier had an active `TRAVELLING` reissued attempt and remained in the field |
| 3. Durable signal | Read the signal slot and delivery row before transport | **Passed**; one scoped pending signal/outbox pair for `shelter-a`/`fixture-binding-a`, bounded action `force_recall_soldier`, latest event the loss, and no Player B slot |
| 4. Local delivery | Pump `ReentryDeliveryPort` once with wall time `1000`, lease `cp16-page-recall-lease-1`, and a labelled transport returning `{ kind: "accepted" }` | **Passed**; exactly one envelope was captured and the durable signal became acknowledged |
| 5. Delivery does not mutate gameplay | Compare world time, shelter, soldier, active mission/attempt, cargo, and event counts before/after acknowledgement | **Passed**; world time stayed `24`, only one `ContinuationDelivered` was appended, and no second cargo loss or combat effect appeared |
| 6. Fresh canonical page read | POST `inspect_shelter_state`, `inspect_missions`, and `inspect_mission_history` through `/api/local-fixture/page-tools/execute` with the server-issued alpha cookie | **Passed**; scope was `player-a`/`shelter-a`, continuation was `acknowledged` with the durable signal and loss ids, mission revisions described the active reissue, and history contained the loss and reissue events |
| 7. Bounded action and replay | Submit `force_recall_soldier` using page-read ids/revisions plus durable `signal_id` and `causal_event_id`; submit the identical body again | **Passed**; first result was committed `mission_recalled`/`RETURNING`; the duplicate replay was committed with `duplicate = true`; exactly one `MissionRecalled` event exists |
| 8. Privacy and cleanup | Read shelter and history through the beta cookie; shut down the entrypoint and remove the temporary database | **Passed**; beta scope was `player-b`/`shelter-b`, continuation was null, the private loss event was absent, and shutdown was clean |

The test uses the existing CP-11 test-only geometry setup to select a reachable reissue branch. It
does not edit production state through a hidden runtime control, invent a Domain Event, or substitute
client-selected identities.

## Verification commands

| Command | Result |
|---|---|
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp16-page-recall` | **1/1 passed** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp13-page-tools` | **9/9 passed** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp13-recall` | **9/9 passed** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp14-causal` | **1/1 passed** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH ./node_modules/.bin/tsx --test tests/cp14-reentry-delivery-port.test.ts` | **5/5 passed** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH ./node_modules/.bin/tsx --test tests/cp14-signal-policy.test.ts` | **11/11 passed** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp16-local` | **3/3 passed** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck` | **Passed** |

Documentation self-tests, the game documentation validator, and `git diff --check -- WebApp/Web-Game`
are run in the closure pass after the evidence and validation records are added.

## Cross-boundary assertions and limitations

- The worker, persistence transaction, combat, reissue, mission, cargo, and world clock remain authoritative. The page and port do not advance gameplay time or settle cargo.
- The local transport receives only the durable envelope fields. It carries no prompt, credential, raw Agent context, or client-selected binding.
- The page reread happens after delivery acknowledgement and before the action. Recall uses the current mission/attempt/soldier revisions and the signal/casual-event provenance that the server issued.
- Duplicate recall replays the durable command result and cannot append a second recall, cargo loss, delivery acknowledgement, or combat event.
- The beta read proves the local HTTP visibility predicate for this fixture; it is not independent browser or realtime evidence.
- The labelled transport is a test instrument. No Receiver, Connector, Codex Thread, Agent, WebMCP adapter, hosted process, or judge was invoked.

## Analysis and closure

- Failure classification: `none` for the named local composition. The first test run exposed only an assertion expectation that omitted the page envelope's required `world_id`; the test was corrected to the contract and the complete focused pass was rerun.
- Residual risk: external signal delivery, active-Thread backpressure, genuine WebMCP dynamic recall, browser isolation, restart/reconnect in the same chain, hosted liveness, and judge reproduction remain open gates.
- Invalidation triggers: changes to the worker reissue policy, signal/outbox schema, delivery envelope or lease semantics, page-tool read/recall contract, fixture seed, runtime, or Eddy's external handoff.
- Exact conclusion: The real successful worker loss/reissue path composes with the local delivery port, canonical page HTTP reread, and provenance-bound recall exactly once in a fresh local fixture. This is ladder-level 4 local/page evidence only; it does not close CP-14 external delivery, WebMCP Agent action, independent browser, hosted, or judge gates.

