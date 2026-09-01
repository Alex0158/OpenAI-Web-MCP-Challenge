# Siege, Assault, and Breach

**Mechanism:** M16
**Status:** Working decision; repair and reward values are open
**Authority:** This file owns siege progression and the breach trigger. Combat resolves participants;
loot settles value; corruption owns soldier entity conversion.

## Purpose

Define how a discovered shelter attack progresses from a committed siege party to defense resolution,
breach, reward settlement, and the visible conversion of exposed soldiers.

## Siege lifecycle

```text
PREPARED → MARCHING → APPROACHING → ASSAULT_COMMITTED → RESOLVING
                                      ↘ RETREATING
RESOLVING → SIEGE_SUCCESS → BREACHED
RESOLVING → SIEGE_FAILURE → RETURNING or TERMINAL
```

A siege party is formed at the attacker's shelter after a personally discovered, returned intelligence
record. It shares one target coordinate, route, and party mission. The ordinary field role lock still
applies to every member.

## Assault commitment

Before `ASSAULT_COMMITTED`, the target may be absent, stale, or concealed by a migration veil. After
commitment, the server locks the shelter defense encounter and follows the event-order rule. The
exact contact radius and whether a committed assault can damage a moving shelter remain `OPEN`.

## Breach transaction

When the defense loses, one atomic transaction:

1. marks the defender shelter `BREACHED`;
2. calculates the deterministic baseline penalty and separate attacker reward;
3. reduces defender-held value by 50% and lowers shelter plus soldier/military level by one within
   minimum bounds;
4. transfers the accepted siege reward exactly once;
5. terminates active field missions and discards their exposed cargo;
6. converts every field soldier outside the shelter boundary into one uncontrolled roaming monster;
7. keeps resident soldiers with the damaged core; and
8. emits `ShelterBreached`, `SiegeRewarded`, and one `SoldierCorrupted` per conversion.

The transaction records attacker, defender, defense result, penalty, reward, converted soldier ids,
former roles, and recovery actions. It never deletes the account or silently recreates a converted
soldier.

## Boundary event order

A soldier that deposits before the breach commit is resident for that transaction. A returning
soldier that has not crossed the authoritative boundary is field and is converted. A death and a
breach in the same due window follow serialized entity versions; both outcomes cannot apply to one
soldier.

## Recovery

The damaged core enters `RECOVERING`. The repair duration, repair cost, minimum defense, resident
commands, and replacement-soldier policy are `OPEN`. Recovery must provide a path back into play while
preserving the visible loss and world monsters created by the breach.

## Invariants

- One siege attempt has one target, route, and terminal result.
- A breach is exactly once for one shelter and assault id.
- Field conversion removes command authority exactly once.
- Attacker reward, defender penalty, and field cargo are separate ledgers.

## Open decisions

- assault contact and commitment window;
- repair duration, repair cost, and resident command availability;
- attacker reward share and cap; and
- deterministic versus auditable random penalty.

## Related documents

- [`08-breach-and-corruption.md`](08-breach-and-corruption.md) — family overview;
- [`detail-13-encounter-and-combat-resolution.md`](detail-13-encounter-and-combat-resolution.md);
- [`detail-14-loot-reward-and-atomic-transfer.md`](detail-14-loot-reward-and-atomic-transfer.md);
- [`detail-15-shelter-defense-and-turrets.md`](detail-15-shelter-defense-and-turrets.md); and
- [`Chains/05-siege-to-breach.md`](Chains/05-siege-to-breach.md).
