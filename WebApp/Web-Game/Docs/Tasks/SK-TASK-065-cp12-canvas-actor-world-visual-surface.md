# SK-TASK-065: CP-12 Canvas Actor and World Visual Surface

## Task Control

- Lifecycle state: `verified`
- Closure type: `integrated`
- Checkpoint: `CP-12`
- Owner: Game owner / visual lane
- Current increment: The named G2 Canvas actor/world primitive surface is integrated and locally verified under [`SK-EVID-052`](../Evidence/SK-EVID-052-cp12-canvas-actor-world-visual-surface-runtime-verification.md) and [`Validation/78`](../Validation/78-cp12-canvas-actor-world-visual-surface-runtime-cross-functional-audit.md); focused mapping/projection tests, typecheck, build, and wide/narrow browser readback are green.
- Next gate: No further gate for this named local primitive surface. Final atlas/art states, performance at population scale, hosted continuity, WebMCP, Re-entry, and independent-session evidence remain separate gates.

## Identity

- Task ID: `SK-TASK-065`
- Date: `2026-09-03`
- Risk profile: `Standard`
- Reason for profile: This is a reversible client presentation change with no new authority or data contract, but incorrect state mapping could obscure role, cargo risk, fog, or causal gameplay during the competition demonstration.

## Objective

Replace the generic Canvas circles and flat cells with a small, deterministic primitive visual
surface that makes the accepted G2 world readable at a glance: terrain and fog, Wood and Rock,
Shelter, player, GATHERER, HUNTER, and the seeded Monster. The visual surface must continue to draw
only the server-owned `client_snapshot` projection and existing draw commands.

## Success and non-goals

- Success: Each named Canvas actor and resource maps to a stable silhouette and semantic state cue; role/tool and cargo remain distinguishable without relying on color alone.
- Success: Explored terrain, blocked cells, routes, resource depletion, actor state, and cargo risk remain deterministic for the same draw-command list.
- Success: The map remains readable in the existing bounded viewport on narrow and wide layouts, with no per-actor DOM nodes, image-loading dependency, animation loop, or frame-blocking effect.
- Success: The accessible React mission rows, event history, controls, snapshot validation, and server authority remain unchanged in meaning.
- Success: Focused visual tests, affected projection tests, typecheck, build, documentation validation, and one local browser readback pass.
- Non-goals: New gameplay state, snapshot fields, asset pipeline or atlas, external images, animation timing, VFX, responsive layout redesign, WebMCP, Re-entry, hosted behavior, PvP, siege, or balance changes.

## Scope and authority

- In scope: `src/client/game-projection.tsx`, `src/client/canvas-visuals.ts`, the focused tests under `tests/`, the task-owned favicon and layout alignment needed for clean visual readback, the visual asset inventory/readback, and this task's evidence and validation records.
- Out of scope: `src/server/`, `src/shared/`, persistence, worker cadence, realtime transport, session identity, `reentry-core/`, `mvp/`, RightSpot, Eddy's branch, external services, and unrelated dirty work.
- Allowed actions: Read and edit exact Game paths, add contract-level visual tests and English evidence, run focused local checks and a browser smoke, and commit only the Game scope after closure. No push, merge, deployment, credentials, spend, or external communication.
- Revalidate when: a visual state needs a new snapshot field, a source atlas or loader is introduced, interaction semantics change, Canvas cost is measured above the target budget, or a visual cue would become the only accessible meaning.

## Owning authority

- Owning visual decision: [`../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md)
- Owning specification: [`../Design/06-visual-ui-and-asset-spec.md`](../Design/06-visual-ui-and-asset-spec.md) and [`../Design/Visual/01-visual-direction.md`](../Design/Visual/01-visual-direction.md)
- Rendering boundary: [`../Decisions/ADR-GAME-0005-mvp-world-and-rendering-profile.md`](../Decisions/ADR-GAME-0005-mvp-world-and-rendering-profile.md)
- Constraining projection: [`../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)
- Scenario: [`../Scenarios/12-cp12-canvas-dashboard-fixtures.md`](../Scenarios/12-cp12-canvas-dashboard-fixtures.md)

