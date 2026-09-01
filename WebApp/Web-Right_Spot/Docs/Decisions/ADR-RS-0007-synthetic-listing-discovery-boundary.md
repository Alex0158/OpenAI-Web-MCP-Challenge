# ADR-RS-0007: Synthetic Listing Discovery Boundary

**Status:** Accepted — RightSpot local MVP implementation decision  
**Decision date:** 2026-09-01  
**Decision owner:** Main RightSpot thread

## Context

The durable workflow and application boundary is independently verified, but its seeded `Listing`
records currently contain only the identity, revision, publication status, and agent assignment
needed by the workflow kernel. The ordinary tenant flow now needs a credible discovery surface: a
small synthetic catalogue, bounded filters, and a listing detail result that can lead to request
creation.

The catalogue must remain part of the RightSpot-owned source of truth. A second hard-coded catalogue
in a route or UI would be easy to drift away from the listing revision used by the request workflow.
The next increment should therefore establish one safe read boundary before adding session-aware
transport or interactive UI.

## Decision

### 1. Enrich the synthetic Listing record with minimum discovery facts

RightSpot will extend its local `Listing` record with only the facts required by the first tenant
discovery and detail experience:

- stable listing title;
- synthetic address and area;
- monthly rent in GBP as an integer;
- bedroom count and size in square metres;
- ISO available-from date;
- bounded description; and
- a stable local `imageKey` for later UI rendering.

The fixture keeps three published synthetic listings, including `listing-primary`, and all remain
assigned to the seeded property agent. Values must be clearly synthetic and must not reference live
property feeds, external image URLs, tenant data, or external media services.

### 2. Add one tenant-safe application read boundary

The application layer will expose listing collection and detail reads that:

- accept only the seeded tenant actor;
- return published listings in deterministic fixture order;
- support bounded area, maximum-rent, minimum-size, and available-from filters;
- return `NOT_FOUND` for an unknown or unpublished detail;
- return DTOs that omit internal agent assignment; and
- perform no request, audit, version, expiry, or fixture mutation.

The existing tenant request projection will use the same tenant-safe listing shape. The agent
projection may retain assignment data because it is an agent-authorized internal projection.

### 3. Keep transport and session separate from this boundary

This increment does not freeze HTTP paths, cookie names, session storage, authentication semantics,
request command payloads, or UI behavior. A later Work Order may consume the application read
boundary through a bounded local demo session and route adapter. Route handlers must not recreate
the catalogue or bypass the application boundary.

## Alternatives considered

### Hard-code a separate UI catalogue

Rejected. It would duplicate listing identity and revision data and could let the UI submit a request
against facts that no longer match the domain record.

### Add a normalized listing database now

Deferred. The local snapshot remains the accepted MVP persistence shape; normalized production schema,
migrations, indexing, and live listing ingestion are outside the first demonstration.

### Return the full Listing record to the tenant

Rejected. `assignedAgentId` is an internal assignment fact and is not needed by the tenant discovery
or request projection.

### Add live media or external property data

Rejected. Synthetic local values and stable keys are sufficient for the challenge slice and keep the
application deterministic and offline-runnable.

## Consequences

- The next transport and UI slices have one authoritative listing read source.
- Filters and listing detail can be tested without a browser, session provider, or external service.
- The domain record now carries presentation-adjacent synthetic facts; the fields remain deliberately
  minimal and do not imply a production marketplace schema.
- A later local session/HTTP Work Order can consume this boundary without adding a second state
  machine or catalogue.

## Reopen triggers

Reopen this decision if listing data becomes externally sourced, the MVP needs multiple agent
assignments, a normalized schema is required for a demonstrated behavior, or the tenant-safe read
shape cannot support the approved discovery flow.
