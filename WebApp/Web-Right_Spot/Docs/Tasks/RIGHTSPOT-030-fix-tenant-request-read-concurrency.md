# RIGHTSPOT-030: Prevent stale tenant request reads from overwriting newer state

**Type:** `defect`  
**Lifecycle:** `closed`  
**Priority:** `P1` for tenant state fidelity  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-02  
**Depends on:** Confirmed `F-08` dashboard reproduction, the tenant request projection, and the
authoritative request-state contract in [`07-business-flows-and-scenarios.md`](../07-business-flows-and-scenarios.md)

## Task Control

- Type: `defect`
- Lifecycle: `closed`
- Priority: `P1` — a tenant can be shown an older request projection after a newer read has
  completed, immediately adjacent to a workflow decision surface.
- Owner: Main RightSpot thread
- Current increment: Completed latest-read sequencing, authoritative-result invalidation, and the
  Refresh/mutation overlap boundary without changing the workflow API or state machine.
- Execution posture: `CLOSED_VERIFIED`
- Evidence status: `CLOSED_VERIFIED` — both deterministic isolated browser reproductions were rerun
  after Green and the newer result remained rendered; static, focused, full-suite, build, runtime,
  and independent source-review evidence agree.
- Next gate: Return to a fresh Main-thread cross-layer audit. The analogous listing-detail concern
  remains a separate `EVIDENCE_GAP` and is not reopened by this Task.
- Dependencies: None beyond the current source and the evidence recorded below.

## Verified problem

The `/tenant/requests` page currently applies every `readTenantRequest()` result, error, and
`finally` update without identifying which read is the latest. Its Refresh button also remains
enabled while a confirm/decline or draft-editor mutation is pending. The editor's `onSaved` callback
accepts server data directly, without invalidating a parent read that may already be in flight.
Consequently, two reads can overlap, or a slower earlier read can replace a newer mutation result in
the rendered tenant projection.

This is a user-visible stale-state defect, not an authoritative workflow-state corruption. The
server response remains the source of truth; the defect is that the page can present an older
projection after a newer read has already completed.

### Controlled reproduction — 2026-09-02

An isolated `agent-browser` session loaded the real `/tenant/requests` route against the local
RightSpot server. The page-local harness intercepted only `GET /api/tenant/request`, delayed the
first response by 1500 ms, and returned a newer draft payload for the second response. Two Refresh
actions were issued 100 ms apart. The observed event order was:

```text
start-1 → start-2 → return-2 → return-1
```

The DOM ended in the older empty state (`Start with one promising home`) even though the newer
response contained a tenant draft. The harness was isolated from the user-owned browser tab and is
not a product fallback or a replacement for production/runtime evidence. The shared demo fixture
was reset immediately afterward and is currently empty at fixture generation 6.

### Adjacent mutation/read reproduction — 2026-09-02

With a real tenant draft fixture, an isolated browser harness captured the pre-save projection,
started the draft Save action, and immediately activated the still-enabled dashboard Refresh. The
observed event order was:

```text
mutation-start → read-start → mutation-return → read-return
```

The save response first presented the updated server result, but the delayed parent read then
replaced it with the captured older draft (`Original draft`). This confirms that the same tenant
request page has a second stale-write path through the editor's direct `onSaved` update. The shared
fixture was reset after the reproduction.

## Bounded objective

1. Make each tenant request read identify its sequence, and allow only the latest read to update
   `data`, `error`, `statusMessage`, and loading completion state.
2. Invalidate any in-flight read when a server-authoritative mutation or conflict refetch result is
   accepted through the page or editor, and ensure the accepted result owns the loading state.
3. Disable the dashboard Refresh action while a read, draft save/submit, or confirm/decline
   response is pending, so the explicit user action cannot knowingly overlap a mutation path.
4. Preserve the existing server-authoritative response handling, conflict refresh message, state
   presentation, request editor behavior, and role boundary.
5. Add focused source-contract regressions that fail before the complete repair and pass only when
   the latest-read, mutation invalidation, and Refresh guards are present.
6. Re-run both deterministic browser reproductions after Green and show that the newer response
   remains rendered.

## Accepted behavior and state ownership

- The server remains authoritative for request state, version, fixture generation, timeline, and
  tenant-visible listing data.
- A read that is no longer latest must not mutate the page's data, error, status message, or
  loading-finally state.
- A server-authoritative result accepted from confirm, decline, draft save, draft submit, or a
  conflict refetch supersedes any earlier read and invalidates that read's later settlements.
