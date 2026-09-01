# RIGHTSPOT-007: Implement the accepted Field Desk visual foundation

**Type:** `implementation`  
**Lifecycle:** `in_progress`  
**Priority:** `P1` for the next demo-ready product increment  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-01  
**Depends on:** ADR-RS-0009; stable role/session route boundaries; no external authentication decision

## Task Control

- Type: `implementation`
- Lifecycle: `in_progress`
- Priority: `P1`
- Owner: Main RightSpot thread
- Objective: Turn the accepted RightSpot Field Desk visual direction into a small, implementable
  shared UI foundation without expanding the rental MVP or changing product authority.
- Current increment: The single-file shared CSS foundation is independently verified and integrated
  at product commit `89a50c7`; the tenant and agent role candidates were independently verified and
  integrated at product commits `5abdaf3` and `a2f6a19` from frozen candidates `63e4c3e` and `33a36f0`.
- Next gate: Freeze the combined integrated source and run an independent cross-role regression check
  covering the shared Field Desk foundation plus tenant and agent surfaces before closing this task.
- Execution posture: `PARALLEL_ROLE_CANDIDATES_INTEGRATED`; the disjoint Builder and Verifier lanes are
  closed, the main thread owns the combined regression gate, and Operations seam work remains separate.

## Accepted product boundary

ADR-RS-0009 defines the intended direction as **RightSpot Field Desk**: a calm, credible rental
marketplace plus practical agent desk. It uses warm paper/off-white surfaces, deep evergreen,
restrained terracotta accents, a system sans with a local serif fallback, restrained radius/shadow/
motion, synthetic daylight imagery, and clear human workflow affordances. It is not a generic AI
dashboard, glassmorphism surface, luxury brochure, or Rightmove clone.

The implementation must preserve the existing MVP routes and contracts:

- `/`, `/tenant`, `/tenant/listings/:listingId`, `/tenant/requests`;
- `/agent`, `/agent/requests/:requestId`;
- existing server-resolved session roles, role-safe DTOs, listing reads, and Viewing Request actions.

This task does not authorize Clerk/Auth0 setup, new dependencies, WebMCP, Cloud Receiver, WebRTC,
Redis, real property data, buying/mortgage flows, maps, alerts, live chat, payments, deployment, or
any change to API/domain/persistence authority.

## Why this task is bounded

The previous UI/UX Work Order (`RIGHTSPOT-003`) was a read-only decision task and is closed after
ADR-RS-0009 acceptance. This task begins implementation planning from that decision; it does not
reopen the MVP or treat every future screen as current scope. The first implementation target is the
shared visual foundation. Tenant and agent page slices may become parallel candidates only after
their route, component, CSS, test, and integration ownership is explicit.

## RS-WO-007-01 — Decompose the Field Desk implementation boundary

**Role:** Architecture/UI Advisor  
**Status:** `ACCEPTED_WITH_REVISIONS`  
**Parallelization:** `READ_ONLY_ADVISORY` — may run beside independent verification; it must not edit
  the frozen navigation candidate or any authored source.  
**Risk profile:** `Standard` — bounded implementation decomposition with no behavior mutation.  
**Supporting task:** `01a05d5f-cb85-7cf3-96b4-edf0f5891b6d` on host `local`.  
**Source baseline:** The main thread's current RightSpot working tree; the Advisor must capture its
  observed commit, dirty paths, and candidate hash limitations before making recommendations.

### Required read set

- Repository/workspace instructions and RightSpot `RUNBOOK.md`.
- `Docs/00-current-status.md`, `Docs/03-system-design.md`, `Docs/06-validation-and-evidence.md`.
- ADR-RS-0001 through ADR-RS-0010, especially ADR-RS-0003, ADR-RS-0004, ADR-RS-0008, and ADR-RS-0009.
- Existing UI source under `app/`, `src/ui/shared/`, `src/ui/tenant/`, and `src/ui/agent/`.
- Existing tests, package scripts, current route structure, and the registered `RIGHTSPOT-005`
  navigation candidate.

### Advisor output boundary

