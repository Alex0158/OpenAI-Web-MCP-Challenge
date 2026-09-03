# RightSpot — Business Flow and Scenario Catalogue

**Role:** Canonical business-flow, scenario, state-transition, and acceptance authority for the
RightSpot Web application
**Status:** Accepted current-flow baseline; `F-01`–`F-06`, `F-09`–`F-19` are closed within their
recorded claims. `RIGHTSPOT-032` added the tenant-safe selected-slot projection
and presentation
needed by the proposal and retained terminal response flows.
`RIGHTSPOT-034` added the truthful cross-listing request-status notice grouping for saved drafts,
active requests, and recorded outcomes.
`RIGHTSPOT-035` added distinct accessible names to repeated preferred-time removal controls without
changing the Viewing Request state or mutation boundary.
`RIGHTSPOT-036` made structural preferred-time removal clear stale local editor feedback without
changing validation, dirty tracking, or request mutation behavior.
`RIGHTSPOT-037` made the Agent queue and request-detail consumers withhold retained projections while
the latest read is loading or has failed, without changing server authority or workflow behavior.
`RIGHTSPOT-038` made the Agent request-detail consumer render an authoritative recovery read after a
stale action conflict while retaining neutral conflict feedback and a fail-closed recovery boundary.
`RIGHTSPOT-039` separated listing-detail listing-fact and tenant request-context reads so a partial
request-context failure does not mislabel successful listing facts as unavailable.
`F-18` was a tenant Discovery error-copy defect tracked by `RIGHTSPOT-040`; the bounded consumer
repair is now closed and verified.
The continuing audit then reproduced `F-19`, tracked by `RIGHTSPOT-041`, where successful tenant draft
save and explicit submit feedback was lost when the authoritative response rehydrated the version-keyed
request editor. The bounded parent-owned UI repair is now closed and verified; the underlying server
mutation and request state remain authoritative.
The deterministic-reset repair is recorded in `RIGHTSPOT-028` and the tenant conflict-feedback repair
in `RIGHTSPOT-031`.
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
| `RS-FLOW-01` | Establish, resolve, and end a role session | `/`, `/api/session` | Session cookie only | `CLOSED_VERIFIED` — signed-out resolution, role mismatch, sign-out recovery, and documented local hosts are verified; fresh browser evidence in `rightspot-audit-082` |
| `RS-FLOW-02` | Discover and filter published rentals | `/tenant` | Read-only listing projection | `CLOSED_VERIFIED` — `RIGHTSPOT-040` keeps local validation feedback separate from bounded catalogue-read error copy; normal success, filtered, empty, retry, and recovery behavior remains verified |
| `RS-FLOW-03` | Inspect a listing and enter a request | `/tenant/listings/:listingId` | No implicit write | `CLOSED_VERIFIED` — same-listing notice copy is verified by `RIGHTSPOT-026`; cross-listing draft/active/terminal notice copy is verified by `RIGHTSPOT-034`; supported catalogue anchors were directly rechecked as full-document navigation in `rightspot-audit-081` |
| `RS-FLOW-04` | Save, remove, reload, and re-save a Favourite | Listing cards/detail, `/tenant/favourites` | Favourite `ACTIVE/REMOVED` | `IMPLEMENTED_WITH_RESIDUAL_EVIDENCE` — fresh save/reload/remove/empty/re-save replay passed at generation `73`; unpublished reactivation remains static/direct evidence because no supported user-facing unpublish action exists |
| `RS-FLOW-05` | Create and revise a Viewing Request draft | Listing detail, `/tenant/requests` | `TENANT_DRAFT`, version increment; `RIGHTSPOT-031` preserves truthful stale-write recovery feedback; `RIGHTSPOT-041` preserves parent-owned post-save feedback after rehydration | `CLOSED_VERIFIED` within state, mutation, completion-feedback, and fresh end-to-end boundaries (`rightspot-audit-083`) |
| `RS-FLOW-06` | Explicitly submit the draft | Tenant request surface | `TENANT_DRAFT` → `REQUEST_SUBMITTED`; `RIGHTSPOT-031` preserves truthful stale-write recovery feedback; `RIGHTSPOT-041` preserves parent-owned post-submit feedback after rehydration | `CLOSED_VERIFIED` within state, mutation, completion-feedback, and fresh end-to-end boundaries (`rightspot-audit-083`) |
| `RS-FLOW-07` | Expose submitted work to the assigned agent | `/agent` | Queue read only | `CLOSED_VERIFIED` — draft privacy remains closed at the authoritative read boundary; active/history presentation is closed by `RIGHTSPOT-033`, failed latest reads withhold retained queue content through `RIGHTSPOT-037`, and fresh submitted/terminal queue transitions passed in `rightspot-audit-083` |
| `RS-FLOW-08` | Open an assigned request and start review | Agent queue/detail | `REQUEST_SUBMITTED` → `AGENT_REVIEWING` | `CLOSED_VERIFIED` — submitted work remains actionable after a successful read, pre-submission drafts are non-visible, failed latest reads withhold retained detail/actions through `RIGHTSPOT-037`, stale-action `409` recovery renders authoritative detail through `RIGHTSPOT-038`, and fresh UI review passed in `rightspot-audit-083` |
| `RS-FLOW-09` | Prepare or revise an agent response | Agent request detail | Preparation only; remains `AGENT_REVIEWING` | `CLOSED_VERIFIED` — a successful detail recovery after a stale action preserves the current preparation surface and neutral conflict feedback through `RIGHTSPOT-038`; fresh save-without-send boundary passed in `rightspot-audit-083` |
| `RS-FLOW-10` | Send a slot proposal | Agent request detail | `SLOT_PROPOSED`; slot held; 24-hour window | `CLOSED_VERIFIED` — fresh prepare → explicit send → read-only decision record passed in `rightspot-audit-083` |
| `RS-FLOW-11` | Send an agent decline | Agent request detail | `AGENT_DECLINED` terminal | `CLOSED_VERIFIED` — fresh rendered decline → send → Tenant terminal/read-only and Agent history branch verified in `rightspot-audit-084` |
| `RS-FLOW-12` | Tenant confirms a proposal | `/tenant/requests` | `VIEWING_CONFIRMED`; slot confirmed | `CLOSED_VERIFIED` — selected time is shown before confirmation and retained after the terminal transition under `RIGHTSPOT-032`; fresh end-to-end confirmation/reload passed in `rightspot-audit-083` |
| `RS-FLOW-13` | Tenant declines a proposal | `/tenant/requests` | `TENANT_DECLINED`; slot released | `CLOSED_VERIFIED` — selected time is tenant-visible and retained without reopening action under `RIGHTSPOT-032` |
| `RS-FLOW-14` | Proposal expires without a scheduler | Relevant tenant/agent read or write | `EXPIRED`; slot released | `CLOSED_VERIFIED` — projection retains the selected time while terminal expiry remains non-actionable under `RIGHTSPOT-032` |
| `RS-FLOW-15` | Reset and replay a deterministic fixture | Development script/test boundary | New generation; empty request/Favourites | `CLOSED_VERIFIED` — `F-06` / `RIGHTSPOT-028` repaired the CLI composition and passed focused and independent verification |
| `RS-FLOW-16` | Show privacy-preserving listing interest to an agent | `/agent` embedded section | Read-only aggregate | `CLOSED_VERIFIED` |
| `RS-FLOW-17` | Query the isolated Operations profile | Domain/persistence tests only | Projection envelope; no relay mutation | `ISOLATED_SEAM_NOT_USER_FACING` |
| `RS-FLOW-18` | Enforce role, privacy, version, and failure boundaries | All API/projection surfaces | Visible bounded error; no invalid mutation | `CLOSED_VERIFIED` for the tenant Discovery error-copy consumer boundary through `RIGHTSPOT-040`; other audited role/privacy/version/failure claims remain closed within their recorded scopes |
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
   `availableBy` filters; the compatibility HTTP query name remains `availableFrom`.
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

