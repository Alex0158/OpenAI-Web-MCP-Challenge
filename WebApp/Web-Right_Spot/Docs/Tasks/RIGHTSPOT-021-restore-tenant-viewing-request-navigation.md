# RIGHTSPOT-021: Restore the tenant Viewing Request navigation entry

**Type:** `defect`  
**Lifecycle:** `closed`  
**Priority:** `P1` for the next demo-ready product increment  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-02  
**Depends on:** Closed `RIGHTSPOT-002` local MVP; the current tenant route contract; accepted
[ADR-RS-0009](../Decisions/ADR-RS-0009-ui-ux-visual-system-and-navigation.md); and the integrated
tenant navigation from `RIGHTSPOT-020`

## Task Control

- Type: `defect`
- Lifecycle: `closed`
- Priority: `P1`
- Owner: Main RightSpot thread
- Current increment: Restore one persistent, role-safe tenant navigation entry to the existing
  Viewing Request dashboard without changing the request workflow or adding new business state.
- Next gate: The bounded implementation, verification, and local Git closure gates are complete at
  product commit `66615d0`. Main selected the already accepted `320px` floor and registered the
  separate bounded responsive repair `RIGHTSPOT-022`; no repair is authorized under this closed Task.
- Dependencies: The existing `/tenant/requests` route, tenant role-page frame, shared navigation
  contract, and current local session/API boundaries remain authoritative.
- Execution posture: `CLOSED`
- Post-closure audit: `DONE_WITH_CONCERNS` (2026-09-02 Main-thread browser audit); source identity
  remains unchanged since the Verifier handoff.
- Affected surface: Authenticated tenant shared navigation and its responsive presentation only;
  no request state, data, or server contract is owned by this task.

## Verified problem

The tenant Viewing Request dashboard exists at `/tenant/requests` and is a required MVP management
surface, but the tenant branch of the shared navigation currently exposes only `Browse rentals` and
`Favourites`. A tenant can reach the request dashboard from Listing Detail only in selected request
states, or by directly knowing the URL. The Discovery and Favourites surfaces do not provide a
persistent request-workspace entry.

This creates a recoverability and discoverability defect after the tenant saves or submits a request:

1. The tenant enters `/tenant` and opens a Listing Detail page.
2. The tenant creates, saves, or submits the inline Viewing Request.
3. The tenant leaves the Listing Detail page.
4. The tenant has no stable tenant-workspace navigation item for returning to the current request.

The route and its server/API behavior are already present. This is a navigation defect, not a missing
Viewing Request backend capability and not an Information Request implementation request.

## Current evidence

- `src/ui/shared/session-nav.tsx` contains the tenant workspace links for `/tenant` and
  `/tenant/favourites`, but no `/tenant/requests` link.
- `app/tenant/requests/page.tsx` and `src/ui/tenant/tenant-request-page.tsx` provide the existing
  request dashboard, including the no-active-request path back to `/tenant` and the current request's
  link back to its listing.
- `src/ui/tenant/tenant-listing-page.tsx` exposes `Open request dashboard` only for request-state
  branches where a request already exists or targets another listing; the new-request draft/editor
  path does not create a universal workspace entry.
- `src/ui/tenant/tenant-favourites-page.tsx` has a valid Favourites-to-listing path and an empty-state
  return to Discovery, but no request-workspace entry.
- The accepted route topology in ADR-RS-0009 includes `/tenant/requests` as the tenant request
  workspace and permits a tenant `My request` navigation item.
- A fresh isolated browser session with a valid tenant demo session reached
  `http://127.0.0.1:3100/tenant/requests` and rendered the request dashboard, while its primary
  navigation still contained only `Browse rentals` and `Favourites`; neither was current for the
  request route.
- A read-only layout probe temporarily inserted a representative `My request` link into the current
  browser DOM and removed it immediately. At `600px` wide, the third link extended into the session
  actions area; at `680px`, it overlapped the actions by about `20px`, while the existing
  `481–760px` layout has no horizontal-scroll protection. This is a responsive consequence of the
  proposed navigation change, not a product-source mutation.
- The repository currently has no dedicated `SessionNav` UI test. Verification must therefore rely on
  exact source review, existing checks, and browser/layout evidence unless a no-dependency focused test
  is explicitly declared in the Work Order.

