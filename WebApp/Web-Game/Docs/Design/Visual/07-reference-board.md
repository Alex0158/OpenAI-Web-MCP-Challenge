# Visual Reference Board

**Role:** Curated visual reference register
**Status:** Active preparation; reference approval is per entry
**Owner:** Visual lane with game owner review

This file records the visual references that guide Sleepless Kingdom. It is a design aid, not a
runtime asset manifest. The reference board may contain original generated studies, screenshots used
for layout comparison, and approved style references. It must not imply that another game's artwork,
logo, UI, or character design is being copied.

## Reference entry format

Each accepted entry records:

- reference ID and title;
- status: `candidate`, `approved`, `retired`, or `replaced`;
- source file or URL and capture date when applicable;
- the visual decisions it informs;
- the elements explicitly excluded from implementation; and
- the related visual specification or asset IDs.

## Current references

### REF-001 — Low-detail magical top-down browser screen

- Status: `candidate`
- Source: Sleepless Kingdom generated visual study from the 2026-09-02 design session; the image is
  kept outside the repository until the owner approves a repository copy.
- Informs: flat terrain, compact shelters, semantic ally/enemy colors, simple resource silhouettes,
  fog-of-war blocks, route indicators, and sparse HUD panels.
- Excluded: ornate shelter architecture, dense terrain texture, decorative particles, complex
  lighting, and unreadable micro-detail.
- Related specification: `Visual Direction v0.2` and the CP-12 placeholder asset set.

### REF-002 — Low-detail role and tool sprite sheet

- Status: `candidate`
- Source: Sleepless Kingdom generated visual study from the 2026-09-02 design session; the image is
  kept outside the repository until the owner approves a repository copy.
- Informs: Player Explorer, Gatherer, Hunter, and Violet Nightling silhouettes; pickaxe and sword
  role cues; shared body base; and the idle, travelling, work, patrol, and combat pose language.
- Excluded: baked glow, complex armor, high-frame animation, and role-specific gameplay rules.
- Related specification: `02-art-bible.md`, `04-sprite-and-icon-spec.md`, and the CP-12 actor asset set.

### REF-003 — Low-detail structure and resource sheet

- Status: `candidate`
- Source: Sleepless Kingdom generated visual study from the 2026-09-02 design session; the image is
  kept outside the repository until the owner approves a repository copy.
- Informs: compact Shelter footprint, friendly/hostile crystal tint, active/disabled Turret cue,
  Wood and Rock node silhouettes, and available/depleted state treatment.
- Excluded: ornate architecture, baked lighting, damage particles, and any asset-driven collision or
  sensing geometry.
- Related specification: `02-art-bible.md`, `03-asset-inventory.md`, and the CP-12 structure/resource set.

## Curation rules

- Store only selected references under `references/approved/` after owner approval.
- Keep exploratory or superseded studies under `references/candidates/` when their history is useful.
- Link each stored image from this register with a stable relative path.
- Do not use a reference image as a runtime asset without an explicit asset-inventory entry and
  export specification.
