# RightSpot — Validation and Evidence

**Role:** Product validation, test strategy, and claim boundary  
**Status:** Validation plan; the runnable foundation, workflow domain core, durable application
boundary, tenant discovery API, workflow HTTP/DTO transport, shared shell, shared role-page frame,
accepted ordinary role-page product workflow, and post-MVP shared CSS foundation are independently
verified or integrated.
The current frozen Operations WebMCP candidate complete suite passes `201/201` across the current
authored test files; the latest bounded
cross-layer findings `F-17` / `RIGHTSPOT-039` and `F-18` / `RIGHTSPOT-040` are closed within their
tenant listing-detail and Discovery error-copy truthfulness scopes. The subsequent audit reproduced
`F-19` / `RIGHTSPOT-041`, a tenant request-editor success-feedback lifecycle defect; its bounded
parent-owned repair is now `CLOSED_VERIFIED`. A fresh isolated browser replay covered listing-detail
save, request-dashboard submit, and stale-version conflict recovery. Subsequent isolated audits
covered Favourite persistence and the tenant-to-Agent listing-interest boundary, tenant route-entry
and visual surfaces, and the Agent listing-interest failure/retry boundary. The latest disposable
fixture reset was generation `77`; `/api/health` remained healthy after the latest verification.

## 1. Current evidence level

The current RightSpot evidence includes a local foundation implementation, an independently verified
workflow domain core, durable application boundary, tenant discovery API, workflow HTTP/DTO transport,
shared shell, shared role-page frame, and the accepted ordinary tenant-to-agent role-page workflow,
plus main-thread reproduction and corrected independent Verifier reruns. The first
foundation attempt is retained as procedurally `BLOCKED` because one assertion wrote outside the
declared RightSpot output boundary; the corrected rerun returned `VERIFIED` with the same source
manifest and no external output. The outer Re-entry Core's tests and frozen MVP evidence do not prove
that RightSpot works. They must not be copied into RightSpot's evidence as product proof.

The first validation target is a stable Happy Path, not commercial completeness. Edge cases still
matter where they could break the demo or violate role/privacy boundaries, but exhaustive
marketplace, account, payment, messaging, and distributed-system coverage is intentionally
deferred.

The canonical scenario inventory, transition matrix, role-entry map, current implementation
disposition, and open findings are maintained in
[`07-business-flows-and-scenarios.md`](07-business-flows-and-scenarios.md). A scenario may be
implemented without being evidence-closed; the catalogue records that distinction explicitly.

## 2. Validation ladder

### Level 0 — Documentation coherence

Confirm that the product thesis, primary slice, state model, role projections, Backbone boundary,
non-goals, and open decisions agree with one another.

### Level 1 — Domain and Backbone tests

Test the documented state transitions, role authorization, version conflicts, expiry, reset,
preparation versus human consequence, repeated actions, slot release, and role-private data
isolation without a browser or external service.

### Level 2 — Ordinary application integration

Run the tenant and agent surfaces against one local composition. Prove that one Viewing Request
can move through the primary slice and that a fresh page read sees the authoritative current state.

The minimum walkthrough is: tenant login → listing discovery → listing detail → Viewing Request
draft → explicit submission → tenant status → agent login → queue refresh → request/review →
availability review → prepared proposal or decline → visible agent send decision → tenant status
refresh → tenant confirmation or decline when a slot was proposed → final tenant status.

### Level 3 — Product usability rehearsal

Ask a fresh evaluator to understand the problem, create one request, review the agent workflow,
and identify the human decision. Record confusion, unnecessary setup, and time-to-completion.

### Level 4 — Optional Hackathon integration

Only after the ordinary product loop works, separately prove genuine WebMCP usage, any selected
continuation adapter, Cloud Receiver integration if required, live deployment, and judge
reproducibility. Each claim needs its own evidence.

## 3. Primary slice acceptance criteria

The first RightSpot implementation should not be considered complete until it can demonstrate:

- deterministic reset to the seeded listing catalogue, one tenant, one agent, no request, and a new
  fixture generation;
- tenant draft validation and visible submission;
- authoritative `REQUEST_SUBMITTED` transition;
- agent queue and role-authorized request projection;
- current synthetic availability read;
- bounded slot proposal or decline preparation;
- visible human agent decision;
- tenant-visible proposal or decline response;
- tenant confirmation or decline of an unexpired proposal, including the terminal result;
- one shared request record with monotonic version continuity;
- no duplicate consequence or audit entry after a repeated completed action;
- slot hold, confirmation, release, and expiry behavior;
- no tenant access to agent-only notes;
- no agent access to tenant private context; and
- clear failure for stale or unauthorized writes.

The first implementation does not need exhaustive failure testing. It does need enough basic
guardrails to prevent a broken walkthrough: invalid role access, missing request, invalid draft,
stale write, invalid state transition, unavailable slot, expired proposal, failed reset, duplicate
submission, and accidental cross-role data exposure.

The current cross-layer audit reproduced three guardrail failures. `F-01` was repaired by enforcing
the pre-submission privacy rule at both authoritative agent read paths: a tenant `TENANT_DRAFT` is
visible to the tenant but absent from the agent queue and direct detail until explicit submission.
`F-02` was repaired by handling the expected session `401` before optional body parsing, and `F-03`
was repaired by allowing the documented `127.0.0.1` development origin through the exact Next.js
config boundary. All three repairs have focused Red/Green evidence, independent verification, and
the applicable browser/build evidence recorded in their Task Files. `F-01` additionally has the
formal persistent Verifier result recorded in `RIGHTSPOT-025`; the current audit has no reproduced
open guardrail finding. The next audit must still re-check the full chain rather than turning these
local checks into a production-readiness claim.

The subsequent rendered-page audit reproduced one P2 presentation finding, `F-04`: the same-listing
request notice composed its state label into ungrammatical and, for later states, inaccurate copy. The
bounded presentation-only `RIGHTSPOT-026` repair passed Red→Green, full direct suite `129/129`,
typecheck, production build, live browser evidence, and independent persistent verification. It did not
alter or block the authoritative tenant-to-agent workflow.

The next tenant request-surface audit reproduced one separate P2 presentation finding, `F-05`: the
response card renders a retained `SLOT_PROPOSAL` as `Action needed` with `Respond by` after the
authoritative request has already become `VIEWING_CONFIRMED`, `TENANT_DECLINED`, or `EXPIRED`. The
bounded presentation-only `RIGHTSPOT-027` Task is now `CLOSED_VERIFIED`: its single UI Work Order
was implemented by persistent task `01a060bf-17c7-7c32-96ad-2ea1aa028ebf` and independently verified by
`01a060a8-6f2d-7141-98d0-385483a9104f`. Focused `3/3`, relevant `48/48`, full `132/132`, typecheck,
production build, exact scope/hash checks, and safe browser smoke passed. The finding did not indicate a
workflow, projection, privacy, or slot-transition defect; the existing response presentation now
consumes authoritative request state and removes actionable deadline language from terminal outcomes.

The subsequent reset-boundary audit reproduced `F-06`: the documented `npm run db:reset` command
previously bypassed the full workflow reset. `RIGHTSPOT-028` repaired only that CLI composition and
its isolated child-process regression. Main Red→Green checks and persistent frozen-source independent
verification passed at integrated commit `b2c1682a34a395ff9471f4338b213a0ede938134`: focused `1/1`,
full direct suite `133/133`, pinned typecheck, production build, whitespace, exact scope, and
repeated reset/reopen evidence all passed. The reset remains a disposable local development/test
boundary; arbitrary corrupt-database salvage, production data management, deployment, WebMCP, and
external authentication remain non-claims.

The 2026-09-02 Main-thread cross-layer audit also reproduced a verification-governance defect:
`npm test` executes only `tests/foundation.test.ts` and passes `6/6`, while the authored RightSpot
suite contains 28 test files and the complete pinned glob command passes `133/133`. This was recorded
as `F-07` and repaired through `RIGHTSPOT-029`: `npm test` now runs the complete suite, while
`npm run test:foundation` reports the foundation-only result separately. The Task is
`CLOSED_VERIFIED` within that command/documentation boundary. The same audit initially recorded the
overlapping-read concern as `F-08`/`EVIDENCE_GAP`. A subsequent supported isolated browser harness
reproduced the tenant request-dashboard race: two reads completed in the order
`start-1 → start-2 → return-2 → return-1`, and the older response overwrote the newer rendered
projection. The dashboard portion is therefore `VERIFIED_DEFECT` and is registered as
`RIGHTSPOT-030` for a bounded latest-read, mutation-invalidation, and Refresh guard. A second
isolated reproduction started a draft Save and the still-enabled Refresh together; the updated save
result was then overwritten by the delayed older parent read. The separate un-reproduced
`tenant-listing-page.tsx` dynamic-route concern remains `EVIDENCE_GAP` and is not included in that
Task. The reproduction harness was page-local and isolated; it did not mutate authoritative
workflow state or serve as a product fallback.

## 3.1 RIGHTSPOT-030 stale-read closure evidence — 2026-09-02

`RIGHTSPOT-030` is `CLOSED_VERIFIED` for the tenant request-dashboard portion of `F-08`. The
minimal TDD repair centralizes server-data acceptance in `applyServerData`, sequences parent reads,
invalidates an in-flight read when authoritative mutation/refetch data is accepted, and disables
Refresh while a read or draft/decision mutation is pending. It preserves the existing API,
workflow state machine, persistence, listing-detail consumer compatibility, and role boundary.

The focused regression passes `3/3` after the recorded Red checkpoints. The pinned complete suite
passes `136/136` across `29` authored test files; `npm run test:foundation` passes `6/6`; typecheck,
production build, exact-scope `git diff --check`, and local `/api/health` pass. An independent
read-only source/static verifier returned `VERIFIED`, with its claim limit explicitly excluding the
full suite, build, and browser; Main supplied those checks.

Two isolated browser races were rerun against the repaired source. The delayed-read sequence
`start-1 → start-2 → return-2 → return-1` left the newer `Newer race home` visible and did not return
the stale empty state. The forced adjacent mutation/read sequence
`mutation-start → read-start → mutation-return → read-return` left `Updated draft` visible and did
not return `Original draft` or an unavailable/error state. The fixture was reset to generation `15`
and the fresh tenant request page showed the truthful no-active-request state afterward.

The analogous `tenant-listing-page.tsx` dynamic-route overlap remains an `EVIDENCE_GAP`; no
speculative guard or broader async infrastructure is claimed. This closure does not prove production
concurrency guarantees, deployment, external authentication, WebMCP, Cloud Receiver, WebRTC, or
Redis readiness.

## 3.2 Fresh local decline walkthroughs — 2026-09-02

An isolated temporary browser session replayed the ordinary agent-decline branch against the running
local RightSpot server. A tenant created and explicitly submitted a viewing request, the assigned
agent opened the queue, started review, prepared a decline with separate tenant-facing and internal
notes, and explicitly sent the response. The agent surface then showed a read-only `Declined` outcome.
After re-authentication as the tenant, `/tenant/requests` showed `Agent Declined`, the tenant-facing
note, and no remaining tenant action. The internal note was absent from the tenant projection; no slot
was held; the timeline showed the expected draft, submission, review, preparation, and decline events.
No application browser error was observed. The temporary session was closed and the fixture was reset
afterward; the user's existing in-app browser tab was not used for this evidence run.

