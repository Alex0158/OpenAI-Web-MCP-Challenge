# CP-08 Entrypoint Realtime Wire Adapter Challenge

## Review control

- Status: ACCEPTED FOR BOUNDED IMPLEMENTATION
- Date: 2026-09-02
- Scope: `SK-TASK-026`, the CP-04-owned `/realtime` upgrade handoff and local authenticated wire adapter
- Task: [`../Tasks/SK-TASK-026-cp08-entrypoint-realtime-wire-adapter.md`](../Tasks/SK-TASK-026-cp08-entrypoint-realtime-wire-adapter.md)
- Existing authority: [`../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md), [`../Decisions/ADR-GAME-0015-cp08-worker-command-read-gateway.md`](../Decisions/ADR-GAME-0015-cp08-worker-command-read-gateway.md), and [`../Decisions/ADR-GAME-0016-cp08-realtime-snapshot-transport-boundary.md`](../Decisions/ADR-GAME-0016-cp08-realtime-snapshot-transport-boundary.md)
- Intended decision: [`../Decisions/ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md`](../Decisions/ADR-GAME-0017-cp08-authenticated-realtime-wire-adapter.md)

## Question and falsifiers

The question is whether the verified transport-neutral `RealtimeSnapshotHub` can be attached to the
existing custom-server upgrade owner with one small authenticated wire adapter, while preserving one
worker, one gateway, one hub, and one shutdown path.

The hypothesis is falsified if any of the following is true:

- the Node 24/Next surface cannot accept a `noServer` WebSocket adapter without a second listener;
- the adapter must trust a client-selected `world_id`, `player_id`, `shelter_id`, or binding because no
  server-owned session boundary can be injected;
- the first frame requires a delta, command, timer, or durable socket queue that the accepted snapshot
  contract does not provide; or
- CP-04 cannot drain the adapter before the HTTP server and worker close within its existing deadline.

The capability probe found that Node 24 exposes a browser-compatible `WebSocket` client but no native
`WebSocketServer`. Next 16.3.4 exposes `getUpgradeHandler()` on the custom server, and the existing
entrypoint owns the HTTP `upgrade` event. The repository has no direct `ws`, `websocket`, or
`uWebSockets.js` dependency and no production authentication/session issuer. The historical CP-02 raw
handshake is a disposable probe and is not an implementation authority.

## Affected and unaffected surfaces

| Surface | Affected disposition |
|---|---|
| CP-04 entrypoint | Sole `/realtime` upgrade owner; delegates to one adapter and drains it before server close |
| RealtimeSnapshotHub | Remains projection and connection authority; no wire parsing or credential handling |
| WorkerCommandGateway | Sole snapshot read path; no direct store/domain access from the adapter |
| Identity/auth | Adapter receives a server-resolved opaque session context; no client scope fields are trusted |
| Wire | Full `client_snapshot` frames plus one exact `resync_request` control message |
| Browser projection | Existing sequence/scope validator remains the replacement consumer |
| Persistence/world clock | Unchanged; no socket timer, durable connection state, or clock authority |
| WebMCP/Re-entry/gameplay | Unaffected and explicitly out of scope |

## Failure modes to disprove

- **Authority leak:** a query parameter, header, or message changes the bound player, shelter, world, or
  opaque binding.
- **Duplicate authority:** a route or adapter constructs another worker, store, clock, gateway, or
  listener.
- **Handshake race:** authentication succeeds while the runtime enters `DEGRADED` or `DRAINING`, and
  the adapter still admits the connection.
- **Hidden failure:** an unavailable worker, unsupported adapter, malformed message, or sink failure is
  represented as a successful live stream.
- **Frame corruption:** a wire message merges an untrusted base or accepts stale/out-of-order state.
- **Unbounded work:** repeated resync messages create one promise or frame per message instead of using
  the hub's coalesced request.
- **Shutdown leak:** active WebSocket connections survive the CP-04 drain deadline or a new upgrade is
  admitted after draining starts.
- **Credential exposure:** auth headers, cookies, raw session values, or resolver errors appear in a
  frame, log, or typed response body.

## Options

### Minimal: direct `ws` `noServer` adapter with injected resolver

Use the maintained `ws` package as a direct runtime dependency, create one `WebSocketServer` with
`noServer: true`, and inject a `RealtimeSessionResolver` that returns a server-owned context. The
default entrypoint has no issuer or gameplay gateway yet, so it exposes an explicit unsupported result;
fixture tests provide an opaque session resolver and a real hub/gateway.

This is the smallest path that proves a real HTTP upgrade without moving auth or game authority into a
socket handler. It adds one dependency and deliberately does not claim production auth or hosted
realtime.

### Conservative: keep the upgrade rejected until auth and worker composition are complete

Retain the CP-04 destroy path and defer all wire code. This avoids dependency and identity risk but
does not advance the registered task or demonstrate a real connection.

### Expanded: raw native handshake or framework-internal WebSocket server

Copy the historical raw handshake or import Next's private compiled `ws` bundle. This avoids a direct
package install but creates protocol maintenance, masking, and upgrade risk; the probe's test server
is explicitly disposable and a framework-private module is not a stable project contract.

## Chosen path

Choose the minimal path and record it in ADR-GAME-0017:

1. The entrypoint remains the only HTTP upgrade owner and receives one adapter instance. The adapter
   never starts a server, worker, timer, or store.
2. A `RealtimeSessionResolver` is the only identity handoff. It receives the upgrade request and either
   returns a server-created `ServerBoundRealtimeContext` or no session. The adapter never interprets a
   client `player_id`, `shelter_id`, `world_id`, or binding as authority. The fixture resolver may map an
   opaque test cookie to a context; this is not a production issuer.
3. The adapter sends the hub's exact full replacement frame as JSON. The only accepted inbound message
   is the existing `resync_request` shape with the server-issued connection id and a bounded reason and
   sequence. It cannot mutate domain state.
4. Before and after authentication the adapter rechecks runtime admission. Unsupported, not-ready,
   degraded, draining, malformed, unauthorized, and closed outcomes are typed and visible; no polling,
   implicit retry, or hidden fallback is introduced.
5. `drain()` is called before CP-04 closes the HTTP listener. The hub closes active sinks, rejects new
   upgrades, and keeps the existing shutdown deadline as the only lifecycle budget.

## Non-goals and claim boundary

This challenge does not select a production identity provider, issue real credentials, define Origin or
CSRF policy, add movement commands, add deltas/heartbeats/cadence, tune production backpressure,
bootstrap a world in the default process, implement Canvas or keyboard UX, or claim browser, hosted,
WebMCP, Re-entry, gameplay, or performance closure.

The result can support a local wire contract when a server-owned resolver and a ready gameplay gateway
are injected. The default entrypoint remains explicitly unsupported until those later composition
boundaries exist.

## Verification and recovery

The Red harness must fail before the adapter exists for:

- a real HTTP upgrade with no session, an invalid session, a valid server-resolved session, and a
  client-supplied scope attempt;
- sequence-1 full connect and sequence-2 full resync through the gateway, malformed/stale control
  messages, and coalesced concurrent resync;
- not-ready/degraded/unsupported/draining/closed admission and the absence of a second listener or
  worker;
- active connection drain and repeated shutdown; and
- absence of credential values in frames, response bodies, or logs.

After Green, rerun the focused wire and predecessor CP-08 suites, typecheck, build, and the documentation
validators. If the adapter needs a changed snapshot, auth, shutdown, or gateway contract, stop and
reopen this challenge rather than silently expanding it. Recovery is to disable the injected adapter,
restore the visible unsupported upgrade result, and leave the verified transport-neutral hub intact.

## Reopen triggers

Reopen before further implementation if the chosen dependency cannot run on Node 24, a client can select
projection scope, the resolver has to issue or persist credentials inside this task, an upgrade creates
a second HTTP owner, runtime degradation is hidden, inbound messages mutate gameplay, repeated resync
creates an unbounded queue, or drain cannot close connections within the existing CP-04 lifecycle.
