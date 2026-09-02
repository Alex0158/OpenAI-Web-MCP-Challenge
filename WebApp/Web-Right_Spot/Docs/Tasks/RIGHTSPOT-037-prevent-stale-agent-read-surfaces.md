# RIGHTSPOT-037: Prevent stale Agent read surfaces after a failed refresh

**Type:** `defect`  
**Lifecycle:** `closed`  
**Priority:** `P2` for Agent workspace truthfulness and action clarity  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-02  
**Depends on:** `RS-FLOW-07` Agent queue visibility, `RS-FLOW-08` assigned request detail, and the
existing server-authoritative Agent read contracts

## Task Control

- Type: `defect`
- Lifecycle: `closed`
- Priority: `P2` — a failed latest read leaves an older Agent projection visible as if it were
  current; the request-detail surface can also leave a state-changing action available.
- Owner: Main RightSpot thread
- Current increment: Withhold retained queue/detail projections while the latest Agent read is
  loading or failed, while preserving successful content and retry recovery.
- Execution posture: `CLOSED_VERIFIED`; Main-thread serial repair; no supporting implementation
  Worktree was required for this two-consumer conditional boundary.
- Evidence status: `CLOSED_VERIFIED`; queue and request detail were independently reproduced after
  successful populated reads, repaired, and rechecked at fixture generation `43`.
- Next gate: Main-thread cross-layer audit. Reopen only if a later audit reproduces stale Agent
  projection or action content after a failed latest read.
- Dependencies: None blocking; the repair must preserve the existing Agent API, optimistic version
  guards, role boundary, and active/terminal queue presentation from `RIGHTSPOT-033`.

## Verified problem

After the fixture was reset to generation `41`, an isolated browser session submitted
`request-1`, producing a populated Agent queue with `Needs review 1` and an active request card.
The same session then replaced `window.fetch` locally only for the queue read and clicked
`Refresh queue`. The rendered result contained all of the following at once:

- `Could not load the agent queue. Try again.`;
- `Retry queue read`;
- the previous `Needs review 1` count and the previous `request-1` card, still labelled `Review
  request`.

The evidence screenshot is retained at
[`var/test/audit-037-agent-queue-refresh-failure-full.png`](../../var/test/audit-037-agent-queue-refresh-failure-full.png).

The same populated request was opened at `/agent/requests/request-1`. A page-local fetch failure
was then applied only to that detail read and `Refresh request` was activated. The rendered result
contained the detail error while still showing the previous `Needs review` request facts,
availability, and the enabled `Start review` action. The evidence screenshot is retained at
[`var/test/audit-037-agent-detail-refresh-failure-full.png`](../../var/test/audit-037-agent-detail-refresh-failure-full.png).

This is not an API or state-machine failure: the failure harness prevented the latest read from
completing, while the existing React state retained the last successful response. The defect is the
consumer's error-state rendering. The server's version and fixture-generation checks remain the
authoritative protection for a later command, but that does not make stale UI truthful or make an
action presented after a failed read appropriate.

## Classification and impact

`F-15` is a `VERIFIED_DEFECT` in the Agent UI read-failure boundary.

- Queue impact: stale counts and request cards can be mistaken for the current assigned queue.
- Detail impact: stale state, tenant context, availability, and action controls can remain visible
  after the current request read failed.
- Safety boundary: no mutation was issued by the reproduction. Existing server-side version and
  role checks remain unchanged, but relying on them as a UI fallback would be incorrect.
- Scope: the same user-facing rule applies to the Agent queue and Agent request detail; the already
  correct `AgentListingInterest` error branch is a local reference, not a third repair target.

## Bounded objective

1. When the latest Agent queue read fails after a previous successful read, show the bounded error
   and retry recovery state without rendering the retained queue projection.
2. When the latest Agent request-detail read fails after a previous successful read, show the
   bounded unavailable/retry state without rendering retained request facts, availability, response
   preparation, or action controls.
3. During a refresh in progress, make the existing loading state explicit rather than presenting the
   retained projection as the completed current read.
4. Preserve the existing successful queue grouping/counts, active/terminal labels, request links,
   detail actions, error copy, role authorization, privacy boundary, refresh controls, and server
   contracts.
5. Add focused TDD source/UI contracts for both consumers, then verify fresh browser failure and
   successful retry recovery.

## Accepted behavior and boundary

