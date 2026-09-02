# RIGHTSPOT-038: Recover the Agent request detail after a stale action conflict

**Type:** `defect`  
**Lifecycle:** `closed`  
**Priority:** `P1` for Agent action recovery and workflow-state comprehension  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-02  
**Depends on:** `RS-FLOW-08` assigned request detail, `RS-FLOW-09` response preparation, the
existing optimistic-concurrency API contract, and the `RIGHTSPOT-037` latest-read presentation gate

## Task Control

- Type: `defect`
- Lifecycle: `closed`
- Priority: `P1` — a recoverable stale Agent action can leave the page presenting a false unavailable
  surface instead of the authoritative request returned by its recovery read.
- Owner: Main RightSpot thread
- Current increment: Closed after proving and repairing the Agent request-detail stale-action recovery
  boundary without changing server authority, workflow transitions, or the API contract.
- Next gate: None for this bounded outcome; return to the Main-thread cross-layer audit.
- Execution posture: `MAIN_THREAD_SERIAL`; no supporting implementation Worktree is required for this
  local consumer-only repair.
- Evidence status: `CLOSED_VERIFIED`; controlled browser reproduction at fixture generation `50`,
  repair verification at generations `51`–`53`, and final reset at generation `54`.
- Reopen condition: A later stale action can still leave an authoritative successful recovery read
  hidden behind an error/unavailable surface, or the repair shows a false success or stale action.

## Verified problem

At fixture generation `50`, an isolated browser session created and explicitly submitted
`request-1` through the tenant UI, then opened the assigned Agent request detail. A page-local
concurrency harness intercepted the UI's `Start review` request, submitted the same server-authorized
command first with a different command identifier, and allowed the original stale command to continue.
The competing command returned `200` with the authoritative request at `AGENT_REVIEWING` version `3`;
the original command correctly returned `409`.

The Agent consumer then performed its existing recovery `readAgentRequest(requestId)` successfully, but
the rendered page contained all of the following instead of the recovered request detail:

- `The workflow changed before that action completed. The latest request state is shown below.`;
- `Request workspace unavailable`;
- `Retry request read`; and
- no current `AGENT_REVIEWING` detail or preparation surface.

The server state was correct and the recovery response contained the full current request, listing, and
availability projection. The defect is therefore in the local Agent consumer's error-state lifecycle:
the successful recovery read updates `detail` but leaves the prior `error` truthy, so the
`!error && detail` render branch remains suppressed. No private data crossed the boundary and no
additional product state was invented by the harness.

## Classification and impact

`F-16` is a `VERIFIED_DEFECT` in the Agent action-conflict recovery presentation boundary.

- Workflow integrity: the stale command remains rejected; the competing command is the only server
  mutation. No state-machine repair is authorized by this finding.
- User impact: an Agent cannot see or continue the authoritative request after a recoverable conflict
  without an unnecessary second retry, and the page incorrectly describes the workspace as unavailable.
- Truthfulness boundary: the conflict must remain visible as non-success feedback, while the successful
  recovery projection must be rendered and its current actions must follow the returned state.
- Scope: the Agent request-detail consumer's local feedback/read lifecycle only. Queue, listing-interest,
  tenant, API, domain, persistence, and shared contract behavior are not implicated.

## Bounded objective

1. When an Agent mutation returns a stale/optimistic-concurrency `409` and the immediate authoritative
   detail read succeeds, render that current detail and its state-appropriate actions.
2. Preserve a visible, non-success conflict explanation; do not label the recovery as an ordinary
   success and do not hide the fact that the attempted action did not win.
3. If the recovery read fails, keep the bounded error/unavailable/retry surface and do not fabricate
   detail or action state.
4. Preserve the existing successful review, preparation, send, terminal read-only, role/privacy,
   version, fixture-generation, loading, retry, and server-authority behavior.
5. Cover the boundary with a focused TDD source/UI contract and a fresh isolated browser conflict
   reproduction plus recovery check.

## Accepted behavior and boundary

- A successful mutation still replaces the detail from the server response and shows its existing
  success notice.
- A stale mutation remains a failed attempted action; it must not be presented as a successful action.
- If the follow-up detail read succeeds, the page renders the returned detail. A neutral/info conflict
  notice may remain above it, but it must not suppress the detail or imply that the attempted mutation
  succeeded.
