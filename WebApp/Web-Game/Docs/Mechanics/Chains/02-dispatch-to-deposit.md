# Chain C02: Dispatch to Deposit

**Status:** Working decision; retry and partial-success rules are open

## Trigger and outcome

The shelter assigns one resident soldier a role, tool, target, route, and return policy. The chain
ends in shelter coins, exposed cargo loss, a retryable mission state, or a terminal mission result.

## Ordered flow

1. `M03`, `M06`, and `M07` validate ownership, resident status, role/loadout, and one active mission.
2. `M08` creates a new `mission_attempt_id` and commits the mission record.
3. `M09` plans a route and schedules travel milestones on `M01` world time.
4. `M11` extracts typed resources into soldier cargo while capacity and node quantity remain valid.
5. `M08` switches to `RETURNING` when full or when a recall is accepted; recall never teleports.
6. `M09` brings the soldier to the current shelter `home_anchor`.
7. `M11` deposits cargo atomically and converts it to coins.
8. `M08` restarts a repeatable gathering/hunting mission or closes the one-shot attempt.

## Failure branches

- Invalid role, target, version, or shelter state rejects dispatch before any cargo exists.
- A route becomes invalid and requires replanning or a typed failure.
- A passive encounter interrupts the mission and transfers control to C03 or C04.
- Death loses or transfers cargo and enters C07.
- A breach ends the mission and sends field soldiers to C05/C07.

## Invariants and events

No coin exists before deposit. Cargo remains exposed until deposit, and one mission attempt cannot
deposit the same cargo twice. Candidate events are `MissionStarted`, `MissionAutoReturned`,
`MissionRecalled`, `ResourceExtracted`, `CargoDeposited`, and `MissionCompleted`.

## Open decisions

Capacity units, partial node depletion, partial extraction, failed-target retry, and fresh-target
selection after restart remain `OPEN`.

## Related mechanisms

- [`../detail-08-mission-dispatch-return-and-recall.md`](../detail-08-mission-dispatch-return-and-recall.md);
- [`../detail-09-navigation-and-pathfinding.md`](../detail-09-navigation-and-pathfinding.md); and
- [`../detail-11-resource-extraction-cargo-and-deposit.md`](../detail-11-resource-extraction-cargo-and-deposit.md).

