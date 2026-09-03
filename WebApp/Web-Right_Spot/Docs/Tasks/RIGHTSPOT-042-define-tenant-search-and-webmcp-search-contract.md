# RIGHTSPOT-042 — Define Tenant Discovery and WebMCP Search Contract

**Type:** `decision`  
**Lifecycle:** `closed`  
**Priority:** `P1` for the first WebMCP/product integration gate; not a blocker to the closed ordinary MVP  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-02  
**Finding:** `F-21` — Tenant Area search discoverability and contract gap  
**Accepted partial decision:** Area is a canonical structured facet; see [ADR-RS-0014](../Decisions/ADR-RS-0014-area-search-semantics.md)  
**Accepted complete decision:** Tenant Discovery Search and read-only WebMCP boundary; see [ADR-RS-0015](../Decisions/ADR-RS-0015-tenant-search-and-webmcp-contract.md)  
**Depends on:** `RS-FLOW-02`; the existing Tenant listing application/API and DTO boundary; the staged [RightSpot WebMCP roadmap](../Development/RIGHTSPOT-WEBMCP-ROADMAP.md); and the accepted ordinary UI direction in ADR-RS-0009

## Task Control

- Type: `decision`
- Lifecycle: `closed`
- Execution posture: `MAIN_THREAD_SERIAL_CONTRACT_REVIEW`
- Priority: `P1` — this contract is the prerequisite for the first selected WebMCP Search capability, although it does not block the already-closed ordinary MVP.
- Owner: Main RightSpot thread
- Current increment: Completed — freeze one implementation-ready, read-only Tenant Discovery Search contract that resolves the current Area ambiguity and can be shared by the ordinary UI, the authoritative application/API boundary, and the first page-authored WebMCP adapter.
- Next gate: Completed by [`RIGHTSPOT-043`](RIGHTSPOT-043-implement-tenant-search-and-webmcp-adapter.md), which integrated the accepted source and passed independent supported-browser verification. This decision remains closed and should be reopened only if a contract boundary changes.
- Dependencies: The current published-listing authority, tenant role/privacy boundary, and ordinary `RS-FLOW-02` surface remain authoritative. `RIGHTSPOT-010` remains a separate pending Agent Operations/WebMCP proposal and is not an implementation dependency. External authentication, Cloud Receiver, WebRTC, Redis, deployment, and production readiness remain outside this task.
- Dispatch state: `not dispatched` — Main-owned decision and documentation checkpoint; no Builder, Verifier, dependency installation, WebMCP registration, or Worktree was authorized by this file.
- Evidence status: `ACCEPTED_CONTRACT_READY_FOR_IMPLEMENTATION` — ADR-RS-0014 and ADR-RS-0015 resolve the Area, criteria, result, error/freshness, page parity, role/privacy, and WebMCP lifecycle boundaries.

## Bounded objective

Define the smallest coherent Search contract for the first RightSpot WebMCP goal:

1. **Actor and surface:** an authenticated Tenant on `/tenant` searches the published rental catalogue.
2. **Capability:** a read-only, page-bound Search capability uses the existing listing authority and
   leaves the normal Tenant page showing the same authoritative result that the tool returns.
3. **Ordinary parity:** the normal human form and the WebMCP adapter use one shared Search semantic
   contract. Neither path may become a second filter engine or a second source of listing truth.
4. **Area resolution:** the contract explicitly decides whether `area` is a canonical exact facet,
   deterministic prefix/substring text, or another bounded rule. It must resolve the mismatch between
   the open free-text control, the `Shoreditch` placeholder, and the current seeded Area values.
5. **Bounded completeness:** the contract defines every supported criterion, normalization rule,
   combination rule, result/error envelope, freshness identity, no-result behavior, and manual fallback
   needed for the first Search slice without becoming a generic marketplace search or SQL interface.

This was a product/API/WebMCP contract decision task. It did not implement the Search redesign, add a
tool, install a WebMCP dependency, change the fixture, or change ordinary product behavior. Those
changes are now separately gated by `RIGHTSPOT-043`.

## Verified current state

### Current ordinary UI

- `src/ui/tenant/tenant-discovery-page.tsx` exposes four optional controls: `area`, `maxRent`,
  `minSizeSqM`, and a date control labelled `Available by`.
- The Area control is a free-text input with placeholder `e.g. Shoreditch`; it does not expose
  canonical values, suggestions, an input length hint, a result-preserving URL, or matching semantics.
