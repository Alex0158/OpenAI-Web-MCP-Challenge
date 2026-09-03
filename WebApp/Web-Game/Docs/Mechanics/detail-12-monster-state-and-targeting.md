# Monster State and Targeting

**Mechanism:** M12
**Status:** MVP seeded-monster contract accepted; the seeded HUNTER victory lifecycle is
runtime-verified locally; full targeting and species policy remain open
**Authority:** This file owns monster state, target selection, and monster movement. Combat owns
resolution; breach owns soldier conversion.

## Monster kinds

Generated monsters are shared-world actors with a species, level, health, attack, defense,
`initiative_speed`, movement rates, detection range, patrol region, target policy, and optional
resource value. In G2 the seeded monster uses `monster_patrol_speed_tiles_per_world_second = 2.0`,
`monster_chase_speed_tiles_per_world_second = 4.0`, and `monster_detection_radius_tiles = 5.0`. A corrupted soldier
is a former field soldier whose shelter magic and command link were removed by a breach.

## State machine

```text
IDLE → PATROL → ALERT → CHASE → ATTACK → RETREAT or DEAD
```

Corrupted soldiers may enter `ROAMING` before the normal target cycle. State transitions are driven
by target visibility, distance, health, region pressure, and bounded cooldowns. The first version
should keep transitions observable and small.

## Target policy

A species may target a player, soldier, shelter, resource activity, or nearby event. Detection starts
a pursuit decision; entering the G2 `engagement_radius_tiles = 1.0` starts combat. Detection uses
inclusive Euclidean distance in logical tiles. `initiative_speed` decides combat order; patrol and
chase movement rates decide travel and pursuit and are separate fields. Patrol radius, attack power,
and retreat threshold differ by species and level outside G2.

For G2, the seeded monster follows one deterministic patrol lane, can contact a field soldier after
the protected-start boundary ends, and remains in its normal state machine after killing a soldier.
Its patrol speed is 2.0 tiles per world second and chase speed is 4.0; the route and walkability seed
must preserve the accepted Rock-route encounter trace. Production target switching, last-position
memory, shelter interaction, and migration veil behavior remain `OPEN` details.

## Monster value and death

A hunter can deliberately target the seeded monster. In G2, defeating it clears the active threat and
emits `MonsterDefeated` without adding a third resource or direct coin reward; future species value or
world drops are post-G2 rules. The persisted row becomes `DEAD` after the atomic victory settlement,
retains its stable id for history, and is excluded from active targeting. Only one active HUNTER
mission may reserve the seeded monster; the reservation remains through `RETURNING` and releases when
that mission completes. The local result is recorded in
[`../Evidence/SK-EVID-024-cp11-hunter-victory-runtime-verification.md`](../Evidence/SK-EVID-024-cp11-hunter-victory-runtime-verification.md).

If a monster kills a soldier, the soldier's unbanked cargo is destroyed in that combat transaction;
it is not transferred to the monster and does not become a world drop in this baseline. Ordinary
same-identity respawn applies unless a breach has changed the soldier's state. The killing monster
remains in the normal monster state machine after the attack and is not removed by this cargo-loss
rule. It may continue, retreat, or die only through its ordinary state and species policy.

## Corrupted soldiers

Each field soldier converted by breach becomes one uncontrolled roaming monster. Its former role,
level, and equipment may seed its initial stats. It cannot be recalled, restored, or duplicated in the
old roster.

## Invariants

- Monster movement and targeting are server-authoritative.
- A monster cannot award value and remain alive under the same death event.
- Corruption removes the player command link exactly once.
- A monster kill never creates a second soldier identity.

## Open decisions

- production species count and exact stats;
- production target priority and target switching;
- shelter and veil interaction; and
- future monster loot/currency representation beyond the G2 threat-clearing result.

## Related documents

- [`07-monsters-and-state-machine.md`](07-monsters-and-state-machine.md) — family overview;
- [`detail-02-world-generation-and-resource-spawn.md`](detail-02-world-generation-and-resource-spawn.md);
- [`detail-06-soldier-identity-and-lifecycle.md`](detail-06-soldier-identity-and-lifecycle.md); and
- [`detail-13-encounter-and-combat-resolution.md`](detail-13-encounter-and-combat-resolution.md).
