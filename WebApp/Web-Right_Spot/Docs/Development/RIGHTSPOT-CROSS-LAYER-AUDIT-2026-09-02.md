# RightSpot Cross-Layer Audit — 2026-09-02

Agent identity: RightSpot Architecture and Project Management Audit Advisor.
Work mode: Continuous thinking and investigation; read-only advisory work, not implementation.
Decision status: The initial audit sections are preserved as read-only analysis. The subsequent
controlled reproduction was accepted by Main and repaired through `RIGHTSPOT-030`; its closure record
is in Section 10 and the Task File remains the implementation authority for that bounded repair. This
report remains evidence and does not authorize work outside the registered boundary.

## 1. Executive conclusion

The accepted ordinary local MVP remains runnable and the highest-value tenant-to-agent workflow was
replayed through the browser without a new business-flow blocker. The tenant proposal/confirmation
branch, agent-decline branch, empty request state, listing discovery/filter states, listing detail,
and role-specific navigation were inspected against the current Main source. The browser evidence
showed no application console error or warning beyond normal React development information.

One actionable process defect was confirmed: the package's default `npm test` command executed only
`tests/foundation.test.ts` (6 tests), while the current RightSpot test surface contains 28 test files
and the complete direct command passes 133 tests. A green default command therefore did not prove
the application or workflow suite. It was repaired as `RIGHTSPOT-029`, within its verification-
command boundary.

The current source also contained unguarded asynchronous read paths in the tenant request and
listing-detail pages. A supported isolated browser harness confirmed that the tenant request
dashboard could let an older response overwrite a newer server response; this dashboard portion was
repaired and is now `CLOSED_VERIFIED` through `RIGHTSPOT-030`. The analogous listing-detail route
concern remains `F-08`/`EVIDENCE_GAP` and is not included in that Task.

No new defect was found in the authoritative workflow state machine, role/privacy boundary, reset
authority, listing filter behavior, or normal tenant/agent happy paths. Information Request,
external authentication, Operations UI, WebMCP, Cloud Receiver, WebRTC, Redis, deployment, and
commercial marketplace behavior remain deliberately deferred or gated and are not audit failures.

## 2. Observation baseline and evidence limits

### Current source and runtime

- Repository root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`
- RightSpot package root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot`
- Branch: `main`
- Audit baseline: `e71977a95c61383906d78527e4d3e392f24581d5`
- Physical Worktrees: the canonical Main Worktree only
- RightSpot authored tracked source/docs: no uncommitted tracked changes at the audit baseline
- RightSpot untracked artifacts: existing local-only browser/history/agent files; preserved and not
  treated as product source
- Unrelated outer `Web-Game` changes and the mistaken nested reset-test artifact remain outside this
  audit's ownership and were not staged, edited, or deleted
- Closure runtime: Node.js `v24.20.0`, npm `11.19.0`, with the approved machine-local runtime
- Local server: `http://127.0.0.1:3100`, `/api/health` returned `{"ok":true,"service":"rightspot"}`

### Checks and walkthroughs

- Pinned `npm test`: pass `6/6`; this is the under-covering default command and the finding's direct
  reproduction
- Pinned complete glob test command: pass `133/133` across 28 test files, with no skip or todo
- Pinned `npm run typecheck`: pass
- Pinned `npm run build`: pass on Next.js `16.3.4`
- Fresh/reset browser walkthroughs: tenant discovery and filters; listing detail and request draft;
  tenant request dashboard; agent queue/detail/review/preparation/send; tenant proposal confirmation;
  and agent-decline terminal outcome
- Browser observations: expected role navigation, loading/empty/error/action boundaries and no
  application console error or warning observed in the inspected runs

Not verified by this audit: deployed behavior, external authentication, WebMCP or Cloud Receiver
execution, WebRTC media/signaling, production concurrency, arbitrary database corruption recovery,
or a controlled network-delay reproduction of the suspected stale-read race. The browser
instrumentation attempt failed at the tool boundary because page-context `fetch` is unavailable;
this is not evidence of an application failure.

## 3. Current implementation map

The current product path is coherent across these layers:

1. `/tenant` and `/tenant/listings/[listingId]` expose seeded published listings and the bounded
   tenant request editor.
