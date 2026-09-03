# RightSpot Development and Closure

**Role:** Big-picture roadmap, implementation, verification, collaboration, and closure routing  
**Status:** Accepted local MVP closed; roadmap and thread-orchestration pilot documented; the continuous
cross-layer audit closed `RIGHTSPOT-023` for a bounded signed-out session-read repair after Main Builder
and read-only independent verification. It also closed `RIGHTSPOT-024` for a separate local-dev
loopback-origin gap after config-only verification. The audit registered `RIGHTSPOT-025` for the
`F-01` agent-draft privacy defect; its authoritative read-boundary TDD repair, full checks, live
smoke, and formal persistent read-only verification are complete. The next rendered-page audit
registered `RIGHTSPOT-026` for a bounded P2 listing-detail request-status notice copy defect; its
presentation-only Red→Green repair, full checks, live browser evidence, and independent persistent
verification are complete and the Task is closed. The following tenant request-surface audit
registered `RIGHTSPOT-027` for a separate P2 terminal-response presentation defect; its single
presentation-only Work Order passed independent verification after persistent Builder task
`01a060bf-17c7-7c32-96ad-2ea1aa028ebf` completed it and Verifier task
`01a060a8-6f2d-7141-98d0-385483a9104f` confirmed the frozen candidate. No implementation Worktree is
active. Foundation,
workflow-core, the
`RS-WO-002-04` persistence/application boundary, the `RS-WO-002-05` tenant entry/listing discovery
API, and the `RS-WO-002-07` workflow HTTP/DTO boundary are independently verified; `RS-WO-002-06`
returned `READY_FOR_REVIEW` and its accepted decomposition is recorded in ADR-RS-0008;
`RS-WO-002-07` is integrated at product commit `f700ba9`; `RS-WO-002-08` is integrated at product
commit `006d2fd` after process re-baseline commit `8b77bdd`; `RS-WO-002-09` is integrated as bounded
UI guidance. `RS-WO-002-10` returned `READY_FOR_REVIEW` and its decomposition was accepted;
`RS-WO-002-11` candidate `f1f83c7` passed independent verification and is integrated at product commit
`6a0b4b8` as the shared role-page frame; `RS-WO-002-13` passed independent verification and is
integrated at product commit `3765747`; repaired `RS-WO-002-12` candidate `52cba87c` passed final
independent verification and is integrated at product commit `9348aa5`; `RS-WO-002-14` passed direct
cross-role verification and `RS-WO-002-15` passed the isolated browser walkthrough. The durable closure
record is [`RIGHTSPOT-MVP-CLOSURE-RECORD.md`](RIGHTSPOT-MVP-CLOSURE-RECORD.md). Its predecessor verifier runs were
checkpoint-locally blocked by an out-of-scope tracked verifier Worktree mutation, which remains preserved
for separate ownership/recoverability handling; the physical verifier Worktree is no longer present.

The latest listing-detail partial-read audit reproduced `F-17`; `RIGHTSPOT-039` / `RS-WO-039-01` is
closed within its Main-owned tenant UI-consumer boundary after focused TDD, the complete `156/156`
suite, foundation, typecheck, build, repository validation, and fresh browser failure/recovery
verification. The continuation then reproduced `F-18`: a controlled catalogue-read failure exposed
raw server-controlled text in the tenant Discovery page beside the bounded error copy.
`RIGHTSPOT-040` / `RS-WO-040-01` is now `CLOSED_VERIFIED` within the Main-owned serial Discovery
consumer boundary after focused TDD, the complete `158/158` suite across 39 test files, full static
checks, and fresh browser failure/recovery evidence. A clean generation-66 tenant-to-Agent replay
completed the primary confirmation chain and role/terminal boundaries without a new finding; `F-08`
remains an evidence gap and the disposable fixture was reset to generation `67` with healthy local
health.

The subsequent Tenant Discovery Search review registered `F-21` / `RIGHTSPOT-042` as a P1 contract
decision. At that checkpoint, the existing four filters and tenant-safe listing read remained
operational, but the Area control used an unseeded `Shoreditch` example and did not disclose the exact
Area rule. Main later accepted ADR-RS-0015 for the ordinary UI/API and first read-only WebMCP Search
contract, reconciled the core documents, and registered `RIGHTSPOT-043` for implementation. The
ordinary Search and amended page-bound adapter source are now integrated at product commits `534f5c9`
and `ec7a679`; the bounded supported-browser WebMCP registration/invocation gate is independently
verified and recorded in `RIGHTSPOT-043`. `RIGHTSPOT-010` is closed as a reviewed staged Agent
Operations decision through `ADR-RS-0016`; `RIGHTSPOT-044` is `CLOSED_VERIFIED` for the bounded
manual Operations surface. The post-044 audit registered `F-22` / `RIGHTSPOT-045` as a bounded
consumer latest-read repair; its UI Builder Work Order is integrated at `3582ba4` and the Task is now
`CLOSED_VERIFIED` after Main-controlled race evidence, with the independent browser-helper limitation
explicitly recorded. Later Operations WebMCP remains separately gated.

