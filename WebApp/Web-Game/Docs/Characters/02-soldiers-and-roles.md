# Soldiers and Roles

**Status:** Working concept baseline

## Soldier identity

A soldier has a stable identity, owner, level, health, role loadout, tool tier,
`soldier_sensor_radius_tiles`, `soldier_move_speed_tiles_per_world_second`, cargo, current location,
mission reference, and lifecycle state. Death normally
creates an immediate shelter respawn for the same identity. A breach can transition an outside soldier
into a world monster and mark its controllable identity as lost or corrupted.

## Role loadouts

- **Gatherer:** axe or pickaxe for resource work, with a hammer or carried tool as fallback; weak
  combat when attacked.
- **Hunter:** sword; targets monsters; strong monster matchup.
- **Siege soldier:** sword and siege supplies; joins a formation against a shelter.
- **Guard:** remains at the shelter; contributes to resident defense and turret response.

The role is selected at mission assignment and remains locked outside the shelter. Tool upgrades
increase yield or combat power according to the owning mechanic; they do not grant a silent role swap.
