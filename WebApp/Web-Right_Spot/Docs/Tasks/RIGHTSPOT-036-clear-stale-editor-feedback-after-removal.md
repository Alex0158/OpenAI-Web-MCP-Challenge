# RIGHTSPOT-036: Clear stale editor feedback after removing a preferred time

**Type:** `defect`  
**Lifecycle:** `closed`  
**Priority:** `P2` for truthful tenant form recovery  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-02  
**Depends on:** the accepted `RS-FLOW-05` Viewing Request editor and the closed
`RIGHTSPOT-035` option-control accessibility repair

## Task Control

- Type: `defect`
- Lifecycle: `closed`
- Priority: `P2` — after a tenant corrects an invalid time set by removing a row, stale validation
  feedback still claims the current editor is invalid.
- Owner: Main RightSpot thread
- Current increment: Clear editor feedback when the tenant removes a preferred-time row, while
  preserving the existing row-filter behavior, validation rules, and request boundary.
- Execution posture: `CLOSED_VERIFIED`; Main-thread serial repair; no supporting Worktree or external
  dispatch was needed.
- Evidence status: `CLOSED_VERIFIED`
- Next gate: Main-thread cross-layer audit. Reopen only if a later audit reproduces stale editor
  feedback after structural row removal.
- Dependencies: None blocking; the repair must preserve `RIGHTSPOT-035` accessible names.

## Verified problem

During the fresh local browser audit at workflow fixture generation `37`, the tenant opened a new
Viewing Request editor, added a second preferred time, and entered reverse-ordered values. The editor
correctly displayed the validation alert:

```text
Preferred times must be in strictly increasing order; duplicate times are not accepted.
```

The tenant then removed Option 2, leaving one valid Option 1 value. The row was removed correctly, but
the old validation alert remained visible even though the current form no longer violated the ordering
rule. The existing input-change handler clears both error and status feedback; the structural removal
handler did not. This is a presentation/state-feedback defect, not a server or validation defect.

## Bounded objective

1. Treat preferred-time row removal as an editor input change for local feedback purposes.
2. Clear the current validation error and stale success/status message when a row is removed.
3. Preserve the existing option-numbered accessible names, visible `Remove` text, row-filter behavior,
   one-to-three boundary, chronological validation, dirty tracking, and server payloads.
4. Add focused source/UI contracts that fail before the repair and pass after it.
5. Verify the corrected behavior in an isolated browser without changing workflow or API code.

## Accepted behavior and boundary

- Removing one row from a two- or three-option editor removes only that selected row.
- A removal clears any currently rendered editor `role="alert"` or success/status feedback caused by a
  previous editor action; it does not fabricate a new success message.
- After removing the row that made a reverse-ordered set invalid, the remaining valid set has no stale
  ordering alert. The tenant may still explicitly save the remaining values.
- The option-numbered accessible names from `RIGHTSPOT-035` remain distinct and continue to follow the
  rendered option number.
- With one option, no removal control is rendered. Adding and editing options retain their existing
  validation and feedback behavior.
- The server remains authoritative. This task changes only local editor feedback before the next
  explicit save/submit action.

## Non-goals and forbidden expansion

- No server/API/domain/persistence/workflow/DTO/parser/time-zone or request-state change.
- No change to validation rules, error wording, dirty/signature semantics, save/submit behavior, or
  command payloads.
- No new request states, cancellation, rescheduling, duplicate requests, Information Request, live
  chat, authentication, Operations, WebMCP, Cloud Receiver, WebRTC, Redis, deployment, or external
  service work.
- No general notification/toast framework, global feedback policy, component-library migration, visual
  redesign, CSS change, or unrelated error-copy rewrite.
- No change to generated output, browser tabs belonging to the user, server configuration, Git refs,
  Worktree lifecycle, the outer `Web-Game` application, or unrelated dirty files.

## Work Order

### RS-WO-036-01 — Reset stale tenant editor feedback after row removal

**Role:** Main-thread Builder and integration authority; focused TDD verification followed by full
static and browser verification  
**Pre-dispatch status:** `MAIN_THREAD_ACTIVE`  
**Execution state:** `CLOSED_VERIFIED`  
**Owner:** Main RightSpot thread  
**Parallelization:** `SERIAL_TENANT_REQUEST_EDITOR_FEEDBACK` — one editor handler and its focused
contract form the complete local boundary.  
**Execution profile:** `Fast` — one local JSX handler expansion and focused UI contracts; no server or
data work.

### Required read set

- `src/ui/tenant/tenant-request-page.tsx`
- `tests/ui/tenant-request-editor-accessibility.test.ts`
- `tests/ui/tenant-proposed-viewing-time.test.ts`
- `Docs/07-business-flows-and-scenarios.md`
- `Docs/06-validation-and-evidence.md`
- `RUNBOOK.md`

### Main write set

