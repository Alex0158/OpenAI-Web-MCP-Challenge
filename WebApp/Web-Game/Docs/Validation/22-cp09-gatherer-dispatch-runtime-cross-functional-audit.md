# CP-09 Gatherer Dispatch Runtime Cross-Functional Audit

## Review control

- Status: `COMPLETE; BOUNDED LOCAL DISPATCH RUNTIME VERIFIED`
- Date: 2026-09-02
- Scope: `SK-TASK-027`, schema-v3 migration, server-owned GATHERER dispatch, route/home-anchor handoff, role/loadout lock, and worker-gateway integration
- Contract: [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md)
- Decisions: [`../Decisions/ADR-GAME-0018-cp09-mission-dispatch-and-role-lock.md`](../Decisions/ADR-GAME-0018-cp09-mission-dispatch-and-role-lock.md), [`../Decisions/ADR-GAME-0015-cp08-worker-command-read-gateway.md`](../Decisions/ADR-GAME-0015-cp08-worker-command-read-gateway.md), and [`../Decisions/ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md`](../Decisions/ADR-GAME-0013-cp08-player-position-and-exploration-persistence.md)
- Task: [`../Tasks/SK-TASK-027-cp09-gatherer-dispatch-and-role-lock.md`](../Tasks/SK-TASK-027-cp09-gatherer-dispatch-and-role-lock.md)
- Evidence: [`../Evidence/SK-EVID-016-cp09-gatherer-dispatch-runtime-verification.md`](../Evidence/SK-EVID-016-cp09-gatherer-dispatch-runtime-verification.md)
- Preparation: [`21-cp09-gatherer-dispatch-preimplementation-challenge.md`](21-cp09-gatherer-dispatch-preimplementation-challenge.md)

## Verdict

The registered CP-09 increment is coherent and passes its bounded local runtime proof. A resident
GATHERER command enters the existing worker FIFO, resolves the owner and fixture target on the server,
derives a deterministic open-grid route and current home anchor, and commits the soldier transition,
mission row, mission-attempt row, causal event, and idempotency result in one SQLite transaction. A
field reassignment is visibly rejected as `ROLE_LOCKED`. Schema 1 and schema 2 databases migrate to
schema 3 (`cp09-001`) without changing `SK-MVP-0.2`.

This is a local ladder-level-4 process proof. It does not claim soldier travel, extraction, cargo,
return, recall, settlement, combat, browser presentation, WebMCP, Re-entry, production identity, or
hosted continuity.

## 1. End-to-end business chain

```text
human/Agent-shaped assign_soldier_mission input
-> WorkerCommandGateway ready admission and FIFO capture
-> MissionService binding and player ownership check
-> shelter and soldier ownership/state check
-> persisted G2 fixture target/resource/sensing check
-> role/tool/tier matrix check
-> deterministic mission and attempt identity
-> deterministic route and home-anchor plan
-> PersistenceStore BEGIN IMMEDIATE
-> idempotency replay-or-new check
-> server binding/target quantity/revision/role-lock recheck
-> soldier FIELD mutation
-> mission + mission_attempt ACTIVE/TRAVELLING insert
-> world cursor + MissionDispatched event
-> committed idempotency result
-> full typed result or rollback and rejected idempotency diagnostic
```

The route remains `PLANNED`; it is a durable handoff for a later worker milestone. No world clock
advance, movement step, node decrement, cargo row, coin, combat encounter, Signal, or Agent action is
created.

## 2. Cross-functional boundary review

