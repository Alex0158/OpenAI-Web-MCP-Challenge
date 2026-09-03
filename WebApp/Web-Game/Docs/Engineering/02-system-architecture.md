# System Architecture

**Status:** TARGET architecture

## Authority flow

```text
Canvas and dashboard
  → typed game command
  → game API / command boundary
  → authoritative world domain
  → durable state + event log + outbox
  → realtime projection and dashboard
  → Agent Signal policy and delivery backpressure
  → Re-entry Core Receiver for eligible continuation events
  → canonical page / WebMCP tools
```

## Local process boundary

The accepted local G2 topology is one Node.js process with one explicit entrypoint. The page
application, world-worker module, HTTP request handler, process-level health adapter, and future
realtime upgrade dispatcher are logical modules under that entrypoint; they are not independent local
authorities.
The entrypoint starts the worker exactly once and owns process lifecycle. A request handler or page
module must never start a singleton worker, including during development reloads.

The CP-04 health result is served at the process HTTP layer and describes process liveness/readiness
only. `READY` means the page and worker
startup seams are available; it does not assert that persistence, `world_snapshot`, or `world_time`
exists before CP-05/CP-06. A worker fault makes the process `DEGRADED`, rejects state-changing work,
and is recovered by a bounded process restart path. The accepted lifecycle and health contract is
recorded in [`../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md).

Next.js route and page modules are request adapters. They must call an entrypoint-owned command
gateway or explicit worker message interface rather than importing a mutable worker singleton; this
keeps the page bundle from becoming a second authority.

The local CP-08 implementation now provides `WorkerCommandGateway` as that process-local handoff for
movement intent, full snapshot reads, and explicit worker clock advances. `RealtimeSnapshotHub` and
the browser-safe projection validator build a transport-neutral full connect/resync seam on top of
that gateway. `RealtimeWireAdapter` attaches one `ws` no-server instance to the same entrypoint when
a server-owned session resolver is supplied; the default process has no issuer and therefore keeps
the route visibly unsupported. In the owner-accepted CP-12 local fixture mode, the same entrypoint
also owns a development/test-only `GET /api/local-fixture/bootstrap` read boundary, prepares one
file-backed fixture store before the worker becomes ready, and composes one opaque-handle resolver for
both bootstrap and `/realtime`. The page receives server-derived scope before validating its first
full frame; the server-issued connection id is bound only after that validation. Hosted scheduler,
production identity, and browser hydration/two-browser behavior remain later checkpoint work.

The entrypoint owns `/realtime` HTTP upgrade dispatch and drains the adapter before the worker and
HTTP listener close. The accepted CP-12 continuous-intent path binds each active movement intent to
the adapter's opaque connection owner; close, drain, or worker cleanup revokes it before asynchronous
socket cleanup, while worker cadence and full snapshots remain the only gameplay and render paths.
The named local runtime result is bound to [`SK-EVID-043`](../Evidence/SK-EVID-043-cp12-server-owned-continuous-intent-runtime-verification.md)
and [`Validation/71`](../Validation/71-cp12-server-owned-continuous-intent-runtime-cross-functional-audit.md).
CP-04 remains the sole listener owner. If CP-17 later splits hosted page and worker services,
the worker remains the only world authority and the page communicates through an explicit command,
snapshot, and health contract; the local process shape cannot be silently treated as hosted proof.

## Components

- **Browser shell:** renders current `client_snapshot` projections, owns ordinary human interaction, registers current
  WebMCP tools, and never decides ownership, rewards, combat, or shelter position.
- **Game API:** authenticates the player, validates command shape, checks current versions, and calls
  the domain command service.
- **World simulation worker:** advances due milestones, resolves path and encounters, applies combat,
  updates monsters and resources, and emits typed events.
- **Domain store:** persists shelters, soldiers, missions, cargo, nodes, monsters, intelligence,
  world clock, versions, and event records.
- **Projection/read model:** supplies the shelter dashboard, map layers, mission history, and Agent
  inspection results from authoritative state.
- **Agent Signal dispatcher:** classifies domain events, coalesces eligible events by opaque shelter
  binding, enforces one pending or in-flight signal per bound Thread, and holds delivery while a Thread
  turn is active. It is a transport control, not game authority.
- **Re-entry adapter:** maps eligible domain events to the existing Re-entry Core event contract;
  it does not smuggle prompts, credentials, or mutable game state into an event. It receives derived
  Agent Signals rather than a raw high-frequency simulation stream.

## Boundary rules

The server rejects stale, unauthorized, duplicate, impossible, or out-of-state commands. The page can
optimistically animate a request but must reconcile against the authoritative `client_snapshot`. A
human-facing label
or hidden control is never a security boundary. Domain Events remain durable even when their derived
Agent Signals are coalesced. A running Codex Thread is never flooded with one message per event, and
the world never waits for an Agent signal or action.
