# ADR-0006: Establish Re-entry Core as the Authoritative Development Baseline

**Status:** Accepted  
**Decision date:** 2026-08-31  
**Decision owners:** Alex and project team  
**Scope:** Core identity, source ownership, process boundaries, development topology, and documentation governance

## Context

The project has completed bounded mechanism validation in `mvp/` and has reviewed the
parallel MVP2 branch. MVP1 provides the stronger authority, durability, delivery, and evidence
semantics. MVP2 provides useful protocol, Host, Receiver, Agent-adapter, and product-composition
seams, but its runtime does not satisfy the mainline authority and durability contracts.

Neither implementation is the competition product source. Continuing to extend either one
would preserve fixture coupling, create competing authority models, and make the final Host
application inherit decisions that were valid only for an experiment.

The project now needs one application-neutral core that can be specialized by the selected web
application while keeping Host state, Receiver authority, device execution, and Agent runtime
as real integration boundaries.

## Decision

### 1. Name and authority

The accepted mechanism and its authoritative implementation baseline are named **Re-entry
Core**.

Re-entry Core owns the domain-neutral contracts for:

- website-authored Re-entry Manifests;
- Receiver-owned consent and Continuation Grants;
- opaque Host and private managed-context bindings;
- authenticated typed Continuation Events;
- durable pending delivery, replay control, leases, and acknowledgement;
- replaceable Agent continuation;
- canonical page re-entry and fresh-state verification; and
- correlation through Host effect and the human decision boundary.

The final web application, domain, user, event, artifact, Site Tool schemas, and product name
remain unselected. They must specialize Re-entry Core through an accepted app-selection ADR.

### 2. Authoritative source root

New competition-core implementation belongs under `reentry-core/`.

- `mvp/` is frozen as the MVP1 mechanism and evidence reference.
- `origin/codex/mvp2-tenderrelay` remains the preserved MVP2 contributor reference.
- No new production behavior is implemented by modifying either reference.
- Reuse is selective and provenance-aware; source is adapted to Re-entry Core contracts rather
  than copied wholesale.

### 3. One Receiver authority, multiple process shells

Re-entry Core has one Receiver authority model. It is not implemented twice.

- **Receiver Core** owns Grant, binding, event, delivery, lease, acknowledgement, and audit
  semantics behind explicit persistence and clock ports.
- **Cloud Receiver** is the target hosted service shell around Receiver Core. It owns public
  authenticated ingress and durable delivery availability.
- **Local Receiver profile** is a development and deterministic-test service shell around the
  same Receiver Core. It is not a second production authority or an automatic fallback.
- **Local Connector** is a separately runnable outbound client. It owns paired-device identity,
  delivery retrieval, local credential protection, adapter dispatch, and acknowledgement. It
  cannot issue Grants, reinterpret events, widen scope, or become a public inbound controller.

This decision supersedes ADR-0004 items 4 and 5 as the active development topology. ADR-0004
items 1 through 3 and 6 remain authoritative: the event protocol and Agent transport stay
separate, and no private current-build adapter is a public Codex contract.

### 4. Real process and trust boundaries

The reference architecture treats these as separate processes or external systems:

1. Host web page;
2. Host backend and transactional outbox;
3. external actor or system that causes a Host business transition;
4. Cloud Receiver;
5. Local Connector;
6. Agent Continuation Adapter; and
7. Agent runtime and WebMCP-capable Browser.

An external actor may cause a transition, but the Host backend remains authoritative for Host
state and normally emits the signed Continuation Event after committing that state. Any future
direct third-party issuer requires an explicit trust and issuer-onboarding decision.

Process separation must be visible in identity, credentials, persistence, failure domains, and
tests. Running several classes in one server process does not prove this architecture.

### 5. Lightweight modular implementation

The first implementation is one Node 24 ESM package with zero runtime dependencies unless a
measured need justifies one. Independent process entrypoints and narrow module exports are
preferred over an initial workspace or microservice framework.

The initial module boundaries are:

- protocol and canonical serialization;
- Host SDK and issuer contract;
- Receiver Core and persistence port;
- Cloud Receiver service shell;
- Local Connector and delivery-client port;
- Agent Continuation Adapter contract; and
- deterministic testkit and conformance fixtures.

Modules may run together in tests, but production-boundary claims require separate-process,
separate-store, and separate-credential evidence.

### 6. Fail visibly; do not accumulate fallback behavior

The core does not silently substitute polling, DOM automation, generic MCP, direct Host REST,
manual reconstruction, a fresh context, or a different Agent when the selected adapter cannot
activate the intended bounded context and obtain genuine page-bound WebMCP.

Unsupported capability produces a typed visible failure. A later fallback requires its own
product requirement, authority analysis, acceptance criteria, and decision.

### 7. Documentation and delivery discipline

The existing documentation hierarchy remains federated:

- `Docs/Core/` owns current durable product, mechanism, architecture, trust, and evidence truth;
- `Docs/Decisions/` owns accepted durable choices;
- `Docs/Development/` owns active implementation scope and the development runbook;
- `Docs/Research/` remains supporting evidence and unresolved analysis;
- code and tests own implemented behavior; and
- runtime and release evidence own deployed or externally reproducible claims.

Core documents are rewritten as current truth. They do not accumulate turn-by-turn chronology.

## Consequences

### Positive

- The selected web application can remain open while core implementation advances.
- Receiver authority and Agent transport cannot drift into two competing implementations.
- MVP1 evidence is preserved without turning the fixture into production code.
- MVP2 modular seams can be reused without importing its weaker consent, persistence, prompt,
  or diagnostics contracts.
- Cloud and device-side failures become independently testable.
- The first implementation stays small enough for rapid inspection, clean-room execution, and
  performance measurement.

### Costs and risks

- The Local Connector-to-Agent-to-Browser/WebMCP join remains unproven.
- Pairing, credential storage, revocation, and Connector lifecycle need explicit contracts.
- A single-node lightweight Cloud Receiver store may not satisfy a later multi-replica hosting
  requirement.
- The final Host app can still expose missing or conflicting requirements that require a
  versioned core change.
- Separate-process evidence is more expensive than an in-process fixture but is required for
  truthful distributed claims.

These risks are recorded and may sequence later increments. They do not block protocol,
authority, persistence-port, or conformance work that does not depend on a working Agent wake.

## Non-goals

This decision does not:

- select one of the candidate web applications;
- claim that Cloud Receiver or Local Connector is implemented, deployed, or production-ready;
- select a Codex wake command or supported Agent adapter;
- make exact-thread continuation a mechanism invariant;
- create a general public standard, multi-tenant integration platform, or plugin marketplace;
- authorize production credentials, external users, paid services, or publication; or
- authorize deletion of MVP1, MVP2, research, scenarios, or historical evidence.

## Reopen triggers

Reopen this decision if evidence shows that:

- the selected app cannot use the Cloud Receiver plus Local Connector reference topology;
- a supported hosted Agent provides the required Browser and genuine WebMCP with materially
  lower risk;
- the one-package structure prevents independent deployment or verification; or
- the Receiver authority cannot remain application-neutral without weakening Host or user
  authority.
