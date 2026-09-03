# RightSpot Development Roadmap

**Role:** Big-picture implementation, validation, and closure roadmap for the RightSpot child application  
**Status:** Phase 5 is complete for the accepted local MVP, and the earlier Phase 6 post-MVP closure increment
is complete. The continuous cross-layer audit recorded eighteen bounded product findings (`F-01`–`F-06`,
`F-08`, and `F-09`–`F-19`) plus one verification-governance defect (`F-07`): `F-01` (agent draft
visibility), `F-02` (signed-out root session resolution), `F-03` (the loopback development origin
gap), `F-04` (listing-detail request-status notice), `F-05` (terminal request-response presentation),
and `F-06` (the deterministic workflow-fixture reset command). `F-01`–`F-06` and `F-09` are closed
within their bounded local claims; `F-06` was repaired and independently verified through
`RIGHTSPOT-028`, and `F-09` through `RIGHTSPOT-031`. The
2026-09-02 audit registered `F-07` for the default test command under-covering the 28-file/133-test
suite; `RIGHTSPOT-029` is now closed within its command/documentation scope. A subsequent isolated
controlled browser reproduction confirmed the tenant request-dashboard portion of the asynchronous
read concern as `F-08`/`VERIFIED_DEFECT`, now closed through `RIGHTSPOT-030`; the separate
listing-detail dynamic-route concern remains an `EVIDENCE_GAP`. `RIGHTSPOT-030` covered latest-read
sequencing, mutation-result invalidation, and the Refresh gate for draft/decision mutations; its
focused/full, static, runtime, and browser closure evidence is reconciled in the Task File. A later
conflict-recovery audit reproduced `F-09`, where a stale tenant write could lose its explanation after
an authoritative refetch or claim refresh success when recovery failed; `RIGHTSPOT-031` closed that
presentation-only boundary with parent-owned, truthful feedback. The first
implementation route was
the `RIGHTSPOT-023` session-client repair, now verified in its Main Builder and independent read-only
verification checkpoints. The same rendered audit registered `F-03` (the documented 127.0.0.1 dev
origin gap) as the separately gated `RIGHTSPOT-024` configuration route. A subsequent page-entry audit
registered the bounded implementation defect `RIGHTSPOT-021`,
which entered and completed bounded implementation through dispatched `RS-WO-021-01` and independent
verification `RS-WO-021-02`. The joint review of
`RS-WO-008-01` and `RS-WO-009-01` accepted ADR-RS-0013 for the
bounded Favourite increment, deferred the PII-sensitive Information Request boundary, and registered
`RIGHTSPOT-020`; its initial serial contract/data Work Order `RS-WO-020-01` and follow-up
`RS-WO-020-01R` relation-version continuity repair are independently verified, with the repair frozen at
`adfd37e`. The disjoint tenant and agent UI Work Orders `RS-WO-020-02` and `RS-WO-020-03` were dispatched,
adopted into Main at product commit `c29e80d`, passed dependency-complete typecheck, full-suite `121/121`,
production-build checks, and `RS-WO-020-04` independent verification at Main `c977ea4`. The fresh-reset
browser Verifier `RS-WO-020-05` returned `VERIFIED` against Main `f49e1ca`, closing the bounded increment.
`RS-WO-005-01` has passed corrected independent verification and is integrated at local product
commit `27f5391`; `RS-WO-007-01` is accepted as a read-only UI decomposition and `RS-WO-007-02` has
passed final independent browser verification and is integrated at product commit `89a50c7` after
two recorded procedural blocks were corrected. The tenant and agent role slices were independently
verified and integrated at product commits `5abdaf3` and `a2f6a19`; `RS-WO-007-08` passed as the
integrated cross-role regression check and `RIGHTSPOT-007` is closed. `RS-WO-011-01` passed independent
verification and is integrated at product commit `7ff0fbd`; its read-model seam remains separate from
any future consumer. `RS-WO-013-01` returned `READY_FOR_REVIEW`, its bounded authority decision is
accepted in ADR-RS-0012, and `RIGHTSPOT-013` is closed. `RS-WO-015-04` passed fresh independent
verification and the complete Operations authority is integrated at `e7f30d5`; `RIGHTSPOT-015` is
closed. Main-thread `RIGHTSPOT-017-01` reached `ASSET_GATE_READY`; `RS-WO-017-02` passed independent
verification and is integrated at `b7369bd`. `RS-WO-016-01` passed persistent re-gate, bounded repair,
fresh independent verification, and is integrated at `edd7575`; `RS-WO-017-03` passed persistent re-gate,
independent verification, and is integrated at `2a53917`, followed by the verified integrated browser
gate `RS-WO-017-04`. The earlier transient candidates and failed 016 candidate remain process evidence
only in their Task Files and named local-only archive refs; their physical Worktrees have been removed.
Exact path/hash and browser evidence are recorded in their Task Files. The earlier verifier's unrelated persistent-fixture residual (`65/66`) was resolved by
a separate test-only isolation correction and current full suites. `RIGHTSPOT-014` is closed after its
read-only proposal review. `RIGHTSPOT-018` is independently verified, integrated at `5eef037`, and
closed; `RIGHTSPOT-019` is independently verified, integrated at `6f52686`, and closed after its
bounded browser/form regression passed. Their write sets do not overlap the Operations or media lanes. The
prior out-of-scope tracked verifier mutation remains preserved in the owning Task File; its physical
verifier Worktree is no longer present.
The later proposal-response comparison reproduced `F-10`: the tenant could not see the agent-selected
viewing date/time when it differed from the tenant's preferred time. `RIGHTSPOT-032` is registered as
the bounded tenant-safe projection/UI repair and is now `CLOSED_VERIFIED` after focused/full checks and
fresh proposal/terminal browser evidence. The subsequent Agent queue audit reproduced `F-11`: a
terminal `Confirmed` request was mixed into a section labelled as human-response work, while the UI
omitted several terminal state counts. `RIGHTSPOT-033` is registered and now `CLOSED_VERIFIED` as a
presentation-only Agent-dashboard repair; its single serial Work Order passed focused Red→Green, full
static checks, and fresh isolated browser verification in the canonical Main Worktree.
The subsequent tenant listing-detail audit reproduced `F-12`: a cross-listing notice called both a
private `TENANT_DRAFT` and a terminal request active. `RIGHTSPOT-034` closed the bounded state-truthful
copy repair through focused TDD, full static checks, and fresh isolated browser evidence.
The next tenant request-editor audit reproduced `F-13`: repeated preferred-time removal controls
shared the accessible name `Remove`. `RIGHTSPOT-035` closed the bounded option-numbered accessible
name repair through focused TDD, full static checks, and fresh isolated browser evidence.
The follow-up tenant request-editor audit reproduced `F-14`: structural removal left stale validation
feedback after the remaining values became valid. `RIGHTSPOT-036` closed the bounded local-feedback
repair through focused TDD, full static checks, and fresh isolated browser evidence.
The subsequent populated Agent read audit reproduced `F-15`: a failed queue or request-detail refresh
left a retained projection visible alongside the error, including an enabled detail action. `RIGHTSPOT-037`
closed the bounded latest-read truthfulness repair through focused TDD, full static checks, and fresh
isolated queue/detail failure-and-retry browser evidence. The following Agent action-conflict audit
reproduced `F-16`: a stale action could leave a successfully recovered request detail hidden behind a
false unavailable surface. `RIGHTSPOT-038` closed this bounded Agent consumer feedback/read lifecycle
through focused TDD, full static checks, and fresh isolated browser success/failure evidence.
The subsequent listing-detail partial-read audit reproduced `F-17`: a failed tenant request-context
read was incorrectly presented as listing details being unavailable even though the listing read
succeeded. `RIGHTSPOT-039` is registered as the bounded Main-owned UI-consumer repair; its Work Order
does not authorize API, workflow, persistence, auth, navigation, deferred integration, or F-08 work.
`RS-WO-039-01` is now `CLOSED_VERIFIED` after focused TDD, full checks, and fresh isolated browser
failure/recovery evidence within that exact boundary.
The following Discovery error-copy audit reproduced `F-18`: a controlled catalogue read failure
rendered raw server-controlled text alongside the existing bounded error copy. `RIGHTSPOT-040` /
`RS-WO-040-01` is now `CLOSED_VERIFIED` as the single Main-owned serial consumer repair after focused
TDD, full checks, and fresh isolated browser failure/recovery evidence. The repair keeps local
validation separate from bounded catalogue-read copy and does not change adapter, server, API,
workflow, persistence, auth, or shared-component behavior.
The following tenant request-editor audit reproduced `F-19`: a successful draft-save mutation returned
`200` and updated the authoritative request, but the version-keyed editor lost its local success message
when the parent rehydrated it. `RIGHTSPOT-041` / `RS-WO-041-01` is registered as a single Main-owned
serial UI repair covering draft-save and explicit-submit completion feedback in the request dashboard
and listing detail. The accepted parent-owned feedback repair is now `CLOSED_VERIFIED` after focused
TDD, full checks, and isolated browser save/submit/conflict evidence.
The subsequent Tenant Discovery Search review registered `F-21` / `RIGHTSPOT-042` as a P1 contract
decision. It keeps the existing four-filter read path, tenant-safe projection, and ordinary MVP
authority intact. ADR-RS-0014 accepted the Area direction as a canonical structured facet with bounded
deterministic suggestions, shared normalization, explicit unknown-value handling, and no fuzzy or
catalogue fallback. ADR-RS-0015 now accepts the complete first Search contract: the four criteria,
inclusive AND semantics, compatibility date mapping, deterministic source order, bounded full result,
truthful empty/error/stale behavior, page/tool parity, Tenant-only privacy, and page/session-scoped
WebMCP lifecycle. `RIGHTSPOT-042` is closed as a decision gate; `RIGHTSPOT-043` is now
`CLOSED_VERIFIED`. `RS-WO-043-01` and the amended `RS-WO-043-02` source are integrated at product
commits `534f5c9` and `ec7a679`; `RS-WO-043-03` passed independent supported-browser registration,
invocation, and browser evidence against frozen source baseline
`afd5df67507dc81743bde02c706e1232faa7e12c`. `RIGHTSPOT-010` is closed as a reviewed staged Agent
Operations decision through `ADR-RS-0016`; `RIGHTSPOT-044` is now `CLOSED_VERIFIED` for the bounded
manual Agent Operations surface. `RIGHTSPOT-046` is closed through accepted `ADR-RS-0017` for one
bounded Agent-only `read_listing_pipeline` contract; the separate implementation Task
`RIGHTSPOT-047` is paused after T0 baseline recapture and Builder dispatch because the shared
session-lifecycle gap is now registered as `RIGHTSPOT-048`; its original candidate must be
re-baselined after that repair before browser evidence resumes. Other Operations WebMCP capabilities
remain separately gated.
`RIGHTSPOT-012` continues as the non-blocking read-only audit lane against the latest Main source. The post-044 audit
also registered `F-22` / `RIGHTSPOT-045` for a bounded Operations consumer latest-read race repair;
the repair is now `CLOSED_VERIFIED` at product source `3582ba4` after Main-controlled race evidence
and an explicit independent-browser harness limitation. The finding was non-blocking and did not
reopen the 044 API, projection, or WebMCP decisions.
The latest multi-angle audit registered `F-25` / `RIGHTSPOT-050` for a Tenant stale-action gate after
failed conflict recovery and `F-26` / `RIGHTSPOT-051` plus `RS-WO-047-03` for page-bound WebMCP
registration observability. `RIGHTSPOT-050` is now `CLOSED_VERIFIED` after its bounded Main-serial
repair and required checks; `RIGHTSPOT-051` has completed its exact Tenant adapter Builder handoff
and independent deterministic verification and is integrated at product commit `0489155`, while
`047-03` is
gated until the reviewed 048 evidence decision permits a new 047 source baseline. No new P0/P1 issue,
workflow-state defect, privacy leak, or server-authority failure was accepted, and these findings do
not expand the WebMCP contract or the roadmap's deferred integrations.
**Owner:** Main RightSpot thread  
**As of:** 2026-09-03, Europe/London

