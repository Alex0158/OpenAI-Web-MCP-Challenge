# Capability: Defense, Siege, and Migration

**Status:** Working design; combat and recovery values are open

## Goal

Let the player balance resident guards, turrets, mobile siege parties, shelter movement, veil charges,
and the possibility that a breach changes the world permanently.

## Entry and visible state

The shelter page shows incoming alerts, defense posture, resident guards, turret status, committed
assault state, migration destination and ETA, veil charge/cooldown, last-known enemy positions, and
breach/recovery state.

## Actions and outcomes

The player can keep guards home, prepare a siege after returning with intelligence, start a paid
uncancellable migration before assault commitment, or repair a damaged core. During migration, the
veil hides fresh location, turrets stop, new deployments pause, and existing field missions continue
toward the moving home anchor.

A successful defense preserves the shelter. A successful siege records a separate attacker reward,
applies breach penalty, ends field missions, and converts exposed soldiers into roaming monsters.

## Boundaries

Migration cannot retroactively cancel a committed assault. No action can restore a converted field
soldier or make shelter-held value field loot.

## Dependencies

- Mechanics: M03, M14, M15, M16, M17;
- Logic: [`../../Mechanics/Chains/05-siege-to-breach.md`](../../Mechanics/Chains/05-siege-to-breach.md) and
  [`../../Mechanics/Chains/06-migration-to-relocation.md`](../../Mechanics/Chains/06-migration-to-relocation.md); and
- Design: [`../03-dashboard-and-operations.md`](../03-dashboard-and-operations.md).

