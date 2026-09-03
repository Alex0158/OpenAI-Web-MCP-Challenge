# Art Bible

**Status:** Working preparation specification; based on the owner-accepted low-detail direction
**Parent asset vocabulary:** [`../06-visual-ui-and-asset-spec.md`](../06-visual-ui-and-asset-spec.md)
**Reference register:** [`07-reference-board.md`](07-reference-board.md)

The art bible defines visual differences that communicate the existing game roles. It does not add
new gameplay roles or state transitions.

## Character language

| Entity | Silhouette and prop | Working visual cue | Required states |
|---|---|---|---|
| `avatar_player` | Hooded explorer, short cloak, small rune marker, no fixed tool | Amber body with a clear player marker | Idle, walking, exploring, resting |
| `soldier_gatherer` | Compact worker, square backpack, pickaxe | Amber body, visible pack and pickaxe | Idle, travelling, working, returning, carrying, dead/respawn |
| `soldier_hunter` | Slim scout, short cloak, short sword | Amber body, visible blade and forward stance | Idle, travelling, hunting, combat, returning, dead/respawn |
| `monster_seeded` | Small low silhouette with one bright eye and two horn cues | Muted violet body and bright eye | Patrol, alert, chase, attack, defeated |

The player avatar is distinguished from soldiers by the rune marker and lack of a fixed work tool.
Gatherer and Hunter share the friendly color but differ in prop, body proportion, and pose. Enemy
soldiers may reuse the soldier base with the hostile tint; they do not need a second body set for G2.

## Structure and resource language

| Entity | Base shape | State treatment |
|---|---|---|
| `shelter_player` | Compact tile foundation, central crystal, small turret cue | Friendly or hostile tint, stable, damaged, selected, protected ring, migration veil |
| `node_wood` | Stump with one or two logs | Available, selected, depleted |
| `node_rock` | Three-rock cluster | Available, selected, depleted |
| `tile_grass` / `tile_path` | Quiet flat ground tiles | Normal and blocked-edge cues only when needed |
| `tile_fog` | Large dark block or soft edge mask | Hidden, explored edge, reconnect/stale overlay |

The opposing Shelter is a tint and marker variant of the same compact Shelter vocabulary unless a
later runtime test proves that a separate asset is necessary. Turret active/disabled is a visible
sub-state of the Shelter structure for preparation; it does not require a new gameplay identity.

## Tool language

- `icon_pickaxe` is a broad pale head on a brown handle.
- `icon_sword` is a short pale blade on a dark handle.
- Future shield and siege tools use the same icon grammar but remain preparation-only until their
  gameplay checkpoint is released.
- Tool progression changes material or accent color before it creates a new silhouette.

## State marker language

- selected: amber outline ring;
- route: short dashed line;
- sensor: thin dotted circle;
- cargo: small resource icon above the soldier;
- contact or combat: compact outline or hit flash;
- damaged: missing tile or muted structure accent;
- depleted: smaller or low-contrast resource shape; and
- stale, reconnecting, or unavailable: React status text plus a neutral icon.

No critical state is conveyed by a subtle texture or animation alone.