**Physical workspace:** The canonical Main Worktree remains the only source authority. The stopped,
short-lived `RS-WO-020-02` and `RS-WO-020-03` candidate Worktrees were adopted into Main and retired after
exact-path review. Their historical snapshots remain in the owning Task File records; no candidate
Worktree is an active source or writer.

**Current gate:** No extra implementation Worktree is open; `RS-WO-043-01` and amended
`RS-WO-043-02` are integrated in the canonical Main Worktree, and `RS-WO-043-03` is
`CLOSED_VERIFIED` against frozen source baseline `afd5df67507dc81743bde02c706e1232faa7e12c` in
the declared local supported-browser capability. Chrome `152.0.7977.65` with agent-browser
`0.25.3` and `--enable-features=WebMCPTesting` supplied runtime registration, invocation, lifecycle,
privacy, no-mutation, keyboard, responsive, and console evidence. The accepted local MVP and the
`RIGHTSPOT-039` / `RS-WO-039-01` F-17 listing-detail partial-read repair are closed within their
bounded outcomes.
`RIGHTSPOT-042` is closed as the preceding contract decision, and the Main-thread cross-layer audit
remains non-blocking evidence work. `RIGHTSPOT-044` is also `CLOSED_VERIFIED` at code commit
`9ed906b` and verification snapshot `f884879`; its manual Operations closure evidence is recorded in
the owning Task File. There is no active implementation Worktree.
`RIGHTSPOT-033`, `RIGHTSPOT-034`, `RIGHTSPOT-035`, `RIGHTSPOT-036`, `RIGHTSPOT-037`, and `RIGHTSPOT-038` are `CLOSED_VERIFIED` within their bounded presentation scopes in
the canonical Main Worktree; no extra implementation Worktree is open. `RS-WO-002-13` is integrated at product commit
`3765747`, repaired `RS-WO-002-12` is integrated at `9348aa5`, `RS-WO-002-14` passed direct combined
cross-role verification, and `RS-WO-002-15` passed the isolated browser walkthrough. The closure record
is [`RIGHTSPOT-MVP-CLOSURE-RECORD.md`](RIGHTSPOT-MVP-CLOSURE-RECORD.md). For the active post-MVP
lane, `RS-WO-007-04`/`05` have passed independent verification and are integrated, and the fresh
integrated-source Field Desk regression `RS-WO-007-08` also passed; `RIGHTSPOT-007` is closed. The
verified `RS-WO-011` seam is integrated, and the Operations authority is integrated at `e7f30d5`.
`RS-WO-016-01` is independently verified and integrated at `edd7575`; `RS-WO-017-03` is independently
verified and integrated at `2a53917`, and its integrated browser gate `RS-WO-017-04` is verified.
`RS-WO-017-02` is independently verified and integrated at `b7369bd`.
`RS-WO-018-01` is independently verified, integrated at `5eef037`, and closed. `RS-WO-019-01` is
independently verified, integrated at `6f52686`, and closed after its bounded browser/form regression passed.
Prior
verifier Worktree metadata mutations remain preserved in the owning Task File and are not product
source; their physical verifier Worktrees are no longer present.

