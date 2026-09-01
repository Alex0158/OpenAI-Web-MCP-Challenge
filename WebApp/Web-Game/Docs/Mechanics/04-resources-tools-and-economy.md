# Resources, Tools, and Economy

**Status:** Working decision; numerical balance open

This is a family overview for M02, M05, M11, and M18. The detailed authorities are
[`detail-02-world-generation-and-resource-spawn.md`](detail-02-world-generation-and-resource-spawn.md),
[`detail-05-shelter-upgrades-and-progression.md`](detail-05-shelter-upgrades-and-progression.md),
[`detail-11-resource-extraction-cargo-and-deposit.md`](detail-11-resource-extraction-cargo-and-deposit.md),
and [`detail-18-leaderboard-and-progression.md`](detail-18-leaderboard-and-progression.md).

## Resource lifecycle

```text
world node → cargo on a soldier → shelter deposit → coins in the shelter wallet
```

Wood, Rock (the stone-tier name used by the MVP), and gold-bearing material are typed resource units
while they are in the world or in cargo. They are not crafting ingredients in the initial concept;
they have coin conversion values and create different route, time, tool, and risk decisions.

The accepted MVP narrows the visible set to Wood and Rock. Both are equal-weight cargo units available
to the tier-one gathering tool, with Wood converting to one coin and Rock converting to three coins at
shelter deposit. Gold remains a later progression tier.

Raw gold-bearing material and the coin wallet are separate. A soldier cannot spend a resource until
it has returned and the shelter has deposited it.

## Tool tiers

A tool tier must meet a resource's required tier. A valid tool increases the amount gained from
lower-tier resources, following the owner's Starve.io-inspired rule:

```text
yield = base_yield × tool_tier_multiplier
```

An invalid tool returns no yield. Yield, extraction time, node depletion, cargo capacity, and route
risk together determine income per world minute.

The initial tool-progression example is illustrative rather than final balance: a tier-one tool
extracts one unit of a low-tier Wood node, a tier-two tool extracts two units of that same Wood, and
that tier-two tool extracts one unit from a newly available Rock node. Higher tiers therefore both
unlock the next resource level and increase yield from lower levels.

## Upgrade directions

The shelter may branch its upgrades instead of increasing every stat together. The current concept
keeps these effects visible:

- **Shelter protection:** shelter level, defensive or protection-capsule strength, and sensing radius;
- **Army:** soldier quantity, soldier level, health, attack, movement speed, gathering speed, and
  carrying capacity;
- **Equipment:** weapons, tool tiers, and boots or other movement equipment; and
- **Turret:** turret quantity and attack power.

Exact branch prerequisites, prices, level caps, and whether mobility receives its own branch remain
open balance decisions.

## Capacity and return

Each soldier has a finite cargo capacity. A full-pack condition starts `RETURNING`; the player or
Agent can also issue a recall. A cargo item records its source node, quantity, and owner until deposit
or loss, which makes PvP loot atomic and auditable. The accepted MVP represents capacity as five
equal-weight unit slots; typed weights remain a later balance option.

## Economy sinks

Coins pay for shelter upgrades, turret upgrades and quantity, soldier equipment, tool tiers, boots or
movement upgrades, migration fees, stealth charges, repairs, and other future sinks. Prices and
conversion values remain target balance data, not implementation facts.

## Respawn

Resource nodes deplete and respawn on a server schedule. The node's quantity and regeneration event
are authoritative and survive a server restart.
