# RightSpot Tasks

**Role:** Canonical bounded task routing for the RightSpot child application  
**Status:** Active for post-MVP decision and bounded implementation routing; `RIGHTSPOT-002` remains closed for the accepted local MVP

RightSpot tasks own local product and implementation work. They do not authorize changes to the
outer Core, public deployment, credentials, or Hackathon submission. Keep the queue small and
register a later task only when its prerequisite decision and boundary are known.

The outer repository [`Docs/Tasks/README.md`](../../../../Docs/Tasks/README.md) remains the higher
authority for task admission, control fields, lifecycle, and routing. This local index narrows that
authority to RightSpot; it does not create a second task system.

## Registered tasks

- [`RIGHTSPOT-001 — Establish Product Thesis and Backbone Boundary`](RIGHTSPOT-001-establish-product-thesis-and-backbone-boundary.md)
- [`RIGHTSPOT-002 — Build the MVP application shell`](RIGHTSPOT-002-build-mvp-application-shell.md)
- [`RIGHTSPOT-003 — Define the rental marketplace UI/UX visual system`](RIGHTSPOT-003-define-ui-ux-visual-system.md)
- [`RIGHTSPOT-004 — Define the external authentication boundary`](RIGHTSPOT-004-define-external-authentication-boundary.md)
- [`RIGHTSPOT-005 — Route signed-in users to the role workspace`](RIGHTSPOT-005-fix-post-login-workspace-navigation.md)
- [`RIGHTSPOT-006 — Integrate the provider-backed authentication boundary`](RIGHTSPOT-006-integrate-provider-backed-authentication-boundary.md)
- [`RIGHTSPOT-007 — Implement the accepted Field Desk visual foundation`](RIGHTSPOT-007-implement-field-desk-visual-foundation.md)
- [`RIGHTSPOT-008 — Define tenant favourites and agent listing-interest boundary`](RIGHTSPOT-008-define-favourites-and-listing-interest-boundary.md)
- [`RIGHTSPOT-009 — Define tenant information requests and contact-preference boundary`](RIGHTSPOT-009-define-information-request-and-contact-preference-boundary.md)
- [`RIGHTSPOT-010 — Define the Agent Operations Insights dashboard boundary`](RIGHTSPOT-010-define-agent-operations-insights-dashboard-boundary.md)
- [`RIGHTSPOT-011 — Implement the bounded Agent Operations read-model seam`](RIGHTSPOT-011-implement-bounded-agent-operations-read-model.md)
- [`RIGHTSPOT-012 — Establish a continuous cross-layer product and architecture audit lane`](RIGHTSPOT-012-continuous-cross-layer-product-architecture-audit.md)
- [`RIGHTSPOT-013 — Establish the Operations Insights profile authority`](RIGHTSPOT-013-establish-operations-profile-authority.md)
- [`RIGHTSPOT-014 — Define the property-media evidence boundary`](RIGHTSPOT-014-define-property-media-evidence-boundary.md)
- [`RIGHTSPOT-015 — Implement the Operations profile authority`](RIGHTSPOT-015-implement-operations-profile-authority.md)
- [`RIGHTSPOT-016 — Implement the governed Operations projection`](RIGHTSPOT-016-implement-operations-projection-boundary.md)
- [`RIGHTSPOT-017 — Implement bounded property-media presentation`](RIGHTSPOT-017-implement-property-media-presentation.md)
- [`RIGHTSPOT-018 — Harden relay workflow integrity`](RIGHTSPOT-018-harden-workflow-integrity.md)
- [`RIGHTSPOT-019 — Normalize the tenant Europe/London time contract`](RIGHTSPOT-019-normalize-tenant-london-time-contract.md)
- [`RIGHTSPOT-020 — Implement tenant favourites and agent listing-interest`](RIGHTSPOT-020-implement-favourites-and-listing-interest.md)
- [`RIGHTSPOT-021 — Restore the tenant Viewing Request navigation entry`](RIGHTSPOT-021-restore-tenant-viewing-request-navigation.md)
- [`RIGHTSPOT-022 — Remove narrow-viewport tenant navigation clipping`](RIGHTSPOT-022-remove-narrow-viewport-tenant-navigation-clipping.md)
- [`RIGHTSPOT-023 — Restore signed-out session resolution on the root entry surface`](RIGHTSPOT-023-restore-signed-out-session-resolution.md)
- [`RIGHTSPOT-024 — Allow the documented loopback host in local development`](RIGHTSPOT-024-allow-loopback-dev-origin.md)
- [`RIGHTSPOT-025 — Keep a tenant draft private from the agent workflow`](RIGHTSPOT-025-hide-pre-submission-agent-draft.md)
- [`RIGHTSPOT-026 — Clarify the existing Viewing Request status notice`](RIGHTSPOT-026-clarify-listing-request-status-notice.md)
- [`RIGHTSPOT-027 — Make terminal Viewing Request response state-accurate`](RIGHTSPOT-027-clarify-terminal-request-response-state.md)
- [`RIGHTSPOT-028 — Restore deterministic workflow fixture reset`](RIGHTSPOT-028-fix-deterministic-workflow-fixture-reset.md)
- [`RIGHTSPOT-029 — Align the default RightSpot test command with the complete suite`](RIGHTSPOT-029-align-default-test-command.md)
- [`RIGHTSPOT-030 — Prevent stale tenant request reads from overwriting newer state`](RIGHTSPOT-030-fix-tenant-request-read-concurrency.md)
- [`RIGHTSPOT-031 — Preserve truthful tenant conflict-recovery feedback`](RIGHTSPOT-031-preserve-tenant-conflict-recovery-feedback.md)
- [`RIGHTSPOT-032 — Expose the selected proposal time in the tenant response`](RIGHTSPOT-032-expose-tenant-proposed-viewing-time.md)
- [`RIGHTSPOT-033 — Make Agent queue state counts and terminal history truthful`](RIGHTSPOT-033-agent-queue-state-and-history-truthfulness.md)
- [`RIGHTSPOT-034 — Make the cross-listing request notice status-truthful`](RIGHTSPOT-034-cross-listing-request-status-truthfulness.md)
- [`RIGHTSPOT-035 — Give preferred-time removal controls unique accessible names`](RIGHTSPOT-035-name-preferred-time-removal-controls.md)
- [`RIGHTSPOT-036 — Clear stale editor feedback after removing a preferred time`](RIGHTSPOT-036-clear-stale-editor-feedback-after-removal.md)
- [`RIGHTSPOT-037 — Prevent stale Agent read surfaces after a failed refresh`](RIGHTSPOT-037-prevent-stale-agent-read-surfaces.md)
- [`RIGHTSPOT-038 — Recover the Agent request detail after a stale action conflict`](RIGHTSPOT-038-recover-agent-detail-after-stale-action.md)
- [`RIGHTSPOT-039 — Keep listing-detail partial read failures truthful`](RIGHTSPOT-039-separate-listing-detail-read-failures.md)
- [`RIGHTSPOT-040 — Keep tenant Discovery error copy server-safe`](RIGHTSPOT-040-keep-discovery-error-copy-server-safe.md)
- [`RIGHTSPOT-041 — Preserve tenant request mutation success feedback`](RIGHTSPOT-041-preserve-tenant-request-success-feedback.md)
- [`RIGHTSPOT-042 — Define Tenant Discovery and WebMCP Search contract`](RIGHTSPOT-042-define-tenant-search-and-webmcp-search-contract.md)
- [`RIGHTSPOT-043 — Implement Tenant Discovery Search and WebMCP adapter`](RIGHTSPOT-043-implement-tenant-search-and-webmcp-adapter.md)
- [`RIGHTSPOT-044 — Implement the bounded Agent Operations manual read surface`](RIGHTSPOT-044-implement-agent-operations-manual-read-surface.md)
- [`RIGHTSPOT-045 — Prevent stale Operations reads from overwriting the latest query`](RIGHTSPOT-045-prevent-stale-operations-read-results.md)
- [`RIGHTSPOT-046 — Define Agent Operations WebMCP Listing Pipeline contract`](RIGHTSPOT-046-define-agent-operations-webmcp-listing-pipeline-contract.md)
- [`RIGHTSPOT-047 — Implement Agent Operations WebMCP listing-pipeline capability`](RIGHTSPOT-047-implement-agent-operations-webmcp-listing-pipeline.md)

