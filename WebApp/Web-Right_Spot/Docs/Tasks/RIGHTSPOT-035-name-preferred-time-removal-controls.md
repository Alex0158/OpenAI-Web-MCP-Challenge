# RIGHTSPOT-035: Give preferred-time removal controls unique accessible names

**Type:** `defect`  
**Lifecycle:** `closed`  
**Priority:** `P2` for tenant keyboard and screen-reader operation  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-02  
**Depends on:** `RS-FLOW-05`, the accepted tenant Viewing Request editor, and the current semantic
form/accessibility boundary

## Task Control

- Type: `defect`
- Lifecycle: `closed`
- Priority: `P2` — repeated removal controls expose the same accessible name, so a non-visual user
  cannot identify which preferred-time option will be removed.
- Owner: Main RightSpot thread
- Current increment: Repair the existing tenant editor's repeated Remove controls with unique
  accessible names while preserving the one-to-three time boundary and removal behavior.
- Execution posture: `CLOSED_VERIFIED`; Main-thread serial repair; no supporting Worktree or external
  dispatch was needed.
- Evidence status: `CLOSED_VERIFIED`
- Next gate: Main-thread cross-layer audit. Reopen only if a later audit reproduces ambiguous preferred-
  time removal controls or the accepted editor structure changes.
- Dependencies: None blocking; the repair must preserve the accepted request editor and server
  contract.

## Verified problem

During a fresh local browser audit at workflow fixture generation `36`, the tenant opened the
listing-detail request editor and added a second preferred viewing time. The accessibility tree
exposed both adjacent controls as:

```text
button "Remove"
button "Remove"
```

The controls are visually adjacent to `Option 1` and `Option 2`, but their accessible names do not
carry that context. A keyboard or screen-reader user therefore cannot reliably tell which option a
Remove action targets. The same ambiguity would occur with a third option.

The browser also showed the existing chronological validation message when the two options were
entered in reverse order, and no request mutation was sent for that invalid save attempt. This
confirms the observation is limited to control naming, not request validation or state mutation.

## Bounded objective

1. Give every rendered preferred-time removal control a unique, programmatic accessible name that
   identifies its option number.
2. Keep the visible control text, option ordering, one-to-three limit, form validation, and removal
   semantics unchanged.
3. Keep the control keyboard-reachable and associated with the same row as its input.
4. Add a focused source/UI contract that fails before the repair and passes after it.
5. Do not change the server contract, request lifecycle, time conversion, navigation, or shared
   accessibility system.

## Accepted behavior and boundary

- With one preferred time, no removal control is rendered.
- With two or three preferred times, each removal control has a distinct accessible name in the
  form `Remove preferred viewing time option N`, where `N` is the rendered option number.
- The visible label may remain `Remove`; the `aria-label` supplies the disambiguating programmatic
  name without adding visual copy or changing layout.
- Removing an option continues to remove only the selected row and leaves the remaining option
  values in their existing order.
- The server remains the authority for saved request state; this task is presentation/accessibility
  only.

## Non-goals and forbidden expansion

- No server/API/domain/persistence/workflow/DTO/parser or time-zone change.
- No new request states, cancellation, rescheduling, duplicate requests, calendar integration,
  notification, authentication, Information Request, live chat, Operations, WebMCP, Cloud Receiver,
  WebRTC, Redis, deployment, or external service work.
- No general accessibility framework, component-library migration, visual redesign, global CSS
  change, or unrelated label rewrite.
- No change to the editor's validation, submit boundary, one-request rule, or request dashboard.
- No modification to generated output, browser state, server configuration, Git refs, Worktrees,
  the outer `Web-Game` application, or unrelated dirty files.

## Work Order

### RS-WO-035-01 — Name repeated preferred-time removal controls

**Role:** Main-thread Builder and integration authority; focused TDD verification followed by full
static and browser verification  
**Pre-dispatch status:** `MAIN_THREAD_ACTIVE`  
**Execution state:** `CLOSED_VERIFIED`  
**Owner:** Main RightSpot thread  
**Parallelization:** `SERIAL_TENANT_REQUEST_EDITOR_ACCESSIBILITY` — one tenant component and one
focused contract test form the complete presentation boundary.  
**Execution profile:** `Fast` — one JSX attribute and one focused UI source contract; no server or
data work.

### Required read set

- `src/ui/tenant/tenant-request-page.tsx`
- `src/ui/tenant/tenant.module.css`
- `tests/ui/tenant-proposed-viewing-time.test.ts`
- `Docs/07-business-flows-and-scenarios.md`
- `Docs/06-validation-and-evidence.md`
- `RUNBOOK.md`

### Main write set

- `src/ui/tenant/tenant-request-page.tsx` — accessible name on the existing removal control only
- `tests/ui/tenant-request-editor-accessibility.test.ts` — focused Red→Green source/UI contract
- this Task File
- `Docs/Tasks/README.md`
- canonical status, flow, validation, audit, roadmap, and Runbook records during closure