**Accepted Area contract direction:** [ADR-RS-0014](Decisions/ADR-RS-0014-area-search-semantics.md)
defines Area as a canonical structured facet. Partial input is limited to deterministic suggestion
discovery; Apply and the page-bound WebMCP capability use a selected canonical Area after shared trim and
case-insensitive normalization. An unselected or unknown value must receive bounded validation, while
a selected Area with no published matches remains an explicit empty result with no catalogue fallback.
The ordinary Tenant Search implementation now follows this direction at product code commit
`534f5c9`; the page-bound adapter source is integrated at `ec7a679`, and the supported-browser
registration and invocation gate passed in `RIGHTSPOT-043` against the declared local capability.

**Accepted Search contract:** [ADR-RS-0015](Decisions/ADR-RS-0015-tenant-search-and-webmcp-contract.md)
freezes the first slice at the four optional criteria `area`, `maxRent`, `minSizeSqM`, and public
`availableBy`. Criteria are ANDed, numeric/date comparisons are inclusive, published results retain
deterministic source order, and the bounded synthetic catalogue is returned without caller-defined
pagination or silent truncation. The Area control resolves an exact canonical stored label after
bounded prefix suggestions; unresolved/unknown input is validation, and a known Area with no current
published match is truthful empty state. The `search_listings` capability source is now integrated as
read-only, Tenant-only, and page-bound to `/tenant`; it updates the same visible page state as the
human form. Supported-browser registration/invocation evidence passed in `RIGHTSPOT-043` for the
bounded local slice. This flow still does not claim production, universal browser, or judge support.

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
without overwrite; refresh shows the authoritative draft; when two or three options are present,
each removal control is keyboard-reachable and programmatically identifies its numbered option; removing
an option clears stale local editor feedback without fabricating a success state.
**Evidence:** `src/server/domain/workflow.ts`, `src/server/application/workflow-http.ts`,
`src/ui/tenant/tenant-request-page.tsx`, `tests/domain/workflow.test.ts`,
`tests/application/workflow.test.ts`, `tests/api/workflow.test.ts`,
`tests/ui/tenant-request-editor-accessibility.test.ts`, `tests/ui/tenant-request-editor-feedback.test.ts`,
and `RIGHTSPOT-035`/`RIGHTSPOT-036` browser evidence.

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

**Presentation acceptance:** The queue consumer must make the current/history distinction explicit.
It must expose counts for the seven non-draft states in two truthful groups: active/non-terminal
(`REQUEST_SUBMITTED`, `AGENT_REVIEWING`, `SLOT_PROPOSED`) and terminal/recorded
(`VIEWING_CONFIRMED`, `TENANT_DECLINED`, `EXPIRED`, `AGENT_DECLINED`). Active cards may link with
`Review request` language; terminal cards remain available as read-only context and must not imply
that the Agent can take another workflow action. `TENANT_DRAFT` remains absent from both groups.

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

**Stale-action boundary:** If the explicit review action loses an optimistic-concurrency race, the
`409` remains a failed attempted action. When the immediate authoritative detail read succeeds, the
page renders that returned request and current state/action surface beside neutral conflict feedback;
when the recovery read fails, it withholds request facts and state-changing controls behind the bounded
unavailable/retry surface. It never treats the action as successful, patches state optimistically, or
keeps an older projection as current. This presentation boundary is closed by `RIGHTSPOT-038`.

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

**Recovery boundary:** A stale preparation/send attempt follows the same consumer rule as review:
the server remains authoritative, a successful detail recovery restores the current preparation state
without implying that the attempted mutation succeeded, and a failed recovery remains fail-closed.
`RIGHTSPOT-038` verifies this local Agent detail feedback/read lifecycle without changing the
preparation or send contracts.

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

1. The tenant reads the current request and sees the agent's permitted response, the selected
   proposed viewing date/time, and expiry context. The selected time is distinct from the tenant's
   own preferred times.
2. The tenant explicitly chooses confirm.
3. The server rechecks ownership, state, deadline, held-slot identity, generation, and request version.
4. It commits `VIEWING_CONFIRMED` and changes the slot to `CONFIRMED`.
5. The tenant sees the terminal state; the agent's read reflects the same authoritative state.

