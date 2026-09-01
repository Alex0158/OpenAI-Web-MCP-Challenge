# RightSpot Thread Orchestration Pilot Learnings

**Role:** Non-normative evidence and learning log for the RightSpot delegated-work pilot  
**Status:** Living record; entries require main-thread review before they can affect a rule  
**Owner:** Main RightSpot thread  
**Related procedure:** [RightSpot Thread Orchestration Pilot Runbook](RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-RUNBOOK.md)  
**Last updated:** 2026-09-01, Europe/London

## 1. Purpose and authority

This document records observations, incidents, reproduced failure modes, and candidate improvements
from the experimental RightSpot thread-orchestration pilot. It preserves the reasoning behind future
workflow changes without turning every incident into an immediate rule.

This is not an instruction source, an active-task register, a product specification, or an ADR. An
unreviewed entry must not override the repository `AGENTS.md`, the RightSpot Runbook, an accepted ADR,
the current Task File, or an explicit main-thread decision. Supporting tasks receive the current
contract from those authoritative sources, not from an unreviewed learning entry.

The promotion boundary is explicit:

- a case-specific execution fact stays in its owning Task File and is linked here only when it has a
  reusable process lesson;
- a procedure change is promoted to the Pilot Runbook only after the main thread confirms its scope,
  evidence, and operational wording;
- a durable governance, architecture, ownership, or source-identity decision is promoted to an ADR
  only after deliberate review and acceptance; and
- a product or domain change is promoted to the relevant product, domain, API, or validation source
  of truth, not to this log.

No entry is promoted automatically because it is repeated, inconvenient, or suggested by a worker.

## 2. Entry lifecycle

Use the following status values:

- `Observed` — reported from an execution record but not yet reproduced;
- `Reproduced` — confirmed by a bounded repeat or independent inspection;
- `Proposed` — a candidate adjustment exists but is not an operating rule;
- `Accepted into Runbook` — the procedure was reviewed and added to the Runbook;
- `Accepted into ADR` — a durable decision was reviewed and recorded in an ADR;
- `Rejected` — the proposed adjustment was reviewed and intentionally not adopted; or
- `Deferred` — valid concern, but not worth changing the current pilot yet.

An entry may remain in this log after promotion so that the historical reasoning is not lost.

## 3. Recording format

Every new entry should state:

- stable learning ID and short title;
- status and date;
- source Task, Work Order, checkpoint, or command evidence;
- observation and impact;
- reproduction or falsifier, where available;
- candidate adjustment and its boundary;
- promotion decision and destination, if any; and
- remaining uncertainty or follow-up owner.

Do not copy a full command transcript here. Link to the Task File or evidence record and preserve
only the facts needed to understand the learning.

## 4. Recorded pilot learnings

### RS-LEARN-001 — Keep parent Tasks, Work Orders, supporting tasks, and checkpoints distinct

**Status:** `Accepted into Runbook`  
**Date:** 2026-09-01  
**Source:** `RIGHTSPOT-002` task decomposition and the first delegated implementation cycle

**Observation:** The complete MVP objective is larger than one safe worker assignment. Treating the
parent Task as a single dispatch would mix foundation, domain, persistence, API, UI, verification,
and closure responsibilities.

**Learning:** Keep one registered parent Task and one Task File for the current outcome. Express only
the next bounded Work Order at a time; use supporting tasks for execution containers; and treat
Builder, Verifier, Repairer, Integrator, and closure as sequential checkpoints rather than new
registered Tasks.

**Promotion:** The distinction is now part of the Pilot Runbook. No separate ADR is required because
this is an operating arrangement for the pilot, not a product or architecture decision.

### RS-LEARN-002 — Verify persisted Dispatch content instead of trusting the task-card preview

**Status:** `Accepted into Runbook`  
**Date:** 2026-09-01  
**Source:** Early RightSpot dispatch where the visible task card showed only a short first sentence

**Observation:** A collapsed UI preview cannot prove whether the complete activation prompt was
delivered. A prompt that is only partially persisted can omit scope, stop conditions, or acceptance
criteria while appearing to have been sent.

