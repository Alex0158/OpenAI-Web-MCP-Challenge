# RIGHTSPOT-031: Preserve truthful tenant conflict-recovery feedback

**Type:** `defect`
**Lifecycle:** `closed`
**Priority:** `P2` for tenant action clarity and conflict-state truthfulness
**Owner:** Main RightSpot thread
**Opened:** 2026-09-02
**Depends on:** `RIGHTSPOT-030`, ADR-RS-0008, and the stale/conflict rules in
[`07-business-flows-and-scenarios.md`](../07-business-flows-and-scenarios.md)

## Task Control

- Type: `defect`
- Lifecycle: `closed`
- Priority: `P2` — a stale tenant write can return a correct authoritative view while the UI
  loses the required explanation, or can claim that a refresh succeeded when recovery failed.
- Owner: Main RightSpot thread
- Current increment: Preserve a parent-owned bounded conflict notice across the tenant request
  editor remount and keep recovery-failure copy truthful.
- Execution posture: `CLOSED_VERIFIED`
- Evidence status: `VERIFIED_DEFECT` for the successful-refetch presentation path; the failed-
  refetch branch was statically identified, repaired with truthful copy, and covered by the focused
  source contract without being claimed as a separate browser reproduction.
- Next gate: Closed after Main-thread Red→Green implementation, full regression, and isolated
  browser verification on both tenant request surfaces.
- Dependencies: None beyond the current source and the evidence recorded below.

## Verified problem

The tenant draft editor handles a `409` by reading the authoritative tenant request and invoking
its `onSaved` callback, then setting a local error message:

```text
This draft is stale or the request changed. The tenant view was refreshed; review it before trying again.
```

Both current parents key the editor by request version. When the conflict refetch returns a newer
request, `onSaved` changes the parent data and remounts the editor before the local error state can
remain visible. The tenant therefore sees the newer server data but no visible stale/conflict
explanation, although ADR-RS-0008 requires a bounded conflict state after a `409`.

### Controlled reproduction — 2026-09-02

An isolated `agent-browser` session used the local server at `http://127.0.0.1:3100` with a fresh
fixture generation `19`. A tenant draft at request version `1` was loaded in the listing-detail
editor. A separate authenticated HTTP update advanced the authoritative draft to version `2`.
Submitting the stale browser draft produced this observed network sequence:

```text
POST /api/tenant/request/submit → 409
GET  /api/tenant/request         → 200 (authoritative version 2)
```

The page rendered the externally updated draft at version `2`, but no stale/conflict notice was
visible. The cause is the version-keyed editor remount after `onSaved`; the server state was not
corrupted. The isolated session was closed and the fixture was reset to generation `20`.

### Static adjacent failure path

If the recovery `readTenantRequest()` itself fails, the current catch block still sets the same
message claiming that the tenant view was refreshed. That is not truthful and the catch currently
swallows the recovery error. This branch has not been promoted to a separate browser claim because
the browser route harness did not replace the exact request response; the repair must nevertheless
distinguish successful recovery from failed recovery.

## Bounded objective

1. Keep a successful `409` conflict notice in parent-owned state so it survives the editor's
   authoritative-data remount in both `/tenant/requests` and listing detail.
2. Show a distinct bounded message when the conflict refetch fails; never say that the tenant view
   was refreshed when it was not.
3. Continue to accept only the server response after a conflict; do not replay the failed command,
   patch workflow state locally, or invent replacement data.
4. Clear the conflict notice after an ordinary successful read or mutation, while retaining it long
   enough for the tenant to understand and review the newly authoritative state.
5. Preserve the existing request editor, one-request rule, version/generation metadata, role/privacy
   boundary, route behavior, and all normal save/submit semantics.

## Accepted behavior and boundary

- A stale write remains a `409` and remains non-mutating.
- A successful conflict refetch renders the authoritative tenant view and a visible message such
  as: `The request changed on the server. The latest tenant view is shown; review it before trying again.`
- A failed conflict refetch renders a message such as: `The request changed on the server, but the
  latest tenant view could not be refreshed. Reload this page before trying again.`
- The conflict message is presentation feedback, not a new workflow state and not a success result.
- No automatic retry, command replay, optimistic state patch, generic data-fetching dependency,
  server/API/domain/persistence change, CSS-system change, or external integration is allowed.
- The analogous un-reproduced `tenant-listing-page.tsx` dynamic-route read overlap remains outside
  this Task. Any change to its `load()` sequencing requires a separate reproduced finding and
  separate scope decision.

## Work Order

### RS-WO-031-01 — Make tenant conflict recovery visible and truthful

**Role:** Main-thread Builder → focused verification → full regression → documentation closure
**Status:** `CLOSED_VERIFIED`
**Execution state:** `CLOSED`
**Owner:** Main RightSpot thread
**Parallelization:** `SERIAL_TENANT_CONFLICT_FEEDBACK` — the editor callback and both parent
feedback surfaces form one small shared presentation boundary; no parallel writer is admitted.
**Execution profile:** `Standard` — two tenant components, one focused UI contract test, and
bounded documentation; no API or dependency change.

### Required read set

- `src/ui/tenant/tenant-request-page.tsx`
- `src/ui/tenant/tenant-listing-page.tsx`
- `src/ui/tenant/tenant.module.css`
- `tests/ui/tenant-request-read-concurrency.test.ts`
- `tests/ui/tenant-listing-request-notice.test.ts`
- `Docs/Decisions/ADR-RS-0008-ordinary-workflow-http-and-interface-contract.md`
- `Docs/07-business-flows-and-scenarios.md`
- `Docs/06-validation-and-evidence.md`
- `RUNBOOK.md`

