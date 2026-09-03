# SK-EVID-030: CP-13 WebMCP Capability Probe

## Identity

- Evidence ID: `SK-EVID-030`
- Related task, issue, or decision: [`SK-TASK-041`](../Tasks/SK-TASK-041-cp13-webmcp-capability-probe.md); [`SK-ISSUE-001`](../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md); [`ADR-GAME-0006`](../Decisions/ADR-GAME-0006-mvp-contract-and-reentry-boundary.md); [`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)
- Evidence class: `capability`
- Ladder level: `6` for the named negative capability outcome; no positive WebMCP registration or invocation claim
- Executor and date: Codex, 2026-09-02, Europe/London

## Exact identity under test

- Source state: working tree on `main`, `HEAD 4224f3a` (uncommitted; no commit, push, deploy, or hosted claim)
- Source and build root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`
- Runtime versions: Node.js `v26.5.0`; npm `11.17.0`; TypeScript `7.0.2`; Next.js `16.3.4`; React `19.2.8`; `ws` `8.21.3`
- Browser and session: Codex In-app Browser, browser id `8`, tab id `6`, model `gpt-5.6-luna`, canonical page `http://127.0.0.1:3187/`
- Fixture world and seed: `sleepless-mvp-01`, accepted G2 fixture; isolated task-local SQLite path `/tmp/sleepless-kingdom-cp13-probe-20260902.sqlite`
- Environment and configuration: `NODE_ENV=test`, `LOCAL_FIXTURE_MODE=1`, `HOST=127.0.0.1`, `PORT=3187`; the entrypoint-owned worker, store, fixture resolver, gateway, Next page, and realtime adapter were used

## Objective and claim boundary

- Behavior under test: Fresh page-bound WebMCP capability discovery on the canonical CP-12 page, with the human projection remaining usable when the selected adapter is unavailable.
- Claim this evidence may support: The named browser/model adapter could not execute the WebMCP discovery command for this exact canonical page and session; the page-side WebMCP object was absent in the same browser context; the human-facing realtime projection still hydrated successfully.
- Claims this evidence cannot support: Genuine WebMCP registration or invocation, any state-changing tool, `force_recall_soldier`, Agent Signal or Re-entry delivery, two-browser isolation, default scheduler, production identity, hosted continuity, or judge reproduction.

## Preconditions and fixture

- Starting state: A fresh task-local database was admitted by the explicit non-production fixture path; no client-selected player, world, or shelter value was supplied.
- Synthetic identities and seeded actors: Server-derived `fixture-v1-alpha`, `player-a`, `shelter-a`; five resident soldiers, one Wood node, one Rock node, and the accepted seeded world.
- Real, fake, and stubbed boundaries: The local HTTP server, Next page, browser, WebSocket, worker, store, fixture resolver, projection, and page capability lookup were real local boundaries. No WebMCP tool list or callback was stubbed as success, and no external Agent service was contacted.

## Execution

| Replayable command or procedure | Result |
|---|---|
| `NODE_ENV=test LOCAL_FIXTURE_MODE=1 HOST=127.0.0.1 PORT=3187 GAME_DB_PATH=/tmp/sleepless-kingdom-cp13-probe-20260902.sqlite npx tsx src/server/entrypoint.ts` | **Started** the real local fixture entrypoint; the process reported `http_bound` and `runtime_ready` on loopback. |
| Open `http://127.0.0.1:3187/` in Codex In-app Browser tab `6` | **Passed**; page title `Sleepless Kingdom`, `Connection: READY`, `Realtime capability: supported`, world time `0`, `shelter-a`, Wood/Rock `1/1`, five mission rows, and the accessible Canvas equivalent were visible. |
| Page-side readback: `typeof document.modelContext` | **`undefined`** in the canonical page context. This is a page capability observation, not an Agent invocation result. |
| Browser capability: `await (await tab.capabilities.get('webmcp')).fetchTools()` | **Unavailable**; exact adapter error: `gpt-5.6-luna does not support command "webmcp_list_tools"`. |
| WebMCP tool invocation | **Not run by design**; no genuine tool list was returned, so the task's one-read-only-invocation condition was not met. |
| Human fallback readback | **Passed**; the page remained readable and server-scoped without WebMCP, and no state-changing command or event was issued. |

The local process was stopped after the read-only probe. No browser cookie, local storage, credential,
or private session store was inspected.

## Assertions

- **Player-visible state:** The page hydrated the server-derived `player-a`/`shelter-a` projection and retained the human dashboard while the WebMCP adapter was unavailable.
- **Command and failure contract:** The adapter failure was explicit and typed by its exact error message; no synthetic tool name, callback, or successful invocation was reported.
- **Persistence, event, and outbox state:** The read-only bootstrap and capability lookup produced no gameplay mutation, Domain Event, coin change, cargo change, or outbox row.
- **Exactly-once settlement after duplicate delivery and replay:** Not applicable to this read-only negative probe; no command or delivery was attempted.
- **Ownership denial, stale revision, restart, and reconnect:** Not exercised by this capability-only probe; the page scope remained server-derived and no command path was opened.

## Analysis and closure

- Failure classification: `environment`/`evidence` — the selected model/adapter cannot expose the required discovery command, and the page currently has no `document.modelContext` object in this context.
- Limitations and residual risk: This result does not identify whether a different supported model/adapter would discover the page tools. It does not authorize a page polyfill, tool implementation, or Re-entry work. A dedicated WebMCP unsupported label is not added by this probe; the existing human projection remains the safe fallback.
- Invalidation triggers: A change to the selected browser/model adapter, page registration contract, page build, fixture/session boundary, runtime versions, contract version, or canonical URL invalidates this record.
- Exact conclusion: **`SK-TASK-041` is runtime-verified for the exact negative capability outcome. The current adapter cannot run `webmcp_list_tools`; no genuine page-bound tool discovery or invocation was proven. Keep `SK-ISSUE-001` open and keep CP-13 implementation gated until a supported adapter produces fresh discovery and one read-only invocation.**
