# RIGHTSPOT-022: Remove narrow-viewport tenant navigation clipping

**Type:** `defect`
**Lifecycle:** `closed`
**Priority:** `P2` for the accepted 320px accessibility and demo-readiness baseline
**Owner:** Main RightSpot thread
**Opened:** 2026-09-02
**Depends on:** Closed `RIGHTSPOT-021`; accepted
[ADR-RS-0009](../Decisions/ADR-RS-0009-ui-ux-visual-system-and-navigation.md); the existing
tenant route topology; and the current canonical product source at local product commit `f0dbd99`

## Task Control

- Type: `defect`
- Lifecycle: `closed`
- Priority: `P2`
- Owner: Main RightSpot thread
- Current increment: Make the existing authenticated tenant navigation satisfy the already accepted
  `320px` minimum layout baseline without changing routes, request workflow, role authority, or data.
- Next gate: None for this bounded repair. `RS-WO-022-01` returned `READY_FOR_VERIFICATION`, Main
  froze the exact authorized CSS path at local product commit `f0dbd99`, and persistent Verifier
  `RS-WO-022-02` independently returned `VERIFIED` against that frozen source. Main has reconciled
  the evidence and closed the Task.
- Dependencies: The existing `SessionNav` component, `/tenant` route family, current global CSS,
  and ADR-RS-0009 remain authoritative. No new product or architecture decision is required.
- Execution posture: `CLOSED`
- Evidence status: `VERIFIED` after exact-path review, source freeze, independent verification, and
  canonical documentation writeback.
- Affected surface: The responsive presentation of the authenticated tenant shared navigation only.
  Agent navigation, session authority, request state, APIs, persistence, and route ownership remain
  outside this Task.

## Verified problem

`RIGHTSPOT-021` correctly restored the persistent `My request` entry to the tenant navigation and
closed its declared `390px+` verification matrix. The accepted ADR-RS-0009, however, requires layout
support from `320px` upward. The post-closure audit found a narrow-width residual introduced by the
three-link navigation row:

1. At CSS viewport width `320px`, the content area is approximately `288px` wide after the current
   mobile margins.
2. The three tenant links require approximately `311px` including their current gap and padding.
3. The links container is therefore horizontally scrollable, and the `My request` link begins inside
   the container but ends outside the initial visible area. Manual horizontal scrolling reveals it;
   ordinary keyboard tabbing does not automatically reveal the clipped link.
4. At CSS width `342px`, the container remains approximately `1px` too narrow; at `343px` the current
   row fits. At `390px` and above, the current layout has no observed link clipping or page overflow.

This is a discoverability and keyboard-affordance defect, not a missing route or request capability.
The current source still renders the correct link, and the page-level document does not horizontally
overflow. The problem is that a supported tenant navigation action is not initially visible at part
of the supported range.

## Main-thread audit and decision

The Main thread rechecked the source and the local authenticated surface before registering this Task.
The relevant facts are:

- `src/ui/shared/session-nav.tsx` owns the existing tenant link list and already has the exact
  `My request` route and active-state predicate. It must remain read-only for this Work Order.
- `app/globals.css` owns the `.session-nav*` layout. At `max-width: 480px`, the current tenant and
  agent shells use a column layout, but the shared links container uses `overflow-x: auto` and does
  not wrap.
- The `481–820px` tenant rule already moves the links to a separate row and was not found to overlap
  the session actions in the audited matrix.
- The accepted ADR explicitly names `320px`, `768px`, keyboard navigation, visible focus, touch
  targets, and reduced-motion behavior as acceptance requirements.
- A fresh/reloaded local demo tab may begin signed out because the current session is a bounded local
  demo session rather than production authentication. That observation is intentionally out of scope;
  this Task must not add session persistence or an authentication provider.

Main therefore selects `320px` as the supported floor and registers one narrowly scoped responsive
repair. The preferred implementation is a tenant-only CSS rule at or below the existing `480px`
breakpoint that wraps the three links into additional rows and removes the need for horizontal
scrolling. A taller mobile header is acceptable. Preserving touch-target size and discoverability is
more important than forcing all labels onto one row.

The following alternatives are explicitly rejected for this increment:

- shrinking font, padding, or control sizes until the row happens to fit, because that weakens the
  existing touch-target and readability baseline;
- adding JavaScript focus/scroll management, because a layout-only wrap solves the observed problem
  without new state or browser behavior;
- hiding `My request` behind a menu or changing labels, because that reduces discoverability and
  creates a broader interaction change;
