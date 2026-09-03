# SK-EVID-007: CP-04 Process Runtime Verification

## Identity

- Evidence ID: `SK-EVID-007`
- Related task, issue, or decision: `SK-TASK-004`, `ADR-GAME-0011`
- Evidence class: `process-runtime`
- Ladder level: `4`
- Executor and date: `Codex primary session; 2026-09-02`

## Exact identity under test

- Source state: working tree on `main` at `bd3d92aec10da38392845832694b4365f81387a5`
- Contract version: `SK-MVP-0.2`
- Runtime versions: Node.js `v24.18.0`, npm `11.16.0`, Python `3.14.6`
- Fixture world and seed: not applicable; CP-04 creates no world or gameplay fixture
- Environment and configuration: local macOS process; production-like `NODE_ENV=production`, explicit
  port `38419`, default host `127.0.0.1`, no secrets

## Objective and claim boundary

- Behavior under test: the owner-accepted CP-04 local process topology, entrypoint lifecycle, health
  contract, configuration rejection, shutdown drain, operational instance identity, and redacted logging
- Claim this evidence may support: the explicit Node.js entrypoint builds and starts locally in the named
  environment; health reports ready state; repeated process restart generates distinct operational IDs;
  the exercised clean and timeout shutdown paths settle as expected; malformed configuration fails visibly;
  focused CP-04 runtime checks pass
- Claims this evidence cannot support: world time, persistence, `world_snapshot`, Domain Events, outbox
  delivery, gameplay, WebSocket protocol, WebMCP discovery, Agent delivery, hosted continuity, performance
  under simulation load, balance, or submission readiness

## Preconditions and fixture

- Starting state: owner accepted `ADR-GAME-0011`; `SK-TASK-004` released as `in_progress`; package tree
  and listed CP-04 source/test files present
- Synthetic identities and seeded actors: process and worker operational UUIDs only; no game identities
- Real, fake, and stubbed boundaries: production-like Next.js build/start smoke; focused tests use an
  injected Next application and fake worker to exercise failure and lifecycle branches

## Execution

- Replayable commands or procedure:
  - `PATH=/Users/alex/.nvm/versions/node/v24.18.0/bin:$PATH npm ci --ignore-scripts`
  - `PATH=/Users/alex/.nvm/versions/node/v24.18.0/bin:$PATH npm run typecheck`
  - `PATH=/Users/alex/.nvm/versions/node/v24.18.0/bin:$PATH npm run test:cp04`
  - `PATH=/Users/alex/.nvm/versions/node/v24.18.0/bin:$PATH npm run build`
  - Start `PORT=38419 npm start`, read `GET /api/health`, send `SIGTERM`, and wait for exit.
  - Start the same command a second time, read `GET /api/health`, compare process and worker IDs,
    send `SIGTERM`, and inspect both redacted output streams.
  - Run `env -u PORT NODE_ENV=production node --import tsx src/server/entrypoint.ts`.
- Expected result: package installation, typecheck, focused tests, and production build pass; ready
  health returns HTTP 200; restart IDs differ; SIGTERM exits cleanly; logs contain no forbidden values;
  missing `PORT` exits 1 with `CONFIG_MISSING`.
- Actual result: all five focused tests passed; typecheck, build, package installation, health readback,
  restart identity comparison, clean shutdown, redaction scan, and missing-config check passed.
- Status: `pass`
- Output location: bounded command output and redacted assertions were read in the local session; raw
  process logs remain in temporary `/tmp` files and are not committed.

## Assertions

- Player-visible state: the production build renders the operational placeholder page; gameplay projection
  is outside CP-04 and was not claimed.
- Command and failure contract: dynamic `GET /api/health` returns `200` only when ready, `503` for
  starting/degraded/draining, `405` for unsupported methods, and `Cache-Control: no-store`; missing
  configuration returns a typed `CONFIG_MISSING` failure.
- Persistence, event, and outbox state: not run; intentionally owned by CP-05 and later.
- Exactly-once settlement after duplicate delivery and replay: not run; intentionally owned by CP-05,
  CP-06, CP-14, and CP-15.
- Ownership denial, stale revision, restart, and reconnect: process restart identity and signal-safe drain
  passed; world-state restart, stale revisions, and reconnect remain later evidence obligations.

## Analysis and closure

- Failure classification: none in the exercised paths; the first focused test pass was preceded by a
  corrected test double and a lifecycle fix that keeps health observable during draining. The final
  focused suite passed. A rejecting worker/store close and listener-first ordering were not exercised
  and remain tracked in `SK-ISSUE-004`.
- Limitations and residual risk: the local one-process event loop has not been measured under simulation
  load; hosted supervision and page/worker split remain CP-17 decisions; the `/realtime` protocol remains
  reserved but unimplemented for CP-08.
- Invalidation triggers: a change to the entrypoint, runtime/health contract, worker interface, config
  schema, package lock, Node/Next.js baseline, or a runtime result contradicting the accepted topology.
- Exact conclusion: CP-04 is `runtime_verified` for the local process skeleton, configuration, health,
  lifecycle, operational IDs, redacted logging, and the exercised clean/timeout shutdown paths in Node.js
  `v24.18.0`. Rejecting worker/store close and listener-first ordering remain unverified under
  `SK-ISSUE-004`; no gameplay or hosted claim follows.
