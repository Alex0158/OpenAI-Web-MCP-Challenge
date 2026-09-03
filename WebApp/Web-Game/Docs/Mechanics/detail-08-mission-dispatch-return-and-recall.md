# Mission Dispatch, Return, and Recall

**Mechanism:** M08
**Status:** G2 mission lifecycle and phase contract accepted; CP-09 dispatch/route-arrival, CP-10 extraction/cadence/`RETURNING`/same-worker contest/return-navigation/deposit, CP-11 HUNTER victory/return plus bounded danger-cell reissue/review, and the CP-13 server-authoritative recall transition are runtime-verified locally under [`SK-TASK-027`](../Tasks/SK-TASK-027-cp09-gatherer-dispatch-and-role-lock.md) through [`SK-TASK-036`](../Tasks/SK-TASK-036-cp11-danger-cell-reissue-and-anti-loop.md) and [`SK-TASK-060`](../Tasks/SK-TASK-060-cp13-recall-transition-implementation.md); page registration and Agent/Re-entry delivery remain open
**Authority:** This file owns the mission phase and command transitions. The contract sheet mirrors
the phase values; M13 owns the separate encounter state machine, while roles, navigation, cargo, and
combat own their linked rules.

## Mission record

Every mission attempt stores:

- `mission_attempt_id` and stable `soldier_id`;
- role and equipment tier;
- target node, actor, or shelter intelligence id;
- committed route and home anchor reference;
- return policy;
- start and last transition world time;
- current phase and entity version;
- cargo state and capacity; and
- death, failure, and restart policy.

## State machine

The G2 mission phase is separate from the soldier lifecycle and the passive encounter status:

```text
mission.phase: AT_SHELTER → TRAVELLING → WORKING → RETURNING → DEPOSITING → AT_SHELTER
                           ↘ WAITING_REVIEW or TERMINAL
soldier.lifecycle: AT_SHELTER | FIELD | DEAD | CORRUPTED_MONSTER
encounter.status: NONE | OBSERVED | CONTACT | LOCKED | RESOLVING | RESOLVED
```

Dispatch moves a resident soldier directly to `FIELD` and its mission to `TRAVELLING`. It records a
server-owned route plan and its deterministic arrival due metadata; a later worker-owned movement
milestone advances that plan. A successful arrival arms the first extraction due marker for the
accepted two-world-second interval; the recurring extraction handler advances paired markers by two
seconds and atomically hands full or depleted attempts to `RETURNING`. A HUNTER arrival instead keeps
`next_extraction_due_world_time = null`; victory resolves its encounter, marks the seeded monster
`DEAD`, and hands the same mission to `RETURNING` without cargo or coin settlement. A same-worker attempt that
reloads a target depleted by an earlier ordered attempt uses the selected deterministic loser handoff
to `RETURNING` without a node mutation; a pre-empty target with no cargo remains a typed
`TARGET_UNAVAILABLE` recovery outcome. A returning G2 attempt reverses its immutable route and enters
`DEPOSITING` exactly at its persisted home anchor under the separate `MissionHomeReached` event; cargo
and soldier lifecycle remain unchanged for the later deposit phase. Extraction remains a separate
phase handler. A passive encounter
attaches an `encounter_id` and status without introducing an `ENGAGING` mission phase; extraction
pauses while the encounter is locked or resolving. `DEAD` and respawn are lifecycle states and events,
not mission phases. Siege may add `MARCHING`, `ASSAULTING`, `RETREATING`, and
`SIEGE_TERMINAL` only in a later contract version.

## Dispatch

The shelter accepts dispatch only when the soldier is resident, the shelter state permits deployment,
the target is visible or otherwise legally known, the role/loadout is valid, and the expected entity
versions still match. Dispatch commits the mission, sets `mission.phase = TRAVELLING` and
`soldier.lifecycle = FIELD`, records the route handoff and due metadata, and reserves no hidden
outcome. It does not process the milestone or advance world time on its own; the worker applies the
first travel milestone in a later due-work transaction.

## Return policies

- `WHEN_FULL`: cargo reaching capacity switches the mission to `RETURNING`.
- `ON_TARGET_DEPLETED`: an empty resource node switches to `RETURNING` with partial cargo.
- `ON_RECALL`: a shelter command queues return from the current non-terminal phase.

