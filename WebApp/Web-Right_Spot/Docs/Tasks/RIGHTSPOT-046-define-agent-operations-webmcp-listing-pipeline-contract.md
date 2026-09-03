# RIGHTSPOT-046 — Define Agent Operations WebMCP Listing Pipeline Contract

**Type:** `decision`  
**Lifecycle:** `pending`  
**Priority:** `P1` for the next selective WebMCP milestone; it does not block the accepted ordinary
local MVP or the already verified Tenant Search capability  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-03  
**Depends on:** [`RIGHTSPOT-010`](RIGHTSPOT-010-define-agent-operations-insights-dashboard-boundary.md),
[`RIGHTSPOT-013`](RIGHTSPOT-013-establish-operations-profile-authority.md),
[`RIGHTSPOT-015`](RIGHTSPOT-015-implement-operations-profile-authority.md),
[`RIGHTSPOT-016`](RIGHTSPOT-016-implement-operations-projection-boundary.md),
[`RIGHTSPOT-044`](RIGHTSPOT-044-implement-agent-operations-manual-read-surface.md),
[`RIGHTSPOT-045`](RIGHTSPOT-045-prevent-stale-operations-read-results.md), and
[ADR-RS-0016](../Decisions/ADR-RS-0016-agent-operations-manual-read-surface-boundary.md)

## Task Control

- Type: `decision`
- Lifecycle: `pending`
- Execution posture: `MAIN_THREAD_SERIAL_CONTRACT_REVIEW`
- Priority: `P1` — a bounded Operations WebMCP read capability is the next selectively admissible WebMCP milestone, but it is not required to keep the ordinary MVP runnable.
- Owner: Main RightSpot thread
- Current increment: Decide whether to admit one implementation-ready, read-only Agent Operations WebMCP contract for the assigned listing pipeline, and if accepted freeze its authority, schema, page parity, lifecycle, privacy, and evidence boundaries.
- Next gate: Main must accept or reject the contract in a new RightSpot ADR. If accepted, reconcile this Task, the WebMCP roadmap, current status, and evidence ledger, then register a separate implementation Task. No source implementation or WebMCP registration is authorized by this Task alone.
- Dependencies: The Operations authority/projection and ordinary Agent-only manual surface must remain unchanged at the reviewed baseline; `RIGHTSPOT-012` may continue as a non-blocking read-only audit. The current WebMCP/browser capability must be rechecked at the later implementation gate.
- Dispatch state: `not dispatched` — Main-owned contract review; no Builder, Verifier, dependency installation, WebMCP registration, product source change, fixture mutation, or Worktree is authorized.
- Evidence status: `CONTRACT_PROPOSAL_READY_FOR_MAIN_REVIEW` — the manual prerequisite and consumer latest-read repair are closed; this Task records the separate decision boundary required before any Operations tool exists.

## Bounded objective

Produce one explicit decision for the smallest useful Agent Operations WebMCP capability:

> An authenticated Agent already viewing `/agent/operations` can request the current assigned
> listing pipeline through a read-only page-bound capability, and the ordinary Operations page visibly
> renders the same authoritative result.

This is a contract decision, not an implementation task. It must decide the logical capability and
its observable boundaries without prematurely freezing an external draft WebMCP API, adding a second
query engine, or turning the Operations surface into a general-purpose reporting product.

## Why this Task is registered now

The following gates are complete and make a new decision review actionable:

- `RIGHTSPOT-010` is closed as a reviewed staged proposal; it does not itself authorize WebMCP.
- `RIGHTSPOT-013`, `RIGHTSPOT-015`, and `RIGHTSPOT-016` provide the accepted Operations authority and
  pure projection.
- `RIGHTSPOT-044` is `CLOSED_VERIFIED` for the normal Agent-only `/agent/operations` route,
  `GET /api/agent/operations` consumer, navigation entry, role/privacy boundary, and two existing
  query families.
- `RIGHTSPOT-045` is `CLOSED_VERIFIED` for the manual consumer's latest-read sequencing boundary;
  its repair did not change the API, domain, projection, fixture, role, or WebMCP contract.
- The first Tenant `search_listings` WebMCP slice is independently verified, so the project now has a
  concrete page-bound WebMCP pattern to compare against without assuming that every page should expose
  a tool.
- Current source inspection shows no Operations WebMCP registration. The only current adapter is the
  Tenant Search adapter, and the current in-app browser/Luna bridge is not WebMCP success evidence.

This evidence supports opening a contract decision. It does not prove that the Operations tool has
value, is compatible with every browser, or should be implemented.

