# SK-EVID-014: CP-08 Realtime Snapshot Runtime Verification

## Evidence control

- Evidence ID: `SK-EVID-014`
- Related task: [`SK-TASK-025`](../Tasks/SK-TASK-025-cp08-realtime-snapshot-transport.md)
- Related decision: [`ADR-GAME-0016`](../Decisions/ADR-GAME-0016-cp08-realtime-snapshot-transport-boundary.md)
- Predecessors: [`SK-EVID-013`](SK-EVID-013-cp08-worker-command-read-gateway-runtime-verification.md), [`SK-EVID-012`](SK-EVID-012-cp08-worker-movement-cadence-runtime-verification.md), and [`SK-EVID-011`](SK-EVID-011-cp08-movement-snapshot-runtime-verification.md)
- Evidence class: `process-runtime`
- Ladder level: `4`
- Executor and date: Codex primary session; 2026-09-02
- Source state: working tree on `main` at Git commit `92cb4fa376c593081ba943c5c865067ac3fcb2ce`; realtime source, client projection, tests, package script, and documentation changes are intentionally uncommitted.

## Runtime identity

- Node.js: `v24.18.0` selected through `/Users/alex/.nvm/versions/node/v24.18.0/bin`
- npm: `11.17.0`
- Next.js: `16.3.4`
- TypeScript: `7.0.2`
- Contract: `SK-MVP-0.2`
- Fixture: `sleepless-mvp-01`, generation `g2-fixture-1`
- Runtime: local macOS process with a fresh file-backed SQLite database per test; no HTTP/WebSocket wire adapter, authentication issuer, browser Canvas, external Receiver or Connector, WebMCP adapter, hosted database, or public service.

## Objective and claim boundary

This evidence covers the bounded CP-08 transport-neutral realtime seam: an entrypoint-owned
`RealtimeSnapshotHub` with a process-local connection registry, server-bound scope, full replacement
frames on connect and resync, monotonic per-connection sequence, gateway-only snapshot reads,
coalesced in-flight resync, browser-safe projection validation, and visible unsupported/not-ready/
draining/closed outcomes.

The evidence supports the local connection and projection semantics when an authenticated entrypoint
supplies a binding and a sink. It does not support an actual `/realtime` HTTP upgrade, WebSocket wire
format, authentication issuance, browser rendering, command transport, snapshot cadence, bounded
slow-client policy, gameplay, WebMCP, Re-entry delivery, hosted continuity, or production performance.

## Fixture and execution

- Each test created a new file-backed world through `createAndPersistG2Fixture` with two stable player
  identities and opaque bindings, then opened it through a real `WorldWorkerModule`, `WorldClock`,
  and `WorkerCommandGateway`.
- The server hub captured the authenticated context before the first read, delegated every snapshot
  to the gateway, cloned frames at the sink boundary, and never exposed the binding through a handle.
- The browser-safe projection client accepted only newer full frames for its expected connection,
  contract, world, player, and shelter scope. Rejected frames left the accepted snapshot unchanged.
- Concurrent resync requests shared one in-flight read; a failed sink marked the connection stale and
  the next explicit replacement continued with a higher sequence.

Exact commands:

```text
/Users/alex/.nvm/versions/node/v24.18.0/bin/npm run test:cp08-realtime
/Users/alex/.nvm/versions/node/v24.18.0/bin/npm run test:cp08-gateway
/Users/alex/.nvm/versions/node/v24.18.0/bin/npm run test:cp08-cadence
/Users/alex/.nvm/versions/node/v24.18.0/bin/npm run test:cp08
/Users/alex/.nvm/versions/node/v24.18.0/bin/npm run test:cp07
/Users/alex/.nvm/versions/node/v24.18.0/bin/npm run test:cp06
/Users/alex/.nvm/versions/node/v24.18.0/bin/npm run test:cp05
/Users/alex/.nvm/versions/node/v24.18.0/bin/npm run test:cp04
/Users/alex/.nvm/versions/node/v24.18.0/bin/npm run typecheck
/Users/alex/.nvm/versions/node/v24.18.0/bin/npm run build
python3 scripts/test_validate_game_docs.py
python3 scripts/validate_game_docs.py --root . --report
git diff --check -- WebApp/Web-Game
```

