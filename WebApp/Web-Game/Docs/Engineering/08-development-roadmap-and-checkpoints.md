# Development Roadmap and Checkpoints

**Status:** TARGET DELIVERY ROADMAP; implementation not started  
**Date:** 2026-09-01  
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

The critical path is CP-01 through CP-18. UI polish can run beside CP-09 to CP-14 after the state
contracts are stable, but it cannot define or mutate authoritative state. Full-game expansion starts
only after CP-16 is verified locally.

## Phase 0 — contract and implementation readiness

### CP-00 — accepted concept baseline (`VERIFIED LOCAL`)

- **Scope:** Preserve the owner source, canonical blueprint, 19 mechanisms, 11 chains, 8 capability
  contracts, accepted MVP map/resource/rendering profile, and validation records.
- **Depends on:** Owner discussion and repository guidance.
- **Acceptance:** The two-player 128 × 128 profile, minimum 80-tile separation, Wood plus Rock,
  continuous world, cargo-loss clarification, and minimal Canvas direction appear in the owning docs.
- **Evidence:** 100 child Markdown files, 11 raw source blocks, no broken links, no unfenced CJK, and
  repository validators pass.
- **Current result:** Committed locally as `0791304`; no implementation claim follows.

### CP-01 — MVP contract sheet (`VERIFIED LOCAL; OWNER-ACCEPTED`)

- **Scope:** Freeze the first-slice IDs, states, event names, revisions, clock units, coordinate
  conventions, snapshot shape, command envelope, and cargo settlement cases in one implementation
  contract.
- **Depends on:** CP-00, the gap audit in `Validation/03-roadmap-gap-audit.md`, and the owner-accepted
  defaults in `Validation/04-mvp-decision-proposals.md`.
- **Acceptance:** Every field has one owner, every state transition has an idempotency key or entity
  version, and the contract names deposit-versus-death, restart, reconnect, and duplicate-event order.
- **Verify:** Static cross-reference against `Mechanics/detail-*`, `Mechanics/Chains/`,
  `Engineering/05-api-and-webmcp.md`, and `Engineering/03-persistence-world-clock-and-events.md`.
- **Exit artifact:** [`09-mvp-contract-sheet.md`](09-mvp-contract-sheet.md) and
  [`../Decisions/ADR-GAME-0006-mvp-contract-and-reentry-boundary.md`](../Decisions/ADR-GAME-0006-mvp-contract-and-reentry-boundary.md).
  The bounded implementation task remains deferred until CP-02 passes, as required by the child
  documentation-first stage.

### CP-02 — capability and runtime probe (`PLANNED; RISKEST EARLY CHECK`)

- **Scope:** Prove the selected local runtimes and the real page capability before building the game:
  Node.js 24 worker, Next.js page, Canvas 2D, WebSocket upgrade, SQLite WAL, and page-bound
  `document.modelContext` registration.
- **Depends on:** CP-01.
- **Acceptance:** A test page can render a Canvas frame, exchange one typed command and one snapshot,
  persist one probe event, restart the probe worker, and report WebMCP supported or visibly
  unsupported. The probe harness is disposable; it must not be mistaken for the game's durable
  state implementation.
- **Verify:** Record runtime versions, capability result, connection failure behavior, and the exact
  browser/session used. A fallback cannot silently claim genuine WebMCP.
- **Reopen trigger:** A selected host or browser cannot keep the worker alive or expose the required
  page capability.

### CP-03 — implementation task and release lock (`PLANNED`)

- **Scope:** Convert CP-01 and CP-02 into one bounded implementation task with non-goals, owner,
  acceptance cases, checkpoint cadence, and a rollback point.
- **Depends on:** CP-02 passing or a documented capability decision.
- **Acceptance:** The task names only the G1/G2 critical path; full PvP, siege, migration, breach,
  leaderboard, and visual asset polish are explicit non-goals.
- **Verify:** Human review of the task against this roadmap and `Docs/00-current-status.md`.

## Phase 1 — runtime and authority foundation

### CP-04 — process skeleton and health (`PLANNED`)

- **Scope:** Create the page process, world worker process, typed configuration, startup/shutdown
  lifecycle, health/readiness endpoint, and structured redacted logging.
- **Depends on:** CP-03.
- **Acceptance:** The worker starts once, exposes health, rejects missing configuration, stops cleanly,
  and reports a unique process instance without writing secrets or mutable traces to the repository.
- **Verify:** Start/stop smoke, malformed configuration check, health readback, and Node 24 syntax.

### CP-05 — durable state, event log, and outbox (`PLANNED`)

- **Scope:** Add the minimum schema for world, players, shelters, soldiers, missions, cargo, resource
  nodes, monsters, events, snapshots, and outbox deliveries. Use SQLite WAL locally and one transaction
  for state change plus event/outbox append.
