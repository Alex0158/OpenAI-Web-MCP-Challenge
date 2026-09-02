# RIGHTSPOT-025: Keep a tenant draft private from the agent workflow

**Type:** `defect`
**Lifecycle:** `closed`
**Priority:** `P1` for workflow privacy and truthful agent work
**Owner:** Main RightSpot thread
**Opened:** 2026-09-02
**Depends on:** `RS-FLOW-05` draft ownership, `RS-FLOW-06` explicit submission, `RS-FLOW-07`
agent queue visibility, current workflow projection/API contracts, and the accepted one-request fixture

## Task control

- Type: `defect`
- Lifecycle: `closed`
- Priority: `P1`
- Owner: Main RightSpot thread
- Current increment: Enforce the accepted pre-submission privacy boundary at the authoritative agent
  read paths; complete and independently verify the bounded repair.
- Execution posture: `READY_FOR_CLOSURE`
- Evidence status: `CLOSED_VERIFIED` after Main TDD, full checks, live smoke, and formal persistent
  read-only verification.
- Next gate: Return to the Main-thread cross-layer audit. Reopen only if a later audit reproduces a
  regression or the repair requires a boundary outside this Task.

## Verified problem

On the current Main source, a tenant can save `request-1` as `TENANT_DRAFT`. Before the tenant
explicitly submits it, the assigned agent's `readAgentQueue()` returns that request and the agent
detail projection returns the same draft. The current queue view renders the item even though its
state-count cards omit `TENANT_DRAFT`.

Current direct probe result:

```text
CREATE_REQUEST_DRAFT: ok=true
agent queue projection: request-1 / TENANT_DRAFT
```

This is a real privacy and workflow defect, not a visual-only mismatch. The accepted flow says that a
draft is tenant-private until `SUBMIT_REQUEST`; an agent must not learn that the draft exists through
the queue or a guessed/direct identifier. The existing domain transition already rejects an agent
review command against `TENANT_DRAFT`, so the repair must close the read boundary without changing
the state machine.

## Bounded objective

Make the agent's pre-submission read surface truthful while preserving the existing workflow:

1. `readAgentQueue()` returns the normal empty queue/count envelope while the only request is
   `TENANT_DRAFT`;
2. direct agent request reads for that draft return the existing generic `NOT_FOUND`/404 boundary;
3. the tenant can still read and revise its own draft and explicitly submit it;
4. after submission, the assigned agent sees the request and can continue the existing review path;
5. reads do not mutate workflow state, audit entries, versions, or fixture generation; and
6. no tenant identity/contact data, UI-only hiding, alternate state, notification, or product branch
   is introduced.

## Work Order

### RS-WO-025-01 — Repair authoritative agent draft visibility

**Role:** Main-thread Builder → independent Verifier (sequential checkpoints)
**Pre-dispatch status:** `MAIN_BUILDER_COMPLETE`
**Execution state:** `CLOSED_VERIFIED`
**Owner:** Main RightSpot thread
**Parallelization:** `SERIAL_AGENT_PROJECTION` — queue and detail share the agent read authority;
  no other worker may modify workflow projection/application/API paths during this Work Order
**Execution profile:** `Standard` — bounded domain/application read-boundary repair with API
  regression evidence

### Acceptance criteria

1. A tenant-created `TENANT_DRAFT` is visible to the tenant projection but is absent from the agent
   queue `requests` array and all queue counts remain zero.
2. An agent direct read for the draft identifier returns the existing generic `404 NOT_FOUND`
   workflow boundary and does not reveal whether a private draft exists.
3. The queue/detail reads do not change request state, version, audit length, slot status, fixture
   generation, or any other authoritative workflow field.
4. After the tenant submits the same request, the queue returns the submitted item and direct detail
   returns the submitted request with the existing role-safe DTO fields.
5. Agent review, preparation, send, tenant response, terminal outcomes, wrong-role guards, stale
   checks, and persistence-failure mappings remain unchanged.
