# RIGHTSPOT-009: Define tenant information requests and contact-preference boundary

**Type:** `decision`  
**Lifecycle:** `pending`  
**Priority:** `P1` for the next coherent product increment, not a blocker to the Re-entry Core challenge slice  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-01  
**Depends on:** `RIGHTSPOT-002` closed local MVP; current tenant/agent role, listing identity, persistence, and API boundaries; accepted UI direction in ADR-RS-0009

## Task Control

- Type: `decision`
- Lifecycle: `pending`
- Priority: `P1`
- Owner: Main RightSpot thread
- Current increment: Produce one evidence-backed proposal for a structured tenant Information Request and its authorized agent handling projection, including contact-channel preferences, requested information topics, and an open message, without implementing the capability.
- Next gate: The main thread reviews the returned Advisor proposal, jointly with `RIGHTSPOT-008`
  where their listing, tenant-navigation, privacy, and agent-surface boundaries overlap, then either
  accepts a bounded decision plus a later implementation task or records a rejected/not-planned
  disposition and its reopen condition.
- Dependencies: The accepted ordinary rental MVP remains authoritative; the existing Viewing Request workflow, role/privacy boundaries, and listing identity remain in force. `RIGHTSPOT-008` is adjacent context only and must not be treated as accepted behavior or an implementation dependency. No external authentication, email/phone/WhatsApp provider, WebMCP, Cloud Receiver, deployment, or credential gate is required for this proposal.

## Bounded objective

Define the smallest coherent product and architecture boundary for a tenant to:

1. open an `Information Request` or `Ask about this listing` flow from an authorized listing
   surface, including a Favourite where appropriate;
2. select structured information topics, choose how an agent may contact them, and add an optional
   free-form message; and
3. explicitly submit a durable enquiry that the assigned property agent can review in an authorized
   management surface.

The proposal must preserve the distinction between a passive Favourite, an active Information
Request, and a Viewing Request. It must define how the request behaves when listing facts or listing
availability change, while making clear that the first increment records contact preference and
agent handling rather than sending an email, placing a call, or using the WhatsApp API.

This is a decision proposal only. It must not implement the feature, change accepted product truth,
or write a new domain, API, data-model, lifecycle, UI, communication, or WebMCP decision into
canonical Core or Decision documents.

## Current evidence and authority

- The accepted local MVP provides listing discovery, listing detail, a tenant Viewing Request draft
  and explicit submission flow, a tenant request dashboard, an agent Viewing Request queue, and
  agent request detail/review/response actions.
- The current tenant request editor supports preferred viewing times and an optional `tenantNote`;
  that note is part of a Viewing Request and is not a general information enquiry or communication
  preference record.
- The current tenant source has no Information Request form, topic taxonomy, contact-channel
  selector, enquiry dashboard, or corresponding server API. The current agent source is centered on
  the Viewing Request queue and has no separate information-enquiry projection.
- No email, phone, or WhatsApp delivery provider is part of the current package or runtime boundary.
  The proposal must not infer delivery, response, or contact success from a submitted record.
- The current listing status boundary is only `PUBLISHED | UNPUBLISHED`; the proposal must explain
  how an existing enquiry is displayed when a listing becomes unavailable, archived, soft-deleted,
  or exceptionally hard-deleted.
- The current fixture is deterministic, synthetic, resettable, and limited to one Viewing Request.
  A proposal must state whether Information Requests are independent of that one-request constraint,
  and what the smallest credible demo fixture should permit.
- Existing product and API documents define the original MVP around the Viewing Request. This task
  records the owner's request to evaluate a separate information-intent capability; it does not
  silently broaden the accepted MVP or replace the primary Challenge path.
- The outer Re-entry Core remains authoritative. An Information Request may later become a useful
  shared artifact or re-entry trigger, but this task must not redefine Core, add WebMCP integration,
  or move the primary tenant-to-agent challenge slice.

Relevant authority and evidence:

- [RightSpot current status](../00-current-status.md)
- [RightSpot product definition](../01-product-definition.md)
- [RightSpot requirements](../02-requirements.md)
- [RightSpot system design](../03-system-design.md)
- [RightSpot domain and data model](../04-domain-and-data-model.md)
- [RightSpot API and integration contracts](../05-api-and-integration-contracts.md)
- [RightSpot validation and evidence](../06-validation-and-evidence.md)
- [RIGHTSPOT-008 favourites and listing-interest proposal task](RIGHTSPOT-008-define-favourites-and-listing-interest-boundary.md)
- [ADR-RS-0001 MVP scope and primary flow](../Decisions/ADR-RS-0001-mvp-scope-and-primary-flow.md)
- [ADR-RS-0006 durable workflow and application boundary](../Decisions/ADR-RS-0006-durable-workflow-and-application-boundary.md)
- [ADR-RS-0008 ordinary workflow HTTP and interface contract](../Decisions/ADR-RS-0008-ordinary-workflow-http-and-interface-contract.md)
- [ADR-RS-0009 UI/UX visual system and navigation](../Decisions/ADR-RS-0009-ui-ux-visual-system-and-navigation.md)
- [outer Re-entry Core product definition](../../../../Docs/Core/01-product-definition.md)
- [outer challenge MVP and demo definition](../../../../Docs/Core/06-mvp-and-demo.md)