- **Depends on:** CP-04 and CP-01.
- **Acceptance:** Snapshot and event replay recover the same state; unique event and idempotency keys
  prevent duplicate cargo, respawn, coin, or delivery effects; schema version is visible.
- **Verify:** Transaction rollback, duplicate command, duplicate outbox delivery, and separate-process
  restart tests.

### CP-06 — authoritative clock and restart recovery (`PLANNED`)

- **Scope:** Implement one monotonic world clock at one world second per real second, 100 ms movement/
  visibility reconciliation, integer-second combat/extraction milestones, and deterministic downtime
  catch-up.
- **Depends on:** CP-05.
- **Acceptance:** Browser presence cannot pause world time; a worker restart resumes from durable time;
  due work is applied once in the documented order; an overdue event does not create an unbounded loop.
- **Verify:** Fake-clock unit tests, sleep/restart test, wall-clock jump test, and event-order replay.

### CP-07 — deterministic map, actors, and identity (`PLANNED`)

- **Scope:** Generate the fixed `sleepless-mvp-01` 128 × 128 map, two protected shelters at least 80
  logical tiles apart, five soldiers per shelter, symmetric Wood/Rock nodes, one seeded monster, and
  stable player/shelter/soldier/monster IDs.
- **Depends on:** CP-06.
- **Acceptance:** Repeated seed generation is identical; no shelter overlap; both players can join the
  same world; start-zone and visibility rules are explicit.
- **Verify:** Seed replay, placement invariants, two-session join, and hidden-state projection test.

## Phase 2 — movement, visibility, and multiplayer projection

### CP-08 — movement, pathfinding, fog, sensors, and realtime snapshots (`PLANNED`)

- **Scope:** Implement grid walkability, cached route/waypoint planning, 100 ms movement, player fog,
  shelter/soldier sensors, WebSocket snapshot sequence, full resync, and reconnect status.
- **Depends on:** CP-07 and CP-02.
- **Acceptance:** Player avatars use WASD, explored cells persist, each player sees only permitted
  actors, remote movement interpolates, stale commands are rejected, and reconnect begins with a full
  authoritative snapshot.
- **Verify:** Two browser sessions, packet delay/drop simulation, resync, route invalidation, and
  unsupported-WebSocket visible degradation.

## Phase 3 — missions and the Wood/Rock economy

### CP-09 — role, tool, mission, and return state (`PLANNED`)

- **Scope:** Implement resident/field soldier state, gatherer/hunter/guard role lock, loadout at
  dispatch, target/route, full-pack return, forced recall, mission terminal state, and repeat policy.
- **Depends on:** CP-08.
- **Acceptance:** A field soldier cannot switch role or tool in place; recall queues travel; a new
  role receives a new mission attempt; a repeatable mission preserves identity without teleporting.
- **Verify:** Valid and invalid commands, stale revision, recall during travel, and role-lock history.

### CP-10 — Wood/Rock extraction, cargo, deposit, and coins (`PLANNED`)

- **Scope:** Add tier-one extraction for Wood and Rock, five equal-weight cargo slots, 2-second
  extraction cycles, 20-unit nodes, 30-second respawn, and shelter deposit conversion of 1/3 coins.
- **Depends on:** CP-09 and CP-05.
- **Acceptance:** Node quantity decrements atomically; capacity starts return; no coin exists before
  deposit; mixed cargo and partial final extraction are deterministic; node depletion is visible.
- **Verify:** Two soldiers contest a node, capacity boundary, node depletion/respawn, deposit retry,
  and coin ledger reconciliation.

### CP-11 — monster state, encounter, combat, cargo loss, and respawn (`PLANNED`)

- **Scope:** Implement the seeded monster state machine, sensor-to-contact lock, deterministic PvE
  combat placeholder, `CargoLostToMonster`, same-identity respawn, empty respawn cargo, and gathering
  or hunting mission reissue.
- **Depends on:** CP-10 and CP-08.
- **Acceptance:** A gatherer can lose to the monster, a hunter can win with the documented formula,
  the monster remains in its normal state machine, only unbanked cargo is destroyed, and the soldier
  does not duplicate.
- **Verify:** Formula examples, contact lock, simultaneous milestone ordering, monster-kill replay,
  respawn/reissue, and no-killer-reward assertion.

## Phase 4 — user surface and Re-entry proof

### CP-12 — minimal Canvas and dashboard (`PLANNED`)

- **Scope:** Build the Starve.io-inspired minimal top-down surface with a tile/sprite atlas, Canvas
  projection, React controls, keyboard movement, shelter HUD, mission rows, cargo risk, event history,
  reconnect status, and accessible text equivalents.