## Bounded objective

Add one persistent `My request` link to the authenticated tenant navigation, pointing to
`/tenant/requests`, with correct active-state semantics. Preserve a usable responsive navigation at
all supported viewport widths, including the `481–760px` range exposed by the current CSS. The change
must make the existing dashboard reachable from every successfully rendered tenant-owned page while
preserving the current route, session, role, workflow, and API authorities.

## Candidate implementation boundary

The implementation should be limited to:

- `src/ui/shared/session-nav.tsx`
- `app/globals.css`, limited to the `.session-nav`, `.session-nav-links`, and
  `.session-nav-actions` responsive rules needed to prevent the added link from overlapping or being
  clipped

There is no existing dedicated navigation test. A new test file, test dependency, or test harness is
not part of this task by default; if a no-dependency focused test is genuinely necessary, the Work
Order must name its exact path before dispatch.

This is a serialized shared-navigation write set. The main thread owns source baseline, integration,
canonical documentation, and closure; a Builder, if dispatched, may not modify this Task File or any
other canonical document.

## Required behavior

1. After the server resolves a valid tenant session, the exact label `My request` is rendered in the
   shared navigation and points to `/tenant/requests` on `/tenant`, any tenant Listing Detail route,
   `/tenant/favourites`, and `/tenant/requests` itself.
2. Exactly one relevant workspace link is current on each tenant route: Browse rentals on `/tenant`
   and Listing Detail, Favourites on `/tenant/favourites`, and My request on `/tenant/requests`. The
   root brand link is current only on `/`.
3. The link is not rendered for agents, signed-out users, or a wrong-role session; Agent navigation
   remains unchanged.
4. At the supported responsive widths, the new link and session actions remain reachable, readable,
   non-overlapping, and not clipped. In particular, the `481–760px` range must not rely on accidental
   flex overflow; at or below `480px`, any existing horizontal navigation behavior must remain
   keyboard reachable and must not create page-level horizontal overflow.
5. The navigation remains a presentation layer: it must not fetch request state, create a status
   badge, own workflow transitions, or introduce a new request/listing contract.
6. Clicking the new link never silently saves, submits, or mutates an unsaved inline Viewing Request
   draft; existing explicit save/submit semantics remain unchanged.
7. Existing Listing Detail contextual links, Favourites behavior, role gating, sign-out, loading, and
   bounded error states remain intact.

## Non-goals

- Do not change `/tenant/requests`, request APIs, DTOs, persistence, workflow states, or fixture data.
- Do not add a second request, request history, notifications, chat, Information Request, or contact
  preference capability.
- Do not add a request-status badge or make shared navigation a workflow-state owner.
- Do not add an unsaved-draft guard, auto-save behavior, confirmation dialog, or navigation state
  persistence as part of this link repair.
- Do not redesign the visual system or alter Agent navigation.
- Do not introduce authentication providers, WebMCP, Cloud Receiver, WebRTC, Redis, deployment, or
  external communication.

## Verification and closure gate

The implementation Work Order must return `READY_FOR_VERIFICATION` with the exact changed paths and
must not claim independent verification. Independent verification must confirm the tenant link, exact
label, and one-link-only active state on the tenant Discovery, Listing Detail, Favourites, and request
pages; confirm that the Agent navigation is unchanged; exercise signed-out/wrong-role protection;
check the responsive layout at representative widths including `390px`, `480px`, `600px`, `680px`,
`768px`, and `1440px`; and run the applicable typecheck, existing focused/full tests, production build,
and diff checks. Browser evidence should confirm that the link reaches the existing request dashboard,
remains keyboard reachable, does not overlap or create page-level horizontal overflow, and introduces
no browser console errors or workflow mutations.

The main thread may close this task only after exact-path review, independent verification, and
integration into the canonical Main Worktree. `RS-WO-021-02` returned `VERIFIED`, Main completed the
final exact-path/hash readback, and the parent Task is now closed. The accepted source change was
subsequently committed locally at product commit `66615d0`; no push or deployment claim is made.

## Reopen condition

Reopen or replace this task if the request dashboard becomes a multi-request/history surface, if the
route topology changes, if navigation must display workflow state, or if the fix requires a shared
API, authentication, domain, persistence, or product-scope decision. Those changes require a new
bounded decision or implementation boundary rather than expanding this repair.

