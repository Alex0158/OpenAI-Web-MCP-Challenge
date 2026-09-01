# RightSpot — Product Definition

**Role:** Product thesis and scope boundary  
**Status:** Provisional working draft  
**Working name:** RightSpot  
**Source candidate:** Rental Marketplace Relay

## 1. Product concept

RightSpot is a rental-workflow application for moving a single Viewing Request between a tenant
and a property agent. Each role works from its own authorized surface. The request remains one
shared business record, while each participant sees only the projection and actions appropriate to
that role.

The first product promise is not “AI rental search.” It is:

> Keep one rental request moving across an asynchronous tenant–agent workflow without losing the
> current request, role context, availability facts, or human responsibility for the decision.

This is a hypothesis. It becomes product truth only after the team confirms the user problem,
workflow, scope, and evidence.

## Application baseline

The first RightSpot build is a stable demonstration host, not a complete commercial marketplace.
It should feel like a normal rental Web app when operated by a human: users can log in, find a
listing, inspect its details, request a viewing, and manage the resulting request; an agent can
review the request, inspect synthetic availability, and prepare a response.

The MVP is rental-only. Buying would add a second domain branch without improving the first
tenant-to-agent relay and is deferred.

## 2. Problem hypothesis

Rental viewing requests can wait while an agent triages a queue, checks availability, or waits for
another instruction. A human may receive a notification but still has to find the right request,
reconstruct what changed, inspect current availability, and decide how to respond.

RightSpot tests whether a role-scoped application workflow can make that handoff clearer and safer
by preserving one visible request record, current state, and a bounded preparation step before a
human decision.

The problem, frequency, severity, and target market are not validated yet.

## 3. Participants and jobs

### Tenant

The tenant searches a bounded synthetic inventory, prepares a viewing request, reviews it, and
confirms whether it may be submitted. After an agent response, the tenant may review and respond to
a proposed slot.

The tenant must not be charged, committed to a lease, or asked to provide real identity or payment
information in the first slice.

### Property agent

The property agent reviews incoming requests in a management surface, checks synthetic availability,
and prepares a proposed slot or decline response. The agent must make the consequential response
visible and explicit.

The agent must not expose internal notes to the tenant or access the tenant's private workspace.

## 4. Primary workflow

The initial RightSpot loop is:

1. tenant opens a synthetic listing;
2. tenant creates or revises a visible Viewing Request draft;
3. tenant explicitly submits the request in the normal UI;
4. the application commits `REQUEST_SUBMITTED`;
5. the agent sees the request in the authorized management queue;
6. the agent starts review, reads the current request, and inspects synthetic availability;
7. the agent prepares or edits a slot proposal or decline response;
8. the property agent sends the visible response; and
9. the tenant sees and confirms or declines a proposed slot, or sees the terminal decline state.

The tenant response is part of the MVP's normal application loop. It does not require a second
automatic continuation path. A later Hackathon integration may relay the agent response separately.

## Human-facing feature surface

### Tenant surface

The tenant surface provides bounded login, listing discovery, basic location and rental filters,
listing cards, listing details, images and core facts, a Viewing Request form, a request dashboard,
and a response action for a proposed slot. Favourites are useful but non-blocking.

### Property-agent surface

The agent surface provides bounded login, a request queue, basic workload counts, request details,
synthetic availability, proposal or decline preparation, an optional bounded response note, an
internal review note, and an explicit send decision.

### Feature priority

The first demo needs the two surfaces and the complete request loop. Favourites, bounded listing
status controls, and proposal notes may support the story but must not delay the primary loop. Live
chat, buying, payments, lease operations, and broad administration are deferred.

## 5. Product boundaries

### In scope for the first slice

- three to five seeded published listings, with one primary demonstration listing;
- one seeded tenant and one seeded property agent;
- one Viewing Request per resettable fixture;
- a tenant marketplace surface and an authenticated agent surface;
- role-specific projections and permissions;
- explicit synthetic availability slots;
- visible preparation and human decisions;
- deterministic reset and inspectable state; and
- enough audit information to explain the request transition.

### Out of scope

- payment, deposits, lease signing, or legal advice;
- real listings, real tenant identity, or real property data;
- landlord, CRM, calendar, messaging, or broker integrations;
- tenant ranking or sensitive eligibility inference;
- a general notification or chat product;
- multiple concurrent requests before one complete loop works;
- Cloud Receiver implementation as a first-phase dependency; and
- WebMCP or Agent-runtime integration before the ordinary application loop is coherent.

## 6. Value and differentiation hypothesis

RightSpot should be judged against a deterministic queue plus a human notification. Agent
assistance is useful only if it materially improves request reconciliation, current-state reading,
availability comparison, or response preparation while preserving human control.

The candidate's potential differentiators are:

- one shared Viewing Request rather than a copied prompt or disconnected message;
- separate tenant and agent projections;
- explicit privacy and authority boundaries;
- a visible prepare-before-decide workflow; and
- a future path for state-aware continuation after the original interaction ends.

None of these is a validated moat yet.

## 7. Success hypothesis

The first RightSpot slice is promising if a new evaluator can understand the problem quickly,
complete the tenant-to-agent workflow, see the request remain coherent across role surfaces, and
understand why the agent's preparation is useful without confusing it with an autonomous decision.

The measurable thresholds and evaluation method remain open and belong in a later decision record.
