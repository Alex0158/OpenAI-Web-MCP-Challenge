# Player Capabilities

**Role:** User-facing capability contracts
**Status:** Working experience baseline

Capability files describe what a player or Agent can accomplish, the visible entry state, the action
boundary, and the result or failure that must be explained. They compose atomic gameplay mechanisms;
they do not replace the rules in `Mechanics/` or the page/tool contract in `Engineering/`.

- [`01-player-exploration-and-discovery.md`](01-player-exploration-and-discovery.md) — explore fog,
  discover actors, and return intelligence;
- [`02-shelter-command-and-upgrade.md`](02-shelter-command-and-upgrade.md) — inspect and grow the
  shelter command base;
- [`03-soldier-operations.md`](03-soldier-operations.md) — assign and monitor role-locked missions;
- [`04-resource-and-economy-planning.md`](04-resource-and-economy-planning.md) — choose routes,
  tools, cargo, deposit, and spending;
- [`05-defense-siege-and-migration.md`](05-defense-siege-and-migration.md) — defend, raid, relocate,
  and recover from breach;
- [`06-consequence-review-and-recovery.md`](06-consequence-review-and-recovery.md) — understand
  causal history and choose a recovery action;
- [`07-event-driven-agent-continuation.md`](07-event-driven-agent-continuation.md) — resume a
  bounded action through Re-entry Core and WebMCP; and
- [`08-leaderboard-and-competition.md`](08-leaderboard-and-competition.md) — compare progress and
  competition outcomes.

## Capability contract

Each capability names:

- the player goal and entry conditions;
- current state and information visible to the human or Agent;
- commands and human-consequence boundaries;
- success, failure, and recovery outcomes; and
- its atomic mechanisms and end-to-end chain.

If a capability promises an action that no mechanism or page tool can authorize, the capability is
incomplete and must be resolved before implementation.
