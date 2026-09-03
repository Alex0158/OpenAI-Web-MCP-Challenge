# SK-EVID-058: CP-16 Real Event Burst and Page Context Runtime Verification

## Identity

- Evidence ID: `SK-EVID-058`
- Related task, decisions, and validation: [`SK-TASK-071`](../Tasks/SK-TASK-071-cp16-real-event-burst-page-context.md), [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md), [`SK-EVID-057`](SK-EVID-057-cp16-local-causal-restart-recall-continuity-runtime-verification.md), and [`Validation/84`](../Validation/84-cp16-real-event-burst-page-context-runtime-cross-functional-audit.md)
- Evidence class: `slice-chain`
- Ladder level: `4` for one local entrypoint/worker, two real sequential combat outcomes, one labelled local delivery port, canonical page HTTP reads with bounded cursor pagination, and one bounded recall; no browser, WebMCP adapter, external delivery, or hosted claim
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source and test root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Source state: Git branch `main`, base `HEAD 5e2e6c4` (`test(game): verify restart recall continuity`) with the task-owned burst test, script, evidence, and audit added in this closure
- Contract version: `SK-MVP-0.2`
- Persistence schema and migration: schema `8`, migration `cp06-004`
- Runtime versions: Node.js `v24.20.0`, npm `11.19.0`, `tsx 4.23.13`, Next.js `16.3.4`, React `19.2.8`, TypeScript `7.0.2`
- Fixture: fresh file-backed SQLite `sleepless-mvp-01`, 128 x 128 map, Player A `fixture-binding-a`/`shelter-a`, Player B `fixture-binding-b`/`shelter-b`, seeded Rock target and monster
- Timing: first loss/reissue reaches world time `24`; second gatherer reaches the same real monster path and completes its loss/reissue at world time `46`; delivery uses independent wall time `2,000 ms` and lease `cp16-burst-page-context-lease-1`

## Objective and claim boundary

- Behavior under test: Two real worker-generated actionable loss events arriving before delivery remain in one coalesced signal/outbox slot; both Domain Events and reissues remain in page history; the latest active reissued mission can be recalled using fresh server revisions and latest-event provenance.
- Claim this evidence may support: one local high-frequency causal composition across real worker/combat/reissue outcomes, signal coalescing, cursor-window projection, once-only labelled delivery, bounded page recall, duplicate replay, and Player B scope isolation.
- Claims this evidence cannot support: one wake per event, Connector behavior while a Codex Thread is running, live Cloud Receiver or Local Connector delivery, Agent wake, genuine page-bound WebMCP dynamic invocation, browser or realtime stream behavior, independent browser contexts, hosted continuity, or judge reproduction.

## Replay procedure and observed result

| Step | Replayable procedure | Observed result |
|---|---|---|
| 1. Fresh process and identity | Start an entrypoint-owned worker with `LOCAL_FIXTURE_MODE=1`, a fresh file-backed database, and the canonical alpha bootstrap | **Passed**; the server-derived alpha scope was used and no client-selected identity crossed the boundary |
| 2. First real outcome | Dispatch `soldier-a-01` as GATHERER/PICKAXE to `node-rock-a`; advance to world time `15`; set only its test encounter cell to `(50,64)`; advance to `24` | **Passed**; one real `CargoLostToMonster`, one `MissionReissued` outcome `REISSUED`, one active reissued attempt, and one pending signal/outbox were recorded |
| 3. Second real outcome before acknowledgement | Dispatch `soldier-a-02` to the same Rock target; advance to its real contact; set only that test encounter cell to `(50,64)`; advance to its terminal boundary at world time `46` | **Passed**; a second real loss and successful reissue were recorded while the first signal remained pending; routine battle/reissue events occupied the surrounding cursor window |
| 4. Coalesced durable summary | Read the event log, signal slot, and outbox after both outcomes | **Passed**; exactly two loss and two successful reissue events existed; one signal id and one pending outbox row remained; `eligible_event_count = 2`, `event_types = ["CargoLostToMonster"]`, the cursor range enclosed both loss cursors, and latest metadata pointed to the second loss |
| 5. One local delivery | Pump `ReentryDeliveryPort` once with the named wall-time lease and a labelled transport returning `{ kind: "accepted" }` | **Passed**; one envelope carried the same signal id, count `2`, cursor window, and second loss id; exactly one `ContinuationDelivered` event was appended and world time remained `46` |
| 6. Fresh page context | Read `inspect_shelter_state`, paginate `inspect_mission_history` with the server-returned `next_cursor`, and read `inspect_missions` through canonical page HTTP | **Passed**; alpha continuation was acknowledged with count `2` and latest loss metadata; bounded pagination returned both loss and both reissue records; the latest B reissued mission was `TRAVELLING` with current revisions |
| 7. Bounded action and replay | Submit `force_recall_soldier` for the latest reissued mission with current revisions, the durable signal id, and the second loss id; replay the identical body | **Passed**; first result committed `RETURNING`; duplicate replay returned the stored result with `duplicate = true`; exactly one `MissionRecalled` exists |
| 8. Privacy and cleanup | Read shelter and paginated history through the beta cookie, then shut down the entrypoint and remove the temporary database | **Passed**; beta continuation was null, alpha loss history was absent, and shutdown was clean |

The encounter-cell updates are the established CP-11 test-only geometry setup used to select the
reachable safe-reissue branch. They do not edit production state through a runtime endpoint, invent a
Domain Event, or substitute client-selected identity.

## Verification commands

| Command | Result |
|---|---|
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp16-burst-page-context` | **1/1 passed** |
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

- Domain Events remain the authoritative causal history. The Agent Signal is a derived summary: its
  cursor range is a page-read window and may contain routine events, while its eligible count/types
  identify only the two loss events.
- Coalescing preserves one signal identity before acknowledgement and one outbox row. The labelled
  transport receives one envelope; acknowledgement adds only `ContinuationDelivered` and does not
  repeat either combat settlement or reissue.
- The page reread occurs after acknowledgement and uses the server-owned alpha scope. History is read
  with the server's bounded cursor pagination rather than assuming every event fits one response.
- Recall uses the latest active mission/attempt revisions and the second loss's durable provenance.
  Duplicate replay cannot append a second recall, delivery, loss, or reissue event.
- The test proves a real local burst and local page context only. It does not prove Connector message
  suppression, safe-turn delivery, external acknowledgement, WebMCP dynamic registration, browser
  isolation, hosted liveness, or judge reproduction.

## Analysis and closure

- Failure classification: one contract-corrected Red assertion. The first attempt treated the signal
  cursor range as eligible-only and expected it to equal the first loss cursor; the accepted contract
  defines the range as the page-read window, so the final test checks that both loss cursors are inside
  the range. A second first attempt also exposed the page history maximum of 50; the final test follows
  the returned `next_cursor` and the complete focused pass is green.
- Residual risk: external high-frequency delivery/backpressure, genuine WebMCP dynamic recall,
  browser isolation, crash/supervisor recovery, autonomous downtime catch-up, hosted liveness, and
  judge reproduction remain open gates.
- Invalidation triggers: changes to signal aggregation/cooldown, cursor projection, combat/reissue
  policy, page history pagination, recall provenance, fixture geometry, runtime, or Eddy's handoff.
- Exact conclusion: Two real worker loss/reissue outcomes coalesce into one durable signal, retain both
  causal records for fresh page reads, and permit one latest-event-provenance-bound recall with no
  duplicate effects or scope crossover. This is ladder-level 4 local evidence only; external Re-entry,
  WebMCP Agent action, independent browser, hosted, and judge gates remain open.
