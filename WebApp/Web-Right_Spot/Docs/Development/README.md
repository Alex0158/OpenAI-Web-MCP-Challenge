# RightSpot Development and Closure

**Role:** Big-picture roadmap, implementation, verification, collaboration, and closure routing  
**Status:** Accepted local MVP closed; roadmap and thread-orchestration pilot documented; foundation, workflow-core, the
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
for separate ownership/recoverability handling.

## Purpose

This directory carries the RightSpot development roadmap and bounded implementation, verification,
and closure records without duplicating product truth, decision records, task lifecycle, or raw
command transcripts. Each implementation record should link its owning task, decision, files,
verification commands, exact results, and residual risks.

The Big Roadmap is [`RIGHTSPOT-DEVELOPMENT-ROADMAP`](RIGHTSPOT-DEVELOPMENT-ROADMAP.md). Task
lifecycle, current increment, next gate, and any active Work Orders remain in
[`Docs/Tasks/`](../Tasks/README.md); this directory must not become a second active-task register.

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

`RIGHTSPOT-015` is closed with the Operations authority integrated at `e7f30d5`. The current
implementation lanes are `RS-WO-016-01` (pure Operations projection) and `RS-WO-017-03` (tenant media
consumer). Both have preserved candidate overlays from transient execution-path deviations; neither
has a formal Builder handoff, and their exact path/hash evidence is recorded in the owning Task Files.
Candidate re-gating, persistent isolated verification, and integration are still pending. The next
verification dispatch must use a persistent supporting task/thread and a frozen source identity.
`RS-WO-019-01` is integrated and closed at `6f52686` after its bounded browser/form regression passed.
The transient execution-path incident
is process evidence and does not authorize editing or silently absorbing either candidate overlay.

The experimental delegated-work procedure is
[RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-RUNBOOK](RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-RUNBOOK.md).
It is opt-in and scoped to RightSpot; it does not change outer repository governance or sibling
applications.

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
