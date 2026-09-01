# Soldier Roles and Missions

**Status:** Working decision from owner discussion

This is a family overview for M06–M08. The atomic authorities are
[`detail-06-soldier-identity-and-lifecycle.md`](detail-06-soldier-identity-and-lifecycle.md),
[`detail-07-role-and-loadout-lock.md`](detail-07-role-and-loadout-lock.md), and
[`detail-08-mission-dispatch-return-and-recall.md`](detail-08-mission-dispatch-return-and-recall.md).

## Roles

| Role | Primary mission | Default equipment | Field combat posture |
|---|---|---|---|
| Gatherer | collect Wood, Rock, or gold | axe or pickaxe; hammer fallback | can fight with a low tool-based modifier |
| Hunter | hunt monsters for value | sword | strong against monsters and ordinary field targets |
| Siege soldier | attack a discovered shelter | sword and siege supplies | group-capable, strong against structures |
| Guard | defend the shelter | weapon and defensive equipment | remains at the shelter and joins turret defense |

A role is a mission loadout, not a permanent class. A soldier can take a new role only after it
returns to the shelter, respawns there, or reaches a terminal mission state.

## Mission record

Every mission records its role, equipment tier, target, route, return policy, start time, current
phase, cargo, and failure policy. The server rejects an in-field role switch.

Each soldier has one active player-assigned mission at a time. An automatic encounter is a passive
interrupt resolved by the world, not a second mission that the player can assign in the field. A new
active objective requires the soldier to return to the shelter and receive a new role, tool, target,
and route.

## Mission phases

```text
AT_SHELTER
→ DEPLOYING
→ WORKING
→ RETURNING
→ DEPOSITING
→ AT_SHELTER
```

A contact inserts `ENGAGING` between `WORKING` and `RETURNING`. A death inserts
`RESPAWNING_AT_SHELTER`. A siege party can use `MARCHING`, `ASSAULTING`, `RETREATING`, and
`RETURNING`.

## Return rules

- `WHEN_FULL` starts a return when cargo reaches capacity.
- `ON_SUCCESS` returns after the target objective completes.
- `ON_RECALL` queues a return from the current phase.
- A forced recall never teleports, changes role, or bypasses an active combat resolution.
- A repeatable gathering or hunting mission can restart after deposit.
- A one-shot siege mission ends after success, failure, or soldier death.

## Death rules

Ordinary death is an immediate shelter respawn with the same soldier identity and no respawn cooldown
or replacement fee in this baseline. A gatherer or hunter reissues its role-locked objective from the
shelter under the recorded restart policy and pays the time cost of travelling again. The exposed
cargo is lost or transferred according to the combat rule. A siege soldier's mission ends on death.

## Siege parties

A siege party is formed at the shelter and receives one target coordinate, one route, and one party
mission record. The party is resolved as one formation for movement and combat, with a diminishing
return on additional soldiers. A member death reduces party strength; the party can retreat or fail
when it falls below its declared minimum.