`RIGHTSPOT-032` was the bounded post-audit implementation gate for `F-10`. Its single serial Work
Order is now `CLOSED_VERIFIED`; no implementation Worktree was opened. The selected time resolves
from the authoritative sent slot, remains tenant-safe in the DTO, is rendered separately from tenant
preferences, and is retained without terminal action/deadline language.

`RIGHTSPOT-033` is the closed bounded post-audit repair for `F-11`. Its single serial Work Order covered
only Agent-dashboard state-summary and active/history presentation and passed contract review, focused
Red→Green, full checks, and fresh browser verification in Main. The existing queue API, workflow,
privacy, and persistence boundaries remain unchanged.

`RIGHTSPOT-034` is the closed bounded post-audit repair for `F-12`. Its single serial Work Order covered
only the tenant listing-detail cross-listing notice state grouping. It passed focused Red→Green, full
checks, and fresh draft/active/terminal browser evidence; the existing request state, read boundary,
one-request rule, and dashboard handoff remain unchanged.

`RIGHTSPOT-035` is the closed bounded post-audit repair for `F-13`. Its single serial Work Order covered
only the tenant request-editor accessibility names for repeated preferred-time removal controls. It
passed focused Red→Green, full checks, and fresh two-option browser evidence; the existing request
state, validation, removal behavior, and server boundary remain unchanged.

`RIGHTSPOT-036` is the closed bounded post-audit repair for `F-14`. Its single serial Work Order covered
only stale local editor feedback after structural preferred-time removal. It passed focused Red→Green,
full checks, and fresh invalid-correction/removal browser evidence; the existing validation, dirty
tracking, request state, and server boundaries remain unchanged.

`RIGHTSPOT-037` is the closed bounded post-audit repair for `F-15`. Its single serial Work Order covered
only the Agent queue and request-detail consumers' handling of a failed latest read after retained
content had been shown. It passed focused Red→Green, full checks, and fresh queue/detail failure-and-
retry browser evidence; the existing Agent API, workflow, role/privacy, and server boundaries remain
unchanged.

`RIGHTSPOT-038` is the closed bounded post-audit repair for `F-16`. Its single serial Work Order covered
only the Agent request-detail consumer after a stale action returned `409`: a successful recovery read
now renders authoritative detail and current actions beside neutral conflict feedback, while a failed
recovery remains unavailable/retry and withholds detail/actions. It passed focused Red→Green, full
checks, fresh isolated browser success/failure evidence, 320px/keyboard checks, and documentation
reconciliation; the existing Agent API, workflow, role/privacy, and server boundaries remain unchanged.

## 1. Roadmap purpose and authority

This document carries the RightSpot development roadmap: the major phases, milestone outcomes,
entry gates, and explicit deferrals needed to move the ordinary application from accepted design
to a verified demonstration host.

It does not own product behavior, durable architecture decisions, task lifecycle, or runtime truth.
Those remain with the RightSpot product/domain documents, ADRs, `Docs/Tasks/`, current code/tests,
and runtime evidence respectively. The RightSpot Thread Orchestration Pilot Runbook defines how a
bounded increment may be delegated; it is not a roadmap or active-task register.

## 2. Current baseline

- The rental-only product thesis, primary tenant-to-agent workflow, business rules, logical
  Backbone, and implementation stack are accepted working baselines.
- `RIGHTSPOT-001` established the product thesis and Backbone boundary and is closed.
- `RIGHTSPOT-002` is closed for the accepted local MVP. Post-MVP work is admitted only through
  separately bounded Task Files with accepted scope and an explicit next gate; their Work Orders
  remain in those files and this roadmap is not their live queue.
- The foundation package, runtime code, tests, and local reset/health composition now exist as an
  independently verified local baseline; no deployment configuration or Hackathon integration exists.
- The accepted local baseline is Next.js App Router, React, TypeScript, Node.js 24, and SQLite.
  Cloud Receiver, WebMCP, Redis, WebRTC media/signaling, and external services remain deferred.
- [`../07-business-flows-and-scenarios.md`](../07-business-flows-and-scenarios.md) is now the
  canonical audit baseline for the tenant and agent business chains. It records the closed bounded
  findings `F-01` (agent draft privacy), `F-02` (signed-out session resolution), `F-03`
  (`127.0.0.1:3100` development-origin resolution), `F-04` (listing-detail request-status notice),
  `F-05` (terminal request-response presentation), `F-06` (deterministic workflow-fixture reset),
  `F-09` (tenant conflict-recovery feedback), `F-10` (tenant selected-time presentation), `F-11`
  (Agent queue active/history presentation), `F-12` (cross-listing tenant notice truthfulness), and
  `F-13` (preferred-time removal accessibility naming), `F-14` (stale editor feedback after removal),
  `F-15` (stale Agent projection/action after a failed latest read), and `F-16` (stale Agent action
  recovery presentation). `F-01`–`F-06`, `F-09`–`F-16` remain closed within
  their bounded claims, with `F-06` closed through
  `RIGHTSPOT-028` and `F-09` through `RIGHTSPOT-031`. Each remains distinct from the others and from
  deferred integrations; the next audit must re-check them against current source.
- The current physical state is one Worktree: canonical Main. The stopped `RS-WO-020-02` and
  `RS-WO-020-03` UI candidates were adopted into Main and their physical Worktrees were retired after
  exact-path review; their task records remain as historical evidence.
- `RIGHTSPOT-029` is closed: `npm test` now runs the complete authored suite and
  `npm run test:foundation` is the explicit six-test foundation check. No product runtime behavior
  or closed business-flow Task was reopened.
- `RIGHTSPOT-030` is closed for the confirmed tenant request-dashboard read race after its frozen-source
  verification and documentation writeback. The next route is a fresh Main-thread cross-layer audit.
  The separate listing-detail dynamic-route concern remains `F-08`/`EVIDENCE_GAP` until independently
  reproduced.
- `RIGHTSPOT-032` closed the independently reproduced `F-10` tenant proposal-time projection defect.
  It owned only the tenant-safe selected slot `startsAt`/`endsAt` projection and its
  proposal/terminal presentation; no workflow, persistence, agent, or external-integration change
  was admitted. The next route was the `RIGHTSPOT-033` Agent queue presentation gate from the fresh
  Main-thread audit, which is now closed.
- `RIGHTSPOT-033` closed the independently reproduced `F-11` Agent queue presentation defect. Its
  candidate was limited to the dashboard consumer and local CSS; all server, workflow, API, privacy,
  persistence, and dependency boundaries remained unchanged.
- `RIGHTSPOT-034` closed the independently reproduced `F-12` cross-listing tenant notice defect. Its
  candidate was limited to the listing-detail presentation consumer and focused UI contract; all
  request state, read-boundary, server, workflow, API, privacy, persistence, and dependency boundaries
  remained unchanged.
- `RIGHTSPOT-035` closed the independently reproduced `F-13` preferred-time removal accessibility
  defect. Its candidate was limited to one tenant-editor attribute and a focused UI contract; all
  request state, validation, server, workflow, API, privacy, persistence, CSS, and dependency
  boundaries remained unchanged.
