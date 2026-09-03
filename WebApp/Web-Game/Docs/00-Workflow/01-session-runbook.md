# Session Runbook

**Role:** Active session execution discipline
**Status:** Active
**Last updated:** 2026-09-02

## 1. Purpose and authority

This runbook defines how a working session executes Sleepless Kingdom work while preserving one
coherent development record. It refines the loop in [`README.md`](README.md); it does not replace
that loop, an owning module document, an active task, or current evidence.

It owns only execution discipline: session ownership, resume checks, increment selection, Challenge
reuse, verification selection, current-truth synchronization, Git closure, and stop conditions.

When authorities conflict, stop and reconcile the owning source. This runbook cannot weaken world
authority, identity, settlement, event ordering, the Re-entry boundary, or the human consequence
boundary.

## 2. Non-goals

This runbook does not authorize work outside the active task, deployment, publication, destructive
action, credentials, or spend. It does not require a new record for every edit, nor repeated analysis
that cannot change a decision, and it never turns a commit, a push, or a green suite into a stronger
claim than its evidence supports.

## 3. Session ownership and supporting agents

The primary session owns product, architecture, scope, risk, and closure decisions; substantive
implementation; cross-layer debugging; reconciliation of all supporting results; final verification
and evidence interpretation; and exact staging, commit, and closure claims.

A supporting agent may receive a bounded assignment for evidence gathering, adversarial review,
read-only architecture or design review, targeted test execution, result comparison, or scoped
documentation drafting.

A supporting agent must not implement core game behavior, change an architecture or scope decision,
edit a file the primary session is modifying, touch the Git index, commit, push, deploy, or claim
closure. Every mutable assignment names exact allowed paths. The primary session records repository
state before and after, inspects the diff and evidence, resolves contradictions, reruns any decisive
check that needs authoritative local control, and makes the final claim itself.

If a session discontinuity occurs, record the boundary and the resulting evidence limitation rather
than claiming uninterrupted continuity.

While an active session is running, the primary session gives a concise progress update before the
first tool call and at meaningful decision or verification boundaries. Do not leave the owner without
an update for more than 60 seconds during ongoing tool work. Each update states the current evidence,
the remaining uncertainty, and the next action; it is not a substitute for a closure record.

## 4. Resume protocol

Before selecting or continuing an increment, verify:

- the application root and this guide set;
- the Git branch, `HEAD`, upstream, and ahead/behind state of `WebMCP_Challenge`;
- tracked, untracked, and ignored state relevant to the task, including unrelated RightSpot and
  Re-entry Core work that must be preserved;
- the active `SK-TASK-*`, its single current-increment field, its checkpoint, and its next gate;
- completed checkpoints and their exact evidence; and
- current authority for edit, run, commit, and deployment.

Repository state and current evidence override stale conversational summaries. Do not restart a
completed increment, reset an in-progress change, or assume an untracked file is disposable. If the
working state and the task record disagree on a material contract, stop and reconcile first.

## 5. Coherent increment

A coherent increment is the smallest bounded vertical or contract change that advances the active
task's outcome, has explicit affected surfaces, can be verified independently at a meaningful
evidence level, leaves no known invalid authority, settlement, event, migration, or player path, can
be committed without unrelated work, and has a clear stop or reopen condition.

A coherent increment is not every edit, file, test, or internal step.

Adjacent internal stages inside one actively changing module share one **Checkpoint Closure** unless
a stage independently delivers a reviewable, committable outcome. A single event type, a partial
persistence step, or a separate description is not by itself a closure boundary.

Before implementation:

1. update the active task with one canonical current-increment field plus objective, scope,
   non-goals, evidence, risks, verification, and stop conditions;
2. reuse an existing Challenge or `ADR-GAME-*` while its assumptions hold;
3. create a new task, issue, or decision only for a genuinely distinct objective, a verified problem,
   a blocking contradiction, or a durable cross-task choice; and
4. avoid duplicate registration for work the active task already governs.

If the task's next gate is an explicit owner decision or an unaccepted authority proposal, keep the
task `pending` and stop before Red tests or implementation. Safe read-only feasibility work may refine
the Challenge, ADR, evidence map, or verification plan, but it cannot silently satisfy or bypass the
decision gate.

Historical paragraphs describe earlier increments in past tense and must not carry a competing
present-tense current-increment claim.

## 6. Implementation standard

Keep substantive implementation in the primary session. Implement one coherent vertical change
without shrinking the registered outcome. Avoid speculative abstraction, parallel workarounds,
oversized mixed-responsibility modules, and cleanup outside the increment.

For behavior-bearing increments, use the contract-first TDD loop in the
[Test and Verification Runbook](02-test-and-verification-runbook.md): write the smallest failing
contract proof before implementation, make the smallest coherent change that turns it green, then
refactor only after green while preserving behavior. The TDD loop is part of the development cycle;
it is not an optional test phase added after implementation. Documentation, visual preparation,
exploratory capability probes, and environment diagnosis use the runbook's explicit probe/evidence
exception when a manufactured failing unit test would not represent the real question.

A fallback is acceptable only when it represents an explicit product or operational state, preserves
server authority and player data, is observable and testable, and does not hide invalid state, an
authorization failure, lost cargo or events, or false success.

## 7. Verification selection

