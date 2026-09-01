# Shelter Migration and Veil

**Mechanism:** M17
**Status:** Working decision; timing and charge values are open
**Authority:** This file owns paid shelter movement and concealment. Shelter state owns command
authority; navigation owns movement; defense owns assault resolution.

## Purpose

Define how a shelter pays to move, conceals its fresh location, continues existing field work, and
reunifies returning soldiers without creating a second command base.

## Migration lifecycle

```text
STABLE → MIGRATION_PREPARING → MIGRATING → ARRIVAL_COMMITTING → STABLE
```

The player selects a valid destination, pays the fee before movement starts, consumes a veil charge,
and commits to an uncancellable movement. Larger shelters move more slowly. The shelter keeps its
identity and continuously updates its moving home anchor.

## Veil behavior

The veil gradually removes the migrating shelter from fresh discovery. Other players retain a
time-stamped last-known position and can act on stale intelligence, but cannot obtain the current
position through a fresh sensor while the veil is active. The veil is concealment, not a retroactive
undo of a committed battle.

The initial charge model is one automatically recharged charge, with an expensive purchase path for
additional charges. Stored-charge cap, cooldown start point, and charge stacking are `OPEN`.

## Field missions

- Existing field soldiers continue their committed missions.
- New deployments pause until arrival.
- Returning soldiers target the moving `home_anchor` and join the shelter after arrival.
- A field route cannot use migration to erase elapsed travel time or cargo risk.

## Defense interaction

Turrets stop firing for the entire migration. An attack alert may permit migration before assault
commitment. A committed assault resolves according to serialized event order; migration cannot be
used to retroactively cancel it.

## Destination and arrival

The destination must pass walkability, overlap, separation, and any protected-start checks. Arrival is
an authoritative milestone. Only then does the shelter become freshly discoverable again and resume
normal deployment. The exact destination constraints, movement formula, and arrival visibility window
remain `OPEN`.

## Invariants

- Payment and veil consumption happen at migration start exactly once.
- Migration cannot be cancelled or duplicated by a retry.
- No second shelter exists during movement.
- Last-known position is retained with observation time and confidence.
- Turret state and command availability are visible throughout migration.

## Open decisions

- destination constraints and movement speed;
- veil fade and fresh-discovery semantics;
- cooldown start point and stored-charge cap; and
- exact attack ordering during migration.

## Related documents

- [`02-shelter-and-migration.md`](02-shelter-and-migration.md) — family overview;
- [`detail-03-shelter-state-and-command.md`](detail-03-shelter-state-and-command.md);
- [`detail-09-navigation-and-pathfinding.md`](detail-09-navigation-and-pathfinding.md);
- [`detail-15-shelter-defense-and-turrets.md`](detail-15-shelter-defense-and-turrets.md); and
- [`Chains/06-migration-to-relocation.md`](Chains/06-migration-to-relocation.md).
