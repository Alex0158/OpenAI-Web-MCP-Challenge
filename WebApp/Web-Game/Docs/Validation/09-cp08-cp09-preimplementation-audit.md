# CP-08 and CP-09 Pre-Implementation Cross-Functional Audit

**Role:** Cross-functional preparation review for movement, visibility, realtime projection, missions, and role lock  
**Status:** PRE-IMPLEMENTATION REVIEW COMPLETE; runtime implementation remains unverified  
**Date:** 2026-09-02  
**Scope:** CP-08 and CP-09, with interfaces to CP-05, CP-06, CP-07, CP-10, CP-11, CP-12, CP-13, and CP-14  
**Contract:** [MVP contract sheet](../Engineering/09-mvp-contract-sheet.md)  
**Predecessor preparation:** [CP-06/07 preparation audit](08-cp06-cp07-preimplementation-audit.md)  
**CP-08 task:** [CP-08 preparation task](../Tasks/SK-TASK-008-cp08-movement-visibility-realtime-preimplementation-pack.md)  
**CP-09 task:** [CP-09 preparation task](../Tasks/SK-TASK-009-cp09-mission-role-return-preimplementation-pack.md)

This is a historical preparation snapshot. Subsequent CP-09 implementation records refine the
movement handoff: CP-08 still owns cadence, positions, and the movement-phase seam, while CP-09 owns
the mission route-arrival transition through that seam. See [`ADR-GAME-0019`](../Decisions/ADR-GAME-0019-cp09-route-milestone-and-derived-transit.md), [`SK-TASK-028`](../Tasks/SK-TASK-028-cp09-route-milestone-and-derived-transit.md), and [`Validation/24`](24-cp09-route-milestone-runtime-cross-functional-audit.md) for the current bounded result.

## 1. Purpose and verdict

This audit prepares CP-08 and CP-09 while CP-05 persistence work remains active in the primary
thread. It checks whether the accepted SK-MVP-0.2 state, clock, fixture, visibility, route, role,
mission, and snapshot rules can be implemented without creating a second authority or silently
changing the G2 boundary.

The preparation is safe and useful now. It produces implementation gates, cross-module invariants,
failure vectors, and concrete fixtures. It does not claim that CP-05 is complete, that a clock is
running, that a WebSocket is serving, that a player can move, or that a mission can be dispatched.

The dependency remains strict:

~~~text
CP-05 durable state and event history
  -> CP-06 authoritative clock and recovery
    -> CP-07 deterministic world, actors, and identities
      -> CP-08 movement, visibility, and client projections
        -> CP-09 mission, role, return, and recall state
~~~

The recommended implementation posture is deliberately small:

1. CP-08 owns server-authoritative movement, route execution, visibility filtering, and the realtime
   projection lifecycle. It uses the CP-04 entrypoint-owned upgrade seam and never starts a second
   server or worker.
2. CP-09 owns mission and role transitions. It consumes CP-08 route and home-anchor services; it does
   not implement a parallel movement loop or infer arrival from the browser.
3. The existing typed command envelope, revision checks, idempotency, and client_snapshot vocabulary
   remain the shared boundary. A transport optimization cannot become a second command authority.
4. Full authoritative resync is the required recovery path. Delta snapshots and higher-frequency input
   streams are optional implementation choices and remain subordinate to full resync.
5. Values that require runtime measurement or a later owner decision are recorded as open gates below;
   this document does not promote them into SK-MVP-0.2.

## 2. Evidence and authority map

