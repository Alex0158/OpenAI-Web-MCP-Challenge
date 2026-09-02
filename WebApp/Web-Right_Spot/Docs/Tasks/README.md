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
communication or implementation. `RIGHTSPOT-010` is a pending read-only decision task for the
proposed Agent Operations Insights dashboard and bounded WebMCP query surface; it does not authorize
dashboard implementation, WebMCP registration, reporting-schema changes, or canonical product
writeback. `RIGHTSPOT-012` is a pending read-only cross-layer audit lane and does not authorize
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
existing `320px` support floor, and `RIGHTSPOT-022` is now registered as its bounded responsive repair.
Its `RS-WO-022-01` Builder returned `READY_FOR_VERIFICATION` in persistent supporting task
`01a0602e-e947-7231-bf6f-37ed685681e2`; Main froze the exact CSS candidate at product commit `f0dbd99`,
and independent `RS-WO-022-02` verification is the next gate.

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

**Current gate:** None for the accepted local MVP. `RS-WO-002-14` direct evidence and `RS-WO-002-15`
browser evidence are reconciled in the
[`RIGHTSPOT-MVP-CLOSURE-RECORD.md`](../Development/RIGHTSPOT-MVP-CLOSURE-RECORD.md), and
`RIGHTSPOT-002` is closed.

**Current post-MVP gates:** `RIGHTSPOT-006`, `RIGHTSPOT-010`, and `RIGHTSPOT-012` remain pending
(credential, decision, and read-only audit gates respectively); `RIGHTSPOT-021` is closed as an
implementation gate, and `RIGHTSPOT-022` is `in_progress` with `RS-WO-022-01` at
`READY_FOR_VERIFICATION` and `RS-WO-022-02` as the next independent gate for the separately registered
`320–342px` responsive repair. `RIGHTSPOT-020` is closed with
`RS-WO-020-01R` verified,
its UI candidates adopted into Main at product commit `c29e80d`, `RS-WO-020-04` independently verified at
Main `c977ea4`, and `RS-WO-020-05` fresh-reset browser verification passed against Main `f49e1ca`.
`RS-WO-016-01` is
independently verified and integrated at `edd7575`; `RS-WO-017-03` is independently verified and
integrated at `2a53917`, with `RS-WO-017-04` browser verification complete. `RS-WO-019-01` is closed
after its bounded browser/form regression passed. No closed task is an active implementation gate.

**Current route:** `RIGHTSPOT-022` is the active bounded route. Main selected the existing `320px`
support floor after the `RIGHTSPOT-021` post-closure audit found initial clipping of the third tenant
navigation link at `320–342px`. Its `RS-WO-022-01` Builder returned `READY_FOR_VERIFICATION` in
persistent supporting task `01a0602e-e947-7231-bf6f-37ed685681e2`; Main froze the exact CSS candidate at
product commit `f0dbd99`, and `RS-WO-022-02` is the next independent gate. The boundary is CSS-only,
tenant-scoped, and serialized on the canonical Main Worktree. No implementation Worktree is open.
`RIGHTSPOT-021` remains closed for
its bounded implementation and verification. Its
`RS-WO-021-01` implementation changed only the declared two product paths, and `RS-WO-021-02`
independently returned `VERIFIED` against the frozen canonical Main Worktree. A subsequent
Main-thread audit found that the third tenant navigation link is initially clipped at `320–342px`;
the support-floor decision and the bounded repair are now recorded in `RIGHTSPOT-022`. The exact
five-line CSS candidate is committed locally at `f0dbd99`; independent verification is pending.
`RIGHTSPOT-020` remains closed: `RS-WO-020-01R` is independently verified at `adfd37e`; the main thread jointly reviewed
`RS-WO-008-01` and `RS-WO-009-01`, accepted the bounded Favourite direction in ADR-RS-0013, deferred
the PII-sensitive Information Request direction, and registered the now-closed `RIGHTSPOT-020` as a separate
implementation Task. Its tenant and agent UI Work Orders `RS-WO-020-02` and `RS-WO-020-03` were dispatched
for disjoint parallel work and adopted into Main; their stopped candidate Worktrees were then retired
after exact-path review, leaving only Main as the current source authority. `RS-WO-020-04` passed static
verification at `c977ea4`, and `RS-WO-020-05` passed fresh-reset browser verification at `f49e1ca`.
`RIGHTSPOT-006`
stays gated on explicit external credentials and local-origin authorization. `RIGHTSPOT-010` is a later
Operations/WebMCP decision gate, while `RIGHTSPOT-012` is non-blocking read-only audit work. Only an
explicitly selected, implementation-ready Task may open code Work Orders or temporary Worktrees.

The completed [`RIGHTSPOT-001`](RIGHTSPOT-001-establish-product-thesis-and-backbone-boundary.md)
record remains discoverable by filename and is not deleted or moved.

## Task lifecycle

Use `pending -> in_progress -> verification_pending -> closed`, with a named dependency when the
next increment cannot proceed. A task record must state its bounded outcome, owner, current
evidence, non-goals, verification, next gate, and reopen condition.