## RS-WO-021-01: Implement the tenant Viewing Request navigation entry

**Parent task:** `RIGHTSPOT-021`  
**Role:** `Builder`  
**Pre-dispatch status:** `GATED` (advanced to `ASSIGNED` after dispatch acknowledgement)  
**Execution state:** `INTEGRATED`  
**Current status:** `INTEGRATED`  
**Owner:** Persistent supporting Builder task `01a05fea-9a55-7621-a4e3-cdd726e614e0`, under the
authority of the Main RightSpot thread  
**Dispatch state:** `dispatched at main@bd3d92aec10da38392845832694b4365f81387a5; shared canonical
Main Worktree; worker paths clean at dispatch`  
**Next gate:** Closed after `RS-WO-021-02` independently returned `VERIFIED`; the exact two-file
source remains in the canonical Main Worktree and was later committed locally at product commit
`66615d0`.  
**Parent execution posture if blocked:** `PROGRESSING`  
**Blocker report:** The initial supporting turn completed before the post-acknowledgement status
writeback was visible and correctly made no source changes, returning `BLOCKED` on the procedural gate.
That gate was resolved by resuming the same task identity. The Builder then completed the bounded
change and returned `READY_FOR_VERIFICATION`; no product blocker remains. Any new path, runtime,
source-drift, ownership, or acceptance ambiguity must still be reported with evidence and a safe
continuation; it must not be solved by widening this Work Order.

### Objective

Implement the exact `My request` entry in the authenticated tenant shared navigation so that a tenant
can consistently reach the existing `/tenant/requests` dashboard from every tenant-owned page while
preserving role boundaries, active-state semantics, responsive reachability, and all existing request
workflow behavior.

### Acceptance criteria

- `src/ui/shared/session-nav.tsx` renders exactly one tenant-only link with the exact label `My request`
  and `href="/tenant/requests"` whenever the resolved actor role is `tenant`.
- The active-state matrix is exact: `Browse rentals` is current on `/tenant` and any
  `/tenant/listings/:id`; `Favourites` is current only on `/tenant/favourites`; `My request` is
  current only on `/tenant/requests`; the brand is current only on `/`.
- The new link is absent for signed-out and wrong-role sessions, and the Agent navigation and its
  active-state behavior are unchanged.
- The navigation remains presentation-only: no request fetch, status badge, workflow transition,
  draft persistence, auto-save, submit, confirmation guard, API/DTO, or data change is introduced.
- At viewport widths `390px`, `480px`, `600px`, `680px`, `768px`, and `1440px`, the link and session
  actions remain readable, keyboard reachable, non-overlapping, and not clipped; no page-level
  horizontal overflow is introduced. Existing intentional horizontal navigation behavior at or below
  `480px` must remain keyboard reachable.
- Only the declared worker write set changes. The Builder reports exact paths and stops at
  `READY_FOR_VERIFICATION`; it does not claim independent verification, edit canonical documents,
  commit, push, deploy, or dispatch another task.

### Baseline

- Git root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`
- Branch and HEAD: `main` at `bd3d92aec10da38392845832694b4365f81387a5`
- Execution source identity and dirty/untracked limitation: the two product write paths are clean at
  dispatch. The repository also contains unrelated modified/untracked Game work and RightSpot
  governance/documentation work owned by other activity; preserve it, do not stage it, and do not
  treat its content as product source drift. The canonical Work Order itself is untracked and is a
  read-only dispatch input for the Builder.
- Governance revision: `Docs/Development/RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-RUNBOOK.md` at the
  dispatch snapshot, with this Work Order as the scoped implementation authority.
- Runtime baseline: `.node-version` at
  `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/.node-version` declares `24.20.0`.
- Package root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot`.
- Exact runtime executables: Node.js
  `/Users/alex/.local/share/rightspot/node-v24.20.0-darwin-arm64/bin/node` (`v24.20.0`) and npm
  `/Users/alex/.local/share/rightspot/node-v24.20.0-darwin-arm64/bin/npm` (`11.19.0`).
- Execution mode/worktree: `shared canonical Main Worktree`, serialized. No other RightSpot product
  writer may modify either worker path during this checkpoint. This is deliberately not a detached
  Worktree because the write set is a small shared-navigation seam, the current RightSpot supporting
  worker count is zero, and timely canonical integration is the objective.
