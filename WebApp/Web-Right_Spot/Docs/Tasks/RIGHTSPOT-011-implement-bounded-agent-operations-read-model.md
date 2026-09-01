# RIGHTSPOT-011: Implement the bounded Agent Operations read-model seam

**Type:** `implementation`  
**Lifecycle:** `in_progress`  
**Priority:** `P1` for the next independent post-MVP product seam  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-01  
**Depends on:** ADR-RS-0011; the accepted local workflow/domain and persistence boundaries

## Task Control

- Type: `implementation`
- Lifecycle: `in_progress`
- Priority: `P1`
- Owner: Main RightSpot thread
- Objective: Implement and independently verify a privacy-safe, deterministic Agent Operations
  projection over existing `WorkflowState`, without adding a route, UI, persistence schema, or
  future Favourite/Information Request/WebMCP behavior.
- Current increment: `RS-WO-011-01` was independently verified and integrated at product commit
  `7ff0fbd` from frozen candidate `5b05c78ec71c849a268b31cd49e72f9b3235587e`. It adds only the pure
  projection module and its focused tests; later API, dashboard, and WebMCP coupling remain deferred.
- Next gate: The main thread must decide and register a separate consumer boundary before any route,
  API, dashboard, or WebMCP work begins. The verified seam alone does not authorize a consumer.
- Execution posture: `CONTRACT_SEAM_VERIFIED_INTEGRATED`; this task remains independent of the active
  Field Desk regression wave and the unresolved 008/009 semantic boundaries.

## Accepted implementation boundary

ADR-RS-0011 accepts only a pure server-side projection over the existing authoritative workflow. It
may read existing listings, availability slots, Viewing Request state, and injected time. It must
enforce the assigned-agent boundary, omit tenant/private fields, preserve exact existing statuses,
and produce no writes or external effects.

The projection is a stable seam for a later Agent Operations page. It is not the page, API route,
WebMCP capability, analytics warehouse, historical event model, or natural-language query system.

## RS-WO-011-01 — Implement the Operations projection seam

**Role:** Persistent Codex task/thread Builder → later independent Verifier  
**Status:** `INTEGRATED` — independently verified; product commit `7ff0fbd`  
**Parallelization:** `CONTRACT_PARALLEL_NEW_MODULE` — may run in parallel with the active Field Desk
Verifier Work Orders because it writes only new, isolated module/test paths and has no shared product
write set.  
**Risk profile:** `Standard` — pure read-model logic with an explicit privacy and non-mutation gate.  
**Dependency:** ADR-RS-0011 and the accepted existing `WorkflowState`/`Actor` types; no dependency on
`RIGHTSPOT-008` or `RIGHTSPOT-009`.  
**Source baseline:** `53ad8398d9c356914230efc6de4cc07925d49e3c` on `main`; untracked
collaborator-owned files remain outside the source set.  
**Candidate source:** `5b05c78ec71c849a268b31cd49e72f9b3235587e`; exactly the two declared new paths
are present and the Builder Worktree is clean after the main-thread T2 freeze.  
**Integration:** The main thread cherry-picked the verified candidate as product commit `7ff0fbd`.
The candidate added only the two declared paths. The independent Verifier used the frozen source
with Node `v24.20.0` / npm `11.19.0`; focused projection tests `5/5`, foundation tests `6/6`,
typecheck, build, diff checks, exact scope, authorization/privacy/status, deterministic ordering,
input/output isolation, and pure-boundary scans passed. No route, server, API, dashboard, browser,
deployment, WebMCP, Cloud Receiver, or external-service claim is made from this seam.
**Supporting task/thread:** `01a05dd7-f126-7611-9a0e-b1c3deeacbde` on host `local`.  
**Worktree:** `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-011-01-operations` on branch
`rightspot/rs-wo-011-01-operations`.  
**Ownership:** The Builder owns only the new projection module and its directly necessary focused
tests. The main thread owns canonical writeback, source freeze, integration, and closure.

### Builder objective

Create the smallest deterministic `Agent Operations` projection seam described by ADR-RS-0011. It
must accept an explicit agent actor, current `WorkflowState`, and injected ISO timestamp; return
bounded listing pipeline data, Viewing Request state counts/references, and upcoming held/confirmed
slots; and reject unauthorized actors without mutating state.

### Allowed write set

- `src/server/domain/operations-projection.ts` (new)
- `tests/domain/operations-projection.test.ts` (new)

### Required read set

- This Task File and ADR-RS-0011.
- `Docs/00-current-status.md`, `Docs/03-system-design.md`, `Docs/04-domain-and-data-model.md`,
  `Docs/05-api-and-integration-contracts.md`, and `Docs/06-validation-and-evidence.md`.
- `src/server/domain/types.ts`, `src/server/domain/errors.ts`, existing projection helpers, current
  workflow state construction, and the relevant domain/application tests.
- The package scripts, pinned Node/npm guidance, and the Thread Orchestration Pilot Runbook.

### Required behavior and acceptance

- Export a versionable projection type from the new module; do not modify shared workflow types or
  public API DTOs in this checkpoint.
- Require `actor.role === "agent"` and `actor.id === state.agentId`; reject other actors through
  the existing domain error vocabulary.
- Derive listing counts/rows from the supplied state and preserve exact `PUBLISHED`/
  `UNPUBLISHED` values. Do not expose `assignedAgentId`.
