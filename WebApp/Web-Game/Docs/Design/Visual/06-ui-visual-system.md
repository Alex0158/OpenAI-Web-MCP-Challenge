# UI Visual System

**Status:** Working preparation specification; CP-12 UI icon cues are integrated and the remaining runtime surfaces stay open
**Parent design:** [`../06-visual-ui-and-asset-spec.md`](../06-visual-ui-and-asset-spec.md)

React/HTML owns readable controls and status. Canvas owns the world projection. The UI must make the
same state visible in text so a player is not forced to infer a result from artwork or animation.

## Surface layout

The first browser surface uses four functional zones:

1. **Top HUD:** coins, Wood, Rock, world time, and connection state;
2. **Mission panel:** soldier ID, role, tool, target, phase, cargo, ETA, risk, and next valid action;
3. **Event panel:** causal history for extraction, encounter, combat, death, cargo loss, respawn,
   deposit, and Re-entry results; and
4. **Command strip:** inspect, dispatch, recall, and demo controls available for the current revision.

The zones may be visually compact, but they must not become a collection of one DOM node per world
actor. World actors remain in Canvas.

## State presentation

- `starting`, `degraded`, and `draining` are persistent status chips with plain text.
- `ready` shows process connectivity separately from world readiness once persistence exists.
- A stale or reconnecting projection preserves the last confirmed state and explains the limitation.
- Unsupported WebMCP capability is visible as a capability result, never disguised as a successful
  action.
- Cargo risk, mission phase, and next valid action have both icon and text treatment.

## Typography and controls

Use a compact system sans-serif with high contrast, generous hit targets, and no text baked into
sprites. Controls should remain usable on a narrow desktop viewport without hiding the world surface.
Icons support scanning; labels and status text carry the accessible meaning.

## Visual restraint

Use dark translucent panels, thin outlines, flat fills, and one accent color per state. Avoid ornate
frames, animated background decoration, dense gradients, and persistent particle effects. A UI detail
is removed when it competes with the route, sensor circle, cargo icon, or causal event.

## Integration boundary

This document prepares the UI language and state presentation only. It does not own gameplay commands,
world authority, WebMCP registration, event ordering, or persistence. CP-12 may integrate the prepared
surfaces after the authoritative `client_snapshot` and read models are available.
