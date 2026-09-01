# RIGHTSPOT-008: Define tenant favourites and agent listing-interest boundary

**Type:** `decision`  
**Lifecycle:** `closed`  
**Priority:** `P1` for the next coherent product increment, not a blocker to the Re-entry Core challenge slice  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-01  
**Depends on:** `RIGHTSPOT-002` closed local MVP; current listing, role, persistence, and API boundaries; accepted UI direction in ADR-RS-0009

## Task Control

- Type: `decision`
- Lifecycle: `closed`
- Execution posture: `REVIEWED_ACCEPTED_CLOSED`
- Priority: `P1`
- Owner: Main RightSpot thread
- Current increment: Produce one evidence-backed proposal for a tenant-owned Favourites capability and its authorized agent listing-interest projection, without implementing either surface.
- Next gate: Closed after joint main-thread review with `RIGHTSPOT-009`; the accepted bounded decision is
  recorded in [ADR-RS-0013](../Decisions/ADR-RS-0013-favourites-and-listing-interest-boundary.md), and
  implementation is registered separately in `RIGHTSPOT-020`.
- Dependencies: The accepted ordinary rental MVP remains authoritative; existing role/privacy boundaries and listing identity remain in force; no external authentication, WebMCP, Cloud Receiver, deployment, or credential gate is required for this proposal.

## Bounded objective

Define the smallest coherent product and architecture boundary for:

1. a tenant who can add, remove, and review their own saved rental listings; and
2. a property agent who can review authorized aggregate listing-interest data without receiving tenant identities or changing the request workflow.

The proposal must settle the relationship between a Favourite and the listing lifecycle, including
price changes, temporary unpublishing, archived or let-agreed listings, normal soft deletion, and
exceptional hard deletion. It must also place the tenant and agent surfaces in the existing RightSpot
route model and preserve the distinction between a weak interest signal, a Viewing Request, a
notification subscription, and a future Re-entry grant.

This is a decision proposal only. It must not implement the feature, change accepted product truth,
or write a new domain, API, data-model, or UI decision into canonical Core or Decision documents.

## Current evidence and authority

- The accepted local MVP provides tenant listing discovery, filters, listing detail, Viewing Request
  creation/submission, a tenant request dashboard, an agent request queue, and agent request detail.
- The current tenant source has no Favourite toggle, Favourite page, Favourite API, persistence, or
  server-side Favourite relation. The current agent source is request-queue centric and has no
  listing-interest surface.
- The current listing status boundary is only `PUBLISHED | UNPUBLISHED`, while tenant collection
  and detail reads expose published listings through the public listing read path. A proposal must
  explain whether a lifecycle reason, archive state, restricted saved-detail projection, or another
  bounded change is needed before any implementation can represent unavailable saved listings.
- Existing product and API documents describe Favourites as useful supporting functionality and
  non-blocking for the original MVP. This task records the owner's request to evaluate it as the
  next product increment; it does not silently promote that request into accepted product truth.
- The current agent workspace is defined around the request queue. A listing-interest summary may
  belong on the dashboard, a dedicated listing-management route, or both; the proposal must make
  the smallest evidence-backed recommendation for the current three-listing fixture.
- The current RightSpot visual direction is recorded in ADR-RS-0009, but the open visual Work Orders
  and preserved working-tree changes must not be treated as permission to modify shared UI during
  this proposal.
- The outer Core remains authoritative for the WebMCP/Re-entry boundary. Favourites may be a future
  durable artifact or event source, but this task must not redefine or extend that Core.

Relevant authority and evidence:

- [RightSpot current status](../00-current-status.md)
- [RightSpot product definition](../01-product-definition.md)
- [RightSpot requirements](../02-requirements.md)
- [RightSpot domain and data model](../04-domain-and-data-model.md)
- [RightSpot API and integration contracts](../05-api-and-integration-contracts.md)
- [RightSpot validation and evidence](../06-validation-and-evidence.md)
- [ADR-RS-0001 MVP scope and primary flow](../Decisions/ADR-RS-0001-mvp-scope-and-primary-flow.md)
- [ADR-RS-0006 durable workflow and application boundary](../Decisions/ADR-RS-0006-durable-workflow-and-application-boundary.md)
- [ADR-RS-0008 ordinary workflow HTTP and interface contract](../Decisions/ADR-RS-0008-ordinary-workflow-http-and-interface-contract.md)
- [ADR-RS-0009 UI/UX visual system and navigation](../Decisions/ADR-RS-0009-ui-ux-visual-system-and-navigation.md)
- [outer Re-entry Core product definition](../../../../Docs/Core/01-product-definition.md)
- [outer challenge MVP definition](../../../../Docs/Core/06-mvp-and-demo.md)