The Advisor must return a proposal only. It may not modify source, CSS, tests, package metadata,
environment files, database/fixtures, generated output, canonical documents, or Git metadata.
The proposal must include:

1. exact shared-foundation paths and ownership (for example global tokens, shared shell/navigation,
   primitives, and local assets);
2. exact tenant and agent route/component/CSS/test write sets, with shared-file conflicts called out;
3. a dependency graph identifying what can run in parallel and what must be serialized;
4. behavior-preserving visual acceptance criteria for desktop/mobile, accessibility, loading,
   empty/error states, and the primary tenant-to-agent demo path;
5. an asset strategy that does not introduce an external runtime or remote-image dependency;
6. test and browser evidence requirements, including what cannot be claimed from static review; and
7. a recommended next Work Order sequence with explicit non-goals and stop conditions.

The Advisor must distinguish verified current facts, inference, recommendation, and unresolved
decision. It must not silently choose a new product feature or claim that a page is safe to
parallelize merely because it has a different URL.

### Return gate

Return `READY_FOR_REVIEW` with the observed source identity, exact ownership map, proposed Work Order
boundaries, dependency classification, acceptance/evidence plan, and unresolved risks. Return
`BLOCKED` if the current source or accepted ADRs do not permit a reliable decomposition. Do not
dispatch follow-on Builders; the main thread owns acceptance and subsequent dispatch.

### Main-thread review disposition

`RS-WO-007-01` is accepted with revisions. The proposal's route/component map, shared-file conflict
analysis, and serial-foundation-then-parallel-role sequence are adopted. The main thread retains
these constraints:

- no visual Builder may modify `src/ui/shared/app-shell.tsx` while `RS-WO-005-01` is unresolved;
- the first implementation Builder may modify only `app/globals.css`; no new shared DOM, dependency,
  asset, or component abstraction is admitted in that checkpoint;
- tenant and agent Builders remain future candidates, not current dispatches, and require isolated
  Worktrees plus a frozen shared CSS foundation;
- local imagery is deferred until the visual foundation and role surfaces prove that the existing
  `imageKey` contract needs concrete assets; no asset generation is part of this task yet.

## RS-WO-007-02 — Implement the shared Field Desk CSS foundation

**Role:** Builder → Verifier (sequential checkpoints)  
**Status:** `VERIFIED` — independently verified and integrated at product commit `89a50c7`  
**Parallelization:** `SERIAL_SHARED_CSS` — sole writer for the global visual token and primitive layer.  
**Risk profile:** `Standard` — behavior-preserving CSS change with a narrow authored path.  
**Dependency:** `RS-WO-005-01` passed independent verification and is integrated at local product
  commit `27f5391`; the main thread captured a fresh T0 identity after closure.  
