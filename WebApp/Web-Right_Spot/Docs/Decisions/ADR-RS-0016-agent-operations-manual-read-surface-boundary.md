# ADR-RS-0016: Agent Operations manual read surface boundary

**Status:** Accepted — bounded post-proposal product decision  
**Decision date:** 2026-09-03  
**Owners:** Main RightSpot thread  
**Source review:** `RIGHTSPOT-010` / `RS-WO-010-01`, accepted `ADR-RS-0012`,
closed `RIGHTSPOT-015` and `RIGHTSPOT-016`, and current Main source at
`1f0ec339fbad273f6987ae8bc2b0e4ea68708c7d`

## Context

`RIGHTSPOT-010` proposed Agent Operations Insights as a second RightSpot product surface. Its
read-only Advisor report is complete, but the original proposal covered several different levels of
work: an Operations data authority, a pure projection, a manual report surface, and a later
page-authored WebMCP interaction.

The authority and projection portions have already been accepted and independently verified through
`RIGHTSPOT-013`, `RIGHTSPOT-015`, and `RIGHTSPOT-016`. The current source therefore contains a
separate deterministic Operations profile and two pure query families, but it does not contain an
Operations route, HTTP consumer, manual page, or navigation entry. The relay profile and its
tenant-to-agent workflow remain the primary application authority and must not be expanded to serve
as an analytics store.

This decision closes the proposal-level review while making the remaining next increment explicit.
It does not silently authorize WebMCP registration, natural-language parsing, mutation, or
historical analytics.

## Decision

### 1. Product surface

RightSpot will add one normal, agent-only, read-only Operations surface at:

```text
/agent/operations
```

The surface is a companion to the existing `/agent` request queue. It is not a replacement for the
Viewing Request workflow, a generic chatbot, an SQL console, or a separate reporting product.

The manual page is the first consumer of the already verified Operations authority and projection.
It must remain useful when WebMCP is unavailable.

### 2. Transport boundary

The manual page will read through:

```text
GET /api/agent/operations
```

The route is a transport adapter over the existing Operations profile store and
`projectOperationsProfile`. It must not duplicate filtering, counts, time rules, or privacy rules.

The query string has one required `kind`:

```text
kind=listingPipeline
```

accepts only `area`, `publicationState`, `lifecycleState`, and `minPublishedAgeDays` in addition to
`kind`.

```text
kind=upcomingViewings
```

requires `from` and `to`, and accepts only `status`, `area`, and `listingId` in addition to `kind`.
Dates use `YYYY-MM-DD`. The route must reject unknown or duplicate parameters, missing required
parameters, empty values, malformed values, and out-of-bounds values. It must not interpret natural
language, accept a client-selected profile or database path, or silently ignore an unsupported
parameter.

The response is the corresponding existing projection envelope, including `profile`,
`fixtureGeneration`, `timezone`, server-evaluated `asOf`, `dataAsOf`, `freshness`, normalized
`filters`, exact `totalCount`, `returnedCount`, `truncated`, and tenant-free result items. The route
must not add a second aggregate or reshape the projection into a less authoritative count.

The server resolves the demo session and requires the `agent` role. It uses the application-owned
Operations database path and the server clock for `asOf`; the client cannot supply either value.
The existing `agent-demo` assignment boundary remains authoritative.

The minimum public error mapping is:

| Condition | Response |
|---|---|
| No valid session | `401 UNAUTHENTICATED` |
| Tenant or unauthorized agent session | `403 FORBIDDEN` |
| Unknown, duplicate, malformed, or out-of-bounds query | `400 VALIDATION_FAILED` |
| Invalid Operations authority or persistence failure | `503` with bounded service error |

No raw exception, database path, private field, tenant identity, user-authored message, or internal
review note may cross this boundary. A valid zero-result query is `200` with an explicit empty item
collection. It must not fall back to another query, the relay profile, or an unfiltered report.

### 3. Accepted first-release query families

The manual surface exposes only the two families already accepted by `ADR-RS-0012` and
`RIGHTSPOT-016`:

- `listingPipeline`: current assigned listings filtered by the existing publication/lifecycle
  vocabulary and optional minimum publication age;
