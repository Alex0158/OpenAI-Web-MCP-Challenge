# SK-EVID-042: CP-12 Snapshot-Gated Held Movement

## Identity

- Evidence ID: `SK-EVID-042`
- Related task and decision: [`SK-TASK-054`](../Tasks/SK-TASK-054-cp12-held-movement-and-touch-input.md); [`ADR-GAME-0035`](../Decisions/ADR-GAME-0035-cp12-snapshot-gated-held-movement.md)
- Evidence class: `process-runtime`
- Ladder level: `4` — real local Node 24 entrypoint, file-backed fixture, authenticated in-app browser,
  server snapshots, and client input; no hosted or external adapter
- Executor and date: Codex, 2026-09-03, Europe/London

## Exact identity under test

- Source state: working tree on `main`, `HEAD 7f3ed02`; Task054 client source, tests, and records are
  uncommitted and remain mixed with pre-existing workspace changes. No commit, push, deploy, or hosted
  environment was used.
- Source and test root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`; no server, shared command, persistence, worker cadence, realtime frame,
  WebMCP, or Re-entry contract revision
- Runtime versions: Node.js `v24.13.1`, npm `11.8.0`, TypeScript `7.0.2`, `tsx` `4.23.13`, Next.js
  `16.3.4`, React `19.2.8`, and `ws` `8.21.3`
- Browser and session: Codex In-app Browser, browser session `01a05e51-a22e-7922-bd7a-d6edcc82557b`,
  fresh task-local tab against `http://127.0.0.1:3188/`
- Fixture and configuration: fresh file-backed `sleepless-mvp-01` fixture, authenticated server-resolved
  `player-a`/`shelter-a` scope, `NODE_ENV=test`, `LOCAL_FIXTURE_MODE=1`, `HOST=127.0.0.1`, `PORT=3188`,
  and fresh temporary `/tmp/sleepless-kingdom-cp12-held-20260903c.sqlite`

## Objective and claim boundary

- Behavior under test: The map and direction pad express a held direction through one existing discrete
  `move_player` request at a time. The client waits for the matching authoritative full snapshot before
  scheduling the next request, and stops on release, page lifecycle loss, stale/closed state, blocked
  state, scope change, or teardown.
- Claim this evidence may support: The local client controller and real page wiring preserve single-flight
  server authority, pointer-button click suppression, focused keyboard movement, authoritative revision
  reconciliation, and clean lifecycle composition.
- Claims this evidence cannot support: browser wall-clock hold feel at production latency, default or
  hosted continuity, public-load capacity, independent browser identities, production authentication,
  positive WebMCP discovery/invocation, Re-entry delivery, or judge reproduction.

## TDD and focused verification