**Supporting worker:** `01a05d75-0116-75e3-807d-a19c6669e659` (`Turing`, local multi-agent Builder).  
**Source baseline:** `04fb59565680f8df544bb345ffa29aeb31a2fdb6` on `main`; `app/globals.css` SHA-256
`639eb5c940d67c05d842f813bcf2b78cbdd18f7ac5b71985a887a003c0587448` before dispatch.  
**Initial post-Builder T2 identity:** Main-thread handoff was observed at
`HEAD=c92eb3773e1d6e3dd1944657f877c244ae516210`; `app/globals.css` SHA-256 is
`bb85c353b3943b1267f361b3a4e677bc3e4ce7db09250984085471c7409a957c`. The candidate was the only
product source change in this checkpoint.  
**Verification attempt 01:** `BLOCKED` by process-only source-identity drift. Hooke observed the
verification start at `HEAD=f4e62b2...` and a later final read at `HEAD=c15b879...` after the main
thread committed process/document records. The CSS candidate hash and `app-shell.tsx` hash were
unchanged; no product verification checks were run and no verifier source mutation occurred. This
was not classified as a CSS defect.  
**Corrected T2 identity:** After the block was recorded, the main thread re-baselined the unchanged
candidate at `HEAD=b63ee351f3856829d049177d3ea1b68618cc206a` with the same CSS hash. The current
process-only records are frozen and the main thread must not commit, amend, or edit the verified
source/reference until the corrected run returns.  
**Verification attempt 02:** `BLOCKED` by stale served runtime evidence. Hooke verified the frozen
`HEAD=b63ee351f3856829d049177d3ea1b68618cc206a` and unchanged hashes before and after the run;
`npm run typecheck`, `npm test` (6/6), `git diff --check`, `npm run build`, and the static CSS audit
passed. The existing server returned healthy HTTP responses but served the pre-candidate CSS tokens
(`--paper: #f7faf8`, `--ink: #15231f`, `--accent: #176b58`, `--focus: #e06d2f`) instead of the
candidate tokens, so browser/rendered evidence could not be attributed to this CSS. No source,
tests, docs, database, or Git metadata changed. This is not classified as a CSS defect.  
**Recovery action after attempt 02:** The main thread captured the unchanged CSS candidate in
`89a50c7119c366728c5e4a4cfc022788ddf39f00`, rebuilt the application, restarted the local server,
and confirmed that the served bundle contains the candidate tokens. No product source was changed
by this recovery action.  
**Final corrected verification:** Hooke reused the committed candidate and freshly served runtime for
the final browser/rendered verification and returned `VERIFIED`. The Git-ref freeze was released only
after that result; the main thread then performed the closure writeback.  
**Candidate source commit verified:** `89a50c7119c366728c5e4a4cfc022788ddf39f00` captures the
unchanged CSS candidate and is integrated as product commit `89a50c7`.
**Builder evidence:** `READY_FOR_VERIFICATION`; Node `v24.20.0`, npm `11.19.0`, typecheck,
foundation `6/6`, focused UI `7/7`, build, `git diff --check`, and CSS variable/class compatibility
scan passed. The final independent Verifier evidence is recorded below.  
**T0 dirty-state limitation:** unrelated `.gitignore`, `Docs/Tasks/README.md`, untracked
`Docs/Tasks/RIGHTSPOT-008-define-favourites-and-listing-interest-boundary.md`, untracked
`Docs/Tasks/RIGHTSPOT-009-define-information-request-and-contact-preference-boundary.md`, and
owner-held `Docs/Reference/RIGHTSPOT-GOAL-PROMPT-HISTORY.md` remain outside this Work Order and must
not be modified, staged, restored, or treated as product source.
**Verifier worker:** `01a05d82-ba0f-7963-9975-200e1fabb962` (`Hooke`, local multi-agent Verifier).  
**Verification status:** `VERIFIED` by the same-identity independent Verifier against candidate
commit `89a50c7119c366728c5e4a4cfc022788ddf39f00` and an isolated non-repository browser working
directory. The candidate is integrated at product commit `89a50c7`; the main thread must not treat
the earlier procedural blocks as product defects.

**Final verification evidence:** Hooke observed `HEAD=89a50c7119c366728c5e4a4cfc022788ddf39f00`,
the candidate CSS SHA-256 `bb85c353b3943b1267f361b3a4e677bc3e4ce7db09250984085471c7409a957c`, and
the shared shell SHA-256 `df1ec440f4cd54008214989327ed25f74e1c0ecde314887a087ef285b60ed7e3` unchanged
before and after verification. Node `v24.20.0`, npm `11.19.0`, typecheck, foundation tests `6/6`,
`git diff --check`, and build passed. The served bundle exposed the candidate tokens; signed-out,
tenant, agent, redirect, listing, mobile detail, desktop/tablet/mobile layout, no-overflow,
keyboard/focus, reduced-motion rule, and rendered contrast checks passed. Browser cwd was the
isolated `/var/tmp/rightspot-browser-rs-wo-007-02-eSLyUQ`; no source, docs, tests, database, or Git
metadata mutation occurred. Residual risk is limited to the unexercised agent request-detail path
because the current fixture queue has no assigned request; deployment, WebMCP, and external auth
remain unclaimed.

### Worker write set

- `app/globals.css`

### Required read set

- Accepted ADR-RS-0009 and this Task File.
- All existing shared components and role pages that consume global classes.
- Current `tenant.module.css`, `agent.module.css`, route wrappers, package scripts, and existing tests.
- The post-navigation source identity and any main-thread integration note for `RS-WO-005-01`.

