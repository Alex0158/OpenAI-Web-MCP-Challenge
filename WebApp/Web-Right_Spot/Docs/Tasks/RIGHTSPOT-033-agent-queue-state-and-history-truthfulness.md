# RIGHTSPOT-033: Make Agent queue state counts and terminal history truthful

**Type:** `defect`  
**Lifecycle:** `closed`  
**Priority:** `P2` for Agent workspace clarity and judge-facing state truthfulness  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-02  
**Depends on:** `RS-FLOW-07`, the existing Agent queue DTO, and the current terminal-state presentation
rules in [`07-business-flows-and-scenarios.md`](../07-business-flows-and-scenarios.md)

## Task Control

- Type: `defect`
- Lifecycle: `closed`
- Priority: `P2` — a confirmed request is visible inside a section presented as work needing a human
  response, while the visible count cards omit the confirmed state and show only zero actionable counts.
- Owner: Main RightSpot thread
- Current increment: Completed the presentation-only UI repair through TDD Red→Green→Refactor and
  fresh isolated browser verification within the dashboard consumer and local CSS boundary.
- Execution posture: `CLOSED_VERIFIED`
- Evidence status: `CLOSED_VERIFIED` for the queue's state-summary/history presentation; workflow
  state, API data, privacy boundary, and terminal transitions were not implicated.
- Next gate: No task-local gate remains. Continue with the next Main-thread cross-layer audit and
  register only a newly reproduced bounded gap.
- Dependencies: None beyond the current Main source and the evidence recorded below.

## Verified problem

### Controlled browser reproduction — 2026-09-02

After a fresh `npm run db:reset` (workflow fixture generation `26`), an isolated `agent-browser`
session replayed the ordinary tenant-to-agent flow against `http://127.0.0.1:3100`. The tenant
submitted a viewing request, the assigned agent sent a proposal, and the tenant confirmed it. On the
agent dashboard at `/agent`, the rendered page showed:

- the workspace heading `See what needs a human response`;
- four visible state cards: `Needs review 0`, `In review 0`, `Proposal sent 0`, and `Declined 0`;
- a `Current work` section labelled `Requests assigned to you`;
- a visible `Confirmed` request card at version `6` whose footer still said `Review request →`.

The actual browser evidence is retained at
[`var/test/audit-agent-queue-terminal-counts.png`](../../var/test/audit-agent-queue-terminal-counts.png).
The isolated run had no application console or route error. The user's in-app browser was not used.

### Source and contract evidence

The server already returns a count entry for every `WORKFLOW_REQUEST_STATES` value, and
`readAgentQueue` intentionally returns the assigned request for every non-draft state. The Agent API
parser also validates the complete state-count contract. The mismatch is in the dashboard consumer:

- `src/ui/agent/agent-dashboard-page.tsx` renders only
  `REQUEST_SUBMITTED`, `AGENT_REVIEWING`, `SLOT_PROPOSED`, and `AGENT_DECLINED` in its metric grid;
- the same component renders every returned non-draft request in one section and gives every card the
  footer `Review request →`;
- terminal labels exist for `VIEWING_CONFIRMED`, `TENANT_DECLINED`, and `EXPIRED`, but their counts
  are not shown and their cards are not distinguished as recorded outcomes;
- `src/server/application/workflow-views.ts` already supplies the missing terminal counts and does
  not need an API or domain change.

### Current versus expected behavior

| Surface | Current behavior | Required behavior |
|---|---|---|
| Workspace heading | Says the page shows work needing a human response, although terminal history is mixed in | Describe assigned request state tracking without implying every visible card is actionable |
| State counts | Shows four states, including terminal `AGENT_DECLINED`, while omitting `VIEWING_CONFIRMED`, `TENANT_DECLINED`, and `EXPIRED` | Make all seven non-draft states discoverable through clearly grouped, truthful count summaries; never expose `TENANT_DRAFT` |
| Request list | One mixed `Requests assigned to you` list | Partition non-terminal active requests from terminal recorded outcomes |
| Card action language | Every card says `Review request →` | Active cards may say `Review request →`; terminal cards must say `View recorded request →` or equivalent non-action wording |
| Empty state | `No requests are waiting` is used for the whole list | Distinguish no active requests from no assigned requests, while still showing terminal history when present |

This is a UI truthfulness defect, not evidence that terminal requests should be deleted from the
Agent read model. Flow 7 explicitly allows later states to remain visible as current/history according
to the bounded queue view; the current view does not make that distinction.

## Bounded objective

1. Keep the existing Agent queue API, domain state machine, projections, persistence, and one-request
   fixture unchanged.
2. Reframe the dashboard so its heading, state summaries, request sections, empty states, and card
   footers truthfully distinguish active workflow work from terminal recorded outcomes.
3. Render the existing seven non-draft state counts without presenting a terminal state as an active
   response queue or silently dropping a returned terminal state.
4. Keep active request links and existing Agent request-detail behavior intact; terminal links remain
   read-only according to the existing workflow state and detail surface.