This closes the required local browser evidence for `RS-FLOW-11`. It does not claim external
notification, deployment, production concurrency, or any deferred WebMCP, Cloud Receiver, WebRTC,
Redis, or external-auth behavior.

The same audit then replayed the tenant-decision branch from a fresh reset: an agent prepared and
explicitly sent a slot proposal, the tenant viewed it on `/tenant/requests` and explicitly selected
`Decline proposed viewing`, and the tenant projection changed to `Tenant Declined` with no remaining
action. The timeline reached version 6. A subsequent agent read showed the request as terminal and the
formerly held slot as `Available`, confirming release. No application browser error was observed and
the temporary session was closed before the fixture was reset.

This closes the required local browser evidence for `RS-FLOW-13`. It does not claim external
notification, deployment, production concurrency, or any deferred integration.

## 3.3 RIGHTSPOT-031 conflict-recovery feedback closure — 2026-09-02

The Main-thread audit reproduced a P2 tenant presentation defect on both request surfaces. A stale
draft submit returned `409`, the recovery read returned `200` with the newer authoritative request,
and the version-keyed editor remounted before its local conflict message could remain visible. The
same editor also used refresh-success wording when its recovery read failed. The server state and
workflow transition were correct; the defect was limited to feedback ownership and truthful copy.

The serial `RIGHTSPOT-031` repair lifts the conflict notice to parent-owned state in both
`/tenant/requests` and `/tenant/listings/listing-primary`. Successful recovery accepts the server
response first and then reports a neutral status notice outside the version-keyed editor. Failed
recovery reports an error that explicitly says the latest view could not be refreshed and asks the
tenant to reload. Ordinary reads and successful mutations clear the notice. No retry, replay,
optimistic workflow patch, API/domain/persistence change, or change to the listing-detail
`Promise.all` read sequencing was introduced.

Recorded evidence:

- TDD focused source contract: initial Red before implementation, then final `1/1` Green;
- pinned `npm test`: `137/137` across `30` authored test files;
- pinned foundation check: `6/6`; typecheck, production build, and `/api/health` passed;
- isolated listing-detail browser run: `POST /api/tenant/request/submit → 409`, recovery
  `GET /api/tenant/request → 200`, authoritative request version `2`, and the conflict notice
  remained visible with the externally updated draft;
- isolated request-dashboard browser run: the same sequence reached authoritative version `3`,
  retained the external note, and kept the conflict notice visible outside the editor;
- the failed-refetch branch is covered by the focused source contract and explicit copy, without a
  separate browser interception claim because the route harness did not replace the exact recovery
  response; and
- the stale command remained non-mutating in both browser runs, the fixture was reset to generation
  `21`, the temporary browser session was closed, and the user's existing in-app browser tab was not
  used or changed.

This closes `F-09` and the `RIGHTSPOT-031` acceptance gate within the local presentation boundary.
It does not close the separate `tenant-listing-page.tsx` dynamic-route `F-08` evidence gap or claim
production concurrency, deployment, external authentication, WebMCP, Cloud Receiver, WebRTC, Redis,
or external notification behavior.

## 3.4 Fresh Main-thread route, role, and responsive audit — 2026-09-02

The Main thread recaptured the current source identity at `HEAD=a21f4f4d35e8d01c6b132490ef0a4ff99f8a62f9`
on `main`. RightSpot authored tracked source and documentation were clean; existing untracked local
artifacts and unrelated outer `Web-Game` changes were preserved. The pinned runtime was Node.js
`v24.20.0` with npm `11.19.0`. The running local server was `http://127.0.0.1:3100` and
`/api/health` returned `{"ok":true,"service":"rightspot"}`.

## 7.12 Role/session boundary and missing-resource evidence — 2026-09-02

In isolated `agent-browser` session `rightspot-audit-082`, Main verified the signed-out root, both
role sessions, direct wrong-role route access, an unknown Tenant listing, and an Agent request-detail
route under a Tenant session. The root exposed only the bounded Tenant and Property agent entry
controls. Each valid session exposed only its own workspace navigation; direct access to the other
role's route rendered the explicit server-resolved role mismatch without that role's data or actions.
Signing out made direct `/tenant` access show the bounded sign-in boundary with no catalogue content.

The unknown listing rendered `Listing details are unavailable`, bounded not-found copy, and `Retry
listing`. Tenant access to the Agent request detail rendered the role mismatch without private markers.
The browser error check was empty, no fixture or source state changed, and `/api/health` remained
healthy after the session closed. The exercised navigation in mismatch states remained limited to the
actor's valid workspace links, so it was treated as recovery rather than unauthorized exposure.

No new Task was registered. This verifies the exercised local role/session and missing-resource
boundaries only; external authentication and production authorization remain outside the claim.

## 7.13 Fresh end-to-end tenant-to-Agent confirmation evidence — 2026-09-02

In isolated `agent-browser` session `rightspot-audit-083`, Main reset the disposable fixture to
generation `78` and replayed the primary rendered application chain. Tenant draft creation/save and
explicit submit produced `REQUEST_SUBMITTED`, version `2`; the tenant request dashboard showed the
server-authoritative request, note, preferred time, and tenant-safe timeline with no action available.

After switching roles through the root session surface, the Agent queue showed one `Needs review`
request. The Agent started review, selected `slot-primary-2`, saved a tenant-facing preparation without
sending, then explicitly sent it. The Agent response became `SLOT_PROPOSED`, version `5`; its decision
record was read-only and the send action disappeared. The Tenant then saw the selected
`4 Sept 2026, 15:00–15:30` time separately from the preferred time and explicitly confirmed it.

The final tenant read returned `VIEWING_CONFIRMED`, version `6`, with the selected UTC slot. Reload
retained the recorded time and removed `Action needed`, `Respond by`, and decision controls. The Agent
queue moved the request to confirmed history, and the terminal detail exposed only read/refresh
controls. Repeated reads preserved the terminal state and timeline versions `1` through `6`. Browser
error checks were empty. The fixture was reset to generation `79`, and `/api/health` returned
`{"ok":true,"service":"rightspot"}`.

No new Task was registered. This verifies the exercised ordinary local chain only; notifications,
external authentication, deployment, WebMCP, Cloud Receiver, WebRTC, Redis, and production readiness
remain outside the claim.

## 7.14 Fresh Agent-decline terminal evidence — 2026-09-02

In isolated `agent-browser` session `rightspot-audit-084`, Main reset the fixture to generation `80`
and replayed the alternate rendered terminal branch. Tenant draft/save and explicit submit produced
`REQUEST_SUBMITTED`, version `2`. The Agent started review, selected `Decline request`, entered a
bounded tenant-facing reason, saved preparation without sending, and explicitly sent the response.
The Agent read returned `AGENT_DECLINED`, version `5`; its decision record was read-only and the send
action disappeared.

After switching roles through the root, the Tenant dashboard rendered the bounded Agent-decline reason,
preferred time, and tenant-safe five-entry timeline. Reload retained the terminal state and left only
`Refresh`; no tenant decision actions remained. The Agent queue moved the item to `Declined` history
with `View recorded request`, and terminal detail exposed only read/refresh controls. Browser error
checks were empty. The fixture was reset to generation `81`, and `/api/health` remained healthy.

No new Task was registered. This verifies the exercised Agent-decline local terminal boundary only;
external notification, authentication, deployment, WebMCP, Cloud Receiver, WebRTC, Redis, and
production readiness remain outside the claim.

## 7.15 Rendered route-entry and accessibility sweep — 2026-09-02

In isolated `agent-browser` session `rightspot-audit-085` at fixture generation `81`, Main reviewed
the signed-out Root, Tenant catalogue/Favourites/My request/listing-detail routes, Agent queue, and
Agent request-unavailable detail. Rendered role entry, Tenant navigation, listing anchors, empty-state
Browse rentals handoffs, Agent queue/interest refresh controls, and missing-request Back to queue/Retry
controls were all present and bounded. The three seeded listing details rendered their corresponding
identity, media, and Viewing Request entry surface.

At `320px`, body and document widths remained `320px` on every checked route. Listing images were
complete with non-zero natural dimensions; the first Tab on both Tenant and Agent workspaces focused
the skip link and activating it moved focus to main content. Browser error checks were empty, the
fixture was not mutated, and the disposable session was closed with healthy `/api/health`.

No new Task was registered. This verifies current route-entry, recovery, responsive-floor, and
keyboard-entry evidence only; it does not claim complete visual design review, external authentication,
deployment, WebMCP, Cloud Receiver, WebRTC, Redis, or production readiness.

## 7.16 Fresh Tenant-decline terminal evidence — 2026-09-02

In isolated `agent-browser` session `rightspot-audit-086` at fixture generation `81`, Main replayed
Tenant submit, Agent review/prepare/send, Tenant proposal/decline, reload persistence, and Agent
terminal-history presentation. Authoritative versions progressed `1 → 6`; the selected slot was held
after proposal and released after the Tenant decline. The Tenant terminal surface retained the
tenant-safe response and timeline while removing decision actions. The Agent queue moved the item to
`Tenant declined` history with a read-only detail. Browser error checks were empty; the fixture was
reset to generation `82`, and `/api/health` remained healthy.

No new Task was registered. This verifies the exercised Tenant-decline local terminal boundary only;
external notification, authentication, deployment, WebMCP, Cloud Receiver, WebRTC, Redis, and
production readiness remain outside the claim.

## 7.17 Current Task and decision status reconciliation — 2026-09-02

Main compared the current Task ledger, accepted ADRs, implementation Task Files, and current status.
The reconciliation found stale current wording that treated the closed `RIGHTSPOT-020` Favourite
implementation as absent or unresolved in adjacent proposal/architecture records. Main corrected only
those current dependency and evidence statements, retained historical dispatch narrative, and confirmed
that `RIGHTSPOT-009` Information Request remains deferred. No source or runtime behavior changed; no
new Task was registered. Documentation validation and repository validation passed.

The complete pinned `npm test` command passed `137/137` across 30 authored test files. The explicit
foundation command passed `6/6`, and `npm run typecheck` passed. An isolated browser session checked
the signed-out tenant request guard, the tenant discovery, listing-detail, favourites, and request
surfaces, the tenant-on-agent wrong-role guard, the agent queue and listing-interest surface, and the
agent request-detail unavailable state. No application page error was observed. At a `320px` viewport,
the inspected tenant and agent routes each reported `document.documentElement.scrollWidth` equal to
the client width, with no horizontal overflow.

The remaining `F-08` listing-detail dynamic-route concern was tested as an evidence question, not
treated as a defect. A page-local delayed-fetch harness could not produce a valid same-document route
switch: the current rendered listing links are ordinary anchor navigations, and the page-local
interceptor was lost when the document changed. The source still contains an unguarded `Promise.all`
load settlement, so the concern remains an `EVIDENCE_GAP`; this run does not prove production
concurrency safety and does not authorize a speculative guard or a new Task.

