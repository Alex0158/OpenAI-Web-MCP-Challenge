# Scenario: Re-entry Agent Loop

**Status:** Target scenario

**Logic chain:** [`../Mechanics/Chains/08-event-to-reentry-action.md`](../Mechanics/Chains/08-event-to-reentry-action.md)

1. The player assigns a gatherer and closes the page.
2. The world worker commits the applicable G2 events, such as `BattleRoundResolved`,
   `CargoLostToMonster`, and `SoldierRespawned`.
3. The delivery policy creates one coalesced Agent Signal for the eligible continuation event; routine
   events remain in the Domain Event history without opening individual Thread messages.
4. The Agent returns to the canonical shelter page with an opaque binding and fresh context.
5. The page exposes current WebMCP tools. The Agent reads shelter state, mission history, threats,
   the signal digest, and available soldiers.
6. In G2 the Agent executes the bounded `force_recall_soldier` action under the accepted grant when
   the live revision permits it. A late command returns a typed result. Safer-route planning, defense
   posture, migration, siege, and other consequential actions remain future capabilities or
   human-confirmed boundaries.
7. The page shows the action result, signal delivery state, and event history; no cached prompt or
   stale mission is treated as current truth.
