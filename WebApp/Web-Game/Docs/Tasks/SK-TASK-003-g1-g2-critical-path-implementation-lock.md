# SK-TASK-003: G1/G2 Critical-Path Implementation Lock

## Task Control

- Lifecycle state: `verified`
- Closure type: `parent_router`
- Checkpoint: `CP-03`
- Owner: Game owner
- Current increment: The bounded G1/G2 durable implementation route, child checkpoint order, acceptance boundary, and recovery point are locked.
- Next gate: Continue with the registered pending [`SK-TASK-005`](SK-TASK-005-cp05-persistence-event-log-and-outbox.md) CP-05 persistence task; keep the external Agent adapter as a separate gate before CP-13 and CP-14.

## Identity

- Task ID: `SK-TASK-003`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: The route crosses world authority, identity, settlement, event ordering, persistence, client projections, WebMCP, Re-entry delivery, and the G2 contract. A scope error could make later runtime evidence meaningless even before gameplay code exists.

## Objective

Produce one reviewable parent implementation task that turns the accepted `SK-MVP-0.2` contract, CP-02 capability result, and G2 build gate into a staged G1/G2 implementation route without requiring an engineer to invent a rule or silently expand the release boundary.

## Success and non-goals

- Success: The task names the G1/G2 critical path, one owner, one child-checkpoint order, explicit cross-module invariants, acceptance cases, verification levels, rollback conditions, and the next executable gate. Every child checkpoint must be separately registered and closed with its own evidence.
- Success: The task preserves server authority, durable `world_snapshot` state, player-scoped `client_snapshot` projections, exactly-once domain effects, coalesced Agent Signals, and the no-gameplay-wait Re-entry policy already accepted in `SK-MVP-0.2`.
- Success: The task makes the external Agent adapter limitation visible as a capability gate. CP-04 through CP-12 may build and verify the human gameplay path without pretending that CP-13 or CP-14 has passed.
- Non-goals: durable runtime code, schema migrations, game balance tuning, hosted deployment, public release, or a gameplay claim.
- Non-goals: full PvP field loot, siege, shelter breach, migration, leaderboard, additional resources, production world scale, anti-farming, or final visual polish.
- Non-goals: any change to `reentry-core/`, `mvp/`, RightSpot, shared dependencies, or external credentials.

## Scope and authority

- In scope: the child checkpoints CP-04 through CP-16 in [`../Engineering/08-development-roadmap-and-checkpoints.md`](../Engineering/08-development-roadmap-and-checkpoints.md), the G2 vertical slice in [`../Engineering/07-hackathon-mvp-build-gate.md`](../Engineering/07-hackathon-mvp-build-gate.md), and the task/evidence records needed to route and close those increments.
- In scope: the accepted `SK-MVP-0.2` identities, state machines, geometry, settlement, event vocabulary, snapshot vocabulary, command envelope, idempotency rules, Re-entry delivery policy, and visual placeholder boundary. The normative definitions remain in [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md) and the controlling ADRs; this task does not redefine them.
- In scope: one parent route with a single authoritative backbone lane. A visual placeholder lane may run in parallel after this lock, and the external Agent capability probe may run in parallel, but neither lane may change the G2 contract or block the human gameplay path without a measured dependency.
- Out of scope: CP-17 and CP-18 hosted closure, CP-19 through CP-26 full-game expansion, and any work in [`../../../../reentry-core/`](../../../../reentry-core/) or [`../../../../mvp/`](../../../../mvp/).
- Allowed actions: read, edit, write, and run within `WebApp/Web-Game/`; no stage, commit, push, deploy, credential use, spend, or destructive operation is granted by this task.
- Revalidate when: `SK-MVP-0.2`, an accepted ADR, the CP-02 capability result, the persistence or snapshot shape, the due-work order, the event/idempotency contract, the visual boundary, or the selected host changes.

## Owning authority