- **Depends on:** CP-08 through CP-11.
- **Acceptance:** Canvas renders snapshots at up to 60 FPS, interpolates remote actors, reconciles local
  input, and never decides world state. The dashboard explains mission, cargo, death cause, respawn,
  and next valid action.
- **Verify:** Browser smoke, keyboard path, reduced-motion/accessibility check, stale snapshot message,
  and manual two-player observation.

### CP-13 — page-bound WebMCP tools (`PLANNED; CAPABILITY GATE`)

- **Scope:** Register `inspect_shelter_state`, `inspect_missions`, `inspect_mission_history`, and one
  bounded `force_recall_soldier` tool from the canonical page. Validate ownership, revision,
  idempotency, current state, and unsupported capability behavior.
- **Depends on:** CP-12 and CP-02.
- **Acceptance:** Human UI remains usable without WebMCP; tool results include current version, effect,
  and typed failure; a stale or cross-shelter call cannot mutate state.
- **Verify:** Real page registration/readback, schema-negative cases, stale revision, duplicate key,
  and human-boundary review.

### CP-14 — outbox to Re-entry Core (`PLANNED; COMPETITION GATE`)

- **Scope:** Map `CargoLostToMonster` to one typed outbox event, preserve the opaque binding, deliver
  through the existing Receiver boundary, return to the canonical page, reread current state, and
  execute the bounded recall action under the existing grant when the current revision permits it.
- **Depends on:** CP-05, CP-11, and CP-13.
- **Acceptance:** Delivery is at-least-once but domain effect is exactly-once; event contains causal
  history without prompts or credentials; Agent context cannot replace page state; human review remains
  required for migration, siege, and destructive actions.
- **Verify:** Separate-process delivery, duplicate delivery, delayed page return, missing capability,
  stale revision, and a visible committed or typed-rejected command result.

## Phase 5 — local verification and demo closure

### CP-15 — contract, race, and failure matrix (`PLANNED`)

- **Scope:** Test positive, malformed, unauthorized, stale, duplicate, replay, timeout, crash,
  unsupported-capability, and boundary cases across clock, cargo, combat, identity, WebSocket, and
  WebMCP.
- **Depends on:** CP-05 through CP-14.
- **Acceptance:** Every known cross-boundary risk in `Validation/03-roadmap-gap-audit.md` has either a
  passing test or an explicit documented open decision outside G2.
- **Verify:** Focused unit/contract tests, transitive repository validators, sensitive scan, and
  separate-process recovery tests.

### CP-16 — local vertical slice and judge rehearsal (`PLANNED; G2 GATE`)

- **Scope:** Run the complete scripted story with two players: assign gatherer, close page, advance
  world, lose cargo to the monster, respawn, receive Re-entry, return to page, inspect history, and
  force recall. Include worker restart and reconnect.
- **Depends on:** CP-15.
- **Acceptance:** Same seed and commands produce the same event order; browser absence does not pause
  the world; the dashboard explains every transition; all G2 exit criteria pass without manual state
  edits.
- **Verify:** Clean fixture reset, timestamped trace, browser recording or equivalent evidence, and
  redacted event history.

## Phase 6 — hosted continuity and submission proof

### CP-17 — hosted always-on deployment (`PLANNED`)

- **Scope:** Select a host that keeps the Node worker alive, configure durable hosted storage, health
  checks, restart policy, safe environment configuration, and a stable canonical page URL.
- **Depends on:** CP-16 and the separate host decision.
- **Acceptance:** The worker survives ordinary process restart, hosted state persists, the page and
  worker use the same world, and no serverless-only timer owns world time.
- **Verify:** Actual endpoint, process health, deployment logs, database persistence, restart catch-up,
  and command ownership checks.

### CP-18 — hosted judge reproduction and submission package (`PLANNED; G3 GATE`)

- **Scope:** Rehearse the demo from a clean identity, collect architecture diagram, causal timeline,
  capability result, recovery receipt, screenshots, and known limitations.
- **Depends on:** CP-17.
- **Acceptance:** A reviewer can reproduce the two-player event-to-page chain without private context;
  claims separate local, hosted, runtime, and judge evidence; the human consequence boundary is clear.
- **Verify:** Clean-browser run, independent readback, redacted artifacts, and submission checklist.

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
- [`../Validation/03-roadmap-gap-audit.md`](../Validation/03-roadmap-gap-audit.md) — unresolved design,
  logic, and operational decisions surfaced by this roadmap; and
- [`../Validation/04-mvp-decision-proposals.md`](../Validation/04-mvp-decision-proposals.md) — accepted
  defaults, UX chain contracts, and contract revision checklist.
