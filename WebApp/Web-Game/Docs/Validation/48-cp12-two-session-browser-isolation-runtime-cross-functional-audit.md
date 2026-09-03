# CP-12 Two-Session Browser Isolation Runtime Cross-Functional Audit

**Status:** RUNTIME AUDIT COMPLETE FOR LOCAL TWO-TAB LIMITATION; INDEPENDENT CONTEXT PROOF REMAINS OPEN  
**Date:** 2026-09-02  
**Task:** [`SK-TASK-042`](../Tasks/SK-TASK-042-cp12-independent-two-session-browser-isolation.md)  
**Evidence:** [`SK-EVID-031`](../Evidence/SK-EVID-031-cp12-two-session-browser-isolation-probe.md)  
**Challenge:** [`Validation/46`](46-cp12-browser-hydration-and-two-session-preimplementation-challenge.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)

## Scope and verdict

This audit reviews the two-tab browser observation against the accepted CP-12 fixture/session,
projection, visibility, and lifecycle boundaries. The result proves local page delivery and the
effect of closing one tab. It does not prove two independent browser contexts, beta delivery, or a
level-5 two-player slice.

**Verdict:** accept the named process-runtime limitation as evidence; keep the independent two-session,
keyboard, reconnect, WebMCP, Re-entry, scheduler, and hosted gates separate.

## Cross-functional review

| Surface | Observed result | Disposition |
|---|---|---|
| Process and fixture | One `LOCAL_FIXTURE_MODE=1` entrypoint reported `http_bound` and `runtime_ready` on port `3187`; fixture `sleepless-mvp-01` was server-prepared in a task-local database. | Accepted at local process level. |
| Browser hydration | Tabs `7` and `8` under browser id `8` both reached `Connection: READY`, world time `0`, and readable Canvas/semantic mission projections. | Accepted for two-tab delivery. |
| Scope and privacy | Both tabs showed server-derived `shelter-a`, Wood/Rock `1/1`, five `soldier-a-*` rows, and `0 events`; no beta state appeared. | No privacy leak observed, but no independent beta scope was obtained. |
| Context independence | The used In-app Browser API supplied tabs but no proven context-isolation operation; equal alpha readback cannot distinguish shared profile from two fresh default-alpha contexts. | Evidence limit; no level-5 claim. |
| Close-one lifecycle | Closing tab `7` left tab `8` READY with `shelter-a` and `0 events`. | Accepted as close-one/keep-one observation; not reconnect proof. |
| Authority and effects | No command, client identity override, second worker/store, WebMCP call, or external delivery was used. | Accepted; server authority remains intact. |
| Operations and claims | Local Node 26 process was stopped after the read-only probe. | No hosted, scheduler, WebMCP, Re-entry, or judge claim. |

## Required follow-up

1. Reopen or rerun this task when a browser surface can create genuinely independent contexts.
2. Prove alpha/beta bootstrap and first-frame scope, private projection absence, and cross-context
   lifecycle before calling the CP-12 slice level 5.
3. Keep keyboard/reconnect as the next separate CP-12 behavior task; do not infer it from a tab close.

## Exact disposition

`SK-TASK-042` is `runtime_verified` only for the named two-tab local observation and browser-context
limitation. The independent two-session gate remains open and no higher claim follows.