- `src/ui/tenant/tenant-request-page.tsx` — the existing preferred-time removal handler only
- `tests/ui/tenant-request-editor-feedback.test.ts` — focused Red→Green source/UI contracts
- this Task File
- `Docs/Tasks/README.md`
- canonical status, flow, validation, audit, roadmap, and Runbook records during closure

### Forbidden set

- All files under `src/server/`, `src/shared/contracts/`, persistence, API routes, and workflow
  fixtures
- `validateTimes`, time conversion, request commands, dirty signature, dashboard state, favourites,
  listing detail loading, shared navigation, global CSS, auth/session, dependencies, media, and
  Operations
- any change to visible option text, accessible-name format, request state, or server payload
- user browser tabs, generated `.next/` output, Git refs/commits, Worktree lifecycle, and unrelated
  dirty files

### Generated/local-only set

`.next/`, disposable fixture database state, isolated `agent-browser` state, screenshots, and server
logs are evidence artifacts only and must not become tracked product source.

## TDD execution contract

### Red

Add the focused contract before changing the handler. It failed against the registered Main source
because the removal callback changed `times` but did not clear `error` or `statusMessage`. The contract
also asserts the existing `times.length > 1` boundary and the option-numbered accessible-name
contract.

### Green

Expand only the existing removal callback so it performs the row filter and clears the two local
feedback states. The repair introduced no new state machine, effect, timeout, generic fallback, or
server request.

### Refactor

Keep the smallest readable local handler. Extract a helper only if it makes the exact removal and
feedback boundary clearer without changing behavior; no refactor was required by this Work Order.

## Recorded closure evidence — 2026-09-02

- Focused TDD contract: Red `2 tests; 1 passed; 1 failed` because the removal callback did not clear
  feedback; Green `2/2` after the bounded callback repair.
- Pinned `npm test`: `149/149` across `35` authored test files.
- Pinned `npm run test:foundation`: `6/6`; `npm run typecheck`; production `npm run build`; and
  tracked-scope `git diff --check` all passed.
- Fresh isolated browser session `rightspot-audit-20260902-036` at fixture generation `37` entered
  reverse-ordered values, observed the ordering alert, and cleared the request log before Save draft;
  the browser reported `No requests captured`.
- Removing Option 2 then left only `2026-09-18T10:00`, no `role="alert"` validation copy, no stale
  editor status, and no removal control. This confirmed the selected row and feedback state both
  changed as intended.
- Re-adding a valid second option preserved the `RIGHTSPOT-035` names for Options 1 and 2. Both were
  enabled native buttons with `tabIndex=0`; at `320px`, document and body widths equalled the viewport;
  browser errors were empty. Evidence screenshot is retained at
  `var/test/audit-036-feedback-cleared-after-remove.png`.
- Product scope is limited to the existing tenant editor removal callback and focused source/UI
  contracts. No server, API, domain, persistence, shared contract, CSS, dependency, route, workflow,
  Git, or Worktree behavior changed.

The disposition is `CLOSED_VERIFIED` for the bounded local editor-feedback outcome. The existing
validation rules, wording, dirty tracking, request lifecycle, and server authority remain unchanged.

## Verification and closure gate

- Focused feedback contract: recorded Red then Green.
- Full `npm test`, `npm run test:foundation`, `npm run typecheck`, and `npm run build`.
- `git diff --check` for changed product/document paths and the local Markdown whitespace check.
- Fresh isolated browser evidence with reverse-ordered two-option values, visible validation, removal
  of the invalid row, absence of stale alert, and no request mutation during the correction.
- Confirm distinct `RIGHTSPOT-035` accessible names, correct selected-row removal, one-option boundary,
  keyboard reachability, no application console/page errors, and no horizontal overflow at `320px`.
- Confirm the exact product diff changes only the tenant editor removal handler and focused contracts;
  no server/API/domain/persistence/shared-contract/CSS/dependency behavior changed.
- Reconcile this Task File, the Task index, current status, Flow 5, validation evidence, audit,
  roadmap, and Runbook before marking the task `closed`.

## Source identity and integration boundary

- Repository root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`
- RightSpot package root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot`
- Registration source: canonical Main Worktree, branch `main`, HEAD
  `4224f3ae53f6d4be87a7be17e74532f5785357b0`
- Runtime baseline: `/Users/alex/.local/share/rightspot/node-v24.20.0-darwin-arm64/bin`, Node.js
  `v24.20.0`, npm `11.19.0`
- Worktree state: one canonical Main Worktree with mixed existing dirty/untracked paths. Preserve
  them; do not stage, commit, restore, or broadly reformat them under this Work Order.

## Stop and reopen conditions

Stop before Green if clearing feedback requires changing shared components, validation rules, request
payloads, or an unrelated dirty section. Stop before closure if removal targets the wrong row, stale
feedback remains after correction, the `RIGHTSPOT-035` accessible names regress, or any out-of-scope
path changes. Reopen only if a later audit reproduces stale editor feedback after structural row
removal.
