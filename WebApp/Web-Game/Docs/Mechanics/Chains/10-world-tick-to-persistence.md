# Chain C10: World Tick to Persistence

**Status:** MVP clock and ordering accepted; the bounded CP-09 route-arrival and CP-10 extraction/cadence/`RETURNING`/same-worker contest/return-navigation/deposit boundaries are runtime-verified locally; full continuity and later gameplay remain unverified

## Trigger and outcome

World time advances whether or not a player is connected. The chain turns due milestones into durable
state and recoverable events, then resumes the same world after worker restart.

## Ordered flow

1. `M01` advances the monotonic world clock to the next accepted boundary.
2. The worker movement phase claims due route arrival using stable work identities,
   `next_due_world_time`, and entity versions persisted by CP-05. Arrival arms the next extraction
   marker; the extraction phase claims one due milestone using the same boundary. The active CP-10
   cadence boundary advances the marker by two seconds or hands off to `RETURNING` when capacity or
   target depletion is reached. Same-worker same-node candidates are ordered by due time and attempt
   id; a later candidate that reloads a node depleted by an earlier ordered attempt completes a
   target-depleted return instead of blocking the boundary, while a pre-empty no-cargo target remains
   a visible `TARGET_UNAVAILABLE` recovery. A `RETURNING` attempt is then due by its persisted handoff
   time plus the immutable route duration; movement derives the reversed route and commits exact home
   arrival to `DEPOSITING` before the deposit phase. The deposit phase validates cargo, credits the
   shelter, and releases the resident atomically. Later phases
   claim encounter, combat, migration, respawn, spawn, or leaderboard milestones using the same boundary.
3. The owning mechanism applies its state transition and emits a causal event in one transaction.
4. A periodic `world_snapshot` records the latest authoritative state; the Domain Event log retains
   every committed transition; and the outbox records eligible coalesced Agent Signals without
   carrying prompts or private context.
5. On worker restart, the service loads the `world_snapshot`, replays due milestones and unacknowledged
   outbox records, reclaims expired leases, and resumes from the committed world time.
6. The client reconnects, receives a full `client_snapshot`, interpolates the projection, and never
   reconstructs rewards locally.

## Failure branches

- A stale entity version or expired work lease causes the milestone to retry or fail visibly without a
  duplicate transition.
- A worker crash before commit leaves the milestone due; a crash after commit leaves an idempotent
  event and replayable outbox or Agent Signal record.
- Extreme downtime follows an accepted catch-up cap rather than silently skipping causal state.

## Invariants and evidence

World time, mission state, cargo, rewards, shelter, monster, and leaderboard projections remain
durable. Evidence must show restart recovery and world-clock continuity; a running process alone is
not proof. Candidate events include all Domain Events listed by the owning mechanisms. High-frequency
events may be coalesced for Agent delivery but cannot be dropped from the authoritative event history.
The `world_snapshot` is a persistence artifact; the `client_snapshot` is a replaceable,
player-scoped projection and must not be used for restart.

## Open decisions

Production replay cap, active-region approximation, long-offline presentation, and hosted
`client_snapshot` cadence remain `OPEN`. MVP world-time rate, bounded catch-up, same-time order,
durable `world_snapshot`, and local `client_snapshot` target are fixed by
[`../../Engineering/09-mvp-contract-sheet.md`](../../Engineering/09-mvp-contract-sheet.md).

## Related mechanisms

- [`../detail-01-world-clock-and-continuity.md`](../detail-01-world-clock-and-continuity.md);
- [`../detail-02-world-generation-and-resource-spawn.md`](../detail-02-world-generation-and-resource-spawn.md); and
- [`../../Engineering/03-persistence-world-clock-and-events.md`](../../Engineering/03-persistence-world-clock-and-events.md).

The local route-arrival boundary is evidenced in
[`../../Evidence/SK-EVID-017-cp09-route-milestone-runtime-verification.md`](../../Evidence/SK-EVID-017-cp09-route-milestone-runtime-verification.md)
and reviewed in
[`../../Validation/24-cp09-route-milestone-runtime-cross-functional-audit.md`](../../Validation/24-cp09-route-milestone-runtime-cross-functional-audit.md).
The bounded first extraction/cargo boundary is evidenced in
[`../../Evidence/SK-EVID-018-cp10-first-extraction-runtime-verification.md`](../../Evidence/SK-EVID-018-cp10-first-extraction-runtime-verification.md)
and reviewed in [`../../Validation/26-cp10-first-extraction-runtime-cross-functional-audit.md`](../../Validation/26-cp10-first-extraction-runtime-cross-functional-audit.md).
The verified cadence/return-handoff task is
[`../../Tasks/SK-TASK-030-cp10-extraction-cadence-and-return-handoff.md`](../../Tasks/SK-TASK-030-cp10-extraction-cadence-and-return-handoff.md), evidenced in
[`../../Evidence/SK-EVID-019-cp10-extraction-cadence-runtime-verification.md`](../../Evidence/SK-EVID-019-cp10-extraction-cadence-runtime-verification.md) and reviewed in
  [`../../Validation/28-cp10-extraction-cadence-runtime-cross-functional-audit.md`](../../Validation/28-cp10-extraction-cadence-runtime-cross-functional-audit.md). The selected contest handling is runtime-verified in [`../../Tasks/SK-TASK-031-cp10-contested-node-outcome.md`](../../Tasks/SK-TASK-031-cp10-contested-node-outcome.md), evidenced in [`../../Evidence/SK-EVID-020-cp10-contested-node-runtime-verification.md`](../../Evidence/SK-EVID-020-cp10-contested-node-runtime-verification.md) and reviewed in [`../../Validation/30-cp10-contested-node-runtime-cross-functional-audit.md`](../../Validation/30-cp10-contested-node-runtime-cross-functional-audit.md). Return movement is runtime-verified in [`../../Evidence/SK-EVID-021-cp10-return-navigation-runtime-verification.md`](../../Evidence/SK-EVID-021-cp10-return-navigation-runtime-verification.md) and reviewed in [`../../Validation/32-cp10-return-navigation-runtime-cross-functional-audit.md`](../../Validation/32-cp10-return-navigation-runtime-cross-functional-audit.md). Deposit settlement is runtime-verified in [`../../Tasks/SK-TASK-033-cp10-deposit-and-coin-settlement.md`](../../Tasks/SK-TASK-033-cp10-deposit-and-coin-settlement.md), evidenced in [`../../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md`](../../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md), and reviewed in [`../../Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md`](../../Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md).
