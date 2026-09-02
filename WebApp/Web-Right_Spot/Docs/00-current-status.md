# RightSpot — Current Status

**Role:** Canonical current status for the RightSpot child application  
**As of:** 2026-09-02, Europe/London  
**Physical workspace:** `git worktree list --porcelain` currently reports the canonical Main Worktree at
`/Users/alex/OpenAI-WebMCP/WebMCP_Challenge` on `main` plus two short-lived, stopped UI candidate
Worktrees for the active `RIGHTSPOT-020` T2 handoff:
`/Users/alex/Documents/Codex/2026-09-02/rightspot-rs-wo-020-02-tenant-ui` and
`/Users/alex/Documents/Codex/2026-09-02/rightspot-rs-wo-020-03-agent-ui`. Historical candidate snapshots
are retained only in their owning Task Files and, where applicable, the local-only archive refs
`refs/archive/rightspot/rs-wo-015-01-builder`, `refs/archive/rightspot/rs-wo-016-01-regate`, and
`refs/archive/rightspot/rs-wo-017-03-regate`; these refs are evidence/recovery records, not product
source or active execution surfaces. Worktree removal does not remove task records or branch refs.
**Stage:** Accepted ordinary local MVP implemented and closed; runnable foundation, workflow-core, the
`RS-WO-002-04` persistence/application boundary, the `RS-WO-002-05` tenant entry/listing discovery
API, and the `RS-WO-002-07` workflow HTTP/DTO boundary independently verified;
`RS-WO-002-06` Architecture Advisor reviewed and incorporated with revisions; ADR-RS-0008 accepted;
`RS-WO-002-08` shared shell is integrated at product commit `006d2fd` after process re-baseline commit
`8b77bdd`; `RS-WO-002-09` UI/UX review is integrated as bounded guidance; `RS-WO-002-10` Architecture
Advisor decomposition is accepted; `RS-WO-002-11` candidate `f1f83c7` passed independent verification
and is integrated at product commit `6a0b4b8`; `RS-WO-002-13` agent role-page candidate passed
independent verification and is integrated at product commit `3765747`; `RS-WO-002-12` tenant role-page
candidate `52cba87c` passed final independent verification and is integrated at product commit `9348aa5`;
`RS-WO-002-14` direct cross-role verification and the isolated `RS-WO-002-15` browser walkthrough passed
against the integrated source with full direct, built-server HTTP, and browser evidence. `RIGHTSPOT-002`
is closed for the accepted local MVP. Its verifier Worktrees also exposed an out-of-scope tracked
tooling mutation preserved as procedure evidence. The Field Desk shared CSS, tenant surfaces, and
agent surfaces have since passed their respective independent verification gates and are integrated
at product commits `89a50c7`, `5abdaf3`, and `a2f6a19`; integrated regression passed at frozen source
`4f8a1be`, so `RIGHTSPOT-007` is closed within its accepted behavior-preserving scope.
**Working product:** RightSpot — rental workflow / Rental Marketplace Relay
**Current closure state:** `RS-WO-016-01` passed its bounded repair and fresh independent verification;
Main integrated the repaired exact two-path projection at product commit `edd7575`. `RS-WO-017-03`
passed persistent re-gate and independent verification and is integrated at product commit `2a53917`;
the persistent integrated browser gate `RS-WO-017-04` then returned `VERIFIED` against that commit.
`RIGHTSPOT-016` and `RIGHTSPOT-017` are therefore closed within their bounded outcomes. The original
transient 016/017 overlays and the failed 016 candidate are retained as historical process evidence in
their owning Task Files and, where applicable, the named local-only archive refs recorded there. Their
physical Worktrees have been removed and were never promoted to current source. No active product writer
remains in these lanes; Main owns the canonical document writeback and any future separately registered
consumer.
`RIGHTSPOT-015` remains closed with its Operations authority integrated at `e7f30d5`; `RS-WO-017-02` is
independently verified and integrated at `b7369bd`; `RS-WO-019-01` is independently verified, integrated
at `6f52686`, and closed after its bounded browser/form regression; and `RS-WO-018-01` is independently
verified, integrated at `5eef037`, and closed. These lanes have disjoint write sets.
`RIGHTSPOT-013` accepted the Operations authority decision and is closed, and `RIGHTSPOT-014` accepted
its media proposal and is closed. The reviewed media asset baseline is committed at `760b88f`.
`RIGHTSPOT-016` and `RIGHTSPOT-017` are closed within their bounded outcomes: the repaired Operations
projection is integrated at `edd7575` after fresh independent verification, and the tenant media consumer
is integrated at `2a53917` after independent verification plus the integrated browser gate `RS-WO-017-04`.
Neither lane authorizes a downstream transport, external service, WebMCP, Cloud Receiver, or broader
product claim.
`RIGHTSPOT-018` records two independently reproduced relay-domain defects in one serialized
shared-workflow Work Order and is closed; `RIGHTSPOT-019` records the integrated London-time UI
boundary repair and completed browser/form regression, and is closed.
`RIGHTSPOT-020` remains in progress: the server-side `RS-WO-020-01` foundation and its
`RS-WO-020-01R` tenant Favourite relation-version continuity repair are independently verified; both
UI candidates from `RS-WO-020-02` and `RS-WO-020-03` are adopted in Main, shared navigation is integrated,
and Main typecheck, full suite `121/121`, and production build pass. Independent verification and
checkpoint-scoped Worktree retirement remain open.
The bounded Operations seam `RS-WO-011-01` passed independent verification and is integrated at
product commit `7ff0fbd`; its verifier evidence remains recorded in the owning Task File, and its
physical Worktree was removed during the documented cleanup.
`RS-WO-007-06`, `RS-WO-007-07`, and
`RS-WO-007-08`
independently verified the frozen tenant/agent candidates and the main thread integrated them at
`5abdaf3` and `a2f6a19`; their evidence remains recorded in the owning Task Files, and their physical
Worktrees were removed during the documented cleanup.
The shared CSS
foundation `RS-WO-007-02` is already `VERIFIED` and integrated at product commit `89a50c7` after its
final same-identity browser rerun corrected the stale served-build block under `RIGHTSPOT-007`;
Builder `01a05d75-0116-75e3-807d-a19c6669e659` (`Turing`, local multi-agent) changed only
`app/globals.css`, whose post-Builder SHA-256 is `bb85c353b3943b1267f361b3a4e677bc3e4ce7db09250984085471c7409a957c`.
Independent Verifier `01a05d82-ba0f-7963-9975-200e1fabb962` (`Hooke`) verified the corrected frozen
T2 candidate at `HEAD=89a50c7119c366728c5e4a4cfc022788ddf39f00`. Static checks, typecheck, foundation
tests, build, source identity, served CSS token evidence, responsive browser checks, focus, and
contrast passed; its residual risk is limited to an unassigned agent request-detail fixture.
The tenant Builder task/thread is `01a05db4-6e9d-7e51-8ee1-9b7c62cc31d0` on branch
`rightspot/rs-wo-007-04-tenant`, and the agent Builder task/thread is
`01a05db4-7764-7931-b474-ddbd977762ae` on branch `rightspot/rs-wo-007-05-agent`. The preceding
tenant Verifier is task/thread `01a05dd1-4e8c-7571-9f3a-5ca13f24e00e` using
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-007-06-tenant-verifier`, and the agent Verifier is
task/thread `01a05dd1-4604-7c23-a477-43caadae0ea8` using
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-007-07-agent-verifier`. The preceding
`RS-WO-005-01` navigation candidate was independently `VERIFIED` by
Verifier task `01a05d5d-d796-72f0-baad-ca00d8e7ab4e` and integrated at local product commit `27f5391`.
Verifier attempt 01 was procedurally `BLOCKED` after browser tooling added the tracked repository
metadata line `+.gstack/` to `.gitignore`; the candidate source hash was unchanged and the main thread
preserves that diff. Corrected attempt 02 used browser cwd `/var/tmp/rightspot-browser.65cSwB` and
returned `VERIFIED`. A duplicate supporting
task `01a05d58-0b9e-7e40-8093-befbe4723318` detected the already-dirty shared candidate and returned
`NEEDS_REVIEW` without source changes; it is not a second candidate. `RS-WO-003-01` and
`RS-WO-004-01` completed their read-only decision proposals in supporting tasks
`01a05d47-7fa6-74f1-9f74-fdb88f78c9aa` and `01a05d47-7766-7d43-9e0b-7e59d0e9f9cf` on host
`local`. `RS-WO-002-14` completed its
read-only direct cross-role verification and `RS-WO-002-15` completed the isolated browser walkthrough
against the integrated tenant and agent role pages at product commit `9348aa50b63e3f4f46e77238ad370670383d9d6d`; the closure record is
[`RIGHTSPOT-MVP-CLOSURE-RECORD.md`](Development/RIGHTSPOT-MVP-CLOSURE-RECORD.md).
`RIGHTSPOT-005` is closed and integrated at local commit `27f5391`; its Builder changed only the
declared shared-shell write set and corrected independent verification returned `VERIFIED`. The
preserved `.gitignore` incident is procedure evidence, not a product defect.
The read-only UI decomposition Work Order `RS-WO-007-01` is complete in supporting task
`01a05d5f-cb85-7cf3-96b4-edf0f5891b6d` on host `local` and accepted with revisions; its next
single-file CSS Work Order `RS-WO-007-02` is verified and integrated at product commit `89a50c7`
against candidate commit `89a50c7119c366728c5e4a4cfc022788ddf39f00`; attempt 01 was
procedurally blocked when main-thread process commits moved the Git ref during verification. The
candidate hash was unchanged, the block was recorded, and corrected attempt 02 passed all static/build
checks but was blocked because the existing server served pre-candidate CSS. The candidate was then
captured in `89a50c7`, rebuilt, restarted, observed serving the expected tokens, and independently
verified through the browser. The verification freeze is now closed.
Repaired tenant candidate `52cba87c` passed final independent verification and is integrated at product
commit `9348aa5`. Its predecessor candidate `eb1d62e1b33a045e683f64ba3d28930e9444cd25` had
two verifier runs checkpoint-locally blocked by a tracked `.gitignore` mutation adding `.gstack/` outside
the exact nine-path candidate; the prior verifier evidence remains recorded in the owning Task File,
and the physical verifier Worktrees were removed during the documented cleanup.
The `RS-WO-002-13` agent candidate was independently verified and integrated at product commit `3765747`.
The parent Task File retains the exact historical Worktree paths and supporting-task identities; no
listed historical Worktree is an active source.
**Implementation:** Foundation Builder returned `READY_FOR_VERIFICATION`; the first `RS-WO-002-02` verification attempt was procedurally blocked by an out-of-scope OS temp artifact, then the corrected bounded rerun returned `VERIFIED` against the unchanged source/runtime identity; `RS-WO-002-03` found and repaired a listing-version guard defect in commit `6e70c9f`, and fresh independent verification returned `VERIFIED` against that frozen source; `RS-WO-002-04` candidate adoption completed at T2 commit `68bbc69`; its first dedicated Verifier attempt stopped before source checks because the dispatch prompt described the Worktree root incorrectly, then one corrected follow-up returned `VERIFIED` against frozen source `28105e4d`; `RS-WO-002-05` Builder returned `READY_FOR_VERIFICATION` with the required runtime, focused `35/35` checks, production build, and local API smoke passing; the candidate was integrated at T2 code commit `de169ce`, and a dedicated Verifier independently returned `VERIFIED` against clean snapshot `bc3bc42`; the read-only `RS-WO-002-06` Architecture Advisor returned `READY_FOR_REVIEW`, and the main thread accepted its decomposition with revisions in ADR-RS-0008; `RS-WO-002-07` candidate `d71fe3e` passed dedicated independent verification with foundation `6/6`, focused `9/9`, full direct `50/50`, build, HTTP, role/privacy, conflict, and no-mutation evidence and was integrated at product commit `f700ba9`; `RS-WO-002-08` is integrated at product commit `006d2fd` after a localized generated-output boundary incident was re-baselined in process commit `8b77bdd`; both originate from reviewed baseline `c758634`; `RS-WO-002-09` is integrated as bounded UI guidance; `RS-WO-002-11` Builder returned `READY_FOR_VERIFICATION`, its exact four-path candidate passed dedicated independent verification, and the main thread integrated it at product commit `6a0b4b8`; `RS-WO-002-13` passed dedicated independent verification and is integrated at `3765747`; repaired `RS-WO-002-12` candidate `52cba87c` passed final independent verification and is integrated at `9348aa5`; `RS-WO-002-14` passed direct read-only combined cross-role verification and `RS-WO-002-15` passed the isolated browser walkthrough; closure evidence is reconciled in `RIGHTSPOT-MVP-CLOSURE-RECORD.md`

