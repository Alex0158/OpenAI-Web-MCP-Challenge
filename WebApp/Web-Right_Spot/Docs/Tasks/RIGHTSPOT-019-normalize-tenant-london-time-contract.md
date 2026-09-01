# RIGHTSPOT-019: Normalize the tenant Europe/London time contract

**Type:** `defect`  
**Lifecycle:** `in_progress`  
**Priority:** `P1` for correct Viewing Request scheduling semantics  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-01  
**Depends on:** closed `RIGHTSPOT-002` tenant request flow; ADR-RS-0001 and the existing Europe/London display contract; read-only finding from `RIGHTSPOT-012`

## Task Control

- Objective: ensure a tenant's `datetime-local` input is interpreted and displayed as an explicit
  `Europe/London` wall-clock value regardless of the browser's local timezone, while keeping the
  existing server/API UTC instant contract.
- Current increment: `RS-WO-019-01` is the bounded tenant request time conversion repair. It does not
  add calendar integration, a timezone selector, or a new backend time model.
- Next gate: independent verification under multiple host timezone settings, then main-thread
  integration and tenant/browser regression evidence.
- Execution posture: `READY_FOR_BUILDER_DISPATCH`.
- This task is disjoint from workflow-domain, Operations, and media write sets.

## Verified defect

The tenant editor tells users to use `Europe/London` times, but it currently calls `new Date(time)`
on the timezone-less `datetime-local` value. Browsers interpret that value in the host machine's
local timezone before converting it to ISO. The read-only display formatter separately forces
`Europe/London`, so a non-UK browser can submit a different instant from the wall-clock time the
tenant entered.

The intended MVP contract is explicit: the demo's viewing times are London times. The server may
continue storing UTC ISO instants; only the UI boundary needs to convert the London wall-clock input
deterministically before sending the existing DTO.

## RS-WO-019-01 — Repair tenant London-time input conversion

**Role:** Builder → independent Verifier  
**Status:** `READY_FOR_VERIFICATION`  
**Parallelization:** `PARALLEL_TENANT_TIME_REPAIR` — disjoint from workflow-domain, Operations, and media paths  
**Risk profile:** `Assured` — incorrect time conversion changes user-visible scheduling instants  
**Source baseline:** `e92dc9c1102549e9197ebad114803eea1e96c06f` on `main`; current media candidate files and collaborator-owned documentation remain outside this Work Order  
**Supporting worker:** Multi-agent tenant-time Builder `01a05e22-1007-7f62-b983-e0d5973f00f3` (`Lagrange`), closed after handoff  
**Candidate source:** `2c408e77e99a2f38faffe27ffa8c7408fe1dc855`, parent `e92dc9c1102549e9197ebad114803eea1e96c06f`  
**Source Worktree:** `/Users/alex/OpenAI-WebMCP/.rightspot-rs-019-01-builder`  
**Dispatch state:** `HANDOFF_COMPLETE`  
**Next gate:** Independent verification of the frozen candidate; do not integrate or dispatch follow-on work  
**Allowed write set:** `src/ui/tenant/tenant-request-time.ts`, `src/ui/tenant/tenant-request-page.tsx`, `tests/ui/tenant-request-time.test.ts`  
**Ownership:** The Builder owns only the declared tenant time helper/page/test paths. The main thread
owns source freeze, integration, browser evidence, canonical writeback, and closure.

### Required read set

- Repository/global instructions, RightSpot `RUNBOOK.md`, current status, requirements, domain/data
  model, API contract, ADR-RS-0001, this Task File, and the current tenant request page/API helper.
- Existing workflow and tenant API tests, especially the UTC `preferredTimes` DTO boundary and
  Europe/London display wording.

### Required behavior

1. Keep the existing server/API contract as UTC ISO instants. Do not add a timezone field to public
   DTOs or change persistence/domain behavior.
2. Convert a valid `YYYY-MM-DDTHH:mm` `datetime-local` wall-clock value as `Europe/London`, not as
   the browser's local timezone. The result must be a canonical ISO instant suitable for the current
   API. Stored ISO values must round-trip back to the London wall-clock value in the editor.