- The UI trims a non-empty Area before sending it to the existing read path. It keeps loading, bounded
  failure, explicit empty-result, filtered-result, and Clear states.
- The existing `latestRequestId` plus unmount guard prevents an older catalogue response from replacing
  a newer result. The earlier stale-result defect was repaired separately and is not reopened here.

### Current authoritative listing read

- `src/server/application/listings.ts` reads only `PUBLISHED` listings for a Tenant.
- Area matching currently lowercases with `en-GB` and uses exact equality. `Southwark` and `southwark`
  match the same record; `Isling` does not match `Islington`.
- The direct application boundary rejects an Area with leading/trailing whitespace, while the ordinary
  UI normalizes that input before the request. The future WebMCP boundary must define one explicit
  normalization rule rather than rely on an accidental difference between callers.
- `maxRent` is inclusive (`monthlyRentGbp <= maxRent`); `minSizeSqM` is inclusive
  (`sizeSqM >= minSizeSqM`); the current `availableFrom` filter is inclusive as an “available by”
  comparison (`listing.availableFrom <= requested date`). The parameter name and UI label need an
  explicit contract decision before a new tool schema is frozen.
- Multiple filters are combined with AND semantics. A valid unknown Area currently returns an empty
  collection, not a validation error. Blank/whitespace Area and malformed numeric/date values are
  bounded validation failures at the existing HTTP boundary.
- The listing response is a tenant-safe DTO. It excludes listing status and assignment/private
  workflow fields while exposing the existing listing facts required by the card/detail surfaces.

### Current fixture and runtime evidence

- The current synthetic published catalogue contains exactly three Areas: `Islington`, `Haringey`, and
  `Southwark`; the UI placeholder `Shoreditch` is not one of them.
- Live loopback checks returned one result for `Southwark` and `southwark`, zero for the partial
  `Isling`, and the explicit no-results state in the browser. Clear restored all three listings.
- The max-rent, minimum-size, date, and combined filter paths returned the expected records. A
  user-like keyboard interaction with the native date control produced the expected filtered result;
  one automation `fill` path did not dispatch the controlled date change and is a harness limitation,
  not a confirmed product defect.
- The current local runtime is healthy at `/api/health`. The complete authored suite passes `159/159`,
  `npm run typecheck` passes, and the inspected browser error/warning log is empty.
- No WebMCP registration or WebMCP dependency exists in the current source. The existing roadmap
  requires a contract and supported-browser evidence before registration or implementation.

### Finding classification

`F-21` is a `P2` UX/contract gap, not a proven server correctness or data-integrity failure:

- **Real impact:** a user can follow the displayed Area example and receive no result because the
  example is not present in the catalogue; a partial or misspelled value gives no indication that the
  current rule is exact equality; WebMCP would otherwise inherit the same ambiguity.
- **Not reproduced:** an API filtering failure, stale-response regression, unauthorized listing read,
  privacy leak, malformed result, or loading/error-state failure.
- **Evidence gap:** the tiny fixture cannot demonstrate several matches for one Area or a meaningful
  ordering decision. This must be addressed in the later contract/test plan without inflating the
  product catalogue merely for visual volume.
- **No automatic fix implied:** the task does not assume that fuzzy matching, map search, aliases,
  hidden fallback, or a larger seed catalogue is the correct answer.

## Contract decisions required

The Main thread must record a decision for every item below. “To be decided” is not implementation
permission.

### 1. Search goal and first capability — accepted

The default proposal is:

- **Goal:** help a Tenant find published rental listings by bounded structured criteria and inspect the
  resulting cards in the normal Tenant Discovery page.
- **Page:** `/tenant`.
- **Role:** authenticated `tenant` only.
- **Tool shape:** one read-only capability named `search_listings`, with exactly the four optional
  criteria accepted in ADR-RS-0015; no `limit`, `query`, sort, or pagination field.
- **Authority:** the existing `readTenantListings` application boundary behind a thin page adapter;
  no direct SQLite access and no duplicate predicate implementation.
- **Result:** the ADR-RS-0015 logical envelope containing normalized filters, `fixtureGeneration`,
  `matchedCount`, the existing tenant-safe listing projection, `/tenant`, and `results`/`empty`
  page state; no chat-only answer is sufficient.

The accepted meaning of “comprehensive” for this first slice is the existing four bounded filters
only. It does not turn `area` into a universal query.

