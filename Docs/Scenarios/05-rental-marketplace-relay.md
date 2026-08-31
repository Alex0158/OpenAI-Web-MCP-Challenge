# Candidate Scenario E — Rental Marketplace Relay

**Role:** ACTIVE SHORTLIST CANDIDATE — NOT SELECTED  
**Selected as the challenge demo app:** No  
**Implementation status:** Concept only; not implemented or validated  
**Primary pattern:** Role-scoped bilateral continuation inside one marketplace  
**Last updated:** 2026-08-31

**Current disposition:** Remains in the active application shortlist alongside Sleepless Kingdom.
It is not selected, implemented, or validated; TASK-001 and a future accepted ADR remain the
selection authority.

This is a fourth application candidate for comparison. It does not select the host application,
change the Re-entry Core, or authorize implementation. The Core mechanism, protocol, authority
boundaries, and evidence gates remain controlling.

## 1. Executive summary

Rental Marketplace Relay is a two-sided rental workflow in which a tenant and a property agent
use different Agent contexts against different WebMCP surfaces of the same application. The
tenant uses the public marketplace to search listings, prepare a viewing request, and track its
status. The agent uses a management console to review incoming requests, prepare a response, and
accept or propose a viewing slot.

The important event is not a generic notification. A tenant's submitted viewing request changes
the agent's authoritative work queue. That business transition can deliver one bounded
continuation to the agent's Agent, which returns to the management console and reads the current
request. When the agent accepts or proposes a slot, a second business transition can deliver a
separate bounded continuation to the tenant's Agent, which returns to the tenant page and reads
the current appointment state.

The two parties do not share a Grant, Agent context, private notes, or credentials. Each party
has a separate role, page, WebMCP tool surface, consent decision, binding, and continuation
adapter target. The Host backend remains the authority for the shared rental request and its
state transitions; the Receiver remains the authority for future continuation delivery.

The candidate's central proposition is:

> Let each participant's Agent resume the same real-world rental workflow from its own role,
> with role-specific authority and fresh page state, when the other participant changes the
> business state.

This is a strong illustration of the Core's generality across multiple principals inside one
system. It is not a claim that rental search, matching, scheduling, or notifications are novel
by themselves.

## 2. Product thesis

Rental workflows are asynchronous and bilateral. A tenant may submit several viewing requests
and miss a response while the agent is triaging a queue, checking availability, or waiting for a
landlord instruction. Existing platforms normally notify a human and require that person to
reopen the correct page, recover the request context, determine what changed, and decide what to
do next.

This scenario treats each meaningful transition as a possible continuation point while keeping
the two parties' authority separate:

1. the tenant page exposes current listings and a bounded future re-entry offer;
2. the tenant explicitly grants only the future event it wants its Agent to handle;
3. the management page separately exposes its own role-specific offer and tools;
4. the Host backend commits the request transition and emits a signed typed event;
5. Receiver Core delivers only to the matching participant's private binding;
6. the resumed Agent returns to the canonical role-specific page;
7. the page revalidates current request state and exposes only tools valid for that role and stage;
8. preparation remains visible and consequential acceptance remains human-controlled.

The Agent is valuable because it can recover and continue a visible request, compare constraints,
and prepare a response. A deterministic notification or queue can announce that a request exists,
but it does not demonstrate the bounded context recovery, fresh WebMCP tool discovery, and
role-specific continuation that this candidate is intended to prove.

## 3. Participants and role boundaries

### 3.1 Tenant

The tenant searches published synthetic listings and works in the public marketplace. The
tenant's Agent may read listing facts, compare saved candidates, prepare a viewing request, and
prepare a response to a proposed slot. It must not accept a lease, pay a deposit, or make another
irreversible commitment without a visible tenant decision.

### 3.2 Property agent

The property agent works in an authenticated management console. The agent's Agent may read the
agent's request queue, summarize a request, compare it with availability rules, and prepare a
reply or proposed slot. It must not impersonate the agent, expose internal notes to the tenant,
or make a binding acceptance without a visible agent decision.

