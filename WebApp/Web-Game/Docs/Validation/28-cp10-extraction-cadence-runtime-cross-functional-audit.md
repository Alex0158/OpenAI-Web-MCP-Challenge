# CP-10 Extraction Cadence Runtime Cross-Functional Audit

**Status:** Complete for the bounded local recurring-extraction and `RETURNING` handoff  
**Date:** 2026-09-02  
**Task:** [`SK-TASK-030`](../Tasks/SK-TASK-030-cp10-extraction-cadence-and-return-handoff.md)  
**Evidence:** [`SK-EVID-019`](../Evidence/SK-EVID-019-cp10-extraction-cadence-runtime-verification.md)  
**Decision:** [`ADR-GAME-0021`](../Decisions/ADR-GAME-0021-cp10-extraction-cadence-and-return-handoff.md)

## Verdict

The local process-runtime boundary is verified for successive Wood/Rock extraction milestones and
the capacity/depletion handoff to `RETURNING`. The existing schema-v4 provenance stack, paired due
markers, equal-weight capacity, node timer metadata, event order, idempotency, rollback, restart,
and server-owned identity agree with the accepted `SK-MVP-0.2` contract. The phase handlers are
injected in the test harness; this record makes no default-worker, browser, WebMCP, Re-entry, hosted,
or production claim.

## Business chain audit

```text
CP-09 dispatch
  → route arrival at T
  → paired extraction marker T + 2
  → one authoritative unit at due D
  → same provenance stack + node decrement
  → next marker D + 2, or capacity/depletion stop
  → MissionAutoReturned (and ResourceDepleted on the final node unit)
  → later return navigation and shelter deposit
```

| Boundary | Verified behavior | Disposition |
|---|---|---|
| Identity/ownership | World, mission attempt, soldier, node, cargo, and shelter visibility are checked before mutation; deterministic cargo and milestone ids bind the attempt and consumed due marker | Pass |
| Role/loadout | Persisted GATHERER and Wood/Axe or Rock/Pickaxe pairing remains authoritative; no client yield or tool value is accepted | Pass |
| Time/order | Movement precedes extraction; arrival arms `T + 2`; one due marker yields one unit; next due is derived from consumed `D`, not handler delay | Pass |
| Cargo/economy | The existing per-attempt/resource stack increments quantity and capacity by one; equal-weight shape is enforced; no coin is created in the field | Pass |
| Capacity stop | The fifth committed slot clears both due markers and transitions mission and attempt to `RETURNING` in the same transaction | Pass |
| Node depletion | The final unit reaches quantity zero, writes the 30-second marker, emits `ResourceDepleted`, and hands the mission to `RETURNING` | Pass |
| Event/history | Event order is `CargoExtracted`, optional `ResourceDepleted`, optional `MissionAutoReturned`; affected revisions and shelter/world visibility are persisted together | Pass |
| Duplicate/stale | Stable attempt/due idempotency replays the complete result; expected revisions and exact event metadata reject stale or forged effects | Pass |
| Malformed/recovery | Invalid aggregate capacity, incompatible role/tool, empty target, and skipped durable boundary fail visibly before partial mutation | Pass |
| Rollback/restart | Injected failure leaves state and cursor unchanged; restart resumes the durable marker once | Pass |
| Contest | SQLite revision/transaction ordering prevents a negative node; an already-depleted target currently returns a typed target/revision failure and requires the later contest policy | Deferred to next bounded task |
| Return/settlement | `RETURNING` is a durable handoff; route movement, home crossing, deposit, and coins remain separate transactions | Deferred to CP-10 follow-ons |
| Projection/UI | No browser projection, cargo HUD, or client authority changed | Deferred to CP-12 |
| WebMCP/Re-entry | Routine extraction stays in Domain Event history; no Agent Signal or wake-up is generated here | Deferred to CP-13/14 |
| Operations/hosting | File-backed WAL and local worker are exercised through the injected phase seam; default all-phase composition and hosted continuity are unproven | Deferred to CP-16/17 |

## Failure and race matrix

| Case | Expected result | Evidence |
|---|---|---|
| Normal successive due | Stack +1, node −1, paired due `D + 2`, one `CargoExtracted` | Focused cadence tests |
| Fifth slot | Fifth unit commits; due markers clear; `RETURNING` and one auto-return event | Focused capacity test |
| Final node unit | Node zero, marker `world_time + 30`, depletion event, partial return | Focused depletion test |
| Duplicate due/idempotency | Stored result and all event ids; no second quantity, revision, or cursor | Focused replay/restart tests |
| Caller-selected next marker | `INVALID_INPUT`; prior aggregate remains unchanged | Boundary-hardening test |
| Forged quantity/payload | `INVALID_INPUT`; node, cargo, phase, and history remain unchanged | Boundary-hardening test |
| Stale mission/attempt/node/cargo revision | Typed stale/recovery failure and no partial mutation | Store guards and aggregate |
| Malformed equal-weight stack | `RECOVERY_REQUIRED`; no additional unit | Focused malformed test |
| Injected failure after state/cargo/events | SQLite rollback; due work remains retryable | Focused rollback test |
| Restart before next marker | Durable marker is processed once at the same cadence | Focused restart test |
| Two attempts on one node | Serialized revision prevents negative quantity; loser remains an explicit recovery/contest boundary | Deferred contest policy |

## Findings

- **P2 — scheduler composition remains open:** `WorldWorkerModule`'s default production construction
  does not yet install all gameplay phase handlers. The injected seam is sufficient for this local
  claim; a later composition task must prove the always-on world before hosted/demo claims.
- **P2 — contest policy remains open:** a second attempt that observes a node consumed by an earlier
  transaction receives a typed target/revision failure. The persistence boundary is safe, but the
  worker-level loser outcome and node reservation policy need a dedicated task before two-soldier
  contest continuity is claimed.
- **P2 — return and settlement remain separate:** `RETURNING` carries cargo safely, but no route,
  home-boundary, deposit, or coin ledger effect is implied by this task.
- **P3 — stack timestamp semantics:** the aggregate keeps the first unit's acquisition time; later
  milestone times remain in the event history. Any weighted or per-unit cargo consumer must reopen
  the ADR.
- **P3 — no presentation proof:** the local result has no browser/UI or Agent wake-up evidence.

No blocker or cross-module contradiction remains inside the registered task boundary. The next task
must resolve the deferred contest outcome or explicitly preserve it as a typed recovery policy before
return navigation is promoted as a complete economy chain.

## Closure and reopen trigger

Task-030 may close as `runtime_verified` for recurring extraction and the `RETURNING` handoff. Reopen
if a new schema/event/contract version, weighted capacity, node reservation, respawn execution, return
navigation, deposit/coins, default scheduler composition, or public/browser authority enters this
boundary without a fresh challenge.
