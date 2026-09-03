# CP-12 Mission Status Card Runtime Cross-Functional Audit

**Status:** LOCAL MISSION STATUS CARD PRESENTATION INTEGRATED; AUTHORITATIVE AND EXTERNAL BOUNDARIES UNCHANGED  
**Date:** 2026-09-03  
**Task:** [`SK-TASK-073`](../Tasks/SK-TASK-073-cp12-mission-status-card-hierarchy.md)  
**Evidence:** [`SK-EVID-060`](../Evidence/SK-EVID-060-cp12-mission-status-card-runtime-verification.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)  
**Visual authority:** [`ADR-GAME-0007`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md)  
**Projection authority:** [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)

## Audit question

Does the mission dashboard make the existing projected mission state scannable without creating a
second authority, changing commands, or weakening the text equivalent used when Canvas or visual
assets are unavailable?

## Evidence boundary

- The task-owned client and test changes were read back from Game `main` at `HEAD f6d3ae7` plus the
  listed working-tree diff. No `src/server/`, `src/shared/`, persistence, worker, realtime, WebMCP,
  Re-entry, RightSpot, Eddy, or external service path changed.
- The pure presentation suite passed `14/14`, the existing CP-12 projection suite passed `5/5`,
  Node 24 typecheck passed, and the optimized Next.js build passed.
- A fresh local fixture entrypoint at port `3198` reached `READY`. The default DOM contained five
  mission cards and five preserved canonical row text equivalents. At the temporary `390 x 844`
  browser size, CSS viewport width was `333`, document width was exactly `333`, and no card exceeded
  the document width. Browser error/warning logs were empty and shutdown completed cleanly.
- This is ladder-level `2` deterministic presentation evidence. It does not prove a new mission state,
  combat/breach visual, independent sessions, WebMCP, Re-entry, hosted continuity, final art, or scale.

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| Source of truth | `buildMissionStatusCards` reads only the already validated `view.missions` projection. It does not read raw persistence, browser time, or hidden entities. | Pass. |
| Field fidelity | Soldier ID, phase, role, tool, target, cargo quantity/capacity, cargo exposure, and next action are preserved from the existing mission shape; null values become explicit `Unassigned`, `None`, or `No exposed cargo`. | Pass. |
| Canonical text | The existing `buildAccessibleMissionRows` result remains attached to each list item through a text equivalent, so visual formatting cannot replace the semantic row. | Pass. |
| Mission order | Cards follow the existing projection order and use soldier ID as the stable React key; no sort or grouping was introduced. | Pass. |
| Phase and risk | Canonical `data-phase` and `data-cargo-risk` values remain available for styling, while phase/risk words are always visible. Color and borders are supplemental. | Pass. |
| Icon fidelity | Only existing `icon_pickaxe` and `icon_sword` IDs are used for tools that they represent. HAMMER, SIEGE_KIT, and null tools keep text without a false icon. | Pass. |
| Terminal/review context | Encounter cause and waiting-review reason are rendered only when present in the authoritative projection; no new inference or timer was added. | Pass. |
| Stale/invalid state | The existing projection model still returns an empty mission collection for invalid frames and preserves stale semantics; the card mapper cannot fabricate a card from an empty collection. | Pass by focused tests and source boundary. |
| Command authority | No card is interactive and no card value is passed to `resolveGathererDispatchSelection`; dispatch, expected revisions, route, cargo, and server commands are unchanged. | Pass. |
| Accessibility | The list remains an ordered semantic list, visible labels cover every critical field, icons are decorative, and the prior full row is referenced as text equivalent. | Pass for the named local readback. |
| Responsive layout | The card metadata collapses to one column below `520px`; long identifiers wrap; the tested narrow viewport had equal document/client widths and no overflow. | Pass for tested sizes. |
| Lifecycle/performance | Rendering is driven by the existing React projection memo path. No animation, polling, subscription, per-actor DOM expansion, or asset loader was introduced. | Pass. |
| External boundary | No WebMCP, Agent Signal, Re-entry, Receiver/Connector, hosted, independent-browser, or Eddy branch surface was invoked or changed. | Open by design. |

## Race and failure review

| Risk | Control and result |
|---|---|
| Card outlives a replaced snapshot | `missionCards` and the row map recompute from the same `view`; invalid or empty views produce no cards, and the existing projection status remains visible. **Controlled.** |
| Presentation invents gameplay | The mapper is a pure field formatter; cargo risk follows the existing `capacityUsed` rule and no phase transition or due time is derived. **Controlled.** |
| Visual cue becomes sole meaning | Phase, role, tool, target, cargo, risk, next action, and canonical row text are all DOM text. **Controlled.** |
| Unsupported role/tool misleads the player | Null values are explicit and unsupported tool icons are omitted rather than substituted. **Controlled.** |
| Long IDs cause narrow overflow | `min-width: 0`, `overflow-wrap: anywhere`, and the narrow readback kept document width equal to client width. **Controlled for tested sizes.** |
| Screen-reader duplication becomes confusing | The canonical row is a referenced text equivalent on each list item; visible fields remain concise and no icon carries an independent label. **Controlled for the named presentation; revisit if accessibility testing identifies verbosity.** |
| Visual work crosses into external integration | Scope excludes server/shared/reentry-core/mvp/RightSpot/Eddy paths and the diff contains only client/test/task records. **Controlled.** |

## Audit decision

1. Accept `SK-TASK-073` as integrated for the named local mission dashboard presentation.
2. Keep the existing validated mission projection and accessible row as the authority; cards remain a
   read-only presentation layer.
3. Preserve explicit claim limits for working/returning browser traces, combat/breach visuals,
   protected-start/migration state, final art, animation/VFX, independent sessions, WebMCP, Re-entry,
   hosted continuity, and population scale.
4. Reopen if card content changes command eligibility or mission state, exposes non-projected data,
   loses text equivalence, introduces a new contract field, overflows a supported viewport, or
   conflicts with the external handoff.

**Exact conclusion:** The human mission dashboard is now easier to scan while preserving server-owned
state, canonical accessible text, mission order, command behavior, and external boundaries. The tested
local presentation is integrated; the remaining gameplay, delivery, hosted, art, and scale gates stay
open.
