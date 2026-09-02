# RIGHTSPOT-041 — Preserve tenant request mutation success feedback

**Type:** `defect`  
**Lifecycle:** `closed`  
**Priority:** `P2` for tenant workflow clarity and action feedback  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-02  
**Depends on:** `RS-FLOW-03`, `RS-FLOW-04`, the tenant request editor, and the existing server-authoritative response contract

## Task Control

- Type: `defect`
- Lifecycle: `closed`
- Priority: `P2` — the server mutation succeeds and the authoritative state is rendered, but the
  tenant is not told that the requested save or submission completed.
- Owner: Main RightSpot thread
- Current increment: Parent-owned feedback repair implemented and independently closed through focused
  TDD, full static checks, and isolated browser evidence.
- Next gate: Continue the Main-thread cross-layer audit; reopen only if a covered success or failure
  boundary regresses.
- Dependencies: No API, domain, persistence, auth, navigation, or external-service change is expected.
- Execution posture: `MAIN_THREAD_SERIAL` — the editor is a shared tenant mutation surface consumed by
  both the request dashboard and listing detail; no concurrent writer may touch these paths during repair.
- Evidence status: `CLOSED_VERIFIED`
- Reopen condition: After closure, a successful tenant draft save or explicit request submission can
  again leave no durable user-readable completion feedback, or a success message describes an action
  that did not receive a successful server response.

## Verified problem

`TenantRequestEditor` calls its parent `onSaved(response)` before setting its local success message.
Both current consumers key the editor by the server request version so an authoritative response
rehydrates the editor after a successful mutation. The parent update changes that key and unmounts the
old editor before the following local `setStatusMessage(...)` can remain visible. As a result, the
server returns `200`, the request version advances, and the page renders the new authoritative state,
but the expected `Draft saved from the server response...` confirmation is absent.

The same ordering exists in the explicit submit path: `submitDraft` calls `onSaved(response)` and only
then sets `Viewing Request submitted from the server response.` The completion feedback therefore has
the same remount risk. This is a presentation/lifecycle defect, not evidence that the mutation failed
or that the server state is incorrect.

This was reproduced against the current local Main source on 2026-09-02 in isolated
`agent-browser` session `rightspot-audit-073`. A disposable tenant draft was created through the
ordinary local API setup, the tenant opened `/tenant/requests`, changed the note, and activated
`Save draft`. The browser captured `PATCH /api/tenant/request` with status `200`; the resulting page
showed the updated draft state but no success status. The user's browser was not used. The fixture is
disposable and must be reset before closure evidence.

## Classification and impact

`F-19` is a `VERIFIED_DEFECT` in the tenant request mutation-feedback lifecycle.

- Trust impact: the application performs a stateful tenant action without clearly confirming completion
  from the server response.
- Usability impact: a tenant may repeat Save draft, wait unnecessarily, or believe the request was not
  persisted even though the authoritative projection changed.
- Boundary: this does not authorize optimistic UI, automatic retry, duplicate command handling, or a
  change to server state; success must be reported only after the existing response is accepted.
- Priority rationale: the ordinary workflow remains possible, but completion feedback is important at
  the primary tenant mutation surface and the defect affects both request-entry consumers.

## Bounded objective

1. After a successful draft create or update, show a bounded tenant-owned success message that survives
   the authoritative editor rehydration and clearly says the draft was saved from the server response.
2. After a successful explicit request submission, show a bounded tenant-owned success message that
   survives any authoritative editor rehydration and clearly says the Viewing Request was submitted.
3. Keep error, conflict, loading, dirty-state, version, and explicit-action boundaries truthful.
4. Preserve the same behavior in `/tenant/requests` and `/tenant/listings/[listingId]` without changing
   the workflow/API contract.
5. Add focused TDD source/UI coverage for both success paths and run the complete required validation
   ladder before closure.

## Accepted behavior and boundary

- A success message is rendered only after the existing mutation promise resolves with a valid server
  response.
