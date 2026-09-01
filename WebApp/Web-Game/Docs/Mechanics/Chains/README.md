# Logic Chains

**Role:** Normative cross-mechanism orchestration
**Status:** Working chain baseline

Atomic mechanism files define state and authority. These chain files define the order in which
multiple mechanisms compose, the events emitted at each boundary, and the failure branch that must
remain visible. Scenarios are concrete examples; chain files are reusable logic contracts.

- [`01-exploration-to-intelligence.md`](01-exploration-to-intelligence.md) — avatar exploration to a
  usable shelter intelligence record;
- [`02-dispatch-to-deposit.md`](02-dispatch-to-deposit.md) — mission dispatch to cargo settlement;
- [`03-encounter-to-loot.md`](03-encounter-to-loot.md) — field contact to combat and PvP cargo;
- [`04-monster-hunt-to-reward.md`](04-monster-hunt-to-reward.md) — hunter mission to monster value or
  soldier loss;
- [`05-siege-to-breach.md`](05-siege-to-breach.md) — discovered target to defense, assault, and
  breach;
- [`06-migration-to-relocation.md`](06-migration-to-relocation.md) — paid movement to concealed
  arrival and home-anchor reunification;
- [`07-death-to-respawn-or-corruption.md`](07-death-to-respawn-or-corruption.md) — death to ordinary
  respawn, mission terminal state, or breach conversion;
- [`08-event-to-reentry-action.md`](08-event-to-reentry-action.md) — causal backend event to bounded
  Agent continuation;
- [`09-upgrade-to-capability.md`](09-upgrade-to-capability.md) — purchase to visible capability
  projection;
- [`10-world-tick-to-persistence.md`](10-world-tick-to-persistence.md) — world time to durable
  recovery; and
- [`11-event-to-leaderboard.md`](11-event-to-leaderboard.md) — committed event to global ranking.

## Chain rules

- Each chain names its authoritative input, output, side effects, and failure states.
- A chain may call an atomic mechanism but cannot invent a second rule for it.
- Cross-chain writes use one event id and the entity versions owned by the participating mechanisms.
- Any unresolved value or ordering point is marked `OPEN` in the chain and its owning detail file.