2. `/api/tenant/request` and the command routes use the application/domain/persistence workflow
   authority rather than client-supplied state.
3. `/tenant/requests` reads a tenant-safe projection and exposes only the permitted draft,
   proposal, confirmation, decline, and terminal states.
4. `/agent` reads the assigned queue and the separate listing-interest projection.
5. `/agent/requests/[requestId]` reads the assigned request, starts review, prepares a proposal or
   decline, and requires the agent's explicit send decision.
6. The workflow store persists the shared request, slot lifecycle, audit history, idempotency, and
   fixture generation. The tenant and agent DTO/view mappers keep their private fields separate.
7. `npm run db:reset` composes the authoritative workflow reset and is covered by a child-process
   regression.

The main verification seam is currently weaker than the product seam: the package test script
names only the original foundation file even though the suite has expanded to domain, persistence,
application, API, UI-contract, and reset coverage. This is the sole confirmed follow-on finding in
this audit.

## 4. User and business journey review

### Verified healthy paths

- Signed-out root and role session boundary remained reachable.
- Tenant can discover three seeded published listings, apply bounded filters, and see an explicit
  no-results state.
- Tenant can open listing detail, save a one-to-three-time draft, submit it explicitly, and open the
  request dashboard.
- An explicitly submitted request becomes visible to the assigned agent; a pre-submission draft
  remains private.
- Agent can start review, choose a synthetic slot, prepare a tenant-facing response, add an internal
  note, and explicitly send a proposal.
- Tenant can see the proposal and confirm it; the request reaches `VIEWING_CONFIRMED` and the held
  slot reaches its confirmed outcome.
- Agent decline reaches `AGENT_DECLINED`; tenant sees the recorded response without an invalid
  tenant action.
- Empty request state provides a clear `Browse rentals` entry; role navigation exposes the tenant
  request dashboard, favourites, agent queue, and agent listing-interest surface where implemented.
- Terminal response presentation no longer falsely asks for a decision after confirmation, tenant
  decline, or expiry.

### Boundaries deliberately retained

- One bounded synthetic request, one tenant, one assigned agent, and local deterministic fixtures.
- Information Request remains deferred because contact/PII authority and retention are not accepted.
- The Operations profile remains an isolated server seam without a public page or route.
- External provider authentication remains gated on credentials and origin authorization.
- No live chat, payment, lease, listing CRUD, deployment, WebMCP, Cloud Receiver, WebRTC, Redis, or
  production-readiness claim is made.

## 5. Findings

### F-07 — Default test command under-covers the RightSpot suite

**Classification:** `VERIFIED_DEFECT` (verification-governance boundary)
**Priority:** `P1` for trustworthy local closure evidence
**Evidence:** `package.json` maps `npm test` to `tsx --test tests/foundation.test.ts`; the command
passes 6 tests. The current suite contains 28 `*.test.ts` files; the pinned complete glob command
passes 133 tests.

**Impact:** A contributor or Main-thread closure check can run the documented/default command and
receive a green result while application, workflow, persistence, API, and UI-contract tests are not
executed. This creates a misleading verification signal. It does not indicate that the current
133 tests fail; the complete suite is green.

**Recommended bounded action:** Register one verification Task to make `npm test` execute the full
RightSpot test glob and preserve the six-test foundation check under an explicit
`npm run test:foundation` command. Update only the current verification instructions and evidence
language; do not rewrite test behavior, migrate frameworks, add dependencies, or alter product
runtime behavior.

### F-08 — Tenant request-dashboard reads can apply stale responses

**Classification:** `VERIFIED_DEFECT` for the tenant request dashboard; the related listing-detail
concern remains `EVIDENCE_GAP`.
**Priority:** `P1` for tenant state fidelity
**Static evidence:** `src/ui/tenant/tenant-request-page.tsx` applies every `readTenantRequest()` result
without a request-sequence guard, and its Refresh button remains enabled during a confirm/decline
mutation. `src/ui/tenant/tenant-listing-page.tsx` similarly applies unguarded concurrent listing and
request reads after a dynamic `listingId` change. The discovery and favourites pages already use
latest-read guards, so the tenant request dashboard was a concrete inconsistency worth testing.