### 3.3 Host application and backend

The same rental application owns listings, request state, role projections, artifact revisions,
authorization, and business transitions. The backend signs Manifests and Events with its issuer
key and writes the transactional event outbox. It does not own Receiver consent, delivery
leases, or Agent activation.

### 3.4 Receiver, Connector, and Agent contexts

Each participant may have a separate Receiver Grant and a separate Local Connector/Agent Adapter
target. The Receiver routes a tenant event to a tenant binding and an agent event to an agent
binding. A Connector cannot reinterpret the event or choose another user's context. Raw managed
context locators and platform credentials remain private to the relevant adapter boundary.

## 4. Two WebMCP surfaces in one application

The public marketplace and management console may share an origin and backend, but they are
different Host page surfaces with different authenticated roles and tool policies.

### 4.1 Tenant marketplace

**Initial-stage tool roles:**

- `search_listings` — filter the synthetic inventory by bounded location, rent, size, and move-in constraints;
- `read_listing` — read the current listing and availability facts;
- `save_listing` — add one listing to the visible tenant shortlist;
- `draft_viewing_request` — create or revise a visible request draft;
- `read_reentry_offer` — read the bounded future event offer without creating authority.

**Resumed-stage tool roles:**

- `read_viewing_request_status` — read the current request, response, revision, and expiry;
- `prepare_viewing_confirmation` — prepare a visible response to an accepted or proposed slot;
- `revise_request_preferences` — revise non-consequential preferences when the current state allows it.

The resumed surface must not trust the original notification or stale tool handles. It reads the
current request and registers the tools valid for the current tenant state.

### 4.2 Agent management console

**Initial-stage tool roles:**

- `read_request_queue` — read requests assigned to the authenticated agent;
- `read_viewing_request` — read the allowed tenant request projection and current listing facts;
- `prepare_agent_response` — prepare a visible response or proposed slot;
- `read_reentry_offer` — read the future request-arrival offer without creating authority.

**Resumed-stage tool roles:**

- `read_new_viewing_request` — read the current request that caused the continuation;
- `compare_availability` — compare the request with the agent's synthetic availability records;
- `prepare_slot_proposal` — prepare a proposed viewing slot or bounded response;
- `record_agent_review_note` — create an internal, non-tenant-visible review note.

Internal notes are role-scoped data. They are never carried in an Event and are never exposed by
the tenant page.

## 5. Shared workflow record and state model

The durable shared artifact is one **Viewing Request** record. Each role sees an authorized
projection of the same record rather than a copied conversation or an Agent-owned task.

```text
TENANT_DRAFT
  -> TENANT_CONFIRMED_SUBMISSION
  -> REQUEST_SUBMITTED
  -> AGENT_REVIEWING
  -> SLOT_PROPOSED | AGENT_DECLINED
  -> TENANT_CONFIRMATION_REQUIRED
  -> VIEWING_CONFIRMED | TENANT_DECLINED | EXPIRED
```

Representative visible fields are:

- stable synthetic request identifier;
- listing identifier and current listing revision;
- tenant request preferences and artifact revision;
- agent response or proposed slot revision;
- current workflow state and deadline;
- role-specific visibility projection; and
- audit receipts for Agent preparation and human decisions.

The listing inventory, availability, identity, and payment systems are deliberately synthetic and
bounded for a challenge demo. A real property-management integration is not implied.

## 6. End-to-end bilateral concept

### Phase 0 — Independent enrollment

1. The tenant opens a listing page and the Agent reads current listing state through WebMCP.
2. The tenant prepares a visible viewing-request draft.
3. The tenant reviews and grants one exact future event, such as `VIEWING_REQUEST_ACCEPTED`, to
   the tenant's own Agent context.
4. The property agent opens the management console and grants one exact future event,
   `VIEWING_REQUEST_SUBMITTED`, to the agent's own Agent context.
