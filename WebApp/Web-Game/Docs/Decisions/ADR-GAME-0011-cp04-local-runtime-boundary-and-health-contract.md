# ADR-GAME-0011: CP-04 Local Runtime Boundary and Health Contract

**Status:** ACCEPTED CP-04 LOCAL RUNTIME BOUNDARY; local runtime verified; hosted/world runtime remains unverified  
**Date:** 2026-09-02  
**Decision owner:** Game owner with engineering recommendation  
**Accepted by owner:** 2026-09-02  
**Related issue:** [`SK-ISSUE-003`](../Issues/resolved/SK-ISSUE-003-cp04-process-topology-and-lifecycle-contract.md)  
**Related task:** [`SK-TASK-004`](../Tasks/SK-TASK-004-cp04-process-skeleton-and-health.md)  
**Local verification:** [`SK-EVID-007`](../Evidence/SK-EVID-007-cp04-process-runtime-verification.md)

## Context

The accepted G-MVP-17 baseline calls for one modular Node process locally, while the target stack
describes a Next.js page and a Node.js world worker. The CP-04 task must also leave a safe boundary
for the CP-08 WebSocket channel, the CP-05 persistence startup, the CP-06 restart path, the CP-12
page, and the CP-17 hosted worker. Starting code before this relationship, health semantics, config,
shutdown, and reproducibility are explicit would make a green local check compatible with a broken
world lifecycle.

The decision below keeps the local topology small and preserves the server-authority contract. It is
an implementation boundary decision, not a new gameplay rule. The owner accepted it on 2026-09-02;
CP-04 proceeded under its bounded task and its local process behavior is verified in `SK-EVID-007`.

## Decision

### 1. Local process topology

Run the page application and the designated world-worker module inside one explicit Node.js 24
process. A single entrypoint owns the lifecycle; neither a Next.js route handler nor a page module
may construct or start the worker:

1. load and validate runtime configuration;
2. create the operational process and worker instance identifiers;
3. prepare the Next.js App Router application;
4. create one HTTP server, attach the prepared Next.js request handler, install the process-level
   health adapter and upgrade dispatcher, and bind it;
5. start the worker module exactly once per process lifetime while health reports `starting`; and
6. mark the runtime ready only after both page preparation and worker startup succeed.

If worker startup fails after the listener is bound, the process stays observable as `degraded`,
rejects state-changing work, and leaves restart to the host. A configuration, page-preparation, or
HTTP-bind failure occurs before the listener is available and ends in `failed`.

The process-level health path is handled by the entrypoint before the Next.js request handler. It reads
an entrypoint-owned runtime registry and never starts, restarts, or constructs the worker. No App
Router route owns process health or mutable worker state; this avoids relying on a shared singleton
across separately bundled Next.js and entrypoint modules. The entrypoint owns future HTTP upgrade
handling for `/realtime`; CP-04 reserves this ownership but does not implement the WebSocket channel.
CP-08 adds the realtime module without adding a second local server. In development, unknown upgrades
may be delegated to Next.js for its tooling; production-like verification exercises the explicit
entrypoint without HMR.

Future state-changing HTTP adapters must use the same entrypoint-owned command gateway or an explicit
worker message interface. They must not import a mutable worker singleton from a page or route bundle.

The worker boundary is a small explicit interface: `start()` resolves only after the module is
available, `stop()` is idempotent, and a fault callback lets the entrypoint publish `degraded`. The
worker module exports no import-time startup side effect and no process signal handler of its own.
An entrypoint start request made after startup has begun returns the existing lifecycle or a typed
`ALREADY_STARTED` result; it never creates a second worker, listener, or instance identity.
After `DRAINING` or `STOPPED`, a start request is rejected; recovery uses a new host-launched process
with new operational instance IDs rather than an in-process restart.

The hosted topology remains open for CP-17. A later hosted decision may split the page service and
always-on world worker when an operational or measured concurrency need justifies it. Such a split
must preserve the health, command, snapshot, and world-authority contracts and cannot be inferred
from the local process. "Always on" means host supervision and durable recovery, not that a process
can never receive a deploy or fault shutdown; CP-05/CP-06 must preserve world continuity across that
restart.

### 2. Operational lifecycle and authority

The runtime lifecycle is separate from game state:

