# RightSpot — Business Flow and Scenario Catalogue

**Role:** Canonical business-flow, scenario, state-transition, and acceptance authority for the
RightSpot Web application
**Status:** Accepted current-flow baseline; `F-01`–`F-06` are closed within their recorded bounded
claims, with the deterministic-reset repair recorded in `RIGHTSPOT-028`
**As of:** 2026-09-02, Europe/London
**Owner:** Main RightSpot thread

## 1. Purpose and authority

This document describes what RightSpot is supposed to do when a human operates the ordinary local
Web application. It is the single catalogue for the product's business chains: actors, entry points,
preconditions, state changes, role-specific visibility, failure boundaries, acceptance criteria, and
current implementation evidence.

It is not a replacement for the other core documents:

| Document | Owns | This catalogue does not replace it |
|---|---|---|
| [`01-product-definition.md`](01-product-definition.md) | Product thesis, value hypothesis, and scope | Product strategy and market validation |
| [`02-requirements.md`](02-requirements.md) | Requirement statements and quality requirements | Requirement numbering or prioritisation |
| [`03-system-design.md`](03-system-design.md) | Backbone, component, and authority boundaries | Internal topology decisions |
| [`04-domain-and-data-model.md`](04-domain-and-data-model.md) | Entities, invariants, and domain state rules | Persistence representation |
| [`05-api-and-integration-contracts.md`](05-api-and-integration-contracts.md) | Application operations, DTOs, and future seams | Human journey interpretation |
| [`06-validation-and-evidence.md`](06-validation-and-evidence.md) | Validation ladder and evidence discipline | The complete scenario inventory |
| [`Decisions/`](Decisions/README.md) | Accepted product and architecture decisions | New policy decisions |
| [`Tasks/`](Tasks/README.md) | Registered outcomes and lifecycle | A substitute task queue |

If a scenario in this document conflicts with an accepted ADR or an explicit requirement, the Main
thread must resolve the conflict before implementation. This document may clarify an already accepted
boundary, but it must not silently authorise a new external effect, identity policy, retention rule,
or product branch.

## 2. Product boundary

RightSpot is a bounded rental-workflow application. Its primary promise is to move one tenant
Viewing Request through an explicit tenant-to-agent workflow while preserving the current request,
role context, availability facts, and human responsibility for the consequential decision.

The current local fixture contains:

- one seeded tenant and one seeded property agent;
- three synthetic published rental listings;
- one resettable Viewing Request at most;
- three synthetic future slots for the primary demonstration listing;
- tenant-owned Favourite relations; and
- a separate, isolated Operations profile seam that is not yet a user-facing route.

The application is a stable demonstration host, not a complete commercial marketplace. Buying,
payments, lease execution, real listings, real identity, external messaging, live chat, calendar
coordination, WebMCP, Cloud Receiver, external authentication, Redis, and WebRTC media are not
prerequisites for these flows.

## 3. Actors, identity, and profile boundaries

| Actor/profile | May do | Must not do |
|---|---|---|
| Tenant | Browse published listings, manage own Favourites, create/edit/submit one request, read own response, confirm or decline own proposal | Read agent notes, other requests, unpublished catalogue records through discovery, or submit a second request |
| Property agent | Read assigned submitted/current request work, inspect assigned listing and synthetic availability, prepare and send a response, read listing-level Favourite aggregates | Read tenant identity/contact data, agent-unassigned work, tenant credentials, or use preparation as an implicit decision |
| System/application | Resolve session, validate authority and versions, persist transitions atomically, evaluate proposal expiry on relevant access, expose role-safe projections | Invent state in the UI, silently submit/send/confirm, call external services, or replace domain authority with an integration |
| Operations profile consumer | Read the explicitly authorised isolated Operations projection in tests or a future gated surface | Treat the seam as a current page/API, merge it into relay workflow truth, or infer external dashboard support |

The current session is deliberately a seeded demo session selected at the root page. It is not
provider-backed authentication. A future Clerk or other provider integration must map provider
identity to a local `AppUser`/`Actor`; it must not change the role, assignment, privacy, or state
authority defined here.

## 4. Shared state vocabulary

### 4.1 Viewing Request states

```text
TENANT_DRAFT
    -> REQUEST_SUBMITTED
    -> AGENT_REVIEWING
    -> SLOT_PROPOSED -> VIEWING_CONFIRMED
                     -> TENANT_DECLINED
                     -> EXPIRED
    -> AGENT_DECLINED
```

`AGENT_REVIEWING` may contain a prepared proposal or decline, but preparation is not a state
transition visible to the tenant. `VIEWING_CONFIRMED`, `TENANT_DECLINED`, `EXPIRED`, and
`AGENT_DECLINED` are terminal in the current slice.

### 4.2 Availability Slot states

```text
AVAILABLE -> HELD_FOR_PROPOSAL -> CONFIRMED
                         \------> AVAILABLE
```

Sending a slot proposal atomically moves a slot to `HELD_FOR_PROPOSAL`. Tenant decline or proposal
expiry releases it to `AVAILABLE`; tenant confirmation moves it to `CONFIRMED`. Preparing a response
does not reserve a slot.

### 4.3 Favourite states

```text
(no relation) -> ACTIVE -> REMOVED
                         \-> ACTIVE (explicit re-save)
```

A Favourite is passive listing interest. It never creates or changes a Viewing Request, sends a
message, grants contact consent, or creates a continuation permission. An active relation may remain
visible as `Currently unavailable` when its listing is no longer published.

### 4.4 Fixture and version identity

Every authoritative response carries the current `fixtureGeneration`. Viewing Request writes use a
monotonic request version; Favourite writes use a relation version and the `favouriteVersions` map.
Listing versions protect a tenant write from silently using changed listing facts. Reset creates a
new generation and invalidates stale pages. Repeating the same completed command is idempotent;
reusing its command identifier with different input is a conflict.

## 5. Scenario inventory and current disposition

Status values used below:

- `CLOSED_VERIFIED` — implementation and the required local evidence for the bounded claim are complete;
- `IMPLEMENTED_WITH_RESIDUAL_EVIDENCE` — the behavior exists, but one evidence branch or fixture
  limitation remains explicit;
- `OPEN_FINDING` — the intended rule and the current implementation disagree;
- `ISOLATED_SEAM_NOT_USER_FACING` — code/tests exist, but no current page/API flow is claimed;
- `GATED` — a decision or external credential/authority gate remains;
- `DEFERRED` — deliberately outside the current product slice.