**Latest role-page disposition:** `RS-WO-002-13` passed independent verification and was integrated
at product commit `3765747`. Repaired `RS-WO-002-12` candidate `52cba87c` passed final independent
verification and is integrated at product commit `9348aa5`; `RS-WO-002-14` then verified the integrated
cross-role HTTP path, privacy boundaries, mutation ordering, and bounded failures; `RS-WO-002-15` then
verified the same primary path through the browser UI. The original tracked
`.gitignore` mutation adding `.gstack/` outside the declared nine-path scope remains preserved for
separate ownership handling.
The parent `RIGHTSPOT-002` is `closed` for the accepted local MVP. ADR-RS-0009 accepts the bounded
Field Desk UI/UX direction and ADR-RS-0010 accepts Clerk as a gated external-auth candidate; neither
decision reopens the MVP or authorizes external credential setup. The Field Desk regression gate is
closed; the current implementation wave is the independently verifiable Operations projection slice
and tenant media consumer slice. The London-time browser/form regression is closed. The current
016/017 transient execution path and failed 016 candidate are historical process evidence only. Their
accepted outcomes are already integrated and closed; evidence is retained in the owning Task Files and
named local-only archive refs, while the physical candidate Worktrees have been removed. No candidate
re-gating or persistent worker lane is currently pending for these closed tasks.
The reviewed property-media asset baseline and Operations authority are complete and remain read-only
inputs to those consumer slices.

