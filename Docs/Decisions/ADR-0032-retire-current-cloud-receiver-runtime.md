# ADR-0032: Retire the Current Cloud Receiver Runtime

**Status:** Accepted  
**Decision date:** 2026-09-02  
**Decision owners:** Project team  
**Controls:** [TASK-013](../Tasks/TASK-013-retire-current-cloud-receiver-runtime.md)  
**Supersedes:** The current-runtime and deployment disposition of ADR-0019 through ADR-0031; their historical evidence and reusable contracts remain retained.

## Context

The current Cloud Receiver implementation under `runtime/cloud-receiver/` is a preview assembled
around synchronous compatibility stores, local control-plane surfaces, and an interim hosted
adapter. It is useful evidence, but it is not the runtime the project wants to carry forward as a
production service.

Keeping it described as current creates two risks: a new developer may integrate with a retired
service, and a future deployment may be mistaken for production readiness. The reusable Re-entry
Core and its protocol contracts are broader than this implementation and must remain available for
the replacement service.

## Decision

1. Retire `runtime/cloud-receiver/` as a supported implementation. It is deprecated and must not
   be used for new integrations, production traffic, credentials, or durable application data.
2. The Vercel entry point returns `410` with the stable code `receiver_deprecated` by default. The
   explicit factory escape used by historical tests is not a production configuration.
3. The local process entry points and package remain in the repository only for historical tests,
   migration reference, and comparison. They are not the current setup path.
4. Mark Cloud Receiver-specific READMEs, handoff material, status entries, and implementation
   records as deprecated or historical. Do not delete them; their evidence remains useful for
   traceability.
5. Do not delete or mutate the Vercel project, Supabase data, migration history, secrets, or local
   state in this decision. External project archival and data-retention handling require a separate
   operations decision.
6. A replacement may reuse `reentry-core/` and the stable Mechanism contracts, but it needs its own
   implementation record, deployment decision, and verification evidence.

## Scope boundary

This ADR does not deprecate:

- `reentry-core/` or the v0.1 protocol contracts;
- the general Cloud Receiver plus outbound Connector topology as a product concept;
- `runtime/host-sdk/`, `runtime/local-connector/`, or their reusable interfaces; or
- frozen `mvp/` evidence and immutable References.

It does deprecate the current code, package entry points, hosted adapter, deployment configuration,
and current integration instructions that specifically depend on `runtime/cloud-receiver/`.

## Consequences

- New callers receive an explicit retirement response instead of a misleading health or service
  success response.
- Historical local tests can continue to explain what was proven, but passing them does not make the
  retired runtime supported or production-ready.
- The hosted alias may remain externally reachable until a separately authorized redeploy or Vercel
  archival action; source-level deprecation alone is not a claim that the live deployment is gone.
- A future Cloud Receiver implementation must be introduced as a new bounded increment rather than
  silently extending this retired package.

## Reopen or replacement trigger

Reopen only when the project explicitly selects a replacement Cloud Receiver implementation and
accepts its authority, persistence, deployment, security, migration, and verification boundaries.
