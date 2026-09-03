# Asset Inventory

**Status:** Preparation ledger; CP-12 inline UI icon slice integrated; actor and world runtime implementation remains open
**Parent vocabulary:** [`../06-visual-ui-and-asset-spec.md`](../06-visual-ui-and-asset-spec.md)
**Direction:** [`01-visual-direction.md`](01-visual-direction.md)
**References:** [`07-reference-board.md`](07-reference-board.md)

This ledger tracks visual preparation and handoff. The parent asset specification owns the stable G2
renderer IDs. An entry here may be prepared before its runtime integration, but it must not change a
domain identity, gameplay state, event name, or command contract.

## Status values

- `reference_ready`: a reference or visual decision exists;
- `spec_ready`: export and state rules are defined;
- `prototype_pending`: the first source sprite or icon remains to be made;
- `integration_pending`: the asset is ready for CP-12; and
- `integrated`: CP-12 has verified it in the Canvas or React surface.

## G2 preparation ledger

| Asset ID | Category | Required states | Reference | Prototype source | Status | Handoff note |
|---|---|---|---|---|---|---|
| `avatar_player` | actor | idle, walking, exploring, resting | REF-002 | [`core-actors.svg`](prototypes/core-actors.svg) | `integration_pending` | Rune marker distinguishes player from soldiers |
| `soldier_gatherer` | actor | idle, travelling, working, returning, carrying, dead/respawn | REF-002 | [`core-actors.svg`](prototypes/core-actors.svg) | `integration_pending` | Backpack and pickaxe are the role cue |
| `soldier_hunter` | actor | idle, travelling, hunting, combat, returning, dead/respawn | REF-002 | [`core-actors.svg`](prototypes/core-actors.svg) | `integration_pending` | Short sword and scout stance are the role cue |
| `monster_seeded` | actor | patrol, alert, chase, attack, defeated | REF-002 | [`core-actors.svg`](prototypes/core-actors.svg) | `integration_pending` | One-eye violet silhouette |
| `shelter_player` | structure | stable, damaged, selected, protected ring, migration veil | REF-003 | [`core-world.svg`](prototypes/core-world.svg) | `integration_pending` | Friendly and opposing tint variants share the base shape; selection and ring remain overlays |
| `shelter_landmark` | landmark | discovered, stale if later needed | REF-001 | [`core-icons.svg`](prototypes/core-icons.svg) | `integration_pending` | Flag marker is a Canvas overlay; landmark icon is optional |
| `node_wood` | resource | available, selected, depleted | REF-003 | [`core-world.svg`](prototypes/core-world.svg) | `integration_pending` | Stump/log silhouette; selection highlight can remain an overlay |
| `node_rock` | resource | available, selected, depleted | REF-003 | [`core-world.svg`](prototypes/core-world.svg) | `integration_pending` | Three-rock cluster; depleted state uses fewer stones |
| `tile_grass` | terrain | normal | REF-001 | [`core-world.svg`](prototypes/core-world.svg) | `integration_pending` | Quiet flat tile |
| `tile_path` | terrain | normal | REF-001 | [`core-world.svg`](prototypes/core-world.svg) | `integration_pending` | Muted path cue only |
| `tile_fog` | visibility | hidden, explored edge | REF-001 | [`core-world.svg`](prototypes/core-world.svg) | `integration_pending` | Canvas mask, not a full-screen image |
| `icon_wood` / `icon_rock` | UI icon | normal, cargo, unavailable | REF-003 | [`core-icons.svg`](prototypes/core-icons.svg) | `integrated` | Inline SVG consumer in the CP-12 shelter sensing summary; text labels remain visible |
| `icon_pickaxe` / `icon_sword` | UI icon | normal, locked | REF-002 | [`core-icons.svg`](prototypes/core-icons.svg) | `integrated` | Inline SVG mission tool cues; role/tool text remains visible |
| `icon_cargo` / `icon_coin` | UI icon | normal, at risk, deposited | REF-001 | [`core-icons.svg`](prototypes/core-icons.svg) | `integrated` | Inline SVG dashboard cues with visible text equivalents |
| `icon_warning` | UI icon | normal | REF-001 | [`core-icons.svg`](prototypes/core-icons.svg) | `integrated` | Inline SVG non-ready status cue with the existing readable status message |
| `icon_landmark` | UI icon | normal, discovered | REF-001 | [`core-icons.svg`](prototypes/core-icons.svg) | `integrated` | Inline SVG map legend cue with visible `Discovered landmarks` text |
| `vfx_extract` / `vfx_hit` | effect | short pulse or flash | REF-002 | — | `prototype_pending` | Separate Canvas effect; optional |
| `vfx_death` / `vfx_respawn` | effect | loss, respawn | REF-002 | — | `prototype_pending` | Event marker remains readable without VFX |
| `vfx_protected_start` | effect | active, ending | REF-001 | [`core-world.svg`](prototypes/core-world.svg) | `integration_pending` | Dashed ring sample; keep it separate from the Shelter base sprite |
| `ui_stale` / `ui_capability` | UI state | stale, reconnecting, supported, unsupported | REF-001 | — | `spec_ready` | React status surface and accessible text |

## Handoff rule

A visual asset becomes eligible for CP-12 when its source, export format, anchor, required states, and
reference entry are recorded. Final art may replace a prototype without changing its stable parent
asset ID or state contract.
