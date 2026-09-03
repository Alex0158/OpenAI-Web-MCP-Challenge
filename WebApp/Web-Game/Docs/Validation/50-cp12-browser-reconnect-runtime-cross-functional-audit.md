# CP-12 Browser Reconnect Runtime Cross-Functional Audit

**Status:** ACCEPTED FOR THE NAMED LOCAL MANUAL RECONNECT AND STALE-FALLBACK SCOPE  
**Date:** 2026-09-02  
**Task:** [`SK-TASK-043`](../Tasks/SK-TASK-043-cp12-browser-reconnect-and-stale-fallback.md)  
**Evidence:** [`SK-EVID-032`](../Evidence/SK-EVID-032-cp12-browser-reconnect-runtime-verification.md)  
**Decisions:** [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md) and [`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)

## Scope and verdict

This audit checks the explicit reconnect path across React lifecycle, bootstrap/session scope,
WebSocket ownership, projection retention, failure UX, server authority, and downstream CP-14/16
preparation. It accepts prompt close/failure/restart recovery at the named local browser scope. It does
not add an automatic retry loop, acceptance timeout, game command, identity schema, or external
capability.

**Verdict:** accept `SK-TASK-043` as `runtime_verified` for its bounded scope. Keep silent no-settle,
keyboard, independent two-session, positive WebMCP, Re-entry, scheduler, production identity, and
hosted claims separate.

## Cross-functional review

| Surface | Observed result | Disposition |
|---|---|---|
| Browser lifecycle | The rebuilt page reached `READY`, changed to `CLOSED` after process loss, stayed retryable after a failed reconnect, and returned to `READY` after restart plus one explicit action. | Accepted at local process/browser level. |
| Attempt ownership | The connection gate rejects a duplicate start while one attempt is pending, releases after first-frame or terminal failure, increments the token for the next attempt, and makes late callbacks fail current-attempt checks. | Accepted; no duplicate bootstrap/socket from rapid clicks and no stale callback mutation. |
| Session and privacy | Each attempt obtains a fresh server-derived bootstrap. Retained state survives only when contract/world/player/shelter scope is identical; a changed scope clears the old snapshot before a new frame. | Accepted for the explicit fixture boundary; no client identity authority. |
| Projection truth | World time, shelter, coins, map, missions, and history remain readable while stale. Wood/Rock sensor counts are hidden until a fresh full frame restores them. | Accepted; stale values are not presented as current sensing. |
| First-frame validation | The fresh projection remains pre-bound until a matching full frame supplies the server connection id; malformed, foreign, stale, or out-of-scope frames remain rejected by predecessor suites. | Accepted; no new wire message or validator bypass. |
| Failure UX/accessibility | `CLOSED` and stale wording are textual, the button has an accessible name, and `CONNECTING` disables duplicate activation. A prompt bootstrap failure returns to a retryable state. | Accepted for observed failures. |
| Game authority and effects | Reconnect sends no gameplay command and changes no world time, mission, cargo, coin, event, outbox, or settlement state. | Accepted; transport recovery remains projection-only. |
| CP-14/16 handoff | The canonical page is recoverable after process loss without changing identity, WebMCP, or Re-entry contracts. | Existing preparation remains valid; no external runtime claim follows. |

## Residual risks and decisions

1. A bootstrap request or first WebSocket frame that never settles can leave the page in
   `CONNECTING`, where the reconnect control remains disabled. This is outside the prompt
   failure/close path proven here. An acceptance deadline requires reopening `ADR-GAME-0029`; it must
   not be added as an undocumented timer.
2. Focused tests cover attempt ownership, scope retention, projection semantics, bootstrap/session
   negatives, and frame rejection. The full React/fetch/WebSocket composition is proven by the named
   browser run rather than a dedicated component harness.
3. Stale Canvas/map state and mission/history remain readable while the Wood/Rock count chips show
   `—`. Evidence and product copy must describe this split precisely.
4. Independent alpha/beta browser isolation remains open under `SK-TASK-042`; this task proves one
   same-scope reconnect only.

## Exact disposition

`SK-TASK-043` is accepted as `runtime_verified` for the local explicit reconnect path captured in
`SK-EVID-032`. The implementation changes no accepted game, persistence, identity, wire, WebMCP, or
Re-entry authority. Reopen this audit if any named lifecycle or scope boundary changes, or if an
acceptance timer becomes necessary.
