# ADR-RS-0006: Durable Workflow Snapshot and Application Boundary

**Status:** Accepted — RightSpot local MVP implementation decision
**Decision date:** 2026-09-01
**Decision owner:** Main RightSpot thread

## Context

The RightSpot workflow domain core is independently verified as a pure, serializable TypeScript
kernel. It currently operates on an in-memory `WorkflowState`, while the runnable foundation only
proves SQLite metadata, reset generation, and health behavior. The next product increment needs a
durable local state boundary before ordinary application operations are exposed through routes or
UI surfaces.

The MVP needs one deterministic local composition, not a production-scale data platform. The
persistence shape must preserve the domain core as the authority, make command writes atomic, keep
role projections derived, support fixture reset, and fail visibly without an in-memory fallback.

## Decision

### 1. Use one SQLite workflow snapshot for the local MVP

RightSpot will persist the complete serializable `WorkflowState` as one versioned JSON snapshot in a
RightSpot-owned SQLite business table. The snapshot is the durable source for listings, availability,
the single Viewing Request, audit facts, processed command records, and fixture generation as
represented by the verified domain types.

The table will have one singleton row, an explicit schema version, a positive fixture generation,
serialized state, and an update timestamp. The implementation must validate that the row exists and
is parseable; a corrupt or incompatible row fails visibly. It must not silently recreate, substitute
an in-memory state, or discard business data to continue.

This is a deliberate challenge-slice persistence shape, not a claim that a JSON snapshot is the
final production schema. Normalized business tables, indexing, migration tooling, backup policy,
and multi-process deployment remain open decisions.

### 2. Reuse the existing server-only SQLite foundation

The workflow store will open the existing RightSpot `node:sqlite` foundation and its file-backed
database path. It may create only its own workflow-state schema and must not add an ORM, external
SQLite package, second database, Redis, or an in-memory fallback. The existing foundation metadata
row remains the generation authority.

### 3. Make command and expiry persistence atomic

The application boundary will load the current snapshot, invoke the verified domain kernel, and
persist the resulting state in one SQLite transaction protected against concurrent local writers.
Successful commands write the returned state. A rejected command writes no state unless the domain
evaluation itself produced a permitted expiry transition that must be made durable; in that case
the expiry transition is committed and the command failure remains visible.

Relevant reads that evaluate proposal expiry use the same persist-if-changed behavior. A failed
transaction rolls back and exposes a neutral persistence error without leaking paths, SQL, stack
traces, credentials, or business internals.

Reset is a development-only application operation. It increments the existing foundation generation
using the established first-reset semantics, writes a fresh deterministic seeded workflow snapshot,
and commits metadata plus snapshot replacement atomically without deleting or recreating the
database file. Opening a store must seed a missing snapshot at the current foundation generation;
it must not silently replace a present incompatible snapshot.

### 4. Keep a narrow application service above the domain and store

The next implementation adds one RightSpot application service boundary that:

- reads the tenant or assigned-agent projection through the verified domain projection functions;
- accepts explicit actors, commands, and an injected application time;
- delegates all state transitions and authorization invariants to the domain kernel;
- delegates transaction, serialization, snapshot, and reset concerns to the workflow store; and
- exposes no HTTP, UI, session provider, or external integration behavior yet.

The application service must not duplicate the state machine, return the other role's private
fields, accept arbitrary client state, or make authentication a client-side role switch. A later
route handler is a transport adapter over this boundary, not a second workflow implementation.

### 5. Keep the next Work Order bounded

The next Work Order may create or modify only the workflow store, the narrow application service,
and focused persistence/application tests. It must not modify the verified domain kernel, the
foundation metadata modules, package/config files, API routes, pages, authentication, deployment,
Cloud Receiver, WebMCP, Redis, or WebRTC. Any need to change the domain contract or foundation
semantics returns to the main thread for re-baselining.

## Alternatives considered

### Normalized business tables now

Deferred. A normalized schema would be reasonable for a commercial marketplace but would multiply
mapping, migration, transaction, and test surface before the ordinary demo flow exists. The snapshot
keeps the verified domain state intact and can later be replaced behind the same application/store
boundary if evidence requires it.

### In-memory state with SQLite only for metadata

Rejected for the application increment. It would make a browser refresh or second server request
lose the authoritative workflow and would not prove durable request continuity.

### ORM, external database, or Redis

Rejected. No current requirement justifies another runtime dependency or distributed state service.

### Expose domain functions directly from route handlers

Rejected. It would couple transport to persistence and invite a second business-rule path. The
application service remains the composition boundary.

## Consequences

- The ordinary application can refresh and observe one durable Viewing Request without changing the
  verified domain model.
- Reset, stale versions, idempotency, audit continuity, and role projections remain testable in one
  deterministic local transaction boundary.
- The first persistence implementation is intentionally limited and not production schema proof.
- The store must carefully handle serialization failure, corrupt state, transaction rollback, and
  expiry-on-read without hiding errors.
- API, session, UI, deployment, and later integration work remain separate checkpoints.

## Validation and reopen triggers

Validate the decision with isolated file-backed databases, deterministic seed/reset behavior,
refresh-visible state continuity, atomic command success/failure, expiry persistence, stale version
and idempotency behavior, role projection privacy, corrupt-snapshot failure, and exact generated
path/scope checks.

Reopen this decision if the snapshot becomes too large or query-limited for the accepted MVP, if
multiple independent records must be updated by separate consumers, if deployment requires
multi-process concurrency beyond the local transaction boundary, or if a production migration and
backup policy becomes an explicit requirement.
