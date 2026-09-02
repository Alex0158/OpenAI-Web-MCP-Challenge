# RIGHTSPOT-039 — Keep listing-detail partial read failures truthful

## Task Control

- Type: `defect`
- Lifecycle: `closed`
- Priority: `P2`
- Owner: Main RightSpot thread
- Current increment: Closed after repairing the listing-detail consumer so its listing facts and tenant Viewing Request context have separate truthful read and recovery boundaries.
- Next gate: None for this bounded outcome; return to the Main-thread cross-layer audit.
- Execution posture: `MAIN_THREAD_SERIAL`; no supporting implementation Worktree was required.
- Evidence status: `CLOSED_VERIFIED`; TDD, full checks, and fresh isolated browser failure/recovery evidence passed on 2026-09-02.
- Reopen condition: A later listing-detail read failure again hides an authoritative successful read, renders request-derived content without request data, or presents the wrong recovery operation.
- Dependencies: Current RightSpot listing-detail and tenant-request contracts; no external dependency.

## Verified problem

The listing-detail page currently reads the listing facts and the tenant's current Viewing Request
context through one `Promise.all` settlement. Any rejection is stored in one generic `error` state,
then rendered as `Listing details are unavailable` with `Retry listing`, even when the listing read
succeeded and only the request-context read failed.

This was reproduced against the current local server on 2026-09-02 in isolated
`agent-browser` session `rightspot-audit-065` without changing server state. A page-local fetch harness
rejected only `GET /api/tenant/request` while `GET /api/listings/listing-north` returned `200` with
`listingId: listing-north` and title `Northfield Garden Flat`. The rendered page nevertheless contained
the alert text `Listing details are unavailable`, `Retry listing`, and no rendered listing title. The
harness recorded two request-context failures; the successful listing response was independently
read back as `200` for the same listing identity.

The defect is in the UI consumer's error ownership and recovery semantics. It is not an API, domain,
workflow, persistence, role, or data-integrity failure.

## Bounded objective

Make the listing-detail page represent the two independent reads truthfully:

1. A successful listing read remains visible when only the tenant request-context read fails.
2. A request-context failure is labelled as request-context unavailable and offers a request-context
   retry, without rendering an editor, status notice, or action based on missing request data.
3. A listing-read failure remains a listing-detail unavailable state with a listing retry; it must not
   be relabelled as a request failure or fabricate listing facts.
4. A later successful retry restores the corresponding bounded surface without requiring an unrelated
   mutation or retry loop.
5. Initial loading, successful full reads, existing request-state notices/editor behavior, Favourite
   behavior, role/session boundaries, API contracts, and cross-listing logic remain unchanged.

## Acceptance criteria

- [x] The listing and tenant-request reads have distinguishable loading/error ownership in the listing-detail consumer.
- [x] Listing success plus request-context failure renders the authoritative listing identity/facts and a visible bounded request-context unavailable/retry state.
- [x] The partial-failure state does not render `TenantRequestEditor`, an existing-request status notice, or any request action from absent request data.
- [x] Listing failure does not render stale or fabricated listing facts and exposes a listing-specific recovery control.
- [x] Successful request-context retry restores the existing editor/status behavior without changing server contracts.
- [x] Focused TDD covers the partial-failure truthfulness and recovery boundary; the existing full suite, typecheck, build, and runtime checks remain green.
- [x] Fresh isolated browser evidence verifies the partial failure, the independent retry, the restored surface, `320px` width/focus where affected, and no page errors.
- [x] No new fallback, polling, arbitrary retry, cache, dependency, route, server, or workflow state is introduced.

## Classification and impact

`F-17` is a `VERIFIED_DEFECT` in the tenant listing-detail UI error boundary.

- Impact: a tenant can be told that a valid home is unavailable because a separate request read failed.
- Truthfulness boundary: the page must not collapse two authoritative reads into one misleading error.
- Recovery boundary: retry wording and operation must identify the failed read.
- Priority rationale: this does not block the normal happy path, but it directly undermines error-state comprehension and can hide a valid rental resource.

## Work Order

### RS-WO-039-01 — Separate listing-detail read ownership and recovery

**Role:** Main-thread Builder and integration authority; focused TDD followed by independent self-review and browser verification  
**Status:** `CLOSED_VERIFIED`  
**Execution state:** `MAIN_THREAD_TDD_VERIFIED`  
**Owner:** Main RightSpot thread  
**Parallelization:** `SERIAL_LISTING_DETAIL_READ_BOUNDARY` — one page owns both read consumers and must not be edited by another writer during this repair.  
**Execution profile:** `Standard` — one tenant client component, one focused UI contract, and bounded documentation writeback; no API or dependency work.  
**Dispatch state:** `not dispatched` — Main-owned serial execution  
**Next gate:** None for this bounded Work Order; return control to the Main-thread cross-layer audit.  
**Parent execution posture if blocked:** `PROGRESSING`  
**Blocker report:** If the current dirty Main source, browser harness, or read contract prevents a truthful bounded repair, stop the affected lane, preserve the evidence, and report the exact boundary; the audit Goal continues on unrelated safe checks.