- Derive request counts/references from the supplied request and exact existing `RequestState`
  values. Omit tenant notes, private review notes, response text, command metadata, and tenant IDs.
- Include only slots with existing `HELD_FOR_PROPOSAL` or `CONFIRMED` status whose start time is not
  before the supplied `now`; never relabel a held slot as confirmed and never infer an appointment
  from a different state.
- Return deterministic ordering and explicit empty collections. Do not return synthetic zero-valued
  Favourite or Information Request metrics.
- Prove input non-mutation and the main authorization/privacy/status boundaries with focused tests.
- Run Node `24.20.0` / npm `11.19.0` checks permitted by the environment, `npm run typecheck`,
  `npm test`, the focused projection test, `npm run build`, and `git diff --check` before handoff.

### Forbidden scope and stop conditions

- Do not modify existing source files, shared types, API contracts, routes, pages, UI, persistence,
  database files, fixtures, package metadata, configuration, assets, documentation, or Git metadata.
- Do not add Favourite, Information Request, authentication, notification, analytics history,
  WebMCP, Cloud Receiver, WebRTC, natural-language query, external service, or new dependency.
- Do not query SQLite, read sessions, serialize raw workflow state, leak tenant/private fields, or
  add a hidden fallback when an input is unavailable.
- Stop and return `NEEDS_REVIEW` if the projection requires a new state, field, lifecycle rule,
  shared contract edit, route, or persistence change.

### Builder return gate

Return `READY_FOR_VERIFICATION` with exact changed paths, source identity, diff summary, runtime,
commands/results, privacy/status tests, known skipped evidence, and residual risks. Do not start the
Verifier or any consumer/integration task.

## RS-WO-011-02 — Independently verify the Operations projection seam

**Role:** Independent Verifier  
**Status:** `VERIFIED` — candidate independently verified and integrated at `7ff0fbd`  
**Parallelization:** `EVIDENCE_ONLY` — may run beside `RS-WO-007-08` because it uses a detached
snapshot and has no product write set.  
**Risk profile:** `Standard` — code-level verification of a pure, privacy-bounded projection seam.  
**Dependency:** `RS-WO-011-01` Builder handoff is frozen at candidate commit
`5b05c78ec71c849a268b31cd49e72f9b3235587e`; do not verify the moving Builder branch.  
**Source Worktree:** `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-011-02-operations-verifier`
(detached HEAD at the frozen candidate).  
**Supporting worker:** Multi-agent Verifier `01a05de3-4a06-7522-8b35-3c5ec4daab05` (`Ramanujan`).  
**Ownership:** The Verifier may inspect and execute only. The main thread owns repair, canonical
writeback, integration, and closure.

### Verifier objective

Independently determine whether the frozen Operations projection candidate implements only the
accepted ADR-RS-0011 seam: deterministic, assigned-agent-authorized, privacy-safe, non-mutating
projection over the existing `WorkflowState`. Do not design or add a consumer.

### Required read set

- This Task File, ADR-RS-0011, and the frozen candidate commit.
- `Docs/00-current-status.md`, `Docs/03-system-design.md`, `Docs/04-domain-and-data-model.md`,
  `Docs/05-api-and-integration-contracts.md`, and `Docs/06-validation-and-evidence.md`.
- Existing domain types/errors/workflow construction, relevant tests, package scripts, pinned runtime
  guidance, and the Thread Orchestration Pilot Runbook.

### Verification boundary

- Confirm the exact frozen commit, detached clean status, and that exactly the two declared new paths
  differ from the Builder baseline; no existing source, shared type, API contract, route, UI,
  persistence, fixture, configuration, documentation, or Git metadata may change.
- Use Node `24.20.0` / npm `11.19.0` and the existing lockfile. Run the focused projection tests,
  `npm run typecheck`, `npm test`, `npm run build`, and `git diff --check`.
- Inspect the projection and tests for assigned-agent authorization, exact existing status vocabulary,
  deterministic ordering, empty/current/future/past slot behavior, input/output isolation, and absence
  of tenant/private fields or synthetic Favourite/Information Request metrics.
- Confirm the pure boundary has no SQLite, session/cookie access, HTTP, environment clock, input
  mutation, hidden fallback, new dependency, or external side effect. Browser, server-start, route,
  API, deployment, and dashboard claims are outside this Work Order and must remain unclaimed.

### Forbidden actions

- Do not edit source, tests, fixtures, dependencies, configuration, documentation, database files,
  Git metadata, or the main checkout.
- Do not repair failures, weaken checks, commit, push, deploy, start a server, or dispatch a follow-on
  consumer task.
- Do not treat an invocation mistake or an unavailable browser as a product defect; report it
  separately while preserving exact evidence.

### Return gate

Return `VERIFIED`, `NEEDS_REPAIR`, or `BLOCKED` with exact source identity, changed-path result,
commands/runtime, behavior/privacy evidence, skipped checks, residual risks, and recommended next
gate. Stop after the report.

## Closure gate

Close this task only after the bounded projection candidate is independently verified and the main
thread records whether the next API/dashboard consumer is authorized. A verified seam alone does not
claim that the Agent Operations dashboard or WebMCP capability exists.

## Reopen condition

Reopen this task if the authoritative workflow state changes, the projection needs historical data or
PII, a new metric is requested, or a consumer cannot use the seam without changing existing domain,
privacy, persistence, or API authority.
