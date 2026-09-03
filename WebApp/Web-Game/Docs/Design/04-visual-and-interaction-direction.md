# Visual and Interaction Direction

**Status:** ACCEPTED MVP visual direction; final assets and polish remain open

The visual reference is a readable 2D top-down world with simple terrain tiles, clear resource nodes,
recognizable monsters, visible actors, and a compact HUD. Starve.io is a gameplay reference for
resource survival, tool progression, open-world pressure, and a Canvas-like view; it is not a source
of copied assets, code, branding, or hidden backend assumptions.

The interface should make state legible at a glance: cargo risk, route progress, sensor range,
mission lock, shelter visibility, turret availability, cooldown, and the cause of the last event.
Visual effects can show migration fade and corruption without hiding the underlying state.

The lightweight asset vocabulary, layer split, placeholder rules, and parallel delivery boundary are
owned by [`06-visual-ui-and-asset-spec.md`](06-visual-ui-and-asset-spec.md). This direction fixes the
readability bar without requiring final art before the game backbone is verified.

## Smooth two-player presentation

The MVP uses a small sprite or tile atlas, a limited palette, and Canvas 2D rather than one DOM node
per actor. The server publishes authoritative `client_snapshot` projections at about 10 Hz; the client renders at up to
60 FPS with interpolation for remote actors and input prediction followed by reconciliation for the
local avatar. React owns controls, dashboard panels, and accessible status text while Canvas owns the
map projection. A dropped connection shows the last confirmed state and reconnect status; it never
lets the browser advance world time or resolve combat.
