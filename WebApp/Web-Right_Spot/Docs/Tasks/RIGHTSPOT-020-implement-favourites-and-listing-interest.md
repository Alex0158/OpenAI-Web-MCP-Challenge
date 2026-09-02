# RIGHTSPOT-020: Implement tenant favourites and agent listing-interest

**Type:** `implementation`  
**Lifecycle:** `in_progress`  
**Priority:** `P1` for the next bounded post-MVP product increment  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-02  
**Depends on:** [ADR-RS-0013](../Decisions/ADR-RS-0013-favourites-and-listing-interest-boundary.md), closed `RIGHTSPOT-002`, and the existing relay/session/listing boundaries

## Task control

- Type: `implementation`
- Lifecycle: `in_progress`
+- Execution posture: `BROWSER_VERIFICATION_GATED`
- Current increment: The pre-UI relation-version continuity repair is independently verified at
  `adfd37e`; both disjoint UI candidates have completed their Builder turns, passed T2 exact-path/diff
  review, and are adopted in Main together with the serialized shared navigation integration at product
  commit `c29e80d`. Main's dependency-complete typecheck, full suite, and production build pass;
  independent integrated-source verification `RS-WO-020-04` passed against Main `c977ea4`; fresh-reset
  browser evidence is now the remaining acceptance gate.
- Next gate: Dispatch the independent read-only browser Verifier `RS-WO-020-05` against the frozen
  post-registration Main baseline, then reconcile browser evidence and close the bounded increment if all
  acceptance criteria pass. The two short-lived candidate Worktrees were already retired after exact-path
  review; only Main remains as the current source authority.
- Parent role: This is one registered Task File. Builder, Verifier, Repairer, and Integrator are
  checkpoints under this file, not additional Tasks.

## RS-WO-020-01 — Favourite contract/data foundation

**Role:** Domain, persistence, application, API, and focused-test Builder  
**Status:** `CLOSED` — initial foundation; continuity repair verified by `RS-WO-020-01R`  
**Parallelization:** `SERIAL_FIRST` — no other RightSpot product writer is admitted against these shared contract/state paths  
**Risk profile:** `High` for data/role/privacy boundaries; bounded implementation scope  
**Supporting worker:** `Ramanujan`, multi-agent `01a05f63-c270-7dc0-aa47-9c3a2b19a2e1` (stopped after a partial candidate); Main completed the bounded candidate from that work; `Hypatia`, multi-agent `01a05f76-7603-7792-abf9-47c76705ea8a`, independently verified it  
**Source baseline:** Main `5b98a082fd6868a5f60a088f4c1b59ab7d9fab83`; the Main working tree also contains unrelated Game, `next-env.d.ts`, and owner-held RightSpot untracked changes that are outside this Work Order  
**Ownership:** The Builder may edit only the exact code/test paths below. Main owns task status, canonical documentation, candidate review, integration, independent verification, and closure.

### Objective

Implement only the server-side Favourite contract/data foundation. This slice must make the accepted
Favourite semantics executable and testable, but must not implement tenant or agent UI.

### Allowed write set

```text
src/server/domain/favourites.ts
src/server/domain/favourite-projections.ts
src/server/domain/types.ts
src/server/domain/errors.ts
src/server/domain/workflow.ts
src/server/persistence/workflow-store.ts
src/server/persistence/reset.ts
src/server/application/workflow.ts
src/server/application/favourites.ts
src/server/application/favourite-views.ts
src/server/application/favourites-http.ts
src/shared/contracts/favourites-api.ts
app/api/tenant/favourites/route.ts
app/api/tenant/favourites/[listingId]/route.ts
app/api/agent/listing-interest/route.ts
tests/domain/favourites.test.ts
tests/application/favourites.test.ts
tests/persistence/favourites-migration.test.ts
tests/api/favourites.test.ts
```

Existing paths in this set may be changed only for Favourite state plumbing and must preserve the
existing Viewing Request behavior. New paths must remain inside the listed directories.

### Forbidden scope

- Any tenant/agent page, UI component, navigation, shared shell, global CSS, asset, or generated output.
- Any `InformationRequest`, contact profile/snapshot, notification, marketing, email, phone, WhatsApp,
  external auth, WebMCP, Cloud Receiver, Re-entry, deployment, or Operations-profile behavior.
- Any package manifest, lockfile, environment file, database artifact, canonical document, Task File,
  ADR, AGENTS file, README, Git commit/push/branch, Worktree management, deletion, or source cleanup.