## Proposed first capability

The Main review should accept, revise, or reject the following bounded proposal.

### Actor and page

- Actor: the server-resolved `agent` session only.
- Page: `/agent/operations` only.
- Scope: the assigned Agent's current Operations projection; no portfolio-wide or cross-actor read.
- Mode: read-only. Invocation cannot save, submit, prepare, send, confirm, decline, contact, notify,
  alter a listing, or mutate the workflow fixture.
- Capability name: logical name `read_listing_pipeline`. The external registration method, metadata
  shape, and browser-specific API remain implementation-gate questions.

The page and server must derive access from the current session and route. A client-supplied role,
hidden flag, tool argument, or stale registration must never grant Agent access.

### Exact input boundary

The proposed tool accepts only these optional fields. It supplies `kind: "listingPipeline"` internally
to the existing Operations read boundary; callers do not choose a query family.

| Field | Proposed meaning | Required decision boundary |
|---|---|---|
| `area?: string` | Existing bounded Operations Area filter against the canonical listing Area value | Confirm exact case/whitespace behavior and preserve the existing exact semantic; no prefix, fuzzy, alias, geospatial, or hidden all-area fallback |
| `publicationState?: "PUBLISHED" | "UNPUBLISHED"` | Existing publication-state facet | Reject every other value and every duplicate/unknown field |
| `lifecycleState?: "OPEN" | "UNAVAILABLE" | "LET_AGREED" | "ARCHIVED"` | Existing lifecycle-state facet | Preserve the Operations vocabulary and legal state authority; do not infer a new state |
| `minPublishedAgeDays?: number` | Existing non-negative whole-day threshold, inclusive at the projection boundary | State the safe numeric upper bound explicitly; do not add an invented business meaning or accept unsafe/non-finite numbers |

The accepted contract must define whether a missing field means “no filter” and must preserve the
existing AND combination semantics. Empty strings, surrounding whitespace, malformed numeric values,
unsafe integers, unsupported enum values, duplicate fields, and extra fields must produce a bounded
validation result rather than be ignored or guessed. The implementation must not silently translate
natural-language requests into these fields.

The initial proposal deliberately does not add `limit`, pagination, sort, free-text `query`, date
range, `listingId`, or a caller-selected `kind`. The projection's existing result cap and deterministic
ordering remain authoritative.

### Authority and result boundary

The tool must use the existing chain:

```text
page-bound capability -> existing Operations HTTP/application boundary ->
Operations profile projection -> assigned Agent-safe result
```

The contract must not permit direct SQLite reads, client-selected database paths, duplicated listing
predicates, a second count implementation, or a new reporting store. The result is the existing
`listingPipeline` variant of `OperationsApiResponse`, including:

- `profile`, `fixtureGeneration`, `timezone`, server `asOf`, `dataAsOf`, and `freshness`;
- normalized/applied filters;
- exact `totalCount`, `returnedCount`, and `truncated` state;
- existing publication and lifecycle counts; and
- the existing Agent-safe listing rows only.

The result remains bounded by `OPERATIONS_PROJECTION_MAX_ROWS` and does not expose tenant identity,
contact information, notes, raw workflow ledger fields, database details, or internal diagnostics.
The tool must not reword or fabricate a result when the authoritative read returns an empty collection.

### Manual-page parity and read sequencing

A successful invocation must cause the ordinary `/agent/operations` result surface to show the same
authoritative response or a clearly equivalent projection with the same filters, counts, freshness,
and item identity. A tool-only answer is insufficient.

The contract must require one page-owned read execution path or coordinator for manual and tool reads.
The future implementation must not create a second asynchronous state machine beside the repaired
`latestReadId`/unmount protections in `operations-page.tsx`. If the tool and a human control run close
together, the newest logical read must remain authoritative; an older success, error, or completion
callback must not overwrite or clear the newer state. The contract must define how this identity is
preserved without changing the existing API/domain authority.

### Lifecycle and unsupported capability

- Registration is feature-detected and is limited to the server-resolved Agent Operations page/session.
- Signed-out, Tenant, wrong-role, unassigned, and unrelated routes expose no callable Operations tool.
- Leaving the route, changing the resolved role/session, or losing the relevant capability must tear
  down or invalidate the prior registration. A stale tool must not remain callable in another context.
- WebMCP unavailability leaves the normal manual page fully usable. There is no fake success, silent
  no-op, crash, or hidden alternate transport.
- The implementation gate must recheck the actual supported browser API, registration return/cleanup
  behavior, feature flag, and teardown semantics before source work begins.

