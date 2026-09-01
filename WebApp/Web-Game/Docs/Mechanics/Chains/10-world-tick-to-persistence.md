# Chain C10: World Tick to Persistence

**Status:** MVP clock and ordering accepted; runtime continuity is unverified

## Trigger and outcome

World time advances whether or not a player is connected. The chain turns due milestones into durable
state and recoverable events, then resumes the same world after worker restart.

## Ordered flow

1. `M01` advances the monotonic world clock to the next accepted boundary.
2. The scheduler claims due travel, extraction, encounter, combat, migration, respawn, spawn, or
   leaderboard milestones using entity versions.
3. The owning mechanism applies its state transition and emits a causal event in one transaction.
4. A periodic snapshot records the latest authoritative state; the outbox records eligible Re-entry
   delivery without carrying prompts or private context.
5. On worker restart, the service loads the snapshot, replays due milestones and unacknowledged
   outbox records, reclaims expired leases, and resumes from the committed world time.
6. The client reconnects, interpolates a fresh snapshot, and never reconstructs rewards locally.

## Failure branches

- A stale entity version causes the milestone to retry or fail visibly without a duplicate transition.
- A worker crash before commit leaves the milestone due; a crash after commit leaves an idempotent
  event and replayable outbox record.
- Extreme downtime follows an accepted catch-up cap rather than silently skipping causal state.

## Invariants and evidence

World time, mission state, cargo, rewards, shelter, monster, and leaderboard projections remain
durable. Evidence must show restart recovery and world-clock continuity; a running process alone is
not proof. Candidate events include all domain events listed by the owning mechanisms.

## Open decisions

Production replay cap, active-region approximation, long-offline presentation, and hosted snapshot
cadence remain `OPEN`. MVP world-time rate, bounded catch-up, same-time order, and local snapshot
target are fixed by [`../../Engineering/09-mvp-contract-sheet.md`](../../Engineering/09-mvp-contract-sheet.md).

## Related mechanisms

- [`../detail-01-world-clock-and-continuity.md`](../detail-01-world-clock-and-continuity.md);
- [`../detail-02-world-generation-and-resource-spawn.md`](../detail-02-world-generation-and-resource-spawn.md); and
- [`../../Engineering/03-persistence-world-clock-and-events.md`](../../Engineering/03-persistence-world-clock-and-events.md).