Within this route, role, and responsive audit scope, no new defect was reproduced. A subsequent
controlled proposal-response comparison is recorded in Section 3.5 below and supersedes the broader
"no new finding" statement for the same audit date. Existing closed workflow, role/privacy,
terminal-state, conflict-feedback, and dashboard read-race claims remain bounded by their Task Files.
No external authentication, WebMCP, Cloud Receiver, WebRTC, Redis, deployment, or
production-readiness claim follows from this audit.

## 3.5 Fresh tenant proposal-response comparison — 2026-09-02

The Main thread used a fresh local fixture generation `24` and an isolated browser session against
`http://127.0.0.1:3100`. Static gates remained green before the reproduction: pinned `npm test`
passed `137/137` across 30 authored test files, `npm run test:foundation` passed `6/6`,
`npm run typecheck` passed, and `/api/health` returned `{"ok":true,"service":"rightspot"}`.

The controlled setup created and submitted a tenant request with a preferred time rendered as
`18 September 2026, 10:00`, then had the assigned agent explicitly send a proposal for
`slot-primary-2`. The server response identified the authoritative slot as
`2026-09-04T14:00:00.000Z` to `2026-09-04T14:30:00.000Z`, which is `4 September 2026,
15:00–15:30` under the existing Europe/London display contract. The agent page could resolve and
display those slot facts.

