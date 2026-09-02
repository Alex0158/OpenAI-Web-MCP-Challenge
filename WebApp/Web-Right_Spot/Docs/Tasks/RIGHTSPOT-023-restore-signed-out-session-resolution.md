# RIGHTSPOT-023: Restore signed-out session resolution on the root entry surface

**Type:** `defect`
**Lifecycle:** `closed`
**Priority:** `P1` for ordinary local MVP entry and demo reliability
**Owner:** Main RightSpot thread
**Opened:** 2026-09-02
**Depends on:** Accepted `RS-FLOW-01` session contract; closed `RIGHTSPOT-005`; current shared
session UI and API boundary; pinned Node.js `v24.20.0` runtime

## Task Control

- Type: `defect`
- Lifecycle: `closed`
- Priority: `P1`
- Owner: Main RightSpot thread
- Current increment: Restore a deterministic signed-out state on the root session surface when the
  session endpoint returns the expected `401 UNAUTHENTICATED` response.
- Next gate: Closed after exact-path review, independent verification, browser evidence, and canonical
  documentation reconciliation.
- Execution posture: `CLOSED_VERIFIED`
- Evidence status: `VERIFIED_REPAIR` from Red/Green tests, independent read-only verification, and
  fresh local browser evidence; the original defect was independently reproduced at registration.
- Delegation decision: no identity-matched persistent supporting Builder was active. Because this
  Work Order owns a shared session-client path and the critical path should not wait for a new task
  setup, Main is executing the bounded Builder checkpoint directly. Independent verification remains
  required and will use the frozen integrated source.
- Builder result: the focused Red test failed before the source change because `readSession()` tried
  to parse the `401` body first. Green changed only `src/ui/shared/session-api.ts`; the new focused
  test is `tests/ui/session-api.test.ts`. Focused tests pass 3/3, the full direct suite passes 124/124,
  typecheck passes, the production build passes, and scoped diff checks pass.
- Independent verifier result: a read-only verification task reviewed the exact source increment and
  returned `PASS`; it reconfirmed the focused 3/3 tests, full 124/124 suite, typecheck, malformed
  successful-actor rejection, structured non-401 error behavior, and scoped diff cleanliness under
  Node `v24.20.0`. No files were edited by the verifier.

## Verified problem

An isolated fresh browser tab with no demo-session cookie opened `/` against the local RightSpot
server. The server returned the expected `GET /api/session` response `401` with the bounded JSON
error `{ "code": "UNAUTHENTICATED" }`, but after more than two seconds the rendered shell still
showed `Checking your demo session`, with no role buttons and no signed-out recovery action.

This is a real entry-flow defect, not a missing authentication provider or a seeded-listing problem:

- the root shell is server-rendered and styled;
- the browser issued `GET /api/session` and the server logged the `401` response;
- direct `curl` receives the same bounded `401` response immediately; and
- the signed-out contract requires the shell to settle into the role-selection state so a new user can
  enter `/tenant` or `/agent`.

The current client helper parses the response body before handling the expected `401`. The likely
bounded cause is that the signed-out state depends on an error-body parse that is not necessary for a
known unauthenticated response. The implementation must verify this hypothesis with a red regression
test; it must not add an arbitrary timeout or silently retry.

## Bounded objective

Make the root session surface settle truthfully and promptly for an absent or invalid demo session:

1. `readSession()` returns `null` for the expected `401` without requiring an error-body parse;
2. `AppShell` consequently renders the existing signed-out role-selection UI;
3. valid `200` actor responses and non-401 failures preserve their current parsing and visible error
   behavior; and
4. successful tenant/agent sign-in and role-aware navigation remain unchanged.

This is a client session-read repair. It does not change the server session contract, cookie policy,
role authority, route protection, workflow state, listing data, or authentication-provider decision.

## RS-WO-023-01 — Repair signed-out session-read resolution