**Current cross-role gate:** `RS-WO-005-01` passed corrected independent verification and is integrated
at local commit `27f5391`; the known tracked metadata incident remains preserved. `RS-WO-007-02` is
verified and integrated at `89a50c7`; the tenant and agent role candidates were independently verified
and integrated at `5abdaf3` and `a2f6a19`; `RS-WO-007-08` independently verified the integrated
Field Desk source. `RIGHTSPOT-007` is closed; the accepted MVP cross-role gate remains closed:
`RS-WO-002-14` passed direct read-only verification of the integrated
tenant-to-agent HTTP Happy Path, including role privacy, mutation ordering, and bounded failures.
`RS-WO-002-15` passed the isolated browser walkthrough with no browser error or warning logs. The
implementation, browser evidence, and parent closure record are complete for the accepted local MVP.

The preserved tooling incident is not a product source defect and must not be fixed by reverting or
deleting `.gitignore` without an explicit ownership/recoverability decision. It no longer pauses the
closed `RS-WO-005-01` checkpoint; it remains procedure evidence and is outside the `RS-WO-007-02`
write set.

**Completed refinement history:** `RIGHTSPOT-007`'s Architecture/UI Advisor proposal is accepted
with revisions and the Field Desk implementation is closed. `RS-WO-007-02` passed static/build and
final browser verification and is integrated at product commit `89a50c7`; its rebuilt served runtime
shows the candidate tokens. `RS-WO-007-04` and `RS-WO-007-05` were frozen as clean candidate commits
`63e4c3e` and `33a36f0`, independently verified by `RS-WO-007-06` and `RS-WO-007-07`, and integrated
at product commits `5abdaf3` and `a2f6a19`; `RS-WO-007-08` independently verified the integrated
source. A separate,
non-blocking `RS-WO-007-03` parallelism review returned `READY_FOR_REVIEW` from supporting worker
`01a05d76-dac9-7283-9c2a-4166935f5043`; main accepted its isolation revisions and used them to
register and dispatch the two role Builders.
The newly surfaced `RIGHTSPOT-008` proposal-only `RS-WO-008-01` returned `READY_FOR_REVIEW` from
supporting worker `01a05d79-ce45-7000-aa44-a3a1ecad95b0`. Main jointly reviewed it with `RS-WO-009-01`,
accepted the bounded Favourite direction in ADR-RS-0013, and closed the proposal task; its separate
implementation Task is `RIGHTSPOT-020`. `RS-WO-020-01` is independently verified and closed after
Main completed the bounded server contract/data slice; its tenant and agent UI Work Orders are prepared
but no UI slice is active.
`RIGHTSPOT-009` was reviewed with `RIGHTSPOT-008` after `RS-WO-009-01` returned `READY_FOR_REVIEW`
from `01a05d7c-21b4-72f3-bbe8-1c34d1aee291`. It is closed as `REVIEWED_DEFERRED`: the Information
Request boundary remains proposal evidence only because contact/PII authority, retention, and agent
access decisions are not accepted. It cannot authorize implementation or outbound communication.
`RIGHTSPOT-010` is a separate pending Agent Operations Insights/WebMCP boundary proposal; its
read-only `RS-WO-010-01` returned `READY_FOR_REVIEW` from `01a05d88-8907-7063-8c93-030e296c9df0`
(`Leibniz`) and cannot authorize dashboard implementation, WebMCP registration, reporting changes,
or canonical product writeback. Its proposal record remains unimplemented and separate from the
accepted Favourite lane. `RS-WO-020-01` has now passed independent verification and is closed; the
disjoint tenant and agent UI Work Orders `RS-WO-020-02` and `RS-WO-020-03` are prepared but not yet
dispatched.

