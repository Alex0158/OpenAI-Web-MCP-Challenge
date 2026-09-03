# CP-08 Realtime Wire Runtime Cross-Functional Audit

## Review control

- Status: `COMPLETE; BOUNDED LOCAL WIRE RUNTIME VERIFIED`
- Date: 2026-09-02
- Scope: `SK-TASK-026`, the CP-04 `/realtime` upgrade owner, authenticated wire handoff, worker
  composition seam, protocol boundary, and drain lifecycle
- Contract: [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md)
- Decisions: [`../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md), [`../Decisions/ADR-GAME-0016-cp08-realtime-snapshot-transport-boundary.md`](../Decisions/ADR-GAME-0016-cp08-realtime-snapshot-transport-boundary.md), and [`../Decisions/ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md`](../Decisions/ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md)
- Task: [`../Tasks/SK-TASK-026-cp08-entrypoint-realtime-wire-adapter.md`](../Tasks/SK-TASK-026-cp08-entrypoint-realtime-wire-adapter.md)
- Evidence: [`../Evidence/SK-EVID-015-cp08-realtime-wire-runtime-verification.md`](../Evidence/SK-EVID-015-cp08-realtime-wire-runtime-verification.md)
- Challenge: [`19-cp08-entrypoint-wire-preimplementation-challenge.md`](19-cp08-entrypoint-wire-preimplementation-challenge.md)

## Verdict

The registered CP-08 wire increment is coherent and passes its bounded local runtime proof. The
existing CP-04 custom HTTP server remains the sole upgrade owner. When a server-owned resolver and a
ready `PersistenceStore` worker gateway are supplied, one `RealtimeWireAdapter` uses one `ws`
`WebSocketServer({ noServer: true })` and one transport-neutral hub to send full player-scoped
snapshots and explicit full resyncs. Typed admission, protocol, payload, and drain outcomes remain
visible. The default entrypoint is explicitly unsupported when the identity boundary is absent.

This is a local ladder-level-4 process proof. It does not claim a browser slice, production auth,
continuous gameplay, WebMCP, Re-entry, hosted continuity, or performance.

## 1. End-to-end business chain

```text
HTTP upgrade request
-> CP-04 path dispatch
-> runtime admission check
-> injected server-owned session resolver
-> second admission check
-> one ws no-server upgrade
-> RealtimeSnapshotHub.connect
-> WorkerCommandGateway.fullSnapshot FIFO read
-> player-scoped full client_snapshot
-> exact resync_request validation
-> coalesced full replacement
-> hub/transport drain
-> CP-04 worker and HTTP shutdown
```

The chain has no gameplay mutation, settlement, event append, clock advance, or Agent action. A
failed step returns a typed HTTP or WebSocket outcome and does not become a successful live stream.

## 2. Cross-functional boundary review

| Surface | Verified disposition | Residual handoff |
|---|---|---|
| CP-04 process and upgrade | One entrypoint listener delegates `/realtime`; shutdown calls adapter drain and close; unknown development upgrades keep their existing path. | Hosted proxy upgrade behavior and production deployment remain CP-17 work. |
| Identity and privacy | Resolver-only server context; query and inbound scope fields are ignored or rejected; no credential values enter frames or logs. | Production issuer, cookie/session policy, Origin/CSRF, and rotation remain open. |
| Worker and gateway | Real composition uses one worker-owned gateway and hub; snapshots are read only through gateway FIFO. | Default world bootstrap and scheduler-owned gameplay due work remain open. |
| Snapshot contract | Connect/resync use the existing full frame with null base and per-connection sequence; browser projection checks remain intact. | Delta/cadence/heartbeat/slow-client policy requires measured follow-up. |
| Protocol and failure | Exact four-key resync shape, connection match, bounded non-negative sequence, 16 KiB inbound limit, typed HTTP errors, `1008` malformed close, and `1009` oversize close are visible. | Version negotiation and production rate limits are not selected. |
| Persistence and world time | No socket state is durable; no wire code advances time or writes domain state. | Reconnect after process replacement and hosted durable continuity remain CP-06/17 gates. |
| Browser/UI | Unsupported default is truthful and leaves normal HTTP page path available. | No browser Canvas, keyboard, interpolation, accessibility, or visible connection-status implementation. |
| WebMCP/Re-entry | Wire carries no command, prompt, Signal, Receiver, Connector, or Thread message. | CP-13/14 must use the page and backpressure contract independently. |

## 3. Failure, duplicate, stale, and race matrix

| Case | Expected invariant | Runtime disposition |
|---|---|---|
| Missing or invalid session | No upgrade; no scope disclosure; typed `401`. | Passed. |
| Client query or frame selects another player/world | Server context remains unchanged; extra frame keys are rejected. | Passed. |
| Runtime starting/degraded/draining/closed | No new connection; active sockets drain visibly. | Passed for degraded, draining, and closed/default paths. |
| Auth completes after drain begins | Second admission check rejects the upgrade. | Passed with an asynchronous resolver race fixture. |
| Valid connect and resync | Full replacement, monotonic sequence, null base, gateway-only read. | Passed; predecessor hub suite also passes. |
| Concurrent or repeated resync | No unbounded application queue; hub coalesces in-flight read. | Passed by predecessor hub suite; wire does not add a queue. |
| Malformed, wrong connection, future sequence | Typed protocol error, no domain mutation, protocol close. | Passed for malformed and wrong connection; future sequence is rejected by the same parser path. |
| Oversized inbound payload | Transport closes before application handling. | Passed with `1009` at the 16 KiB boundary. |
| Sink/worker failure | No success frame; connection is stale or closed with typed outcome. | Hub predecessor coverage passes; wire maps the outcome. |
| Repeated drain/close | Idempotent lifecycle; no second listener or worker. | Passed by focused wire and entrypoint tests. |
| Restart/replay | Durable world remains authoritative; socket state is not replayed. | CP-05/06 aggregate passes; live socket replacement remains a later hosted/browser test. |

## 4. Findings and disposition

| Severity | Finding | Disposition |
|---|---|---|
| P1 | No production identity/session issuer exists. | Deliberately outside CP-08; the resolver seam and explicit unsupported default prevent a fixture credential from becoming production truth. Reopen before production exposure. |
| P2 | No browser consumer or two-browser slice exists. | Correctly deferred to CP-12 and CP-16; Node `ws` proves the local wire only. |
| P2 | No Origin/CSRF, heartbeat, cadence, delta, rate limit, or measured slow-client policy exists. | Correctly deferred; adding any of these would change the protocol or operational budget and needs its own task/decision. |
| P2 | The default entrypoint has no world bootstrap and only composes a gateway-backed adapter when a resolver is injected. | Correctly visible; CP-07 fixture seeding is test-only and CP-17/default-world work must supply the real composition. |
| P3 | Messages arriving before the first hub handle is attached are ignored while the initial full frame is being read. | Safe for this projection-only increment because no mutation or scope selection occurs; define an explicit pre-connect message policy if a browser client needs one. |

No finding blocks closure of the registered local task. The P1/P2 items are explicit later gates, not
silent fallbacks or contradictory current claims.

## 5. Closure disposition

`SK-TASK-026` closes as `runtime_verified` for the authenticated local wire adapter, full connect and
resync projection, protocol and payload rejection, entrypoint composition, and drain lifecycle. The
next bounded task may begin CP-09 mission/role/return implementation after its preparation pack and
authority records are read. The CP-08 checkpoint as a whole remains open for browser UX, visibility
expansion, gameplay projections, and later local slice closure.