- `RIGHTSPOT-036` closed the independently reproduced `F-14` stale editor-feedback defect. Its
  candidate was limited to the tenant-editor removal callback and focused UI contracts; all request
  state, validation rules, dirty tracking, server, workflow, API, privacy, persistence, CSS, and
  dependency boundaries remained unchanged.
- `RIGHTSPOT-037` closed the independently reproduced `F-15` Agent latest-read truthfulness defect.
  Its candidate was limited to the queue and request-detail render guards and focused UI contracts;
  all Agent API, workflow, role/privacy, persistence, CSS, dependency, and server boundaries remained
  unchanged.
- `RIGHTSPOT-038` closed the independently reproduced `F-16` Agent stale-action recovery presentation
  defect. Its candidate was limited to the request-detail conflict feedback/read lifecycle and focused
  UI contract; a successful recovery renders authoritative detail while a failed recovery remains
  fail-closed, with all Agent API, workflow, role/privacy, persistence, CSS, dependency, and server
  boundaries unchanged.

## 3. Roadmap milestones

| Phase | Intended outcome | Entry or closure gate | State |
|---|---|---|---|
| 0. Product and Backbone baseline | Establish the rental thesis, one shared Viewing Request, role boundaries, MVP rules, and logical modular-monolith boundary | Accepted RightSpot decisions and reconciled core documents | Complete through `RIGHTSPOT-001` |
| 1. Implementation readiness | Resolve and record the foundation toolchain, runtime, SQLite/reset, health-route, source-boundary, and verification profile | Main-thread decision gate complete and the first Builder Work Order is ready; the Node.js baseline situation is explicitly recorded | Complete |
| 2. Runnable foundation | Create one local application composition with the accepted stack, server-side SQLite foundation, deterministic reset metadata, and reproducible commands | Builder output reconciled and independently verified | Complete; first Verifier attempt was procedurally blocked, corrected rerun verified |
| 3. Authoritative workflow core | Implement the Viewing Request state machine, availability lifecycle, role projections, version checks, audit facts, and explicit failures | Domain and Backbone checks pass without a browser or external service | Complete; post-repair source `6e70c9f` independently verified |
| 4. Ordinary human application loop | Deliver tenant discovery/request submission, agent queue/review/response, and tenant confirmation/decline as one coherent UI flow | Local tenant-to-agent Happy Path is reproducible from reset | Complete; `RS-WO-002-14` passed independent direct cross-role verification and `RS-WO-002-15` passed the isolated browser walkthrough against integrated source `9348aa50b63e3f4f46e77238ad370670383d9d6` |
| 5. Validation and closure | Complete focused domain checks, role/privacy and stale-state checks, browser walkthrough, evidence reconciliation, and development closure record | Main thread confirms the closure evidence and non-claims | Complete; closure record reconciled and `RIGHTSPOT-002` closed |
| 6. Post-MVP product refinement | Resolve high-impact navigation friction, strengthen visual credibility, and add a truthful Operations foundation without changing relay workflow authority | Each bounded candidate is independently verified and integrated before the next shared-surface change | Closure increment complete; `RS-WO-005-01` integrated at `27f5391`; `RIGHTSPOT-007` closed after `RS-WO-007-08` integrated regression; `RS-WO-011-01`/`02` verified and integrated at `7ff0fbd` as a server-only relay seam; `RIGHTSPOT-013` and `RIGHTSPOT-014` closed with their accepted decisions; `RIGHTSPOT-015` closed at `e7f30d5`; `RS-WO-016-01` independently verified and integrated at `edd7575`; `RS-WO-017-02` integrated at `b7369bd`; `RS-WO-017-03` independently verified and integrated at `2a53917`, with `RS-WO-017-04` browser verification complete; `RS-WO-018-01` integrated and closed at `5eef037`; `RS-WO-019-01` integrated and closed at `6f52686` after browser/form regression; and `RIGHTSPOT-022` independently verified and closed at `f0dbd99` |
| 7. Optional Hackathon integration | Add only the separately selected page capability, continuation adapter, Cloud Receiver boundary, deployment, or judge evidence that the ordinary app proves necessary | Ordinary refinement is stable and a new explicit integration decision exists | First bounded Tenant Discovery Search/WebMCP slice is verified and closed in `RIGHTSPOT-043`; later capabilities remain separately gated |

### 3.1 Current next route

The first Main-owned `RIGHTSPOT-043` Tenant Discovery/WebMCP Search implementation is now
`CLOSED_VERIFIED`; `RS-WO-043-01` and amended `RS-WO-043-02` are integrated, and `RS-WO-043-03`
passed independent supported-browser verification against frozen source baseline
`afd5df67507dc81743bde02c706e1232faa7e12c`/adapter commit `ec7a679`. The first WebMCP goal is
selected as read-only Tenant listing discovery on
`/tenant`; ADR-RS-0014 accepts the canonical Area direction and ADR-RS-0015 accepts the complete
criteria, result/page-state, error/freshness, privacy, and browser-fallback contract. `RIGHTSPOT-043`
is closed within that bounded local outcome. No production, universal browser, judge, or deferred
integration claim is implied.
`RIGHTSPOT-010` is closed as a reviewed staged Agent Operations decision through `ADR-RS-0016`;
its authority and pure projection are already complete through `RIGHTSPOT-013`, `RIGHTSPOT-015`, and
`RIGHTSPOT-016`. `RIGHTSPOT-044` is `CLOSED_VERIFIED` for the ordinary manual Operations page,
strict HTTP consumer, Agent navigation, and independent local browser/API evidence. `RIGHTSPOT-012`
remains the non-blocking audit lane. `RIGHTSPOT-045` is `CLOSED_VERIFIED` for `F-22` within the
manual Operations consumer boundary; `RS-WO-045-01` is integrated at `3582ba4`, with Main-controlled
race evidence and the explicit independent-browser harness limitation recorded. `RIGHTSPOT-046` is
closed through accepted `ADR-RS-0017` for one bounded Agent-only `read_listing_pipeline` contract;
the separate implementation Task `RIGHTSPOT-047` is paused after T0 baseline recapture and Builder
dispatch because `RIGHTSPOT-048` owns the shared lifecycle gate. Its five-path candidate is frozen
locally; deterministic checks and Main browser smoke pass, while its independent browser gate remains
incomplete after one command-level harness block and two bounded partial retries. The 048 candidate is
integrated at `218935c`, but its independent browser gate ended at `BLOCKED_HARNESS` after the corrected
retry produced no final report; no further blind retry is authorized. After a reviewed 048 evidence
decision, 047 must be re-baselined before verification resumes. Other Operations WebMCP capabilities
remain separately gated.
`RIGHTSPOT-049` is now the next independent bounded implementation candidate from the continuing
Search audit. It is a P2 client compatibility repair for F-23, limited to the Search parser and its
focused tests; it can proceed while 047/048 remain paused or harness-blocked and does not alter the
server envelope, Search authority, page consumer, or WebMCP registration.

