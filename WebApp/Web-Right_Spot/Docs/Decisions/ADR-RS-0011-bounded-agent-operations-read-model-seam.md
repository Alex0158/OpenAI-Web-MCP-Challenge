# ADR-RS-0011: Bounded Agent Operations Read-Model Seam

**Status:** Accepted — bounded post-MVP implementation decision  
**Decision date:** 2026-09-01  
**Decision owner:** Main RightSpot thread

## Context

`RIGHTSPOT-010` identified a future Agent Operations Insights surface, but its complete dashboard
and WebMCP boundary crosses reporting semantics, role privacy, and later Favourite/Information
Request signals. The current RightSpot source already contains authoritative listings, availability
slots, the Viewing Request state, and deterministic fixture generation. A small read-only projection
over those existing records can therefore be implemented without waiting for the complete future
dashboard or inventing new business state.

The purpose of this decision is to make that safe seam explicit. It does not accept the complete
Operations product line, add a route, or authorize WebMCP.

## Decision

### 1. Implement a pure, server-side Operations projection

RightSpot will add one pure projection module that accepts the existing `WorkflowState`, an explicit
agent actor, and an injected ISO timestamp. It returns a deterministic, agent-authorized operations
view. The projection must not mutate the input state, open SQLite, perform HTTP, read session
cookies, or call an external service.

The first projection is deliberately limited to authoritative data already present in the local
workflow:

- listing pipeline counts and bounded listing rows for `PUBLISHED` and `UNPUBLISHED` listings;
- Viewing Request state counts and bounded request/listing references; and
- upcoming availability slots whose existing status is `HELD_FOR_PROPOSAL` or `CONFIRMED`, joined to
  the existing request/listing identity where available.

The projection must preserve the existing state vocabulary. It must not rename a held proposal as a
confirmed viewing, infer a lease/occupancy state, or turn an available slot into an appointment.
`startsAt` and `endsAt` remain authoritative ISO timestamps; any later display formatting may use
Europe/London, but this module does not invent a new timezone or calendar policy.

### 2. Keep the output privacy-safe and read-only

The output may contain the listing identity and human-readable listing facts required by an assigned
agent. It must not expose tenant IDs, tenant notes, private review notes, response text, command
metadata, processed-command records, or persistence details. The projection must reject a non-agent
actor and an agent whose ID is not the authoritative assigned agent.

Favourite, Information Request, marketing, notification, and external-contact signals are not part
of this v1 projection. They remain separate capabilities with their own contracts and later
integration points; their absence must be represented by omission, not a zero that claims the signal
was measured.

### 3. Treat the module as a versionable seam

The module owns its internal projection types for this checkpoint. A later API or UI Work Order may
adapt those types into a public DTO, route, dashboard, or page-authored WebMCP tool after reviewing
the output contract. No consumer may query SQLite directly or reproduce these counts in the UI.

The first implementation may create only the new projection module and directly necessary focused
tests. It must not modify the existing workflow types, state machine, store, shared API contract,
route handlers, pages, authentication, fixtures, or WebMCP registration.

## Alternatives considered

### Build the dashboard and projection together

Deferred. It would couple reporting semantics, UI ownership, transport, and future WebMCP capability
before the read contract has independent evidence.

### Query SQLite or serialize raw `WorkflowState` from the page

Rejected. It would bypass the existing application/domain authority, risk private-field leakage,
and create a second reporting implementation.

### Add Favourite and Information Request counts now

Rejected for this seam. Those signals have separate lifecycle, privacy, and contact semantics and
must be integrated only after their own boundaries are accepted and verified.

### Use an AI or natural-language query layer first

Deferred. A deterministic human-readable projection is the source-backed baseline and recovery
path. Any future Agent query must remain a page-authored adapter over accepted operations data.

## Consequences

- A useful server-side operations contract can be verified in isolation while tenant/agent UI
  verification runs in parallel.
- The first projection is intentionally not a complete dashboard and cannot claim stale-inventory,
  historical-funnel, occupancy, or interest analytics.
- Later route, UI, and WebMCP tasks must consume this seam rather than redefine its metrics.
- Because the current fixture is small and deterministic, counts describe the current fixture at the
  supplied time; they are not production analytics or historical reporting.

## Validation and reopen triggers

Reopen this decision if the current workflow gains a new listing/request lifecycle, the projection
needs tenant identity or contact data, a metric requires historical events or a new persistence
model, or a consumer needs to change the existing state authority. A later dashboard decision must
define freshness, pagination/result caps, drill-down routes, and any new signal before those claims
are implemented.
