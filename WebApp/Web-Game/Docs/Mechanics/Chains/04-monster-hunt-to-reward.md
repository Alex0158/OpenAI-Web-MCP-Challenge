# Chain C04: Monster Hunt to Reward

**Status:** G2 seeded-hunt chain accepted; the seeded HUNTER victory and zero-cargo return are
runtime-verified locally; future monster value and target policy are open

## Trigger and outcome

A hunter receives a monster target and attempts to resolve a generated or corrupted world actor. In
G2 the chain ends in a cleared seeded threat with no direct reward, a hunter death and cargo loss, or
a changed target state; a future contract may add a monster value path.

## Ordered flow

1. `M08` validates a hunter role, sword loadout, target observation, route, and return policy.
2. `M09` moves the hunter toward the target while `M12` changes the monster through patrol, alert,
   chase, and attack states.
3. Sensor contact enters `M13` combat with the hunter's monster matchup modifier.
4. If the hunter wins in G2, `M12` retains the seeded row as `DEAD` history, removes it from active
   targeting, and emits `MonsterDefeated`; no third resource or direct coin reward is created. Future
   species value or world drops remain post-G2.
5. The hunter returns through C02 and completes an empty-cargo settlement marked
   `HUNTER_VICTORY`; no `CoinsCredited` event is emitted.
6. If the monster wins, C07 settles cargo loss and same-identity respawn unless breach state applies.

## Failure branches

- Monster leaves the target policy or retreats; the mission may retry or terminate.
- A stale target causes a search or typed failure.
- A corrupted soldier has no player command link and cannot be restored by the hunter.

## Invariants and events

Monster death and its terminal state settle once. The seeded monster has at most one active HUNTER
reservation, and the reservation remains through return until mission completion. A monster kill cannot
create a duplicate soldier, and the killing monster continues under its normal state machine. Candidate
events are `MonsterTargeted`, `MonsterStateChanged`, `MonsterDefeated`, `CargoLostToMonster`, and
`SoldierRespawned`.

## Open decisions

Production species, target switching, reward representation, and any future monster drop remain
`OPEN`.

## Related mechanisms

- [`../detail-12-monster-state-and-targeting.md`](../detail-12-monster-state-and-targeting.md);
- [`../detail-13-encounter-and-combat-resolution.md`](../detail-13-encounter-and-combat-resolution.md); and
- [`../detail-11-resource-extraction-cargo-and-deposit.md`](../detail-11-resource-extraction-cargo-and-deposit.md).