Use the [verification ladder](README.md#11-stage-8-verification-ladder) and the
[Test and Verification Runbook](02-test-and-verification-runbook.md). Select from the changed
surface, its transitive contracts, the risk, the applicable reopen triggers, and the intended closure
claim. An edit, a commit, a documentation update, or elapsed time is not independently a reason to
run the complete suite.

Cadence:

1. **Inner loop.** Run the lowest stable affected checks needed to disprove the current change,
   including its negative and failure behavior.
2. **Authority regression.** When world authority, identity, settlement, event ordering, revision,
   idempotency, visibility, or the Re-entry boundary changes, add the affected duplicate-delivery,
   stale-revision, cross-owner denial, replay, restart, race, and exactly-once cases.
3. **Increment closure.** Once affected checks are stable, run the active task's complete local gates
   once against the intended source.
4. **Checkpoint closure.** Run the gates the owning checkpoint names, including the runtime,
   capability, browser, or hosted evidence that its acceptance requires.

Before running a complete aggregate, record a short **Verification Budget**:

- affected and transitive surfaces;
- selected focused suites;
- whether the aggregate is due, and which reopen trigger invalidated earlier evidence;
- evidence that remains reusable;
- the minimum reproducer to use after a failure; and
- suites intentionally not rerun, and why.

One Checkpoint Closure normally receives one complete local aggregate. A further aggregate requires a
recorded executable reopen trigger such as a schema, shared-contract, authority, world-clock,
test-harness, or dependency change. Documentation, naming, formatting, fixture wording, elapsed time,
or additional evidence alone is not a trigger.

If a local aggregate fails, preserve the failure and return to the narrowest command that reproduces
it. Do not restart the complete aggregate after every diagnostic edit. Stabilize the affected layers
first, then rerun only when the intended claim requires it.

Record the exact commands, environment, source identity, fixtures, pass/fail/skip outcomes, what was
not run and why, the highest claim the evidence supports, and the residual risks with reopen
triggers. Skipped, gated, disabled, expected-fail, stub-only, and manual-only results are never
counted as passing evidence.

## 8. Current-truth synchronization

Before closing an increment, bind the exact verified source to every affected specification, task
status, decision, evidence record, claim limit, and next allowed state.

Rewrite current truth in place. Do not create a parallel specification, copy this runbook into a
task, or create a record without a distinct authority and maintenance need.

## 9. Git closure

The Git root is `WebMCP_Challenge`. Commit and push only when the owner or the active task grants
that authority; that authority never implies deployment or publication.

Close one coherent increment rather than committing every edit.

Before committing:

1. inspect the repository boundary, status, staged state, and the complete intended diff;
2. stage exact `WebApp/Web-Game/` paths only;
3. exclude unrelated work, secrets, caches, local state, and generated noise, and never combine
   game work with RightSpot or Re-entry Core changes in one commit;
4. run the increment's required gates;
5. synchronize current truth and evidence; and
6. write a precise English commit message.

After pushing:

1. read back the remote branch and prove it contains the exact intended commit;
2. verify ahead/behind state;
3. read back the final worktree and index state and confirm no intended change remains uncommitted;
   and
4. record the source commit, the result, the claim limit, and the residual risk.

Never use a blind pull, a force push, history rewriting, a destructive checkout, `git clean`, or
`git reset --hard` to manufacture a clean result. A diverged remote is an integration decision, not
permission to overwrite another contributor.

## 10. Decision change and scope control

An earlier decision may change when new evidence supports a materially better path. Before changing
it, restate the original objective and binding constraint, identify the new evidence and the
assumption it changes, compare retaining, minimally revising, and replacing the current path, examine
the effects on gameplay, authority, persistence, testing, and later checkpoints, update or create the
owning `ADR-GAME-*`, and obtain owner approval when authority, scope, or an accepted contract
changes.

An attractive improvement is not automatic authority to expand scope.

## 11. Stop conditions

Continue autonomously while the next action is authorized, bounded, reversible or remediable,
evidence-supported, and inside the approved plan.

Stop and request direction when the work requires new authority or a material scope expansion; a
destructive or external action; deployment, credentials, or spend not already authorized; accepting
an unresolved contradiction in authority, settlement, or event ordering; weakening the human
consequence boundary; resolving a decision-changing unknown that cannot be resolved locally; or
continuing after repeated failure has shown the current assumption or architecture is wrong.

The roadmap's stop-and-replan conditions apply in full: a change that would move authority into the
browser, put prompts or credentials into an event, silently drop cargo or events, require a second
shelter identity, depend on an unproven host sleep guarantee, or add a transport, worker, or service
without a measured need returns to the gap audit.

## 12. Closed loop

```text
Current state
-> Registration check
-> Evidence
-> Proportionate Challenge
-> Contract and test design
-> Red proof
-> Smallest coherent implementation (Green)
-> Behavior-preserving Refactor
-> Affected-surface verification
-> Required closure gates
-> Current-truth and evidence synchronization
-> Exact commit
-> Push and remote readback
-> Precise closure or reopen
-> Next registered increment
```

No later state proves an earlier gate retroactively.

## 13. Maintenance

Update this runbook only when repeated execution evidence shows that a control is missing, ambiguous,
too costly, or routinely bypassed. Keep the generic loop in [`README.md`](README.md), game behavior in
its owning module, task scope in the task record, and fresh results in
[`../Evidence/`](../Evidence/README.md).