The accepted local MVP and the bounded `RIGHTSPOT-020` Favourite/listing-interest increment are complete.
The page-entry audit registered `RIGHTSPOT-021` as a bounded implementation route: restore a
persistent tenant navigation entry to the existing `/tenant/requests` dashboard. `RS-WO-021-01`
returned `READY_FOR_VERIFICATION` after changing only its declared two product paths, and independent
`RS-WO-021-02` returned `VERIFIED` against the frozen serialized canonical Main Worktree source. The
bounded parent gate is closed for its declared acceptance matrix. A subsequent Main-thread browser
audit found a `P2` residual at `320–342px`, where the third tenant navigation link is initially
clipped until the links container is scrolled. Main selected the existing `320px` support floor and
registered `RIGHTSPOT-022` as a separate CSS-only responsive repair. `RS-WO-022-01` returned
`READY_FOR_VERIFICATION` in persistent supporting task `01a0602e-e947-7231-bf6f-37ed685681e2`; Main
froze the exact CSS candidate at local product commit `f0dbd99`, and independent `RS-WO-022-02`
verification in persistent supporting task `01a06039-6eea-7033-aaf8-ae34c69aebe7` returned `VERIFIED`.
The bounded Task is closed; no implementation Worktree is open. `RIGHTSPOT-023` and `RIGHTSPOT-024`
are closed after their exact-path Builder, independent verification, browser, and documentation gates.
`RIGHTSPOT-025` was the current registered route for the independently reproduced `F-01` queue/privacy
defect. Its authoritative read-boundary repair, Main checks, and formal persistent verification are
closed; no implementation Worktree is open. The fresh rendered-page audit then registered
`RIGHTSPOT-026` for a bounded P2 listing-detail request-status notice copy defect. Its presentation-only
Red→Green repair, full checks, live browser evidence, and independent persistent verification are
complete; the Task is closed. The next rendered tenant-request audit registered `RIGHTSPOT-027` for a
separate P2 terminal-response presentation defect; its single presentation-only Work Order passed
independent verification after the persistent Builder task `01a060bf-17c7-7c32-96ad-2ea1aa028ebf` and
Verifier task `01a060a8-6f2d-7141-98d0-385483a9104f` completed their gates. No implementation Worktree
is open.
The fresh Main-thread audit reproduced `F-06`: the documented `npm run db:reset` command bypassed the
full workflow reset, left request/Favourite state behind, and could desynchronise foundation metadata
from the workflow snapshot on repeated use. `RIGHTSPOT-028` closed this bounded route: its
`RS-WO-028-01` Work Order passed Main Red→Green checks and persistent frozen-source independent
verification at integrated commit `b2c1682a`; the repair remains limited to CLI composition and an
isolated child-process regression, with no automatic recovery or persistence-contract redesign. No
supporting implementation Worktree was opened.
The subsequent audit registered and closed `F-07`/`RIGHTSPOT-029` after confirming that `npm test`
passed only the six foundation tests while the complete authored suite passed `133/133`. The current
command contract and documentation are reconciled. A later supported isolated browser harness
reproduced the tenant request-dashboard read race and registered `RIGHTSPOT-030`; its scope is
limited to latest-read sequencing, mutation-result invalidation, and the Refresh/mutation overlap
boundary. `RIGHTSPOT-030` is now closed after focused `3/3`, current full `136/136` across 29 test
files, foundation `6/6`, typecheck/build, exact-scope review, local health/reset, independent static
review, and both isolated browser race reruns passed. The separate listing-detail dynamic-route
concern remains `F-08`/`EVIDENCE_GAP`.
The subsequent conflict-recovery audit reproduced `F-09` on both tenant request surfaces. Its
`RIGHTSPOT-031` serial presentation repair passed focused Red→Green, full `137/137` across 30 test
files, foundation `6/6`, typecheck/build, and fresh isolated browser reproductions for the listing
detail and request dashboard. The exact stale-write/API, role/privacy, and listing-detail `load()`
boundaries remain unchanged; `F-09` is closed and no implementation Worktree is open.
The subsequent proposal-response audit reproduced `F-10`: the tenant could see the agent's opaque
slot reference and its own preferred time but not the agent-selected date/time. `RIGHTSPOT-032` is
registered with one serial Work Order for the bounded tenant-safe projection/UI repair; it passed
contract review, TDD, full static checks, and fresh browser verification, and is now closed.
The fresh Main-thread audit continuation also replayed the ordinary local agent-decline browser branch;
`RS-FLOW-11` is now `CLOSED_VERIFIED`. It also replayed the tenant-decision branch through proposal,
explicit tenant decline, terminal readback, and slot release; `RS-FLOW-13` is now `CLOSED_VERIFIED`.
The independent static verification `RS-WO-020-04` and fresh-reset browser verification `RS-WO-020-05`
are reconciled in the owning Task File; the `RS-WO-021-01` implementation and `RS-WO-021-02`
independent verification gates are closed:

1. Kept the reviewed documentation/procedure baseline and unrelated collaborator changes separate.
2. Implemented only the accepted bounded Favourite direction through `RIGHTSPOT-020`; the
   `RS-WO-020-01R` relation-version continuity repair is independently verified before UI consumption.
3. Dispatched tenant and agent UI Work Orders `RS-WO-020-02` and `RS-WO-020-03` in parallel with their
   declared disjoint paths; adopt both candidates into Main and serialize shared navigation, listing-card/
   detail integration, and global CSS.
4. Froze the integrated product source at `c29e80d`; `RS-WO-020-04` independently verified Main `c977ea4`,
   and the two temporary UI Worktrees were retired after Main adoption at the first safe checkpoint-scoped
   opportunity.
5. Reconcile the bounded `RS-WO-020-05` fresh-reset browser evidence against frozen Main `f49e1ca`; it
   passed and closed `RIGHTSPOT-020`. Do not infer deployment, production, or external-integration claims
   from this local browser gate.
6. Keep the reviewed `RIGHTSPOT-009` Information Request proposal deferred until contact/PII authority,
   retention, erasure, and agent-access decisions are accepted; it must not enter `RIGHTSPOT-020`.
7. Keep `RIGHTSPOT-006` outside the implementation lane until the explicit external credential and
   local-origin gate is authorized. It is a separate high-risk lane and must not block ordinary product
   progress.
8. Treat the reviewed staged `RIGHTSPOT-010` decision through [`ADR-RS-0016`](../Decisions/ADR-RS-0016-agent-operations-manual-read-surface-boundary.md)
   as the basis for `RIGHTSPOT-044`; its proposal does not itself authorize WebMCP or dashboard
   implementation. The ordinary manual surface must be implemented and independently verified before
   any separate Operations WebMCP capability is considered.
9. Keep `RIGHTSPOT-012` as a non-blocking, read-only audit lane. It may identify follow-on work but
   does not itself constitute a product implementation milestone.
10. Keep the separately registered `RIGHTSPOT-025` read-boundary/TDD route for `F-01` and the
    presentation-only `RIGHTSPOT-026`/`RIGHTSPOT-027` status-notice repairs closed within their exact
    boundaries. Keep the closed `RIGHTSPOT-023`/`024` entry routes and all deferred integrations
    separate; do not reopen a completed route without a newly reproduced finding.
11. Record the completed `RIGHTSPOT-028` reset-command route, including focused Red→Green regression,
    frozen-source independent verification, and documentation reconciliation. Keep the repair at the
    CLI/test composition boundary; do not broaden foundation-only reset semantics or add automatic
    recovery for already-invalid databases.