**Business effect:** `SLOT_PROPOSED` → `VIEWING_CONFIRMED`; slot held → confirmed; request version and
audit increment.
**Acceptance:** Only the tenant can confirm; expired, stale, wrong-slot, terminal, or wrong-role
actions fail without mutation; the browser flow displays the final result.
**Evidence:** `src/server/domain/workflow.ts`, `src/ui/tenant/tenant-request-page.tsx`,
`tests/api/workflow.test.ts`, `tests/domain/workflow.test.ts`, `RS-WO-002-15` browser evidence,
and the fresh proposal/confirmed-response evidence recorded in `RIGHTSPOT-032`.

**Presentation rule:** Once the transition is terminal, the retained response is historical. The
tenant response card shows the recorded selected viewing time and outcome rather than an actionable
proposal or an active deadline; the terminal action/deadline rule is verified in `RIGHTSPOT-027`,
and the selected-time projection/presentation is verified in `RIGHTSPOT-032`.

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

**Presentation rule:** The retained slot proposal may remain visible as history, including its
recorded selected viewing time, but a terminal `TENANT_DECLINED` request is not labelled actionable
and does not retain an active `Respond by` deadline; the terminal action/deadline repair is verified
in `RIGHTSPOT-027`, and selected-time presentation is verified in `RIGHTSPOT-032`.

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
shows its recorded selected viewing time but does not show `Action needed` or a past `Respond by`
deadline; the terminal action/deadline repair is verified in `RIGHTSPOT-027`, and selected-time
presentation is verified in `RIGHTSPOT-032`.

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
obligation. `RIGHTSPOT-038` additionally verifies that a stale Agent mutation remains visibly failed
while a successful authoritative recovery read is rendered, and that a failed recovery withholds
detail/actions. Its closure does not imply external-authentication, deployment, or production-readiness
evidence.

### RS-FLOW-19 — Deferred and gated product branches

The following are deliberately named so they cannot be mistaken for missing links in the current
ordinary application flow:

| Branch | Disposition and re-entry condition |
|---|---|
| Information Request/contact preference | `DEFERRED`; requires an owner-approved PII, consent, retention, erasure, encryption, and agent-access decision before any field or route is added |
| Username/password or Clerk/Gmail authentication | `GATED`; requires external credentials and provider-boundary implementation task; demo session remains the current local contract |
| WebMCP capability registration/invocation | `CLOSED_VERIFIED` for the first bounded Tenant Discovery Search slice in `RIGHTSPOT-043`; later capabilities require separate acceptance |
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
| `RS-FLOW-03` | Implemented | Implemented and verified | Listing/API/UI source and browser evidence; `RIGHTSPOT-026` same-listing and `RIGHTSPOT-034` cross-listing notice verification | Published-only detail remains intentional |
| `RS-FLOW-04` | Implemented | Implemented | Domain/API/UI tests; fresh save/remove/reload/re-save browser evidence in `rightspot-audit-077` | Unpublish path lacks a user-facing admin trigger |
| `RS-FLOW-05` | Implemented | Implemented | Domain/application/API/UI tests, `RIGHTSPOT-035`/`RIGHTSPOT-036` editor contracts, and browser evidence | One request per reset remains bounded |
| `RS-FLOW-06` | Implemented | Implemented | API/domain and browser evidence | No external notification claim |
| `RS-FLOW-07` | Implemented and verified | Implemented; active/history presentation is separated, all seven non-draft counts are rendered, and failed latest reads withhold retained queue content | `RIGHTSPOT-025` focused regression, full suite, formal persistent verification, direct source review, `RIGHTSPOT-033` Red→Green/browser evidence, and `RIGHTSPOT-037` failure/retry browser evidence | Re-check on the next cross-layer audit without changing the authoritative read boundary |
| `RS-FLOW-08` | Implemented for submitted requests | Implemented; successful detail remains actionable and failed latest reads withhold retained detail/actions | Domain/API/browser primary path, `RIGHTSPOT-025` draft boundary regression, and `RIGHTSPOT-037` failure/retry browser evidence | No current defect; keep submitted-request review path bounded |
| `RS-FLOW-09` | Implemented | Implemented | Domain/application/API/UI tests and browser evidence | No automatic send claim |
| `RS-FLOW-10` | Implemented | Implemented | Domain/API and primary browser evidence | No delivery provider claim |
| `RS-FLOW-11` | Implemented | Implemented | Direct/domain/API and fresh isolated local browser evidence | No external notification or deployment claim |
| `RS-FLOW-12` | Implemented and verified; tenant-safe selected time resolves from the sent slot | Implemented and browser-verified for proposal and confirmed response | `RIGHTSPOT-032` projection/UI contracts, full suite, fresh generation-25 browser proposal and confirm evidence | No booking/payment or real-world appointment claim |
| `RS-FLOW-13` | Implemented and verified; tenant-decline transition retains the selected time | Implemented and retained terminal presentation covered by the same contract | `RIGHTSPOT-032` terminal projection regression plus prior decline evidence | No external notification or deployment claim |
| `RS-FLOW-14` | Implemented and verified; expiry retains the selected time | Implemented on relevant reads/writes with terminal no-action presentation | `RIGHTSPOT-032` expiry projection regression plus prior expiry evidence | No scheduler/notification claim |
| `RS-FLOW-15` | Implemented in application authority and CLI composition | Development boundary only | Focused child-process regression, full suite, and frozen-source independent verification for `F-06` / `RIGHTSPOT-028` | No public reset route; arbitrary corrupt-database salvage remains unclaimed |
| `RS-FLOW-16` | Implemented | Implemented on `/agent` | Domain/API/UI and fresh populated Agent UI aggregate evidence in `rightspot-audit-078` | No analytics/history claim |
| `RS-FLOW-17` | Implemented seam | No current route | Domain/persistence tests | Separate authority/route decision required |
| `RS-FLOW-18` | Implemented and verified for audited boundaries | Implemented and verified | Broad negative tests plus formal `RIGHTSPOT-025` F-01 and browser `F-02`/`F-03` evidence | Re-check on the next cross-layer audit; no production-readiness claim |
| `RS-FLOW-19` | Deliberately absent | Deliberately absent | ADR/task boundaries | Do not use fallback implementations |