- The success message belongs to a lifecycle owner that remains mounted when the request version changes,
  or is otherwise carried through the existing `onSaved` boundary without relying on a soon-to-be-removed
  child state owner.
- The authoritative response remains the only source of request state, listing data, and version.
- A successful save must not imply submission, agent notification, or tenant-visible contact beyond the
  existing draft semantics.
- A successful submission must not imply agent review, a response, or a viewing confirmation.
- Existing conflict recovery remains a separate neutral status/error boundary and must not be replaced
  by a success message.
- Browser failure, invalid input, stale version, and failed response parsing must not produce a success
  message.

## Accepted design — parent-owned lifecycle feedback — 2026-09-02

The existing version-keyed `TenantRequestEditor` remount is intentional: it accepts the authoritative
server response and rehydrates the form from the returned request version. The repair must preserve
that boundary rather than remove the key or rely on a child state update after the parent changes it.

The smallest accepted design is:

1. Extend the existing `onSaved` callback with an optional bounded success message. The editor calls
   `onSaved(response, message)` only after the existing mutation promise returns a valid server response.
   Each parent applies the response and owns the message in the same callback boundary.
2. Remove the editor's local success-message state and render. The request dashboard already has a
   parent-level status surface; listing detail gains one equivalent parent-level status surface. Each
   surface renders at most one mutation-completion message, outside the version-keyed editor.
3. Add a scoped `onFeedbackChange` callback for the editor to clear parent-owned completion feedback on
   field changes, adding/removing a time, validation/mutation start, or any other new local action that
   makes the prior completion message stale. This is a local callback, not a global notification
   abstraction.
4. Parent read start, ordinary response acceptance without a success message, conflict recovery, and
   controlled error paths clear or supersede the prior success message. Conflict recovery continues to
   use its existing parent-owned neutral/error notice and never claims mutation success.
5. The dashboard and listing-detail consumers use the same callback contract. No API, domain,
   persistence, workflow, navigation, or shared feedback infrastructure changes.

This design was challenged against remount ordering, both consumers, duplicate-surface risk, stale
feedback after subsequent interaction, failed/conflicted mutations, and the existing authoritative
response contract. None requires a broader change within this Task.

## Non-goals and forbidden expansion

- No change to server routes, DTOs, domain state transitions, persistence, command IDs, idempotency,
  optimistic concurrency, or response payloads.
- No new toast system, notification library, polling, automatic retry, timeout, offline mode, cache,
  or generic feedback framework.
- No change to validation rules, preferred-time semantics, dirty tracking, request entry points, role
  authorization, privacy projection, Favourite behavior, Agent UI, or listing data.
- No redesign of the tenant visual system, no unrelated accessibility sweep, and no broad audit of every
  success message outside the two tenant request-editor mutation paths.
- No external authentication, WebMCP, Cloud Receiver, WebRTC, Redis, deployment, production-readiness,
  Git, Worktree, or outer `Web-Game` changes.
- No cleanup, staging, commit, restore, or formatting of unrelated collaborator-owned dirty/untracked
  files.

## Work Order

### RS-WO-041-01 — Make tenant request mutation completion feedback survive rehydration

**Role:** Main-thread Builder and integration authority; focused TDD followed by bounded self-review and
browser verification  
**Status:** `CLOSED_VERIFIED`
**Pre-dispatch status:** `MAIN_THREAD_ACTIVE`
**Execution state:** `CLOSED_VERIFIED`
**Owner:** Main RightSpot thread  
**Parallelization:** `SERIAL_TENANT_REQUEST_FEEDBACK` — one Work Order owns the shared editor and both
tenant consumers; no concurrent writer may touch its write set.  
**Execution profile:** `Fast` — two tenant UI consumers, one editor boundary, focused UI contracts, and
documentation reconciliation; no server or data work.  
**Dispatch state:** `not dispatched` — Main-owned serial repair  
**Next gate:** None for this Work Order; continue the next audit cycle.
**Parent execution posture if blocked:** `PROGRESSING`