`RIGHTSPOT-011` accepts ADR-RS-0011's bounded Agent Operations read-model seam. `RS-WO-011-01`
completed its exact two-path Builder handoff at `5b05c78`, `RS-WO-011-02` independently verified it,
and the main thread integrated it at product commit `7ff0fbd`. The seam remains a server-side contract
only; no Operations route, dashboard, WebMCP, or future 008/009 metric is authorized.
Its pure projection module and focused tests are available against the existing workflow state without
waiting for the unresolved Favourite or Information Request semantics. It does not authorize an
Operations route, dashboard UI, reporting history, WebMCP, or external service.

**Current post-MVP closure:** `RS-WO-016-01` is independently verified and integrated at `edd7575`;
`RS-WO-017-03` is independently verified and integrated at `2a53917`, and `RS-WO-017-04` passed the
integrated browser gate. `RIGHTSPOT-016` and `RIGHTSPOT-017` are closed within their bounded outcomes.
The transient execution-path incident and failed 016 candidate remain process evidence only in the
owning Task Files and named local-only archive refs; their physical Worktrees have been removed. They
do not authorize editing or silently absorbing candidate source. `RS-WO-019-01`
is integrated and closed at `6f52686` after its bounded browser/form regression passed.

**Authoritative closure update:** The earlier checkpoint chronology below intentionally preserves the
state at each historical handoff. It must not be read as reopening the current gate: `RS-WO-002-14`
direct verification and `RS-WO-002-15` browser verification are complete, and `RIGHTSPOT-002` is closed
for the accepted local MVP. See [`RIGHTSPOT-MVP-CLOSURE-RECORD.md`](Development/RIGHTSPOT-MVP-CLOSURE-RECORD.md)
for the complete closure evidence and claim boundary.