Only an explicitly selected, implementation-ready Task opens a new code Work Order or temporary
Worktree. `RIGHTSPOT-023`, `RIGHTSPOT-024`, `RIGHTSPOT-025`, `RIGHTSPOT-026`, and `RIGHTSPOT-027` are
closed after exact-path verification and documentation writeback, with no active implementation
Worktree. `RIGHTSPOT-028` is closed after Main checks, persistent frozen-source independent
verification, and documentation reconciliation; it had no supporting implementation Worktree. Each
accepted output is integrated into Main and its physical Worktree is retired at the
first safe checkpoint-scoped opportunity under the orchestration Runbook. `RIGHTSPOT-021` is closed
for its bounded repair and verification. Main selected the existing `320px` floor and registered
`RIGHTSPOT-022`; its `RS-WO-022-01` Builder returned `READY_FOR_VERIFICATION`, Main froze the exact
CSS candidate at product commit `f0dbd99`, and independent `RS-WO-022-02` verification returned
`VERIFIED`. The bounded Task is closed and no implementation Worktree is open. `RIGHTSPOT-006` and
`RIGHTSPOT-012` remain separate credential and read-only audit gates; `RIGHTSPOT-010` is closed as
the reviewed staged decision, `RIGHTSPOT-044` is `CLOSED_VERIFIED`, and `RIGHTSPOT-045` is
`CLOSED_VERIFIED` within its bounded Operations consumer repair boundary. These do not reopen
`RIGHTSPOT-020`. Local Git closure for the prior `RIGHTSPOT-021` increment
is recorded at `66615d0`.

The post-`RIGHTSPOT-036` fresh Main-thread audit covered reset generations `38` and `39`: the local
tenant-to-agent Viewing Request path, Favourite save/remove/empty state, selected-time projection,
agent active/history movement, wrong-role and signed-out boundaries, and the `320px` floor all passed
with no browser errors. No new bounded implementation finding was reproduced, so no new Task or Work
Order was registered. The separate listing-detail dynamic-route concern remains `F-08`/
`EVIDENCE_GAP` and does not authorize speculative repair. A focused follow-up confirmed that the
ordinary catalogue-to-detail entry replaces the document rather than changing `listingId` in place;
the delayed same-document race therefore remains unproven under the current user path.
The follow-up Agent-surface UX audit at reset generation `39` also passed its empty queue/history
truthfulness, listing-interest read-only boundary, keyboard focus path, and `320px` no-overflow check
with no browser application errors; no new Task was registered.
The following Tenant-surface route audit also passed catalogue entries, no-result filter recovery,
Favourite and Viewing Request empty-state entries, listing-detail unavailable handling, and the
`320px` no-overflow check without a new finding.
The Agent direct-request unavailable path also stayed truthful through a missing-request read and
retry, with a working Back to queue recovery and no new finding.
The subsequent populated request-detail walkthrough at reset generation `40` verified Agent review,
preparation, explicit send, tenant selected-time confirmation, and truthful terminal history; the
fixture was reset to generation `41` and no new finding was registered.

The next populated Agent read audit at reset generation `41` reproduced `F-15`: after a successful queue
and request-detail read, a synthetic page-local failure during each refresh showed the latest-read error
and retry control while retaining the previous queue/detail projection; the detail retained an enabled
`Start review` action. `RIGHTSPOT-037` was registered with one serial Main-owned Work Order. Its
focused Red→Green contract, full `151/151` suite across 36 authored test files, foundation `6/6`,
typecheck, production build, and `320px` keyboard/browser evidence passed. After successful retry
recovery, the fixture was reset to generation `44` and health remained OK; the Task is closed and the
next route is a fresh Main-thread cross-layer audit.

The clean post-`RIGHTSPOT-037` route/role/responsive checkpoint reset the fixture to generation `46` and
re-confirmed signed-out role entry, tenant Browse rentals/Favourites/My request/listing detail, agent
Request queue/listing interest, truthful empty states, the `320px` width floor, keyboard entry, and an
empty browser error log. No new business-flow, UI/UX, responsive, role/privacy, API, persistence, or
runtime defect was reproduced, so no Task or Work Order was registered; the separate listing-detail
dynamic-route `F-08` concern remains an evidence gap. The next route remains a fresh Main-thread
cross-layer audit.

The controlled follow-up `F-08` read-order probe delayed `listing-primary` by `450ms` while immediately
navigating to `listing-north`; the final URL and rendered facts correctly resolved to Northfield Garden
Flat with no browser errors. The synthetic probe did not close the evidence gap or authorize a speculative
repair; the fixture was reset to generation `47` and the next route remains a fresh Main-thread
cross-layer audit.

The subsequent generation-`48` Favourite re-check passed the supported tenant save/reload/remove/reload/
re-save path and the assigned-agent listing-level aggregate/privacy projection, including the `320px`
width and browser-error checks. The unpublished branch remains direct/static-only because the bounded MVP
has no visible admin action to produce an unpublished listing; no hidden endpoint or fixture mutation was
used. No new Task was registered; the fixture was reset to generation `49`, health remained OK, and the
next route remains a fresh Main-thread cross-layer audit.

The subsequent Agent stale-action audit reproduced `F-16` at generation `50`. `RIGHTSPOT-038` was
registered and closed in the canonical Main Worktree after the focused contract went Red `2` then Green
`2/2`, the complete suite reached `153/153` across `37` authored test files, and fresh browser runs at
generations `51`–`53` covered successful and failed recovery, `320px`, keyboard reachability, and empty
page-error evidence. The final fixture was reset to generation `54` and health remained OK. The next
route remains a fresh Main-thread cross-layer audit.

The post-`RIGHTSPOT-038` route/role/fallback recheck at generation `55` passed the tenant catalogue,
filter recovery, listing detail, empty request/Favourite states, wrong-role and missing-resource
boundaries, Agent empty queue/listing-interest entry, exact reviewed media boundary, `320px` no-overflow,
keyboard entry, and browser page-error checks. No new Task was registered; the separate listing-detail
dynamic-route `F-08` concern remains an evidence gap. The fixture was reset to generation `56` and
health remained OK; the next route remains a fresh Main-thread audit.

The subsequent fresh primary-chain replay at generation `57` passed the complete ordinary local
tenant-to-agent path: tenant draft/save/submit, Agent queue/review/preparation/send, tenant proposal
read/confirmation, terminal tenant projection, and Agent confirmed history. It also passed the
tenant-versus-Agent-only note boundary, selected-time distinction, `320px` body/document width floor,
first-Tab skip-link focus, and empty browser page-error check. No new Task was registered; the fixture
was reset to generation `58` and health remained OK. The next route remains a fresh Main-thread
cross-layer audit, with `F-08` still classified as an evidence gap.

The following generation-`59` alternate terminal replay passed the tenant-to-Agent decline branch:
tenant draft/save/submit, Agent review/preparation/send, tenant `Agent Declined` terminal projection,
and Agent read-only history. It confirmed request version `5`, release of all synthetic slots,
tenant-versus-Agent-only note isolation, no terminal action controls, `320px` width/focus checks, and
an empty browser page-error log. No new Task was registered; the fixture was reset to generation `60`
and health remained OK.

The subsequent generation-`60` direct route/role re-check passed signed-out role entry, tenant
catalogue/detail/Favourites/Viewing Request routes, tenant-to-Agent wrong-role handling, Agent queue and
Listing interest entry, explicit empty states, direct URL postconditions, `320px` width equality,
first-Tab skip-link focus, and an empty browser page-error log. A stale browser accessibility-tree ref
returned `Done` without the expected URL transition; direct URL navigation after reacquiring the target
verified the actual rendered surfaces. This was tooling false success, not a product defect. No new Task
was registered. A follow-up at generation `61` used the actual DOM anchor and confirmed full-document
navigation (`navigate`, referrer `/tenant`) to `/tenant/listings/listing-primary` with the expected
`Canal Wharf Apartment` rendering. The fixture was reset to generation `62`, health remained OK, and
`F-08` remains an evidence gap.