### 2. Area semantics

**Partially accepted on 2026-09-03:** [ADR-RS-0014](../Decisions/ADR-RS-0014-area-search-semantics.md)
accepts Area as a canonical structured facet rather than an absolute match over raw user text:

- ordinary UI suggestion discovery is bounded and deterministic, using case-insensitive prefix matching
  over canonical values;
- the applied Search boundary receives a selected canonical `listing.area` label, after shared trim
  and case-insensitive normalization;
- an unselected fragment is not an applied Area filter, and an unknown value is a bounded validation
  outcome;
- a selected Area with no currently published matches remains a truthful empty result with no fallback;
  and
- fuzzy spelling, aliases, geospatial expansion, ranking guesses, and a universal keyword query remain
  outside the boundary.

This resolves the raw-text versus canonical-facet ambiguity. ADR-RS-0015 now defines the public error
envelope, suggestion-source read boundary, exact UI resolution behavior, result parity, and the
relationship between the ordinary API and future WebMCP schema.

### 3. Criteria and comparison semantics — accepted

The accepted contract explicitly defines:

- whether the first slice supports only `area`, `maxRent`, `minSizeSqM`, and `availableBy`/the existing
  `availableFrom` mapping, or adds `query`, bedrooms, or another criterion;
- whether every supplied criterion is ANDed;
- inclusive/exclusive comparison for rent, size, and availability;
- whether dates are calendar dates in `Europe/London`, and whether “Available by” means listing
  availability on or before the requested date;
- maximum string length, integer ranges, date format, maximum number of criteria, and result cap;
- ordering and determinism when several records match; and
- whether URL/share/reload persistence is part of the ordinary UI contract or explicitly deferred.

The contract must reuse current safe bounds unless a deliberate product decision changes them. A larger
bound, bedroom filter, keyword search, sort, pagination, geospatial search, saved search, or ranking
feature is not implied by the phrase “powerful Search”.

### 4. Empty, invalid, unavailable, and stale states — accepted

The accepted outcomes are separate for:

- valid criteria with zero matches: successful empty result, explicit no-results copy, Clear/widen
  recovery, no automatic unfiltered fallback;
- syntactically invalid input: bounded validation error before an authoritative read;
- valid but unknown Area: either empty result under a free-text contract or a bounded invalid/canonical
  value response under a selected-value contract; one rule must be chosen;
- unavailable or malformed authoritative response: bounded failure, no raw server diagnostic text,
  no stale result labelled current, and a manual retry path;
- source/generation change during a read: latest authoritative result wins and the response must expose
  enough identity for the page/tool to explain the evaluated source;
- duplicate tool invocation: read-only and idempotent with no state mutation; and
- unsupported WebMCP: ordinary UI remains fully usable without invented success, silent no-op, or
  app-wide failure.

### 5. Result and page-state contract — accepted

The accepted contract specifies:

- the exact tool result envelope and whether it includes `fixtureGeneration`, applied normalized
  filters, `matchedCount`, result cap/truncation, and a canonical page path;
- the exact tenant-safe listing fields returned, with no status, assignment, private workflow, actor,
  contact, internal-note, raw ledger, or database fields;
- the page loading, success, empty, unavailable, retry, and unsupported-capability states;
- whether a tool invocation changes the form controls and how the human can see what was interpreted;
- whether a result is considered current only when the page and authoritative response agree;
- how a truncated result is disclosed, if a cap is introduced; and
- how listing title, address, description, image metadata, and other content are treated as untrusted
  content rather than model instructions.

### 6. Identity, role, and lifecycle — accepted

The first capability must obey all of the following:

- availability derives from the server-resolved Tenant session and current `/tenant` page, not a
  client-supplied role or hidden flag;
- signed-out and wrong-role pages expose no authenticated Search tool;
- registration is page/capability scoped and is removed or replaced when session, route, or relevant
  capability context changes;
- tool registration never grants authentication or listing access;
- a read-only Search cannot create or change a Favourite, Viewing Request, Information Request,
  notification, lease, or any workflow state; and
- the ordinary manual Search remains the recovery and baseline path when WebMCP is absent.

### 7. Compatibility and external boundary — accepted

The decision record includes, without implementing:

- the currently supported WebMCP API surface and browser/flag/origin assumptions to recheck at the
  implementation gate;
- the TypeScript/runtime evidence needed to prove actual registration and invocation, not merely a
  compiling wrapper;
