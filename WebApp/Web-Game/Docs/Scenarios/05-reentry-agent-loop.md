# Scenario: Re-entry Agent Loop

**Status:** Target scenario

**Logic chain:** [`../Mechanics/Chains/08-event-to-reentry-action.md`](../Mechanics/Chains/08-event-to-reentry-action.md)

1. The player assigns a gatherer and closes the page.
2. The world worker commits the applicable G2 events, such as `BattleRoundResolved`,
   `CargoLostToMonster`, and `SoldierRespawned`.
3. An eligible continuation event enters the Re-entry Core outbox and delivery path.
4. The Agent returns to the canonical shelter page with an opaque binding and fresh context.
5. The page exposes current WebMCP tools. The Agent reads shelter state, mission history, threats,
   and available soldiers.
6. In G2 the Agent executes the bounded `force_recall_soldier` action under the accepted grant.
   Safer-route planning, defense posture, migration, siege, and other consequential actions remain
   future capabilities or human-confirmed boundaries.
7. The page shows the action result and the event history; no cached prompt or stale mission is
   treated as current truth.
