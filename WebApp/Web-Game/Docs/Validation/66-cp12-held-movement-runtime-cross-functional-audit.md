# CP-12 Held Movement and Touch Input Runtime Cross-Functional Audit

**Status:** RUNTIME-VERIFIED FOR THE NAMED LOCAL CLIENT PRESENTATION SCOPE; server continuous intent, default/hosted continuity, WebMCP, Re-entry, independent-browser, and final mobile-quality gates remain open  
**Date:** 2026-09-03  
**Checkpoint:** CP-12  
**Task:** [`SK-TASK-054`](../Tasks/SK-TASK-054-cp12-held-movement-and-touch-input.md)  
**Decision:** [`ADR-GAME-0035`](../Decisions/ADR-GAME-0035-cp12-snapshot-gated-held-movement.md)  
**Challenge:** [`Validation/65`](65-cp12-held-movement-preimplementation-challenge.md)  
**Evidence:** [`SK-EVID-042`](../Evidence/SK-EVID-042-cp12-held-movement-runtime-verification.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)

## Audit question

Does the client-only held-input increment make the local map feel continuous while preserving the
server-owned movement transaction, the single renderable snapshot ingress, the shared page mutation
gate, accessibility, scope isolation, and explicit lifecycle stop behavior?

## Evidence boundary

- The focused controller suite passes 13/13 under Node.js 24. It uses an injected scheduler to prove
  immediate start, authoritative-settle gating, the 180 ms minimum delay, direction replacement,
  release, blocked/unavailable stop, no queue, and unknown-recovery re-arm behavior.
- The affected ordinary-UI dispatch suite passes 31/31. Its shared page-gate assertions prove that a
  dispatch mutation blocks movement admission while an expected movement command may settle.
- TypeScript typecheck and the optimized Next.js build pass. The documentation self-tests and project
  validator pass after this record and its indexes are synchronized.
- A fresh file-backed local entrypoint was exercised in the Codex in-app browser. One authenticated
  Player A context observed labelled pointer and keyboard actions producing newer authoritative full
  snapshots, semantic controls, no warning/error logs, and clean SIGINT drain.
- The browser control API can issue a trusted press or click but cannot hold a physical key or pointer
  for a controlled duration. Therefore browser evidence proves integrated one-step gesture wiring and
  generated-click behavior; the injected scheduler is the direct multiple-step and lifecycle proof.

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| World authority | Every repeat calls the existing discrete `move_player` transport. The browser owns only an input timer and never advances world time, position, collision, fog, or revisions. | Accepted; no second mutation authority. |
| Snapshot reconciliation | A repeat is eligible only after the movement reconciliation gate accepts the matching authoritative full snapshot. No predicted tile, fractional position, interpolation ledger, or HTTP-position response was added. | Accepted under ADR-GAME-0030 and ADR-GAME-0035. |
| Single-flight timing | The controller keeps one active direction and one in-flight command. It waits for settle plus a minimum 180 ms delay; timer callbacks finding a pending or unavailable gate do nothing and never queue work. | Accepted; request rate is bounded and latency slows movement rather than building a queue. |
| Shared page mutation | `shouldBlockHeldMovement` blocks new or repeated movement when an external page mutation is pending, while allowing the expected movement command to settle. Dispatch and movement remain serialized by the existing page gate. | Accepted; no cross-feature overlap. |
| Unknown recovery | A transport-unknown movement marks the reconciliation gate `unknown`, stops the hold, and exposes `recoveryRequired`. A fresh same-scope authoritative snapshot clears that state; a new explicit press is then required. | Accepted; no hidden retry or unsafe re-arm. |
| Keyboard and focus | Focused map W-A-S-D/arrow input is modifier/composition/repeat/visibility gated. Recognized keys suppress browser scrolling even when command admission is blocked. Direction changes replace the active hold; map blur and direction-button focus transfer stop the relevant keyboard hold. | Accepted for the named local presentation. |
| Pointer and touch | Primary pointer/touch down starts one semantic hold, uses capture as a delivery aid, and stops on pointerup, cancel, lost capture, blur, hidden state, disabled state, scope change, or unmount. `touch-action: none` prevents browser gesture interference. Secondary pointers are ignored and cannot create a duplicate click. | Accepted; no native gesture or multi-pointer queue. |
| Click and accessibility | A generated click after a real pointer gesture is suppressed only for a detail-positive pointer event. Detail-zero assistive/programmatic activation remains one discrete `onMove`; keyboard Enter/Space prevent native duplicate clicks while retaining the labelled button path. | Accepted; accessible semantic activation remains available. |
| React lifecycle | Central cancellation clears keyboard refs, pointer capture, ignored-pointer bookkeeping, click suppression, and the repeat timer. Cleanup is used for blur, `visibilitychange`, non-ready state, disabled state, external page mutation, and unmount. | Accepted; no post-lifecycle request path found. |
| Stale and definitive rejection | Stale, blocked, closed, unavailable, and definitive rejected outcomes stop the held action and leave no pending timer. Existing resync and full-snapshot rules remain the recovery path. | Accepted; no rejection storm. |
| Scope and reconnect | Existing movement/page gates own scope, attempt, and revision. A late callback cannot settle a newer scope, and a scope change clears the active hold before a new explicit input. | Accepted; no cross-session mutation. |
| Server and downstream modules | No server file, command schema, persistence table, worker cadence, realtime frame, mission, cargo, combat, world-clock, WebMCP, Re-entry, Receiver, or Connector behavior changed. | Accepted; downstream gates remain independent. |
| Browser UX and evidence | The real page exposes visible status, a focusable map, labelled controls, and `aria-busy`; the local smoke observed one authoritative revision per tested gesture and empty warning/error logs. | Accepted within level-4 local presentation evidence; no production latency claim. |

