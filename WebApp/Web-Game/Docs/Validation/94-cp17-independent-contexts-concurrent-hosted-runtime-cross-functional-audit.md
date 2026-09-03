# CP-17 Independent Contexts and Concurrent Hosted Runtime Cross-Functional Audit

**Status:** TWO-CONTEXT HOSTED SLICE VERIFIED; AUTHORIZATION AND CONTINUITY REMAIN OPEN  
**Date:** 2026-09-03  
**Checkpoint:** CP-17  
**Task:** [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md)  
**Evidence:** [`SK-EVID-068`](../Evidence/SK-EVID-068-cp17-independent-contexts-concurrent-hosted-runtime-verification.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)

## Question and verdict

Can two independently authenticated browser contexts use the same hosted world concurrently while
the server keeps their player/shelter scope separate and the worker remains authoritative?

**Verdict:** Yes for the named two-context slice. Chrome/Player A and Codex Browser/Player B stayed
connected at the same time, each saw only its own shelter scope, both accepted a scoped GATHERER
command, both completed extraction/deposit settlement, and both received advancing snapshots from
the same hosted world clock. The result is ladder level 5; it does not close the deliberate denial,
wire-failure, recovery, or `hosted_verified` gates.

## Evidence reviewed

- [`SK-EVID-068`](../Evidence/SK-EVID-068-cp17-independent-contexts-concurrent-hosted-runtime-verification.md): simultaneous Chrome and Codex Browser scope, command, settlement, and realtime readback.
- [`SK-EVID-065`](../Evidence/SK-EVID-065-cp17-hosted-deployment-and-clerk-domain-runtime-verification.md): successful Railway deployment, custom HTTPS/TLS, Clerk DNS/SSL/JWKS, and signed-out entry surface.
- [`SK-EVID-066`](../Evidence/SK-EVID-066-cp17-player-one-hosted-session-command-runtime-verification.md) and [`SK-EVID-067`](../Evidence/SK-EVID-067-cp17-player-two-hosted-session-command-runtime-verification.md): preceding single-player hosted slices.
- [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md): one supervised process, one SQLite writer, one persistent Volume, and two invite-only identities.

## Findings by decision impact

| Severity | Finding | Cross-functional effect | Disposition |
|---|---|---|---|
| Resolved | Chrome Player A and Codex Browser Player B stayed authenticated concurrently | The hosted browser journey no longer depends on sequential sign-in state | Keep the two browser surfaces as the minimum independent-context rehearsal setup |
| Resolved | Each projection exposed its own shelter and omitted the opposite shelter | Server-derived scope is visible at the page and causal-history boundary | Preserve server scope as the sole owner of player/shelter identity |
| Resolved | Two commands were accepted concurrently and settled independently | HTTP admission, worker scheduling, event history, and wallet settlement compose across both identities | Retain one command gate per scope and do not add a client-side shared queue |
| Resolved | Both realtime projections advanced from world time `3857` to `3859` | The two pages observe one worker-owned clock rather than independent browser timers | Keep world time server-owned and treat a stale/closed connection as a visible failure |
| High | No deliberate wrong-scope command was sent | Privacy readback is positive, but ownership denial is still untested | Send one crafted cross-scope attempt per identity through the supported test seam and record the typed rejection |
| High | No direct `/realtime` upgrade or failure response was captured | UI readiness proves the working path but not protocol-level parity | Capture the upgrade admission and a wrong-scope/invalid-session failure during the next rehearsal |
| High | Browser-free progression and restart/Volume readback were not exercised | Always-on continuity and durable world identity remain unproven | Disconnect both pages, observe worker progress, restart the service, and reread the same world/cursor |
| Medium | Chrome reports WebMCP unsupported while Codex Browser reports it registered | Capability is browser/session-specific and must not be conflated with gameplay or hosted auth | Keep capability evidence separate; use the supported Codex Browser only for dynamic WebMCP claims |
| Medium | Backup/restore, rollback, and Eddy handoff remain outside this run | Recovery and Agent delivery claims cannot be inferred from concurrent gameplay | Record the recovery receipt and exact Receiver handoff separately |

## Cross-functional chain check

```text
Chrome / player1 -> player-a / shelter-a -> GATHERER -> extraction -> deposit
Codex / player2  -> player-b / shelter-b -> GATHERER -> extraction -> deposit
                                  \       shared hosted world clock       /
```

Both chains were observed concurrently. The page projections and causal histories remained scoped,
while deliberate denial, wire failure, browser absence, restart, and external delivery remain
explicit gates.

## Minimum next verification

Keep both clean contexts signed in. Use the supported test seam to submit one deliberate cross-scope
request from each identity and record the typed denial, then capture the `/realtime` admission and
invalid-session behavior. Disconnect both pages, observe world progress, restart Railway with the
same Volume, reread the world/cursor, and record backup/rollback evidence. Do not call the task
hosted-verified until those rows pass.

## Claim limits and reopen triggers

This audit supports a two-context hosted slice at ladder level 5. It does not support deliberate
cross-player denial, direct WebSocket parity, browser-free continuity, restart/reconnect, backup/
rollback, WebMCP dynamic action, Re-entry, Eddy delivery, or judge reproduction. Reopen if the
canonical origin, Clerk mapping, command/snapshot contract, deployment, Volume, process topology,
or worker authority changes.