### Required read set

- `src/ui/tenant/tenant-request-page.tsx`
- `src/ui/tenant/tenant-listing-page.tsx`
- `src/ui/tenant/tenant-api.ts`
- `tests/ui/tenant-request-editor-feedback.test.ts`
- `tests/ui/tenant-request-read-concurrency.test.ts`
- `tests/ui/tenant-conflict-recovery.test.ts`
- `tests/ui/tenant-listing-read-failure.test.ts`
- `Docs/07-business-flows-and-scenarios.md`
- `Docs/06-validation-and-evidence.md`
- `RUNBOOK.md`

### Main write set

- `src/ui/tenant/tenant-request-page.tsx` — bounded success-feedback ownership and editor callback only
- `src/ui/tenant/tenant-listing-page.tsx` — bounded success-feedback consumer wiring only if required by
  the accepted design
- `tests/ui/tenant-request-editor-feedback.test.ts` or one new focused test file — Red→Green contract
  for both successful save and successful submit feedback survival
- this Task File
- `Docs/Tasks/README.md`
- canonical current-status, flow, validation, audit, roadmap, Development README, and Runbook records
  during closure

### Forbidden set

- All files under `src/server/`, `src/shared/contracts/`, persistence, API route handlers, workflow
  fixtures, auth/session, shared navigation, Agent UI, Favourites, and media
- `src/ui/tenant/tenant-api.ts` unless a pure test-only import adjustment is proven unavoidable; no API
  behavior or error mapping change
- Any mutation of request state, version, command IDs, response contracts, validation, or dirty-state
  semantics
- New dependencies, global notification infrastructure, generated `.next/` output, user browser tabs,
  Git refs/commits, Worktree lifecycle, and unrelated dirty/untracked files

### Generated/local-only set

`.next/`, disposable fixture database state, isolated `agent-browser` state, screenshots, and server
logs are evidence artifacts only and must not become authored source.

## Design review and TDD execution contract

Before Green, confirm all of the following:

1. The feedback owner survives the existing version-keyed authoritative rehydration in both tenant
   consumers.
2. The design does not weaken the existing `onSaved` data-acceptance and read-invalidation boundary.
3. The message is cleared or superseded when a new read, new mutation, conflict, or error makes the old
   success claim stale.
4. Draft save and explicit submit remain visibly separate actions; neither message claims more than the
   server operation completed.
5. The design does not create duplicate success surfaces when the editor is embedded in listing detail.

### Red

Add focused source/UI assertions that fail against the registered source because successful save and
submit feedback is currently owned by the version-keyed child after `onSaved` updates the parent. The
contract must cover both tenant request consumers or prove that their shared parent boundary is the
single owner. It must not prescribe a new global feedback abstraction.

### Green

Make the smallest UI-only change that gives the completion message a surviving lifecycle owner or
explicitly transports the bounded message through the existing authoritative-data callback. Preserve
the current server-response-first ordering, conflict handling, loading/error surfaces, and editor
rehydration behavior.

### Refactor

Remove only duplication introduced by the bounded feedback wiring. Re-run focused tests after each
refactor and confirm no unrelated success/error path changed.

## Verification and closure gate

- Focused TDD records the registered Red failure and Green pass for both save and submit success
  feedback.
- Pinned `npm test`, `npm run test:foundation`, `npm run typecheck`, and `npm run build` pass.
- Repository validators, sensitive scans, docs validation, and `git diff --check` pass from the repo
  root.
- Fresh isolated browser evidence covers successful draft save and explicit submit from
  `/tenant/requests`, and at least one successful mutation from listing detail if the shared wiring
  is exercised there. Each message is visible after the authoritative version changes, and no false
  success appears on a controlled failed mutation.
- Evidence confirms no duplicate success message, no automatic submission, no request/fixture mutation
  from a read/retry, and no browser page errors.
- Exact-scope review confirms no API, server, domain, persistence, DTO, auth, Agent, Favourite,
  dependency, generated, Git, Worktree, or unrelated collaborator path changed.
