# RIGHTSPOT-010: Define the Agent Operations Insights dashboard boundary

**Type:** `decision`  
**Lifecycle:** `pending`  
**Priority:** `P1` for the next WebMCP/product milestone, independent of the Re-entry Core gate  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-01  
**Depends on:** `RIGHTSPOT-002` closed local MVP; current listing, Viewing Request, role, persistence, and API boundaries; accepted UI direction in ADR-RS-0009

## Task Control

- Type: `decision`
- Lifecycle: `pending`
- Priority: `P1`
- Owner: Main RightSpot thread
- Current increment: Produce one evidence-backed proposal for a read-first Agent Operations Insights dashboard in which a non-technical property agent can express bounded operational questions through a page-authored WebMCP tool surface and see the verified result in the normal RightSpot web UI.
- Next gate: The main thread reviews the proposal and either accepts a bounded dashboard/tool/data decision plus a later implementation task, or records a rejected/not-planned disposition and its reopen condition.
- Execution posture: `IN_PROGRESS`; a read-only proposal Advisor is assigned. This does not authorize
  implementation, WebMCP registration, or canonical writeback.
- Dependencies: The accepted ordinary rental MVP, current role/privacy authority, and existing listing/request identity remain in force. `RIGHTSPOT-008` and `RIGHTSPOT-009` are adjacent proposal tasks only and must not be treated as accepted behavior or implementation dependencies. No external authentication, WebMCP registration, Cloud Receiver, deployment, reporting provider, or credential gate is required for this proposal.

## Bounded objective

Define the smallest coherent product and architecture boundary for a strong Agent Operations
Insights experience with two equal product concerns:

1. a familiar, manually usable dashboard where a property agent can inspect operational data; and
2. a page-authored, bounded WebMCP query surface through which an Agent can interpret a natural-language
   operational question, apply structured filters or a report query, and leave the current page showing
   the result for human review.

The proposal must evaluate an initial read-only query set covering:

- upcoming Viewing operations, such as confirmed or proposed viewings in a bounded date range;
- listing pipeline, such as newly published, open, unavailable, or stale listings by area and age; and
- interest funnel, such as Favourite, Information Request, and Viewing Request signals by listing or
  area once the related product capabilities exist.

The proposal must define how this dashboard can be materially better with WebMCP without becoming an
arbitrary SQL console, an in-app generic chatbot, a disconnected fake analytics screen, or an unsafe
write-action surface. It must also decide how the richer reporting data can coexist with the existing
deterministic one-request relay fixture without weakening the authoritative domain model.

This is a decision proposal only. It must not implement the dashboard, register WebMCP tools, change
the reporting or domain schema, seed analytics data, add routes, or write a new product, Core, data,
API, WebMCP, or UI decision into canonical documents.

## Current evidence and authority

- The accepted local MVP provides an agent request-queue dashboard and request detail/review flow, but
  no Agent Operations Insights route, reporting read model, natural-language query surface, or
  multi-dimensional operational dashboard.
- The current ordinary fixture is deterministic and intentionally limited to one Viewing Request.
  It cannot credibly answer questions such as how many viewings occur on a future date without a
  bounded richer data profile or a separately justified expansion of the fixture.
- The current listing boundary is narrow (`PUBLISHED | UNPUBLISHED`) and does not yet distinguish
  all lifecycle reasons needed for open, stale, let-agreed, archived, or removed reporting.
- Current source contains no WebMCP registration. This task must not infer WebMCP capability from
  ordinary HTTP routes, local tests, or a hypothetical tool wrapper.
- Current product documentation defines the original workflow around one shared Viewing Request and
  an explicit human agent response. This task records the owner's decision to develop a second major
  product line; it does not replace the tenant-to-agent workflow or force every dashboard query into
  the Re-entry Core mechanism.
- `RIGHTSPOT-008` proposes tenant Favourites and agent listing-interest aggregates, while
  `RIGHTSPOT-009` proposes structured Information Requests and contact preferences. Neither task has
  accepted implementation truth. Their signals may form a later interest funnel, but this proposal
  must remain valid if either capability is deferred.
