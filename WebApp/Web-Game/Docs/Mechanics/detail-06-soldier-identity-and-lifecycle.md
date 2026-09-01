# Soldier Identity and Lifecycle

**Mechanism:** M06
**Status:** Working decision; breach edge cases are open
**Authority:** This file owns soldier identity and lifecycle. Mission and role files own assignment
semantics.

## Identity

Every soldier has a stable `soldier_id` owned by one shelter. A sortie or restart receives a separate
`mission_attempt_id`. Respawn creates a new life state for the same soldier identity; it never clones
the soldier or silently creates a second roster entry.

## Lifecycle states

```text
AT_SHELTER → FIELD
FIELD → RETURNING → AT_SHELTER
FIELD → DEAD → RESPAWNING_AT_SHELTER → AT_SHELTER
FIELD → CORRUPTED_MONSTER
AT_SHELTER → RETIRED (future, if needed)
```

The role and mission phase are separate from lifecycle state. A soldier can be `FIELD` and
`ENGAGING`, or `AT_SHELTER` and `GUARD`.

## Ordinary death

An ordinary field death commits the combat result, settles exposed cargo according to the combat
rule, marks the mission attempt's failure, and respawns the same `soldier_id` at the shelter. The
respawn is immediate in world time, with no respawn cooldown or replacement fee in this baseline.
The cost is lost time, the travel required to reach the next objective, and any exposed cargo settled
by the combat rule. The existing repeatable gathering or hunting assignment is reissued from the
shelter under its recorded restart policy; a one-shot siege attempt ends.

## Breach conversion

When a shelter breach commits, every field soldier outside the shelter boundary transitions once to a
single uncontrolled roaming monster. Its former role, level, and equipment may seed monster stats.
The old mission attempt and cargo are terminal. A resident soldier remains associated with the
damaged core under the breach rule.

## Boundary cases

- A soldier that deposits before the breach transaction is resident for that event order.
- A returning soldier that has not crossed the authoritative boundary is field and is converted.
- A soldier dying in the same transaction as a breach follows the serialized event order; no duplicate
  respawn and corruption may both occur.
- A converted soldier cannot be recalled or restored by an Agent.

## Invariants

- One `soldier_id` maps to at most one controllable entity.
- Respawn does not duplicate quantity, equipment, cargo, or rewards.
- Death cause, mission attempt, location, and cargo outcome remain in history.
- A breach conversion removes the command link exactly once.

## Open decisions

- exact shelter-boundary geometry and crossing event;
- whether resident soldiers can die during breach resolution;
- post-recovery roster capacity and replacement soldiers.

## Related documents

- [`03-soldier-roles-and-missions.md`](03-soldier-roles-and-missions.md) — family overview;
- [`detail-07-role-and-loadout-lock.md`](detail-07-role-and-loadout-lock.md);
- [`detail-08-mission-dispatch-return-and-recall.md`](detail-08-mission-dispatch-return-and-recall.md);
- [`detail-16-siege-assault-and-breach.md`](detail-16-siege-assault-and-breach.md); and
- [`detail-12-monster-state-and-targeting.md`](detail-12-monster-state-and-targeting.md).