- Any new listing lifecycle state, archive/hard-delete/relist model, all-time analytics, or second store.

### Required Builder checks

- Capture actual repository/package root, branch, HEAD, runtime, dirty paths, and candidate identity.
- Preserve v1-to-v2 migration, deterministic reset, fixture generation, atomic SQLite writes, command
  idempotency/fingerprint, expected-version conflicts, server-derived tenant identity, and role-safe DTOs.
- Prove published-only first save, retained unavailable Favourite, current-versus-available aggregate
  semantics, tenant/wrong-agent isolation, no private-field leakage, and unchanged Viewing Request tests.
- Run focused tests and relevant existing regression/typecheck checks with exact results. Do not claim
  browser, deployment, WebMCP, external communication, or production privacy evidence.
- Return `READY_FOR_VERIFICATION` only with exact changed paths, diff/scope self-review, test results,
  residual risks, and claim limits. Return `BLOCKED` instead of guessing if the baseline or ownership
  boundary is not reproducible.

## Objective

Deliver the smallest coherent Favourite experience for the current three-listing local fixture:

1. a tenant can save, remove, and review their own rental listings;
2. saved records remain truthful when a listing becomes `UNPUBLISHED`;
3. an assigned agent can see current listing-level interest aggregates without tenant identity or
   contact data; and
4. the existing Viewing Request workflow remains behaviorally unchanged.

## Accepted scope

### Domain and persistence

- Add a server-owned Favourite relation unique by `(tenantId, listingId)` with `ACTIVE | REMOVED`.
- Capture activation timestamps, relation version, saved listing version, and saved monthly rent for
  a truthful changed-since-save indication.
- Extend the relay snapshot additively to schema version 2; migrate v1 data to an empty Favourite
  collection without losing existing workflow state.
- Keep command execution atomic, idempotent, fixture-generation aware, and resettable using the
  existing persistence conventions.
- Require a published listing for first save; retain active Favourite state when that listing becomes
  unpublished and expose a safe unavailable projection.
- Return a server-owned `favouriteVersions` map keyed by listing id for the current tenant. It includes
  both active and removed relation versions so a re-save after reload can provide the exact expected
  version without treating visible list membership as source of truth.

### Tenant experience

- Add/remove control on existing listing cards and listing detail.
- Add a tenant Favourite list route and navigation entry.
- Show active and unavailable saved records, remove either state, and provide truthful empty/loading/
  stale/error/mutation-failure states.
- Use accessible state/action labels, `aria-pressed`, keyboard operation, a 44-by-44 CSS-pixel target,
  and non-colour-only state communication.

### Agent experience

- Add a compact read-only listing-interest section to the existing agent dashboard.
- Expose only listing-level `Current saves` and `Available interest` for the assigned agent's portfolio.
- Keep Favourite, Information Request, and Viewing Request metrics separate.
- Deny tenant-role access and prevent tenant IDs, contact values, private notes, command metadata, and
  cross-portfolio records from entering agent DTOs.

### Contract and verification

- Follow the existing server-derived actor, strict body allowlist, expected-version, command-id,
  fixture-generation, role-safe DTO, no-store, and typed failure conventions.
- Verify domain invariants, migration/reset, API authorization/privacy, current-versus-available
  counts, UI state, build/typecheck, and a fresh-reset tenant-to-agent browser walkthrough.

## Explicit non-goals

- `InformationRequest`, contact profiles, contact snapshots, marketing/notification consent, email,
  phone, WhatsApp, or any outbound communication.
- External authentication/Clerk, WebMCP, Cloud Receiver, Re-entry, deployment, or production privacy
  claims.
- Changes to the Viewing Request state machine, request DTOs, agent request handling, or Operations
  profile.
- New archive, let-agreed, hard-delete, tombstone, or relisting lifecycle states.
- All-time save-event analytics, tenant-level agent rows, charts, exports, notifications, or a separate
  Favourite management system.
- A second database, in-memory fallback, eventual-consistency queue, or new dependency.

## Planned checkpoint decomposition

The contract/data slice above was initially closed as `RS-WO-020-01`, but a pre-UI review reopened it
for the relation-version repair below. The two UI slices remain prepared for disjoint parallel dispatch
after that repair is independently verified; shared integration remains Main-owned and serialized.

### Contract/data slice — serial first

Likely ownership:

```text
src/server/domain/favourites.ts
src/server/domain/favourite-projections.ts
src/server/domain/types.ts
src/server/domain/errors.ts
src/server/persistence/workflow-store.ts
src/server/persistence/reset.ts
src/server/application/favourites.ts
src/server/application/favourite-views.ts
src/shared/contracts/favourites-api.ts
app/api/tenant/favourites/route.ts
app/api/tenant/favourites/[listingId]/route.ts
app/api/agent/listing-interest/route.ts
tests/domain/favourites.test.ts
tests/application/favourites.test.ts
tests/persistence/favourites-migration.test.ts
tests/api/favourites.test.ts
```

This slice owns the schema/migration, command semantics, server-derived identity, listing lifecycle
join, role-safe DTOs, and focused tests. It must not edit tenant/agent pages or global CSS.

### RS-WO-020-01R — Restore Favourite relation-version continuity

**Role:** Main Repairer  
**Status:** `VERIFIED` — persistent independent verification passed  
**Execution state:** `VERIFIED`  
**Dispatch state:** `dispatched at adfd37e885700f48c783ff134b17e50ca4f205d1`  
**Parallelization:** `SERIAL` — blocks the UI consumer pair until independently re-verified  
**Dependency:** Initial `RS-WO-020-01` candidate at `96b1bca`; no product writer may modify the same
server contract paths during this repair  
**Source baseline:** Main `adfd37e885700f48c783ff134b17e50ca4f205d1`; product source is frozen for the
read-only verification gate.  
**Execution mode:** Shared canonical Main Worktree, read-only verifier; the Main thread may update only
the explicitly named process-status section after dispatch.  
**Supporting task:** `RightSpot RS-WO-020-01R Favourite continuity verifier`, task/thread
`01a05f8d-55ae-7810-b938-a7f8490a0b97`, host `local`, returned `VERIFIED`.  
**Objective:** Make a tenant's saved/re-removed relation version recoverable after a fresh read, so a
tenant can remove a Favourite, reload, and save it again without a guessed version or hidden client
state.

**Repair boundary:** Add `favouriteVersions` to the tenant Favourite projection and shared response,
populate it from the server-owned relation records for the current tenant, and add regression coverage
for remove, read, and re-save continuity. Preserve active-only visible Favourite entries, existing
version conflicts, role/privacy boundaries, and all Viewing Request behavior. Do not change listing
lifecycle, introduce a second store, or add client-side persistence.

**Write set:** The existing `RS-WO-020-01` server contract/projection/view/test paths only, including
`src/server/domain/favourite-projections.ts`, `src/server/application/favourite-views.ts`,
`src/shared/contracts/favourites-api.ts`, and `tests/api/favourites.test.ts`. Main owns canonical
documentation and final integration.

**Verification gate:** Re-run the Favourite-focused suite, the full suite, typecheck, build, repository
validators, and an independent read-only verification of the new reload-and-re-save path. The repair
returned `VERIFIED` before either UI Work Order changes from `READY_TO_DISPATCH`.

**Independent verification evidence:** The persistent Verifier confirmed Favourite-focused `12/12`,
full direct suite `112/112`, typecheck, production build, repository validator tests `6/6`, sensitive-scan
tests `3/3`, repository validation, high-confidence sensitive scan, and byte-identical `next-env.d.ts`.
Dynamic checks proved save version `1`, remove version `2`, reload with
`favouriteVersions[listing-primary] = 2`, and re-save at version `3`; a separate in-memory assertion
confirmed a refreshed activation snapshot. No product source mutation occurred during verification.

### RS-WO-020-02 — Tenant Favourite UI

**Role:** Tenant UI Builder  
**Status:** `READY_FOR_VERIFICATION` — candidate handoff received; isolated dependency check is environment-limited  
**Execution state:** `READY_FOR_VERIFICATION`  
**Dispatch state:** `dispatched at 709e3e1bf0db8448cc676acbe58112f8df57330b`  
**Parallelization:** `PARALLEL_WITH_RS-WO-020-03` — exact write set is disjoint from the agent UI slice  
**Dependency:** `RS-WO-020-01R` independently verified after the relation-version continuity repair
**Execution mode:** Isolated short-lived Worktree `/Users/alex/Documents/Codex/2026-09-02/rightspot-rs-wo-020-02-tenant-ui`; Main owns integration and retirement.  
**Supporting task:** `RightSpot RS-WO-020-02 Tenant Favourite UI Builder`, task/thread
`01a05f93-9d5a-7993-bdde-a41fe74a5907`, host `local`.  
**Main adoption:** Product candidate integrated at `c29e80d`; independent verification remains open.  
**Objective:** Consume the Favourite API to add accessible save/remove controls to tenant discovery and
detail, a dedicated Favourite list route, and truthful active/unavailable/loading/stale/error states.

