# API and WebMCP Surface

**Status:** TARGET contract; the process-local worker gateway, transport-neutral projection seam, authenticated local WebSocket wire adapter, bounded CP-09 mission-dispatch/route-arrival boundaries, CP-10 extraction/cadence/`RETURNING`/same-worker contest boundaries, the CP-06 schema-v8 boundary journal/anchor and explicitly enabled autonomous gameplay coordinator, the CP-12 local fixture/bootstrap/browser hydration plus discrete movement, ordinary-UI GATHERER command composition, and server-owned continuous-intent path, and the CP-13 page-bound read/recall implementation are runtime-verified at their named local scopes. Canonical-page four-read registration/readback and one supported read-only invocation are verified for one local `gpt-5.6-sol` plus `medium` session under [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md); the local dynamic continuation refresh is verified under [`SK-EVID-074`](../Evidence/SK-EVID-074-cp13-dynamic-continuation-refresh-runtime-verification.md); dynamic recall grant delivery, production identity, external delivery, and hosted behavior remain open.

## Human and Agent commands

The application should expose the same authorized domain operations to the human UI and the WebMCP
adapter. Candidate page tools are:

- `inspect_shelter_state`;
- `inspect_client_snapshot`;
- `inspect_nearby_resources`;
- `inspect_missions`;
- `inspect_mission_history`;
- `inspect_incoming_threats`;
- `assign_soldier_mission`;
- `force_recall_soldier`;
- `set_defense_posture`;
- `start_shelter_migration`;
- `prepare_siege_party`; and
- `review_reentry_event`.

High-consequence commands such as migration, siege, and accepting a destructive upgrade should
return an explicit reviewable preparation or human boundary according to the final game policy.

## Tool invariants

Every tool must validate JSON Schema, current shelter ownership, entity version, role lock, migration
state, target visibility, and command idempotency. A tool result should include the current version,
what changed, and any typed failure. The Agent must reread current state after re-entry; a cached
conversation state is not authoritative.

All HTTP, WebSocket control, and WebMCP mutations also pass through the process admission gate and an entrypoint-owned
command gateway (or, after a deliberate split, an explicit worker message interface). The local
`WorkerCommandGateway` ordering seam and the transport-neutral `RealtimeSnapshotHub` full replacement
seam are verified under CP-08; the `RealtimeWireAdapter` now attaches the full snapshot/resync surface
when a server-owned session resolver is supplied. The default entrypoint remains visibly unsupported
when that identity boundary is absent. Next.js route
modules must not import a mutable worker singleton because the page bundle and entrypoint may be
separately bundled. While the CP-04 runtime is `starting`, `degraded`, or `draining`, the page may
remain readable but state-changing commands return the typed `RECOVERY_REQUIRED` result; no command is
queued in memory for a later implicit replay. This keeps process health visible without moving world
authority into the page or Agent.

The local wire lifecycle and protocol evidence is recorded in
[`../Evidence/SK-EVID-015-cp08-realtime-wire-runtime-verification.md`](../Evidence/SK-EVID-015-cp08-realtime-wire-runtime-verification.md); it does not establish production identity, browser UX, WebMCP, or Re-entry behavior.

## CP-12 local fixture read boundary

When `LOCAL_FIXTURE_MODE=1` and `NODE_ENV` is `development` or `test`, the CP-04 entrypoint owns
`GET /api/local-fixture/bootstrap` before delegating other requests to Next.js. It returns a typed
non-success response while the runtime is starting, degraded, draining, stopped, or failed, and it
returns `LOCAL_FIXTURE_UNAVAILABLE` when the flag is disabled or production is selected. A ready
response is `Cache-Control: no-store`, varies on `Cookie`, and contains only `capability`, contract
version, and the server-derived world/player/shelter scope. The endpoint issues the fixed opaque local
handle only when the cookie is absent; malformed, duplicate, unknown, or client-selected query/body
values never choose a player or silently fall back.

The entrypoint prepares the accepted `sleepless-mvp-01` fixture only in a provably empty database or
loads and validates that exact world on restart. It passes the same `PersistenceStore` to the one
worker and uses one resolver for bootstrap and `/realtime`; a second store, worker, custom realtime
resolver, extra world, or mismatched fixture is rejected. The browser constructs the pre-bound
projection from this response, validates the first full `client_snapshot` against that scope, then
records the server-issued connection id for subsequent sequence/resync correlation. This local
adapter is not authentication and does not establish WebMCP, Re-entry, scheduler, production, or
hosted behavior.

