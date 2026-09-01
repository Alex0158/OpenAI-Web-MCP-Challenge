# Encounter and Combat Resolution

**Mechanism:** M13
**Status:** G2 deterministic combat contract accepted; full-game balance is open
**Authority:** This file owns detection-to-contact locking and combat resolution. Loot, defense, and
breach own their settlement consequences.

## Encounter phases

```text
UNSEEN → OBSERVED → CONTACT → LOCKED → RESOLVING → RESOLVED
```

Sensor range creates an observation. Physical contact inside the engagement radius creates an
encounter. The server then locks participants by entity version so two workers cannot resolve the
same soldier, monster, or shelter twice.

## Soldier sensor stage

Each field soldier has a sensor radius that is checked against nearby soldiers, monsters, and target
shelters. The radius can differ by soldier level, role, equipment, or accepted sensing upgrade. A
larger radius creates earlier awareness and can influence pursuit or retreat, but it does not reveal
hidden shelter positions through a veil and does not determine combat victory. The exact sensor
payload is owned by the visibility and intelligence rules; this mechanism owns the transition from a
valid observation to contact.

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

G2 resolves one round per world second, uses speed for initiative with ascending entity-id tie-breaks,
and has no random rolls, critical hits, or hidden party modifier. The accepted actor values are in
[`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md). Full-game
matchups, party aggregation, retreat, and siege modifiers remain open.

## Resolution

The server creates one encounter record, claims the participants, resolves bounded rounds or a short
combat window, commits winner and loser states, invokes the appropriate cargo/reward settlement, and
emits a typed event. The event seed, participant versions, and formula inputs must be recorded so the
dashboard can explain the result.

## Role posture

- Gatherer: strong extraction, weak tool-based fallback combat.
- Hunter: sword and monster matchup bonus.
- Siege soldier: sword plus structure damage; party-capable.
- Guard: resident defense contribution with shelter and turret support.

Detection and speed affect who meets whom and whether a soldier can escape or return. They do not
silently replace attack and defense.

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

- production base HP, attack, defense, speed, and tool values;
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