**Learning:** Validate the prompt once before sending, include explicit begin/end sentinels and
required sections, then inspect the persisted supporting-task input after the tool call. Do not infer
truncation or completeness from a collapsed preview.

**Promotion:** The sentinels, required-section check, and persisted-input readback are now part of
the Pilot Runbook. This remains a process control, not an ADR.

### RS-LEARN-003 — Source identity must be checkpoint-scoped and path-owned

**Status:** `Accepted into ADR`  
**Date:** 2026-09-01  
**Source:** `RS-WO-002-03` T2/T3 handoff and the original full-document Manifest comparison

**Observation:** A full-document hash lock treated expected worker writes, generated output, and
main-thread process-only documentation writeback as source failure. It confused source identity with
ownership and merge control.

**Learning:** Prefer a reviewed local Git commit as checkpoint identity; supplement it with exact
dirty/untracked path records only where Git cannot identify the source; and validate read, worker-write,
forbidden, generated, and main-thread writeback sets separately. Freeze the post-Builder source for
independent verification. Shared-file conflicts are resolved through ownership and serialization, not
through a global hash lock.

**Promotion:** Accepted as [ADR-RS-0005](../Decisions/ADR-RS-0005-checkpoint-source-identity-and-path-ownership.md)
and reflected in the Pilot Runbook. The old full-Manifest rule is historical context, not a current
validation contract.

### RS-LEARN-004 — Output-boundary failures are procedural blockers, not product defects

**Status:** `Accepted into Runbook`  
**Date:** 2026-09-01  
**Source:** `RS-WO-002-02` first independent verification attempt

**Observation:** The Verifier's health assertion created `/tmp/rightspot-health-body` outside the
declared RightSpot output boundary. The application checks were otherwise passing, but the procedure
could not claim a clean verification result.

**Learning:** Verification commands must keep generated output inside declared ignored paths under
the application. An out-of-bound artifact produces `BLOCKED` for the affected checkpoint; it does not
justify deleting an external artifact, repairing product code, or silently promoting the result to
`VERIFIED`.

**Promotion:** The output-boundary rule and the corrected rerun procedure are now part of the Pilot
Runbook and the `RIGHTSPOT-002` evidence record. No ADR is required.

### RS-LEARN-005 — Separate implementation defects from process defects, then use bounded repair

**Status:** `Accepted into Runbook`  
**Date:** 2026-09-01  
**Source:** `RS-WO-002-03` Builder, T2 review, and fresh T3 verification

**Observation:** The domain cycle exposed three different engineering facts: a test fixture omission,
a projection aliasing defect, and a stale listing-version guard defect. They required different
responses. The first was a test wiring correction; the latter two were product/domain correctness
defects. None should be confused with the separate Manifest or output-boundary process issues.

**Learning:** Classify the failure before acting. A confirmed code defect gets one narrowly diagnosed
repair inside its original ownership boundary, followed by fresh independent verification against a
new frozen source. A process defect updates the procedure or evidence record, not product code. If a
repair would change authority, public contract, data model, security, or scope, stop for a main-thread
decision instead of expanding the Repairer's mandate.

**Promotion:** The bounded Repairer and fresh-verification loop is now part of the Pilot Runbook. The
individual code defects remain recorded in the `RIGHTSPOT-002` Task File and domain tests; they are not
themselves ADR material.

### RS-LEARN-006 — Record checkpoint timing if duration is an operational metric

**Status:** `Proposed`  
**Date:** 2026-09-01  
**Source:** Review of the elapsed time for `RS-WO-002-03`

**Observation:** The Task File recorded source identities, results, and repair history but did not
record reliable dispatch, worker-start, handoff, verifier-start, or completion timestamps. Because an
existing supporting task was reused, its thread lifetime could not be used as the Work Order duration.