- This Task File, Task index, Flow 3/4/10/11 records as applicable, validation evidence, audit, roadmap,
  Current Status, Development README, and Runbook agree before moving the Task to `closed`.

## Stop and reopen conditions

Stop before Green if preserving the message requires changing server state, weakening authoritative
rehydration, adding a new global notification mechanism, or touching unrelated dirty paths. Stop before
closure if a successful mutation still gives no visible completion feedback, a failed mutation can
produce success copy, the message is lost in either tenant consumer, or the repair changes workflow
semantics. Register a separate bounded Task if another non-tenant consumer has the same lifecycle defect;
do not widen this Task opportunistically.

## Registration evidence — 2026-09-02

The Main-thread continuous audit inspected the current tenant request editor and its two consumers after
`RIGHTSPOT-040` closure. Isolated session `rightspot-audit-073` used the local application with the
approved pinned runtime and captured a successful `PATCH /api/tenant/request` (`200`). The new
authoritative draft state was present, but the editor's bounded success message was not visible after
the version-keyed remount. The same source ordering exists in the explicit submit handler, so both
paths are registered under this one product outcome. No user browser tab was used. The disposable
fixture must be reset before implementation or closure evidence.

## Closure evidence — 2026-09-02

The accepted design was implemented in the canonical Main Worktree without dispatching a supporting
thread or opening a Worktree. The editor now transports bounded draft-save and explicit-submit
completion copy through `onSaved(response, message)` to the parent, while both version-keyed editor
consumers remain authoritative and rehydrate from the server response. The editor no longer renders a
remount-prone local success state; parent-level status surfaces are used once on the request dashboard
and listing detail. A scoped feedback-clear callback removes stale completion copy on new editor
interaction, validation/mutation start, and recovery boundaries.

Verification results:

- Focused TDD Red: the newly added parent-ownership contract failed against the pre-repair source;
  focused Green then passed `7/7` across the feedback, read-concurrency, and conflict-recovery
  contracts.
- Pinned `npm test`: `159/159` across `39` authored test files; `npm run typecheck` and
  `git diff --check` passed.
- Isolated browser session `rightspot-verify-041`, fixture generation `68`: listing-detail draft save
  returned `POST /api/tenant/request` `200` and kept `Draft saved from the server response...` visible
  after the authoritative remount; `/tenant/requests` submit returned
  `POST /api/tenant/request/submit` `200` and kept `Viewing Request submitted from the server response.`
  visible after the request entered `REQUEST_SUBMITTED`.
- Controlled stale-version check at generation `69`: an external version bump advanced the draft from
  version `2` to `3`; the stale UI save returned `409`, followed by an authoritative `GET` `200`. The
  old success copy was absent and the parent showed only the neutral conflict recovery notice. No page
  errors were reported.
- The disposable fixture was reset to generation `70`, `/api/health` returned
  `{"ok":true,"service":"rightspot"}`, and the isolated browser session was closed.

`F-19`, `RIGHTSPOT-041`, and `RS-WO-041-01` are `CLOSED_VERIFIED` within the tenant request mutation
completion-feedback consumer boundary. This closure does not claim new server, API, domain,
persistence, auth, Agent, Favourite, external-integration, deployment, WebMCP, Cloud Receiver, WebRTC,
Redis, or production-readiness behavior.

## Source identity and integration boundary

- Repository root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`
- RightSpot package root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot`
- Registration source: canonical Main Worktree, branch `main`, HEAD
  `4224f3ae53f6d4be87a7be17e74532f5785357b0`
- Runtime baseline: pinned Node.js `v24.20.0`; pinned npm `11.19.0`
- Worktree state: one canonical Main Worktree with pre-existing mixed dirty/untracked files. Preserve
  them; do not stage, commit, restore, or broadly reformat them under this Work Order.
- Source identity rule: path-scoped validation; the existing dirty/untracked inventory is not evidence
  of this Work Order's change and must remain outside its write set.
