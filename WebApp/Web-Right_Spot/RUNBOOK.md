# RightSpot Development Runbook

**Role:** Local development and documentation routing  
**Status:** Accepted local MVP closed; implementation stack accepted; the exact target Node runtime is prepared and verified,
the foundation Builder returned `READY_FOR_VERIFICATION`, the first independent Verifier attempt was
procedurally blocked, and the corrected rerun returned `VERIFIED`; the bounded domain-core Builder and
projection-isolation repair returned `READY_FOR_VERIFICATION`, with T2 source commit `a60001e` frozen;
independent verification found a bounded listing-version guard defect; the bounded Repairer completed
in `6e70c9f`, and fresh independent verification returned `VERIFIED`; `RS-WO-002-04` candidate adoption
completed at T2 commit `68bbc69`; after one procedural Worktree-path correction, the dedicated
independent Verifier returned `VERIFIED` against frozen source `28105e4d`; the `RS-WO-002-05` tenant
entry/listing discovery API candidate `de169ce` was independently verified from canonical snapshot
`bc3bc42`; `RS-WO-002-06` returned `READY_FOR_REVIEW` and its accepted decomposition is recorded in
ADR-RS-0008; `RS-WO-002-07` workflow transport is independently verified at `d71fe3e` and integrated
at product commit `f700ba9`; `RS-WO-002-08` is integrated at product commit `006d2fd` after a
localized generated-output boundary incident was re-baselined in process commit `8b77bdd`; and
`RS-WO-002-09` is integrated as bounded UI guidance; `RS-WO-002-13` passed dedicated independent
verification and is integrated at product commit `3765747`; repaired `RS-WO-002-12` candidate
`52cba87c` passed final independent verification and is integrated at product commit `9348aa5`. The
original out-of-scope tracked `.gitignore` mutations from verifier Worktrees remain preserved as
procedure evidence. `RS-WO-002-14` passed direct read-only combined role-page verification and the
main-thread `RS-WO-002-15` isolated browser walkthrough passed against the same integrated source.
The closure evidence is recorded in
[`Docs/Development/RIGHTSPOT-MVP-CLOSURE-RECORD.md`](Docs/Development/RIGHTSPOT-MVP-CLOSURE-RECORD.md);
no active local-MVP gate remains. The current post-MVP `RS-WO-005-01` candidate passed corrected
independent verification and is under main-thread integration/Git closure review; its first verifier
attempt's preserved `.gitignore` tooling mutation remains procedure evidence. `RS-WO-007-01` is an
accepted read-only UI decomposition and `RS-WO-007-02` is gated; no visual Builder has been dispatched.

## 1. Authority and reading order

RightSpot inherits the repository's engineering and safety rules. Read these in order:

1. [`../../AGENTS.md`](../../AGENTS.md) — tracked repository authority;
2. [`../../../AGENTS.md`](../../../AGENTS.md) — workspace routing defaults;
3. [`README.md`](README.md) — RightSpot scope and boundary;
4. [`Docs/00-current-status.md`](Docs/00-current-status.md) — current product truth;
5. the relevant product, requirement, domain, system, decision, task, or validation document; and
6. the owning code, tests, and development record once implementation exists.

The accepted implementation choice is recorded in
[`Docs/Decisions/ADR-RS-0003-implementation-stack-and-realtime-boundary.md`](Docs/Decisions/ADR-RS-0003-implementation-stack-and-realtime-boundary.md).
The optional delegated-work procedure is recorded in
[`Docs/Development/RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-RUNBOOK.md`](Docs/Development/RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-RUNBOOK.md)
and governed by
[`Docs/Decisions/ADR-RS-0004-thread-orchestration-pilot.md`](Docs/Decisions/ADR-RS-0004-thread-orchestration-pilot.md).
The local durable workflow/application boundary is governed by
[`Docs/Decisions/ADR-RS-0006-durable-workflow-and-application-boundary.md`](Docs/Decisions/ADR-RS-0006-durable-workflow-and-application-boundary.md).

