# Shelter Defense and Turrets

**Mechanism:** M15
**Status:** Working baseline; targeting and values are open
**Authority:** This file owns resident defense and turret behavior. Siege owns assault; migration
owns veil shutdown.

## Defense composition

Shelter defense is the combined result of resident guards, shelter protection, turret inventory and
power, current defense posture, and any temporary recovery state. Field soldiers do not automatically
join defense until they return to the shelter.

## Resident guards

A soldier assigned `GUARD` remains resident and contributes the accepted defense inputs. The player
can keep some of the starter five soldiers at home while dispatching others to gather, hunt, or form
a siege party. Guard role and equipment remain locked until the soldier is reassigned from the
shelter.

## Turret behavior

The default shelter has a turret. A turret has an inventory slot, attack power, range, target policy,
and firing state. The server selects a valid incoming target, resolves each firing action through the
combat framework, and records ammunition or cooldown if those mechanics are adopted.

Turrets stop operating for the entire migration veil. A breach or recovery state can disable or
degrade them according to the accepted shelter rule; it must be visible in the dashboard.

## Incoming attack states

```text
NO_THREAT → ALERTED → CONTACTED → ASSAULT_COMMITTED → RESOLVED
```

An alert may allow migration if the assault is not yet committed. Once an assault enters the
committed state, the event-order rule decides whether it resolves before a later migration command.

## Defense posture

The player or a bounded Agent may inspect threats and set a posture such as hold, prioritize a target,
or prepare a recall. The exact automatic posture vocabulary is `OPEN`. High-consequence changes to
defense or an attack must observe the human boundary.

## Invariants

- Turret damage is server-authoritative and uses current shelter state.
- A migrating turret cannot fire through concealment.
- Resident guard count and field count are visible separately.
- Defense cannot mint a siege reward or change ownership without a breach settlement.

## Open decisions

- turret target priority, range, reload, and ammunition;
- guard contribution and shelter defense formula;
- attack alert timing and assault commitment;
- defense posture commands available to an Agent; and
- turret behavior during breach recovery.

## Related documents

- [`06-combat-and-loot.md`](06-combat-and-loot.md) — family overview;
- [`detail-03-shelter-state-and-command.md`](detail-03-shelter-state-and-command.md);
- [`detail-13-encounter-and-combat-resolution.md`](detail-13-encounter-and-combat-resolution.md);
- [`detail-16-siege-assault-and-breach.md`](detail-16-siege-assault-and-breach.md); and
- [`detail-17-shelter-migration-and-veil.md`](detail-17-shelter-migration-and-veil.md).

