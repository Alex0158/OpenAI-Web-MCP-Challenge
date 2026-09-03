# SK-TASK-039: CP-12 Original SVG UI Icon Pack

## Task Control

- Lifecycle state: `verified`
- Closure type: `integrated`
- Checkpoint: `CP-12`
- Owner: Game owner / visual lane
- Current increment: The accepted original SVG UI icon vocabulary is integrated into the existing React dashboard without changing projection semantics.
- Next gate: Preserve this visual boundary while the verified [`SK-TASK-038`](SK-TASK-038-cp12-local-fixture-session-and-initial-frame.md) result feeds the later browser and capability gates.

## Identity

- Task ID: `SK-TASK-039`
- Date: `2026-09-02`
- Risk profile: `Standard`
- Reason for profile: This is a reversible presentation change with one React consumer and no game-state authority, but an unstable asset vocabulary or inaccessible status treatment would create UI rework and obscure causal state.

## Objective

Make the current CP-12 dashboard visually clearer by using a small set of original, inline SVG icons
for coins, Wood, Rock, tools, cargo, landmark, and warning states while preserving the existing
server-owned projection and geometric Canvas placeholders.

## Success and non-goals

- Success: A typed icon registry exposes the stable visual asset IDs from the accepted visual
  specification and renders deterministic 24 x 24 SVGs derived from the original source prototypes.
- Success: The real `GameProjection` consumer uses icons alongside visible text for the shelter/resource
  summary, mission/tool cue, map landmark cue, and non-ready status; meaning never depends on color or
  SVG alone.
- Success: Unknown asset IDs fail visibly through a deterministic fallback, and icon markup remains
  screen-reader safe when a visible text label is present.
- Success: Focused visual tests, the existing CP-12 projection tests, typecheck, and documentation
  gates pass without changing `ClientSnapshot`, commands, identity, or session behavior.
- Non-goals: Canvas sprite atlas, actor animation, VFX timing, live session/bootstrap, gameplay state,
  WebMCP, Re-entry, production art, external assets, or a new dependency.

## Scope and authority

- In scope: `src/client/visual-icons.tsx`, the smallest `src/client/game-projection.tsx` and CSS changes
  needed for one dashboard consumer, `tests/cp12-visual-assets.test.tsx`, the package test script, and
  the visual asset inventory/readback.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, server/runtime/persistence code, projection shape,
  transport/session code, external image services, and unrelated dirty work.
- Allowed actions: Read and edit scoped game files, add focused tests and English documentation, run
  local checks, and install no dependency unless a measured existing runtime requires it. Do not stage,
  commit, push, deploy, use credentials, spend, or contact external parties.
- Revalidate when: an icon needs domain data not present in the snapshot, a Canvas atlas or animation
  path becomes necessary, the visual change affects interaction semantics, or a new dependency or
  contract is proposed.

## Owning authority

- Owning visual decision: [`../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md)
- Owning specification: [`../Design/06-visual-ui-and-asset-spec.md`](../Design/06-visual-ui-and-asset-spec.md) and [`../Design/Visual/03-asset-inventory.md`](../Design/Visual/03-asset-inventory.md)
- Rendering boundary: [`../Decisions/ADR-GAME-0005-mvp-world-and-rendering-profile.md`](../Decisions/ADR-GAME-0005-mvp-world-and-rendering-profile.md)
- Constraining projection: [`../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)
- Scenario: [`../Scenarios/12-cp12-canvas-dashboard-fixtures.md`](../Scenarios/12-cp12-canvas-dashboard-fixtures.md)

## Evidence status

- Verified: The accepted visual specification prefers SVG for low-count UI icons, defines stable IDs,
  requires text equivalents, and permits visual work to run beside the backbone. Original source
  prototypes already exist in `Docs/Design/Visual/prototypes/core-icons.svg`; this task now consumes
  the UI icon subset through an inline registry while actor and world surfaces remain geometric.
- Verified: [`SK-EVID-027`](../Evidence/SK-EVID-027-cp12-original-svg-ui-icon-runtime-verification.md)
  and [`Validation/44`](../Validation/44-cp12-original-svg-ui-icon-runtime-cross-functional-audit.md)
  cover the typed inline registry, the real dashboard consumer, accessible markup, visible fallback,
  static build, projection regression, and documentation closure.
- Inferred: Inline SVG is the smallest integration format for the current React dashboard because it
  avoids image loading, atlas setup, and a new asset pipeline while keeping the source original and
  replaceable.
- Unknown: Whether later Canvas sprite integration will require an atlas or measured browser asset
  loading; that belongs to a later visual task and cannot expand this increment.

## Smallest reversible action

The Red tests exposed the missing registry and accessibility contract. The Green change adds only the
registry, one dashboard consumer, bounded CSS, and the visual readback; the existing geometric Canvas
draw path remains unchanged.

## Verification and closure target

- Minimum verification: `npm run test:cp12-visual`, `npm run test:cp12-projection`, `npm run typecheck`,
  `npm run build`, `python3 scripts/test_validate_game_docs.py`,
  `python3 scripts/validate_game_docs.py --root . --report`, and `git diff --check -- WebApp/Web-Game`.
  This minimum is complete for the named local scope; results are bound in [`SK-EVID-027`](../Evidence/SK-EVID-027-cp12-original-svg-ui-icon-runtime-verification.md)
  and [`Validation/44`](../Validation/44-cp12-original-svg-ui-icon-runtime-cross-functional-audit.md).
- Closure target: `integrated` for the React dashboard icon consumer; no Canvas asset, browser FPS,
  live session, hosted, WebMCP, Re-entry, or gameplay claim follows.
- Rollback or remediation: Remove only the task-owned icon module/import/CSS and restore the existing
  text/geometric presentation; preserve the accepted visual IDs and the server projection.
- Reopen trigger: an icon hides or changes state meaning, a visible label is removed, a missing asset
  silently renders success, the page requires a new authority or dependency, or Canvas integration is
  needed to satisfy the task.
