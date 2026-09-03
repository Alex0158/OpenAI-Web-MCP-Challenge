# Visual Direction

**Status:** Owner-accepted preparation direction; final assets and polish remain open
**Authority:** [`../../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md`](../../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md)
**Parent design:** [`../04-visual-and-interaction-direction.md`](../04-visual-and-interaction-direction.md)

## Target

Sleepless Kingdom uses a low-detail magical top-down presentation for a fast browser game. The
visual reference borrows the readability and interaction density of simple survival `.io` games,
including Starve.io, but uses original shapes, colors, assets, and UI.

The player must recognize actors, roles, resources, shelter state, route, cargo risk, and fog-of-war
without depending on decorative detail or animation. Visual preparation may run beside the backbone;
CP-12 owns runtime integration.

## Direction rules

- Use flat color blocks, bold silhouettes, and a restrained one-pixel outline.
- Keep terrain quiet so actors and state markers remain the strongest visual layer.
- Use one base body per role and reuse it through color, tool, pack, cloak, or pose changes.
- Keep Shelter compact and map-readable: a tile footprint, a crystal, and a turret cue.
- Render effects separately from sprites so glow, damage, and selection can be disabled or changed.
- Do not bake text, ownership decisions, gameplay values, or hidden state into artwork.
- Keep visual state changes readable without animation; animation only reinforces the state.

## Semantic palette

| Meaning | Working color family | Use |
|---|---|---|
| Friendly | Warm amber | Player avatar, friendly soldiers, own Shelter, selected state |
| Hostile | Muted violet | Opposing actors, enemy Shelter tint, Monster |
| Wood | Brown | Wood node, Wood cargo, Wood icon |
| Rock | Pale stone gray | Rock node, Rock cargo, Rock icon |
| Terrain | Deep teal and moss | Walkable ground, foliage, path |
| Water | Muted blue | Non-walkable water shapes |
| System | Off-white and desaturated gray | Text, neutral controls, stale and disabled states |

Color is never the only carrier of a critical state. Pair it with a silhouette, icon, outline,
marker, or readable text in the React layer.

## Runtime-friendly target

The target is one Canvas world surface with four logical draw passes: terrain and fog, actors and
structures, state indicators, and optional low-cost effects. React owns HUD, mission, event, and
accessible status surfaces. The art lane does not require a full-screen background illustration,
per-entity DOM nodes, dynamic shadows, or a post-processing pipeline.

## Quality bar

A reference or prototype is accepted for preparation when it is recognizable at small browser scale,
consistent with the palette, and simple enough to redraw as a Canvas primitive or small atlas sprite.
If a detail obscures a route, role, resource, or state, remove it before adding polish.

## Non-goals

This document does not define gameplay balance, entity state transitions, combat outcomes, asset
licensing decisions for third-party material, or CP-12 integration code.