| ID | Business chain | Main surface | State/effect | Current disposition |
|---|---|---|---|---|
| `RS-FLOW-01` | Establish, resolve, and end a role session | `/`, `/api/session` | Session cookie only | `CLOSED_VERIFIED` — signed-out resolution and documented local hosts are verified |
| `RS-FLOW-02` | Discover and filter published rentals | `/tenant` | Read-only listing projection | `CLOSED_VERIFIED` |
| `RS-FLOW-03` | Inspect a listing and enter a request | `/tenant/listings/:listingId` | No implicit write | `CLOSED_VERIFIED` — same-listing request notice state copy is verified by `RIGHTSPOT-026` |
| `RS-FLOW-04` | Save, remove, reload, and re-save a Favourite | Listing cards/detail, `/tenant/favourites` | Favourite `ACTIVE/REMOVED` | `IMPLEMENTED_WITH_RESIDUAL_EVIDENCE` |
| `RS-FLOW-05` | Create and revise a Viewing Request draft | Listing detail, `/tenant/requests` | `TENANT_DRAFT`, version increment | `CLOSED_VERIFIED` |
| `RS-FLOW-06` | Explicitly submit the draft | Tenant request surface | `TENANT_DRAFT` → `REQUEST_SUBMITTED` | `CLOSED_VERIFIED` |
| `RS-FLOW-07` | Expose submitted work to the assigned agent | `/agent` | Queue read only | `CLOSED_VERIFIED` — draft privacy enforced at queue and direct-detail read boundaries |
| `RS-FLOW-08` | Open an assigned request and start review | Agent queue/detail | `CLOSED_VERIFIED` — submitted work remains actionable and pre-submission drafts are non-visible |
| `RS-FLOW-09` | Prepare or revise an agent response | Agent request detail | Preparation only; remains `AGENT_REVIEWING` | `CLOSED_VERIFIED` |
| `RS-FLOW-10` | Send a slot proposal | Agent request detail | `SLOT_PROPOSED`; slot held; 24-hour window | `CLOSED_VERIFIED` |
| `RS-FLOW-11` | Send an agent decline | Agent request detail | `AGENT_DECLINED` terminal | `CLOSED_VERIFIED` — fresh isolated local browser branch verified on 2026-09-02 |
| `RS-FLOW-12` | Tenant confirms a proposal | `/tenant/requests` | `VIEWING_CONFIRMED`; slot confirmed | `CLOSED_VERIFIED` — transition and terminal response presentation verified by `RIGHTSPOT-027` |
| `RS-FLOW-13` | Tenant declines a proposal | `/tenant/requests` | `TENANT_DECLINED`; slot released | `CLOSED_VERIFIED` — transition, terminal response presentation, and fresh local mutation browser branch verified on 2026-09-02 |
| `RS-FLOW-14` | Proposal expires without a scheduler | Relevant tenant/agent read or write | `EXPIRED`; slot released | `CLOSED_VERIFIED` — transition and terminal response presentation verified by `RIGHTSPOT-027` |
| `RS-FLOW-15` | Reset and replay a deterministic fixture | Development script/test boundary | New generation; empty request/Favourites | `CLOSED_VERIFIED` — `F-06` / `RIGHTSPOT-028` repaired the CLI composition and passed focused and independent verification |
| `RS-FLOW-16` | Show privacy-preserving listing interest to an agent | `/agent` embedded section | Read-only aggregate | `CLOSED_VERIFIED` |
| `RS-FLOW-17` | Query the isolated Operations profile | Domain/persistence tests only | Projection envelope; no relay mutation | `ISOLATED_SEAM_NOT_USER_FACING` |
| `RS-FLOW-18` | Enforce role, privacy, version, and failure boundaries | All API/projection surfaces | Visible bounded error; no invalid mutation | `CLOSED_VERIFIED` for the audited role/privacy/version/failure matrix; future audits remain required |
| `RS-FLOW-19` | Information Request, external auth, WebMCP, Cloud Receiver, or Remote Viewing | Future integration | No current state effect | `DEFERRED` / `GATED` |

## 6. Canonical scenario definitions

Each scenario below is a business contract. Source paths and tests identify current evidence; they do
not change the acceptance rule.

### RS-FLOW-01 — Establish, resolve, and end a role session

**Actors:** Tenant or property agent
**Entry:** Open `/`, or revisit any role route with or without the demo cookie
**Preconditions:** None for sign-in; an active `rightspot_demo_session` is required for role surfaces

**Flow:**

1. The root shell reads `GET /api/session` and renders a signed-out, loading, active, or failure
   state.
2. The user explicitly chooses Tenant or Property agent. The server validates the role and issues a
   bounded HttpOnly, `SameSite=Lax`, path-scoped demo cookie.
3. The shell redirects to `/tenant` or `/agent`. The role page resolves the session again before
   rendering business content.
4. A matching role sees only its own navigation and surface. A wrong role sees a visible boundary
   message and no business children. A missing session receives a sign-in boundary.
5. Sign out sends `DELETE /api/session`, clears the cookie, and returns the user to a signed-out
   session surface.

**Business effect:** Session context changes; no listing, request, Favourite, slot, or audit state
changes.
**Acceptance:** Role is server-resolved; signed-out reads are `401`; wrong-role reads are `403`;
logout does not leave an authenticated role surface usable through the normal UI.
**Evidence:** `src/server/application/demo-session.ts`, `src/server/application/http.ts`,
`src/ui/shared/app-shell.tsx`, `src/ui/shared/role-page-frame.tsx`, and
`tests/application/demo-session.test.ts`.

**Boundary:** This is demo authentication, not username/password, Clerk, Gmail, registration,
recovery, organisation administration, production session security, or external identity proof.

**Disposition:** `F-02` is `CLOSED_VERIFIED`. The client repair handles the expected `401` before
optional body parsing; focused Red/Green tests, independent read-only verification, and fresh local
browser evidence confirm that the existing signed-out role-selection surface is reachable. The
separate dev-host cause of the original 127.0.0.1 reproduction was independently registered and
resolved as `F-03`/`RIGHTSPOT-024`. Neither finding is a request to add external authentication.

### RS-FLOW-02 — Discover and filter published rentals

**Actor:** Tenant
**Entry:** `/tenant` through the tenant navigation or the signed-in workspace handoff
**Preconditions:** Matching tenant session; seeded listings exist

**Flow:**

1. The page reads `GET /api/listings` and renders loading, error/retry, empty, or result state.
2. The tenant may provide any combination of bounded `area`, `maxRent`, `minSizeSqM`, and
   `availableFrom` filters.
3. The server validates an allowlisted query, returns only `PUBLISHED` listings, and returns
   listing cards with image key, title, area, rent, bedrooms, size, and available-from facts.
4. The tenant may clear filters and retry without creating a request or contacting an agent.

**Business effect:** Read-only listing projection; no state change.
**Acceptance:** Three seeded listings are visible on an unfiltered reset; filtering is truthful;
invalid values return a bounded validation error; unpublished records do not enter discovery;
tenant-only access is enforced.
**Evidence:** `src/server/application/listings.ts`, `src/ui/tenant/tenant-discovery-page.tsx`,
`tests/application/listings.test.ts`, `tests/api/listings.test.ts`.

**Boundary:** This is not live inventory, ranking, recommendation, buying, saved-search, pagination,
map search, or listing administration.

### RS-FLOW-03 — Inspect a listing and enter a request

**Actor:** Tenant
**Entry:** Select a card and open `/tenant/listings/:listingId`
**Preconditions:** Matching tenant session; the listing is currently published

**Flow:**

1. The detail surface reads the authoritative listing and the tenant's current request/Favourite
   state in parallel.
2. It renders synthetic media, address, area, rent, bedrooms, size, available-from date, and
   description.
3. If no request exists, it presents the Viewing Request draft editor. If the existing request is a
   draft for the same listing, it presents the editor for revision.
4. If a request already targets another listing or has been submitted, it explains the one-request or
   read-only boundary and links to `/tenant/requests`.
5. Browsing, loading the detail page, or loading the Favourite state never creates or submits a
   request.

**Business effect:** Read-only unless the tenant explicitly saves a draft in `RS-FLOW-05`.
**Acceptance:** Unknown/unpublished listing detail is not presented as available; listing facts come
from the server; the page exposes a clear request entry point; an existing request cannot be silently
re-targeted.
**Evidence:** `src/ui/tenant/tenant-listing-page.tsx`, `src/server/application/listings.ts`,
`tests/application/listings.test.ts`, `tests/api/listings.test.ts`.

