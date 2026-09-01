# MVP Visual, UI, and Asset Specification

**Status:** ACCEPTED MVP PREPARATION; FINAL ASSETS AND POLISH OPEN  
**Authority:** [`../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md)  
**Scope:** Sleepless Kingdom G2 page, Canvas projection, and readable dashboard

## Purpose

This specification gives design and engineering one small visual contract before implementation. It
defines what the player must see, what the asset terms mean, which layer renders each item, and how
placeholder work can run in parallel with the authoritative game backbone.

The target is a clean, compact, top-down survival world with a limited palette and clear silhouettes.
The Starve.io reference informs readability and interaction density only; no asset, brand, code, or
unverified implementation assumption is copied.

## Vocabulary

| Term | Meaning in this project |
|---|---|
| UI / HUD | React/HTML controls and status surfaces such as coins, cargo, health, mission, and connection state |
| Sprite | A visual image for one actor or object, such as a soldier, monster, shelter, or resource node |
| Tile | One repeated map cell such as grass, path, obstacle, or fog |
| Tileset | A collection of tile images used to build the world surface |
| Sprite atlas / spritesheet | One PNG/WebP image containing multiple tiles, sprites, or animation frames |
| Icon | A small semantic UI image for wood, rock, sword, pickaxe, warning, or status |
| VFX | A short visual cue such as a hit flash, extraction pulse, shield ring, or death marker |
| Placeholder | A deterministic colored shape, text label, or simple icon used before final art exists |
| Avatar | The directly controlled player character; it is separate from autonomous soldiers |

## Layer contract

### Canvas world layer

Canvas renders the authoritative snapshot as a visual projection in this order:

1. terrain tiles and walkability cues;
2. explored fog boundary and discovered landmark markers;
3. Wood and Rock resource nodes;
4. shelters and the local protected-start ring when active;
5. player avatar and visible soldiers;
6. seeded monster, sensor/contact markers, and route cues; and
7. optional low-cost VFX and selection outlines.

Canvas never owns coins, cargo, positions, combat results, mission state, or hidden cells. It draws
the latest accepted snapshot and interpolates between server updates.

### React/HTML layer

React owns the readable interaction surface:

- top HUD: coins, world time, connection/reconnect state, and capability result;
- shelter card: location, protected-start state, sensing summary, and available commands;
- mission rows: soldier identity, role, tool, target, phase, cargo, ETA, risk, and next valid action;
- event history: causal loss, combat, deposit, respawn, reissue, and Re-entry result;
- Agent panel: event, fresh readback, tool, arguments, typed result, and human boundary; and
- controls: WASD movement, mission dispatch, recall, inspect, and demo reset.

Every important Canvas state has a text equivalent. A missing Canvas or WebMCP capability leaves these
controls and records usable.

## G2 asset inventory

The IDs are stable references for the renderer and dashboard. They are not domain entity IDs.

| Asset ID | Category | Required visual states | G2 implementation target | Placeholder rule |
|---|---|---|---|---|
| `tile_grass` | terrain tile | normal, blocked edge if needed | atlas tile | flat green tile |
| `tile_path` | terrain tile | normal | atlas tile | muted path rectangle |
| `tile_fog` | visibility | hidden, explored edge | Canvas fill/atlas tile | dark translucent tile |
| `node_wood` | resource sprite | available, selected, depleted | atlas sprite | brown stump/circle + `WOOD` label |
| `node_rock` | resource sprite | available, selected, depleted | atlas sprite | grey rock polygon + `ROCK` label |
| `shelter_player` | shelter sprite | stable, selected, protected ring | atlas sprite + Canvas ring | colored block + `SHELTER` label |
| `shelter_landmark` | landmark | discovered, stale if later needed | Canvas marker/icon | flag marker + `LANDMARK` label |
| `avatar_player` | player avatar | idle, walking, resting | atlas sprite | colored circle with player letter |
| `soldier_gatherer` | actor sprite | idle, travelling, working, engaging, returning, dead/respawning | atlas sprite | blue geometric actor + pickaxe icon |
| `soldier_hunter` | actor sprite | idle, travelling, hunting, engaging, returning, dead/respawning | atlas sprite | red geometric actor + sword icon |
| `monster_seeded` | actor sprite | patrol, alert, chase, attack, defeated | atlas sprite | purple geometric actor + `MONSTER` label |
| `icon_wood` / `icon_rock` | UI icon | normal, cargo, unavailable | SVG or small raster icon | text abbreviation |
| `icon_pickaxe` / `icon_sword` | UI icon | normal, locked | SVG or small raster icon | Unicode-free CSS shape or text label |
| `icon_cargo` / `icon_coin` | UI icon | normal, at risk, deposited | SVG or small raster icon | labelled status chip |
| `vfx_extract` | effect | short pulse | Canvas animation | one-frame highlight |
| `vfx_hit` | effect | short flash | Canvas animation | outline change |
| `vfx_death` / `vfx_respawn` | effect | loss, respawn | Canvas marker | event marker and text |
| `vfx_protected_start` | effect | active, ending | Canvas ring | dashed ring |
| `ui_stale` / `ui_capability` | UI state | stale, reconnecting, supported, unsupported | React status component | plain text alert |

Final art may replace a placeholder while preserving the asset ID and state contract.

## Format and motion rules

- Use one consistent atlas cell size within the initial asset package; a 32 × 32 source cell is a
  working target, not a gameplay contract.
- Keep source art small and scale it through Canvas with device-pixel-ratio awareness. Do not create
  one DOM node per actor.
- Prefer nearest-neighbour or an intentionally chosen smoothing rule consistently across the atlas.
- Keep the first animation set to idle, walk, work, attack, hit, and death/respawn cues. A still
  silhouette is acceptable when an animation frame would delay the causal trace.
- Keep color and outline changes semantic: selected, hostile/contact, carrying cargo, damaged, stale,
  and protected. Never encode a critical state by color alone; pair it with text or an icon.
- VFX are optional and short. They cannot delay a snapshot, change a command result, or hide a causal
  event. Reduced-motion mode may replace them with an instant state change.

## Parallel delivery lane

| Lane step | Timing | Output | Dependency |
|---|---|---|---|
| Visual prep | Now, alongside CP-02 | this spec, UI wireframe, asset IDs, palette and placeholder rules | `SK-MVP-0.1` snapshot/read models |
| Placeholder pack | After CP-03, alongside CP-04–11 | geometric actors, tiles, icons, and one representative atlas | stable IDs and Canvas probe result |
| Surface integration | CP-12 | Canvas atlas, React HUD, dashboard states, and text equivalents | authoritative snapshot stream |
| Lightweight polish | After CP-16 if time and performance allow | selected sprite replacement and optional VFX | local vertical slice evidence |

Backbone work is allowed to ship with placeholders. Visual work may consume snapshots and read models,
but it cannot add domain authority, mutate event order, or expand the G2 feature boundary.

## Visual acceptance checks

Before G2 is called presentable, a reviewer must be able to:

1. distinguish the player, both soldier roles, the seeded monster, the shelter, Wood, and Rock;
2. read cargo risk, mission phase, health, world time, connection state, and last causal event without
   relying on animation;
3. see the protected-start state and the discovered other-shelter landmark when applicable;
4. follow a moving actor without jitter that obscures the route or contact; and
5. complete the first trace with placeholders if any final asset is absent.

Performance, accessibility, and causal readability outrank decorative polish. Any asset that harms
the target smoothness or obscures state is simplified or disabled until the next visual revision.
