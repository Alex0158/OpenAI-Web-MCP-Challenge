# RIGHTSPOT-040 — Keep tenant Discovery error copy server-safe

**Type:** `defect`  
**Lifecycle:** `closed`  
**Priority:** `P2` for tenant error-state trustworthiness  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-02  
**Depends on:** `RS-FLOW-02`, the tenant listing-read adapter, and the accepted bounded error-copy rule

## Task Control

- Type: `defect`
- Lifecycle: `closed`
- Priority: `P2` — the normal catalogue flow remains available, but a failed read can expose
  uncontrolled server text and duplicate the error surface.
- Owner: Main RightSpot thread
- Current increment: Closed after the bounded Discovery consumer repair, focused TDD, full checks, and
  isolated browser failure/recovery verification.
- Next gate: None for this bounded outcome; return to the Main-thread cross-layer audit.
- Dependencies: None blocking; no server, API, domain, persistence, auth, or shared-navigation change
  is required.
- Execution posture: `MAIN_THREAD_SERIAL`; no supporting implementation Worktree is required for one
  tenant consumer and one focused contract.
- Evidence status: `CLOSED_VERIFIED`; the raw server-text disclosure is removed within this consumer
  boundary and no API/server contract changed.
- Reopen condition: A later Discovery read failure again exposes server-controlled text, duplicates the
  bounded failure surface, or hides local filter validation behind catalogue-read state.

## Verified problem

The tenant Discovery page uses one `error` value for both local filter validation and the asynchronous
catalogue read. Its inline feedback branch renders `error.message` for any `Error` whose text does not
start with `Could not`, while `TenantApiError` preserves the server response message internally. The
same `TenantApiError` is also passed to `ListingResults`, which correctly maps the status to bounded
tenant copy. This allows one failed catalogue read to render both raw response text and the safe
mapped message.

This was reproduced against the current local Main source on 2026-09-02 in isolated
`agent-browser` session `rightspot-audit-070` without changing server state. The page-local fetch
harness made only the collection read return `503` with the controlled message
`CONTROLLED_PRIVATE_SERVER_TEXT`. After applying an area filter, the rendered `/tenant` page
contained that controlled text and also the bounded message `RightSpot could not reach the local
workflow service. Please try again.` The browser page-error log was empty and the fixture was not
mutated.

The defect is in the Discovery consumer's error ownership and presentation. It is not a listing API,
domain, persistence, role, or data-integrity defect. The existing `tenantApiErrorMessage` mapping is
the intended user-facing boundary; this consumer bypasses it for the duplicate inline branch.

## Classification and impact

`F-18` is a `VERIFIED_DEFECT` in the tenant Discovery UI error boundary.

- Trust impact: server-controlled diagnostic text can reach the user-facing page instead of remaining
  behind the bounded adapter message.
- Clarity impact: the same failed read is announced twice through two different error surfaces.
- Safety boundary: the reproduction used a harmless marker, but the consumer must not assume a future
  server error message is safe to disclose.
- Priority rationale: this does not block the ordinary happy path, but it weakens truthful,
  privacy-preserving failure handling at a primary tenant entry surface.

## Bounded objective

1. Keep local filter-validation messages visible when the tenant submits invalid filter input.
2. Ensure a `TenantApiError` from the catalogue read is represented only by the existing bounded
   `tenantApiErrorMessage` mapping.
3. Remove the duplicate raw-error inline surface for catalogue failures.
4. Preserve catalogue loading, successful results, empty results, retry, clear-filter behavior,
   Favourite controls, role/session boundaries, and the existing tenant API contract.
5. Add a focused TDD source/UI contract that fails against the current consumer and passes after the
   minimal repair.

## Accepted behavior and boundary

- A local validation failure is a tenant-owned, bounded copy and may be shown inline without issuing a
  new catalogue read.
- A catalogue read failure is an adapter-owned `TenantApiError`; the user sees the status-based copy
  from `tenantApiErrorMessage` and the existing `Retry catalogue` control.
- The page must not render `TenantApiError.message`, arbitrary response text, paths, identifiers, or
  duplicate read-failure copy.
- A later successful retry restores the catalogue result surface; no request, Favourite, session, or
  fixture mutation is implied by retrying a read.