- A confirm or decline remains a server mutation guarded by its existing request version and
  command id. This Task does not change its API or state transition rules.
- Refresh and Retry use the same guarded read path. Refresh is unavailable while either a read or
  draft/decision mutation is in flight; the existing response and editor controls remain
  unavailable while their respective mutations are pending.
- A 409 conflict continues to trigger the existing authoritative reload message. It must not allow
  a stale read to overwrite the conflict result.
- The page may still show the existing loading, empty, unavailable, success, and terminal states;
  this Task changes only which response is allowed to own them.

## Work Order

### RS-WO-030-01 — Guard tenant request reads

**Role:** Main-thread Builder → frozen-source browser verification → documentation reconciliation  
**Status:** `INTEGRATED`  
**Execution state:** `CLOSED_VERIFIED`  
**Owner:** Main RightSpot thread  
**Parallelization:** `SERIAL_TENANT_REQUEST_PAGE` — the page component and its focused contract test
form one small behavior boundary; no other worker may edit the declared source paths during this
Work Order.  
**Execution profile:** `Standard` — one page component, one focused test, and current-document
writeback; no dependency or framework change.

## Source identity and path scope

- Repository root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`
- RightSpot package root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot`
- Branch: `main`
- Code baseline: `16836a6b5009faad5577aa00a7d8e67cb552970c`
- Physical Worktrees: canonical Main only
- Runtime baseline: pinned Node.js `v24.20.0`, npm `11.19.0`
- Historical reproduction fixture: reset generation 6, no active request; post-closure reset reached
  generation 15 with no active request

### Required read set

- `src/ui/tenant/tenant-request-page.tsx`
- `src/ui/tenant/tenant-api.ts`
- `src/ui/discovery/discovery-page.tsx` (existing latest-read guard pattern)
- `src/ui/tenant/tenant-favourites-page.tsx` (existing latest-read guard pattern)
- `src/shared/contracts/workflow-api.ts`
- `tests/ui/tenant-terminal-response-presentation.test.ts`
- `Docs/07-business-flows-and-scenarios.md`
- `Docs/06-validation-and-evidence.md`
- `RUNBOOK.md`

### Main write set

- `src/ui/tenant/tenant-request-page.tsx`
- `tests/ui/tenant-request-read-concurrency.test.ts`
- `Docs/Tasks/RIGHTSPOT-030-fix-tenant-request-read-concurrency.md`
- `Docs/Tasks/README.md`
- `Docs/00-current-status.md`
- `Docs/06-validation-and-evidence.md`
- `Docs/Development/RIGHTSPOT-CROSS-LAYER-AUDIT-2026-09-02.md`
- `Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md`

### Forbidden set

- All server route handlers, domain/state-transition code, persistence, database fixtures, DTOs,
  authentication/session behavior, and API transport contracts
- `src/ui/tenant/tenant-listing-page.tsx` — its dynamic-route read concern remains a separate
  un-reproduced evidence gap and is intentionally not pulled into this Task
- Listing cards/detail, agent surfaces, navigation, shared CSS, external authentication, WebMCP,
  Cloud Receiver, WebRTC, Redis, deployment, and outer `Web-Game` files
- Dependencies, lockfiles, generated output, browser state, Git metadata, and Worktree lifecycle

### Generated/local-only set

`.next/`, test output, local server logs, isolated browser session state, and disposable fixture
database state are evidence artifacts only. They must not become tracked product source.

## TDD execution contract and recorded execution

### Red

The focused source-contract test was added against the incomplete candidate and captured the expected
Red failures: first the missing latest-read/Refresh boundary (2 failing assertions), then the expanded
mutation-invalidation/pending-signal boundary (2 failing assertions), and finally the direct
`setData` bypass found by independent review (1 failing assertion). Both browser reproductions were
preserved as behavioral evidence; the source test is a fast regression gate, not a substitute for
browser verification.

### Green

Use a monotonic `useRef` read id. Increment it when `load()` starts, and gate the `then`, `catch`,
and `finally` updates against the current id. Route all authoritative page/editor data acceptance
through one parent-owned function that invalidates the current read id and clears loading state.
Lift the editor's pending mutation signal only far enough to set the Refresh disabled condition to
`isLoading || pendingDraftMutation || pendingResponse !== null`. Do not introduce cancellation,
retries, guessed data, swallowed errors, or unrelated UI changes.

### Refactor

Only simplify the guarded read implementation or its focused test after Green. Do not change the
accepted state machine, API calls, response copy, editor behavior, or scope.

