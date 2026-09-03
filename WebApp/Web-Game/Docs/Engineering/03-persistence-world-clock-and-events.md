# Persistence, World Clock, and Events

**Status:** CP-05 local persistence, the CP-06 clock/recovery, boundary-safe gameplay coordinator, and explicitly enabled autonomous scheduler, CP-08 schema/cadence/command-read/projection/wire seams, the CP-09 dispatch/route-arrival boundaries, the CP-10 extraction/cadence/`RETURNING`/same-worker contest/deposit boundaries, and CP-11 encounter/combat/cargo-loss/respawn, HUNTER victory/return, and bounded danger-cell reissue/review boundaries are runtime-verified locally; production identity and hosted continuity remain target

## Durable entities

The first schema will need a world, player, shelter, shelter upgrade, soldier, mission, mission
attempt, cargo, resource node, monster, intelligence record, migration, encounter, battle result,
Domain Event (`domain_event`), and outbox delivery record. A soldier identity is stable across ordinary respawn;
each sortie or restart is a separate mission attempt so the dashboard can explain what happened
without creating a duplicate soldier. Exact columns belong to the implementation decision.

CP-05 implements the smaller G2 minimum (`world`, `player`, `shelter`, `soldier`, `mission`, mission
attempt, cargo, resource node, monster, encounter, `world_snapshot`, Domain Events, idempotency, and
coalesced delivery state). Intelligence, migration, shelter-upgrade, and separate battle-result
records remain owned by their later checkpoints and must arrive through their own compatible schema
increment rather than being partially introduced here.

CP-08 schema version 2 added the player avatar's integer position and canonical explored-cell set to
the existing player aggregate. CP-09 advances the internal schema to version 3 (`cp09-001`) with
transactional mission phase, role/tool, return policy, active attempt, route, home-anchor, and world
time handoff fields. Schema 1 and schema 2 databases migrate forward atomically; unknown, newer, or
partially applied shapes fail visibly. The migration does not change the `SK-MVP-0.2` contract or
introduce a mission timer. CP-10 advances the local shape to schema 4 (`cp10-001`) for cargo
provenance and recurring extraction/return metadata without changing the contract version. CP-11
advances the local shape to schema 5 (`cp11-001`) for structured encounter participants, HP, round
due markers, engagement cells, terminal causes, and mission/attempt linkage; the contract version
remains unchanged. The schema-5 store now also commits the typed HUNTER victory transition, retaining
the monster as `DEAD` history, clearing encounter linkage, and moving the same mission to `RETURNING`
without a cargo or coin mutation. The local result is recorded in
[`../Evidence/SK-EVID-024-cp11-hunter-victory-runtime-verification.md`](../Evidence/SK-EVID-024-cp11-hunter-victory-runtime-verification.md)
and [`../Validation/38-cp11-hunter-victory-runtime-cross-functional-audit.md`](../Validation/38-cp11-hunter-victory-runtime-cross-functional-audit.md).

The CP-11 reissue increment advances the local shape to schema 6 (`cp11-002`) with a one-bit monster
reissue budget, nullable danger cell and typed review reason on `mission`, plus terminal cause on
`mission_attempt`. The terminal GATHERER combat transaction consumes the budget and commits either a
deterministic danger-cell-avoiding attempt or `WAITING_REVIEW` atomically with cargo loss, respawn,
events, revisions, and idempotency. Manual dispatch and successful deposit reset the next chain's
budget. Local runtime evidence is recorded in
[`../Evidence/SK-EVID-025-cp11-danger-cell-reissue-runtime-verification.md`](../Evidence/SK-EVID-025-cp11-danger-cell-reissue-runtime-verification.md)
and reviewed in [`../Validation/40-cp11-danger-cell-reissue-runtime-cross-functional-audit.md`](../Validation/40-cp11-danger-cell-reissue-runtime-cross-functional-audit.md).

The CP-06 composition increment first advanced the local shape to schema 7 (`cp06-003`) with one
nullable `world.in_progress_world_time` marker. The accepted autonomous extension advances the local
shape to schema 8 (`cp06-004`) with nullable `world.server_time_anchor_ms` restart metadata.
`world.world_time` means the last fully completed integer
boundary; a worker reserves the next boundary, runs the fixed G2 phases through one coordinator, and
clears the marker only after completion. If a phase fails, startup replays the whole marked boundary
before worker readiness. Existing phase transactions retain their own bounded idempotency and due
guards and no longer publish completed time while the marker is active. A previously depleted
GATHERER target takes a durable zero-cargo `MissionAutoReturned(reason = TARGET_DEPLETED)` path so
expected competition does not block the world. The local result is recorded in
[`../Evidence/SK-EVID-035-cp06-gameplay-phase-coordinator-runtime-verification.md`](../Evidence/SK-EVID-035-cp06-gameplay-phase-coordinator-runtime-verification.md)
and reviewed in [`../Validation/57-cp06-gameplay-phase-coordinator-runtime-cross-functional-audit.md`](../Validation/57-cp06-gameplay-phase-coordinator-runtime-cross-functional-audit.md).