### Required behavior

- Establish the accepted warm paper/off-white, deep evergreen, and restrained terracotta visual tokens.
- Provide typography fallbacks, readable hierarchy, visible focus, keyboard-safe controls, restrained
  radius/shadow/motion, responsive primitives, and reduced-motion behavior.
- Preserve existing class names and behavior unless a direct CSS-only correction is required.
- Keep the result credible and editorial/practical rather than glassy, gradient-heavy, or AI-generated
  dashboard styling.
- Do not add remote fonts/images/icons, a UI kit, animation dependency, new route, DOM contract, or
  product behavior.

### Return gate

Return `READY_FOR_VERIFICATION` with exact CSS diff, class compatibility review, desktop/mobile and
accessibility evidence, typecheck/build results, and explicit statement that no other path changed.
Stop with `NEEDS_REVIEW` if the visual result requires a shared component, route markup, dependency,
asset, or behavior change.

## RS-WO-007-03 — Revalidate the post-CSS tenant/agent parallel execution boundary

**Role:** Parallelism/Architecture Advisor  
**Status:** `ACCEPTED_WITH_REVISIONS`  
**Parallelization:** `READ_ONLY_ADVISORY` — may inspect the live source while the CSS Builder works;
it must not write source or canonical records.  
**Risk profile:** `Standard` — execution-boundary review only; no product behavior change.  
**Supporting worker:** `01a05d76-dac9-7283-9c2a-4166935f5043` (`Euler`, local multi-agent Advisor).  
**Source baseline:** Main-thread T0 commit `04fb595`; the Advisor must record any CSS-builder drift
observed during inspection and must not treat a moving `globals.css` as frozen evidence.

### Advisor scope

- Recheck exact tenant and agent route, component, CSS, test, fixture, API/domain, and runtime
  ownership after the shared CSS foundation is independently verified.
- Identify shared imports, contracts, wrappers, test/reset coupling, and any same-file write conflict;
  URL separation alone is not sufficient for parallel execution.
- Evaluate safe isolation choices for the current local project record (`isGitRepository=false`),
  including serialized same-tree work, a temporary isolated copy, or a separately authorized Git
  Worktree; do not create or mutate any of them.
- Propose at most two next bounded Work Orders with acceptance criteria, Verifier strategy, and stop
  conditions. This proposal is non-blocking for the current CSS Builder.

### Return gate

Return `READY_FOR_REVIEW` with observation time, source identity and dirty-state limitation, exact
paths inspected, verified facts versus inference/recommendation, commands, unresolved risks, and
the proposed next boundary. Return `BLOCKED` only if the source or instructions prevent a reliable
read-only review. Do not dispatch follow-on work or edit any file.

### Main-thread review disposition

The `Euler` review is accepted with revisions. Tenant and agent role surfaces are valid future
parallel candidates only after `RS-WO-007-02` is independently `VERIFIED` and a new frozen source
identity is captured. Their intra-role families remain intact: tenant owns the discovery, listing,
request, and tenant-module paths; agent owns the dashboard, request, and agent-module paths. Neither
family may modify shared UI, global CSS, route wrappers, contracts, server/domain/persistence, tests,
fixtures, configuration, or canonical documents.

The current Codex project record is not itself a Git repository, so shared local-cwd parallel writes
are not permitted. The main thread passed the isolation preflight from the actual nested Git root:
two explicitly recorded clean Worktrees were created from baseline `3cc6a04287ebb639f71eebe94191559dd58ca9be`,
with separate branches and disjoint role write sets. `RS-WO-007-04` and `RS-WO-007-05` are now
registered and dispatched through persistent task/threads; their integration and verification remain
sequential after both Builder handoffs.

## RS-WO-007-04 — Refine the tenant Field Desk surfaces