`RIGHTSPOT-001`, `RIGHTSPOT-002`, `RIGHTSPOT-003`, `RIGHTSPOT-004`, `RIGHTSPOT-005`,
`RIGHTSPOT-007`, `RIGHTSPOT-011`, `RIGHTSPOT-013`, `RIGHTSPOT-014`, `RIGHTSPOT-015`,
`RIGHTSPOT-016`, `RIGHTSPOT-017`, and `RIGHTSPOT-018` are closed within their bounded outcomes. They do not reopen or widen the accepted
local MVP. `RIGHTSPOT-006` is pending behind the explicit external credential gate and does not
authorize provider setup or authentication source changes.
`RIGHTSPOT-008` is closed after joint review with `RIGHTSPOT-009`; its accepted bounded direction is
recorded in ADR-RS-0013 and implementation is separately registered as `RIGHTSPOT-020`.
`RIGHTSPOT-009` is closed as `REVIEWED_DEFERRED`: its Information Request proposal remains useful
review evidence but is not implementation-ready because its contact/PII authority and retention
decisions remain open. It is separate from Viewing Requests and does not authorize outbound
communication or implementation. `RIGHTSPOT-010` is closed as a reviewed staged decision: its
Operations authority and pure projection were separately accepted and implemented through
`RIGHTSPOT-013`, `RIGHTSPOT-015`, and `RIGHTSPOT-016`; the manual read surface is registered
separately as `RIGHTSPOT-044`. It does not authorize dashboard implementation, WebMCP registration,
reporting-schema changes, or canonical product writeback by itself. `RIGHTSPOT-012` is a pending
read-only cross-layer audit lane and does not authorize
implementation or canonical product writeback. `RIGHTSPOT-020` is closed within its accepted bounded outcome: its initial
`RS-WO-020-01` candidate was independently verified, then its `RS-WO-020-01R` relation-version continuity
repair was independently verified at `adfd37e` after a pre-UI defect was found. Its disjoint tenant/agent
UI Work Orders were dispatched, adopted into Main at product commit `c29e80d` after exact-path review, and
passed dependency-complete typecheck, full-suite `121/121`, and production-build checks; `RS-WO-020-04`
independently verified Main `c977ea4`, and fresh-reset browser verification `RS-WO-020-05` returned
`VERIFIED` against Main `f49e1ca`.
its implementation scope excludes `RIGHTSPOT-009` and all external providers. `RIGHTSPOT-016` is closed
with its repaired projection independently verified and integrated at `edd7575`; `RIGHTSPOT-017` is
closed with its tenant media consumer integrated at `2a53917` and its integrated browser gate verified.
The failed 016 candidate and transient 016/017 execution records remain historical evidence and do not
reopen either task. Their physical Worktrees have been removed; the recovery/evidence snapshots that
remain necessary are referenced by the owning Task Files and local-only archive refs
`refs/archive/rightspot/rs-wo-015-01-builder`, `refs/archive/rightspot/rs-wo-016-01-regate`, and
`refs/archive/rightspot/rs-wo-017-03-regate`. These refs are evidence-only and do not authorize source
editing or integration. `RIGHTSPOT-019` is closed after its integrated repair passed the bounded
browser/form regression gate.

