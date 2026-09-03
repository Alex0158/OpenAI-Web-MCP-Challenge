# Encounter and Combat Resolution

**Mechanism:** M13
**Status:** G2 deterministic combat contract accepted; GATHERER loss and HUNTER victory/return
boundaries are runtime-verified locally; full-game balance is open
**Authority:** This file owns detection-to-contact locking and combat resolution. Loot, defense, and
breach own their settlement consequences.

## Encounter status

```text
NONE → OBSERVED → CONTACT → LOCKED → RESOLVING → RESOLVED
```

Sensor range creates an observation. In G2, physical contact at inclusive Euclidean distance
`engagement_radius_tiles = 1.0` creates an encounter. The server then locks participants by entity
version so two workers cannot resolve the same soldier, monster, or shelter twice.

## Soldier sensor stage

Each field soldier has the uniform G2 `soldier_sensor_radius_tiles = 6.0`, checked against nearby
soldiers, monsters, and target shelters using inclusive Euclidean distance. A larger radius in a
future level, role, equipment, or sensing upgrade can create earlier awareness and influence pursuit
or retreat, but it does not reveal hidden shelter positions through a veil and does not determine
combat victory. The exact sensor payload is owned by the visibility and intelligence rules; this
mechanism owns the transition from a valid observation to contact.

## Shared combat inputs

The same explainable framework applies to soldier-versus-soldier, soldier-versus-monster, and siege:

- effective health;
- attack and defense;
- weapon, tool, or siege power;
- role matchup modifier;
- soldier or monster level;
- movement and initiative modifiers;
- shelter and turret contribution for an assault; and
- party aggregation and diminishing return for a siege group.

The accepted G2 contract is:

```text
damage = max(1, attack + weapon_power + matchup_bonus - defense)
```

G2 resolves one round per world second, uses `initiative_speed` for initiative with ascending
entity-id tie-breaks, and has no random rolls, critical hits, or hidden party modifier. The accepted
actor values are in
[`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md). Full-game
matchups, party aggregation, retreat, and siege modifiers remain open.

## Resolution

The server creates one encounter record, claims the participants, resolves bounded rounds or a short
combat window, commits winner and loser states, invokes the appropriate cargo/reward settlement, and
emits `EncounterResolved` after the terminal round. Each round emits `BattleRoundResolved`. The event
seed, participant versions, and formula inputs must be recorded so the dashboard can explain the
result. The G2 HUNTER vector uses the typed HUNTER actor fields, resolves five rounds against the
seeded monster, emits `MonsterDefeated` after `EncounterResolved`, and hands the mission to normal
route-preserving return without creating cargo or coins. The local boundary is evidenced in
[`../Evidence/SK-EVID-024-cp11-hunter-victory-runtime-verification.md`](../Evidence/SK-EVID-024-cp11-hunter-victory-runtime-verification.md)
and reviewed in [`../Validation/38-cp11-hunter-victory-runtime-cross-functional-audit.md`](../Validation/38-cp11-hunter-victory-runtime-cross-functional-audit.md).

## Role posture

- Gatherer: strong extraction, weak tool-based fallback combat.
- Hunter: sword and monster matchup bonus.
- Siege soldier: sword plus structure damage; party-capable.
- Guard: resident defense contribution with shelter and turret support.

Detection and movement rates affect who meets whom and whether a soldier can escape or return;
`initiative_speed` affects combat order only. Neither silently replaces attack and defense.

## Party resolution

A siege party shares one target, route, and mission record. The first combat model aggregates members
with a diminishing-return function and records each member's contribution and death. Ordinary field
soldiers remain independent; they do not form a hidden collaboration group when they meet.

## Invariants

- A participant is in at most one resolving encounter.
- The same event id cannot resolve twice.
- Combat cannot directly mint coins; it calls a separate settlement rule.
- A client cannot choose the result or rewrite formula inputs.

## Open decisions

- production base HP, attack, defense, movement, initiative, and tool values;
- future round randomness and critical effects;
- full-game role matchups and monster bonuses;
- party aggregation and retreat threshold; and
- the exact assault commitment point during migration.

## Related documents

- [`06-combat-and-loot.md`](06-combat-and-loot.md) — family overview;
- [`detail-07-role-and-loadout-lock.md`](detail-07-role-and-loadout-lock.md);
- [`detail-12-monster-state-and-targeting.md`](detail-12-monster-state-and-targeting.md);
- [`detail-14-loot-reward-and-atomic-transfer.md`](detail-14-loot-reward-and-atomic-transfer.md); and
- [`detail-15-shelter-defense-and-turrets.md`](detail-15-shelter-defense-and-turrets.md).