**Candidate adjustment:** For each checkpoint, record `T0` dispatch accepted, `T1` worker execution
started, `T2` handoff/freeze, `T3` independent verification started/completed, and any repair-cycle
timestamps. Keep these timestamps in the Task File or a linked execution record; do not infer duration
from message count, UI status, or thread creation time.

**Promotion decision:** Not yet added to the Runbook. The main thread should decide whether timing is
needed for this pilot before making it a required field.

### RS-LEARN-007 — Keep live analysis separate from product-write isolation and task identity

**Status:** `Accepted into Runbook`  
**Date:** 2026-09-01  
**Source:** `RS-WO-002-04` dispatch review, persisted supporting-task input, and the user-authorized
Side Chat process-document changes

**Observation:** The main thread and Side Chat need current repository and supporting-task context
to design the next bounded Work Order. Treating every concurrent process-document change as an
unknown product writer stopped a Builder even though the change was user-authorized and process-only.
The same checkpoint also exposed a separate error: the `RS-WO-002-04` prompt was appended to the
persisted `RS-WO-002-01` supporting thread, so the prompt content and the supporting-task identity
did not agree.

**Learning:** A Worktree is a write-isolation boundary, not an analysis-isolation boundary. The main
thread remains the live control plane and must re-check current state before a material decision. A
Side Chat may observe and analyze live state and may write only an explicitly declared auxiliary
process-only set. An unclassified change should pause the affected checkpoint while it is classified,
not automatically stop unrelated read-only analysis or isolated work. Each Work Order must have one
matching supporting-task identity; an idle old thread is not reusable merely because it is available.

**Promotion:** The live-analysis, auxiliary process-lane, checkpoint-local stop, default code
Worktree, and one-Work-Order/one-supporting-task rules are now in the Pilot Runbook sections 9.1,
9.2, and 9.4–9.6. No new ADR is required because this is pilot operating procedure, not product
architecture.

**Remaining uncertainty:** The existing `RS-WO-002-04` implementation output remains preserved but
must be reviewed and re-baselined under a dedicated supporting-task identity before independent
verification.

## 5. Review rule for future entries

At the end of a material checkpoint, the main thread should ask:

1. Was this a product/domain defect, test defect, environment/procedure defect, or governance issue?
2. Is the observation reproducible and supported by an exact source or command record?
3. Does it generalize beyond this one Task?
4. Would the proposed change alter a Runbook procedure, an accepted ADR, or only a local evidence
   record?
5. Is the change worth its maintenance and dispatch overhead?

Only after those questions are answered should an entry be promoted, rejected, or deferred.

## 6. Destination readback is part of dispatch success

**Status:** `Proposed`  
**Date:** 2026-09-01  
**Source:** Review of the `RS-WO-002-04` activation and its supporting-task destination.

**Observation:** The dispatch was treated as successful after the send operation was accepted, but
the destination was not independently read back to confirm the immutable target identity and the
complete activation payload. The message was observed in a different supporting task (`WebMCP
competitor research`) from the intended RightSpot Builder task. A human-readable thread title was not
a sufficient identity check. This made the Work Order status, source ownership, and any resulting
files ambiguous.

**Candidate adjustment:** Treat dispatch as a round-trip handoff. Before sending, record the exact
target tuple (`threadId`, `hostId`, and Work Order ID) and validate the complete prompt once. Send
the prompt exactly once, then read the destination task and verify the target identity, Work Order
ID, `RIGHTSPOT-DISPATCH-BEGIN`/`RIGHTSPOT-DISPATCH-END` markers, and the complete payload. Only after
that readback may the main thread write `ASSIGNED` or `IN_PROGRESS`. A mismatch is a procedural
`BLOCKED` result: preserve the evidence, do not treat the task's output as delivery, and do not
blindly resend.

**Promotion decision:** Proposed for promotion into the dispatch transaction rule in the Pilot
Runbook and the operating-model ADR. This entry is historical and advisory until that promotion is
explicitly accepted.

## 7. Blockers are checkpoint-local; the parent goal remains active

**Status:** `Accepted into Runbook`  
**Date:** 2026-09-01  
**Source:** Current review of the `RS-WO-002-04` identity blocker and the main-thread factory model

