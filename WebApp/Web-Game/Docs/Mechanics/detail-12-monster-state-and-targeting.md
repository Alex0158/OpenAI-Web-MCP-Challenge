# Monster State and Targeting

**Mechanism:** M12
**Status:** MVP seeded-monster contract accepted; full targeting and species policy remain open
**Authority:** This file owns monster state, target selection, and monster movement. Combat owns
resolution; breach owns soldier conversion.

## Monster kinds

Generated monsters are shared-world actors with a species, level, health, attack, defense, speed,
detection range, patrol region, target policy, and optional resource value. A corrupted soldier is a
former field soldier whose shelter magic and command link were removed by a breach.

## State machine

```text
IDLE → PATROL → ALERT → CHASE → ATTACK → RETREAT or DEAD
```

Corrupted soldiers may enter `ROAMING` before the normal target cycle. State transitions are driven
by target visibility, distance, health, region pressure, and bounded cooldowns. The first version
should keep transitions observable and small.

## Target policy

A species may target a player, soldier, shelter, resource activity, or nearby event. Detection starts
a pursuit decision; entering the engagement radius starts combat. Speed, patrol radius, attack power,
and retreat threshold differ by species and level.

For G2, the seeded monster follows one deterministic patrol lane, can contact a field soldier after
the protected-start boundary ends, and remains in its normal state machine after killing a soldier.
Production target switching, last-position memory, shelter interaction, and migration veil behavior
remain `OPEN` details.

## Monster value and death

A hunter can deliberately target the seeded monster. In G2, defeating it clears the active threat and
emits `MonsterDefeated` without adding a third resource or direct coin reward; future species value or
world drops are post-G2 rules. Monster death removes the active monster entity after settlement is
committed.

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
