# CP-12 Human Gatherer Dispatch Runtime Cross-Functional Audit

**Status:** ACCEPTED FOR THE NAMED LOCAL HUMAN GATHERER DISPATCH AND AUTHORITATIVE RECONCILIATION SCOPE  
**Date:** 2026-09-02  
**Task:** [`SK-TASK-045`](../Tasks/SK-TASK-045-cp12-human-gatherer-dispatch-and-authoritative-reconciliation.md)  
**Evidence:** [`SK-EVID-034`](../Evidence/SK-EVID-034-cp12-human-gatherer-dispatch-runtime-verification.md)  
**Decision:** [`ADR-GAME-0031`](../Decisions/ADR-GAME-0031-cp12-human-gatherer-dispatch-command-and-reconciliation.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)

## Scope and verdict

This audit challenges the final Task045 path across browser eligibility and accessibility, strict
session and privacy, command/retry identity, mission authority, shared admission, worker ordering,
durable rejection, realtime reconciliation, restart, UI truth, and downstream effects.

**Verdict:** accept `SK-TASK-045` as `runtime_verified` for one local Rock GATHERER dispatch from the
ordinary page. The path preserves one server mutation authority and one renderable projection
ingress. It does not close autonomous progression, continuous movement, independent sessions,
positive WebMCP, Re-entry, production identity, hosted behavior, or the complete CP-16 trace.

## Cross-functional review

| Surface | Final result | Disposition |
|---|---|---|
| Page eligibility | A current `READY` snapshot exposes resident soldiers and sensed `AVAILABLE` Wood/Rock nodes. Mission state decides eligibility; the joined top-level soldier row supplies the revision. Fixed role/tier/return and target-derived AXE/PICKAXE are visible. | Accepted for the fixed fixture. MissionService remains final policy authority. |
| Session and privacy | Only an existing recognized local fixture session reaches media/body parsing and command admission. Missing/foreign soldiers collapse to revision-free `403`; foreign/missing/depleted/unsensed targets collapse to `TARGET_UNAVAILABLE` after soldier ownership is known. | Accepted for the explicit non-production fixture; no production-auth claim. |
| Command contract | The exact 2 KiB JSON envelope carries distinct bounded command and retry identities plus current soldier revision. Query, method, media, size, schema, fixed-value, and readiness failures remain typed transport failures. | Accepted. No route, owner, player, shelter, mission, attempt, event, or coordinate is client authority. |
| Domain ordering | Existing replay is checked first. For a new owned-soldier request, revision is validated before mutable mission policy. MissionService then owns resident/active state, sensing, availability, tool match, route, attempt, and transaction. | Accepted after focused Reds fixed stale ordering and durable rejection handling. |
| Identity and store integrity | `command_id` enters the request fingerprint and event causation; `idempotency_key` remains retry identity. The store validates exact event identity and typed payload before mutation. Success/rejection collisions and forged inputs fail closed. | Accepted for current callers. Global same-command/new-key behavior remains a later ledger decision. |
| Admission and FIFO | Movement and dispatch share one synchronous page lease and one server per-player admission instance. Direct gateway operations remain FIFO, including command then full snapshot; HTTP handlers do not advance time. | Accepted. Public load limits and a durable queue are outside this increment. |
| Reconciliation | Success exposes only bounded identity and committed revision minima. A matching same-attempt frame or the accepted stable-mission advancement rule may settle; wrong identity/low revisions receive at most one follow-up and then remain stale. | Accepted. No HTTP row rendering, second snapshot endpoint, or optimistic mission state. |
| Rejection freshness | Exact rejected replay retains the stored rejection effect/code while a serialized post-gateway read supplies the live owned-soldier revision. Foreign replay remains revision-free. | Accepted; the rejection cannot be rewritten by later state. |
| Late, unknown, and reconnect outcomes | Unknown transport outcome triggers one authoritative readback without automatic mutation retry. Same-scope late completion may reconcile its token; changed scope clears token, selection, and status and ignores the completion. | Accepted for one submitted mutation. A wall-time acceptance deadline remains open. |
| UX and accessibility | The actual optimized page used labelled native selects, fieldset/legend, derived policy text, fixed cargo-risk copy, textual state, and a separate polite result. Keyboard Enter submitted the form; pending shared admission was visible; no horizontal overflow or browser warning/error appeared in the observed desktop viewport. | Accepted for the named local desktop surface. Mobile/touch and a dedicated DOM harness remain open. |
| Persistence and restart | One mission, attempt, soldier transition, due marker, event, and committed retry record survived reload and process restart with distinct causal/retry identity. | Accepted at local SQLite/process level. Unshipped legacy fingerprints fail closed. |
| Downstream boundaries | World time, player movement, cargo, coins, combat, Agent Signal slots, outbox delivery, WebMCP, and Re-entry remained unchanged. | Accepted. Dispatch is an initiator, not a scheduler or full gameplay loop. |

## Residual risks and reopen routing

1. **Command identity ledger:** Persistence is indexed by idempotency key and does not reserve one
   `command_id` globally. Resolve this before multiple ordinary-UI, WebMCP, or Agent callers can share
   the mutation surface.
2. **Acceptance deadline and admission:** A submitted command with an unknown or never-settled
   outcome can retain the page-wide lease until explicit reconnect/readback. Define a deadline only
   with the broader lifecycle and public-load policy.
3. **Target projection:** The current read model has no general node-owner or
   `dispatchEligible` field. The fixture UI truthfully presents latest observed availability and lets
   MissionService decide final legality. Reopen before general world placement or hidden ownership.
4. **Rendered test infrastructure:** Source-level tests bind the component contract; the real browser
   supplies current rendered semantics, keyboard, layout, and runtime proof. A framework/CSS change
   reopens the browser requirement.
5. **Legacy fingerprint boundary:** Pre-Task045 unshipped fingerprints omit `commandId` and fail
   closed as `DUPLICATE_COMMAND`. Do not add a weak compatibility fallback without a migration
   decision and replay proof.
6. **World progression:** The persisted due marker is deliberately inert at world time `0`. One
   accepted all-phase scheduler must compose travel, extraction, encounters, return, deposit, timers,
   restart recovery, and realtime publication before continuous-world claims.
7. **External capability:** `SK-ISSUE-001` still gates positive WebMCP and therefore live Re-entry.
   Human dispatch is useful ordinary UI, but it is not substitute capability evidence.

## Exact disposition

`SK-TASK-045` is accepted as `runtime_verified` at the local process/browser level captured by
`SK-EVID-034`. Reopen this audit if mission command identity, rejection durability/privacy, fixture
scope, shared admission, gateway ordering, authoritative reconciliation, page eligibility, or
scheduler composition changes.
