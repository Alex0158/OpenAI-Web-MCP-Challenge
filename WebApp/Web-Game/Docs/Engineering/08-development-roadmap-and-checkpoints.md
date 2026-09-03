# Development Roadmap and Checkpoints

**Status:** TARGET DELIVERY ROADMAP; CP-04/CP-05 foundations, CP-06/CP-07 local boundaries, CP-08 movement/snapshot, cadence, command/read, projection, and local wire increments, the bounded CP-09 dispatch/route-arrival increments, the CP-10 extraction/cadence/return/contested-node/deposit increments, all three CP-11 local increments, and the CP-12 one-browser hydration, reconnect, discrete movement, ordinary-UI GATHERER dispatch, automatic publication, snapshot-gated held-input, server-owned continuous-intent, and Canvas primitive visual boundaries are runtime-verified or integrated at named local scopes; CP-16's local worker-to-port-to-page-HTTP-to-recall composition is now runtime-verified for its named scope; independent two-session behavior, genuine dynamic WebMCP/Agent action, hosted continuity, and full gameplay integration remain open  
**Date:** 2026-09-03  
**Scope:** Sleepless Kingdom game child only

## Objective

Turn the accepted MVP profile into a sequenced, reviewable build without accidentally treating the
full game concept as a single implementation task. The first release must prove the game's challenge
thesis: a meaningful world event continues while the player is away, and Re-entry Core brings an Agent
back to the same canonical page where it can read current state and perform one bounded action.

The roadmap has four release gates:

| Gate | Outcome | Required evidence |
|---|---|---|
| G0 | Source, concept, and MVP contracts are coherent | Current status, ADRs, mechanism/chain audit, and this roadmap agree |
| G1 | Runtime foundation is capable of supporting the slice | Node 24 worker, durable store, Canvas page, realtime channel, and WebMCP capability probe pass |
| G2 | Local two-player vertical slice works end to end | Browser disconnect, worker restart, deterministic event history, cargo loss, respawn, and Re-entry path pass |
| G3 | Hosted hackathon proof is reproducible | Always-on worker, durable hosted state, health/recovery evidence, and judge walkthrough pass |

PvP field encounters, siege, breach, migration, progression, and leaderboard are full-game expansion
gates after G2. They reuse the same authority, event, identity, and ledger contracts; they do not
belong in the first vertical slice.

## Delivery rules

Each checkpoint is closed only when its implementation, focused verification, evidence, and owning
document update are all present. A local green test supports only the boundary it actually exercised.
Every checkpoint should produce one coherent commit; do not commit every save or combine unrelated
RightSpot work with the game.

Use these status labels in implementation records:

- `PLANNED` — scope is defined but no work has started;
- `IN PROGRESS` — a bounded implementation is active;
- `BLOCKED` — a named external or authority decision prevents progress;
- `VERIFIED LOCAL` — the checkpoint evidence passes locally;
- `HOSTED VERIFIED` — the same evidence passes against the named hosted runtime.

## Dependency path

```mermaid
flowchart LR
  CP00[Concept baseline] --> CP01[MVP contract sheet]
  CP01 --> CP02[Capability and runtime probe]
  CP02 --> CP03[Implementation task lock]
  CP03 --> CP04[Process skeleton]
  CP04 --> CP05[Durable store and outbox]
  CP05 --> CP06[World clock and recovery]
  CP06 --> CP07[Seeded world and identities]
  CP07 --> CP08[Movement visibility and WebSocket]
  CP08 --> CP09[Mission and role lock]
  CP09 --> CP10[Wood Rock economy]
  CP10 --> CP11[Monster combat and respawn]
  CP11 --> CP12[Canvas and dashboard]
  CP12 --> CP13[Page WebMCP tools]
  CP13 --> CP14[Re-entry delivery]
  CP14 --> CP15[Contract and failure tests]
  CP15 --> CP16[Local vertical slice]
  CP16 --> CP17[Hosted deployment]
  CP17 --> CP18[Judge rehearsal]
  CP18 --> CP19[PvP field encounters]
  CP19 --> CP20[Shelter defense and siege]
  CP20 --> CP21[Migration and breach]
  CP21 --> CP22[Progression and recovery]
  CP22 --> CP23[Leaderboard and anti-farming]
  CP23 --> CP24[Content and population scale]
  CP24 --> CP25[Performance security and operations]
  CP25 --> CP26[Full playtest and product decision]
```

The critical path is CP-01 through CP-18. Visual preparation can start now; placeholder assets and
asset production may run alongside CP-04 through CP-11 after the implementation lock. CP-12 integrates
the visual lane, while final polish remains optional. Visual work cannot define or mutate authoritative
state, block the backbone, or expand the G2 boundary. Full-game expansion starts only after CP-16 is
verified locally.

## Phase 0 — contract and implementation readiness

### CP-00 — accepted concept baseline (`VERIFIED LOCAL`)

- **Scope:** Preserve the owner source, canonical blueprint, 19 mechanisms, 11 chains, 8 capability
  contracts, accepted MVP map/resource/rendering profile, and validation records.
- **Depends on:** Owner discussion and repository guidance.
- **Acceptance:** The two-player 128 × 128 profile, minimum 80-tile separation, Wood plus Rock,
  continuous world, cargo-loss clarification, and minimal Canvas direction appear in the owning docs.
- **Evidence:** 107 tracked child Markdown files, 11 raw source blocks, no broken links, no unfenced CJK, and
  repository validators pass.
- **Current result:** Committed locally as `0791304`; no implementation claim follows.

### CP-01 — MVP contract sheet (`VERIFIED LOCAL; OWNER-ACCEPTED G2 CONTRACT`)

- **Scope:** Freeze the first-slice IDs, states, event names, revisions, clock units, coordinate
  conventions, `world_snapshot`/`client_snapshot` shape, command envelope, cargo settlement cases, and the real-time coalesced
  Re-entry delivery policy in one implementation contract. The coherent G2 revision is `SK-MVP-0.2`.
- **Depends on:** CP-00, the gap audit in `Validation/03-roadmap-gap-audit.md`, and the owner-accepted
  defaults in `Validation/04-mvp-decision-proposals.md`.
- **Acceptance:** Every field has one owner, every state transition has an idempotency key or entity
  version, and the contract names deposit-versus-death, restart, reconnect, and duplicate-event order.
- **Verify:** Static cross-reference against `Mechanics/detail-*`, `Mechanics/Chains/`,
  `Engineering/05-api-and-webmcp.md`, and `Engineering/03-persistence-world-clock-and-events.md`.
- **Exit artifact:** [`09-mvp-contract-sheet.md`](09-mvp-contract-sheet.md) and
  [`../Decisions/ADR-GAME-0006-mvp-contract-and-reentry-boundary.md`](../Decisions/ADR-GAME-0006-mvp-contract-and-reentry-boundary.md),
  [`../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md),
  and [`../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md`](../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md).
  CP-03 registers the bounded implementation route after CP-02 and the G2 coherence closure; the
  child task and release lock are recorded separately below.

### CP-02 — capability and runtime probe (`VERIFIED LOCAL`)

- **Scope:** Prove the selected local runtimes and the real page capability before building the game:
  Node.js 24 worker, Next.js page, Canvas 2D, WebSocket upgrade, SQLite WAL, and page-bound
  `document.modelContext` registration.
- **Depends on:** CP-01.
- **Acceptance:** A test page can render a Canvas frame, exchange one typed command and one
  `client_snapshot`,
  persist one probe event, restart the probe worker, and report WebMCP supported or visibly
  unsupported. The probe harness is disposable; it must not be mistaken for the game's durable
  state implementation.
- **Verify:** Record runtime versions, capability result, connection failure behavior, and the exact
  browser/session used. A fallback cannot silently claim genuine WebMCP.
- **Current result:** [`SK-EVID-001`](../Evidence/SK-EVID-001-cp02-capability-and-runtime-probe.md)
  records a passing Node.js `v24.13.1` worker, Canvas frame, typed realtime command/`client_snapshot`,
  duplicate idempotency, SQLite WAL restart, and visible worker degradation. The page-side
  `document.modelContext.registerTool` call returned a registration readback in the Codex In-app
  Browser. The current Agent adapter could not execute `webmcp_list_tools`; this remains an explicit
  CP-13/CP-14 capability issue rather than a silent fallback.
- **Reopen trigger:** A selected host or browser cannot keep the worker alive or expose the required
  page capability.

### CP-03 — implementation task and release lock (`VERIFIED LOCAL; IMPLEMENTATION TASK LOCKED`)

- **Scope:** Convert CP-01 and CP-02 into one bounded implementation task with non-goals, owner,
  acceptance cases, checkpoint cadence, and a rollback point.
- **Depends on:** CP-02 passing or a documented capability decision, plus closure of the blocking
  findings in `Validation/05-pre-implementation-coherence-audit.md` by `ADR-GAME-0010` and
  `SK-EVID-003`.
- **Acceptance:** The task names only the G1/G2 critical path; full PvP, siege, migration, breach,
  leaderboard, and final visual polish are explicit non-goals. It carries the `SK-MVP-0.2` geometry,
  state, anti-loop, event, `world_snapshot`/`client_snapshot`, and Agent Signal coalescing/Thread backpressure policies without
  introducing a gameplay wait. The accepted visual spec and placeholders may proceed in parallel
  without changing the game contract.
- **Verify:** Human review of the task against this roadmap and `Docs/00-current-status.md`, followed
  by the validator and the CP-03 static task-lock evidence in `SK-EVID-005`; `SK-EVID-003` remains the
  prerequisite contract-closure evidence.
- **Current result:** [`../Tasks/SK-TASK-003-g1-g2-critical-path-implementation-lock.md`](../Tasks/SK-TASK-003-g1-g2-critical-path-implementation-lock.md)
  is verified as the parent G1/G2 implementation route, with static closure recorded in
  [`../Evidence/SK-EVID-005-cp03-implementation-task-lock-verification.md`](../Evidence/SK-EVID-005-cp03-implementation-task-lock-verification.md).
  CP-03 authorizes registration of the CP-04 child task; no game runtime implementation is claimed.

## Phase 1 — runtime and authority foundation

### CP-04 — process skeleton and health (`VERIFIED LOCAL`)

- **Scope:** Create one explicit local Node.js process entrypoint hosting the Next.js page application
  and designated world-worker module, with typed configuration, startup/shutdown lifecycle,
  health/readiness endpoint, and structured redacted logging. The accepted boundary is recorded in
  [`../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md)
  and locally verified in
  [`../Evidence/SK-EVID-007-cp04-process-runtime-verification.md`](../Evidence/SK-EVID-007-cp04-process-runtime-verification.md).
