# RIGHTSPOT-048 — Reconcile role-page session lifecycle for page-bound capabilities

**Type:** `defect`  
**Lifecycle:** `verification_pending`  
**Priority:** `P1` for session least privilege and page truthfulness  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-03  
**Depends on:** accepted [ADR-RS-0018](../Decisions/ADR-RS-0018-role-page-session-lifecycle-revalidation.md),
the existing `GET /api/session` authority, closed `RIGHTSPOT-043` Tenant Search adapter, and the
frozen but not independently closed `RIGHTSPOT-047` Agent Operations adapter

## Task Control

- Type: `defect`
- Lifecycle: `verification_pending`
- Priority: `P1` — a mounted role page can retain a prior actor and page-bound capability after an
  external HttpOnly session change; the server still rejects unauthorized reads, but the client
  lifecycle is not reconciled.
- Owner: Main RightSpot thread
- Current increment: Static audit and Contract Advisor review confirmed the same mount-only lifecycle
  pattern in the shared role frame, Tenant Search adapter, and Agent Operations candidate. The serial
  Builder completed the exact eight-path implementation and Main integrated the reviewed candidate at
  product commit `218935c`. Two independent verifier attempts produced no usable browser evidence:
  Ohm's corrected retry remained at `about:blank`, and Noether's fresh attempt used an unsupported
  `--args=...` invocation form before page launch.
- Execution posture: `INDEPENDENT_BROWSER_GATE_BLOCKED_HARNESS` — the post-Builder source/test
  candidate remains frozen; no supporting Worktree is required or authorized. Main validated the
  installed harness's supported form as `--args "--enable-features=WebMCPTesting"`; a retry is allowed
  only after that preflight and must remain bounded.
- Evidence status: `DETERMINISTIC_GATES_PASSED_BROWSER_BLOCKED_HARNESS`; this is not a browser
  reproduction, product failure, or claim of data leakage. The server-side role/session checks remain
  intact.
- Next gate: Use the validated launch-argument form for one bounded fresh verifier run against frozen
  source `218935c`. If it cannot produce actual page evidence, stop this harness path and report the
  external verification gap rather than retrying indefinitely. Reopen `RIGHTSPOT-047` only after the
  048 evidence decision and a new baseline.
- Dependencies: `ADR-RS-0015` and `ADR-RS-0017` require page/session-scoped capability cleanup;
  `RIGHTSPOT-043` and `RIGHTSPOT-047` provide the existing adapter cleanup contracts. `RIGHTSPOT-012`
  may continue as a read-only, non-blocking audit but cannot modify this Task's write set during a
  source freeze.

## Verified problem

`RolePageFrame` reads `GET /api/session` once on mount and renders its role children while the initial
actor still matches the requested role. The existing Tenant `search_listings` and Agent Operations
`read_listing_pipeline` adapters register in a child `useEffect` and dispose only when that child
unmounts. Local sign-out and ordinary route departure do unmount the child, but a session cookie
changed or expired in another tab does not notify the mounted frame.

The next business/API read remains server-authorized, so this finding does not claim a privacy leak.
The defect is that the old UI identity and capability registration can outlive the session context
they were created for. The Agent case requires a stricter distinction: `FORBIDDEN` can mean either a
wrong-role session or a valid but unassigned Agent, so a client must not deactivate on that response
without authoritative session confirmation.

## Bounded objective

1. Revalidate the server-resolved session at bounded focus/visibility lifecycle checkpoints after the
   initial role-page read, with one in-flight check at a time and safe unmount handling.
2. Reconcile actor id and role changes at the shared `RolePageFrame`; force the authenticated child
   subtree to unmount when the actor becomes null or changes identity, so all existing page read and
   WebMCP cleanup runs.
3. Make the Tenant and Agent page-bound adapters deactivate after authoritative authentication failure,
   while preserving the unassigned-Agent `FORBIDDEN` contract through one confirming session read.
4. Preserve the existing manual page, server authority, role/assignment/privacy rules, bounded error
   messages, and all ordinary business flows.
5. Add executable TDD coverage and independent supported-browser evidence for the shared lifecycle,
   adapter deactivation, no duplicate registration, no stale page state, and no mutation.

## Accepted behavior

- The initial `readSession()` remains the entry gate and is not replaced by client role inference.
- After initial resolution, `focus` and visible `visibilitychange` are the only automatic
  revalidation triggers. No timer, polling, arbitrary retry, cookie parsing, or cross-tab protocol is
  introduced.