## 1. Executive status

RightSpot is the first working application target for this main thread. The existing outer
candidate material is sufficient to establish a product hypothesis, a primary workflow, initial
role boundaries, and a draft Backbone. It is not sufficient to claim that the final application
has been formally selected, validated, implemented, or integrated with the outer Re-entry Core.

The current task is to turn the candidate into a coherent ordinary web application while keeping
its product truth and architecture inside this folder. The first product slice is the one-sided
tenant-to-agent relay. The reciprocal agent-to-tenant leg remains optional.

The latest brainstorm establishes the intended application baseline: a stable but deliberately
bounded rental Web app that can later host the Hackathon integration. It is not intended to be a
complete commercial marketplace. The first build should prioritize a working human flow over
production-grade breadth or exhaustive edge-case coverage.

The accepted implementation baseline is Next.js App Router with React and TypeScript, running on
Node.js 24 with SQLite as the initial durable store. WebRTC is a future Remote Viewing seam, not a
first-phase media implementation; Redis is explicitly deferred.

The current MVP baseline is rental-only with two synthetic roles, a small seeded listing catalogue,
one primary demonstration listing, one Viewing Request, and a complete ordinary UI loop: tenant
discovery and submission, agent queue review and response, then tenant confirmation or decline. Only
the primary tenant-to-agent handoff needs a later automatic continuation demonstration; the tenant's
final response can remain a normal application action.

## 2. State matrix

| Surface | Current state | Boundary |
|---|---|---|
| Product name | **Working name: RightSpot** | Confirmed by the main-thread owner; brand details remain open |
| Candidate source | **Rental Marketplace Relay** | Extracted from outer scenario material |
| Preferred candidate set | **RightSpot and Sleepless Kingdom** | RightSpot is the current development target; outer formal selection remains pending |
| Product thesis | **Provisional** | MVP scope accepted; user/problem and workflow value still need validation |
| Primary slice | **MVP BUSINESS-RULES BASELINE** | Tenant request → agent review → slot proposal/decline → tenant response |
| Human application shell | **TENANT AND AGENT ROLE PAGES INTEGRATED; LOCAL HAPPY PATH CLOSED** | Workflow HTTP/DTO transport is integrated at `f700ba9`; shared demo-session shell is integrated at `006d2fd`; shared authenticated role-page frame is integrated at `6a0b4b8`; agent queue/response UI is integrated at `3765747`; repaired tenant discovery/request candidate `52cba87c` is integrated at `9348aa5`; `RS-WO-002-14` verified the integrated cross-role HTTP path and `RS-WO-002-15` verified the browser walkthrough |
| Domain model | **MVP BUSINESS-RULES BASELINE** | Viewing Request, Listing, Availability, roles, transitions, and audit boundaries |
| Backbone | **LOGICAL BASELINE** | Modular-monolith responsibility is defined and remains the application authority |
| Implementation stack | **FOUNDATION VERIFIED** | Next.js App Router, React, TypeScript, Node.js 24, and SQLite; the runnable foundation passed the corrected independent verification contract, without claiming product-flow or deployment readiness |
| Foundation runtime readiness | **PREPARED / VERIFIED** | Exact arm64 Node.js `v24.20.0` is prepared outside the repository and passed version, npm, archive-checksum, and `node:sqlite` smoke checks; the default shell remains `v26.5.0`, and the Builder used the exact target runtime |
| Realtime / WebRTC | **DEFERRED FEATURE SEAM** | Future Remote Viewing is possible without making WebRTC or signaling an MVP dependency |
| Delegated development | **EXPERIMENTAL PILOT — TASK-OWNED** | `RS-WO-002-01` returned `READY_FOR_VERIFICATION`; corrected `RS-WO-002-02` rerun returned `VERIFIED`; `RS-WO-002-03` bounded repair commit `6e70c9f` passed fresh independent verification; `RS-WO-002-04` candidate `68bbc69` passed dedicated verification against frozen source `28105e4d`; `RS-WO-002-05` candidate is frozen at T2 code commit `de169ce` and passed dedicated independent verification against snapshot `bc3bc42`; `RS-WO-002-06` returned `READY_FOR_REVIEW` and its accepted/revised decomposition is recorded in ADR-RS-0008; `RS-WO-002-07` candidate `d71fe3e` passed dedicated independent verification and is integrated at `f700ba9`; `RS-WO-002-08` is integrated at `006d2fd` after process re-baseline `8b77bdd`; `RS-WO-002-09` is integrated as bounded UI guidance; `RS-WO-002-11` candidate `f1f83c7` passed dedicated independent verification and is integrated at `6a0b4b8`; `RS-WO-002-13` candidate `169cb95d` passed dedicated independent verification and is integrated at `3765747`; repaired `RS-WO-002-12` candidate `52cba87c` passed final independent verification and is integrated at `9348aa5`; `RS-WO-002-14` passed direct read-only cross-role verification; `RS-WO-002-15` passed the isolated browser walkthrough and closure evidence is reconciled in `RIGHTSPOT-MVP-CLOSURE-RECORD.md` |
| Cloud Receiver | **Not a first-phase dependency** | Future integration boundary only |
| WebMCP | **Not a first-phase design center** | Later Hackathon integration boundary |
| Runtime / deployment | **Not started** | No service, hosting, credentials, or public URL |
| Evidence | **LOCAL MVP IMPLEMENTATION + DIRECT AND BROWSER HAPPY PATH VERIFIED** | `RS-WO-002-14` passed pinned install, typecheck, foundation `6/6`, all ten direct test files `57/57`, build, built-server cross-role HTTP, role/error/privacy/conflict, and no-mutation checks; `RS-WO-002-15` completed the isolated browser walkthrough with authoritative versions `1 → 6` and no browser errors or warnings. Deployment and future integrations remain unclaimed |