5. Preserve draft privacy, role authorization, tenant projection boundaries, fixture-generation
   display, refresh/error/loading behavior, keyboard access, and the accepted `320px` responsive floor.

## Accepted behavior and boundary

- The queue consumer defines two presentation groups only:
  - active/non-terminal: `REQUEST_SUBMITTED`, `AGENT_REVIEWING`, `SLOT_PROPOSED`;
  - terminal/recorded: `VIEWING_CONFIRMED`, `TENANT_DECLINED`, `EXPIRED`, `AGENT_DECLINED`.
- The page presents counts for all seven non-draft states, grouped under headings that do not imply
  terminal items need an Agent response. The server-provided counts remain the sole source of truth.
- Active requests appear under an active-work heading and retain the existing link to the authorized
  request detail. Terminal requests appear under a recorded-outcome/history heading and use visibly
  non-action language in their card footer.
- If there are no active requests but a terminal request exists, the active section shows a truthful
  empty state and the terminal outcome remains visible. If there are no non-draft requests at all, the
  existing bounded empty-queue intent remains available without claiming a server failure.
- `TENANT_DRAFT` remains absent from counts, lists, labels, and direct Agent navigation. No UI change
  may become a substitute for the authoritative privacy boundary.
- The layout remains usable at the accepted `320px` viewport, with accessible section headings,
  readable state labels, keyboard-reachable links, and no color-only distinction.
- The existing Agent detail route, state transitions, response preparation/send behavior, and
  terminal read semantics are not changed.

## Non-goals and forbidden expansion

- No server route, DTO, parser, domain state-transition, projection, persistence, fixture, or API
  contract change.
- No new queue filters, pagination, sorting, notification, polling, bulk action, reassignment,
  analytics, dashboard metric definition, or multi-request product capability.
- No automatic reopening, retry, mutation, proposal resend, terminal-state transition, or local
  guessed count.
- No change to tenant surfaces, shared navigation, global CSS, authentication/session behavior,
  Information Request, Operations, external providers, WebMCP, Cloud Receiver, WebRTC, Redis,
  deployment, or Hackathon submission behavior.
- No modification to generated output, browser state, server logs, Git metadata, the outer
  `Web-Game` application, or unrelated collaborator changes.

## Work Order

### RS-WO-033-01 — Clarify Agent active queue and terminal history presentation

**Role:** Single UI Builder; Main-thread integration authority  
**Status:** `CLOSED_VERIFIED`  
**Execution state:** `CLOSED`  
**Owner:** Main RightSpot thread  
**Parallelization:** `SERIAL_AGENT_QUEUE_PRESENTATION` — one dashboard consumer and one CSS module
form a single presentation boundary; do not run concurrent writers against either file.  
**Execution profile:** `Standard` — one UI component, one focused source contract, bounded CSS, and
documentation reconciliation; no API or dependency work.

### Required read set

- `src/ui/agent/agent-dashboard-page.tsx`
- `src/ui/agent/agent.module.css`
- `src/ui/agent/agent-api.ts`
- `src/server/application/workflow-views.ts`
- `src/server/application/workflow.ts`
- `src/shared/contracts/workflow-api.ts`
- `tests/ui/agent-api.test.ts`
- `Docs/03-system-design.md`
- `Docs/05-api-and-integration-contracts.md`
- `Docs/07-business-flows-and-scenarios.md`
- `Docs/06-validation-and-evidence.md`
- `RUNBOOK.md`

### Main write set

- `src/ui/agent/agent-dashboard-page.tsx` — queue grouping, labels, headings, empty states, and
  terminal/non-terminal footer wording only
- `src/ui/agent/agent.module.css` — local queue-section/metric/card presentation only
- `tests/ui/agent-queue-presentation.test.ts` — focused TDD source contract
- this Task File
- `Docs/Tasks/README.md`
- `Docs/00-current-status.md`
- `Docs/06-validation-and-evidence.md`
- `Docs/07-business-flows-and-scenarios.md`
- `Docs/Development/RIGHTSPOT-CROSS-LAYER-AUDIT-2026-09-02.md`
- `Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md`
- `RUNBOOK.md`

### Forbidden set

- All files under `src/server/`, `src/shared/contracts/`, persistence, workflow fixtures, and API
  route handlers
- `src/ui/agent/agent-api.ts`, tenant surfaces, shared navigation, shared/global CSS, auth/session,
  dependencies, media, Operations, or outer `Web-Game` files
- Any workflow command, state transition, projection/privacy rule, response payload, or detail-route
  behavior
- Browser tabs belonging to the user, server process configuration, generated `.next/` output, Git
  refs/commits, Worktree lifecycle, and unrelated dirty files

### Generated/local-only set

`.next/`, test output, isolated `agent-browser` state, screenshots, server logs, and disposable
fixture database state are evidence artifacts only and must not become tracked product source.

## TDD execution contract

### Red

