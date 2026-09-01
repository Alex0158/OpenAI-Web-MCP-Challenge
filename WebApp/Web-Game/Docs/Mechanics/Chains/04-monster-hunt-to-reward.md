# Chain C04: Monster Hunt to Reward

**Status:** Working design; monster value and target policy are open

## Trigger and outcome

A hunter receives a monster target and attempts to turn a generated or corrupted world actor into
value. The chain ends in a monster reward, a hunter death and cargo loss, or a changed target state.

## Ordered flow

1. `M08` validates a hunter role, sword loadout, target observation, route, and return policy.
2. `M09` moves the hunter toward the target while `M12` changes the monster through patrol, alert,
   chase, and attack states.
3. Sensor contact enters `M13` combat with the hunter's monster matchup modifier.
4. If the hunter wins, `M14` settles the monster's typed value, coin reward, or future world drop.
5. The hunter returns through C02 and deposits any cargo.
6. If the monster wins, C07 settles cargo loss and same-identity respawn unless breach state applies.

## Failure branches

- Monster leaves the target policy or retreats; the mission may retry or terminate.
- A stale target causes a search or typed failure.
- A corrupted soldier has no player command link and cannot be restored by the hunter.

## Invariants and events

Monster death and its reward settle once. A monster kill cannot create a duplicate soldier, and the
killing monster continues under its normal state machine. Candidate events are `MonsterTargeted`,
`MonsterStateChanged`, `MonsterDefeated`, `CargoLostToMonster`, and `SoldierRespawned`.

## Open decisions

Species, target switching, reward representation, and any future monster drop remain `OPEN`.

## Related mechanisms

- [`../detail-12-monster-state-and-targeting.md`](../detail-12-monster-state-and-targeting.md);
- [`../detail-13-encounter-and-combat-resolution.md`](../detail-13-encounter-and-combat-resolution.md); and
- [`../detail-11-resource-extraction-cargo-and-deposit.md`](../detail-11-resource-extraction-cargo-and-deposit.md).
