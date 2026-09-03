# CP-06 Boundary-Safe Gameplay Phase Coordinator Runtime Cross-Functional Audit

**Status:** ACCEPTED FOR THE NAMED LOCAL EXPLICIT-ADVANCE SCOPE  
**Date:** 2026-09-02  
**Task:** [`SK-TASK-046`](../Tasks/SK-TASK-046-cp06-boundary-safe-gameplay-phase-coordinator.md)  
**Evidence:** [`SK-EVID-035`](../Evidence/SK-EVID-035-cp06-gameplay-phase-coordinator-runtime-verification.md)  
**Decision:** [`ADR-GAME-0032`](../Decisions/ADR-GAME-0032-cp06-boundary-journal-and-gameplay-phase-coordinator.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)

## Scope and verdict

This audit challenges Task046 across schema migration, completed-time meaning, partial-boundary
recovery, phase ordering, reducer replay, worker ownership, expected resource exhaustion, admission,
and downstream isolation.

**Verdict:** accept `SK-TASK-046` as `runtime_verified` for one local file-backed, explicitly advanced
G2 gameplay coordinator. The implementation closes the partial-boundary and default-worker
composition prerequisite; it does not claim a continuously advancing or hosted world.

## Cross-functional review

| Surface | Final result | Disposition |
|---|---|---|
| Schema and migration | Schema `7` / `cp06-003` adds one nullable `world.in_progress_world_time` marker. A schema-v6 file with the column removed migrates transactionally and reopens with a null marker. | Accepted. No contract-version change. |
| Completed-time authority | `world.world_time` remains the last fully completed boundary. `beginWorldBoundary(T)` requires exactly `world_time + 1`; `completeWorldBoundary(T)` requires the exact marker and atomically advances/clears it. | Accepted. The clock validates both persistence responses before continuing. |
| Partial-boundary crash | A late phase failure leaves completed time at `T - 1` and marker `T`; the process becomes visibly recovery-blocked and cannot advance `T + 1`. | Accepted. A restarted worker replays the whole `T` before ready. |
| Phase order | One coordinator runs movement, deposit, contact, extraction, combat, settlement no-op, and timers no-op. Home crossing precedes deposit; contact precedes extraction; combat owns terminal effects. | Accepted for the implemented G2 reducers. |
| Replay identity | Existing due markers, terminal phases, event ids, idempotency records, and stable entity ordering make already committed work absent or exactly replayable. Unknown state and reducer failures remain typed recovery faults. | Accepted. Missing replay guards remain a reopen trigger. |
| Worker graph | The default persistence worker constructs one movement cadence, mission service set, combat service, coordinator, and clock over one store. Gateway mission/command paths and clock reconciliation do not create a second graph. | Accepted for one selected world. |
| Resource exhaustion | A GATHERER reaching a resource node emptied before its due boundary commits the existing `MissionAutoReturned` path with `TARGET_DEPLETED`, zero cargo, and zero coins. The clock remains live. | Accepted. `TARGET_UNAVAILABLE` remains valid for command admission and impossible negative/positive-target cases. |
| Admission and lifecycle | Store open precedes clock startup; interrupted-boundary replay precedes worker `ready`; stop calls clock stop before store close. Gateway operations remain rejected while starting or stopped. | Accepted at local process level. |
| Settlement and timers | Settlement is a deliberate no-op because combat terminal transactions already own death/cargo-loss/reissue or Hunter return. Timer phase is a deliberate no-op because respawn reducers and trusted time are not implemented. | Accepted with explicit non-claims. |
| Downstream boundaries | No browser timer, periodic realtime publication, Agent Signal, outbox delivery, WebMCP, Re-entry, production identity, or hosted behavior entered the phase graph. | Accepted. Later gates remain separate. |

## Residual risks and reopen routing

1. **Autonomous time:** A future scheduler still needs a trusted elapsed-time source, startup anchor,
   bounded catch-up policy, and supervisor/host continuity. `advance()` remains explicit.
2. **Timer reducers:** Resource and monster due markers remain inert; adding a wall-time interval or
   silently treating a marker as settled reopens this decision.
3. **Multi-world ownership:** The default worker selects one explicit or sole persisted world and
   rejects ambiguous multiple-world startup. A world registry and fair multi-world scheduler are
   outside this increment.
4. **OS process proof:** The test closes and reopens file-backed stores in the Node runtime. An OS
   supervisor, hosted restart, durable storage, and health/recovery trace remain CP-17/CP-18 work.
5. **Reducer coverage:** This increment composes the existing reducers and verifies representative
   whole-T failure/liveness paths; a new reducer must bring deterministic work identity, terminal
   guards, and a focused composition test before joining the coordinator.

## Exact disposition

`SK-TASK-046` is accepted as `runtime_verified` at the named local explicit-advance scope captured by
`SK-EVID-035`. Reopen this audit if completed time can advance before every phase, startup admits
commands before replay, a second clock/queue appears, an expected domain condition is swallowed,
timer execution enters the graph without a trusted anchor, or Agent/Re-entry delivery is coupled to
gameplay phase execution.
