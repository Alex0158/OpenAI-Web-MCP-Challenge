# CP-08 Worker Command and Read Gateway Runtime Cross-Functional Audit

## Review control

- Status: BOUNDED WORKER GATEWAY REVIEW COMPLETE; BROADER CP-08 REMAINS OPEN
- Date: 2026-09-02
- Scope: `SK-TASK-024`, the process-local FIFO gateway for movement intent commands, full snapshot
  reads, explicit worker clock advances, input capture, failure isolation, and lifecycle closure
- Contract: [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md)
- Decisions: [`../Decisions/ADR-GAME-0015-cp08-worker-command-read-gateway.md`](../Decisions/ADR-GAME-0015-cp08-worker-command-read-gateway.md), [`../Decisions/ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md`](../Decisions/ADR-GAME-0014-cp08-worker-cadence-and-intent-lifecycle.md), and [`../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md)
- Task: [`../Tasks/SK-TASK-024-cp08-worker-command-read-gateway.md`](../Tasks/SK-TASK-024-cp08-worker-command-read-gateway.md)
- Evidence: [`../Evidence/SK-EVID-013-cp08-worker-command-read-gateway-runtime-verification.md`](../Evidence/SK-EVID-013-cp08-worker-command-read-gateway-runtime-verification.md)

## Verdict

The registered gateway increment is coherent and locally `runtime_verified`. A single process-local
FIFO seam now orders movement intent set/stop, full player-scoped snapshot reads, and explicit worker
clock advances. It captures request values at submission, preserves domain errors, isolates a failed
entry, rejects work when the worker is not ready or the gateway is closed, and leaves CP-04 shutdown
ownership unchanged.

The result is intentionally narrower than a realtime game. The gateway is not a durable queue, a
host scheduler, an HTTP/WebSocket protocol, an authentication layer, a snapshot cadence, or a browser
authority. Those claims remain open and must be separately registered.

## 1. Ordering and authority checks

| Boundary | Verified disposition | Handoff or residual |
|---|---|---|
| FIFO ordering | Commands, reads, and explicit advances submitted to one gateway run in invocation order; a rejected entry does not poison the tail. | Every browser/transport route must use this gateway; direct service calls remain internal only. |
| Domain authority | The gateway delegates to `PlayerMovementCadenceService`, `ClientSnapshotService`, and `WorldWorkerModule.advance`; it does not mutate game state or invent a world. | Future transport must not add a parallel state path. |
| Request identity | Set/stop/snapshot inputs are shallow-captured before queueing; world/player/binding, expected revision, and idempotency are forwarded unchanged. | Deep mutable payloads are not part of this local input shape; a future wire envelope must validate and canonicalize its own payload. |
| Clock | The worker's existing explicit `advance` is queued beside commands and reads. No timer or second clock exists. | Host scheduling and trusted wall-time catch-up remain later work. |
| Projection | A read after an accepted command/advance sees the later durable position; a read submitted first observes the earlier state. | Snapshot consistency across a network frame and reconnect still belongs to a transport task. |

## 2. Lifecycle, shutdown, and replacement

- Calls made before worker readiness return `WORKER_NOT_READY` without touching the closed store. A
  worker state change before a queued callback starts is checked again and fails visibly.
- `close()` prevents new work and causes queued, not-yet-started callbacks to return `GATEWAY_CLOSED`.
  An already executing synchronous domain operation may finish; the gateway never interrupts a
  transaction.
- Closing the gateway does not stop the worker, close SQLite, or change the runtime registry. This is
  deliberate: CP-04 entrypoint shutdown remains the sole lifecycle orchestrator.
- A replacement path must close the old gateway before constructing the new one. The queue is in-memory
  and therefore cannot survive replacement; movement intent and fractional progress already clear by
  ADR-GAME-0014.

## 3. Identity, revision, and failure checks

- Existing ownership and revision checks remain in the cadence and movement services. A stale command
  still returns `STALE_REVISION`, and later valid work executes after that rejection.
- Existing CP-05 idempotency and event transactions remain the only replay boundary. The gateway does
  not assign event ids, write rows, or turn a domain error into a success response.
- Missing `advance` is surfaced as `WORKER_CLOCK_UNAVAILABLE`; it is not replaced with a timer or a
  synthetic clock.
- Queue order does not change the accepted one-intent-per-player lifecycle: a stop before a later
  advance prevents movement, while a command followed by advance produces the cadence's documented
  integer crossing.

## 4. Cross-checkpoint handoffs

| Consumer | Safe input now | Must not infer yet |
|---|---|---|
| CP-04 runtime | Gateway close is admission control; entrypoint still owns worker stop, listener drain, and store close | Gateway readiness alone is process health or hosted liveness |
| CP-05 persistence | Domain transaction, idempotency, revision, event, and snapshot rows are unchanged | Queued work is durable or recoverable after replacement |
| CP-06 clock | Explicit worker advance shares FIFO ordering and keeps phase boundaries authoritative | A local advance proves wall-time catch-up or always-on continuity |
| CP-08 transport/visibility | One local seam can back future command/read adapters and full replacement snapshots | Wire envelope, bounded backpressure, delta base, 10 Hz delivery, or visible actor policy |
| CP-09 missions | Future mission commands can use the same worker ordering and revision boundary | Soldiers inherit player intent or gateway speed |
| CP-13 WebMCP | Future page tools can call the same gateway after capability registration | Gateway presence proves WebMCP availability or grants |
| CP-14 Re-entry | A resumed Agent can reread state through a later authorized adapter | Routine movement/clock operations become Agent Signals |

## 5. Performance and user-flow review

- The queue adds Promise microtasks while underlying local operations remain synchronous. This is
  sufficient for ordering proof, but no throughput or latency budget is claimed.
- There is no speculative queue-size or coalescing policy. A later transport task must bound admission
  and overload behavior using measured input frequency, stale revision handling, and the requirement
  that high-frequency routine events do not become Thread messages.
- The local increment has no browser UI. Keyboard behavior, reconnect status, interpolation, degraded
  realtime messaging, and accessibility remain unverified.

## 6. Findings and disposition

| Severity | Finding | Disposition |
|---|---|---|
| P1 | The gateway is caller-constructed and is not yet wired into the HTTP entrypoint or a hosted scheduler. | Accepted local boundary. Register transport/entrypoint integration before any two-browser or G1/G3 claim. |
| P1 | The queue is process-local and has no durable admission/backpressure or failover semantics. | Accepted by ADR-GAME-0015. The transport and hosted tasks must choose measured limits and explicit overload outcomes. |
| P2 | Gateway readiness checks `WorldWorker.state`; it does not observe `RuntimeRegistry.degraded` directly. | Accepted because CP-04 remains the lifecycle owner. Integration must reject new work when the accepted runtime readiness boundary is degraded or draining. |
| P2 | Close rejects queued callbacks but cannot cancel an operation already executing. | Accepted for synchronous local transactions; if future operations become asynchronous, cancellation/lease semantics need a new decision. |
| P2 | Full snapshot reads still use the existing local service read sequence rather than a network frame transaction. | Accepted local seam; reconnect consistency and snapshot cadence require the next transport increment. |

No finding blocks closure of `SK-TASK-024`. All remaining concerns have an owning future surface and a
reopen condition; no wire, hosted, or Agent behavior is implied.

## Closure disposition

`SK-TASK-024` may close as `runtime_verified` for process-local command/read/clock FIFO ordering,
request capture, lifecycle failure, and domain delegation. The broader CP-08 roadmap remains
`IN PROGRESS`; the next bounded task should connect this seam to the chosen local transport and full
snapshot delivery contract before browser or realtime claims are made.
