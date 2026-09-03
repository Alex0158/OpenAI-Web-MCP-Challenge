# SK-EVID-015: CP-08 Realtime Wire Runtime Verification

## Evidence control

- Evidence ID: `SK-EVID-015`
- Related task: [`SK-TASK-026`](../Tasks/SK-TASK-026-cp08-entrypoint-realtime-wire-adapter.md)
- Related decision: [`ADR-GAME-0017`](../Decisions/ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md)
- Predecessors: [`SK-EVID-014`](SK-EVID-014-cp08-realtime-snapshot-runtime-verification.md), [`SK-EVID-013`](SK-EVID-013-cp08-worker-command-read-gateway-runtime-verification.md), and [`SK-EVID-007`](SK-EVID-007-cp04-process-runtime-verification.md)
- Evidence class: `process-runtime`
- Ladder level: `4`
- Executor and date: Codex primary session; 2026-09-02
- Source state: working tree on `main` at Git commit `e71977a95c61383906d78527e4d3e392f24581d5`; CP-08 wire source, tests, dependency records, and documentation are intentionally uncommitted.

## Exact identity under test

- Contract version: `SK-MVP-0.2`
- Node.js: `v24.18.0`
- npm: `11.16.0` through the Node 24 npm CLI
- Next.js: `16.3.4`
- TypeScript: `7.0.2`
- WebSocket dependency: `ws@8.21.3`; type package `@types/ws@8.18.1`
- Fixture: `sleepless-mvp-01`, generation `g2-fixture-1`, isolated world `cp08-realtime-wire-world`
- Persistence: fresh file-backed SQLite database per test, opened by the worker and removed from the temporary directory after the test
- Browser: none; the client is the Node `ws` client, so browser rendering and browser WebSocket behavior remain unproven.

## Objective and claim boundary

The tested behavior is the CP-04-owned `/realtime` upgrade handoff to one `ws` no-server adapter. A
server-owned session resolver supplies a `ServerBoundRealtimeContext`; the adapter delegates full
snapshot and resync reads through one `RealtimeSnapshotHub` and one `WorkerCommandGateway`, rejects
client-selected scope, exposes typed admission/protocol outcomes, and drains with the existing
entrypoint lifecycle.

This evidence supports a local authenticated wire and entrypoint lifecycle proof at ladder level 4.
It does not support production authentication or credential issuance, Origin/CSRF policy, browser
Canvas UX, snapshot cadence or slow-client performance, gameplay, WebMCP, Re-entry delivery, hosted
continuity, multi-process failover, or hackathon readiness.

## Preconditions and fixture

- Each test seeded the accepted two-player fixture with stable player and opaque binding identities,
  then opened it through a real `WorldWorkerModule`, `WorkerCommandGateway`, and file-backed store.
- The fixture resolver mapped only the test cookies `sk_session=fixture-a` and
  `sk_session=fixture-b` to server-created contexts. It did not issue, persist, log, or expose a
  production credential.
- The default entrypoint was exercised both with a supplied resolver and without one. The latter
  remained explicitly unsupported instead of creating a fake session or polling fallback.

## Execution

The contract-first Red harness was written before the wire implementation and initially failed with
an import-module failure because `src/server/realtime-wire.ts` and its direct dependency did not yet
exist. The smallest `ws` no-server adapter, entrypoint composition seam, and tests then turned the
harness Green.

Exact commands for the closure run:

```text
/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/tsx/dist/cli.mjs --test tests/cp08-realtime-wire.test.ts
/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/tsx/dist/cli.mjs --test tests/cp04-process-skeleton.test.ts tests/cp05-persistence.test.ts tests/cp06-clock-recovery.test.ts tests/cp07-world-fixture.test.ts tests/cp08-movement-snapshot.test.ts tests/cp08-worker-movement.test.ts tests/cp08-worker-gateway.test.ts tests/cp08-realtime-snapshot.test.ts tests/cp08-realtime-wire.test.ts
/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/typescript/bin/tsc --noEmit
/Users/alex/.nvm/versions/node/v24.18.0/bin/node node_modules/next/dist/bin/next build
/Users/alex/.nvm/versions/node/v24.18.0/bin/node /Users/alex/.nvm/versions/node/v24.18.0/lib/node_modules/npm/bin/npm-cli.js ci --dry-run --ignore-scripts
python3 scripts/test_validate_game_docs.py
python3 scripts/validate_game_docs.py --root . --report
git diff --check -- WebApp/Web-Game
```

## Observed results

