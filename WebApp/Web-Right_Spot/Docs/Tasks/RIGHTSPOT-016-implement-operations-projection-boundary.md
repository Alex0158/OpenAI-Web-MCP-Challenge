# RIGHTSPOT-016: Implement the governed Operations projection

**Type:** `implementation`  
**Lifecycle:** `in_progress`  
**Priority:** `P1` for the first manual Operations read surface  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-01  
**Depends on:** ADR-RS-0012; independently verified and integrated `RIGHTSPOT-015`; closed relay-only `RIGHTSPOT-011`

## Task Control

- Type: `implementation`
- Lifecycle: `in_progress`
- Priority: `P1`
- Owner: Main RightSpot thread
- Objective: Project the verified Operations authority into a deterministic, privacy-safe contract
  for the first manual read surface without adding HTTP, routes, UI, navigation, WebMCP, or relay
  behavior.
- Current increment: `RS-WO-016-01` is ready to implement against the independently verified and
  integrated Operations authority at product commit `e7f30d5`.
- Next gate: Dispatch one exact pure projection Builder. A separate transport Work Order follows only
  after this projection is independently verified and integrated.
- Execution posture: `READY_FOR_BUILDER_DISPATCH`; no transport, route, UI, navigation, or WebMCP source
  is authorized by this registration.

## Accepted projection boundary

ADR-RS-0012 accepts two first-release query families over the separate Operations profile:

1. upcoming viewings, filtered by explicit London-calendar date range and optionally status, area, or
   listing; and
2. listing pipeline, filtered by area, publication state, lifecycle state, or minimum published age.

The projection is a pure read model over `OperationsProfileState`. It must not open SQLite, resolve
cookies, call HTTP, mutate input, read the browser clock, or reproduce query logic in a future UI. It
must not use the relay `src/server/domain/operations-projection.ts` as its authority; the relay seam
remains a separate closed boundary.

## RS-WO-016-01 — Implement the governed Operations projection

**Role:** Builder  
**Pre-dispatch status:** `READY_FOR_DISPATCH`  
**Parallelization:** `SERIAL_AFTER_AUTHORITY` — the authority is now verified/integrated; only the new projection write set is active  
**Risk profile:** `Standard` — pure projection and query validation, with privacy and time-boundary checks  
**Supporting worker:** To be assigned by the main thread  
**Source baseline:** `e7f30d5703d0d51f8980407717a4fbc197a69732` on `main`, the integrated Operations authority baseline; collaborator-owned dirty and untracked paths remain outside this Work Order  
**Dispatch state:** `READY_FOR_DISPATCH`  
**Next gate:** Return `READY_FOR_VERIFICATION` with exact candidate source identity; do not start transport, route, UI, or WebMCP work  
**Ownership:** The Builder owns only the new projection module and focused tests. The main thread owns source freeze, canonical writeback, integration, and closure.

### Required read set

- `/Users/alex/.codex/AGENTS.md`, `/Users/alex/OpenAI-WebMCP/AGENTS.md`, and
  `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/AGENTS.md`.
- RightSpot `RUNBOOK.md`, all canonical product/domain/API/validation documents, and ADR-RS-0001
  through ADR-RS-0012.
- `RIGHTSPOT-015`, the integrated Operations profile types/authority/store after its verification,
  and the closed relay-only `RIGHTSPOT-011` module for contrast.
- The current session/actor vocabulary and relevant existing tests, without modifying their source.

### Allowed write set

- `src/server/domain/operations-profile-projection.ts`
- `tests/domain/operations-profile-projection.test.ts`

Do not modify Operations authority/types/store, relay domain/types/workflow/store, shared contracts,
application services, routes, pages, UI, navigation, package metadata, configuration, fixtures,
assets, generated output, or canonical documents. If the actual authority requires a shared-file edit,
stop and return `NEEDS_REVIEW`.

### Required behavior

1. **Authorization:** accept an explicit agent actor and reject non-agent or unassigned-agent reads
   using the bounded domain error vocabulary. Scope all listing, request, and slot rows to the
   actor's assigned portfolio; natural-language input is not part of this pure module.
2. **Upcoming viewings:** derive `PROPOSED` only from a valid `SLOT_PROPOSED` request plus its valid
   selected slot, and `CONFIRMED` only from `VIEWING_CONFIRMED` plus its valid selected slot. Never
   treat preferred tenant times, drafts, expired/declined requests, or orphaned relationships as an
   appointment. Use `[from, to)` London-local calendar boundaries and deterministic ordering.
3. **Listing pipeline:** derive rows and counts from actual Operations listing records. Preserve
   publication/lifecycle vocabulary, use explicit `firstPublishedAt`, calculate stale age without
   database creation time, and return authority-unavailable failure when required fields are invalid
   or missing. Do not infer tenant interest or occupancy.
4. **Bounded result:** allow only the explicit structured filters from ADR-RS-0012, enforce a maximum
   of 25 returned rows, expose exact `totalCount` and `returnedCount`, and make truncation explicit.
   Do not add cursors, arbitrary query language, SQL, charts, or natural-language parsing in this
   checkpoint.
5. **Envelope:** return profile identity, fixture generation, `Europe/London`, evaluated `asOf`,
   fixture `dataAsOf`, `CURRENT` freshness for same-source reads, interpreted filters, exact counts,
   and bounded items. Keep output free of tenant identity/contact data, private notes, command
   metadata, persistence details, and assigned-agent IDs.
6. **Purity:** prove input non-mutation, deterministic ordering, explicit empty results for valid
   complete authority, and visible failure for invalid authority. Unsupported Favourite and
   Information Request signals must be absent or explicitly unavailable, never zero-filled.

### Verification preparation and return gate

Use the pinned Node `24.20.0` / npm `11.19.0` runtime where available. Run focused projection tests,
`npm run typecheck`, `npm test`, `npm run build`, and `git diff --check`. Return
`READY_FOR_VERIFICATION` with exact source identity, changed paths, authorization/privacy/time/filter
evidence, empty/truncated/invalid-authority cases, runtime results, skipped consumer evidence, and
claim limits. Stop after handoff; independent verification and all transport/UI/WebMCP work are
separate gates.

## Forbidden scope and stop conditions

- No SQLite, persistence mutation, reset, HTTP, API DTO, route, page, navigation, WebMCP, Cloud
  Receiver, external service, authentication change, notification, contact, Favourite, Information
  Request, lease, occupancy, history, analytics warehouse, or new dependency.
- No modification of the existing relay Operations seam or relay workflow types.
- No hidden fallback, browser-clock query semantics, silent truncation, unbounded filters, tenant
  enumeration, cross-agent leakage, or fabricated metrics.
- Stop if `RIGHTSPOT-015` is not independently verified/integrated, if the authority contract is
  incomplete, or if a shared path is required.

## Closure gate

Close this task only after `RS-WO-016-01` is independently verified and integrated against the exact
Operations authority snapshot. A later application/transport task must consume this projection rather
than reimplementing its filters or counts.

## Reopen condition

Reopen if the Operations authority changes its lifecycle/time model, a query requires historical
events or 008/009 signals, privacy scope changes, pagination/cursors become necessary, or a consumer
cannot use the projection without changing relay or authority ownership.
