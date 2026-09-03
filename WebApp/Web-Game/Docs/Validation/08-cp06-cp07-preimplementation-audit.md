# CP-06 and CP-07 Pre-Implementation Contract and Fixture Audit

**Role:** Cross-functional preparation review for world continuity and deterministic world setup  
**Status:** PRE-IMPLEMENTATION REVIEW COMPLETE; runtime implementation remains unverified  
**Date:** 2026-09-02  
**Scope:** CP-06 world clock and recovery, CP-07 deterministic map/actors/identity, and their interfaces with CP-05, CP-08, CP-09, CP-10, CP-11, CP-12, CP-14, CP-15, and CP-17  
**Contract:** [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md)  
**Clock decision:** [`../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md)  
**Persistence predecessor:** [`../Tasks/SK-TASK-005-cp05-persistence-event-log-and-outbox.md`](../Tasks/SK-TASK-005-cp05-persistence-event-log-and-outbox.md)  
**Clock preparation task:** [`../Tasks/SK-TASK-006-cp06-clock-recovery-preimplementation-pack.md`](../Tasks/SK-TASK-006-cp06-clock-recovery-preimplementation-pack.md)  
**World fixture preparation task:** [`../Tasks/SK-TASK-007-cp07-deterministic-world-fixture-pack.md`](../Tasks/SK-TASK-007-cp07-deterministic-world-fixture-pack.md)

## 1. Purpose and verdict

This audit prepares the next two implementation boundaries without starting either checkpoint. It
checks whether the accepted `SK-MVP-0.2` time, recovery, geometry, identity, visibility, mission,
and event rules can be turned into tests and fixtures without inventing a second authority or
depending on undocumented CP-05 internals.

The dependency is strict:

```text
CP-05 durable state and event history
  -> CP-06 authoritative clock and restart recovery
    -> CP-07 deterministic map, actors, and identity
      -> CP-08 movement, visibility, and client projections
```

The preparation package is coherent and useful now. It produces contract-level vectors, a fixture
layout, invariants, and implementation entry gates. It does not claim that CP-05 is complete, that a
clock is running, that a map is generated, or that any player can join a runtime world.

The recommended implementation posture is deliberately small:

1. CP-05 remains the only active persistence implementation owner. CP-06 and CP-07 must consume its
   worker-owned store seam rather than opening a second database or regenerating state on restart.
2. CP-06 should use a single monotonic integer world-clock authority, scheduled milestones, and a
   bounded recovery loop capped at `MAX_RECOVERY_WORLD_SECONDS = 300`. It may batch scheduler work,
   but it must not erase authoritative causal events.
3. CP-07 should use a deterministic fixture preset keyed by the accepted seed and a persisted
   generation version. A general procedural terrain system is unnecessary for the first slice.
4. Any value introduced only to make a fixture concrete is labelled a preparation target below. It
   is not a new accepted gameplay rule until the owning contract or ADR promotes it.

## 2. Authority and evidence map

| Question | Current authority | Preparation use | Not proven by this audit |
|---|---|---|---|
| World-time units, clock owner, and same-second ordering | [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md#3-world-clock-and-due-work-order), [`../Mechanics/detail-01-world-clock-and-continuity.md`](../Mechanics/detail-01-world-clock-and-continuity.md) | Define vectors and recovery assertions | A live tick, latency, or restart result |
| Durable snapshot, event cursor, and replay boundary | [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md#7-event-revision-and-persistence-envelope), [`../Engineering/03-persistence-world-clock-and-events.md`](../Engineering/03-persistence-world-clock-and-events.md) | Define CP-05 handoff fields and crash points | A schema, migration, or transaction pass |
| Seed, map dimensions, shelters, nodes, and protected start | [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md#2-world-geometry-and-fixture-map), [`../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md`](../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md) | Define a reproducible fixture manifest and invariants | A generated map or pathfinding result |
| Actor identities and lifecycle | [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md#1-version-identity-and-ownership), [`../Characters/02-soldiers-and-roles.md`](../Characters/02-soldiers-and-roles.md) | Define world-scoped fixture IDs and reset isolation | A join, mission, or respawn implementation |
| Projection and visibility | [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md#9-snapshot-and-visibility-contract), [`../Design/02-map-fog-and-exploration.md`](../Design/02-map-fog-and-exploration.md) | Check that CP-07 does not leak hidden state into CP-08 inputs | A `client_snapshot` stream or browser view |
| Process boundary and restart seam | [`../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md), [`../Validation/06-cp04-topology-and-cross-functional-audit.md`](06-cp04-topology-and-cross-functional-audit.md) | Define worker startup and recovery gates | Hosted continuity or process performance |