- Focused wire suite: **8 tests passed**, including valid authenticated connect/resync, missing and
  invalid session rejection, client-scope rejection, admission/drain, asynchronous auth-versus-drain
  race, bounded 16 KiB inbound payload, entrypoint delegation, one-worker composition, and explicit
  unsupported default.
- CP-04 through CP-08 transitive aggregate: **71 tests passed**, with no failures, cancellations,
  skips, or expected-fail cases.
- TypeScript typecheck: passed on Node `v24.18.0`.
- Next production build: passed on Next `16.3.4`.
- Node 24 `npm ci --dry-run --ignore-scripts`: passed; the lockfile records exact `ws` and
  `@types/ws` versions.
- Documentation self-tests: **21 tests passed**.
- Documentation validator: passed after the new evidence and audit links were added.
- Scoped whitespace check: passed.

## Assertions

1. A valid fixture session receives one server-issued connection id and sequence-1 full
   `client_snapshot`; an explicit resync receives sequence-2 full replacement. The query string's
   `playerId` and `worldId` do not alter the server-bound Player A scope.
2. Missing or unknown sessions receive HTTP `401` with only
   `REALTIME_AUTH_REQUIRED`. A malformed message or client-supplied extra scope key receives a typed
   `realtime_error` and WebSocket protocol close `1008`; no gateway or domain mutation occurs.
3. A runtime that is degraded or enters draining receives typed `503` admission; an authenticated
   connection is closed with `1001 RUNTIME_DRAINING`, and the asynchronous resolver race is rejected
   after the second admission check.
4. A payload larger than the default 16 KiB `ws` limit closes with `1009` before application message
   parsing. The adapter owns no application-level outbound queue.
5. The CP-04 entrypoint delegates the reserved upgrade to the supplied adapter and calls `drain`
   before `close` exactly once. With a real `PersistenceStore` and resolver it composes one worker
   gateway, one hub, and one adapter; without a resolver it returns
   `REALTIME_UNAVAILABLE` rather than claiming realtime support.
6. The existing hub tests retain concurrent resync coalescing, monotonic replacement, gateway-only
   reads, stale/ownership rejection, and transport lifecycle coverage; the aggregate confirms that
   the wire adapter did not break those predecessor contracts.

## Cross-functional analysis

- **Authority:** `/realtime` remains on the single CP-04 HTTP `upgrade` listener. The adapter never
  creates a worker, clock, store, timer, route, or second listener. Snapshot reads pass through the
  existing gateway and hub.
- **Identity and privacy:** only the injected resolver can create a context. The hub copies and
  validates the context, the wire never accepts client scope, and error bodies/frames contain no
  cookies, bindings, or resolver details.
- **Ordering and races:** admission is checked before and after asynchronous authentication;
  resync work retains the hub's in-flight coalescing; drain rejects new upgrades and closes current
  sinks before the worker gateway is stopped by the entrypoint.
- **Persistence and time:** the wire performs no mutation, settlement, event append, clock advance,
  or durable connection write. Worker and database lifecycle remain CP-04/CP-05/CP-06 authority.
- **Projection:** connect and resync transmit full replacement frames with a null base. The browser
  projection validator remains the consumer of scope and sequence rules; no delta or interpolation
  policy was introduced.
- **User and Agent flow:** unsupported realtime is explicit, so a future page can show degraded
  status without a false live claim. No WebMCP tool, Agent Signal, Codex Thread wake, or Re-entry
  action is emitted by this transport increment.

## Intentionally unrun and residual risk

- No real browser session or Canvas page consumed the wire; ladder level 5 remains open.
- No production session issuer, credential lifecycle, Origin/CSRF policy, rate limit, heartbeat,
  snapshot cadence, delta format, or measured slow-client budget exists.
- The default process can compose the adapter only when a resolver is supplied and the worker uses the
  current `PersistenceStore`; world bootstrap and production identity are later tasks.
- Hosted deployment, process replacement while a socket is connected, multi-process routing,
  WebMCP, Re-entry, gameplay missions, combat, and settlement remain unimplemented.

## Analysis and closure

- Failure classification: `unknown` for the deliberately unrun browser, production, and hosted
  surfaces; no product, test, fixture, or environment failure occurred in the executed scope.
- Invalidation triggers: a change to the wire envelope, session/binding contract, snapshot shape,
  gateway ownership, runtime lifecycle, dependency/runtime version, or fixture seed invalidates this
  record.
- Exact conclusion: **pass**. `SK-TASK-026` is locally runtime-verified for one authenticated
  entrypoint-owned wire adapter, full connect/resync projection, typed rejection, bounded inbound
  control, and drain/close. The unsupported default and all production/browser/hosted limitations
  remain explicit.