The CP-06 autonomous extension uses one persisted server-time observation only during explicitly
enabled startup recovery and one process-monotonic one-shot worker scheduler for live elapsed time.
The anchor is initialized once for a fresh world and updated only in atomic live or bounded-recovery
boundary completion. If an interrupted boundary is replayed, the pre-replay anchor remains in place
until the recovery target is derived, so the marker is counted once rather than erasing downtime. A
backward or malformed observation fails closed, and downtime above 300 world seconds remains
`RECOVERY_LIMIT_EXCEEDED`. The local runtime result is recorded in
[`../Evidence/SK-EVID-036-cp06-autonomous-scheduler-runtime-verification.md`](../Evidence/SK-EVID-036-cp06-autonomous-scheduler-runtime-verification.md)
and reviewed in [`../Validation/59-cp06-autonomous-scheduler-runtime-cross-functional-audit.md`](../Validation/59-cp06-autonomous-scheduler-runtime-cross-functional-audit.md).

The CP-08 worker cadence routes fixed 100 ms healthy-worker steps through the same integer movement
transaction. Intent identity and idempotency records are durable, while active intent and fractional
progress remain process-local and are cleared on worker replacement. The boundary is defined in
[`../Decisions/ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md`](../Decisions/ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md).

The process-local `WorkerCommandGateway` now serializes movement intent, full player-scoped snapshot
reads, and explicit worker clock advances in invocation order. `RealtimeSnapshotHub` adds a
transport-neutral, server-bound full connect/resync projection seam on top of that gateway. The CP-08
wire adapter composes one hub and gateway through the entrypoint with an injected server-owned session
resolver; it has no gameplay timer or durable connection queue. Production identity and hosted
continuity remain separate work. The bounded local wire result is recorded in
[`../Evidence/SK-EVID-015-cp08-realtime-wire-runtime-verification.md`](../Evidence/SK-EVID-015-cp08-realtime-wire-runtime-verification.md).

The CP-09 `MissionService` now sends one server-derived GATHERER route through the same worker FIFO.
The soldier transition, mission/attempt rows, `MissionDispatched` event, and command idempotency
record share one transaction. The local assignment boundary is recorded in
[`../Evidence/SK-EVID-016-cp09-gatherer-dispatch-runtime-verification.md`](../Evidence/SK-EVID-016-cp09-gatherer-dispatch-runtime-verification.md).

The CP-09 `MissionTravelService` consumes the paired mission and attempt due markers during the
existing worker clock's movement phase. It derives intermediate position from the committed route,
start time, and the fixed soldier speed, then commits one `TRAVELLING` to `WORKING` arrival with a
single `MissionWorking` event. The CP-10 first-extraction integration arms the successor extraction
marker two world seconds after arrival; it does not extract at the arrival boundary. Schema-2
migration adds the nullable due columns atomically, and the CP-10 migration adds cargo provenance
columns; the local route boundary and its claim limits are recorded in
  [`../Evidence/SK-EVID-017-cp09-route-milestone-runtime-verification.md`](../Evidence/SK-EVID-017-cp09-route-milestone-runtime-verification.md)
  and reviewed in [`../Validation/24-cp09-route-milestone-runtime-cross-functional-audit.md`](../Validation/24-cp09-route-milestone-runtime-cross-functional-audit.md). The first extraction boundary is verified in [`../Evidence/SK-EVID-018-cp10-first-extraction-runtime-verification.md`](../Evidence/SK-EVID-018-cp10-first-extraction-runtime-verification.md), with its cross-functional disposition in [`../Validation/26-cp10-first-extraction-runtime-cross-functional-audit.md`](../Validation/26-cp10-first-extraction-runtime-cross-functional-audit.md). The recurring cadence/return handoff is verified in [`../Evidence/SK-EVID-019-cp10-extraction-cadence-runtime-verification.md`](../Evidence/SK-EVID-019-cp10-extraction-cadence-runtime-verification.md), with its cross-functional disposition in [`../Validation/28-cp10-extraction-cadence-runtime-cross-functional-audit.md`](../Validation/28-cp10-extraction-cadence-runtime-cross-functional-audit.md). The same-worker contest outcome is verified in [`../Evidence/SK-EVID-020-cp10-contested-node-runtime-verification.md`](../Evidence/SK-EVID-020-cp10-contested-node-runtime-verification.md), with its cross-functional disposition in [`../Validation/30-cp10-contested-node-runtime-cross-functional-audit.md`](../Validation/30-cp10-contested-node-runtime-cross-functional-audit.md) under [`../Decisions/ADR-GAME-0022-cp10-contested-node-outcome.md`](../Decisions/ADR-GAME-0022-cp10-contested-node-outcome.md); return movement and settlement remain separate tasks.

