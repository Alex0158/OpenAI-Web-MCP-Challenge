# Target Tech Stack

**Status:** TARGET; no implementation evidence yet

## Proposed layers

| Layer | Target | Reason |
|---|---|---|
| Web application shell | Next.js App Router, React, TypeScript | Human-facing dashboard, routing, auth boundary, and WebMCP registration |
| World renderer | HTML Canvas 2D with a small React control layer | Efficient top-down map rendering without putting game authority in the browser |
| Game server | Node.js 24 and TypeScript authoritative simulation service | Matches the repository's reproducible baseline and supports a long-running worker |
| Command API | Typed HTTP commands plus a realtime update channel | HTTP makes state-changing commands explicit; realtime updates keep the view current |
| Realtime channel | WebSocket target, subject to an early capability probe | Efficient snapshots and event updates for an open world |
| Durable store | PostgreSQL for a hosted world; SQLite for a disposable local concept harness | Production durability and a low-friction local smoke path |
| Event delivery | Transactional outbox feeding Re-entry Core's Receiver boundary | Prevents a committed gameplay event from being lost before continuation delivery |
| WebMCP | Native page-bound `document.modelContext` tools where supported | Lets an Agent act through the canonical game page and current permission surface |
| Hosting | Managed always-on application worker, durable database, health checks, auto-restart | Preserves world continuity across process faults |

These are proposals. The first build may choose a narrower stack after a capability and deployment
review. Redis, a separate pathfinding service, a game engine, and a microservice split are not added
without a concrete performance or authority need.

For the accepted two-player MVP, this stack is suitable for the Starve.io-inspired minimal surface:
Canvas 2D handles the tile and actor projection, React handles controls and readable status, and a
Node.js worker keeps the world authoritative. A WebSocket snapshot stream at about 10 Hz plus client
interpolation at up to 60 FPS is the recommended smoothness path; typed HTTP remains the command
boundary. The capability probe and a visible reconnect/degraded state are required before treating the
realtime channel as available.

The first implementation increment is deliberately narrower than this full target. Its proposed
authority, storage, transport, and WebMCP proof boundary is recorded in
[`07-hackathon-mvp-build-gate.md`](07-hackathon-mvp-build-gate.md); that document is a build proposal,
not an accepted production topology.

## Outer integration

The reusable application-neutral Re-entry Core remains under `../../../../reentry-core/` and owns its own
contracts. The game app specializes the Host/page obligation and exposes application tools; it does
not move game authority into the Core or duplicate the Receiver's Grant and delivery rules.
