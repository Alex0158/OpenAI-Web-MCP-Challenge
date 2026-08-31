# ADR-0004: Separate the Receiver Event Protocol from Agent Runtime Transport

**Status:** Accepted for protocol and adapter separation; topology items 4 and 5 are superseded by [ADR-0006](ADR-0006-establish-reentry-core-development-baseline.md), and the first exact wire kernel is owned by [ADR-0007](ADR-0007-freeze-reentry-core-v0.1-contract-kernel.md)  
**Decision date:** 2026-08-30  
**Decision owners:** Alex and project team  
**Scope:** Receiver interoperability, deployment topology, and Agent adapter boundaries

## Context

The original concept aimed to make the Receiver an independent cloud service. The mechanism
contains two different integration surfaces, which must not be treated as one contract:

1. a host Website Backend sends an authenticated business event to the Receiver; and
2. the Receiver asks an Agent Continuation Adapter to resume managed Agent context and regain
   the browser and page-provided WebMCP tools.

The first surface is an application protocol owned by this project. The second surface is a
platform adapter whose transport and lifecycle depend on where the Agent runtime is hosted.

The current Desktop path demonstrates a controlled local adapter, but no documented public
Codex contract has been established that lets a hosted Receiver remotely attach to an
arbitrary user's local Desktop task and its Browser. This is a deployment constraint, not a
failure of the Receiver event model.

## Decision

1. Define the Website Backend-to-Receiver interaction as a project-owned, versioned,
   typed-event contract. Any backend that conforms to its schema, authentication, Grant
   scope, state-version, and idempotency rules may act as an event issuer.
2. Keep Receiver business-event handling independent from the Agent platform. The Receiver
   owns manifest validation, consent, Grant policy, opaque binding resolution, event
   verification, deduplication, and run reservation.
3. Keep the Receiver-to-Agent interaction behind an explicit Agent Continuation Adapter
   boundary. The adapter owns context capture, receipt persistence, context resumption,
   browser access, canonical-page re-entry, and Site Tool invocation.
4. Use a local or Agent-side Receiver/connector topology for the bounded technical
   implementation. A hosted Website Backend may still emit events to that local Receiver
   through an authenticated channel; a public Codex remote-control API is not required for
   this topology.
5. Treat an independent hosted Receiver as a future deployment variant. It requires one of
   the following before it can be claimed as deployable: a supported platform API, a
   user-installed local connector with an explicit lifecycle and security contract, or a
   hosted Agent runtime that does not depend on local Codex Desktop state.
6. Do not describe the local adapter or its current Desktop transport as a public Codex
   integration, a universal standard, or a cross-machine production guarantee.

## Consequences

### Positive

- Third-party Website Backends can integrate by conforming to one Receiver event protocol;
  they do not require bespoke Receiver control logic.
- The core mechanism remains valid whether the Receiver is local, paired with a hosted
  service, or later moved to a hosted Agent runtime.
- The P0 implementation can prove the mechanism without prematurely solving hosted remote
  control of every user's Desktop application.
- Future platform work has a clear boundary: replace or harden the Agent adapter without
  changing the Grant and event semantics.

### Costs and risks

- The local topology requires an installed or task-launched component and a secure pairing
  path for any remote Website Backend.
- A hosted Receiver cannot be claimed until connector installation, identity, lifecycle,
  connectivity, and failure recovery are specified and tested.
- The current event implementation may pin one issuer, workflow, and development key for a
  deterministic fixture; multi-issuer onboarding and key rotation remain later work.

## Non-goals

This decision does not select a final host application, change the frozen P0 feasibility
questions, claim public Codex support, or claim that the local adapter is production-ready.
It records the boundary between the project-owned event protocol and the platform-specific
Agent transport so that those claims are not conflated.