**Role:** Persistent Codex task/thread Builder → later independent Verifier  
**Status:** `INTEGRATED` — independently verified by `RS-WO-007-06`; product commit `5abdaf3`  
**Parallelization:** `CONTRACT_PARALLEL_ROLE_UI` — may run in parallel with `RS-WO-007-05` only in
the explicitly isolated Worktree recorded by the main thread; the shared CSS, shell, contracts, and
runtime authority are read-only.  
**Risk profile:** `Standard` — visual refinement constrained to existing tenant UI modules.  
**Dependency:** `RS-WO-007-02` is independently verified and integrated at product commit `89a50c7`;
the dispatch baseline is clean commit `3cc6a04287ebb639f71eebe94191559dd58ca9be`.  
**Frozen source:** `63e4c3e2b6985439edd18f61d4905eb4134e521b`; the candidate Worktree is clean after
the main-thread T2 freeze.  
**Integration:** The main thread cherry-picked the verified candidate as product commit `5abdaf3`.
The candidate changed only the four declared tenant UI paths. Independent verification used the
same frozen source with Node `v24.20.0` / npm `11.19.0`; typecheck, 6/6 foundation tests, 22/22
focused tenant/API tests, 57/57 direct aggregate tests, build, diff checks, isolated browser
responsive/no-overflow/focus/contrast checks, tenant error/recovery/role boundaries, and no-mutation
checks passed. Populated request/proposal/confirmation browser states and held loading visuals were
not exercised because the verifier did not mutate workflow data; their contracts passed direct tests.
**Supporting task/thread:** `01a05db4-6e9d-7e51-8ee1-9b7c62cc31d0` on host `local`.  
**Worktree:** `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-007-04-tenant` on branch
`rightspot/rs-wo-007-04-tenant`.  
**Ownership:** The Builder owns only the four tenant UI paths below. The main thread owns all
canonical writeback, integration, and closure.  

### Builder objective

Apply the accepted RightSpot Field Desk direction to the existing tenant discovery, listing-detail,
and request-dashboard surfaces so the local rental Happy Path feels calm, credible, practical, and
human-operated rather than AI-generated. Preserve the existing markup contracts and every current
tenant behavior. This is a visual refinement slice, not a feature or workflow redesign.

### Allowed write set

- `src/ui/tenant/tenant-discovery-page.tsx`
- `src/ui/tenant/tenant-listing-page.tsx`
- `src/ui/tenant/tenant-request-page.tsx`
- `src/ui/tenant/tenant.module.css`

### Required read set

- This Task File and accepted ADR-RS-0009.
- `Docs/00-current-status.md`, `Docs/03-system-design.md`, `Docs/05-api-and-integration-contracts.md`,
  and `Docs/06-validation-and-evidence.md`.
- `src/ui/shared/` and the tenant route wrappers under `app/tenant/`.
- `src/ui/tenant/tenant-api.ts`, existing package scripts, and current tests.
- The integrated `app/globals.css` candidate and the `RS-WO-007-03` ownership proposal.

### Required behavior and acceptance

- Preserve listing reads, filter validation, listing-detail navigation, draft editing, explicit
  Viewing Request submission, request status, refresh/retry behavior, and all existing role/session
  boundaries.
- Improve hierarchy, spacing, grouping, action clarity, empty/loading/error feedback, listing-card
  readability, and request-dashboard scanning using the existing Field Desk tokens and local CSS.
- Preserve accessible labels, semantic headings, visible keyboard focus, usable control sizing,
  responsive behavior at approximately `390x844`, `768x1024`, and `1440x900`, and reduced-motion
  behavior. Do not introduce remote assets or a visual dependency.
- Run the relevant typecheck/build and focused existing checks; record visual claims that require the
  later independent Verifier rather than claiming them from static inspection.

### Forbidden scope and stop conditions

- Do not modify `app/globals.css`, `src/ui/shared/`, route wrappers, `tenant-api.ts`, agent files,
  server/domain/persistence code, contracts, tests, fixtures, package metadata, configuration,
  assets, database files, or any documentation.
- Do not add Favourites, Information Requests, authentication, chat, maps, payments, WebMCP, Cloud
  Receiver, WebRTC, new routes, new APIs, or new product behavior.
- Stop and return `NEEDS_REVIEW` if the visual result requires shared DOM, a contract change, an
  asset/dependency, or a behavior fix outside this write set.

