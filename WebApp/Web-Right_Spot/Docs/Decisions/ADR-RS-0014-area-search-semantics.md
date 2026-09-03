# ADR-RS-0014: Canonical Area search semantics

**Status:** Accepted — bounded Tenant Discovery Search direction  
**Decision date:** 2026-09-03  
**Owners:** Main RightSpot thread  
**Source review:** `RIGHTSPOT-042` / `F-21`, reviewed against the Main source baseline at `b4c5a8a`

## Context

The Tenant Discovery page currently presents Area as an open text field with the placeholder
`e.g. Shoreditch`, although the seeded published catalogue contains `Islington`, `Haringey`, and
`Southwark`. The current application read lowercases the submitted value and applies exact equality.
This is operationally deterministic, but it makes a raw free-text entry such as `Isling` look like a
failed search rather than an incomplete selection. It also leaves the future ordinary UI and WebMCP
caller without a discoverable, shared location contract.

Strict comparison of unstructured user-entered text is not an appropriate rental-search experience.
Conversely, fuzzy spelling, geospatial aliases, and hidden neighbourhood expansion would introduce a
new location authority and make a first WebMCP read capability difficult to explain and verify.

## Decision

### 1. Area is a canonical structured facet

Area is a selected canonical listing-area label, not a general-purpose keyword query. The first slice
uses the existing `listing.area` string as the canonical value; it does not invent an `areaId`, add a
geospatial taxonomy, or create a second location authority.

The ordinary UI may accept partial text while the user discovers an Area. Suggestion discovery uses a
bounded deterministic, case-insensitive prefix match over canonical values. A later implementation may
choose a broader deterministic substring suggestion rule only through an explicit contract revision;
it must not silently introduce fuzzy ranking or aliases.

The value submitted to the shared Search boundary is the selected canonical label. The application and
the future WebMCP adapter must not treat an arbitrary unselected text fragment as an Area filter.

### 2. Shared normalization and matching

All callers use one normalization boundary:

1. trim surrounding whitespace;
2. compare case-insensitively using the existing English/RightSpot locale convention; and
3. resolve the normalized value to one canonical Area label.

The resulting catalogue predicate is exact equality against the canonical `listing.area` value. This
means `southwark` and ` Southwark ` resolve to `Southwark`, while `Isling` is only a suggestion query
and is not itself an applied Area filter.

### 3. Unknown and missing values

- No Area supplied means no Area restriction.
- A typed value that is only a prefix, or that resolves to more than one canonical suggestion, must
  be explicitly selected before Apply or WebMCP invocation. A typed value that resolves to one exact
  canonical label after shared trim/case normalization may be applied directly; the invocation still
  carries that canonical value rather than the raw prefix.
- A supplied value that does not resolve to a canonical Area is a bounded validation outcome. It must
  not silently become an empty full-text search, select a nearby Area, or restore the unfiltered
  catalogue.
- A valid selected Area with no currently published matches remains a truthful empty result. Empty
  results never trigger an automatic fallback.

The ordinary UI must provide a clear, recoverable message for an unselected or unknown value. The
WebMCP contract must expose the same distinction as an invalid argument or bounded validation error;
the complete public envelope and lifecycle are defined by the accepted `ADR-RS-0015` Search contract.

### 4. Boundaries

This decision does not add or authorize:

- fuzzy spelling correction, typo recovery, synonyms, borough/neighbourhood aliases, or geospatial
  proximity;
- a separate keyword field, full-text title/address search, ranking, recommendation, or map provider;
- a new Area metadata store or endpoint;
- a larger fixture merely to make the suggestion list look complete; or
- WebMCP registration, dependency installation, or Search UI implementation.

Suggestions and applied results remain read-only. Listing publication, tenant authorization, tenant-safe
DTO projection, and fixture generation remain governed by the existing authorities.

## Alternatives considered

### Exact comparison of raw free text

Rejected for the user-facing interaction. It is deterministic but makes partial input and the current
placeholder misleading. Exact comparison is retained only after the input resolves to one canonical
value; an exact canonical typed value may resolve without an additional suggestion click.

### Free-text prefix or substring filtering as the applied predicate

Deferred. It would make partial input return results, but it would also make the meaning of Area depend
on arbitrary text and create ambiguity when multiple canonical Areas match. It can be reconsidered as
a separately named keyword/location-search contract with its own ranking and result rules.

### Fuzzy or geospatial Area search

Rejected for the first slice. It requires a location taxonomy, confidence/ranking behavior, and a new
authority that are not justified by the bounded Tenant Discovery/WebMCP goal.

## Consequences

- Tenants get discoverable Area input without sacrificing deterministic result semantics.
- The ordinary UI and WebMCP can share one canonical Area contract rather than maintaining separate
  filter engines.
- The ordinary Tenant Search implementation now applies this decision at product code commit
`534f5c9`; the page-bound WebMCP adapter source is integrated at `ec7a679`, and the separate
supported-browser registration/invocation gate passed in `RIGHTSPOT-043` against the frozen local
supported-browser capability. This ADR remains the Area decision authority and does not by itself
replace the Task File's runtime evidence or claim production/universal WebMCP support.
- The complete Search schema, date naming, result ordering/bound, freshness envelope, page-state
  agreement, and WebMCP lifecycle are accepted in [ADR-RS-0015](ADR-RS-0015-tenant-search-and-webmcp-contract.md).

## Validation and reopen triggers

The later implementation must prove canonical suggestion discovery, trim/case parity, exact canonical
resolution, explicit selection for prefix/ambiguous input, unknown/unselected handling, exact result
membership, no fallback, tenant-only access, and ordinary UI/WebMCP parity. Reopen this ADR if the
product requires an Area taxonomy, aliases, geospatial matching, free-text applied semantics, a
separate keyword field, or a different canonical value model.
