# RIGHTSPOT-045: Prevent stale Operations reads from overwriting the latest query

**Type:** `defect`  
**Lifecycle:** `in_progress`  
**Priority:** `P2` for Agent Operations result truthfulness  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-03  
**Finding:** `F-22` — Operations consumer latest-read race  
**Depends on:** closed `RIGHTSPOT-044`, [ADR-RS-0016](../Decisions/ADR-RS-0016-agent-operations-manual-read-surface-boundary.md), and the frozen Operations HTTP contract

## Task control

- Type: `defect`
- Lifecycle: `in_progress`
- Execution posture: `BUILDER_ACTIVE`
- Objective: make the Operations page adopt results, errors, and loading completion only for its latest
  logical read, so the displayed result cannot contradict the current report/query context.
- Current increment: The consumer-only latest-read sequencing repair is with the bounded UI Builder;
  focused TDD and independent integrated verification remain required.
- Next gate: Dispatch one bounded UI Builder, review the exact diff in Main, freeze the source, then
  dispatch one independent browser/API Verifier.
- Evidence status: `VERIFIED_DEFECT_BUILDER_ACTIVE` — static control-flow evidence is high confidence;
  a browser race was not reproduced in the audit harness, so no new runtime reproduction is claimed.
- Supporting worker: UI Builder `01a06569-e047-7251-a574-e9c1e077f0a6` (`Aristotle`).
- Parent role: This is one registered Task File. Builder and Verifier are sequential Work Order
  checkpoints under this file, not additional Tasks.
- Blocking status: Non-blocking to `RIGHTSPOT-012` and to already-closed Search/Operations claims.

## Verified problem

`src/ui/agent/operations/operations-page.tsx` starts an asynchronous `readOperations` call and adopts
every later success, error, and `finally` state update. It has no request sequence, query identity, or
abort guard. If an earlier read resolves after a later report/query has become current, the old response
can be stored by `setResponse` and displayed beside the newer controls. The same ordering can leave an
old error or old loading completion attached to the newer read.

The audit identified two bounded triggers:

1. the initial or `listingPipeline` read remains pending while the Agent changes to
   `upcomingViewings`; and
2. two logical reads overlap or are triggered in quick succession and the first response arrives last.

The static path is sufficient to classify this as a real consumer defect even though the current audit
browser harness did not add a controlled delayed-response reproduction. The existing 044 evidence still
stands for the ordinary successful page/API behavior, role/privacy boundary, projection, error classes,
responsive layout, and accessibility surface.

## Bounded objective

1. Establish one monotonically latest logical read for the Operations consumer.
2. Ensure an older success, error, or completion callback cannot replace, clear, or finish the newer
   query's state.
3. Ensure a response is rendered only in the context in which it was requested; selected report and
   applied filters must not contradict one another.
4. Preserve the existing two query families, strict client validation, server-owned response envelope,
   valid empty results, bounded errors, retry and clear controls, role boundary, navigation, and manual
   page contract.
5. Prove the boundary with focused Red → Green → Refactor tests and independent integrated browser/API
   verification where the harness can control response ordering.

## Accepted repair boundary

- The repair is local to the Operations page consumer and its focused UI/source contract.
- A sequence/token guard is required. An `AbortController` is optional only if it remains a local
  transport optimization and does not change the API or error contract; correctness must not depend on
  abort support because an already-resolved or non-abortable response still needs the latest guard.
- Starting a new logical read invalidates the previous read. Changing the report context while a read is
  pending must not allow the old read to reappear as the result for the new context.
- Only the latest read may clear `isLoading`, publish `response`, publish `error`, or perform any
  equivalent state transition. Stale callbacks must be inert and must not surface a new user-facing
  error.
- Retry remains an explicit user action. There is no automatic retry, polling, debounce, cache, or
  stale-while-revalidate behavior.
- Valid empty results remain a successful, explicit empty state. A stale empty result is treated like any
  other stale result and must not overwrite the latest query.
- Unmount/teardown must not produce a state update or an uncaught page error.

## Non-goals and forbidden expansion

- No Operations API route, shared contract, application projection, persistence, fixture, session, role,
  privacy, or domain workflow change.
- No new report family, filter, sorting, pagination, chart, export, notification, mutation, or
  WebMCP registration.
- No redesign of the Operations page, shared navigation, global CSS, auth, Tenant surfaces, Agent
  request workflow, Search, Cloud Receiver, external authentication, WebRTC, Redis, deployment, or
  production-readiness behavior.
- No generic data-fetching abstraction, global async framework, retry loop, timeout policy, or new
  dependency.
- No fixture mutation except disposable verification setup; no generated output or browser evidence in
  the authored write set.
- No modification, staging, commit, push, deletion, or cleanup of unrelated Web-Game, research,
  sibling, or collaborator-owned artifacts.

## Work Order

### RS-WO-045-01 — Operations consumer latest-read repair

**Role:** UI Builder  
**Status:** `IN_PROGRESS`  
**Parallelization:** `SERIAL_OPERATIONS_CONSUMER` — no other writer may modify the Operations page or
its focused test during this Work Order.  
**Risk profile:** `Bounded P2` — one client async lifecycle boundary; no server or shared contract change.  
**Owner:** Supporting UI Builder under Main review  
**Main authority:** Main owns scope, source identity, exact-path review, integration, documentation,
and closure.