5. Each Receiver Grant is bound to the relevant role, workflow, expiry, run budget, canonical
   URL, and private managed context. The Host receives only the corresponding opaque binding.

Enrollment is two separate user decisions. One participant's consent never authorizes work in the
other participant's account.

### Phase 1 — Tenant submits a request

1. The tenant Agent reads the current request draft and the page's current tool surface.
2. The tenant reviews the proposed request in the normal UI.
3. The tenant crosses the first human boundary by confirming that the request may be sent.
4. The Host backend commits `REQUEST_SUBMITTED` and its outbox intent atomically.
5. The backend signs a typed `VIEWING_REQUEST_SUBMITTED` Event for the agent's opaque binding.
6. Cloud Receiver verifies the Grant, event scope, origin, expiry, replay status, and run budget.
7. Receiver Core atomically records the accepted event, consumes the agent run, and creates one
   pending delivery. It does not call the Agent.

### Phase 2 — Agent reviews and responds

1. The agent's outbound Local Connector claims the pending delivery under a short lease.
2. The selected Agent Adapter resolves the private management context and makes one bounded
   activation attempt.
3. The agent Agent returns to the allowlisted management-console URL.
4. The page verifies the agent identity, request authorization, current revision, and current
   state, then exposes the resumed management tools.
5. The Agent reads the new request, compares synthetic availability, and prepares a visible slot
   proposal or decline response.
6. The property agent reviews the proposal and crosses the second human boundary by accepting,
   editing, or declining it.
7. The Host backend commits the new request state and signs `VIEWING_REQUEST_ACCEPTED` (or the
   selected narrower event) for the tenant's opaque binding.

### Phase 3 — Tenant receives the response

1. Cloud Receiver validates the tenant Grant and records one pending delivery for the tenant
   binding.
2. The tenant's Connector claims the delivery and its Adapter activates the tenant context.
3. The tenant Agent returns to the canonical tenant request page.
4. The page reads the current response, listing revision, slot expiry, and artifact revision.
5. The Agent prepares a visible confirmation or identifies the remaining decision.
6. The tenant crosses the final human boundary by confirming or declining the viewing.
7. The Host records the decision and a correlated receipt. Payment, lease signing, and move-in
   commitments remain outside the challenge slice.

The full bilateral story is useful for positioning, but it should not be treated as the minimum
implementation requirement. The challenge must first prove one complete relay with one event and
one resumed role; the reciprocal leg is an optional epilogue only after the primary slice is
clear and reproducible.

## 7. Recommended primary challenge slice

The safest first slice is:

```text
Tenant request confirmation
  -> Host commits REQUEST_SUBMITTED
  -> signed event to agent binding
  -> Cloud Receiver pending delivery
  -> agent Connector and Adapter activation
  -> management page re-entry
  -> fresh request/availability tools
  -> Agent prepares slot proposal
  -> property agent must approve
```

This slice proves:

- two distinct users and Agent contexts;
- a real business transition with a natural recipient;
- a shared Viewing Request artifact;
- a role-specific WebMCP tool delta;
- private binding and Receiver-owned authority;
- current-page revalidation after the session ends; and
- a visible human consequence boundary.

The agent-to-tenant acceptance relay should be added only if the primary slice passes the
three-minute clarity, adapter, privacy, and judge-reproduction gates. It is not required to
establish the Core concept and should not force payment, calendar, or landlord integrations.

## 8. Authority and privacy model

| Surface | Owns | Must not own |
|---|---|---|
| Tenant page | tenant-visible listing/request projection and tenant tools | agent internal notes, Receiver Grant, or raw Agent context |
| Agent console | agent-visible queue, availability projection, and internal notes | tenant credentials, tenant private context, or Receiver authority |
| Host backend | listing/request truth, role authorization, artifact revisions, issuer key, outbox | consent, delivery lease, or Agent activation |
| Cloud Receiver | challenge, Grant, event acceptance, replay, delivery, revocation, acknowledgement | listing matching, slot truth, or user-interface mutation |
| Local Connector | outbound claim, lease handoff, adapter dispatch, acknowledgement request | event reinterpretation, Grant issuance, or inbound public control |
| Agent Adapter | private context resolution and one activation attempt | business-state authorization or Host effect |

