# RIGHTSPOT-043 — Implement Tenant Discovery Search and WebMCP adapter

**Type:** `implementation`  
**Lifecycle:** `in_progress`  
**Priority:** `P1` for the first WebMCP/product integration slice; the closed ordinary MVP remains runnable without it  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-03  
**Depends on:** [`RIGHTSPOT-042`](RIGHTSPOT-042-define-tenant-search-and-webmcp-search-contract.md), [ADR-RS-0015](../Decisions/ADR-RS-0015-tenant-search-and-webmcp-contract.md)  
**Goal:** Implement the accepted four-criterion Tenant Discovery Search semantics, then add one thin
page/session-bound read-only WebMCP capability without creating a second listing authority.

## Task control

- **Lifecycle:** `in_progress`
- **Execution posture:** `SERIAL_PRODUCT_SEARCH_WITH_SEQUENTIAL_WEBMCP_GATE`
- **Owner:** Main RightSpot thread
- **Current gate:** `RS-WO-043-01` is integrated in the canonical Main Worktree for the ordinary
  Search authority/UI/API slice. `RS-WO-043-02` is the next gated adapter work; `RS-WO-043-03`
  remains gated on that adapter. No source, dependency, WebMCP registration, fixture, or extra
  Worktree change is authorized outside the active Work Order.
- **Dispatch state:** `RS-WO-043-01 integrated; RS-WO-043-02 not yet dispatched`
- **Supporting workers:** Hubble's `RS-WO-043-01` Builder handoff was reviewed and integrated by
  Main. Main retains source integration, shared-file serialization, verification acceptance,
  canonical documentation, and Git closure authority.
- **Source identity:** The ordinary Search implementation is integrated in product code commit
  `534f5c9d2125fed77decd8f07202a2ea4693ce7e` on branch `main` at repository root
  `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`. The reviewed code changed exactly the ten paths in
  the `RS-WO-043-01` write set. Node `v24.20.0`, npm `11.19.0`, `npm test` `161/161`, typecheck,
  build, repository validators, sensitive scan, and `/api/health` passed. Five pre-existing
  untracked RightSpot boundary artifacts remain protected. The current browser bridge could not
  list WebMCP tools under this model; that compatibility check remains explicitly gated to the
  adapter/verifier and is not a WebMCP claim.
- **Integration authority:** Main owns source integration, shared-file serialization, verification
  acceptance, canonical documentation, Git commit/push, and candidate Worktree retirement.

## Bounded objective

Deliver one implementation-ready and independently verifiable first WebMCP increment:

1. the ordinary `/tenant` Search form resolves and applies the accepted canonical Area behavior;
2. the ordinary UI/API path exposes the accepted `availableBy` meaning while preserving the existing
   `availableFrom` HTTP compatibility mapping;
3. the existing four filters, validation, published-only authority, result order, empty/error states,
   and tenant-safe DTO remain one shared semantic contract;
4. one page-authored `search_listings` capability is available only to an authenticated Tenant on
   `/tenant` when the supported browser capability exists;
5. a successful tool invocation updates the same human-visible page state as the manual form; and
6. focused TDD, complete RightSpot checks, supported-browser runtime evidence, and canonical writeback
   prove the increment without claiming production WebMCP, Cloud Receiver, or external services.

The accepted contract is the complete source of truth: [ADR-RS-0015](../Decisions/ADR-RS-0015-tenant-search-and-webmcp-contract.md).
The implementation must not reinterpret an unresolved Area as an empty search, silently remove an
unsupported criterion, or fall back from an empty result to the full catalogue.

## Work Order decomposition

### RS-WO-043-01 — Implement shared Search semantics and ordinary UI/API parity

**Role:** Builder — application/API and Tenant UI  
**Status:** `INTEGRATED`
**Parallelization:** `SERIAL_SEARCH_AUTHORITY` — this Work Order owns the shared Search authority and
must complete before the WebMCP adapter Work Order.  
**Risk:** `Assured` — crosses server validation, UI interpretation, DTO parity, and stale/error states.  
**Allowed write set:**

- `src/server/application/listings.ts`
- `src/server/application/http.ts`
- `src/shared/contracts/listings-api.ts` (new only if a shared transport type is required)
- `src/ui/tenant/tenant-api.ts`
- `src/ui/tenant/tenant-discovery-page.tsx`
- `src/ui/tenant/tenant.module.css` (only styles required for the bounded Area suggestions/error state)
- `tests/application/listings.test.ts`
- `tests/api/listings.test.ts`
- `tests/ui/tenant-api.test.ts`
- `tests/ui/tenant-discovery-search-contract.test.ts` (new focused contract tests if required)

