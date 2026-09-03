# ADR-0019: Establish the Stage 1 Cloud Receiver Shell

**Status:** Accepted  
**Decision date:** 2026-08-31  
**Decision owners:** Eyad and project team  
**Scope:** First shipping-source process shell around Receiver Core, local operational routes,
file-backed composition, and lifecycle claim boundary

> **Current disposition:** The runtime and deployment portion of this decision is superseded by
> [ADR-0032](ADR-0032-retire-current-cloud-receiver-runtime.md). This record remains historical
> evidence for the preserved process-shell boundary.

## Context

ADR-0006 selects one hosted Cloud Receiver around the existing Receiver Core. ADR-0010 freezes the
three minimal protocol routes and deliberately excludes runtime health, deployment, and production
identity. TASK-003 now requires the first application-neutral service increment without duplicating
Core authority or converting deterministic conformance fixtures into runtime identity.

The first increment must be useful before organization accounts, Browser consent, Connector pairing,
real Host-effect verification, a selected Host, and public infrastructure are decided. Binding a
partially authenticated process publicly would create a false production boundary; keeping all
process behavior in test fixtures would leave no real service shell to extend.

## Decision

### 1. Source and ownership

The first Cloud Receiver runtime lives at `runtime/cloud-receiver/`. It is a Node 24 ESM package with
no third-party runtime dependency. It consumes the existing Receiver Core, SQLite store, and Cloud
Receiver HTTP adapter; it does not copy or reinterpret them.

The shell owns:

- listener startup and graceful shutdown;
- bounded Node HTTP server settings;
- redacted liveness and readiness responses;
- composition and closure of one file-backed Receiver store; and
- delegation of the frozen versioned protocol routes to the existing Core adapter.

### 2. Stage 1 ingress boundary

The listener accepts only literal `127.0.0.1` or `::1`. Plain HTTP is therefore local evidence only.
There is no wildcard bind, public listener, TLS assertion, reverse-proxy trust, forwarded-header
interpretation, or deployed-service claim.

The shell adds exactly two operational routes outside the frozen ADR-0010 protocol adapter:

```text
GET /healthz
GET /readyz
```

`/healthz` proves only that the local shell can answer. `/readyz` returns success only while the
listener is ready and the injected composition reports ready. Both responses are fixed, cache-
disabled, and secret-free. They never prove event acceptance, durable delivery, Agent activation,
Host effect, or product success.

ADR-0010 remains unchanged for `/v0.1/events`, `/v0.1/delivery-claims`, and
`/v0.1/delivery-acknowledgements`. Unknown paths, query variants, methods, bodies, successes, and
failures on those routes continue to be interpreted only by the existing Core HTTP adapter.

### 3. Composition and persistence

The executable requires an absolute trusted local composition-module path at startup. That module
must supply exactly one composed Receiver, readiness check, and close operation. This is deployment
source selection, not a network extension or user-controlled plugin surface.

The provided composition helper requires an absolute file-backed SQLite path and the existing Core
authority ports and limits. It rejects `:memory:` and relative-path fallbacks. It closes the store if
Core composition fails and exposes no store or private authority through HTTP.

Synthetic keys, consent decisions, Connector identity, and Host effects remain test-only. Stage 1
does not invent production implementations for those ports.

### 4. Process lifecycle and limits

Startup validates host, port, composition path, Receiver shape, and store construction before
readiness. A bind or composition failure closes owned resources and emits one bounded failure code;
it does not choose another port, store, authority, or transport.

The server fixes header count and size, header, request, socket, and keep-alive timeouts, and requests
per socket. `SIGINT` and `SIGTERM` stop new acceptance, drain the Node listener, close idle
connections, and close the composition once. Startup and shutdown logs exclude configuration paths,
credentials, request bodies, and private state.

### 5. Claim boundary

Local verification may claim only that the Stage 1 loopback shell composes the existing Core with a
file-backed store, preserves its three protocol routes, exposes bounded operational status, survives
one tested close/reopen flow, and closes under one tested process signal.

It does not claim production identity, public ingress, TLS, rate limiting, abuse control,
multi-tenancy, account or organization management, consent UI, pairing, backup, arbitrary crash
recovery, multi-replica ownership, real Host effect, Agent activation, deployment, or product value.

## Consequences

### Positive

- Future Cloud work extends one real process source instead of conformance fixtures.
- Receiver authority and wire semantics remain single-sourced in `reentry-core/`.
- An accidental public bind fails before listening.
- Durable local composition and shutdown become independently testable.

### Costs and risks

- A deployment cannot start until it supplies a trusted composition with real authority ports.
- SQLite remains a single-process local baseline, not a selected public hosting store.
- Operational readiness is intentionally shallow until a production storage and identity decision
  defines deeper checks.

## Rejected alternatives

- **Bind publicly now:** rejected because TLS, service identity, abuse controls, and production
  authorities are not decided or implemented.
- **Copy the conformance Receiver process:** rejected because its deterministic credentials and IPC
  controls are evidence scaffolding.
- **Implement account, consent, pairing, and Agent activation together:** rejected because those are
  separate authority and failure boundaries.
- **Add a framework, broker, or ORM:** rejected because Node built-ins and the current SQLite/Core
  contracts satisfy this bounded increment.
- **Add health routes inside the Core HTTP adapter:** rejected because operational process state does
  not belong to the protocol transport kernel.

## Reopen triggers

Reopen before non-loopback binding, public deployment, a reverse-proxy trust contract, multi-process
store ownership, a different persistence engine, runtime-loaded untrusted code, deeper readiness
claims, or any change to the frozen Core HTTP semantics.