## 9.1 Fresh primary-chain evidence — 2026-09-02

The Main thread replayed the canonical local chain from a fresh fixture generation `57`: tenant
discovery and primary listing detail, draft save, explicit submission, Agent queue exposure, Agent
review, response preparation, explicit slot-proposal send, tenant proposal read, explicit confirmation,
terminal tenant read, and Agent history read. The authoritative transitions were observed from
`TENANT_DRAFT` version `1` through `REQUEST_SUBMITTED` version `2`, `AGENT_REVIEWING` versions `3` and
`4`, `SLOT_PROPOSED` version `5`, and `VIEWING_CONFIRMED` version `6`. Each operation returned `200`;
the selected `4 Sept 2026, 15:00–15:30` slot was distinct from the tenant's `15 Sept 2026, 10:00`
preference and retained in the terminal projection.

The Agent-only internal preparation note did not cross into the tenant projection. The terminal Agent
queue moved the request out of active work and into one `Confirmed` history item. Both terminal surfaces
passed the accepted `320px` width floor, first-Tab skip-link check, and empty browser page-error check.
The fixture was reset to generation `58` after the replay. No new scenario defect or Task was registered;
the existing `F-08` listing-detail timing concern remains an evidence gap rather than a speculative
repair authorization.

## 9.2 Fresh tenant-decline terminal evidence — 2026-09-02

The Main thread also replayed the alternate `RS-FLOW-11` branch from fixture generation `59`: tenant
draft/save/submit, Agent review, `AGENT_DECLINE` preparation, explicit send, tenant terminal read, and
Agent history read. The request ended at `AGENT_DECLINED` version `5`; all three availability slots were
`Available` again, the tenant-facing note was visible only to the tenant and Agent response surfaces,
and the Agent-only internal note did not cross the role projection boundary.

The tenant terminal page exposed no action, the Agent detail was read-only with no mutation controls,
and the Agent queue contained no active request plus one `Declined` history item. Both terminal surfaces
passed the `320px` width floor, first-Tab skip-link check, and empty browser page-error check. The fixture
was reset to generation `60`; no new scenario defect or Task was registered.

## 9.3 Direct route-entry and browser postcondition evidence — 2026-09-02

At the current reset generation `60`, Main rechecked the signed-out role entry, tenant catalogue,
listing detail, Favourites, Viewing Requests, tenant-to-Agent wrong-role boundary, Agent queue, and
embedded Listing interest surface in an isolated browser session. Direct URL navigation produced the
expected rendered pages and explicit empty states; the browser page-error log was empty; and the accepted
`320px` body/document width and first-Tab skip-link checks passed.

One stale accessibility-tree reference returned a CLI `Done` acknowledgement without completing the
expected full-document navigation. After the target was reacquired, direct URL navigation verified the
actual route and rendered identity. This is tooling evidence, not a product defect; browser command
acknowledgement is not accepted as route evidence without a URL/DOM postcondition check. The ordinary
catalogue links still use full document navigation. A follow-up at generation `61` used the actual DOM
anchor and confirmed navigation type `navigate`, referrer `/tenant`, final path
`/tenant/listings/listing-primary`, and rendered listing `Canal Wharf Apartment`. `F-08` remains an
evidence gap and no route repair Task was registered. The fixture was reset to generation `62` afterward.

## 9.4 Fresh Favourite persistence and role-boundary evidence — 2026-09-02

At fixture generation `73`, Main used isolated browser session `rightspot-audit-077` to replay
`RS-FLOW-04`. The tenant saved `Canal Wharf Apartment`, opened `/tenant/favourites`, reloaded the
route, removed the record, observed the explicit no-saved-homes state, and saved the same listing
again. The authoritative relation version advanced `1 → 2 → 3`; `GET /api/tenant/request` remained
empty, so the Favourite operation did not create or mutate a Viewing Request. The page exposed the
saved card after reload and the correct save/remove controls.

The assigned Agent then saw only listing-level `currentSaves` and `availableInterest` aggregates
(`1/1` for the primary listing and `0/0` for the other two), while the request queue remained separate
and empty. At `320px`, the Favourite route had equal body/document widths, no horizontal overflow,
and first-Tab skip-link focus. No browser page errors were observed during the audit. The fixture was
reset to generation `74` afterward and `/api/health` returned `{"ok":true,"service":"rightspot"}`.
The unpublished Favourite branch remains direct/static-only because the bounded MVP exposes no
supported user-facing unpublish action; no hidden endpoint or fixture mutation was used. No new
finding or Task was registered.

## 9.5 Populated Agent listing-interest presentation evidence — 2026-09-02

After the Favourite persistence replay, Main reset the fixture to generation `74`, saved
`Canal Wharf Apartment` as the tenant, and opened the assigned Agent dashboard in isolated
`agent-browser` session `rightspot-audit-078`. The rendered Listing interest surface showed the
three assigned listings and the expected listing-level pairs: `1/1` (`Current saves` /
`Available interest`) for the saved published primary listing and `0/0` for the other two. The
request queue remained separate and empty, with all seven non-draft state counts at zero. No tenant
identity, contact value, Favourite timestamp, request state, or private field appeared in the page
text or the server projection.

At `320px`, body and document widths were both `320px`, no horizontal overflow was present, and the
first Tab reached the skip link. The populated surface had readable metric definitions and no obvious
clipping in the mobile screenshot; the browser error check returned no page errors. The fixture was
reset to generation `75` afterward and `/api/health` remained healthy. The unpublished branch remains
direct/static-only because no supported user-facing unpublish action exists. No new finding or Task
was registered.

## 9.6 Supported listing navigation and F-08 boundary evidence — 2026-09-02

