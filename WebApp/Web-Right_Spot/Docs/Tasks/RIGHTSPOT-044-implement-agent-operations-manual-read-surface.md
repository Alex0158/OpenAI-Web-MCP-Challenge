# RIGHTSPOT-044: Implement the bounded Agent Operations manual read surface

**Type:** `implementation`  
**Lifecycle:** `closed`  
**Priority:** `P1` for the next RightSpot product milestone  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-03  
**Depends on:** [ADR-RS-0016](../Decisions/ADR-RS-0016-agent-operations-manual-read-surface-boundary.md),
accepted `ADR-RS-0012`, closed `RIGHTSPOT-015`, and closed `RIGHTSPOT-016`

## Task control

- Type: `implementation`
- Lifecycle: `closed`
- Execution posture: `CLOSED_VERIFIED`
- Objective: Expose the existing deterministic Operations profile and pure projection through one
  agent-only manual read surface without changing the relay workflow or registering WebMCP.
- Current increment: Completed the manual Agent Operations read surface, strict HTTP consumer, Agent
  navigation entry, and independent integrated verification at the declared local claim level.
- Next gate: Return to the Main-thread cross-layer audit. Any later Operations WebMCP capability needs
  its own accepted contract, Task, and evidence gate.
- Evidence status: `CLOSED_VERIFIED` — source, contract, role/privacy, error, accessibility,
  responsive, and runtime/browser evidence agree for the bounded manual surface; known shell-level
  network residuals are documented and excluded from the product claim.
- Parent role: This is one registered Task File. Application/API, UI/navigation, and verification are
  Work Order checkpoints under this file, not additional Tasks.

## Bounded objective

Implement a manually usable `/agent/operations` page and its `GET /api/agent/operations` read path
for the two already accepted current-state query families:

1. `listingPipeline`; and
2. `upcomingViewings`.

Both consumers must use the existing Operations profile store and `projectOperationsProfile`. The
manual page remains the visible result surface and must work without WebMCP.

## Accepted contract

### Transport

`GET /api/agent/operations` requires a server-resolved Agent session and a required `kind` query
parameter.

For `kind=listingPipeline`, the only additional parameters are:

```text
area?
publicationState?
lifecycleState?
minPublishedAgeDays?
```

For `kind=upcomingViewings`, `from` and `to` are required and the only additional parameters are:

```text
status?
area?
listingId?
```

All values must be parsed strictly. Unknown names, duplicate names, missing required values, empty
values, malformed dates/enums/integers, and out-of-bounds values fail with bounded `400
VALIDATION_FAILED`. The client cannot select the profile, database path, actor, `asOf`, or timezone.

The `200` body is the corresponding projection envelope from `projectOperationsProfile`, with its
existing metadata, normalized filters, exact counts, cap/truncation fields, and privacy-safe items.
The route must not reimplement predicates, return raw storage, or silently fall back to another query.

### Manual page

The page is `/agent/operations` and is visible only after the existing `RolePageFrame` resolves an
Agent session. The Agent navigation contains a separate Operations entry with an exact active state.
The page provides manual controls for both query families and shows the selected filters, evaluated
`asOf`, `dataAsOf`, `Europe/London` timezone, freshness, exact total/returned counts, truncation,
loading, empty, validation, service, and authority-failure states.

The page must not add charts, saved/scheduled reports, natural-language parsing, mutation controls,
Favourite or Information Request metrics, tenant identity/contact data, an invented Agent listing
detail route, or WebMCP registration.

## Work Order sequence

### RS-WO-044-01 — Operations application and HTTP consumer

**Role:** Backend/API Builder  
**Status:** `CLOSED_VERIFIED`  
**Parallelization:** `SERIAL_CONTRACT_FIRST` — the UI consumer may inspect the frozen response
contract after this handoff, but must not modify these paths.  
**Risk profile:** `Assured` — crosses session, separate persistence, strict transport parsing,
projection, error, and privacy boundaries.  
**Supporting worker:** Multi-agent Backend/API Builder `01a0653c-9582-7291-a409-754c1dc86d1b`
(`Zeno`)  
**Source baseline:** Capture the current Main commit, branch, dirty/untracked paths, runtime, and
single physical Worktree before execution. Existing unrelated and RightSpot boundary artifacts remain
outside this Work Order.  
**Ownership:** The Builder owns only the paths below. Main owns task status, source freeze, review,
integration, canonical documentation, and closure.

**Dispatch record (2026-09-03):** Main dispatched this ordinary Backend/API Work Order to the
supporting worker above with the full repository instruction surface, `RIGHTSPOT-044`, `ADR-RS-0016`,
the Operations authority/projection references, exact write set, TDD requirements, stop conditions,
and handoff evidence requirements. This Work Order has no WebMCP scope and no WebMCP-specific model
override.

