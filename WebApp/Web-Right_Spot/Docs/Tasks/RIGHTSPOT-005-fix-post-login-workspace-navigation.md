# RIGHTSPOT-005: Route signed-in users to the role workspace

**Type:** `defect`  
**Lifecycle:** `verification_pending`  
**Priority:** `P1` for the next demo-ready product increment  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-01  
**Depends on:** `RIGHTSPOT-003` UI/UX proposal review; the existing demo-session contract and tenant/agent route boundary

## Task Control

- Type: `defect`
- Lifecycle: `verification_pending`
- Priority: `P1`
- Owner: Main RightSpot thread
- Current increment: Implement the accepted role-aware post-login navigation behavior without changing session, route, workflow, or API authority.
- Next gate: Main-thread integration and Git closure review; no further source change is required by verification.
- Dependencies: `RIGHTSPOT-003` and ADR-RS-0009 have accepted the visual/interaction direction; no authentication-provider decision is required for this repair.
- Implementation status: `RS-WO-005-01` is `READY_FOR_VERIFICATION` in supporting task `01a05d57-4962-7681-afa7-a95b27acf04e` on host `local`.
- Verification status: Corrected independent attempt 02 returned `VERIFIED` in the same supporting task; the candidate is accepted for main-thread integration review.

## Verified problem

The current root route is a session landing shell rather than a business workspace. After a tenant
signs in, the application keeps the user at `/` and shows a successful session state plus a manual
`Open Tenant workspace` link. The root surface explicitly says that listings and workflow data do
not belong to the shell. A user who expects login to open the rental marketplace can therefore
interpret a successful login as an empty catalogue.

This was reproduced against local source baseline
`625048a74e4fa7d716dd0067b29467438c648940` on 2026-09-01:

- The browser was at `http://127.0.0.1:3100/` with `Tenant session active` and server-resolved actor `tenant-demo`.
- The root page displayed the session-only handoff and no listing data.
- Following `Open Tenant workspace` to `/tenant` rendered three seeded listings: `Canal Wharf Apartment`, `Northfield Garden Flat`, and `Riverside Studio`.
- The `/tenant` page showed no listing error and no active filters.
- `GET /api/health` returned HTTP `200` with `{ "ok": true, "service": "rightspot" }`.
- A request to `GET /api/listings` without a session returned the expected HTTP `401` `UNAUTHENTICATED` response; this does not indicate a seeded-data failure.

The source supports the same diagnosis: `AppShell` establishes session state but does not navigate
after `createSession`, while `DemoSessionPanel` exposes the role workspace as a separate manual
link. The tenant route then loads the listing collection through the existing tenant API boundary.

## Bounded objective

Make the first post-login destination unambiguous while preserving the existing session, role, and
API boundaries. The preferred outcome is:

1. a successful tenant sign-in leads to `/tenant`;
2. a successful agent sign-in leads to `/agent`;
3. an already signed-in user who opens `/` receives a clear, non-ambiguous continuation to the correct role workspace, according to the accepted UI proposal; and
4. the existing wrong-role protection, sign-out behavior, loading state, and bounded error messages remain intact.

The final choice between an immediate redirect and a clearly primary continue action belongs to the
main thread after reviewing `RIGHTSPOT-003`. The implementation must not silently create a second
session or mutate workflow data during navigation.

## Candidate implementation boundary

The likely source boundary is limited to the shared session landing flow, initially:

- `src/ui/shared/app-shell.tsx`
- `src/ui/shared/demo-session-panel.tsx` only if the accepted interaction design requires a change to the continuation affordance
- focused session/UI tests or browser evidence needed to prove the route behavior

The exact write set must be confirmed in the implementation Work Order. The existing tenant and
agent page implementations, listing API, workflow domain, persistence layer, and authentication
provider boundary are not part of this repair.

## RS-WO-005-01 — Implement role-aware post-login workspace navigation

**Role:** Builder → Verifier (sequential checkpoints)  
**Status:** `VERIFIED` — awaiting main-thread integration  
**Supporting task:** `01a05d57-4962-7681-afa7-a95b27acf04e` on host `local`  
**Verifier task:** `01a05d5d-d796-72f0-baad-ca00d8e7ab4e` on host `local`  
**Parallelization:** `SERIAL_SHARED_SHELL` — this Work Order owns the shared session landing flow; no other worker may modify its write set during execution.  
**Risk profile:** `Standard` — client navigation after server-confirmed session, with no domain or API change.  
**Source baseline:** `625048a74e4fa7d716dd0067b29467438c648940`  
**Write policy:** The Builder may modify only the exact worker write set below and must return `READY_FOR_VERIFICATION`; it must not edit this Task File or canonical documents.

