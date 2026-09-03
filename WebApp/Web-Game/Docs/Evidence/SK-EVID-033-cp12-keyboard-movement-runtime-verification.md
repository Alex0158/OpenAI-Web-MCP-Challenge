# SK-EVID-033: CP-12 Keyboard Movement Runtime Verification

## Identity

- Evidence ID: `SK-EVID-033`
- Related task and decisions: [`SK-TASK-044`](../Tasks/SK-TASK-044-cp12-keyboard-movement-and-authoritative-reconciliation.md); [`ADR-GAME-0030`](../Decisions/ADR-GAME-0030-cp12-discrete-keyboard-command-and-reconciliation.md)
- Evidence class: `process-runtime`
- Ladder level: `4` — one real local browser context over the rebuilt optimized Next page, the file-backed fixture entrypoint, the shared worker gateway, and SQLite state
- Executor and date: Codex, 2026-09-02, Europe/London

## Exact identity under test

- Source state: working tree on `main`, `HEAD 4224f3a` (uncommitted; no commit, push, deploy, or hosted claim)
- Source and build root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`; no persistence schema, realtime frame, world-clock, mission, combat, economy, WebMCP, or Re-entry contract revision
- Runtime versions: Node.js `v24.13.1`; TypeScript `7.0.2`; Next.js `16.3.4`; React `19.2.8`; `ws` `8.21.3`
- Browser and session: Codex In-app Browser, browser id `8`, session `01a05e51-a22e-7922-bd7a-d6edcc82557b`, fresh task-local tab at `http://127.0.0.1:3191/`
- Fixture world and seed: `sleepless-mvp-01`, accepted G2 fixture; task-local SQLite path `/tmp/sleepless-kingdom-task044.KUKvla/world.sqlite`
- Environment and configuration: `NODE_ENV=test`, `LOCAL_FIXTURE_MODE=1`, `HOST=127.0.0.1`, `PORT=3191`; the final lifecycle run used `next({ dev: false })` over the rebuilt `.next` output

## Objective and claim boundary

- Behavior under test: One focused non-repeat W-A-S-D/arrow action submits one server-scoped adjacent `move_player` command, waits for its typed acknowledgement, then replaces the visible position and fog only through the existing WebSocket full-snapshot path.
- Claim this evidence may support: The named local desktop page can issue, reconcile, persist, restart, and visibly reject the bounded CP-12 discrete movement path without a browser clock, client-owned position, unsequenced HTTP snapshot, or command/idempotency identity collapse.
- Claims this evidence cannot support: Held-key or continuous Starve.io-style movement, the accepted 4-tile/s worker cadence in a browser, a default all-phase scheduler, independent two-session delivery, production identity, hosted continuity, WebMCP, Re-entry, mobile/touch input, performance, or judge reproduction.

## Preconditions and fixture

- Starting state: The accepted G2 fixture existed in the task-local database with Player A at `(16,64)`, Player B at `(112,64)`, five resident soldiers, and one sensed Wood plus one sensed Rock node.
- Real boundaries: HTTP parsing, strict fixture-session admission, per-player command admission, worker FIFO, movement transaction, event/idempotency persistence, WebSocket resync, projection validation, React state, focused-map keyboard handling, Canvas/semantic replacement, SQLite restart, and optimized shutdown were real local code.
- Synthetic or absent boundaries: No external service, WebMCP adapter, Agent Signal delivery, Re-entry callback, host scheduler, second worker/store, production identity, or browser-selected player was used.

## Red, Green, and focused verification

| Replayable command or procedure | Result |
|---|---|
| Initial focused Red runs for CP-12 and CP-08 movement | **Failed as intended** before implementation: the keyboard contract module was absent; command causation still used the idempotency identity; blocked rejection replay was not durable. |
| Adversarial stale-plus-blocked and typed-failure Red additions | **Failed as intended**: geometry initially won before revision validation, and the shared definitive-failure parser was absent. The corrected order replays an existing key first, then durably rejects stale revision before collision; the shared parser now validates the complete bounded failure result. |
| `/Users/alex/.nvm/versions/node/v24.13.1/bin/node ./node_modules/tsx/dist/cli.mjs --test tests/cp08-movement-snapshot.test.ts` | **Passed 4/4** after the final correction, including stale-plus-blocked precedence, exact rejected replay, conflict, restart, and later valid movement. |
| Same Node 24 runner over `tests/cp08-movement-cadence.test.ts`, `tests/cp08-worker-gateway.test.ts`, `tests/cp08-realtime-snapshot.test.ts`, and `tests/cp08-realtime-wire.test.ts` | **Passed 5/5, 7/7, 6/6, and 8/8**. The movement service instance remains shared with cadence and the gateway; command then snapshot ordering stays FIFO. |
| Same Node 24 runner over `tests/cp12-keyboard-movement.test.ts`, `tests/cp12-local-fixture.test.ts`, `tests/cp12-client-projection.test.ts`, `tests/cp12-reconnect.test.ts`, and `tests/cp12-visual-assets.test.ts` | **Passed 6/6, 10/10, 5/5, 3/3, and 4/4** after the final server/client integration. The sixth keyboard contract rejects repeated Enter/Space activation on direction buttons. |
| `npm run typecheck` under the Node 24 baseline | **Passed**. |
| `npm run build` under the Node 24 baseline | **Passed**; Next.js `16.3.4` produced the optimized `/` route. |

