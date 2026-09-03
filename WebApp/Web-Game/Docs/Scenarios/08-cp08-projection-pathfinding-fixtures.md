# CP-08 Projection, Movement, and Pathfinding Fixtures

**Status:** CP-08 movement/snapshot, worker cadence, command/read gateway, transport-neutral realtime projection, and local authenticated wire increments runtime-verified; production identity, browser UX, and hosted route remain open  
**Checkpoint:** CP-08  
**Contract:** [MVP contract sheet](../Engineering/09-mvp-contract-sheet.md)  
**Audit:** [CP-08/09 preparation audit](../Validation/09-cp08-cp09-preimplementation-audit.md)  
**Purpose:** Turn the accepted movement, visibility, route, snapshot, and reconnect rules into deterministic vectors for implementation after CP-05 through CP-07 expose the worker-owned world seam.

These scenarios describe authoritative inputs and observable outcomes. The first local increment is
implemented by `PlayerMovementService` and `ClientSnapshotService`; it does not define a WebSocket
wire format, a database schema, a browser timer, or a new visibility policy. A fake clock or simulated
network is a test instrument only; it cannot become gameplay authority.

The bounded local result is recorded in
[`../Evidence/SK-EVID-011-cp08-movement-snapshot-runtime-verification.md`](../Evidence/SK-EVID-011-cp08-movement-snapshot-runtime-verification.md)
and reviewed in
[`../Validation/15-cp08-movement-snapshot-runtime-cross-functional-audit.md`](../Validation/15-cp08-movement-snapshot-runtime-cross-functional-audit.md).
The worker cadence result is recorded in
[`../Evidence/SK-EVID-012-cp08-worker-movement-cadence-runtime-verification.md`](../Evidence/SK-EVID-012-cp08-worker-movement-cadence-runtime-verification.md)
and reviewed in
[`../Validation/16-cp08-worker-cadence-runtime-cross-functional-audit.md`](../Validation/16-cp08-worker-cadence-runtime-cross-functional-audit.md).
The transport-neutral realtime projection result is recorded in
[`../Evidence/SK-EVID-014-cp08-realtime-snapshot-runtime-verification.md`](../Evidence/SK-EVID-014-cp08-realtime-snapshot-runtime-verification.md)
and reviewed in
[`../Validation/18-cp08-realtime-snapshot-runtime-cross-functional-audit.md`](../Validation/18-cp08-realtime-snapshot-runtime-cross-functional-audit.md).
The local authenticated wire result is recorded in
[`../Evidence/SK-EVID-015-cp08-realtime-wire-runtime-verification.md`](../Evidence/SK-EVID-015-cp08-realtime-wire-runtime-verification.md)
and reviewed in
[`../Validation/20-cp08-realtime-wire-runtime-cross-functional-audit.md`](../Validation/20-cp08-realtime-wire-runtime-cross-functional-audit.md).

## Fixture envelope

| Field | Preparation value |
|---|---|
| Contract version | SK-MVP-0.2 |
| Fixture | sleepless-mvp-01 |
| World identity | An isolated runtime world created by CP-07 |
| Map | 128 x 128 logical tiles, camera target 32 x 20 |
| Shelters | shelter-a at (16,64) and shelter-b at (112,64) |
| Movement reconciliation | 100 ms authoritative step |
| Projection target | About 10 Hz delivery; browser interpolation up to 60 FPS |
| Player speed | 4.0 logical tiles per world second |
| Soldier speed | 3.0 logical tiles per world second |
| Engagement radius | Inclusive 1.0 logical tile |
| Player fog reveal radius | Inclusive 4.0 logical tiles |
| Soldier sensor radius | Inclusive 6.0 logical tiles |

The exact generated walkability and actor positions come from the persisted CP-07 fixture. Scenario
identities must be scoped by world_id; a reset creates a new world and cannot reuse old command or
projection state.

## Projection envelope target