### Forbidden set

- All files under `src/server/`, `src/shared/contracts/`, persistence, API routes, and workflow
  fixtures
- request editor validation, time conversion, request commands, dashboard state, favourites,
  listing detail loading, shared navigation, global CSS, auth/session, dependencies, media, and
  Operations
- any change to the visible option text, removal behavior, request state, or server payload
- browser tabs belonging to the user, generated `.next/` output, Git refs/commits, Worktree
  lifecycle, and unrelated dirty files

### Generated/local-only set

`.next/`, disposable fixture database state, isolated `agent-browser` state, screenshots, and server
logs are evidence artifacts only and must not become tracked product source.

## TDD execution contract

### Red

Add the focused contract before changing the component. It failed against the registered Main baseline
because the repeated Remove button had no unique `aria-label`. The contract also asserts that the
existing editor, `Option` labels, and visible `Remove` text remain present.

### Green

Add only the option-numbered accessible name to the existing button. The repair derives the number
from the already-rendered `index`; it introduces no new state, IDs, event logic, or fallback text.

### Refactor

Only remove duplication after the focused contract is green. No refactor was required; the one-line
repair remains the clearest implementation.

## Recorded closure evidence — 2026-09-02

- Focused TDD contract: Red `2 tests; 1 passed; 1 failed` because the unique `aria-label` was absent;
  Green `2/2` after the component-only repair.
- Pinned `npm test`: `147/147` across `34` authored test files.
- Pinned `npm run test:foundation`: `6/6`; `npm run typecheck`; production `npm run build`; and
  tracked-scope `git diff --check` all passed.
- Fresh isolated browser session `rightspot-audit-20260902-next` showed distinct accessibility-tree
  names `Remove preferred viewing time option 1` and `Remove preferred viewing time option 2`.
  Removing Option 2 left only the original Option 1 value and no removal control, proving the selected
  row—not an arbitrary row—was removed.
- With reverse-ordered values `2026-09-18T10:00` and `2026-09-17T10:00`, the existing alert remained
  visible and, after clearing the request log before Save draft, the browser reported `No requests
  captured`; the invalid save therefore stopped before a request mutation.
- Both named controls were enabled native buttons with `tabIndex=0`; at the supported `320px` floor,
  `innerWidth`, document `scrollWidth`, and body `scrollWidth` were all `320`. Browser errors were
  empty, and the evidence screenshot is retained at
  `var/test/audit-035-preferred-time-remove-buttons.png`.
- Product change scope is limited to the existing tenant editor's `aria-label` and its focused source
  contract. No server, API, domain, persistence, shared contract, CSS, dependency, route, workflow,
  Git, or Worktree behavior changed.

The disposition is `CLOSED_VERIFIED` for the bounded accessibility naming outcome. The separate
observation that a validation alert can remain visible after a structural row removal is not part of
this Task's accepted outcome; it is retained for the next Main-thread audit and must be reproduced
before any new Task is registered.

## Verification and closure gate

- Focused editor accessibility contract: recorded Red then Green.
- Full `npm test`, `npm run test:foundation`, `npm run typecheck`, and `npm run build`.
- `git diff --check` for changed tracked paths and the local Markdown whitespace check.
- Fresh isolated browser evidence with two preferred-time options showing distinct accessible names,
  successful removal of the selected row, and the existing reverse-order validation remaining
  visible without a request mutation.
- Confirm no application console/page errors, no horizontal overflow at the supported `320px` floor,
  and keyboard reachability of both named controls.
- Confirm the exact product diff contains only the declared component attribute and focused contract;
  no server/API/domain/persistence/shared-contract behavior changed.
- Reconcile this Task File, the Task index, current status, Flow 5, validation evidence, audit,
  roadmap, and Runbook before marking the task `closed`.

## Source identity and integration boundary

- Repository root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`
- RightSpot package root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot`
- Registration source: canonical Main Worktree, branch `main`, HEAD
  `4224f3ae53f6d4be87a7be17e74532f5785357b0`
- Runtime baseline: `/Users/alex/.local/share/rightspot/node-v24.20.0-darwin-arm64/bin`, Node.js
  `v24.20.0`, npm `11.19.0`
- Worktree state: one canonical Main Worktree with mixed existing dirty/untracked paths. They are
  preserved and must not be staged, committed, restored, or broadly reformatted by this Work Order.

## Stop and reopen conditions

Stop before Green if the requested accessible name requires changing shared components, visible
product behavior, server contracts, or an unrelated dirty section of the editor. Stop before closure
if a browser check cannot distinguish the two controls, if removal changes the wrong row, or if any
out-of-scope path changes. Reopen only if a later audit reproduces ambiguous preferred-time removal
controls or the accepted editor structure changes.
