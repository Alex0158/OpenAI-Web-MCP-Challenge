# SK-EVID-048: CP-13 Canonical Page Browser Attempt

**Status:** GATED; canonical page registration is observed, supported-agent discovery remains open  
**Date:** 2026-09-03  
**Task:** [`SK-TASK-061`](../Tasks/SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)  
**Scenario:** [`CP-13 WebMCP fixtures`](../Scenarios/13-cp13-webmcp-fixtures.md)

## Question

Can the canonical game page in the named local browser session expose the accepted CP-13 page tools
to a supported Agent adapter, with exact discovery and one read-only invocation?

## Exact identity and environment

- Source root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Git branch: `main`; no commit, push, deployment, or external write was performed.
- Runtime: Node `v24.20.0`, started through `/opt/homebrew/opt/node@24/bin`.
- Local process: `NODE_ENV=test`, `LOCAL_FIXTURE_MODE=1`, `HOST=127.0.0.1`, `PORT=3187`.
- Fixture database: task-local file `tmp/runtime/cp13-canonical.sqlite`.
- Page: `http://127.0.0.1:3187/`, title `Sleepless Kingdom`.
- Browser: Codex In-app Browser, browser id `4`, tab id `4`.
- Active primary model for the browser capability call: `gpt-5.6-luna`.

## Procedure and observations

1. Started the entrypoint-owned local fixture process and observed `http_bound` and `runtime_ready`.
2. Opened the canonical page in the Codex In-app Browser and read its visible DOM.
3. The page returned HTTP `200` and showed `Connection: READY`, `Realtime capability: supported`, and
   `WebMCP: registered`. The ordinary human map, movement controls, shelter dashboard, and mission
   controls remained visible.
4. The browser exposed its page `webmcp` capability. Calling its supported `fetchTools()` operation
   returned the exact adapter error:

   ```text
   gpt-5.6-luna does not support command "webmcp_list_tools".
   ```

5. A read-only Playwright page evaluation of `document.modelContext.getTools` returned
   `{ "status": "unavailable" }` in the browser evaluation scope. This scope result is not treated as
   an injection falsifier because the page's own registrar had already reported `registered` and the
   capability adapter independently rejected the Luna discovery command.
6. The assigned `gpt-5.6-sol` plus `medium` subagent retried the same gate, but its browser discovery
   returned no in-app browser (`agent.browsers.get("iab")` was unavailable) and only a Chrome extension
   instance. It therefore did not enumerate or invoke page tools and did not use a fallback transport.
7. Stopped the local process cleanly after the read-only observation.

## Result classification

| Boundary | Result | Claim supported |
|---|---|---|
| Canonical page load | Pass | The local entrypoint serves the canonical page and the human surface remains usable. |
| Page registrar status | Observed | The page's own lifecycle reached `WebMCP: registered` in this browser session. |
| Same-page tool inventory | **Gated** | The browser evaluation scope could not read the host API, and Luna could not run discovery. |
| Supported Sol discovery | **Gated** | The assigned Sol session had no callable in-app browser/WebMCP adapter. |
| Read-only invocation | **Not run** | No exact canonical tool inventory was available from a supported adapter. |

## Claim boundary

This is a canonical-page browser attempt, not CP-13 closure evidence. It does not prove the exact
registered tool inventory, supported-agent discovery, read-only invocation, Agent grant delivery,
Re-entry continuation, hosted continuity, independent browser identity, or judge reproduction. It does
not justify a REST, DOM automation, headless-browser, fake `modelContext`, or polyfill substitution.

`SK-TASK-061` remains `verification_pending`. The next gate is a fresh supported GPT-5.6 Sol browser
session with in-app WebMCP access that enumerates the canonical page tools and performs one accepted
read-only invocation; record that result separately before changing the task lifecycle.

## Repeat observation — 2026-09-03 05:20 UTC

A fresh task-local run repeated the read-only gate without changing the claim boundary:

- The entrypoint started with `NODE_ENV=test`, `LOCAL_FIXTURE_MODE=1`, `HOST=127.0.0.1`,
  `PORT=3187`, and a disposable database at `/tmp/sleepless-kingdom-cp13-canonical-live-20260903.sqlite`.
- The Codex In-app Browser (browser id `4`, fresh tab id `5`) loaded `http://127.0.0.1:3187/` with
  HTTP `200`, title `Sleepless Kingdom`, `Connection: READY`, `Realtime capability: supported`, and
  the page status `WebMCP: registered`. The human map, shelter dashboard, and gatherer controls stayed
  usable.
- The page capability's read-only `fetchTools()` call returned
  `gpt-5.6-luna does not support command "webmcp_list_tools"`. No page tool inventory or invocation
  was available, and no mutation or fallback transport was attempted.
- The fixture process was stopped cleanly with `SIGINT` after the observation.

This repeat confirms the existing Luna limitation only. It does not add supported-agent discovery,
canonical tool readback, or read-only invocation evidence; `SK-TASK-061` therefore remains
`verification_pending` and still requires the Sol in-app WebMCP gate described above.