Every accepted projection carries the contract version, client_snapshot_id, world time, player
scope, entity revisions, visible actors/nodes, explored cells for that player, shelter/mission
records, and recent causal events permitted to that player. A full snapshot is mandatory on connect
and resync. A steady-state frame may reference base_client_snapshot_id only after CP-08 defines and
tests its delta semantics.

The browser may animate between accepted positions. It cannot advance world time, cross a blocked cell,
resolve combat, reveal hidden cells, award coins, or rewrite a revision.

## Vectors

### P08-01 — Full connect projection is scoped

**Given:** Player A and Player B join the same persisted fixture world.  
**When:** Each session receives its first client_snapshot.  
**Then:** Both snapshots carry the same world_id, contract version, and world time, but each contains
only its own shelter/mission records, its own explored-cell state, and actors allowed by the current
visibility rule. The full hidden map and the other shelter's private state are absent.

### P08-02 — Authoritative player movement

**Given:** Player A starts at its shelter and sends valid directional input through the canonical
move_player command boundary.  
**When:** The worker advances three 100 ms movement steps for Player A.  
**Then:** Each step contributes 0.4 logical tile; the third step commits the first adjacent tile,
retains 0.2 process-local tile progress, advances the player revision once, and the next projection
reflects the accepted position. The accumulator is not persisted.
A local prediction that differs from the projection is reconciled rather than trusted.

### P08-03 — Blocked and out-of-bounds movement

**Given:** Player A sends movement toward a blocked cell or beyond the 0..127 bounds.  
**When:** The command reaches the worker.  
**Then:** The server rejects or clamps it according to the selected route policy, returns a typed result,
and never commits a position outside the walkable fixture. The browser cannot hide the rejection by
continuing an authoritative local path.

### P08-04 — Stale movement command

**Given:** Two commands carry the same old player revision and different idempotency keys.  
**When:** The first commits and the second arrives afterward.  
**Then:** The second returns STALE_REVISION with the current revision and creates no movement event.
A repeated first key returns its original result without moving again.

### P08-05 — Fog persists per player

**Given:** Player A walks across cells within the inclusive fog reveal radius, then disconnects.  
**When:** Player A reconnects after world time advances.  
**Then:** Its explored cells remain in its player-scoped projection. Player B does not inherit them, and
reconnection does not reveal a fresh actor position that Player A did not legally observe.

### P08-06 — Sensor and exploration scopes remain separate

**Given:** A field soldier observes an actor inside the soldier sensor radius while the player avatar
is elsewhere outside its fog reveal radius.  
**When:** The worker emits the next permitted projection.  
**Then:** The soldier's observation is available only to the scopes selected by the current sensing
policy; player exploration is not silently expanded. The exact sharing policy remains an implementation
open gate and must be recorded before runtime closure.

### P08-07 — Remote movement is presentation-only

**Given:** Player B moves while Player A receives snapshots with simulated network delay.  
**When:** Player A renders between accepted snapshots.  
**Then:** A may interpolate B smoothly at up to 60 FPS, but the delayed frame cannot change B's actual
position, world time, encounter result, or hidden visibility. A later authoritative snapshot corrects
the projection.

### P08-08 — Missing or out-of-order snapshot base

**Given:** A steady-state frame references a base snapshot that Player A did not receive, or arrives
behind the accepted projection.  
**When:** The client validates the frame.  
**Then:** The page enters STALE/RECONNECTING according to the connection policy and requests a full
snapshot. It does not merge the frame onto an unrelated base or accept new state-changing commands
before the full replacement is installed.

### P08-09 — Reconnect while the world continues

**Given:** Player A closes the page while a soldier route or monster route continues in the worker.  
**When:** The player reconnects after several world seconds.  
**Then:** The worker has continued from durable world time; the session receives a full current
projection with current revisions, route status, mission rows, and permitted causal events. No browser
timer creates a duplicate movement, extraction, combat, or mission event.

### P08-10 — Route invalidation and bounded replan

**Given:** A committed route becomes invalid because a walkability version changes, a target moves, or
the home anchor changes.  
**When:** The next route milestone is due.  
**Then:** The server invalidates the cached route, attempts the bounded replan allowed by the current
policy, preserves elapsed world time, and either continues with the new route or enters WAITING_REVIEW
with a typed reason. It never teleports to the target or retries forever.