- The current agent UI is request-queue centric. The proposal must assess whether the smallest MVP
  surface is a dashboard section, a dedicated `/agent/insights` or `/agent/operations` route, or both.
- The outer repository remains authoritative for WebMCP and Re-entry Core boundaries. This task may
  identify a future relation to those mechanisms, but it must not edit or redefine outer Core.

Relevant authority and evidence:

- [RightSpot current status](../00-current-status.md)
- [RightSpot README and product thesis](../../README.md)
- [RightSpot product definition](../01-product-definition.md)
- [RightSpot requirements](../02-requirements.md)
- [RightSpot system design](../03-system-design.md)
- [RightSpot domain and data model](../04-domain-and-data-model.md)
- [RightSpot API and integration contracts](../05-api-and-integration-contracts.md)
- [RightSpot validation and evidence](../06-validation-and-evidence.md)
- [RIGHTSPOT-008 favourites and listing-interest proposal task](RIGHTSPOT-008-define-favourites-and-listing-interest-boundary.md)
- [RIGHTSPOT-009 information-request proposal task](RIGHTSPOT-009-define-information-request-and-contact-preference-boundary.md)
- [ADR-RS-0001 MVP scope and primary flow](../Decisions/ADR-RS-0001-mvp-scope-and-primary-flow.md)
- [ADR-RS-0006 durable workflow and application boundary](../Decisions/ADR-RS-0006-durable-workflow-and-application-boundary.md)
- [ADR-RS-0008 ordinary workflow HTTP and interface contract](../Decisions/ADR-RS-0008-ordinary-workflow-http-and-interface-contract.md)
- [ADR-RS-0009 UI/UX visual system and navigation](../Decisions/ADR-RS-0009-ui-ux-visual-system-and-navigation.md)
- [outer Re-entry Core product definition](../../../../Docs/Core/01-product-definition.md)
- [outer challenge MVP and demo definition](../../../../Docs/Core/06-mvp-and-demo.md)
- [outer competition thesis and positioning](../../../../Docs/Core/08-competition-thesis-and-positioning.md)

## Owner direction to evaluate, not yet accepted canonical behavior

The Advisor must test and refine these conclusions from the discussion rather than assume that they
already authorize implementation:

- The Agent Operations Insights dashboard is a major RightSpot product line, not merely a supporting
  widget. It may stand beside the tenant marketplace workflow and the Re-entry Core integration path.
- A non-technical property agent should be able to ask for operational information in natural
  language, without writing SQL, entering a database, or learning a developer-facing interface.
- The Agent should use page-authored, domain-specific WebMCP tools; the page should update its normal
  filters and result presentation so the human sees and can verify the answer in the familiar web UI.
- Manual filters remain available as a non-Agent baseline and recovery path. WebMCP should reduce
  composition and navigation friction rather than make the ordinary UI unusable.
- The first query families should be scheduling, listing pipeline, and interest funnel. The Advisor
  must narrow the first acceptance set to a coherent number of query contracts rather than design an
  unlimited analytics language.
- The initial dashboard should be read-first. Any mutation, external contact, listing status change,
  or tenant-facing communication remains a visible human action and is not silently exposed as an
  Agent tool.
- Query results must come from authoritative RightSpot records or a clearly governed projection, not
  hard-coded counts or an untraceable synthetic answer. The Advisor must compare a richer deterministic
  operations profile against expanding the one-request relay fixture and recommend one boundary.
- Query terminology must be explicit: date range and Europe/London timezone, `publishedAt` versus
  database creation time, meaning of open, meaning of stale, listing lifecycle reasons, and which
  Viewing Request states count as upcoming viewings.
- The UI should show the interpreted question, applied filters, data freshness, result count, and
  links to canonical listing or request records. It should not expose raw SQL or pretend that a query
  proves external delivery or business outcome.
- The Agent must remain subject to server-side role, listing assignment, privacy, and object-level
  authorization. A natural-language request must not widen the agent's data access.
