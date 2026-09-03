# Operations and Hosting

**Status:** TARGET operations plan; CP-17 host decision/preflight is tracked under [`SK-TASK-077`](../Tasks/SK-TASK-077-cp17-host-decision-and-deployment-preflight.md), the owner-accepted first topology is [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md), and production identity/admission implementation is under [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md)

## Local CP-12 fixture run

The reproducible local page-to-first-frame smoke uses the explicit non-production fixture flag and a
task-local file-backed database:

```sh
NODE_ENV=test PORT=3000 HOST=127.0.0.1 LOCAL_FIXTURE_MODE=1 \
  GAME_DB_PATH=tmp/runtime/world.sqlite npx tsx src/server/entrypoint.ts
```

`npm start` deliberately sets `NODE_ENV=production`, so it keeps the fixture endpoint unsupported.
The local fixture path creates `sleepless-mvp-01` only for an empty database, loads and validates it on
restart, and exposes one server-owned opaque session handle for the two seeded players. It is a
process-runtime demonstration of the page, bootstrap, worker gateway, and WebSocket first frame; it
is not a deployment, authentication, always-on, scheduler, WebMCP, Re-entry, or hosted-continuity
claim. Use a task-local database path for evidence and do not point the fixture mode at a real world
store.

## Local autonomous worker proof

The B driver is an explicit process option. For a task-local file-backed G2 world, set
`AUTONOMOUS_WORLD_MODE=1` and keep the accepted fixture gate enabled:

```sh
NODE_ENV=test PORT=3000 HOST=127.0.0.1 LOCAL_FIXTURE_MODE=1 AUTONOMOUS_WORLD_MODE=1 \
  GAME_DB_PATH=tmp/runtime/world.sqlite npx tsx src/server/entrypoint.ts
```

The worker opens one selected world, replays any marked boundary, derives at most 300 world seconds
from `server_time_anchor_ms`, then runs one monotonic 100 ms one-shot driver through the existing
`advance()` seam. Leave the flag unset for deterministic explicit-advance tests. This local mode is
recorded in [`../Evidence/SK-EVID-036-cp06-autonomous-scheduler-runtime-verification.md`](../Evidence/SK-EVID-036-cp06-autonomous-scheduler-runtime-verification.md);
it is not hosted continuity or a production supervisor contract.

## Always-on target

The hosted game needs an application worker, durable database, health endpoint, structured redacted
logs, metrics, and automatic process restart. The user-facing requirement is continuous world
progress and recoverable state, supported by infrastructure rather than an assumption that a process
can never fail.

For the first hosted MVP, use one Railway application service, one replica, and one attached persistent
Volume containing the SQLite file. Set `GAME_DB_PATH` to that absolute mounted path, bind `HOST` to
`0.0.0.0`, and use Railway's injected `PORT`. This is a durable single-writer topology; it does not
support multiple replicas or zero-downtime Volume redeploys. Railway documents that files outside a
Volume are ephemeral, Volume backups include SQLite, and WebSockets use HTTP/1.1 upgrade. The selected
project, service, Volume, domain, restart policy, and non-secret settings now have a provider readback
under [`SK-EVID-063`](../Evidence/SK-EVID-063-cp17-railway-resource-provisioning-preflight.md); the
plan, source/build identity, deployment, backup, Clerk cookie issuance, and runtime continuity still
require hosted readback under CP-17.

The local CP-04 process contract is intentionally smaller: one explicit Node.js entrypoint hosts the
page and world-worker modules and exposes process health. `live` and `ready` are separate health
signals; a `degraded` worker is observable and rejects state-changing work, while the host owns the
restart. This local contract is accepted in
[`../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md)
and does not itself prove hosted continuity. A hosted supervisor should use `live` for process
liveness and `ready` for admission; it must restart or route away from a process that remains live but
degraded rather than treating the two signals as interchangeable.

## Recovery

A failed worker restarts, reads the persisted `world_snapshot` and world clock, resumes due milestones, reclaims expired
leases, and replays unacknowledged Domain Events and Agent Signal delivery records. The deployment must
keep migrations backward compatible with the running `world_snapshot` and must preserve a redacted recovery
receipt. Signal retries reuse their identity and do not create additional Codex Thread wake-ups.

The hosted health check must distinguish process liveness from world readiness. Once CP-05 and CP-06
exist, a `ready` worker must have loaded a compatible snapshot and clock; a process that is alive but
cannot serve authoritative world commands is `degraded` or `not ready`. If hosted page and worker
services are split, the page health surface must not invent readiness from its own process alone.

The local production-like gap is now closed for the first boundary: an empty store has an idempotent
named-world bootstrap, the entrypoint has a server-derived Clerk subject resolver for command/page-tool/
realtime scope, and the default host is public-bind safe in production. The owner-authorized Railway
resource preflight has provisioned and read back the selected project, one service, one `/data` Volume,
one HTTPS domain, and non-secret production settings; hosted proof must still verify the mounted Volume
at runtime, process supervisor, Clerk session issuance, deployment, restart catch-up, and canonical URL
behavior. It must not enable fixture mode, reseed on every restart, or use a browser heartbeat to keep
the world alive.

## Security and abuse boundary

Server-side ownership, rate limits, command idempotency, version checks, and battle authority are
mandatory. The browser cannot award coins, move a shelter, reveal hidden locations, or transform a
soldier. Secrets and private Agent context remain outside game records and public evidence.

## Proof gates

Before calling the game hosted, verify the actual endpoint, process health, database persistence,
restart recovery, world-clock continuity, command rejection, and a bounded end-to-end Re-entry event.
A local build or successful deploy command does not establish those facts.
