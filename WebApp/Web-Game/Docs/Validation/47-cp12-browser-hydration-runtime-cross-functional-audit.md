# CP-12 Browser Hydration Runtime Cross-Functional Audit

## Identity

- Task: [`SK-TASK-040`](../Tasks/SK-TASK-040-cp12-browser-hydration-and-two-session-smoke.md)
- Evidence: [`SK-EVID-029`](../Evidence/SK-EVID-029-cp12-browser-hydration-runtime-verification.md)
- Challenge: [`Validation/46`](46-cp12-browser-hydration-and-two-session-preimplementation-challenge.md)
- Governing decisions: [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md) and [`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)
- Owning specifications: [`02-system-architecture.md`](../Engineering/02-system-architecture.md), [`05-api-and-webmcp.md`](../Engineering/05-api-and-webmcp.md), [`09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md), and [`12-cp12-canvas-dashboard-fixtures.md`](../Scenarios/12-cp12-canvas-dashboard-fixtures.md)
- Contract: `SK-MVP-0.2`; no contract, identity, or persistence schema revision
- Source state: `main`, `HEAD 4224f3a`, uncommitted working tree
- Runtime: Primary Node.js `v24.13.1` browser run on `127.0.0.1:3187`, corroborated by a Codex
  In-app Browser run on Node.js `v26.5.0` at `localhost:3000`; both use the same source and fixture
  boundary.
- Date: `2026-09-02`
- Disposition: **ACCEPTED FOR THE NAMED ONE-BROWSER-CONTEXT CP-12 RUNTIME SCOPE**

## Audit objective

Check that the canonical page can hydrate over the accepted local fixture boundary and render a
truthful server-owned projection in a real browser, without moving identity, world state, or capability
authority into the client. Keep the missing independent second context explicit instead of upgrading
one-session evidence into a two-player claim.

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| HTTP and page | The canonical page returned HTTP 200 and hydrated to the `Sleepless Kingdom` shell with no page or React hydration error. | Accepted for the named local browser scope. |
| Session identity | Bootstrap returned `SK-MVP-0.2`, `sleepless-mvp-01`, `player-a`, and `shelter-a` with an opaque alpha cookie; no URL or browser payload selected identity. | Accepted; the cookie is a local fixture adapter, not authentication. |
| Realtime first frame | The page reached `Connection: READY`, accepted the server snapshot, and exposed the authoritative world time `0`. | Accepted; first-frame scope remains server-derived. |
| Projection and privacy | The semantic dashboard showed `shelter-a`, Wood/Rock `1/1`, and five owned soldier rows. No foreign state was observed in the one executed context. | Accepted for alpha; beta privacy remains unverified because an independent context was unavailable. |
| Canvas rendering | The Canvas was `768x480` with a non-transparent, non-black pixel buffer and a deterministic checksum, proving the accepted snapshot reached the drawing surface. | Accepted for the named runtime; no FPS or visual-quality claim. |
| Accessible surface | The page exposed an `aria-live="polite"` status and text mission rows corresponding to the accepted projection. | Accepted for the read-only semantic surface; keyboard behavior remains open. |
| Lifecycle and fallback | Hydration issued no state-changing command and kept capability/status labels visible. The corroborating run also showed `CLOSED`, a stale replacement message, empty Wood/Rock placeholders, and readable mission/history regions after process shutdown. | Accepted; reconnect and process-loss browser behavior beyond this controlled close remain open. |
| Two-session boundary | A second named Playwright session reused `fixture-v1-alpha` and `shelter-a`; it was not an independent context. | Evidence limit recorded; no two-session or cross-player claim. |
| Capability boundary | This run proves neither `document.modelContext` discovery nor WebMCP invocation. The visible `Realtime capability` badge is transport status only. | Deferred to CP-13 and `SK-ISSUE-001`. |
| Operations | The exact local fixture process used Node 24.13.1 and a task-local database, then shut down cleanly. | Accepted as local runtime evidence; no hosted or always-on claim. |

## Invariants rechecked

- The browser consumed a server-derived bootstrap and realtime snapshot; it did not authoritatively
  choose a player, shelter, coordinate, world time, mission, cargo, or capability result.
- Bootstrap and WebSocket admission used one fixture resolver and one prepared store; no browser or
  page route created a second worker, store, gateway, identity map, or command queue.
- Canvas and semantic output consumed the same accepted projection; the non-empty pixel readback did
  not become a new state source.
- No command, scheduler, Agent Signal, WebMCP registration/invocation, Re-entry delivery, or hosted
  identity behavior was introduced or inferred.
- The lack of an independent second browser context remains visible and is not treated as privacy
  evidence.

## Verification disposition

The focused CP-12 projection, visual, and fixture suites passed (5, 4, and 10 tests respectively),
TypeScript checking passed, and the documentation validators passed after synchronization. The Node 24
browser smoke returned the expected page/bootstrap response, accepted the first scoped snapshot, showed
the semantic mission/resource surface, and produced a non-empty Canvas pixel buffer. The corroborating
Codex In-app Browser run confirmed the same ready state and the controlled closed fallback after `SIGINT`.
This supports only the one-browser-context local scope in `SK-EVID-029`.

## Residual risks and reopen triggers

- Two independent browser sessions, alpha/beta privacy isolation, keyboard input, reconnect behavior,
  and browser process-loss fallback remain open and must be proved before any level-5 two-session claim.
- The favicon 404 should be repaired only as a small presentation task if it affects the demo; it does
  not block the accepted CP-12 authority path.
- Reopen this audit if the page accepts client-selected identity, a first frame bypasses scope
  validation, Canvas or semantic output diverges, a hydration command or retry loop appears, or a
  local browser result is used to claim WebMCP, Re-entry, hosted, or judge behavior.