### Builder return gate

Return `READY_FOR_VERIFICATION` with exact changed paths, source identity, diff summary, checks,
known skipped browser evidence, and residual risks. Do not commit, modify the index, or start the
Verifier phase.

## RS-WO-007-05 — Refine the agent Field Desk surfaces

**Role:** Persistent Codex task/thread Builder → later independent Verifier  
**Status:** `INTEGRATED` — independently verified by `RS-WO-007-07`; product commit `a2f6a19`  
**Parallelization:** `CONTRACT_PARALLEL_ROLE_UI` — may run in parallel with `RS-WO-007-04` only in
the explicitly isolated Worktree recorded by the main thread; the shared CSS, shell, contracts, and
runtime authority are read-only.  
**Risk profile:** `Standard` — visual refinement constrained to existing agent UI modules.  
**Dependency:** `RS-WO-007-02` is independently verified and integrated at product commit `89a50c7`;
the dispatch baseline is clean commit `3cc6a04287ebb639f71eebe94191559dd58ca9be`.  
**Frozen source:** `33a36f01bb4163c2d29d9ee95ae6e4e95f591ae2`; the candidate Worktree is clean after
the main-thread T2 freeze.  
**Integration:** The main thread cherry-picked the verified candidate as product commit `a2f6a19`.
The candidate changed only the three declared agent UI paths. Independent verification used the same
frozen source with Node `v24.20.0` / npm `11.19.0`; typecheck, 6/6 foundation tests, 38/38 relevant
checks, build, diff checks, isolated browser responsive/no-overflow/focus/contrast checks, queue/empty/
role denial/retry boundaries, and no-mutation checks passed. Request detail/review/preparation/send/
conflict browser states were not exercised because the verifier fixture had no assigned request; the
existing contracts passed static/direct checks.
**Supporting task/thread:** `01a05db4-7764-7931-b474-ddbd977762ae` on host `local`.  
**Worktree:** `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-007-05-agent` on branch
`rightspot/rs-wo-007-05-agent`.  
**Ownership:** The Builder owns only the three agent UI paths below. The main thread owns all
canonical writeback, integration, and closure.  

### Builder objective

Apply the accepted RightSpot Field Desk direction to the existing agent queue and request workspace
so a property agent can scan work, understand the current state, prepare a bounded response, and see
the consequential send action clearly. Preserve the current workflow authority and human decision
boundary. This is a visual refinement slice, not an operations dashboard or feature expansion.

### Allowed write set

- `src/ui/agent/agent-dashboard-page.tsx`
- `src/ui/agent/agent-request-page.tsx`
- `src/ui/agent/agent.module.css`

### Required read set

- This Task File and accepted ADR-RS-0009.
- `Docs/00-current-status.md`, `Docs/03-system-design.md`, `Docs/05-api-and-integration-contracts.md`,
  and `Docs/06-validation-and-evidence.md`.
- `src/ui/shared/` and the agent route wrappers under `app/agent/`.
- `src/ui/agent/agent-api.ts`, existing package scripts, and current tests.
- The integrated `app/globals.css` candidate and the `RS-WO-007-03` ownership proposal.

### Required behavior and acceptance

- Preserve queue reads, request-detail reads, review preparation, slot selection, tenant-facing note,
  private review note, explicit send action, conflict refresh, retry behavior, and every current
  role/privacy boundary.
- Improve hierarchy, spacing, state distinction, action sequencing, availability scanning, loading/
  error feedback, and the separation between preparation and consequential send using the existing
  Field Desk tokens and local CSS.
- Preserve accessible labels, semantic headings, visible keyboard focus, usable control sizing,
  responsive behavior at approximately `390x844`, `768x1024`, and `1440x900`, and reduced-motion
  behavior. Do not introduce remote assets or a visual dependency.
- Run the relevant typecheck/build and focused existing checks; record that the current fixture may
  not provide an assigned request for every browser path.

### Forbidden scope and stop conditions