- Supporting-task identity: `01a05fea-9a55-7621-a4e3-cdd726e614e0` (`local`); title
  `RightSpot RS-WO-021-01 Tenant Navigation Builder`; identity matched before the post-acknowledgement
  writeback.

### Read before action

- `/Users/alex/OpenAI-WebMCP/AGENTS.md`
- `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/AGENTS.md`
- `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot/AGENTS.md`
- `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot/CLAUDE.md`
- `Docs/Development/RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-RUNBOOK.md`
- `Docs/00-current-status.md`
- `Docs/Tasks/README.md`
- This Task File and `Docs/Decisions/ADR-RS-0009-ui-ux-visual-system-and-navigation.md`
- `src/ui/shared/session-nav.tsx`, `src/ui/shared/role-page-frame.tsx`, the four tenant route/page
  surfaces, and the relevant `.session-nav*` rules in `app/globals.css`
- The relevant installed Next.js guide before code changes:
  `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md`

The Builder must first verify the declared Git root and package root, use the exact runtime
executables for all package commands, and wait for the main thread's `ASSIGNED` writeback or explicit
confirmation before editing.

### Mutable scope

- Read set: the documents and product files listed above, existing route/session contracts, and
  existing test/build configuration.
- Worker write set: `src/ui/shared/session-nav.tsx`; `app/globals.css`, limited to the
  `.session-nav`, `.session-nav-links`, and `.session-nav-actions` rules necessary for the added
  link's responsive behavior.
- Main-thread orchestration writeback set: this Task File's Work Order status, supporting identity,
  completion evidence, and later independent-verification/closure records; relevant current-status,
  roadmap, and task-index summaries only after evidence exists.
- Auxiliary process-only set: temporary browser probe/session artifacts, local process output, and
  ignored build output such as `.next`; do not add them to the repository.
- Forbidden set and actions: every other product source path; all API, persistence, fixtures, auth,
  domain, workflow, Information Request, Agent navigation, visual-system redesign, dependency,
  WebMCP, Cloud Receiver, WebRTC, Redis, deployment, external communication, canonical-document
  edits, Git staging/commit/push, destructive cleanup, and dispatching another worker.
- Generated set: `.next` and other existing ignored build artifacts only; generated output is not
  source identity and must not be reported as a product change.

### Dependencies and assumptions

- `/tenant/requests` already renders and remains the authoritative request dashboard; if its route,
  session, or API contract is absent or different, stop and report a dependency blocker.
- `SessionNav` receives the server-resolved actor and current path through the existing role frame;
  the Builder must not add client-side session state or request-state reads.
- The existing repository has no dedicated `SessionNav` UI test. Do not add a test dependency or
  harness by default. A focused no-dependency test is allowed only if its exact path is first reported
  to and accepted by the main thread.
- The responsive CSS probe already falsified the assumption that a third link fits unchanged at
  `600px` and `680px`; leaving the existing `481–760px` flex arrangement untouched is therefore an
  acceptance risk, not a reason to widen the task.
- If an existing unowned change appears in either worker path, or a required canonical input changes
  during execution, stop for main-thread re-baselining rather than overwriting or guessing.

### Non-goals

- No new route or request capability; no request history, second request, notifications, chat,
  Information Request, contact preference, or status badge.
- No authentication provider, WebMCP, Cloud Receiver, WebRTC, Redis, deployment, or external action.
- No broad UI/UX redesign, typography/color change, Agent navigation change, navigation state
  persistence, unsaved-draft guard, auto-save, submit behavior, or workflow mutation.
- No independent verification, canonical documentation reconciliation, Git commit/push, or follow-up
  task dispatch.

### Verification

Use the exact Node.js and npm paths from the Baseline and run from the package root:

- `npm run typecheck`
- `npm test` (the existing foundation suite)
- `npm run build`
- `git diff --check` from the Git root and an exact changed-path review
- Static/source checks confirming the exact tenant link, active-state matrix, role privacy, and no
  request-state/API import in the navigation layer
