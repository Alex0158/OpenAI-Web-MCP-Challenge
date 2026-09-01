# Shelter State and Command Authority

**Mechanism:** M03
**Status:** Working decision; recovery rules are open
**Authority:** This file owns the shelter entity and which commands are valid. Backend authority is
described here; Engineering owns transport and persistence.

## Shelter entity

A shelter is the player's persistent command base and one authoritative entity. It owns:

- `shelter_id`, owner, location, and movement state;
- shelter level and upgrade branches;
- resource sensing radius;
- turret inventory and defense state;
- resident and field soldier references;
- deposited resource history and coin wallet;
- veil charges and cooldown;
- time-stamped intelligence records;
- breach and recovery state; and
- the moving `home_anchor` used by returning soldiers.

## State machine

```text
STABLE → MIGRATING → STABLE
STABLE → BREACHED → RECOVERING → STABLE
```

`STABLE` accepts normal resident management and new deployments. `MIGRATING` accepts only commands
explicitly allowed by migration rules. `BREACHED` is the atomic aftermath state. `RECOVERING` keeps a
damaged core and a route back to normal operation; it does not delete the player account or invent a
replacement shelter.

## Command preconditions

Before accepting a command, the server checks current shelter ownership, entity version, state,
available coins or charges, target visibility, resident/field roster, and the relevant mission or
combat lock. A stale page can request a command, but the server must return a typed rejection with
the current state version.

## Residents and home anchor

Soldiers inside the shelter are resident entities. They can be idle, assigned to guard, recovering,
or receiving a new role. Soldiers outside remain field entities until they return, die, or are
converted by a breach. The home anchor is the authoritative return target even while the shelter
moves; it is not a second shelter.

## Invariants

- Each player has one shelter in the initial model.
- A shelter keeps its identity across migration and recovery.
- Shelter-held coins cannot be looted through a field encounter.
- The command surface cannot bypass role lock, combat lock, migration, or breach state.
- A breach transaction and a recovery command are separate state transitions.

## Open decisions

- which commands remain available during `BREACHED` and `RECOVERING`;
- whether residents can be reassigned while recovery is active;
- minimum shelter level and damaged-core defense; and
- exact shelter-level effects on movement, detection, defense, and roster capacity.

## Related documents

- [`02-shelter-and-migration.md`](02-shelter-and-migration.md) — family overview;
- [`detail-04-shelter-sensing.md`](detail-04-shelter-sensing.md);
- [`detail-05-shelter-upgrades-and-progression.md`](detail-05-shelter-upgrades-and-progression.md);
- [`detail-15-shelter-defense-and-turrets.md`](detail-15-shelter-defense-and-turrets.md); and
- [`detail-16-siege-assault-and-breach.md`](detail-16-siege-assault-and-breach.md).

