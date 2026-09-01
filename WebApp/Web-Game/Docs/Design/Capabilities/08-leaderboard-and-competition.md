# Capability: Leaderboard and Competition

**Status:** Working design; ranking policy is open

## Goal

Let players compare progress in one shared world while keeping the ranking explainable, recomputable,
and separate from direct gameplay authority.

## Entry and visible state

The shelter dashboard exposes the global leaderboard, the active metric label, the player's current
position, nearby or relevant opponents, and the committed events that changed the player's value.
The view distinguishes spendable coins, lifetime value, shelter power, and any strategic score rather
than presenting one unexplained number.

## Actions and outcomes

Deposits, upgrades, exploration achievements, hunting, defense, siege reward, breach, and recovery can
feed the accepted projection. A delayed projection is shown as pending. The player can inspect why a
rank changed, but cannot edit the projection or award points from the client.

## Boundaries and fairness

The leaderboard never authorizes an attack, reveals hidden shelter positions, or changes wallet state.
Repeated attacks on a weaker shelter, free death cycling, and restart catch-up must not dominate the
ranking; anti-farming and season rules remain open.

## Dependencies

- Mechanics: M01, M14, M18;
- Mechanism: [`../../Mechanics/detail-18-leaderboard-and-progression.md`](../../Mechanics/detail-18-leaderboard-and-progression.md);
- Presentation: [`../03-dashboard-and-operations.md`](../03-dashboard-and-operations.md);
- Logic: [`../../Mechanics/Chains/11-event-to-leaderboard.md`](../../Mechanics/Chains/11-event-to-leaderboard.md).