- **Depends on:** CP-03.
- **Acceptance:** The entrypoint starts the worker once, exposes dynamic process health with distinct
  `live`, `ready`, `degraded`, and `draining` semantics, rejects missing configuration, stops cleanly,
  and reports unique process and worker instances without writing secrets or mutable traces to the repository.
- **Verify:** Production-like build/start smoke, malformed configuration check, health status and HTTP
  code readback, signal-safe drain, log-redaction assertion, and Node 24 syntax/type checks.
- **Current result:** [`../Tasks/SK-TASK-004-cp04-process-skeleton-and-health.md`](../Tasks/SK-TASK-004-cp04-process-skeleton-and-health.md) is verified with local process-runtime evidence in [`../Evidence/SK-EVID-007-cp04-process-runtime-verification.md`](../Evidence/SK-EVID-007-cp04-process-runtime-verification.md); CP-05 consumed this boundary and is locally closed.

### CP-05 — durable state, event log, and outbox (`VERIFIED LOCAL`)

- **Scope:** Add the minimum schema for world, players, shelters, soldiers, missions, cargo, resource
  nodes, monsters, events, `world_snapshot`, outbox deliveries, and coalesced Agent Signal state. Use SQLite
  WAL locally and one transaction for state change plus Domain Event and eligible delivery-record append.
- **Depends on:** CP-04 and CP-01.
- **Acceptance:** `world_snapshot` and event replay recover the same state; unique event, signal, and
  idempotency keys prevent duplicate cargo, respawn, coin, or delivery effects; routine events remain
  durable without creating per-event notifications; schema version is visible.
- **Verify:** Transaction rollback, duplicate command, duplicate outbox/signal delivery, event-burst
  aggregation, and process restart tests, with the cross-functional task review recorded in
  [`../Validation/07-cp05-persistence-cross-functional-audit.md`](../Validation/07-cp05-persistence-cross-functional-audit.md).
- **Current result:** [`../Tasks/SK-TASK-005-cp05-persistence-event-log-and-outbox.md`](../Tasks/SK-TASK-005-cp05-persistence-event-log-and-outbox.md) is verified with file-backed SQLite WAL, versioned minimum schema, atomic state/event/idempotency/Signal transitions, snapshot integrity and replay checks, coalesced delivery lease tests, and CP-04 transitive lifecycle evidence in [`../Evidence/SK-EVID-008-cp05-persistence-runtime-verification.md`](../Evidence/SK-EVID-008-cp05-persistence-runtime-verification.md). The listener-first shutdown remediation is resolved in [`../Issues/resolved/SK-ISSUE-004-cp04-shutdown-order-and-store-close.md`](../Issues/resolved/SK-ISSUE-004-cp04-shutdown-order-and-store-close.md).

### CP-06 — authoritative clock, boundary journal, and restart recovery (`VERIFIED LOCAL EXPLICIT-AUTONOMOUS SCOPE; HOSTED CONTINUITY OPEN`)

- **Scope:** Implement one worker-owned monotonic integer world clock at one world second per real
  second, a 100 ms projection/reconciliation seam, a durable in-progress boundary journal, the fixed
  G2 gameplay phase coordinator, integer-second due-work milestones, and deterministic downtime
  catch-up under the accepted 300-second recovery budget. The clock predecessor is
  [`../Tasks/SK-TASK-020-cp06-clock-and-recovery-implementation.md`](../Tasks/SK-TASK-020-cp06-clock-and-recovery-implementation.md); the boundary-safe composition is
  [`../Tasks/SK-TASK-046-cp06-boundary-safe-gameplay-phase-coordinator.md`](../Tasks/SK-TASK-046-cp06-boundary-safe-gameplay-phase-coordinator.md); the preparation pack remains [`../Tasks/SK-TASK-006-cp06-clock-recovery-preimplementation-pack.md`](../Tasks/SK-TASK-006-cp06-clock-recovery-preimplementation-pack.md).
- **Depends on:** CP-05.
- **Acceptance:** Browser presence cannot pause world time; an explicitly enabled worker restart resumes from durable
  integer time; due work is applied once in the documented order; an overdue event does not create an
  unbounded loop; and a gap above 300 world seconds returns typed `RECOVERY_LIMIT_EXCEEDED` while
  preserving durable state/history and closing the world mutation gate.
- **Verify:** Focused fake-clock and projection-boundary tests, exact-limit and over-limit recovery
  tests, sleep/restart replay, wall-clock jump test, duplicate/crash retry test, event-order replay,
  one-shot overlap/drain/fault tests, and a level-4 file-backed autonomous progression/restart proof.