## 3. Cross-functional dependency contract

| Boundary | Required handoff | Owning checkpoint | Stop condition |
|---|---|---|---|
| CP-05 -> CP-06 | A worker-owned store can load a compatible `world_snapshot`, replay events after its cursor, retain the latest committed `world_time`, and expose active due-work state or a deterministic reconstruction of it | CP-05 provides storage; CP-06 owns advancement | No durable next-due state, incompatible snapshot, cursor gap, or ambiguous replay order |
| CP-06 -> CP-07 | A recovered world has one authoritative time, one generation seed/version, and a stable world identity before actors are exposed | CP-06 provides recovered world context; CP-07 creates fixture entities | Map generation before recovery, regeneration on restart, or time-dependent IDs |
| CP-07 -> CP-08 | Walkable coordinates, actor identities, node positions, and ownership scopes are stable and can be projected without hidden cells | CP-07 creates state; CP-08 filters and transports it | Client receives server-only terrain, another player's hidden state, or a different coordinate system |
| CP-07 -> CP-09 | Soldiers and shelters have stable roster IDs and home anchors; a mission target can reference a node or route without changing identity | CP-09 owns mission dispatch | A dispatch creates a new soldier, changes a role in place, or references a non-existent target |
| CP-07 -> CP-10 | Resource node IDs, types, positions, initial quantity, and respawn milestone fields are stable | CP-10 owns extraction and settlement | Resource quantity is derived from the client, seed regeneration, or an unscoped node ID |
| CP-07 -> CP-11 | The seeded monster has a stable identity, walkable patrol fixture, and parameters that allow the accepted gatherer/hunter contrast | CP-11 owns encounter and combat | Monster route contacts a protected start unavoidably, cannot reach the Rock route, or changes combat values silently |
| CP-06/07 -> CP-12 | Coordinates, world time, state labels, and projection identities match the visual and dashboard vocabulary | CP-12 owns rendering | Canvas invents positions, displays a different state machine, or encodes a hidden result in artwork |
| CP-05/06/07 -> CP-14 | Event cursor, `world_id`, shelter scope, and current revisions remain available for later page reread and Signal filtering | CP-14 owns external handoff | A Signal becomes authority, includes hidden events, or depends on a page timer |

The package deliberately keeps these as interface promises. It does not add a
`scheduled_milestone` table, a new health state, a new event name, or a new public command.

## 4. CP-06 clock and recovery audit

### 4.1 Accepted invariants

