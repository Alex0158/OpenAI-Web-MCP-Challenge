# SK-EVID-031: CP-12 Two-Session Browser Isolation Probe

## Identity

- Evidence ID: `SK-EVID-031`
- Related task, challenge, and decisions: [`SK-TASK-042`](../Tasks/SK-TASK-042-cp12-independent-two-session-browser-isolation.md); [`Validation/46`](../Validation/46-cp12-browser-hydration-and-two-session-preimplementation-challenge.md); [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md); [`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)
- Evidence class: `process-runtime`
- Ladder level: `4` for the local process and two-tab lifecycle observation; level-5 independent two-session delivery was not proven
- Executor and date: Codex, 2026-09-02, Europe/London

## Exact identity under test

- Source state: working tree on `main`, `HEAD 4224f3a` (uncommitted; no commit, push, deploy, or hosted claim)
- Source and build root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`
- Runtime versions: Node.js `v26.5.0`; npm `11.17.0`; TypeScript `7.0.2`; Next.js `16.3.4`; React `19.2.8`; `ws` `8.21.3`
- Browser and session: Codex In-app Browser, browser id `8`, tabs `7` and `8`, canonical page `http://127.0.0.1:3187/`
- Fixture world and seed: `sleepless-mvp-01`, accepted G2 fixture; task-local SQLite path `/tmp/sleepless-kingdom-cp12-two-session-20260902.sqlite`
- Environment and configuration: `NODE_ENV=test`, `LOCAL_FIXTURE_MODE=1`, `HOST=127.0.0.1`, `PORT=3187`; one entrypoint-owned worker, store, fixture resolver, gateway, page, and realtime adapter

## Objective and claim boundary

- Behavior under test: Whether the selected browser surface can provide two independent contexts that receive distinct server-derived alpha/beta projections, plus the lifecycle effect of closing one tab.
- Claim this evidence may support: The local entrypoint served two browser tabs successfully; both tabs reached the same server-derived `player-a`/`shelter-a` projection; closing one tab left the other readable; the used browser surface did not yield an independent two-session result.
- Claims this evidence cannot support: Level-5 two-player privacy isolation, beta delivery, independent cookie/session contexts, keyboard or reconnect UX, WebMCP, Re-entry, scheduler, production identity, hosted continuity, or judge reproduction.

## Preconditions and fixture

- Starting state: A fresh task-local database was admitted by explicit fixture mode and seeded with the accepted G2 world. No player, shelter, world, or authoritative position was supplied by page input.
- Synthetic identities and seeded actors: The server resolver owns `fixture-v1-alpha`/`player-a`/`shelter-a` and the fixture also contains the paired beta identity; each tab used the browser-managed session path.
- Real, fake, and stubbed boundaries: Local HTTP, Next, browser tabs, WebSocket, worker, store, resolver, projection, Canvas, and semantic DOM were real. No second worker/store, cookie injection, client identity override, or visibility stub was introduced.

## Execution

| Replayable command or procedure | Result |
|---|---|
| `NODE_ENV=test LOCAL_FIXTURE_MODE=1 HOST=127.0.0.1 PORT=3187 GAME_DB_PATH=/tmp/sleepless-kingdom-cp12-two-session-20260902.sqlite npx tsx src/server/entrypoint.ts` | **Started** the local fixture entrypoint and reported `http_bound` and `runtime_ready` on loopback. |
| Open `http://127.0.0.1:3187/` in tabs `7` and `8` under browser id `8` | **Passed** process/browser delivery; both pages reached `Connection: READY`, world time `0`, and readable five-soldier mission projections. |
| Semantic readback from both pages | **Same scope in both tabs**: `shelter-a`, Wood/Rock `1/1`, five resident `soldier-a-*` rows, and causal history `0 events`. No beta projection appeared. |
| Close tab `7`, then read tab `8` | **Passed** lifecycle observation; tab `8` remained `Connection: READY`, `shelter-a`, and `CAUSAL HISTORY 0 events`. |
| Independent-context proof | **Unavailable in the used surface**; both tabs were created under browser id `8` and the selected API supplied tabs but no context-isolation operation. Equal alpha readback is therefore recorded as an evidence limit, not as proof that the contexts were independent or that privacy isolation passed. |

No browser cookie, local storage, profile, password, or session store was inspected. No state-changing
command, WebMCP call, Agent Signal, or Re-entry action was issued. The local process was stopped after
the read-only observation.

## Assertions

- **Player-visible state:** Both tabs rendered the server-derived alpha projection with the expected shelter, resources, five mission rows, and readable history; no beta state was exposed.
- **Command and failure contract:** No command was sent. The inability to establish independent contexts remained explicit rather than being hidden behind a client-selected identity or a second local authority.
- **Persistence, event, and outbox state:** The two-tab read and one-tab close produced no gameplay event, outbox row, cargo change, coin change, or mission mutation.
- **Exactly-once settlement after duplicate delivery and replay:** Not applicable; no state-changing delivery occurred.
- **Ownership denial, stale revision, restart, and reconnect:** Not exercised. The remaining tab's READY state after the other tab closed is a lifecycle observation, not reconnect proof.

## Analysis and closure

- Failure classification: `environment`/`evidence` — the selected In-app Browser surface did not expose a proven independent context, so the level-5 isolation claim remains open.
- Limitations and residual risk: Same-scope readback is compatible with shared profile state and with two fresh contexts receiving the default alpha handle; without a genuinely independent beta context, privacy isolation is undecidable. A separate browser/context-capable surface is required for the positive claim.
- Invalidation triggers: Changes to the browser surface, fixture session policy, first-frame validator, projection visibility, runtime versions, canonical page, or fixture seed invalidate this record.
- Exact conclusion: **`SK-TASK-042` is runtime-verified for the named local two-tab limitation and close-one/keep-one lifecycle observation. It does not close the independent two-session gate or support a level-5 two-player claim.**
