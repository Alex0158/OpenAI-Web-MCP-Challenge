# CP-12 Canvas Mission-State Readback Runtime Cross-Functional Audit

**Status:** LOCAL ONE-MISSION GATHERER VISUAL TRACE VERIFIED; INDEPENDENT, COMBAT, AND HOSTED GATES REMAIN OPEN  
**Date:** 2026-09-03  
**Task:** [`SK-TASK-066`](../Tasks/SK-TASK-066-cp12-canvas-mission-state-readback.md)  
**Evidence:** [`SK-EVID-053`](../Evidence/SK-EVID-053-cp12-canvas-mission-state-readback-runtime-verification.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)  
**Visual authority:** [`ADR-GAME-0007`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md)  
**Projection authority:** [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)

## Audit question

Does one real local GATHERER mission remain visually and semantically coherent from the ordinary
page dispatch through authoritative travel, extraction, cargo-risk/return presentation, and a narrow
Canvas layout, without changing gameplay authority or claiming an external Agent path?

## Evidence boundary

- One fresh `LOCAL_FIXTURE_MODE=1` and `AUTONOMOUS_WORLD_MODE=1` process ran at port `3196` over
  `tmp/runtime/sk-task-066-canvas-mission-fresh.sqlite`, with Node.js `v24.20.0`, branch `main`,
  base `HEAD 9994f4e`, and no source behavior changes during the readback.
- The page reached READY, accepted one existing ordinary `Dispatch gatherer` action, and returned
  a matching full snapshot. At world time `20` the mission was `TRAVELLING / GATHERER / PICKAXE /`
  `node-rock-a / cargo 0/5`; at world time `39` it was `RETURNING / GATHERER / PICKAXE / cargo 5/5`.
- The wide in-flight capture and narrow responsive capture are disposable corroboration. The narrow
  readback measured `document.scrollWidth=390`, `document.clientWidth=390`, and Canvas `308 x 192.5`.
  Browser console readback reported zero errors and zero warnings, and SIGINT produced a clean stop.
- This is ladder level `4` for one local process/browser path. It does not close two independent
  sessions, combat presentation, WebMCP, Re-entry, hosted continuity, public deployment, final art,
  or population-scale performance.

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| Command authority | The existing labelled page control issued one typed GATHERER command; the readback status appeared only after the authoritative result. | Pass for this local path. |
| Mission identity and role lock | The selected `soldier-a-01` remained the same identity and exposed `GATHERER` with `PICKAXE` from dispatch through travel and return. | Pass. |
| Route and position | The route shown by Canvas matched the server snapshot's Shelter-to-Rock mission target; no client route or elapsed time was accepted as authority. | Pass for observed states. |
| Canvas/React agreement | The orange GATHERER actor, pickaxe cue, route, and cargo presentation corresponded to the accessible mission row and status text. | Pass for the named visual trace. |
| Cargo and return | Repeated authoritative extraction reached `cargo 5/5` and `RETURNING`; the mission history exposed the auto-return cause and later home/deposit/coin events in the same fixture run. | Pass; no combat claim. |
| Responsive UX | The 390-pixel page kept Canvas and dashboard controls within the viewport and retained readable mission state. | Pass for the tested viewport. |
| Realtime/lifecycle | One entrypoint-owned process and worker served the page; the browser observed the full snapshot path and both browser/process shutdowns were clean. | Pass for this local lifecycle. |
| Privacy and scope | The visual readback used the existing scoped fixture snapshot and added no hidden actor, browser identity, or second-session state. | Pass by code boundary and observation. |
| External capability | No WebMCP adapter, Agent Signal, Re-entry delivery, Receiver/Connector, or hosted service was invoked. | Open by design; no external claim. |
| Source impact | No `src/`, server, shared, schema, worker, or renderer files changed for this readback. | Pass; docs/evidence only. |

## Cross-functional risk review

| Risk | Control and observed result |
|---|---|
| Canvas silently derives state | `game-projection.tsx` still consumes the accepted projection/draw-command model; the readback compared it with the same authoritative snapshot. **Controlled.** |
| Snapshot and mission row disagree during progression | The post-dispatch snapshot, mission row, route, role/tool, and cargo were read together at world times `20` and `39`. **No disagreement observed.** |
| Cargo risk is hidden visually | Cargo remained explicit in the dashboard (`5/5`, at risk); Canvas added a secondary pack/outline cue. **Controlled for the named state.** |
| Autonomous timing produces an unrepeatable claim | The fixture, seed, process, port, database, world times, and event history are recorded; cadence/performance are not claimed. **Bounded.** |
| Narrow layout blocks the human loop | Exact document/client widths and Canvas dimensions were measured after resize; console was clean. **Controlled for 390 x 844.** |
| Readback is mistaken for WebMCP/Re-entry | Evidence names those boundaries as absent and reports only ordinary page UI plus local runtime. **Controlled.** |
| Natural progression enters an untested state | The record stops the claim at the observed GATHERER travel/extraction/return path and explicitly excludes combat and larger populations. **Bounded.** |

## Audit decision

1. The existing CP-12 Canvas primitive baseline remains legible during one real local GATHERER mission,
   including dispatch acceptance, route/travel, role/tool lock, full-cargo return, and responsive layout.
2. The authoritative snapshot remains the sole gameplay source; Canvas and accessible React remain
   presentation surfaces over that snapshot.
3. The readback closes `SK-TASK-066` for its named ladder-level 4 local visual trace only. It does not
   advance independent-browser, combat-visual, WebMCP, Re-entry, hosted, final-art, or performance gates.
4. Reopen if a future change adds client-derived mission state, a new snapshot contract, a visual-only
   critical cue, layout overflow, or a mismatch between route/role/cargo and the accessible row.

**Exact conclusion:** The local ordinary GATHERER dispatch and its authoritative mission progression
were visually coherent in Canvas and the semantic dashboard through travel, extraction, full-cargo
return, and the tested narrow viewport. The result is local-only and does not claim external delivery,
independent sessions, combat, hosted continuity, final artwork, or scale.