- `upcomingViewings`: current assigned requests in `SLOT_PROPOSED` or `VIEWING_CONFIRMED` with a
  valid selected slot inside the explicit inclusive-start/exclusive-end `Europe/London` date range.

The existing projection remains the semantic authority for stale age, selected-slot validity,
assignment, result cap, deterministic ordering, and current-state limitations. The page must not
invent historical trends, occupancy, relisting lineage, an intent score, or a count for a signal that
the Operations profile does not contain.

### 4. Manual UI and navigation

The agent navigation will expose an `Operations insights` entry only in the agent workspace. The
existing `Request queue` active state must not also appear active on `/agent/operations`; navigation
state is exact to the relevant route family.

The page must provide manual controls for both accepted query families and visibly show:

- the selected report and applied filters;
- `asOf`, `dataAsOf`, timezone, freshness, total count, returned count, and truncation state;
- loading, valid empty, validation error, service error, and authority-unavailable states;
- accessible headings, labels, visible focus, keyboard operation, and a truthful narrow layout;
- a canonical request link for an upcoming-viewing row where the existing Agent request route exists.

Listing-pipeline rows may show their authorized listing facts, but the first release must not invent an
Agent listing-detail route solely to provide a link. Charts, saved reports, pagination/cursors,
natural-language interpretation, and cross-surface search are deferred.

### 5. Ownership and staging

The next implementation is registered as [`RIGHTSPOT-044`](../Tasks/RIGHTSPOT-044-implement-agent-operations-manual-read-surface.md).
Its bounded sequence is:

1. implement and test the Operations application/HTTP consumer;
2. implement and test the manual Operations page and agent navigation entry after the response
   contract is frozen; and
3. independently verify the integrated manual surface against fresh relay and Operations resets.

The existing Operations authority and pure projection are read-only inputs to this work. Shared
session resolution, Operations store ownership, the relay workflow, and canonical documentation are
Main-owned. Parallel UI work may begin only after the response contract is frozen and must not modify
the authority or projection paths.

Only after the manual surface is independently verified may a separate decision and implementation
Task consider a small page-bound WebMCP query family. That later capability must use the same manual
query state and application service; it must not introduce a generic query tool or bypass the human
page.

## Alternatives considered

### Keep `RIGHTSPOT-010` pending until every later capability is implemented

Rejected. The proposal-level decision is reviewable and its accepted authority/projection work is
already complete. Leaving it pending obscures the real next gate and caused the task register to lag
behind the source.

### Add Operations reporting to the existing `/agent` queue page

Rejected for the first surface. A dedicated route keeps request handling and operational reporting
distinct, limits shared UI coupling, and gives a future page-authored capability a clear page scope.

### Read the relay snapshot directly or expand the relay fixture

Rejected. The relay fixture is a one-request workflow authority; using it as a report store would
weaken the challenge workflow and make multi-record metrics misleading.

### Add WebMCP before the manual page

Rejected. A manual result surface is required to make Agent interaction visible, recoverable, and
material rather than presenting a tool-only or chat-only claim.

## Consequences

- `RIGHTSPOT-010` is closed as a reviewed, staged decision rather than an implementation Task.
- `RIGHTSPOT-044` owns the next bounded product outcome; it does not reopen or alter the relay MVP,
  Operations authority, or pure projection.
- The first Operations page can demonstrate truthful current-state reporting without external
  authentication, Cloud Receiver, Redis, WebRTC, a reporting provider, or WebMCP.
- Historical analytics, interest-funnel metrics, external communication, and later WebMCP behavior
  remain explicit future decisions.

## Validation and reopen triggers

`RIGHTSPOT-044` must prove route/role isolation, strict query parsing, projection parity, exact
counts, empty/error/authority-failure behavior, current-state metadata, no private fields, relay
non-regression, manual UI recovery, keyboard access, and supported viewport behavior. These checks do
not prove WebMCP support, production authentication, deployment, or business value.

Reopen this ADR if the first release requires historical events, a new lifecycle vocabulary, a
separate Agent listing-detail authority, Favourite or Information Request metrics, mutation, external
communication, saved/scheduled reports, or page-authored WebMCP tools before the manual surface is
verified.
