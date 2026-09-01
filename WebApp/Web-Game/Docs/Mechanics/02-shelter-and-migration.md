# Shelter and Migration

**Status:** Working decision from owner discussion

This is a family overview for M03 and M17. The separate authorities are
[`detail-03-shelter-state-and-command.md`](detail-03-shelter-state-and-command.md) and
[`detail-17-shelter-migration-and-veil.md`](detail-17-shelter-migration-and-veil.md).

## Shelter states

```text
STABLE → MIGRATING → STABLE
STABLE → BREACHED → RECOVERING → STABLE
```

A shelter keeps its identity while it moves. `BREACHED` represents a damaged magical core; it does
not delete the player's account or remove the only place from which play can continue.

## Migration rules

- The player selects a valid destination and pays the fee before movement starts.
- The command cannot be cancelled.
- Movement duration depends on distance, shelter size, and shelter speed; the final formula remains
  an open balance decision.
- A veil charge is consumed and the shelter gradually disappears from fresh discovery.
- Other players retain a time-stamped last-known position.
- Turrets stop firing for the entire migration.
- New field deployments are paused until arrival.
- Existing field soldiers continue their current missions.
- Returning soldiers target the moving shelter's `home_anchor` and can join it after arrival.
- An assault already committed at the shelter resolves before migration can be accepted.
- At arrival the new position becomes discoverable again and normal deployment resumes; cooldown
  timing follows the detailed migration contract and remains an open balance decision.

The initial charge model is one automatically recharged stored charge, with an expensive purchase
path for additional charges. A maximum stored-charge cap remains a balance setting.

## Breach recovery

A breach applies its penalty atomically, disables normal shelter operations for a recovery state, and
leaves a damaged core. The exact repair duration and cost are open tuning values. During recovery,
inside soldiers can remain in the roster while the player repairs the core; field soldiers already
converted to monsters cannot be recalled.