Before implementation, add and run the focused source contract against the registered Main baseline.
It must fail for the current consumer because the baseline has only the four-state `QUEUE_STATES`
array, no explicit active/terminal grouping, and one review footer for every request. The Red record
must assert the accepted presentation boundary, not an implementation-specific class name.

### Green

Implement the smallest local consumer change that:

1. covers exactly the seven non-draft states in two explicit presentation groups;
2. renders truthful grouped counts and section headings;
3. separates active and terminal request cards;
4. changes only terminal card action language; and
5. retains the existing queue fetch, parser, links, error/loading/refresh states, and privacy boundary.

### Refactor

Remove duplicated state lists or wording only when the resulting source still makes the state
coverage and terminal boundary obvious. Keep the change local to the Agent dashboard and its CSS
module; do not introduce a generic queue framework or a new dependency.

## Closure evidence — 2026-09-02

The Work Order passed and closed on the canonical Main Worktree:

- The focused TDD source contract first failed against the pre-repair consumer with
  `AssertionError: Missing ACTIVE_QUEUE_STATES contract`; after the Green repair, the corrected
  focused contract passed `1/1`.
- Pinned `npm test` passed `144/144` across `33` authored test files; `npm run test:foundation`
  passed `6/6`; `npm run typecheck` and `npm run build` passed; and the tracked RightSpot scope passed
  `git diff --check`.
- A fresh isolated browser run reset the fixture to generation `27`, submitted a tenant request,
  sent an agent proposal, and confirmed it. The Agent dashboard then showed the three active counts
  separately from the four recorded-outcome counts, rendered the confirmed request under `Request
  history` with `View recorded request`, and showed `No active requests` in the active section.
- The same isolated run showed the active request under `Active requests` with `Review request`; no
  application console or route error was observed. Screenshots are retained at
  `var/test/agent-queue-active.png`, `var/test/agent-queue-terminal-content.png`, and
  `var/test/agent-queue-terminal-320.png`.
- At the accepted `320px` viewport, `documentWidth=320`, `bodyWidth=320`, and no horizontal overflow
  occurred. Real Tab navigation reached the terminal request link with a visible focus outline.
- A second fresh reset to generation `28` left all seven non-draft counts at zero and rendered both
  `No assigned requests` and `No recorded outcomes`; the pre-submission draft remained absent from the
  Agent queue.
- Exact-path review confirmed that only the Agent dashboard consumer, its local CSS module, and the
  focused UI source contract changed for this Work Order. The server/API/domain/persistence,
  workflow transitions, privacy boundary, request detail, tenant surfaces, and dependencies were
  untouched. The canonical Main Worktree remains the only product source authority; no product commit
  or push was created by this closure step.

`F-11`, `RIGHTSPOT-033`, and `RS-WO-033-01` are therefore `CLOSED_VERIFIED` within the bounded
Agent-dashboard presentation claim. The repair does not claim external authentication, deployment,
notifications, WebMCP, Cloud Receiver, WebRTC, Redis, or production readiness.

## Verification and closure gate

Under pinned Node.js `v24.20.0` / npm `11.19.0`:

1. The focused TDD contract has a recorded Red failure against the registered baseline and passes
   after Green.
2. The complete `npm test` suite, `npm run test:foundation`, `npm run typecheck`, `npm run build`,
   and exact-scope `git diff --check` pass.
3. A fresh isolated browser run verifies at least one active `REQUEST_SUBMITTED` or
   `AGENT_REVIEWING` card and one `VIEWING_CONFIRMED` terminal card. The active card remains reviewable;
   the terminal card is visibly recorded/non-actionable; all seven state counts are truthful.
4. A fresh reset verifies that a pre-submission `TENANT_DRAFT` remains absent from the Agent queue and
   that the empty state remains truthful.
5. Browser checks cover the accepted `320px` viewport, keyboard-reachable links, and no application
   console or route errors. Any browser automation limitation must be distinguished from product
   evidence.
6. The API/domain/persistence source diff is empty for this Work Order, and no terminal state or
   privacy boundary changes.
7. The Task File, Task index, current status, Flow 7 catalogue, validation evidence, audit, roadmap,
   and Runbook agree on the final outcome.

## Stop and reopen conditions

Stop and report `BLOCKED` if truthful grouping requires a new API field, a new product definition of
queue counts, a change to terminal workflow semantics, a multi-request assumption, or a shared-file
ownership conflict. Re-baseline rather than guessing.

Reopen if any terminal card still implies an available Agent action, any returned non-draft state is
silently omitted from the summaries, a draft becomes visible, the active request link or existing
error/loading behavior regresses, or the repair changes workflow/API/privacy behavior outside this
presentation boundary.

## Registration note

This Task was registered from the fresh Main-thread cross-layer audit finding `F-11`. Main completed
the exact UI-only repair, its focused/full verification, and fresh isolated browser checks; `RS-WO-033-01`
is closed as `CLOSED_VERIFIED`. No API/domain/persistence change was made, and no product commit or
push was created by this closure step.