### P08-11 — No safe route is visible as a state

**Given:** The selected walkability and replan policy cannot produce a legal route.  
**When:** The worker exhausts the bounded attempt.  
**Then:** Route status and the related mission projection show the typed waiting outcome and next valid
action. The browser cannot keep animating a route that the server has abandoned.

### P08-12 — Unsupported realtime capability

**Given:** The selected browser or host cannot establish the /realtime upgrade.  
**When:** The page starts or the connection fails.  
**Then:** The capability is visibly unavailable/degraded, the page does not claim a live snapshot
stream, world time remains server-owned, and the ordinary human read/command surface remains truthful.
No silent second server or unverified fallback is created.

## Shared assertions

- The worker, never the browser, owns world time, positions, walkability, route milestones, visibility,
  and entity revisions.
- A snapshot is replaceable projection state; world_snapshot and the event log are the restart
  authority.
- Every committed mutation has one event identity and one causal revision; duplicate commands and
  retries cannot create a second movement or settlement effect.
- Player A and Player B share one authoritative world while retaining player-scoped fog, observations,
  mission records, and private state.
- Network timing affects interpolation and connection status only; it cannot affect deterministic
  movement, combat, cargo, or reward outcomes.
- Hidden state is omitted or typed as unavailable rather than leaked through errors, deltas, or stale
  projections.
- A scenario run twice with the same world seed, event order, input revisions, and network fixture
  produces the same authoritative positions, route status, and event order.

## P08-13 — Worker gateway preserves causal ordering

**Given:** A ready worker receives a movement intent, a full snapshot read, and an explicit clock
advance through one gateway.  
**When:** The calls are submitted in a known order, including one operation that returns a typed
failure.  
**Then:** They execute in FIFO order, the read observes preceding accepted mutations, the advance
does not race either operation, and a failed entry does not poison later entries. Direct service calls
remain internal tests rather than browser authority.

## P08-14 — Gateway close and replacement are visible

**Given:** The gateway is closed or its worker is replaced while operations are queued.  
**When:** A new call or a queued call reaches the gateway.  
**Then:** It returns `GATEWAY_CLOSED` or `WORKER_NOT_READY` without mutating gameplay state. An operation
already executing may finish; the next worker starts with no queued command or movement intent and
requires fresh input.

## P08-15 — Realtime connect and resync are full replacements

**Given:** A server-bound Player A connection attaches to the entrypoint-owned realtime hub.  
**When:** It connects or requests resync, then receives a delayed or out-of-order frame.  
**Then:** Connect and resync deliver a full player-scoped `client_snapshot` with
`base_client_snapshot_id = null`; the browser replaces projection state only for a newer connection
sequence, marks a stale sequence for full resync, and cannot mutate gameplay or select Player B's scope.

## P08-16 — Realtime capability and drain stay truthful

**Given:** The worker/runtime is not ready, draining, or the selected browser/host lacks the realtime
upgrade.  
**When:** A connection is attempted.  
**Then:** The hub returns a typed unavailable/closed outcome, the page remains readable with visible
degraded status, and no queued command, second timer, fallback server, or false live-stream claim is
created.

## Open implementation fields

The following may be filled by CP-08 implementation after measurement, but must not be silently
treated as contract truth before then:

- exact WebSocket message, acknowledgement, heartbeat, and close envelope;
- movement command transport and input sequence policy;
- delta snapshot encoding, maximum age, and full-resync trigger;
- sensor payload and whether an observation is shared with the player or Agent;
- terrain cost, collision radius, waypoint granularity, and interpolation correction threshold; and
- production packet-loss, event-loop, snapshot-size, and latency budgets.

## Non-goals

This fixture does not implement missions, extraction, combat, migration, siege, breach, WebMCP, Agent
delivery, production population, or a general procedural map system. It does not make a client snapshot
durable, or make unsupported realtime capability look successful.
