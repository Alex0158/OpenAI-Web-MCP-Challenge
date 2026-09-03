# ADR-RS-0017: Agent Operations WebMCP listing-pipeline contract

**Status:** Accepted — bounded implementation contract; no source implementation yet  
**Decision date:** 2026-09-03  
**Owners:** Main RightSpot thread  
**Source review:** `RIGHTSPOT-046` against Main documentation checkpoint `2f09d0a`; product
source remains the independently verified `RIGHTSPOT-045` checkpoint `3582ba4`

## Context

RightSpot has a verified ordinary Agent Operations read surface at `/agent/operations` and
`GET /api/agent/operations`. The surface is read-only, uses the existing Operations authority and
projection, and is useful without WebMCP. The first Tenant `search_listings` capability is also
verified in one declared local supported-browser capability, but that does not imply that every
Operations control should become a tool.

`RIGHTSPOT-046` was registered to decide whether one small Agent goal justified a separate Operations
WebMCP slice. An independent static review found that the initial proposal was directionally sound but
left several implementation-critical decisions open: static metadata and schema, exact Area and age
boundaries, response-field allowlisting, stale-result/error behavior, and the distinction between an
Agent role and an assigned Operations profile. This ADR closes those contract gaps. It does not claim
that the browser API is available everywhere, that an Agent can complete a natural-language goal, or
that the capability is implemented.

## Decision

### 1. Admit one bounded Agent goal

RightSpot admits one optional, read-only, page-bound capability:

> An authenticated Agent on `/agent/operations` can read the current listing pipeline for the
> server-assigned Operations profile, while the ordinary page visibly adopts the same authoritative
> result.

This is a selective follow-on to the verified manual surface. It is not a requirement to expose every
Operations report, route, button, or workflow mutation through WebMCP.

The logical tool identity is fixed as:

```text
name: read_listing_pipeline
title: Read listing pipeline
description: Read the assigned agent's current listing pipeline on the Operations page using optional area, publication state, lifecycle state, and minimum published age filters.
annotations:
  readOnlyHint: true
  untrustedContentHint: true
```

The actual supported browser registration and cleanup methods remain implementation-gate discoveries.
This ADR freezes the logical contract and static metadata, not a draft browser API beyond what can be
observed in the declared verification environment.

### 2. Role, route, and authority

The capability may be registered only inside the server-resolved Agent `/agent/operations` page
boundary. A client-supplied role, assignment, tenant identity, hidden flag, or tool argument never
grants access.

The invocation uses this single authority chain:

```text
page-bound tool -> existing Agent Operations HTTP/application boundary ->
Operations profile projection -> assigned-Agent-safe listing-pipeline result
```

The tool must not read SQLite directly, select a database path, duplicate predicates/counts, create a
second reporting model, or call the relay workflow as an analytics store. The ordinary page and tool
must consume the same application/API semantics.

An authenticated Agent may receive a registration before the page can establish whether the Agent has
an assigned Operations profile. Every invocation must recheck the assignment server-side. An unassigned
Agent receives a bounded `FORBIDDEN` result and no projection; registration presence is not evidence of
assignment. If a future page authority can prove assignment before registration, it may narrow
registration, but that is not required by this ADR and must not weaken the server check.

### 3. Exact input schema and semantics

The tool accepts an object with no required properties and `additionalProperties: false`:

```text
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "area": {
      "type": "string",
      "minLength": 1,
      "maxLength": 80,
      "pattern": "^(?:\\S|\\S.*\\S)$"
    },
    "publicationState": {
      "type": "string",
      "enum": ["PUBLISHED", "UNPUBLISHED"]
    },
    "lifecycleState": {
      "type": "string",
      "enum": ["OPEN", "UNAVAILABLE", "LET_AGREED", "ARCHIVED"]
    },
    "minPublishedAgeDays": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    }
  }
}
```

The fields mean:

| Field | Rule |
|---|---|
| `area` | Optional canonical Operations Area; exact, case-sensitive equality; 1–80 characters; surrounding whitespace is invalid, not trimmed; internal spaces are allowed |
| `publicationState` | Optional existing `PUBLISHED` or `UNPUBLISHED` value |
| `lifecycleState` | Optional existing `OPEN`, `UNAVAILABLE`, `LET_AGREED`, or `ARCHIVED` value |
| `minPublishedAgeDays` | Optional inclusive non-negative safe integer from `0` through `Number.MAX_SAFE_INTEGER`; this is a protocol bound, not a new business maximum |

Omitted fields mean no corresponding filter. Supplied fields combine with existing AND semantics. The
result cap, ordering, freshness, assignment, and state vocabulary remain owned by the existing
Operations projection. The caller cannot select `kind`, `limit`, pagination, sort, date range,
listing ID, free-text query, or another report family.