`RIGHTSPOT-021` is closed as a verified, narrow tenant-navigation defect. It owned only the missing
entry to the existing `/tenant/requests` dashboard; it did not authorize a workflow, API, data,
authentication, Information Request, or Agent-navigation change. Its `RS-WO-021-01` implementation
Work Order returned `READY_FOR_VERIFICATION` after changing only its declared two product paths, and
persistent Verifier task `01a05ff5-ccf1-75c3-b873-5b39f0e3e28f` independently returned `VERIFIED`.
The post-closure audit found the separate `320–342px` initial-visibility residual, Main selected the
existing `320px` support floor, and `RIGHTSPOT-022` was registered as its bounded responsive repair.
Its `RS-WO-022-01` Builder returned `READY_FOR_VERIFICATION` in persistent supporting task
`01a0602e-e947-7231-bf6f-37ed685681e2`; Main froze the exact CSS candidate at product commit `f0dbd99`,
and independent `RS-WO-022-02` verification in persistent supporting task
`01a06039-6eea-7033-aaf8-ae34c69aebe7` returned `VERIFIED`. The bounded Task is closed.

`RIGHTSPOT-023` is closed after its Main-thread Builder, independent read-only verification, and
fresh browser evidence. `RIGHTSPOT-024` is also closed after its config-only Builder, path-scoped
independent verification, clean production build, and fresh loopback browser walkthrough.
`RIGHTSPOT-025` is now closed after its authoritative read-boundary TDD repair, focused regression,
full suite, typecheck, production build, live loopback smoke, and formal persistent read-only
verification. It keeps `TENANT_DRAFT` tenant-private from both agent queue and direct detail while
preserving post-submit visibility. None of these bounded repairs reopens `RIGHTSPOT-005`, changes the
server session contract, or adds external authentication.

