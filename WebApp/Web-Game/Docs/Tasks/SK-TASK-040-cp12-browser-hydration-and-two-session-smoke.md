# SK-TASK-040: CP-12 Browser Hydration and Two-Session Smoke

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-12`
- Owner: Game owner
- Current increment: One real browser context proves canonical page hydration, server-derived fixture bootstrap, scoped realtime first-frame acceptance, semantic mission/resource readback, a non-empty Canvas surface, and a readable closed-channel fallback; the independent two-session slice remains open.
- Next gate: Use the fresh one-context evidence to enter the CP-13 capability probe while keeping independent alpha/beta isolation, keyboard/reconnect behavior, and WebMCP invocation as separate gates; reopen this task if the named one-context boundary changes.

## Identity

- Task ID: `SK-TASK-040`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: The increment crosses the canonical Next page, the local fixture bootstrap cookie, WebSocket first-frame binding, Canvas/React projection, browser lifecycle, and the human fallback. A failure could expose the wrong player scope or make a live page appear usable while its state is stale.

## Objective

Prove the smallest browser-level CP-12 composition on the owner-accepted local fixture boundary. A
browser must load the canonical page, obtain its server-derived fixture scope through the same-origin
bootstrap, receive and render a matching full `client_snapshot`, and leave human-readable status
available when realtime or a page capability is unavailable. Where the selected browser supports a
second isolated session, verify that the fixed alpha and beta handles remain player-scoped; if the
browser surface cannot provide two independent sessions, record that as an explicit evidence limit.

## Success and non-goals

- Success: The page HTTP response is usable, the client hydrates without a page error, and the semantic
  surface exposes the expected contract/world/player/shelter context and connection state after the
  first accepted frame.
- Success: The Canvas consumer receives the server-owned projection and the visible mission/resource
  text agrees with the frame; no browser coordinate, clock, player id, or cookie value becomes authority.
- Success: A closed or unavailable realtime channel remains visibly `STALE`, `CLOSED`, or unsupported;
  the human surface remains readable and does not claim Agent or WebMCP support.
- Success: If two browser contexts are available, alpha and beta receive their own server-derived
  scopes and do not reveal the other player's private projection. Otherwise the record names the
  unverified two-session boundary and keeps the task open or closes only the one-session scope.
- Non-goals: WebMCP tool registration or invocation, Re-entry delivery, external Receiver/Connector,
  production authentication, default scheduler, hosted continuity, gameplay balance, final art,
  performance/FPS claims, or state-changing browser controls.

## Scope and authority

- In scope: The existing `app/page.tsx` and client projection consumer, the entrypoint-owned local
  fixture bootstrap and realtime path, browser hydration/readback, and focused browser/process evidence.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, production identity, new HTTP or WebSocket
  protocols, new persistence schema, WebMCP APIs, external services, and unrelated dirty work.
- Allowed actions: Read and edit task-owned test/evidence/documentation files, run a local fixture
  process and browser read-only smoke, and make the smallest scoped client fix if a reproducible
  hydration defect is found. Do not stage, commit, push, deploy, use credentials, spend, or contact
  external parties.
- Revalidate when: the fixture resolver, first-frame validator, projection shape, page lifecycle,
  connection-state vocabulary, or human consequence boundary changes.

## Owning authority

- Page and projection boundary: [`../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)
- Local session boundary: [`../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)
- Presentation contract: [`../Scenarios/12-cp12-canvas-dashboard-fixtures.md`](../Scenarios/12-cp12-canvas-dashboard-fixtures.md) and [`../Design/06-visual-ui-and-asset-spec.md`](../Design/06-visual-ui-and-asset-spec.md)
- Realtime predecessor: [`../Decisions/ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md`](../Decisions/ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md)
- Process authority: [`../Engineering/02-system-architecture.md`](../Engineering/02-system-architecture.md) and [`../Engineering/05-api-and-webmcp.md`](../Engineering/05-api-and-webmcp.md)
- Preparation challenge: [`../Validation/46-cp12-browser-hydration-and-two-session-preimplementation-challenge.md`](../Validation/46-cp12-browser-hydration-and-two-session-preimplementation-challenge.md)

## Evidence status

- Verified: The process-level fixture bootstrap, shared worker/store/gateway, server-derived scope,
  first-frame validation, projection consumer, and visible degraded states are locally runtime-verified
  under [`SK-EVID-028`](../Evidence/SK-EVID-028-cp12-local-fixture-session-runtime-verification.md).
- Verified: The pure projection/render-model and inline SVG dashboard consumer are locally verified
  under [`SK-EVID-026`](../Evidence/SK-EVID-026-cp12-client-projection-runtime-verification.md) and
  [`SK-EVID-027`](../Evidence/SK-EVID-027-cp12-original-svg-ui-icon-runtime-verification.md).
- Verified: The Node 24 browser smoke is recorded in [`SK-EVID-029`](../Evidence/SK-EVID-029-cp12-browser-hydration-runtime-verification.md)
  and reviewed in [`Validation/47`](../Validation/47-cp12-browser-hydration-runtime-cross-functional-audit.md)
  for one browser context, including semantic readback and non-empty Canvas pixels. A corroborating
  Codex In-app Browser readback also confirmed the ready and closed-channel DOM states after the
  realtime-capability label was corrected.
- Unknown: Two independent browser sessions, alpha/beta privacy isolation, keyboard behavior, and
  reconnect UX remain unverified. WebMCP/Re-entry and hosted identity are separate gates and are not
  inferred from this task.

## Cross-functional checks

1. **Identity and privacy:** The bootstrap cookie is server-issued and the first frame must match the
   server-derived world/player/shelter scope. A URL, form field, or browser script cannot select a
   player. Alpha and beta may be compared only for scope isolation, never by exposing hidden cargo or
   another player's private state.
2. **Lifecycle:** The page must tolerate bootstrap failure, socket close, malformed frame, and stale
   projection as visible states. It must not retry indefinitely, issue a command during hydration, or
   wait for an Agent.
3. **Projection/UI:** Semantic text and Canvas draw commands consume the same accepted snapshot. Icons,
   labels, and placeholders preserve causal meaning without making color or animation authoritative.
4. **Capability boundary:** This task records only the page's explicit human fallback. A browser's
   `document.modelContext` presence or absence is not WebMCP invocation evidence; CP-13 owns that probe.
5. **Operations:** The process uses an isolated temporary file-backed database and explicit fixture mode.
   The result says local browser only and does not prove an always-on host, production identity, or
   scheduler behavior.

## Smallest reversible action

Completed: run one browser context against the exact local fixture process, read the page's semantic
state and bootstrap/first-frame outcome, measure the Canvas surface, close the process, and attempt a
second named context. The second context shared the alpha cookie, so its isolation claim is explicitly
unverified. A small semantic correction renamed the transport badge from `Page capability` to
`Realtime capability`; the TDD Red/Green proof is recorded in the execution result below. This label
describes the realtime transport only and is not WebMCP evidence.

## Verification and closure target

- Minimum verification: an actual browser page load against `LOCAL_FIXTURE_MODE=1`, bootstrap and
  realtime readback for the expected fixture scope, semantic/Canvas status readback, and a negative or
  degraded-state check; the focused CP-12 fixture/projection/visual suites, typecheck, and both
  documentation validators passed. The exact browser readback is bound to [`SK-EVID-029`](../Evidence/SK-EVID-029-cp12-browser-hydration-runtime-verification.md).
- Closure target: `runtime_verified` for the exact one-browser-context scope executed under Node
  `v24.13.1`. This closure cannot claim the level-5 two-session slice; the missing independent context
  remains explicit and keeps that later gate open.
- Rollback or remediation: Disable the fixture process and preserve the prior visibly unsupported page
  state if a scope or first-frame invariant fails. Revert only task-scoped uncommitted edits; preserve
  all evidence and unrelated work.
- Reopen trigger: a browser receives another player's scope, the page derives identity or state from
  client input, a stale/closed channel is hidden, hydration requires a state-changing command or retry
  loop, two sessions share mutable client state, or a fix requires changing WebMCP, identity, scheduler,
  persistence, or contract authority.

## Execution result

- Page HTTP and hydration: passed at `http://127.0.0.1:3187/` with `readyState=complete` and title
  `Sleepless Kingdom`.
- Server scope and realtime: passed with `SK-MVP-0.2`, `sleepless-mvp-01`, `player-a`, `shelter-a`,
  `Connection: READY`, and `Realtime capability: supported`.
- Presentation: passed with authoritative world time `0`, Wood/Rock availability `1/1`, five resident
  mission rows, `aria-live="polite"`, Canvas `768x480`, `368640` non-transparent pixels, and checksum
  `148915293`.
- Two-session attempt: not independent; the second named Playwright session reused
  `fixture-v1-alpha`/`shelter-a`. No two-player privacy claim follows.
- Browser console: no hydration, React, WebSocket, or projection errors; only a non-blocking
  `/favicon.ico` 404 was observed.

## Corroborating in-app browser readback

- Runtime: Node.js `v26.5.0`, npm `11.17.0`, TypeScript `7.0.2`, React `19.2.8`, Next.js `16.3.4`,
  and `ws` `8.21.3`; explicit `NODE_ENV=test`, `LOCAL_FIXTURE_MODE=1`, and an isolated task-local
  SQLite path served `http://localhost:3000/`.
- Browser: Codex In-app Browser session `01a05e51-a22e-7922-bd7a-d6edcc82557b`, browser id `8`.
  The page reached `Connection: READY`, `Realtime capability: supported`, status
  `Authoritative server snapshot at world time 0.`, `shelter-a`, Wood/Rock `1/1`, five mission
  rows, and Canvas `768x480` with the accessible equivalent label. No page warning or error was read.
- Negative lifecycle: after the local process received `SIGINT`, the same page showed
  `Connection: CLOSED`, `The last server snapshot is stale; waiting for a full replacement.`,
  Wood/Rock `—/—`, and retained readable mission/history regions.
- Two-tab boundary: a second in-app tab reused the same browser profile and therefore also resolved
  `shelter-a`; no independent alpha/beta isolation claim was made. No cookie, player id, command, or
  WebMCP result was authored by the browser.
