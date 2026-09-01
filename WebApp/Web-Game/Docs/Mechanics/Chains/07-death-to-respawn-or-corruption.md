# Chain C07: Death to Respawn or Corruption

**Status:** Working decision; breach boundary cases remain open

## Trigger and outcome

A soldier loses a combat resolution or is caught in a shelter breach. The chain settles cargo first,
then produces ordinary same-identity respawn, a terminal siege attempt, or one uncontrolled monster.

## Ordinary death flow

1. `M13` commits the losing combat result and death cause.
2. `M14` transfers PvP cargo to the winner or destroys only the unbanked cargo on a monster kill; the
   respawned soldier has no recovered field cargo.
3. `M06` marks the current `mission_attempt_id` failed and respawns the same `soldier_id` at home.
4. `M08` reissues the repeatable gathering or hunting assignment from the shelter; a siege remains
   terminal.
5. The dashboard records location, cause, cargo outcome, and next valid action.

## Failure branches

- A version conflict aborts the death settlement without duplicating cargo or respawn.
- A breach changes the outcome from ordinary respawn to conversion for field soldiers outside the
  authoritative boundary.
- A terminal siege death does not silently restart the siege attempt.

## Breach conversion flow

1. C05 commits `ShelterBreached` and ends all active field missions.
2. `M06` checks the authoritative shelter boundary for each field soldier.
3. A soldier outside becomes one `ROAMING` monster and loses its command link.
4. Its cargo and mission attempt become terminal; no respawn copy is created.
5. Resident soldiers remain with the damaged core under the recovery rule.

## Invariants and events

The same soldier cannot both respawn and corrupt in one serialized event order. Stable identity is
preserved through ordinary death but not through a converted monster entity. Candidate events are
`SoldierDied`, `SoldierRespawned`, `CargoLostToMonster`, and `SoldierCorrupted`.

## Open decisions

Boundary crossing at breach time, resident deaths, and future repeatable-mission variants remain
`OPEN`.

## Related mechanisms

- [`../detail-06-soldier-identity-and-lifecycle.md`](../detail-06-soldier-identity-and-lifecycle.md);
- [`../detail-08-mission-dispatch-return-and-recall.md`](../detail-08-mission-dispatch-return-and-recall.md); and
- [`../detail-16-siege-assault-and-breach.md`](../detail-16-siege-assault-and-breach.md).