- **Current result:** The clock predecessor [`../Tasks/SK-TASK-020-cp06-clock-and-recovery-implementation.md`](../Tasks/SK-TASK-020-cp06-clock-and-recovery-implementation.md) remains runtime-verified for the local worker-owned clock, monotonic persistence seam, bounded recovery, and lifecycle hook. [`../Tasks/SK-TASK-046-cp06-boundary-safe-gameplay-phase-coordinator.md`](../Tasks/SK-TASK-046-cp06-boundary-safe-gameplay-phase-coordinator.md) is runtime-verified for the schema-v7 boundary-journal predecessor, whole-boundary restart replay, one default worker gameplay graph, fixed phase ordering, and pre-empty target liveness in [`../Evidence/SK-EVID-035-cp06-gameplay-phase-coordinator-runtime-verification.md`](../Evidence/SK-EVID-035-cp06-gameplay-phase-coordinator-runtime-verification.md) and [`../Validation/57-cp06-gameplay-phase-coordinator-runtime-cross-functional-audit.md`](../Validation/57-cp06-gameplay-phase-coordinator-runtime-cross-functional-audit.md). The owner-accepted B startup-only server-time-anchor extension is runtime-verified under [`../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md), [`../Decisions/ADR-GAME-0033-cp06-trusted-elapsed-time-and-autonomous-scheduler.md`](../Decisions/ADR-GAME-0033-cp06-trusted-elapsed-time-and-autonomous-scheduler.md), [`../Tasks/SK-TASK-047-cp06-trusted-elapsed-time-and-autonomous-scheduler.md`](../Tasks/SK-TASK-047-cp06-trusted-elapsed-time-and-autonomous-scheduler.md), [`../Evidence/SK-EVID-036-cp06-autonomous-scheduler-runtime-verification.md`](../Evidence/SK-EVID-036-cp06-autonomous-scheduler-runtime-verification.md), and [`../Validation/59-cp06-autonomous-scheduler-runtime-cross-functional-audit.md`](../Validation/59-cp06-autonomous-scheduler-runtime-cross-functional-audit.md). Timer reducers, multi-world scheduling, hosted continuity, and default-world bootstrap remain separate later gates.

### CP-07 — deterministic map, actors, and identity (`VERIFIED LOCAL FIXTURE BOUNDARY; MOVEMENT OPEN`)

- **Scope:** Generate the fixed `sleepless-mvp-01` 128 × 128 map, two protected shelters at least 80
  logical tiles apart, five soldiers per shelter, symmetric Wood/Rock nodes, one seeded monster, and
  stable player/shelter/soldier/monster IDs.
- **Depends on:** CP-06.
- **Implementation task:** [`../Tasks/SK-TASK-021-cp07-deterministic-world-fixture-implementation.md`](../Tasks/SK-TASK-021-cp07-deterministic-world-fixture-implementation.md); preparation remains [`../Tasks/SK-TASK-007-cp07-deterministic-world-fixture-pack.md`](../Tasks/SK-TASK-007-cp07-deterministic-world-fixture-pack.md).
- **Acceptance:** Repeated seed generation is identical; no shelter overlap; both players can join the
  same world; start-zone and visibility rules are explicit.
- **Verify:** Seed replay, placement invariants, two-session join, and hidden-state projection test.
- **Current result:** [`../Tasks/SK-TASK-021-cp07-deterministic-world-fixture-implementation.md`](../Tasks/SK-TASK-021-cp07-deterministic-world-fixture-implementation.md) is runtime-verified for the deterministic manifest, world-scoped identities, atomic fixture persistence, reset isolation, CP-06 clock handoff, and restart non-regeneration in [`../Evidence/SK-EVID-010-cp07-world-fixture-runtime-verification.md`](../Evidence/SK-EVID-010-cp07-world-fixture-runtime-verification.md). The route's intentional Rock threat waypoint and remaining movement/pathfinding/visibility limits are recorded in [`../Validation/14-cp07-world-fixture-runtime-cross-functional-audit.md`](../Validation/14-cp07-world-fixture-runtime-cross-functional-audit.md).

## Phase 2 — movement, visibility, and multiplayer projection

### CP-08 — movement, pathfinding, fog, sensors, and realtime `client_snapshot` projections (`IN PROGRESS`)

- **Scope:** Implement grid walkability, cached route/waypoint planning, 100 ms movement, player fog,
  shelter/soldier sensors, WebSocket `client_snapshot` sequence, full resync, and reconnect status.
- **Depends on:** CP-07 and CP-02.
- **Implementation tasks:** the verified predecessors [`../Tasks/SK-TASK-022-cp08-movement-visibility-realtime-implementation.md`](../Tasks/SK-TASK-022-cp08-movement-visibility-realtime-implementation.md), [`../Tasks/SK-TASK-023-cp08-worker-movement-cadence.md`](../Tasks/SK-TASK-023-cp08-worker-movement-cadence.md), [`../Tasks/SK-TASK-024-cp08-worker-command-read-gateway.md`](../Tasks/SK-TASK-024-cp08-worker-command-read-gateway.md), and [`../Tasks/SK-TASK-025-cp08-realtime-snapshot-transport.md`](../Tasks/SK-TASK-025-cp08-realtime-snapshot-transport.md), followed by the registered entrypoint/wire integration task [`../Tasks/SK-TASK-026-cp08-entrypoint-realtime-wire-adapter.md`](../Tasks/SK-TASK-026-cp08-entrypoint-realtime-wire-adapter.md). The bounded increments are one authoritative player move, a full player-scoped snapshot replacement, worker-serialized 100 ms movement with process-local fractional progress, a gateway FIFO, and a transport-neutral full connect/resync seam.
- **Acceptance:** Player avatars use WASD, explored cells persist, each player sees only permitted
  actors, remote movement interpolates, stale commands are rejected, and reconnect begins with a full
  authoritative `client_snapshot`.
- **Verify:** Two browser sessions, packet delay/drop simulation, resync, route invalidation, and
  unsupported-WebSocket visible degradation.
- **Current result:** The first bounded movement/snapshot increment is runtime-verified in
  [`../Evidence/SK-EVID-011-cp08-movement-snapshot-runtime-verification.md`](../Evidence/SK-EVID-011-cp08-movement-snapshot-runtime-verification.md)
  and reviewed in
  [`../Validation/15-cp08-movement-snapshot-runtime-cross-functional-audit.md`](../Validation/15-cp08-movement-snapshot-runtime-cross-functional-audit.md):
  schema v2 player position/exploration, adjacent-tile authority, retry/ownership boundaries, and
  full scoped snapshot replacement. Worker cadence and command/read ordering are runtime-verified
  under `SK-TASK-023` and `SK-TASK-024`; transport-neutral realtime connect/resync projection is
  runtime-verified under `SK-TASK-025` and reviewed in [`../Validation/18-cp08-realtime-snapshot-runtime-cross-functional-audit.md`](../Validation/18-cp08-realtime-snapshot-runtime-cross-functional-audit.md). The authenticated local entrypoint wire increment is runtime-verified under [`../Tasks/SK-TASK-026-cp08-entrypoint-realtime-wire-adapter.md`](../Tasks/SK-TASK-026-cp08-entrypoint-realtime-wire-adapter.md), with evidence in [`../Evidence/SK-EVID-015-cp08-realtime-wire-runtime-verification.md`](../Evidence/SK-EVID-015-cp08-realtime-wire-runtime-verification.md) and cross-functional review in [`../Validation/20-cp08-realtime-wire-runtime-cross-functional-audit.md`](../Validation/20-cp08-realtime-wire-runtime-cross-functional-audit.md). Production identity, visibility expansion, browser behavior, gameplay projections, and hosted behavior remain open.

## Phase 3 — missions and the Wood/Rock economy

### CP-09 — role, tool, mission, and return state (`IN PROGRESS; dispatch and route arrival verified`)

- **Scope:** Implement resident/field soldier state, gatherer/hunter/guard role lock, loadout at
  dispatch, target/route, full-pack return, forced recall, mission terminal state, and repeat policy.
- **Depends on:** CP-08.
- **Acceptance:** A field soldier cannot switch role or tool in place; recall queues travel; a new
  role receives a new mission attempt; a repeatable mission preserves identity without teleporting.
- **Verify:** Valid and invalid commands, stale revision, recall during travel, and role-lock history.
- **Current bounded result:** `SK-TASK-027` verifies one server-derived GATHERER Wood/Rock dispatch,
  schema 2-to-3 migration, deterministic route handoff, atomic mission/attempt/event/idempotency
  state, and field role-lock rejection. `SK-TASK-028` verifies due-marker persistence, derived
  transit, one deterministic `TRAVELLING` to `WORKING` arrival, schema-2 due-column migration, clock
  boundary protection, duplicate safety, and restart recovery in [`../Evidence/SK-EVID-017-cp09-route-milestone-runtime-verification.md`](../Evidence/SK-EVID-017-cp09-route-milestone-runtime-verification.md), with the cross-functional disposition in [`../Validation/24-cp09-route-milestone-runtime-cross-functional-audit.md`](../Validation/24-cp09-route-milestone-runtime-cross-functional-audit.md). Extraction and return are covered by later CP-10 records; terminal transition policy remains separately open, while CP-13 recall is owned by SK-TASK-060.

### CP-10 — Wood/Rock extraction, cargo, deposit, and coins (`LOCAL RUNTIME-VERIFIED; extraction, cadence/return handoff, same-worker contest, return navigation/home crossing, and deposit settlement verified`)

- **Scope:** Add tier-one extraction for Wood and Rock, five equal-weight cargo slots, 2-second
  extraction cycles, 20-unit nodes, 30-second respawn, and shelter deposit conversion of 1/3 coins.
- **Depends on:** CP-09 and CP-05.
- **Acceptance:** Node quantity decrements atomically; capacity starts return; no coin exists before
  deposit; mixed cargo and partial final extraction are deterministic; node depletion is visible.
- **Verify:** Two soldiers contest a node, capacity boundary, node depletion/respawn, deposit retry,
  and coin ledger reconciliation.
- **Current bounded result:** `SK-TASK-029` verifies the first post-arrival Wood/Rock extraction,
  schema-v3-to-v4 cargo provenance migration, one atomic node/cargo/event/idempotency boundary, and
  restart/ordering guards. The runtime result is [`../Evidence/SK-EVID-018-cp10-first-extraction-runtime-verification.md`](../Evidence/SK-EVID-018-cp10-first-extraction-runtime-verification.md),
  reviewed in [`../Validation/26-cp10-first-extraction-runtime-cross-functional-audit.md`](../Validation/26-cp10-first-extraction-runtime-cross-functional-audit.md),
  with its accepted challenge and decision in [`../Validation/25-cp10-first-extraction-preimplementation-challenge.md`](../Validation/25-cp10-first-extraction-preimplementation-challenge.md)
  and [`../Decisions/ADR-GAME-0020-cp10-first-extraction-and-cargo.md`](../Decisions/ADR-GAME-0020-cp10-first-extraction-and-cargo.md). The follow-on [`SK-TASK-030`](../Tasks/SK-TASK-030-cp10-extraction-cadence-and-return-handoff.md) verifies the recurring cadence, capacity/depletion return handoff, exact event guards, rollback, and restart in [`../Evidence/SK-EVID-019-cp10-extraction-cadence-runtime-verification.md`](../Evidence/SK-EVID-019-cp10-extraction-cadence-runtime-verification.md) and [`../Validation/28-cp10-extraction-cadence-runtime-cross-functional-audit.md`](../Validation/28-cp10-extraction-cadence-runtime-cross-functional-audit.md). [`SK-TASK-031`](../Tasks/SK-TASK-031-cp10-contested-node-outcome.md) is runtime-verified for deterministic same-worker winner/loser completion under [`ADR-GAME-0022`](../Decisions/ADR-GAME-0022-cp10-contested-node-outcome.md), with evidence in [`../Evidence/SK-EVID-020-cp10-contested-node-runtime-verification.md`](../Evidence/SK-EVID-020-cp10-contested-node-runtime-verification.md) and review in [`../Validation/30-cp10-contested-node-runtime-cross-functional-audit.md`](../Validation/30-cp10-contested-node-runtime-cross-functional-audit.md). [`SK-TASK-032`](../Tasks/SK-TASK-032-cp10-return-navigation-and-home-crossing.md) is runtime-verified for deterministic return navigation and exact home crossing under [`ADR-GAME-0023`](../Decisions/ADR-GAME-0023-cp10-return-navigation-and-home-crossing.md), with evidence in [`../Evidence/SK-EVID-021-cp10-return-navigation-runtime-verification.md`](../Evidence/SK-EVID-021-cp10-return-navigation-runtime-verification.md) and review in [`../Validation/32-cp10-return-navigation-runtime-cross-functional-audit.md`](../Validation/32-cp10-return-navigation-runtime-cross-functional-audit.md). [`SK-TASK-033`](../Tasks/SK-TASK-033-cp10-deposit-and-coin-settlement.md) is runtime-verified for worker-owned Wood/Rock deposit, coin settlement, resident handoff, exactly-once events, restart recovery, and manual mission-row reuse under [`ADR-GAME-0024`](../Decisions/ADR-GAME-0024-cp10-deposit-and-coin-settlement.md), with executed evidence in [`../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md`](../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md) and cross-functional review in [`../Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md`](../Validation/34-cp10-deposit-settlement-runtime-cross-functional-audit.md). The accepted challenge remains [`../Validation/33-cp10-deposit-and-coin-settlement-preimplementation-challenge.md`](../Validation/33-cp10-deposit-and-coin-settlement-preimplementation-challenge.md); browser, hosted/default scheduler composition, WebMCP, Re-entry, and hosted composition remain separate gates.

### CP-11 — monster state, encounter, combat, cargo loss, and respawn (`LOCAL RUNTIME-VERIFIED; gatherer-loss, Hunter-victory, and bounded reissue/review verified`)

- **Scope:** Implement the seeded monster state machine, sensor-to-contact lock, deterministic PvE
  combat placeholder, `CargoLostToMonster`, same-identity respawn, empty respawn cargo, and gathering
  or hunting mission reissue.
- **Depends on:** CP-10 and CP-08.
- **Acceptance:** A gatherer can lose to the monster, a hunter can win with the documented formula,
  the monster remains in its normal state machine, only unbanked cargo is destroyed, and the soldier
  does not duplicate.
- **Verify:** Formula examples, contact lock, simultaneous milestone ordering, monster-kill replay,
  respawn/reissue, and no-killer-reward assertion.
- **Current bounded increments:** [`SK-TASK-034`](../Tasks/SK-TASK-034-cp11-gatherer-combat-and-cargo-loss.md)
  owns the first local seeded-monster GATHERER contact, deterministic rounds, cargo-loss, and
  same-identity respawn boundary under [`ADR-GAME-0025`](../Decisions/ADR-GAME-0025-cp11-gatherer-combat-and-cargo-loss.md)
  and [`Validation/35-cp11-gatherer-combat-preimplementation-challenge.md`](../Validation/35-cp11-gatherer-combat-preimplementation-challenge.md). [`SK-TASK-035`](../Tasks/SK-TASK-035-cp11-hunter-victory-and-return.md)
  adds the seeded HUNTER/SWORD route, typed five-round victory, single-target reservation, monster
  `DEAD` history, and route-preserving zero-cargo return under [`ADR-GAME-0026`](../Decisions/ADR-GAME-0026-cp11-hunter-victory-and-return.md).
  Evidence and cross-functional review are recorded in [`../Evidence/SK-EVID-024-cp11-hunter-victory-runtime-verification.md`](../Evidence/SK-EVID-024-cp11-hunter-victory-runtime-verification.md)
  and [`../Validation/38-cp11-hunter-victory-runtime-cross-functional-audit.md`](../Validation/38-cp11-hunter-victory-runtime-cross-functional-audit.md). [`SK-TASK-036`](../Tasks/SK-TASK-036-cp11-danger-cell-reissue-and-anti-loop.md) owns the schema-v6, deterministic danger-cell reissue, and typed anti-loop review boundary under [`ADR-GAME-0027`](../Decisions/ADR-GAME-0027-cp11-danger-cell-reissue-and-anti-loop.md) and [`Validation/39`](../Validation/39-cp11-danger-cell-reissue-preimplementation-challenge.md); its local runtime result is recorded in [`../Evidence/SK-EVID-025-cp11-danger-cell-reissue-runtime-verification.md`](../Evidence/SK-EVID-025-cp11-danger-cell-reissue-runtime-verification.md) and [`../Validation/40-cp11-danger-cell-reissue-runtime-cross-functional-audit.md`](../Validation/40-cp11-danger-cell-reissue-runtime-cross-functional-audit.md). Browser and hosted/default scheduler composition remain separate gates.

## Phase 4 — user surface and Re-entry proof

### CP-12 — minimal Canvas and dashboard (`TASK-037 THROUGH TASK-045, TASK-051, AND TASK-054 LOCAL RUNTIME-VERIFIED FOR NAMED SCOPES; TWO-SESSION AND SERVER-CONTINUOUS-PROGRESSION GATES OPEN`)

- **Scope:** Integrate the accepted visual/UI spec with the Starve.io-inspired minimal top-down
  surface: tile/sprite atlas, Canvas projection, React controls, keyboard movement, shelter HUD,
  mission rows, cargo risk, event history, reconnect status, lightweight effects, and accessible text
  equivalents.
- **Depends on:** CP-08 through CP-11.
- **Acceptance:** Canvas renders `client_snapshot` projections at up to 60 FPS, interpolates remote actors, reconciles local
  input, and never decides world state. The dashboard explains mission, cargo, death cause, respawn,
  and next valid action.
- **Verify:** Browser smoke, keyboard path, reduced-motion/accessibility check, stale `client_snapshot` message,
  and manual two-player observation.
- **Current bounded increments:** [`SK-TASK-037`](../Tasks/SK-TASK-037-cp12-client-projection-and-mission-row.md) implements the additive server-owned projection, one deterministic Canvas frame, and one accessible mission/status surface. Its accepted pre-implementation challenge is [`Validation/41-cp12-client-projection-preimplementation-challenge.md`](../Validation/41-cp12-client-projection-preimplementation-challenge.md), and the projection boundary is [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md). Local runtime evidence is [`SK-EVID-026`](../Evidence/SK-EVID-026-cp12-client-projection-runtime-verification.md), reviewed in [`Validation/42`](../Validation/42-cp12-client-projection-runtime-cross-functional-audit.md). [`SK-TASK-038`](../Tasks/SK-TASK-038-cp12-local-fixture-session-and-initial-frame.md) is runtime-verified at the named local level-4 scope under the accepted explicit non-production fixture bootstrap and first-frame boundary in [`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md) and [`Validation/43`](../Validation/43-cp12-local-fixture-session-preimplementation-challenge.md), with [`SK-EVID-028`](../Evidence/SK-EVID-028-cp12-local-fixture-session-runtime-verification.md) and [`Validation/45`](../Validation/45-cp12-local-fixture-session-runtime-cross-functional-audit.md). The independent visual lane is integrated under accepted [`ADR-GAME-0007`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md) through [`SK-TASK-039`](../Tasks/SK-TASK-039-cp12-original-svg-ui-icon-pack.md), with [`SK-EVID-027`](../Evidence/SK-EVID-027-cp12-original-svg-ui-icon-runtime-verification.md) and [`Validation/44`](../Validation/44-cp12-original-svg-ui-icon-runtime-cross-functional-audit.md). [`SK-TASK-040`](../Tasks/SK-TASK-040-cp12-browser-hydration-and-two-session-smoke.md) is runtime-verified for one browser context with [`SK-EVID-029`](../Evidence/SK-EVID-029-cp12-browser-hydration-runtime-verification.md) and [`Validation/47`](../Validation/47-cp12-browser-hydration-runtime-cross-functional-audit.md). [`SK-TASK-041`](../Tasks/SK-TASK-041-cp13-webmcp-capability-probe.md) remains terminal for its named negative adapter outcome with [`SK-EVID-030`](../Evidence/SK-EVID-030-cp13-webmcp-capability-probe.md); that result is explained by Luna model eligibility and is superseded on the adapter-capability question by [`SK-TASK-059`](../Tasks/SK-TASK-059-cp13-site-tools-capability-experiment.md) and [`SK-EVID-045`](../Evidence/SK-EVID-045-cp13-site-tools-capability-experiment.md). CP-13 page-tool implementation is tracked under [`SK-TASK-061`](../Tasks/SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md); the server recall transition is terminal for its named local scope under [`SK-TASK-060`](../Tasks/SK-TASK-060-cp13-recall-transition-implementation.md), [`SK-EVID-046`](../Evidence/SK-EVID-046-cp13-recall-transition-runtime-verification.md), and [`Validation/73`](../Validation/73-cp13-recall-transition-runtime-cross-functional-audit.md). [`SK-TASK-053`](../Tasks/SK-TASK-053-cp13-page-tool-contract-preparation.md) is verified at documentation scope. [`SK-TASK-042`](../Tasks/SK-TASK-042-cp12-independent-two-session-browser-isolation.md) is runtime-verified for the named two-tab limitation with [`SK-EVID-031`](../Evidence/SK-EVID-031-cp12-two-session-browser-isolation-probe.md) and [`Validation/48`](../Validation/48-cp12-two-session-browser-isolation-runtime-cross-functional-audit.md); the independent two-session claim remains open. [`SK-TASK-043`](../Tasks/SK-TASK-043-cp12-browser-reconnect-and-stale-fallback.md) is runtime-verified for explicit same-scope manual reconnect and stale fallback with [`SK-EVID-032`](../Evidence/SK-EVID-032-cp12-browser-reconnect-runtime-verification.md) and [`Validation/50`](../Validation/50-cp12-browser-reconnect-runtime-cross-functional-audit.md). [`SK-TASK-044`](../Tasks/SK-TASK-044-cp12-keyboard-movement-and-authoritative-reconciliation.md) is runtime-verified for one discrete strict-session keyboard/button movement path with [`SK-EVID-033`](../Evidence/SK-EVID-033-cp12-keyboard-movement-runtime-verification.md) and [`Validation/53`](../Validation/53-cp12-keyboard-movement-runtime-cross-functional-audit.md). [`SK-TASK-045`](../Tasks/SK-TASK-045-cp12-human-gatherer-dispatch-and-authoritative-reconciliation.md) is runtime-verified for one strict-session ordinary-UI Rock GATHERER dispatch and full-snapshot reconciliation path with [`SK-EVID-034`](../Evidence/SK-EVID-034-cp12-human-gatherer-dispatch-runtime-verification.md) and [`Validation/55`](../Validation/55-cp12-human-gatherer-dispatch-runtime-cross-functional-audit.md). Canonical game-page WebMCP tools, Re-entry, production identity, independent two-session delivery, hosted continuity, hosted/default-world continuous movement, and performance remain separate gates; the boundary-safe phase composition and explicitly enabled local autonomous scheduler are closed under CP-06.

