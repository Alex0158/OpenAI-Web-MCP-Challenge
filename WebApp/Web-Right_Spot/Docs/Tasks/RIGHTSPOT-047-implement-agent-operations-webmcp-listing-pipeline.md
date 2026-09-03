# RIGHTSPOT-047 — Implement Agent Operations WebMCP listing-pipeline capability

**Type:** `implementation`  
**Lifecycle:** `pending`  
**Priority:** `P1` for the next selective WebMCP milestone; it does not block the ordinary local MVP,
the verified Tenant Search capability, or the manual Operations surface  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-03  
**Depends on:** accepted [ADR-RS-0017](../Decisions/ADR-RS-0017-agent-operations-webmcp-listing-pipeline-contract.md),
closed [`RIGHTSPOT-044`](RIGHTSPOT-044-implement-agent-operations-manual-read-surface.md),
closed [`RIGHTSPOT-045`](RIGHTSPOT-045-prevent-stale-operations-read-results.md), the existing
Operations authority/projection, and the verified Tenant adapter pattern in `RIGHTSPOT-043`

## Task Control

- Type: `implementation`
- Lifecycle: `pending`
- Execution posture: `MAIN_THREAD_SINGLE_SOURCE_WEBMCP_IMPLEMENTATION`
- Priority: `P1` — implement only the accepted Agent Operations `read_listing_pipeline` capability.
- Owner: Main RightSpot thread
- Current increment: Implement the thin page-bound adapter, strict runtime result boundary, and one
  page-owned read coordinator required by ADR-RS-0017; prove it with Red → Green → Refactor tests.
- Next gate: recapture the current Main source/runtime/browser capability, then dispatch the single
  Builder Work Order `RS-WO-047-01`. After its handoff, freeze the exact source and dispatch the
  independent supported-browser Verifier `RS-WO-047-02`. Main owns integration and documentation
  closure.
- Dependencies: ADR-RS-0017 is the contract authority. The existing manual `/agent/operations` page,
  `GET /api/agent/operations`, Operations projection, Agent role/assignment checks, and Tenant
  `search_listings` adapter remain read-only inputs. `RIGHTSPOT-012` may continue as a non-blocking,
  read-only audit provided it does not modify this Task's write set during a source freeze.
- Dispatch state: `not dispatched` — no Builder, Verifier, WebMCP registration, dependency install,
  fixture mutation, or Worktree is authorized until the baseline and browser gate are recaptured.
- Evidence status: `READY_FOR_BASELINE_RECAPTURE` — contract accepted; implementation source and
  supported-browser capability are not yet verified.

## Bounded objective

Implement exactly one page-bound WebMCP tool:

> On the server-resolved Agent `/agent/operations` page, `read_listing_pipeline` accepts the four
> structured fields frozen in ADR-RS-0017, reads through the existing Operations authority, returns an
> exact Agent-safe listing-pipeline result, and leaves the ordinary page showing that same result.

This Task is the source-bearing follow-up to `RIGHTSPOT-046`. It does not redesign Operations, add a
new report, or convert the application into a generic agent interface.

## Required contract

The implementation must follow ADR-RS-0017 exactly:

- tool name `read_listing_pipeline`, title `Read listing pipeline`, and the accepted bounded
  description;
- `readOnlyHint: true` and `untrustedContentHint: true`;
- object input with no required properties and `additionalProperties: false`;
- optional `area`, `publicationState`, `lifecycleState`, and `minPublishedAgeDays` only;
- exact, case-sensitive Operations Area equality with 1–80 characters and no surrounding whitespace;
- existing enum vocabulary and inclusive non-negative safe age threshold `0..9007199254740991`;
- omitted fields meaning no filter and all supplied fields using AND semantics;
- no natural-language parsing, aliases, fuzzy matching, prefix matching, silent filter removal,
  caller-selected query family, limit, pagination, sort, listing ID, or date range;
- existing `listingPipeline` Operations authority/projection and result cap/order/freshness;
- exact runtime allowlisting and reconstruction of envelope, filters, counts, and listing rows;
- one page-owned executor/coordinator shared by manual and tool reads;
- valid empty success, bounded validation/service/authority/malformed/stale outcomes, and no raw
  exception or server diagnostic text; and
- Agent page/session lifecycle cleanup with a complete manual fallback when WebMCP is unavailable.

Duplicate JSON object keys are not a tool-input acceptance claim because parsed JavaScript objects do
not preserve them. Existing HTTP duplicate-parameter validation remains outside this adapter's input
test. Every tool invocation must still recheck server session, role, and assignment through the normal
HTTP/application boundary; an unassigned Agent receives bounded `FORBIDDEN` and no projection.

## Implementation boundary

### Required read set

- repository `AGENTS.md` and the applicable tracked contributor/runbook authority;
- RightSpot `Docs/README.md` if present, `Docs/00-current-status.md`, `Docs/06-validation-and-evidence.md`,
  `Docs/07-business-flows-and-scenarios.md`, `Docs/Development/README.md`,
  `Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md`, and
  `Docs/Development/RIGHTSPOT-WEBMCP-ROADMAP.md`;