**Current physical workspace:** The canonical Main Worktree remains the only source authority. The stopped,
short-lived `RS-WO-020-02` and `RS-WO-020-03` candidate Worktrees were adopted into Main and retired after
exact-path review; their historical snapshots remain in the owning Task Files and named local-only archive
refs as evidence/recovery records. No candidate Worktree is an active source or writer.

## Purpose

This directory carries the RightSpot development roadmap and bounded implementation, verification,
and closure records without duplicating product truth, decision records, task lifecycle, or raw
command transcripts. Each implementation record should link its owning task, decision, files,
verification commands, exact results, and residual risks.

The Big Roadmap is [`RIGHTSPOT-DEVELOPMENT-ROADMAP`](RIGHTSPOT-DEVELOPMENT-ROADMAP.md). The staged
WebMCP integration roadmap is [`RIGHTSPOT-WEBMCP-ROADMAP`](RIGHTSPOT-WEBMCP-ROADMAP.md); it is a
planning and gate document, not an implementation queue. Task
lifecycle, current increment, next gate, and any active Work Orders remain in
[`Docs/Tasks/`](../Tasks/README.md); this directory must not become a second active-task register.
The canonical user-facing business chains, transition rules, route map, acceptance gates, and
current coverage are in [`Docs/07-business-flows-and-scenarios.md`](../07-business-flows-and-scenarios.md).
Development records may record evidence against those scenarios, but must not create a competing
flow definition.

The latest Main-thread audit record is
[`RIGHTSPOT-CROSS-LAYER-AUDIT-2026-09-02.md`](RIGHTSPOT-CROSS-LAYER-AUDIT-2026-09-02.md). It records
the closed bounded findings through `F-19`, the non-gating `F-20` typography polish, the newly registered `F-21` Search contract gap, and the separate un-reproduced asynchronous-read evidence gap,
and the latest cross-layer/Favourite/Discovery failure replay. The latest audit registered and closed
`F-19` / `RIGHTSPOT-041` after reproducing lost tenant draft-save and explicit-submit success feedback
during version-keyed editor rehydration; its single Main-owned Work Order is now closed after parent-owned
feedback repair, focused TDD, full checks, and isolated browser verification.
`RIGHTSPOT-012` remains the authoritative continuous audit lane; registered implementation Tasks remain
the authoritative route for any follow-on repair.

## Accepted MVP state

RightSpot now has an accepted internal MVP scope, business-rules baseline, logical Backbone
baseline, implementation-stack decision, and a bounded foundation implementation. The Builder
returned `READY_FOR_VERIFICATION`; the first independent Verifier checkpoint recorded in
[RIGHTSPOT-002](../Tasks/RIGHTSPOT-002-build-mvp-application-shell.md) completed the functional
checks but returned `BLOCKED` after its procedure created an out-of-bound OS temp artifact. A
corrected rerun of the same checkpoint returned `VERIFIED`; Git closure is recorded in `b06bd85`,
and the bounded workflow-core Builder plus one projection-isolation repair for `RS-WO-002-03` returned
`READY_FOR_VERIFICATION`. Its T2 source was frozen at `a60001e`; the independent Verifier found that
stale listing revisions were not rejected by both draft-update and submit commands, so the current
checkpoint was a bounded Repairer on the domain workflow and focused test paths; its post-repair
commit is `6e70c9f`, and the fresh independent Verifier returned `VERIFIED` against that frozen source.
The main-thread candidate-adoption review for `RS-WO-002-04` is complete and the reconstructed
three-path candidate is committed at T2 source `68bbc69`. Its first dedicated read-only Verifier
attempt stopped before source checks because the prompt described the Worktree root incorrectly; a
corrected follow-up to the same identity-matching Verifier then returned `VERIFIED` against frozen
source `28105e4d`. The `RS-WO-002-05` Builder returned `READY_FOR_VERIFICATION`; the exact 14-path
candidate is frozen at T2 code commit `de169ce` and its dedicated independent Verifier returned
`VERIFIED` against clean snapshot `bc3bc42`. The read-only planning slice `RS-WO-002-06` returned
`READY_FOR_REVIEW`; the main thread accepted its contract-based decomposition with revisions and
recorded the ordinary workflow HTTP/DTO contract in ADR-RS-0008. Only the three current slices
`RS-WO-002-07` (workflow transport), `RS-WO-002-08` (shared shell), and `RS-WO-002-09` (UI/UX review)
are admitted from reviewed baseline `c758634`; `RS-WO-002-07` passed dedicated independent
verification at frozen `d71fe3e` and is integrated at product commit `f700ba9`; `RS-WO-002-08` passed
dedicated independent verification after a generated-output boundary re-baseline in process commit
`8b77bdd` and is integrated at product commit `006d2fd`; the reviewer output is integrated as guidance.
`RS-WO-002-11` Builder returned `READY_FOR_VERIFICATION`; the exact four-path candidate `f1f83c7` passed
dedicated independent verification and is integrated at product commit `6a0b4b8`. `RS-WO-002-13` is
integrated at product commit `3765747`; repaired `RS-WO-002-12` candidate `52cba87c` passed final
independent verification and is integrated at product commit `9348aa5`; `RS-WO-002-14` passed direct
read-only combined cross-role verification against the integrated source and `RS-WO-002-15` passed the
isolated browser walkthrough from a fresh database. The parent is closed for the accepted local MVP. A
fresh Builder is needed only if a later checkpoint exposes a
source or behavior gap that cannot be repaired within a separately bounded Work Order. Later
Integrator work is opened only when its predecessor produces a concrete code failure or a verified
source and evidence boundary.

