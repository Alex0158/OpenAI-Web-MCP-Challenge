# Engineering

This module owns the target technical shape and the proof boundary. It does not claim that the
proposed services, runtime, transport, or WebMCP tools exist.

- [`01-tech-stack.md`](01-tech-stack.md) — proposed client, server, storage, and hosting choices;
- [`02-system-architecture.md`](02-system-architecture.md) — authority and component boundaries;
- [`03-persistence-world-clock-and-events.md`](03-persistence-world-clock-and-events.md) — durable
  state, event log, and outbox;
- [`04-simulation-and-performance.md`](04-simulation-and-performance.md) — efficient movement,
  pathfinding, encounters, and ticks;
- [`05-api-and-webmcp.md`](05-api-and-webmcp.md) — application commands and page-bound tools; and
- [`06-operations-and-hosting.md`](06-operations-and-hosting.md) — always-on service, restart,
  observability, and recovery targets;
- [`07-hackathon-mvp-build-gate.md`](07-hackathon-mvp-build-gate.md) — proposed first vertical slice,
  stack gate, and implementation exit criteria; and
- [`08-development-roadmap-and-checkpoints.md`](08-development-roadmap-and-checkpoints.md) — sequenced
  delivery checkpoints, dependencies, release gates, and closure evidence.
- [`09-mvp-contract-sheet.md`](09-mvp-contract-sheet.md) — normative G2 identities, states, events,
  commands, settlement, `world_snapshot`/`client_snapshot` projections, and causal acceptance stories.
- [`10-cp13-cp18-implementation-seam-map.md`](10-cp13-cp18-implementation-seam-map.md) — file-level
  implementation routing, predecessor gates, focused proofs, hosted handoff, and claim boundaries
  for CP-13 through CP-18.
- The CP-04 process boundary is accepted in
  [`../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md`](../Decisions/ADR-GAME-0011-cp04-local-runtime-boundary-and-health-contract.md);
  its local process behavior is recorded in `SK-EVID-007`; hosted/world behavior remains unverified.