- Initial Agent reads keep their current loading, success, and error behavior.
- A successful queue/detail read renders the returned server response exactly as it does now.
- While `Refresh queue` or `Refresh request` is in flight, the page exposes a visible busy/loading
  state and does not imply that the retained response is the completed current read.
- If that read fails, the corresponding projection is withheld. The user sees a clear error and a
  retry action, with no stale metric, card, request detail, availability, preparation panel, or
  state-changing action rendered underneath it.
- A later successful retry replaces the withheld response and restores the normal bounded surface
  from the server response.
- The queue remains the only place that groups active and terminal requests; the detail route keeps
  its existing state/action rules after a successful read.
- `TENANT_DRAFT` privacy, assigned-agent authorization, optimistic version checks, fixture
  generation, and all server-owned state remain unchanged.

## Non-goals and forbidden expansion

- No server route, DTO, parser, domain state transition, projection, persistence, fixture, or API
  contract change.
- No change to queue state definitions, terminal-history grouping, request-detail workflow actions,
  command payloads, optimistic concurrency, or role/session behavior.
- No generic stale-data cache, polling, retry loop, timeout, offline mode, toast framework, or new
  dependency.
- No redesign of Agent listing interest, tenant surfaces, shared navigation, CSS tokens, auth,
  Information Request, Operations, WebMCP, Cloud Receiver, WebRTC, Redis, deployment, or
  production-readiness behavior.
- No generated output, browser tabs belonging to the user, server configuration, Git refs/commits,
  Worktree lifecycle, outer `Web-Game` files, or unrelated collaborator changes.

## Work Order

### RS-WO-037-01 — Withhold retained Agent projections after failed latest reads

**Role:** Main-thread Builder and integration authority; focused TDD verification followed by full
static and browser verification  
**Pre-dispatch status:** `MAIN_THREAD_ACTIVE`  
**Execution state:** `CLOSED_VERIFIED`  
**Owner:** Main RightSpot thread  
**Parallelization:** `SERIAL_AGENT_READ_FAILURE_SURFACES` — queue and request detail implement one
truthfulness boundary across two consumers; do not run concurrent writers against either component.  
**Execution profile:** `Standard` — two local render guards, one focused source/UI contract, and
documentation reconciliation; no API or dependency work.

### Required read set

- `src/ui/agent/agent-dashboard-page.tsx`
- `src/ui/agent/agent-request-page.tsx`
- `src/ui/agent/agent-listing-interest.tsx` — reference for the existing error/loading boundary
- `src/ui/agent/agent-api.ts`
- `tests/ui/agent-queue-presentation.test.ts`
- `Docs/07-business-flows-and-scenarios.md`
- `Docs/06-validation-and-evidence.md`
- `RUNBOOK.md`

### Main write set

- `src/ui/agent/agent-dashboard-page.tsx` — latest-read loading/error/render boundary only
- `src/ui/agent/agent-request-page.tsx` — latest-read loading/error/render boundary only
- `tests/ui/agent-read-failure-surfaces.test.ts` — focused TDD source/UI contracts
- this Task File
- `Docs/Tasks/README.md`
- canonical status, flow, validation, audit, roadmap, and Runbook records during closure

### Forbidden set

- All files under `src/server/`, `src/shared/contracts/`, persistence, API route handlers, and
  workflow fixtures
- `src/ui/agent/agent-api.ts`, `src/ui/agent/agent-listing-interest.tsx`, tenant surfaces, shared
  navigation, global CSS, auth/session, dependencies, media, and Operations
- queue state arrays, active/terminal grouping, request-detail action semantics, response payloads,
  version/generation checks, or role/privacy rules
- user browser tabs, generated `.next/` output, Git refs/commits, Worktree lifecycle, and unrelated
  dirty files

### Generated/local-only set

`.next/`, disposable fixture database state, isolated `agent-browser` state, screenshots, and server
logs are evidence artifacts only and must not become tracked product source.

## TDD execution contract

### Red

Add the focused contract before changing either component. It must fail against the registered Main
source because:

- `AgentQueue` renders `QueueContent` whenever `queue` exists, even when `error` is present, and
  does not expose a refresh loading branch for the retained projection;
- `AgentRequestWorkspace` renders `RequestSummary` and action panels whenever `detail` exists,
  even when `error` is present, and only treats `isLoading` as a loading branch.

The contract must assert the user-visible boundary — no retained queue/detail projection is rendered
while the latest read is loading or failed — without coupling to CSS class names or introducing a
new state abstraction.

