# RightSpot

**Role:** Independent child application inside the WebMCP Challenge repository  
**Working identity:** RightSpot — the rental-workflow candidate previously documented as
`Rental Marketplace Relay`  
**Status:** Accepted ordinary local MVP remains implemented and closed within its bounded business-state scope; the continuing cross-layer audit remains active, Tenant Discovery `search_listings` and Tenant registration-failure observability are verified within their declared boundaries, and the Agent Operations `read_listing_pipeline` candidate remains open pending its separate evidence path
**Implementation:** Tenant and agent role pages, durable workflow HTTP/DTO transport, Favourites, listing-interest projection, Agent Operations manual read surface, Tenant Discovery/WebMCP Search, local synthetic media, and responsive navigation are integrated; the Tenant `RIGHTSPOT-051` registration-observability repair is `CLOSED_VERIFIED` deterministically, while Agent-side `F-26` and the `RIGHTSPOT-048` integrated-browser evidence gate remain open/gated. The retained `F-08` route evidence gap is not a reproduced user-flow failure. The current complete suite passes `229/229` across 47 authored test files.
**Formal outer app-selection decision:** Pending

## Purpose

RightSpot is the first application we are developing in this main thread. It is a normal,
independently designed rental-workflow service nested inside the Hackathon submission repository.
Its product, domain, Backbone, application code, tests, and evidence belong in this folder.

The outer repository remains the governing submission and engineering environment. RightSpot does
not replace, fork, or modify the outer Re-entry Core. The outer application-selection decision is
still a separate governance gate; this folder is the working home for turning the candidate into a
real product rather than a reason to widen the reusable Core.

## Working product thesis

RightSpot helps a tenant and a property agent move one rental viewing request through an
asynchronous, role-scoped workflow. The tenant submits a request; the property agent reviews the
current request and synthetic availability; the agent prepares a viewing-slot proposal; and a
human remains responsible for the consequential decision to send a proposal or decline the request.

The candidate is valuable only if it proves more than rental search, a queue, or a notification.
The working differentiator is continuity of one shared Viewing Request across two role-specific
workspaces, with strict privacy boundaries and visible human decisions. This thesis remains a
product hypothesis until the first user-facing slice and validation evidence exist.

## Primary development slice

The first implementation target is a complete but deliberately narrow rental workflow:

```text
tenant logs in and finds a listing
-> tenant submits one Viewing Request
-> agent sees the request in the management queue
-> agent starts review and reads current request and synthetic availability
-> agent prepares and sends a slot proposal or decline
-> tenant sees the response and confirms or declines the proposed viewing
```

The tenant response is an ordinary application action in the MVP. It does not require a second
automatic continuation path. The later Hackathon integration can demonstrate one bounded
tenant-to-agent continuation without making the product depend on that transport.

## Accepted implementation baseline

RightSpot will use Next.js App Router with React and TypeScript, running on Node.js 24 with SQLite
as the initial durable store. Next.js is the application framework, React is the UI component
model, and TypeScript is the implementation language for both browser and server code. Vite is not
added as a second frontend framework, and Redis is not an MVP dependency.

WebRTC is reserved as a future browser realtime seam for a possible Remote Viewing capability. The
MVP does not implement media sessions, signaling, camera or microphone permission flows, or
STUN/TURN configuration. A future Remote Viewing session must remain separate from the Viewing
Request business state machine.

## Normal application feature map

RightSpot needs a stable application shell that can carry the later demonstration. It does not
need to become a complete commercial rental marketplace.

### Happy Path essentials

- tenant and property-agent login with bounded demo identities;
- tenant listing discovery with location and basic rental filters;
- listing cards and a listing detail page with images and core facts;
- a Viewing Request form with one to three preferred viewing times;
- tenant request dashboard with current status;
- agent dashboard with request queue and basic workload counts;
- agent request detail with listing, tenant request, and synthetic availability;
- agent proposal or decline preparation followed by a visible human decision;
- tenant-visible response details; and
- tenant confirmation or decline of a proposed viewing.

### Supporting and implemented features

- tenant favourites;
- a read-only agent listing-interest section with current versus available saves;
- a bounded response note attached to an agent proposal; and
- local synthetic media and responsive role navigation.

The Operations profile authority and projection are consumed by the Agent-only manual
`/agent/operations` page and strict `GET /api/agent/operations` route. The later
`read_listing_pipeline` Operations WebMCP capability is a separate frozen implementation candidate
whose independent browser gate remains open. Listing status edits are not implemented and are not a
hidden prerequisite for the MVP.