Write set:

```text
src/ui/tenant/favourites-api.ts
src/ui/tenant/tenant-favourites-page.tsx
src/ui/tenant/tenant-discovery-page.tsx
src/ui/tenant/tenant-listing-page.tsx
src/ui/tenant/tenant.module.css
app/tenant/favourites/page.tsx
tests/ui/tenant-favourites.test.ts
```

The Builder must consume the server projection and existing tenant API/session conventions. It must not
edit shared navigation, global CSS, agent files, server/domain/API files, docs, or generated output.
`src/ui/tenant/tenant.module.css` is tenant-owned for this slice; shared `app/globals.css` remains Main-owned.

Builder handoff: exact seven-path write-set review, focused Favourite/UI checks, existing tenant API
checks, supplemental TypeScript diagnostics, and whitespace/scope checks passed. The required exact
`npm run typecheck -- --incremental false` could not resolve React/Next/Node modules because this
isolated Worktree has no `node_modules`; Main must rerun dependency-complete typecheck/build after T2
adoption. No browser, integration, deployment, or external-auth claim is made.

### RS-WO-020-03 — Agent listing-interest UI

**Role:** Agent UI Builder  
**Status:** `READY_FOR_VERIFICATION` — Main recovered the Builder's isolated dependency gate  
**Execution state:** `READY_FOR_VERIFICATION`  
**Dispatch state:** `dispatched at 709e3e1bf0db8448cc676acbe58112f8df57330b`  
**Parallelization:** `PARALLEL_WITH_RS-WO-020-02` — exact write set is disjoint from the tenant UI slice  
**Dependency:** `RS-WO-020-01R` independently verified after the relation-version continuity repair
**Execution mode:** Isolated short-lived Worktree `/Users/alex/Documents/Codex/2026-09-02/rightspot-rs-wo-020-03-agent-ui`; Main owns integration and retirement.  
**Supporting task:** `RightSpot RS-WO-020-03 Agent listing-interest UI Builder`, task/thread
`01a05f93-a02b-7da3-a950-1721bbc45b9d`, host `local`.  
**Main adoption:** Product candidate integrated at `c29e80d`; the Builder's isolated dependency blocker
was recovered by Main's dependency-complete checks, and independent verification remains open.  
**Objective:** Add a compact read-only listing-interest section to the assigned agent dashboard using the
server projection, with explicit current-saves versus available-interest labels and bounded loading/error/empty states.

Write set:

```text
src/ui/agent/agent-listing-interest.tsx
src/ui/agent/agent-dashboard-page.tsx
src/ui/agent/agent-api.ts
src/ui/agent/agent.module.css
tests/ui/agent-listing-interest.test.ts
```

The Builder must consume the server projection and must not recompute portfolio counts from raw workflow
state. It must not edit shared navigation, global CSS, tenant files, server/domain/API files, docs, or
generated output.

Builder handoff blocker and recovery: the exact required `npm run typecheck -- --incremental false`
failed in the isolated Worktree because `node_modules` is intentionally absent; the same missing
dependency layout caused one child-process test invocation to fail. Focused listing-interest/API tests,
relevant tests excluding that environment case, bundle smoke with Main's dependency tree, diff review,
and scope checks passed. Failure class: `ENVIRONMENT_FAILURE`. The Builder stopped without installing,
symlinking, or expanding scope. Main adopted the stopped exact-scope candidate only after the Builder
ended, then reran the exact typecheck, full suite, and production build successfully in the dependency-
complete Main environment. No browser, deployment, or independent-verification claim is made yet.

### Shared integration and closure — serial Main ownership

Potential shared paths include:

```text
src/ui/shared/session-nav.tsx
app/globals.css
```

The Main thread owns navigation, shared listing-card/detail integration, global styling, source freeze,
integration, canonical writeback, full regression, browser evidence, and Worktree retirement. No
temporary Worktree is opened until the corresponding Work Order has an exact write set and a fresh Main
baseline.

### RS-WO-020-04 — Independent integrated-source verification

