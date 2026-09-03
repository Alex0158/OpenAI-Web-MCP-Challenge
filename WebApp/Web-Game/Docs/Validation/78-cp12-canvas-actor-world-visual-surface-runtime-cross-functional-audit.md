# CP-12 Canvas Actor and World Visual Surface Runtime Cross-Functional Audit

**Status:** LOCAL CANVAS PRIMITIVE BASELINE INTEGRATED; FINAL ART AND FULL VISUAL STATE COVERAGE REMAIN OPEN  
**Date:** 2026-09-03  
**Task:** [`SK-TASK-065`](../Tasks/SK-TASK-065-cp12-canvas-actor-world-visual-surface.md)  
**Evidence:** [`SK-EVID-052`](../Evidence/SK-EVID-052-cp12-canvas-actor-world-visual-surface-runtime-verification.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)  
**Visual authority:** [`ADR-GAME-0007`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md)  
**Projection authority:** [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)

## Audit question

Does the CP-12 visual increment make the existing server-owned G2 projection readable in Canvas while
preserving command order, privacy, accessible React meaning, and the separation between presentation
and gameplay authority?

## Evidence boundary

- The pure Canvas visual suite is 8/8 and the affected projection suite is 5/5 under Node.js
  `v24.20.0`. TypeScript typecheck and the Next.js production build pass.
- One local entrypoint-owned fixture process served the canonical page at port `3193`. Playwright
  readback passed at 1280 x 900 and 390 x 844 with no horizontal overflow, READY state, existing
  Wood/Rock sensing, five mission rows, human controls, and zero console errors or warnings after
  reload.
- The implementation uses original deterministic Canvas primitives. It does not load an atlas or
  external image, add a per-actor DOM node, add an animation clock, or introduce a second renderer.
- This audit is a local visual integration review. It does not close final art, atlas export, every
  inventory state, population-scale performance, independent browser contexts, WebMCP, Re-entry,
  hosted continuity, or judge reproduction.

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| Projection authority | `game-projection.tsx` still consumes only `buildProjectionViewModel` and `buildCanvasDrawCommands`; `canvas-visuals.ts` maps already-projected fields and adds no state. | Pass. |
| Draw order | The existing `clear`, tile, resource, route, and actor command order is preserved. Primitive helpers replace only the generic branch bodies. | Pass. |
| Terrain and fog | `resolveTileVisual` makes blocked, explored grass, and unexplored fog explicit; each has a separate fill/texture cue. | Pass for the named baseline. |
| Resources | `resolveResourceVisual` preserves `wood` versus `rock` and maps `DEPLETED` to a visible opacity/state cue; the silhouettes remain distinct. | Pass. |
| Actors and structures | Stable markers distinguish player rune, Shelter crystal/turret, GATHERER pickaxe, HUNTER sword, Monster eye, and neutral unassigned soldier body. | Pass for the named baseline. |
| Cargo and defeated state | Cargo changes the outline and adds a pack; `DEAD`, `DEFEATED`, and `*DEAD*` states receive a cross marker. The React mission row remains the text authority. | Pass; color is not the sole critical cue. |
| React/HUD semantics | Mission rows, connection/capability status, controls, event history, and text equivalents are unchanged in meaning and remain available when Canvas is absent. | Pass. |
| Accessibility | No critical result is conveyed only by a Canvas color; role/tool/cargo/state remain visible in the existing text rows and labels. | Pass for the changed surface; full accessibility-tree review remains open. |
| Responsive layout | The existing grid now aligns cards to their content and the tested wide/narrow pages have equal document/client widths with no horizontal scroll. | Pass for 1280 x 900 and 390 x 844. |
| Lifecycle and realtime | The renderer redraws the latest snapshot through the existing React effect. No timer, worker, websocket, reconnect, or backpressure policy changed. | Pass by code review and affected projection tests. |
| Authority and privacy | No server, shared, persistence, snapshot, session, or identity file changed. The Canvas cannot reveal data absent from the scoped `client_snapshot`. | Pass for the changed surface. |
| Browser noise | `app/icon.svg` removes the page favicon 404; the browser readback had zero errors and zero warnings after reload. | Pass. |
| External boundaries | WebMCP, Re-entry, Receiver/Connector, Agent, hosted runtime, and Eddy's branch remain untouched and unclaimed. | Open by design. |

## Race and failure review

| Risk | Control | Result |
|---|---|---|
| A presentation branch derives hidden state | Mapping reads only the existing projected command fields; no client-side discovery or identity is added. | Covered by source review and projection tests. |
| A new visual cue changes gameplay order | The helper is called inside the existing command loop; no server or worker path is imported. | Covered. |
| Color hides a critical role or loss | Role uses a tool silhouette, cargo uses a pack/outline, defeated uses a cross, and mission rows retain text. | Covered for the named baseline. |
| A dense page blocks input | The map remains one Canvas, the dashboard controls remain React elements, and wide/narrow readback shows no horizontal overflow. | Covered at two viewport sizes. |
| Canvas state becomes stale or races realtime | No new state cache, clock, or asynchronous loader was added; the existing snapshot effect remains the only redraw trigger. | Covered by composition; hosted/reconnect behavior remains outside this task. |
| Art work expands into a new authority | Source SVG prototypes remain preparation assets; the primitive baseline has no asset loader or domain contract. | Covered. |
| Final asset quality is mistaken for MVP proof | Evidence and inventory explicitly bound this result to the primitive baseline and list final art/atlas/population gates as open. | Covered. |

## Audit decision

1. `SK-TASK-065` satisfies the accepted CP-12 local Canvas presentation increment for the baseline
   G2 actors, Shelter, Wood/Rock, terrain, fog, cargo, and defeated cues.
2. The implementation preserves server-owned projection authority, command order, React semantic
   equivalents, and the no-per-actor-DOM/no-animation-loop rendering boundary.
3. The browser readback proves only the named local presentation at the two tested viewport sizes;
   it does not prove final artwork, atlas loading, high-population performance, or any external
   capability or hosted journey.
4. Reopen this audit if a new snapshot field, asset loader, animation clock, second renderer,
   interaction semantic, hidden-state derivation, or visual-only critical cue is introduced.

## Exact conclusion

**The CP-12 Canvas actor/world primitive baseline is integrated for the named local scope at ladder
level 2. Focused tests, typecheck, build, and wide/narrow browser readback pass. Server/gameplay,
WebMCP, Re-entry, hosted, independent-session, and final-art gates remain unchanged and open.**
