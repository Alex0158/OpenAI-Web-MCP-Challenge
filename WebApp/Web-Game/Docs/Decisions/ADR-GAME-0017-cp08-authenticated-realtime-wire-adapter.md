# ADR-GAME-0017: CP-08 Authenticated Realtime Wire Adapter

**Status:** ACCEPTED LOCAL CP-08 IMPLEMENTATION BOUNDARY  
**Date:** 2026-09-02  
**Scope:** `SK-TASK-026`, the CP-04-owned `/realtime` upgrade and local wire handoff  
**Related challenge:** [`../Validation/19-cp08-entrypoint-wire-preimplementation-challenge.md`](../Validation/19-cp08-entrypoint-wire-preimplementation-challenge.md)  
**Predecessors:** [`ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md), [`ADR-GAME-0015-cp08-worker-command-read-gateway.md`](ADR-GAME-0015-cp08-worker-command-read-gateway.md), and [`ADR-GAME-0016-cp08-realtime-snapshot-transport-boundary.md`](ADR-GAME-0016-cp08-realtime-snapshot-transport-boundary.md)

## Context

`RealtimeSnapshotHub` now proves full player-scoped connect and resync semantics behind a transport-
neutral sink. CP-04 already owns the custom Node HTTP server and its `upgrade` event, but the current
`/realtime` branch destroys every upgrade. A capability probe on the Node 24/Next 16.3.4 baseline found
that Node exposes a WebSocket client but no native server; Next exposes `getUpgradeHandler()` on the
custom server. The repository has no direct WebSocket package and no production authentication/session
issuer.

The next increment needs a real local wire proof without turning a socket handler into a second world
authority or inventing insecure client-selected scope. It must also make the absence of a production
session issuer truthful instead of hiding it behind a fixture token or a polling fallback.

## Decisions

### 1. CP-04 remains the sole upgrade owner

`createEntrypoint` keeps one `http.Server` and one `upgrade` listener. It delegates `/realtime` to one
`RealtimeWireAdapter` supplied directly or composed from the worker gateway and resolver; the adapter uses `ws`'s `WebSocketServer({ noServer: true })` and never
binds a port, creates another HTTP server, constructs a worker, starts a timer, or opens persistence.
Unknown upgrades retain CP-04's existing development delegation and production rejection behavior.

The direct `ws` dependency is selected instead of Node's missing server API, Next's private compiled
bundle, or the disposable CP-02 raw handshake. It is a transport implementation detail and does not
change the snapshot or game contracts.

### 2. Identity comes from an injected server-owned session resolver

The adapter accepts a `RealtimeSessionResolver` with the upgrade request and receives either a
server-created `ServerBoundRealtimeContext` or no session. The resolver is the only place allowed to
interpret a cookie, header, or future session credential. The adapter never accepts `world_id`,
`player_id`, `shelter_id`, or `binding` from a query string, WebSocket message, or client frame.

The current default entrypoint has no issuer or gameplay gateway composition, so it constructs no live
adapter and returns an explicit `REALTIME_UNAVAILABLE` response for `/realtime`. Focused local tests
inject a fixture resolver that maps an opaque test-only session value to a server-owned context. That
fixture does not issue, persist, log, or claim production credentials.

### 3. Admission is checked before and after authentication

The adapter receives an entrypoint-owned runtime admission callback. Only `ready` admits an upgrade.
`starting` or `degraded` maps to a typed `REALTIME_NOT_READY` response; `draining` maps to
`REALTIME_DRAINING`; `stopped` or an absent/disabled adapter maps to `REALTIME_UNAVAILABLE` or
`REALTIME_CLOSED` as appropriate. The state is checked again after the resolver returns so a connection
cannot win a race with drain. Missing or invalid session maps to a non-sensitive `REALTIME_AUTH_REQUIRED`
response. No credential or resolver exception is returned to the client or logger.

### 4. The wire is projection-only and exact

The server sends the hub's existing JSON `client_snapshot` frame unchanged:

```json
{
  "kind": "client_snapshot",
  "connectionId": "server-issued-id",
  "sequence": 1,
  "snapshot": { "full": true, "baseClientSnapshotId": null }
}
```

The only accepted inbound message is the existing `RealtimeResyncRequest` shape:

```json
{
  "kind": "resync_request",
  "connectionId": "server-issued-id",
  "reason": "STALE_FRAME",
  "lastAcceptedSequence": 1
}
```

The adapter requires the exact known keys and bounded reason/sequence values, and requires the
connection id to match the server-issued handle. It calls `connection.requestResync()` only; it cannot
commit movement, choose a scope, reveal hidden state, advance world time, settle cargo, or issue an
Agent action. Malformed or scope-mismatched control input receives a typed protocol error and closes the
connection without domain mutation. Concurrent valid resyncs share the hub's existing in-flight read.

Inbound control messages are limited to a small bounded payload. The adapter keeps no application-level
outbound queue; a sink failure marks the hub connection stale and the transport closes visibly. Snapshot
cadence, heartbeat, delta frames, and measured slow-client policy remain later work.

### 5. Wire errors and lifecycle are visible

Before a WebSocket upgrade, the adapter returns a short JSON HTTP error with a typed code and no request
or credential data. After upgrade, a recoverable hub error is a `realtime_error` frame containing only
the typed code and server connection id; a malformed protocol input closes with a protocol error. The
adapter never silently turns a failed snapshot into a success frame.

`drain()` first marks the adapter closed to new upgrades, calls `RealtimeSnapshotHub.drain()`, and lets
the existing CP-04 shutdown deadline close the listener and worker. Repeated drain/close calls are
idempotent. A WebSocket `close` event closes its hub handle; the hub remains the owner of connection
state and sink closure.

## Alternatives rejected or deferred

- **Trust a client `player_id` or binding:** rejected because it breaks snapshot privacy and server
  authority.
- **Put authentication issuance in this task:** deferred because no issuer, credential lifecycle, or
  production security policy exists; the resolver seam makes the missing boundary explicit.
- **Use a second HTTP server or route-owned worker:** rejected by CP-04 topology and gateway ordering.
- **Copy the CP-02 raw handshake:** rejected as disposable probe code with no maintained protocol or
  lifecycle contract.
- **Import Next's private `next/dist/compiled/ws`:** rejected because a framework-internal path is not a
  stable application dependency.
- **HTTP polling fallback:** rejected as a hidden realtime claim; the unsupported result remains visible.
- **Add movement commands, delta frames, cadence, heartbeat, or durable socket queues:** deferred to
  separate tasks with their own measurement and contract decisions.

## Verification and reopen triggers

The implementation must prove a real local upgrade with no/invalid/valid server-resolved session,
server-bound scope, sequence-1 full connect, full resync, malformed and mismatched control rejection,
gateway-only reads, runtime admission and drain, repeated close, no second listener/worker, and no
credential leakage. It must run on the pinned Node 24 baseline and use only the task's injected fixture
world and resolver.

Reopen this decision if the resolver must issue or persist credentials, the adapter trusts wire scope,
an inbound message mutates gameplay, the hub/gateway is bypassed, a second listener/worker/timer is
needed, an unbounded queue appears, the snapshot contract changes, or CP-04 cannot close the adapter
within its shutdown budget. Hosted auth, Origin/CSRF policy, browser UX, WebMCP, Re-entry, and
production performance remain unproven.

## Consequences

The game will have a truthful local network boundary that can carry the already verified snapshot
projection when a server-owned session and ready gateway are supplied. The default process remains
visibly unsupported until its world composition and real session provider are registered in later
work. No transport detail changes the worker, persistence, clock, or Agent authority boundaries.