## Owner direction to evaluate, not yet accepted canonical behavior

The Advisor must test and refine these conclusions from the discussion rather than assume that they
already authorize implementation:

- Use `Information Request` or `Ask about this listing` rather than `Request email`, because the
  record captures a contact preference and enquiry; it does not claim that RightSpot sends a message.
- Offer one required primary contact method and optional acceptable alternatives. Do not silently
  preselect a channel. The UI must explain whether alternatives are ordered preferences or merely
  permitted methods.
- Support `Email`, `Phone call`, and `WhatsApp` as preference values without integrating their
  delivery providers in the first increment.
- Use multi-select structured information topics plus an optional bounded open message. Candidate
  topics include rent/fees, availability, viewing arrangements, property features, tenancy terms,
  and location/transport; the Advisor must reduce and validate the taxonomy.
- Store the submitted channel preference and relevant contact detail/consent snapshot with the
  enquiry so later profile changes do not rewrite what the tenant authorized at submission time.
- Keep Information Request independent from Favourite and Viewing Request. An enquiry may later
  lead to a Viewing Request, but submission must not auto-create or auto-submit one.
- Preserve a submitted enquiry when its listing becomes unavailable or archived, with truthful status
  and no stale claim that the listing remains available. Normal removal is soft-delete/archive;
  exceptional hard deletion requires a safe minimal tombstone or an explicitly justified purge.
- Give the tenant a durable submitted state and the agent an authorized handling surface. The first
  increment need not implement an in-app reply or external delivery, but it must not be fire-and-forget
  if the record is presented as a product workflow.
- Keep Favourite count, Information Request count, and Viewing Request count as separate signals;
  they represent passive interest, active enquiry, and appointment intent respectively.
- A contact preference is not consent for unrestricted marketing, automatic notification, or future
  Agent continuation. Any later re-entry or notification behavior requires an explicit separate grant.

## RS-WO-009-01 — Information-request and contact-preference proposal

**Role:** Product/domain, UX, privacy, and API boundary Advisor  
**Status:** `READY_FOR_REVIEW` — read-only Advisor proposal received; main-thread review pending
**Parallelization:** `READ_ONLY_ADVISORY` — may inspect current source while other work exists, but must not edit any repository file  
**Risk profile:** `Standard` for proposal; later implementation would cross data, PII, permissions, API, UI, and possible external-communication boundaries  
**Supporting worker:** `01a05d7c-21b4-72f3-bbe8-1c34d1aee291` (`Arendt`, local multi-agent Advisor)  
**Write policy:** Return the proposal in the supporting-task report only. Do not write the proposal into Core, Decisions, Requirements, product status, source, tests, schemas, fixtures, assets, or task records.  
**Advisor result:** `READY_FOR_REVIEW`; the proposal recommends a separate durable `InformationRequest` aggregate exposed as “Ask about this listing”, with one required primary channel, up to two ordered alternatives, bounded topics/message, contact and permission snapshots, and explicit internal handling only. It does not authorize external communication, implementation, WebMCP, or Re-entry changes.  
**Source baseline:** Main-thread T0 observed at commit `70e3842125b4cb9bc9f0c4f33c445bb85d2c482e`;
the Advisor must capture its own observation because `RS-WO-007-02` may change `app/globals.css` while
this proposal is read. Existing `.gitignore`, `Docs/Tasks/README.md`, untracked 008/009 Task Files,
the untracked owner-held reference, and any CSS-builder output remain outside this proposal's write
set.

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
- RightSpot `RIGHTSPOT-008` task, without treating its proposal as accepted product truth
- Current listing domain/application/persistence source and listing DTOs
- Current tenant discovery, listing detail, request editor, request dashboard, API, and tests
- Current shared shell/session/navigation source and tests
- Current agent dashboard, request detail, API, and tests
- Outer `Docs/Core/00-current-status.md`, `01-product-definition.md`, `06-mvp-and-demo.md`, and relevant Re-entry Core mechanism documents

### Required proposal contents

The Advisor must provide an English proposal that clearly separates verified facts, owner direction,
recommendation, assumptions, unresolved decisions, and implementation implications. It must include:

1. **Intent and naming:** the user problem, recommended `Information Request`/`Ask about this
   listing` terminology, and the boundary from Favourite, Viewing Request, notification, marketing
   consent, and external communication.