- A same `{ id, role }` actor does not remount the page. A `null`, changed id, or changed role updates
  the frame and tears down the prior authenticated child subtree. The existing wrong-role and
  signed-out surfaces remain the visible recovery boundaries.
- A non-authentication error while revalidating does not fabricate a new actor or silently sign out a
  valid current actor; it is shown as bounded session-read failure and can be retried at a later
  lifecycle checkpoint.
- Tenant adapter `UNAUTHENTICATED` and contract-defined wrong-role `FORBIDDEN` deactivate its
  registration. Agent adapter `UNAUTHENTICATED` deactivates immediately; Agent `FORBIDDEN` remains
  bounded unless one authoritative session read proves null/wrong role.
- Existing page executors still recheck server session/role/assignment for every request. No client
  lifecycle check grants access or replaces the server boundary.
- A WebMCP-unavailable or deactivated capability leaves the ordinary manual UI usable, with no fake
  registration, hidden fallback, guessed query, or raw exception.

## Implementation boundary

### Required read set

- repository `AGENTS.md` and tracked contributor/runbook authority;
- RightSpot `AGENTS.md`, `Docs/Tasks/README.md`, `Docs/00-current-status.md`, `Docs/06-validation-and-evidence.md`,
  `Docs/07-business-flows-and-scenarios.md`, `Docs/Development/README.md`,
  `Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md`, and
  `Docs/Development/RIGHTSPOT-WEBMCP-ROADMAP.md`;
- `ADR-RS-0015`, `ADR-RS-0017`, `ADR-RS-0018`, `RIGHTSPOT-043`, and `RIGHTSPOT-047`;
- `src/ui/shared/session-api.ts`, `src/ui/shared/role-page-frame.tsx`, and all current RolePageFrame
  consumers;
- `src/ui/tenant/tenant-webmcp.ts` and `tests/ui/tenant-webmcp.test.ts`;
- `src/ui/agent/operations/operations-webmcp.ts` and `tests/ui/operations-webmcp.test.ts`;
- `tests/ui/session-api.test.ts`, package scripts, and the declared supported browser/runtime.

### Allowed write set

The Builder may modify only these exact paths:

- `src/ui/shared/role-session-lifecycle.ts` — new bounded lifecycle monitor and actor identity helper;
- `src/ui/shared/role-page-frame.tsx` — initial-monitor wiring, bounded error state, and keyed
  authenticated child boundary;
- `src/ui/tenant/tenant-webmcp.ts` — authoritative Tenant auth-failure deactivation only;
- `src/ui/agent/operations/operations-webmcp.ts` — authoritative Agent auth-failure and
  wrong-role-confirmation deactivation only;
- `tests/ui/role-session-lifecycle.test.ts` — executable monitor/identity/race contracts;
- `tests/ui/role-page-frame.test.ts` — shared frame source/render-boundary contracts;
- `tests/ui/tenant-webmcp.test.ts` — adapter deactivation regressions only; and
- `tests/ui/operations-webmcp.test.ts` — Agent deactivation/unassigned distinction regressions only.

If the accepted behavior cannot be implemented within these eight exact paths, stop and return to
Main for a new boundary decision. Do not widen the set opportunistically.

### Forbidden set

- all `src/server/**`, `src/shared/contracts/**`, persistence, database, fixture, route handler,
  session API, cookie, environment, package, dependency, and lockfile changes;
- `app/**`, `public/**`, global CSS, navigation redesign, external authentication, Clerk/provider
  setup, Cloud Receiver, WebRTC, Redis, deployment, or production session infrastructure;
- changes to Search/Operations predicates, DTOs, role assignment, error vocabulary, workflow state,
  Favourite, Viewing Request, Information Request, notification, contact, or mutation behavior;
- continuous polling, arbitrary retry, BroadcastChannel/cross-tab protocol, localStorage auth state,
  client role/identity authority, redirect loops, hidden fallback, or swallowed errors;
- browser automation workarounds, fixture mutation outside the declared disposable verification
  procedure, generated output, canonical documentation edits, Git operations, or Worktree lifecycle;
- changes to any path outside the exact write set to satisfy tests or browser tooling.

### Generated/evidence set

Disposable build output, browser output, and logs may remain only under existing ignored RightSpot
boundaries such as `.next/` and `.playwright-cli/`. They are not source, must not be staged, and do
not replace canonical evidence.

## Red → Green → Refactor plan

### Red

Add tests that fail against the current source for:

- focus/visibility listener registration, visible-only handling, one in-flight read, disposal, and
  late-settlement suppression;
- same-actor no-op versus null/id/role transition detection and keyed child boundary;
- Tenant auth-failure deactivation;
- Agent `UNAUTHENTICATED` deactivation, wrong-role confirmation, and unassigned-Agent preservation;
- no duplicate registration or hidden role inference.

### Green

Implement only the smallest monitor/frame/adapter changes that make the Red contracts pass while
retaining existing adapter abort controllers and ordinary page executors. The server session and
business APIs must remain unchanged.

### Refactor guard

The final diff must retain one session authority, one shared frame owner, event-driven bounded
revalidation, one adapter registration per page, existing abort/dispose cleanup, the existing manual
fallback, and no new business or authentication state. A same-role actor-id change must reset the
child subtree; an unassigned Agent `FORBIDDEN` must not be treated as wrong-role evidence.

## Acceptance criteria

Close this Task only after all of the following are true:

1. Focus/visibility revalidation is implemented in the shared role frame with coalescing, cleanup,
   late-result protection, and no polling/retry loop.
2. Same-actor checks do not remount; null, role, or actor-id changes tear down the previous child
   subtree and display the existing signed-out/wrong-role boundary.
3. Tenant and Agent adapters have the exact auth-failure deactivation behavior in ADR-RS-0018,
   including the unassigned-Agent `FORBIDDEN` distinction.
4. Existing page reads and WebMCP registration use the existing server authority; no source/API/DTO/
   fixture/workflow mutation or private-field exposure is introduced.
5. Focused Red → Green → Refactor tests pass, then the complete RightSpot suite, non-incremental
   typecheck, production build, repository validators, sensitive scan, and `git diff --check` pass.
6. Independent supported-browser verification covers `/tenant` and `/agent/operations`, same-actor
   no-duplication, external session clear/replacement, wrong-role/unassigned-Agent boundaries, tool
   removal, page recovery, manual fallback, responsive/accessibility behavior, clean console/page
   errors, and persistent no-mutation readback.
7. Main reviews exact paths and source identity, integrates the candidate, updates `RIGHTSPOT-047`,
   ADR-RS-0015/0017 references, current status, flow/evidence/roadmap records, and closes only the
   bounded lifecycle outcome. No universal auth or WebMCP claim is made.

## Work Orders

### RS-WO-048-01 — Implement the shared role-page lifecycle repair

**Role:** Senior UI/WebMCP lifecycle Builder  
**Status:** `READY_FOR_INDEPENDENT_VERIFICATION`  
**Parallelization:** `SOURCE_FROZEN_AFTER_BUILDER` — the exact eight-path set is frozen; no other source
  writer or verifier may overlap it.  
**Model gate:** Because this changes WebMCP capability lifetime, dispatch a capable supporting worker
with `gpt-5.6-sol` and `medium` reasoning. If that model/capability is unavailable, stop and report
the blocker; do not substitute an unsupported model for WebMCP lifecycle work.  
**T0 source identity (2026-09-03):** Repository root
`/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`; branch `main`; HEAD
`9f139084dc1d46329a222bdf7ded7fd85fa2201e`; `origin/main...HEAD` is `0 6`; one physical Worktree
at the canonical Main path. RightSpot tracked source was clean. Preserved untracked boundary artifacts
were `.playwright-cli/`, `:memory:`, `AGENTS.md`, `CLAUDE.md`, and `Docs/Reference/`; none is part of
the Builder write set. Pinned Node is `v24.20.0`, npm `11.19.0`, `agent-browser` is `0.25.3`, Chrome
is `152.0.7977.65`, the `WebMCPTesting` flag is available, and `GET /api/health` returned `200`
with `{"ok":true,"service":"rightspot"}`.  
**Dispatch record (2026-09-03):** Supporting Builder Erdos, agent
`01a06637-64a1-7580-a47e-4423e2fd5255`, was dispatched with `gpt-5.6-sol` and `medium` reasoning.
The Builder owns only the eight paths below, must not edit docs/Git/fixture/Worktree, and must return
the required Red/Green/Refactor and static/build handoff before Main starts verification.  
**Write set:** exactly the eight paths listed in this Task.  
**Handoff:** Return `READY_FOR_INDEPENDENT_VERIFICATION` with exact changed paths, Red/Green/Refactor
results, focused/full/static/build results, no-mutation checks, and any unresolved boundary. The
Builder must not edit canonical docs, Git refs, fixtures, or create a Worktree.

