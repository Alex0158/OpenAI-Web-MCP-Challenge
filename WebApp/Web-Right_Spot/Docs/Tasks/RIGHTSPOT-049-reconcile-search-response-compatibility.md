# RIGHTSPOT-049 — Fail closed on filtered legacy Search responses

**Type:** defect  
**Lifecycle:** pending  
**Priority:** P2 for Tenant Search result truthfulness and compatibility safety  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-03  
**Finding:** F-23 — filtered Search response metadata can be silently defaulted  
**Depends on:** closed RIGHTSPOT-042 and RIGHTSPOT-043, ADR-RS-0014, and ADR-RS-0015

## Task control

- **Objective:** Make the Tenant Search client accept the documented minimal legacy response only for
  an actually unfiltered read, and fail closed when a filtered successful response cannot prove its
  normalized applied filters and page metadata.
- **Execution posture:** PENDING_BOUNDED — the defect is registered and ready for one serial,
  parser/test-only Builder Work Order; no source Work Order has started.
- **Blocking status:** Non-blocking to RIGHTSPOT-012, the paused RIGHTSPOT-047 browser gate, and the
  BLOCKED_HARNESS RIGHTSPOT-048 lifecycle evidence gate.
- **Current next gate:** Capture the exact Main source identity, dispatch RS-WO-049-01, review the
  Red → Green → Refactor handoff, then freeze the candidate before RS-WO-049-02.
- **Source identity:** Main will capture the exact commit, dirty-path record, Node runtime, and
  generated-state boundary immediately before dispatch. The current registration does not authorize
  a moving source baseline.
- **Main authority:** Main owns task admission, source identity, exact-path review, integration,
  independent verification acceptance, documentation, and Git closure. A supporting worker may not
  commit, push, modify the Git index, alter canonical decisions, or claim closure.
- **No browser retry implication:** This task does not reopen or authorize another blind
  agent-browser attempt for RIGHTSPOT-048. Browser evidence is optional for this parser boundary and
  cannot be used to hide the deterministic response-contract checks.

## Verified problem

The accepted Search logical result contains fixtureGeneration, appliedFilters, matchedCount, listings,
pagePath, and pageState. ADR-RS-0015 also preserves a compatibility allowance for an ordinary HTTP
transport that may return only fixtureGeneration and listings, provided the shared adapter still
derives the same logical result truthfully.

The current client path does not know whether the response was requested with filters:

1. readListings receives filters and builds a filtered or unfiltered GET URL.
2. It passes the payload to parseListingsResponse without the request context.
3. The parser defaults missing appliedFilters to an empty object, matchedCount to listings.length,
   pagePath to /tenant, and pageState from the inferred count.
4. TenantDiscoveryPage uses appliedFilters to overwrite the visible form and to decide whether the
   current result is the full local catalogue.

A controlled response comparison reproduced the boundary without changing the server:

- the caller requested area=Southwark;
- the response contained fixtureGeneration and one valid listing but no logical metadata;
- readListings returned appliedFilters={}, matchedCount=1, pagePath=/tenant, and pageState=results;
- the consumer could therefore clear the visible Area and label a filtered result as the full
  catalogue.

The same ambiguity is worse for a filtered response with zero listings: the client cannot distinguish
an intentionally empty filtered result from an unfiltered empty catalogue. A page-authored Search tool
using the same executor could also report success without truthfully showing which filter was applied.

The current RightSpot server emits the complete logical envelope for its current route, and the
existing unfiltered minimal-response test is intentional compatibility coverage. Therefore this is
not a claim that the current server route is presently regressing. It is a real client/transport
contract defect because the accepted compatibility shape permits the exact response that the current
parser misclassifies.

## Contract interpretation

The compatibility rule is narrowed as follows:

- An actually unfiltered read may accept the legacy success shape containing only a positive
  fixtureGeneration and a valid listings array. The parser may derive an empty applied filter set,
  matchedCount, /tenant, and results/empty only in this unfiltered case.
- A read with one or more effective Search criteria requires a complete logical success envelope:
  appliedFilters, matchedCount, pagePath, and pageState must all be present and valid.
- For a filtered success, appliedFilters must contain every effective requested criterion under its
  public normalized name. Area may be returned as the server-resolved canonical label; the client
  must not require raw input spelling or implement Area resolution itself.
