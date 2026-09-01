# Capability: Shelter Command and Upgrade

**Status:** Working design; prices and caps are open

## Goal

Give the player one readable command base where sensing, residents, upgrades, turret status, coins,
field missions, and migration state can be inspected and changed under server authority.

## Entry and visible state

The shelter page shows level, location, home anchor, sensing radius, resident and field soldiers,
turrets, wallet, upgrade branches, veil charge/cooldown, migration/breach state, incoming threats,
and global leaderboard metric.

## Actions and outcomes

The player can assign a resident role, purchase a valid upgrade, set defense posture, recall a field
soldier, start migration, or prepare a siege. The server checks ownership, version, state, cost,
prerequisites, and target visibility. A committed action returns the new version and causal event;
an invalid action returns typed failure with the next valid action.

## Boundaries

The page cannot mint coins, reveal hidden positions, bypass role lock, cancel migration, resolve
combat, or restore a converted soldier. A high-consequence action may stop at a human approval gate.

## Dependencies

- Mechanics: M03, M04, M05, M15, M17;
- Dashboard: [`../03-dashboard-and-operations.md`](../03-dashboard-and-operations.md);
- Logic: [`../../Mechanics/Chains/06-migration-to-relocation.md`](../../Mechanics/Chains/06-migration-to-relocation.md)
  and [`../../Mechanics/Chains/09-upgrade-to-capability.md`](../../Mechanics/Chains/09-upgrade-to-capability.md).