- changing the support floor to `343px` without a new product decision, because it would contradict
  the existing ADR acceptance baseline.

## Bounded objective

At every supported tenant viewport from `320px` upward, all three existing workspace links are
initially visible, keyboard reachable, readable, and non-overlapping, while the shared navigation
continues to be a presentation layer over the existing route and session contracts.

## Implementation boundary

The preferred and currently authorized source change is limited to the existing responsive CSS for
the tenant navigation links in `app/globals.css`. The Builder may not edit TypeScript, route files,
tests, fixtures, APIs, or documentation. If the CSS-only boundary cannot satisfy the acceptance
criteria without a source-structure change, the Builder must stop and return `BLOCKED` with evidence
that a re-scope is required; it must not silently add a React or JavaScript workaround.

Independent verification, if opened, will be a later checkpoint under this same Task File rather
than a new registered Task or separate task file. No Verifier is dispatched at registration time.

## Required behavior

1. The tenant navigation continues to render exactly `Browse rentals`, `Favourites`, and `My request`
   with their existing hrefs and active-state semantics on `/tenant`, tenant Listing Detail,
   `/tenant/favourites`, and `/tenant/requests`.
2. At CSS widths `320px`, `321px`, `342px`, `343px`, `390px`, and `480px`, all three links are
   initially visible inside their links container. A second row is allowed and expected at the
   narrowest widths. No horizontal scroll is required to discover or activate a link.
3. At CSS widths `481px`, `600px`, `680px`, `760px`, `768px`, and `1440px`, the existing responsive
   layout remains readable, non-overlapping, and consistent with the current Field Desk direction.
4. Every link retains a minimum rendered touch target of `44px` in its relevant dimension, visible
   keyboard focus, full label text, and a usable focus position inside the visible navigation area.
5. The document must not acquire page-level horizontal overflow. The links container must not depend
   on `overflow-x: auto` to expose any of the three tenant links at or below `480px`.
6. Agent navigation remains unchanged: the agent sees only its existing queue entry, with no tenant
   link or tenant layout rule leaking into the agent role.
7. Signed-out and wrong-role sessions retain their current privacy and navigation behavior.
8. Activating `My request` remains a normal GET navigation to the existing `/tenant/requests` page;
   it must not save, submit, or otherwise mutate an unsaved Viewing Request draft.

## Non-goals

- Do not change `src/ui/shared/session-nav.tsx` unless Main explicitly re-scopes the Work Order after
  a documented CSS-boundary failure.
- Do not change route files, APIs, DTOs, persistence, fixtures, request states, listing state,
  authentication, role resolution, or session persistence.
- Do not add a menu, badge, notification, request history, Information Request, chat, draft guard,
  auto-save, confirmation dialog, or new workspace capability.
- Do not redesign the visual system, change typography or colour tokens, alter Agent navigation, or
  change non-navigation page layout.
- Do not add a dependency, test harness, generated asset, external service, WebMCP, Cloud Receiver,
  WebRTC, Redis, deployment, publication, commit, push, or Worktree cleanup.
- Do not repair unrelated stale browser/build state, favicon behavior, or the bounded demo-session
  persistence boundary.

## Verification and closure gate

The Builder must return `READY_FOR_VERIFICATION` with the exact changed path and evidence; it must
not claim independent verification. The independent Verifier must run the required static checks and
browser matrix against a frozen source snapshot, including:

- source review proving only the declared CSS rules changed;
- `npm run typecheck`, `npm test`, `npm run build`, and `git diff --check` under Node.js `v24.20.0`
  and npm `11.19.0`;
- tenant route checks at `/tenant`, a tenant Listing Detail route, `/tenant/favourites`, and
  `/tenant/requests`;
- CSS viewport checks at `320`, `321`, `342`, `343`, `390`, `480`, `481`, `600`, `680`, `760`,
  `768`, and `1440px`, explicitly checking initial link visibility, link/action overlap, page
  overflow, the `44px` target floor, and visible focus;
- Agent, signed-out, and wrong-role checks proving no role/privacy regression;
- activation of `My request` proving GET-only route navigation and no request-state mutation;
- console/error review and reduced-motion/focus checks where the browser surface supports them.

The Main thread may close this Task only after exact-path review, independent verification, canonical
Main integration, and current-status/roadmap writeback. A green typecheck or a visually improved
single viewport is not sufficient closure evidence.

## Reopen condition