### Green

Make the smallest local change that:

1. gates queue content on a successful, non-loading, non-error read;
2. gates request-detail content and action panels on a successful, non-loading, non-error read;
3. shows the existing bounded loading surface during refresh; and
4. leaves successful content, error/retry controls, APIs, and workflow actions unchanged.

Do not clear server response state as a substitute for a truthful render boundary, add an arbitrary
retry, or infer a new server state.

### Refactor

Remove only duplication that makes the two read boundaries clearer. Keep the rule local to the two
Agent consumers; do not create a generic data-fetching framework or broaden the repair to other
surfaces already covered by a separate contract.

## Recorded closure evidence — 2026-09-02

- Focused TDD source contract: Red failed `2/2` because the queue and detail consumers did not
  gate retained content on `error`/`isRefreshing`; Green passed `2/2` after the two local render
  boundary changes.
- Pinned `npm test` passed `151/151` across `36` authored test files; `npm run test:foundation`
  passed `6/6`; `npm run typecheck`; production `npm run build`; and tracked-scope `git diff --check`
  all passed.
- Fresh isolated browser verification reset the fixture to generation `43`, created a real submitted
  request through the tenant UI, and confirmed populated Agent queue/detail reads. Synthetic page-local
  fetch rejection then produced only the queue error/retry state or the detail unavailable/retry state:
  stale queue counts/cards, request facts, availability, and `Start review` were absent. Restoring the
  original fetch and using each retry restored the server response and normal active request surface.
- At `320px`, both body/document scroll widths were `320`; Tab traversal reached the detail
  `Retry request read` button; the browser page-error log was empty during the failure/recovery check.
  Evidence screenshots are retained at `var/test/audit-037-agent-queue-refresh-failure-full.png` and
  `var/test/audit-037-agent-detail-refresh-failure-full.png`.
- Exact-path review confirms the product repair changed only the two Agent consumer render guards and
  the focused source/UI contract. No server/API/domain/persistence/shared-contract/CSS/dependency,
  workflow, role/privacy, queue grouping, or listing-interest behavior changed. The fixture was reset
  to generation `44` and `/api/health` returned `{"ok":true,"service":"rightspot"}` after the browser
  gate.

The disposition is `CLOSED_VERIFIED` for the bounded Agent latest-read failure truthfulness outcome.
The repair does not claim external authentication, deployment, notifications, WebMCP, Cloud Receiver,
WebRTC, Redis, or production readiness.

## Verification and closure gate

- Focused TDD contract records Red against the registered Main source and Green after the bounded
  consumer repair.
- Pinned `npm test`, `npm run test:foundation`, `npm run typecheck`, `npm run build`, and tracked
  scope `git diff --check` pass.
- Fresh isolated browser evidence starts from a reset fixture, confirms a populated queue and detail,
  forces each latest read to fail, verifies stale projection/action absence, then restores the read
  path and verifies successful retry recovery.
- Browser evidence checks the accepted `320px` floor, keyboard reachability of retry/back controls,
  and no application console or route errors. Harness limitations must be distinguished from product
  evidence.
- Exact-path review confirms no server/API/domain/persistence/shared-contract/CSS/dependency or
  workflow behavior changed.
- The Task File, Task index, current status, Flow 7/8 catalogue, validation evidence, audit,
  roadmap, and Runbook agree on the final outcome before closure.

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

Stop before Green if truthful failure rendering requires a new API field, a new state definition,
shared-file ownership resolution, or a change to server-side action authorization. Stop before
closure if stale queue/detail content or actions remain visible after a failed latest read, successful
retry cannot restore the server response, or any out-of-scope path changes.

Reopen only if a later audit reproduces a retained Agent projection after a failed latest read within
these two consumers, or if the repair changes successful active/terminal queue or request-detail
behavior.

## Registration note

This Task was registered from the 2026-09-02 Main-thread cross-layer audit after `F-15` was
reproduced in both populated Agent queue and request-detail surfaces at fixture generation `41`.
The queue and detail failures shared one user-facing read-truthfulness outcome and therefore belonged
in one serial Work Order. The existing `AgentListingInterest` error branch was already truthful and
was not included. Main completed the bounded consumer repair, focused TDD, full static/build checks,
fresh failure/retry browser evidence, documentation reconciliation, and fixture cleanup; the Task is
now `CLOSED_VERIFIED`.