Recall never teleports, changes role, clears cargo risk, or bypasses an active combat resolution. A
returning soldier still follows navigation and can encounter an actor.

For a recall that begins before the committed target, the outbound `MissionRoutePlan` remains
immutable. The server derives the current route position from the authoritative recall world time and
reverses only the travelled prefix to the persisted home anchor; it does not persist a client waypoint
cursor or create a second movement authority. The verified local transition and restart behavior are
recorded in [`SK-EVID-046`](../Evidence/SK-EVID-046-cp13-recall-transition-runtime-verification.md) and
[`Validation/73`](../Validation/73-cp13-recall-transition-runtime-cross-functional-audit.md).

## Completion and restart

At `DEPOSITING`, the server settles cargo into the shelter wallet, records the conversion, returns the
mission to `AT_SHELTER` with no active attempt, and keeps the completed attempt as terminal history.
The G2 gatherer settlement boundary emits `CargoDeposited` and a positive `CoinsCredited` event exactly
once; the HUNTER victory path instead emits an empty `CargoDeposited` with
`settlementReason = HUNTER_VICTORY`, zero coin delta, and no `CoinsCredited` event. Both paths preserve
the same identity and terminal history. The local HUNTER boundary is evidenced in
[`../Evidence/SK-EVID-024-cp11-hunter-victory-runtime-verification.md`](../Evidence/SK-EVID-024-cp11-hunter-victory-runtime-verification.md)
and reviewed in [`../Validation/38-cp11-hunter-victory-runtime-cross-functional-audit.md`](../Validation/38-cp11-hunter-victory-runtime-cross-functional-audit.md). The existing gatherer boundary is runtime-verified in
[`../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md`](../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md) and reviewed in [`../Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md`](../Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md). Automatic target selection and reissue remain separate. A siege is one-shot: success, failed assault, retreat, or soldier death ends
the attempt. An ordinary death moves the failed attempt to `TERMINAL`, respawns the same identity at
home, and applies the bounded monster reissue policy recorded in the contract; no new role selection
is required for its one allowed continuation. In G2, the accepted reissue keeps the role and resource
target, creates a fresh route, and creates a fresh `mission_attempt_id`. The runtime proof is bounded
to the CP-11 worker-owned policy in [`../Evidence/SK-EVID-025-cp11-danger-cell-reissue-runtime-verification.md`](../Evidence/SK-EVID-025-cp11-danger-cell-reissue-runtime-verification.md) and its cross-functional audit in [`../Validation/40-cp11-danger-cell-reissue-runtime-cross-functional-audit.md`](../Validation/40-cp11-danger-cell-reissue-runtime-cross-functional-audit.md).

## Failure and cancellation

The player cannot cancel a committed mission by changing a UI value. A forced recall is the explicit
return command. A mission can fail because the target is gone, a route is invalid, the shelter has
breached, the actor wins, or the target intelligence is stale. The server records a typed failure and
the next valid action. A blocked reissue or repeated monster death uses `WAITING_REVIEW` with a typed
reason and does not retry automatically.

## Invariants

- One soldier has at most one active player-assigned mission and at most one attached resolving
  encounter; the seeded monster has at most one active HUNTER reservation while any HUNTER mission is
  active, including `RETURNING`.
- Each transition validates the mission version and writes an event once.
- Mission history retains route, cargo, phase, outcome, and cause.
- A field role cannot be changed by editing a pending command.

## Open decisions

- retry after a stale resource or failed siege;
- whether a later repeatable mission requests a fresh target observation;
- siege-specific terminal and retry policy; and
- post-G2 continuation eligibility beyond the accepted `CargoLostToMonster` event.

## Related documents

- [`03-soldier-roles-and-missions.md`](03-soldier-roles-and-missions.md) — family overview;
- [`detail-06-soldier-identity-and-lifecycle.md`](detail-06-soldier-identity-and-lifecycle.md);
- [`detail-09-navigation-and-pathfinding.md`](detail-09-navigation-and-pathfinding.md);
- [`detail-11-resource-extraction-cargo-and-deposit.md`](detail-11-resource-extraction-cargo-and-deposit.md); and
- [`Chains/02-dispatch-to-deposit.md`](Chains/02-dispatch-to-deposit.md).
