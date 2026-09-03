# CP-10 Deposit and Coin Settlement Runtime Cross-Functional Audit

**Status:** Complete for the bounded local G2 settlement outcome  
**Date:** 2026-09-02  
**Task:** [`SK-TASK-033`](../Tasks/SK-TASK-033-cp10-deposit-and-coin-settlement.md)  
**Evidence:** [`SK-EVID-022`](../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md)  
**Decision:** [`ADR-GAME-0024`](../Decisions/ADR-GAME-0024-cp10-deposit-and-coin-settlement.md)  
**Challenge:** [`33-cp10-deposit-and-coin-settlement-preimplementation-challenge.md`](33-cp10-deposit-and-coin-settlement-preimplementation-challenge.md)

## Verdict

The selected settlement boundary closes the normal G2 gatherer loop without moving authority into a
browser command or inventing a second mission identity. A worker-owned `deposit` phase re-reads the
durable `DEPOSITING` attempt, validates the complete Wood/Rock cargo aggregate and its source
provenance, derives the shelter wallet delta, and commits the cargo removal, coin credit, resident
handoff, terminal attempt history, ordered events, and idempotency result in one SQLite transaction.
The completed mission row can be reused by the existing manual dispatch path with an incremented
mission revision and a fresh attempt. No contradiction remains inside this bounded task.

The end-to-end local business chain is:

```text
CP-09 dispatch
  -> route arrival at T
  -> CP-10 extraction every 2 world seconds
  -> capacity or node depletion -> RETURNING
  -> reverse route -> exact home crossing -> DEPOSITING
  -> CargoDeposited -> positive CoinsCredited when applicable
  -> soldier and mission at AT_SHELTER; attempt retained as terminal history
  -> later manual dispatch reuses the resident mission row
```

## Cross-functional boundary review

| Boundary | Verified behavior | Disposition |
|---|---|---|
| Identity and ownership | The store re-reads `world_id`, `mission_id`, `mission_attempt_id`, `soldier_id`, and the soldier-derived `shelter_id`; the worker binding and shelter-visible event scope are checked | Pass |
| Phase and lifecycle | Only an active GATHERER with mission and attempt phase `DEPOSITING` and a `FIELD` soldier is eligible; settlement yields a resident soldier/mission and terminal attempt history | Pass |
| Cargo authority | The complete active-attempt cargo aggregate is read from persistence; cross-soldier, cross-attempt, orphan, malformed, non-Wood/Rock, source-mismatched, non-positive, and unsafe rows enter typed recovery | Pass |
| Economy | Wood is one coin per unit and Rock is three coins per unit; zero cargo produces zero delta and no positive credit event; wallet overflow is rejected | Pass |
| Event order and visibility | `CargoDeposited` is persisted before positive-only `CoinsCredited`; both use deterministic event/work identities and shelter visibility with exact server-derived payloads | Pass |
| Revision and atomicity | Soldier, mission, attempt, shelter, and cargo revisions are checked; cargo, wallet, lifecycle, events, and idempotency commit or roll back together | Pass |
| Idempotency | `mission-deposit:<mission_attempt_id>:<homeCrossingWorldTime>` binds one crossing; an exact retry returns the stored result and a changed request is rejected | Pass |
| Clock and restart | The service accepts at most one durable world boundary, derives the crossing from the persisted handoff, and settles a delayed attempt once after file-backed restart | Pass |
| Dispatch compatibility | Settlement clears the resident assignment fields; the existing server dispatch path reuses the completed row, increments its mission revision, and creates a new attempt | Pass |
| Extraction and return handoff | CP-09/CP-10 arrival, extraction cadence, contest, and reverse-route home crossing remain upstream boundaries; deposit does not re-run them | Pass |
| Failure and recovery | Typed stale, ownership, invalid-input, and recovery outcomes preserve the last valid `DEPOSITING` state and exposed cargo; injected failures roll back the transaction | Pass |
| Snapshot and projection | The result and events are available to later read models, but no browser snapshot shape or UI was changed in this increment | Deferred to CP-12 |
| WebMCP and Re-entry | No public deposit command, Agent selector, coalescer, or thread wake is introduced; durable events remain available for a later explicit consumer | Deferred to CP-13/14 |
| Scheduler and operations | The deposit handler is exercised in a local worker/clock harness with file-backed SQLite; default all-phase scheduling, multi-worker ownership, and hosted continuity remain unproven | Deferred to CP-16/17 |
| Combat and human consequence | Death, loot, combat, breach, and automatic reissue cannot touch this transaction and remain separate boundaries | Deferred to CP-11 |

