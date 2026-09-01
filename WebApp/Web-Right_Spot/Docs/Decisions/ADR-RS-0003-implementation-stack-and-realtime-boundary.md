# ADR-RS-0003: Implementation Stack and Realtime Boundary

**Status:** Accepted
**Decision date:** 2026-08-31
**Decision owner:** Main RightSpot thread

## Context

RightSpot needs a modern, recognizable web stack that can deliver a stable ordinary web
application without making Cloud Receiver or WebMCP a first-phase dependency. The application
must preserve the accepted modular-monolith Backbone and leave a credible path for a later
browser realtime capability if that becomes valuable to the product or the Hackathon demo.

WebRTC is a browser standard for realtime audio, video, and data exchange. It is not a UI
framework, a backend language, or a complete hosted calling service. A usable WebRTC feature also
needs application-level signaling and, depending on network conditions, ICE/STUN/TURN handling,
media permissions, session authorization, and user-facing failure states.

## Decision

### 1. Use TypeScript end to end

TypeScript is the implementation language for the browser application and server-side application
code. This lets the domain states, role projections, request versions, and application contracts
share explicit types without introducing a second language for the MVP backend.

### 2. Use Next.js with React for the application

RightSpot will use:

- Next.js App Router as the application framework and route composition;
- React as the UI component model used by Next.js; and
- Node.js 24 as the reproducible server runtime.

Next.js and React are not competing language choices. React supplies the UI model; Next.js supplies
the application structure around it. RightSpot will not add Vite as a second frontend framework.
Route handlers remain thin adapters over the RightSpot application services and domain core.

### 2.1 Foundation toolchain

The first scaffold uses `npm` with a committed `package-lock.json`. Focused TypeScript tests and
development scripts use Node's built-in `node:test` through a pinned dev-only `tsx` runner. Exact
package versions are frozen in the active implementation Task before dispatch. No UI kit, ORM,
authentication provider, migration framework, or second frontend framework is part of this
foundation checkpoint.

### 3. Use SQLite as the initial durable store

The MVP will use one local SQLite composition, following the repository's existing Node SQLite
direction. SQLite is the source of truth for listings, Viewing Requests, availability, revisions,
and bounded audit facts. The persistence implementation remains behind the existing repository
boundary.

#### 3.1 First foundation implementation profile

The first runnable-foundation checkpoint uses Node's built-in `node:sqlite` through a server-only
RightSpot persistence module. It uses a file-backed development database at
`WebApp/Web-Right_Spot/var/rightspot.sqlite`, with no ORM and no runtime dependency on
`reentry-core`. The foundation may create one internal `foundation_metadata` table with only the
minimum metadata required to prove schema initialization and fixture-generation handling. That table
contains one singleton row keyed by `id = 1` and an integer `generation >= 1`; it must not create
business tables or the domain state machine ahead of their owning implementation checkpoint.

The foundation reset is a development operation, not the final `resetSyntheticFixture` contract. A
fresh database path initializes at generation `1`, and its first reset returns generation `1`; each
later successful reset advances the generation by exactly one in one SQLite transaction over the
metadata row. Opening an existing store or serving health must not advance the generation, a failed
reset must not partially advance it, and reset must not delete and recreate the database file.
Test runs use isolated temporary database files under the child application's ignored `var/test/`
directory, and a failed file-backed open must fail visibly rather than falling back to an in-memory
store. Test cleanup, when used, may target only an exact file created by that test. The exact
business schema, production migration policy, and multi-process ownership model remain open until a
real consumer requires them.

Node's built-in `node:sqlite` is accepted for this local foundation even though it is a
release-candidate API in the Node 24 line. Exact Node.js 24 verification is therefore a hard gate
for the foundation claim; this does not authorize substituting an external SQLite package or an
in-memory fallback.

