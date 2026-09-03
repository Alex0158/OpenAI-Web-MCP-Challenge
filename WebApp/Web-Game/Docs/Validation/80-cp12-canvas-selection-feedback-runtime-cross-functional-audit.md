# CP-12 Canvas Selection Feedback Runtime Cross-Functional Audit

**Status:** LOCAL SELECTION FEEDBACK INTEGRATED; AUTHORITATIVE AND EXTERNAL BOUNDARIES UNCHANGED  
**Date:** 2026-09-03  
**Task:** [`SK-TASK-067`](../Tasks/SK-TASK-067-cp12-canvas-selection-feedback.md)  
**Evidence:** [`SK-EVID-054`](../Evidence/SK-EVID-054-cp12-canvas-selection-feedback-runtime-verification.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)  
**Visual authority:** [`ADR-GAME-0007`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md)  
**Projection authority:** [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)

## Audit question

Does the human GATHERER form give immediate, readable selection feedback in Canvas while preserving
the server snapshot as the only gameplay authority and keeping invalid or stale selections harmless?

## Evidence boundary

- The resolver and overlay were implemented on branch `main` after `HEAD 0f42f1c`; no `src/server/`,
  `src/shared/`, persistence, worker, realtime, or external files changed.
- Focused visual tests passed `10/10`, projection tests passed `5/5`, Node 24 typecheck passed, and the
  optimized Next.js build passed.
- A fresh local entrypoint at port `3197` served one Playwright browser context. Selecting
  `soldier-a-01` and `node-wood-a` displayed the soldier and target rings at 1280 x 900 and 390 x 844;
  exact document/client widths were `390/390`, Canvas was `308 x 192.5`, and console errors/warnings
  were zero.
- This is ladder level `2` for the deterministic visual contract. It does not prove a new gameplay
  state, HUNTER dispatch, protected-start/migration state, combat, WebMCP, Re-entry, two sessions,
  hosted continuity, final art, or population-scale performance.

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| Selection source | The two IDs originate in the existing labelled React comboboxes and are passed only to a presentation resolver. | Pass. |
| Projection authority | Resolver searches the already validated `view.actors` and `view.resourceNodes`; it does not inspect raw server state or invent entities. | Pass. |
| Valid state | `AT_SHELTER` resident soldier plus `AVAILABLE` sensed Wood/Rock target resolve to cloned projected positions. | Pass. |
| Invalid/stale state | Empty IDs, field/defeated soldiers, missing entities, and depleted targets resolve to null and draw no ring. | Pass in focused tests. |
| Draw order | Solid soldier ring and dashed target ring are drawn after the existing clear/tile/resource/route/actor commands; off-viewport positions are clipped. | Pass. |
| Semantic UX | Mission rows, labels, status text, and dispatch policy remain unchanged and explain the selected entities without relying on Canvas color. | Pass. |
| Command behavior | No dispatch or movement request is triggered by selection; expected revisions and command payloads remain untouched. | Pass by source boundary and no-command readback. |
| Scope/privacy | Only already scoped projection collections are queried; hidden or foreign entities cannot be selected by this helper. | Pass by boundary. |
| Responsive/lifecycle | Wide and narrow browser readback retained selected IDs, no overflow, and clean browser/process shutdown. | Pass for named local sizes. |
| External boundaries | No WebMCP, Agent Signal, Re-entry, Receiver/Connector, hosted, or Eddy branch surface was invoked or changed. | Open by design. |

## Race and failure review

| Risk | Control and result |
|---|---|
| Selection outlives a snapshot | Existing scope-change and choice validation clear stale form IDs; the resolver additionally requires current `AT_SHELTER`/`AVAILABLE` projection state. **Controlled.** |
| Ring becomes gameplay authority | Overlay consumes local IDs and cloned positions only; server command eligibility remains in `resolveGathererDispatchSelection`. **Controlled.** |
| Hidden entity leak | Resolver cannot access anything outside the validated view arrays; no raw world lookup or client identity selector exists. **Controlled.** |
| Ring obscures a critical state | It is supplemental, uses a thin clipped stroke, and the existing text rows/labels remain the semantic source. **Controlled for the named surface.** |
| Narrow viewport clips controls | Exact width equality and Canvas bounds passed at 390 x 844; no browser error/warning appeared. **Controlled for tested viewport.** |
| Visual work expands into new contract | No snapshot field, asset loader, timer, renderer, server, or shared contract was added. **Controlled.** |

## Audit decision

1. Accept `SK-TASK-067` as integrated for the named local selection feedback surface.
2. Keep the selected cue presentation-only; do not use it as evidence of dispatch, movement, role,
   target ownership, or any server mutation.
3. Preserve the explicit claim limits for final art, animation/VFX, protected/migration state, combat,
   independent sessions, WebMCP, Re-entry, hosted continuity, and scale.
4. Reopen if selection crosses into a command contract, can reveal non-projected state, survives a scope
   replacement, causes overflow, or becomes the only accessible meaning of a critical state.

**Exact conclusion:** The human GATHERER workflow now has readable Canvas selection feedback for the
current projected resident soldier and available resource target. Invalid selections fail closed, the
semantic dashboard remains authoritative, and all tested local UX/lifecycle checks pass at ladder level 2.