- the fact that the WebMCP specification/browser support may change before implementation;
- that Cloud Receiver, WebRTC, Redis, external authentication, and deployment are not dependencies of
  this read-only contract; and
- the manual fallback and judge-evidence boundary for a browser without WebMCP.

## Historical candidate first-slice contract

This subsection is retained as the pre-acceptance proposal. ADR-RS-0015 is the accepted canonical
contract and supersedes this candidate where they differ.

```text
Capability: search_listings                         # provisional name
Role: tenant
Page: /tenant
Mode: read-only

Input (candidate):
  area?: canonical string, case-insensitive after shared trim
  maxRent?: safe integer within the existing monthly-rent bound
  minSizeSqM?: safe integer within the existing listing-size bound
  availableBy?: ISO calendar date in Europe/London  # maps to existing "availableFrom" semantics

Semantics (candidate):
  supplied criteria are ANDed;
  area is an exact canonical facet;
  maxRent, minSizeSqM, and availableBy are inclusive;
  unpublished records are excluded;
  a valid empty match is successful and never falls back to all listings;
  read execution does not mutate RightSpot state.

Result (candidate):
  source/generation identity;
  normalized applied criteria;
  matched count and bounded tenant-safe listing records;
  explicit empty state; truncation is prohibited for the bounded first slice;
  visible page-state agreement at /tenant.
```

Main accepted and revised this candidate through ADR-RS-0015. The code block remains historical
context and is not an implementation schema.

## Business scenario and acceptance matrix

The final contract must provide an observable answer for each scenario below.

| Scenario | Input | Expected business result | Required boundary |
|---|---|---|---|
| Unfiltered Tenant discovery | no criteria | all current published tenant-safe listings | no mutation; deterministic source identity |
| Canonical Area match | selected `Southwark` | only matching published listing(s) | exact canonical equality |
| Case/whitespace normalization | ` southwark ` | same result as normalized `Southwark` | shared trim and case-insensitive resolution |
| Partial Area | `Isling` | bounded validation failure; no catalogue read | no prefix auto-selection or fuzzy behavior |
| Unknown Area | `Camden` | bounded `VALIDATION_FAILED` outcome | never restore full catalogue |
| Rent boundary | exact listing rent and one below | inclusive result boundary as documented | integer/range validation |
| Size boundary | exact listing size and one above | inclusive result boundary as documented | integer/range validation |
| Availability boundary | exact date and one earlier date | listing is included on the exact date and excluded when its availability is later | date-only `availableBy`, inclusive on/before |
| Combined criteria | Area + rent + size + date | intersection only | AND semantics and stable ordering |
| Unpublished record | criteria that would otherwise match an unpublished record | record absent | server authority, not UI hiding |
| Empty result recovery | valid no-match criteria | explicit no-results plus Clear/widen/manual recovery | no silent fallback |
| Invalid input | malformed/empty/duplicate/unknown/out-of-range input | bounded validation failure | no authoritative mutation/read where pre-validation applies |
| Authority failure | unavailable/malformed listing response | bounded `PERSISTENCE_ERROR`/`INVALID_RESPONSE` failure with Retry | no raw server text or stale-current claim |
| Session boundary | signed-out or wrong-role page | no authenticated tool and no private result | server-resolved role enforcement |
| WebMCP unavailable | browser without supported capability | ordinary manual Search remains usable | no invented registration/success |
| Repeated read | same criteria twice | same authority semantics and no state change | idempotent read |

## Current versus intended boundary

| Concern | Current verified behavior | Intended task output |
|---|---|---|
| Area input | Free text, placeholder `Shoreditch`, exact case-insensitive equality after UI trim | Canonical stored label resolved through bounded prefix suggestions or exact canonical entry |
| Area values | Any non-empty bounded string is syntactically accepted; unknown value returns empty | Unknown/unresolved value is `VALIDATION_FAILED`; known canonical value with no published match is empty |
| Date naming | UI says `Available by`; API/application field is `availableFrom` and compares on/before | Public/tool name is `availableBy`; compatibility HTTP name maps to the same date-only meaning |
| Result set | Published tenant-safe DTOs, no explicit result cap/order contract | Fixture-bounded full result, deterministic source order, `fixtureGeneration`, count, safe DTO, page state |
| Ordinary UI | Manual form, loading/error/empty/result/Clear states | Same normalized criteria and authoritative result as the future adapter |
| WebMCP | No registration or dependency | One page/session-scoped read-only `search_listings` adapter after `RIGHTSPOT-043` |

