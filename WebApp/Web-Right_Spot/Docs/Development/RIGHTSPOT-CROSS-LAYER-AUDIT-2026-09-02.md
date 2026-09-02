# RightSpot Cross-Layer Audit — 2026-09-02

Agent identity: RightSpot Architecture and Project Management Audit Advisor.
Work mode: Continuous thinking and investigation; read-only advisory work, not implementation.
Decision status: The following is analysis and recommendation only. It is not a confirmed task,
accepted decision, implementation authorization, or canonical product writeback. The main thread
must decide whether to register any follow-on work.

## 1. Executive conclusion

The accepted ordinary local MVP remains runnable and the highest-value tenant-to-agent workflow was
replayed through the browser without a new business-flow blocker. The tenant proposal/confirmation
branch, agent-decline branch, empty request state, listing discovery/filter states, listing detail,
and role-specific navigation were inspected against the current Main source. The browser evidence
showed no application console error or warning beyond normal React development information.

One actionable process defect is confirmed: the package's default `npm test` command executes only
`tests/foundation.test.ts` (6 tests), while the current RightSpot test surface contains 28 test files
and the complete direct command passes 133 tests. A green default command therefore does not prove
the application or workflow suite. This should be repaired as a small verification-governance Task
before the next closure claim.

The current source also contains an unguarded asynchronous read path in the tenant request and
listing-detail pages. An overlapping refresh/mutation or route change could theoretically let an old
read overwrite a newer server response. The browser tool could not reproduce this because its page
context does not expose `fetch` for controlled-delay instrumentation. This remains an
`EVIDENCE_GAP`, not a confirmed product defect or an automatic repair authorization.

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

### F-08 — Overlapping tenant reads need a controlled reproduction

**Classification:** `EVIDENCE_GAP`
**Priority:** `P2` until reproduced
**Static evidence:** `src/ui/tenant/tenant-request-page.tsx` applies every `readTenantRequest()` result
without a request-sequence guard, and its Refresh button remains enabled during a confirm/decline
mutation. `src/ui/tenant/tenant-listing-page.tsx` similarly applies unguarded concurrent listing and
request reads after a dynamic `listingId` change. The discovery and favourites pages already use
latest-read guards, so this is an inconsistency worth examining.

**Potential impact:** A slower pre-mutation or previous-route read could temporarily replace a newer
server response in the rendered UI. The authoritative server state is not thereby changed, and no
controlled browser reproduction was obtained.

**Next evidence gate:** Reproduce with a real controllable delayed-response test or a supported
browser/network harness. If reproduced, register a separate bounded UI concurrency Task with a
focused failing regression before changing the components. If not reproduced or judged immaterial
to the bounded demo, record the accepted residual and do not add speculative guards.

## 6. Recommended next gate

Proceed with `RIGHTSPOT-029` for F-07 as a small serial verification-contract repair. After its
Red→Green change and current-document reconciliation, rerun the full pinned suite, typecheck,
build, and the minimum browser smoke. Then return to the Main-thread audit and decide whether F-08
has enough evidence to become a real Task.

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

F-08 remains `EVIDENCE_GAP`: no controlled delayed-response reproduction was obtained, so no UI
concurrency Task has been registered. The next Main-thread audit should revisit it only with a
supported network-delay or deterministic test harness.