```text
CREATED -> STARTING -> READY -> DRAINING -> STOPPED
            |            |
            v            v
          FAILED       DEGRADED -> DRAINING
```

- `STARTING` validates config, prepares the page, binds the listener, and starts the worker; no
  gameplay clock or world timer runs in CP-04.
- `READY` means only that the page and worker lifecycle are available for the next checkpoint. It
  does not mean that a world, `world_snapshot`, persistence, or `world_time` exists.
- `DEGRADED` means the process remains observable but the worker or another required runtime
  component is unavailable; the page must expose the degraded state, state-changing work is rejected,
  and the host may restart it. CP-04 does not perform an in-process recovery to `READY`.
- `DRAINING` rejects new state-changing work, returns not-ready health, closes upgrades and active
  connections within the drain deadline, then stops the worker and HTTP server.
- `FAILED` is a fail-fast startup result. The process does not listen when required config or startup
  dependency validation fails.

`READY` and `DEGRADED` can both receive the first shutdown signal. `DEGRADED` has no automatic
transition back to `READY` in CP-04; the host restarts the process so CP-05/CP-06 can exercise one
authoritative recovery path. A worker fault observed after `DRAINING` begins is recorded but cannot
move the runtime back to `DEGRADED` or reopen admission.

`process_instance_id` and `worker_instance_id` are opaque operational UUIDs generated at startup.
They remain stable for one process lifetime, change after restart, and are never `world_id`,
`player_id`, `shelter_id`, or any other game identity.

### 3. Health and readiness contract

CP-04 exposes a dynamic process-level `GET /api/health` with `Content-Type: application/json; charset=utf-8`,
`Cache-Control: no-store`, the Node.js runtime, and this JSON shape:

```json
{
  "schema_version": 1,
  "service": "sleepless-kingdom",
  "scope": "process",
  "status": "ready",
  "live": true,
  "ready": true,
  "process_instance_id": "opaque-uuid",
  "worker_instance_id": "opaque-uuid",
  "node_version": "v24.13.1"
}
```

`status` is one of `starting`, `ready`, `degraded`, or `draining`. `live` is true for all four
externally observable states and false only when no process response is possible; `ready` is true only
for `status: ready`. HTTP `200` is returned only for `ready`; the other externally observable states
return HTTP `503`. The process-level handler is dynamic and must not be statically generated or
delegated to a request-scoped lifecycle initializer. Invalid configuration fails before the endpoint
is available and emits only a redacted startup error. The response contains
no paths, environment dumps, stack traces, request data, prompts, credentials, gameplay state, or
private Agent context. Only `GET /api/health` is supported; other methods return a typed `405` without
changing state, and query parameters do not change the result. CP-05 and CP-06 may extend component
detail after persistence and the world clock exist, but they must not reinterpret CP-04 `scope: process`
as world readiness. Any additive payload change keeps the existing field meanings; a breaking change
increments `schema_version`.

### 4. Runtime configuration

Configuration is read from environment variables through one typed loader. The CP-04 contract is:

| Variable | Rule |
|---|---|
| `PORT` | Required integer from 0 to 65535; `0` is reserved for isolated tests and the local runner supplies an explicit development port. |
| `HOST` | Optional; defaults to `127.0.0.1` locally. A hosted binding is explicit in CP-17. |
| `SHUTDOWN_TIMEOUT_MS` | Optional integer from 100 to 30000; defaults to `2000`. |
| `LOG_LEVEL` | Optional enum `error`, `warn`, `info`, or `debug`; defaults to `info`. |
| `NODE_ENV` | Passed to Next.js; if absent, the loader uses `development` for local execution and never treats it as a secret. |
| `AUTONOMOUS_WORLD_MODE` | Optional boolean flag; defaults to `false`. When `true`, explicitly opts the worker into the CP-06 local autonomous driver after startup recovery. |

Missing `PORT`, malformed numbers, out-of-range values, or unknown log levels fail fast with a typed,
non-sensitive error. The minimum error codes are `CONFIG_MISSING`, `CONFIG_INVALID`,
`NEXT_PREPARE_FAILED`, `HTTP_BIND_FAILED`, `WORKER_START_FAILED`, `WORKER_FAULT`, and
`SHUTDOWN_TIMEOUT`. No secret is required by CP-04. A later persistence or hosting task may add a
secret-bearing variable only in its own scope and must keep it out of health and logs.