- Governing workflow: [`../00-Workflow/README.md`](../00-Workflow/README.md) and [`../00-Workflow/01-session-runbook.md`](../00-Workflow/01-session-runbook.md)
- Roadmap and checkpoint authority: [`../Engineering/08-development-roadmap-and-checkpoints.md`](../Engineering/08-development-roadmap-and-checkpoints.md)
- G2 implementation boundary: [`../Engineering/07-hackathon-mvp-build-gate.md`](../Engineering/07-hackathon-mvp-build-gate.md)
- Normative contract: [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md)
- Governance and implementation authority: [`../Decisions/ADR-GAME-0008-development-governance-and-implementation-authority.md`](../Decisions/ADR-GAME-0008-development-governance-and-implementation-authority.md)
- Re-entry delivery authority: [`../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md)
- G2 geometry, state, and vocabulary authority: [`../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md`](../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md)
- Visual and placeholder boundary: [`../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md) and [`../Design/06-visual-ui-and-asset-spec.md`](../Design/06-visual-ui-and-asset-spec.md)
- Closed planning findings: [`../Validation/05-pre-implementation-coherence-audit.md`](../Validation/05-pre-implementation-coherence-audit.md), [`../Evidence/SK-EVID-003-g2-coherence-closure-contract-verification.md`](../Evidence/SK-EVID-003-g2-coherence-closure-contract-verification.md)
- Capability evidence and open gate: [`../Evidence/SK-EVID-001-cp02-capability-and-runtime-probe.md`](../Evidence/SK-EVID-001-cp02-capability-and-runtime-probe.md), [`../Evidence/SK-EVID-004-cp02-independent-reproduction-and-claim-review.md`](../Evidence/SK-EVID-004-cp02-independent-reproduction-and-claim-review.md), and [`../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md`](../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md)

## Evidence status

### Verified

- CP-02 locally verifies the disposable Node.js 24 worker, Canvas frame, typed realtime exchange, SQLite WAL restart, visible degradation, and page-side `document.modelContext.registerTool` readback in the recorded environment. [`SK-EVID-001`](../Evidence/SK-EVID-001-cp02-capability-and-runtime-probe.md) is limited to those boundaries.
- An independent review reproduced the Node-side CP-02 result and narrowed the page capability claim to page-side registration accepted; Agent discovery and invocation remain unproven. [`SK-EVID-004`](../Evidence/SK-EVID-004-cp02-independent-reproduction-and-claim-review.md)
- The G2 contract is statically coherent across its movement, sensing, state, anti-loop, protected-start, event, snapshot, and Re-entry rules. [`SK-EVID-003`](../Evidence/SK-EVID-003-g2-coherence-closure-contract-verification.md)
- The owner accepted the real-time coalesced Agent Signal policy: the world never waits, Domain Events remain durable, and one bound shelter/Thread has at most one pending or in-flight wake. [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md)

### Inferred for routing

- CP-04 through CP-12 can proceed without external Agent tool enumeration or invocation because they build the authoritative worker, persistence, clock, world, mission, economy, combat, and human page path.
- CP-13 and CP-14 require a fresh supported-adapter result before they can claim genuine page-bound discovery, invocation, or event-to-Agent action. A visible unsupported state is the only permitted fallback.
- The accepted visual lane can produce placeholders after this lock because it consumes `client_snapshot` projections and stable asset IDs; it cannot create domain authority or alter event order.

### Unknown

- Durable game runtime behavior, schema replay, movement timing, combat settlement, browser reconnect, event-burst coalescing, active-Thread backpressure, and the complete G2 slice remain unverified.
- The current Agent adapter's ability to enumerate and invoke the game page tool remains unresolved under `SK-ISSUE-001`.
- Hosted always-on worker lifetime, durable hosted storage, production balance, and final judge reproducibility remain open.

## Challenge reuse and cross-module locks

This task introduces no new game rule or authority change. It reuses the accepted Challenge and decisions above. Any change to one of the following locks stops the child implementation and reopens this task or its owning ADR before code is adapted.

