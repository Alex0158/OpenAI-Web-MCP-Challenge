# ADR-GAME-0015: CP-08 Worker Command and Read Gateway

**Status:** ACCEPTED LOCAL CP-08 IMPLEMENTATION BOUNDARY  
**Date:** 2026-09-02  
**Scope:** `SK-TASK-024`, worker serialization before browser or wire transport  
**Related task:** [`../Tasks/SK-TASK-024-cp08-worker-command-read-gateway.md`](../Tasks/SK-TASK-024-cp08-worker-command-read-gateway.md)  
**Predecessors:** [`ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md`](ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md), [`ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md`](ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md), and [`ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md)

## Context

`SK-TASK-023` proves a worker-owned movement cadence, but its direct services are still a local
composition seam. A future browser or WebSocket handler must not call the movement service, snapshot
reader, and clock independently: an input could race a snapshot read or a clock step and make the
visible projection disagree with the revision that the worker just committed. Adding wire handling
before this ordering boundary would make transport timing part of gameplay authority.

The first gateway must therefore be small, deterministic, and independent of a specific HTTP or
WebSocket protocol. It must also make shutdown and worker replacement visible instead of silently
executing work after the owning worker is no longer ready.

## Decisions

### 1. One FIFO gateway owns external work ordering

Add a process-local `WorkerCommandGateway` as the only local seam for movement intent commands,
full player-scoped snapshot reads, and explicit worker clock advances. Each accepted operation is
queued in invocation order and runs only when the worker is `ready`. A command followed by a read
therefore returns a projection after that command; a read followed by a command intentionally observes
the earlier state. The gateway is an ordering boundary, not a gameplay authority of its own.

The gateway remains synchronous with respect to the underlying worker operation but returns a Promise
so callers cannot accidentally interleave asynchronous handlers. A failed operation settles its own
Promise and does not poison later queue entries.

### 2. Existing authority and identity stay intact

The gateway forwards the existing typed inputs unchanged to `PlayerMovementCadenceService` and
`ClientSnapshotService`. World/player/binding ownership, expected revisions, idempotency keys,
transactional events, and scoped snapshot omission remain owned by those services and CP-05. The
gateway never accepts client coordinates, revisions, or hidden state as replacement values and never
creates a fallback world or snapshot.

### 3. Clock advances use the same ordering seam

An explicit `advance(elapsedMs)` operation is queued beside commands and reads and forwards to the
worker's existing `advance` method. This does not create a timer or claim hosted continuity. Future
host scheduling must submit its tick through this seam so a tick cannot run concurrently with an
external command or a reconnect read. Direct calls remain an internal test seam and must not be used
for browser or wire claims.

### 4. Lifecycle and queue failure are visible

An operation submitted while the worker is not ready returns a typed `WORKER_NOT_READY` gateway error.
After `close()`, new operations and queued operations that have not begun return `GATEWAY_CLOSED`.
An operation already executing may finish; the gateway never interrupts a synchronous domain
transaction. Closing the gateway does not stop the worker or close persistence; CP-04 remains the
entrypoint's shutdown owner.

### 5. No wire protocol or unbounded backpressure is introduced here

This increment defines no HTTP or WebSocket envelope, authentication handshake, snapshot cadence,
delta encoding, heartbeat, or browser input policy. It also does not add a speculative queue-size
policy. The later transport task must choose bounded admission and overload behavior using measured
latency and the existing stale/idempotency contracts. A gateway queue is process-local and is not a
durable work queue; replacement clears it.

## Alternatives rejected or deferred

- **Independent service calls from each route:** rejected because command/read/clock ordering would
  depend on handler timing and could expose a stale projection after a committed mutation.
- **A second timer inside the gateway:** rejected because `WorldClock` is the sole gameplay clock and
  CP-04/ADR-GAME-0014 already define the explicit worker driver.
- **HTTP/WebSocket implementation in this task:** deferred until the local ordering, lifecycle, and
  full-snapshot replacement seam is verified; otherwise transport details would hide unproven
  authority and backpressure behavior.
- **Durable command queue:** deferred; CP-05 idempotency and event transactions remain the replay
  boundary, while queued operations are process-local and cleared on replacement.

## Verification and reopen triggers

The task must prove FIFO ordering for command/read/advance operations, a failed operation not poisoning
the queue, not-ready and close behavior, and preservation of existing ownership, stale revision,
duplicate, snapshot privacy, and worker cadence results. Reopen this decision if a queue entry can
execute after close, a read can overtake a preceding command, a clock can advance outside the worker
seam, a gateway error hides a domain failure, or a browser/transport requirement requires durable
queued intent or a different authority.

## Consequences

The game gains one explicit local handoff that later HTTP, WebSocket, WebMCP, and Re-entry adapters can
reuse without changing domain services. The queue is intentionally process-local and has no claim of
hosted failover, delivery durability, or production throughput until those are measured and registered
as separate work.
