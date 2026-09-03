# Target Tech Stack

**Status:** TARGET; CP-02 local runtime evidence recorded, CP-04 process foundation, CP-08 local realtime wire boundary, the bounded CP-12 local fixture/session/browser, automatic publication, snapshot-gated hold, and server-owned continuous-intent paths, and the CP-06 explicitly enabled local autonomous driver verified at named local scopes; the CP-17 local production-like identity/bootstrap seam and minimal Clerk client admission gate are implemented, while provider credentials, hosted scheduler, WebMCP, and hosted gameplay remain open

## CP-02 local result

The disposable harness in [`../../probe/cp02/`](../../probe/cp02/) ran with Node.js `v24.13.1` and
confirmed a loopback worker health lifecycle, Canvas rendering, a typed realtime command and probe snapshot,
SQLite WAL persistence across restart, duplicate idempotency, and visible worker degradation. The
page-side `document.modelContext.registerTool` call returned a registration readback in the named
Codex In-app Browser session. The current Agent adapter could not execute `webmcp_list_tools`; that
limitation is tracked for CP-13/CP-14 and does not become a silent fallback.

Next.js `16.3.4` also started and served an HTTP `200` in the existing local dependency tree. This is a
runtime availability smoke only; game-page integration and hosted topology remain unverified.

For the local durable slice, the recommended process boundary is one explicit Node.js 24 entrypoint
that hosts the Next.js page and the world-worker module in the same OS process. The lifecycle and
health contract is accepted in
[`../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md)
and local process behavior is verified in `SK-EVID-007`. A hosted deployment may split the page and worker only after
CP-17 measures an operational need and preserves the same world-authority and recovery contracts.

## Proposed layers

| Layer | Target | Reason |
|---|---|---|
| Web application shell | Next.js App Router, React, TypeScript, `@clerk/nextjs@7.9.0` | Human-facing dashboard, invite-only auth presentation, routing, and WebMCP registration |
| World renderer | HTML Canvas 2D with a small React control layer | Efficient top-down map rendering without putting game authority in the browser |
| Game server | Node.js 24 and TypeScript authoritative simulation service inside the local entrypoint | Matches the repository's reproducible baseline and supports a long-running worker without a local supervisor |
| Command API | Typed HTTP commands plus a realtime update channel | HTTP makes state-changing commands explicit; realtime updates keep the view current |
| Realtime channel | Direct `ws` `WebSocketServer({ noServer: true })` adapter on the CP-04 custom HTTP upgrade owner | Efficient `client_snapshot` projections plus one-shot server-owned movement-intent commands without a second listener; the adapter is enabled only with a server-owned session resolver and ready gateway |
| Durable store | SQLite on one Railway persistent Volume for the first hosted MVP; PostgreSQL remains a future adapter | Reuses the verified store and keeps one writer; Railway Volume supplies persistence across replacement |
| Event delivery | Transactional outbox plus an Agent Signal dispatcher feeding Re-entry Core's Receiver boundary | Preserves every committed Domain Event while coalescing eligible notifications and applying Thread backpressure |
| WebMCP | Native page-bound `document.modelContext` tools where supported | Lets an Agent act through the canonical game page and current permission surface |
| Hosting | Managed always-on application worker, durable database, health checks, auto-restart | Preserves world continuity across process faults |

These are proposals. The first build may choose a narrower stack after a capability and deployment
review. Redis, a separate pathfinding service, a game engine, and a microservice split are not added
without a concrete performance or authority need. The Node 24 probe found no native WebSocket server;
the direct `ws@8.21.3` dependency is therefore the maintained local server adapter. The adapter's
server-owned session resolver is a seam, not a production identity provider. The local upgrade,
protocol, payload, and drain proof is recorded in
[`../Evidence/SK-EVID-015-cp08-realtime-wire-runtime-verification.md`](../Evidence/SK-EVID-015-cp08-realtime-wire-runtime-verification.md).

The CP-12 fixture path adds no new runtime dependency: it uses the existing Node.js/TypeScript,
SQLite, Next.js, React, and `ws` stack. In explicit `development` or `test` mode, the entrypoint
prepares one task-local SQLite fixture, serves the server-derived session scope, and reuses the same
`ws` adapter for the first full snapshot. The local session evidence is recorded in
[`../Evidence/SK-EVID-028-cp12-local-fixture-session-runtime-verification.md`](../Evidence/SK-EVID-028-cp12-local-fixture-session-runtime-verification.md);
the one-browser hydration and Canvas readback is recorded in
[`../Evidence/SK-EVID-029-cp12-browser-hydration-runtime-verification.md`](../Evidence/SK-EVID-029-cp12-browser-hydration-runtime-verification.md).
These local records do not establish a hosted identity or always-on deployment.

The CP-17 client admission shell adds `@clerk/nextjs@7.9.0` and wraps the App Router with
`ClerkProvider` only when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is present at build time. The signed-out
surface exposes one invite-only Sign in control; the signed-in surface exposes `UserButton` and the
existing Game projection. A missing production publishable key renders an explicit closed state, while
the non-production fixture path retains its existing page behavior. This UI does not derive Game scope
or authorize commands; the custom Node entrypoint still verifies the server-side Clerk session for
bootstrap, HTTP, page tools, and WebSocket admission. The local contract result is recorded in
[`../Evidence/SK-EVID-064-cp17-clerk-client-admission-contract.md`](../Evidence/SK-EVID-064-cp17-clerk-client-admission-contract.md).

For the accepted two-player MVP, this stack is suitable for the Starve.io-inspired minimal surface:
Canvas 2D handles the tile and actor projection, React handles controls and readable status, and a
Node.js worker keeps the world authoritative. A WebSocket `client_snapshot` stream at about 10 Hz plus client
interpolation at up to 60 FPS is the recommended smoothness path; the accepted CP-12 hold interaction
sends one-shot `movement_intent_command` frames and lets the worker's 100 ms cadence produce crossings.
Typed HTTP remains the discrete command boundary. The capability probe and a visible reconnect/degraded
state are required before treating the realtime channel as available.

The accepted CP-12 server-owned continuous-intent runtime boundary is recorded in
[`../Evidence/SK-EVID-043-cp12-server-owned-continuous-intent-runtime-verification.md`](../Evidence/SK-EVID-043-cp12-server-owned-continuous-intent-runtime-verification.md)
and [`../Validation/71-cp12-server-owned-continuous-intent-runtime-cross-functional-audit.md`](../Validation/71-cp12-server-owned-continuous-intent-runtime-cross-functional-audit.md).
The accepted visual split and parallel asset boundary are recorded in
[`../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md)
and [`../Design/06-visual-ui-and-asset-spec.md`](../Design/06-visual-ui-and-asset-spec.md). Asset
replacement must not alter the `client_snapshot`, command, or event contracts.

The first implementation increment is deliberately narrower than this full target. Its accepted
authority, storage, transport, and WebMCP proof boundary is recorded in
[`07-hackathon-mvp-build-gate.md`](07-hackathon-mvp-build-gate.md); that document is a build proposal,
and the CP-17 hosted storage/identity choice is recorded in
[`../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md).
Neither document is hosted runtime evidence.

## Outer integration

The reusable application-neutral Re-entry Core remains under `../../../../reentry-core/` and owns its own
contracts. The game app specializes the Host/page obligation and exposes application tools; it does
not move game authority into the Core or duplicate the Receiver's Grant and delivery rules.