- Browser checks against the existing local app at
  `http://127.0.0.1:3100/tenant`, a representative tenant Listing Detail route,
  `/tenant/favourites`, `/tenant/requests`, `/agent`, and a signed-out/wrong-role state, at widths
  `390`, `480`, `600`, `680`, `768`, and `1440` where practical. Confirm keyboard reachability,
  no overlap/clipping/page-level horizontal overflow, no console errors, and no request mutation.

These are Builder self-checks only. Independent verification is a separate next checkpoint against a
frozen post-Builder source state.

### Completion report

The supporting Builder must report in its task thread:

- exact changed paths and a concise diff summary;
- the active-state and role-privacy behavior implemented;
- responsive behavior and any viewport limitations observed;
- exact commands, exact runtime versions, browser routes/widths, and results;
- skipped checks and reasons;
- residual risks or blockers; and
- final status exactly one of `READY_FOR_VERIFICATION`, `NEEDS_REPAIR`, or `BLOCKED`.

### Builder handoff evidence

- Final status: `READY_FOR_VERIFICATION`.
- Exact changed paths: `src/ui/shared/session-nav.tsx` and `app/globals.css` only; no other tracked
  RightSpot product source path changed.
- Diff summary: 28 insertions and 1 deletion. The tenant branch now contains exactly one `My request`
  link to `/tenant/requests`; the navigation carries a role data attribute so only tenant navigation
  receives the bounded `481–820px` two-row responsive rule. Agent navigation remains structurally
  unchanged.
- Post-Builder source identity: Main `HEAD` remains
  `bd3d92aec10da38392845832694b4365f81387a5`; `app/globals.css` SHA-256 is
  `0157d081db18105e961786f38b48e1a69f003b5f7b1e54072fc748ce01ada84d`;
  `src/ui/shared/session-nav.tsx` SHA-256 is
  `144242d61a33b1c12aea195d86c4856696a6647ca324b87b0662d56aee0b4563`; the two-file binary diff
  SHA-256 is `382aa8a95103d65da522c65f33837ac87d0c796468755aaed928049a6ff0815a`.
- Runtime and command evidence: Node `v24.20.0`, npm `11.19.0`; `npm run typecheck`, `npm test`
  (`6/6`), `npm run build`, and scoped `git diff --check` passed.
- Browser evidence: 24 tenant route/width checks passed across `/tenant`, representative Listing
  Detail, `/tenant/favourites`, and `/tenant/requests` at `390`, `480`, `600`, `680`, `768`, and
  `1440` pixels; keyboard reached `My request` at every width; Agent layout and signed-out/wrong-role
  privacy passed; authenticated tenant navigation produced no console errors and only GET request
  traffic; no workflow mutation occurred.
- Residual evidence: the existing wrong-role `/tenant/requests` path emits its pre-existing `403
  /api/tenant/request` console entry before role-frame hiding; the first browser launch left the
  untracked `.playwright-cli/page-2026-09-02T02-26-22-534Z.yml` auxiliary artifact. Neither is a
  product source change, and neither is being silently removed in this checkpoint.
- Independent verification: completed by `RS-WO-021-02`; the Main thread performed the final
  post-verification exact-path and hash readback before closure.

### Writeback

- Worker report channel: the persistent supporting Builder task/thread assigned by the main thread.
- Canonical Task File writeback owner: Main RightSpot thread only.
- Allowed evidence-record changes: Main may record the supporting identity, exact changed paths,
  self-check evidence, and next verifier gate; the Builder must not edit this Task File or any other
  canonical document.
- Return control condition: after the Builder's final report, the main thread freezes the changed
  source, reviews the exact diff, and either dispatches an independent Verifier or records a bounded
  repair decision. The Builder must stop and wait at `READY_FOR_VERIFICATION`.

## RS-WO-021-02: Independently verify the tenant Viewing Request navigation entry

**Parent task:** `RIGHTSPOT-021`  
**Role:** `Verifier`  
**Pre-dispatch status:** `ASSIGNED` (original gate `GATED`; advanced after dispatch acknowledgement)  
**Execution state:** `VERIFIED`  
**Current status:** `VERIFIED`  
**Owner:** Persistent supporting Verifier task `01a05ff5-ccf1-75c3-b873-5b39f0e3e28f`, under the
authority of the Main RightSpot thread  
**Dispatch state:** `dispatched at main@bd3d92aec10da38392845832694b4365f81387a5; frozen two-file
source snapshot; verifier write set empty`  
**Next gate:** Closed after the Verifier independently checked the frozen source and returned
`VERIFIED`; Main completed the final exact-path/hash readback.  
**Parent execution posture if blocked:** `CONSTRAINED`  
**Blocker report:** None. Two browser listener probes failed as tooling invocation incidents and were
replaced by stable snapshot/ref-click and request-ledger checks; no product defect or source drift was
found.