**Handoff result (2026-09-03):** `Zeno` returned `READY_FOR_VERIFICATION` from source baseline
`92802419b245628a9741a869543f8c17f779100c`. Main independently reviewed the exact six-path diff and
confirmed no changes outside the declared write set. Focused tests passed `7/7`; the complete RightSpot
suite passed `178/178`; typecheck, production build, repository validation, validator tests, sensitive
scan, and `git diff --check` passed. The build emitted the existing dynamic filesystem tracing warning
for the Operations SQLite path; this is recorded as a residual deployment concern, not a product
success claim. Shared-contract reverse-dependency and changed-file CJK scans passed. The ordinary
`GET /api/agent/operations` contract is frozen for the next UI consumer. Independent integrated
browser/API verification remains reserved for `RS-WO-044-03` after the page is present.

#### Allowed write set

```text
src/server/application/operations-insights.ts
src/server/application/operations-insights-http.ts
src/shared/contracts/operations-api.ts
app/api/agent/operations/route.ts
tests/application/operations-insights.test.ts
tests/api/operations-insights.test.ts
```

New files are preferred. If a shared existing path is directly required, stop with `NEEDS_REVIEW`
instead of expanding the write set.

#### Required behavior

- Resolve the session server-side and require the `agent` role.
- Open the application-owned Operations store; never accept a client path or profile selector.
- Parse the exact query allowlist and map it to one existing `OperationsProjectionQuery`.
- Use a server-owned ISO instant for `asOf` and preserve the projection's London date semantics.
- Return projection parity for listing pipeline and upcoming viewings.
- Map unauthenticated, wrong-role, invalid-input, persistence, and invalid-authority outcomes to
  bounded responses without raw errors or private fields.
- Keep valid empty results explicit and do not perform any fallback, retry, mutation, or relay read.
- Close the store on every path and preserve no generated database in the authored write set.

#### TDD and acceptance checks

Start with failing focused tests for strict query parsing, both query families, role/session
boundaries, projection parity, exact counts/truncation, empty results, invalid authority, and
persistence failure. Then implement the smallest code that turns those tests Green and refactor only
after the contract is covered.

The handoff must include exact changed paths, focused results, all direct tests, typecheck, build,
`git diff --check`, and explicit proof that relay APIs and the Operations authority/projection are
unchanged.

#### Stop conditions

Stop at `NEEDS_REVIEW` or `BLOCKED` if this requires a relay schema change, a new lifecycle/time
semantic, client-selected identity/profile, a shared navigation/UI edit, a new dependency, an
Information Request/Favourite metric, WebMCP, external auth, or any third path.

### RS-WO-044-02 — Manual Operations page and Agent navigation

**Role:** UI Builder  
**Status:** `CLOSED_VERIFIED`  
**Parallelization:** May run after the `044-01` response contract is frozen; navigation remains a
narrow shared-file change.  
**Risk profile:** `High` for role entry, error truthfulness, responsive accessibility, and shared
navigation; no domain or persistence writes allowed.

**Supporting worker:** Multi-agent UI Builder `01a06547-2510-7a40-8444-e074ebc0b258` (`Wegener`)

**Dispatch record (2026-09-03):** Main dispatched this bounded UI Work Order after independently
freezing and reviewing the `RS-WO-044-01` ordinary HTTP response contract. The worker received the
full repository instruction surface, `RIGHTSPOT-044`, `ADR-RS-0016`, exact allowed paths, existing
role-shell/navigation patterns, TDD requirements, stop conditions, and handoff evidence requirements.
This Work Order has no WebMCP scope or model-specific override.

**Handoff result (2026-09-03):** `Wegener` returned `READY_FOR_VERIFICATION` from source baseline
`92802419b245628a9741a869543f8c17f779100c`. Main independently reviewed the exact six-path UI diff,
confirmed no changes outside the declared UI/navigation write set, and integrated it with the already
frozen `044-01` contract at `9ed906b`. The complete RightSpot suite passed `184/184`; typecheck,
production build, repository validation, validator tests, sensitive scan, and `git diff --check` all
passed. The build emitted the existing dynamic filesystem tracing warning for the Operations SQLite
path; this remains a deployment residual and is not a product success claim. Independent integrated
browser/API verification is now the only remaining 044 gate.

#### Allowed write set

```text
app/agent/operations/page.tsx
src/ui/agent/operations/operations-page.tsx
src/ui/agent/operations/operations-api.ts
src/ui/agent/operations/operations.module.css
src/ui/shared/session-nav.tsx
tests/ui/operations-page.test.ts
```

#### Required behavior

- Use `RolePageFrame` with `requiredRole="agent"` and `currentPath="/agent/operations"`.
- Add an Agent-only Operations navigation entry without exposing it to Tenant sessions.
- Keep `/agent` queue active only for the queue route and request-detail family; mark Operations
  active only on `/agent/operations`.
- Render both manual query families using the API contract; do not duplicate projection predicates.
- Show structured applied filters, current metadata, exact counts, and visible result rows.
- Provide truthful loading, valid empty, validation, service, stale/authority, and retry/clear
  recovery states. No silent fallback to another query or stale successful result.
- Preserve keyboard focus, semantic headings/labels, visible focus, a first-Tab skip-link path, and
  usable 320px, 768px, and desktop layouts without horizontal clipping.