### T2 handoff identity

- The candidate is frozen for verification at the reviewed baseline commit plus the expected dirty
  product path `src/ui/shared/app-shell.tsx`.
- Candidate content SHA-256: `df1ec440f4cd54008214989327ed25f74e1c0ecde314887a087ef285b60ed7e3`.
- The canonical Builder is supporting task `01a05d57-4962-7681-afa7-a95b27acf04e` on host `local`;
  it returned `READY_FOR_VERIFICATION` without committing, pushing, deploying, or editing
  canonical documents.
- A second supporting task `01a05d58-0b9e-7e40-8093-befbe4723318` was created for the same Work
  Order after the canonical Builder had already changed the shared path. It detected the existing
  dirty candidate, returned `NEEDS_REVIEW`, and made no source change. It is a procedural duplicate,
  not a second candidate and must not be used for verification or follow-on work.
- The unrelated RightSpot documentation changes and owner-held reference file remain preserved and
  are outside this Work Order's product write set.

### Verification attempt 01

- Final state: `BLOCKED` — this is a procedural checkpoint result, not a confirmed product defect.
- First failing boundary: browser tooling added the undeclared tracked Git metadata path
  `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/.gitignore` with the exact line `+.gstack/`.
- The main thread and Verifier did not restore, delete, overwrite, commit, or push that change.
- Candidate `app-shell.tsx` SHA-256 remained
  `df1ec440f4cd54008214989327ed25f74e1c0ecde314887a087ef285b60ed7e3` before and after the
  incident. Direct tests, HTTP checks, role redirect, listing visibility, sign-out, privacy, and
  workflow-state no-mutation evidence passed before the hard stop; those results do not by themselves
  promote the checkpoint to `VERIFIED`.
- The rerun must use a clean isolated source/tooling boundary or omit the mutating browser helper,
  capture the preserved `.gitignore` incident as pre-existing evidence, and prove that no new
  metadata/source path changes occur.

### Verification attempt 02

- Same Verifier identity: `01a05d5d-d796-72f0-baad-ca00d8e7ab4e` on host `local`.
- This is a same-Work-Order continuation, not a duplicate Builder or a new candidate.
- Browser helper cwd: `/var/tmp/rightspot-browser.65cSwB`, outside the repository and separate from
  the product source boundary.
- Known preserved `.gitignore` incident remains excluded from the rerun delta; any new metadata or
  product-source change remains an immediate procedural `BLOCKED` result.

### Verification attempt 02 result

- Final state: `VERIFIED`.
- Candidate hash remained
  `df1ec440f4cd54008214989327ed25f74e1c0ecde314887a087ef285b60ed7e3` and the only product-source
  change remained `src/ui/shared/app-shell.tsx`.
- Node `v24.20.0`, npm `11.19.0`, typecheck, foundation tests `6/6`, production build, and the
  isolated serial full suite `57/57` passed.
- HTTP checks passed for health, signed-out boundaries, tenant listings, agent queue/privacy, invalid
  role validation, unknown listing, and sign-out; workflow-state digest was unchanged.
- Browser checks passed for tenant sign-in → `/tenant` with three seeded listings, agent sign-in →
  `/agent`, active tenant/agent root redirects, and both sign-out flows. Authenticated pages had no
  JavaScript console errors; the signed-out session `401` resource log remains an expected handled
  response rather than a JS exception.
- No new source, test, document, dependency, environment, database, generated-authored, or Git
  metadata change occurred during attempt 02. The earlier preserved `.gitignore` incident remains
  separate procedure evidence.
- This result proves the bounded local candidate and its registered evidence; it does not claim
  deployment, external authentication, WebMCP, Cloud Receiver, or final Hackathon integration.

### Required read set