**Role:** Read-only integrated-source Verifier  
**Status:** `VERIFIED` — independent static verification passed  
**Parallelization:** `SERIAL_AFTER_INTEGRATION` — the product source is frozen for this checkpoint; no
other product writer or verifier may change the verified source until this checkpoint closes  
**Execution mode:** Shared canonical Main Worktree, read-only; no candidate Worktree is required or permitted  
**Source baseline:** Main `2060ebc20416c7593754b9f457074d46f6f481cb`; product implementation remains the
accepted `c29e80d` change set. The Main Worktree contains unrelated collaborator-owned Game changes and
owner-held RightSpot `AGENTS.md`, `CLAUDE.md`, and `Docs/Reference/` untracked content; these are not part
of the product source under verification and must not be staged, restored, deleted, or otherwise changed.  
**Ownership:** The Verifier may inspect and execute checks only. Main owns any interpretation, canonical
writeback, repair, browser evidence, and Git closure.
**Supporting task:** `RightSpot RS-WO-020-04 integrated source verifier`, task/thread
`01a05fad-77b5-7570-bbac-0d626885297e`, host `local`.

#### Verification result

The independent Verifier returned `VERIFIED` against Main `c977ea4fd8487c515c353e7e0ed7f3d39418ad26`.
It confirmed the canonical repository root and the only remaining Worktree, Node `v24.20.0`, npm
`11.19.0`, product implementation `c29e80d`, and a read-only Main source boundary. The required
typecheck, focused Favourite/UI plus tenant/agent API suite `28/28`, full direct suite `121/121`,
production build, validators `6/6`, sensitive tests `3/3`, repository validation, sensitive-pattern
scan, and `git diff --check` all passed. The product/source/test/package aggregate and `next-env.d.ts`
remained byte-identical during verification; only permitted ignored `.next/` build output was produced.
The report confirmed the accepted role/privacy projection boundary and made no browser, deployment,
WebMCP, Cloud Receiver, external-authentication, or production-privacy claim.

#### Objective

Independently verify that the integrated Favourite/listing-interest UI and server foundation at the exact
Main baseline satisfy the accepted local contract, remain within the declared product scope, and pass the
dependency-complete repository safeguards without mutating source or repository state.

#### Read set

```text
WebApp/Web-Right_Spot/
WebApp/Web-Right_Spot/Docs/Tasks/RIGHTSPOT-020-implement-favourites-and-listing-interest.md
WebApp/Web-Right_Spot/Docs/Decisions/ADR-RS-0013-favourites-and-listing-interest-boundary.md
WebApp/Web-Right_Spot/Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md
```

#### Write set and forbidden set

```text
Write set: empty
Forbidden set: every file under the repository, including source, tests, docs, package metadata,
lockfiles, generated files, .gitignore, Git refs, staging area, commits, branches, and Worktrees
```

#### Required checks

The Verifier must first confirm the repository root and exact `HEAD` above, then run the pinned Node
`24.20.0`/npm runtime and the following checks where the repository scripts provide them:

```text
npm run typecheck -- --incremental false
focused Favourite/UI and existing tenant/agent API tests
full direct suite (expected integrated baseline: 121/121)
npm run build
python3 scripts/test_validators.py
python3 scripts/test_sensitive_scan.py
python3 scripts/validate_repository.py --root .
python3 scripts/scan_sensitive_patterns.py --root .
git diff --check
```

The report must include exact commands/results, product-path scope review against `c29e80d`, confirmation
that `next-env.d.ts` and product source were not mutated, and explicit non-claims for browser, deployment,
WebMCP, Cloud Receiver, external authentication, and production privacy. A failure caused only by the
known unrelated dirty files must be isolated rather than repaired in place.

#### Stop conditions

Stop and return `BLOCKED` if exact repository identity cannot be established, any product or repository
file changes during the checkpoint are detected, a required check needs a write or external integration,
or the result requires interpreting a scope/contract change. Do not install dependencies, edit files,
stage/commit, move refs, create/remove Worktrees, or broaden the verification surface.

### RS-WO-020-05 — Fresh-reset browser verification

**Role:** Independent read-only browser Verifier  
**Status:** `GATED` — dispatch after this process record is committed and a fresh exact baseline is captured  
**Parallelization:** `SERIAL_AFTER_RS-WO-020-04` — browser evidence uses the static-verified integrated source;
no product writer may change the source during the browser checkpoint  
**Execution mode:** Dedicated browser session against a locally served frozen Main source; no code Worktree
or source writer is permitted. Runtime state and generated output must remain within the documented RightSpot
boundary.  
**Source baseline:** Capture and record the full Main `HEAD` immediately before dispatch; the product source
must remain the accepted `c29e80d` change set.  
**Ownership:** The browser Verifier records observed UI evidence only. Main owns server lifecycle, any
interpretation, canonical writeback, Git closure, and any repair.