**Read set:** current versions of the allowed paths; `src/server/application/workflow.ts`,
`src/server/domain/workflow.ts`, `src/server/domain/types.ts`, `src/server/domain/projections.ts`,
`app/api/listings/route.ts`, `Docs/07-business-flows-and-scenarios.md`,
`Docs/05-api-and-integration-contracts.md`, ADR-RS-0014, and ADR-RS-0015.  
**Forbidden set:** all other `src/` and `app/` paths; package manifests/lockfiles; workflow state,
persistence schema, fixtures, authentication, Agent pages, shared navigation/global CSS, Cloud Receiver,
WebRTC, Redis, WebMCP registration, and all canonical docs.  
**Generated/local set:** `.next/`, test SQLite files under the existing local test boundary, and
browser evidence output are local/generated only and must not be staged.

**Required behavior:**

- replace the misleading `Shoreditch` placeholder with a truthful bounded Area discovery surface;
- derive unique suggestion labels from the same published tenant-safe catalogue authority, preserve
  first-seen source order, trim/case-normalize, and never fuzzy-match or auto-select a prefix;
- accept an exact canonical Area (including equivalent surrounding whitespace/case), reject unknown or
  unresolved values with bounded validation before the catalogue read, and preserve truthful empty
  results for known canonical values with no current published matches;
- map public `availableBy` semantics to the compatibility `availableFrom` path without two predicates;
- preserve safe integer/date bounds, inclusive comparisons, AND semantics, published-only filtering,
  deterministic source order, full bounded result return, `fixtureGeneration`, safe DTO fields,
  no mutation, and the existing manual Clear/Retry recovery;
- keep invalid attempts separate from the last accepted result and withhold stale data during an
  unavailable/malformed read; and
- add Red → Green → Refactor coverage for every accepted criterion, boundary, error, empty, stale,
  parity, privacy, and no-mutation rule.

This Work Order did not add WebMCP registration or dependency code. Main reviewed the exact-path
handoff, applied bounded contract-hardening fixes within the same write set, and integrated the
ordinary Search slice after focused checks, full checks, typecheck, build, and a clear handoff report.

**Main integration result (2026-09-03):** The ordinary Tenant Search path is integrated at product
code commit `534f5c9`. Main confirmed the ten-path boundary and added tests/validation for strict
logical-versus-HTTP filter separation, null/array/unknown filter rejection, shared Area
normalization, response-envelope consistency, and fail-closed handling of malformed or private
`appliedFilters` data. Focused UI/API/application checks passed `161/161`; typecheck, production
build, repository validators, sensitive scan, and local health passed. Browser smoke confirmed
truthful Area suggestions, bounded unselected-input validation, canonical `Southwark` application,
and a one-listing result without stale replacement. This confirms ordinary Search behavior only;
it does not claim WebMCP registration or supported-browser capability.

### RS-WO-043-02 — Add the thin page-bound read-only WebMCP adapter

**Role:** Builder — WebMCP page capability  
**Status:** `GATED_ON_RS-WO-043-01`  
**Parallelization:** `SERIAL_AFTER_SEARCH_AUTHORITY` — it may not overlap the shared page/controller
files in `RS-WO-043-01`.  
**Allowed write set:**

- `src/ui/tenant/tenant-discovery-page.tsx` (only the accepted adapter integration after WO-01)
- `src/ui/tenant/tenant-webmcp.ts` (new page-local adapter, if a separate module is cleaner)
- `tests/ui/tenant-webmcp.test.ts` (new focused adapter contract tests)

**Read set:** the frozen post-WO-01 source, ADR-RS-0015, the supported official WebMCP documentation,
the current browser/runtime configuration, and the existing Tenant Search tests.  
**Forbidden set:** server/domain/persistence/API authority changes, package manifests/lockfiles,
direct SQLite access, new tool registry, global/root/Agent registration, external authentication,
Cloud Receiver, WebRTC, Redis, browser automation workarounds, and canonical document edits.  
**Generated/local set:** `.next/`, browser evidence, and temporary browser capability output only.

**Required behavior:**

- feature-detect the currently supported WebMCP capability without making it a required dependency;
- register exactly one `search_listings` tool with the accepted four-property schema and read-only,
  untrusted-content-safe metadata;
- register only after server-resolved Tenant session and `/tenant` capability context are present;
- route execution through the shared Search controller/application authority, not a second predicate or
  direct persistence call;
- return the accepted logical result with normalized filters, `fixtureGeneration`, `matchedCount`,
  tenant-safe listings, `/tenant`, and `results`/`empty` page state only after page acceptance;
- return bounded validation/unavailable/malformed/superseded outcomes without raw diagnostics,
  silent fallback, or a false success;
- cancel in-flight work and unregister/replace the capability on route, session, role, component, or
  capability teardown; and