- If the follow-up detail read fails, the page shows a bounded error and retry action without retained
  request facts or state-changing controls.
- The server remains the sole authority for request state, version, availability, and action eligibility.

## Non-goals and forbidden expansion

- No API route, response DTO, parser, domain transition, persistence, fixture, or workflow contract
  change.
- No change to optimistic concurrency, command identifiers, conflict status codes, role authorization,
  tenant privacy, queue grouping, terminal-state semantics, or listing-interest projection.
- No automatic retry loop, polling, timeout, offline mode, stale cache, optimistic state patch, or
  generic data-fetching abstraction.
- No new notification, chat, auth, Information Request, Operations, WebMCP, Cloud Receiver, WebRTC,
  Redis, deployment, or production-readiness behavior.
- No changes to tenant surfaces, shared navigation, global CSS, dependencies, generated output, runtime
  database schema, Git refs/commits, Worktree lifecycle, user browser tabs, or unrelated collaborator
  files.

## Work Order

### RS-WO-038-01 — Restore authoritative Agent detail after a stale action recovery read

**Role:** Main-thread Builder, verifier, and integration authority  
**Status:** `CLOSED_VERIFIED`  
**Execution state:** `MAIN_THREAD_TDD_VERIFIED`  
**Owner:** Main RightSpot thread  
**Parallelization:** `SERIAL_AGENT_DETAIL_CONFLICT_RECOVERY` — do not run another writer against the
Agent request-detail consumer or its focused contract.

### Required read set

- `src/ui/agent/agent-request-page.tsx`
- `src/ui/agent/agent-api.ts`
- `src/ui/shared/status-banner.tsx`
- `tests/ui/agent-api.test.ts`
- `tests/ui/agent-read-failure-surfaces.test.ts`
- `Docs/07-business-flows-and-scenarios.md`
- `Docs/06-validation-and-evidence.md`
- `RUNBOOK.md`

### Main write set

- `src/ui/agent/agent-request-page.tsx` — local conflict feedback and successful recovery render
  lifecycle only
- `tests/ui/agent-conflict-recovery.test.ts` — focused TDD source/UI contract
- this Task File
- `Docs/Tasks/README.md`
- canonical flow, validation, audit, current-status, roadmap, and Runbook records during closure

### Forbidden set

- all files under `src/server/`, `src/shared/contracts/`, API routes, persistence, fixtures, and
  dependencies
- tenant UI, Agent queue, Agent listing-interest, shared navigation, global CSS, auth/session, and
  Operations source
- request state definitions, mutation payloads, version/generation guards, role/privacy projections,
  or server error vocabulary
- generated `.next/` output, browser tabs belonging to the user, Git refs/commits, Worktree lifecycle,
  and unrelated dirty/untracked paths

### Generated/local-only set

`.next/`, disposable fixture database state, isolated `agent-browser` state, screenshots, and server
logs are evidence artifacts only and must not become tracked product source.

## TDD execution contract

### Red

Add the focused source/UI contract before changing the consumer. It must fail against the registered
source because the stale-conflict branch sets an error, successfully calls `readAgentRequest`, and sets
`detail` without clearing the error or moving the conflict explanation into non-error feedback. The
contract must require that a successful recovery read can coexist with rendered detail and that a
failed recovery remains bounded; it must not require a new state abstraction or server field.

### Green

Make the smallest local repair that:

1. clears the blocking error only after the recovery detail read succeeds;
2. preserves a visible neutral/info conflict explanation rather than a false success;
3. keeps the existing bounded error/retry surface when recovery fails; and
4. leaves all normal mutation success and state/action rendering unchanged.

Do not clear the error before the recovery read, silently treat the stale action as successful, or
render retained detail when the recovery read fails.

### Refactor

Only simplify local feedback state if it makes the three outcomes (normal success, recovered conflict,
recovery failure) clearer. Do not create a generic request-state or fetch framework.

## Verification and closure gate

- Focused TDD contract records Red against the registered Main source and Green after the bounded repair.
- Pinned `npm test`, `npm run test:foundation`, `npm run typecheck`, `npm run build`, repository
  validators, sensitive scan where required, and `git diff --check` pass.