| Surface | Verified disposition | Residual handoff |
|---|---|---|
| Persistence/schema | First-run schema contains CP-09 fields. Schema-1 and schema-2 migrations add missing columns inside one transaction and update metadata to `3/cp09-001`. Parsers reject malformed route or enum data with `RECOVERY_REQUIRED`. | Future schema changes must preserve the migration chain and historical rows. |
| State/event atomicity | `BEGIN IMMEDIATE` covers soldier revision mutation, mission/attempt inserts, cursor allocation, event append, and idempotency result. Any later failure rolls back the complete assignment. | CP-10/11 must use the same transaction boundary for extraction and combat settlement. |
| Identity and ownership | Player binding is checked before fixture lookup; shelter owns the soldier and event visibility; target ownership and type come from the server fixture; the client cannot submit route or coordinates. | Production identity issuance and non-fixture intelligence remain later gates. |
| Soldier lifecycle | `AT_SHELTER -> FIELD` is the only lifecycle change. Stable `soldier_id` remains the roster identity; `mission_attempt_id` is fresh per command. | Return, death, respawn, and reissue must reuse these rows and revisions. |
| Mission phase | New mission and attempt are `ACTIVE`/`TRAVELLING`; phase is separate from lifecycle. No timer or traversal is implied by the planned route. | The next CP-09 increment owns due milestones, work, return, and recall. |
| Role/loadout | G2 accepts only `GATHERER` with tier-one Wood→AXE or Rock→PICKAXE. A field soldier cannot change role/tool; passive encounters cannot equip a new tool. | Hunter and later loadout tiers require their own matrix and tests. |
| Navigation | The server uses the fixture shelter anchor, target coordinate, map fingerprint, and deterministic x-then-y Manhattan waypoints. Route validation rejects teleporting or non-adjacent plans. | Terrain, moving anchors, traversal, replanning, and blocked-route review remain open. |
| World clock | Dispatch uses the current persisted integer time and does not advance it. The timestamp is copied to start/last-transition fields. | Scheduler cadence and downtime recovery must settle later mission phases under CP-06 order. |
| Worker/gateway | The default `WorldWorkerModule` composes one `MissionService` into the existing FIFO gateway. Missing capability is typed `MISSION_UNAVAILABLE`; worker lifecycle admission is preserved. | Entrypoint/WebSocket/WebMCP command wiring remains later surface work. |
| Snapshot/UI | Existing soldier projections continue to expose state, role, and tool. Mission history and route dashboard data are durable but not yet projected to the browser. | CP-12 will add mission rows, cargo risk, next action, and accessible status. |
| WebMCP/Re-entry | No page tool, Signal, Receiver, Connector, prompt, or Thread message is emitted. The command shape is compatible with the future page boundary but not registered there. | CP-13/14 must reread current state and enforce the same idempotency/revision checks. |

## 3. Failure, duplicate, stale, and race matrix

| Case | Expected invariant | Runtime disposition |
|---|---|---|
| Missing world or soldier | No fixture or partial state; typed not-found failure. | Covered by service/store guards; no rows are inserted. |
| Wrong binding or cross-shelter soldier/target | No scope disclosure or assignment; `OWNERSHIP_DENIED`. | Passed. |
| Missing/empty/out-of-sensing target | No route, mission, event, or soldier change; `TARGET_UNAVAILABLE`. | Missing target passed; quantity and sensing predicates are implemented and ready for CP-10 tests. |
| Wrong resource tool or tier | No assignment; `TOOL_INCOMPATIBLE`. | Wood/Rock matrix passed. |
| Stale soldier revision | No newer state is overwritten; `STALE_REVISION` is recorded and replayed for the same key. | Passed. |
| Field role/tool change | Current role, tool, target, route, and attempt remain unchanged; `ROLE_LOCKED`. | Passed. |
| Duplicate committed key | Original result and IDs return with `duplicate = true`; no second rows/event/cursor. | Passed. |
| Duplicate rejected key | Original typed failure returns; no state or event appears. | Passed. |
| Two commands race for one soldier | FIFO and transaction/revision checks allow one assignment only. | Passed with concurrent gateway submissions. |
| Event/row insertion failure | Soldier, mission, attempt, cursor, event, and idempotency state roll back together. | Transaction structure and focused atomic path pass; later settlement tasks must retain this proof. |
| Restart after dispatch | Durable rows and event remain available to the next store instance. | Schema and file-backed predecessor aggregate pass; mission-specific restart read is a later targeted case. |

## 4. Findings and disposition

| Severity | Finding | Disposition |
|---|---|---|
| P2 | Mission rows are not in `client_snapshot`; a user cannot yet see route/phase history in the page. | Correctly deferred to CP-12 projection/dashboard work; durable server rows already preserve the handoff. |
| P2 | Route traversal and target extraction are not scheduled by dispatch. | Deliberate scope boundary. The route is a plan, and a later CP-09 task must add worker milestones before claiming arrival or yield. |
| P2 | Fixture ownership/type validation occurs in `MissionService`, while the store rechecks target existence/quantity and shelter binding. | Safe for the current single gateway and non-extracting fixture. Reopen CP-10 if concurrent target mutation is introduced; move the complete owner/type/quantity predicate into the settlement transaction. |
| P3 | Legacy mission-attempt rows migrated from schema 1/2 have terminal phase and nullable route metadata because their historical route was never persisted. | Safe recovery representation; new dispatches always write complete route/home-anchor data. Do not treat legacy rows as active missions. |

No finding blocks closure of the registered local assignment task. The residual items are explicit
handoffs and do not weaken server authority, idempotency, or the player-visible failure boundary.

## 5. Closure disposition

`SK-TASK-027` closes as `runtime_verified` for the schema-v3 migration, one server-owned GATHERER
dispatch, deterministic route/home-anchor handoff, atomic mission/attempt/event/idempotency state,
and field role-lock rejection. The CP-09 checkpoint remains open for traversal, extraction, return,
recall, and terminal mission work; the next task must be registered with its own challenge and ADR
when that boundary is selected.
