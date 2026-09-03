# Visual Source Prototype Pack

**Status:** Preparation source; the CP-12 UI icon vocabulary is consumed by an inline registry; actor and world sheets remain not runtime-integrated
**Revision:** 0.1
**Date:** 2026-09-02
**Owner:** Visual lane with game owner review
**Parent specification:** [`../../06-visual-ui-and-asset-spec.md`](../../06-visual-ui-and-asset-spec.md)
**Asset ledger:** [`../03-asset-inventory.md`](../03-asset-inventory.md)

This directory contains small, original SVG source prototypes for the first Sleepless Kingdom
visual slice. They are hand-authored from the accepted low-detail direction and are intended to
make the Canvas and React handoff concrete before CP-12. They are not gameplay code, final art, or
runtime assets.

## Pack contents

| File | Contents | Working geometry |
|---|---|---|
| [`core-actors.svg`](core-actors.svg) | Player, Gatherer, Hunter, and seeded Monster states | 32 x 32 transparent cells; actor anchor near `(16, 28)` |
| [`core-world.svg`](core-world.svg) | Grass, path, fog, Shelter, Wood, and Rock states | 32 x 32 cells; tile/object anchor at cell center |
| [`core-icons.svg`](core-icons.svg) | Wood, Rock, Pickaxe, Sword, Cargo, Coin, Warning, and Landmark icons | 24 x 24 transparent cells |

The sheets use semantic `data-asset-id` and `data-state` attributes so CP-12 can map a source
prototype to the stable inventory ID without inferring meaning from file position. Cell guides and
labels are intentionally absent from the artwork, so an export can be used as a clean source for an
atlas.

## Handoff rules

1. Open the SVG in a browser or SVG-capable editor to review silhouette and scale.
2. Preserve the stable asset ID and state names when exporting individual sprites or a PNG/WebP
   atlas.
3. Keep selection rings, route lines, sensor circles, cargo markers, combat flashes, and protected
   rings as separate Canvas overlays. They are not baked into the base sprite.
4. Do not copy these files into `public/assets/game/` until CP-12 chooses the export format and
   verifies them in the browser.
5. A final illustration may replace a prototype without changing the domain model, event names,
   entity IDs, or command contract.

These prototypes require no Pixel Animation application. If frame-by-frame work becomes useful,
the same cells can be imported into Aseprite or another SVG/PNG-capable editor later.