- This task does not change the server error payload, status vocabulary, adapter error object, or any
  other tenant/Agent consumer.

## Non-goals and forbidden expansion

- No change to listing routes, server validation, domain/persistence logic, DTOs, status codes, or
  tenant API error construction.
- No generic error framework, toast system, polling, retry loop, cache, timeout, offline mode, or new
  dependency.
- No change to filter semantics, listing data, Favourite behavior, listing detail, Viewing Request
  workflow, auth/session, navigation, CSS system, media, Operations, WebMCP, Cloud Receiver, WebRTC,
  Redis, external authentication, deployment, or production-readiness claims.
- No broad audit of unrelated unknown-error paths, no speculative normalization outside Discovery,
  and no cleanup of unrelated dirty or untracked files.
- No generated output, browser tabs belonging to the user, server configuration, Git refs/commits,
  Worktree lifecycle, or outer `Web-Game` changes.

## Work Order

### RS-WO-040-01 — Separate Discovery validation and catalogue-read feedback

**Role:** Main-thread Builder and integration authority; focused TDD followed by bounded self-review
and browser verification  
**Status:** `CLOSED_VERIFIED`  
**Pre-dispatch status:** `MAIN_THREAD_ACTIVE`  
**Execution state:** `MAIN_THREAD_TDD_VERIFIED`  
**Owner:** Main RightSpot thread  
**Parallelization:** `SERIAL_TENANT_DISCOVERY_ERROR_BOUNDARY` — one consumer owns the complete
  presentation boundary; no concurrent writer may touch it during this repair.  
**Execution profile:** `Fast` — one tenant client component and one focused source/UI contract; no
  server or data work.
**Dispatch state:** `not dispatched` — Main-owned serial execution  
**Next gate:** None for this bounded Work Order; return control to the Main-thread cross-layer audit.  
**Parent execution posture if blocked:** `PROGRESSING`

### Required read set

- `src/ui/tenant/tenant-discovery-page.tsx`
- `src/ui/tenant/tenant-api.ts`
- `tests/ui/tenant-api.test.ts`
- `tests/ui/tenant-listing-read-failure.test.ts` — adjacent partial-read error ownership reference
- `Docs/07-business-flows-and-scenarios.md`
- `Docs/06-validation-and-evidence.md`
- `RUNBOOK.md`

### Main write set

- `src/ui/tenant/tenant-discovery-page.tsx` — local validation/read-error ownership and rendering only
- `tests/ui/tenant-discovery-error-boundary.test.ts` — focused Red→Green source/UI contract
- this Task File
- `Docs/Tasks/README.md`
- canonical current-status, flow, validation, audit, roadmap, and Runbook records during closure

### Forbidden set

- All files under `src/server/`, `src/shared/contracts/`, persistence, API route handlers, workflow
  fixtures, auth/session, and shared navigation
- `src/ui/tenant/tenant-api.ts`, Favourite components, listing detail, request editor, global CSS,
  dependencies, media, Operations, and deferred integrations
- Any change to the error status vocabulary, adapter error construction, filter semantics, listing
  projection, retry operation, or server payload
- User browser tabs, generated `.next/` output, Git refs/commits, Worktree lifecycle, and unrelated
  dirty/untracked files

### Generated/local-only set

`.next/`, disposable fixture database state, isolated `agent-browser` state, screenshots, and server
logs are evidence artifacts only and must not become authored source.

## TDD execution contract

### Red

Add a focused source/UI contract before changing the consumer. It must fail against the registered
source because the current page renders `error.message` from the shared `error` branch and therefore
does not distinguish a local validation message from a `TenantApiError` read failure. The contract must
require a dedicated local-validation presentation path and must assert that catalogue read errors are
delegated to the existing bounded `tenantApiErrorMessage` path without prescribing a new generic
error abstraction.

Recorded result: the focused contract failed against the pre-repair Main source with `1` failed and
`1` passed test. The failing assertion was the missing dedicated `filterError` state, confirming the
registered defect before the component was changed.

### Green

Make the smallest local repair that gives local filter validation its own explicit feedback value and
prevents `TenantApiError` from reaching raw inline rendering. Preserve the existing `ListingResults`
error/retry branch and successful catalogue behavior. Do not alter `tenant-api.ts` or add a fallback
that hides a failed read as an empty result.

