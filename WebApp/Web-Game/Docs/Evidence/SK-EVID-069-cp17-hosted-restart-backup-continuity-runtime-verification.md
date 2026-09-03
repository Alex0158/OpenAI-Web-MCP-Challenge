# SK-EVID-069: CP-17 Hosted Backup and Restart Continuity Runtime Verification

## Identity

- Evidence ID: `SK-EVID-069`
- Related task, issue, or decision: [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md), [`SK-EVID-068`](SK-EVID-068-cp17-independent-contexts-concurrent-hosted-runtime-verification.md), and [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md)
- Evidence class: `hosted`
- Ladder level: `6` for restart/reconnect, backup readback, and browser-free continuity; denial and rollback rows remain open
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source state: Game repository `main`, HEAD `ffab63b`; hosted deployment `218112db-21b0-4c49-8758-50e02dc6352c`
- Contract version: `SK-MVP-0.2`
- Runtime versions: Railway Node.js `v24.19.0`; one Railway `game` service with one `game-data` Volume mounted at `/data`
- Provider identity: Railway project `sleepless-kingdom`, production environment, custom domain `game.sleepless-kingdom.com`
- Durable world: `sleepless-mvp-01`, database path `/data/world.sqlite`

## Objective and claim boundary

- Behavior under test: Create a consistent SQLite backup, restart the hosted application service, reconnect both authenticated page sessions, and confirm the same durable world and player state remain authoritative while the world clock continues.
- Claim this evidence may support: The named Railway service can be restarted in place without replacing the deployment or Volume; the mounted SQLite world remains readable; the two authenticated pages reconnect to their server-derived scopes; shelter coins, mission state, world identity, and event cursor survive the restart; and the hosted world clock continues after recovery.
- Claims this evidence cannot support: Independent provider snapshot retention, power-loss safety, rollback execution, deliberate cross-player command denial, Cloud Receiver/Local Connector delivery, WebMCP dynamic action, judge reproduction, or full `hosted_verified` closure.

## Preconditions and backup

- The Railway deployment was `SUCCESS`, the active instance was `RUNNING`, and the `/data` Volume was `READY` before the operation.
- The Volume contained `world.sqlite`, its WAL/SHM companions, and no prior CP-17 backup artifact.
- A read-only Node.js `node:sqlite` connection executed `VACUUM INTO '/data/world-cp17-pre-restart-20260903.sqlite'` on the running service. Railway Volume Files then downloaded that exact backup to a local temporary path outside the repository.
- Remote and downloaded backup SHA-256 matched: `9d8448dc20f0e58ddc662354d4112665de64aaae913a3f110a4f715c7a5c71d7`.
- The downloaded backup opened read-only and contained the complete expected table set, world `sleepless-mvp-01`, world event cursor `251`, shelter coins `15` and `10`, and the pre-restart mission records. The backup is a same-Volume operational copy plus a local download; it is not presented as an independent Railway provider snapshot.

## Execution

| Replayable procedure | Expected result | Actual result | Status |
|---|---|---|---|
| Read Railway project, service, deployment, and Volume state | The named production service and mounted Volume are ready for a bounded restart | Deployment `218112db-21b0-4c49-8758-50e02dc6352c` was `SUCCESS`; active instance was `RUNNING`; Volume `game-data` was `READY` at `/data` | **pass** |
| Read `/api/health` before restart | The service reports process and world admission ready | HTTP `200`; `status=ready`, `live=true`, `ready=true`; Node `v24.19.0` | **pass** |
| Create and download the SQLite backup | A readable, matching recovery artifact exists outside the repository | Remote and local SHA-256 matched; read-only inspection found the expected schema and world/player state | **pass** |
| Restart the Railway `game` service in place | The existing deployment restarts without a rebuild or Volume replacement | Railway restarted deployment `218112db-21b0-4c49-8758-50e02dc6352c`; no new deployment was created | **pass** |
| Poll the public health endpoint after restart | The service becomes live and ready again | HTTP `200`; `status=ready`, `live=true`, `ready=true`; a new process/worker instance was reported | **pass** |
| Observe both authenticated pages immediately after restart | Existing realtime connections close visibly and do not pretend to be fresh | Chrome Player A and Codex Browser Player B both showed `Connection: CLOSED`, stale snapshot messaging, and an explicit reconnect control | **pass** |
| Reconnect both pages and reread the authoritative projection | Each page returns to its own server-derived scope and current world | Both pages returned `Connection: READY`; Player A showed `shelter-a`, Player B showed `shelter-b`, and both read world time `4724` with their prior coin totals (`15` and `10`) | **pass** |
| Observe realtime after reconnect | The world clock advances independently of the reconnect request | Both pages remained `READY` and advanced from world time `4734` to `4736` over approximately 1.8 seconds | **pass** |
| Read the mounted database after recovery | The same world, cursor, shelter economy, and mission rows remain durable | SSH readback found world `sleepless-mvp-01`, cursor `251`, shelter coins `15`/`10`, and the existing mission rows including `WAITING_REVIEW` and `AT_SHELTER` states | **pass** |
| Open unauthenticated realtime after recovery | The wire remains fail-closed after restart | Direct `wss://game.sleepless-kingdom.com/realtime` with no session and with an invalid bearer each returned the expected HTTP `401` upgrade failure | **pass** |
| Leave both authenticated game tabs absent from the page | The server remains healthy and the world clock advances without an open browser connection | Both tabs were navigated to `about:blank`; Railway health remained ready and the mounted world clock advanced from `5258` before departure to `5355`, then `5366` after an additional ~2 seconds, with event cursor still `251` | **pass** |
| Restore both tabs after the browser-absent interval | Existing sessions reconnect to their own server-derived scopes without a new identity | Both tabs returned to the canonical URL; Player A and Player B were signed in, `Connection: READY`, scoped to `shelter-a`/`shelter-b`, and showed shared world time `5381`; WebMCP was registered in Codex Browser and correctly unsupported in Chrome | **pass** |

## Assertions

- Deployment identity: The service was restarted in place; this run did not deploy new code or replace the Volume.
- Persistence: The same world ID and event cursor remained present, while the server-owned clock advanced after recovery.
- Player continuity: Both authenticated browser contexts reconnected to their own shelters and retained their prior coin and mission state.
- Browser independence: With both game tabs on `about:blank`, Railway health stayed ready and the durable world clock advanced; returning to the page recovered both sessions.
- Transport behavior: Realtime connections became visibly stale during restart and required an explicit reconnect before returning to `READY`.
- Backup boundary: The recorded backup is a consistent SQLite copy and was verified by matching remote/local hashes. No provider-level independent snapshot or restore was executed.

## Analysis and closure

- Failure classification: No restart or readback failure occurred. The first backup command correctly failed because the runtime has no `better-sqlite3`; the follow-up used the deployed Node.js `node:sqlite` API and succeeded. The failed attempt created no backup artifact.
- Residual gates: A deliberate authenticated cross-player denial, rollback/read-restore, and the external Receiver/Connector chain remain unverified.
- Exact conclusion: Hosted restart, Volume-backed persistence, authenticated reconnect, browser-independent clock continuity, realtime recovery, and same-world readback passed at the named level-6 slice. CP-17 remains `in_progress` and is not yet `hosted_verified`.