**Boundary:** Media is local synthetic evidence. An unavailable Favourite remains on the Favourite
page but does not link back into a non-published detail page.

### RS-FLOW-04 — Save, remove, reload, and re-save a Favourite

**Actor:** Tenant; assigned agent receives only an aggregate read in the second half of the flow
**Entry:** Save control on `/tenant` or listing detail, then `/tenant/favourites`
**Preconditions:** Matching tenant session; listing is published for activation

**Flow:**

1. The tenant toggles an accessible, keyboard-operable Favourite control.
2. Save validates the current listing version and relation version, then creates or reactivates one
   `(tenantId, listingId)` relation as `ACTIVE`.
3. Remove explicitly marks the relation `REMOVED`; it does not alter a Viewing Request.
4. The Favourite page reads active relations plus `favouriteVersions`, including a removed relation's
   current version so a later re-save does not guess version `0`.
5. A changed listing is labelled `changed since saved` using the saved version/rent snapshot; it is
   not represented as a price-history system.
6. If a saved listing becomes unpublished, the relation remains visible as `Currently unavailable`
   and removable. It is excluded from `availableInterest` but included in `currentSaves`.
7. The assigned agent sees only listing-level counts in the embedded section on `/agent`; no tenant
   identity, contact value, or request signal is included.

**Business effect:** Favourite relation only; no contact, notification, request, or appointment effect.
**Acceptance:** Fresh reset supports save → reload → remove → reload → re-save; stale relation or
listing versions fail without mutation; repeated completed commands are idempotent; unpublished
relations remain removable; available versus current counts are distinct; role and portfolio
boundaries hold.
**Evidence:** `src/server/domain/favourites.ts`, `src/server/domain/favourite-projections.ts`,
`src/ui/tenant/tenant-favourites-page.tsx`, `tests/domain/favourites.test.ts`,
`tests/api/favourites.test.ts`, and the `RIGHTSPOT-020` evidence recorded in
[`00-current-status.md`](00-current-status.md).

**Residual evidence:** The normal save/remove/reload/re-save browser path passed. The unpublished
branch is covered directly and statically because the current UI has no supported visible unpublish
action. This is an evidence limitation, not permission to invent an admin status flow.

### RS-FLOW-05 — Create and revise a Viewing Request draft

**Actor:** Tenant
**Entry:** Draft editor on listing detail or `/tenant/requests`
**Preconditions:** Matching tenant session; no existing request, or an existing draft for the same
listing; listing is published

**Flow:**

1. The tenant selects one to three preferred times in strictly chronological order and may enter a
   tenant-facing note of at most 500 characters.
2. Save draft sends an explicit `CREATE_REQUEST_DRAFT` or `UPDATE_REQUEST_DRAFT` command with fixture
   generation, listing version, expected request version, and a fresh command identifier.
3. The server validates ownership, one-request-per-fixture, listing publication/version, bounded
   times, and note content before writing.
4. A successful create starts at request version `1`; an update increments the version and remains
   `TENANT_DRAFT`.
5. The tenant sees the saved draft and may revise it until submission. The agent must not treat a draft
   as incoming work.

**Business effect:** Creates or updates the single shared Viewing Request in `TENANT_DRAFT`; one
audit entry per successful write.
**Acceptance:** No duplicate request; at least one preference is required for save/submit; maximum
three preferences; ordering and note bounds are enforced; stale generation/version writes fail
without overwrite; refresh shows the authoritative draft.
**Evidence:** `src/server/domain/workflow.ts`, `src/server/application/workflow-http.ts`,
`src/ui/tenant/tenant-request-page.tsx`, `tests/domain/workflow.test.ts`,
`tests/application/workflow.test.ts`, `tests/api/workflow.test.ts`.

**Boundary:** Draft save is not contact, submission, agent notification, slot reservation, or tenant
commitment. Cancel, reschedule after submission, and a second request are out of scope; reset is the
replay mechanism.

### RS-FLOW-06 — Explicitly submit the draft

**Actor:** Tenant
**Entry:** `Submit to the agent` control on the tenant request surface
**Preconditions:** Current request is the tenant's `TENANT_DRAFT`; listing is still published at the
recorded version; current generation/version and at least one preference are available

**Flow:**

1. The page separates `Save draft` from `Submit to the agent`.
2. The submit command carries only bounded command metadata; the server derives the request and tenant
   from the current session and stored projection.
3. The backend validates role, ownership, state, listing version, fixture generation, request version,
   and draft input, then atomically commits `REQUEST_SUBMITTED`.
4. The tenant projection shows the submitted state and makes the request read-only in the MVP.
5. The agent queue becomes eligible to show the request through `RS-FLOW-07`; no external notification
   is implied.

**Business effect:** `TENANT_DRAFT` → `REQUEST_SUBMITTED`, request version increment, audit entry.
**Acceptance:** No page load, suggestion, Favourite, or preparation can submit; repeated identical
submit is idempotent; conflicting or stale submit fails without mutation; tenant sees the new state.
**Evidence:** `tests/api/workflow.test.ts`, `tests/application/workflow-views.test.ts`,
`Docs/Development/RIGHTSPOT-MVP-CLOSURE-RECORD.md`.

**Boundary:** The MVP has no tenant cancellation, retraction, reschedule, email, push notification,
calendar booking, payment, lease, or external continuation consequence.

### RS-FLOW-07 — Expose submitted work to the assigned agent

**Actor:** Property agent
**Entry:** `/agent` and `GET /api/agent/requests`
**Preconditions:** Matching agent session; a request is assigned to that agent

**Intended flow:**

1. A submitted request appears after the agent first loads or manually refreshes the queue.
2. The queue shows bounded state counts and links to the authorized request detail.
3. `REQUEST_SUBMITTED` is actionable; later states may remain visible as current/history according to
   the bounded queue view.
4. `TENANT_DRAFT` is tenant-private pre-submission work. It must not appear in the agent queue,
   counts, list, or direct request detail. A direct draft identifier should resolve as a bounded
   `NOT_FOUND`/non-visible resource rather than reveal that a private draft exists.
5. An empty queue is a normal `200` result, not a failure.

**Historical finding and disposition:** The initial audit found that `readAgentQueue` and
`readAgentProjection` returned the single stored request for the assigned agent regardless of state.
A direct probe after `CREATE_REQUEST_DRAFT` returned an agent queue item with state `TENANT_DRAFT`.
`RIGHTSPOT-025` corrected both authoritative read paths; the UI did not become the privacy boundary.

**Acceptance gate for closure:** After a fresh reset, create a tenant draft without submitting; agent
queue response has no request and all actionable counts are zero; direct agent detail for the draft is
non-visible; after explicit submit, the same request appears as `REQUEST_SUBMITTED`; later transitions
remain visible according to the documented history rule; no tenant or agent DTO leaks private fields.

**Evidence/source:** `src/server/application/workflow.ts`, `src/server/domain/projections.ts`,
`src/server/application/workflow-views.ts`, `src/ui/agent/agent-dashboard-page.tsx`,
`tests/api/agent-draft-visibility.test.ts`, the full `127/127` suite, and the direct probe recorded
during this catalogue audit.