`RIGHTSPOT-026` is now closed as a P2 presentation-only repair: the same-listing notice on tenant
listing detail no longer composes state labels into ungrammatical or state-inaccurate copy. Its one
tenant-component/UI-test Work Order passed Red→Green, full checks, live browser evidence, and
independent persistent verification without changing workflow behavior.

`RIGHTSPOT-027` is now closed for a separately reproduced tenant request-dashboard presentation defect:
retained slot-proposal responses showed `Action needed` and `Respond by` after the request was already
confirmed, declined, or expired. Its single presentation-only Work Order passed Red→Green, Main checks,
and independent verification by persistent tasks `01a060bf-17c7-7c32-96ad-2ea1aa028ebf` and
`01a060a8-6f2d-7141-98d0-385483a9104f`; no separate implementation Worktree was open.

`RIGHTSPOT-028` is now a closed P1 reset-boundary repair: the documented `npm run db:reset` command
composes the authoritative workflow reset and no longer leaves request/Favourite state behind or
desynchronises metadata from the workflow snapshot. Its single `RS-WO-028-01` command-composition
and isolated child-process regression passed Main Red→Green checks and independent frozen-source
verification by persistent task `01a060fa-3cc5-7f22-9d74-d8c0eb95d21b`; it is integrated at
`b2c1682a34a395ff9471f4338b213a0ede938134`. No supporting implementation Worktree was opened and
no recovery fallback is authorized.

`RIGHTSPOT-029` is closed as a P1 verification-contract repair. Its single Work Order changed only
the package scripts and current command guidance: `npm test` now runs the complete authored suite
(`133/133` across 28 test files), while `npm run test:foundation` preserves the explicit six-test
foundation check. Typecheck, production build, local health, reset, and minimum browser smoke passed;
no product behavior or closed business-flow Task was reopened.

`RIGHTSPOT-030` is `CLOSED_VERIFIED` for the confirmed dashboard portion of `F-08`. Its single Work
Order changed only latest-read sequencing, mutation-result invalidation, and the Refresh/mutation
overlap boundary in `src/ui/tenant/tenant-request-page.tsx`; focused `3/3`, full `136/136` across
29 test files, foundation `6/6`, typecheck, build, exact-scope review, local health/reset, and both
isolated browser race reruns passed. It does not authorize listing-detail changes, server workflow
changes, or speculative async infrastructure. The analogous listing-detail concern remains a separate
`EVIDENCE_GAP`.

`RIGHTSPOT-039` is `CLOSED_VERIFIED` as a separately reproduced P2 listing-detail consumer defect.
Its Main-owned serial Work Order changed only independent listing/request-context read ownership and
recovery, passed focused/full checks and fresh browser failure/recovery evidence, and does not close
or authorize server, workflow, contract, auth, navigation, deferred integration, or F-08 work.