### Objective

Independently determine whether the frozen `RS-WO-021-01` source satisfies the exact tenant navigation,
role-privacy, active-state, responsive-layout, keyboard-reachability, and no-workflow-mutation
acceptance criteria, while confirming that the Builder changed only its declared two-file write set.

### Acceptance criteria

- The frozen source identity matches Main `HEAD` `bd3d92aec10da38392845832694b4365f81387a5` plus the
  recorded dirty two-file snapshot; the two product paths remain byte-identical throughout verification
  and no additional product path changes.
- A valid tenant sees exactly one `My request` link to `/tenant/requests` on `/tenant`, a representative
  tenant Listing Detail route, `/tenant/favourites`, and `/tenant/requests` itself.
- The active-state matrix is exact: Browse rentals current on Discovery and Listing Detail, Favourites
  current only on Favourites, My request current only on the request dashboard, and the brand current
  only on `/`.
- Signed-out and wrong-role sessions do not receive the tenant request link; Agent navigation remains
  unchanged.
- At `390px`, `480px`, `600px`, `680px`, `768px`, and `1440px`, the navigation is readable, keyboard
  reachable, non-overlapping, not clipped, and does not create page-level horizontal overflow; the
  intentional small-screen horizontal navigation remains reachable.
- Clicking `My request` reaches the existing dashboard, produces no POST/PUT/PATCH/DELETE request and
  no request-state mutation, and introduces no new console error. Existing expected auth/role response
  noise must be distinguished from a regression and reported rather than hidden.
- Typecheck, existing tests, production build, diff checks, and exact-path review pass under the pinned
  runtime, or every skipped check is explicitly recorded with reason.
- The Verifier does not edit source, canonical docs, package files, Git state, generated tracked files,
  or persisted demo state, and does not claim Builder self-checks as independent evidence.

### Baseline

