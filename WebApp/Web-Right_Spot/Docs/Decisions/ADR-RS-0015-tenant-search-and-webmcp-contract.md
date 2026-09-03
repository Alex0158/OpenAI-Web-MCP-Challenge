# ADR-RS-0015: Tenant Discovery Search contract and read-only WebMCP boundary

**Status:** Accepted — first Tenant Discovery Search integration contract  
**Decision date:** 2026-09-03  
**Owners:** Main RightSpot thread  
**Source review:** `7f3ed02` and the current Main RightSpot source/runtime; Area semantics are
also recorded in [ADR-RS-0014](ADR-RS-0014-area-search-semantics.md)

## Context

RightSpot's ordinary Tenant Discovery flow already reads a published, tenant-safe listing
projection through the server application boundary. The first WebMCP direction is a read-only
Tenant goal: find published rental listings on `/tenant` and leave the page showing the same result
that the capability returns.

The current implementation has four useful filters but leaves several public meanings implicit. The
Area field is a free-text control with an unseeded `Shoreditch` example, the application calls the
availability input `availableFrom` while the UI says `Available by`, and the result order, source
identity, invalid/empty/unavailable behavior, and page/tool agreement are not one explicit contract.
ADR-RS-0014 resolved the Area direction but intentionally did not freeze the complete Search or
WebMCP boundary.

This decision closes that contract without turning the MVP into a generic marketplace search,
natural-language query engine, or second business authority. It is a semantic and integration
decision only. It does not claim that WebMCP is implemented or that the current source already
matches the accepted Area UI behavior.

## Decision

### 1. First goal and authority

The first capability is one authenticated Tenant goal on `/tenant`:

> Find currently published rental listings using a bounded combination of Area, maximum monthly
> rent, minimum size, and available-by date, and show the authoritative result on the Tenant page.

The logical capability is named `search_listings`. It is read-only and page-bound. It uses the
existing `readTenantListings` application authority and its tenant-safe listing projection. Neither
the ordinary UI nor a future adapter may query SQLite directly, implement a second predicate engine,
or use a client-supplied role or tenant identity.

`RIGHTSPOT-010` remains the separate Agent Operations proposal. It is not a dependency and is not
absorbed into this Search capability.

### 2. Accepted input contract

The first slice supports exactly these optional criteria:

```text
area?: string
maxRent?: safe integer, 1..100000 GBP per month
minSizeSqM?: safe integer, 1..10000 square metres
availableBy?: ISO calendar date, YYYY-MM-DD
```

The input is an object. Omitted properties mean “no filter”. `null`, unknown properties, duplicate
HTTP query parameters, empty supplied values, decimals, signs, exponent notation, and out-of-range
numbers are validation failures. All supplied criteria are combined with AND semantics. A request
with no criteria is a valid unfiltered Tenant catalogue read.

`availableBy` is the public user-facing and tool-facing name. The existing ordinary HTTP query may
continue to use `availableFrom` for compatibility, but the application/API adapter must map it to
the same `availableBy` meaning rather than expose two date semantics. The date is a date-only
calendar value, not a timestamp: a listing matches when its stored `availableFrom` date is on or
before the requested date. No timezone conversion, relative-date phrase, “today” rule, past-date
rejection, or current-clock dependency is introduced.

The numeric bounds reuse the accepted existing domain bounds. No bedroom, property-type, title/address
keyword, natural-language query, sort, pagination, saved search, geospatial expansion, ranking, or
recommendation criterion is part of this capability. An unknown criterion is rejected; it is never
silently ignored.

### 3. Area resolution and normalization

`listing.area` remains the only Area authority. It is a canonical display label, not a new `areaId`,
geospatial database, alias catalogue, or external location provider.

- Suggestion discovery uses the unique Area labels from the same current published, tenant-safe
  catalogue read, preserving first-seen source order. It does not add a second Area endpoint or
  source of truth.
- Suggestion matching is bounded, deterministic, trimmed, and case-insensitive prefix matching.
  A blank value is not an applied filter. Fuzzy spelling, accent folding, aliases, nearby areas,
  substring matching, and automatic ranking are excluded.
- Apply must resolve to one exact canonical Area label after shared trim and the existing English/
  RightSpot locale case-insensitive comparison. The UI may resolve an exact canonical typed value
  without a suggestion click, but it must not auto-select an unresolved prefix or ambiguous option.
- A selected/exact canonical Area is applied as exact equality against the canonical listing label.
  Surrounding whitespace is not meaningful; after trim, the normalized canonical label is echoed in
  the result.
- An unknown or unresolved Area is a bounded `VALIDATION_FAILED` outcome and does not trigger a
  catalogue read. A known canonical Area with zero currently published matches is a successful empty
  result. Neither case may fall back to the full catalogue.

### 4. Comparison, ordering, and result bound

The comparison rules are:

| Criterion | Rule |
|---|---|
| `area` | Exact canonical label equality after shared trim/case normalization |
| `maxRent` | `monthlyRentGbp <= maxRent` |
| `minSizeSqM` | `sizeSqM >= minSizeSqM` |
| `availableBy` | `availableFrom <= availableBy` |

Only `PUBLISHED` records enter the Tenant result. Matching records retain the authoritative
catalogue source order. There is no relevance, price, size, date, or client-controlled sort in this
slice; stable source order keeps the existing primary listing first and avoids an unreviewed ranking
claim.

There is no caller-defined `limit`, pagination, infinite scroll, or silent truncation. The local
MVP catalogue is bounded to the accepted three-to-five synthetic listings, so every matching record
is returned and `matchedCount` equals `listings.length`. If a future source can exceed that bound,
the Search contract must be reopened and an explicit result-cap/truncation contract accepted before
the adapter changes. An implementation must never silently drop records to fit an agent output size.

### 5. Logical result envelope

The tool-facing logical success envelope is:

```text
{
  fixtureGeneration: positive integer,
  appliedFilters: {
    area?: canonical string,
    maxRent?: safe integer,
    minSizeSqM?: safe integer,
    availableBy?: "YYYY-MM-DD"
  },
  matchedCount: non-negative integer,
  listings: TenantListing[],
  pagePath: "/tenant",
  pageState: "results" | "empty"
}
```

`fixtureGeneration` is the evaluated source snapshot identity. It is not a time-to-live, freshness
promise, or write version. `pageState` is `results` when one or more records are returned and
`empty` when `matchedCount` is zero. The ordinary HTTP response may retain its existing transport
shape (`fixtureGeneration` plus `listings`) while the shared application result and page adapter
derive the same normalized filters and page state; the adapter must not invent a second listing
projection.

`TenantListing` contains only the existing tenant-safe fields: `id`, `version`, `title`, `address`,
`area`, `monthlyRentGbp`, `bedrooms`, `sizeSqM`, `availableFrom`, `description`, and `imageKey`.
It excludes status, assigned agent, tenant identity, contact data, internal notes, workflow state,
audit ledger, command metadata, raw persistence fields, and arbitrary server text. Listing text and
media metadata are untrusted content, not instructions to an agent or to the adapter.

There is no `truncated` success state in this bounded first slice because truncation is prohibited.
If the source bound changes, a later ADR must add an explicit returned-count/cap/truncation schema
before implementation.

### 6. Error, empty, and concurrency behavior

The semantic error envelope remains `{ error: { code, message } }` with bounded stable copy. The
accepted meanings are:

| Code | Meaning | Page/tool behavior |
|---|---|---|
| `VALIDATION_FAILED` | Malformed, unknown, unresolved, null, duplicate, or out-of-range input | Do not read the catalogue; show actionable bounded feedback; do not claim a new result |
| `UNAUTHENTICATED` | No resolved Tenant session | No authenticated tool registration; ordinary session recovery remains in control |
| `FORBIDDEN` | Resolved actor is not the seeded Tenant | No tool registration and no listing result |
| `PERSISTENCE_ERROR` | Authoritative listing read is unavailable | Enter bounded unavailable/retry state; do not expose diagnostics or stale results as current |
| `INVALID_RESPONSE` | Client/adapter received malformed result data | Fail closed with bounded retry/error state; do not render partial data |
| `STALE_RESULT` | A local invocation was superseded, aborted, or lost its page/session context | Do not update the page or report success; the caller may retry the latest intent |

A valid zero-match query is success, not an error: the page shows explicit no-results copy and Clear
/manual-widen recovery. It never restores the unfiltered catalogue automatically. An invalid attempt
may retain the last accepted page result only if it is visibly separate from the validation message;
it must not label that result as matching the rejected input. An unavailable or malformed read must
withhold prior listing content from the current state and expose Retry.

Each read evaluates one authoritative snapshot. The latest page/tool invocation wins through the
existing request-sequencing guard. An older response cannot overwrite a newer result, empty state,
or error state. A source-generation change is not a write conflict: if the latest invocation returns
the new authoritative generation, it becomes the current page state. If route/session teardown or a
newer invocation prevents page acceptance, the older invocation returns/observes `STALE_RESULT` and
does not claim page agreement.

Repeated identical Search calls are idempotent reads and create no Favourite, Viewing Request,
Information Request, notification, lease, audit mutation, or other workflow effect. No automatic
retry loop, guessed correction, silent filter removal, or fallback query is allowed.

### 7. Page parity and manual fallback

The ordinary form and the WebMCP adapter use the same normalized Search semantics and the same
authoritative application read. A successful tool invocation updates `/tenant` through the same page
controller as a human Apply action:

1. the form visibly reflects the interpreted filters (`availableBy` maps to the `Available by` field);
2. the loading state is visible while the current read is pending;
3. the authoritative result, `fixtureGeneration`, count, and cards are rendered together; and
4. the page remains at `/tenant` with `results` or explicit `empty` state matching the tool envelope.