## Non-goals and forbidden expansion

- No Search UI implementation, placeholder change, suggestion list, autocomplete, route, URL-state,
  CSS, copy, accessibility redesign, or fixture change in this decision task.
- No WebMCP registration, adapter, dependency, browser flag/origin setup, Cloud Receiver integration,
  agent runtime, or external authentication.
- No direct database query, SQL-like natural-language parser, generic search engine, ranking model,
  geospatial provider, map integration, fuzzy matching, synonym/alias catalogue, recommendation,
  saved search, notification, or background search job.
- No bedroom filter, property-type filter, price history, availability inventory, live listing feed,
  pagination, infinite scroll, or full-text title/address search unless explicitly accepted as part of
  the bounded contract; if accepted, it must remain a named criterion with its own limits and tests.
- No Favourite, Viewing Request, Information Request, Agent Operations, listing administration,
  tenant contact, messaging, payment, lease, or workflow-state behavior.
- No changes to current server authority, role/privacy rules, DTO private-field boundary, persistence,
  fixture generation, or ordinary request workflow.
- No automatic retry loop, no automatic fallback from an empty Area result to the full catalogue, no
  silent selection of an Area/date, no guessed user intent, and no swallowed unsupported capability.
- No cleanup, staging, commit, push, branch/worktree lifecycle, or modification of unrelated
  collaborator-owned files from a future supporting Advisor.

## Required read set

- `/Users/alex/.codex/AGENTS.md`
- `/Users/alex/OpenAI-WebMCP/AGENTS.md`
- `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/AGENTS.md`
- RightSpot `AGENTS.md` and `RUNBOOK.md` where present, without promoting untracked generated guidance
  over the tracked repository authority
- [RightSpot current status](../00-current-status.md)
- [RightSpot product definition](../01-product-definition.md)
- [RightSpot requirements](../02-requirements.md)
- [RightSpot system design](../03-system-design.md)
- [RightSpot domain and data model](../04-domain-and-data-model.md)
- [RightSpot API and integration contracts](../05-api-and-integration-contracts.md)
- [RightSpot validation and evidence](../06-validation-and-evidence.md)
- [RightSpot business flows](../07-business-flows-and-scenarios.md), especially `RS-FLOW-02`
- [RightSpot WebMCP roadmap](../Development/RIGHTSPOT-WEBMCP-ROADMAP.md)
- [RightSpot cross-layer audit](../Development/RIGHTSPOT-CROSS-LAYER-AUDIT-2026-09-02.md)
- ADR-RS-0001, ADR-RS-0006, ADR-RS-0008, ADR-RS-0009, and any ADR identified as affected by the
  accepted Search decision
- `src/ui/tenant/tenant-discovery-page.tsx`
- `src/ui/tenant/tenant-api.ts`
- `src/server/application/listings.ts`
- `src/server/application/http.ts`
- `src/server/domain/projections.ts` and listing/domain types
- `src/server/domain/workflow.ts` seeded listing boundary
- relevant listing application/API/UI tests and package scripts
- the current supported WebMCP and browser documentation at the implementation gate

## RS-WO-042-01 — Search contract analysis and main-thread decision

**Role:** Main-thread Product, Architecture, API, UX, and WebMCP boundary decision owner  
**Status:** `CLOSED_VERIFIED` — contract accepted and reconciled; implementation routed to `RIGHTSPOT-043`  
**Parallelization:** `SERIAL_SHARED_SEARCH_CONTRACT` — read-only specialist review may be consulted in parallel only against a stable source; the canonical decision and writeback remain Main-owned and serialized  
**Risk profile:** `Assured` for decision quality because the output crosses ordinary UI semantics, application/API authority, WebMCP compatibility, privacy, and evidence boundaries; no code is authorized  
**Supporting worker:** Hubble was consulted read-only for an adversarial contract review; no worker edited source or canonical files  
**Source baseline:** Main branch and current RightSpot package/runtime were reviewed at the documentation checkpoint. `RIGHTSPOT-043` must recapture source identity, package/runtime, browser capability, and dirty paths before implementation dispatch.  
**Write policy:** This task file may be updated by Main with the decision analysis and review disposition. A supporting Advisor may return a proposal only and must not edit this file, canonical product documents, source, tests, fixtures, package manifests, or Git state.  

