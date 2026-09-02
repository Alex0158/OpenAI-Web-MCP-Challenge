# RIGHTSPOT-034: Make the cross-listing request notice status-truthful

**Type:** `defect`  
**Lifecycle:** `closed`  
**Priority:** `P2` for tenant UI clarity and truthful request-state communication  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-02  
**Depends on:** `RS-FLOW-03`, `RS-FLOW-05`, `RS-FLOW-06`, the accepted Viewing Request state vocabulary, and the closed same-listing notice repair in `RIGHTSPOT-026`

## Task Control

- Type: `defect`
- Lifecycle: `closed`
- Priority: `P2` — the cross-listing boundary describes every existing request as active even when
  the authoritative request is a private tenant draft or a terminal recorded outcome.
- Owner: Main RightSpot thread
- Current increment: Completed the pre-implementation review, recorded the expected Red, applied the
  minimal Green repair, and passed static, runtime, and fresh isolated browser gates.
- Execution posture: `CLOSED_VERIFIED`
- Evidence status: `CLOSED_VERIFIED` for the tenant listing-detail notice copy; no workflow or API
  defect is claimed.
- Next gate: Return to the Main-thread cross-layer audit. Reopen only on a newly reproduced
  status-truthfulness defect or a required boundary change.
- Reopen condition: Reopen only if a later audit shows the notice can still misdescribe the request
  state or if a fix requires a boundary outside this Task.

## Verified problem

`src/ui/tenant/tenant-listing-page.tsx` uses the same cross-listing notice whenever the tenant has a
request for a different listing:

```text
Your active request is for another listing
This bounded demo keeps one Viewing Request in play. Open the request dashboard to review the existing home and its latest status.
```

The condition is only `request !== null && request.listingId !== listing.id`; it does not inspect the
request state. That makes the heading false for both a saved `TENANT_DRAFT` and a terminal
`AGENT_DECLINED`, `TENANT_DECLINED`, `VIEWING_CONFIRMED`, or `EXPIRED` record.

### Controlled browser reproduction — 2026-09-02

1. After `npm run db:reset` at workflow fixture generation `30`, the tenant submitted a request for
   `listing-primary`; the Agent sent an `AGENT_DECLINED` response.
2. The tenant opened `/tenant/listings/listing-north`. The rendered notice still said
   `Your active request is for another listing`, although the request was terminal and read-only.
3. After a second `npm run db:reset` at generation `31`, the tenant saved (but did not submit) a
   draft for `listing-primary` and opened `/tenant/listings/listing-north`.
4. The rendered notice again said `Your active request is for another listing`, although
   `TENANT_DRAFT` is not active workflow work and remains tenant-private from the Agent.

The draft reproduction is retained at
[`var/test/audit-034-draft-cross-listing-notice-content.png`](../../var/test/audit-034-draft-cross-listing-notice-content.png).
The terminal reproduction and exact rendered text were captured in the Main-thread audit session;
the post-repair browser gate must retain a terminal screenshot as closure evidence. The isolated
session did not use the user's in-app browser and produced no application console error.

### Authority and impact

The server response is already authoritative and correctly carries the request state. This is a
tenant-only presentation defect:

- it does not alter the request state, listing selection, persistence, privacy boundary, or allowed
  action;
- it can make a tenant believe a terminal request is still awaiting work or that a draft has already
  been submitted; and
- the existing dashboard link remains the correct handoff, so no new route or recovery path is
  needed.

## Bounded objective

Repair only the existing cross-listing notice so its language reflects the authoritative request
state:

1. A `TENANT_DRAFT` for another listing is described as a saved draft.
2. `REQUEST_SUBMITTED`, `AGENT_REVIEWING`, and `SLOT_PROPOSED` for another listing are described as
   an active request.
3. `VIEWING_CONFIRMED`, `TENANT_DECLINED`, `EXPIRED`, and `AGENT_DECLINED` for another listing are
   described as a recorded request/outcome, not active work.
4. Every branch keeps the one-request boundary and the existing `/tenant/requests` dashboard handoff.
5. Same-listing draft editing and same-listing non-draft notices remain unchanged.
6. The fix stays presentation-only and uses the existing `TenantRequestDto.state` as its only state
   authority.

## Accepted copy contract

The exact wording may be refined during the pre-implementation review, but the semantic boundary is
fixed:

| Request state group | Heading | Supporting copy intent |
|---|---|---|
| `TENANT_DRAFT` | `Your saved draft is for another listing` | Explain that the draft can be reviewed/edited from the request dashboard before choosing another home |
| Active non-terminal states | `Your active request is for another listing` | Explain that the submitted/in-review/proposed request remains the one request in play and link to its dashboard |
| Terminal states | `Your recorded request is for another listing` | Explain that the completed outcome remains available as read-only context and link to its dashboard |

The copy must not imply that a draft was submitted, that a terminal record is actionable, or that a
second request can be created. The dashboard link remains `Open request dashboard`.

## Non-goals and forbidden expansion

- No server route, DTO, parser, domain state transition, projection, persistence, fixture, or API
  contract change.
- No change to the one-request rule, draft privacy, same-listing state notices, Favourite behavior,
  authentication, navigation, CSS system, or external integration.
- No new request cancellation, deletion, reopening, duplicate-request support, or replacement flow.
- No speculative dynamic-route read-concurrency repair; that separate evidence gap remains outside
  this Task unless independently reproduced.
- No modification to generated output, browser state, server configuration, Git metadata, Worktrees,
  the outer `Web-Game` application, or unrelated collaborator changes.

## Work Order

### RS-WO-034-01 — Repair cross-listing request-state notice

**Role:** Main-thread Builder and integration authority; independent read-only verification after the
focused repair  
**Pre-dispatch status:** `CLOSED_VERIFIED`  
**Execution state:** `CLOSED_VERIFIED`  
**Owner:** Main RightSpot thread  
**Parallelization:** `SERIAL_TENANT_LISTING_NOTICE` — one component and its focused contract test form
one presentation boundary; no concurrent writer may touch either file.  
**Execution profile:** `Fast` — one tenant component and one focused UI contract; no server or data
work.

### Required read set

- `src/ui/tenant/tenant-listing-page.tsx`
- `src/shared/contracts/workflow-api.ts`
- `tests/ui/tenant-listing-request-notice.test.ts`
- `Docs/04-domain-and-data-model.md`
- `Docs/05-api-and-integration-contracts.md`
- `Docs/07-business-flows-and-scenarios.md`
- `Docs/06-validation-and-evidence.md`
- `RUNBOOK.md`

### Main write set

- `src/ui/tenant/tenant-listing-page.tsx` — cross-listing notice state grouping and copy only
- `tests/ui/tenant-listing-request-notice.test.ts` — focused Red→Green presentation contract
- this Task File
- `Docs/Tasks/README.md`
- `Docs/00-current-status.md`
- `Docs/06-validation-and-evidence.md`
- `Docs/07-business-flows-and-scenarios.md`
- `Docs/Development/RIGHTSPOT-CROSS-LAYER-AUDIT-2026-09-02.md`
- `Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md`
- `RUNBOOK.md`

### Forbidden set

- All files under `src/server/`, persistence, workflow fixtures, API route handlers, and shared
  contracts
- `src/ui/tenant/tenant-api.ts`, request editor logic, Favourite components, shared navigation,
  shared/global CSS, auth/session, dependencies, media, Operations, and outer `Web-Game` files
- Any request state transition, payload, projection/privacy rule, dashboard behavior, or route
  read-concurrency behavior
- Browser tabs belonging to the user, server process configuration, generated `.next/` output, Git
  refs/commits, Worktree lifecycle, and unrelated dirty files

### Generated/local-only set

`.next/`, disposable fixture database state, isolated `agent-browser` state, screenshots, and server
logs are evidence artifacts only and must not become tracked product source.

## TDD execution contract

### Red

Extend the existing focused listing-detail contract to require distinct draft, active, and terminal
cross-listing semantics. Run only that focused test and record the expected failure against the
registered baseline before editing the component.

### Green

Implement the smallest explicit state grouping and accepted copy in the tenant listing component.
Keep same-listing branches and the dashboard handoff unchanged. Do not make a generic fallback from
an unknown state; the typed state vocabulary must remain exhaustive.

### Refactor

Only simplify a helper or constants after the focused contract is green. Do not change accepted
wording, state authority, or scope during refactor.

## Verification contract