- leave the ordinary manual form usable when WebMCP is absent, unsupported, cancelled, or failed.

The exact external registration method, TypeScript declaration, browser flag/origin status, and
cancellation API must be revalidated at dispatch and verification. Do not add a speculative
`webmcp-types` or other dependency merely to satisfy typecheck.

### RS-WO-043-03 — Independent supported-browser verification and Main closure

**Role:** Verifier — independent read-only evidence  
**Status:** `GATED_ON_RS-WO-043-02`  
**Allowed write set:** none in product source or canonical docs; evidence may be written only through
the Main closure process.  
**Read set:** frozen post-Builder source, exact runtime/browser capability, fixture reset boundary,
Task File, ADR-RS-0015, and relevant tests.  
**Forbidden set:** product edits, fixture mutation outside disposable reset, Work Order repair, Git
staging/commit/push, and changing browser/tool capability to hide a failure.

The verifier must independently observe signed-out/wrong-role absence, authorized tool discovery and
exact metadata/schema, valid search/page agreement, canonical Area and all filter boundaries, empty and
validation recovery, unavailable/malformed/stale behavior, output privacy, no workflow mutation,
route/session teardown, unsupported-browser manual fallback, keyboard continuity, and clean browser
console/page-error state. Static `registerTool` text, ordinary HTTP `200`, TypeScript compilation, or
the tool response alone cannot prove WebMCP success.

Main accepts only an exact-path `VERIFIED` handoff, reconciles current status/Flow/API/WebMCP records,
records residuals and non-claims, commits promptly, and retires a temporary candidate Worktree only
after confirming its exact ownership and clean/recoverable state.

## Acceptance criteria

- Manual and tool Search support exactly the four accepted criteria and reject unknown fields/values.
- Area suggestions are truthful, bounded, deterministic, canonical, and never fuzzy or silently
  unfiltered.
- `availableBy` and compatibility `availableFrom` produce identical date-only inclusive semantics.
- All supplied criteria use AND semantics; only published listings return; source order is stable; the
  bounded local catalogue is returned in full with no caller pagination/truncation.
- Success, empty, validation, unavailable, malformed, superseded, signed-out, wrong-role, and
  unsupported-capability states are distinct and truthful.
- The result contains only the accepted tenant-safe DTO and the accepted source/page identity.
- Search is read-only and idempotent; no Favourite, Viewing Request, Information Request, notification,
  lease, audit, or workflow state changes occur.
- The page and tool agree after success; an older invocation cannot overwrite a newer one.
- WebMCP registration is observable only in a supported browser and is removed when its page/session
  context ends.
- Focused Red → Green → Refactor tests, complete RightSpot tests, typecheck, build, repository
  validators, sensitive scan, local health, and independent browser evidence pass.
- Documentation and Git closure identify exactly what is implemented and do not claim production,
  deployment, Cloud Receiver, external authentication, Redis, WebRTC, or universal WebMCP support.

## Non-goals and forbidden expansion

- No keyword, bedroom, property-type, full-text, map, geospatial, fuzzy, alias, ranking, recommendation,
  saved-search, notification, pagination, infinite-scroll, or live-inventory capability.
- No Favourite, Viewing Request, Information Request, Agent Operations, listing administration,
  authentication-provider, Cloud Receiver, WebRTC, Redis, deployment, or production-readiness work.
- No changes to workflow state, persistence schema, fixture content, role authority, tenant-safe DTO
  boundary, shared navigation, global CSS, or unrelated product surfaces.
- No direct SQLite query, SQL-like parser, generic tool registry, silent fallback, automatic retry loop,
  guessed filter, swallowed unsupported capability, or private-field exposure.
- No modification, staging, commit, push, or deletion of unrelated Web-Game, research, sibling, or
  collaborator-owned artifacts.

## Stop and reopen conditions

Stop the active Work Order and return to Main review if the browser API or permissions differ from the
accepted logical contract; Area requires a new authority; a new criterion/data source/state is needed;
the page and tool cannot share one predicate; an adapter exposes private/untrusted content; a read-only
call mutates state; lifecycle cleanup cannot be proven; a result must be capped/truncated; or the scope
expands into any excluded integration or marketplace feature. Reopen `RIGHTSPOT-042`/ADR-RS-0015 before
widening the semantic contract.

## Closure evidence

This Task remains `in_progress` after `RS-WO-043-01` integration. The closed decision gate is
recorded in `RIGHTSPOT-042` and ADR-RS-0015. `RS-WO-043-02` is the next Main-controlled gate and
has not yet been dispatched. The current integrated result does not claim WebMCP runtime
registration, browser support, deployment, or judge reproducibility; those remain later gates.
