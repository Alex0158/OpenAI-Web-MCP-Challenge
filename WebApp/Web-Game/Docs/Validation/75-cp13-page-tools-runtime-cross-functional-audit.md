# CP-13 Page Tools Runtime Cross-Functional Audit

**Status:** LOCAL IMPLEMENTATION AND CANONICAL PAGE READ CAPABILITY VERIFIED; Re-entry and hosted delivery remain open  
**Date:** 2026-09-03  
**Task:** [`SK-TASK-061`](../Tasks/SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md)  
**Challenge:** [`Validation/74`](74-cp13-page-tools-implementation-preimplementation-challenge.md)  
**Evidence:** [`SK-EVID-047`](../Evidence/SK-EVID-047-cp13-page-tools-local-runtime-verification.md) and [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)

## Audit question

Does the implemented CP-13 page surface preserve the existing world, session, mission, persistence,
realtime, and human UI authorities while adding only the accepted four reads and the continuation-gated
recall action?

## Evidence boundary

- The focused page suite is 9/9 under Node `v24.20.0`, with parser, gateway, entrypoint HTTP query/
  media/body gates, continuation/recall, semantic schema readback, unsupported behavior, abort cleanup,
  fail-closed registration/readback error coverage, and stale in-flight response rejection after
  reconnect.
- CP-12 projection, fixture/session, reconnect, and dispatch suites and the server recall transition
  suite remain green in the same source window; the reconnect (3/3) and projection (5/5) checks were
  rerun after the stale-generation guard; TypeScript has no errors.
- The local page capability instrument is a disposable test double; it is not used as browser evidence.
  [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md) records a
  separate genuine Codex In-app Browser adapter run that discovered the canonical page reads and invoked
  one read-only tool. Receiver/Connector, Re-entry delivery, hosted process, and judge evidence remain
  outside this audit.

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| Page authority | The page calls one entrypoint-owned endpoint and receives server-derived scope; it does not create a worker, store, resolver, queue, or renderable state. | Pass; existing gateway remains the only runtime ingress. |
| Session/privacy | The HttpOnly fixture cookie resolves world, player, binding, and shelter. Query/body identity is rejected or ignored; full projection ownership is checked before rows are mapped. | Pass for the local fixture scope. |
| Read contracts | Four closed schemas and snake-case result envelopes are frozen in the shared contract. Snapshot output is fixed-size and bounded; mission and history outputs cannot expose raw routes or hidden arrays. | Pass; no new contract version. |
| History visibility | History uses the existing player/shelter visibility predicate, limit 50, and an opaque scope digest cursor. Foreign cursors fail before event rows are returned. | Pass. |
| Recall grant | A recall tool is absent until a durable server signal slot advertises the exact bounded action. The server checks signal identity, slot status, cursor range, event visibility, and soldier identity. | Pass for the injected local grant seam; external delivery remains open. |
| Mission transition | Page recall delegates to the verified `MissionService`/persistence transition, preserving current revisions, route, role, and cargo and refusing combat through the existing typed boundary. | Pass by composition with SK-EVID-046; page does not duplicate transition logic. |
| Idempotency | Command and idempotency identities are distinct and forwarded unchanged. Duplicate bodies replay the durable server result without a second event. | Pass. |
| Realtime reconciliation | Recall response is metadata only. The client requests the existing full snapshot and never writes an optimistic phase, position, cargo, or coin value. | Pass. |
| Capability lifecycle | Registration starts after the first accepted full snapshot; schema readback is semantic; AbortController generation cleanup runs on reconnect, stale projection, socket failure, scope change, and unmount. Concurrent continuation reads share one recall-registration promise per generation, the recall tool becomes ready only after readback succeeds, and registration/readback failures abort the generation with a visible human fallback. | Pass in the registrar and lifecycle source; real host behavior remains open. |
| Canonical adapter | A fresh `gpt-5.6-sol` task configured with `medium` used the genuine Codex In-app Browser adapter on the canonical page. Same-page readback returned the four accepted reads and `inspect_client_snapshot` completed read-only. | Pass at ladder level 6 for the named local page/session; dynamic recall grants and Re-entry delivery remain separate. |
| Unsupported UX | Missing/failed capability stays visible as unsupported/error/stale while movement and dispatch remain available. Disabled fixture mode returns `WEBMCP_UNAVAILABLE` without creating a session. | Pass. |
| Cross-checkpoint compatibility | Existing CP-06 clock, CP-08 projection/gateway, CP-09 dispatch/route, CP-10 extraction/deposit, and CP-11 combat/reissue authorities remain unchanged and their affected tests pass. | Pass for the executed local suites. |
| SideChat scope | The `assign_soldier_mission` proposal from SideChat remains deferred; no target selector or Agent dispatch semantics entered CP-13. | Pass; no scope promotion. |

