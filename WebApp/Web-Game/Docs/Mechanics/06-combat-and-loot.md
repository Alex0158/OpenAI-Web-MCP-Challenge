# Combat and Loot

**Status:** Combat framework open for co-design; transaction rules are a working decision

This is a family overview for M13–M15. The detailed authorities are
[`detail-13-encounter-and-combat-resolution.md`](detail-13-encounter-and-combat-resolution.md),
[`detail-14-loot-reward-and-atomic-transfer.md`](detail-14-loot-reward-and-atomic-transfer.md),
and [`detail-15-shelter-defense-and-turrets.md`](detail-15-shelter-defense-and-turrets.md).

## Shared inputs

The first formula should use the same small set of inputs for soldier-versus-soldier,
soldier-versus-monster, and siege combat:

- effective health;
- attack power;
- defense;
- weapon or tool power;
- role matchup modifier;
- soldier or monster level;
- movement and initiative modifiers; and
- shelter or turret contribution for an assault.

A readable placeholder is:

```text
damage = max(1, effective_attack × matchup_modifier + tool_power - effective_defense)
```

The exact values, round timing, critical effects, randomness, and party diminishing-return function
are intentionally open. Outcomes should be server-authoritative, deterministic for a given event
seed, and explainable in the dashboard.

## Role posture

Gathering tools provide weak fallback melee power. Swords provide stronger unit combat. Siege gear
adds structure damage and may reduce speed. A hunter receives a monster matchup bonus. Detection
range and movement speed influence who meets whom and whether a soldier gets home; they do not
silently replace attack and defense.

## Resolution

The server creates an encounter record, locks the participants, resolves rounds or a short bounded
combat window, commits the winner and loser, transfers or destroys cargo exactly once, and appends a
typed event. A repeated request with the same event id cannot duplicate a reward.

## Loot

- PvP winner receives the loser's unbanked cargo.
- A monster kill destroys the soldier's unbanked cargo; the killer remains in the normal monster
  state machine.
- A soldier's wallet is never spent or looted while it remains inside the shelter.
- A successful siege creates a separate, exactly-once shelter reward transfer. It is distinct from
  field-soldier cargo and from the defender's breach penalty, even when all three are committed in
  one atomic breach transaction.
