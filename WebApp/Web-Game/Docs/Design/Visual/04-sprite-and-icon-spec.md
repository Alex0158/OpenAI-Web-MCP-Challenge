# Sprite and Icon Specification

**Status:** Working preparation specification; the CP-12 inline UI icon subset is integrated and Canvas/world integration remains future work
**Parent specification:** [`../06-visual-ui-and-asset-spec.md`](../06-visual-ui-and-asset-spec.md)

## Source and export

- Keep source artwork in a tool that can export SVG or PNG/WebP without baked UI text.
- Use SVG for low-count UI icons and a small PNG/WebP atlas for repeated Canvas actors, tiles, and
  animation frames.
- Keep one consistent atlas cell size within the first asset package. A 32 x 32 source cell is a
  working target, not a gameplay contract.
- Preserve transparent backgrounds for sprites. Do not export a full-screen background illustration
  for the world surface.
- Use a single documented smoothing rule when Canvas scales the atlas, with device-pixel-ratio
  handling in the renderer.

## Anchors and scale

- Place actor anchors at the feet or logical center so movement and selection rings remain stable.
- Place resource anchors at the node center and Shelter anchors at the footprint center.
- Keep the normal actor display near 16–24 CSS pixels when the MVP camera is at its default zoom.
- Keep the Shelter footprint aligned to the logical tile grid; do not use artwork to change collision
  or sensing geometry.
- A sprite may contain a role prop, but route, sensor, cargo, and system markers remain separate
  overlays.

## Animation limits

- Start with a still or two-frame idle if a larger animation would delay the causal trace.
- Keep the first walking, work, attack, hit, and death/respawn cues within two to four frames.
- Reuse frames between friendly and hostile tint variants where possible.
- Do not bake selection rings, magic glow, combat arcs, damage sparks, or fog into the base sprite.

## Icon rules

- Icons use one strong silhouette, one accent color, and an accessible text equivalent in React.
- A disabled icon changes outline or contrast as well as color.
- Resource and tool icons remain recognizable at 16, 20, and 24 CSS pixels.
- Do not place numeric values or mutable gameplay labels inside exported image files.

## Acceptance

A source pack is ready for handoff when the inventory entry, reference ID, dimensions, anchor, state
list, export format, and owner are recorded. CP-12 may adjust scale after a browser viewport test
without changing the visual vocabulary.