## 3. Confirmed working inputs

- Two roles are central: tenant and property agent.
- The shared business object is a Viewing Request.
- The candidate has a natural later transition: a tenant submits a request and the agent must
  review it.
- The agent needs a management-console view of the current request and synthetic availability.
- The consequential agent response must remain a visible human decision.
- The first slice should use a small synthetic listing catalogue, one primary listing, one tenant,
  one property agent, one request, and deterministic reset.
- The normal app should support tenant login, listing search/filter, listing detail, Viewing Request
  submission, tenant dashboard, agent queue, request review, availability review, a visible
  proposal/decline decision, and a tenant response to a proposed slot.
- The initial fixture should contain enough seeded listing variety for the discovery UI, while the
  judged flow uses the primary listing, one tenant, one agent, and one request.
- Rental-only is the current MVP decision; buying is deferred rather than implemented as a second
  workflow.
- Favourites, bounded proposal notes, and small listing-status controls are supporting features,
  not blockers for the primary relay.
- The tenant's final confirmation or decline is an ordinary application action; it is not a second
  automatic continuation requirement.
- The first judged consequence boundary is the agent's explicit proposal or decline send action;
  tenant confirmation or decline completes the normal application loop.
- The accepted implementation stack is Next.js App Router, React, TypeScript, Node.js 24, and
  SQLite. Vite is not added as a second frontend framework.
- Redis is not required for the MVP and is deferred until a concrete multi-instance, queue,
  presence, or realtime fan-out requirement exists.
- WebRTC is positioned as a possible future Remote Viewing capability. The MVP preserves ownership
  and module boundaries for it but does not implement camera, microphone, signaling, STUN, TURN, or
  media-session behavior.
- Payment, lease signing, real identity documents, live property data, external calendars, and
  broad marketplace features are outside the first slice.

## 4. Open decisions

- What exact user pain and audience will RightSpot validate?
- What deployment profile should host the accepted local contracts, and what later integration
  transport is actually necessary?
- Whether the local MVP snapshot should later be replaced by a normalized production schema and
  migration strategy.
- What accessibility and responsive layout baseline should the application use?
- Which future Hackathon integration is necessary after the ordinary product loop works?

## 5. Current gate and closure

There is no active implementation gate for the accepted local MVP. The read-only `RS-WO-002-14`
combined cross-role verification passed against integrated source
`9348aa50b63e3f4f46e77238ad370670383d9d6`, and the main-thread `RS-WO-002-15` isolated browser
walkthrough then passed against the same source from a fresh database. The agent candidate `169cb95d`
is integrated at product commit `3765747`, the repaired tenant candidate `52cba87c` is integrated at
`9348aa5`, and both slices use the verified shared frame at `6a0b4b8` and stable transport, listing,
and DTO boundaries. The durable evidence is recorded in
[`RIGHTSPOT-MVP-CLOSURE-RECORD.md`](Development/RIGHTSPOT-MVP-CLOSURE-RECORD.md).

