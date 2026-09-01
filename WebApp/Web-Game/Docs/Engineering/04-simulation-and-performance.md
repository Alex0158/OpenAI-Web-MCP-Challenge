# Simulation and Performance

**Status:** TARGET architecture

## Simulation strategy

The server should not simulate every soldier and monster at browser frame rate. It schedules travel
arrivals, extraction cycles, returns, encounter checks, combat rounds, migration completion, resource
respawn, and monster state timeouts. For the accepted two-player MVP, movement and visibility use a
100 ms reconciliation step, while combat, extraction, and respawn commit on one-world-second
boundaries. The browser receives snapshots at about 10 Hz and interpolates between them at up to 60
FPS.

## Spatial work

A spatial hash or quadtree limits encounter and sensor checks to nearby cells. Resource nodes and
monsters are indexed by region. A coarse walkability grid with cached A* waypoints is sufficient for
an initial world. Paths are recomputed only when a target, home anchor, obstacle, or migration state
invalidates them.

## Scaling posture

The first performance target is one world with a bounded active population and observable simulation
latency. Metrics should cover due-event lag, path recalculation count, nearby-query cost, battle
resolution time, snapshot size, outbox age, and command conflict rate. A separate worker, Redis, or
sharded world is considered only when measurements show a real need.

## Determinism

Given the same world seed, event order, input versions, and battle seed, the domain outcome should be
replayable. Client animation and network timing must not affect rewards or combat results.

## MVP fluidity budget

The first client should render the local avatar responsively, interpolate remote actors, and reconcile
predicted local input against the latest authoritative snapshot. Interest filtering may limit each
snapshot to the visible map region and dashboard-owned records. A DOM element per actor, a binary
protocol, and an ECS are unnecessary for two players; add them only after measured snapshot, draw, or
pathfinding cost exceeds the accepted profile.