Empty strings, surrounding whitespace in `area`, malformed or non-safe numbers, decimals, negative
numbers, unsupported enum values, `null`, and unknown fields are bounded validation failures. A parsed
JavaScript object cannot preserve duplicate JSON object keys; duplicate-key rejection is therefore not
a WebMCP tool-input claim. The existing HTTP boundary continues to reject duplicate query parameters.
No natural-language parsing, alias lookup, fuzzy matching, prefix matching, or guessed filter removal
belongs in the capability. An Agent must resolve natural language to these structured arguments before
invocation.

### 4. Result and privacy boundary

Success returns the existing `listingPipeline` `OperationsApiResponse` semantics. The accepted logical
top-level allowlist is exactly:

```text
profile, fixtureGeneration, timezone, asOf, dataAsOf, freshness,
filters, totalCount, returnedCount, truncated, counts, items
```

The `filters` object contains only `kind`, `area`, `publicationState`, `lifecycleState`, and
`minPublishedAgeDays`. The `counts` object contains only the existing publication-state and
lifecycle-state enum keys. Each item contains only:

```text
id, revision, title, area, monthlyRentGbp, bedrooms, sizeSqM,
availableFrom, publicationState, lifecycleState, firstPublishedAt,
publishedAgeDays, stale
```

The future adapter must validate and reconstruct an exact allowlisted result. Returning a parsed
response through a type assertion is insufficient because unknown runtime keys could otherwise cross
the tool boundary. Unknown top-level, filter, count, or item keys fail closed. In particular, the
result must never expose tenant identity, contact information, notes, raw workflow ledger fields,
database paths, internal diagnostics, command metadata, or arbitrary server text.

The authoritative projection remains bounded by `OPERATIONS_PROJECTION_MAX_ROWS`, with its existing
`totalCount`, `returnedCount`, `truncated`, deterministic ordering, `asOf`, `dataAsOf`, and London
timezone semantics. A valid no-match read returns a truthful empty item collection and counts; it
never falls back to an unfiltered report or fabricates a listing.

Listing titles and other returned content are untrusted data. The tool and any evaluation harness must
not execute instructions embedded in listing content or treat a read result as proof that a state-
changing action occurred.

### 5. Page parity and one read identity

Manual submit and tool invocation share one page-owned executor/coordinator and the existing
Operations HTTP/application authority. The implementation must not create a second asynchronous state
machine beside the repaired `latestReadId` and unmount protections.

For a valid invocation:

1. the page controls reflect the accepted tool filters and the listing-pipeline report;
2. the page shows the normal loading state while the current read is pending;
3. the authoritative response is adopted with the same filters, counts, freshness, and item identity;
4. a valid empty result is adopted as a visible empty state; and
5. the tool returns the exact allowlisted response adopted by the page.

Invalid input fails before execution and must not replace the last accepted page result. For a read that
has started, the newest logical read remains authoritative regardless of settlement order. An older
success, error, `finally`, clear, or unmount callback cannot overwrite, clear, or re-label a newer
state. A superseded, aborted, route-torn-down, or session-changed invocation returns `STALE_RESULT` to
the tool caller and cannot claim page agreement.

### 6. Lifecycle and manual fallback

Registration is feature-detected and ephemeral:

- signed-out, Tenant, wrong-role, and unrelated routes register no Operations tool;
- `/agent/operations` may register at most one `read_listing_pipeline` tool for the current resolved
  Agent page/session;
- route departure, role/session change, capability loss, or unmount aborts or invalidates in-flight
  registration and execution;
- rerender does not create duplicate registrations; and
- a stale tool cannot remain callable in a different route, role, or session context.

When WebMCP is unavailable or registration fails, the manual Operations page remains fully usable
with its existing filters, loading/empty/error/retry states, navigation, keyboard access, and bounded
responsive layout. No fake registration, silent no-op, crash, hidden alternate transport, or claim of
Agent success is allowed.

### 7. Bounded error union

The tool exposes stable bounded errors only from this union:

```text
VALIDATION_FAILED
UNAUTHENTICATED
FORBIDDEN
PERSISTENCE_ERROR
AUTHORITY_UNAVAILABLE
INVALID_RESPONSE
STALE_RESULT
```

The mapping is:

| Condition | Tool result | Page effect |
|---|---|---|
| Missing session | `UNAUTHENTICATED` | No authenticated tool registration; manual session boundary remains authoritative |
| Tenant, wrong role, or unassigned Agent | `FORBIDDEN` | No projection; no private result |
| Unknown, malformed, empty/whitespace, duplicate HTTP, or out-of-bound input | `VALIDATION_FAILED` | No authoritative read; current accepted page result is not relabelled |
| Authority or persistence failure | `AUTHORITY_UNAVAILABLE` or `PERSISTENCE_ERROR` according to the existing server boundary | Bounded unavailable/error state with no raw diagnostics |
| Malformed authoritative response or extra runtime fields | `INVALID_RESPONSE` | Fail closed; no partial result |
| Superseded, aborted, teardown, or session-change execution | `STALE_RESULT` | Newer page state remains authoritative |

