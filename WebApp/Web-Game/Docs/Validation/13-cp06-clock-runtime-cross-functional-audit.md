# CP-06 Clock Runtime Cross-Functional Audit

**Role:** Implementation review for the worker-owned clock, recovery boundary, and CP-04 lifecycle handoff  
**Status:** LOCAL BOUNDARY REVIEW COMPLETE; gameplay due-work integration remains open  
**Date:** 2026-09-02  
**Scope:** CP-06 implementation task `SK-TASK-020`, its CP-05 persistence seam, the optional CP-04 worker lifecycle hook, and handoffs to CP-07 through CP-15  
**Contract:** [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md#3-world-clock-and-due-work-order)  
**Clock decision:** [`../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md`](../Decisions/ADR-GAME-0012-cp06-world-time-precision-and-recovery-budget.md)  
**Evidence:** [`../Evidence/SK-EVID-009-cp06-clock-runtime-verification.md`](../Evidence/SK-EVID-009-cp06-clock-runtime-verification.md)

## 1. Verdict

The registered CP-06 increment is coherent and locally runtime-verified for its bounded boundary:
`WorldClock` loads a durable integer `world_time`, keeps 100 ms interpolation process-local, exposes
the accepted seven-phase order, rejects backward targets, caps recovery at 300 world seconds, and
reopens from a file-backed store through the worker lifecycle seam. The focused fixtures pass without
browser input, a second store, or an external Agent.

This review does not promote the phase callbacks into gameplay transactions. They are synthetic
ordering hooks until later checkpoints connect due-work reducers, event identities, entity revisions,
and atomic settlement. The local result therefore supports CP-06 clock/recovery boundary claims only;
it does not claim a continuously advancing playable world, a complete scheduler, or hosted continuity.

## 2. Cross-functional checks

| Boundary | Verified result | Remaining handoff |
|---|---|---|
| CP-05 -> CP-06 authority | `WorldClock` consumes `getWorld` and a monotonic `advanceWorldTime` method on the existing worker-owned file-backed store. The store rejects invalid or backward integer targets inside a transaction. | Real active-work replay and due milestone identity still belong to the gameplay scheduler increment. |
| Precision and cadence | Persisted time remains a non-negative safe integer. Sub-second elapsed time updates only `interpolationElapsedMs`/`interpolationAlpha`; a boundary commits once at 1000 ms. | CP-08 must consume the projection seam without making interpolation authoritative. |
| Same-second order | Every accepted boundary invokes movement, deposit, contact, extraction, combat, settlement, and timers in the documented order, once per boundary. | CP-09 through CP-11 must make each callback an owned, atomic domain transition and preserve the order under competing work. |
| Recovery bound | A gap of exactly 300 seconds is accepted. A 301-second target returns `RECOVERY_LIMIT_EXCEEDED`, preserves the durable row, closes the clock mutation path, and can continue only through explicit bounded chunks. | A trusted server-time anchor and recovery progress/readiness surface remain unimplemented. |
| Restart | A new clock and worker load the persisted boundary after close/reopen and continue from it. | Snapshot/event replay of real due work and lease reclamation remain later scheduler work. |
| CP-04 lifecycle | When supplied, the worker opens the store before `clock.start()` and calls `clock.stop()` before store close. Existing process health remains a process concern and is not relabelled as world recovered. | The default entrypoint still has no world bootstrap/clock instance; continuous simulation is not claimed. |
| Re-entry and browser | No browser timer, WebSocket, WebMCP, Receiver, Connector, or Codex Thread path was added. | CP-12 through CP-14 consume later authoritative projections and durable event summaries. |

## 3. Failure and duplicate review

- Invalid elapsed time, fractional recovery targets, and backward targets fail with typed outcomes and
  leave the running durable boundary unchanged.
- Repeating an accepted recovery target is a zero-boundary no-op; phase hooks and persistence are not
  invoked a second time.
- A rejected over-limit target invokes no phase hook and does not move the store. The explicit 300-
  second chunk path is visible rather than an implicit loop.
- The clock catches persistence or phase-hook failures as a visible recovery-blocked state. A future
  domain scheduler must execute each phase's state, event, revision, and idempotency work atomically;
  the current synthetic callback seam cannot by itself prove crash-after-callback exactly-once
  settlement.

## 4. Residual risks and owners

| Residual risk | Owner / next gate | Reopen trigger |
|---|---|---|
| Trusted server-time observation and fractional elapsed mapping are not implemented | CP-06 follow-up or operations decision before hosted continuity | Browser or wall time becomes gameplay authority, or a consumer requires fractional persisted time |
| Active work and next-due milestones are stored but not scheduled by this increment | CP-07 through CP-11, then CP-15 race/replay closure | Restart cannot identify a stable work identity, or a due item can run twice or disappear |
| Synthetic phase hooks are not a transactional gameplay reducer | CP-07/CP-09/CP-10/CP-11 domain increments | A phase callback mutates durable state outside an idempotent transaction |
| The optional clock hook is not wired to the default world bootstrap | CP-07 world creation and CP-16 local slice | Process reports a playable world before the clock is authoritative, or health hides `recovery_blocked` |
| No measured 100 ms/load or hosted catch-up result | CP-15 local aggregate and CP-17 hosted continuity | Event-loop starvation, recovery exceeds budget, or production scale changes the contract |

## 5. Closure disposition

The evidence record may close `SK-TASK-020` as `runtime_verified` for the local CP-06 clock/recovery
boundary. The next implementation entry is a separately registered CP-07 deterministic world fixture
task; it must consume the persisted `world_id`, seed/version/fingerprint, and recovered integer clock
without regenerating state or adding a second scheduler authority.
