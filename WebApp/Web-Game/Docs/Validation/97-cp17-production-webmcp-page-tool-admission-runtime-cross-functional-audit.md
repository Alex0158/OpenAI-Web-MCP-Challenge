# CP-17 Production-like WebMCP Page-tool Admission Runtime Cross-Functional Audit

**Status:** LOCAL PRODUCTION-LIKE PAGE-TOOL ADMISSION VERIFIED; HOSTED AND AGENT GATES REMAIN OPEN  
**Date:** 2026-09-03  
**Checkpoint:** CP-17  
**Task:** [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md)  
**Evidence:** [`SK-EVID-071`](../Evidence/SK-EVID-071-cp17-production-webmcp-page-tool-admission-runtime-verification.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)

## Question and verdict

Does the production-like Clerk admission boundary also protect the existing WebMCP page-tool HTTP
surface, while preventing a caller from choosing another player's scope?

**Verdict:** Yes for the local production-like boundary. A Player A Clerk-mode session reached the
real page-tool route and received a private `inspect_shelter_state` read scoped to `cp17-world`,
`player-a`, and `shelter-a`; the response carried the no-store/cookie-vary cache contract; and an
input containing `player_id=player-b` was rejected with the fixed `400`/`PAGE_TOOL_INPUT_INVALID`
response before worker execution. The production-like fixture route remained unavailable. Hosted
page-tool execution, genuine WebMCP registration, dynamic recall, Agent wake, and Re-entry delivery
remain separate gates.

## Evidence reviewed

- [`SK-EVID-071`](../Evidence/SK-EVID-071-cp17-production-webmcp-page-tool-admission-runtime-verification.md): local production-like Clerk page-tool read, cache headers, strict scope rejection, and fixture exclusion.
- [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md): canonical page read capability for one supported local Codex session.
- [`SK-EVID-070`](../Evidence/SK-EVID-070-cp17-authenticated-cross-scope-denial-runtime-verification.md): local production-like command ownership denial and no-mutation boundary.
- [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md): accepted one-service Railway/SQLite/Clerk hosting topology.

## Findings by decision impact

| Severity | Finding | Cross-functional effect | Disposition |
|---|---|---|---|
| Resolved | The page-tool read used the same Clerk resolver and server-derived scope as bootstrap and typed commands | Auth, page admission, worker gateway, persistence, and private projection share one identity authority | Preserve the resolver-derived scope; do not add page-specific identity input |
| Resolved | `inspect_shelter_state` returned Player A's world, player, shelter, and shelter identity | Page-facing WebMCP reads cannot silently observe another shelter through a production-like route | Keep the existing scope envelope and private projection boundary |
| Resolved | `Cache-Control: no-store` and `Vary: Cookie` were present | Authenticated page responses are not reusable across the two demo identities by an intermediary cache | Preserve the current response headers on page-tool reads and failures |
| Resolved | A client `player_id` field returned `400` before worker execution | Page-tool callers cannot override the server-derived authority with permissive read input | Keep exact-key parsing for all page-tool inputs |
| Resolved | The fixture bootstrap route remained unavailable in the same process | Production-like admission has no silent local-fixture fallback | Keep fixture mode and Clerk mode mutually exclusive |
| High | This is local production-like evidence only | It does not establish Railway page-tool reachability, browser WebMCP registration, or hosted identity continuity for the route | Keep hosted and canonical browser claims separate |
| High | No dynamic recall was attempted | A read admission proof does not prove the continuation grant, Re-entry signal, or state-changing action path | Preserve the CP-13/16 dynamic action gate and require a fresh provenance-bound trace |

## Cross-functional chain check

```text
Clerk subject
  -> server player/shelter/world scope
  -> page-tool HTTP admission
  -> strict input contract
  -> WorkerCommandGateway read
  -> scoped page projection
  -> cache-safe response
```

The chain passed without introducing a second queue, clock, identity map, or authority path. The
strict parser stops a client-selected scope before the worker and persistence layers.

## Minimum next verification

Keep this local result as the production-like page admission baseline. When the approved Eddy
protocol-v0.2 handoff and a supported hosted authenticated request seam are available, run one fresh
canonical page read and one dynamic continuation trace through the real external path. Do not use a
credential-extraction workaround or a production-only test endpoint to manufacture hosted evidence.

## Claim limits and reopen triggers

This audit supports only local production-like page-tool admission at ladder level 4. It does not
support hosted page-tool execution, genuine browser WebMCP registration, dynamic recall, Agent wake,
Cloud Receiver or Local Connector delivery, rollback/read-restore, judge reproduction, or
`hosted_verified` closure. Reopen if the session resolver, page-tool route/input contract, cache
headers, scope envelope, deployment/source identity, or external handoff changes.