The CP-12 automatic realtime publication increment is runtime-verified for its named local worker-to-page scope under [`SK-TASK-051`](../Tasks/SK-TASK-051-cp12-autonomous-realtime-snapshot-publication.md), [`SK-EVID-040`](../Evidence/SK-EVID-040-cp12-autonomous-realtime-snapshot-publication-runtime-verification.md), and [`Validation/63`](../Validation/63-cp12-autonomous-realtime-snapshot-publication-runtime-cross-functional-audit.md). The snapshot-gated held-input increment is runtime-verified for its named local client presentation scope under [`SK-TASK-054`](../Tasks/SK-TASK-054-cp12-held-movement-and-touch-input.md), [`ADR-GAME-0035`](../Decisions/ADR-GAME-0035-cp12-snapshot-gated-held-movement.md), [`SK-EVID-042`](../Evidence/SK-EVID-042-cp12-held-movement-runtime-verification.md), and [`Validation/66`](../Validation/66-cp12-held-movement-runtime-cross-functional-audit.md). The server-owned continuous-intent preparation and decision are recorded under [`SK-TASK-055`](../Tasks/SK-TASK-055-cp12-server-owned-continuous-intent-preparation.md), [`ADR-GAME-0036`](../Decisions/ADR-GAME-0036-cp12-server-owned-continuous-intent.md), and accepted [`Validation/67`](../Validation/67-cp12-server-owned-continuous-intent-preimplementation-challenge.md); its implementation is runtime-verified for the named local scope under [`SK-TASK-057`](../Tasks/SK-TASK-057-cp12-server-owned-continuous-intent.md), [`SK-EVID-043`](../Evidence/SK-EVID-043-cp12-server-owned-continuous-intent-runtime-verification.md), and [`Validation/71`](../Validation/71-cp12-server-owned-continuous-intent-runtime-cross-functional-audit.md). Mobile UX, canonical game-page WebMCP tools, Re-entry, independent sessions, hosted continuity, and public-load admission remain separate.

