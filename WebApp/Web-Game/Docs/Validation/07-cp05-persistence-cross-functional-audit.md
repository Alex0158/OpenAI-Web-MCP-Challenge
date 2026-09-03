# CP-05 Persistence and Cross-Functional Audit

**Role:** Cross-functional design review of durable state, event history, and derived delivery state  
**Status:** STATIC REVIEW COMPLETE; CP-05 runtime verification recorded in `SK-EVID-008`  
**Date:** 2026-09-02  
**Scope:** Sleepless Kingdom CP-05 and its interfaces with CP-04, CP-06, CP-08, CP-10, CP-11, CP-13, CP-14, CP-15, and CP-17  
**Task:** [`../Tasks/SK-TASK-005-cp05-persistence-event-log-and-outbox.md`](../Tasks/SK-TASK-005-cp05-persistence-event-log-and-outbox.md)  
**Contract:** [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md)  
**Delivery policy:** [`../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md)  
**Runtime seam:** [`../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md)

## 1. Purpose

This review checks whether the registered CP-05 task can be implemented without creating a second
authority, losing a committed event, duplicating a command effect, making snapshot recovery ambiguous,
or turning Re-entry delivery back into a high-frequency event stream. It examines the database,
worker lifecycle, world-time boundary, event and snapshot contracts, idempotency, outbox state, and
the future page and Agent adapters together.

This is a task-coherence record, not the runtime evidence and not a new gameplay decision. The CP-05
task owns the implementation boundary; `SK-MVP-0.2`, ADR-GAME-0009, ADR-GAME-0011, and the CP-05
runtime evidence remain authoritative for their respective scopes.

## 2. Verdict

The minimal local choice is coherent: one worker-owned file-backed SQLite database in WAL mode, explicit
SQL, normalized current-state rows, typed JSON event and snapshot payloads, and no external delivery
call inside the persistence task. It preserves the accepted real-time world and keeps the Re-entry
path derived from durable history.

The task is suitable to enter implementation after the entry-state and driver checks. No new game rule,
identity rule, event name, or CP-04 topology decision is required. The amended task now makes the
following boundaries executable acceptance conditions rather than informal intentions:

1. process readiness follows store-open and compatibility checks; a degraded store admits no mutation;
2. state, command result, cursor allocation, Domain Event, and eligible outbox state commit together;
3. multi-entity transitions retain causally ordered events and every affected entity revision;
4. snapshot cursor cutover and replay reject gaps, ahead cursors, incompatible versions, and
   unreconcilable projections visibly;
5. idempotency keys are world-scoped and retain the original result, including typed rejection;
6. G2 creates Signals only for `CargoLostToMonster` when the owning policy supplies an eligible
   grant, available bounded action, and binding, with one coalesced active slot, durable lease and
   retry state, world-time cooldown, visibility filtering, and a complete deferred summary for
   post-handoff events;
7. delivery acknowledgement is identity-safe, while a stale lease cannot settle a newer attempt;
8. the coalescing slot is the Signal authority, delivery rows are transport attempts, and their
   acknowledgement cannot create a second `ContinuationDelivered` event;
9. persistence stores worker-supplied monotonic `world_time` without deriving or advancing it, while
   CP-06 owns forward advancement and catch-up;
10. active work/next-due state and versioned world-generation metadata survive restart for the CP-06 and
    CP-07 handoffs;
11. process `ready` remains distinct from world `RUNNING`, with normal recovery closing the mutation
    gate and unrecoverable recovery mapping to `degraded`;
12. CP-04 begins listener drain before awaiting worker/store close, and close failure cannot strand the
    HTTP listener; and
13. the persistence path remains worker-owned, file-backed, restartable, and measurable against the
    accepted simulation cadence.

These are task-level controls. They were the acceptance constraints for CP-05; implementation and
local runtime closure are recorded in [`../Evidence/SK-EVID-008-cp05-persistence-runtime-verification.md`](../Evidence/SK-EVID-008-cp05-persistence-runtime-verification.md).

## 3. Evidence and assumptions

### Verified

- `SK-MVP-0.2` defines stable identities, entity revisions, the event envelope, per-world event cursor,
  idempotency key, `world_snapshot` versus `client_snapshot`, atomic state/event/outbox behavior, and
  the G2 `CargoLostToMonster` eligibility boundary.