In isolated `agent-browser` session `rightspot-audit-081` at fixture generation `77`, Main followed
the actual rendered catalogue anchor from `/tenant` to `listing-primary`, returned to `/tenant`, and
then followed the anchor to `listing-north`. Each transition reported browser navigation type
`navigate` and the prior route as referrer; the final page rendered the authoritative `Northfield
Garden Flat` identity and its matching detail surface. The browser error check was empty, and no
fixture or source state changed.

The supported catalogue-to-detail path is therefore evidenced as full-document navigation. The
suspected same-document read-order race was not reproduced in the ordinary user path. A future
router-reuse implementation would require a new route contract and separate evidence, so `F-08`
remains an `EVIDENCE_GAP` rather than an authorized speculative repair. The session was closed and
`/api/health` returned `{"ok":true,"service":"rightspot"}`.

## 9.7 Fresh Agent-decline terminal evidence — 2026-09-02

Main reset the fixture to generation `80` and used isolated browser session `rightspot-audit-084` to
replay the alternate terminal branch. Tenant saved and explicitly submitted one request. The Agent
started review, selected `Decline request`, entered a bounded tenant-facing reason, saved preparation
without sending, and then explicitly sent the decline. The server-authoritative Agent state became
`AGENT_DECLINED` at version `5`; the decision record was read-only and no internal review field entered
the tenant-safe response.

After switching roles through the root, the Tenant dashboard rendered `Agent Declined`, the bounded
response reason, preferred time, and a five-entry tenant-safe timeline. Reload retained the terminal
state and left only `Refresh`; no tenant decision controls remained. The Agent queue showed zero active
requests and one `Declined` history item, and terminal detail exposed only read/refresh controls. Browser
error checks were empty. The fixture was reset to generation `81` with healthy `/api/health`, and no
new finding or Task was registered.

## 9.8 Rendered route-entry and accessibility sweep — 2026-09-02

In isolated `agent-browser` session `rightspot-audit-085` at fixture generation `81`, Main reviewed
the signed-out Root, all current Tenant routes, Agent queue, and Agent request-unavailable detail.
Rendered role entry, Tenant `Browse rentals`/`Favourites`/`My request` navigation, three listing-detail
anchors, empty-state handoffs, Agent Request queue entry, and missing-request Back to queue/Retry
controls were present and bounded. The primary, Northfield, and Riverside details each rendered the
matching listing identity, media, and Viewing Request entry surface.

At `320px`, every checked route kept body and document widths at `320px`; listing images were complete,
and the first Tab on both Tenant and Agent workspaces focused the skip link before main content. Browser
error checks were empty, the fixture was not mutated, the session was closed, and `/api/health` remained
healthy. No new finding or Task was registered.

## 9.9 Fresh Tenant-decline terminal evidence — 2026-09-02

In isolated `agent-browser` session `rightspot-audit-086` at fixture generation `81`, Main replayed the
rendered proposal branch through explicit Tenant decline. The Agent prepared and sent an available
slot with separate tenant-facing and agent-only notes; the Tenant saw the proposed time separately
from the preferred time, explicitly declined, and then saw a terminal read-only request with its
tenant-safe timeline. The Agent queue showed zero active work and one `Tenant declined` history item
whose detail was read-only. Browser error checks were empty; the fixture was reset to generation `82`
with healthy `/api/health`, and no new finding or Task was registered.

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

### F-09 — Tenant conflict recovery can lose its explanation or claim a refresh succeeded (closed)

**Severity:** P2 for tenant action clarity and truthful conflict-state presentation; no workflow or
data-integrity impact is claimed
**Reproduction:** A tenant listing-detail editor and the tenant request dashboard both held request
version `1`. An external authenticated update advanced the authoritative draft, then the stale editor
submitted its old version. The server correctly returned `409`, and the recovery read returned the
newer request. The version-keyed editor remounted after accepting that response, so the old local
error state disappeared and the tenant saw no explanation. The adjacent recovery-failure catch path
also used copy claiming that the view was refreshed even when the refetch failed.
**Expected:** A stale write remains non-mutating and the tenant sees the authoritative response plus
a visible bounded conflict notice. If recovery fails, the notice must say that the latest view could
not be refreshed and must direct the tenant to reload. The notice is presentation feedback, not a
new workflow state or success result.
**Disposition:** `CLOSED_VERIFIED` through `RIGHTSPOT-031` on 2026-09-02. The Main-thread serial
repair owns the notice in both tenant parents, accepts the server response before reporting successful
recovery, and uses distinct truthful failure copy. Focused Red→Green contract, full `137/137`
suite across 30 test files, foundation `6/6`, typecheck, production build, and isolated browser
reproductions on both `/tenant/listings/listing-primary` and `/tenant/requests` passed. No replay,
optimistic workflow patch, API/domain/persistence change, or listing-detail `load()` sequencing change
was made.
**Not authorised by this finding:** changing the 409/API contract, adding retry or cancellation
infrastructure, altering workflow state or role/privacy projections, or speculatively repairing the
separate listing-detail dynamic-route `F-08` evidence gap. The current catalogue entry uses full
document navigation, so a delayed same-document `listingId` transition remains unproven and must not
be inferred from the static `load()` shape.

### F-10 — Tenant proposal response does not show the selected viewing time

