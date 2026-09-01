# Monsters and State Machine

**Status:** Working target

This is the M12 family overview. The atomic monster state and targeting authority is in
[`detail-12-monster-state-and-targeting.md`](detail-12-monster-state-and-targeting.md).

## States

```text
IDLE → PATROL → ALERT → CHASE → ATTACK → RETREAT or DEAD
```

A monster can also enter `ROAMING` when it is a corrupted former soldier. State transitions are
server-timed and driven by target visibility, distance, health, region pressure, and simple cooldowns.

## Targeting

A monster can seek a player, soldier, shelter, or nearby activity according to its species policy.
Different species may use different speed, health, detection, attack, patrol radius, and retreat
threshold values. The first implementation should keep the state machine small and observable.

## Combat and value

A hunter can deliberately target monsters. A gatherer can fight when attacked but uses a weaker
fallback tool. Monster defeat can yield typed cargo or coins according to the resource rule. If a
monster kills a soldier, that soldier's unbanked cargo is destroyed and the soldier respawns at the
shelter unless a breach has changed its state. The killer remains active under the normal monster
state machine; this event does not despawn it or award it the destroyed cargo.

## Corrupted soldiers

A field soldier converted after a shelter breach becomes a world monster with no player command link.
Its former role, level, and equipment can influence its initial monster stats. It is a single entity
transition, so the roster does not also retain an active controllable copy.
