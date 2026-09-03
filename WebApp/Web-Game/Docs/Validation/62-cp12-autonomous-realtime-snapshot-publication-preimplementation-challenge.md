# CP-12 Autonomous Realtime Snapshot Publication Pre-Implementation Challenge

**Status:** ACCEPTED PRE-IMPLEMENTATION CHALLENGE UNDER `SK-TASK-051`  
**Checkpoint:** CP-12  
**Task:** [`SK-TASK-051`](../Tasks/SK-TASK-051-cp12-autonomous-realtime-snapshot-publication.md)  
**Decision:** [`ADR-GAME-0034`](../Decisions/ADR-GAME-0034-cp12-autonomous-realtime-snapshot-publication.md)  
**Date:** 2026-09-02

## Question

How can the explicitly enabled local autonomous worker keep an authenticated page visibly current
without making the browser a clock, adding a second projection authority, blocking gameplay on a
slow sink, or turning each worker wakeup into an unbounded message queue?

## Evidence that changes the initial hypothesis

- `WorldWorker.advance()` already executes the one authoritative clock/phase graph, and the
  autonomous scheduler calls that same method. A successful return is therefore the narrowest
  process-local progress boundary.
- `WorkerCommandGateway.fullSnapshot()` is the existing FIFO read seam. `RealtimeSnapshotHub` already
  coalesces concurrent explicit reads per connection and sends only full scoped replacements.
- The browser socket already accepts `client_snapshot` frames without a request-specific response
  matcher. The projection client rejects old, wrong-connection, wrong-scope, or invalid frames and
  keeps the last accepted snapshot.
- The current hub has no timer or publisher. A page only sees autonomous progress after an explicit
  `resync_request`, so the local continuous-world result is not visibly live while connected.
- `clientSnapshotId` is deterministic for the complete snapshot body. Equal automatic content need
  not consume a wire sequence or a sink write; explicit connect/resync requests still need their
  promised frame.

## Failure modes to disprove

1. **Authority leak:** a publisher calls `advance`, writes state, or lets a browser timestamp decide
   when gameplay progresses.
2. **Lost latest state:** progress occurs while a full snapshot read or sink write is in flight and
   the connection never receives a trailing latest snapshot.
3. **Queue growth:** every 100 ms wakeup allocates another promise, snapshot, or frame for a slow
   connection instead of retaining one bounded dirty bit.
4. **Duplicate projection:** an automatic frame and an explicit resync mutate Canvas through
   different paths or cause a sequence regression/loop.
5. **Scope crossover:** broadcasting one fetched snapshot to a connection with another server-bound
   player, world, or shelter context.
6. **Lifecycle race:** a worker fault, drain, close, socket close, or sink error leaves a late send,
   unhandled rejection, or a scheduler that waits on the browser.
7. **False availability:** custom/injected realtime adapters or non-autonomous fixtures are reported
   as having automatic publication when they do not.
8. **Overclaim:** a local frame proves hosted liveness, public fan-out, two independent browser
   profiles, WebMCP, Re-entry, or an always-on default world.

## Alternatives

### A — Browser polling or animation-driven resync

Rejected. It adds client timing, repeated requests, and a second backpressure path. `requestAnimationFrame`
may later interpolate an accepted snapshot, but it must not decide when the server advances or become
the publication transport for this task.

### B — Add movement commands or a new command message to the WebSocket

Rejected for this increment. It mixes mutation and projection protocols, reopens command identity and
connection lifecycle, and is unnecessary to prove that autonomous world progress reaches a page.
Held-key input remains a separate task with its own stop/lease and stale-revision design.

### C — Worker owns the hub or calls a sink directly

Rejected. It reverses the layering: gameplay would know transport, test doubles would need sockets,
and a worker fault could become a wire failure. The entrypoint remains the composition owner.

### D — Per-connection polling inside the hub

Rejected. It would create a second timer and unknown lifecycle ownership. Publication is triggered only
by the existing worker advance observer; no hub timer is introduced.

### E — Entrypoint observer plus bounded latest full-snapshot publisher (selected)

Selected. `WorldWorker` exposes a process-local post-success advance observer. The real wire adapter
offers one optional `publishCurrentSnapshots()` seam, and the entrypoint wires the observer when the
actual adapter exists. The hub retains at most one publication operation and one pending trailing
mode per connection. It reads through the existing gateway, compares the
deterministic snapshot id, and sends a newer full replacement with the next sequence only when the
content changed.

## Accepted contract

1. **Progress boundary.** `WorldWorker.advance(elapsedMs)` remains the sole mutation/clock entry. It
   notifies registered observers only after the clock returns successfully. `recoverTo()` during
   startup does not emit a live frame; the first connect reads the recovered state.
2. **Composition.** The entrypoint registers one observer after its final realtime adapter is known
   and before worker start. A custom adapter without the optional publisher method receives no claim or
   hidden fallback. The observer invokes publication asynchronously and never awaits a sink.
