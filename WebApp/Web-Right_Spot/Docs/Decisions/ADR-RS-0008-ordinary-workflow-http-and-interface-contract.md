# ADR-RS-0008: Ordinary Workflow HTTP and Interface Contract

**Status:** Accepted — RightSpot local MVP implementation decision  
**Decision date:** 2026-09-01  
**Decision owner:** Main RightSpot thread

## Context

The RightSpot domain kernel, durable workflow/application boundary, and tenant listing discovery
API are independently verified. The ordinary human application loop still has no workflow command
transport or role-specific UI. The next implementation must allow a workflow transport Builder and
a shared-shell Builder to work in parallel, followed later by tenant and property-agent interface
Builders, without creating a second business authority or coupling the two role surfaces through
unowned files.

The Architecture Advisor review found that the current domain projections are not public DTOs:
the tenant timeline contains command and actor identifiers, while the agent projection is close to
the raw `ViewingRequest`. The normal no-request and empty-agent-queue states also need an explicit
wire meaning. A stable local HTTP contract is therefore required before role-specific UI work is
opened.

## Decision

### 1. Use one workflow transport boundary

The ordinary local UI consumes the following Next.js route-handler namespaces:

| Surface | Method and path | Purpose |
|---|---|---|
| Tenant | `GET /api/tenant/request` | Read the tenant request view, including the normal empty state |
| Tenant | `POST /api/tenant/request` | Create the one allowed request draft |
| Tenant | `PATCH /api/tenant/request` | Update the existing draft |
| Tenant | `POST /api/tenant/request/submit` | Explicitly submit the draft |
| Tenant | `POST /api/tenant/request/confirm` | Confirm the current slot proposal |
| Tenant | `POST /api/tenant/request/decline` | Decline the current slot proposal |
| Agent | `GET /api/agent/requests` | Read the assigned submitted/current queue and bounded state counts; drafts are not visible |
| Agent | `GET /api/agent/requests/:requestId` | Read one visible assigned request workspace; a tenant draft is non-visible |
| Agent | `POST /api/agent/requests/:requestId/review` | Start agent review |
| Agent | `PUT /api/agent/requests/:requestId/preparation` | Create or replace a response preparation |
| Agent | `POST /api/agent/requests/:requestId/send` | Send the authoritative prepared proposal or decline |

Route handlers are thin adapters over one application boundary. They must not implement state
transitions, inspect or mutate SQLite directly, or create a second listing/request fixture.

### 2. Derive identity and command metadata on the server

Every route resolves the actor from the existing bounded HttpOnly demo session. The client must not
submit an actor ID, role, agent assignment, next state, or arbitrary request ID. The server derives
the single fixture request identity and the target listing identity from the current authoritative
workflow where possible.

State-changing bodies are strict allowlists. They carry a client-generated bounded `commandId`, the
current `fixtureGeneration`, and the applicable expected request/listing versions. The operation
body shapes are:

- create draft: `commandId`, `fixtureGeneration`, `listingId`, `expectedListingVersion`,
  `preferredTimes`, and optional `tenantNote`;
- update draft: `commandId`, `fixtureGeneration`, `expectedRequestVersion`,
  `expectedListingVersion`, `preferredTimes`, and optional `tenantNote`;
- submit, confirm, or decline: `commandId`, `fixtureGeneration`, `expectedRequestVersion`, and
  `expectedListingVersion` where the domain command requires the listing revision;
- start review: `commandId`, `fixtureGeneration`, and `expectedRequestVersion`;
- prepare response: `commandId`, `fixtureGeneration`, `expectedRequestVersion`, a bounded
  `preparation` (`SLOT_PROPOSAL` with a slot ID or `AGENT_DECLINE`), and optional bounded
  `internalReviewNote`.

The send route accepts only command metadata and chooses the command from the authoritative prepared
response. It must not accept a client-selected terminal state. A repeated command with the same
identity and fingerprint returns the domain idempotent result; a conflicting reuse remains visible.

### 3. Publish role-specific DTOs, not raw projections

The public response envelope always includes the current `fixtureGeneration` and a bounded view.
Successful state-changing responses include the resulting request state and version. Public views
must not expose raw `WorkflowState`, `commandId`, actor IDs, `processedCommands`, assignment policy,
or internal persistence details.