No broad aggregate suite was run. The selected checks cover the changed movement transaction,
gateway, realtime, fixture/session, client projection, reconnect, input, visual, type, and build seams.

## Browser and persistence execution

| Procedure | Observed result |
|---|---|
| Open the canonical page against the task-local fixture | `Connection: READY`, `Realtime capability: supported`, world time `0`, `shelter-a`, Wood/Rock `1/1`, and five readable soldiers appeared. The map exposed `tabindex="0"` and `aria-keyshortcuts="W A S D ArrowUp ArrowLeft ArrowDown ArrowRight"`; pending `aria-busy` belongs to the direction group rather than the movement live-region ancestor. |
| Focus the map and press `d` once | Player A changed from `(16,64)` revision `0` to `(17,64)` revision `1` through an acknowledged command and accepted WebSocket snapshot. |
| Dispatch a synthetic `keydown` with `repeat: true` on the focused map | Position and revision remained `(17,64)` revision `1`; no command effect appeared. |
| Activate the labelled right-direction button, then press `d` while that button owns focus | The button produced one move to `(18,64)` revision `2`; the keyboard event outside the map produced no move. This proves the local focus boundary rather than a document-global listener. |
| Move left to the world boundary and attempt one extra left move | The accepted moves reached `(0,64)` revision `20`. The extra move displayed `Movement blocked. The player remains at the authoritative position.` and produced no position, revision, or event change. |
| Reload, then restart the optimized entrypoint over the same database | The first optimized readback restored `(0,64)` revision `20` and reconciled one right/left pair to revision `22`. After the final accessibility correction and rebuild, a fresh optimized run restored revision `22`, reconciled another right/left pair to revision `24`, and kept another left action blocked at `(0,64)` revision `24`. The map had no busy ancestor around its live status, while the direction group reported `aria-busy="false"` when idle. |
| Inspect the final file-backed state | Player A was `(0,64)` revision `24` with `191` explored cells; Player B remained `(112,64)` revision `0`. SQLite held `24` `PlayerMoved` events, `24` committed and `3` rejected idempotency records, and zero movement events whose `causation_id` equalled `idempotency_key`. The page deliberately showed only the latest bounded 20-event history. |
| Stop the final optimized entrypoint with `SIGINT` and inspect the listener | The runtime logged `runtime_draining_SIGINT`, `runtime_stopped`, and `task044_final_shutdown_result` with `timedOut:false` and `errorCode:null`; the bounded wrapper exited `0` and port `3191` was free afterward. |

The first exploratory dev/HMR run held a browser development connection long enough to hit the
entrypoint shutdown deadline. The optimized rebuilt-page rerun above closed cleanly and is the
closure result. No cookie value, local storage, credential, password, or private Agent context was
inspected.

## Assertions

- **Authority and projection:** Key and button input express direction only. The server owns scope, collision, position, explored cells, revision, event, and world time. HTTP acknowledgements never contain a renderable position; only an accepted realtime snapshot replaces the UI.
- **Identity and replay:** The fixture cookie selects the server-side scope. `command_id` and `idempotency_key` are distinct; the event uses the former for causation and the latter for retry identity. Stale and blocked outcomes are durably replayable.
- **Failure and lifecycle:** Absent or invalid sessions fail before body parsing. Valid definitive `409` outcomes return a typed bounded failure with current player revision. Unknown transport outcomes request one readback and never auto-retry the mutation.
- **UX and accessibility:** Movement is available from a focusable map and labelled direction buttons; repeat/modifier/composition/in-flight/hidden/unfocused inputs are rejected by the client gate, and blocked or stale results are textual.
- **Cross-module effects:** The run changed only Player A movement, fog, its `PlayerMoved` history, and movement idempotency records. World time, Player B, missions, cargo, coins, combat, outbox delivery, WebMCP, and Re-entry did not advance.

## Analysis and closure

- Failure classification: `none` for the named optimized local discrete-command path.
- Accepted residuals: `command_id` is required to be distinct and client-generated uniquely, but this local slice does not yet maintain a global command-id ledger across different idempotency keys. Per-player HTTP movement is single-flight, while the inherited local realtime connection count and gateway read queue remain unbounded. Real HTTP `429`, route-specific draining, and a full React component harness are not separately exercised; focused admission/lifecycle tests plus the real browser run bind those seams at this scope.
- Invalidation triggers: Changes to movement validation order, rejected-idempotency persistence, command/failure envelope, fixture-session resolver, gateway ordering, realtime resync, projection acceptance, map focus/input gates, snapshot history, build/runtime versions, fixture seed, or browser surface invalidate this record.
- Exact conclusion: **`SK-TASK-044` is runtime-verified for one local desktop discrete keyboard/button movement and authoritative reconciliation path. Continuous movement, scheduler composition, independent sessions, WebMCP, Re-entry, hosted continuity, and level-5 claims remain open.**
