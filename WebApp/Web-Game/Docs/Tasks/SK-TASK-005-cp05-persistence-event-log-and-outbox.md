# SK-TASK-005: CP-05 Durable State, Event Log, and Outbox

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-05`
- Owner: Game owner
- Current increment: CP-05 file-backed SQLite bootstrap, schema metadata, atomic state/event/idempotency/Signal transitions, snapshot recovery, and worker-owned lifecycle are locally runtime-verified.
- Next gate: CP-06 is locally runtime-verified in [`SK-TASK-020`](SK-TASK-020-cp06-clock-and-recovery-implementation.md); CP-07 must consume this store and recovered clock without deriving world time from wall time or browser state.

## Identity

- Task ID: `SK-TASK-005`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: Persistence, event ordering, idempotency, snapshot recovery, and outbox
  coalescing can duplicate or lose cargo, coins, soldiers, events, or continuation effects. A
  wrong schema or transaction boundary would invalidate later world-clock, gameplay, and Re-entry
  evidence even when the page appears healthy.

## Objective

Create the smallest durable local persistence foundation inside the verified CP-04 worker seam:
file-backed SQLite WAL storage, a versioned minimum G2 schema, an append-only Domain Event log,
`world_snapshot` persistence, idempotency records, and coalesced Agent Signal delivery state. Prove
that one transaction can commit or roll back the authoritative state mutation, its command result,
Domain Event, and any eligible outbox record together without advancing world time or inventing
gameplay behavior.

## Success and non-goals

- Success: A file-backed SQLite database opens under the CP-04 worker startup seam with foreign-key
  enforcement, WAL mode, visible schema and contract versions, and a deterministic close path. The
  default local driver is Node.js 24's built-in `node:sqlite`; if the capability is unavailable or
  fails the required WAL/transaction checks, stop and reopen the driver decision rather than adding
  a silent fallback. Raw SQLite paths, SQL, stack traces, and environment values never cross the
  typed/redacted health or lifecycle-log boundary.
- Success: CP-04 reports process `ready` only after the store has opened and passed its schema/contract
  check; that process status does not claim that the world has reached CP-06 `RUNNING`. An open or
  unrecoverable recovery failure remains visibly `degraded` and admits no state-changing work, while
  normal snapshot/event replay may keep the process live with a closed mutation gate and typed
  `RECOVERY_REQUIRED` results until world authority is established. The worker closes the store before
  its stop promise resolves, and late store access fails visibly instead of writing after shutdown has begun.
- Success: A store-close failure is converted into a redacted, typed shutdown result; it cannot
  bypass the CP-04 listener close or leave the process half-drained. Either the worker stop path
  settles after recording the close failure or the entrypoint catches it, and the CP-04 deadline
  remains observable in the focused lifecycle test. A repeated close is idempotent and does not
  reopen the store or create a second shutdown path.
- Success: CP-04 enters `DRAINING` and begins closing the HTTP listener/active connections before it
  awaits worker and store close. A slow or rejected store close therefore cannot keep the listener
  open or admit new work; the complete drain still respects the one bounded deadline.
- Success: The production entrypoint remains the sole shutdown orchestrator. Any start-controller
  helper used by tests shares the same idempotent worker/store close and typed-error semantics and
  cannot create a competing listener or persistence close path.
- Success: The minimum schema represents `world`, `player`, `shelter`, `soldier`, `mission`,
  `mission_attempt`, `cargo`, `resource_node`, `monster`, `encounter`, `world_snapshot`,
  `domain_event`, `idempotency_record`, `outbox_delivery`, `agent_signal_slot`, and a `schema_meta`
  row. `schema_meta` exposes the schema version, contract version, supported event/snapshot versions,
  and migration identifier. The schema preserves the stable identities and revisions in `SK-MVP-0.2`;
  a `client_snapshot` remains a replaceable projection and is not stored as world authority.
- Success: `agent_signal_slot` is the canonical logical coalescing record for one
  `(world_id, shelter_id, opaque_binding)`; it owns the signal summary, deferred cursor, lifecycle
  status, and cooldown state. `outbox_delivery` is a transport-attempt record that references that
  slot and signal identity, owns lease/attempt/outcome metadata, and cannot mutate gameplay state.
  Slot aggregation and delivery acknowledgement use one transaction, so neither table becomes a
  second Signal authority or creates a second `ContinuationDelivered` event.
- Success: The worker-owned `world` state and its durable snapshot retain versioned generation
  metadata (`world_seed`, `generation_version`, and `map_fingerprint`, either as columns or one typed
  payload) when the fixture is created. CP-05 persists and validates these values but does not choose
  the CP-07 seed or generation algorithm; a newer or incompatible generation version refuses recovery.
- Success: Active work needed by CP-06 restart is durable before CP-06 starts: each active mission,
  node, encounter, or monster timer exposes a stable work/milestone identity, `next_due_world_time`,
  claim/attempt identity, bounded wall-time lease metadata when claimed, and the entity revisions
  needed to claim it, either in its current row or in a complete `world_snapshot` scheduler
  projection. Lease expiry is transport/recovery metadata and never advances `world_time`. CP-05 does
  not require a separate `scheduled_milestone` table and CP-06 must not reconstruct due work from a
  browser projection or process memory.
- Success: Every authoritative state, event, snapshot, idempotency, and delivery row is explicitly
  scoped to a `world_id` with foreign-key and ownership checks; repository reads and writes require the
  world scope and cannot accidentally join or mutate another world's history.
- Success: A persistence transaction allocates a per-world monotonic `world_event_cursor`, writes
  the supplied state mutation, command idempotency result, Domain Event, and eligible delivery record
  atomically, and leaves no partial rows after an injected failure. The cursor counter is initialized
  with the world and advanced under the same write transaction; no independent `MAX(cursor)` or
  process-local counter is authoritative. Event payloads and snapshots retain their contract and
  schema versions and reject incompatible input visibly. Only a committed state change consumes a
  cursor; a rejected or idempotent no-op command does not create a gap. Every successful mutation
  advances each affected entity revision exactly once. A transaction may append multiple causally
  ordered Domain Events; each event receives its own cursor and all events commit or roll back together.
- Success: Persistence never derives `world_time` from process, wall, or client time. It stores the
  non-negative integer authoritative time supplied by the worker, rejects a regression against the
  persisted world row with a typed failure, and does not advance the clock autonomously; CP-06 owns
  forward advancement and downtime catch-up under the accepted 300-second recovery budget.
- Success: A bounded busy/locked transaction returns a typed retryable failure with no state, cursor,
  idempotency, event, or outbox partial write; it never blocks the health path indefinitely.
- Success: Each Domain Event row carries the complete section 7 envelope: `event_id`,
  `event_version`, `contract_version`, `event_type`, `world_id`, `world_event_cursor`, `world_time`,
  `causation_id`, command `idempotency_key` when present, `aggregate_type`, `aggregate_id`,
  `aggregate_revision`, `visibility_scope`, and `typed_payload`. A `world_snapshot` carries
  `world_snapshot_id`, `snapshot_version`, `contract_version`, `world_time`,
  `last_world_event_cursor`, and entity revisions.
- Success: When one transition touches multiple entities, the event payload or its causally linked
  event rows retain every affected entity revision needed for deterministic replay and stale-command
  checks; a single primary aggregate header must not hide a changed soldier, cargo, node, shelter, or
  wallet row.
- Success: A snapshot is written atomically with the state/event cursor it summarizes, or with a
  cursor no greater than the last committed event. Replay applies only events after the snapshot
  cursor; a cursor ahead of the event log, a gap, or an incompatible version enters visible
  `RECOVERY_REQUIRED` rather than double-applying or silently skipping history.
- Success: The snapshot payload is a deterministic projection of the committed state at its cursor;
  a snapshot whose state cannot be reconciled with the event history is a visible recovery failure,
  even when its version headers are otherwise compatible.
- Success: Snapshot selection is scoped to `world_id` and uses the newest structurally valid,
  compatible snapshot; a newer incompatible or corrupt candidate enters visible `RECOVERY_REQUIRED`
  rather than being silently skipped. A fixture reset creates a new `world_id` and never deletes or
  rewrites another world's event history in place. Event-log retention is append-only for this task.
- Success: A new world may have an empty event log before its first snapshot; a missing snapshot for a
  world with committed events must either be recovered by a deterministic full replay from the
  declared initial state or enter visible `RECOVERY_REQUIRED`. The implementation must not invent a
  default state during restart.
- Success: A duplicate command with the same world, idempotency key, request fingerprint, and
  binding returns the stored original result. The idempotency key is unique within a world even when
  the binding differs; reusing that key with a different request or binding returns typed
  `DUPLICATE_COMMAND` and has no effect. Duplicate event or signal identities are
  harmless only when their stored envelope matches; a conflicting payload is a visible failure.
  Entity revisions and ownership keys are checked at the repository boundary; a stale revision
  cannot silently overwrite a newer row.
- Success: Each idempotency record retains the scoped request fingerprint, binding, contract version,
  outcome (including a typed rejection), original result envelope, and committed event identity or
  identities needed to return the same result after a retry.
- Success: Routine Domain Events remain in the event log without creating a notification. An eligible
  G2 event is exactly `CargoLostToMonster`; it creates or updates one Signal slot only when the
  owning Re-entry policy supplies an eligible grant, available bounded action, and opaque continuation
  binding. Without that eligibility/binding, the event remains history-only and persistence must not
  invent a wake. Later events
  merge their cursor range, count, severity, latest event, and world time, while a handed-off slot
  accumulates the same summary fields in its deferred cursor. The slot persists
  `pending`/`in_flight`/`acknowledged`/`terminally_rejected` state, lease
  expiry, retry metadata, the accepted 60-world-second cooldown boundary, and the deferred cursor;
  the cooldown boundary is stored and compared in persisted `world_time`, never process wall time;
  delivery lease expiry is measured with `wall_time`/transport time and never advances or gates
  `world_time`;
  retryable failures return to `pending` without changing `signal_id`. An active-slot uniqueness
  rule prevents a second pending or in-flight signal for the same binding and shelter.
  Lease ownership/attempt identity is required for acknowledgement or retry, so a stale lease cannot
  settle a newer attempt. Retries reuse the same signal identity and duplicate delivery is harmless.
  After acknowledgement or terminal rejection, a later eligible event may create a new slot subject to
  the cooldown; while a slot is active, later eligible events merge into it. The cursor range remains a page-read window
  filtered by each event's `visibility_scope` and the bound shelter; the eligible count covers only
  eligible events. When no slot is active and the persisted world time is still inside the cooldown,
  the eligible event remains history-only and is not carried into a later Signal. Cross-player or hidden
  events must never enter a Signal. CP-05 does not contact the
  external Receiver or Codex Thread and stores no prompt, credential, or raw Agent context. Active-slot
  uniqueness is enforced atomically at the database/repository boundary, not by a best-effort read.
- Success: A synthetic successful delivery acknowledgement atomically transitions the delivery state
  and appends `ContinuationDelivered` exactly once with the signal identity and cursor range; retrying
  an already acknowledged or terminally rejected delivery returns its stored outcome without a second
  event or handoff.
- Success: Loading a `world_snapshot` and replaying the persisted event fixture produces the same
  state and event order across a process close and reopen. The test fixture is a persistence reducer,
  not a world simulation.
- Non-goals: world-clock advancement, due-work ordering, downtime catch-up, movement, pathfinding,
  resource extraction, combat, settlement, respawn, shelter migration, breach, leaderboard, Canvas/UI,
  WebSocket/client snapshots, WebMCP tools, external Agent delivery, hosted PostgreSQL, or live
  production schema migration operations.
- Non-goals: changing `SK-MVP-0.2`, the Re-entry policy, identity semantics, event vocabulary, or the
  CP-04 process boundary. A missing field or contradictory rule is a stop-and-reopen condition, not
  permission to amend the contract inside this task.
- Boundary clarification: the broader target architecture lists future `intelligence`, migration,
  shelter-upgrade, and battle-result records; they are intentionally deferred to their owning
  checkpoints and must not be half-added to the CP-05 minimum schema.

## Scope and authority

- Routing dependency: CP-04's verified process seam and the owner-accepted CP-01 contract are
  prerequisites. CP-02 capability evidence is reused only as a preflight and does not substitute for
  CP-05 persistence runtime evidence.
- In scope: new persistence modules under `src/server/persistence/`; the smallest CP-04 worker,
  configuration, and shutdown changes needed to open, expose, and close the store; a focused
  `tests/cp05-persistence.test.ts` suite; the required `test:cp05` package script; and the CP-05
  evidence/current-status updates required at closure. Runtime databases belong under the ignored
  `tmp/` path and are not committed.
- In scope: explicit SQL schema/bootstrap and forward migrations for the minimum tables above,
  including a visible schema-metadata row; transaction helpers, event-cursor allocation, snapshot
  load/save, idempotency lookup, outbox delivery state, Signal aggregation, and typed
  recovery/duplicate/version failures. Use normalized current-state rows with typed JSON payloads
  for Domain Events and snapshots where that keeps the schema small. An older compatible schema may
  migrate forward deterministically; a newer schema or incompatible contract must refuse to open.
- In scope: foreign keys, stable-identity uniqueness, world-scoped ownership keys, and entity revision
  predicates are enforced by the repository boundary; JSON is parameterized and canonicalized before
  it is used for conflict or idempotency fingerprints.
- In scope: an optional `GAME_DB_PATH` configuration value with an ignored default under
  `tmp/runtime/world.sqlite`; tests must use isolated file-backed temporary paths. `:memory:` is not
  a valid CP-05 runtime closure path because restart/WAL evidence would be bypassed. No runtime
  database or mutable snapshot is written into tracked source directories.
- In scope: worker-only database ownership. Page routes and future WebMCP adapters must not open a
  second authoritative connection; they use the CP-04 entrypoint-owned worker command seam.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, the disposable `probe/cp02/` harness, any outer
  repository documents, or shared dependencies. Do not create a second process, ORM, queue, or
  hosted database service as part of CP-05.
- Allowed actions: read, edit, write, and run within `WebApp/Web-Game/`; no stage, commit, push,
  deploy, credential use, spend, or destructive operation is granted by this task.
- Revalidate when: `SK-MVP-0.2`, the event/snapshot/idempotency contract, CP-04 lifecycle seam, Node
  baseline, SQLite capability, Re-entry delivery policy, or the CP-05 roadmap acceptance changes.

## Owning authority

- Governing workflow: [`../00-Workflow/README.md`](../00-Workflow/README.md) and
  [`../00-Workflow/01-session-runbook.md`](../00-Workflow/01-session-runbook.md)
- Current status: [`../00-current-status.md`](../00-current-status.md)
- Roadmap and checkpoint authority: [`../Engineering/08-development-roadmap-and-checkpoints.md`](../Engineering/08-development-roadmap-and-checkpoints.md#cp-05--durable-state-event-log-and-outbox-planned)
- Persistence architecture: [`../Engineering/03-persistence-world-clock-and-events.md`](../Engineering/03-persistence-world-clock-and-events.md)
- Normative event and persistence envelope: [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md#7-event-revision-and-persistence-envelope)
- Normative snapshot and projection boundary: [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md#9-snapshot-and-visibility-contract)
- Parent implementation route: [`SK-TASK-003`](SK-TASK-003-g1-g2-critical-path-implementation-lock.md)
- Accepted local process seam: [`../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md)
- Accepted delivery backpressure: [`../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md)
- Accepted G2 geometry, state, and vocabulary: [`../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md`](../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md)
- Persistence chain: [`../Mechanics/Chains/10-world-tick-to-persistence.md`](../Mechanics/Chains/10-world-tick-to-persistence.md)
- Re-entry chain boundary: [`../Mechanics/Chains/08-event-to-reentry-action.md`](../Mechanics/Chains/08-event-to-reentry-action.md)
- Static task-coherence review: [`../Validation/07-cp05-persistence-cross-functional-audit.md`](../Validation/07-cp05-persistence-cross-functional-audit.md)
- Shutdown remediation issue: [`../Issues/resolved/SK-ISSUE-004-cp04-shutdown-order-and-store-close.md`](../Issues/resolved/SK-ISSUE-004-cp04-shutdown-order-and-store-close.md)

## Evidence status

### Verified

- CP-04 provides a verified local worker startup and shutdown seam, with process health kept
  separate from world readiness, in [`SK-EVID-007`](../Evidence/SK-EVID-007-cp04-process-runtime-verification.md).
- `SK-MVP-0.2` defines the stable identities, revisions, event envelope, event cursor, idempotency
  key, snapshot header, atomic state/event/outbox rule, and Signal coalescing policy.
- The current Node.js `v24.18.0` environment exposes the built-in `node:sqlite` API. This is a
  registration preflight only; CP-05 must still verify file-backed WAL, locking, transaction, and
  restart behavior before treating the driver as accepted.
- CP-05 was the next roadmap child after the verified CP-04 process foundation and is now locally
  closed; CP-06 is the active successor through `SK-TASK-020`.
- CP-05 implementation, transitive lifecycle checks, and a production-like start/health/shutdown smoke
  passed on Node.js `v24.18.0` in [`SK-EVID-008`](../Evidence/SK-EVID-008-cp05-persistence-runtime-verification.md).

### Inferred for routing

- A single worker-owned SQLite database with explicit SQL and synchronous transactions is the
  smallest local implementation that can prove the accepted two-player persistence boundary without
  adding an ORM, service split, or hosted dependency.
- Normalized current-state rows plus JSON event/snapshot payloads preserve the contract while keeping
  the first schema inspectable and easy to replay. PostgreSQL mapping and higher-concurrency choices
  remain later operations work.
- A persistence-level fixture reducer can prove snapshot/event parity before CP-06 adds the real
  world clock and due-work scheduler.

### Unknown

- The local column constraints, bootstrap ordering, WAL lock behavior, and fixture replay cost are
  verified in `SK-EVID-008`; hosted lock behavior, production migration ordering, and production
  replay cost remain unknown.
- The exact current-row versus `world_snapshot` scheduler projection for active work remains a CP-06
  consumption decision; CP-05 exposes the durable work, due-time, claim, attempt, lease, revision, and
  generation columns that the next task must populate and reconcile.
- CP-06 must still implement the authoritative world-time recovery and bounded catch-up procedure;
  [`ADR-GAME-0012`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md)
  fixes integer persistence and the 300-second budget, while CP-05 only stores and reloads the
  required fields.
- Hosted PostgreSQL behavior, concurrent population scale, compaction, external outbox delivery, and
  semantic world-state reduction beyond the synthetic persistence fixture are not established by this
  local task.

## Challenge reuse and cross-module locks

This task is `Assured` because it touches persistence, event ordering, idempotency, snapshot shape,
and delivery state. It introduces no new game rule and reuses the accepted Challenge and ADRs. The
following failure modes must be tested or made an explicit stop condition:

| Failure mode | Required prevention or evidence |
|---|---|
| State commits without its Domain Event or eligible outbox row | One transaction boundary with injected rollback and post-failure row-count assertions |
| Duplicate command, event, signal, or delivery creates a second effect | Unique identities, idempotency lookup, and duplicate replay/delivery tests |
| Event cursor is reused, reordered, or allocated outside the mutation | Per-world counter row plus a serialized write transaction and ordered readback |
| `SELECT MAX(cursor) + 1` races or consumes a cursor on rollback | A per-world counter row updated inside the same transaction, with rollback and repeated-write tests |
| Stale entity revision overwrites current state | Expected-revision predicate and typed conflict result |
| Signal coalescing loses events or creates a wake storm | One pending/in-flight slot per binding+shelter, deferred cursor, retry identity, and burst test |
| Snapshot and event log disagree or versions are silently coerced | Version headers, deterministic replay parity, and visible `RECOVERY_REQUIRED` failure |
| Snapshot cursor is ahead of, or double-applies, the event log | Atomic snapshot cursor cutover, replay-only-after-cursor rule, gap/ahead rejection, and restart parity test |
| CP-04 reports ready while the store is unavailable, or writes after drain | Store-open readiness coupling, listener-close-before-store-stop ordering, and close-before-stop assertions in the worker/entrypoint test |
| Idempotency keys collide across commands or return a different result | World-scoped key uniqueness, binding/request fingerprint check, stored original result, and cross-owner/mismatched-request tests |
| Signal slot status or cooldown permits a wake storm or loses deferred events | Active-slot uniqueness, lease/terminal transitions, persisted-world-time 60-second gate, deferred cursor, and burst/retry tests |
| An acknowledgement response is lost and a retry creates a second handoff | Signal identity plus durable status transition; retry-after-ack must return the original acknowledged result without a new slot |
| A stale delivery lease acknowledges or retries a newer attempt | Durable lease/attempt identity, wall-time expiry, and stale-lease rejection tests |
| Store close rejects and leaves the CP-04 listener open | Catch/report close failure and prove the worker stop/entrypoint drain still settles within the CP-04 deadline |
| `agent_signal_slot` and `outbox_delivery` become competing Signal authorities | Keep the slot as the logical coalescing source of truth, make delivery rows reference its signal identity, and atomically settle both with one `ContinuationDelivered` event |
| A caller or restart path regresses `world_time` or derives it from wall time | Persist only worker-supplied monotonic time, reject regressions visibly, and leave forward advancement/catch-up to CP-06 |
| CP-06 restart cannot identify active due work, or CP-07 restart regenerates a different fixture | Persist stable work/milestone identities, `next_due_world_time`, revisions, and versioned seed/generation/fingerprint metadata in current state or the world snapshot; do not reconstruct from the client or process memory |
| A claimed due milestone is lost or applied twice after a crash | Persist its logical work/attempt identity and bounded wall-time lease metadata with the current row or scheduler projection; reclaim the same work without changing `world_time` or creating a second event |
| A forward migration partially changes the schema | Transactional migration with rollback/reopen evidence and refusal of newer/incompatible versions |
| Database locks or replay grow without bound and starve health | Small fixture timing check, bounded transaction/replay input, and a CP-06/CP-17 reopen trigger |
| A transient SQLite busy/locked result leaks a partial command or blocks the world worker | Bounded lock handling, typed retryable failure, rollback assertion, and health-path timing test |
| Browser or Agent becomes persistence authority | Repository accepts worker-owned state only; no client snapshot write path |

### Options considered

| Option | Player/system value | Risk | Cost | Reversibility | Evidence need |
|---|---|---|---|---|---|
| Minimal selected: explicit SQL plus built-in `node:sqlite`, normalized minimum rows, JSON event/snapshot payloads | Fastest inspectable local proof while preserving the CP-04 seam | Node API or synchronous locking may need a later driver decision | Low | High; schema and repository boundary remain explicit | WAL, transaction, replay, duplicate, restart, and burst tests |
| Conservative: add a native SQLite package or ORM with a richer repository layer | Familiar abstractions and possible driver maturity | Native install/host drift, hidden transaction behavior, and unnecessary surface | Medium | Medium | Same tests plus dependency/build compatibility |
| Expanded: PostgreSQL, worker queue, or separate persistence service now | Closer to hosted scale | Adds network, migration, service, and failure modes before the local slice exists | High | Low | Hosted multi-process, migration, and recovery evidence |

The minimal option is selected for CP-05. If the built-in driver fails a required capability or
performance check, stop at the driver boundary and record a new decision before selecting the
conservative option. Do not silently switch drivers or add a service to make a test pass.

## Smallest reversible action

When the task starts, verify the branch, CP-04 health seam, and current contract, then create one
ignored file-backed database and implement only schema/bootstrap plus metadata readback. Prove the
driver's WAL and transaction behavior, store-open readiness coupling, and close path before wiring
any gameplay transition. Stop and preserve the failure if schema versioning, contract validation,
cursor cutover, idempotency scope, lock behavior, shutdown ordering, or worker close behavior cannot
be made visible within this boundary. The first write path must use a synthetic state mutation and
event, not a partial game mechanic.

## Verification and closure target

- Minimum verification: ladder level 4 for the file-backed process/restart path, with focused tests
  for schema/version rejection, WAL, atomic rollback, cursor ordering, idempotency and revisions,
  complete event-envelope persistence, multi-entity revision replay, snapshot corruption/newer-version
  refusal, snapshot/event cursor cutover and replay parity,
  routine-versus-eligible Signal aggregation, active-slot uniqueness, cooldown/deferred-cursor
  merge, slot/delivery authority, lease/retry/terminal delivery transitions, duplicate delivery and retry-after-ack,
  wall-time lease reclaim, active work/next-due persistence, generation metadata, migration rollback,
  empty-world/missing-snapshot handling,
  no-grant history-only handling, cross-world/visibility isolation, monotonic world-time rejection,
  store-open readiness, clean close/reopen,
  and process restart. Run the CP-04
  focused suite and production-like build/type
  checks as the minimum transitive aggregate. Read back `journal_mode`, foreign-key enforcement,
  schema version, contract version, and observed fixture transaction/replay latency; if the path
  starves CP-04 health or prevents the accepted 100 ms reconciliation cadence, reopen the topology
  or performance decision instead of adding an unowned service.
- Executed commands: `npm run test:cp05`, `npm run test:cp04`, `npm run typecheck`, `npm run build`,
  the production-like `npm start` health/shutdown smoke, and the documentation validator. Temporary
  file-backed fixtures used isolated paths under the system temporary directory; no runtime database
  was retained in the repository. No external Receiver, WebMCP, browser, or hosted evidence is
  required for CP-05 closure.
- Closure target: `runtime_verified` only after fresh CP-05 process-runtime evidence, current-status
  synchronization, and a recorded `SK-EVID-008` claim boundary.
- Rollback or remediation: retain the accepted CP-04 code and docs as the recovery point; revert only
  the exact CP-05 files or forward-fix the named failing contract. Runtime databases remain ignored
  test artifacts and must not be used as a reason to delete unrelated files.
- Reopen trigger: any partial commit, cursor/idempotency duplication, replay mismatch, stale revision
  acceptance, Signal merge loss/storm, incompatible version being silently coerced, WAL/driver failure,
  process-health starvation, need for a second service, or any change to `SK-MVP-0.2` or CP-04
  authority.

## Execution record

- Source identity: working tree on `main` at Git commit `81ee4392d173d796e404101818b741c0b64b861b`; CP-05
  files and related documentation were intentionally left uncommitted for owner review.
- Runtime: Node.js `v24.18.0`, npm `11.16.0`, Next.js `16.3.4`, local macOS process, contract
  `SK-MVP-0.2`.
- Results: 26 CP-05 tests passed; 5 CP-04 transitive tests passed; TypeScript typecheck and
  production build passed. A production-like `npm start` created an isolated file-backed database,
  returned health HTTP 200 with `status: ready`, and exited cleanly after `SIGTERM`.
- Covered behavior: WAL and foreign-key readback, schema and generation metadata, bootstrap rollback,
  atomic state/event/idempotency/Signal transitions, cursor and revision checks, routine-versus-eligible
  Signal aggregation, post-handoff deferred-cursor folding, snapshot hash/replay and corruption rejection,
  world-scoped visibility, bounded SQLite busy handling, worker/store lifecycle, listener-first drain,
  typed shutdown failures, and late-access rejection.
- Intentionally deferred: world-clock advancement and downtime catch-up, semantic gameplay-state
  reduction beyond the synthetic fixture, hosted concurrency or migrations, WebSocket/client snapshots,
  external Receiver/Connector delivery, WebMCP discovery, and all gameplay behavior. Schema version 1
  had no older compatible migration to execute; incomplete or newer shapes refuse to open visibly.
- Evidence: [`SK-EVID-008`](../Evidence/SK-EVID-008-cp05-persistence-runtime-verification.md).

## Closure statement

CP-05 is `verified` with `runtime_verified` closure for the local worker-owned persistence foundation:
file-backed SQLite WAL bootstrap, versioned minimum schema, atomic synthetic transitions, idempotency,
event cursor/revision integrity, snapshot/replay checks, coalesced Signal delivery state, and the CP-04
listener-first lifecycle seam. The next implementation gate is CP-06 authoritative world-clock and
restart recovery; no gameplay, WebMCP, external Agent, hosted, or submission claim follows from this
task.
