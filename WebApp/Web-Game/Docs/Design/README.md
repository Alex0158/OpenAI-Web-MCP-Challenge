# Design

This module owns the human experience of the game. It turns the world and mechanics into a legible
player loop without making the UI an alternate authority.

User-facing capabilities have their own contracts under [`Capabilities/`](Capabilities/README.md).
Those files define goals, entry state, available actions, outcome/failure semantics, and the
mechanisms and chains that implement them.

- [`01-player-experience.md`](01-player-experience.md) — first session and ongoing play;
- [`02-map-fog-and-exploration.md`](02-map-fog-and-exploration.md) — avatar movement and discovery;
- [`03-dashboard-and-operations.md`](03-dashboard-and-operations.md) — shelter, missions, and causal
  history views;
- [`04-visual-and-interaction-direction.md`](04-visual-and-interaction-direction.md) — visual
  direction and Starve.io reference boundary; and
- [`05-hackathon-demo.md`](05-hackathon-demo.md) — the re-entry demonstration narrative.

## Capability contracts

- [`Capabilities/README.md`](Capabilities/README.md) — capability contract and index;
- [`Capabilities/01-player-exploration-and-discovery.md`](Capabilities/01-player-exploration-and-discovery.md) — explore and discover;
- [`Capabilities/02-shelter-command-and-upgrade.md`](Capabilities/02-shelter-command-and-upgrade.md) — command and upgrade;
- [`Capabilities/03-soldier-operations.md`](Capabilities/03-soldier-operations.md) — operate soldiers;
- [`Capabilities/04-resource-and-economy-planning.md`](Capabilities/04-resource-and-economy-planning.md) — plan economy;
- [`Capabilities/05-defense-siege-and-migration.md`](Capabilities/05-defense-siege-and-migration.md) — defend, raid, migrate;
- [`Capabilities/06-consequence-review-and-recovery.md`](Capabilities/06-consequence-review-and-recovery.md) — review consequences;
- [`Capabilities/07-event-driven-agent-continuation.md`](Capabilities/07-event-driven-agent-continuation.md) — continue with an Agent;
- [`Capabilities/08-leaderboard-and-competition.md`](Capabilities/08-leaderboard-and-competition.md) — compare progress.
