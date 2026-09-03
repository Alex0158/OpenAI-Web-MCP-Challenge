# Motion and Effects

**Status:** Bounded preparation specification; effects remain optional
**Parent specification:** [`../06-visual-ui-and-asset-spec.md`](../06-visual-ui-and-asset-spec.md)

Motion reinforces the server-authoritative state already defined by the game contract. It must never
be the only way to understand a result and must not delay a `client_snapshot` or command response.

## Actor motion

| Actor | Motion cue | Budget |
|---|---|---|
| Player avatar | Small walk cycle and a subtle exploration marker | Two to four frames |
| Gatherer | Walk cycle, pickaxe swing, pack visible during return | Two to four frames per cue |
| Hunter | Walk cycle, short sword stance, one hit flash | Two to four frames per cue |
| Monster | Patrol bob, forward chase pose, one attack pose | Two to four frames per cue |

Client interpolation smooths movement between server snapshots. Artwork must not encode a different
speed, route, collision boundary, or combat result.

## Structure and resource cues

- Shelter stable: crystal and turret are visible.
- Shelter damaged: remove or mute a small number of foundation tiles; do not play a long destruction
  sequence.
- Turret disabled: turn off its indicator and keep the structure readable.
- Migration veil: fade or mask the Shelter through a short overlay; preserve the last-known marker
  rules in the gameplay contract.
- Wood and Rock depleted: reduce the node to its low-resource silhouette; the dashboard remains the
  authoritative source for exact amounts.

## Low-cost effect set

| Effect | Trigger | Treatment |
|---|---|---|
| Extraction pulse | Cargo extraction | One short ring or highlight |
| Hit flash | Battle round result | One-frame outline or flash |
| Death marker | Soldier death | Short fade and event marker |
| Respawn cue | Same-identity respawn | Short Shelter-side marker |
| Protected-start ring | Active onboarding shield | Dashed Canvas ring |
| Stale/reconnect cue | Client projection stale | React status plus quiet Canvas tint |

Effects are separate Canvas or React layers, short, and optional. Reduced-motion mode replaces them
with an immediate state change. No effect may hide cargo loss, death, a failed command, or a Re-entry
result.

## Deferred motion

Full siege animation, breach conversion, migration travel animation, multi-monster behavior, skins,
and decorative particles remain outside this preparation increment. They can be specified when their
own gameplay checkpoint is released.
