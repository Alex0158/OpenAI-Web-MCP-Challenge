# CP-10 to CP-18 Pre-Implementation Cross-Functional Audit

**Role:** Critical-path preparation review for economy, combat, presentation, WebMCP, Re-entry, local closure, hosted continuity, and judge reproduction  
**Status:** PRE-IMPLEMENTATION REVIEW COMPLETE; runtime implementation remains unverified  
**Date:** 2026-09-02  
**Scope:** CP-10 through CP-18 and their interfaces with CP-05 through CP-09, the external Re-entry Core, the host, and the RightSpot comparison  
**Contract:** [MVP contract sheet](../Engineering/09-mvp-contract-sheet.md)  
**Earlier preparation:** [CP-08/09 preparation audit](09-cp08-cp09-preimplementation-audit.md)  
**Expansion preflight:** [CP-19/26 post-G2 preflight](11-cp19-cp26-post-g2-preflight.md)

## 1. Purpose and verdict

This audit prepares each remaining critical-path checkpoint before implementation. It challenges the
authority, identity, settlement, presentation, capability, external handoff, verification, hosting,
and submission boundaries so that later work can use the accepted G2 contract without inventing
parallel rules.

The preparation is useful while CP-05 remains active in the primary thread. It creates one bounded
task and one scenario fixture for each CP-10 through CP-18 checkpoint. It does not claim that any
runtime, browser, WebMCP, Receiver, Connector, hosted, or judge path is working.

The critical path remains:

~~~text
CP-05 durable state and event history
  -> CP-06 clock and recovery
    -> CP-07 deterministic world and identities
      -> CP-08 movement and projections
        -> CP-09 mission and role lock
          -> CP-10 economy
            -> CP-11 monster combat and respawn
              -> CP-12 Canvas and dashboard
                -> CP-13 page WebMCP
                  -> CP-14 Re-entry adapter
                    -> CP-15 contract and race matrix
                      -> CP-16 local vertical slice
                        -> CP-17 hosted continuity
                          -> CP-18 judge reproduction
~~~

The recommended posture is:

1. Keep the server worker authoritative for positions, missions, cargo, combat, settlement,
   projections, and world time.
2. Keep each checkpoint responsible for one boundary and one consumer. CP-10 owns extraction and
   deposit; CP-11 owns encounter/combat/death; CP-12 owns presentation; CP-13 owns page capability;
   CP-14 owns only the game-side external adapter; CP-15 owns aggregate proof; CP-16 through CP-18
   own evidence and operations.
3. Reuse the accepted event, revision, idempotency, snapshot, and signal vocabulary. Do not add a
   new event, command, state, or contract version inside a preparation record.
4. Treat every external or production value as an open gate until the exact runtime, host, or
   handoff evidence exists.

## 2. Cross-checkpoint authority map

| Checkpoint | Primary authority | Required predecessor | Main consumer after it | Preparation result | Not proven |
|---|---|---|---|---|---|
| CP-10 | Resource extraction, cargo, deposit, and ordinary coin settlement | CP-09 and CP-05 | CP-11, CP-12, CP-22 | Atomic economy vectors and ledger boundaries | A node, cargo, or wallet runtime |
| CP-11 | Monster state, contact, combat, cargo loss, respawn, and bounded reissue | CP-10 and CP-08 | CP-12, CP-14, CP-19 | Deterministic PvE vectors and death handoff | A combat round or seeded encounter |
| CP-12 | Canvas projection, React controls, dashboard, accessibility, visual asset binding | CP-08 through CP-11 | CP-13, CP-14, CP-16 | Presentation/read-model fixtures and performance guard | A browser render or 60 FPS result |
| CP-13 | Page-bound WebMCP registration and permission-checked tool adapter | CP-12 and CP-02 | CP-14 and CP-16 | Capability and human-boundary vectors | Genuine current-session tool invocation |
| CP-14 | Game-side outbox/signal adapter; external Receiver/Connector remain external | CP-05, CP-11, CP-13 | CP-16, CP-17, CP-18 | Handoff, coalescing, and backpressure fixtures | Live external delivery |
| CP-15 | Aggregate contract, race, failure, restart, and capability verification | CP-05 through CP-14 | CP-16 | Coverage and reopen matrix | Complete suite or runtime chain |
| CP-16 | Local two-player causal slice and evidence trace | CP-15 | CP-17, CP-18 | Clean-reset demo and evidence vectors | A complete local slice |
| CP-17 | Hosted process, storage, health, restart, and canonical URL | CP-16 plus host decision | CP-18 | Host preflight and failure vectors | A hosted endpoint or always-on claim |
| CP-18 | Clean-identity judge reproduction and submission evidence | CP-17 | Submission decision | Reproduction and claim-boundary pack | Independent judge reproduction |