| Invariant | Required behavior | Cross-module consequence |
|---|---|---|
| One clock | `world_time` is server-owned and drives travel, extraction, combat, respawn, visibility, node timers, and later cooldowns | CP-05 must persist the value; CP-08 and the browser cannot advance it |
| Separate operational time | `wall_time` is for leases, logs, health, and deployment evidence; `client_time` is for interpolation only | Outbox lease expiry cannot pause or advance gameplay; a browser sleep cannot create progress |
| Two cadences | Movement/visibility reconcile at 100 ms; combat, extraction, death, respawn, and node timers settle at integer world-second boundaries | A sub-second tick may update a projection but cannot emit a second authoritative milestone for the same boundary |
| Fixed phase order | Move and home-crossing, deposit, contact lock, eligible extraction, combat, death/respawn/reissue, then timers/projections/snapshot/outbox | CP-09 through CP-11 must not reorder a same-time result inside their own module |
| No browser dependency | A closed page or disconnected WebSocket does not pause world time | CP-12 reconnects to state; it does not replay local timers |
| Replay safety | A committed transition is identifiable by event and entity revision; replay after a snapshot cursor applies only later events | CP-05 event and snapshot readers must reject gaps, ahead cursors, and incompatible versions visibly |
| Backward-time safety | A wall-clock anomaly never reverses committed `world_time`; it produces a typed recovery warning | Operations and health surface the condition without silently rewriting missions or cargo |
| Bounded recovery | Routine scheduler work may be processed in bounded batches; consequential transitions remain causally inspectable | Batch execution cannot remove `CargoExtracted`, `CargoDeposited`, combat, death, or settlement history when those transitions commit state |

### 4.2 Required clock states and transitions

The implementation should expose the following state transitions internally, even if the public health
surface uses the existing CP-04 labels:

```text
UNINITIALIZED
  -> RECOVERING (compatible snapshot and event history loaded)
  -> RUNNING (world_time authority established)
  -> DEGRADED (store, version, or recovery failure; no state-changing commands)
  -> DRAINING (listener admission closed; worker/store close is settling)
```

`RUNNING` is a world-authority condition, not a synonym for process `live`. CP-04 process health can
remain observable while CP-06 is `RECOVERING` or `DEGRADED`. A browser or Agent command must receive a
typed recovery result until the world is authoritative again.

### 4.3 CP-05 handoff fields that must exist before CP-06 code starts

The accepted contract does not require a particular SQL table for due work, but it does require that
restart can determine what is due. CP-05 must therefore provide one of these equivalent shapes:

1. each active mission, node, encounter, and monster state stores its next due world time and a stable
   milestone identity; or
2. `world_snapshot` contains a complete scheduler projection with stable work identities and the
   current entity revisions needed to validate a claim.

The representation is an implementation choice. The following are non-negotiable observable fields:

| Field | Purpose | Failure if missing |
|---|---|---|
| `world_id` | Scope every clock and work item | A reset or restart can apply one world's work to another |
| `world_time` | Recover the last committed gameplay boundary | The worker invents elapsed time or replays from process start |
| `last_world_event_cursor` | Establish the replay cut | Events can be skipped or applied twice |
| `generation_version` and `world_seed` | Keep CP-07 output stable across restart | A code update silently regenerates a different map |
| Active work identity and `next_due_world_time` | Reclaim or replay milestones deterministically | Travel, extraction, respawn, or timers disappear or duplicate |
| Entity revisions | Reject stale milestone claims | A late scheduler result overwrites a newer mission or actor |
| Delivery lease metadata | Separate transport expiry from gameplay time | Re-entry backpressure changes world progression |

If CP-05 cannot expose these fields through its worker-owned seam, CP-06 must stop and reopen the
persistence contract rather than reconstructing scheduler state from a client projection.

### 4.4 Recovery and same-time failure matrix

| Point of failure | Required next state | Must remain true |
|---|---|---|
| Before a due milestone is claimed | Work remains due | No event, revision, cursor, cargo, or reward is created |
| After claim, before transaction commit | Lease is reclaimable using transport/wall time metadata | A retry does not need a new gameplay identity and cannot leave a permanent claimed item |
| State/event transaction commits, snapshot write fails | Event log is authoritative; next startup replays after the last valid snapshot | No second cargo, coin, death, respawn, or continuation effect |
| Snapshot commits, projection delivery fails | World remains recovered; the next client connection receives a full projection | `client_snapshot` delivery does not roll back world state |
| Wall clock moves backwards | Typed recovery warning; do not decrement `world_time` | Existing event order and entity revisions remain intact |
| Wall clock jumps forward beyond `MAX_RECOVERY_WORLD_SECONDS = 300` | `RECOVERY_LIMIT_EXCEEDED`, durable state preserved, world mutation gate closed; explicit later chunks may resume at most 300 seconds each | No unbounded loop, silent time skip, false `ready` state, or fabricated settlement |
| Process receives shutdown during recovery | Enter draining, close admission, settle worker/store close | Listener-first close and CP-04 deadline remain observable |