The CP-12 Canvas actor/world visual increment is integrated for the named local primitive surface under [`SK-TASK-065`](../Tasks/SK-TASK-065-cp12-canvas-actor-world-visual-surface.md), with focused mapping/projection tests, Node 24 typecheck/build, and 1280px/390px browser readback recorded in [`SK-EVID-052`](../Evidence/SK-EVID-052-cp12-canvas-actor-world-visual-surface-runtime-verification.md) and [`Validation/78`](../Validation/78-cp12-canvas-actor-world-visual-surface-runtime-cross-functional-audit.md). This closes only the baseline Canvas presentation; final atlas/art states, animation/VFX, population-scale performance, WebMCP, Re-entry, independent sessions, hosted continuity, and public-load admission remain separate.
The follow-on [`SK-TASK-066`](../Tasks/SK-TASK-066-cp12-canvas-mission-state-readback.md) readback is runtime-verified under [`SK-EVID-053`](../Evidence/SK-EVID-053-cp12-canvas-mission-state-readback-runtime-verification.md) and [`Validation/79`](../Validation/79-cp12-canvas-mission-state-readback-runtime-cross-functional-audit.md): one fresh local ordinary-UI GATHERER mission was observed from authoritative dispatch through travel, extraction, full-cargo return, responsive Canvas/React agreement, and clean shutdown. This closes only the named ladder-level 4 local mission presentation; independent sessions, combat visuals, WebMCP, Re-entry, hosted continuity, final art, and scale remain separate.
The small [`SK-TASK-067`](../Tasks/SK-TASK-067-cp12-canvas-selection-feedback.md) follow-on is integrated under [`SK-EVID-054`](../Evidence/SK-EVID-054-cp12-canvas-selection-feedback-runtime-verification.md) and [`Validation/80`](../Validation/80-cp12-canvas-selection-feedback-runtime-cross-functional-audit.md): valid local form selections now receive clipped solid/dashed Canvas rings while stale, unavailable, and empty selections fail closed. This remains presentation-only and does not change the snapshot, command, session, WebMCP, Re-entry, or external handoff boundaries.
The bounded [`SK-TASK-073`](../Tasks/SK-TASK-073-cp12-mission-status-card-hierarchy.md) follow-on is integrated under [`SK-EVID-060`](../Evidence/SK-EVID-060-cp12-mission-status-card-runtime-verification.md) and [`Validation/86`](../Validation/86-cp12-mission-status-card-runtime-cross-functional-audit.md): the existing mission projection is rendered as structured cards with explicit phase, role/tool, target, cargo, risk, next action, and preserved canonical text. This remains presentation-only and does not change the snapshot, command, session, WebMCP, Re-entry, or external handoff boundaries.
The bounded [`SK-TASK-074`](../Tasks/SK-TASK-074-cp12-causal-history-card-hierarchy.md) follow-on is integrated under [`SK-EVID-061`](../Evidence/SK-EVID-061-cp12-causal-history-card-runtime-verification.md) and [`Validation/87`](../Validation/87-cp12-causal-history-card-runtime-cross-functional-audit.md): the existing player-scoped causal event projection is rendered as ordered cards with explicit event type, world time, cursor, and aggregate identity. This remains presentation-only and does not change event production, delivery, snapshot, command, session, WebMCP, Re-entry, or external handoff boundaries.
The bounded [`SK-TASK-075`](../Tasks/SK-TASK-075-cp12-shelter-economy-summary-cards.md) follow-on is integrated under [`SK-EVID-062`](../Evidence/SK-EVID-062-cp12-shelter-economy-summary-card-runtime-verification.md) and [`Validation/88`](../Validation/88-cp12-shelter-economy-summary-card-runtime-cross-functional-audit.md): the existing projected Coins and ready-gated visible Wood/Rock nodes are rendered as responsive summary cards with explicit availability and fail-closed unavailable-state text. This remains presentation-only and does not change economy, snapshot, command, session, WebMCP, Re-entry, or external handoff boundaries.