- Git root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`
- Branch and HEAD: `main` at `bd3d92aec10da38392845832694b4365f81387a5`
- Frozen product source: `app/globals.css` SHA-256
  `0157d081db18105e961786f38b48e1a69f003b5f7b1e54072fc748ce01ada84d`;
  `src/ui/shared/session-nav.tsx` SHA-256
  `144242d61a33b1c12aea195d86c4856696a6647ca324b87b0662d56aee0b4563`; the two-file binary diff
  SHA-256 is `382aa8a95103d65da522c65f33837ac87d0c796468755aaed928049a6ff0815a`.
- Dirty-state limitation: unrelated Game and RightSpot documentation changes are present in the
  repository. The Builder's two product paths are the only expected product changes. The untracked
  `.playwright-cli/page-2026-09-02T02-26-22-534Z.yml` is an auxiliary browser artifact; preserve it and
  do not count it as product source.
- Governance revision: the current `RIGHTSPOT-021` Task File and
  `Docs/Development/RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-RUNBOOK.md`.
- Package root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot`.
- Runtime pin: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/.node-version`, expected `24.20.0`.
- Exact runtime executables: Node.js
  `/Users/alex/.local/share/rightspot/node-v24.20.0-darwin-arm64/bin/node` (`v24.20.0`) and npm
  `/Users/alex/.local/share/rightspot/node-v24.20.0-darwin-arm64/bin/npm` (`11.19.0`).
- Execution mode/worktree: `shared canonical Main Worktree`, source-frozen and read-only for this
  checkpoint. Main must not edit either product path until verification returns.
- Supporting-task identity: `01a05ff5-ccf1-75c3-b873-5b39f0e3e28f` (`local`); title
  `RightSpot RS-WO-021-02 Navigation Verifier`; identity matched before the post-acknowledgement
  writeback.

### Read before action

- `/Users/alex/OpenAI-WebMCP/AGENTS.md`
- `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/AGENTS.md`
- `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot/AGENTS.md`
- `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot/CLAUDE.md`
- `Docs/Development/RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-RUNBOOK.md`
- `Docs/00-current-status.md`, `Docs/Tasks/README.md`, this Task File, and
  `Docs/Decisions/ADR-RS-0009-ui-ux-visual-system-and-navigation.md`
- The Builder's exact source diff and `RS-WO-021-01` handoff evidence above
- The relevant installed Next.js Link guide at
  `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md`

### Mutable scope

- Read set: the declared authority documents, frozen two-file source, role frame and tenant/Agent
  route surfaces, existing test/build configuration, and live local app responses.
- Worker write set: none. This is an independent read-only verification checkpoint.
- Main-thread orchestration writeback set: this Task File's verifier identity, evidence, status, and
  closure decision; relevant current-status/roadmap/task-index summaries only after evidence exists.
- Auxiliary process-only set: temporary browser profiles/sessions, logs, and existing ignored build
  output such as `.next`; preserve untracked artifacts and do not add them to the repository.
- Forbidden set and actions: all source, docs, package, lockfile, fixture, database, auth, API, Git,
  deployment, external communication, destructive cleanup, source reset/rebase, and any mutation of
  persisted demo state. Do not dispatch another worker.
- Generated set: existing ignored build/browser outputs only; they are not source changes.

### Dependencies and assumptions

- The Builder handoff is complete and the two-file source snapshot is frozen. If either hash changes,
  stop immediately and report `BLOCKED` for source drift; do not verify a moving target.
- The local RightSpot server may be rebuilt or restarted only as a process operation needed to serve
  the frozen source, without resetting the database or changing request state. If a separate port is
  needed, record it as evidence.
- `/tenant/requests` remains the existing request dashboard, and a valid tenant/agent session can be
  established through the current local demo boundary without introducing credentials or new auth.
- The existing no-dedicated-SessionNav-test limitation remains; do not add a test harness or dependency.

### Non-goals

- No repair, redesign, new feature, authentication, API/data/workflow change, Information Request,
  Agent-navigation change, WebMCP, Cloud Receiver, WebRTC, Redis, deployment, or Git commit.
- No source cleanup, favicon fix, or attempt to remove the known auxiliary `.playwright-cli` artifact.

### Verification

Use the exact runtime executables from the Baseline and run package commands from the package root:

- verify Git root, package files, runtime versions, exact product-path status, and both frozen hashes;
- run `npm run typecheck`, `npm test`, `npm run build`, and scoped `git diff --check`;
- statically inspect the exact link, active-state matrix, role privacy, data-role CSS boundary, and no
  request-state/API import in `SessionNav`;
- use fresh browser sessions against the local app for `/`, `/tenant`, a tenant Listing Detail route,
  `/tenant/favourites`, `/tenant/requests`, `/agent`, and signed-out/wrong-role states;
- exercise widths `390`, `480`, `600`, `680`, `768`, and `1440`, keyboard traversal, link activation,
  page-level overflow/overlap/clipping, console capture, and request-method capture;
- after all checks, re-run the two file hashes and exact-path status. Any changed hash or unexpected
  product path is a hard blocker, not a pass.

### Completion report

The persistent Verifier must report in its task thread:

- exact frozen-source identity and exact-path result;
- each acceptance criterion result with route/width/browser evidence;
- exact commands, runtime versions, and results;
- expected residual auth/role noise versus new regressions;
- skipped checks and reasons;
- any blocker or repair recommendation; and
- exactly one final status: `VERIFIED`, `NEEDS_REPAIR`, or `BLOCKED`.

### Writeback

- Worker report channel: the persistent supporting Verifier task/thread assigned by Main.
- Canonical Task File writeback owner: Main RightSpot thread only.
- The Verifier must not edit this Task File or any canonical document.
- Return control condition: after the final Verifier report, Main reviews the evidence and either
  records `VERIFIED` and closes the parent, opens a bounded repair Work Order, or records a genuine
  process/source blocker. No close decision is implied by dispatch alone.

### Verifier handoff evidence

- Final status: `VERIFIED`.
- Source identity: `main` at `bd3d92aec10da38392845832694b4365f81387a5`; the frozen file hashes and
  two-file diff hash matched before and after verification:
  `app/globals.css` `0157d081db18105e961786f38b48e1a69f003b5f7b1e54072fc748ce01ada84d`,
  `src/ui/shared/session-nav.tsx`
  `144242d61a33b1c12aea195d86c4856696a6647ca324b87b0662d56aee0b4563`, and binary diff
  `382aa8a95103d65da522c65f33837ac87d0c796468755aaed928049a6ff0815a`.
- Exact-path result: only `app/globals.css` and `src/ui/shared/session-nav.tsx` are modified in the
  RightSpot product/config scope. Unrelated documentation changes and the known untracked
  `.playwright-cli/page-2026-09-02T02-26-22-534Z.yml` auxiliary artifact were preserved.
- Static and runtime result: exact tenant link/active matrix, tenant-only privacy, unchanged Agent
  navigation, and presentation-only boundary passed. Node `v24.20.0`, npm `11.19.0`; typecheck,
  foundation tests `6/6`, production build under Next.js `16.3.4`, and scoped diff check passed.
- Browser result: `/tenant`, Listing Detail, `/tenant/favourites`, and `/tenant/requests` passed at
  `390`, `480`, `600`, `680`, `768`, and `1440px` (`24` route-width checks). No overlap, clipping,
  page-level horizontal overflow, or authenticated tenant console errors; keyboard focus reached the
  link at all widths. Agent, signed-out, and wrong-role privacy checks passed. Link activation reached
  the existing dashboard with GET-only navigation traffic; request state remained fixture generation
  `1`, `REQUEST_SUBMITTED` version `2`, timeline length `2`.
- Expected residuals: existing signed-out `401` session/API responses, wrong-role `403
  /api/tenant/request`, and signed-out root `404 /favicon.ico`; two experimental browser listener
  invocations closed their own sessions. These were recorded as environment/tooling evidence, not
  product regressions.
- At the Verifier handoff, no repair was recommended for the declared `390px+` matrix. No
  source/doc/package/database/Git state was mutated by verification; no commit, push, deployment,
  or new test harness was performed.

### Post-closure Main-thread audit (2026-09-02)

- Audit status: `DONE_WITH_CONCERNS`. Main repeated the tenant route/viewport matrix against the
  current canonical source after the Verifier handoff. The audit did not mutate product source,
  documentation, package state, database state, or Git state.
- Source identity: the exact two product paths, their SHA-256 hashes, and the two-path diff remained
  unchanged from the Verifier handoff. Node `v24.20.0`, npm `11.19.0`, the local server, typecheck,
  foundation tests `6/6`, production build, and scoped diff checks remained healthy.
- Browser coverage: authenticated tenant routes `/tenant`, Listing Detail,
  `/tenant/favourites`, and `/tenant/requests` were checked at `320`, `321`, `342`, `343`, `390`,
  `480`, `481`, `600`, `760`, `761`, `820`, `821`, and `1440px`. At `343px` and above, the link
  visibility, active-state matrix, overlap, page overflow, keyboard reachability, and console
  checks passed. Agent, wrong-role, signed-out, and Listing Detail activation checks also passed;
  activation remained GET-only and did not mutate request state.
- Finding (`P2`, responsive affordance): at `320–342px`, the tenant navigation links container is
  horizontally scrollable and the third `My request` link is partially outside the initial visible
  area. Manual horizontal scrolling reveals it, but keyboard tabbing does not automatically reveal
  the clipped link. This is a discoverability/accessibility residual, not a route, role-privacy, or
  request-workflow failure.
- Scope interpretation: the previous `RS-WO-021-02` `VERIFIED` result remains valid for its
  declared `390px+` browser matrix. Main selected `320px` as the supported floor and registered
  `RIGHTSPOT-022`; all supported mobile widths remain unproven until that separate repair is verified.
- Follow-up gate: Main selected `320px` as the supported viewport floor and registered
  `RIGHTSPOT-022` with an explicit acceptance test for initial visibility and keyboard reachability.
  No source repair is included in this closed Task; the new Task owns the responsive change and its
  independent verification.
- Git state: the verified two-path product change is committed in the canonical Main Worktree at
  local product commit `66615d0`; this action did not push or deploy it. The support-floor decision
  is resolved by the separate pending/gated `RIGHTSPOT-022`; no responsive repair is included in
  this commit.
