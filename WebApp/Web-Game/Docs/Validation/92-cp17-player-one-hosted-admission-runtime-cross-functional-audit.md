# CP-17 Player One Hosted Admission and Runtime Cross-Functional Audit

**Status:** BOUNDED PLAYER A HOSTED SLICE VERIFIED; TWO-PLAYER CLOSURE REMAINS OPEN  
**Date:** 2026-09-03  
**Checkpoint:** CP-17  
**Task:** [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md)  
**Evidence:** [`SK-EVID-066`](../Evidence/SK-EVID-066-cp17-player-one-hosted-session-command-runtime-verification.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)

## Question and verdict

Does one real Clerk Production identity cross the hosted admission boundary and complete a
server-authoritative Game action without client-selected scope or fixture fallback?

**Verdict:** Yes for the named Player A slice. The owner-authenticated `player1` session rendered
the server-derived `player-a` projection, maintained a ready realtime connection while world time
advanced, accepted one GATHERER command, and observed five extraction events followed by one deposit
and wallet credit. This is a bounded hosted level-4 result; it is not a two-player or
`hosted_verified` result.

## Evidence reviewed

- [`SK-EVID-066`](../Evidence/SK-EVID-066-cp17-player-one-hosted-session-command-runtime-verification.md): one authenticated Player A browser journey, command acceptance, worker progression, and settlement readback.
- [`SK-EVID-065`](../Evidence/SK-EVID-065-cp17-hosted-deployment-and-clerk-domain-runtime-verification.md): successful Railway deployment, custom HTTPS/TLS, Clerk DNS/SSL/JWKS, and signed-out entry surface.
- [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md): one supervised process, one SQLite writer, one persistent Volume, and two invite-only identities.

## Findings by decision impact

| Severity | Finding | Cross-functional effect | Disposition |
|---|---|---|---|
| Resolved | A real `player1` session reached the canonical hosted Game and exposed Player 1 / `player-a` state | Clerk presentation, server bootstrap, and page scope are joined for one identity | Retain the server-derived scope; never accept a client-selected player or shelter |
| Resolved | One GATHERER command was accepted and reconciled from the hosted authoritative snapshot | HTTP command admission, worker scheduling, event history, and economy settlement compose on the deployed source | Keep the typed command and snapshot reconciliation as the only UI success path |
| Resolved | Five extraction events were followed by one deposit and Coins `5` | Cargo remains unbanked until shelter deposit and the visible settlement agrees with causal history | Preserve the event order and settlement boundary; duplicate/replay proof remains separate |
| High | Only Player A was exercised | Two-identity isolation and cross-player denial remain unproven | Run Player B in an independent clean context and attempt one deliberate cross-scope request |
| High | The page reported realtime readiness, but no direct protocol capture was recorded | WebSocket admission parity and typed upgrade rejection remain open | Capture the `/realtime` admission and failure rows during the two-context rehearsal |
| High | Browser-free progression and restart/Volume readback were not exercised | Always-on worker continuity and durable world identity remain unproven | Disconnect both pages, observe worker progress, then restart and read back the same world/cursor |
| Medium | Backup/restore, rollback, and external Eddy handoff remain outside this run | Recovery and Agent delivery claims cannot be inferred from a successful mission | Record a disposable recovery receipt and the exact Receiver handoff separately |

## Cross-functional chain check

```text
Clerk session (player1)
  -> server-derived player-a / shelter-a / world scope
  -> hosted bootstrap and realtime projection
  -> typed GATHERER command
  -> worker route and extraction
  -> shelter deposit and Coins credit
  -> causal history readback
```

The complete Player A chain above was observed in one hosted run. The Player B, cross-scope,
browser-free, restart, recovery, and external Receiver links remain explicitly gated. No client
identity, fixture cookie, browser heartbeat, or generated-domain auth shortcut was used.

## Minimum next verification

Use a clean independent browser context for `player2`. Prove its server-derived bootstrap and one
valid command, then attempt a Player A scope request and record the typed denial. Keep both pages
open long enough to verify realtime scope, disconnect them to observe worker progress without a
browser, restart the Railway service with the same Volume, and record the world/cursor plus
backup/rollback receipt. Do not call the task hosted-verified until those rows have evidence.

## Claim limits and reopen triggers

This audit supports one Player A hosted runtime slice at ladder level 4. It does not support
two-player isolation, direct WebSocket parity, continuous-world continuity, WebMCP dynamic action,
Re-entry, Eddy delivery, backup/rollback, or judge reproduction. Reopen if the canonical origin,
Clerk mapping, command/snapshot contract, deployment, Volume, process topology, or worker authority
changes.