### Failure, privacy, and trust boundary

The accepted contract must preserve bounded outcomes for at least:

| Condition | Expected boundary |
|---|---|
| No valid session | `401 UNAUTHENTICATED` / bounded tool error; no result |
| Tenant, wrong-role, or unassigned actor | `403 FORBIDDEN` / bounded tool error; no private projection |
| Unknown, duplicate, malformed, or out-of-bounds input | `400 VALIDATION_FAILED` / bounded tool error |
| Valid query with no matches | `200` with truthful empty items and counts; never fall back to another query |
| Authority or persistence failure | Existing bounded `503` mapping; no raw exception or database detail |
| Unsupported browser capability | Manual page remains usable and clearly does not claim tool availability |
| Late or superseded read | Newer logical read remains visible; stale callbacks cannot change page state |

Tool inputs and returned listing text are untrusted data. The tool must not execute natural-language
instructions embedded in listing content, expose raw diagnostics, or treat a tool result as proof of a
state-changing action. No mutation, notification, contact, or Re-entry/Cloud Receiver effect belongs
in this Task.

## Required contract review questions

Main must answer these questions in the accepted ADR or record why the proposal is rejected/deferred:

1. Does listing-pipeline inspection materially improve an accepted Agent goal enough to justify one
   more tool, or should the project remain at the verified Tenant Search slice?
2. Is the current exact canonical Area behavior the correct Operations semantics, including case and
   surrounding-whitespace handling, without borrowing Tenant Search's suggestion behavior?
3. What explicit safe upper bound applies to `minPublishedAgeDays`, and is it a protocol bound or a
   product-domain bound?
4. Is the existing `OperationsApiResponse` listing variant sufficient without a tool-specific duplicate
   envelope or a new projection field?
5. What page-owned executor/coordinator preserves one latest-read identity for manual and tool reads?
6. What exact registration cleanup/invalidating behavior is available in the supported browser API?
7. Is `upcomingViewings` intentionally excluded until the `asOf`/fixture clock and reproducibility
   strategy is resolved? The initial recommendation is yes.
8. Which browser, feature flag, and agent-evaluation evidence is required before implementation closure,
   and which claims remain explicitly unsupported?

## TDD contract catalogue for the later implementation Task

This decision Task does not add tests or source. The later implementation Task must turn the accepted
contract into Red → Green → Refactor coverage, including at minimum:

- Red: extra/duplicate fields, invalid enums, empty or surrounding-whitespace Area, oversized Area,
  unsafe/non-integer/negative age, wrong role, signed-out session, unsupported capability, and malformed
  authoritative envelopes fail visibly and do not mutate state.
- Green: a valid Agent `read_listing_pipeline` request reaches the existing Operations authority,
  returns exact listing-pipeline counts/items/freshness, and updates the ordinary page surface.
- Green: no-match results remain empty; no fallback, hidden retry, alternate query family, or fabricated
  listing is introduced.
- Green: manual and tool reads preserve the same latest-read identity under controlled overlapping
  success/error/completion order.
- Refactor: shared authority and coordinator remain single-source; no duplicate predicates, direct DB
  access, new state machine, unbounded input, or private-field leak is introduced.
- Browser evidence is separate from unit/API tests and must cover discovery, invocation, page parity,
  teardown, wrong-role/session boundaries, unsupported WebMCP, no mutation, and responsive/accessibility
  behavior on the declared supported browser.

## Work Order boundary

### RS-WO-046-01 — Main-owned Operations WebMCP contract review

**Status:** `PENDING_MAIN_REVIEW`  
**Role:** Main-thread Product, Architecture, API, UX, privacy, and WebMCP decision owner  
**Parallelization:** `SERIAL_SHARED_OPERATIONS_CONTRACT` — optional read-only specialist challenge may
review the frozen source, but Main owns the decision and all canonical writeback  
**Risk profile:** `Assured` for contract quality; no product code is authorized

**Source baseline:** Main branch at `c728547fa57ea93cd8e16275e276713c148e752d`; product source remains
unchanged from the reviewed `RIGHTSPOT-045` product checkpoint `3582ba4`. Main must recapture the
baseline before any later implementation Task.

**Required read set:**

- repository `Docs/README.md`, `AGENTS.md`, and the applicable engineering/runbook authority;
- RightSpot `Docs/00-current-status.md`, `Docs/06-validation-and-evidence.md`,
  `Docs/Development/RIGHTSPOT-WEBMCP-ROADMAP.md`, `Docs/Tasks/README.md`, and this Task;