- The dashboard should not silently create a notification subscription, Re-entry grant, or scheduled
  report merely because an agent asked a question. Those are separate decisions.

## Final proposal report input — owner-approved working direction

This section records the main-thread owner's agreement with the current brainstorming direction so
the delegated Advisor can explain the intended product clearly. It is an input to the final proposal
report, not accepted canonical product truth, an ADR, an implementation specification, or permission
to modify source. The Advisor must still test the boundaries against current evidence, identify
trade-offs, and label recommendations, assumptions, and unresolved decisions.

### Strategic position

- Agent Operations Insights is a co-equal RightSpot product line beside the tenant marketplace and
  the Viewing Request workflow. It is not merely a Favourite or Information Request supporting widget.
- Re-entry Core remains a separate mechanism and challenge path. The dashboard does not need to force
  every query into asynchronous re-entry in order to demonstrate material WebMCP leverage.
- RightSpot should show two complementary values: the marketplace helps tenants and agents move a
  concrete rental workflow; Agent Operations Insights helps a non-technical property agent understand
  and act on portfolio data through a familiar web interface.
- The dashboard's value is not that it hides a database behind a chat box. Its value is that a natural-
  language Agent can use structured, page-authored WebMCP tools to operate the same authoritative web
  surface that the human understands and can verify.

### Product thesis and target experience

The intended user is a property agent who understands rental operations but should not need to write
SQL, open a terminal, learn a developer-facing reporting tool, or compose a complicated set of manual
filters to answer routine operational questions.

The target experience is:

1. The agent opens a normal RightSpot Operations/Insights page.
2. The human asks an Agent a natural-language operational question.
3. The Agent discovers and invokes a bounded page-authored WebMCP tool with structured parameters.
4. RightSpot validates the query against the agent's authority and current data, updates the page's
   normal filter/report state, and renders the result in the familiar dashboard.
5. The page shows what the Agent understood, which filters were applied, how fresh the data is, and
   which records match.
6. The human can refine or correct the query, inspect the result, and open the canonical listing or
   Viewing Request page.

The Agent should explain or clarify the query, but the webpage must remain the visible result surface.
An answer that exists only in chat, or a count that cannot be traced back to the page's current result,
does not demonstrate the intended WebMCP leverage.

### Representative scenarios for the final report

The Advisor should use scenarios like these to test the proposal and select the smallest credible
acceptance set. They are representative examples, not a requirement to implement every variation.

#### Scenario A — Upcoming viewing operations

Human request:

> “Show me all confirmed viewings next Wednesday.”

Expected behavior:

- The Agent uses a scheduling query tool rather than SQL or a generic database search.
- The tool resolves “next Wednesday” using the declared Europe/London demo timezone and a precise
  date boundary.
- The page applies the date and `CONFIRMED` status filters and renders matching appointments in a
  normal table or card view.
- The page shows the interpreted date, status, result count, data-as-of value, and links to each
  canonical request/listing record.
- The human can follow up with “Include proposed viewings, but only in Camden,” and the same page
  updates its structured query state.

The report must define whether a confirmed viewing is derived from the current Viewing Request state
and selected slot or requires a separate appointment record. It must not infer a scheduled viewing from
an unsubmitted preferred time.

#### Scenario B — Listing pipeline and stale inventory

Human request:

> “Show me open homes in Camden that have been listed for more than 90 days.”

Expected behavior:

- The Agent invokes a bounded listing-pipeline tool with area, open-state, and age parameters.
- The page shows the exact meaning of `open`, the publication-date basis for the age calculation, the
  stale threshold, and the date interpretation.
- Each result links to the authoritative listing detail, and an unavailable or archived listing is
  not silently counted as open.
- The human can change the threshold to 180 days or sort by current saved interest without leaving
  the Operations page.

The report must distinguish `publishedAt` from database creation time and must not infer “no tenant”
merely because a listing has no Viewing Request. A reliable stale report requires explicit listing
lifecycle and lease/occupancy authority.

#### Scenario C — Interest funnel