## 3. Shared invariants

These invariants apply to every section below:

- One worker owns world time and every state-changing effect. A browser, Canvas frame, WebMCP call,
  Receiver, Connector, or host scheduler cannot create a second authority.
- One transaction writes an authoritative mutation, its Domain Event, and any eligible delivery record.
- Every command that changes existing state carries expected entity revisions and an idempotency key.
- Every committed event keeps world identity, causal order, entity revision, typed payload, and visibility
  scope; projections and Agent Signals never replace the event log.
- Field cargo remains exposed until a successful shelter deposit. No checkpoint can silently convert,
  duplicate, or erase it.
- Reconnect replaces stale projection state with a full current snapshot before new commands are
  accepted. A missing capability is visible and cannot be presented as successful.
- Runtime, hosted, and judge claims are separate closure levels. A document or local test plan is not
  evidence for the next level.

## 4. CP-10 economy Challenge and design

### Objective

Make Wood and Rock extraction, five-slot cargo, automatic return, deposit, and coin conversion
deterministic and exactly-once while preserving the mission, route, combat, and restart boundaries.

### Accepted inputs

- Five equal-weight cargo slots, one unit every two world seconds, and 20 units per node.
- Wood deposits for one coin per unit; Rock deposits for three coins per unit.
- A node decrement and cargo increment commit together.
- Capacity, target depletion, and recall change return intent; only the shelter deposit changes
  shelter-held value.
- A failed or duplicate deposit cannot create a second coin or remove cargo twice.

### Cross-functional consequences

CP-09 provides the locked role, tool, target, route, return policy, mission attempt, and revisions.
CP-08 provides authoritative arrival. CP-11 may destroy or transfer exposed cargo before deposit.
CP-12 must show cargo risk and deposit history. CP-14 can later surface CargoLostToMonster but cannot
credit or restore cargo. CP-22 may extend tool yield and capacity only through a later contract.

### Chosen preparation route

Use one ledger boundary with explicit cargo ownership and one deposit transaction. Keep node
reservation, weighted cargo, crafting, gold, and production multipliers open. Test same-time capacity,
depletion, contact, death, deposit, and restart ordering against CP-06's due-work order rather than
creating an economy-specific clock.

### Failure modes challenged

| Failure | Required prevention |
|---|---|
| Two due workers extract the same final unit | Claim node revision and mission revision atomically |
| Duplicate extraction retry | Reuse the milestone/event identity and return the stored result |
| Capacity is exceeded by a final extraction | Apply the accepted five-slot boundary once; expose a partial final result |
| Coin appears in the field | Keep wallet credit inside the shelter deposit transaction |
| Deposit is retried after a crash | Idempotent deposit identity and cargo revision prevent double credit |
| Combat and deposit race | CP-06 order settles a valid home crossing before field danger |
| Stale tool or role is used | Read the committed mission loadout, never the browser selection |
| Node respawn rewrites another world | Scope node and timer state by world identity |

### Open gates

Exact cargo row shape, partial extraction representation, concurrent node contest behavior,
reservation policy, tool-tier yield values, and future overflow rules remain open. Do not promote any
of them to the G2 contract without an owner decision and settlement tests.

### Entry and verification gate

Start CP-10 only after CP-09 has a verified mission attempt and CP-05/06 provide durable due work.
The first increment proves one extraction and one deposit, then capacity/depletion and duplicate
settlement. The task and scenario are [SK-TASK-010](../Tasks/SK-TASK-010-cp10-economy-preimplementation-pack.md)
and [Scenario 10](../Scenarios/10-cp10-economy-fixtures.md).