Reopen or replace this Task if the repair requires a new navigation component, route topology,
workflow state, session/authentication policy, shared API, design-system decision, or a support-floor
change. Those are new authority or scope decisions, not reasons to widen this CSS repair.

## RS-WO-022-01: Repair narrow-viewport tenant navigation layout

**Parent task:** `RIGHTSPOT-022`
**Role:** `Builder`
**Pre-dispatch status:** `GATED` (advanced to `ASSIGNED` after dispatch confirmation)
**Execution state:** `READY_FOR_VERIFICATION`
**Owner:** Persistent supporting Builder task `01a0602e-e947-7231-bf6f-37ed685681e2` (`local`), under the authority of the Main RightSpot thread
**Dispatch state:** `dispatched at main@cbf7643e26503ed0b49cc874c4a591f82e2aef18; serialized canonical Main Worktree; product source clean at dispatch`
**Parallelization:** `SERIAL`
**Execution profile:** `Standard` (shared navigation and accessibility behavior, but no contract, data, auth, or external-effect change)
**Integration owner/order:** Main RightSpot thread; the exact candidate was frozen at local product
commit `f0dbd99`, independently verified, and integrated as the current product source.
**Next gate:** Complete. `RS-WO-022-02` returned `VERIFIED`; Main reconciled the evidence and closed
the parent Task. A required boundary expansion would have been reported as part of the evidence; it
was not a new worker status.
**Parent execution posture if blocked:** `AWAITING_DECISION`
**Blocker report:** If the exact CSS-only write set cannot satisfy the acceptance matrix, report the
first failing width, computed geometry, source identity, and the smallest required re-scope. Do not
edit a second source path to work around the boundary.

### Objective

Use the existing responsive CSS to make all three tenant workspace links initially visible and
keyboard reachable at the accepted `320px` floor, without changing any product behavior or shared
navigation contract.

### Acceptance criteria

- Only the authorized tenant navigation CSS rules in `app/globals.css` change.
- The three tenant links remain exact, role-safe, route-correct, and active-state-correct.
- At `320px` through `480px`, the links wrap or otherwise remain fully visible without horizontal
  scrolling; the mobile header may grow vertically.
- At `481px` through `1440px`, tenant links and session actions remain non-overlapping and readable.
- No page-level horizontal overflow, label clipping, focus clipping, target-size regression, or
  Agent/signed-out/wrong-role regression is introduced.
- No TypeScript, route, data, API, auth, fixture, dependency, generated, or documentation file is
  changed by the Builder.
- The Builder reports exact paths, runtime/check results, skipped evidence, and residual risks, then
  stops at `READY_FOR_VERIFICATION`; it does not commit, push, deploy, edit canonical documents, or
  dispatch another task.

### Builder handoff (2026-09-02)

- Result: `READY_FOR_VERIFICATION`.
- Actual changed path: `WebApp/Web-Right_Spot/app/globals.css` only; exactly five inserted lines in the
  existing mobile breakpoint, scoped by `data-workspace-role="tenant"`.
- Main source review: no TypeScript, route, test, fixture, API, data, auth, dependency, generated, or
  documentation path changed by the candidate. Existing unrelated Web-Game changes and owner-held
  RightSpot files remain preserved and outside this Work Order.
- Source freeze: Main committed the exact CSS candidate at local product commit `f0dbd99`; the final
  `app/globals.css` SHA-256 is
  `ef9bfc92f21eb931e56204b072fa26b89b398eb5a568c8111676487b5e2afd1e`.
- Builder checks under Node.js `v24.20.0` and npm `11.19.0`: `npm run typecheck` passed, `npm test`
  passed `6/6`, `npm run build` passed with Next.js `16.3.4`, and scoped `git diff --check` passed.
- Builder browser evidence: all `48/48` tenant route/viewport geometry combinations and `48/48`
  deterministic keyboard traversals passed across the required matrix; GET-only `My request` activation,
  request-state immutability, reduced motion, signed-out privacy, wrong-role privacy, and Agent isolation
  passed. No acceptance check was reported as skipped.
- Residual risk reported by Builder: an existing Agent layout intersection at exactly `481px`; it is
  outside this tenant-only selector and is not an `RS-WO-022` regression.
- Independent verification has not yet run. Main must not close the parent from Builder evidence alone.

### Baseline

