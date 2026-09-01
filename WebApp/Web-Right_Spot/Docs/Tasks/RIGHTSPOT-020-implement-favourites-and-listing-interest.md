# RIGHTSPOT-020: Implement tenant favourites and agent listing-interest

**Type:** `implementation`  
**Lifecycle:** `pending`  
**Priority:** `P1` for the next bounded post-MVP product increment  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-02  
**Depends on:** [ADR-RS-0013](../Decisions/ADR-RS-0013-favourites-and-listing-interest-boundary.md), closed `RIGHTSPOT-002`, and the existing relay/session/listing boundaries

## Task control

- Type: `implementation`
- Lifecycle: `pending`
- Execution posture: `REGISTERED_NOT_DISPATCHED`
- Current increment: Implement the accepted tenant Favourite relationship and privacy-preserving
  agent listing-interest projection as one bounded product outcome.
- Next gate: Main thread may dispatch the first serial contract/data Work Order after a fresh source
  baseline and exact path ownership are recorded. No Builder, Verifier, or temporary Worktree is active
  for this Task yet.
- Parent role: This is one registered Task File. Builder, Verifier, Repairer, and Integrator are
  checkpoints under this file, not additional Tasks.

## Objective

Deliver the smallest coherent Favourite experience for the current three-listing local fixture:

1. a tenant can save, remove, and review their own rental listings;
2. saved records remain truthful when a listing becomes `UNPUBLISHED`;
3. an assigned agent can see current listing-level interest aggregates without tenant identity or
   contact data; and
4. the existing Viewing Request workflow remains behaviorally unchanged.

## Accepted scope

### Domain and persistence

- Add a server-owned Favourite relation unique by `(tenantId, listingId)` with `ACTIVE | REMOVED`.
- Capture activation timestamps, relation version, saved listing version, and saved monthly rent for
  a truthful changed-since-save indication.
- Extend the relay snapshot additively to schema version 2; migrate v1 data to an empty Favourite
  collection without losing existing workflow state.
- Keep command execution atomic, idempotent, fixture-generation aware, and resettable using the
  existing persistence conventions.
- Require a published listing for first save; retain active Favourite state when that listing becomes
  unpublished and expose a safe unavailable projection.

### Tenant experience

- Add/remove control on existing listing cards and listing detail.
- Add a tenant Favourite list route and navigation entry.
- Show active and unavailable saved records, remove either state, and provide truthful empty/loading/
  stale/error/mutation-failure states.
- Use accessible state/action labels, `aria-pressed`, keyboard operation, a 44-by-44 CSS-pixel target,
  and non-colour-only state communication.

### Agent experience

- Add a compact read-only listing-interest section to the existing agent dashboard.
- Expose only listing-level `Current saves` and `Available interest` for the assigned agent's portfolio.
- Keep Favourite, Information Request, and Viewing Request metrics separate.
- Deny tenant-role access and prevent tenant IDs, contact values, private notes, command metadata, and
  cross-portfolio records from entering agent DTOs.

### Contract and verification

- Follow the existing server-derived actor, strict body allowlist, expected-version, command-id,
  fixture-generation, role-safe DTO, no-store, and typed failure conventions.
- Verify domain invariants, migration/reset, API authorization/privacy, current-versus-available
  counts, UI state, build/typecheck, and a fresh-reset tenant-to-agent browser walkthrough.

## Explicit non-goals

- `InformationRequest`, contact profiles, contact snapshots, marketing/notification consent, email,
  phone, WhatsApp, or any outbound communication.
- External authentication/Clerk, WebMCP, Cloud Receiver, Re-entry, deployment, or production privacy
  claims.
- Changes to the Viewing Request state machine, request DTOs, agent request handling, or Operations
  profile.
- New archive, let-agreed, hard-delete, tombstone, or relisting lifecycle states.
- All-time save-event analytics, tenant-level agent rows, charts, exports, notifications, or a separate
  Favourite management system.
- A second database, in-memory fallback, eventual-consistency queue, or new dependency.

## Planned checkpoint decomposition

These are bounded planning slices, not active Work Orders until the main thread registers their exact
baseline and dispatches them:

### Contract/data slice — serial first

Likely ownership:

```text
src/server/domain/favourites.ts
src/server/domain/favourite-projections.ts
src/server/domain/types.ts
src/server/domain/errors.ts
src/server/persistence/workflow-store.ts
src/server/persistence/reset.ts
src/server/application/favourites.ts
src/server/application/favourite-views.ts
src/shared/contracts/favourites-api.ts
app/api/tenant/favourites/route.ts
app/api/tenant/favourites/[listingId]/route.ts
app/api/agent/listing-interest/route.ts
tests/domain/favourites.test.ts
tests/application/favourites.test.ts
tests/persistence/favourites-migration.test.ts
tests/api/favourites.test.ts
```

This slice owns the schema/migration, command semantics, server-derived identity, listing lifecycle
join, role-safe DTOs, and focused tests. It must not edit tenant/agent pages or global CSS.

### Tenant UI slice — parallel only after contract/data handoff

Likely ownership:

```text
src/ui/tenant/favourites-api.ts
src/ui/tenant/tenant-favourites-page.tsx
src/ui/tenant/tenant-listing-page.tsx
src/ui/tenant/tenant-listing-card.tsx
app/tenant/favourites/page.tsx
tests/ui/tenant-favourites.test.ts
```

The exact existing card path must be confirmed at dispatch time. If the card is shared with the agent
surface, the main thread serializes that file rather than allowing two writers.

### Agent UI slice — parallel only after contract/data handoff

Likely ownership:

```text
src/ui/agent/agent-listing-interest.tsx
src/ui/agent/agent-dashboard-page.tsx
src/ui/agent/agent-api.ts
tests/ui/agent-listing-interest.test.ts
```

The UI is read-only and must consume the server projection; it must not recompute portfolio counts from
raw workflow state.

### Shared integration and closure — serial Main ownership

Potential shared paths include:

```text
src/ui/shared/session-nav.tsx
app/globals.css
```

The Main thread owns navigation, shared listing-card/detail integration, global styling, source freeze,
integration, canonical writeback, full regression, browser evidence, and Worktree retirement. No
temporary Worktree is opened until the corresponding Work Order has an exact write set and a fresh Main
baseline.

## Acceptance criteria

1. From a fresh reset, the tenant can save one published listing and see it in the Favourite list.
2. Repeating the same command is idempotent; conflicting command reuse and stale versions fail without
   a partial mutation.
3. Removing a Favourite is idempotent and does not create or mutate a Viewing Request.
4. An unpublished listing remains represented as unavailable and removable; it is excluded from
   `Available interest` but retained in `Current saves`.
5. An assigned agent can read only listing-level aggregate counts for its own portfolio.
6. Tenant and wrong-agent reads are rejected or neutralized according to existing role/object rules;
   no tenant identity, contact value, or private note is present in the response.
7. Reset and v1-to-v2 migration are deterministic and preserve the existing Viewing Request Happy Path.
8. Focused tests, full test suite, typecheck, build, and fresh-reset browser evidence pass, with claims
   limited to the local application boundary.

## Stop conditions

Stop and return `BLOCKED` to the Main thread if implementation requires contact data, a new listing
lifecycle state, a Viewing Request contract change, an Operations-profile write, shared-file ownership
that cannot be serialized, an external provider, or a source baseline that cannot be reproduced.

## Current evidence and closure

No product code, Work Order, candidate branch, temporary Worktree, or browser evidence has been created
for this Task. Closure requires independently verified source, Main integration, canonical document
reconciliation, and the exact non-claims above.
