# RIGHTSPOT-049 — Fail closed on filtered legacy Search responses

**Type:** defect  
**Lifecycle:** closed  
**Priority:** P2 for Tenant Search result truthfulness and compatibility safety  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-03  
**Finding:** F-23/F-24 — filtered Search response metadata can be silently defaulted or mismatched
**Depends on:** closed RIGHTSPOT-042 and RIGHTSPOT-043, ADR-RS-0014, and ADR-RS-0015

## Task control

- **Objective:** Make the Tenant Search client accept the documented minimal legacy response only for
  an actually unfiltered read, and fail closed when a filtered successful response cannot prove its
  normalized applied filters, exact non-Area criteria, and page metadata.
- **Execution posture:** CLOSED_VERIFIED — the first two-path Builder candidate passed the original
  deterministic behavior checks, but independent review found one procedural gate ambiguity and one
  same-contract scalar-correlation gap. RS-WO-049-03 completed the bounded repair, and the fresh
  independent RS-WO-049-02 verification passed against the unchanged RightSpot projection.
- **Blocking status:** Non-blocking to RIGHTSPOT-012, the paused RIGHTSPOT-047 browser gate, and the
  BLOCKED_HARNESS RIGHTSPOT-048 lifecycle evidence gate.
- **Current next gate:** No open 049 implementation or verification gate remains. Main must retain this
  closure record, commit the canonical documentation writeback, and return to the non-blocking
  RIGHTSPOT-012 audit for the next evidence-backed decision.
- **Source identity:** The original Builder started from Main commit 0994e9245f003b68a9f4b301aa27af46b3d0c4d5;
  its reviewed source candidate is retained at 1d041d4. The RS-WO-049-03 Repairer dispatch baseline
  is Main commit 609ef564af808276de81bb49c330a7b79ebc8790, where the source/test blobs are unchanged
  and the corrected contract/process writeback is canonical. The first fresh verifier was dispatched
  against product candidate commit `0ef9b0f60f57ed60c48cb2591d2a9204d072993d`; while it was active,
  an external descendant `9994f4eb85dca58e802640a72934dec7d9dec4dc` changed only Web-Game. Main proved
  the RightSpot boundary diff empty and the two candidate blobs byte-identical, so the fresh run is
  explicitly re-anchored to that unchanged RightSpot projection. Tracked RightSpot source/test paths
  were clean at dispatch; protected untracked .playwright-cli/, :memory:, local instruction files, and
  Docs/Reference/ were excluded from the write set. The required runtime is Node v24.20.0 with npm
  11.19.0.
- **Main authority:** Main owns task admission, source identity, exact-path review, integration,
  independent verification acceptance, documentation, and Git closure. A supporting worker may not
  commit, push, modify the Git index, alter canonical decisions, or claim closure.
- **No browser retry implication:** This task does not reopen or authorize another blind
  agent-browser attempt for RIGHTSPOT-048. Browser evidence is optional for this parser boundary and
  cannot be used to hide the deterministic response-contract checks.
- **Review disposition:** The first independent verifier found no implementation failure, but returned
  `NOT_VERIFIED` because its prompt incorrectly treated the entire seven-path Main checkpoint as if it
  were the Builder's two-path candidate. Main classified this as a process-contract defect. The
  subsequent 012 read-only audit independently reproduced a real P2 mismatch: non-Area filtered
  metadata was required to contain the criterion but was not required to equal the serialized value.
  Main reproduced `maxRent: 2500` accepting response metadata `maxRent: 999`; this is now included in
  the same 049 repair boundary.

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
  public normalized name. The non-Area scalar criteria `maxRent`, `minSizeSqM`, and `availableBy`
  must equal the actual serialized request values; the client must not accept a complete-looking
  response that relabels those values. Area may be returned as the server-resolved canonical label;
  the client must not require raw input spelling or implement Area resolution itself.
- The applied-filter key set must match the effective serialized public criteria exactly: a response
  must not add an allowed criterion that was not requested. For Area, the response must remain
  equivalent after the accepted trim/case normalization; this comparison is not client-side Area
  resolution and must not introduce aliases or a second catalogue lookup.
- A missing or partial logical envelope, including an appliedFilters object that omits an effective
  criterion, is INVALID_RESPONSE. It must not be converted into an unfiltered success.
- The parser must not derive appliedFilters from caller input, infer a filtered result from listing
  contents, run a second predicate, or silently remove a criterion. Server/application authority
  remains the source of normalized filters and result semantics.