2. **Contact preference model:** primary versus alternative channels, allowed combinations and order,
   contact data source, validation, consent copy, unverified contact details, profile changes, and
   the exact claim the system can make after submission.
3. **Information taxonomy:** the smallest controlled topic set, multi-select semantics, `Other`
   behavior, open-message length/validation, content safety/privacy considerations, and whether any
   topic should be deferred.
4. **Domain and lifecycle model:** request identity, tenant/listing/agent ownership, idempotency,
   duplicate/update/cancel/withdraw behavior, status transitions, timestamps/versioning, listing
   price/status changes, soft-delete/archive, hard-delete/tombstone, and re-list identity.
5. **Tenant information architecture:** entry points on listing detail and Favourite surfaces,
   form/review/submit flow, any tenant enquiry dashboard, status/action matrix, empty/loading/error/
   stale/mutation-failure states, and coexistence with a Viewing Request.
6. **Agent information architecture:** dashboard summary versus a separate information-request
   queue/detail surface, listing and status filters, handling states, current listing facts, contact
   preference display, and the smallest useful fixture behavior.
7. **Signal and metric semantics:** precise separation of Favourite, Information Request, and Viewing
   Request counts; aggregate versus tenant identity; current versus historical counts; and copy that
   does not overstate tenant intent or contact success.
8. **Authority, privacy, and security matrix:** tenant-only reads/writes, agent listing authorization,
   PII/contact-detail access, public response restrictions, cross-tenant leakage risks, message
   handling, audit boundaries, and no marketing/automatic-contact assumptions.
9. **API/data ownership proposal:** likely domain/application/repository/read-model boundaries,
   contact snapshot ownership, lifecycle joins/tombstones, consistency/idempotency expectations,
   resettable demo behavior, and exact future source paths. This is a proposal, not a schema or code
   change.
10. **WebMCP and Re-entry relationship:** which structured page-authored tools could later support
    reading listing facts, preparing an enquiry, or resuming agent work; what must remain human-only;
    and why the feature does or does not materially strengthen the primary Challenge slice. Do not add
    WebMCP or Re-entry implementation to this proposal.
11. **Later implementation decomposition:** smallest serial/parallel Work Order sequence, exact
    likely write sets, shared-file conflicts, migration/rollback boundary, focused tests, browser
    evidence, and stop conditions. Do not dispatch Builders or Verifiers.
12. **Alternatives and decisions required:** include rejected options such as `Request email` wording,
    arbitrary multi-channel selection without priority, embedding the enquiry in Viewing Request,
    automatic external sending, exposing tenant identities, or silently discarding enquiries when a
    listing becomes unavailable.

### Forbidden actions

- Do not implement Information Request UI, API, domain logic, persistence, migrations, schema,
  statuses, tests, fixtures, seed data, styles, routes, or navigation.
- Do not edit `src/`, `app/`, tests, package manifests, lockfiles, environment files, database files,
  generated output, or assets.
- Do not edit `Docs/Core/`, `Docs/Decisions/`, `Docs/00-current-status.md`, requirements, system
  design, API contracts, validation documents, or `RIGHTSPOT-008`.
- Do not create an ADR, implementation task, Work Order, branch, commit, push, deployment, or pull
  request from the supporting task. The main thread owns any later registration or canonical
  writeback after review.
- Do not install or configure email, telephony, WhatsApp, CRM, notification, authentication, or
  external communication providers.
- Do not transmit, invent, inspect, or print real contact details, credentials, cookies, tokens, or
  secrets.
- Do not add WebMCP registration, Cloud Receiver, Agent activation, automatic notifications, or
  future continuation behavior.
- Do not expose tenant identities, contact details, private messages, or request notes in an aggregate
  proposal.
- Do not treat static inspection or local tests as proof of browser, deployment, WebMCP, external
  delivery, or cross-role runtime behavior.

### Return gate

Return `READY_FOR_REVIEW` with the observed source identity, exact verified gaps, recommended intent
and channel semantics, information taxonomy, lifecycle/status matrix, tenant and agent placement,
privacy/authority matrix, proposed future ownership map, implementation and verification decomposition,
unresolved decisions, and explicit non-goals. Return `BLOCKED` if the current authority or source
identity does not permit a reliable proposal. A proposal return does not authorize implementation,
external communication, or canonical writeback.

## Closure gate

Close this task only after the main thread records a review disposition. If accepted, the main thread
may create a separate durable decision record and a later bounded implementation task; those actions
must be explicitly registered and independently verified. If rejected or not planned, preserve the
reason, residual risk, and reopen condition in this task. This task itself must remain proposal-only.

## Reopen condition

Reopen this task if the accepted tenant/agent route boundary changes, contact-channel consent or PII
handling requires a different authority model, listing lifecycle gains a new business state, the
product decides to send external communications, or the main thread decides that Information Request
should become part of a concrete Re-entry demonstration rather than a supporting ordinary product
capability.
