# SK-EVID-055: CP-14 Causal Event-to-Local-Stub Trace Runtime Verification

## Identity

- Evidence ID: `SK-EVID-055`
- Related task, decisions, and validation: [`SK-TASK-068`](../Tasks/SK-TASK-068-cp14-causal-event-to-local-stub-trace.md), [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md), [`SK-EVID-050`](SK-EVID-050-cp14-game-side-local-stub-delivery-port-runtime-verification.md), and [`Validation/81`](../Validation/81-cp14-causal-event-to-local-stub-trace-runtime-cross-functional-audit.md)
- Evidence class: `process-runtime`
- Ladder level: `3` for one local worker/store/combat/port composition; no process restart, browser, page, or external delivery claim follows
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source state: Git branch `main`, `HEAD 9dcfad1` (`feat(game): add canvas selection feedback`); Task 068 adds only one test and one package script before this evidence commit, with no `src/` production change
- Source and build root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`
- Runtime versions: Node.js `v24.20.0`, npm `11.19.0`, `tsx` `4.23.13`; the worker uses the existing local `WorldClock`, `GameplayPhaseCoordinator`, persistence store, and seeded combat path
- Fixture world and seed: fresh file-backed temporary SQLite world `cp14-causal-local-world`, accepted `sleepless-mvp-01` seed, G2 fixture generation `g2-fixture-1`, Player A binding `binding-a`, Player B binding `binding-b`
- Clock and delivery timing: explicit `worker.advance(24000)` reaches world time `24`; delivery uses independent caller-supplied wall time `1000` with a `30,000 ms` lease and lease id `cp14-causal-lease-1`

## Objective and claim boundary

- Behavior under test: A real local worker/combat terminal gatherer loss creates the existing granted coalesced signal and pending outbox row, then the existing `ReentryDeliveryPort` maps and acknowledges that row through a labelled local transport.
- Claim this evidence may support: one local causal composition from `CargoLostToMonster` through durable signal/outbox state, bounded envelope, accepted transport outcome, acknowledgement, duplicate-safe follow-up, and shelter scope isolation.
- Claims this evidence cannot support: live Cloud Receiver or Local Connector delivery, Codex Thread wake/backpressure, Agent grant activation, canonical-page WebMCP reread, dynamic recall, Re-entry, hosted continuity, independent browser contexts, or judge reproduction.

## Replay procedure and observed result

| Step | Replayable procedure | Observed result |
|---|---|---|
| 1. Fresh fixture | Create the accepted two-player fixture in a fresh file-backed SQLite database; start `WorldWorkerModule` with the existing `grantFor` provider and no autonomous scheduler | **Passed**; worker reached `ready`, Player A and B scopes were seeded, and the database was isolated to the task run |
| 2. Real causal event | Dispatch `soldier-a-01` as the existing `GATHERER` with `PICKAXE` to `node-rock-a`, then call `worker.advance(24000)` | **Passed**; exactly one `CargoLostToMonster` was present at world time `24`; mission was `WAITING_REVIEW`, attempt `TERMINAL`, soldier was `AT_SHELTER`, and exposed cargo was empty |
| 3. Durable handoff | Read the server-owned signal slot and outbox before transport | **Passed**; one `pending` slot/outbox pair for `shelter-a`/`binding-a`, grant `cp14-causal-grant-v1`, bounded action `force_recall_soldier`, one eligible event, and the loss event's cursor/latest-event metadata |
| 4. Port delivery | Call `pumpOnce({ worldId: "cp14-causal-local-world", nowWallTimeMs: 1000, leaseId: "cp14-causal-lease-1" })` against an injected labelled transport returning `{ kind: "accepted" }` | **Passed**; one envelope was delivered and the returned signal id matched the durable slot id |
| 5. Envelope contract | Compare the captured envelope with the slot and loss event, including version, world/shelter, opaque binding, grant/action, cursor range, eligible count/types/severity, and latest event/time; inspect for prompt or credential fields | **Passed**; all fields matched and no prompt or credential field was present |
| 6. Settlement and no gameplay mutation | Read world, shelter, soldier, mission, attempt, cargo, event history, slot, and outbox after acknowledgement | **Passed**; world time remained `24`, only the documented `ContinuationDelivered` event advanced the world cursor, gameplay records remained equal, and delivery became `acknowledged` |
| 7. Duplicate and scope | Pump again with a new lease id and inspect Player B's slot | **Passed**; second pump was `idle`, no second envelope or `ContinuationDelivered` event appeared, and `shelter-b`/`binding-b` had no signal |

The test asserts the exact runtime identities and cursor relationships from the live task fixture rather
than constructing a synthetic `CargoLostToMonster` transition. The temporary database is deleted by the
test's own cleanup after the readback and is not promoted to repository or hosted state.

## Verification commands

| Command | Result |
|---|---|
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp14-causal` | **1/1 passed** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH ./node_modules/.bin/tsx --test tests/cp14-reentry-delivery-port.test.ts` | **5/5 passed** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH ./node_modules/.bin/tsx --test tests/cp14-signal-policy.test.ts` | **11/11 passed** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test:cp16-local` | **3/3 passed** |
| `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck` | **Passed** |
| `python3 scripts/test_validate_game_docs.py` | **22/22 passed** |
| `python3 scripts/validate_game_docs.py --root . --report` | **Passed**; `Non-terminal tasks: 0 of 68` after closure records |
| `git diff --check -- WebApp/Web-Game` | **Passed** |

The production build and browser/WebMCP readback were intentionally not rerun: this increment changes
only a Node test, its package script, and documentation; the existing source build and browser evidence
remain valid at their recorded commits. No external Receiver, Connector, Agent, page, or hosted command
was invoked.

## Assertions and limitations

- The worker/combat path remains the only authority for the loss, mission review, respawn, cargo, and
  world-time state. The port is invoked only after those records exist and cannot execute a game command.
- The wall-time lease is explicit and separate from gameplay `world_time`; acknowledgement appends one
  durable delivery event but does not repeat a combat or settlement effect.
- The envelope preserves the opaque binding and signal identity from durable state. The test does not
  accept client-selected scope, prompt, credential, or private Agent context.
- A labelled transport stub proves at-least-once game-side composition only. Receiver/Connector protocol,
  active-Thread turn boundaries, Agent wake, page return, fresh reread, recall, and hosted operation remain
  open gates owned by later integration work and Eddy's handoff.

**Exact conclusion:** The real local `CargoLostToMonster` path composes correctly with the existing
game-side `ReentryDeliveryPort`: one scoped signal and bounded envelope are acknowledged once, while
gameplay state and world time remain unchanged. This is ladder-level 3 local-stub evidence only.
