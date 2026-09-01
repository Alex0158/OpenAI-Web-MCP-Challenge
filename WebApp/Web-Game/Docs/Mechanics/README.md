# Mechanics

This module owns gameplay behavior and state transitions. The original eight files are family
overviews retained for orientation. The `detail-*` files below are the atomic mechanism authorities;
each has its own state boundary, inputs, outputs, invariants, and open decisions. Cross-mechanism
ordering lives in [`Chains/`](Chains/README.md).

## Inventory and family overviews

- [`00-mechanism-inventory-and-gaps.md`](00-mechanism-inventory-and-gaps.md) — count, boundary map,
  capability links, logic chains, and unresolved questions;
- [`01-world-simulation.md`](01-world-simulation.md) — family overview for M01;
- [`02-shelter-and-migration.md`](02-shelter-and-migration.md) — family overview for M03 and M17;
- [`03-soldier-roles-and-missions.md`](03-soldier-roles-and-missions.md) — family overview for M06–M08;
- [`04-resources-tools-and-economy.md`](04-resources-tools-and-economy.md) — family overview for M02,
  M05, M11, and M18;
- [`05-detection-pathfinding-and-encounters.md`](05-detection-pathfinding-and-encounters.md) — family
  overview for M04, M09, M10, and M13;
- [`06-combat-and-loot.md`](06-combat-and-loot.md) — family overview for M13–M15;
- [`07-monsters-and-state-machine.md`](07-monsters-and-state-machine.md) — family overview for M12; and
- [`08-breach-and-corruption.md`](08-breach-and-corruption.md) — family overview for M06 and M16.

## Atomic mechanism detail files

1. [`detail-01-world-clock-and-continuity.md`](detail-01-world-clock-and-continuity.md) — M01;
2. [`detail-02-world-generation-and-resource-spawn.md`](detail-02-world-generation-and-resource-spawn.md) — M02;
3. [`detail-03-shelter-state-and-command.md`](detail-03-shelter-state-and-command.md) — M03;
4. [`detail-04-shelter-sensing.md`](detail-04-shelter-sensing.md) — M04;
5. [`detail-05-shelter-upgrades-and-progression.md`](detail-05-shelter-upgrades-and-progression.md) — M05;
6. [`detail-06-soldier-identity-and-lifecycle.md`](detail-06-soldier-identity-and-lifecycle.md) — M06;
7. [`detail-07-role-and-loadout-lock.md`](detail-07-role-and-loadout-lock.md) — M07;
8. [`detail-08-mission-dispatch-return-and-recall.md`](detail-08-mission-dispatch-return-and-recall.md) — M08;
9. [`detail-09-navigation-and-pathfinding.md`](detail-09-navigation-and-pathfinding.md) — M09;
10. [`detail-10-player-exploration-fog-and-intelligence.md`](detail-10-player-exploration-fog-and-intelligence.md) — M10;
11. [`detail-11-resource-extraction-cargo-and-deposit.md`](detail-11-resource-extraction-cargo-and-deposit.md) — M11;
12. [`detail-12-monster-state-and-targeting.md`](detail-12-monster-state-and-targeting.md) — M12;
13. [`detail-13-encounter-and-combat-resolution.md`](detail-13-encounter-and-combat-resolution.md) — M13;
14. [`detail-14-loot-reward-and-atomic-transfer.md`](detail-14-loot-reward-and-atomic-transfer.md) — M14;
15. [`detail-15-shelter-defense-and-turrets.md`](detail-15-shelter-defense-and-turrets.md) — M15;
16. [`detail-16-siege-assault-and-breach.md`](detail-16-siege-assault-and-breach.md) — M16;
17. [`detail-17-shelter-migration-and-veil.md`](detail-17-shelter-migration-and-veil.md) — M17;
18. [`detail-18-leaderboard-and-progression.md`](detail-18-leaderboard-and-progression.md) — M18; and
19. [`detail-19-reentry-event-hook.md`](detail-19-reentry-event-hook.md) — M19.

## Logic chains

See [`Chains/README.md`](Chains/README.md) for C01–C11. Chain documents own ordering across detail
files; they do not create duplicate gameplay rules.