### CP-13 — page-bound WebMCP tools (`LOCAL PAGE AND CANONICAL READ CAPABILITY VERIFIED; DYNAMIC RECALL/RE-ENTRY GATES OPEN`)

- **Scope:** Implement and later register the four bounded read tools `inspect_shelter_state`,
  `inspect_client_snapshot`, `inspect_missions`, and `inspect_mission_history` from the canonical
  page, then expose the bounded `force_recall_soldier` seam over the runtime-verified server
  transition. The side-chat `assign_soldier_mission` suggestion is a deferred future candidate
  because target discovery, Agent grant semantics, and its W13 coverage are not in this increment.
- **Depends on:** CP-12, CP-02, and the runtime-verified server transition in SK-TASK-060.
- **Acceptance:** Human UI remains usable without WebMCP; read results include current version and
  typed failure; a stale or cross-shelter call cannot expose or mutate foreign state. Recall uses the
  accepted grant, live revisions, and full-snapshot reconciliation over the verified server seam.
- **Preparation alignment:** [`SK-TASK-053`](../Tasks/SK-TASK-053-cp13-page-tool-contract-preparation.md)
  and [`Validation/64`](../Validation/64-cp13-page-tool-contract-preimplementation-challenge.md) carry
  the amended four-read package, fixed `agent_snapshot_v1` projection, `NOT_OWNER` mapping, typed
  `IN_COMBAT` boundary, and the complete W13-01 through W13-08 mapping. The supported-adapter
  prerequisite is proven for one disposable page in [`SK-EVID-045`](../Evidence/SK-EVID-045-cp13-site-tools-capability-experiment.md);
  it does not prove the canonical game page. [`SK-TASK-060`](../Tasks/SK-TASK-060-cp13-recall-transition-implementation.md)
  and [`SK-EVID-046`](../Evidence/SK-EVID-046-cp13-recall-transition-runtime-verification.md) close the
  named local server recall prerequisite; [`Validation/73`](../Validation/73-cp13-recall-transition-runtime-cross-functional-audit.md)
  records the cross-functional disposition.
- **Verify:** Local contract/process tests cover schema-negative cases, scope/privacy, bounded history,
  unsupported UX, and recall transition/action vectors. The canonical four-read registration/readback
  and one supported GPT-5.6 Sol read-only invocation are verified under [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md); the local one-generation dynamic continuation refresh is verified under [`SK-EVID-074`](../Evidence/SK-EVID-074-cp13-dynamic-continuation-refresh-runtime-verification.md) and [`Validation/100`](../Validation/100-cp13-dynamic-continuation-refresh-cross-functional-audit.md); genuine dynamic recall grant delivery and Re-entry remain separate gates.
- **Current active and pending gates:** CP-12 server-owned continuous intent is terminal for its named local runtime scope under [`SK-TASK-057`](../Tasks/SK-TASK-057-cp12-server-owned-continuous-intent.md), [`SK-EVID-043`](../Evidence/SK-EVID-043-cp12-server-owned-continuous-intent-runtime-verification.md), and [`Validation/71`](../Validation/71-cp12-server-owned-continuous-intent-runtime-cross-functional-audit.md). [`SK-TASK-053`](../Tasks/SK-TASK-053-cp13-page-tool-contract-preparation.md) is verified at documentation scope with the accepted [`Validation/64`](../Validation/64-cp13-page-tool-contract-preimplementation-challenge.md). [`SK-TASK-060`](../Tasks/SK-TASK-060-cp13-recall-transition-implementation.md) is terminal for its named local server scope under [`SK-EVID-046`](../Evidence/SK-EVID-046-cp13-recall-transition-runtime-verification.md) and [`Validation/73`](../Validation/73-cp13-recall-transition-runtime-cross-functional-audit.md). [`SK-TASK-061`](../Tasks/SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md) is verified for the canonical four-read capability under [`SK-EVID-047`](../Evidence/SK-EVID-047-cp13-page-tools-local-runtime-verification.md), [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md), and [`Validation/75`](../Validation/75-cp13-page-tools-runtime-cross-functional-audit.md); dynamic recall grant delivery and Re-entry remain separate gates. The supported adapter prerequisite is also recorded for the disposable CP-02 page under [`SK-EVID-045`](../Evidence/SK-EVID-045-cp13-site-tools-capability-experiment.md); [`SK-ISSUE-001`](../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md) is resolved. No page polyfill or CP-14 external delivery claim follows from the capability result.

The bounded [`SK-TASK-080`](../Tasks/SK-TASK-080-cp13-dynamic-continuation-refresh.md) follow-on is
verified for the local one-generation continuation lifecycle under [`SK-EVID-074`](../Evidence/SK-EVID-074-cp13-dynamic-continuation-refresh-runtime-verification.md)
and [`Validation/100`](../Validation/100-cp13-dynamic-continuation-refresh-cross-functional-audit.md):
the existing recall registration refreshes to a newer server signal, rejects a superseded signal, and
ignores an older late read without changing the page or server contract. Hosted dynamic recall,
Agent/Re-entry delivery, and external Receiver/Connector behavior remain separate gates.

### CP-14 — outbox to Re-entry Core (`PLANNED; COMPETITION GATE`)

- **Scope:** Map `CargoLostToMonster` to one typed coalesced Agent Signal, preserve the opaque binding,
  deliver through the existing Receiver boundary, keep at most one pending or in-flight wake per bound
  Thread, return to the canonical page, reread current state, and execute the bounded recall action
  under the existing grant when the live revision permits it.
- **Depends on:** CP-05, CP-11, and CP-13.
- **External ownership boundary:** The Cloud Receiver and Local Connector are external dependencies
  for this checkpoint. Eddy owns their implementation and changes in a separate branch. The
  Sleepless Kingdom game branch must not implement, modify, refactor, or redeploy either component.
  The agreed Re-entry Core contracts remain the integration baseline unless a new cross-boundary
  decision is explicitly accepted.
- **Game-side responsibility:** This checkpoint owns only the game application's outbox and
  adapter boundary: selecting eligible signals, preserving their identity and coalescing rules,
  handing them to the interfaces Eddy delivers, and recording acknowledgement or typed failure.
  A fixture or contract stub may prove this mapping before the handoff, but it is not live Receiver
  or Connector integration evidence.
- **External handoff gate:** Live integration and CP-14 runtime closure wait for Eddy's Cloud Receiver
  and Local Connector implementation to be completed and verified, with a versioned interface,
  transport/endpoint details, acknowledgement and retry semantics, binding/idempotency behavior,
  and a testable handoff environment. If the delivered contract differs from the agreed baseline,
  stop and record the cross-boundary decision before adapting the game adapter; do not silently
  change either external service or the game's event contract.
- **Acceptance:** Delivery is at-least-once but Domain Event and command effects are exactly-once; the
  signal contains causal cursor/count context without prompts or credentials; a running Thread receives
  no per-event message; Agent context cannot replace page state; human review remains required for
  migration, siege, and destructive actions. The game adapter conforms to the delivered external
  contracts without changing Cloud Receiver or Local Connector behavior.
- **Verify:** Outbox-to-Receiver delivery, duplicate signal delivery, burst coalescing, active-Thread
  backpressure, delayed page return, missing capability, stale revision, late action, and a visible
  committed or typed-rejected command result. Before the external handoff, report only game-side
  contract verification; after the handoff, add one exact-version Receiver-to-Connector delivery
  trace and the hosted or local end-to-end proof that it actually exercised Eddy's services.
- **Preparation:** [`SK-TASK-014`](../Tasks/SK-TASK-014-cp14-reentry-adapter-preimplementation-pack.md)
  and [`SK-TASK-014`–`SK-TASK-016` preparation audit](../Validation/49-cp14-cp16-preparation-cross-functional-audit.md)
  define the game-side handoff, local-stub boundary, and external stop conditions; no runtime
  integration claim follows.