Human request:

> “Which listings have high saved interest but no active viewing request?”

Expected behavior:

- The Agent reads separate Favourite, Information Request, and Viewing Request signals where those
  capabilities are available.
- The page labels the signals separately: Favourite is passive interest, Information Request is active
  enquiry, and Viewing Request is appointment intent.
- The result is an authorized aggregate by managed listing or area; it does not expose tenant identity,
  contact details, or private messages.
- A human can open a listing or request record, but the query does not automatically contact a tenant,
  create a request, or change listing status.

The report must remain valid if `RIGHTSPOT-008` or `RIGHTSPOT-009` is deferred. It should identify the
minimum dashboard query that can ship without making the dashboard depend on either unaccepted task.

#### Scenario D — Familiar UI plus Agent refinement

The final report should demonstrate the difference between Agent assistance and Agent-only output:

1. The human asks for a broad operational result.
2. The page shows the applied filters and results.
3. The human corrects an ambiguity or adds a constraint.
4. The Agent invokes the appropriate structured tool again.
5. The page updates the same visible report state.
6. The human drills into a canonical record.

This iterative path is preferred to a one-shot “ask and receive a number” demo because it proves that
WebMCP helps operate a real web application, not merely generate an explanation.

### WebMCP leverage principles to preserve

- Tools must be authored by the page and domain-specific. The initial proposal should prefer a small
  family such as `read_upcoming_viewings`, `read_listing_pipeline`, and `read_listing_interest` over
  one unrestricted `query_operations` or `run_sql` tool.
- Tool schemas must use bounded business parameters: date range, timezone, request status, listing
  status/reason, area, age threshold, interest signal, sort, and result limit where justified.
- The page must remain the authority for current context, filters, result rendering, and canonical
  navigation. Tool results must be derived from the same server-authorized data layer as manual UI
  reads.
- WebMCP should reduce composition and navigation friction, not remove the manual filter baseline or
  make the application unusable without an Agent.
- The Agent may read, filter, group, sort, and prepare an insight summary in the first acceptance
  boundary. It must not silently change listing status, contact tenants, send a response, schedule a
  report, create a notification, or create a Re-entry grant.
- A dashboard tool that returns data without a visible page effect is weaker leverage. The report must
  state what the judge or human will see change after each representative invocation.
- A raw technical capability panel is not required. Prefer task language such as “Your agent can
  compare current listing interest” and “You decide whether to contact anyone” over tool JSON or
  implementation metadata.

### Data authority, fixture, and time principles

The final report must confront the current evidence gap instead of designing a visual dashboard around
invented counts:

- The current one-request relay fixture is insufficient for credible multi-viewing, historical listing,
  stale-inventory, or funnel queries.
- The preferred direction to evaluate is a richer deterministic `Operations Insights` data profile in
  the same RightSpot backend and authority model, while preserving the one-request relay profile for
  the Re-entry challenge path.
- A separate profile must not become a disconnected fake reporting database. Its rows, projections,
  metrics, and reset behavior must have an explicit source-of-truth relationship to the RightSpot
  domain.
- Candidate required facts include listing publication history, lifecycle reason, lease/occupancy
  outcome, multiple Viewing Request or appointment records, Favourite events/relations, Information
  Request records, and timestamps sufficient for current versus historical counts.
- The demo clock must be deterministic or explicitly anchored. Relative phrases such as “next
  Wednesday” must not drift with the machine clock and make clean-room reproduction unreliable.
- The report must state whether direct domain reads or a governed reporting projection is the smallest
  credible implementation boundary, including freshness, rebuild, and rollback behavior.

### Metric, query, and safety semantics

The proposal must include a small glossary and not leave these meanings to the Agent's inference:

- `Upcoming viewing`: confirmed appointments, proposed appointments, or two separately labelled sets;
  never an unsubmitted preferred time by accident.
- `New listing`: normally based on first publication, not row creation.
- `Open listing`: an explicit published and not-let/not-archived state, subject to the accepted
  lifecycle model.
