# Visual Documentation

**Role:** Preparation authority for the Sleepless Kingdom visual lane
**Status:** Active preparation; the CP-12 React UI icon subset and Canvas primitive baseline are integrated, while source atlas/final actor/world states remain open
**Governing decision:** [`../../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md`](../../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md)

This module records the visual direction, art vocabulary, asset specifications, motion limits, UI
visual system, and selected references. It supports parallel preparation without moving gameplay or
runtime authority into the art lane.

## Reading order

1. [`01-visual-direction.md`](01-visual-direction.md) — visual target, palette, and readability;
2. [`02-art-bible.md`](02-art-bible.md) — actor, structure, resource, and state vocabulary;
3. [`03-asset-inventory.md`](03-asset-inventory.md) — preparation status and handoff IDs;
4. [`04-sprite-and-icon-spec.md`](04-sprite-and-icon-spec.md) — dimensions, anchors, frames, and formats;
5. [`05-motion-and-effects.md`](05-motion-and-effects.md) — bounded animation and effect cues;
6. [`06-ui-visual-system.md`](06-ui-visual-system.md) — HUD, mission, event, and command surfaces; and
7. [`07-reference-board.md`](07-reference-board.md) — approved and candidate visual references;
8. [`prototypes/README.md`](prototypes/README.md) — source SVG prototypes prepared for CP-12 handoff.

The existing high-level design records remain the parent context:
[`../04-visual-and-interaction-direction.md`](../04-visual-and-interaction-direction.md) and
[`../06-visual-ui-and-asset-spec.md`](../06-visual-ui-and-asset-spec.md).

## Preparation and integration boundary

The parallel lane may create references, source artwork, low-detail sprite prototypes, palettes,
icons, and export metadata. It must not add gameplay states, change authority, or block CP-04 through
CP-11. CP-12 owns runtime integration into Canvas and React.

Reference files are curated separately from runtime assets. A candidate reference is not a product
asset, and a generated image is not accepted runtime evidence until an owner-approved entry records
its source, purpose, license or originality basis, and disposition. The integrated icon subset and
Canvas primitive baseline do not make the remaining source atlas, animation, population-scale, or
browser visual gates complete.
