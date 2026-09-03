# ADR-GAME-0007: MVP Visual Assets and Parallel Delivery Boundary

**Status:** ACCEPTED MVP DESIGN BOUNDARY; FINAL ASSETS OPEN  
**Date:** 2026-09-02  
**Decision owner:** Game owner with engineering recommendation

## Context

The accepted MVP needs a readable, smooth, minimal top-down presentation. It does not need a full
production art pipeline before the world worker, persistence, and Re-entry proof are real. The owner
accepted a reasonable visual bar, simple effects, and parallel art work that must not delay the game
backbone.

The rendering profile in ADR-GAME-0005 already assigns the world projection to Canvas 2D and the
controls and readable status to React. This decision adds the asset vocabulary and delivery boundary
needed to keep those two layers coordinated without making artwork an authority or release blocker.

## Decision

1. **Quality bar.** The G2 surface must be recognizable, visually consistent, readable at a glance,
   and smooth on the target desktop browser. It does not require final illustration, elaborate
   animation, or a complete effects library. A coherent limited palette and clear state changes are
   more important than asset count.
2. **Rendering split.** Canvas owns terrain, fog, resource nodes, shelters, actors, and lightweight
   world effects. React/HTML owns HUD, mission rows, event history, Agent status, controls, and
   accessible text equivalents. SVG is preferred for small UI icons; a raster PNG/WebP sprite atlas
   is preferred for repeated Canvas tiles, actors, and animation frames.
3. **Stable vocabulary.** The asset IDs, visual states, and placeholder rules in
   [`../Design/06-visual-ui-and-asset-spec.md`](../Design/06-visual-ui-and-asset-spec.md) are the
   shared interface between visual work and the renderer. An asset may change without changing a
   domain event, entity identity, or command contract.
4. **Parallel lane.** Visual specification can proceed immediately. Placeholder geometry and a small
   representative asset pack may be produced alongside CP-04 through CP-11 after the implementation
   lock. Backbone work may use placeholders, and asset work may consume only `client_snapshot` projections
   and documented read models. CP-12 integrates the visual pack with the Canvas and dashboard.
5. **Effect budget.** G2 effects are limited to short, optional cues such as extraction pulse, hit
   flash, death marker, respawn cue, protected-start ring, and reconnect/stale-state overlays.
   Effects may be disabled for reduced motion or performance without changing gameplay state.
6. **Fallback.** Every required visual has a deterministic placeholder: colored tile, geometric
   actor, text label, or icon. Missing art never blocks a playable trace, changes authoritative state,
   or causes the browser to invent an outcome.

## Alternatives considered

### Art-first implementation

Building the complete character and environment set before the worker and state contracts would make
visual uncertainty block the highest-risk authority and recovery work. It is rejected for G2.

### No visual specification

Letting each implementation surface invent names, states, and colors would create an inconsistent HUD,
unstable asset references, and rework when the `client_snapshot` contract settles. It is rejected.

### SVG for every world actor

SVG is useful for crisp UI icons, but a shared Canvas atlas gives the first slice a simpler draw and
animation path for repeated tiles and actors. SVG remains available for low-count overlays when the
measured browser cost is acceptable.

## Consequences

The core team can prove time, missions, combat, persistence, and Re-entry with geometric placeholders
while a visual lane improves the presentation. The player still receives a coherent world instead of
an unfinished collection of unrelated icons. Asset IDs and visual state names become a small review
surface between design and implementation, while final art direction remains tunable.

This does not approve copied Starve.io assets, branding, or code. It also does not claim that any
asset, renderer, animation, or browser performance target is implemented.

## Reopen triggers

Reopen this ADR if the accepted asset split prevents the required Canvas smoothness, if the visual
state vocabulary cannot represent a G2 causal event, if placeholders make the judge trace
unreadable, or if the owner chooses a different presentation direction.
