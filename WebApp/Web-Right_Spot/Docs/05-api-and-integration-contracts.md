# RightSpot — Application and Integration Contracts

**Role:** Application boundary and future integration seams  
**Status:** MVP logical contract and implementation stack accepted; the ordinary local workflow
HTTP/DTO boundary is frozen by [ADR-RS-0008](Decisions/ADR-RS-0008-ordinary-workflow-http-and-interface-contract.md)

The complete scenario-to-route inventory and current implementation disposition are maintained in
[`07-business-flows-and-scenarios.md`](07-business-flows-and-scenarios.md). This document remains the
authority for operation semantics and DTO/integration boundaries.

## 1. Contract principle

RightSpot first exposes ordinary application operations around its own domain truth. The client
submits bounded intents; the backend resolves identity, authorization, current state, and request
version; the backend returns a role-authorized projection and an explicit result.

The ordinary local workflow endpoint names, body allowlists, role DTO boundary, empty-state semantics,
and error mapping are frozen by ADR-RS-0008. The implementation stack is governed by ADR-RS-0003 and
is not redefined by this logical contract document. Future integration transports remain separate.

## 2. Logical operation groups

### Session operations

- sign in by selecting the seeded tenant or property-agent demo identity;
- resolve the current role and session;
- sign out; and
- reset the bounded demo fixture through a development-only control.

### Tenant operations

- list or inspect synthetic listings;
- filter listings by bounded location, rent, size, or move-in criteria;
- add or remove a listing from the tenant's favourites as supporting functionality;
- create and update a Viewing Request draft;
- submit a Viewing Request;
- read the tenant's current request status; and
- confirm or decline a permitted slot proposal.

### Property-agent operations

- read the assigned submitted/current request queue; pre-submission tenant drafts are not visible;
- inspect one authorized Viewing Request;
- start review of a submitted request;
- read bounded synthetic availability;
- prepare a slot proposal or decline response;
- edit the prepared response while review remains open;
- send the prepared slot proposal or decline response; and
- record an internal review note.

### Fixture and development operations

- reset the synthetic fixture;
- inspect bounded development state; and
- emit test-only audit summaries.

These operations are logical capabilities. They must not automatically become public APIs before
authentication, authorization, error semantics, and data exposure are implemented.

## 3. MVP operation semantics

| Operation | Actor | State effect |
|---|---|---|
| `submitViewingRequest` | Tenant | `TENANT_DRAFT` → `REQUEST_SUBMITTED` |
| `startAgentReview` | Assigned agent | `REQUEST_SUBMITTED` → `AGENT_REVIEWING` |
| `prepareSlotProposal` / `prepareAgentDecline` | Assigned agent | preparation only; remains `AGENT_REVIEWING` |
| `editPreparedResponse` | Assigned agent | replaces preparation; remains `AGENT_REVIEWING` |
| `sendSlotProposal` | Assigned agent | `AGENT_REVIEWING` → `SLOT_PROPOSED`; holds slot |
| `sendAgentDecline` | Assigned agent | `AGENT_REVIEWING` → `AGENT_DECLINED` |
| `confirmProposedViewing` | Tenant | `SLOT_PROPOSED` → `VIEWING_CONFIRMED`; confirms slot |
| `declineProposedViewing` | Tenant | `SLOT_PROPOSED` → `TENANT_DECLINED`; releases slot |

Relevant reads and writes evaluate a proposal deadline through the application clock. A deadline
that has passed transitions `SLOT_PROPOSED` to `EXPIRED` and releases the held slot. No operation
may transition a terminal state to another state.

## 4. Request and response rules

Every write must carry or derive:

- authenticated actor and role;
- target entity identifier;
- expected monotonic request version;
- bounded operation input; and
- an idempotency key or equivalent protection where repetition could duplicate a consequence.

Every successful response makes the resulting state and request version explicit. State-changing
operations return the authoritative projection appropriate to the actor; they do not return the
other role's private fields.

Repeated submission or the same completed decision returns the existing result without a duplicate
request, slot consequence, or audit entry. A conflicting action, stale version, or invalid state
fails without mutation.

Errors distinguish at least:

- `UNAUTHENTICATED`;
- `FORBIDDEN`;
- `NOT_FOUND`;
- `VALIDATION_FAILED`;
- `STALE_VERSION`;
- `INVALID_TRANSITION`;
- `SLOT_UNAVAILABLE`;
- `EXPIRED`; and
- `FIXTURE_GENERATION_CONFLICT`.

Errors must not expose credentials, private Agent context, or stack traces.

## 5. Internal ports

The Backbone may define narrow internal ports for:

- `ListingRepository`;
- `ViewingRequestRepository`;
- `AvailabilityRepository`;
- `IdentityProvider` or demo session resolver;
- `Clock` for deterministic tests;
- `AuditSink`; and
- a future `ContinuationNoticePort`.

The first implementation should keep these ports small and use one concrete local composition.
No port should be introduced only to anticipate an unchosen provider.

## 6. Local application event seam

When the backend commits `REQUEST_SUBMITTED`, it may produce a RightSpot-owned internal event or
outbox intent for later delivery. The MVP agent queue reads authoritative request state directly
and is updated by normal reads or manual refresh; the event seam is not required for local
workflow completion and is not coupled to a remote service.

## 7. Future Cloud Receiver boundary

Cloud Receiver is not a first-phase dependency. If RightSpot later needs it, the integration must
be an adapter at the application event boundary:

```text
RightSpot domain transition
-> RightSpot-owned event/outbox intent
-> explicit integration adapter
-> external continuation service
```

The external service must never become the authority for Listing, Viewing Request state,
availability, role permissions, or human decisions. RightSpot must remain useful and testable
without that adapter.

## 8. Future WebMCP boundary

WebMCP, if later required for the Hackathon, belongs at the page capability boundary after the
normal UI and backend workflow are coherent. It must expose the same authorized domain operations
as the UI, not create a second business logic path.

The first phase will not add WebMCP registration, Agent wake semantics, or Cloud Receiver-specific
payloads merely to reserve names.

## 9. Open contract decisions

The remaining choices are implementation or later integration details:

- concrete session storage beyond the bounded local demo login;
- transport or serialization for future external integration;
- audit storage and development-only inspection surface;
- event/outbox representation and future external event mapping; and
- public versus internal operation exposure; and
- whether a future Remote Viewing capability requires a dedicated signaling service.

The accepted local baseline is Next.js App Router with React and TypeScript on Node.js 24, using
SQLite for initial durable storage. Redis, WebRTC media, and WebRTC signaling are not MVP runtime
dependencies.
