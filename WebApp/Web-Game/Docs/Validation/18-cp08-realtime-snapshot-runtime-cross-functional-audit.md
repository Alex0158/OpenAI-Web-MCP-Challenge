# CP-08 Realtime Snapshot Runtime Cross-Functional Audit

## Review control

- Status: BOUNDED REALTIME SNAPSHOT SEAM REVIEW COMPLETE; HTTP/WIRE CP-08 REMAINS OPEN
- Date: 2026-09-02
- Scope: `SK-TASK-025`, the process-local snapshot hub, server-bound connection scope, full
  replacement/resync frames, browser sequence validation, and lifecycle failure behavior
- Contract: [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md)
- Decisions: [`../Decisions/ADR-GAME-0016-cp08-realtime-snapshot-transport-boundary.md`](../Decisions/ADR-GAME-0016-cp08-realtime-snapshot-transport-boundary.md), [`../Decisions/ADR-GAME-0015-cp08-worker-command-read-gateway.md`](../Decisions/ADR-GAME-0015-cp08-worker-command-read-gateway.md), and [`../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md)
- Task: [`../Tasks/SK-TASK-025-cp08-realtime-snapshot-transport.md`](../Tasks/SK-TASK-025-cp08-realtime-snapshot-transport.md)
- Evidence: [`../Evidence/SK-EVID-014-cp08-realtime-snapshot-runtime-verification.md`](../Evidence/SK-EVID-014-cp08-realtime-snapshot-runtime-verification.md)

## Verdict

The registered increment is coherent and locally `runtime_verified` for a transport-neutral
projection seam. `RealtimeSnapshotHub` keeps one process-local connection registry, captures an
entrypoint-supplied binding, obtains full snapshots through the worker gateway, and emits monotonic
replacement frames. The browser-safe projection client rejects wrong scope, malformed bases, and
stale sequences without mutating accepted state. Unsupported, not-ready, failed-sink, draining, and
closed outcomes are visible and do not create a hidden fallback.

The result is deliberately narrower than a live multiplayer game. The current entrypoint still
rejects `/realtime` upgrades until a later authenticated wire adapter is registered, so no browser,
network, hosted, cadence, or gameplay claim follows from this closure.

## 1. Authority and projection checks

| Boundary | Verified disposition | Handoff or residual |
|---|---|---|
| Snapshot authority | Every server read enters `WorkerCommandGateway.fullSnapshot`; the hub never reads the store or domain directly. | A future upgrade handler must construct the hub once and reuse the same gateway. |
| Connection identity | Context is copied at connect and the binding is private to the server record; the handle cannot select a player or shelter. | Authentication and binding issuance remain a later boundary. |
| Privacy | The existing `ClientSnapshotService` supplies player-scoped snapshots; the test confirms Player B state is absent from Player A's frame. | Visibility expansion and sensor payloads remain open. |
| Replacement semantics | Connect and resync always send full frames with `base_client_snapshot_id = null`; client replacement is atomic after validation. | Delta frames and exact wire envelopes are deferred. |
| Sequence order | Per-connection sequences increase for each attempted frame; stale or out-of-order frames are rejected and request a full replacement. | Network delivery and reconnect transport still need an adapter proof. |

## 2. Ordering, queue, and race checks

- Snapshot reads remain in the gateway FIFO with movement commands and explicit worker advances; the
  transport cannot commit movement, time, visibility, combat, or rewards.
- Concurrent `requestResync()` calls share the single in-flight read, preventing an unbounded local
  replacement queue. No timer or cadence was introduced.
- Closing or draining a connection marks it closed before sink closure. A read that returns after that
  boundary is not sent, and new admission fails with a typed lifecycle result.
- A sink failure marks the connection stale; the next explicit full replacement advances the sequence
  instead of pretending the failed frame was delivered.
- A gateway or worker failure remains visible through a mapped transport error. Domain ownership,
  stale revisions, idempotency, and persistence errors remain owned by their existing services.

## 3. Cross-checkpoint handoffs

| Consumer | Safe input now | Must not infer yet |
|---|---|---|
| CP-04 runtime | Hub drain/close can be called by the entrypoint's shutdown orchestrator; unsupported capability is explicit. | The hub is not yet wired to the actual HTTP upgrade, registry health, or shutdown deadline. |
| CP-05 persistence | Full reads preserve existing durable snapshot, event, revision, and ownership rules. | Connection frames or in-flight reads are durable or replayable after process replacement. |
| CP-06/08 worker | Gateway FIFO remains the only command/read/advance ordering path; no second clock exists. | A local hub proves continuous world time, scheduler cadence, or hosted liveness. |
| CP-09+ gameplay | Later missions and combat can project through the same full snapshot contract. | The frame seam implements no soldiers, routes, extraction, combat, or settlement. |
| CP-12 browser | A browser-safe client validator is available for a future Canvas consumer and visibly enters STALE. | Keyboard, Canvas interpolation, reconnect UI, accessibility, and browser/network delivery are unverified. |
| CP-13/14 WebMCP/Re-entry | Projection remains separate from page tools and Agent Signals. | Realtime frames do not prove WebMCP discovery, Agent wake, or Re-entry action execution. |

## 4. Findings and disposition

| Severity | Finding | Disposition |
|---|---|---|
| P1 | The production entrypoint still destroys `/realtime` upgrades; no authenticated HTTP/WebSocket adapter or real browser connection exists. | Accepted and made explicit by ADR-GAME-0016. Register the next bounded entrypoint/wire task before any two-browser or G1 realtime claim. |
| P1 | The default entrypoint cannot yet construct a gameplay gateway from its worker-only dependency surface or bootstrap a world. | Accepted local topology boundary. The next integration task must supply one injected runtime composition without adding a second worker or hidden fallback. |
| P2 | No production cadence, packet limit, heartbeat, or slow-client admission policy is selected. | Correctly deferred until a wire adapter and measurements exist; the hub coalesces only concurrent explicit resync calls. |
| P2 | Authentication and shelter-binding issuance are injected in tests. | Correctly deferred; a client-supplied player or binding is never trusted by the hub API. |
| P2 | Browser smoke is absent and `structuredClone` is the client copy primitive. | Accepted for this transport-neutral seam; validate browser support when CP-12 consumes the client module. |

No finding blocks closure of the registered local increment. Each residual concern has an explicit
owner, later task boundary, and reopen condition; none is hidden as a hosted or live-game claim.

## Closure disposition

`SK-TASK-025` may close as `runtime_verified` for the process-local full-snapshot connection and
browser projection semantics. The next registered work must attach an authenticated, entrypoint-owned
wire adapter and visible degraded page status before claiming a genuine realtime channel.