**Role:** Builder → independent Verifier (sequential checkpoints)
**Pre-dispatch status:** `MAIN_BUILDER_AND_VERIFIER_COMPLETE`
**Execution state:** `CLOSED_VERIFIED`
**Owner:** Main RightSpot thread; a persistent supporting Builder is required if delegated
**Dispatch state:** Main-thread Builder complete; read-only independent verifier returned `PASS`; no
supporting task dispatched; closed in canonical Main
**Parallelization:** `SERIAL_SHARED_SESSION_CLIENT` — no other worker may modify the shared session
client or root-shell paths during this Work Order
**Execution profile:** `Standard` — shared client session behavior, no server or domain change
**Integration owner/order:** Main RightSpot thread; the exact candidate must be reviewed, frozen, and
  integrated before any independent browser claim
**Parent execution posture if blocked:** `PROGRESSING`

### Objective

Use the smallest client-side change that handles the known unauthenticated response before any
optional error-body parsing, and prove the boundary with a focused test before implementation.

### Acceptance criteria

1. A `401` result from `GET /api/session` resolves `readSession()` to `null` even when the response
   body is empty, malformed, or unavailable to parse.
2. A valid `200` response still returns the validated server actor; malformed non-401 responses still
   produce the existing bounded `SessionApiError` behavior.
3. A fresh signed-out browser tab settles from `Checking your demo session` to `Start with a
   bounded role`, exposes both existing role actions, and does not remain `aria-busy` indefinitely.
4. Selecting Tenant still reaches `/tenant` with the seeded listing collection, and selecting
   Property agent still reaches `/agent`; destination authority remains the server-resolved actor.
5. Existing active-session root redirect, role-page wrong-role guard, sign-out, loading, and visible
   failure behavior remain intact.
6. No request, listing, Favourite, workflow, fixture, cookie, server route, API contract, dependency,
   external auth, WebMCP, Cloud Receiver, WebRTC, Redis, deployment, or production claim changes.
7. No arbitrary timeout, automatic retry loop, guessed actor, client-only role authority, or silent
   fallback is introduced.
8. TDD evidence is explicit: a focused red regression test fails against the pre-change behavior,
   the minimal green implementation passes it, and refactoring (if any) preserves the same contract.

### Baseline and source identity

- Repository root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`
- RightSpot package root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot`
- Branch/HEAD at registration: `main` / `81ee4392d173d796e404101818b741c0b64b861b`
- Runtime: `/Users/alex/.local/share/rightspot/node-v24.20.0-darwin-arm64/bin`, Node `v24.20.0`,
  npm `11.19.0`
- Source limitation: the repository contains unrelated outer Web-Game changes and intentional
  RightSpot documentation/untracked work. They are preserved and excluded from this Work Order.
- Worktree: canonical Main only at registration; no implementation Worktree is open.
- Generated/local-only output: `.next/`, browser probe state, and `var/test/*.sqlite` are not authored
  source and must not be adopted into the candidate.

The Builder must recapture branch, HEAD, status, Worktree list, runtime, package root, and exact
changed paths before action. A changed semantic read input, shared-session ownership conflict, or
unexpected source mutation is a stop condition requiring Main review and re-baselining.

### Read before action

- Repository and RightSpot `AGENTS.md` files, `RUNBOOK.md`, and the thread-orchestration Runbook.
- `Docs/07-business-flows-and-scenarios.md`, especially `RS-FLOW-01`, `RS-FLOW-18`, and `F-02`.
- `Docs/02-requirements.md`, `Docs/05-api-and-integration-contracts.md`, `Docs/06-validation-and-evidence.md`,
  ADR-RS-0001, ADR-RS-0008, ADR-RS-0009, and closed `RIGHTSPOT-005`.
- `src/ui/shared/session-api.ts`, `src/ui/shared/app-shell.tsx`,
  `src/ui/shared/demo-session-panel.tsx`, `src/ui/shared/session-nav.tsx`, and the server session
  route/resolver.
- Existing session/API tests and the current local rendered root.

### Mutable scope

- **Worker write set:** `src/ui/shared/session-api.ts` and a focused test path
  `tests/ui/session-api.test.ts`.
- **Main-thread writeback set:** this Task File, the task index, current status, flow catalogue,
  validation/evidence, roadmap, and any required Runbook TDD wording. The Builder and Verifier must
  not edit these canonical files.
- **Read set:** the named documents, session source, existing tests, package/lockfile, and runtime
  needed for verification.
