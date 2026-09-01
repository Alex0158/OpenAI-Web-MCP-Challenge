# Shelter Upgrades and Progression

**Mechanism:** M05
**Status:** Working branch shape; numerical balance is open
**Authority:** This file owns upgrade choices and their state transition. Economy owns conversion
and spending; shelter state owns command eligibility.

## Purpose

Define how a shelter purchases, applies, and records upgrades while preserving branch trade-offs,
version checks, and the distinction between shelter, soldier, equipment, and turret levels.

## Upgrade branches

| Branch | Example effects | Trade-off to preserve |
|---|---|---|
| Protection and sensing | shelter level, protection-capsule strength, defensive power, sensing radius | safer home and better information can cost military or mobility investment |
| Army | soldier quantity, soldier level, health, attack, movement, gathering speed, capacity | more field coverage increases exposed value and command complexity |
| Equipment | weapons, tool tiers, boots, movement equipment | stronger tools unlock yield and routes but consume coins and may add weight |
| Turret | turret quantity, attack, range, targeting or reload | stronger static defense reduces the budget for mobile forces |

The branch names are working terminology. Exact branch prerequisites, whether shelter level gates all
branches, and whether mobility is separate remain `OPEN`.

## Purchase transaction

An upgrade request must include the shelter id, branch, expected entity version, and an idempotency
key. The server verifies ownership, state (`STABLE` or an explicitly allowed recovery state), cost,
prerequisites, level cap, and available coins. It then atomically deducts coins, increments the
upgrade level, projects affected capabilities, and emits an upgrade event.

A rejected request changes nothing. A retried request with the same idempotency key cannot charge the
wallet twice.

## Level semantics

Shelter level, soldier level, equipment tier, and military upgrade level are separate dimensions even
when one branch gates another. A breach can lower the shelter level and one soldier/military level
within minimum bounds; it must identify which ledger changed in the event history.

## Capability projection

An upgrade changes a visible capability only after the authoritative transaction commits. Examples:

- sensing upgrade changes the next shelter observation radius;
- army quantity changes the maximum roster or available soldiers;
- tool tier changes valid resource nodes and yield multiplier;
- boots change movement estimate; and
- turret upgrade changes defense inputs.

Existing field missions keep their committed loadout unless the governing rule explicitly says an
upgrade can affect them. The default assumption is that role and tool are locked for the sortie.

## Invariants

- A purchase either commits all wallet and capability changes or commits none.
- An upgrade cannot bypass ownership, shelter state, prerequisites, or level caps.
- Existing field missions keep their committed role and loadout by default.
- A breach identifies every level ledger that it lowers.

## Open decisions

- price and conversion table;
- prerequisites, level caps, and minimums;
- whether quantity upgrades create new soldiers immediately or increase a future roster slot;
- whether a breach reduces one common military level or a selected branch; and
- whether upgrades may be purchased during migration or recovery.

## Related documents

- [`04-resources-tools-and-economy.md`](04-resources-tools-and-economy.md) — family overview;
- [`detail-03-shelter-state-and-command.md`](detail-03-shelter-state-and-command.md);
- [`detail-07-role-and-loadout-lock.md`](detail-07-role-and-loadout-lock.md); and
- [`detail-11-resource-extraction-cargo-and-deposit.md`](detail-11-resource-extraction-cargo-and-deposit.md).