**Disposition:** `CLOSED_VERIFIED` by `RIGHTSPOT-025` on 2026-09-02. The focused regression proves
tenant-only draft visibility, generic direct-detail non-visibility, no read mutation, and visibility
after explicit submission. Main and the formal persistent Verifier confirmed the exact
domain/application path scope; the auxiliary transient check is retained only as supplementary evidence.

### RS-FLOW-08 — Open an assigned request and start review

**Actor:** Property agent
**Entry:** Queue item → `/agent/requests/:requestId`
**Preconditions:** The request is a submitted, assigned, non-private queue item; matching agent session

**Flow:**

1. The detail page reads the server-authorized request, assigned listing facts, and relevant synthetic
   availability.
2. Opening the page is read-only and does not start review.
3. For `REQUEST_SUBMITTED`, the agent explicitly chooses `Start review`.
4. The server checks assignment, current state, fixture generation, and expected version before
   committing `AGENT_REVIEWING`.
5. The agent sees tenant request facts and listing/availability facts allowed by the agent projection;
   the tenant cannot see agent-only fields.

**Business effect:** `REQUEST_SUBMITTED` → `AGENT_REVIEWING`, request version increment, audit entry.
**Acceptance:** Wrong agent, wrong role, unknown request, stale version, and invalid state are
rejected without mutation; a read never starts review; a valid start is visible after refresh.
**Evidence:** `src/ui/agent/agent-request-page.tsx`, `src/server/application/workflow-http.ts`,
`tests/domain/workflow.test.ts`, `tests/api/workflow.test.ts`, and the primary browser closure record.

**Boundary:** A draft is non-visible under `RS-FLOW-07`; there is no automatic review, notification,
assignment reassignment, or bulk action. The non-visible queue/detail regression is part of the
`RIGHTSPOT-025` closure evidence.

### RS-FLOW-09 — Prepare or revise an agent response

**Actor:** Assigned property agent
**Entry:** Preparation panel in agent request detail
**Preconditions:** Request is `AGENT_REVIEWING`; agent has read current availability

**Flow:**

1. The agent chooses a slot proposal or an agent decline.
2. A slot proposal must reference an available slot belonging to the requested listing. A decline may
   include a bounded tenant-facing note.
3. The agent may add a bounded internal review note. It is stored only in the agent projection.
4. The server validates the current request version, assignment, response kind, slot/listing match,
   and note bounds.
5. Preparation replaces prior preparation and remains `AGENT_REVIEWING`; it does not hold a slot,
   contact the tenant, or expose the response to the tenant.

**Business effect:** Request version increment and preparation/audit continuity; no public state
consequence.
**Acceptance:** A prepared response is visibly distinct from a sent response; unavailable or foreign
slots fail; tenant projection excludes preparation and internal notes; repeated stale preparation does
not overwrite current work.
**Evidence:** `src/server/domain/workflow.ts`, `src/ui/agent/agent-request-page.tsx`,
`tests/domain/workflow.test.ts`, `tests/application/workflow-views.test.ts`,
`tests/api/workflow.test.ts`.

**Boundary:** Preparation is not approval, reservation, notification, or an automatic send.

### RS-FLOW-10 — Send a slot proposal

**Actor:** Assigned property agent
**Entry:** Explicit `Send response to tenant` control
**Preconditions:** Current request is `AGENT_REVIEWING`; a valid slot proposal is prepared; current
slot is still `AVAILABLE`; generation/version match

**Flow:**

1. The agent reviews the exact tenant-facing response shown in the consequence panel.
2. The agent explicitly sends it. The server derives the response kind from stored preparation rather
   than trusting a client-supplied state or kind.
3. The send operation rechecks slot ownership, listing identity, current request version, and slot
   availability in one authoritative transaction.
4. It records the sent proposal, holds the slot, sets `proposalExpiresAt` to send time plus 24 hours,
   and commits `SLOT_PROPOSED`.
5. The tenant request dashboard displays the proposal and the permitted confirm/decline actions.

**Business effect:** `AGENT_REVIEWING` → `SLOT_PROPOSED`; slot `AVAILABLE` → `HELD_FOR_PROPOSAL`;
request version and audit increment.
**Acceptance:** Send is visible and non-automatic; a stale/unavailable slot fails without choosing a
different slot; tenant sees only the sent response; repeating the same completed send is idempotent;
the agent cannot edit or withdraw the sent response in this slice.
**Evidence:** `src/server/application/workflow-http.ts`, `src/server/domain/workflow.ts`,
`tests/api/workflow.test.ts`, `Docs/Development/RIGHTSPOT-MVP-CLOSURE-RECORD.md`, and primary browser
evidence.

**Boundary:** No email, push, calendar invite, payment, lease, or Cloud Receiver delivery is implied.

### RS-FLOW-11 — Send an agent decline

**Actor:** Assigned property agent
**Entry:** Explicit send control after an `AGENT_DECLINE` preparation
**Preconditions:** `AGENT_REVIEWING`; a valid decline is prepared; current version matches

**Flow:**

1. The agent reviews the bounded tenant-facing decline note and the internal note separately.
2. The agent explicitly sends the decline.
3. The server commits `AGENT_DECLINED` and exposes only the tenant-facing response to the tenant.

**Business effect:** `AGENT_REVIEWING` → `AGENT_DECLINED`, request version and audit increment; no
slot is held.
**Acceptance:** Decline is terminal; internal note never crosses the projection boundary; no proposal
or slot side effect is manufactured; invalid/stale send fails without mutation.
**Evidence:** `tests/api/workflow.test.ts`, `tests/domain/workflow.test.ts`, agent/tenant DTO
projection tests, and a fresh isolated local browser walkthrough on 2026-09-02. The walkthrough
submitted a real tenant request, moved it through agent review and decline preparation, explicitly
sent the decline, and then re-authenticated as the tenant. The agent saw a read-only `Declined`
outcome; the tenant saw `Agent Declined` and only the tenant-facing note, with no tenant action
remaining. The internal note did not cross the projection boundary, no slot was held, and no browser
application error was observed.

**Evidence boundary:** This verifies the ordinary local browser branch only. It does not claim external
notification, deployment, production concurrency, or any deferred integration.

### RS-FLOW-12 — Tenant confirms a proposal

**Actor:** Tenant
**Entry:** Confirm control on `/tenant/requests`
**Preconditions:** Own request is `SLOT_PROPOSED`; proposal is unexpired; referenced slot is still held
by this request; generation/version match

**Flow:**

1. The tenant reads the current request and sees the agent's permitted response and expiry context.
2. The tenant explicitly chooses confirm.
3. The server rechecks ownership, state, deadline, held-slot identity, generation, and request version.
4. It commits `VIEWING_CONFIRMED` and changes the slot to `CONFIRMED`.
5. The tenant sees the terminal state; the agent's read reflects the same authoritative state.

**Business effect:** `SLOT_PROPOSED` → `VIEWING_CONFIRMED`; slot held → confirmed; request version and
audit increment.
**Acceptance:** Only the tenant can confirm; expired, stale, wrong-slot, terminal, or wrong-role
actions fail without mutation; the browser flow displays the final result.
**Evidence:** `src/server/domain/workflow.ts`, `src/ui/tenant/tenant-request-page.tsx`,
`tests/api/workflow.test.ts`, `tests/domain/workflow.test.ts`, and `RS-WO-002-15` browser evidence.

**Presentation rule:** Once the transition is terminal, the retained response is historical. The
tenant response card shows a recorded outcome rather than an actionable proposal or an active
deadline; this bounded presentation repair is verified in `RIGHTSPOT-027`.