- `Stale listing`: a declared published-age threshold and a declared treatment of temporary unpublish,
  reactivation, and let-agreed records.
- `Current saved tenants`: distinct tenants with an active Favourite relationship; not click count and
  not all-time saves.
- `Information Request count`: distinct submitted active enquiries; not contact-delivery success.
- `Viewing Request count`: distinct requests in a declared set of states; not a proxy for confirmed
  appointments unless the mapping is explicit.
- Calendar periods versus rolling periods: the query must show which one it used.
- Zero results, missing values, archived rows, ambiguous areas/statuses, malformed dates, stale
  projections, unsupported queries, tool failure, partial result failure, and excessive result ranges
  must have safe recovery or clarification behavior.
- Large results must be capped or paginated with a clear refine path; the system must not silently
  truncate a count.
- Agent portfolio/listing authorization must be enforced server-side. Natural-language phrasing must
  never widen data access.
- Listing descriptions, tenant messages, and other user-authored text are data, not Agent instructions;
  the proposal must identify prompt-injection and untrusted-content risks.

### Trust, human boundary, and future extensions

- The dashboard must show interpreted query, applied filters, data freshness, result count, and
  assumptions where useful.
- The first acceptance boundary is read-first. Any listing change, external contact, response sending,
  export of private data, report scheduling, notification, or Re-entry grant remains a visible human
  action and requires a separate decision.
- Favourite, Information Request, and Viewing Request signals can form a useful funnel, but none may
  silently create another, and the dashboard must remain valid if either proposal task is deferred.
- Saved queries/reports may become a later durable artifact. The report must distinguish a saved query
  that re-runs against current data from a historical snapshot and from a scheduled report.
- A future stale-listing threshold event could return an Agent to a preset dashboard insight, but this
  is an optional Re-entry extension and must not redefine the dashboard's direct WebMCP value.

### Recommended staging to assess, not authorization to implement

1. Establish reporting vocabulary, lifecycle facts, data authority, and a deterministic Operations
   profile.
2. Build and verify a manually usable read-only Insights page and its query/result semantics.
3. Add a small page-authored WebMCP query family whose calls visibly update that page.
4. Add interpreted-query, freshness, privacy, error, browser, and Agent evidence.
5. Only later consider saved queries, trend views, report scheduling, write preparation, external
   contact, or stale-listing Re-entry.

The final report must recommend exact serial and parallel ownership for these stages, especially around
shared shell/navigation, global styles, domain types, persistence, reporting projections, route
handlers, WebMCP registration, and tests. It must identify the smallest rollback boundary for each
stage and the exact evidence required before any broader claim.

## RS-WO-010-01 — Agent Operations Insights and WebMCP dashboard proposal

**Role:** Product strategy, analytics/domain, WebMCP, UX, privacy, and API boundary Advisor  
**Status:** `READY_FOR_REVIEW` — read-only proposal Advisor returned; main-thread review pending  
**Parallelization:** `READ_ONLY_ADVISORY` — may inspect current source while other work exists, but must not edit any repository file  
**Risk profile:** `High` for later implementation because it crosses reporting semantics, data authority, role privacy, UI state, and WebMCP capability boundaries; `Standard` for this read-only proposal  
**Supporting task:** `01a05d88-8907-7063-8c93-030e296c9df0` (`Leibniz`, local multi-agent Advisor).  
**Advisor result:** `READY_FOR_REVIEW`; the proposal recommends a dedicated `/agent/operations` read-only dashboard, manual filters as baseline, bounded page-authored query tools later, and a deterministic Operations profile with an application-owned reporting projection. It keeps interest queries capability-gated on 008/009 and does not authorize implementation or WebMCP registration.  
**Write policy:** Return the proposal in the supporting-task report only. Do not write the proposal into Core, Decisions, Requirements, product status, source, tests, schemas, fixtures, assets, or task records.  
**Source baseline:** The current RightSpot working tree. Capture the observed commit, dirty paths, and any candidate limitations; do not assume unrelated uncommitted changes are part of the accepted baseline.