Work Orders are recorded inside the [`RIGHTSPOT-002` Task File](RIGHTSPOT-002-build-mvp-application-shell.md);
`RS-WO-002-01` returned `READY_FOR_VERIFICATION`, the corrected `RS-WO-002-02` rerun returned
`VERIFIED`, `RS-WO-002-03` returned `VERIFIED` after its bounded repair, and `RS-WO-002-04` returned
`VERIFIED` against frozen source `28105e4d`. `RS-WO-002-05` is independently verified against
canonical snapshot `bc3bc42`. The read-only Architecture Advisor `RS-WO-002-06` returned
`READY_FOR_REVIEW`; the main thread accepted its decomposition with revisions, froze the ordinary
workflow HTTP/DTO contract in ADR-RS-0008, and dispatched `RS-WO-002-07`, `RS-WO-002-08`, and
`RS-WO-002-09` from reviewed baseline `c758634`. `RS-WO-002-07` and `RS-WO-002-08` passed dedicated
independent verification and are integrated at product commits `f700ba9` and `006d2fd`; the reviewer
is integrated as bounded guidance. `RS-WO-002-10` returned `READY_FOR_REVIEW`
and its decomposition is accepted; `RS-WO-002-11` candidate `f1f83c7` passed independent verification
and is integrated at `6a0b4b8`; `RS-WO-002-13` passed independent verification and is integrated at
product commit `3765747`; repaired `RS-WO-002-12` candidate `52cba87c` passed final independent
verification and is integrated at product commit `9348aa5`; `RS-WO-002-14` passed the read-only direct
combined cross-role verification checkpoint and `RS-WO-002-15` passed the isolated browser walkthrough.
Its predecessor verifier runs were checkpoint-locally
blocked by a tracked `.gitignore` mutation adding `.gstack/` outside the declared candidate scope; the
original evidence remains preserved for separate ownership/recoverability handling. No separate
registered Task or Task File is created for that repair or recovery.
The user-authorized Side Chat learning
artifact and Pilot Runbook writeback are process-only changes, not product source drift.
One registered Task has one Task File. A Work Order is a dispatch brief under that Task; normally
there is one active Work Order per dependency chain, while explicitly independent slices may run in
parallel under the same file. Builder, Verifier, Repairer, and Integrator are checkpoints, not
additional registered Tasks. Do not turn this file into a speculative backlog or a second active-work
register. The parent remained `in_progress` when a checkpoint was locally blocked but safe parent-goal
work remained; it is now `closed` for the accepted local MVP. The Side Chat process lane is separately
declared and user-authorized.

**Current gate:** There is no active implementation gate for the accepted local MVP or the confirmed
tenant-request dashboard race. `RIGHTSPOT-029`, `RIGHTSPOT-030`, `RIGHTSPOT-033`, `RIGHTSPOT-034`,
`RIGHTSPOT-035`, `RIGHTSPOT-036`, and `RIGHTSPOT-039` are closed within their bounded verification and presentation
scopes. The fresh Main-thread cross-layer audit,
`RS-WO-002-14` direct evidence and `RS-WO-002-15` browser evidence
remain reconciled in the [`RIGHTSPOT-MVP-CLOSURE-RECORD.md`](../Development/RIGHTSPOT-MVP-CLOSURE-RECORD.md),
and `RIGHTSPOT-002` is closed.