The subsequent reverse synthetic same-document probe in isolated `rightspot-audit-063` held both old
primary-listing reads while the App Router moved back to `/tenant/listings/listing-north`; releasing
the old responses left the final route and `Northfield Garden Flat` identity correct. This strengthens
but does not close `F-08`: the probe is page-local timing evidence, ordinary catalogue links remain
full document navigations, and no new Task or Work Order was registered. The fixture remained at
generation `62` and health remained OK.

The following fresh Main-thread cross-layer replay found no new registered finding. The ordinary
tenant-to-Agent chain, role and wrong-role entries, request projection/privacy boundaries, and the
Favourites route remained truthful; the isolated Favourite round-trip saved and removed
`Canal Wharf Apartment`, returning to the explicit no-saved-homes state without browser page errors.
The final Favourite check started from fixture generation `64` and ended with a reset to generation
`65` and healthy `/api/health`. The current complete suite remained `156/156` across `38` authored
test files, foundation `6/6`, typecheck/build, repository validators, sensitive scans, and
documentation validation all passed. No new Task was registered; `F-08` remains an evidence gap.

The next focused audit then reproduced `F-19` in isolated browser session `rightspot-audit-073`:
the tenant's `PATCH /api/tenant/request` returned `200` and the updated draft rendered, but the
success confirmation was lost during the version-keyed editor remount. The matching submit ordering
was confirmed by source inspection. `RIGHTSPOT-041` was registered with one Main-owned Work Order
and repaired in place. The parent-owned feedback design kept authoritative rehydration intact; focused
Red→Green, full checks, and isolated browser save/submit/conflict evidence passed. No implementation
Worktree was opened; the disposable fixture was reset to generation `70` with healthy `/api/health`.
The subsequent fresh post-`041` generation-`72` replay completed the tenant draft/save/submit →
Agent review/prepare/send → tenant confirm chain, terminal Agent history, wrong-role, 320px, keyboard,
and browser-error checks without a new finding. The fixture was reset to generation `73` with healthy
`/api/health`; `F-08` remains an evidence gap because supported catalogue navigation is full-document
and synthetic history manipulation is not ordinary user-flow evidence.

The next `RS-FLOW-04` audit used generation `73` and isolated session `rightspot-audit-077` to verify
the complete tenant Favourite round-trip: save, `/tenant/favourites` read, reload, remove, empty state,
and re-save. Relation versions advanced `1 → 2 → 3`; the tenant request stayed null; and the assigned
Agent saw only listing-level `currentSaves`/`availableInterest` aggregates. The Favourite route passed
the `320px` no-overflow and first-Tab skip-link checks. No new finding or Task was registered; the
fixture was reset to generation `74` with healthy `/api/health`. `F-08` remains an evidence gap.
The subsequent populated `RS-FLOW-16` Agent projection audit used generation `74` and confirmed the
rendered `Current saves`/`Available interest` pairs (`1/1` for the saved published listing and `0/0`
for the other two), separation from the empty request queue, privacy-safe text, and the `320px`/focus/
browser-error floor. No new finding or Task was registered; the fixture was reset to generation `75`.
The follow-up Tenant visual/entry review at generation `75` checked `/tenant`, primary listing detail,
and `/tenant/requests` at desktop, with the existing narrow-viewport evidence as the mobile cross-check.
Navigation, empty handoff, hierarchy, readability, and browser-error boundaries remained truthful; no
new finding or Task was registered. The fixture was reset to generation `76`.
The next Agent Listing-interest failure/retry audit used generation `76`: a controlled `503` rendered
one bounded error surface without raw text or stale counts, preserved the Request queue, and recovered
the authoritative projection after Retry. The `320px` and browser-error checks passed; no new finding
or Task was registered. The fixture was reset to generation `77`.
The subsequent F-08 boundary re-check followed the real catalogue anchors through the primary detail,
back to the catalogue, and Northfield detail. All transitions were full-document `navigate` events
with the expected referrer, the final listing identity was correct, and no browser error or fixture
mutation occurred. This strengthens the supported-route evidence while retaining the hypothetical
future router-reuse concern as `F-08`/`EVIDENCE_GAP`; no speculative repair Task was registered.
The next role/session boundary audit used `rightspot-audit-082` to check signed-out entry, both valid
role workspaces, direct wrong-role access, sign-out recovery, an unknown listing, and Agent detail under
a Tenant session. All rendered boundaries were bounded and privacy-safe, with no browser errors or
fixture mutation; no new defect or Task was registered.
The fresh `rightspot-audit-083` end-to-end replay then passed Tenant draft/save/submit, Agent
review/prepare/send, Tenant proposal/confirm, reload persistence, and Agent terminal-history
boundaries. Versions progressed `1 → 6`, terminal actions were removed, and no browser error or
fixture mutation occurred. No new defect or Task was registered; the fixture was reset to generation `79`.
The fresh `rightspot-audit-084` Agent-decline replay passed Tenant submit, Agent
review/prepare/decline/send, Tenant terminal/reload, and Agent history/read-only boundaries. State
became `AGENT_DECLINED` at version `5`; no browser error, fixture mutation, new defect, or Task was
observed. The fixture was reset to generation `81`.
The subsequent `rightspot-audit-085` rendered route-entry sweep passed Root role entry, Tenant
navigation/listing anchors, all Tenant empty/detail routes, Agent queue/interest controls, and Agent
missing-request recovery. The `320px` responsive floor, first-Tab skip-link entry, image loading, and
browser-error checks passed with no fixture mutation or new finding. No new Task was registered.
The fresh `rightspot-audit-086` proposal-to-tenant-decline replay passed Tenant submit, Agent
review/prepare/send, Tenant proposal/decline, reload persistence, and Agent terminal-history
boundaries. Versions progressed `1 → 6`, the selected slot was released, no browser error or new
finding occurred, and the fixture was reset to generation `82`.
The following documentation reconciliation corrected stale adjacent Task/ADR wording about the closed
`RIGHTSPOT-020` Favourite implementation and retained the historical dispatch narrative. No source or
runtime behavior changed, and no new Task was registered.

## 4. Roadmap operating rules

- The roadmap stays at milestone level. It must not become a catalogue of every future click,
  implementation file, or child-thread message.
- Register only the next actionable parent Task when its boundary and gate are known. Do not create
  placeholder parent tasks for all later roadmap phases.
- Put the lifecycle, current increment, dependency, next gate, and any active Work Orders in the
  owning Task File. A Work Order is an execution brief under that parent, not a second project
  lifecycle; Builder, Verifier, Repairer, and Integrator are sequential checkpoints of the same
  bounded outcome. Multiple active Work Orders are allowed only across explicit independent
  dependency chains with disjoint ownership; the roadmap must not become their live queue.
- Create a separate Development record only when a material implementation, verification, or
  closure increment needs durable evidence/history beyond the Task File; never use it as a second
  live task queue.
- Keep the main thread as the authority for scope, architecture, canonical writeback, integration,
  and closure. A roadmap milestone is a target, not evidence that its implementation has started.

## 5. Current closure

