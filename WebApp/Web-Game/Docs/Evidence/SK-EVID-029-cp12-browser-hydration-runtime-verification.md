# SK-EVID-029: CP-12 Browser Hydration and One-Session Canvas Runtime Verification

## Identity

- Evidence ID: `SK-EVID-029`
- Related task, challenge, and decisions: [`SK-TASK-040`](../Tasks/SK-TASK-040-cp12-browser-hydration-and-two-session-smoke.md); [`Validation/46`](../Validation/46-cp12-browser-hydration-and-two-session-preimplementation-challenge.md); [`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)
- Evidence class: `process-runtime`
- Ladder level: `4` — one real browser context over the local file-backed entrypoint; this record deliberately does not claim the level-5 two-session slice
- Executor and date: Codex, 2026-09-02

## Exact identity under test

- Source state: working tree on `main`, `HEAD 4224f3a` (uncommitted; no commit, push, deploy, or hosted claim)
- Source and build root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`; no contract or persistence schema revision
- Runtime versions: Primary Node.js `v24.13.1`; npm `11.8.0`; TypeScript `7.0.2`; Next.js `16.3.4`;
  React `19.2.8`; `ws` `8.21.3`; Chromium `HeadlessChrome/152.0.0.0` at viewport `1280x720`,
  device pixel ratio `1`
- Fixture world and seed: `sleepless-mvp-01`, the accepted G2 fixture; task-local SQLite database at `/tmp/sleepless-kingdom-cp12-node24-sidechat.sqlite`
- Environment and configuration: `NODE_ENV=test`, `LOCAL_FIXTURE_MODE=1`, `PORT=3187`, and the task-local `GAME_DB_PATH`; the entrypoint owns the Next page, worker, store, fixture resolver, gateway, and realtime adapter
- External boundaries: no production identity provider, WebMCP adapter, Agent Signal, Re-entry Core, credential, external service, or hosted process

## Objective and claim boundary

- Behavior under test: The canonical page loads through the entrypoint, obtains the server-derived fixture scope, accepts the matching realtime `client_snapshot`, hydrates the projection, and renders semantic mission/resource state plus a non-empty Canvas frame.
- Claim this evidence may support: one local browser-context runtime proof for `player-a`/`shelter-a`, including page HTTP/hydration, bootstrap scope, realtime readiness, server snapshot readback, semantic rows, and Canvas pixel output at the named Node 24/runtime configuration.
- Claims this evidence cannot support: two independent browser sessions, two-player privacy isolation, keyboard or reconnect behavior, continuous scheduler cadence, production authentication, hosted continuity, WebMCP discovery/invocation, Agent Signal/Re-entry delivery, deployment health, production performance, or judge reproduction.

## Preconditions and fixture

- Starting state: The task-local database was absent before the first Node 24 process and was admitted by the explicit fixture preparation path. The accepted fixture was loaded for the browser run with no client-selected player.
- Server-derived scope: An absent cookie resolved to `fixture-v1-alpha`, `player-a`, and `shelter-a`; the browser did not submit a player id or authoritative world value.
- Real, fake, and stubbed boundaries: The local HTTP server, Next page, WebSocket adapter, fixture store, worker, gateway, projection validator, Canvas, and semantic DOM were real local code. No WebMCP or external continuation path was stubbed as success.

## Execution

| Replayable command or procedure | Result |
|---|---|
| `NODE_ENV=test LOCAL_FIXTURE_MODE=1 PORT=3187 GAME_DB_PATH=/tmp/sleepless-kingdom-cp12-node24-sidechat.sqlite /Users/alex/.nvm/versions/node/v24.13.1/bin/node node_modules/tsx/dist/cli.mjs src/server/entrypoint.ts` | **Started** the real Node 24 local fixture entrypoint; the process listened on `127.0.0.1:3187` and was stopped after the smoke. |
| `curl -i -c /tmp/sk-cp12-node24-cookie.txt http://127.0.0.1:3187/api/local-fixture/bootstrap` | **200**; returned `SK-MVP-0.2`, `sleepless-mvp-01`, `player-a`, and `shelter-a`, with `Set-Cookie: sk_local_fixture=fixture-v1-alpha`. |
| `PWCLI=/Users/alex/.codex/skills/playwright/scripts/playwright_cli.sh; "$PWCLI" --session=cp12-node24-pixels open http://127.0.0.1:3187/; "$PWCLI" --session=cp12-node24-pixels snapshot` | **Passed**; page title `Sleepless Kingdom`, `readyState=complete`, connection `READY`, realtime capability `supported`, and status `Authoritative server snapshot at world time 0.` |
| Browser semantic/pixel readback through `page.evaluate` | **Passed**; `shelter-a`, Wood `1`, Rock `1`, five mission rows, `aria-live=polite`, Canvas `768x480`, `368640` non-transparent pixels, `368640` non-black pixels, checksum `148915293`. |
| `PWCLI=/Users/alex/.codex/skills/playwright/scripts/playwright_cli.sh; "$PWCLI" --session=cp12-node24-beta open http://127.0.0.1:3187/; "$PWCLI" --session=cp12-node24-beta cookie-list` | **Evidence limit**; the named second Playwright session shared `fixture-v1-alpha` and rendered `shelter-a`, so it was not an independent browser context and no two-session isolation claim was made. |
| `npm run test:cp12-projection && npm run test:cp12-visual && npm run test:cp12-fixture && npm run typecheck` | **Passed**; 5 projection tests, 4 visual tests, 10 fixture-session tests, and TypeScript checking passed. |
| `python3 scripts/test_validate_game_docs.py && python3 scripts/validate_game_docs.py --root . --report` | **Passed** after this evidence and audit are synchronized; validator self-test 22/22 and documentation findings 0/39 non-terminal. |

The Playwright snapshots and console logs were captured under the task-local `.playwright-cli/`
directory. The only browser console error was a non-blocking `favicon.ico` 404; no hydration,
React, WebSocket, or projection error was reported.

## Corroborating local browser readback

The Codex In-app Browser supplied a second read-only run against the same source and fixture boundary
using Node.js `v26.5.0`, npm `11.17.0`, TypeScript `7.0.2`, and `http://localhost:3000/`. Browser session
`01a05e51-a22e-7922-bd7a-d6edcc82557b` (browser id `8`) reached `Connection: READY`,
`Realtime capability: supported`, authoritative world time `0`, `shelter-a`, Wood/Rock `1/1`, five
mission rows, and Canvas `768x480` with its accessible equivalent label and no page warning/error.
After the task-local process received `SIGINT`, the same page showed `Connection: CLOSED`,
`The last server snapshot is stale; waiting for a full replacement.`, Wood/Rock `—/—`, and retained
readable mission/history regions. A second in-app tab reused the same profile and `shelter-a`; this is
an explicit evidence limit, not independent alpha/beta isolation. The visible `Realtime capability`
label describes transport status and is not a WebMCP discovery result.

## Assertions

- **Player-visible state:** The page showed `Connection: READY`, `Realtime capability: supported`, world time `0`, `shelter-a`, Wood/Rock availability `1/1`, five resident soldier rows, and the accepted server status message.
- **Canvas and semantic agreement:** The accessible mission rows described the same five resident soldiers represented by the accepted projection; the Canvas had a deterministic non-empty pixel buffer rather than an unrendered or transparent frame.
- **Command and failure contract:** No state-changing command was sent during hydration. The page remained a human-facing projection and did not claim WebMCP invocation or Re-entry support.
- **Persistence, event, and outbox state:** The browser read path did not create a gameplay event or outbox delivery. Durable event, duplicate, and settlement behavior remain covered only by predecessor evidence.
- **Ownership, stale revision, restart, and reconnect:** The bootstrap and first-frame scope were server-derived for `player-a`; malformed/stale and lifecycle negatives remain covered by the CP-12 fixture/projection suites. Two independent browser scopes and reconnect behavior were not executed.

## Analysis and closure

- Failure classification: `evidence`; the one-context browser path passed, while the selected CLI surface did not expose an independent second context.
- Limitations and residual risk: The one-session result does not prove alpha/beta privacy isolation, keyboard input, reconnect UX, continuous world time, or any WebMCP/Re-entry behavior. The favicon 404 is a small presentation defect outside the CP-12 authority boundary.
- Invalidation triggers: changes to the page, fixture resolver/cookie policy, first-frame validator, projection shape, Next/React/WebSocket runtime, Node 24 baseline, or fixture seed invalidate this record.
- Exact conclusion: **`SK-TASK-040` is runtime-verified at the named one-browser-context local scope. Two-session isolation remains an explicit open gate and must not be claimed from this evidence. CP-13 WebMCP and all Re-entry/hosted claims remain separate.**