- Link upcoming-viewing rows only to existing authorized Agent request routes; do not create a new
  listing-detail route in this Work Order.

#### Stop conditions

Stop if the UI needs global CSS redesign, a new shared shell contract, new domain data, WebMCP
registration, charts, natural-language parsing, a new route family, or a third query capability.

### RS-WO-044-03 — Independent integrated verification

**Role:** Independent browser/API Verifier  
**Status:** `CLOSED_VERIFIED`  
**Parallelization:** `READ_ONLY` — no source, task, fixture, or documentation writes.  
**Risk profile:** `Assured` for cross-role, data-authority, error, and responsive claims.

**Supporting worker:** Multi-agent Independent Browser/API Verifier `01a06553-2741-7310-8437-e37f7f7f05f3`
(`Ptolemy`)

**Dispatch record (2026-09-03):** Main dispatched this read-only verification after the manual
Operations source was reviewed and integrated at `f884879`. The verifier received the full repository
instruction surface, `RIGHTSPOT-044`, `ADR-RS-0016`, the exact verification matrix, fresh-state and
privacy constraints, evidence discipline, and claim limits. It must not modify source, fixtures beyond
bounded reversible reset, task files, or documentation.

**Verifier handoff (2026-09-03):** `Ptolemy` returned `NEEDS_REPAIR` only because the signed-out
browser context recorded the pre-existing shell request `GET /favicon.ico → 404` and the expected
`GET /api/session → 401` as raw console/network events. The declared Operations checks otherwise passed:
signed-out/Tenant/Agent role boundaries, both query families and filters, London `[from,to)` semantics,
empty and bounded failures, relay non-mutation, existing request drill-down, 320px/768px/1440px
no-overflow, first-Tab skip-link entry, Agent Operations console, and no uncaught page error. Fresh
relay generation `88` and Operations generation `2` were used; the final session was cleared.

**Main disposition (2026-09-03):** `RS-WO-044-03` is accepted as `CLOSED_VERIFIED` for its declared
manual Operations scope. The `401` is the intentional signed-out session boundary, not an application
exception; the favicon `404` is a known pre-existing shell resource explicitly outside this Task's
write set and previously classified as an expected residual by the navigation/viewport Tasks. No
Operations repair, session-contract change, favicon Task, or scope expansion is authorized by this
closure. The local claim is therefore “no Operations page error or uncaught exception”; it is not a
claim that every raw browser network-status event is zero.

The Verifier must use the frozen integrated Main source and fresh, separately resettable relay and
Operations profiles. It must verify:

- signed-out, Tenant, valid Agent, and wrong-role route/API boundaries;
- both query families, filter combinations, London date boundaries, exact counts, and truncation;
- empty, malformed, unknown-parameter, invalid-authority, and persistence-failure outcomes;
- no relay fixture mutation and no tenant/private field exposure;
- Agent-only navigation and page entry, manual recovery, request drill-down, keyboard access, 320px
  layout, and browser console/page-error state;
- no WebMCP, external-auth, Cloud Receiver, deployment, or production claim.

Return `VERIFIED`, `NEEDS_REPAIR`, or `BLOCKED` with exact source identity, commands, evidence, and
claim limits. A Builder self-check is not independent evidence.

## Overall acceptance criteria

1. An Agent can enter `/agent/operations` through a visible Agent-only navigation link.
2. The manual page can run both accepted read-only query families through the new HTTP consumer.
3. Query behavior and result envelopes remain authoritative to the existing Operations projection.
4. Role, assignment, privacy, invalid-input, persistence, empty, and authority-failure boundaries are
   explicit and truthful.
5. The relay workflow and existing Tenant/Agent surfaces remain behaviorally unchanged.
6. Loading, recovery, accessibility, and responsive behavior are usable without WebMCP.
7. Focused TDD, complete static/build/repository checks, and fresh integrated browser/API evidence
   pass at the declared local claim level.
8. Relevant current status, roadmap, task, decision, and evidence records are updated before closure.

## Non-goals

- No WebMCP registration or Agent-runtime integration.
- No natural-language parser, generic query tool, SQL, chart, saved report, scheduling, export,
  notification, or Re-entry grant.
- No mutation, external communication, external authentication, Cloud Receiver, Redis, WebRTC,
  reporting provider, deployment, or production-readiness work.
- No history, relisting lineage, occupancy, lease facts, Favourite/Information Request metrics, real
  tenant identity, contact data, or new Agent listing-detail authority.
- No change to the Operations authority or pure projection paths.

## Closure gate

Close `RIGHTSPOT-044` only after all three Work Orders pass their gates, the integrated source is
independently verified, relevant canonical documents are reconciled, and the Main Worktree is the
only current source authority. A later page-bound WebMCP capability requires a new decision and
separate Task after this manual surface is verified.

## Reopen condition

Reopen if the Operations page needs historical metrics, new lifecycle semantics, Favourite or
Information Request signals, a new listing-detail authority, mutation, external communication,
natural-language interpretation, or WebMCP before the manual read surface is closed.
