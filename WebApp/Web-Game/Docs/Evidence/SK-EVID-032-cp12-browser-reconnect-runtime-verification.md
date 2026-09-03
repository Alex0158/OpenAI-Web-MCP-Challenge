# SK-EVID-032: CP-12 Browser Reconnect Runtime Verification

## Identity

- Evidence ID: `SK-EVID-032`
- Related task and decisions: [`SK-TASK-043`](../Tasks/SK-TASK-043-cp12-browser-reconnect-and-stale-fallback.md); [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md); [`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)
- Evidence class: `process-runtime`
- Ladder level: `4` — one real local browser context over a rebuilt production-mode Next page and the file-backed fixture entrypoint
- Executor and date: Codex, 2026-09-02, Europe/London

## Exact identity under test

- Source state: working tree on `main`, `HEAD 4224f3a` (uncommitted; no commit, push, deploy, or hosted claim)
- Source and build root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`; no wire, identity, persistence, event, or gameplay contract revision
- Runtime versions: Node.js `v26.5.0`; npm `11.17.0`; TypeScript `7.0.2`; Next.js `16.3.4`; React `19.2.8`; `ws` `8.21.3`; focused reconnect contract also passed on the Node.js `v24.13.1` project baseline
- Browser and session: Codex In-app Browser, browser id `8`, session `01a05e51-a22e-7922-bd7a-d6edcc82557b`, fresh task-local tabs at `http://127.0.0.1:3191/`
- Fixture world and seed: `sleepless-mvp-01`, accepted G2 fixture; task-local SQLite path `/tmp/sleepless-kingdom-cp12-reconnect-final-gate-20260902.sqlite`
- Environment and configuration: `NODE_ENV=test`, `LOCAL_FIXTURE_MODE=1`, `HOST=127.0.0.1`, `PORT=3191`; `next({ dev: false })` served the rebuilt `.next` output while the entrypoint retained the accepted non-production fixture gate

## Objective and claim boundary

- Behavior under test: Explicit human recovery from realtime process loss, including truthful stale projection, failed bootstrap retry, process restart, fresh scope/bootstrap, and acceptance of a new matching full `client_snapshot`.
- Claim this evidence may support: The named local page can move through `READY -> CLOSED -> failed reconnect/CLOSED -> manual retry/READY` without an automatic retry loop, duplicate in-flight attempt, client-selected identity, or loss of its same-scope mission/history projection.
- Claims this evidence cannot support: A transport that accepts but never settles, two independent browser sessions, keyboard movement, production authentication, hosted continuity, WebMCP discovery/invocation, Agent Signal/Re-entry delivery, scheduler cadence, performance, or judge reproduction.

## Preconditions and fixture

- Starting state: The optimized page build completed successfully and the explicit fixture mode prepared or reopened the same task-local G2 database. The browser obtained its world/player/shelter scope from the bootstrap route and never submitted an authoritative identity.
- Synthetic identities and seeded actors: `fixture-v1-alpha`, `player-a`, `shelter-a`, five resident `soldier-a-*` actors, and symmetric Wood/Rock nodes from the accepted G2 fixture.
- Real, fake, and stubbed boundaries: HTTP, Next page, WebSocket, fixture resolver, shared store/worker/gateway, projection validator, React lifecycle, Canvas/semantic projection, process stop, and process restart were real local code. No external service, WebMCP adapter, delivery stub, second worker/store, or client identity override was used.

## Execution

| Replayable command or procedure | Result |
|---|---|
| `npm run test:cp12-reconnect` | **Passed 3/3** on Node.js `v26.5.0`: duplicate in-flight starts are rejected, settled attempts supersede late callbacks, closed state remains explicitly recoverable, and stale snapshot retention requires an identical contract/world/player/shelter scope. |
| `/Users/alex/.nvm/versions/node/v24.13.1/bin/node ./node_modules/tsx/dist/cli.mjs --test tests/cp12-reconnect.test.ts` | **Passed 3/3** on the project Node 24 baseline. |
| `npm run test:cp12-projection`, `npm run test:cp12-fixture`, `npm run test:cp12-visual`, and `npm run typecheck` | **Passed**: 5 projection, 10 fixture/session, and 4 visual tests plus TypeScript checking. Existing suites cover malformed/foreign/stale frame rejection, bootstrap failure contracts, and retained stale projection semantics. |
| `npm run build` | **Passed** after the final scope and duplicate-attempt fixes; Next produced an optimized static `/` route. |
| Start the entrypoint on port `3191` with the named environment, the task-local database, and `next({ dev: false })`; open the canonical page in a fresh In-app Browser tab | **Passed**: `Connection: READY`, `Realtime capability: supported`, authoritative world time `0`, `shelter-a`, Wood/Rock `1/1`, and five readable resident mission rows. |
| Stop the process while the page remains open | **Passed**: the page changed to `Connection: CLOSED`, exposed `Reconnect`, retained world time `0`, shelter, coins, mission rows, map/history, and hid stale Wood/Rock counts as `—`. |
| Click `Reconnect` while the process remains unavailable | **Passed**: the prompt connection failure returned to visible `CLOSED`, preserved the same readable stale projection, and re-enabled the same accessible reconnect action; no automatic retry occurred. |
| Restart the same entrypoint/database and click `Reconnect` once | **Passed**: the page returned to `READY`, accepted a fresh server-scoped full snapshot, restored Wood/Rock `1/1`, and retained the same world time, shelter, coins, and five mission rows. |
| `python3 scripts/test_validate_game_docs.py`, `python3 scripts/validate_game_docs.py --root . --report`, and `git diff --check -- .` | **Passed**: validator self-test 22/22, documentation validation with exactly one non-terminal task (`SK-TASK-044`), and no whitespace errors. |

No browser cookie, local storage, profile, password, or session store was inspected. No gameplay command,
event, outbox delivery, settlement, WebMCP call, Agent Signal, or Re-entry action was issued.

## Assertions

- **Player-visible state:** Process loss and prompt bootstrap failure remain distinguishable from `READY`; reconnect is accessible and same-scope mission/history/map state stays readable. Sensed resource counts are deliberately hidden while stale and restored only after the fresh frame.
- **Command and failure contract:** The browser initiates at most one in-flight connection attempt, closes or supersedes the old socket before a later attempt, ignores late callbacks, and accepts no frame outside the server-derived contract/world/player/shelter scope.
- **Persistence, event, and outbox state:** Reconnect is projection transport only. It creates no gameplay mutation, event, outbox row, cargo change, coin change, world-time advance, or settlement.
- **Exactly-once settlement after duplicate delivery and replay:** Not applicable; no state-changing delivery occurred. Duplicate-attempt prevention was verified at the connection lifecycle boundary.
- **Ownership denial, stale revision, restart, and reconnect:** Same-scope restart/reconnect passed. A changed bootstrap scope clears the retained snapshot before any new frame can render; the scope comparison is covered by the focused contract test.

## Analysis and closure

- Failure classification: `none` for the named prompt close/failure/restart path. A silent bootstrap or first-frame operation that never settles remains an explicit untested lifecycle case.
- Limitations and residual risk: There is no automated component harness for the full React/fetch/WebSocket composition; this record binds focused gate/scope/projection/fixture tests to the real browser lifecycle instead. A peer that accepts the connection but never returns bootstrap or a first frame can leave the page in `CONNECTING`; adding an acceptance deadline is an [`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md) reopen trigger. Stale Canvas/map and mission/history remain visible, while Wood/Rock counts are intentionally hidden.
- Invalidation triggers: Changes to the connection gate, `LiveGameProjection`, reconnect control, fixture bootstrap/session policy, first-frame validator, projection shape, Next/React/WebSocket runtime, browser surface, or fixture seed invalidate this record.
- Exact conclusion: **`SK-TASK-043` is runtime-verified for the named local manual reconnect and stale-fallback path. Silent no-settle deadlines, independent two-session delivery, keyboard input, WebMCP, Re-entry, hosted continuity, and level-5 claims remain open.**