- **Forbidden set:** `app-shell.tsx`, `demo-session-panel.tsx`, `session-nav.tsx`, all server/API/
  domain/persistence/route files, cookies, auth-provider code, workflow/listing/Favourite source,
  package manifests/lockfiles, assets, Git metadata, outer Core/Web-Game files, and user-owned
  reference artifacts.
- **Generated set:** local build output, browser state, process logs, and test-owned databases only;
  none may be staged or treated as product source.

If the focused test cannot prove the UI-facing state without changing `app-shell.tsx`, or if the
client helper is not the cause, stop with `NEEDS_REVIEW` and report the first failing boundary. Do not
expand into a timeout, middleware, route, or server repair by guesswork.

### TDD and verification

1. **Red:** add/run a focused test that supplies an unparseable `401` response and demonstrates that
   the current implementation incorrectly rejects while dependent on body parsing. This Red result
   was observed before the source change.
2. **Green:** make only the minimal `401` handling change in `session-api.ts`; run the focused test and
   the existing session/API tests.
3. **Refactor:** only if it improves local clarity without changing behavior or expanding the write set.
4. Run focused tests, the full RightSpot direct suite, typecheck, production build, and scoped diff
   checks under the pinned runtime.
5. Against the frozen integrated source, run a fresh no-cookie browser check for the signed-out root,
   both role sign-ins, active-session root routing, sign-out, console errors, and no workflow/data
   mutation. Record the actual response and settled visible state.

### Builder evidence captured

- Red probe: an unparseable `401` rejected with `SessionApiError(INVALID_RESPONSE)` before the source
  change.
- Green: `readSession()` now returns `null` before reading a known `401` body; focused session tests
  pass 3/3.
- Direct suite: 124/124 tests pass under Node `v24.20.0`.
- TypeScript and `next build` pass. The build exposes the expected bounded route set and no new
  dependency or server route.
- Browser: production build at `127.0.0.1:3101` settled into the signed-out role-selection surface;
  dev server at `localhost:3100` completed Tenant and Property agent handoffs and sign-out with no
  browser error logs. `127.0.0.1:3100` is separately blocked by the dev-origin configuration before
  client hydration and is not evidence against this client repair.

The Builder returns `READY_FOR_VERIFICATION` with exact paths, red/green evidence, commands, runtime,
and limitations. The Verifier uses the frozen source and may not repair a failure. Main closes only
after exact-path review, independent verification, integration, post-integration checks, and document
writeback.

### Non-goals and stop conditions

- Do not introduce an external authentication provider, username/password, Gmail, Clerk, middleware,
  persistent user account, new cookie, session timeout policy, retry/backoff, or loading watchdog.
- Do not alter the server's `401` JSON contract merely to accommodate the client.
- Do not weaken response validation for successful actors or convert unrelated errors to signed-out.
- Do not edit canonical documents from a worker, commit from a worker, dispatch follow-on work, or
  claim independent verification from a Builder result.
- Stop and return `NEEDS_REVIEW` for any source-path expansion, dependency change, server behavior
  change, or disagreement between the browser result and the focused test.

## Closure gate

Close only when the exact signed-out root defect is fixed, the red-green evidence and relevant direct
checks pass, the frozen-source browser proof confirms a usable signed-out entry and both role handoffs,
and the change is integrated into the canonical Main Worktree with current docs reconciled. This Task
does not claim external authentication, deployment, WebMCP, Cloud Receiver, WebRTC, Redis, or
production readiness.

**Closure result (2026-09-02):** `src/ui/shared/session-api.ts` now handles the expected `401` before
optional body parsing. The focused Red/Green test, full 124-test direct suite, typecheck, and production
build passed; an independent read-only verifier returned `PASS`. Fresh `localhost:3100` and
`127.0.0.1:3100` browser checks confirmed signed-out role selection, Tenant listings, Property agent
queue, sign-out, and role-aware navigation. The later `RIGHTSPOT-024` config repair restored the
documented loopback dev host without changing this Task's session-client boundary.

## Reopen condition

Reopen or replace this Task if the repair requires changing the server session response, route/middleware
authorization, session persistence, external identity, a shared shell component outside the declared
client helper, or a new product decision. Those are separate authority boundaries.