- A complete filtered envelope with a valid zero match remains a successful explicit empty result.
  An invalid or incomplete envelope remains a bounded error and never becomes a catalogue fallback.
- A filtered envelope whose non-Area applied value differs from the serialized request is
  `INVALID_RESPONSE`, even when its metadata is otherwise complete. If the server later introduces
  a legitimate numeric/date transformation, reopen ADR-RS-0015 before changing this client rule.
- An extra allowed filter key, or a server Area value that is not equivalent to the serialized Area
  after the accepted normalization, is also `INVALID_RESPONSE`.
- Effective-filter detection must reflect the actual serialized request, not merely the presence of
  object keys whose values are undefined. Existing date compatibility mapping remains unchanged.

This is a refinement of the compatibility paragraph in ADR-RS-0015, not a new Search criterion,
ranking rule, source, pagination scheme, or WebMCP capability.

## Bounded objective

1. Pass enough request context from readListings to the parser to distinguish an effective filtered
   read from an unfiltered read.
2. Preserve the current full response behavior and existing unfiltered legacy compatibility.
3. Reject filtered minimal and partial success envelopes, extra applied-filter keys, semantically
   mismatched applied-filter values, and non-equivalent Area values with TenantApiError code
   INVALID_RESPONSE.
4. Prevent the Tenant page and the existing search_listings executor from presenting an incomplete or
   mismatched filtered response as a successful unfiltered result.
5. Prove the boundary with focused TDD Red → Green → Refactor tests and the required complete
   RightSpot static checks.

## Acceptance criteria

### Response classification

- An unfiltered minimal response with a valid fixtureGeneration and listings array remains accepted.
- A filtered response missing appliedFilters, matchedCount, pagePath, or pageState is rejected as
  INVALID_RESPONSE, including a filtered response with zero listings.
- A filtered response with all logical metadata and the requested normalized criterion keys is
  accepted when the existing field/cross-field validation passes and non-Area values exactly match the
  serialized request.
- A filtered response with a complete envelope but a mismatched `maxRent`, `minSizeSqM`, or
  `availableBy` value is rejected as `INVALID_RESPONSE`.
- A filtered response with an extra allowed applied-filter key or a non-equivalent Area value is
  rejected as `INVALID_RESPONSE`.
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
5. a complete filtered response with a mismatched non-Area applied value is rejected;
6. a complete filtered response with an extra criterion or non-equivalent Area is rejected;
7. the existing unfiltered minimal response remains accepted; and
8. a complete filtered response, including server-normalized Area, remains accepted.

The tests must assert the public INVALID_RESPONSE outcome, not a private helper name.

### Green

Implement the smallest client-only change that:

- derives effective-filter context from the actual serialized logical filters;
- gives the parser that context;
- preserves legacy inference only when no effective filter was sent; and
- requires and validates the complete logical fields and effective filter keys for filtered success;
- compares non-Area applied values with the serialized request while allowing the accepted server
  canonicalization for Area;
- requires an exact effective key set and compares Area after only the accepted shared trim/case
  normalization.

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
**Status:** REPAIR_REQUIRED  
**Parallelization:** SERIAL_TENANT_SEARCH_CLIENT — one writer only; do not overlap with another
  writer on tenant-api.ts or its focused test.  
**Risk profile:** Bounded P2 client compatibility repair; no server or domain behavior change.  
**Allowed write set:**

- src/ui/tenant/tenant-api.ts
- tests/ui/tenant-api.test.ts

**Dispatch record (2026-09-03):** Main dispatched this exact two-path Builder Work Order to
Leibniz (supporting task 01a0669f-fe53-7b52-9fbb-79b4fc502fbd) with model gpt-5.6-sol and medium
reasoning from the recorded Main baseline. The prompt requires the repository and RightSpot
instruction surfaces, the complete Task/ADR contract, Red → Green → Refactor evidence, exact-path
discipline, and the required static checks. It explicitly forbids Git/index operations, canonical
documentation edits, server/shared-contract/page/WebMCP changes, fixture or SQLite changes,
Worktree creation, and unrelated-file edits.