## 5. CP-11 combat Challenge and design

### Objective

Make the seeded monster, detection-to-contact lock, deterministic PvE combat, exposed-cargo loss,
same-identity respawn, and one-budget mission reissue explainable and replayable.

### Accepted inputs

- The seeded monster remains in its normal state machine after killing a soldier.
- Contact uses the inclusive engagement radius and one resolving encounter per participant.
- One combat round settles per integer world second with initiative speed and entity-id tie-break.
- Damage uses the accepted formula and fixed G2 actor/loadout values.
- A monster death destroys only unbanked field cargo; it does not award a killer reward or create a
  third resource.
- Ordinary death records a terminal attempt, respawns the same soldier identity, and permits one
  bounded danger-cell reissue for repeatable gathering/hunting.

### Cross-functional consequences

CP-08 supplies positions, routes, sensors, and walkability. CP-09 supplies role/tool and mission
attempt context. CP-10 supplies cargo state and deposit boundary. CP-12 must show formula inputs and
cause. CP-14 treats CargoLostToMonster as the only G2 eligible continuation event. CP-19 may reuse
the encounter/loot identity later, but cannot change the G2 monster rule in place.

### Chosen preparation route

Keep contact, combat, cargo settlement, death, and reissue as separate linked transitions in the
accepted due-work order. Use deterministic inputs and no random roll. Preserve the encounter and
settlement ids in every round and terminal event. Make the seeded route a fixture target that must be
validated, not a new monster AI rule.

### Failure modes challenged

| Failure | Required prevention |
|---|---|
| A participant is resolved by two encounters | Atomic encounter claim with participant revisions |
| Contact and extraction settle in the wrong order | Reuse CP-06 phase order and lock contact before extraction |
| Cargo is both lost and deposited | One settlement transaction owns the cargo revision |
| Respawn creates a second roster member | Reuse stable soldier identity and terminal attempt history |
| Reissue loops after repeated death | Consume one budget and enter typed WAITING_REVIEW |
| Monster death removes or rewards the wrong entity | Separate MonsterDefeated from CargoLostToMonster |
| Formula inputs cannot be explained | Record role, tool, stats, initiative, round, damage, and remaining HP |
| A stale command changes the reissued attempt | Require attempt id and current entity revisions |

### Open gates

Exact encounter lock payload, route proof timing, HP reset timing, monster post-kill transition,
reissue milestone scheduling, future randomness, and PvP/party modifiers remain open.

### Entry and verification gate

Start CP-11 only after CP-10 extraction/deposit and CP-08 sensor/route seams are verified. First
prove the gatherer-loss and hunter-win traces separately, then same-time ordering, duplicate
settlement, respawn, and bounded reissue. See [SK-TASK-011](../Tasks/SK-TASK-011-cp11-combat-preimplementation-pack.md)
and [Scenario 11](../Scenarios/11-cp11-combat-fixtures.md).

## 6. CP-12 presentation Challenge and design

### Objective

Present the authoritative projection as a fluent Starve.io-inspired minimal web game while keeping
Canvas and React as replaceable consumers rather than state owners.

### Accepted inputs

- Canvas 2D renders terrain, fog, nodes, shelters, visible actors, routes, and lightweight effects.
- React/HTML owns HUD, mission rows, event history, controls, capability state, and accessible text.
- The browser may interpolate at up to 60 FPS but cannot resolve combat, reveal hidden cells, credit
  coins, or rewrite revisions.
- Visual asset IDs and state labels remain stable; placeholders are allowed and final art is optional.
- Stale/reconnecting state and missing WebMCP capability are visible.

### Cross-functional consequences

CP-08 defines snapshot scope, position, visibility, and reconnect. CP-09 through CP-11 define the
mission, cargo, combat, and death records shown in the dashboard. CP-13 depends on a canonical page
that remains usable without WebMCP. CP-14 needs a page that can be reopened and read. CP-16 needs
evidence that a human can complete the story without private Agent context.

### Chosen preparation route