Current gate note: `RS-WO-002-14` and `RS-WO-002-15` passed direct and browser verification respectively;
the closure evidence is recorded in [`RIGHTSPOT-MVP-CLOSURE-RECORD.md`](RIGHTSPOT-MVP-CLOSURE-RECORD.md),
and `RIGHTSPOT-002` is closed for the accepted local MVP.

## Current post-MVP state

`RIGHTSPOT-015` is closed with the Operations authority integrated at `e7f30d5`. `RS-WO-016-01` is
closed after its bounded repair passed fresh independent verification and was integrated at `edd7575`.
`RS-WO-017-03` is closed after independent verification and integration at `2a53917`, followed by the
verified integrated browser gate `RS-WO-017-04`. The earlier transient overlays and failed 016 candidate
remain process evidence in the owning Task Files and named local-only archive refs; their physical
Worktrees have been removed. No active implementation lane remains in this closure increment.
`RS-WO-019-01` is integrated and closed at `6f52686` after its bounded browser/form regression passed.
The transient execution-path incident
is process evidence and does not authorize editing or silently absorbing either candidate overlay.

The experimental delegated-work procedure is
[RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-RUNBOOK](RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-RUNBOOK.md).
It is opt-in and scoped to RightSpot; it does not change outer repository governance or sibling
applications.

The current post-MVP route completed the fresh-reset browser verification gate for the bounded Favourite increment: the main
thread jointly reviewed `RS-WO-008-01` and `RS-WO-009-01`, accepted the Favourite boundary in
ADR-RS-0013, deferred the PII-sensitive Information Request boundary, and registered `RIGHTSPOT-020`.
Its initial serial contract/data Work Order `RS-WO-020-01` was independently verified and the follow-up
`RS-WO-020-01R` repair was independently verified at `adfd37e` after a pre-UI review found that a removed
relation version could not be recovered after reload. The tenant and agent UI Work Orders `RS-WO-020-02`
and `RS-WO-020-03` were dispatched on disjoint paths, adopted into Main at product commit `c29e80d`,
and passed dependency-complete typecheck, full-suite `121/121`, and production-build checks; `RS-WO-020-04`
independently verified Main `c977ea4`, and `RS-WO-020-05` passed fresh-reset browser verification against
Main `f49e1ca`. `RIGHTSPOT-020` is closed within its accepted local boundary.
`RIGHTSPOT-006` remains credential-gated. `RIGHTSPOT-010` is now closed as a reviewed staged
Operations decision through `ADR-RS-0016`; its existing authority and pure projection are complete,
and `RIGHTSPOT-044` is `CLOSED_VERIFIED` for the bounded manual read surface. `RIGHTSPOT-045` is
`CLOSED_VERIFIED` within its bounded manual Operations consumer latest-read boundary, while Operations
WebMCP remains separately gated.
`RIGHTSPOT-012` is a non-blocking
read-only audit lane, and `RIGHTSPOT-046` is closed through accepted `ADR-RS-0017` for one bounded
Agent Operations `read_listing_pipeline` WebMCP capability; its separate implementation Task and
browser evidence gate remain pending. The `F-01` queue/privacy defect is closed within `RIGHTSPOT-025`; `RIGHTSPOT-026`
is also closed within its presentation-only boundary. `RIGHTSPOT-027` is closed after its bounded
presentation repair and independent verification; no implementation Worktree is active. The next step
is to register and prepare the separate implementation route for `RIGHTSPOT-046` while the fresh
Main-thread cross-layer audit continues; source dispatch remains gated by the recaptured baseline,
exact write set, and browser capability check.
The authoritative sequence is maintained in the [development roadmap](RIGHTSPOT-DEVELOPMENT-ROADMAP.md#31-current-next-route).

## Closure record requirements

A RightSpot implementation record must identify:

- the accepted product and architecture decision;
- exact changed paths inside the RightSpot folder;
- the runtime and dependency surface;
- focused and aggregate verification;
- deterministic fixture/reset behavior;
- role/privacy and stale-state coverage;
- any later WebMCP or Cloud Receiver evidence separately; and
- residual non-claims and reopen conditions.

Do not copy the outer Re-entry Core's test counts or platform evidence into a RightSpot record.