The tenant `/tenant/requests` page displayed the tenant's preferred time, `Slot reference
slot-primary-2`, the agent note, deadline, and confirm/decline controls, but the rendered body did
not contain `4 September 2026` or the proposed time range. An isolated browser screenshot is retained
at `var/test/audit-proposal-missing-slot.png`; browser console/error checks showed no application
error. This is a verified tenant projection/comprehension defect, not a browser-tool failure or a
workflow transition failure.

`F-10` is registered as `RIGHTSPOT-032`. The bounded correction must resolve only the selected sent
slot into tenant-safe `startsAt`/`endsAt` facts, preserve the existing terminal action/deadline
rules, and reject missing/mismatched relations rather than falling back to preferred times, guessed
dates, or an opaque reference. No implementation or closure claim is made in this section.

## 3.6 RIGHTSPOT-032 selected-time projection closure — 2026-09-02

The Main-thread serial Work Order added the tenant-safe `viewingSlot` projection and presentation
without changing workflow transitions, persistence, agent/private projections, or deferred
integrations. The focused TDD contracts passed for authoritative slot resolution, missing and
wrong-listing relation failures, terminal selected-time retention, parser privacy filtering, and
incomplete-proposal action blocking.

Final static evidence on the canonical Main Worktree:

- pinned complete `npm test`: `143/143` across `32` authored test files;
- pinned `npm run test:foundation`: `6/6`;
- `npm run typecheck`: passed;
- `npm run build`: passed with Next.js `16.3.4`, React `19.2.8`, and TypeScript `7.0.2`; and
- `git diff --check`: passed for the RightSpot scope.

A fresh isolated browser run reset the fixture to generation `25`, created a tenant request with a
preferred time rendered as `18 Sept 2026, 10:00`, and had the agent send `slot-primary-2`. The tenant
proposal view rendered the agent-selected `4 Sept 2026, 15:00–15:30` separately from the preference,
then the tenant explicitly confirmed it. The terminal view retained the recorded selected time and
removed `Action needed`, `Respond by`, and the decision controls. The tenant JSON contained exactly
`startsAt`/`endsAt` under `viewingSlot` and no slot status, holder, internal note, or other private
field; browser console/error checks reported no application error. Evidence screenshots are retained
at `var/test/rightspot-032-proposal-after.png` and `var/test/rightspot-032-terminal-response-final.png`.

`F-10`, `RS-FLOW-12`, `RS-FLOW-13`, `RS-FLOW-14`, `RIGHTSPOT-032`, and `RS-WO-032-01` are therefore
`CLOSED_VERIFIED` within this bounded local projection/presentation claim. This does not claim
external authentication, deployment, scheduler/notification, WebMCP, Cloud Receiver, WebRTC, Redis,
or production readiness.

## 3.7 RIGHTSPOT-033 Agent queue state/history presentation closure — 2026-09-02

The fresh Main-thread audit continued from the generation-25 proposal/confirmation evidence with a new
reset to workflow fixture generation `26`. An isolated browser session replayed the tenant submission,
agent proposal, and tenant confirmation path. On `/agent`, the server-backed request was visibly
`Confirmed` at version `6`, but the dashboard still used the heading `See what needs a human response`,
showed only four state cards (`Needs review`, `In review`, `Proposal sent`, and `Declined`, all `0`),
and gave the terminal card the footer `Review request →`. The run had no application console or route
error; the original screenshot is retained at `var/test/audit-agent-queue-terminal-counts.png`.

Static review confirmed that `toAgentQueueView` already returns counts for every workflow state and the
assigned request for every non-draft state, while `agent-dashboard-page.tsx` rendered only a four-state
subset and one undifferentiated request list. This was a UI-consumer truthfulness defect, not a missing
API field, workflow failure, privacy regression, or persistence issue.

`F-11` was registered as `RIGHTSPOT-033` with one serial Work Order `RS-WO-033-01`. Main accepted the
presentation-only contract, captured the focused Red failure, and completed the smallest Green repair.
The final dashboard now presents the three active states separately from the four terminal/recorded
states, uses the server-provided counts, partitions request cards, and uses `View recorded request`
for terminal history. The existing API/domain/persistence/privacy boundary remains unchanged.

Closure evidence passed:

- focused TDD contract: Red `Missing ACTIVE_QUEUE_STATES contract`, then Green `1/1`;
- pinned `npm test`: `144/144` across `33` authored test files;
- pinned `npm run test:foundation`: `6/6`; typecheck, build, and tracked-scope `git diff --check`:
  passed;
- isolated browser generation `27`: active request/proposal counts and card were separated from
  confirmed terminal history, with `Review request` versus `View recorded request` wording;
- isolated `320px` check: document/body width both `320`, no horizontal overflow, and keyboard focus
  reached the terminal request link with a visible outline;
- isolated fresh reset generation `28`: all seven non-draft counts were zero, both truthful empty
  states rendered, and `TENANT_DRAFT` remained absent from the Agent queue; and
- no application console or route error was observed. Evidence screenshots are retained at
  `var/test/agent-queue-active.png`, `var/test/agent-queue-terminal-content.png`, and
  `var/test/agent-queue-terminal-320.png`.

`F-11`, `RIGHTSPOT-033`, and `RS-WO-033-01` are `CLOSED_VERIFIED` within the bounded Agent-dashboard
presentation claim. This does not claim external authentication, deployment, notifications, WebMCP,
Cloud Receiver, WebRTC, Redis, or production readiness.

## 3.8 RIGHTSPOT-034 cross-listing request-status presentation closure — 2026-09-02

The fresh Main-thread audit inspected the tenant listing-detail branch where a request belongs to a
different listing. The server response already carried the authoritative request state, but the UI
used one `Your active request is for another listing` notice for every non-null cross-listing request.
Controlled isolated browser reproductions showed the same wording for a private `TENANT_DRAFT` and a
terminal `AGENT_DECLINED` request. This was classified as `F-12`, a P2 presentation truthfulness defect;
no workflow, API, domain, persistence, privacy, or route-read failure was reproduced.

`RIGHTSPOT-034` / `RS-WO-034-01` accepted one serial presentation-only Work Order. The focused
contract first failed Red with the missing `TENANT_DRAFT` cross-listing case, then passed Green `3/3`
after the component added an exhaustive state grouping:

- `TENANT_DRAFT` is described as a saved draft;
- `REQUEST_SUBMITTED`, `AGENT_REVIEWING`, and `SLOT_PROPOSED` remain active;
- `VIEWING_CONFIRMED`, `TENANT_DECLINED`, `EXPIRED`, and `AGENT_DECLINED` are recorded outcomes.

The one-request boundary, `/tenant/requests` handoff, same-listing editor/notices, and typed state
authority remain unchanged. Closure evidence passed with pinned Node.js `v24.20.0` / npm `11.19.0`:

- full `npm test` `145/145` across `33` authored test files;
- `npm run test:foundation` `6/6`, typecheck, production build, and tracked-scope diff checks;
- fresh reset generations `32`, `33`, and `34` with local health `{"ok":true,"service":"rightspot"}`;
- isolated browser session `rightspot-audit-20260902` showing truthful draft, active, terminal, and
  same-listing submitted notices with no application console errors;
- `320px` document width equal to viewport width and keyboard focus reaching the skip link and primary
  navigation.

Evidence screenshots are retained at
`var/test/audit-034-draft-cross-listing-notice-after-content.png`,
`var/test/audit-034-terminal-cross-listing-notice-after.png`, and
`var/test/audit-034-same-listing-submitted-after.png`. `F-12`, `RIGHTSPOT-034`, and
`RS-WO-034-01` are `CLOSED_VERIFIED` within this bounded tenant presentation claim. No implementation
Worktree was opened; existing mixed Main changes remain uncommitted. This does not claim external
authentication, deployment, notifications, WebMCP, Cloud Receiver, WebRTC, Redis, or production
readiness.

## 3.9 RIGHTSPOT-035 preferred-time removal accessibility closure — 2026-09-02

The next Main-thread audit reproduced `F-13` in the tenant Viewing Request editor. With two preferred
times, both structural removal controls exposed the same accessible name, `Remove`, even though each
was visually adjacent to a different numbered option. This was a P2 accessibility defect: a keyboard
or screen-reader user could not identify the row targeted by the action. No workflow, validation,
request mutation, API, or persistence defect was reproduced.

`RIGHTSPOT-035` / `RS-WO-035-01` accepted one serial presentation-only Work Order. The focused
contract failed Red because the unique accessible-name attribute was absent, then passed Green after
the existing button received the derived name `Remove preferred viewing time option N`. The visible
text, one-to-three boundary, row-filter removal behavior, chronological validation, and request
payload boundary were unchanged.

Closure evidence passed with pinned Node.js `v24.20.0` / npm `11.19.0`:

- full `npm test` `147/147` across `34` authored test files;
- `npm run test:foundation` `6/6`, typecheck, production build, and tracked-scope diff checks;
- isolated browser accessibility snapshot showing distinct names for Options 1 and 2;
- removal of Option 2 leaving only the original Option 1 value and no removal control;
- reverse-ordered values preserving the validation alert with a cleared request log reporting
  `No requests captured` after the blocked save;
- enabled native buttons with `tabIndex=0`, no `320px` horizontal overflow, and empty browser errors.

Evidence is retained at `var/test/audit-035-preferred-time-remove-buttons.png`. `F-13`,
`RIGHTSPOT-035`, and `RS-WO-035-01` are `CLOSED_VERIFIED` within this bounded tenant-editor
accessibility claim. The separate observation that the validation alert remains visible immediately
after a structural row removal is not included in this closure and must be reproduced independently
before registration of another Task. No implementation Worktree was opened; existing mixed Main
changes remain uncommitted. This does not claim external authentication, deployment, notifications,
WebMCP, Cloud Receiver, WebRTC, Redis, or production readiness.

## 3.10 RIGHTSPOT-036 stale editor-feedback closure — 2026-09-02

The follow-up Main-thread audit independently reproduced `F-14` after the `RIGHTSPOT-035` control
naming repair. A reverse-ordered two-option editor correctly showed the ordering validation alert;
removing Option 2 left one valid Option 1 value but retained the old alert. This was a P2 local
feedback defect because the visible error no longer described the current editor state. No validation,
request mutation, API, persistence, or workflow failure was reproduced.

`RIGHTSPOT-036` / `RS-WO-036-01` accepted one serial local-editor Work Order. The removal callback now
clears the existing error and status feedback after filtering the selected row. The repair preserves
the `RIGHTSPOT-035` option-numbered accessible names, visible copy, one-to-three boundary, validation
rules, dirty tracking, and server payload boundary; it adds no generic fallback or asynchronous behavior.

Closure evidence passed with pinned Node.js `v24.20.0` / npm `11.19.0`:

- full `npm test` `149/149` across `35` authored test files;
- `npm run test:foundation` `6/6`, typecheck, production build, and tracked-scope diff checks;
- fresh isolated browser generation `37` showed the reverse-order alert and `No requests captured`
  after the blocked Save draft;
- removing Option 2 left only the original Option 1 value, no `role="alert"`, no stale editor status,
  and no removal control;
- re-adding a valid second option preserved distinct `RIGHTSPOT-035` names, enabled native controls
  with `tabIndex=0`, no `320px` overflow, and empty browser errors.

Evidence is retained at `var/test/audit-036-feedback-cleared-after-remove.png`. `F-14`,
`RIGHTSPOT-036`, and `RS-WO-036-01` are `CLOSED_VERIFIED` within the tenant editor-feedback claim.
No server/API/domain/persistence/shared-contract, dependency, auth, CSS, route, workflow, Git, or
Worktree behavior changed. The current Main Worktree remains mixed and uncommitted; no implementation
Worktree was opened. This does not claim external authentication, deployment, notifications, WebMCP,
Cloud Receiver, WebRTC, Redis, or production readiness.

## 3.11 Post-036 fresh cross-layer audit — 2026-09-02

After closing `RIGHTSPOT-036`, Main ran a fresh local browser audit against reset generations `38` and
`39`. The canonical Main Worktree remained the only physical Worktree; the local health endpoint
returned `{"ok":true,"service":"rightspot"}`, and reset/check commands used pinned Node.js `v24.20.0`
and npm `11.19.0`.

The isolated browser evidence covered tenant listing discovery, Favourite save/remove/reload and empty
state, Viewing Request draft/save/submit, agent queue/detail/review/preparation/send, tenant proposal
projection and confirmation, agent active/history movement, wrong-role blocking, signed-out blocking,
and the `320px` responsive floor. The selected proposal time remained distinct from the tenant preferred
time, Favourite actions did not create a request, and no browser errors were recorded. No new workflow,
API, persistence, projection, privacy, navigation, responsive, or runtime defect was reproduced.

The separate listing-detail dynamic-route `F-08` concern remains an evidence gap rather than an
implementation finding because this run did not produce a valid delayed same-document reproduction.
No new Task was registered; the next audit must continue to reproduce before promoting any observation.

## 3.12 F-08 dynamic-route re-check — 2026-09-02

Main performed a focused isolated-browser re-check of the remaining `F-08` listing-detail concern.
From the signed-in tenant catalogue, the actual `View full listing` entry was followed to
`/tenant/listings/listing-primary`; the browser recorded the detail route's `GET /api/listings/listing-primary`
and `GET /api/tenant/request` reads, and the rendered listing/detail editor loaded without an application
error. A controlled fetch-delay harness was installed before navigating back to `/tenant`, but the
ordinary workspace link caused a full document navigation and the harness was discarded. Returning to
the detail route likewise created a fresh document rather than changing `listingId` in the existing
`TenantListingPage` instance.

This confirms the current ordinary route path does not provide a valid same-document delayed-read
reproduction for the static `load()` concern. The concern remains `EVIDENCE_GAP`, not `VERIFIED_DEFECT`;
no product code, route contract, retry behavior, or Task was changed. Do not register a speculative
repair unless a supported user-equivalent same-document transition is introduced or independently
reproduced.

After this probe, the pinned executable checks also remained green: full `npm test` `149/149`,
`npm run test:foundation` `6/6`, typecheck, production build, and `git diff --check`. These checks
confirm current Main consistency but do not convert the unproven same-document scenario into a
verified product guarantee.

## 3.13 Agent surface UX and accessibility re-check — 2026-09-02

Main performed a read-only isolated-browser re-check of the Agent surface at reset generation `39`
using session `rightspot-audit-20260902-agent-ux`. The signed-in Property agent workspace rendered
the role navigation, active request queue, terminal history, and read-only listing-interest sections.
With the current empty queue, both active and terminal empty states were explicit and truthful; the
three seeded portfolio listings, their Published state, and the refresh control were visible without
inventing request counts or queue records.

The same surface was checked at the `320px` viewport. `document.scrollWidth` and `document.body.scrollWidth`
both equalled the `320px` viewport, and the isolated browser error log contained no application errors.
Keyboard traversal reached the skip link, primary navigation links, sign-out button, refresh button, and
the native `Queue details` disclosure with a visible solid focus outline. The console contained only
React DevTools/HMR informational messages; no application warning or exception was reproduced.

This re-check found no new workflow, role-boundary, empty-state, responsive, keyboard, focus, or
browser-runtime defect. No Task was registered. It does not claim a populated Agent queue, external
authentication, deployment, WebMCP, Cloud Receiver, WebRTC, or production readiness.

## 3.14 Tenant surface route and recovery re-check — 2026-09-02

Main performed a read-only isolated-browser walkthrough of the signed-in Tenant surfaces with session
`rightspot-audit-20260902-tenant-ux`. The catalogue exposed its Browse rentals, Favourites, and My
request entries, three seeded published homes, labelled search controls, and a distinct View full
listing entry for each home. Applying an unmatched area produced the explicit `No listings match those
filters` state with a clear recovery action; clearing it restored all three homes without changing
session or request state.

The direct Favourite route showed the authoritative empty state and returned the tenant to Browse
rentals. The direct Viewing Request route showed the authoritative no-active-request state, its
Refresh control, and its Browse rentals recovery entry. The primary listing-detail route rendered the
listing facts and request editor; with no draft, the submit action was disabled and the editor remained
available for a deliberate first preference. At `320px`, the listing-detail and request-dashboard
surfaces reported equal body/document scroll widths to the viewport. A missing listing rendered an
explicit unavailable alert with Retry listing rather than fabricated listing facts. The isolated
browser error log remained empty and console output contained only React DevTools/HMR information.

This walkthrough found no new route-entry, empty-state, recovery, responsive, accessibility, or
browser-runtime defect. No Task was registered. It does not claim external authentication, deployment,
WebMCP, Cloud Receiver, WebRTC, or production readiness.

## 3.15 Agent unavailable-request recovery re-check — 2026-09-02

Main used isolated session `rightspot-audit-20260902-agent-unavailable` to open the signed-in Agent
request route with a non-existent request identifier. The server-derived 404 was rendered as a clear
`This viewing request was not found` alert, followed by `Request workspace unavailable`, a truthful
retry control, and a `Back to queue` entry. Retrying preserved the unavailable state rather than
showing a false success; following Back to queue returned to `/agent`.

The browser error log remained empty. No new route, role-boundary, recovery, or runtime defect was
reproduced, and no Task was registered. This check does not claim populated request-detail behavior,
external authentication, deployment, WebMCP, Cloud Receiver, WebRTC, or production readiness.

## 3.16 Populated Agent request-detail and cross-role re-check — 2026-09-02

Main used isolated session `rightspot-agent-populated` against reset generation `40` to exercise the
populated request-detail path, then reset the shared fixture to generation `41`. The tenant opened the
primary listing, saved and explicitly submitted one Viewing Request, and the Agent queue showed one
`Needs review` item. The Agent request workspace rendered the submitted tenant-safe facts, assigned
listing, available slots, and explicit `Start review` control. Starting review changed the state to
`In review` without sending anything.

The Agent then prepared a slot proposal with separate tenant-facing and agent-only notes. The page
reported `Response prepared. Nothing has been sent to the tenant yet` and exposed a separate
`Send response to tenant` control. After the explicit send, the request became `SLOT_PROPOSED`, the
selected slot was shown as held, and the tenant request dashboard displayed the exact proposed
`4 Sept 2026, 15:00–15:30` time separately from the tenant's preferred `10:00` time. Explicit tenant
confirmation produced `VIEWING_CONFIRMED` with the selected time retained in the terminal response;
the Agent queue then showed active work `0` and one `Confirmed` history item at request version `7`.

The populated Agent detail route reported no horizontal overflow at `320px`, and the isolated browser
error log was empty; console output contained only React DevTools/HMR informational messages. The
date/time value was supplied through the existing rendered input in the isolated harness because the
generic CLI fill did not populate Chromium's segmented control; this run extends populated downstream
state and action evidence, but does not replace the existing keyboard-entry evidence boundary.

No workflow, role/privacy, projection, state-transition, terminal, navigation, responsive, or runtime
defect was reproduced. No Task was registered. The disposable workflow was reset after the walkthrough;
this evidence does not claim external authentication, deployment, WebMCP, Cloud Receiver, WebRTC,
Redis, or production readiness.

## 3.17 Agent latest-read failure truthfulness — `RIGHTSPOT-037` — 2026-09-02

Main registered `RIGHTSPOT-037` after a populated Agent queue and request-detail refresh failure
reproduction. The isolated browser started from a submitted `request-1` at fixture generation `41`;
the queue retained `Needs review 1` and its `Review request` card beside the queue error, while the
detail retained request facts, availability, and the enabled `Start review` action beside the detail
error. A page-local fetch rejection was used to isolate the consumer state boundary; it did not alter
the server, database, request state, or API contract. Evidence screenshots are retained at
`var/test/audit-037-agent-queue-refresh-failure-full.png` and
`var/test/audit-037-agent-detail-refresh-failure-full.png`.

The bounded serial Work Order `RS-WO-037-01` changed only the queue and request-detail render
conditions. During a refresh, the existing loading surface takes precedence; after a failed latest
read, the retained projection and any retained detail action are withheld. The existing error,
unavailable, retry, successful content, role/privacy, optimistic-version, and server-authority
boundaries remain intact. The already-correct Agent listing-interest error branch was not changed.

TDD and closure evidence:

- focused contract Red failed `2/2` against the registered source and Green passed `2/2` after the
  two consumer-only guards;
- pinned complete `npm test` passed `151/151` across `36` authored test files;
- pinned `npm run test:foundation` passed `6/6`; typecheck; production build; and `git diff --check`
  passed;
- fresh reset generation `43` browser evidence showed queue failure with no counts/request card,
  queue retry recovery with `Needs review 1`, detail failure with no facts/availability/`Start review`,
  and detail retry recovery with the submitted request restored;
- at `320px`, body/document widths were both `320`; Tab traversal reached the enabled `Retry request
  read` control; the browser page-error log was empty during the detail failure/recovery check; and
- the fixture was reset to generation `44`, local health returned `{"ok":true,"service":"rightspot"}`,
  and no server/API/domain/persistence/shared-contract/CSS/dependency or Worktree behavior changed.

`F-15`, `RIGHTSPOT-037`, and `RS-WO-037-01` are `CLOSED_VERIFIED` within this Agent latest-read
failure presentation claim. The synthetic harness proves the UI boundary and is not a claim that an
ordinary server outage, external authentication, deployment, WebMCP, Cloud Receiver, WebRTC, Redis,
or production readiness has been validated.

## 3.18 Clean route, role, and responsive audit — 2026-09-02

After the `RIGHTSPOT-037` closure, Main reset the disposable workflow to generation `46` and ran a
clean isolated browser smoke. The signed-out root exposed both bounded role-entry controls; the tenant
session reached Browse rentals, Favourites, My request, the listing detail/editor, and their truthful
empty or populated entry states; and the agent session reached Request queue with its Listing interest
surface. The inspected pages remained usable at `320px`: body and document widths were both `320`,
the primary keyboard entry was reachable, and the browser page-error log was empty.

This checkpoint re-confirmed navigation and surface availability after the latest repair. It did not
claim a new populated cross-role workflow run, external authentication, deployment, WebMCP, Cloud
Receiver, WebRTC, Redis, or production readiness. No new business-flow, UI/UX, responsive, role/privacy,
API, persistence, or runtime defect was reproduced; no Task or Work Order was registered. The separate
listing-detail dynamic-route `F-08` concern remains an evidence gap. The isolated browser session was
closed and `/api/health` remained `{"ok":true,"service":"rightspot"}` after the checkpoint.

## 3.19 Controlled dynamic-route read-order probe — 2026-09-02

Main challenged the remaining `F-08` listing-detail same-document race with a controlled isolated
browser probe. After the tenant session entered `/tenant`, the harness delayed the
`listing-primary` API read by `450ms`, requested `/tenant/listings/listing-primary`, and immediately
requested `/tenant/listings/listing-north` through the client router. The final URL was
`/tenant/listings/listing-north`, and the rendered title, address, rent, and description were all for
`Northfield Garden Flat`; the browser page-error log was empty.

This probe did not reproduce stale primary-listing content, but it is synthetic client-navigation
evidence rather than proof of every possible route timing or a production transport. `F-08` therefore
remains an `EVIDENCE_GAP`; no speculative repair Task was registered. The isolated session was closed
and the fixture was reset to generation `47` with healthy `/api/health` afterward.

## 3.20 Favourite persistence and aggregate-boundary re-check — 2026-09-02

Main ran a fresh isolated browser walkthrough at fixture generation `48` for the full supported
Favourite path. The synthetic tenant saved `Canal Wharf Apartment` from `/tenant`, opened
`/tenant/favourites`, confirmed the available saved-home card, reloaded the route and saw the saved
card again, removed it, reloaded to the truthful empty state, and saved it again from Browse rentals.
The visible success, removal, empty, and re-save states all matched the authoritative projection.

After signing out and entering the Property agent workspace, the Listing interest projection showed
`Current saves: 1` and `Available interest: 1` for `Canal Wharf Apartment`. The rendered aggregate did
not expose tenant identity, contact-like values, private notes, or request data. At `320px`, the
agent surface reported equal body and document widths of `320px`; the first Tab reached the skip link;
and the browser page-error log was empty. The isolated session was closed and the fixture was reset to
generation `49`; `/api/health` returned `{"ok":true,"service":"rightspot"}` afterward.

This re-check adds fresh supported-path and cross-role evidence for `RS-FLOW-04` but does not close its
documented unpublished branch: the current bounded MVP has no user-facing admin action that produces
an unpublished listing. That branch remains covered by direct/static domain and projection evidence;
no hidden endpoint or fixture mutation was used. No new product defect, Task, or Work Order was
registered.

## 3.21 Agent stale-action conflict recovery — 2026-09-02

The Main thread reproduced `F-16` at reset generation `50`: a competing Agent review command returned
`200` and advanced the authoritative request to `AGENT_REVIEWING` version `3`, while the original UI
action correctly returned `409`. The existing recovery read also succeeded, but the Agent request-detail
consumer left its old error set and hid the recovered detail behind `Request workspace unavailable` and
`Retry request read`.

`RIGHTSPOT-038` / `RS-WO-038-01` repaired only that local feedback/read lifecycle. The focused TDD
contract was Red with `2` failing assertions against the registered source and Green at `2/2`; a
successful recovery now clears only the blocking error, renders the authoritative detail and current
actions, and retains a neutral conflict notice. The stale attempted action is not presented as success.
If the recovery read fails, the bounded unavailable/retry surface remains and detail/actions stay
withheld. No API, DTO, domain, persistence, workflow, role/privacy, or shared navigation behavior
changed.

Fresh isolated browser evidence covered both branches: generation `51` showed the conflict notice and
current `In review`/preparation surface after the `409`; generation `52` forced the recovery read to
fail with `503` and showed only the bounded unavailable/retry surface. Supplemental generation `53`
confirmed the accepted `320px` floor (body/document widths both `320px`), keyboard traversal to
`Save prepared response` on the recovered surface and first-Tab reachability of `Retry request read`
on the failed surface. Page errors were empty and console output contained only normal React DevTools/
HMR development messages. The final fixture reset to generation `54` and `/api/health` remained healthy.

The pinned complete suite passes `153/153` across `37` authored test files, foundation `6/6`,
typecheck, production build, repository validators `6/6`, sensitive scan `3/3`, documentation
validation, and `git diff --check`. This closes `F-16` only within the Agent request-detail
stale-action recovery presentation boundary; external authentication, deployment, WebMCP, Cloud
Receiver, WebRTC, Redis, and production readiness remain non-claims.

## 3.22 Post-F16 route, role, and fallback re-check — 2026-09-02

At reset generation `55`, a fresh isolated browser audit rechecked the signed-out role entry, tenant
catalogue/filter/detail, tenant empty request and Favourite states, wrong-role access, missing listing
and missing Agent request failures, Agent queue/listing-interest entry, exact-listing media readiness,
and the bounded retry surfaces. The catalogue showed three seeded cards; the no-result filter and Clear
path recovered correctly; and no fake listing/request data appeared on missing-resource or wrong-role
paths. At `320px`, body/document widths were both `320px`, the first Tab reached the skip link, and the
browser page-error log was empty.

This was a route/role/fallback recheck rather than a new populated workflow claim. No new defect or
Task was registered. The existing listing-detail dynamic-route `F-08` concern remains an evidence gap
because the ordinary catalogue links use full document navigation and no valid same-document delayed-read
reproduction was available. The isolated session was closed, the fixture reset to generation `56`, and
`/api/health` remained `{"ok":true,"service":"rightspot"}`.

## 3.23 Fresh primary-chain replay — 2026-09-02

Reset generation `57` provided a fresh end-to-end browser checkpoint for the current ordinary local
MVP. The isolated session entered as the tenant, opened the primary listing, saved a preferred
`15 Sept 2026, 10:00` viewing time with a note, and explicitly submitted the Viewing Request. The
tenant dashboard showed `Request Submitted`; the Agent queue then showed one `Needs review` item.

The Agent opened the assigned request, started review, prepared the second synthetic available slot
(`4 Sept 2026, 15:00–15:30`), entered a tenant-facing note and a separate Agent-only internal note,
saved preparation, and explicitly sent the response. The response remained preparation-only until the
send action; the server returned `200` for the draft, submit, review, preparation, and send operations.
The tenant projection then showed `Slot Proposed`, rendered the selected time separately from the
tenant's preferred time, and exposed explicit Confirm and Decline controls. Confirm returned `200` and
the tenant terminal surface showed `Viewing Confirmed`, the recorded selected time, no further action,
and six timeline entries through version `6`. The Agent queue subsequently showed no active request and
one `Confirmed` history item.

At `320px`, both terminal role surfaces had body/document widths of `320px`; the first Tab reached the
skip link; the tenant projection did not contain the Agent-only note; and the browser page-error log was
empty. No new defect or Task was registered. The isolated session was closed, the fixture reset to
generation `58`, and `/api/health` remained healthy. This evidence closes only the replayed ordinary
local chain and does not claim external authentication, deployment, WebMCP, Cloud Receiver, WebRTC,
Redis, or production readiness.

## 3.24 Fresh tenant-decline terminal replay — 2026-09-02

Reset generation `59` provided a fresh browser checkpoint for the alternate Agent-decline outcome. The
tenant saved a preferred `18 Sept 2026, 10:00` time with a note and explicitly submitted the request.
The Agent opened the assigned request, started review, prepared `AGENT_DECLINE` with separate
tenant-facing and Agent-only notes, saved preparation, and explicitly sent the response. The command
steps all returned `200`; the request ended at `AGENT_DECLINED`/`v5`.

The Agent terminal detail was read-only, exposed no review/preparation/send controls, and showed every
synthetic availability slot as `Available`. The tenant dashboard showed `Agent Declined`, the
tenant-facing note, five truthful timeline entries, and no further action; the Agent queue showed no
active request and one `Declined` history item at `v5`. The Agent-only note did not appear in the tenant
projection.

Both terminal surfaces passed the accepted `320px` body/document width check and first-Tab skip-link
focus check; the browser page-error log was empty. No new defect or Task was registered. The isolated
session was closed, the fixture reset to generation `60`, and `/api/health` remained healthy. This is
local terminal-branch evidence only and does not claim external integrations or production readiness.

## 3.25 Direct route-entry and role-surface re-check — 2026-09-02

At fixture generation `60`, an isolated browser session rechecked the signed-out root, tenant
catalogue, listing detail, Favourites, Viewing Requests, tenant-to-Agent wrong-role boundary, Agent
queue, and embedded Listing interest surface. Direct URL navigation rendered the expected route content;
empty states remained explicit; `320px` body/document widths stayed equal; first-Tab focus reached the
skip link; and the browser page-error log was empty.

An accessibility-tree reference used across full document navigation produced a CLI `Done` acknowledgement
without the expected URL transition. This was a browser-tool operation false success and was excluded
from product evidence. The route checks were re-run by direct URL navigation after reacquiring the page,
and the expected surfaces were observed. This operational result is now a Runbook caution: command
acknowledgement is not a browser postcondition; URL, rendered identity, and relevant controls must be
verified after navigation.

No new scenario defect or Task was registered. The listing-detail dynamic-route `F-08` concern remains
an evidence gap because ordinary catalogue links are full document navigations and no valid same-document
delayed-read reproduction exists. A follow-up at generation `61` clicked the real DOM anchor and
observed navigation type `navigate`, referrer `/tenant`, final path
`/tenant/listings/listing-primary`, and rendered heading `Canal Wharf Apartment`; the earlier CLI
selector acknowledgement was therefore treated as tooling false success. The session was closed, the
fixture reset to generation `62`, and `/api/health` remained healthy. This evidence does not claim
external authentication, deployment, or deferred integrations.

## 4.1 Post-MVP shared CSS evidence

`RS-WO-007-02` is independently `VERIFIED` and integrated at product commit `89a50c7`. The
same-identity verifier observed the committed CSS candidate and unchanged source boundary before and
after the run. Typecheck, foundation tests `6/6`, build, and `git diff --check` passed; the fresh
served bundle exposed the candidate Field Desk tokens. Signed-out and role redirects, seeded tenant
listing discovery, mobile listing detail, `390x844`/`768x1024`/`1440x900` layout checks, no horizontal
overflow, keyboard focus, control sizing, reduced-motion rule presence, and rendered contrast
samples passed. Browser execution used an isolated non-repository directory and produced no source,
documentation, test, database, or Git metadata mutation.

The agent request-detail consequence path was not exercised because the current fixture queue has no
assigned request. This is a residual evidence boundary, not a CSS defect; deployment, WebMCP, and
external authentication remain non-claims.

## 4. Candidate kill tests

RightSpot should be reconsidered if any of these remain true after a focused prototype:

1. A fresh evaluator cannot understand the tenant-to-agent relay quickly.
2. The flow requires a full marketplace, calendar, payment, or CRM to feel meaningful.
3. Agent preparation is no better than a deterministic queue plus a human notification.
4. Role isolation cannot be demonstrated with negative tests.
5. The shared Viewing Request becomes a copied message rather than a durable artifact.
6. Human decisions are hidden behind preparation or automation.
7. The future Hackathon integration would dominate the product architecture.

## 5. Privacy and safety checks

- synthetic listings, identities, and availability only;
- no payment, deposit, lease, or legal action;
- no sensitive tenant ranking or eligibility inference;
- no credentials or private Agent context in domain records;
- no unrestricted chat or arbitrary instruction transport; and
- all development traces redacted before any public evidence is created.

## 6. Current non-claims

RightSpot currently has no validated product-market fit, production security, deployment result,
WebMCP result, Agent continuation result, Cloud Receiver result, or Hackathon judge result.

## 7. Pre-dispatch runtime evidence

The main thread prepared the exact repository target from the repository-root `.node-version`
(`24.20.0`) in a machine-local directory outside the repository. The official arm64 archive passed
its SHA-256 check. The installed runtime reported Node `v24.20.0`, npm `11.19.0`, and successfully
opened and queried a disposable `node:sqlite` smoke database. The existing default shell remains
Node `v26.5.0`; it was not replaced or relinked.

This proves local runtime readiness and foundation contract behavior only. The foundation Builder
returned `READY_FOR_VERIFICATION`; the first independent Verifier attempt was procedurally `BLOCKED`,
and the corrected `RS-WO-002-02` rerun returned `VERIFIED` against the unchanged source/runtime
identity with all assertion output kept inside the permitted boundary. This does not prove the
tenant/agent product flow, browser usability, deployment, WebMCP, or Cloud Receiver integration.

## 7.1 Same-document listing read-order evidence — 2026-09-02

The reverse controlled probe in isolated `rightspot-audit-063` held both old
`GET /api/listings/listing-primary` reads while the Next App Router moved from the Northfield listing
to the primary listing and back to Northfield. Releasing the old responses left the final
`/tenant/listings/listing-north` route rendered as `Northfield Garden Flat` with its matching image
identity. This is synthetic page-local timing evidence only; because the ordinary catalogue links
are full document navigations, the separate `F-08` dynamic-route concern remains an `EVIDENCE_GAP`
and no speculative repair Task is authorized. The fixture remained at generation `62`, with no
server or source mutation.

## 7.2 RIGHTSPOT-039 registration evidence — 2026-09-02

In isolated `agent-browser` session `rightspot-audit-065`, Main rejected only the tenant
Viewing Request context read while the listing read remained successful. The listing-detail consumer
rendered `Listing details are unavailable` and `Retry listing` instead of preserving the successful
listing identity. The request-context failure was recorded twice by the page-local harness; a direct
read of `/api/listings/listing-north` returned `200` and `Northfield Garden Flat`. No server fixture
mutation occurred. This evidence registers `F-17` through `RIGHTSPOT-039`; verification evidence is
recorded in `RIGHTSPOT-039`: its TDD focused contract passed `3/3` after Red, the complete suite
passed `156/156`, and the fresh browser failure/recovery gate passed with no page errors. The
listing-only complementary branch also remained listing-specific. No API, workflow, persistence,
or fixture behavior changed.

## 7.3 RIGHTSPOT-040 registration evidence (pre-repair checkpoint) — 2026-09-02

In isolated `agent-browser` session `rightspot-audit-070`, Main installed a page-local fetch harness
that forced only the tenant collection read to return `503` with the harmless controlled marker
`CONTROLLED_PRIVATE_SERVER_TEXT`. Applying an area filter produced both that raw marker and the
bounded `tenantApiErrorMessage` copy, proving that the Discovery consumer's shared error branch can
disclose server-controlled text and duplicate a read-failure message. The browser page-error log was
empty and no request, Favourite, session, or fixture mutation occurred. This evidence registers
`F-18` through `RIGHTSPOT-040`; at this registration checkpoint the repair was limited to the
Discovery consumer and had not been dispatched or implemented. The adapter, server, API, domain,
persistence, filter, and error status contracts remained unchanged.

## 7.4 RIGHTSPOT-040 closure evidence — 2026-09-02

The Main thread completed `RS-WO-040-01` as a Main-owned serial TDD repair. The focused source/UI
contract first failed against the registered source with `1` failed and `1` passed test, then passed
`2/2` after the Discovery consumer received explicit `filterError` ownership. The component no longer
renders the shared `error.message` branch; catalogue failures remain in `ListingResults` and use the
existing bounded `tenantApiErrorMessage` mapping once. No adapter, server, API, DTO, domain,
persistence, or shared-component contract changed.

The pinned complete suite passed `158/158` across `39` authored test files; `npm run test:foundation`
passed `6/6`; `npm run typecheck` and `npm run build` passed; repository validators, sensitive scans,
documentation validation, and `git diff --check` passed.

In fresh isolated `agent-browser` session `rightspot-audit-071`, a page-local harness forced only the
tenant collection read to return `503` with `CONTROLLED_PRIVATE_SERVER_TEXT`. The page rendered no
controlled marker, exactly one `Listings could not be loaded` heading, one bounded local-service copy,
one retry control, and one alert. After removing the harness, keyboard `Enter` on `Retry catalogue`
restored the two results matching the retained rent filter; keyboard `Enter` on `Clear` restored all
three seeded listings. Invalid local filter feedback was visible without a catalogue request, while a
valid filter recovery issued the expected read. At `320px`, body and document widths were both `320px`
with no horizontal overflow; the browser error log was empty. The session was closed and the fixture
remained unchanged with healthy `/api/health`.

`F-18`, `RIGHTSPOT-040`, and `RS-WO-040-01` are therefore `CLOSED_VERIFIED` within the tenant
Discovery consumer boundary. `F-08` remains a separate dynamic-route evidence gap; this closure does
not claim external authentication, deployment, WebMCP, Cloud Receiver, WebRTC, Redis, or production
readiness.

## 7.5 RIGHTSPOT-041 registration evidence (pre-repair checkpoint) — 2026-09-02

At registration, the Main-thread continuous audit inspected the tenant request editor after the
`RIGHTSPOT-040` closure. In isolated `agent-browser` session `rightspot-audit-073`, a disposable tenant draft was
updated from `/tenant/requests`. The browser captured `PATCH /api/tenant/request` with status `200` and
the authoritative updated draft rendered, but the expected bounded success confirmation did not remain
visible. Source inspection confirmed that both draft save and explicit submit call the parent `onSaved`
callback before setting the child success state; the version-keyed parent rehydrates and unmounts that
editor. This registers `F-19` / `RIGHTSPOT-041` as a P2 UI-lifecycle defect covering both tenant
request-editor consumers, without changing or questioning the server mutation result.

`RS-WO-041-01` is one Main-owned serial Work Order at `PENDING_DESIGN_REVIEW`; no Green implementation,
supporting Worktree, API/server/domain/persistence change, or external integration is authorized by
this registration. The fixture is disposable and must be reset before any closure evidence.

## 7.6 RIGHTSPOT-041 closure evidence — 2026-09-02

The accepted parent-owned feedback design was implemented in the canonical Main Worktree. The shared
tenant editor preserves the existing version-keyed authoritative rehydration, but transports bounded
draft-save and explicit-submit completion copy through `onSaved(response, message)` to a parent-level
status surface. The editor no longer relies on local success state that can be lost during remount, and
scoped editor interaction clears stale completion copy. No API, domain, persistence, workflow, auth,
Agent, Favourite, or shared notification behavior changed.

The focused TDD contract recorded Red against the pre-repair source and Green at `7/7`. The pinned
complete suite passed `159/159` across `39` authored test files; `npm run typecheck` and
`git diff --check` passed. In isolated `agent-browser` session `rightspot-verify-041` at generation
`68`, listing-detail draft save returned `POST /api/tenant/request` `200` and retained the bounded
save confirmation after rehydration; `/tenant/requests` submit returned
`POST /api/tenant/request/submit` `200` and retained its bounded submit confirmation after entering
`REQUEST_SUBMITTED`. At generation `69`, a controlled external update advanced the draft to version
`3`; the stale UI save returned `409`, the recovery read returned `200`, the old success copy was absent,
and only the neutral conflict notice remained. The browser reported no page errors. The fixture reset
to generation `70`, `/api/health` returned `{"ok":true,"service":"rightspot"}`, and the isolated
session was closed.

`F-19`, `RIGHTSPOT-041`, and `RS-WO-041-01` are `CLOSED_VERIFIED` within the tenant request
mutation-completion-feedback consumer boundary. This is not evidence for external authentication,
deployment, WebMCP, Cloud Receiver, WebRTC, Redis, or production readiness.

## 7.7 Favourite persistence and role-boundary evidence — 2026-09-02

In isolated `agent-browser` session `rightspot-audit-077`, Main used disposable fixture generation
`73` to save `Canal Wharf Apartment` from the tenant catalogue, reload the Favourite surface, remove
the Favourite, observe the authoritative empty state, and save it again. The Favourite projection
persisted across reload and exposed only the public listing fields; the tenant request projection
remained `listing: null`, `request: null`, and `timeline: []` for the unrelated listing. The relation
version advanced through the expected save/remove/save sequence, and the Agent aggregate later
reported `Current saves: 1` and `Available interest: 1` for the primary listing.

The fixture was reset to generation `74`. At `320px`, the Favourite surface had equal body/document
widths with no horizontal overflow and a keyboard-reachable skip link. This evidence confirms the
supported persistence and cross-role aggregate boundary for the exercised path; it does not claim a
user-facing unpublished-listing reactivation flow or external integration.

## 7.8 Populated Agent listing-interest presentation evidence — 2026-09-02

In isolated `agent-browser` session `rightspot-audit-078`, Main submitted the tenant Favourite state
from a fresh fixture generation `74` and opened the Agent dashboard. All three seeded listing-interest
cards rendered; the primary card showed `Current saves: 1` and `Available interest: 1`, while the other
cards showed `0/0`. The metric definitions and the separate empty viewing-request queue remained
visible, so an interest aggregate was not presented as a viewing-request item. At `320px`, body and
document widths were both `320px` with no horizontal overflow, the skip link was first in tab order,
and the browser error check was empty. The fixture was then reset to generation `75`.

This closes no new defect; it is evidence for the existing `RS-FLOW-16` presentation boundary only.

## 7.9 Tenant route-entry and visual surface evidence — 2026-09-02

In isolated `agent-browser` session `rightspot-audit-079`, Main reviewed the Tenant catalogue,
listing-detail, and request-dashboard routes at desktop dimensions from fixture generation `75`.
The catalogue exposed its discovery/filter surface, the detail route exposed listing facts/media and
the Viewing Request entry, and the request dashboard exposed its empty state with the Browse rentals
handoff. The rendered surfaces were coherent within the accepted Field Desk visual system, and the
browser error check was empty. The session was closed and the fixture reset to generation `76`.

This is a visual and route-entry checkpoint, not a claim of complete responsive or commercial product
coverage; the separate dynamic-route `F-08` read-order concern remains an `EVIDENCE_GAP`.

## 7.10 Agent listing-interest failure and retry evidence — 2026-09-02

In isolated `agent-browser` session `rightspot-audit-080`, Main used fixture generation `76` and a
page-local harness that forced only `GET /api/agent/listing-interest` to return `503` with the harmless
marker `CONTROLLED_PRIVATE_SERVER_TEXT`. The Agent surface rendered bounded unavailable copy and one
`Retry interest` control, withheld listing-interest counts, did not expose the controlled server text,
and kept the separate viewing-request queue visible. After the harness was removed, the retry control
restored the zero-count listing-interest projection for the fresh fixture; the failure surface cleared.
At `320px`, body and document widths were both `320px` with no horizontal overflow, and the browser
error check was empty. The fixture was reset to generation `77`, and `/api/health` returned
`{"ok":true,"service":"rightspot"}`.

No new Task was registered. This verifies the exercised Agent read-failure/retry boundary only; it
does not claim external authentication, deployment, WebMCP, Cloud Receiver, WebRTC, Redis, or
production readiness.

## 7.11 Supported listing navigation and F-08 boundary evidence — 2026-09-02

In isolated `agent-browser` session `rightspot-audit-081`, Main followed the real rendered catalogue
anchor from `/tenant` to `listing-primary`, returned to the catalogue, and then followed the anchor to
`listing-north` using the local fixture at generation `77`. Each transition reported navigation type
`navigate` and the preceding route as referrer; the final route rendered the authoritative
`Northfield Garden Flat` identity and its detail surface. No fixture or source state was mutated, and
the browser error check was empty.

The supported catalogue-to-detail path is therefore directly evidenced as full-document navigation;
the suspected same-document read-order race was not reproduced in the ordinary user path. A future
router-reuse implementation would require a new route contract and separate evidence, so `F-08`
remains an `EVIDENCE_GAP` rather than an authorized speculative repair. The session was closed and
`/api/health` returned `{"ok":true,"service":"rightspot"}`.

## 7.18 Agent preparation validation and code-quality evidence — 2026-09-02

Main reviewed the current Agent preparation path across authoritative state, HTTP parsing, role-safe
projection, and the rendered request workspace. Preparation remains distinct from send; slot ownership,
availability, bounded notes, and server error mapping remain explicit, with no client-side business-state
fallback or raw server error disclosure found in the audited scope.

In isolated session `rightspot-audit-087` at disposable generation `83`, the Tenant submitted one
request and the Agent started review. With no slot selected, the rendered required `Available slot`
control prevented the preparation form from reaching the application handler; no mutation, custom false
success, or misleading application error was observed. A stale custom validation branch would require
an external availability change after selection, which was not reproduced or accepted as a current
single-fixture flow. The session was closed, the fixture reset to generation `84`, browser errors were
empty, and health remained healthy.

The complete pinned suite passed `159/159`, typecheck and production build passed, and repository,
sensitive, documentation, and RightSpot diff checks passed. No new Task was registered. This evidence
does not claim multi-actor production concurrency or any deferred integration.

## 7.19 Responsive heading-wrap polish boundary — 2026-09-02

In isolated session `rightspot-audit-088`, the terminal Agent request detail was checked at `320x800`
and `375x812`. The `320px` render had no horizontal overflow and kept its controls within the viewport,
but the `Request workspace` heading split the last word as `workspac` and `e`; at `375px` the word
wrapped intact. Tenant catalogue and request-dashboard headings remained intact at `320px`.

This is recorded as low-severity `F-20 VERIFIED_POLISH`. It does not block the ordinary business flow,
keyboard reachability, role boundary, or runtime health, so no implementation Task was opened. A future
typography pass must remain bounded to the responsive heading treatment and must not widen the MVP scope.

## 7.20 Cross-layer error and fallback audit evidence — 2026-09-02

Main reviewed the current tenant and agent UI consumers, session frame, workflow HTTP boundary,
role-safe projections, persistence transaction handling, and bounded Operations projection helpers on
canonical `main` HEAD `4224f3ae53f6d4be87a7be17e74532f5785357b0`. The working tree was already dirty with
collaborator-owned changes; this was read-only and did not stage or modify source, tests, fixtures, or
Git state.

The inspected error branches reject malformed data, expose neutral user-facing failures, recover
optimistic conflicts by re-reading authoritative state, or roll back persistence transactions. Latest
read state takes precedence over retained content, and no inspected branch fabricated business state,
silently swallowed a mutation failure, or disclosed diagnostic server text. `return null` cases were
conditional absence/incompatible-presentation branches rather than business-state fallbacks.

Pinned `typecheck`, production `build`, complete tests (`159/159`), repository validation, documentation
validation, sensitive-pattern scan, RightSpot `git diff --check`, and `/api/health` all passed. No new
Task was registered. Lint/dead-code verification is unavailable because the package exposes no such
tool. This evidence is limited to the inspected error/fallback and authority boundaries; it does not
close `F-08`, promote `F-20`, or claim any deferred external integration or production readiness.

## 7.21 F-22 Operations latest-read race registration — 2026-09-03

The post-`RIGHTSPOT-044` read-only audit rechecked the Operations API, Agent-only role/privacy
boundary, projection, London date semantics, valid empty results, bounded error/retry states, route
entry, responsive layout, keyboard/skip-link path, and existing browser evidence. Those 044 boundaries
remain accepted and unchanged.

The audit identified `F-22`, a P2 `VERIFIED_DEFECT` in the Operations page consumer. The current
`operations-page.tsx` starts an asynchronous `readOperations` call but has no latest-read sequence,
query identity, or abort guard. A slower older success, error, or `finally` callback can therefore
overwrite or finish a newer logical read after report switching or overlapping requests. This is
high-confidence static control-flow evidence; the audit did not add a controlled browser race
reproduction, so no new runtime race claim is made.

`RIGHTSPOT-045` is registered as a bounded consumer-only repair. Its acceptance requires a latest-read
guard, focused Red → Green → Refactor coverage, preservation of the existing Operations API/domain/
projection/role/privacy/WebMCP boundaries, and independent integrated verification where response
ordering can be controlled. The finding is non-blocking to `RIGHTSPOT-012` and does not reopen or widen
`RIGHTSPOT-044`. Existing shell-level `favicon.ico` `404` and expected signed-out session `401`
network events remain documented residuals and are unrelated to `F-22`.

## 7.22 F-22 bounded repair handoff and frozen source — 2026-09-03

The Main thread reviewed the `RS-WO-045-01` Builder handoff and the exact two-path diff. The Red
phase added two focused latest-read contracts that failed against the baseline; the Green phase then
passed focused `8/8` and the complete RightSpot suite `186/186` under Node `24.20.0` / npm `11.19.0`.
Typecheck, production build, repository validators, sensitive scans, and RightSpot `git diff --check`
also passed. The existing Operations SQLite dynamic filesystem-tracing warning remains a deployment
residual.

Main confirmed that the consumer now advances a monotonic read identity and guards success, error,
`finally`, report switching, clear, and unmount cleanup. The exact changed paths are
`src/ui/agent/operations/operations-page.tsx` and `tests/ui/operations-page.test.ts`; no API, domain,
projection, persistence, fixture, role/privacy, navigation, or WebMCP path changed. The reviewed source
is frozen and integrated at product commit `3582ba4`, pushed to `origin/main`.

This is a Builder/Main static and source-integrity checkpoint only. No independent browser-controlled
race reproduction or final `RIGHTSPOT-045` closure claim exists until `RS-WO-045-02` reports back.

## 7.23 F-22 verifier re-gate after procedural source-ref drift — 2026-09-03

The first `RS-WO-045-02` verifier attempt returned procedural `BLOCKED` before running any check.
The dispatch named `adfa131` as the T3 frozen source, but Main subsequently committed the
docs-only `RIGHTSPOT-012` audit writeback as `8c700be` while verification was active. This moved
the Git ref under the checkpoint freeze. The verifier correctly stopped; it did not inspect the
Operations route, create browser evidence, mutate product source, or make a product-defect claim.

The product repair source remained unchanged at `3582ba4`. Main preserved the incident as a
process/ownership result, re-established `8c700be` as the exact reviewed checkpoint, and re-gated
the same verification Work Order. The retry must use `8c700be`, with `3582ba4` identified as the
product source, and no commit, ref movement, or semantic source change may occur until T3 ends.
No `RIGHTSPOT-045` closure or browser race claim is made by this procedural result.

## 7.24 F-22 bounded consumer verification and closure — 2026-09-03

The independent verifier retry did not return after repeated bounded waits because its browser helper
did not terminate. Main shutdown that execution without source mutation and records this as an
explicit independent-browser harness limitation; it is not an independent pass or a product failure.

Main then verified the frozen product source at `3582ba4` / checkpoint `8c700be` with a page-local
fetch harness. The harness held an initial `upcomingViewings` response, changed to a newer
`listingPipeline` read, resolved the newer valid empty result first, and resolved the older response
afterward. The rendered page remained `Listing pipeline` with `No matching records`. A second run
resolved a newer `Haringey` listing success and rejected an older `Islington` read; the page retained
`Northfield Garden Flat`, showed no stale error, and ended with loading false. This is direct rendered
evidence for late success, late error, and stale completion protection.

The ordinary browser pass loaded both real Operations query families, confirmed the authorized request
link, signed-out and wrong-role gating, meaningful content, no framework overlay, and no page errors.
At `320x800`, `768x800`, and `1280x800`, document width matched the viewport with no horizontal
overflow. The existing independent `RIGHTSPOT-044` evidence remains authoritative for the complete
request drill-down, exact API projection/count/privacy, bounded failure/retry, keyboard/skip-link, and
no-mutation matrix because this repair changed only the Operations consumer's async state lifecycle.

Under Node `v24.20.0` / npm `11.19.0`, complete tests `186/186`, typecheck, production build,
repository validators, sensitive scan, and RightSpot `git diff --check` passed. The known dynamic
SQLite filesystem-tracing warning remains a deployment residual. `RIGHTSPOT-045` is therefore
`CLOSED_VERIFIED` only for the bounded manual Operations latest-read consumer boundary. It does not
claim an independent browser-helper pass, Operations WebMCP capability, deployment readiness, or any
change to API, domain, projection, persistence, role/privacy, navigation, or other product scope.

## 7.25 Tenant-to-Agent chain read-only audit — 2026-09-03

Supporting Advisor Helmholtz audited the bounded human chain from `/` through Tenant catalogue, listing
detail, request dashboard, Agent queue/detail/review/prepare/send, and Tenant response against the
canonical Main source. Main advanced from the audit's starting `cf931d0` to `21bed15` during the run, but
that delta was documentation-only; the latest product source remained `3582ba4`, and the single physical
Main Worktree, unrelated collaborator changes, and pre-existing RightSpot untracked boundary artifacts
were preserved.

The read-only evidence found no P0/P1/P2 defect. Tenant and Agent navigation/CTA handoffs remained on
the accepted routes; save/submit, conflict reread, explicit confirm/decline, terminal action removal,
Agent preparation/send separation, role checks, and tenant-safe versus Agent-safe DTO projections matched
the accepted contracts. Focused UI/projection checks passed `36/36`; pure-domain workflow checks passed
`18/18`; all six page routes returned `200`; unauthenticated, wrong-role, and missing-resource probes
returned bounded `401`, `403`, and `404`; `/api/health` returned `200`; and the SQLite hash and mtime
were unchanged before and after the probes.

This run intentionally did not create a browser session, mutate a fixture, inject a failure, or issue
workflow POST actions. It therefore adds no fresh populated rendered happy-path evidence; existing
canonical browser evidence remains the authority. No new Task or Work Order was registered, and
`RIGHTSPOT-012` remains a pending continuous audit lane. A shell failure caused by zsh's reserved
`path` variable was corrected under Bash and was not a product request or mutation.

## 7.26 Operations WebMCP contract decision registration — 2026-09-03

Main reviewed the post-`RIGHTSPOT-045` Operations source and closure evidence against the canonical
Main checkpoint `c728547` (the product source remains the reviewed `3582ba4` checkpoint). The existing
Operations authority/projection, Agent-only HTTP/manual page, role/privacy boundary, bounded errors,
and latest-read consumer sequencing are complete through `RIGHTSPOT-013`, `RIGHTSPOT-015`,
`RIGHTSPOT-016`, `RIGHTSPOT-044`, and `RIGHTSPOT-045`. The current source contains no Operations
WebMCP registration; the existing WebMCP adapter is the separate Tenant `search_listings` slice.

This evidence makes a new admission review actionable but does not prove that a new tool should be
implemented. Main registered [`RIGHTSPOT-046`](Tasks/RIGHTSPOT-046-define-agent-operations-webmcp-listing-pipeline-contract.md)
as a pending decision Task for one possible Agent-only, page-bound, read-only
`read_listing_pipeline` capability. The proposal accepts only the existing `listingPipeline` query
fields (`area`, `publicationState`, `lifecycleState`, and `minPublishedAgeDays`) and requires the
existing Operations response, page parity, one latest-read identity, server role authority, bounded
errors, and route/session teardown. It explicitly excludes mutations, natural-language parsing,
direct SQL, a second projection, and `upcomingViewings` until its `asOf`/fixture-clock reproducibility
boundary is resolved.

No source, test, fixture, package, dependency, runtime, WebMCP registration, or Worktree changed in
this registration checkpoint. The next evidence gate is an accepted or rejected contract ADR; only
an accepted contract may route a separate implementation Task. `RIGHTSPOT-012` remains a non-blocking
read-only audit lane, and no universal browser, production, Cloud Receiver, external authentication,
WebRTC, Redis, or deployment claim is made.

## 7.27 Operations WebMCP contract review and acceptance — 2026-09-03

Independent static review of `RIGHTSPOT-046` returned `REVISE`, identifying five implementation-level
contract gaps: static tool metadata/schema was not frozen, runtime response keys were not explicitly
allowlisted for privacy, page parity and superseded-read outcomes were underspecified, the page could
not prove an unassigned Agent before registration, and the recorded source baseline was stale. The
review also confirmed that excluding `upcomingViewings` is justified by the current server-clock and
seeded-slot reproducibility boundary rather than by an undefined projection.

Main resolved the findings in the Task File and accepted [ADR-RS-0017](Decisions/ADR-RS-0017-agent-operations-webmcp-listing-pipeline-contract.md).
The accepted contract freezes one Agent-only, `/agent/operations`-bound, read-only
`read_listing_pipeline` capability; exact optional input fields and bounds; exact/case-sensitive
Operations Area semantics; safe age limits; the existing Operations authority and response variant;
exact runtime allowlists; one page-owned latest-read coordinator; bounded error codes including
`STALE_RESULT`; route/session teardown; unassigned-Agent server rejection; manual fallback; and the
TDD/browser/evaluation gates. It still excludes mutations, natural-language parsing, direct SQL,
second projections, `upcomingViewings`, Cloud Receiver, WebRTC, Redis, external authentication,
deployment, and production claims.

No product source, test, fixture, dependency, runtime, or WebMCP registration changed in this
decision checkpoint. The separate implementation Task [`RIGHTSPOT-047`](Tasks/RIGHTSPOT-047-implement-agent-operations-webmcp-listing-pipeline.md)
is now registered and must recapture the actual browser registration/cleanup behavior and current Main
source identity before dispatch.

## 7.28 Route and business-flow documentation reconciliation — 2026-09-03

Main rechecked the route files, Agent navigation, Operations manual consumer, and
`Docs/07-business-flows-and-scenarios.md` against Main documentation checkpoint `2f09d0a` and product
source `3582ba4`. Declared Tenant and Agent pages had ordinary shell entries and intended handoffs;
listing interest remained embedded in `/agent`; `/agent/requests` and `/agent/listing-interest` were
intentionally absent parameterized/embedded routes; and runtime spot checks returned `200` for declared
pages, `401` for unauthenticated Operations API access, and `200` for health. No fixture mutation or
SQLite change occurred.

The business-flow catalogue contained one documentation-only drift: it still described the verified
`/agent/operations` manual surface as a future or test-only seam. Main corrected the Operations actor,
flow entry, role matrix, and coverage rows to state the current Agent-only read-only manual route/API,
its two bounded report families, and the separate `RIGHTSPOT-046` WebMCP contract/implementation gate.
No product defect, route orphan, role/privacy gap, broken handoff, or new audit finding was found.
`RIGHTSPOT-012` remains pending and non-blocking; `RIGHTSPOT-047` owns the accepted Operations tool
implementation gate. The retained `F-08` evidence gap and existing browser claims are unchanged.

## 7.29 Operations WebMCP Builder implementation and Main candidate review — 2026-09-03

`RS-WO-047-01` was dispatched after T0 recapture at Main/origin `075a868086e962112b550583cb1705478bbdf16b`,
with one physical Main Worktree, Node `24.20.0`, localhost health `200`, `agent-browser 0.25.3`,
Chrome `152.0.7977.65`, and the `WebMCPTesting` flag available. The supporting Builder returned
`READY_FOR_INDEPENDENT_VERIFICATION` and changed exactly the declared five paths:
`operations-webmcp.ts`, `operations-api.ts`, `operations-page.tsx`, `operations-webmcp.test.ts`, and
`operations-page.test.ts`. No server, shared contract, fixture, package, Tenant adapter, generated,
Worktree, Git, or Web-Game path changed as part of the Builder handoff.

Main independently reviewed the candidate's exact metadata/schema, structured input validation,
case-sensitive Area boundary, safe age bound, result allowlisting/reconstruction, bounded error union,
page/tool coordinator, abort/stale settlement, registration teardown, unsupported-capability manual
fallback, and no second authority. Focused tests passed `23/23`; the complete deterministic RightSpot
suite passed `201/201`; non-incremental typecheck, production build, repository validators, sensitive
scan, and `git diff --check` passed. The existing SQLite dynamic filesystem-tracing build warning is
retained and is not a new deployment claim.

This is a frozen-candidate preparation checkpoint, not final WebMCP closure. The candidate has not yet
been independently tested in the supported browser for discovery, invocation, page parity, role/session
teardown, privacy, or no-mutation evidence. `RIGHTSPOT-047` therefore remains
`verification_pending`; Main must freeze this exact candidate and dispatch `RS-WO-047-02` before making
an implementation closure claim.

## 7.30 Operations WebMCP independent verifier attempts — 2026-09-03

The first `RS-WO-047-02` attempt stopped before page navigation because the supporting Verifier used
the unavailable shell command `timeout`. It matched the frozen candidate source identity and five
path hashes and observed no source, fixture, SQLite, Git, or Worktree mutation, but it produced no
browser evidence and is recorded as `BLOCKED_HARNESS`, not a product result.

A corrected retry used the installed `agent-browser` binary directly with `--enable-features=WebMCPTesting`.
It independently reached the local app, started the normal Property agent session, discovered exactly
`read_listing_pipeline`, confirmed the frozen metadata/schema, exercised a valid Southwark read with
page parity, a case-sensitive empty result, malformed-input preservation, GET-only invocation, and a
`320x720` labelled/no-overflow surface. It was then stopped at the bounded execution limit before
tenant/wrong-role lifecycle, sign-out/route teardown, final console/page-error collection, final mobile
non-empty capture, and final persistent-state readback. It is recorded as `INCOMPLETE_EVIDENCE` rather
than `VERIFIED`; no product failure was observed. A later narrower follow-up
(`01a065f6-f14c-7131-9c17-a472503bf5d8`) reached only source preflight and the Tenant/wrong-role
zero-tool check before the bounded stop; it added no complete independent closure evidence.

Main separately reproduced the missing local checks in isolated session `rs-goal-diag-20260903`:
Agent discovery/invocation and valid/invalid page parity, signed-out and Tenant zero-tool boundaries,
sign-out route recovery, GET-only network traffic, mobile accessibility snapshot, and no page errors
beyond normal React DevTools/HMR informational logs. This supplements but does not replace the
independent gate. `RIGHTSPOT-047` remains open at `INDEPENDENT_BROWSER_INCOMPLETE`; the candidate must
not be pushed or closed as verified until the same Work Order completes its bounded independent
evidence or Main records an explicit evidence decision.
