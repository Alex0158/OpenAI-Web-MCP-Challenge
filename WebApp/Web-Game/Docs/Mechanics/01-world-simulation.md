# World Simulation

**Status:** Working decision; implementation target

This is the M01 family overview. The atomic time and continuity contract is in
[`detail-01-world-clock-and-continuity.md`](detail-01-world-clock-and-continuity.md); keep this
summary aligned when that detail changes.

## Authority

The backend server is authoritative for world time and all consequential state. The browser is a
view and command client. A client request can be rejected when the current entity version, ownership,
mission state, location, or permission does not match the server state.

## Time model

A single monotonic world clock drives travel, extraction, combat rounds, respawn, migration,
visibility, cooldown, resource regeneration, and leaderboard projection. Wall-clock timestamps are
stored for operations; gameplay decisions use the world clock.

## Efficient scheduling

Long-running work is represented as scheduled milestones instead of frame-by-frame server work:

- travel arrival or waypoint reached;
- next extraction cycle;
- full-pack return;
- encounter check when an entity enters a nearby spatial cell;
- combat round or terminal result;
- migration completion;
- resource respawn; and
- monster state timeout.

A small simulation tick reconciles due events, while the client interpolates movement between
authoritative `client_snapshot` projections. The accepted MVP uses a 100 ms movement and visibility
step, about 10 Hz `client_snapshot` delivery, and up to 60 FPS client rendering; combat, extraction, and respawn still settle on
one-world-second boundaries. A server restart rehydrates the latest `world_snapshot` and replays any durable
Domain Events and Agent Signals that were not acknowledged. High-frequency Domain Events remain
authoritative even when their Agent delivery is coalesced.

## Event ordering

Events that touch the same entity are serialized by entity version. A battle that has entered
`ASSAULT` resolves before a later migration command can hide the shelter. Cargo transfer, death,
respawn, and mission transition commit atomically.