6. The repair is enforced at the domain/application read boundary; it is not implemented as a
   queue-only or CSS/UI-only filter.
7. No request state-machine transition, assignment rule, tenant projection, API shape, fixture,
   listing, Favourite, session, cookie, dependency, external auth, WebMCP, Cloud Receiver, WebRTC,
   Redis, deployment, or production-readiness claim changes.
8. TDD evidence is explicit: focused Red tests fail against the current over-inclusive projection,
  the smallest Green boundary repair passes, and any Refactor preserves the same visibility contract.

## Baseline and source identity

- Repository root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`
- RightSpot package root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot`
- Branch/HEAD at registration: `main` / `81ee4392d173d796e404101818b741c0b64b861b`
- Runtime: `/Users/alex/.local/share/rightspot/node-v24.20.0-darwin-arm64/bin`, Node `v24.20.0`,
  npm `11.19.0`
- Worktree: canonical Main only; no implementation Worktree is open
- Protected existing source: the verified 023 session-client repair and 024 dev-origin config are
  outside this Work Order and must remain unchanged
- Generated/local-only output: `.next/`, browser state, process logs, and `var/test/*.sqlite` are
  not product source

The Main Worktree is intentionally dirty with existing RightSpot documentation and protected source
work, plus unrelated outer Web-Game work. This Work Order uses a path-scoped source identity; a clean
whole-tree claim is neither required nor permitted as a reason to delete or revert collaborator work.
The Builder must recapture branch, HEAD, status, Worktree list, runtime, and exact changed paths before
action.

## Read before action

- Repository and RightSpot `AGENTS.md` files, `RUNBOOK.md`, and the thread-orchestration Runbook.
- `Docs/07-business-flows-and-scenarios.md`, especially `RS-FLOW-05`, `RS-FLOW-06`, `RS-FLOW-07`,
  `RS-FLOW-08`, `RS-FLOW-18`, and `F-01`.
- `Docs/02-requirements.md`, `Docs/04-domain-and-data-model.md`,
  `Docs/05-api-and-integration-contracts.md`, `Docs/06-validation-and-evidence.md`, ADR-RS-0001,
  ADR-RS-0008, and the accepted `RIGHTSPOT-002` workflow contract.
- `src/server/domain/projections.ts`, `src/server/application/workflow.ts`,
  `src/server/application/workflow-views.ts`, `src/server/application/workflow-http.ts`,
  `src/server/persistence/workflow-store.ts`, the agent UI/API, and existing workflow tests.

## Mutable scope

- **Worker/Main write set:** `src/server/domain/projections.ts`,
  `src/server/application/workflow.ts`, and the focused test path
  `tests/api/agent-draft-visibility.test.ts`.
- **Main documentation writeback:** this Task File, the task index, current status, flow catalogue,
  validation/evidence, roadmap, and any required Runbook wording.
- **Forbidden set:** request state-machine command logic, tenant projection code, DTO field shapes,
  agent UI/CSS, session/auth/cookie code, listing/Favourite code, package manifests/lockfiles, assets,
  Git metadata, outer Web-Game files, and user-owned reference artifacts.
- **Generated set:** `.next/`, browser state, server logs, and test-owned databases; none may be
  staged as product source.

If the correct boundary requires changing the request state machine, assignment, DTO contract, tenant
projection, or more paths than declared, stop with `NEEDS_REVIEW` and redesign the Work Order. Do not
weaken privacy by returning a placeholder request or by hiding only at the UI.

## TDD and verification

1. **Red:** add/run a focused API/application regression that creates a tenant draft, reads the agent
   queue and direct detail, and asserts the intended empty/404 boundary. The current direct probe must
   fail before the source repair.
2. **Green:** make the smallest authoritative read-boundary change. Queue reads may return their
   existing empty envelope; direct detail may use the existing generic `NOT_FOUND` error. Do not add
   a new state or error vocabulary.