The two roles may refer to the same underlying request, but they do not receive the same data. The
Event contains only the bounded binding, workflow and event metadata, state version, timestamp,
and canonical URL required by the protocol. It does not contain tenant PII, internal notes, free-
form instructions, a prompt, a tool plan, or a copied artifact.

The page remains the authority after re-entry. An accepted event says that a bounded transition
was accepted for delivery; it does not authorize the Agent to mutate the request without a fresh
page read and the current role's authorization.

## 9. Manifest and event specialization

The rental application specializes the application-neutral contracts without changing them.

### 9.1 Tenant offer

The tenant page may offer a future `VIEWING_REQUEST_ACCEPTED` continuation for the current Viewing
Request. Its Manifest identifies the request workflow, canonical tenant URL, offer and Grant
expiries, one run, display reason, and the human boundary at tenant confirmation.

### 9.2 Agent offer

The management page may offer a future `VIEWING_REQUEST_SUBMITTED` continuation for the agent's
assigned queue. Its Manifest identifies the role-scoped workflow, canonical console URL, one run,
and the human boundary at agent acceptance or slot confirmation.

### 9.3 Event discipline

The event type is an allowlisted business transition, not a generic “new message” or an Agent
instruction. After re-entry, the relevant page supplies the current request, availability, and
role-specific Site Tools. If a later design needs more event types, it must add them through the
application decision and evidence gates rather than broadening one event into an unrestricted
workflow command.

## 10. Why WebMCP is materially useful

The candidate should not use WebMCP merely as a decorative wrapper around a REST notification.
The page-bound tool surface is necessary because:

- listing availability and request state can change after the original Agent turn;
- tenant and agent roles expose different projections and valid actions;
- initial and resumed stages need different tools;
- the Agent must read the current page state before preparing a response; and
- the human UI and Agent tools must share the same authorization and revision rules.

The proof must show genuine discovery and invocation on the live tenant or management page. A
server-to-server event, a stale tool list, a generic automation API, or a narrated mock does not
prove the WebMCP portion of this scenario.

## 11. Strengths

- **Natural bilateral event:** a submitted viewing request creates an obvious work item for a
  different role, not an artificial timer or self-notification.
- **Strong multi-principal demonstration:** two people use the same mechanism under different
  grants, pages, tools, and human boundaries.
- **Shared artifact continuity:** both sides act on one evolving Viewing Request rather than
  passing a copied prompt between Agents.
- **Clear WebMCP tool delta:** marketplace and management pages can expose genuinely different
  state-derived tools before and after each transition.
- **Privacy and authority are visible:** the demo can prove that an agent's internal note never
  appears in the tenant projection and that one user's grant cannot activate the other user's
  context.
- **Generalizable concept:** the mechanism can support different participant types inside one
  product without changing the Re-entry Core.

## 12. Weaknesses and risks

- **Two-sided setup cost:** two authenticated users, two Agent contexts, two grants, and possibly
  two Connectors increase demo setup and clean-room reproduction burden.
- **Identity and privacy complexity:** role projections, tenant data, agent notes, and request
  ownership need real negative tests; a synthetic happy path is not enough.
- **Scope pressure:** search, matching, scheduling, availability, messaging, payment, and lease
  execution can easily turn a mechanism proof into a full marketplace.
- **Novelty pressure:** rental listings and notifications are established product patterns. The
  claim must stay focused on consented role-scoped re-entry, not “AI rental search.”
- **Adapter dependency:** proving two real re-entry paths may require more Agent/runtime work than
  the current Core evidence supports.
- **Business and legal sensitivity:** deposits, discrimination-sensitive criteria, identity
  checks, and real property data are unnecessary risk for the challenge and should remain out of
  scope.

