# RightSpot — Requirements

**Role:** Product, workflow, authority, and reliability requirements  
**Status:** MVP business-rules and accepted local implementation baseline; future integration and production decisions remain open

## 1. Requirement discipline

These requirements describe the smallest ordinary application slice. They do not require a Cloud
Receiver, WebMCP, a particular Agent runtime, or a particular framework. Any requirement that
would introduce one of those dependencies must be promoted into a separate decision.

## 2. Human-facing application requirements

### RSP-APP-01 — Bounded login

The application shall provide a simple role-specific login path for one seeded tenant and one
seeded property agent. The demo may use fixed role selection rather than real passwords. There is no
registration, password recovery, social login, or organization administration in the first slice.

### RSP-APP-02 — Listing discovery

The tenant shall be able to browse three to five seeded published listings and apply basic location,
rent, size, or move-in filters sufficient to find the primary demonstration listing.

### RSP-APP-03 — Listing detail

The tenant shall be able to open a listing detail page containing synthetic images, core rental
facts, location/address presentation, and a clear Viewing Request action.

### RSP-APP-04 — Viewing Request creation

The tenant shall be able to create and revise a visible draft containing one to three ordered
preferred viewing times and an optional bounded tenant note. Submission requires at least one
preferred time.

### RSP-APP-05 — Tenant request dashboard

The tenant shall be able to see the current request, state, permitted response details, and a
tenant-safe status timeline from one place. Favourites are supporting functionality, not a primary
workflow dependency.

### RSP-APP-06 — Agent dashboard

The property agent shall be able to see an authorized request queue, basic state counts, and the
current state of assigned requests. The queue is updated by a normal read or manual refresh; no
push notification is required.

### RSP-APP-07 — Agent review workspace

The agent shall be able to inspect the authorized request, relevant listing facts, bounded synthetic
availability, and agent-only preparation notes from one management view.

### RSP-APP-08 — Response preparation and decision

The agent shall be able to start review, prepare or edit either a slot proposal or a decline
response, and send the response through a visible human action. Preparation alone shall not change
the public request outcome.

### RSP-APP-09 — Tenant-visible response state

After the agent sends a response, the tenant shall be able to see the resulting request status and
permitted slot or response details.

### RSP-APP-10 — Tenant response

For a current, unexpired proposal, the tenant shall be able to confirm or decline the viewing through
a visible normal application action. This is not a second automatic continuation requirement.

### RSP-APP-11 — Seeded visual credibility

The initial fixture shall contain enough realistic-looking synthetic listing data and media for the
application to read as a rental product without requiring live property data.

## 3. First human Happy Path

1. Tenant logs in with the seeded tenant identity.
2. Tenant searches or filters the seeded listing set.
3. Tenant opens the primary listing detail page.
4. Tenant creates and reviews a Viewing Request draft.
5. Tenant explicitly submits the request.
6. Tenant opens or refreshes the request dashboard and sees `REQUEST_SUBMITTED`.
7. Property agent signs in with the seeded agent identity and refreshes the queue.
8. Agent opens the request, starts review, reads allowed details, and checks synthetic availability.
9. Agent prepares or edits a proposal or decline response.
10. Agent sends the visible response.
11. Tenant refreshes the dashboard and sees the response.
12. If a slot was proposed, the tenant confirms or declines it and sees the terminal state.

The decline branch may end at `AGENT_DECLINED`. Later WebMCP and continuation behavior may use the
same states and surfaces, but is not a prerequisite for building them.

## 4. Primary workflow requirements

### RSP-WF-01 — Deterministic starting state

The application shall provide a resettable synthetic fixture containing three to five published
listings, at least three future slots for the primary listing, one tenant, one property agent, no
Viewing Request, empty audit history, and a new fixture generation.

### RSP-WF-02 — Tenant request draft

The tenant shall be able to inspect a listing and create or revise one visible Viewing Request draft
before submission. The draft shall require at least one preferred viewing time and shall cap the
number of alternatives and free-form text.

### RSP-WF-03 — Explicit tenant submission

Submitting a Viewing Request shall require a visible tenant action. The application shall not
silently submit a request as a side effect of browsing, preparation, page loading, or an assistant
suggestion.

### RSP-WF-04 — Authoritative request transition

The backend shall commit `REQUEST_SUBMITTED` only after validating the current tenant, published
listing version, draft state, and current request version.

### RSP-WF-05 — Agent queue projection

The property agent shall see newly submitted requests in an authorized queue projection. A
`TENANT_DRAFT` is tenant-private pre-submission work and shall not appear in the agent queue, its
counts, or direct agent request detail. The MVP uses direct reads and manual refresh; a remote
notification is not part of the application contract.

### RSP-WF-06 — Current availability review

The agent workflow shall expose bounded synthetic availability with explicit slot times and status.
The agent may prepare a proposal only from an available slot, and the send operation shall recheck
availability before holding it.

### RSP-WF-07 — Prepare before consequence

