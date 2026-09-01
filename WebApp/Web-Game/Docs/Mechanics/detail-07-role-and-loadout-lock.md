# Role and Loadout Lock

**Mechanism:** M07
**Status:** MVP role/loadout and combat values accepted; later equipment balance is open
**Authority:** This file owns the role-to-loadout contract. Mission lifecycle owns dispatch and
return; combat owns numerical resolution.

## Purpose

Define the four initial soldier roles and the point at which a role, tool, and posture become locked
for a field sortie.

## Roles

| Role | Active objective | Loadout | Field posture |
|---|---|---|---|
| Gatherer | collect Wood, Rock, or gold-bearing material | axe or pickaxe; hammer fallback | weak tool-based self-defense |
| Hunter | hunt monsters for value | sword | strong monster matchup |
| Siege soldier | attack a discovered shelter | sword and siege supplies | structure damage; party-capable |
| Guard | defend the shelter | weapon and defensive equipment | resident defense with turrets |

The role is a sortie loadout, not a permanent character class. The initial shelter has five
soldiers; a player decides how many are resident guards or field assignments.

## Lock boundary

At dispatch, the server commits the role, equipment tier, target, route, return policy, and death
policy to the mission attempt. The soldier cannot switch from gathering to hunting, siege, or guard
while in the field. It must return, respawn at home, or reach a terminal mission state before a new
role can be issued.

An automatic encounter is a passive world interrupt. It does not grant the soldier a new player
assigned role or allow it to equip a sword mid-route.

## Tools and combat posture

- A gatherer's axe or pickaxe provides extraction capability and low melee power.
- A hammer or carried gathering tool is the fallback when a gatherer is attacked.
- A hunter's sword provides the intended monster matchup.
- A siege loadout adds structure damage and may reduce movement or capacity.
- A guard's defensive equipment contributes to shelter defense and is not a field mission by
  default.

The G2 tool power and role modifiers are fixed by
[`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md). Future tool
weight, durability, repair, and additional-role values remain `OPEN`. A role must never silently gain
the benefits of an uncarried tool.

## Invariants

- One soldier has one active role-locked mission.
- Tool tier is checked against the target resource or combat context.
- A role change is a shelter command and receives a new mission attempt id.
- A passive encounter cannot be used to bypass role lock or human approval boundaries.

## Open decisions

- later tool tiers, weight, durability, and repair behavior;
- whether future roles may share a loadout; and
- the precise guard contribution to shelter defense.

## Related documents

- [`03-soldier-roles-and-missions.md`](03-soldier-roles-and-missions.md) — family overview;
- [`detail-06-soldier-identity-and-lifecycle.md`](detail-06-soldier-identity-and-lifecycle.md);
- [`detail-08-mission-dispatch-return-and-recall.md`](detail-08-mission-dispatch-return-and-recall.md); and
- [`detail-13-encounter-and-combat-resolution.md`](detail-13-encounter-and-combat-resolution.md).