## World snapshot and event log

The store keeps the latest authoritative `world_snapshot` plus append-only Domain Events. A periodic
`world_snapshot` makes restart fast; the event log supplies causal history and recovery of events that
were committed near a process fault. Every entity mutation advances a version. Each committed Domain Event also gets
a monotonically increasing `world_event_cursor` scoped to its `world_id`; the cursor is allocated in
the same transaction as the state mutation so a signal can identify an ordered read window.

Persistence stores the worker-supplied authoritative non-negative integer `world_time`; it never
derives gameplay time from process, wall, or client time. A regression is rejected visibly, while
forward advancement and downtime catch-up remain CP-06 responsibilities. CP-06 accepts a recovery
gap through `MAX_RECOVERY_WORLD_SECONDS = 300`; a larger gap returns `RECOVERY_LIMIT_EXCEEDED`, keeps
the last durable cursor and history intact, and closes the world mutation gate.

Before an autonomous scheduler starts, active missions, nodes, encounters, and monster timers must expose stable
work/milestone identities, `next_due_world_time`, reclaimable claim/attempt identity with bounded
wall-time lease metadata, and claim revisions in their current rows or in a complete scheduler
projection inside `world_snapshot`. The world state also retains the versioned `world_seed`,
`generation_version`, and `map_fingerprint` that CP-07 needs to detect fixture drift; CP-05 stores
these values without selecting the generator.

## Outbox

A gameplay transaction writes its state changes, Domain Event, and any eligible Agent Signal delivery
record to one database transaction. The Domain Event log retains every committed state change. The
derived Agent Signal may reference a `world_event_cursor` range and summarize multiple events; the
range is a page-read window and may include routine events that are not eligible for delivery. The
signal is the only object sent to the Re-entry Core boundary.

The delivery dispatcher classifies routine, actionable, and critical events. For each opaque
continuation binding and shelter, at most one Agent Signal is pending or in flight. Later eligible
events merge into its eligible count, `world_event_cursor` range, event types, severity, latest event,
and latest world time.
A retry reuses the same signal identity. After handoff, new events accumulate in the delivery slot's
deferred cursor and are folded into the next signal only after the current delivery is acknowledged or
terminally rejected. The Local Connector sends one coalesced wake-up to the bound Codex Thread and holds
additional context until the next safe turn boundary instead of sending one message per event. An
accepted signal is never treated as a completed Agent action. An eligible event that arrives during the
cooldown with no pending or in-flight delivery remains durable history only; it does not enter the active
or deferred Signal window and is not folded into a later Signal. The Agent rereads canonical page history
when it needs the complete sequence.

The `agent_signal_slot` is the logical coalescing authority: it owns the active signal summary,
deferred cursor, status, and cooldown for one world, shelter, and opaque binding. An
`outbox_delivery` references that signal identity and records transport attempts, leases, and outcomes;
it cannot mutate gameplay state or create a second Signal. A delivery acknowledgement settles the slot
and attempt together and appends `ContinuationDelivered` once.

## Idempotency

Commands carry a client or Agent idempotency key. Battle resolution, cargo transfer, reward, respawn,
breach, migration charge, Agent Signal delivery, and outbox delivery have unique event identities.
Retried requests either return the original result or fail visibly on a version conflict. Coalescing a
signal never removes the Domain Events needed for replay or settlement.

## Restart semantics

On restart, the worker reads the latest `world_snapshot` and world clock. If an in-progress boundary
marker exists, it replays that whole integer boundary before reporting ready; stable work identities,
due markers, and terminal state make already committed effects skip or replay exactly once. Wall-clock
downtime does not reset the world; an explicit reconciliation advances due world-time work according to
the accepted clock policy. A reconnecting browser receives a full `client_snapshot` projection after
the durable state is recovered; it never supplies or replaces the `world_snapshot`.

CP-04 provides only the process startup seam. It must not create a database, snapshot, event, outbox
row, or world timer. CP-05 persistence initialization and CP-06 marker recovery now run inside the
worker startup seam before the process reports world-ready behavior; process `live`/`ready` health
remains distinct from the existence of a world snapshot. Normal boundary replay may keep the process
observable while the world mutation gate returns `RECOVERY_REQUIRED`; only an unrecoverable store or
replay failure maps the process to `degraded`.
