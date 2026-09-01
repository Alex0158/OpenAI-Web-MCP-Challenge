# Capability: Resource and Economy Planning

**Status:** G2 economy contract accepted; production balance is open

## Goal

Let the player choose a resource route by considering value per world minute, travel distance,
extraction time, tool tier, cargo capacity, detection, encounter risk, and expected loss.

## Entry and visible state

The player can inspect sensed nodes, type, tier, approximate availability, route estimate, tool
requirement, and current missions. The dashboard distinguishes typed field cargo from shelter-held
coins and shows the last deposit or loss.

## Actions and outcomes

The player upgrades tools, dispatches a gatherer, watches extraction, receives automatic return at
capacity or issues recall, and receives coins only after shelter deposit. Higher tools unlock higher
resource tiers and multiply lower-tier yield according to the accepted formula.

Failure includes depleted nodes, invalid tools, route loss, combat cargo transfer, monster cargo
destruction, and the accepted full-capacity return boundary. Production overflow and typed-weight
rules remain future decisions.

## Boundaries

Resources do not combine into crafting recipes in the initial concept. A field soldier cannot spend
or bank cargo. The browser cannot credit the wallet.

## Dependencies

- Mechanics: M02, M05, M08, M11, M14;
- Logic: [`../../Mechanics/Chains/02-dispatch-to-deposit.md`](../../Mechanics/Chains/02-dispatch-to-deposit.md) and
  [`../../Mechanics/Chains/03-encounter-to-loot.md`](../../Mechanics/Chains/03-encounter-to-loot.md); and
- Presentation: [`../03-dashboard-and-operations.md`](../03-dashboard-and-operations.md).