**Boundary:** Confirmation is a viewing record only. It is not a booking payment, lease, calendar
reservation outside the local slot record, or guaranteed real-world appointment.

### RS-FLOW-13 — Tenant declines a proposal

**Actor:** Tenant
**Entry:** Decline control on `/tenant/requests`
**Preconditions:** Own request is `SLOT_PROPOSED`; current version and generation match

**Flow:**

1. The tenant explicitly chooses decline.
2. The server validates ownership, state, current version, and proposal/slot relationship.
3. It commits `TENANT_DECLINED` and releases the held slot.
4. The tenant sees the terminal state; the agent does not receive an external notification in this
   slice but reads the same state on refresh.

**Business effect:** `SLOT_PROPOSED` → `TENANT_DECLINED`; slot held → available; request version and
audit increment.
**Acceptance:** Decline is terminal; slot release is atomic; a repeat or stale action does not create
a second audit entry or alter a terminal state.
**Evidence:** `tests/api/workflow.test.ts`, `tests/domain/workflow.test.ts`, tenant request UI
decision handling, and a fresh isolated local browser walkthrough on 2026-09-02. The walkthrough
sent a real slot proposal, had the tenant explicitly decline it, and then read the request back as
the property agent. The tenant saw `Tenant Declined` with no remaining action and a version-6 timeline;
the agent saw the terminal state and the previously held slot as `Available`.

**Presentation rule:** The retained slot proposal may remain visible as history, but a terminal
`TENANT_DECLINED` request is not labelled actionable and does not retain an active `Respond by` deadline;
this bounded presentation repair is verified in `RIGHTSPOT-027`.

**Evidence boundary:** This verifies the ordinary local browser branch and slot-release projection only.
It does not claim external notification, deployment, production concurrency, or any deferred integration.

### RS-FLOW-14 — Proposal expiry without a scheduler

**Actor:** System/application clock evaluation
**Entry:** Relevant tenant or agent read/write after `proposalExpiresAt`
**Preconditions:** Request is `SLOT_PROPOSED`; injected/current application time is at or after its
24-hour deadline

**Flow:**

1. A relevant read or write evaluates the deadline before exposing or applying the next operation.
2. If expired, the application commits `EXPIRED`, releases the held slot, increments request version,
   and appends a bounded expiry audit entry.
3. No background scheduler, notification worker, or external clock service is required.
4. Subsequent confirm/decline operations fail because the request is terminal.

**Business effect:** `SLOT_PROPOSED` → `EXPIRED`; slot held → available.
**Acceptance:** Expiry is deterministic under an injected clock; it is persisted once; a normal read
does not mutate when the proposal is still current; no stale confirm can succeed after expiry.
**Evidence:** `src/server/domain/workflow.ts`, `src/server/persistence/workflow-store.ts`,
`tests/application/workflow-views.test.ts`, `tests/api/workflow.test.ts`.

**Presentation rule:** An expired retained proposal is a closed historical outcome. The tenant card
does not show `Action needed` or a past `Respond by` deadline; this bounded presentation repair is
verified in `RIGHTSPOT-027`.

**Residual evidence:** Direct/application/API expiry evidence exists. The product does not claim
real-time expiry notification or a scheduler.

### RS-FLOW-15 — Reset and replay a deterministic fixture

**Actor:** Development/test operator
**Entry:** `npm run db:reset` or test fixture construction; no current public reset page/API
**Preconditions:** Local development authority and an intentionally disposable environment

**Flow:**

1. Reset restores three synthetic published listings, primary-listing slots, one tenant, one agent,
   no Viewing Request, empty Favourites, empty audit, and a new fixture generation.
2. Existing browser pages carrying the prior generation become stale and cannot silently write into the
   new fixture.
3. The operator replays the primary happy path from `RS-FLOW-02` through `RS-FLOW-12`.

**Business effect:** Development state is replaced by a deterministic synthetic baseline.
**Acceptance:** New generation is visible; no real data is touched; stale commands fail; reset is not
presented as a production data-management action.
**Evidence:** `src/server/domain/workflow.ts`, `src/server/persistence/reset.ts`,
`scripts/reset-db.ts`, persistence/application tests, and the closure records.

**Boundary:** No public admin CRUD, deletion/retention policy, archive workflow, production migration,
or real-user reset is included.

**Historical finding (closed):** The application-layer reset authority was implemented, but the
documented CLI previously called the foundation-only `resetFoundationDatabase` helper. In an
isolated stateful probe, the first CLI reset left a real `TENANT_DRAFT` request and Favourite in
place; a second reset desynchronised foundation metadata and the workflow snapshot and made the
application fail to reopen. `F-06` was registered as `RIGHTSPOT-028` / `RS-WO-028-01` and repaired
by composing the existing `WorkflowApplication.reset` authority. The focused regression and
frozen-source independent verification passed, including repeated reset/reopen behavior.

**Implemented repair boundary:** The CLI now calls the existing `WorkflowApplication.reset` authority
and closes it safely; the focused child-process regression proves fresh, stateful, and repeated reset
behavior. `resetFoundationDatabase` remains foundation-only. No arbitrary database recovery was
added, and the workflow state machine, snapshot schema, and public routes were not changed.

### RS-FLOW-16 — Show privacy-preserving listing interest to an agent

**Actors:** Tenant creates the source Favourite; assigned agent reads the aggregate
**Entry:** Agent dashboard's `Listing interest` section and `GET /api/agent/listing-interest`
**Preconditions:** Agent session; Favourite relation exists or the listing set is empty

**Flow:**

1. The agent reads listing-level `currentSaves` and `availableInterest` for assigned listings.
2. `currentSaves` includes active saves regardless of publication; `availableInterest` includes only
   active saves on published listings.
3. The section explicitly says it is separate from the Viewing Request queue.
4. No tenant row, identity, contact value, Favourite timestamp, or request state is returned.

**Business effect:** Read-only projection; no workflow mutation.
**Acceptance:** Assigned portfolio isolation holds; unpublished/current versus published/available
semantics are distinct; empty results are explicit; public tenant surfaces do not show aggregate
interest.
**Evidence:** `src/server/domain/favourite-projections.ts`, `src/ui/agent/agent-listing-interest.tsx`,
`tests/domain/favourites.test.ts`, `tests/api/favourites.test.ts`, and `tests/ui/agent-listing-interest.test.ts`.

**Boundary:** No separate agent route, analytics history, charts, exports, notifications, tenant
matching, or contact request is part of this flow.

### RS-FLOW-17 — Query the isolated Operations profile

**Actor:** Assigned agent through a future gated consumer; currently tests and domain/persistence only
**Entry:** No current page or HTTP route
**Preconditions:** Operations profile authority, assignment, query bounds, and freshness envelope

**Flow:**

1. The Operations profile validates its own schema, fixture metadata, timezone, assignment, and query
   bounds.
2. It can project bounded upcoming viewings or a listing pipeline with explicit `asOf`, `dataAsOf`,
   freshness, counts, and truncation metadata.
3. It does not mutate the relay `WorkflowState`, create a request, change a slot, expose Favourite
   identity, or become the source for the current agent queue.

**Business effect:** None on the current user-facing relay flow.
**Acceptance:** Domain/persistence tests prove the projection envelope, isolation, filters, caps, and
empty states; no page/API/deployment claim is made until a separate product decision and route task
exists.
**Evidence:** `src/server/domain/operations-profile*.ts`, `src/server/persistence/operations-store.ts`,
`tests/domain/operations-profile*.test.ts`, `tests/domain/operations-projection.test.ts`, and
`tests/persistence/operations-store.test.ts`.