The remaining paragraphs record the earlier checkpoint sequence for audit context; they do not reopen the
closed parent or override the current closure statement above.

## 5.1 Current post-MVP route

The accepted local MVP and the Phase 6 post-MVP closure increment are complete. The current bounded
`RIGHTSPOT-020` implementation lane has passed its pre-UI repair gate and T2 UI adoption; the integrated
source now awaits one frozen-source independent verification:

1. keep the reviewed documentation/procedure baseline and unrelated collaborator work separate;
2. implement only the accepted bounded Favourite direction through `RIGHTSPOT-020`; the
   `RS-WO-020-01R` relation-version continuity repair is independently verified and consumed by UI;
3. dispatch `RS-WO-020-02` and `RS-WO-020-03` in parallel with disjoint paths; both candidates are now
   adopted in Main after exact-path review;
4. serialize shared navigation, listing-card/detail integration, global CSS, source freeze, Main
   integration, independent verification, and Worktree retirement;
5. keep the reviewed `RIGHTSPOT-009` Information Request proposal deferred until its contact/PII
   authority decisions are accepted; it must not be absorbed into `RIGHTSPOT-020`;
6. keep `RIGHTSPOT-006` gated on explicit external credentials and local-origin authorization;
7. treat `RIGHTSPOT-010` as a later Operations/WebMCP decision gate and `RIGHTSPOT-012` as a
   non-blocking read-only audit lane.

Only an explicitly selected, implementation-ready Task may open a code Work Order or temporary
Worktree. The accepted Worktree lifecycle is prompt integration into Main followed by
checkpoint-scoped retirement.

## 5.2 Accepted MVP Work Order boundary (historical closure)

The first `RS-WO-002-02` result is recorded as a procedural `BLOCKED`, and the corrected rerun is
now `VERIFIED` against the unchanged source/runtime identity. The bounded `RS-WO-002-03` domain-core
implementation and projection-isolation repair were independently checked against frozen commit
`a60001e`; the bounded Repairer completed the exact two-path repair in `6e70c9f`; fresh independent verification returned `VERIFIED`. `RS-WO-002-04` was initially held because its prompt was appended to the persisted `RS-WO-002-01` supporting thread. The main thread reconstructed the exact three-path candidate and adopted it at T2 commit `68bbc69`. The first dedicated Verifier dispatch then stopped before source checks because the prompt incorrectly expected a nested `WebMCP_Challenge` directory inside the detached Worktree; one corrected follow-up to the same identity-matching Verifier returned `VERIFIED` against frozen source `28105e4d`. The parent execution posture is now `PROGRESSING`, not globally blocked: `RS-WO-002-05` Builder returned `READY_FOR_VERIFICATION`, its exact 14-path candidate was integrated at T2 code commit `de169ce`, and its dedicated independent Verifier returned `VERIFIED` against canonical snapshot `bc3bc42`. The read-only `RS-WO-002-06` Architecture Advisor returned `READY_FOR_REVIEW`; the main thread accepted its decomposition with revisions and froze the ordinary workflow HTTP/DTO contract in ADR-RS-0008. `RS-WO-002-07` candidate `d71fe3e` passed dedicated independent verification, including foundation `6/6`, focused `9/9`, full direct `50/50`, build, built-server HTTP, role/privacy/conflict, and no-mutation evidence, and is integrated at product commit `f700ba9`; `RS-WO-002-08` passed dedicated independent verification after a generated-output boundary re-baseline in process commit `8b77bdd` and is integrated at product commit `006d2fd`; `RS-WO-002-09` is integrated as bounded guidance; `RS-WO-002-11` candidate `f1f83c7` passed dedicated independent verification and is integrated at product commit `6a0b4b8`. The next gate is to complete the assigned disjoint tenant and agent role-page Work Orders `RS-WO-002-12` and `RS-WO-002-13`, then independently verify and integrate each before the cross-role browser walkthrough. The user-authorized Side Chat learning file and process-only Runbook writeback are classified separately and are not product source drift. Do not claim complete product-flow or parent closure from this checkpoint alone.
The historical role-page disposition was integrated tenant and agent role pages: repaired tenant
candidate `52cba87c` for `RS-WO-002-12` is integrated at `9348aa5`, after `RS-WO-002-13` passed
independent verification and was integrated at `3765747`; `RS-WO-002-14` passed direct combined
cross-role verification. At that historical checkpoint, the browser walkthrough and closure evidence
remained required; both are complete as stated in the current closure section above. The eventual
implementation remained without Cloud Receiver, WebMCP, Redis, or WebRTC media dependencies.

