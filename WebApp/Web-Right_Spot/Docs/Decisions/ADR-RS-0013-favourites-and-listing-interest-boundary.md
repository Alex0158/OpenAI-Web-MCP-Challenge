# ADR-RS-0013: Tenant favourites and agent listing-interest boundary

**Status:** Accepted — bounded post-MVP product decision  
**Decision date:** 2026-09-02  
**Owners:** Main RightSpot thread  
**Source review:** `RS-WO-008-01` and `RS-WO-009-01`, reviewed against the Main source baseline at `d6b242c`

## Context

The accepted RightSpot MVP supports listing discovery and the Viewing Request workflow, but it does
not provide a tenant-owned saved-listing relationship. `RS-WO-008-01` proposed Favourites and an
authorized agent listing-interest projection. `RS-WO-009-01` proposed a separate Information Request
with contact preferences.

The main-thread review found that the two proposals overlap at listing detail, tenant navigation,
agent surfaces, listing availability, and signal semantics, but they do not need to share a domain
aggregate or implementation gate. Favourites is a passive, low-risk interest signal and can be
implemented without contact data or external communication. Information Request crosses a materially
sensitive PII, retention, and agent-access boundary that is not yet accepted.

This decision therefore accepts a bounded Favourite increment and records the explicit boundary that
the Information Request proposal remains deferred and proposal-only.

## Decision

### 1. Product boundary

RightSpot will add a tenant-owned `Favourite` relationship for saving, removing, and reviewing rental
listings. A Favourite is passive interest only. It does not create, edit, submit, confirm, or decline a
Viewing Request; it does not create notification consent, marketing consent, a contact preference, or a
future Re-entry grant.

The increment is registered as the separate implementation Task
[`RIGHTSPOT-020`](../Tasks/RIGHTSPOT-020-implement-favourites-and-listing-interest.md). The proposal
Task `RIGHTSPOT-008` is closed by this review; the implementation Task is the only record that may
later authorize product code.

`Information Request` remains outside this implementation. `RIGHTSPOT-009` is reviewed and deferred
until its contact-source authority, agent access to full contact values, permission wording, retention,
erasure, encryption, and audit requirements receive a separate owner-approved decision. No Favourite
implementation may add a contact field or implicitly prepare an Information Request.

### 2. Relationship and lifecycle semantics

The relay profile owns a collection of Favourite records. The server derives `tenantId` from the
current tenant session. The relation is unique by `(tenantId, listingId)` and has the bounded state
`ACTIVE | REMOVED`.

An active record carries server-owned timestamps, a record version, the listing version observed at the
latest activation, and the monthly-rent value observed at that activation. Those two saved facts are
only evidence for a truthful `Changed since saved` indication; they are not a price-history system.
Re-adding a removed relation creates a new activation snapshot and does not restore an old price claim.

The current listing authority remains `PUBLISHED | UNPUBLISHED`:

- Adding a Favourite requires a currently published listing.
- An active Favourite is retained when the listing becomes unpublished.
- A tenant Favourite list may show the retained safe snapshot with `Currently unavailable` and a remove
  action; it must not present the snapshot as current availability.
- Current saved count includes active relationships for published and unpublished listings.
- Available interest includes only active relationships whose current listing is published.
- A rent change is a listing change. If the current listing is readable, the UI may compare it with the
  saved rent/version and label the difference without inventing a historical timeline.
- This increment does not add archive, let-agreed, hard-delete, tombstone, or relisting states. Future
  deletion, retention, and relisting semantics require a new decision before implementation.

Removal is an explicit tenant action and is idempotent. It marks the relationship `REMOVED` within the
same authoritative transaction; it must not affect a Viewing Request. Repeated add/remove commands use
the existing command-id and version-conflict conventions. No all-time save-event metric is included in
the first increment.

### 3. Tenant surface

The first tenant surface is:

- a save/remove control on the existing listing card and listing-detail surfaces;
- a dedicated tenant Favourite list route, reachable from the tenant workspace navigation; and
- active and unavailable grouping with truthful empty, loading, stale, and mutation-failure states.

The control must expose its state and action through an accessible name and `aria-pressed`, remain
keyboard operable, provide a target of at least 44 by 44 CSS pixels, and not rely on colour alone.
The page must identify unavailable saved records without silently discarding them. It must not offer an
appointment or communication side effect through the Favourite control.

### 4. Agent surface and metrics

The first agent consumer is a compact read-only listing-interest section on the existing agent
dashboard. A separate management route, tenant-level rows, sorting analytics, charts, exports, and
notifications are deferred.

The assigned agent may see listing-level aggregates for listings in that agent's portfolio:

- `Current saves`: active Favourite relationships, regardless of current publication state;
- `Available interest`: active Favourite relationships on currently published listings.

These signals remain separate from Viewing Request counts and Information Request counts. The response
must expose no tenant identity, contact value, private note, command metadata, or cross-portfolio
record. Public listing responses do not expose aggregate interest.

### 5. Persistence and consistency boundary

Favourites belong to the existing relay profile, not the separate Operations profile and not a second
business store. The implementation will extend the existing persisted workflow snapshot additively to
schema version 2, with a v1-to-v2 migration that initializes an empty Favourite collection while
preserving listings, slots, Viewing Request state, fixture generation, and audit facts.

All Favourite commands and listing-interest reads use the existing atomic persistence boundary. The
server validates session role, fixture generation, listing identity/status, expected versions, and
command fingerprints before writing. Reset clears Favourites and restores the deterministic empty
Favourite fixture. No in-memory fallback, eventual-consistency queue, event bus, or external service is
introduced.

The expected future contract shape is:

```text
GET    /api/tenant/favourites
POST   /api/tenant/favourites
DELETE /api/tenant/favourites/:listingId
GET    /api/agent/listing-interest
```

Exact request and response types belong to the implementation Task and must follow the existing
allowlisted-body, role-safe DTO, `401/403/404/409/503`, `Cache-Control: no-store`, command-id, and
fixture-generation conventions. Clients never supply the tenant identity or agent assignment.

### 6. Implementation ownership and sequencing

`RIGHTSPOT-020` owns the full bounded outcome, but its Work Orders must remain checkpoint-sized:

1. serial domain, snapshot migration, application, API contracts/routes, and focused tests;
2. after the contract slice is independently checked, tenant UI and agent read-only UI may proceed in
   parallel with disjoint paths;
3. shared navigation, shared listing-card/detail integration, and global CSS are serialized by the
   main thread; and
4. the main thread freezes the integrated source, runs full regression and browser evidence, reconciles
   canonical documents, and retires any temporary Worktree at the first safe checkpoint.

The existing Viewing Request domain and API contract remain read-only inputs to this increment. The
implementation must stop if it needs to change the Viewing Request state machine, introduce a new
listing lifecycle state, expose tenant identity to the agent, or add Information Request/contact data.

### 7. Challenge and external-boundary relationship

Favourites is ordinary product support for the rental experience. It does not materially strengthen
the primary WebMCP/Re-entry challenge slice by itself: it has no asynchronous external event, delivery
effect, continuation grant, or demonstrated tool delta. No WebMCP registration, Cloud Receiver
integration, external authentication, notification provider, or deployment change is authorized.

## Alternatives considered

### Couple Favourite to Viewing Request

Rejected. Saving a listing is passive interest; coupling it to appointment state would corrupt lifecycle,
privacy, duplicate rules, and metrics.

### Hide an unavailable saved listing

Rejected. It loses tenant state and makes the agent's current-versus-available counts ambiguous. The
bounded increment retains an active relationship and labels the snapshot unavailable.

### Expose tenant identities or contact data to the agent

Rejected. Aggregate listing interest is sufficient for this increment. Contact access belongs to the
deferred Information Request decision and requires an explicit privacy authority.

### Add all-time analytics, history, archive, and hard-delete modelling now

Deferred. These require stronger lifecycle and retention authority than the current two-state synthetic
listing fixture provides.

### Add external contact or WebMCP integration now

Rejected. It would introduce credentials, delivery claims, consent obligations, or Core changes without
a demonstrated requirement.

## Consequences

- The next product increment is implementation-ready without waiting for Clerk, WebMCP, Cloud Receiver,
  or external messaging.
- The relay snapshot gains one additive collection and a migration/reset responsibility.
- Agent metrics are intentionally current-state and privacy-preserving; historical analytics are not
  available.
- `RIGHTSPOT-009` remains a clearly named deferred decision instead of becoming an accidental dependency
  or an unbounded PII implementation.
- A future archive, deletion, relisting, external-contact, or Re-entry decision must explicitly reopen
  this boundary before changing its semantics.

## Validation and reopen triggers

The implementation Task must prove, from a fresh reset, tenant save/list/remove, idempotent replay,
stale/conflict rejection, unpublished-listing retention, agent assignment isolation, no tenant identity
leakage, current-versus-available metric separation, migration, reset, build, and focused browser
evidence. These checks do not prove production privacy compliance, external delivery, deployment, or
WebMCP activation.

Reopen this ADR if the product requires full contact information, external communication, a new listing
lifecycle state, hard deletion, relisting lineage, historical save analytics, cross-agent portfolio
aggregation, or a concrete Re-entry demonstration.