- Do not modify `app/globals.css`, `src/ui/shared/`, route wrappers, `agent-api.ts`, tenant files,
  server/domain/persistence code, contracts, tests, fixtures, package metadata, configuration,
  assets, database files, or any documentation.
- Do not add Agent Operations Insights, Favourites, Information Requests, authentication, chat,
  WebMCP, Cloud Receiver, WebRTC, new routes, new APIs, or new product behavior.
- Do not hide, automate, or merge the human send decision into preparation. Stop and return
  `NEEDS_REVIEW` if the visual result requires shared DOM, a contract change, an asset/dependency, or
  a behavior fix outside this write set.

### Builder return gate

Return `READY_FOR_VERIFICATION` with exact changed paths, source identity, diff summary, checks,
known skipped browser evidence, and residual risks. Do not commit, modify the index, or start the
Verifier phase.

## RS-WO-007-06 — Independently verify the tenant Field Desk candidate

**Role:** Persistent Codex task/thread Verifier  
**Status:** `VERIFIED` — frozen source independently verified; integrated at product commit `5abdaf3`  
**Parallelization:** `EVIDENCE_PARALLEL` — may run in parallel with `RS-WO-007-07` because it uses a
separate frozen source snapshot, separate Worktree, and no product write set.  
**Risk profile:** `Standard` — independent static, runtime, and browser verification of a bounded
tenant presentation candidate.  
**Dependency:** `RS-WO-007-04` Builder handoff is frozen at candidate commit
`63e4c3e2b6985439edd18f61d4905eb4134e521b`; do not verify the moving Builder Worktree.  
**Source Worktree:** `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-007-06-tenant-verifier` (detached
HEAD at the frozen candidate commit).  
**Supporting task/thread:** `01a05dd1-4e8c-7571-9f3a-5ca13f24e00e` on host `local`.  
**Ownership:** The Verifier may inspect and execute only. The main thread owns all repair, canonical
writeback, integration, and closure.

### Verifier objective

Independently determine whether the frozen tenant Field Desk candidate preserves the existing rental
MVP behavior and role boundaries while meeting the accepted visual refinement claims. Return exact
evidence and claim limits; do not repair or reinterpret the candidate.

### Required read set

- This Task File, the accepted ADR-RS-0009, and the frozen candidate commit.
- `Docs/00-current-status.md`, `Docs/03-system-design.md`, `Docs/05-api-and-integration-contracts.md`,
  and `Docs/06-validation-and-evidence.md` as they existed for the candidate boundary.
- The tenant route wrappers, tenant API module, shared shell, existing tests, package scripts, and
  the Builder handoff report.

### Verification boundary

- Confirm the exact source commit, clean status, exact four changed paths, and no forbidden-path
  mutation.
- Run Node `24.20.0` / npm `11.19.0` checks: dependency installation only if needed using the existing
  lockfile, `npm run typecheck`, `npm test`, `npm run build`, and `git diff --check`.
- Run directly relevant tenant/API tests and a bounded local production-server/browser walkthrough
  at isolated port `3114` when the environment permits. Check discovery, listing detail, request
  dashboard, loading/empty/error behavior, responsive layouts near `390x844`, `768x1024`, and
  `1440x900`, keyboard focus, and no horizontal overflow. Report unexercised paths explicitly.
- Check that no new feature, remote asset, dependency, global/shared-surface mutation, hidden
  fallback, or role/privacy regression was introduced.

### Forbidden actions

- Do not edit source, tests, fixtures, dependencies, configuration, documentation, Git metadata, or
  the main checkout.
- Do not repair failures, weaken tests, commit, push, deploy, modify the database, or use the main
  server on port `3100`.
- Do not claim browser, contrast, or integration evidence from static inspection or a failed setup.

### Return gate

Return `VERIFIED`, `NEEDS_REPAIR`, or `BLOCKED` with the exact source identity, changed-path result,
commands/runtime, browser evidence, skipped checks, residual risks, and recommended next gate. Stop
after the report; do not dispatch repair or integration work.

## RS-WO-007-07 — Independently verify the agent Field Desk candidate