The canonical page now hydrates and renders the server-owned projection for one local browser context;
the readback is recorded in
[`../Evidence/SK-EVID-029-cp12-browser-hydration-runtime-verification.md`](../Evidence/SK-EVID-029-cp12-browser-hydration-runtime-verification.md)
and its audit. The visible `Realtime capability` badge describes the transport path only; it is not a
WebMCP discovery or invocation result. Independent two-session isolation remains open.

The first CP-13 capability probe is recorded in
[`../Evidence/SK-EVID-030-cp13-webmcp-capability-probe.md`](../Evidence/SK-EVID-030-cp13-webmcp-capability-probe.md):
the canonical page exposed no `document.modelContext` object in the named browser context, and the
selected adapter returned `gpt-5.6-luna does not support command "webmcp_list_tools"`. That negative
result was later explained by model eligibility rather than by an absent capability.

The positive capability result is recorded in
[`../Evidence/SK-EVID-045-cp13-site-tools-capability-experiment.md`](../Evidence/SK-EVID-045-cp13-site-tools-capability-experiment.md):
on GPT-5.6 Sol with site tools enabled, the adapter's own discovery path listed the tool registered by
the local disposable CP-02 page with its exact schema and read-only annotation, and one read-only
invocation returned the page-owned state. `SK-ISSUE-001` is resolved. This proves the transport is
reachable; the experiment predates the CP-13 page implementation and is not canonical game-page
evidence. The current local implementation is tracked in
[`SK-TASK-061`](../Tasks/SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md), with
local evidence in [`SK-EVID-047`](../Evidence/SK-EVID-047-cp13-page-tools-local-runtime-verification.md)
and audit in [`Validation/75`](../Validation/75-cp13-page-tools-runtime-cross-functional-audit.md). No
polyfill, external Re-entry delivery, or canonical-agent claim follows from either experiment.

## CP-13 local page implementation boundary

The page-bound implementation now exposes the accepted four reads through the entrypoint-owned
`POST /api/local-fixture/page-tools/execute` endpoint. The route derives scope from the existing
HttpOnly fixture session, applies bounded snake-case contracts, and serializes reads and recall through
the existing `WorkerCommandGateway` FIFO. `force_recall_soldier` is registered only after a shelter
read returns a server-owned continuation grant; the server validates signal provenance and delegates to
the verified recall transition. One page generation keeps one registered recall action and refreshes its
active signal identity only when a later shelter read carries newer continuation metadata; an older
late read cannot rebind the action. The page applies no optimistic mutation and requests the existing
full snapshot after a committed recall.

The local contract/process result is [`SK-EVID-047`](../Evidence/SK-EVID-047-cp13-page-tools-local-runtime-verification.md)
and its cross-functional audit is [`Validation/75`](../Validation/75-cp13-page-tools-runtime-cross-functional-audit.md).
The one-generation signal-refresh correction is recorded in [`SK-EVID-074`](../Evidence/SK-EVID-074-cp13-dynamic-continuation-refresh-runtime-verification.md)
and [`Validation/100`](../Validation/100-cp13-dynamic-continuation-refresh-cross-functional-audit.md).
The canonical four-read registration/readback and one supported read-only invocation are already
recorded at the named ladder level; genuine dynamic recall, Agent/Re-entry delivery, and hosted
behavior remain separate gates.

## CP-12 local fixture movement boundary

When the same explicit non-production fixture gate is active, the entrypoint owns bounded
`POST /api/local-fixture/commands/move-player`. The exact JSON is limited to 2 KiB and contains only
`command_id`, `command_type = move_player`, `contract_version`, current player revision,
`idempotency_key`, and a direction. A recognized HttpOnly fixture cookie supplies the server-side
world/player/binding scope; strict existing-session resolution occurs before media/body parsing, and
JSON or query identity cannot select Player B.