- Git root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`
- Registration source snapshot: branch `main` at `d71c4097579a16616d46698484817999238273cd`.
  This Task's documentation registration may create a later documentation commit; Main must
  recapture the actual branch/HEAD and dirty state immediately before dispatch.
- Product source identity: the tracked tenant navigation source is clean at local product commit
  `66615d0`; `d71c409` adds the prior documentation closure record. Known unrelated Web-Game changes
  and untracked owner-held RightSpot files are outside this Work Order and must be preserved.
- Governance revision at registration: `Docs/Development/RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-RUNBOOK.md`
  plus this Task File. The dispatch snapshot must use the current file revisions after registration.
- Runtime baseline: repository `.node-version` declares `24.20.0`.
- Package root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot`
- Package/dependency permission: use the existing package and lockfile only; no install, dependency,
  package-script, or manifest change is authorized.
- Exact runtime executables: Node.js
  `/Users/alex/.local/share/rightspot/node-v24.20.0-darwin-arm64/bin/node` (`v24.20.0`) and npm
  `/Users/alex/.local/share/rightspot/node-v24.20.0-darwin-arm64/bin/npm` (`11.19.0`).
- Execution mode/worktree: serialized canonical Main Worktree; no Worktree is opened at registration.
  No other RightSpot product writer may change the shared CSS path during this checkpoint. Main owns
  source freeze, integration, and closure.
- Supporting-task identity: `01a0602e-e947-7231-bf6f-37ed685681e2` (`local`), title `RightSpot
  RS-WO-022-01 Narrow Navigation Builder`; identity and Work Order match the dispatch prompt.
- Source-freeze point: Main recaptures branch, HEAD, dirty state, and the exact CSS baseline immediately
  before dispatch; after the Builder handoff, Main freezes the resulting path before independent
  verification.

### Read before action

- `/Users/alex/OpenAI-WebMCP/AGENTS.md`
- `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/AGENTS.md`
- `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot/AGENTS.md`
- `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot/CLAUDE.md`
- `Docs/Development/RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-RUNBOOK.md`
- `Docs/00-current-status.md`
- `Docs/Tasks/README.md`
- This Task File, `RIGHTSPOT-021`, and ADR-RS-0009
- `src/ui/shared/session-nav.tsx` and the relevant `.session-nav*` rules in `app/globals.css`
- The relevant installed Next.js guide before any code change:
  `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md`

The Builder must first verify the actual Git root, package root, branch, baseline, and exact dirty
state. The Builder must use the pinned runtime and wait for Main's explicit `ASSIGNED` writeback or
dispatch confirmation before editing.

### Mutable scope

- Read set: the documents and product files listed above, the tenant route/page surfaces, current
  test/build configuration, and existing source/runtime evidence.
- Worker write set: `WebApp/Web-Right_Spot/app/globals.css`, limited to a tenant-scoped responsive
  rule for `.session-nav-links` and any directly necessary adjacent `.session-nav` layout rule at the
  existing mobile breakpoint.
- Main-thread orchestration writeback set: this Task File's Work Order status/evidence and the
  canonical current-status, task-index, and roadmap records after verification; the Builder cannot
  edit these files.
- Auxiliary process-only set: temporary browser session/profile state, command logs, and existing
  ignored `.next` or browser outputs; do not promote them to source.
- Forbidden set: every other product source, test, fixture, API, data, route, auth, dependency,
  generated, documentation, Git metadata, and Worktree-management path; no commit, push, deploy,
  publication, or nested task dispatch.
- Generated set: existing ignored `.next` and browser outputs only; preserve existing untracked
  owner-held files and do not add generated output to the Task or repository.

### Dependencies and assumptions

- `ADR-RS-0009` remains the source of truth for the `320px` floor, accessibility baseline, route
  topology, and presentation-only navigation boundary.
- `RIGHTSPOT-021` remains closed; this Task is a separate responsive repair and must not reopen or
  widen it.
- The current tenant navigation labels, hrefs, and active-state logic are correct and need no
  TypeScript change.
- CSS flex wrapping can solve the observed geometry while retaining the existing `44px` controls;
  the falsifier is any audited supported width where a link is still clipped, requires scrolling, or
  overlaps an action.
- A temporary stale served build or a signed-out fresh demo tab is runtime/setup evidence, not a
  reason to modify this source boundary. Rebuild or establish the bounded demo session through the
  documented local path before classifying a product result.

### Failure modes and stop conditions

- Stop if the tenant link is absent, its route or active-state behavior changes, or the source requires
  a TypeScript, route, API, data, auth, or fixture edit.
