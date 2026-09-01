# Capability: Consequence Review and Recovery

**Status:** Working design

## Goal

Make every important world outcome understandable enough for a player or Agent to choose the next
strategy instead of receiving an opaque notification.

## Entry and visible state

The dashboard groups causal history by mission attempt, soldier identity, shelter, and world time.
It shows route, cargo, observation, encounter, combat inputs, death cause, winner, cargo transfer or
loss, breach penalty, converted soldiers, migration, reward, and next valid action.

## Actions and outcomes

After ordinary death the player can review the loss and reassign the same identity from home. After a
breach the player can inspect the damaged core, remaining residents, penalty, attacker reward, and
repair options. The world retains converted monsters as visible consequences.

## Boundaries

History is evidence, not a second authority. A proposed Agent action must be labelled prepared until
the backend commits it. Missing or delayed projection must be shown as pending.

## Dependencies

- Mechanics: M01, M06, M14, M16, M18;
- Design: [`../03-dashboard-and-operations.md`](../03-dashboard-and-operations.md); and
- Logic: [`../../Mechanics/Chains/07-death-to-respawn-or-corruption.md`](../../Mechanics/Chains/07-death-to-respawn-or-corruption.md).