- **Current preparation:** [`SK-TASK-052`](../Tasks/SK-TASK-052-cp14-signal-policy-conformance-tests.md)
  adds a contract-verified local conformance suite for R14-02 through R14-05. The selected
  history-only cooldown policy is recorded in `SK-MVP-0.2` and `ADR-GAME-0009`; this preparation
  does not prove an external delivery boundary. [`SK-TASK-062`](../Tasks/SK-TASK-062-cp14-game-side-local-stub-delivery-port.md),
  [`SK-EVID-050`](../Evidence/SK-EVID-050-cp14-game-side-local-stub-delivery-port-runtime-verification.md),
  and [`Validation/76`](../Validation/76-cp14-game-side-local-stub-delivery-port-runtime-cross-functional-audit.md)
  now verify the bounded game-side port against a labelled local stub. CP-14 also consumes the proposed
  CP-13 tool contract in [`SK-TASK-053`](../Tasks/SK-TASK-053-cp13-page-tool-contract-preparation.md),
  but no **live external-integration** task is admitted until that package is accepted and the
  Receiver/Connector handoff is resolved. A bounded game-side `ReentryDeliveryPort`/`pumpOnce`
  implementation against a labelled local contract stub may proceed now; it must preserve the
  existing durable slot/lease authority and cannot claim live Receiver, Connector, Agent, hosted,
  or Re-entry delivery. The adapter capability itself is no longer the blocker.
  The follow-on [`SK-TASK-068`](../Tasks/SK-TASK-068-cp14-causal-event-to-local-stub-trace.md) is
  runtime-verified under [`SK-EVID-055`](../Evidence/SK-EVID-055-cp14-causal-event-to-local-stub-trace-runtime-verification.md)
  and [`Validation/81`](../Validation/81-cp14-causal-event-to-local-stub-trace-runtime-cross-functional-audit.md):
  a fresh real worker/combat `CargoLostToMonster` path now composes with the game-side port and a
  labelled stub, preserving one signal identity and leaving gameplay unchanged. This remains local
  ladder-level 3 composition evidence; it does not close the external Receiver/Connector, Agent,
  page, WebMCP, Re-entry, hosted, or judge gates.
  The next live-integration preparation is [`SK-TASK-076`](../Tasks/SK-TASK-076-cp14-cloud-receiver-v2-game-adaptation.md)
  under [`Validation/89`](../Validation/89-cp14-cloud-receiver-v2-adaptation-cross-functional-audit.md).
  It treats the Game as a Host publisher and, following outer ADR-0043/RECORE-007, targets repeated
  ordered `CargoLostToMonster` signals under one protocol-v0.2 standing Consent with one-active
  backpressure. Cloud queue acceptance remains separate from Connector claim, fresh activation,
  page action, effect acknowledgement, and the next signal. The outer `CLOUD-023` source-level
  closure now supplies a locally committed Receiver and exact-commit upgrade result, but the Game
  task remains pending until an owner-declared installable v0.2 package or endpoint/test handoff is
  accepted with the binding, timestamp, canonical URL, session, standing Grant, sequence, and
  effect-authority mapping; no direct Connector claim or deprecated Receiver fallback is permitted.

## Phase 5 — local verification and demo closure

### CP-15 — contract, race, and failure matrix (`RUNTIME_VERIFIED FOR NAMED LOCAL AGGREGATE`)

- **Scope:** Test positive, malformed, unauthorized, stale, duplicate, replay, timeout, crash,
  unsupported-capability, and boundary cases across clock, cargo, combat, identity, WebSocket, and
  WebMCP.
- **Depends on:** CP-05 through CP-14.
- **Acceptance:** Every known cross-boundary risk in `Validation/03-roadmap-gap-audit.md` has either a
  passing test or an explicit documented open decision outside G2.
- **Verify:** Focused unit/contract tests, transitive repository validators, sensitive scan, and
  process-restart recovery tests.
- **Preparation:** [`SK-TASK-015`](../Tasks/SK-TASK-015-cp15-contract-race-verification-preimplementation-pack.md)
  defines the contract-row matrix, failure classification, Verification Budget, and explicit gated
  outcomes used before the aggregate is owned by this checkpoint.
- **Result:** [`SK-TASK-049`](../Tasks/SK-TASK-049-cp15-contract-race-failure-matrix-aggregate.md)
  and [`SK-EVID-038`](../Evidence/SK-EVID-038-cp15-contract-race-failure-matrix-runtime-verification.md)
  close one fixed-order local aggregate. V05–V12 and V15 pass from actual commands; unavailable
  WebMCP, external Receiver/Connector, independent two-session, hosted, and CP-16 rows remain
  explicit gates.

### CP-16 — local vertical slice and judge rehearsal (`BOUNDED LOCAL SLICE VERIFIED; G2 GATE REMAINS OPEN`)

- **Scope:** Run the complete scripted story with two players: assign gatherer, close page, advance
  world, lose cargo to the monster, respawn, receive one coalesced Re-entry Signal, return to page,
  inspect history, and force recall. Include worker restart, reconnect, an event burst, and a late
  typed-result path.
- **Depends on:** CP-15.
- **Acceptance:** Same seed and commands produce the same event order; browser absence does not pause
  the world; the dashboard explains every transition; all G2 exit criteria pass without manual state
  edits.
- **Verify:** Clean fixture reset, timestamped trace, browser recording or equivalent evidence, and
  redacted event history.
- **Preparation:** [`SK-TASK-016`](../Tasks/SK-TASK-016-cp16-local-vertical-slice-preimplementation-pack.md)
  and [`CP-16 scenario runbook`](../Scenarios/16-cp16-local-vertical-slice-fixtures.md) define the
  deterministic replay, branch handling, evidence packet, and claim limits.
- **Current bounded result:** [`SK-TASK-050`](../Tasks/SK-TASK-050-cp16-local-causal-slice-pre-agent-gates.md),
  [`SK-EVID-039`](../Evidence/SK-EVID-039-cp16-local-causal-slice-pre-agent-gates-runtime-verification.md),
  and [`Validation/61`](../Validation/61-cp16-local-causal-slice-runtime-cross-functional-audit.md)
  verify the server-owned terminal loss, same-identity death/respawn/review, one coalesced pending
  signal/outbox, rollback, replay, no-grant silence, and local scope isolation. The follow-on local
  composition [`SK-TASK-069`](../Tasks/SK-TASK-069-cp16-local-causal-page-recall-composition.md),
  [`SK-EVID-056`](../Evidence/SK-EVID-056-cp16-local-causal-page-recall-composition-runtime-verification.md),
  and [`Validation/82`](../Validation/82-cp16-local-causal-page-recall-composition-runtime-cross-functional-audit.md)
  verify the successful reissue-to-local-port-to-page-HTTP-reread-to-provenance-bound-recall path.
  The restart-aware follow-on [`SK-TASK-070`](../Tasks/SK-TASK-070-cp16-local-causal-restart-recall-continuity.md),
  [`SK-EVID-057`](../Evidence/SK-EVID-057-cp16-local-causal-restart-recall-continuity-runtime-verification.md),
  and [`Validation/83`](../Validation/83-cp16-local-causal-restart-recall-continuity-runtime-cross-functional-audit.md)
  verify that the same durable loss/reissue signal, mission attempt, page reread, and bounded recall
  survive a clean local entrypoint restart with once-only effects. This remains ladder-level 4 local
  evidence and does not claim downtime catch-up, external Re-entry, Agent/WebMCP dynamic action,
  independent browser, hosted continuity, or judge reproduction.
  The real burst follow-on [`SK-TASK-071`](../Tasks/SK-TASK-071-cp16-real-event-burst-page-context.md),
  [`SK-EVID-058`](../Evidence/SK-EVID-058-cp16-real-event-burst-page-context-runtime-verification.md),
  and [`Validation/84`](../Validation/84-cp16-real-event-burst-page-context-runtime-cross-functional-audit.md)
  verify two real loss/reissue outcomes coalescing into one signal while both causal records remain
  available through paginated canonical page history and the latest reissued mission remains recallable.
  This remains ladder-level 4 local evidence and does not claim Connector/Thread backpressure,
  external delivery, WebMCP dynamic action, browser, hosted continuity, or judge reproduction.
  Full G2 still requires positive genuine WebMCP dynamic action, external delivery, two independent
  browser contexts, restart/reconnect/burst trace, hosted continuity, and judge reproduction.
  The current IAB probe is recorded under [`SK-TASK-063`](../Tasks/SK-TASK-063-cp16-independent-browser-context-capability-probe.md),
  [`SK-EVID-051`](../Evidence/SK-EVID-051-cp16-independent-browser-context-capability-probe.md), and
  [`Validation/77`](../Validation/77-cp16-independent-browser-context-capability-runtime-cross-functional-audit.md):
  two tabs and close-one lifecycle passed, but independent context isolation remains open.

## Phase 6 — hosted continuity and submission proof

### CP-17 — hosted always-on deployment (`IN PROGRESS`)

- **Scope:** Use the accepted Railway single-service/Volume-backed SQLite topology, configure durable
  hosted storage, health checks, restart policy, safe environment configuration, Clerk admission, and
  a stable canonical page URL.
