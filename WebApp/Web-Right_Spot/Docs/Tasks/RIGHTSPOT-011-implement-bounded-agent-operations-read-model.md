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
- Current increment: `RS-WO-011-01` is the only active implementation slice. It owns a new pure
  projection module and focused tests; later API, dashboard, and WebMCP coupling remain deferred.
- Next gate: Dispatch `RS-WO-011-01` in an isolated Worktree, freeze its candidate, then assign an
  independent Verifier. Do not start a consumer or integration Work Order until this seam is verified.
- Execution posture: `CONTRACT_SEAM_BUILDER_READY`; this task is intentionally independent of the
  active Field Desk verification wave and the unresolved 008/009 semantic boundaries.

## Accepted implementation boundary

ADR-RS-0011 accepts only a pure server-side projection over the existing authoritative workflow. It
may read existing listings, availability slots, Viewing Request state, and injected time. It must
enforce the assigned-agent boundary, omit tenant/private fields, preserve exact existing statuses,
and produce no writes or external effects.

The projection is a stable seam for a later Agent Operations page. It is not the page, API route,
WebMCP capability, analytics warehouse, historical event model, or natural-language query system.

## RS-WO-011-01 — Implement the Operations projection seam

**Role:** Persistent Codex task/thread Builder → later independent Verifier  
**Status:** `READY_TO_DISPATCH`  
**Parallelization:** `CONTRACT_PARALLEL_NEW_MODULE` — may run in parallel with the active Field Desk
Verifier Work Orders because it writes only new, isolated module/test paths and has no shared product
write set.  
**Risk profile:** `Standard` — pure read-model logic with an explicit privacy and non-mutation gate.  
**Dependency:** ADR-RS-0011 and the accepted existing `WorkflowState`/`Actor` types; no dependency on
`RIGHTSPOT-008` or `RIGHTSPOT-009`.  
**Source baseline:** Main-thread baseline will be captured immediately before dispatch from the
reviewed main commit; untracked collaborator-owned files remain outside the source set.  
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

## Closure gate

Close this task only after the bounded projection candidate is independently verified and the main
thread records whether the next API/dashboard consumer is authorized. A verified seam alone does not
claim that the Agent Operations dashboard or WebMCP capability exists.

## Reopen condition

Reopen this task if the authoritative workflow state changes, the projection needs historical data or
PII, a new metric is requested, or a consumer cannot use the seam without changing existing domain,
privacy, persistence, or API authority.