Start with one snapshot-to-Canvas frame, one mission row, and one text-equivalent status panel.
Use the stable visual asset vocabulary and geometric placeholders. Add interpolation and optional VFX
only after authoritative reconciliation works. Keep the first performance check measurable rather than
promising a permanent 60 FPS target.

### Failure modes challenged

| Failure | Required prevention |
|---|---|
| Canvas treats prediction as authority | Reconcile every accepted projection and disable state mutation in render code |
| Hidden state leaks through artwork or labels | Render only the player-scoped projection |
| A dropped frame freezes the world | Mark stale/reconnecting and request full resync |
| Mission row invents a role or phase | Render canonical values and typed next action |
| Missing asset blocks the demo | Deterministic placeholder for every required state |
| VFX hides a death or loss | Pair effects with text/event history and support reduced motion |
| A DOM node per actor harms fluidity | Use Canvas for repeated world actors and measure draw cost |

### Open gates

Final snapshot rendering shape, camera smoothing, atlas cell size, reduced-motion details, exact
accessible text mapping, and performance budgets remain implementation choices or visual follow-up
decisions.

### Entry and verification gate

Start CP-12 after CP-08 through CP-11 expose stable projections and causal read models. First verify
browser smoke, keyboard path, mission/status readability, stale snapshot recovery, and reduced motion.
See [SK-TASK-012](../Tasks/SK-TASK-012-cp12-canvas-dashboard-preimplementation-pack.md) and
[Scenario 12](../Scenarios/12-cp12-canvas-dashboard-fixtures.md).

## 7. CP-13 page capability Challenge and design

### Objective

Register a small, genuine page-bound WebMCP surface that exposes the same permission-checked reads
and bounded recall action available to a human, while remaining visibly usable when the capability is
unsupported.

### Accepted inputs

- Candidate tools are inspect_shelter_state, inspect_client_snapshot, inspect_missions,
  inspect_mission_history, and force_recall_soldier.
- Tools call the same entrypoint-owned command/read gateway as the human page.
- Ownership, contract version, entity revisions, role lock, idempotency, and current recovery state
  are validated at invocation.
- Tool results include current version, effect or read value, event id when applicable, and typed
  failure.
- Migration, siege, destructive upgrades, and other high-consequence actions remain outside the
  bounded Agent action.

### Cross-functional consequences

CP-12 provides the canonical page and readable fallback. CP-09 provides mission/role restrictions.
CP-10/11 provide state and event outcomes. CP-14 consumes the tool result after fresh page reread.
CP-02's capability probe remains evidence for support, not proof of the final registered surface.

### Chosen preparation route

Implement reads first, then one bounded force_recall_soldier action. Keep registration lifecycle
page-bound and current-session observable. Treat an unavailable document.modelContext or tool discovery
as a visible capability state, never as permission to emulate WebMCP silently.

### Failure modes challenged

| Failure | Required prevention |
|---|---|
| Tool trusts Agent-supplied owner or position | Bind the call to the current session and shelter |
| Stale mission is recalled | Validate mission attempt and entity revisions |
| Duplicate tool delivery doubles return | Reuse command idempotency key and result |
| Hidden data appears in a read | Apply player visibility scope before serialization |
| WebMCP is unavailable but UI claims success | Show unsupported state and keep human controls usable |
| Tool bypasses human boundary | Restrict the tool list and return a reviewable boundary |
| Page bundle starts a second worker | Use the CP-04 entrypoint gateway only |

### Open gates

Final JSON schemas, registration timing, tool discovery readback in the target browser, error-to-UI
mapping, grant scope, and whether a read tool exposes event ranges remain open until the page runtime
exists.

### Entry and verification gate

Start CP-13 after CP-12 has a canonical page and CP-02 capability is rechecked. Verify real
registration/readback, schema-negative cases, ownership, stale revision, duplicate key, unavailable
capability, and the human boundary. See [SK-TASK-013](../Tasks/SK-TASK-013-cp13-webmcp-preimplementation-pack.md)
and [Scenario 13](../Scenarios/13-cp13-webmcp-fixtures.md).

## 8. CP-14 Re-entry Challenge and design

### Objective

