# Chain C03: Encounter to Loot

**Status:** G2 deterministic combat accepted; post-G2 numerical resolution is open

## Trigger and outcome

Two field actors discover and contact each other. The chain ends with a server-authoritative combat
result, exactly-once PvP cargo transfer, loser death, and ordinary respawn or terminal mission state.

## Ordered flow

1. `M01` advances both missions and `M12`/`M09` provide current positions.
2. The soldier-sensor stage of `M13` records an observation when a valid field sensor sees an actor.
3. Contact inside the inclusive `engagement_radius_tiles = 1.0` creates one locked encounter under
   `M13`.
4. `M13` resolves bounded rounds using role, tool, level, health, attack, defense, `initiative_speed`,
   accepted formula.
5. `M14` transfers the loser's unbanked PvP cargo to the winner once.
6. `M06` marks the loser dead and enters ordinary respawn or a mission terminal state.
7. `M08` returns or restarts the winner according to its existing mission and cargo policy.
8. The dashboard and eligible event hook receive the causal result.

## Failure branches

- Actors leave contact before lock; the observation remains but no battle occurs.
- A version conflict aborts the lock without changing cargo.
- A siege party uses C05 instead of this single-soldier chain.
- A monster target uses C04; the cargo rule differs from PvP loot.

## Invariants and events

One participant cannot be in two resolving encounters. Combat cannot mint coins directly. The G2 event
vocabulary is `ActorObserved`, `EncounterLocked`, `BattleRoundResolved`, `EncounterResolved`, and `SoldierDied`;
`CargoLooted` is reserved for a post-G2 PvP transfer. `BattleRoundResolved` is emitted once per round,
while `EncounterResolved` is emitted once for the terminal encounter result. The older
`SoldierEncountered` and `BattleResolved` names are retired from authoritative handlers.

## Open decisions

Post-G2 base-stat tuning, randomness, flee behavior, winner capacity overflow, and exact role modifiers
remain `OPEN`. G2 round cadence, initiative field, formula, and seeded actor values are fixed by the
contract.

## Related mechanisms

- [`../detail-13-encounter-and-combat-resolution.md`](../detail-13-encounter-and-combat-resolution.md);
- [`../detail-14-loot-reward-and-atomic-transfer.md`](../detail-14-loot-reward-and-atomic-transfer.md); and
- [`../detail-06-soldier-identity-and-lifecycle.md`](../detail-06-soldier-identity-and-lifecycle.md).