- ADR-GAME-0009 keeps the world real-time, retains every Domain Event, coalesces Agent Signals, and
  limits one pending or in-flight wake per continuation binding and shelter.
- ADR-GAME-0011 provides one explicit Node.js process, one worker lifecycle seam, dynamic process health,
  and a bounded shutdown path. CP-04 local runtime evidence is recorded in `SK-EVID-007`.
- The current Node.js v24 environment exposes `node:sqlite`; this is a preflight capability result,
  not proof of file-backed WAL, locking, migration, or restart behavior.
- The CP-05 documentation self-tests and full repository validator pass after the task amendments.
- CP-05 local runtime closure is recorded in `SK-EVID-008`; it covers the file-backed persistence
  seam, focused CP-05/CP-04 checks, build/type checks, and a production-like health/shutdown smoke.

### Inferred for routing

- A worker-owned store is the smallest way to let CP-06 through CP-14 share one authoritative state
  boundary without letting a page route or WebMCP bundle open a second connection.
- A per-world counter row updated inside the write transaction is safer than deriving the event cursor
  from the current event log, especially when a transaction rolls back or two writes are attempted.
- Persisting the coalesced Signal slot in the same database keeps notification backpressure separate
  from gameplay timing while retaining the deferred cursor for a later delivery.

### Unknown until implementation

- The exact `node:sqlite` API calls, schema columns, migration ordering, lock behavior, replay cost,
  scheduler projection shape, work-lease fields, and generation-metadata payload.
- The CP-06 world-clock recovery and downtime catch-up procedure, hosted database behavior, long-term
  compaction, and the actual Receiver/Connector handoff.

## 4. Cross-functional findings and disposition

All dispositions below are constraints now recorded in `SK-TASK-005`; none is a runtime pass.