- `RIGHTSPOT-010`, `RIGHTSPOT-012`, `RIGHTSPOT-044`, and `RIGHTSPOT-045`;
- ADR-RS-0011, ADR-RS-0012, ADR-RS-0016, and the future accepted ADR if created;
- `src/server/application/operations-insights.ts`;
- `src/server/application/operations-insights-http.ts`;
- `src/server/domain/operations-profile-projection.ts`;
- `src/server/domain/operations-profile-types.ts`;
- `src/shared/contracts/operations-api.ts`;
- `src/ui/agent/operations/operations-api.ts` and `src/ui/agent/operations/operations-page.tsx`;
- `src/ui/tenant/tenant-webmcp.ts` as the existing page-bound adapter reference; and
- the focused Operations and Tenant WebMCP tests named by the current package test surface.

**Allowed write set for this decision checkpoint:**

- this Task file;
- `Docs/Tasks/README.md`;
- a new accepted `Docs/Decisions/ADR-RS-0017-*.md`, only if the contract is accepted;
- `Docs/Decisions/README.md`, only to index that ADR;
- `Docs/Development/RIGHTSPOT-WEBMCP-ROADMAP.md`;
- `Docs/00-current-status.md`; and
- `Docs/06-validation-and-evidence.md`.

These writes may only record the decision, lifecycle, evidence, next gate, and non-claims. They do
not authorize a source or test change.

**Forbidden set:** all RightSpot `src/**`, `tests/**`, `app/**`, `public/**`, `var/**`, database or
fixture files, package manifests/lockfiles, environment/credential files, generated browser output,
outer Core/Mechanisms, Cloud Receiver, external authentication, WebRTC, Redis, deployment, production,
or Hackathon submission surfaces. No deletion, Worktree creation, dependency installation, database
mutation, or WebMCP registration is allowed.

**Generated set:** disposable browser/API probe output may remain local under the existing generated
boundary only; it is not part of the contract commit and must not be staged.

## Closure criteria

Close this Task only when one of these explicit outcomes is recorded:

### Accepted contract

- a new ADR (expected next RightSpot ADR number `ADR-RS-0017`, subject to index verification) accepts
  the exact tool goal, schema, authority, page parity, latest-read identity, lifecycle, privacy,
  errors, browser gate, non-goals, and `upcomingViewings` exclusion;
- the Task, local task index, WebMCP roadmap, current status, evidence ledger, and ADR index agree;
- the ADR explicitly states that a separate implementation Task is required; and
- no product source, test, dependency, fixture, runtime, or WebMCP registration changed as part of
  this decision checkpoint.

### Rejected or deferred contract

- the reason, evidence, residual risk, and concrete reopen trigger are recorded;
- no implementation Task or WebMCP registration is implied; and
- the ordinary manual Operations surface and Tenant WebMCP slice remain unchanged.

## Stop and reopen conditions

Stop and return to Main decision review if:

- an authority, role, privacy, data-source, workflow, or shared-file boundary changes;
- the proposed tool cannot share one authoritative read path and page state with the manual surface;
- the supported browser API or cleanup behavior differs materially from the assumed lifecycle;
- `upcomingViewings` is required before its clock/fixture reproducibility issue is resolved;
- implementation pressure attempts to add natural-language parsing, direct SQL, hidden fallback, a
  second reporting model, or mutation into this Task; or
- source drift, collaborator ownership, or Git divergence makes the recorded baseline stale.

If any of these conditions is intentional rather than accidental, create or update the appropriate
decision record before changing this Task's boundary.

## Non-goals

- Implementing or registering `read_listing_pipeline`.
- Adding an `upcomingViewings` tool or resolving its temporal fixture strategy.
- Reopening `RIGHTSPOT-010`, `RIGHTSPOT-044`, or `RIGHTSPOT-045`.
- Changing Operations API/domain/projection/persistence semantics or the ordinary manual UI.
- Adding dashboard history, charts, exports, saved reports, scheduled reports, analytics, SQL, or a
  generic chatbot.
- Adding mutations, contact/notification behavior, external authentication, Cloud Receiver, WebRTC,
  Redis, deployment, production hardening, or universal WebMCP/browser claims.

## Current disposition

This Task is registered as the next bounded WebMCP decision gate under the active Main-thread Goal.
It is intentionally pending: the existence of a verified manual Operations surface is evidence for a
review, not permission to implement a tool. The next Main increment is to challenge and either accept
or defer this exact proposal, then create a separate implementation Task only if the contract is
accepted.