- Focused listing-detail UI contract: Red then Green.
- Full `npm test` suite and `npm run test:foundation`.
- `npm run typecheck` and `npm run build`.
- `git diff --check` for changed tracked paths plus the local Markdown whitespace check.
- Fresh isolated browser evidence for at least one draft and one terminal cross-listing notice, with
  same-listing submitted notice and no application console errors.
- Confirm exact changed paths and that no server/API/domain/persistence/shared-contract behavior
  changed.
- Update canonical flow/status/evidence documents before closure; do not mark this Task closed from
  a passing source test alone.

## Source identity and integration boundary

- Repository root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`
- RightSpot package root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot`
- Registration source: canonical Main Worktree, branch `main`, HEAD `4224f3ae53f6d4be87a7be17e74532f5785357b0`
- Runtime baseline: `/Users/alex/.local/share/rightspot/node-v24.20.0-darwin-arm64/bin`, Node `v24.20.0`, npm `11.19.0`
- Worktree state: one canonical Main Worktree; existing mixed dirty paths are preserved and must not
  be staged or committed as part of this Work Order.

## Recorded execution

### Pre-implementation review

Main confirmed that the server-authoritative `TenantRequestDto.state` already contains the complete
accepted vocabulary and that the defect is limited to the cross-listing presentation branch. The
state groups and copy contract above were accepted without widening the write set. Same-listing
editing/notices, the one-request boundary, dashboard handoff, and the separate listing-detail
dynamic-route evidence gap remain unchanged.

### Red — 2026-09-02

The focused contract was run against the registered Main baseline before changing the component:

```text
./node_modules/.bin/tsx --test tests/ui/tenant-listing-request-notice.test.ts
3 tests; 2 passed; 1 failed
Failure: missing cross-listing state TENANT_DRAFT
```

The failure was expected and demonstrated that the source did not yet expose exhaustive
draft/active/terminal cross-listing semantics.

### Green — 2026-09-02

The tenant listing component now resolves a `RequestNotice` through an exhaustive
`crossListingNoticeForState` switch. It renders the returned heading/copy only for a request on a
different listing; the existing same-listing branch and `/tenant/requests` handoff are preserved.
The focused contract then passed `3/3`.

No Refactor changed the accepted state authority or wording after Green.

## Closure evidence

- Pinned runtime: Node.js `v24.20.0`, npm `11.19.0`.
- Fresh fixture resets reached generations `32`, `33`, and `34`; local health remained
  `{"ok":true,"service":"rightspot"}`.
- Focused TDD contract passed `3/3` after Red.
- Full `npm test` passed `145/145` across `33` authored test files; `npm run test:foundation`
  passed `6/6`; `npm run typecheck` passed; `npm run build` passed on Next.js `16.3.4`.
- Fresh isolated browser session `rightspot-audit-20260902` verified:
  - a cross-listing `TENANT_DRAFT` renders `Your saved draft is for another listing` and the
    truthful review/edit handoff; evidence:
    [`audit-034-draft-cross-listing-notice-after-content.png`](../../var/test/audit-034-draft-cross-listing-notice-after-content.png);
  - a cross-listing terminal `AGENT_DECLINED` renders `Your recorded request is for another
    listing` and completed-status copy; evidence:
    [`audit-034-terminal-cross-listing-notice-after.png`](../../var/test/audit-034-terminal-cross-listing-notice-after.png);
  - a same-listing submitted request retains the existing `Viewing Request already submitted`
    notice; evidence:
    [`audit-034-same-listing-submitted-after.png`](../../var/test/audit-034-same-listing-submitted-after.png);
  - an active cross-listing `REQUEST_SUBMITTED` renders the existing active wording;
  - no application console errors were reported in the exercised flows;
  - at `320px`, `document.documentElement.scrollWidth` equalled `innerWidth` and Tab navigation
    reached the skip link and primary navigation.
- Exact product diff is limited to `src/ui/tenant/tenant-listing-page.tsx` and its focused UI
  contract test. Canonical docs were reconciled separately in this closure. No server/API/domain/
  persistence/shared-contract, dependency, auth, CSS, generated output, or Worktree change was
  made. Existing mixed Main changes remain unstaged and uncommitted.

`RIGHTSPOT-034`, `RS-WO-034-01`, and the reproduced cross-listing presentation finding are
`CLOSED_VERIFIED` within this bounded local claim. This does not claim external authentication,
deployment, notifications, WebMCP, Cloud Receiver, WebRTC, Redis, or production readiness.