## Owner direction to evaluate, not yet accepted canonical behavior

The Advisor must test and refine these conclusions from the discussion rather than assume that they
already authorize implementation:

- A Favourite is an explicit tenant-owned relationship keyed by tenant and listing identity.
- Adding or removing a Favourite is independent from creating, submitting, confirming, or declining
  a Viewing Request.
- A listing status change must not silently hide an existing Favourite from the tenant's list.
- A price reduction is a listing update, not an unavailable state. A proposal may recommend a
  `Price reduced` or `Changed since saved` indication only if the required historical value/version
  can be owned and verified without overbuilding the MVP.
- Normal business removal uses soft deletion/archive. An exceptional hard delete should render a
  safe minimal tombstone if the relationship is retained, without presenting stale authoritative
  listing facts.
- A tenant's list should distinguish active listings from unavailable or archived saved records,
  while allowing the tenant to remove either kind.
- Agent interest should be an authorized aggregate. The primary metric should distinguish current
  saved relationships from all-time save events; tenant identity should not be exposed by default.
- A Favourite is not notification consent and must not silently create a future Agent continuation.

## RS-WO-008-01 — Favourites and listing-interest proposal

**Role:** Product/domain, UX, and API boundary Advisor  
**Status:** `READY_FOR_REVIEW` — read-only Advisor proposal received; main-thread review pending
**Parallelization:** `READ_ONLY_ADVISORY` — may inspect current source while other work exists, but must not edit any repository file  
**Risk profile:** `Standard` for proposal; later implementation would cross data, permissions, API, and UI boundaries  
**Supporting worker:** `01a05d79-ce45-7000-aa44-a3a1ecad95b0` (`Kuhn`, local multi-agent Advisor)  
**Write policy:** Return the proposal in the supporting-task report only. Do not write the proposal into Core, Decisions, Requirements, product status, source, tests, schemas, fixtures, or task records.  
**Source baseline:** Main-thread T0 observed at commit `70e3842125b4cb9bc9f0c4f33c445bb85d2c482e`;
the Advisor must capture its own observation because `RS-WO-007-02` may change `app/globals.css` while
this proposal is read. Existing `.gitignore`, `Docs/Tasks/README.md`, this untracked Task File, the
untracked owner-held reference, and any CSS-builder output remain outside this proposal's write set.
**Advisor result:** `READY_FOR_REVIEW` from `01a05d79-ce45-7000-aa44-a3a1ecad95b0`; the proposal
confirms the current Favourite capability gap and recommends a tenant-owned relation plus a
privacy-preserving agent aggregate. Its lifecycle, metric, tombstone, and contract choices remain
recommendations pending main-thread review.

### Required read set

- `/Users/alex/.codex/AGENTS.md`
- `/Users/alex/OpenAI-WebMCP/AGENTS.md`
- `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/AGENTS.md`
- RightSpot `RUNBOOK.md`
- RightSpot `Docs/00-current-status.md`
- RightSpot `Docs/01-product-definition.md`
- RightSpot `Docs/02-requirements.md`
- RightSpot `Docs/03-system-design.md`
- RightSpot `Docs/04-domain-and-data-model.md`
- RightSpot `Docs/05-api-and-integration-contracts.md`
- RightSpot `Docs/06-validation-and-evidence.md`
- RightSpot ADR-RS-0001 through ADR-RS-0009, with attention to ADR-RS-0001, ADR-RS-0006, ADR-RS-0008, and ADR-RS-0009
- Current listing domain/application/persistence source and listing DTOs
- Current tenant discovery/detail/API source and tests
- Current shared shell/session/navigation source and tests
- Current agent dashboard/API/request source and tests
- Existing `RIGHTSPOT-007` visual-boundary task, without modifying its files or dispatching its gated Builder
- Outer `Docs/Core/00-current-status.md`, `01-product-definition.md`, `06-mvp-and-demo.md`, and the relevant Re-entry Core mechanism documents

### Required proposal contents

The Advisor must provide an English proposal that clearly separates verified facts, owner direction,
recommendation, assumptions, unresolved decisions, and implementation implications. It must include:

1. **Product semantics:** the purpose of Favourites, what user problem it solves, and the boundary
   between a saved listing, a Viewing Request, an unavailable listing, notification consent, and
   future Re-entry authorization.
2. **Relationship and lifecycle model:** identity/uniqueness, idempotent add/remove semantics,
   timestamps, optional saved listing version/price evidence, listing status and reason handling,
   archive/soft-delete behavior, exceptional hard-delete/tombstone behavior, and same-listing versus
   new-listing identity when a property is re-listed.
