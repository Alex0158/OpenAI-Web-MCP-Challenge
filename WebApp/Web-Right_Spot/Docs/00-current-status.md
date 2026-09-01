# RightSpot — Current Status

**Role:** Canonical current status for the RightSpot child application  
**As of:** 2026-09-01, Europe/London  
**Stage:** MVP scope, business-rules, Backbone, and implementation-stack baseline; runnable foundation independently verified, workflow-core domain core ready for independent verification
**Working product:** RightSpot — rental workflow / Rental Marketplace Relay
**Implementation:** Foundation Builder returned `READY_FOR_VERIFICATION`; the first `RS-WO-002-02` verification attempt was procedurally blocked by an out-of-scope OS temp artifact, then the corrected bounded rerun returned `VERIFIED` against the unchanged source/runtime identity; `RS-WO-002-03` domain-core Builder and one bounded projection-isolation repair returned `READY_FOR_VERIFICATION`, with T2 candidate commit `186e98a`

## 1. Executive status

RightSpot is the first working application target for this main thread. The existing outer
candidate material is sufficient to establish a product hypothesis, a primary workflow, initial
role boundaries, and a draft Backbone. It is not sufficient to claim that the final application
has been formally selected, validated, implemented, or integrated with the outer Re-entry Core.

The current task is to turn the candidate into a coherent ordinary web application while keeping
its product truth and architecture inside this folder. The first product slice is the one-sided
tenant-to-agent relay. The reciprocal agent-to-tenant leg remains optional.

The latest brainstorm establishes the intended application baseline: a stable but deliberately
bounded rental Web app that can later host the Hackathon integration. It is not intended to be a
complete commercial marketplace. The first build should prioritize a working human flow over
production-grade breadth or exhaustive edge-case coverage.

The accepted implementation baseline is Next.js App Router with React and TypeScript, running on
Node.js 24 with SQLite as the initial durable store. WebRTC is a future Remote Viewing seam, not a
first-phase media implementation; Redis is explicitly deferred.

The current MVP baseline is rental-only with two synthetic roles, a small seeded listing catalogue,
one primary demonstration listing, one Viewing Request, and a complete ordinary UI loop: tenant
discovery and submission, agent queue review and response, then tenant confirmation or decline. Only
the primary tenant-to-agent handoff needs a later automatic continuation demonstration; the tenant's
final response can remain a normal application action.

## 2. State matrix

| Surface | Current state | Boundary |
|---|---|---|
| Product name | **Working name: RightSpot** | Confirmed by the main-thread owner; brand details remain open |
| Candidate source | **Rental Marketplace Relay** | Extracted from outer scenario material |
| Preferred candidate set | **RightSpot and Sleepless Kingdom** | RightSpot is the current development target; outer formal selection remains pending |
| Product thesis | **Provisional** | MVP scope accepted; user/problem and workflow value still need validation |
| Primary slice | **MVP BUSINESS-RULES BASELINE** | Tenant request → agent review → slot proposal/decline → tenant response |
| Human application shell | **Provisional** | Login, listing discovery, listing detail, request management, agent queue, response status |
| Domain model | **MVP BUSINESS-RULES BASELINE** | Viewing Request, Listing, Availability, roles, transitions, and audit boundaries |
| Backbone | **LOGICAL BASELINE** | Modular-monolith responsibility is defined and remains the application authority |
| Implementation stack | **FOUNDATION VERIFIED** | Next.js App Router, React, TypeScript, Node.js 24, and SQLite; the runnable foundation passed the corrected independent verification contract, without claiming product-flow or deployment readiness |
| Foundation runtime readiness | **PREPARED / VERIFIED** | Exact arm64 Node.js `v24.20.0` is prepared outside the repository and passed version, npm, archive-checksum, and `node:sqlite` smoke checks; the default shell remains `v26.5.0`, and the Builder used the exact target runtime |
| Realtime / WebRTC | **DEFERRED FEATURE SEAM** | Future Remote Viewing is possible without making WebRTC or signaling an MVP dependency |
| Delegated development | **EXPERIMENTAL PILOT — TASK-OWNED** | `RS-WO-002-01` returned `READY_FOR_VERIFICATION`; corrected `RS-WO-002-02` rerun returned `VERIFIED`; `RS-WO-002-03` T2 source is frozen at candidate commit `186e98a`, awaiting independent verification |
| Cloud Receiver | **Not a first-phase dependency** | Future integration boundary only |
| WebMCP | **Not a first-phase design center** | Later Hackathon integration boundary |
| Runtime / deployment | **Not started** | No service, hosting, credentials, or public URL |
| Evidence | **FOUNDATION VERIFIED** | The corrected independent Verifier reproduced the frozen foundation contract with an unchanged manifest; this proves only local runnable-foundation behavior, not the tenant/agent product flow |

