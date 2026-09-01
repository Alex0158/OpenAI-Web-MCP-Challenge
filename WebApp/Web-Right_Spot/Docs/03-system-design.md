# RightSpot — Logical System Design

**Role:** Backbone architecture and component boundary  
**Status:** Accepted logical and implementation design baseline; runnable foundation, workflow domain core, and durable workflow persistence/application composition are independently verified; the bounded synthetic listing discovery decision is accepted, while session/transport and user-facing composition remain open

## 1. Design intent

RightSpot should first be built as an ordinary application with a coherent domain core. The
Backbone owns rental workflow truth, authorization, persistence, projections, and visible human
decisions. Cloud Receiver and WebMCP are later seams, not prerequisites for the first local
product slice.

## 2. Logical topology

```text
Tenant UI --------------┐
                        v
                   Application Backend
                        |
                 Domain / Workflow Core
                        |
              Persistence + Audit Store
                        ^
Agent Management UI ----┘

Future, separately gated seams:
Application Backend -> integration/event boundary -> external continuation transport
Application pages   -> page-bound Agent/WebMCP boundary
Browser client      -> optional realtime adapter -> future signaling/session service -> WebRTC
```

The diagram is logical. It does not select a framework, database, deployment provider, Agent
runtime, or transport.

## 2.1 Accepted implementation baseline

The first local composition is:

```text
Next.js App Router / React UI
             |
       TypeScript application services
             |
      TypeScript domain and workflow core
             |
        SQLite repositories and audit
             |
          Node.js 24 runtime
```

Next.js route handlers are transport adapters over the application services. They must not become
a second business-rule implementation. The browser-facing code may later contain a client-only
realtime adapter, but the domain core must not import WebRTC browser APIs.

The first foundation checkpoint follows the concrete scaffold profile in ADR-RS-0003: a server-only
Node `node:sqlite` boundary, one file-backed development store, and a neutral health route. This
profile proves the local composition only; it does not close the business schema or production
migration design.

Redis is not part of the first composition. It may be introduced only for a demonstrated shared
session, queue, presence, or multi-instance realtime requirement.

## Human-facing application surfaces

### Tenant marketplace

Provides bounded login, listing discovery, basic filters, listing detail, favourites, Viewing
Request drafting/submission, and request status. It is the public-facing side of the first human
Happy Path.

### Property-agent console

Provides bounded login, queue counts, request review, synthetic availability, proposal preparation,
and the human decision. It is the primary recipient surface for the first relay.

### Shared application services

Both surfaces call the same domain and persistence boundaries. They must not implement separate
state machines or duplicate request truth in the UI.

## 3. Backbone responsibilities

### 3.1 Application shell

Owns the tenant marketplace surface, agent management surface, navigation, visible state, forms,
loading states, and human decision controls.

### 3.2 Identity and role boundary

Resolves the current synthetic participant and role, then applies tenant or property-agent
permissions to every read and write. The initial implementation may use a deliberately bounded
demo authentication mode with seeded role selection, but it must not blur the two roles. The agent
queue is a direct projection of application state and may be refreshed manually; notification
delivery is not part of the MVP.

### 3.3 Domain and workflow core

Owns Listing, Viewing Request, Availability, request states, state transitions, version checks,
and the difference between preparation and human consequence.

### 3.4 Persistence boundary

Owns durable records and transactional state changes. The data layer must not be the place where
role policy is bypassed or arbitrary state values are accepted.

### 3.5 Projection layer

Builds role-authorized views of the same request. Tenant projections exclude agent-only notes;
agent projections include only the request facts and availability permitted to that agent.

### 3.6 Audit boundary

Records bounded, non-sensitive transition facts: actor role, request identifier, prior and next
state, request version, operation, and human decision. It must not record secrets or copied private
context.

### 3.7 Future integration and realtime ports

The application may later expose narrow ports for event notification, continuation, page
capabilities, or a Remote Viewing session. A future realtime session is separate from a Viewing
Request and can reference a confirmed request without changing its core state machine. These ports
must not become a second source of business truth and must not force the first slice to depend on
Cloud Receiver, WebMCP, WebRTC, or Redis.

## 4. Authority model

| Component | Owns | Must not own |
|---|---|---|
| Tenant UI | tenant-visible forms, state, and decisions | server truth or agent-only data |
| Agent UI | agent-visible queue, preparation, and decisions | tenant private context or arbitrary state changes |
| Application Backend | request truth, role authorization, versions, and transitions | external Agent activation authority |
| Domain Core | allowed states and business invariants | presentation-specific permissions hidden in the UI |
| Persistence | durable records and atomic writes | unaudited policy bypasses |
| Future integration adapter | bounded notification or capability handoff | request truth, role authority, or human decisions |
| Future realtime adapter | browser session coordination and media transport boundary | request truth, role authority, or unapproved media access |

## 5. Primary request flow

1. Tenant reads a listing through the tenant projection.
2. Tenant creates a draft with an expected listing version and request version.
3. Tenant explicitly confirms submission.
4. Backend validates role, listing, request state, and request version, then commits `REQUEST_SUBMITTED`.
5. Agent queue reads the request through the agent projection and may be refreshed manually.
6. Agent starts review, reads current availability, and prepares or edits a bounded response.
7. Backend stores the response as preparation, not as a sent proposal or confirmed viewing.
8. Agent sends the human decision in the normal UI.
9. Backend validates the decision and commits the next request state with a new version.
10. Audit records the transition without leaking role-private data.

## 6. Backbone invariants

- Backend state is authoritative; clients submit intents, not arbitrary state.
- Every write is role-checked and version-checked.
- Preparation and consequence are separate facts.
- One Viewing Request remains one shared artifact with role-specific projections.
- A role can never read another role's private notes or session context.
- The first fixture uses synthetic data and deterministic reset.
- No external integration is allowed to silently replace a local domain operation.
- Unsupported future integrations fail visibly rather than triggering hidden fallback behavior.
- WebRTC, if activated later, is a client/media capability behind a separate session boundary and
  is not embedded in the rental request state machine.

## 7. Open architecture decisions

- production normalized business schema and migration strategy (the local MVP snapshot boundary is
  accepted in ADR-RS-0006);
- authentication/session model;
- background event or notification mechanism;
- deployment and environment configuration;
- accessibility and responsive UI baseline; and
- the exact later boundary for Hackathon integration.