**Builder handoff (2026-09-03):** Main reviewed the exact eight changed paths and integrated the
candidate at `218935c` (`fix(rightspot): reconcile role page session lifecycle`). The code/test baseline
was `e4c3df4`; intervening `fd2b10e` was a docs-only dispatch record and did not alter the allowed
source/test paths. Main independently reran focused `35/35`, complete `215/215`, non-incremental
typecheck, production build, repository validation, sensitive scan, and diff checks. The build retained
the existing Operations dynamic filesystem-tracing warning. No browser or WebMCP closure evidence is
claimed yet.

### RS-WO-048-02 — Independently verify the repaired lifecycle

**Role:** Independent supported-browser WebMCP Verifier  
**Status:** `BLOCKED_HARNESS`  
**Parallelization:** `AFTER_BUILDER_SOURCE_FREEZE` — freeze the post-Builder source and Git identity;
  no Main source/status movement during the check.  
**Frozen source identity:** product commit `218935c` on canonical Main; no source/test path may change
during this verification gate.  
**Dispatch record (2026-09-03):** Independent verifier Ohm, agent
`01a0664b-dac0-7b51-9350-fb93b163a34c`, was dispatched with `gpt-5.6-sol` and `medium` reasoning.
The verifier is read-only, uses the installed supported-browser harness with the WebMCP testing flag,
and must return a bounded status with exact evidence or a precise stop condition.  
**Verifier outcome (2026-09-03):** Ohm first returned `INCOMPLETE_EVIDENCE`; its corrected retry did
not leave `about:blank` and was closed as `BLOCKED_HARNESS`. No product conclusion was drawn. A fresh
Noether attempt, agent `01a0666b-0da5-70c1-b0fe-a367af0ba766`, then stopped before navigation because
the prompt used `--args=--enable-features=WebMCPTesting`, which this installed binary rejects as an
unknown command. Main verified the supported syntax locally as `--args "--enable-features=WebMCPTesting"`.
This is a harness invocation failure, not independent browser evidence or a product failure.
**Retry gate:** A single corrected retry may use a fresh uniquely named session, the validated argument
syntax, the exact frozen source `218935c`, and the existing read-only evidence matrix. It must stop if
the session does not load or if final evidence cannot be captured; no default, shared, or existing
session may be substituted.
**Scope:** Read-only evidence against the exact frozen candidate. No source, docs, Git, Worktree, or
  durable fixture mutation. Use `gpt-5.6-sol` with `medium` reasoning for WebMCP-specific evaluation.  
**Required evidence:** initial and repeated registration counts, focus/visibility revalidation,
  external session clear/replacement, same-role actor-id change, wrong-role and unassigned-Agent
  behavior, in-flight abort/removal, manual recovery, page/tool parity where applicable, responsive/
  accessibility state, clean console/page errors, and final persistent no-mutation/source readback.  
**Stop condition:** Any source drift, unsupported API assumption, privacy exposure, stale tool after
  authoritative lifecycle change, unassigned-Agent misclassification, page error, fixture mutation,
  or incomplete final readback stops the gate and returns a bounded report to Main.

## Stop and reopen conditions

Stop and return to Main if:

- the session endpoint cannot distinguish a validated actor id/role from an unavailable response;
- focus/visibility handling requires polling, a new cross-tab transport, or an API/schema change;
- the Agent `FORBIDDEN` distinction cannot be preserved;
- the repair requires a server/shared contract, dependency, route, fixture, or forbidden path;
- a stale registration remains callable after an authoritative session/role/identity teardown;
- the ordinary manual UI becomes unusable, or an error is hidden, guessed, retried, or fabricated; or
- source ownership, Git identity, or browser capability cannot be frozen and reproduced.

## Current disposition

The finding is accepted as a bounded shared lifecycle repair under ADR-RS-0018. Its reviewed candidate
is frozen at `218935c`, but the Task remains open until `RS-WO-048-02` supplies the required independent
supported-browser evidence or Main records a reviewed harness limitation after the bounded retry. The
current Work Order is `BLOCKED_HARNESS` pending the corrected launch preflight. It does not reopen the
ordinary local MVP, `RIGHTSPOT-043`'s already verified Search semantics, or the Operations authority.
`RIGHTSPOT-047` remains `verification_pending` and must not be closed until this repair and its
independent browser evidence are complete. The Task does not authorize external authentication,
Cloud Receiver, WebRTC, Redis, deployment, production hardening, or universal WebMCP support.