**Controlled reproduction — 2026-09-02:** An isolated `agent-browser` session loaded the real
`/tenant/requests` route against the local server and intercepted only the page's
`GET /api/tenant/request`. The first response was delayed 1500 ms; the second returned a newer draft
payload. Two Refresh actions 100 ms apart produced `start-1 → start-2 → return-2 → return-1`, and
the DOM ended in the older empty state (`Start with one promising home`) rather than the newer draft.
The harness was isolated and page-local; it did not alter product source or authoritative workflow
state. The fixture was reset afterward.

**Adjacent mutation/read reproduction — 2026-09-02:** With a real tenant draft fixture, the same
isolated harness captured the pre-save response, started a draft Save action, and immediately
activated the still-enabled dashboard Refresh. The event order was
`mutation-start → read-start → mutation-return → read-return`; the updated save result was first
rendered, then the delayed older read replaced it with `Original draft`. This is a second confirmed
stale-write path through the editor's direct `onSaved` callback. A post-repair control check showed
that Refresh is now disabled during a real draft mutation; the repair also invalidates any forced or
already-started read when server data is accepted.

**Impact:** The tenant can be shown an older request projection after a newer read or mutation result
has completed. The server state machine and authoritative state are not changed by this presentation
race.

**Bounded action and resolution:** `RIGHTSPOT-030` / `RS-WO-030-01` added latest-read sequencing,
invalidated older reads when authoritative page/editor data was accepted, and disabled Refresh while
a read or draft/decision mutation was in flight. It did not change the API, state machine,
persistence, or listing-detail component. The closure evidence is recorded in Section 10 and the
Task File.

**Residual evidence gap:** The analogous `tenant-listing-page.tsx` dynamic-route overlap has not been
reproduced with the same controlled harness and remains outside Task 030. Do not add a speculative
guard until it has its own evidence and accepted scope.

## 6. Recommended next gate

The recommended `RIGHTSPOT-030` serial TDD repair has completed. Its focused Red→Green evidence,
frozen-source review, full pinned suite, typecheck, build, local health/reset, and both isolated
browser race reruns are recorded in Section 10. The next gate is a fresh Main-thread cross-layer audit;
the separate listing-detail evidence gap remains outside this closed Task.

## 7. Claim boundary

This audit supports the claim that the current RightSpot Main source is a runnable, bounded ordinary
local MVP with the inspected business paths and a green complete local suite. It does not support
production readiness, external authentication, deployment, WebMCP, Cloud Receiver, WebRTC,
Redis-backed scaling, or a successful Hackathon submission.

## 8. Outcome update — 2026-09-02

`RIGHTSPOT-029` completed its bounded Red→Green verification-contract repair. `npm test` now runs
the complete authored `tests/**/*.test.ts` suite and passes `133/133`; `npm run test:foundation`
retains the explicit foundation check and passes `6/6`. Pinned typecheck, production build, local
health, reset, and minimum tenant empty-state browser smoke passed. Current status, validation,
roadmap, Runbook, Development index, and Task index were reconciled. F-07 is therefore
`CLOSED_VERIFIED` within its command/documentation scope.

At the end of the initial audit checkpoint, F-08 remained `EVIDENCE_GAP` because no controlled
delayed-response reproduction had yet been obtained. The later supported harness result and Task
registration are recorded in the current F-08 finding above and in the follow-up below.

## 9. Main-thread authority-coherence follow-up — 2026-09-02

A fresh cross-document pass found one documentation-only drift. `Docs/02-requirements.md` still
described the concrete local service/repository composition, SQLite snapshot, bounded demo session,
ordinary HTTP/JSON transport, and accessibility/responsive baseline as open implementation decisions,
although those choices are implemented or accepted by the current system design, domain/API
contracts, ADRs, and validation evidence. `Docs/00-current-status.md` also retained the responsive
baseline as an open question and contained two unmarked historical statements that the Favourite UI
Work Orders had not yet been dispatched.

**Classification:** `DOCUMENTATION_DRIFT`  
**Priority:** `P2` for source-of-truth and planning clarity  
**Product impact:** None reproduced. The ordinary local MVP source, runtime, and business-flow
behavior were not changed.