The route admits at most one movement command per server-resolved player, calls only
`WorkerCommandGateway.movePlayer()`, and returns a bounded typed acknowledgement or definitive
domain rejection. An acknowledgement carries revision/effect/event metadata but no position or
snapshot. The browser requests the existing full WebSocket resync and only
`RealtimeProjectionClient.accept()` may replace Canvas or semantic state. Rejected stale revision is
validated before collision, blocked/stale outcomes are durable under retry, and command causation
remains distinct from idempotency identity. Production and fixture-disabled modes stay visibly
unsupported. The named local proof is [`SK-EVID-033`](../Evidence/SK-EVID-033-cp12-keyboard-movement-runtime-verification.md)
and its cross-functional audit is [`Validation/53`](../Validation/53-cp12-keyboard-movement-runtime-cross-functional-audit.md).

The implemented local-fixture `assign-soldier-mission` route admits only an existing strict session
and one exact bounded tier-1 GATHERER Wood/Rock intent. `command_id` is event causation;
`idempotency_key` is retry identity. Movement and dispatch share page/server mutation admission and
the process FIFO. HTTP returns whitelisted identity and committed revision minima or a typed bounded
failure, never a route or renderable mission row. The browser requests the existing full WebSocket
resync, and only the accepted projection frame can change soldier or mission presentation. The named
local proof is [`SK-EVID-034`](../Evidence/SK-EVID-034-cp12-human-gatherer-dispatch-runtime-verification.md)
and its cross-functional audit is [`Validation/55`](../Validation/55-cp12-human-gatherer-dispatch-runtime-cross-functional-audit.md).

## CP-12 server-owned continuous movement intent

The canonical page sends one exact `movement_intent_command` WebSocket frame on a ready direction
start or replacement and one on release. The frame contains command and idempotency identity,
contract version, the expected player revision, and typed direction only; the authenticated realtime
context supplies world, player, shelter, and binding. `WorkerCommandGateway` serializes the command
with direct movement and mission dispatch, and the worker-owned cadence remains the only movement
driver. A result contains metadata and a typed failure, never a position or renderable snapshot.

The server stores the opaque connection owner on the process-local intent. A newer connection may
supersede an older owner, but an old stop or close cannot clear the newer intent. Close, drain, worker
fault/stop, stale replacement, blocked crossing, and competing move/dispatch are explicit safety
boundaries. The browser has no interval, control stream, lease, heartbeat, or hidden retry; it accepts
only the existing full `client_snapshot` projection. The adapter rechecks runtime admission for every
movement message, returning a typed `REALTIME_NOT_READY`, `REALTIME_DRAINING`, or `REALTIME_CLOSED`
result before delegation when the runtime is no longer accepting commands. The owner-accepted boundary is recorded in
[`ADR-GAME-0036`](../Decisions/ADR-GAME-0036-cp12-server-owned-continuous-intent.md), implementation
and focused proof in [`SK-TASK-057`](../Tasks/SK-TASK-057-cp12-server-owned-continuous-intent.md) and
[`SK-EVID-043`](../Evidence/SK-EVID-043-cp12-server-owned-continuous-intent-runtime-verification.md),
with the cross-functional audit in [`Validation/71`](../Validation/71-cp12-server-owned-continuous-intent-runtime-cross-functional-audit.md).

Health is an operational read, not a reservation: the worker may fault after a page reads `ready`, so
the command gateway rechecks admission and entity revisions at invocation time and returns the typed
result for the actual state.

The implemented `assignSoldierMission` gateway method is the first mission command. It accepts a
server-bound GATHERER assignment for an owned Wood or Rock node, derives the route and home anchor
from the persisted fixture, and returns a typed `ROLE_LOCKED`, `OWNERSHIP_DENIED`,
`TARGET_UNAVAILABLE`, or `TOOL_INCOMPATIBLE` failure when the command is not legal. The local
movement seam now also derives route transit and commits one `MissionWorking` arrival at its due
boundary. The CP-10 local extraction phase now commits one server-validated Wood/Rock cargo unit per
  paired due marker, extends the provenance stack, and hands off to `RETURNING` at capacity or node
  depletion. Same-worker contested-node losers also receive the server-owned `TARGET_DEPLETED`
  handoff without a second node mutation. Return movement and settlement are now separately verified;
  recall and WebMCP tools remain later boundaries; the bounded human-page GATHERER assignment is
  verified separately under `SK-EVID-034`. This phase is covered by
  [`../Evidence/SK-EVID-019-cp10-extraction-cadence-runtime-verification.md`](../Evidence/SK-EVID-019-cp10-extraction-cadence-runtime-verification.md)
  and [`../Evidence/SK-EVID-020-cp10-contested-node-runtime-verification.md`](../Evidence/SK-EVID-020-cp10-contested-node-runtime-verification.md);
  it does not imply a default hosted scheduler composition.

