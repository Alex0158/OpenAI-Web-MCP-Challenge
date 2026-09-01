# Chain C11: Event to Leaderboard Projection

**Status:** Working design; ranking metric and season policy are open

## Trigger and outcome

A committed world event changes player progress. The chain turns that event into a recomputable global
leaderboard projection and an explainable dashboard update.

## Ordered flow

1. The owning mechanism commits a domain event such as deposit, upgrade, hunt, defense, siege reward,
   breach, exploration achievement, or recovery.
2. `M18` consumes the event once and applies the accepted ranking metric.
3. The projection records player, event id, world time, prior value, new value, and metric version.
4. The dashboard displays the rank change, pending status, or typed projection failure.
5. A recomputation from durable events can reproduce the same result after restart or projection lag.

## Failure branches

- An unknown metric version pauses projection rather than changing ranking silently.
- A duplicate event is ignored by idempotency key.
- A delayed projection remains pending and never mints coins or gameplay power.
- An anti-farming rule blocks or discounts a repeated attack according to the future accepted policy.

## Invariants and events

The leaderboard is read-only gameplay information. It cannot authorize attacks, reveal hidden shelter
positions, or change wallets. Candidate event is `LeaderboardProjected`.

## Open decisions

Metric, tie-breaker, refresh cadence, season reset, anti-farming, protection windows, and whether
recovery or exploration achievements count remain `OPEN`.

## Related mechanisms

- [`../detail-18-leaderboard-and-progression.md`](../detail-18-leaderboard-and-progression.md);
- [`../detail-01-world-clock-and-continuity.md`](../detail-01-world-clock-and-continuity.md); and
- [`../../Design/Capabilities/08-leaderboard-and-competition.md`](../../Design/Capabilities/08-leaderboard-and-competition.md).