### 4.5 Same-second boundary assertions

The fixture vectors in [`../Scenarios/06-cp06-clock-recovery-fixtures.md`](../Scenarios/06-cp06-clock-recovery-fixtures.md)
must assert the following ordering at one integer boundary:

1. A soldier crossing the current home anchor becomes eligible for `DEPOSITING`.
2. A valid deposit settles before the soldier can be treated as field cargo.
3. Post-movement contacts are detected and locked using current revisions.
4. A locked soldier cannot extract during that boundary.
5. Each locked encounter resolves one deterministic combat round.
6. Death, cargo loss/transfer, respawn, and bounded mission reissue settle after combat.
7. Resource/monster timers, projections, `world_snapshot`, `client_snapshot`, and Agent Signal
   policy run after the authoritative transition.

At `world_time == protected_start_until`, the protected-start rule is expired before contact
detection. Every distance comparison remains inclusive and uses Euclidean center-to-center logical
tiles.

## 5. CP-07 deterministic world audit

### 5.1 Fixture manifest target

The following values are already accepted for the G2 fixture. The route details marked as a
preparation target make the first trace concrete without changing the general world rules.

| Field | Preparation value | Status and reason |
|---|---|---|
| `fixture_id` | `sleepless-mvp-01` | DECIDED by the G2 contract |
| `world_seed` | `sleepless-mvp-01` | DECIDED by the G2 contract |
| `generation_version` | `g2-fixture-1` | PREPARATION TARGET; the literal must be persisted and version-checked before CP-07 closure |
| Logical dimensions | `128 × 128`, cells `0..127` | DECIDED by the G2 contract |
| Player A shelter | `shelter-a` at `(16,64)` | DECIDED; stable identity is scoped to `world_id` |
| Player B shelter | `shelter-b` at `(112,64)` | DECIDED; center separation is 96 tiles |
| Player A Wood | `node-wood-a` at `(30,64)` | DECIDED; 14 tiles from shelter and outside the 12-tile shield |
| Player A Rock | `node-rock-a` at `(34,64)` | DECIDED; 18 tiles from shelter and the higher-value trace target |
| Player B Wood | `node-wood-b` at `(98,64)` | DECIDED mirror of Player A |
| Player B Rock | `node-rock-b` at `(94,64)` | DECIDED mirror of Player A |
| Node quantity | 20 units each | DECIDED for G2 |
| Seeded monster | `monster-seeded-01`, initial position `(48,64)` | PREPARATION TARGET; must be walkable and outside both protected starts |
| Seeded patrol route | `(48,64) -> (48,72) -> (40,72) -> (40,64) -> (34,64) -> (40,64)` | PREPARATION TARGET for the Rock-route trace; the `(34,64)` threat waypoint intentionally visits Rock A and must be validated by CP-07/CP-11 path tests |
| Monster patrol speed | 2.0 tiles/world second | DECIDED by `ADR-GAME-0010` |
| Protected start | Radius 12; until `start_world_time + 120` | DECIDED; first dispatch does not shorten it |
| Map camera target | `32 × 20` logical tiles | DECIDED presentation target; CP-12 owns scaling |

With the preparation route, a soldier starting at `(16,64)` reaches the Rock node after about six
world seconds at the G2 soldier speed. The monster reaches the Rock lane after the first extraction
milestone, which makes the gatherer loss and hunter contrast possible. These timings are a fixture
calibration target, not a new balance promise; CP-11 must verify the exact contact and combat times.

### 5.2 Deterministic generation boundary

