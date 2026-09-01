# Mission Dispatch, Return, and Recall

**Mechanism:** M08
**Status:** Working decision; retry semantics are open
**Authority:** This file owns the mission state machine and command transitions. Roles, navigation,
cargo, and combat own their linked rules.

## Mission record

Every mission attempt stores:

- `mission_attempt_id` and stable `soldier_id`;
- role and equipment tier;
- target node, actor, or shelter intelligence id;
- committed route and home anchor reference;
- return policy;
- start and last transition world time;
- current phase and entity version;
- cargo snapshot and capacity; and
- death, failure, and restart policy.

## State machine

```text
AT_SHELTER → DEPLOYING → TRAVELLING → WORKING → RETURNING → DEPOSITING → AT_SHELTER
                         ↘ ENGAGING ↗
                         ↘ DEAD → RESPAWNING_AT_SHELTER
                         ↘ TERMINAL_FAILURE
```

Siege adds `MARCHING`, `ASSAULTING`, `RETREATING`, and `SIEGE_TERMINAL`. An encounter is a passive
interrupt inside an active mission, not a second player-assigned mission.

## Dispatch

The shelter accepts dispatch only when the soldier is resident, the shelter state permits deployment,
the target is visible or otherwise legally known, the role/loadout is valid, and the expected entity
versions still match. Dispatch commits the mission, reserves no hidden outcome, and schedules the
first travel milestone.

## Return policies

- `WHEN_FULL`: cargo reaching capacity switches the mission to `RETURNING`.
- `ON_SUCCESS`: completing a one-shot objective switches to `RETURNING`.
- `ON_RECALL`: a shelter command queues return from the current non-terminal phase.

Recall never teleports, changes role, clears cargo risk, or bypasses an active combat resolution. A
returning soldier still follows navigation and can encounter an actor.

## Completion and restart

At `DEPOSITING`, the server settles cargo into the shelter wallet, records the conversion, and then
marks a repeatable gathering or hunting mission complete or eligible for restart. A siege is one-shot:
success, failed assault, retreat, or soldier death ends the attempt. An ordinary death respawns the
same identity at home and reissues its repeatable gathering or hunting assignment under the mission's
recorded restart policy; no new role selection is required for that continuation.

## Failure and cancellation

The player cannot cancel a committed mission by changing a UI value. A forced recall is the explicit
return command. A mission can fail because the target is gone, a route is invalid, the shelter has
breached, the actor wins, or the target intelligence is stale. The server records a typed failure and
the next valid action.

## Invariants

- One soldier has at most one active player-assigned mission.
- Each transition validates the mission version and writes an event once.
- Mission history retains route, cargo, phase, outcome, and cause.
- A field role cannot be changed by editing a pending command.

## Open decisions

- partial extraction and partial return behavior;
- retry after a stale resource or failed siege;
- whether a repeatable mission keeps the same target or requests a fresh observation; and
- which mission events are continuation-eligible for Re-entry Core.

## Related documents

- [`03-soldier-roles-and-missions.md`](03-soldier-roles-and-missions.md) — family overview;
- [`detail-06-soldier-identity-and-lifecycle.md`](detail-06-soldier-identity-and-lifecycle.md);
- [`detail-09-navigation-and-pathfinding.md`](detail-09-navigation-and-pathfinding.md);
- [`detail-11-resource-extraction-cargo-and-deposit.md`](detail-11-resource-extraction-cargo-and-deposit.md); and
- [`Chains/02-dispatch-to-deposit.md`](Chains/02-dispatch-to-deposit.md).
