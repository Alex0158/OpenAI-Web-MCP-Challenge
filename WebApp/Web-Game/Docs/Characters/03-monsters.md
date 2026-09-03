# Monsters

**Status:** Working concept baseline

## Generated monsters

Generated monsters are shared-world actors with a species, level, health, attack, defense,
`initiative_speed`, patrol/chase movement rates, `monster_detection_radius_tiles`, patrol region,
target policy, state, and optional resource value. They can move,
search for players or soldiers, attack, retreat, die, and yield value when hunted.

## Corrupted soldiers

A corrupted soldier is a former field soldier whose shelter magic was lost in a breach. It becomes a
single uncontrolled monster entity. Its old role and level may seed its new stats, giving the world a
visible memory of the breached settlement.

Corrupted monsters are hostile or neutral world actors according to the later target policy. They are
never silently returned to the old player's roster.
