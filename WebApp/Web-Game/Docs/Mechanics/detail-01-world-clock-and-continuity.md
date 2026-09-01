# World Clock and Continuity

**Mechanism:** M01
**Status:** Working decision; implementation target
**Authority:** This file owns gameplay time and continuity. Engineering owns storage and worker
implementation.

## Purpose

The world must keep advancing while a player is offline, while the browser is closed, and across a
recoverable worker restart. Every time-dependent mechanic reads the same authoritative world clock.

## Clocks

| Clock | Use | Authority |
|---|---|---|
| `world_time` | Travel, extraction, combat rounds, respawn, migration, cooldown, spawn, leaderboard projection | Backend simulation |
| `wall_time` | Logs, health checks, leases, operations, and deployment evidence | Host and database |
| `client_time` | Animation interpolation and display only | Browser; never gameplay authority |

`world_time` is monotonic for a world. A wall-clock jump, browser pause, or client reconnect cannot
rewrite an already committed gameplay result.

For the accepted MVP, one world second equals one real second. Movement and visibility may be
reconciled on a 100 ms simulation step for smooth snapshots; combat, extraction, and respawn still
commit on integer world-second boundaries. The production catch-up policy remains an operations
decision.

## Scheduled milestones

The worker stores the next due milestone for work that does not need frame-by-frame simulation:

- travel waypoint or arrival;
- extraction cycle;
- full-pack return;
- nearby encounter check;
- combat round or terminal resolution;
- migration completion;
- resource respawn; and
- monster state timeout.

A reconciliation tick claims due milestones, validates entity versions, applies the domain transition,
and writes its event in one transaction. The client interpolates between snapshots and never awards
progress locally.

## Offline and restart behavior

When a player is absent, due milestones continue to advance. When the worker restarts, it:

1. loads the latest world snapshot and last committed `world_time`;
2. advances to the current accepted wall-time boundary according to the configured catch-up policy;
3. applies due milestones in deterministic order;
4. reclaims expired worker leases; and
5. replays unacknowledged outbox deliveries without repeating a domain transition.

The catch-up policy, maximum replay batch, and behavior for extreme downtime are `OPEN` balance and
operations settings. They must be explicit before production claims.

## Event order

Events touching the same entity are serialized by entity version. A stable tie-break order is needed
for milestones with the same due time; the target order is:

1. committed battle resolution;
2. shelter boundary crossings and cargo deposit;
3. death and respawn or corruption;
4. migration completion;
5. extraction and resource regeneration; and
6. informational projections and continuation delivery.

This order is a `TARGET` until representative edge cases are accepted. A later command cannot
retroactively change an already committed event.

## Invariants

- One authoritative clock drives all gameplay timers.
- Every committed transition has an event id and entity version.
- Replaying a milestone is idempotent.
- Downtime cannot duplicate cargo, coins, soldiers, or rewards.
- A client snapshot can be stale and must be reread before a consequential command.

## Open decisions

- production world-time scaling and downtime catch-up beyond the accepted MVP rate;
- catch-up cap and active-region approximation;
- same-time milestone tie-break cases; and
- whether a long-offline player receives one compressed outcome or every causal event.

## Related documents

- [`01-world-simulation.md`](01-world-simulation.md) — family overview;
- [`detail-02-world-generation-and-resource-spawn.md`](detail-02-world-generation-and-resource-spawn.md);
- [`detail-17-shelter-migration-and-veil.md`](detail-17-shelter-migration-and-veil.md); and
- [`../Engineering/03-persistence-world-clock-and-events.md`](../Engineering/03-persistence-world-clock-and-events.md).