Connect the game's durable outbox to the existing Re-entry Core boundary for one coalesced
CargoLostToMonster signal, without modifying the external Receiver, Local Connector, or Codex Thread
behavior.

### Accepted inputs

- CargoLostToMonster is the only G2 continuation-eligible event.
- Domain Events remain durable; Agent Signals are derived delivery envelopes.
- At most one signal is pending or in flight per binding and shelter; later events merge.
- The accepted 60-world-second cooldown limits new wake creation, not event retention.
- A running Thread receives no per-event message; the world never waits for Agent action.
- Re-entry returns to the canonical page, rereads current state, and may execute bounded recall only
  under the live grant and revisions.

### Cross-functional consequences

CP-05 provides event/outbox identity and cursor; CP-11 creates CargoLostToMonster; CP-13 exposes the
bounded page action. CP-16 needs one exact causal trace. The external Receiver and Local Connector
belong to Eddy and are not editable in this game task.

### Chosen preparation route

Prove the game-side signal selector, coalescing slot, deferred cursor, at-least-once retry, and
acknowledgement/typed-failure adapter with a local contract stub first. Do not call a stub live
integration proof. Wait for the external versioned handoff before binding endpoints or changing payload
semantics.

### Failure modes challenged

| Failure | Required prevention |
|---|---|
| Every combat event wakes the Thread | Eligibility filter and one coalescing slot |
| Duplicate Receiver delivery repeats game state | Stable signal identity and game-side acknowledgement record |
| Thread is flooded while active | Hold merged context until safe turn boundary |
| Cooldown drops causal history | Retain every Domain Event; use the deferred cursor only for events arriving after an active delivery has been handed off |
| Signal includes prompts, credentials, or hidden map data | Typed opaque envelope only |
| Late Agent recall affects a later mission | Fresh page read and attempt/revision validation |
| External contract drift is hidden | Versioned handoff and explicit stop gate |
| WebMCP is unavailable after re-entry | Visible typed failure and human fallback |

### Open gates

Receiver endpoint/transport/version, acknowledgement and retry semantics, binding identity, exact
signal payload, Thread scheduling behavior, and live capability readback remain external or open.

### Entry and verification gate

Start game-side CP-14 after CP-05, CP-11, and CP-13 are verified. Before external handoff, claim
only adapter contract verification. After handoff, add an exact-version delivery trace and separate
local/hosted evidence. See [SK-TASK-014](../Tasks/SK-TASK-014-cp14-reentry-adapter-preimplementation-pack.md)
and [Scenario 14](../Scenarios/14-cp14-reentry-adapter-fixtures.md).

## 9. CP-15 verification Challenge and design

### Objective

Turn every known G2 cross-boundary risk into a repeatable positive, negative, boundary, failure, or
replay check without adding production behavior or declaring a passing test to be runtime proof.

### Accepted inputs

- Contract and race checks cover world time, identity, revisions, idempotency, cargo, combat,
  snapshots, WebSocket behavior, WebMCP, and Re-entry backpressure.
- Process restart and browser absence are mandatory transitive cases.
- Repository and game documentation validators, sensitive scans, and focused runtime tests retain
  their distinct claim limits.
- External capability or hosted tests are gated and cannot be marked passed by a stub.

### Cross-functional consequences

CP-15 may expose a contradiction that reopens an earlier task or ADR. It must not patch a failing
test with a second authority or weaken a state boundary. CP-16 consumes the stable matrix and records
which cases were executed. CP-17/18 consume only the evidence levels actually reached.

### Chosen preparation route

Build a coverage matrix keyed by contract section, mechanism, chain, identity, failure code, and
checkpoint. Run focused checks first, one aggregate when due, and record intentionally unexecuted
external tests. Keep network simulation and fake clocks as test instruments only.

### Failure modes challenged

| Failure | Required prevention |
|---|---|
| A test passes the wrong layer | Record ladder level and exact claim |
| Duplicate effect is untested | Pair every mutation with duplicate key/event delivery |
| Race is nondeterministic | Use fixed clock, revisions, and event order |
| External stub is mistaken for live proof | Mark gated and preserve handoff requirement |
| Aggregate reruns hide a regression | Reopen only on an executable shared-contract trigger |
| Sensitive data enters evidence | Redact and run the sensitive scan |
| A failing test reveals a contract conflict | Stop, reconcile owner docs, and reopen the decision |