**Boundary:** This is not yet an Operations dashboard, listing CRUD, status editor, CRM, calendar,
or WebMCP surface.

### RS-FLOW-18 — Enforce role, privacy, version, and failure boundaries

This is a cross-cutting acceptance chain rather than a separate page. Every read/write must satisfy
the following matrix:

| Boundary | Expected behavior |
|---|---|
| Missing session | `401 UNAUTHENTICATED`; no business projection |
| Wrong role | `403 FORBIDDEN`; no role-specific child action |
| Wrong tenant/agent assignment | Non-visible or `403` according to the resource contract; no data leak |
| Unknown listing/request | Bounded `404 NOT_FOUND`; no fake success |
| Invalid body/query/identifier | `400 VALIDATION_FAILED`; no mutation |
| Stale request/listing/Favourite version | `409 STALE_VERSION`; current state remains authoritative |
| Stale fixture generation | `409 FIXTURE_GENERATION_CONFLICT`; reset state is not overwritten |
| Invalid transition | `409 INVALID_TRANSITION` or the documented domain error; no state jump |
| Slot no longer available | `409 SLOT_UNAVAILABLE`; no alternate slot chosen silently |
| Expired proposal | `409 EXPIRED`; no confirm/decline after terminal expiry |
| Persistence failure | `503 PERSISTENCE_ERROR`; no false success |
| Tenant projection | Excludes internal review note, prepared response, actor IDs, and assignment internals |
| Agent projection | Excludes tenant identity/contact credentials and unrelated portfolio data |
| Successful write | One authoritative state/version result and one audit fact; command retry is idempotent |

The former draft-visibility finding was closed by `RIGHTSPOT-025` with regression coverage for both
queue and direct detail at the authoritative read boundary. This matrix remains a recurring audit
obligation; its closure does not imply external-authentication, deployment, or production-readiness
evidence.

### RS-FLOW-19 — Deferred and gated product branches

The following are deliberately named so they cannot be mistaken for missing links in the current
ordinary application flow:

| Branch | Disposition and re-entry condition |
|---|---|
| Information Request/contact preference | `DEFERRED`; requires an owner-approved PII, consent, retention, erasure, encryption, and agent-access decision before any field or route is added |
| Username/password or Clerk/Gmail authentication | `GATED`; requires external credentials and provider-boundary implementation task; demo session remains the current local contract |
| WebMCP capability registration/invocation | `DEFERRED`; only after normal UI/API flow is coherent and a separate integration acceptance claim is defined |
| Cloud Receiver delivery/continuation | `DEFERRED`; an adapter may relay a RightSpot-owned event but cannot own request state or human decisions |
| WebRTC/Remote Viewing | `DEFERRED`; a future media/signaling session must remain separate from the Viewing Request state machine |
| Live chat, email, push, calendar, payment, lease, buying, and listing CRUD | `DEFERRED`; none is a fallback for a missing current flow |

## 7. Canonical transition matrix

The following table is the compact state authority used by all scenario audits.

| Current request state | Actor/action | Required checks | Next state | Slot effect |
|---|---|---|---|---|
| None | Tenant creates draft | Own tenant, published listing/version, no existing request, valid 1–3 times | `TENANT_DRAFT` | None |
| `TENANT_DRAFT` | Tenant updates draft | Own request, same listing, current request/listing/generation versions, valid input | `TENANT_DRAFT` | None |
| `TENANT_DRAFT` | Tenant submits | Own draft, published/current listing, valid preference, current versions | `REQUEST_SUBMITTED` | None |
| `REQUEST_SUBMITTED` | Assigned agent starts review | Assigned agent, current request/generation versions | `AGENT_REVIEWING` | None |
| `AGENT_REVIEWING` | Assigned agent prepares proposal/decline | Assigned agent, bounded response, available matching slot if proposal | `AGENT_REVIEWING` | No reservation |
| `AGENT_REVIEWING` | Assigned agent sends proposal | Prepared matching response, available slot, current versions | `SLOT_PROPOSED` | Available → held |
| `AGENT_REVIEWING` | Assigned agent sends decline | Prepared decline, current versions | `AGENT_DECLINED` | None |
| `SLOT_PROPOSED` | Tenant confirms | Own request, unexpired, slot held by request, current versions | `VIEWING_CONFIRMED` | Held → confirmed |
| `SLOT_PROPOSED` | Tenant declines | Own request, current versions | `TENANT_DECLINED` | Held → available |
| `SLOT_PROPOSED` | Application evaluates expiry | Current time at/after deadline | `EXPIRED` | Held → available |
| Any terminal state | Any workflow transition | No outgoing transition is legal in this slice | Same terminal state | No change |

For each successful state-changing operation, the implementation must increment the request version
once, append one bounded audit entry, and persist the resulting authoritative state atomically.
Preparation is the only successful request operation in the table that intentionally leaves the
business state at `AGENT_REVIEWING`.

## 8. Role surface and entry-point matrix

| Surface | Role | User-visible purpose | Entry status | Backing contract |
|---|---|---|---|---|
| `/` | Signed out / either | Session selection and role handoff | `F-02` and `F-03` closed and browser-verified | `GET/POST/DELETE /api/session` |
| `/tenant` | Tenant | Published listing discovery and filters | Available | `GET /api/listings`; Favourite save/read |
| `/tenant/listings/:listingId` | Tenant | Listing facts/media, Favourite, draft entry | Available for published records | `GET /api/listings/:listingId`; tenant request reads/writes |
| `/tenant/favourites` | Tenant | Active and unavailable saved listing records | Available | `GET/POST/DELETE /api/tenant/favourites*` |
| `/tenant/requests` | Tenant | Current request, timeline, response, confirm/decline | Available | `GET/PATCH/POST /api/tenant/request*` |
| `/agent` | Property agent | Request queue plus embedded listing-interest projection | Available | `GET /api/agent/requests`; `GET /api/agent/listing-interest` |
| `/agent/requests/:requestId` | Property agent | Request facts, availability, review, prepare, send | Available for visible assigned work | Agent request APIs |
| Operations dashboard | Property agent | Future operations queries | Not implemented | Isolated Operations domain only |
| Information Request page | Tenant/agent | Contact enquiry | Not implemented by decision | `RIGHTSPOT-009` deferred |
| Listing administration | Property agent | CRUD/status changes | Not implemented by decision | No current route/API |

The agent listing-interest projection is intentionally a section of `/agent`, not a separate page.
The Operations seam and deferred Information Request are not broken navigation links; they are
explicitly non-user-facing or deferred boundaries.

## 9. Current implementation coverage matrix

This matrix is the starting point for the next cross-layer audit. `Implemented` means source code is
present, not that every evidence branch is closed.