**Dispatch record (2026-09-03):** Main dispatched this bounded consumer-only repair to supporting UI
Builder `Aristotle` (`01a06569-e047-7251-a574-e9c1e077f0a6`) from the documented Main baseline
`20dbd1a`. The dispatch included the full repository instruction surface, this Task File, the closed
044 contract, exact read/write/forbidden sets, Red → Green → Refactor requirements, and handoff gates.
It explicitly excludes WebMCP, API/domain/projection/persistence/fixture changes, and Git operations.

#### Read set

```text
src/ui/agent/operations/operations-page.tsx
src/ui/agent/operations/operations-api.ts
tests/ui/operations-page.test.ts
RIGHTSPOT-044 Task File
ADR-RS-0016
Docs/07-business-flows-and-scenarios.md
Docs/06-validation-and-evidence.md
RUNBOOK.md
```

#### Allowed write set

```text
src/ui/agent/operations/operations-page.tsx
tests/ui/operations-page.test.ts
```

Main may update this Task File and canonical status/evidence/roadmap records during handoff and
closure. The Builder must not edit those documents.

#### Forbidden set

```text
src/server/
src/shared/contracts/
src/ui/agent/operations/operations-api.ts
app/api/agent/operations/
src/ui/shared/
src/ui/tenant/
tests outside tests/ui/operations-page.test.ts
package.json
package-lock.json
fixture/persistence/database files
```

Also forbidden: WebMCP, direct persistence access, role/session changes, shared navigation, global CSS,
new dependencies, Git refs/commits, Worktree lifecycle, generated `.next/`, and unrelated dirty or
untracked files.

#### Required TDD sequence

**Red:** Add a focused source/UI contract that fails against the current Main source and demonstrates
that a late older result cannot win. The contract should cover at least:

- a newer logical query invalidates an older one before the older success resolves;
- a late older error cannot replace a newer success or error;
- stale `finally` cannot clear the newer loading state; and
- the page keeps the existing explicit loading, empty, result, validation, and retry states.

The test must verify the user-visible/latest-state rule without coupling the implementation to a
particular hook or helper name.

**Green:** Implement the smallest local latest-read guard. It may use a sequence ref and, if useful,
an abort controller, but it must keep all domain semantics and the existing `readOperations` contract.
Stale callbacks must not call response/error/loading state setters.

**Refactor:** Remove only local duplication needed to make the latest-read lifecycle legible. Do not
introduce a generic fetch framework or broaden the consumer boundary.

#### Handoff evidence

The Builder must return:

- exact changed paths and confirmation that every path is in the allowed write set;
- focused Red → Green results and complete `npm test` results;
- `npm run typecheck`, production build, repository validators, sensitive scan, and `git diff --check`;
- a short explanation of why old success/error/finally callbacks cannot affect the newest read; and
- explicit confirmation that API/domain/projection/fixture/WebMCP behavior is unchanged.

### RS-WO-045-02 — Independent integrated verification

**Role:** Independent browser/API Verifier  
**Status:** `NOT_YET_DISPATCHED`  
**Parallelization:** Must run after Main freezes the reviewed Builder source; no source writer may
modify the frozen Operations consumer during verification.  
**Allowed write set:** none in product source or canonical docs; disposable evidence only under the
existing local evidence boundary.  
**Read set:** frozen post-Builder source, this Task File, `RIGHTSPOT-044`, ADR-RS-0016, operations
tests, runtime/browser configuration, and fixture-reset instructions.

The Verifier must attempt a controlled delayed-response race where possible:

1. begin one Operations query;
2. begin or simulate a newer query/context;
3. resolve the older response after the newer response or error; and
4. confirm that only the newest query's loading/result/error/empty context is rendered.

The verification must also recheck the unchanged 044 boundaries that could be affected by the repair:
Agent-only access, both query families, strict filters, exact counts, valid empty results, bounded
errors/retry, request drill-down, keyboard/skip-link access, 320px/768px/desktop no-overflow, no
mutation, and no uncaught application errors. If the harness cannot control timing, report that as a
harness limitation and retain the static contract evidence; do not claim a browser race pass.

## Acceptance criteria

- No older success, error, empty result, or `finally` callback can overwrite or clear the latest read.
- The visible applied filters and result envelope always refer to the same logical query.
- Report-context changes during a pending read cannot resurrect the previous report's result.
- Loading, retry, validation, service, empty, and success states remain explicit and truthful.
- Retry is still manual; there is no hidden fallback, automatic retry, polling, or stale-result display.
- Existing Operations API, projection, DTO, role/privacy, navigation, and fixture behavior are unchanged.
- Focused TDD Red → Green → Refactor, complete tests, typecheck, build, repository validators,
  sensitive scan, and diff checks pass.
- Independent verification reports controlled race evidence if available and confirms the unchanged
  044 surface boundaries.
- The final Task record and canonical status/evidence docs distinguish static proof, browser proof,
  harness limitations, residuals, and non-claims.

## Stop and reopen conditions

Stop and return to Main review if the repair requires changing the API response, shared contract,
server authority, persistence, fixture, session/role boundary, WebMCP lifecycle, shared navigation, or
a new dependency; if a stale result remains visible after a controlled late response; if the latest
error or loading state can be cleared by an older callback; or if the proposed fix needs a generic
async framework or a broader UI redesign.

Reopen after closure only if a later audit reproduces an Operations result/error/loading mismatch from
an older logical read within this page, or if a future WebMCP adapter introduces a separate async
lifecycle contract that is not covered by this consumer repair.

## Closure gate

This Task may be closed only when Main has reviewed the exact diff, frozen the integrated source,
accepted the focused and complete static checks, and recorded independent verification or an explicit
harness limitation. Closure must state that the repair is limited to the Operations manual consumer
latest-read boundary and does not expand the accepted Operations or WebMCP capability.
