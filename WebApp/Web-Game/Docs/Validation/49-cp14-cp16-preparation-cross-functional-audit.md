# CP-14 through CP-16 Preparation Cross-Functional Audit

**Status:** ACCEPTED FOR DOCUMENTATION-LEVEL PREPARATION; runtime implementation remains gated  
**Date:** 2026-09-02  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)  
**Tasks:** [`SK-TASK-014`](../Tasks/SK-TASK-014-cp14-reentry-adapter-preimplementation-pack.md), [`SK-TASK-015`](../Tasks/SK-TASK-015-cp15-contract-race-verification-preimplementation-pack.md), [`SK-TASK-016`](../Tasks/SK-TASK-016-cp16-local-vertical-slice-preimplementation-pack.md)

## Question

Are the CP-14 Re-entry adapter, CP-15 contract/race matrix, and CP-16 local vertical-slice
preparations precise enough for later implementation without changing the accepted authority, event,
identity, settlement, capability, or human consequence boundaries?

## Evidence boundary

- CP-05 through CP-11 provide the named local persistence, clock, fixture, mission, extraction,
  settlement, combat, respawn, and reissue seams.
- CP-12 provides one-browser hydration plus the explicit same-scope manual reconnect and visible
  stale-fallback path verified under `SK-TASK-043`/`SK-EVID-032`. The two-tab observation remains a
  documented independent-context limitation.
- CP-13 has a `runtime_verified` negative capability result in [`SK-EVID-030`](../Evidence/SK-EVID-030-cp13-webmcp-capability-probe.md); positive WebMCP discovery and invocation remain gated by [`SK-ISSUE-001`](../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md).
- No CP-14 external Receiver/Connector handoff, live Re-entry delivery, CP-15 aggregate, or CP-16
  level-5 slice has been runtime-verified.

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| CP-14 event authority | `CargoLostToMonster` remains the only G2 continuation-eligible event. The preparation maps the existing `signalSlot` and `outboxDelivery` records instead of reclassifying events in a browser or adapter. | Accepted; no new event or schema is introduced. |
| CP-14 coalescing and backpressure | The handoff preserves one pending/in-flight signal per opaque binding and shelter, deferred cursor aggregation, same-identity retry, and safe Thread-boundary delivery. | Accepted; the world never waits and routine events remain in durable history. |
| CP-14 delivery semantics | `ContinuationDelivered` is tied to external acknowledgement and is explicitly separated from `force_recall_soldier` command success. | Accepted; a local stub cannot be promoted to live external evidence. |
| CP-14 external ownership | Version, endpoint, binding, idempotency, acknowledgement, lease/retry, active-Thread, and redaction requirements are listed as handoff gates. | Accepted; the game branch does not implement or modify Eddy's Receiver/Connector. |
| CP-13 dependency | The negative adapter result keeps WebMCP implementation and live Re-entry blocked. The preparation does not add a polyfill or a fake tool list. | Accepted; CP-14 remains preparation-only until positive capability and external contract evidence exist. |
| CP-15 coverage | The matrix is keyed by checkpoint boundary and expected failure, with explicit `pass`, `gated`, `expected-fail`, `flaky`, and `not-run` outcomes. | Accepted; percentage coverage and an absent aggregate command cannot hide an untested contract. |
| CP-15 race/replay | The failure response preserves server authority, entity revisions, idempotency, deterministic worker order, file-backed restart, and visible degraded transport behavior. | Accepted; a later aggregate cannot retroactively close a gated predecessor. |
| CP-16 demonstration | The runbook separates reset, two-session scope, browser absence, world progression, cargo loss, delivery, page reread, recall, restart, event burst, and evidence closure. | Accepted; each step has an observable state/event/claim boundary. |
| CP-16 two-session gate | The rehearsal requires genuinely independent contexts and explicitly stops the level-5 claim when the browser only offers shared-profile tabs. | Accepted; the current CP-12 limitation is not hidden or substituted. |
| Human consequence boundary | Migration, siege, destructive upgrades, and irreversible recovery remain human-review boundaries. Delivery context cannot authorize them. | Accepted; no preparation step bypasses the player decision. |
| Operations and evidence | The packet requires Node 24 identity, fresh file-backed fixtures, authoritative world time, wall-time lease separation, redaction, and explicit skipped/gated checks. | Accepted for local preparation; no hosted or judge claim follows. |

## Reconciled preparation decisions

1. CP-14 uses a narrow game-side `ReentryDeliveryPort`/`pumpOnce` seam only as a later test or host
   invocation boundary. It is not a new scheduler, queue, worker, or authority.
2. CP-14 may use a local contract stub only after the positive CP-13 gate; the stub proves mapping,
   lease, coalescing, retry, acknowledgement, and deferred context, not external delivery.
3. CP-15 closes by contract-row completeness and explicit claim limits. There is no invented numeric
   coverage threshold or aggregate `npm test` command.
4. CP-16 uses explicit worker/world-time advances, a fresh database path, and a timestamped causal
   trace. Browser, WebMCP, external delivery, hosted, and judge claims remain separate.
5. The completed CP-12 reconnect task changed only page lifecycle and retained the accepted scope and
   authority boundaries. Any later acceptance deadline, identity, wire, or authority change reopens
   these preparations before implementation.

## Verification disposition

The task records and scenario fixtures now contain documentation-level handoff matrices, replay
orders, branch rules, evidence fields, and stop conditions. This audit supports `specified` closure
for CP-14, CP-15, and CP-16 preparation only. It does not support runtime, capability, slice, hosted,
or judge closure.

## Residual risks and reopen triggers

- Reopen CP-14 when CP-13 positive capability, the external versioned handoff, or the accepted signal
  envelope changes.
- Reopen CP-15 when any predecessor contract, failure code, test harness, aggregate boundary, or
  evidence policy changes.
- Reopen CP-16 when the CP-12 session/reconnect boundary, CP-14 delivery result, timing policy, reset
  procedure, or recording/redaction policy changes.
- Stop implementation if any path requires a second state authority, client-selected identity,
  hidden retry, silent event loss, gameplay grace period, or external-service modification in the game
  branch.