## Race and failure review

| Risk | Control | Result |
|---|---|---|
| Foreign read or recall | Server session scope and binding are the only identity source; recall provenance is shelter/binding scoped. | Pass |
| Schema host normalization | Recursive canonical JSON comparison ignores object-key insertion order while preserving array order. | Pass |
| Stale callback after reconnect | Registration generation and AbortController invalidate old callbacks; stale realtime states stop the registrar. | Pass locally |
| Stale in-flight page response | Generation is rechecked after fetch and JSON awaits, before continuation registration or reconciliation. | Pass locally |
| Concurrent continuation reads | A per-generation registration promise serializes the first valid continuation grant; later reads await it instead of calling `registerTool` again, and readiness waits for semantic readback. | Pass locally |
| Capability registration/readback failure | Partial initial registration, initial schema mismatch, and continuation recall schema mismatch abort the active generation, remove every registered tool, and expose `error` while human controls remain available. | Pass locally |
| High-frequency page reads | Reads share the existing process-local FIFO and bounded body/results; no new timer or durable queue is introduced. | Accepted local boundary; measured load remains a later gate |
| Signal changes after registration | The current generation binds to the server signal observed by the shelter read; a stale signal returns typed `STALE_REENTRY_CONTEXT`. | Accepted; a later signal-refresh policy is outside this increment |
| Recall during combat | Existing server encounter guard runs before mutation. | Pass by predecessor transition suite |
| Duplicate recall | Existing persistence idempotency fingerprint and result replay remain authoritative. | Pass |
| Partial response/transport failure | Domain effects are never inferred from HTTP metadata; the page requests a full snapshot after committed recall and leaves state unchanged on unknown/error. | Pass for implemented callback path |
| Unsupported host | No polyfill or simulated adapter success is used; status is visible and human controls stay active. | Pass |

## Audit decision

1. The local implementation satisfies the accepted Validation/74 boundary for the four reads and the
   continuation-gated recall path without adding a second authority or changing `SK-MVP-0.2`.
2. [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md) records
   a fresh `gpt-5.6-sol` plus `medium` task using the genuine Codex In-app Browser. It discovered the
   canonical page's four reads through same-page adapter readback and completed one read-only
   invocation, so `SK-TASK-061` is `verified` for its named ladder-level 6 scope.
3. An earlier assigned Sol subagent had no callable browser and remains a valid negative capability
   observation for that task context; the new thread result demonstrates that model selection and
   thread/browser context are separate capability variables. No REST, DOM automation, or polyfill was
   used in either result.
4. Reopen this audit if a real host exposes a different registration/readback shape, if a new signal
   must refresh an already registered action, if page reads require queue/backpressure policy, or if the
   SideChat dispatch proposal is promoted into the CP-13 contract.

## Exact conclusion

**The CP-13 page implementation is locally coherent and the canonical page's four read tools are
verified through a genuine `gpt-5.6-sol` plus `medium` In-app Browser adapter run. This closes
`SK-TASK-061` for its named ladder-level 6 read capability; it does not prove the dynamic recall action,
Agent grants, Re-entry delivery, hosted continuity, independent-browser isolation, or judge reproduction.**