**Severity:** P1 for primary tenant decision comprehension; no workflow state-machine or data-integrity
failure was reproduced
**Reproduction:** After resetting the local fixture to generation `24`, a tenant submitted a request
with a preferred time rendered as `18 September 2026, 10:00`. The assigned agent explicitly sent a
proposal for `slot-primary-2`, whose authoritative slot was `4 September 2026, 15:00–15:30` in the
existing Europe/London display contract. The tenant `/tenant/requests` page showed the tenant's own
preferred time, the opaque `Slot reference slot-primary-2`, the agent note, deadline, and decision
controls, but did not show the proposed date or time. The isolated browser run had no application
console or route errors; local rendered evidence is retained at
`var/test/audit-proposal-missing-slot.png`.
**Expected:** A tenant must see the exact selected proposal date/time as a separate tenant-safe
viewing fact before confirming or declining. The same recorded time remains visible as history after
confirmation, tenant decline, or expiry, while the existing terminal presentation rule removes action
and past-deadline language.
**Impact:** The tenant can be asked to confirm a slot without knowing the date/time being confirmed,
and the visible preferred time can be mistaken for the agent's proposal. This leaves `RS-FLOW-12`–
`RS-FLOW-14` transition evidence intact but makes their tenant-facing response projection incomplete.
**Disposition:** `CLOSED_VERIFIED` through `RIGHTSPOT-032` on 2026-09-02. The serial Work Order
implemented the authoritative tenant-safe selected-slot projection and UI presentation, then passed
the required focused and complete verification gates.
**Boundary:** The correction must expose only `startsAt`/`endsAt` for the selected sent slot. It must
not expose slot status, holder, other availability, agent internal notes, or guessed/preferred-time
fallback data. Missing or mismatched authoritative relations must use the existing visible error
boundary rather than silently rendering an opaque reference as a successful resolution.
**Verification:** Focused projection/presentation contracts passed, including missing and wrong-listing
relation failures, terminal selected-time retention, tenant-safe parser filtering, and incomplete
proposal action blocking. The pinned complete suite passed `143/143` across `32` authored test files;
foundation passed `6/6`, typecheck, production build, and `git diff --check` passed. A fresh isolated
browser run at fixture generation `25` rendered the agent-selected `4 Sept 2026, 15:00–15:30` separately
from the tenant's `18 Sept 2026, 10:00` preference, then confirmed the proposal and rendered the
recorded time in the terminal `VIEWING_CONFIRMED` state without `Action needed`, `Respond by`, or
decision controls. The tenant response JSON contained only `startsAt`/`endsAt` under `viewingSlot`; no
slot status, holder, internal note, or other private field crossed the boundary, and no application
browser error was observed. Evidence screenshots are retained at
`var/test/rightspot-032-proposal-after.png` and `var/test/rightspot-032-terminal-response-final.png`.

**Not authorised by this finding:** changing workflow transitions, slot lifecycle, persistence schema,
request commands, agent projections/UI, auth, listing loading, calendar/notification behavior, or any
deferred WebMCP, Cloud Receiver, WebRTC, Redis, external-auth, deployment, or commercial feature.

### F-11 — Agent queue mixes terminal history with active work and omits truthful state counts

**Severity:** P2 for Agent action clarity and judge-facing state truthfulness; no workflow, API, privacy,
or persistence failure was reproduced
**Controlled reproduction — 2026-09-02:** After a fresh reset to workflow fixture generation `26`, an
isolated browser session completed the tenant proposal/confirmation path. On `/agent`, the dashboard
showed `See what needs a human response`, four visible zero-valued cards (`Needs review`, `In review`,
`Proposal sent`, and `Declined`), and a `Current work` / `Requests assigned to you` list containing a
`Confirmed` version-6 request whose footer still said `Review request →`. The run had no application
console or route error; evidence is retained at
`var/test/audit-agent-queue-terminal-counts.png`.
**Static evidence:** `toAgentQueueView` returns counts for every workflow state and the assigned request
for every non-draft state. `agent-dashboard-page.tsx` renders only four states, includes terminal
`AGENT_DECLINED` in that partial metric set, omits `VIEWING_CONFIRMED`, `TENANT_DECLINED`, and `EXPIRED`,
and gives all returned cards the same review footer. The defect is therefore in the UI consumer, not in
the authoritative queue read or state machine.
**Expected:** The Agent dashboard describes state tracking rather than implying all visible items need
an Agent response; presents all seven non-draft counts in explicit active and terminal groups; separates
active requests from recorded outcomes; and uses non-action language for terminal cards. Draft privacy,
the existing API/domain contract, request detail, and terminal state semantics remain unchanged.
**Disposition:** `CLOSED_VERIFIED` through `RIGHTSPOT-033` / `RS-WO-033-01`. The focused TDD
contract first failed against the four-state consumer and then passed after the local UI repair.
Fresh isolated browser evidence at generation `27` showed active request counts and cards separated
from the four recorded-outcome counts and confirmed history; the terminal card used `View recorded
request`, while the active card retained `Review request`. The accepted `320px` check reported no
horizontal overflow, keyboard focus reached the terminal link, and a fresh generation-`28` reset
kept `TENANT_DRAFT` absent with truthful empty states. Full tests, foundation tests, typecheck, build,
and exact-scope review passed. No API, workflow, persistence, privacy, or dependency change was made.

### F-12 — Cross-listing tenant notice mislabels drafts and terminal requests as active

**Severity:** P2 for tenant state comprehension and truthful cross-listing handoff; no workflow, API,
privacy, or persistence failure was reproduced.
**Controlled reproduction — 2026-09-02:** In isolated browser session `rightspot-audit-20260902`, a
fresh reset at generation `30` produced an `AGENT_DECLINED` request for `listing-primary`; opening
`/tenant/listings/listing-north` showed `Your active request is for another listing` even though the
request was terminal. A fresh reset at generation `31` produced a tenant-only `TENANT_DRAFT` for
`listing-primary`; the same cross-listing page again called it active. Both runs had no application
console error. The pre-repair draft evidence is retained at
`var/test/audit-034-draft-cross-listing-notice-content.png`.
**Static evidence:** `tenant-listing-page.tsx` already receives the server-authoritative
`TenantRequestDto.state`, but its cross-listing condition checked only the listing id and rendered one
unconditional active notice. Same-listing state notices and the request dashboard handoff were already
explicit and are not implicated.
**Expected:** A cross-listing `TENANT_DRAFT` is described as a saved draft; submitted, reviewing, and
proposed states remain active; confirmed, declined, and expired states are recorded outcomes. The
copy must not imply submission, active work, or a second request, and must retain the existing dashboard
handoff.
**Disposition:** `CLOSED_VERIFIED` through `RIGHTSPOT-034` / `RS-WO-034-01`. The single serial
presentation Work Order added an exhaustive draft/active/terminal state mapping and preserved the
one-request, same-listing, and typed-state boundaries. Focused TDD moved from Red `3 tests; 2 passed;
1 failed` (missing `TENANT_DRAFT` case) to Green `3/3`; full `npm test` passed `145/145` across `33`
test files, foundation `6/6`, typecheck, and production build passed. Fresh reset generations `32`–`34`
verified draft, active, terminal, and same-listing submitted notices; the 320px viewport had no
horizontal overflow and keyboard focus reached the skip link and primary navigation. Evidence is
retained at `var/test/audit-034-draft-cross-listing-notice-after-content.png`,
`var/test/audit-034-terminal-cross-listing-notice-after.png`, and
`var/test/audit-034-same-listing-submitted-after.png`. No server/API/domain/persistence/shared
contract, dependency, auth, CSS, or route-read behavior changed.