| Concern | Authority | Child checkpoints | Lock that prevents cross-module drift |
|---|---|---|---|
| World authority, due-work order, and restart | [`../Engineering/03-persistence-world-clock-and-events.md`](../Engineering/03-persistence-world-clock-and-events.md), contract sections 3 and 6 | CP-04 to CP-06, CP-15, CP-16 | The worker owns world time and outcomes; browser timers, Agent turns, and reconnects cannot advance or pause the world. |
| Identity, revisions, and idempotency | Contract sections 2 and 8 | CP-05 to CP-07, CP-13, CP-15 | `world_id`, `player_id`, `shelter_id`, `soldier_id`, `mission_attempt_id`, `monster_id`, `encounter_id`, `event_id`, `signal_id`, `command_id`, and `idempotency_key` remain distinct; every mutation checks ownership and expected revisions. |
| Movement, sensing, and visibility | [`../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md`](../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md), [`../Mechanics/detail-09-navigation-and-pathfinding.md`](../Mechanics/detail-09-navigation-and-pathfinding.md), [`../Mechanics/detail-04-shelter-sensing.md`](../Mechanics/detail-04-shelter-sensing.md), and [`../Mechanics/detail-10-player-exploration-fog-and-intelligence.md`](../Mechanics/detail-10-player-exploration-fog-and-intelligence.md) | CP-07 to CP-08, CP-15 | Rates and radii use the canonical fields and inclusive Euclidean rule; `client_snapshot` exposes only the player's permitted projection. |
| Mission and encounter state | [`../Mechanics/detail-06-soldier-identity-and-lifecycle.md`](../Mechanics/detail-06-soldier-identity-and-lifecycle.md), [`../Mechanics/detail-08-mission-dispatch-return-and-recall.md`](../Mechanics/detail-08-mission-dispatch-return-and-recall.md), and contract section 4 | CP-09, CP-11, CP-15 | `soldier.lifecycle`, `mission.phase`, and `encounter.status` stay separate; encounter lock does not become an invented mission phase. |
| Cargo, coins, and settlement | [`../Mechanics/detail-11-resource-extraction-cargo-and-deposit.md`](../Mechanics/detail-11-resource-extraction-cargo-and-deposit.md), [`../Mechanics/detail-14-loot-reward-and-atomic-transfer.md`](../Mechanics/detail-14-loot-reward-and-atomic-transfer.md), and contract section 5 | CP-10 to CP-11, CP-15, CP-16 | Field cargo remains exposed until deposit; monster death destroys only that cargo; coins are credited only by an atomic shelter deposit. |
| Combat, death, and anti-loop | [`../Mechanics/detail-12-monster-state-and-targeting.md`](../Mechanics/detail-12-monster-state-and-targeting.md), [`../Mechanics/detail-13-encounter-and-combat-resolution.md`](../Mechanics/detail-13-encounter-and-combat-resolution.md), and ADR-GAME-0010 | CP-11, CP-15, CP-16 | One deterministic round per world second, canonical `CargoLostToMonster` event granularity, same-identity respawn, one danger-cell reissue budget, and typed `WAITING_REVIEW` on the two bounded failure cases. |
| Domain Events, outbox, and Re-entry | [`../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md), [`../Engineering/05-api-and-webmcp.md`](../Engineering/05-api-and-webmcp.md), and contract sections 7 and 8 | CP-05, CP-13 to CP-16 | State mutation, Domain Event, and eligible outbox row commit together; Agent Signals are derived/coalesced; no gameplay waits and no Thread receives one message per event. |
| Page projection and visual surface | [`../Design/06-visual-ui-and-asset-spec.md`](../Design/06-visual-ui-and-asset-spec.md), contract section 9 | CP-08, CP-12, CP-13, CP-16 | Canvas and React render/describe `client_snapshot`; placeholders may substitute for art but never for authoritative state or unsupported capabilities. |

## Child checkpoint route

The parent lock routes work in this order. A child task is required before each checkpoint begins; each child owns its code, focused verification, evidence, current-truth update, and one coherent commit when commit authority is separately granted.

| Child checkpoint | Bounded outcome | Entry condition | Exit evidence |
|---|---|---|---|
| CP-04 | Process skeleton, configuration, health, startup, shutdown, and redacted logs | `SK-TASK-003` verified; no code dependency on WebMCP | Process-runtime evidence and updated status |
| CP-05 | SQLite WAL schema, `world_snapshot`, Domain Event log, outbox, signal aggregation state, and atomic transaction boundary | CP-04 health passes | Persistence/replay, rollback, duplicate, and burst-aggregation evidence |
| CP-06 | Server-owned world clock, due-work ordering, bounded catch-up, and restart recovery | CP-05 persistence passes | Process-runtime restart and deterministic catch-up evidence |
| CP-07 | Fixed seed, two shelters, starter soldiers, nodes, monster, stable identities, and fixture reset | CP-06 recovery passes | Seeded fixture and identity evidence |
| CP-08 | Movement, pathfinding, fog, sensors, WebSocket `client_snapshot`, resync, and reconnect | CP-07 fixture passes | Two-session projection, boundary, and reconnect evidence |
| CP-09 | Role/loadout lock, mission phases, return policies, extraction eligibility, and recall command seam | CP-08 projection passes | Mission command and state-transition evidence |
| CP-10 | Wood/Rock extraction, capacity, cargo, deposit, coin credit, node depletion, and respawn | CP-09 mission passes | Settlement, contention, and no-coin-before-deposit evidence |
| CP-11 | Monster state, contact, deterministic combat, cargo loss, respawn, and bounded reissue | CP-10 settlement passes | Round, death, cargo-loss, reissue, and typed-review evidence |
| CP-12 | Minimal Canvas projection, React HUD/dashboard, causal history, stale/reconnect state, and placeholder assets | CP-08 to CP-11 read models pass | Browser/UI and human-only path evidence |
| CP-13 | Page-bound inspection tools and bounded recall with ownership, revision, idempotency, and capability handling | CP-12 page passes; supported adapter gate is available or visibly unresolved | Capability and negative-command evidence |
| CP-14 | Outbox-to-Re-entry adapter, signal coalescing, Thread backpressure, fresh page read, and bounded action | CP-05, CP-11, and CP-13 pass; external adapter gate passes | Slice-chain delivery, duplicate, burst, stale, and human-boundary evidence |
| CP-15 | Cross-boundary race, failure, replay, duplicate, stale, ownership, and unsupported-capability matrix | CP-04 to CP-14 child evidence exists | Aggregate contract and authority-regression evidence |
| CP-16 | Clean two-player local vertical slice, disconnect/restart rehearsal, and judge walkthrough | CP-15 matrix passes | G2 slice evidence with timestamped trace and redacted artifacts |

## Critical G2 acceptance cases

1. The server seeds one 128 x 128 world with two protected shelters at least 80 tiles apart, five soldiers per shelter, symmetric Wood and Rock nodes, and one seeded monster.
2. A gatherer receives one locked mission, travels and extracts while the browser is closed, and the world continues on the server-owned clock.
3. The seeded monster defeats the gatherer under the deterministic formula. One transaction destroys only unbanked field cargo, records the canonical loss event, respawns the same soldier identity, consumes one reissue budget, records the danger cell, and tries one bounded route that avoids it and its one-tile neighbourhood.
4. A missing safe route or a second monster death before deposit produces typed `WAITING_REVIEW`; no invisible automatic death loop continues.
5. The dashboard explains route, cargo, combat, loss, respawn, reissue, and the next valid action. The human path remains usable if WebMCP is unavailable.
6. The eligible loss creates one coalesced Agent Signal without pausing the world. The Agent reads fresh `client_snapshot` and mission history, then attempts the bounded recall under the current revision; stale, already-completed, or unsupported outcomes are visible and typed.
7. A duplicate command, event replay, signal delivery, or restart cannot create a second cargo loss, respawn, coin credit, or continuation effect.
8. Browser disconnect and worker restart recover from durable `world_snapshot` and event history without duplicating due work or accepting a stale projection as authority.

## Implementation and lane rules

- The parent task is a route and release lock, not a single mixed code change. Register the next child task before editing runtime code and keep its current increment singular.
- CP-04 through CP-12 form the backbone. The visual lane may produce the accepted placeholders after this lock and may not delay or redefine the backbone.
- The external Agent adapter probe may run alongside CP-04 through CP-12 because those checkpoints do not depend on Agent invocation. CP-13 and CP-14 cannot claim success until `SK-ISSUE-001` is closed by fresh discovery and invocation evidence.
- Every state mutation, its Domain Event, and its eligible delivery record are one transaction. A derived Agent Signal may coalesce events but cannot replace the durable event log.
- No child may move authority into the browser, put prompts or credentials in an event, silently drop cargo or events, add a gameplay wait, or introduce an unmeasured transport/service split.
- Production balance, prices, spawn pressure, and final art stay tunable configuration or post-G2 scope. They cannot be smuggled into a child task as a new contract rule.

## Smallest reversible action

Record this task lock and its static evidence, then stop the CP-03 increment. Begin CP-04 only through a new `SK-TASK-004` that names its exact files, process contract, focused tests, and rollback point. If a child discovers a contradiction, preserve the evidence, stop at the owning boundary, and reopen this route or its ADR before adapting code.

## Verification and closure target

- Minimum verification: Level 1 static topology/link/language checks; Level 2 targeted cross-reference assertions for the task, roadmap, `SK-MVP-0.2`, ADRs, capability gate, non-goals, and child route.
- Recorded evidence: [`../Evidence/SK-EVID-005-cp03-implementation-task-lock-verification.md`](../Evidence/SK-EVID-005-cp03-implementation-task-lock-verification.md)
- Closure target: `parent_router` with lifecycle `verified` for CP-03 task-lock scope only.
- Rollback or remediation: retain the docs-only state and disposable CP-02 probe as the recovery point. A later child is reverted only through its exact authorized child commit; no history rewrite or workspace cleanup is part of this task.
- Reopen trigger: any contract or ADR change, a child implementation that needs a new authority rule, a capability result that changes CP-13/14 sequencing, a contradiction between the task and roadmap, or evidence that a G2 acceptance case cannot be implemented without expanding scope.

## Closure statement

CP-03 is verified as a bounded G1/G2 implementation route and parent task. It authorizes the next child task to begin CP-04 under the accepted contract. It does not prove durable game code, gameplay correctness, WebMCP Agent invocation, event-burst runtime backpressure, hosted continuity, performance, balance, or submission readiness.
