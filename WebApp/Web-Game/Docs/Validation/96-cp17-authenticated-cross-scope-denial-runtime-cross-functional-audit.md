# CP-17 Authenticated Cross-Scope Denial Runtime Cross-Functional Audit

**Status:** LOCAL PRODUCTION-LIKE DENIAL VERIFIED; HOSTED DENIAL AND ROLLBACK REMAIN OPEN  
**Date:** 2026-09-03  
**Checkpoint:** CP-17  
**Task:** [`SK-TASK-079`](../Tasks/SK-TASK-079-cp17-authenticated-cross-scope-denial-rehearsal.md)  
**Evidence:** [`SK-EVID-070`](../Evidence/SK-EVID-070-cp17-authenticated-cross-scope-denial-runtime-verification.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)

## Question and verdict

Can a valid session reach the real Game command path while the server prevents it from assigning
the other player's soldier, and does a rejected attempt leave no gameplay effect?

**Verdict:** Yes for the local production-like boundary. Two deterministic Clerk-mode subjects were
bootstrapped through the real entrypoint; Player A → Player B and Player B → Player A mission
commands both returned the fixed `403`/`NOT_OWNER` result; the world, economy, soldier, resource,
mission, attempt, and event projections remained unchanged; rejection identities were durable and
an exact retry remained rejected; and a client-supplied `player_id` was stopped by strict parsing.
The hosted denial row remains open because the supported browser seam cannot issue an arbitrary
authenticated request without reading credentials or adding a production bypass. No rollback or
read-restore was executed.

## Evidence reviewed

- [`SK-EVID-070`](../Evidence/SK-EVID-070-cp17-authenticated-cross-scope-denial-runtime-verification.md): real local HTTP entrypoint, Clerk-mode server resolver, bidirectional denial, durable no-mutation readback, stable retry, and strict client-authority rejection.
- [`SK-EVID-068`](../Evidence/SK-EVID-068-cp17-independent-contexts-concurrent-hosted-runtime-verification.md): preceding hosted Player A/Player B scope and positive command slices.
- [`SK-EVID-069`](../Evidence/SK-EVID-069-cp17-hosted-restart-backup-continuity-runtime-verification.md): hosted restart, backup, reconnect, browser-absent continuity, and unauthenticated WebSocket rejection.
- [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md): owning CP-17 production identity, admission, and closure gate.
- [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md): one-service, one-Volume, one-writer hosted topology.

## Findings by decision impact

| Severity | Finding | Cross-functional effect | Disposition |
|---|---|---|---|
| Resolved | The server derived Player A and Player B scope from the authenticated subject in Clerk mode | HTTP admission, mission service, persistence, and page-facing scope share one authority source | Preserve server-derived scope; do not accept player/shelter/world fields from the command body |
| Resolved | A → B and B → A foreign-soldier commands both returned `403` with `NOT_OWNER` and an empty revision vector | The privacy-preserving error does not disclose the target player's current state | Keep the fixed error shape and avoid target-specific diagnostics |
| Resolved | World, shelters, soldiers, resource nodes, missions, attempts, and Domain Events remained unchanged | Ownership denial cannot create gameplay, economy, cargo, event, or projection side effects | Keep the rejection transaction side-effect free; only the rejection identity is durable |
| Resolved | Both rejected idempotency keys persisted `outcome=rejected`, and the exact A → B retry returned the same result | Network retry is safe and cannot duplicate a rejection effect or turn it into success | Retain command/retry/payload identity binding |
| Resolved | An extra client `player_id` field returned `400` before worker execution | A caller cannot override the server-derived authority through a permissive envelope | Keep exact-key strict parsing for all state-changing commands |
| High | The deliberate denial has not been exercised against `game.sleepless-kingdom.com` with real Clerk sessions | Positive two-player hosted projections do not yet prove the live mutation boundary | Obtain an owner-approved authenticated request seam or keep the hosted row explicitly open; never add a production test endpoint |
| Medium | No rollback/read-restore rehearsal was run | The CP-17 backup is verified and preserved, but restore mechanics are not yet a demonstrated release claim | Run one disposable restore rehearsal only if final release confidence needs it; do not infer restore from backup creation |

## Cross-functional chain check

```text
Clerk-derived subject
  -> server player/shelter/world scope
  -> strict typed command
  -> HTTP admission
  -> WorkerCommandGateway
  -> MissionService ownership check
  -> privacy-preserving NOT_OWNER response
  -> durable rejection identity
  -> no mutation in world/economy/mission/event projections
```

The local chain passed in both directions. The hosted positive scope chain is already recorded, but
the deliberate hostile input and its live no-mutation readback are a separate proof obligation.

## Minimum next verification

Keep the current hosted Player A and Player B identities unchanged. If an approved authenticated
request seam becomes available, send exactly one foreign-soldier command per direction, read back
both private projections and durable records, and capture the exact `403` body. If the only route
requires credential extraction, browser injection, or a production bypass, record that limitation
and leave the gate open. Treat rollback/read-restore as an independent optional rehearsal against
the preserved operational backup; it is not required to claim the local denial result.

## Claim limits and reopen triggers

This audit supports local production-like authenticated scope denial at ladder level 4. It does not
support hosted denial, real Clerk token verification, WebSocket command parity, rollback execution,
Cloud Receiver or Local Connector delivery, WebMCP dynamic action, Agent wake, judge reproduction,
or `hosted_verified` closure. Reopen if the session resolver, command envelope, ownership predicate,
idempotency schema, HTTP/WebSocket route, hosted request seam, deployment, Volume, or source identity
changes.
