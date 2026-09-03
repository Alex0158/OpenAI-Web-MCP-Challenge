# World Overview

**Status:** Canonical working world concept  
**Source:** Blueprint and owner discussion

## Setting

The game takes place in a magical frontier that never pauses. Forests, Rock fields, gold-bearing
areas, monsters, player shelters, travelling soldiers, and human explorers share one world map.
Each player starts with a small shelter that functions as a protected command base and grows into a
mobile magical settlement.

The world is open-ended rather than divided into private matches. A player can discover another
player's shelter, record its last known location, and later send a prepared siege party toward that
location. A shelter can move, so intelligence is always a time-stamped observation rather than a
permanent guarantee.

## World time

World time is server-authoritative and continues while a player is offline or the browser is closed.
Mission travel, gathering cycles, monster movement, shelter migration, cooldowns, resource respawn,
and leaderboard changes all use the same world clock. Client rendering may interpolate between
server updates, but it never advances authoritative time.

## Map knowledge

The player avatar begins with a fogged map. Walking with ordinary directional controls reveals the
territory actually traversed by that player. A player can discover resources and enemy shelters by
exploration, then return to the shelter with intelligence. Soldier sensors provide a separate,
smaller operational view and do not automatically reveal the whole map to the player.

## Shelters

A shelter has a location, level, a `shelter_resource_sensing_radius_tiles` field, resource sensing, a turret, a roster, upgrades,
coin reserves, a damaged/breached state, and a migration state. Its magic protects soldiers that are
inside and gives the player a command surface. It also acts as the home anchor used by returning
soldiers.

## Resources and monsters

Resources are generated in the world as typed nodes such as Wood, Rock (the MVP stone-tier name), and
gold-bearing material. They are collected as cargo and become coins only after reaching the shelter.
Monsters are generated as mobile world actors. They can be hunted for value, can move toward threats or
targets, and can kill soldiers. Some monsters are transformed soldiers whose shelter magic has been
lost.

## World memory

The world remembers causal events through durable records. A mission, encounter, death, cargo loss,
shelter breach, migration, or corruption event remains visible in the dashboard even when the
player or Agent returns later.
