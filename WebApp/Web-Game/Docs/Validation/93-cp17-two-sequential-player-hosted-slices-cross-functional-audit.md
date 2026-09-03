# CP-17 Two Sequential Player Hosted Slices Cross-Functional Audit

**Status:** BOUNDED PLAYER A AND PLAYER B SLICES VERIFIED; INDEPENDENT ISOLATION REMAINS OPEN  
**Date:** 2026-09-03  
**Checkpoint:** CP-17  
**Task:** [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md)  
**Evidence:** [`SK-EVID-066`](../Evidence/SK-EVID-066-cp17-player-one-hosted-session-command-runtime-verification.md), [`SK-EVID-067`](../Evidence/SK-EVID-067-cp17-player-two-hosted-session-command-runtime-verification.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)

## Question and verdict

Have both provisioned identities crossed the hosted Game path and completed a server-authoritative
action without fixture admission or client-selected scope?

**Verdict:** Yes for two sequential single-player slices. Player A and Player B each reached a
server-derived projection, accepted one GATHERER command, completed extraction/deposit settlement,
and observed advancing realtime snapshots. The runs used one browser surface sequentially; they do
not prove independent simultaneous sessions, cross-player denial, or the full CP-17 hosted gate.

## Evidence reviewed

- [`SK-EVID-066`](../Evidence/SK-EVID-066-cp17-player-one-hosted-session-command-runtime-verification.md): Player A session, command, extraction/deposit, and realtime readback.
- [`SK-EVID-067`](../Evidence/SK-EVID-067-cp17-player-two-hosted-session-command-runtime-verification.md): Player B session, command, extraction/deposit, and realtime readback.
- [`SK-EVID-065`](../Evidence/SK-EVID-065-cp17-hosted-deployment-and-clerk-domain-runtime-verification.md): successful Railway deployment, custom HTTPS/TLS, Clerk DNS/SSL/JWKS, and signed-out entry surface.
- [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md): one supervised process, one SQLite writer, one persistent Volume, and two invite-only identities.

## Findings by decision impact

| Severity | Finding | Cross-functional effect | Disposition |
|---|---|---|---|
| Resolved | Player A crossed the hosted session, command, worker, settlement, and realtime path | One provisioned identity can exercise the deployed Game loop under server authority | Preserve the Player A evidence and do not infer a second session from it |
| Resolved | Player B crossed the same hosted session, command, worker, settlement, and realtime path | The second provisioned identity is wired to `player-b` and `shelter-b` rather than the Player A scope | Preserve the server-derived mapping and keep client identity out of command authority |
| High | The two runs were sequential in one browser surface | Cookie isolation and simultaneous scope privacy remain unproven | Use two independent clean contexts and retain both authenticated pages during the test |
| High | No deliberate cross-player request or direct `/realtime` admission capture was recorded | Ownership denial and wire-level parity remain open | Exercise one valid command plus one cross-scope denial for each identity and capture the upgrade result |
| High | Browser-free progression and restart/Volume readback were not exercised | Always-on worker continuity and durable world identity remain unproven | Disconnect the pages, observe worker progress, restart the service, and read back the same world/cursor |
| Medium | Backup/restore, rollback, and external Eddy handoff remain outside this run | Recovery and Agent delivery claims cannot be inferred from two successful missions | Record a disposable recovery receipt and the exact Receiver handoff separately |

## Cross-functional chain check

```text
player1 -> player-a / shelter-a -> GATHERER -> extraction -> deposit -> Coins 5
player2 -> player-b / shelter-b -> GATHERER -> extraction -> deposit -> Coins 5
```

Both chains were observed in the hosted deployment. The identity mappings are distinct in the page
projection and causal history, but the sequential browser arrangement leaves simultaneous privacy,
cross-scope denial, and reconnect ownership as explicit gates.

## Minimum next verification

Open two independent clean browser contexts and keep Player A and Player B signed in at the same
time. Verify each bootstrap and realtime scope, send one valid command from each, attempt one
deliberate cross-player command, and record the typed denial. Then disconnect both pages to observe
worker progress, restart Railway with the same Volume, read back the same world/cursor, and record
backup/rollback evidence. Do not call the task hosted-verified until these rows pass.

## Claim limits and reopen triggers

This audit supports two sequential hosted Player A/Player B slices at bounded ladder level 4. It
does not support independent two-session isolation, direct WebSocket parity, continuous-world
continuity, WebMCP dynamic action, Re-entry, Eddy delivery, backup/rollback, or judge reproduction.
Reopen if the canonical origin, Clerk mapping, command/snapshot contract, deployment, Volume,
process topology, or worker authority changes.
