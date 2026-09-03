# ADR-GAME-0016: CP-08 Realtime Snapshot Transport Boundary

**Status:** ACCEPTED LOCAL CP-08 PRE-IMPLEMENTATION BOUNDARY  
**Date:** 2026-09-02  
**Scope:** `SK-TASK-025`, `/realtime` projection and reconnect seam  
**Related task:** [`../Tasks/SK-TASK-025-cp08-realtime-snapshot-transport.md`](../Tasks/SK-TASK-025-cp08-realtime-snapshot-transport.md)  
**Predecessor:** [`ADR-GAME-0015-cp08-worker-command-read-gateway.md`](ADR-GAME-0015-cp08-worker-command-read-gateway.md)

## Context

The game now has a verified worker gateway that orders commands, reads, and explicit clock advances,
but no browser connection can consume the full `client_snapshot` projection. The next handoff must
give the Canvas a truthful replacement stream without creating a second authority, exposing another
player's private state, or silently falling back when realtime capability is unavailable.

The first transport increment should prove the connection lifecycle and full-snapshot replacement
semantics. Delta frames, browser command wiring, production cadence, and authentication can then be
added behind explicit boundaries instead of being mixed into an unmeasured protocol.

## Decisions

### 1. Entrypoint owns `/realtime` and one connection registry

The CP-04 entrypoint remains the sole HTTP upgrade owner. A `RealtimeSnapshotHub` is a process-local
projection module owned by that entrypoint; a Next.js route or page module cannot start a worker or
open a second listener. Each connection has a server-bound player/shelter context and a monotonically
increasing per-connection frame sequence.

The local fixture may inject an opaque binding for tests. A client-supplied `player_id`, `shelter_id`,
or binding is never accepted as authentication or projection scope; live authentication and issuance
of the binding remain a later checkpoint.

### 2. Connect and resync always use a full replacement snapshot

After a connection is authorized, the hub obtains a full `client_snapshot` through
`WorkerCommandGateway.fullSnapshot` and sends one `client_snapshot` frame with the contract version,
client snapshot id, world time, player scope, revisions, visible actors, explored cells, and recent
permitted events. The first frame and every explicit resync are full replacements with
`base_client_snapshot_id = null`.

The browser accepts a frame only when its connection sequence is newer than the last accepted frame
and replaces local projection state atomically. A missing or out-of-order base never gets merged onto
unrelated state; the browser requests a full resync and remains visibly stale until it arrives.

### 3. Transport is a projection surface, not a command authority

This task sends snapshots and a typed resync request only. Movement intent set/stop remains an HTTP or
future command adapter operation routed through `WorkerCommandGateway`; the WebSocket cannot commit a
position, reveal a cell, award coins, resolve combat, or choose a player scope. A future bidirectional
protocol must preserve this separation and receive its own decision.

The hub never reads the store or domain services directly. Every snapshot read enters the worker FIFO
gateway, so a queued command or explicit clock advance cannot race the projection read.

### 4. Connection lifecycle and unsupported capability are explicit

The local connection states are `CONNECTING`, `READY`, `STALE`, and `CLOSED`. A worker/runtime that is
not ready rejects the connection with a typed unavailable result; a closing or degraded runtime does
not queue work for implicit replay. An unsupported WebSocket upgrade leaves the normal page readable
and exposes `realtime_unavailable` in the connection status; it does not create a second server or
claim live updates.

CP-04 still owns drain: new upgrades are rejected during `DRAINING`, existing connections are closed
within the shutdown budget, and the hub does not stop persistence itself.

### 5. Cadence and backpressure remain explicit later work

This task defines an explicit `publishFullSnapshot`/resync seam and does not start a browser timer or
claim a 10 Hz production stream. A later scheduler task must call the hub through the worker boundary
and measure snapshot size, event-loop delay, and slow-client behavior before choosing a cadence.
Until then, the hub must not accumulate an unbounded per-connection frame queue; a future bounded
policy may retain only the latest replacement frame and mark the connection stale when admission is
exceeded, but that policy is not silently invented here.

### 6. The hub stays transport-neutral and browser-safe

The smallest supported local hub remains an in-process sink boundary. `RealtimeSnapshotHub` owns the
server-side connection registry and delegates every read through the worker gateway; it does not own a
listener or socket-specific protocol. The browser-side `RealtimeProjectionClient` lives in a
dependency-free client module and validates the same full-frame, scope, and sequence rules before
replacing its local projection. The authenticated `RealtimeWireAdapter` is supplied by `SK-TASK-026`
under [`ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md`](ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md);
the default entrypoint remains visibly unsupported when no server-owned session resolver is configured.

## Alternatives rejected or deferred

- **Next.js route-owned socket:** rejected because it can create a second worker/authority and bypass
  the CP-04 upgrade owner.
- **Delta-first protocol:** deferred until full replacement, sequence, and resync behavior are proven;
  a missing base must never leak or merge hidden state.
- **WebSocket movement commands:** deferred; command identity, revision, and gateway ordering already
  have a separate boundary and should not be duplicated in a wire handler.
- **HTTP polling fallback:** rejected as an implicit realtime claim. A later explicit degraded UX may
  offer a human read surface, but it must disclose that realtime is unavailable.
- **Browser or hub timer:** rejected because `WorldClock` remains the only gameplay clock.
- **Adding a WebSocket dependency now:** deferred because no wire or authentication contract is
  accepted yet; the sink boundary proves the projection semantics without claiming network support.

## Verification and reopen triggers

The task must prove server-bound connection scope, initial full snapshot, explicit full resync,
monotonic sequence acceptance, stale/out-of-order rejection, gateway delegation, close/drain,
unsupported capability, and no domain mutation from transport input. Reopen this decision if a frame
can bypass the gateway, a client can select another scope, an out-of-order frame mutates local state,
the hub creates a second clock/listener, or slow-client handling requires a durable queue or a changed
snapshot contract.

## Consequences

The browser receives a simple truthful replacement surface that can support the Starve.io-inspired
Canvas while leaving command authority and gameplay in the worker. The local increment remains small
enough to verify without claiming hosted realtime, authentication, performance, or final UX polish.