Current checkpoint: `RS-WO-002-14` passed direct combined cross-role verification against the integrated
source, and `RS-WO-002-15` passed the isolated browser walkthrough from
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-15-browser-primary` against the exact integrated
product commit `9348aa50b63e3f4f46e77238ad370670383d9d6`. Browser evidence and parent closure are
reconciled in [`RIGHTSPOT-MVP-CLOSURE-RECORD.md`](Development/RIGHTSPOT-MVP-CLOSURE-RECORD.md).

`RS-WO-002-10` returned `READY_FOR_REVIEW` with no source mutation, and the main thread accepted its
decomposition. `RS-WO-002-11` Builder returned `READY_FOR_VERIFICATION`; T2 review froze the exact
four-path candidate at `f1f83c7`, dedicated verification returned `VERIFIED`, and the main thread
integrated it at `6a0b4b8`. `RS-WO-002-12` and `RS-WO-002-13` were the two disjoint role-page
implementation slices; their exact dispatch identities and Worktrees are recorded in the parent
Task File; tenant task `01a05ba2-34d4-7613-892d-c0776203073c` uses
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-12-tenant-ui`, and agent task
`01a05ba2-3d53-7bd3-934c-6238237576fd` uses
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-13-agent-ui`; the tenant candidate
`eb1d62e1b33a045e683f64ba3d28930e9444cd25` was superseded by repaired candidate
`52cba87c00c3461793b22aa26974da5276d01b48`, which verifier task
`01a05bb1-c38b-7a91-95aa-49475a057e43` independently verified from historical final Worktree
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-12-verifier-final` with exact nine-path scope, Node
`24.20.0`/npm `11.19.0`, foundation `6/6`, tenant focused `4/4`, full direct `54/54`, build, HTTP,
and static evidence. Browser E2E was not run because available browser tooling could mutate tracked
`.gitignore`; no browser claim is made. The owning Task File retains the earlier verifier evidence and the
out-of-scope `.gitignore` mutation adding `.gstack/`; those physical verifier Worktrees were removed
during the documented cleanup. The agent candidate `169cb95d60d4d91c8cd89ef4b722f6fc379db97f`
passed verifier task `01a05bae-de91-7252-b5ce-4a6a729441dd` and is integrated at product commit
`3765747`; its historical verifier path was `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-13-verifier`,
and that physical Worktree was removed during the documented cleanup.

The parent `RIGHTSPOT-002` is `closed` for the accepted local MVP; the foundation Builder stopped after returning
`READY_FOR_VERIFICATION`, the first `RS-WO-002-02` attempt was `BLOCKED` on a procedure boundary,
and its corrected rerun is `VERIFIED` against the unchanged exact target Node.js runtime and
execution manifest. `RS-WO-002-03` Builder and bounded Repairer returned `READY_FOR_VERIFICATION`,
and T2 source is frozen at `a60001e`; the Verifier found a listing-version guard defect and the
bounded Repairer completed it in post-repair commit `6e70c9f`; fresh independent verification returned `VERIFIED`. `RS-WO-002-04` candidate adoption is complete for the three-path persistence/application boundary at T2 commit `68bbc69`; its first dedicated Verifier attempt was procedurally blocked before source checks by an incorrect nested-root path in the dispatch prompt, and one corrected follow-up returned `VERIFIED` against frozen source `28105e4d`. `RS-WO-002-05` discovery is independently verified against T2 code commit `de169ce` from snapshot `bc3bc42`. The `RS-WO-002-06` Advisor's read-only proposal is integrated into ADR-RS-0008 and the admitted Work Orders. `RS-WO-002-07` workflow transport is independently verified at `d71fe3e` and integrated at `f700ba9`; `RS-WO-002-08` passed dedicated independent verification after a generated-output boundary re-baseline in process commit `8b77bdd` and is integrated at product commit `006d2fd`; `RS-WO-002-09` is integrated as bounded UI guidance; `RS-WO-002-11` is integrated at `6a0b4b8`; `RS-WO-002-12` and `RS-WO-002-13` are assigned in parallel from the reviewed baseline, with exact task identities and Worktrees recorded in the parent Task File. Builder, Verifier, Repairer, and Integrator remain sequential checkpoints within each Work Order; the Side Chat process lane remains separate from product-source writes. The main thread owns evidence writeback, Git closure, and dispatch.

## 6. Non-claims

RightSpot currently does not claim a validated rental business, production-ready marketplace,
selected Agent runtime, Cloud Receiver compatibility, WebMCP proof, WebRTC Remote Viewing,
Redis-backed distributed operation, live deployment, or Hackathon submission readiness.