3. **Tenant information architecture:** search-list control, listing-detail control, navigation
   entry, dedicated Favourite route, ordering/grouping, active versus unavailable display, empty,
   loading, error, stale, and mutation-failure states, and how a Favourite relates to an existing
   Viewing Request.
4. **Agent information architecture:** dashboard summary versus dedicated listing-management
   surface, per-listing interest display, status filtering, the smallest useful metrics for the
   current fixture, and what should be deferred as analytics rather than MVP behavior.
5. **Metric semantics:** precise definitions for current saved tenants, available-listing interest,
   all-time saves, removal, archive, and reactivation. Explain whether unavailable listings retain
   their aggregate and how each metric must be labelled to avoid misleading the agent.
6. **Authority and privacy matrix:** tenant-only reads/writes, agent listing authorization, aggregate
   projection boundaries, public listing response restrictions, object-level access, cross-tenant
   leakage risks, and whether any tenant identity or contact action is explicitly out of scope.
7. **API/data ownership proposal:** likely domain/application/repository/read-model boundaries,
   lifecycle joins or snapshots, consistency expectations, duplicate/concurrent requests, resettable
   demo behavior, and exact source paths likely to be affected later. This is a proposal, not a schema
   or code change.
8. **UX and accessibility requirements:** keyboard and screen-reader behavior, button labels, visual
   state distinction, responsive behavior, reduced motion, and truthful copy for archived/deleted
   records.
9. **Challenge relationship:** identify whether Favourites merely supports the rental product or
   could later provide a natural Re-entry artifact/event. Do not move the primary challenge slice,
   redefine Core, or add WebMCP work to this task.
10. **Later implementation decomposition:** recommend the smallest serial/parallel Work Order
    sequence, exact likely write sets, shared-file conflicts, migration/rollback boundary, focused
    tests, browser evidence, and stop conditions. Do not dispatch Builders or Verifiers.
11. **Alternatives and decisions required:** record rejected options such as silently hiding
    unavailable records, counting clicks instead of current relationships, exposing tenant identities,
    or making Favourite imply notification consent.

### Forbidden actions

- Do not implement Favourite UI, API, domain logic, persistence, migrations, schema changes, tests,
  fixtures, seed data, styles, routes, or navigation.
- Do not edit `src/`, `app/`, tests, package manifests, lockfiles, environment files, database files,
  generated output, or assets.
- Do not edit `Docs/Core/`, `Docs/Decisions/`, `Docs/00-current-status.md`, requirements, system
  design, API contracts, validation documents, or the `RIGHTSPOT-007` task.
- Do not create an ADR, implementation task, Work Order, branch, commit, push, deployment, or pull
  request from the supporting task. The main thread owns any later registration or canonical
  writeback after review.
- Do not add WebMCP registration, Cloud Receiver, Agent activation, notifications, external
  authentication, credentials, live property data, or external service dependencies.
- Do not expose tenant identities, contact details, or private request notes in an aggregate proposal.
- Do not treat a static source inspection or local test as proof of browser, deployment, WebMCP, or
  cross-role runtime behavior.

### Return gate

Return `READY_FOR_REVIEW` with the observed source identity, exact verified current gaps, recommended
semantics, status/action matrix, tenant and agent placement, privacy/authority matrix, proposed
future ownership map, implementation and verification decomposition, unresolved decisions, and
explicit non-goals. Return `BLOCKED` if the current authority or source identity does not permit a
reliable proposal. A proposal return does not authorize implementation or canonical writeback.

### Main-thread review disposition

The `Kuhn` proposal was reviewed jointly with `RS-WO-009-01` against the Main source baseline at
`d6b242c`. The main thread accepted the bounded Favourite/listing-interest direction with revisions:
current listing states remain `PUBLISHED | UNPUBLISHED`; active saved relationships are retained when
unpublished; only current and available aggregate metrics are included; tenant identity/contact data,
all-time analytics, archive/hard-delete/relisting semantics, Information Request, external communication,
WebMCP, and Re-entry remain out of scope. The durable decision is [ADR-RS-0013](../Decisions/ADR-RS-0013-favourites-and-listing-interest-boundary.md).

This proposal Task is now `closed`. It authorized no code itself. The separately registered
`RIGHTSPOT-020` Task is the only implementation authority, and it remains `REGISTERED_NOT_DISPATCHED`.

## Closure gate

This task is closed after the main thread recorded the review disposition, durable ADR, and separate
implementation Task. It remains proposal-only and contains no product code or implementation authority.

## Reopen condition

Reopen this task if the accepted MVP route/role boundary changes, listing lifecycle gains a new
business state, the aggregate count requires a different privacy model, or the main thread decides
that Favourites should become part of a concrete Re-entry demonstration rather than a supporting
ordinary product capability.