- Stop if any supported width still needs horizontal scrolling, clips a label or focus ring, reduces
  the `44px` target baseline, creates document overflow, or overlaps session actions.
- Stop if a shared-file ownership conflict, unexpected source drift, untracked source change, stale
  build ambiguity, or browser/tooling limitation prevents a trustworthy scoped result. Report the
  exact evidence and hand the decision back to Main; do not overwrite, revert, guess, or broaden the
  Work Order.
- Classify signed-out/demo-session reset behavior, browser invocation errors, and unrelated dirty
  files separately from product defects.

### Non-goals

- No new feature, route, API, request capability, authentication, data, workflow, design system,
  Agent navigation change, external service, WebMCP, Cloud Receiver, WebRTC, Redis, deployment, or
  production-readiness claim.
- No JavaScript focus management, menu, auto-save, navigation guard, label shortening, control-size
  reduction, or broad CSS refactor.
- No cleanup or deletion of unrelated files, Worktrees, browser artifacts, or collaborator changes.

### Verification

- Verify the exact path and source identity before and after the change; classify only the declared
  CSS path as an expected worker change.
- Run with Node.js `v24.20.0` and npm `11.19.0`: `npm run typecheck`, `npm test`, `npm run build`,
  and scoped `git diff --check`.
- Exercise authenticated tenant `/tenant`, tenant Listing Detail, `/tenant/favourites`, and
  `/tenant/requests` at CSS widths `320`, `321`, `342`, `343`, `390`, `480`, `481`, `600`, `680`,
  `760`, `768`, and `1440px`.
- Confirm all three links are initially visible and within the links container at `320–480px`,
  `scrollWidth === clientWidth` for that container, no document overflow, no action overlap, and
  visible keyboard focus with retained `44px` target dimensions.
- Confirm the Agent, signed-out, and wrong-role surfaces remain unchanged; activate `My request` and
  confirm normal GET navigation with no request mutation.
- Record browser/tooling limitations separately from product findings. Do not substitute static
  evidence for a required rendered-state claim.

### Completion report

The Builder's report must include:

- exact changed path(s) and final source identity;
- behavior implemented and the narrowest CSS rationale;
- runtime, exact commands, viewport matrix, and results;
- skipped checks and their reason;
- residual risks or first failing boundary;
- final checkpoint status; and
- the next gate for independent verification or re-scope.

### Writeback

- Worker report channel: the persistent supporting task assigned to `RS-WO-022-01`.
- Canonical Task File writeback owner: Main RightSpot thread.
- Allowed evidence-record changes: the Builder may report facts only; Main records lifecycle,
  source-freeze, verification, integration, and closure evidence in canonical documents.

## RS-WO-022-02: Independently verify narrow-viewport tenant navigation

**Parent task:** `RIGHTSPOT-022`
**Role:** `Verifier`
**Pre-dispatch status:** `GATED` (advanced to `ASSIGNED` after dispatch confirmation)
**Execution state:** `VERIFIED`
**Owner:** Persistent supporting Verifier task `01a06039-6eea-7033-aaf8-ae34c69aebe7` (`local`),
under the authority of the Main RightSpot thread
**Dispatch state:** `dispatched at main@6451e41; serialized canonical Main Worktree; frozen product
source at local product commit f0dbd99; verifier write set was empty`
**Parallelization:** `SERIAL` after `RS-WO-022-01`
**Execution profile:** `Standard` (independent static, runtime, and browser verification only)
**Integration owner/order:** Main RightSpot thread; the Verifier must not edit source or canonical
documents, and Main owns any repair, integration, and closure decision.
**Next gate:** Complete. The Verifier returned `VERIFIED` against the frozen canonical Main source at
`f0dbd99` and stopped without source or documentation changes.

### Objective

Independently determine whether the frozen `f0dbd99` candidate satisfies the exact `RIGHTSPOT-022`
acceptance matrix without changing the source, tests, fixtures, documentation, Git metadata, or
runtime authority.

### Frozen source and boundaries

- Git root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`
- Package root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot`
- Frozen branch/source: `main` at local product commit `f0dbd99`; `app/globals.css` SHA-256
  `ef9bfc92f21eb931e56204b072fa26b89b398eb5a568c8111676487b5e2afd1e`.
- The verifier reads the repository and the frozen product source. It must not switch branches,
  alter the CSS, rebuild source in a way that changes tracked files, or verify a moving candidate.