The route-arrival implementation and its local claim limit are recorded in
[`../Evidence/SK-EVID-017-cp09-route-milestone-runtime-verification.md`](../Evidence/SK-EVID-017-cp09-route-milestone-runtime-verification.md).

The default persistence-backed worker now owns one explicit `GameplayPhaseCoordinator`. Its clock
visits movement (outbound then home crossing), deposit, contact, extraction, combat, and explicit
settlement/timer no-ops in that order. The schema-v8 boundary marker and nullable server-time anchor
keep completed `world_time` behind
an interrupted boundary and startup replays the whole marker before readiness; a previously depleted
GATHERER target becomes a durable zero-cargo `TARGET_DEPLETED` return. `advance()` remains the only
gameplay driver seam: explicit callers and the opt-in autonomous scheduler both enter it, while no
HTTP, WebSocket, WebMCP, Signal, or Re-entry path becomes a second authority. The coordinator evidence
is [`SK-EVID-035`](../Evidence/SK-EVID-035-cp06-gameplay-phase-coordinator-runtime-verification.md)
and its cross-functional audit is [`Validation/57`](../Validation/57-cp06-gameplay-phase-coordinator-runtime-cross-functional-audit.md);
the autonomous runtime evidence is [`SK-EVID-036`](../Evidence/SK-EVID-036-cp06-autonomous-scheduler-runtime-verification.md)
with audit [`Validation/59`](../Validation/59-cp06-autonomous-scheduler-runtime-cross-functional-audit.md).

## Re-entry events

Candidate event types include `ActorObserved`, `MissionAutoReturned`, `MissionRecalled`, `EncounterLocked`,
`BattleRoundResolved`, `EncounterResolved`, `SoldierDied`, `SoldierRespawned`, `CargoLooted`, `CargoLostToMonster`,
`ShelterUnderAttack`, `ShelterBreached`, `SiegeRewarded`, `SoldierCorrupted`, `MigrationStarted`,
`MigrationCompleted`, and `ResourceBelowThreshold`.

`EncounterLocked` marks the authoritative contact lock, `BattleRoundResolved` is emitted once per
combat round, and `EncounterResolved` is emitted once for the terminal result. `SoldierEncountered`
and `BattleResolved` are retired from authoritative G2 handlers; `CargoLooted` is reserved for the
post-G2 PvP settlement path.

An event carries an opaque player/shelter binding, globally unique event id, monotonic
`world_event_cursor` scoped to its world, world time, entity versions, causal type, mission or shelter
references, and a bounded continuation hint. It does not carry raw Agent context, credentials, or an
instruction prompt.

## Agent Signal delivery policy

Domain Events are authoritative and remain in the durable event log. They are not relayed one by one to
the Cloud Receiver or Codex Thread. A derived Agent Signal is the delivery envelope for eligible
events. It may contain a signal id, causal `world_event_cursor` range, eligible event count, event
types, highest severity, latest event, latest world time, relevant entity revisions, and a bounded
continuation hint. The cursor range is the page-read window and may include routine events that are
not counted as eligible signal events. Critical-event delivery is enabled only when the current
product contract marks that event type as eligible.

Routine movement, world ticks, ordinary combat rounds, and repeated projection changes do not wake the
Agent. Actionable events are coalesced by opaque continuation binding and shelter. At most one signal
is pending or in flight for that bound Thread; later events merge into its context and retries reuse the
same signal identity. The Local Connector never sends one Codex Thread message per event. If the
Thread is active, the merged context waits for the next safe turn boundary. An enabled critical event
can raise severity without interrupting the active turn or creating duplicate wake-ups.

The world does not wait for signal delivery or Agent action. After re-entry, the Agent reads the latest
page state and event history through WebMCP, then the server validates the command against live entity
revisions. A late action returns a typed result rather than a silent no-op.

## WebMCP boundary

WebMCP is the page capability surface, not the scheduler or backend authority. The game must remain a
normal human-facing web application when WebMCP is unavailable. The Re-entry Core handles future
continuation delivery and canonical return; the game page exposes only current, permission-checked
operations.