**Observation:** A worker can be unable to continue because of a source-identity, ownership,
environment, authority, or dependency problem while the RightSpot parent goal remains viable. Treating
that worker state as a global stop would make the main thread idle, delay useful analysis, and hide the
difference between a local checkpoint failure and a failed product objective.

**Learning:** `BLOCKED` belongs to the affected Work Order. The main thread must report the blocker
to the human owner with its evidence, impact, owner, safe continuation, and resume condition; keep the
parent `in_progress` when safe progress remains; and activate another bounded Work Order only when it
does not depend on or mutate the blocked boundary. If no safe action remains without a material human
or authority decision, use an explicit `AWAITING_DECISION` execution posture rather than inventing a
workaround or silently changing the acceptance claim.

**Promotion:** The parent-goal/checkpoint distinction, continuation gate, blocker-report contract,
and bounded worker-pool rule are now part of ADR-RS-0004 and the Pilot Runbook. This entry remains the
historical rationale; it is not an active task register.

## 8. A provenance defect does not automatically require a rebuild

**Status:** `Accepted into Runbook`  
**Date:** 2026-09-01  
**Source:** `RS-WO-002-04` wrong supporting-task identity and review of its preserved candidate output

**Observation:** The `RS-WO-002-04` prompt was delivered through a supporting task whose persisted
identity belonged to `RS-WO-002-01`. This made the dispatch provenance invalid, but the candidate files,
scope, and focused checks could still be inspected independently. Treating every provenance defect as
a code defect would discard potentially usable work and create avoidable rebuild cost.

**Learning:** Classify the defect at the correct layer. When the main thread can reconstruct the
candidate's ownership boundary, changed paths, source inputs, behavior, and focused evidence, it may
adopt the candidate for a new T2 source identity and require fresh independent verification. If any
of those facts remain ambiguous, preserve the candidate and evidence without deleting them, and use a
fresh Builder from a clean identified baseline.

**Promotion:** Candidate-adoption criteria are now part of ADR-RS-0004 and the Pilot Runbook. The
`RS-WO-002-04` candidate remains unverified until that procedure is completed.

## 9. Runtime executable and projectless-cwd identity must be explicit

**Status:** `Accepted into Runbook`  
**Date:** 2026-09-01  
**Source:** `RS-WO-002-12` and `RS-WO-002-13` independent verification dispatches

**Observation:** Both role-page Verifier dispatches exposed a different layer of the same
execution-identity gap. A projectless Verifier initially treated its Codex output directory as the
repository and stopped before verification. After the Worktree was corrected, the Tenant Verifier
still saw Node `26.5.0` from shell `PATH` even though the Worktree `.node-version` required `24.20.0`.
The Builder had succeeded only because its prompt named the prepared absolute Node/npm binaries;
the Verifier prompts named the version file but not the executable resolution.

**Learning:** A runtime pin and a task `cwd` are declarations, not proof of selection. Dispatch
identity must include the execution Worktree, package root, runtime-pin path, exact Node/npm
executables, and expected versions. Main preflight validates all of them; every worker command uses
the Worktree or package root explicitly. A projectless output directory must never be used as source
identity, and a shell-resolved alternate runtime must never be accepted as silent fallback. These
are procedure/environment failures, not product defects, and the same supporting task should be
corrected when its source identity remains intact.

**Promotion:** The Pilot Runbook now requires runtime executable resolution and explicit separation
of projectless output directories from execution Worktrees in sections 7.1 and 8.1.1. The next
dispatch prompt must include the prepared absolute binaries and the worker must prove their versions
before tests, build, HTTP, or browser checks.

**Remaining uncertainty:** The local prepared runtime path is currently verified for this machine;
future hosts may require a different absolute path. The version and executable path must therefore
be re-resolved at each dispatch rather than copied from historical records.

## 10. Tracked tooling metadata is still an ownership boundary

**Status:** `Accepted into Runbook`  
**Date:** 2026-09-01  
**Source:** `RS-WO-002-12` independent verification final readback