- `RIGHTSPOT-046`, ADR-RS-0017, `RIGHTSPOT-044`, `RIGHTSPOT-045`, ADR-RS-0012, and ADR-RS-0016;
- `src/server/application/operations-insights-http.ts` and `src/server/application/operations-insights.ts`;
- `src/server/domain/operations-profile-projection.ts`, `src/server/domain/operations-profile-types.ts`,
  and the Operations persistence boundary as read-only authority;
- `src/shared/contracts/operations-api.ts`;
- `src/ui/agent/operations/operations-api.ts` and `src/ui/agent/operations/operations-page.tsx`;
- `src/ui/tenant/tenant-webmcp.ts` and its focused tests as the existing lifecycle reference;
- current Operations API/page tests and the package scripts; and
- the actual supported browser/feature-flag capability at baseline recapture.

### Allowed write set

The Builder may modify only these exact paths:

- `src/ui/agent/operations/operations-webmcp.ts` — new page-bound adapter and logical tool contract;
- `src/ui/agent/operations/operations-api.ts` — strict shared response validation/reconstruction and
  bounded client error mapping, only as required by ADR-RS-0017;
- `src/ui/agent/operations/operations-page.tsx` — one shared page-owned executor/coordinator and
  lifecycle wiring, without changing ordinary report authority or visual scope;
- `tests/ui/operations-webmcp.test.ts` — new unit/contract/lifecycle tests; and
- `tests/ui/operations-page.test.ts` — focused coordinator/page regression tests only.

The Builder must not touch any other path. If the accepted contract cannot be implemented within this
write set, stop and return to Main for a new bounded decision; do not widen the set opportunistically.

### Forbidden set

- all `src/server/**`, `src/shared/contracts/**`, `src/server/persistence/**`, `app/**`, `public/**`,
  database, fixture, reset, or generated files;
- package manifests, lockfiles, environment/credential files, or external dependencies;
- Tenant Search adapter/source/tests, ordinary Agent Operations domain/projection/API semantics, relay
  workflow, Favourite/Viewing Request/Information Request behavior, or shared shell/navigation;
- direct SQLite access, a second query/predicate/count engine, a second reporting DTO, natural-language
  parsing, generic chat, hidden fallback, arbitrary retry, cross-origin bridge, or client role/identity;
- mutation, notification, contact, confirmation, Cloud Receiver, Re-entry, WebRTC, Redis, external
  authentication, deployment, production hardening, or universal browser support;
- any Git commit, push, merge, Worktree creation, deletion, or canonical documentation write by the
  Builder; and
- any change outside the exact source/test write set to make a verification harness pass.

### Generated/evidence set

Disposable browser/API output may remain only under the existing RightSpot generated boundary such as
`.playwright-cli/`; it is not source, must not be staged, and must not be used as a substitute for
canonical evidence. Browser screenshots or logs are evidence only after the supported-browser,
fixture, and source identity are recorded.

## Red → Green → Refactor plan

The Builder must first add failing tests, then the smallest implementation, then refactor without
changing the accepted contract.

### Red contract and privacy cases

- exact static tool name/title/description/annotations/schema and one registration only;
- unknown fields, `null`, empty values, empty/whitespace/oversized Area, wrong-case or surrounding-
  whitespace Area according to the frozen exact semantics, unsupported enums, negative/decimal/
  unsafe/non-finite age, and malformed structured input;
- unknown top-level/filter/count/item response keys, including injected `tenantId`, contact, notes,
  `databasePath`, diagnostics, or arbitrary listing fields;
- signed-out, Tenant, wrong-role, and unassigned-Agent outcomes;
- registration unavailable, synchronous/asynchronous registration failure, rerender duplication,
  route departure, unmount, session/role change, and capability teardown; and
- valid empty, authority failure, persistence/service failure, malformed response, stale/aborted, and
  retry outcomes without raw text or stale success.

### Green behavior

- valid structured input reaches only the existing Agent Operations listing-pipeline HTTP/application
  path and returns an exact allowlisted response;
- manual and tool execution share one page-owned coordinator and the page reflects the accepted
  filters, loading state, counts, freshness, rows, or truthful empty state;
- a current successful invocation returns exactly what the page adopts, including empty success;
- an invalid tool call does not replace the last accepted page result;
- overlapping manual/tool reads preserve the newest logical read across late success, error, `finally`,
  clear, abort, unmount, route, and session settlement; stale callers receive `STALE_RESULT`; and
- unsupported WebMCP leaves the ordinary manual page complete and usable.

### Refactor guard

The final diff must retain one authority, one result allowlist, one page read identity, bounded inputs,
bounded errors, and no state mutation. Tests must prove no Favourite, Viewing Request, Information
Request, notification, persistence, relay, or fixture change occurs.

## Acceptance criteria

Close this Task only after all of the following are true:

1. The exact contract in ADR-RS-0017 is represented in source and focused tests without source or
   schema drift.
2. The adapter is registered only on the server-resolved Agent `/agent/operations` page/session and
   never on root, Tenant, wrong-role, signed-out, or unrelated routes.