- **Depends on:** CP-16 and the separate host decision.
- **Acceptance:** The worker survives ordinary process restart, hosted state persists, the page and
  worker use the same world, and no serverless-only timer owns world time.
- **Verify:** Actual endpoint, process health, deployment logs, database persistence, restart catch-up,
  and command ownership checks.
- **Local implementation:** [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md)
  implements the named-world bootstrap, server-derived two-subject identity, generic bootstrap, HTTP
  command, page-tool, and WebSocket scope seam with focused Node 24 coverage. [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md)
  fixes the MVP topology. **Preparation:** [`SK-TASK-017`](../Tasks/SK-TASK-017-cp17-hosted-continuity-preimplementation-pack.md)
  and [`CP-17 scenario fixtures`](../Scenarios/17-cp17-hosted-continuity-fixtures.md) define the
  host-neutral acceptance matrix, deployment rehearsal, failure branches, evidence packet, and claim
  limits. [`SK-TASK-077`](../Tasks/SK-TASK-077-cp17-host-decision-and-deployment-preflight.md) owns
  the host fact preflight and decision evidence; the Railway project, Volume, and generated service
  URL are provisioned and read back under [`SK-EVID-063`](../Evidence/SK-EVID-063-cp17-railway-resource-provisioning-preflight.md),
  while the hosted deployment, custom Game TLS, Clerk DNS/SSL/JWKS, signed-out admission surface, sequential authenticated Player A/Player B command-to-settlement slices, and a concurrent two-context scoped slice are now read back under [`SK-EVID-065`](../Evidence/SK-EVID-065-cp17-hosted-deployment-and-clerk-domain-runtime-verification.md),
  [`SK-EVID-066`](../Evidence/SK-EVID-066-cp17-player-one-hosted-session-command-runtime-verification.md),
  [`SK-EVID-067`](../Evidence/SK-EVID-067-cp17-player-two-hosted-session-command-runtime-verification.md),
  [`SK-EVID-068`](../Evidence/SK-EVID-068-cp17-independent-contexts-concurrent-hosted-runtime-verification.md),
  [`Validation/91`](../Validation/91-cp17-hosted-deployment-and-clerk-admission-cross-functional-audit.md),
  [`Validation/92`](../Validation/92-cp17-player-one-hosted-admission-runtime-cross-functional-audit.md),
  [`Validation/93`](../Validation/93-cp17-two-sequential-player-hosted-slices-cross-functional-audit.md), and
  [`Validation/94`](../Validation/94-cp17-independent-contexts-concurrent-hosted-runtime-cross-functional-audit.md).
  The hosted restart/reconnect and hash-verified backup slice is now recorded under
  [`SK-EVID-069`](../Evidence/SK-EVID-069-cp17-hosted-restart-backup-continuity-runtime-verification.md)
  and [`Validation/95`](../Validation/95-cp17-hosted-restart-backup-continuity-runtime-cross-functional-audit.md).
  The local production-like bidirectional denial slice is recorded under
  [`SK-EVID-070`](../Evidence/SK-EVID-070-cp17-authenticated-cross-scope-denial-runtime-verification.md)
  and [`Validation/96`](../Validation/96-cp17-authenticated-cross-scope-denial-runtime-cross-functional-audit.md).
  Deliberate hosted authenticated cross-player denial and provider-level rollback remain open; the
  disposable local read-restore compatibility rehearsal is verified under [SK-EVID-073](../Evidence/SK-EVID-073-cp17-read-restore-compatibility-runtime-verification.md) and [Validation/99](../Validation/99-cp17-read-restore-compatibility-cross-functional-audit.md).
  Final hosted closure remains open. The [`CP-13–CP-18 seam map`](10-cp13-cp18-implementation-seam-map.md)
  routes the remaining implementation to the existing entrypoint, health, runtime, and persistence
  boundaries.

### CP-18 — hosted judge reproduction and submission package (`PLANNED; G3 GATE`)

- **Scope:** Rehearse the demo from a clean identity, collect architecture diagram, causal timeline,
  capability result, recovery receipt, screenshots, and known limitations.
- **Depends on:** CP-17.
- **Acceptance:** A reviewer can reproduce the two-player event-to-page chain without private context;
  claims separate local, hosted, runtime, and judge evidence; the human consequence boundary is clear.
- **Verify:** Clean-browser run, independent readback, redacted artifacts, and submission checklist.
- **Preparation:** [`SK-TASK-018`](../Tasks/SK-TASK-018-cp18-judge-reproduction-preimplementation-pack.md)
  and [`CP-18 scenario fixtures`](../Scenarios/18-cp18-judge-reproduction-fixtures.md) define the
  clean-identity rehearsal, artifact manifest, claim ladder, and redaction gate. The
  [`CP-13–CP-18 seam map`](10-cp13-cp18-implementation-seam-map.md) keeps hosted and judge work
  downstream of the capability and external handoff gates.

## Phase 7 — full-game expansion after G2

These are separate release increments. Each must update the owning mechanism, chain, scenario, task,
and verification record before it is treated as part of the target game rather than an idea.

| Checkpoint | Scope | Main dependency | Exit evidence |
|---|---|---|---|
| CP-19 | PvP field encounters, initiative/retreat, cargo transfer and overflow | CP-11 and CP-16 | Two-player battle, exactly-once loot, no shelter-held value leak |
| CP-20 | Shelter defense, turrets, siege party, breach transaction and attacker reward | CP-19 | Siege success/failure, resident/field boundary, reward and penalty ledgers |
| CP-21 | Migration, veil, moving home anchor, stale intelligence, committed assault ordering | CP-20 | Timed migration, hidden fresh location, returning field soldier, race matrix |
| CP-22 | Shelter upgrades, tools, boots, soldier quantity/attributes, repair and recovery | CP-10, CP-20, CP-21 | Atomic wallet/capability projection and breach recovery path |
| CP-23 | Global leaderboard, season/reset policy, reward projection and anti-farming rules | CP-19 through CP-22 | Recomputable rank, duplicate-event safety, repeat-attack policy |
| CP-24 | Additional resources, monster species, spawn pressure, terrain and content generation | CP-23 | Seed/version replay, population budget, no unavoidable spawn kill |
| CP-25 | Performance, security, abuse controls, retention, observability and migration testing | CP-24 | Measured budgets, rate limits, redacted logs, rollback/recovery evidence |
| CP-26 | Full release playtest and product decision between this game and RightSpot | CP-25 and the RightSpot MVP | Comparative evidence, player feedback, and an explicit go/no-go decision |

## Checkpoint closure packet

Every implementation checkpoint must leave the following packet:

1. named task and exact source/branch state;
2. changed code, schema, configuration, or fixture surface;
3. focused tests and the minimum transitive aggregate;
4. browser, process, recovery, or hosted evidence when the claim requires it;
5. updated current status, mechanism, chain, scenario, ADR, or gap record;
6. residual risk, owner, and executable reopen trigger; and
7. one coherent commit with unrelated work absent.

## Stop and replan conditions

Stop the current phase and return to the gap audit when a change would move authority into the
browser, make an Agent event carry prompts or credentials, silently drop cargo or events, require a
second shelter identity, depend on an unproven host sleep guarantee, or add a transport/worker/service
without a measured need. A failed capability probe is a decision point; it is not permission to hide
the failure behind an undocumented fallback.

## Roadmap owner documents

- [`00-current-status.md`](../00-current-status.md) — current phase and claim boundary;
- [`07-hackathon-mvp-build-gate.md`](07-hackathon-mvp-build-gate.md) — accepted MVP defaults and G2
  vertical-slice contract;
- [`05-api-and-webmcp.md`](05-api-and-webmcp.md) — page tools and Re-entry boundary; and
- [`09-mvp-contract-sheet.md`](09-mvp-contract-sheet.md) — normative G2 identities, states, events,
  settlement, `world_snapshot`/`client_snapshot` projections, and acceptance stories;
- [`../Validation/03-roadmap-gap-audit.md`](../Validation/03-roadmap-gap-audit.md) — roadmap design,
  logic, and operational decisions surfaced by this roadmap; and
- [`../Validation/04-mvp-decision-proposals.md`](../Validation/04-mvp-decision-proposals.md) — accepted
  defaults, UX chain contracts, and contract revision checklist;
- [`../Validation/05-pre-implementation-coherence-audit.md`](../Validation/05-pre-implementation-coherence-audit.md)
  — closed coherence findings and residual runtime proof obligations.
- [`../Validation/06-cp04-topology-and-cross-functional-audit.md`](../Validation/06-cp04-topology-and-cross-functional-audit.md)
  — CP-04 topology, lifecycle, health, and cross-checkpoint review accepted for implementation;
  [`../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md)
  is its accepted durable decision.