**Role:** Persistent Codex task/thread Verifier  
**Status:** `VERIFIED` — frozen source independently verified; integrated at product commit `a2f6a19`  
**Parallelization:** `EVIDENCE_PARALLEL` — may run in parallel with `RS-WO-007-06` because it uses a
separate frozen source snapshot, separate Worktree, and no product write set.  
**Risk profile:** `Standard` — independent static, runtime, and browser verification of a bounded
agent presentation candidate.  
**Dependency:** `RS-WO-007-05` Builder handoff is frozen at candidate commit
`33a36f01bb4163c2d29d9ee95ae6e4e95f591ae2`; do not verify the moving Builder Worktree.  
**Source Worktree:** `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-007-07-agent-verifier` (detached
HEAD at the frozen candidate commit).  
**Supporting task/thread:** `01a05dd1-4604-7c23-a477-43caadae0ea8` on host `local`.  
**Ownership:** The Verifier may inspect and execute only. The main thread owns all repair, canonical
writeback, integration, and closure.

### Verifier objective

Independently determine whether the frozen agent Field Desk candidate preserves the existing queue,
request-review, preparation, send, conflict, and privacy behavior while meeting the accepted visual
refinement claims. Return exact evidence and claim limits; do not repair or reinterpret the candidate.

### Required read set

- This Task File, the accepted ADR-RS-0009, and the frozen candidate commit.
- `Docs/00-current-status.md`, `Docs/03-system-design.md`, `Docs/05-api-and-integration-contracts.md`,
  and `Docs/06-validation-and-evidence.md` as they existed for the candidate boundary.
- The agent route wrappers, agent API module, shared shell, existing tests, package scripts, and the
  Builder handoff report.

### Verification boundary

- Confirm the exact source commit, clean status, exact three changed paths, and no forbidden-path
  mutation.
- Run Node `24.20.0` / npm `11.19.0` checks: dependency installation only if needed using the existing
  lockfile, `npm run typecheck`, `npm test`, `npm run build`, and `git diff --check`.
- Run directly relevant agent/API tests and a bounded local production-server/browser walkthrough at
  isolated port `3115` when the environment permits. Check queue, request detail, review/preparation,
  explicit human send boundary, loading/error states, responsive layouts near `390x844`, `768x1024`,
  and `1440x900`, keyboard focus, and no horizontal overflow. If the fixture has no assigned request,
  report the consequential detail path as not exercised rather than manufacturing evidence.
- Check that no new feature, remote asset, dependency, global/shared-surface mutation, hidden
  fallback, or role/privacy regression was introduced.

### Forbidden actions

- Do not edit source, tests, fixtures, dependencies, configuration, documentation, Git metadata, or
  the main checkout.
- Do not repair failures, weaken tests, commit, push, deploy, modify the database, or use the main
  server on port `3100`.
- Do not claim browser, contrast, or integration evidence from static inspection or a failed setup.

### Return gate

Return `VERIFIED`, `NEEDS_REPAIR`, or `BLOCKED` with the exact source identity, changed-path result,
commands/runtime, browser evidence, skipped checks, residual risks, and recommended next gate. Stop
after the report; do not dispatch repair or integration work.

## Acceptance criteria for this task

1. The main thread has a reviewed, evidence-backed shared/tenant/agent ownership map.
2. The next Builder scope is small enough to verify independently and does not require concurrent
   writes to `app-shell.tsx`, `globals.css`, shared components, package metadata, or canonical docs.
3. The visual implementation preserves all accepted MVP routes, role/privacy boundaries, workflow
   semantics, and bounded error behavior.
4. The plan has explicit parallel and serialization rules rather than assuming page-level isolation.
5. No source, runtime, account, dependency, or external service mutation occurs during the advisory
   Work Order.

## Non-goals

- Do not implement the complete UI redesign in the Advisor checkpoint.
- Do not add new product routes or workflows.
- Do not introduce a UI kit, external font, icon CDN, image host, animation service, or auth provider.
- Do not convert the task into a speculative visual backlog.

## Closure gate

Close this task only after the main thread accepts the decomposition, registers only the next bounded
implementation Work Orders, and independently verifies the resulting shared foundation. A reviewed
proposal alone is not implementation completion.
