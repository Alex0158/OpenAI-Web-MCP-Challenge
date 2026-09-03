# CP-17 Hosted Restart, Backup, and Continuity Cross-Functional Audit

**Status:** HOSTED RESTART AND RECONNECT SLICE VERIFIED; DENIAL, BROWSER ABSENCE, AND ROLLBACK REMAIN OPEN  
**Date:** 2026-09-03  
**Checkpoint:** CP-17  
**Task:** [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md)  
**Evidence:** [`SK-EVID-069`](../Evidence/SK-EVID-069-cp17-hosted-restart-backup-continuity-runtime-verification.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)

## Question and verdict

Can the hosted Game service restart in place, keep its mounted SQLite world, and let both
authenticated player pages reconnect to the same authoritative state?

**Verdict:** Yes for the named restart/reconnect slice. The Railway service restarted without a new
deployment or Volume replacement; a consistent SQLite backup was created and hash-verified; the
public health contract returned to `ready`; both pages visibly transitioned to `CLOSED`/stale and
then explicitly reconnected to `READY`; the same world ID, event cursor, coins, mission rows, and
private shelter scopes were read back; and the world clock continued advancing. This is ladder level
6 evidence for hosted continuity. It does not close browser-free progression, authenticated
cross-player denial, rollback, or the complete `hosted_verified` gate.

## Evidence reviewed

- [`SK-EVID-069`](../Evidence/SK-EVID-069-cp17-hosted-restart-backup-continuity-runtime-verification.md): backup, Railway restart, health recovery, browser reconnect, persistence readback, and direct unauthenticated WebSocket rejection.
- [`SK-EVID-068`](../Evidence/SK-EVID-068-cp17-independent-contexts-concurrent-hosted-runtime-verification.md): preceding independent-context concurrent scope and settlement slice.
- [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md): one-service, one-replica, one-Volume SQLite topology.

## Findings by decision impact

| Severity | Finding | Cross-functional effect | Disposition |
|---|---|---|---|
| Resolved | A read-only `node:sqlite` `VACUUM INTO` backup was created and downloaded with matching SHA-256 | Persistence recovery now has a concrete pre-restart artifact, while the world kept its existing authority | Retain the remote artifact and local copy outside the repository; label it an operational copy, not a provider snapshot |
| Resolved | Railway restarted deployment `218112db-21b0-4c49-8758-50e02dc6352c` in place | Process supervision and Volume identity remained stable; no rebuild or deployment replacement was introduced | Keep one supervised writer and explicit `/data` Volume topology |
| Resolved | Health returned HTTP `200` with `live=true` and `ready=true` after restart | Admission can reopen only after the process and world are ready | Preserve separate liveness/readiness handling |
| Resolved | Both pages showed `CLOSED`/stale during downtime and required explicit reconnect | The UI does not conceal a stale realtime connection or allow commands against an old projection | Preserve visible stale state and full-snapshot reconnect |
| Resolved | Player A and Player B reconnected to `shelter-a`/`shelter-b` with prior economy and mission state | Clerk identity, server scope, page projection, WebSocket, worker, and SQLite state compose across restart | Preserve server-derived identity as the only scope authority |
| Resolved | World event cursor remained `251` while world time advanced from the pre-restart backup | Restart does not reseed or duplicate the durable event history | Keep idempotent named-world bootstrap and cursor continuity |
| Resolved | Unauthenticated and invalid-bearer realtime upgrades returned HTTP `401` after restart | Reboot does not weaken the WebSocket admission boundary | Keep direct wire rejection in the hosted rehearsal matrix |
| High | No authenticated wrong-scope command was attempted | Positive private projections do not yet prove mutation denial for a forged Player A → Player B target | Use a supported non-production or owner-approved authenticated test seam; never add a production bypass |
| High | Both browser tabs remained open in the user's session | The restart window proved connections close and recover, but not a clean interval with no browser present | Run a short browser-absent observation before final hosted closure, preserving the tabs for reconnect |
| Medium | No rollback or restore was executed | The backup is verified and available, but restore mechanics remain unproven | Perform only if needed for final release confidence; do not claim rollback from backup creation alone |

## Cross-functional chain check

```text
Railway service restart -> health ready -> same Volume/world -> Clerk scope -> page stale state
                                                      -> explicit reconnect -> READY projection
```

The chain passed through process, storage, auth, transport, projection, and UI boundaries. The
remaining denial and browser-absence rows are deliberately separate because neither can be inferred
from restart success.

## Minimum next verification

Preserve the current clean Player A and Player B identities. Execute one authenticated wrong-scope
command per identity through an approved test seam, then perform a short observation while both
realtime connections are absent. Record the typed denial and clock progression separately. Only then
decide whether a rollback/read-restore rehearsal is necessary before marking CP-17 `hosted_verified`.

## Claim limits and reopen triggers

This audit supports hosted restart/reconnect continuity at ladder level 6. It does not support
browser-free progression, authenticated cross-player denial, rollback execution, Cloud Receiver or
Local Connector delivery, WebMCP dynamic action, Agent wake, judge reproduction, or submission. Reopen
if the deployment, Volume, Clerk mapping, process topology, persistence contract, or canonical origin
changes.