| Replayable command or procedure | Actual result | Status |
|---|---|---|
| Pre-change `npm run test:cp12-keyboard` under Node 24 | Three new hold cases failed because `createHeldMovementController` was not exported | **pass (expected Red)** |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run test:cp12-keyboard` | 13 tests passed, including settle-gated repeat, release, direction replacement, default suppression, blocked/unavailable stop, unknown recovery, source wiring, reconciliation, envelope, and admission cases | **pass** |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run test:cp12-dispatch` | 31 dispatch/client/UI/server-hardening/rejection-refresh cases passed; movement and dispatch shared page-gate behavior remained green | **pass** |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run test:cp12-projection` | 5 projection, privacy, geometry, and semantic-state cases passed | **pass** |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run test:cp12-visual` | 4 visual registry, SVG, accessibility, and fallback cases passed | **pass** |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run test:cp12-reconnect` | 3 reconnect, stale-scope, and focus cases passed | **pass** |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run test:cp12-publication` | 24 automatic-publication and wire cases passed; no publisher or snapshot contract changed | **pass** |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run typecheck` | All source and tests compiled under the pinned Node 24 toolchain | **pass** |
| `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run build` | Next.js `16.3.4` optimized build completed successfully | **pass** |
| `python3 scripts/test_validate_game_docs.py` and `python3 scripts/validate_game_docs.py --root . --report` | Documentation self-tests and the project validator passed after the Task/Validation/Evidence/index synchronization | **pass** |

## Browser execution

| Procedure | Observed result |
|---|---|
| Start the canonical entrypoint with `NODE_ENV=test LOCAL_FIXTURE_MODE=1 HOST=127.0.0.1 PORT=3188` and a fresh temporary SQLite file | Page loaded with `Connection: READY`, `Realtime capability: supported`, world time `0`, Player A at `(16,64)` revision `0`, five soldiers, and Wood/Rock `1/1` |
| Activate the labelled `Move player right` direction button once | Position changed to `(17,64)` revision `1`; the pointer path produced one authoritative command and the generated click did not duplicate it |
| Focus the `World map` group and press `ArrowDown` once | Position changed to `(17,65)` revision `2`; the status reported authoritative reconciliation and no unsequenced position was rendered |
| Exercise the focused keyboard and labelled button paths again with Enter, Space, and Left | Each accepted action produced one additional authoritative revision; no native-click duplicate was observed |
| Inspect the live semantic surface | Help text described press/hold behavior; map remained focusable with W-A-S-D/arrow shortcuts; direction buttons remained labelled and the movement group exposed `aria-busy` |
| Inspect the direction button style | Computed `touch-action` was `none`, preserving the pointer/touch hold boundary |
| Inspect browser developer logs after both gestures | No warning or error entries were reported |
| Close the browser tab, send `SIGINT`, and observe the entrypoint | `runtime_draining_SIGINT` followed by `runtime_stopped`; no shutdown timeout and port `3188` was released |

The browser control surface can issue a trusted press or click but does not expose a separate physical
key-down/key-up or pointer-duration operation. Therefore the real browser run verifies the integrated
pointer and keyboard paths, generated-click de-duplication, and one authoritative revision per gesture;
the injected-scheduler controller tests are the direct proof of multiple held steps and release,
blocked, unavailable, and unknown-recovery lifecycle behavior.

## Assertions

- **Authority:** `createHeldMovementController` calls the existing `submitMoveRef` only after the parent
  gate reports a ready snapshot and no movement is pending. It has no position, world-time, prediction,
  or queue state.
- **Reconciliation:** `syncMutationPending` updates the controller from the same movement/page gates
  used by the HTTP command. A completed movement settles the controller only after the existing
  `movementGate.acceptSnapshot()` path accepts the authoritative revision.
- **Input and accessibility:** Map keydown remains focus/modifier/composition/visibility gated. Button
  pointer capture and keyboard Enter/Space share one labelled control; pointer/keyboard-generated click
  activation is suppressed, while an independent assistive/programmatic click still calls one discrete
  `onMove`.
- **Lifecycle:** Release, blur, hidden visibility, stale/closed connection, dispatch overlap, definitive
  rejection, scope change, and unmount all stop the controller or prevent new admission. A held movement
  is allowed to remain active during its own expected `movementPending` interval so the next step can be
  scheduled after reconciliation; an unknown result sets `recoveryRequired` and blocks a new hold until
  a fresh authoritative snapshot.
- **Input safety:** Recognized map keys suppress browser defaults even when admission is blocked. Primary
  pointer capture is released on every lifecycle exit, secondary pointers are ignored, generated
  detail-positive clicks are suppressed, and detail-zero assistive activation remains one discrete move.
- **Cross-module effects:** The run changed only Player A's position, revision, explored projection, and
  movement event/idempotency state. No mission, cargo, coin, combat, world-clock, Player B, WebMCP, or
  Re-entry state changed.

## Analysis and closure

- Failure classification: `none` for the named local client presentation scope.
- Residual risk: The repeat feel remains round-trip bound and has no production latency or browser-device
  guarantee. A server-owned continuous intent, default scheduler, public-load admission, or mobile layout
  change requires a new challenge and decision.
- Invalidation triggers: Changes to the movement command/reconciliation gate, page mutation gate,
  authoritative snapshot semantics, map focus policy, pointer lifecycle, connection lifecycle, or
  `ADR-GAME-0035`.
- Exact conclusion: **`SK-TASK-054` is runtime-verified for the local snapshot-gated held-input controller
  and its real desktop pointer/keyboard page wiring. It changes no server or gameplay authority; hosted,
  production, independent-browser, WebMCP, Re-entry, and final mobile-feel claims remain open.**