| Flow | Domain/application | UI/API | Tests/evidence | Residual or next action |
|---|---|---|---|---|
| `RS-FLOW-01` | Implemented | Implemented and verified | Session/config TDD evidence plus fresh browser evidence for `F-02`/`F-03` | External auth remains gated |
| `RS-FLOW-02` | Implemented | Implemented | Listing application/API and browser closure evidence | No live inventory claim |
| `RS-FLOW-03` | Implemented | Implemented and verified | Listing/API/UI source and browser evidence; `RIGHTSPOT-026` exact-path verification | Published-only detail remains intentional |
| `RS-FLOW-04` | Implemented | Implemented | Domain/API/UI tests; save cycle browser evidence | Unpublish path lacks a user-facing admin trigger |
| `RS-FLOW-05` | Implemented | Implemented | Domain/application/API/UI tests and browser evidence | One request per reset remains bounded |
| `RS-FLOW-06` | Implemented | Implemented | API/domain and browser evidence | No external notification claim |
| `RS-FLOW-07` | Implemented and verified | Implemented and verified | `RIGHTSPOT-025` focused regression, full suite, formal persistent verification, and direct source review | Re-check on the next cross-layer audit |
| `RS-FLOW-08` | Implemented for submitted requests | Implemented | Domain/API/browser primary path plus `RIGHTSPOT-025` draft boundary regression | No current defect; keep submitted-request review path bounded |
| `RS-FLOW-09` | Implemented | Implemented | Domain/application/API/UI tests and browser evidence | No automatic send claim |
| `RS-FLOW-10` | Implemented | Implemented | Domain/API and primary browser evidence | No delivery provider claim |
| `RS-FLOW-11` | Implemented | Implemented | Direct/domain/API and fresh isolated local browser evidence | No external notification or deployment claim |
| `RS-FLOW-12` | Implemented and verified | Implemented and verified | Domain/API, primary browser, and `RIGHTSPOT-027` state-matrix evidence | No booking/payment or real-world appointment claim |
| `RS-FLOW-13` | Implemented and verified | Implemented and verified | Direct/domain/API, `RIGHTSPOT-027` state-matrix, and fresh isolated local browser evidence | No external notification or deployment claim |
| `RS-FLOW-14` | Implemented and verified | Implemented indirectly on reads/writes and verified | Direct/application/API and `RIGHTSPOT-027` state-matrix evidence | No scheduler/notification claim |
| `RS-FLOW-15` | Implemented in application authority and CLI composition | Development boundary only | Focused child-process regression, full suite, and frozen-source independent verification for `F-06` / `RIGHTSPOT-028` | No public reset route; arbitrary corrupt-database salvage remains unclaimed |
| `RS-FLOW-16` | Implemented | Implemented on `/agent` | Domain/API/UI and browser aggregate evidence | No analytics/history claim |
| `RS-FLOW-17` | Implemented seam | No current route | Domain/persistence tests | Separate authority/route decision required |
| `RS-FLOW-18` | Implemented and verified for audited boundaries | Implemented and verified | Broad negative tests plus formal `RIGHTSPOT-025` F-01 and browser `F-02`/`F-03` evidence | Re-check on the next cross-layer audit; no production-readiness claim |
| `RS-FLOW-19` | Deliberately absent | Deliberately absent | ADR/task boundaries | Do not use fallback implementations |

## 10. Open findings and change-control rules

### F-01 — Agent can read a tenant draft before submission (closed)

**Severity:** High for workflow/privacy correctness; bounded local scope
**Reproduction:** On a fresh `WorkflowApplication`, issue `CREATE_REQUEST_DRAFT` as the tenant and
then call `readAgentQueue` as the agent. The returned projection contains the request with
`TENANT_DRAFT`; the same underlying projection is also available through direct agent detail.
**Expected:** Draft remains tenant-private until explicit submission. Queue and direct detail are
non-visible; after submission the request appears as `REQUEST_SUBMITTED`.
**Actual bounded repair:** `RIGHTSPOT-025` filtered the agent queue and agent detail at the
authoritative application/domain read boundary. It did not alter the request state machine,
assignment model, tenant projection, DTO shape, or UI-only behavior. Its focused regression covers
both read paths, no mutation, and post-submission visibility.

**Disposition:** `CLOSED_VERIFIED` by `RIGHTSPOT-025` on 2026-09-02. Main ran the Red regression,
the smallest Green repair, the full direct suite `127/127`, typecheck, production build, and live
loopback smoke. Formal persistent Verifier task `01a06098-b2d3-7262-ae61-5701a463a976` returned
`PASS` with focused `2/2`, full `127/127`, typecheck, exact-path review, and no mutation. The Task
File records the complete evidence and reopen conditions.
**Not authorised by this finding:** changing the one-request rule, adding notifications, exposing
tenant identity, or redesigning the agent queue.

### F-02 — Signed-out root remains in loading state

**Severity:** High for entry-flow continuity; bounded local scope
**Reproduction:** In a fresh isolated browser tab with no demo-session cookie, open `/` against the
current local server. The server logs `GET /api/session` with HTTP `401`; direct HTTP reads return the
bounded `UNAUTHENTICATED` JSON response immediately. After more than two seconds, the rendered root
still shows `Checking your demo session`, with no role-selection buttons or signed-out recovery action.
**Expected:** The known unauthenticated response settles the existing shell into `Start with a bounded
role`, exposing the Tenant and Property agent actions. It must not create a session, infer a role, or
silently retry.
**Likely bounded repair:** Handle the expected `401` before optional error-body parsing in the shared
session-read helper and add a focused regression that models an unavailable/malformed `401` body. Then
rerun fresh browser evidence for signed-out entry and both role handoffs. Do not add an arbitrary
timeout, watchdog, middleware, or external authentication fallback.
**Evidence:** `src/ui/shared/app-shell.tsx`, `src/ui/shared/session-api.ts`,
`src/ui/shared/demo-session-panel.tsx`, direct `curl` to `/api/session`, the local server log, and the
fresh browser render captured during the current audit.
**Not authorised by this finding:** changing the server session contract, cookie policy, role
authorization, workflow/listing state, post-login destination, or external-auth decision.

**Disposition:** `CLOSED_VERIFIED` by `RIGHTSPOT-023` on 2026-09-02. The repair is integrated in the
canonical Main Worktree and its current evidence is recorded in the Task File.

### F-03 — Documented 127.0.0.1 development host does not hydrate

**Severity:** High for the local demo runtime at the project's loopback URL; no production impact
is claimed
**Reproduction:** Start the pinned Node `v24.20.0` Next.js dev server on port `3100`, open a fresh
tab at `http://127.0.0.1:3100/`, and wait more than four seconds. The server-rendered shell remains
on `Checking your demo session`, no `/api/session` follow-up is logged, and Next.js reports that its
`/_next/hmr` development resource was blocked for source host `127.0.0.1`. The same source settles at
`http://localhost:3100/`, and the production build settles at `http://127.0.0.1:3101/`.
**Expected:** The documented local loopback host loads the existing client runtime, resolves the
existing signed-out session state, and exposes the existing Tenant and Property agent actions.
**Likely bounded repair:** Add the exact `127.0.0.1` value to Next.js `allowedDevOrigins`, with a
focused config regression and fresh runtime evidence. Do not add arbitrary origins, production CORS,
proxy behavior, timeout, retry, or client fallback.
**Evidence:** pinned dev-server output, fresh 127.0.0.1 and localhost browser renders, production
build browser render, and `next.config.ts`.
**Not authorised by this finding:** changing session/API behavior, cookie policy, workflow/listing
state, external authentication, deployment, or any host outside the local loopback boundary.

**Disposition:** `CLOSED_VERIFIED` by `RIGHTSPOT-024` on 2026-09-02. The exact Next.js
`allowedDevOrigins` configuration, focused test, clean production build, independent path-scoped
verification, and fresh loopback browser walkthrough are recorded in the Task File.

### F-04 — Same-listing request notice is ungrammatical and state-inaccurate

