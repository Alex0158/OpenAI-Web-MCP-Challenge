# CP-12 Original SVG UI Icon Runtime Cross-Functional Audit

## Identity

- Task: [`SK-TASK-039`](../Tasks/SK-TASK-039-cp12-original-svg-ui-icon-pack.md)
- Evidence: [`SK-EVID-027`](../Evidence/SK-EVID-027-cp12-original-svg-ui-icon-runtime-verification.md)
- Governing decision: [`ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md)
- Owning specification: [`06-visual-ui-and-asset-spec.md`](../Design/06-visual-ui-and-asset-spec.md)
- Source prototype: [`core-icons.svg`](../Design/Visual/prototypes/core-icons.svg)
- Contract: `SK-MVP-0.2`; no contract or schema revision
- Date: `2026-09-02`
- Disposition: **ACCEPTED FOR THE NAMED LOCAL REACT DASHBOARD ICON SCOPE**

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| Visual vocabulary | The registry preserves the eight accepted IDs and derives the shapes from the original prototype sheet. The IDs are visual references, not domain entity IDs. | Accepted; the inventory records the five icon groups as integrated and keeps actor/world sheets pending. |
| React projection | `GameProjection` consumes only `ProjectionViewModel` display data. Sensed Wood/Rock values are counts of visible projected nodes and are labelled as sensed nodes; no private quantity or client-derived game state is created. | Accepted; snapshot shape and server projection authority are unchanged. |
| Canvas boundary | No Canvas command, tile, actor, route, coordinate, interpolation, or draw ordering was changed. The icon layer is limited to low-count React/HTML surfaces. | Accepted under the Canvas/React split in ADR-GAME-0007 and ADR-GAME-0005. |
| Shelter/economy meaning | The coin icon sits beside the existing `Coins` label and server value. Wood/Rock icons sit beside `Sensed` summary labels and never imply inventory or settlement. | Accepted; the coin and cargo authority remains the existing server snapshot and deposit chain. |
| Mission meaning | Pickaxe, sword, and cargo cues are paired with visible `Gather`, `Hunt`, and `Cargo` text. The legend does not assign or mutate a role and does not replace the semantic mission rows. | Accepted; role/tool lock remains owned by CP-09/CP-11 server contracts. |
| Degraded state | A warning icon appears only for non-`READY` projection states and remains paired with the existing status message. Waiting, stale, invalid, and unsupported capability text is still readable. | Accepted; no unsupported capability is hidden behind artwork. |
| Accessibility | Decorative instances use `aria-hidden="true"`; the component supports an explicit labelled image mode. Critical status and resource meaning remains visible in HTML text. | Accepted for markup semantics; browser accessibility-tree and keyboard checks remain open. |
| Missing asset behavior | An unknown ID emits a visible warning-shaped fallback with deterministic metadata. It cannot silently appear as a valid icon. | Accepted; the fallback is presentation-only and does not hide an invalid snapshot or authorization failure. |
| Loading and performance | Icons are inline SVG and add no request, image loader, atlas, animation loop, or dependency. The count is bounded to the dashboard shell and CSS scales the 24 x 24 viewBox. | Accepted for local static scope; production FPS and population-scale DOM cost remain unmeasured. |
| Identity/session/agent handoff | No session resolver, connection ID, `ClientSnapshot`, command, identity binding, WebMCP, Signal, or Re-entry surface was touched. | Accepted; Task038 owner gate and CP-13/CP-14 boundaries remain intact. |
| Documentation truth | Parent visual specification, prototype README, asset inventory, Task039, Evidence027, Validation44, roadmap, status, and navigation links describe the same integrated icon scope. | Accepted after the documentation validator and link checks pass. |

## Invariants rechecked

- The server and worker remain the only authority for world time, positions, mission phases, cargo,
  encounters, revisions, visibility, events, and settlement.
- The icon registry is deterministic and replaceable; changing its geometry cannot change an event,
  entity identity, command result, snapshot field, or world transition.
- Text labels remain present for coins, sensed resources, mission cues, landmarks, and non-ready state;
  no critical meaning depends on color, SVG shape, or animation alone.
- Unknown icon names fail visibly, while malformed or stale snapshots continue through the existing
  projection model's explicit degraded states.
- The CP-12 projection tests remain green, so the visual consumer does not widen privacy or route
  visibility and does not cause predecessor mission/combat behavior to change.

## Verification disposition

The recorded tests, typecheck, static build, built-page asset readback, documentation validators, and
diff check support local level-4 evidence for the icon registry and one real React dashboard consumer.
The build proves compilation and page mounting only; it does not prove browser pixels, accessibility
tree output, Canvas performance, live session/bootstrap, genuine WebMCP, Re-entry delivery, hosted
continuity, or judge reproduction.

## Residual risks and reopen triggers

Reopen this audit if an icon becomes the only state cue, a resource summary starts using hidden
quantity or inventory semantics, a visual change requires snapshot or command data, the inline SVG
cost is measurable at the target population, actor/world art needs an atlas, or a live page/session
integration is required to keep the dashboard truthful.