### Open gates

Final test runner/coverage threshold, network fixture implementation, browser recording method,
external adapter availability, and exact aggregate command remain implementation and operations
choices.

### Entry and verification gate

Start CP-15 only after CP-05 through CP-14 have stable task records and no unresolved authority
contradiction. Verify the matrix itself, then focused and transitive checks. See
[SK-TASK-015](../Tasks/SK-TASK-015-cp15-contract-race-verification-preimplementation-pack.md) and
[Scenario 15](../Scenarios/15-cp15-contract-race-verification-fixtures.md).

## 10. CP-16 local slice Challenge and design

### Objective

Prove the complete local G2 story with two players, a disconnected browser, durable world progress,
monster cargo loss, same-identity respawn, one coalesced continuation, page reread, bounded recall,
restart, and visible late outcomes.

### Accepted inputs

The scripted story is the contract-sheet gatherer-loss trace. It starts from a clean fixture reset,
uses the seeded Wood/Rock world, records all causal events, and ends with a typed action result or a
committed recall. It must work through the ordinary human UI even when WebMCP is unavailable.

### Cross-functional consequences

CP-16 is the first slice that can expose a real conflict between CP-05 through CP-14. A demo shortcut,
manual database edit, or hidden test-only flag invalidates the claim. CP-17 cannot call a local trace
hosted proof; CP-18 cannot call a developer walkthrough judge proof.

### Chosen preparation route

Prepare a timestamped, redacted trace schema and clean-reset runbook. Execute the deterministic
gatherer-loss path, hunter contrast, reconnect/restart, event burst, stale recall, and unsupported
capability branches as separate evidence paths. Preserve exact source identity and fixture seed.

### Open gates

Browser recording, external delivery readiness, timing tolerance, evidence storage, clean identity,
and the final demo reset policy remain open.

### Entry and verification gate

Start CP-16 only after CP-15 has passed the required local matrix. Verify a clean reset, two sessions,
world continuation while closed, full reconnect snapshot, event history, signal coalescing, page
reread, recall result, restart parity, and no manual state edits. See
[SK-TASK-016](../Tasks/SK-TASK-016-cp16-local-vertical-slice-preimplementation-pack.md) and
[Scenario 16](../Scenarios/16-cp16-local-vertical-slice-fixtures.md).

## 11. CP-17 hosted continuity Challenge and design

### Objective

Select and prove a host that keeps the world worker alive, stores durable state, serves the canonical
page and realtime channel, exposes health, and recovers the same world after a process restart.

### Accepted inputs

The host must preserve server authority, durable world time, event history, snapshot, outbox state,
and command ownership. A serverless-only timer cannot own the world. Health and process readiness
remain distinct from world readiness until persistence is loaded.

### Cross-functional consequences

CP-17 depends on a verified local slice and a separate host decision. It may require PostgreSQL or
another durable store, but it cannot silently replace the local contract. CP-13/14 capability and
external transport must be tested at the hosted URL if the judge path depends on them.

### Chosen preparation route

Prepare a host comparison and go/no-go checklist, environment variable inventory without secrets,
health readback fields, restart/catch-up trace, and rollback path. Keep the local process topology
small until a measured hosted need justifies a split.

### Failure modes challenged

| Failure | Required prevention |
|---|---|
| Host sleeps between events | Use a worker process with host supervision and prove continuity |
| Page and worker use different worlds | Read back world identity and event cursor from both |
| Deploy loses the database | Verify durable storage and restart replay before calling hosted |
| Realtime upgrade is unsupported | Show a visible capability result and preserve human path |
| Secrets appear in logs or evidence | Redacted environment and health contract |
| Health says ready before world recovery | Separate process and world readiness |
| Rollback creates a second authority | Reuse durable world and explicit deployment state |

### Open gates

Host/provider, data store, websocket support, process supervision, TLS/custom URL, backups, retention,
secret storage, and rollback mechanics remain open until a host is selected and measured.

### Entry and verification gate