**Observation:** The Tenant Verifier completed the candidate's source, runtime, test, build, HTTP,
and partial UI checks, but its final Worktree readback found a tracked `.gitignore` mutation adding
`.gstack/` outside the declared nine authored paths. The mutation was not part of the candidate and
could not be safely attributed to the Verifier or removed by it. The correct result was checkpoint
`BLOCKED`, not `VERIFIED` and not a product repair.

**Learning:** The ownership boundary covers tracked repository metadata as well as product source.
Final source readback must classify every tracked mutation against the Work Order's exact path sets.
If tooling or another actor changes an undeclared tracked path, preserve the exact diff, stop the
affected checkpoint, and let the main thread resolve ownership and recoverability under the deletion
gate. Re-run the same verification only after a clean, exact-scope source identity is available; do
not restore, delete, commit, or silently absorb the mutation from the worker.

**Promotion:** The Pilot Runbook now treats undeclared tracked tooling metadata changes as ownership
violations and requires a checkpoint-local `BLOCKED` result with separate main-thread handling.

## 11. Browser evidence needs a tooling-safe execution boundary

**Status:** `Accepted into Runbook`  
**Date:** 2026-09-01  
**Source:** Two consecutive `RS-WO-002-12` verifier runs from clean candidate Worktrees

**Observation:** Both Tenant Verifier runs started with clean exact-scope Worktrees and completed
their product checks, but browser tooling added `.gstack/` to the tracked `.gitignore` before final
readback. The same mutation repeated in a newly created clean Worktree. The browser evidence also
exposed a real tenant filter/render divergence, so browser checks were valuable even though the
tooling side effect invalidated the checkpoint's final source-boundary claim.

**Learning:** Browser verification and source identity must be treated as two coupled but separable
boundaries. Before browser actions, record Git status and use a tooling-safe permitted output boundary;
if that cannot be guaranteed, preserve the source Worktree and omit browser interaction rather than
polluting the candidate or silently accepting tracked metadata. Direct HTTP and static UI checks may
continue, but their claim must not be inflated to browser E2E. A real UI finding remains separately
triageable by the main thread even when the verifier's overall result is procedurally `BLOCKED`.

**Promotion:** The Pilot Runbook now requires browser-tool isolation or an explicit unavailable-browser
claim and separates procedural metadata blockers from independently triageable product findings.

## 12. Formal code work must not fall back to transient SubAgents

**Status:** `Accepted into Runbook`  
**Date:** 2026-09-01  
**Source:** `RS-WO-016-01` and `RS-WO-017-03` Builder handoffs and the current main-checkout state

**Observation:** Recent formal Builder work was routed through a transient multi-agent execution rather
than a persistent supporting task/thread with a verified Worktree. The resulting files appeared as
uncommitted overlays in the main checkout. The candidate code may still be useful, but the execution
identity, source isolation, continuation path, and later independent handoff were not established by
the dispatch mechanism itself.

**Learning:** A formal role name does not create a formal worker identity. Builder, Verifier, Repairer,
Integrator, and formal Advisor Work Orders require a persistent supporting task/thread and an explicitly
verified source boundary. A transient `SubAgent` is suitable only for short, read-only auxiliary work
that has no source ownership or closure claim. If it writes source, stop the writer, preserve the exact
overlay, classify the process defect separately from any product defect, and re-gate the candidate
through a new frozen T2 identity and an independent persistent Verifier or use a fresh Builder.

**Promotion:** The Pilot Runbook now defines the formal-channel rule, dispatch preflight, and
main-checkout overlay recovery procedure in sections 3.2, 6.5, 8.1.6, 8.2, and 9.1. This is a
RightSpot pilot operating rule; it does not change product authority or the outer repository process.

**Remaining uncertainty:** The host may expose multiple execution mechanisms with similar role labels
or summaries. The main thread must verify the returned task/thread identity and actual execution root
at every formal dispatch rather than relying on the selected tool name or prompt wording.