## 3. Confirmed working inputs

- Two roles are central: tenant and property agent.
- The shared business object is a Viewing Request.
- The candidate has a natural later transition: a tenant submits a request and the agent must
  review it.
- The agent needs a management-console view of the current request and synthetic availability.
- The consequential agent response must remain a visible human decision.
- The first slice should use a small synthetic listing catalogue, one primary listing, one tenant,
  one property agent, one request, and deterministic reset.
- The normal app should support tenant login, listing search/filter, listing detail, Viewing Request
  submission, tenant dashboard, agent queue, request review, availability review, a visible
  proposal/decline decision, and a tenant response to a proposed slot.
- The initial fixture should contain enough seeded listing variety for the discovery UI, while the
  judged flow uses the primary listing, one tenant, one agent, and one request.
- Rental-only is the current MVP decision; buying is deferred rather than implemented as a second
  workflow.
- Favourites, bounded proposal notes, and small listing-status controls are supporting features,
  not blockers for the primary relay.
- The tenant's final confirmation or decline is an ordinary application action; it is not a second
  automatic continuation requirement.
- The first judged consequence boundary is the agent's explicit proposal or decline send action;
  tenant confirmation or decline completes the normal application loop.
- The accepted implementation stack is Next.js App Router, React, TypeScript, Node.js 24, and
  SQLite. Vite is not added as a second frontend framework.
- Redis is not required for the MVP and is deferred until a concrete multi-instance, queue,
  presence, or realtime fan-out requirement exists.
- WebRTC is positioned as a possible future Remote Viewing capability. The MVP preserves ownership
  and module boundaries for it but does not implement camera, microphone, signaling, STUN, TURN, or
  media-session behavior.
- Payment, lease signing, real identity documents, live property data, external calendars, and
  broad marketplace features are outside the first slice.

## 4. Open decisions

- What exact user pain and audience will RightSpot validate?
- What concrete session implementation, transport, and deployment profile should implement the
  accepted logical contracts?
- What accessibility and responsive layout baseline should the application use?
- Which future Hackathon integration is necessary after the ordinary product loop works?

## 5. Next gate

The first `RS-WO-002-02` result is recorded as a procedural `BLOCKED`, and the corrected rerun is
now `VERIFIED` against the unchanged source/runtime identity. The bounded `RS-WO-002-03` domain-core
implementation and projection-isolation repair are ready for independent verification against frozen
candidate commit `186e98a`. Do not start another writer, pre-create downstream role assignments, or
claim the parent Task is closed.
The eventual implementation remains without Cloud Receiver, WebMCP, Redis, or WebRTC media
dependencies.

## 5.1 Current Work Order boundary

The parent `RIGHTSPOT-002` remains `in_progress`; the foundation Builder stopped after returning
`READY_FOR_VERIFICATION`, the first `RS-WO-002-02` attempt was `BLOCKED` on a procedure boundary,
and its corrected rerun is `VERIFIED` against the unchanged exact target Node.js runtime and
execution manifest. `RS-WO-002-03` Builder and bounded Repairer returned `READY_FOR_VERIFICATION`,
and T2 candidate source is committed as `186e98a`. Builder, Verifier, Repairer, and Integrator remain
sequential checkpoints of this same Task. No other product writer or repairer is active; the main
thread owns evidence writeback, Git closure, and the next checkpoint dispatch.

## 6. Non-claims

RightSpot currently does not claim a validated rental business, production-ready marketplace,
selected Agent runtime, Cloud Receiver compatibility, WebMCP proof, WebRTC Remote Viewing,
Redis-backed distributed operation, live deployment, or Hackathon submission readiness.