Recorded result: after the minimal consumer repair, the focused contract passed with `2/2` tests;
`npm test` passed with `158/158`, `npm run test:foundation` passed with `6/6`, `npm run typecheck`
passed, and `npm run build` completed successfully. The changed component now owns local validation
copy through `filterError`; catalogue failures remain owned by `ListingResults` and its bounded
`tenantApiErrorMessage` mapping.

### Refactor

Only simplify the local state/render condition if the distinction between validation feedback and read
failure becomes clearer. Re-run the focused contract after any refactor; do not extract a general
error-handling framework.

## Verification and closure gate

- Focused TDD contract records the expected Red result and Green pass.
- Pinned `npm test`, `npm run test:foundation`, `npm run typecheck`, and `npm run build` pass.
- Repository validators, sensitive scan, docs validation, and `git diff --check` pass from the repo
  root.
- Fresh isolated browser evidence forces only `/api/listings` collection read failure and confirms
  the controlled marker is absent, exactly one bounded catalogue error/retry surface is present, and
  no request or fixture mutation occurs; restoring the read and retrying restores the catalogue.
- Browser checks include local invalid-filter feedback, successful filter recovery, keyboard access to
  retry/clear controls, the accepted `320px` width floor where affected, and no page errors.
- Exact-scope review confirms no API, server, domain, persistence, DTO, auth, Favourite, listing
  detail, CSS, dependency, generated, Git, Worktree, or unrelated collaborator path changed.
- Reconciled this Task File, Task index, Flow 2/18, validation evidence, audit, roadmap, Current
  Status, and Runbook before moving the Task to `closed`.

## Stop and reopen conditions

Stop before Green if the repair requires changing the adapter/server error contract, a shared
component, or an unrelated dirty path. Stop before closure if raw server text remains visible, local
validation feedback disappears, read failure is presented as an empty catalogue, retry mutates state,
or the exact-scope boundary is not provable. Reopen or register a new bounded Task if a later audit
finds the same disclosure/duplication in another consumer; do not widen this Task opportunistically.

## Registration and closure evidence — 2026-09-02

The Main-thread cross-layer audit reproduced `F-18` after the prior `F-17` closure. The isolated
session `rightspot-audit-070` used a page-local fetch harness only; it did not alter the fixture or
the user's browser. The exact candidate is one Discovery consumer branch and has one serial Work
Order. It was registered as Main-owned rather than externally dispatched; the bounded component
repair and focused TDD contract are now complete, followed by the browser verification and closure
writeback recorded below.

The isolated browser verification then completed the closure gate in session `rightspot-audit-071`.
No user browser tab was used. The page-local 503 harness exposed no
`CONTROLLED_PRIVATE_SERVER_TEXT`, exactly one `Listings could not be loaded` heading, one bounded
`RightSpot could not reach the local workflow service. Please try again.` message, one retry control,
and one alert. After removing the harness, keyboard `Enter` on `Retry catalogue` restored the two
matching results for the retained rent filter; keyboard `Enter` on `Clear` restored all three seeded
listings. Invalid local filter feedback remained visible without a catalogue request, and valid filter
recovery issued the expected read. At a `320px` viewport, document and body widths were both `320px`
with no horizontal overflow; the browser error log was empty. The disposable fixture remained
unchanged and `/api/health` remained healthy.

The Work Order is therefore `CLOSED_VERIFIED` within the tenant Discovery consumer boundary. No API,
server, DTO, domain, persistence, auth, navigation, CSS, dependency, Git, Worktree, or unrelated
collaborator path changed.

## Source identity and integration boundary

- Repository root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`
- RightSpot package root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot`
- Registration source: canonical Main Worktree, branch `main`, HEAD
  `4224f3ae53f6d4be87a7be17e74532f5785357b0`
- Runtime baseline: pinned Node.js `v24.20.0`; pinned npm `11.19.0`
- Worktree state: one canonical Main Worktree with pre-existing mixed dirty/untracked files. Preserve
  them; do not stage, commit, restore, or broadly reformat them under this Work Order.