3. Correctly cover both GMT and BST dates. Invalid or non-existent London wall times at a DST
   transition must fail visibly rather than silently shift; if the implementation encounters an
   ambiguous transition time, use one documented deterministic policy and test it. Do not add a
   timezone picker or calendar library for this MVP.
4. Preserve one-to-three inputs, strict chronological ordering after conversion, draft/save/submit
   separation, conflict refresh, bounded errors, and the existing London display wording.
5. Remove the raw `new Date(time)` interpretation of the timezone-less input. Use a small local
   helper based on platform `Intl`/standard APIs or another already-installed mechanism; no new
   dependency.

### Tests and verification preparation

Add pure helper tests proving winter and summer London conversion, round-trip display, invalid input,
and behavior under at least `TZ=UTC` and `TZ=America/New_York` (or equivalent explicit runtime
  environments). Add a test for the DST-boundary policy. Run the relevant UI/API tests, full direct
  tests, typecheck, build, and diff checks with pinned Node `24.20.0` / npm `11.19.0` where available.
  Browser rendering and actual form submission remain independent verifier evidence, not Builder
  claims.

### Forbidden actions and stop conditions

- Do not modify shared contracts, server/API/domain/persistence, global CSS, routes, auth, Operations,
  media, package/config, canonical docs, Git metadata, or generated output.
- Do not introduce a timezone selector, calendar integration, external service, date library, browser
  locale preference, silent local-time fallback, or a broad scheduling redesign.
- Do not commit, integrate, dispatch follow-on work, or claim browser/independent verification.
- Stop and return `NEEDS_REVIEW` if the API requires an explicit timezone field or if the runtime
  cannot implement the accepted London boundary without a new dependency.

### Builder return gate

Return `READY_FOR_VERIFICATION` with exact candidate identity, changed paths, conversion policy,
focused tests under multiple TZ settings, full checks, runtime identity, and explicit skipped browser
evidence. Return `NEEDS_REVIEW` for any contract or dependency expansion.

### Builder handoff evidence — 2026-09-01

Builder `Lagrange` returned `READY_FOR_VERIFICATION` at candidate
`2c408e77e99a2f38faffe27ffa8c7408fe1dc855`, parent
`e92dc9c1102549e9197ebad114803eea1e96c06f`. Its isolated checkout was clean and changed exactly:

- `src/ui/tenant/tenant-request-time.ts`
- `src/ui/tenant/tenant-request-page.tsx`
- `tests/ui/tenant-request-time.test.ts`

The Builder reports explicit Europe/London wall-clock conversion, GMT/BST handling, rejection of
spring-forward nonexistent and autumn fall-back ambiguous values, UTC round-trip editing, and no
API/domain/DTO change. Pinned self-checks passed: focused/relevant `16/16`, full direct tests
`68/68`, typecheck, production build, and `git diff --check`. No independent verification or
integration claim is made.

## Acceptance criteria

1. The same London wall-clock input produces the same UTC ISO value on UTC, London, and non-UK browser
   timezone settings.
2. Existing stored UTC values display and edit as their correct `Europe/London` wall-clock values.
3. Ordering, draft persistence, submission, conflict handling, and API DTO shape remain unchanged.
4. DST edge behavior is deterministic and visible; no silent one-hour shift is introduced.
5. Independent verification confirms the exact candidate and no cross-layer scope expansion.

## Non-goals

- No user timezone preference, multi-region scheduling, calendar sync, reminders, notifications,
  external authentication, WebMCP, Cloud Receiver, WebRTC, Redis, or deployment.
- No redesign of the tenant request UI beyond the minimum truthful time-contract repair.

## Closure gate

Close only after independent verification, main-thread integration, and a bounded browser/form
regression against the integrated source. Preserve any unrelated persistent-fixture failure as
separate evidence.

## Reopen condition

Reopen if the product needs users outside the London-time demo contract, recurring events, calendar
availability, locale-specific time selection, or server-side timezone authority. Those require a new
product/API decision.