- A missing or partial logical envelope, including an appliedFilters object that omits an effective
  criterion, is INVALID_RESPONSE. It must not be converted into an unfiltered success.
- The parser must not derive appliedFilters from caller input, infer a filtered result from listing
  contents, run a second predicate, or silently remove a criterion. Server/application authority
  remains the source of normalized filters and result semantics.
- A complete filtered envelope with a valid zero match remains a successful explicit empty result.
  An invalid or incomplete envelope remains a bounded error and never becomes a catalogue fallback.
- Effective-filter detection must reflect the actual serialized request, not merely the presence of
  object keys whose values are undefined. Existing date compatibility mapping remains unchanged.

This is a refinement of the compatibility paragraph in ADR-RS-0015, not a new Search criterion,
ranking rule, source, pagination scheme, or WebMCP capability.

## Bounded objective

1. Pass enough request context from readListings to the parser to distinguish an effective filtered
   read from an unfiltered read.
2. Preserve the current full response behavior and existing unfiltered legacy compatibility.
3. Reject filtered minimal and partial success envelopes with TenantApiError code INVALID_RESPONSE.
4. Prevent the Tenant page and the existing search_listings executor from presenting an incomplete
   filtered response as a successful unfiltered result.
5. Prove the boundary with focused TDD Red → Green → Refactor tests and the required complete
   RightSpot static checks.

## Acceptance criteria

### Response classification

- An unfiltered minimal response with a valid fixtureGeneration and listings array remains accepted.
- A filtered response missing appliedFilters, matchedCount, pagePath, or pageState is rejected as
  INVALID_RESPONSE, including a filtered response with zero listings.
- A filtered response with all logical metadata and the requested normalized criterion keys is
  accepted when the existing field and cross-field validation passes.
- The existing complete server response remains accepted with the same normalized values, counts,
  page path, page state, and tenant-safe listing fields.
- An object containing filter keys with undefined values is treated according to the serialized
  request: if no criterion was sent, unfiltered compatibility remains available.

### Consumer and capability behavior

- No incomplete filtered response reaches the normal success path that updates appliedFilters,
  visible form state, catalogue-label state, or the WebMCP result.
- The bounded INVALID_RESPONSE mapping remains visible/retryable and does not expose raw response
  data or server internals.
- A valid filtered empty response remains explicit empty state and never falls back to the catalogue.
- No request mutation, persistence write, session change, WebMCP registration change, or new retry
  behavior is introduced.

### Scope and quality

- The repair changes only the declared parser/client and focused test paths.
- The implementation keeps one Search semantic authority and does not add a generic response layer,
  cache, retry loop, schema dependency, or second Area/predicate implementation.
- Existing public method names, HTTP query names, WebMCP tool schema, error code, and successful
  response shape remain compatible.
- No browser closure claim for RIGHTSPOT-047 or RIGHTSPOT-048 is made by this Task.

## TDD and verification contract

### Red

Before implementation, add focused failing tests that demonstrate:

1. a filtered response with one valid listing and only fixtureGeneration/listings is rejected;
2. a filtered response with zero listings and only fixtureGeneration/listings is rejected;
3. a filtered response with a partial logical envelope is rejected;
4. a filtered response whose appliedFilters omits an effective requested criterion is rejected;
5. the existing unfiltered minimal response remains accepted; and
6. a complete filtered response, including server-normalized Area, remains accepted.

The tests must assert the public INVALID_RESPONSE outcome, not a private helper name.

### Green

Implement the smallest client-only change that:

- derives effective-filter context from the actual serialized logical filters;
- gives the parser that context;
- preserves legacy inference only when no effective filter was sent; and
- requires and validates the complete logical fields and effective filter keys for filtered success.

Do not change the server route, application service, shared domain contract, WebMCP adapter, or page
consumer to compensate for the parser defect.

### Refactor

Perform only behavior-preserving cleanup that makes the distinction between legacy unfiltered
compatibility and filtered logical-envelope validation readable. Do not introduce a generic schema
framework or speculative transport abstraction.

### Required checks

The Builder handoff and Main closure must report:

- focused tenant API tests with Red → Green evidence;
- complete npm test suite;
- npm run typecheck;
- production build under the required Node 24.20.0 runtime;
- repository documentation/structure validation;
- sensitive-pattern scan;
- git diff --check and exact changed-path review;
- a controlled response-level reproduction showing the old filtered minimal payload now fails closed;
  and