**Builder handoff (2026-09-03):** The worker returned `READY_FOR_VERIFICATION` and Main reviewed the
exact diff. Only `src/ui/tenant/tenant-api.ts` and `tests/ui/tenant-api.test.ts` changed. The parser
now derives effective criteria from the serialized request, requires complete logical metadata and
every effective public criterion for filtered success, preserves bounded unfiltered minimal-response
compatibility, and keeps server-normalized Area values authoritative. Red evidence covered filtered
minimal result/empty responses, partial metadata, and omitted criteria; Green/Refactor retained the
existing full envelope and added the bounded compatibility cases. Focused and complete tests passed
`221/221`, typecheck and production build passed, repository/docs/sensitive/diff checks passed, and
the independent response probe produced `INVALID_RESPONSE` for filtered minimal data while retaining
the unfiltered minimal result and normalized Area success. The build emitted only the existing
Turbopack dynamic-filesystem tracing warning in `src/server/persistence/operations-store.ts`; no
forbidden path, Git index, commit, Worktree, or unrelated file was changed.

This handoff remains a valid partial implementation of the original minimal-response boundary, but it
does not yet satisfy the later scalar-correlation criterion recorded after the 012 audit. It is held
for the bounded RS-WO-049-03 repair; no redesign or new Search criterion is implied.

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
**Status:** VERIFIED  
**Parallelization:** The first verification run completed against frozen source `1d041d4`. After the
  RS-WO-049-03 repair and path-projected re-baseline, the fresh run verified the immutable RightSpot
  projection at repository checkpoint `9994f4eb85dca58e802640a72934dec7d9dec4dc`; no source writer
  modified the two-path candidate during that gate.
**Allowed write set:** none in product source or canonical Docs; disposable local evidence only under
the existing evidence boundary.

The Verifier must inspect the exact frozen source and run the focused, complete, typecheck, build,
repository, sensitive-scan, and diff checks. It must confirm the unfiltered legacy response, filtered
complete response, filtered minimal/partial failures, normalized Area key handling, zero-result
truthfulness, bounded INVALID_RESPONSE mapping, no page/tool fallback, and no unexpected product
changes outside the two-path worker write set. It must report two path ledgers separately: (1) the
Builder candidate product diff, which must be limited to the two worker paths, and (2) any explicitly
declared Main-owned process-only documentation writeback in the enclosing checkpoint, which must not
alter the task contract or product behavior. It may perform a controlled API/client response comparison
but must not modify server fixtures or persistence to manufacture a result.

**First verification result (2026-09-03):** The verifier passed the functional acceptance matrix,
`12/12` focused tests, `221/221` complete tests, typecheck, build, validators, sensitive scan, diff
checks, and the response probes. It returned `NOT_VERIFIED` only because it applied the worker's
two-path scope to the whole seven-path Main checkpoint, which also contained five Main-owned
documentation writeback paths. Main classifies that outcome as a procedural contract mismatch, not a
code failure; the corrected two-ledger rule above is now authoritative. The five documentation paths
were `Docs/00-current-status.md`, `Docs/Development/README.md`,
`Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md`, `Docs/Tasks/README.md`, and this Task File.

**Second verification result (2026-09-03):** The fresh verifier correctly identified the external
repository-tip movement, but returned `PROCEDURAL_BLOCKED` before running product checks because its
original dispatch required the whole-repository `HEAD` to remain exactly `0ef9b0f60f57ed60c48cb2591d2a9204d072993d`.
Main independently confirmed that `9994f4eb85dca58e802640a72934dec7d9dec4dc` is a descendant whose
diff is exclusively Web-Game, while the RightSpot path projection and both worker blobs are identical.
This is a coordination/process result, not a product defect. ADR-RS-0005 and the Runbook now define the
narrow path-projected freeze exception for this monorepo topology; no product source or test check was
waived. The re-anchored fresh verifier must still execute the full acceptance and static matrix.

**Fresh verification result (2026-09-03):** The re-anchored independent verifier returned `VERIFIED`
against immutable checkpoint `9994f4eb85dca58e802640a72934dec7d9dec4dc`. It confirmed both ancestor
relationships, an empty `0ef9b0f..9994f4e` RightSpot diff, and byte-identical worker blobs. The worker
candidate ledger contained exactly `src/ui/tenant/tenant-api.ts` and `tests/ui/tenant-api.test.ts`; the
seven-path Main process-only ledger contained the declared status, ADR, Development, Runbook, and Task
writeback paths. Focused tests passed `17/17`, the complete suite passed `226/226`, typecheck/build,
repository validators, RightSpot-scoped sensitive scan, `git diff --check`, and the required response
contract checks all passed under Node `v24.20.0` / npm `11.19.0`. The repository-wide sensitive scan
reported 10 findings exclusively in disjoint Web-Game documentation; the RightSpot-scoped scan passed
and this does not weaken or invalidate the RightSpot result. The existing Turbopack dynamic-filesystem
tracing warning at `src/server/persistence/operations-store.ts:104` remains non-blocking. Browser,
deployment, production, universal WebMCP, and judge-reproduction claims remain out of scope.