| ID | Severity | Cross-functional risk | Disposition |
|---|---|---|---|
| F01 | P1 | CP-04 could report `ready` while persistence is unavailable, or accept a write after draining. | Store-open/compatibility gates readiness, degraded rejects mutation, and the worker-owned store closes before stop settles; the lifecycle test must cover late access. |
| F02 | P1 | A state row, idempotency result, Domain Event, or eligible Signal record could commit separately. | One transaction contains the mutation, world counter update, command result, Domain Event, and eligible delivery state; injected rollback checks for zero partial rows. |
| F03 | P1 | `MAX(cursor)+1`, a process counter, or a rolled-back allocation could reuse or reorder causal history. | A per-world counter row is initialized with the world and updated under a serialized write transaction; ordered readback and rollback tests are required. |
| F04 | P1 | A snapshot could be selected from the wrong world, replay an event twice, skip a gap, or hide a corrupt newer row. | World-scoped compatible snapshot selection, atomic cursor cutover, replay-after-cursor only, projection parity, and visible `RECOVERY_REQUIRED` are required. |
| F05 | P1 | A schema or contract version could be silently coerced, or a forward migration could partially apply. | `schema_meta`, per-record version headers, transactional local forward migration, rollback/reopen evidence, and refusal of newer/incompatible versions are required. |
| F06 | P1 | The same idempotency key could be accepted under another binding or return a different result after a retry. | The key is unique within a world; the record stores binding, canonical request fingerprint, contract version, original result, outcome, and event identity. |
| F07 | P1 | Actionable event bursts could wake the Agent repeatedly or lose events after handoff. | Only `CargoLostToMonster` is eligible in G2; one active slot merges cursor/count/severity/latest data, preserves a deferred cursor, and keeps the full event log. |
| F08 | P1 | Lost acknowledgements or expired leases could create a second handoff or settle an older attempt. | Signal identity and durable status are idempotent; lease/attempt identity is required for ack/retry, with wall-time expiry and retry-after-ack tests. |
| F09 | P1 | A rejected store close could bypass HTTP listener closure and leave a half-drained process. | Resolved by the listener-first, typed-close implementation and runtime proof in [`SK-ISSUE-004`](../Issues/resolved/SK-ISSUE-004-cp04-shutdown-order-and-store-close.md) and `SK-EVID-008`; reopen if a later lifecycle owner introduces a second drain path. |
| F10 | P2 | A transport lease or notification cooldown could accidentally use the wrong clock and change gameplay timing. | Cooldown is stored and compared in persisted `world_time`; transport lease expiry uses `wall_time`; CP-05 never advances the world clock. |
| F11 | P2 | A page, WebMCP adapter, or future client snapshot could become a second persistence authority. | Database ownership stays in the worker seam; client snapshots remain projections and adapters call the entrypoint-owned command path. |
| F12 | P2 | Synchronous SQLite work, a busy lock, or unbounded replay could starve CP-04 health and the later 100 ms reconciliation step. | Use bounded lock handling, typed retryable failure, bounded fixtures, and timing readback; a measured starvation result reopens the driver/topology decision rather than adding an unowned service. |
| F13 | P2 | Fixture reset or cleanup could delete another world's history or make restart evidence non-repeatable. | Reset creates a new `world_id`; event retention is append-only; tests use isolated ignored file paths and never `:memory:` for closure evidence. |
| F14 | P2 | CP-05 could accidentally contact the external Receiver or Codex Thread and claim Re-entry integration early. | The task persists delivery state and synthetic transitions only; external dispatch belongs to CP-14 and its separate handoff gate. |
| F15 | P2 | A missing snapshot could make restart invent initial state or silently discard a non-empty event history. | Empty new worlds are explicit; a non-empty world needs deterministic full replay from a declared initial state or visible `RECOVERY_REQUIRED`. |
| F16 | P1 | A `CargoLostToMonster` event without an eligible grant, available bounded action, or binding could create an unauthorized wake, or deferred events could lose their count and severity. | The persistence boundary accepts only an owning-policy eligibility decision, keeps no credentials, leaves ineligible events in history, and persists the full deferred summary for the next signal. |
| F17 | P1 | A deposit, death, or settlement can change several entities while the event header names only one aggregate, leaving replay or stale checks incomplete. | A transaction may append multiple ordered events, and the payload or linked rows retain every affected entity revision; multi-entity replay is a required test. |
| F18 | P1 | A world cursor page window could leak another player's event or hidden state into a Signal. | Apply `visibility_scope` against the bound shelter before aggregation and test cross-shelter isolation; a Signal contains only permitted causal context. |
| F19 | P2 | A transient SQLite busy/locked result could leak a partial command or block the worker indefinitely. | Return a typed retryable failure after a bounded wait, roll back every related row, and prove the health path remains responsive. |
| F20 | P1 | A fixture world reset or a missing world predicate could join one player's state, event log, or Signal slot to another world. | Require `world_id` on every authoritative and delivery row, enforce foreign keys/ownership, and test cross-world isolation on reads and writes. |
| F21 | P2 | Raw SQLite paths or diagnostics could leak through the process health or lifecycle-log boundary. | Map persistence failures to redacted typed codes; health and logs exclude database paths, SQL, stack traces, environment values, and mutable state. |
| F22 | P2 | The broader persistence architecture names future intelligence, migration, upgrade, and battle-result records, which could be pulled into CP-05 without their owning rules. | CP-05 implements only the G2 minimum; future tables remain owned by CP-08/CP-11/CP-21/CP-22 and arrive through their own compatible task and migration. |
| F23 | P1 | `agent_signal_slot` and `outbox_delivery` could each become a source of truth, duplicating a Signal or acknowledgement event. | The slot owns logical coalescing and deferred context; delivery rows reference its signal identity and own only transport attempts; one transaction settles both and appends `ContinuationDelivered` once. |
| F24 | P1 | A persistence caller could regress `world_time` or derive it from wall/client time, corrupting CP-06 recovery semantics. | Store only worker-supplied monotonic time, reject regressions visibly, and leave clock advancement and downtime catch-up to CP-06. |
| F25 | P1 | CP-04 exposes a controller stop helper separate from the production entrypoint shutdown path; CP-05 could wire store close into the wrong owner and restore a second drain path. | Keep the entrypoint as the sole production shutdown orchestrator; any helper used in tests must share the same idempotent close/error semantics and cannot independently close the store or listener. |
| F26 | P1 | CP-06 restart could lose active milestones or `next_due_world_time` and reconstruct scheduler state from a page or process memory. | Persist stable work/milestone identities, next-due world time, and claim revisions in current rows or a complete snapshot scheduler projection; CP-05 does not add a separate scheduler authority. |
| F27 | P1 | CP-07 restart or reset could silently regenerate a different map after a code or fixture update. | Persist and version-check `world_seed`, `generation_version`, and `map_fingerprint` with the world/snapshot; CP-07 owns their values and generator. |
| F28 | P1 | A claimed due milestone could be lost or applied twice after a process crash because its claim has no durable recovery identity. | Persist the logical work/attempt identity and bounded wall-time lease metadata with the current row or scheduler projection; reclaim the same work without advancing `world_time` or creating a second event. |
| F29 | P1 | Process `ready` could be mistaken for world `RUNNING`, or normal replay could be exposed as an unrecoverable process failure. | Keep process health and world authority separate; close the mutation gate with typed `RECOVERY_REQUIRED` during normal recovery and use process `degraded` only for an unrecoverable store/recovery failure. |

