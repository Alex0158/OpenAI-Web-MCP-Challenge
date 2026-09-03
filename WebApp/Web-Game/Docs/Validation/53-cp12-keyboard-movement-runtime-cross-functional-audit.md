# CP-12 Keyboard Movement Runtime Cross-Functional Audit

**Status:** ACCEPTED FOR THE NAMED LOCAL DISCRETE MOVEMENT AND AUTHORITATIVE RECONCILIATION SCOPE  
**Date:** 2026-09-02  
**Task:** [`SK-TASK-044`](../Tasks/SK-TASK-044-cp12-keyboard-movement-and-authoritative-reconciliation.md)  
**Evidence:** [`SK-EVID-033`](../Evidence/SK-EVID-033-cp12-keyboard-movement-runtime-verification.md)  
**Decision:** [`ADR-GAME-0030`](../Decisions/ADR-GAME-0030-cp12-discrete-keyboard-command-and-reconciliation.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)

## Scope and verdict

This audit challenges the final CP-12 path across browser focus, command/session admission, player
revision, idempotency, movement collision, worker ordering, realtime reconciliation, fog persistence,
restart, shutdown, UX, and later scheduler/WebMCP/Re-entry handoffs.

**Verdict:** accept `SK-TASK-044` as `runtime_verified` for one discrete local desktop path. The
implementation preserves one server mutation authority and one renderable projection ingress. It
does not close continuous movement, an all-phase scheduler, independent sessions, positive WebMCP,
Re-entry, production identity, or hosted behavior.

## Cross-functional review

| Surface | Final result | Disposition |
|---|---|---|
| Input and focus | One non-repeat W-A-S-D/arrow event is admitted only by the focused map; labelled buttons share the same bounded command. Repeat, composition, modifiers, hidden/unfocused document, non-map focus, missing snapshot, non-`READY`, and pending input are rejected. | Accepted. No global listener, key-repeat clock, or focus theft. |
| Session and privacy | Bootstrap alone may issue the local handle. Mutation and realtime use strict existing-session resolution. Mutation authenticates before media/body parsing, so unauthenticated malformed or oversized bodies stay `401`. | Accepted for the explicit non-production fixture; no production-auth claim. |
| Transport contract | The exact request carries distinct command and idempotency identities plus current player revision. Valid definitive domain rejections return a complete bounded `409` result; auth, framing, readiness, admission, and internal failures remain typed transport failures. | Accepted; the server derives world/player/binding and ignores no hidden client identity. |
| Domain ordering | Existing idempotency replay is first. On a new key, stale revision is durably rejected before collision; only a current command can be blocked or commit position, fog, revision, event, and idempotency atomically. | Accepted after adversarial Red exposed and corrected stale-plus-blocked precedence. |
| Command identity | `PlayerMoved.causation_id` is `command_id`; retry identity remains `idempotency_key`. Cadence crossings use deterministic but separate values. | Accepted for current client and cadence callers. Global reuse of one command id with a new idempotency key remains a later-ledger risk. |
| Gateway and lifecycle | The entrypoint calls one FIFO gateway backed by the same movement service used by worker cadence. Optimized shutdown drained and stopped cleanly with the port released. | Accepted. The dev/HMR diagnostic deadline and unbounded inherited read admission remain explicit residuals. |
| Reconciliation | HTTP success contains effect/revision/event metadata but no position. The client requests the existing full resync, and only `RealtimeProjectionClient.accept()` replaces state. One coalesced low revision receives one causal follow-up; a second remains visibly stale. | Accepted; no second projection authority or resync loop. |
| Late and unknown outcomes | A network-unknown result requests one readback and never auto-retries. Same-scope late success targets the current socket; changed-scope completion is ignored. | Accepted for at-most-one mutation submission. The user may need a manual retry after authoritative readback. |
| UX and accessibility | Direction, current position/revision, pending/blocked/stale status, keyboard help, focus ring, and labelled buttons are visible without relying on Canvas or color. The optimized page had no horizontal overflow in the observed desktop viewport. | Accepted for the named local desktop surface; mobile/touch and polished interpolation remain open. |
| Persistence and restart | Accepted movement and fog survived restart; blocked and stale rejection identity is durable. Player B and unrelated game systems remained unchanged. | Accepted at local SQLite/process level. |
| Downstream boundaries | This slice adds no browser clock, host scheduler, WebMCP tool, Agent Signal, Re-entry delivery, or production identity. | Existing CP-13/14 capability gate and future scheduler composition remain unchanged. |

## Residual risks and reopen routing

1. **Command identity ledger:** The command parser requires different, bounded identifiers and the
   current client generates fresh UUIDs, but persistence is indexed by idempotency key rather than a
   global `command_id`. Before multiple human/Agent callers share this mutation surface, either add a
   command ledger or decide and test the exact same-command/new-key rule.
2. **Gateway and connection admission:** HTTP movement is one-in-flight per server-resolved player.
   The inherited local realtime hub can still accept multiple connections whose initial/resync reads
   enter the process FIFO, which has no total queue cap. Add measured per-player or process admission
   before hostile/public load; do not add a speculative second queue here.
3. **Lifecycle coverage:** Focused tests cover admission and existing gateway closure, and the
   optimized browser lifecycle stopped cleanly. A real HTTP `429`, route-specific `STARTING` or
   `DRAINING` request, chunked oversized body, and sanitized thrown `500` are not separate browser or
   socket integration rows.
4. **Client composition:** Focused state-machine/input tests plus the real browser run replace a
   dedicated React component harness in this increment. A future UI framework or CSS-module change
   reopens browser proof.
5. **Movement feel:** The deliberate press-per-tile path is truthful but is not the final fluid game
   feel. Held intent must wait for one accepted host scheduler that composes all required world phases;
   a browser timer or movement-only interval remains forbidden.
6. **External capability:** `SK-ISSUE-001` still gates positive WebMCP and therefore the live
   Re-entry demonstration. This movement proof cannot be used as substitute evidence.

## Exact disposition

`SK-TASK-044` is accepted as `runtime_verified` at the local process/browser level captured by
`SK-EVID-033`. Reopen this audit if input cadence, player ownership, revision/idempotency ordering,
the HTTP command/failure contract, gateway admission, realtime messages, projection ownership,
snapshot history, or scheduler composition changes.
