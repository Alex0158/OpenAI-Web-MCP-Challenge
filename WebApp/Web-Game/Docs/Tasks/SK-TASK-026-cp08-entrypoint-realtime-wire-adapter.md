# SK-TASK-026: CP-08 Entrypoint Realtime Wire Adapter

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-08`
- Owner: Game owner
- Current increment: The CP-04-owned `ws` no-server adapter and optional worker-to-gateway-to-hub composition are runtime-verified for fixture-authenticated full connect/resync, scope denial, typed admission, bounded input, and drain.
- Next gate: Register the next bounded CP-09 mission/role/return implementation task after reading its preparation pack and rechecking the CP-08 route and snapshot handoff.

## Identity

- Task ID: `SK-TASK-026`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: This increment crosses the CP-04 HTTP upgrade owner, authentication and binding
  issuance, transport framing, connection drain, browser capability status, and the already verified
  worker gateway. A wire shortcut could create a second listener, trust client scope, or claim live
  realtime while the worker is unavailable.

## Objective

Attach one authenticated local `/realtime` wire adapter to the verified `RealtimeSnapshotHub`. The
adapter must construct server-bound scope from the accepted session boundary, deliver full connect and
resync replacement frames, surface typed unsupported/not-ready/draining/closed outcomes, and close
through CP-04's entrypoint lifecycle without adding a second worker, timer, or authority.

## Success and non-goals

- Success: The CP-04 entrypoint remains the sole HTTP upgrade owner and creates one process-local hub;
  a connection cannot select `world_id`, `player_id`, `shelter_id`, or binding from wire input.
- Success: The selected wire envelope carries the verified full frame and resync request semantics;
  malformed, wrong-scope, stale, and closed inputs fail visibly without domain mutation.
- Success: Worker gateway FIFO and `RealtimeSnapshotHub` remain the only command/read/projection paths;
  drain closes active connections within the existing shutdown budget and rejects new upgrades.
- Success: An unsupported or degraded realtime capability is visible to the page/health surface; no
  polling, second server, silent fallback, or false live-stream claim is created.
- Non-goals: movement command protocol, delta frames, heartbeat tuning, production cadence or
  backpressure policy, Canvas/keyboard UX, pathfinding, missions, extraction, combat, WebMCP,
  Re-entry, hosted deployment, multi-process failover, or production performance.

## Scope and authority

- In scope: the CP-04 entrypoint upgrade adapter, one authenticated session-to-binding handoff, the
  smallest supported wire dependency or native adapter, focused handshake/frame/lifecycle tests, and
  linked ADR/evidence/validation updates.
- Out of scope: `reentry-core/`, `mvp/`, `RightSpot`, external Receiver/Connector, deployment,
  credentials, spend, staging, commit, push, and public communication.
- Allowed actions: Read/edit scoped game files, run capability probes, install a safe local dependency
  only after the probe and decision gate, write focused tests/evidence, and run minimum affected
  verification.
- Revalidate when: the auth/session contract, CP-04 upgrade owner, snapshot/frame contract, browser
  capability surface, gateway lifecycle, or shutdown budget changes.

## Owning authority

- Transport boundary: [`../Decisions/ADR-GAME-0016-cp08-realtime-snapshot-transport-boundary.md`](../Decisions/ADR-GAME-0016-cp08-realtime-snapshot-transport-boundary.md)
- Entrypoint lifecycle: [`../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md)
- Architecture and API: [`../Engineering/02-system-architecture.md`](../Engineering/02-system-architecture.md) and [`../Engineering/05-api-and-webmcp.md`](../Engineering/05-api-and-webmcp.md)
- Snapshot scenarios: [`../Scenarios/08-cp08-projection-pathfinding-fixtures.md`](../Scenarios/08-cp08-projection-pathfinding-fixtures.md)
- Predecessor evidence/audit: [`../Evidence/SK-EVID-014-cp08-realtime-snapshot-runtime-verification.md`](../Evidence/SK-EVID-014-cp08-realtime-snapshot-runtime-verification.md) and [`../Validation/18-cp08-realtime-snapshot-runtime-cross-functional-audit.md`](../Validation/18-cp08-realtime-snapshot-runtime-cross-functional-audit.md)

## Evidence status

- Verified: CP-04 owns the upgrade and drain seam; `WorkerCommandGateway` and the transport-neutral
  `RealtimeSnapshotHub` provide gateway-only full snapshots, server-bound context, replacement
  sequences, projection validation, and typed local lifecycle outcomes. The local wire adapter,
  entrypoint composition, and typed upgrade/protocol lifecycle are recorded in [`SK-EVID-015`](../Evidence/SK-EVID-015-cp08-realtime-wire-runtime-verification.md) and reviewed in [`Validation/20`](../Validation/20-cp08-realtime-wire-runtime-cross-functional-audit.md).
- Verified: Node `v24.18.0` exposes a WebSocket client but no native `WebSocketServer`; Next `16.3.4`
  exposes `getUpgradeHandler()` on the custom server. The direct `ws@8.21.3` dependency is locked,
  and no production authentication/session issuer exists.
- Verified: the focused local wire harness proves valid and invalid resolver outcomes, full
  replacement/resync, protocol and payload rejection, asynchronous admission race handling,
  entrypoint delegation, and drain/close.
- Inferred: one local wire adapter remains the smallest next step toward a genuine two-browser slice;
  production identity and browser delivery must be added behind their own gates.
- Unknown: production session issuance, Origin/CSRF policy, browser UI/support, bounded snapshot
  size/slow-client budgets beyond the inbound limit, hosted behavior, and default-world bootstrap.

## Verification and closure target

- Minimum verification: capability probe and Red/Green handshake tests, server-bound scope denial,
  full connect/resync frames, malformed/stale input, bounded inbound payload, asynchronous admission
  race, gateway delegation, drain/close, unsupported and degraded status, then CP-08 local
  predecessors, typecheck, build, and documentation validators.
- Closure target: `runtime_verified` for the authenticated local wire adapter only. No hosted,
  production-performance, gameplay, WebMCP, Re-entry, or Agent claim follows.
- Reopen trigger: the adapter creates a second listener/worker/timer, accepts client scope, bypasses
  the hub/gateway, hides worker degradation, queues unbounded frames, or requires a changed snapshot,
  auth, shutdown, or human-boundary contract.