- confirmation that the current server full envelope and unfiltered compatibility path remain valid.

Browser verification is not required to prove this deterministic parser contract. If a supported
browser check is performed, it must be fresh, bounded, and reported separately; lack of browser
evidence must not be relabeled as a product failure or used to reopen the blocked 048 harness.

## Work Order decomposition

### RS-WO-049-01 — Filtered Search response parser repair

**Role:** UI/API client Builder  
**Status:** PENDING  
**Parallelization:** SERIAL_TENANT_SEARCH_CLIENT — one writer only; do not overlap with another
  writer on tenant-api.ts or its focused test.  
**Risk profile:** Bounded P2 client compatibility repair; no server or domain behavior change.  
**Allowed write set:**

- src/ui/tenant/tenant-api.ts
- tests/ui/tenant-api.test.ts

**Read set:**

- this Task File;
- ADR-RS-0014 and ADR-RS-0015;
- Docs/05-api-and-integration-contracts.md;
- src/shared/contracts/listings-api.ts;
- src/ui/tenant/tenant-discovery-page.tsx;
- src/ui/tenant/tenant-webmcp.ts;
- current tenant API and application tests;
- RUNBOOK.md and the repository engineering controls.

**Forbidden set:**

- src/server/;
- src/shared/contracts/;
- app/api/listings/;
- src/ui/tenant/tenant-discovery-page.tsx;
- src/ui/tenant/tenant-webmcp.ts;
- any other UI, API, domain, persistence, fixture, route, or WebMCP path;
- package.json, package-lock.json, dependencies, generated output, browser artifacts, SQLite state;
- canonical Docs, Git refs, commits, pushes, Worktree lifecycle, or unrelated dirty/untracked files.

**Handoff requirements:**

- recapture the exact source identity before editing;
- execute the required Red → Green → Refactor sequence;
- change only the two allowed paths;
- report exact focused/full/static check output and residual warnings;
- explain why unfiltered legacy compatibility remains bounded and why filtered incomplete data fails
  closed; and
- return READY_FOR_VERIFICATION only after the candidate is internally self-checked.

### RS-WO-049-02 — Independent parser and integration verification

**Role:** Independent read-only UI/API Verifier  
**Status:** NOT_STARTED  
**Parallelization:** Starts only after Main reviews RS-WO-049-01 and freezes the exact candidate source.
  No source writer may modify the two-path candidate during this gate.
**Allowed write set:** none in product source or canonical Docs; disposable local evidence only under
the existing evidence boundary.

The Verifier must inspect the exact frozen source and run the focused, complete, typecheck, build,
repository, sensitive-scan, and diff checks. It must confirm the unfiltered legacy response, filtered
complete response, filtered minimal/partial failures, normalized Area key handling, zero-result
truthfulness, bounded INVALID_RESPONSE mapping, no page/tool fallback, and no changes outside the
two-path write set. It may perform a controlled API/client response comparison but must not modify
server fixtures or persistence to manufacture a result.

If the verifier cannot run a supported browser, it must report the deterministic evidence separately
and not claim browser verification. A harness limitation is not a reason to weaken the response
contract or perform an unbounded retry.

## Rollback and stop conditions

- Stop before implementation if the current server or ADR no longer supports the stated legacy
  compatibility boundary; update the decision record first rather than guessing.
- Stop and return to Main if the repair appears to require changing server serialization, Area
  authority, Search predicates, WebMCP schemas, page state, or a shared contract.
- Stop if any forbidden path changes, if filtered responses would require client-side matching, or if
  the proposed implementation hides a malformed response through fallback or retry.
- Rollback is the exact revert of the reviewed two-path candidate before any later dependent source
  change. Do not revert unrelated work or delete evidence.

## Closure and reopen condition

Main may close this Task only after the two-path candidate passes the acceptance matrix, the complete
checks, exact-path review, and independent verification, and after ADR-RS-0015, the API contract, the
Task index, and current status/roadmap accurately describe the compatibility boundary.

Reopen only if a later transport shape, response intermediary, page consumer, or WebMCP consumer
demonstrates that a filtered incomplete response can again be rendered or reported as an unfiltered
success, or if the Search logical envelope itself changes.