- Fresh isolated browser evidence starts from a reset fixture, creates and submits one request,
  induces one controlled stale Agent action, confirms the authoritative recovery detail and
  state-appropriate surface are rendered with conflict feedback, and confirms a recovery-read failure
  still withholds detail/actions.
- Browser evidence checks the accepted responsive floor, keyboard reachability of the recovered action
  and retry boundary, and no application page/console errors. Harness limitations must be distinguished
  from ordinary transport claims.
- Exact-path review confirms no server/API/domain/persistence/shared-contract/CSS/dependency/workflow
  behavior changed.
- Task File, Task index, Flow 8/9/18 catalogue entries, validation, audit, roadmap, Current Status,
  and Runbook agree before the Task is marked `CLOSED_VERIFIED`.

## Closure evidence — 2026-09-02

- The focused contract was intentionally Red with `2` failing assertions against the registered
  source, then Green with `2/2` passing after the local consumer repair. The full pinned suite now
  passes `153/153` across `37` authored test files; the foundation check passes `6/6`.
- Pinned `npm run typecheck`, `npm run build`, `python3 scripts/test_validators.py` (`6/6`),
  `python3 scripts/test_sensitive_scan.py` (`3/3`), `python3 scripts/validate_docs.py`, and
  `git diff --check` pass. The build produced no source or dependency changes.
- Fresh isolated browser generation `51` reproduced a competing review command returning `200`, the
  original stale action returning `409`, and a successful recovery read returning the authoritative
  `AGENT_REVIEWING` request at version `3`; the page showed the neutral conflict notice and current
  preparation surface, without `Request workspace unavailable` or `Retry request read`.
- Fresh isolated browser generation `52` used the same controlled stale-action setup but forced the
  recovery read to fail with `503`; the page showed only the bounded unavailable/retry surface and
  withheld the request detail and actions. Supplemental generation `53` confirmed the successful
  recovered surface at `320px` with body/document widths both `320px`, keyboard traversal reaching
  `Save prepared response`, and the failed surface's first Tab reaching `Retry request read`.
  `agent-browser errors` was empty for the exercised pages; console output was limited to normal
  React DevTools/HMR development messages.
- The final isolated browser session was closed, the disposable fixture was reset to generation `54`,
  and `/api/health` returned `{"ok":true,"service":"rightspot"}`. No supporting Worktree was opened;
  the canonical Main Worktree remains the only source authority. No server, API, DTO, domain,
  persistence, workflow, role/privacy, tenant, queue, dependency, CSS, or external-integration path
  changed for this Task.

`F-16`, `RIGHTSPOT-038`, and `RS-WO-038-01` are therefore `CLOSED_VERIFIED` within the Agent
request-detail stale-action recovery presentation boundary. The conflict remains a failed attempted
action, while a successful recovery read is rendered as authoritative current detail; a failed
recovery remains fail-closed. This closure does not claim external authentication, deployment,
WebMCP, Cloud Receiver, WebRTC, Redis, or production readiness.

## Source identity and integration boundary

- Repository root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`
- RightSpot package root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot`
- Registration source: canonical Main Worktree, branch `main`, HEAD
  `4224f3ae53f6d4be87a7be17e74532f5785357b0`
- Runtime baseline: `/Users/alex/.local/share/rightspot/node-v24.20.0-darwin-arm64/bin`, Node.js
  `v24.20.0`, npm `11.19.0`
- Worktree state: one canonical Main Worktree with mixed existing dirty/untracked paths. Preserve
  them; do not stage, commit, restore, or broadly reformat them under this Work Order.

## Stop and reopen conditions

Stop before Green if the repair requires a server/API/contract/state change, a new shared-file owner,
or an ambiguity about whether a stale action actually committed. Stop before closure if a successful
recovery read remains hidden, the conflict is presented as success, the failed-recovery path renders
guessed/stale detail, or any forbidden path changes.

## Registration note

This Task was registered from the 2026-09-02 Main-thread cross-layer audit after the controlled
generation-`50` reproduction described above. The competing command returned `200`, the stale UI
command returned `409`, and the existing recovery read returned the authoritative `AGENT_REVIEWING`
version `3` detail; the consumer nevertheless stayed on its unavailable branch. The finding is one
Agent detail recovery outcome and therefore belongs in one serial Work Order, not separate review,
read, and UI Tasks.
