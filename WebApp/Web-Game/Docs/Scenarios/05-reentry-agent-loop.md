# Scenario: Re-entry Agent Loop

**Status:** Target scenario

**Logic chain:** [`../Mechanics/Chains/08-event-to-reentry-action.md`](../Mechanics/Chains/08-event-to-reentry-action.md)

1. The player assigns a gatherer and closes the page.
2. The world worker commits `BattleResolved`, `CargoLooted` or `CargoLostToMonster`, and
   `SoldierRespawned` events.
3. An eligible continuation event enters the Re-entry Core outbox and delivery path.
4. The Agent returns to the canonical shelter page with an opaque binding and fresh context.
5. The page exposes current WebMCP tools. The Agent reads shelter state, mission history, threats,
   and available soldiers.
6. The Agent prepares a safer route, queues a recall, sets defense posture, or proposes migration,
   subject to current authority and the human consequence boundary.
7. The page shows the action result and the event history; no cached prompt or stale mission is
   treated as current truth.
