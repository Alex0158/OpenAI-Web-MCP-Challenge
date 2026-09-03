# CP-16 Independent Browser-Context Capability Runtime Cross-Functional Audit

**Status:** RUNTIME-VERIFIED FOR THE NAMED IAB TWO-TAB LIMITATION; INDEPENDENT TWO-SESSION PROOF REMAINS OPEN  
**Date:** 2026-09-03  
**Task:** [`SK-TASK-063`](../Tasks/SK-TASK-063-cp16-independent-browser-context-capability-probe.md)  
**Evidence:** [`SK-EVID-051`](../Evidence/SK-EVID-051-cp16-independent-browser-context-capability-probe.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)  
**Decisions:** [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md) and [`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)

## Audit question

Can the currently supported browser surface create two genuinely independent browser contexts for the
canonical local fixture, or does it expose only tabs whose scope cannot be distinguished from shared
profile state?

## Evidence boundary

- One fresh Node 24 local fixture process served the canonical page at `http://127.0.0.1:3194/`.
- Two newly created Codex In-app Browser tabs (`6` and `7`, browser id `2`) both reached the server-
  derived alpha projection and READY state.
- The browser API documentation and capability inventory exposed tab operations plus visibility,
  viewport, page-assets, and WebMCP capabilities; no context creation or isolation operation was
  available.
- Closing tab `6` left tab `7` readable and READY. No command or external capability was invoked.

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| Process and fixture | One entrypoint-owned worker, store, resolver, and realtime path reached `runtime_ready` with the accepted `SK-MVP-0.2` fixture. | Pass at local process level. |
| Browser surface | The selected IAB exposes `tabs.new()` but no documented browser-context creation/isolation primitive. | Limitation; no level-5 claim. |
| Server scope | Both tabs rendered `shelter-a`, Wood/Rock `1/1`, five `soldier-a-*` rows, position `16,64`, and `0 events`. | Pass for observed alpha readback; beta was not obtained. |
| Privacy | No foreign beta state appeared, but equal alpha readback cannot distinguish shared profile state from two independent contexts receiving the default handle. | Undecidable; independent privacy proof remains open. |
| Lifecycle | Closing tab `6` left tab `7` READY with the same current projection. | Pass for close-one/keep-one observation; not reconnect proof. |
| Authority and effects | No client identity, command, WebMCP call, second worker/store, or state mutation was introduced. | Pass. |
| Cleanup and evidence | Fixture stopped with `runtime_stopped`; tabs closed and no browser residue remained. | Pass for task-local cleanup. |

## Race, failure, and boundary review

| Risk | Control | Result |
|---|---|---|
| Shared profile mistaken for independent players | Require distinct server-derived alpha/beta scope and inspect the browser capability surface before claiming isolation. | Correctly gated; both tabs were alpha. |
| Client-selected identity workaround | Use the existing fixture bootstrap and first-frame path without query, body, cookie, or storage inspection. | No workaround used. |
| Private state crossover | Compare only page-visible mission, cargo, history, shelter, and resource fields. | No beta state observed; positive isolation not established. |
| Closing one context affects the world | Close one tab and reread the survivor. | Pass for surviving tab; worker remained healthy. |
| Hidden second authority | Keep one entrypoint-owned worker/store/resolver and perform no state-changing action. | Pass. |
| WebMCP/Re-entry overclaim | Keep capability, Agent, external delivery, and page action outside this probe. | Pass; no higher claim. |

## Decision

1. Accept `SK-TASK-063` at `runtime_verified` for the exact IAB two-tab limitation and close-one
   lifecycle observation.
2. Keep the independent two-session and CP-16 level-5 gate open until a browser surface can create
   genuinely independent contexts and produce distinct alpha/beta server scopes with privacy proof.
3. Do not add a browser polyfill, client identity selector, second resolver, or hidden test-only state
   to manufacture the missing result.
4. Continue other bounded work (external delivery handoff, hosted preparation, or judge evidence) with
   this limitation explicitly recorded; none may claim independent browser support.

## Exact conclusion

**The named local process and two-tab lifecycle are runtime-verified, but the Codex In-app Browser
surface does not provide a proven independent-context operation in this session. The CP-16 level-5
two-player isolation gate remains open.**