### F-13 — Preferred-time removal controls share an ambiguous accessible name

**Severity:** P2 for tenant keyboard and screen-reader operation; no workflow, validation, API, or
persistence failure was reproduced.
**Controlled reproduction — 2026-09-02:** In isolated browser session
`rightspot-audit-20260902-next`, a tenant opened the listing-detail request editor, added a second
preferred time, and the accessibility snapshot exposed two controls both named `Remove`. The controls
were visually beside `Option 1` and `Option 2`, but the programmatic names did not identify the target
row. No application browser error was observed.
**Static evidence:** The existing editor rendered the repeated controls from the same `times.map`
loop and already derived the visible option number from `index`; the removal handler filtered only the
selected index. The defect was limited to accessible naming.
**Expected:** With two or three options, each removal control has the distinct accessible name
`Remove preferred viewing time option N`, remains keyboard-reachable, and still removes only its own
row. With one option, no removal control is rendered.
**Disposition:** `CLOSED_VERIFIED` through `RIGHTSPOT-035` / `RS-WO-035-01`. The component-only repair
added the option-numbered `aria-label`; focused TDD moved from Red `2 tests; 1 passed; 1 failed` to
Green `2/2`, and the complete suite passed `147/147` across `34` test files with foundation `6/6`,
typecheck, production build, and isolated browser evidence. The browser confirmed distinct names,
correct Option 2 removal, blocked reverse-order save with `No requests captured`, no `320px` overflow,
and empty browser errors. The separate observation that a validation alert remains visible immediately
after structural row removal is not included in this disposition and requires independent reproduction
before a new Task is registered.

### F-14 — Structural preferred-time removal leaves stale validation feedback

**Severity:** P2 for truthful tenant editor recovery; no validation, request mutation, API, or
persistence failure was reproduced.
**Controlled reproduction — 2026-09-02:** In isolated browser session
`rightspot-audit-20260902-036` at fixture generation `37`, the tenant entered
`2026-09-18T10:00` followed by `2026-09-17T10:00`. The editor correctly showed the strict-order alert.
After the tenant removed Option 2, the remaining value was valid, but the alert stayed visible. The
request log was cleared before the invalid Save draft and reported `No requests captured`.
**Static evidence:** `updateTime` already clears both local `error` and `statusMessage`, while the
structural removal callback previously filtered `times` without clearing either state. The defect was
limited to local feedback lifecycle.
**Expected:** Removing a preferred-time row clears stale editor error/status feedback, removes only the
selected row, and does not fabricate a success state or issue a server request.
**Disposition:** `CLOSED_VERIFIED` through `RIGHTSPOT-036` / `RS-WO-036-01`. The callback-only repair
clears `error` and `statusMessage` after the existing row filter. Focused TDD moved from Red
`2 tests; 1 passed; 1 failed` to Green `2/2`; the complete suite passed `149/149` across `35` test
files with foundation `6/6`, typecheck, production build, and isolated browser evidence. After
removal, the browser showed one valid value, no alert, no stale editor status, and no removal control;
the existing `RIGHTSPOT-035` names, `320px` width, and empty browser errors remained valid. No server,
workflow, validation-rule, dirty-tracking, API, persistence, or dependency behavior changed.

### F-15 — Agent read failure leaves a stale projection and action surface visible

**Severity:** P2 for Agent workspace truthfulness and action clarity; no server mutation or state
machine failure was reproduced.
**Controlled reproduction — 2026-09-02:** After a fresh reset to fixture generation `41`, an
isolated browser session created and submitted `request-1` through the ordinary tenant UI. With the
populated Agent queue showing `Needs review 1`, a page-local fetch harness rejected only the latest
`/api/agent/requests` read. The page showed the queue error and `Retry queue read` while retaining the
previous count and `Review request` card. The same request-detail read failure retained the previous
request facts, availability, and enabled `Start review` action beside `Could not load the agent detail`.
The harness was client-local and did not alter server data; full evidence is retained at
`var/test/audit-037-agent-queue-refresh-failure-full.png` and
`var/test/audit-037-agent-detail-refresh-failure-full.png`.
**Static evidence:** `AgentQueue` rendered `QueueContent` whenever `queue` existed, regardless of
`error`, while `AgentRequestWorkspace` rendered `detail` and its action panels whenever `detail`
existed, regardless of `error`. The existing `AgentListingInterest` consumer already withheld its
projection during loading/failure and supplies the accepted local reference behavior.
**Expected:** While an Agent queue/detail read is in flight, the corresponding retained projection is
not presented as the completed current read. If the read fails, only its bounded error/unavailable
state and retry path remain; a successful retry restores the server response and normal actions.
**Disposition:** `CLOSED_VERIFIED` through `RIGHTSPOT-037` / `RS-WO-037-01`. The two consumer-only
render guards now put loading and error ahead of retained queue/detail content. Focused TDD moved from
Red `2/2` to Green `2/2`; pinned full suite passed `151/151` across `36` test files, foundation `6/6`,
typecheck, production build, and `git diff --check` passed. Fresh generation-`43` browser evidence
confirmed queue/detail stale content and actions were absent during synthetic failure and returned
after restoring the read path and using each retry. At `320px`, body/document widths were `320`, Tab
reached `Retry request read`, and browser page errors were empty. No API, workflow, persistence,
role/privacy, queue-grouping, CSS, dependency, or listing-interest behavior changed; the fixture was
reset to generation `44` afterward.
**Not authorised by this finding:** adding a cache, polling, arbitrary retry, timeout, offline mode,
new state, server fallback, or widening the repair to Tenant, listing-interest, or deferred external
integrations.