For `sleepless-mvp-01`, the smallest reliable G2 implementation is a fixture preset selected by
`world_seed` and `generation_version`. It may be represented as explicit coordinates and a compact
walkability mask rather than procedural noise. A later production generator can use the same output
contract without changing G2 identities.

The generator boundary must:

1. accept only a server-owned seed and generation version;
2. produce walkable cells, shelters, nodes, monster route metadata, and discovery metadata without
   reading browser state, current wall time, or an unseeded random source;
3. emit a deterministic `map_fingerprint` or equivalent readback so restart can detect generator
   drift;
4. persist `world_seed`, `generation_version`, and the fingerprint with the world identity;
5. create a fresh `world_id` on fixture reset without deleting or rewriting another world's event log;
6. reject a newer or incompatible generation version visibly instead of silently regenerating; and
7. keep full map state server-side until CP-08 applies player-scoped fog and visibility.

### 5.3 Identity and ownership invariants

All fixture IDs below are stable within a `world_id`; external session bindings remain opaque:

```text
player-a, player-b
shelter-a, shelter-b
soldier-a-01 .. soldier-a-05
soldier-b-01 .. soldier-b-05
node-wood-a, node-rock-a, node-wood-b, node-rock-b
monster-seeded-01
```

The following must hold on every reset and replay:

- each world has exactly two fixture players and one shelter per player;
- each shelter has exactly five stable starter soldiers, and ordinary respawn never creates a sixth;
- node and monster IDs are unique within the world and cannot be read or mutated through another
  shelter's binding;
- `world_id` scopes every authoritative row, event, signal, and idempotency record;
- the same seed and generation version produce the same geometry, placement, route metadata, and
  initial revisions;
- a reset changes `world_id` while preserving the append-only history of older worlds;
- no shelter overlaps another shelter, node, or blocked cell;
- every shelter, node, and monster waypoint is in bounds and walkable;
- the two shelters remain at least 80 logical tiles apart;
- each start-zone node is in the inclusive 14–20-tile band and outside the inclusive 12-tile
  protected radius; and
- the fixture is large enough that the 32 × 20 camera cannot show both shelters at once.

### 5.4 Visibility and later-module boundaries

CP-07 creates authoritative geometry and identity, but it must not decide what a player sees. CP-08
will apply `player_fog_reveal_radius_tiles = 4.0`, soldier sensor radius `6.0`, shelter resource
sensing radius `24.0`, and player scope to the `client_snapshot`. A full server-side map or another
player's hidden cells must never be copied into the client fixture merely to make CP-07 tests easier.

CP-09 and CP-10 consume the node and home-anchor IDs. CP-11 consumes the seeded monster route and
combat parameters. If pathfinding cannot reach the Rock route or avoid a danger cell after death,
that is a CP-08/CP-11 route defect, not permission to alter CP-07 identity or protected-start rules.

## 6. Open gates found by this review