3. Every invocation uses the existing server role/assignment authority and existing listing-pipeline
   projection; no direct database or duplicate business logic exists.
4. Runtime output is exact allowlisted Agent-safe data; injected extra fields fail closed or cannot
   cross the tool boundary.
5. Manual and tool reads have one latest-read identity, exact page parity, truthful empty/error/stale
   states, and no false success or hidden fallback.
6. WebMCP registration failure or unsupported capability leaves the full manual Operations page usable.
7. Focused Red → Green → Refactor tests pass, then the complete RightSpot suite, non-incremental
   typecheck, production build, repository validators, sensitive scan, and `git diff --check` pass.
8. Independent `RS-WO-047-02` verifies the frozen source in the declared supported browser: discovery,
   exact metadata/schema, valid/invalid invocation, page parity, privacy, role/assignment, teardown,
   no mutation, responsive/accessibility behavior, and clean console/page-error evidence.
9. Main reviews exact paths/source identity, integrates only the accepted candidate, updates this Task,
   current status, evidence ledger, business-flow/WebMCP roadmap as needed, commits, pushes, and
   confirms one canonical Main Worktree.

## Work Orders

### RS-WO-047-01 — Implement the page-bound Agent Operations WebMCP adapter

**Status:** `PENDING_BASELINE_RECAPTURE`  
**Role:** WebMCP/API/UI implementation Builder  
**Parallelization:** `SERIAL_SINGLE_WRITER` — no other source writer may touch the five-path write set  
**Model gate:** WebMCP implementation must use a capable supporting worker with `gpt-5.6-sol` and
`medium` reasoning when dispatched; if the capability is unavailable, report the blocker and do not
substitute an unsupported model for WebMCP runtime work  
**Source baseline:** Must be recaptured immediately before dispatch; the documentation baseline at task
registration is Main `68adfc41da0e2a31bbac1537351619b186cda7a5`, while product source remains the
reviewed `3582ba4` checkpoint  
**Write set:** exactly the five paths listed above  
**Handoff:** Return changed paths, Red/Green/Refactor evidence, focused/full/static results, runtime
assumptions, unresolved risks, and a proposed frozen source identity. Do not commit, push, alter task
state, modify canonical docs, or create a Worktree.

### RS-WO-047-02 — Independently verify the integrated capability

**Status:** `NOT_DISPATCHED`  
**Role:** Independent WebMCP/browser Verifier  
**Parallelization:** `AFTER_BUILDER_SOURCE_FREEZE` — Builder source and Main Git ref are frozen during
the check; no Main docs/status writeback or other worker may move the verified source  
**Scope:** Verify the integrated candidate against the exact frozen source and fixture without editing
source/tests/docs or mutating the durable fixture; use `gpt-5.6-sol` with `medium` reasoning for
WebMCP-specific evaluation  
**Required evidence:** supported-browser runtime discovery/invocation, exact schema/metadata, valid
and invalid argument boundaries, page parity, allowlisted output/privacy, session/role/assignment
lifecycle, unsupported fallback, stale/abort/teardown behavior, no mutation, responsive/accessibility
behavior, console/page errors, focused/full/static checks, and exact source identity  
**Stop condition:** Any source drift, ownership conflict, unsupported browser/API assumption, privacy
leak, page/tool disagreement, false success, hidden fallback, or fixture mutation stops verification
and returns a bounded report to Main.

## Stop and reopen conditions

Stop the implementation and return to Main if:

- the browser exposes a different registration/cleanup contract than the accepted lifecycle;
- one page-owned executor cannot preserve the manual/tool latest-read identity;
- strict runtime allowlisting requires a new server/shared contract or second authority;
- assignment cannot be enforced by the existing server boundary;
- implementation needs to modify a forbidden/shared path, add a dependency, or create a Worktree;
- `upcomingViewings`, mutations, natural-language parsing, generic reporting, or any deferred
  integration becomes necessary for the selected goal; or
- source drift, collaborator ownership, or Git divergence prevents a reproducible freeze.

No fallback implementation, source weakening, test weakening, or documentation-only claim may be used
to bypass a stop condition. A failed WebMCP capability may be removed/disabled while preserving the
ordinary manual Operations page.

## Non-goals

- `upcomingViewings` WebMCP, history, charts, exports, pagination, saved/scheduled reports, or CRM;
- changes to Operations authority/projection/persistence, workflow state, role model, or route/API
  semantics;
- mutations, confirmation, contact, notifications, external authentication, Cloud Receiver, WebRTC,
  Redis, deployment, production hardening, or universal browser support; and
- claiming probabilistic Agent goal success from deterministic application tests or one browser run.

## Current disposition

This is the only source-bearing Task admitted by the accepted ADR-RS-0017 contract. It is intentionally
pending until Main recaptures the exact current baseline and WebMCP browser capability. The first
implementation dispatch is one single-writer Builder Work Order; verification is a separate frozen-
source gate. The active `RIGHTSPOT-012` audit may continue on non-overlapping read-only surfaces, but
it cannot mutate this Task's five-path write set or move a verifier baseline.
