# ADR-GAME-0037: CP-17 Railway Single-Service SQLite Volume

## Status

Accepted by the Game owner on 2026-09-03. The owner-authorized resource provisioning preflight is
complete; hosted verification and the Game deployment remain open.

## Context

CP-17 needs one small hosted process that keeps the existing Node.js 24 page, worker, command gateway,
health, and WebSocket authority together. The Game already has a complete file-backed SQLite
`PersistenceStore` with WAL, snapshots, Domain Events, outbox records, clock recovery, and focused
restart tests. Replacing that store with PostgreSQL before the first hosted demonstration would add a
new adapter and migration surface without solving a demonstrated MVP problem.

The question is whether Railway can host this existing SQLite boundary durably. Railway's official
documentation states that a mounted Volume provides a persistent filesystem path, files outside a
Volume are ephemeral, Volume backups include SQLite databases, and a Volume cannot be used with
multiple replicas. Railway also documents HTTP/1.1 WebSocket upgrade support and restart policies.
These are platform facts; the resource provisioning preflight now proves the selected project, service,
Volume, domain, and non-secret settings exist, while plan, deployment, runtime, identity, and backup
readback remain open.

## Decision

Use the following topology for the first hosted two-player MVP:

- one Railway application service running the existing Node.js 24 entrypoint;
- one replica and one authoritative worker/process;
- one attached Railway persistent Volume mounted at a fixed absolute path, with `GAME_DB_PATH` set
  to the SQLite file on that mount;
- Clerk Production invite-only admission for exactly two manually provisioned subjects, mapped on the
  server to `player-a` and `player-b`;
- the existing `client_snapshot`, typed HTTP commands, and `/realtime` WebSocket path, all resolved
  through the same server-side identity scope;
- `HOST=0.0.0.0`, Railway's injected `PORT`, a health check on `/api/health`, and a restart policy
  selected and recorded during the actual deployment rehearsal.

The Game's production bootstrap seeds the named G2 world only when the mounted database is empty and
loads and validates it on later starts. It never chooses a world from page input and never enables the
local fixture cookie. A second replica, a second writer, or a browser heartbeat is outside this ADR.

PostgreSQL, Redis, a separate worker service, and multi-region replicas are deferred. They require a
measured need, a compatible adapter or authority design, and a new owner-accepted ADR.

## Provider facts and consequences

| Fact | Consequence for this MVP |
|---|---|
| A Railway Volume is mounted at an absolute runtime path; files outside it are ephemeral | The SQLite file must be on the attached Volume, never the default ephemeral filesystem |
| Railway Volume backups include SQLite and can be manual or scheduled | The deployment must create and verify a backup before claiming recovery |
| A Volume is limited to one service and cannot be used with multiple replicas | Keep one replica and one world writer; scale-out is deferred |
| Attached-Volume redeploys can have brief downtime | Health/readiness and reconnect behavior are part of the rehearsal |
| WebSockets use HTTP/1.1 upgrade and can remain open; reconnect is still required | Keep `/realtime`, bind the process correctly, and retain client reconnect logic |
| Restart policy varies by plan and can be `Always`, `On Failure`, or `Never` | Record the actual plan/policy; do not infer always-on behavior from source code |

Official sources: [Railway Volumes](https://docs.railway.com/volumes), [Volume Reference](https://docs.railway.com/volumes/reference),
[Volume Backups](https://docs.railway.com/volumes/backups), [Services](https://docs.railway.com/services),
[SSE vs WebSockets](https://docs.railway.com/guides/sse-vs-websockets), [Networking limits](https://docs.railway.com/networking/public-networking/specs-and-limits),
and [Restart Policy](https://docs.railway.com/deployments/restart-policy).

## Alternatives considered

- **Ephemeral SQLite filesystem:** rejected because deployments or process replacement can lose the
  world, snapshot, event cursor, and outbox.
- **Railway PostgreSQL now:** deferred because the current authority and persistence implementation
  is SQLite-specific; an adapter would be a larger change than the two-player MVP needs.
- **Multiple replicas or split page/worker services:** deferred because Volume semantics and the
  single-writer authority would require a different shared-store and routing design.
- **Browser heartbeat as the scheduler:** rejected because browser presence cannot own world time or
  guarantee continuity.

## Verification boundary

The local CP-17 implementation verifies idempotent bootstrap, fixed Clerk subject mapping, fixture
exclusion, HTTP bootstrap, WebSocket first-frame scope, and one scoped move command under Node 24.
The Railway resource provisioning readback is recorded in [`SK-EVID-063`](../Evidence/SK-EVID-063-cp17-railway-resource-provisioning-preflight.md)
at ladder level 1. Process supervision, Game deployment, Clerk cookie issuance, backup/restore,
restart catch-up, and rollback remain ladder-level 7 evidence and are not claimed by this ADR.

## Reopen triggers

Reopen this ADR if Railway cannot provide a durable Volume for the selected service/plan, if the actual
deployment requires more than one writer or replica, if SQLite locking or recovery fails under the
representative two-player load, if Clerk session issuance cannot reach the page without a credential
leak, or if backup/restore and schema-compatible rollback cannot be exercised. A provider change or
Eddy's accepted hosted handoff also reopens the decision.