### Main write set

- `src/ui/tenant/tenant-request-page.tsx` — conflict notice type/callback and truthful recovery
  handling only
- `src/ui/tenant/tenant-listing-page.tsx` — parent-owned conflict feedback rendering only; do not
  alter its asynchronous listing/request read implementation
- `tests/ui/tenant-conflict-recovery.test.ts`
- this Task File
- `Docs/Tasks/README.md`
- `Docs/00-current-status.md`
- `Docs/06-validation-and-evidence.md`
- `Docs/07-business-flows-and-scenarios.md`
- `Docs/Development/RIGHTSPOT-CROSS-LAYER-AUDIT-2026-09-02.md`
- `Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md`

### Forbidden set

- All server route handlers, domain/state-transition code, persistence, database fixtures, DTOs,
  API contracts, authentication/session behavior, and dependencies
- `tenant-listing-page.tsx` `load()`/`Promise.all` sequencing and the separate F-08 evidence gap
- Agent surfaces, shared navigation, global CSS, media, Operations, external authentication,
  WebMCP, Cloud Receiver, WebRTC, Redis, deployment, and outer `Web-Game` files
- Browser state, server logs, generated output, Git metadata, Worktree lifecycle, and unrelated
  collaborator changes

### Generated/local-only set

`.next/`, test output, isolated browser session state, server logs, and disposable fixture database
state are evidence artifacts only and must not become tracked product source.

## TDD execution contract

### Red

The focused source-contract regression initially failed against the registered baseline because the
editor had no parent-owned conflict-notice contract. After the additional review-found listing
writer gap was encoded, the contract failed again until the listing parent accepted request data
through its own notice-clearing writer. The final contract requires:

1. the editor exposes an explicit parent-owned conflict-notice callback;
2. successful conflict recovery reports the authoritative-view notice after accepting the refetch;
3. failed recovery uses distinct truthful wording and does not retain the old `view was refreshed`
   claim; and
4. both current tenant parents pass the callback and render the notice outside the version-keyed
   editor.

The Red result is recorded in the closure evidence below before the component changes.

### Green

The repair uses the smallest parent-owned notice state. After a successful conflict refetch, it
accepts the server response first and then notifies the parent with the recovered-state message. If
the refetch fails, it reports a bounded recovery-failure message that does not claim success. No
retry loop, cancellation infrastructure, or local workflow state was added.

### Refactor

Only the callback/type and notice rendering were kept local to the two existing tenant parents. The
accepted messages, remount-safe ownership, and exact source boundary are preserved.

## Closure evidence — 2026-09-02

- Focused TDD contract: initial Red was captured before source changes; the final
  `tenant-conflict-recovery.test.ts` contract passes `1/1`.
- Pinned full suite: `npm test` passes `137/137` across `30` authored test files; foundation
  `6/6`; typecheck and production build pass.
- Isolated listing-detail browser reproduction: stale `POST /api/tenant/request/submit` returned
  `409`, recovery `GET /api/tenant/request` returned `200`, the authoritative request advanced to
  version `2`, and the visible message was `The request changed on the server. The latest tenant
  view is shown; review it before trying again.`
- Isolated request-dashboard browser reproduction: the same sequence advanced the authoritative
  request to version `3`, retained the external note, and left the same conflict message visible
  outside the version-keyed editor.
- The failed-refetch branch is covered by the source contract and the explicit error copy; it is not
  claimed as a separate browser interception because the isolated route harness did not replace the
  exact recovery response.
- The stale command remained non-mutating in both browser runs; no replay or local workflow patch
  was issued. The fixture was reset afterward to generation `21`, `/api/health` remained healthy,
  and the user's existing in-app browser tab was not used or changed.
- Exact-path review found only the declared two tenant components, one focused UI test, and this
  bounded documentation set changed for the product repair. No API, domain, persistence, dependency,
  listing-detail `load()` sequencing, role/privacy, or external-integration behavior changed.

## Verification and closure gate

Under pinned Node.js `v24.20.0` / npm `11.19.0`:

1. Focused TDD contract passes after the recorded Red failure.
2. The complete `npm test` suite passes, with the count explained.
3. `npm run test:foundation`, `npm run typecheck`, `npm run build`, and `git diff --check` pass.
4. A fresh isolated browser conflict reproduction confirms a `409` followed by a successful
   authoritative refetch leaves the conflict notice visible alongside the new request version.
5. A bounded recovery-failure test or equivalent controlled evidence confirms the failure message
   does not claim that refresh succeeded.
6. Normal draft save/submit behavior and the existing role/privacy/state boundaries remain intact.
7. Exact path review confirms no change to the separate dynamic-route async read concern.
8. Task index, current status, flow catalogue, validation evidence, audit, and roadmap agree.

## Stop and reopen conditions

Stop and report `BLOCKED` if the repair requires an API/domain/DTO decision, changes the dynamic-
route `load()` implementation, needs a new dependency, or cannot preserve the authoritative response
boundary. Do not widen this Task because another page has an un-reproduced asynchronous-read pattern.

Reopen if a `409` response can still lose its explanation after a parent data update, if recovery
failure is represented as a successful refresh, if a failed command is replayed automatically, or if
the change alters workflow state or role/privacy behavior.
