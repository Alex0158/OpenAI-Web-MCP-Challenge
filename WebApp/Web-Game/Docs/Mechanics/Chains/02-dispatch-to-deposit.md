# Chain C02: Dispatch to Deposit

**Status:** G2 chain accepted; extraction cadence, the bounded `RETURNING` handoff, the same-worker contest outcome, return-navigation/home crossing, and deposit settlement are runtime-verified locally under [`SK-TASK-029`](../../Tasks/SK-TASK-029-cp10-first-extraction-and-cargo.md) through [`SK-TASK-033`](../../Tasks/SK-TASK-033-cp10-deposit-and-coin-settlement.md)

## Trigger and outcome

The shelter assigns one resident soldier a role, tool, target, route, and return policy. The chain
ends in shelter coins, exposed cargo loss, a retryable mission state, or a terminal mission result.

## Ordered flow

1. `M03`, `M06`, and `M07` validate ownership, resident status, role/loadout, and one active mission.
2. `M08` creates a new `mission_attempt_id` and commits the mission record.
3. `M09` plans a route and arms its arrival due marker on `M01` world time; the movement phase
   derives transit and commits `TRAVELLING → WORKING` at that boundary. The verified CP-10 handoff
   arms the first extraction marker two world seconds after arrival.
4. `M11` extracts one typed Wood/Rock resource unit into the provenance cargo stack in one
   node/cargo/event transaction while capacity and node quantity remain valid; the active CP-10
   cadence repeats this at the paired due marker until a stop handoff. Same-worker same-node due
   attempts use the deterministic attempt order; a later attempt that reloads a node depleted in this
   boundary enters `RETURNING` with `TARGET_DEPLETED` and preserves existing cargo. A pre-empty node
   with no cargo remains `TARGET_UNAVAILABLE`.
5. `M08` switches to `RETURNING` when full or when a recall is accepted; recall never teleports.
6. `M09` reverses the immutable route and brings the soldier to the persisted shelter `home_anchor`;
   the movement phase commits `RETURNING → DEPOSITING` and emits `MissionHomeReached` once. This
   bounded boundary is runtime-verified in [`../../Evidence/SK-EVID-021-cp10-return-navigation-runtime-verification.md`](../../Evidence/SK-EVID-021-cp10-return-navigation-runtime-verification.md) and reviewed in [`../../Validation/32-cp10-return-navigation-runtime-cross-functional-audit.md`](../../Validation/32-cp10-return-navigation-runtime-cross-functional-audit.md).
7. `M11` deposits cargo atomically and converts it to coins. The runtime-verified implementation
   boundary is [`SK-TASK-033`](../../Tasks/SK-TASK-033-cp10-deposit-and-coin-settlement.md), under
   [`ADR-GAME-0024`](../../Decisions/ADR-GAME-0024-cp10-deposit-and-coin-settlement.md) with evidence
   in [`../../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md`](../../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md) and review in [`../../Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md`](../../Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md); it returns the same soldier to `AT_SHELTER` and preserves the completed attempt as history.
8. `M08` permits a later manual dispatch to reuse the completed resident mission row with a fresh
   attempt; automatic target selection, repeatable reissue, and one-shot closure remain separate.

## Failure branches

- Invalid role, target, version, or shelter state rejects dispatch before any cargo exists.
- A route becomes invalid and requires replanning or a typed failure.
- A passive encounter interrupts the mission and transfers control to C03 or C04.
- Death loses or transfers cargo and enters C07.
- A breach ends the mission and sends field soldiers to C05/C07.

## Invariants and events

No coin exists before deposit. Cargo remains exposed until deposit, and one mission attempt cannot
deposit the same cargo twice. The G2 event vocabulary is `MissionDispatched`, `MissionWorking`,
`CargoExtracted`, `MissionAutoReturned`, `MissionRecalled`, `MissionHomeReached`, `CargoDeposited`, `CoinsCredited`,
`ResourceDepleted`, and `MissionReissued`. Encounter and death branches use the canonical events owned
by C03/C04/C07, including `EncounterLocked`, `BattleRoundResolved`, `EncounterResolved`,
`SoldierDied`, `CargoLostToMonster`, and `SoldierRespawned`; any post-G2 event still requires a later
contract revision.

## Open decisions

Failed-target retry, future fresh-target selection after restart, and siege-specific retry remain
`OPEN`. G2 capacity, partial node depletion, partial extraction, and deposit ordering are fixed by
[`../../Engineering/09-mvp-contract-sheet.md`](../../Engineering/09-mvp-contract-sheet.md). The
recurring cadence and capacity/depletion return handoff are verified under
[`../../Tasks/SK-TASK-030-cp10-extraction-cadence-and-return-handoff.md`](../../Tasks/SK-TASK-030-cp10-extraction-cadence-and-return-handoff.md), with runtime evidence in
[`../../Evidence/SK-EVID-019-cp10-extraction-cadence-runtime-verification.md`](../../Evidence/SK-EVID-019-cp10-extraction-cadence-runtime-verification.md) and review in
  [`../../Validation/28-cp10-extraction-cadence-runtime-cross-functional-audit.md`](../../Validation/28-cp10-extraction-cadence-runtime-cross-functional-audit.md). The selected contest outcome is defined by
  [`../../Decisions/ADR-GAME-0022-cp10-contested-node-outcome.md`](../../Decisions/ADR-GAME-0022-cp10-contested-node-outcome.md), runtime-verified in [`../../Tasks/SK-TASK-031-cp10-contested-node-outcome.md`](../../Tasks/SK-TASK-031-cp10-contested-node-outcome.md), and reviewed in [`../../Evidence/SK-EVID-020-cp10-contested-node-runtime-verification.md`](../../Evidence/SK-EVID-020-cp10-contested-node-runtime-verification.md) and [`../../Validation/30-cp10-contested-node-runtime-cross-functional-audit.md`](../../Validation/30-cp10-contested-node-runtime-cross-functional-audit.md).

## Related mechanisms

- [`../detail-08-mission-dispatch-return-and-recall.md`](../detail-08-mission-dispatch-return-and-recall.md);
- [`../detail-09-navigation-and-pathfinding.md`](../detail-09-navigation-and-pathfinding.md); and
- [`../detail-11-resource-extraction-cargo-and-deposit.md`](../detail-11-resource-extraction-cargo-and-deposit.md).

The first extraction boundary and its claim limits are recorded in
[`../../Evidence/SK-EVID-018-cp10-first-extraction-runtime-verification.md`](../../Evidence/SK-EVID-018-cp10-first-extraction-runtime-verification.md)
and [`../../Validation/26-cp10-first-extraction-runtime-cross-functional-audit.md`](../../Validation/26-cp10-first-extraction-runtime-cross-functional-audit.md).

The deposit and coin settlement boundary is runtime-verified under
[`../../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md`](../../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md)
and reviewed in [`../../Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md`](../../Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md).