**Current post-MVP gates:** `RIGHTSPOT-006` and `RIGHTSPOT-012` remain pending (credential and
read-only audit gates); `RIGHTSPOT-046` is closed through accepted `ADR-RS-0017` as the Operations
WebMCP contract decision, and `RIGHTSPOT-047` is the pending source implementation gate;
`RIGHTSPOT-045` is now `CLOSED_VERIFIED` within its bounded
Operations consumer repair boundary after Main-controlled race verification and an explicitly recorded
independent-browser harness limitation;
`RIGHTSPOT-044` is `CLOSED_VERIFIED` for its bounded manual Operations implementation;
`RIGHTSPOT-010` is closed as a reviewed staged decision through `ADR-RS-0016` and the earlier
Operations authority/projection Tasks. `RIGHTSPOT-033` is closed within its
accepted Agent-dashboard contract; `RIGHTSPOT-032` is closed within its
bounded tenant projection/presentation outcome. `RIGHTSPOT-023` and `RIGHTSPOT-024`
are closed within their bounded outcomes; `RIGHTSPOT-025` and `RIGHTSPOT-026` are closed within their
bounded outcomes; `RIGHTSPOT-027` is closed after its Builder handoff and independent verification;
`RIGHTSPOT-021` is closed as an implementation gate, and `RIGHTSPOT-022` is closed at product commit `f0dbd99` after
`RS-WO-022-01` returned `READY_FOR_VERIFICATION` and `RS-WO-022-02` independently returned
`VERIFIED` for the separately registered `320–342px` responsive repair. `RIGHTSPOT-020` is closed with
`RS-WO-020-01R` verified,
its UI candidates adopted into Main at product commit `c29e80d`, `RS-WO-020-04` independently verified at
Main `c977ea4`, and `RS-WO-020-05` fresh-reset browser verification passed against Main `f49e1ca`.
`RS-WO-016-01` is
independently verified and integrated at `edd7575`; `RS-WO-017-03` is independently verified and
integrated at `2a53917`, with `RS-WO-017-04` browser verification complete. `RS-WO-019-01` is closed
after its bounded browser/form regression passed. No closed task is an active implementation gate.
`RIGHTSPOT-030` is closed within its single serial tenant-request-page behavior boundary. Its
focused regression and browser evidence are recorded in the Task File; no implementation Worktree
is open.

`RIGHTSPOT-031` is `CLOSED_VERIFIED` as a P2 tenant presentation repair. A stale submit was
reproduced as `409` followed by a successful authoritative refetch, but the version-keyed editor
remounted and lost the required conflict explanation. Its adjacent failed-refetch copy was also
statically untruthful. The Main-owned serial Work Order now keeps the notice in parent state, reports
truthful recovery failure, and passed focused TDD, full regression, build, and isolated browser
verification on both tenant request surfaces. It does not authorize workflow/API changes or the
separate un-reproduced listing-detail async-read repair.

`RIGHTSPOT-032` is closed after the fresh Main-thread audit reproduced `F-10`: its single serial Work
Order now resolves the selected slot's tenant-safe date/time, keeps it distinct from the tenant's
preferred time, retains it in terminal history, and blocks incomplete proposal payloads without a
fallback. Focused projection/UI contracts, the complete static suite, and fresh browser proposal/
confirm evidence passed; no implementation Worktree was opened.

`RIGHTSPOT-033` is now `CLOSED_VERIFIED` for the fresh `F-11` Agent queue presentation defect. Its
single Agent-dashboard Work Order passed focused Red→Green, full static checks, and fresh isolated
browser verification: active requests are separated from terminal recorded outcomes, all seven
non-draft counts are visible, and terminal card action language is truthful. It did not change API,
workflow, persistence, privacy, or dependency behavior.

`RIGHTSPOT-034` is `CLOSED_VERIFIED` for the reproduced P2 tenant listing-detail presentation defect.
Its single Main-owned Work Order now groups cross-listing notices into explicit draft, active, and
terminal copy while preserving the existing one-request dashboard handoff. Focused Red→Green, full
static checks, and fresh isolated browser evidence passed. It did not change workflow, API,
persistence, privacy, or dynamic-route behavior.

`RIGHTSPOT-035` is `CLOSED_VERIFIED` for the reproduced P2 tenant editor accessibility defect. Its
single Main-owned Work Order gives repeated preferred-time removal controls unique option-numbered
accessible names while preserving visible copy, removal behavior, validation, and the one-to-three
boundary. Focused Red→Green, full `147/147` tests across `34` authored test files, foundation
`6/6`, typecheck, production build, and isolated browser evidence passed. It did not change workflow,
API, persistence, CSS, or shared navigation behavior. At that closure checkpoint, stale validation
copy after structural removal remained outside the 035 boundary; the subsequent Main audit reproduced
and closed it separately through `RIGHTSPOT-036`.

