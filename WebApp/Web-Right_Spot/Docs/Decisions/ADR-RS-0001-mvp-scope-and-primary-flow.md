# ADR-RS-0001: RightSpot MVP Scope and Primary Flow

**Status:** Accepted as the RightSpot working MVP baseline  
**Decision date:** 2026-08-31  
**Decision owner:** Main RightSpot thread  
**Outer project status:** Formal Hackathon app-selection reconciliation remains separate

## Context

The Rental Marketplace Relay candidate contains a useful two-sided rental workflow, but a full
commercial marketplace would consume time without strengthening the first demonstration. RightSpot
needs a stable application host that can later carry one WebMCP and continuation integration path.

The MVP must therefore feel like a normal rental Web app while keeping the product surface narrow,
synthetic, resettable, and easy to understand.

## Decision

### 1. Product scope

RightSpot is rental-only for the MVP. Buying and selling are deferred rather than implemented as a
second domain branch.

The MVP has two roles:

- a tenant using a public marketplace surface; and
- a property agent using an authenticated management surface.

The shared business artifact is one Viewing Request. The first reset contains one demonstration
request at a time, even if the listing catalogue contains several seeded listings for a credible
discovery experience.

### 2. Primary application flow

```text
Tenant login
-> listing discovery and filters
-> listing detail
-> Viewing Request draft
-> tenant submits request
-> agent queue
-> agent request and availability review
-> agent prepares a slot proposal or decline
-> agent makes the visible decision
-> tenant sees the response
-> tenant confirms or declines a proposed viewing
```

The agent's response is a proposal or decline, not an automatic lease or irreversible commitment.
The tenant's final response is an ordinary application action in the MVP.

### 3. Minimum user-facing features

The MVP must include:

- bounded demo login for one tenant and one property agent;
- seeded listing discovery with basic location and rental filters;
- listing cards and detail view with images and core rental facts;
- Viewing Request creation with preferred viewing time(s);
- tenant request status dashboard;
- agent dashboard with request queue and basic counts;
- agent request detail and synthetic availability view;
- proposal or decline preparation;
- visible agent decision;
- tenant-visible response and confirm/decline action; and
- deterministic reset and basic audit/status history.

Favourites, bounded proposal notes, and simple listing status controls are supporting features.

### 4. Explicit deferrals

The MVP does not include buying, payments, deposits, lease signing, legal workflows, live chat,
real-time messaging, external email, calendars, CRM, landlord portals, advanced matching, tenant
ranking, real property data, or full marketplace administration.

Cloud Receiver, WebMCP, Agent continuation, and Local Connector behavior are future integration
boundaries. The ordinary RightSpot application must work without them.

### 5. Closed MVP business rules

The following rules close the first application workflow without expanding the product surface:

- The resettable fixture contains three to five seeded published listings, one primary demonstration
  listing, one seeded tenant, one seeded property agent, and at most one Viewing Request.
- A tenant may edit a draft until explicit submission. After submission, the request cannot be
  cancelled, rescheduled, reopened, or replaced until reset.
- The request progresses through `TENANT_DRAFT`, `REQUEST_SUBMITTED`, `AGENT_REVIEWING`, and either
  `SLOT_PROPOSED` or `AGENT_DECLINED`. A proposed slot ends in `VIEWING_CONFIRMED`,
  `TENANT_DECLINED`, or `EXPIRED`.
- Agent preparation is revisable and non-consequential. The agent's explicit send action is the
  human decision that publishes a proposal or decline; sent responses cannot be withdrawn in the
  MVP.
- Synthetic slots use explicit times in `Europe/London`. Sending a proposal holds an available slot,
  tenant confirmation confirms it, and tenant decline or expiry releases it. A proposal expires 24
  hours after it is sent, evaluated by the application clock without a background scheduler.
- The demo uses seeded role-specific login and one agent assignment. The agent queue reads the
  shared application state directly and may be refreshed manually; no notification transport is
  required.
- State-changing operations use one monotonic request version, reject stale writes, and do not
  duplicate consequences or audit entries when the same completed action is repeated.

## Consequences

### Positive

- The product has a complete human workflow rather than a disconnected technical screen.
- The main artifact and role boundaries remain easy to demonstrate.
- The later Hackathon path can use the existing request states without owning business truth.
- The first implementation can be built and tested as one bounded application.

### Costs and risks

- The rental problem, audience, and Agent value remain hypotheses until validated.
- A two-role flow still has more setup than a single-user demo.
- Favourites and supporting dashboard features can still become scope creep if not kept subordinate.

## Alternatives rejected

- **Build a general buying and rental marketplace:** rejected because it adds a second domain branch.
- **Make live chat part of the core:** rejected because it adds real-time state and moderation
  complexity without strengthening the first relay.
- **Stop after an agent proposal:** rejected for the normal app because the tenant needs a coherent
  visible outcome; the later automatic continuation can still remain one-sided.
- **Implement every agent administration function:** rejected because seeded inventory is sufficient
  for the first demo.

## Reopen triggers

Reopen this decision if user/problem evidence invalidates the tenant–agent workflow, the primary
demo cannot be understood or completed with one request, or the later integration requires a
different business state model.
