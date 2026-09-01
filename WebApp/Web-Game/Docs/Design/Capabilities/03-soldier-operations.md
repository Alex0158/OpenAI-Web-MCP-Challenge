# Capability: Soldier Operations

**Status:** Working design

## Goal

Let the player express a doctrine for a finite roster while the server carries out movement and work
without frame-by-frame micromanagement.

## Entry and visible state

The player sees each soldier's stable identity, current role, tool tier, mission attempt, target,
route, phase, cargo, estimated return, encounter, health, death cause, and next valid action. Five
starter soldiers create a meaningful allocation between guard, gatherer, hunter, and siege roles.

## Actions and outcomes

From the shelter, the player assigns one role, loadout, target, route, and return policy. Full cargo
starts return; recall queues return. A gathering or hunting mission can restart after deposit or
ordinary respawn. In the baseline, a repeatable gathering or hunting assignment is reissued after
ordinary respawn; a siege is one-shot and ends on success, failure, retreat, or soldier death.

## Boundaries

One soldier has one active player mission. A passive encounter can interrupt but cannot change role or
equip a new tool. A field soldier must return or reach a terminal state before accepting a new role.

## Dependencies

- Mechanics: M06, M07, M08, M09;
- Logic: [`../../Mechanics/Chains/02-dispatch-to-deposit.md`](../../Mechanics/Chains/02-dispatch-to-deposit.md); and
- Dashboard: [`../03-dashboard-and-operations.md`](../03-dashboard-and-operations.md).