## Closure record — 2026-09-02

- **Green:** `applyServerData` is the single parent-owned server-data writer. It invalidates the
  current read sequence before accepting mutation/refetch data; `load()` guards `then`, `catch`, and
  `finally` against stale read ids. The editor exposes an optional pending signal, preserving the
  unchanged listing-detail consumer, and Refresh is disabled while a read, draft save/submit, or
  confirm/decline is pending.
- **Focused TDD:** `tests/ui/tenant-request-read-concurrency.test.ts` passes `3/3` after the recorded
  Red checkpoints.
- **Regression/static:** pinned `npm test` passes `136/136` across `29` authored test files;
  `npm run test:foundation` passes `6/6`; `npm run typecheck`, `npm run build`, and `git diff --check`
  pass.
- **Browser:** an isolated session reran the delayed-read sequence
  `start-1 → start-2 → return-2 → return-1`; the newer `Newer race home` remained visible and the
  stale empty state did not return. It also reran the forced adjacent sequence
  `mutation-start → read-start → mutation-return → read-return`; `Updated draft` remained visible,
  `Original draft` did not return, and the page showed no unavailable/error state.
- **Runtime/reset:** `/api/health` returned `{"ok":true,"service":"rightspot"}`. The disposable
  fixture was reset to generation `15`; a fresh authenticated tenant request page showed the truthful
  empty state (`Start with one promising home`). The temporary browser sessions were closed.
- **Independent review:** the read-only source/static verifier returned `VERIFIED`, confirming the
  single data-writer boundary, latest-read guards, optional editor callback, and Refresh predicate.
  Its explicit claim limit excluded full-suite, build, and browser execution; those claims are covered
  by the Main evidence above.
- **Scope:** only `tenant-request-page.tsx`, its focused regression, and the declared documentation
  paths changed. No API, domain, persistence, listing-detail, authentication, dependency, or
  deferred-integration behavior changed. The analogous `tenant-listing-page.tsx` concern remains an
  `EVIDENCE_GAP`.

## Acceptance and verification matrix

| Area | Required evidence | Pass condition |
|---|---|---|
| Red | Focused test against code baseline | Fails for the missing guard, with failure recorded before source repair |
| Green | Focused test | Passes after the guard and Refresh predicate are implemented |
| Runtime behavior | Same isolated delayed-response browser harness | Newer response remains rendered after `return-2 → return-1`; stale response cannot overwrite it |
| Mutation/read behavior | Draft save plus delayed Refresh harness | Accepted mutation result remains rendered; stale parent read cannot overwrite it |
| Mutation boundary | Tenant draft and confirm/decline path review and focused/full tests | No API, version, command-id, or state-transition change; Refresh is disabled during every mutation |
| Negative path | Delayed stale error and stale `finally` review/test | A stale error cannot replace current data and a stale completion cannot clear current loading state |
| Regression | Pinned `npm test` | Complete authored suite passes with the updated count explained |
| Static quality | Pinned `npm run typecheck`, `npm run build`, `git diff --check` | All pass; exact scope contains no forbidden path |
| Fresh local evidence | `/api/health`, reset, tenant request page | Health is truthful and the reset empty state remains usable |
| Documentation | Task, audit, validation, status, roadmap | All classify the dashboard defect as Task 030 and retain listing-detail as a separate evidence gap |

## Stop conditions and non-goals

Stop and report to Main if the source changes outside the declared write set, if a shared contract
must change, if either delayed-response result differs from the stated reproduction, or if a test
can pass without proving the latest-read and mutation-invalidation boundaries. Do not broaden the
Task merely because a related component has a similar static pattern.

This Task does not:

- repair the un-reproduced `tenant-listing-page.tsx` dynamic-route read concern;
- redesign the request workflow, persistence, conflict protocol, or error taxonomy;
- add an async data library, cancellation framework, arbitrary retry, or optimistic UI;
- claim production concurrency guarantees, external auth, deployment, WebMCP, Cloud Receiver,
  WebRTC, or Redis readiness.

## Closure and reopen conditions

Close only after the Red failure is captured, the minimal Green repair passes focused/full tests,
typecheck, build, and exact-scope review, the controlled browser race no longer ends in stale state,
and current canonical documents agree. Reopen if a later read can still be overwritten by an older
read, a stale error/loading completion can corrupt current presentation, or a future change removes
the explicit mutation/Refresh overlap boundary. Keep the listing-detail evidence gap separate until
it has its own controlled reproduction and accepted Task decision.