| Question | Current authority | Preparation use | Not proven here |
|---|---|---|---|
| Coordinate system, speeds, radius boundaries, and protected start | [MVP geometry](../Engineering/09-mvp-contract-sheet.md#2-world-geometry-and-fixture-map), [ADR-GAME-0010](../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md) | Build movement and visibility vectors | A live movement tick or collision result |
| World time and due-work order | [MVP clock](../Engineering/09-mvp-contract-sheet.md#3-world-clock-and-due-work-order), [world clock mechanism](../Mechanics/detail-01-world-clock-and-continuity.md) | Keep interpolation and milestones separate | CP-06 runtime recovery |
| Durable active work, revisions, and replay | [MVP event envelope](../Engineering/09-mvp-contract-sheet.md#7-event-revision-and-persistence-envelope), [CP-06/07 audit](08-cp06-cp07-preimplementation-audit.md) | Define CP-05 handoff fields | CP-05 schema or transaction proof |
| Realtime owner and process boundary | [ADR-GAME-0011](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md), [system architecture](../Engineering/02-system-architecture.md) | Reserve one /realtime owner | WebSocket capability or latency |
| Snapshot and visibility shape | [API snapshot contract](../Engineering/05-api-and-webmcp.md#9-snapshot-and-visibility-contract), [MVP snapshot contract](../Engineering/09-mvp-contract-sheet.md#9-snapshot-and-visibility-contract) | Define scope, sequence, and resync fixtures | A browser projection stream |
| Route and movement rules | [navigation mechanism](../Mechanics/detail-09-navigation-and-pathfinding.md), [detection family](../Mechanics/05-detection-pathfinding-and-encounters.md) | Define waypoint, invalidation, and no-path cases | A* performance or production terrain policy |
| Player fog and intelligence | [fog mechanism](../Mechanics/detail-10-player-exploration-fog-and-intelligence.md), [exploration capability](../Design/Capabilities/01-player-exploration-and-discovery.md) | Define player-scoped explored cells and observation boundaries | Final freshness and sharing policy |
| Mission and role semantics | [role lock](../Mechanics/detail-07-role-and-loadout-lock.md), [mission lifecycle](../Mechanics/detail-08-mission-dispatch-return-and-recall.md) | Define command and lifecycle vectors | Runtime command or combat race |
| Mission ordering and settlement | [dispatch chain](../Mechanics/Chains/02-dispatch-to-deposit.md), contract sections 3–6 | Keep CP-09 separate from extraction and combat | CP-10/CP-11 runtime effects |

The owner has stated that CP-05 is still being handled in the primary thread. The repository status
and current-status page may therefore lag that conversational update; this preparation intentionally
does not rewrite CP-05 status or touch its implementation files.

## 3. Cross-functional handoff contract

| Boundary | Required handoff | Owning checkpoint | Stop condition |
|---|---|---|---|
| CP-05 -> CP-08 | Compatible world_snapshot, event cursor, world_time, generation identity, active work, positions, entity revisions, and worker-owned command seam | CP-05 supplies durable state; CP-08 consumes it | Missing active work, cursor gap, incompatible version, or page-owned state |
| CP-06 -> CP-08 | Recovered monotonic world time and 100 ms movement/visibility reconciliation authority | CP-06 supplies time; CP-08 schedules movement work | Browser or wall time advances gameplay, or recovery creates duplicate milestones |
| CP-07 -> CP-08 | Stable walkability, coordinate units, actor/node identities, ownership scope, explored-cell seed state, and protected-start metadata | CP-07 supplies fixture state; CP-08 filters and transports it | Regeneration on restart, hidden terrain leakage, or coordinate reinterpretation |
| CP-08 -> CP-09 | Authoritative route service, current position/home anchor, route status, walkability version, entity revisions, and movement-phase seam | CP-08 owns cadence and positions; CP-09 owns the mission route-arrival transition through that seam | Mission infers arrival from client interpolation or creates a second route loop |
| CP-09 -> CP-10 | Role-locked target, tool tier, mission attempt, return policy, cargo ownership boundary, and WORKING eligibility | CP-09 owns assignment; CP-10 owns extraction/deposit | Extraction credits coins, changes role, or mutates a stale attempt |
| CP-08/09 -> CP-11 | Encounter-ready positions, sensor observations, role/tool context, and one active mission/encounter link | CP-11 owns contact/combat/death | Movement resolves combat, or combat creates a second mission |
| CP-08/09 -> CP-12 | Player-scoped snapshot, stable visual state labels, mission rows, route/cargo/status data, and reconnect state | CP-12 owns presentation | Canvas invents authority or hides a typed failure |
| CP-08/09 -> CP-13/14 | Readable current revisions, mission history, legal tool/recall boundaries, and causal event cursor | CP-13/14 own page capability and external delivery | Agent signal becomes authority, bypasses role lock, or uses stale mission context |

These are interface promises for preparation. They do not add a table, event type, command, role,
or public error code to the accepted contract.

## 4. CP-08 movement, visibility, and realtime audit

### 4.1 Accepted invariants

| Invariant | Required behavior | Cross-module consequence |
|---|---|---|
| Server authority | The worker owns position, walkability, collision, route progress, visibility eligibility, and arrival | Browser prediction and interpolation are replaceable projections |
| Logical coordinates | G2 positions use integer logical tiles with fractional positions between 100 ms reconciliations | Canvas scale, camera, and hit testing cannot redefine distance |
| Cadence split | Movement and visibility reconcile at 100 ms; combat, extraction, death, respawn, and node timers settle at integer world seconds | A render frame cannot create an authoritative milestone |
| Route as plan | A route contains source, target, walkability version, waypoints, ETA, and status; arrival is committed by a due milestone | CP-09 must use route status and home anchor, never local distance |
| Deterministic replan | Target/home-anchor movement, terrain change, migration state, or invalid waypoint triggers bounded replan; the accepted monster danger-cell replan remains one attempt | No infinite path retry and no hidden time reset |
| Player fog | Explored cells belong to the player; the reveal radius is inclusive and does not grant global actor visibility | CP-07 may persist initial state, but CP-08 decides projection scope |
| Sensor separation | Shelter resource sensing, soldier actor sensing, and player exploration remain distinct ranges and observations | A player cannot infer a soldier's private sensor result from fog alone |
| Snapshot replacement | Connect and resync produce a full authoritative client_snapshot; a projection is never a persistence record | Reconnect cannot replay browser timers or merge stale hidden state |
| One process owner | /realtime upgrade handling belongs to the CP-04 entrypoint and its worker gateway | No route module starts a worker or a second listener |

### 4.2 Recommended transport posture

The product contract defines the typed move_player command and typed HTTP envelope; CP-04 reserves
the /realtime upgrade seam for CP-08. To avoid a second authority, CP-08 should implement the
smallest path first:

1. keep move_player as one canonical command with session binding, expected revision, and
   idempotency semantics;
2. use /realtime for server-to-browser client_snapshot delivery and connection/resync status;
3. if movement input later travels over the upgrade, carry the same command envelope through the same
   entrypoint-owned gateway rather than inventing a WebSocket-only command model; and
4. do not add an implicit HTTP fallback that hides an unsupported realtime capability. A degraded
   projection state must be visible and the ordinary human command surface must remain truthful.

Whether steady-state movement commands use HTTP or the upgrade channel is an implementation gate,
not a new gameplay rule. The decision must be based on measured input latency and event-loop service
time for the two-player slice.

### 4.3 Snapshot lifecycle target

The implementation should use these observable states without making them new world states:

~~~text
CONNECTING -> SYNCING -> LIVE
                         ↘ STALE -> RECONNECTING -> SYNCING
~~~

STALE and RECONNECTING are already the accepted page-facing reconnect semantics. While stale or
reconnecting, local animation may continue only as a clearly replaceable projection; state-changing
commands are rejected and controls remain disabled until a full current snapshot is accepted. The page
never queues a command for implicit later replay.

For steady state, a snapshot may be full or reference base_client_snapshot_id for a delta. The
minimum safe algorithm is:

1. accept a frame only when its contract version and base are compatible;
2. on a missing, stale, or out-of-order base, mark the projection stale and request a full snapshot;
3. replace local projection state atomically with the full snapshot before accepting new commands; and
4. never use a delta to reconstruct durable world state or hidden cells.

Full snapshots on connect/resync are mandatory. Delta size, cadence, compression, and history length
remain measurable implementation choices.

### 4.4 Visibility and privacy boundary

The CP-08 projection must include only data the current player is entitled to observe:

- the player's avatar, shelter, owned soldiers, owned mission rows, owned explored cells, and legal
  shelter-sensing results;
- other actors or nodes only when the current server visibility rule permits them;
- time-stamped observations and last-known positions as intelligence records, never as silently live
  positions; and
- world time, revisions, and recent causal events filtered by player scope.

It must not include the full map, hidden terrain metadata, another shelter's exact current state,
private mission cargo, private sensor results, or Agent context. The exact payload and refresh cadence
for soldier sensors, resource quantities, and observations remain open gates because the owning
mechanics still label them open.

### 4.5 CP-08 failure matrix

| Failure | Expected outcome | Why it matters |
|---|---|---|
| Duplicate movement command | Return the original idempotent result; no double movement or event | Protects repeated input and reconnect retries |
| Stale player revision | Typed STALE_REVISION result with current revision; no mutation | Prevents late input from overwriting newer movement |
| Invalid or blocked cell | Server clamps/rejects according to route contract with a typed result; never crosses the obstacle | Keeps collision authoritative |
| Missing snapshot base | Mark projection stale and require a full snapshot | Prevents applying a patch to the wrong world state |
| Dropped connection | World continues; page enters STALE then RECONNECTING; resync is full | Browser presence never pauses time |
| Hidden actor request | Omit or return a typed visibility result; never reveal by UI error detail | Prevents information leakage through read paths |
| Route invalidation | Replan within the bounded policy or enter WAITING_REVIEW with a typed reason | Avoids infinite retry and mission teleport |
| Unsupported WebSocket | Expose the capability as unavailable/degraded; do not claim realtime or silently change authority | Preserves truthful UX and the capability gate |

## 5. CP-09 mission, role, return, and recall audit

### 5.1 Accepted invariants

| Invariant | Required behavior | Cross-module consequence |
|---|---|---|
| One active assignment | A soldier has at most one player-assigned active mission and one attached resolving encounter | CP-10 and CP-11 must reference the same attempt |
| Lock at dispatch | Role, loadout, target, route, return policy, death policy, and expected revisions commit at dispatch | Editing a UI row cannot change a field soldier |
| Separate state machines | soldier.lifecycle, mission.phase, and encounter.status remain separate | Combat interruption does not invent an ENGAGING mission phase |
| Normal travel | Dispatch moves a resident soldier to FIELD and TRAVELLING; the route arms the first due milestone | CP-08 supplies the movement phase and clock; CP-09 commits the mission arrival transition |
| Return is travel | WHEN_FULL, ON_TARGET_DEPLETED, and ON_RECALL enter normal return toward the current home anchor | Recall never teleports, clears cargo, or creates coins |
| Deposit boundary | A home crossing enters DEPOSITING; the accepted due-work order settles valid deposit before field danger | CP-10 owns cargo and coin settlement |
| Death boundary | Ordinary death terminates the attempt, clears exposed cargo, respawns the same identity, and applies the bounded reissue policy | CP-11 owns combat/death; CP-09 must not duplicate a soldier |
| Role availability | G2 active commands are GATHERER and HUNTER; guard and siege remain concept roles outside the first slice | The UI must not promise unavailable commands |
| Explicit failure | Invalid target, stale revision, role lock, combat lock, no path, or recovery state returns a typed outcome and next valid action | No silent no-op or implicit task switch |

### 5.2 Dispatch contract target

The CP-09 command must validate, in order, the session and shelter owner, process/world readiness,
resident status, shelter state, role and tool tier, target visibility/legal knowledge, current entity
revisions, and idempotency. A successful transaction creates a new mission_attempt_id, stores the
route and current home-anchor reference, sets soldier.lifecycle = FIELD, sets mission.phase =
TRAVELLING, and arms the first route-arrival due marker. State, event, and eligible delivery rows remain
one transaction under the existing persistence contract.

The command must not accept a client-supplied position, cargo, coin balance, route arrival, hidden
target, or alternate soldier identity. A repeated key returns the original result; a new key with a
stale revision is rejected.

### 5.3 Recall and combat boundary

The accepted rule is that recall queues ordinary travel and never bypasses combat. One implementation
choice remains open: a recall requested while an encounter is CONTACT, LOCKED, or RESOLVING can
either be rejected with the existing typed IN_COMBAT outcome (recommended minimal behavior), or be
recorded as a deferred intent that becomes effective only after the encounter settles. The latter
requires a new explicit contract field and more race tests; it must not be introduced silently.

In either choice:

- the soldier cannot change role or tool in the field;
- cargo remains exposed until deposit;
- combat resolution keeps its own deterministic due-work position;
- a late recall cannot affect a new mission_attempt_id; and
- a dead, corrupted, terminal, or already-resident soldier returns a typed result.

### 5.4 Mission phase ownership

CP-09 owns assignment and phase transitions that do not settle another mechanism's state:

~~~text
AT_SHELTER -> TRAVELLING -> WORKING -> RETURNING -> DEPOSITING -> AT_SHELTER
                                  ↘ WAITING_REVIEW or TERMINAL
~~~

CP-08 supplies movement milestones and route status. CP-10 supplies extraction, capacity, target
depletion, deposit, and coins. CP-11 supplies encounter, combat, death, cargo loss, respawn, and
repeatable reissue. This split prevents CP-09 from crediting coins, resolving combat, or making a
dead soldier available twice.

### 5.5 CP-09 failure matrix

| Failure | Expected outcome | Why it matters |
|---|---|---|
| Non-owner or wrong world | Typed NOT_OWNER/world-scope failure; no mission row | Prevents cross-player and cross-reset mutation |
| Soldier already field-active | Typed role/mission lock result; existing attempt unchanged | Preserves one active assignment |
| Invalid role/tool/target | Typed validation result before any cargo or route effect | Avoids partial dispatch |
| Stale dispatch revision | STALE_REVISION with current mission/soldier revision | Prevents a stale page from changing a later attempt |
| Recall retry | Original idempotent result or current typed state; no duplicate return event | Protects Agent and browser retries |
| Recall while resolving | Recommended IN_COMBAT rejection; no bypass; deferred intent only after explicit decision | Makes combat boundary auditable |
| No route or invalid waypoint | One bounded replan, then WAITING_REVIEW with typed reason | Avoids infinite retry and teleport |
| Death during return | CP-11 terminal/death path wins according to event order; no deposit before home crossing | Preserves cargo and same identity semantics |
| Reconnect during mission | Full snapshot shows same soldier and attempt IDs, phase, route, cargo, and next action | Dashboard cannot invent or reset work |
| World reset during stale command | New world_id rejects old binding/key; old history remains isolated | Protects fixture reset and replay |

## 6. Options and selected preparation posture

| Option | Player value | Risk | Cost | Reversibility | Decision |
|---|---|---|---|---|---|
| Minimal G2 | One authoritative movement loop, snapshot projection, full resync, two active roles, existing phases, no live target search | Low; leaves measurable transport questions | Low | High | Selected |
| Conservative | Minimal G2 plus explicit delta snapshot protocol, input sequence numbers, and typed route invalidation receipts | Lower ambiguity under loss, more envelope/test surface | Medium | Medium | Preparation target if measurements require it |
| Expanded | Binary realtime protocol, predictive command stream, dynamic interest management, live stale-target search, deferred combat recall | Higher hidden-state and race surface before the vertical slice exists | High | Low | Rejected for CP-08/09 |

The selected posture keeps the authority and recovery path simple. It still permits a measured
transport improvement later, but no optimization is allowed to weaken revisions, idempotency,
visibility filtering, or full resync.

## 7. Open gates that must remain open

These questions are intentionally not promoted into SK-MVP-0.2 by this audit:

### CP-05/06/07 prerequisites

- the exact persistence representation for active work and next_due_world_time;
- the recovered scheduler/worker interface and its version readback;
- the final fixture walkability and seeded route proof; and
- the exact world-ready state after restart.

### CP-08 implementation gates

- movement command transport over HTTP versus the /realtime upgrade, after latency measurement;
- steady-state full versus delta snapshot cadence, size, and retention;
- exact realtime message envelope, acknowledgement, and out-of-order sequence handling;
- the stale movement input sequence rule if the upgrade carries commands;
- waypoint granularity, terrain modifiers, collision radius, and replan threshold;
- exact soldier-sensor and resource-sensing payload, sharing, and refresh cadence;
- whether an observed actor remains visible after leaving the sensor range;
- the visible behavior and command limits when WebSocket support is unavailable; and
- interpolation tolerance and event-loop/snapshot budget for the hosted target.

### CP-09 implementation gates

- exact dispatch and recall typed arguments beyond the shared envelope;
- target visibility versus legally committed intelligence for each G2 role;
- the G2 tool-tier table and any loadout capacity field;
- whether recall during CONTACT or LOCKED is rejected or deferred;
- target-depletion and partial-return transition details owned by CP-10;
- death/reissue handoff timing owned by CP-11;
- mission history retention and dashboard pagination; and
- when guard, siege, migration, breach, or live stale-target search may enter a later contract.

An implementation may choose a value only inside the task's authority, record the rationale and
verification, and reopen the gate when that choice changes the contract, cross-boundary authority,
or player consequence.

## 8. Entry gates and verification plan

### CP-08 entry gate

Start implementation only after CP-05, CP-06, and CP-07 provide the fields and runtime seams named
above, CP-02 capability evidence remains valid, and CP-04's single entrypoint owns the upgrade. The
first coherent increment should prove one player movement and one full scoped client_snapshot before
adding fog, remote actors, route invalidation, or delta frames.

Minimum targeted verification:

- movement speed, logical-coordinate bounds, collision, and stale-revision rejection;
- same seed and same event order produce the same route/projection result;
- two sessions receive scoped projections and cannot read hidden state;
- packet delay, dropped frames, out-of-order bases, and full resync;
- browser close/reconnect while world time advances;
- route invalidation and bounded no-path outcome; and
- unsupported WebSocket capability is visible without a false realtime claim.

### CP-09 entry gate

Start implementation only after CP-08 has a verified route/status and full-resync projection seam.
The first coherent increment should prove one valid gatherer dispatch and one role-lock rejection
before adding recall races or CP-10 settlement.

Minimum targeted verification:

- valid dispatch creates one new attempt and locks role/loadout;
- invalid owner, target, role, tool, revision, and duplicate commands have no partial effect;
- in-field role/tool changes are rejected;
- recall follows the current home anchor without teleport or coin creation;
- reconnect preserves soldier and mission identity;
- combat/death handoff cannot deposit before home crossing or create a duplicate soldier; and
- a blocked route reaches typed WAITING_REVIEW without unbounded retry.

Neither task may claim runtime, slice, hosted, or WebMCP proof from these documents alone.

## 9. Closure and non-goals

This audit and its linked scenario/task records close the CP-08/09 preparation scope at
specified. They do not close CP-05, CP-06, CP-07, CP-08, or CP-09 implementation.

The preparation explicitly does not implement or decide:

- SQL schema, worker persistence, clock recovery, or fixture generation;
- combat, extraction, cargo settlement, coin credit, migration, siege, breach, or leaderboard;
- a second process, second worker, browser-owned timer, or client authority;
- a binary protocol, ECS, production population system, or speculative scaling layer;
- final sensor freshness, stale-target search, terrain modifiers, or combat-time recall semantics; and
- live WebMCP, Cloud Receiver, Local Connector, or Re-entry Core integration.

Reopen this audit when a predecessor changes the snapshot, identity, event order, world-time, route,
visibility, role, mission, or human-boundary contract, or when CP-08/09 implementation evidence
invalidates one of the selected assumptions.