After that verification completed, the external Web-Game descendant
`0f42f1ca488654fd7abfbdd990d45b67061e2d1b` advanced the repository tip. Main proved it is a descendant
of `9994f4eb85dca58e802640a72934dec7d9dec4dc` with an empty RightSpot diff, so it does not invalidate the
verified product projection. The later documentation-only closure writeback also updates the nested
package README's stale aggregate test-count statement; this is Main-owned process/status documentation,
not a worker product-path change or a new implementation checkpoint.

If the verifier cannot run a supported browser, it must report the deterministic evidence separately
and not claim browser verification. A harness limitation is not a reason to weaken the response
contract or perform an unbounded retry.

### RS-WO-049-03 — Correlate filtered Search response values

**Role:** UI/API client Repairer  
**Status:** VERIFIED  
**Parallelization:** SERIAL_TENANT_SEARCH_CLIENT — starts only after the 049-02 procedural result is
recorded and no verifier is active; one writer only on the two declared paths.  
**Risk profile:** Bounded P2 extension of the same Search response-truth boundary; no server or domain
behavior change.  
**Allowed write set:**

- src/ui/tenant/tenant-api.ts
- tests/ui/tenant-api.test.ts

**Dispatch record (2026-09-03):** Main resumed the identity-matched Search worker Leibniz (supporting
task `01a0669f-fe53-7b52-9fbb-79b4fc502fbd`) for this distinct repair checkpoint with model
`gpt-5.6-sol` and medium reasoning, from baseline `609ef564af808276de81bb49c330a7b79ebc8790`. The
prompt includes the corrected ADR/Task/Runbook distinction between the two-path worker candidate diff
and Main-owned documentation writeback, and forbids all other source, contract, documentation, Git,
Worktree, fixture, persistence, generated, and unrelated paths.

The Repairer must retain the accepted 049-01 behavior and add only the missing semantic correlation:
for an effective filtered request, the applied-filter key set must equal the serialized public
criteria; `maxRent`, `minSizeSqM`, and `availableBy` must equal the serialized request values exactly;
and Area must be equivalent after only the accepted shared trim/case normalization. The server remains
the authority for canonical Area spelling. A mismatch must return the existing `INVALID_RESPONSE`
error without client-side re-filtering, catalogue lookup, aliasing, retry, cache, fallback, or response
rewriting.

The Repairer must add public-behavior TDD Red coverage for mismatched numeric/date values, extra
criteria, and non-equivalent Area, retain the filtered minimal/partial/omitted-key failures, preserve
complete matching/empty responses and unfiltered legacy compatibility, run the required static checks,
and return `READY_FOR_VERIFICATION`.
It must not modify the server, shared contract, page, WebMCP adapter, canonical Docs, fixtures,
persistence, package/dependency files, Git/index, Worktrees, or unrelated paths.

**Repairer handoff (2026-09-03):** The worker returned `READY_FOR_VERIFICATION` and Main reviewed the
exact candidate diff. Only `src/ui/tenant/tenant-api.ts` and `tests/ui/tenant-api.test.ts` changed in
the worker ledger. The implementation now requires an exact applied-filter key set for filtered
responses, exact serialized equality for `maxRent`, `minSizeSqM`, and `availableBy`, and only trim/case
equivalence for Area while retaining the server-normalized spelling. Filtered minimal, partial, omitted,
mismatched, extra-key, and non-equivalent-Area responses fail with `INVALID_RESPONSE`; complete matching
and empty responses plus unfiltered minimal compatibility remain valid. Red evidence covered the new
correlation failures; focused tests passed `17/17`, the complete suite passed `226/226`, typecheck and
production build passed, and repository, sensitive-scan, diff, and response-probe checks passed. The
build emitted only the existing Turbopack dynamic-filesystem tracing warning at
`src/server/persistence/operations-store.ts:104`. The worker reported the actual dispatch baseline as
`609ef564af808276de81bb49c330a7b79ebc8790`; the original dispatch note had a manually mistyped full
SHA, which Main corrected here. No commit, push, Git-index, Worktree, or forbidden-path change was made
by the worker.

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