- Repository and workspace `AGENTS.md` files and RightSpot `RUNBOOK.md`.
- RightSpot `Docs/00-current-status.md`, `Docs/03-system-design.md`, `Docs/06-validation-and-evidence.md`, ADR-RS-0001 through ADR-RS-0010, and this Task File.
- `src/ui/shared/session-api.ts`.
- `src/ui/shared/demo-session-panel.tsx`.
- `src/ui/shared/session-nav.tsx`.
- `src/ui/shared/role-page-frame.tsx`.
- Existing focused UI/API tests and the running local application, if browser evidence is available.

### Worker write set

- `src/ui/shared/app-shell.tsx`

The Builder may add or update a focused test only if an existing test boundary can prove this exact
navigation behavior without adding a dependency. Any additional authored path requires the Builder
to stop and report `NEEDS_REVIEW` rather than guessing.

### Forbidden and generated sets

- Forbidden: all tenant/agent page components and CSS, all server/API/domain/persistence files,
  package manifests and lockfiles, environment files, database files, canonical documents, Git
  metadata, and the owner-held `Docs/Reference/RIGHTSPOT-GOAL-PROMPT-HISTORY.md`.
- Generated: no authored generated output. Local runtime output must remain outside the repository
  or inside already approved ignored paths.

### Required behavior

- After the server confirms a successful tenant session, navigate to `/tenant`.
- After the server confirms a successful property-agent session, navigate to `/agent`.
- If an active session is read on the root entry surface, use one role-aware, non-looping behavior:
  redirect to the matching workspace or present one clearly primary continuation action, consistent
  with ADR-RS-0009. The Builder must state which option was implemented.
- Derive the destination only from the server-resolved `SessionActor.role`; do not accept a client
  role, actor ID, URL parameter, or local storage value as authority.
- Preserve signed-out entry, sign-out, loading, bounded error messages, and the existing role-page
  wrong-role guard.
- Do not request listings, create a Viewing Request, mutate fixture state, or change any API/domain
  contract as a navigation side effect.

### Return gate

Return `READY_FOR_VERIFICATION` with the exact diff paths, behavior choice, commands, typecheck/test
results, any browser evidence, and any limitation. Stop with `NEEDS_REVIEW` if the change requires a
shared file outside the write set, a new dependency, middleware, server route, or a product-scope
decision. Do not commit, push, deploy, dispatch follow-on work, or claim independent verification.

## Acceptance criteria

1. Starting from a signed-out root session surface, selecting Tenant ends at `/tenant` after the server confirms the session.
2. The tenant workspace renders the seeded listing collection, including three listing cards in the deterministic fixture.
3. Starting from a signed-out root session surface, selecting Property agent ends at `/agent` without weakening the agent role guard.
4. Opening `/` with an active session cannot leave the user wondering where the role workspace is; the accepted behavior is either an automatic role-aware redirect or one clearly primary continuation action.
5. Sign-out still clears the session and returns the user to an unauthenticated entry state.
6. Session-read, sign-in, and navigation failures remain visible and bounded; no stack trace or silent fallback is introduced.
7. No listing, Viewing Request, fixture generation, audit record, role assignment, or API contract changes as a side effect of the fix.
8. Focused typecheck/tests and an isolated browser walkthrough capture the final URL, visible role state, listing presence, and absence of browser errors.

## Non-goals

- Do not add or change seeded listings, search filters, listing detail data, favourites, or workflow states.
- Do not introduce Clerk, Auth0, Google OAuth, middleware, new cookies, or any external authentication provider.
- Do not change tenant/agent authorization, route privacy, API behavior, persistence, or reset semantics.
- Do not redesign the complete visual system in this task; `RIGHTSPOT-003` owns that proposal.
- Do not add WebMCP, Cloud Receiver, WebRTC, Redis, notifications, chat, or deployment behavior.
- Do not make the root shell a business-state owner merely to avoid navigation.

## Verification and closure gate

After implementation, the Work Order must prove tenant and agent post-login destinations, listing
visibility, session/error behavior, no workflow mutation, and the absence of browser console errors.
Close this task only after the main thread reviews independent evidence, reconciles any durable UI
decision into the owning document, and confirms that no broader feature scope was introduced.

## Reopen condition

Reopen or replace this task if `/tenant` fails to load listings with a valid tenant session, if the
accepted UI proposal chooses a materially different information architecture, or if the fix requires
an authentication-provider or server authorization change. Those cases require a separate bounded
decision or investigation rather than expanding this navigation repair.
