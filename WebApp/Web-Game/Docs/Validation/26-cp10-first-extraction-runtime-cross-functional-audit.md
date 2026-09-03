# CP-10 First Extraction Runtime Cross-Functional Audit

**Status:** Complete for the bounded local first-extraction boundary  
**Date:** 2026-09-02  
**Task:** [`SK-TASK-029`](../Tasks/SK-TASK-029-cp10-first-extraction-and-cargo.md)  
**Evidence:** [`SK-EVID-018`](../Evidence/SK-EVID-018-cp10-first-extraction-runtime-verification.md)  
**Decision:** [`ADR-GAME-0020`](../Decisions/ADR-GAME-0020-cp10-first-extraction-and-cargo.md)

## Verdict

The local process-runtime boundary is verified for one post-arrival Wood/Rock extraction. Schema-v4
cargo provenance, due-work ordering, server-owned tool/role validation, node/cargo/mission/attempt
revisions, one `CargoExtracted` event, idempotency, rollback, and restart recovery agree with the
accepted `SK-MVP-0.2` contract. The extraction handler is injected into the existing clock phase in
the test harness; default scheduler composition, browser/UI, WebMCP, Re-entry, hosted, and complete
economy claims remain open.

## Business chain audit

```text
CP-09 dispatch
  → movement arrival at T
  → extraction due marker T + 2
  → server reads persisted role/tool/target/revisions
  → one node unit decrement + one provenance cargo row
  → one CargoExtracted event + idempotency record
  → exposed field cargo (no coin)
  → later CP-10 return/deposit or CP-11 loss
```

| Boundary | Verified behavior | Disposition |
|---|---|---|
| Identity/ownership | Mission attempt, soldier, node, cargo, world, and shelter are world-scoped; event visibility matches the soldier shelter | Pass |
| Role/loadout | Persisted GATHERER and Wood/Axe or Rock/Pickaxe pairing is authoritative; drift enters a typed rejection/recovery path | Pass |
| Time/order | Arrival at `T` arms `T + 2`; movement precedes extraction; handler rejects a jump over a durable boundary | Pass |
| Persistence/migration | v3→v4 cargo columns migrate atomically; malformed or partial rows fail visibly | Pass |
| Settlement | Node quantity and exposed cargo commit together; shelter coins remain unchanged | Pass |
| Event/history | One `CargoExtracted` event has causal id, cursor, typed payload, visibility, and affected revisions | Pass |
| Duplicate/race | Stable worker idempotency and expected revisions prevent duplicate cargo; a second due pass is a no-op | Pass for bounded single-node retry; two-soldier contest deferred |
| Failure/restart | Injected failure rolls back all state; restart processes the due milestone once | Pass |
| Projection/UI | No UI or client coordinate/quantity authority was added | Deferred to CP-12 |
| WebMCP/Re-entry | No new page capability or wake-up path; routine extraction is not an Agent signal | Deferred to CP-13/14 |
| Operations/hosting | File-backed WAL and local worker are exercised; default all-phase composition and hosted continuity are not claimed | Deferred to CP-16/17 |

## Failure and race matrix

| Case | Expected result | Evidence |
|---|---|---|
| Duplicate due pass | No new row, quantity, revision, cursor, or event | Focused test |
| Duplicate idempotency key | Original typed result with `duplicate` marker | Focused test |
| Stale node/mission/attempt/soldier revision | Typed failure and no partial mutation | Store guards and aggregate regression |
| Empty node | `TARGET_UNAVAILABLE`; due state and history remain intact | Focused test |
| Full cargo | `CARGO_FULL`; no node decrement or due loss | Focused test |
| Tool/role drift | `RECOVERY_REQUIRED` or `TOOL_INCOMPATIBLE`; no client-selected yield | Focused test |
| Worker skip | `RECOVERY_REQUIRED`; durable clock and due state unchanged | Focused test |
| Crash after state/cargo/event step | Transaction rollback; due work remains retryable | Injected failure test |
| Restart before due | Same due marker reaches one extraction | Restart test |
| Two attempts on one node | Node revision serializes ownership; loser/contest policy is a later task | Boundary intentionally open |

## Findings

- **P2 — scheduler composition remains open:** the production/default worker does not yet compose all
  gameplay phase handlers. This is visible in the evidence and is outside task029; a later task must
  wire the handlers before hosted/always-on claims.
- **P2 — cadence and return are intentionally incomplete:** the first extraction clears its consumed
  marker and leaves `WORKING`; the next task must define the recurring marker, capacity/target-depleted
  transition, return route, and deposit boundary without reusing this event as a second effect.
- **P3 — legacy cargo provenance:** schema migration permits nullable provenance for pre-v4 rows so
  existing data is not fabricated. Later combat/deposit code must treat such rows as legacy and must
  not silently assign a new source or mission.
- **P3 — presentation:** cargo and extraction history are not yet in a browser projection; no UI claim
  is made from this process evidence.

No blocker or cross-module contradiction remains inside task029's bounded scope.

## Closure and reopen trigger

Task029 may close as `runtime_verified` for one local extraction boundary. Reopen if extraction is
allowed to credit coins, if node/cargo state is written outside one transaction, if the first marker
fires at arrival time, if the role/tool or world identity can be client-selected, if a second scheduler
can process the same due work, or if recurring cadence/return/deposit is added without a new challenge.