## Race and failure matrix

| Race or failure | Control | Result |
|---|---|---|
| Key auto-repeat | Ignore repeated keydown; one controller hold owns cadence. | No duplicate initial command. |
| Direction changes during a request | Replace the local direction but retain the existing in-flight request. | One old command settles, then at most one new direction is admitted. |
| Movement pending while dispatch starts | Shared page gate blocks external mutation overlap. | No queued movement or dispatch. |
| Pointer leaves, cancels, or loses capture | Release capture and call the central stop path. | Timer and active direction are cleared. |
| Page blur or hidden visibility | Window/document lifecycle listeners stop the hold. | No background command stream. |
| Secondary pointer arrives | Prevent default and retain a bounded ignored-pointer target until its generated click is consumed. | The second contact cannot create a discrete duplicate. |
| Generated click follows pointer hold | Suppress only the matching detail-positive click, then clear the token. | One physical gesture maps to one command. |
| Assistive click | No pointer token and `detail === 0`. | One discrete semantic action remains available. |
| Unknown movement result | Mark the movement gate unknown and set `recoveryRequired`. | Hold stays stopped until a fresh full snapshot and new press. |
| Scope/reconnect/unmount | Existing attempt ownership plus central cleanup. | Old callbacks cannot move the new page scope. |
| Blocked map edge | Definitive domain rejection calls stop. | One visible blocked result, no retry loop. |

## Verification and claim decision

1. The controller tests, shared dispatch regressions, typecheck, build, and documentation checks are
   green at the named local scope.
2. The real browser proof validates page wiring, pointer/keyboard/button semantics, authoritative
   revision reconciliation, generated-click de-duplication, accessibility surface, and clean process
   drain. It does not claim a physical long-duration hold because the browser adapter cannot generate
   one; the injected scheduler covers that contract directly.
3. The implementation is accepted as a presentation-layer extension of the existing discrete command.
   A server-owned continuous intent, default all-phase scheduler, production identity, hosted runtime,
   independent browser delivery, WebMCP registration, Re-entry action, or final mobile layout requires
   its own task and evidence level.

## Reopen triggers

Reopen this audit if a hold overlaps or queues requests, continues after release/blur/hidden/stale/
blocked/scope loss, renders a position without an accepted snapshot, bypasses the page mutation gate,
creates a new authority or clock, needs a new command/schema/realtime message, loses semantic button
activation, or the measured local round-trip feel cannot meet the MVP walkthrough without a reviewed
server-owned intent.

## Exact conclusion

**`SK-TASK-054` is runtime-verified for the local snapshot-gated held-input controller and its real
desktop pointer/keyboard page wiring. The cross-module review found no unresolved contradiction in the
named scope. Server/default/hosted continuous movement, independent browser identities, WebMCP,
Re-entry, and final mobile-quality claims remain open and are not promoted by this audit.**