No other implementation gap discovered in this documentation audit should be promoted to a product
defect without reproducing it against current source, tests, or runtime. `F-01`–`F-06`, `F-09`–`F-15`
are closed within their bounded claims. All remain separate
from deferred integrations. The next fresh audit is required to re-check the full chain against
current source, tests, and runtime after the bounded presentation repairs.
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
`F-03` are closed within their bounded local claims, `F-04`, `F-05`, `F-09`, and `F-10` are closed
within their bounded presentation/projection claims, and `F-06` is closed at the reset boundary. No
closure here claims external integrations or production readiness.

## 11.1 Reverse same-document listing read-order probe — 2026-09-02

The Main thread ran a controlled reverse probe with the Next App Router in isolated
`rightspot-audit-063`. Both old primary-listing reads were held while the route moved to the primary
listing and then back to `/tenant/listings/listing-north`; releasing the held responses did not replace
the final `Northfield Garden Flat` identity or its matching image. This strengthens the evidence that
the suspected stale projection is not reproduced under the tested client transition, but it is not a
claim about every future router or transport schedule. `F-08` remains an `EVIDENCE_GAP`; no Task or
Work Order was registered, and the fixture remained at generation `62`.

## 11.2 Listing-detail partial-read boundary — `F-17` / `RIGHTSPOT-039`

The listing-detail flow has two independent read responsibilities: authoritative listing facts and
the signed-in tenant's current Viewing Request context. A failure of the request-context read must
not make the listing appear unavailable. The listing may remain readable, while request-derived
status, editor, and actions remain withheld behind a request-context-specific unavailable/retry state.
A listing-read failure remains listing-specific and must not render stale or fabricated listing facts.

This boundary was repaired and verified in `RIGHTSPOT-039` / `RS-WO-039-01`. It is a UI-consumer
repair only and does not change the scenario transition matrix, API contracts, workflow state,
persistence, role privacy, or the separate `F-08` dynamic-route evidence gap.

## 11.3 Tenant Discovery error-copy boundary — `F-18` / `RIGHTSPOT-040`

The tenant Discovery consumer must distinguish a local filter-validation message from a failed
catalogue read. A `TenantApiError` may retain server response metadata for classification, but its
user-facing message must come only from the existing bounded `tenantApiErrorMessage` mapping. The
Discovery page must not render arbitrary server response text or announce the same read failure twice.

The Main thread reproduced this boundary on 2026-09-02 with a page-local fetch harness that returned
`503` and the controlled marker `CONTROLLED_PRIVATE_SERVER_TEXT` for the collection read. Applying an
area filter rendered both the marker and the mapped local-service error, without changing workflow or
fixture state. `RIGHTSPOT-040` then completed as one Main-owned serial UI-consumer Work Order. The
focused TDD contract, full checks, and isolated browser verification preserved local invalid-filter
feedback, successful/empty/filter/retry results, Favourite controls, and all server/API contracts.
The browser failure branch now omits the marker and renders one bounded error surface; keyboard retry
and clear restore the filtered and full catalogue respectively.

**Disposition:** `F-18` is `CLOSED_VERIFIED`, `P2`, within the tenant Discovery error-copy consumer
boundary. This closure does not claim a listing API, domain, persistence, role, or data-integrity
change and does not authorize a generic error framework or speculative repairs in other consumers.

## 11.4 Tenant request mutation completion feedback — `F-19` / `RIGHTSPOT-041`

The tenant request editor must give a clear, bounded completion signal after a draft create/update or
explicit request submission succeeds. The signal must be based on the accepted server response and must
remain visible after the authoritative request version rehydrates the editor in both `/tenant/requests`
and `/tenant/listings/[listingId]`.

The Main-thread audit reproduced this boundary on 2026-09-02 in isolated browser session
`rightspot-audit-073`. A successful `PATCH /api/tenant/request` returned `200` and the updated draft
was rendered, but the editor's local success message was lost because `onSaved(response)` changed the
parent's version-keyed editor before the child set its success state. The explicit submit handler uses
the same ordering and is therefore included in the same bounded finding. No server, API, domain,
persistence, role, or workflow-state defect was reproduced.

The accepted design kept version-keyed editor rehydration and moved the bounded completion message to
the parent through the existing `onSaved(response, message)` callback. The editor no longer renders a
remount-prone local success state; both `/tenant/requests` and `/tenant/listings/[listingId]` render one
parent-level status surface, and scoped editor interactions clear stale completion copy.

Focused Red→Green, full checks, and isolated browser evidence passed. A generation-68 listing-detail
save returned `POST /api/tenant/request` `200` with visible draft-save feedback; the subsequent
generation-68 `/tenant/requests` submit returned `POST /api/tenant/request/submit` `200` with visible
submit feedback after the state/version changed. A generation-69 stale UI save returned `409`, recovered
with `GET /api/tenant/request` `200`, showed only the neutral conflict notice, and did not show success.
The fixture was reset to generation `70` with healthy `/api/health`.

**Disposition:** `F-19` is `CLOSED_VERIFIED`, `P2`, tracked by `RIGHTSPOT-041` / `RS-WO-041-01` within
the tenant request mutation-completion-feedback consumer boundary. No server, API, domain, persistence,
role, workflow, external integration, or notification-framework behavior changed.

## 9.10 Agent preparation validation boundary evidence — 2026-09-02

The Agent preparation flow continues to require an explicitly selected available slot for a slot
proposal. The rendered required control blocks an empty selection before the application command is
constructed; the authoritative server still rechecks slot identity and availability when a prepared
response is submitted. Preparation does not send, hold, or otherwise change the tenant-visible state.

Main exercised this boundary in isolated session `rightspot-audit-087` at generation `83` after a
normal tenant submission and Agent review start. No new business-flow defect was reproduced. The
fixture was reset to generation `84`; this does not add a new state, alter `RS-FLOW-09`, or claim a
multi-actor availability-concurrency flow beyond the current bounded fixture.