Start CP-17 only after CP-16 closure and an explicit host decision. Verify the actual endpoint,
process health, canonical page, durable event/snapshot persistence, restart catch-up, command ownership,
realtime capability, and redacted logs. See [SK-TASK-017](../Tasks/SK-TASK-017-cp17-hosted-continuity-preimplementation-pack.md)
and [Scenario 17](../Scenarios/17-cp17-hosted-continuity-fixtures.md).

## 12. CP-18 judge reproduction Challenge and design

### Objective

Let an independent reviewer reproduce the named hosted two-player event-to-page journey from a clean
identity and assess it using evidence that does not rely on private context or unverified claims.

### Accepted inputs

The package must include the architecture/data-flow diagram, causal timeline, exact hosted URL,
capability result, recovery receipt, screenshots or recording, known limitations, and claim labels.
The human consequence boundary and unsupported capability behavior must be visible.

### Cross-functional consequences

CP-18 cannot repair a product contract, edit hosted state for a demo, or call a successful local
walkthrough hosted evidence. It must report gaps from CP-17, the external Re-entry handoff, or RightSpot
comparison as explicit limitations.

### Chosen preparation route

Prepare a reviewer runbook, clean-browser checklist, artifact manifest, redaction checklist, evidence
claim table, and failure capture format. Rehearse one reviewer path only after the hosted endpoint and
external dependencies have exact versions.

### Open gates

Independent identity, reviewer access, artifact hosting, screenshot/recording method, external
Receiver/Connector availability, submission format, and the final product comparison remain open.

### Entry and verification gate

Start CP-18 only after CP-17 hosted verification and the external handoff required by the named
journey. Verify a clean browser run, independent state readback, restart/reconnect, typed late result,
artifact integrity, and separation of local/hosted/judge claims. See
[SK-TASK-018](../Tasks/SK-TASK-018-cp18-judge-reproduction-preimplementation-pack.md) and
[Scenario 18](../Scenarios/18-cp18-judge-reproduction-fixtures.md).

## 13. Cross-phase decision table

| Decision | Selected preparation rule | Why | Reopen trigger |
|---|---|---|---|
| Economy settlement | One node/cargo/deposit ledger boundary | Protects exactly-once coin creation | Cargo schema or contest policy changes |
| Monster loss | Destroy field cargo, keep normal monster, respawn same soldier | Matches accepted G2 consequence | Combat or breach state changes |
| Presentation | Canvas/React consume projections only | Keeps smooth UI separate from authority | Snapshot or accessibility contract changes |
| WebMCP | Same human command gateway, visible unsupported state | Prevents capability spoofing | Browser capability or page boundary changes |
| Re-entry | Game adapter only; external services stay external | Preserves ownership and handoff clarity | Receiver/Connector contract differs |
| Aggregate proof | Coverage matrix plus claim-level evidence | Avoids green-test overclaim | Verification ladder or suite changes |
| Local slice | Clean reset and scripted causal trace | Makes demo repeatable | Any manual state edit or fixture drift |
| Hosted proof | Durable worker/world with health and restart evidence | Proves continuity rather than deploy success | Host sleep/storage/URL behavior changes |
| Judge proof | Clean identity and evidence manifest | Separates reviewer reproduction from developer context | Submission rule or external dependency changes |

No new ADR is created by this preparation because no accepted authority, state, identity, settlement,
transport, or contract version is changed. If an open gate is later selected in a way that changes
one of those boundaries, record an ADR before implementation.

## 14. Closure and non-goals

This audit and the linked CP-10 through CP-18 task/scenario records close the preparation scope at
specified. They do not close any implementation checkpoint or make a hosted or competition claim.

The package does not implement SQL, the worker, clock, fixture generator, movement, missions,
extraction, combat, Canvas, WebMCP, external Receiver/Connector, deployment, or judge submission.
It does not choose production prices, capacity, terrain, sensor freshness, network budgets, host,
retention, or full-game expansion rules.

Reopen this audit when a predecessor changes the G2 contract, when a task receives runtime evidence
that invalidates a selected assumption, when the external handoff differs, or when a hosted/judge
requirement changes the authority or claim boundary.