### Explicitly deferred

- buying and selling flows;
- payments, deposits, lease signing, and legal workflows;
- live chat and real-time messaging;
- live Remote Viewing, WebRTC signaling, and STUN/TURN infrastructure;
- full listing CRUD, landlord portals, CRM, calendar, or broker integrations;
- advanced matching, ranking, or sensitive eligibility inference; and
- production-scale account, moderation, and marketplace operations.

The first scope is rental-only. Buying can remain a future product direction rather than a second
branch in the first demo.

## Documentation map

- [`RUNBOOK.md`](RUNBOOK.md) — local routing, working rules, and verification workflow;
- [`Docs/00-current-status.md`](Docs/00-current-status.md) — current RightSpot truth and open gates;
- [`Docs/01-product-definition.md`](Docs/01-product-definition.md) — product thesis, actors, and boundaries;
- [`Docs/02-requirements.md`](Docs/02-requirements.md) — draft workflow and quality requirements;
- [`Docs/03-system-design.md`](Docs/03-system-design.md) — logical Backbone and component boundaries;
- [`Docs/04-domain-and-data-model.md`](Docs/04-domain-and-data-model.md) — entities, states, invariants, and projections;
- [`Docs/05-api-and-integration-contracts.md`](Docs/05-api-and-integration-contracts.md) — draft application contracts and future seams;
- [`Docs/06-validation-and-evidence.md`](Docs/06-validation-and-evidence.md) — validation plan, kill tests, and claims;
- [`Docs/07-business-flows-and-scenarios.md`](Docs/07-business-flows-and-scenarios.md) — canonical business chains, state transitions, role entry points, acceptance criteria, and current coverage;
- [`Docs/Decisions/README.md`](Docs/Decisions/README.md) — RightSpot decision-record routing;
- [`Docs/Decisions/ADR-RS-0004-thread-orchestration-pilot.md`](Docs/Decisions/ADR-RS-0004-thread-orchestration-pilot.md) — scoped experimental delegated-work decision;
- [`Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md`](Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md) — the Big Roadmap for implementation, validation, and closure;
- [`Docs/Decisions/ADR-RS-0003-implementation-stack-and-realtime-boundary.md`](Docs/Decisions/ADR-RS-0003-implementation-stack-and-realtime-boundary.md) — accepted implementation stack, Redis boundary, and WebRTC positioning;
- [`Docs/Decisions/ADR-RS-0006-durable-workflow-and-application-boundary.md`](Docs/Decisions/ADR-RS-0006-durable-workflow-and-application-boundary.md) — accepted local durable workflow snapshot and application-service boundary;
- [`Docs/Tasks/README.md`](Docs/Tasks/README.md) — bounded RightSpot work items; and
- [`Docs/Development/README.md`](Docs/Development/README.md) — implementation and verification records.

## Boundary rules

- Follow the outer repository rules in [`../../AGENTS.md`](../../AGENTS.md) and the workspace rules
  in [`../../../AGENTS.md`](../../../AGENTS.md).
- Keep RightSpot implementation and documentation changes inside this folder by default.
- Do not modify `reentry-core/`, `mvp/`, outer `Docs/Core/`, accepted outer ADRs, or Eddie's Cloud
  Receiver work to accommodate RightSpot.
- Treat Cloud Receiver and WebMCP as later integration boundaries, not first-phase product
  dependencies or design centers.
- Reuse an already accepted outer standard only when it fits without pulling RightSpot into the
  outer architecture.
- Keep all authored RightSpot artifacts in English.
- Record stable decisions in RightSpot documents; keep exploratory brainstorming provisional until
  it is promoted into a decision or current-state statement.

## Source inputs

The initial product material is extracted from the outer candidate record:
[`Rental Marketplace Relay`](../../Docs/Scenarios/05-rental-marketplace-relay.md).
The outer Core's challenge gates remain useful context, especially
[`Core/06`](../../Docs/Core/06-mvp-and-demo.md), but they do not define RightSpot's internal
architecture.

## Current non-claims

RightSpot does not yet claim a selected production application, validated customer demand, a deployed
service, a supported Cloud Receiver integration, universal WebMCP/browser support, probabilistic
agent success, WebRTC Remote Viewing, external authentication, or Hackathon submission readiness.
The verified local claims are limited to the ordinary local application, the Tenant
`search_listings` capability in its declared supported-browser runtime, and the Agent Operations
manual read surface; the separate Operations `read_listing_pipeline` candidate is not yet closed.