### Required read set

- `/Users/alex/.codex/AGENTS.md`
- `/Users/alex/OpenAI-WebMCP/AGENTS.md`
- `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/AGENTS.md`
- RightSpot `RUNBOOK.md`
- RightSpot `README.md`
- RightSpot `Docs/00-current-status.md`
- RightSpot `Docs/01-product-definition.md`
- RightSpot `Docs/02-requirements.md`
- RightSpot `Docs/03-system-design.md`
- RightSpot `Docs/04-domain-and-data-model.md`
- RightSpot `Docs/05-api-and-integration-contracts.md`
- RightSpot `Docs/06-validation-and-evidence.md`
- RightSpot ADR-RS-0001 through ADR-RS-0009, with attention to ADR-RS-0001, ADR-RS-0006, ADR-RS-0008, and ADR-RS-0009
- RightSpot `RIGHTSPOT-008` and `RIGHTSPOT-009` task files, without treating either proposal as accepted product truth
- Current listing, Viewing Request, Favourite-adjacent, and information-request-adjacent source if present
- Current domain/application/persistence source, DTOs, route handlers, fixture/reset logic, and tests
- Current tenant, agent, shared shell/session/navigation source and tests
- Outer `Docs/Core/00-current-status.md`, `01-product-definition.md`, `06-mvp-and-demo.md`, `08-competition-thesis-and-positioning.md`, and relevant Re-entry Core mechanism documents

### Required proposal contents

The Advisor must provide an English proposal that clearly separates verified facts, owner direction,
recommendation, assumptions, unresolved decisions, and implementation implications. It must include:

1. **Product thesis and role:** explain the operational problem, why a non-technical agent benefits
   from Agent-mediated web queries while retaining the normal dashboard, and how this product line
   relates to the tenant marketplace and Re-entry Core without being forced into either one.
2. **Information architecture:** recommend the smallest dashboard/route arrangement, navigation entry,
   manual filter baseline, Agent-driven interaction model, result table/card/chart choices, empty/error/
   loading states, responsive behavior, and canonical drill-down paths.
3. **Query ontology and acceptance set:** define the first bounded scheduling, listing-pipeline, and
   interest-funnel query families; provide representative natural-language questions and their exact
   structured meanings; identify ambiguous requests and safe clarification behavior.
4. **Metric and time semantics:** define Europe/London date handling, calendar versus rolling periods,
   confirmed/proposed viewing inclusion, `publishedAt`, open/unavailable/let-agreed meanings, stale
   age thresholds, listing reactivation, and current versus historical interest counts. Identify any
   required fields that do not exist today.
5. **WebMCP materiality:** propose page-authored domain tools and bounded schemas, how the Agent query
   updates page state, how current page context constrains tools, how tools differ by dashboard state,
   and how the result proves WebMCP is doing material work rather than wrapping arbitrary HTTP or SQL.
   Keep raw SQL, generic query tools, and unsafe write tools out of the proposal's initial acceptance
   set.
6. **Data authority and reporting boundary:** compare an authoritative reporting projection, direct
   domain reads, and any separate deterministic operations profile. Explain how multiple listings,
   requests, viewing events, lifecycle history, Favourite signals, and Information Requests can be
   represented without disconnected fake aggregates or weakening the one-request relay fixture.
7. **Fixture and demo strategy:** recommend the smallest credible data volume and reset behavior for
   dashboard demonstration, how it coexists with the existing challenge relay fixture, and which
   claims remain synthetic. Do not change fixtures in this task.
8. **Trust and result UX:** define interpreted-query display, applied filter chips, freshness/as-of
   timestamp, result counts, inclusion/exclusion explanation where needed, stale data handling,
   zero-result recovery, pagination/result caps, and drill-down links to canonical records.
9. **Authority, privacy, and security matrix:** define agent listing assignment scope, aggregate versus
   tenant-level information, private request/contact fields, public API restrictions, query abuse or
   enumeration limits, audit expectations, and server-side enforcement. The Agent must not gain access
   merely by phrasing a broader natural-language request.
