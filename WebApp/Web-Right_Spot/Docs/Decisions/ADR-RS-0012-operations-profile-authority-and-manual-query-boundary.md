# ADR-RS-0012: Operations Profile Authority and Manual Query Boundary

**Status:** Accepted — bounded post-MVP authority decision; implementation gated  
**Decision date:** 2026-09-01  
**Decision owner:** Main RightSpot thread

## Context

`RIGHTSPOT-010` identified Agent Operations Insights as a second RightSpot product line, but the
accepted relay profile intentionally contains one tenant, one agent, one Viewing Request, and a
small listing fixture. `RIGHTSPOT-011` added and verified a pure projection over that relay state;
it is a reusable code seam, not a multi-record reporting authority. Expanding the relay snapshot to
serve reporting would change the closed tenant-to-agent Happy Path, its state vocabulary, persistence
shape, and reset contract.

`RS-WO-013-01` reviewed the current source and proposed a separate Operations profile. The main
thread accepts that direction with the scope reductions in this decision. The goal is to create a
truthful foundation for a later manually usable Operations page and, only after that page is verified,
a separately accepted page-authored WebMCP surface. It is not a production analytics system.

## Decision

### 1. Keep relay and Operations as explicit application profiles

RightSpot remains one application with shared server-side session resolution and role vocabulary, but
the data authorities are separate:

| Profile | Authority | Initial consumer | Reset boundary |
|---|---|---|---|
| `relay` | Existing singleton `WorkflowState` in the default RightSpot SQLite file | Existing tenant/agent workflow routes | Existing relay reset and fixture generation |
| `operations` | New multi-record Operations profile in a separate local SQLite file | Future `/agent/operations` manual read surface | Explicit Operations reset and generation |

The Operations database path is application-owned and deterministic, with the default local path
`var/rightspot-operations.sqlite`. A client must never select a profile or database path. Existing
relay routes, the relay `WorkflowApplication`, relay snapshot, and relay reset remain unchanged.
Operations routes will select the Operations profile in server code and will still resolve the current
session server-side. A valid agent session is necessary but not sufficient: listing and request reads
must also be limited to records assigned to that agent.

Separate files are chosen for the first increment because they make reset, rollback, source authority,
and accidental relay contamination easier to verify. A same-file multi-table design remains a later
alternative, not an implicit migration target.

### 2. Make the Operations profile a current-state authority, not a fabricated report

The first profile owns generated, synthetic, current records rather than hard-coded dashboard counts.
The smallest authority needed for the initial query families is:

- `OperationsListing`: stable identity, revision, title, area, current rent/facts required by the
  result, `publicationState`, bounded `lifecycleState`, assigned agent, and `firstPublishedAt`.
- `OperationsViewingRequest`: stable request identity, listing identity, assigned agent, current
  request state, selected slot identity where applicable, and the minimum timestamps needed for
  current query ordering.
- `OperationsAvailabilitySlot`: stable identity, listing identity, start/end instants, existing
  slot status, and selected request reference where applicable.
- profile metadata: schema version, fixture generation, deterministic seed version, `dataAsOf`, and
  source revision.

The first lifecycle vocabulary is deliberately bounded:

- `publicationState`: `PUBLISHED | UNPUBLISHED`;
- `lifecycleState`: `OPEN | UNAVAILABLE | LET_AGREED | ARCHIVED`.

`PUBLISHED`/`UNPUBLISHED` describe publication, not whether a listing is offerable. `OPEN` means
currently offerable for normal operational handling. `UNAVAILABLE` means not currently offerable
without asserting why. `LET_AGREED` is an explicit synthetic operational state, not proof of
occupancy or a lease document. `ARCHIVED` is retained historical identity outside active handling.

The first authority stores `firstPublishedAt` as an explicit fixture field so a stale-age query does
not misuse database creation time. It does not implement publication-period history, relist lineage,
request transition history, occupancy, lease facts, or historical analytics. Those require a later
decision and must not be inferred from the current snapshot.

The Operations profile contains no real tenant identity, contact data, private notes, message content,
Favourite records, Information Request records, notification state, or external communication facts.
The existing `RS-WO-011` module remains relay-only; a later Operations projection may reuse its
principles but must not silently treat its one-request output as Operations authority.

### 3. Define deterministic time and viewing semantics

- Internal timestamps are ISO instants.
- Calendar interpretation uses `Europe/London`.
- Date ranges are `[from, to)`, where boundaries are London local midnights.
- Tests inject `asOf`; a live manual request may use the server's current instant, but the response
  must expose the evaluated `asOf` and the fixture's `dataAsOf`.
- `dataAsOf` identifies the generated source snapshot; it is not a claim of live market freshness.
- A first-release manual query uses explicit structured date filters. Relative-language parsing such
  as “next Wednesday” belongs to a later page-authored Agent adapter, not the authority or persistence
  slice.

An upcoming `CONFIRMED` viewing requires a current request in `VIEWING_CONFIRMED` state and a valid
selected slot. An upcoming `PROPOSED` viewing requires `SLOT_PROPOSED` and a valid selected slot.
Preferred tenant times, drafts, expired requests, declined requests, and orphaned slot references are
not upcoming viewings. An invalid request/slot relationship is an authority failure, not an empty
result.

For the first listing pipeline, stale means `asOf - firstPublishedAt > threshold`; the first default
threshold is 90 calendar days. This is current-state age, not proof that a listing had no tenant
interest. If the explicit publication field is missing or invalid, the query must report authority
unavailable rather than substitute database creation time or return a misleading zero result.

### 4. Use a small deterministic fixture and independent reset