## 13. Kill tests and selection questions

This candidate should not be selected until the following questions have executable answers:

1. Can a clean-room judge understand the tenant-to-agent relay in the first 30 seconds and see a
   complete primary loop in less than three minutes?
2. Can the team demonstrate a real page-bound WebMCP discovery and invocation on the management
   page after the request event, rather than only showing Receiver traffic?
3. Can one negative test prove that the tenant cannot read agent internal notes and the agent
   cannot activate the tenant's private context?
4. Does Agent continuation produce materially better request reconciliation or response
   preparation than a deterministic queue plus a human notification?
5. Can the scenario run entirely on synthetic listings, identities, and availability without
   payment, external calendar, or real-person data?
6. Is the reciprocal agent-to-tenant leg worth its additional grants, adapters, and setup, or
   should the judged path stop after the agent prepares a human-approved response?
7. Can the selected continuation adapter support the required lifecycle, Browser, and genuine
   WebMCP join with evidence acceptable to a fresh evaluator?

## 14. Hard-gate assessment

The following is a preliminary hypothesis, not validation:

| Gate | Preliminary assessment | Required evidence |
|---|---|---|
| Real problem | **PLAUSIBLE** | Bounded user/problem evidence for missed or delayed rental responses |
| Intrinsic later event | **STRONG** | `VIEWING_REQUEST_SUBMITTED` or a narrower accepted event in a live workflow |
| Same artifact after return | **STRONG** | One request record with visible revision continuity for both roles |
| Page return necessary | **PLAUSIBLE** | Current request and availability must be read from the live page |
| Tool surface changes | **DESIGNABLE** | Initial and resumed role-specific tools with live discovery evidence |
| Human boundary | **STRONG** | Tenant send and agent acceptance/slot confirmation remain visible decisions |
| Synthetic/public data | **STRONG** | Deterministic reset with no real tenant or property data |
| Product layer | **STRONG** | One public marketplace surface and one authenticated management surface |
| Three-minute clarity | **RISK** | Timed clean-room rehearsal of the primary one-sided slice |
| Implementation feasibility | **RISK** | Adapter, identity, and two-role setup probe |
| WebMCP materially necessary | **PLAUSIBLE** | Fresh page-bound tools must change what the resumed Agent can do |

## 15. Scope boundary and non-goals

The challenge candidate should include only:

- one synthetic listing;
- one tenant and one property agent;
- one Viewing Request artifact;
- one primary event and one Receiver delivery;
- one Local Connector and one selected Agent Adapter for the judged path;
- one initial-stage and one resumed-stage tool delta;
- one selected role-scoped human consequence boundary (with any prerequisite submission
  confirmation kept as a normal, minimal UI step); and
- one deterministic reset and redacted evidence trace.

It should not include:

- real listings, tenant identity documents, or payment details;
- rent collection, deposit capture, lease signing, or legal advice;
- landlord, broker, calendar, messaging, or CRM integrations;
- algorithmic tenant ranking or sensitive eligibility inference;
- a general notification center or unrestricted chat system;
- multiple concurrent requests before one complete loop is proven; or
- a second Agent platform or hidden fallback transport.

## 16. Current status and next decision

This scenario is a supporting candidate only. It does not change the application-neutral Core,
the accepted authority model, or the current Cloud Receiver/Local Connector topology.

The next decision is whether this candidate or Sleepless Kingdom should be selected through
TASK-001. Both active candidates must enter the same comparative app-selection scorecard. Selection
would require a new accepted application ADR followed by domain-specific Core requirements,
role/privacy rules, WebMCP tool contracts, a selected-app implementation record, and a genuine
adapter/browser proof.

Until then, the recommended posture is:

1. preserve the full bilateral concept as the product thesis;
2. evaluate only the one-sided tenant-to-agent relay as the primary feasibility slice;
3. keep the reciprocal tenant notification as an optional epilogue; and
4. do not add rental-specific behavior to `reentry-core/` or the accepted Core documents.