**Resolution:** The Requirements document now separates the closed local implementation baseline from
the remaining production, provider, audit-inspection, deployment, and future-integration decisions.
The Current Status document now reflects the completed Favourite integration, current `133/133`
verification contract, and the accepted responsive/accessibility baseline. No product Task was
registered because this was a bounded Main-owned documentation correction, not a runtime defect or
new product outcome.

The tenant request-dashboard portion of F-08 is now `CLOSED_VERIFIED` through `RIGHTSPOT-030`; its
separate Work Order is integrated. The listing-detail dynamic-route portion remains an `EVIDENCE_GAP`
and is not a repair authorization.

## 10. RIGHTSPOT-030 closure — 2026-09-02

`RIGHTSPOT-030` closed the confirmed tenant request-dashboard stale-read defect within its declared
single-page boundary. The Green repair makes `applyServerData` the single parent-owned server-data
writer, guards every `load()` settlement with a monotonic read id, invalidates in-flight reads when
authoritative mutation/refetch data is accepted, and lifts the editor pending signal only to disable
Refresh during draft/decision overlap. The unchanged listing-detail consumer remains compatible.

Recorded evidence:

- TDD focused regression: `3/3` passed after the staged Red failures, including the later review-found
  direct `setData` bypass.
- Pinned full suite: `npm test` `136/136` across `29` authored test files; foundation check
  `6/6`; typecheck, production build, exact-scope `git diff --check`, and `/api/health` passed.
- Independent read-only source/static review: `VERIFIED`, with full-suite/build/browser claims left to
  Main and covered above.
- Isolated browser race 1: `start-1 → start-2 → return-2 → return-1`; `Newer race home` remained
  visible and the stale empty state did not return.
- Isolated browser race 2: `mutation-start → read-start → mutation-return → read-return`;
  `Updated draft` remained visible, `Original draft` did not return, and no unavailable/error state
  appeared.
- The disposable fixture was reset to generation `15`, and a fresh tenant request page showed the
  truthful no-active-request state. Temporary verification browser sessions were closed.

The analogous `tenant-listing-page.tsx` dynamic-route overlap remains an `EVIDENCE_GAP` and was not
silently folded into this repair. No production concurrency, external-auth, deployment, WebMCP, Cloud
Receiver, WebRTC, or Redis claim follows from this closure.

## 11. Fresh Main-thread audit continuation — 2026-09-02

The Main thread continued the audit after `RIGHTSPOT-030` without opening a product implementation
Task. A read-only advisory scan found no new confirmed business-flow defect. Its static test-file count
appeared to differ from the documented suite, but the pinned `npm test` command was rerun directly and
confirmed the current result is `136/136` across `29` authored test files; the apparent discrepancy was
an inventory-method false alarm, not `RIGHTSPOT-031`.

A fresh isolated temporary browser session then replayed the ordinary agent-decline branch against the
local server at `http://127.0.0.1:3100`. The tenant submitted a real request; the assigned agent opened
the queue, started review, prepared a decline with separate tenant-facing and internal notes, and
explicitly sent it. The agent surface showed a read-only `Declined` outcome. After re-authentication as
the tenant, `/tenant/requests` showed `Agent Declined`, the tenant-facing note, no tenant action, and
the expected five-step timeline through `AGENT_DECLINED`. The internal note did not cross the tenant
projection boundary, no slot side effect appeared, and no application browser error was observed.

The temporary browser session was closed and `npm run db:reset` was run afterward; the reset returned
workflow fixture generation `16`, and `/api/health` returned `{"ok":true,"service":"rightspot"}`.
The user's existing in-app browser tab was not used or changed. This closes the fresh local browser
evidence residual for `RS-FLOW-11`. `RS-FLOW-13` remains `IMPLEMENTED_WITH_RESIDUAL_EVIDENCE` until a
fresh tenant-decline mutation browser branch is replayed; that evidence gap is not itself a product
defect and does not authorize a speculative repair. The analogous listing-detail async concern remains
`F-08`/`EVIDENCE_GAP` for the same reason.

The audit therefore found no new product Task to register. The next audit action is the bounded fresh
tenant-decline evidence branch; if it reproduces a real user-visible defect, Main will register one
single outcome Task with a falsifiable scope. Otherwise Main will record the evidence and continue the
cross-layer audit. No deployment, external authentication, WebMCP, Cloud Receiver, WebRTC, Redis, or
production-readiness claim follows from this continuation.