RightSpot documents define the child application's product and architecture truth. The outer
repository remains authoritative for shared engineering rules, Hackathon constraints, the
application-selection gate, and the reusable Re-entry Core.

The RightSpot Development directory carries the Big Roadmap plus implementation, verification,
and closure records. The RightSpot Tasks directory carries registered task lifecycle, current
increment, next gate, and active Work Orders under its parent when their dependency chains permit
parallel execution. One registered Task has one Task File; Builder, Verifier, Repairer, and
Integrator are sequential checkpoints within each bounded outcome rather than additional registered
Tasks. Do not create a second active-task register in Development or use parallel Work Orders as a
speculative queue.

## 2. Brainstorm workflow

The main thread is the working input for product discovery. During brainstorming:

- capture ideas, alternatives, assumptions, objections, and discarded directions in conversation;
- do not treat an idea as a requirement merely because it was mentioned;
- promote only stable conclusions into `Docs/00-current-status.md` or a named core document;
- create a decision record when a choice changes product scope, domain authority, data ownership,
  security, integration, or implementation direction; and
- update the affected docs before claiming that a decision is implemented.

## 3. Implementation workflow

For each bounded increment:

1. confirm the current status and exact file scope;
2. identify the relevant RightSpot document and its open decision;
3. define the smallest reversible implementation;
4. keep the change inside this folder unless an explicit integration decision authorizes otherwise;
5. run the smallest meaningful focused verification, then the required transitive checks;
6. reconcile docs, code, tests, and evidence; and
7. review the exact Git diff and claim boundary before closure.

The accepted framework, first server-only SQLite foundation profile, and deferred realtime boundary
are recorded in ADR-RS-0003. The current foundation Work Order and its exact command contract are
recorded in [`RIGHTSPOT-002`](Docs/Tasks/RIGHTSPOT-002-build-mvp-application-shell.md). No Cloud
Receiver, WebMCP, Redis, or WebRTC media/signaling integration is assumed for the first
implementation. Deployment, concrete session storage, and ordinary transport must still be
recorded when they become real decisions.

For delegated work, apply the RightSpot Thread Orchestration Pilot Runbook in addition to this
local procedure. The pilot is opt-in, does not replace the repository Engineering controls, and
does not authorize a worker to change canonical authority or Git closure state.

## 4. Scope and safety gates

- Do not modify the outer Core or frozen MVP to make RightSpot easier to build.
- Do not add real tenant identity documents, payment details, lease commitments, or live property
  data to the challenge slice.
- Keep the first scenario deterministic, synthetic, resettable, and limited to one request.
- Keep tenant and agent projections separate; internal agent notes must never cross the role boundary.
- Keep human consequential decisions visible in the normal application UI.
- Never claim Cloud Receiver, WebMCP, Agent activation, deployment, or judge reproducibility from
  ordinary local application tests.

## 5. Verification routing

The foundation verification commands are defined in the `RS-WO-002-01` acceptance contract and are
re-run by `RS-WO-002-02`. The corrected independent Verifier rerun reproduced them against the
frozen source and runtime identity without violating the output boundary. This is foundation evidence
only; a future implementation record must name the exact runtime, commands, test counts, fixtures,
and residual risks rather than copying the outer Core's verification claims.

### 5.1 Verification output boundary

The Verifier is read-only with respect to authored source and may create generated runtime output
only under the explicitly permitted ignored paths inside `WebApp/Web-Right_Spot`. Assertions that
need a response body should use shell variables or an exact isolated file under `var/test/`; they
must not write to `/tmp`, the user's home directory, or another path outside the RightSpot folder.
An out-of-bound artifact is a procedural `BLOCKED` result even when the product checks pass. The
Verifier must not delete an external or pre-existing artifact merely to make the report green; the
main thread records it and applies the repository deletion gate separately.
