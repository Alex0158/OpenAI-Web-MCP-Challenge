# ADR-RS-0002: RightSpot Logical Backbone Boundary

**Status:** Accepted as a logical design baseline  
**Decision date:** 2026-08-31  
**Decision owner:** Main RightSpot thread

## Context

RightSpot must be developed as a normal application first. The outer repository already contains a
reusable Re-entry Core and Eddie is developing Cloud Receiver work in parallel, but neither should
become a prerequisite for the MVP application shell.

The Backbone needs one clear business authority and enough seams for later integration without
turning a small demo into a distributed system.

## Decision

### 1. Use a modular monolith for the MVP

RightSpot will use one application composition with these logical modules:

```text
Web surfaces
  -> authentication and role resolution
  -> application services / commands
  -> domain and workflow core
  -> repositories / persistence
  -> role projections and audit
```

The tenant surface and property-agent surface share the same domain and persistence boundaries.
They do not maintain separate state machines or duplicate Viewing Request truth.

### 2. Keep the domain core authoritative

The RightSpot backend owns:

- Listing and Viewing Request truth;
- availability facts used by the MVP;
- role authorization and projections;
- state transitions and revision checks;
- preparation versus human consequence; and
- bounded audit history.

The UI submits intents and renders authorized results. It does not choose arbitrary states or
implement a second business workflow.

### 3. Keep future integrations behind ports

Future event notification, WebMCP page capabilities, Cloud Receiver delivery, and Agent
continuation must enter through narrow adapters or ports. They may request or report a bounded
operation, but they cannot own Listing, Viewing Request, availability, role authority, or human
decisions.

The first MVP has no runtime dependency on those integrations.

### 4. Use synthetic, resettable data

The initial composition uses seeded listings, identities, availability, and one request. The
implementation stack and first SQLite foundation profile are governed by ADR-RS-0003. The business
schema, authentication implementation, ordinary transport, and deployment provider remain open for
their owning implementation decisions and must be chosen only when needed.

## Consequences

- The first implementation is small enough to run locally and explain to a judge.
- Domain tests can run without a Browser, Cloud Receiver, or external service.
- Later integration can be added without moving business truth into an external transport.
- A modular monolith limits operational overhead but does not claim production-scale architecture.

## Alternatives rejected

- **Separate microservices for tenant, agent, and events:** rejected for the MVP because the
  boundaries are logical, not yet independently scalable deployments.
- **Cloud Receiver as the application backend:** rejected because it is a continuation transport,
  not rental business authority.
- **UI-owned state transitions:** rejected because it weakens role and revision control.
- **Technology-first abstraction for every future provider:** rejected because it would add
  speculative complexity before the product flow is proven.

## Reopen triggers

Reopen if the primary slice requires independent deployment, a different authority boundary, a
real external data source, or a later integration that cannot remain behind a narrow port.