3. **Hub scope.** Each connection fetches its own snapshot with its immutable server-bound context.
   No client field, connection id, or frame is used to select a different world/player/shelter.
4. **Automatic coalescing.** A connection may have one publication read/send in flight and one
   pending trailing mode. Additional worker advances set one automatic dirty bit. An explicit resync
   subsumes an automatic trailing mode and is serviced first; progress arriving during that explicit
   operation may create only one following automatic latest read. After the current operation settles,
   one latest read runs if the connection is still `READY`; closed/stale connections do not receive
   automatic frames until an explicit resync succeeds.
5. **Content and sequence.** A successful automatic read whose `clientSnapshotId` equals the last
   successfully sent snapshot is skipped. A changed snapshot is sent as a complete
   `client_snapshot` with `sequence = lastSequence + 1`. Sequence gaps are legal because frames are
   full replacements; sequence numbers never regress or increment for a skipped/failed send.
6. **Explicit requests.** Connect and `requestResync()` retain current behavior and always send one
   full frame, even when the body is unchanged. They share the same per-connection in-flight gate;
   an automatic request already in flight is followed by at most one forced explicit operation, so
   recovery is not silently replaced by an automatic skip.
7. **Failures.** A gateway or sink failure marks the connection `STALE` using existing typed
   transport behavior. Automatic publication catches its own failure so it cannot reject or fault the
   world advance. A wire sink may surface a typed `realtime_error` and close the stale connection so
   the browser's existing reconnect path becomes visible; a transport-neutral sink may retain the
   next explicit reconnect/resync as its recovery path.
8. **Lifecycle.** Hub drain/close marks connections closed before awaiting sink closure. Pending
   automatic work checks that state before reading or sending; no new publication is accepted after
   the hub is draining/closed, and an already accepted sink operation cannot advance the connection
   cursor or state after closure.
9. **Client.** The existing `RealtimeProjectionClient.accept()` remains the only renderable ingress.
   Automatic frames can settle an unknown movement/dispatch readback through existing gates; they do
   not add optimistic state, a second sequence, or an automatic resync loop.
10. **Claim.** Evidence may say only: one local explicitly enabled worker can publish newer full
    snapshots to authenticated local connections. It cannot say default hosted liveness, public-load
    backpressure, independent browser sessions, positive WebMCP, Re-entry, or judge reproduction.

## Acceptance matrix

| Surface | Positive proof | Negative/boundary proof |
|---|---|---|
| Worker authority | `advance` returns, then one observer publication is requested | Observer never calls `advance`; failed clock advance produces no frame |
| FIFO/read ordering | Publisher reads through the existing gateway after worker progress | No store or second gateway is called from the hub; no browser timer/resync loop |
| Content | Changed snapshot sends one newer full frame | Equal `clientSnapshotId` does not send another automatic frame; explicit resync still sends |
| Coalescing | Progress during in-flight read results in one trailing latest read/frame | Slow sink retains one in-flight operation plus one dirty bit, never an unbounded queue |
| Sequence | Sent frames are strictly increasing and full replacements | Failed/skipped frames do not consume sequence; gaps do not regress projection |
| Scope/privacy | A and B connections receive their own server-bound snapshots | No broadcast of A's body to B; frame/request ids cannot select scope |
| Lifecycle | Ready connection receives progress and clean close drains | Stale/closed/draining hub does not publish; sink error is visible without world fault |
| Client UX | Existing page accepts an unsolicited newer frame and updates status/map | No optimistic mutation, duplicate resync, or hidden fallback; unsupported/custom adapter stays explicit |
| Restart/claim | Reconnect after restart reads current recovered snapshot | This does not prove hosted continuity, default-world bootstrap, WebMCP, Re-entry, or two profiles |

## Required Red, Green, and verification

1. Red the hub's absent automatic frame, equal-content suppression, latest-after-in-flight, and
   close-before-send cases.
2. Red worker observer ordering and entrypoint adapter wiring with a real local fixture; include a
   custom adapter without publication as an explicit no-claim case.
3. Green only the observer, optional adapter method, and bounded hub state. Do not alter the snapshot
   shape, scheduler cadence, command routes, persistence, or browser input.
4. Run the dedicated publication suite, CP-08 realtime/wire and CP-06 autonomous focused suites,
   typecheck, and one file-backed wire proof without a manual `resync_request` after advance.
5. Review the complete path: scheduler -> worker clock -> observer -> entrypoint adapter -> gateway
   full read -> hub coalescer -> sink -> projection client -> Canvas/semantic state -> drain.

## Stop and reopen conditions

Stop before implementation if a publication requires a second clock, a browser timer to determine
world progress, a durable queue, a new snapshot/wire schema, a command protocol, a direct worker-to-
socket dependency, or a public-load admission budget. Reopen the challenge when held-key transport,
mobile UX, independent identities, scheduler cadence, or a positive WebMCP/Re-entry boundary becomes
part of the intended increment.
