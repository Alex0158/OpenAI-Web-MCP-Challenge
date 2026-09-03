# ADR-RS-0018: Role-page session lifecycle revalidation for page-bound capabilities

**Status:** Accepted — implementation frozen at local product commit `218935c`; independent browser verification pending  
**Decision date:** 2026-09-03  
**Owners:** Main RightSpot thread  
**Source review:** Current `RolePageFrame`, Tenant `search_listings` adapter, Agent Operations
`read_listing_pipeline` candidate, ADR-RS-0015, ADR-RS-0017, and the read-only `RIGHTSPOT-012`
audit checkpoint

**Implementation checkpoint (2026-09-03):** `RIGHTSPOT-048` Builder output was reviewed in Main and
integrated at `218935c`. The candidate is limited to the accepted shared frame, two page-bound
adapters, and four regression-test paths. Focused `35/35`, complete `215/215`, typecheck, production
build, repository validation, sensitive scan, and diff checks pass. Supported-browser lifecycle and
WebMCP evidence remains an open independent gate; this record does not yet claim closure.

## Context

RightSpot uses a deliberately small server-resolved demo session. Each role page reads the current
session during its initial mount, and the existing page-bound WebMCP adapters unregister and abort
when their React subtree unmounts. That is sufficient for an ordinary navigation or the local
sign-out button, but it leaves a lifecycle gap when the HttpOnly session cookie is changed or expires
outside the mounted page, such as in another tab.

The current `RolePageFrame` reads the session only once. The Tenant `search_listings` and the frozen
Agent Operations `read_listing_pipeline` candidates therefore remain mounted and registered until a
route or local component teardown. Their server calls still recheck role/session authority and do not
leak a private result, but a stale page-bound capability can remain callable after its page identity
has changed. The Agent `FORBIDDEN` response also cannot by itself be treated as a session change,
because an authenticated but unassigned Agent is an accepted bounded outcome.

This is a shared session-lifecycle concern, not an Operations-only feature request. It must be fixed
once at the shared page boundary and with adapter-side fail-safe handling, rather than by adding
separate polling or duplicating role logic in each feature page.

## Decision

### 1. Keep the server session endpoint authoritative

`GET /api/session` remains the only source of the current actor identity and role. The client never
infers a role change from a cookie, URL, WebMCP error text, or a client-supplied value.

The initial `readSession()` resolution remains the entry gate. After it resolves, each
`RolePageFrame` installs one bounded lifecycle monitor for its mounted role page:

- revalidate on `window` `focus`;
- revalidate on `document` `visibilitychange` only when the document becomes visible;
- coalesce overlapping lifecycle checks into one in-flight read;
- ignore a late result after the frame unmounts; and
- perform no timer polling, arbitrary retry loop, BroadcastChannel protocol, cookie parsing, or
  automatic sign-in.

Focus and visibility are lifecycle checkpoints, not a promise of continuous background session
observation. The server still rechecks every business/API read.

### 2. Reconcile actor identity and force child teardown

The lifecycle monitor compares the validated `{ id, role }` returned by the session endpoint with the
last accepted actor snapshot:

- the same actor identity is a no-op and does not remount the role surface;
- `null` means the session ended, so the frame clears its actor and unmounts role children;
- a different actor id or role replaces the frame snapshot and unmounts the previous role children;
- a valid different-role actor renders the existing wrong-role boundary; and
- a non-authentication session-read error does not invent a role change. It remains a bounded error
  state for the current frame and is retried only by a later explicit lifecycle checkpoint.

The authenticated child boundary is keyed by the accepted actor identity (`role` plus `id`). This is
required even when two successive actors have the same role: React must not preserve page state or a
page-bound WebMCP registration across an actor-id change. Existing child cleanup then aborts active
reads and aborts the adapter registration for both Tenant Discovery and Agent Operations.

### 3. Add invocation-side adapter fail-safe

The page monitor handles session changes observed at focus/visibility boundaries. Each page-bound
adapter also deactivates its own registration when the authoritative execution path proves that the
current capability is no longer valid:

- Tenant Search deactivates on `UNAUTHENTICATED` or its contract-defined wrong-role `FORBIDDEN`;
- Agent Operations deactivates immediately on `UNAUTHENTICATED`;
- Agent Operations does not deactivate on every `FORBIDDEN`, because an authenticated unassigned
  Agent must remain a bounded no-data result; after that response it may perform one session read to
  distinguish `null`/wrong role from an unassigned Agent; and
- if that confirming session read is unavailable, the adapter does not guess. It returns the existing
  bounded error and leaves the server authority in control.

This is a fail-safe deactivation path, not a fallback query, retry loop, role grant, or second data
authority. It does not change the accepted error union or expose raw diagnostics.

### 4. Preserve existing manual and business behavior

The repair changes only session reconciliation, child teardown, and capability lifetime. It does not
change the session API, role model, assignment rules, Operations/Search predicates, DTOs, fixture,
workflow state machine, navigation, or external authentication boundary. The ordinary manual page
remains the fallback when WebMCP is unavailable or deactivated.

## Required evidence

The implementation must use Red → Green → Refactor coverage for:

- same-actor focus/visibility checks without duplicate reads or remounts;
- session-ended, same-role/different-actor, and different-role transitions;
- hidden-document events, listener cleanup, unmount-before-settlement, and overlapping event
  coalescing;
- transient/non-authentication session-read failure without fabricated identity change;
- Tenant `UNAUTHENTICATED`/wrong-role deactivation;
- Agent `UNAUTHENTICATED`, wrong-role confirmation, and unassigned-Agent `FORBIDDEN` preservation;
- abort of in-flight page reads and removal of page-bound WebMCP registrations after teardown; and
- no fixture, workflow, Favourite, Viewing Request, Information Request, notification, or persistence
  mutation.

Independent supported-browser evidence must exercise both `/tenant` and `/agent/operations` with the
declared WebMCP flag: initial discovery, same-actor lifecycle no-duplication, external session
replacement/clear, actor-id/role transition, tool removal, page recovery, manual fallback, console and
page-error state, and persistent no-mutation readback. The `RIGHTSPOT-047` browser gate remains open
until this shared repair is independently verified and its frozen candidate is re-baselined and
re-verified.

## Alternatives rejected

### Poll the session continuously

Rejected. It adds background traffic and lifecycle complexity to a bounded local demo. Focus and
visibility checkpoints plus invocation-side authority checks cover the meaningful page-lifecycle
boundary without pretending to provide a realtime auth channel.

### Treat every Agent `FORBIDDEN` as a role/session change

Rejected. An authenticated but unassigned Agent is explicitly allowed to receive bounded
`FORBIDDEN`; deactivating its page capability would conflate assignment authorization with identity
resolution.

### Fix only `operations-webmcp.ts`

Rejected. The Tenant adapter has the same mount-only registration pattern, and a shared frame is the
smallest consistent owner for role-page identity and child teardown.

### Add a generic client auth provider or change the session API

Rejected. External authentication remains `RIGHTSPOT-006`'s credential-gated decision. This repair
uses the existing local session endpoint and does not authorize provider integration.

## Reopen triggers

Reopen this ADR before implementation if the browser requires a different lifecycle API, the session
endpoint cannot provide a validated actor snapshot, the repair needs server/API/schema changes, a
real-time cross-tab guarantee is required, or the product goal expands to provider-backed auth,
Cloud Receiver, WebRTC, Redis, deployment, or production session hardening.