#### Objective

Prove the accepted Favourite/listing-interest browser Happy Path from a fresh reset without expanding
the product scope: tenant discovery/detail save and remove, Favourite-list reload and re-save continuity,
unavailable-listing representation, and the assigned agent's listing-level interest summary.

#### Required walkthrough

1. Confirm the exact repository/source identity, pinned runtime, local server identity, fresh browser context,
   and a fresh isolated RightSpot database at fixture generation `1` using the documented local procedure.
2. As the synthetic tenant, enter the tenant workspace, view the seeded listings, save `listing-primary`
   from discovery or detail, open the Favourite list, remove it, reload the Favourite projection, and
   save it again. Record the visible state and relevant URLs.
3. If the accepted MVP exposes an in-scope UI action that produces an unpublished listing, confirm the
   unavailable Favourite remains represented as unavailable and removable while it is excluded from the
   agent's `Available interest` count and retained in `Current saves`. If no such UI action exists, do not
   call a hidden API or mutate the fixture solely for browser evidence; record this as direct/static-only
   evidence and keep the browser claim limited to the supported human flow.
4. In an independent fresh session, enter the synthetic assigned-agent workspace and confirm only the
   listing-level `Current saves` and `Available interest` projection is visible; no tenant identity,
   contact value, or private note may appear.
5. Record browser console/error evidence, exact server/runtime/database boundary, and post-run source/status
   comparison. Stop if the browser harness requires a tracked-file mutation, cannot establish the frozen
   source, or needs external auth/deployment/WebMCP/Cloud Receiver behavior.

#### Forbidden actions and claim limits

Do not edit source, tests, package files, docs, `.gitignore`, generated configuration, or owner-held files;
do not stage, commit, push, reset, clean, delete, create/remove Worktrees, or change Git refs. Do not
claim production, deployment, WebMCP, Cloud Receiver, external authentication, or production privacy
evidence. A browser run that changes a tracked file or writes outside the documented RightSpot generated
set is `BLOCKED` even when the visible flow passes.

## Acceptance criteria

1. From a fresh reset, the tenant can save one published listing, see it in the Favourite list, remove
   it, reload the Favourite projection, and save it again successfully.
2. Repeating the same command is idempotent; conflicting command reuse and stale versions fail without
   a partial mutation.
3. Removing a Favourite is idempotent and does not create or mutate a Viewing Request.
4. An unpublished listing remains represented as unavailable and removable; it is excluded from
   `Available interest` but retained in `Current saves`.
5. An assigned agent can read only listing-level aggregate counts for its own portfolio.
6. Tenant and wrong-agent reads are rejected or neutralized according to existing role/object rules;
   no tenant identity, contact value, or private note is present in the response.
7. Reset and v1-to-v2 migration are deterministic and preserve the existing Viewing Request Happy Path.
8. Focused tests, full test suite, typecheck, build, and fresh-reset browser evidence pass, with claims
   limited to the local application boundary.

## Stop conditions

Stop and return `BLOCKED` to the Main thread if implementation requires contact data, a new listing
lifecycle state, a Viewing Request contract change, an Operations-profile write, shared-file ownership
that cannot be serialized, an external provider, or a source baseline that cannot be reproduced.

## Current evidence and closure

The original Builder stopped before handoff after writing a partial domain/persistence candidate. Main
completed and reviewed the bounded candidate in the canonical working tree. Independent Verifier
`Hypatia` returned `VERIFIED` for the original candidate after confirming the migration ledger guard,
role/privacy boundary, cross-operation command-id conflict behavior, and route wiring. A pre-UI review
found that the active-only tenant projection did not expose a removed relation's version after reload;
Main repaired that continuity gap under `RS-WO-020-01R`, and persistent Verifier
`01a05f8d-55ae-7810-b938-a7f8490a0b97` independently returned `VERIFIED` against `adfd37e`. UI Work
Orders `RS-WO-020-02` and `RS-WO-020-03` were dispatched in parallel, their exact-scope candidates
were adopted into Main, the shared navigation integration was serialized in Main, and the two short-lived
candidate Worktrees were retired after exact-path review. Dependency-
complete Main verification now reports typecheck pass, full suite `121/121`, and production build pass;
independent static verification `RS-WO-020-04` returned `VERIFIED` against Main `c977ea4`. Fresh-reset
browser verification `RS-WO-020-05` remains before closure. No deployment, production privacy, WebMCP,
Cloud Receiver, or external-auth evidence is claimed.