3. **Refactor:** only behavior-preserving local cleanup after Green; no scope or authority change.
4. Run the focused test, existing domain/application/API workflow tests, the full RightSpot direct
   suite, typecheck, production build, and scoped diff checks under Node `v24.20.0`.
5. Run a fresh browser/API walkthrough from reset or a recorded fixture: tenant draft remains visible
   only to tenant, agent queue is empty, explicit submission makes it visible, and the existing agent
   review entry remains usable. Check role/privacy, no-mutation, console, and visible empty/error
   states.
6. Independent Verifier uses the frozen path-scoped source and may not repair failures. Main closes
   only after exact-path review, independent verification, Main integration, and documentation
   writeback.

## Closure evidence

- Main Builder corrected the initially mis-targeted patch before Green: `readTenantRequest` remained
  draft-readable for the tenant, while only `readAgentQueue` gained the `TENANT_DRAFT` empty-queue
  boundary. `readAgentProjection` gained the matching non-visible `NOT_FOUND` boundary.
- Red reproduced the defect before repair. Green then passed the focused API regression `2/2` for
  draft privacy, no mutation, and post-submit agent visibility.
- Full RightSpot direct suite passed `127/127` under Node `v24.20.0`; `npm run typecheck` passed;
  the production build passed; and scoped `git diff --check` passed.
- A live `127.0.0.1:3100` smoke after the clean build restart showed the existing tenant request and
  agent queue surfaces resolving successfully, with no loopback-origin warning and only normal
  React/HMR console messages. The fresh-database draft/privacy and no-mutation claims are covered
  by the focused isolated API regression rather than by mutating the user's current browser fixture.
- Auxiliary transient read-only check `Wegener` returned `PASS` for focused `2/2`, full suite
  `127/127`, typecheck, exact-path review, and no mutation; it remains supplementary process
  evidence, not the formal gate.
- Formal persistent Verifier task `01a06098-b2d3-7262-ae61-5701a463a976` returned `PASS` against
  the corrected source path and frozen Main source. It confirmed `main` / HEAD
  `81ee4392d173d796e404101818b741c0b64b861b`, the repository/package roots, Node `v24.20.0`, npm
  `11.19.0`, focused `2/2`, full suite `127/127`, typecheck, exact-path diff, and scoped
  `git diff --check`. It confirmed the tenant draft read remains available, agent queue/detail are
  non-visible before submission, submitted visibility remains intact, and the complete WorkflowState
  before/after reads is equal. It made no source, Git, cleanup, or Worktree mutation and made no
  browser/build claim.
- Main-integrated product paths are exactly `src/server/application/workflow.ts` and
  `src/server/domain/projections.ts`; the regression is
  `tests/api/agent-draft-visibility.test.ts`. No state-machine, DTO, tenant-projection, UI, auth,
  dependency, or external-integration path changed.

## Non-goals and stop conditions

- Do not change the state machine, assignment, tenant behavior, agent action semantics, DTO contracts,
  or error vocabulary.
- Do not add a notification, live chat, contact/PII surface, information request, external service,
  or alternate queue.
- Do not edit canonical documents from a supporting worker, commit from a worker, dispatch follow-on
  work, or claim independent verification from a Builder result.
- Stop for any scope expansion, private-data disclosure beyond the draft visibility issue, or conflict
  with a protected existing source path.

## Closure gate

Close only when the pre-submission draft is absent from agent queue/detail at the authoritative read
boundary, submitted work remains visible and actionable, tenant and agent projections retain their
privacy fields, no-mutation evidence passes, the Red/Green evidence and full checks pass, the formal
persistent Verifier returns `PASS`, and the change is integrated into the canonical Main Worktree with
current docs reconciled. These conditions are now satisfied for this bounded Task.

## Reopen condition

Reopen or replace this Task if the repair requires changing state transitions, assignment authority,
DTO shape, tenant projection, authentication, a new error contract, or an additional product decision.