These are implementation gates, not silent decisions. The time precision and extreme-gap value were
closed by [`ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md):

| Gate | Why it matters | Conservative preparation disposition |
|---|---|---|
| Exact CP-06 catch-up limit and extreme-downtime outcome | A bounded loop must be testable and must not silently skip an outage | **DECIDED:** use `MAX_RECOVERY_WORLD_SECONDS = 300`; a larger gap returns `RECOVERY_LIMIT_EXCEEDED`, preserves durable state/history, closes the world mutation gate, remains observable, and may resume only through explicit bounded chunks |
| Persisted scheduler representation | Restart cannot recover travel, extraction, encounter, or respawn from `world_time` alone | Require active work identity plus next due world time in current rows or `world_snapshot`; stop CP-06 if neither is available |
| `generation_version` literal and map fingerprint algorithm | A seed without a version can regenerate different geometry after a code change | Use `g2-fixture-1` as a preparation target and record the actual version/fingerprint in CP-07 evidence before treating it as current truth |
| Exact monster route reachability | The contract requires a Rock-route encounter after extraction but does not give waypoints | Use the bounded route in section 5.1 as a candidate fixture; CP-07 and CP-11 must validate walkability, contact timing, and a safe hunter contrast |
| Fractional `world_time` representation | 100 ms movement and integer milestones need a stable boundary type | **DECIDED:** persist and emit non-negative integer world seconds only; keep fractional positions/projection interpolation process-local |
| Recovery readiness surface | CP-04 process readiness is not proof that a world is recovered | Keep process health and world authority separate; expose a typed recovery result without inventing a second process owner |

No gate above changes a player-facing rule today. Each gate has a concrete falsifier: a missing
field, an incompatible replay, an unbounded catch-up loop, a different map fingerprint, or a route
that cannot satisfy the accepted causal trace.

## 7. Preparation fixture index

The detailed vectors are kept as scenarios so they can later become tests without becoming a second
specification:

- [`../Scenarios/06-cp06-clock-recovery-fixtures.md`](../Scenarios/06-cp06-clock-recovery-fixtures.md)
  covers healthy ticks, same-time order, restart, crash points, wall-clock anomalies, bounded
  catch-up, and browser absence.
- [`../Scenarios/07-cp07-deterministic-world-fixture.md`](../Scenarios/07-cp07-deterministic-world-fixture.md)
  covers the seed manifest, placement invariants, identity scope, reset isolation, map fingerprint,
  and the seeded Rock-route candidate.

The scenarios use only the accepted contract and preparation targets in this audit. They do not
define SQL columns, public HTTP routes, WebMCP tools, Canvas behavior, or external Agent delivery.

## 8. Implementation entry and verification gates

### CP-06 may enter implementation when

1. CP-05 has runtime evidence for a compatible file-backed store, snapshot load, event replay, and
   world-scoped revisions/cursors;
2. the active work/next-due representation is read back from the worker-owned seam;
3. the CP-04 shutdown-order remediation is verified;
4. the owner of the CP-05 implementation has recorded the chosen generation/time field types without
   changing the accepted event order;
5. the CP-06 vectors can be mapped to real scheduler inputs without a client or process-local clock;
6. focused tests cover integer-only persistence, the exact 300-second boundary, and the typed
   301-second `RECOVERY_LIMIT_EXCEEDED` outcome.

### CP-07 may enter implementation when

1. CP-06 has runtime evidence for bootstrap, one healthy tick, restart recovery, and bounded catch-up;
2. the seed/version/fingerprint fields are persisted and version-checked;
3. the fixture manifest and route candidate pass placement and walkability checks;
4. reset creates a new `world_id` and does not rewrite prior history; and
5. the generated identities and revisions are stable across two independent runs.

### Minimum verification after implementation

The first CP-06/07 runtime packet should include:

- fake-clock vectors at sub-second and integer boundaries;
- crash-before-commit and crash-after-commit/replay parity;
- wall-clock backward and bounded-forward cases;
- browser-absent progression and full recovery projection;
- same-seed geometry and identity hash comparison;
- shelter separation, node band, protected-start, walkability, and route reachability assertions;
- two-session world join with scoped identities; and
- transitive documentation, type/build, and focused runtime checks with no hosted claim.

## 9. Closure and non-goals

This record closes the planning preparation at `specified` scope. It does not close CP-05, CP-06,
or CP-07 and does not create implementation evidence.

The following remain outside this preparation package:

- general procedural world generation, population scaling, or production spawn tuning;
- hosted database or deployment selection;
- movement/pathfinding runtime, WebSocket transport, Canvas rendering, or UI animation;
- extraction, combat, settlement, migration, siege, breach, or leaderboard behavior;
- external Receiver/Connector delivery or genuine WebMCP discovery; and
- changing `SK-MVP-0.2`, event vocabulary, identity semantics, or Re-entry authority.

Reopen this audit if CP-05 chooses a persistence shape that cannot retain active due work, if the
clock unit or catch-up rule changes, if the seed fixture cannot satisfy the accepted encounter trace,
or if a later projection requires hidden world state or a second authority.