## Observed results

- CP-08 realtime snapshot: 6 tests passed.
- CP-08 worker gateway: 6 tests passed.
- CP-08 worker cadence: 5 tests passed.
- CP-08 movement/snapshot: 4 tests passed.
- CP-07 fixture: 5 tests passed.
- CP-06 clock/recovery: 8 tests passed.
- CP-05 persistence/events: 26 tests passed.
- CP-04 process skeleton: 5 tests passed.
- TypeScript typecheck: passed.
- Next.js production build: passed.
- Documentation self-tests: 21 tests passed.
- Documentation validator: passed with `SK-TASK-025` as the only non-terminal task before closure.
- Scoped whitespace check: passed.
- Red proof: before `src/server/realtime-snapshot.ts` existed, the focused suite failed with
  `ERR_MODULE_NOT_FOUND`; the Green suite then passed after the bounded implementation.

## Assertions

1. A connect operation captures Player A's server-bound world/player/binding context, delegates the
   read through the gateway, sends one sequence-1 full frame with `base_client_snapshot_id = null`,
   and cannot be redirected by mutating the caller's context after binding.
2. The frame remains player-scoped and omits Player B's private shelter and player state.
3. A movement followed by an explicit resync produces a sequence-2 full replacement at the updated
   authoritative position. Two concurrent resync calls share one in-flight read rather than creating
   an unbounded frame queue.
4. The browser projection accepts a valid newer frame, rejects another connection or scope, rejects
   an out-of-order sequence, and leaves its last accepted replacement unchanged while requesting a
   full resync.
5. A malformed non-null base is rejected rather than merged onto unrelated projection state.
6. Unsupported capability, worker not-ready, drain, close, and failed sink outcomes remain typed and
   visible. A sink failure marks the connection stale, and the next explicit full replacement uses a
   higher sequence.

## Cross-functional analysis

- Authority: only `WorkerCommandGateway.fullSnapshot` reaches the snapshot service. The hub does not
  read persistence or mutate movement, time, visibility, revisions, cargo, or settlement.
- Identity and privacy: the entrypoint-supplied binding is copied into a private record; the handle
  exposes only connection id and player id. Snapshot privacy remains owned by `ClientSnapshotService`.
- Ordering and time: the hub creates no worker, timer, clock, prediction, or implicit replay. Command
  and advance ordering remains in the predecessor gateway.
- Projection: connect and resync are full replacements with a null base. The client accepts a frame
  only after connection, contract, world, player, shelter, shape, and sequence checks, then deep-copies
  the replacement.
- Lifecycle: hub drain closes current sinks and rejects new connects; closed and unsupported states
  remain observable. CP-04 still owns the HTTP listener and worker shutdown deadline.
- Flow and performance: concurrent replacement requests coalesce to one in-flight read; no production
  cadence, packet-size, slow-client, or throughput claim is made. A later adapter must choose bounded
  admission and wire close semantics from measured behavior.
- Re-entry and WebMCP: no events, prompts, credentials, Agent Signals, or page tools are created by
  this projection seam. Those boundaries remain unchanged.

## Intentionally unrun and residual risk

- The current `/realtime` entrypoint branch still rejects the upgrade because the authenticated wire
  adapter is a later task. The process-local sink is evidence of projection semantics, not a genuine
  browser or network connection.
- Authentication and binding issuance are not implemented; tests inject the opaque server context.
- The browser-safe client module has no browser smoke or Canvas consumer yet. Its runtime cloning uses
  `structuredClone`, so an older browser support target would require a new capability decision.
- No snapshot scheduler, delta protocol, heartbeat, backpressure limit, hosted failover, or always-on
  world proof exists.

## Closure

Status: `pass`. `SK-TASK-025` is runtime-verified for the transport-neutral local realtime snapshot
connection and browser projection seam. HTTP/WebSocket upgrade wiring, authentication, browser UX,
cadence, gameplay, hosted continuity, and Agent delivery remain separately gated work.