## Failure and race matrix

| Case | Required outcome | Runtime proof |
|---|---|---|
| Wood cargo | Remove validated cargo, credit one coin per unit, emit both ordered events, and release the resident | Focused Wood test |
| Rock cargo | Apply three coins per unit using the server-derived resource type | Focused Rock test |
| Mixed cargo | Aggregate Wood and Rock deterministically in one wallet mutation | Focused mixed-cargo test |
| Zero cargo | Complete the resident handoff with zero delta and only `CargoDeposited` | Focused zero-cargo test |
| Exact duplicate | Replay the committed result without a second deletion, credit, revision, or event | Idempotency replay test |
| Changed duplicate | Reject the same key with a changed request before mutation | Changed-request test |
| Forged event or foreign visibility | Reject payload or ownership before deleting cargo or changing the wallet | Forged-payload/visibility test |
| Stale revision | Reject stale shelter, soldier, mission, attempt, or cargo state and preserve `DEPOSITING` | Stale-revision test |
| Orphan or malformed provenance | Return `RECOVERY_REQUIRED` and retain exposed cargo for diagnosis/retry | Orphan/provenance tests |
| Wallet overflow | Return `RECOVERY_REQUIRED` without changing coins or lifecycle | Overflow test |
| Failure after cargo/state/events | Roll back all state, event cursor, and idempotency rows; leave the same logical crossing retryable | Injected rollback tests |
| Delayed boundary or restart | Process the durable crossing once at the next allowed boundary | Boundary and restart tests |
| Resident redispatch | Preserve terminal attempt history and reuse the mission row with a new attempt and revision | Manual redispatch test |

## Evidence and claim limits

The focused settlement suite passes **16/16**. The CP-09/CP-10 transitive aggregate passes **69/69**,
and the affected CP-04 through CP-10 aggregate passes **142/142**. Node 24 typecheck, production
build, and dependency dry-run also pass. The exact execution identity and command strings are bound in
[`SK-EVID-022`](../Evidence/SK-EVID-022-cp10-deposit-and-coin-settlement-runtime-verification.md).

This is a process-runtime level 4 result for the local worker-owned seam. It does not support a
browser, WebMCP, Re-entry, hosted, judge, default-scheduler, multi-worker, combat, loot, migration,
or production-balance claim. Those boundaries must retain their own task, challenge, evidence, and
closure records.

## Residual risk and reopen triggers

- **P2 — scheduler composition:** Installing deposit into the default all-phase worker and proving
  continuous operation is a later checkpoint; do not infer it from the injected harness.
- **P2 — combat and loss:** Monster death, PvP transfer, breach, and reissue must define how exposed
  cargo interacts with a `DEPOSITING` or resident boundary before implementation.
- **P2 — presentation and capabilities:** A later projection may show wallet history and causal
  settlement events, while WebMCP/Re-entry may select a bounded human-approved action; neither is
  silently implied here.
- **P3 — scale and balance:** Multi-worker fairness, large-world scheduling, ledger history, and
  economy tuning remain open after the G2 trace.

Reopen this audit if cargo provenance or weighting, conversion values, shelter ownership, mission-row
reuse, event order/idempotency, world-clock phase order, schema/contract version, automatic reissue,
combat/loot, UI/WebMCP/Re-entry, default scheduler composition, or hosted execution changes.

**Exact conclusion:** **CP-10 Wood/Rock deposit, coin settlement, resident handoff, and manual
mission-row reuse are runtime-verified locally at process-runtime level 4 with no cross-functional
contradiction in scope; all deferred boundaries remain unclaimed.**