The application shall distinguish a prepared agent response from the agent's consequential human
decision. Preparation alone shall not send a response, confirm a viewing, or create a lease
commitment.

### RSP-WF-08 — Visible agent decision

The property agent shall explicitly send either a slot proposal or a decline response through the
normal UI. Once sent, the response is not editable or withdrawable in the MVP.

### RSP-WF-09 — Shared artifact continuity

Both role surfaces shall refer to one Viewing Request record and its monotonic version rather than
creating disconnected copies of the request.

### RSP-WF-10 — Bounded continuation seam

The application shall keep the tenant-to-agent handoff and later continuation boundary explicit.
Only one primary automatic continuation path is needed for a future Hackathon integration; the
tenant response remains an ordinary application action in the MVP.

### RSP-WF-11 — Single-request fixture lifecycle

The first fixture shall permit at most one Viewing Request. A submitted or terminal request cannot
be cancelled, rescheduled, reopened, or replaced until reset.

### RSP-WF-12 — Proposal expiry

A sent proposal shall carry an explicit 24-hour expiry window. Relevant reads and writes shall
evaluate expiry with the application clock and move an expired proposal to `EXPIRED`; no background
scheduler is required.

## 5. Authority and privacy requirements

### RSP-SEC-01 — Role isolation

Tenant and property-agent sessions shall resolve to separate roles and authorized projections.
Role selection in the client must never substitute for server-side authorization.

### RSP-SEC-02 — Internal note isolation

Agent-only review notes shall never be returned by tenant-facing reads or included in shared request
data visible to the tenant. Tenant-facing response notes must be stored separately.

### RSP-SEC-03 — Server-owned transitions

The client shall not choose arbitrary request states, bypass version checks, or claim that a human
decision occurred without a server-validated transition.

### RSP-SEC-04 — No consequential hidden action

Loading a page, reading a request, or preparing a response shall not make a payment, accept a lease,
sign an agreement, send an external message, or otherwise cross the defined human boundary.

### RSP-SEC-05 — Bounded data exposure

The tenant may receive only its own request and tenant-facing response fields. The agent may receive
only assigned submitted/current request facts, relevant listing facts, bounded availability, and
permitted internal notes. Pre-submission tenant drafts are not agent-visible. No credentials, private
Agent context, or real-person data may enter the domain projection.

## 6. Reliability and reproducibility requirements

### RSP-REL-01 — Resettable fixture

The primary slice shall return to the deterministic initial state without real external accounts or
data. Reset shall clear requests, preparations, notes, slots, and audit history, then increment the
fixture generation.

### RSP-REL-02 — Version-aware writes

State-changing operations shall require the current monotonic request version and reject stale
writes rather than silently overwriting newer work. Listing version is checked where a request is
created or changed.

### RSP-REL-03 — Explicit failure

Invalid role, missing request, validation failure, stale version, invalid state transition,
unavailable slot, expired proposal, and rejected human decision shall produce visible bounded
failures without stack traces or hidden fallback.

### RSP-REL-04 — Auditability

The application shall retain enough non-sensitive audit information to explain the actor role,
operation, prior and next state, request version, and human decision. Repeated idempotent commands
shall not create duplicate audit entries.

### RSP-REL-05 — Safe repeated actions

Repeated submission or the same completed decision shall not create a duplicate request, slot, or
external consequence. A conflicting action shall fail with the current state and leave the record
unchanged.

## 7. Challenge-facing requirements deferred to integration

The following are intentionally not first-phase requirements:

- genuine page-bound WebMCP registration and invocation;
- Agent continuation or page re-entry;
- Cloud Receiver delivery;
- Local Connector pairing;
- public hosting and judge clean-room access; and
- a sub-three-minute Hackathon demonstration.

They will be added only after the ordinary RightSpot workflow has a stable product and Backbone
boundary.

## 8. Remaining implementation and integration decisions

The MVP business rules and the local implementation baseline above are closed. The concrete local
application service/repository composition, SQLite snapshot persistence, bounded demo-cookie session,
ordinary HTTP/JSON transport, local audit persistence, and current accessibility/responsive baseline
are recorded in the system design, domain model, API contract, accepted ADRs, and validation evidence.
They are not open blockers for the accepted ordinary local MVP.

The remaining decisions are deliberately outside that local MVP:

- production persistence schema, migrations, backup, and data-lifecycle strategy beyond the local
  SQLite snapshot;
- provider-backed authentication and external identity mapping beyond the bounded demo session;
- whether and how to expose a development-only audit inspection surface; the current product UI does
  not expose audit records;
- future event/outbox representation and external event mapping;
- public versus internal operation exposure for future capabilities; and
- deployment, clean-room access, and final evaluator timing.

Provider-backed authentication remains separately gated by `RIGHTSPOT-006`. WebMCP, Cloud Receiver,
and any Remote Viewing/signaling capability remain subject to their deferred integration boundaries;
this section does not authorize them.
