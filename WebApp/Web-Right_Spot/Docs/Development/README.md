# RightSpot Development and Closure

**Role:** Big-picture roadmap, implementation, verification, collaboration, and closure routing  
**Status:** Roadmap and thread-orchestration pilot documented; foundation, workflow-core, the
`RS-WO-002-04` persistence/application boundary, and the `RS-WO-002-05` tenant entry/listing
discovery API are independently verified; `RS-WO-002-06` returned `READY_FOR_REVIEW` and its accepted
decomposition is recorded in ADR-RS-0008; `RS-WO-002-07`, `RS-WO-002-08`, and `RS-WO-002-09` are the
current assigned slices from reviewed baseline `c758634`
`RS-WO-002-08` was re-baselined and resumed in process commit `8b77bdd` after a localized
generated-output boundary incident; `RS-WO-002-09` is integrated as bounded UI guidance.

## Purpose

This directory carries the RightSpot development roadmap and bounded implementation, verification,
and closure records without duplicating product truth, decision records, task lifecycle, or raw
command transcripts. Each implementation record should link its owning task, decision, files,
verification commands, exact results, and residual risks.

The Big Roadmap is [`RIGHTSPOT-DEVELOPMENT-ROADMAP`](RIGHTSPOT-DEVELOPMENT-ROADMAP.md). Task
lifecycle, current increment, next gate, and any active Work Orders remain in
[`Docs/Tasks/`](../Tasks/README.md); this directory must not become a second active-task register.

## Current state

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
are admitted from reviewed baseline `c758634`; `RS-WO-002-08` briefly returned `BLOCKED` on a
generated-output boundary incident and resumed from process re-baseline commit `8b77bdd`; the
reviewer output is integrated as guidance. Tenant
and agent role-page Builders remain gated until the transport and shell
outputs are frozen and reviewed. A fresh Builder is needed only if a later checkpoint exposes a
source or behavior gap that cannot be repaired within a separately bounded Work Order. Later
Integrator work is opened only when its predecessor produces a concrete code failure or a verified
source and evidence boundary.

The experimental delegated-work procedure is
[RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-RUNBOOK](RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-RUNBOOK.md).
It is opt-in and scoped to RightSpot; it does not change outer repository governance or sibling
applications.

## Future closure requirements

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
