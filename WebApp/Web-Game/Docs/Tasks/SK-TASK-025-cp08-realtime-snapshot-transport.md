# SK-TASK-025: CP-08 Realtime Snapshot Transport

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-08`
- Owner: Game owner
- Current increment: The transport-neutral process-local hub and browser-safe projection client are runtime-verified for gateway, scope, sequence, lifecycle, and degraded capability boundaries.
- Next gate: Continue with the separately registered entrypoint/wire adapter task; do not infer HTTP/WebSocket, authentication, browser, hosted, or gameplay behavior from this local seam.

## Identity

- Task ID: `SK-TASK-025`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: This increment crosses the HTTP upgrade owner, server-bound identity, snapshot privacy, worker gateway ordering, connection lifecycle, and the browser reconnect handoff. A transport shortcut can create a second authority or leak hidden state while appearing smooth.

## Objective

Provide one entrypoint-owned process-local realtime projection seam for the accepted `client_snapshot`
contract. A server-bound connection must receive a full replacement snapshot on connect and explicit
resync, with a monotonically increasing connection sequence. The hub must delegate reads through
`WorkerCommandGateway`, reject stale or out-of-order frames without mutating local projection state,
and expose typed not-ready, closed, draining, and unsupported-capability outcomes.

## Success and non-goals

- Success: A connection cannot choose another player or shelter scope; its full snapshot remains
  player-scoped and omits private state outside the existing visibility service.
- Success: Connect and resync send full frames with `base_client_snapshot_id = null`; accepted frames
  replace projection state, while stale/out-of-order frames request or require a full resync.
- Success: Movement commands and explicit clock advances remain on the worker gateway; transport input
  cannot mutate domain state directly.
- Success: CP-04 drain/readiness and unsupported WebSocket capability are visible, with no queued
  implicit replay, second worker, second timer, or hidden HTTP fallback.
- Non-goals: Final HTTP/WebSocket wire library selection beyond the smallest local adapter, browser
  Canvas/keyboard implementation, movement command protocol, delta frames, heartbeats, authentication
  issuance, snapshot cadence tuning, slow-client backpressure policy, pathfinding, missions, combat,
  WebMCP, Re-entry, hosted continuity, or production performance.

## Scope and authority

- In scope: the entrypoint-owned local transport/projection module, typed connection/frame lifecycle,
  focused tests, and linked evidence/validation updates.
- Out of scope: `reentry-core/`, `mvp/`, `RightSpot`, external Receiver/Connector, deployment,
  credentials, spend, staging, commit, push, and public communication.
- Allowed actions: Read/edit scoped game files, add a safe local transport dependency only after a
  capability probe, write focused tests/evidence, and run minimum affected verification.
- Revalidate when: CP-04 upgrade/drain ownership, CP-08 snapshot vocabulary, gateway FIFO rules,
  authentication/binding issuance, or unsupported-capability UX changes.

## Owning authority

- Decision: [`../Decisions/ADR-GAME-0016-cp08-realtime-snapshot-transport-boundary.md`](../Decisions/ADR-GAME-0016-cp08-realtime-snapshot-transport-boundary.md)
- Gateway: [`../Decisions/ADR-GAME-0015-cp08-worker-command-read-gateway.md`](../Decisions/ADR-GAME-0015-cp08-worker-command-read-gateway.md)
- Lifecycle: [`../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md) and [`../Engineering/02-system-architecture.md`](../Engineering/02-system-architecture.md)
- Snapshot contract: [`../Engineering/09-mvp-contract-sheet.md#9-snapshot-and-visibility-contract`](../Engineering/09-mvp-contract-sheet.md#9-snapshot-and-visibility-contract) and [`../Mechanics/detail-10-player-exploration-fog-and-intelligence.md`](../Mechanics/detail-10-player-exploration-fog-and-intelligence.md)
- Predecessors: [`SK-TASK-024`](SK-TASK-024-cp08-worker-command-read-gateway.md), [`../Evidence/SK-EVID-013-cp08-worker-command-read-gateway-runtime-verification.md`](../Evidence/SK-EVID-013-cp08-worker-command-read-gateway-runtime-verification.md), and [`../Validation/17-cp08-worker-gateway-runtime-cross-functional-audit.md`](../Validation/17-cp08-worker-gateway-runtime-cross-functional-audit.md)

## Evidence status

- Verified: the worker gateway, full scoped snapshot service, CP-04 upgrade owner, and lifecycle
  boundaries that this task must reuse, plus the transport-neutral hub and browser-safe projection
  client documented in [`SK-EVID-014`](../Evidence/SK-EVID-014-cp08-realtime-snapshot-runtime-verification.md).
- Inferred: full replacement frames and explicit resync are the smallest truthful transport surface
  before delta or browser prediction work.
- Unknown: WebSocket server adapter availability, authentication/binding issuance, slow-client
  behavior, snapshot cadence, browser rendering, and hosted liveness.

## Verification and closure target

- Minimum verification: Red/Green connection lifecycle and projection tests for server-bound scope,
  full connect/resync, sequence ordering, stale frame rejection, gateway delegation, readiness/drain,
  unsupported capability, and no direct mutation; then CP-08 gateway/cadence/snapshot predecessors,
  typecheck, build, and documentation validators.
- Closure target: `runtime_verified` for the local projection transport seam only. No browser slice,
  hosted realtime, WebMCP, Re-entry, or Agent claim follows.
- Reopen trigger: any frame bypasses the gateway, scope can be client-selected, stale frames mutate
  state, connect creates a second listener/clock, or the chosen adapter requires a new wire/identity
  contract.