Network failures and unexpected service responses must map to a stable service-unavailable error in
the accepted bounded union; raw exceptions, HTTP text, stack traces, and database details never cross
the tool boundary. Error copy may remain implementation-local, but the code and safety semantics are
fixed by this ADR.

### 8. Explicitly excluded `upcomingViewings`

The first Operations capability is only `read_listing_pipeline`. `upcomingViewings` remains outside
this ADR even though its ordinary projection exists and is semantically defined. The current seeded
slots are date-sensitive to server-owned `asOf`; after the relevant date passes, the ordinary route
truthfully returns no upcoming rows. A non-empty supported-browser claim would therefore require a
deterministic clock/fixture strategy. The project will not weaken server time authority or accept a
client-controlled `asOf` merely to create demo evidence.

Reconsider `upcomingViewings` only after an explicit clock/fixture decision produces reproducible
non-empty evidence without changing the workflow authority.

### 9. Required implementation and verification gate

This ADR authorizes registration of a separate implementation Task, not source work by itself. That
Task must recapture the actual browser API, feature flag, origin, registration return value, cleanup
behavior, current Git baseline, and collaborator ownership before dispatch.

The implementation must use Red → Green → Refactor coverage for:

- exact metadata and schema, unknown fields, invalid enums, empty/whitespace/oversized Area, unsafe
  or non-integer age, and no natural-language parsing;
- Agent session, wrong-role, unassigned, route, registration, rerender, teardown, and unsupported-
  capability boundaries;
- exact allowlisted envelope/count/item reconstruction and injected-extra-field rejection;
- authoritative success, valid empty, unavailable, malformed response, retry, and bounded error union;
- manual/tool normalized-filter and page-state parity;
- overlapping manual/tool reads in both settlement orders, including stale success, error, `finally`,
  abort, unmount, route, and session transitions; and
- no Favourite, Viewing Request, Information Request, notification, persistence, relay, or fixture
  mutation.

Closure additionally requires, in the declared supported browser, observable tool discovery, one
valid invocation, invalid/error/empty behavior, page parity, exact role/privacy/lifecycle teardown,
no mutation, responsive/accessibility behavior, and clean console/page-error evidence. Agent
goal/argument/result evaluation is reported separately from deterministic application correctness.
The outcome remains local and bounded; it does not claim universal WebMCP support, production
readiness, deployment, Cloud Receiver compatibility, WebRTC, Redis, external authentication, or
probabilistic agent success.

## Alternatives considered

### Expose every Operations query as a tool

Rejected. One bounded listing-pipeline goal is sufficient to test value and integration cost. A broad
registry would increase privacy, lifecycle, and evaluation surface without an accepted user need.

### Register the tool globally for every Agent or route

Rejected. Page-bound registration is the least-privilege boundary and makes visible page parity
possible. Server assignment checks remain mandatory even when registration is role-gated.

### Reuse Tenant Search normalization for Operations Area

Rejected. Tenant Search's canonical suggestion/case-normalization contract is a different product
surface. Operations retains its existing exact, case-sensitive, no-surrounding-whitespace semantics
until a separate decision changes that authority.

### Return the raw parsed HTTP object

Rejected. TypeScript types do not remove runtime keys. Exact reconstruction is required to prevent
tenant/private/diagnostic fields from crossing the tool boundary.

### Add `upcomingViewings` now

Rejected for this increment. Its ordinary projection is available, but its non-empty browser evidence
is time-sensitive and not reproducible under the current seeded fixture without weakening authority.

## Consequences

- `RIGHTSPOT-046` is closed as an accepted contract decision through this ADR.
- A separate implementation Task may now be registered, with disjoint source/test ownership and its
  own browser capability and source-freeze gates.
- The ordinary Operations page/API, projection, fixture, role model, and Tenant Search adapter are
  unchanged by this decision.
- The future adapter must harden the shared consumer or reconstruct an exact tool result; privacy
  allowlisting is part of the implementation acceptance criteria, not an optional polish item.
- The active `RIGHTSPOT-012` audit remains non-blocking and may continue against the latest Main
  source. It does not authorize unrelated implementation or canonical writeback.

## Validation and reopen triggers

Reopen this ADR before implementation if any of the following changes:

- the user goal requires mutations, contact, notifications, natural-language parsing, a new report
  family, history, pagination, a new data authority, or a different Area semantic;
- the page cannot share one authoritative read executor and latest-read identity with the manual
  surface;
- the browser registration/cleanup lifecycle differs materially from the accepted page/session
  boundary;
- unassigned Agents must be excluded at registration rather than rejected at invocation, requiring a
  new assignment-capability authority;
- the output cap, privacy allowlist, error union, or source authority changes; or
- the project wants to claim support beyond the declared supported-browser evidence.

The safe rollback is to remove or disable the page adapter and preserve the ordinary Operations
UI/API behavior. No hidden fallback, weakened test, deleted evidence, or source-authority bypass may
be introduced to make the capability appear complete.
