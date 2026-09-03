# CP-06 Gameplay Phase Coordinator Pre-Implementation Challenge

**Status:** ACCEPTED PRE-IMPLEMENTATION CHALLENGE UNDER ACTIVE `SK-TASK-046`  
**Checkpoint:** CP-06  
**Task:** [`SK-TASK-046`](../Tasks/SK-TASK-046-cp06-boundary-safe-gameplay-phase-coordinator.md)  
**Decision:** [`ADR-GAME-0032`](../Decisions/ADR-GAME-0032-cp06-boundary-journal-and-gameplay-phase-coordinator.md)  
**Date:** 2026-09-02

## Question

What is the smallest coordinator that can safely compose the already-verified G2 gameplay reducers
at one integer world boundary without allowing a partial boundary, expected gameplay outcome, or
duplicate service graph to corrupt recovery or block the world?

## Current evidence and contradictions

- `WorldClock.processBoundary(T)` calls `movement`, `deposit`, `contact`, `extraction`, `combat`,
  `settlement`, and `timers`, then advances durable time. The current fake-handler proof is ordered.
- Implemented gameplay commit transactions independently update `world.world_time` to their input T.
  This violates the clock's implied completed-boundary meaning once two real phases are composed.
- A crash after an early commit but before a later phase leaves no durable evidence that T is partial.
  Restart can start from T and never replay the omitted phase.
- Phase reducers are independently deterministic and mostly replay-safe through due state, stable work
  ids, exact event ids, and idempotency records. They have never been challenged as one graph.
- Pre-empty zero-cargo extraction intentionally throws `TARGET_UNAVAILABLE`. In a composed clock this
  expected world state becomes a world-level `recovery_blocked` failure and can prevent later timer
  or mission work indefinitely.
- `WorldWorkerModule` can construct one gateway cadence while an injected clock owns another. The
  default entrypoint does not compose gameplay phase services into a clock.
- Resource respawn due markers exist, but their reducer and a trusted wall-time anchor do not. A task
  that adds an interval now would still be incomplete and unsafe.

## Options

### A — Wire all services into the current clock and add an interval

Rejected. Early phase transactions can publish completed T before later phases run. An interval only
amplifies partial-boundary, duplicate-graph, startup, and expected-error failures.

### B — Durable whole-boundary journal plus one explicit shared coordinator (accepted)

Add one in-progress boundary marker, reserve T before phases, keep completed time at T - 1, replay the
whole T after interruption, and complete T only after all phases return. Construct the mutable service
graph once in the worker and expose explicit advance through the existing gateway. Keep autonomous
wall time and timer reducers outside this task.

### C — Persist one cursor after every phase

Rejected for this increment. It adds more write states, migrations, recovery branches, and cursor/
domain divergence. Existing deterministic reducer identities already support safe whole-T replay;
one marker is the smaller durable contract.

### D — Execute every phase in one monolithic SQLite transaction

Rejected. Current services own bounded transactions and exact result contracts. Collapsing the entire
second into one transaction would require a broad store rewrite, hold a long write lock, discard
existing replay evidence, and couple unrelated reducers.

## Accepted boundary contract

1. Schema v7 adds nullable `in_progress_world_time` to the world aggregate or an exactly equivalent
   single-row journal. At most one integer T may be active.
2. `world_time` means the last fully completed boundary. `beginBoundary(T)` accepts only T =
   `world_time + 1`; exact repeat of the active T is a no-op; another T, regression, or malformed
   state fails closed.
3. Every gameplay commit at T requires active T and no longer updates completed `world_time`.
4. The coordinator runs `movement` (outbound then return), `deposit`, `contact`, `extraction`,
   `combat`, no-op `settlement`, and no-op `timers`, then calls `completeBoundary(T)`.
5. `completeBoundary(T)` atomically writes completed T and clears the exact marker. It cannot skip,
   regress, or complete a different boundary.
6. Restart detects active T after store/fixture validation and replays the whole T before worker
   readiness. Commands, reads, and realtime resync cannot interleave with that replay.
7. Each phase retains stable `(due_world_time, entity id)` ordering and deterministic work/event
   identities. Already committed early work becomes absent from the due query or exact replay; it
   never creates a second effect.
8. A zero-cargo mission at a node already depleted before T takes the existing durable
   `MissionAutoReturned(reason = TARGET_DEPLETED)` path. It clears extraction due state, retains zero
   cargo/coins, and remains explainable without blocking the world.
9. Any unexpected reducer/store failure leaves completed time and active marker unchanged, closes
   admission for that process, and requires replay. Catch-and-continue and T + 1 are forbidden.
10. The worker creates one cadence and one instance of each mutable gameplay service. Gateway,
    100 ms reconciliation, and integer phases share those objects and the same store.

## Phase-order challenge matrix

| Scenario | Required result | Forbidden result |
|---|---|---|
| Early movement commit, injected extraction failure at T | Completed time stays T - 1; marker stays T; restart replays and completes remaining work once | Persisting completed T, skipping extraction, or duplicating the movement event |
| RETURNING attempt reaches home at T | Movement writes DEPOSITING; deposit settles in the same T | Deposit before home crossing or waiting an accidental extra second |
| Monster contact and extraction are both eligible at T | Contact locks first; extraction observes encounter and does no cargo work; combat owns the round | Cargo extraction after contact or two encounter effects |
| Terminal combat at T | Existing combat transaction owns death/cargo loss/reissue or Hunter return exactly once | A second settlement reducer changes the same entities |
| Two attempts due in one phase | Existing stable due/id ordering determines effects and replay | Database iteration order or wall-clock order |
| Previously empty target, zero cargo | Durable zero-cargo TARGET_DEPLETED return; later phases/world remain live | `TARGET_UNAVAILABLE` escaping and setting world recovery-blocked |
| Movement intent plus explicit T advance | One shared cadence instance applies reconciliation and gateway intent | Two cadence maps or divergent intent ownership |
| Restart with no active marker | Start at completed time without replay | Inventing or skipping a boundary |
| Invalid active marker | Typed recovery failure before ready | Clearing the marker or exposing the gateway |
| Any phase event | Existing event/snapshot only | Agent Signal, outbox delivery, WebMCP, or Re-entry side effect |

## Required Red, Green, and runtime proof

1. Red schema migration, marker invariants, commit-at-active-T enforcement, and completed-time
   semantics before changing gameplay transactions.
2. Red an injected failure after a real early reducer commit, close/reopen, pre-ready whole-T replay,
   exact event/idempotency counts, and T completion.
3. Red same-T home/deposit, contact/extraction/combat, pre-empty target liveness, stable multi-entity
   order, and shared cadence identity.
4. Green only the marker, coordinator, shared graph, and target-exhaustion correction. Keep
   settlement/timers visibly no-op and do not add a wall-time source.
5. Regress only the affected CP-06, CP-08, CP-09, CP-10, and CP-11 suites plus typecheck; run one
   file-backed process restart proof.

## Stop and reopen conditions

Stop before or during implementation if whole-T replay cannot be proven for an existing reducer, a
phase needs its own clock/queue, admission must open before interrupted-boundary replay, an error must
be swallowed to keep the loop alive, `world_time` must advance before all phases finish, or the task
requires timer execution, WebMCP, Re-entry, external delivery, hosted time, or more than one world.

## Challenge disposition

Option B is the smallest coherent next increment. It closes the durability and liveness prerequisites
for a later autonomous scheduler while making a narrower claim: one boundary-safe explicitly driven
G2 gameplay coordinator. The autonomous wall-time driver, trusted restart target, timer reducers,
periodic publication, and hosted continuity remain separate tasks.