10. **Human boundary and future actions:** identify what is read-only, what may later be prepared for
    human approval, and what must remain human-only, including contact, listing status changes,
    response sending, report scheduling, export, and notification/Re-entry grant creation.
11. **Interaction with RIGHTSPOT-008 and RIGHTSPOT-009:** explain how Favourite, Information Request,
    and Viewing Request signals can form a useful funnel without making this dashboard depend on either
    unaccepted proposal or conflating passive interest with strong intent.
12. **WebMCP/Re-entry relationship:** identify optional future event or re-entry opportunities, such
    as a listing crossing a stale threshold, while preserving the dashboard as an independent direct
    WebMCP leverage path and avoiding a Core rewrite.
13. **Later implementation decomposition:** recommend the smallest serial/parallel Work Order
    sequence, exact likely write sets, shared-file conflicts, data migration/rollback boundary,
    tool-registration ownership, focused tests, browser/WebMCP evidence, clean-room reproduction, and
    stop conditions. Do not dispatch Builders or Verifiers.
14. **Alternatives and decisions required:** compare a dashboard section versus a dedicated route,
    direct reads versus a reporting projection, expanded fixture versus operations profile, manual
    filters versus Agent-only interaction, and query tools versus arbitrary SQL. Record rejected
    options and residual risks.

### Forbidden actions

- Do not implement the dashboard, routes, filters, charts, tables, WebMCP tools, tool registration,
  query parser, reporting projection, domain logic, persistence, schema, migrations, fixtures, seed
  data, styles, tests, navigation, or assets.
- Do not edit `src/`, `app/`, tests, package manifests, lockfiles, environment files, database files,
  generated output, or assets.
- Do not edit `Docs/Core/`, `Docs/Decisions/`, `Docs/00-current-status.md`, requirements, system
  design, API contracts, validation documents, `RIGHTSPOT-008`, or `RIGHTSPOT-009`.
- Do not create an ADR, implementation task, Work Order, branch, commit, push, deployment, or pull
  request from the supporting task. The main thread owns any later registration or canonical
  writeback after review.
- Do not register WebMCP tools, install WebMCP dependencies, connect a reporting/BI service, add an
  external LLM, configure credentials, or claim browser/deployment/WebMCP readiness.
- Do not invent or hard-code operational counts as if they were authoritative data. Synthetic data
  may be discussed as a future fixture strategy only.
- Do not propose arbitrary SQL execution, unrestricted database search, automatic external contact,
  automatic listing changes, silent report scheduling, or automatic notification/Re-entry grants as
  part of the initial read-first acceptance set.
- Do not expose tenant identities, contact details, private notes, or unredacted request data in an
  aggregate dashboard proposal.
- Do not treat static inspection or ordinary local tests as proof of WebMCP tool registration, Agent
  interaction, browser behavior, deployment, or external communication.

### Return gate

Return `READY_FOR_REVIEW` with the observed source identity, exact verified gaps, product thesis,
recommended route and information architecture, bounded query/metric semantics, proposed WebMCP
materiality and tool boundary, data/fixture strategy, privacy matrix, human boundary, later
implementation decomposition, verification/evidence plan, unresolved decisions, alternatives, and
explicit non-goals. Return `BLOCKED` if current authority, source identity, or available data evidence
does not permit a reliable proposal. A proposal return does not authorize implementation or canonical
writeback.

## Closure gate

Close this task only after the main thread records a review disposition. If accepted, the main thread
may create a separate durable decision record and a later bounded implementation task; those actions
must be explicitly registered and independently verified. If rejected or not planned, preserve the
reason, residual risk, and reopen condition in this task. This task itself must remain proposal-only.

## Reopen condition

Reopen this task if the dashboard becomes a primary Challenge submission path, the initial query
families expand beyond the accepted bounded ontology, the reporting authority or fixture strategy
changes, the product adds write actions or external communication, the listing lifecycle gains new
business states, or the main thread decides to make dashboard insights part of a concrete Re-entry
demonstration.
