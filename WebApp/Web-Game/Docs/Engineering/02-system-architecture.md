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
  → Re-entry Core Receiver for eligible continuation events
  → canonical page / WebMCP tools
```

## Components

- **Browser shell:** renders current snapshots, owns ordinary human interaction, registers current
  WebMCP tools, and never decides ownership, rewards, combat, or shelter position.
- **Game API:** authenticates the player, validates command shape, checks current versions, and calls
  the domain command service.
- **World simulation worker:** advances due milestones, resolves path and encounters, applies combat,
  updates monsters and resources, and emits typed events.
- **Domain store:** persists shelters, soldiers, missions, cargo, nodes, monsters, intelligence,
  world clock, versions, and event records.
- **Projection/read model:** supplies the shelter dashboard, map layers, mission history, and Agent
  inspection results from authoritative state.
- **Re-entry adapter:** maps eligible domain events to the existing Re-entry Core event contract;
  it does not smuggle prompts, credentials, or mutable game state into an event.

## Boundary rules

The server rejects stale, unauthorized, duplicate, impossible, or out-of-state commands. The page can
optimistically animate a request but must reconcile against the server snapshot. A human-facing label
or hidden control is never a security boundary.