Clear performs the ordinary unfiltered read. Unsupported WebMCP, signed-out state, wrong role,
registration failure, tool cancellation, and tool errors leave the manual form and its recovery
path usable. A browser without WebMCP is still a valid ordinary MVP environment; it is not reported
as a successful WebMCP run.

### 8. Registration lifecycle and security boundary

The external WebMCP API remains a draft/browser capability and must be rechecked at implementation
and verification gates. The logical lifecycle is fixed:

- feature-detect the supported API; do not add WebMCP as a required application dependency;
- register only one `search_listings` capability after the server-resolved session is confirmed as
  Tenant and the current route is `/tenant`;
- expose the exact four-property schema and read-only metadata; do not register a generic search or
  tools on root, Agent, signed-out, wrong-role, or unrelated pages;
- bind execution to the current page/session controller and same-origin application boundary;
- cancel in-flight execution and unregister/replace the capability on unmount, route change, session
  change, role change, or loss of the relevant browser capability; and
- keep manual Search as the fallback and regression baseline.

The adapter must not bridge cross-origin frames, grant authentication, accept a role/tenant id,
return private fields, interpret listing content as instructions, or call Cloud Receiver, Redis,
WebRTC, external authentication, or a remote listing provider. The preferred implementation shape
is a thin page-authored adapter; the exact current supported registration API and cancellation method
remain an implementation-gate compatibility check rather than a frozen dependency claim.

### 9. TDD and evidence gate

The later implementation must use Red → Green → Refactor tests for at least:

- exact canonical Area, case/whitespace normalization, prefix suggestion, unresolved/unknown Area,
  and known Area with no published matches;
- all numeric/date inclusive boundaries, invalid date/number forms, omitted versus empty values, and
  AND combinations;
- published-only tenant authority, stable source order, bounded result count, and safe DTO fields;
- success, empty, validation, unavailable, malformed-response, stale/superseded, and retry states;
- manual/tool normalized-filter parity and page-state agreement;
- idempotence with no Favourite/Viewing Request/workflow mutation;
- signed-out/wrong-role registration absence and session/route lifecycle cleanup; and
- unsupported-browser manual fallback without fake registration or silent no-op.

Deterministic tests, typecheck, build, and ordinary browser checks do not by themselves prove WebMCP.
The implementation gate additionally requires supported-browser runtime discovery of the exact tool,
valid/invalid invocation, visible page agreement, lifecycle teardown, privacy checks, and clean
browser console/page-error evidence. Agent goal/parameter/result evaluation is reported separately
from deterministic application correctness.

## Alternatives considered

### Keep raw free-text Area equality

Rejected as the public contract. It makes the unseeded placeholder and partial input misleading and
does not give an agent a discoverable bounded value. The server-side equality predicate remains the
matching primitive, but the UI and tool now resolve a canonical value before applying it.

### Add fuzzy, alias, map, or universal keyword search

Rejected for the first slice. These options require a new taxonomy, ranking/ambiguity policy, data
authority, or evidence burden and would inflate the MVP without improving the selected proof enough.

### Add a caller-defined result limit or pagination now

Rejected. The synthetic catalogue is already bounded for the judged local slice. A future larger
catalogue needs an explicit output-size and truncation decision rather than an invisible cap.

### Register tools globally or expose the listing API directly to an agent

Rejected. Registration must follow the authenticated page/session boundary, and the application
authority must remain the only source of role-safe listing truth.

## Consequences

- The ordinary API retains a compatibility mapping for `availableFrom`, while the public Search
  language becomes `availableBy`.
- The ordinary Search implementation changes the Area interaction from raw free text to bounded
  canonical resolution at product code commit `534f5c9`; this is a product behavior change, not a
  WebMCP-only workaround.
- The integrated page-bound adapter remains thin because filtering, authorization, DTO projection, and
  page-state semantics are defined once; its source is recorded at product commit `ec7a679`.
- The first slice deliberately cannot claim fuzzy discovery, live inventory, ranking, pagination,
  broad keyword search, or a production-scale output contract.
- The ordinary Search portion of `RIGHTSPOT-043` is integrated at `534f5c9`, and the amended
  page-bound adapter source is integrated at `ec7a679`. Independent supported-browser registration,
  invocation, and lifecycle verification remain open gates; this ADR does not claim those gates have
  passed.

## Validation and reopen triggers

Reopen this ADR before implementation or expansion if the goal changes from Tenant Discovery, a new
location authority or data source is needed, a criterion requires ranking/geospatial/full-text
semantics, the result must mutate workflow state, the page cannot share one authoritative predicate,
the browser's supported WebMCP lifecycle differs materially, or a deployment/Cloud Receiver/
external-authentication boundary is introduced.