`RIGHTSPOT-036` is `CLOSED_VERIFIED` for the separately reproduced P2 stale-feedback defect. Its
single Main-owned Work Order clears local editor error/status feedback when a preferred-time row is
removed while preserving `RIGHTSPOT-035` accessible names, row filtering, validation, dirty tracking,
and the server boundary. Focused Red→Green, full `149/149` tests across `35` authored test files,
foundation `6/6`, typecheck, production build, and isolated browser evidence passed; no supporting
Worktree was opened.

`RIGHTSPOT-037` is `CLOSED_VERIFIED` for the separately reproduced P2 Agent read-failure defect. A
populated queue refresh failure retained the prior counts and request card beside the error/retry
state; a populated request-detail refresh failure retained request facts, availability, and the
enabled `Start review` action beside the detail error. Its single serial Work Order now withholds
retained projections and actions during refresh/failure, while preserving successful retry recovery;
it did not change API, workflow, persistence, role/privacy, or listing-interest behavior. Focused Red
`2/2`, full `151/151`, foundation `6/6`, typecheck, build, 320px browser, keyboard, and failure/retry
evidence passed in the canonical Main Worktree; the final fixture generation is `44`.

`RIGHTSPOT-038` is `CLOSED_VERIFIED` for the separately reproduced P1 Agent stale-action recovery
defect. Its single Main-owned Work Order keeps the stale action failed, renders the authoritative
detail after a successful recovery read with neutral conflict feedback, and keeps the bounded
unavailable/retry surface when that recovery read fails. Focused Red→Green, full static checks,
fresh isolated browser success/failure evidence, 320px/keyboard checks, and documentation
reconciliation passed without changing the Agent API, workflow, persistence, role/privacy, or shared
contract boundaries. No supporting implementation Worktree was opened.

`RIGHTSPOT-039` is `CLOSED_VERIFIED` for the separately reproduced P2 tenant listing-detail
partial-read defect. Its single Main-owned Work Order separates listing and tenant request-context
read ownership, preserves successful listing facts, withholds request-derived UI while its context is
unavailable, and provides a context-specific retry. Focused Red→Green, full `156/156` tests across
38 authored test files, foundation, typecheck, build, repository validation, and fresh isolated
browser failure/recovery evidence passed without changing API, workflow, persistence, privacy, CSS,
dependency, or `F-08` behavior.

`RIGHTSPOT-040` is `CLOSED_VERIFIED` for the separately reproduced P2 tenant Discovery error-boundary
defect. Its single Main-owned Work Order keeps local filter-validation feedback separate from
catalogue-read failure copy and prevents raw server-controlled error text or duplicate read-failure
feedback. Focused Red→Green, full checks, and fresh isolated browser failure/recovery evidence passed;
the repair remained Main-owned and was not externally dispatched. No adapter, server, API, workflow,
persistence, or shared component change was made.

`RIGHTSPOT-041` is `CLOSED_VERIFIED` as the newly reproduced P2 tenant request-editor feedback defect.
Its single Main-owned Work Order covers the shared version-keyed editor in the request dashboard and
listing detail. Parent-owned bounded success feedback now survives the authoritative response and editor
remount; focused TDD, full checks, and isolated browser evidence passed. No supporting implementation
Worktree was opened.

`RIGHTSPOT-042` is `CLOSED_VERIFIED` as the P1 Tenant Discovery/WebMCP Search contract decision. It
recorded `F-21` and accepted ADR-RS-0015: four bounded criteria, canonical Area resolution, date
mapping, inclusive AND semantics, deterministic bounded results, truthful error/empty/stale behavior,
ordinary UI/API parity, tenant-safe output, and page/session-scoped read-only WebMCP lifecycle. It
authorized no source or registration change; implementation is separately registered as
`RIGHTSPOT-043`. `RIGHTSPOT-010` is closed as a separate reviewed staged Agent Operations decision
and is not absorbed by this task; its manual-surface implementation is registered as `RIGHTSPOT-044`.

