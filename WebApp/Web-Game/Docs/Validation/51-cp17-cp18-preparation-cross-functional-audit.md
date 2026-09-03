# CP-17 through CP-18 Preparation Cross-Functional Audit

**Status:** ACCEPTED FOR DOCUMENTATION-LEVEL PREPARATION; hosted and judge runtime remain gated  
**Date:** 2026-09-02  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)  
**Tasks:** [`SK-TASK-017`](../Tasks/SK-TASK-017-cp17-hosted-continuity-preimplementation-pack.md), [`SK-TASK-018`](../Tasks/SK-TASK-018-cp18-judge-reproduction-preimplementation-pack.md)  
**Routing map:** [`CP-13 through CP-18 implementation seam map`](../Engineering/10-cp13-cp18-implementation-seam-map.md)  

## Question

Are CP-17 hosted continuity and CP-18 reviewer reproduction prepared well enough that a later
implementation session can choose, verify, and hand off the host without reopening settled game
authority or inventing evidence?

## Evidence reviewed

- [`SK-TASK-017`](../Tasks/SK-TASK-017-cp17-hosted-continuity-preimplementation-pack.md) and
  [`CP-17 scenario fixtures`](../Scenarios/17-cp17-hosted-continuity-fixtures.md) now contain a
  host-neutral acceptance matrix, deployment rehearsal, failure branches, and evidence fields.
- [`SK-TASK-018`](../Tasks/SK-TASK-018-cp18-judge-reproduction-preimplementation-pack.md) and
  [`CP-18 scenario fixtures`](../Scenarios/18-cp18-judge-reproduction-fixtures.md) now contain a
  clean-identity rehearsal, artifact manifest, claim ladder, and redaction boundary.
- [`Engineering/06-operations-and-hosting.md`](../Engineering/06-operations-and-hosting.md) keeps
  the one-process local authority, separate liveness/readiness, durable recovery, and proof gates.
- [`Engineering/10-cp13-cp18-implementation-seam-map.md`](../Engineering/10-cp13-cp18-implementation-seam-map.md)
  maps current files and future seams without creating runtime code or a second authority.
- [`SK-ISSUE-001`](../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md) still blocks
  positive WebMCP capability evidence; no hosted or judge claim can bypass it.

## Findings and dispositions

| Surface | Finding | Disposition |
|---|---|---|
| Host selection | Provider, store, supervision, TLS, URL, backup, and rollback remain open, but the required observable behavior is now defined without provider assumptions. | Accepted; choose a provider only after CP-16 local closure and an explicit host decision. |
| Process authority | The packet preserves one entrypoint-owned worker/page/store topology until a measured need justifies a split. | Accepted; no browser heartbeat, serverless timer, or second worker may own world time. |
| Durable continuity | The rehearsal requires the same snapshot, schema, event cursor, outbox, lease, and world identity before and after restart. | Accepted; a deployment log or process exit code cannot prove persistence. |
| Health and admission | `live`, `ready`, world readiness, and degraded command admission are separate rows with typed failure expectations. | Accepted; a live but degraded process must not accept authoritative commands. |
| Page and realtime | Hosted page, command, and `/realtime` must use the same server-derived world/shelter scope and contract version. | Accepted; proxy or client-side snapshot substitution is a failure, not a fallback. |
| CP-13 capability | WebMCP discovery/invocation remains an independent capability gate, including at a hosted URL. | Accepted; unsupported or synthetic capability stays explicitly gated. |
| CP-14 external handoff | Receiver/Connector version, endpoint, acknowledgement, lease/retry, idempotency, active-Thread behavior, and redaction are listed as handoff fields. | Accepted; the game tree does not implement or modify the external services. |
| Recovery and rollback | The packet requires a named build, compatible schema, backup/recovery handle, same-world readback, and first-failure preservation. | Accepted; no rollback claim follows until the path is actually exercised. |
| Reviewer identity | CP-18 requires a clean browser identity and independent readback rather than private developer context. | Accepted; shared tabs, hidden state, or narration alone cannot produce a judge claim. |
| Artifact integrity | Endpoint, source, architecture, causal timeline, capability/delivery, recovery, visual, limitations, and redaction artifacts have owners and invalidation conditions. | Accepted; missing or unredacted artifacts lower or invalidate the claim. |
| Submission boundary | Live submission fields and comparison rules remain owned by the applicable official rules. | Accepted; CP-18 prepares evidence but does not invent eligibility or product-comparison claims. |
| Implementation routing | The seam map identifies current files, first Red proofs, transitive checks, gates, and forbidden shortcuts from CP-13 through CP-18. | Accepted; no speculative runtime skeleton is introduced before the named gates. |

## Reconciled preparation decisions

1. CP-17 uses a host-neutral acceptance matrix before provider selection. A candidate is accepted only
   through actual endpoint, process, health, storage, scope, realtime, restart, and rollback readback.
2. The MVP keeps one process topology and one world authority. A second worker, scheduler, storage
   authority, browser heartbeat, or polling substitute requires a measured decision and an ADR.
3. Hosted continuity is a compound claim: endpoint, liveness/readiness, durable state, same-world
   binding, restart catch-up, reconnect, and command ownership must all be evidenced.
4. CP-18 consumes CP-16/17 evidence and cannot repair a missing capability, external handoff, two-session,
   storage, or restart gate. A screenshot, deploy log, or local stub remains a lower-level claim.
5. The implementation seam map is routing only. It preserves the existing gateway/store/event
   authority and leaves CP-13 capability and CP-14 external contracts as explicit predecessors.
6. No deployment, credential use, external message, provider commitment, or runtime code was performed
   in this preparation increment.

## Verification disposition

The CP-17 and CP-18 task records and scenario fixtures now provide documentation-level handoff
packets, executable rehearsal orders, failure branches, artifact requirements, claim limits, and
reopen triggers. This audit supports `specified` preparation closure only. It does not support
runtime, capability, external delivery, hosted, or judge closure.

## Residual risks and reopen triggers

- Reopen CP-17 when CP-16 changes the fixture or causal story, a host/provider decision changes the
  process or storage contract, or a live deployment reveals sleep, proxy, readiness, persistence, or
  rollback behavior not covered by the matrix.
- Reopen CP-18 when CP-17 evidence, CP-13/14 capability or external handoff, the clean-identity setup,
  artifact policy, or official submission rules change.
- Stop implementation if a host requires a second state authority, client-selected identity, hidden
  retry, unbounded browser dependency, unredacted evidence, or a silent contract rewrite.