The tenant request view contains only the tenant's request ID, listing ID, preferred times, tenant
note, state, version, sent tenant-facing response, proposal expiry, the tenant-safe `Listing`, and
a timeline reduced to non-sensitive sequence/operation/state/version facts. For a `SLOT_PROPOSAL`,
the view also contains a dedicated tenant-safe `viewingSlot` with exactly `startsAt` and `endsAt`,
resolved from the authoritative slot selected by the sent response and scoped to the request listing.
The value is retained for confirmed, tenant-declined, and expired response views, and omitted for an
agent decline, no response, or other response kind. It never carries slot status, holder, other
availability, or agent-private data. The view never contains `assignedAgentId`, `internalReviewNote`,
prepared response data, agent-only context, or raw actor identifiers. `GET /api/tenant/request`
returns `200` with `request: null`, `listing: null`, and an empty timeline when the fixture has no
request; that normal state is not a failure. A missing or wrong-listing sent-slot relation fails
through the existing bounded resource error; no client fallback may substitute preferences, guessed
data, or an opaque slot identifier.

The agent queue returns `200` with a deterministic list of assigned submitted/current requests and
bounded state counts; an empty queue is an ordinary empty result. A `TENANT_DRAFT` is private
pre-submission work and must be absent from both the queue and direct detail. The agent request view
contains only the assigned request facts, relevant listing facts, bounded availability, tenant-facing
note, agent preparation/sent response, proposal expiry, and permitted internal review note. It does
not expose processed-command records, unrelated workflow state, or arbitrary actor/session data. A
missing or non-visible request detail is `404`, distinct from an empty queue.

### 4. Keep error and freshness semantics explicit

The transport maps known failures as follows:

| HTTP status | Contract meaning |
|---|---|
| `400` | malformed body/query or bounded validation failure |
| `401` | absent or invalid demo session |
| `403` | valid session with the wrong role or assignment |
| `404` | missing request/listing/detail resource |
| `409` | stale request/listing version, fixture generation conflict, invalid transition, unavailable slot, expiry, or conflicting command identity |
| `503` | known workflow persistence failure |

Unexpected failures must not be converted into a false successful response. Error bodies remain
neutral and must not include stack traces, SQL, filesystem paths, cookies, credentials, or private
role context. On a `409`, the UI refetches the authoritative role view and shows a bounded stale or
conflict state; it must not blindly replay a changed command or patch terminal state locally.

All expiry and slot rules remain in the domain/application clock boundary. React components and
route adapters must not reimplement them.

### 5. Permit contract-based parallel presentation work

The workflow transport Builder is the single writer for the new workflow contract, DTO mappers,
workflow route handlers, and their focused tests. The shared-shell Builder is the single writer for
the root layout, sign-in/session navigation, global styles, and shared session UX; it may consume
the already verified session endpoints but may not edit server or workflow contract paths.

After these two outputs are frozen, tenant and agent interface Builders may run in parallel against
the accepted contract. Their route/page/component/hook/style/test paths must be disjoint, and the
main thread owns integration. A contract change, domain/persistence change, shared-shell change,
fixture identity change, or role-policy change requires re-baselining affected consumers before
they continue. Contract-parallel implementation does not claim integration or end-to-end evidence.

The minimum shared UI baseline is semantic landmarks and headings, labelled controls, keyboard
reachability, visible focus, text error/status feedback, responsive layout at narrow and wide
viewports, and no UI-only business-state authority. No UI kit, browser test dependency, or external
service is added by this decision.

## Alternatives considered

### Separate tenant and agent HTTP Builders

Rejected for the first transport increment. Session enforcement, error mapping, DTO privacy, and
application composition would be duplicated before their contract is stable.

### Presentation-only role pages with runtime mocks

Rejected. Mock request state would become a second authority and postpone stale-version, privacy,
and integration failures.

### One Builder for transport, shell, and both role interfaces

Rejected. The scope would be too broad for a falsifiable handoff and would remove useful ownership
and independent review boundaries.

### Make the API Verifier a hard blocker for every UI line

Rejected. Once this contract and the shared-shell boundary are stable, a UI consumer can make
bounded progress against them while API verification or later integration evidence remains pending.

## Consequences

- The first workflow API implementation has one owner and one public contract.
- The normal empty tenant request and empty agent queue are deterministic rather than overloaded
  error states.
- Tenant and agent UI work can later run in isolated Worktrees without sharing mutable source paths.
- The main thread must reconcile integration, contract drift, browser evidence, and final closure.
- The local demo session remains deliberately non-production authentication, and the application
  remains independent of Cloud Receiver, WebMCP, Redis, WebRTC media/signaling, and external services.

## Validation and reopen triggers

Validate the contract with strict body allowlists, role and privacy negatives, empty-state reads,
every declared domain error mapping, stale/generation/idempotency behavior, persistence failure,
and a complete resettable local request flow. Reopen if the single-request fixture no longer fits,
the role DTOs need a different authority boundary, the route contract requires a new dependency, or
the ordinary Happy Path needs a materially different user decision.
