# RightSpot Development Runbook

**Role:** Local development and documentation routing  
**Status:** Accepted local MVP closed; the delegated-work pilot remains experimental and opt-in.
The continuous cross-layer audit closed `RIGHTSPOT-023` for the signed-out session-read defect `F-02`
and `RIGHTSPOT-024` for the local-dev loopback-origin defect `F-03`, each after bounded TDD,
independent verification, browser evidence, and documentation closure. The registered `RIGHTSPOT-025`
route for the `F-01` agent-draft privacy defect is now `CLOSED_VERIFIED` after its authoritative
read-boundary TDD repair, full checks, live smoke, formal persistent read-only verification, and
documentation reconciliation. The next rendered-page audit registered `RIGHTSPOT-026` for a bounded
P2 listing-detail request-status notice copy defect. Its presentation-only Red→Green repair, full
checks, live browser evidence, independent persistent verification, and documentation reconciliation
are now `CLOSED_VERIFIED`. The subsequent tenant request-surface audit registered `RIGHTSPOT-027` for
a separate P2 terminal-response presentation defect; its single presentation-only Work Order was
implemented by persistent Builder task `01a060bf-17c7-7c32-96ad-2ea1aa028ebf` and independently verified
by `01a060a8-6f2d-7141-98d0-385483a9104f`; no implementation Worktree is active.
The 2026-09-02 Main-thread audit registered and closed `RIGHTSPOT-029` after confirming that the
default `npm test` command ran only the six foundation tests although the authored suite contains 28
test files and passes 133 tests through the complete command. `npm test` is now the complete RightSpot
test command. The audit's un-reproduced asynchronous-read concern remains evidence-only and does not
authorize a speculative UI repair.
Current post-MVP state is maintained in [`Docs/00-current-status.md`](Docs/00-current-status.md) and
[`Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md`](Docs/Development/RIGHTSPOT-DEVELOPMENT-ROADMAP.md),
not in this routing document. As of 2026-09-02, `RIGHTSPOT-015` is closed at product commit `e7f30d5`;
`RS-WO-016-01` is independently verified and integrated at `edd7575`; `RS-WO-017-03` is independently
verified and integrated at `2a53917`, with its integrated browser gate `RS-WO-017-04` also verified; and
`RS-WO-019-01` is integrated at `6f52686` with its bounded browser/form evidence complete and is closed.
The earlier 016/017 transient overlays and failed candidate remain process-incident evidence only; they
must not be edited, staged, committed, or used as current source. Their physical Worktrees have been
removed; the historical evidence is retained in the owning Task Files and named local-only archive refs.

**Current physical workspace:** `git worktree list --porcelain` currently reports only the canonical
Main Worktree at `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge` on `main`. Worktree removal does not
remove Codex task records or branch refs. Re-run the command before relying on this snapshot for a new
dispatch or cleanup decision.

Temporary Worktree lifecycle is checkpoint-scoped: after a bounded output passes its required gate
and is integrated into Main, retire the exact extra checkout promptly; do not retain it until the
parent Task closes. Unresolved, dirty, rejected, or dependency-bearing checkouts remain protected
under the [pilot Runbook](Docs/Development/RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-RUNBOOK.md).

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

For a defect or behavior repair, the focused verification starts with a real failing regression test
(Red), proceeds through the smallest correct implementation (Green), and permits only behavior-
preserving cleanup afterward (Refactor). A passing test does not by itself prove integration or
browser behavior.

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
and residual risks rather than copying the outer Core's verification claims. For current RightSpot
verification, `npm test` is intended to be the complete authored test suite, while
`npm run test:foundation` is the narrow six-test foundation check; `RIGHTSPOT-029` closed the package
script repair and current-document reconciliation for this contract.

### 5.1 Verification output boundary

The Verifier is read-only with respect to authored source and may create generated runtime output
only under the explicitly permitted ignored paths inside `WebApp/Web-Right_Spot`. Assertions that
need a response body should use shell variables or an exact isolated file under `var/test/`; they
must not write to `/tmp`, the user's home directory, or another path outside the RightSpot folder.
An out-of-bound artifact is a procedural `BLOCKED` result even when the product checks pass. The
Verifier must not delete an external or pre-existing artifact merely to make the report green; the
main thread records it and applies the repository deletion gate separately.