### 5. Shutdown and logging

The entrypoint installs one idempotent handler for `SIGTERM` and `SIGINT`. The first signal changes
the runtime to `DRAINING`, makes health return `503`, stops accepting new commands and future
WebSocket upgrades, closes active connections, calls the worker stop hook, closes the HTTP server,
and exits within `SHUTDOWN_TIMEOUT_MS`. A repeated signal does not create a second shutdown path.
If the soft drain exceeds the deadline, it records `SHUTDOWN_TIMEOUT` and performs one bounded forced
exit; this is a failure receipt, not a second shutdown path.

Lifecycle logs are JSON lines written to the process output stream only. They contain a fixed schema
with event name, level, wall time, service, process instance, worker instance, and a nullable typed
error code.
They never include environment values, authorization headers, cookies, request bodies, prompts, raw
Agent context, database paths, stack traces, or mutable game state. The task's test captures output
with a secret sentinel and proves that the sentinel is absent.

### 6. Reproducible implementation and verification

The game uses npm with a committed `package-lock.json`, the local Node.js 24 baseline, and the
existing Next.js/React/TypeScript versions already proven available in the workspace. The selected
TypeScript runner is `tsx`, pinned through the lockfile and kept in runtime dependencies because
`start` executes the explicit TypeScript entrypoint in production-like checks. The package scripts
must provide deterministic `build`, `start`,
`typecheck`, and `test:cp04` commands with these meanings:

| Script | Required behavior |
|---|---|
| `build` | Run `next build` for the page bundle. |
| `start` | Run the explicit entrypoint with `NODE_ENV=production` and an explicit `PORT`. |
| `typecheck` | Run TypeScript with no emit. |
| `test:cp04` | Run the focused Node test suite through the pinned `tsx` loader. |

The generated-file policy ignores `.next/`, `node_modules/`, `coverage/`, temporary test output, and
runtime logs; `package-lock.json`, source, tests, and redacted evidence remain trackable. CP-04 writes
no runtime database or mutable state inside the repository.

CP-04 evidence uses `next build` followed by the selected entrypoint; `next dev` and hot-module
reload alone cannot prove singleton startup or signal-safe shutdown. A custom server is an
intentional CP-04 trade-off for lifecycle and future upgrade ownership. The [Next.js custom server
guide](https://nextjs.org/docs/app/guides/custom-server) documents that a custom server can remove
framework optimizations and cannot be combined with standalone output, so the project does not enable
standalone output for this entrypoint and treats that trade-off as part of the review gate.

Tests run in isolated temporary directories and use ephemeral ports. They cover missing and malformed
config, startup exactly once and repeated start, observable `live`/`ready`/`degraded`/`draining`
health states and status codes, distinct instance IDs across restart, redacted output, signal-safe
drain, and clean process exit. The runtime creates no database, world timer, event, outbox row, or
repository trace in CP-04.

## Consequences

The local MVP keeps one process to reduce orchestration and failure surface while still giving the
page, worker, health, and future WebSocket modules explicit ownership. CP-05 can add persistence
behind the worker startup seam; once that seam becomes authoritative, `READY` means the required
store is also available. CP-06 can add the authoritative clock without moving it into the page, and
CP-12 can replace the operational placeholder without owning lifecycle. The local process does not
establish hosted always-on continuity; CP-17 must prove that separately.

The trade-off is that the page and worker share a process locally, so a fatal process fault affects
both. The health contract makes that state visible, and the later hosted decision can split the
services if evidence warrants it. A two-process local supervisor remains a valid alternative, but it
would add ports, handshake, orphan cleanup, and test surface before persistence exists.

## Owner acceptance and reopen triggers

The owner accepted the one-process local topology, the health payload and status codes, the required
configuration, the 2-second default drain deadline, and the production-like build/start verification
mode on 2026-09-02. This acceptance released the CP-04 child task; local runtime verification is
recorded in `SK-EVID-007`, while hosted and gameplay behavior remain outside this decision's proof.
Reopen it if Next.js cannot run through the explicit entrypoint, if WebSocket ownership requires a
second unmeasured server, if the health result cannot distinguish runtime from world readiness, or if
hosted requirements force a different local authority boundary.