## 5. Cross-checkpoint contract

| Later surface | CP-05 promise | CP-05 must not decide |
|---|---|---|
| CP-04 | Store availability is part of process startup/readiness; process `ready` does not claim world `RUNNING`, and shutdown cannot leave the listener open. | A new process owner or a second local server. |
| CP-06 | `world_time`, snapshot cursor, event history, active work/next-due metadata, and reclaimable work leases are durable inputs; persistence rejects time regression and wall-time leases remain transport state. | Clock advancement, same-time due-work order, or downtime catch-up. |
| CP-07 | Versioned world seed/generation metadata and stable `world_id` survive close/reopen and reset isolation. | Fixture coordinates, generation algorithm, route calibration, or production population. |
| CP-08 / CP-12 | Current state is read through the worker command seam and `client_snapshot` remains a projection. | WebSocket protocol, Canvas rendering, or client authority. |
| CP-10 / CP-11 | Resource, cargo, encounter, combat, death, and settlement modules can commit through one transaction/revision boundary. | Gameplay formulas, extraction order, or combat behavior. |
| CP-13 / CP-14 | Typed command results and durable coalesced delivery records are available to the page and adapter. | WebMCP discovery, Receiver behavior, Connector scheduling, or a gameplay wait. |
| CP-15 / CP-17 | Restart, duplicate, recovery, and health evidence can inspect one durable store. | Hosted provider, production migration, scale target, or deployment claim. |

## 6. Implementation gate

The next implementation turn should remain inside `SK-TASK-005` and follow this order:

1. verify branch, current status, CP-04 seam, Node capability, and an ignored file-backed path;
2. bootstrap `schema_meta` and the minimum tables, then read back world-scoped foreign keys,
   foreign-key enforcement, WAL, versions, generation metadata, and active work/next-due fields;
3. prove store-open readiness, degraded admission, listener-first drain, deterministic close, and late
   access failure;
4. add the smallest synthetic transaction for state plus idempotency, one or more ordered events,
   affected revisions, cursor, and eligible slot/delivery state, including rollback, duplicate,
   world-time regression, crash-before-commit lease reclaim, and bounded busy/locked cases;
5. add snapshot save/load and replay parity, version/recovery failures, and migration rollback;
6. add Signal aggregation, no-grant history-only behavior, slot/delivery authority, and synthetic lease/ack/retry/terminal
   transitions without external calls; and
7. run the CP-05 suite, CP-04 transitive checks, build/type checks, and record fresh `SK-EVID-008` data.

Stop and reopen the named driver, contract, or topology decision if any boundary cannot be made
observable within this local slice.

## 7. Residual risks and closure boundary

CP-05 is now closed at `runtime_verified` in its task record. This review remains a static design
record; its runtime claims are limited to the exact checks and fixtures listed in `SK-EVID-008`.
Hosted PostgreSQL, multi-process concurrency, compaction, production schema migration, external
Receiver/Connector delivery, WebMCP discovery, and gameplay behavior remain later evidence gates.

## Related records

- [`../Tasks/SK-TASK-005-cp05-persistence-event-log-and-outbox.md`](../Tasks/SK-TASK-005-cp05-persistence-event-log-and-outbox.md)
- [`../Mechanics/Chains/10-world-tick-to-persistence.md`](../Mechanics/Chains/10-world-tick-to-persistence.md)
- [`../Mechanics/Chains/08-event-to-reentry-action.md`](../Mechanics/Chains/08-event-to-reentry-action.md)
- [`../Engineering/03-persistence-world-clock-and-events.md`](../Engineering/03-persistence-world-clock-and-events.md)