- Verifier write set: none. Temporary browser profile, logs, and existing ignored build output are
  process-only; no generated output may be promoted to source.
- Forbidden set: all product source, tests, fixtures, APIs, data, auth, dependencies, docs, Git
  metadata, Worktree management, commits, pushes, deployments, cleanup, and nested dispatch.

### Required verification

- Confirm the frozen source identity and exact one-path candidate before any behavior claim.
- Under Node.js `v24.20.0` and npm `11.19.0`, run `npm run typecheck`, `npm test`, `npm run build`,
  and scoped `git diff --check` or an equivalent clean-source check appropriate to the frozen commit.
- Exercise authenticated tenant `/tenant`, a tenant Listing Detail route, `/tenant/favourites`, and
  `/tenant/requests` at CSS widths `320`, `321`, `342`, `343`, `390`, `480`, `481`, `600`, `680`,
  `760`, `768`, and `1440px`.
- Confirm initial visibility, no links-container or document horizontal overflow, no session-action
  overlap, full labels, visible focus, and the `44px` target baseline.
- Confirm Agent, signed-out, and wrong-role boundaries; activate `My request` and prove GET-only
  navigation with no request-state mutation.
- Review console errors/warnings and reduced-motion behavior where supported. Classify tooling or
  demo-session limitations separately from product findings.

### Stop conditions and report

- Stop and return `BLOCKED` if the frozen source cannot be reproduced, the source identity changes,
  another writer alters the candidate, or the browser/runtime surface cannot support a trustworthy
  result. Report exact evidence; do not repair or broaden the scope.
- Return `NEEDS_REPAIR` only for a confirmed acceptance failure in the frozen candidate, including the
  first failing route/width, measured geometry, and the smallest repair boundary. Do not edit the fix.
- Return `VERIFIED` only when every required check passes and the exact source, command results,
  viewport matrix, role/privacy checks, activation mutation check, console review, skipped evidence,
  and residual risks are recorded. The Verifier must not claim Main integration or parent closure.

### Verifier report (2026-09-02)

- Result: `VERIFIED`; no source, documentation, Git metadata, fixture, or persisted request-state
  mutation occurred in the Verifier checkpoint.
- Source identity: Git root `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`, package root
  `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot`, branch `main`, frozen product
  commit `f0dbd99d5d0434a6aa88e8fa9dfc0b0712c75c35`, product parent
  `6090d74ab2b2f0b6e8a905f0ca92b6573b1f80ad`, and CSS SHA-256
  `ef9bfc92f21eb931e56204b072fa26b89b398eb5a568c8111676487b5e2afd1e` before and after.
- Exact candidate: only `WebApp/Web-Right_Spot/app/globals.css`, five insertions and zero deletions;
  `f0dbd99..HEAD` contained only the four canonical documentation writeback paths. Existing owner-held
  RightSpot files and unrelated Web-Game changes were preserved.
- Runtime/checks: pinned Node.js `v24.20.0`, npm `11.19.0`; `npm run typecheck`, `npm test` (`6/6`),
  `npm run build` (Next.js `16.3.4`), and candidate-scoped `git diff --check` all passed.
- Browser matrix: `/tenant`, `/tenant/listings/listing-primary`, `/tenant/favourites`, and
  `/tenant/requests` each passed all twelve required widths (`320`, `321`, `342`, `343`, `390`, `480`,
  `481`, `600`, `680`, `760`, `768`, `1440`) for `48/48` total combinations. Exact labels/hrefs and
  `aria-current` semantics, initial visibility, no container/document overflow, no action overlap,
  full labels, visible `3px` focus, and minimum `90.25 x 44px` link targets passed.
- Role/privacy and behavior: Agent navigation remained queue-only; signed-out surfaces returned `401`
  boundaries; wrong-role surfaces returned `403` and hid protected content. `My request` produced only
  document `GET /tenant/requests`; request state remained byte-identical (`fixtureGeneration 1`,
  `REQUEST_SUBMITTED`, version `2`, timeline length `2`). Reduced-motion and positive-path console
  checks passed.
- Tooling notes: two intermediate Playwright probe serialization/invocation errors were corrected and
  rerun; they produced no product finding. The Agent `481px` residual reported by the Builder is outside
  the tenant-only selector and was confirmed unchanged.
- Main closure: only the canonical Main Worktree remains; no implementation Worktree is open. The
  exact candidate is integrated at `f0dbd99`, and this Task is closed within its declared scope. No
  deployment, push, or production-readiness claim is made by this record.
