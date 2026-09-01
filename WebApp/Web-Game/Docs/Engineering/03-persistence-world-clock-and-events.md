# Persistence, World Clock, and Events

**Status:** TARGET architecture

## Durable entities

The first schema will need a world, player, shelter, shelter upgrade, soldier, mission, mission
attempt, cargo, resource node, monster, intelligence record, migration, encounter, battle result,
world event, and outbox delivery record. A soldier identity is stable across ordinary respawn;
each sortie or restart is a separate mission attempt so the dashboard can explain what happened
without creating a duplicate soldier. Exact columns belong to the implementation decision.

## Snapshot and event log

The store keeps the latest authoritative snapshot plus append-only domain events. A periodic snapshot
makes restart fast; the event log supplies causal history and recovery of events that were committed
near a process fault. Every entity mutation advances a version.

## Outbox

A gameplay transaction writes its state changes and any eligible continuation event to one database
transaction. An outbox worker claims each event with a lease, sends the typed event into the Re-entry
Core boundary, records the delivery outcome, and never assumes that an accepted event equals a
completed Agent action.

## Idempotency

Commands carry a client or Agent idempotency key. Battle resolution, cargo transfer, reward, respawn,
breach, migration charge, and outbox delivery have unique event identities. Retried requests either
return the original result or fail visibly on a version conflict.

## Restart semantics

On restart, the worker reads the latest world clock and snapshots, replays unhandled due milestones,
reclaims expired leases, and resumes from the last committed event. Wall-clock downtime does not
reset the world; the next reconciliation advances due world-time work according to the accepted clock
policy.
