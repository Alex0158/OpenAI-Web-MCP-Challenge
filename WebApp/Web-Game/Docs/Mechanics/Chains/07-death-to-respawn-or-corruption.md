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
4. `M08` consumes the one G2 monster reissue budget, records the integer danger cell, and makes one
   deterministic route replan that excludes that cell and its one-tile neighbourhood. A missing safe
   route leaves the soldier at home in `WAITING_REVIEW` with `NO_SAFE_REISSUE_ROUTE`.
5. If the reissued attempt dies to a monster before a successful deposit, the budget is exhausted and
   the soldier remains at home in `WAITING_REVIEW` with `REPEATED_MONSTER_DEATH`; no further automatic
   reissue occurs. A successful deposit or new manual dispatch resets the budget. A siege remains
   terminal.
6. The dashboard records location, cause, cargo outcome, reissue budget, danger cell, and next valid
   action.

The bounded CP-11 reissue and review outcomes are runtime-verified for the local file-backed worker
scope in [`SK-EVID-025`](../../Evidence/SK-EVID-025-cp11-danger-cell-reissue-runtime-verification.md)
and [`Validation/40`](../../Validation/40-cp11-danger-cell-reissue-runtime-cross-functional-audit.md).
Browser, scheduler, WebMCP/Re-entry, hosted, and broader breach claims remain separate gates.

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
preserved through ordinary death but not through a converted monster entity. G2 events are
`SoldierDied`, `SoldierRespawned`, `CargoLostToMonster`, and `MissionReissued`; `SoldierCorrupted` is
reserved for the post-G2 breach path.

## Open decisions

Boundary crossing at breach time, resident deaths, and future repeatable-mission variants remain
`OPEN`.

## Related mechanisms

- [`../detail-06-soldier-identity-and-lifecycle.md`](../detail-06-soldier-identity-and-lifecycle.md);
- [`../detail-08-mission-dispatch-return-and-recall.md`](../detail-08-mission-dispatch-return-and-recall.md); and
- [`../detail-16-siege-assault-and-breach.md`](../detail-16-siege-assault-and-breach.md).