There is no extra implementation Worktree for the accepted local MVP, the confirmed F-08 dashboard race,
or the closed F-09, F-10, F-11, F-12, F-13, F-14, F-15, F-16, F-17, F-18, and F-19 presentation/accessibility
repairs. `RIGHTSPOT-041` is `CLOSED_VERIFIED` with no implementation Worktree open. The frozen
`RIGHTSPOT-047` candidate is present in the canonical Main Worktree, but its independent browser gate
remains incomplete; it is not a verified closure or a push-ready source checkpoint.
`RIGHTSPOT-040` is closed within its bounded Discovery error-copy consumer scope; `RIGHTSPOT-030` is closed within its
bounded tenant request-dashboard scope, and `RIGHTSPOT-031` is closed within its bounded tenant
presentation scope. `RIGHTSPOT-032`, `RIGHTSPOT-033`, `RIGHTSPOT-034`, `RIGHTSPOT-035`, `RIGHTSPOT-036`,
and `RIGHTSPOT-037`, `RIGHTSPOT-038`, and `RIGHTSPOT-039`
are also closed within their separate tenant projection, Agent dashboard, cross-listing tenant notice,
request-editor accessibility, editor-feedback, Agent latest-read truthfulness, and Agent stale-action
recovery and listing-detail partial-read boundaries.
`RS-WO-002-14` passed direct
combined cross-role verification and `RS-WO-002-15` passed the isolated browser walkthrough from a
fresh database against integrated source `9348aa50b63e3f4f46e77238ad370670383d9d6`. The durable
evidence is recorded in [`RIGHTSPOT-MVP-CLOSURE-RECORD.md`](RIGHTSPOT-MVP-CLOSURE-RECORD.md), and
`RIGHTSPOT-002` is closed. Future work requires a new explicit scope decision.

The previously admitted post-MVP increments, including `RIGHTSPOT-005` and `RIGHTSPOT-007`, are
closed historical work rather than the current implementation queue. The current decision boundary is
the `RIGHTSPOT-048` harness-blocked evidence gap, while the non-blocking `RIGHTSPOT-012` audit
continues and the bounded `RIGHTSPOT-049` client repair is now `CLOSED_VERIFIED` against the unchanged
RightSpot projection at repository checkpoint `9994f4e` after its same-contract scalar-correlation
repair. Its original implementation Work Order completed its Builder handoff: `RS-WO-049-01`; the
completed bounded repair is `RS-WO-049-03`. The original
`RIGHTSPOT-047` candidate's
deterministic checks and Main-controlled browser smoke pass, but its independent gate is paused after
one command-level harness block and two bounded partial retries; it must be re-baselined after a
reviewed 048 evidence decision, and no push or closure claim is authorized. The 048 independent gate
ended at `BLOCKED_HARNESS` after its corrected retry produced no final report; no further blind
agent-browser retry is authorized. This does not reopen
the accepted MVP closure or authorize external authentication, Cloud Receiver,
deployment, or commercial-marketplace scope by itself.
The `RIGHTSPOT-049` Search compatibility repair is the current serial source increment after its
Builder handoff. Its completed bounded scalar-correlation repair has passed independent verification and
is closed within its declared boundary
and must not be used to claim that the paused Operations WebMCP candidate or the 048 lifecycle gate is
closed. The candidate-vs-checkpoint path accounting is now explicit: the two-path product candidate is
separate from Main-owned process-only documentation writeback.

The current post-audit route is deliberately small: complete the bounded documentation reconciliation
from the reviewed post-051 audit, then continue the non-blocking audit lane and consider the Agent `RS-WO-047-03` checkpoint according to its
separate ownership and model gates. Keep the 048 browser harness issue as an evidence decision, not a
reason to retry indefinitely. The Main thread continues to own source freeze, integration, canonical
documentation, and Git closure; no extra Worktree is required for the closed 050 increment.

### Historical execution chronology

The first `RS-WO-002-02` attempt is recorded as a procedural block, and the corrected output-boundary
rerun is independently verified against the unchanged source/runtime identity. The verified
foundation is committed as `b06bd85`; `RS-WO-002-03` Builder and a bounded projection-isolation
repair returned `READY_FOR_VERIFICATION`, and the T2 source is frozen at `a60001e`. Its independent
Verifier found a bounded listing-version guard defect; the Repairer corrected it in `6e70c9f` within the
domain workflow and focused domain test paths. Fresh independent verification returned `VERIFIED` against
post-repair source `6e70c9f`. `RS-WO-002-04` now defines the bounded persistence/application integration
checkpoint; the main thread reconstructed and adopted its exact three-path candidate at T2 source
`68bbc69`. Its first dedicated independent Verifier attempt stopped before source checks because the
dispatch prompt described the Worktree root incorrectly; one corrected follow-up to the same
identity-matching Verifier returned `VERIFIED` against frozen source `28105e4d`. `RS-WO-002-05` is
independently verified at T2 code commit `de169ce` from canonical snapshot `bc3bc42`. The read-only
`RS-WO-002-06` Architecture Advisor returned `READY_FOR_REVIEW`; the main thread accepted its
decomposition with revisions and froze the ordinary workflow HTTP/DTO contract in ADR-RS-0008. The
direct `RS-WO-002-14` combined cross-role verification passed; at that historical checkpoint the
remaining gate was the isolated browser walkthrough and closure-evidence review. Repaired tenant candidate
`52cba87c` is integrated at product commit `9348aa5`, and the agent role-page candidate `169cb95d` is
integrated at product commit `3765747`. Both use the integrated workflow transport `f700ba9`, shared
shell `006d2fd`, and shared role frame `6a0b4b8`. `RS-WO-002-08` reached product
integration after a generated-output boundary incident was re-baselined in process commit `8b77bdd`;
`RS-WO-002-09` UI/UX review is integrated as guidance. `RS-WO-002-10` returned `READY_FOR_REVIEW`
and its role-page split is accepted; `RS-WO-002-11` Builder returned `READY_FOR_VERIFICATION`, candidate
`f1f83c7` passed dedicated verification and is integrated at `6a0b4b8`. `RS-WO-002-13` passed dedicated
verification and is integrated at `3765747`; repaired `RS-WO-002-12` candidate `52cba87c` passed final
independent verification and is integrated at `9348aa5`. `RS-WO-002-14` now validates the combined
tenant and agent path. The tenant and agent pages must retain disjoint
route/component/test ownership, consume the existing HTTP/DTO boundary, and remain separately
verifiable before their outputs are coupled. The integrated shell and transport do not authorize
opening the full API/UI surface as one assignment. The user-authorized Side Chat process lane is not
product-source drift. Do not turn the full parent Task into one worker assignment or pre-create
downstream role assignments.

The following Agent preparation and code-quality review used isolated session `rightspot-audit-087` at
generation `83`. The required available-slot control blocked an empty preparation before application
mutation; no new finding or follow-on Task was registered. The fixture was reset to generation `84`,
health remained healthy, and the pinned complete suite, typecheck, build, repository validators,
sensitive scans, documentation validation, and RightSpot diff checks passed.

The same review recorded low-severity `F-20 VERIFIED_POLISH`: at `320px`, the terminal Agent request
detail heading splits `workspace` inside the word, while the document remains overflow-free and the
heading wraps intact at `375px`. This is a non-gating responsive typography residual; no implementation
Task was opened and no ordinary flow or integration boundary changed. The disposable fixture was reset
to generation `85` afterward.

The subsequent read-only code-quality audit checked the current UI, workflow HTTP, projections,
persistence, and Operations error/fallback boundaries against Main HEAD
`4224f3ae53f6d4be87a7be17e74532f5785357b0`. The inspected paths preserve authoritative reads, explicit
conflict recovery, neutral error mapping, and bounded persistence failure handling; no new defect or
false-success fallback was accepted. Full pinned tests (`159/159`), typecheck, build, repository/docs
validation, sensitive scan, diff check, and health passed. No implementation Task was opened. The next
meaningful audit remains the active `RIGHTSPOT-012` lane; this does not change the deferred integration
gates or `F-08` evidence gap.
