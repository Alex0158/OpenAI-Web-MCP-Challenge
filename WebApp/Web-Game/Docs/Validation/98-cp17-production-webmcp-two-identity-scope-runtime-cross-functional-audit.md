# CP-17 Production-like WebMCP Two-identity Scope Runtime Cross-Functional Audit

**Status:** LOCAL TWO-IDENTITY PAGE-TOOL SCOPE VERIFIED; HOSTED AND AGENT GATES REMAIN OPEN  
**Date:** 2026-09-03  
**Checkpoint:** CP-17  
**Task:** [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md)  
**Evidence:** [`SK-EVID-072`](../Evidence/SK-EVID-072-cp17-production-webmcp-two-identity-scope-runtime-verification.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)

## Question and verdict

Can both admitted identities use the same WebMCP page-tool route while each private read remains
bound to its own shelter?

**Verdict:** Yes for the local production-like boundary. Player A and Player B both reached the real
Clerk-mode page-tool route and received the expected `cp17-world`/player/shelter scope. Player B's
serialized read did not contain Player A's shelter identifier, and a client-supplied `player_id` on
the Player A request remained a fixed `400`/`PAGE_TOOL_INPUT_INVALID` rejection. One entrypoint, worker,
store, route, and resolver served both identities. Hosted page-tool execution, canonical browser
registration, dynamic recall, and Agent/Re-entry delivery remain separate gates.

## Evidence reviewed

- [`SK-EVID-072`](../Evidence/SK-EVID-072-cp17-production-webmcp-two-identity-scope-runtime-verification.md): both local production-like Clerk scopes, opposite-shelter exclusion, and strict client-authority rejection.
- [`SK-EVID-071`](../Evidence/SK-EVID-071-cp17-production-webmcp-page-tool-admission-runtime-verification.md): initial Player A page-tool admission, cache isolation, and fixture exclusion.
- [`SK-EVID-070`](../Evidence/SK-EVID-070-cp17-authenticated-cross-scope-denial-runtime-verification.md): local command ownership denial and no-mutation boundary.
- [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md): accepted one-service Railway/SQLite/Clerk topology.

## Findings by decision impact

| Severity | Finding | Cross-functional effect | Disposition |
|---|---|---|---|
| Resolved | Both Clerk subjects use the same entrypoint and resolver but receive distinct server-derived scopes | Auth, HTTP routing, worker gateway, persistence, and private projection share one identity authority | Preserve one resolver and one route; never add identity fields to page input |
| Resolved | Player A receives only `shelter-a`, and Player B receives only `shelter-b` | A shared page-tool surface does not collapse the two players' private state | Keep scope in every read envelope and bind it to the authenticated subject |
| Resolved | Player B's serialized read contained no `shelter-a` identifier | The privacy boundary is checked at the page projection, not only at bootstrap | Keep private projections server-derived and avoid broad world dumps |
| Resolved | A Player A request carrying `player_id=player-b` failed with `400` before worker execution | Page-tool callers cannot override identity through permissive read input | Retain exact-key input parsing |
| High | The result is local production-like evidence | It does not establish Railway page-tool reachability or real Clerk/browser behavior for this route | Keep hosted and browser capability claims separate |
| High | No dynamic action or external delivery was exercised | Two-identity read isolation does not prove continuation grant, Re-entry, or effect acknowledgement | Preserve the separate CP-13/14/16 handoff gates |

## Cross-functional chain check

```text
Clerk subject A/B
  -> server player/shelter/world scope
  -> shared page-tool route
  -> strict input boundary
  -> WorkerCommandGateway
  -> private A/B projection
```

The chain passed for both identities without a second authority path, queue, clock, or transport.

## Minimum next verification

Retain this two-identity local proof as the page admission baseline. When the external protocol-v0.2
handoff and an approved hosted authenticated request seam are available, repeat the same two-identity
read against the canonical origin, then separately prove dynamic continuation and effect authority.

## Claim limits and reopen triggers

This audit supports only local production-like two-identity page-tool scope isolation at ladder level
4. It does not support hosted page-tool execution, genuine WebMCP registration, dynamic recall, Agent
wake, Cloud Receiver or Local Connector delivery, rollback/read-restore, judge reproduction, or
`hosted_verified` closure. Reopen if the resolver, route, projection, cache boundary, deployment/source
identity, or external handoff changes.