`RIGHTSPOT-043` is now `CLOSED_VERIFIED` for the accepted Tenant Discovery Search contract and its
thin page-bound WebMCP adapter. It contains the sequential Work Orders for ordinary UI/API semantics,
the adapter, and independent supported-browser verification. `RS-WO-043-01` is integrated in the
canonical Main Worktree at product code commit `534f5c9`; the amended `RS-WO-043-02` adapter is
integrated at `ec7a679` after exact-path review, Node 24 checks, the complete `171/171` suite,
production build, repository validators, sensitive scan, and ordinary browser smoke. The first
adapter attempt was blocked before integration because the shared client could not forward
`AbortSignal`; Main recorded the bounded `tenant-api.ts` scope amendment in `e7be681` and completed
the amended handoff. `RS-WO-043-03` then passed independent supported-browser verification against
frozen source baseline `afd5df67507dc81743bde02c706e1232faa7e12c` using Chrome `152.0.7977.65`,
agent-browser `0.25.3`, and `--enable-features=WebMCPTesting`. No extra Worktree is open and no
product defect was reproduced.

**Current route:** `RIGHTSPOT-043` is closed for this bounded Main-owned Tenant Discovery/WebMCP
Search outcome; `RS-WO-043-01`, amended `RS-WO-043-02`, and `RS-WO-043-03` are complete. The
supported-browser evidence covered exact registration/invocation, page parity, filter/error/empty
boundaries, role/privacy/no-mutation, lifecycle teardown, manual fallback, keyboard, responsive
layout, sign-out cleanup, and console/page errors. `RIGHTSPOT-042` is closed as the decision gate.
`RIGHTSPOT-041` and `RIGHTSPOT-040` remain closed within their exact tenant consumer boundaries. No
extra code Worktree is open.
`RIGHTSPOT-032` through `RIGHTSPOT-040` remain closed within their exact tenant and Agent
presentation boundaries.
`RIGHTSPOT-030`
remains closed for the confirmed dashboard portion of `F-08`, and the separate listing-detail
async-read concern remains an evidence gap.
`RIGHTSPOT-028` is closed after
`RS-WO-028-01` passed Main Red→Green checks and persistent frozen-source independent verification;
the canonical Main Worktree remains the only source authority. `RIGHTSPOT-027`, `RIGHTSPOT-026`,
`RIGHTSPOT-022`, and `RIGHTSPOT-021` remain closed within their separately recorded
presentation/navigation boundaries. `RIGHTSPOT-020` remains closed after its Favourite/listing-interest
implementation and fresh-reset browser verification. `RIGHTSPOT-006` stays gated on explicit external
credentials and local-origin authorization; `RIGHTSPOT-010` is closed as a reviewed staged Operations
decision; `RIGHTSPOT-012` is non-blocking read-only audit work; `RIGHTSPOT-042` is closed as the
selected Tenant Search contract gate; `RIGHTSPOT-043` is `CLOSED_VERIFIED`; `RIGHTSPOT-044` is
`CLOSED_VERIFIED` for its bounded manual Operations surface; and `RIGHTSPOT-045` is
`CLOSED_VERIFIED` for its bounded Operations consumer latest-read boundary. `RIGHTSPOT-046` is
closed through accepted `ADR-RS-0017` as the separate Main-owned contract decision for one Agent
Operations WebMCP `read_listing_pipeline` capability; it admits the separate pending implementation Task
`RIGHTSPOT-047` but does not authorize source change or registration. Only that implementation Task,
after recaptured baseline and explicit paths, may open code Work Orders or a temporary Worktree.

The completed [`RIGHTSPOT-001`](RIGHTSPOT-001-establish-product-thesis-and-backbone-boundary.md)
record remains discoverable by filename and is not deleted or moved.

## Task lifecycle

Use `pending -> in_progress -> verification_pending -> closed`, with a named dependency when the
next increment cannot proceed. A task record must state its bounded outcome, owner, current
evidence, non-goals, verification, next gate, and reopen condition.