The foundation health check is a neutral `GET /api/health` Node-runtime route. When the local
application composition and persistence boundary are ready, it returns HTTP `200`,
`application/json`, and the exact body `{"ok":true,"service":"rightspot"}`. A readiness failure
returns HTTP `503` with `{"ok":false,"service":"rightspot"}` and no diagnostic details. It does
not expose database paths, stack traces, credentials, or business data. The route runs on the Node.js
runtime, explicitly opts into the pinned Next.js equivalent of `runtime = "nodejs"` and
`dynamic = "force-dynamic"`, and sends `Cache-Control: no-store`; the application must remain a
server-capable Next.js build rather than a static export or Edge-only route.

### 4. Do not add Redis to the MVP

Redis is deferred. The MVP has no scale, shared multi-instance session, cache, background-job,
presence, live-chat, or realtime fan-out requirement that justifies another service. Redis must not
be added as a modernity signal or as a second source of Viewing Request truth.

Redis may be reconsidered only if a later implementation requires shared session state, a
multi-instance signaling fan-out, presence, or a concrete queue/stream workload.

### 5. Position WebRTC as a future Remote Viewing capability

WebRTC has a plausible product role in a later **Remote Viewing** feature: after a Viewing Request
is accepted, a tenant and agent could join a browser-based guided property viewing. This could be
valuable when remote access is part of the product thesis, but it is not required to prove the
current differentiator: one shared Viewing Request moving across role-scoped workspaces with a
visible human agent decision.

The RightSpot MVP therefore does **not** implement:

- `RTCPeerConnection` media sessions;
- camera or microphone permission flows;
- WebRTC signaling;
- STUN/TURN service configuration;
- WebRTC-specific persistence; or
- a fake realtime screen that is not backed by a working session.

The implementation must still preserve a thin future seam:

- browser-only realtime code must remain outside the domain core;
- a future realtime session must be a separate concept from the Viewing Request state machine;
- request identifiers, role authorization, and human decisions remain owned by RightSpot; and
- a future `RemoteViewingSession` may reference a confirmed Viewing Request without redefining its
  business truth.

No empty provider abstraction or unused WebRTC dependency is required at scaffold time. The seam
is an ownership and module-boundary decision, not a promise that a future feature already exists.

## Alternatives considered

### React + Vite with a separate Node API

This remains technically valid and would make the frontend/backend split explicit. It is deferred
for the MVP because it creates a second runnable process and deployment surface without a current
product need. It can be reconsidered if the application later needs an independently deployed
frontend or realtime service.

### Implement WebRTC in the first MVP

Rejected for now. It adds media permissions, signaling, network traversal, two-party test setup,
and failure handling before the accepted rental workflow is proven. It is a potential product
feature, not a prerequisite for the current Happy Path.

### Add Redis now for future realtime work

Rejected. WebRTC does not require Redis, and a single local application does not need a distributed
message broker. If Remote Viewing later becomes real and deployment requires cross-instance
signaling, Redis can be evaluated as an implementation detail at that time.

## Consequences

- Judges can recognize a current mainstream web stack without the MVP becoming infrastructure-led.
- The frontend and backend use one language while retaining clear UI, application, domain, and
  persistence boundaries.
- The ordinary rental workflow remains deterministic and runnable with one local process and one
  durable store.
- Deferring media does not require a domain rewrite because a future realtime session is kept
  separate from Viewing Request truth.
- A later Remote Viewing feature will still require a deliberate signaling, network traversal,
  privacy, permission, and browser verification plan.

## Validation and reopen triggers

Validate the accepted stack during `RIGHTSPOT-002` with a local build, deterministic reset, domain
tests, role/privacy tests, and a browser Happy Path walkthrough under the repository's Node 24
baseline.

Reopen this decision if:

- the product thesis makes remote or live viewing a required first-phase capability;
- the deployment becomes multi-instance and requires shared session or realtime coordination;
- the application needs an independently deployed frontend or realtime service; or
- the Node/SQLite composition fails the required local or deployment verification.