## Objective

Change only the listing-detail consumer so independent listing and tenant request-context reads expose
their own success, loading, failure, and recovery states. Preserve the existing listing-detail content
and request workflow when both reads succeed.

## Baseline

- Git root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`
- Branch and HEAD: `main` / `4224f3ae53f6d4be87a7be17e74532f5785357b0`
- Execution source identity and dirty/untracked limitation: canonical Main Worktree; it contains pre-existing collaborator/product/document changes and untracked RightSpot artifacts. Do not reset, revert, stage, or commit unrelated paths.
- Governance revision: current `/Users/alex/OpenAI-WebMCP/AGENTS.md`, repository `AGENTS.md`, RightSpot `AGENTS.md`, `RUNBOOK.md`, and the Thread Orchestration Pilot Runbook.
- Runtime baseline: pinned Node `/Users/alex/.local/share/rightspot/node-v24.20.0-darwin-arm64/bin/node` `v24.20.0`; pinned npm `/Users/alex/.local/share/rightspot/node-v24.20.0-darwin-arm64/bin/npm` `11.19.0`.
- Execution mode/worktree: shared canonical Main Worktree; no supporting Worktree.
- Supporting-task identity: Main thread; no separate persistent worker is activated for this serial repair.

## Read before action

- Global, workspace, repository, and RightSpot instruction files named in the governance revision.
- `RUNBOOK.md` and `Docs/Development/RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-RUNBOOK.md`.
- `Docs/00-current-status.md`, `Docs/06-validation-and-evidence.md`, and `Docs/07-business-flows-and-scenarios.md`.
- `Docs/Development/RIGHTSPOT-CROSS-LAYER-AUDIT-2026-09-02.md` and `Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md`.
- `Docs/Tasks/RIGHTSPOT-030-fix-tenant-request-read-concurrency.md`, `RIGHTSPOT-031-preserve-tenant-conflict-recovery-feedback.md`, and this Task File.
- `src/ui/tenant/tenant-listing-page.tsx`, `src/ui/tenant/tenant-api.ts`, `src/ui/tenant/tenant-request-page.tsx`, `src/ui/tenant/tenant-favourites-page.tsx`, and their focused tests.

## Mutable scope

- Read set: the listing-detail consumer, tenant API types/error mapper, request editor/status components, relevant tests, and linked canonical evidence.
- Worker write set: `src/ui/tenant/tenant-listing-page.tsx` and one focused test file `tests/ui/tenant-listing-read-failure.test.ts`.
- Main-thread orchestration writeback set: this Task File, `Docs/Tasks/README.md`, current status, validation/evidence, business-flow, audit, roadmap, and Runbook records as required by closure.
- Auxiliary process-only set: isolated browser session state, disposable fixture generation, server logs, and evidence files under the documented ignored/local-only paths.
- Forbidden set: all `src/server/**`, `src/shared/contracts/**`, API routes, persistence, workflow fixtures, auth/session, shared navigation, Favourite/domain behavior, dependencies, media, Operations, WebMCP, Cloud Receiver, WebRTC, Redis, external authentication, deployment, Git refs, commits, Worktree lifecycle, and unrelated dirty/untracked files.
- Generated set: `.next/`, disposable database state, isolated browser state, screenshots, and logs; none may become authored source.

## Dependencies and assumptions

- The existing listing and tenant request HTTP/DTO contracts already distinguish their own response/error semantics.
- The page may preserve listing facts when request context is unavailable, but must withhold all request-derived editor/status/action content until a successful request read is available.
- A failed request-context retry must remain visible as failure; no automatic retry or guessed empty request is allowed.
- If implementing separate retry loading would require changing a shared contract or route, stop and return `BLOCKED` rather than expanding this Work Order.

## Non-goals and forbidden expansion

- Do not alter API routes, DTOs, domain state, persistence, fixture data, workflow transitions, optimistic concurrency, or role/privacy enforcement.
- Do not resolve the separate F-08 dynamic-route read-order evidence gap, add a generic async abstraction, or introduce polling/cache/timeout/offline behavior.
- Do not change listing-detail request business rules, cross-listing notices, Favourite actions, navigation, visual-system tokens, or deferred Information Request/auth/WebMCP/Cloud Receiver scope.
- Do not clear valid listing data merely to make an unrelated request error disappear, and do not show an empty request as a fallback for a failed request read.

## TDD execution contract

### Red

Add a focused source/UI contract against the registered baseline. It must fail because the current
component has one shared `error` state, one generic listing-unavailable message, one `Retry listing`
operation, and does not render a successful listing independently from a failed request-context read.
The contract must assert the user-visible ownership/recovery boundary without prescribing an unrelated
state abstraction.

### Green

Make the smallest local repair that gives listing and request context distinct read/error/loading
surfaces, preserves the successful two-read path, withholds request-derived content while request data
is unavailable, and provides a truthful bounded retry for the failed read. Keep the existing API,
workflow, role, privacy, and cross-listing contracts unchanged.

### Refactor

Only after Green, simplify local component structure if it improves clarity without changing the
accepted states, retry semantics, or scope. Re-run focused tests after any refactor.

## Verification

- Focused: pinned `npm test -- tests/ui/tenant-listing-read-failure.test.ts` or the repository-supported equivalent; record the exact result.
- Full: pinned `npm test`; pinned `npm run test:foundation`; pinned `npm run typecheck`; pinned `npm run build`.
- Repository: `python3 scripts/test_validators.py`, `python3 scripts/test_sensitive_scan.py`, `python3 scripts/validate_repository.py --root .`, `python3 scripts/validate_docs.py`, and `git diff --check` from the repository root.
- Runtime: `curl -fsS http://127.0.0.1:3100/api/health`; confirm the served route uses the current Main source.
- Browser: fresh isolated session; normal listing detail; page-local failure of only `/api/tenant/request`; verify listing identity remains visible, request editor/status content is withheld, request-specific retry is visible; restore read and retry; verify the normal surface returns; inspect `320px` body/document widths, first-Tab reachability, and page errors.
- Scope: inspect exact changed paths and confirm no forbidden or unrelated path changed.

## Failure and stop conditions

- Stop if the listing read itself fails in the partial-failure reproduction; that is a different branch and must be recorded separately.
- Stop if a retry mutates the fixture, sends a workflow command, changes role/session state, or requires a server fallback.
- Stop if the browser command reports success without a URL/DOM postcondition; reacquire the page and verify the postcondition.
- Stop if the implementation needs a shared contract, dependency, route, or unrelated component change; re-gate before proceeding.

## Completion report

The Main thread records changed files, TDD Red/Green results, exact runtime/commands/results, browser
postconditions, skipped checks and reasons, residual risks, final Work Order/Task state, and the next
audit route in this Task File and linked canonical records.

## Writeback

- worker report channel: Main-thread execution record; no separate supporting worker.
- canonical Task File writeback owner: Main RightSpot thread.
- allowed evidence-record changes: this Task File, `Docs/Tasks/README.md`, and the explicitly linked current-status, validation, business-flow, audit, roadmap, and Runbook records only.

## Reopen condition

Reopen or register a new bounded Task if a later audit reproduces a different listing-detail race,
request-state defect, route-entry defect, or shared contract problem. Do not widen this Task after
closure to cover an unverified dynamic-route race or unrelated read consumer.

## Closure evidence — 2026-09-02

- The focused contract was intentionally Red against the registered source: the appended contract
  produced `3` failures because the consumer used one generic `error` state and one `Promise.all`
  boundary. After the local repair, the focused contract passed `3/3`.
- The pinned complete RightSpot suite passed `156/156`; `npm run test:foundation` passed `6/6`; pinned
  `npm run typecheck` and `npm run build` passed. Repository validators passed: `test_validators.py`
  `6/6`, `test_sensitive_scan.py` `3/3`, `validate_repository.py`, `validate_docs.py`, and
  `git diff --check`.
- In fresh isolated browser session `rightspot-audit-066`, a page-local harness rejected only
  `GET /api/tenant/request` while `/tenant/listings/listing-north` returned and rendered the
  authoritative `Northfield Garden Flat`. The page showed `Viewing Request context is unavailable`
  and `Retry request context`, preserved listing facts, omitted the request editor/status/action
  surface, and did not show `Listing details are unavailable`. After restoring fetch, the actual
  retry control restored `Choose times the agent can act on` and `Submit Viewing Request`.
- The complementary listing-only harness rejected only `GET /api/listings/listing-north`; the page
  showed listing-specific `Listing details are unavailable`, rendered no listing title, and did not
  expose request editor or request-context error content. Both harnesses recorded two controlled
  failed reads and performed no fixture mutation.
- At `320px`, body and document widths were both `320px`; after resetting focus, the first Tab reached
  `Skip to main content`. `agent-browser errors` was empty for the exercised pages. The isolated
  browser session was closed and `/api/health` remained `{"ok":true,"service":"rightspot"}`.
- Exact-scope review found product changes only in `src/ui/tenant/tenant-listing-page.tsx` and the
  focused test `tests/ui/tenant-listing-read-failure.test.ts`; the remaining changed paths are the
  explicitly authorized canonical documentation records. No API, DTO, domain, persistence, workflow,
  role/privacy, dependency, CSS, generated source, Git ref, commit, or Worktree lifecycle changed.

`F-17`, `RIGHTSPOT-039`, and `RS-WO-039-01` are therefore `CLOSED_VERIFIED` within the tenant
listing-detail partial-read error boundary. This closure does not close or alter the separate `F-08`
dynamic-route evidence gap and does not claim external authentication, deployment, WebMCP, Cloud
Receiver, WebRTC, Redis, or production readiness.
