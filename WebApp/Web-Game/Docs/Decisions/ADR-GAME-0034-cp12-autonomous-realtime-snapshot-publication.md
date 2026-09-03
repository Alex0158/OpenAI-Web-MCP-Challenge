# ADR-GAME-0034: CP-12 Autonomous Realtime Snapshot Publication

**Status:** ACCEPTED AND RUNTIME-VERIFIED FOR `SK-TASK-051` NAMED LOCAL SCOPE  
**Date:** 2026-09-02  
**Decision owner:** Game owner under the standing authorized checkpoint delivery cycle  
**Contract:** `SK-MVP-0.2`  
**Challenge:** [`../Validation/62-cp12-autonomous-realtime-snapshot-publication-preimplementation-challenge.md`](../Validation/62-cp12-autonomous-realtime-snapshot-publication-preimplementation-challenge.md)

## Context

The local autonomous scheduler now advances one worker-owned clock and the composed gameplay phases,
but the realtime hub publishes only when a connection is established or a browser asks for a resync.
That is truthful and safe, yet a connected page cannot see a changed mission, world time, or player
position until it sends another read. A browser poller would create request pressure and blur the
world-clock boundary. A worker-owned socket would reverse the current layering.

The existing page already accepts unsolicited full `client_snapshot` frames, and the existing gateway
is the sole FIFO read seam. The smallest coherent extension is therefore a process-local progress
observer composed by the entrypoint and a bounded hub publication path.

## Decision

1. **One post-success observer.** `WorldWorker` exposes a process-local `onAdvance` registration. The
   worker invokes listeners after a successful `advance()` returns, passing the existing
   `WorldClockAdvanceResult`. It does not emit for startup `recoverTo()`; connect reads recovered
   state. The observer is not a Domain Event, persistence row, clock, or command queue.
2. **Entrypoint composition.** `RealtimeWireAdapter` exposes optional
   `publishCurrentSnapshots(): Promise<void>`. The entrypoint registers one non-blocking observer
   against the actual adapter once the fixture adapter is created. An injected/custom adapter that
   omits this optional method remains valid and makes no automatic-publication claim. A sink may also
   expose `notifyFailure(code)` so a real wire can surface an automatic publication failure before
   closing the stale connection; transport-neutral sinks may keep the typed stale/recovery state.
3. **Existing gateway and scope.** The adapter delegates publication to its hub. The hub reads one
   full snapshot per immutable server-bound connection context through `WorkerCommandGateway`; it
   never accepts a client scope, writes state, or invokes `advance()`.
4. **Bounded latest coalescing.** Each connection has at most one publication operation in flight and
   one pending trailing mode. Repeated worker advances set that connection's automatic pending mode.
   An explicit
   resync subsumes that trailing automatic slot and is serviced first; progress that arrives during
   the explicit operation creates at most one following automatic latest read. After the current
   read/send settles, the hub performs one latest read only if the connection is still ready. A stale,
   closed, draining, or failed sink remains an explicit recovery state and is not retried by an
   automatic loop.
5. **Full replacement and deterministic content.** Automatic publication sends a complete
   `client_snapshot` only when its deterministic `clientSnapshotId` differs from the last successfully
   sent snapshot. It increments the existing per-connection sequence only on a successful send.
   Explicit connect/resync requests always retain their current full-frame behavior, including when
   content is unchanged. Sequence gaps are allowed because every accepted frame is a full replacement.
6. **Failure and lifecycle.** Automatic publication catches gateway/sink failures inside the adapter
   boundary and does not reject, pause, or fault the world advance. Existing hub error mapping marks
   the connection stale; a wire sink reports a typed `realtime_error` and closes so the browser's
   existing reconnect path can recover, while a transport-neutral sink may retain the explicit
   resync path. Drain/close marks the connection closed before awaiting its sink and prevents pending
   automatic work from reading or sending after closure.
7. **Client and claim boundary.** No client code needs a second projection ingress or timer. The
   existing `RealtimeProjectionClient.accept()` remains the only renderable replacement path. This
   decision proves one local explicitly enabled worker-to-page publication seam only; it does not
   prove continuous default/hosted operation, public-load admission, held-key input, mobile UX,
   independent browser profiles, WebMCP, Re-entry, or judge reproduction.

## Alternatives considered

- **Browser polling or animation resync:** rejected because it adds client-driven timing and a second
  request/backpressure path.
- **WebSocket command/progress protocol:** rejected for this increment because it mixes mutation and
  projection and reopens command identity and wire lifecycle.
- **Worker-to-hub or worker-to-sink coupling:** rejected because gameplay would depend on transport and
  a sink failure could contaminate world execution.
- **Hub-owned timer:** rejected because it creates a second scheduler and unclear shutdown ownership.

## Consequences

The explicit local autonomous page becomes visibly live with one bounded publication path and no schema
or wire-envelope change. A slow sink may fall behind and then receive the latest complete frame; the
intermediate frames are intentionally not replayed. Automatic reads can add local gateway work at the
worker cadence, so public-load capacity and fan-out limits remain an explicit later operations task.

The page can now receive snapshots while a movement or dispatch acknowledgement is pending. Existing
reconciliation gates remain authoritative; automatic frames may settle a pending readback, while a
lower or wrong frame still follows the existing stale/follow-up rules.

## Verification and reopen triggers

Verify observer ordering, changed/equal snapshot publication, one in-flight plus one trailing request,
sequence monotonicity, per-connection privacy, failed advance/sink, stale/close/drain races, custom
adapter no-claim behavior, and a real local wire frame after an explicit worker advance without a
manual resync. Reopen before implementation adds a timer, schema/wire field, command message, browser
clock, durable queue, hosted/public admission, or held-input lease.
