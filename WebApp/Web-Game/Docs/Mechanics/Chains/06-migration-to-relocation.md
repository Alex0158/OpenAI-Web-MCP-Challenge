# Chain C06: Migration to Relocation

**Status:** Working decision; cooldown and attack ordering are open

## Trigger and outcome

The shelter receives a valid migration command before a committed assault, pays its cost, and moves
to a chosen valid destination while existing field work continues.

## Ordered flow

1. `M03` validates shelter state, destination, payment, and command version.
2. `M17` deducts the fee, consumes one veil charge, commits an uncancellable migration, and creates
   the moving `home_anchor`.
3. `M15` disables turret firing and `M08` pauses new field deployments.
4. Existing field soldiers continue their role-locked missions under `M01`; returning soldiers target
   the moving home anchor.
5. `M10` keeps old last-known intelligence visible while fresh discovery is concealed according to
   the veil rule.
6. `M01` reaches the arrival milestone and `M17` commits the new position.
7. Returning soldiers join the shelter, normal deployment resumes, and fresh discovery becomes
   available.

## Failure branches

- Invalid destination, insufficient coins, no charge, or stale version rejects migration before cost.
- A committed assault follows C05 and cannot be cancelled by migration.
- A path obstruction requires the accepted movement recovery rule; it cannot duplicate the shelter.
- A restart recovers migration state and charge consumption from durable events.

## Invariants and events

Payment and charge consumption happen once. The shelter keeps one identity, turrets remain silent, and
field missions are not teleported. Candidate events are `MigrationStarted` and `MigrationCompleted`.

## Open decisions

Destination constraints, movement speed, veil fade semantics, cooldown start, charge cap, and exact
attack visibility during migration remain `OPEN`.

## Related mechanisms

- [`../detail-17-shelter-migration-and-veil.md`](../detail-17-shelter-migration-and-veil.md);
- [`../detail-09-navigation-and-pathfinding.md`](../detail-09-navigation-and-pathfinding.md); and
- [`../detail-15-shelter-defense-and-turrets.md`](../detail-15-shelter-defense-and-turrets.md).

