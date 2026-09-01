# Capability: Player Exploration and Discovery

**Status:** Working design

## Goal

Let the player personally learn a dangerous shared world and turn direct observation into useful
shelter intelligence. Exploration is the human way to reveal a target; it is not a global map cheat.

## Entry and visible state

The player leaves a shelter or resumes an exposed avatar. The map is fogged except for cells already
traversed by that player. Visible layers distinguish terrain, resources, monsters, shelters, and
last-known positions. Resting inside the shelter removes the avatar from the exposed field view while
world time continues.

## Actions and outcomes

The player moves with W-A-S-D or an equivalent directional control, observes an actor when visibility
permits, and returns home. The server records target type, coordinate, observer, world time,
confidence, and optional expiry. After the return-home handoff, the shelter may prepare a siege or
another legal mission.

Failure is visible when the target is hidden, the observation is stale, the route is incomplete, or
the shelter rejects the intelligence version.

## Boundaries

Exploration does not reveal fresh positions through a migration veil, grant real-time soldier
sensors, or authorize an attack without a shelter command. Returning home is not teleportation.

## Dependencies

- Mechanics: M01, M03, M10;
- Chain: [`../../Mechanics/Chains/01-exploration-to-intelligence.md`](../../Mechanics/Chains/01-exploration-to-intelligence.md); and
- Presentation: [`../02-map-fog-and-exploration.md`](../02-map-fog-and-exploration.md).