## Evidence status

- Verified: The accepted visual contract assigns terrain, fog, resources, Shelter, actors, routes,
  and low-cost effects to one Canvas and keeps semantic controls and text equivalents in React.
- Verified: The current renderer already receives deterministic `CanvasDrawCommand` values for the
  bounded viewport, resources, routes, and actors; no new gameplay input is needed for the named
  visual states.
- Inferred: Canvas primitives are the smallest integration format for this increment. They consume
  no network asset, do not create an asynchronous loader, and keep the original SVG prototypes as
  replaceable visual references until a measured atlas is justified.
- Unknown: Pixel-level quality across every device, production population-scale FPS, final art,
  animation, and genuine browser accessibility-tree output remain outside this increment.

## Smallest reversible action

Add pure visual-state mapping and focused deterministic assertions first. Replace only the generic
draw branches with small primitive helpers and preserve the existing command order, viewport, route
geometry, and text dashboard. Stop if the change requires a new projection field, a second renderer,
client-derived state, or an animation clock.

## Verification and closure target

- Minimum verification: focused Canvas visual tests, `npm run test:cp12-projection`, `npm run typecheck`,
  `npm run build`, `python3 scripts/test_validate_game_docs.py`,
  `python3 scripts/validate_game_docs.py --root . --report`, `git diff --check -- WebApp/Web-Game`,
  and one local browser readback at narrow and wide viewport sizes.
- Closure target: `integrated` for the named local Canvas primitive surface only; no browser FPS,
  hosted, WebMCP, Re-entry, or final-art claim follows.
- Rollback or remediation: remove only the task-owned visual helpers, mapping, and style/test/readback
  changes; retain the prior generic renderer and all server/projection behavior.
- Reopen trigger: a visual state is ambiguous, color becomes the sole critical cue, draw commands or
  scope change, a browser surface overflows or blocks input, or a new asset/animation/contract path is required.

## Execution result

- Added deterministic visual mapping for fog/grass/blocked tiles, Wood/Rock availability, player,
  Shelter, GATHERER, HUNTER, Monster, cargo, and defeated cues without adding snapshot fields or a
  second renderer.
- Replaced the generic Canvas circles and flat cells with small original primitives while preserving
  clear, tile, resource, route, and actor command order. React mission rows, controls, text
  equivalents, and server-owned projection meaning are unchanged.
- Added the task-owned `app/icon.svg` and grid alignment adjustment so the local page has no favicon
  request noise and the map card does not stretch into unused vertical space.
- Browser readback at 1280 x 900 and 390 x 844 showed the named surface with no horizontal overflow;
  the same page retained READY state, Wood/Rock summary, mission rows, and human controls.

## Verification and closure

- `npm run test:cp12-visual`: 8/8 passed.
- `npm run test:cp12-projection`: 5/5 passed.
- `npm run typecheck`: passed.
- `npm run build`: passed with Next.js 16.3.4 and Node.js 24.20.0.
- `python3 scripts/test_validate_game_docs.py` and `python3 scripts/validate_game_docs.py --root . --report`: passed after the closure records were written.
- `git diff --check -- WebApp/Web-Game`: passed; no `src/server/` or `src/shared/` path changed.
- The exact evidence and cross-functional review are recorded in [`SK-EVID-052`](../Evidence/SK-EVID-052-cp12-canvas-actor-world-visual-surface-runtime-verification.md) and [`Validation/78`](../Validation/78-cp12-canvas-actor-world-visual-surface-runtime-cross-functional-audit.md).

This task is `integrated` for the named local Canvas primitive surface. It does not close final art,
atlas export, animation/VFX, population-scale performance, independent browser contexts, WebMCP,
Re-entry, hosted continuity, or judge reproduction.
