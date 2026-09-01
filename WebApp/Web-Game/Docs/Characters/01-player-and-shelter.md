# Player and Shelter

**Status:** Working concept baseline

## Player

The player owns one shelter in the initial world model. The player can leave the shelter as a direct
world avatar, return and rest inside it, explore the fogged map, discover resources or other shelters, inspect
mission history, assign roles, purchase upgrades, recall soldiers, initiate migration, and prepare a
siege after returning with intelligence.

## Shelter

A shelter is both a fictional magical settlement and an authoritative game entity. It owns:

- location and movement state;
- level and upgrade branches;
- resource sensing radius;
- turret state and defense power;
- resident and field soldier references;
- coin wallet and deposited resources;
- veil charges and cooldown;
- last-known-position records visible to enemies;
- breach and recovery state; and
- the home anchor used by returning soldiers.

The shelter's current state is the primary page context for WebMCP operations. A page tool must ask
the backend for current shelter state before accepting any consequential command.