### Decision deliverable — completed

The completed Work Order returned a compact implementation-ready decision record containing:

1. the selected first user goal, role, page, capability mode, and relation to `RIGHTSPOT-010`;
2. verified current behavior versus intended behavior, including the placeholder/fixture mismatch;
3. the accepted Area model and normalization/unknown-value behavior;
4. every supported criterion and exact comparison/range/date semantics;
5. result ordering, cap, truncation, freshness/generation, DTO, and page-state semantics;
6. invalid, empty, unavailable, malformed, stale, duplicate, unsupported, signed-out, and wrong-role
   behavior;
7. the ordinary UI/API/WebMCP authority and shared-contract ownership map;
8. privacy, untrusted-content, prompt-injection, cross-origin, and output-size boundaries;
9. the accepted logical tool metadata/schema, with the external draft registration API left to the implementation gate;
10. TDD Red→Green→Refactor scenarios and the later implementation/browser/evaluation evidence matrix;
11. exact likely read/write/forbidden/generated paths for the later implementation Task, including
    shared-file serialization and no-WebMCP manual fallback; and
12. unresolved implementation-gate compatibility checks, non-goals, rejected alternatives, stop
    conditions, and the required ADR/canonical document updates before implementation.

### Required TDD contract catalogue for the later implementation

The decision must describe tests that will fail if a future implementation violates any accepted
boundary. At minimum, the later implementation plan must include:

- exact canonical Area match and case normalization;
- the chosen partial/unknown Area behavior;
- surrounding whitespace handling parity between UI, application, API, and tool;
- all four current numeric/date filter boundaries and their inclusive semantics;
- AND combination and deterministic ordering/cap behavior;
- published-only and tenant-only authority;
- tenant-safe DTO/output fields and forbidden private fields;
- valid empty result with no fallback;
- malformed/invalid/unavailable response with bounded copy and no raw diagnostics;
- latest result/page agreement under repeated or overlapping reads;
- read-only idempotence and no Favourite/Viewing Request/workflow mutation;
- signed-out, wrong-role, unsupported-WebMCP, registration-lifecycle, and manual-fallback behavior;
- actual supported-browser discovery/invocation evidence separate from ordinary unit/API tests.

## Later implementation decomposition (routed to RIGHTSPOT-043)

This task does not authorize source changes. It records the dependency shape used to create
`RIGHTSPOT-043` so the decision does not become an oversized implementation brief.

1. **Ordinary Search contract repair:** align canonical Area resolution, the `availableBy` mapping,
   shared validation, and manual page/API parity with TDD.
2. **Read-only WebMCP adapter:** add one thin page/session-scoped adapter over the accepted authority;
   it must preserve the manual UI and must not add a second listing authority.
3. **Independent verification:** use frozen post-Builder source and a disposable fixture to prove
   registration, schema discovery, valid/invalid invocation, page-state agreement, role/privacy,
   unsupported-browser fallback, and no mutation. Browser evidence is not substituted by tests.
4. **Main integration and closure:** inspect exact paths/diff/source identity, rerun affected checks,
   reconcile the implementation Task and canonical documents, commit the verified increment, and
   retire only an exact clean candidate Worktree if one was used.

The later implementation should normally remain one product Task with bounded Work Orders rather than
registering separate Tasks for Search UI, API, WebMCP, and verification. A separate Task is justified
only if it produces an independently valuable outcome with a different authority/owner and explicit
integration boundary.

## Verification and closure record for this decision Task

This Task is closed because:

- Main has accepted, revised, or explicitly deferred the Tenant Discovery first Search goal;
- Area matching and normalization are no longer ambiguous;
- supported criteria, comparison/date/range/combination/order/cap semantics are written down;
- empty, invalid, unavailable, stale, duplicate, signed-out, wrong-role, unsupported, and privacy
  boundaries are explicit;
- the ordinary UI/API authority and later WebMCP adapter ownership are unambiguous;
- the proposed result/tool schema is marked accepted or rejected, not left as an accidental contract;
- TDD, browser, and agent-evaluation evidence required by the next implementation gate is specified;
- any durable accepted change has its ADR and Flow/API/WebMCP/current-status reconciliation;
- the separate implementation Task `RIGHTSPOT-043` is registered because the accepted outcome requires code;
- the Task File records the review disposition, unresolved risks, non-claims, and next gate; and
- no claim is made that WebMCP is implemented, registered, browser-supported, deployed, or judge-
  reproducible merely because this decision Task is closed.