**Severity:** P2 for judge-facing UI clarity and truthful state communication; no workflow privacy
impact is claimed
**Reproduction:** On the current authenticated tenant listing detail for a listing with the same
non-draft request, the rendered heading is `This listing already has a request submitted request`.
The component interpolates the lower-case state label between a fixed article and noun. Its supporting
copy also says `The submitted request is read-only here` for every non-draft state, including review,
proposal, confirmed, declined, and expired states.
**Expected:** The existing notice is grammatical and identifies the current request state accurately
for every accepted non-draft state, while retaining the one-request/read-only explanation and the
`/tenant/requests` handoff.
**Disposition:** `CLOSED_VERIFIED` through `RIGHTSPOT-026`. The presentation-only repair passed focused
`2/2`, full direct `129/129`, typecheck, build, live browser evidence, and independent persistent
verification; the state machine, API, DTO, persistence, role boundary, and Favourite behavior remained
out of scope.
The independent verification was performed by persistent supporting task
`01a060a8-6f2d-7141-98d0-385483a9104f` against the frozen exact-path candidate; its only noted build
side-effect was tool-maintained `next-env.d.ts` normalization back to the identical HEAD content, with
no residual diff.

### F-05 — Terminal Viewing Request response remains visually actionable

**Severity:** P2 for tenant action clarity and judge-facing workflow truthfulness; no workflow,
projection, privacy, or slot-transition defect is claimed
**Reproduction:** A retained `SLOT_PROPOSAL` response is returned on the tenant request dashboard
after the authoritative request reaches `VIEWING_CONFIRMED`, `TENANT_DECLINED`, or `EXPIRED`. The
server/domain/application path intentionally retains the response and (for the proposal) its expiry
context so the tenant can understand the history. `TenantResponse` currently derives its badge and
deadline solely from `response.kind`, so it renders `Action needed` and `Respond by` for all retained
slot proposals. The parent dashboard simultaneously renders a no-action message for these terminal
states; for `EXPIRED`, the deadline is already past.
**Expected:** Only an unexpired `SLOT_PROPOSED` request shows actionable wording and `Respond by`.
`VIEWING_CONFIRMED`, `TENANT_DECLINED`, and `EXPIRED` show a recorded/closed outcome without an
active deadline; `AGENT_DECLINED` remains a completed agent response. Historical slot/note data may
remain visible, but the card must not imply that a tenant can still confirm or decline.
**Evidence:** Current `workflow.ts` transition semantics, `projections.ts` tenant DTO mapping, and
`tenant-request-page.tsx` response rendering were inspected together; the mismatch is also covered
by the focused Red requirement in `RIGHTSPOT-027`.
**Disposition:** `CLOSED_VERIFIED`, resolved by bounded presentation-only `RIGHTSPOT-027` / `RS-WO-027-01`.
The persistent Builder and independent Verifier both stayed within the declared two-path candidate;
focused `3/3`, relevant `48/48`, full `132/132`, typecheck, production build, scope/hash, and safe
browser smoke all passed. The Task
forbids workflow, API, DTO, persistence, role/privacy, auth, shared CSS, and external-integration changes.

### F-06 — Documented reset command previously bypassed the full workflow fixture reset

**Severity:** P1 for local demo reproducibility, stateful test isolation, and persistence integrity;
no production impact is claimed.
**Historical reproduction:** In an isolated disposable database, a real `TENANT_DRAFT` request and one
Favourite were created through `WorkflowApplication`. The pre-repair `npm run db:reset` command was
run once: it reported
generation `1`, but the request and Favourite remain. Run it again: it reports generation `2`, while
the workflow snapshot remains at generation `1` with the same business state. Reopening the
application then throws `WorkflowPersistenceError` because foundation metadata and the workflow
snapshot no longer share the same generation identity.
**Root cause:** `scripts/reset-db.ts` calls `resetFoundationDatabase` from
`src/server/persistence/reset.ts`. That helper intentionally resets foundation metadata only. The
existing `WorkflowApplication.reset` → `WorkflowStore.reset` path already owns the full atomic
workflow-fixture reset but is not used by the CLI.
**Accepted contract / result:** `npm run db:reset` invokes the existing full workflow reset authority, clears the
disposable request/Favourite/audit/processed-command state, restores deterministic listings and slots,
writes matching metadata/snapshot generation, and leaves the database reopenable after repeated
resets. Existing stale-generation and persistence-failure boundaries remain visible.
**Disposition:** `CLOSED_VERIFIED`; `RIGHTSPOT-028` / `RS-WO-028-01` repaired the CLI composition and
passed Main Red→Green checks plus persistent frozen-source independent verification at integrated
commit `b2c1682a34a395ff9471f4338b213a0ede938134`. No automatic salvage of an already-corrupt
arbitrary database is authorized.
**Not authorised by this finding:** broadening `resetFoundationDatabase`, changing
`WorkflowStore.reset`, altering fixture contents or generation semantics, adding a reset API/page,
changing workflow/UI/auth behavior, or introducing WebMCP, Cloud Receiver, WebRTC, Redis, external
authentication, or deployment behavior.

No other implementation gap discovered in this documentation audit should be promoted to a product
defect without reproducing it against current source, tests, or runtime. `F-01`–`F-06` are closed
within their bounded claims and remain separate from deferred integrations. The next fresh audit is
required to re-check the full chain against current source, tests, and runtime.
A future audit must classify each new observation as:

1. intended behavior already accepted by an ADR or this catalogue;
2. evidence gap with implementation unchanged;
3. bounded implementation defect requiring a registered repair; or
4. deferred/gated behavior that must not be implemented opportunistically.

## 11. Flow-audit acceptance procedure

Before declaring a scenario closed, the Main thread or an explicitly registered verifier must:

1. Capture repository root, current branch/HEAD, dirty paths, runtime version, database path, and
   served-build identity where relevant.
2. Start from a fresh reset for any stateful scenario and record the fixture generation.
3. Verify the normal UI entry and the backing API/domain operation; do not infer backend truth from
   a rendered label alone.
4. Exercise each state transition with the exact actor, current version, generation, and expected
   input documented here.
5. Check the alternate outcome or terminal branch when the scenario claims one, or record why the
   branch is direct/static-only.
6. Check signed-out, wrong-role, wrong-assignment, unknown-resource, stale-version, invalid-input,
   duplicate-command, and persistence-failure behavior where applicable.
7. Inspect the authoritative postcondition: request state/version, slot state, Favourite relation,
   audit count, and role-safe DTO fields.
8. For browser evidence, check visible loading/error/empty/success states, keyboard reachability,
   focus, no horizontal overflow at the supported viewport floor, and no console errors.
9. Verify no generated/browser artifact, unrelated outer application, or external integration was
   changed by the run.
10. Record the result in the current-status and relevant Task/validation record. A passing test or
    worker report alone does not close the scenario.

The minimum primary walkthrough is:

```text
tenant session
-> published listing discovery/filter
-> primary listing detail
-> draft save/revise
-> explicit submit
-> agent queue refresh
-> agent request detail/start review
-> prepare response
-> explicit send
-> tenant response refresh
-> confirm or decline
-> terminal state and slot consequence
```

The next audit may continue this walkthrough against the current source because `F-01`, `F-02`, and
`F-03` are closed within their bounded local claims, and `F-04` and `F-05` are closed within their
bounded presentation-only claims. The audit must still verify the full chain from the current fixture
and classify any new observation before registering another Task; no closure here claims external
integrations or production readiness.
