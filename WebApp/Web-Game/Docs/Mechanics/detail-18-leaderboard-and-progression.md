# Leaderboard and Progression Metrics

**Mechanism:** M18
**Status:** Required capability; ranking policy is open
**Authority:** This file owns global progress projection. Economy and upgrades own the source values;
Design owns presentation.

## Purpose

Define how committed world outcomes become a global, explainable progress projection without granting
the leaderboard gameplay authority.

## Global leaderboard

The world exposes one shared leaderboard. It records each player's progress from authoritative shelter
and event data. The initial concept permits coins, score, or both; the exact ranking metric has not
been accepted.

## Candidate metrics

| Metric | Meaning | Risk |
|---|---|---|
| Current coins | spendable shelter-held value | rewards hoarding and may ignore strategic losses |
| Lifetime deposited value | total successful economy throughput | can reward low-risk farming forever |
| Strategic score | weighted exploration, defense, hunting, siege, and recovery outcomes | requires auditable weights |
| Shelter power | current level, soldiers, tools, turrets | measures build power, not player success |
| Composite | bounded combination of value and achievements | harder to explain and balance |

The chosen metric must be visible in the dashboard and derive only from committed events. A display
projection must not change the underlying wallet or combat state.

## Update and time

Candidate leaderboard projections may consume committed deposit, upgrade, siege, breach, exploration,
and event records on the world clock. A delayed projection may show `pending` rather than inventing a
result.
Tie-breaking, refresh cadence, season reset, and whether migration affects rank are `OPEN`.

## Fairness and anti-farming

Repeatedly attacking a weaker shelter, cycling soldiers for free, or exploiting restart catch-up must
not become the dominant ranking strategy. Anti-farming rules, matchmaking or protection windows, and
season boundaries require a separate accepted policy before a competitive claim.

## Invariants

- The leaderboard never grants gameplay authority.
- Rankings can be recomputed from durable events.
- A player can inspect why its score changed.
- A projection lag cannot duplicate coins or rewards.

## Open decisions

- final ranking metric and tie-breaker;
- refresh cadence and pending state;
- season/reset policy; and
- anti-farming and protection rules.

## Related documents

- [`04-resources-tools-and-economy.md`](04-resources-tools-and-economy.md) — family overview;
- [`detail-01-world-clock-and-continuity.md`](detail-01-world-clock-and-continuity.md);
- [`detail-05-shelter-upgrades-and-progression.md`](detail-05-shelter-upgrades-and-progression.md);
- [`detail-14-loot-reward-and-atomic-transfer.md`](detail-14-loot-reward-and-atomic-transfer.md); and
- [`../Design/03-dashboard-and-operations.md`](../Design/03-dashboard-and-operations.md).