The first Operations fixture will contain enough records to make the result surface meaningful but
remain easy to inspect:

- five listings assigned to `agent-demo`, covering fresh/open, stale/open, unavailable, let-agreed,
  and archived states;
- one listing assigned to another synthetic agent for object-scope negative checks;
- four requests across the visible portfolio, including confirmed upcoming, proposed upcoming, active
  review, and a terminal record;
- at least six slots covering selected upcoming, available, and past cases.

The exact seeded values belong to the implementation Work Order. Counts must be derived from records;
the fixture must not contain dashboard-specific hard-coded totals. There are no Favourite or
Information Request records in this first profile.

Operations reset is explicit and separate from relay reset. It atomically replaces the Operations
snapshot and increments only the Operations generation. It must not delete or recreate a database file,
call relay reset, mutate relay generation, or silently fall back to in-memory data. Opening an empty
Operations file creates the deterministic fixture; opening an existing file validates schema,
generation, and state. Corrupt or incompatible state fails visibly. A clean-room reopen/reset must
reproduce the same fixture and result envelopes for the same injected `asOf`.

### 5. Freeze the first manual query boundary before WebMCP

The first consumer decision will cover a dedicated `/agent/operations` manual page and two bounded
read-only query families:

1. upcoming viewings, filtered by explicit date range and optionally status, area, or listing; and
2. listing pipeline, filtered by area, publication state, lifecycle state, or minimum published age.

Both queries must enforce an assigned agent, use explicit allowlisted parameters, derive counts and
rows from the Operations authority, and return a bounded result. The initial fixture is below the
result cap, so pagination/cursors are deferred; a fixed maximum of 25 rows must still be enforced and
the response must never silently imply that omitted rows were not counted. The response contract will
include profile, fixture generation, timezone, `asOf`, `dataAsOf`, freshness, interpreted structured
filters, exact `totalCount`, `returnedCount`, and items. A later contract may add a cursor only with a
separate decision.

The manual page is table-first with textual status and summary metrics. Charts, arbitrary SQL/query
language, natural-language parsing, exports, scheduled reports, mutations, notifications, contact,
and tenant-facing actions are deferred. Empty results are successful only when the authority is
complete and the filters are valid; unsupported Favourite/Information Request signals are omitted or
explicitly unavailable, never represented by fabricated zero counts.

Expected future transport semantics are `401` unauthenticated, `403` wrong role, `400` invalid or
unsupported parameters, neutral `404` for an out-of-scope object, `409` for a stale generation or
future cursor contract, and `503` for persistence or authority-unavailable failures. Exact shared
error types belong to the later transport Work Order.

### 6. Preserve privacy and authority

An assigned agent may see only the Operations records assigned to that agent and the bounded listing
facts needed for the operations table. No response may expose tenant IDs, contact details, tenant
notes, private review notes, message content, processed-command metadata, SQL, or another portfolio's
existence. A tenant may not access the Operations profile. A natural-language Agent request, when
eventually supported, may map only to parameters already accepted by the server; it cannot widen
portfolio scope or request private fields. The server rechecks role and object authorization on every
read.

### 7. Sequence future consumers

The accepted order is:

```text
Operations authority + profile reset
        -> governed Operations projection
        -> manual DTO/application transport
        -> manual Operations page and optional navigation entry
        -> independent browser/clean-room verification
        -> separate WebMCP decision and page-authored tools
```

The authority/persistence slice is the next implementation increment. It may add only new
Operations-specific domain, persistence, and focused test files and must not change relay source,
shared workflow types, existing HTTP contracts, routes, pages, dependencies, or WebMCP. A later
projection must use new Operations-specific paths rather than overload the verified relay
`operations-projection.ts`. Transport, page, navigation, and WebMCP are separate gates with explicit
ownership and source freezes.

## Alternatives considered

### Expand the relay profile

Rejected for the first Operations increment. It would turn a one-request workflow fixture into a
reporting store, change the closed Happy Path and reset semantics, and make it difficult to prove
whether a metric came from authoritative workflow state or a reporting convenience.

### Store only dashboard counts or use an external BI service

Rejected. Counts detached from records cannot support drill-down, privacy checks, clean-room reset, or
truthful evaluator evidence. An external service adds credentials and deployment scope without value
for this local demonstration.

### Same SQLite file with separate tables

Deferred. It may be useful later, but a separate Operations file gives a smaller initial rollback and
prevents relay reset or migration coupling.

### Add history and relist modeling now

Deferred. The first manual query needs explicit current fields and `firstPublishedAt`, not a general
event-sourcing model. Historical age, publication periods, and relist lineage must not be inferred.

### WebMCP or natural-language query first

Rejected. A manually usable, source-backed page is the recovery path and evidence surface. WebMCP
should later operate that page through bounded structured tools, not replace it with a chat-only or
SQL-like interface.

## Consequences

- RightSpot can develop a meaningful Operations demonstration without weakening the accepted relay
  workflow or waiting for unresolved Favourite/Information Request semantics.
- The first Operations profile is a separate synthetic demonstration authority, not production
  analytics or live market truth.
- Separate-file persistence introduces a second reset/opening path and requires explicit tests for
  profile isolation.
- The manual query and WebMCP surfaces remain gated behind independently verified authority,
  transport, and UI evidence.

## Validation and reopen triggers

The authority implementation must prove deterministic generation, atomic Operations-only reset,
reopen equivalence, invalid-state failure, assigned-agent scope, no relay mutation, and record-derived
data. Reopen this decision if the profile must share relay state, requires historical events or real
tenant/contact data, needs Favourite/Information Request metrics, introduces a new lifecycle state,
or proposes WebMCP before manual page verification.