## Stop and reopen conditions

Stop and return to Main review if:

- Area semantics cannot be decided without introducing a new location authority, external provider,
  geospatial model, or unbounded fuzzy search;
- the selected Search requires a new workflow state, listing lifecycle, PII/contact authority, or
  reporting model not named in this task;
- ordinary UI, API/application, and WebMCP semantics cannot share one authoritative predicate;
- a proposal exposes private/internal fields, accepts client-supplied role/assignment, or treats
  listing content as trusted instructions;
- the result cannot identify its evaluated source or the page cannot visibly agree with it;
- a browser limitation is being hidden behind a fake registration, manual reconstruction, or silent
  fallback; or
- the required scope grows into a generic marketplace search, analytics dashboard, Cloud Receiver,
  authentication, deployment, or production-readiness program.

Reopen or create a separately bounded implementation Task if the accepted Search contract later
requires a new data source, full-text/geospatial semantics, mutation, agent-facing Operations query,
external integration, or a materially different WebMCP/browser capability. Do not widen this decision
Task opportunistically.

## Registration evidence — 2026-09-02

Main inspected the current Tenant Discovery UI, listing application/API boundary, seeded catalogue,
business-flow contract, WebMCP roadmap, local runtime, and browser behavior after the owner selected
WebMCP Search as the first integration direction. The live and static checks confirmed that the existing
four filters and stale-response guard operate within their current contract, while the Area placeholder
does not correspond to any seeded value and the exact-match semantics are not discoverable or specified
in `RS-FLOW-02`. The current date parameter/UI naming also requires explicit contract wording for the
first tool. The finding is registered as `F-21` / `RIGHTSPOT-042` with one Main-owned serial decision
Work Order. No source, fixture, package, dependency, WebMCP registration, route, ADR, or implementation
Worktree was changed by this registration checkpoint. The existing `RIGHTSPOT-010` Operations/WebMCP
proposal remains separate and pending.

## Partial decision writeback — 2026-09-03

Main accepted the Area direction through ADR-RS-0014: Area is a canonical structured facet, partial
input is limited to bounded deterministic suggestion discovery, the applied filter uses a selected
canonical label after shared trim and case-insensitive normalization, unknown or unselected values
receive bounded validation, and no fuzzy, alias, geospatial, or full-catalogue fallback is allowed.
This was the partial checkpoint; the complete decision was subsequently accepted in ADR-RS-0015.

## Final decision writeback — 2026-09-03

Main accepted ADR-RS-0015 after reviewing the current application/API, UI, business-flow, runtime,
and official WebMCP boundary guidance. The first slice supports only `area`, `maxRent`, `minSizeSqM`,
and public `availableBy` (compatibility HTTP mapping to `availableFrom`), with shared trim/case
normalization, canonical Area resolution, inclusive AND semantics, published-only projection,
deterministic source order, and full return of the bounded synthetic catalogue. The logical result
includes normalized filters, `fixtureGeneration`, `matchedCount`, tenant-safe listings, `/tenant`,
and `results`/`empty` page state. Invalid/unknown, unavailable, malformed, superseded, signed-out,
wrong-role, unsupported, privacy, untrusted-content, and manual-fallback boundaries are explicit;
empty results never fall back to the full catalogue and read execution never mutates workflow state.

The contract is reconciled in the API, Flow, current-status, development-roadmap, and WebMCP-roadmap
documents. `RIGHTSPOT-042` is `CLOSED_VERIFIED` as a decision/documentation gate. At this Task's
2026-09-03 closure checkpoint, the separate implementation Task
[`RIGHTSPOT-043`](RIGHTSPOT-043-implement-tenant-search-and-webmcp-adapter.md) was registered but not
dispatched and was required to recapture its source/runtime/browser identity. It subsequently
integrated ordinary Search at `534f5c9` and dispatched its page-bound adapter against the reviewed
`2bb65cd` baseline; its independent verification gate remains open.

## Reopen condition

Reopen this Task if the accepted first Search goal changes, the Area data taxonomy or matching rule
changes, a later WebMCP/browser capability requires a different result or lifecycle boundary, or the
ordinary UI/API and tool contract diverge. `RIGHTSPOT-043` must return here before widening the
contract to a new authority, criterion, mutation, output cap, or external integration.
